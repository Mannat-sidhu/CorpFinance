// Act I problems. Every number shown comes from the parameters and the solvers in engine/finance.
import * as fin from '../engine/finance';
import { eur, pct } from '../engine/format';
import { pickInt, pickOne, pickRate } from '../engine/rng';
import type { ClassifyProblem, Problem } from '../engine/types';
import { dec, defineCalc, onePlus, range, rd, roundTo, w0, w2, w4 } from './helpers';

const ordinal = (n: number) => {
  const words = ['zeroth', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];
  if (n < words.length) return words[n];
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};
const yearsWord = (n: number) => ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'][n] ?? String(n);

// ---------------------------------------------------------------- classification exercises

export const assetsClassify: ClassifyProblem = {
  kind: 'classify',
  id: 'assets-classify',
  title: 'Taking stock',
  concept: 'real-financial',
  prompt: ['Margaux is drawing up the house’s first balance sheet. Sort each item: is it a real asset or a financial asset?'],
  categories: [
    { id: 'real', label: 'Real asset' },
    { id: 'financial', label: 'Financial asset' },
  ],
  show: 5,
  items: [
    { text: 'The studio’s industrial sewing machines', category: 'real', why: 'Machines produce goods, and so produce cash.' },
    { text: 'A €10,000 government bond the house holds', category: 'financial', why: 'A bond is a claim on the government’s future payments.' },
    { text: 'The shares Idris received for his €90,000', category: 'financial', why: 'Shares are claims on the house’s real assets and the cash they produce.' },
    { text: 'The Atelier Noor name and its print archive', category: 'real', why: 'Intangible, but it produces cash through sales and licensing: a real asset.' },
    { text: 'Bolts of silk in the stockroom', category: 'real', why: 'Materials used to make goods are real assets.' },
    { text: 'Shares in a listed luxury group, bought with spare cash', category: 'financial', why: 'A share is a claim on another company’s real assets.' },
    { text: 'A loan the house made to a supplier', category: 'financial', why: 'For the lender, a loan is a claim on the borrower: a financial asset.' },
    { text: 'The studio’s cutting tables and steam presses', category: 'real', why: 'Equipment that produces goods is a real asset.' },
  ],
};

export const decisionsClassify: ClassifyProblem = {
  kind: 'classify',
  id: 'decisions-classify',
  title: 'Two kinds of decision',
  concept: 'invest-finance',
  prompt: ['Margaux lists the decisions on her desk this month. Which are investment decisions, and which are financing decisions?'],
  categories: [
    { id: 'investment', label: 'Investment decision' },
    { id: 'financing', label: 'Financing decision' },
  ],
  show: 5,
  items: [
    { text: 'Buying a laser cutter for the studio', category: 'investment', why: 'Choosing a real asset to buy.' },
    { text: 'Taking out a bank loan', category: 'financing', why: 'Deciding where the money comes from: debt.' },
    { text: 'Selling 10% of the shares to an angel investor', category: 'financing', why: 'Raising money by selling equity.' },
    { text: 'Opening a second boutique in Cork', category: 'investment', why: 'Committing money to a real asset expected to produce cash.' },
    { text: 'Issuing a bond to raise money for a warehouse', category: 'financing', why: 'Issuing a bond is borrowing, whatever the money is for.' },
    { text: 'Developing a new handbag line', category: 'investment', why: 'Spending now on something expected to produce future cash.' },
    { text: 'Asking Idris to put in more equity', category: 'financing', why: 'Raising money from shareholders.' },
  ],
};

export const goalsTrueFalse: ClassifyProblem = {
  kind: 'classify',
  id: 'goals-true-false',
  title: 'What the house is for',
  concept: 'shareholder-value',
  prompt: ['Before you open the doors, Margaux tests you. True or false?'],
  categories: [
    { id: 'true', label: 'True' },
    { id: 'false', label: 'False' },
  ],
  show: 5,
  items: [
    { concept: 'shareholder-value', text: 'The financial manager’s goal is to maximise the value of the owners’ stake.', category: 'true', why: 'Maximising shareholder value is the module’s stated objective.' },
    { concept: 'shareholder-value', text: 'The bank, staff and suppliers have fixed claims, so extra value created goes to the shareholders.', category: 'true', why: 'Shareholders are the residual claimants.' },
    { concept: 'shareholder-value', text: 'Maximising this year’s accounting profit is always the same as maximising shareholder value.', category: 'false', why: 'Profit ignores when cash arrives and how risky it is.' },
    { concept: 'shareholder-value', text: 'Corporate finance records the effects of past transactions.', category: 'false', why: 'That is accounting. Finance is about decisions for the future.' },
    { concept: 'opportunity-cost', text: 'If the house has spare cash, using it on a project costs nothing.', category: 'false', why: 'The cash could earn a return elsewhere: that is its opportunity cost.' },
    { concept: 'opportunity-cost', text: 'A euro today is worth more than a euro next year, because it can be invested to earn interest.', category: 'true', why: 'This is the time value of money.' },
    { concept: 'opportunity-cost', text: 'A project is worth doing if it earns more than investors could earn elsewhere at the same risk.', category: 'true', why: 'That return elsewhere is the opportunity cost of capital.' },
    { concept: 'opportunity-cost', text: 'The opportunity cost of capital is the interest rate the house pays on its overdraft.', category: 'false', why: 'It is the return given up on investments of similar risk.' },
  ],
};

export const agencyClassify: ClassifyProblem = {
  kind: 'classify',
  id: 'agency-classify',
  title: 'Who is the house working for?',
  concept: 'agency',
  prompt: ['Margaux has been reading the expense claims and the board minutes. Sort each item.'],
  categories: [
    { id: 'type1', label: 'Type I problem' },
    { id: 'type2', label: 'Type II problem' },
    { id: 'cost', label: 'Cost of controlling it' },
  ],
  show: 6,
  items: [
    { text: 'Theo books first-class flights to a fabric fair a train ride away.', category: 'type1', why: 'A manager spending owners’ money on himself: managers v. shareholders.' },
    { text: 'Theo pushes for a bigger studio for him to run, though the numbers don’t add up.', category: 'type1', why: 'Empire-building: the manager’s power over the owners’ value.' },
    { text: 'Theo wants deals that bring in cash this year, because his bonus depends on it.', category: 'type1', why: 'His pay rewards short-term cash, not shareholder value.' },
    { text: 'Idris, with 60% of the votes, makes the house buy linen from his own mill at above-market prices.', category: 'type2', why: 'A large shareholder benefiting at the small shareholders’ expense.' },
    { text: 'Idris votes himself a “consulting fee” that the other shareholders opposed.', category: 'type2', why: 'Large v. small shareholders: Type II.' },
    { text: 'Paying an auditor to check Theo’s expense claims.', category: 'cost', why: 'Spending to reduce the conflict is an indirect agency cost.' },
    { text: 'Appointing an independent director to review deals with Idris’s firms.', category: 'cost', why: 'Monitoring costs money: an indirect agency cost.' },
  ],
};

// ---------------------------------------------------------------- PV and NPV

export const savingsNote = defineCalc({
  kind: 'calc',
  id: 'savings-note',
  title: 'The broker’s note',
  concept: 'pv-fv',
  uses: ['opportunity-cost'],
  base: { F: 10000, T: 5, r: 5, price: 8000 },
  vary: (rng) => {
    const F = pickInt(rng, 5000, 20000, 1000);
    const T = pickInt(rng, 2, 8);
    const r = pickRate(rng, 3, 8, 0.5);
    return { F, T, r, price: roundTo(fin.pvSingle(F, dec(r), T) * pickOne(rng, [0.95, 0.98, 1.03, 1.06]), 50) };
  },
  build: ({ F, T, r, price }) => {
    const pv = fin.pvSingle(F, dec(r), T);
    const worth = pv > price;
    return {
      prompt: [
        `A broker offers the house a savings note. You pay ${eur(price)} today, and in ${T} years’ time the note pays back ${eur(F)} in a single sum. Nothing is paid in between.`,
        `The bank pays ${pct(r)} a year on deposits of similar risk.`,
      ],
      ask: 'What is the note’s payout worth in today’s money? Should the house buy it?',
      timeline: {
        unit: 'year',
        show: T + 2,
        streams: [{ id: 'payout', label: `Note pays out (${eur(F)})`, periods: [T], direction: 'in' }],
        explain: `“In ${T} years’ time” is year ${T}. One cash flow, at one date.`,
      },
      formula: {
        options: ['pv-single', 'fv-single', 'perpetuity', 'annuity'],
        correct: 'pv-single',
        explain: 'One cash flow in the future, valued today: divide by (1 + r)^T.',
      },
      inputs: [
        { key: 'C', symbol: 'C_{T}', label: 'Payout', unit: 'eur', expected: F, explain: `The ${eur(F)} received at year ${T}.` },
        { key: 'r', symbol: 'r', label: 'Discount rate', unit: 'pct', expected: r, explain: 'What the cash could earn in the bank instead.' },
        { key: 'T', symbol: 'T', label: 'Years until the payout', unit: 'years', expected: T, explain: `Paid at year ${T}.` },
      ],
      solve: (v) => fin.pvSingle(v.C, v.r / 100, v.T),
      answer: { label: 'Present value of the payout', unit: 'eur', explain: `${eur(F)} ÷ ${onePlus(r)}^${T} = ${eur(pv, 2)}.` },
      decision: {
        question: `Should the house pay ${eur(price)} for the note?`,
        options: [
          { id: 'buy', label: 'Buy the note' },
          { id: 'decline', label: 'Decline it' },
        ],
        correct: worth ? 'buy' : 'decline',
        why: [
          { id: 'pv-above', label: 'The payout is worth more today than the price' },
          { id: 'pv-below', label: 'The payout is worth less today than the price' },
          { id: 'nominal', label: `${eur(F)} is more than ${eur(price)}, so it makes money` },
          { id: 'safe', label: 'A note that pays a fixed sum is always a good deal' },
        ],
        correctWhy: worth ? 'pv-above' : 'pv-below',
        explain: worth
          ? `Paying ${eur(price)} for something worth ${eur(pv)} today is a positive-NPV deal.`
          : `Paying ${eur(price)} for something worth only ${eur(pv)} today loses value. The bank at ${pct(r)} does better.`,
      },
      working: [
        `PV = \\frac{${w0(F)}}{${onePlus(r)}^{${T}}} = \\frac{${w0(F)}}{${w4(Math.pow(1 + dec(r), T))}}`,
        `PV = €${w2(pv)}`,
        `NPV = -${w0(price)} + ${w2(pv)} = €${w2(pv - price)} ${worth ? '> 0 \\to \\text{buy}' : '< 0 \\to \\text{decline}'}`,
      ],
      hints: {
        timeline: 'Only one cash flow comes back, at the date the note matures.',
        formula: 'You have one future amount and want its value today.',
        inputs: 'The rate is what the cash would earn in the bank instead.',
        answer: `Work out ${onePlus(r)}^${T} first, then divide ${w0(F)} by it.`,
        decision: 'Compare the value today with what you would pay today.',
      },
      outcomes: {
        buy: { valueDelta: 0, news: worth ? 'Bought the note at a fair-to-good price.' : `Bought the note: ${eur(price - pv)} overpaid.` },
        decline: { valueDelta: 0, news: worth ? 'Declined the note and missed a small gain.' : 'Declined the note. The bank pays better.' },
      },
      cfoLine: `Savings note: payout worth ${eur(pv)} today against a price of ${eur(price)}, so ${worth ? 'buy' : 'decline'}.`,
    };
  },
});

export const laserCutter = defineCalc({
  kind: 'calc',
  id: 'laser-cutter',
  title: 'The laser cutter',
  concept: 'npv',
  uses: ['pv-fv', 'opportunity-cost'],
  base: { cost: 23000, saving: 9000, years: 3, r: 4 },
  vary: (rng) => ({
    cost: pickInt(rng, 18000, 32000, 500),
    saving: pickInt(rng, 6000, 12000, 500),
    years: pickInt(rng, 3, 4),
    r: pickRate(rng, 3, 9, 0.5),
  }),
  build: ({ cost, saving, years, r }) => {
    const value = -cost + fin.annuity(saving, dec(r), years);
    const pos = value > 0;
    const pvs = range(1, years).map((t) => fin.pvSingle(saving, dec(r), t));
    return {
      prompt: [
        `A supplier offers the house a computer-controlled laser cutter. Fully installed, it costs ${eur(cost)}, payable now.`,
        `Margaux estimates it will save ${eur(saving)} of hand-cutting labour in each of the next ${yearsWord(years)} years, counted at the end of each year. After that it will be obsolete and worth nothing.`,
        `The house’s spare cash could earn ${pct(r)} a year elsewhere at similar risk.`,
      ],
      ask: 'What is the net present value of buying the cutter? Should the house buy it?',
      timeline: {
        unit: 'year',
        show: years + 2,
        streams: [
          { id: 'cost', label: `Price of the cutter (${eur(cost)})`, periods: [0], direction: 'out' },
          { id: 'saving', label: `Labour saved (${eur(saving)} a year)`, periods: range(1, years), direction: 'in' },
        ],
        explain: `The cutter is paid for today, year 0. Savings arrive at the end of each of the next ${yearsWord(years)} years: years 1 to ${years}.`,
      },
      formula: {
        options: ['npv-sum', 'annuity-due', 'fv-single', 'perpetuity'],
        correct: 'npv-sum',
        explain: 'NPV discounts every cash flow to today and adds them, including the cost at year 0. The savings also form a level annuity, which gives the same total.',
      },
      inputs: [
        { key: 'C0', symbol: 'C_{0}', label: 'Cost today', unit: 'eur', expected: cost, explain: 'Paid now, so it is a negative cash flow at year 0.', signless: true },
        { key: 'C', symbol: 'C', label: 'Saving each year', unit: 'eur', expected: saving, explain: 'The same amount at years 1 to ' + years + '.' },
        { key: 'r', symbol: 'r', label: 'Discount rate', unit: 'pct', expected: r, explain: 'The opportunity cost: what the cash could earn elsewhere at similar risk.' },
        { key: 'T', symbol: 'T', label: 'Years of savings', unit: 'years', expected: years, explain: `Savings at years 1 to ${years}.` },
      ],
      solve: (v) => -Math.abs(v.C0) + fin.annuity(v.C, v.r / 100, v.T),
      answer: { label: 'NPV of the cutter', unit: 'eur', explain: `−${eur(cost)} plus the discounted savings of ${eur(value + cost, 2)} gives ${eur(value, 2)}.` },
      decision: {
        question: 'Should the house buy the laser cutter?',
        options: [
          { id: 'buy', label: 'Buy the cutter' },
          { id: 'skip', label: 'Don’t buy it' },
        ],
        correct: pos ? 'buy' : 'skip',
        why: [
          { id: 'npv-pos', label: 'Its NPV is positive: it earns more than the cash could elsewhere' },
          { id: 'npv-neg', label: 'Its NPV is negative: the cash would earn more elsewhere' },
          { id: 'undiscounted', label: `The savings total ${eur(saving * years)}, ${saving * years > cost ? 'more' : 'less'} than the price` },
          { id: 'payback', label: `It pays for itself within ${yearsWord(years)} years` },
        ],
        correctWhy: pos ? 'npv-pos' : 'npv-neg',
        explain: pos
          ? `NPV of ${eur(value)} is positive, so the cutter earns more than ${pct(r)}. Buy it.`
          : `NPV of ${eur(value)} is negative. Adding undiscounted savings would have misled you.`,
      },
      working: [
        `NPV = -${w0(cost)} + ${range(1, years).map((t) => `\\frac{${w0(saving)}}{${onePlus(r)}${t > 1 ? `^{${t}}` : ''}}`).join(' + ')}`,
        `NPV = -${w0(cost)} + ${pvs.map(w2).join(' + ')}`,
        `NPV = €${w2(value)} ${pos ? '> 0 \\to \\text{buy}' : '< 0 \\to \\text{reject}'}`,
      ],
      hints: {
        timeline: 'Today is year 0. “At the end of each of the next years” means starting at year 1.',
        formula: 'You have a cost now and several cash flows later. Which method adds them all up in today’s euros?',
        inputs: 'The rate to use is what the cash could earn elsewhere at similar risk.',
        answer: `Discount each saving: ${w0(saving)} ÷ ${onePlus(r)}, ${w0(saving)} ÷ ${onePlus(r)}², and so on. Then subtract the cost.`,
        decision: 'A positive NPV means the project earns more than the opportunity cost of capital.',
      },
      outcomes: {
        buy: {
          valueDelta: value,
          cashDelta: -cost,
          news: pos ? `Laser cutter installed: it adds ${eur(value)} of value to the house.` : `Laser cutter bought with a negative NPV: ${eur(-value)} of value destroyed.`,
        },
        skip: {
          valueDelta: 0,
          news: pos ? `Passed on the laser cutter, giving up ${eur(value)} of value.` : `Rightly passed on the cutter. It would have destroyed ${eur(-value)}.`,
        },
      },
      cfoLine: `Laser cutter: NPV ${eur(value)} at ${pct(r)}. ${pos ? 'Positive, so Margaux bought it.' : 'Negative, so Margaux passed.'}`,
    };
  },
});

// ---------------------------------------------------------------- perpetuities

export const designPrize = defineCalc({
  kind: 'calc',
  id: 'design-prize',
  title: 'The design prize',
  concept: 'perpetuity',
  base: { C: 5000, r: 4, price: 110000 },
  vary: (rng) => {
    const C = pickInt(rng, 2000, 10000, 500);
    const r = pickRate(rng, 3, 8, 0.5);
    return { C, r, price: roundTo(fin.perpetuity(C, dec(r)) * pickOne(rng, [0.88, 0.95, 1.06, 1.12]), 1000) };
  },
  build: ({ C, r, price }) => {
    const pv = fin.perpetuity(C, dec(r));
    const accept = price < pv;
    return {
      prompt: [
        `The house wants to fund the Atelier Noor Prize at the National College of Art and Design: ${eur(C)} a year to a graduating student, forever. The first prize is awarded in one year’s time.`,
        `The college offers to run the prize forever in return for a single gift of ${eur(price)} today. Otherwise the house would pay each prize itself. Its cash earns ${pct(r)} a year.`,
      ],
      ask: 'What does paying the prize yourself cost in today’s money? Should the house accept the college’s offer?',
      timeline: {
        unit: 'year',
        show: 4,
        streams: [{ id: 'prize', label: `Prize money (${eur(C)} a year)`, periods: range(1, 4), forever: true, direction: 'out' }],
        explain: 'The first prize is in one year, at year 1, and then every year forever.',
      },
      formula: { options: ['perpetuity', 'annuity', 'growing-perpetuity', 'delayed-perpetuity'], correct: 'perpetuity', explain: 'The same amount every year forever, starting in one year: C / r.' },
      inputs: [
        { key: 'C', symbol: 'C', label: 'Prize each year', unit: 'eur', expected: C, explain: 'The same each year.' },
        { key: 'r', symbol: 'r', label: 'Discount rate', unit: 'pct', expected: r, explain: 'What the house’s cash earns.' },
      ],
      solve: (v) => fin.perpetuity(v.C, v.r / 100),
      answer: { label: 'Cost of paying the prize yourself, today', unit: 'eur', explain: `${eur(C)} ÷ ${rd(r)} = ${eur(pv)}.` },
      decision: {
        question: `Should the house give the college ${eur(price)}?`,
        options: [
          { id: 'accept', label: 'Accept the college’s offer' },
          { id: 'decline', label: 'Pay the prize ourselves' },
        ],
        correct: accept ? 'accept' : 'decline',
        why: [
          { id: 'cheaper', label: 'The gift is less than the present value of paying it ourselves' },
          { id: 'dearer', label: 'The gift is more than the present value of paying it ourselves' },
          { id: 'forever', label: 'Paying forever would cost an unlimited amount' },
          { id: 'cash', label: 'Keeping cash is always better' },
        ],
        correctWhy: accept ? 'cheaper' : 'dearer',
        explain: `Paying it ourselves costs ${eur(pv)} today; the college asks ${eur(price)}.`,
      },
      working: [`PV = \\frac{C}{r} = \\frac{${w0(C)}}{${rd(r)}} = €${w2(pv)}`, `${w0(price)} ${accept ? '<' : '>'} ${w0(pv)} \\to \\text{${accept ? 'accept' : 'decline'}}`],
      hints: {
        timeline: 'Mark the first prize at year 1 and turn on “continues forever”.',
        formula: 'Same amount, every year, forever, starting next year.',
        inputs: 'Only two numbers are needed.',
        answer: `${w0(C)} ÷ ${rd(r)}.`,
        decision: 'Compare the two costs in today’s money.',
      },
      outcomes: {
        accept: { valueDelta: 0, news: 'The Atelier Noor Prize is endowed.' },
        decline: { valueDelta: 0, news: 'The house will pay the prize itself each year.' },
      },
      cfoLine: `Design prize: ${eur(C)} a year forever is worth ${eur(pv)} at ${pct(r)}; the college asks ${eur(price)}.`,
    };
  },
});

export const royaltySale = defineCalc({
  kind: 'calc',
  id: 'royalty-sale',
  title: 'The Liffey Rose royalty',
  concept: 'delayed-perpetuity',
  uses: ['perpetuity', 'agency'],
  base: { C: 10000, r: 8, first: 3, offer: 95000 },
  vary: (rng) => {
    const C = pickInt(rng, 6000, 15000, 500);
    const r = pickRate(rng, 5, 10, 0.5);
    const first = pickInt(rng, 2, 5);
    return { C, r, first, offer: roundTo(fin.delayedPerpetuity(C, dec(r), first) * pickOne(rng, [0.85, 0.9, 1.08, 1.12]), 1000) };
  },
  build: ({ C, r, first, offer }) => {
    const atPrev = fin.perpetuity(C, dec(r));
    const value = fin.delayedPerpetuity(C, dec(r), first);
    const keep = value > offer;
    return {
      prompt: [
        `A homeware brand wants to print the house’s signature Liffey Rose pattern on its cushions and throws. It will pay Atelier Noor a royalty of ${eur(C)} a year, forever.`,
        `There is a catch. Its factory needs retooling, so the first payment arrives in ${yearsWord(first)} years’ time, with one every year after that.`,
        `Theo has found a finance firm that will buy the whole royalty stream today for ${eur(offer)} in cash. His bonus is based on cash received this year, and he is keen to sign. Money invested elsewhere at similar risk earns ${pct(r)} a year.`,
      ],
      ask: `What is the royalty stream worth today? Should the house sell it for ${eur(offer)}?`,
      timeline: {
        unit: 'year',
        show: first + 3,
        streams: [{ id: 'royalty', label: `Royalty (${eur(C)} a year)`, periods: range(first, first + 3), forever: true, direction: 'in' }],
        valueAt: { prompt: 'Where on the ruler does C / r put the value of this stream?', period: first - 1 },
        explain: `First payment at year ${first}, then every year forever. C / r values the stream one year before the first payment, at year ${first - 1}. That figure must then be discounted back ${first - 1} ${first - 1 === 1 ? 'year' : 'years'} to today.`,
      },
      formula: {
        options: ['perpetuity', 'delayed-perpetuity', 'growing-perpetuity', 'annuity'],
        correct: 'delayed-perpetuity',
        explain: 'A level perpetuity that starts late: C / r, then discount that lump sum back to year 0.',
      },
      inputs: [
        { key: 'C', symbol: 'C', label: 'Royalty each year', unit: 'eur', expected: C, explain: 'Level, so no growth.' },
        { key: 'r', symbol: 'r', label: 'Discount rate', unit: 'pct', expected: r, explain: 'The return available elsewhere at similar risk.' },
        { key: 't', symbol: 't', label: 'Year of the first payment', unit: 'count', expected: first, explain: `First payment at year ${first}, so discount back ${first - 1} years.` },
      ],
      solve: (v) => fin.perpetuity(v.C, v.r / 100) / Math.pow(1 + v.r / 100, v.t - 1),
      answer: { label: 'Value of the royalty today', unit: 'eur', explain: `${eur(C)} ÷ ${rd(r)} = ${eur(atPrev)} at year ${first - 1}; ÷ ${onePlus(r)}^${first - 1} = ${eur(value)} today.` },
      decision: {
        question: `Keep the royalty, or sell it to the finance firm for ${eur(offer)}?`,
        options: [
          { id: 'keep', label: 'Keep the royalty' },
          { id: 'sell', label: 'Sell it for cash now' },
        ],
        correct: keep ? 'keep' : 'sell',
        why: [
          { id: 'value-above', label: 'Its value today is higher than the offer' },
          { id: 'value-below', label: 'Its value today is lower than the offer' },
          { id: 'cash-now', label: 'Cash now is always better than waiting' },
          { id: 'forever', label: 'A payment that lasts forever is worth an unlimited amount' },
        ],
        correctWhy: keep ? 'value-above' : 'value-below',
        explain: `Worth ${eur(value)} today against an offer of ${eur(offer)}. Theo’s bonus rewards this year’s cash, not value: a Type I agency problem.`,
      },
      working: [
        `\\text{Value at year ${first - 1}: } \\frac{C}{r} = \\frac{${w0(C)}}{${rd(r)}} = ${w2(atPrev)}`,
        `PV_{0} = \\frac{${w2(atPrev)}}{${onePlus(r)}^{${first - 1}}} = €${w2(value)}`,
        `${w0(value)} ${keep ? '>' : '<'} ${w0(offer)} \\to \\text{${keep ? 'keep the royalty' : 'sell'}}`,
      ],
      hints: {
        timeline: `Mark every payment from year ${first} and switch on “continues forever”. The formula lands one step before the first payment.`,
        formula: 'A perpetuity that starts late needs one extra step after C / r.',
        inputs: 't is the year of the first payment, as stated in the story.',
        answer: `Work out ${w0(C)} ÷ ${rd(r)} first, then divide by ${onePlus(r)}^${first - 1}.`,
        decision: 'Compare today’s value with the cash offered.',
      },
      outcomes: {
        keep: { valueDelta: value, news: `Liffey Rose licence signed and kept: it adds ${eur(value)} to the house’s value.` },
        sell: {
          valueDelta: offer,
          cashDelta: offer,
          news: keep
            ? `Royalty sold for ${eur(offer)}. It was worth ${eur(value)}: ${eur(value - offer)} handed to the finance firm.`
            : `Royalty sold for ${eur(offer)}, more than its ${eur(value)} value. A good trade.`,
        },
      },
      cfoLine: `Liffey Rose royalty: ${eur(atPrev)} at year ${first - 1}, ${eur(value)} today. ${keep ? 'Kept' : 'Sold'}.`,
    };
  },
});

export const idrisRoyalty = defineCalc({
  kind: 'calc',
  id: 'idris-royalty',
  title: 'Idris’s offer',
  concept: 'growing-perpetuity',
  uses: ['agency'],
  base: { C0: 10000, g: 5, r: 10, offer: 180000, basis: 'last' as 'last' | 'next' },
  vary: (rng) => {
    const C0 = pickInt(rng, 5000, 15000, 500);
    const g = pickRate(rng, 2, 5, 0.5);
    const r = g + pickRate(rng, 3, 7, 0.5);
    const basis = pickOne(rng, ['last', 'next'] as const);
    const C1 = basis === 'last' ? C0 * (1 + dec(g)) : C0;
    return { C0, g, r, basis, offer: roundTo(fin.growingPerpetuity(C1, dec(r), dec(g)) * pickOne(rng, [0.85, 0.9, 1.1]), 1000) };
  },
  build: ({ C0, g, r, offer, basis }) => {
    const C1 = basis === 'last' ? C0 * (1 + dec(g)) : C0;
    const value = fin.growingPerpetuity(C1, dec(r), dec(g));
    const keep = value > offer;
    return {
      prompt: [
        'Last year the house licensed its Ha’penny check print to a Donegal mill. The mill pays a royalty once a year, and the royalty grows with the mill’s sales.',
        basis === 'last'
          ? `The royalty just paid was ${eur(C0)}. Margaux expects it to grow ${pct(g)} a year, indefinitely.`
          : `Next year’s royalty will be ${eur(C0)}, and Margaux expects it to grow ${pct(g)} a year after that, indefinitely.`,
        `Idris Kell, who holds 60% of the shares, proposes that the house sell the royalty to his family’s textile firm for ${eur(offer)}. With his votes the motion passes unless you object. The house’s cost of capital is ${pct(r)}.`,
      ],
      ask: 'What is the royalty worth today? Should the house accept Idris’s offer?',
      timeline: {
        unit: 'year',
        show: 4,
        streams: [{ id: 'royalty', label: 'Future royalties (growing each year)', periods: range(1, 4), forever: true, direction: 'in' }],
        valueAt: { prompt: 'Where on the ruler does C₁ / (r − g) put the value?', period: 0 },
        explain:
          (basis === 'last' ? 'The royalty just paid has already been received, so it is not part of what is being sold. ' : '') +
          'Future royalties start at year 1 and go on forever. C₁ / (r − g) values them at year 0: today.',
      },
      formula: {
        options: ['growing-perpetuity', 'perpetuity', 'growing-annuity', 'delayed-perpetuity'],
        correct: 'growing-perpetuity',
        explain: 'A payment growing at a constant rate, forever, starting next year: C₁ / (r − g).',
      },
      inputs: [
        {
          key: 'C1',
          symbol: 'C_{1}',
          label: 'Next year’s royalty',
          unit: 'eur',
          expected: C1,
          explain: basis === 'last' ? `${eur(C0)} was just paid, so next year’s is ${eur(C0)} × ${onePlus(g)} = ${eur(C1)}. This is the C₁ vs C₀ trap.` : 'Next year’s royalty is given directly.',
        },
        { key: 'g', symbol: 'g', label: 'Growth rate', unit: 'pct', expected: g, explain: 'Constant growth, forever.' },
        { key: 'r', symbol: 'r', label: 'Discount rate', unit: 'pct', expected: r, explain: 'The house’s cost of capital.' },
      ],
      solve: (v) => v.C1 / (v.r / 100 - v.g / 100),
      answer: { label: 'Value of the royalty today', unit: 'eur', explain: `${eur(C1)} ÷ (${rd(r)} − ${rd(g)}) = ${eur(value)}.` },
      decision: {
        question: `Do you object to selling the royalty to Idris’s firm for ${eur(offer)}?`,
        options: [
          { id: 'keep', label: 'Object: keep the royalty' },
          { id: 'sell', label: 'Let the sale go through' },
        ],
        correct: keep ? 'keep' : 'sell',
        why: [
          { id: 'value-above', label: 'Its value today is higher than the offer' },
          { id: 'value-below', label: 'Its value today is lower than the offer' },
          { id: 'majority', label: 'Idris holds the most shares, so his view must be right' },
          { id: 'first', label: `The first royalty is only ${eur(C0)}, far below the offer` },
        ],
        correctWhy: keep ? 'value-above' : 'value-below',
        explain: `Worth ${eur(value)} against ${eur(offer)}. ${keep ? 'Selling cheaply to a controlling shareholder’s own firm is a Type II agency problem.' : 'This time the offer is generous; agency problems are about who gains, so check the numbers.'}`,
      },
      working: [
        ...(basis === 'last' ? [`C_{1} = C_{0}(1 + g) = ${w0(C0)} \\times ${onePlus(g)} = ${w2(C1)}`] : []),
        `PV = \\frac{C_{1}}{r - g} = \\frac{${w2(C1)}}{${rd(r)} - ${rd(g)}} = €${w2(value)}`,
        `${w0(value)} ${keep ? '>' : '<'} ${w0(offer)} \\to \\text{${keep ? 'object to the sale' : 'accept'}}`,
      ],
      hints: {
        timeline: 'Only royalties still to come are being sold. Do they start at year 0 or year 1?',
        formula: 'Growing at a constant rate, and it never stops.',
        inputs: basis === 'last' ? 'Was the royalty you were told about already paid? The formula needs the next one.' : 'The formula needs next year’s royalty, C₁.',
        answer: `${w2(C1)} ÷ (${rd(r)} − ${rd(g)}).`,
        decision: 'Compare today’s value with the offer, whoever is making it.',
      },
      outcomes: {
        keep: {
          valueDelta: 0,
          news: keep
            ? `You objected. The Ha’penny royalty, worth ${eur(value)}, stays with the house. Idris is not pleased.`
            : `You blocked a sale at ${eur(offer)}, above the royalty’s ${eur(value)} value: ${eur(offer - value)} forgone.`,
        },
        sell: {
          valueDelta: offer - value,
          cashDelta: offer,
          news: keep ? `Royalty sold to Idris’s firm for ${eur(offer)}: ${eur(value - offer)} of value transferred to him.` : `Royalty sold to Idris’s firm for ${eur(offer)}, a good price.`,
        },
      },
      cfoLine: `Ha’penny royalty: C₁ = ${eur(C1)}, worth ${eur(value)} at ${pct(r)} with ${pct(g)} growth.`,
    };
  },
});

// ---------------------------------------------------------------- annuities

export const apprenticeFund = defineCalc({
  kind: 'calc',
  id: 'apprentice-fund',
  title: 'The apprentice fund',
  concept: 'annuity',
  base: { C: 12000, T: 6, r: 8, fund: 55000 },
  vary: (rng) => {
    const C = pickInt(rng, 8000, 15000, 500);
    const T = pickInt(rng, 4, 8);
    const r = pickRate(rng, 4, 9, 0.5);
    return { C, T, r, fund: roundTo(fin.annuity(C, dec(r), T) * pickOne(rng, [0.97, 0.99, 1.02, 1.05]), 500) };
  },
  build: ({ C, T, r, fund }) => {
    const pv = fin.annuity(C, dec(r), T);
    const enough = fund >= pv;
    return {
      prompt: [
        `The house sponsors an apprentice tailor. The grant is ${eur(C)} at the end of each of the next ${yearsWord(T)} years.`,
        `Margaux wants to set money aside today in an account earning ${pct(r)} a year, and has earmarked ${eur(fund)}.`,
      ],
      ask: `How much must be set aside today? Is ${eur(fund)} enough?`,
      timeline: {
        unit: 'year',
        show: T + 2,
        streams: [{ id: 'grant', label: `Grant (${eur(C)} a year)`, periods: range(1, T), direction: 'out' }],
        explain: `“At the end of each of the next ${yearsWord(T)} years” means years 1 to ${T}.`,
      },
      formula: { options: ['annuity', 'annuity-due', 'perpetuity', 'fv-single'], correct: 'annuity', explain: 'Equal payments for a fixed number of years, starting in one year: an ordinary annuity.' },
      inputs: [
        { key: 'C', symbol: 'C', label: 'Grant each year', unit: 'eur', expected: C, explain: 'Level payments.' },
        { key: 'r', symbol: 'r', label: 'Interest rate', unit: 'pct', expected: r, explain: 'What the account earns.' },
        { key: 'T', symbol: 'T', label: 'Number of payments', unit: 'years', expected: T, explain: `${T} payments.` },
      ],
      solve: (v) => fin.annuity(v.C, v.r / 100, v.T),
      answer: { label: 'Amount needed today', unit: 'eur', explain: `${eur(C)} × annuity factor ${w4(fin.annuityFactor(dec(r), T))} = ${eur(pv, 2)}.` },
      decision: {
        question: `Is ${eur(fund)} enough?`,
        options: [
          { id: 'enough', label: 'Yes, it is enough' },
          { id: 'short', label: 'No, top it up' },
        ],
        correct: enough ? 'enough' : 'short',
        why: [
          { id: 'covers', label: 'The fund is at least the present value of the grants' },
          { id: 'below', label: 'The fund is less than the present value of the grants' },
          { id: 'total', label: `It must cover ${T} × ${w0(C)} = ${w0(C * T)} in full today` },
          { id: 'interest', label: 'Interest will always make up any shortfall' },
        ],
        correctWhy: enough ? 'covers' : 'below',
        explain: `The grants are worth ${eur(pv)} today; the fund holds ${eur(fund)}.`,
      },
      working: [
        `PV = \\frac{${w0(C)}}{${rd(r)}}\\left(1 - \\frac{1}{${onePlus(r)}^{${T}}}\\right)`,
        `PV = ${w2(C / dec(r))} \\times (1 - ${w4(fin.discountFactor(dec(r), T))}) = €${w2(pv)}`,
        `${w0(fund)} ${enough ? '\\ge' : '<'} ${w0(pv)} \\to \\text{${enough ? 'enough' : 'top up'}}`,
      ],
      hints: {
        timeline: 'End of each year: the first grant is at year 1.',
        formula: 'Fixed number of equal payments, starting next year.',
        inputs: 'T is the number of payments.',
        answer: `Work out 1 ÷ ${onePlus(r)}^${T} first.`,
        decision: 'Compare the fund with the present value, not the total.',
      },
      outcomes: { enough: { valueDelta: 0, news: 'Apprentice fund confirmed.' }, short: { valueDelta: 0, news: 'Apprentice fund topped up.' } },
      cfoLine: `Apprentice grants: ${T} × ${eur(C)} worth ${eur(pv)} today at ${pct(r)}.`,
    };
  },
});

export const studioLease = defineCalc({
  kind: 'calc',
  id: 'studio-lease',
  title: 'The Capel Street lease',
  concept: 'annuity-due',
  uses: ['annuity'],
  base: { C: 24000, T: 5, r: 6, upfront: 100000 },
  vary: (rng) => {
    const C = pickInt(rng, 18000, 36000, 1000);
    const T = pickInt(rng, 4, 7);
    const r = pickRate(rng, 4, 8, 0.5);
    return { C, T, r, upfront: roundTo(fin.annuityDue(C, dec(r), T) * pickOne(rng, [0.9, 0.94, 1.04, 1.08]), 1000) };
  },
  build: ({ C, T, r, upfront }) => {
    const ord = fin.annuity(C, dec(r), T);
    const due = fin.annuityDue(C, dec(r), T);
    const payUpfront = due > upfront;
    return {
      prompt: [
        `Atelier Noor has outgrown the spare room. Mrs Ferriter owns a light-filled studio on Capel Street and offers a ${yearsWord(T)}-year lease, with two ways to pay.`,
        `Option A: ${eur(C)} a year for ${yearsWord(T)} years, paid at the start of each year, so the first payment is due on signing.`,
        `Option B: a single payment of ${eur(upfront)} today, covering the whole ${yearsWord(T)} years.`,
        `The bank pays ${pct(r)} a year on the house’s cash.`,
      ],
      ask: 'What is Option A worth in today’s money? Which option should the house choose?',
      timeline: {
        unit: 'year',
        show: T + 2,
        streams: [{ id: 'rent', label: `Annual rent (${eur(C)})`, periods: range(0, T - 1), direction: 'out' }],
        explain: `“At the start of each year” puts the first payment today, at year 0. The ${yearsWord(T)} payments land at years 0 to ${T - 1}, not 1 to ${T}.`,
      },
      formula: {
        options: ['annuity', 'annuity-due', 'growing-annuity', 'perpetuity'],
        correct: 'annuity-due',
        explain: 'Payments at the start of each period: an annuity due, which is the level annuity × (1 + r).',
      },
      inputs: [
        { key: 'C', symbol: 'C', label: 'Rent each year', unit: 'eur', expected: C, explain: 'Level payments.' },
        { key: 'r', symbol: 'r', label: 'Discount rate', unit: 'pct', expected: r, explain: 'What the cash earns at the bank.' },
        { key: 'T', symbol: 'T', label: 'Number of payments', unit: 'count', expected: T, explain: `Still ${T} payments, even though the last is at year ${T - 1}.` },
      ],
      solve: (v) => fin.annuityDue(v.C, v.r / 100, v.T),
      answer: { label: 'Present value of Option A', unit: 'eur', explain: `Ordinary annuity ${eur(ord, 2)} × ${onePlus(r)} = ${eur(due, 2)}.` },
      decision: {
        question: 'Which option should the house choose?',
        options: [
          { id: 'upfront', label: 'Option B: pay upfront' },
          { id: 'yearly', label: 'Option A: pay yearly' },
        ],
        correct: payUpfront ? 'upfront' : 'yearly',
        why: [
          { id: 'pv-lower', label: 'It costs less in today’s money' },
          { id: 'total-lower', label: `It costs less in total euros (${eur(C * T)} v. ${eur(upfront)})` },
          { id: 'keep-cash', label: 'Holding on to cash is always safer' },
          { id: 'no-interest', label: 'Rent paid later costs nothing extra' },
        ],
        correctWhy: 'pv-lower',
        explain: `Option A costs ${eur(due)} in today’s money; Option B costs ${eur(upfront)}. ${payUpfront ? 'Paying upfront is cheaper' : 'Paying yearly is cheaper'} by ${eur(Math.abs(due - upfront))}.`,
      },
      working: [
        `PV_{A} = \\frac{${w0(C)}}{${rd(r)}}\\left(1 - \\frac{1}{${onePlus(r)}^{${T}}}\\right) \\times ${onePlus(r)}`,
        `PV_{A} = ${w2(ord)} \\times ${onePlus(r)} = €${w2(due)}`,
        `PV_{B} = €${w0(upfront)} \\to \\text{${payUpfront ? 'pay upfront' : 'pay yearly'}}, \\text{ saving } €${w0(Math.abs(due - upfront))}`,
      ],
      hints: {
        timeline: 'The first payment is due on signing. What year is “on signing”?',
        formula: 'Payments at the start of each year, not the end.',
        inputs: 'T counts payments, not the year of the last one.',
        answer: `Work out the ordinary annuity, then multiply by ${onePlus(r)}.`,
        decision: 'Compare both options in today’s money.',
      },
      outcomes: {
        upfront: {
          valueDelta: due - upfront,
          cashDelta: -upfront,
          news: payUpfront
            ? `Capel Street lease signed, paid upfront. That saves ${eur(due - upfront)} in present-value terms.`
            : `Lease paid upfront, but yearly was cheaper: ${eur(upfront - due)} of value lost.`,
        },
        yearly: {
          valueDelta: upfront - due,
          cashDelta: -C,
          news: payUpfront
            ? `Lease signed on yearly rent. Paying upfront would have saved ${eur(due - upfront)}: value lost.`
            : `Lease signed on yearly rent, saving ${eur(upfront - due)} against the upfront price.`,
        },
      },
      cfoLine: `Studio lease: ${T} payments of ${eur(C)} in advance are worth ${eur(due)}; ${payUpfront ? 'upfront' : 'yearly'} is cheaper.`,
    };
  },
});

export const cutterContract = defineCalc({
  kind: 'calc',
  id: 'cutter-contract',
  title: 'Bríd’s contract',
  concept: 'growing-annuity',
  uses: ['annuity'],
  base: { C: 40000, g: 3, T: 5, r: 6, flat: 42000 },
  vary: (rng) => {
    const C = pickInt(rng, 30000, 50000, 1000);
    const g = pickRate(rng, 2, 4, 0.5);
    const T = pickInt(rng, 4, 6);
    const r = pickRate(rng, g + 2, g + 5, 0.5);
    return { C, g, T, r, flat: roundTo(C * (1 + pickOne(rng, [0.03, 0.04, 0.06, 0.08])), 500) };
  },
  build: ({ C, g, T, r, flat }) => {
    const grow = fin.growingAnnuity(C, dec(r), dec(g), T);
    const flatPV = fin.annuity(flat, dec(r), T);
    const rising = grow < flatPV;
    return {
      prompt: [
        `The house needs a head pattern-cutter. Bríd Nolan, the best in Dublin, will join on a ${yearsWord(T)}-year contract. Her agent offers two pay packages.`,
        `Rising: ${eur(C)} in the first year, increasing by ${pct(g)} each year after that.`,
        `Flat: ${eur(flat)} every year.`,
        `Salaries are paid at the end of each year. The house’s cost of capital is ${pct(r)}. Margaux has already worked out that the flat package costs ${eur(flatPV)} in today’s money.`,
      ],
      ask: 'What does the rising package cost in today’s money? Which package should the house offer?',
      timeline: {
        unit: 'year',
        show: T + 2,
        streams: [{ id: 'salary', label: 'Rising salary', periods: range(1, T), direction: 'out' }],
        explain: `Paid at the end of each year for ${yearsWord(T)} years: years 1 to ${T}. It stops after year ${T}.`,
      },
      formula: {
        options: ['growing-annuity', 'growing-perpetuity', 'annuity', 'annuity-due'],
        correct: 'growing-annuity',
        explain: 'Growing at a constant rate, for a fixed number of years: a growing annuity.',
      },
      inputs: [
        { key: 'C1', symbol: 'C_{1}', label: 'First-year salary', unit: 'eur', expected: C, explain: 'Paid at year 1.' },
        { key: 'g', symbol: 'g', label: 'Growth rate', unit: 'pct', expected: g, explain: 'The yearly rise.' },
        { key: 'r', symbol: 'r', label: 'Discount rate', unit: 'pct', expected: r, explain: 'The house’s cost of capital.' },
        { key: 'T', symbol: 'T', label: 'Number of payments', unit: 'years', expected: T, explain: `${T} salaries.` },
      ],
      solve: (v) => fin.growingAnnuity(v.C1, v.r / 100, v.g / 100, v.T),
      answer: { label: 'Present value of the rising package', unit: 'eur', explain: `${eur(C)} ÷ (${rd(r)} − ${rd(g)}) × (1 − (${onePlus(g)}/${onePlus(r)})^${T}) = ${eur(grow)}.` },
      decision: {
        question: 'Which package should the house offer Bríd?',
        options: [
          { id: 'rising', label: 'The rising package' },
          { id: 'flat', label: 'The flat package' },
        ],
        correct: rising ? 'rising' : 'flat',
        why: [
          { id: 'pv-lower', label: 'It costs less in today’s money' },
          { id: 'first-year', label: 'Its first-year salary is lower' },
          { id: 'total', label: 'Its total in euros, undiscounted, is lower' },
          { id: 'always', label: 'A rising salary always costs more' },
        ],
        correctWhy: 'pv-lower',
        explain: `Rising: ${eur(grow)}. Flat: ${eur(flatPV)}. ${rising ? 'The rising package' : 'The flat package'} is cheaper by ${eur(Math.abs(grow - flatPV))}.`,
      },
      working: [
        `PV = \\frac{${w0(C)}}{${rd(r)} - ${rd(g)}}\\left(1 - \\frac{${onePlus(g)}^{${T}}}{${onePlus(r)}^{${T}}}\\right)`,
        `PV = ${w2(C / (dec(r) - dec(g)))} \\times (1 - ${w4(Math.pow((1 + dec(g)) / (1 + dec(r)), T))}) = €${w2(grow)}`,
        `€${w0(grow)} ${rising ? '<' : '>'} €${w0(flatPV)} \\to \\text{offer the ${rising ? 'rising' : 'flat'} package}`,
      ],
      hints: {
        timeline: 'End of each year, for a fixed number of years.',
        formula: 'It grows, and it stops.',
        inputs: 'C₁ is the first salary paid, at year 1.',
        answer: `Work out (${onePlus(g)} ÷ ${onePlus(r)})^${T} first.`,
        decision: 'Compare the two packages in today’s money.',
      },
      outcomes: {
        rising: {
          valueDelta: flatPV - grow,
          news: rising ? `Bríd signs on the rising package, saving ${eur(flatPV - grow)} in today’s money.` : `Bríd signs on the rising package: ${eur(grow - flatPV)} more than the flat one.`,
        },
        flat: {
          valueDelta: grow - flatPV,
          news: rising ? `Bríd signs on the flat package: ${eur(flatPV - grow)} more than the rising one.` : `Bríd signs on the flat package, saving ${eur(grow - flatPV)} in today’s money.`,
        },
      },
      cfoLine: `Bríd’s contract: rising package ${eur(grow)} v. flat ${eur(flatPV)}.`,
    };
  },
});

// ---------------------------------------------------------------- loans

type LoanCtx = 'studio' | 'flagship' | 'generic';
const loanIntro = (ctx: LoanCtx, P: number, r: number, T: number) => {
  if (ctx === 'studio')
    return `To fit out the Capel Street studio, the house borrows ${eur(P)} from Merchant’s Quay Bank. Aoife Brennan, the bank’s small-business manager, offers a ${T}-year amortising loan at ${pct(r)} a year.`;
  if (ctx === 'flagship')
    return `Three years on, Atelier Noor buys its flagship: a Georgian townhouse on Merrion Square. Merchant’s Quay Bank lends ${eur(P)} on a ${T}-year mortgage at ${pct(r)} a year.`;
  return `The house takes out a ${eur(P)}, ${T}-year amortising loan at ${pct(r)} a year.`;
};

export const loanPayment = defineCalc({
  kind: 'calc',
  id: 'loan-payment',
  title: 'Checking the bank’s letter',
  concept: 'loan-payment',
  uses: ['annuity'],
  base: { P: 120000, r: 7, T: 10, error: 1000, ctx: 'studio' as LoanCtx },
  vary: (rng) => ({
    P: pickInt(rng, 50000, 300000, 10000),
    r: pickRate(rng, 4, 9, 0.5),
    T: pickInt(rng, 5, 20),
    error: pickOne(rng, [0, 0, 500, 1000]),
    ctx: 'generic' as LoanCtx,
  }),
  build: ({ P, r, T, error, ctx }) => {
    const pmt = fin.loanPayment(P, dec(r), T);
    const quoted = pmt + error;
    const af = fin.annuityFactor(dec(r), T);
    return {
      prompt: [
        loanIntro(ctx, P, r, T),
        'Repayments are equal and made once a year, at the end of each year, so the first is one year from today.',
        `The bank’s letter quotes an annual repayment of ${eur(quoted, 2)}. Margaux asks you to check it before signing.`,
      ],
      ask: 'What should the annual repayment be? Do you sign as written?',
      timeline: {
        unit: 'year',
        show: T + 1,
        streams: [
          { id: 'loan', label: `Loan received (${eur(P)})`, periods: [0], direction: 'in' },
          { id: 'pay', label: 'Repayment C', periods: range(1, T), direction: 'out' },
        ],
        explain: `The money arrives today, year 0. Repayments at the end of each year: years 1 to ${T}.`,
      },
      formula: {
        options: ['loan-payment', 'annuity', 'annuity-due', 'simple-interest'],
        correct: 'loan-payment',
        explain: 'The repayments are an annuity whose present value equals the loan. Rearrange the annuity formula for C.',
      },
      inputs: [
        { key: 'PV', symbol: 'PV', label: 'Amount borrowed', unit: 'eur', expected: P, explain: 'The annuity’s present value must equal the loan.' },
        { key: 'r', symbol: 'r', label: 'Interest rate', unit: 'pct', expected: r, explain: 'Annual rate, annual payments.' },
        { key: 'T', symbol: 'T', label: 'Number of payments', unit: 'count', expected: T, explain: `${T} annual payments.` },
      ],
      solve: (v) => fin.loanPayment(v.PV, v.r / 100, v.T),
      answer: { label: 'Annual repayment', unit: 'eur', explain: `${eur(P)} ÷ annuity factor ${w4(af)} = ${eur(pmt, 2)}.` },
      decision: {
        question: `The letter says ${eur(quoted, 2)}. What do you do?`,
        options: [
          { id: 'sign', label: 'Sign as written' },
          { id: 'query', label: 'Query the figure' },
        ],
        correct: error === 0 ? 'sign' : 'query',
        why: [
          { id: 'matches', label: 'The quoted figure matches the annuity calculation' },
          { id: 'differs', label: 'The quoted figure is higher than the annuity calculation' },
          { id: 'principal', label: `The right repayment is ${w0(P)} ÷ ${T} plus a year’s interest` },
          { id: 'trust', label: 'The bank’s figures are always right' },
        ],
        correctWhy: error === 0 ? 'matches' : 'differs',
        explain:
          error === 0
            ? `The letter is right: ${eur(pmt, 2)}. A loan at a fair rate has zero NPV: it neither creates nor destroys value.`
            : `The letter overstates the repayment by ${eur(error)}. Over ${T} years that is worth ${eur(fin.annuity(error, dec(r), T))} today.`,
      },
      working: [
        `${w0(P)} = \\frac{C}{${rd(r)}}\\left(1 - \\frac{1}{${onePlus(r)}^{${T}}}\\right) = C \\times ${w4(af)}`,
        `C = \\frac{${w0(P)}}{${w4(af)}} = €${w2(pmt)}`,
        error === 0 ? `\\text{Quoted } €${w2(quoted)} = C \\to \\text{sign}` : `\\text{Quoted } €${w2(quoted)} \\ne €${w2(pmt)} \\to \\text{query}`,
      ],
      hints: {
        timeline: 'The money arrives today. When is the first repayment?',
        formula: 'You know the PV of the payments (the loan) and want the payment.',
        inputs: 'The loan amount plays the role of PV.',
        answer: `Find the annuity factor (1/${rd(r)})(1 − 1/${onePlus(r)}^${T}) and divide ${w0(P)} by it.`,
        decision: 'Compare your figure with the letter, to the cent.',
      },
      outcomes: {
        sign: {
          valueDelta: error === 0 ? 0 : -fin.annuity(error, dec(r), T),
          cashDelta: P,
          news: error === 0 ? `Loan signed at ${eur(pmt, 2)} a year. Fair borrowing: no value created or lost.` : `Signed a letter overcharging ${eur(error)} a year: ${eur(fin.annuity(error, dec(r), T))} of value lost.`,
        },
        query: {
          valueDelta: 0,
          cashDelta: P,
          news: error === 0 ? 'Aoife confirms the figure was right. A week lost, nothing more.' : `Aoife apologises: a typing error. The letter is reissued at ${eur(pmt, 2)}.`,
        },
      },
      cfoLine: `${eur(P)} over ${T} years at ${pct(r)}: repayment ${eur(pmt, 2)} a year.`,
    };
  },
});

export const loanBalance = defineCalc({
  kind: 'calc',
  id: 'loan-balance',
  title: 'Halfway through the loan',
  concept: 'loan-balance',
  uses: ['annuity', 'loan-payment'],
  base: { P: 120000, r: 7, T: 10, k: 5, ctx: 'studio' as LoanCtx },
  vary: (rng) => {
    const T = pickInt(rng, 8, 20);
    return { P: pickInt(rng, 50000, 300000, 10000), r: pickRate(rng, 4, 9, 0.5), T, k: pickInt(rng, 2, T - 2), ctx: 'generic' as LoanCtx };
  },
  build: ({ P, r, T, k, ctx }) => {
    const pmt = fin.loanPayment(P, dec(r), T);
    const bal = fin.loanBalance(P, dec(r), T, k);
    const frac = ((P - bal) / P) * 100;
    const timeShare = (k / T) * 100;
    return {
      prompt: [
        loanIntro(ctx, P, r, T),
        `It is repaid in equal instalments of ${eur(pmt, 2)} at the end of each year.`,
        `Margaux is planning ahead. A rival bank may offer to refinance later, so she wants to know: immediately after the ${ordinal(k)} repayment, how much will still be owed, and what fraction of the original ${eur(P)} will have been paid off?`,
      ],
      ask: `What fraction of the loan will have been repaid after ${k} repayments?`,
      timeline: {
        unit: 'year',
        show: T + 1,
        streams: [{ id: 'left', label: `Repayments still to come (${eur(pmt, 2)})`, periods: range(k + 1, T), direction: 'out' }],
        valueAt: { prompt: 'At which year do you value what is still owed?', period: k },
        explain: `After the ${ordinal(k)} repayment, payments ${k + 1} to ${T} remain. What is owed is their value at year ${k}.`,
      },
      formula: {
        options: ['loan-balance', 'loan-payment', 'annuity-due', 'fv-single'],
        correct: 'loan-balance',
        explain: 'The balance owed is the present value, at year k, of the payments still to come: an annuity of T − k payments.',
      },
      inputs: [
        { key: 'C', symbol: 'C', label: 'Annual repayment', unit: 'eur', expected: pmt, explain: 'Given in the story.' },
        { key: 'r', symbol: 'r', label: 'Interest rate', unit: 'pct', expected: r, explain: 'The loan rate.' },
        { key: 'n', symbol: 'T - k', label: 'Payments still to come', unit: 'count', expected: T - k, explain: `${T} − ${k} = ${T - k}.` },
        { key: 'PV', symbol: 'PV', label: 'Amount originally borrowed', unit: 'eur', expected: P, explain: 'Needed for the fraction.' },
      ],
      solve: (v) => ((v.PV - fin.annuity(v.C, v.r / 100, v.n)) / v.PV) * 100,
      answer: { label: 'Fraction of the loan repaid', unit: 'pct', explain: `Balance ${eur(bal, 2)}; (${eur(P)} − ${eur(bal)}) ÷ ${eur(P)} = ${pct(frac, 1)}.` },
      decision: {
        question: `After ${k} of ${T} repayments (${pct(timeShare, 0)} of the term), how does the fraction repaid compare with ${pct(timeShare, 0)}?`,
        options: [
          { id: 'less', label: 'Less' },
          { id: 'same', label: 'About the same' },
          { id: 'more', label: 'More' },
        ],
        correct: 'less',
        why: [
          { id: 'interest-early', label: 'Early payments are mostly interest, because the balance is high' },
          { id: 'equal-principal', label: 'Each payment repays the same amount of the loan' },
          { id: 'interest-original', label: 'Interest is charged only on the original amount' },
          { id: 'rate-falls', label: 'The interest rate falls over time' },
        ],
        correctWhy: 'interest-early',
        explain: `Only ${pct(frac, 1)} is repaid after ${pct(timeShare, 0)} of the term. Interest is charged on the balance, which is largest at the start.`,
      },
      working: [
        `B_{${k}} = \\frac{${w2(pmt)}}{${rd(r)}}\\left(1 - \\frac{1}{${onePlus(r)}^{${T - k}}}\\right) = €${w2(bal)}`,
        `\\text{fraction repaid} = \\frac{${w0(P)} - ${w2(bal)}}{${w0(P)}} = ${w2(frac)}\\%`,
      ],
      hints: {
        timeline: `Stand at year ${k}, just after that payment. Which payments are left?`,
        formula: 'What you owe equals the value of what you still have to pay.',
        inputs: 'Count the payments left, not the total.',
        answer: `First find the balance: ${w2(pmt)} × annuity factor for ${T - k} years. Then (loan − balance) ÷ loan.`,
        decision: 'Think about what each early payment is mostly made of.',
      },
      outcomes: {
        less: { valueDelta: 0, news: `Margaux notes it: after ${k} years, ${eur(bal)} is still owed.` },
        same: { valueDelta: 0, news: `Margaux corrects the plan: after ${k} years, ${eur(bal)} is still owed.` },
        more: { valueDelta: 0, news: `Margaux corrects the plan: after ${k} years, ${eur(bal)} is still owed.` },
      },
      cfoLine: `After ${k} of ${T} repayments: ${eur(bal)} owed, ${pct(frac, 1)} repaid.`,
    };
  },
});

export const interestShare = defineCalc({
  kind: 'calc',
  id: 'interest-share',
  title: 'Where the money goes',
  concept: 'interest-share',
  uses: ['loan-payment', 'loan-balance'],
  base: { P: 120000, r: 7, T: 10, k: 1, ctx: 'studio' as LoanCtx },
  vary: (rng) => {
    const T = pickInt(rng, 8, 25);
    return { P: pickInt(rng, 50000, 300000, 10000), r: pickRate(rng, 4, 9, 0.5), T, k: pickOne(rng, [1, 1, T]), ctx: 'generic' as LoanCtx };
  },
  build: ({ P, r, T, k, ctx }) => {
    const pmt = fin.loanPayment(P, dec(r), T);
    const before = fin.loanBalance(P, dec(r), T, k - 1);
    const interest = dec(r) * before;
    const share = (interest / pmt) * 100;
    const last = k === T;
    return {
      prompt: [
        loanIntro(ctx, P, r, T),
        `It is repaid in equal instalments of ${eur(pmt, 2)} at the end of each year.`,
        last
          ? `Just before the final repayment, the balance owed is ${eur(before, 2)}. Margaux wants to know how much of that final repayment is interest.`
          : 'Margaux wants to know how much of the first repayment is interest, and how much actually pays down the loan.',
      ],
      ask: `What fraction of the ${last ? 'final' : 'first'} repayment is interest?`,
      timeline: {
        unit: 'year',
        show: T + 1,
        streams: [
          { id: 'loan', label: `Loan received (${eur(P)})`, periods: [0], direction: 'in' },
          { id: 'pay', label: `Repayment (${eur(pmt, 2)})`, periods: range(1, T), direction: 'out' },
        ],
        valueAt: { prompt: `Interest in repayment ${k} is charged on the balance owed at which year?`, period: k - 1 },
        explain: `Repayment ${k} is at year ${k}. Its interest is charged on the balance at the start of that year: year ${k - 1}.`,
      },
      formula: {
        options: ['interest-share', 'loan-payment', 'loan-balance', 'apr-simple'],
        correct: 'interest-share',
        explain: 'Interest = r × balance at the start of the year. Divide by the payment for its share.',
      },
      inputs: [
        { key: 'B', symbol: 'B_{k-1}', label: 'Balance owed before this repayment', unit: 'eur', expected: before, explain: last ? 'Given in the story.' : 'Before the first repayment, the whole loan is owed.' },
        { key: 'r', symbol: 'r', label: 'Interest rate', unit: 'pct', expected: r, explain: 'The loan rate.' },
        { key: 'C', symbol: 'C', label: 'Repayment', unit: 'eur', expected: pmt, explain: 'Given in the story.' },
      ],
      solve: (v) => ((v.r / 100) * v.B * 100) / v.C,
      answer: { label: 'Interest share of the repayment', unit: 'pct', explain: `${rd(r)} × ${eur(before, 2)} = ${eur(interest, 2)}; ÷ ${eur(pmt, 2)} = ${pct(share, 1)}.` },
      decision: {
        question: 'How does the interest share change over the life of the loan?',
        options: [
          { id: 'falls', label: 'It falls' },
          { id: 'same', label: 'It stays the same' },
          { id: 'rises', label: 'It rises' },
        ],
        correct: 'falls',
        why: [
          { id: 'balance-shrinks', label: 'The balance owed shrinks, so each year’s interest is smaller' },
          { id: 'rate-cut', label: 'The bank lowers the rate as you repay' },
          { id: 'payment-rises', label: 'The repayment rises each year' },
          { id: 'fixed-split', label: 'Each repayment is split the same way' },
        ],
        correctWhy: 'balance-shrinks',
        explain: 'The repayment is fixed, but the balance it is charged on keeps falling, so the interest part shrinks and the principal part grows.',
      },
      working: [
        `\\text{Interest}_{${k}} = r \\times B_{${k - 1}} = ${rd(r)} \\times ${w2(before)} = ${w2(interest)}`,
        `\\text{share} = \\frac{${w2(interest)}}{${w2(pmt)}} = ${w2(share)}\\%`,
      ],
      hints: {
        timeline: 'Interest builds up during the year on what was owed at its start.',
        formula: 'You need the interest part of one payment, as a share of that payment.',
        inputs: last ? 'The balance before the final payment is given.' : 'Before any repayment, how much is owed?',
        answer: `${rd(r)} × ${w2(before)}, then divide by ${w2(pmt)}.`,
        decision: 'The payment is fixed. What happens to the balance it is charged on?',
      },
      outcomes: {
        falls: { valueDelta: 0, news: `Of the ${last ? 'final' : 'first'} repayment, ${pct(share, 1)} is interest.` },
        same: { valueDelta: 0, news: `Of the ${last ? 'final' : 'first'} repayment, ${pct(share, 1)} is interest.` },
        rises: { valueDelta: 0, news: `Of the ${last ? 'final' : 'first'} repayment, ${pct(share, 1)} is interest.` },
      },
      cfoLine: `Repayment ${k}: ${eur(interest)} interest, ${pct(share, 1)} of ${eur(pmt)}.`,
    };
  },
});

const compoundingWord: Record<number, { per: string; unit: 'month' | 'quarter' | 'half-year' }> = {
  12: { per: 'monthly', unit: 'month' },
  4: { per: 'quarterly', unit: 'quarter' },
  2: { per: 'every six months', unit: 'half-year' },
};

export const twoBanks = defineCalc({
  kind: 'calc',
  id: 'two-banks',
  title: 'A second quote',
  concept: 'apr-ear',
  base: { apr: 6.9, m: 12, rB: 7 },
  vary: (rng) => {
    const m = pickOne(rng, [12, 4, 2]);
    const apr = Math.round(pickRate(rng, 5, 9, 0.1) * 10) / 10;
    const e = fin.ear(dec(apr), m) * 100;
    return { apr, m, rB: Math.round((e + pickOne(rng, [-0.15, -0.08, 0.08, 0.15])) * 100) / 100 };
  },
  build: ({ apr, m, rB }) => {
    const earA = fin.ear(dec(apr), m) * 100;
    const mqCheaper = earA < rB;
    const word = compoundingWord[m];
    const yearlyCost = (Math.abs(earA - rB) / 100) * 120000;
    return {
      prompt: [
        'Before signing, you ask a second lender for a quote on the same loan.',
        `Merchant’s Quay Bank: ${pct(apr)} APR, with interest compounded ${word.per}.`,
        `Harbour Mutual: ${pct(rB, 2)} a year, compounded once a year.`,
        'Everything else about the two loans is identical.',
      ],
      ask: 'What is the effective annual rate on Merchant’s Quay’s loan? Which lender is cheaper?',
      timeline: {
        unit: word.unit,
        show: m,
        streams: [{ id: 'interest', label: `Interest added (${pct(Math.round((apr / m) * 1e4) / 1e4)} each time)`, periods: range(1, m), direction: 'out' }],
        explain: `Compounded ${word.per}: interest is added ${m} times a year, at the end of each ${word.unit}, so periods 1 to ${m}.`,
      },
      formula: {
        options: ['ear', 'apr-simple', 'simple-interest', 'fv-single'],
        correct: 'ear',
        explain: 'To compare rates with different compounding, convert both to an effective annual rate.',
      },
      inputs: [
        { key: 'APR', symbol: 'r_{APR}', label: 'Quoted APR', unit: 'pct', expected: apr, explain: 'The headline rate.' },
        { key: 'm', symbol: 'm', label: 'Compounding periods a year', unit: 'count', expected: m, explain: `${word.per[0].toUpperCase() + word.per.slice(1)}: ${m}.` },
      ],
      solve: (v) => (Math.pow(1 + v.APR / 100 / v.m, v.m) - 1) * 100,
      answer: { label: 'Merchant’s Quay’s EAR', unit: 'pct', explain: `(1 + ${rd(apr)}/${m})^${m} − 1 = ${pct(earA, 2)}.` },
      decision: {
        question: 'Which lender should the house use?',
        options: [
          { id: 'mq', label: 'Merchant’s Quay Bank' },
          { id: 'hm', label: 'Harbour Mutual' },
        ],
        correct: mqCheaper ? 'mq' : 'hm',
        why: [
          { id: 'ear-lower', label: 'Its effective annual rate is lower' },
          { id: 'apr-lower', label: 'Its quoted rate is lower' },
          { id: 'compounding', label: 'More frequent compounding always makes a loan cheaper' },
          { id: 'same', label: 'The rates are effectively the same' },
        ],
        correctWhy: 'ear-lower',
        explain: `Merchant’s Quay costs ${pct(earA, 2)} a year effective; Harbour Mutual ${pct(rB, 2)}.${!mqCheaper && apr < rB ? ' The lower headline rate is the dearer loan.' : ''}`,
      },
      working: [
        `r_{EAR} = \\left(1 + \\frac{${rd(apr)}}{${m}}\\right)^{${m}} - 1 = ${w4(1 + dec(apr) / m)}^{${m}} - 1`,
        `r_{EAR} = ${w2(earA)}\\% ${mqCheaper ? '<' : '>'} ${w2(rB)}\\% \\to \\text{${mqCheaper ? 'Merchant’s Quay' : 'Harbour Mutual'}}`,
      ],
      hints: {
        timeline: `How many times a year is interest added when it is compounded ${word.per}?`,
        formula: 'You need to put both rates on the same footing.',
        inputs: 'm is the number of compounding periods in a year.',
        answer: `Divide ${rd(apr)} by ${m}, add 1, raise to the power ${m}, subtract 1.`,
        decision: 'Compare effective rates, not headline rates.',
      },
      outcomes: {
        mq: {
          valueDelta: mqCheaper ? 0 : -yearlyCost * fin.annuityFactor(dec(rB), 10),
          news: mqCheaper ? 'Merchant’s Quay it is: the cheaper effective rate.' : `Merchant’s Quay chosen, but it costs about ${eur(yearlyCost)} a year more.`,
        },
        hm: {
          valueDelta: mqCheaper ? -yearlyCost * fin.annuityFactor(dec(earA), 10) : 0,
          news: mqCheaper ? `Harbour Mutual chosen, but it costs about ${eur(yearlyCost)} a year more.` : 'Harbour Mutual it is: the cheaper effective rate, despite the higher headline.',
        },
      },
      cfoLine: `${pct(apr)} APR compounded ${word.per} = ${pct(earA, 2)} EAR.`,
    };
  },
});

export const ACT1_PROBLEMS: Problem[] = [
  assetsClassify,
  decisionsClassify,
  goalsTrueFalse,
  agencyClassify,
  savingsNote,
  laserCutter,
  designPrize,
  royaltySale,
  idrisRoyalty,
  apprenticeFund,
  studioLease,
  cutterContract,
  loanPayment,
  loanBalance,
  interestShare,
  twoBanks,
];
