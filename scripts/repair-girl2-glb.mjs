/** Repair the baked double face and paint the existing student model.
 * Run: node scripts/repair-girl2-glb.mjs
 * Then restore the walk rig: node scripts/add-explorer-walk.mjs student-girl
 * The untouched source is kept outside the app bundle in .source-models.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { MeshoptSimplifier } from 'meshoptimizer';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = path.join(root, 'assets/models/girl2.glb');
const source = path.join(root, 'assets/models/.source-models/girl2.glb');
fs.mkdirSync(path.dirname(source), { recursive: true });
if (!fs.existsSync(source)) {
  const candidate = fs.readFileSync(target);
  const metadata = JSON.parse(candidate.subarray(20, 20 + candidate.readUInt32LE(12)));
  if (metadata.asset.generator?.startsWith('Wikalinggo student repair')) {
    throw Error('The original source backup is missing. Restore the original girl2.glb into assets/models/.source-models before rebuilding.');
  }
  fs.copyFileSync(target, source, fs.constants.COPYFILE_EXCL);
}
const bytes = fs.readFileSync(source);
const jsonLength = bytes.readUInt32LE(12);
const original = JSON.parse(bytes.subarray(20, 20 + jsonLength));
const binary = bytes.subarray(28 + jsonLength);
const primitive = original.meshes[0].primitives[0];
function readAccessor(id) {
  const a = original.accessors[id], view = original.bufferViews[a.bufferView];
  const width = { VEC3: 3, VEC2: 2, SCALAR: 1 }[a.type];
  const size = a.componentType === 5126 ? 4 : 2;
  return Array.from({ length: a.count }, (_, i) => Array.from({ length: width }, (_, k) =>
    binary[a.componentType === 5126 ? 'readFloatLE' : 'readUInt16LE'](
      (view.byteOffset || 0) + (a.byteOffset || 0) + i * (view.byteStride || width * size) + k * size)));
}
const positions = readAccessor(primitive.attributes.POSITION);
const indices = readAccessor(primitive.indices).flat();
const centerX = -0.0006075;
const smooth = (a, b, v) => { const t = THREE.MathUtils.clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const palette = Object.fromEntries(Object.entries({
  skin: '#b87b56', hair: '#251b19', shirt: '#f5f3ec', skirt: '#243653',
  tie: '#344c77', shoes: '#20232a', sole: '#14181f', white: '#fff6e5',
  iris: '#563224', pupil: '#191719', lip: '#99534d', mouth: '#683d35',
}).map(([key, hex]) => [key, new THREE.Color(hex)]));
const parts = [];
function paint(geometry, color) {
  const attr = geometry.getAttribute('position');
  const colors = new Float32Array(attr.count * 3);
  for (let i = 0; i < attr.count; i++) {
    const c = typeof color === 'function' ? color(attr.getX(i), attr.getY(i), attr.getZ(i)) : palette[color];
    c.toArray(colors, i * 3);
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  parts.push(geometry);
  return geometry;
}
const hairline = x => 1.824 - 0.57 * Math.abs(x - centerX);
// Clip at actual color boundaries instead of coloring whole triangles. This
// avoids stair-step edges and patches of skirt color spilling onto the hands.
const baseGeometry = new THREE.BufferGeometry();
baseGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions.flat(), 3));
baseGeometry.setIndex(indices);
const welded = mergeVertices(baseGeometry, 1e-6);
welded.computeVertexNormals();
function vertex(id) {
  const p = welded.getAttribute('position'), n = welded.getAttribute('normal');
  return { p: [p.getX(id), p.getY(id), p.getZ(id)], n: [n.getX(id), n.getY(id), n.getZ(id)] };
}
function split(poly, plane) {
  const inside = [], outside = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length], da = plane(a.p), db = plane(b.p);
    (da >= 0 ? inside : outside).push(a);
    if ((da >= 0) !== (db >= 0)) {
      const t = da / (da - db);
      const cut = { p: a.p.map((v, k) => v + t * (b.p[k] - v)), n: a.n.map((v, k) => v + t * (b.n[k] - v)) };
      inside.push(cut);outside.push(cut);
    }
  }
  return [inside, outside];
}
function extract(poly, planes) {
  let inside = poly;const outside = [];
  for (const plane of planes) {
    const [yes, no] = split(inside, plane);
    if (no.length >= 3) outside.push(no);
    inside = yes;
    if (inside.length < 3) break;
  }
  return { inside, outside };
}
const faceCut = [p => p[1] - 1.568, p => hairline(p[0]) + 0.006 - p[1], p => p[2] - 0.012, p => 0.155 - Math.abs(p[0] - centerX)];
const strayCut = [p => 0.680 - p[1], p => 0.033 - Math.abs(p[0] - centerX)];
const yAbove = y => p => p[1] - y, yBelow = y => p => y - p[1];
const zAbove = z => p => p[2] - z, zBelow = z => p => z - p[2];
const xWithin = x => p => x - Math.abs(p[0] - centerX);
const colors = [
  { color: 'hair', planes: [yAbove(1.568), p => p[1] - hairline(p[0]) + 0.006] },
  { color: 'hair', planes: [yAbove(1.568), zBelow(0.012)] },
  { color: 'hair', planes: [yAbove(1.568), p => Math.abs(p[0] - centerX) - 0.145] },
  { color: 'hair', planes: [p => p[1] - (1.237 + 0.08 * (Math.abs(p[0] - centerX)/0.174) ** 4), zBelow(-0.069), xWithin(0.174)] },
  { color: 'hair', planes: [yAbove(1.47), zBelow(0.008), p => Math.abs(p[0] - centerX) - 0.088, xWithin(0.174)] },
  { color: 'skin', planes: [yAbove(1.555), xWithin(0.085)] },
  { color: 'sole', planes: [yBelow(0.026)] },
  { color: 'shoes', planes: [yBelow(0.138)] },
  { color: 'skin', planes: [yBelow(0.680)] },
  { color: 'skin', planes: [yBelow(1.306), p => Math.abs(p[0] - centerX) - Math.max(0.162, 0.192 + (1.12 - p[1]) * 0.215)] },
  { color: 'skirt', planes: [yBelow(1.115)] },
  { color: 'tie', planes: [yAbove(1.162), yBelow(1.455), xWithin(0.09), p => {
    const stops = [[1.162,0.145],[1.20,0.141],[1.25,0.139],[1.30,0.14],[1.35,0.135],[1.40,0.099],[1.455,0.091]];
    for (let i = 1; i < stops.length; i++) if (p[1] <= stops[i][0]) {
      const [y0,z0] = stops[i-1], [y1,z1] = stops[i];return p[2] - (z0 + (z1-z0)*(p[1]-y0)/(y1-y0));
    }
    return p[2] - 0.091;
  }] },
];
const bodyP = [], bodyN = [], bodyC = [];
function emit(poly, key) {
  for (let i = 1; i + 1 < poly.length; i++) {
    for (const v of [poly[0], poly[i], poly[i+1]]) {
      bodyP.push(...v.p);const n = new THREE.Vector3(...v.n).normalize();bodyN.push(n.x,n.y,n.z);bodyC.push(...palette[key].toArray());
    }
  }
}
let removed = 0;
for (let i = 0; i < welded.index.count; i += 3) {
  let polys = [[vertex(welded.index.getX(i)), vertex(welded.index.getX(i+1)), vertex(welded.index.getX(i+2))]];
  for (const cut of [faceCut, strayCut]) {
    polys = polys.flatMap(poly => {const result = extract(poly, cut);if(result.inside.length >= 3) removed++;return result.outside;});
  }
  for (const region of colors) {
    polys = polys.flatMap(poly => { const result = extract(poly, region.planes);if(result.inside.length >= 3) emit(result.inside, region.color);return result.outside; });
  }
  polys.forEach(poly => emit(poly, 'shirt'));
}
let body = new THREE.BufferGeometry();
body.setAttribute('position', new THREE.Float32BufferAttribute(bodyP, 3));
body.setAttribute('normal', new THREE.Float32BufferAttribute(bodyN, 3));
body.setAttribute('color', new THREE.Float32BufferAttribute(bodyC, 3));
body = mergeVertices(body, 1e-5);
// Keep the repaired asset modest for mobile. Locked color seams preserve the
// uniform edges; the error bound is less than two millimeters at this scale.
await MeshoptSimplifier.ready;
const [simplified] = MeshoptSimplifier.simplify(
  new Uint32Array(body.index.array), body.getAttribute('position').array,
  3, 24000 * 3, 0.0007, ['LockBorder'],
);
body.setIndex(new THREE.BufferAttribute(simplified, 1));
body = mergeVertices(body, 1e-5);
parts.push(body);

// A single smooth face, with a centered nose, cheeks and a softly rounded chin.
// Ordinary vertex geometry/colors work on Expo's WebGL 1 renderer too.
const cy = 1.720, rx = 0.146, ry = 0.148, rz = 0.123, cz = 0.007;
function faceZ(x, y) {
  const u = (x - centerX) / rx, v = (y - cy) / ry;
  const base = cz + rz * Math.sqrt(Math.max(0, 1 - u * u - v * v));
  const nose = 0.023 * Math.exp(-(((x - centerX) / 0.025) ** 2) - ((y - 1.687) / 0.022) ** 2);
  const bridge = 0.009 * Math.exp(-(((x - centerX) / 0.017) ** 2) - ((y - 1.714) / 0.033) ** 2);
  const forehead = 0.032 * smooth(1.755, 1.82, y) * Math.sqrt(Math.max(0, 1 - u*u / Math.max(0.001, 1-v*v)));
  return base + nose + bridge + forehead;
}
const head = new THREE.SphereGeometry(1, 48, 36);
const hp = head.getAttribute('position');
for (let i = 0; i < hp.count; i++) {
  const x = centerX + hp.getX(i) * rx, y = cy + hp.getY(i) * ry;
  const z = hp.getZ(i) >= 0 ? faceZ(x, y) : cz + hp.getZ(i) * rz;
  hp.setXYZ(i, x, y, z);
}
head.computeVertexNormals();
// Color the hidden upper head like the surrounding hair so no skin can poke
// through the center part when the character is viewed from above.
const headP = [], headN = [], headC = [];
for(let i = 0; i < head.index.count; i += 3) {
  const poly = [0,1,2].map(k => {
    const id = head.index.getX(i+k), p = head.getAttribute('position'), n = head.getAttribute('normal');
    return {p:[p.getX(id),p.getY(id),p.getZ(id)],n:[n.getX(id),n.getY(id),n.getZ(id)]};
  });
  const [hair, skin] = split(poly, p => p[1] - hairline(p[0]));
  for(const [polygon,key] of [[hair,'hair'],[skin,'skin']]) {
    for(let k = 1; k+1 < polygon.length; k++) for(const v of [polygon[0],polygon[k],polygon[k+1]]) {
      headP.push(...v.p);const n = new THREE.Vector3(...v.n).normalize();headN.push(n.x,n.y,n.z);headC.push(...palette[key].toArray());
    }
  }
}
const coloredHead = new THREE.BufferGeometry();
coloredHead.setAttribute('position',new THREE.Float32BufferAttribute(headP,3));
coloredHead.setAttribute('normal',new THREE.Float32BufferAttribute(headN,3));
coloredHead.setAttribute('color',new THREE.Float32BufferAttribute(headC,3));
parts.push(mergeVertices(coloredHead,1e-5));
const neck = new THREE.CylinderGeometry(0.052, 0.050, 0.1, 24);
neck.translate(centerX, 1.562, -0.01);paint(neck, 'skin');
// Join the existing two ribbon tails with a school-uniform bow.
for (const side of [-1, 1]) {
  const wing = new THREE.SphereGeometry(1, 16, 10);
  wing.scale(0.029, 0.016, 0.011);
  wing.rotateZ(side * 0.22);
  wing.translate(centerX + side * 0.025, 1.451, 0.101);
  paint(wing, 'tie');
}
const knot = new THREE.SphereGeometry(1, 16, 10);
knot.scale(0.013, 0.016, 0.013);knot.translate(centerX,1.451,0.106);paint(knot,'tie');

// Small curved patches follow the face rather than floating in front of it.
function patch(cx, ey, width, height, color, offset = 0.0015, almond = false) {
  const p = [], ix = [], rings = 3, segments = 32;
  for (let r = 0; r <= rings; r++) {
    for (let s = 0; s <= segments; s++) {
      const t = 2 * Math.PI * s / segments;
      const x = cx + width * r / rings * Math.cos(t);
      const y = ey + height * r / rings * Math.sin(t) * (almond ? Math.abs(Math.sin(t)) ** 0.35 : 1);
      p.push(x, y, faceZ(x, y) + offset);
      if (r < rings && s < segments) { const a = r * (segments + 1) + s, b = a + segments + 1; ix.push(a, b, b + 1, a, b + 1, a + 1); }
    }
  }
  const g = new THREE.BufferGeometry();g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));g.setIndex(ix);g.computeVertexNormals();paint(g, color);
}
for (const side of [-1, 1]) {
  const x = centerX + side * 0.061;
  patch(x, 1.727, 0.032, 0.014, 'hair', 0.0015, true);
  patch(x, 1.726, 0.0295, 0.0115, 'white', 0.0022, true);
  patch(x - side * 0.0015, 1.726, 0.010, 0.011, 'iris', 0.0029);
  patch(x - side * 0.0015, 1.727, 0.0055, 0.0075, 'pupil', 0.0034);
  patch(x - 0.0035, 1.731, 0.0024, 0.0024, 'white', 0.004);
  patch(x, 1.752, 0.025, 0.003, 'hair', 0.0018, true);
}
patch(centerX, 1.655, 0.028, 0.0065, 'lip', 0.0017, true);
patch(centerX, 1.656, 0.025, 0.0013, 'mouth', 0.0024, true);

// Pack the colored geometry into one primitive/material and remove unused UVs.
const outP = [], outN = [], outC = [], outI = [];
for (const g of parts) {
  const base = outP.length / 3, p = g.getAttribute('position'), n = g.getAttribute('normal'), c = g.getAttribute('color');
  for (let i = 0; i < p.count; i++) {
    outP.push(p.getX(i), p.getY(i), p.getZ(i));
    const normal = new THREE.Vector3(n.getX(i), n.getY(i), n.getZ(i));
    if (normal.lengthSq() < 1e-10) normal.set(0, 0, 1);
    normal.normalize();outN.push(normal.x, normal.y, normal.z);
    outC.push(...[c.getX(i), c.getY(i), c.getZ(i)].map(v => Math.round(THREE.MathUtils.clamp(v, 0, 1) * 255)), 255);
  }
  for (let i = 0; i < g.index.count; i += 3) {
    const ids = [0,1,2].map(k => g.index.getX(i+k));
    const points = ids.map(id => new THREE.Vector3(p.getX(id),p.getY(id),p.getZ(id)));
    const area = points[1].sub(points[0]).cross(points[2].sub(points[0])).lengthSq();
    if (area > 1e-20) outI.push(...ids.map(id => id + base));
  }
}
const chunks = [], views = [], accessors = [];
let offset = 0;
function add(data, type, componentType, count, bounds) {
  const buffer = Buffer.from(data.buffer, data.byteOffset, data.byteLength);
  views.push({ buffer: 0, byteOffset: offset, byteLength: buffer.length });
  chunks.push(buffer);offset += buffer.length;
  const pad = (4 - offset % 4) % 4; if (pad) { chunks.push(Buffer.alloc(pad));offset += pad; }
  accessors.push({ bufferView: views.length - 1, componentType, count, type, ...bounds });
  return accessors.length - 1;
}
const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
outP.forEach((v, i) => { if (!Number.isFinite(v)) throw Error('Invalid vertex');min[i % 3] = Math.min(min[i % 3], v);max[i % 3] = Math.max(max[i % 3], v); });
const count = outP.length / 3;
const pos = add(new Float32Array(outP), 'VEC3', 5126, count, { min, max });
const normal = add(new Float32Array(outN), 'VEC3', 5126, count);
const color = add(new Uint8Array(outC), 'VEC4', 5121, count, { normalized: true });
const index = add(new Uint16Array(outI), 'SCALAR', 5123, outI.length);
if (count > 65535 || outI.some(v => v >= count)) throw Error('Invalid index range');
const document = {
  asset: { version: '2.0', generator: 'Wikalinggo student repair / Three.js', extras: { description: 'Single repaired face; dark hair, white blouse, navy uniform and black shoes.' } },
  scene: 0, scenes: [{ nodes: [0] }], nodes: [{ name: 'Filipina student', mesh: 0 }],
  meshes: [{ name: 'Repaired and colored student', primitives: [{ attributes: { POSITION: pos, NORMAL: normal, COLOR_0: color }, indices: index, material: 0 }] }],
  materials: [{ name: 'Student uniform colors', doubleSided: true, pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1], metallicFactor: 0, roughnessFactor: 0.82 } }],
  buffers: [{ byteLength: offset }], bufferViews: views, accessors,
};
let json = Buffer.from(JSON.stringify(document));json = Buffer.concat([json, Buffer.alloc((4 - json.length % 4) % 4, 32)]);
const bin = Buffer.concat(chunks), header = Buffer.alloc(20), binHeader = Buffer.alloc(8);
header.writeUInt32LE(0x46546c67, 0);header.writeUInt32LE(2, 4);header.writeUInt32LE(28 + json.length + bin.length, 8);header.writeUInt32LE(json.length, 12);header.writeUInt32LE(0x4e4f534a, 16);
binHeader.writeUInt32LE(bin.length, 0);binHeader.writeUInt32LE(0x004e4942, 4);
fs.writeFileSync(target, Buffer.concat([header, json, binHeader, bin]));
console.log(JSON.stringify({ target, originalBackup: source, removedTriangles: removed, vertices: count, triangles: outI.length / 3, bytes: fs.statSync(target).size }, null, 2));
