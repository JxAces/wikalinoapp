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
const { canStandInDressMaze, moveThroughDressMaze } = await import(moduleUrl('dress-maze'));
const { createDressMaze } = await import(moduleUrl('dress-maze-visual'));
const { QUESTION_SCROLL_POSITIONS, RETURN_PORTAL_POSITION, worldChestPosition } = await import(moduleUrl('story-world.constants'));
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

// Flood the actual collision layout, proving progression and the exit are reachable.
const step = 0.2, minX = -7.4, minZ = -19.2, columns = 75, rows = 164;
const cell = point => [Math.round((point.x - minX) / step), Math.round((point.z - minZ) / step)];
const startCell = cell({ x: -1.6, z: 9.7 });
const queue = [startCell], visited = new Set([startCell.join(',')]);
for (let head = 0; head < queue.length; head++) {
  const [x, z] = queue[head];
  for (const [dx, dz] of [[1,0], [-1,0], [0,1], [0,-1]]) {
    const nx = x + dx, nz = z + dz, key = `${nx},${nz}`;
    if (nx < 0 || nx >= columns || nz < 0 || nz >= rows || visited.has(key)) continue;
    if (!canStandInDressMaze(minX + nx * step, minZ + nz * step)) continue;
    visited.add(key); queue.push([nx, nz]);
  }
}
for (const point of [...QUESTION_SCROLL_POSITIONS, ...QUESTION_SCROLL_POSITIONS.map(point => ({ x: point.x, z: point.z + 1.7 })), RETURN_PORTAL_POSITION, worldChestPosition(true)]) {
  assert(canStandInDressMaze(point.x, point.z), 'A destination or resume spawn must not intersect a partition');
  assert(visited.has(cell(point).join(',')), 'Every scroll, chest and return portal is reachable');
}
const walker = { x: -1.6, z: 8 };
moveThroughDressMaze(walker, 0, -4);
assert(walker.z > 6.7, 'A large movement step cannot pass through a thin maze partition');
moveThroughDressMaze(walker, 1, -1);
assert(walker.x > -1 && canStandInDressMaze(walker.x, walker.z), 'Player can slide along a wall');
const maze = createDressMaze();
assert.equal(stats(maze).meshes, 1, 'All dress colors and partitions share one draw call');
assert(maze.userData.garmentCount >= 90, 'Clothing racks contain a dense variety of garments');
assert(stats(maze).triangles < 20000, 'Maze geometry stays within a small phone budget');
console.log('Dress maze:', stats(maze), 'all destinations reachable; collision, sliding and batching passed');
disposeWorldObject(maze);
const { createUgatForest, canStandInUgat, moveThroughUgat, UGAT_SWAMPS } = await import(moduleUrl('ugat-forest'));
const { UGAT_SCROLL_POSITIONS } = await import(moduleUrl('story-world.constants'));
const forest = createUgatForest();
const forestQueue = [cell({x:-3.8,z:9.2})], forestVisited = new Set([forestQueue[0].join(',')]);
for(let head=0;head<forestQueue.length;head++) {
  const [x,z]=forestQueue[head];
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]) {
    const nx=x+dx,nz=z+dz,key=`${nx},${nz}`;
    if(nx<0||nx>=columns||nz<0||nz>=rows||forestVisited.has(key)||!canStandInUgat(minX+nx*step,minZ+nz*step)) continue;
    forestVisited.add(key);forestQueue.push([nx,nz]);
  }
}
for(const point of [...UGAT_SCROLL_POSITIONS,...UGAT_SCROLL_POSITIONS.map(point=>({x:point.x,z:point.z+1.7})),RETURN_PORTAL_POSITION,worldChestPosition(true)]) {
  assert(canStandInUgat(point.x,point.z),'Forest destinations and resume positions must be dry and clear');
  assert(forestVisited.has(cell(point).join(',')),'All forest scrolls, chest and exit have a dry route');
}
for(const pool of UGAT_SWAMPS) assert(!canStandInUgat(pool.x,pool.z),'Swamp interiors block walking');
const forestWalker={x:0,z:9};moveThroughUgat(forestWalker,0,-6);
assert(forestWalker.z>7.4,'Movement cannot tunnel through swamp water');
assert(stats(forest).meshes<=12 && stats(forest).triangles<20000,'Night forest stays within mobile scene budget');
console.log('Ugat forest:',stats(forest),'dry routes, safe spawns and swamp collision passed');
disposeWorldObject(forest);
const {createForgottenVillage,canStandInVillage,moveThroughVillage,VILLAGE_BUILDINGS}=await import(moduleUrl('forgotten-village'));
const village=createForgottenVillage();
const villageQueue=[cell({x:-1.6,z:9.7})],villageVisited=new Set([villageQueue[0].join(',')]);
for(let head=0;head<villageQueue.length;head++) {
  const [x,z]=villageQueue[head];
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]) {
    const nx=x+dx,nz=z+dz,key=`${nx},${nz}`;
    if(nx<0||nx>=columns||nz<0||nz>=rows||villageVisited.has(key)||!canStandInVillage(minX+nx*step,minZ+nz*step)) continue;
    villageVisited.add(key);villageQueue.push([nx,nz]);
  }
}
for(const point of [...QUESTION_SCROLL_POSITIONS,...QUESTION_SCROLL_POSITIONS.map(point=>({x:point.x,z:point.z+1.7})),RETURN_PORTAL_POSITION,worldChestPosition(true)]) {
  assert(canStandInVillage(point.x,point.z),'Village destinations and resume points must be outside buildings');
  assert(villageVisited.has(cell(point).join(',')),'Village lanes reach all scrolls, chest and exit');
}
for(const building of VILLAGE_BUILDINGS) assert(!canStandInVillage(building.x,building.z));
const villager={x:0,z:8};moveThroughVillage(villager,6,0);
assert(villager.x<3.8 && canStandInVillage(villager.x,villager.z),'Movement stops at house walls without tunneling');
assert(stats(village).meshes<=2&&stats(village).triangles<15000,'Village scenery stays inexpensive for phones');
console.log('Forgotten village:',stats(village),'all objectives reachable; buildings block movement');
disposeWorldObject(village);

const { createHubWorld, canStandInHub, moveThroughHub, hubWaypoint, HUB_BOUNDS, HUB_HOUSES } = await import(moduleUrl('hub-world'));
const { STORY_WORLD_POSITIONS } = await import(moduleUrl('story-world.constants'));
const { HUB_PORTALS, HUB_START_POSITION, portalApproachClear } = await import(moduleUrl('hub-layout'));
const { hubSpawn, hubStartRoute, hubReturnRoute } = await import(moduleUrl('hub-navigation'));
const { FOREST_WILDLIFE } = await import(moduleUrl('hub-wildlife'));
const hub = createHubWorld();
const hubStats = stats(hub.group);
const hubGround = hub.group.getObjectByName('Painted leafy grass and rolling banks');
assert(hubGround?.material.map, 'Hub uses painted grass');
assert.equal(hubGround.material.map.image.width, 256, 'Grass texture stays small');
assert(hub.group.getObjectByName('Storybook mushroom gardens'), 'Fantasy undergrowth is present');
const terrainPositions=hubGround.geometry.attributes.position;
for(let i=0;i<terrainPositions.count;i++){ const x=terrainPositions.getX(i),z=terrainPositions.getZ(i);if(x>=-36&&x<=38&&z>=-40&&z<=32)assert(Math.abs(terrainPositions.getY(i)+.07)<1e-6,'Playable ground stays level'); }
console.log('Textured hub geometry:',hubStats);
assert(hubStats.meshes <= 24, 'Hub scenery and all 16 living actors stay batched');
assert(hubStats.triangles < 32000, 'Textured hub stays below the previous native meadow triangle count');
for (const portal of HUB_PORTALS) {
  assert(canStandInHub(portal.approach.x,portal.approach.z), 'Portal approach must be dry and unobstructed');
  const dx=portal.approach.x-portal.x,dz=portal.approach.z-portal.z;
  assert((Math.sin(portal.heading)*dx+Math.cos(portal.heading)*dz)/Math.hypot(dx,dz)>.9,
    'Each portal faces its walking approach');
}
const hubQueue = [{...HUB_START_POSITION}], hubVisited = new Set([`${HUB_START_POSITION.x},${HUB_START_POSITION.z}`]);
for(let head=0;head<hubQueue.length;head++) {
  const at=hubQueue[head];
  for(const [dx,dz] of [[.5,0],[-.5,0],[0,.5],[0,-.5]]) {
    const p={x:at.x+dx,z:at.z+dz},key=`${p.x},${p.z}`;
    if(hubVisited.has(key)||!canStandInHub(p.x,p.z))continue;
    hubVisited.add(key);hubQueue.push(p);
  }
}
for(const p of [...STORY_WORLD_POSITIONS,worldChestPosition(false)]) assert(hubVisited.has(`${p.x},${p.z}`),'Every hub portal and chest is reachable over a bridge');
assert(!canStandInHub(-13,0),'River requires a bridge');
assert(canStandInHub(-13,-8)&&canStandInHub(-13,18),'Both bridges are walkable');
assert(!canStandInHub(HUB_HOUSES[0].x,HUB_HOUSES[0].z),'Houses block movement');
const hubWalker={...HUB_START_POSITION};
for(const target of [...STORY_WORLD_POSITIONS,worldChestPosition(false)]) {
  let steps=0;
  while(Math.hypot(hubWalker.x-target.x,hubWalker.z-target.z)>.7&&steps++<4000) {
    const waypoint=hubWaypoint(hubWalker,target),dx=waypoint.x-hubWalker.x,dz=waypoint.z-hubWalker.z,len=Math.hypot(dx,dz);
    moveThroughHub(hubWalker,dx/len*.12,dz/len*.12);
  }
  assert(steps<4000,`Following HUD arrow to ${JSON.stringify(target)} stuck at ${JSON.stringify(hubWalker)}`);
}
const hubDestinations=STORY_WORLD_POSITIONS.map((position,index)=>({position,story:{id:`m1-story-${index+1}`,markahan:1}}));
const beginning=hubSpawn(hubDestinations,hubStartRoute().params.returnPortal);
assert.deepEqual(beginning.position,HUB_START_POSITION);
assert(canStandInHub(beginning.position.x,beginning.position.z));
assert(Math.hypot(beginning.position.x-HUB_PORTALS[0].x,beginning.position.z-HUB_PORTALS[0].z)<9,'Fresh play begins near the waterfall');
for(const node of hubDestinations) {
  const route=hubReturnRoute(node.story), arrival=hubSpawn(hubDestinations,route.params.returnPortal);
  assert(canStandInHub(arrival.position.x,arrival.position.z),'Portal returns must be dry and clear of buildings');
  const dx=node.position.x-arrival.position.x,dz=node.position.z-arrival.position.z,distance=Math.hypot(dx,dz);
  assert(distance>2.55 && distance<4,'Return next to the correct entrance, outside its plinth/interaction zone');
  assert((Math.sin(arrival.heading)*dx+Math.cos(arrival.heading)*dz)/distance>.99,'Face the portal on return');
  const returning={...arrival.position};
  moveThroughHub(returning,dx/distance,dz/distance);
  assert(Math.hypot(returning.x-node.position.x,returning.z-node.position.z)<distance-.9,'The return spawn can walk back toward its portal');
  assert.deepEqual(hubSpawn(hubDestinations,[node.story.id]),arrival,'Array query parameters resolve the same portal');
}
assert.deepEqual(hubSpawn(hubDestinations,'missing-story'),beginning,'Invalid return IDs fall back safely to the waterfall');
assert.deepEqual(hubSpawn([], 'missing-story'),beginning,'Empty catalog keeps a safe startup location');
console.log('Hub arrivals: waterfall start, all three return routes, dry spawns and approach-facing headings passed');
const edge={x:HUB_BOUNDS.maxX,z:0};moveThroughHub(edge,4,0);assert.equal(edge.x,HUB_BOUNDS.maxX);
const wildlife=hub.group.getObjectByName('Forest wildlife');
assert.equal(wildlife.children.length,9);
for(const kind of ['butterfly','wolf','reindeer']) assert(wildlife.children.some(mesh=>mesh.userData.kind===kind));
const wildlifeGeometry=wildlife.children.map(mesh=>{
  assert(mesh.isMesh && !mesh.isSkinnedMesh, 'Wildlife must not need WebGL 2 skinning');
  assert.equal(mesh.geometry.attributes.animalPivot.count,mesh.geometry.attributes.position.count);
  assert.equal(mesh.geometry.attributes.animalMotion.count,mesh.geometry.attributes.position.count);
  return {geometry:mesh.geometry,versions:Object.values(mesh.geometry.attributes).map(a=>a.version)};
});
const shaderStates=wildlife.children.map(mesh=>{
  const shader={uniforms:{},vertexShader:'#include <beginnormal_vertex>\n#include <begin_vertex>'};
  mesh.material.onBeforeCompile(shader);
  return shader.uniforms;
});
let walked=false,grazed=false;
for(let i=0;i<1800;i++) {
  hub.update(i/30,{x:18,z:-25});
  for(const [index,mesh] of wildlife.children.entries()) {
    assert(canStandInHub(mesh.position.x,mesh.position.z),'Wildlife stays on dry, walkable ground');
    assert(!portalApproachClear(mesh.position.x,mesh.position.z,.6),'Wildlife keeps portal entrances clear');
    assert(mesh.position.distanceTo(new Vector3(FOREST_WILDLIFE[index].x,0,FOREST_WILDLIFE[index].z))<3,
      'Wildlife remains inside its forest habitat');
    walked ||= shaderStates[index].animalStride.value>.9;
    grazed ||= shaderStates[index].animalGraze.value>.9;
  }
}
assert(walked && grazed,'Wildlife alternates walking and grazing, with blended motion');
for(const [index,mesh] of wildlife.children.entries()) {
  assert.equal(mesh.geometry,wildlifeGeometry[index].geometry);
  assert.deepEqual(Object.values(mesh.geometry.attributes).map(a=>a.version),wildlifeGeometry[index].versions,
    'Wildlife never allocates/reuploads geometry during animation');
}
hub.update(60,{x:0,z:28});
assert(wildlife.children.every(mesh=>!mesh.visible),'Distant forest animals stop rendering');
assert.deepEqual(stats(hub.group),hubStats,'Roaming reuses geometry');
const resources=new Set();
hub.group.traverse(object=>{
  if(!object.isMesh)return;
  resources.add(object.geometry);
  for(const material of Array.isArray(object.material)?object.material:[object.material]) {
    resources.add(material);
    if(material.map)resources.add(material.map);
  }
});
const disposalCounts=new Map([...resources].map(resource=>[resource,0]));
resources.forEach(resource=>resource.addEventListener('dispose',()=>disposalCounts.set(resource,disposalCounts.get(resource)+1)));
disposeWorldObject(hub.group);
assert([...disposalCounts.values()].every(count=>count===1),'All hub geometry, textures and materials are disposed once on exit');
console.log('Expanded hub:',hubStats,'reachable/facing portals; wildlife habitats, walking/grazing, distance culling, unchanged buffers and disposal passed');
