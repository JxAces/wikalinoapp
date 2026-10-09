import {
  Color, DataTexture, Float32BufferAttribute, Group, IcosahedronGeometry,
  LinearFilter, LinearMipmapLinearFilter, Mesh, MeshLambertMaterial,
  PlaneGeometry, RepeatWrapping, RGBAFormat,
} from "three";
import { distanceToHubTrail, HUB_BRIDGES, HUB_HOUSES, HUB_RIVER_X, HUB_VILLAGE_CLEARING, portalApproachClear } from "./hub-layout";
import { HUB_VEGETATION } from "./hub-vegetation";

const WIDTH = 110, DEPTH = 120, CENTER_Z = -4;
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t); };
function hash(x: number, y: number) {
  let n = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
function noise(x: number, y: number) {
  const ix = Math.floor(x), iy = Math.floor(y), u = smooth(x - ix), v = smooth(y - iy);
  const a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
  return (a + (b - a) * u) * (1 - v) + (c + (d - c) * u) * v;
}
function texture(pixels: Uint8Array<ArrayBuffer>, size: number, name: string) {
  const map = new DataTexture(pixels, size, size, RGBAFormat);
  map.name = name;
  map.magFilter = LinearFilter;
  map.minFilter = LinearMipmapLinearFilter;
  map.generateMipmaps = true;
  map.needsUpdate = true;
  return map;
}

/** Two detail channels in one tiny tile: fine grass blades and gritty earth. */
function groundDetail() {
  const size = 256, pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4, grain = hash(x, y);
    pixels[i] = 169 + grain * 23;
    pixels[i + 1] = 189 + grain * 26;
    pixels[i + 2] = 255; pixels[i + 3] = 255;
  }
  for (let blade = 0; blade < 4200; blade++) {
    const x = hash(blade, 1) * size, y = hash(blade, 2) * size;
    const angle = hash(blade, 3) * Math.PI * 2, length = 2 + hash(blade, 4) * 10;
    const tone = 171 + hash(blade, 5) * 76;
    for (let step = 0; step < length; step++) {
      const t = step / length;
      const px = (Math.floor(x + Math.cos(angle) * step + Math.sin(t * Math.PI) * 1.5) + size) % size;
      const py = (Math.floor(y + Math.sin(angle) * step) + size) % size;
      pixels[(py * size + px) * 4] = tone - t * 14;
    }
  }
  // Tiny embedded gravel has a dark rim and a sunlit face, rather than white dots.
  for (let stone = 0; stone < 580; stone++) {
    const cx = Math.floor(hash(stone, 6) * size), cy = Math.floor(hash(stone, 7) * size);
    const rx = 1 + hash(stone, 8) * 2, ry = .7 + hash(stone, 9) * 1.3;
    for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) {
      const r = x * x / (rx * rx) + y * y / (ry * ry);
      if (r > 1) continue;
      const i = (((cy + y + size) % size) * size + (cx + x + size) % size) * 4;
      pixels[i + 1] = r > .7 ? 142 : 205 + (y < 0 ? 27 : -15);
    }
  }
  const map = texture(pixels, size, "Grass blades and embedded gravel");
  map.wrapS = map.wrapT = RepeatWrapping;
  map.repeat.set(WIDTH / 2.4, DEPTH / 2.4);
  return map;
}

type GroundStone = { x: number; z: number; radius: number; height: number };

function stonePlan(): GroundStone[] {
  const stones: GroundStone[] = [];
  for (let i = 0; i < 250 && stones.length < 30; i++) {
    // River shingle, then scattered meadow and woodland stones.
    const bank = i < 18;
    const x = bank ? HUB_RIVER_X + (i % 2 ? -1 : 1) * (3.25 + hash(i, 12) * .75) : -33 + hash(i, 13) * 67;
    const z = bank ? -24 + hash(i, 14) * 53 : -37 + hash(i, 15) * 66;
    const radius = .23 + hash(i, 16) * .3;
    if (Math.abs(x - HUB_RIVER_X) < 3.15 || (x < -18 && z < -25)
      || distanceToHubTrail(x, z) < 1.5 + radius || portalApproachClear(x, z, radius)
      || (bank && HUB_BRIDGES.some(bridge => Math.abs(z - bridge) < 2.8))
      || HUB_HOUSES.some(h => Math.abs(x - h.x) < 3.7 && Math.abs(z - h.z) < 3.5)
      || Math.hypot(x - HUB_VILLAGE_CLEARING.x, z - HUB_VILLAGE_CLEARING.z) < HUB_VILLAGE_CLEARING.radius - 1
      || Math.hypot(x - 25, z - 23) < 4
      || stones.some(stone => Math.hypot(x - stone.x, z - stone.z) < 1.2)) continue;
    stones.push({ x, z, radius, height: .12 + hash(i, 17) * .17 });
  }
  return stones;
}
export const HUB_GROUND_STONES = stonePlan();

/** Baked once: irregular path edges, damp banks, soil and soft contact shadows.
 * World-sized color avoids obvious repeated patches; no per-frame CPU work. */
function terrainColor() {
  const size = 512, pixels = new Uint8Array(size * size * 4);
  const grass = new Color(0x71984a), sunGrass = new Color(0x8ea75b);
  const earth = new Color(0x9b8862), dampEarth = new Color(0x65745a);
  const color = new Color();
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const wx = (x / (size - 1) - .5) * WIDTH;
    const wz = (.5 - y / (size - 1)) * DEPTH + CENTER_Z;
    const patch = noise(wx * .13, wz * .13);
    const edge = (noise(wx * 2.2, wz * 2.2) - .5) * .28;
    const path = 1 - smooth((distanceToHubTrail(wx, wz) + edge - .58) / .78);
    const bank = 1 - smooth((Math.abs(wx - HUB_RIVER_X) - 2.55) / 1.15);
    const woodland = smooth((wx - 1) / 5) * smooth((-wz - 12) / 7);
    const litter = woodland * smooth((noise(wx * .42, wz * .42) - .46) / .35) * .38;
    const soil = Math.max(path, bank * .78, litter);
    color.copy(grass).lerp(sunGrass, patch * .7);
    color.lerp(earth, Math.max(path, litter)).lerp(dampEarth, bank * .65);
    color.multiplyScalar(.92 + noise(wx * .8, wz * .8) * .14);
    const i = (y * size + x) * 4;
    pixels[i] = color.r * 255; pixels[i + 1] = color.g * 255; pixels[i + 2] = color.b * 255;
    pixels[i + 3] = soil * 255;
  }
  function shade(cx: number, cz: number, rx: number, rz: number, opacity: number, core = 0) {
    const px = (cx / WIDTH + .5) * (size - 1), py = (.5 - (cz - CENTER_Z) / DEPTH) * (size - 1);
    const sx = rx / WIDTH * (size - 1), sy = rz / DEPTH * (size - 1);
    for (let y = Math.max(0, Math.floor(py - sy)); y <= Math.min(size - 1, py + sy); y++) {
      for (let x = Math.max(0, Math.floor(px - sx)); x <= Math.min(size - 1, px + sx); x++) {
        const radius = Math.hypot((x - px) / sx, (y - py) / sy);
        if (radius >= 1) continue;
        const amount = (1 - smooth((radius - core) / (1 - core))) * opacity;
        const i = (y * size + x) * 4;
        for (let channel = 0; channel < 3; channel++) pixels[i + channel] *= 1 - amount;
      }
    }
  }
  for (const plant of HUB_VEGETATION) {
    shade(plant.x, plant.z, plant.bush ? .8 : 1, plant.bush ? .7 : .85, .4);
    if (!plant.bush) shade(plant.x + .9, plant.z - .7, 2.5, 1.85, .22);
  }
  for (const stone of HUB_GROUND_STONES) shade(stone.x + .07, stone.z - .05, stone.radius * 1.6, stone.radius * 1.35, .58);
  for (const house of HUB_HOUSES) shade(house.x + .2, house.z - .2, 3.4, 2.8, .64, .58);
  return texture(pixels, size, "Baked earth paths, riverbanks and ground shade");
}

class HubGroundMaterial extends MeshLambertMaterial {
  // An owned texture property lets disposeWorldObject release it with map.
  readonly terrainMap = terrainColor();
  constructor() {
    super({ map: groundDetail(), vertexColors: true });
    this.onBeforeCompile = shader => {
      shader.uniforms.terrainMap = { value: this.terrainMap };
      shader.vertexShader = "varying vec2 groundUv;\n" + shader.vertexShader.replace(
        "#include <begin_vertex>", "#include <begin_vertex>\n groundUv = uv;",
      );
      shader.fragmentShader = "varying vec2 groundUv; uniform sampler2D terrainMap;\n" + shader.fragmentShader.replace(
        "#include <map_fragment>", `
          vec4 terrain = texture2D(terrainMap, groundUv);
          vec2 grain = texture2D(map, vMapUv).rg;
          diffuseColor.rgb *= terrain.rgb * mix(grain.r, grain.g, terrain.a) * 1.25;
        `,
      );
    };
  }
  customProgramCacheKey() { return "wikalino-ground-detail-v1"; }
}

export function createHubGrass() {
  const terrain = new PlaneGeometry(WIDTH, DEPTH, 26, 30);
  terrain.rotateX(-Math.PI / 2); terrain.translate(0, 0, CENTER_Z);
  const position = terrain.getAttribute("position"), colors = new Float32Array(position.count * 3);
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i), z = position.getZ(i);
    const edge = Math.max(-x - 38, x - 40, -z - 42, z - 34, 0);
    const rise = Math.min(1, edge / 10);
    position.setY(i, -.07 + rise * rise * (4 + Math.sin(x * .16 + z * .12) * 1.8));
    const shade = .96 + Math.sin(x * .19 + z * .24) * .04;
    colors.set([shade, shade, shade], i * 3);
  }
  terrain.setAttribute("color", new Float32BufferAttribute(colors, 3));
  terrain.computeVertexNormals();
  const mesh = new Mesh(terrain, new HubGroundMaterial());
  mesh.name = "Painted leafy grass and rolling banks";
  return mesh;
}

/** Small solid stones join the existing region batch, adding no draw calls. */
export function addHubGroundStones(parent: Group) {
  const grey = new Color(0x879093), moss = new Color(0x637747), shade = new Color();
  for (const [index, stone] of HUB_GROUND_STONES.entries()) {
    const geometry = new IcosahedronGeometry(1, 0);
    const p = geometry.getAttribute("position"), colors = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const warp = .9 + noise(x * 3 + index, z * 3) * .2;
      p.setXYZ(i, x * warp, y * (.94 + Math.sin(x * 4 + index) * .08), z * warp);
      shade.copy(grey).lerp(moss, Math.max(0, y) * (index % 3 ? .4 : .7));
      shade.multiplyScalar(.83 + noise(x * 6 + index, z * 6) * .26).toArray(colors, i * 3);
    }
    geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();
    const rock = new Mesh(geometry, new MeshLambertMaterial({ vertexColors: true }));
    rock.name = "Weathered ground stone";
    rock.scale.set(stone.radius, stone.height + .06, stone.radius * .8);
    rock.rotation.y = hash(index, 20) * Math.PI * 2;
    rock.position.set(stone.x, -.055, stone.z);
    parent.add(rock);
  }
}
