/* global __dirname */
// Run the real data/store in Node with in-memory storage; never touch a player's save.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
const modules = new Map();
function load(file) {
  if (modules.has(file)) return modules.get(file).exports;
  const mod = { exports: {} };
  modules.set(file, mod);
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  const localRequire = name => {
    if (name === "@react-native-async-storage/async-storage") return { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} };
    if (/\.(png|jpg|glb)$/.test(name)) return name;
    if (name.startsWith(".") || name.startsWith("@/")) {
      const base = name.startsWith("@/") ? path.join(root, name.slice(2)) : path.resolve(path.dirname(file), name);
      return load(`${base}.ts`);
    }
    return require(name);
  };
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename: file })(localRequire, mod, mod.exports);
  return mod.exports;
}

const { getAllStories } = load(path.join(root, "data/stories.ts"));
const { questionScrolls, questionGroup, canAnswerQuestion, isStoryAnswered } = load(path.join(root, "components/story-world/quest-progression.ts"));
const { useUserStore: store } = load(path.join(root, "store/useUserStore.ts"));

async function check() {
  await store.persist.rehydrate();
  const stories = getAllStories();
  assert.equal(stories.length, 3);
  for (const story of stories) {
    store.getState().clearGameProgress();
    const complete = index => store.getState().completeActivity({ storyId: story.id, activityId: story.activities[index].id, attempts: 1, firstTryCorrect: true, xpReward: story.activities[index].xp });
    assert.equal(story.activities.length, 15);
    complete(0);
    assert.equal(Object.keys(store.getState().activityResults).length, 0, "Questions require reading first");
    store.getState().completeStory(story.id);
    assert(!store.getState().completedStoryIds.includes(story.id), "Cannot finish an unanswered world");
    store.getState().completeStoryReading(story.id);
    const readingXp = store.getState().xp;
    store.getState().completeStoryReading(story.id);
    assert.equal(store.getState().xp, readingXp, "Reading cannot farm XP");
    complete(14);
    assert.equal(Object.keys(store.getState().activityResults).length, 0, "Cannot skip to last scroll");
    for (let i = 0; i < 15; i++) {
      const answers = store.getState().activityResults;
      const nodes = questionScrolls(story, answers);
      assert.equal(nodes.filter(node => node.state === "current").length, 1);
      assert.equal(nodes.length, 3, "Fifteen questions use only three scrolls");
      const groupIndex = Math.floor(i / 5);
      assert.equal(nodes[groupIndex].state, "current");
      assert.equal(nodes[groupIndex].activityIndex, i, "Resume first unanswered question");
      assert.equal(nodes[groupIndex].questionGroup.answeredCount, i % 5);
      assert.equal(questionGroup(story, i).id, story.activities[groupIndex * 5].id);
      assert(nodes.slice(groupIndex + 1).every(node => node.state === "locked"));
      assert(canAnswerQuestion(story, i, answers));
      assert(!canAnswerQuestion(story, 0.5, answers));
      assert(!canAnswerQuestion(story, 15, answers));
      assert(nodes.every(node => Math.abs(node.position.x) < 7.4 && node.position.z > -19.2 && node.position.z < 13.5));
      complete(i);
      assert.equal(questionScrolls(story, store.getState().activityResults)[groupIndex].state, i % 5 === 4 ? "completed" : "current", "Green only when all five answers are correct");
      const xp = store.getState().xp;
      complete(i);
      assert.equal(store.getState().xp, xp, "Replaying cannot farm XP");
    }
    assert(isStoryAnswered(story, store.getState().activityResults));
    assert(questionScrolls(story, store.getState().activityResults).every(node => node.state === "completed"));
    store.getState().completeStory(story.id);
    assert(store.getState().unlockedCollectibleIds.includes(story.collectible.id));
    const finalXp = store.getState().xp;
    store.getState().completeStory(story.id);
    assert.equal(store.getState().xp, finalXp);
    console.log(`${story.title}: reading gate, 3 grouped scrolls, 15 sequential questions, green completion, reward and replay checks passed`);
  }
}
check().catch(error => { console.error(error); process.exitCode = 1; });
