import fs from "node:fs";
import assert from "node:assert/strict";
import { AnimationMixer, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

for (const name of ["indigenous", "muslim", "batang-pinoy"]) {
  const url = new URL(`../assets/models/wikalino-${name}-explorer.glb`, import.meta.url);
  const bytes = fs.readFileSync(url);
  const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "");
  let mesh;
  gltf.scene.traverse(object => { if (object.isSkinnedMesh) mesh = object; });
  assert(mesh, `${name}: expected a skinned mesh`);
  assert.equal(mesh.skeleton.bones.length, 7);
  assert(gltf.animations.some(clip => clip.name === "Idle"));
  const clip = gltf.animations.find(clip => clip.name === "Walk");
  assert(clip);
  const skinWeight = mesh.geometry.attributes.skinWeight;
  for (let i = 0; i < skinWeight.count; i++) {
    const sum = skinWeight.getX(i) + skinWeight.getY(i) + skinWeight.getZ(i) + skinWeight.getW(i);
    assert(Math.abs(sum - 1) < 0.00001, `${name}: invalid weight at ${i}`);
  }
  const positions = mesh.geometry.attributes.position;
  const mixer = new AnimationMixer(gltf.scene);
  const action = mixer.clipAction(clip).play();
  const sample = time => {
    mixer.setTime(time);
    gltf.scene.updateMatrixWorld(true);
    mesh.skeleton.update();
    const feet = { left: [0, 0], right: [0, 0] };
    let floor = Infinity, headError = 0;
    for (let i = 0; i < positions.count; i++) {
      const base = new Vector3().fromBufferAttribute(positions, i);
      const point = mesh.getVertexPosition(i, new Vector3());
      assert([point.x, point.y, point.z].every(Number.isFinite));
      floor = Math.min(floor, point.y);
      if (base.y > 1.05) headError = Math.max(headError, point.distanceTo(base));
      if (name === "batang-pinoy" && base.y > 0.57) {
        const color = mesh.geometry.attributes.color;
        if (color.getY(i) > color.getX(i) * 0.20) {
          assert(point.distanceTo(base) < 0.00001, "Batang Pinoy: hand or shirt follows the leg rig");
        }
      }
      if (base.y < 0.075 && Math.abs(base.x) > 0.045) {
        const side = base.x < 0 ? feet.left : feet.right;
        side[0] += point.z - base.z; side[1]++;
      }
    }
    assert(headError < 0.00001, `${name}: upper body deformed`);
    assert(floor > -0.012, `${name}: feet penetrate floor (${floor})`);
    return [feet.left[0] / feet.left[1], feet.right[0] / feet.right[1]];
  };
  const forward = sample(clip.duration / 4);
  const backward = sample(clip.duration * 3 / 4);
  assert(forward[0] * forward[1] < 0, `${name}: feet must travel in opposite directions`);
  assert(forward[0] * backward[0] < 0 && forward[1] * backward[1] < 0, `${name}: both legs must alternate`);
  assert(Math.abs(forward[0] - backward[0]) > 0.08, `${name}: stride is too small`);
  for (let i = 0; i <= 32; i++) sample(clip.duration * i / 32);
  action.setEffectiveWeight(0);
  mixer.update(0);
  gltf.scene.updateMatrixWorld(true); mesh.skeleton.update();
  for (let i = 0; i < positions.count; i += 37) {
    assert(mesh.getVertexPosition(i, new Vector3()).distanceTo(new Vector3().fromBufferAttribute(positions, i)) < 0.00001, `${name}: idle did not restore original pose`);
  }
  console.log(`${name}: 7 bones, alternating feet, no floor penetration, unchanged upper body, idle restored`);
}
