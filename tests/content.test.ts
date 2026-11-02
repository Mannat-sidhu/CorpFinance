import { ACTS, CONCEPTS, METHODS, PROBLEMS, PRACTISABLE, isCalc, problemsFor } from '../src/content';
import { expectedValues } from '../src/engine/grading';
import { mulberry32 } from '../src/engine/rng';
import type { CalcProblem, ProblemInstance } from '../src/engine/types';

const calcs = Object.values(PROBLEMS).filter(isCalc) as CalcProblem[];

function checkInstance(id: string, inst: ProblemInstance) {
  const answer = inst.solve(expectedValues(inst.inputs));
  expect(Number.isFinite(answer), `${id}: answer finite`).toBe(true);
  expect(inst.formula.options, `${id}: correct formula offered`).toContain(inst.formula.correct);
  for (const m of inst.formula.options) expect(METHODS[m], `${id}: method ${m} exists`).toBeDefined();
  expect(inst.decision.options.map((o) => o.id)).toContain(inst.decision.correct);
  expect(inst.decision.why.map((o) => o.id)).toContain(inst.decision.correctWhy);
  for (const o of inst.decision.options) expect(inst.outcomes[o.id], `${id}: outcome for ${o.id}`).toBeDefined();
  for (const s of inst.timeline.streams) {
    expect(s.periods.length).toBeGreaterThan(0);
    for (const p of s.periods) expect(p >= 0 && p <= inst.timeline.show, `${id}: period ${p} on ruler`).toBe(true);
  }
  if (inst.timeline.valueAt) expect(inst.timeline.valueAt.period).toBeLessThanOrEqual(inst.timeline.show);
  const text = [...inst.prompt.map((b) => (typeof b === 'string' ? b : b.text)), inst.ask, inst.answer.explain, inst.decision.explain, ...inst.working, inst.cfoLine].join(' ');
  expect(text, `${id}: no broken numbers`).not.toMatch(/NaN|undefined|Infinity/);
  // Every input value that appears in prose should be printed exactly as the solver uses it (spot-check: no two
  // inputs share a key, and the decision label set is unique).
  expect(new Set(inst.inputs.map((i) => i.key)).size).toBe(inst.inputs.length);
  // Player-facing copy stays independent of the course: no lecture or textbook references.
  expect(text, `${id}: no lecture references`).not.toMatch(/lecture|BMA|exam script/i);
}

describe('every calc problem is internally consistent', () => {
  for (const p of calcs) {
    it(`${p.id}: base parameters`, () => checkInstance(p.id, p.build(p.base)));
    it(`${p.id}: 200 random variations`, () => {
      const rng = mulberry32(42);
      for (let i = 0; i < 200; i++) checkInstance(p.id, p.build(p.vary(rng)));
    });
  }
});

const answerOf = (id: string, params?: unknown) => {
  const p = PROBLEMS[id] as CalcProblem;
  const inst = p.build(params ?? p.base);
  return inst.solve(expectedValues(inst.inputs));
};

describe('story numbers', () => {
  it('laser cutter NPV = €1,975.82', () => expect(answerOf('laser-cutter')).toBeCloseTo(1975.82, 1));
  it('Liffey Rose royalty = €107,167.35', () => expect(answerOf('royalty-sale')).toBeCloseTo(107167.35, 1));
  it('Ha’penny royalty (C₁ = 10,500) = €210,000', () => expect(answerOf('idris-royalty')).toBeCloseTo(210000, 2));
  it('studio lease = €107,162.53, so pay upfront', () => {
    expect(answerOf('studio-lease')).toBeCloseTo(107162.53, 1);
    expect((PROBLEMS['studio-lease'] as CalcProblem).build((PROBLEMS['studio-lease'] as CalcProblem).base).decision.correct).toBe('upfront');
  });
  it('Bríd: rising package costs more than flat', () => {
    const inst = (PROBLEMS['cutter-contract'] as CalcProblem).build((PROBLEMS['cutter-contract'] as CalcProblem).base);
    expect(inst.decision.correct).toBe('flat');
  });
  it('loan payment €120k/10y/7% = €17,085.30', () => expect(answerOf('loan-payment')).toBeCloseTo(17085.3, 1));
  it('Merchant’s Quay 6.9% monthly = 7.12% EAR, so Harbour Mutual is cheaper', () => {
    expect(answerOf('two-banks')).toBeCloseTo(7.1224, 3);
    expect((PROBLEMS['two-banks'] as CalcProblem).build((PROBLEMS['two-banks'] as CalcProblem).base).decision.correct).toBe('hm');
  });
  it('boss: €300k/20y/5% payment = €24,072.78', () =>
    expect(answerOf('loan-payment', { P: 300000, r: 5, T: 20, error: 0, ctx: 'flagship' })).toBeCloseTo(24072.78, 1));
  it('boss: first payment interest share = 62.31%', () =>
    expect(answerOf('interest-share', { P: 300000, r: 5, T: 20, k: 1, ctx: 'flagship' })).toBeCloseTo(62.31, 1));
  it('2022 paper Q1(d): $1,516/month, 25y, 9% monthly, 25% deposit ≈ $240,864', () => {
    const v = answerOf('house-mortgage');
    expect(v).toBeGreaterThan(240000);
    expect(v).toBeLessThan(241700);
  });
  it('boss: fraction repaid after 10 = 38.08%', () =>
    expect(answerOf('loan-balance', { P: 300000, r: 5, T: 20, k: 10, ctx: 'flagship' })).toBeCloseTo(38.08, 1));
});

describe('act structure', () => {
  it('every session part points at real content', () => {
    for (const act of ACTS)
      for (const s of act.sessions)
        for (const part of s.parts) {
          if (part.kind === 'problem') expect(PROBLEMS[part.problem], part.problem).toBeDefined();
          if (part.kind === 'lesson') for (const c of part.concepts) expect(CONCEPTS[c], c).toBeDefined();
        }
  });
  it('every Act I concept has a lesson, is taught in a session and can be practised', () => {
    const act = ACTS[0];
    const taught = new Set(act.sessions.flatMap((s) => s.parts.flatMap((p) => (p.kind === 'lesson' ? p.concepts : []))));
    for (const c of act.concepts) {
      expect(CONCEPTS[c], c).toBeDefined();
      expect(taught.has(c), `${c} taught`).toBe(true);
      expect(problemsFor(c).length, `${c} practisable`).toBeGreaterThan(0);
      expect(PRACTISABLE).toContain(c);
    }
  });
  it('a lesson comes before any problem on its concept within a session', () => {
    for (const s of ACTS[0].sessions) {
      const seen = new Set<string>();
      for (const part of s.parts) {
        if (part.kind === 'lesson') part.concepts.forEach((c) => seen.add(c));
        if (part.kind === 'problem') {
          const p = PROBLEMS[part.problem];
          const earlier = ACTS[0].sessions.slice(0, ACTS[0].sessions.indexOf(s)).flatMap((x) => x.parts);
          const taughtBefore = earlier.some((x) => x.kind === 'lesson' && x.concepts.includes(p.concept));
          expect(seen.has(p.concept) || taughtBefore, `${part.problem} after its lesson`).toBe(true);
        }
      }
    }
  });
});
