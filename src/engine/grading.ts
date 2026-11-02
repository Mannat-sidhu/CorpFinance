// Process marking: each step is marked on its own, the way an examiner awards method marks.
import type { MatchInstance, InputSpec, ProblemInstance, TimelineStream, Unit } from './types';

export const STEP_MAX = 2;
export type StepKey = 'timeline' | 'formula' | 'inputs' | 'answer' | 'decision';
export const STEPS: StepKey[] = ['timeline', 'formula', 'inputs', 'answer', 'decision'];

export interface StepResult {
  score: number;
  max: number;
  hinted: boolean;
  correct: boolean;
  /** Answer was wrong overall but right given the player's own inputs (error carried forward). */
  ecf?: boolean;
  /** Not marked because the game filled it in (practising mode). */
  auto?: boolean;
}

/** Within ±0.5% or the nearest whole euro, whichever is wider. */
export function withinTolerance(given: number, expected: number, unit: Unit) {
  const rel = Math.abs(expected) * 0.005;
  const abs = unit === 'eur' ? 1 : unit === 'pct' ? 0.01 : 1e-9;
  return Math.abs(given - expected) <= Math.max(rel, abs);
}

/** A percentage may be typed as 6 or 0.06. Returns the value in percent. */
export function normalise(given: number, unit: Unit, expected: number) {
  if (unit !== 'pct') return given;
  if (withinTolerance(given, expected, unit)) return given;
  if (withinTolerance(given * 100, expected, unit)) return given * 100;
  return given;
}

const applyHint = (score: number, hinted: boolean) => (hinted ? score / 2 : score);

export interface TimelineAnswer {
  placed: Record<string, number[]>;
  forever: Record<string, boolean>;
  valueAt: number | null;
}

export function markTimeline(spec: ProblemInstance['timeline'], a: TimelineAnswer, hinted: boolean): StepResult {
  const streamOk = (s: TimelineStream) => {
    const got = [...(a.placed[s.id] ?? [])].sort((x, y) => x - y);
    const want = [...s.periods].sort((x, y) => x - y);
    return got.length === want.length && got.every((v, i) => v === want[i]) && !!a.forever[s.id] === !!s.forever;
  };
  const streamsRight = spec.streams.every(streamOk);
  const valueRight = !spec.valueAt || a.valueAt === spec.valueAt.period;
  const raw = streamsRight ? (valueRight ? 2 : 1) : valueRight && spec.valueAt ? 0.5 : 0;
  return { score: applyHint(raw, hinted), max: STEP_MAX, hinted, correct: streamsRight && valueRight };
}

export function markFormula(correct: string, chosen: string | null, hinted: boolean, accept: string[] = []): StepResult {
  const ok = chosen === correct || (chosen !== null && accept.includes(chosen));
  return { score: applyHint(ok ? 2 : 0, hinted), max: STEP_MAX, hinted, correct: ok };
}

const signed = (spec: InputSpec, given: number) => (spec.signless ? Math.abs(given) : given);

export function inputOk(spec: InputSpec, given: number | null) {
  return given !== null && withinTolerance(normalise(signed(spec, given), spec.unit, spec.expected), spec.expected, spec.unit);
}

export function markInputs(specs: InputSpec[], given: Record<string, number | null>, hinted: boolean): StepResult {
  const right = specs.filter((s) => inputOk(s, given[s.key])).length;
  const raw = right === specs.length ? 2 : right >= specs.length / 2 ? 1 : 0;
  return { score: applyHint(raw, hinted), max: STEP_MAX, hinted, correct: right === specs.length };
}

/** Input values to feed the solver: the player's own where valid, normalised to percent. */
export function playerValues(specs: InputSpec[], given: Record<string, number | null>) {
  const out: Record<string, number> = {};
  for (const s of specs) {
    const g = given[s.key];
    out[s.key] = g === null || g === undefined ? NaN : normalise(signed(s, g), s.unit, s.expected);
  }
  return out;
}

export function expectedValues(specs: InputSpec[]) {
  return Object.fromEntries(specs.map((s) => [s.key, s.expected]));
}

export function markAnswer(
  inst: ProblemInstance,
  given: number | null,
  inputsGiven: Record<string, number | null> | null,
  hinted: boolean,
): StepResult & { expected: number; ownExpected?: number } {
  const unit = inst.answer.unit;
  const expected = inst.solve(expectedValues(inst.inputs));
  const tol = inst.answer.tolerance;
  const close = (v: number, e: number) => (tol !== undefined ? Math.abs(v - e) <= tol : withinTolerance(v, e, unit));
  const value = given === null ? null : normalise(given, unit, expected);
  if (value !== null && close(value, expected)) {
    return { score: applyHint(2, hinted), max: STEP_MAX, hinted, correct: true, expected };
  }
  // Error carried forward: right method applied to the player's own (wrong) inputs.
  if (inputsGiven && value !== null) {
    let own: number;
    try {
      own = inst.solve(playerValues(inst.inputs, inputsGiven));
    } catch {
      own = NaN;
    }
    const ownValue = normalise(given!, unit, own);
    if (Number.isFinite(own) && close(ownValue, own)) {
      return { score: applyHint(2, hinted), max: STEP_MAX, hinted, correct: false, ecf: true, expected, ownExpected: own };
    }
  }
  return { score: 0, max: STEP_MAX, hinted, correct: false, expected };
}

export function markDecision(
  spec: ProblemInstance['decision'],
  choice: string | null,
  why: string | null,
  hinted: boolean,
): StepResult {
  const raw = (choice === spec.correct ? 1 : 0) + (why === spec.correctWhy ? 1 : 0);
  return { score: applyHint(raw, hinted), max: STEP_MAX, hinted, correct: raw === 2 };
}

export const totals = (results: Partial<Record<StepKey, StepResult>>) => {
  const marked = Object.values(results).filter((r): r is StepResult => !!r && !r.auto);
  return { score: marked.reduce((s, r) => s + r.score, 0), max: marked.reduce((s, r) => s + r.max, 0) };
};

/** Unassisted and correct on every step the player did: what counts towards mastery. */
export const cleanRun = (results: Partial<Record<StepKey, StepResult>>) =>
  Object.values(results).every((r) => !r || r.auto || (r.correct && !r.hinted));

/** Brief the board: +1 per key point chosen, −1 per trap, floored at 0, out of the number of key points. */
export function markBrief(cards: { kind: 'key' | 'trap' | 'filler' }[], chosen: number[]) {
  const keys = cards.filter((c) => c.kind === 'key').length;
  const raw = chosen.reduce((s, i) => s + (cards[i].kind === 'key' ? 1 : cards[i].kind === 'trap' ? -1 : 0), 0);
  return { score: Math.max(0, raw), max: keys, clean: raw === keys && chosen.every((i) => cards[i].kind !== 'trap') };
}

/** Table-fill: one point per correct cell. */
export function markTable(rows: { answers: string[] }[], given: (string | null)[][]) {
  let score = 0;
  let max = 0;
  rows.forEach((r, i) =>
    r.answers.forEach((a, j) => {
      max++;
      if (given[i]?.[j] === a) score++;
    }),
  );
  return { score, max, clean: score === max };
}

/**
 * Marks a cash-flow worksheet row by row. Each fillable row is checked against its formula applied to
 * the player's own earlier rows (error carried forward), so one slip doesn't sink every later row.
 */
export function markWorksheet(
  rows: { key: string; given?: boolean; cells?: number[]; calc: (r: Record<string, number[]>) => number[] }[],
  years: number,
  typed: Record<string, (number | null)[]>,
  tol = 0.0051,
) {
  const truth: Record<string, number[]> = {};
  const own: Record<string, number[]> = {};
  const result: Record<string, { ok: boolean[]; expected: number[]; ownExpected: number[]; rowOk: boolean; ecf: boolean }> = {};
  for (const row of rows) {
    const t = row.calc(truth);
    truth[row.key] = t;
    const o = row.calc(own);
    const cells = row.cells ?? Array.from({ length: years + 1 }, (_, i) => i);
    if (row.given) {
      own[row.key] = t;
      continue;
    }
    const mine = Array.from({ length: years + 1 }, (_, y) => (cells.includes(y) ? (typed[row.key]?.[y] ?? NaN) : o[y]));
    own[row.key] = mine.map((v) => (Number.isFinite(v) ? v : 0));
    const ok = mine.map((v, y) => !cells.includes(y) || (Number.isFinite(v) && (Math.abs(v - o[y]) <= tol || Math.abs(v - t[y]) <= tol)));
    const exact = mine.every((v, y) => !cells.includes(y) || Math.abs(v - t[y]) <= tol);
    result[row.key] = { ok, expected: t, ownExpected: o, rowOk: ok.every(Boolean), ecf: ok.every(Boolean) && !exact };
  }
  return { truth, own, result };
}

/**
 * Match and choose. One point per computed value and per label matched; two for a choice that
 * doesn't destroy value and is argued from a label that truly fits it. Any sound option scores.
 */
export function markMatch(
  inst: MatchInstance,
  typed: Record<string, number | null>,
  matched: Record<string, string | null>,
  chosen: string | null,
  reason: string | null,
) {
  const computeIds = inst.compute ? Object.keys(inst.compute.values) : [];
  const computeOk: Record<string, boolean> = {};
  for (const id of computeIds) {
    const want = inst.compute!.values[id];
    const got = typed[id];
    const tol = inst.compute!.tolerance;
    computeOk[id] = got !== null && got !== undefined && (tol !== undefined ? Math.abs(normalise(got, inst.compute!.unit, want) - want) <= tol : withinTolerance(normalise(got, inst.compute!.unit, want), want, inst.compute!.unit));
  }
  const labelOk: Record<string, boolean> = Object.fromEntries(inst.labels.map((l) => [l.id, matched[l.id] === l.answer]));
  const badOptions = inst.labels.filter((l) => l.bad).map((l) => l.answer);
  const fits = inst.labels.filter((l) => l.answer === chosen).map((l) => l.id);
  const reasonLabel = inst.reasons.find((r) => r.id === reason)?.label;
  const choiceOk = !!chosen && !badOptions.includes(chosen) && !!reasonLabel && fits.includes(reasonLabel);
  const score = Object.values(computeOk).filter(Boolean).length + Object.values(labelOk).filter(Boolean).length + (choiceOk ? 2 : 0);
  const max = computeIds.length + inst.labels.length + 2;
  return { computeOk, labelOk, choiceOk, score, max, clean: score === max };
}
