/* global __dirname */
// Exercise the production startup sequence without opening an Expo GL context.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../components/story-world/StoryWorldEngine.native.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const moduleResult = { exports: {} };
vm.runInNewContext(code, {
  module: moduleResult, exports: moduleResult.exports, __DEV__: false,
  require: name => name === 'three' ? require('three') : name === 'react-native' ? { Platform: { OS: 'ios' } } : {},
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
  assert.deepEqual(await run(false), ['addExplorer', 'addStoryGates', 'addTropicalHut', 'addTreasureChest', 'ready']);
  assert.deepEqual(await run(true), ['addExplorer', 'addStoryScrolls', 'addTreasureChest', 'ready']);
  assert.deepEqual(await run(false, 'addExplorer'), ['addExplorer'], 'Leaving must prevent subsequent loads and ready callbacks');
  assert.deepEqual(await run(false, null, 'addExplorer'), ['addExplorer', 'error']);
  assert.deepEqual(await run(false, 'addExplorer', 'addExplorer'), ['addExplorer'], 'Disposed screens must not receive errors');
  console.log('World startup: sequential hub/quest loading, cancellation, and failure handling passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
