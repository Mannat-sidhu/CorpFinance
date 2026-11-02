import { ACTS, PROBLEMS } from '../src/content';
import * as f from '../src/engine/finance';
import { expectedValues, markWorksheet } from '../src/engine/grading';
import { mulberry32 } from '../src/engine/rng';
import type { CalcProblem, WorksheetProblem } from '../src/engine/types';

const answerOf = (id: string, params?: unknown) => {
  const p = PROBLEMS[id] as CalcProblem;
  const inst = p.build(params ?? p.base);
  return inst.solve(expectedValues(inst.inputs));
};
const near = (a: number, e: number, dp = 2) => expect(a).toBeCloseTo(e, dp);

describe('Chapter IV against the Ch5–6 problem set and slides', () => {
  it('P1: NPVs at 10% are A −1,010.52, B +3,378, C +2,405; paybacks 3, 2, 3', () => {
    near(f.npv(0.1, [-5000, 1000, 1000, 3000, 0]), -1010.52, 1);
    near(f.npv(0.1, [-1000, 0, 1000, 2000, 3000]), 3378.1, 0);
    near(f.npv(0.1, [-5000, 1000, 1000, 3000, 5000]), 2404.55, 1);
    expect(f.paybackYears([-5000, 1000, 1000, 3000, 0])).toBe(3);
    expect(f.paybackYears([-1000, 0, 1000, 2000, 3000])).toBe(2);
  });
  it('Theo’s scarves (P1 project A × 10): NPV −10,105.18 despite a 3-year payback', () => near(answerOf('theo-scarves'), -10105.18, 1));
  it('slides ARR: 14%', () => near(answerOf('arr-spiral'), 14));
  it('slides IRR: −100, 50, 50, 50 → 23.38%', () => near(answerOf('irr-basic'), 23.38));
  it('slides multiple IRRs: 3.50% and 19.54%', () => {
    const flows = [-30, ...Array(9).fill(10), -65];
    near(f.solveRate((r) => f.npv(r, flows), 0, 0, 0.1) * 100, 3.5, 1);
    near(f.solveRate((r) => f.npv(r, flows), 0, 0.1, 0.5) * 100, 19.54, 1);
  });
  it('restoration lease: NPV at 10% ≈ €2,532', () => near(answerOf('multiple-irr'), 2532, -1));
  it('P10: incremental IRR 10%, so Alpha at 8%', () => {
    near(answerOf('incremental-irr'), 10, 3);
    const p = PROBLEMS['incremental-irr'] as CalcProblem;
    expect(p.build(p.base).decision.correct).toBe('big');
    expect(p.build({ ...p.base, r: 12 }).decision.correct).toBe('small');
  });
  it('P12 has the same incremental flows: 10%', () =>
    near(answerOf('incremental-irr', { big: [-400000, 250000, 300000], small: [-200000, 140000, 179000], r: 9 }), 10, 3));
  it('P15 make-or-buy: NPV ≈ +€255,400 with working capital', () => near(answerOf('make-or-buy'), 255401, -1));
  it('capital rationing: buttons + scarves (€110,000) beat the workshop (€90,000)', () => {
    near(answerOf('capital-rationing'), 110000);
    const p = PROBLEMS['capital-rationing'] as CalcProblem;
    expect(p.build(p.base).decision.correct).toBe('bc');
  });
});

describe('P14 Better Mousetrap worksheet', () => {
  const ws = PROBLEMS['handbag-worksheet'] as WorksheetProblem;
  const inst = ws.build(ws.base);
  const truth = markWorksheet(inst.rows, inst.years, {}).truth;
  it('net cash flows: −6.2, 1.385, 1.49, 2.55, 2.71, 2.265 (€m)', () => {
    [-6.2, 1.385, 1.49, 2.55, 2.71, 2.265].forEach((v, i) => near(truth.net[i], v, 6));
  });
  it('NPV at 12% ≈ +€1.047m', () => near(f.npv(0.12, truth.net), 1.047, 3));
  it('a wrong depreciation row carries forward: later rows built from it still score', () => {
    const typed: Record<string, (number | null)[]> = {};
    const wrongDep = [0, -1, -1, -1, -1, -1];
    typed.dep = wrongDep;
    const own: Record<string, number[]> = { sales: truth.sales, costs: truth.costs, dep: wrongDep };
    for (const row of inst.rows.slice(3)) {
      own[row.key] = row.calc(own);
      typed[row.key] = own[row.key];
    }
    const m = markWorksheet(inst.rows, inst.years, typed);
    expect(m.result.dep.rowOk).toBe(false);
    expect(m.result.tax.rowOk && m.result.tax.ecf).toBe(true);
    expect(m.result.net.rowOk).toBe(true);
  });
  it('200 random worksheets build cleanly', () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 200; i++) {
      const w = ws.build(ws.vary(rng));
      const t = markWorksheet(w.rows, w.years, {}).truth;
      expect(t.net.every(Number.isFinite)).toBe(true);
      expect(w.decision.options.map((o) => o.id)).toContain(w.decision.correct);
      for (const o of w.decision.options) expect(w.outcomes[o.id]).toBeDefined();
    }
  });
});

describe('2022 paper Q4: Projects X and Y at 12%', () => {
  const boss = ACTS[3].boss!;
  const run = (i: number) => {
    const p = PROBLEMS[boss.problems[i].problem] as CalcProblem;
    const inst = p.build(boss.problems[i].params ?? p.base);
    return { inst, v: inst.solve(expectedValues(inst.inputs)) };
  };
  it('payback Y = 1.76 years (X = 2.22)', () => {
    near(run(0).v, 1.76);
    near(f.paybackYears([-21000, 5500, 9000, 30200, -580]), 2.215, 2);
  });
  it('NPV X ≈ 12,212.6 and NPV Y ≈ 2,150.4', () => {
    near(run(1).v, 12212.6, 0);
    near(run(2).v, 2150.4, 0);
  });
  it('capital rationing: PI X 0.58 beats PI Y 0.17', () => {
    near(run(3).v, 0.58, 2);
    expect(run(3).inst.decision.correct).toBe('x');
  });
});
