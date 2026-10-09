import { BoxGeometry, BufferGeometry, CylinderGeometry, Group, Mesh, MeshLambertMaterial, SphereGeometry } from "three";
import { mergeColoredScenery } from "./merge-colored-scenery";
import { addCanopyWind, createHubUndergrowth, mottled } from "./hub-storybook-art";
import { addHubGroundStones, createHubGrass } from "./hub-ground";
import { HUB_PORTALS, HUB_BOUNDS, HUB_BRIDGES, HUB_HOUSES, HUB_RIVER_X } from "./hub-layout";
import { HUB_VEGETATION } from "./hub-vegetation";
import { createForestWildlife } from "./hub-wildlife";
import { createHubWater } from "./hub-water";
import { addWaterfallCliff, addWetRockDetail } from "./waterfall-cliff";
import { createHubBirds } from "./hub-birds";
import { createHubTree } from "./hub-trees";
import { createTreeSurfaceTexture } from "./tree-surface-texture";
import { createHubHouses } from "./hub-houses";
import { createHubVillagers } from "./hub-villagers";

export { HUB_BOUNDS, HUB_BRIDGES, HUB_HOUSES } from "./hub-layout";
export const HUB_AREAS = ["Talon · Sandaang Damit", "Gubat · Ugat", "Nayon · Simula ng Isang Kahulugan"];
const RIVER_X = HUB_RIVER_X;

export function canStandInHub(x: number, z: number) {
  if (x < HUB_BOUNDS.minX || x > HUB_BOUNDS.maxX || z < HUB_BOUNDS.minZ || z > HUB_BOUNDS.maxZ) return false;
  if (Math.abs(x - RIVER_X) < 2.9 && !HUB_BRIDGES.some(bridge => Math.abs(z - bridge) < 1.55)) return false;
  if (x < -18 && z < -26) return false; // Falls/cliff backdrop and plunge pool.
  if (x < -15.8 && x > -23 && z > -30.5 && z < -27.4) return false; // Pool outlet.
  if (HUB_HOUSES.some(house => Math.abs(x-house.x)<2.65 && z-house.z > -2.35 && z-house.z < 3.05)) return false;
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

/** Region-batched scenery with baked ground detail and lightweight living actors. */
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
    const model = createHubTree(height, x * .41 + z * .29, palm);
    model.position.set(x, 0, z);
    model.rotation.y = Math.sin(x + z) * .35;
    parent.add(model);
  }
  root.add(createHubGrass(), createHubHouses());
  // Share the meadow batch so textured houses add no net scenery draw calls.
  meadow.add(createHubUndergrowth());
  // Paths now blend into the terrain instead of sitting above it as rectangles.
  addHubGroundStones(meadow);
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
  addWaterfallCliff(falls);
  // Fill the banks, meadows and village edges, with denser woodland to the north.
  // These all join the existing regional batches, never one draw per tree.
  for(const plant of HUB_VEGETATION) {
    const area=plant.region==="forest"?forest:plant.region==="village"?village:meadow;
    if(plant.bush) {
      for(let i=0;i<2;i++) {
        const shrub=part(area,i?0x719d3c:0x4b803b,mottled(new SphereGeometry(1,6,3)),plant.x+i*.45,plant.height*.6,plant.z);
        shrub.scale.set(.6,plant.height,.65);(shrub.material as MeshLambertMaterial).vertexColors=true;
      }
    } else tree(area,plant.x,plant.z,plant.height);
  }
  root.userData.vegetation = { trees: HUB_VEGETATION.filter(p=>!p.bush).length+8, bushes: HUB_VEGETATION.filter(p=>p.bush).length };
  for(let i=0;i<8;i++) tree(village,10+i*3.4,27+(i%2)*2,3.1,true);
  for(let i=0;i<10;i++) {
    const angle=i*Math.PI*2/10;
    ball(meadow,i%2?0x7fa361:0x77985b,Math.cos(angle)*55,0,-5+Math.sin(angle)*58,11,5+(i%3),10);
  }
  // Raised village houses surround an open square with benches and bunting.
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
  const treeTexture = createTreeSurfaceTexture();
  for(const area of [meadow,falls,forest,village]) {
    mergeColoredScenery(area);
    if(area !== falls) addCanopyWind(area,canopyTime,treeTexture);
    else addWetRockDetail(area,water.flowMap);
    area.traverse(object=>{object.updateMatrix();object.matrixAutoUpdate=false;});
  }
  // Chickens keep their inexpensive bobbing motion; human residents use articulated limbs.
  const actors: {group:Group;x:number;z:number;radius:number;speed:number;phase:number}[]=[];
  function chicken(x:number,z:number,phase:number) {
    const group=new Group();root.add(group);
    ball(group,0xf9e9c3,0,.4,0,.23,.22,.3);
    ball(group,0xf9e9c3,0,.7,.24,.13,.17,.14);
    for(const s of [-1,1]) {
      box(group,0xd49b3e,s*.12,.15,0,.085,.3,.085);
    }
    ball(group,0xc75b48,0,.89,.25,.07,.08,.08);box(group,0xe5ad42,0,.69,.4,.08,.07,.15);
    mergeColoredScenery(group);
    group.children.forEach(child=>{child.updateMatrix();child.matrixAutoUpdate=false;});
    actors.push({group,x,z,radius:1.5,speed:.16,phase});
  }
  chicken(19,21,3);chicken(28,24,4);
  const villagers = createHubVillagers(canStandInHub); root.add(villagers.group);
  const birds = createHubBirds(); root.add(birds.group);
  const wildlife = createForestWildlife(canStandInHub); root.add(wildlife.group);
  return {group:root,update(elapsed:number,player:{x:number;z:number}) {
    water.update(elapsed); canopyTime.value = elapsed; wildlife.update(elapsed,player); birds.update(elapsed,player); villagers.update(elapsed,player);
    for(const a of actors) {
      const angle=elapsed*a.speed+a.phase, x=a.x+Math.cos(angle)*a.radius,z=a.z+Math.sin(angle)*a.radius;
      a.group.visible=Math.hypot(player.x-x,player.z-z)<28;
      if(!a.group.visible)continue;
      a.group.position.set(x,Math.abs(Math.sin(elapsed*4+a.phase))*.04,z);
      a.group.rotation.y=-angle;
      a.group.rotation.z=Math.sin(elapsed*4+a.phase)*.035;
    }
  }};
}
