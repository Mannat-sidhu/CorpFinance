// Process marking: each step is marked on its own, the way an examiner awards method marks.
import type { InputSpec, ProblemInstance, TimelineStream, Unit } from './types';

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

export function markFormula(correct: string, chosen: string | null, hinted: boolean): StepResult {
  const ok = chosen === correct;
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
  const value = given === null ? null : normalise(given, unit, expected);
  if (value !== null && withinTolerance(value, expected, unit)) {
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
    if (Number.isFinite(own) && withinTolerance(ownValue, own, unit)) {
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
