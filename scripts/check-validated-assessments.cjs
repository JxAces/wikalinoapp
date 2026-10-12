/* global __dirname */
// The approved assessment's keys and quoted passages are independent checks on
// the app data, so editing wording or moving an item cannot silently alter scoring.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const modules = new Map();
function load(file) {
  if (modules.has(file)) return modules.get(file).exports;
  const mod = { exports: {} };
  modules.set(file, mod);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  const localRequire = name => {
    if (/\.(png|jpg|glb)$/.test(name)) return name;
    if (name.startsWith('.') || name.startsWith('@/')) {
      const base = name.startsWith('@/') ? path.join(root, name.slice(2)) : path.resolve(path.dirname(file), name);
      return load(`${base}.ts`);
    }
    return require(name);
  };
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename: file })(localRequire, mod, mod.exports);
  return mod.exports;
}
const { getAllStories } = load(path.join(root, 'data/stories.ts'));
const { questionGroup, questionScrolls } = load(path.join(root, 'components/story-world/quest-progression.ts'));
const { gradeAssessmentAnswer, getAssessmentSummary } = load(path.join(root, 'utils/assessment.ts'));
const keys = {
  'm1-story-1': 'ABADCDAABC',
  'm1-story-2': 'CBDABACDBA',
  // Q5 is B, explicitly confirmed by the user (the summary PDF key has '?').
  'm1-story-3': 'ABACBACBCB',
};
const normalize = value => value.normalize('NFC').replace(/\s+/g, ' ').trim();
const ugatPassages = [
  '“Malalalim na’t nagkabuhol-buhol na ugat.”',
  '“Gumapang na rin pala ang ugat sa akin—lahat na pala kami, pati ako!”',
  '“Buo na ang kaniyang pasiya: magpakalayo-layo ma’y hindi niya maaaring takasan ang sarili.”',
  '“Sapagkat ang kaniyang mga salita ay parang mga ugat na lalong tumitibay, lalong lumalalim...”',
  '“Bigyan mo ng gift certificate—halagang tatlong libong piso? Hindi, gawin mo nang limang libo—big shot na iyon ngayon e...”',
  '“Nagsalimbayan sa kaniyang utak: ang mga sagot ni Ricky sa kaniyang homework ni Tasing; ang handa na niyang sabihin kay Kardo tungkol kay De Castro...”',
  '“Himagsikan sa EDSA. Isa siya sa mga sumugod doon. Handa na siyang mamatay noon... maiwan lamang niya ang mga anak at inapo sa pagtanaw sa naiibang kinabukasan.”',
  '“Ako, ’Lo? Eto, o, Pilipino!” Samantala, sinabi ni Ricky na American citizen ang kaniyang pipiliin.',
  '“Diyos ko! Nasa dugo ko rin pala! Gumapang na rin pala ang ugat sa akin—lahat na pala kami, pati ako!”',
  '“Buo na ang kaniyang pasiya: magpakalayo-layo ma’y hindi niya maaaring takasan ang sarili.”',
];
const ids = new Set();
for (const story of getAllStories()) {
  if (!(story.id in keys)) continue;
  assert.equal(story.activities.length, 10, `${story.title}: ten approved items`);
  const scrolls = questionScrolls(story, {});
  assert.deepEqual(scrolls.map(node => node.questionGroup.end - node.questionGroup.start), [3, 3, 4], `${story.title}: approved level sizes`);
  const expectedLevels = ['Pamilyar', 'Suri', 'Dalubhasa'];
  const perLevelInstructions = new Map();
  const correct = {};
  for (const [index, item] of story.activities.entries()) {
    assert.match(item.id, /-validated-v1-q\d+$/, 'Changed questions cannot inherit old saved grades');
    assert(item.id.endsWith(`-q${index + 1}`), 'Question IDs preserve approved order');
    assert(!ids.has(item.id), 'Question IDs are unique across stories');
    ids.add(item.id);
    assert.equal(item.choices.length, 4);
    assert.equal(new Set(item.choices).size, 4, 'Each question has four distinct options');
    assert.equal(String.fromCharCode(65 + item.choices.indexOf(item.answer)), keys[story.id][index], `${story.title} Q${index + 1}: approved key`);
    const level = questionGroup(story, index).index;
    assert(item.title.startsWith(expectedLevels[level]), 'Item metadata matches its displayed assessment level');
    assert(item.instruction.startsWith('Panuto:'), 'Approved Panuto travels with the item');
    if (perLevelInstructions.has(level)) assert.equal(item.instruction, perLevelInstructions.get(level), 'Panuto is consistent within a level');
    perLevelInstructions.set(level, item.instruction);
    if (story.id === 'm1-story-2') {
      assert.equal(normalize(item.passage), normalize(ugatPassages[index]), `Ugat Q${index + 1}: complete boxed source passage`);
      assert(!item.question.includes(item.passage), 'Passage remains separate from the question');
    }
    assert.equal(gradeAssessmentAnswer(item, item.answer), true);
    assert.equal(gradeAssessmentAnswer(item, item.choices.find(choice => choice !== item.answer)), false);
    assert.equal(gradeAssessmentAnswer(item, 'Not an available answer'), null);
    correct[item.id] = { correct: true };
  }
  assert.equal(getAssessmentSummary(story, correct).correct, 10);
  assert.equal(getAssessmentSummary(story, { 'ugat-q1': { correct: true }, 'sandaang-damit-q1': { correct: true }, 'utos-ng-hari-q1': { correct: true } }).answered, 0, 'Legacy answers do not count toward the validated assessment');
}
assert.equal(ids.size, 30);
console.log('PASS: all 30 validated answer keys, question order, 3/3/4 levels, approved Panuto, ten complete Ugat passages, grading and legacy-answer isolation.');
