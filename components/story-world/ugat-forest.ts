import { BufferGeometry, CircleGeometry, CylinderGeometry, Group, Mesh, MeshBasicMaterial, MeshLambertMaterial, Object3D, PlaneGeometry, SphereGeometry } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import { UGAT_SCROLL_POSITIONS } from "./story-world.constants";
export { UGAT_STORY } from "./story-world.constants";
export const UGAT_SWAMPS = [
  { x: 0, z: 5, rx: 1.9, rz: 2 },
  { x: -4, z: 0.5, rx: 1.6, rz: 1.8 },
  { x: 3.9, z: -4.5, rx: 1.65, rz: 1.7 },
];
export const UGAT_TREES = [
  [-6,10],[-6,5],[-6,-2],[-6,-7],[6,9],[6,4],[6,-1],[6,-8],
  [-1,1],[1,-2],[-1,-6],[2,8],[-9,13],[9,12],[-9,3],[9,0],
  [-9,-9],[9,-11],[-5,-12],[0,-12],[5,-12],[-11,-18],[10,-19],
];
export function canStandInUgat(x: number, z: number) {
  return !UGAT_SWAMPS.some(pool => ((x - pool.x) / (pool.rx + 0.42)) ** 2 + ((z - pool.z) / (pool.rz + 0.42)) ** 2 < 1)
    && !UGAT_TREES.some(([tx, tz]) => Math.hypot(x - tx, z - tz) < 0.82);
}
export function moveThroughUgat(position: { x: number; z: number }, dx: number, dz: number) {
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.15));
  for (let i = 0; i < steps; i++) {
    if (canStandInUgat(position.x + dx / steps, position.z)) position.x += dx / steps;
    if (canStandInUgat(position.x, position.z + dz / steps)) position.z += dz / steps;
  }
}

/** Tangled roots symbolize the story's entrenched problems; the forest is a
 * visual metaphor, not a claim that the original story takes place in a swamp.
 * Emissive-looking basic materials avoid point lights, bloom and shadow maps.
 */
export function createUgatForest() {
  const root = new Group();
  root.name = "Ugat — tangled roots at night";
  const batches = new Map<string, BufferGeometry[]>();
  const transform = new Object3D();
  function add(color: number, geometry: BufferGeometry, x: number, y: number, z: number, scale = [1,1,1], rotation = [0,0,0], glow = false) {
    transform.position.set(x,y,z); transform.scale.set(scale[0],scale[1],scale[2]); transform.rotation.set(rotation[0],rotation[1],rotation[2]); transform.updateMatrix();
    geometry.applyMatrix4(transform.matrix);
    const key = `${color}:${glow}`;
    const list = batches.get(key) ?? []; list.push(geometry); batches.set(key,list);
  }
  add(0x142e2b, new PlaneGeometry(60,80), 0,-0.03,-7,[1,1,1],[-Math.PI/2,0,0]);
  UGAT_TREES.forEach(([x,z], i) => {
    const height = 3.8 + (i % 3) * 0.5;
    add(0x30413c,new CylinderGeometry(0.19,0.43,height,7),x,height/2,z);
    for (let crown = 0; crown < 3; crown++) {
      add(0x20584e,new SphereGeometry(1,8,6),x + (crown-1)*0.65,height + (crown%2)*0.5,z,[1.05,0.8,1]);
      add(0x6dcfc0,new SphereGeometry(0.065,5,4),x+(crown-1)*0.6,height-0.4,z+0.8,[1,1.5,1],[0,0,0],true);
    }
    for (let branch = 0; branch < 5; branch++) {
      const angle = branch * Math.PI*2/5 + i;
      add(0x30413c,new CylinderGeometry(0.04,0.16,1.2,5),x+Math.sin(angle)*0.42,0.13,z+Math.cos(angle)*0.42,[1,1,1],[Math.cos(angle)*1.35,0,-Math.sin(angle)*1.35]);
      add(0x5aa9a2,new CylinderGeometry(0.015,0.035,1,5),x+Math.sin(angle)*0.4,0.22,z+Math.cos(angle)*0.4,[1,1,1],[Math.cos(angle)*1.35,0,-Math.sin(angle)*1.35],true);
    }
  });
  for (const pool of UGAT_SWAMPS) {
    add(0x28544e,new CircleGeometry(1,28),pool.x,0.005,pool.z,[pool.rx+0.16,pool.rz+0.16,1],[-Math.PI/2,0,0]);
    add(0x153e49,new CircleGeometry(1,28),pool.x,0.012,pool.z,[pool.rx,pool.rz,1],[-Math.PI/2,0,0],true);
    for (let i=0;i<6;i++) {
      const angle=i*2.399;
      add(0x527e64,new CircleGeometry(0.16,8),pool.x+Math.sin(angle)*pool.rx*0.6,0.024,pool.z+Math.cos(angle)*pool.rz*0.6,[1,1,1],[-Math.PI/2,0,0]);
      add(0x93d6a0,new SphereGeometry(0.035,4,3),pool.x+Math.sin(angle)*pool.rx,0.55+(i%3)*0.2,pool.z+Math.cos(angle)*pool.rz,[1,1,1],[0,0,0],true);
    }
  }
  // Small pools of light mark clearings without drawing a route to each scroll.
  UGAT_SCROLL_POSITIONS.forEach(({x,z}) => add(0x385f51,new CircleGeometry(1.4,20),x,0.008,z,[1,1,1],[-Math.PI/2,0,0]));
  add(0xc5e7e2,new SphereGeometry(1,12,8),-9,14,-25,[1,1,1],[0,0,0],true);
  for (const [key,geometries] of batches) {
    const [color,glow]=key.split(":");
    const merged=mergeGeometries(geometries,false);
    geometries.forEach(geometry=>geometry.dispose());
    if(merged) root.add(new Mesh(merged,glow==="true" ? new MeshBasicMaterial({color:Number(color)}) : new MeshLambertMaterial({color:Number(color)})));
  }
  root.traverse(object=>{object.updateMatrix();object.matrixAutoUpdate=false;});
  return root;
}
