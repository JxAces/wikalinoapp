import { Color, DataTexture, Float32BufferAttribute, LinearFilter, LinearMipmapLinearFilter, Mesh, MeshLambertMaterial, PlaneGeometry, RGBAFormat } from "three";
import { meadowTexture } from "./story-world-environment";
import { UGAT_MEMORIES, UGAT_ROOT_BEDS, UGAT_TREES, ugatPathDistance } from "./ugat-layout";
import { STORY_ROUTE_START_Z } from "./story-route-layout";

/** Paint dry trails, exposed root beds and canopy shade once, not every frame. */
function terrainTexture() {
  const size=256,pixels=new Uint8Array(size*size*4),color=new Color();
  const grass=new Color(0x859c54),earth=new Color(0xc7b083),bank=new Color(0x827e57);
  for(let v=0;v<size;v++)for(let u=0;u<size;u++) {
    const x=(u/(size-1)-.5)*60,z=(.5-v/(size-1))*80-7;
    const path=Math.max(0,Math.min(1,(1.03-ugatPathDistance(x,z))/.62));
    color.copy(grass).lerp(earth,path);
    for(const bed of UGAT_ROOT_BEDS) {
      const r=Math.hypot((x-bed.x)/bed.rx,(z-bed.z)/bed.rz);
      color.lerp(bank,Math.max(0,Math.min(1,(1.28-r)/.23))*.65);
    }
    let shade=1;
    for(const [tx,tz] of UGAT_TREES) {
      const d=Math.hypot((x-tx-.55)/2.4,(z-tz+.6)/1.9);
      shade*=1-Math.max(0,1-d)*.24;
    }
    for(const memory of UGAT_MEMORIES) {
      const d=Math.hypot((x-memory.x)/(memory.w*.66),(z-memory.z)/(.7+memory.d*.3));
      shade*=1-Math.max(0,Math.min(1,(1-d)*2))*.36;
    }
    const fleck=Math.sin(x*17+Math.sin(z*9))*Math.cos(z*21)*.025;
    color.multiplyScalar(shade*(.98+fleck));const i=(v*size+u)*4;
    pixels[i]=color.r*255;pixels[i+1]=color.g*255;pixels[i+2]=color.b*255;pixels[i+3]=path*255;
  }
  const map=new DataTexture(pixels,size,size,RGBAFormat);map.name="Ugat sunlit earth and dappled shade";
  map.magFilter=LinearFilter;map.minFilter=LinearMipmapLinearFilter;map.generateMipmaps=true;map.needsUpdate=true;return map;
}
class UgatGroundMaterial extends MeshLambertMaterial {
  readonly terrainMap=terrainTexture();
  constructor() {
    super({map:meadowTexture(),vertexColors:true});
    this.onBeforeCompile=shader=>{
      shader.uniforms.ugatTerrain={value:this.terrainMap};
      shader.vertexShader='varying vec2 ugatUv;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n ugatUv=uv;');
      shader.fragmentShader='varying vec2 ugatUv; uniform sampler2D ugatTerrain;\n'+shader.fragmentShader.replace('#include <map_fragment>',`
        vec4 earth=texture2D(ugatTerrain,ugatUv);
        vec3 leaves=texture2D(map,fract(ugatUv*vec2(24.,32.))).rgb;
        float grain=mix(.8+leaves.g*.8,.95+leaves.g*.12,earth.a);
        diffuseColor.rgb*=earth.rgb*grain;
      `);
    };
  }
  customProgramCacheKey(){return "wikalino-ugat-day-ground-v1";}
}
export function createUgatGround() {
  const geometry=new PlaneGeometry(60,80,20,24);geometry.rotateX(-Math.PI/2);geometry.translate(0,-.035,-7);
  const p=geometry.getAttribute('position'),colors=new Float32Array(p.count*3);
  for(let i=0;i<p.count;i++) {
    const x=p.getX(i),z=p.getZ(i),outside=Math.max(Math.abs(x)-11,-z-22,z-(STORY_ROUTE_START_Z+2),0);
    p.setY(i,-.035+Math.min(1,outside/9)**2*(2.5+Math.sin(z*.2+x*.3)));
    colors.set([1,1,1],i*3);
  }
  geometry.setAttribute('color',new Float32BufferAttribute(colors,3));geometry.computeVertexNormals();
  const mesh=new Mesh(geometry,new UgatGroundMaterial());mesh.name="Sunlit Ugat ground";return mesh;
}
