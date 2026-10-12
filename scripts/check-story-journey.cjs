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
const { ugatIdeaCards, ugatZones } = load(path.join(root, 'data/ugat-learning.ts'));
const { questionScrolls, questionGroup, canAnswerQuestion, canEnterStory, canOpenStoryActivities, canOpenStoryQuiz, isStoryAnswered, isWorldChestUnlocked } = load(path.join(root, "components/story-world/quest-progression.ts"));
const { worldChestPosition, STORY_INTERACTION_DISTANCE, STORY_WORLD_POSITIONS } = load(path.join(root, "components/story-world/story-world.constants.ts"));
const { useUserStore: store } = load(path.join(root, "store/useUserStore.ts"));
const { hubReturnRoute, hubSpawn } = load(path.join(root, "components/story-world/hub-navigation.ts"));
const { getAssessmentSummary, gradeAssessmentAnswer } = load(path.join(root, "utils/assessment.ts"));
const { isWardrobeDressed, needsWardrobeDressing } = load(path.join(root, "data/sandaang-wardrobe.ts"));
const { createUtosQuizGameState, findUtosMatchMove, swapUtosMatchTiles, UTOS_CHARACTERS, UTOS_RIDDLES, isUtosQuizGameComplete } = load(path.join(root, "data/utos-quiz-games.ts"));

function cabinetAnswers(activity) {
  return Object.fromEntries(activity.fields.map((field, index) => [field.id,
    field.id === 'jumble-jojo' ? 'JOJO'
      : field.id === 'jumble-minyong' ? 'MINYONG'
      : field.id.startsWith('minyong-face-') ? field.id.slice('minyong-face-'.length)
      : activity.id === 'utos-meanings' ? ({ literal: 'B', power: 'A', interpretation: 'A' })[field.id]
      : activity.id === 'utos-conflict' ? ({ 'round-1-character': 'A', 'round-1-reason': 'B', 'round-2': 'B', 'round-3': 'C' })[field.id]
      : activity.id === 'utos-sequence' ? String.fromCharCode(65 + index)
      : activity.id === 'ugat-tree-map' && field.id.startsWith('card-')
        ? ugatZones[ugatIdeaCards.findIndex(card => `card-${card.id}` === field.id) % ugatZones.length].id
        : field.options ? field.options[0].value : "Patunay mula sa kuwento."]));
}

function completeUtosPregame(story, questionIndex = 0) {
  if (story.id !== 'm1-story-3') return;
  const level = questionGroup(story, questionIndex).index;
  let game = store.getState().utosQuizGames[String(level)] ?? createUtosQuizGameState(level);
  if (level === 0) {
    while (game.matches < 5) {
      const move = findUtosMatchMove(game.board);
      assert(move, 'A matching board always has a playable move');
      game = swapUtosMatchTiles(game, ...move);
      assert(game, 'A legal match advances the game');
      store.getState().saveUtosQuizGame(level, game);
    }
  } else {
    game = level === 1 ? { kind: 'memory', matchedIds: UTOS_CHARACTERS.map(character => character.id) }
      : { kind: 'riddles', answers: UTOS_RIDDLES.map(riddle => riddle.answer) };
    store.getState().saveUtosQuizGame(level, game);
  }
}

function completeCabinet(story) {
  for (const activity of getCabinetActivities(story.id)) {
    store.getState().saveCabinetResponse({ storyId: story.id, activityId: activity.id,
      responses: cabinetAnswers(activity), groupName: "Test", complete: true });
  }
}

function quizOpen(storyId) {
  const state = store.getState();
  return canOpenStoryQuiz(storyId, state.readingCompletedStoryIds, state.activityResults, state.cabinetResponses);
}

async function checkQuizGates(stories) {
  for (const story of stories) {
    store.getState().clearGameProgress();
    assert(!quizOpen(story.id), "Quiz starts locked");
    const activities = getCabinetActivities(story.id);
    const completedResponses = Object.fromEntries(activities.map(activity => [activity.id,
      { storyId: story.id, completedAt: new Date().toISOString() }]));
    assert(!canOpenStoryQuiz(story.id, [], {}, completedResponses), "Completed Gawain cannot bypass reading");
    store.getState().completeStoryReading(story.id);
    assert(canOpenStoryActivities(story.id, store.getState().readingCompletedStoryIds, {}));
    assert(!quizOpen(story.id), "Reading unlocks Hasa-Wika but keeps Suri-Wika locked");
    const xp = store.getState().xp;
    for (const [index, activity] of activities.entries()) {
      const payload = { storyId: story.id, activityId: activity.id, responses: cabinetAnswers(activity), groupName: "Test" };
      store.getState().saveCabinetResponse(payload);
      assert(!quizOpen(story.id), "Drafts and partial Gawain completion do not unlock the quiz");
      store.getState().completeActivity({ storyId: story.id, activityId: story.activities[0].id, answer: story.activities[0].answer });
      assert.deepEqual(store.getState().activityResults, {}, "Direct answer writes cannot bypass Gawain");
      assert.equal(store.getState().xp, xp, "Locked quizzes cannot award XP");
      store.getState().saveCabinetResponse({ ...payload, complete: true });
      assert.equal(quizOpen(story.id), index === activities.length - 1, "Only the final completed Gawain unlocks the quiz");
    }
    assert(cabinetActivities.filter(activity => activity.storyId === story.id && activity.archived)
      .every(activity => !store.getState().cabinetResponses[activity.id]), "Archived Gawain are not required");
    assert(!canOpenStoryQuiz(story.id, [story.id], {}, {
      ...completedResponses, [activities[0].id]: { storyId: "another-story", completedAt: new Date().toISOString() },
    }), "Another story's completion cannot satisfy the quiz gate");
    await store.persist.rehydrate();
    assert(quizOpen(story.id), "Completed Gawain unlocks persist after reload");
    const first = story.activities[0];
    completeUtosPregame(story);
    store.getState().completeActivity({ storyId: story.id, activityId: first.id, answer: first.answer });
    assert(store.getState().activityResults[first.id], "An unlocked quiz accepts its first answer");
    const previous = JSON.stringify(store.getState().activityResults);
    const firstActivity = activities[0];
    store.getState().saveCabinetResponse({ storyId: story.id, activityId: firstActivity.id,
      responses: cabinetAnswers(firstActivity), groupName: "Test" });
    assert(!quizOpen(story.id), "Editing a completed Gawain to draft relocks the quiz");
    const second = story.activities[1];
    store.getState().completeActivity({ storyId: story.id, activityId: second.id, answer: second.answer });
    assert.equal(JSON.stringify(store.getState().activityResults), previous, "Relocking preserves answers and blocks new ones");
    completeCabinet(story);
    assert(quizOpen(story.id), "Completing the edited Gawain unlocks the quiz again");
    store.getState().clearGameProgress();
    assert(!quizOpen(story.id), "Clearing progress relocks Suri-Wika");
  }
  assert(!canOpenStoryQuiz("missing-story", ["missing-story"], {}, {}));
  console.log("All stories: reading → Gawain → quiz gates, partial work, drafts, archived activities, direct writes, reload and reset passed");
}

async function check() {
  await store.persist.rehydrate();
  const { PLAYER_CHARACTER_OPTIONS, isPlayerCharacterId } = load(path.join(root, "data/player-characters.ts"));
  assert.deepEqual(PLAYER_CHARACTER_OPTIONS.map(p=>p.title),["1","2","3","4","5"]);
  assert(!isPlayerCharacterId("kangaroo"));
  assert.equal(store.getState().welcomeCompleted,false);
  store.getState().setProfile({fullName:"New reader",pangkat:"Baitang 7",character:"student"});
  assert.equal(store.getState().welcomeCompleted,false,"New player gets the welcome scene");
  store.getState().completeWelcome();
  await store.persist.rehydrate();
  assert.equal(store.getState().welcomeCompleted,true,"Welcome stays completed after reload");
  store.getState().updateProfile({character:"student-girl"});
  assert.equal(store.getState().welcomeCompleted,true,"Changing character does not repeat welcome");
  const migrated = await store.persist.getOptions().migrate({profile:{fullName:"Returning",pangkat:"7",character:"kangaroo"},xp:123,activityResults:{sample:{attempts:2}}},4);
  assert.equal(migrated.profile.character,"student","Retired kangaroo switches to character 1");
  assert.equal(migrated.welcomeCompleted,true,"Existing players skip the new-player scene");
  assert.equal(migrated.xp,123);assert.equal(migrated.activityResults.sample.attempts,2);
  store.getState().clearProfile();
  store.getState().setProfile({fullName:"Another reader",pangkat:"Baitang 7",character:"student"});
  assert.equal(store.getState().welcomeCompleted,false,"New profile can see welcome again");
  console.log("Numbered lineup, kangaroo migration, first-time welcome and persistence passed");
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
  assert.equal(stories[2].title, 'Utos ng Hari');
  assert.equal(stories[2].author, 'Jun Cruz Reyes');
  assert.equal(stories[2].order, 3);
  assert(stories[2].scenes.flatMap(scene => scene.paragraphs).join(' ').includes('Hindi baleng dropout, basta tao lang ako.'));
  assert(stories[2].activities.every(activity => activity.id.startsWith('utos-ng-hari-')));
  const ugatStory = stories.find(story => story.id === 'm1-story-2');
  assert.deepEqual(questionScrolls(ugatStory, {}).map(node => node.questionGroup.end - node.questionGroup.start), [3, 3, 4], 'Validated Ugat uses the shared 3-3-4 question split');
  assert(ugatStory.activities.every(activity => activity.type === 'multiple_choice'), 'All three themed Ugat scrolls remain multiple-choice games');
  const hubNodes = () => stories.map(story => ({ story, state: !canEnterStory(story.id, store.getState().activityResults) ? "locked" : isStoryAnswered(story, store.getState().activityResults) ? "completed" : "current" }));
  assert(!isWorldChestUnlocked([]), "An empty world must not unlock a chest");
  const compact = questionScrolls(stories[0], {});
  for (let i = 1; i < compact.length; i++) {
    const gap = Math.hypot(compact[i].position.x - compact[i - 1].position.x, compact[i].position.z - compact[i - 1].position.z);
    assert(gap < 8.2 && gap > 2 * STORY_INTERACTION_DISTANCE, "Scrolls should be close without overlapping interaction zones");
  }
  assert(Math.abs(compact[2].position.z - worldChestPosition(true).z) <= 6, "Quest chest is just beyond the last scroll");
  assert.equal(STORY_WORLD_POSITIONS[2].x, 23, "Third hub portal is in the village");
  assert.equal(worldChestPosition(false).z, 23, "Hub reward is in the village square");
  await checkQuizGates(stories);
  store.getState().clearGameProgress();
  assert(canEnterStory(stories[0].id, {}));
  store.getState().saveCabinetResponse({ storyId: stories[0].id, activityId: "damit-detective", responses: {}, groupName: "Test" });
  assert.deepEqual(store.getState().cabinetResponses, {}, "Cabinet writes require reading first");
  assert(!canEnterStory("missing-story", {}));
  for (const open of stories.slice(1)) {
    assert(canEnterStory(open.id, store.getState().activityResults), "All story portals are temporarily accessible");
    store.getState().completeStoryReading(open.id);
    completeCabinet(open);
    completeUtosPregame(open);
    store.getState().completeActivity({ storyId: open.id, activityId: open.activities[0].id, answer: open.activities[0].answer });
    assert(store.getState().activityResults[open.activities[0].id], "Later worlds accept tasks without completing earlier stories");
  }
  const outOfOrder = Object.fromEntries(stories[1].activities.map(activity => [activity.id, {}]));
  assert(canEnterStory(stories[2].id, outOfOrder), "Portal access is independent of previous-story progress for now");
  store.getState().clearGameProgress();
  for (const story of stories) {
    const expectedGroupSizes = [3, 3, 4];
    const expectedQuestionCount = expectedGroupSizes.reduce((sum, size) => sum + size, 0);
    assert(canEnterStory(story.id, store.getState().activityResults));
    assert(!isWorldChestUnlocked(hubNodes()), "Hub chest requires every story, not merely accessible portals");
    const initialAnswerCount = Object.keys(store.getState().activityResults).length;
    assert(!canOpenStoryActivities(story.id, store.getState().readingCompletedStoryIds, store.getState().activityResults), "Cabinet is locked on first portal entry");
    store.getState().setStoryScene(story.id, 1);
    assert(!canOpenStoryActivities(story.id, store.getState().readingCompletedStoryIds, store.getState().activityResults), "Opening or partially reading the book does not unlock the cabinet");
    const complete = index => {
      completeUtosPregame(story, index);
      store.getState().completeActivity({ storyId: story.id, activityId: story.activities[index].id, answer: story.activities[index].answer });
    };
    assert.equal(story.activities.length, expectedQuestionCount);
    complete(0);
    assert.equal(Object.keys(store.getState().activityResults).length, initialAnswerCount, "Questions require reading first");
    store.getState().completeStory(story.id);
    assert(!store.getState().completedStoryIds.includes(story.id), "Cannot finish an unanswered world");
    store.getState().completeStoryReading(story.id);
    assert(canOpenStoryActivities(story.id, store.getState().readingCompletedStoryIds, store.getState().activityResults), "Finishing the book unlocks its cabinet");
    assert(!quizOpen(story.id), "Finishing the book alone does not unlock the quiz");
    complete(0);
    assert.equal(Object.keys(store.getState().activityResults).length, initialAnswerCount, "Questions require all Gawain first");
    completeCabinet(story);
    assert(quizOpen(story.id));
    const readingXp = store.getState().xp;
    store.getState().completeStoryReading(story.id);
    assert.equal(store.getState().xp, readingXp, "Reading cannot farm XP");
    complete(expectedQuestionCount - 1);
    assert.equal(Object.keys(store.getState().activityResults).length, initialAnswerCount, "Cannot skip to last scroll");
    for (let i = 0; i < expectedQuestionCount; i++) {
      const answers = store.getState().activityResults;
      const nextStory = stories[stories.indexOf(story) + 1];
      if (nextStory) assert(canEnterStory(nextStory.id, answers), "Next portal remains accessible with unfinished tasks");
      const nodes = questionScrolls(story, answers);
      assert(!isWorldChestUnlocked(nodes), "Any unfinished question keeps the story chest locked");
      assert.equal(nodes.filter(node => node.state === "current").length, 1);
      assert.equal(nodes.length, 3, "The assessment uses three scrolls");
      let groupIndex = 0;
      let groupStart = 0;
      while (i >= groupStart + expectedGroupSizes[groupIndex]) {
        groupStart += expectedGroupSizes[groupIndex];
        groupIndex += 1;
      }
      const answeredInGroup = i - groupStart;
      assert.equal(nodes[groupIndex].state, "current");
      assert.equal(nodes[groupIndex].activityIndex, i, "Resume first unanswered question");
      assert.equal(nodes[groupIndex].questionGroup.answeredCount, answeredInGroup);
      assert.equal(questionGroup(story, i).id, story.activities[groupStart].id);
      assert(nodes.slice(groupIndex + 1).every(node => node.state === "locked"));
      assert(canAnswerQuestion(story, i, answers));
      assert(!canAnswerQuestion(story, 0.5, answers));
      assert(!canAnswerQuestion(story, expectedQuestionCount, answers));
      assert(nodes.every(node => Math.abs(node.position.x) < 7.4 && node.position.z > -19.2 && node.position.z < 13.5));
      complete(i);
      if (story.id === "m1-story-1" && groupIndex === 2) {
        store.getState().dressWardrobeOutfit(story.activities[i].id);
      }
      assert.equal(questionScrolls(story, store.getState().activityResults)[groupIndex].state, answeredInGroup === expectedGroupSizes[groupIndex] - 1 ? "completed" : "current", "Green only when every question on the scroll is answered");
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
    console.log(`${story.title}: reading gate, 3 grouped scrolls, ${expectedQuestionCount} sequential questions, green completion, reward and replay checks passed`);
  }
  assert(stories.every(story => canEnterStory(story.id, store.getState().activityResults)), "Finished stories remain available for replay");
  assert(isWorldChestUnlocked(hubNodes()), "Finishing all portals unlocks the hub chest");
  await checkCabinet(stories);
  await checkAssessments(stories);
  await checkValidatedAssessmentCompatibility(stories);
  await checkWardrobe(stories[0]);
  await checkUtosQuizGames(stories[2]);
  store.getState().clearGameProgress();
  assert(!canOpenStoryActivities(stories[0].id, store.getState().readingCompletedStoryIds, store.getState().activityResults), "Clearing progress relocks the activity cabinet");
  assert(!isWorldChestUnlocked(hubNodes()), "Reset relocks the main chest");
  assert(canEnterStory(stories[1].id, store.getState().activityResults), "All portals remain accessible after clearing progress");
  assert.deepEqual(store.getState().cabinetResponses, {}, "Clearing progress clears cabinet responses");
}
async function checkAssessments(stories) {
  for (const story of stories) {
    assert.equal(story.activities.length, 10, 'Every assessment has ten questions');
    assert.equal(story.activities.filter(activity => activity.isFinal).length, 1);
    assert(story.activities[9].isFinal);
    const prefix = ({ 'm1-story-1': 'sandaang-damit', 'm1-story-2': 'ugat', 'm1-story-3': 'utos-ng-hari' })[story.id];
    assert.deepEqual(story.activities.map(activity => activity.id),
      Array.from({ length: 10 }, (_, index) => `${prefix}-validated-v1-q${index + 1}`),
      'Validated questions use independent IDs so historical answers cannot be reused');
    assert.deepEqual(story.activities.map(activity => activity.title.split(' ').at(-1)),
      Array.from({ length: 10 }, (_, index) => String(index + 1)), 'Visible question numbers remain sequential');
    for (const correctCount of [0, 7, 8, 9, 10]) {
      store.getState().clearGameProgress();
      store.getState().completeStoryReading(story.id);
      completeCabinet(story);
      const first = story.activities[0];
      const beforeInvalid = JSON.stringify(store.getState().activityResults);
      store.getState().completeActivity({ storyId: story.id, activityId: first.id, answer: 'not a choice' });
      assert.equal(JSON.stringify(store.getState().activityResults), beforeInvalid, 'Invalid responses do not consume an attempt');
      let expectedXp = story.readingXp;
      for (const [index, activity] of story.activities.entries()) {
        completeUtosPregame(story, index);
        const correct = index < correctCount;
        const answer = correct ? activity.answer : activity.choices.find(choice => choice !== activity.answer);
        store.getState().completeActivity({ storyId: story.id, activityId: activity.id, answer });
        const saved = store.getState().activityResults[activity.id];
        assert.equal(saved.correct, correct);
        assert.equal(saved.selectedAnswer, answer);
        assert.equal(saved.attempts, 1);
        assert.equal(saved.firstTryCorrect, correct);
        assert.equal(saved.xpEarned, correct ? activity.xp + 5 : 0);
        expectedXp += saved.xpEarned;
        assert.equal(store.getState().xp, expectedXp);
        if (index < 9) assert(canAnswerQuestion(story, index + 1, store.getState().activityResults), 'Wrong answers also unlock the next question');
        const persisted = savedStorage.get('wikalino-user-store');
        store.setState({ activityResults: {}, xp: 0 });
        savedStorage.set('wikalino-user-store', persisted);
        await store.persist.rehydrate();
        store.getState().completeActivity({ storyId: story.id, activityId: activity.id, answer: activity.answer });
        assert.deepEqual(store.getState().activityResults[activity.id], saved, 'Reload and resubmission cannot change the first result');
        assert.equal(store.getState().xp, expectedXp, 'Reload and resubmission cannot earn XP twice');
      }
      const summary = getAssessmentSummary(story, store.getState().activityResults);
      assert.deepEqual([summary.correct, summary.incorrect, summary.answered, summary.total, summary.percentage, summary.complete],
        [correctCount, 10 - correctCount, 10, 10, correctCount * 10, true]);
      assert.equal(store.getState().getStoryStars(story.id), correctCount >= 9 ? 3 : correctCount >= 8 ? 2 : 1);
      assert(isWorldChestUnlocked(questionScrolls(story, store.getState().activityResults)), 'Even all-wrong assessments can finish');
      store.getState().completeStory(story.id);
      store.getState().completeStory(story.id);
      assert.equal(store.getState().xp, expectedXp + story.completionXp, 'Completion XP is awarded only once');
    }
  }

  const story = stories[2];
  const oldSave = JSON.parse(savedStorage.get('wikalino-user-store'));
  oldSave.version = 5;
  for (const [index, activity] of story.activities.entries()) {
    const saved = oldSave.state.activityResults[activity.id];
    delete saved.correct;
    delete saved.selectedAnswer;
    saved.firstTryCorrect = index < 7;
    saved.attempts = index < 7 ? 1 : 2;
  }
  oldSave.state.activityResults['utos-ng-hari-q15'] = { storyId: story.id, activityId: 'utos-ng-hari-q15', firstTryCorrect: true, xpEarned: 25, attempts: 1 };
  savedStorage.set('wikalino-user-store', JSON.stringify(oldSave));
  await store.persist.rehydrate();
  const summary = getAssessmentSummary(story, store.getState().activityResults);
  assert.equal(summary.correct, 7, 'Legacy results use first-try correctness, ignoring removed questions');
  assert.equal(summary.incorrect, 3);
  assert.equal(store.getState().xp, oldSave.state.xp, 'Migration preserves accumulated XP');
  assert(store.getState().activityResults['utos-ng-hari-q15'], 'Removed questions remain saved');
  assert.equal(store.getState().activityResults[story.activities[9].id].selectedAnswer, undefined, 'Migration never invents a historical answer');
  assert.equal(JSON.parse(savedStorage.get('wikalino-user-store')).version, 7);

  const sequence = { type: 'plot_sequence', items: ['a', 'b'], answer: ['a', 'b'] };
  assert.equal(gradeAssessmentAnswer(sequence, ['a', 'b']), true);
  assert.equal(gradeAssessmentAnswer(sequence, ['b', 'a']), false);
  assert.equal(gradeAssessmentAnswer(sequence, ['a', 'a']), null);
  assert.equal(gradeAssessmentAnswer(sequence, 'a'), null);
  console.log('Scoring: all three 10-item assessments, 0/7/8/9/10 scores, XP, stars, wrong-answer progression, immutable reloads, and legacy migration passed');
}

async function checkValidatedAssessmentCompatibility(stories) {
  store.getState().clearAllData();
  const profile = { fullName: 'Returning reader', pangkat: 'Baitang 8', character: 'student-girl' };
  store.getState().setProfile(profile);
  store.getState().completeWelcome();
  for (const story of stories) {
    store.getState().completeStoryReading(story.id);
    store.getState().setStoryScene(story.id, 2);
    completeCabinet(story);
  }
  const oldPrefixes = ['sandaang-damit', 'ugat', 'utos-ng-hari'];
  const historicalResults = Object.fromEntries(stories.flatMap((story, storyIndex) =>
    Array.from({ length: 15 }, (_, index) => {
      const activityId = `${oldPrefixes[storyIndex]}-q${index + 1}`;
      return [activityId, { storyId: story.id, activityId, correct: true, firstTryCorrect: true,
        selectedAnswer: `Historical answer ${index + 1}`, attempts: 1, xpEarned: 15, completedAt: '2026-10-01T00:00:00.000Z' }];
    })));
  const rewardLedger = stories.map(story => story.id);
  const collectibles = stories.map(story => story.collectible.id);
  const historicalXp = 893;
  store.setState({ activityResults: historicalResults, completedStoryIds: rewardLedger,
    unlockedCollectibleIds: collectibles, xp: historicalXp });
  const prior = JSON.parse(savedStorage.get('wikalino-user-store'));
  assert.equal(prior.version, 7, 'Validated question IDs do not need a save-version migration');
  store.getState().clearAllData();
  savedStorage.set('wikalino-user-store', JSON.stringify(prior));
  await store.persist.rehydrate();
  const resumed = store.getState();
  for (const field of ['profile', 'welcomeCompleted', 'readingCompletedStoryIds', 'storySceneIndexes',
    'cabinetResponses', 'xp', 'activityResults', 'completedStoryIds', 'unlockedCollectibleIds']) {
    assert.deepEqual(resumed[field], prior.state[field], `${field} is preserved when the question bank changes`);
  }
  assert.equal(resumed.getCompletedStoryCountByMarkahan(1), 0, 'Earlier completion rewards do not mark the new assessments complete');
  assert(!resumed.isStoryCompleted('missing-story'));
  let newQuestionXp = 0;
  for (const [storyIndex, story] of stories.entries()) {
    const summary = getAssessmentSummary(story, store.getState().activityResults);
    assert.deepEqual([summary.correct, summary.answered, summary.complete], [0, 0, false], 'Historical grades do not grade validated questions');
    assert.equal(store.getState().getStoryStars(story.id), 0);
    assert(!store.getState().isStoryCompleted(story.id));
    assert(!isStoryAnswered(story, store.getState().activityResults));
    assert.deepEqual(questionScrolls(story, store.getState().activityResults).map(node => node.state),
      ['current', 'locked', 'locked'], 'Historical answers cannot unlock later validated levels');
    assert(!isWorldChestUnlocked(questionScrolls(story, store.getState().activityResults)));
    assert(canAnswerQuestion(story, 0, store.getState().activityResults));
    for (const index of [1, 3, 6, 9]) assert(!canAnswerQuestion(story, index, store.getState().activityResults));
    const xpBefore = store.getState().xp;
    store.getState().completeStoryReading(story.id);
    store.getState().completeStory(story.id);
    store.getState().completeActivity({ storyId: story.id, activityId: `${oldPrefixes[storyIndex]}-q1`, answer: 'Historical answer 1' });
    store.getState().completeActivity({ storyId: story.id, activityId: story.activities[1].id, answer: story.activities[1].answer });
    assert.equal(store.getState().xp, xpBefore, 'Historical IDs, later questions and already-earned rewards cannot award XP');
    assert.equal(store.getState().activityResults[story.activities[1].id], undefined);

    for (const [index, activity] of story.activities.entries()) {
      completeUtosPregame(story, index);
      const answer = index === 0 ? activity.choices.find(choice => choice !== activity.answer) : activity.answer;
      store.getState().completeActivity({ storyId: story.id, activityId: activity.id, answer });
      const result = store.getState().activityResults[activity.id];
      assert(result, 'The new assessment can be completed independently of historical results');
      newQuestionXp += result.xpEarned;
      if (index === 0) {
        assert.equal(result.correct, false);
        const firstResult = JSON.stringify(result);
        await store.persist.rehydrate();
        store.getState().completeActivity({ storyId: story.id, activityId: activity.id, answer: activity.answer });
        assert.equal(JSON.stringify(store.getState().activityResults[activity.id]), firstResult,
          'A wrong validated answer stays immutable after reload alongside historical results');
      }
    }
    assert.equal(getAssessmentSummary(story, store.getState().activityResults).correct, 9);
    assert(store.getState().isStoryCompleted(story.id), 'Current results now satisfy completion without altering the reward ledger');
    const beforeReward = store.getState().xp;
    store.getState().completeStory(story.id);
    store.getState().completeStory(story.id);
    assert.equal(store.getState().xp, beforeReward, 'Completing the validated replacement never reawards historical completion XP');
    assert.equal(store.getState().getCompletedStoryCountByMarkahan(1), storyIndex + 1);
    assert.equal(store.getState().xp, historicalXp + newQuestionXp, 'Only newly answered questions can add XP');
  }
  await store.persist.rehydrate();
  for (const [id, result] of Object.entries(historicalResults)) assert.deepEqual(store.getState().activityResults[id], result, 'Historical answers remain intact');
  for (const field of ['profile', 'welcomeCompleted', 'readingCompletedStoryIds', 'storySceneIndexes',
    'cabinetResponses', 'completedStoryIds', 'unlockedCollectibleIds']) {
    assert.deepEqual(store.getState()[field], prior.state[field], `Completing the new assessments preserves ${field}`);
  }
  console.log('Validated replacement: unique IDs, preserved profile/reading/Gawain/XP/rewards/history, current-only gates and scores, immutable wrong answers and no repeated completion XP passed');
}

async function checkUtosQuizGames(story) {
  store.getState().clearGameProgress();
  const initial = createUtosQuizGameState(0);
  store.getState().saveUtosQuizGame(0, initial);
  assert.deepEqual(store.getState().utosQuizGames, {}, 'Reading and Gawain gate quiz game saves');
  store.getState().completeStoryReading(story.id);
  const tasks = getCabinetActivities(story.id);
  const lastTask = tasks.at(-1);
  store.getState().saveCabinetResponse({ storyId: story.id, activityId: lastTask.id, responses: cabinetAnswers(lastTask), groupName: 'Test', complete: true });
  assert.equal(store.getState().cabinetResponses[lastTask.id], undefined, 'Later crown sections cannot skip incomplete earlier activities');
  const legacyCompletions = Object.fromEntries(tasks.map(task => [task.id, { storyId: story.id, completedAt: 'previous-completion' }]));
  assert(!canOpenStoryQuiz(story.id, [story.id], {}, legacyCompletions), 'Outdated completion timestamps cannot bypass revised activity requirements');
  completeCabinet(story);
  const xp = store.getState().xp;
  const answer = index => store.getState().completeActivity({ storyId: story.id, activityId: story.activities[index].id, answer: story.activities[index].answer });
  answer(0);
  assert.deepEqual(store.getState().activityResults, {}, 'An unfinished pregame cannot submit assessment answers');
  store.getState().saveUtosQuizGame(1, createUtosQuizGameState(1));
  assert.equal(store.getState().utosQuizGames['1'], undefined, 'Later levels cannot save before preceding questions');
  store.getState().saveUtosQuizGame(0, { ...initial, matches: 6 });
  assert.deepEqual(store.getState().utosQuizGames, {}, 'Invalid game progress is rejected');
  let game = initial;
  const before = JSON.stringify(game);
  assert.equal(swapUtosMatchTiles(game, 0, 15), null, 'Nonadjacent swaps cannot count');
  assert.equal(JSON.stringify(game), before, 'An invalid move does not mutate the board');
  game = swapUtosMatchTiles(game, ...findUtosMatchMove(game.board));
  store.getState().saveUtosQuizGame(0, game);
  await store.persist.rehydrate();
  assert.equal(store.getState().utosQuizGames['0'].matches, 1, 'Partial matching survives reload');
  answer(0);
  assert.deepEqual(store.getState().activityResults, {}, 'One match does not meet the five-match target');
  completeUtosPregame(story, 0);
  assert(isUtosQuizGameComplete(0, store.getState().utosQuizGames['0']));
  assert.equal(store.getState().xp, xp, 'Game points never award assessment XP');
  assert.equal(getAssessmentSummary(story, store.getState().activityResults).answered, 0, 'Game points never count as quiz answers');
  for (const index of [0, 1, 2]) answer(index);
  const memory = { kind: 'memory', matchedIds: ['jojo', 'jojo'] };
  store.getState().saveUtosQuizGame(1, memory);
  assert.deepEqual(store.getState().utosQuizGames['1'].matchedIds, ['jojo'], 'Repeated pairs cannot inflate memory progress');
  answer(3);
  assert.equal(store.getState().activityResults[story.activities[3].id], undefined, 'Partial memory progress cannot submit questions');
  store.getState().saveUtosQuizGame(1, { kind: 'memory', matchedIds: ['unknown'] });
  assert.deepEqual(store.getState().utosQuizGames['1'].matchedIds, ['jojo'], 'Unknown characters cannot alter progress');
  completeUtosPregame(story, 3);
  for (const index of [3, 4, 5]) answer(index);
  store.getState().saveUtosQuizGame(2, { kind: 'riddles', answers: ['wrong', '', ''] });
  assert.equal(store.getState().utosQuizGames['2'], undefined, 'Wrong riddle answers cannot be saved as solved');
  store.getState().saveUtosQuizGame(2, { kind: 'riddles', answers: [' lapis ', '', ''] });
  assert.deepEqual(store.getState().utosQuizGames['2'].answers, ['Lapis', '', ''], 'Riddle answers ignore case and surrounding spaces');
  answer(6);
  assert.equal(store.getState().activityResults[story.activities[6].id], undefined, 'All three supplied riddles are required');
  completeUtosPregame(story, 6);
  await store.persist.rehydrate();
  assert(isUtosQuizGameComplete(2, store.getState().utosQuizGames['2']), 'Completed riddles survive reload');
  for (const index of [6, 7, 8, 9]) answer(index);
  const summary = getAssessmentSummary(story, store.getState().activityResults);
  assert.equal(summary.total, 10);
  assert.equal(summary.correct, 10, 'Pregames preserve the ten-question assessment score');
  const snapshot = JSON.stringify(store.getState().activityResults);
  const finalXp = store.getState().xp;
  completeUtosPregame(story, 6);
  answer(9);
  assert.equal(store.getState().xp, finalXp, 'Reopening games does not farm XP');
  assert.equal(JSON.stringify(store.getState().activityResults), snapshot, 'Reopening games preserves immutable quiz grades');
  store.getState().clearGameProgress();
  assert.deepEqual(store.getState().utosQuizGames, {}, 'Reset clears all Utos game progress');
  console.log('Utos games: five-match gate, memory pairs, typed riddles, invalid saves, reload, separate points, immutable grades and reset passed');
}
async function checkWardrobe(story) {
  store.getState().clearGameProgress();
  store.getState().completeStoryReading(story.id);
  completeCabinet(story);
  const answer = (index, correct = true) => {
    const activity = story.activities[index];
    store.getState().completeActivity({ storyId: story.id, activityId: activity.id, answer: correct ? activity.answer : activity.choices.find(choice => choice !== activity.answer) });
  };
  for (let index = 0; index < 6; index++) answer(index);
  const question = story.activities[6];
  store.getState().dressWardrobeOutfit(question.id);
  assert.equal(store.getState().activityResults[question.id], undefined, 'Dressing cannot answer a question');
  answer(6);
  const result = { ...store.getState().activityResults[question.id] };
  const xp = store.getState().xp;
  assert.equal(result.wardrobeDressed, false, 'New correct answers unlock one outfit without dressing the mannequin');
  assert.equal(result.wardrobePieces, undefined, 'New answers no longer save clothing parts');
  assert(!isWardrobeDressed(result));
  assert(needsWardrobeDressing(result));
  for (const invalid of ['', 'missing-question', `${question.id}-invalid`]) store.getState().dressWardrobeOutfit(invalid);
  assert.deepEqual(store.getState().activityResults[question.id], result, 'Invalid IDs cannot dress any mannequin');
  assert.equal(questionScrolls(story, store.getState().activityResults)[2].activityIndex, 6, 'World resumes an unlocked outfit that is not yet worn');
  await store.persist.rehydrate();
  assert(needsWardrobeDressing(store.getState().activityResults[question.id]), 'An unlocked outfit remains undressed after reload');
  store.getState().dressWardrobeOutfit(question.id);
  const dressed = store.getState().activityResults[question.id];
  assert(isWardrobeDressed(dressed), 'One action dresses the entire outfit');
  assert(!needsWardrobeDressing(dressed));
  store.getState().dressWardrobeOutfit(question.id);
  assert.deepEqual(store.getState().activityResults[question.id], dressed, 'Dressing the same mannequin twice is idempotent');
  assert.equal(store.getState().xp, xp, 'Dressing never awards more XP');
  assert.equal(questionScrolls(story, store.getState().activityResults)[2].activityIndex, 7, 'After dressing, resume the next question');
  const { wardrobeDressed: _dressed, ...savedAnswer } = dressed;
  const { wardrobeDressed: _undressed, ...originalAnswer } = result;
  assert.deepEqual(savedAnswer, originalAnswer, 'Dressing preserves the original grade, answer, attempts, XP and timestamp');
  await store.persist.rehydrate();
  assert(isWardrobeDressed(store.getState().activityResults[question.id]), 'The complete outfit survives reload');
  assert.equal(store.getState().xp, xp, 'Reload cannot award dressing XP');
  answer(7, false);
  const incorrect = { ...store.getState().activityResults[story.activities[7].id] };
  store.getState().dressWardrobeOutfit(story.activities[7].id);
  assert.deepEqual(store.getState().activityResults[story.activities[7].id], incorrect, 'Incorrect answers unlock no outfit');
  assert(!needsWardrobeDressing(incorrect), 'A wrong answer can continue without dressing');
  const firstLevel = store.getState().activityResults[story.activities[0].id];
  store.getState().dressWardrobeOutfit(story.activities[0].id);
  assert.deepEqual(store.getState().activityResults[story.activities[0].id], firstLevel, 'Only Level 3 accepts outfits');
  const otherStory = getAllStories().find(candidate => candidate.id !== story.id);
  const otherQuestion = otherStory.activities[6];
  const foreign = { ...result, storyId: otherStory.id, activityId: otherQuestion.id };
  store.setState({ activityResults: { ...store.getState().activityResults, [otherQuestion.id]: foreign } });
  store.getState().dressWardrobeOutfit(otherQuestion.id);
  assert.deepEqual(store.getState().activityResults[otherQuestion.id], foreign, 'Another story cannot receive a Sandaang Damit outfit');
  store.setState({ activityResults: { ...store.getState().activityResults, [question.id]: { ...result, storyId: otherStory.id } } });
  store.getState().dressWardrobeOutfit(question.id);
  assert.equal(store.getState().activityResults[question.id].wardrobeDressed, false, 'A mismatched saved story is rejected');

  assert(!isWardrobeDressed(undefined));
  assert(!needsWardrobeDressing(undefined));
  assert(!isWardrobeDressed({ wardrobeDressed: true }), 'An answer must be correct to dress a mannequin');
  assert(isWardrobeDressed({ correct: true }), 'Earlier compass answers retain completed outfits');
  assert(!isWardrobeDressed({ correct: false, wardrobeDressed: true }), 'An incorrect result never displays a dressed mannequin');
  assert(!isWardrobeDressed({ correct: true, wardrobePieces: [] }));
  assert(!isWardrobeDressed({ correct: true, wardrobePieces: [0, 1, 2, 4] }));
  assert(isWardrobeDressed({ correct: true, wardrobePieces: [0, 1, 2, 3] }), 'Earlier complete assemblies remain dressed');
  assert(!isWardrobeDressed({ correct: true, wardrobeDressed: false, wardrobePieces: [0, 1, 2, 3] }), 'An explicit undressed flag takes precedence over old pieces');
  assert(isWardrobeDressed({ correct: true, wardrobeDressed: true, wardrobePieces: [0] }), 'An explicit dressed flag takes precedence over old pieces');

  const save = JSON.parse(savedStorage.get('wikalino-user-store'));
  for (const [label, legacyProgress, expectedDressed] of [
    ['complete assembly', { wardrobePieces: [0, 1, 2, 3] }, true],
    ['partial assembly', { wardrobePieces: [0, 2] }, false],
    ['earlier compass', {}, true],
    ['wrong answer', { correct: false, wardrobePieces: [0, 1, 2, 3] }, false],
  ]) {
    const legacy = { ...originalAnswer, ...legacyProgress };
    const fixture = { ...save, state: { ...save.state, activityResults: { ...save.state.activityResults, [question.id]: legacy } } };
    store.setState({ activityResults: {}, xp: 0 });
    savedStorage.set('wikalino-user-store', JSON.stringify(fixture));
    await store.persist.rehydrate();
    assert.equal(isWardrobeDressed(store.getState().activityResults[question.id]), expectedDressed, `${label} compatibility survives persistence reload`);
    assert.equal(store.getState().xp, save.state.xp, `${label} keeps accumulated XP`);
    store.getState().dressWardrobeOutfit(question.id);
    assert.equal(isWardrobeDressed(store.getState().activityResults[question.id]), Boolean(legacy.correct), `${label} is preserved or completed by one outfit placement`);
    if (expectedDressed || !legacy.correct) assert.deepEqual(store.getState().activityResults[question.id], legacy, `${label} is not rewritten`);
    assert.equal(store.getState().xp, save.state.xp, 'Legacy dressing never adds XP');
  }
  store.getState().clearGameProgress();
  assert.deepEqual(store.getState().activityResults, {}, 'Clearing progress removes dressed and undressed outfit results');
  console.log('Wardrobe: whole-outfit dressing, invalid targets, no extra XP, immutable grades, reload/resume and earlier-save compatibility passed');
}
async function checkCabinet(stories) {
  store.setState({ cabinetResponses: {} });
  assert.equal(getCabinetActivities(stories[0].id).length, 3);
  const habi = getCabinetActivities(stories[0].id).find(activity => activity.id === 'damit-transformation');
  assert.deepEqual(habi.fields.map(field => field.id), ['before', 'problem', 'change', 'ending'], 'HABI requires only the four garment answers');
  const habiAnswers = cabinetAnswers(habi);
  assert(isCabinetResponseComplete(habi, habiAnswers), 'Four garment answers complete HABI without the removed reflection');
  for (const field of habi.fields) {
    assert(!isCabinetResponseComplete(habi, { ...habiAnswers, [field.id]: '  ' }), 'Every garment answer is still required');
  }
  assert(isCabinetResponseComplete(habi, { ...habiAnswers, 'round-character': 'Earlier saved reflection' }), 'Earlier five-field saves remain complete');
  const hinuha = getCabinetActivities(stories[0].id).find(activity => activity.id === 'damit-interpretation');
  const hinuhaAnswers = { interpretation: 'dreams', 'evidence-1': 'Patunay mula sa kuwento.' };
  assert(isCabinetResponseComplete(hinuha, hinuhaAnswers), 'HINUHA requires one interpretation and one proof');
  assert(!isCabinetResponseComplete(hinuha, { ...hinuhaAnswers, 'evidence-1': '  ' }), 'HINUHA still requires its remaining proof');
  assert(isCabinetResponseComplete(hinuha, { ...hinuhaAnswers, 'evidence-2': 'Earlier saved proof' }), 'Earlier HINUHA responses remain complete');
  const ugatCheck = getCabinetActivities(stories[1].id).find(activity => activity.id === 'ugat-check');
  assert(!isCabinetResponseComplete(ugatCheck, { ...cabinetAnswers(ugatCheck), 'evidence-2': '' }), 'Ugat Check still requires its two proofs');
  assert.equal(getCabinetActivities(stories[1].id).length, 3);
  assert.deepEqual(Array.from(getCabinetActivities(stories[1].id), activity => activity.id), ['ugat-explore', 'ugat-check', 'ugat-tree-map'], 'Ugat follows the updated PDF order');
  assert(cabinetActivities.find(activity => activity.id === 'ugat-board').archived, 'Previous activities remain defined for saved responses');
  assert(cabinetActivities.find(activity => activity.id === 'ugat-symbolism').archived);
  assert.deepEqual(getCabinetActivities(stories[2].id).map(activity => activity.id), ['utos-conflict', 'utos-meanings', 'utos-sequence', 'utos-stand-up'], 'Four Utos activities follow PDF order');
  const sequence = getCabinetActivities(stories[2].id)[2];
  assert(!isCabinetResponseComplete(sequence, Object.fromEntries(sequence.fields.map(field => [field.id, 'A']))), 'Sequence cannot repeat a card');
  const quizBefore = JSON.stringify(store.getState().activityResults);
  const xpBefore = store.getState().xp;
  for (const activity of cabinetActivities) {
    const payload = { storyId: activity.storyId, activityId: activity.id, groupName: "Pangkat A" };
    store.getState().saveCabinetResponse({ ...payload, responses: {}, complete: true });
    assert(!store.getState().cabinetResponses[activity.id], "Blank responses cannot be completed");
    const responses = cabinetAnswers(activity);
    assert(isCabinetResponseComplete(activity, responses));
    if (activity.id === 'ugat-explore') {
      assert(!isCabinetResponseComplete(activity, { ...responses, 'viewed-events': 'false' }), 'Only visited clues count');
      assert(!isCabinetResponseComplete(activity, { ...responses, 'viewed-decision': '' }), 'All four clues must be viewed');
    }
    if (activity.id === 'ugat-tree-map') {
      const oneZone = { ...responses, ...Object.fromEntries(ugatIdeaCards.map(card => [`card-${card.id}`, 'root'])) };
      assert(!isCabinetResponseComplete(activity, oneZone), 'Every zone needs at least one idea');
      assert(!isCabinetResponseComplete(activity, { ...responses, 'card-change': '' }), 'All cards must be placed');
      assert(!isCabinetResponseComplete(activity, { ...responses, 'note-leaf': '  ' }), 'Every zone needs an explanation');
      assert(!isCabinetResponseComplete(activity, { ...responses, 'synthesis-insight': '' }), 'Synthesis is required');
    }
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
  assert.equal(Object.keys(store.getState().cabinetResponses).length, cabinetActivities.length, 'Active and archived responses survive reload');
  assert(store.getState().cabinetResponses['ugat-board'].completedAt, 'Archived completion is preserved');
  assert(store.getState().cabinetResponses['ugat-check'].completedAt, 'Existing Ugat Check completion is preserved');
  const oldSave = JSON.parse(persisted);
  oldSave.version = 3;
  delete oldSave.state.cabinetResponses;
  store.setState({ cabinetResponses: {} });
  savedStorage.set("wikalino-user-store", JSON.stringify(oldSave));
  await store.persist.rehydrate();
  assert.equal(JSON.stringify(store.getState().activityResults), quizBefore, "Migration preserves existing quiz results");
  assert.deepEqual(store.getState().readingCompletedStoryIds, ['m1-story-1', 'm1-story-2'], "Migration preserves other books, resets replaced book");
  assert.deepEqual(store.getState().cabinetResponses, {}, "Older saves get an empty cabinet");
  const v4 = JSON.parse(persisted);
  v4.version = 4;
  v4.state.storySceneIndexes['m1-story-3'] = 7;
  v4.state.completedStoryIds = ['m1-story-1', 'm1-story-2', 'm1-story-3'];
  v4.state.activityResults['simula-kahulugan-q1'] = { storyId: 'm1-story-3', activityId: 'simula-kahulugan-q1', attempts: 1 };
  for (const activity of stories[2].activities) delete v4.state.activityResults[activity.id];
  savedStorage.set('wikalino-user-store', JSON.stringify(v4));
  await store.persist.rehydrate();
  assert.equal(store.getState().xp, v4.state.xp, 'Replacing a book preserves earned XP');
  assert.deepEqual(store.getState().completedStoryIds, ['m1-story-1', 'm1-story-2']);
  assert.equal(store.getState().storySceneIndexes['m1-story-3'], undefined);
  assert(store.getState().activityResults['simula-kahulugan-q1'], 'Legacy answers remain stored');
  assert(!canOpenStoryActivities(stories[2].id, store.getState().readingCompletedStoryIds, store.getState().activityResults));
  assert(!isStoryAnswered(stories[2], store.getState().activityResults));
  assert(store.getState().cabinetResponses['ugat-check'].completedAt, 'Book replacement preserves Ugat responses');
  store.getState().completeStoryReading(stories[2].id);
  await store.persist.rehydrate();
  assert(store.getState().readingCompletedStoryIds.includes(stories[2].id), 'New book progress survives version 5 reload');
  console.log('Aklat 3: correct story, independent questions, legacy progress migration, and new reading reload passed');
  console.log('Cabinet: ten active PDF activities, archived saves, sequence validation, exploration, tree-map validation, drafts, reload, migration, and independent quiz progress passed');
}
check().catch(error => { console.error(error); process.exitCode = 1; });
