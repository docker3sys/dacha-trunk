import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ITEMS, LEVELS, cellsFor, canPlace, placePiece, removePiece,
  isSolved, findHint, validateLevel,
} from '../src/engine.js';

const sortedCells = (cells) => cells.map(([x, y]) => `${x},${y}`).sort();
const clone = (value) => JSON.parse(JSON.stringify(value));

test('campaign contains 30 distinct, frozen, solvable levels in three chapters', () => {
  assert.equal(LEVELS.length, 30);
  assert.equal(new Set(LEVELS.map((level) => level.chapter)).size, 3);
  assert.equal(new Set(LEVELS.map((level) => level.title)).size, 30);
  assert.equal(new Set(LEVELS.map((level) => JSON.stringify([level.blocked, level.pieces]))).size, 30);
  assert.equal(LEVELS[0].pieces.length, 3);
  assert.equal(LEVELS.at(-1).pieces.length, 9);
  assert.ok(Object.isFrozen(LEVELS));
  assert.ok(Object.isFrozen(LEVELS[0].solution));
  for (const [index, level] of LEVELS.entries()) {
    assert.equal(level.id, index + 1);
    assert.deepEqual(validateLevel(level), { valid: true, errors: [] }, `level ${level.id}`);
  }
});

for (const level of LEVELS) {
  test(`level ${level.id}: its solution can be assembled in any order`, () => {
    for (const order of [level.pieces, [...level.pieces].reverse()]) {
      let state = {};
      for (const piece of order) {
        const p = level.solution[piece.id];
        assert.ok(canPlace(level, state, piece.id, p.x, p.y, p.rotation));
        state = placePiece(level, state, piece.id, p.x, p.y, p.rotation);
        assert.ok(state);
      }
      assert.ok(isSolved(level, state));
      assert.equal(findHint(level, state), null);
    }
  });
}

test('rotation preserves cell count, normalizes top-left, and returns fresh arrays', () => {
  assert.equal(Object.keys(ITEMS).length, 12);
  for (const [kind, definition] of Object.entries(ITEMS)) {
    for (let rotation = -4; rotation <= 8; rotation += 1) {
      const cells = cellsFor(kind, rotation);
      assert.equal(cells.length, definition.shape.length);
      assert.equal(new Set(sortedCells(cells)).size, cells.length);
      assert.equal(Math.min(...cells.map(([x]) => x)), 0);
      assert.equal(Math.min(...cells.map(([, y]) => y)), 0);
      assert.deepEqual(sortedCells(cells), sortedCells(cellsFor({ kind }, rotation + 4)));
    }
    assert.deepEqual(cellsFor(definition), cellsFor(kind));
    const fresh = cellsFor(kind);
    fresh[0][0] = 999;
    assert.notEqual(cellsFor(kind)[0][0], 999);
  }
  assert.deepEqual(cellsFor('toolbox', 1), [[0, 0], [0, 1], [0, 2]]);
});

test('drops reject blocked cells, bounds, overlaps, unknown pieces, and partial grid cells', () => {
  const level = LEVELS[0];
  const piece = level.pieces[0];
  const p = level.solution[piece.id];
  assert.equal(canPlace(level, {}, piece.id, 0, 0, 0), false);
  assert.equal(canPlace(level, {}, piece.id, -1, 1, 0), false);
  assert.equal(canPlace(level, {}, piece.id, level.cols, 1, 0), false);
  assert.equal(canPlace(level, {}, piece.id, 1, level.rows, 0), false);
  assert.equal(canPlace(level, {}, piece.id, 1.5, 1, 0), false);
  assert.equal(canPlace(level, {}, 'not-a-piece', p.x, p.y, p.rotation), false);
  const occupied = { ...level.solution };
  const other = level.pieces[1];
  assert.equal(canPlace(level, occupied, other.id, p.x, p.y, p.rotation), false);
  assert.equal(placePiece(level, occupied, other.id, p.x, p.y, p.rotation), null);
});

test('moving a piece ignores its own old cells but not its neighbours', () => {
  const level = LEVELS[0];
  for (const piece of level.pieces) {
    const p = level.solution[piece.id];
    assert.equal(canPlace(level, level.solution, piece.id, p.x, p.y, p.rotation), true);
  }
});

test('legal mirrored packing wins even when different from the canonical solution', () => {
  const level = LEVELS[0];
  const mirrored = {};
  for (const piece of level.pieces) {
    const p = level.solution[piece.id];
    const width = Math.max(...cellsFor(piece, p.rotation).map(([x]) => x)) + 1;
    mirrored[piece.id] = { ...p, x: level.cols - p.x - width };
  }
  assert.notDeepEqual(mirrored, level.solution);
  assert.equal(isSolved(level, mirrored), true);
});

test('a partial, overlapping, or foreign-piece packing cannot win', () => {
  const level = LEVELS[0];
  const [a, b] = level.pieces;
  assert.equal(isSolved(level, {}), false);
  assert.equal(isSolved(level, removePiece(level.solution, a.id)), false);
  assert.equal(isSolved(level, { ...level.solution, extra: { x: 1, y: 1, rotation: 0 } }), false);
  assert.equal(isSolved(level, { ...level.solution, [a.id]: level.solution[b.id] }), false);
  const renamed = removePiece(level.solution, a.id);
  renamed.unknown = level.solution[a.id];
  assert.equal(isSolved(level, renamed), false);
});

test('placing and removing are immutable; invalid placements preserve the original', () => {
  const level = LEVELS[0];
  const piece = level.pieces[0];
  const p = level.solution[piece.id];
  const empty = Object.freeze({});
  const placed = placePiece(level, empty, piece.id, p.x, p.y, p.rotation + 4);
  assert.deepEqual(empty, {});
  assert.notEqual(placed, empty);
  assert.equal(placed[piece.id].rotation, p.rotation);
  Object.freeze(placed[piece.id]);
  Object.freeze(placed);
  const removed = removePiece(placed, piece.id);
  assert.deepEqual(removed, {});
  assert.ok(placed[piece.id]);
  assert.equal(placePiece(level, placed, piece.id, -1, -1, 0), null);
  assert.deepEqual(placed, { [piece.id]: p });
});

test('successive hints recover a wrong partial packing on every level', () => {
  for (const level of LEVELS) {
    let state = {};
    const first = level.pieces[0];
    const canonical = level.solution[first.id];
    search: for (let rotation = 0; rotation < 4; rotation += 1) {
      for (let y = 0; y < level.rows; y += 1) {
        for (let x = 0; x < level.cols; x += 1) {
          if ((x !== canonical.x || y !== canonical.y || rotation !== canonical.rotation)
            && canPlace(level, {}, first.id, x, y, rotation)) {
            state = placePiece(level, {}, first.id, x, y, rotation);
            break search;
          }
        }
      }
    }
    for (let step = 0; step < level.pieces.length + 1 && !isSolved(level, state); step += 1) {
      const before = clone(state);
      const hint = findHint(level, state);
      assert.ok(hint, `hint missing on level ${level.id}`);
      assert.deepEqual(state, before);
      for (const id of hint.clearIds) state = removePiece(state, id);
      state = placePiece(level, state, hint.pieceId, hint.x, hint.y, hint.rotation);
      assert.ok(state, `hint was not placeable on level ${level.id}`);
    }
    assert.ok(isSolved(level, state), `hints did not converge on level ${level.id}`);
  }
});

test('hint identifies occupants of its canonical target before replacing them', () => {
  let witnessedCollision = false;
  for (const level of LEVELS) {
    for (const piece of level.pieces) {
      for (let rotation = 0; rotation < 4 && !witnessedCollision; rotation += 1) {
        for (let y = 0; y < level.rows && !witnessedCollision; y += 1) {
          for (let x = 0; x < level.cols && !witnessedCollision; x += 1) {
            const state = placePiece(level, {}, piece.id, x, y, rotation);
            if (!state) continue;
            const hint = findHint(level, state);
            if (hint?.clearIds.includes(piece.id)) {
              assert.equal(canPlace(level, state, hint.pieceId, hint.x, hint.y, hint.rotation), false);
              assert.equal(canPlace(level, removePiece(state, piece.id), hint.pieceId, hint.x, hint.y, hint.rotation), true);
              witnessedCollision = true;
            }
          }
        }
      }
      if (witnessedCollision) break;
    }
    if (witnessedCollision) break;
  }
  assert.ok(witnessedCollision);
});

test('malformed saves and gestures fail safely', () => {
  const level = LEVELS[0];
  for (const bad of [null, undefined, 'bad', [], 5]) {
    assert.equal(canPlace(bad, {}, 'p1', 1, 1, 0), false);
    assert.equal(isSolved(bad, {}), false);
    assert.equal(findHint(bad, {}), null);
    assert.equal(validateLevel(bad).valid, false);
  }
  for (const rotation of [NaN, Infinity, 1.5, '1', null]) {
    assert.deepEqual(cellsFor('bag', rotation), []);
    assert.equal(canPlace(level, {}, 'p1', 1, 1, rotation), false);
  }
  assert.deepEqual(cellsFor('unknown'), []);
  assert.deepEqual(cellsFor({ shape: [[NaN, 0]] }), []);
  assert.equal(isSolved(level, null), false);
  assert.equal(findHint(level, null), null);
  assert.deepEqual(removePiece(null, 'p1'), {});
  assert.equal(canPlace(level, { unknown: { x: 1, y: 1, rotation: 0 } }, 'p1', 1, 1, 0), false);
  assert.equal(canPlace(level, { p2: { x: NaN, y: 1, rotation: 0 } }, 'p1', 1, 1, 0), false);
});

test('level validation catches duplicate cells, duplicate IDs, bad shapes and invalid solutions', () => {
  let level = clone(LEVELS[0]);
  level.blocked.push([...level.blocked[0]]);
  assert.equal(validateLevel(level).valid, false);
  level = clone(LEVELS[0]);
  level.pieces[1].id = level.pieces[0].id;
  assert.equal(validateLevel(level).valid, false);
  level = clone(LEVELS[0]);
  level.pieces[0].kind = 'unknown';
  assert.equal(validateLevel(level).valid, false);
  level = clone(LEVELS[0]);
  level.solution.p1.x = -1;
  assert.equal(validateLevel(level).valid, false);
  level = clone(LEVELS[0]);
  delete level.solution;
  assert.equal(validateLevel(level).valid, false);
  level = clone(LEVELS[0]);
  level.blocked.push([1, 1]);
  assert.equal(validateLevel(level).valid, false);
});
