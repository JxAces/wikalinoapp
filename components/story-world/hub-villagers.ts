import { Group } from "three";
import { portalApproachClear } from "./hub-layout";
import { createVillagePerson, type VillagePersonStyle } from "./village-person";

const RESIDENTS: {style:VillagePersonStyle;x:number;z:number;phase:number}[] = [
  {style:"guide",x:19.5,z:18,phase:0},
  {style:"farmer",x:27.7,z:7,phase:2.2},
  {style:"resident",x:14,z:20,phase:4.4},
];
const angleDifference=(a:number,b:number)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));

/** Small patrols alternate with pauses; people look toward nearby players. */
export function createHubVillagers(canStand:(x:number,z:number)=>boolean) {
  const group=new Group();group.name="Village residents";
  const people=RESIDENTS.map(spec=>{
    const person=createVillagePerson(spec.style);
    person.group.position.set(spec.x+Math.cos(spec.phase)*1.1,0,spec.z+Math.sin(spec.phase)*1.1);
    person.group.rotation.y=-spec.phase;group.add(person.group);
    return {person,spec,angle:spec.phase,lastTime:-1,stride:0,wave:0};
  });
  return {group,update(elapsed:number,player:{x:number;z:number}) {
    for(const a of people) {
      const {person,spec}=a,p=person.group.position;
      const dt=a.lastTime<0?0:Math.max(0,Math.min(.1,elapsed-a.lastTime));a.lastTime=elapsed;
      const distance=Math.hypot(p.x-player.x,p.z-player.z);
      person.group.visible=distance<28;if(!person.group.visible)continue;
      const cycle=(elapsed+spec.phase*2)%17,walking=cycle<11&&distance>2.2;
      let moving=false;
      if(walking) {
        const angle=a.angle+dt*.65,x=spec.x+Math.cos(angle)*1.1,z=spec.z+Math.sin(angle)*1.1;
        if(canStand(x,z)&&!portalApproachClear(x,z)) {
          p.x=x;p.z=z;a.angle=angle;moving=true;
          person.group.rotation.y+=angleDifference(-angle,person.group.rotation.y)*Math.min(1,dt*5);
        }
      } else if(distance<5) {
        const facing=Math.atan2(player.x-p.x,player.z-p.z);
        person.group.rotation.y+=angleDifference(facing,person.group.rotation.y)*Math.min(1,dt*2.5);
      }
      a.stride+=((moving?1:0)-a.stride)*Math.min(1,dt*6);
      a.wave+=((!walking&&distance<4&&cycle>12&&cycle<15?1:0)-a.wave)*Math.min(1,dt*4);
      const look=distance<5?Math.max(-.45,Math.min(.45,angleDifference(Math.atan2(player.x-p.x,player.z-p.z),person.group.rotation.y))):Math.sin(elapsed*.6+spec.phase)*.12;
      person.update(elapsed+spec.phase,a.stride,a.wave,look);
    }
  }};
}
