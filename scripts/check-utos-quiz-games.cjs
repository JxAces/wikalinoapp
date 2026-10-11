/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const helper = {};
new Function('exports', ts.transpileModule(fs.readFileSync(path.join(__dirname, '../data/utos-quiz-games.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText)(helper);

const { createInitialUtosQuizGameState, findUtosMatchMove, getUtosMatchedTiles, getUtosQuizGamePoints,
  isUtosQuizGameComplete, isUtosRiddleAnswer, normalizeUtosQuizGameState, swapUtosMatchTiles, UTOS_CHARACTERS, UTOS_RIDDLES } = helper;

let match = createInitialUtosQuizGameState(0);
assert.equal(isUtosQuizGameComplete(0, match), false);
assert.equal(swapUtosMatchTiles(match, 0, 15), null, 'Distant tiles cannot be swapped');
const initial = JSON.stringify(match);
assert.equal(swapUtosMatchTiles(match, 0, 4), null, 'A swap without a matching line earns nothing');
assert.equal(JSON.stringify(match), initial, 'Failed swaps preserve the saved board');
for (let count = 1; count <= 5; count++) {
  const move = findUtosMatchMove(match.board);
  assert(move, 'Every refill supplies a legal move');
  const prior = JSON.stringify(match);
  const next = swapUtosMatchTiles(match, ...move);
  assert(next);
  assert.equal(JSON.stringify(match), prior, 'Successful swaps do not mutate earlier saved state');
  match = next;
  assert.equal(match.matches, count, 'A successful move counts once even if several lines match');
  assert.equal(getUtosMatchedTiles(match.board).length, 0, 'Refills do not silently award automatic matches');
  assert.equal(isUtosQuizGameComplete(0, match), count === 5);
  assert.equal(getUtosQuizGamePoints(match), count * 5);
}
assert.equal(swapUtosMatchTiles(match, ...findUtosMatchMove(match.board)), null, 'A completed game cannot farm further bonus points');
assert.deepEqual(normalizeUtosQuizGameState(0, JSON.parse(JSON.stringify(match))), match, 'Completed matching game resumes after serialization');
assert.equal(normalizeUtosQuizGameState(0, { ...match, matches: 6 }), null);
assert.equal(normalizeUtosQuizGameState(0, { ...match, board: [0] }), null);
assert.equal(normalizeUtosQuizGameState(0, { ...match, board: Array(16).fill(9) }), null);

const memory = createInitialUtosQuizGameState(1);
assert.equal(isUtosQuizGameComplete(1, memory), false);
assert.equal(normalizeUtosQuizGameState(1, { kind: 'memory', matchedIds: ['not-a-character'] }), null);
assert.equal(isUtosQuizGameComplete(1, { kind: 'memory', matchedIds: ['jojo', 'jojo', 'jojo', 'jojo'] }), false, 'Duplicate pairs cannot unlock the questions');
const matched = { kind: 'memory', matchedIds: UTOS_CHARACTERS.map(character => character.id) };
assert.equal(isUtosQuizGameComplete(1, matched), true);
assert.equal(getUtosQuizGamePoints(matched), 20);
assert.equal(isUtosQuizGameComplete(0, matched), false, 'A different level game cannot bypass the gate');

const riddles = createInitialUtosQuizGameState(2);
assert.equal(isUtosQuizGameComplete(2, riddles), false);
assert.equal(isUtosRiddleAnswer(0, '  LAPIS  '), true, 'Typed answers ignore case and surrounding whitespace');
assert.equal(isUtosRiddleAnswer(0, 'Papel'), false);
assert.equal(normalizeUtosQuizGameState(2, { kind: 'riddles', answers: ['wrong', '', ''] }), null, 'Wrong answers are never stored as solved');
assert.equal(isUtosQuizGameComplete(2, { kind: 'riddles', answers: ['Lapis', 'Papel', ''] }), false);
const solved = normalizeUtosQuizGameState(2, { kind: 'riddles', answers: ['LAPIS', ' papel ', 'Pisara'] });
assert.equal(isUtosQuizGameComplete(2, solved), true);
assert.equal(getUtosQuizGamePoints(solved), 15);
assert.deepEqual(solved.answers, UTOS_RIDDLES.map(riddle => riddle.answer));
assert.equal(normalizeUtosQuizGameState(3, match), null);
assert.equal(normalizeUtosQuizGameState(1, null), null);
console.log('PASS: Utos matching moves, five-match gate, memory pairs, exact typed riddles, separate game points, invalid saves and resume.');
