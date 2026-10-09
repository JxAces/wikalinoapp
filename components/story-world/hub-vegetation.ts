import { distanceToHubTrail, HUB_HOUSES, HUB_RIVER_X, HUB_VILLAGE_CLEARING, portalApproachClear } from "./hub-layout";
import { FOREST_WILDLIFE } from "./hub-wildlife";

type Plant = { x: number; z: number; height: number; region: "forest" | "meadow" | "village"; bush: boolean };

export function canPlantInHub(x: number, z: number, clearance = 2.7) {
  return Math.abs(x-HUB_RIVER_X) > 4.5 && !(x < -18 && z < -25)
    && distanceToHubTrail(x,z) > clearance && !portalApproachClear(x,z,1.7)
    && !HUB_HOUSES.some(h => Math.abs(x-h.x)<5 && Math.abs(z-h.z)<5)
    && Math.hypot(x-HUB_VILLAGE_CLEARING.x,z-HUB_VILLAGE_CLEARING.z)>HUB_VILLAGE_CLEARING.radius
    && Math.hypot(x-25,z-23)>5
    && !FOREST_WILDLIFE.some(a => a.kind!=="butterfly" && Math.hypot(x-a.x,z-a.z)<3.8);
}

/** Stable, spaced groves: more trees in the forest, scattered trees elsewhere. */
function plantingPlan() {
  const plants: Plant[] = [];
  const noise = (i: number) => { const n = Math.sin(i*127.1+311.7)*43758.5453; return n-Math.floor(n); };
  for (let row=0;row<18;row++) for(let column=0;column<18;column++) {
    const i=row*18+column, x=-34+column*4+noise(i)*1.3, z=-38+row*4+noise(i+400)*1.3;
    const forest = x>1 && z< -14;
    if (!forest && noise(i+800)<.42) continue;
    if (!canPlantInHub(x,z) || plants.some(p=>Math.hypot(p.x-x,p.z-z)<3.8)) continue;
    plants.push({x,z,height:2.5+noise(i+1200)*1.5,region:forest?"forest":x>10&&z> -8?"village":"meadow",bush:false});
  }
  const trees = [...plants];
  for (const [i, tree] of trees.entries()) {
    const x=tree.x+1.4, z=tree.z+1.2;
    if (i%2 && tree.region!=="forest") continue;
    if(canPlantInHub(x,z,1.9)) plants.push({x,z,height:.4+noise(i+1600)*.35,region:tree.region,bush:true});
  }
  return plants;
}
export const HUB_VEGETATION = plantingPlan();
