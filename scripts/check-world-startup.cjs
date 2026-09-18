/* global __dirname */
// Exercise the production startup sequence without opening an Expo GL context.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const three = require('three');
const layoutModule = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../components/story-world/hub-layout.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, { module: layoutModule, exports: layoutModule.exports });
const constantsModule = { exports: {} };
const constantsCode = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../components/story-world/story-world.constants.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
vm.runInNewContext(constantsCode, { module: constantsModule, exports: constantsModule.exports,
  require: name => { assert.equal(name, './hub-layout'); return layoutModule.exports; } });
const constants = constantsModule.exports;
const cameraModule = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../components/story-world/story-world-camera.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, { module: cameraModule, exports: cameraModule.exports,
  require: name => { assert.equal(name, 'three'); return three; } });
const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../components/story-world/StoryWorldEngine.native.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const moduleResult = { exports: {} };
vm.runInNewContext(code, {
  module: moduleResult, exports: moduleResult.exports, __DEV__: false,
  require: name => name === 'three' ? three : name === 'react-native' ? { Platform: { OS: 'ios' } }
    : name === './story-world.constants' ? constants
    : name === './hub-layout' ? layoutModule.exports
    : name === './story-world-camera' ? cameraModule.exports
    : name === './quest-progression' ? { worldNodeId: node => node.id ?? node.story.id }
    : name === './load-explorer.native' ? { loadStoryScrollModel: async () => new three.Group() }
    : name === './story-portal-visual' ? { createStoryPortal: id => { const group = new three.Group(); group.name = id; return { group }; } }
    : {},
  requestAnimationFrame: callback => queueMicrotask(() => callback(0)),
});
const { StoryWorldEngine } = moduleResult.exports;
async function run(quest, stopAt, failure) {
  const engine = Object.create(StoryWorldEngine.prototype);
  const calls = [];
  let active = 0;
  engine.options = { characterId: 'muslim', questStoryId: quest ? 'm1-story-1' : undefined,
    onReady: () => calls.push('ready'), onError: () => calls.push('error') };
  for (const method of ['addExplorer', 'addStoryGates', 'addStoryScrolls', 'addTropicalHut', 'addTreasureChest']) {
    engine[method] = async () => {
      assert.equal(active++, 0, 'Models must not decode concurrently');
      calls.push(method);
      await Promise.resolve();
      active--;
      if (method === stopAt) engine.disposed = true;
      if (method === failure) throw new Error('load failed');
    };
  }
  await engine.loadWorldModels();
  return calls;
}
(async () => {
  function spawn(options) {
    const engine=Object.create(StoryWorldEngine.prototype);
    engine.options=options;
    engine.character=new three.Group();
    engine.cameraAnchor=new three.Vector3(0,0,12.2);
    engine.camera=new three.PerspectiveCamera();
    engine.placeCharacterAtSpawn();
    engine.updateCamera(0);
    assert(engine.cameraAnchor.equals(engine.character.position),'Camera starts at the spawn without a cross-map sweep');
    assert.equal(engine.cameraHeading,engine.character.rotation.y);
    assert.equal(engine.movementHeading,engine.character.rotation.y,'Joystick starts aligned with the arrival camera');
    const forward=engine.camera.getWorldDirection(new three.Vector3());
    assert(Math.hypot(engine.camera.position.x-engine.character.position.x,engine.camera.position.z-engine.character.position.z)>7);
    assert(forward.x*Math.sin(engine.character.rotation.y)+forward.z*Math.cos(engine.character.rotation.y)>.9,
      'Initial camera looks in the character heading');
    return engine;
  }
  const firstArrival=spawn({});
  assert.equal(firstArrival.character.position.x,layoutModule.exports.HUB_START_POSITION.x);
  assert.equal(firstArrival.character.position.z,layoutModule.exports.HUB_START_POSITION.z);
  assert.equal(spawn({questStoryId:'m1-story-2'}).character.position.z,12.2,'Quest entry is not moved to hub coordinates');
  const returned=spawn({spawnPosition:{x:19.6,z:12.5},spawnHeading:Math.PI/2});
  assert.equal(returned.character.position.x,19.6);
  assert.equal(returned.character.position.z,12.5);
  const resumedQuest=spawn({questStoryId:'m1-story-1',spawnPosition:{x:1.6,z:4.7}});
  assert.equal(resumedQuest.character.position.z,4.7,'Question resume positions remain supported');
  console.log('Hub/quest spawn: correct entry, explicit return position, camera and joystick alignment passed');
  assert.deepEqual(await run(false), ['addExplorer', 'addStoryGates', 'addTropicalHut', 'addTreasureChest', 'ready']);
  assert.deepEqual(await run(true), ['addExplorer', 'addStoryScrolls', 'addTreasureChest', 'ready']);
  assert.deepEqual(await run(false, 'addExplorer'), ['addExplorer'], 'Leaving must prevent subsequent loads and ready callbacks');
  assert.deepEqual(await run(false, null, 'addExplorer'), ['addExplorer', 'error']);
  assert.deepEqual(await run(false, 'addExplorer', 'addExplorer'), ['addExplorer'], 'Disposed screens must not receive errors');
  const hub = Object.create(StoryWorldEngine.prototype);
  hub.scene = new three.Scene(); hub.storyGates = [];
  hub.options = { portals: constants.STORY_WORLD_POSITIONS.map((position,index)=>({ position, story:{id:`story-${index}`}, state:'current' })) };
  hub.addStoryGates();
  assert.equal(hub.storyGates.length,3);
  hub.storyGates.forEach((gate,index)=>{
    const placement=layoutModule.exports.HUB_PORTALS[index];
    assert.equal(gate.group.position.x,placement.x);
    assert.equal(gate.group.position.z,placement.z);
    assert.equal(gate.group.rotation.y,placement.heading,'Rendered gates use the shared approach-facing headings');
  });
  const engine = Object.create(StoryWorldEngine.prototype);
  engine.options = { questStoryId: 'm1-story-1', portals: [] };
  engine.scene = new three.Scene();
  await engine.addStoryScrolls();
  const gate = engine.scene.getObjectByName(constants.RETURN_PORTAL_ID);
  assert(gate, 'A quest world adds the return portal even before tasks are completed');
  assert.equal(gate.position.x, constants.RETURN_PORTAL_POSITION.x);
  assert.equal(gate.position.z, constants.RETURN_PORTAL_POSITION.z);
  assert.equal(engine.options.portals.length, 0, 'Return portal must not count toward chest requirements');
  assert(gate.position.z > constants.QUESTION_SCROLL_POSITIONS[0].z + 1.7, 'Return portal sits behind the entry spawn');
  assert(gate.position.z <= constants.STORY_WORLD_BOUNDS.maxZ && gate.position.x >= constants.STORY_WORLD_BOUNDS.minX, 'Return portal is reachable');
  engine.input = { x: 0, y: 0 };
  engine.character = new three.Group();
  engine.characterVisual = new three.Group();
  engine.setAnimation = () => {};
  engine.lastNearestStoryId = null;
  engine.nearChest = false;
  engine.nearReturnPortal = false;
  let statusChanges = 0;
  engine.emitStatus = () => statusChanges++;
  engine.character.position.copy(gate.position);
  engine.updateCharacter(0);
  assert(engine.nearReturnPortal, 'Approaching the return portal exposes its action');
  const changes = statusChanges;
  engine.updateCharacter(0);
  assert.equal(statusChanges, changes, 'Standing near a portal does not cause repeated UI updates');
  engine.character.position.z -= constants.STORY_INTERACTION_DISTANCE + 0.1;
  engine.updateCharacter(0);
  assert(!engine.nearReturnPortal, 'Leaving interaction distance hides the action');
  engine.returnGate = null;
  engine.character.position.copy(gate.position);
  engine.updateCharacter(0);
  assert(!engine.nearReturnPortal, 'No phantom return interaction in a world without the gate');
  console.log('Return portal: creation, reachable entry placement, proximity and stable status checks passed');
  console.log('World startup: sequential hub/quest loading, cancellation, and failure handling passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
