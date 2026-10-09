import { ugatScenePoint } from "./ugat-scene-placement";
import { BufferGeometry, CylinderGeometry, Float32BufferAttribute, Group, Mesh, MeshLambertMaterial, SphereGeometry } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/** Three new shoots at the window reflect completed groups and personal renewal. */
export function createUgatRenewal(time:{value:number}) {
  const parts: BufferGeometry[]=[];
  for(let plant=0;plant<3;plant++) {
    const {x,z}=ugatScenePoint(3,-1.5+plant*.42,-8.65-(plant%2)*.2);
    const stem=new CylinderGeometry(.017,.028,.37,5);stem.translate(0,.185,0);
    const geometries: BufferGeometry[]=[stem];
    for(const side of [-1,1]) {
      const leaf=new SphereGeometry(1,6,3);leaf.scale(.19,.018,.095);leaf.rotateZ(side*.4);leaf.translate(side*.12,.3,0);geometries.push(leaf);
    }
    for(const [index,g] of geometries.entries()) {
      const count=g.attributes.position.count;
      g.setAttribute('shootOrigin',new Float32BufferAttribute(Array.from({length:count},()=>[x,z,plant]).flat(),3));
      const c=index===0?[.14,.22,.07]:index===1?[.22,.4,.09]:[.37,.5,.12];
      g.setAttribute('color',new Float32BufferAttribute(Array.from({length:count},()=>c).flat(),3));
      g.deleteAttribute('uv');parts.push(g);
    }
  }
  const geometry=mergeGeometries(parts,false)!;parts.forEach(p=>p.dispose());
  // Positions are local to each shoot; set bounds for their shader world offsets.
  geometry.computeBoundingSphere();const center=ugatScenePoint(3,-1.1,-8.7);geometry.boundingSphere!.center.set(center.x,.3,center.z);geometry.boundingSphere!.radius=1.3;
  const growth={value:0};
  const material=new MeshLambertMaterial({vertexColors:true});
  material.onBeforeCompile=shader=>{
    shader.uniforms.renewalTime=time;shader.uniforms.renewalGrowth=growth;
    shader.vertexShader='attribute vec3 shootOrigin;uniform float renewalTime;uniform float renewalGrowth;\n'+shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      float opened=clamp(renewalGrowth*3.-shootOrigin.z,0.,1.);
      transformed*=mix(.4,1.35,opened);
      transformed.x+=sin(renewalTime*1.6+shootOrigin.z)*.02*position.y;
      transformed+=vec3(shootOrigin.x,0.,shootOrigin.y);
    `);
  };
  material.customProgramCacheKey=()=>"wikalino-ugat-renewal-v1";
  const mesh=new Mesh(geometry,material);mesh.name="Three shoots of renewal";
  const group=new Group();group.add(mesh);
  let target=0,previous=-1;
  return {group,setProgress(progress:number){target=Math.max(0,Math.min(1,progress));if(previous<0)growth.value=target;},update(elapsed:number){
    const dt=previous<0?0:Math.max(0,Math.min(.1,elapsed-previous));previous=elapsed;
    growth.value+=(target-growth.value)*Math.min(1,dt*2);
  }};
}
