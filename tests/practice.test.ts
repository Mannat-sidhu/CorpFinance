// Extra practice scenarios, the notebook, and episode gating.
import { ALL_CONCEPT_IDS, CONCEPTS, PROBLEMS, problemsFor } from '../src/content';
import { EXTRA_PROBLEMS } from '../src/content/practice-extra';
import { expectedValues } from '../src/engine/grading';
import { mulberry32 } from '../src/engine/rng';
import { CLEAR_AT, freshSave, isCleared } from '../src/engine/save';
import { addSlips, fixConcept, openSlips, slipConcepts, slipPattern, type NewSlip } from '../src/engine/slips';
import type { CalcProblem } from '../src/engine/types';

const answerOf = (id: string) => {
  const p = PROBLEMS[id] as CalcProblem;
  const inst = p.build(p.base);
  return inst.solve(expectedValues(inst.inputs));
};
const near = (a: number, b: number, dp = 2) => expect(a).toBeCloseTo(b, dp);

describe('extra practice scenarios: numbers match an independent calculation', () => {
  it('freehold 12,000 at 6% = 200,000', () => near(answerOf('freehold-rent'), 200000, 1));
  it('licence 20,000 growing 2% at 7% = 400,000', () => near(answerOf('inflation-licence'), 400000, 1));
  it('trust: 15,000 just paid, 3% growth, 8% = 309,000', () => near(answerOf('trust-income'), 309000, 1));
  it('naming rights from year 4 = 251,885.78', () => near(answerOf('naming-rights'), 251885.78, 1));
  it('stand fund = 32,908.10', () => near(answerOf('fair-fund'), 32908.1, 1));
  it('deposit grows to 32,556.50', () => near(answerOf('deposit-target'), 32556.5, 1));
  it('equipment loan payment = 14,781.36', () => near(answerOf('equipment-loan'), 14781.36, 1));
  it('balance after 4 of 10 payments = 66,810.68', () => near(answerOf('early-payoff'), 66810.68, 1));
  it('interest in payment 3 of 8 = 33.37%', () => near(answerOf('interest-bite'), 33.3658, 2));
  it('retail bond = 915.75', () => near(answerOf('retail-bond'), 915.75, 1));
  it('60 bonds = 54,792.26', () => near(answerOf('bond-holding-value'), 54792.26, 1));
  it('g = 14% × 0.4 = 5.6%', () => near(answerOf('retention-plan'), 5.6, 2));
  it('two-phase boutique = 15.88', () => near(answerOf('two-phase-boutique'), 15.8846, 2));
  it('shopfit IRR = 21.92%', () => near(answerOf('shopfit-irr'), 21.92, 1));
  it('tax shield PV = 56,861.80', () => near(answerOf('tax-shield-pv'), 56861.8, 1));
  it('after-tax salvage = 34,500', () => near(answerOf('scrap-the-press'), 34500, 1));
});

describe('extra scenarios are real decisions, not fixed answers', () => {
  // The ARR scenario teaches a fixed lesson (book returns can't decide), so its answer is always the same by design.
  for (const p of EXTRA_PROBLEMS.filter((x) => x.id !== 'fit-out-book')) {
    it(`${p.id}: both calls come up across variations`, () => {
      const rng = mulberry32(99);
      const calls = new Set<string>();
      for (let i = 0; i < 200; i++) calls.add(p.build(p.vary(rng)).decision.correct);
      expect([...calls].sort()).toEqual(['no', 'yes']);
    });
  }
});

describe('practice depth', () => {
  it('every numerical idea that had one problem now has at least two', () => {
    const ideas = ['perpetuity', 'growing-perpetuity', 'delayed-perpetuity', 'pv-fv', 'loan-payment', 'loan-balance', 'interest-share', 'bond-price', 'payout-plowback', 'multi-stage', 'arr', 'irr', 'depreciation-tax', 'salvage'];
    for (const id of ideas) expect(problemsFor(id).length, id).toBeGreaterThanOrEqual(2);
  });
  it('every idea has something to practise', () => {
    for (const id of ALL_CONCEPT_IDS) expect(problemsFor(id).length, `${CONCEPTS[id].name}`).toBeGreaterThan(0);
  });
});

describe('the notebook', () => {
  const slip = (over: Partial<NewSlip> = {}): NewSlip => ({ concept: 'npv', problem: 'laser-cutter', title: 'The laser cutter', step: 'inputs', what: 'Rate should be 4%', fix: 'Use the discount rate.', ...over });
  it('counts a repeat of the same slip once, with a tally', () => {
    const list = addSlips(addSlips([], [slip()], 1), [slip()], 2);
    expect(list).toHaveLength(1);
    expect(list[0].n).toBe(2);
  });
  it('a clean answer on the idea fixes its slips, and only its slips', () => {
    let list = addSlips([], [slip(), slip({ concept: 'annuity', what: 'x' })], 1);
    list = fixConcept(list, 'npv');
    expect(openSlips(list).map((s) => s.concept)).toEqual(['annuity']);
  });
  it('a fixed slip reopens if it happens again', () => {
    const fixed = fixConcept(addSlips([], [slip()], 1), 'npv');
    expect(openSlips(addSlips(fixed, [slip()], 2))).toHaveLength(1);
  });
  it('shows where marks go, and which ideas cost the most', () => {
    const list = addSlips([], [slip(), slip({ what: 'b' }), slip({ step: 'formula', what: 'c' }), slip({ concept: 'annuity', what: 'd' })], 1);
    expect(slipPattern(list)[0]).toEqual({ step: 'inputs', n: 3 });
    expect(slipConcepts(list)[0]).toEqual({ concept: 'npv', n: 3 });
  });
  it('stays bounded', () => {
    const many = Array.from({ length: 400 }, (_, i) => slip({ what: `w${i}` }));
    expect(addSlips([], many, 1).length).toBeLessThanOrEqual(150);
  });
});

describe('gating on understanding', () => {
  it('old records (no flag) count as cleared; an explicit false does not', () => {
    expect(isCleared({ at: 1, score: 1, max: 10 })).toBe(true);
    expect(isCleared({ at: 1, score: 1, max: 10, cleared: false })).toBe(false);
    expect(isCleared(undefined)).toBe(false);
  });
  it('the bar is 70%', () => expect(CLEAR_AT).toBe(0.7));
  it('a fresh save starts with an empty notebook', () => expect(freshSave().slips).toEqual([]));
});
