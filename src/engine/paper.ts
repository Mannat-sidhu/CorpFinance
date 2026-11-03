// Exam mode: four 25-mark questions, 120 minutes, nothing marked until the end.
import type { NewSlip } from './slips';

export const PAPER_MINUTES = 120;
export const PAPER_MARKS = 100;

/** One part of a question as planned (the problem and numbers are rebuilt from the seed, never saved). */
export interface PartPlan {
  problem: string;
  params?: unknown;
  /** Marks available for this part out of the question's 25. */
  weight: number;
}

export interface QuestionPlan {
  title: string;
  /** The chapter it draws on. */
  chapter: number;
  parts: PartPlan[];
}

/** A part as sat and marked. Plain data, so a half-finished paper survives a reload. */
export interface PartResult {
  q: number;
  p: number;
  title: string;
  weight: number;
  score: number;
  max: number;
  /** Marks earned out of `weight`. */
  marks: number;
  left?: boolean;
  steps?: { step: string; score: number; max: number }[];
  slips: NewSlip[];
  working: string[];
}

export interface PaperAttempt {
  seed: number;
  startedAt: number;
  timed: boolean;
  parts: PartResult[];
}

export interface PaperRecord {
  at: number;
  seed: number;
  timed: boolean;
  minutesUsed: number;
  total: number;
  byQuestion: number[];
  parts: PartResult[];
}

/** Marks for a part, to the nearest half. */
export const marksFor = (score: number, max: number, weight: number) => (max > 0 ? Math.round(((score / max) * weight) * 2) / 2 : 0);

export const questionTotal = (parts: PartResult[], q: number) => parts.filter((p) => p.q === q).reduce((s, p) => s + p.marks, 0);

/** Marks earned and available for each of the five moves, over every calculation part. */
export function stepTotals(parts: PartResult[]) {
  const by: Record<string, { score: number; max: number }> = {};
  for (const p of parts)
    for (const s of p.steps ?? []) {
      by[s.step] ??= { score: 0, max: 0 };
      by[s.step].score += s.score;
      by[s.step].max += s.max;
    }
  return by;
}

export function finishPaper(attempt: PaperAttempt, plan: QuestionPlan[], now: number): PaperRecord {
  // Anything not sat is a blank part: zero marks.
  const sat = new Set(attempt.parts.map((p) => `${p.q}.${p.p}`));
  const blanks: PartResult[] = plan.flatMap((q, qi) =>
    q.parts
      .map((part, pi) => ({ q: qi, p: pi, part }))
      .filter(({ q: a, p: b }) => !sat.has(`${a}.${b}`))
      .map(({ q: a, p: b, part }) => ({ q: a, p: b, title: 'Not attempted', weight: part.weight, score: 0, max: 1, marks: 0, left: true, slips: [], working: [] })),
  );
  const parts = [...attempt.parts, ...blanks].sort((a, b) => a.q - b.q || a.p - b.p);
  const byQuestion = plan.map((_, qi) => questionTotal(parts, qi));
  return {
    at: now,
    seed: attempt.seed,
    timed: attempt.timed,
    minutesUsed: Math.min(attempt.timed ? PAPER_MINUTES : PAPER_MINUTES * 4, Math.round((now - attempt.startedAt) / 60000)),
    total: byQuestion.reduce((a, b) => a + b, 0),
    byQuestion,
    parts,
  };
}
