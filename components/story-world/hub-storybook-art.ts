import { BufferGeometry, Color, CylinderGeometry, Float32BufferAttribute, Group, Mesh, MeshLambertMaterial, PlaneGeometry, SphereGeometry } from "three";
import { meadowTexture } from "./story-world-environment";
import { mergeColoredScenery } from "./merge-colored-scenery";
import { portalApproachClear } from "./hub-layout";

export const HUB_MUSHROOM_SCALE = 0.48;

/** A closed, ridged leaf with an arched centerline, visible from below as well as above. */
export function villagePalmFrond(length: number, width: number, rise: number) {
  const vertices: number[] = [], indices: number[] = [];
  const segments = 5;
  for (let ring = 0; ring <= segments; ring++) {
    const t = ring / segments;
    const span = .018 + Math.sin(Math.PI * t) * width;
    const x = t * length, y = Math.sin(Math.PI * t) * rise - .48 * t * t;
    vertices.push(x,y+span*.3,0, x,y,span, x,y-span*.14,0, x,y,-span);
    if (ring === segments) continue;
    for (let side = 0; side < 4; side++) {
      const a = ring * 4 + side, b = ring * 4 + (side + 1) % 4;
      indices.push(a,b+4,a+4, a,b,b+4);
    }
  }
  const end = segments * 4;
  indices.push(0,2,1, 0,3,2, end,end+1,end+2, end,end+2,end+3);
  const geometry = new BufferGeometry();
  geometry.setAttribute("position",new Float32BufferAttribute(vertices,3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return mottled(geometry,.1);
}

/** Gentle canopy wind after batching, using a uniform instead of JS vertex edits. */
export function addCanopyWind(root: Group, time: { value: number }) {
  root.traverse(object => {
    if (!(object instanceof Mesh) || !(object.material instanceof MeshLambertMaterial)) return;
    const p = object.geometry.getAttribute("position"), c = object.geometry.getAttribute("color");
    if (!c) return;
    const weights = new Float32Array(p.count);
    for (let i = 0; i < p.count; i++) {
      // Only high, green foliage moves. Brown trunks and low shrubs stay planted.
      if (c.getY(i) > c.getX(i) * 1.1 && c.getY(i) > c.getZ(i) * 1.3)
        weights[i] = Math.min(1, Math.max(0, (p.getY(i) - 2) / 2));
    }
    object.geometry.setAttribute("canopyWeight", new Float32BufferAttribute(weights, 1));
    object.material.onBeforeCompile = shader => {
      shader.uniforms.canopyTime = time;
      shader.vertexShader = "attribute float canopyWeight; uniform float canopyTime;\n" + shader.vertexShader
        .replace("#include <begin_vertex>", `#include <begin_vertex>
          float breeze = sin(canopyTime * 1.15 + position.x * 0.31 + position.z * 0.2);
          transformed.x += breeze * canopyWeight * 0.085;
          transformed.z += cos(canopyTime * 0.8 + position.z * 0.25) * canopyWeight * 0.045;`);
    };
    object.material.customProgramCacheKey = () => "wikalinggo-canopy-wind-v1";
  });
}

/** Painted grass is one shared 256px texture; playable ground remains level. */
export function createHubGrass() {
  const texture = meadowTexture();
  texture.repeat.set(24, 26);
  const terrain = new PlaneGeometry(110, 120, 26, 30);
  terrain.rotateX(-Math.PI / 2); terrain.translate(0, 0, -4);
  const position = terrain.getAttribute("position");
  const colors = new Float32Array(position.count * 3);
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i), z = position.getZ(i);
    const edge = Math.max(-x - 38, x - 40, -z - 42, z - 34, 0);
    const rise = Math.min(1, edge / 10);
    position.setY(i, -.07 + rise * rise * (4 + Math.sin(x * .16 + z * .12) * 1.8));
    const shade = .96 + Math.sin(x * .19 + z * .24) * .06;
    colors.set([shade, shade, shade * .94], i * 3);
  }
  terrain.setAttribute("color", new Float32BufferAttribute(colors, 3));
  terrain.computeVertexNormals();
  const material = new MeshLambertMaterial({map: texture, vertexColors: true});
  const mesh = new Mesh(terrain, material); mesh.name = "Painted leafy grass and rolling banks";
  return mesh;
}

/** Local vertex color variation makes foliage/bark feel painted, without extra materials. */
export function mottled(geometry: BufferGeometry, strength = .16) {
  const p = geometry.getAttribute("position"), colors = new Float32Array(p.count * 3);
  const color = new Color();
  for (let i = 0; i < p.count; i++) {
    const variation = .87 + strength * Math.sin(p.getX(i)*9+p.getZ(i)*5) * Math.cos(p.getY(i)*8);
    color.setRGB(variation, variation, variation*.94).toArray(colors,i*3);
  }
  geometry.setAttribute("color",new Float32BufferAttribute(colors,3));
  return geometry;
}

export function createHubUndergrowth() {
  const root = new Group(); root.name = "Storybook mushroom gardens";
  function add(color:number, geometry:BufferGeometry, x:number,y:number,z:number,sx=1,sy=1,sz=1) {
    const mesh = new Mesh(geometry,new MeshLambertMaterial({color}));
    mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);root.add(mesh);return mesh;
  }
  // Knee-high mushroom clusters preserve the storybook look without hiding the view.
  const mushrooms = [[-5,7,1.2],[5,4,.9],[-20,-16,1.3],[-28,-19,.95],[10,-18,1.35],[25,-24,1.1],[14,-32,.9],[13,13,1.15]];
  mushrooms.forEach(([x,z,size],index)=>{
    if (portalApproachClear(x,z)) return;
    const s = size * HUB_MUSHROOM_SCALE;
    add(0xe6d9b1,new CylinderGeometry(.2,.35,1.6,7),x,.8*s,z,s,s,s);
    add(0xbca77b,new CylinderGeometry(.32,.42,.12,8),x,1.1*s,z,s,s,s);
    add(index%3===0?0xdb7655:0xc95446,new SphereGeometry(1,12,5,0,Math.PI*2,0,Math.PI/2),x,1.6*s,z,1.15*s,.62*s,1.15*s);
    add(0xf4dcba,new CylinderGeometry(1.15,1.1,.08,12),x,1.59*s,z,s,s,s);
    for(let spot=0;spot<6;spot++) {
      const phi=spot*2.399,theta=.25+(spot%3)*.32,r=1.15*s*Math.sin(theta);
      const dot=add(0xffefd0,new SphereGeometry(1,6,3),x+r*Math.cos(phi),1.6*s+.625*s*Math.cos(theta),z+r*Math.sin(phi),.14*s,.025*s,.13*s);
      dot.rotation.set(Math.sin(phi)*theta,0,-Math.cos(phi)*theta);
    }
    add(0xe6d9b1,new CylinderGeometry(.1,.16,.65,6),x+.95*s,.325*s,z+.65,s,s,s);
    add(0xd77552,new SphereGeometry(1,8,4,0,Math.PI*2,0,Math.PI/2),x+.95*s,.65*s,z+.65,.48*s,.3*s,.48*s);
  });
  // Deterministic curved grass fans scattered off the walking routes.
  for(let i=0;i<140;i++) {
    const x=Math.sin(i*12.9898)*33,z= Math.cos(i*7.233)*30-3;
    if(Math.abs(x+13)<4 || (x < -18 && z < -25) || (x>12 && z>-6) || Math.abs(x)<2.2 || portalApproachClear(x,z)) continue;
    for(let blade=0;blade<3;blade++) {
      const h=.35+(i%4)*.12, lean=(blade-1)*.25;
      const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute([-.09,0,0,.09,0,0,lean+.04,h*.6,.08, -.09,0,0,lean+.04,h*.6,.08,lean*1.8,h,.15],3));g.computeVertexNormals();
      const grass=add(blade%2?0x729b36:0x96b94e,g,x+blade*.1,0,z);grass.rotation.y=i;
    }
  }
  mergeColoredScenery(root);
  root.traverse(o=>{o.updateMatrix();o.matrixAutoUpdate=false;});
  return root;
}
