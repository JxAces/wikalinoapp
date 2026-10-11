export const UTOS_MATCH_TARGET = 5;
export const UTOS_MATCH_SIZE = 4;
export const UTOS_GAME_POINT_VALUE = 5;

export const UTOS_CHARACTERS = [
  { id: "jojo", name: "Jojo", detail: "Ang mag-aaral na nagsasalaysay ng kuwento." },
  { id: "moral", name: "Mrs. Moral Character", detail: "Adviser at guro sa Social Science." },
  { id: "minyong", name: "Minyong", detail: "Kaibigan ni Jojo na mula sa isang cultural minority." },
  { id: "tess", name: "Tess", detail: "Ang kasamang mag-aaral ni Jojo sa chapel." },
] as const;
export type UtosCharacterId = typeof UTOS_CHARACTERS[number]["id"];

export const UTOS_RIDDLES = [
  { question: "May katawan ngunit walang buhay,\nMay ulo ngunit hindi nag-iisip.\nSa papel ay nag-iiwan ng kulay,\nKapag napudpod, kailangan kong hasain.", answer: "Lapis" },
  { question: "Manipis ang aking katawan,\nSinusulatan sa paaralan.\nMay guhit man o wala,\nDito isinusulat ang mga salita.", answer: "Papel" },
  { question: "Nakatayo sa harap ng buong silid-aralan,\nItim o berde ang malapad na katawan.\nSulat ng guro'y dito itinatanghal,\nUpang mabasa ng lahat ng mag-aaral.", answer: "Pisara" },
] as const;

export type UtosQuizGameState =
  | { kind: "match"; board: number[]; matches: number }
  | { kind: "memory"; matchedIds: UtosCharacterId[] }
  | { kind: "riddles"; answers: string[] };

const INITIAL_BOARD = [0, 1, 0, 2, 1, 0, 2, 1, 2, 0, 1, 0, 0, 2, 2, 1];

export function createUtosQuizGameState(level: number): UtosQuizGameState {
  if (level === 1) return { kind: "memory", matchedIds: [] };
  if (level === 2) return { kind: "riddles", answers: ["", "", ""] };
  return { kind: "match", board: [...INITIAL_BOARD], matches: 0 };
}

export const createInitialUtosQuizGameState = createUtosQuizGameState;

export function areUtosTilesAdjacent(a: number, b: number) {
  if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0 || a >= 16 || b >= 16) return false;
  return Math.floor(a / UTOS_MATCH_SIZE) === Math.floor(b / UTOS_MATCH_SIZE) && Math.abs(a - b) === 1
    || Math.abs(a - b) === UTOS_MATCH_SIZE;
}

export function getUtosMatchedTiles(board: readonly number[]): number[] {
  const matched = new Set<number>();
  for (let row = 0; row < UTOS_MATCH_SIZE; row++) {
    for (let column = 0; column < UTOS_MATCH_SIZE; column++) {
      const index = row * UTOS_MATCH_SIZE + column;
      for (const step of [1, UTOS_MATCH_SIZE]) {
        const available = step === 1 ? UTOS_MATCH_SIZE - column : UTOS_MATCH_SIZE - row;
        if (available < 3 || board[index] !== board[index + step] || board[index] !== board[index + step * 2]) continue;
        for (let length = 0; length < available && board[index] === board[index + step * length]; length++) matched.add(index + step * length);
      }
    }
  }
  return [...matched];
}

export function findUtosMatchMove(board: readonly number[]): [number, number] | null {
  for (let a = 0; a < board.length; a++) {
    for (const b of [a + 1, a + UTOS_MATCH_SIZE]) {
      if (!areUtosTilesAdjacent(a, b) || board[a] === board[b]) continue;
      const swapped = [...board];
      [swapped[a], swapped[b]] = [swapped[b], swapped[a]];
      if (getUtosMatchedTiles(swapped).length) return [a, b];
    }
  }
  return null;
}

function nextUtosBoard(previous: readonly number[], matched: number[], seed: number): number[] {
  let value = seed + 97;
  const random = () => { value = (value * 1664525 + 1013904223) >>> 0; return value % 3; };
  for (let attempt = 0; attempt < 120; attempt++) {
    const board = previous.map((tile, index) => matched.includes(index) ? random() : tile);
    if (!getUtosMatchedTiles(board).length && findUtosMatchMove(board)) return board;
  }
  // A guaranteed playable board avoids a dead end after a match or a bad save.
  return INITIAL_BOARD.map(tile => (tile + seed) % 3);
}

export function swapUtosMatchTiles(game: Extract<UtosQuizGameState, { kind: "match" }>, a: number, b: number) {
  if (game.matches >= UTOS_MATCH_TARGET || !areUtosTilesAdjacent(a, b) || game.board[a] === game.board[b]) return null;
  const swapped = [...game.board];
  [swapped[a], swapped[b]] = [swapped[b], swapped[a]];
  const matched = getUtosMatchedTiles(swapped);
  if (!matched.length) return null;
  return { kind: "match" as const, board: nextUtosBoard(swapped, matched, game.matches + 1), matches: game.matches + 1 };
}

export function isUtosRiddleAnswer(index: number, answer: string) {
  return UTOS_RIDDLES[index]?.answer.toLocaleLowerCase("fil") === answer.trim().toLocaleLowerCase("fil");
}

/** Keep saved game progress separate from the immutable assessment answers. */
export function normalizeUtosQuizGameState(level: number, value: unknown): UtosQuizGameState | null {
  if (!Number.isInteger(level) || level < 0 || level > 2 || !value || typeof value !== "object") return null;
  const game = value as Record<string, unknown>;
  if (level === 0 && game.kind === "match") {
    if (!Number.isInteger(game.matches) || (game.matches as number) < 0 || (game.matches as number) > UTOS_MATCH_TARGET) return null;
    if (!Array.isArray(game.board) || game.board.length !== 16 || game.board.some(tile => !Number.isInteger(tile) || tile < 0 || tile > 2)) return null;
    const board = getUtosMatchedTiles(game.board).length || !findUtosMatchMove(game.board) ? [...INITIAL_BOARD] : [...game.board];
    return { kind: "match", board, matches: game.matches as number };
  }
  if (level === 1 && game.kind === "memory" && Array.isArray(game.matchedIds)) {
    if (game.matchedIds.some(id => !UTOS_CHARACTERS.some(character => character.id === id))) return null;
    return { kind: "memory", matchedIds: [...new Set(game.matchedIds)] as UtosCharacterId[] };
  }
  if (level === 2 && game.kind === "riddles" && Array.isArray(game.answers) && game.answers.length === 3) {
    if (game.answers.some((answer, index) => answer !== "" && (typeof answer !== "string" || !isUtosRiddleAnswer(index, answer)))) return null;
    return { kind: "riddles", answers: game.answers.map((answer, index) => answer === "" ? "" : UTOS_RIDDLES[index].answer) };
  }
  return null;
}

export function isUtosQuizGameComplete(level: number, game?: UtosQuizGameState) {
  const normalized = normalizeUtosQuizGameState(level, game);
  if (!normalized) return false;
  if (normalized.kind === "match") return normalized.matches === UTOS_MATCH_TARGET;
  if (normalized.kind === "memory") return normalized.matchedIds.length === UTOS_CHARACTERS.length;
  return normalized.answers.every((answer, index) => isUtosRiddleAnswer(index, answer));
}

export function getUtosQuizGamePoints(game: UtosQuizGameState) {
  const completed = game.kind === "match" ? game.matches : game.kind === "memory" ? game.matchedIds.length : game.answers.filter(Boolean).length;
  return completed * UTOS_GAME_POINT_VALUE;
}
