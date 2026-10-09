import { ugatScenePoint, UGAT_SCENE_PLACEMENTS } from "./ugat-scene-placement";
import { BufferGeometry, Color, DoubleSide, Float32BufferAttribute, Group, Mesh, ShaderMaterial, UniformsLib, UniformsUtils } from "three";

/** Drifting leaves and the final window's dawn beam share one small effects pass. */
export function createUgatAtmosphere(time:{value:number}) {
  const p:number[]=[],uv:number[]=[],kind:number[]=[],phase:number[]=[],colors:number[]=[],indices:number[]=[];
  const color=new Color();
  function quad(points:number[][],effect:number,seed:number,tint:number) {
    const first=p.length/3;color.setHex(tint);
    for(const [i,v] of points.entries()) {p.push(...v);uv.push(i===1||i===2?1:0,i>=2?1:0);kind.push(effect);phase.push(seed);color.toArray(colors,colors.length);}
    indices.push(first,first+1,first+2,first,first+2,first+3);
  }
  for(let i=0;i<18;i++) {
    const x=Math.sin(i*5.7)*6.6,z=10-(i%9)*2.9,y=1.2+(i%4)*.7,w=.075+(i%3)*.02;
    quad([[x-w,y-w,z],[x+w,y-w,z],[x+w,y+w,z],[x-w,y+w,z]],0,i*.71,i%3===0?0xbcab67:0x91ac55);
  }
  // The story ends with daylight through a small window, not a magical spotlight.
  quad([[-.88,2.87,-11.48],[.88,2.87,-11.48],[1.65,.09,-9.05],[-1.15,.09,-9.05]].map(([x,y,z])=>{const p=ugatScenePoint(3,x,z);return [p.x,y*UGAT_SCENE_PLACEMENTS[3].scale,p.z];}),1,0,0xffe6a3);
  const geometry=new BufferGeometry();geometry.setAttribute('position',new Float32BufferAttribute(p,3));geometry.setAttribute('uv',new Float32BufferAttribute(uv,2));
  geometry.setAttribute('effect',new Float32BufferAttribute(kind,1));geometry.setAttribute('phase',new Float32BufferAttribute(phase,1));geometry.setAttribute('color',new Float32BufferAttribute(colors,3));geometry.setIndex(indices);
  geometry.computeBoundingSphere();geometry.boundingSphere!.radius+=2;
  const material=new ShaderMaterial({transparent:true,depthWrite:false,side:DoubleSide,forceSinglePass:true,fog:true,uniforms:UniformsUtils.merge([UniformsLib.fog,{time}]),
    vertexShader:`attribute float effect;attribute float phase;attribute vec3 color;uniform float time;varying vec2 leafUv;varying float mode;varying vec3 tint;
      #include <fog_pars_vertex>
      void main(){vec3 p=position;leafUv=uv;mode=effect;tint=color;
        if(effect<.5){p.x+=sin(time*.45+phase)*.45;p.z+=cos(time*.32+phase)*.27;p.y+=sin(time*.7+phase)*.22;}
        vec4 mvPosition=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader:`varying vec2 leafUv;varying float mode;varying vec3 tint;
      #include <fog_pars_fragment>
      void main(){float a;if(mode<.5){vec2 q=leafUv*2.-1.;if(abs(q.x)>.65*(1.-q.y*q.y))discard;a=.8;}else{a=pow(sin(leafUv.x*3.14159),2.)*(1.-leafUv.y)*.19;}
        gl_FragColor=vec4(tint,a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`});
  material.uniforms.time=time;
  const mesh=new Mesh(geometry,material);mesh.name="Leaves and dawn through the window";
  const group=new Group();group.add(mesh);return group;
}
