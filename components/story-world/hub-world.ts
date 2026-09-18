import { BoxGeometry, BufferGeometry, CylinderGeometry, Group, Mesh, MeshLambertMaterial, SphereGeometry } from "three";
import { mergeColoredScenery } from "./merge-colored-scenery";
import { addCanopyWind, createHubGrass, createHubUndergrowth, mottled, villagePalmFrond } from "./hub-storybook-art";
import { HUB_PORTALS, portalApproachClear } from "./hub-layout";
import { createForestWildlife, FOREST_WILDLIFE } from "./hub-wildlife";
import { createHubWater } from "./hub-water";

export const HUB_BOUNDS = { minX: -36, maxX: 38, minZ: -40, maxZ: 32 };
export const HUB_AREAS = ["Talon · Sandaang Damit", "Gubat · Ugat", "Nayon · Simula ng Isang Kahulugan"];
export const HUB_BRIDGES = [-8, 18];
export const HUB_HOUSES = [{ x: 17, z: 3 }, { x: 30, z: -3 }, { x: 31, z: 17 }];
const RIVER_X = -13;

export function canStandInHub(x: number, z: number) {
  if (x < HUB_BOUNDS.minX || x > HUB_BOUNDS.maxX || z < HUB_BOUNDS.minZ || z > HUB_BOUNDS.maxZ) return false;
  if (Math.abs(x - RIVER_X) < 2.9 && !HUB_BRIDGES.some(bridge => Math.abs(z - bridge) < 1.55)) return false;
  if (x < -18 && z < -26) return false; // Falls/cliff backdrop and plunge pool.
  if (HUB_HOUSES.some(house => Math.abs(x-house.x)<2.65 && Math.abs(z-house.z)<2.35)) return false;
  if (Math.abs(x-33)<3.5 && Math.abs(z-7)<3.5) return false; // Imported hut clearing.
  return true;
}
export function moveThroughHub(position: {x:number;z:number}, dx:number, dz:number) {
  const steps = Math.max(1, Math.ceil(Math.hypot(dx,dz)/0.18));
  for(let i=0;i<steps;i++) {
    if(canStandInHub(position.x+dx/steps,position.z)) position.x+=dx/steps;
    if(canStandInHub(position.x,position.z+dz/steps)) position.z+=dz/steps;
  }
}
/** Navigation waypoints use the same bridges as collision, not a straight line into water. */
export function hubWaypoint(from: {x:number;z:number}, target: {x:number;z:number}) {
  const west = from.x < RIVER_X;
  if (west !== (target.x < RIVER_X) || Math.abs(from.x-RIVER_X)<3.2) {
    const bridge = HUB_BRIDGES.reduce((best,z)=>Math.abs(from.z-z)+Math.abs(target.z-z)<Math.abs(from.z-best)+Math.abs(target.z-best)?z:best);
    if(Math.abs(from.z-bridge)>1.1) return { x: west ? -17 : -9, z: bridge };
    return {x:target.x<RIVER_X?-17:-9,z:bridge};
  }
  return target;
}

/** Region-batched scenery with a single small painted grass texture. */
export function createHubWorld() {
  const root = new Group(); root.name = "Malawak na Mundo ng mga Kuwento";
  const meadow = new Group(), falls = new Group(), forest = new Group(), village = new Group();
  forest.name = "Forest grove";
  root.add(meadow, falls, forest, village);
  function part(parent:Group,color:number,geometry:BufferGeometry,x:number,y:number,z:number,rotation=0) {
    const mesh=new Mesh(geometry,new MeshLambertMaterial({color}));
    mesh.position.set(x,y,z);mesh.rotation.z=rotation;parent.add(mesh);return mesh;
  }
  function box(parent:Group,color:number,x:number,y:number,z:number,w:number,h:number,d:number,rz=0) {
    return part(parent,color,new BoxGeometry(w,h,d),x,y,z,rz);
  }
  function ball(parent:Group,color:number,x:number,y:number,z:number,sx:number,sy:number,sz:number) {
    const mesh=part(parent,color,new SphereGeometry(1,7,5),x,y,z);mesh.scale.set(sx,sy,sz);return mesh;
  }
  function tree(parent:Group,x:number,z:number,height:number,palm=false) {
    const trunk=part(parent,0x887044,mottled(new CylinderGeometry(.32,.62,height,8,2)),x,height/2,z);
    (trunk.material as MeshLambertMaterial).vertexColors=true;
    if(palm) {
      // Raised crown and curved, solid fronds replace the flat star-shaped canopy.
      const crown=part(parent,0x59943c,mottled(new SphereGeometry(1,8,4),.12),x,height+.28,z);
      crown.scale.set(.57,.6,.57);
      (crown.material as MeshLambertMaterial).vertexColors=true;
      for(let i=0;i<6;i++) {
        const angle=i*Math.PI/3+x*.13;
        const leaf=part(parent,i%2?0x498c3c:0x65a343,villagePalmFrond(2.3+(i%2)*.3,.52,.65+(i%3)*.14),x,height+.2+(i%2)*.18,z);
        leaf.rotation.y=-angle;
        (leaf.material as MeshLambertMaterial).vertexColors=true;
      }
      for(let i=0;i<3;i++) {
        const angle=i*Math.PI*2/3;
        const coconut=part(parent,0x827047,new SphereGeometry(1,6,3),x+Math.cos(angle)*.3,height-.1,z+Math.sin(angle)*.3);
        coconut.scale.set(.16,.2,.16);
      }
    } else {
      // Wide rounded crowns, flared roots, and irregular leaf-colored patches.
      for(let lobe=0;lobe<3;lobe++) {
        const crown=part(parent,lobe===1?0x7aa633:0x568b29,mottled(new SphereGeometry(1,8,4),.22),x+(lobe-1)*.95,height+.55+(lobe===1?.6:0),z+(lobe%2?.2:-.15));
        crown.scale.set(lobe===1?1.6:1.35,lobe===1?1.05:.9,1.55);
        (crown.material as MeshLambertMaterial).vertexColors=true;
      }
      for(let r=0;r<3;r++) {
        const a=r*Math.PI*2/3;
        const root=part(parent,0x7c693e,new CylinderGeometry(.08,.2,.9,5),x+Math.sin(a)*.42,.25,z+Math.cos(a)*.42);
        root.rotation.set(Math.cos(a)*.85,0,-Math.sin(a)*.85);
      }
    }
  }
  root.add(createHubGrass(), createHubUndergrowth());
  // Wide paths leave room to explore and approach portals from either side.
  function trail(points: number[][]) {
    for(let i=1;i<points.length;i++) {
      const [ax,az]=points[i-1],[bx,bz]=points[i], length=Math.hypot(bx-ax,bz-az);
      const path=box(meadow,0xa7b36b,(ax+bx)/2,-.015,(az+bz)/2,1.9,.035,length+1.4);
      path.rotation.y=Math.atan2(bx-ax,bz-az);
    }
  }
  const [waterfallPortal, forestPortal, villagePortal] = HUB_PORTALS;
  const point = (p: {x:number;z:number}) => [p.x,p.z];
  trail([[0,12],[0,-8],[-17,-8],point(waterfallPortal.approach),point(waterfallPortal)]);
  trail([[0,-8],[5,-14],point(forestPortal.approach),point(forestPortal)]);
  trail([[0,12],point(villagePortal.approach),point(villagePortal),[25,23]]);
  trail([[-24,-16],[-24,18],[-8,18],[0,12]]);
  const water = createHubWater(); root.add(water.group);
  for (const portal of HUB_PORTALS) {
    part(meadow,0xc4c098,new CylinderGeometry(2.55,2.65,.07,20),portal.x,.015,portal.z);
  }
  for(const z of HUB_BRIDGES) {
    box(meadow,0xa37644,RIVER_X,.07,z,7,.12,3.5);
    for(let i=0;i<12;i++) box(meadow,0xd4ac6b,RIVER_X-3.25+i*.59,.15,z,.48,.04,3.45);
    for(const side of [-1,1]) {
      box(meadow,0x765537,RIVER_X,.8,z+side*1.85,7,.11,.1);
      for(const x of [-16,-13,-10]) box(meadow,0x765537,x,.43,z+side*1.85,.13,.85,.13);
    }
  }
  // Waterfall portal sits on a dry stone shelf in front of the falling water.
  box(falls,0x9ea58e,-25,-.015,-23,12,.16,6);
  for(let i=0;i<7;i++) {
    const x=-34+i*2.8;
    ball(falls,i%2?0x7f8b7b:0x929986,x,2.2+(i%3)*.7,-31,2.5,4+(i%2),2.7);
    ball(falls,0x789858,x,5+(i%3)*.6,-32,2.8,.7,2.8);
  }
  // The northern forest has a clear entry avenue and an open portal glade.
  for(let i=0;i<40;i++) {
    const x=3+(i%8)*4.7+Math.sin(i*7)*.8, z=-16-Math.floor(i/8)*4.9+Math.cos(i*3)*.6;
    if(portalApproachClear(x,z,1.4) || Math.abs(x-(5+(-z-14)*1.2))<2.8) continue;
    // Small wildlife glades keep grazing animals visible and their loops clear of trunks.
    if(FOREST_WILDLIFE.some(animal=>animal.kind!=="butterfly" && Math.hypot(x-animal.x,z-animal.z)<3.7)) continue;
    tree(forest,x,z,2.4+(i%4)*.45);
    for(let j=0;j<2;j++) ball(forest,0x517f43,x-1+j*2,.35,z+.8,.65,.5,.7);
  }
  for(let i=0;i<12;i++) {const x=-32+(i%3)*5,z=1+Math.floor(i/3)*7;tree(meadow,x,z,2.6+(i%2)*.7);}
  for(let i=0;i<8;i++) tree(village,10+i*3.4,27+(i%2)*2,3.1,true);
  for(let i=0;i<10;i++) {
    const angle=i*Math.PI*2/10;
    ball(meadow,i%2?0x7fa361:0x77985b,Math.cos(angle)*55,0,-5+Math.sin(angle)*58,11,5+(i%3),10);
  }
  // Nipa village with open square, benches, planters and colorful bunting.
  for(const [index,house] of HUB_HOUSES.entries()) {
    const {x,z}=house;
    box(village,0x785336,x,.45,z,4.5,.2,3.8);
    box(village,index%2?0xd5ae6d:0xc59255,x,1.9,z,4.5,2.7,3.8);
    for(const s of [-1,1]) {
      box(village,0x9c713d,x+s*1.18,3.65,z,2.9,.2,4.6,-s*.48);
      box(village,0x614d35,x+s*1.8,.2,z,.2,.4,.2);
      box(village,0x406c64,x+s*1.4,2.1,z+1.93,.8,.8,.06);
      box(village,0xf3dfa5,x+s*1.4,2.1,z+1.98,.06,.8,.04);
    }
    box(village,0x5b4938,x,1.5,z+1.94,.85,2,.06);
    for(let step=0;step<3;step++) box(village,0xb9996b,x,.1+step*.1,z+2.65-step*.24,1.3,.2,.5);
    for(let strip=0;strip<6;strip++) box(village,0xb5844d,x,.85+strip*.32,z+1.95,4.45,.035,.03);
  }
  for(const x of [18,28]) {box(village,0x98703e,x,.6,13,2,.16,.55);for(const s of [-1,1])box(village,0x664e35,x+s*.75,.3,13,.12,.6,.5);}
  for(const x of [18,28]) box(village,0x846543,x,2.9,6,.12,5.8,.12);
  box(village,0xe0ca96,23,5.7,6,10,.04,.04);
  for(let i=0;i<9;i++)part(village,[0xe39a61,0xf4d979,0x63a797][i%3],new CylinderGeometry(.27,0,.55,3),18.7+i,5.35,6,Math.PI);
  for(let i=0;i<30;i++) {
    const x=-5+(i%10)*3.7,z=23+Math.floor(i/10)*2;
    part(meadow,0x56894c,new CylinderGeometry(0,.13,.45,4),x,.2,z);
    ball(meadow,i%2?0xf6d678:0xdc9b97,x,.48,z,.13,.12,.13);
  }
  const canopyTime = { value: 0 };
  for(const area of [meadow,falls,forest,village]) {
    mergeColoredScenery(area);
    if(area === forest || area === village) addCanopyWind(area,canopyTime);
    area.traverse(object=>{object.updateMatrix();object.matrixAutoUpdate=false;});
  }
  // Each actor is one merged mesh: simple roaming/bobbing, no CPU skinning.
  const actors: {group:Group;x:number;z:number;radius:number;speed:number;phase:number;bird:boolean}[]=[];
  function actor(kind:"villager"|"chicken"|"bird",x:number,z:number,phase:number) {
    const group=new Group();root.add(group);
    if(kind==='villager') {
      part(group,[0x70a9a1,0xe6b362,0xc48980][phase%3],new CylinderGeometry(.26,.32,.65,7),0,1.02,0);
      ball(group,0xb78258,0,1.61,0,.24,.27,.23);
      part(group,0xdcb76c,new CylinderGeometry(.06,.43,.18,10),0,1.93,0);
      for(const s of [-1,1]) {box(group,0x394744,s*.14,.35,0,.2,.65,.23);box(group,0xb78258,s*.35,.98,0,.14,.58,.15);}
    } else if(kind==='bird') {
      ball(group,0xf0d277,0,0,0,.2,.12,.35);
      for(const s of [-1,1])ball(group,0x39615a,s*.35,0,0,.4,.055,.2);
    } else {
      ball(group,0xf9e9c3,0,.4,0,.23,.22,.3);
      ball(group,0xf9e9c3,0,.7,.24,.13,.17,.14);
      for(const s of [-1,1]) {
        box(group,0xd49b3e,s*.12,.15,0,.085,.3,.085);
      }
      ball(group,0xc75b48,0,.89,.25,.07,.08,.08);box(group,0xe5ad42,0,.69,.4,.08,.07,.15);
    }
    mergeColoredScenery(group);
    group.children.forEach(child=>{child.updateMatrix();child.matrixAutoUpdate=false;});
    actors.push({group,x,z,radius:kind==='villager'?1.1:kind==='bird'?4:1.5,speed:kind==='bird'?.35:.16,phase,bird:kind==='bird'});
  }
  actor('villager',21,16,0);actor('villager',26,4,1);actor('villager',14,18,2);
  actor('chicken',19,21,3);actor('chicken',28,24,4);
  actor('bird',-23,-20,7);actor('bird',4,3,8);
  const wildlife = createForestWildlife(canStandInHub); root.add(wildlife.group);
  return {group:root,update(elapsed:number,player:{x:number;z:number}) {
    water.update(elapsed); canopyTime.value = elapsed; wildlife.update(elapsed,player);
    for(const a of actors) {
      const angle=elapsed*a.speed+a.phase, x=a.x+Math.cos(angle)*a.radius,z=a.z+Math.sin(angle)*a.radius;
      a.group.visible=Math.hypot(player.x-x,player.z-z)<28;
      if(!a.group.visible)continue;
      a.group.position.set(x,a.bird?4.2+Math.sin(elapsed*2+a.phase)*.4:Math.abs(Math.sin(elapsed*4+a.phase))*.04,z);
      a.group.rotation.y=-angle;
      a.group.rotation.z=a.bird?Math.sin(elapsed*5+a.phase)*.15:Math.sin(elapsed*4+a.phase)*.035;
    }
  }};
}
