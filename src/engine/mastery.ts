// Scaffolding that fades: New → Practising → Common knowledge, with spaced spot checks.
import type { SaveData, ConceptState } from './save';
import type { ConceptId, Stage } from './types';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const BASE_INTERVAL_DAYS = [2, 5, 12, 25];
/** Same ladder counted in completed sessions, so one long sitting still gets spot checks. */
const SESSION_INTERVALS = [1, 2, 3, 5];
const NEXT: Record<Stage, Stage> = { locked: 'new', new: 'practising', practising: 'common', common: 'common' };

export type Mode = 'full' | 'practising' | 'auto';

export const blankConcept = (): ConceptState => ({
  stage: 'locked',
  wins: [],
  checkLevel: 0,
  dueAt: null,
  dueAfterSession: null,
  attempts: 0,
  cleanAttempts: 0,
  lapses: 0,
  lastSeen: null,
});

export const conceptState = (save: SaveData, id: ConceptId) => save.mastery[id] ?? blankConcept();

export const stageOf = (save: SaveData, id: ConceptId): Stage => conceptState(save, id).stage;

export function modeFor(stage: Stage): Mode {
  if (stage === 'practising') return 'practising';
  if (stage === 'common') return 'auto';
  return 'full';
}

/** Intervals shrink in proportion when the exam is closer than the full ladder (44 days). */
export function intervalScale(examDate: string, now: number) {
  const days = (new Date(examDate + 'T09:00:00').getTime() - now) / DAY;
  const total = BASE_INTERVAL_DAYS.reduce((a, b) => a + b, 0);
  return Math.min(1, Math.max(0.25, days / total));
}

const dayKey = (t: number) => new Date(t).toDateString();

/** Two wins count only if they come from separate sittings: a different day or 6+ hours apart. */
export const separateSittings = (a: number, b: number) => dayKey(a) !== dayKey(b) || Math.abs(a - b) >= 6 * HOUR;

export function introduce(save: SaveData, id: ConceptId, now: number): SaveData {
  const c = conceptState(save, id);
  if (c.stage !== 'locked') return save;
  return { ...save, mastery: { ...save.mastery, [id]: { ...c, stage: 'new', lastSeen: now } } };
}

function scheduleCheck(c: ConceptState, save: SaveData, now: number): ConceptState {
  const level = Math.min(c.checkLevel, BASE_INTERVAL_DAYS.length - 1);
  const scale = intervalScale(save.settings.examDate, now);
  return {
    ...c,
    dueAt: now + BASE_INTERVAL_DAYS[level] * scale * DAY,
    dueAfterSession: save.sessionsPlayed + SESSION_INTERVALS[level],
  };
}

/** Records a worked problem. Returns the new save and any stage change. */
export function recordAttempt(
  save: SaveData,
  id: ConceptId,
  clean: boolean,
  now: number,
): { save: SaveData; promotedTo: Stage | null } {
  let c = conceptState(save, id);
  if (c.stage === 'locked') c = { ...c, stage: 'new' };
  c = { ...c, attempts: c.attempts + 1, cleanAttempts: c.cleanAttempts + (clean ? 1 : 0), lastSeen: now };
  let promotedTo: Stage | null = null;
  if (clean && c.stage !== 'common') {
    const last = c.wins[c.wins.length - 1];
    if (last === undefined || separateSittings(last, now)) c = { ...c, wins: [...c.wins, now] };
    if (c.wins.length >= 2) {
      promotedTo = NEXT[c.stage];
      c = { ...c, stage: promotedTo, wins: [] };
      if (promotedTo === 'common') c = scheduleCheck({ ...c, checkLevel: 0 }, save, now);
    }
  }
  return { save: { ...save, mastery: { ...save.mastery, [id]: c } }, promotedTo };
}

/** Records a spot check on a common-knowledge concept. A miss drops it back to Practising. */
export function recordSpotCheck(save: SaveData, id: ConceptId, correct: boolean, now: number): SaveData {
  let c = conceptState(save, id);
  if (c.stage !== 'common') return recordAttempt(save, id, correct, now).save;
  c = { ...c, attempts: c.attempts + 1, lastSeen: now };
  if (correct) c = scheduleCheck({ ...c, cleanAttempts: c.cleanAttempts + 1, checkLevel: c.checkLevel + 1 }, save, now);
  else c = { ...c, stage: 'practising', wins: [], checkLevel: 0, dueAt: null, dueAfterSession: null, lapses: c.lapses + 1 };
  return { ...save, mastery: { ...save.mastery, [id]: c } };
}

export function isDue(save: SaveData, id: ConceptId, now: number) {
  const c = conceptState(save, id);
  if (c.stage !== 'common') return false;
  return (c.dueAt !== null && c.dueAt <= now) || (c.dueAfterSession !== null && save.sessionsPlayed >= c.dueAfterSession);
}

/**
 * What to spot-check at the end of a session: an overdue common-knowledge concept first,
 * otherwise an earlier concept that is still being learnt. `practisable` lists concepts with a problem.
 */
export function pickSpotCheck(
  save: SaveData,
  practisable: ConceptId[],
  exclude: ConceptId[],
  now: number,
): ConceptId | null {
  const pool = practisable.filter((id) => !exclude.includes(id) && stageOf(save, id) !== 'locked');
  const due = pool.filter((id) => isDue(save, id, now));
  if (due.length) return due.sort((a, b) => (conceptState(save, a).dueAt ?? 0) - (conceptState(save, b).dueAt ?? 0))[0];
  const learning = pool.filter((id) => ['new', 'practising'].includes(stageOf(save, id)));
  if (!learning.length) return null;
  const rank = (id: ConceptId) => {
    const c = conceptState(save, id);
    return (c.stage === 'new' ? 0 : 10) + c.wins.length * 3 + (c.lastSeen ?? 0) / now;
  };
  return learning.sort((a, b) => rank(a) - rank(b))[0];
}

/** Weakest concepts for the progress screen: most lapses and lowest clean rate first. */
export function weakest(save: SaveData, ids: ConceptId[], n = 3) {
  return ids
    .map((id) => ({ id, c: conceptState(save, id) }))
    .filter(({ c }) => c.attempts > 0)
    .sort((a, b) => {
      const ra = a.c.cleanAttempts / a.c.attempts - a.c.lapses * 0.2;
      const rb = b.c.cleanAttempts / b.c.attempts - b.c.lapses * 0.2;
      return ra - rb;
    })
    .slice(0, n);
}
