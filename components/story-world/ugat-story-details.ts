import { BoxGeometry, BufferGeometry, CircleGeometry, Color, Float32BufferAttribute, Mesh, Object3D, PlaneGeometry } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { UGAT_MEMORY_ART } from "./ugat-layout";
import { UGAT_SCENE_PLACEMENTS } from "./ugat-scene-placement";
import { ugatMemoryMaterial } from "./ugat-memory-material";

type Point = [number,number,number];

/** Four domestic memories, with real openings, textured wood and cloth. */
export function createUgatStoryDetails(time:{value:number}) {
  const parts:BufferGeometry[]=[],transform=new Object3D(),tint=new Color();
  let scene=0;
  const wood=0x795338,edge=0xad8153,paper=0xf5ebd2,wall=0xd5c5a3;
  function part(g:BufferGeometry,color:number,position:Point,tile=0,rotation:Point=[0,0,0],motion=0) {
    transform.position.set(...position);transform.rotation.set(...rotation);transform.updateMatrix();g.applyMatrix4(transform.matrix);
    const placement=UGAT_SCENE_PLACEMENTS[scene];
    g.translate(-placement.fromX,0,-placement.fromZ);g.scale(placement.scale,placement.scale,placement.scale);g.rotateY(placement.angle);g.translate(placement.x,0,placement.z);
    const count=g.attributes.position.count,uv=g.getAttribute('uv'),colors=new Float32Array(count*3);
    tint.setHex(color);
    for(let i=0;i<count;i++) {
      uv.setXY(i,(tile%2)*.5+.008+uv.getX(i)*.484,Math.floor(tile/2)*.5+.008+uv.getY(i)*.484);
      const shade=.9+Math.max(0,g.attributes.normal.getY(i))*.1;
      colors.set([tint.r*shade,tint.g*shade,tint.b*shade],i*3);
    }
    g.setAttribute('color',new Float32BufferAttribute(colors,3));
    g.setAttribute('memoryMotion',new Float32BufferAttribute(new Float32Array(count).fill(motion),1));
    parts.push(g);
  }
  function box(color:number,x:number,y:number,z:number,w:number,h:number,d:number,tile=0,ry=0,motion=0) {
    part(new BoxGeometry(w,h,d),color,[x,y,z],tile,[0,ry,0],motion);
  }
  function disk(color:number,x:number,y:number,z:number,r:number,rx=0) {
    part(new CircleGeometry(r,12),color,[x,y,z],3,[rx,0,0]);
  }
  function floor(x:number,z:number,w:number,d:number) {
    box(wood,x,.016,z,w,.032,d);
    const count=Math.ceil(w/.26);
    for(let i=0;i<count;i++)box(i%3===0?0xb99062:0xc29a6b,x-w/2+(i+.5)*w/count,.037,z,w/count-.016,.018,d-.1);
  }
  function table(x:number,z:number,w=1.6) {
    box(edge,x,.79,z,w,.12,.85);
    box(wood,x,.68,z,w-.18,.16,.7);
    for(const side of [-1,1])for(const end of [-1,1])box(wood,x+side*(w/2-.12),.36,z+end*.3,.075,.72,.075);
  }
  function sheet(x:number,y:number,z:number,w=.43,d=.37,moving=false) {
    box(paper,x,y,z,w,.014,d,2,0,moving?1:0);
    for(let i=0;i<4;i++)box(0x8e8270,x+.02,y+.009,z-.11+i*.058,w*.71,.002,.009,2,0,moving?1:0);
  }
  function frame(x:number,y:number,z:number,w:number,h:number) {
    for(const side of [-1,1])box(wood,x+side*w/2,y,z,.075,h+.13,.09);
    for(const side of [-1,1])box(edge,x,y+side*h/2,z,w+.12,.075,.09);
  }
  function lowWall(x:number,z:number,w:number) {
    box(wall,x,.46,z,w,.85,.16,3);
    box(wood,x,.94,z,w+.13,.1,.24);
    for(const side of [-1,1])box(wood,x+side*(w/2-.065),1.0,z,.14,1.95,.18);
  }
  // The first corner holds the media he no longer wants to follow.
  const first=UGAT_MEMORY_ART[0];floor(-4.55,6.25,3.2,2.5);lowWall(-4.55,5.08,3.2);
  for(let i=0;i<4;i++)box(edge,first.x,.5,first.z-.25+i*.17,2.1,.09,.12);
  for(const side of [-1,1])box(wood,first.x+side*.82,.25,first.z,.12,.5,.5);
  for(let i=0;i<3;i++)box(wood,first.x,.7+i*.17,first.z-.34,2.1,.11,.07);
  sheet(first.x-.43,.557,first.z+.03,.62,.44,true);
  box(0x4f4133,first.x+.57,.745,first.z,.52,.37,.23);
  disk(0x252c27,first.x+.47,.74,first.z+.12,.115);
  for(let i=0;i<5;i++)box(0x797667,first.x+.47,.65+i*.039,first.z+.124,.17,.006,.008,3);
  box(0xd6c49b,first.x+.69,.82,first.z+.125,.11,.05,.01,2);
  disk(0xb1a785,first.x+.7,.68,first.z+.128,.028);
  box(0x777c6c,first.x+.7,1.035,first.z-.03,.012,.27,.012,3);
  box(wood,-5.78,.38,5.82,.57,.67,.51);
  box(0x64513b,-5.78,1.04,5.82,.67,.62,.49);
  box(0x243733,-5.8,1.065,6.08,.48,.42,.025,3);
  box(0x627971,-5.8,1.08,6.096,.415,.345,.013,3);
  for(const y of [.91,1.12])disk(0xc0aa7e,-5.505,y,6.08,.032);
  // A yellow ribbon recalls his hope at EDSA, without adding a new event.
  for(const side of [-1,1])box(0xe3bf5c,-3.13+side*.045,1.64,5.19,.065,.34,.02,1,side*.2);
  disk(0xe3bf5c,-3.13,1.79,5.205,.063);

  // The departure corner is an open doorway, still inside the family home.
  scene=1;
  const second=UGAT_MEMORY_ART[1];floor(5.55,.02,2.95,2.35);table(second.x,second.z);
  for(const side of [-1,1])box(wall,5.7+side*.99,1.18,-1.02,.76,2.3,.16,3);
  box(wall,5.7,2.47,-1.02,2.75,.3,.16,3);
  frame(5.7,1.23,-.91,1.08,2.4);
  box(0x819183,6.31,1.25,-.64,.81,2.25,.075,0,-.73);
  disk(0xc7ac68,6.02,1.18,-.32,.026);
  box(0x885d3b,second.x+.3,1.04,second.z,.6,.4,.38);
  for(const side of [-1,1])box(0xc6a171,second.x+.3+side*.19,1.045,second.z+.197,.055,.38,.018,1);
  box(0x4b4638,second.x+.3,1.295,second.z,.27,.04,.07);
  for(const side of [-1,1])box(0x4b4638,second.x+.3+side*.12,1.26,second.z,.035,.1,.07);
  box(0x78624a,6.5,.43,-.15,.58,.76,.6);
  for(const side of [-1,1])box(0xb49d74,6.5+side*.17,.43,.16,.048,.73,.02,1);
  box(0x3c3d33,6.5,.85,-.15,.24,.05,.08);
  sheet(second.x-.42,.865,second.z+.02,.41,.33,true);
  disk(0xb8815b,second.x-.42,.894,second.z+.01,.035,-Math.PI/2);

  // His own desk holds the planned gift, not a collectible or reward.
  scene=2;
  const third=UGAT_MEMORY_ART[2];floor(-5.25,-5.95,2.95,2.15);lowWall(-5.35,-6.66,2.85);table(third.x,third.z,1.9);
  sheet(third.x-.44,.865,third.z,.62,.47);
  for(let i=0;i<3;i++)box(0xe6d4ad,third.x-.45,.9+i*.018,third.z-.08,.4,.013,.31,2);
  box(0xc9d7b5,third.x+.43,.865,third.z+.02,.46,.018,.29,2);
  box(0xa68145,third.x+.43,.88,third.z+.02,.045,.008,.29,1);
  box(0xa68145,third.x+.43,.88,third.z+.02,.46,.008,.035,1);
  box(0x403d32,third.x-.07,.868,third.z+.27,.18,.016,.027,3,.3);
  // This unreflective framed panel is a metaphor for looking at oneself.
  box(0x89978b,-5.35,1.51,-6.555,.69,.71,.025,3);
  frame(-5.35,1.51,-6.53,.75,.77);

  // An open-front living room gives the ending a domestic setting.
  scene=3;
  floor(0,-10.52,7.2,2.9);
  const z=-11.75;
  for(const side of [-1,1]) {
    box(wall,side*2.39,1.62,z,2.42,3.2,.18,3);
    box(wood,side*3.5,1.62,-10.58,.14,3.23,2.5);
    box(wall,side*3.42,1.33,-10.58,.12,2.57,2.5,3);
    box(wood,side*1.14,2.12,z+.06,.12,1.85,.22);
    box(0x849684,side*1.6,2.12,z+.18,.68,1.69,.1,0,-side*.45);
    const curtain=new PlaneGeometry(.3,1.65,3,10),p=curtain.getAttribute('position');
    for(let i=0;i<p.count;i++)p.setZ(i,Math.cos(p.getX(i)*58)*.025);
    curtain.computeVertexNormals();part(curtain,0xeee1bf,[side*.96,2.14,z+.22],1,[0,0,0],3);
  }
  box(wall,0,.56,z,2.31,1.1,.18,3);box(wall,0,3.18,z,7.2,.23,.18,3);
  box(edge,0,1.2,z+.09,2.57,.12,.36);box(edge,0,3.01,z+.06,2.57,.1,.26);
  box(wood,0,2.1,z,.055,1.8,.1);box(wood,0,2.18,z,2.28,.055,.1);
  box(wood,0,3.33,-11.23,7.48,.12,1.34);
  for(let i=0;i<9;i++)box(0xa48054,-3.35+i*.84,3.24,-11.23,.08,.13,1.34);
  for(let i=0;i<16;i++)box(0xb9a98b,-3.3+i*.44,.61,z+.105,.015,1.12,.007,3);
  box(0x9c9f78,-.35,.069,-10.05,3.8,.012,1.45,1);
  const sx=-.4,sz=-10.6;
  box(wood,sx,.29,sz,2.36,.14,.82);
  box(0xb0b998,sx,.39,sz,2.16,.2,.74,1);
  box(0xa8b18d,sx,.85,sz-.3,2.18,.72,.18,1);
  for(const side of [-1,1]) {
    box(wood,sx+side*1.12,.59,sz,.12,.59,.79);
    box(wood,sx+side*.99,.13,sz,.1,.26,.63);
    box(0xc5c39b,sx+side*.82,.61,sz-.12,.32,.26,.2,1);
  }
  box(edge,2.22,.47,-9.45,.68,.09,.55);
  for(const side of [-1,1])box(wood,2.22+side*.24,.23,-9.45,.065,.46,.4);
  for(const side of [-1,1])sheet(2.22+side*.128,.525,-9.45,.24,.36,true);
  box(0x587854,2.22,.54,-9.45,.021,.013,.37,2);
  const geometry=mergeGeometries(parts,false)!;parts.forEach(p=>p.dispose());geometry.computeBoundingSphere();geometry.boundingSphere!.radius+=.1;
  const mesh=new Mesh(geometry,ugatMemoryMaterial(time));
  mesh.name="Four domestic memories from Ugat";
  return mesh;
}
