import {
  BoxGeometry, BufferGeometry, Color, CylinderGeometry, Float32BufferAttribute,
  Group, Mesh, MeshLambertMaterial, Object3D, SphereGeometry,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { portalApproachClear } from "./hub-layout";

type Kind = "reindeer" | "wolf" | "butterfly";
export const FOREST_WILDLIFE: readonly { kind: Kind; x: number; z: number; phase: number }[] = [
  { kind: "reindeer", x: 7, z: -25, phase: 0 },
  { kind: "reindeer", x: 29, z: -31, phase: 2 },
  { kind: "wolf", x: 6, z: -33, phase: 4 },
  { kind: "wolf", x: 32, z: -19, phase: 7 },
  { kind: "butterfly", x: 8, z: -21, phase: 1 },
  { kind: "butterfly", x: 27, z: -22, phase: 3 },
  { kind: "butterfly", x: 24, z: -33, phase: 5 },
  { kind: "butterfly", x: 13, z: -30, phase: 8 },
  { kind: "butterfly", x: 3, z: -17, phase: 9 },
];

// GLSL 1 rigid-part motion, not skinning: one draw per animal, no float textures,
// skeletons or per-frame geometry uploads on Expo's WebGL 1 renderer.
const motionShader = `
  attribute vec3 animalPivot;
  attribute vec3 animalMotion;
  uniform float animalTime;
  uniform float animalStride;
  uniform float animalGraze;
  mat3 animalRotation() {
    float mode = animalMotion.x;
    float angle = 0.0;
    if (mode > 0.5 && mode < 1.5) angle = sin(animalTime * 5.5 + animalMotion.y) * animalMotion.z * animalStride;
    if (mode > 1.5 && mode < 2.5) angle = animalGraze * 0.8 + sin(animalTime * 0.9) * 0.055;
    if (mode > 2.5 && mode < 3.5) angle = sin(animalTime * 2.2) * animalMotion.z;
    if (mode > 3.5) angle = (0.35 + 0.9 * sin(animalTime * 16.0)) * animalMotion.z;
    float c = cos(angle), s = sin(angle);
    if (mode > 3.5) return mat3(c,s,0.0, -s,c,0.0, 0.0,0.0,1.0);
    return mat3(1.0,0.0,0.0, 0.0,c,s, 0.0,-s,c);
  }
`;

export function createForestWildlife(canStand: (x: number, z: number) => boolean) {
  const group = new Group(); group.name = "Forest wildlife";
  const actors = FOREST_WILDLIFE.map((spec, index) => {
    const parts: BufferGeometry[] = [], transform = new Object3D();
    function part(colorHex: number, geometry: BufferGeometry, x: number, y: number, z: number,
      scale = [1, 1, 1], motion = [0, 0, 0], pivot = [0, 0, 0], rotation = [0, 0, 0]) {
      transform.position.set(x,y,z); transform.scale.set(...scale as [number,number,number]);
      transform.rotation.set(...rotation as [number,number,number]); transform.updateMatrix();
      geometry.applyMatrix4(transform.matrix);
      geometry.deleteAttribute("uv");
      const count = geometry.attributes.position.count, color = new Color(colorHex);
      const colors = new Float32Array(count*3), pivots = new Float32Array(count*3), motions = new Float32Array(count*3);
      for(let i=0;i<count;i++) { color.toArray(colors,i*3); pivots.set(pivot,i*3); motions.set(motion,i*3); }
      geometry.setAttribute("color",new Float32BufferAttribute(colors,3));
      geometry.setAttribute("animalPivot",new Float32BufferAttribute(pivots,3));
      geometry.setAttribute("animalMotion",new Float32BufferAttribute(motions,3));
      parts.push(geometry);
    }
    function ball(color: number,x:number,y:number,z:number,scale:number[],motion=[0,0,0],pivot=[0,0,0]) {
      part(color,new SphereGeometry(1,spec.kind==='butterfly'?6:8,spec.kind==='butterfly'?3:5),x,y,z,scale,motion,pivot);
    }
    if(spec.kind === "butterfly") {
      const color = [0xf0bd57,0x76b6d9,0xeb947f][index%3];
      ball(0x443b36,0,0,0,[.035,.035,.2]);
      for(const side of [-1,1]) {
        part(0x443b36,new CylinderGeometry(.006,.006,.12,3),side*.03,.04,.19,[1,1,1],[0,0,0],[0,0,0],[.65,0,side*.4]);
        const motion=[4,0,side], pivot=[0,0,0];
        for(const [z,width,length] of [[.11,.24,.24],[-.17,.18,.16]]) {
          ball(0x435447,side*width*.8,0,z,[width,.02,length],motion,pivot);
          ball(color,side*width*.82,.009,z,[width*.77,.02,length*.78],motion,pivot);
          ball(0xffedb5,side*width*1.05,.027,z+.03,[.055,.01,.05],motion,pivot);
        }
      }
    } else {
      const deer = spec.kind === "reindeer", coat = deer ? 0x9c7956 : 0x7b8990;
      const chest = deer ? 0xe2d6b5 : 0xd5d9ce, hoof = deer ? 0x4f473d : 0x515e61;
      ball(coat,0,.93,0,[.36,.43,.75]);
      ball(chest,0,.97,.39,[.32,.38,.26]);
      const headPivot = [0,1.12,.48], headMotion = [2,0,0];
      ball(coat,0,deer?1.42:1.17,.63,[.23,deer?.48:.3,.27],headMotion,headPivot);
      ball(coat,0,deer?1.83:1.41,.83,[.24,.24,.31],headMotion,headPivot);
      ball(chest,0,deer?1.72:1.32,1.07,[.16,.13,.23],headMotion,headPivot);
      ball(0x333d37,0,deer?1.73:1.34,1.26,[.11,.085,.075],headMotion,headPivot);
      for(const side of [-1,1]) {
        ball(0x212c26,side*.195,deer?1.87:1.45,1.00,[.045,.05,.036],headMotion,headPivot);
        if(deer) ball(0xb69770,side*.23,2.07,.72,[.1,.22,.09],headMotion,headPivot);
        else part(0x849397,new CylinderGeometry(0,.135,.37,4),side*.21,1.67,.72,[1,1,1],headMotion,headPivot,[0,0,-side*.12]);
        ball(deer?0xe3c4a1:0xe3d7cb,side*.23,deer?2.08:1.69,.79,[.055,.13,.018],headMotion,headPivot);
        for(const front of [-1,1]) {
          const x=side*.24,z=front*.48,pivot=[x,.89,z],phase=side*front>0?0:Math.PI;
          part(coat,new CylinderGeometry(.075,.065,.76,6),x,.49,z,[1,1,1],[1,phase,.38],pivot);
          if(deer) part(hoof,new BoxGeometry(.15,.14,.24),x,.07,z+.03,[1,1,1],[1,phase,.38],pivot);
          else part(hoof,new SphereGeometry(1,6,4),x,.08,z+.05,[.1,.08,.16],[1,phase,.38],pivot);
        }
        if(deer) {
          for(let branch=0;branch<3;branch++) {
            part(0xd6c69e,new CylinderGeometry(.018,.04,branch===0?.64:.26,5),side*(.18+branch*.12),2.2+branch*.13,.71,
              [1,1,1],headMotion,headPivot,[0,0,-side*(branch===0?.35:1.0)]);
          }
        }
      }
      const tailMotion=[3,0,.2],tailPivot=[0,.97,-.56];
      ball(deer?chest:coat,0,deer?1.02:.74,-.83,[deer?.1:.14,deer?.13:.2,deer?.2:.47],tailMotion,tailPivot);
      if(!deer)ball(0x405256,0,.62,-1.18,[.115,.14,.22],tailMotion,tailPivot);
    }
    const geometry = mergeGeometries(parts,false); parts.forEach(p=>p.dispose());
    if(!geometry)throw new Error("Unable to build forest wildlife");
    geometry.computeBoundingSphere(); geometry.boundingSphere!.radius += .6;
    const uniforms = { animalTime:{value:0}, animalStride:{value:0}, animalGraze:{value:0} };
    const material = new MeshLambertMaterial({vertexColors:true});
    material.onBeforeCompile = shader => {
      Object.assign(shader.uniforms,uniforms);
      shader.vertexShader = motionShader + shader.vertexShader
        .replace("#include <beginnormal_vertex>","#include <beginnormal_vertex>\n objectNormal = animalRotation() * objectNormal;")
        .replace("#include <begin_vertex>","#include <begin_vertex>\n transformed = animalRotation() * (transformed - animalPivot) + animalPivot;");
    };
    material.customProgramCacheKey = () => "wikalinggo-wildlife-rigid-v1";
    const mesh = new Mesh(geometry,material);mesh.name=`${spec.kind}-${index}`;
    mesh.position.set(spec.x,spec.kind==='butterfly'?1.35:0,spec.z);
    mesh.userData.kind=spec.kind;
    group.add(mesh);
    return { spec, mesh, uniforms, lastTime: -1, angle:spec.phase, stride:0 };
  });

  return { group, update(elapsed:number, player:{x:number;z:number}) {
    for(const a of actors) {
      const distance=Math.hypot(player.x-a.mesh.position.x,player.z-a.mesh.position.z);
      const dt=a.lastTime<0?0:Math.max(0,Math.min(elapsed-a.lastTime,.1));a.lastTime=elapsed;
      a.mesh.visible=distance<26;
      if(!a.mesh.visible)continue;
      const butterfly=a.spec.kind==='butterfly';
      const cycle=(elapsed+a.spec.phase*1.7)%14;
      const walking=cycle<8 && distance>1.8;
      a.stride += ((walking?1:0)-a.stride)*Math.min(1,dt*5);
      const radius=butterfly?1.4:1.9, speed=butterfly?.65:a.spec.kind==='wolf'?.27:.18;
      if(butterfly||walking)a.angle+=dt*speed;
      const x=a.spec.x+Math.cos(a.angle)*radius,z=a.spec.z+Math.sin(a.angle)*radius;
      if(canStand(x,z) && !portalApproachClear(x,z,.6)) {
        a.mesh.position.x=x;a.mesh.position.z=z;
      }
      a.mesh.rotation.y=-a.angle;
      a.mesh.position.y=butterfly?1.45+Math.sin(elapsed*1.8+a.spec.phase)*.35:Math.abs(Math.sin(elapsed*5.5+a.spec.phase))*.025*a.stride;
      a.uniforms.animalTime.value=elapsed+a.spec.phase;
      a.uniforms.animalStride.value=a.stride;
      const grazing=a.spec.kind==='reindeer' && !walking && distance>1.8;
      a.uniforms.animalGraze.value += ((grazing?1:0)-a.uniforms.animalGraze.value)*Math.min(1,dt*2);
    }
  }};
}
