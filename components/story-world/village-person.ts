import {
  BufferGeometry, Color, Float32BufferAttribute, Group, Mesh, MeshLambertMaterial,
  Object3D, SphereGeometry,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

type Point = [number, number, number];
type Ring = [y: number, width: number, depth: number, forward?: number];
export type VillagePersonStyle = "guide" | "farmer" | "resident" | "elder" | "child";

const OUTFITS = {
  guide: { skin: 0xb78259, shirt: 0x447c76, trousers: 0x4a514a, hair: 0x252522, trim: 0xd2c5a7 },
  farmer: { skin: 0xa9714d, shirt: 0xd0bea0, trousers: 0x505f65, hair: 0x292620, trim: 0x917651 },
  resident: { skin: 0xc08c66, shirt: 0xa15e50, trousers: 0x3c4c59, hair: 0x302821, trim: 0xe2cbaa },
  elder: { skin: 0xad7955, shirt: 0xe0d6b9, trousers: 0x635d51, hair: 0xc2c1b5, trim: 0xb9ad90 },
  child: { skin: 0xbf8b61, shirt: 0x719487, trousers: 0x3e5264, hair: 0x272822, trim: 0xe2d6b7 },
};

/** Closed, smoothly shaded elliptical rings form anatomy and tailored clothing. */
function loft(rings: Ring[], segments = 10) {
  const positions: number[] = [], indices: number[] = [];
  for (const [y, width, depth, forward = 0] of rings) {
    for (let i = 0; i < segments; i++) {
      const a = i * Math.PI * 2 / segments;
      positions.push(Math.sin(a) * width, y, Math.cos(a) * depth + forward);
    }
  }
  for (let row = 1; row < rings.length; row++) for (let i = 0; i < segments; i++) {
    const a=(row-1)*segments+i,b=(row-1)*segments+(i+1)%segments,c=row*segments+i,d=row*segments+(i+1)%segments;
    indices.push(a,b,c,b,d,c);
  }
  for (const [row, top] of [[0,false],[rings.length-1,true]] as const) {
    const [y,,,z=0]=rings[row],center=positions.length/3;positions.push(0,y,z);
    for(let i=0;i<segments;i++) {
      const a=row*segments+i,b=row*segments+(i+1)%segments;
      indices.push(center,top?a:b,top?b:a);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position",new Float32BufferAttribute(positions,3));geometry.setIndex(indices);
  geometry.computeVertexNormals();return geometry;
}

// Every person remains one ordinary mesh. Hierarchical limb rotation runs in
// GLSL 1: no SkinnedMesh, bone textures, CPU skinning or animated buffer uploads.
const motion = `
attribute float personPart;
attribute float personFlex;
uniform float personTime;
uniform float personStride;
uniform float personWave;
uniform float personLook;
uniform float personSeated;
mat3 personRx(float a) { float c=cos(a),s=sin(a);return mat3(1.,0.,0.,0.,c,s,0.,-s,c); }
mat3 personRy(float a) { float c=cos(a),s=sin(a);return mat3(c,0.,-s,0.,1.,0.,s,0.,c); }
mat3 personRz(float a) { float c=cos(a),s=sin(a);return mat3(c,s,0.,-s,c,0.,0.,0.,1.); }
void personPose(out mat3 upper,out mat3 lower,out vec3 pivot,out vec3 bend) {
  upper=mat3(1.);lower=mat3(1.);pivot=vec3(0.);bend=vec3(0.);
  if(personPart>.5 && personPart<4.5) {
    bool leg=personPart<2.5;
    float side=(personPart<1.5 || (personPart>2.5 && personPart<3.5))?-1.:1.;
    float stride=sin(personTime*5.4+(side>0.?3.14159265:0.));
    pivot=vec3(side*(leg?.115:.24),leg?1.04:1.63,0.);
    bend=vec3(side*(leg?.115:.28),leg?.55:1.31,leg?.015:0.);
    float swing=stride*(leg?-.34:.24)*personStride;
    float flex=(leg?max(0.,-stride)*.65: .12+max(0.,stride)*.2)*personFlex;
    if(leg)flex*=personStride;
    lower=personRx(leg ? mix(flex,1.5707963*personFlex,personSeated) : flex+personFlex*.9*personSeated);
    upper=personRx(leg ? mix(swing,-1.5707963,personSeated) : swing-.45*personSeated);
    if(!leg && side<0.) {
      lower=personRz(-(1.55+sin(personTime*4.)*.16)*personFlex*personWave)*personRx((flex+personFlex*.9*personSeated)*(1.-personWave));
      upper=personRz(-1.05*personWave)*upper;
    }
  } else if(personPart>4.5) {
    pivot=vec3(0.,1.78,0.);upper=personRy(personLook);
  }
}
`;

/** A ~1,500-triangle adult with modelled facial features and smooth limbs. */
export function createVillagePerson(style: VillagePersonStyle = "guide", appearance: Partial<(typeof OUTFITS)["guide"]> = {}) {
  const palette={...OUTFITS[style],...appearance},parts:BufferGeometry[]=[];
  const transform=new Object3D(),tint=new Color();
  function part(geometry:BufferGeometry,color:number,position:Point=[0,0,0],scale:Point=[1,1,1],id=0,rotation:Point=[0,0,0]) {
    transform.position.set(...position);transform.scale.set(...scale);transform.rotation.set(...rotation);transform.updateMatrix();
    geometry.applyMatrix4(transform.matrix);geometry.deleteAttribute("uv");
    const p=geometry.getAttribute("position"),count=p.count;
    if(style==="child" && id===5) {
      for(let i=0;i<count;i++)p.setXYZ(i,p.getX(i)*1.15,1.78+(p.getY(i)-1.78)*1.15,p.getZ(i)*1.15);
      geometry.computeVertexNormals();
    }
    const colors=new Float32Array(count*3),ids=new Float32Array(count),flex=new Float32Array(count);
    tint.setHex(color);
    for(let i=0;i<count;i++) {
      const y=p.getY(i),z=p.getZ(i);
      // Soft under-chin/clothing fold shading, baked into vertex colors.
      const shade=id===5?.88+Math.max(0,Math.min(1,(y-1.78)/.14))*.12: .96+Math.min(.04,Math.max(0,z)*.2);
      colors.set([tint.r*shade,tint.g*shade,tint.b*shade],i*3);ids[i]=id;
      flex[i]=id===1||id===2?Math.max(0,Math.min(1,(.59-y)/.08)):id===3||id===4?Math.max(0,Math.min(1,(1.35-y)/.08)):0;
    }
    geometry.setAttribute("color",new Float32BufferAttribute(colors,3));
    geometry.setAttribute("personPart",new Float32BufferAttribute(ids,1));
    geometry.setAttribute("personFlex",new Float32BufferAttribute(flex,1));parts.push(geometry);
  }
  function oval(color:number,position:Point,scale:Point,id=0,segments=8,rings=4) {
    part(new SphereGeometry(1,segments,rings),color,position,scale,id);
  }
  function patch(points:Point[],color:number,id=0) {
    const g=new BufferGeometry();g.setAttribute("position",new Float32BufferAttribute(points.flat(),3));
    const indices:number[]=[];for(let i=1;i<points.length-1;i++)indices.push(0,i,i+1);
    g.setIndex(indices);g.computeVertexNormals();part(g,color,[0,0,0],[1,1,1],id);
  }
  // Adult proportions, tapered waist, shoulders and softly folded shirt hem.
  part(loft([[1.01,.18,.104],[1.09,.184,.11],[1.22,.165,.107],[1.43,.206,.124],[1.59,.228,.108],[1.655,.195,.085],[1.69,.082,.066]],12),palette.shirt);
  part(loft([[1.015,.18,.108],[1.065,.184,.11]],10),0x514636);
  part(loft([[1.65,.064,.065],[1.8,.071,.066]],8),palette.skin);
  // Collar, shirt placket, chest pocket and small buttons.
  patch([[-.075,1.69,.076],[-.12,1.606,.112],[-.025,1.565,.127]],palette.trim);
  patch([[.075,1.69,.076],[.025,1.565,.127],[.12,1.606,.112]],palette.trim);
  patch([[-.013,1.08,.113],[.013,1.08,.113],[.013,1.56,.128],[-.013,1.56,.128]],palette.trim);
  patch([[.084,1.37,.119],[.161,1.37,.109],[.161,1.455,.117],[.084,1.455,.128]],palette.trim);
  for(const y of [1.22,1.39,1.53]) oval(0x534e42,[0,y,.132],[.011,.011,.007],0,4,2);
  for(const side of [-1,1]) {
    const leg=side<0?1:2,arm=side<0?3:4;
    part(loft([[.12,.077,.075],[.2,.073,.071],[.4,.083,.079],[.55,.079,.081,.015],[.79,.097,.106],[1.05,.105,.104]],8),palette.trousers,[side*.115,0,0],[1,1,1],leg);
    oval(0x3b3229,[side*.115,.085,.048],[.091,.085,.175],leg,6,4);
    // Closed sleeves overlap the upper arms; elbows and wrists taper naturally.
    part(loft([[1.42,.075,.075],[1.5,.083,.082],[1.61,.08,.079],[1.65,.035,.042]],8),palette.shirt,[side*.235,0,0],[1,1,1],arm);
    part(loft([[1.07,.044,.046],[1.14,.047,.048],[1.26,.06,.061],[1.32,.057,.056],[1.445,.067,.065]],8),palette.skin,[side*.28,0,0],[1,1,1],arm);
    oval(palette.skin,[side*.28,1.025,.01],[.054,.084,.035],arm,6,4);
    oval(palette.skin,[side*.249,1.045,.033],[.024,.047,.025],arm,5,3);
    // Four subtle finger grooves, instead of a mitten or floating fingers.
    for(let finger=0;finger<3;finger++) {
      const x=side*.28-.024+finger*.023;
      patch([[x,.963,.028],[x+.003,.963,.028],[x+.003,1.006,.044],[x,1.006,.044]],0x96633f,arm);
    }
  }
  // Cheekbones, jaw and chin are built into the head silhouette.
  part(loft([[1.765,.052,.06,.03],[1.79,.085,.079,.012],[1.85,.115,.097],[1.94,.13,.108],[2.01,.12,.108],[2.07,.102,.091],[2.105,.06,.058],[2.12,.008,.009]],12),palette.skin,[0,0,0],[1,1,1],5);
  for(const side of [-1,1]) {
    oval(palette.skin,[side*.129,1.923,-.002],[.025,.047,.024],5,6,3);
    oval(0x975f45,[side*.143,1.924,.011],[.009,.025,.012],5,5,3);
    // Almond-shaped ivory eyes with brown irises; eyebrows follow the brow.
    const x=side*.049;
    patch([[x-.027,1.963,.099],[x,1.951,.113],[x+.027,1.963,.099],[x,1.974,.113]],0xd2c8b2,5);
    oval(0x392c21,[x,1.963,.113],[.008,.009,.004],5,6,3);
    patch([[x-.028,1.99,.099],[x+.026,1.989,.1],[x+.024,1.997,.099],[x-.024,2,.096]],palette.hair,5);
  }
  // A small nose bridge, nostrils and shaped lips avoid a featureless face.
  part(loft([[1.899,.027,.009,.11],[1.916,.023,.022,.122],[1.963,.011,.011,.107]],6),palette.skin,[0,0,0],[1,1,1],5);
  patch([[-.021,1.9,.124],[-.009,1.9,.13],[-.014,1.904,.132]],0x794c39,5);
  patch([[.009,1.9,.13],[.021,1.9,.124],[.014,1.904,.132]],0x794c39,5);
  patch([[-.037,1.864,.096],[0,1.852,.108],[.037,1.864,.096],[0,1.871,.108]],0x995d4c,5);
  patch([[-.028,1.863,.1],[.028,1.863,.1],[0,1.865,.11]],0x633d32,5);
  if(style==='elder') {
    for(const y of [2.016,2.034])patch([[-.052,y,.103],[.052,y,.103],[.046,y+.003,.103],[-.046,y+.003,.103]],0x976d50,5);
  }
  // Hair follows the scalp, with a sculpted hairline and short sideburns.
  const hair=new SphereGeometry(1,12,4,0,Math.PI*2,0,Math.PI*.64);
  const hp=hair.getAttribute("position");
  for(let i=0;i<hp.count;i++) {
    const x=hp.getX(i),y=hp.getY(i),z=hp.getZ(i);
    // Lift the forehead; keep the back of the head covered down to the nape.
    hp.setY(i,y+Math.max(0,z)*.52*(1-y));
    hp.setZ(i,z+.035*Math.sin(x*8)*(1-y));
  }
  hair.computeVertexNormals();part(hair,palette.hair,[0,2.005,-.016],[.133,.127,.123],5);
  if(style==='resident') oval(palette.hair,[0,1.955,-.12],[.072,.077,.06],5,8,4);
  if(style==='farmer') {
    part(loft([[2.058,.185,.165],[2.075,.24,.212],[2.09,.13,.116],[2.2,.09,.08],[2.22,.035,.031]],12),0xbda16a,[0,0,-.004],[1,1,1],5);
    part(loft([[2.092,.13,.117],[2.115,.121,.108]],12),0x786346,[0,0,-.004],[1,1,1],5);
  }
  const geometry=mergeGeometries(parts,false);parts.forEach(p=>p.dispose());
  if(!geometry)throw new Error("Unable to build village person");
  geometry.computeBoundingSphere();geometry.boundingSphere!.radius+=.5;
  const uniforms={personTime:{value:0},personStride:{value:0},personWave:{value:0},personLook:{value:0},personSeated:{value:0}};
  const material=new MeshLambertMaterial({vertexColors:true});
  material.onBeforeCompile=shader=>{
    Object.assign(shader.uniforms,uniforms);
    shader.vertexShader=motion+shader.vertexShader
      .replace('#include <beginnormal_vertex>',`#include <beginnormal_vertex>
        mat3 upper,lower;vec3 pivot,bend;personPose(upper,lower,pivot,bend);
        objectNormal=upper*lower*objectNormal;`)
      .replace('#include <begin_vertex>',`#include <begin_vertex>
        transformed=lower*(transformed-bend)+bend;
        transformed=upper*(transformed-pivot)+pivot;
        transformed.y-=.45*personSeated;`);
  };
  material.customProgramCacheKey=()=>"wikalino-human-villager-v2";
  const mesh=new Mesh(geometry,material);mesh.name=`Village person: ${style}`;mesh.userData.kind="villager";
  const group=new Group();group.name=`Human villager: ${style}`;group.add(mesh);
  return {group,mesh,update(time:number,stride=0,wave=0,look=0,seated=0) {
    uniforms.personTime.value=time;uniforms.personStride.value=stride;
    uniforms.personWave.value=wave;uniforms.personLook.value=look;
    uniforms.personSeated.value=seated;
    mesh.position.y=Math.abs(Math.sin(time*5.4))*.012*stride;
  }};
}
