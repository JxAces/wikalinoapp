/* global __dirname */
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
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const localRequire = name => {
    if (/\.(png|jpg|glb)$/.test(name)) return name;
    assert(name.startsWith("."), "Record helpers must not initialize storage or platform modules");
    return load(path.resolve(path.dirname(file), name) + ".ts");
  };
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename: file })(localRequire, mod, mod.exports);
  return mod.exports;
}

const { getAllStories } = load(path.join(root, "data/stories.ts"));
const { getStudentStoryRecord } = load(path.join(root, "utils/student-records.ts"));
const stories = getAllStories();
const [damit, ugat, utos] = stories;
const timestamp = "2026-10-15T00:00:00.000Z";
const response = (story, activityId, responses, completedAt = null) => ({
  storyId: story.id, activityId, responses, completedAt, groupName: "Sampaguita",
});
const activityRecord = (story, activityId, saved) =>
  getStudentStoryRecord(story, {}, { [activityId]: saved }).activities.find(item => item.activity.id === activityId);
const result = (story, activity, correct) => ({
  storyId: story.id, activityId: activity.id, correct, firstTryCorrect: correct,
  attempts: 1, xpEarned: 0, completedAt: timestamp,
});

for (const [index, story] of stories.entries()) {
  const record = getStudentStoryRecord(story, {}, {});
  assert.equal(record.assessment.total, 10, "Use the current ten approved quiz items");
  assert.equal(record.assessment.answered, 0);
  assert.equal(record.assessment.complete, false, "Empty quizzes have no final grade");
  assert.equal(record.activities.length, [3, 3, 4][index]);
  assert(record.activities.every(item => !item.activity.archived && !item.completed && item.answered === 0));
  assert(record.activities.every(item => item.fields.every(field => field.answer === null)));
}

const paragraphs = "  Unang talata.\n\nIkalawang talata.  ";
const hinuha = response(damit, "damit-interpretation", { interpretation: "dreams", "evidence-1": paragraphs });
let record = activityRecord(damit, hinuha.activityId, hinuha);
assert.equal(record.fields[0].answer, "B. Imahinasyon at mga pangarap ng batang babae");
assert.equal(record.fields[1].answer, "Unang talata.\n\nIkalawang talata.", "Preserve written paragraphs");
assert.equal(record.answered, 2);
assert.equal(record.completed, false, "Filled drafts still need their saved completion marker");
record = activityRecord(damit, hinuha.activityId, { ...hinuha, completedAt: timestamp });
assert.equal(record.completed, true);
assert.equal(getStudentStoryRecord(damit, {}, { [hinuha.activityId]: { ...hinuha, completedAt: timestamp } }).completedActivities, 1);

record = activityRecord(damit, hinuha.activityId, { ...hinuha, responses: { interpretation: "Old interpretation", "evidence-1": " \n " }, completedAt: timestamp });
assert.equal(record.fields[0].answer, "Old interpretation", "Keep unknown legacy answers readable");
assert.equal(record.fields[1].answer, null);
assert.equal(record.answered, 1);
assert.equal(record.completed, false, "An outdated completion cannot hide missing or obsolete answers");
record = activityRecord(damit, hinuha.activityId, { ...hinuha, storyId: ugat.id });
assert.equal(record.response, undefined, "Ignore work attached to a different story");
assert.equal(record.answered, 0);
record = activityRecord(damit, hinuha.activityId, { ...hinuha, activityId: "wrong-activity" });
assert.equal(record.response, undefined, "Ignore mismatched activity records");

record = activityRecord(ugat, "ugat-tree-map", response(ugat, "ugat-tree-map", { "card-corruption": "root" }));
assert.equal(record.fields.find(field => field.id === "card-corruption").answer, "Suliranin", "Show category names instead of internal zone IDs");
record = activityRecord(ugat, "ugat-explore", response(ugat, "ugat-explore", { "viewed-events": "viewed" }));
assert.equal(record.fields[0].answer, "Natingnan");

const meanings = response(utos, "utos-meanings", { literal: "B", power: "A", interpretation: "A" }, timestamp);
record = activityRecord(utos, meanings.activityId, meanings);
assert.equal(record.completed, true);
assert.equal(record.fields[0].answer, "B. Dapat isagawa o sundin ng isang tao.");
record = activityRecord(utos, meanings.activityId, { ...meanings, responses: { ...meanings.responses, interpretation: "B" } });
assert.equal(record.answered, 3);
assert.equal(record.completed, false, "Filled fields cannot bypass activity-specific completion rules");

const face = Object.fromEntries(Array.from({ length: 6 }, (_, index) => [`minyong-face-${index}`, String(index)]));
const reflection = response(utos, "utos-stand-up", { ...face, meaning: "A", reflection: paragraphs }, timestamp);
record = activityRecord(utos, reflection.activityId, reflection);
assert.equal(record.completed, true);
assert.equal(record.fields.find(field => field.id === "minyong-face-0").answer, "Puwesto 1");
record = activityRecord(utos, reflection.activityId, { ...reflection, responses: { ...reflection.responses, "minyong-face-0": "" } });
assert.equal(record.completed, false, "Include custom puzzle fields in completion checks");

const first = damit.activities[0];
const partialResults = { [first.id]: result(damit, first, true), "legacy-q1": { correct: true } };
let storyRecord = getStudentStoryRecord(damit, partialResults, {});
assert.equal(storyRecord.assessment.answered, 1);
assert.equal(storyRecord.assessment.complete, false, "A partially answered quiz must remain in progress");
assert.equal(storyRecord.assessment.stars, 0);
storyRecord = getStudentStoryRecord(damit, { [first.id]: { ...partialResults[first.id], storyId: ugat.id } }, {});
assert.equal(storyRecord.assessment.answered, 0);
storyRecord = getStudentStoryRecord(damit, { [first.id]: { ...partialResults[first.id], activityId: "wrong-activity" } }, {});
assert.equal(storyRecord.assessment.answered, 0);
const completedResults = Object.fromEntries(damit.activities.map((activity, index) => [activity.id, result(damit, activity, index < 8)]));
storyRecord = getStudentStoryRecord(damit, completedResults, {});
assert.equal(storyRecord.assessment.complete, true);
assert.equal(storyRecord.assessment.correct, 8, "Legacy grades remain available without selectedAnswer");
assert.equal(storyRecord.assessment.percentage, 80);

const snapshot = JSON.stringify({ completedResults, hinuha });
getStudentStoryRecord(damit, completedResults, { [hinuha.activityId]: hinuha });
assert.equal(JSON.stringify({ completedResults, hinuha }), snapshot, "Reading records must not mutate saved data");
console.log("PASS: student records preserve drafts, paragraphs and legacy grades; resolve Gawain choices; validate custom completions; isolate stories; and use current quiz totals.");
