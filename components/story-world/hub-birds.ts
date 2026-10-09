import {
  BufferGeometry, Color, ConeGeometry, CylinderGeometry, Float32BufferAttribute,
  Group, Mesh, MeshLambertMaterial, Object3D, SphereGeometry,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

const FLIGHTS = [
  { x: -23, z: -20, phase: 7, radiusX: 4.8, radiusZ: 3.4 },
  { x: 4, z: 3, phase: 8, radiusX: 5.2, radiusZ: 3.8 },
];

// Wings deform in the vertex shader, keeping each bird to one draw call on
// Expo's WebGL 1 renderer. No skeleton, texture lookup, or geometry uploads.
const wingShader = `
  attribute float birdWing;
  attribute float birdFlex;
  uniform float birdFlap;
  uniform float birdTip;
  mat3 birdWingRotation() {
    float angle = birdWing * (birdFlap + birdTip * birdFlex);
    float c = cos(angle), s = sin(angle);
    return mat3(c,s,0.0, -s,c,0.0, 0.0,0.0,1.0);
  }
`;

/** A thin, closed feather with a raised spine, instead of a flat oval. */
function feather(startX: number, startZ: number, endX: number, endZ: number, width: number) {
  const dx = endX - startX, dz = endZ - startZ;
  const length = Math.hypot(dx, dz), nx = -dz / length, nz = dx / length;
  const outline = [[0, 0], [.34, -1], [.72, -.72], [1, 0], [.72, .72], [.34, 1]];
  const positions = outline.flatMap(([t, side]) => [
    startX + dx * t + nx * width * side,
    .012 * Math.sin(t * Math.PI),
    startZ + dz * t + nz * width * side,
  ]);
  positions.push(startX + dx * .48, .034, startZ + dz * .48);
  positions.push(startX + dx * .48, -.018, startZ + dz * .48);
  const indices: number[] = [];
  for (let i = 0; i < 6; i++) {
    const next = (i + 1) % 6;
    indices.push(i, 6, next, i, next, 7);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createBirdGeometry() {
  const parts: BufferGeometry[] = [];
  const transform = new Object3D();
  const back = new Color(0x426a72), breast = new Color(0xe9ddbe);
  function part(color: number, geometry: BufferGeometry,
    position: [number, number, number], scale: [number, number, number] = [1, 1, 1],
    wing = 0, plumage = false) {
    transform.position.set(...position);
    transform.scale.set(...scale);
    transform.updateMatrix();
    geometry.applyMatrix4(transform.matrix);
    // Mirroring the left wing also reverses triangle winding.
    if (scale[0] < 0 && geometry.index) {
      const index = geometry.index;
      for (let i = 0; i < index.count; i += 3) {
        const a = index.getX(i);
        index.setX(i, index.getX(i + 2));
        index.setX(i + 2, a);
      }
    }
    geometry.deleteAttribute("uv");
    const points = geometry.getAttribute("position"), count = points.count;
    const colors = new Float32Array(count * 3), wings = new Float32Array(count), flex = new Float32Array(count);
    const tint = new Color(color);
    for (let i = 0; i < count; i++) {
      if (plumage) {
        // Pale throat/belly blend into the darker back along the rounded body.
        const belly = Math.max(0, Math.min(1, (position[1] + .035 - points.getY(i)) / .14));
        tint.copy(back).lerp(breast, belly);
      }
      tint.toArray(colors, i * 3);
      wings[i] = wing;
      flex[i] = Math.max(0, Math.min(1, (Math.abs(points.getX(i)) - .48) / .6));
    }
    geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
    geometry.setAttribute("birdWing", new Float32BufferAttribute(wings, 1));
    geometry.setAttribute("birdFlex", new Float32BufferAttribute(flex, 1));
    parts.push(geometry);
  }

  part(0x426a72, new SphereGeometry(1, 10, 6), [0, 0, 0], [.18, .205, .42], 0, true);
  part(0x426a72, new SphereGeometry(1, 8, 5), [0, .205, .34], [.17, .18, .20], 0, true);
  // A pointed bill, small dark eyes, and tucked feet give a readable silhouette.
  const bill = new ConeGeometry(.068, .27, 5);
  bill.rotateX(Math.PI / 2);
  part(0x403c32, bill, [0, .185, .64], [.8, .65, 1]);
  for (const side of [-1, 1]) {
    part(0x131f21, new SphereGeometry(1, 5, 3), [side * .153, .235, .415], [.023, .027, .029]);
    part(0xf8f2d9, new SphereGeometry(1, 4, 2), [side * .17, .246, .424], [.006, .007, .007]);
    const foot = new CylinderGeometry(.012, .017, .13, 4);
    foot.rotateX(-1.0);
    part(0x7b5b3c, foot, [side * .07, -.175, -.21]);
  }
  for (let i = -1; i <= 1; i++) {
    part(i === 0 ? 0x3f6571 : 0x334f5d,
      feather(i * .035, -.27, i * .14, -.88 + Math.abs(i) * .05, .087), [0, -.01, 0]);
  }

  for (const side of [-1, 1]) {
    const mirror: [number, number, number] = [side, 1, 1];
    // Overlapping secondary feathers fill the rear edge near the body.
    for (let i = 0; i < 3; i++) {
      part(i % 2 ? 0x426771 : 0x365862,
        feather(.19 + i * .15, .07, .27 + i * .18, -.38 - i * .025, .092),
        [0, .065, 0], mirror, side);
    }
    // Long primaries sweep backward and separate gently at the tips.
    for (let i = 0; i < 5; i++) {
      part(i % 2 ? 0x375864 : 0x2c4652,
        feather(.44 + i * .065, .05 - i * .025, .76 + i * .10, -.45 + i * .027, .074),
        [0, .075, 0], mirror, side);
    }
    part(0x4c7c83, feather(.12, .12, .87, -.11, .19), [0, .09, 0], mirror, side);
  }

  const geometry = mergeGeometries(parts, false);
  parts.forEach(part => part.dispose());
  if (!geometry) throw new Error("Unable to build flying birds");
  geometry.computeBoundingSphere();
  // Shader-flapped tips must remain inside the culling bounds.
  geometry.boundingSphere!.radius += .3;
  return geometry;
}

export function createHubBirds() {
  const group = new Group();
  group.name = "Flying birds";
  const geometry = createBirdGeometry();
  const birds = FLIGHTS.map((flight, index) => {
    const uniforms = { birdFlap: { value: 0 }, birdTip: { value: 0 } };
    const material = new MeshLambertMaterial({ vertexColors: true });
    material.onBeforeCompile = shader => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = wingShader + shader.vertexShader
        .replace("#include <beginnormal_vertex>", "#include <beginnormal_vertex>\n objectNormal = birdWingRotation() * objectNormal;")
        .replace("#include <begin_vertex>", `#include <begin_vertex>
          vec3 pivot = vec3(birdWing * 0.145, 0.075, 0.035);
          transformed = birdWingRotation() * (transformed - pivot) + pivot;`);
    };
    material.customProgramCacheKey = () => "wikalino-feathered-bird-v1";
    const mesh = new Mesh(geometry, material);
    mesh.name = `Flying bird ${index + 1}`;
    mesh.userData.kind = "bird";
    mesh.scale.setScalar(.72);
    mesh.position.set(flight.x, 4.2, flight.z);
    group.add(mesh);
    return { mesh, flight, uniforms };
  });

  return {
    group,
    update(elapsed: number, player: { x: number; z: number }) {
      for (const { mesh, flight, uniforms } of birds) {
        const angle = elapsed * .38 + flight.phase;
        const x = flight.x + Math.cos(angle) * flight.radiusX;
        const z = flight.z + Math.sin(angle) * flight.radiusZ;
        mesh.visible = Math.hypot(player.x - x, player.z - z) < 28;
        if (!mesh.visible) continue;
        const beat = elapsed * 17 + flight.phase;
        const burst = Math.max(0, Math.sin(elapsed * .8 + flight.phase));
        const effort = burst * burst;
        uniforms.birdFlap.value = .10 + Math.sin(beat) * .58 * effort;
        uniforms.birdTip.value = Math.sin(beat - .6) * .16 * effort;
        const rise = .25 * Math.sin(angle * 2);
        mesh.position.set(x, 4.2 + rise + Math.sin(beat - .4) * .035 * effort, z);
        // Point along the flight path, with a gentle bank into each turn.
        const vx = -Math.sin(angle) * flight.radiusX * .38;
        const vz = Math.cos(angle) * flight.radiusZ * .38;
        const vy = .19 * Math.cos(angle * 2);
        mesh.rotation.set(-Math.atan2(vy, Math.hypot(vx, vz)), Math.atan2(vx, vz), .12 + .04 * Math.cos(angle * 2), "YXZ");
      }
    },
  };
}
