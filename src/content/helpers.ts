// Small helpers for writing problem content.
import type { CalcProblem, ProblemInstance } from '../engine/types';

export const range = (from: number, to: number) => Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);

/** Percent → decimal. */
export const dec = (pctValue: number) => pctValue / 100;

export const roundTo = (n: number, step: number) => Math.round(n / step) * step;

/** 2 dp for working lines. */
export const w2 = (n: number) => n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
/** Whole number with grouping for working lines. */
export const w0 = (n: number) => Math.round(n).toLocaleString('en-GB');
/** Up to 4 dp, trimmed, for factors. */
export const w4 = (n: number) => n.toLocaleString('en-GB', { maximumFractionDigits: 4 });
/** Rate as a decimal string: 6 → "0.06", 6.5 → "0.065". */
export const rd = (pctValue: number) => String(Math.round(pctValue * 1e4) / 1e6);
/** Growth/discount base: 6 → "1.06". */
export const onePlus = (pctValue: number) => String(Math.round((1 + pctValue / 100) * 1e6) / 1e6);

export const defineCalc = <P,>(p: CalcProblem<P>) => p;
export type Built = ProblemInstance;
