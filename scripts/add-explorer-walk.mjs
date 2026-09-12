import fs from "node:fs";
import { Buffer } from "node:buffer";
import path from "node:path";
import assert from "node:assert/strict";

// Add a seven-bone lower-body rig to the colored, upright scan meshes.
// Positions, normals, indices, vertex colors and materials remain untouched.
// Re-run after either color-*-glb script regenerates an unrigged asset.
const root = path.resolve(import.meta.dirname, "..");
const smooth = (a, b, value) => {
  const t = Math.max(0, Math.min(1, (value - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

for (const character of ["indigenous", "muslim", "batang-pinoy"]) {
  const file = path.join(root, `assets/models/wikalino-${character}-explorer.glb`);
  const source = fs.readFileSync(file);
  assert.equal(source.readUInt32LE(0), 0x46546c67);
  const jsonLength = source.readUInt32LE(12);
  const gltf = JSON.parse(source.subarray(20, 20 + jsonLength).toString());
  if (gltf.skins?.length) {
    assert(gltf.animations?.some(clip => clip.name === "Walk"), "Existing rig has no Walk clip; refusing to overwrite it.");
    console.log(`${character}: already has a walk rig`);
    continue;
  }
  assert.equal(gltf.meshes.length, 1);
  assert.equal(gltf.nodes.length, 1);
  assert(!gltf.nodes[0].matrix && !gltf.nodes[0].rotation && !gltf.nodes[0].translation && !gltf.nodes[0].scale);
  const binaryOffset = 28 + jsonLength;
  const chunks = [source.subarray(binaryOffset, binaryOffset + gltf.buffers[0].byteLength)];
  let byteLength = chunks[0].length;
  function append(array, type, componentType, target, bounds = {}) {
    const padding = (4 - byteLength % 4) % 4;
    if (padding) { chunks.push(Buffer.alloc(padding)); byteLength += padding; }
    const bytes = Buffer.from(array.buffer, array.byteOffset, array.byteLength);
    const view = gltf.bufferViews.length;
    gltf.bufferViews.push({ buffer: 0, byteOffset: byteLength, byteLength: bytes.length, ...(target ? { target } : {}) });
    chunks.push(bytes); byteLength += bytes.length;
    const components = { SCALAR: 1, VEC4: 4, MAT4: 16 }[type];
    const index = gltf.accessors.length;
    gltf.accessors.push({ bufferView: view, componentType, count: array.length / components, type, ...bounds });
    return index;
  }
  const primitive = gltf.meshes[0].primitives[0];
  assert.equal(gltf.meshes[0].primitives.length, 1);
  const position = gltf.accessors[primitive.attributes.POSITION];
  assert.equal(position.componentType, 5126);
  const height = position.max[1] - position.min[1];
  const centerX = (position.min[0] + position.max[0]) / 2;
  const view = gltf.bufferViews[position.bufferView];
  const start = binaryOffset + (view.byteOffset ?? 0) + (position.byteOffset ?? 0);
  const colorAccessor = gltf.accessors[primitive.attributes.COLOR_0];
  const colorView = gltf.bufferViews[colorAccessor.bufferView];
  const colorStart = binaryOffset + (colorView.byteOffset ?? 0) + (colorAccessor.byteOffset ?? 0);
  const joints = new Uint16Array(position.count * 4);
  const weights = new Float32Array(position.count * 4);
  for (let i = 0; i < position.count; i++) {
    const offset = start + i * (view.byteStride ?? 12);
    const x = (source.readFloatLE(offset) - centerX) / height;
    const y = (source.readFloatLE(offset + 4) - position.min[1]) / height;
    // Keep hands, arms and everything above the hips on the stationary root.
    let lowerBody = (1 - smooth(0.38, 0.50, y)) * (1 - smooth(0.105, 0.15, Math.abs(x)) * smooth(0.28, 0.36, y));
    if (character === "batang-pinoy" && y > 0.30) {
      assert.equal(colorAccessor.componentType, 5121);
      const offset = colorStart + i * (colorView.byteStride ?? 4);
      // This child's hands hang lower than the adult scans. Only the red
      // trousers belong to the legs here; keep skin and white shirt at rest.
      const red = source[offset], green = source[offset + 1];
      if (green > red * 0.20) lowerBody = 0;
    }
    // Smooth center weights keep the malong/loincloth connected during a step.
    const right = smooth(-0.035, 0.035, x);
    const knee = 1 - smooth(0.21, 0.29, y);
    const ankle = 1 - smooth(0.045, 0.095, y);
    const candidates = [[0, 1 - lowerBody]];
    for (const [base, side] of [[1, 1 - right], [4, right]]) {
      candidates.push([base, lowerBody * side * (1 - knee)], [base + 1, lowerBody * side * knee * (1 - ankle)], [base + 2, lowerBody * side * knee * ankle]);
    }
    const strongest = candidates.sort((a, b) => b[1] - a[1]).slice(0, 4);
    const sum = strongest.reduce((total, item) => total + item[1], 0);
    strongest.forEach(([joint, weight], n) => { joints[i * 4 + n] = joint; weights[i * 4 + n] = weight / sum; });
  }
  primitive.attributes.JOINTS_0 = append(joints, "VEC4", 5123, 34962);
  primitive.attributes.WEIGHTS_0 = append(weights, "VEC4", 5126, 34962);
  const boneWorld = [[0, 0, 0]];
  for (const side of [-1, 1]) {
    boneWorld.push([centerX + side * height * 0.052, height * 0.46, 0],
      [centerX + side * height * 0.052, height * 0.245, 0],
      [centerX + side * height * 0.052, height * 0.045, 0]);
  }
  const firstBone = gltf.nodes.length;
  gltf.nodes.push({ name: "Walk_Root", children: [firstBone + 1, firstBone + 4] });
  for (let i = 1; i < boneWorld.length; i++) {
    const parent = i === 1 || i === 4 ? 0 : i - 1;
    const name = ["Hip", "Knee", "Foot"][(i - 1) % 3];
    gltf.nodes.push({ name: `${i < 4 ? "Left" : "Right"}_${name}`,
      translation: boneWorld[i].map((v, axis) => v - boneWorld[parent][axis]),
      ...((i === 3 || i === 6) ? {} : { children: [firstBone + i + 1] }) });
  }
  const inverseBind = new Float32Array(7 * 16);
  boneWorld.forEach((position, i) => {
    const offset = i * 16;
    for (const diagonal of [0, 5, 10, 15]) inverseBind[offset + diagonal] = 1;
    position.forEach((v, axis) => { inverseBind[offset + 12 + axis] = -v; });
  });
  gltf.skins = [{ name: "Explorer_Leg_Rig", skeleton: firstBone, joints: boneWorld.map((_, i) => firstBone + i), inverseBindMatrices: append(inverseBind, "MAT4", 5126) }];
  gltf.nodes[0].skin = 0;
  gltf.scenes[gltf.scene ?? 0].nodes.push(firstBone);
  gltf.animations = [];
  for (const name of ["Idle", "Walk"]) {
    const frames = name === "Walk" ? 33 : 2;
    const duration = name === "Walk" ? 0.9 : 1;
    const times = Float32Array.from({ length: frames }, (_, i) => i * duration / (frames - 1));
    const input = append(times, "SCALAR", 5126, undefined, { min: [0], max: [duration] });
    const animation = { name, channels: [], samplers: [] };
    for (let joint = 1; joint <= 6; joint++) {
      const values = new Float32Array(frames * 4);
      for (let frame = 0; frame < frames; frame++) {
        const phase = frame / (frames - 1) * Math.PI * 2 + (joint >= 4 ? Math.PI : 0);
        const stride = name === "Walk" ? Math.sin(phase) : 0;
        const hip = stride * (character === "muslim" ? 0.17 : 0.24);
        const knee = -Math.max(0, stride) * (character === "muslim" ? 0.22 : 0.34);
        const angle = [hip, knee, -hip - knee][(joint - 1) % 3];
        values[frame * 4] = Math.sin(angle / 2);
        values[frame * 4 + 3] = Math.cos(angle / 2);
      }
      animation.channels.push({ sampler: animation.samplers.length, target: { node: firstBone + joint, path: "rotation" } });
      animation.samplers.push({ input, output: append(values, "VEC4", 5126), interpolation: "LINEAR" });
    }
    gltf.animations.push(animation);
  }
  gltf.buffers[0].byteLength = byteLength;
  const json = Buffer.from(JSON.stringify(gltf));
  const jsonPadded = Buffer.concat([json, Buffer.alloc((4 - json.length % 4) % 4, 0x20)]);
  const binary = Buffer.concat([...chunks, Buffer.alloc((4 - byteLength % 4) % 4)]);
  const header = Buffer.alloc(20);
  header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4);
  header.writeUInt32LE(28 + jsonPadded.length + binary.length, 8);
  header.writeUInt32LE(jsonPadded.length, 12); header.writeUInt32LE(0x4e4f534a, 16);
  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binary.length, 0); binHeader.writeUInt32LE(0x004e4942, 4);
  fs.writeFileSync(file, Buffer.concat([header, jsonPadded, binHeader, binary]));
  if (character === "batang-pinoy") fs.copyFileSync(file, path.join(root, "assets/models/batangPinoy.glb"));
  console.log(`${character}: embedded Idle + Walk, 7 bones, ${(fs.statSync(file).size / 1048576).toFixed(2)} MB`);
}
