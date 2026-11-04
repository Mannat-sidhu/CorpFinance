// Pure time-value-of-money functions. Every number the player sees comes from here.
// Rates are decimals (0.06 = 6%). Notation follows the lecture slides: C, r, g, T.

/** Discount factor for a cash flow T periods away: 1 / (1 + r)^T */
export const discountFactor = (r: number, T: number) => 1 / Math.pow(1 + r, T);

/** Value today of a single cash flow C received at year T. */
export const pvSingle = (C: number, r: number, T: number) => C * discountFactor(r, T);

/** Value at year T of C invested today. */
export const fvSingle = (C: number, r: number, T: number) => C * Math.pow(1 + r, T);

/** NPV of a cash-flow list where flows[t] arrives at year t (flows[0] is today). */
export const npv = (r: number, flows: number[]) => flows.reduce((sum, cf, t) => sum + pvSingle(cf, r, t), 0);

/** Level perpetuity, first payment one period from now: C / r */
export const perpetuity = (C: number, r: number) => C / r;

/** Growing perpetuity, first payment C one period from now: C / (r − g) */
export const growingPerpetuity = (C: number, r: number, g: number) => {
  if (r <= g) throw new Error('Growing perpetuity needs r > g');
  return C / (r - g);
};

/** Present value annuity factor: (1/r)(1 − 1/(1 + r)^T) */
export const annuityFactor = (r: number, T: number) => (1 / r) * (1 - discountFactor(r, T));

/** Level annuity, T payments, first one period from now. */
export const annuity = (C: number, r: number, T: number) => C * annuityFactor(r, T);

/** Annuity due: T payments, first one today. Level annuity × (1 + r). */
export const annuityDue = (C: number, r: number, T: number) => annuity(C, r, T) * (1 + r);

/** Growing annuity, T payments, first payment C one period from now. */
export const growingAnnuity = (C: number, r: number, g: number, T: number) =>
  (C / (r - g)) * (1 - Math.pow((1 + g) / (1 + r), T));

/**
 * Level perpetuity whose first payment arrives at year `firstYear`.
 * The perpetuity formula values it at year (firstYear − 1); discount that back to today.
 */
export const delayedPerpetuity = (C: number, r: number, firstYear: number) =>
  pvSingle(perpetuity(C, r), r, firstYear - 1);

/** Payment on an amortising loan: the C that makes the annuity's PV equal the amount borrowed. */
export const loanPayment = (principal: number, r: number, T: number) => principal / annuityFactor(r, T);

/** Balance outstanding after k payments = PV of the (T − k) payments still to come. */
export const loanBalance = (principal: number, r: number, T: number, k: number) =>
  annuity(loanPayment(principal, r, T), r, T - k);

/** Fraction of the original loan repaid after k payments. */
export const fractionRepaid = (principal: number, r: number, T: number, k: number) =>
  (principal - loanBalance(principal, r, T, k)) / principal;

/** Share of payment number k (1-based) that is interest: r × balance before it ÷ payment. */
export const interestShare = (principal: number, r: number, T: number, k: number) =>
  (r * loanBalance(principal, r, T, k - 1)) / loanPayment(principal, r, T);

/** Effective annual rate from an APR compounded m times a year. */
export const ear = (apr: number, m: number) => Math.pow(1 + apr / m, m) - 1;

/** Bond price: coupon annuity plus discounted face value. */
export const bondPrice = (C: number, r: number, T: number, F: number) => annuity(C, r, T) + pvSingle(F, r, T);

/** Real rate from nominal rate and inflation (Fisher). */
export const realRate = (nominal: number, inflation: number) => (1 + nominal) / (1 + inflation) - 1;

/** Full amortisation schedule, one row per payment. */
export function amortisationTable(principal: number, r: number, T: number) {
  const pmt = loanPayment(principal, r, T);
  const rows: { year: number; opening: number; interest: number; repaid: number; closing: number }[] = [];
  let balance = principal;
  for (let year = 1; year <= T; year++) {
    const interest = balance * r;
    const repaid = pmt - interest;
    rows.push({ year, opening: balance, interest, repaid, closing: balance - repaid });
    balance -= repaid;
  }
  return { payment: pmt, rows };
}

/** Rate (decimal) that makes `pv(rate)` equal `target`, by bisection. Used to set and test YTM/IRR answers. */
export function solveRate(pv: (r: number) => number, target: number, lo = -0.5, hi = 1) {
  let a = lo;
  let b = hi;
  const f = (r: number) => pv(r) - target;
  for (let i = 0; i < 200; i++) {
    const m = (a + b) / 2;
    if (Math.sign(f(m)) === Math.sign(f(a))) a = m;
    else b = m;
  }
  return (a + b) / 2;
}

/** Bond price with `m` coupons a year: coupon rate and yield are annual, quoted as APRs. */
export const bondPriceM = (face: number, couponRate: number, ytm: number, years: number, m: number) =>
  bondPrice((face * couponRate) / m, ytm / m, years * m, face);

/**
 * Two-stage dividends: D1 grows at g up to year `last`, then stays flat forever.
 * Value = growing annuity of the first `last` dividends + (D_last / r) discounted from year `last`.
 */
export function twoStage(D1: number, r: number, g: number, last: number) {
  const Dlast = D1 * Math.pow(1 + g, last - 1);
  return growingAnnuity(D1, r, g, last) + pvSingle(Dlast / r, r, last);
}

/** Payback period in years, assuming cash arrives evenly within each year. Infinity if never repaid. */
export function paybackYears(flows: number[]) {
  let cum = flows[0];
  for (let t = 1; t < flows.length; t++) {
    if (flows[t] > 0 && cum + flows[t] >= 0) return t - 1 + -cum / flows[t];
    cum += flows[t];
  }
  return Infinity;
}

/** IRR (decimal) of a cash-flow list, by bisection between −50% and 100%. */
export const irr = (flows: number[], lo = -0.5, hi = 1) => solveRate((r) => npv(r, flows), 0, lo, hi);

// ---------------------------------------------------------------- risk and return (all in decimals unless a name says otherwise)

/** Holding-period return: capital gain plus dividend yield. */
export const holdingReturn = (p0: number, p1: number, income = 0) => (p1 - p0 + income) / p0;

export const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

/** Variance of realised returns: the average squared distance from the mean (weight 1/n each). */
export const variance = (xs: number[]) => {
  const m = mean(xs);
  return xs.reduce((s, x) => s + (x - m) ** 2, 0) / xs.length;
};
export const stdDev = (xs: number[]) => Math.sqrt(variance(xs));

export const covariance = (xs: number[], ys: number[]) => {
  const mx = mean(xs);
  const my = mean(ys);
  return xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) / xs.length;
};
export const correlation = (xs: number[], ys: number[]) => covariance(xs, ys) / (stdDev(xs) * stdDev(ys));

/** Expected return from probabilities: a probability-weighted average. */
export const expectedReturn = (ps: number[], rs: number[]) => ps.reduce((s, p, i) => s + p * rs[i], 0);
export const varianceFromProbs = (ps: number[], rs: number[]) => {
  const e = expectedReturn(ps, rs);
  return ps.reduce((s, p, i) => s + p * (rs[i] - e) ** 2, 0);
};
export const covarianceFromProbs = (ps: number[], xs: number[], ys: number[]) => {
  const ex = expectedReturn(ps, xs);
  const ey = expectedReturn(ps, ys);
  return ps.reduce((s, p, i) => s + p * (xs[i] - ex) * (ys[i] - ey), 0);
};

/** Two-asset portfolio: `w` in the first asset, the rest in the second. */
export const portfolioReturn = (w: number, r1: number, r2: number) => w * r1 + (1 - w) * r2;
export const portfolioVariance = (w: number, s1: number, s2: number, rho: number) =>
  w * w * s1 * s1 + (1 - w) * (1 - w) * s2 * s2 + 2 * w * (1 - w) * rho * s1 * s2;
export const portfolioSd = (w: number, s1: number, s2: number, rho: number) => Math.sqrt(portfolioVariance(w, s1, s2, rho));

/** Beta: the slope of a stock's returns on the market's, Cov(R_i, R_m) ÷ Var(R_m). */
export const beta = (stock: number[], market: number[]) => covariance(stock, market) / variance(market);
export const weightedAverage = (ws: number[], xs: number[]) => ws.reduce((s, w, i) => s + w * xs[i], 0);

/** CAPM: the return investors require for bearing market risk. */
export const capm = (rf: number, b: number, rm: number) => rf + b * (rm - rf);
/** The beta a given expected return implies. */
export const impliedBeta = (rf: number, r: number, rm: number) => (r - rf) / (rm - rf);

/** Share of the pot in the market portfolio (the rest in the risk-free asset) for a target SD, or a target return. */
export const marketWeightForSd = (target: number, sdMarket: number) => target / sdMarket;
export const marketWeightForReturn = (target: number, rf: number, rm: number) => (target - rf) / (rm - rf);

/** A portfolio is efficient if no other has at-most-equal risk and at-least-equal return (with one strictly better). */
export function efficientFlags(points: { r: number; sd: number }[]): boolean[] {
  return points.map((a) => !points.some((b) => b !== a && b.sd <= a.sd && b.r >= a.r && (b.sd < a.sd || b.r > a.r)));
}
