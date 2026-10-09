import { DataTexture, LinearFilter, LinearMipmapLinearFilter, RepeatWrapping, RGBAFormat } from "three";

/** Periodic flow and surface slopes shared by both water draws (64 KiB).
 * Raw bytes avoid browser canvas and native image decoding. */
export function createWaterFlowTexture() {
  const size = 128, pixels = new Uint8Array(size * size * 4);
  function noise(x: number, y: number, cells: number) {
    x *= cells; y *= cells;
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = x - ix, fy = y - iy, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    function hash(a: number, b: number) {
      a = (a % cells + cells) % cells; b = (b % cells + cells) % cells;
      let n = Math.imul(a + 19, 374761393) + Math.imul(b + 7, 668265263);
      n = Math.imul(n ^ (n >>> 13), 1274126177);
      return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
    }
    const a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
    return (a + (b - a) * u) * (1 - v) + (c + (d - c) * u) * v;
  }
  const height = (x: number, y: number) => noise(x, y, 4) * .56 + noise(x, y, 8) * .3 + noise(x, y, 16) * .14;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = x / size, v = y / size, i = (y * size + x) * 4;
    pixels[i] = height(u, v) * 255;
    pixels[i + 1] = (noise(u, v, 12) * .55 + noise(u, v, 24) * .3 + noise(u, v, 48) * .15) * 255;
    pixels[i + 2] = Math.max(0, Math.min(255, 128 + (height(u + 1 / size, v) - height(u - 1 / size, v)) * 820));
    pixels[i + 3] = Math.max(0, Math.min(255, 128 + (height(u, v + 1 / size) - height(u, v - 1 / size)) * 820));
  }
  const map = new DataTexture(pixels, size, size, RGBAFormat);
  map.name = "Water flow, turbulence and ripple slopes";
  map.wrapS = map.wrapT = RepeatWrapping;
  map.magFilter = LinearFilter; map.minFilter = LinearMipmapLinearFilter;
  map.generateMipmaps = true; map.needsUpdate = true;
  return map;
}
