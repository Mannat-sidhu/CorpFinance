// Chapter V: numbers against the Chapter 7–8 problem set, the slides and an independent calculation.
import { ACTS, PROBLEMS } from '../src/content';
import { ACT5_PROBLEMS } from '../src/content/act-5-problems';
import { expectedValues } from '../src/engine/grading';
import { mulberry32 } from '../src/engine/rng';
import type { CalcProblem, ClassifyProblem } from '../src/engine/types';

const answerOf = (id: string, params?: unknown) => {
  const p = PROBLEMS[id] as CalcProblem;
  const inst = p.build(params ?? p.base);
  return inst.solve(expectedValues(inst.inputs));
};
const callOf = (id: string, params?: unknown) => {
  const p = PROBLEMS[id] as CalcProblem;
  return p.build(params ?? p.base).decision.correct;
};
const near = (a: number, b: number, dp = 2) => expect(a).toBeCloseTo(b, dp);

describe('Chapter V story numbers', () => {
  it('Ch7 P1: index return 25.63%', () => near(answerOf('index-return'), 25.6286, 3));
  it('Ch7 P2: Ruritania beats Costaguana by 1.47 real points', () => {
    near(answerOf('real-markets'), 1.4706, 3);
    expect(callOf('real-markets')).toBe('r');
  });
  it('Ch7 P4: average premium over four years −26.475%, not paid', () => {
    near(answerOf('risk-premium-years'), -26.475, 3);
    expect(callOf('risk-premium-years')).toBe('no');
  });
  it('Ch7 P4: average real return over three years −25.35%', () => near(answerOf('real-stock-average'), -25.3544, 3));
  it('Recap Ex 1: SD 8.37%; Ex 2: SD 11.62%', () => {
    near(answerOf('stock-sd'), 8.3666, 3);
    near(answerOf('three-states'), 11.619, 3);
  });
  it('Recap Ex 3: correlation 0.6; boom/bust covariance −135', () => {
    near(answerOf('two-stock-cov'), 0.6, 3);
    near(answerOf('cov-sign'), -135, 2);
    expect(callOf('cov-sign')).toBe('opposite');
  });
  it('Ch7 P19: 60/40 of SD 10 and 20 at ρ 0.5 → 12.17; P24 → 18.08, better than all in A', () => {
    near(answerOf('mix-two-stocks'), 12.1655, 3);
    near(answerOf('scrooge-portfolio'), 18.0843, 3);
    expect(callOf('scrooge-portfolio')).toBe('better');
  });
  it('Ch8 P1: beta 2; P3: portfolio beta 1.3', () => {
    near(answerOf('stock-beta'), 2, 3);
    near(answerOf('portfolio-beta'), 1.3, 3);
  });
  it('Ch8 P9: β 0.8 needs 10.4% (9.8% is a negative NPV); β 1.5 needs 16%; 11.2% implies β 0.9', () => {
    near(answerOf('required-return'), 10.4, 3);
    expect(callOf('required-return')).toBe('no');
    near(answerOf('required-return', { rf: 4, rm: 12, beta: 1.5, expected: 15 }), 16, 3);
    expect(callOf('required-return', { rf: 4, rm: 12, beta: 1.5, expected: 15 })).toBe('no');
    near(answerOf('implied-beta'), 0.9, 3);
  });
  it('slides: market 10% / SD 15%, bills 5%: SD 10 → 66.7% in the market', () => {
    near(answerOf('mix-risk-free'), 66.667, 2);
    expect(callOf('mix-risk-free')).toBe('no');
    near(answerOf('mix-risk-free', { rf: 5, rm: 10, sm: 15, kind: 'ret', target: 15 }), 200, 1);
    expect(callOf('mix-risk-free', { rf: 5, rm: 10, sm: 15, kind: 'ret', target: 15 })).toBe('yes');
  });
  it('Ch7 P21: A, D and G are the inefficient portfolios, each with a named better one', () => {
    const p = PROBLEMS['efficient-or-not'] as ClassifyProblem;
    const bad = p.items.filter((i) => i.category === 'inefficient').map((i) => i.text.slice(10, 11));
    expect(bad).toEqual(['A', 'D', 'G']);
    for (const i of p.items.filter((x) => x.category === 'inefficient')) expect(i.why).toMatch(/Portfolio [A-H] offers/);
  });
  it('exam room: beta 1.634 from five years of data, required return 12.80%', () => near(answerOf('exam-beta-capm'), 12.8036, 3));
  it('exam room: SD 9 of 16 at 3–11% gives 7.5%, short of an 8% target', () => {
    near(answerOf('exam-target-mix'), 7.5, 3);
    expect(callOf('exam-target-mix')).toBe('no');
  });
});

describe('Chapter V decisions are real calls', () => {
  // These teach a fixed lesson: the same answer by design.
  const fixed = new Set(['why-not-all-risk', 'why-no-patterns']);
  for (const p of ACT5_PROBLEMS.filter((x): x is CalcProblem => x.kind === 'calc' && !fixed.has(x.id))) {
    it(`${p.id}: more than one call comes up across variations`, () => {
      const rng = mulberry32(31);
      const calls = new Set<string>();
      for (let i = 0; i < 300; i++) calls.add(p.build(p.vary(rng)).decision.correct);
      expect(calls.size, [...calls].join()).toBeGreaterThanOrEqual(2);
    });
  }
  it('every wrong answer stays distinguishable: scrooge reaches all three calls', () => {
    const p = PROBLEMS['scrooge-portfolio'] as CalcProblem;
    const rng = mulberry32(5);
    const calls = new Set<string>();
    for (let i = 0; i < 400; i++) calls.add(p.build(p.vary(rng)).decision.correct);
    expect([...calls].sort()).toEqual(['better', 'unclear', 'worse']);
  });
});

describe('Chapter V is built into the game', () => {
  it('it is the fifth act, with four episodes, a boss and an exam room', () => {
    const a = ACTS[4];
    expect(a.numeral).toBe('V');
    expect(a.draft).toBeFalsy();
    expect(a.sessions).toHaveLength(4);
    expect(a.boss!.problems).toHaveLength(6);
    expect(a.exam!.problems).toHaveLength(2);
  });
});
