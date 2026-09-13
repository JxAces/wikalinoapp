import {
  BufferGeometry, CircleGeometry, DodecahedronGeometry, DoubleSide, Group,
  Mesh, MeshBasicMaterial, MeshLambertMaterial, Object3D, ShaderMaterial, TorusGeometry,
} from "three";
import type { StoryPortalState } from "./story-world.types";
import { mergeColoredScenery } from "./merge-colored-scenery";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// GLSL 1 only: no textures, textureSize, float textures or browser APIs.
const fragmentShader = `
  uniform float time;
  uniform float seed;
  uniform float locked;
  varying vec2 portalUv;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0)), f.x), f.y);
  }
  void main() {
    vec2 p = (portalUv - 0.5) * 2.0;
    float radius = length(p);
    float twist = 5.8 * (1.0 - radius) + time * 0.26 + seed;
    vec2 q = mat2(cos(twist), -sin(twist), sin(twist), cos(twist)) * p;
    float cloud = noise(q * 3.8 + vec2(time * 0.055, -time * 0.04));
    cloud += noise(q * 8.0 - time * 0.025) * 0.25;
    float ribbon = sin(cloud * 10.0 + radius * 5.0 - time * 0.5);
    vec3 color = mix(vec3(0.0, 0.19, 0.045), vec3(0.0, 0.68, 0.17), cloud);
    color = mix(color, vec3(0.02, 1.0, 0.37), smoothstep(0.55, 0.8, ribbon) * 0.88);
    color = mix(color, vec3(0.52, 1.0, 0.65), smoothstep(0.91, 0.99, ribbon) * 0.65);
    float rim = smoothstep(0.93, 0.995, radius);
    color = mix(color, vec3(0.67, 1.0, 0.19), rim);
    color = mix(color, vec3(dot(color, vec3(0.299, 0.587, 0.114))) * 0.48, locked);
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/** Stone gateway with a flowing emerald surface and gently floating debris.
 * Static rocks are merged by shade to keep all three gates inexpensive on iOS.
 */
export function createStoryPortal(storyId: string, initialState: StoryPortalState = "current") {
  let state = initialState;
  const group = new Group();
  group.name = `Stone story portal ${storyId}`;
  const seed = Number(storyId.slice(-1)) || 1;
  const parts: BufferGeometry[][] = [[], [], []];
  const transform = new Object3D();
  function stone(x: number, y: number, z: number, sx: number, sy: number, sz: number, angle: number, shade: number) {
    const geometry = new DodecahedronGeometry(1, 0);
    transform.position.set(x, y, z);
    transform.scale.set(sx, sy, sz);
    transform.rotation.set(0.15 * Math.sin(x * 4), angle * 0.17, angle);
    transform.updateMatrix();
    geometry.applyMatrix4(transform.matrix);
    parts[shade % 3].push(geometry);
  }
  // A broad stone plinth, with tall irregular slabs along the sides.
  for (let i = 0; i < 5; i++) stone((i - 2) * 0.69, 0.16, 0, 0.65, 0.24, 0.67, i * 0.19, i);
  for (const side of [-1, 1]) {
    stone(side * 1.29, 1.12, 0, 0.33, 1.03, 0.35, -side * 0.25, 0);
    stone(side * 1.26, 2.28, -0.03, 0.29, 0.82, 0.29, side * 0.24, 1);
    stone(side * 0.90, 3.13, 0, 0.23, 0.48, 0.26, side * 0.66, 2);
    stone(side * 1.15, 0.45, 0.26, 0.37, 0.30, 0.34, side * 0.5, 1);
  }
  for (let i = 0; i < 5; i++) {
    const angle = 0.94 + i * 0.31;
    stone(Math.cos(angle) * 1.43, 1.89 + Math.sin(angle) * 1.71, 0,
      0.19, 0.12, 0.19, angle, i);
  }
  [0x555562, 0x727281, 0x93949f].forEach((color, index) => {
    const geometry = mergeGeometries(parts[index]);
    parts[index].forEach(part => part.dispose());
    if (geometry) group.add(new Mesh(geometry, new MeshLambertMaterial({ color, flatShading: true })));
  });
  mergeColoredScenery(group);
  const surfaceMaterial = new ShaderMaterial({
    uniforms: { time: { value: 0 }, seed: { value: seed * 0.7 }, locked: { value: state === "locked" ? 1 : 0 } },
    vertexShader: `varying vec2 portalUv;
      void main() { portalUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader, side: DoubleSide,
  });
  const surface = new Mesh(new CircleGeometry(1.22, 64), surfaceMaterial);
  surface.position.set(0, 1.87, 0.015);
  surface.scale.y = 1.37;
  group.add(surface);
  const rim = new Mesh(new TorusGeometry(1.225, 0.027, 5, 64), new MeshBasicMaterial({ color: 0xb3ff4f, side: DoubleSide }));
  rim.position.copy(surface.position);
  rim.scale.y = 1.37;
  group.add(rim);

  const fragments = new Group();
  const fragmentGeometry = new DodecahedronGeometry(1, 0);
  const fragmentMaterial = new MeshLambertMaterial({ color: 0x81818f, flatShading: true });
  const floatingParts: BufferGeometry[] = [];
  for (let i = 0; i < 9; i++) {
    const angle = -0.12 + i / 8 * Math.PI * 1.1;
    const rock = new Mesh(fragmentGeometry, fragmentMaterial);
    rock.position.set(Math.cos(angle) * 1.75, 1.85 + Math.sin(angle) * 1.99, 0.09);
    rock.scale.set(0.075 + i % 3 * 0.024, 0.14, 0.09);
    rock.rotation.z = angle * 1.8;
    rock.updateMatrix();
    floatingParts.push(fragmentGeometry.clone().applyMatrix4(rock.matrix));
  }
  const floatingGeometry = mergeGeometries(floatingParts);
  floatingParts.forEach(part => part.dispose());
  fragmentGeometry.dispose();
  if (floatingGeometry) fragments.add(new Mesh(floatingGeometry, fragmentMaterial));
  group.add(fragments);
  return { group, storyId, setState(next: StoryPortalState) {
    state = next;
    surfaceMaterial.uniforms.locked.value = state === "locked" ? 1 : 0;
  }, update(elapsed: number) {
    surfaceMaterial.uniforms.time.value = elapsed;
    fragments.position.y = Math.sin(elapsed * 1.1 + seed) * 0.065;
    fragments.rotation.y = Math.sin(elapsed * 0.4 + seed) * 0.045;
    if (state === "locked") rim.material.color.setHex(0x777a82);
    else rim.material.color.setHSL(0.22 + Math.sin(elapsed * 1.3) * 0.025, 1, 0.66);
  } };
}
