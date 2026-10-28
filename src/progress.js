import { LEVELS, canPlace, placePiece } from './engine.js';

export const STORAGE_KEY = 'dacha-trunk-v1';
const THEMES = new Set(['sand', 'sage', 'sky', 'berry']);
const MAX_LEVEL = LEVELS.length;
const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const validLevelId = (id) => Number.isSafeInteger(id) && id >= 1 && id <= MAX_LEVEL;
const validLevelKey = (key) => validLevelId(Number(key)) && String(Number(key)) === key;
const safeCount = (value, fallback = 0) => Number.isSafeInteger(value) ? Math.max(0, value) : fallback;

export function freshProgress() {
  return {
    version: 1, completed: {}, coins: 0, hints: 3, current: 1,
    drafts: {}, sound: true, theme: 'sand', owned: ['sand'], reviewAsked: false,
  };
}

function sanitizeProgress(saved) {
  const empty = freshProgress();
  if (!isRecord(saved) || saved.version !== 1) return empty;
  const completed = {};
  if (isRecord(saved.completed)) {
    for (const [id, stars] of Object.entries(saved.completed)) {
      if (validLevelKey(id) && Number.isInteger(stars) && stars >= 1 && stars <= 3) completed[id] = stars;
    }
  }
  const drafts = {};
  if (isRecord(saved.drafts)) {
    for (const [id, draft] of Object.entries(saved.drafts)) {
      if (!validLevelKey(id) || !isRecord(draft)) continue;
      const level = LEVELS[Number(id) - 1];
      let placements = {};
      if (isRecord(draft.placements)) {
        for (const piece of level.pieces) {
          const p = draft.placements[piece.id];
          if (isRecord(p) && canPlace(level, placements, piece.id, p.x, p.y, p.rotation)) {
            placements = placePiece(level, placements, piece.id, p.x, p.y, p.rotation);
          }
        }
      }
      drafts[id] = { placements, moves: safeCount(draft.moves), hintsUsed: safeCount(draft.hintsUsed) };
    }
  }
  const owned = [...new Set(['sand', ...(Array.isArray(saved.owned) ? saved.owned.filter((id) => THEMES.has(id)) : [])])];
  const requestedLevel = Number.isSafeInteger(saved.current) ? Math.max(1, Math.min(MAX_LEVEL, saved.current)) : 1;
  let nextLevel = 1;
  while (nextLevel < MAX_LEVEL && completed[nextLevel]) nextLevel += 1;
  const current = requestedLevel === 1 || completed[requestedLevel] || completed[requestedLevel - 1]
    ? requestedLevel : nextLevel;
  return {
    ...empty, completed, drafts, current,
    coins: safeCount(saved.coins), hints: Math.min(99, safeCount(saved.hints, 3)),
    sound: typeof saved.sound === 'boolean' ? saved.sound : true,
    owned, theme: owned.includes(saved.theme) ? saved.theme : 'sand',
    reviewAsked: saved.reviewAsked === true,
  };
}

/** Corrupt JSON, disabled local storage, and old versions start a clean game. */
export function loadProgress(storage) {
  try { return sanitizeProgress(JSON.parse(storage.getItem(STORAGE_KEY))); }
  catch { return freshProgress(); }
}

/** Award once per level, but let a replay improve its star rating. */
export function awardLevel(progress, id, stars) {
  const safe = sanitizeProgress(progress);
  if (!validLevelId(id) || !Number.isInteger(stars) || stars < 1 || stars > 3
    || (id !== 1 && !safe.completed[id] && !safe.completed[id - 1])) {
    return { progress: safe, reward: 0 };
  }
  const first = !Object.hasOwn(safe.completed, id);
  const reward = first ? Math.min(40, Number.MAX_SAFE_INTEGER - safe.coins) : 0;
  return {
    progress: { ...safe, completed: { ...safe.completed, [id]: Math.max(safe.completed[id] || 0, stars) }, coins: safe.coins + reward },
    reward,
  };
}

/** Serialize known fields and legal draft cells without mutating the game. */
export function saveProgress(storage, progress) {
  try {
    if (!isRecord(progress) || progress.version !== 1) return false;
    storage.setItem(STORAGE_KEY, JSON.stringify(sanitizeProgress(progress)));
    return true;
  } catch { return false; }
}
