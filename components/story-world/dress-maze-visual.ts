import { BoxGeometry, BufferGeometry, Color, CylinderGeometry, DoubleSide, Float32BufferAttribute, Group, Mesh, MeshLambertMaterial, Object3D } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { mergeColoredScenery } from "./merge-colored-scenery";
import { DRESS_MAZE_WALLS } from "./dress-maze";

const FABRICS = [0xd92b69, 0xeda923, 0x079b89, 0xf0d8bd, 0x263844, 0xef6929, 0xa33357, 0x38799f, 0xf3ece0, 0x7c5091];

/** Fixed pleated cloth volumes with baked stripes/prints, not flat cutouts. */
function garment(index: number) {
  const kind = index % 5;
  const length = [1.75, 1.35, 1.62, 1.05, 1.5][kind];
  const widths = kind === 3 ? [0.19,0.24,0.23,0.22,0.23,0.24] : [0.13,0.23,0.14,0.21,0.26,0.3];
  const positions: number[] = [], colors: number[] = [], indices: number[] = [];
  const base = new Color(FABRICS[index % FABRICS.length]);
  const trim = new Color(index % 2 ? 0xf5dc9e : 0x273946);
  for (let row = 0; row < 6; row++) for (let segment = 0; segment <= 8; segment++) {
    const angle = segment / 8 * Math.PI * 2;
    const pleat = 1 + Math.cos(angle * 4 + index * 0.4) * 0.13;
    positions.push(Math.cos(angle) * widths[row] * pleat,
      -row / 5 * length + (row === 5 ? Math.sin(angle * 3 + index) * 0.045 : 0),
      Math.sin(angle) * (0.045 + row * 0.006) * pleat);
    const color = base.clone();
    if ((kind === 1 && row % 2 === 0) || (kind === 4 && (row + segment) % 3 === 0)) color.lerp(trim, 0.75);
    else if (kind === 2 && row === 5) color.lerp(trim, 0.7);
    color.multiplyScalar(0.84 + 0.16 * Math.cos(angle * 4));
    colors.push(color.r, color.g, color.b);
    if (row < 5 && segment < 8) {
      const a = row * 9 + segment;
      indices.push(a,a+9,a+1,a+1,a+9,a+10);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions,3));
  geometry.setAttribute("color", new Float32BufferAttribute(colors,3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}

/** Dense clothing-market racks follow the existing maze collision layout. */
export function createDressMaze() {
  const root = new Group();
  root.name = "Sandaang Damit — clothing rack maze";
  const parts = new Map<number, BufferGeometry[]>();
  const transform = new Object3D();
  function add(color: number, geometry: BufferGeometry, x: number, y: number, z: number, angle = 0) {
    transform.position.set(x, y, z);
    transform.rotation.set(0, angle, 0);
    transform.updateMatrix();
    geometry.applyMatrix4(transform.matrix);
    const batch = parts.get(color) ?? [];
    batch.push(geometry);
    parts.set(color, batch);
  }
  const fabricParts: BufferGeometry[] = [];
  let outfit = 0;
  for (const wall of DRESS_MAZE_WALLS) {
    add(0x665d54, new BoxGeometry(wall.w, 0.12, wall.d), wall.x, 0.06, wall.z);
    const alongX = wall.w > wall.d;
    const length = Math.max(wall.w, wall.d);
    const angle = alongX ? 0 : Math.PI / 2;
    add(0x41484b, new BoxGeometry(length, 0.055, 0.055), wall.x, 2.5, wall.z, angle);
    for (let post=0; post<=Math.ceil(length/3); post++) {
      const offset = -length/2 + post*length/Math.ceil(length/3);
      add(0x565d60, new CylinderGeometry(0.032,0.032,2.5,5), wall.x+(alongX?offset:0),1.25,wall.z+(alongX?0:offset));
    }
    const count = Math.max(1, Math.floor(length / 0.94));
    for (let i = 0; i < count; i++) {
      const offset = ((i + 0.5) / count - 0.5) * length;
      const x = wall.x + (alongX ? offset : 0), z = wall.z + (alongX ? 0 : offset);
      const index = outfit++, variant = index % 5;
      const turn = angle + Math.sin(index*2.3)*0.15;
      const top = 2.23 - (index%3)*0.035;
      const cloth = garment(index);
      cloth.rotateY(turn); cloth.translate(x,top,z);
      fabricParts.push(cloth);
      add(0x343a3c, new CylinderGeometry(0.012,0.012,2.5-top,5),x,(2.5+top)/2,z);
      // Triangular hangers remain visible above the neckline.
      for (const side of [-1,1]) {
        const hanger = new BoxGeometry(0.27,0.018,0.02);
        hanger.rotateZ(-side*0.65); hanger.translate(side*0.105,0.065,0);
        add(0x343a3c,hanger,x,top,z,turn);
      }
      add(0x343a3c,new BoxGeometry(0.43,0.018,0.02),x,top-0.02,z,turn);
      if (variant===3 || variant===4) for (const side of [-1,1]) {
        const sleeve = new CylinderGeometry(0.065,0.085,variant===3?0.25:0.48,6);
        sleeve.rotateZ(side*0.45); sleeve.translate(side*0.24,-0.3,0);
        add(FABRICS[index%FABRICS.length],sleeve,x,top,z,turn);
      }
      if (variant===0) add(0xc8aa70,new BoxGeometry(0.3,0.035,0.13),x,top-0.69,z,turn);
      if (i%3===0) for (let fold=0;fold<3;fold++) {
        add(FABRICS[(index+fold+3)%FABRICS.length],new BoxGeometry(0.38-fold*0.025,0.045,0.15),x,0.17+fold*0.045,z,angle+fold*0.06);
      }
    }
  }
  for (const [color, geometries] of parts) {
    // Shape and box primitives differ in indexing; normalize before merging.
    const normalized = geometries.map(geometry => geometry.index ? geometry.toNonIndexed() : geometry);
    const merged = mergeGeometries(normalized, false);
    new Set([...geometries, ...normalized]).forEach(geometry => geometry.dispose());
    if (merged) root.add(new Mesh(merged, new MeshLambertMaterial({ color, side: DoubleSide })));
  }
  const fabric = mergeGeometries(fabricParts,false);
  fabricParts.forEach(geometry=>geometry.dispose());
  if(fabric) root.add(new Mesh(fabric,new MeshLambertMaterial({vertexColors:true,side:DoubleSide})));
  mergeColoredScenery(root);
  root.userData.garmentCount=outfit;
  root.traverse(object => { object.updateMatrix(); object.matrixAutoUpdate = false; });
  return root;
}
