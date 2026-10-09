import { BufferGeometry, CylinderGeometry, Float32BufferAttribute, Group, Mesh, MeshLambertMaterial, SphereGeometry, Vector3 } from "three";
import { mottled, villagePalmFrond } from "./hub-storybook-art";

const UP = new Vector3(0, 1, 0);

/** Open ends are buried in the soil/crown; the rings form a flared, bent trunk. */
function taperedTrunk(height: number, seed: number, palm: boolean) {
  const positions: number[] = [], uv: number[] = [], indices: number[] = [];
  const radii = palm ? [.115, .087, .071, .052] : [.145, .076, .035];
  const segments = radii.length - 1;
  for (let ring = 0; ring <= segments; ring++) {
    const t = ring / segments;
    const leanX = Math.sin(seed) * t * t * (palm ? .55 : .25);
    const leanZ = Math.cos(seed) * t * (palm ? .24 : .14);
    for (let side = 0; side <= 5; side++) {
      const angle = side / 5 * Math.PI * 2 + Math.sin(t * 2) * .13;
      const radius = radii[ring] * height * (1 + .09 * Math.sin(angle * 3 + seed));
      positions.push(leanX + Math.cos(angle) * radius, t * height, leanZ + Math.sin(angle) * radius);
      uv.push(side / 5, t);
      if (ring < segments && side < 5) {
        const a = ring * 6 + side;
        indices.push(a, a + 6, a + 1, a + 1, a + 6, a + 7);
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return mottled(geometry, .08);
}

function buttressRoot() {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute([
    -.13, 0, -.03, .13, 0, -.03, 0, .5, 0, 0, 0, .68,
  ], 3));
  geometry.setAttribute("uv", new Float32BufferAttribute([0,0, 1,0, .5,1, .5,0], 2));
  geometry.setIndex([0,2,3, 1,3,2, 0,1,2, 0,3,1]);
  geometry.computeVertexNormals();
  return geometry;
}

/** Broad crowns and village palms share the same regional tree texture/batch. */
export function createHubTree(height: number, seed: number, palm = false) {
  const tree = new Group();
  tree.name = palm ? "Curved village palm" : "Branching broadleaf tree";
  function part(color: number, geometry: BufferGeometry, surface: number, x = 0, y = 0, z = 0) {
    const count = geometry.getAttribute("position").count;
    geometry.setAttribute("treeSurface", new Float32BufferAttribute(new Float32Array(count).fill(surface), 1));
    const mesh = new Mesh(geometry, new MeshLambertMaterial({ color, vertexColors: geometry.hasAttribute("color") }));
    mesh.position.set(x, y, z);
    tree.add(mesh);
    return mesh;
  }
  part(palm ? 0x887657 : 0x816446, taperedTrunk(height, seed, palm), 1);
  const topX = Math.sin(seed) * (palm ? .55 : .25), topZ = Math.cos(seed) * (palm ? .24 : .14);
  if (palm) {
    const crown = part(0x568d3b, mottled(new SphereGeometry(1, 8, 4), .1), 2, topX, height + .2, topZ);
    crown.scale.set(.47, .45, .47);
    for (let i = 0; i < 6; i++) {
      const leaf = part(i % 2 ? 0x508b3a : 0x709d46,
        villagePalmFrond(2.3 + (i % 2) * .3, .44, .65 + (i % 3) * .14), 3,
        topX, height + .2 + (i % 2) * .13, topZ);
      leaf.rotation.y = -i * Math.PI / 3 - seed;
    }
    for (let i = 0; i < 3; i++) {
      const angle = i * Math.PI * 2 / 3;
      const coconut = part(0x827047, new SphereGeometry(1, 6, 3), 0,
        topX + Math.cos(angle) * .28, height - .08, topZ + Math.sin(angle) * .28);
      coconut.scale.set(.16, .2, .16);
    }
  } else {
    for (let i = 0; i < 3; i++) {
      const angle = seed + i * Math.PI * 2 / 3;
      const root = part(0x795d41, buttressRoot(), 1, Math.sin(angle) * .16, .005, Math.cos(angle) * .16);
      root.rotation.y = angle;
      if (i === 2) continue;
      const start = new Vector3(topX * .35, height * (.52 + i * .065), topZ * .55);
      const end = new Vector3(Math.sin(angle) * .91, height + .15, Math.cos(angle) * .85);
      const direction = end.clone().sub(start);
      const branch = part(0x816446, new CylinderGeometry(.055, .14, direction.length(), 3, 1, true), 1);
      branch.position.copy(start).add(end).multiplyScalar(.5);
      branch.quaternion.setFromUnitVectors(UP, direction.normalize());
    }
    const clusters = [
      [topX - .40, height + .48, topZ - .07, 1.67, 1.17, 1.54],
      [.87, height + .26, .28, 1.37, .97, 1.30],
    ];
    clusters.forEach(([x,y,z,sx,sy,sz], i) => {
      const geometry = new SphereGeometry(1, i === 0 ? 8 : 7, 5);
      const positions = geometry.getAttribute("position");
      for (let vertex = 0; vertex < positions.count; vertex++) {
        const px = positions.getX(vertex), py = positions.getY(vertex), pz = positions.getZ(vertex);
        const ripple = 1 + .10 * Math.sin(px * 3.2 + seed + i) * Math.cos(pz * 4.3 - py);
        positions.setXYZ(vertex, px * ripple, py * ripple, pz * ripple);
      }
      geometry.computeVertexNormals();
      const crown = part([0x79a34a, 0x60923b][i], mottled(geometry, .10), 2, x, y, z);
      crown.scale.set(sx, sy, sz);
      crown.rotation.y = seed * .3 + i * .7;
    });
  }
  return tree;
}
