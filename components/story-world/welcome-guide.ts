import { Vector3 } from "three";
import { createVillagePerson } from "./village-person";

export const WELCOME_PAGES = [
  "Magandang araw! Maligayang pagdating sa Wikalino App, kung saan mahahasa ang iyong kaalaman at kasanayan sa pagbasa.",
  "Dito, magbabasa ka ng mga kuwento, gagawa ng mga gawain, at sasagot sa mga pagsusulit upang mas marami kang matutunan.",
  "Una, basahin ang “Sandaang Damit,” gawin ang mga gawain kasama ang iyong grupo, at sagutan ang pagsusulit.",
  "Ganoon din ang gagawin mo sa mga kuwentong “Ugat” at “Utos ng Hari.”",
  "Handa ka na ba? Tara na at simulan ang iyong bagong paglalakbay sa Wikalino App!",
];

/** The same lightweight human model as the residents, with an approach and wave. */
export function createWelcomeGuide(player: {x:number;z:number}, heading:number) {
  const person=createVillagePerson("guide"),group=person.group;
  group.name="Welcome village guide";
  const forward=new Vector3(Math.sin(heading),0,Math.cos(heading)),right=new Vector3(Math.cos(heading),0,-Math.sin(heading));
  const destination=new Vector3(player.x,0,player.z).addScaledVector(forward,2.3).addScaledVector(right,1.0);
  const origin=destination.clone().addScaledVector(forward,3.0);
  group.rotation.y=Math.atan2(player.x-destination.x,player.z-destination.z);
  let time=0;
  return {group,update(delta:number) {
    time+=delta;const progress=Math.min(1,time/2.5),moving=progress<1;
    group.position.lerpVectors(origin,destination,progress);
    const stride=moving?Math.min(1,(1-progress)*10):0;
    const wave=moving?0:Math.min(1,(time-2.5)*3);
    person.update(time*1.5,stride,wave,Math.sin(time*.8)*.06);
    return !moving;
  }};
}
