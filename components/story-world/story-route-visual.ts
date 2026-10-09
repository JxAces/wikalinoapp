import { BoxGeometry, BufferGeometry, Color, DataTexture, Float32BufferAttribute, Group, LinearMipmapLinearFilter, Mesh, MeshLambertMaterial, Object3D, PlaneGeometry, RepeatWrapping, RGBAFormat, SphereGeometry, SRGBColorSpace } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { STORY_ROUTE_END_Z, STORY_ROUTE_START_Z, STORY_AVENUE_TREES, storyRouteBay, storyRouteHalfWidth, storyRouteX } from "./story-route-layout";
import { mergeColoredScenery } from "./merge-colored-scenery";
import { createHubTree } from "./hub-trees";
import { addCanopyWind } from "./hub-storybook-art";
import { createTreeSurfaceTexture } from "./tree-surface-texture";
import { meadowTexture } from "./story-world-environment";

/** Fine stone grain, baked once. No image decoding or full-screen postprocessing. */
function pavingTexture() {
  const size=128,pixels=new Uint8Array(size*size*4);
  let seed=701;
  for(let y=0;y<size;y++)for(let x=0;x<size;x++) {
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    const joint=y%32<1 || (x+(Math.floor(y/32)%2)*32)%64<1;
    const value=(joint?177:232)+(seed/4294967296-.5)*18;
    const i=(y*size+x)*4;pixels.set([value,value,value,255],i);
  }
  const map=new DataTexture(pixels,size,size,RGBAFormat);map.colorSpace=SRGBColorSpace;
  map.wrapS=map.wrapT=RepeatWrapping;map.generateMipmaps=true;map.minFilter=LinearMipmapLinearFilter;map.needsUpdate=true;
  return map;
}

/** Continuous pavement, low stone borders and small planted banks in two draws. */
export function createStoryPromenade(storyId:string) {
  const group=new Group();group.name="Story promenade — scrolls on the pavement";
  const warm=storyId==="m1-story-1",village=storyId==="m1-story-3";
  const pavementColor=warm?0xc5a780:village?0xb0a78a:0xbba17e;
  const p:number[]=[],uv:number[]=[],indices:number[]=[],shade:number[]=[];
  const count=100;
  for(let i=0;i<count;i++) {
    const z=STORY_ROUTE_START_Z+(STORY_ROUTE_END_Z-STORY_ROUTE_START_Z)*i/(count-1),x=storyRouteX(z),width=storyRouteHalfWidth(z);
    for(const side of [-1,1]) {
      p.push(x+side*width,.025,z);uv.push(side<0?0:1,(STORY_ROUTE_START_Z-z)/3.4);
      const light=.9+.065*Math.sin(z*.9+side);shade.push(light,light,light);
    }
    if(i<count-1){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
  }
  const geometry=new BufferGeometry();geometry.setAttribute('position',new Float32BufferAttribute(p,3));geometry.setAttribute('uv',new Float32BufferAttribute(uv,2));geometry.setAttribute('color',new Float32BufferAttribute(shade,3));geometry.setIndex(indices);geometry.computeVertexNormals();
  const road=new Mesh(geometry,new MeshLambertMaterial({color:pavementColor,map:pavingTexture(),vertexColors:true}));
  road.name="Continuous walkable stone pavement";group.add(road);
  const parts:BufferGeometry[]=[],transform=new Object3D(),tint=new Color();
  function add(g:BufferGeometry,color:number,x:number,y:number,z:number,ry=0) {
    transform.position.set(x,y,z);transform.rotation.set(0,ry,0);transform.updateMatrix();g.applyMatrix4(transform.matrix);
    const colors=new Float32Array(g.attributes.position.count*3);tint.setHex(color);
    for(let i=0;i<g.attributes.position.count;i++){const light=.86+Math.max(0,g.attributes.normal.getY(i))*.14;colors.set([tint.r*light,tint.g*light,tint.b*light],i*3);}
    g.setAttribute('color',new Float32BufferAttribute(colors,3));parts.push(g);
  }
  const borderCount=Math.floor((STORY_ROUTE_START_Z-STORY_ROUTE_END_Z)/.61);
  for(let i=0;i<borderCount;i++) {
    const z=STORY_ROUTE_START_Z-.25-i*.61,x=storyRouteX(z),width=storyRouteHalfWidth(z),angle=Math.atan2(storyRouteX(z+.05)-storyRouteX(z-.05),.1);
    for(const side of [-1,1]) {
      // Interrupt only the low border, never the paved route itself.
      if(storyRouteBay(z))continue;
      add(new BoxGeometry(.16,.11,.6),i%3?0xc3c0a3:0xaaa78d,x+side*(width+.08),.03,z,angle);
      const bush=new SphereGeometry(1,6,4);bush.scale(.34,.22+(i%3)*.035,.42);
      add(bush,village?0x6b8052:0x71964a,x+side*(width+.52),.17,z);
      if(i%4===0){const rock=new SphereGeometry(1,5,3);rock.scale(.22,.13,.19);add(rock,0x9b9a80,x+side*(width+.77),.07,z+.22);}
    }
  }
  const merged=mergeGeometries(parts,false)!;parts.forEach(g=>g.dispose());
  const edges=new Mesh(merged,new MeshLambertMaterial({vertexColors:true}));edges.name="Low kerbs, planted edges and return landing";group.add(edges);
  group.traverse(o=>{o.updateMatrix();o.matrixAutoUpdate=false;});return group;
}

/** Trees stand behind story displays; crowns frame rather than cover the road. */
export function createStoryAvenue(time:{value:number}) {
  const group=new Group();group.name="Trees framing the story scenes";
  STORY_AVENUE_TREES.forEach((p,i)=>{const tree=createHubTree(3.1+(i%3)*.25,i*1.71);tree.position.set(p.x,0,p.z);tree.scale.setScalar(p.scale);group.add(tree);});
  mergeColoredScenery(group);addCanopyWind(group,time,createTreeSurfaceTexture());
  group.traverse(o=>{o.updateMatrix();o.matrixAutoUpdate=false;});return group;
}

export function createStoryRouteGround(storyId:string) {
  const geometry=new PlaneGeometry(60,80,24,30);geometry.rotateX(-Math.PI/2);geometry.translate(0,-.05,-7);
  const p=geometry.attributes.position,colors=new Float32Array(p.count*3);
  for(let i=0;i<p.count;i++) {
    const x=p.getX(i),z=p.getZ(i),outside=Math.max(Math.abs(x)-12,-z-22,z-(STORY_ROUTE_START_Z+2),0);
    p.setY(i,-.05+Math.min(1,outside/9)**2*(2.2+Math.sin(z*.23+x*.29)));
    const shade=.91+.06*Math.cos(x*.7+z*.3);colors.set([shade,shade,shade],i*3);
  }
  geometry.setAttribute('color',new Float32BufferAttribute(colors,3));geometry.computeVertexNormals();
  const mesh=new Mesh(geometry,new MeshLambertMaterial({map:meadowTexture(),color:storyId==='m1-story-3'?0xc4c7ab:0xe8d7a8,vertexColors:true}));
  mesh.name="Leafy grass and rolling hills beside the story route";return mesh;
}
