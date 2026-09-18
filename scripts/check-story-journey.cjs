/* global __dirname */
// Run the real data/store in Node with in-memory storage; never touch a player's save.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
const modules = new Map();
const savedStorage = new Map();
function load(file) {
  if (modules.has(file)) return modules.get(file).exports;
  const mod = { exports: {} };
  modules.set(file, mod);
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  const localRequire = name => {
    if (name === "@react-native-async-storage/async-storage") return { getItem: async key => savedStorage.get(key) ?? null, setItem: async (key, value) => { savedStorage.set(key, value); }, removeItem: async key => { savedStorage.delete(key); } };
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
const { cabinetActivities, getCabinetActivities, isCabinetResponseComplete } = load(path.join(root, "data/cabinet-activities.ts"));
const { questionScrolls, questionGroup, canAnswerQuestion, canEnterStory, canOpenStoryActivities, isStoryAnswered, isWorldChestUnlocked } = load(path.join(root, "components/story-world/quest-progression.ts"));
const { worldChestPosition, STORY_INTERACTION_DISTANCE, STORY_WORLD_POSITIONS } = load(path.join(root, "components/story-world/story-world.constants.ts"));
const { useUserStore: store } = load(path.join(root, "store/useUserStore.ts"));
const { hubReturnRoute, hubSpawn } = load(path.join(root, "components/story-world/hub-navigation.ts"));

async function check() {
  await store.persist.rehydrate();
  const stories = getAllStories();
  assert.equal(stories.length, 3);
  const destinations=stories.map((story,index)=>({story,position:STORY_WORLD_POSITIONS[index]}));
  for (const story of stories) {
    const route=hubReturnRoute(story);
    assert.equal(route.params.returnPortal,story.id);
    assert.equal(route.params.markahan,String(story.markahan));
    const arrival=hubSpawn(destinations,route.params.returnPortal);
    const destination=destinations.find(node=>node.story.id===story.id).position;
    assert(Math.hypot(arrival.position.x-destination.x,arrival.position.z-destination.z)<4,'Each real story routes back to its own hub portal');
  }
  const hubNodes = () => stories.map(story => ({ story, state: !canEnterStory(story.id, store.getState().activityResults) ? "locked" : isStoryAnswered(story, store.getState().activityResults) ? "completed" : "current" }));
  assert(!isWorldChestUnlocked([]), "An empty world must not unlock a chest");
  const compact = questionScrolls(stories[0], {});
  for (let i = 1; i < compact.length; i++) {
    const gap = Math.hypot(compact[i].position.x - compact[i - 1].position.x, compact[i].position.z - compact[i - 1].position.z);
    assert(gap < 6.5 && gap > 2 * STORY_INTERACTION_DISTANCE, "Scrolls should be close without overlapping interaction zones");
  }
  assert(Math.abs(compact[2].position.z - worldChestPosition(true).z) <= 5, "Quest chest is just beyond the last scroll");
  assert.equal(STORY_WORLD_POSITIONS[2].x, 23, "Third hub portal is in the village");
  assert.equal(worldChestPosition(false).z, 23, "Hub reward is in the village square");
  store.getState().clearGameProgress();
  assert(canEnterStory(stories[0].id, {}));
  store.getState().saveCabinetResponse({ storyId: stories[0].id, activityId: "damit-detective", responses: {}, groupName: "Test" });
  assert.deepEqual(store.getState().cabinetResponses, {}, "Cabinet writes require reading first");
  assert(!canEnterStory("missing-story", {}));
  for (const open of stories.slice(1)) {
    assert(canEnterStory(open.id, store.getState().activityResults), "All story portals are temporarily accessible");
    store.getState().completeStoryReading(open.id);
    store.getState().completeActivity({ storyId: open.id, activityId: open.activities[0].id, attempts: 1, firstTryCorrect: true, xpReward: open.activities[0].xp });
    assert(store.getState().activityResults[open.activities[0].id], "Later worlds accept tasks without completing earlier stories");
  }
  const outOfOrder = Object.fromEntries(stories[1].activities.map(activity => [activity.id, {}]));
  assert(canEnterStory(stories[2].id, outOfOrder), "Portal access is independent of previous-story progress for now");
  store.getState().clearGameProgress();
  for (const story of stories) {
    assert(canEnterStory(story.id, store.getState().activityResults));
    assert(!isWorldChestUnlocked(hubNodes()), "Hub chest requires every story, not merely accessible portals");
    const initialAnswerCount = Object.keys(store.getState().activityResults).length;
    assert(!canOpenStoryActivities(story.id, store.getState().readingCompletedStoryIds, store.getState().activityResults), "Cabinet is locked on first portal entry");
    store.getState().setStoryScene(story.id, 1);
    assert(!canOpenStoryActivities(story.id, store.getState().readingCompletedStoryIds, store.getState().activityResults), "Opening or partially reading the book does not unlock the cabinet");
    const complete = index => store.getState().completeActivity({ storyId: story.id, activityId: story.activities[index].id, attempts: 1, firstTryCorrect: true, xpReward: story.activities[index].xp });
    assert.equal(story.activities.length, 15);
    complete(0);
    assert.equal(Object.keys(store.getState().activityResults).length, initialAnswerCount, "Questions require reading first");
    store.getState().completeStory(story.id);
    assert(!store.getState().completedStoryIds.includes(story.id), "Cannot finish an unanswered world");
    store.getState().completeStoryReading(story.id);
    assert(canOpenStoryActivities(story.id, store.getState().readingCompletedStoryIds, store.getState().activityResults), "Finishing the book unlocks its cabinet");
    const readingXp = store.getState().xp;
    store.getState().completeStoryReading(story.id);
    assert.equal(store.getState().xp, readingXp, "Reading cannot farm XP");
    complete(14);
    assert.equal(Object.keys(store.getState().activityResults).length, initialAnswerCount, "Cannot skip to last scroll");
    for (let i = 0; i < 15; i++) {
      const answers = store.getState().activityResults;
      const nextStory = stories[stories.indexOf(story) + 1];
      if (nextStory) assert(canEnterStory(nextStory.id, answers), "Next portal remains accessible with unfinished tasks");
      const nodes = questionScrolls(story, answers);
      assert(!isWorldChestUnlocked(nodes), "Any unfinished question keeps the story chest locked");
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
    assert(isWorldChestUnlocked(questionScrolls(story, store.getState().activityResults)), "All questions unlock the story chest");
    const nextStory = stories[stories.indexOf(story) + 1];
    if (nextStory) assert(canEnterStory(nextStory.id, store.getState().activityResults), "The next portal remains accessible after finishing this story");
    assert(questionScrolls(story, store.getState().activityResults).every(node => node.state === "completed"));
    store.getState().completeStory(story.id);
    assert(store.getState().unlockedCollectibleIds.includes(story.collectible.id));
    const finalXp = store.getState().xp;
    store.getState().completeStory(story.id);
    assert.equal(store.getState().xp, finalXp);
    console.log(`${story.title}: reading gate, 3 grouped scrolls, 15 sequential questions, green completion, reward and replay checks passed`);
  }
  assert(stories.every(story => canEnterStory(story.id, store.getState().activityResults)), "Finished stories remain available for replay");
  assert(isWorldChestUnlocked(hubNodes()), "Finishing all portals unlocks the hub chest");
  await checkCabinet(stories);
  store.getState().clearGameProgress();
  assert(!canOpenStoryActivities(stories[0].id, store.getState().readingCompletedStoryIds, store.getState().activityResults), "Clearing progress relocks the activity cabinet");
  assert(!isWorldChestUnlocked(hubNodes()), "Reset relocks the main chest");
  assert(canEnterStory(stories[1].id, store.getState().activityResults), "All portals remain accessible after clearing progress");
  assert.deepEqual(store.getState().cabinetResponses, {}, "Clearing progress clears cabinet responses");
}
async function checkCabinet(stories) {
  assert.equal(getCabinetActivities(stories[0].id).length, 3);
  assert.equal(getCabinetActivities(stories[1].id).length, 3);
  assert.equal(getCabinetActivities(stories[2].id).length, 0, "Do not invent activities absent from the PDF");
  const quizBefore = JSON.stringify(store.getState().activityResults);
  const xpBefore = store.getState().xp;
  for (const activity of cabinetActivities) {
    const payload = { storyId: activity.storyId, activityId: activity.id, groupName: "Pangkat A" };
    store.getState().saveCabinetResponse({ ...payload, responses: {}, complete: true });
    assert(!store.getState().cabinetResponses[activity.id], "Blank responses cannot be completed");
    const responses = Object.fromEntries(activity.fields.map(field => [field.id, field.options ? field.options[0].value : "Patunay mula sa kuwento."]));
    assert(isCabinetResponseComplete(activity, responses));
    const choice = activity.fields.find(field => field.options);
    if (choice) assert(!isCabinetResponseComplete(activity, { ...responses, [choice.id]: "invalid-choice" }), "Unknown choices are rejected");
    store.getState().saveCabinetResponse({ ...payload, responses, complete: true });
    assert(store.getState().cabinetResponses[activity.id].completedAt, "Complete responses are saved separately from quizzes");
    store.getState().saveCabinetResponse({ ...payload, responses: { ...responses, [activity.fields[0].id]: "" } });
    assert.equal(store.getState().cabinetResponses[activity.id].completedAt, null, "Editing returns a completed activity to draft");
    store.getState().saveCabinetResponse({ ...payload, responses, complete: true });
  }
  store.getState().saveCabinetResponse({ storyId: stories[0].id, activityId: "ugat-check", responses: {}, groupName: "Test" });
  assert.equal(store.getState().cabinetResponses["ugat-check"].storyId, stories[1].id, "A story cannot write another story's cabinet response");
  assert.equal(JSON.stringify(store.getState().activityResults), quizBefore, "Cabinet completion does not alter existing quiz results");
  assert.equal(store.getState().xp, xpBefore, "Written answers do not award correctness XP");
  const persisted = savedStorage.get("wikalino-user-store");
  store.setState({ cabinetResponses: {} });
  savedStorage.set("wikalino-user-store", persisted);
  await store.persist.rehydrate();
  assert.equal(Object.keys(store.getState().cabinetResponses).length, 6, "All six responses survive reload");
  const oldSave = JSON.parse(persisted);
  oldSave.version = 3;
  delete oldSave.state.cabinetResponses;
  store.setState({ cabinetResponses: {} });
  savedStorage.set("wikalino-user-store", JSON.stringify(oldSave));
  await store.persist.rehydrate();
  assert.equal(JSON.stringify(store.getState().activityResults), quizBefore, "Migration preserves existing quiz results");
  assert.equal(store.getState().readingCompletedStoryIds.length, 3, "Migration preserves reading completion");
  assert.deepEqual(store.getState().cabinetResponses, {}, "Older saves get an empty cabinet");
  console.log("Cabinet: six PDF activities, reading gate, required answers, drafts, reload, migration, and independent quiz progress passed");
}
check().catch(error => { console.error(error); process.exitCode = 1; });
