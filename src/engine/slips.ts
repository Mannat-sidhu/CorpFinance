// The notebook: every mark lost is logged with what went wrong and how to fix it.
// A slip is "fixed" when the same idea is later answered cleanly.
import type { ConceptId } from './types';

export type SlipStep = 'timeline' | 'formula' | 'inputs' | 'answer' | 'decision' | 'row' | 'label' | 'cell' | 'point' | 'item';

export interface NewSlip {
  concept: ConceptId;
  /** Problem id, so repeats of the same mistake in the same question are counted once. */
  problem: string;
  title: string;
  step: SlipStep;
  what: string;
  fix: string;
}

export interface Slip extends NewSlip {
  at: number;
  /** How many times this exact slip has happened. */
  n: number;
  fixed: boolean;
}

const KEEP = 150;

export const STEP_LABEL: Record<SlipStep, string> = {
  timeline: 'Timeline',
  formula: 'Method',
  inputs: 'Inputs',
  answer: 'Answer',
  decision: 'The call',
  row: 'Worksheet rows',
  label: 'Matching',
  cell: 'Tables',
  point: 'Written points',
  item: 'Sorting',
};

/** What to do about it, for the step that costs the most. */
export const STEP_ADVICE: Record<SlipStep, string> = {
  timeline: 'Draw it before you calculate. Put every payment on the line, and ask which year the first and last land in.',
  formula: 'Ask what shape the cash flows have (one lump, level for a while, level forever, growing) before you reach for a formula.',
  inputs: 'Underline each number as you use it. Check units, and whether a rate is quoted (APR), per period, or already effective.',
  answer: 'The method was right but the arithmetic slipped. Keep the unrounded figure on your calculator until the very end.',
  decision: 'Finish the sentence “the answer means…”. A number isn’t a decision until you compare it with something.',
  row: 'Work down one column at a time, and write the formula for each row once before filling the years.',
  label: 'Work out every number first, then label. Don’t trust a label until the number backs it up.',
  cell: 'Use the rule behind each row instead of guessing cell by cell.',
  point: 'Pick the points that answer the question asked, not just true statements about the topic.',
  item: 'Say which idea each item tests before you sort it.',
};

const same = (a: NewSlip, b: NewSlip) => a.concept === b.concept && a.problem === b.problem && a.step === b.step && a.what === b.what;

export function addSlips(list: Slip[], add: NewSlip[], at: number): Slip[] {
  let out = list;
  for (const s of add) {
    const i = out.findIndex((x) => same(x, s));
    out =
      i >= 0
        ? out.map((x, k) => (k === i ? { ...x, n: x.n + 1, at, fixed: false } : x))
        : [...out, { ...s, at, n: 1, fixed: false }];
  }
  if (out.length > KEEP) {
    // Drop the oldest fixed ones first, then the oldest of anything.
    const drop = out.length - KEEP;
    const fixedOldest = out.filter((s) => s.fixed).sort((a, b) => a.at - b.at).slice(0, drop);
    out = out.filter((s) => !fixedOldest.includes(s));
    if (out.length > KEEP) out = [...out].sort((a, b) => b.at - a.at).slice(0, KEEP);
  }
  return out;
}

export const fixConcept = (list: Slip[], concept: ConceptId): Slip[] =>
  list.some((s) => s.concept === concept && !s.fixed) ? list.map((s) => (s.concept === concept ? { ...s, fixed: true } : s)) : list;

export const openSlips = (list: Slip[]) => list.filter((s) => !s.fixed);

/** Open slips counted by step, most costly first. */
export function slipPattern(list: Slip[]) {
  const by = new Map<SlipStep, number>();
  for (const s of openSlips(list)) by.set(s.step, (by.get(s.step) ?? 0) + s.n);
  return [...by.entries()].sort((a, b) => b[1] - a[1]).map(([step, n]) => ({ step, n }));
}

/** Concepts ordered by how much is still open against them. */
export function slipConcepts(list: Slip[]) {
  const by = new Map<ConceptId, number>();
  for (const s of openSlips(list)) by.set(s.concept, (by.get(s.concept) ?? 0) + s.n);
  return [...by.entries()].sort((a, b) => b[1] - a[1]).map(([concept, n]) => ({ concept, n }));
}
