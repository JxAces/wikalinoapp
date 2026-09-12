import { BufferAttribute, Color, Float32BufferAttribute, Group, Matrix4, Mesh, MeshLambertMaterial } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/** Bake material colors into vertices so static decorations share a draw call.
 * Textured/transparent surfaces and animated objects stay separate.
 * Call only on an owned, static group before adding animated children.
 */
export function mergeColoredScenery(root: Group) {
  root.updateMatrixWorld(true);
  const inverse = new Matrix4().copy(root.matrixWorld).invert();
  const batches = new Map<string, Mesh[]>();
  root.traverse(object => {
    if (!(object instanceof Mesh) || !(object.material instanceof MeshLambertMaterial)) return;
    const m = object.material;
    if (m.map || m.alphaMap || m.transparent || m.opacity !== 1 || m.emissive.getHex() !== 0) return;
    const key = `${m.side}:${m.flatShading}`;
    const list = batches.get(key) ?? [];
    list.push(object);
    batches.set(key, list);
  });
  for (const meshes of batches.values()) {
    if (meshes.length < 2) continue;
    const geometries = meshes.map(mesh => {
      const geometry = mesh.geometry.clone();
      geometry.applyMatrix4(new Matrix4().multiplyMatrices(inverse, mesh.matrixWorld));
      const m = mesh.material as MeshLambertMaterial;
      const count = geometry.getAttribute("position").count;
      const oldColor = geometry.getAttribute("color");
      const colors = new Float32Array(count * 3);
      const color = new Color();
      for (let i = 0; i < count; i++) {
        color.copy(m.color);
        if (m.vertexColors && oldColor) {
          color.r *= oldColor.getX(i); color.g *= oldColor.getY(i); color.b *= oldColor.getZ(i);
        }
        color.toArray(colors, i * 3);
      }
      for (const name of Object.keys(geometry.attributes)) {
        if (name !== "position" && name !== "normal") geometry.deleteAttribute(name);
      }
      geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
      if (!geometry.index) geometry.setIndex(new BufferAttribute(Uint32Array.from({ length: count }, (_, i) => i), 1));
      return geometry;
    });
    const merged = mergeGeometries(geometries, false);
    geometries.forEach(geometry => geometry.dispose());
    if (!merged) throw new Error("Unable to batch static meadow colors");
    const source = meshes[0].material as MeshLambertMaterial;
    const material = new MeshLambertMaterial({ vertexColors: true, side: source.side, flatShading: source.flatShading });
    const mesh = new Mesh(merged, material);
    mesh.name = "Batched scenery colors";
    root.add(mesh);
    const oldGeometry = new Set(meshes.map(object => object.geometry));
    const oldMaterial = new Set(meshes.map(object => object.material as MeshLambertMaterial));
    meshes.forEach(object => object.removeFromParent());
    oldGeometry.forEach(geometry => geometry.dispose());
    oldMaterial.forEach(material => material.dispose());
  }
}
