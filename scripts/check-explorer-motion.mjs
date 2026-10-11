import assert from "node:assert/strict";
import fs from "node:fs";
import { Buffer } from "node:buffer";
import ts from "typescript";
import { Box3, Vector3, ShaderLib } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const modules = new Map();
function compiled(file) {
  if (modules.has(file.href)) return modules.get(file.href);
  const source = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText.replace(/from ["']([^"']+)["']/g, (_, name) => {
    const url = name.startsWith(".") ? compiled(new URL(`${name}.ts`, file))
      : new URL("../node_modules/three/build/three.module.js", import.meta.url).href;
    return `from ${JSON.stringify(url)}`;
  });
  const url = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
  modules.set(file.href, url);
  return url;
}
const moduleUrl = name => compiled(new URL(`../components/story-world/${name}.ts`, import.meta.url));
const { ExplorerLocomotion, ExplorerExpressionState, EXPLORER_WALK_SPEED } = await import(moduleUrl("explorer-motion"));
const { createExplorerExpression } = await import(moduleUrl("explorer-expression"));
const { prepareExplorerArmWeights } = await import(moduleUrl("explorer-arm-weights"));
const { bakeExplorerWalk } = await import(moduleUrl("baked-explorer-walk"));
const { disposeWorldObject } = await import(moduleUrl("dispose-world-object"));

function walk(fps) {
  const motion = new ExplorerLocomotion();
  let distance = 0, stoppedAt = 0;
  for (let frame = 0; frame < fps * 2; frame++) {
    const step = motion.advance(1 / fps, 0, frame < fps ? 1 : 0);
    assert(Math.hypot(step.x, step.z) <= EXPLORER_WALK_SPEED / fps + 1e-9);
    if (!frame) assert(step.z < EXPLORER_WALK_SPEED / fps * 0.1, "Start is eased");
    if (frame === fps) stoppedAt = distance;
    distance += step.z;
  }
  assert(distance - stoppedAt < 0.3, "Release stops within 30 cm");
  assert.deepEqual(motion.advance(1 / fps, 0, 0), { x: 0, z: 0 }, "No idle drift");
  return distance;
}
assert(Math.abs(walk(30) - walk(60)) < 0.01, "Travel is consistent at 30 and 60 FPS");
const motion = new ExplorerLocomotion();
for (let i = 0; i < 30; i++) motion.advance(1 / 30, 1, 1);
motion.resolve(0, 0);
assert.deepEqual(motion.advance(1 / 30, 0, 0), { x: 0, z: 0 }, "Collision cancels momentum");
motion.advance(0.1, 0, 1); motion.reset();
assert.deepEqual(motion.advance(1 / 30, 0, 0), { x: 0, z: 0 }, "Menus halt immediately");
const expression = new ExplorerExpressionState();
const target = { id: "scroll-1", yaw: 0.8, kind: "scroll" };
let maximum = 0, breaths = [];
for (let i = 0; i < 300; i++) {
  expression.update(1 / 30, 0, target);
  maximum = Math.max(maximum, expression.reach);
  breaths.push(expression.breath);
  assert(expression.gaze <= 0.38 && expression.gaze >= 0);
  if (i > 150) assert(expression.reach < 0.001, "Gesture plays once, not repeatedly");
}
assert(maximum > 0.85, "Stopping by a scroll plays the gesture");
assert(Math.min(...breaths) < -0.005 && Math.max(...breaths) > 0.005, "Idle breath rises and falls");
for (let i = 0; i < 60; i++) expression.update(1 / 30, 0, { ...target, id: "scroll-2" });
assert(expression.reach > 0.05, "A different scroll may play a new gesture");
for (let i = 0; i < 30; i++) expression.update(1 / 30, 1, target);
assert(expression.reach < 0.001 && expression.gaze < 0.001, "Walking cancels gestures");
for (let i = 0; i < 120; i++) expression.update(1 / 30, 0, { ...target, yaw: Math.PI });
assert(expression.reach < 0.001 && expression.gaze < 0.001, "Never twist toward a target behind the player");

for (const [id, file] of [
  ["student", "quaternius_cc0-male-character-1161"], ["student-girl", "girl2"],
  ["indigenous", "wikalino-indigenous-explorer"], ["muslim", "wikalino-muslim-explorer"],
  ["batang-pinoy", "wikalino-batang-pinoy-explorer"],
]) {
  const bytes = fs.readFileSync(new URL(`../assets/models/${file}.glb`, import.meta.url));
  const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "");
  if (id === "student") {
    gltf.scene.children.slice().forEach(child => { if (!["Male_Standing", "Male_Walking"].includes(child.name)) child.removeFromParent(); });
    gltf.scene.getObjectByName("Male_Walking").visible = false;
  }
  const box = new Box3().setFromObject(gltf.scene), center = box.getCenter(new Vector3());
  const scale = 2.25 / (box.max.y - box.min.y);
  gltf.scene.scale.setScalar(scale);
  gltf.scene.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
  const preparationStart = performance.now();
  prepareExplorerArmWeights(gltf.scene, id);
  const preparationMs = performance.now() - preparationStart;
  const normalizedBounds = new Box3().setFromObject(gltf.scene);
  const normalizedCenter = normalizedBounds.getCenter(new Vector3());
  const height = normalizedBounds.max.y - normalizedBounds.min.y;
  const point = new Vector3();
  const armVertices = [0, 0];
  gltf.scene.traverse(mesh => {
    if (!mesh.isMesh) return;
    const positions = mesh.geometry.getAttribute("position");
    const weights = mesh.geometry.getAttribute("explorerArmWeight");
    assert.equal(weights.count, positions.count);
    for (let vertex = 0; vertex < positions.count; vertex++) {
      point.fromBufferAttribute(positions, vertex).applyMatrix4(mesh.matrixWorld);
      const x = (point.x - normalizedCenter.x) / height;
      const y = (point.y - normalizedBounds.min.y) / height;
      const weight = weights.getX(vertex);
      if (weight > 0.9 && y < 0.55) armVertices[x < 0 ? 0 : 1]++;
      if (y < 0.28 || (Math.abs(x) < 0.06 && y < 0.55)) {
        assert.equal(weight, 0, `${id}: legs and central clothing stay fixed`);
      }
    }
  });
  assert(armVertices.every(count => count > 20), `${id}: both hands move as part of the arms`);
  const clip = gltf.animations.find(animation => animation.name === "Walk");
  const baked = clip ? await bakeExplorerWalk(gltf.scene, clip, () => false, async () => {}) : null;
  const originals = [], versions = [];
  gltf.scene.traverse(mesh => {
    if (!mesh.isMesh || mesh.layers.mask === 0) return;
    originals.push([mesh, mesh.material]);
    versions.push([mesh.geometry, Object.values(mesh.geometry.attributes).map(a => a.version)]);
  });
  const pose = createExplorerExpression(gltf.scene, id);
  const uniforms = [];
  let disposed = 0;
  for (const [mesh] of originals) {
    for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      material.addEventListener("dispose", () => disposed++);
      const shader = { uniforms: {}, vertexShader: ShaderLib.standard.vertexShader };
      material.onBeforeCompile(shader, {});
      uniforms.push(shader.uniforms);
      assert(shader.vertexShader.includes("explorerUpperBody(expressionPosition"));
      assert(shader.uniforms.explorerToUnit && shader.uniforms.explorerFromUnit);
      if (baked) {
        assert(shader.uniforms.explorerWalkBlend, "Expression preserves baked walk interpolation");
        assert(Object.keys(mesh.geometry.attributes).length <= 8, "Fits WebGL 1 minimum attribute budget");
        assert.equal(mesh.geometry.getAttribute("walkRestPosition"), mesh.geometry.getAttribute("position"));
      }
    }
  }
  for (let frame = 0; frame < 300; frame++) pose.update(1 / 30, frame > 150 ? 1 : 0, target);
  pose.update(1 / 30, 1, undefined, Math.PI / 2);
  for (const shader of uniforms) assert(shader.explorerArmSwing.value > 0.3, "First step swings both arms in opposite directions");
  pose.update(1 / 30, 1, undefined, Math.PI * 1.5);
  for (const shader of uniforms) assert(shader.explorerArmSwing.value < -0.3, "Next step reverses both arms");
  for (let frame = 0; frame < 45; frame++) pose.update(1 / 30, 0, target, Math.PI * 1.5);
  for (const shader of uniforms) assert(Math.abs(shader.explorerArmSwing.value) < 0.001, "Arms settle at rest");
  for (const [geometry, snapshot] of versions) assert.deepEqual(Object.values(geometry.attributes).map(a => a.version), snapshot, "Expressions do not rewrite geometry");
  pose.dispose();
  const count = disposed; pose.dispose();
  assert(count > 0 && disposed === count, "Expression materials disposed exactly once");
  for (const [mesh, material] of originals) assert.equal(mesh.material, material, "Restore material ownership");
  baked?.dispose(); disposeWorldObject(gltf.scene);
  console.log(`${id}: arms ${armVertices.join("/")}, preparation ${preparationMs.toFixed(1)} ms; expressions, immutable geometry, WebGL 1 attributes and cleanup passed`);
}
console.log("Movement: eased start/stop, frame independence, collision, pause, one-shot attention and gesture cancellation passed");
