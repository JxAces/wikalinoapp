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
const { createWelcomeGuide, WELCOME_PAGES } = await import(moduleUrl('welcome-guide'));
const guide = createWelcomeGuide({x:-24,z:-16},Math.PI);
assert.equal(WELCOME_PAGES.length,5);
assert(WELCOME_PAGES.join(' ').includes('“Utos ng Hari.”'));
assert.equal(guide.update(0),false);
const origin = guide.group.position.clone();
for(let i=0;i<150;i++) guide.update(1/60);
assert.equal(guide.update(.01),true,'Guide finishes approaching before dialogue');
assert(Math.abs(guide.group.position.distanceTo(origin)-3)<.01);
const standing = guide.group.position.clone();guide.update(2);
assert(Math.hypot(guide.group.position.x-standing.x,guide.group.position.z-standing.z)<1e-8,'Guide stays put during reading');
let guideDraws=0;guide.group.traverse(o=>{if(o.isMesh){guideDraws++;assert(!o.isSkinnedMesh);}});
assert(guideDraws<=5,'Guide is lightweight and uses no skinning shaders');
disposeWorldObject(guide.group);
const { canStandInDressMaze, moveThroughDressMaze } = await import(moduleUrl('dress-maze'));
const { createDressMaze } = await import(moduleUrl('dress-maze-visual'));
const { QUESTION_SCROLL_POSITIONS, RETURN_PORTAL_POSITION, STORY_WORLD_BOUNDS, worldChestPosition } = await import(moduleUrl('story-world.constants'));
async function load(name) {
  const bytes = fs.readFileSync(new URL(name === 'student-girl' ? '../assets/models/girl2.glb' : `../assets/models/wikalino-${name}-explorer.glb`, import.meta.url));
  return new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
}
for (const name of ['indigenous', 'muslim', 'batang-pinoy', 'student-girl']) {
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
const step = 0.2, minX = STORY_WORLD_BOUNDS.minX, minZ = STORY_WORLD_BOUNDS.minZ;
const columns = Math.round((STORY_WORLD_BOUNDS.maxX-minX)/step)+1, rows = Math.round((STORY_WORLD_BOUNDS.maxZ-minZ)/step)+1;
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
const walker = { x: 0, z: 9 };
moveThroughDressMaze(walker, 8, 0);
assert(walker.x < 4 && canStandInDressMaze(walker.x,walker.z), 'Large steps cannot cross roadside clothing racks');
moveThroughDressMaze(walker, 1, -1);
assert(walker.z < 8.2 && canStandInDressMaze(walker.x,walker.z), 'Player can slide beside a rack');
const maze = createDressMaze();
assert.equal(stats(maze).meshes, 1, 'All dress colors and partitions share one draw call');
assert(maze.userData.garmentCount >= 80, 'Clothing racks contain a dense variety of garments');
assert(stats(maze).triangles < 20000, 'Maze geometry stays within a small phone budget');
console.log('Dress maze:', stats(maze), 'all destinations reachable; collision, sliding and batching passed');
disposeWorldObject(maze);
const { createUgatForest, canStandInUgat, moveThroughUgat, UGAT_ROOT_BEDS } = await import(moduleUrl('ugat-forest'));
const { UGAT_SCROLL_POSITIONS } = await import(moduleUrl('story-world.constants'));
const ugatWorld = createUgatForest();
const forest = ugatWorld.group;
const forestQueue = [cell({x:-3.8,z:9.2})], forestVisited = new Set([forestQueue[0].join(',')]);
for(let head=0;head<forestQueue.length;head++) {
  const [x,z]=forestQueue[head];
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]) {
    const nx=x+dx,nz=z+dz,key=`${nx},${nz}`;
    if(nx<0||nx>=columns||nz<0||nz>=rows||forestVisited.has(key)||!canStandInUgat(minX+nx*step,minZ+nz*step)) continue;
    forestVisited.add(key);forestQueue.push([nx,nz]);
  }
}
for(const point of [...UGAT_SCROLL_POSITIONS,...UGAT_SCROLL_POSITIONS.map(point=>({x:point.x,z:point.z+1.7})),RETURN_PORTAL_POSITION,worldChestPosition(true,"m1-story-2")]) {
  assert(canStandInUgat(point.x,point.z),'Forest destinations and resume positions must be dry and clear');
  assert(forestVisited.has(cell(point).join(',')),'All forest scrolls, chest and exit have a dry route');
}
for(const bed of UGAT_ROOT_BEDS) assert(!canStandInUgat(bed.x,bed.z),'Tangled root beds block walking');
const forestWalker={x:0,z:UGAT_ROOT_BEDS[0].z};moveThroughUgat(forestWalker,-7,0);
assert(forestWalker.x>UGAT_ROOT_BEDS[0].x+UGAT_ROOT_BEDS[0].rx,'Movement cannot tunnel through roadside root beds');
assert(stats(forest).meshes<=9 && stats(forest).triangles<26000,'Daylight forest stays within mobile scene budget');
const {UGAT_PATH,UGAT_MEMORIES,UGAT_DAYLIGHT,UGAT_FAMILY,ugatMemoryNear}=await import(moduleUrl('ugat-layout'));
assert(UGAT_DAYLIGHT.sky>0xaaaaaa && UGAT_DAYLIGHT.ambientIntensity>=.45,'Ugat uses readable daylight');
for(const point of UGAT_MEMORIES)assert(!canStandInUgat(point.x,point.z),'Memory furnishings block walking');
assert(canStandInUgat(0,12.2)&&forestVisited.has(cell({x:0,z:12.2}).join(',')),'Default quest entry connects to the forest route');
for(let i=1;i<UGAT_PATH.length;i++) {
  const [ax,az]=UGAT_PATH[i-1],[bx,bz]=UGAT_PATH[i],steps=Math.ceil(Math.hypot(bx-ax,bz-az)/.1);
  for(let step=0;step<=steps;step++)assert(canStandInUgat(ax+(bx-ax)*step/steps,az+(bz-az)*step/steps),'Visible paths stay outside roots, trunks and furnishings');
}
for(const memory of UGAT_MEMORIES) {
  assert(canStandInUgat(memory.approach.x,memory.approach.z),'Memory inspection points remain walkable');
  assert(forestVisited.has(cell(memory.approach).join(',')),'All story memories can be inspected');
  assert.equal(ugatMemoryNear(memory.approach.x,memory.approach.z),memory.id);
}
assert.equal(ugatMemoryNear(0,12.2),undefined,'No memory popup at the entry');
for(const person of UGAT_FAMILY)assert(!canStandInUgat(person.x,person.z),'Memory actors cannot be walked through');
const memories=forest.getObjectByName('Four domestic memories from Ugat');
assert.equal(memories.material.map.image.data.byteLength,262144,'All furnishings share one small texture atlas');
const memoryShader={uniforms:{},vertexShader:'#include <begin_vertex>'};memories.material.onBeforeCompile(memoryShader);
const family=forest.getObjectByName('Lolo remembers Tasing and Ricky');
assert.equal(stats(family).meshes,3,'One ordinary mesh per memory character');
family.traverse(o=>assert(!o.isSkinnedMesh,'Memory characters require no bone textures'));
const elder=family.getObjectByName('Lolo').children[0];
const elderShader={uniforms:{},vertexShader:'#include <begin_vertex>\n#include <beginnormal_vertex>'};elder.material.onBeforeCompile(elderShader);
assert.equal(elderShader.uniforms.personSeated.value,1,'Lolo is seated on the sofa');
const renewal=forest.getObjectByName('Three shoots of renewal');
const renewalShader={uniforms:{},vertexShader:'#include <begin_vertex>'};renewal.material.onBeforeCompile(renewalShader);
const forestVersions=[];forest.traverse(o=>{if(o.isMesh)forestVersions.push([o.geometry,Object.values(o.geometry.attributes).map(a=>a.version)]);});
ugatWorld.setProgress(0);ugatWorld.update(0);ugatWorld.setProgress(1);
for(let frame=1;frame<=180;frame++)ugatWorld.update(frame/30);
assert(renewalShader.uniforms.renewalGrowth.value>.99,'Completed groups grow all three shoots');
assert.equal(memoryShader.uniforms.memoryTime.value,6,'Cloth and paper animate through the shared scene clock');
assert.equal(elderShader.uniforms.personTime.value,6,'The family uses the shared scene clock');
assert.equal(renewalShader.uniforms.renewalTime.value,6,'Seedlings share the scene clock');
for(const [geometry,versions] of forestVersions)assert.deepEqual(Object.values(geometry.attributes).map(a=>a.version),versions,'Forest animation never uploads new vertex buffers');
const forestResources=new Set();forest.traverse(o=>{if(!o.isMesh)return;forestResources.add(o.geometry);forestResources.add(o.material);for(const value of Object.values(o.material))if(value?.isTexture)forestResources.add(value);});
const forestDisposed=new Map([...forestResources].map(r=>[r,0]));forestResources.forEach(r=>r.addEventListener('dispose',()=>forestDisposed.set(r,forestDisposed.get(r)+1)));
console.log('Ugat forest:',stats(forest),'story memories, family, safe routes, root collision and static GPU buffers passed');
disposeWorldObject(forest);
assert([...forestDisposed.values()].every(n=>n===1),'All daylight world textures and geometry are released on exit');
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
assert(villager.x<4.1 && canStandInVillage(villager.x,villager.z),'Movement stops at house walls without tunneling');
assert(stats(village).meshes<=2&&stats(village).triangles<15000,'Village scenery stays inexpensive for phones');
console.log('Forgotten village:',stats(village),'all objectives reachable; buildings block movement');
disposeWorldObject(village);

const {createStoryPromenade,createStoryAvenue,createStoryRouteGround}=await import(moduleUrl('story-route-visual'));
const {STORY_ROUTE_SAMPLES,STORY_ROUTE_SCROLLS,storyRouteHalfWidth,storyRouteX}=await import(moduleUrl('story-route-layout'));
const {DRESS_MAZE_WALLS}=await import(moduleUrl('dress-maze'));
const {UGAT_FURNISHINGS,UGAT_TREES}=await import(moduleUrl('ugat-layout'));
for(const [id,canStand] of [['m1-story-1',canStandInDressMaze],['m1-story-2',canStandInUgat],['m1-story-3',canStandInVillage]]) {
  // Check the whole paved width, not merely a single connected center line.
  for(const [x,z] of STORY_ROUTE_SAMPLES) for(const offset of [-storyRouteHalfWidth(z),0,storyRouteHalfWidth(z)]) {
    assert(canStand(x+offset,z),`${id}: scenery must leave the entire pavement clear at ${x+offset},${z}`);
  }
  for(const p of STORY_ROUTE_SCROLLS) {
    assert(Math.abs(p.x-storyRouteX(p.z))<.001,'Every scroll is on the pavement center');
    assert(Math.abs(p.x-storyRouteX(p.z+1.7))<storyRouteHalfWidth(p.z+1.7)-.42,'Question resume stays on the pavement');
  }
  const promenade=createStoryPromenade(id),sizes=stats(promenade);
  assert.equal(sizes.meshes,2);assert(sizes.triangles<7000,'Road and hedges use a small shared budget');
  promenade.traverse(o=>{if(o.isMesh){assert(o.geometry.attributes.position.array.every(Number.isFinite));assert(!o.material.isShaderMaterial,'Pavement needs no advanced GPU features');}});
  disposeWorldObject(promenade);
}
assert(DRESS_MAZE_WALLS.every(p=>Math.abs(p.x)-p.w/2>3),'All garment racks stand off the road');
assert(VILLAGE_BUILDINGS.every(p=>Math.abs(p.x)-p.w/2>3),'All village buildings, including school, stand off the road');
for(const rect of [...UGAT_MEMORIES,...UGAT_FURNISHINGS]) assert(Math.abs(rect.x)-rect.w/2>2.5,'Ugat furnishings frame the route instead of crossing it');
assert(UGAT_TREES.every(([x,z])=>Math.abs(x-storyRouteX(z))>3.5),'Tree trunks frame rather than cross the road');
const avenue=createStoryAvenue({value:0}),routeGround=createStoryRouteGround('m1-story-1');
assert(stats(avenue).meshes===1 && stats(avenue).triangles<5000,'Framing trees share one lightweight draw');
console.log('All three story promenades: full-width clearance, central scrolls, side scenes and budget passed',stats(avenue));
disposeWorldObject(avenue);disposeWorldObject(routeGround);

const { createHubWorld, canStandInHub, moveThroughHub, hubWaypoint, HUB_BOUNDS, HUB_HOUSES } = await import(moduleUrl('hub-world'));
const { STORY_WORLD_POSITIONS } = await import(moduleUrl('story-world.constants'));
const { HUB_PORTALS, HUB_START_POSITION, HUB_TRAILS, distanceToHubTrail, portalApproachClear } = await import(moduleUrl('hub-layout'));
const { hubSpawn, hubStartRoute, hubReturnRoute } = await import(moduleUrl('hub-navigation'));
const { FOREST_WILDLIFE } = await import(moduleUrl('hub-wildlife'));
const hub = createHubWorld();
const hubStats = stats(hub.group);
const water=hub.group.getObjectByName('Flowing river and waterfall');
assert.equal(stats(water).meshes,2,'Water, spray and foam stay within two draw calls');
assert(stats(water).triangles<450,'Curved water meshes remain inexpensive');
const [riverWater,fallWater]=water.children;
assert.equal(riverWater.material.flowMap,fallWater.material.flowMap,'River and falls share their ripple texture');
assert(riverWater.material.flowMap.image.data.byteLength<=65536,'Flow texture stays within 64 KiB');
assert(!riverWater.material.transparent && fallWater.material.forceSinglePass,'Only the small falling sheet uses one transparency pass');
const waterBuffers=water.children.map(mesh=>Object.values(mesh.geometry.attributes).map(a=>a.version));
hub.update(4,{x:-24,z:-16});
assert.equal(fallWater.material.uniforms.time.value,4,'Water animates using the elapsed time');
for(const [index,mesh] of water.children.entries()) assert.deepEqual(Object.values(mesh.geometry.attributes).map(a=>a.version),waterBuffers[index],'Animating water never reuploads geometry');
assert(!canStandInHub(-17,-29),'The pool outlet cannot be walked through');
assert(canStandInHub(-13,-8)&&canStandInHub(-13,18),'Both bridge crossings stay open');
const hubGround = hub.group.getObjectByName('Painted leafy grass and rolling banks');
assert(hubGround?.material.map, 'Hub uses painted grass');
assert.equal(hubGround.material.map.image.width, 256, 'Grass texture stays small');
const groundMap=hubGround.material.terrainMap.image;
assert(groundMap.data.byteLength<=1024*1024,'Baked paths and shade use at most 1 MiB before mipmaps');
for(const trail of HUB_TRAILS) for(const [x,z] of trail) {
  const u=Math.round((x/110+.5)*(groundMap.width-1)),v=Math.round((.5-(z+4)/120)*(groundMap.height-1));
  assert(groundMap.data[(v*groundMap.width+u)*4+3]>200,'Visible dirt paths meet every navigation waypoint');
}
const { HUB_GROUND_STONES } = await import(moduleUrl('hub-ground'));
assert(HUB_GROUND_STONES.length>=24,'Scatter stones around the hub');
for(const stone of HUB_GROUND_STONES) {
  assert(canStandInHub(stone.x,stone.z),'Stones sit on dry land');
  assert(distanceToHubTrail(stone.x,stone.z)>stone.radius+1.5&&!portalApproachClear(stone.x,stone.z,stone.radius),'Stones leave trails and portal approaches clear');
}
assert(hub.group.getObjectByName('Storybook mushroom gardens'), 'Fantasy undergrowth is present');
const terrainPositions=hubGround.geometry.attributes.position;
for(let i=0;i<terrainPositions.count;i++){ const x=terrainPositions.getX(i),z=terrainPositions.getZ(i);if(x>=-36&&x<=38&&z>=-40&&z<=32)assert(Math.abs(terrainPositions.getY(i)+.07)<1e-6,'Playable ground stays level'); }
console.log('Textured hub geometry:',hubStats);
assert(hubStats.meshes <= 24, 'Hub scenery and all 16 living actors stay batched');
const residents=hub.group.getObjectByName('Village residents');
const residentStats=stats(residents);
assert.equal(residentStats.meshes,3,'Each articulated human needs just one draw call');
assert(residentStats.triangles<4500,'All three detailed residents stay under 4.5k triangles');
assert(hubStats.triangles-residentStats.triangles<36000,'Static scenery and wildlife keep their existing budget');
assert(hubStats.triangles<40000,'Hub plus more detailed human residents stays under 40k triangles');
const people=residents.children.map(group=>{
  const mesh=group.children[0];assert(mesh.isMesh&&!mesh.isSkinnedMesh,'Human animation works without skinning or float textures');
  assert.equal(mesh.geometry.attributes.personPart.count,mesh.geometry.attributes.position.count);
  assert.equal(mesh.geometry.attributes.personFlex.count,mesh.geometry.attributes.position.count);
  const shader={uniforms:{},vertexShader:'#include <beginnormal_vertex>\n#include <begin_vertex>'};
  mesh.material.onBeforeCompile(shader);
  return {group,mesh,uniforms:shader.uniforms,versions:Object.values(mesh.geometry.attributes).map(a=>a.version)};
});
let personWalked=false,personPaused=false;
for(let frame=0;frame<900;frame++) {
  hub.update(frame/30,{x:23,z:20});
  for(const person of people) {
    const p=person.group.position;
    assert(canStandInHub(p.x,p.z)&&!portalApproachClear(p.x,p.z),'Residents remain on dry land and outside portal approaches');
    personWalked ||= person.uniforms.personStride.value>.9;
    personPaused ||= frame>200&&person.uniforms.personStride.value<.1;
  }
}
assert(personWalked&&personPaused,'People alternate walking and resting');
const nearby={x:people[0].group.position.x+.8,z:people[0].group.position.z};
const before=people[0].group.position.clone();
for(let frame=900;frame<990;frame++)hub.update(frame/30,nearby);
assert(people[0].group.position.distanceTo(before)<.001,'Residents stop walking near the player');
const facing=people[0].group.rotation.y;
assert(Math.sin(facing)>.9,'A paused nearby resident turns toward the player');
for(const person of people) assert.deepEqual(Object.values(person.mesh.geometry.attributes).map(a=>a.version),person.versions,'Human animation never reuploads geometry');
hub.update(34,{x:-24,z:-16});
assert(residents.children.every(group=>!group.visible),'Distant villagers stop rendering');
console.log('Human villagers:',residentStats,'walking, idle, facing player, safe paths and static GPU buffers passed');
const { HUB_VEGETATION, canPlantInHub } = await import(moduleUrl('hub-vegetation'));
const { minimapPoint, minimapHeading, minimapRoute } = await import(moduleUrl('hub-minimap'));
const trees=HUB_VEGETATION.filter(p=>!p.bush);
console.log('Hub planting:',hub.group.userData.vegetation);
assert(trees.length>=65,'Plant trees throughout the hub, not just the original few groves');
assert(HUB_VEGETATION.filter(p=>p.bush).length>=20,'Add scattered bushes');
for(const region of ['forest','meadow','village']) assert(trees.filter(p=>p.region===region).length>=5,`${region} has trees`);
const forestDensity=trees.filter(p=>p.region==='forest').length/(36*26);
const outsideDensity=trees.filter(p=>p.region!=='forest').length/(74*72-36*26);
assert(forestDensity>outsideDensity,'Forest remains the densest region');
for(const plant of HUB_VEGETATION) assert(canPlantInHub(plant.x,plant.z,plant.bush?1.9:2.7),'Planting protects paths, wildlife, water and entrances');
assert.equal(minimapHeading(Math.PI),0,'North-facing player points up');
assert.equal(minimapHeading(Math.PI/2),90,'East-facing player points right');
for(const p of [...HUB_PORTALS,HUB_START_POSITION,worldChestPosition(false)]) {
  const mapped=minimapPoint(p);assert(mapped.x>5&&mapped.x<95&&mapped.y>5&&mapped.y<95,'Map markers stay inside its frame');
}
for(const from of [HUB_START_POSITION,...HUB_PORTALS.map(p=>p.approach)]) for(const target of [...HUB_PORTALS,worldChestPosition(false)]) {
  const route=minimapRoute(from,target);assert.deepEqual(route[0],from);assert.deepEqual(route.at(-1),target);
  for(let i=1;i<route.length;i++) {
    const a=route[i-1],b=route[i],steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.2));
    for(let step=0;step<=steps;step++) assert(canStandInHub(a.x+(b.x-a.x)*step/steps,a.z+(b.z-a.z)*step/steps),'Minimap routes use bridges and avoid houses');
  }
}
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
for(const house of HUB_HOUSES) {
  assert(!canStandInHub(house.x,house.z),'Houses block movement');
  assert(!canStandInHub(house.x,house.z+2.8),'Front steps block movement');
}
assert(canStandInHub(33,7),'The former tropical hut site is walkable');
const houses=hub.group.getObjectByName('Raised village houses with woven walls and thatched roofs');
assert.equal(houses.userData.houseCount,3,'Keep three homes around the village square');
assert.equal(stats(houses).meshes,1,'All houses share one draw call');
assert(houses.material.map.image.data.byteLength<=256*1024,'House materials use a small mobile texture atlas');
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
    for(const value of Object.values(material))if(value?.isTexture)resources.add(value);
  }
});
const disposalCounts=new Map([...resources].map(resource=>[resource,0]));
resources.forEach(resource=>resource.addEventListener('dispose',()=>disposalCounts.set(resource,disposalCounts.get(resource)+1)));
disposeWorldObject(hub.group);
assert([...disposalCounts.values()].every(count=>count===1),'All hub geometry, textures and materials are disposed once on exit');
console.log('Expanded hub:',hubStats,'reachable/facing portals; wildlife habitats, walking/grazing, distance culling, unchanged buffers and disposal passed');
