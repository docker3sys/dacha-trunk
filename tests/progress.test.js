import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS } from '../src/engine.js';
import { STORAGE_KEY, freshProgress, loadProgress, saveProgress, awardLevel } from '../src/progress.js';

function memoryStorage(initial = null) {
  let value = initial;
  return {
    getItem(key) { assert.equal(key, STORAGE_KEY); return value; },
    setItem(key, next) { assert.equal(key, STORAGE_KEY); value = next; },
  };
}
const saved = (value) => memoryStorage(JSON.stringify(value));

test('a new game has independent state and first-run hints', () => {
  const a = freshProgress(), b = freshProgress();
  a.completed[1] = 3;
  a.owned.push('sage');
  assert.deepEqual(b.completed, {});
  assert.deepEqual(b.owned, ['sand']);
  assert.equal(b.hints, 3);
  assert.equal(b.current, 1);
});

test('awards are idempotent across replay and storage round trips', () => {
  const initial = freshProgress();
  const first = awardLevel(initial, 1, 2);
  assert.equal(first.reward, 40);
  assert.equal(first.progress.coins, 40);
  assert.equal(first.progress.completed[1], 2);
  assert.equal(initial.coins, 0);
  assert.deepEqual(initial.completed, {});
  const storage = memoryStorage();
  assert.equal(saveProgress(storage, first.progress), true);
  const improved = awardLevel(loadProgress(storage), 1, 3);
  assert.equal(improved.reward, 0);
  assert.equal(improved.progress.coins, 40);
  assert.equal(improved.progress.completed[1], 3);
  const worse = awardLevel(improved.progress, 1, 1);
  assert.equal(worse.reward, 0);
  assert.equal(worse.progress.completed[1], 3);
  assert.equal(worse.progress.coins, 40);
});

test('thirty sequential first completions award exactly thirty rewards', () => {
  let progress = freshProgress();
  for (let id = 1; id <= LEVELS.length; id += 1) {
    const result = awardLevel(progress, id, 3);
    assert.equal(result.reward, 40);
    progress = result.progress;
  }
  assert.equal(progress.coins, 1200);
  assert.equal(Object.keys(progress.completed).length, 30);
  assert.equal(awardLevel(progress, 30, 3).reward, 0);
});

test('invalid IDs, stars, and locked levels never grant a reward', () => {
  const initial = freshProgress();
  for (const id of [0, -1, 31, 1.5, NaN, Infinity, '1', null]) {
    const result = awardLevel(initial, id, 3);
    assert.equal(result.reward, 0);
    assert.deepEqual(result.progress.completed, {});
  }
  for (const stars of [0, -1, 4, 1.5, NaN, Infinity, '3', null]) {
    assert.equal(awardLevel(initial, 1, stars).reward, 0);
  }
  assert.equal(awardLevel(initial, 30, 3).reward, 0);
  assert.equal(awardLevel(initial, 2, 3).reward, 0);
});

test('JSON failures, old versions, and unavailable storage return a fresh game', () => {
  for (const raw of [null, '', '{', 'null', '[]', '7', '"text"', '{"version":0}', '{"version":2}']) {
    assert.deepEqual(loadProgress(memoryStorage(raw)), freshProgress());
  }
  assert.deepEqual(loadProgress(null), freshProgress());
  assert.deepEqual(loadProgress({ getItem() { throw Error('blocked'); } }), freshProgress());
  assert.equal(saveProgress(null, freshProgress()), false);
  assert.equal(saveProgress({ setItem() { throw Error('quota'); } }, freshProgress()), false);
  assert.equal(saveProgress(memoryStorage(), null), false);
});

test('malformed completed keys and currency are sanitized without inventing completed levels', () => {
  const loaded = loadProgress(saved({
    ...freshProgress(), coins: -100, hints: -3, current: 30,
    completed: { 1: 2, 2: 3, 3: 0, 4: 4, 5: '3', 31: 3, '-1': 2, '1.5': 3, '01': 3, '2.0': 3 },
  }));
  assert.deepEqual(loaded.completed, { 1: 2, 2: 3 });
  assert.equal(loaded.coins, 0);
  assert.equal(loaded.hints, 0);
  assert.equal(loaded.current, 3);
  const huge = loadProgress(saved({ ...freshProgress(), coins: 1e100, hints: 1e100, current: 1e100 }));
  assert.equal(huge.coins, 0);
  assert.equal(huge.hints, 3);
  assert.equal(huge.current, 1);
  const array = loadProgress(saved({ ...freshProgress(), completed: [3, 3], drafts: [] }));
  assert.deepEqual(array.completed, {});
  assert.deepEqual(array.drafts, {});
});

test('current level respects campaign boundaries and unlocked progress', () => {
  let progress = freshProgress();
  assert.equal(loadProgress(saved({ ...progress, current: -2 })).current, 1);
  assert.equal(loadProgress(saved({ ...progress, current: 30 })).current, 1);
  for (let id = 1; id <= 30; id += 1) progress = awardLevel(progress, id, 3).progress;
  assert.equal(loadProgress(saved({ ...progress, current: 500 })).current, 30);
  assert.equal(loadProgress(saved({ ...progress, current: 17 })).current, 17);
});

test('ownership is unique, unknown themes are ignored, and unowned paint cannot load', () => {
  const loaded = loadProgress(saved({
    ...freshProgress(), theme: 'berry', owned: ['sage', 'sage', 'bogus', null, 7], sound: 'false', reviewAsked: 'yes',
  }));
  assert.deepEqual(loaded.owned, ['sand', 'sage']);
  assert.equal(loaded.theme, 'sand');
  assert.equal(loaded.sound, true);
  assert.equal(loaded.reviewAsked, false);
  assert.equal(loadProgress(saved({ ...loaded, theme: 'sage', sound: false })).theme, 'sage');
  assert.equal(loadProgress(saved({ ...loaded, sound: false })).sound, false);
});

test('draft round trip preserves legal placement, moves, and hint usage', () => {
  const level = LEVELS[0];
  const piece = level.pieces[0];
  const progress = freshProgress();
  progress.drafts[1] = { placements: { [piece.id]: level.solution[piece.id] }, moves: 12, hintsUsed: 2 };
  const before = JSON.stringify(progress);
  const storage = memoryStorage();
  assert.equal(saveProgress(storage, progress), true);
  assert.equal(JSON.stringify(progress), before);
  const loaded = loadProgress(storage);
  assert.deepEqual(loaded.drafts, progress.drafts);
  loaded.drafts[1].placements[piece.id].x = 999;
  assert.notEqual(progress.drafts[1].placements[piece.id].x, 999);
});

test('draft validation discards impossible cells, duplicate occupancy, and foreign pieces', () => {
  const level = LEVELS[0];
  const [a, b] = level.pieces;
  const draft = {
    placements: { [a.id]: level.solution[a.id], [b.id]: level.solution[a.id], ghost: { x: 1, y: 1, rotation: 0 } },
    moves: -5, hintsUsed: '2',
  };
  const loaded = loadProgress(saved({ ...freshProgress(), drafts: { 1: draft, 31: draft, '1.5': draft, 2: null } }));
  assert.deepEqual(Object.keys(loaded.drafts), ['1']);
  assert.deepEqual(loaded.drafts[1].placements, { [a.id]: level.solution[a.id] });
  assert.equal(loaded.drafts[1].moves, 0);
  assert.equal(loaded.drafts[1].hintsUsed, 0);
});

test('currency never overflows a safe integer on award', () => {
  const result = awardLevel({ ...freshProgress(), coins: Number.MAX_SAFE_INTEGER - 10 }, 1, 3);
  assert.equal(result.reward, 10);
  assert.equal(result.progress.coins, Number.MAX_SAFE_INTEGER);
  assert.ok(Number.isSafeInteger(result.progress.coins));
});
