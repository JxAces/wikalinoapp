import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import ts from "typescript";
import { AnimationMixer, Group, Matrix4, PerspectiveCamera, ShaderLib, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Exercise the production helper against the bundled assets without Expo.
const source = fs.readFileSync(new URL("../components/story-world/compatible-skinning.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText.replace(/from "three"/g, `from ${JSON.stringify(new URL("../node_modules/three/build/three.module.js", import.meta.url).href)}`);
const { prepareCompatibleSkinning } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

for (const name of ["indigenous", "muslim", "batang-pinoy"]) {
  const bytes = fs.readFileSync(new URL(`../assets/models/wikalino-${name}-explorer.glb`, import.meta.url));
  const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "");
  const originalMeshes = [];
  gltf.scene.traverse(object => { if (object.isSkinnedMesh) originalMeshes.push(object); });
  assert(originalMeshes.length);
  assert.equal(prepareCompatibleSkinning(gltf.scene, true), null, "WebGL2 keeps GPU skinning");
  assert(originalMeshes.every(mesh => mesh.layers.mask === 1));
  // Reproduce the map's normalized scale, offset, parent movement and rotation.
  const parent = new Group();
  parent.add(gltf.scene);
  gltf.scene.scale.setScalar(1.37);
  gltf.scene.position.set(-0.08, 0.015, 0.11);
  const camera = new PerspectiveCamera();
  const fallback = prepareCompatibleSkinning(gltf.scene, false);
  assert(fallback);
  const pairs = originalMeshes.map(mesh => {
    const display = mesh.parent.children.find(child => child.name === `${mesh.name}-webgl1-display`);
    assert(display && !display.isSkinnedMesh);
    assert.equal(display.material, mesh.material, "Original attire material is preserved");
    assert.deepEqual(display.geometry.attributes.color.array, mesh.geometry.attributes.color.array);
    assert.deepEqual(display.geometry.index.array, mesh.geometry.index.array);
    assert(!display.geometry.hasAttribute("skinIndex"));
    assert(!display.geometry.hasAttribute("skinWeight"));
    return [mesh, display];
  });
  const mixer = new AnimationMixer(gltf.scene);
  const clip = gltf.animations.find(animation => animation.name === "Walk");
  const action = mixer.clipAction(clip).play();
  const expected = new Vector3(), actual = new Vector3(), base = new Vector3();
  const skin = new Matrix4(), offset = new Matrix4(), weighted = new Matrix4();
  let worstError = 0;
  for (let frame = 0; frame <= 16; frame++) {
    parent.position.set(frame * 0.09, 0, -frame * 0.035);
    parent.rotation.y = frame * 0.13;
    mixer.setTime(clip.duration * frame / 16);
    fallback.update();
    parent.updateMatrixWorld(true);
    gltf.scene.traverseVisible(object => {
      if (object.isMesh && object.layers.test(camera.layers)) {
        assert(!object.isSkinnedMesh, "WebGL1 must never submit a skinned mesh to the renderer");
      }
    });
    for (const [mesh, display] of pairs) {
      assert.deepEqual(display.matrixWorld.elements, mesh.matrixWorld.elements);
      const positions = display.geometry.attributes.position;
      const normals = display.geometry.attributes.normal;
      for (let vertex = 0; vertex < positions.count; vertex++) {
        mesh.getVertexPosition(vertex, expected);
        actual.fromBufferAttribute(positions, vertex);
        worstError = Math.max(worstError, actual.distanceTo(expected));
        assert(actual.distanceTo(expected) < 0.000002, `${name}: vertex ${vertex} diverges from skeletal animation`);
        // Independent oracle from Three's skinnormal_vertex shader.
        if (vertex % 29 === 0 && normals) {
          weighted.elements.fill(0);
          for (let influence = 0; influence < 4; influence++) {
            const weight = mesh.geometry.attributes.skinWeight.getComponent(vertex, influence);
            const bone = mesh.geometry.attributes.skinIndex.getComponent(vertex, influence);
            offset.multiplyMatrices(mesh.skeleton.bones[bone].matrixWorld, mesh.skeleton.boneInverses[bone]);
            for (let j = 0; j < 16; j++) weighted.elements[j] += offset.elements[j] * weight;
          }
          skin.multiplyMatrices(mesh.bindMatrixInverse, weighted).multiply(mesh.bindMatrix);
          expected.fromBufferAttribute(mesh.geometry.attributes.normal, vertex).transformDirection(skin);
          actual.fromBufferAttribute(normals, vertex);
          assert(actual.distanceTo(expected) < 0.000002, `${name}: incorrect deformed normal`);
        }
      }
      const version = positions.version;
      fallback.update();
      assert.equal(positions.version, version, "Unchanged poses do not upload vertices again");
    }
  }
  action.setEffectiveWeight(0);
  mixer.update(0);
  fallback.update();
  for (const [mesh, display] of pairs) {
    for (let vertex = 0; vertex < mesh.geometry.attributes.position.count; vertex += 17) {
      actual.fromBufferAttribute(display.geometry.attributes.position, vertex);
      base.fromBufferAttribute(mesh.geometry.attributes.position, vertex);
      assert(actual.distanceTo(base) < 0.000002, "Stopping restores the idle pose without drift");
    }
  }
  let releases = 0;
  pairs.forEach(([, display]) => display.geometry.addEventListener("dispose", () => releases++));
  fallback.dispose();
  fallback.dispose();
  fallback.update();
  assert.equal(releases, pairs.length, "Dynamic geometry disposed exactly once");
  assert(originalMeshes.every(mesh => mesh.layers.mask === 1));
  assert(pairs.every(([, display]) => !display.parent));
  // Switching back to the character must still work with the original mesh.
  const again = prepareCompatibleSkinning(gltf.scene, false);
  again.update(); again.dispose();
  console.log(`${name}: WebGL1-safe drawables, matching walk/idle and normals, colors preserved, cleanup verified (max error ${worstError.toExponential(2)})`);

  const gpu = prepareCompatibleSkinning(gltf.scene, false, 128);
  assert.equal(gpu.mode, "uniform", "Small rigs use WebGL1 matrix uniforms");
  const gpuPairs = originalMeshes.map(mesh => {
    const display = mesh.parent.children.find(child => child.name === `${mesh.name}-webgl1-uniform-display`);
    assert(display && !display.isSkinnedMesh);
    assert.equal(display.geometry, mesh.geometry, "No duplicate vertex buffers");
    const material = Array.isArray(display.material) ? display.material[0] : display.material;
    const shader = { vertexShader: ShaderLib.standard.vertexShader, uniforms: {} };
    material.onBeforeCompile(shader);
    assert(!shader.vertexShader.includes("#include <skinning_pars_vertex>"));
    assert(!shader.vertexShader.includes("textureSize"));
    assert(!shader.vertexShader.includes("texelFetch"));
    assert.equal(shader.uniforms.explorerBones.value.length, 7);
    return { mesh, display, palette: shader.uniforms.explorerBones.value, version: mesh.geometry.attributes.position.version };
  });
  action.setEffectiveWeight(1);
  for (let frame = 0; frame <= 16; frame++) {
    mixer.setTime(clip.duration * frame / 16);
    parent.rotation.y = frame * 0.15;
    parent.position.x = frame * 0.2;
    gpu.update();
    for (const { mesh, palette, version } of gpuPairs) {
      assert.equal(mesh.layers.mask, 0);
      assert.equal(mesh.geometry.attributes.position.version, version, "Walking must not upload vertices");
      const positions = mesh.geometry.attributes.position;
      for (let vertex = 0; vertex < positions.count; vertex += 23) {
        weighted.elements.fill(0);
        for (let influence = 0; influence < 4; influence++) {
          const weight = mesh.geometry.attributes.skinWeight.getComponent(vertex, influence);
          const bone = mesh.geometry.attributes.skinIndex.getComponent(vertex, influence);
          for (let j = 0; j < 16; j++) weighted.elements[j] += palette[bone].elements[j] * weight;
        }
        actual.fromBufferAttribute(positions, vertex).applyMatrix4(weighted);
        mesh.getVertexPosition(vertex, expected);
        assert(actual.distanceTo(expected) < 0.000002, "Uniform shader matches original animation");
      }
    }
  }
  const started = performance.now();
  for (let frame = 0; frame < 120; frame++) { mixer.update(1 / 30); gpu.update(); }
  console.log(`${name}: uniform animation ${(performance.now() - started) / 120} ms/frame on this computer; 448 bytes of bone matrices, no animated vertex uploads`);
  gpu.dispose(); gpu.dispose();
  assert(gpuPairs.every(({ mesh, display }) => mesh.layers.mask === 1 && !display.parent));
}
assert.equal(prepareCompatibleSkinning(new Group(), false), null, "Static models need no fallback");
