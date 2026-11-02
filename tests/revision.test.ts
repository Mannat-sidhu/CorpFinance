// Fading help, exam rooms, holdings and match-and-choose.
import { ACTS, CONCEPTS, PROBLEMS, methodsUpTo, seedHoldings } from '../src/content';
import { expectedValues, markFormula, markMatch } from '../src/engine/grading';
import { closeYear, flowIn, pin, previewYear } from '../src/engine/holdings';
import { bossHelp, helpFor } from '../src/engine/mastery';
import { mulberry32 } from '../src/engine/rng';
import { freshSave, migrate } from '../src/engine/save';
import type { CalcProblem, MatchInstance, MatchProblem } from '../src/engine/types';

const answerOf = (id: string) => {
  const p = PROBLEMS[id] as CalcProblem;
  const inst = p.build(p.base);
  return inst.solve(expectedValues(inst.inputs));
};
const near = (a: number, b: number, dp = 2) => expect(a).toBeCloseTo(b, dp);

describe('help fades', () => {
  it('by stage', () => {
    expect(helpFor('new')).toBe('guided');
    expect(helpFor('practising')).toBe('prompted');
    expect(helpFor('common')).toBe('unguided');
  });
  it('boss levels: guided in I, prompted in II, unguided from III', () => {
    expect([1, 2, 3, 4].map(bossHelp)).toEqual(['guided', 'prompted', 'unguided', 'unguided']);
  });
  it('every calc problem’s method is on the unguided list for its chapter', () => {
    for (const p of Object.values(PROBLEMS)) {
      if (p.kind !== 'calc') continue;
      expect(methodsUpTo(CONCEPTS[p.concept].act), p.id).toContain(p.build(p.base).formula.correct);
    }
  });
  it('an accepted alternative method scores', () => {
    expect(markFormula('annuity', 'npv-sum', false, ['npv-sum']).correct).toBe(true);
    expect(markFormula('annuity', 'perpetuity', false, ['npv-sum']).correct).toBe(false);
  });
});

describe('exam rooms', () => {
  it('every chapter I–IV has one, with existing problems', () => {
    for (const a of ACTS.slice(0, 4)) {
      expect(a.exam, `chapter ${a.numeral}`).toBeDefined();
      for (const q of a.exam!.problems) expect(PROBLEMS[q.problem], q.problem).toBeDefined();
    }
  });
  it('deferred licence: EAR 6.1678%, PV of 12,000 × 5 from year 4', () => {
    const r = Math.pow(1 + 0.06 / 12, 12) - 1;
    const pv = (12000 / r) * (1 - Math.pow(1 + r, -5)) / Math.pow(1 + r, 3);
    near(answerOf('exam-deferred-licence'), pv);
    near(pv, 42048.38, 1);
  });
  it('lease or buy: 26,000 in advance for 5 years at 7% = 114,067.49', () => near(answerOf('exam-lease-or-buy'), 114067.49, 1));
  it('bond two years on: 10-year 5% semi-annual, now 8 years at 6.5% = 907.57', () => near(answerOf('exam-bond-two-years'), 907.57, 1));
  it('PVGO from ROE: g = 10.8%, P = 1.6 / 0.012 = 133.33, PVGO = 100', () => near(answerOf('exam-pvgo-roe'), 100, 1));
  it('hidden costs: OCF 60,250, NPV 22,404', () => near(answerOf('exam-hidden-costs'), 22404.4, 0));
  it('questions carry numbers the answer doesn’t need', () => {
    for (const id of ['exam-deferred-licence', 'exam-hidden-costs', 'exam-pvgo-roe']) {
      const inst = (PROBLEMS[id] as CalcProblem).build((PROBLEMS[id] as CalcProblem).base);
      const nums = inst.prompt.map((b) => (typeof b === 'string' ? b : b.text)).join(' ').match(/\d[\d,.]*/g) ?? [];
      expect(nums.length, id).toBeGreaterThan(inst.inputs.length + 1);
    }
  });
});

describe('match and choose', () => {
  const matches = Object.values(PROBLEMS).filter((p): p is MatchProblem => p.kind === 'match');
  function check(id: string, inst: MatchInstance) {
    const ids = inst.options.map((o) => o.id);
    const answers = inst.labels.map((l) => l.answer);
    expect(new Set(answers).size, `${id}: one label per option`).toBe(answers.length);
    for (const a of answers) expect(ids).toContain(a);
    for (const l of inst.labels.filter((x) => !x.bad)) expect(inst.reasons.some((r) => r.label === l.id), `${id}: reason for ${l.id}`).toBe(true);
    for (const l of inst.labels.filter((x) => x.bad)) {
      const o = inst.options.find((x) => x.id === l.answer)!;
      expect(o.outcome.valueDelta, `${id}: ${o.id} destroys value`).toBeLessThan(0);
    }
    for (const l of inst.labels.filter((x) => !x.bad)) {
      const o = inst.options.find((x) => x.id === l.answer)!;
      expect(o.outcome.valueDelta, `${id}: ${o.id} is sound`).toBeGreaterThanOrEqual(-1);
    }
    if (inst.compute) for (const v of Object.values(inst.compute.values)) expect(Number.isFinite(v)).toBe(true);
    const text = JSON.stringify(inst.prompt) + inst.labels.map((l) => l.why).join(' ');
    expect(text).not.toMatch(/NaN|undefined|Infinity|lecture|BMA/);
  }
  for (const p of matches) {
    it(`${p.id}: base`, () => check(p.id, p.build(p.base, { cash: 150000 })));
    it(`${p.id}: 50 variations`, () => {
      const rng = mulberry32(7);
      for (let i = 0; i < 50; i++) check(p.id, p.build(p.vary(rng), { cash: 150000 }));
    });
  }
  it('first bets: NPVs at 8%', () => {
    const inst = (PROBLEMS['first-bets'] as MatchProblem).build({ k: 1, r: 8 }, { cash: 150000 });
    near(inst.compute!.values.online, 11868.73, 0);
    expect(inst.compute!.values.gifting).toBeLessThan(0);
  });
  it('any sound pick scores, if the reason fits it', () => {
    const inst = (PROBLEMS['first-bets'] as MatchProblem).build({ k: 1, r: 8 }, { cash: 150000 });
    const right = Object.fromEntries(inst.labels.map((l) => [l.id, l.answer]));
    const typed = inst.compute!.values;
    expect(markMatch(inst, typed, right, 'wholesale', 'r-safe').clean).toBe(true);
    expect(markMatch(inst, typed, right, 'online', 'r-reward').clean).toBe(true);
    expect(markMatch(inst, typed, right, 'online', 'r-safe').choiceOk).toBe(false);
    expect(markMatch(inst, typed, right, 'gifting', 'r-reward').choiceOk).toBe(false);
  });
});

describe('holdings and year end', () => {
  it('flows land in the right years, with growth and a final payment', () => {
    const h = pin({ id: 'b', label: 'bond', start: 1, years: 3, amount: -50, final: -1000 }, 2);
    expect([1, 2, 3, 4, 5].map((y) => flowIn(h, y))).toEqual([0, -50, -50, -1050, 0]);
    const g = pin({ id: 'g', label: 'royalty', start: 2, amount: 100, growth: 10 }, 1);
    expect(flowIn(g, 1)).toBe(0);
    near(flowIn(g, 3), 110);
  });
  it('closing a year moves cash once, and only once', () => {
    let s = freshSave('T', 1);
    s = { ...s, cash: 1000, holdings: [pin({ id: 'a', label: 'a', start: 1, years: 2, amount: 300 }, 1)] };
    const once = closeYear(s, 1).save;
    expect(once.cash).toBe(1300);
    expect(closeYear(once, 1).save.cash).toBe(1300);
  });
  it('running out of cash brings an emergency loan that costs value', () => {
    let s = freshSave('T', 1);
    s = { ...s, cash: 100, holdings: [pin({ id: 'x', label: 'x', start: 1, years: 1, amount: -10000 }, 1)] };
    const y = previewYear(s, 1);
    expect(y.rescue).toBeDefined();
    const after = closeYear(s, 1).save;
    expect(after.cash).toBeGreaterThanOrEqual(0);
    expect(after.value).toBeLessThan(s.value);
    expect(after.holdings.some((h) => h.id === 'rescue-1')).toBe(true);
  });
  it('risky lines are drawn once per save and year, within the spread', () => {
    let s = freshSave('T', 12345);
    s = { ...s, holdings: [pin({ id: 'r', label: 'r', start: 1, years: 5, amount: 1000, spread: 0.3 }, 1)] };
    const a = previewYear(s, 1).lines[0].actual;
    expect(previewYear(s, 1).lines[0].actual).toBe(a);
    expect(a).toBeGreaterThanOrEqual(700);
    expect(a).toBeLessThanOrEqual(1300);
  });
  it('old saves get holdings from the episodes they have played', () => {
    const old = { ...freshSave(), sessions: { a1s4: { at: 1, score: 1, max: 1 } } } as Record<string, unknown>;
    delete old.holdings;
    const save = migrate(old, seedHoldings);
    expect(save.holdings.map((h) => h.id)).toContain('bank-loan');
  });
});
