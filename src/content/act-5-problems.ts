// Chapter V problems: risk and return. Numbers mirror the Chapter 7–8 problem set, the slides and the Statistics Recap.
// Every number shown comes from the parameters and the solvers in engine/finance.
import * as fin from '../engine/finance';
import { pct } from '../engine/format';
import { pickInt, pickOne, pickRate } from '../engine/rng';
import type { BriefProblem, CalcProblem, ClassifyProblem, DecisionOption, InputSpec, Problem, ProblemInstance, StoryBeat, TimelineSpec } from '../engine/types';
import { defineCalc, range, rd, w0, w2, w4 } from './helpers';

const word = (n: number) => ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'][n] ?? String(n);
const signed = (n: number, dp = 1) => (n < 0 ? '−' : '') + Math.abs(n).toFixed(dp).replace(/\.0+$/, '');
const pc = (n: number) => `${signed(n)}%`;
const list = (xs: number[]) => xs.map(pc).join(', ');

/** A one-year holding: money out today, money back in a year. */
const oneYear = (out: string, back: string, explain: string): TimelineSpec => ({
  unit: 'year',
  show: 2,
  streams: [
    { id: 'out', label: out, periods: [0], direction: 'out' },
    { id: 'back', label: back, periods: [1], direction: 'in' },
  ],
  explain,
});

/** A return each year for n years. */
const yearlyReturns = (label: string, n: number): TimelineSpec => ({
  unit: 'year',
  show: n + 1,
  streams: [{ id: 'ret', label, periods: range(1, n), direction: 'in' }],
  explain: `One return for each of years 1 to ${n}.`,
});

interface Spec {
  prompt: (string | StoryBeat)[];
  ask: string;
  timeline: TimelineSpec;
  formula: { options: string[]; correct: string; explain: string };
  inputs: InputSpec[];
  solve: (v: Record<string, number>) => number;
  answer: ProblemInstance['answer'];
  decision: { question: string; options: DecisionOption[]; correct: string; why: DecisionOption[]; correctWhy: string; explain: string };
  working: string[];
  hints: ProblemInstance['hints'];
  news: string;
  cfoLine: string;
}

/** Builds a full instance; no decision here changes the house's value, so outcomes are all zero. */
const make = (s: Spec): ProblemInstance => ({
  ...s,
  outcomes: Object.fromEntries(s.decision.options.map((o) => [o.id, { valueDelta: 0, news: s.news }])),
  cfoLine: s.cfoLine,
});

const yesNo = (yes: string, no: string): DecisionOption[] => [
  { id: 'yes', label: yes },
  { id: 'no', label: no },
];

// ---------------------------------------------------------------- returns

export const indexReturn: CalcProblem = defineCalc({
  kind: 'calc',
  id: 'index-return',
  title: 'What did the index return?',
  host: 'rupert',
  concept: 'returns',
  uses: ['real-nominal'],
  base: { p0: 21000, p1: 25500, dy: 4.2, rf: 6, infl: 8 },
  vary: (rng) => {
    const p0 = pickOne(rng, [1000, 2500, 5000, 8400, 21000]);
    return { p0, p1: Math.round(p0 * (1 + pickInt(rng, -8, 30) / 100)), dy: pickRate(rng, 1.5, 5, 0.1), rf: pickRate(rng, 2, 7, 0.5), infl: pickOne(rng, [2, 4, 6, 8, 12, 18, 25]) };
  },
  build: ({ p0, p1, dy, rf, infl }) => {
    const gain = ((p1 - p0) / p0) * 100;
    const ret = gain + dy;
    const real = fin.realRate(ret / 100, infl / 100) * 100;
    const beat = real > 0;
    return make({
      prompt: [
        { who: 'rupert', text: `The Syldavian market index opened the year at ${w0(p0)} and closed at ${w0(p1)}. Its dividend yield for the year was ${pct(dy)}.` },
        { who: 'rupert', text: `Treasury bills paid ${pct(rf)}. Inflation ran at ${pct(infl)}.` },
        { who: 'margaux', text: 'Before we put any house money near it, what did it actually return?' },
      ],
      ask: 'What was the index’s return for the year? Did it beat inflation in real terms?',
      timeline: oneYear('Index value at the start', 'Value at the end, plus dividends', 'One year: the index’s value changes and it pays a dividend yield.'),
      formula: { options: ['holding-return', 'risk-premium', 'real-rate', 'ear'], correct: 'holding-return', explain: 'Return = capital gain (price change ÷ starting price) plus the dividend yield.' },
      inputs: [
        { key: 'p0', symbol: 'P_{0}', label: 'Index at the start', unit: 'number', expected: p0, explain: 'The opening level.' },
        { key: 'p1', symbol: 'P_{1}', label: 'Index at the end', unit: 'number', expected: p1, explain: 'The closing level.' },
        { key: 'dy', symbol: 'D/P_{0}', label: 'Dividend yield', unit: 'pct', expected: dy, explain: 'Part of the return, on top of the price change.' },
      ],
      solve: (v) => ((v.p1 - v.p0) / v.p0) * 100 + v.dy,
      answer: { label: 'Return on the index', unit: 'pct', explain: `Capital gain ${pct(gain, 2)} + dividend yield ${pct(dy)} = ${pct(ret, 2)}.`, tolerance: 0.05 },
      decision: {
        question: `Did it beat ${pct(infl)} inflation in real terms?`,
        options: yesNo('Yes, a positive real return', 'No, a negative real return'),
        correct: beat ? 'yes' : 'no',
        why: [
          { id: 'real', label: 'The real return (1 + return) ÷ (1 + inflation) − 1 is above zero' },
          { id: 'real-no', label: 'The real return (1 + return) ÷ (1 + inflation) − 1 is below zero' },
          { id: 'rf', label: 'It beat the Treasury bill rate' },
        ],
        correctWhy: beat ? 'real' : 'real-no',
        explain: `Real return = ${(1 + ret / 100).toFixed(4)} ÷ ${(1 + infl / 100).toFixed(2)} − 1 = ${pct(real, 2)}.`,
      },
      working: [`\\text{Capital gain} = \\frac{${w0(p1)} - ${w0(p0)}}{${w0(p0)}} = ${w2(gain)}\\%`, `R = ${w2(gain)}\\% + ${w2(dy)}\\% = ${w2(ret)}\\%`, `\\text{Real} = \\frac{1 + ${rd(ret)}}{1 + ${rd(infl)}} - 1 = ${w2(real)}\\%`],
      hints: { timeline: 'One year, start to end.', formula: 'Price change and dividends.', inputs: 'The dividend is already a percentage.', answer: 'Gain on the price, plus the yield.', decision: 'Divide, don’t subtract.' },
      news: `The index returned ${pct(ret, 2)}.`,
      cfoLine: `Index return ${pct(ret, 2)}, real ${pct(real, 2)}.`,
    });
  },
});

export const realMarkets: CalcProblem = defineCalc({
  kind: 'calc',
  id: 'real-markets',
  title: 'Two markets, one real return',
  host: 'rupert',
  concept: 'returns',
  uses: ['real-nominal'],
  base: { n1: 95, i1: 80, n2: 12, i2: 2 },
  vary: (rng) => {
    let q = { n1: 95, i1: 80, n2: 12, i2: 2 };
    for (let k = 0; k < 30; k++) {
      q = { n1: pickInt(rng, 10, 95, 5), i1: pickInt(rng, 2, 80, 2), n2: pickInt(rng, 8, 40, 2), i2: pickInt(rng, 1, 12) };
      if (Math.abs(fin.realRate(q.n2 / 100, q.i2 / 100) - fin.realRate(q.n1 / 100, q.i1 / 100)) * 100 >= 1.5) break;
    }
    return q;
  },
  build: ({ n1, i1, n2, i2 }) => {
    const r1 = fin.realRate(n1 / 100, i1 / 100) * 100;
    const r2 = fin.realRate(n2 / 100, i2 / 100) * 100;
    const diff = r2 - r1;
    return make({
      prompt: [
        { who: 'rupert', text: `Two markets for your spare cash. The Costaguana market returned ${pct(n1)} last year, with inflation at ${pct(i1)}.` },
        { who: 'rupert', mood: 'happy', text: `The Ruritanian market returned ${pct(n2)}, with inflation at ${pct(i2)}. Which looks better?` },
      ],
      ask: 'By how many percentage points does Ruritania’s real return beat Costaguana’s (negative if it doesn’t)? Which market is better?',
      timeline: oneYear('Money invested', 'Money back, in each market', 'One year in each market.'),
      formula: { options: ['real-rate', 'holding-return', 'nominal-minus', 'risk-premium'], correct: 'real-rate', explain: 'Real return = (1 + nominal) ÷ (1 + inflation) − 1, worked out for each market.' },
      inputs: [
        { key: 'n1', symbol: 'R_{C}', label: 'Costaguana return', unit: 'pct', expected: n1, explain: 'Nominal.' },
        { key: 'i1', symbol: '\\pi_{C}', label: 'Costaguana inflation', unit: 'pct', expected: i1, explain: 'Per year.' },
        { key: 'n2', symbol: 'R_{R}', label: 'Ruritania return', unit: 'pct', expected: n2, explain: 'Nominal.' },
        { key: 'i2', symbol: '\\pi_{R}', label: 'Ruritania inflation', unit: 'pct', expected: i2, explain: 'Per year.' },
      ],
      solve: (v) => (fin.realRate(v.n2 / 100, v.i2 / 100) - fin.realRate(v.n1 / 100, v.i1 / 100)) * 100,
      answer: { label: 'Ruritania’s real return minus Costaguana’s', unit: 'pct', explain: `Costaguana ${pct(r1, 2)}, Ruritania ${pct(r2, 2)}: a difference of ${signed(diff, 2)} points.`, tolerance: 0.05 },
      decision: {
        question: 'Which market gave the higher real return?',
        options: [
          { id: 'c', label: 'Costaguana' },
          { id: 'r', label: 'Ruritania' },
        ],
        correct: diff > 0 ? 'r' : 'c',
        why: [
          { id: 'real', label: 'Its return after stripping out inflation is higher' },
          { id: 'nominal', label: 'Its headline return is higher' },
        ],
        correctWhy: 'real',
        explain: `Real returns: Costaguana ${pct(r1, 2)}, Ruritania ${pct(r2, 2)}. The headline figure ignores what prices did.`,
      },
      working: [`\\text{Costaguana: } \\frac{1 + ${rd(n1)}}{1 + ${rd(i1)}} - 1 = ${w2(r1)}\\%`, `\\text{Ruritania: } \\frac{1 + ${rd(n2)}}{1 + ${rd(i2)}} - 1 = ${w2(r2)}\\%`],
      hints: { timeline: 'One year, two markets.', formula: 'Divide by inflation, don’t subtract it.', inputs: 'Four numbers.', answer: 'Work out each real return, then subtract.', decision: 'Compare the real returns.' },
      news: `Real returns: Costaguana ${pct(r1, 2)}, Ruritania ${pct(r2, 2)}.`,
      cfoLine: `Real returns ${pct(r1, 2)} v. ${pct(r2, 2)}.`,
    });
  },
});

// ---------------------------------------------------------------- risk premium

export const riskPremiumYears: CalcProblem = defineCalc({
  kind: 'calc',
  id: 'risk-premium-years',
  title: 'Were we paid for the risk?',
  host: 'margaux',
  concept: 'risk-premium',
  uses: ['returns'],
  base: { stocks: [-14.5, -28.3, -43.9, -9.9], bills: [4.8, 2.4, 1.1, 1.0] },
  vary: (rng) => ({ stocks: range(1, 4).map(() => pickInt(rng, -35, 45) + pickOne(rng, [0, 0.5])), bills: range(1, 4).map(() => pickRate(rng, 0.5, 6, 0.1)) }),
  build: ({ stocks, bills }) => {
    const ms = fin.mean(stocks);
    const mb = fin.mean(bills);
    const prem = ms - mb;
    const n = stocks.length;
    return make({
      prompt: [
        { who: 'margaux', text: `Here’s a ${word(n)}-year run from an old market. Shares returned ${list(stocks)}. Treasury bills returned ${list(bills)}.` },
        { who: 'idris', text: 'Shares are always better. Put it all in shares.' },
      ],
      ask: 'What was the average risk premium on shares over these years? Were investors paid for the risk?',
      timeline: yearlyReturns('Return on shares', n),
      formula: { options: ['risk-premium', 'holding-return', 'real-rate', 'var-past'], correct: 'risk-premium', explain: 'The risk premium is the risky return minus the risk-free return. Average it over the years.' },
      inputs: [
        { key: 'ms', symbol: '\\bar{R}_{shares}', label: 'Average return on shares', unit: 'pct', expected: ms, explain: `(${stocks.map((x) => signed(x)).join(' + ')}) ÷ ${n}.` },
        { key: 'mb', symbol: '\\bar{R}_{bills}', label: 'Average return on bills', unit: 'pct', expected: mb, explain: `(${bills.join(' + ')}) ÷ ${n}.` },
      ],
      solve: (v) => v.ms - v.mb,
      answer: { label: 'Average risk premium', unit: 'pct', explain: `${pct(ms, 2)} − ${pct(mb, 2)} = ${pct(prem, 2)}.`, tolerance: 0.05 },
      decision: {
        question: 'Over this period, were investors paid for taking risk?',
        options: yesNo('Yes', 'No'),
        correct: prem > 0 ? 'yes' : 'no',
        why: [
          { id: 'pos', label: 'Shares returned more than bills on average, so the premium is positive' },
          { id: 'neg', label: 'Shares returned less than bills on average, so the premium is negative' },
          { id: 'long', label: 'Premiums are positive in every period, whatever the data say' },
        ],
        correctWhy: prem > 0 ? 'pos' : 'neg',
        explain: `Average premium ${pct(prem, 2)}. A short run can go either way; over decades the premium has been positive.`,
      },
      working: [`\\bar{R}_{shares} = ${w2(ms)}\\%,\\quad \\bar{R}_{bills} = ${w2(mb)}\\%`, `\\text{Premium} = ${w2(ms)} - ${w2(mb)} = ${w2(prem)}\\%`],
      hints: { timeline: 'One return a year.', formula: 'Risky minus risk-free.', inputs: 'Average each series first.', answer: 'Shares minus bills.', decision: 'Is the premium positive?' },
      news: `The average premium was ${pct(prem, 2)}.`,
      cfoLine: `Average risk premium ${pct(prem, 2)}.`,
    });
  },
});

export const realStockAverage: CalcProblem = defineCalc({
  kind: 'calc',
  id: 'real-stock-average',
  title: 'Real returns, year by year',
  host: 'margaux',
  concept: 'risk-premium',
  uses: ['returns', 'real-nominal'],
  base: { stocks: [-14.5, -28.3, -43.9], infl: [-0.2, -6, -9.5] },
  vary: (rng) => ({ stocks: range(1, 3).map(() => pickInt(rng, -30, 40)), infl: range(1, 3).map(() => pickRate(rng, -8, 14, 0.5)) }),
  build: ({ stocks, infl }) => {
    const real = stocks.map((s, i) => fin.realRate(s / 100, infl[i] / 100) * 100);
    const avg = fin.mean(real);
    const n = stocks.length;
    return make({
      prompt: [
        { who: 'margaux', text: `Shares returned ${list(stocks)} over ${word(n)} years. Inflation in those years was ${list(infl)}.` },
        { who: 'margaux', text: 'Prices fell in some of them, which makes the real figures behave oddly. Work each year out separately.' },
      ],
      ask: 'What was the average real return on shares? Did they beat inflation on average?',
      timeline: yearlyReturns('Nominal return on shares', n),
      formula: { options: ['real-rate', 'nominal-minus', 'risk-premium', 'holding-return'], correct: 'real-rate', explain: 'Real return each year = (1 + nominal) ÷ (1 + inflation) − 1. Then average the three.' },
      inputs: real.map((r, i) => ({ key: `r${i}`, symbol: `R^{real}_{${i + 1}}`, label: `Real return, year ${i + 1}`, unit: 'pct' as const, expected: r, explain: `(1 ${stocks[i] < 0 ? '−' : '+'} ${Math.abs(stocks[i] / 100)}) ÷ (1 ${infl[i] < 0 ? '−' : '+'} ${Math.abs(infl[i] / 100)}) − 1 = ${pct(r, 2)}.` })),
      solve: (v) => fin.mean(real.map((_, i) => v[`r${i}`])),
      answer: { label: 'Average real return', unit: 'pct', explain: `(${real.map((r) => signed(r, 2)).join(' + ')}) ÷ ${n} = ${pct(avg, 2)}.`, tolerance: 0.05 },
      decision: {
        question: 'Did shares beat inflation on average?',
        options: yesNo('Yes', 'No'),
        correct: avg > 0 ? 'yes' : 'no',
        why: [
          { id: 'pos', label: 'The average real return is positive' },
          { id: 'neg', label: 'The average real return is negative' },
          { id: 'nominal', label: 'The average nominal return is what counts' },
        ],
        correctWhy: avg > 0 ? 'pos' : 'neg',
        explain: `Average real return ${pct(avg, 2)}.`,
      },
      working: real.map((r, i) => `\\text{Year ${i + 1}: } \\frac{1 + ${rd(stocks[i])}}{1 + ${rd(infl[i])}} - 1 = ${w2(r)}\\%`).concat([`\\text{Average} = ${w2(avg)}\\%`]),
      hints: { timeline: 'One return a year.', formula: 'Divide by the inflation factor.', inputs: 'One real return for each year.', answer: 'Add them up and divide by the number of years.', decision: 'Is the average above zero?' },
      news: `Shares averaged ${pct(avg, 2)} in real terms.`,
      cfoLine: `Average real return ${pct(avg, 2)}.`,
    });
  },
});

// ---------------------------------------------------------------- spread of returns

export const stockSd: CalcProblem = defineCalc({
  kind: 'calc',
  id: 'stock-sd',
  title: 'How wild is Idris’s friend’s stock?',
  host: 'idris',
  concept: 'spread-risk',
  uses: ['returns'],
  base: { rets: [10, -5, 15, 20, 10], bench: 12 },
  vary: (rng) => {
    const rets = range(1, 5).map(() => pickInt(rng, -15, 30));
    const sd = fin.stdDev(rets) || 5;
    return { rets, bench: Math.round(sd * pickOne(rng, [0.6, 0.8, 1.3, 1.7])) };
  },
  build: ({ rets, bench }) => {
    const m = fin.mean(rets);
    const v = fin.variance(rets);
    const sd = Math.sqrt(v);
    const n = rets.length;
    return make({
      prompt: [
        { who: 'idris', text: `A friend of mine runs a little textile firm. Its shares returned ${list(rets)} over the last ${word(n)} years. Steady as a rock.` },
        { who: 'margaux', text: `The broad market index has a standard deviation of ${pct(bench)} a year. Let’s see how steady your friend’s firm really is.` },
      ],
      ask: 'What is the standard deviation of the firm’s returns? Is it riskier than the index?',
      timeline: yearlyReturns('Return on the firm’s shares', n),
      formula: { options: ['var-past', 'var-forecast', 'covariance', 'exp-forecast'], correct: 'var-past', explain: 'These are past returns, so each year counts equally: average the squared distances from the mean, then take the square root.' },
      inputs: [
        { key: 'm', symbol: '\\bar{R}', label: 'Average return', unit: 'pct', expected: m, explain: `(${rets.map((x) => signed(x)).join(' + ')}) ÷ ${n}.` },
        { key: 'v', symbol: '\\sigma^{2}', label: 'Variance', unit: 'number', expected: v, explain: `Sum of squared distances from ${w2(m)}, divided by ${n}.` },
      ],
      solve: (x) => Math.sqrt(x.v),
      answer: { label: 'Standard deviation', unit: 'pct', explain: `Variance ${w2(v)}, so σ = ${pct(sd, 2)}.`, tolerance: 0.05 },
      decision: {
        question: `Is it riskier than the index (SD ${pct(bench)})?`,
        options: yesNo('Yes, riskier', 'No, less risky'),
        correct: sd > bench ? 'yes' : 'no',
        why: [
          { id: 'higher', label: 'Its standard deviation is higher, so its returns are more spread out' },
          { id: 'lower', label: 'Its standard deviation is lower, so its returns are less spread out' },
          { id: 'mean', label: 'Its average return is higher' },
        ],
        correctWhy: sd > bench ? 'higher' : 'lower',
        explain: `${pct(sd, 2)} against ${pct(bench)}.`,
      },
      working: [`\\bar{R} = ${w2(m)}\\%`, `\\sigma^{2} = \\frac{${rets.map((x) => `(${signed(x - m, 2)})^{2}`).join(' + ')}}{${n}} = ${w2(v)}`, `\\sigma = \\sqrt{${w2(v)}} = ${w2(sd)}\\%`],
      hints: { timeline: 'One return a year.', formula: 'Past data: every year weighs the same.', inputs: 'Mean first, then the squared distances.', answer: 'Take the square root of the variance.', decision: 'Compare the two SDs.' },
      news: `The firm’s standard deviation is ${pct(sd, 2)}.`,
      cfoLine: `SD ${pct(sd, 2)} against ${pct(bench)}.`,
    });
  },
});

export const threeStates: CalcProblem = defineCalc({
  kind: 'calc',
  id: 'three-states',
  title: 'The analyst’s forecast',
  host: 'celine',
  concept: 'spread-risk',
  uses: ['returns'],
  base: { ps: [30, 40, 30], rs: [25, 10, -5], safeSd: 8 },
  vary: (rng) => {
    const ps = pickOne(rng, [[30, 40, 30], [25, 50, 25], [20, 50, 30], [30, 50, 20]]);
    const rs = [pickInt(rng, 15, 40), pickInt(rng, 6, 14), pickInt(rng, -15, 3)];
    const sd = Math.sqrt(fin.varianceFromProbs(ps.map((p) => p / 100), rs));
    return { ps, rs, safeSd: Math.max(2, Math.round(sd * pickOne(rng, [0.5, 0.75, 1.4, 1.8]))) };
  },
  build: ({ ps, rs, safeSd }) => {
    const p = ps.map((x) => x / 100);
    const e = fin.expectedReturn(p, rs);
    const v = fin.varianceFromProbs(p, rs);
    const sd = Math.sqrt(v);
    return make({
      prompt: [
        { who: 'celine', text: `My analyst thinks next year’s return on a new label’s shares depends on the economy: ${pct(ps[0])} chance of a boom (${pc(rs[0])}), ${pct(ps[1])} of a normal year (${pc(rs[1])}) and ${pct(ps[2])} of a recession (${pc(rs[2])}).` },
        { who: 'margaux', text: `A bond fund offers the same expected return, with a standard deviation of ${pct(safeSd)}.` },
      ],
      ask: 'What is the standard deviation of the share’s return? Which would a risk-averse investor choose?',
      timeline: oneYear('Money invested', 'Money back: one of three outcomes', 'One year ahead, with one of three outcomes.'),
      formula: { options: ['var-forecast', 'var-past', 'exp-forecast', 'covariance'], correct: 'var-forecast', explain: 'A forecast with probabilities: weight each squared distance from the expected return by its probability.' },
      inputs: [
        { key: 'e', symbol: 'E[R]', label: 'Expected return', unit: 'pct', expected: e, explain: `${ps.map((x, i) => `${x / 100} × ${signed(rs[i])}`).join(' + ')} = ${pct(e, 2)}.` },
        { key: 'v', symbol: '\\sigma^{2}', label: 'Variance', unit: 'number', expected: v, explain: `Each squared distance from ${w2(e)}, weighted by its probability.` },
      ],
      solve: (x) => Math.sqrt(x.v),
      answer: { label: 'Standard deviation', unit: 'pct', explain: `Variance ${w2(v)}, so σ = ${pct(sd, 2)}.`, tolerance: 0.05 },
      decision: {
        question: 'Same expected return. Which would a risk-averse investor prefer?',
        options: [
          { id: 'shares', label: 'The shares' },
          { id: 'fund', label: 'The bond fund' },
        ],
        correct: sd > safeSd ? 'fund' : 'shares',
        why: [
          { id: 'less', label: 'For the same expected return, investors prefer less risk' },
          { id: 'more', label: 'Higher risk means higher reward, so more risk is better' },
        ],
        correctWhy: 'less',
        explain: `Shares: SD ${pct(sd, 2)}; fund: SD ${pct(safeSd)}. Equal return, so the lower SD wins.`,
      },
      working: [`E[R] = ${ps.map((x, i) => `${x / 100}(${signed(rs[i])})`).join(' + ')} = ${w2(e)}\\%`, `\\sigma^{2} = ${ps.map((x, i) => `${x / 100}(${signed(rs[i] - e, 2)})^{2}`).join(' + ')} = ${w2(v)}`, `\\sigma = ${w2(sd)}\\%`],
      hints: { timeline: 'One year; the outcome is uncertain.', formula: 'Probabilities are the weights.', inputs: 'Expected return first.', answer: 'Square root of the variance.', decision: 'Same return, so compare the risk.' },
      news: `The share’s standard deviation is ${pct(sd, 2)}.`,
      cfoLine: `E ${pct(e, 2)}, SD ${pct(sd, 2)}.`,
    });
  },
});

// ---------------------------------------------------------------- covariance

export const twoStockCov: CalcProblem = defineCalc({
  kind: 'calc',
  id: 'two-stock-cov',
  title: 'Do these two move together?',
  host: 'margaux',
  concept: 'covariance',
  uses: ['spread-risk'],
  base: { x: [14, 22, 6, -2, 10], y: [17, 11, -1, 5, 8] },
  vary: (rng) => {
    let x: number[] = [];
    let y: number[] = [];
    do {
      x = range(1, 5).map(() => pickInt(rng, -5, 25));
      y = range(1, 5).map(() => pickInt(rng, -5, 25));
    } while (fin.stdDev(x) < 3 || fin.stdDev(y) < 3);
    return { x, y };
  },
  build: ({ x, y }) => {
    const cov = fin.covariance(x, y);
    const sx = fin.stdDev(x);
    const sy = fin.stdDev(y);
    const rho = cov / (sx * sy);
    const n = x.length;
    return make({
      prompt: [
        { who: 'margaux', text: `Two shares we might hold together. Over ${word(n)} years, Stock X returned ${list(x)} and Stock Y returned ${list(y)}.` },
        { who: 'celine', text: 'Same sector, same sort of customers. They surely move in lockstep.' },
      ],
      ask: 'What is the correlation between X and Y? Would Y add a good diversification benefit next to X?',
      timeline: yearlyReturns('Returns on X and Y', n),
      formula: { options: ['correlation', 'covariance', 'var-past', 'portfolio-sd'], correct: 'correlation', explain: 'Correlation = covariance ÷ (σX × σY): the co-movement scaled to between −1 and +1.' },
      inputs: [
        { key: 'c', symbol: '\\text{Cov}(X,Y)', label: 'Covariance', unit: 'number', expected: cov, explain: 'The average of the products of the two deviations.' },
        { key: 'sx', symbol: '\\sigma_{X}', label: 'Standard deviation of X', unit: 'pct', expected: sx, explain: `Mean ${w2(fin.mean(x))}.` },
        { key: 'sy', symbol: '\\sigma_{Y}', label: 'Standard deviation of Y', unit: 'pct', expected: sy, explain: `Mean ${w2(fin.mean(y))}.` },
      ],
      solve: (v) => v.c / (v.sx * v.sy),
      answer: { label: 'Correlation', unit: 'number', explain: `${w2(cov)} ÷ (${w2(sx)} × ${w2(sy)}) = ${w2(rho)}.`, tolerance: 0.01 },
      decision: {
        question: 'Is the correlation low enough (below 0.5) to give a good diversification benefit?',
        options: yesNo('Yes', 'No'),
        correct: rho < 0.5 ? 'yes' : 'no',
        why: [
          { id: 'low', label: 'The lower the correlation, the more risk diversification removes' },
          { id: 'high', label: 'A high correlation means the stocks cancel each other out' },
          { id: 'sign', label: 'Any positive correlation removes all the risk' },
        ],
        correctWhy: 'low',
        explain: `ρ = ${w2(rho)}. At +1, diversification removes nothing; the lower, the better.`,
      },
      working: [`\\text{Cov} = ${w2(cov)},\\ \\sigma_{X} = ${w2(sx)},\\ \\sigma_{Y} = ${w2(sy)}`, `\\rho = \\frac{${w2(cov)}}{${w2(sx)} \\times ${w2(sy)}} = ${w2(rho)}`],
      hints: { timeline: 'One return a year for each stock.', formula: 'Scale the covariance.', inputs: 'Work out each deviation from its own mean.', answer: 'Covariance ÷ both SDs.', decision: 'Lower is better for diversification.' },
      news: `The correlation is ${w2(rho)}.`,
      cfoLine: `ρ = ${w2(rho)}.`,
    });
  },
});

export const covSign: CalcProblem = defineCalc({
  kind: 'calc',
  id: 'cov-sign',
  title: 'Boom and bust together?',
  host: 'celine',
  concept: 'covariance',
  uses: ['spread-risk'],
  base: { ps: [30, 40, 30], a: [25, 10, -5], b: [-10, 4, 20] },
  vary: (rng) => {
    const ps = pickOne(rng, [[30, 40, 30], [25, 50, 25], [20, 50, 30], [30, 50, 20]]);
    let a: number[] = [];
    let b: number[] = [];
    do {
      a = [pickInt(rng, 15, 40), pickInt(rng, 6, 14), pickInt(rng, -15, 3)];
      b = pickOne(rng, [[pickInt(rng, 10, 35), pickInt(rng, 3, 12), pickInt(rng, -10, 4)], [pickInt(rng, -12, 0), pickInt(rng, 2, 8), pickInt(rng, 10, 30)]]);
    } while (Math.abs(fin.covarianceFromProbs(ps.map((p) => p / 100), a, b)) < 15);
    return { ps, a, b };
  },
  build: ({ ps, a, b }) => {
    const p = ps.map((x) => x / 100);
    const ea = fin.expectedReturn(p, a);
    const eb = fin.expectedReturn(p, b);
    const cov = fin.covarianceFromProbs(p, a, b);
    return make({
      prompt: [
        { who: 'celine', text: `Two shares, three possible years. Boom (${pct(ps[0])}): A ${pc(a[0])}, B ${pc(b[0])}. Normal (${pct(ps[1])}): A ${pc(a[1])}, B ${pc(b[1])}. Recession (${pct(ps[2])}): A ${pc(a[2])}, B ${pc(b[2])}.` },
        { who: 'margaux', text: 'Do they rise and fall together, or does one cushion the other?' },
      ],
      ask: 'What is the covariance of A and B? How do they move?',
      timeline: oneYear('Money invested', 'Money back: one of three outcomes', 'One year ahead, with one of three outcomes.'),
      formula: { options: ['covariance', 'correlation', 'var-forecast', 'portfolio-sd'], correct: 'covariance', explain: 'With probabilities: weight each product of the two deviations by its probability.' },
      inputs: [
        { key: 'ea', symbol: 'E[R_{A}]', label: 'Expected return on A', unit: 'pct', expected: ea, explain: `${ps.map((x, i) => `${x / 100} × ${signed(a[i])}`).join(' + ')}.` },
        { key: 'eb', symbol: 'E[R_{B}]', label: 'Expected return on B', unit: 'pct', expected: eb, explain: `${ps.map((x, i) => `${x / 100} × ${signed(b[i])}`).join(' + ')}.` },
      ],
      solve: (v) => ps.reduce((s, x, i) => s + (x / 100) * (a[i] - v.ea) * (b[i] - v.eb), 0),
      answer: { label: 'Covariance of A and B', unit: 'number', explain: `Sum of probability × (A − ${w2(ea)}) × (B − ${w2(eb)}) = ${w2(cov)}.`, tolerance: 0.5 },
      decision: {
        question: 'How do A and B tend to move?',
        options: [
          { id: 'together', label: 'Together' },
          { id: 'opposite', label: 'In opposite directions' },
        ],
        correct: cov > 0 ? 'together' : 'opposite',
        why: [
          { id: 'sign', label: 'The sign of the covariance gives the direction of co-movement' },
          { id: 'size', label: 'The bigger the covariance, the lower the risk' },
        ],
        correctWhy: 'sign',
        explain: `Covariance ${w2(cov)}: ${cov > 0 ? 'positive, so they tend to move together' : 'negative, so one tends to cushion the other'}.`,
      },
      working: [`E[R_{A}] = ${w2(ea)}\\%,\\quad E[R_{B}] = ${w2(eb)}\\%`, `\\text{Cov} = ${ps.map((x, i) => `${x / 100}(${signed(a[i] - ea, 2)})(${signed(b[i] - eb, 2)})`).join(' + ')} = ${w2(cov)}`],
      hints: { timeline: 'One year, three outcomes.', formula: 'Probabilities weight the products.', inputs: 'Both expected returns first.', answer: 'Multiply the two deviations in each state.', decision: 'Look at the sign.' },
      news: `Covariance ${w2(cov)}.`,
      cfoLine: `Cov(A,B) = ${w2(cov)}.`,
    });
  },
});

// ---------------------------------------------------------------- portfolios

export const mixTwoStocks: CalcProblem = defineCalc({
  kind: 'calc',
  id: 'mix-two-stocks',
  title: 'Hyacinth’s two stocks',
  host: 'rupert',
  concept: 'portfolio-risk',
  uses: ['covariance'],
  base: { w: 60, s1: 10, s2: 20, rho: 0.5 },
  vary: (rng) => ({ w: pickOne(rng, [30, 40, 50, 60, 70]), s1: pickInt(rng, 8, 24, 2), s2: pickInt(rng, 12, 36, 2), rho: pickOne(rng, [1, 0.5, 0, -0.5, 0.8, 0.2, 1]) }),
  build: ({ w, s1, s2, rho }) => {
    const sd = fin.portfolioSd(w / 100, s1, s2, rho);
    const avg = (w / 100) * s1 + (1 - w / 100) * s2;
    const helps = sd < avg - 1e-9;
    return make({
      prompt: [
        { who: 'rupert', text: `Hyacinth Macaw puts ${pct(w)} of her money in Stock I and the rest in Stock J. Stock I has a standard deviation of ${pct(s1)}; Stock J ${pct(s2)}.` },
        { who: 'rupert', text: `The correlation between their returns is ${rho}.` },
      ],
      ask: 'What is the standard deviation of her portfolio? Is it lower than the weighted average of the two SDs?',
      timeline: oneYear('Money split across I and J', 'Value of the portfolio', 'One year ahead.'),
      formula: { options: ['portfolio-sd', 'portfolio-return', 'var-past', 'correlation'], correct: 'portfolio-sd', explain: 'Portfolio variance = w₁²σ₁² + w₂²σ₂² + 2w₁w₂ρσ₁σ₂. Then take the square root.' },
      inputs: [
        { key: 'w', symbol: 'w_{1}', label: 'Weight in Stock I', unit: 'pct', expected: w, explain: `${pct(w)}; Stock J gets ${pct(100 - w)}.` },
        { key: 's1', symbol: '\\sigma_{1}', label: 'SD of Stock I', unit: 'pct', expected: s1, explain: `${pct(s1)}.` },
        { key: 's2', symbol: '\\sigma_{2}', label: 'SD of Stock J', unit: 'pct', expected: s2, explain: `${pct(s2)}.` },
        { key: 'rho', symbol: '\\rho', label: 'Correlation', unit: 'number', expected: rho, explain: 'Between −1 and +1.' },
      ],
      solve: (v) => fin.portfolioSd(v.w / 100, v.s1, v.s2, v.rho),
      answer: { label: 'Portfolio standard deviation', unit: 'pct', explain: `Variance ${w2(sd * sd)}, so σ = ${pct(sd, 2)}. Weighted average of the SDs: ${pct(avg, 2)}.`, tolerance: 0.05 },
      decision: {
        question: `Is the portfolio’s SD below the weighted average of the two SDs (${pct(avg, 2)})?`,
        options: yesNo('Yes', 'No'),
        correct: helps ? 'yes' : 'no',
        why: [
          { id: 'lt1', label: 'The correlation is below +1, so diversification removes some risk' },
          { id: 'eq1', label: 'The correlation is +1, so diversification removes nothing' },
          { id: 'always', label: 'Combining stocks always lowers risk' },
        ],
        correctWhy: helps ? 'lt1' : 'eq1',
        explain: `${pct(sd, 2)} against ${pct(avg, 2)}. Only at ρ = +1 are they equal.`,
      },
      working: [`\\sigma_{p}^{2} = ${w4(w / 100)}^{2}(${s1})^{2} + ${w4(1 - w / 100)}^{2}(${s2})^{2} + 2(${w4(w / 100)})(${w4(1 - w / 100)})(${rho})(${s1})(${s2})`, `\\sigma_{p}^{2} = ${w2(sd * sd)},\\quad \\sigma_{p} = ${w2(sd)}\\%`],
      hints: { timeline: 'One year, one portfolio.', formula: 'Three terms, then a square root.', inputs: 'The second stock’s weight is 1 minus the first.', answer: 'Don’t forget the square root.', decision: 'Compare with the plain weighted average.' },
      news: `The portfolio’s standard deviation is ${pct(sd, 2)}.`,
      cfoLine: `Portfolio SD ${pct(sd, 2)}.`,
    });
  },
});

export const scroogePortfolio: CalcProblem = defineCalc({
  kind: 'calc',
  id: 'scrooge-portfolio',
  title: 'Mr Scrooge’s portfolio',
  host: 'idris',
  concept: 'portfolio-risk',
  uses: ['covariance'],
  base: { w: 60, ea: 15, sa: 20, eb: 20, sb: 22, rho: 0.5 },
  vary: (rng) => {
    const ea = pickInt(rng, 8, 15);
    const sa = pickInt(rng, 12, 25);
    return { w: pickOne(rng, [40, 50, 60, 70]), ea, sa, eb: ea + pickOne(rng, [-3, 2, 5, 5]), sb: sa + pickOne(rng, [-6, 2, 5, 8]), rho: pickOne(rng, [0, 0.3, 0.5, 0.8, -0.2]) };
  },
  build: ({ w, ea, sa, eb, sb, rho }) => {
    const wa = w / 100;
    const e = fin.portfolioReturn(wa, ea, eb);
    const v = fin.portfolioVariance(wa, sa, sb, rho);
    const sd = Math.sqrt(v);
    const better = e >= ea && sd <= sa && (e > ea || sd < sa);
    const worse = e <= ea && sd >= sa && (e < ea || sd > sa);
    const call = better ? 'better' : worse ? 'worse' : 'unclear';
    return make({
      prompt: [
        { who: 'idris', text: `Ebenezer Scrooge has put ${pct(w)} of his money in share A and the rest in share B. A: expected return ${pct(ea)}, SD ${pct(sa)}. B: expected return ${pct(eb)}, SD ${pct(sb)}.` },
        { who: 'idris', text: `The correlation between the two is ${rho}.` },
      ],
      ask: 'What are the portfolio’s expected return and standard deviation? Is it better or worse than putting everything in A?',
      timeline: oneYear('Money split across A and B', 'Value of the portfolio', 'One year ahead.'),
      formula: { options: ['portfolio-sd', 'portfolio-return', 'beta', 'correlation'], correct: 'portfolio-sd', explain: 'The return is a weighted average; the risk needs the full two-stock formula, with the correlation.' },
      inputs: [
        { key: 'e', symbol: 'E[R_{p}]', label: 'Portfolio expected return', unit: 'pct', expected: e, explain: `${w4(wa)} × ${ea} + ${w4(1 - wa)} × ${eb} = ${pct(e, 2)}.` },
        { key: 'v', symbol: '\\sigma_{p}^{2}', label: 'Portfolio variance', unit: 'number', expected: v, explain: 'w₁²σ₁² + w₂²σ₂² + 2w₁w₂ρσ₁σ₂.' },
      ],
      solve: (x) => Math.sqrt(x.v),
      answer: { label: 'Portfolio standard deviation', unit: 'pct', explain: `Expected return ${pct(e, 2)}; variance ${w2(v)}, so σ = ${pct(sd, 2)}.`, tolerance: 0.05 },
      decision: {
        question: `Compared with everything in A (${pct(ea)}, SD ${pct(sa)}): better, worse, or can’t say?`,
        options: [
          { id: 'better', label: 'Better' },
          { id: 'worse', label: 'Worse' },
          { id: 'unclear', label: 'Can’t say' },
        ],
        correct: call,
        why: [
          { id: 'dom', label: 'It offers at least as much return for no more risk, and better on one of them' },
          { id: 'domd', label: 'It offers no more return for at least as much risk' },
          { id: 'trade', label: 'It trades more return for more risk, or less for less, so it depends on the investor' },
        ],
        correctWhy: better ? 'dom' : worse ? 'domd' : 'trade',
        explain: `Portfolio: ${pct(e, 2)} return, SD ${pct(sd, 2)}. All in A: ${pct(ea)}, SD ${pct(sa)}.`,
      },
      working: [`E[R_{p}] = ${w4(wa)}(${ea}) + ${w4(1 - wa)}(${eb}) = ${w2(e)}\\%`, `\\sigma_{p}^{2} = ${w4(wa)}^{2}(${sa})^{2} + ${w4(1 - wa)}^{2}(${sb})^{2} + 2(${w4(wa)})(${w4(1 - wa)})(${rho})(${sa})(${sb}) = ${w2(v)}`, `\\sigma_{p} = ${w2(sd)}\\%`],
      hints: { timeline: 'One year, one portfolio.', formula: 'Return: weighted average. Risk: three terms.', inputs: 'Expected return first.', answer: 'Root of the variance.', decision: 'More return and less risk is better; a trade-off is a matter of taste.' },
      news: `Mr Scrooge’s portfolio: ${pct(e, 2)}, SD ${pct(sd, 2)}.`,
      cfoLine: `Portfolio ${pct(e, 2)} / ${pct(sd, 2)}.`,
    });
  },
});

// ---------------------------------------------------------------- beta and CAPM

export const stockBeta: CalcProblem = defineCalc({
  kind: 'calc',
  id: 'stock-beta',
  title: 'How hard does it swing?',
  host: 'rupert',
  concept: 'beta',
  uses: ['covariance'],
  base: { m1: -10, m2: 10, b: 2 },
  vary: (rng) => ({ m1: -10, m2: 10, b: pickOne(rng, [-1, -0.5, 0, 0.5, 0.8, 1.2, 1.5, 2]) }),
  build: ({ m1, m2, b }) => {
    const s1 = Math.round(b * m1 * 10) / 10;
    const s2 = Math.round(b * m2 * 10) / 10;
    const beta = (s2 - s1) / (m2 - m1);
    const call = beta > 1 ? 'amplifies' : beta >= 0 ? 'dampens' : 'opposes';
    return make({
      prompt: [
        { who: 'rupert', text: `I’ve tracked a stock against the market. When the market returned ${pc(m1)}, the stock returned ${pc(s1)}. When the market returned ${pc(m2)}, it returned ${pc(s2)}.` },
        { who: 'margaux', text: 'Two points, so a straight line. What’s its slope?' },
      ],
      ask: 'What is the stock’s beta? Does it amplify, dampen or oppose market moves?',
      timeline: oneYear('Money invested', 'Value of the stock after the market moves', 'One year, in two possible market years.'),
      formula: { options: ['beta', 'correlation', 'capm', 'portfolio-beta'], correct: 'beta', explain: 'Beta is the slope of the stock’s returns on the market’s: the change in the stock’s return per unit change in the market’s.' },
      inputs: [
        { key: 'ds', symbol: '\\Delta R_{stock}', label: 'Change in the stock’s return between the two years', unit: 'pct', expected: s2 - s1, explain: `${pc(s2)} − (${pc(s1)}).` },
        { key: 'dm', symbol: '\\Delta R_{m}', label: 'Change in the market’s return between the two years', unit: 'pct', expected: m2 - m1, explain: `${pc(m2)} − (${pc(m1)}).` },
      ],
      solve: (v) => v.ds / v.dm,
      answer: { label: 'Beta', unit: 'number', explain: `${w2(s2 - s1)} ÷ ${w2(m2 - m1)} = ${w2(beta)}.`, tolerance: 0.01 },
      decision: {
        question: 'What does it do to market moves?',
        options: [
          { id: 'amplifies', label: 'Amplifies them (β above 1)' },
          { id: 'dampens', label: 'Dampens them (β between 0 and 1)' },
          { id: 'opposes', label: 'Moves against them (β below 0)' },
        ],
        correct: call,
        why: [
          { id: 'slope', label: 'Beta is the slope: how many points the stock moves per point the market moves' },
          { id: 'sd', label: 'Beta is the stock’s own standard deviation' },
        ],
        correctWhy: 'slope',
        explain: `β = ${w2(beta)}.`,
      },
      working: [`\\beta = \\frac{${w2(s2)} - (${w2(s1)})}{${m2} - (${m1})} = ${w2(beta)}`],
      hints: { timeline: 'One year.', formula: 'A slope: rise over run.', inputs: 'Differences, not levels.', answer: 'Stock change ÷ market change.', decision: 'Compare beta with 1 and 0.' },
      news: `The stock’s beta is ${w2(beta)}.`,
      cfoLine: `β = ${w2(beta)}.`,
    });
  },
});

export const portfolioBeta: CalcProblem = defineCalc({
  kind: 'calc',
  id: 'portfolio-beta',
  title: 'The beta of the whole basket',
  host: 'margaux',
  concept: 'beta',
  uses: ['portfolio-risk'],
  base: { w: 50, b1: 1.2, b2: 1.4 },
  vary: (rng) => ({ w: pickOne(rng, [20, 30, 40, 50, 60, 70]), b1: pickRate(rng, 0.5, 1.5, 0.1), b2: pickRate(rng, 0.7, 1.7, 0.1) }),
  build: ({ w, b1, b2 }) => {
    const b = fin.weightedAverage([w / 100, 1 - w / 100], [b1, b2]);
    return make({
      prompt: [
        { who: 'margaux', text: `We could build a basket of ten shares in two groups. ${pct(w)} of the money goes into the first group, whose shares each have a beta of ${b1}. The rest goes into the second group, each with a beta of ${b2}.` },
        { who: 'rupert', text: 'A well-spread basket will have a beta below either group’s, surely. Diversification!' },
      ],
      ask: 'What is the basket’s beta? Will it swing more than the market?',
      timeline: oneYear('Money split across the basket', 'Value after a year', 'One year.'),
      formula: { options: ['portfolio-beta', 'beta', 'portfolio-sd', 'capm'], correct: 'portfolio-beta', explain: 'Betas average: a portfolio’s beta is the weighted average of its holdings’ betas. Diversification doesn’t lower it.' },
      inputs: [
        { key: 'w', symbol: 'w_{1}', label: 'Share of the money in the first group', unit: 'pct', expected: w, explain: `${pct(w)}.` },
        { key: 'b1', symbol: '\\beta_{1}', label: 'Beta of the first group', unit: 'number', expected: b1, explain: `${b1}.` },
        { key: 'b2', symbol: '\\beta_{2}', label: 'Beta of the second group', unit: 'number', expected: b2, explain: `${b2}.` },
      ],
      solve: (v) => (v.w / 100) * v.b1 + (1 - v.w / 100) * v.b2,
      answer: { label: 'Portfolio beta', unit: 'number', explain: `${w2(w / 100)} × ${b1} + ${w2(1 - w / 100)} × ${b2} = ${w2(b)}.`, tolerance: 0.01 },
      decision: {
        question: 'Will the basket swing more than the market?',
        options: yesNo('Yes (β above 1)', 'No (β below 1)'),
        correct: b > 1 ? 'yes' : 'no',
        why: [
          { id: 'avg', label: 'Its beta is the weighted average of the betas, compared with 1' },
          { id: 'div', label: 'Diversification pushes every portfolio’s beta towards 0' },
        ],
        correctWhy: 'avg',
        explain: `β = ${w2(b)}. Diversification removes specific risk, not market risk, so it doesn’t change the average beta.`,
      },
      working: [`\\beta_{p} = ${w2(w / 100)}(${b1}) + ${w2(1 - w / 100)}(${b2}) = ${w2(b)}`],
      hints: { timeline: 'One year.', formula: 'Weighted average.', inputs: 'The second weight is 1 minus the first.', answer: 'Weights times betas.', decision: 'Is it above 1?' },
      news: `The basket’s beta is ${w2(b)}.`,
      cfoLine: `Basket β = ${w2(b)}.`,
    });
  },
});

export const requiredReturn: CalcProblem = defineCalc({
  kind: 'calc',
  id: 'required-return',
  title: 'What should it earn?',
  host: 'margaux',
  concept: 'capm',
  uses: ['beta'],
  base: { rf: 4, rm: 12, beta: 0.8, expected: 9.8 },
  vary: (rng) => {
    const rf = pickRate(rng, 2, 6, 0.5);
    const rm = rf + pickRate(rng, 4, 9, 0.5);
    const beta = pickRate(rng, 0.5, 1.8, 0.1);
    const req = fin.capm(rf, beta, rm);
    return { rf, rm, beta, expected: Math.round((req + pickOne(rng, [-1.5, -0.6, 0.6, 1.4])) * 10) / 10 };
  },
  build: ({ rf, rm, beta, expected }) => {
    const req = fin.capm(rf, beta, rm);
    const good = expected > req;
    return make({
      prompt: [
        { who: 'margaux', text: `The Treasury bill rate is ${pct(rf)}, and the market is expected to return ${pct(rm)}.` },
        { who: 'rupert', text: `A holding company has a beta of ${beta}. It’s offering an expected return of ${pct(expected)}.` },
      ],
      ask: 'What return does CAPM say it should offer? Is it worth buying?',
      timeline: oneYear('Money invested', 'Value after a year', 'One year.'),
      formula: { options: ['capm', 'capm-beta', 'risk-premium', 'beta'], correct: 'capm', explain: 'CAPM: required return = risk-free rate + beta × (market return − risk-free rate).' },
      inputs: [
        { key: 'rf', symbol: 'R_{f}', label: 'Risk-free rate', unit: 'pct', expected: rf, explain: 'The Treasury bill rate.' },
        { key: 'rm', symbol: 'R_{m}', label: 'Expected market return', unit: 'pct', expected: rm, explain: 'Not the premium: the full market return.' },
        { key: 'b', symbol: '\\beta', label: 'Beta', unit: 'number', expected: beta, explain: `${beta}.` },
      ],
      solve: (v) => v.rf + v.b * (v.rm - v.rf),
      answer: { label: 'Required return', unit: 'pct', explain: `${pct(rf)} + ${beta} × (${pct(rm)} − ${pct(rf)}) = ${pct(req, 2)}.`, tolerance: 0.05 },
      decision: {
        question: `It offers ${pct(expected)}. Does it have a positive NPV?`,
        options: yesNo('Yes, buy', 'No, pass'),
        correct: good ? 'yes' : 'no',
        why: [
          { id: 'above', label: 'Its expected return is above the return required for its risk' },
          { id: 'below', label: 'Its expected return is below the return required for its risk' },
          { id: 'beta', label: 'Its beta is below 1, so it’s safe' },
        ],
        correctWhy: good ? 'above' : 'below',
        explain: `Offered ${pct(expected)} against ${pct(req, 2)} required.`,
      },
      working: [`R_{m} - R_{f} = ${w2(rm - rf)}\\%`, `E[R] = ${rf} + ${beta} \\times ${w2(rm - rf)} = ${w2(req)}\\%`],
      hints: { timeline: 'One year.', formula: 'Risk-free plus beta times the premium.', inputs: 'Three numbers.', answer: 'Premium first, then × beta.', decision: 'Offered against required.' },
      news: `CAPM says ${pct(req, 2)}.`,
      cfoLine: `Required ${pct(req, 2)} at β ${beta}.`,
    });
  },
});

export const impliedBeta: CalcProblem = defineCalc({
  kind: 'calc',
  id: 'implied-beta',
  title: 'What risk is the market pricing in?',
  host: 'rupert',
  concept: 'capm',
  uses: ['beta'],
  base: { rf: 4, rm: 12, r: 11.2 },
  vary: (rng) => {
    const rf = pickRate(rng, 2, 6, 0.5);
    const rm = rf + pickRate(rng, 4, 9, 0.5);
    return { rf, rm, r: Math.round((rf + pickRate(rng, 0.4, 1.7, 0.1) * (rm - rf)) * 10) / 10 };
  },
  build: ({ rf, rm, r }) => {
    const b = fin.impliedBeta(rf, r, rm);
    return make({
      prompt: [
        { who: 'margaux', text: `Bills pay ${pct(rf)} and the market is expected to return ${pct(rm)}.` },
        { who: 'rupert', text: `Investors expect ${pct(r)} from Stock X. They’re using CAPM to price it. What beta does that imply?` },
      ],
      ask: 'What beta is the market assuming for Stock X? Is it riskier than the market?',
      timeline: oneYear('Money invested', 'Value after a year', 'One year.'),
      formula: { options: ['capm-beta', 'capm', 'beta', 'risk-premium'], correct: 'capm-beta', explain: 'Turn CAPM round: β = (expected return − risk-free rate) ÷ (market return − risk-free rate).' },
      inputs: [
        { key: 'rf', symbol: 'R_{f}', label: 'Risk-free rate', unit: 'pct', expected: rf, explain: `${pct(rf)}.` },
        { key: 'rm', symbol: 'R_{m}', label: 'Market return', unit: 'pct', expected: rm, explain: `${pct(rm)}.` },
        { key: 'r', symbol: 'E[R]', label: 'Expected return on X', unit: 'pct', expected: r, explain: `${pct(r)}.` },
      ],
      solve: (v) => (v.r - v.rf) / (v.rm - v.rf),
      answer: { label: 'Implied beta', unit: 'number', explain: `(${pct(r)} − ${pct(rf)}) ÷ (${pct(rm)} − ${pct(rf)}) = ${w2(b)}.`, tolerance: 0.01 },
      decision: {
        question: 'Is Stock X riskier than the market?',
        options: yesNo('Yes (β above 1)', 'No (β below 1)'),
        correct: b > 1 ? 'yes' : 'no',
        why: [
          { id: 'prem', label: 'It offers a bigger premium than the market does, so investors see more market risk' },
          { id: 'prem-less', label: 'It offers a smaller premium than the market does, so investors see less market risk' },
        ],
        correctWhy: b > 1 ? 'prem' : 'prem-less',
        explain: `β = ${w2(b)}.`,
      },
      working: [`\\beta = \\frac{${r} - ${rf}}{${rm} - ${rf}} = ${w2(b)}`],
      hints: { timeline: 'One year.', formula: 'CAPM, turned round.', inputs: 'Three rates.', answer: 'Its premium over the market’s premium.', decision: 'Compare with 1.' },
      news: `Implied beta ${w2(b)}.`,
      cfoLine: `Implied β ${w2(b)}.`,
    });
  },
});

// ---------------------------------------------------------------- capital allocation

export const mixRiskFree: CalcProblem = defineCalc({
  kind: 'calc',
  id: 'mix-risk-free',
  title: 'How much in the market?',
  host: 'aoife',
  concept: 'capital-allocation',
  uses: ['capm', 'portfolio-risk'],
  base: { rf: 5, rm: 10, sm: 15, kind: 'sd' as 'sd' | 'ret', target: 10 },
  vary: (rng) => {
    const rf = pickRate(rng, 2, 6, 0.5);
    const rm = rf + pickRate(rng, 4, 8, 0.5);
    const sm = pickInt(rng, 12, 22);
    const kind = pickOne(rng, ['sd', 'ret'] as const);
    return { rf, rm, sm, kind, target: kind === 'sd' ? pickInt(rng, 4, 26) : Math.round((rf + pickOne(rng, [0.3, 0.6, 0.9, 1.3, 1.7]) * (rm - rf)) * 10) / 10 };
  },
  build: ({ rf, rm, sm, kind, target }) => {
    const wm = kind === 'sd' ? fin.marketWeightForSd(target, sm) : fin.marketWeightForReturn(target, rf, rm);
    const w = wm * 100;
    const borrow = wm > 1;
    const goal = kind === 'sd' ? `a portfolio standard deviation of ${pct(target)}` : `an expected return of ${pct(target)}`;
    return make({
      prompt: [
        { who: 'aoife', text: `The market portfolio is expected to return ${pct(rm)}, with a standard deviation of ${pct(sm)}. The risk-free rate is ${pct(rf)}, and you can lend or borrow at that rate.` },
        { who: 'margaux', text: `We’d like ${goal}. How should we split the pot?` },
      ],
      ask: 'What share of the money goes in the market portfolio, with the rest risk-free? Do we need to borrow?',
      timeline: oneYear('Money split: market and risk-free', 'Value after a year', 'One year.'),
      formula: kind === 'sd'
        ? { options: ['mix-sd', 'mix-return', 'portfolio-sd', 'capm'], correct: 'mix-sd', explain: 'The risk-free asset adds no risk, so portfolio SD = weight in the market × the market’s SD.' }
        : { options: ['mix-return', 'mix-sd', 'portfolio-return', 'capm'], correct: 'mix-return', explain: 'Portfolio return = risk-free rate + weight × (market return − risk-free rate); solve for the weight.' },
      inputs:
        kind === 'sd'
          ? [
              { key: 't', symbol: '\\sigma_{target}', label: 'Target standard deviation', unit: 'pct', expected: target, explain: `${pct(target)}.` },
              { key: 'sm', symbol: '\\sigma_{m}', label: 'Market standard deviation', unit: 'pct', expected: sm, explain: `${pct(sm)}.` },
            ]
          : [
              { key: 't', symbol: 'R_{target}', label: 'Target return', unit: 'pct', expected: target, explain: `${pct(target)}.` },
              { key: 'rf', symbol: 'R_{f}', label: 'Risk-free rate', unit: 'pct', expected: rf, explain: `${pct(rf)}.` },
              { key: 'rm', symbol: 'R_{m}', label: 'Market return', unit: 'pct', expected: rm, explain: `${pct(rm)}.` },
            ],
      solve: kind === 'sd' ? (v) => (v.t / v.sm) * 100 : (v) => ((v.t - v.rf) / (v.rm - v.rf)) * 100,
      answer: { label: 'Share in the market portfolio', unit: 'pct', explain: kind === 'sd' ? `${pct(target)} ÷ ${pct(sm)} = ${pct(w, 1)}.` : `(${pct(target)} − ${pct(rf)}) ÷ (${pct(rm)} − ${pct(rf)}) = ${pct(w, 1)}.`, tolerance: 0.1 },
      decision: {
        question: 'Do we need to borrow to do it?',
        options: yesNo('Yes, borrow at the risk-free rate', 'No, we lend some at the risk-free rate'),
        correct: borrow ? 'yes' : 'no',
        why: [
          { id: 'over', label: 'The weight in the market is above 100%, so the risk-free weight is negative' },
          { id: 'under', label: 'The weight in the market is below 100%, so the rest earns the risk-free rate' },
        ],
        correctWhy: borrow ? 'over' : 'under',
        explain: `${pct(w, 1)} in the market, ${pct(100 - w, 1)} risk-free${borrow ? ' (a negative weight means borrowing)' : ''}.`,
      },
      working: kind === 'sd' ? [`w_{m} = \\frac{${target}}{${sm}} = ${w4(wm)}`, `w_{rf} = 1 - ${w4(wm)} = ${w4(1 - wm)}`] : [`w_{m} = \\frac{${target} - ${rf}}{${rm} - ${rf}} = ${w4(wm)}`, `w_{rf} = 1 - ${w4(wm)} = ${w4(1 - wm)}`],
      hints: { timeline: 'One year.', formula: kind === 'sd' ? 'Risk-free has no risk.' : 'Return is linear in the weight.', inputs: kind === 'sd' ? 'Two numbers.' : 'Three numbers.', answer: kind === 'sd' ? 'Target risk ÷ market risk.' : 'Extra return wanted ÷ the market premium.', decision: 'Is the weight above 100%?' },
      news: `${pct(w, 1)} goes in the market portfolio.`,
      cfoLine: `Market weight ${pct(w, 1)}.`,
    });
  },
});

// ---------------------------------------------------------------- sorting and written answers

export const diversifyClassify: ClassifyProblem = {
  kind: 'classify',
  id: 'diversify-classify',
  title: 'Specific or market risk?',
  host: 'rupert',
  concept: 'diversification',
  prompt: ['Hold enough shares and some risks disappear. Others never do. Sort these.'],
  categories: [
    { id: 'specific', label: 'Specific risk (diversifiable)' },
    { id: 'market', label: 'Market risk (can’t be diversified away)' },
  ],
  show: 6,
  items: [
    { text: 'A fire destroys a competitor’s factory', category: 'specific', why: 'It hits one firm and not the rest of the market.' },
    { text: 'A star designer quits one label', category: 'specific', why: 'Peculiar to that company.' },
    { text: 'One firm recalls a faulty product', category: 'specific', why: 'A company-level event.' },
    { text: 'A strike at a single fabric mill', category: 'specific', why: 'Affects that mill’s customers, not the whole economy.' },
    { text: 'A deep recession', category: 'market', why: 'It hits almost every business.' },
    { text: 'A war that closes trade routes', category: 'market', why: 'An economy-wide peril.' },
    { text: 'Interest rates rise sharply', category: 'market', why: 'It affects all companies’ financing and valuations.' },
    { text: 'A banking crisis spreads across the continent', category: 'market', why: 'An economy-wide shock.' },
  ],
};

export const whyNotAllRisk: BriefProblem = {
  kind: 'brief',
  id: 'why-not-all-risk',
  title: 'Why not remove all the risk?',
  host: 'celine',
  concept: 'diversification',
  prompt: [{ who: 'celine', text: 'If diversifying is so powerful, hold a thousand shares and the risk is gone. Why isn’t it?' }],
  question: 'Explain why diversification cannot remove all the risk of a portfolio, and which risk the market rewards.',
  cards: [
    { text: 'Specific risk is peculiar to one company, so it cancels out across many shares.', kind: 'key', why: 'That’s the part diversification removes.' },
    { text: 'Market risk (recessions, wars, interest rates) affects all shares, so it remains however many you hold.', kind: 'key', why: 'Shares tend to move together because of economy-wide events.' },
    { text: 'Diversification is free, so investors are not paid a premium for bearing specific risk.', kind: 'key', why: 'No one is rewarded for risk they could avoid at no cost.' },
    { text: 'Only market risk, measured by beta, earns a risk premium.', kind: 'key', why: 'This is the starting point for CAPM.' },
    { text: 'With enough shares, every risk is removed and returns become certain.', kind: 'trap', why: 'Market risk is left.' },
    { text: 'Specific risk is the part that is rewarded with the highest returns.', kind: 'trap', why: 'It is not rewarded: it can be diversified away for free.' },
    { text: 'The S&P 500 is a portfolio of large US companies.', kind: 'filler', why: 'True, but it doesn’t answer the question.' },
  ],
  model:
    'Total risk has two parts. Specific risk belongs to individual companies and cancels out in a diversified portfolio, because it is unlikely to hit every company at once. Market risk comes from economy-wide events such as recessions and interest-rate moves, so it affects all shares and remains however many are held. Because diversification is free, investors are not rewarded for specific risk; only market risk, measured by beta, earns a risk premium.',
};

const PORTFOLIOS = [
  ['A', 10, 23],
  ['B', 12.5, 21],
  ['C', 15, 25],
  ['D', 16, 29],
  ['E', 17, 29],
  ['F', 18, 32],
  ['G', 18, 35],
  ['H', 20, 45],
] as const;
const FLAGS = fin.efficientFlags(PORTFOLIOS.map(([, r, sd]) => ({ r, sd })));

export const efficientOrNot: ClassifyProblem = {
  kind: 'classify',
  id: 'efficient-or-not',
  title: 'Efficient or not?',
  host: 'rupert',
  concept: 'capital-allocation',
  prompt: ['Eight portfolios on my desk. A portfolio is efficient if nothing else gives more return for the same risk, or the same return for less risk. Which are which?'],
  categories: [
    { id: 'efficient', label: 'Efficient' },
    { id: 'inefficient', label: 'Inefficient' },
  ],
  show: 8,
  items: PORTFOLIOS.map(([name, r, sd], i) => {
    const beater = PORTFOLIOS.find(([n, r2, sd2]) => n !== name && sd2 <= sd && r2 >= r && (sd2 < sd || r2 > r));
    return {
      text: `Portfolio ${name}: expected return ${pct(r)}, SD ${pct(sd)}`,
      category: FLAGS[i] ? 'efficient' : 'inefficient',
      why: FLAGS[i] ? 'Nothing offers more return for no more risk.' : `Portfolio ${beater![0]} offers ${beater![1] > r ? 'a higher return' : 'the same return'} with ${beater![2] < sd ? 'less risk' : 'no more risk'}.`,
    };
  }),
};

export const efficiencyClassify: ClassifyProblem = {
  kind: 'classify',
  id: 'efficiency-classify',
  title: 'Which kind of efficiency?',
  host: 'celine',
  concept: 'market-efficiency',
  prompt: ['Researchers have tested whether markets are efficient. For each piece of evidence, which form of efficiency does it speak to?'],
  categories: [
    { id: 'weak', label: 'Weak form' },
    { id: 'semi', label: 'Semi-strong form' },
    { id: 'strong', label: 'Strong form' },
  ],
  show: 6,
  items: [
    { text: 'Price changes from one day to the next are uncorrelated', category: 'weak', why: 'Past prices don’t help predict future prices: a random walk.' },
    { text: 'Chart patterns can’t be used to make money', category: 'weak', why: 'Past price information is already in today’s price.' },
    { text: 'A bid is announced and the target’s share price jumps that day, then stops moving', category: 'semi', why: 'Public news is reflected in the price immediately.' },
    { text: 'Prices react within minutes to a profit announcement', category: 'semi', why: 'Public information is quickly in the price.' },
    { text: 'Professional fund managers do no better than the index on average', category: 'strong', why: 'Even careful analysis and inside knowledge don’t beat the market.' },
    { text: 'Managers with private information fail to earn extra returns', category: 'strong', why: 'All information, even private, is already reflected.' },
  ],
};

export const whyNoPatterns: BriefProblem = {
  kind: 'brief',
  id: 'why-no-patterns',
  title: 'Why can’t charts beat the market?',
  host: 'theo',
  concept: 'market-efficiency',
  prompt: [{ who: 'theo', mood: 'happy', text: 'This share has risen from 40 to 60 and it’ll hit 80. I can see it on the chart!' }],
  question: 'Explain why past prices cannot be used to predict future prices in an efficient market.',
  cards: [
    { text: 'If a pattern predicted rising prices, people would buy now, pushing the price up now.', kind: 'key', why: 'Expected future changes are pushed into today’s price.' },
    { text: 'That buying removes the money-making opportunity, so the pattern disappears.', kind: 'key', why: 'The opportunity is competed away.' },
    { text: 'So prices follow a random walk: successive price changes are independent.', kind: 'key', why: 'This is the weak form of market efficiency.' },
    { text: 'All the information in past prices is already reflected in today’s price.', kind: 'key', why: 'Not tomorrow’s: today’s.' },
    { text: 'Prices are always equal to their true value.', kind: 'trap', why: 'Efficiency says changes can’t be predicted, not that prices are never wrong.' },
    { text: 'Past prices contain no information, so they have never been looked at.', kind: 'trap', why: 'The information was used up: that’s why it’s already in the price.' },
    { text: 'Share prices can both rise and fall.', kind: 'filler', why: 'True, but it doesn’t explain anything.' },
  ],
  model:
    'If past prices contained a pattern that predicted future gains, investors would act on it immediately, buying now and pushing the price up now. That buying competes the opportunity away. As a result all the information in past prices is already reflected in today’s price, and successive price changes are independent: prices follow a random walk. This is the weak form of market efficiency.',
};

export const ACT5_PROBLEMS: Problem[] = [
  indexReturn,
  realMarkets,
  riskPremiumYears,
  realStockAverage,
  stockSd,
  threeStates,
  twoStockCov,
  covSign,
  mixTwoStocks,
  scroogePortfolio,
  stockBeta,
  portfolioBeta,
  requiredReturn,
  impliedBeta,
  mixRiskFree,
  diversifyClassify,
  whyNotAllRisk,
  efficientOrNot,
  efficiencyClassify,
  whyNoPatterns,
];

