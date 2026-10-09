import { STORY_ROUTE_SAMPLES, storyRouteDistance } from "./story-route-layout";
import { ugatScenePoint, ugatSceneRect, UGAT_SCENE_PLACEMENTS } from "./ugat-scene-placement";

// Tangled roots visualize the title's social and personal metaphor.
export const UGAT_ROOT_BEDS = [
  { x: -5.8, z: 2.2, rx: 1.3, rz: 1.4 },
  { x: 5.8, z: -4.6, rx: 1.3, rz: 1.4 },
  { x: -5.7, z: -10.5, rx: 1.3, rz: 1.4 },
];
export const UGAT_TREES = [
  [-4.6,11.2],[-4.7,3.4],[-4.6,-.9],[-4.6,-8.4],[-4.7,-15.5],
  [4.5,10.5],[4.6,6.1],[4.7,-2.7],[4.4,-6.5],[4.7,-15.5],
  [-10,10],[10,12],[-10,0],[10,0],[-10,-10],[10,-11],[-10,-20],[10,-20],
];
// Art interpretation, with explicit links to the text rather than invented events.
export const UGAT_MEMORY_ART = [
  { id:"news", x:-4.5,z:5.7,w:2.1,d:.8, approach:{x:-4.3,z:7.05}, title:"Ang pangakong bagong araw", object:"Radyo at pahayagan", chapter:"Malalalim na Ugat · Paglayo",
    detail:"Nakiisa si Lolo sa EDSA na umaasang gaganda ang buhay ng kaniyang mga anak at apo. Ngunit sa mga balita, nakita niyang nananatili ang katiwaliang matagal niyang tinutuligsa.",
    quote:"Akala ko pa naman noon, sa EDSA…", speaker:"Lolo",
    symbol:"Ang mga ugat na bumabalot sa sulok na ito ay larawan ng suliraning matagal nang kumapit sa lipunan." },
  { id:"letter", x:5.65,z:.1,w:1.6,d:.85, approach:{x:4.4,z:1.2}, title:"Malayo, ngunit dala ang sarili", object:"Sulat ni Bert", chapter:"Paglayo · Stateside",
    detail:"Sa sulat ni Bert mula Amerika, umasa si Lolo na makalalayo siya sa kaniyang pagkabigo. Ipinapaalala ng mga maleta ang balak na pag-alis. Hindi ipinakita sa kuwento na natuloy ang paglalakbay.",
    quote:"Baka roon, kung malayong-malayo na ako sa lahat ng ito, matagpuan ko rin ang kapayapaan.", speaker:"Iniisip ni Lolo",
    symbol:"Ang bukas na pintuan ay sagisag ng paglayo. Saanman pumunta, dala pa rin ng tao ang kaniyang pagpapahalaga." },
  { id:"document", x:-5.35,z:-5.9,w:1.9,d:.85, approach:{x:-4.35,z:-4.65}, title:"Ang ugat ay nasa akin din", object:"Kasulatan at regalo", chapter:"Isang Kasulatan · Lunas sa Sarili",
    detail:"Nais ni Lolo na bigyan si De Castro ng mamahaling gift certificate upang matulungan sa kasulatan. Dito niya nakilala ang sariling pakikibahagi sa katiwaliang kaniyang kinamumuhian.",
    quote:"Nasa dugo ko rin pala!", speaker:"Lolo",
    symbol:"Ang magkabuhol na ugat ay umaabot sa sariling mesa: personal ang pananagutan. Hindi gantimpala ang gift certificate." },
  { id:"dawn", x:-.4,z:-10.6,w:2.6,d:1.0, approach:{x:.3,z:-8.75}, title:"Sa sarili muna", object:"Lolo, Tasing at Ricky", chapter:"Pilipino · Lunas sa Sarili",
    detail:"Sa takdang-aralin, pinanindigan ni Tasing ang pagiging Pilipino habang Amerikano ang pinili ni Ricky. Sa sopa, napag-isip ni Lolo na hindi sapat ang pagtakas: sa sarili kailangang magsimula ang lunas.",
    quote:"Ako, Lolo, Pilipino!", speaker:"Tasing",
    symbol:"Ang pagsasama ng maglolo rito ay isang tagpo ng paggunita. Sa wakas ng teksto, mag-isa si Lolo; ang liwanag at alaala ni Tasing ang nagbigay ng pag-asa." },
] as const;
export const UGAT_MEMORIES = UGAT_MEMORY_ART.map((memory,index)=>({
  ...ugatSceneRect(index,memory),
  approach: [{x:-2.7,z:8},{x:2.9,z:2},{x:-2.8,z:-5},{x:2.5,z:-10.2}][index],
}));
export type UgatMemory = (typeof UGAT_MEMORIES)[number];
export type UgatMemoryId = UgatMemory["id"];

export const UGAT_FAMILY = [
  {name:"Lolo",x:-.4,z:-10.6,scale:1,heading:.1},
  {name:"Tasing",x:1.3,z:-9.8,scale:.64,heading:-2},
  {name:"Ricky",x:2.65,z:-10.55,scale:.69,heading:-1.1},
].map(person=>({...person,...ugatScenePoint(3,person.x,person.z),scale:person.scale*UGAT_SCENE_PLACEMENTS[3].scale,heading:person.heading+UGAT_SCENE_PLACEMENTS[3].angle}));
// Thin wall sections and furniture have the same footprint as the visible art.
export const UGAT_FURNISHINGS = [
  {x:-4.55,z:5.08,w:3.2,d:.16},{x:-5.78,z:5.82,w:.62,d:.6},
  {x:4.71,z:-1.02,w:.76,d:.16},{x:6.69,z:-1.02,w:.76,d:.16},
  {x:5.16,z:-.91,w:.075,d:.1},{x:6.24,z:-.91,w:.075,d:.1},
  {x:6.31,z:-.64,w:.66,d:.6},{x:6.5,z:-.15,w:.58,d:.66},
  {x:-5.35,z:-6.66,w:2.85,d:.16},
  {x:0,z:-11.75,w:7.2,d:.18},{x:-3.5,z:-10.58,w:.16,d:2.5},{x:3.5,z:-10.58,w:.16,d:2.5},
  {x:2.22,z:-9.45,w:.68,d:.55},
].map((rect,index)=>ugatSceneRect(index<2?0:index<8?1:index===8?2:3,rect));

/** Only emit a new UI status when entering/leaving a scene's inspection area. */
export function ugatMemoryNear(x:number,z:number): UgatMemoryId | undefined {
  let nearest: UgatMemoryId | undefined, distance=1.65;
  for(const memory of UGAT_MEMORIES) {
    const d=Math.hypot(x-memory.approach.x,z-memory.approach.z);
    if(d<distance){nearest=memory.id;distance=d;}
  }
  return nearest;
}
// All story worlds now use the same continuous, accessible promenade.
export const UGAT_PATH = STORY_ROUTE_SAMPLES;
export const ugatPathDistance = storyRouteDistance;

export const UGAT_DAYLIGHT = {
  sky:0xd4e8ce,fog:0xe2e9ca,fogDensity:.022,
  hemisphereSky:0xfff4da,hemisphereGround:0x738850,hemisphereIntensity:1.4,
  ambient:0xfff5df,ambientIntensity:.5,sun:0xffdf9f,sunIntensity:1.85,
};
