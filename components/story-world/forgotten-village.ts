import { BoxGeometry, BufferGeometry, CylinderGeometry, Group, Mesh, MeshLambertMaterial, Object3D, PlaneGeometry } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { mergeColoredScenery } from "./merge-colored-scenery";

export const VILLAGE_STORY = "m1-story-3";
export const VILLAGE_BUILDINGS = [
  { x: -5.4, z: 8, w: 2.4, d: 2.6 },
  { x: 5.4, z: 8, w: 2.4, d: 2.6 },
  { x: -5.4, z: 2, w: 2.4, d: 2.6 },
  { x: 5.4, z: 2, w: 2.4, d: 2.6 },
  { x: -5.4, z: -4, w: 2.4, d: 2.6 },
  { x: 5.4, z: -4, w: 2.4, d: 2.6 },
  { x: 0, z: -11, w: 7.2, d: 3 },
];
export function canStandInVillage(x: number, z: number) {
  return !VILLAGE_BUILDINGS.some(building => Math.abs(x-building.x)<building.w/2+0.42 && Math.abs(z-building.z)<building.d/2+0.42);
}
export function moveThroughVillage(position: {x:number;z:number}, dx:number, dz:number) {
  const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/0.15));
  for(let i=0;i<steps;i++) {
    if(canStandInVillage(position.x+dx/steps,position.z)) position.x+=dx/steps;
    if(canStandInVillage(position.x,position.z+dz/steps)) position.z+=dz/steps;
  }
}

/** A symbolic village of lost meaning, with a school linking back to Mimi's
 * discovery of compassion. Blank plaques are deliberate, not missing textures.
 */
export function createForgottenVillage() {
  const root=new Group(); root.name="Nayon ng mga Nakalimutang Kuwento";
  const batches=new Map<number,BufferGeometry[]>();
  const transform=new Object3D();
  function add(color:number,geometry:BufferGeometry,x:number,y:number,z:number,rotation=[0,0,0]) {
    transform.position.set(x,y,z);transform.rotation.set(rotation[0],rotation[1],rotation[2]);transform.updateMatrix();
    geometry.applyMatrix4(transform.matrix);
    const parts=batches.get(color)??[];parts.push(geometry);batches.set(color,parts);
  }
  function box(color:number,x:number,y:number,z:number,w:number,h:number,d:number,rotation=[0,0,0]) {
    add(color,new BoxGeometry(w,h,d),x,y,z,rotation);
  }
  add(0x777d70,new PlaneGeometry(60,80),0,-0.03,-7,[-Math.PI/2,0,0]);
  box(0xa69b81,0,-0.01,1.5,7.1,0.035,24);
  VILLAGE_BUILDINGS.forEach((house,index)=>{
    const school=index===6, w=house.w,d=house.d,x=house.x,z=house.z;
    const wall=school?0xaba58f:index%2?0x8b8977:0x9f947a;
    box(0x655d50,x,0.5,z,w,0.14,d);
    for(const side of [-1,1]) for(const end of [-1,1]) box(0x625746,x+side*(w/2-0.15),0.25,z+end*(d/2-0.15),0.13,0.5,0.13);
    box(wall,x,1.6,z,w,2.1,d);
    // Weathered nipa roofs: two sloping halves with a dark ridge.
    for(const side of [-1,1]) box(0x77715c,x+side*w*0.26,2.96,z,w*0.63,0.16,d+0.45,[0,0,-side*0.45]);
    box(0x504f45,x,3.27,z,0.13,0.12,d+0.5);
    const front=z+d/2+0.02;
    box(0x454b43,x,1.4,front,school?1.05:0.58,1.65,0.06);
    for(const side of [-1,1]) {
      const wx=x+side*w*0.32;
      box(0xced0b4,wx,1.85,front,school?1.2:0.54,0.63,0.07);
      for(let bar=-1;bar<=1;bar++) box(0x666858,wx+bar*(school?0.35:0.16),1.85,front+0.05,0.035,0.65,0.02);
    }
    // Amakan-inspired woven strips and uneven boards.
    for(let board=0;board<5;board++) box(0x847d67,x,0.8+board*0.27,front+0.035,w,0.025,0.025);
    for(let post=0;post<4;post++) box(0x736e5c,x-w/2+0.15+post*(w-0.3)/3,1.6,front+0.035,0.025,2,0.025);
    // Faded, empty sign above each doorway: names and stories are forgotten.
    box(0xc1b998,x,2.45,front+0.065,school?2.7:0.75,0.27,0.05);
    if(school) {
      box(0x344c42,-1.9,1.18,front+0.1,1.35,0.75,0.08);
      // Two empty desks recall the brothers whose absence Mimi learns to understand.
      for(const deskX of [-1.1,1.1]) {
        box(0x8b7558,deskX,0.69,-8.9,0.75,0.1,0.55);
        for(const side of [-1,1]) box(0x665b47,deskX+side*0.27,0.32,-8.9,0.07,0.64,0.42);
      }
    }
  });
  // Vacant sari-sari stall outside the eastern lane.
  box(0x686b59,8.4,0.9,5,2,1.8,1.5);
  box(0xb1a27b,8.4,1.95,5.3,2.4,0.12,2,[0.12,0,0]);
  box(0x313f38,8.4,1.28,5.78,1.6,0.6,0.05);
  // Quiet waiting shed and disused notice board outside the western lane.
  for(const x of [-9.6,-7.6]) box(0x736a55,x,1.1,0,0.12,2.2,0.12);
  box(0x7f7963,-8.6,2.3,0,2.7,0.15,1.7,[0.05,0,0]);
  box(0x85765f,-8.6,0.55,0,2.1,0.13,0.6);
  box(0x5c6658,-8.6,1.6,-0.4,1.8,0.85,0.08);
  // Blank story plaques by each question clearing.
  for(const [x,z] of [[-3,8.2],[3,3.2],[-3,-1.8]]) {
    box(0x686455,x,0.38,z,0.08,0.76,0.08);
    box(0xc3b797,x,0.82,z,0.55,0.38,0.08);
  }
  for(let i=0;i<14;i++) {
    const x=(i%2?-1:1)*(8.4+(i%3)*0.9),z=12-i*2;
    add(0x667360,new CylinderGeometry(0.02,0.13,0.45,5),x,0.2,z);
  }
  for(const [color,parts] of batches) {
    const geometry=mergeGeometries(parts,false);parts.forEach(part=>part.dispose());
    if(geometry) root.add(new Mesh(geometry,new MeshLambertMaterial({color})));
  }
  mergeColoredScenery(root);
  root.traverse(object=>{object.updateMatrix();object.matrixAutoUpdate=false;});
  return root;
}
