/* global __dirname */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const nativeWeb = require("react-native-web");
const root = path.resolve(__dirname, "..");
const originalLoad = Module._load;
const originalError = console.error;
const errors = [];

// Resolve the same web implementations Metro uses, without starting a browser
// or touching player storage. Keep React in development mode to catch warnings.
Module._load = function(request, parent, isMain) {
  if (request === "react-native") return {
    ...nativeWeb,
    // Web Modal uses a client portal, so expose its visibility contract to SSR.
    Modal: ({ visible, children }) => visible ? children : null,
  };
  if (request === "react-native-safe-area-context") return { SafeAreaView: nativeWeb.View };
  if (request === "react-native-svg") return originalLoad.call(this, "react-native-svg/lib/commonjs/elements.web.js", parent, isMain);
  if (request === "@expo/vector-icons") return { MaterialCommunityIcons: () => null };
  return originalLoad.call(this, request, parent, isMain);
};

function load(relative) {
  const exports = {};
  const source = fs.readFileSync(path.join(root, relative), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const localRequire = request => {
    if (request.startsWith('.') || request.startsWith('@/')) {
      const base = request.startsWith('@/') ? path.join(root, request.slice(2)) : path.resolve(root, path.dirname(relative), request);
      const file = fs.existsSync(`${base}.ts`) ? `${base}.ts` : `${base}.tsx`;
      return load(path.relative(root, file));
    }
    return require(request);
  };
  new Function("exports", "require", code)(exports, localRequire);
  return exports;
}

try {
  console.error = (...args) => errors.push(args.map(String).join(" "));
  const { cabinetActivities } = load("data/cabinet-activities.ts");
  for (const [file, name, id, count] of [
    ["CharacterTransformationMap", "CharacterTransformationMap", "damit-transformation", 4],
    ["UgatCheckActivity", "UgatCheckActivity", "ugat-check", 2],
  ]) {
    const Component = load(`components/story-cabinet/${file}.tsx`)[name];
    const activity = cabinetActivities.find(item => item.id === id);
    const html = renderToStaticMarkup(React.createElement(Component, { activity, fields: activity.fields, responses: {}, onChange() {}, onComplete() {}, showErrors: false, completed: false }));
    const svgTags = html.match(/<svg\b[^>]*>/g) ?? [];
    assert.equal(svgTags.length, count);
    assert(svgTags.every(tag => tag.includes('aria-hidden="true"') && !/\saccessible=/.test(tag)), `${name}: decorative SVGs must use valid web attributes`);
    if (id === 'ugat-check') {
      assert.equal((html.match(/role="radio"/g) ?? []).length, 6, 'Both the three roots and their labels are selectable');
      assert(/aria-disabled="true"[^>]*aria-label="Magbigay ng patunay"|aria-label="Magbigay ng patunay"[^>]*aria-disabled="true"/.test(html), 'Evidence is unavailable until a root is selected');
      const savedAnswers = { interpretation: 'personal', 'evidence-1': 'Unang patunay.', 'evidence-2': 'Ikalawang patunay.', reflection: 'Paliwanag ng pangkat.' };
      const review = renderToStaticMarkup(React.createElement(Component, { activity, responses: savedAnswers, onChange() {}, onComplete() {}, showErrors: false, completed: true }));
      for (const text of ['Mga sagot ng pangkat', 'Unang patunay.', 'Ikalawang patunay.', 'Paliwanag ng pangkat.', 'Kumpleto na']) assert(review.includes(text), 'Completed answers reopen in review');
      assert(/aria-disabled="true"[^>]*aria-label="Kumpleto na"|aria-label="Kumpleto na"[^>]*aria-disabled="true"/.test(review), 'Completed Ugat Check cannot be submitted again');
    }
  }
  const { UtosConflictActivity } = load('components/story-cabinet/UtosConflictActivity.tsx');
  const conflict = cabinetActivities.find(item => item.id === 'utos-conflict');
  const renderConflict = (responses = {}, completed = false) => renderToStaticMarkup(React.createElement(UtosConflictActivity, {
    activity: conflict, responses, completed, hasDraft: Object.keys(responses).length > 0, onChange() {}, onComplete() {}, onBack() {},
  }));
  const firstRound = renderConflict();
  assert.equal((firstRound.match(/role="radio"/g) ?? []).length, 4, 'Yugto 1 begins with character choices only');
  assert(firstRound.includes('aria-label="Susunod na yugto →"') && firstRound.includes('aria-disabled="true"'), 'An unanswered stage cannot advance');
  const scaleTags = firstRound.match(/<svg\b[^>]*>/g) ?? [];
  assert.equal(scaleTags.length, 0, 'The removed balance scale is not rendered');
  assert(!firstRound.includes('HAMON 01') && !firstRound.includes('Round'), 'Old Hamon and Round labels are removed');
  const reasonRound = renderConflict({ 'round-1-character': 'A', 'jumble-jojo': 'JOJO' });
  assert.equal((reasonRound.match(/role="radio"/g) ?? []).length, 8, 'Choosing a character reveals the four reasons');
  assert(reasonRound.includes('Piliin din ang dahilan bago magpatuloy.'));
  const secondRound = renderConflict({ 'round-1-character': 'A', 'round-1-reason': 'B', 'jumble-jojo': 'JOJO' });
  assert(secondRound.includes('Pag-unawa sa kalagayan'), 'Draft resumes at the first unfinished round');
  assert.equal((secondRound.match(/role="radio"/g) ?? []).length, 4);
  const completeResponses = { 'round-1-character': 'A', 'round-1-reason': 'B', 'round-2': 'B', 'round-3': 'C', 'jumble-jojo': 'JOJO', 'jumble-minyong': 'MINYONG' };
  const conflictReview = renderConflict(completeResponses, true);
  for (const value of ['Ang iyong mga sagot', 'Baguhin ang Yugto 1', 'Baguhin ang Yugto 2', 'Baguhin ang Yugto 3', 'Naka-save na ang iyong mga sagot']) assert(conflictReview.includes(value));
  for (const field of conflict.fields.filter(field => !field.id.startsWith('jumble-'))) assert(conflictReview.includes(field.options.find(option => option.value === completeResponses[field.id]).label), 'Review preserves every saved answer');
  assert(renderConflict(completeResponses).includes('Balikan bago tapusin'), 'A fully answered draft opens review without marking completion');

  const { ugatClues, ugatIdeaCards, ugatMapZones } = load('data/ugat-learning.ts');
  const { UgatExploreActivity, UgatTreeMapActivity } = load('components/story-cabinet/UgatLearningActivities.tsx');
  const renderUgat = (Component, responses = {}, completed = false) => renderToStaticMarkup(React.createElement(Component, {
    responses, completed, onChange() {}, onComplete() {},
  }));
  const choose = renderUgat(UgatTreeMapActivity);
  assert.equal((choose.match(/role="tab"/g) ?? []).length, 2, 'Banyuhay has only Pumili and Ipaliwanag');
  assert(choose.includes('Hakbang 1: Pumili') && choose.includes('Hakbang 2: Ipaliwanag'));
  assert(!choose.includes('Buuin ang sagot') && !choose.includes('3. Buuin'), 'The removed synthesis step is not rendered');
  assert.equal((choose.match(/role="radio"/g) ?? []).length, 3, 'Only Suliranin, Pangyayari, and Aral are categories');
  for (const zone of ugatMapZones) assert(choose.includes(`data-testid="ugat-map-category-${zone.id}"`));
  assert(!choose.includes('data-testid="ugat-map-category-leaf"'), 'Patunay is no longer a selectable category');
  assert(!choose.includes('<textarea'), 'Pumili does not require explanation or synthesis fields');
  for (const zone of ugatMapZones) {
    const selectedCard = ugatIdeaCards[2];
    const saved = {
      'selected-idea': selectedCard.id,
      [`card-${selectedCard.id}`]: zone.id,
      [`note-${zone.id}`]: 'Patunay na naka-save sa device.',
      // Historical assignments stay saved but must not appear as extra answers.
      [`card-${ugatIdeaCards[0].id}`]: 'branch',
      'note-branch': zone.id === 'branch' ? 'Patunay na naka-save sa device.' : 'Lumang paliwanag.',
    };
    const explained = renderUgat(UgatTreeMapActivity, saved, true);
    assert.equal((explained.match(/role="tab"/g) ?? []).length, 2, 'Ipaliwanag has no tabs for unrelated categories');
    assert.equal((explained.match(/<textarea\b/g) ?? []).length, 1, 'Only the selected category has a response field');
    assert(explained.includes(`data-testid="ugat-map-note-${zone.id}"`) && explained.includes(zone.prompt), 'The chosen category controls the evidence prompt');
    assert(explained.includes('ANG NAPILING IDEYA') && explained.includes(selectedCard.text));
    assert(explained.includes('PATUNAY MULA SA KUWENTO') && explained.includes(saved[`note-${zone.id}`]));
    for (const card of ugatIdeaCards.filter(card => card.id !== selectedCard.id)) assert(!explained.includes(card.text), 'Ipaliwanag displays only the selected idea');
    for (const other of ugatMapZones.filter(other => other.id !== zone.id)) assert(!explained.includes(`data-testid="ugat-map-note-${other.id}"`) && !explained.includes(other.prompt), 'Unselected categories are hidden');
    assert(!explained.includes('MGA IDEYANG INILAGAY NINYO') && !explained.includes('Baguhin ang paglalagay ng mga ideya'));
    assert(/aria-disabled="true"[^>]*aria-label="Kumpleto na"|aria-label="Kumpleto na"[^>]*aria-disabled="true"/.test(explained), 'Completed Banyuhay has a disabled completion label');
  }

  const lockedTree = renderUgat(UgatExploreActivity);
  const partiallyViewed = Object.fromEntries(ugatClues.slice(0, 3).map(clue => [`viewed-${clue.id}`, 'viewed']));
  const allViewed = Object.fromEntries(ugatClues.map(clue => [`viewed-${clue.id}`, 'viewed']));
  const almostRevealed = renderUgat(UgatExploreActivity, partiallyViewed);
  const revealedTree = renderUgat(UgatExploreActivity, allViewed);
  const beigeTextClass = nativeWeb.StyleSheet.getSheet().textContent.match(/\.([^\s{]+)\{color:rgba\(245,232,200,1\.00\);\}/)?.[1];
  const lockedTextTags = lockedTree.match(/<[^>]+>(?:\?   \?   \?|UGAT NG KUWENTO)</g) ?? [];
  assert(beigeTextClass && lockedTextTags.length === 2 && lockedTextTags.every(tag => tag.includes(beigeTextClass)), 'Both locked question marks and root label use readable beige text');
  for (const html of [lockedTree, almostRevealed]) {
    assert(html.includes('?   ?   ?') && html.includes('UGAT NG KUWENTO'), 'Roots remain locked until all four clues are viewed');
    assert(/aria-disabled="true"[^>]*aria-label="Ipasa"|aria-label="Ipasa"[^>]*aria-disabled="true"/.test(html), 'Exploration cannot finish before four clues are viewed');
  }
  assert(lockedTree.includes('0/4') && almostRevealed.includes('3/4') && revealedTree.includes('4/4'));
  assert(!revealedTree.includes('?   ?   ?') && !revealedTree.includes('UGAT NG KUWENTO'), 'Four clues remove the locked placeholder');
  assert.equal((revealedTree.match(/<path\b/g) ?? []).length, (lockedTree.match(/<path\b/g) ?? []).length + 2, 'All four viewed clues reveal both root paths');
  assert(!/aria-disabled="true"[^>]*aria-label="Ipasa"|aria-label="Ipasa"[^>]*aria-disabled="true"/.test(revealedTree), 'All clues enable exploration submission');
  const explorationReview = renderUgat(UgatExploreActivity, allViewed, true);
  assert(/aria-disabled="true"[^>]*aria-label="Kumpleto na"|aria-label="Kumpleto na"[^>]*aria-disabled="true"/.test(explorationReview), 'Completed exploration retains disabled completion feedback');

  const { ActivityCompletionDialog } = load('components/story-cabinet/ActivityCompletionDialog.tsx');
  const renderCompletion = visible => renderToStaticMarkup(React.createElement(ActivityCompletionDialog, {
    visible, activityTitle: 'Banyuhay', message: 'Naka-save na ang iyong progreso sa device na ito.', onBack() {}, onReview() {},
  }));
  assert.equal(renderCompletion(false), '', 'The success confirmation stays hidden before completion');
  const confirmation = renderCompletion(true);
  for (const text of ['Kumpleto na ang gawain!', 'Banyuhay', 'Naka-save na ang iyong progreso sa device na ito.', 'Bumalik sa mga gawain', 'Balikan ang sagot']) assert(confirmation.includes(text), 'The success dialog identifies completion, storage, and next actions');
  for (const id of ['cabinet-completion-dialog', 'cabinet-completion-back', 'cabinet-completion-review']) assert(confirmation.includes(`data-testid="${id}"`));
  const { ActivityCabinetCard } = load("components/story-cabinet/ActivityCabinetCard.tsx");
  for (const completed of [false, true]) {
    const html = renderToStaticMarkup(React.createElement(ActivityCabinetCard, { activity: cabinetActivities[0], index: 0, completed, hasDraft: false, compact: true, onPress() {} }));
    const svgTags = html.match(/<svg\b[^>]*>/g) ?? [];
    assert.equal(svgTags.length, 1);
    assert(svgTags.every(tag => tag.includes('aria-hidden="true"') && !/\saccessible=/.test(tag)), "Activity cabinets must hide decorative SVGs using valid web attributes");
  }
  const { UgatTreeArt } = load('components/activity-player/ugat-tree-art.tsx');
  renderToStaticMarkup(React.createElement(UgatTreeArt, { grown: [true, true, true], current: 2, growth: new nativeWeb.Animated.Value(1) }));
  assert.deepEqual(errors, [], "Cabinet and tree artwork must render without React DOM errors");

  const { Svg } = require("react-native-svg");
  renderToStaticMarkup(React.createElement(Svg, { accessible: false }));
  assert(errors.some(message => message.includes("non-boolean attribute") && message.includes("accessible")), "The development renderer must detect the original warning");
} finally {
  Module._load = originalLoad;
  console.error = originalError;
}
console.log("PASS: Cabinet SVG accessibility, single-idea Banyuhay, four-clue root reveal, completion confirmation, Utos resume/review, and the original warning negative control.");
