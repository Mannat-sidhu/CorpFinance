// Exam rooms: paper-style questions after each boss. Plain prose, extra data, two or more ideas
// combined, and no formula named. They play unguided. Story outcomes are zero: these are practice.
import * as fin from '../engine/finance';
import { eur, pct } from '../engine/format';
import { pickInt, pickOne, pickRate } from '../engine/rng';
import type { DecisionSpec, ExamRoom, Outcome, Problem } from '../engine/types';
import { dec, defineCalc, onePlus, range, rd, roundTo, w0, w2, w4 } from './helpers';

const word = (n: number) => ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'][n] ?? String(n);
const freq = (m: number) => (m === 12 ? 'monthly' : m === 4 ? 'quarterly' : m === 2 ? 'semi-annually' : `${m} times a year`);
const none = (ids: string[], news: string): Record<string, Outcome> => Object.fromEntries(ids.map((k) => [k, { valueDelta: 0, news }]));

/** "Take the offer or keep the stream?" Shared by questions where a lump sum is set against a PV. */
function lumpDecision(pv: number, lump: number, keepLabel: string, takeLabel: string): DecisionSpec {
  const take = lump > pv;
  return {
    question: `${takeLabel} or ${keepLabel.toLowerCase()}?`,
    options: [
      { id: 'take', label: takeLabel },
      { id: 'keep', label: keepLabel },
    ],
    correct: take ? 'take' : 'keep',
    why: [
      { id: 'more', label: 'The lump sum is worth more than the present value of the stream' },
      { id: 'less', label: 'The lump sum is worth less than the present value of the stream' },
      { id: 'total', label: 'Compare the lump sum with the total of all the payments' },
    ],
    correctWhy: take ? 'more' : 'less',
    explain: `PV ${eur(pv, 2)} v. ${eur(lump)}. Adding up undiscounted payments ignores when they arrive.`,
  };
}

// ---------------------------------------------------------------- Chapter I

export const examDeferredLicence = defineCalc({
  kind: 'calc',
  id: 'exam-deferred-licence',
  title: 'A deferred licence fee',
  host: 'narrator',
  concept: 'apr-ear',
  uses: ['annuity', 'pv-fv'],
  base: { C: 12000, T: 5, first: 4, apr: 6, m: 12, lump: 41000 },
  vary: (rng) => {
    const C = pickInt(rng, 6000, 20000, 500);
    const T = pickInt(rng, 3, 8);
    const first = pickInt(rng, 2, 5);
    const apr = pickRate(rng, 3, 9, 0.5);
    const m = pickOne(rng, [4, 12]);
    const r = fin.ear(apr / 100, m);
    const pv = fin.annuity(C, r, T) * fin.discountFactor(r, first - 1);
    return { C, T, first, apr, m, lump: roundTo(pv * pickOne(rng, [0.9, 0.95, 1.05, 1.1]), 500) };
  },
  build: ({ C, T, first, apr, m, lump }) => {
    const r = fin.ear(apr / 100, m) * 100;
    const D = first - 1;
    const atD = fin.annuity(C, r / 100, T);
    const pv = atD * fin.discountFactor(r / 100, D);
    const last = first + T - 1;
    return {
      prompt: [
        `A licensee will pay the house ${eur(C)} a year for ${word(T)} years for the right to use one of its prints. The first payment is due at the end of year ${first}. The licensee’s own sales are about ${eur(C * 30)} a year.`,
        `The house’s bank quotes it ${pct(apr)} a year, compounded ${freq(m)}, and that is the right rate to discount at. Inflation is expected to run at 2% a year. The licensee offers ${eur(lump)} today instead of the annual fees.`,
      ],
      ask: 'What are the licence fees worth today? Should the house take the lump sum?',
      timeline: {
        unit: 'year',
        show: last + 1,
        streams: [{ id: 'fee', label: `Licence fee (${eur(C)})`, periods: range(first, last), direction: 'in' }],
        explain: `Fees at the end of years ${first} to ${last}: ${T} payments, with nothing in years 1 to ${D}.`,
      },
      formula: {
        options: ['annuity', 'delayed-perpetuity', 'annuity-due', 'ear'],
        correct: 'annuity',
        explain: `A level annuity, valued at year ${D}, then discounted ${D} years to today. The rate must be the effective annual rate, because the payments are annual.`,
      },
      inputs: [
        { key: 'C', symbol: 'C', label: 'Annual fee', unit: 'eur', expected: C, explain: 'The fee each year.' },
        { key: 'r', symbol: 'r_{EAR}', label: 'Annual discount rate', unit: 'pct', expected: r, explain: `(1 + ${rd(apr)} ÷ ${m})^${m} − 1 = ${pct(r, 4)}. The quoted rate is an APR, not an annual rate.` },
        { key: 'T', symbol: 'T', label: 'Number of payments', unit: 'count', expected: T, explain: `${T}.` },
        { key: 'D', symbol: 'D', label: 'Years to discount the annuity value back', unit: 'years', expected: D, explain: `The annuity formula values the fees one year before the first one: year ${D}.` },
      ],
      solve: (v) => fin.annuity(v.C, v.r / 100, v.T) * fin.discountFactor(v.r / 100, v.D),
      answer: { label: 'Present value of the fees', unit: 'eur', explain: `${eur(atD, 2)} at year ${D}, discounted to ${eur(pv, 2)}.` },
      decision: lumpDecision(pv, lump, 'Keep the annual fees', 'Take the lump sum'),
      working: [
        `r_{EAR} = \\left(1 + \\frac{${rd(apr)}}{${m}}\\right)^{${m}} - 1 = ${w4(r)}\\%`,
        `PV_{${D}} = \\frac{${w0(C)}}{${rd(r)}}\\left(1 - \\frac{1}{${onePlus(r)}^{${T}}}\\right) = ${w2(atD)}`,
        `PV_{0} = \\frac{${w2(atD)}}{${onePlus(r)}^{${D}}} = €${w2(pv)}`,
      ],
      hints: {
        timeline: 'Mark only the years with payments.',
        formula: 'Level payments, then a delay.',
        inputs: 'The rate is quoted, not effective.',
        answer: 'Annuity first, then discount it back.',
        decision: 'Compare like with like: today’s money.',
      },
      outcomes: none(['take', 'keep'], 'Exam room question.'),
      cfoLine: `Fees worth ${eur(pv, 2)} today.`,
    };
  },
});

export const examGrowingLater = defineCalc({
  kind: 'calc',
  id: 'exam-growing-later',
  title: 'Royalties that start later',
  host: 'narrator',
  concept: 'growing-annuity',
  uses: ['pv-fv'],
  base: { C: 15000, g: 3, r: 9, N: 10, first: 3, offer: 95000 },
  vary: (rng) => {
    const C = pickInt(rng, 5000, 30000, 1000);
    const g = pickRate(rng, 1, 5, 0.5);
    const r = pickRate(rng, g + 3, 13, 0.5);
    const N = pickInt(rng, 5, 15);
    const first = pickInt(rng, 2, 5);
    const pv = fin.growingAnnuity(C, r / 100, g / 100, N) * fin.discountFactor(r / 100, first - 1);
    return { C, g, r, N, first, offer: roundTo(pv * pickOne(rng, [0.9, 0.95, 1.05, 1.1]), 1000) };
  },
  build: ({ C, g, r, N, first, offer }) => {
    const D = first - 1;
    const atD = fin.growingAnnuity(C, r / 100, g / 100, N);
    const pv = atD * fin.discountFactor(r / 100, D);
    const last = first + N - 1;
    return {
      prompt: [
        `A franchise partner will pay the house royalties for ${N} years. The first royalty, ${eur(C)}, is paid at the end of year ${first}; each later one is ${pct(g)} bigger than the one before. The franchise’s target is to grow sales by 8% a year.`,
        `The house discounts at ${pct(r)} a year. Last year a different franchise paid it ${eur(C * 0.8)}. A fund offers ${eur(offer)} today for the rights to these royalties.`,
      ],
      ask: 'What are the royalties worth today? Should the house sell them to the fund?',
      timeline: {
        unit: 'year',
        show: last + 1,
        streams: [{ id: 'roy', label: `Royalty (from ${eur(C)}, growing ${pct(g)})`, periods: range(first, last), direction: 'in' }],
        explain: `${N} royalties, years ${first} to ${last}. Nothing in years 1 to ${D}.`,
      },
      formula: {
        options: ['growing-annuity', 'growing-perpetuity', 'annuity', 'delayed-perpetuity'],
        correct: 'growing-annuity',
        explain: `A growing annuity for a fixed number of payments, valued at year ${D} and discounted back.`,
      },
      inputs: [
        { key: 'C', symbol: 'C_{1}', label: 'First royalty', unit: 'eur', expected: C, explain: 'The first payment. Not last year’s figure from another franchise.' },
        { key: 'r', symbol: 'r', label: 'Discount rate', unit: 'pct', expected: r, explain: `${pct(r)}.` },
        { key: 'g', symbol: 'g', label: 'Growth of the royalty', unit: 'pct', expected: g, explain: 'The royalty’s own growth, not the sales target.' },
        { key: 'T', symbol: 'T', label: 'Number of payments', unit: 'count', expected: N, explain: `${N}.` },
        { key: 'D', symbol: 'D', label: 'Years to discount back', unit: 'years', expected: D, explain: `The formula values the stream at year ${D}, one year before the first payment.` },
      ],
      solve: (v) => fin.growingAnnuity(v.C, v.r / 100, v.g / 100, v.T) * fin.discountFactor(v.r / 100, v.D),
      answer: { label: 'Present value of the royalties', unit: 'eur', explain: `${eur(atD, 2)} at year ${D}, which is ${eur(pv, 2)} today.` },
      decision: lumpDecision(pv, offer, 'Keep the royalties', 'Sell to the fund'),
      working: [
        `PV_{${D}} = \\frac{${w0(C)}}{${rd(r)} - ${rd(g)}}\\left(1 - \\frac{${onePlus(g)}^{${N}}}{${onePlus(r)}^{${N}}}\\right) = ${w2(atD)}`,
        `PV_{0} = \\frac{${w2(atD)}}{${onePlus(r)}^{${D}}} = €${w2(pv)}`,
      ],
      hints: {
        timeline: 'When does the first royalty land?',
        formula: 'Growing, but it stops.',
        inputs: 'Two numbers in the brief are there to distract you.',
        answer: 'Value it a year before the first payment, then bring it back.',
        decision: 'Today’s value against today’s offer.',
      },
      outcomes: none(['take', 'keep'], 'Exam room question.'),
      cfoLine: `Royalties worth ${eur(pv, 2)} today.`,
    };
  },
});

export const examLeaseOrBuy = defineCalc({
  kind: 'calc',
  id: 'exam-lease-or-buy',
  title: 'Lease or buy the looms',
  host: 'narrator',
  concept: 'annuity-due',
  uses: ['annuity'],
  base: { L: 26000, T: 5, r: 7, buy: 120000, service: 4000 },
  vary: (rng) => {
    const L = pickInt(rng, 10000, 40000, 1000);
    const T = pickInt(rng, 3, 8);
    const r = pickRate(rng, 4, 10, 0.5);
    const pv = fin.annuityDue(L, r / 100, T);
    return { L, T, r, buy: roundTo(pv * pickOne(rng, [0.9, 0.95, 1.05, 1.1]), 1000), service: pickInt(rng, 2000, 6000, 500) };
  },
  build: ({ L, T, r, buy, service }) => {
    const pv = fin.annuityDue(L, r / 100, T);
    const ord = fin.annuity(L, r / 100, T);
    const lease = pv < buy;
    return {
      prompt: [
        `The house needs new looms for ${word(T)} years, after which they are worthless. It can buy them for ${eur(buy)}, or lease them for ${eur(L)} a year, with each payment due at the start of the year.`,
        `Either way the house pays ${eur(service)} a year to have them serviced. Its cost of capital is ${pct(r)}. The leasing company advertises an implied rate of ${pct(r - 1)}.`,
      ],
      ask: 'What is the present value of the lease payments? Lease or buy?',
      timeline: {
        unit: 'year',
        show: T,
        streams: [{ id: 'lease', label: `Lease payment (${eur(L)})`, periods: range(0, T - 1), direction: 'out' }],
        explain: `Payments at the start of each year: today (year 0) to year ${T - 1}.`,
      },
      formula: {
        options: ['annuity-due', 'annuity', 'loan-payment', 'perpetuity'],
        correct: 'annuity-due',
        explain: 'Payments at the start of each period: an annuity due, the ordinary annuity × (1 + r).',
      },
      inputs: [
        { key: 'C', symbol: 'C', label: 'Lease payment', unit: 'eur', expected: L, explain: 'Servicing is the same either way, so it doesn’t affect the choice.', signless: true },
        { key: 'r', symbol: 'r', label: 'Discount rate', unit: 'pct', expected: r, explain: 'Your own cost of capital, not the lessor’s advertised rate.' },
        { key: 'T', symbol: 'T', label: 'Number of payments', unit: 'count', expected: T, explain: `${T}.` },
      ],
      solve: (v) => fin.annuityDue(Math.abs(v.C), v.r / 100, v.T),
      answer: { label: 'PV of the lease payments', unit: 'eur', explain: `Ordinary annuity ${eur(ord, 2)} × ${onePlus(r)} = ${eur(pv, 2)}.` },
      decision: {
        question: 'Lease or buy?',
        options: [
          { id: 'lease', label: 'Lease' },
          { id: 'buy', label: 'Buy' },
        ],
        correct: lease ? 'lease' : 'buy',
        why: [
          { id: 'cheaper-lease', label: 'The lease costs less in today’s money' },
          { id: 'cheaper-buy', label: 'Buying costs less in today’s money' },
          { id: 'total', label: `${T} payments of ${eur(L)} add up to more than the price` },
          { id: 'service', label: 'Leasing avoids the servicing bill' },
        ],
        correctWhy: lease ? 'cheaper-lease' : 'cheaper-buy',
        explain: `Lease ${eur(pv, 2)} v. buy ${eur(buy)}. The servicing cost is the same in both, so it drops out.`,
      },
      working: [
        `PV = \\frac{${w0(L)}}{${rd(r)}}\\left(1 - \\frac{1}{${onePlus(r)}^{${T}}}\\right) \\times ${onePlus(r)} = €${w2(pv)}`,
        `${w2(pv)} ${lease ? '<' : '>'} ${w0(buy)} \\to \\text{${lease ? 'lease' : 'buy'}}`,
      ],
      hints: {
        timeline: 'Start of the year means the first payment is today.',
        formula: 'Payments in advance.',
        inputs: 'Ignore anything that is the same in both options.',
        answer: 'Ordinary annuity, then × (1 + r).',
        decision: 'Cheaper in today’s money wins.',
      },
      outcomes: none(['lease', 'buy'], 'Exam room question.'),
      cfoLine: `Lease PV ${eur(pv, 2)} v. ${eur(buy)}.`,
    };
  },
});

// ---------------------------------------------------------------- Chapter II

export const examBondTwoYears = defineCalc({
  kind: 'calc',
  id: 'exam-bond-two-years',
  title: 'Two years after issue',
  host: 'narrator',
  concept: 'bond-semiannual',
  uses: ['price-yield', 'premium-discount'],
  base: { face: 1000, c: 5, M: 10, y: 6.5 },
  vary: (rng) => {
    const c = pickRate(rng, 3, 8, 0.5);
    return { face: 1000, c, M: pickInt(rng, 6, 15), y: c + pickOne(rng, [-2, -1, -0.5, 0.5, 1, 2]) };
  },
  build: ({ face, c, M, y }) => {
    const C2 = (face * c) / 200;
    const n = (M - 2) * 2;
    const price = fin.bondPrice(C2, y / 200, n, face);
    const fell = price < face;
    return {
      prompt: [
        `Two years ago an investor bought a ${M}-year bond at issue, at its face value of ${eur(face)}. It pays a ${pct(c)} coupon, in two half-yearly instalments. The issuer is rated A, and inflation over the two years averaged 2.5%.`,
        `Today, yields on bonds of the same risk and remaining maturity are ${pct(y)} a year, compounded semi-annually.`,
      ],
      ask: 'What is the bond worth today? Has the investor made or lost money on its price?',
      timeline: {
        unit: 'half-year',
        show: n,
        streams: [
          { id: 'coupon', label: `Coupon (${eur(C2, 2)})`, periods: range(1, n), direction: 'in' },
          { id: 'face', label: `Face value (${eur(face)})`, periods: [n], direction: 'in' },
        ],
        explain: `${M} − 2 = ${M - 2} years left: ${n} half-yearly coupons, then the face value.`,
      },
      formula: { options: ['bond-semi', 'bond', 'annuity', 'real-rate'], correct: 'bond-semi', explain: 'Bond formula on a half-year footing, over the years that are left.' },
      inputs: [
        { key: 'C', symbol: 'C/2', label: 'Coupon per half-year', unit: 'eur', expected: C2, explain: `${pct(c)} × ${eur(face)} ÷ 2.` },
        { key: 'F', symbol: 'F', label: 'Face value', unit: 'eur', expected: face, explain: 'Unchanged.' },
        { key: 'r', symbol: 'r/2', label: 'Yield per half-year', unit: 'pct', expected: y / 2, explain: `Today’s yield ÷ 2: ${pct(y / 2, 2)}.` },
        { key: 'T', symbol: '2T', label: 'Half-years left', unit: 'count', expected: n, explain: `(${M} − 2) × 2 = ${n}. Two years have passed.` },
      ],
      solve: (v) => fin.bondPrice(v.C, v.r / 100, v.T, v.F),
      answer: { label: 'Price today', unit: 'eur', explain: `Remaining coupons and face at ${pct(y / 2, 2)} a half-year: ${eur(price, 2)}.` },
      decision: {
        question: 'Has the price gone up or down since issue?',
        options: [
          { id: 'up', label: 'Up: a gain' },
          { id: 'down', label: 'Down: a loss' },
        ],
        correct: fell ? 'down' : 'up',
        why: [
          { id: 'rose', label: 'Yields rose above the coupon rate, so the price fell below face value' },
          { id: 'fell', label: 'Yields fell below the coupon rate, so the price rose above face value' },
          { id: 'inflation', label: 'Inflation eats into the price of every bond' },
          { id: 'rating', label: 'An A rating keeps the price at face value' },
        ],
        correctWhy: fell ? 'rose' : 'fell',
        explain: `Coupon ${pct(c)} v. yield ${pct(y)}: ${fell ? 'a discount' : 'a premium'}.`,
      },
      working: [
        `C = ${w2(C2)},\\quad r = ${w4(y / 2)}\\%,\\quad T = ${n}`,
        `PV = \\frac{${w2(C2)}}{${rd(y / 2)}}\\left(1 - \\frac{1}{${onePlus(y / 2)}^{${n}}}\\right) + \\frac{${w0(face)}}{${onePlus(y / 2)}^{${n}}} = €${w2(price)}`,
      ],
      hints: {
        timeline: 'Count only what is left.',
        formula: 'Coupons twice a year.',
        inputs: 'The rating and inflation are not inputs.',
        answer: 'Annuity of coupons plus the discounted face value.',
        decision: 'Compare the coupon rate with today’s yield.',
      },
      outcomes: none(['up', 'down'], 'Exam room question.'),
      cfoLine: `Price today ${eur(price, 2)}.`,
    };
  },
});

export const examYtmReal = defineCalc({
  kind: 'calc',
  id: 'exam-ytm-real',
  title: 'Yield, then real yield',
  host: 'narrator',
  concept: 'ytm',
  uses: ['real-nominal'],
  base: { face: 1000, c: 4, T: 5, P: 920, i: 3 },
  vary: (rng) => {
    const c = pickRate(rng, 3, 8, 0.5);
    const T = pickInt(rng, 3, 10);
    const P = roundTo(fin.bondPrice(10 * c, (c + pickOne(rng, [-1.5, -1, 1, 1.5, 2])) / 100, T, 1000), 5);
    const ytm = fin.solveRate((r) => fin.bondPrice(10 * c, r, T, 1000), P) * 100;
    let i = pickRate(rng, 1, 5, 0.5);
    if (Math.abs(fin.realRate(ytm / 100, i / 100) * 100 - 2) < 0.3) i += 1;
    return { face: 1000, c, T, P, i };
  },
  build: ({ face, c, T, P, i }) => {
    const C = (face * c) / 100;
    const y = fin.solveRate((r) => fin.bondPrice(C, r, T, face), P) * 100;
    const real = fin.realRate(y / 100, i / 100) * 100;
    const above = real > 2;
    return {
      prompt: [
        `A ${word(T)}-year bond with a face value of ${eur(face)} pays an annual coupon of ${pct(c)}. It trades at ${eur(P)}. Its current yield (coupon ÷ price) is ${pct((C / P) * 100, 2)}.`,
        `Inflation is expected to be ${pct(i)} a year. A pension fund will only buy if the real yield is above 2%.`,
      ],
      ask: 'What is the yield to maturity? Will the pension fund buy?',
      timeline: {
        unit: 'year',
        show: T,
        streams: [
          { id: 'coupon', label: `Coupon (${eur(C)})`, periods: range(1, T), direction: 'in' },
          { id: 'face', label: `Face value (${eur(face)})`, periods: [T], direction: 'in' },
        ],
        explain: `${T} annual coupons, face value at year ${T}.`,
      },
      formula: { options: ['bond-ytm', 'bond', 'div-yield', 'real-rate'], correct: 'bond-ytm', explain: 'YTM is the rate that makes the bond’s PV equal its price. Find it by trial and error.' },
      inputs: [
        { key: 'C', symbol: 'C', label: 'Annual coupon', unit: 'eur', expected: C, explain: `${pct(c)} × ${eur(face)}.` },
        { key: 'F', symbol: 'F', label: 'Face value', unit: 'eur', expected: face, explain: `${eur(face)}.` },
        { key: 'P', symbol: 'P', label: 'Price', unit: 'eur', expected: P, explain: 'The market price is the target.' },
        { key: 'T', symbol: 'T', label: 'Years to maturity', unit: 'years', expected: T, explain: `${T}.` },
      ],
      solve: (v) => fin.solveRate((r) => fin.bondPrice(v.C, r, v.T, v.F), v.P) * 100,
      answer: { label: 'Yield to maturity', unit: 'pct', explain: `At ${pct(y, 2)} the bond’s PV equals ${eur(P)}. The current yield ignores the gain or loss to face value.`, tolerance: 0.05 },
      tryRate: { valueLabel: 'Price', value: (rp) => fin.bondPrice(C, rp / 100, T, face), target: P, targetLabel: 'Market price', unit: 'eur' },
      decision: {
        question: 'Will the pension fund buy?',
        options: [
          { id: 'buy', label: 'Yes: real yield above 2%' },
          { id: 'pass', label: 'No: real yield at or below 2%' },
        ],
        correct: above ? 'buy' : 'pass',
        why: [
          { id: 'fisher', label: 'Real yield = (1 + YTM) ÷ (1 + inflation) − 1' },
          { id: 'current', label: 'Use the current yield, not the YTM' },
          { id: 'coupon', label: 'Compare the coupon rate with inflation' },
        ],
        correctWhy: 'fisher',
        explain: `Real yield = ${onePlus(y)} ÷ ${onePlus(i)} − 1 = ${pct(real, 2)}.`,
      },
      working: [
        `${w0(P)} = \\frac{${w0(C)}}{YTM}\\left(1 - \\frac{1}{(1 + YTM)^{${T}}}\\right) + \\frac{${w0(face)}}{(1 + YTM)^{${T}}} \\to YTM = ${w2(y)}\\%`,
        `r_{real} = \\frac{${onePlus(y)}}{${onePlus(i)}} - 1 = ${w2(real)}\\%`,
      ],
      hints: {
        timeline: 'Coupons every year, face at the end.',
        formula: 'No formula to rearrange: search for the rate.',
        inputs: 'The current yield is a distraction.',
        answer: 'Below par means the YTM is above the coupon rate.',
        decision: 'Turn the nominal yield into a real one.',
      },
      outcomes: none(['buy', 'pass'], 'Exam room question.'),
      cfoLine: `YTM ${pct(y, 2)}, real ${pct(real, 2)}.`,
    };
  },
});

// ---------------------------------------------------------------- Chapter III

export const examPvgoRoe = defineCalc({
  kind: 'calc',
  id: 'exam-pvgo-roe',
  title: 'Growth from first principles',
  host: 'narrator',
  concept: 'pvgo',
  uses: ['payout-plowback', 'gordon'],
  base: { E: 4, payout: 40, roe: 18, r: 12 },
  vary: (rng) => {
    const r = pickRate(rng, 8, 16, 1);
    const payout = pickOne(rng, [40, 50, 60, 70]);
    let roe = pickRate(rng, 6, 25, 1);
    if (Math.abs(roe - r) < 1) roe = r + 3;
    while ((roe * (100 - payout)) / 100 > r - 1) roe -= 1;
    return { E: pickRate(rng, 1, 10, 0.5), payout, roe, r };
  },
  build: ({ E, payout, roe, r }) => {
    const b = (100 - payout) / 100;
    const g = roe * b;
    const D1 = (E * payout) / 100;
    const P = D1 / ((r - g) / 100);
    const noGrowth = E / (r / 100);
    const pvgo = P - noGrowth;
    const good = roe > r;
    return {
      prompt: [
        `Maison Ardent is expected to earn ${eur(E, 2)} a share next year and pay out ${pct(payout)} of it as dividends, reinvesting the rest. It earns a return on equity of ${pct(roe)} on what it reinvests, and expects to keep doing so.`,
        `Investors require ${pct(r)}. Its book value is ${eur(E * 6, 2)} a share, it has 2 million shares, and last year it earned ${eur(E * 0.9, 2)} a share.`,
      ],
      ask: 'What is the present value of Ardent’s growth opportunities, per share? Is reinvesting adding value?',
      timeline: {
        unit: 'year',
        show: 4,
        streams: [{ id: 'div', label: 'Dividend, growing', periods: [1, 2, 3], direction: 'in', forever: true }],
        explain: 'A growing dividend from year 1, forever.',
      },
      formula: {
        options: ['pvgo', 'gordon', 'sustainable-g', 'div-yield'],
        correct: 'pvgo',
        explain: 'Growth first (g = ROE × plowback), then the price with constant growth, then PVGO = price − EPS ÷ r.',
      },
      inputs: [
        { key: 'E', symbol: 'EPS_{1}', label: 'Next year’s earnings per share', unit: 'eur', expected: E, explain: 'Next year’s, not last year’s.' },
        { key: 'p', symbol: '\\text{payout}', label: 'Payout ratio', unit: 'pct', expected: payout, explain: `${pct(payout)}, so plowback is ${pct(100 - payout)}.` },
        { key: 'roe', symbol: 'ROE', label: 'Return on equity', unit: 'pct', expected: roe, explain: `${pct(roe)}.` },
        { key: 'r', symbol: 'r', label: 'Required return', unit: 'pct', expected: r, explain: `${pct(r)}.` },
      ],
      solve: (v) => {
        const gg = (v.roe * (1 - v.p / 100)) / 100;
        return (v.E * (v.p / 100)) / (v.r / 100 - gg) - v.E / (v.r / 100);
      },
      answer: { label: 'PVGO per share', unit: 'eur', explain: `g = ${pct(g, 2)}, D₁ = ${eur(D1, 2)}, P₀ = ${eur(P, 2)}; no-growth value ${eur(noGrowth, 2)}; PVGO = ${eur(pvgo, 2)}.` },
      decision: {
        question: 'Is reinvesting adding value?',
        options: [
          { id: 'yes', label: 'Yes' },
          { id: 'no', label: 'No' },
        ],
        correct: good ? 'yes' : 'no',
        why: [
          { id: 'above', label: 'ROE is above the required return, so reinvested profit earns more than investors ask' },
          { id: 'below', label: 'ROE is below the required return, so reinvesting destroys value' },
          { id: 'growth', label: 'Any growth in dividends adds value' },
        ],
        correctWhy: good ? 'above' : 'below',
        explain: `ROE ${pct(roe)} v. r ${pct(r)}: PVGO is ${pvgo >= 0 ? 'positive' : 'negative'}.`,
      },
      working: [
        `g = ${rd(roe)} \\times ${w2(b)} = ${w2(g)}\\%`,
        `D_{1} = ${w2(E)} \\times ${w2(payout / 100)} = ${w2(D1)}`,
        `P_{0} = \\frac{${w2(D1)}}{${rd(r)} - ${rd(g)}} = ${w2(P)}`,
        `PVGO = ${w2(P)} - \\frac{${w2(E)}}{${rd(r)}} = €${w2(pvgo)}`,
      ],
      hints: {
        timeline: 'Dividends forever, growing.',
        formula: 'Three steps: growth, price, then what the growth is worth.',
        inputs: 'Book value, share count and last year’s EPS are not needed.',
        answer: 'g = ROE × (1 − payout).',
        decision: 'Compare ROE with r.',
      },
      outcomes: none(['yes', 'no'], 'Exam room question.'),
      cfoLine: `PVGO ${eur(pvgo, 2)}.`,
    };
  },
});

export const examRealGrowthDdm = defineCalc({
  kind: 'calc',
  id: 'exam-real-growth-ddm',
  title: 'Real growth, nominal rate',
  host: 'narrator',
  concept: 'gordon',
  uses: ['real-nominal', 'ddm'],
  base: { D0: 2.4, gr: 1.5, i: 2.5, r: 9, market: 40 },
  vary: (rng) => {
    const D0 = pickRate(rng, 0.5, 4, 0.05);
    const gr = pickRate(rng, 0, 3, 0.5);
    const i = pickRate(rng, 1, 4, 0.5);
    const r = pickRate(rng, 7, 12, 0.5);
    const g = ((1 + gr / 100) * (1 + i / 100) - 1) * 100;
    const P = (D0 * (1 + g / 100)) / ((r - g) / 100);
    return { D0, gr, i, r, market: Math.round(P * pickOne(rng, [0.85, 0.92, 1.08, 1.15]) * 100) / 100 };
  },
  build: ({ D0, gr, i, r, market }) => {
    const g = ((1 + gr / 100) * (1 + i / 100) - 1) * 100;
    const D1 = D0 * (1 + g / 100);
    const P = D1 / ((r - g) / 100);
    const cheap = P > market;
    return {
      prompt: [
        `Lindqvist & Fils has just paid a dividend of ${eur(D0, 2)} a share. Its dividends are expected to grow by ${pct(gr)} a year in real terms, forever. Inflation is expected to be ${pct(i)} a year.`,
        `Investors require a nominal return of ${pct(r)}. The shares trade at ${eur(market, 2)}; their 52-week high was ${eur(market * 1.3, 2)}, and the firm pays out 55% of earnings.`,
      ],
      ask: 'What is a share worth? Are the shares cheap or expensive at the market price?',
      timeline: {
        unit: 'year',
        show: 4,
        streams: [{ id: 'div', label: 'Dividend, growing', periods: [1, 2, 3], direction: 'in', forever: true }],
        explain: 'The dividend just paid is gone. The next one comes at year 1 and grows forever.',
      },
      formula: { options: ['gordon', 'real-rate', 'growing-annuity', 'ddm-one'], correct: 'gordon', explain: 'Constant growth forever: P₀ = D₁ ÷ (r − g), with g and r both nominal.' },
      inputs: [
        { key: 'D', symbol: 'D_{1}', label: 'Next year’s dividend', unit: 'eur', expected: D1, explain: `${eur(D0, 2)} × ${w4(1 + g / 100)} = ${eur(D1, 2)}. The one just paid is D₀.` },
        { key: 'r', symbol: 'r', label: 'Required return (nominal)', unit: 'pct', expected: r, explain: `${pct(r)}.` },
        { key: 'g', symbol: 'g', label: 'Dividend growth (nominal)', unit: 'pct', expected: g, explain: `${onePlus(gr)} × ${onePlus(i)} − 1 = ${pct(g, 3)}. Real and nominal must match the rate.` },
      ],
      solve: (v) => v.D / ((v.r - v.g) / 100),
      answer: { label: 'Value per share', unit: 'eur', explain: `${eur(D1, 2)} ÷ (${rd(r)} − ${rd(g)}) = ${eur(P, 2)}.` },
      decision: {
        question: 'Cheap or expensive?',
        options: [
          { id: 'cheap', label: 'Cheap: worth more than the price' },
          { id: 'dear', label: 'Expensive: worth less than the price' },
        ],
        correct: cheap ? 'cheap' : 'dear',
        why: [
          { id: 'value-above', label: 'Our value is above the market price' },
          { id: 'value-below', label: 'Our value is below the market price' },
          { id: 'high', label: 'It trades well below its 52-week high' },
          { id: 'real', label: 'Real growth is positive, so it must be cheap' },
        ],
        correctWhy: cheap ? 'value-above' : 'value-below',
        explain: `Value ${eur(P, 2)} v. price ${eur(market, 2)}.`,
      },
      working: [
        `g = ${onePlus(gr)} \\times ${onePlus(i)} - 1 = ${w4(g)}\\%`,
        `D_{1} = ${w2(D0)} \\times ${w4(1 + g / 100)} = ${w4(D1)}`,
        `P_{0} = \\frac{${w4(D1)}}{${rd(r)} - ${w4(g / 100)}} = €${w2(P)}`,
      ],
      hints: {
        timeline: 'The dividend just paid is in the past.',
        formula: 'Growing forever.',
        inputs: 'Make growth nominal before you mix it with a nominal rate.',
        answer: 'D₁ ÷ (r − g).',
        decision: 'Value against price.',
      },
      outcomes: none(['cheap', 'dear'], 'Exam room question.'),
      cfoLine: `Worth ${eur(P, 2)}.`,
    };
  },
});

// ---------------------------------------------------------------- Chapter IV

export const examHiddenCosts = defineCalc({
  kind: 'calc',
  id: 'exam-hidden-costs',
  title: 'What really counts',
  host: 'narrator',
  concept: 'incremental-cf',
  uses: ['depreciation-tax', 'npv'],
  base: { I: 240000, T: 6, S: 180000, K: 95000, R: 18000, t: 25, r: 10, research: 30000, overhead: 12000 },
  vary: (rng) => {
    const I = pickInt(rng, 100000, 400000, 10000);
    const T = pickInt(rng, 4, 8);
    const t = pickOne(rng, [20, 25, 30]);
    const r = pickRate(rng, 8, 14, 1);
    const K = pickInt(rng, 40000, 150000, 5000);
    const R = pickInt(rng, 8000, 30000, 1000);
    // Sales set so the project lands near break-even, either side.
    const need = (I / fin.annuityFactor(r / 100, T) - (t / 100) * (I / T)) / (1 - t / 100);
    const S = roundTo(need * pickOne(rng, [0.85, 0.92, 1.08, 1.15]) + K + R, 5000);
    return { I, T, S, K, R, t, r, research: pickInt(rng, 10000, 50000, 5000), overhead: pickInt(rng, 5000, 20000, 1000) };
  },
  build: ({ I, T, S, K, R, t, r, research, overhead }) => {
    const dep = I / T;
    const ocf = (S - K - R) * (1 - t / 100) + (t / 100) * dep;
    const pvIn = fin.annuity(ocf, r / 100, T);
    const value = pvIn - I;
    const go = value > 0;
    return {
      prompt: [
        `The house is considering a knitwear line. Machines cost ${eur(I)} today, last ${word(T)} years, are depreciated straight-line to zero and have no resale value. The line would bring in sales of ${eur(S)} a year with cash costs of ${eur(K)} a year.`,
        `It would use a studio the house currently rents out for ${eur(R)} a year. Last year the house spent ${eur(research)} on market research for the line. Head office would allocate ${eur(overhead)} a year of its existing overheads to it. The machines would be bought with a bank loan at 5%.`,
        `The tax rate is ${pct(t)} and the cost of capital is ${pct(r)}.`,
      ],
      ask: 'What is the NPV of the knitwear line? Should the house go ahead?',
      timeline: {
        unit: 'year',
        show: T,
        streams: [
          { id: 'cost', label: `Machines (${eur(I)})`, periods: [0], direction: 'out' },
          { id: 'ocf', label: 'After-tax operating cash flow', periods: range(1, T), direction: 'in' },
        ],
        explain: `Machines today; the same after-tax cash flow each year from 1 to ${T}.`,
      },
      formula: {
        options: ['annuity', 'npv-sum', 'perpetuity', 'payback'],
        correct: 'annuity',
        accept: ['npv-sum'],
        explain: 'The yearly cash flow is level, so its PV is an annuity. NPV = −cost + PV of the cash flows.',
      },
      inputs: [
        { key: 'I', symbol: 'C_{0}', label: 'Investment today', unit: 'eur', expected: I, explain: 'The research is sunk; the loan is financing. Neither is a project cash flow.', signless: true },
        {
          key: 'C',
          symbol: 'OCF',
          label: 'After-tax operating cash flow each year',
          unit: 'eur',
          expected: ocf,
          explain: `(${w0(S)} − ${w0(K)} − ${w0(R)} lost rent) × ${w2(1 - t / 100)} + ${w2(t / 100)} × ${w0(dep)} depreciation = ${eur(ocf, 2)}. The allocated overhead doesn’t change, so leave it out.`,
        },
        { key: 'r', symbol: 'r', label: 'Cost of capital', unit: 'pct', expected: r, explain: 'Not the loan rate.' },
        { key: 'T', symbol: 'T', label: 'Years', unit: 'years', expected: T, explain: `${T}.` },
      ],
      solve: (v) => fin.annuity(v.C, v.r / 100, v.T) - Math.abs(v.I),
      answer: { label: 'NPV', unit: 'eur', explain: `PV of the cash flows ${eur(pvIn, 2)} − ${eur(I)} = ${eur(value, 2)}.` },
      decision: {
        question: 'Go ahead with knitwear?',
        options: [
          { id: 'go', label: 'Go ahead' },
          { id: 'stop', label: 'Don’t' },
        ],
        correct: go ? 'go' : 'stop',
        why: [
          { id: 'pos', label: 'NPV is positive on the incremental cash flows' },
          { id: 'neg', label: 'NPV is negative on the incremental cash flows' },
          { id: 'sunk', label: 'We’ve already paid for the research, so we should finish what we started' },
          { id: 'overhead', label: 'It has to cover its share of head-office overheads' },
        ],
        correctWhy: go ? 'pos' : 'neg',
        explain: `Count the lost rent (an opportunity cost) and the depreciation tax shield. Ignore the research (sunk), the overhead (unchanged) and the loan (financing).`,
      },
      working: [
        `OCF = (${w0(S)} - ${w0(K)} - ${w0(R)})(1 - ${rd(t)}) + ${rd(t)} \\times ${w0(dep)} = ${w2(ocf)}`,
        `NPV = -${w0(I)} + \\frac{${w2(ocf)}}{${rd(r)}}\\left(1 - \\frac{1}{${onePlus(r)}^{${T}}}\\right) = €${w2(value)}`,
      ],
      hints: {
        timeline: 'One cost today, level cash after.',
        formula: 'Level yearly flows.',
        inputs: 'Three numbers in the brief are not project cash flows; one cost that isn’t paid in cash still is.',
        answer: 'After-tax operating cash flow, then an annuity.',
        decision: 'Only incremental cash flows count.',
      },
      outcomes: none(['go', 'stop'], 'Exam room question.'),
      cfoLine: `NPV ${eur(value, 2)}.`,
    };
  },
});

export const examIncremental = defineCalc({
  kind: 'calc',
  id: 'exam-incremental',
  title: 'Either-or, three years',
  host: 'narrator',
  concept: 'incremental-irr',
  uses: ['irr', 'npv'],
  base: { small: [-150000, 70000, 70000, 70000], inc: [-150000, 50000, 60000, 70000], r: 9 },
  vary: (rng) => {
    const k = pickOne(rng, [0.5, 1, 2]);
    const b = pickInt(rng, 55000, 80000, 5000);
    const D = 150000;
    const target = pickOne(rng, [4, 7, 12, 16]) / 100;
    const d1 = pickInt(rng, 30000, 60000, 5000);
    const d2 = pickInt(rng, 40000, 70000, 5000);
    // Year-3 extra cash set so the incremental IRR lands near the target.
    const d3 = roundTo((D - d1 / (1 + target) - d2 / (1 + target) ** 2) * (1 + target) ** 3, 5000);
    return { small: [-D, b, b, b].map((x) => x * k), inc: [-D, d1, d2, Math.max(5000, d3)].map((x) => x * k), r: pickRate(rng, 6, 14, 1) };
  },
  build: ({ small, inc, r }) => {
    const big = small.map((c, t) => c + inc[t]);
    const irrInc = fin.irr(inc) * 100;
    const takeBig = irrInc > r;
    const list = (f: number[]) => f.map((c) => (c < 0 ? `−${eur(-c)}` : eur(c))).join(', ');
    return {
      prompt: [
        `A house must choose one of two boutiques. Boutique Petite: ${list(small)} in years 0 to 3. Boutique Grande: ${list(big)}.`,
        `Petite’s IRR is ${pct(fin.irr(small) * 100, 1)} and Grande’s is ${pct(fin.irr(big) * 100, 1)}. The cost of capital is ${pct(r)}.`,
      ],
      ask: 'What is the IRR on the extra investment in Grande? Which boutique should the house open?',
      timeline: {
        unit: 'year',
        show: 4,
        streams: [
          { id: 'out', label: 'Extra cost of Grande', periods: [0], direction: 'out' },
          { id: 'in', label: 'Extra cash from Grande', periods: [1, 2, 3], direction: 'in' },
        ],
        explain: 'Grande minus Petite: extra cost today, extra cash in years 1 to 3.',
      },
      formula: { options: ['incremental-irr', 'irr', 'npv-sum', 'pi'], correct: 'incremental-irr', explain: 'For either-or choices, the IRR of the difference, compared with the cost of capital.' },
      inputs: range(0, 3).map((t) => ({
        key: `d${t}`,
        symbol: `\\Delta C_{${t}}`,
        label: t === 0 ? 'Extra cost today' : `Extra cash, year ${t}`,
        unit: 'eur' as const,
        expected: inc[t],
        explain: `${w0(big[t])} − (${w0(small[t])}).`,
        signless: t === 0,
      })),
      solve: (v) => fin.irr([-Math.abs(v.d0), v.d1, v.d2, v.d3]) * 100,
      answer: { label: 'Incremental IRR', unit: 'pct', explain: `At ${pct(irrInc, 2)} the extra cash exactly repays the extra cost.`, tolerance: 0.05 },
      tryRate: { valueLabel: 'NPV of the difference', value: (rp) => fin.npv(rp / 100, inc), target: 0, targetLabel: 'NPV of the difference', unit: 'eur' },
      decision: {
        question: 'Which boutique?',
        options: [
          { id: 'big', label: 'Grande' },
          { id: 'small', label: 'Petite' },
        ],
        correct: takeBig ? 'big' : 'small',
        why: [
          { id: 'inc-above', label: 'The extra investment earns more than the cost of capital' },
          { id: 'inc-below', label: 'The extra investment earns less than the cost of capital' },
          { id: 'higher-irr', label: 'Pick the boutique with the higher IRR' },
        ],
        correctWhy: takeBig ? 'inc-above' : 'inc-below',
        explain: `Incremental IRR ${pct(irrInc, 2)} v. ${pct(r)}. NPVs: Grande ${eur(fin.npv(dec(r), big))}, Petite ${eur(fin.npv(dec(r), small))}.`,
      },
      working: [`\\Delta C = ${inc.map(w0).join(',\\ ')}`, `0 = ${w0(inc[0])} + \\frac{${w0(inc[1])}}{1 + IRR} + \\frac{${w0(inc[2])}}{(1 + IRR)^{2}} + \\frac{${w0(inc[3])}}{(1 + IRR)^{3}} \\to IRR = ${w2(irrInc)}\\%`],
      hints: {
        timeline: 'Treat going bigger as its own project.',
        formula: 'The projects’ own IRRs don’t answer this.',
        inputs: 'Grande minus Petite, year by year.',
        answer: 'Try rates until the NPV of the difference is zero.',
        decision: 'Incremental IRR against the cost of capital.',
      },
      outcomes: none(['big', 'small'], 'Exam room question.'),
      cfoLine: `Incremental IRR ${pct(irrInc, 2)}.`,
    };
  },
});


// ---------------------------------------------------------------- Chapter V

export const examBetaCapm = defineCalc({
  kind: 'calc',
  id: 'exam-beta-capm',
  title: 'Is the holding company worth it?',
  host: 'narrator',
  concept: 'capm',
  uses: ['beta', 'covariance'],
  base: { m: [8, -4, 12, 3, -2], s: [12, -8, 19, 3, -3], b: 1.4, rf: 3, rm: 9, expected: 12 },
  vary: (rng) => {
    const m = range(1, 5).map(() => pickInt(rng, -8, 18));
    const b = pickRate(rng, 0.6, 1.8, 0.1);
    const rf = pickRate(rng, 2, 5, 0.5);
    const rm = rf + pickRate(rng, 4, 8, 0.5);
    const noise = [1, -2, 2, -1, 0];
    const s = m.map((x, i) => Math.round(b * x + noise[i]));
    const beta = fin.beta(s, m);
    return { m, s, b, rf, rm, expected: Math.round((fin.capm(rf, beta, rm) + pickOne(rng, [-1.5, -0.7, 0.7, 1.5])) * 10) / 10 };
  },
  build: ({ m, s, rf, rm, expected }) => {
    const stock: number[] = s;
    const cov = fin.covariance(stock, m);
    const varM = fin.variance(m);
    const beta = cov / varM;
    const req = fin.capm(rf, beta, rm);
    const buy = expected > req;
    return {
      prompt: [
        `A holding company’s shares returned ${stock.map((x) => (x < 0 ? '−' : '') + Math.abs(x) + '%').join(', ')} over five years, while the market returned ${m.map((x: number) => (x < 0 ? '−' : '') + Math.abs(x) + '%').join(', ')} in the same years.`,
        `Treasury bills pay ${pct(rf)} and the market is expected to return ${pct(rm)}. The holding company’s shares are expected to return ${pct(expected)}. Its dividend yield is 2.5% and it has 40 million shares in issue.`,
      ],
      ask: 'Estimate the holding company’s beta from the five years of data, and the return CAPM requires of it. Should the house buy?',
      timeline: { unit: 'year', show: 6, streams: [{ id: 'ret', label: 'Returns on the stock and the market', periods: range(1, 5), direction: 'in' }], explain: 'One pair of returns for each of the five years.' },
      formula: { options: ['capm', 'beta', 'capm-beta', 'correlation'], correct: 'capm', accept: [], explain: 'Beta (covariance ÷ market variance) feeds into CAPM: required return = risk-free + beta × (market − risk-free).' },
      inputs: [
        { key: 'c', symbol: '\\text{Cov}(R_{i},R_{m})', label: 'Covariance of the stock with the market', unit: 'number', expected: cov, explain: 'Average of the products of the two deviations.' },
        { key: 'v', symbol: '\\text{Var}(R_{m})', label: 'Variance of the market', unit: 'number', expected: varM, explain: 'Average squared deviation of the market’s returns.' },
        { key: 'rf', symbol: 'R_{f}', label: 'Risk-free rate', unit: 'pct', expected: rf, explain: `${pct(rf)}.` },
        { key: 'rm', symbol: 'R_{m}', label: 'Expected market return', unit: 'pct', expected: rm, explain: 'Not the past five years’ average.' },
      ],
      solve: (v) => v.rf + (v.c / v.v) * (v.rm - v.rf),
      answer: { label: 'Required return', unit: 'pct', explain: `β = ${w2(cov)} ÷ ${w2(varM)} = ${w2(beta)}; required return ${pct(req, 2)}.`, tolerance: 0.1 },
      decision: {
        question: `Buy at an expected return of ${pct(expected)}?`,
        options: [
          { id: 'yes', label: 'Buy' },
          { id: 'no', label: 'Pass' },
        ],
        correct: buy ? 'yes' : 'no',
        why: [
          { id: 'above', label: 'The expected return is above the return required for its beta' },
          { id: 'below', label: 'The expected return is below the return required for its beta' },
          { id: 'div', label: 'The dividend yield makes it safe' },
        ],
        correctWhy: buy ? 'above' : 'below',
        explain: `Expected ${pct(expected)} against required ${pct(req, 2)}.`,
      },
      working: [`\\beta = \\frac{${w2(cov)}}{${w2(varM)}} = ${w2(beta)}`, `E[R] = ${rf} + ${w2(beta)}(${rm} - ${rf}) = ${w2(req)}\\%`],
      hints: { timeline: '', formula: '', inputs: '', answer: '', decision: '' },
      outcomes: none(['yes', 'no'], 'Exam room question.'),
      cfoLine: `β ${w2(beta)}, required ${pct(req, 2)}.`,
    };
  },
});

export const examTargetMix = defineCalc({
  kind: 'calc',
  id: 'exam-target-mix',
  title: 'Risk budget',
  host: 'narrator',
  concept: 'capital-allocation',
  uses: ['capm', 'portfolio-risk'],
  base: { rf: 3, rm: 11, sm: 16, target: 9, need: 8 },
  vary: (rng) => {
    const rf = pickRate(rng, 2, 5, 0.5);
    const rm = rf + pickRate(rng, 5, 9, 0.5);
    const sm = pickInt(rng, 12, 22);
    const target = pickInt(rng, 5, 24);
    const e = rf + (target / sm) * (rm - rf);
    return { rf, rm, sm, target, need: Math.round(e + pickOne(rng, [-1.5, -0.6, 0.6, 1.5])) };
  },
  build: ({ rf, rm, sm, target, need }) => {
    const w = (target / sm) * 100;
    const e = rf + (w / 100) * (rm - rf);
    const ok = e >= need;
    return {
      prompt: [
        `A family trust may invest only in the market portfolio and in Treasury bills, and it can lend or borrow at the bill rate. The market portfolio is expected to return ${pct(rm)} with a standard deviation of ${pct(sm)}. Bills pay ${pct(rf)}.`,
        `The trustees will accept a portfolio standard deviation of at most ${pct(target)} and want an expected return of at least ${pct(need)}. The trust holds €2.4 million and its previous manager charged 0.6% a year.`,
      ],
      ask: 'What proportion should be in the market portfolio to use the whole risk budget, and what expected return does that give? Is the target met?',
      timeline: { unit: 'year', show: 2, streams: [{ id: 'out', label: 'Trust money', periods: [0], direction: 'out' }, { id: 'back', label: 'Value after a year', periods: [1], direction: 'in' }], explain: 'One year.' },
      formula: { options: ['mix-sd', 'mix-return', 'portfolio-sd', 'capm'], correct: 'mix-sd', accept: ['mix-return'], explain: 'The risk-free asset has no risk, so the weight in the market is target SD ÷ market SD. Then the return is the bill rate plus the weight times the market premium.' },
      inputs: [
        { key: 'w', symbol: 'w_{m}', label: 'Proportion in the market portfolio', unit: 'pct', expected: w, explain: `${pct(target)} ÷ ${pct(sm)} = ${pct(w, 1)}.` },
        { key: 'rf', symbol: 'R_{f}', label: 'Risk-free rate', unit: 'pct', expected: rf, explain: `${pct(rf)}.` },
        { key: 'rm', symbol: 'R_{m}', label: 'Market return', unit: 'pct', expected: rm, explain: `${pct(rm)}.` },
      ],
      solve: (v) => v.rf + (v.w / 100) * (v.rm - v.rf),
      answer: { label: 'Expected return of the portfolio', unit: 'pct', explain: `${pct(rf)} + ${w2(w / 100)} × (${pct(rm)} − ${pct(rf)}) = ${pct(e, 2)}.`, tolerance: 0.1 },
      decision: {
        question: `Is the target of ${pct(need)} met within the risk limit?`,
        options: [
          { id: 'yes', label: 'Yes' },
          { id: 'no', label: 'No: it can’t be done within that risk' },
        ],
        correct: ok ? 'yes' : 'no',
        why: [
          { id: 'ge', label: 'The best return available at that risk is at least the target' },
          { id: 'lt', label: 'The best return available at that risk is below the target' },
          { id: 'fee', label: 'The previous manager’s fee decides it' },
        ],
        correctWhy: ok ? 'ge' : 'lt',
        explain: `${pct(e, 2)} is the best available at SD ${pct(target)}; the target is ${pct(need)}.`,
      },
      working: [`w_{m} = \\frac{${target}}{${sm}} = ${w4(target / sm)}`, `E[R] = ${rf} + ${w4(target / sm)}(${rm} - ${rf}) = ${w2(e)}\\%`],
      hints: { timeline: '', formula: '', inputs: '', answer: '', decision: '' },
      outcomes: none(['yes', 'no'], 'Exam room question.'),
      cfoLine: `Best return at SD ${pct(target)}: ${pct(e, 2)}.`,
    };
  },
});

export const EXAM_PROBLEMS: Problem[] = [
  examDeferredLicence,
  examGrowingLater,
  examLeaseOrBuy,
  examBondTwoYears,
  examYtmReal,
  examPvgoRoe,
  examRealGrowthDdm,
  examHiddenCosts,
  examIncremental,
  examBetaCapm,
  examTargetMix,
];

const room = (ids: string[]): ExamRoom => ({
  intro: 'Paper-style questions. No story, no tips, no ticks until you hand in. Some of the numbers you’re given aren’t needed.',
  problems: ids.map((problem) => ({ problem })),
});

export const EXAM_ROOMS: Record<number, ExamRoom> = {
  1: room(['exam-deferred-licence', 'exam-growing-later', 'exam-lease-or-buy']),
  2: room(['exam-bond-two-years', 'exam-ytm-real']),
  3: room(['exam-pvgo-roe', 'exam-real-growth-ddm']),
  4: room(['exam-hidden-costs', 'exam-incremental']),
  5: room(['exam-beta-capm', 'exam-target-mix']),
};
