import { BufferGeometry, Color, DoubleSide, Float32BufferAttribute, Mesh, MeshLambertMaterial, Vector3 } from "three";
import { HUB_HOUSES } from "./hub-layout";
import { createHouseSurfaceTexture } from "./house-surface-texture";

type Point = [number, number, number];
type Uv = [number, number];

/** Three raised Filipino village homes, one static mesh and one atlas.
 * Window openings and projecting shutters give depth without heavy GLB assets. */
export function createHubHouses() {
  const positions: number[] = [], normals: number[] = [], uv: number[] = [], colors: number[] = [];
  let origin = { x: 0, z: 0 };
  const color = new Color(), aNormal = new Vector3(), bNormal = new Vector3();
  function triangle(a: Point, b: Point, c: Point, tile: number, tint: number, coords: Uv[] = [[0,0],[1,0],[.5,1]]) {
    aNormal.set(b[0]-a[0], b[1]-a[1], b[2]-a[2]);
    bNormal.set(c[0]-a[0], c[1]-a[1], c[2]-a[2]); aNormal.cross(bNormal).normalize();
    color.setHex(tint);
    for (const [index, p] of [a,b,c].entries()) {
      positions.push(p[0] + origin.x, p[1], p[2] + origin.z);
      normals.push(aNormal.x, aNormal.y, aNormal.z);
      // Baked eave shade brings out the wall depth without a shadow-map pass.
      const eaveShade = tile === 1 || tile === 3 ? 1 - Math.max(0, (p[1]-2.5)/.55) * .2 : 1;
      colors.push(color.r * eaveShade, color.g * eaveShade, color.b * eaveShade);
      // Inset samples stop adjacent swatches bleeding through at distance.
      uv.push((tile % 2) * .5 + .008 + coords[index][0] * .484,
        Math.floor(tile / 2) * .5 + .008 + coords[index][1] * .484);
    }
  }
  function quad(a: Point, b: Point, c: Point, d: Point, tile = 0, tint = 0xffffff) {
    triangle(a,b,c,tile,tint,[[0,0],[1,0],[1,1]]);
    triangle(a,c,d,tile,tint,[[0,0],[1,1],[0,1]]);
  }
  function box(x: number, y: number, z: number, w: number, h: number, d: number, tint = 0xffffff) {
    const l=x-w/2,r=x+w/2,b=y-h/2,t=y+h/2,n=z-d/2,f=z+d/2;
    quad([l,b,f],[r,b,f],[r,t,f],[l,t,f],0,tint);
    quad([r,b,n],[l,b,n],[l,t,n],[r,t,n],0,tint);
    quad([l,b,n],[l,b,f],[l,t,f],[l,t,n],0,tint);
    quad([r,b,f],[r,b,n],[r,t,n],[r,t,f],0,tint);
    quad([l,t,f],[r,t,f],[r,t,n],[l,t,n],0,tint);
    quad([l,b,n],[r,b,n],[r,b,f],[l,b,f],0,tint);
  }
  for (const [index, house] of HUB_HOUSES.entries()) {
    origin = house;
    const wallTile = index === 1 ? 3 : 1;
    const wallTint = [0xfff0d1,0xd3d5c6,0xe9dfbf][index];
    const shutterTint = [0x729285,0x9a6c57,0x738d97][index];
    const ridge = [4.5,4.35,4.65][index];
    // Continuous corner posts support a raised floor and the roof.
    for (const x of [-1.98,1.98]) for (const z of [-1.52,1.52]) box(x,1.53,z,.16,3.1,.16,0xb9a386);
    box(0,.8,0,4.35,.14,3.5,0xcbbb9f);
    function front(x0: number, x1: number, y0: number, y1: number, z = 1.65, tile = wallTile, tint = wallTint) {
      quad([x0,y0,z],[x1,y0,z],[x1,y1,z],[x0,y1,z],tile,tint);
    }
    // Leave real openings for the two windows and the recessed door.
    for (const [l,r] of [[-2.1,-1.8],[-.9,-.45],[.45,.9],[1.8,2.1]]) front(l,r,.87,3.05);
    for (const [l,r] of [[-1.8,-.9],[.9,1.8]]) { front(l,r,.87,1.65); front(l,r,2.55,3.05); }
    front(-.45,.45,2.48,3.05);
    front(-.45,.45,.87,2.48,1.5,0,0x4a4034);
    for (const x of [-.45,.45]) quad([x,.87,1.5],[x,.87,1.65],[x,2.48,1.65],[x,2.48,1.5],0,0x8d7960);
    quad([-.45,2.48,1.5],[.45,2.48,1.5],[.45,2.48,1.65],[-.45,2.48,1.65],0,0x8d7960);
    for (const x of [-.48,.48]) front(x-.035,x+.035,.87,2.53,1.675,0,0xb6a080);
    front(-.52,.52,2.48,2.55,1.675,0,0xb6a080);
    front(.29,.34,1.56,1.62,1.51,3,0xc3a158);
    for (const [cx, side] of [[-1.35,1],[1.35,-1]]) {
      front(cx-.45,cx+.45,1.65,2.55,1.49,3,0x293930);
      for (const x of [cx-.45,cx+.45]) quad([x,1.65,1.49],[x,1.65,1.65],[x,2.55,1.65],[x,2.55,1.49],0,0x8d7960);
      for (const y of [1.65,2.55]) quad([cx-.45,y,1.49],[cx+.45,y,1.49],[cx+.45,y,1.65],[cx-.45,y,1.65],0,0x8d7960);
      for (const x of [cx-.47,cx+.47]) front(x-.035,x+.035,1.61,2.6,1.69,0,0xbdab8b);
      for (const y of [1.64,2.57]) front(cx-.5,cx+.5,y-.03,y+.03,1.69,0,0xbdab8b);
      box(cx,1.62,1.71,1.08,.07,.2,0xb9a88b);
      const hinge=cx-side*.48, outside=hinge-side*.63;
      quad([outside,1.68,1.96],[hinge,1.68,1.69],[hinge,2.53,1.69],[outside,2.53,1.96],3,shutterTint);
    }
    // Side windows have the same recessed construction and framed edges.
    for (const side of [-1,1]) {
      function wall(z0: number, z1: number, y0: number, y1: number, x = side * 2.1, tile = wallTile, tint = wallTint) {
        quad([x,y0,z0],[x,y0,z1],[x,y1,z1],[x,y1,z0],tile,tint);
      }
      wall(-1.65,-.55,.87,3.05);wall(.55,1.65,.87,3.05);
      wall(-.55,.55,.87,1.7);wall(-.55,.55,2.55,3.05);
      wall(-.55,.55,1.7,2.55,side*1.94,3,0x293930);
      for (const z of [-.55,.55]) quad([side*1.94,1.7,z],[side*2.1,1.7,z],[side*2.1,2.55,z],[side*1.94,2.55,z],0,0x8d7960);
      for (const y of [1.7,2.55]) quad([side*1.94,y,-.55],[side*2.1,y,-.55],[side*2.1,y,.55],[side*1.94,y,.55],0,0x8d7960);
      for (const z of [-.57,.57]) wall(z-.03,z+.03,1.66,2.6,side*2.12,0,0xbdab8b);
      for (const y of [1.69,2.58]) wall(-.6,.6,y-.03,y+.03,side*2.12,0,0xbdab8b);
    }
    quad([2.1,.87,-1.65],[-2.1,.87,-1.65],[-2.1,3.05,-1.65],[2.1,3.05,-1.65],wallTile,wallTint);
    // Hipped nipa roof with deep overhangs, a timber fascia and ridge cap.
    quad([-2.55,3.05,2.22],[-2.55,3.05,-2.22],[0,ridge,-.72],[0,ridge,.72],2);
    quad([2.55,3.05,-2.22],[2.55,3.05,2.22],[0,ridge,.72],[0,ridge,-.72],2);
    triangle([2.55,3.05,2.22],[-2.55,3.05,2.22],[0,ridge,.72],2,0xe4dbbe);
    triangle([-2.55,3.05,-2.22],[2.55,3.05,-2.22],[0,ridge,-.72],2,0xe4dbbe);
    for (const side of [-1,1]) {
      quad([-2.55,2.93,side*2.22],[2.55,2.93,side*2.22],[2.55,3.05,side*2.22],[-2.55,3.05,side*2.22],0,0x907c61);
      quad([side*2.55,2.93,-2.22],[side*2.55,2.93,2.22],[side*2.55,3.05,2.22],[side*2.55,3.05,-2.22],0,0x907c61);
    }
    box(0,ridge+.025,0,.17,.14,1.66,0xc1ac7f);
    for (let step=0;step<3;step++) box(0,.125*(step+1),2.63-step*.36,1.03,.25*(step+1),.42,0xd0bea0);
    // Diagonal braces are visible in the shaded space below the raised floor.
    for (const side of [-1,1]) quad([side*1.88,.03,1.53],[side*1.82,.03,1.53],[side*.55,.72,1.53],[side*.62,.72,1.53],0,0xa68c6e);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position",new Float32BufferAttribute(positions,3));
  geometry.setAttribute("normal",new Float32BufferAttribute(normals,3));
  geometry.setAttribute("uv",new Float32BufferAttribute(uv,2));
  geometry.setAttribute("color",new Float32BufferAttribute(colors,3));
  geometry.computeBoundingSphere();
  const mesh = new Mesh(geometry,new MeshLambertMaterial({map:createHouseSurfaceTexture(),vertexColors:true,side:DoubleSide,alphaTest:.4}));
  mesh.name = "Raised village houses with woven walls and thatched roofs";
  mesh.userData.houseCount = HUB_HOUSES.length;
  mesh.updateMatrix();mesh.matrixAutoUpdate=false;
  return mesh;
}
