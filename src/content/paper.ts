// The mock paper: a fresh set of four questions each sitting, built from the chapters that exist.
// Each question is a multi-part question on one topic, as in the 2022 paper.
import { mulberry32, pickOne, shuffle } from '../engine/rng';
import type { QuestionPlan } from '../engine/paper';
import type { CalcProblem } from '../engine/types';
import { PROBLEMS } from './index';

interface Blueprint {
  title: string;
  chapter: number;
  /** For each part: the problems it may be, and its marks. */
  parts: { from: string[]; weight: number }[];
}

export const BLUEPRINT: Blueprint[] = [
  {
    title: 'Time value of money and loans',
    chapter: 1,
    parts: [
      { from: ['exam-deferred-licence', 'exam-growing-later', 'exam-lease-or-buy', 'studio-lease', 'cutter-contract'], weight: 10 },
      { from: ['loan-payment', 'equipment-loan', 'loan-balance'], weight: 8 },
      { from: ['two-banks', 'interest-bite'], weight: 7 },
    ],
  },
  {
    title: 'Bonds',
    chapter: 2,
    parts: [
      { from: ['semi-bond', 'exam-bond-two-years', 'retail-bond', 'house-bond'], weight: 9 },
      { from: ['exam-ytm-real', 'bond-ytm'], weight: 9 },
      { from: ['why-pay-more'], weight: 7 },
    ],
  },
  {
    title: 'Stocks and growth',
    chapter: 3,
    parts: [
      { from: ['gordon-d0', 'exam-real-growth-ddm', 'one-year-price'], weight: 9 },
      { from: ['exam-pvgo-roe', 'pvgo-house', 'two-stage', 'two-phase-boutique', 'growth-premium'], weight: 9 },
      { from: ['retain-or-pay'], weight: 7 },
    ],
  },
  {
    title: 'Capital budgeting',
    chapter: 4,
    parts: [
      { from: ['payback-period', 'theo-scarves'], weight: 7 },
      { from: ['exam-hidden-costs', 'project-npv'], weight: 10 },
      { from: ['exam-incremental', 'incremental-irr'], weight: 8 },
    ],
  },
  {
    title: 'Risk, return and portfolios',
    chapter: 5,
    parts: [
      { from: ['stock-sd', 'three-states', 'two-stock-cov'], weight: 7 },
      { from: ['mix-two-stocks', 'scrooge-portfolio', 'exam-target-mix'], weight: 9 },
      { from: ['required-return', 'exam-beta-capm', 'implied-beta'], weight: 9 },
    ],
  },
];

/** A real paper has four questions. With more topics built than that, each sitting draws four. */
export const QUESTIONS_PER_PAPER = 4;

/** The same seed always gives the same paper, so a half-sat paper can be rebuilt after a reload. */
export function buildPaper(seed: number): QuestionPlan[] {
  const rng = mulberry32(seed);
  // Draw four topics, then sit them in chapter order.
  const chosen = shuffle(rng, BLUEPRINT).slice(0, QUESTIONS_PER_PAPER).sort((a, b) => a.chapter - b.chapter);
  return chosen.map((q) => ({
    title: q.title,
    chapter: q.chapter,
    parts: q.parts.map(({ from, weight }) => {
      const id = pickOne(rng, from);
      const p = PROBLEMS[id];
      return { problem: id, weight, params: p.kind === 'calc' ? (p as CalcProblem).vary(rng) : undefined };
    }),
  }));
}
