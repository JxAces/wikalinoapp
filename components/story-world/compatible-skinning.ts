import {
  BufferAttribute,
  DynamicDrawUsage,
  Matrix4,
  Mesh,
  Object3D,
  SkinnedMesh,
  Vector3,
} from "three";

/** Three r162's bone-texture shader needs GLSL 3. WebGL 1 instead displays
 * a regular mesh. Native uses CPU deformation; browsers can opt into a small
 * GPU matrix-uniform palette by supplying their uniform budget.
 * The original mesh stays in the hierarchy for animation bindings and bones,
 * but belongs to no render layer, so it cannot compile a skinning shader.
 */
export function prepareCompatibleSkinning(root: Object3D, isWebGL2: boolean, maxVertexUniforms = 0) {
  if (isWebGL2) return null;
  const sources: SkinnedMesh[] = [];
  root.traverse(object => {
    if (object instanceof SkinnedMesh && object.parent) sources.push(object);
  });
  if (!sources.length) return null;
  // Reserve room for Three's camera/material uniforms. These seven-bone rigs
  // fit comfortably even in WebGL 1's minimum 128 vertex-uniform vectors.
  const maxBones = Math.min(32, Math.floor((maxVertexUniforms - 64) / 4));
  if (sources.every(source => source.skeleton.bones.length <= maxBones)) {
    return prepareUniformSkinning(root, sources);
  }

  const entries = sources.map(source => {
    const geometry = source.geometry.clone();
    // Float output also handles normalized/interleaved input attributes.
    const position = source.geometry.getAttribute("position");
    geometry.setAttribute("position", new BufferAttribute(new Float32Array(position.count * 3), 3).setUsage(DynamicDrawUsage));
    if (geometry.hasAttribute("normal")) {
      geometry.setAttribute("normal", new BufferAttribute(new Float32Array(position.count * 3), 3).setUsage(DynamicDrawUsage));
    }
    // Let the material derive its tangent basis from UVs after deformation.
    geometry.deleteAttribute("tangent");
    geometry.deleteAttribute("skinIndex");
    geometry.deleteAttribute("skinWeight");
    const display = new Mesh(geometry, source.material);
    display.name = `${source.name}-webgl1-display`;
    display.matrixAutoUpdate = false;
    display.frustumCulled = false;
    display.castShadow = source.castShadow;
    display.receiveShadow = source.receiveShadow;
    display.renderOrder = source.renderOrder;
    display.layers.mask = source.layers.mask;
    source.parent!.add(display);
    const originalLayers = source.layers.mask;
    source.layers.mask = 0;
    const affectedByBone: number[][] = source.skeleton.bones.map(() => []);
    const indices = source.geometry.getAttribute("skinIndex");
    const weights = source.geometry.getAttribute("skinWeight");
    for (let vertex = 0; vertex < position.count; vertex++) {
      for (let component = 0; component < 4; component++) {
        if (weights.getComponent(vertex, component) !== 0) {
          affectedByBone[indices.getComponent(vertex, component)].push(vertex);
        }
      }
    }
    return { source, display, originalLayers,
      affectedByBone, dirty: new Uint8Array(position.count), dirtyVertices: [] as number[],
      palette: source.skeleton.bones.map(() => new Matrix4()),
      previous: new Float32Array(source.skeleton.bones.length * 16).fill(NaN) };
  });
  const position = new Vector3();
  const normal = new Vector3();
  const base = new Vector3();
  const offset = new Matrix4();
  let disposed = false;

  const update = () => {
    if (disposed) return;
    // Include character movement/scale before SkinnedMesh updates its inverse
    // bind matrix. Updating bones alone would apply the parent transform twice.
    root.updateWorldMatrix(true, false);
    root.updateMatrixWorld(true);
    for (const entry of entries) {
      const { source, display, palette, previous, affectedByBone, dirty, dirtyVertices } = entry;
      display.matrix.copy(source.matrix);
      display.matrixWorldNeedsUpdate = true;
      display.visible = source.visible;
      let changed = false;
      dirtyVertices.length = 0;
      source.skeleton.bones.forEach((bone, index) => {
        offset.multiplyMatrices(bone.matrixWorld, source.skeleton.boneInverses[index]);
        palette[index].multiplyMatrices(source.bindMatrixInverse, offset).multiply(source.bindMatrix);
        const values = palette[index].elements;
        let boneChanged = false;
        for (let j = 0; j < 16; j++) {
          const old = previous[index * 16 + j];
          if (!Number.isFinite(old) || Math.abs(old - values[j]) > 0.0000001) boneChanged = true;
        }
        if (boneChanged) {
          changed = true;
          for (const vertex of affectedByBone[index]) {
            if (dirty[vertex]) continue;
            dirty[vertex] = 1;
            dirtyVertices.push(vertex);
          }
        }
      });
      // A stationary preview and an idle character need no vertex uploads.
      if (!changed) continue;
      palette.forEach((matrix, index) => previous.set(matrix.elements, index * 16));
      if (!dirtyVertices.length) continue;
      const rest = source.geometry.getAttribute("position");
      const restNormal = source.geometry.getAttribute("normal");
      const indices = source.geometry.getAttribute("skinIndex");
      const weights = source.geometry.getAttribute("skinWeight");
      const output = display.geometry.getAttribute("position");
      const outputNormal = display.geometry.getAttribute("normal");
      let firstChanged = rest.count, lastChanged = 0;
      for (const vertex of dirtyVertices) {
        dirty[vertex] = 0;
        firstChanged = Math.min(firstChanged, vertex);
        lastChanged = Math.max(lastChanged, vertex);
        position.set(0, 0, 0);
        normal.set(0, 0, 0);
        for (let component = 0; component < 4; component++) {
          const weight = weights.getComponent(vertex, component);
          if (weight === 0) continue;
          const matrix = palette[indices.getComponent(vertex, component)];
          position.addScaledVector(base.fromBufferAttribute(rest, vertex).applyMatrix4(matrix), weight);
          if (restNormal) {
            const x = restNormal.getX(vertex), y = restNormal.getY(vertex), z = restNormal.getZ(vertex);
            const m = matrix.elements;
            // Match skinnormal_vertex: multiply by the weighted skin matrix
            // with w=0, then normalize once, after blending the influences.
            normal.x += weight * (m[0] * x + m[4] * y + m[8] * z);
            normal.y += weight * (m[1] * x + m[5] * y + m[9] * z);
            normal.z += weight * (m[2] * x + m[6] * y + m[10] * z);
          }
        }
        output.setXYZ(vertex, position.x, position.y, position.z);
        if (outputNormal) {
          normal.normalize();
          outputNormal.setXYZ(vertex, normal.x, normal.y, normal.z);
        }
      }
      output.needsUpdate = true;
      if (outputNormal) outputNormal.needsUpdate = true;
      // Upload one contiguous changed span, avoiding thousands of GL calls.
      for (const attribute of [output, outputNormal]) {
        if (!(attribute instanceof BufferAttribute)) continue;
        attribute.clearUpdateRanges();
        attribute.addUpdateRange(firstChanged * 3, (lastChanged - firstChanged + 1) * 3);
      }
    }
  };

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    for (const { source, display, originalLayers } of entries) {
      source.layers.mask = originalLayers;
      display.removeFromParent();
      display.geometry.dispose();
      // Materials and skeletons belong to the original model's normal cleanup.
    }
  };

  update();
  return { update, dispose, mode: "cpu" as const };
}

export type CompatibleSkinning = ReturnType<typeof prepareCompatibleSkinning>;

/** Use a small matrix-uniform palette instead of a float bone texture.
 * This keeps vertex deformation on the GPU without WebGL 2 or extensions.
 */
function prepareUniformSkinning(root: Object3D, sources: SkinnedMesh[]) {
  const entries = sources.map(source => {
    const palette = source.skeleton.bones.map(() => new Matrix4());
    const materials = (Array.isArray(source.material) ? source.material : [source.material]).map(original => {
      const material = original.clone();
      material.customProgramCacheKey = () => `wikalino-uniform-skinning-v1-${palette.length}`;
      material.onBeforeCompile = shader => {
        shader.uniforms.explorerBones = { value: palette };
        shader.vertexShader = shader.vertexShader
          .replace("#include <skinning_pars_vertex>", `
            attribute vec4 skinIndex;
            attribute vec4 skinWeight;
            uniform mat4 explorerBones[${palette.length}];
          `)
          .replace("#include <skinbase_vertex>", `
            mat4 explorerSkin = skinWeight.x * explorerBones[int(skinIndex.x)]
              + skinWeight.y * explorerBones[int(skinIndex.y)]
              + skinWeight.z * explorerBones[int(skinIndex.z)]
              + skinWeight.w * explorerBones[int(skinIndex.w)];
          `)
          .replace("#include <skinnormal_vertex>", `
            objectNormal = (explorerSkin * vec4(objectNormal, 0.0)).xyz;
            #ifdef USE_TANGENT
              objectTangent = (explorerSkin * vec4(objectTangent, 0.0)).xyz;
            #endif
          `)
          .replace("#include <skinning_vertex>", "transformed = (explorerSkin * vec4(transformed, 1.0)).xyz;");
      };
      return material;
    });
    const display = new Mesh(source.geometry, Array.isArray(source.material) ? materials : materials[0]);
    display.name = `${source.name}-webgl1-uniform-display`;
    display.matrixAutoUpdate = false;
    // The animated bounds can extend beyond the original standing pose.
    display.frustumCulled = false;
    display.renderOrder = source.renderOrder;
    display.layers.mask = source.layers.mask;
    const originalLayers = source.layers.mask;
    source.layers.mask = 0;
    source.parent!.add(display);
    return { source, display, palette, materials, originalLayers };
  });
  const offset = new Matrix4();
  let disposed = false;
  const update = () => {
    if (disposed) return;
    root.updateWorldMatrix(true, false);
    root.updateMatrixWorld(true);
    for (const { source, display, palette } of entries) {
      display.visible = source.visible;
      display.matrix.copy(source.matrix);
      display.matrixWorldNeedsUpdate = true;
      source.skeleton.bones.forEach((bone, index) => {
        offset.multiplyMatrices(bone.matrixWorld, source.skeleton.boneInverses[index]);
        palette[index].multiplyMatrices(source.bindMatrixInverse, offset).multiply(source.bindMatrix);
      });
    }
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    for (const { source, display, materials, originalLayers } of entries) {
      source.layers.mask = originalLayers;
      display.removeFromParent();
      materials.forEach(material => material.dispose());
      // Geometry, textures and skeletons remain owned by the original model.
    }
  };
  update();
  return { update, dispose, mode: "uniform" as const };
}
