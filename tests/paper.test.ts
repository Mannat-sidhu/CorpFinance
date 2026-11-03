// Mock exam: the blueprint, marking and finishing a paper.
import { PROBLEMS } from '../src/content';
import { paperText } from '../src/ui/Chat';
import { BLUEPRINT, buildPaper } from '../src/content/paper';
import { expectedValues } from '../src/engine/grading';
import { PAPER_MARKS, finishPaper, marksFor, questionTotal, stepTotals, type PartResult } from '../src/engine/paper';
import type { CalcProblem } from '../src/engine/types';

describe('the blueprint', () => {
  it('has four questions of 25 marks', () => {
    expect(BLUEPRINT).toHaveLength(4);
    for (const q of BLUEPRINT) expect(q.parts.reduce((s, p) => s + p.weight, 0)).toBe(25);
    expect(BLUEPRINT.length * 25).toBe(PAPER_MARKS);
  });
  it('only draws on problems that exist', () => {
    for (const q of BLUEPRINT) for (const p of q.parts) for (const id of p.from) expect(PROBLEMS[id], id).toBeDefined();
  });
  it('mixes written and calculation parts across the paper', () => {
    const kinds = BLUEPRINT.flatMap((q) => q.parts.flatMap((p) => p.from.map((id) => PROBLEMS[id].kind)));
    expect(kinds).toContain('brief');
    expect(kinds).toContain('calc');
  });
});

describe('building a paper', () => {
  it('the same seed gives the same paper', () => {
    expect(JSON.stringify(buildPaper(12345))).toBe(JSON.stringify(buildPaper(12345)));
  });
  it('different seeds give different papers', () => {
    const sig = (s: number) => JSON.stringify(buildPaper(s));
    expect(new Set([1, 2, 3, 4, 5, 6].map(sig)).size).toBeGreaterThan(3);
  });
  it('every part of 300 papers builds into a finite, answerable question', () => {
    for (let seed = 1; seed <= 300; seed++)
      for (const q of buildPaper(seed))
        for (const part of q.parts) {
          const p = PROBLEMS[part.problem];
          if (p.kind !== 'calc') continue;
          const inst = (p as CalcProblem).build(part.params ?? (p as CalcProblem).base);
          expect(Number.isFinite(inst.solve(expectedValues(inst.inputs))), `${part.problem} seed ${seed}`).toBe(true);
        }
  });
});

describe('paper prompts', () => {
  it('coaching sentences are removed, data stays', () => {
    expect(paperText('Our cash earns 5% a year. Draw the timeline before you touch a formula.')).toBe('Our cash earns 5% a year.');
    expect(paperText('You’re both half right.')).toBe('');
    expect(paperText('Plain data sentence.')).toBe('Plain data sentence.');
  });
  it('no part of any paper keeps a coaching sentence', () => {
    for (const q of BLUEPRINT) for (const part of q.parts) for (const id of part.from) {
      const p = PROBLEMS[id] as CalcProblem;
      const beats = p.kind === 'calc' ? p.build(p.base).prompt : [];
      for (const b of beats) expect(paperText(typeof b === 'string' ? b : b.text), id).not.toMatch(/draw the timeline|price it yourself|half right/i);
    }
  });
});

describe('marking a paper', () => {
  it('scales a part to its marks, to the nearest half', () => {
    expect(marksFor(7, 10, 10)).toBe(7);
    expect(marksFor(5, 10, 9)).toBe(4.5);
    expect(marksFor(0, 0, 9)).toBe(0);
    expect(marksFor(10, 10, 7)).toBe(7);
  });
  const part = (q: number, p: number, weight: number, score: number, max: number): PartResult => ({
    q, p, title: 't', weight, score, max, marks: marksFor(score, max, weight), slips: [], working: [],
    steps: [{ step: 'inputs', score, max }],
  });
  it('parts not sat score zero, and the total is the sum of the questions', () => {
    const plan = buildPaper(7);
    const rec = finishPaper({ seed: 7, startedAt: 0, timed: true, parts: [part(0, 0, 10, 10, 10), part(0, 1, 8, 4, 8)] }, plan, 3_600_000);
    expect(rec.parts).toHaveLength(12);
    expect(rec.byQuestion[0]).toBe(14);
    expect(rec.byQuestion.slice(1)).toEqual([0, 0, 0]);
    expect(rec.total).toBe(14);
    expect(rec.minutesUsed).toBe(60);
    expect(rec.parts.filter((p) => p.left)).toHaveLength(10);
    expect(questionTotal(rec.parts, 0)).toBe(14);
  });
  it('a perfect paper is 100', () => {
    const plan = buildPaper(9);
    const parts = plan.flatMap((q, qi) => q.parts.map((p, pi) => part(qi, pi, p.weight, 4, 4)));
    expect(finishPaper({ seed: 9, startedAt: 0, timed: false, parts }, plan, 1).total).toBe(100);
  });
  it('totals marks by move', () => {
    const t = stepTotals([part(0, 0, 10, 3, 4), part(0, 1, 8, 1, 2)]);
    expect(t.inputs).toEqual({ score: 4, max: 6 });
  });
});
