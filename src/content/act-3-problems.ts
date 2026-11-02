// Chapter III problems: stocks. Numbers mirror the Ch4 problem set and the stocks slides.
import * as fin from '../engine/finance';
import { eur, pct } from '../engine/format';
import { pickInt, pickOne, pickRate } from '../engine/rng';
import type { BriefProblem, ClassifyProblem, DecisionSpec, Problem } from '../engine/types';
import { dec, defineCalc, onePlus, range, rd, roundTo, w2, w4 } from './helpers';

const word = (n: number) => ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'][n] ?? String(n);

/** "Buy at the market price?" decision shared by the valuation problems. */
function buyDecision(value: number, market: number, what: string): DecisionSpec {
  const buy = value > market;
  return {
    question: `${what} trade at ${eur(market, 2)}. Buy?`,
    options: [
      { id: 'buy', label: 'Buy' },
      { id: 'pass', label: 'Pass' },
    ],
    correct: buy ? 'buy' : 'pass',
    why: [
      { id: 'cheap', label: 'Our value is above the market price' },
      { id: 'dear', label: 'Our value is below the market price' },
      { id: 'dividend', label: 'Any share that pays a dividend is worth buying' },
      { id: 'momentum', label: 'The price has been rising, so it will keep rising' },
    ],
    correctWhy: buy ? 'cheap' : 'dear',
    explain: `Worth ${eur(value, 2)} against a price of ${eur(market, 2)}: ${buy ? 'a bargain' : 'too dear'}.`,
  };
}

/** "Which is worth most?" decision for comparing against other stocks. */
function compareDecision(value: number, label: string, others: { label: string; value: number }[]): DecisionSpec {
  const all = [{ id: 'this', label, value }, ...others.map((o, i) => ({ id: `o${i}`, label: o.label, value: o.value }))];
  const best = all.reduce((a, b) => (b.value > a.value ? b : a));
  return {
    question: `Which is worth most? (${others.map((o) => `${o.label}: ${eur(o.value, 2)}`).join('; ')})`,
    options: all.map((o) => ({ id: o.id, label: o.label })),
    correct: best.id,
    why: [
      { id: 'highest', label: 'It has the highest present value of dividends' },
      { id: 'first', label: 'It pays the biggest dividend next year' },
      { id: 'growth', label: 'It has the fastest growth, so it must be worth most' },
    ],
    correctWhy: 'highest',
    explain: `${all.map((o) => `${o.label} ${eur(o.value, 2)}`).join(', ')}. ${best.label} is worth most.`,
  };
}

const stockOutcomes = (keys: string[], news: string) => Object.fromEntries(keys.map((k) => [k, { valueDelta: 0, news }]));

// ---------------------------------------------------------------- sorting and briefs

export const primarySecondary: ClassifyProblem = {
  kind: 'classify',
  id: 'primary-secondary',
  title: 'Where does the money go?',
  host: 'celine',
  concept: 'stock-basics',
  prompt: ['Before I write a cheque, show me you know how share markets work. Does the company get money from each of these?'],
  categories: [
    { id: 'primary', label: 'Primary: the company raises money' },
    { id: 'secondary', label: 'Secondary: investors trade with each other' },
  ],
  show: 5,
  items: [
    { text: 'Céline buys new shares in Atelier Noor for €400,000', category: 'primary', why: 'New shares, money to the company: venture capital.' },
    { text: 'A fashion group lists on the stock exchange for the first time', category: 'primary', why: 'An IPO.' },
    { text: 'A listed rival sells extra new shares to fund stores', category: 'primary', why: 'A seasoned equity offering.' },
    { text: 'You buy shares in a listed rival on a trading app', category: 'secondary', why: 'The money goes to whoever sold them.' },
    { text: 'A pension fund sells its shares in a luxury group to a hedge fund', category: 'secondary', why: 'Existing shares changing hands.' },
    { text: 'Idris sells some of his Atelier Noor shares to Céline', category: 'secondary', why: 'Existing shares; the house gets nothing.' },
  ],
};

export const retainOrPay: BriefProblem = {
  kind: 'brief',
  id: 'retain-or-pay',
  title: 'Pay out or plough back?',
  host: 'idris',
  concept: 'pvgo',
  prompt: [
    { who: 'idris', text: 'Pay the profits out. A bird in the hand.' },
    { who: 'celine', text: 'Plough them back. Growth is what makes a house valuable.' },
    { who: 'margaux', text: 'You’re both half right. Brief the board properly.' },
  ],
  question: 'When does reinvesting profits, rather than paying them out, increase the value of a share?',
  cards: [
    { text: 'Only when the reinvested money earns a return on equity above the cost of capital.', kind: 'key', why: 'ROE > r is the test.' },
    { text: 'If ROE equals r, the share price is the same whether profits are paid out or reinvested.', kind: 'key', why: 'Growth that only earns r adds no value.' },
    { text: 'The extra value from good reinvestment is the present value of growth opportunities (PVGO).', kind: 'key', why: 'P₀ = EPS₁/r + PVGO.' },
    { text: 'If ROE is below r, ploughing back destroys value.', kind: 'key', why: 'Investors could do better with the cash themselves.' },
    { text: 'Growth always increases the share price.', kind: 'trap', why: 'Not if the growth is bought with returns below r.' },
    { text: 'Paying out everything always maximises value because investors get cash now.', kind: 'trap', why: 'Not if the company can earn more than r on that cash.' },
    { text: 'Growing earnings per share proves a company is a growth stock.', kind: 'trap', why: 'Earnings can grow from reinvestment at poor returns.' },
    { text: 'Dividends are paid out of profit after tax.', kind: 'filler', why: 'True, but it doesn’t answer the question.' },
  ],
  model:
    'Reinvesting adds value only if the return on the reinvested money (ROE) exceeds the cost of capital r. The share price can be split into the value with no growth, EPS₁/r, plus the present value of growth opportunities (PVGO). If ROE equals r, PVGO is zero and the price is the same whether profits are paid out or reinvested; if ROE is below r, reinvesting destroys value.',
};

// ---------------------------------------------------------------- calculations

export const oneYearPrice = defineCalc({
  kind: 'calc',
  id: 'one-year-price',
  title: 'One year ahead',
  host: 'celine',
  concept: 'ddm',
  base: { D1: 5, P1: 110, r: 8, market: 104 },
  vary: (rng) => {
    const D1 = pickRate(rng, 1, 8, 0.5);
    const P1 = pickInt(rng, 40, 150, 5);
    const r = pickRate(rng, 6, 12, 0.5);
    return { D1, P1, r, market: roundTo(((D1 + P1) / (1 + dec(r))) * pickOne(rng, [0.95, 0.97, 1.03, 1.05]), 0.5) };
  },
  build: ({ D1, P1, r, market }) => {
    const value = (D1 + P1) / (1 + dec(r));
    return {
      prompt: [
        { who: 'celine', text: `Practice on someone else first. Maison Lune, the listed rival. It will pay a ${eur(D1, 2)} dividend at the end of the year, and analysts expect the share to trade at ${eur(P1)} straight after.` },
        { who: 'celine', text: `Investors want ${pct(r)} a year on shares like these.` },
      ],
      ask: 'What should a Maison Lune share be worth today?',
      timeline: {
        unit: 'year',
        show: 2,
        streams: [
          { id: 'div', label: `Dividend (${eur(D1, 2)})`, periods: [1], direction: 'in' },
          { id: 'sale', label: `Sale price (${eur(P1)})`, periods: [1], direction: 'in' },
        ],
        explain: 'Both arrive at year 1: the dividend, then the price you could sell at.',
      },
      formula: { options: ['ddm-one', 'gordon', 'div-yield', 'fv-single'], correct: 'ddm-one', explain: 'One year’s dividend plus next year’s price, discounted one year.' },
      inputs: [
        { key: 'D', symbol: 'D_{1}', label: 'Dividend next year', unit: 'eur', expected: D1, explain: 'Paid at year 1.' },
        { key: 'P', symbol: 'P_{1}', label: 'Price next year', unit: 'eur', expected: P1, explain: 'Expected price after the dividend.' },
        { key: 'r', symbol: 'r', label: 'Required return', unit: 'pct', expected: r, explain: 'The market capitalisation rate.' },
      ],
      solve: (v) => (v.D + v.P) / (1 + v.r / 100),
      answer: { label: 'Value of one share today', unit: 'eur', explain: `(${w2(D1)} + ${w2(P1)}) ÷ ${onePlus(r)} = ${eur(value, 2)}.` },
      decision: buyDecision(value, market, 'Maison Lune shares'),
      working: [`P_{0} = \\frac{${w2(D1)} + ${w2(P1)}}{${onePlus(r)}} = €${w2(value)}`],
      hints: {
        timeline: 'Everything you receive arrives one year from now.',
        formula: 'Just one year: a dividend and a sale price.',
        inputs: 'Three numbers.',
        answer: `Add the dividend and the price, divide by ${onePlus(r)}.`,
        decision: 'Compare your value with the market price.',
      },
      outcomes: stockOutcomes(['buy', 'pass'], `Maison Lune valued at ${eur(value, 2)} a share.`),
      cfoLine: `Maison Lune: (${eur(D1, 2)} + ${eur(P1)}) ÷ ${onePlus(r)} = ${eur(value, 2)}.`,
    };
  },
});

export const levelYield = defineCalc({
  kind: 'calc',
  id: 'level-yield',
  title: 'A dividend that never grows',
  host: 'celine',
  concept: 'ddm',
  uses: ['perpetuity'],
  base: { D: 5, P: 40, hurdle: 10 },
  vary: (rng) => {
    const D = pickRate(rng, 1, 8, 0.5);
    return { D, P: pickInt(rng, 15, 90, 5), hurdle: pickRate(rng, 6, 14, 1) };
  },
  build: ({ D, P, hurdle }) => {
    const r = (D / P) * 100;
    const better = r > hurdle;
    return {
      prompt: [
        { who: 'celine', text: `A family-owned weaver. It ploughs nothing back and pays a flat ${eur(D, 2)} a share every year, forever. The shares trade at ${eur(P)}.` },
        { who: 'celine', text: `What return are investors in it expecting? Compare it with the ${pct(hurdle)} we’d want.` },
      ],
      ask: 'What return does the share price imply?',
      timeline: {
        unit: 'year',
        show: 4,
        streams: [{ id: 'div', label: `Dividend (${eur(D, 2)} a year)`, periods: range(1, 4), forever: true, direction: 'in' }],
        explain: 'The same dividend every year from year 1, forever: a level perpetuity.',
      },
      formula: { options: ['div-yield', 'gordon', 'ddm-one', 'ear'], correct: 'div-yield', explain: 'A level perpetuity, P = D ÷ r, turned round: r = D ÷ P.' },
      inputs: [
        { key: 'D', symbol: 'D', label: 'Dividend each year', unit: 'eur', expected: D, explain: 'Level, forever.' },
        { key: 'P', symbol: 'P_{0}', label: 'Share price', unit: 'eur', expected: P, explain: 'Today’s price.' },
      ],
      solve: (v) => (v.D / v.P) * 100,
      answer: { label: 'Expected return', unit: 'pct', explain: `${w2(D)} ÷ ${w2(P)} = ${pct(r, 2)}.` },
      decision: {
        question: `Does it beat the ${pct(hurdle)} we need?`,
        options: [
          { id: 'yes', label: 'Yes' },
          { id: 'no', label: 'No' },
        ],
        correct: better ? 'yes' : 'no',
        why: [
          { id: 'above', label: `The implied return is above ${pct(hurdle)}` },
          { id: 'below', label: `The implied return is below ${pct(hurdle)}` },
          { id: 'price', label: 'A cheap share price always means a good return' },
        ],
        correctWhy: better ? 'above' : 'below',
        explain: `It offers ${pct(r, 2)} against our ${pct(hurdle)}.`,
      },
      working: [`r = \\frac{D}{P_{0}} = \\frac{${w2(D)}}{${w2(P)}} = ${w2(r)}\\%`],
      hints: {
        timeline: 'Same amount, every year, forever.',
        formula: 'Take the perpetuity formula and solve for r.',
        inputs: 'Just two numbers.',
        answer: 'Dividend ÷ price.',
        decision: 'Compare the two returns.',
      },
      outcomes: stockOutcomes(['yes', 'no'], `The weaver’s shares imply a ${pct(r, 2)} return.`),
      cfoLine: `${eur(D, 2)} forever at ${eur(P)}: ${pct(r, 2)}.`,
    };
  },
});

export const gordonD0 = defineCalc({
  kind: 'calc',
  id: 'gordon-d0',
  title: 'The dividend just paid',
  host: 'celine',
  concept: 'gordon',
  uses: ['growing-perpetuity', 'real-nominal'],
  base: { D: 1.35, g: 2.75, r: 9.5, basis: 'last' as 'last' | 'next', market: 19, name: 'Maison Lune' },
  vary: (rng) => {
    const g = pickRate(rng, 1, 6, 0.25);
    const r = g + pickRate(rng, 3, 8, 0.5);
    const D = pickRate(rng, 0.5, 6, 0.05);
    const basis = pickOne(rng, ['last', 'next'] as const);
    const D1 = basis === 'last' ? D * (1 + dec(g)) : D;
    return { D, g, r, basis, market: roundTo((D1 / dec(r - g)) * pickOne(rng, [0.9, 0.95, 1.05, 1.1]), 0.5), name: 'Maison Lune' };
  },
  build: ({ D, g, r, basis, market, name }) => {
    const D1 = basis === 'last' ? D * (1 + dec(g)) : D;
    const value = D1 / (dec(r) - dec(g));
    return {
      prompt: [
        basis === 'last'
          ? { who: 'celine', text: `${name} just paid its annual dividend: ${eur(D, 2)} a share. It’s mature now: dividends should grow ${pct(g)} a year, in line with inflation, forever.` }
          : { who: 'celine', text: `${name} will pay ${eur(D, 2)} a share next year, and dividends should grow ${pct(g)} a year after that, forever.` },
        { who: 'celine', text: `Investors want ${pct(r)} a year.` },
      ],
      ask: `What should a ${name} share be worth?`,
      timeline: {
        unit: 'year',
        show: 4,
        streams: [{ id: 'div', label: `Dividends, growing ${pct(g)} a year`, periods: range(1, 4), forever: true, direction: 'in' }],
        valueAt: { prompt: 'Where does D₁ ÷ (r − g) put the value?', period: 0 },
        explain: (basis === 'last' ? 'The dividend just paid is gone: it isn’t part of the price. ' : '') + 'Future dividends start at year 1 and grow forever; the formula values them at year 0.',
      },
      formula: { options: ['gordon', 'div-yield', 'growing-annuity', 'two-stage'], correct: 'gordon', explain: 'Constant growth forever: D₁ ÷ (r − g).' },
      inputs: [
        {
          key: 'D1',
          symbol: 'D_{1}',
          label: 'Next year’s dividend',
          unit: 'eur',
          expected: D1,
          explain: basis === 'last' ? `${eur(D, 2)} was just paid. D₁ = ${w2(D)} × ${onePlus(g)} = ${w4(D1)}.` : 'Given directly.',
        },
        { key: 'r', symbol: 'r', label: 'Required return', unit: 'pct', expected: r, explain: 'What investors want.' },
        { key: 'g', symbol: 'g', label: 'Growth rate', unit: 'pct', expected: g, explain: 'Forever.' },
      ],
      solve: (v) => v.D1 / (v.r / 100 - v.g / 100),
      answer: { label: 'Value of one share', unit: 'eur', explain: `${w4(D1)} ÷ (${rd(r)} − ${rd(g)}) = ${eur(value, 2)}.` },
      decision: buyDecision(value, market, `${name} shares`),
      working: [
        ...(basis === 'last' ? [`D_{1} = ${w2(D)} \\times ${onePlus(g)} = ${w4(D1)}`] : []),
        `P_{0} = \\frac{${w4(D1)}}{${rd(r)} - ${rd(g)}} = €${w2(value)}`,
      ],
      hints: {
        timeline: 'Which dividends will a buyer today actually receive?',
        formula: 'Growing at a constant rate forever.',
        inputs: basis === 'last' ? 'The formula wants next year’s dividend. You were told last year’s.' : 'Next year’s dividend is given.',
        answer: `${w4(D1)} ÷ (${rd(r)} − ${rd(g)}).`,
        decision: 'Compare your value with the market price.',
      },
      outcomes: stockOutcomes(['buy', 'pass'], `${name} valued at ${eur(value, 2)} a share.`),
      cfoLine: `D₁ ${eur(D1, 2)}, r ${pct(r)}, g ${pct(g)}: ${eur(value, 2)}.`,
    };
  },
});

export const sustainableGrowth = defineCalc({
  kind: 'calc',
  id: 'sustainable-growth',
  title: 'How fast can we grow?',
  host: 'margaux',
  concept: 'payout-plowback',
  base: { EPS: 2, DPS: 1, ROE: 15, r: 15 },
  vary: (rng) => {
    const EPS = pickRate(rng, 1, 6, 0.25);
    return { EPS, DPS: roundTo(EPS * pickOne(rng, [0.3, 0.4, 0.5, 0.6, 0.7]), 0.05), ROE: pickRate(rng, 8, 25, 1), r: pickRate(rng, 9, 16, 1) };
  },
  build: ({ EPS, DPS, ROE, r }) => {
    const payout = DPS / EPS;
    const b = 1 - payout;
    const g = ROE * b;
    const call = Math.abs(ROE - r) < 1e-9 ? 'same' : ROE > r ? 'less' : 'more';
    return {
      prompt: [
        `Next year we expect earnings of ${eur(EPS, 2)} a share, and we plan to pay ${eur(DPS, 2)} of it as a dividend.`,
        `We earn a ${pct(ROE)} return on the equity we reinvest. Investors want ${pct(r)}.`,
        { who: 'idris', text: 'And if we paid out everything instead?' },
      ],
      ask: 'What growth rate can we sustain? Would paying out everything make the shares worth more or less?',
      timeline: {
        unit: 'year',
        show: 4,
        streams: [{ id: 'div', label: 'Dividends, growing at g', periods: range(1, 4), forever: true, direction: 'in' }],
        explain: 'Dividends from year 1, growing forever at the sustainable rate.',
      },
      formula: { options: ['sustainable-g', 'gordon', 'pvgo', 'div-yield'], correct: 'sustainable-g', explain: 'Growth comes from what’s ploughed back, earning ROE: g = ROE × b.' },
      inputs: [
        { key: 'EPS', symbol: 'EPS_{1}', label: 'Earnings per share', unit: 'eur', expected: EPS, explain: 'Next year.' },
        { key: 'DPS', symbol: 'DPS_{1}', label: 'Dividend per share', unit: 'eur', expected: DPS, explain: 'Next year.' },
        { key: 'ROE', symbol: 'ROE', label: 'Return on equity', unit: 'pct', expected: ROE, explain: 'What reinvested money earns.' },
      ],
      solve: (v) => v.ROE * (1 - v.DPS / v.EPS),
      answer: { label: 'Sustainable growth rate', unit: 'pct', explain: `Payout ${pct(payout * 100, 1)}, plowback ${w2(b)}; g = ${pct(ROE)} × ${w2(b)} = ${pct(g, 2)}.` },
      decision: {
        question: 'Would paying out everything make each share worth more, less, or the same?',
        options: [
          { id: 'more', label: 'More' },
          { id: 'less', label: 'Less' },
          { id: 'same', label: 'The same' },
        ],
        correct: call,
        why: [
          { id: 'roe-above', label: 'Reinvested money earns more than investors require' },
          { id: 'roe-below', label: 'Reinvested money earns less than investors require' },
          { id: 'roe-equal', label: 'Reinvested money earns exactly what investors require' },
          { id: 'cash', label: 'Investors always prefer cash now' },
        ],
        correctWhy: call === 'less' ? 'roe-above' : call === 'more' ? 'roe-below' : 'roe-equal',
        explain: `ROE ${pct(ROE)} v. r ${pct(r)}. ${call === 'same' ? 'Growth adds nothing, so the price is the same either way.' : call === 'less' ? 'Reinvesting creates value, so paying it all out would lower the price.' : 'Reinvesting destroys value, so paying it all out would raise the price.'}`,
      },
      working: [`b = 1 - \\frac{${w2(DPS)}}{${w2(EPS)}} = ${w4(b)}`, `g = ROE \\times b = ${rd(ROE)} \\times ${w4(b)} = ${w2(g)}\\%`],
      hints: {
        timeline: 'Growing dividends, forever.',
        formula: 'Growth comes from reinvestment.',
        inputs: 'You don’t need r for the growth rate.',
        answer: `Plowback = 1 − ${w2(DPS)} ÷ ${w2(EPS)}. Multiply by ${pct(ROE)}.`,
        decision: 'Compare ROE with the return investors want.',
      },
      outcomes: stockOutcomes(['more', 'less', 'same'], `Sustainable growth: ${pct(g, 2)} a year.`),
      cfoLine: `Plowback ${w2(b)} × ROE ${pct(ROE)} = ${pct(g, 2)} growth.`,
    };
  },
});

export const pvgoProblem = defineCalc({
  kind: 'calc',
  id: 'pvgo-house',
  title: 'What is growth worth?',
  host: 'celine',
  concept: 'pvgo',
  uses: ['gordon', 'payout-plowback'],
  base: { EPS: 8.33, payout: 60, ROE: 25, r: 15 },
  vary: (rng) => {
    const r = pickRate(rng, 9, 15, 1);
    const payout = pickOne(rng, [40, 50, 60, 70]);
    const ROE = pickRate(rng, r + 2, r + 12, 1);
    // keep g below r
    const g = ROE * (1 - payout / 100);
    return { EPS: pickRate(rng, 2, 10, 0.01), payout: g < r - 1 ? payout : 80, ROE, r };
  },
  build: ({ EPS, payout, ROE, r }) => {
    const D1 = EPS * dec(payout);
    const g = ROE * (1 - dec(payout));
    const price = D1 / (dec(r) - dec(g));
    const noGrowth = EPS / dec(r);
    const pv = price - noGrowth;
    return {
      prompt: [
        { who: 'celine', text: `Here’s how I value you. Earnings next year: ${eur(EPS, 2)} a share. You’ll pay out ${pct(payout)} and reinvest the rest at a ${pct(ROE)} return on equity.` },
        { who: 'celine', text: `I want ${pct(r)} on my money. So how much of your share price is the business as it stands, and how much is growth?` },
      ],
      ask: 'What is the present value of growth opportunities (PVGO) per share?',
      timeline: {
        unit: 'year',
        show: 4,
        streams: [{ id: 'div', label: 'Dividends, growing', periods: range(1, 4), forever: true, direction: 'in' }],
        explain: 'Dividends from year 1, growing forever at ROE × plowback.',
      },
      formula: { options: ['pvgo', 'gordon', 'sustainable-g', 'div-yield'], correct: 'pvgo', explain: 'Price with growth, minus the no-growth value EPS₁ ÷ r.' },
      inputs: [
        { key: 'EPS', symbol: 'EPS_{1}', label: 'Earnings next year', unit: 'eur', expected: EPS, explain: 'Per share.' },
        { key: 'p', symbol: 'p', label: 'Payout ratio', unit: 'pct', expected: payout, explain: `D₁ = ${pct(payout)} × EPS.` },
        { key: 'ROE', symbol: 'ROE', label: 'Return on equity', unit: 'pct', expected: ROE, explain: 'On reinvested money.' },
        { key: 'r', symbol: 'r', label: 'Required return', unit: 'pct', expected: r, explain: 'What Céline wants.' },
      ],
      solve: (v) => {
        const d1 = v.EPS * (v.p / 100);
        const gg = (v.ROE / 100) * (1 - v.p / 100);
        return d1 / (v.r / 100 - gg) - v.EPS / (v.r / 100);
      },
      answer: { label: 'PVGO per share', unit: 'eur', explain: `Price ${eur(price, 2)} − no-growth value ${eur(noGrowth, 2)} = ${eur(pv, 2)}.` },
      decision: {
        question: 'Should the house keep reinvesting part of its profits?',
        options: [
          { id: 'reinvest', label: 'Yes, keep reinvesting' },
          { id: 'payout', label: 'No, pay everything out' },
        ],
        correct: 'reinvest',
        why: [
          { id: 'roe', label: 'Reinvested money earns more than investors require, so PVGO is positive' },
          { id: 'grow', label: 'Any growth is good growth' },
          { id: 'cash', label: 'Céline would rather have cash now' },
        ],
        correctWhy: 'roe',
        explain: `ROE ${pct(ROE)} beats r ${pct(r)}, so growth is worth ${eur(pv, 2)} a share.`,
      },
      working: [
        `D_{1} = ${rd(payout)} \\times ${w2(EPS)} = ${w2(D1)},\\quad g = ${rd(ROE)} \\times ${w2(1 - dec(payout))} = ${w2(g)}\\%`,
        `P_{0} = \\frac{${w2(D1)}}{${rd(r)} - ${rd(g)}} = €${w2(price)},\\quad \\frac{EPS_{1}}{r} = \\frac{${w2(EPS)}}{${rd(r)}} = €${w2(noGrowth)}`,
        `PVGO = ${w2(price)} - ${w2(noGrowth)} = €${w2(pv)}`,
      ],
      hints: {
        timeline: 'Dividends growing forever.',
        formula: 'Value with growth minus value without.',
        inputs: 'Four numbers; the payout ratio gives the dividend.',
        answer: 'Find D₁ and g, price it with constant growth, then subtract EPS₁ ÷ r.',
        decision: 'Is ROE above r?',
      },
      outcomes: stockOutcomes(['reinvest', 'payout'], `Céline values growth at ${eur(pv, 2)} a share.`),
      cfoLine: `Price ${eur(price, 2)}, no-growth ${eur(noGrowth, 2)}: PVGO ${eur(pv, 2)}.`,
    };
  },
});

export const growthPremium = defineCalc({
  kind: 'calc',
  id: 'growth-premium',
  title: 'Paying for growth',
  host: 'celine',
  concept: 'pvgo',
  uses: ['gordon'],
  base: { D1: 10, g: 5, r: 8, level: 15 },
  vary: (rng) => {
    const r = pickRate(rng, 7, 13, 1);
    const g = pickRate(rng, 1, r - 2, 0.5);
    const D1 = pickRate(rng, 2, 12, 0.5);
    return { D1, g, r, level: roundTo(D1 * pickOne(rng, [1.3, 1.5, 1.7]), 0.5) };
  },
  build: ({ D1, g, r, level }) => {
    const price = D1 / (dec(r) - dec(g));
    const noGrowth = level / dec(r);
    const pv = price - noGrowth;
    return {
      prompt: [
        { who: 'celine', text: `A listed accessories brand: next year’s dividend is ${eur(D1, 2)}, growing ${pct(g)} a year forever. Investors want ${pct(r)}.` },
        { who: 'celine', text: `If it paid out all its earnings instead, it could pay a level ${eur(level, 2)} a share forever.` },
      ],
      ask: 'How much is the market paying per share for growth opportunities?',
      timeline: {
        unit: 'year',
        show: 4,
        streams: [{ id: 'div', label: 'Dividends, growing', periods: range(1, 4), forever: true, direction: 'in' }],
        explain: 'Growing dividends from year 1, forever.',
      },
      formula: { options: ['pvgo', 'gordon', 'div-yield', 'sustainable-g'], correct: 'pvgo', explain: 'Price with growth minus the value of the level, no-growth dividend.' },
      inputs: [
        { key: 'D1', symbol: 'D_{1}', label: 'Next year’s dividend', unit: 'eur', expected: D1, explain: 'With growth.' },
        { key: 'g', symbol: 'g', label: 'Growth rate', unit: 'pct', expected: g, explain: 'Forever.' },
        { key: 'r', symbol: 'r', label: 'Required return', unit: 'pct', expected: r, explain: 'The market’s rate.' },
        { key: 'L', symbol: 'EPS_{1}', label: 'Level dividend if all paid out', unit: 'eur', expected: level, explain: 'Equals next year’s earnings.' },
      ],
      solve: (v) => v.D1 / (v.r / 100 - v.g / 100) - v.L / (v.r / 100),
      answer: { label: 'PVGO per share', unit: 'eur', explain: `${eur(price, 2)} − ${eur(noGrowth, 2)} = ${eur(pv, 2)}.` },
      decision: {
        question: 'Is the market paying for genuine growth opportunities?',
        options: [
          { id: 'yes', label: 'Yes: PVGO is positive' },
          { id: 'no', label: 'No: PVGO is zero or negative' },
        ],
        correct: pv > 0 ? 'yes' : 'no',
        why: [
          { id: 'roe', label: 'Its reinvestment earns more than r' },
          { id: 'growth', label: 'Its dividends grow, so it must be a growth stock' },
        ],
        correctWhy: 'roe',
        explain: `PVGO of ${eur(pv, 2)} means its reinvestment earns more than ${pct(r)}.`,
      },
      working: [`P_{0} = \\frac{${w2(D1)}}{${rd(r)} - ${rd(g)}} = €${w2(price)}`, `\\frac{EPS_{1}}{r} = \\frac{${w2(level)}}{${rd(r)}} = €${w2(noGrowth)}`, `PVGO = €${w2(pv)}`],
      hints: {
        timeline: 'Growing dividends forever.',
        formula: 'Price minus no-growth value.',
        inputs: 'The level dividend is what earnings would be.',
        answer: `${w2(D1)} ÷ (${rd(r)} − ${rd(g)}), minus ${w2(level)} ÷ ${rd(r)}.`,
        decision: 'What makes PVGO positive?',
      },
      outcomes: stockOutcomes(['yes', 'no'], `Growth worth ${eur(pv, 2)} a share.`),
      cfoLine: `PVGO ${eur(pv, 2)} on a ${eur(price, 2)} share.`,
    };
  },
});

export const twoStageProblem = defineCalc({
  kind: 'calc',
  id: 'two-stage',
  title: 'Fast growth, then flat',
  host: 'celine',
  concept: 'multi-stage',
  uses: ['growing-annuity', 'delayed-perpetuity', 'gordon'],
  base: {
    D: 1,
    basis: 'last' as 'last' | 'next',
    g: 6,
    last: 7,
    r: 20,
    market: 6 as number | null,
    compare: null as { label: string; value: number }[] | null,
    name: 'Maison Lune',
  },
  vary: (rng) => {
    const r = pickRate(rng, 8, 20, 1);
    const g = pickRate(rng, 4, 20, 1);
    const D = pickRate(rng, 0.5, 5, 0.5);
    const basis = pickOne(rng, ['last', 'next'] as const);
    const last = pickInt(rng, 3, 7);
    const D1 = basis === 'last' ? D * (1 + dec(g)) : D;
    const v = fin.twoStage(D1, dec(r), dec(g) === dec(r) ? dec(g) + 0.001 : dec(g), last);
    return { D, basis, g: g === r ? g + 1 : g, last, r, market: roundTo(v * pickOne(rng, [0.9, 0.95, 1.05, 1.1]), 0.5), compare: null, name: 'Maison Lune' };
  },
  build: ({ D, basis, g, last, r, market, compare, name }) => {
    const D1 = basis === 'last' ? D * (1 + dec(g)) : D;
    const Dlast = D1 * Math.pow(1 + dec(g), last - 1);
    const stage1 = fin.growingAnnuity(D1, dec(r), dec(g), last);
    const stage2 = fin.pvSingle(Dlast / dec(r), dec(r), last);
    const value = stage1 + stage2;
    const decision = compare ? compareDecision(value, name, compare) : buyDecision(value, market ?? value, `${name} shares`);
    return {
      prompt: [
        basis === 'last'
          ? { who: 'celine', text: `${name} just paid a dividend of ${eur(D, 2)}. It’s in its fast-growth years: dividends should grow ${pct(g)} a year for the next ${word(last)} years.` }
          : { who: 'celine', text: `${name} will pay ${eur(D, 2)} next year. Dividends should then grow ${pct(g)} a year until year ${last}.` },
        { who: 'celine', text: `After year ${last}, competition catches up and the dividend stops growing: it stays at year ${last}’s level forever. Investors want ${pct(r)}.` },
      ],
      ask: `What is a ${name} share worth?`,
      timeline: {
        unit: 'year',
        show: last + 3,
        streams: [
          { id: 'grow', label: `Growing dividends (${pct(g)} a year)`, periods: range(1, last), direction: 'in' },
          { id: 'flat', label: 'Flat dividends, forever', periods: range(last + 1, last + 3), forever: true, direction: 'in' },
        ],
        valueAt: { prompt: 'Where does the flat-dividend perpetuity put its value?', period: last },
        explain: `Growth from year 1 to year ${last}; flat from year ${last + 1} forever. The perpetuity values the flat part at year ${last}.`,
      },
      formula: { options: ['two-stage', 'gordon', 'growing-annuity', 'delayed-perpetuity'], correct: 'two-stage', explain: 'A growing annuity for the fast years, plus a perpetuity at year N discounted back.' },
      inputs: [
        {
          key: 'D1',
          symbol: 'D_{1}',
          label: 'Next year’s dividend',
          unit: 'eur',
          expected: D1,
          explain: basis === 'last' ? `${w2(D)} × ${onePlus(g)} = ${w4(D1)}.` : 'Given.',
        },
        { key: 'g', symbol: 'g', label: 'Growth rate in the fast years', unit: 'pct', expected: g, explain: 'Until year N.' },
        { key: 'N', symbol: 'N', label: 'Last year of growth', unit: 'count', expected: last, explain: `Year ${last}.` },
        { key: 'r', symbol: 'r', label: 'Required return', unit: 'pct', expected: r, explain: 'The market’s rate.' },
      ],
      solve: (v) => fin.twoStage(v.D1, v.r / 100, v.g / 100, v.N),
      answer: { label: 'Value of one share', unit: 'eur', explain: `Growth years ${eur(stage1, 2)} + flat years ${eur(stage2, 2)} = ${eur(value, 2)}.` },
      decision,
      working: [
        `D_{1} = ${w4(D1)},\\quad D_{${last}} = ${w4(D1)} \\times ${onePlus(g)}^{${last - 1}} = ${w4(Dlast)}`,
        `\\text{Growth years: } \\frac{${w4(D1)}}{${rd(r)} - ${rd(g)}}\\left(1 - \\frac{${onePlus(g)}^{${last}}}{${onePlus(r)}^{${last}}}\\right) = ${w2(stage1)}`,
        `\\text{Flat years: } \\frac{${w4(Dlast)} / ${rd(r)}}{${onePlus(r)}^{${last}}} = ${w2(stage2)}`,
        `P_{0} = ${w2(stage1)} + ${w2(stage2)} = €${w2(value)}`,
      ],
      hints: {
        timeline: `Two flows: growing to year ${last}, then flat forever.`,
        formula: 'Two stages, two formulas added together.',
        inputs: basis === 'last' ? 'You were told the dividend just paid. Grow it once.' : 'Next year’s dividend is given.',
        answer: `Growth part with the growing-annuity formula; flat part is D_${last} ÷ r, discounted ${last} years.`,
        decision: compare ? 'Compare all the values.' : 'Compare your value with the market price.',
      },
      outcomes: Object.fromEntries(decision.options.map((o) => [o.id, { valueDelta: 0, news: `${name} valued at ${eur(value, 2)} a share.` }])),
      cfoLine: `${name}: ${eur(stage1, 2)} from growth years + ${eur(stage2, 2)} after = ${eur(value, 2)}.`,
    };
  },
});

export const ACT3_PROBLEMS: Problem[] = [primarySecondary, retainOrPay, oneYearPrice, levelYield, gordonD0, sustainableGrowth, pvgoProblem, growthPremium, twoStageProblem];
