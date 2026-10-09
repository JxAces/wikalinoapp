import { DataTexture, LinearFilter, LinearMipmapLinearFilter, MeshLambertMaterial, RGBAFormat, SRGBColorSpace } from "three";

/** Wood, cloth, paper and plaster; one 256px atlas for all the domestic scenes. */
export function ugatMemoryMaterial(time:{value:number}) {
  const size=256,pixels=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++) {
    const tile=Math.floor(x/128)+Math.floor(y/128)*2,u=x%128,v=y%128;
    const noise=Math.sin(u*127.1+v*311.7)*43758.5453%1;
    let tone=242+noise*3;
    if(tile===0)tone=226+Math.sin(u*.45+Math.sin(v*.065)*2)*10+noise*4-(u%32<1?35:0);
    if(tile===1)tone=234+(u%3===0?-14:2)+(v%3===0?-11:2)+noise*3;
    if(tile===2)tone=246+noise*3;
    if(tile===3)tone=233+noise*7+Math.sin(u*.16)*3;
    const i=(y*size+x)*4;pixels[i]=tone;pixels[i+1]=tone;pixels[i+2]=tone;pixels[i+3]=255;
  }
  const map=new DataTexture(pixels,size,size,RGBAFormat);
  map.name="Ugat household wood, cloth, paper and plaster";
  map.colorSpace=SRGBColorSpace;map.magFilter=LinearFilter;map.minFilter=LinearMipmapLinearFilter;map.generateMipmaps=true;map.needsUpdate=true;
  const material=new MeshLambertMaterial({map,vertexColors:true});
  material.onBeforeCompile=shader=>{
    shader.uniforms.memoryTime=time;
    shader.vertexShader='attribute float memoryMotion; uniform float memoryTime;\n'+shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      if(memoryMotion>2.5) {
        transformed.z+=sin(memoryTime*1.4+position.y*3.+position.x)*.07*clamp((3.1-position.y)/1.8,0.,1.);
      } else if(memoryMotion>.5) {
        transformed.y+=sin(memoryTime*1.7+position.x*5.+position.z*3.)*.012;
      }
    `);
  };
  material.customProgramCacheKey=()=>"wikalino-ugat-memory-cloth-v1";
  return material;
}
