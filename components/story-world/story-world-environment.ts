import {
  BufferGeometry, Color, CylinderGeometry, DataTexture, DoubleSide,
  Float32BufferAttribute, Group, LinearMipmapLinearFilter, MathUtils,
  Mesh, MeshBasicMaterial, MeshLambertMaterial, Object3D, PlaneGeometry,
  RepeatWrapping, RGBAFormat, SphereGeometry, SRGBColorSpace,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/** The hut stays behind every scroll and outside the walkable rectangle.
 * Use a parent group: rotating a normalized GLB itself also rotates its offset. */
export const STORY_HUT_PLACEMENT = { x: -4.8, y: 0.02, z: -25.1, rotation: 0.45 };
export const MEADOW_LIGHTING = {
  sky: 0xb9dfc5, fog: 0xc6dec0, fogDensity: 0.016,
  hemisphereSky: 0xf3f7dc, hemisphereGround: 0x526336,
  hemisphereIntensity: 1.35, ambientIntensity: 0.48, sunlightIntensity: 1.8,
};

function randomSource(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

// A small raw RGBA texture works in Expo GL without Canvas, image decoding,
// network requests or a WebGL 2 dependency. Its edges wrap seamlessly.
function meadowTexture() {
  const size = 256;
  const pixels = new Uint8Array(size * size * 4);
  const random = randomSource(741);
  const tau = Math.PI * 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const broad = Math.sin(x / size * tau * 3 + Math.sin(y / size * tau * 2))
        * Math.cos(y / size * tau * 4);
      const fine = (random() - 0.5) * 9;
      const offset = (y * size + x) * 4;
      pixels[offset] = 99 + broad * 13 + fine;
      pixels[offset + 1] = 142 + broad * 14 + fine;
      pixels[offset + 2] = 48 + broad * 6 + fine;
      pixels[offset + 3] = 255;
    }
  }
  // Overlapping tapered leaf marks give the ground a painted meadow texture.
  for (let leaf = 0; leaf < 1150; leaf++) {
    const cx = random() * size;
    const cy = random() * size;
    const angle = random() * tau;
    const length = 2 + random() * 5;
    const width = 1 + random() * 1.7;
    const tone = random();
    const color = [112 + tone * 48, 150 + tone * 34, 47 + tone * 21];
    const radius = Math.ceil(length);
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const u = (dx * Math.cos(angle) + dy * Math.sin(angle)) / length;
        const v = (-dx * Math.sin(angle) + dy * Math.cos(angle)) / width;
        if (Math.abs(u) + v * v > 1) continue;
        const x = (Math.floor(cx) + dx + size) % size;
        const y = (Math.floor(cy) + dy + size) % size;
        const offset = (y * size + x) * 4;
        const alpha = 0.58 * Math.min(1, (1 - Math.abs(u) - v * v) * 5);
        for (let c = 0; c < 3; c++) pixels[offset + c] = pixels[offset + c] * (1 - alpha) + color[c] * alpha;
      }
    }
  }
  const texture = new DataTexture(pixels, size, size, RGBAFormat);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(13, 18);
  texture.generateMipmaps = true;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.needsUpdate = true;
  return texture;
}

/** Keep the gameplay surface level; only the distant perimeter rises. */
export function meadowHeight(x: number, z: number) {
  const edge = Math.max(Math.abs(x) - 8.5, -z - 26, z - 16, 0);
  const rise = MathUtils.smoothstep(edge, 0, 7);
  return -0.07 + rise * (1.9 + Math.sin(x * 0.25 + z * 0.14) * 0.8
    + Math.cos(z * 0.29 - x * 0.18) * 0.65);
}

// Merge each material's geometry so hundreds of details cost few draw calls.
class SceneryBatch {
  readonly parts: BufferGeometry[] = [];
  private transform = new Object3D();
  constructor(readonly color: number) {}
  add(base: BufferGeometry, position: number[], scale = [1, 1, 1], rotation = [0, 0, 0]) {
    this.transform.position.set(position[0], position[1], position[2]);
    this.transform.scale.set(scale[0], scale[1], scale[2]);
    this.transform.rotation.set(rotation[0], rotation[1], rotation[2]);
    this.transform.updateMatrix();
    this.parts.push(base.clone().applyMatrix4(this.transform.matrix));
  }
  finish(group: Group, name: string, mottled = false) {
    if (!this.parts.length) return;
    const geometry = mergeGeometries(this.parts, false);
    this.parts.forEach((part) => part.dispose());
    if (!geometry) throw new Error(`Unable to build meadow scenery: ${name}`);
    if (mottled) {
      const positions = geometry.getAttribute("position");
      const colors = new Float32Array(positions.count * 3);
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
        const shade = 0.81 + 0.17 * Math.sin(x * 8 + Math.sin(z * 6)) * Math.cos(y * 10)
          + 0.12 * Math.sin(z * 11 + x * 3);
        colors.set([shade, shade, shade * 0.93], i * 3);
      }
      geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
    }
    const material = new MeshLambertMaterial({ color: this.color, vertexColors: mottled, side: DoubleSide });
    const mesh = new Mesh(geometry, material);
    mesh.name = name;
    group.add(mesh);
  }
}

export function createMeadowEnvironment() {
  const group = new Group();
  group.name = "Storybook meadow";
  const texture = meadowTexture();
  const terrain = new PlaneGeometry(60, 80, 100, 136);
  terrain.rotateX(-Math.PI / 2);
  terrain.translate(0, 0, -7);
  const positions = terrain.getAttribute("position");
  const colors = new Float32Array(positions.count * 3);
  const shade = new Color();
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), z = positions.getZ(i);
    positions.setY(i, meadowHeight(x, z));
    const variation = 0.94 + Math.sin(x * 0.44 + z * 0.31) * 0.055;
    shade.setRGB(variation, variation, variation * 0.94);
    colors.set([shade.r, shade.g, shade.b], i * 3);
  }
  terrain.setAttribute("color", new Float32BufferAttribute(colors, 3));
  terrain.computeVertexNormals();
  const groundMaterial = new MeshLambertMaterial({ map: texture, vertexColors: true });
  groundMaterial.addEventListener("dispose", () => texture.dispose());
  const ground = new Mesh(terrain, groundMaterial);
  ground.name = "Painted grass and rolling perimeter";
  group.add(ground);

  const bark = new SceneryBatch(0x74512d);
  const roots = new SceneryBatch(0x866338);
  const leaves = new SceneryBatch(0x539125);
  const sunlitLeaves = new SceneryBatch(0x73a82d);
  const shrub = new SceneryBatch(0x628d2b);
  const stems = new SceneryBatch(0xeadcaa);
  const caps = new SceneryBatch(0xc34a38);
  const spots = new SceneryBatch(0xffefc7);
  const grass = new SceneryBatch(0x699331);
  const grassTips = new SceneryBatch(0x98b951);
  const rocks = new SceneryBatch(0x929879);
  const flowers = new SceneryBatch(0xf0c765);
  const sphere = new SphereGeometry(1, 16, 10);
  const trunk = new CylinderGeometry(0.34, 0.58, 2.1, 12, 3);
  const root = new CylinderGeometry(0.06, 0.17, 0.8, 7);
  const stem = new CylinderGeometry(0.14, 0.25, 0.9, 12, 3);
  const cap = new SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  const underside = new CylinderGeometry(1, 0.91, 0.10, 24);
  const leaf = new BufferGeometry();
  leaf.setAttribute("position", new Float32BufferAttribute([
    -0.09, 0, 0, 0.075, 0.3, 0.035, 0.01, 0.64, 0.13,
    -0.09, 0, 0, 0.01, 0.64, 0.13, -0.06, 0.3, 0.035,
  ], 3));
  leaf.computeVertexNormals();

  const treePositions = [
    [-11.8, 10, 1.3], [-11.3, 1, 1.4], [-12.3, -9, 1.55], [-12.8, -18, 1.25],
    [12.8, 9, 1.25], [13.4, -1, 1.35], [12.4, -12, 1.45], [11.8, -23, 1.25],
    [-15, -30, 1.5], [-4, -31, 1.35], [3, -33, 1.55], [16, -32, 1.5],
  ];
  treePositions.forEach(([x, z, s], index) => {
    const y = meadowHeight(x, z);
    bark.add(trunk, [x, y + 1.02 * s, z], [s, s, s], [0, index, 0.035]);
    for (let r = 0; r < 5; r++) {
      const angle = r / 5 * Math.PI * 2;
      roots.add(root, [x + Math.sin(angle) * s * 0.4, y + 0.24 * s, z + Math.cos(angle) * s * 0.4],
        [s, s, s], [Math.cos(angle) * 0.65, 0, -Math.sin(angle) * 0.65]);
    }
    // A low, broad canopy with smaller lobes instead of stacked cone trees.
    leaves.add(sphere, [x, y + 2.5 * s, z], [1.52 * s, 1.02 * s, 1.3 * s]);
    for (let l = 0; l < 7; l++) {
      const angle = l / 7 * Math.PI * 2 + index;
      const batch = l % 3 === 0 ? sunlitLeaves : leaves;
      batch.add(sphere, [x + Math.cos(angle) * s, y + (2.45 + (l % 3) * 0.26) * s, z + Math.sin(angle) * s * 0.8],
        [0.8 * s, 0.69 * s, 0.85 * s]);
    }
    sunlitLeaves.add(sphere, [x - 0.2 * s, y + 3.18 * s, z], [s, 0.65 * s, 0.95 * s]);
  });

  // Keep all tall decorations well outside the scrolls and movement corridor.
  const mushroomPositions = [
    [-7.9, 4.6, 1.05], [8.4, -2.2, 0.9], [-8.3, -6.8, 1.15],
    [8.5, -12.5, 1.0], [-7.8, -19.6, 0.8], [6.9, -25, 1.1],
  ];
  mushroomPositions.forEach(([x, z, s], index) => {
    const y = meadowHeight(x, z);
    stems.add(stem, [x, y + 0.45 * s, z], [s, s, s]);
    caps.add(cap, [x, y + 0.9 * s, z], [0.82 * s, 0.53 * s, 0.82 * s]);
    stems.add(underside, [x, y + 0.89 * s, z], [0.82 * s, s, 0.82 * s]);
    for (let p = 0; p < 9; p++) {
      const phi = p * 2.399 + index;
      const theta = 0.22 + (p % 4) * 0.29;
      const radius = 0.82 * s * Math.sin(theta);
      const mark = new SphereGeometry(1, 8, 5);
      // Small flattened spots follow the dome surface and stay off its rim.
      spots.add(mark, [x + radius * Math.cos(phi), y + 0.9 * s + 0.533 * s * Math.cos(theta), z + radius * Math.sin(phi)],
        [0.105 * s, 0.018 * s, 0.10 * s], [Math.sin(phi) * theta, 0, -Math.cos(phi) * theta]);
      mark.dispose();
    }
    // A small companion mushroom gives the clusters varied silhouettes.
    stems.add(stem, [x + 0.75 * s, y + 0.2 * s, z + 0.5], [s * 0.45, s * 0.45, s * 0.45]);
    caps.add(cap, [x + 0.75 * s, y + 0.42 * s, z + 0.5], [s * 0.4, s * 0.27, s * 0.4]);
  });

  const random = randomSource(958);
  for (let i = 0; i < 220; i++) {
    const x = (i % 2 ? -1 : 1) * (6.2 + random() * 9);
    const z = 14 - random() * 44;
    // Leave a small lawn around the hut's foundation.
    if (Math.hypot(x - STORY_HUT_PLACEMENT.x, z - STORY_HUT_PLACEMENT.z) < 3.1) continue;
    const y = meadowHeight(x, z);
    if (i % 14 === 0) {
      shrub.add(sphere, [x, y + 0.3, z], [0.65, 0.48, 0.56]);
      shrub.add(sphere, [x + 0.42, y + 0.18, z + 0.1], [0.48, 0.34, 0.4]);
    } else if (i % 10 === 0) {
      rocks.add(sphere, [x, y + 0.17, z], [0.4, 0.29, 0.32], [0.1, random() * 5, 0]);
    } else {
      for (let blade = 0; blade < 5; blade++) {
        const s = 0.5 + random() * 0.6;
        (blade % 3 ? grass : grassTips).add(leaf, [x + random() * 0.2, y, z + random() * 0.2], [s, s, s], [0, random() * Math.PI * 2, 0]);
      }
      if (i % 9 === 0) {
        flowers.add(sphere, [x, y + 0.26, z], [0.08, 0.06, 0.08]);
        flowers.add(sphere, [x + 0.13, y + 0.19, z + 0.08], [0.06, 0.05, 0.06]);
      }
    }
  }
  bark.finish(group, "Thick tree trunks", true);
  roots.finish(group, "Tree roots");
  leaves.finish(group, "Rounded leafy canopies", true);
  sunlitLeaves.finish(group, "Sunlit leaf clusters", true);
  shrub.finish(group, "Meadow shrubs", true);
  stems.finish(group, "Ivory mushroom stems");
  caps.finish(group, "Red mushroom caps");
  spots.finish(group, "Cream mushroom spots");
  grass.finish(group, "Grass clumps");
  grassTips.finish(group, "Golden green blades");
  rocks.finish(group, "Meadow stones", true);
  flowers.finish(group, "Wildflowers");
  [sphere, trunk, root, stem, cap, underside, leaf].forEach((geometry) => geometry.dispose());

  // Soft painted contact shadows anchor trees without mobile shadow-map cost.
  const shadowParts: BufferGeometry[] = [];
  const shadowBase = new PlaneGeometry(1, 1, 8, 8);
  shadowBase.rotateX(-Math.PI / 2);
  for (const [x, z, s] of treePositions) {
    const shadow = shadowBase.clone().scale(s * 4.8, 1, s * 3.5).translate(x + 0.4, 0, z - 0.4);
    const points = shadow.getAttribute("position");
    const colors = [];
    for (let i = 0; i < points.count; i++) {
      const px = points.getX(i), pz = points.getZ(i);
      points.setY(i, meadowHeight(px, pz) + 0.012);
      const r = Math.hypot((px - x - 0.4) / (s * 2.4), (pz - z + 0.4) / (s * 1.75));
      const strength = 1 - MathUtils.smoothstep(r, 0.2, 1);
      colors.push(0.3, 0.38, 0.13, strength * 0.19);
    }
    shadow.setAttribute("color", new Float32BufferAttribute(colors, 4));
    shadowParts.push(shadow);
  }
  const shadowGeometry = mergeGeometries(shadowParts, false);
  shadowParts.forEach((part) => part.dispose());
  shadowBase.dispose();
  if (shadowGeometry) group.add(new Mesh(shadowGeometry, new MeshBasicMaterial({
    vertexColors: true, transparent: true, depthWrite: false,
  })));
  return group;
}
