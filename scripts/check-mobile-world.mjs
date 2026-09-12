import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import fs from 'node:fs';
import ts from 'typescript';
import { AnimationMixer, BufferGeometry, Float32BufferAttribute, Group, Mesh, MeshLambertMaterial, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
const modules = new Map();
function compiledUrl(file) {
  if (modules.has(file)) return modules.get(file);
  const compiled = ts.transpileModule(fs.readFileSync(new URL(file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText.replace(/from ["']([^"']+)["']/g, (_, specifier) => {
    const url = specifier.startsWith('.') ? compiledUrl(new URL(`${specifier}.ts`, file).href)
      : new URL(`../node_modules/${specifier === 'three' ? 'three/build/three.module.js' : specifier}`, import.meta.url).href;
    return `from ${JSON.stringify(url)}`;
  });
  const url = `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`;
  modules.set(file, url);
  return url;
}
// fs accepts URL objects, not file:// strings.
function moduleUrl(name) { return compiledUrl(new URL(`../components/story-world/${name}.ts`, import.meta.url)); }
const { bakeExplorerWalk } = await import(moduleUrl('baked-explorer-walk'));
const { mergeColoredScenery } = await import(moduleUrl('merge-colored-scenery'));
const { createMeadowEnvironment } = await import(moduleUrl('story-world-environment'));
const { createStoryPortal } = await import(moduleUrl('story-portal-visual'));
const { disposeWorldObject } = await import(moduleUrl('dispose-world-object'));
async function load(name) {
  const bytes = fs.readFileSync(new URL(`../assets/models/wikalino-${name}-explorer.glb`, import.meta.url));
  return new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
}
for (const name of ['indigenous', 'muslim', 'batang-pinoy']) {
  const gltf = await load(name);
  const root = gltf.scene;
  root.scale.setScalar(1.37);
  root.position.set(-0.08, 0.015, 0.11);
  const clip = gltf.animations.find(clip => clip.name === 'Walk');
  let yields = 0;
  const baked = await bakeExplorerWalk(root, clip, () => false, async () => { yields++; });
  assert.equal(yields, 12);
  assert.equal(baked.mode, 'baked-poses');
  const pairs = [];
  root.traverse(mesh => {
    if (mesh.isSkinnedMesh) pairs.push([mesh, mesh.parent.children.find(child => child.name === `${mesh.name}-webgl1-display`)]);
  });
  assert(pairs.length);
  const idle = pairs.map(([, display]) => display.geometry);
  const snapshots = new Set(idle);
  const oracle = new AnimationMixer(root);
  oracle.clipAction(clip).play();
  const expected = new Vector3(), actual = new Vector3();
  for (let phase = 0; phase < 12; phase++) {
    baked.update(clip.duration / 12 * (phase === 0 ? 0.25 : 1), true);
    oracle.setTime(phase * clip.duration / 12);
    root.updateMatrixWorld(true);
    for (const [index, [mesh, display]] of pairs.entries()) {
      assert.equal(mesh.layers.mask, 0);
      assert(!display.isSkinnedMesh);
      assert.equal(display.material, mesh.material);
      assert.equal(display.geometry.index, idle[index].index, 'Pose indices share storage');
      assert.equal(display.geometry.attributes.color, idle[index].attributes.color, 'Attire colors share storage');
      snapshots.add(display.geometry);
      const position = display.geometry.attributes.position;
      for (let vertex = 0; vertex < position.count; vertex++) {
        mesh.getVertexPosition(vertex, expected);
        actual.fromBufferAttribute(position, vertex);
        assert(actual.distanceTo(expected) < 0.000002, `${name}: baked pose ${phase}, vertex ${vertex}`);
      }
    }
  }
  oracle.stopAllAction(); oracle.uncacheRoot(root);
  assert.equal(snapshots.size, 13 * pairs.length);
  const versions = [...snapshots].map(geometry => [geometry.attributes.position.version, geometry.attributes.normal.version]);
  const start = performance.now();
  for (let frame = 0; frame < 3000; frame++) baked.update(1 / 30, frame % 70 < 60);
  const time = performance.now() - start;
  assert.deepEqual([...snapshots].map(geometry => [geometry.attributes.position.version, geometry.attributes.normal.version]), versions,
    'Walking never rewrites or re-uploads vertex attributes');
  baked.update(1 / 30, false);
  pairs.forEach(([, display], index) => assert.equal(display.geometry, idle[index], 'Stopping restores original stance'));
  let disposed = 0;
  snapshots.forEach(geometry => geometry.addEventListener('dispose', () => disposed++));
  baked.dispose(); baked.dispose();
  assert.equal(disposed, snapshots.size, 'Dispose every cached pose exactly once');
  assert(pairs.every(([mesh, display]) => mesh.layers.mask === 1 && !display.parent));
  disposeWorldObject(root);
  console.log(`${name}: all 12 poses match skeletal animation; 3000 pose updates ${time.toFixed(2)} ms total; buffers unchanged`);
}
const cancelled = await load('indigenous');
let frames = 0;
const stopped = await bakeExplorerWalk(cancelled.scene, cancelled.animations[0], () => frames === 3, async () => { frames++; });
assert.equal(stopped, null);
cancelled.scene.traverse(object => { assert(!object.name.endsWith('-webgl1-display')); if (object.isSkinnedMesh) assert.equal(object.layers.mask, 1); });
disposeWorldObject(cancelled.scene);
// Prove batching preserves material × vertex colors and transformed positions.
const group = new Group();
for (let i = 0; i < 2; i++) {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute([0,0,0, 1,0,0, 0,1,0], 3));
  geometry.computeVertexNormals();
  geometry.setAttribute('color', new Float32BufferAttribute([.5,1,.25, .5,1,.25, .5,1,.25], 3));
  if (i) geometry.setIndex([0,1,2]);
  const material = new MeshLambertMaterial({ color: 0xff8040, vertexColors: true });
  const mesh = new Mesh(geometry, material); mesh.position.x = i * 2; group.add(mesh);
}
const color = group.children[0].material.color.clone();
mergeColoredScenery(group);
assert.equal(group.children.length, 1);
const attributes = group.children[0].geometry.attributes;
assert(Math.abs(attributes.color.getX(0) - color.r * .5) < 1e-6);
assert(Math.abs(attributes.color.getY(0) - color.g) < 1e-6);
assert(Math.abs(attributes.color.getZ(0) - color.b * .25) < 1e-6);
assert.equal(attributes.position.getX(3), 2);
assert.equal(group.children[0].geometry.index.count, 6);
disposeWorldObject(group);
function stats(root) {
  let meshes = 0, triangles = 0;
  root.traverse(object => { if (object.isMesh) { meshes++; triangles += (object.geometry.index?.count ?? object.geometry.attributes.position.count) / 3; } });
  return { meshes, triangles };
}
const meadow = createMeadowEnvironment(true), full = createMeadowEnvironment(false), portal = createStoryPortal('m1-story-1');
assert.equal(stats(meadow).meshes, 3);
assert.equal(stats(portal.group).meshes, 4);
assert(stats(meadow).triangles < stats(full).triangles * .5);
console.log('Native meadow:', stats(meadow), 'Full meadow:', stats(full), 'Portal:', stats(portal.group));
[meadow, full, portal.group].forEach(disposeWorldObject);
console.log('Mobile batching, pose fidelity, shared colors, idle, cancellation and disposal passed');
