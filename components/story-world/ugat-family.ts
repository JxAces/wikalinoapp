import { Group } from "three";
import { createVillagePerson } from "./village-person";
import { UGAT_FAMILY } from "./ugat-layout";

/** A memory tableau, not a new scene added to the written story. */
export function createUgatFamily() {
  const group = new Group();
  group.name = "Lolo remembers Tasing and Ricky";
  const people = UGAT_FAMILY.map((placement,index) => {
    const person = createVillagePerson(index===0?"elder":"child",index===2?{shirt:0x8296b3,trim:0xd4dce0}:{});
    person.group.name = placement.name;
    person.group.position.set(placement.x,.035,placement.z);
    person.group.rotation.y=placement.heading;
    person.group.scale.setScalar(placement.scale);
    person.group.updateMatrix();person.group.matrixAutoUpdate=false;
    person.update(0,0,0,0,index===0?1:0);
    group.add(person.group);
    return person;
  });
  return {group,update(time:number) {
    people.forEach((person,index) => {
      // Small gestures and head turns keep the scene calm while reading.
      const gesture=index===1?Math.max(0,Math.sin(time*.42))*.18:0;
      person.update(time,0,gesture,Math.sin(time*.27+index)*.13,index===0?1:0);
      person.mesh.updateMatrix();
    });
  }};
}
