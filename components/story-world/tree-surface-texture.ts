import { DataTexture, LinearFilter, LinearMipmapLinearFilter, RGBAFormat } from "three";

/** One tiny shared atlas: bark on the left, overlapping leaves on the right.
 * Raw pixels work in Expo GL without image decoding or a browser canvas. */
export function createTreeSurfaceTexture() {
  const size = 128, width = size * 2;
  const pixels = new Uint8Array(width * size * 4);
  let seed = 8193;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const warp = x + Math.sin(y * .045) * 1.5 + Math.sin(y * .15 + x * .025) * .5;
    const grain = Math.pow(.5 + .5 * Math.sin(warp * 1.7), 10);
    const broad = .5 + .5 * Math.sin(warp * .35 + Math.sin(y * .024));
    const value = Math.round(202 + broad * 20 - grain * 24 + random() * 6);
    const at = (y * width + x) * 4;
    pixels.set([value, value, value, 255], at);
    pixels.set([117, 117, 117, 0], at + size * 4);
  }
  for (let leaf = 0; leaf < 1400; leaf++) {
    const cx = random() * size, cy = random() * size, angle = random() * Math.PI * 2;
    const length = 6 + random() * 5, halfWidth = 2.0 + random() * 2.1;
    const cos = Math.cos(angle), sin = Math.sin(angle), shade = 188 + random() * 52;
    for (let y = -12; y <= 12; y++) for (let x = -12; x <= 12; x++) {
      const along = (x * cos + y * sin) / length;
      const across = -x * sin + y * cos;
      const span = halfWidth * Math.pow(Math.max(0, 1 - Math.abs(along)), .7);
      if (Math.abs(along) > 1 || Math.abs(across) > span) continue;
      const px = (Math.round(cx + x) + size) % size, py = (Math.round(cy + y) + size) % size;
      const edge = Math.abs(across) / Math.max(span, .01);
      const vein = Math.abs(across) < .28 ? 12 : 0;
      const value = Math.round(shade - edge * 25 + across / halfWidth * 12 + vein);
      pixels.set([value, value, value, 255], (py * width + px + size) * 4);
    }
  }
  const texture = new DataTexture(pixels, width, size, RGBAFormat);
  texture.name = "Shared bark and leaf detail";
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}
