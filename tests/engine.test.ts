import { PROBLEMS } from '../src/content';
import { markAnswer, markInputs, normalise, withinTolerance } from '../src/engine/grading';
import { isDue, pickSpotCheck, recordAttempt, recordSpotCheck, separateSittings } from '../src/engine/mastery';
import { freshSave } from '../src/engine/save';
import type { CalcProblem } from '../src/engine/types';

describe('tolerance', () => {
  it('accepts ±0.5% on euro answers', () => {
    expect(withinTolerance(107600, 107162.53, 'eur')).toBe(true);
    expect(withinTolerance(108000, 107162.53, 'eur')).toBe(false);
  });
  it('accepts the nearest whole euro on small answers', () => expect(withinTolerance(93, 92.64, 'eur')).toBe(true));
  it('reads 0.06 or 6 as 6%', () => {
    expect(normalise(0.06, 'pct', 6)).toBeCloseTo(6);
    expect(normalise(6, 'pct', 6)).toBe(6);
  });
});

describe('error carried forward', () => {
  const lease = PROBLEMS['studio-lease'] as CalcProblem;
  const inst = lease.build(lease.base);
  it('wrong inputs, but answer computed correctly from them, earns the answer mark', () => {
    // Classic slip: treating it as an ordinary annuity is a formula error; here she types r = 5% by mistake.
    const inputs = { C: 24000, r: 5, T: 5 };
    expect(markInputs(inst.inputs, inputs, false).correct).toBe(false);
    const own = inst.solve(inputs);
    const res = markAnswer(inst, own, inputs, false);
    expect(res.ecf).toBe(true);
    expect(res.score).toBe(2);
  });
  it('a wrong answer that does not follow from her inputs scores 0', () => {
    const res = markAnswer(inst, 90000, { C: 24000, r: 6, T: 5 }, false);
    expect(res.score).toBe(0);
  });
  it('a hint halves the mark', () => {
    const res = markAnswer(inst, 107162.53, null, true);
    expect(res.score).toBe(1);
  });
  it('costs typed as negatives are accepted', () => {
    const cutter = PROBLEMS['laser-cutter'] as CalcProblem;
    const i = cutter.build(cutter.base);
    expect(markInputs(i.inputs, { C0: -23000, C: 9000, r: 4, T: 3 }, false).correct).toBe(true);
  });
});

describe('mastery', () => {
  const t0 = new Date('2026-11-01T09:00:00').getTime();
  const h = 3_600_000;
  it('two clean answers in the same sitting do not promote', () => {
    let s = freshSave();
    s = recordAttempt(s, 'npv', true, t0).save;
    const r = recordAttempt(s, 'npv', true, t0 + h);
    expect(r.promotedTo).toBeNull();
  });
  it('two clean answers 6+ hours apart promote New → Practising → Common', () => {
    let s = freshSave();
    s = recordAttempt(s, 'npv', true, t0).save;
    let r = recordAttempt(s, 'npv', true, t0 + 7 * h);
    expect(r.promotedTo).toBe('practising');
    r = recordAttempt(r.save, 'npv', true, t0 + 30 * h);
    r = recordAttempt(r.save, 'npv', true, t0 + 50 * h);
    expect(r.promotedTo).toBe('common');
  });
  it('separate days count even if under 6 hours apart', () =>
    expect(separateSittings(new Date('2026-11-01T23:00').getTime(), new Date('2026-11-02T01:00').getTime())).toBe(true));
  it('a missed spot check drops the concept back to Practising', () => {
    let s = freshSave();
    s.mastery.npv = { stage: 'common', wins: [], checkLevel: 0, dueAt: t0, dueAfterSession: null, attempts: 4, cleanAttempts: 4, lapses: 0, lastSeen: t0 };
    expect(isDue(s, 'npv', t0 + 1)).toBe(true);
    expect(pickSpotCheck(s, ['npv'], [], t0 + 1)).toBe('npv');
    s = recordSpotCheck(s, 'npv', false, t0 + 1);
    expect(s.mastery.npv.stage).toBe('practising');
  });
  it('a passed spot check schedules the next, further out', () => {
    let s = freshSave();
    s.mastery.npv = { stage: 'common', wins: [], checkLevel: 0, dueAt: t0, dueAfterSession: null, attempts: 4, cleanAttempts: 4, lapses: 0, lastSeen: t0 };
    s = recordSpotCheck(s, 'npv', true, t0);
    const first = s.mastery.npv.dueAt! - t0;
    s = recordSpotCheck(s, 'npv', true, t0);
    expect(s.mastery.npv.dueAt! - t0).toBeGreaterThan(first);
  });
});
