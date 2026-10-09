import { ugatScenePoint, UGAT_SCENE_PLACEMENTS } from "./ugat-scene-placement";
import { CatmullRomCurve3, Float32BufferAttribute, Group, Mesh, MeshLambertMaterial, SphereGeometry, TubeGeometry, Vector3 } from "three";
import { UGAT_FAMILY, UGAT_FURNISHINGS, UGAT_MEMORIES, UGAT_ROOT_BEDS, UGAT_TREES, ugatPathDistance } from "./ugat-layout";
import { createHubTree } from "./hub-trees";
import { addCanopyWind, mottled } from "./hub-storybook-art";
import { mergeColoredScenery } from "./merge-colored-scenery";
import { createTreeSurfaceTexture } from "./tree-surface-texture";
import { createUgatGround } from "./ugat-ground";
import { createUgatAtmosphere } from "./ugat-atmosphere";
import { createUgatStoryDetails } from "./ugat-story-details";
import { createUgatRenewal } from "./ugat-renewal";
import { createUgatFamily } from "./ugat-family";
export { UGAT_STORY } from "./story-world.constants";
export { UGAT_ROOT_BEDS, UGAT_TREES } from "./ugat-layout";
const furniture = [...UGAT_MEMORIES,...UGAT_FURNISHINGS];

export function canStandInUgat(x:number,z:number) {
  return !UGAT_ROOT_BEDS.some(bed=>((x-bed.x)/(bed.rx+.42))**2+((z-bed.z)/(bed.rz+.42))**2<1)
    && !UGAT_TREES.some(([tx,tz])=>Math.hypot(x-tx,z-tz)<.82)
    && !furniture.some(p=>Math.abs(x-p.x)<p.w/2+.25&&Math.abs(z-p.z)<p.d/2+.3)
    && !UGAT_FAMILY.some(p=>Math.hypot(x-p.x,z-p.z)<.42);
}
export function moveThroughUgat(position:{x:number;z:number},dx:number,dz:number) {
  const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.15));
  for(let i=0;i<steps;i++) {
    if(canStandInUgat(position.x+dx/steps,position.z))position.x+=dx/steps;
    if(canStandInUgat(position.x,position.z+dz/steps))position.z+=dz/steps;
  }
}

/** A sunlit grove of memories: roots are a metaphor, the ending's dawn is literal.
 * The roots are symbolic; the memory furnishings and people follow the text. */
export function createUgatForest() {
  const group=new Group();group.name="Ugat — ang bagong araw";
  const trees=new Group(),details=new Group();trees.name="Tangled roots and living canopy";details.name="Memories from Ugat";
  const time={value:0};
  const renewal=createUgatRenewal(time);
  const family=createUgatFamily();
  group.add(createUgatGround(),trees,details,createUgatStoryDetails(time),createUgatAtmosphere(time),renewal.group,family.group);
  function ball(parent:Group,color:number,x:number,y:number,z:number,sx:number,sy:number,sz:number) {
    const mesh=new Mesh(mottled(new SphereGeometry(1,7,4),.09),new MeshLambertMaterial({color,vertexColors:true}));
    mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);parent.add(mesh);return mesh;
  }
  function root(x:number,z:number,angle:number,length:number,seed:number) {
    const point=(distance:number,y:number,side:number)=>new Vector3(x+Math.sin(angle)*distance+Math.cos(angle)*side,y,z+Math.cos(angle)*distance-Math.sin(angle)*side);
    const curve=new CatmullRomCurve3([point(0,.31,0),point(length*.3,.13,.12*Math.sin(seed)),point(length*.65,.04,-.12),point(length,.007,.06)]);
    const geometry=new TubeGeometry(curve,8,.13,5,false),p=geometry.getAttribute('position');
    for(let ring=0;ring<=8;ring++) {
      const t=ring/8,center=curve.getPointAt(t),radius=1-t*.88;
      for(let side=0;side<=5;side++) {
        const i=ring*6+side;
        p.setXYZ(i,center.x+(p.getX(i)-center.x)*radius,center.y+(p.getY(i)-center.y)*radius,center.z+(p.getZ(i)-center.z)*radius);
      }
    }
    geometry.computeVertexNormals();geometry.setAttribute('treeSurface',new Float32BufferAttribute(new Float32Array(p.count).fill(1),1));
    trees.add(new Mesh(geometry,new MeshLambertMaterial({color:0x80654a})));
  }
  UGAT_TREES.forEach(([x,z],i)=>{
    const tree=createHubTree(3.5+i%3*.48,i*.83);tree.position.set(x,0,z);trees.add(tree);
    for(let j=0;j<3;j++)root(x,z,i+j*Math.PI*2/3,1.15+(j%2)*.25,i+j);
  });
  // The title becomes visible: intertwined roots, not generic magic ponds.
  for(const [index,bed] of UGAT_ROOT_BEDS.entries()) {
    ball(details,0x776447,bed.x,.012,bed.z,bed.rx,.06,bed.rz);
    for(let i=0;i<8;i++) {
      const angle=i*2.399+index*.7,end=angle+2.15+Math.sin(i*3.1)*.5;
      const point=(a:number,r:number,y:number)=>new Vector3(bed.x+Math.cos(a)*bed.rx*r,y,bed.z+Math.sin(a)*bed.rz*r);
      const curve=new CatmullRomCurve3([
        point(angle,.94,.005),point(angle+.13,.63,.065),
        point(angle+.8,.23,.12+(i%3)*.047),point(end-.2,.53,.09),point(end,.93,.005),
      ]);
      const geometry=new TubeGeometry(curve,9,.056+(i%3)*.014,5,false),p=geometry.getAttribute('position');
      // Irregular crossings and tapered buried ends avoid a repeated spiral motif.
      for(let ring=0;ring<=9;ring++) {
        const t=ring/9,center=curve.getPointAt(t),taper=.18+.82*Math.sin(Math.PI*t)**.55;
        for(let side=0;side<=5;side++) {
          const v=ring*6+side;
          p.setXYZ(v,center.x+(p.getX(v)-center.x)*taper,center.y+(p.getY(v)-center.y)*taper,center.z+(p.getZ(v)-center.z)*taper);
        }
      }
      geometry.computeVertexNormals();
      geometry.setAttribute('treeSurface',new Float32BufferAttribute(new Float32Array(geometry.attributes.position.count).fill(1),1));
      trees.add(new Mesh(geometry,new MeshLambertMaterial({color:0x66503d})));
    }
  }
  for(let i=0;i<50;i++) {
    const x=Math.sin(i*4.71)*10,z=12-(i%14)*2;
    if(!canStandInUgat(x,z)||ugatPathDistance(x,z)<2.7)continue;
    // Taller shrubs stay outside the walkable central trail.
    if(Math.abs(x)>7.8)ball(trees,0x789b48,x,.35,z,.65,.45,.55);
    for(let leaf=0;leaf<3;leaf++) {
      const a=leaf*2.4+i;
      const fern=ball(trees,leaf%2?0x779d4c:0x94af5a,x+Math.cos(a)*.14,.16,z+Math.sin(a)*.14,.045,.24,.2);
      fern.rotation.set(.45, a, .2);
    }
  }
  // Roots at the document table make complicity personal, not merely distant.
  for(let i=0;i<3;i++){const p=ugatScenePoint(2,-5.35+i*.38,-5.95);root(p.x,p.z,i*.8+1+UGAT_SCENE_PLACEMENTS[2].angle,1.1,i);}
  mergeColoredScenery(trees);mergeColoredScenery(details);
  addCanopyWind(trees,time,createTreeSurfaceTexture());
  group.traverse(o=>{o.updateMatrix();o.matrixAutoUpdate=false;});
  group.userData.storyMemories=UGAT_MEMORIES;
  return {group,setProgress:renewal.setProgress,update(elapsed:number){time.value=elapsed;renewal.update(elapsed);family.update(elapsed);}};
}
