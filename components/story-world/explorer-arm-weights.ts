import { Box3, BufferAttribute, Mesh, Vector3, type Object3D } from "three";
import type { PlayerCharacterId } from "@/data/player-characters";

/** Identify the separate forearm/hand surfaces below the armpits, then feather
 * their attachment at the shoulders. Using connected surfaces keeps every
 * finger moving together and excludes adjacent skirts, belts and trousers.
 * Calculated once at loading; baked walking poses share the same small buffer.
 */
export function prepareExplorerArmWeights(root: Object3D, character: PlayerCharacterId) {
  root.updateMatrixWorld(true);
  const bounds = new Box3().setFromObject(root), center = bounds.getCenter(new Vector3());
  const height = Math.max(0.001, bounds.max.y - bounds.min.y);
  const cutoff = character === "muslim" ? 0.62 : 0.64;
  const point = new Vector3();
  root.traverse(mesh => {
    if (!(mesh instanceof Mesh) || mesh.geometry.hasAttribute("explorerArmWeight")) return;
    const geometry = mesh.geometry, position = geometry.getAttribute("position");
    const count = position.count, xyz = new Float32Array(count * 3);
    const parent = Int32Array.from({ length: count }, (_, index) => index);
    const neighbours: number[][] = Array.from({ length: count }, () => []);
    const allowed = new Uint8Array(count);
    const find = (vertex: number): number => {
      while (parent[vertex] !== vertex) {
        parent[vertex] = parent[parent[vertex]];
        vertex = parent[vertex];
      }
      return vertex;
    };
    for (let vertex = 0; vertex < count; vertex++) {
      point.fromBufferAttribute(position, vertex).applyMatrix4(mesh.matrixWorld);
      const x = (point.x - center.x) / height, y = (point.y - bounds.min.y) / height;
      xyz.set([x, y, (point.z - center.z) / height], vertex * 3);
      allowed[vertex] = Math.abs(x) > 0.065 && y > 0.26 && y < cutoff ? 1 : 0;
    }
    const index = geometry.index;
    const edge = (a: number, b: number) => {
      neighbours[a].push(b); neighbours[b].push(a);
      if (allowed[a] && allowed[b] && xyz[a * 3] * xyz[b * 3] > 0) parent[find(a)] = find(b);
    };
    for (let offset = 0; offset < (index?.count ?? count); offset += 3) {
      const a = index ? index.getX(offset) : offset;
      const b = index ? index.getX(offset + 1) : offset + 1;
      const c = index ? index.getX(offset + 2) : offset + 2;
      edge(a, b); edge(b, c); edge(c, a);
    }
    // Hands can touch trousers in the scanned models. Keep those surfaces
    // separate when welding duplicate vertices; only join outer arm islands.
    const innerEdge = new Float32Array(count).fill(1);
    for (let vertex = 0; vertex < count; vertex++) {
      if (allowed[vertex]) {
        const component = find(vertex);
        innerEdge[component] = Math.min(innerEdge[component], Math.abs(xyz[vertex * 3]));
      }
    }
    const color = geometry.getAttribute("color");
    const sameColor = (a: number, b: number) => !color ||
      Math.abs(color.getX(a) - color.getX(b)) + Math.abs(color.getY(a) - color.getY(b)) + Math.abs(color.getZ(a) - color.getZ(b)) < 0.08;
    const seams = new Map<string, number[]>();
    for (let vertex = 0; vertex < count; vertex++) {
      const offset = vertex * 3;
      const key = `${Math.round(xyz[offset] * 100000)},${Math.round(xyz[offset + 1] * 100000)},${Math.round(xyz[offset + 2] * 100000)}`;
      const seam = seams.get(key);
      if (seam) seam.push(vertex); else seams.set(key, [vertex]);
    }
    for (const vertices of seams.values()) {
      const first = vertices[0];
      if (xyz[first * 3 + 1] >= cutoff - 0.09) continue;
      for (const vertex of vertices.slice(1)) {
        const a = find(first), b = find(vertex);
        if (allowed[first] && allowed[vertex] && innerEdge[a] >= 0.078 && innerEdge[b] >= 0.078 && sameColor(first, vertex)) {
          parent[a] = b;
          innerEdge[b] = Math.min(innerEdge[a], innerEdge[b]);
        }
      }
    }
    const groups = new Map<number, { vertices: number[]; minX: number; maxX: number; minY: number; skin: number }>();
    for (let vertex = 0; vertex < count; vertex++) {
      if (!allowed[vertex]) continue;
      const key = find(vertex);
      let group = groups.get(key);
      if (!group) { group = { vertices: [], minX: 1, maxX: 0, minY: 1, skin: 0 }; groups.set(key, group); }
      group.vertices.push(vertex);
      group.minX = Math.min(group.minX, Math.abs(xyz[vertex * 3]));
      group.maxX = Math.max(group.maxX, Math.abs(xyz[vertex * 3]));
      group.minY = Math.min(group.minY, xyz[vertex * 3 + 1]);
      if (!color || (color.getX(vertex) > color.getY(vertex) * 1.25 && color.getY(vertex) > color.getZ(vertex) * 1.1)) group.skin++;
    }
    let weights = new Float32Array(count);
    for (const group of groups.values()) {
      const bareArms = character === "student-girl" || character === "batang-pinoy";
      if (group.minX < 0.078 || group.maxX < 0.125 || group.minY < 0.30 ||
          (bareArms && group.skin < group.vertices.length * 0.6)) continue;
      for (const vertex of group.vertices) weights[vertex] = 1;
    }
    // GLB normal/color seams duplicate vertices. Join their weights after
    // classification so an elbow cannot split when its forearm moves.
    for (const vertices of seams.values()) {
      if (vertices.length < 2) continue;
      const first = vertices[0];
      if (xyz[first * 3 + 1] >= cutoff - 0.09) {
        for (const vertex of vertices.slice(1)) {
          neighbours[first].push(vertex); neighbours[vertex].push(first);
        }
      }
    }
    // Only feather the upper attachment. The hands and cuffs stay rigid.
    for (let pass = 0; pass < 12; pass++) {
      const next = weights.slice();
      for (let vertex = 0; vertex < count; vertex++) {
        if (xyz[vertex * 3 + 1] < cutoff - 0.09 || !neighbours[vertex].length) continue;
        let sum = weights[vertex] * 2;
        for (const neighbour of neighbours[vertex]) sum += weights[neighbour];
        next[vertex] = sum / (neighbours[vertex].length + 2);
      }
      for (const vertices of seams.values()) {
        if (vertices.length < 2 || xyz[vertices[0] * 3 + 1] < cutoff - 0.09) continue;
        const average = vertices.reduce((sum, vertex) => sum + next[vertex], 0) / vertices.length;
        for (const vertex of vertices) next[vertex] = average;
      }
      weights = next;
    }
    geometry.setAttribute("explorerArmWeight", new BufferAttribute(Uint8Array.from(weights, value => Math.round(value * 255)), 1, true));
    // These colored characters have no texture maps. Free the unused UV slot
    // so interpolated native poses still fit WebGL 1's eight attributes.
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    if (materials.every(material => !("map" in material) || !material.map)) geometry.deleteAttribute("uv");
  });
}
