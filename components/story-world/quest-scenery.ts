import { BoxGeometry, BufferGeometry, CylinderGeometry, Group, Mesh, MeshLambertMaterial, Object3D, PlaneGeometry } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { storySetting } from "./quest-progression";

/** Geometry is merged by color so the story props add only a few draw calls. */
export function createQuestScenery(storyId: string) {
  const root = new Group();
  const setting = storySetting(storyId);
  if (!setting) return root;
  const parts = new Map<number, BufferGeometry[]>();
  const transform = new Object3D();
  function box(color: number, x: number, y: number, z: number, w: number, h: number, d: number, angle = 0) {
    const geometry = new BoxGeometry(w, h, d);
    transform.position.set(x, y, z);
    transform.rotation.set(0, 0, angle);
    transform.updateMatrix();
    geometry.applyMatrix4(transform.matrix);
    parts.set(color, [...(parts.get(color) ?? []), geometry]);
  }
  const floor = new Mesh(new PlaneGeometry(17, 36), new MeshLambertMaterial({ color: setting.ground }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -0.025, -3);
  root.add(floor);

  if (storyId === "m1-story-1") {
    // Drawings pinned to display boards: the dresses are drawings, as in the ending.
    for (const side of [-1, 1]) for (let row = 0; row < 5; row++) {
      const x = side * 8.1, z = 9 - row * 6;
      box(0x785a42, x, 1.35, z, 1.25, 2.4, 0.16);
      box(0xfff1d4, x, 1.55, z + 0.1, 1.05, 1.5, 0.05);
      const color = [0xe89aaa, 0xf1ce62, 0x9ac8d3, 0xd3b1d9, 0xf7f0dc][row];
      box(color, x, 1.72, z + 0.14, 0.34, 0.4, 0.025);
      box(color, x, 1.28, z + 0.14, 0.65, 0.55, 0.025);
      box(color, x - 0.25, 1.78, z + 0.14, 0.22, 0.22, 0.025, -0.45);
      box(color, x + 0.25, 1.78, z + 0.14, 0.22, 0.22, 0.025, 0.45);
      box(0xdbaa49, x, 2.2, z + 0.15, 0.08, 0.08, 0.035);
    }
  } else if (storyId === "m1-story-2") {
    for (const side of [-1, 1]) for (let row = 0; row < 5; row++) {
      const x = side * 10, z = 9 - row * 6;
      box(0xb7b4a6, x, 1.8, z, 3.1, 3.6, 3);
      box(0x667b79, x, 3.65, z, 3.4, 0.28, 3.3);
      for (const offset of [-0.7, 0.7]) box(0x536b79, x + offset, 2.2, z + 1.52, 0.65, 1.1, 0.08);
      // Large exposed roots remain outside the walking road.
      for (let branch = 0; branch < 3; branch++) {
        const geo = new CylinderGeometry(0.08, 0.22, 3.2, 7);
        geo.rotateZ(Math.PI / 2 - side * 0.14);
        geo.rotateY(branch * 0.5);
        geo.translate(side * 8.1, 0.12, z + branch * 0.55);
        parts.set(0x6d5238, [...(parts.get(0x6d5238) ?? []), geo]);
      }
    }
  } else {
    box(0xf1deaa, 0, 2, -23, 15, 4, 3.5);
    box(0x467c70, 0, 4.1, -23, 16, 0.45, 4);
    box(0x715236, 0, 1.35, -21.2, 1.6, 2.7, 0.1);
    for (const x of [-5.5, -3, 3, 5.5]) box(0x92c8d3, x, 2.3, -21.2, 1.5, 1.4, 0.1);
    for (const side of [-1, 1]) for (let row = 0; row < 5; row++) {
      const x = side * 8, z = 9 - row * 6;
      box(0x967044, x, 0.9, z, 1.5, 0.18, 1);
      for (const dx of [-0.55, 0.55]) box(0x674d37, x + dx, 0.45, z, 0.12, 0.9, 0.7);
      box(0xeab976, x, 1.04, z, 0.48, 0.1, 0.6);
      box(0xf3edd9, x, 1.07, z, 0.43, 0.04, 0.56);
    }
    box(0x875f3c, -7.8, 1.75, -19, 2.5, 2, 0.2);
    box(0x264e42, -7.8, 1.75, -18.86, 2.25, 1.7, 0.08);
    for (let i = 0; i < 4; i++) box(0xede8d0, -7.8, 2.3 - i * 0.35, -18.8, 1.6 - i * 0.2, 0.025, 0.02);
  }
  for (const [color, geometries] of parts) {
    const merged = mergeGeometries(geometries);
    geometries.forEach(geometry => geometry.dispose());
    if (merged) root.add(new Mesh(merged, new MeshLambertMaterial({ color })));
  }
  return root;
}
