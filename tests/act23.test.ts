import { ACTS, CONCEPTS, PROBLEMS, problemsFor } from '../src/content';
import * as f from '../src/engine/finance';
import { expectedValues, markBrief, markTable } from '../src/engine/grading';
import type { BriefProblem, CalcProblem, TableProblem } from '../src/engine/types';

const answerOf = (id: string, params?: unknown) => {
  const p = PROBLEMS[id] as CalcProblem;
  const inst = p.build(params ?? p.base);
  return inst.solve(expectedValues(inst.inputs));
};
const near = (a: number, e: number, dp = 2) => expect(a).toBeCloseTo(e, dp);

describe('Chapter II story numbers match the Ch3 problem set', () => {
  it('P3: 10-year 5% bond at 6% = 92.64', () => near(answerOf('house-bond'), 92.64));
  it('P5: half-yearly 5.5% at 5.2% = 1,023.16', () => near(answerOf('semi-bond'), 1023.16));
  it('P1: yields 6% → 8% gives 865.80', () => near(answerOf('rate-rise'), 865.8, 1));
  it('P6: real rate 4.76%', () => near(answerOf('real-rate'), 4.76));
  it('P7: real return over two years 7.85%', () => near(answerOf('real-return-2y'), 7.85));
  it('YTM: price 950, 5%, 3 years = 6.90% (the slide’s 6.53% does not reprice to 950)', () => {
    near(answerOf('bond-ytm'), 6.9, 1);
    expect(f.bondPrice(50, 0.0653, 3, 1000)).toBeGreaterThan(955);
  });
  it('2022 Q2(b): 7-year 7% half-yearly bond at 4% is a premium bond', () => {
    const p = PROBLEMS['semi-bond'] as CalcProblem;
    const inst = p.build({ face: 1000, coupon: 7, years: 7, y: 4 });
    expect(inst.solve(expectedValues(inst.inputs))).toBeCloseTo(1181.41, 0);
    expect(inst.decision.correct).toBe('premium');
  });
  it('a 5-year bond falls less than a 10-year bond', () => near(answerOf('maturity-risk'), 7.99, 1));
});

describe('Chapter III story numbers match the Ch4 problems and slides', () => {
  it('Q1: (5 + 110) / 1.08 = 106.48', () => near(answerOf('one-year-price'), 106.48));
  it('Q2: 5 / 40 = 12.5%', () => near(answerOf('level-yield'), 12.5));
  it('Q3: 10 / (0.08 − 0.05) = 333.33', () => near(answerOf('gordon-d0', { D: 10, g: 5, r: 8, basis: 'next', market: 300, name: 'Z' }), 333.33));
  it('slides: 1.06 / (0.20 − 0.06) = 7.57', () => near(answerOf('gordon-d0', { D: 1.06, g: 6, r: 20, basis: 'next', market: 7, name: 'X' }), 7.57));
  it('P19a: 1.35 just paid, 2.75% growth, 9.5% → 20.55', () => near(answerOf('gordon-d0'), 20.55));
  it('P19b: real route gives the same price', () => {
    const real = (1.095 / 1.0275 - 1);
    near(1.35 / real, 20.55);
  });
  it('Stock A: g = 7.5%; value at 15% = 13.33', () => {
    near(answerOf('sustainable-growth'), 7.5);
    near(1 / (0.15 - 0.075), 13.33);
  });
  it('Stock B: g = 3.33%; value at 15% = 8.57', () => {
    near(answerOf('sustainable-growth', { EPS: 1.5, DPS: 1, ROE: 10, r: 15 }), 3.33);
    near(1 / (0.15 - 0.1 / 3), 8.57);
  });
  it('slides ABC Software: PVGO = 44.44 (with EPS 8.33 rounding)', () => near(answerOf('pvgo-house'), 44.44, 1));
  it('Q4: PVGO = 333.33 − 187.50 = 145.83', () => near(answerOf('growth-premium'), 145.83));
  it('slides two-stage: D0 1, 6% for 7 years, r 20% → 6.49', () => near(answerOf('two-stage'), 6.49));
  it('P18 at 10%: Céleste ≈ 104.5 beats Aurore 100 and Belcour 83.33', () => {
    const boss = ACTS[2].boss!;
    const p = PROBLEMS['two-stage'] as CalcProblem;
    const inst = p.build(boss.problems[1].params);
    near(inst.solve(expectedValues(inst.inputs)), 104.5, 0);
    expect(inst.decision.options.find((o) => o.id === inst.decision.correct)!.label).toBe('Céleste');
  });
  it('P18 at 7%: Belcour (166.67) is worth most', () => {
    const boss = ACTS[2].boss!;
    const p = PROBLEMS['two-stage'] as CalcProblem;
    const inst = p.build(boss.problems[2].params);
    expect(inst.decision.options.find((o) => o.id === inst.decision.correct)!.label).toBe('Belcour');
  });
});

describe('new round types', () => {
  const briefs = Object.values(PROBLEMS).filter((p): p is BriefProblem => p.kind === 'brief');
  const tables = Object.values(PROBLEMS).filter((p): p is TableProblem => p.kind === 'table');
  it('every brief has 3+ key points, a trap and a model answer', () => {
    for (const b of briefs) {
      expect(b.cards.filter((c) => c.kind === 'key').length, b.id).toBeGreaterThanOrEqual(3);
      expect(b.cards.some((c) => c.kind === 'trap'), b.id).toBe(true);
      expect(b.model.length).toBeGreaterThan(80);
    }
  });
  it('brief marking: keys score, traps cost, never below zero', () => {
    const cards = [{ kind: 'key' as const }, { kind: 'key' as const }, { kind: 'trap' as const }];
    expect(markBrief(cards, [0, 1])).toEqual({ score: 2, max: 2, clean: true });
    expect(markBrief(cards, [0, 2]).score).toBe(0);
    expect(markBrief(cards, [2]).score).toBe(0);
  });
  it('every table answer is one of its column options', () => {
    for (const t of tables) for (const r of t.rows) r.answers.forEach((a, j) => expect(t.columns[j].options, `${t.id}: ${r.label}`).toContain(a));
  });
  it('table marking counts cells', () => expect(markTable([{ answers: ['A', 'B'] }], [['A', 'C']])).toEqual({ score: 1, max: 2, clean: false }));
});

describe('every built chapter is wired up', () => {
  for (const act of ACTS.filter((a) => !a.draft)) {
    it(`Chapter ${act.numeral}: lessons exist, are taught before use, and every idea can be practised`, () => {
      const taught = new Set<string>();
      for (const s of act.sessions)
        for (const part of s.parts) {
          if (part.kind === 'lesson') part.concepts.forEach((c) => {
            expect(CONCEPTS[c], c).toBeDefined();
            taught.add(c);
          });
          if (part.kind === 'problem') {
            const p = PROBLEMS[part.problem];
            expect(p, part.problem).toBeDefined();
            const priorActs = ACTS.slice(0, act.number - 1).flatMap((a) => a.concepts);
            expect(taught.has(p.concept) || priorActs.includes(p.concept), `${part.problem} taught first`).toBe(true);
          }
        }
      for (const c of act.concepts) {
        expect(taught.has(c), `${c} taught`).toBe(true);
        expect(problemsFor(c).length, `${c} practisable`).toBeGreaterThan(0);
      }
      for (const b of act.boss?.problems ?? []) expect(PROBLEMS[b.problem], b.problem).toBeDefined();
    });
  }
});
