// Extra scenarios for ideas that had only one practice problem, so a repeat isn't the same story with new numbers.
// They sit in the practice pool (pop quizzes, the ledger, the clinic); no episode depends on them.
import * as fin from '../engine/finance';
import { eur, pct } from '../engine/format';
import { pickInt, pickOne, pickRate } from '../engine/rng';
import type { CalcProblem, Hints, InputSpec, ProblemInstance, StoryBeat, TimelineSpec } from '../engine/types';
import { dec, defineCalc, onePlus, range, rd, roundTo, w0, w2 } from './helpers';

const word = (n: number) => ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'][n] ?? String(n);

export interface Scenario {
  prompt: (string | StoryBeat)[];
  ask: string;
  timeline: TimelineSpec;
  formula: { options: string[]; correct: string; explain: string };
  inputs: InputSpec[];
  solve: (v: Record<string, number>) => number;
  answer: { label: string; unit: 'eur' | 'pct' | 'years' | 'count' | 'number'; explain: string; tolerance?: number };
  tryRate?: ProblemInstance['tryRate'];
  /** A yes/no call that follows from the number. */
  call: { question: string; yes: string; no: string; yesIf: boolean; whyYes: string; whyNo: string; explain: string };
  working: string[];
  hints: Hints;
  cfoLine: string;
  news: string;
}

/** Turns a compact scenario into a full five-move problem instance. */
export function scenario(s: Scenario): ProblemInstance {
  return {
    prompt: s.prompt,
    ask: s.ask,
    timeline: s.timeline,
    formula: s.formula,
    inputs: s.inputs,
    solve: s.solve,
    answer: s.answer,
    tryRate: s.tryRate,
    decision: {
      question: s.call.question,
      options: [
        { id: 'yes', label: s.call.yes },
        { id: 'no', label: s.call.no },
      ],
      correct: s.call.yesIf ? 'yes' : 'no',
      why: [
        { id: 'yes', label: s.call.whyYes },
        { id: 'no', label: s.call.whyNo },
        { id: 'raw', label: 'Compare the raw amounts without allowing for when they arrive' },
        { id: 'gut', label: 'It feels like the safer choice' },
      ],
      correctWhy: s.call.yesIf ? 'yes' : 'no',
      explain: s.call.explain,
    },
    working: s.working,
    hints: s.hints,
    outcomes: { yes: { valueDelta: 0, news: s.news }, no: { valueDelta: 0, news: s.news } },
    cfoLine: s.cfoLine,
  };
}

const around = (rng: () => number, pv: number, step: number) => roundTo(pv * pickOne(rng, [0.86, 0.94, 1.06, 1.14]), step);

// ---------------------------------------------------------------- perpetuities

export const freeholdRent: CalcProblem = defineCalc({
  kind: 'calc',
  id: 'freehold-rent',
  title: 'Mrs Ferriter’s freehold',
  host: 'ferriter',
  concept: 'perpetuity',
  uses: ['pv-fv'],
  base: { C: 12000, r: 6, price: 220000 },
  vary: (rng) => {
    const C = pickInt(rng, 6000, 24000, 1000);
    const r = pickRate(rng, 4, 9, 0.5);
    return { C, r, price: around(rng, fin.perpetuity(C, dec(r)), 1000) };
  },
  build: ({ C, r, price }) => {
    const pv = fin.perpetuity(C, dec(r));
    return scenario({
      prompt: [
        `There’s a little shop on Drury Street, dear. It lets for ${eur(C)} a year, and always will. The next rent is due a year from now. I’ll sell you the freehold for ${eur(price)}.`,
        { who: 'margaux', text: `Our money earns ${pct(r)} a year elsewhere, at similar risk. What is that rent worth?` },
      ],
      ask: 'What is the freehold worth today? Is her price fair?',
      timeline: { unit: 'year', show: 4, streams: [{ id: 'rent', label: `Rent (${eur(C)} a year)`, periods: range(1, 4), forever: true, direction: 'in' }], explain: 'The first rent is at year 1, then every year, forever.' },
      formula: { options: ['perpetuity', 'annuity', 'growing-perpetuity', 'delayed-perpetuity'], correct: 'perpetuity', explain: 'The same payment every year, forever, starting in a year: C ÷ r.' },
      inputs: [
        { key: 'C', symbol: 'C', label: 'Rent each year', unit: 'eur', expected: C, explain: 'Level, so no growth rate.' },
        { key: 'r', symbol: 'r', label: 'Discount rate', unit: 'pct', expected: r, explain: 'What our money earns elsewhere, not her asking price.' },
      ],
      solve: (v) => fin.perpetuity(v.C, v.r / 100),
      answer: { label: 'Value of the freehold', unit: 'eur', explain: `${eur(C)} ÷ ${rd(r)} = ${eur(pv)}.` },
      call: { question: `Pay ${eur(price)}?`, yes: 'Buy it', no: 'Walk away', yesIf: pv > price, whyYes: 'The price is below the present value of the rents', whyNo: 'The price is above the present value of the rents', explain: `Worth ${eur(pv)} against an asking price of ${eur(price)}.` },
      working: [`PV = \\frac{${w0(C)}}{${rd(r)}} = €${w2(pv)}`, `${w0(price)} ${pv > price ? '<' : '>'} ${w0(pv)}`],
      hints: { timeline: 'First rent at year 1, then forever.', formula: 'Same amount, forever.', inputs: 'Two numbers.', answer: `${w0(C)} ÷ ${rd(r)}.`, decision: 'Price against value.' },
      cfoLine: `Freehold worth ${eur(pv)} at ${pct(r)}.`,
      news: `The Drury Street freehold is worth ${eur(pv)}.`,
    });
  },
});

export const scholarshipFund: CalcProblem = defineCalc({
  kind: 'calc',
  id: 'scholarship-fund',
  title: 'Endowing a scholarship',
  host: 'celine',
  concept: 'perpetuity',
  uses: ['pv-fv'],
  base: { C: 8000, r: 5, have: 150000 },
  vary: (rng) => {
    const C = pickInt(rng, 4000, 15000, 500);
    const r = pickRate(rng, 3, 8, 0.5);
    return { C, r, have: around(rng, fin.perpetuity(C, dec(r)), 1000) };
  },
  build: ({ C, r, have }) => {
    const pv = fin.perpetuity(C, dec(r));
    return scenario({
      prompt: [
        `I want a scholarship in my name at the design school: ${eur(C)} to a student every year, starting a year from now, for as long as the school exists.`,
        { who: 'margaux', text: `We’d pay for it from a fund that earns ${pct(r)} a year, and spend only the interest. We could set aside ${eur(have)} today.` },
      ],
      ask: 'How much must go into the fund today? Is ' + eur(have) + ' enough?',
      timeline: { unit: 'year', show: 4, streams: [{ id: 'sch', label: `Scholarship (${eur(C)} a year)`, periods: range(1, 4), forever: true, direction: 'out' }], explain: 'Paid from year 1, every year, forever.' },
      formula: { options: ['perpetuity', 'annuity', 'growing-perpetuity', 'pv-single'], correct: 'perpetuity', explain: 'Spending only the interest means a perpetuity: the fund needed is C ÷ r.' },
      inputs: [
        { key: 'C', symbol: 'C', label: 'Scholarship each year', unit: 'eur', expected: C, explain: 'What the fund must pay out.' },
        { key: 'r', symbol: 'r', label: 'Return on the fund', unit: 'pct', expected: r, explain: 'The fund’s return.' },
      ],
      solve: (v) => fin.perpetuity(v.C, v.r / 100),
      answer: { label: 'Fund needed today', unit: 'eur', explain: `${eur(C)} ÷ ${rd(r)} = ${eur(pv)}.` },
      call: { question: `Is ${eur(have)} enough?`, yes: 'Yes, it covers it', no: 'No, it falls short', yesIf: have >= pv, whyYes: 'It is at least the present value of the payments', whyNo: 'It is less than the present value of the payments', explain: `Needed ${eur(pv)}; set aside ${eur(have)}.` },
      working: [`PV = \\frac{C}{r} = \\frac{${w0(C)}}{${rd(r)}} = €${w2(pv)}`],
      hints: { timeline: 'Payments at year 1 onwards, forever.', formula: 'Living off the interest forever.', inputs: 'Two numbers.', answer: `${w0(C)} ÷ ${rd(r)}.`, decision: 'Fund needed against fund available.' },
      cfoLine: `Scholarship needs ${eur(pv)} at ${pct(r)}.`,
      news: `The scholarship fund needs ${eur(pv)}.`,
    });
  },
});

// ---------------------------------------------------------------- growing perpetuities

export const inflationLicence: CalcProblem = defineCalc({
  kind: 'calc',
  id: 'inflation-licence',
  title: 'A licence that keeps up with prices',
  host: 'theo',
  concept: 'growing-perpetuity',
  uses: ['perpetuity'],
  base: { C: 20000, g: 2, r: 7, price: 380000 },
  vary: (rng) => {
    const C = pickInt(rng, 8000, 40000, 1000);
    const g = pickRate(rng, 1, 4, 0.5);
    const r = pickRate(rng, g + 3, 11, 0.5);
    return { C, g, r, price: around(rng, fin.growingPerpetuity(C, dec(r), dec(g)), 5000) };
  },
  build: ({ C, g, r, price }) => {
    const pv = fin.growingPerpetuity(C, dec(r), dec(g));
    return scenario({
      prompt: [
        { who: 'theo', mood: 'happy', text: `A Milan label wants to license our prints for good. The first payment is ${eur(C)}, due in a year, and every year after it goes up by ${pct(g)} to keep pace with prices.` },
        { who: 'theo', text: `They’ll buy the whole arrangement outright for ${eur(price)}. We discount at ${pct(r)}.` },
      ],
      ask: 'What are the licence payments worth today? Sell the arrangement?',
      timeline: { unit: 'year', show: 4, streams: [{ id: 'lic', label: `Licence (${eur(C)}, growing ${pct(g)})`, periods: range(1, 4), forever: true, direction: 'in' }], explain: 'First payment at year 1, growing each year, forever.' },
      formula: { options: ['growing-perpetuity', 'perpetuity', 'growing-annuity', 'delayed-perpetuity'], correct: 'growing-perpetuity', explain: 'Payments that grow at a steady rate forever: C₁ ÷ (r − g).' },
      inputs: [
        { key: 'C', symbol: 'C_{1}', label: 'First payment', unit: 'eur', expected: C, explain: 'Due in a year.' },
        { key: 'r', symbol: 'r', label: 'Discount rate', unit: 'pct', expected: r, explain: `${pct(r)}.` },
        { key: 'g', symbol: 'g', label: 'Growth each year', unit: 'pct', expected: g, explain: `${pct(g)}.` },
      ],
      solve: (v) => fin.growingPerpetuity(v.C, v.r / 100, v.g / 100),
      answer: { label: 'Present value of the licence', unit: 'eur', explain: `${eur(C)} ÷ (${rd(r)} − ${rd(g)}) = ${eur(pv)}.` },
      call: { question: `Sell for ${eur(price)}?`, yes: 'Sell', no: 'Keep the licence', yesIf: price > pv, whyYes: 'The offer is more than the present value of the payments', whyNo: 'The offer is less than the present value of the payments', explain: `Worth ${eur(pv)} against an offer of ${eur(price)}.` },
      working: [`PV = \\frac{${w0(C)}}{${rd(r)} - ${rd(g)}} = €${w2(pv)}`],
      hints: { timeline: 'Growing, so say it continues forever.', formula: 'Growth forever.', inputs: 'The first payment, not a later one.', answer: `${w0(C)} ÷ (${rd(r)} − ${rd(g)}).`, decision: 'Offer against value.' },
      cfoLine: `Licence worth ${eur(pv)}.`,
      news: `The Milan licence is worth ${eur(pv)}.`,
    });
  },
});

export const trustIncome: CalcProblem = defineCalc({
  kind: 'calc',
  id: 'trust-income',
  title: 'The family trust',
  host: 'idris',
  concept: 'growing-perpetuity',
  uses: ['perpetuity'],
  base: { C0: 15000, g: 3, r: 8, price: 330000 },
  vary: (rng) => {
    const C0 = pickInt(rng, 6000, 30000, 1000);
    const g = pickRate(rng, 1, 4, 0.5);
    const r = pickRate(rng, g + 3, 11, 0.5);
    return { C0, g, r, price: around(rng, fin.growingPerpetuity(C0 * (1 + dec(g)), dec(r), dec(g)), 5000) };
  },
  build: ({ C0, g, r, price }) => {
    const C1 = C0 * (1 + dec(g));
    const pv = fin.growingPerpetuity(C1, dec(r), dec(g));
    return scenario({
      prompt: [
        { who: 'idris', text: `A family trust of mine just paid out ${eur(C0)} this year. It has grown ${pct(g)} a year for as long as I can remember, and I see no reason it should stop.` },
        { who: 'idris', text: `I’ll let you have the whole income stream for ${eur(price)}. A friendly price.` },
        { who: 'margaux', text: `We discount at ${pct(r)}. Mind which payment is the first one we’d get.` },
      ],
      ask: 'What is the trust income worth to us today? Is the price friendly?',
      timeline: { unit: 'year', show: 4, streams: [{ id: 'trust', label: 'Trust income, growing', periods: range(1, 4), forever: true, direction: 'in' }], explain: 'The payout just made is gone. The first we’d receive is at year 1.' },
      formula: { options: ['growing-perpetuity', 'perpetuity', 'delayed-perpetuity', 'ddm-one'], correct: 'growing-perpetuity', explain: 'Growing forever: C₁ ÷ (r − g), where C₁ is next year’s payment, one growth step after the one just paid.' },
      inputs: [
        { key: 'C', symbol: 'C_{1}', label: 'The first payment we would get', unit: 'eur', expected: C1, explain: `${eur(C0)} × ${onePlus(g)} = ${eur(C1, 2)}. The ${eur(C0)} was this year’s.` },
        { key: 'r', symbol: 'r', label: 'Discount rate', unit: 'pct', expected: r, explain: `${pct(r)}.` },
        { key: 'g', symbol: 'g', label: 'Growth each year', unit: 'pct', expected: g, explain: `${pct(g)}.` },
      ],
      solve: (v) => fin.growingPerpetuity(v.C, v.r / 100, v.g / 100),
      answer: { label: 'Value of the trust income', unit: 'eur', explain: `${eur(C1, 2)} ÷ (${rd(r)} − ${rd(g)}) = ${eur(pv)}.` },
      call: { question: `Pay ${eur(price)}?`, yes: 'Buy it', no: 'Decline', yesIf: pv > price, whyYes: 'The price is below the present value of the income', whyNo: 'The price is above the present value of the income', explain: `Worth ${eur(pv)}; asking ${eur(price)}. Using the payout just made would have undervalued it.` },
      working: [`C_{1} = ${w0(C0)} \\times ${onePlus(g)} = ${w2(C1)}`, `PV = \\frac{${w2(C1)}}{${rd(r)} - ${rd(g)}} = €${w2(pv)}`],
      hints: { timeline: 'The payout just made is in the past.', formula: 'Growth, forever.', inputs: 'Move forward one year of growth.', answer: `Grow ${w0(C0)} once, then divide by r − g.`, decision: 'Price against value.' },
      cfoLine: `Trust income worth ${eur(pv)}.`,
      news: `The family trust income is worth ${eur(pv)}.`,
    });
  },
});

// ---------------------------------------------------------------- delayed perpetuity

export const namingRights: CalcProblem = defineCalc({
  kind: 'calc',
  id: 'naming-rights',
  title: 'Naming rights, eventually',
  host: 'idris',
  concept: 'delayed-perpetuity',
  uses: ['perpetuity', 'pv-fv'],
  base: { C: 18000, r: 6, first: 4, price: 190000 },
  vary: (rng) => {
    const C = pickInt(rng, 8000, 30000, 1000);
    const r = pickRate(rng, 4, 9, 0.5);
    const first = pickInt(rng, 3, 7);
    return { C, r, first, price: around(rng, fin.delayedPerpetuity(C, dec(r), first), 5000) };
  },
  build: ({ C, r, first, price }) => {
    const atPrev = fin.perpetuity(C, dec(r));
    const pv = fin.delayedPerpetuity(C, dec(r), first);
    return scenario({
      prompt: [
        `The new Liffey Quarter arcade will pay us ${eur(C)} a year, forever, for putting our name on its flagship unit. Nothing until it opens: the first payment arrives at the end of year ${first}.`,
        { who: 'idris', text: `Sell me the rights now for ${eur(price)}. It’s a gift to you, really.` },
        { who: 'margaux', text: `We discount at ${pct(r)}.` },
      ],
      ask: 'What are the rights worth today? Is his offer a gift?',
      timeline: { unit: 'year', show: first + 2, streams: [{ id: 'fee', label: `Naming fee (${eur(C)} a year)`, periods: range(first, first + 2), forever: true, direction: 'in' }], explain: `Nothing for ${first - 1} years; first payment at year ${first}, then forever.` },
      formula: { options: ['delayed-perpetuity', 'perpetuity', 'annuity', 'growing-perpetuity'], correct: 'delayed-perpetuity', explain: `Value the perpetuity at year ${first - 1} (one year before the first payment) with C ÷ r, then discount it back ${first - 1} years.` },
      inputs: [
        { key: 'C', symbol: 'C', label: 'Annual fee', unit: 'eur', expected: C, explain: 'Level.' },
        { key: 'r', symbol: 'r', label: 'Discount rate', unit: 'pct', expected: r, explain: `${pct(r)}.` },
        { key: 'D', symbol: 'D', label: 'Years to discount the perpetuity back', unit: 'years', expected: first - 1, explain: `C ÷ r is the value one year before the first payment: year ${first - 1}.` },
      ],
      solve: (v) => fin.perpetuity(v.C, v.r / 100) * fin.discountFactor(v.r / 100, v.D),
      answer: { label: 'Value of the rights today', unit: 'eur', explain: `${eur(atPrev)} at year ${first - 1}, discounted ${first - 1} years: ${eur(pv)}.` },
      call: { question: `Accept ${eur(price)}?`, yes: 'Sell the rights', no: 'Keep them', yesIf: price > pv, whyYes: 'The offer is more than what the rights are worth today', whyNo: 'The offer is less than what the rights are worth today', explain: `Worth ${eur(pv)} against ${eur(price)}.` },
      working: [`PV_{${first - 1}} = \\frac{${w0(C)}}{${rd(r)}} = ${w2(atPrev)}`, `PV_{0} = \\frac{${w2(atPrev)}}{${onePlus(r)}^{${first - 1}}} = €${w2(pv)}`],
      hints: { timeline: `The first payment is at year ${first}.`, formula: 'A perpetuity that starts late.', inputs: 'One less than the year of the first payment.', answer: 'C ÷ r, then discount it back.', decision: 'Offer against value today.' },
      cfoLine: `Naming rights worth ${eur(pv)} today.`,
      news: `The naming rights are worth ${eur(pv)}.`,
    });
  },
});

// ---------------------------------------------------------------- present and future value

export const fairFund: CalcProblem = defineCalc({
  kind: 'calc',
  id: 'fair-fund',
  title: 'The trade fair stand',
  host: 'theo',
  concept: 'pv-fv',
  base: { F: 40000, T: 4, r: 5, have: 32000 },
  vary: (rng) => {
    const F = pickInt(rng, 15000, 80000, 5000);
    const T = pickInt(rng, 2, 8);
    const r = pickRate(rng, 3, 8, 0.5);
    return { F, T, r, have: around(rng, fin.pvSingle(F, dec(r), T), 1000) };
  },
  build: ({ F, T, r, have }) => {
    const pv = fin.pvSingle(F, dec(r), T);
    return scenario({
      prompt: [
        { who: 'theo', text: `A stand at the Paris trade fair costs ${eur(F)}, and it’s ${word(T)} years until we can book it. I’d like the money put away now, in one go.` },
        { who: 'margaux', text: `A savings account pays ${pct(r)} a year. We could put in ${eur(have)} today.` },
      ],
      ask: 'How much must go in today to have the stand money on the day? Is ' + eur(have) + ' enough?',
      timeline: { unit: 'year', show: T, streams: [{ id: 'stand', label: `Stand (${eur(F)})`, periods: [T], direction: 'out' }], explain: `One payment, at year ${T}.` },
      formula: { options: ['pv-single', 'fv-single', 'annuity', 'perpetuity'], correct: 'pv-single', explain: 'One amount in the future, wanted in today’s money: divide by (1 + r)^T.' },
      inputs: [
        { key: 'F', symbol: 'C_{T}', label: 'Amount needed', unit: 'eur', expected: F, explain: 'The amount at the date.' },
        { key: 'r', symbol: 'r', label: 'Interest rate', unit: 'pct', expected: r, explain: `${pct(r)}.` },
        { key: 'T', symbol: 'T', label: 'Years', unit: 'years', expected: T, explain: `${T}.` },
      ],
      solve: (v) => fin.pvSingle(v.F, v.r / 100, v.T),
      answer: { label: 'Amount to deposit today', unit: 'eur', explain: `${eur(F)} ÷ ${onePlus(r)}^${T} = ${eur(pv, 2)}.` },
      call: { question: `Is ${eur(have)} enough?`, yes: 'Yes', no: 'No', yesIf: have >= pv, whyYes: 'It is at least the present value of the stand', whyNo: 'It is less than the present value of the stand', explain: `Needed ${eur(pv, 2)}; available ${eur(have)}.` },
      working: [`PV = \\frac{${w0(F)}}{${onePlus(r)}^{${T}}} = €${w2(pv)}`],
      hints: { timeline: 'One payment, far out.', formula: 'One amount, discounted.', inputs: 'Three numbers.', answer: `${w0(F)} ÷ ${onePlus(r)}^${T}.`, decision: 'Needed against available.' },
      cfoLine: `Stand money needs ${eur(pv, 2)} today.`,
      news: `The stand fund needs ${eur(pv)} today.`,
    });
  },
});

export const depositTarget: CalcProblem = defineCalc({
  kind: 'calc',
  id: 'deposit-target',
  title: 'Will the deposit get there?',
  host: 'aoife',
  concept: 'pv-fv',
  base: { P: 25000, T: 6, r: 4.5, goal: 33000 },
  vary: (rng) => {
    const P = pickInt(rng, 10000, 60000, 5000);
    const T = pickInt(rng, 3, 10);
    const r = pickRate(rng, 2, 7, 0.5);
    return { P, T, r, goal: roundTo(fin.fvSingle(P, dec(r), T) * pickOne(rng, [0.9, 0.96, 1.04, 1.1]), 500) };
  },
  build: ({ P, T, r, goal }) => {
    const fv = fin.fvSingle(P, dec(r), T);
    return scenario({
      prompt: [
        { who: 'aoife', text: `Our ${word(T)}-year deposit pays ${pct(r)} a year, interest added each year. Put in ${eur(P)} today and leave it.` },
        { who: 'margaux', text: `We’d like ${eur(goal)} at the end for the new workshop floor.` },
      ],
      ask: 'What will the deposit be worth at the end? Does it reach the goal?',
      timeline: { unit: 'year', show: T, streams: [{ id: 'dep', label: `Deposit (${eur(P)})`, periods: [0], direction: 'out' }, { id: 'back', label: 'Balance at the end', periods: [T], direction: 'in' }], explain: `Money in today; the grown balance comes out at year ${T}.` },
      formula: { options: ['fv-single', 'pv-single', 'simple-interest', 'annuity'], correct: 'fv-single', explain: 'Interest is added each year and itself earns interest: grow it by (1 + r)^T.' },
      inputs: [
        { key: 'P', symbol: 'C_{0}', label: 'Deposit today', unit: 'eur', expected: P, explain: 'What goes in.' },
        { key: 'r', symbol: 'r', label: 'Interest rate', unit: 'pct', expected: r, explain: `${pct(r)}.` },
        { key: 'T', symbol: 'T', label: 'Years', unit: 'years', expected: T, explain: `${T}.` },
      ],
      solve: (v) => fin.fvSingle(v.P, v.r / 100, v.T),
      answer: { label: 'Balance at the end', unit: 'eur', explain: `${eur(P)} × ${onePlus(r)}^${T} = ${eur(fv, 2)}.` },
      call: { question: `Does it reach ${eur(goal)}?`, yes: 'Yes', no: 'No', yesIf: fv >= goal, whyYes: 'The grown balance is at least the goal', whyNo: 'The grown balance is below the goal', explain: `${eur(fv, 2)} against ${eur(goal)}.` },
      working: [`FV = ${w0(P)} \\times ${onePlus(r)}^{${T}} = €${w2(fv)}`],
      hints: { timeline: 'Money in now, out at the end.', formula: 'Growing forward, not discounting.', inputs: 'Three numbers.', answer: `${w0(P)} × ${onePlus(r)}^${T}.`, decision: 'Balance against goal.' },
      cfoLine: `Deposit grows to ${eur(fv, 2)}.`,
      news: `The deposit grows to ${eur(fv)}.`,
    });
  },
});

// ---------------------------------------------------------------- loans

export const equipmentLoan: CalcProblem = defineCalc({
  kind: 'calc',
  id: 'equipment-loan',
  title: 'Financing the looms',
  host: 'aoife',
  concept: 'loan-payment',
  uses: ['annuity'],
  base: { P: 90000, r: 6.5, T: 8, budget: 14000 },
  vary: (rng) => {
    const P = pickInt(rng, 40000, 200000, 5000);
    const r = pickRate(rng, 4, 9, 0.5);
    const T = pickInt(rng, 4, 12);
    return { P, r, T, budget: roundTo(fin.loanPayment(P, dec(r), T) * pickOne(rng, [0.9, 0.97, 1.03, 1.1]), 500) };
  },
  build: ({ P, r, T, budget }) => {
    const pmt = fin.loanPayment(P, dec(r), T);
    return scenario({
      prompt: [
        { who: 'aoife', text: `We can lend you ${eur(P)} for the new looms at ${pct(r)} a year. Equal payments at the end of each year for ${word(T)} years, and it’s cleared.` },
        { who: 'margaux', text: `The workshop can spare ${eur(budget)} a year towards it.` },
      ],
      ask: 'What is the yearly payment? Can the workshop afford it?',
      timeline: { unit: 'year', show: T, streams: [{ id: 'loan', label: `Loan received (${eur(P)})`, periods: [0], direction: 'in' }, { id: 'pay', label: 'Yearly payment', periods: range(1, T), direction: 'out' }], explain: `Money in at year 0; equal payments at years 1 to ${T}.` },
      formula: { options: ['loan-payment', 'annuity', 'pv-single', 'simple-interest'], correct: 'loan-payment', explain: 'The payment is the C that makes the annuity’s present value equal the loan.' },
      inputs: [
        { key: 'P', symbol: 'PV', label: 'Amount borrowed', unit: 'eur', expected: P, explain: 'The loan.' },
        { key: 'r', symbol: 'r', label: 'Interest rate', unit: 'pct', expected: r, explain: `${pct(r)}.` },
        { key: 'T', symbol: 'T', label: 'Number of payments', unit: 'count', expected: T, explain: `${T}.` },
      ],
      solve: (v) => fin.loanPayment(v.P, v.r / 100, v.T),
      answer: { label: 'Yearly payment', unit: 'eur', explain: `${eur(P)} ÷ annuity factor (${pct(r)}, ${T} years) = ${eur(pmt, 2)}.` },
      call: { question: `Can the workshop afford it on ${eur(budget)} a year?`, yes: 'Yes', no: 'No', yesIf: pmt <= budget, whyYes: 'The payment is within what the workshop can spare', whyNo: 'The payment is more than what the workshop can spare', explain: `Payment ${eur(pmt, 2)} v. ${eur(budget)} available.` },
      working: [`C = \\frac{${w0(P)}}{\\frac{1}{${rd(r)}}\\left(1 - \\frac{1}{${onePlus(r)}^{${T}}}\\right)} = €${w2(pmt)}`],
      hints: { timeline: 'Money in now, equal payments after.', formula: 'Solve for the payment.', inputs: 'Three numbers.', answer: 'Divide the loan by the annuity factor.', decision: 'Payment against the budget.' },
      cfoLine: `Looms loan payment: ${eur(pmt, 2)} a year.`,
      news: `The looms loan costs ${eur(pmt)} a year.`,
    });
  },
});

export const earlyPayoff: CalcProblem = defineCalc({
  kind: 'calc',
  id: 'early-payoff',
  title: 'Paying it off early',
  host: 'aoife',
  concept: 'loan-balance',
  uses: ['loan-payment'],
  base: { P: 100000, r: 6, T: 10, k: 4, cash: 70000 },
  vary: (rng) => {
    const P = pickInt(rng, 50000, 200000, 10000);
    const r = pickRate(rng, 4, 9, 0.5);
    const T = pickInt(rng, 6, 15);
    const k = pickInt(rng, 2, T - 2);
    return { P, r, T, k, cash: roundTo(fin.loanBalance(P, dec(r), T, k) * pickOne(rng, [0.85, 0.96, 1.04, 1.15]), 1000) };
  },
  build: ({ P, r, T, k, cash }) => {
    const bal = fin.loanBalance(P, dec(r), T, k);
    const pmt = fin.loanPayment(P, dec(r), T);
    return scenario({
      prompt: [
        { who: 'aoife', text: `Your ${eur(P)} loan runs for ${word(T)} years at ${pct(r)}, with equal payments at the end of each year. You’ve made ${word(k)} so far.` },
        { who: 'margaux', text: `We have ${eur(cash)} sitting idle. Could we clear the whole loan with it, right after the ${word(k)}${k === 1 ? 'st' : k === 2 ? 'nd' : k === 3 ? 'rd' : 'th'} payment?` },
      ],
      ask: 'What do we still owe after those payments? Can the idle cash clear it?',
      timeline: { unit: 'year', show: T, streams: [{ id: 'left', label: 'Payments still to come', periods: range(k + 1, T), direction: 'out' }], explain: `After ${k} payments, ${T - k} are left: years ${k + 1} to ${T}.` },
      formula: { options: ['loan-balance', 'loan-payment', 'annuity-due', 'fv-single'], correct: 'loan-balance', explain: 'What you owe is the present value of the payments still to come.' },
      inputs: [
        { key: 'P', symbol: 'PV', label: 'Original loan', unit: 'eur', expected: P, explain: 'Needed to find the payment.' },
        { key: 'r', symbol: 'r', label: 'Interest rate', unit: 'pct', expected: r, explain: `${pct(r)}.` },
        { key: 'T', symbol: 'T', label: 'Original number of payments', unit: 'count', expected: T, explain: `${T}.` },
        { key: 'k', symbol: 'k', label: 'Payments made', unit: 'count', expected: k, explain: `${k}.` },
      ],
      solve: (v) => fin.loanBalance(v.P, v.r / 100, v.T, v.k),
      answer: { label: 'Balance still owed', unit: 'eur', explain: `Payment ${eur(pmt, 2)}; ${T - k} left, so the balance is ${eur(bal, 2)}.` },
      call: { question: `Clear it with ${eur(cash)}?`, yes: 'Yes, pay it off', no: 'No, not enough', yesIf: cash >= bal, whyYes: 'The cash covers the balance still owed', whyNo: 'The cash is less than the balance still owed', explain: `Owed ${eur(bal, 2)}; cash ${eur(cash)}.` },
      working: [`C = ${w2(pmt)}`, `Balance = ${w2(pmt)} \\times \\frac{1}{${rd(r)}}\\left(1 - \\frac{1}{${onePlus(r)}^{${T - k}}}\\right) = €${w2(bal)}`],
      hints: { timeline: 'Only the payments still to come.', formula: 'The loan’s remaining value.', inputs: 'Four numbers, and the payment comes from the first three.', answer: `Find the payment, then value the ${T - k} left.`, decision: 'Cash against the balance.' },
      cfoLine: `Balance after ${k} payments: ${eur(bal, 2)}.`,
      news: `Balance owed after ${k} payments: ${eur(bal)}.`,
    });
  },
});

export const interestBite: CalcProblem = defineCalc({
  kind: 'calc',
  id: 'interest-bite',
  title: 'How much of this payment is interest?',
  host: 'margaux',
  concept: 'interest-share',
  uses: ['loan-balance'],
  base: { P: 80000, r: 7, T: 8, k: 3 },
  vary: (rng) => {
    const T = pickInt(rng, 5, 15);
    return { P: pickInt(rng, 40000, 200000, 10000), r: pickRate(rng, 4, 10, 0.5), T, k: pickInt(rng, 1, T) };
  },
  build: ({ P, r, T, k }) => {
    const pmt = fin.loanPayment(P, dec(r), T);
    const before = fin.loanBalance(P, dec(r), T, k - 1);
    const interest = dec(r) * before;
    const share = fin.interestShare(P, dec(r), T, k) * 100;
    return scenario({
      prompt: [
        `We borrowed ${eur(P)} at ${pct(r)} a year, repaid in ${word(T)} equal yearly payments. The accountants want to know how much of payment number ${k} is interest, so it can be shown separately in the accounts.`,
      ],
      ask: `What share of payment ${k} is interest? Is it more than half?`,
      timeline: { unit: 'year', show: T, streams: [{ id: 'pay', label: 'Equal payments', periods: range(1, T), direction: 'out' }], explain: `${T} payments, one at the end of each year.` },
      formula: { options: ['interest-share', 'loan-balance', 'loan-payment', 'simple-interest'], correct: 'interest-share', explain: 'Interest = r × the balance owed just before the payment. Divide by the payment for the share.' },
      inputs: [
        { key: 'P', symbol: 'PV', label: 'Loan', unit: 'eur', expected: P, explain: 'The amount borrowed.' },
        { key: 'r', symbol: 'r', label: 'Interest rate', unit: 'pct', expected: r, explain: `${pct(r)}.` },
        { key: 'T', symbol: 'T', label: 'Number of payments', unit: 'count', expected: T, explain: `${T}.` },
        { key: 'k', symbol: 'k', label: 'Which payment', unit: 'count', expected: k, explain: `Number ${k}: interest is on the balance after ${k - 1} payments.` },
      ],
      solve: (v) => fin.interestShare(v.P, v.r / 100, v.T, v.k) * 100,
      answer: { label: 'Interest as a share of the payment', unit: 'pct', explain: `Payment ${eur(pmt, 2)}; balance before ${eur(before, 2)}; interest ${eur(interest, 2)}: ${pct(share, 1)}.` },
      call: { question: `Is more than half of payment ${k} interest?`, yes: 'Yes', no: 'No', yesIf: share > 50, whyYes: 'Interest on the balance still owed is over half the payment', whyNo: 'The balance has fallen enough that most of the payment repays principal', explain: `${pct(share, 1)} interest. Early payments are mostly interest; later ones mostly principal.` },
      working: [`C = ${w2(pmt)}`, `\\text{Balance after } ${k - 1} = ${w2(before)}`, `\\frac{${rd(r)} \\times ${w2(before)}}{${w2(pmt)}} = ${w2(share)}\\%`],
      hints: { timeline: 'Equal yearly payments.', formula: 'Interest is on what’s still owed.', inputs: 'Interest in payment k uses the balance after k − 1.', answer: 'Interest ÷ payment.', decision: 'Is the share above 50%?' },
      cfoLine: `Payment ${k}: ${pct(share, 1)} interest.`,
      news: `${pct(share, 1)} of payment ${k} is interest.`,
    });
  },
});

// ---------------------------------------------------------------- bonds

export const retailBond: CalcProblem = defineCalc({
  kind: 'calc',
  id: 'retail-bond',
  title: 'A bond on Rupert’s desk',
  host: 'rupert',
  concept: 'bond-price',
  uses: ['annuity', 'premium-discount'],
  base: { face: 1000, c: 4, T: 5, y: 6, ask: 900 },
  vary: (rng) => {
    const c = pickRate(rng, 2, 8, 0.5);
    const T = pickInt(rng, 3, 12);
    const y = Math.max(2, c + pickOne(rng, [-2, -1, 1, 2, 3]));
    return { face: 1000, c, T, y, ask: around(rng, fin.bondPrice((1000 * c) / 100, dec(y), T, 1000), 5) };
  },
  build: ({ face, c, T, y, ask }) => {
    const C = (face * c) / 100;
    const price = fin.bondPrice(C, dec(y), T, face);
    return scenario({
      prompt: [
        { who: 'rupert', text: `I can offer you a bond from a Lyon retailer: ${eur(face)} face value, a ${pct(c)} coupon paid once a year, ${word(T)} years left.` },
        { who: 'rupert', text: `Investors want ${pct(y)} on bonds of that risk. My price is ${eur(ask)} each.` },
      ],
      ask: 'What is the bond worth at that yield? Is Rupert’s price right?',
      timeline: { unit: 'year', show: T, streams: [{ id: 'coupon', label: `Coupon (${eur(C)} a year)`, periods: range(1, T), direction: 'in' }, { id: 'face', label: `Face value (${eur(face)})`, periods: [T], direction: 'in' }], explain: `Coupons at years 1 to ${T}; face value at year ${T}.` },
      formula: { options: ['bond', 'annuity', 'perpetuity', 'pv-single'], correct: 'bond', explain: 'Coupons are an annuity; the face value is one payment at maturity.' },
      inputs: [
        { key: 'C', symbol: 'C', label: 'Coupon each year', unit: 'eur', expected: C, explain: `${pct(c)} × ${eur(face)}.` },
        { key: 'F', symbol: 'F', label: 'Face value', unit: 'eur', expected: face, explain: 'Repaid at maturity.' },
        { key: 'r', symbol: 'r', label: 'Market yield', unit: 'pct', expected: y, explain: 'The yield investors want, not the coupon rate.' },
        { key: 'T', symbol: 'T', label: 'Years left', unit: 'years', expected: T, explain: `${T}.` },
      ],
      solve: (v) => fin.bondPrice(v.C, v.r / 100, v.T, v.F),
      answer: { label: 'Value of one bond', unit: 'eur', explain: `Coupons plus face value at ${pct(y)}: ${eur(price, 2)}.` },
      call: { question: `Pay ${eur(ask)}?`, yes: 'Buy', no: 'Pass', yesIf: price > ask, whyYes: 'The price is below what the bond is worth at the market yield', whyNo: 'The price is above what the bond is worth at the market yield', explain: `Worth ${eur(price, 2)} against ${eur(ask)} (${price < face ? 'a discount' : 'a premium'} bond).` },
      working: [`PV = \\frac{${w0(C)}}{${rd(y)}}\\left(1 - \\frac{1}{${onePlus(y)}^{${T}}}\\right) + \\frac{${w0(face)}}{${onePlus(y)}^{${T}}} = €${w2(price)}`],
      hints: { timeline: 'Coupons every year; face at the end.', formula: 'Annuity plus a lump sum.', inputs: 'The coupon is a euro amount.', answer: 'Annuity of coupons plus discounted face value.', decision: 'Price against value.' },
      cfoLine: `Lyon bond worth ${eur(price, 2)}.`,
      news: `The Lyon retailer’s bond is worth ${eur(price)}.`,
    });
  },
});

export const holdingValue: CalcProblem = defineCalc({
  kind: 'calc',
  id: 'bond-holding-value',
  title: 'What is our bond pile worth?',
  host: 'margaux',
  concept: 'bond-price',
  uses: ['annuity'],
  base: { n: 60, c: 3.5, T: 7, y: 5, bid: 52000 },
  vary: (rng) => {
    const n = pickInt(rng, 20, 120, 10);
    const c = pickRate(rng, 2, 7, 0.5);
    const T = pickInt(rng, 3, 10);
    const y = Math.max(2, c + pickOne(rng, [-1.5, -0.5, 1, 2]));
    return { n, c, T, y, bid: around(rng, n * fin.bondPrice(10 * c, dec(y), T, 1000), 1000) };
  },
  build: ({ n, c, T, y, bid }) => {
    const C = 10 * c;
    const one = fin.bondPrice(C, dec(y), T, 1000);
    const total = n * one;
    return scenario({
      prompt: [
        `We hold ${n} bonds from a Cork supplier. Each has a face value of €1,000 and pays a ${pct(c)} coupon once a year; ${word(T)} years remain.`,
        { who: 'rupert', text: `Similar bonds yield ${pct(y)} today. I’ll take the lot off your hands for ${eur(bid)}.` },
      ],
      ask: 'What is the whole holding worth? Sell to Rupert?',
      timeline: { unit: 'year', show: T, streams: [{ id: 'coupon', label: `Coupon (${eur(C)} a bond)`, periods: range(1, T), direction: 'in' }, { id: 'face', label: 'Face value (€1,000 a bond)', periods: [T], direction: 'in' }], explain: `Per bond: coupons at years 1 to ${T}, face value at year ${T}.` },
      formula: { options: ['bond', 'annuity', 'pv-single', 'real-rate'], correct: 'bond', explain: 'Price one bond, then multiply by how many we hold.' },
      inputs: [
        { key: 'n', symbol: 'n', label: 'Bonds held', unit: 'count', expected: n, explain: 'Multiply at the end.' },
        { key: 'C', symbol: 'C', label: 'Coupon per bond each year', unit: 'eur', expected: C, explain: `${pct(c)} × €1,000.` },
        { key: 'r', symbol: 'r', label: 'Market yield', unit: 'pct', expected: y, explain: `${pct(y)}.` },
        { key: 'T', symbol: 'T', label: 'Years left', unit: 'years', expected: T, explain: `${T}.` },
      ],
      solve: (v) => v.n * fin.bondPrice(v.C, v.r / 100, v.T, 1000),
      answer: { label: 'Value of the whole holding', unit: 'eur', explain: `${eur(one, 2)} a bond × ${n} = ${eur(total, 2)}.` },
      call: { question: `Take ${eur(bid)}?`, yes: 'Sell', no: 'Keep them', yesIf: bid > total, whyYes: 'The bid is more than the holding is worth at the market yield', whyNo: 'The bid is less than the holding is worth at the market yield', explain: `Worth ${eur(total, 2)} against ${eur(bid)}.` },
      working: [`P = \\frac{${w0(C)}}{${rd(y)}}\\left(1 - \\frac{1}{${onePlus(y)}^{${T}}}\\right) + \\frac{1000}{${onePlus(y)}^{${T}}} = ${w2(one)}`, `${n} \\times ${w2(one)} = €${w2(total)}`],
      hints: { timeline: 'Per bond: coupons and face value.', formula: 'The same bond formula.', inputs: 'One more number than usual: how many bonds.', answer: 'Price one, multiply by the number held.', decision: 'Bid against value.' },
      cfoLine: `Holding worth ${eur(total, 2)}.`,
      news: `The bond holding is worth ${eur(total)}.`,
    });
  },
});

// ---------------------------------------------------------------- stocks

export const retentionPlan: CalcProblem = defineCalc({
  kind: 'calc',
  id: 'retention-plan',
  title: 'Keep more, grow faster?',
  host: 'celine',
  concept: 'payout-plowback',
  uses: ['gordon'],
  base: { payout: 60, roe: 14, r: 10 },
  vary: (rng) => ({ payout: pickOne(rng, [30, 40, 50, 60, 70, 80]), roe: pickRate(rng, 6, 24, 1), r: pickRate(rng, 8, 14, 1) }),
  build: ({ payout, roe, r }) => {
    const b = 1 - payout / 100;
    const g = roe * b;
    const grow = roe > r;
    return scenario({
      prompt: [
        { who: 'celine', text: `You pay out ${pct(payout)} of your earnings as dividends. Retain more, and the house would grow faster.` },
        { who: 'margaux', text: `Whatever we keep earns ${pct(roe)} a year, on average. Investors want ${pct(r)}.` },
      ],
      ask: 'At the current payout, how fast do dividends grow? Should the house keep reinvesting?',
      timeline: { unit: 'year', show: 4, streams: [{ id: 'div', label: 'Dividends, growing at g', periods: range(1, 4), forever: true, direction: 'in' }], explain: 'Dividends from year 1, growing forever at the sustainable rate.' },
      formula: { options: ['sustainable-g', 'gordon', 'pvgo', 'div-yield'], correct: 'sustainable-g', explain: 'Growth comes from reinvested profit: g = ROE × plowback.' },
      inputs: [
        { key: 'p', symbol: '\\text{payout}', label: 'Payout ratio', unit: 'pct', expected: payout, explain: `${pct(payout)}; plowback is what’s left.` },
        { key: 'roe', symbol: 'ROE', label: 'Return on reinvested equity', unit: 'pct', expected: roe, explain: `${pct(roe)}.` },
      ],
      solve: (v) => v.roe * (1 - v.p / 100),
      answer: { label: 'Dividend growth rate', unit: 'pct', explain: `Plowback ${w2(b)}; g = ${pct(roe)} × ${w2(b)} = ${pct(g, 2)}.` },
      call: { question: 'Should the house keep reinvesting?', yes: 'Keep reinvesting', no: 'Pay more out', yesIf: grow, whyYes: 'Reinvested money earns more than investors require', whyNo: 'Reinvested money earns less than investors require', explain: `ROE ${pct(roe)} v. required return ${pct(r)}.` },
      working: [`b = 1 - ${w2(payout / 100)} = ${w2(b)}`, `g = ${rd(roe)} \\times ${w2(b)} = ${w2(g)}\\%`],
      hints: { timeline: 'Growing dividends, forever.', formula: 'Growth comes from reinvestment.', inputs: 'The required return isn’t used in the growth rate.', answer: `${pct(roe)} × (1 − ${w2(payout / 100)}).`, decision: 'ROE against the required return.' },
      cfoLine: `g = ${pct(g, 2)}.`,
      news: `Sustainable growth is ${pct(g, 2)}.`,
    });
  },
});

export const twoPhaseBoutique: CalcProblem = defineCalc({
  kind: 'calc',
  id: 'two-phase-boutique',
  title: 'A boutique that will mature',
  host: 'celine',
  concept: 'multi-stage',
  uses: ['growing-annuity', 'perpetuity'],
  base: { D1: 1.5, g: 8, N: 5, r: 12, price: 14 },
  vary: (rng) => {
    const D1 = pickRate(rng, 0.5, 4, 0.1);
    const g = pickRate(rng, 3, 10, 0.5);
    const N = pickInt(rng, 3, 8);
    const r = pickRate(rng, g + 2, 15, 0.5);
    return { D1, g, N, r, price: around(rng, fin.twoStage(D1, dec(r), dec(g), N), 0.5) };
  },
  build: ({ D1, g, N, r, price }) => {
    const v = fin.twoStage(D1, dec(r), dec(g), N);
    const last = D1 * Math.pow(1 + dec(g), N - 1);
    return scenario({
      prompt: [
        { who: 'celine', text: `A boutique chain will pay a dividend of ${eur(D1, 2)} a share next year. For the first ${word(N)} years of dividends, it grows ${pct(g)} a year. After that the chain has matured: the dividend stays flat for good.` },
        { who: 'margaux', text: `Investors require ${pct(r)}. The shares are on offer at ${eur(price, 2)}.` },
      ],
      ask: 'What is a share worth? Buy at the offered price?',
      timeline: {
        unit: 'year',
        show: N + 2,
        streams: [
          { id: 'g', label: `Growing dividends (from ${eur(D1, 2)})`, periods: range(1, N), direction: 'in' },
          { id: 'flat', label: 'Flat dividend, forever', periods: [N + 1, N + 2], forever: true, direction: 'in' },
        ],
        explain: `Dividends grow in years 1 to ${N}; from year ${N + 1} the dividend stays flat, forever.`,
      },
      formula: { options: ['two-stage', 'gordon', 'growing-annuity', 'perpetuity'], correct: 'two-stage', explain: `A growing annuity for the first ${N} dividends, plus the flat dividend as a perpetuity discounted back from year ${N}.` },
      inputs: [
        { key: 'D1', symbol: 'D_{1}', label: 'Next year’s dividend', unit: 'eur', expected: D1, explain: 'The first of the growing dividends.' },
        { key: 'r', symbol: 'r', label: 'Required return', unit: 'pct', expected: r, explain: `${pct(r)}.` },
        { key: 'g', symbol: 'g', label: 'Growth in the first phase', unit: 'pct', expected: g, explain: `${pct(g)}.` },
        { key: 'N', symbol: 'N', label: 'Years of growth', unit: 'years', expected: N, explain: `${N}.` },
      ],
      solve: (v) => fin.twoStage(v.D1, v.r / 100, v.g / 100, v.N),
      answer: { label: 'Value per share', unit: 'eur', explain: `The growth phase plus the flat phase (flat dividend ${eur(last, 2)}) comes to ${eur(v, 2)}.` },
      call: { question: `Buy at ${eur(price, 2)}?`, yes: 'Buy', no: 'Pass', yesIf: v > price, whyYes: 'The price is below the value', whyNo: 'The price is above the value', explain: `Worth ${eur(v, 2)} against ${eur(price, 2)}.` },
      working: [`PV_{growth} = \\frac{${w2(D1)}}{${rd(r)} - ${rd(g)}}\\left(1 - \\frac{${onePlus(g)}^{${N}}}{${onePlus(r)}^{${N}}}\\right)`, `D_{${N}} = ${w2(last)},\\quad \\frac{${w2(last)}}{${rd(r)}} \\cdot \\frac{1}{${onePlus(r)}^{${N}}}`, `P_{0} = €${w2(v)}`],
      hints: { timeline: 'Two phases: growing, then flat forever.', formula: 'Two pieces added together.', inputs: 'The last growing dividend comes from D₁ and g.', answer: 'Growing annuity plus discounted perpetuity.', decision: 'Value against price.' },
      cfoLine: `Boutique chain worth ${eur(v, 2)} a share.`,
      news: `The boutique chain is worth ${eur(v, 2)} a share.`,
    });
  },
});

// ---------------------------------------------------------------- capital budgeting

export const fitOutBook: CalcProblem = defineCalc({
  kind: 'calc',
  id: 'fit-out-book',
  title: 'The salon fit-out’s book return',
  host: 'kenji',
  concept: 'arr',
  uses: ['payback'],
  base: { cost: 60000, profits: [6000, 8000, 9000], r: 9 },
  vary: (rng) => {
    const n = pickInt(rng, 3, 5);
    return { cost: pickInt(rng, 30, 100, 10) * 1000, profits: range(1, n).map(() => pickInt(rng, 3, 14, 1) * 1000), r: pickRate(rng, 7, 13, 1) };
  },
  build: ({ cost, profits, r }) => {
    const n = profits.length;
    const avgProfit = profits.reduce((a, b) => a + b, 0) / n;
    const books = range(0, n - 1).map((t) => cost * (1 - t / n));
    const avgInv = books.reduce((a, b) => a + b, 0) / n;
    const arr = (avgProfit / avgInv) * 100;
    const inst = scenario({
      prompt: [
        { who: 'kenji', text: `The salon fit-out costs ${eur(cost)}, written off evenly over ${word(n)} years. Book profits in those years: ${profits.map((p) => eur(p)).join(', ')}.` },
        { who: 'kenji', text: `The board’s rule of thumb: approve anything with an accounting return above ${pct(r)}.` },
      ],
      ask: 'What is the accounting rate of return? Should the board rely on it?',
      timeline: { unit: 'year', show: n + 1, streams: [{ id: 'cost', label: `Fit-out (${eur(cost)})`, periods: [0], direction: 'out' }, { id: 'profit', label: 'Book profits', periods: range(1, n), direction: 'in' }], explain: `Fit-out today; book profits in years 1 to ${n}.` },
      formula: { options: ['arr', 'npv-sum', 'irr', 'payback'], correct: 'arr', explain: 'A book return: average profit ÷ average book investment.' },
      inputs: [
        { key: 'P', symbol: 'P_{avg}', label: 'Average annual profit', unit: 'eur', expected: avgProfit, explain: `(${profits.map(w0).join(' + ')}) ÷ ${n}.` },
        { key: 'I', symbol: 'I_{avg}', label: 'Average book investment', unit: 'eur', expected: avgInv, explain: `Book values at the start of each year: ${books.map((b) => w0(b)).join(', ')}.` },
      ],
      solve: (v) => (v.P / v.I) * 100,
      answer: { label: 'Accounting rate of return', unit: 'pct', explain: `${eur(avgProfit)} ÷ ${eur(avgInv)} = ${pct(arr, 2)}.` },
      call: { question: 'Can the board rely on this return to decide?', yes: 'Yes, approve if it’s above the rule', no: 'No, check the cash flows and NPV', yesIf: false, whyYes: 'An accounting return above the hurdle proves it creates value', whyNo: 'It uses book profit and ignores timing, so it can’t be compared with the cost of capital', explain: 'ARR is built from accounting profit, not cash, and ignores when cash arrives. Use NPV.' },
      working: [`P_{avg} = ${w0(avgProfit)},\\quad I_{avg} = ${w0(avgInv)}`, `ARR = \\frac{${w0(avgProfit)}}{${w0(avgInv)}} = ${w2(arr)}\\%`],
      hints: { timeline: 'Cost now, profits after.', formula: 'It’s about the books.', inputs: 'Average book value uses the start of each year.', answer: 'Average profit ÷ average investment.', decision: 'Is a book return a cash return?' },
      cfoLine: `Fit-out ARR ${pct(arr, 2)}.`,
      news: `The fit-out’s book return is ${pct(arr, 2)}.`,
    });
    // Three honest-looking options, so the lesson isn't given away by the wording of a yes/no.
    return {
      ...inst,
      decision: {
        question: `The board’s rule is “approve above ${pct(r)}”. This fit-out’s ARR is ${pct(arr, 1)}. What should it do?`,
        options: [
          { id: 'approve', label: arr > r ? 'Approve: it clears the rule' : 'Approve anyway' },
          { id: 'reject', label: arr > r ? 'Reject anyway' : 'Reject: it misses the rule' },
          { id: 'npv', label: 'Work out the NPV from the cash flows first' },
        ],
        correct: 'npv',
        why: [
          { id: 'book', label: 'ARR uses book profit and ignores timing, so it can’t be compared with the cost of capital' },
          { id: 'rule', label: 'A rule of thumb is a rule of thumb: follow it' },
          { id: 'high', label: 'A higher ARR always means a higher NPV' },
        ],
        correctWhy: 'book',
        explain: 'ARR is built from accounting profit, not cash, and ignores when cash arrives. Use NPV.',
      },
      outcomes: { approve: inst.outcomes.yes, reject: inst.outcomes.no, npv: inst.outcomes.yes },
    };
  },
});

export const shopfitIrr: CalcProblem = defineCalc({
  kind: 'calc',
  id: 'shopfit-irr',
  title: 'What does the new shopfit earn?',
  host: 'saoirse',
  concept: 'irr',
  uses: ['npv'],
  base: { flows: [-120000, 50000, 60000, 70000], r: 12 },
  vary: (rng) => {
    const cost = pickInt(rng, 60, 200, 10) * 1000;
    const k = [pickOne(rng, [0.3, 0.4, 0.5]), pickOne(rng, [0.4, 0.5, 0.6]), pickOne(rng, [0.4, 0.5, 0.6])];
    return { flows: [-cost, ...k.map((x) => roundTo(cost * x, 1000))], r: pickRate(rng, 6, 16, 1) };
  },
  build: ({ flows, r }) => {
    const rate = fin.irr(flows) * 100;
    const list = flows.map((c, t) => `year ${t}: ${c < 0 ? '−' : '+'}${eur(Math.abs(c))}`).join(', ');
    return scenario({
      prompt: [
        { who: 'saoirse', text: `The shopfit’s cash flows: ${list}.` },
        { who: 'margaux', text: `Our cost of capital is ${pct(r)}. Find the rate of return the project actually earns. You’ll have to hunt for it.` },
      ],
      ask: 'What is the IRR? Does it clear our cost of capital?',
      timeline: { unit: 'year', show: flows.length - 1, streams: [{ id: 'out', label: 'Cash going out', periods: [0], direction: 'out' }, { id: 'in', label: 'Cash coming in', periods: range(1, flows.length - 1), direction: 'in' }], explain: 'Cost today, then three years of cash in.' },
      formula: { options: ['irr', 'npv-sum', 'payback', 'arr'], correct: 'irr', explain: 'The IRR is the discount rate at which the NPV is zero.' },
      inputs: flows.map((c, t) => ({ key: `C${t}`, symbol: `C_{${t}}`, label: `Cash flow, year ${t}`, unit: 'eur' as const, expected: c, explain: c < 0 ? 'Cash out.' : 'Cash in.', signless: t === 0 })),
      solve: (v) => fin.irr([-Math.abs(v.C0), v.C1, v.C2, v.C3]) * 100,
      answer: { label: 'IRR', unit: 'pct', explain: `At ${pct(rate, 2)} the NPV is zero.`, tolerance: 0.05 },
      tryRate: { valueLabel: 'NPV', value: (rp) => fin.npv(rp / 100, flows), target: 0, targetLabel: 'NPV', unit: 'eur' },
      call: { question: `IRR against a ${pct(r)} cost of capital?`, yes: 'Accept', no: 'Reject', yesIf: rate > r, whyYes: 'The IRR is above the cost of capital', whyNo: 'The IRR is below the cost of capital', explain: `IRR ${pct(rate, 2)} v. ${pct(r)}. For a project with one sign change, this agrees with NPV.` },
      working: [`0 = ${w0(flows[0])} + \\frac{${w0(flows[1])}}{1 + IRR} + \\frac{${w0(flows[2])}}{(1 + IRR)^{2}} + \\frac{${w0(flows[3])}}{(1 + IRR)^{3}}`, `IRR \\approx ${w2(rate)}\\%`],
      hints: { timeline: 'Cost today, three inflows.', formula: 'The rate that makes NPV zero.', inputs: 'Four cash flows.', answer: 'Try rates until the NPV is near zero.', decision: 'IRR against cost of capital.' },
      cfoLine: `Shopfit IRR ${pct(rate, 2)}.`,
      news: `The shopfit earns ${pct(rate, 2)}.`,
    });
  },
});

export const taxShieldPv: CalcProblem = defineCalc({
  kind: 'calc',
  id: 'tax-shield-pv',
  title: 'What is the depreciation worth?',
  host: 'margaux',
  concept: 'depreciation-tax',
  uses: ['annuity'],
  base: { I: 300000, T: 5, t: 25, r: 10, fee: 40000 },
  vary: (rng) => {
    const I = pickInt(rng, 100, 500, 50) * 1000;
    const T = pickInt(rng, 3, 8);
    const t = pickInt(rng, 20, 32, 1);
    const r = pickRate(rng, 7, 13, 1);
    return { I, T, t, r, fee: roundTo((dec(t) * (I / T) * fin.annuityFactor(dec(r), T)) * pickOne(rng, [0.8, 0.95, 1.05, 1.2]), 1000) };
  },
  build: ({ I, T, t, r, fee }) => {
    const dep = I / T;
    const yearly = dec(t) * dep;
    const pv = fin.annuity(yearly, dec(r), T);
    return scenario({
      prompt: [
        `A new cutting line costs ${eur(I)}. The tax authority lets us write it off evenly over ${word(T)} years, and we pay tax at ${pct(t)}.`,
        { who: 'aoife', text: `We’ll arrange the finance for a flat fee of ${eur(fee)}.` },
        { who: 'margaux', text: `Depreciation isn’t cash, but it does something useful for the tax bill. Our cost of capital is ${pct(r)}. Does that benefit alone cover the fee?` },
      ],
      ask: 'What is the depreciation tax shield worth today? Does it cover the fee?',
      timeline: { unit: 'year', show: T, streams: [{ id: 'shield', label: `Tax saved (${pct(t)} × ${eur(dep)})`, periods: range(1, T), direction: 'in' }], explain: `The same tax saving at the end of each of years 1 to ${T}.` },
      formula: { options: ['dep-tax-shield', 'annuity', 'perpetuity', 'npv-sum'], correct: 'dep-tax-shield', explain: 'Each year’s shield is tax rate × depreciation, the same every year, so its PV is an annuity of that amount.' },
      inputs: [
        { key: 'S', symbol: 't \\times D', label: 'Tax saved each year', unit: 'eur', expected: yearly, explain: `${pct(t)} × (${eur(I)} ÷ ${T}) = ${eur(yearly, 2)}. Depreciation isn’t cash; only the tax saved is.` },
        { key: 'r', symbol: 'r', label: 'Cost of capital', unit: 'pct', expected: r, explain: `${pct(r)}.` },
        { key: 'T', symbol: 'T', label: 'Years', unit: 'years', expected: T, explain: `${T}.` },
      ],
      solve: (v) => fin.annuity(v.S, v.r / 100, v.T),
      answer: { label: 'Present value of the tax shield', unit: 'eur', explain: `${eur(yearly, 2)} a year for ${T} years at ${pct(r)} is ${eur(pv, 2)}.` },
      call: { question: `Does it cover the ${eur(fee)} fee?`, yes: 'Yes', no: 'No', yesIf: pv >= fee, whyYes: 'The present value of the shield is at least the fee', whyNo: 'The present value of the shield is less than the fee', explain: `Shield ${eur(pv, 2)} v. fee ${eur(fee)}.` },
      working: [`D = \\frac{${w0(I)}}{${T}} = ${w0(dep)}`, `\\text{Shield} = ${rd(t)} \\times ${w0(dep)} = ${w2(yearly)}`, `PV = \\frac{${w2(yearly)}}{${rd(r)}}\\left(1 - \\frac{1}{${onePlus(r)}^{${T}}}\\right) = €${w2(pv)}`],
      hints: { timeline: 'Only the tax saved is cash.', formula: 'A level amount for a number of years.', inputs: 'Tax rate × depreciation, not depreciation alone.', answer: 'An annuity of the yearly tax saving.', decision: 'Present value against the fee.' },
      cfoLine: `Depreciation shield worth ${eur(pv, 2)}.`,
      news: `The depreciation tax shield is worth ${eur(pv)}.`,
    });
  },
});

export const scrapThePress: CalcProblem = defineCalc({
  kind: 'calc',
  id: 'scrap-the-press',
  title: 'Selling the old press',
  host: 'kenji',
  concept: 'salvage',
  uses: ['depreciation-tax'],
  base: { cost: 80000, life: 8, used: 5, sale: 36000, t: 25, keep: 30000 },
  vary: (rng) => {
    const life = pickInt(rng, 5, 10);
    const cost = pickInt(rng, 40, 150, 10) * 1000;
    const used = pickInt(rng, 2, life - 1);
    const t = pickInt(rng, 20, 32, 1);
    const sale = roundTo(cost * pickOne(rng, [0.2, 0.3, 0.45, 0.55]), 1000);
    const bv = cost * (1 - used / life);
    const after = sale - dec(t) * (sale - bv);
    return { cost, life, used, sale, t, keep: roundTo(after * pickOne(rng, [0.85, 0.95, 1.05, 1.15]), 1000) };
  },
  build: ({ cost, life, used, sale, t, keep }) => {
    const bv = cost * (1 - used / life);
    const tax = dec(t) * (sale - bv);
    const after = sale - tax;
    return scenario({
      prompt: [
        { who: 'kenji', text: `The old press cost ${eur(cost)} and is depreciated evenly over ${word(life)} years. It’s ${word(used)} years old, and a dealer offers ${eur(sale)} for it.` },
        { who: 'margaux', text: `Any gain over book value is taxed at ${pct(t)} (and a loss saves tax). Keeping it is worth ${eur(keep)} to us in extra cash flow, in today’s money.` },
      ],
      ask: 'How much cash do we really get from the sale, after tax? Sell or keep?',
      timeline: { unit: 'year', show: 2, streams: [{ id: 'sale', label: `Sale (${eur(sale)}), taxed`, periods: [0], direction: 'in' }], explain: 'One cash flow, today, net of tax.' },
      formula: { options: ['after-tax-salvage', 'pv-single', 'annuity', 'npv-sum'], correct: 'after-tax-salvage', explain: 'After-tax salvage = sale price − tax × (sale price − book value).' },
      inputs: [
        { key: 'S', symbol: 'S', label: 'Sale price', unit: 'eur', expected: sale, explain: 'What the dealer pays.' },
        { key: 'B', symbol: 'BV', label: 'Book value today', unit: 'eur', expected: bv, explain: `${eur(cost)} × (1 − ${used}/${life}) = ${eur(bv, 2)}.` },
        { key: 't', symbol: 't', label: 'Tax rate', unit: 'pct', expected: t, explain: `${pct(t)}.` },
      ],
      solve: (v) => v.S - (v.t / 100) * (v.S - v.B),
      answer: { label: 'Cash after tax', unit: 'eur', explain: `${eur(sale)} − ${pct(t)} × (${eur(sale)} − ${eur(bv, 2)}) = ${eur(after, 2)}.` },
      call: { question: `Take ${eur(sale)}, or keep the press?`, yes: 'Sell', no: 'Keep it', yesIf: after > keep, whyYes: 'The cash after tax is more than keeping it is worth', whyNo: 'The cash after tax is less than keeping it is worth', explain: `After tax ${eur(after, 2)} v. ${eur(keep)} for keeping it.` },
      working: [`BV = ${w0(cost)}\\left(1 - \\frac{${used}}{${life}}\\right) = ${w2(bv)}`, `S - t(S - BV) = ${w0(sale)} - ${rd(t)}(${w0(sale)} - ${w2(bv)}) = €${w2(after)}`],
      hints: { timeline: 'One payment, today.', formula: 'Tax applies to the gain over book value.', inputs: 'Book value is what’s left after depreciation so far.', answer: 'Sale price minus the tax.', decision: 'After-tax cash against the value of keeping it.' },
      cfoLine: `Press sale nets ${eur(after, 2)}.`,
      news: `Selling the press nets ${eur(after)} after tax.`,
    });
  },
});

export const EXTRA_PROBLEMS: CalcProblem[] = [
  freeholdRent,
  scholarshipFund,
  inflationLicence,
  trustIncome,
  namingRights,
  fairFund,
  depositTarget,
  equipmentLoan,
  earlyPayoff,
  interestBite,
  retailBond,
  holdingValue,
  retentionPlan,
  twoPhaseBoutique,
  fitOutBook,
  shopfitIrr,
  taxShieldPv,
  scrapThePress,
];

