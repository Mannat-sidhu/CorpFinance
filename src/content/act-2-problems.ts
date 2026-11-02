// Chapter II problems: bonds. Numbers mirror the Ch3 problem set where answers are known.
import * as fin from '../engine/finance';
import { eur, pct } from '../engine/format';
import { pickInt, pickOne, pickRate } from '../engine/rng';
import type { BriefProblem, ClassifyProblem, Problem, TableProblem } from '../engine/types';
import { dec, defineCalc, onePlus, range, rd, roundTo, w0, w2, w4 } from './helpers';

const word = (n: number) => ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'][n] ?? String(n);

const premiumCall = (price: number, face: number) => (Math.abs(price - face) < 0.005 ? 'par' : price > face ? 'premium' : 'discount');

const premiumDecision = (price: number, face: number, coupon: number, y: number) => {
  const call = premiumCall(price, face);
  return {
    question: 'Will it sell at a premium, at a discount, or at par?',
    options: [
      { id: 'premium', label: 'Premium: above face value' },
      { id: 'discount', label: 'Discount: below face value' },
      { id: 'par', label: 'Par: exactly face value' },
    ],
    correct: call,
    why: [
      { id: 'below', label: 'The coupon rate is below the market yield' },
      { id: 'above', label: 'The coupon rate is above the market yield' },
      { id: 'equal', label: 'The coupon rate equals the market yield' },
      { id: 'long', label: 'Long bonds always sell below face value' },
    ],
    correctWhy: call === 'premium' ? 'above' : call === 'discount' ? 'below' : 'equal',
    explain:
      call === 'discount'
        ? `A ${pct(coupon)} coupon is less than the ${pct(y)} investors want, so they pay less than face value.`
        : call === 'premium'
          ? `A ${pct(coupon)} coupon beats the ${pct(y)} investors want, so they pay more than face value.`
          : 'Coupon and yield match, so the price is exactly face value.',
  };
};

// ---------------------------------------------------------------- sorting, tables, briefs

export const contractOrMarket: ClassifyProblem = {
  kind: 'classify',
  id: 'contract-or-market',
  title: 'Fixed or floating?',
  host: 'rupert',
  concept: 'bond-basics',
  prompt: ['Before we launch, a little test. Which of these are fixed in the bond contract, and which does the market decide every day?'],
  categories: [
    { id: 'contract', label: 'Fixed in the contract' },
    { id: 'market', label: 'Set by the market' },
  ],
  show: 5,
  items: [
    { text: 'The coupon rate', category: 'contract', why: 'Written into the bond when it is issued.' },
    { text: 'The face value', category: 'contract', why: 'What we repay at maturity: fixed.' },
    { text: 'The maturity date', category: 'contract', why: 'Fixed in the indenture.' },
    { text: 'The coupon in euros each year', category: 'contract', why: 'Coupon rate × face value: both fixed.' },
    { text: 'The bond’s price today', category: 'market', why: 'Whatever investors will pay, at today’s yields.' },
    { text: 'The yield to maturity', category: 'market', why: 'The market’s required return, which moves daily.' },
    { text: 'The default premium investors demand', category: 'market', why: 'It rises and falls with how risky the market thinks we are.' },
  ],
};

export const premiumTable: TableProblem = {
  kind: 'table',
  id: 'premium-table',
  title: 'Premium or discount?',
  host: 'margaux',
  concept: 'premium-discount',
  prompt: ['Fill this in for the board pack. For each bond: where does its price sit against face value, and which way will it drift as maturity gets closer?'],
  columns: [
    { label: 'Price v. face value', options: ['Above', 'Below', 'Equal'] },
    { label: 'As maturity nears, price…', options: ['Falls', 'Rises', 'Stays'] },
  ],
  rows: [
    { label: 'Coupon 8%, market yield 6%', answers: ['Above', 'Falls'], why: 'Coupon beats the yield: a premium, pulled down to par.' },
    { label: 'Coupon 4%, market yield 6%', answers: ['Below', 'Rises'], why: 'Coupon below the yield: a discount, pulled up to par.' },
    { label: 'Coupon 6%, market yield 6%', answers: ['Equal', 'Stays'], why: 'Coupon equals the yield: at par, and it stays there.' },
    { label: 'Yield to maturity below the coupon rate', answers: ['Above', 'Falls'], why: 'Same as coupon above yield: a premium bond.' },
  ],
};

export const ratingsClassify: ClassifyProblem = {
  kind: 'classify',
  id: 'ratings',
  title: 'Investment grade or junk?',
  host: 'rupert',
  concept: 'credit-risk',
  prompt: ['Ratings decide who’s allowed to buy your bonds. Sort these for me.'],
  categories: [
    { id: 'ig', label: 'Investment grade' },
    { id: 'junk', label: 'Junk (high-yield)' },
  ],
  show: 5,
  items: [
    { text: 'AAA', category: 'ig', why: 'The top rating.' },
    { text: 'AA+', category: 'ig', why: 'Very high quality.' },
    { text: 'A−', category: 'ig', why: 'Still comfortably investment grade.' },
    { text: 'BBB', category: 'ig', why: 'The lowest investment-grade rating.' },
    { text: 'BB+', category: 'junk', why: 'Just below the line: junk.' },
    { text: 'B', category: 'junk', why: 'Speculative.' },
    { text: 'CCC', category: 'junk', why: 'Default is a real possibility.' },
  ],
};

export const whyPayMore: BriefProblem = {
  kind: 'brief',
  id: 'why-pay-more',
  title: 'Why do we pay more?',
  host: 'idris',
  concept: 'credit-risk',
  prompt: [
    { who: 'idris', mood: 'worried', text: 'Why on earth are we paying 6% when the government borrows for ten years at 3%? Explain it to the board.' },
  ],
  question: 'Why do a company’s bonds offer a higher yield than government bonds of the same maturity?',
  cards: [
    { text: 'A company can default. A government borrowing in its own currency very rarely does.', kind: 'key', why: 'This is credit (default) risk.' },
    { text: 'Investors demand a default premium: extra yield for bearing that risk.', kind: 'key', why: 'The premium is the gap between the two yields.' },
    { text: 'The lower the credit rating, the bigger the default premium.', kind: 'key', why: 'Ratings measure the risk of default.' },
    { text: 'Default premiums widen in recessions, when defaults look more likely.', kind: 'key', why: 'The premium moves with the economy.' },
    { text: 'Company bonds are always longer, and longer bonds always pay more.', kind: 'trap', why: 'The comparison is at the same maturity.' },
    { text: 'A higher coupon makes our bond worth more, so we can afford it.', kind: 'trap', why: 'The higher yield compensates for risk; it doesn’t make the bond more valuable.' },
    { text: 'Bonds pay a fixed coupon until maturity.', kind: 'filler', why: 'True for both kinds of bond, so it doesn’t explain the gap.' },
  ],
  model:
    'Unlike a government, a company can fail to pay. Investors bear this credit (default) risk, so they demand a default premium: extra yield over a government bond of the same maturity. The premium is larger the lower the credit rating, and it widens in recessions, when defaults look more likely.',
};

// ---------------------------------------------------------------- calculations

export const houseBond = defineCalc({
  kind: 'calc',
  id: 'house-bond',
  title: 'Pricing our first bond',
  host: 'rupert',
  concept: 'bond-price',
  uses: ['annuity', 'pv-fv', 'premium-discount'],
  base: { face: 100, coupon: 5, years: 10, y: 6 },
  vary: (rng) => {
    const coupon = pickRate(rng, 3, 8, 0.5);
    return { face: pickOne(rng, [100, 1000]), coupon, years: pickInt(rng, 3, 12), y: coupon + pickOne(rng, [-2, -1, -0.5, 0.5, 1, 1.5, 2]) };
  },
  build: ({ face, coupon, years, y }) => {
    const C = (face * coupon) / 100;
    const price = fin.bondPrice(C, dec(y), years, face);
    const ann = fin.annuity(C, dec(y), years);
    const fv = fin.pvSingle(face, dec(y), years);
    return {
      prompt: [
        { who: 'rupert', text: `We’ll sell the bonds in ${eur(face)} lots. Each pays a ${pct(coupon)} coupon once a year and repays its ${eur(face)} face value in ${word(years)} years.` },
        { who: 'rupert', mood: 'happy', text: `Investors want ${pct(y)} on bonds like yours right now. So, what will they pay for each one?` },
        { who: 'margaux', text: 'Price it yourself before he does.' },
      ],
      ask: `What will investors pay for each ${eur(face)} bond? Premium or discount?`,
      timeline: {
        unit: 'year',
        show: years + 1,
        streams: [
          { id: 'coupon', label: `Coupon (${eur(C, 2)} a year)`, periods: range(1, years), direction: 'in' },
          { id: 'face', label: `Face value (${eur(face)})`, periods: [years], direction: 'in' },
        ],
        explain: `Coupons at the end of each year, years 1 to ${years}. The face value comes back once, at year ${years}, alongside the last coupon.`,
      },
      formula: { options: ['bond', 'annuity', 'pv-single', 'perpetuity'], correct: 'bond', explain: 'The coupons are an annuity; the face value is a single payment at maturity. Add both.' },
      inputs: [
        { key: 'C', symbol: 'C', label: 'Coupon each year', unit: 'eur', expected: C, explain: `${pct(coupon)} × ${eur(face)} = ${eur(C, 2)}.` },
        { key: 'F', symbol: 'F', label: 'Face value', unit: 'eur', expected: face, explain: 'Repaid at maturity.' },
        { key: 'r', symbol: 'r', label: 'Market yield', unit: 'pct', expected: y, explain: 'The market’s yield, not the coupon rate.' },
        { key: 'T', symbol: 'T', label: 'Years to maturity', unit: 'years', expected: years, explain: `${years} years.` },
      ],
      solve: (v) => fin.bondPrice(v.C, v.r / 100, v.T, v.F),
      answer: { label: 'Price of one bond', unit: 'eur', explain: `Coupons ${eur(ann, 2)} + face ${eur(fv, 2)} = ${eur(price, 2)}.` },
      decision: premiumDecision(price, face, coupon, y),
      working: [
        `PV = \\frac{${w2(C)}}{${rd(y)}}\\left(1 - \\frac{1}{${onePlus(y)}^{${years}}}\\right) + \\frac{${w0(face)}}{${onePlus(y)}^{${years}}}`,
        `PV = ${w2(ann)} + ${w2(fv)} = €${w2(price)}`,
      ],
      hints: {
        timeline: 'Two flows: the coupons every year, and the face value once at the end.',
        formula: 'Coupons and a lump sum at the end. One formula on the sheet does both.',
        inputs: 'The coupon is a euro amount: coupon rate × face value.',
        answer: `Coupons: ${w2(C)} × the annuity factor at ${rd(y)}. Face: ${w0(face)} ÷ ${onePlus(y)}^${years}.`,
        decision: 'Compare the coupon rate with the market yield.',
      },
      outcomes: Object.fromEntries(
        ['premium', 'discount', 'par'].map((k) => [
          k,
          {
            valueDelta: 0,
            cashDelta: (price / face) * 1_000_000,
            holding: { id: 'house-bond', label: `Bond coupons (${pct(coupon)} on €1m)`, start: 1, years, amount: -coupon * 10_000, final: -1_000_000 },
            news: `Bonds issued at ${eur(price, 2)} per ${eur(face)}: ${eur((price / face) * 1_000_000)} raised.`,
          },
        ]),
      ),
      cfoLine: `${pct(coupon)} coupon, ${years} years, at a ${pct(y)} yield: ${eur(price, 2)} per ${eur(face)}.`,
    };
  },
});

export const semiBond = defineCalc({
  kind: 'calc',
  id: 'semi-bond',
  title: 'Twice-a-year coupons',
  host: 'rupert',
  concept: 'bond-semiannual',
  uses: ['bond-price', 'premium-discount'],
  base: { face: 1000, coupon: 5.5, years: 10, y: 5.2 },
  vary: (rng) => {
    const coupon = pickRate(rng, 3, 8, 0.5);
    return { face: 1000, coupon, years: pickInt(rng, 3, 10), y: Math.round((coupon + pickOne(rng, [-2.5, -1.5, -0.3, 0.4, 1, 2])) * 10) / 10 };
  },
  build: ({ face, coupon, years, y }) => {
    const c2 = (face * coupon) / 200;
    const r2 = y / 2;
    const n = years * 2;
    const price = fin.bondPrice(c2, dec(r2), n, face);
    const ann = fin.annuity(c2, dec(r2), n);
    const fv = fin.pvSingle(face, dec(r2), n);
    return {
      prompt: [
        { who: 'rupert', text: `For the second issue, investors want coupons twice a year. ${eur(face)} bonds, ${pct(coupon)} coupon a year paid in two halves, ${word(years)} years to maturity.` },
        { who: 'rupert', text: `The market yield on similar bonds is ${pct(y)} a year, compounded half-yearly.` },
      ],
      ask: 'What is each bond worth? Premium or discount?',
      timeline: {
        unit: 'half-year',
        show: n,
        streams: [
          { id: 'coupon', label: `Half-yearly coupon (${eur(c2, 2)})`, periods: range(1, n), direction: 'in' },
          { id: 'face', label: `Face value (${eur(face)})`, periods: [n], direction: 'in' },
        ],
        explain: `${years} years of half-yearly coupons is ${n} periods. The face value comes at period ${n}.`,
      },
      formula: { options: ['bond-semi', 'bond', 'annuity-due', 'ear'], correct: 'bond-semi', explain: 'Same bond formula, on a six-month footing: coupon ÷ 2, yield ÷ 2, periods × 2.' },
      inputs: [
        { key: 'C', symbol: 'C/2', label: 'Coupon per half-year', unit: 'eur', expected: c2, explain: `${pct(coupon)} × ${eur(face)} ÷ 2 = ${eur(c2, 2)}.` },
        { key: 'F', symbol: 'F', label: 'Face value', unit: 'eur', expected: face, explain: 'Not halved.' },
        { key: 'r', symbol: 'r/2', label: 'Yield per half-year', unit: 'pct', expected: r2, explain: `${pct(y)} ÷ 2 = ${pct(r2, 2)}.` },
        { key: 'T', symbol: '2T', label: 'Number of half-years', unit: 'count', expected: n, explain: `${years} × 2 = ${n}.` },
      ],
      solve: (v) => fin.bondPrice(v.C, v.r / 100, v.T, v.F),
      answer: { label: 'Price of one bond', unit: 'eur', explain: `Coupons ${eur(ann, 2)} + face ${eur(fv, 2)} = ${eur(price, 2)}.` },
      decision: premiumDecision(price, face, coupon, y),
      working: [
        `C = ${w2(c2)},\\quad r = ${w4(r2)}\\%,\\quad T = ${n}`,
        `PV = \\frac{${w2(c2)}}{${rd(r2)}}\\left(1 - \\frac{1}{${onePlus(r2)}^{${n}}}\\right) + \\frac{${w0(face)}}{${onePlus(r2)}^{${n}}} = €${w2(price)}`,
      ],
      hints: {
        timeline: 'Count half-years, not years.',
        formula: 'The bond formula still works. Just change the period.',
        inputs: 'Halve the coupon and the yield. Double the years. Leave the face value alone.',
        answer: `Coupons: ${w2(c2)} × the annuity factor at ${rd(r2)} for ${n} periods. Face: ${w0(face)} ÷ ${onePlus(r2)}^${n}.`,
        decision: 'Compare the coupon rate with the yield.',
      },
      outcomes: Object.fromEntries(['premium', 'discount', 'par'].map((k) => [k, { valueDelta: 0, news: `Half-yearly bonds priced at ${eur(price, 2)}.` }])),
      cfoLine: `${pct(coupon)} half-yearly coupon at ${pct(y)}: ${eur(price, 2)}.`,
    };
  },
});

export const rateRise = defineCalc({
  kind: 'calc',
  id: 'rate-rise',
  title: 'Rates jump',
  host: 'margaux',
  concept: 'price-yield',
  uses: ['bond-price'],
  base: { face: 1000, coupon: 6, years: 10, y2: 8, held: 50 },
  vary: (rng) => {
    const coupon = pickRate(rng, 3, 8, 0.5);
    return { face: 1000, coupon, years: pickInt(rng, 5, 15), y2: coupon + pickOne(rng, [1, 1.5, 2, 3]), held: pickOne(rng, [20, 50, 100]) };
  },
  build: ({ face, coupon, years, y2, held }) => {
    const C = (face * coupon) / 100;
    const after = fin.bondPrice(C, dec(y2), years, face);
    const loss = (face - after) * held;
    return {
      prompt: [
        { who: 'margaux', text: `We hold ${held} government bonds: ${eur(face)} face, ${pct(coupon)} annual coupon, ${word(years)} years left. We bought them at par when yields were ${pct(coupon)}.` },
        { who: 'margaux', mood: 'worried', text: `This morning yields on bonds like these jumped to ${pct(y2)}.` },
      ],
      ask: 'What is each bond worth now? What has happened to its coupon rate, price and yield?',
      timeline: {
        unit: 'year',
        show: years + 1,
        streams: [
          { id: 'coupon', label: `Coupon (${eur(C)} a year)`, periods: range(1, years), direction: 'in' },
          { id: 'face', label: `Face value (${eur(face)})`, periods: [years], direction: 'in' },
        ],
        explain: `Nothing about the payments changes: ${eur(C)} a year to year ${years}, then the face value.`,
      },
      formula: { options: ['bond', 'annuity', 'pv-single', 'real-rate'], correct: 'bond', explain: 'Same bond, same payments, new discount rate.' },
      inputs: [
        { key: 'C', symbol: 'C', label: 'Coupon each year', unit: 'eur', expected: C, explain: 'Fixed by the contract.' },
        { key: 'F', symbol: 'F', label: 'Face value', unit: 'eur', expected: face, explain: 'Fixed.' },
        { key: 'r', symbol: 'r', label: 'New market yield', unit: 'pct', expected: y2, explain: 'Today’s yield, not the old one.' },
        { key: 'T', symbol: 'T', label: 'Years left', unit: 'years', expected: years, explain: `${years}.` },
      ],
      solve: (v) => fin.bondPrice(v.C, v.r / 100, v.T, v.F),
      answer: { label: 'New price of one bond', unit: 'eur', explain: `Discounting the same payments at ${pct(y2)} gives ${eur(after, 2)}.` },
      decision: {
        question: 'What happened to the coupon rate, the price and the yield?',
        options: [
          { id: 'a', label: 'Coupon rate unchanged · price down · yield up' },
          { id: 'b', label: 'Coupon rate up · price down · yield up' },
          { id: 'c', label: 'Nothing changes until maturity' },
        ],
        correct: 'a',
        why: [
          { id: 'fixed', label: 'The payments are fixed, so a higher yield needs a lower price' },
          { id: 'reset', label: 'The coupon resets to match the market' },
          { id: 'default', label: 'Prices only change if the issuer defaults' },
          { id: 'maturity', label: 'Bond prices only move as maturity approaches' },
        ],
        correctWhy: 'fixed',
        explain: `The coupon rate is fixed at ${pct(coupon)}. The yield rose to ${pct(y2)}, so the price fell to ${eur(after, 2)}.`,
      },
      working: [`PV = \\frac{${w0(C)}}{${rd(y2)}}\\left(1 - \\frac{1}{${onePlus(y2)}^{${years}}}\\right) + \\frac{${w0(face)}}{${onePlus(y2)}^{${years}}} = €${w2(after)}`],
      hints: {
        timeline: 'Has anything about the payments changed?',
        formula: 'It’s still a bond.',
        inputs: 'Only one input is new.',
        answer: `Discount ${w0(C)} a year and ${w0(face)} at year ${years}, at ${rd(y2)}.`,
        decision: 'Which of the three is written into the contract?',
      },
      outcomes: Object.fromEntries(['a', 'b', 'c'].map((k) => [k, { valueDelta: -loss, news: `Rates jumped to ${pct(y2)}: our ${held} bonds lost ${eur(loss)} of value overnight.` }])),
      cfoLine: `Yields to ${pct(y2)}: each bond now ${eur(after, 2)}.`,
    };
  },
});

export const maturityRisk = defineCalc({
  kind: 'calc',
  id: 'maturity-risk',
  title: 'Short or long?',
  host: 'margaux',
  concept: 'price-yield',
  base: { coupon: 6, y2: 8, short: 5, long: 10 },
  vary: (rng) => {
    const coupon = pickRate(rng, 3, 7, 0.5);
    const short = pickInt(rng, 2, 6);
    return { coupon, y2: coupon + pickOne(rng, [1, 2, 3]), short, long: short + pickInt(rng, 4, 15) };
  },
  build: ({ coupon, y2, short, long }) => {
    const face = 1000;
    const C = (face * coupon) / 100;
    const ps = fin.bondPrice(C, dec(y2), short, face);
    const pl = fin.bondPrice(C, dec(y2), long, face);
    const fs = ((face - ps) / face) * 100;
    const fl = ((face - pl) / face) * 100;
    return {
      prompt: [
        `Two of our holdings, both bought at par: ${pct(coupon)} annual coupons, €1,000 face. One has ${word(short)} years left, the other ${long}.`,
        `Yields have jumped to ${pct(y2)}. The ${long}-year bond has fallen ${pct(fl, 2)}. What about the ${short}-year one?`,
      ],
      ask: `By what percentage has the ${short}-year bond fallen?`,
      timeline: {
        unit: 'year',
        show: short + 1,
        streams: [
          { id: 'coupon', label: `Coupon (${eur(C)})`, periods: range(1, short), direction: 'in' },
          { id: 'face', label: 'Face value (€1,000)', periods: [short], direction: 'in' },
        ],
        explain: `The short bond pays coupons to year ${short}, then its face value.`,
      },
      formula: { options: ['bond', 'annuity', 'pv-single', 'ear'], correct: 'bond', explain: 'Price it at the new yield, then compare with the €1,000 it cost.' },
      inputs: [
        { key: 'C', symbol: 'C', label: 'Coupon', unit: 'eur', expected: C, explain: `${pct(coupon)} × €1,000.` },
        { key: 'F', symbol: 'F', label: 'Face value', unit: 'eur', expected: face, explain: '€1,000.' },
        { key: 'r', symbol: 'r', label: 'New yield', unit: 'pct', expected: y2, explain: 'Today’s yield.' },
        { key: 'T', symbol: 'T', label: 'Years left', unit: 'years', expected: short, explain: `${short}.` },
      ],
      solve: (v) => ((v.F - fin.bondPrice(v.C, v.r / 100, v.T, v.F)) / v.F) * 100,
      answer: { label: 'Fall in price', unit: 'pct', explain: `New price ${eur(ps, 2)}, down ${pct(fs, 2)} from €1,000.` },
      decision: {
        question: 'Which bond carries more interest-rate risk?',
        options: [
          { id: 'long', label: `The ${long}-year bond` },
          { id: 'short', label: `The ${short}-year bond` },
          { id: 'same', label: 'They’re the same' },
        ],
        correct: 'long',
        why: [
          { id: 'distant', label: 'More of its value sits far in the future, where a higher rate bites hardest' },
          { id: 'coupon', label: 'It has a higher coupon' },
          { id: 'default', label: 'Long bonds are more likely to default' },
          { id: 'same-rate', label: 'Both are discounted at the same rate, so they move together' },
        ],
        correctWhy: 'distant',
        explain: `${pct(fl, 2)} v. ${pct(fs, 2)}: the longer bond swings more.`,
      },
      working: [`P_{${short}} = €${w2(ps)},\\quad \\text{fall} = \\frac{1,000 - ${w2(ps)}}{1,000} = ${w2(fs)}\\%`, `\\text{${long}-year fall} = ${w2(fl)}\\% > ${w2(fs)}\\%`],
      hints: {
        timeline: 'Only the short bond’s payments.',
        formula: 'Price it, then compare.',
        inputs: 'Same coupon and face; fewer years.',
        answer: 'Price at the new yield, then (1,000 − price) ÷ 1,000.',
        decision: 'Which one has more payments far away?',
      },
      outcomes: Object.fromEntries(['long', 'short', 'same'].map((k) => [k, { valueDelta: 0, news: 'Margaux shortens the house’s bond holdings.' }])),
      cfoLine: `At ${pct(y2)}: ${short}-year down ${pct(fs, 2)}, ${long}-year down ${pct(fl, 2)}.`,
    };
  },
});

export const bondYtm = defineCalc({
  kind: 'calc',
  id: 'bond-ytm',
  title: 'What does it really yield?',
  host: 'margaux',
  concept: 'ytm',
  uses: ['bond-price', 'premium-discount'],
  base: { price: 950, face: 1000, coupon: 5, years: 3 },
  vary: (rng) => {
    const face = 1000;
    return { face, coupon: pickRate(rng, 3, 8, 0.5), years: pickInt(rng, 2, 6), price: roundTo(face * pickOne(rng, [0.9, 0.93, 0.96, 1.03, 1.06]), 5) };
  },
  build: ({ price, face, coupon, years }) => {
    const C = (face * coupon) / 100;
    const ytm = fin.solveRate((r) => fin.bondPrice(C, r, years, face), price) * 100;
    const above = price < face;
    return {
      prompt: [
        `A supplier’s selling its old bond to raise cash. ${eur(face)} face, ${pct(coupon)} annual coupon, ${word(years)} years to go.`,
        `They want ${eur(price)} for it. If we buy and hold to the end, what return do we get?`,
      ],
      ask: 'What is the bond’s yield to maturity?',
      timeline: {
        unit: 'year',
        show: years + 1,
        streams: [
          { id: 'coupon', label: `Coupon (${eur(C)})`, periods: range(1, years), direction: 'in' },
          { id: 'face', label: `Face value (${eur(face)})`, periods: [years], direction: 'in' },
        ],
        explain: `Coupons at years 1 to ${years}, face value at year ${years}. The price is paid today.`,
      },
      formula: { options: ['bond-ytm', 'bond', 'div-yield', 'ear'], correct: 'bond-ytm', explain: 'Set the bond formula equal to the price and find the rate that fits.' },
      inputs: [
        { key: 'C', symbol: 'C', label: 'Coupon', unit: 'eur', expected: C, explain: `${pct(coupon)} × ${eur(face)}.` },
        { key: 'F', symbol: 'F', label: 'Face value', unit: 'eur', expected: face, explain: 'Repaid at the end.' },
        { key: 'T', symbol: 'T', label: 'Years to maturity', unit: 'years', expected: years, explain: `${years}.` },
        { key: 'P', symbol: 'P', label: 'Price', unit: 'eur', expected: price, explain: 'What we’d pay today.' },
      ],
      solve: (v) => fin.solveRate((r) => fin.bondPrice(v.C, r, v.T, v.F), v.P) * 100,
      answer: { label: 'Yield to maturity', unit: 'pct', explain: `At ${pct(ytm, 2)} the payments are worth exactly ${eur(price)}.`, tolerance: 0.05 },
      tryRate: { valueLabel: 'Price', value: (rp) => fin.bondPrice(C, rp / 100, years, face), target: price, targetLabel: 'the asking price', unit: 'eur' },
      decision: {
        question: 'Is the yield above or below the coupon rate?',
        options: [
          { id: 'above', label: 'Above the coupon rate' },
          { id: 'below', label: 'Below the coupon rate' },
        ],
        correct: above ? 'above' : 'below',
        why: [
          { id: 'discount', label: 'We pay less than face value, so we gain at maturity on top of the coupons' },
          { id: 'premium', label: 'We pay more than face value, so we lose a little at maturity' },
          { id: 'always', label: 'Yield always equals the coupon rate' },
        ],
        correctWhy: above ? 'discount' : 'premium',
        explain: above ? `Bought at a discount, it yields ${pct(ytm, 2)}, more than the ${pct(coupon)} coupon.` : `Bought at a premium, it yields ${pct(ytm, 2)}, less than the ${pct(coupon)} coupon.`,
      },
      working: [
        `${w0(price)} = ${range(1, years)
          .map((t) => `\\frac{${w0(C + (t === years ? face : 0))}}{(1 + y)${t > 1 ? `^{${t}}` : ''}}`)
          .join(' + ')}`,
        `\\text{Trial and error: } y \\approx ${w2(ytm)}\\%`,
      ],
      hints: {
        timeline: 'Same shape as any bond.',
        formula: 'You know the price. The unknown is the rate.',
        inputs: 'Four numbers, all in the story.',
        answer: above ? `Price below face value, so start above ${pct(coupon)}.` : `Price above face value, so start below ${pct(coupon)}.`,
        decision: 'Did we pay more or less than face value?',
      },
      outcomes: { above: { valueDelta: 0, news: `The supplier’s bond yields ${pct(ytm, 2)}.` }, below: { valueDelta: 0, news: `The supplier’s bond yields ${pct(ytm, 2)}.` } },
      cfoLine: `${eur(price)} for a ${pct(coupon)}, ${years}-year bond: yield ${pct(ytm, 2)}.`,
    };
  },
});

export const realRate = defineCalc({
  kind: 'calc',
  id: 'real-rate',
  title: 'What do they really earn?',
  host: 'margaux',
  concept: 'real-nominal',
  base: { nominal: 10, inflation: 5 },
  vary: (rng) => ({ nominal: pickRate(rng, 3, 12, 0.5), inflation: pickRate(rng, 1, 8, 0.25) }),
  build: ({ nominal, inflation }) => {
    const real = ((1 + dec(nominal)) / (1 + dec(inflation)) - 1) * 100;
    const approx = nominal - inflation;
    return {
      prompt: [
        { who: 'margaux', text: `After the downgrade, our bonds yield ${pct(nominal)} a year. Inflation is expected to run at ${pct(inflation)} a year.` },
        { who: 'idris', text: `So investors really earn ${pct(approx)}. Simple.` },
        { who: 'margaux', text: 'Not quite. Work it out properly for the board.' },
      ],
      ask: 'What is the real rate investors earn?',
      timeline: {
        unit: 'year',
        show: 2,
        streams: [{ id: 'grow', label: `€1 grows to €${onePlus(nominal)}`, periods: [1], direction: 'in' }],
        explain: 'One year: €1 today becomes €(1 + nominal) at year 1, while prices rise by (1 + inflation).',
      },
      formula: { options: ['real-rate', 'nominal-minus', 'ear', 'fv-single'], correct: 'real-rate', explain: 'Divide growth in money by growth in prices.' },
      inputs: [
        { key: 'n', symbol: 'r_{nominal}', label: 'Nominal rate', unit: 'pct', expected: nominal, explain: 'The quoted yield.' },
        { key: 'i', symbol: 'i', label: 'Inflation', unit: 'pct', expected: inflation, explain: 'Expected inflation.' },
      ],
      solve: (v) => ((1 + v.n / 100) / (1 + v.i / 100) - 1) * 100,
      answer: { label: 'Real rate', unit: 'pct', explain: `${onePlus(nominal)} ÷ ${onePlus(inflation)} − 1 = ${pct(real, 2)}.` },
      decision: {
        question: 'Which figure goes in the board report?',
        options: [
          { id: 'exact', label: `${pct(Math.round(real * 100) / 100, 2)}, from the formula` },
          { id: 'approx', label: `${pct(approx)}, nominal minus inflation` },
        ],
        correct: 'exact',
        why: [
          { id: 'approx-only', label: 'Subtracting is only an approximation' },
          { id: 'same', label: 'They’re the same thing, so either will do' },
          { id: 'simpler', label: 'The simpler number is easier to explain' },
        ],
        correctWhy: 'approx-only',
        explain: `The exact real rate is ${pct(real, 2)}. ${pct(approx)} overstates it, and the gap grows as rates rise.`,
      },
      working: [`1 + r_{real} = \\frac{${onePlus(nominal)}}{${onePlus(inflation)}} = ${w4(1 + real / 100)}`, `r_{real} = ${w2(real)}\\%`],
      hints: {
        timeline: 'Just one year.',
        formula: 'It’s on the formula sheet.',
        inputs: 'Two rates.',
        answer: `${onePlus(nominal)} ÷ ${onePlus(inflation)}, then subtract 1.`,
        decision: 'Is subtracting exact?',
      },
      outcomes: { exact: { valueDelta: 0, news: `Real yield on our bonds: ${pct(real, 2)}.` }, approx: { valueDelta: 0, news: `Board told ${pct(approx)}; the true real yield is ${pct(real, 2)}.` } },
      cfoLine: `${pct(nominal)} nominal, ${pct(inflation)} inflation: ${pct(real, 2)} real.`,
    };
  },
});

export const realReturn2y = defineCalc({
  kind: 'calc',
  id: 'real-return-2y',
  title: 'Two years of inflation',
  host: 'margaux',
  concept: 'real-nominal',
  base: { r: 8, i1: 3, i2: 5 },
  vary: (rng) => ({ r: pickRate(rng, 3, 10, 0.5), i1: pickRate(rng, 1, 6, 0.5), i2: pickRate(rng, 1, 6, 0.5) }),
  build: ({ r, i1, i2 }) => {
    const nom = (Math.pow(1 + dec(r), 2) - 1) * 100;
    const real = (Math.pow(1 + dec(r), 2) / ((1 + dec(i1)) * (1 + dec(i2))) - 1) * 100;
    return {
      prompt: [
        `We bought a two-year ${pct(r)} bond at its face value, and we’ll reinvest the first coupon at ${pct(r)} too.`,
        `Inflation is ${pct(i1)} in the first year and ${pct(i2)} in the second.`,
      ],
      ask: 'What is our total real return over the two years?',
      timeline: {
        unit: 'year',
        show: 2,
        streams: [{ id: 'grow', label: `Money grows ${pct(r)} a year`, periods: [1, 2], direction: 'in' },
        ],
        explain: 'Growth in years 1 and 2, compounding. Inflation compounds over the same two years.',
      },
      formula: { options: ['real-compound', 'real-rate', 'nominal-minus', 'ear'], correct: 'real-compound', explain: 'Total nominal growth over total price growth, both compounded over the two years.' },
      inputs: [
        { key: 'r', symbol: 'r', label: 'Yield each year', unit: 'pct', expected: r, explain: 'Bought at par, so the yield is the coupon rate.' },
        { key: 'i1', symbol: 'i_{1}', label: 'Inflation, year 1', unit: 'pct', expected: i1, explain: 'First year.' },
        { key: 'i2', symbol: 'i_{2}', label: 'Inflation, year 2', unit: 'pct', expected: i2, explain: 'Second year.' },
      ],
      solve: (v) => (Math.pow(1 + v.r / 100, 2) / ((1 + v.i1 / 100) * (1 + v.i2 / 100)) - 1) * 100,
      answer: { label: 'Total real return over two years', unit: 'pct', explain: `Nominal ${pct(nom, 2)}; real ${onePlus(r)}² ÷ (${onePlus(i1)} × ${onePlus(i2)}) − 1 = ${pct(real, 2)}.` },
      decision: {
        question: 'How should the two years of inflation be combined?',
        options: [
          { id: 'multiply', label: `Multiply: ${onePlus(i1)} × ${onePlus(i2)}` },
          { id: 'add', label: `Add: ${pct(i1)} + ${pct(i2)}` },
        ],
        correct: 'multiply',
        why: [
          { id: 'compound', label: 'Prices compound: year 2 inflation applies to year 1’s higher prices' },
          { id: 'simple', label: 'Inflation is quoted per year, so the years add up' },
        ],
        correctWhy: 'compound',
        explain: `Prices rise by ${w4((1 + dec(i1)) * (1 + dec(i2)))} in total: the two rates compound.`,
      },
      working: [`1 + R_{nominal} = ${onePlus(r)}^{2} = ${w4(1 + nom / 100)}`, `1 + R_{real} = \\frac{${w4(1 + nom / 100)}}{${onePlus(i1)} \\times ${onePlus(i2)}} = ${w4(1 + real / 100)} \\to ${w2(real)}\\%`],
      hints: {
        timeline: 'Two years, compounding.',
        formula: 'Several years of inflation.',
        inputs: 'One yield, two inflation rates.',
        answer: `${onePlus(r)}², divided by ${onePlus(i1)} × ${onePlus(i2)}, minus 1.`,
        decision: 'Does inflation compound?',
      },
      outcomes: { multiply: { valueDelta: 0, news: `Real return over two years: ${pct(real, 2)}.` }, add: { valueDelta: 0, news: `Real return over two years: ${pct(real, 2)}.` } },
      cfoLine: `${pct(r)} for two years with ${pct(i1)} then ${pct(i2)} inflation: ${pct(real, 2)} real.`,
    };
  },
});

export const ACT2_PROBLEMS: Problem[] = [contractOrMarket, premiumTable, ratingsClassify, whyPayMore, houseBond, semiBond, rateRise, maturityRisk, bondYtm, realRate, realReturn2y];
