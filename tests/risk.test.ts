// Risk and return solvers, checked against the slides, the Statistics Recap and the Ch7–8 problem set.
import * as fin from '../src/engine/finance';

const near = (a: number, b: number, dp = 4) => expect(a).toBeCloseTo(b, dp);

describe('returns', () => {
  it('Ch7 P1: Syldavia index 21,000 → 25,500 with a 4.2% dividend yield = 25.63%', () => {
    const r = fin.holdingReturn(21000, 25500, 0.042 * 21000);
    near(r * 100, 25.6286, 3);
    near((r - 0.06) * 100, 19.6286, 3); // premium
    near(fin.realRate(r, 0.08) * 100, 16.3228, 3);
  });
  it('Ch7 P2: Ruritania’s 12% with 2% inflation beats Costaguana’s 95% with 80%', () => {
    near(fin.realRate(0.95, 0.8) * 100, 8.3333, 3);
    near(fin.realRate(0.12, 0.02) * 100, 9.8039, 3);
  });
});

describe('spread of returns', () => {
  it('Recap Ex 1: 10, −5, 15, 20, 10 → mean 10, variance 70, SD 8.37', () => {
    const xs = [10, -5, 15, 20, 10];
    near(fin.mean(xs), 10);
    near(fin.variance(xs), 70);
    near(fin.stdDev(xs), 8.3666, 3);
  });
  it('Recap Ex 2: boom/normal/recession → E 10, variance 135, SD 11.62', () => {
    const ps = [0.3, 0.4, 0.3];
    const rs = [25, 10, -5];
    near(fin.expectedReturn(ps, rs), 10);
    near(fin.varianceFromProbs(ps, rs), 135);
    near(Math.sqrt(fin.varianceFromProbs(ps, rs)), 11.619, 3);
  });
  it('slides: first coin game E 10, variance 450, SD 21.2; second game variance 1800', () => {
    const ps = [0.25, 0.25, 0.25, 0.25];
    near(fin.varianceFromProbs(ps, [40, 10, 10, -20]), 450);
    near(fin.expectedReturn(ps, [70, 10, 10, -50]), 10);
    near(fin.varianceFromProbs(ps, [70, 10, 10, -50]), 1800);
  });
});

describe('co-movement', () => {
  it('Recap Ex 3: σX 8, σY 6, Cov 28.8, correlation 0.6', () => {
    const x = [14, 22, 6, -2, 10];
    const y = [17, 11, -1, 5, 8];
    near(fin.stdDev(x), 8);
    near(fin.stdDev(y), 6);
    near(fin.covariance(x, y), 28.8);
    near(fin.correlation(x, y), 0.6);
  });
  it('Cov(A, A) = Var(A)', () => near(fin.covariance([1, 5, 9], [1, 5, 9]), fin.variance([1, 5, 9])));
});

describe('portfolios', () => {
  it('slides: 60/40 of two SD-20 stocks: ρ=1 → 20', () => near(fin.portfolioSd(0.6, 20, 20, 1), 20));
  it('slides: the same at ρ = 0.5, 0, −1', () => {
    near(fin.portfolioSd(0.6, 20, 20, 0.5), 17.4356, 3);
    near(fin.portfolioSd(0.6, 20, 20, 0), 14.4222, 3);
    near(fin.portfolioSd(0.6, 20, 20, -1), 4, 3);
  });
  it('Ch7 P19: 60% in SD 10, 40% in SD 20: ρ 1 → 14, 0.5 → 12.17, 0 → 10', () => {
    near(fin.portfolioSd(0.6, 10, 20, 1), 14);
    near(fin.portfolioSd(0.6, 10, 20, 0.5), 12.1655, 3);
    near(fin.portfolioSd(0.6, 10, 20, 0), 10, 3);
  });
  it('Ch7 P24: E 17%; SD 18.08 at ρ 0.5, 14.88 at 0, 10.76 at −0.5', () => {
    near(fin.portfolioReturn(0.6, 15, 20), 17);
    near(fin.portfolioSd(0.6, 20, 22, 0.5), 18.0843, 3);
    near(fin.portfolioSd(0.6, 20, 22, 0), 14.8808, 3);
    near(fin.portfolioSd(0.6, 20, 22, -0.5), 10.7629, 3);
  });
  it('Ch7 P21: A, D and G are the inefficient portfolios', () => {
    const pts = [[10, 23], [12.5, 21], [15, 25], [16, 29], [17, 29], [18, 32], [18, 35], [20, 45]].map(([r, sd]) => ({ r, sd }));
    expect(fin.efficientFlags(pts)).toEqual([false, true, true, false, true, true, false, true]);
  });
});

describe('beta and CAPM', () => {
  it('Ch8 P1: betas 0.5, 2, 0.8, 0, −1 from returns at −10% and +10% market', () => {
    const m = [-10, 10];
    near(fin.beta([-5, 5], m), 0.5);
    near(fin.beta([-20, 20], m), 2);
    near(fin.beta([-8, 8], m), 0.8);
    near(fin.beta([5, 5], m), 0);
    near(fin.beta([10, -10], m), -1);
  });
  it('Ch8 P3: five stocks at 1.2 and five at 1.4 → portfolio beta 1.3', () => {
    near(fin.weightedAverage(Array(10).fill(0.1), [1.2, 1.2, 1.2, 1.2, 1.2, 1.4, 1.4, 1.4, 1.4, 1.4]), 1.3);
  });
  it('Ch8 P9: rf 4%, rm 12%: premium 8%; β 1.5 → 16%; β 0.8 needs 10.4% (9.8% is negative NPV); 11.2% → β 0.9', () => {
    near(fin.capm(4, 1.5, 12), 16);
    near(fin.capm(4, 0.8, 12), 10.4);
    near(fin.impliedBeta(4, 11.2, 12), 0.9);
  });
  it('slides: market 10% (SD 15), rf 5%: SD 10 → 2/3 in market; return 15 → 200% in market', () => {
    near(fin.marketWeightForSd(10, 15), 2 / 3);
    near(fin.marketWeightForReturn(15, 5, 10), 2);
  });
});
