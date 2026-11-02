// Chapter IV problems: capital budgeting. Numbers mirror the Ch5–6 problem set, the slides and the 2022 paper (Q4).
import * as fin from '../engine/finance';
import { eur, pct } from '../engine/format';
import { pickInt, pickOne, pickRate } from '../engine/rng';
import type { BriefProblem, CalcProblem, ClassifyProblem, InputSpec, Problem, StoryBeat, TableProblem, WorksheetProblem, WorksheetRow } from '../engine/types';
import { dec, defineCalc, onePlus, range, rd, roundTo, w0, w2, w4 } from './helpers';

const word = (n: number) => ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'][n] ?? String(n);
const flowList = (flows: number[]) => flows.map((c, t) => `year ${t}: ${c < 0 ? '−' : '+'}${eur(Math.abs(c))}`).join(', ');

/** Timeline for uneven flows: one stream for cash in, one for cash out. */
function inOutTimeline(flows: number[], extra = 1) {
  const ins = flows.map((c, t) => (c > 0 ? t : -1)).filter((t) => t >= 0);
  const outs = flows.map((c, t) => (c < 0 ? t : -1)).filter((t) => t >= 0);
  return {
    unit: 'year' as const,
    show: flows.length - 1 + extra,
    streams: [
      ...(outs.length ? [{ id: 'out', label: 'Cash going out', periods: outs, direction: 'out' as const }] : []),
      ...(ins.length ? [{ id: 'in', label: 'Cash coming in', periods: ins, direction: 'in' as const }] : []),
    ],
    explain: `Cash out at year${outs.length > 1 ? 's' : ''} ${outs.join(', ')}; cash in at year${ins.length > 1 ? 's' : ''} ${ins.join(', ')}.`,
  };
}

const flowInputs = (flows: number[]): InputSpec[] =>
  flows.map((c, t) => ({
    key: `C${t}`,
    symbol: `C_{${t}}`,
    label: `Cash flow, year ${t}`,
    unit: 'eur' as const,
    expected: c,
    explain: c < 0 ? 'Cash out: negative.' : 'Cash in.',
    signless: t === 0,
  }));
const flowsFrom = (v: Record<string, number>, n: number) => range(0, n - 1).map((t) => (t === 0 ? -Math.abs(v.C0) : v[`C${t}`]));
const npvLine = (flows: number[], r: number) =>
  `NPV = ${flows.map((c, t) => (t === 0 ? `${c < 0 ? '-' : ''}${w0(Math.abs(c))}` : `${c < 0 ? '-' : '+'} \\frac{${w0(Math.abs(c))}}{${onePlus(r)}${t > 1 ? `^{${t}}` : ''}}`)).join(' ')}`;

// ---------------------------------------------------------------- generic NPV of uneven cash flows

interface NpvParams {
  name: string;
  flows: number[];
  r: number;
  who: StoryBeat['who'];
}

export const projectNpv: CalcProblem<NpvParams> = defineCalc<NpvParams>({
  kind: 'calc',
  id: 'project-npv',
  title: 'NPV of a project',
  host: 'theo',
  concept: 'npv',
  uses: ['pv-fv'],
  base: { name: 'Project X', flows: [-21000, 5500, 9000, 30200, -580], r: 12, who: 'theo' },
  vary: (rng) => {
    const cost = pickInt(rng, 10, 40, 1) * 1000;
    const n = pickInt(rng, 3, 5);
    const flows = [-cost, ...range(1, n).map(() => pickInt(rng, -2, 18, 1) * 1000)];
    return { name: 'the project', flows, r: pickRate(rng, 6, 14, 1), who: 'theo' };
  },
  build: ({ name, flows, r, who }) => {
    const value = fin.npv(dec(r), flows);
    const pvs = flows.map((c, t) => fin.pvSingle(c, dec(r), t));
    const pos = value > 0;
    return {
      prompt: [
        { who, text: `Here are ${name}’s cash flows: ${flowList(flows)}.` },
        { who: 'margaux', text: `Our cost of capital is ${pct(r)}.` },
      ],
      ask: `What is the NPV of ${name}? Should we take it?`,
      timeline: inOutTimeline(flows),
      formula: { options: ['npv-sum', 'annuity', 'irr', 'payback'], correct: 'npv-sum', explain: 'Uneven cash flows: discount each one and add.' },
      inputs: [...flowInputs(flows), { key: 'r', symbol: 'r', label: 'Cost of capital', unit: 'pct', expected: r, explain: 'The discount rate.' }],
      solve: (v) => fin.npv(v.r / 100, flowsFrom(v, flows.length)),
      answer: { label: `NPV of ${name}`, unit: 'eur', explain: `Sum of the discounted cash flows: ${eur(value, 2)}.` },
      decision: {
        question: `Take ${name}?`,
        options: [
          { id: 'accept', label: 'Accept' },
          { id: 'reject', label: 'Reject' },
        ],
        correct: pos ? 'accept' : 'reject',
        why: [
          { id: 'pos', label: 'NPV is positive' },
          { id: 'neg', label: 'NPV is negative' },
          { id: 'sum', label: 'The cash flows add up to more than the cost' },
          { id: 'fast', label: 'It pays back quickly' },
        ],
        correctWhy: pos ? 'pos' : 'neg',
        explain: `NPV ${eur(value, 2)} at ${pct(r)}: ${pos ? 'accept' : 'reject'}.`,
      },
      working: [npvLine(flows, r), `NPV = ${pvs.map((p) => w2(p)).join(' + ').replace(/\+ -/g, '- ')} = €${w2(value)}`],
      hints: {
        timeline: 'Some years bring cash in, some take it out.',
        formula: 'The cash flows aren’t level. Discount each one.',
        inputs: 'Watch the signs: any later negative flow stays negative.',
        answer: `Divide each year’s flow by ${onePlus(r)} to the power of its year, then add.`,
        decision: 'Positive NPV: take it.',
      },
      outcomes: { accept: { valueDelta: 0, news: `${name}: NPV ${eur(value)}.` }, reject: { valueDelta: 0, news: `${name}: NPV ${eur(value)}.` } },
      cfoLine: `${name}: NPV ${eur(value)} at ${pct(r)}.`,
    };
  },
});

// ---------------------------------------------------------------- Episode 1: three pitches

export const theoScarves = defineCalc({
  kind: 'calc',
  id: 'theo-scarves',
  title: 'Theo’s scarves',
  host: 'theo',
  concept: 'payback',
  uses: ['npv'],
  base: { flows: [-50000, 10000, 10000, 30000, 0], r: 10 },
  vary: (rng) => {
    const cost = pickInt(rng, 30, 80, 5) * 1000;
    const a = roundTo(cost * pickOne(rng, [0.15, 0.2, 0.25]), 1000);
    const b = roundTo(cost * pickOne(rng, [0.2, 0.25, 0.3]), 1000);
    const c = cost - a - b;
    return { flows: [-cost, a, b, c, pickOne(rng, [0, 0, 5000, 20000])], r: pickRate(rng, 6, 12, 1) };
  },
  build: ({ flows, r }) => {
    const value = fin.npv(dec(r), flows);
    const pb = fin.paybackYears(flows);
    const pos = value > 0;
    return {
      prompt: [
        { who: 'theo', mood: 'happy', text: `Silk scarves! ${eur(-flows[0])} to set up today. Then ${flows.slice(1).map((c, t) => `${eur(c)} in year ${t + 1}`).join(', ')}.` },
        { who: 'theo', mood: 'happy', text: `It pays for itself in ${pb.toFixed(1).replace('.0', '')} years. Can’t lose!` },
        { who: 'margaux', text: `Our cost of capital is ${pct(r)}. Let’s see what it’s actually worth.` },
      ],
      ask: 'What is the scarf line’s NPV? Do we launch it?',
      timeline: inOutTimeline(flows),
      formula: { options: ['npv-sum', 'payback', 'arr', 'annuity'], correct: 'npv-sum', explain: 'Payback answers the wrong question. NPV discounts every flow.' },
      inputs: [...flowInputs(flows), { key: 'r', symbol: 'r', label: 'Cost of capital', unit: 'pct', expected: r, explain: 'The discount rate.' }],
      solve: (v) => fin.npv(v.r / 100, flowsFrom(v, flows.length)),
      answer: { label: 'NPV of the scarf line', unit: 'eur', explain: `NPV = ${eur(value, 2)}.` },
      decision: {
        question: 'Launch the scarves?',
        options: [
          { id: 'launch', label: 'Launch' },
          { id: 'drop', label: 'Drop it' },
        ],
        correct: pos ? 'launch' : 'drop',
        why: [
          { id: 'pos', label: 'NPV is positive' },
          { id: 'neg', label: 'NPV is negative, whatever the payback' },
          { id: 'payback', label: `It pays back within ${Math.ceil(pb)} years` },
          { id: 'total', label: 'Total cash in beats the cost' },
        ],
        correctWhy: pos ? 'pos' : 'neg',
        explain: `Payback ${pb.toFixed(2)} years, but NPV ${eur(value, 2)}. Payback ignores the time value of money${flows[flows.length - 1] > 0 ? ' and cash after the cut-off' : ''}.`,
      },
      working: [`\\text{Payback} = ${w2(pb)} \\text{ years}`, npvLine(flows, r), `NPV = €${w2(value)} ${pos ? '> 0 \\to \\text{launch}' : '< 0 \\to \\text{drop}'}`],
      hints: {
        timeline: 'Cost today, cash in after.',
        formula: 'Which rule respects the time value of money?',
        inputs: 'Five cash flows and a rate.',
        answer: `Discount each year’s cash at ${onePlus(r)} and add the cost.`,
        decision: 'What does the NPV say?',
      },
      outcomes: {
        launch: { valueDelta: value, cashDelta: flows[0], holding: { id: 'scarves', label: 'Theo’s scarf line', start: 1, flows: flows.slice(1), amount: 0, spread: 0.3 }, news: pos ? `Scarves launched: +${eur(value)} of value.` : `Scarves launched anyway: ${eur(-value)} of value destroyed.` },
        drop: { valueDelta: 0, news: pos ? `Scarves dropped, giving up ${eur(value)}.` : 'Scarves dropped. Theo sulks; the house is better off.' },
      },
      cfoLine: `Scarves: payback ${pb.toFixed(1)} years, NPV ${eur(value)}.`,
    };
  },
});

export const paybackTable: TableProblem = {
  kind: 'table',
  id: 'payback-table',
  title: 'Payback v. NPV',
  host: 'margaux',
  concept: 'payback',
  prompt: [
    'Three projects, each with a cost today and cash after. The cost of capital is 10%.',
    'A: −5,000, then 1,000, 1,000, 3,000, 0. B: −1,000, then 0, 1,000, 2,000, 3,000. C: −5,000, then 1,000, 1,000, 3,000, 5,000.',
  ],
  columns: [
    { label: 'Payback', options: ['1 year', '2 years', '3 years', '4 years'] },
    { label: 'Accept with a 2-year cut-off?', options: ['Yes', 'No'] },
    { label: 'Positive NPV at 10%?', options: ['Yes', 'No'] },
  ],
  rows: [
    { label: 'Project A', answers: ['3 years', 'No', 'No'], why: '1,000 + 1,000 + 3,000 = 5,000 by year 3. NPV = −1,010.52: nothing after year 3 to save it.' },
    { label: 'Project B', answers: ['2 years', 'Yes', 'Yes'], why: '0 + 1,000 = 1,000 by year 2. NPV = +3,378.' },
    { label: 'Project C', answers: ['3 years', 'No', 'Yes'], why: 'Pays back in year 3, so a 2-year cut-off rejects it, yet NPV = +2,405 thanks to year 4.' },
  ],
};

export const arrSpiral = defineCalc({
  kind: 'calc',
  id: 'arr-spiral',
  title: 'A 14% book return?',
  host: 'theo',
  concept: 'arr',
  base: { cost: 80000, profits: [5000, 6000, 10000, 7000], r: 10 },
  vary: (rng) => {
    const cost = pickInt(rng, 40, 120, 10) * 1000;
    return { cost, profits: range(1, 4).map(() => pickInt(rng, 2, 14, 1) * 1000), r: pickRate(rng, 8, 14, 1) };
  },
  build: ({ cost, profits, r }) => {
    const n = profits.length;
    const avgProfit = profits.reduce((a, b) => a + b, 0) / n;
    const books = range(0, n - 1).map((t) => cost * (1 - t / n));
    const avgInv = books.reduce((a, b) => a + b, 0) / n;
    const arr = (avgProfit / avgInv) * 100;
    return {
      prompt: [
        { who: 'theo', mood: 'happy', text: `My embroidery machine: ${eur(cost)}, written off straight-line over ${word(n)} years. Book profits: ${profits.map((p) => eur(p)).join(', ')}.` },
        { who: 'theo', mood: 'happy', text: `Work out the return on the books. I make it way above our ${pct(r)} cost of capital!` },
      ],
      ask: 'What is the accounting rate of return? Does it prove the machine beats our cost of capital?',
      timeline: {
        unit: 'year',
        show: n + 1,
        streams: [
          { id: 'cost', label: `Machine (${eur(cost)})`, periods: [0], direction: 'out' },
          { id: 'profit', label: 'Book profits', periods: range(1, n), direction: 'in' },
        ],
        explain: `Machine bought today; profits booked in years 1 to ${n}.`,
      },
      formula: { options: ['arr', 'npv-sum', 'irr', 'payback'], correct: 'arr', explain: 'Theo is quoting a book return: average profit ÷ average book investment.' },
      inputs: [
        { key: 'P', symbol: 'P_{avg}', label: 'Average annual profit', unit: 'eur', expected: avgProfit, explain: `(${profits.map(w0).join(' + ')}) ÷ ${n} = ${eur(avgProfit)}.` },
        { key: 'I', symbol: 'I_{avg}', label: 'Average book investment', unit: 'eur', expected: avgInv, explain: `Book values at the start of each year: ${books.map((b) => w0(b)).join(', ')}; average ${eur(avgInv)}.` },
      ],
      solve: (v) => (v.P / v.I) * 100,
      answer: { label: 'Accounting rate of return', unit: 'pct', explain: `${eur(avgProfit)} ÷ ${eur(avgInv)} = ${pct(arr, 2)}.` },
      decision: {
        question: `Theo says ${pct(Math.round(arr * 10) / 10)} beats our ${pct(r)}, so it’s a winner. Agree?`,
        options: [
          { id: 'unknown', label: 'Can’t tell from this' },
          { id: 'agree', label: arr > r ? 'Yes, it beats our cost of capital' : 'No, it falls short' },
        ],
        correct: 'unknown',
        why: [
          { id: 'flaws', label: 'ARR uses book profit, not cash, and ignores timing, so it isn’t comparable with the cost of capital' },
          { id: 'compare', label: 'Any return above the cost of capital is worth taking' },
          { id: 'depr', label: 'Depreciation makes the return look worse than it is' },
        ],
        correctWhy: 'flaws',
        explain: 'A book return can’t be compared with the cost of capital. Work out the NPV from the cash flows.',
      },
      working: [`P_{avg} = ${w0(avgProfit)},\\quad I_{avg} = \\frac{${books.map((b) => w0(b)).join(' + ')}}{${n}} = ${w0(avgInv)}`, `ARR = \\frac{${w0(avgProfit)}}{${w0(avgInv)}} = ${w2(arr)}\\%`],
      hints: {
        timeline: 'Cost today, profits later.',
        formula: 'Theo is talking about the books.',
        inputs: 'Average book investment uses the value at the start of each year.',
        answer: 'Average profit ÷ average investment.',
        decision: 'Is a book return a cash return?',
      },
      outcomes: { unknown: { valueDelta: 0, news: 'Margaux asks Theo for cash flows, not book profits.' }, agree: { valueDelta: 0, news: 'The board nods along to a book return.' } },
      cfoLine: `ARR ${pct(arr, 1)}, which says nothing about NPV.`,
    };
  },
});

// ---------------------------------------------------------------- Episode 2: the IRR trap

export const irrBasic = defineCalc({
  kind: 'calc',
  id: 'irr-basic',
  title: 'Saoirse’s workshop',
  host: 'saoirse',
  concept: 'irr',
  uses: ['npv'],
  base: { cost: 100000, C: 50000, T: 3, r: 10 },
  vary: (rng) => {
    const cost = pickInt(rng, 50, 200, 10) * 1000;
    return { cost, C: roundTo(cost * pickOne(rng, [0.25, 0.3, 0.35, 0.45]), 1000), T: pickInt(rng, 3, 6), r: pickRate(rng, 8, 16, 1) };
  },
  build: ({ cost, C, T, r }) => {
    const flows = [-cost, ...range(1, T).map(() => C)];
    const rate = fin.irr(flows) * 100;
    const ok = rate > r;
    return {
      prompt: [
        { who: 'saoirse', text: `A leather workshop. ${eur(cost)} to fit out today, then ${eur(C)} a year for ${word(T)} years.` },
        { who: 'saoirse', mood: 'happy', text: 'I want to know what return it earns. Not the NPV: the rate.' },
        { who: 'margaux', text: `Fine. Then compare it with our ${pct(r)} cost of capital.` },
      ],
      ask: 'What is the workshop’s IRR? Do we build it?',
      timeline: inOutTimeline(flows),
      formula: { options: ['irr', 'npv-sum', 'arr', 'payback'], correct: 'irr', explain: 'The IRR is the rate that makes NPV zero.' },
      inputs: [
        { key: 'C0', symbol: 'C_{0}', label: 'Cost today', unit: 'eur', expected: -cost, explain: 'Cash out.', signless: true },
        { key: 'C', symbol: 'C', label: 'Cash each year', unit: 'eur', expected: C, explain: 'Level.' },
        { key: 'T', symbol: 'T', label: 'Years', unit: 'years', expected: T, explain: `${T}.` },
      ],
      solve: (v) => fin.irr([-Math.abs(v.C0), ...range(1, Math.round(v.T)).map(() => v.C)]) * 100,
      answer: { label: 'IRR', unit: 'pct', explain: `At ${pct(rate, 2)} the NPV is zero.`, tolerance: 0.05 },
      tryRate: { valueLabel: 'NPV', value: (rp) => fin.npv(rp / 100, flows), target: 0, targetLabel: 'NPV', unit: 'eur' },
      decision: {
        question: 'Build the workshop?',
        options: [
          { id: 'build', label: 'Build it' },
          { id: 'skip', label: 'Don’t' },
        ],
        correct: ok ? 'build' : 'skip',
        why: [
          { id: 'above', label: 'Its IRR is above our cost of capital' },
          { id: 'below', label: 'Its IRR is below our cost of capital' },
          { id: 'positive', label: 'Any positive IRR is worth having' },
        ],
        correctWhy: ok ? 'above' : 'below',
        explain: `IRR ${pct(rate, 2)} v. cost of capital ${pct(r)}.`,
      },
      working: [`0 = -${w0(cost)} + ${w0(C)} \\times \\frac{1}{IRR}\\left(1 - \\frac{1}{(1 + IRR)^{${T}}}\\right)`, `IRR \\approx ${w2(rate)}\\% ${ok ? '>' : '<'} ${w2(r)}\\%`],
      hints: {
        timeline: 'Cost today, then level cash.',
        formula: 'You want a rate, not a value.',
        inputs: 'Three numbers.',
        answer: 'Use the try-a-rate tool: NPV too high? Try a higher rate.',
        decision: 'Compare with the cost of capital.',
      },
      outcomes: { build: { valueDelta: 0, news: `Workshop IRR: ${pct(rate, 2)}.` }, skip: { valueDelta: 0, news: `Workshop IRR: ${pct(rate, 2)}.` } },
      cfoLine: `Workshop IRR ${pct(rate, 2)} against ${pct(r)}.`,
    };
  },
});

export const multipleIrr = defineCalc({
  kind: 'calc',
  id: 'multiple-irr',
  title: 'The restoration bill',
  host: 'saoirse',
  concept: 'irr-pitfalls',
  uses: ['irr', 'npv'],
  base: { cost: 30000, C: 10000, T: 9, clean: 65000, r: 10 },
  vary: (rng) => ({ cost: 30000, C: 10000, T: 9, clean: pickOne(rng, [55000, 60000, 65000, 70000]), r: pickRate(rng, 2, 25, 1) }),
  build: ({ cost, C, T, clean, r }) => {
    const flows = [-cost, ...range(1, T).map(() => C), -clean];
    const value = fin.npv(dec(r), flows);
    const pos = value > 0;
    return {
      prompt: [
        { who: 'saoirse', text: `A listed building for a second workshop. ${eur(cost)} to lease today, then ${eur(C)} a year profit for ${word(T)} years.` },
        { who: 'saoirse', mood: 'worried', text: `The catch: in year ${T + 1} the lease makes us restore the building. That costs ${eur(clean)}.` },
        { who: 'margaux', text: `Our cost of capital is ${pct(r)}. Try the IRR first. You’ll see the problem.` },
      ],
      ask: `What is the NPV at ${pct(r)}? Do we sign the lease?`,
      timeline: {
        unit: 'year',
        show: T + 2,
        streams: [
          { id: 'cost', label: 'Lease and restoration costs', periods: [0, T + 1], direction: 'out' },
          { id: 'in', label: `Profit (${eur(C)} a year)`, periods: range(1, T), direction: 'in' },
        ],
        explain: `Cost at year 0 and again at year ${T + 1}; profit in years 1 to ${T}. Two sign changes: up to two IRRs.`,
      },
      formula: { options: ['npv-sum', 'irr', 'annuity', 'payback'], correct: 'npv-sum', explain: 'With two sign changes the IRR rule breaks down. NPV still works.' },
      inputs: [
        { key: 'C0', symbol: 'C_{0}', label: 'Cost today', unit: 'eur', expected: -cost, explain: 'Cash out.', signless: true },
        { key: 'C', symbol: 'C', label: 'Profit each year', unit: 'eur', expected: C, explain: `Years 1 to ${T}.` },
        { key: 'T', symbol: 'T', label: 'Years of profit', unit: 'years', expected: T, explain: `${T}.` },
        { key: 'K', symbol: 'C_{T+1}', label: 'Restoration cost', unit: 'eur', expected: -clean, explain: `Cash out at year ${T + 1}.`, signless: true },
        { key: 'r', symbol: 'r', label: 'Cost of capital', unit: 'pct', expected: r, explain: 'Discount rate.' },
      ],
      solve: (v) => -Math.abs(v.C0) + fin.annuity(v.C, v.r / 100, v.T) - fin.pvSingle(Math.abs(v.K), v.r / 100, v.T + 1),
      answer: { label: `NPV at ${pct(r)}`, unit: 'eur', explain: `${eur(value, 2)}.` },
      tryRate: { valueLabel: 'NPV', value: (rp) => fin.npv(rp / 100, flows), target: 0, targetLabel: 'NPV', unit: 'eur', nudge: false },
      decision: {
        question: 'Sign the lease?',
        options: [
          { id: 'sign', label: 'Sign it' },
          { id: 'walk', label: 'Walk away' },
        ],
        correct: pos ? 'sign' : 'walk',
        why: [
          { id: 'npv', label: 'There are two IRRs, so the IRR rule can’t decide; NPV at our cost of capital can' },
          { id: 'low', label: 'The lower IRR is below our cost of capital' },
          { id: 'high', label: 'The higher IRR is above our cost of capital' },
        ],
        correctWhy: 'npv',
        explain: `NPV at ${pct(r)} is ${eur(value, 2)}. Two sign changes give two IRRs, so only NPV gives a clear answer.`,
      },
      working: [
        `NPV = -${w0(cost)} + \\frac{${w0(C)}}{${rd(r)}}\\left(1 - \\frac{1}{${onePlus(r)}^{${T}}}\\right) - \\frac{${w0(clean)}}{${onePlus(r)}^{${T + 1}}}`,
        `NPV = €${w2(value)}`,
      ],
      hints: {
        timeline: 'Two costs, one at each end.',
        formula: 'Count the sign changes. Can you trust the IRR?',
        inputs: 'The restoration cost is negative.',
        answer: 'Annuity for the profits; discount the restoration cost back separately.',
        decision: 'Which number can you trust here?',
      },
      outcomes: { sign: { valueDelta: value, cashDelta: -cost, holding: { id: 'restoration-lease', label: 'Listed workshop: profit, then restoration', start: 1, flows: flows.slice(1), amount: 0, spread: 0.15 }, news: pos ? `Lease signed: +${eur(value)}.` : `Lease signed: ${eur(-value)} of value lost.` }, walk: { valueDelta: 0, news: 'Saoirse walks away from the lease.' } },
      cfoLine: `Restoration lease NPV at ${pct(r)}: ${eur(value)}. IRR is ambiguous.`,
    };
  },
});

export const incrementalIrr = defineCalc({
  kind: 'calc',
  id: 'incremental-irr',
  title: 'Big workshop or small?',
  host: 'saoirse',
  concept: 'incremental-irr',
  uses: ['irr'],
  base: { big: [-400000, 241000, 293000], small: [-200000, 131000, 172000], r: 8 },
  vary: (rng) => {
    const set = pickOne(rng, [
      { big: [-400000, 241000, 293000], small: [-200000, 131000, 172000] },
      { big: [-400000, 250000, 300000], small: [-200000, 140000, 179000] },
    ]);
    const k = pickOne(rng, [0.5, 1, 1.5]);
    return { big: set.big.map((x) => x * k), small: set.small.map((x) => x * k), r: pickOne(rng, [6, 8, 9, 12, 14]) };
  },
  build: ({ big, small, r }) => {
    const diff = big.map((c, t) => c - small[t]);
    const irrBig = fin.irr(big) * 100;
    const irrSmall = fin.irr(small) * 100;
    const inc = fin.irr(diff) * 100;
    const takeBig = inc > r;
    return {
      prompt: [
        { who: 'saoirse', text: `Two ways to build the workshop, and we can only do one. Big: ${flowList(big)}. Small: ${flowList(small)}.` },
        { who: 'theo', mood: 'happy', text: `Small has the higher IRR: ${pct(Math.round(irrSmall))} v. ${pct(Math.round(irrBig))}. Easy.` },
        { who: 'margaux', text: `Our cost of capital is ${pct(r)}. Is the extra investment in the big one worth it?` },
      ],
      ask: 'What is the IRR on the extra investment (big minus small)? Which workshop?',
      timeline: {
        unit: 'year',
        show: 3,
        streams: [
          { id: 'out', label: 'Extra cost of going big', periods: [0], direction: 'out' },
          { id: 'in', label: 'Extra cash from going big', periods: [1, 2], direction: 'in' },
        ],
        explain: 'The difference: extra cost today, extra cash in years 1 and 2.',
      },
      formula: { options: ['incremental-irr', 'irr', 'npv-sum', 'pi'], correct: 'incremental-irr', explain: 'For either-or projects, take the IRR of the difference in cash flows.' },
      inputs: [
        { key: 'd0', symbol: '\\Delta C_{0}', label: 'Extra cost today', unit: 'eur', expected: diff[0], explain: `${w0(big[0])} − (${w0(small[0])}).`, signless: true },
        { key: 'd1', symbol: '\\Delta C_{1}', label: 'Extra cash, year 1', unit: 'eur', expected: diff[1], explain: `${w0(big[1])} − ${w0(small[1])}.` },
        { key: 'd2', symbol: '\\Delta C_{2}', label: 'Extra cash, year 2', unit: 'eur', expected: diff[2], explain: `${w0(big[2])} − ${w0(small[2])}.` },
      ],
      solve: (v) => fin.irr([-Math.abs(v.d0), v.d1, v.d2]) * 100,
      answer: { label: 'Incremental IRR', unit: 'pct', explain: `At ${pct(inc, 2)} the extra cash exactly repays the extra cost.`, tolerance: 0.05 },
      tryRate: { valueLabel: 'NPV of the difference', value: (rp) => fin.npv(rp / 100, diff), target: 0, targetLabel: 'NPV of the difference', unit: 'eur' },
      decision: {
        question: 'Which workshop?',
        options: [
          { id: 'big', label: 'The big one' },
          { id: 'small', label: 'The small one' },
        ],
        correct: takeBig ? 'big' : 'small',
        why: [
          { id: 'inc-above', label: 'The extra investment earns more than our cost of capital' },
          { id: 'inc-below', label: 'The extra investment earns less than our cost of capital' },
          { id: 'higher-irr', label: 'Always pick the project with the higher IRR' },
        ],
        correctWhy: takeBig ? 'inc-above' : 'inc-below',
        explain: `Incremental IRR ${pct(inc, 2)} v. ${pct(r)}. NPVs at ${pct(r)}: big ${eur(fin.npv(dec(r), big))}, small ${eur(fin.npv(dec(r), small))}.`,
      },
      working: [`\\Delta C = ${w0(diff[0])},\\ ${w0(diff[1])},\\ ${w0(diff[2])}`, `0 = ${w0(diff[0])} + \\frac{${w0(diff[1])}}{1 + IRR} + \\frac{${w0(diff[2])}}{(1 + IRR)^{2}} \\to IRR = ${w2(inc)}\\%`],
      hints: {
        timeline: 'Think of going big as its own project.',
        formula: 'Neither project’s own IRR answers this.',
        inputs: 'Big minus small, year by year.',
        answer: 'Use the try-a-rate tool on the difference.',
        decision: 'Compare the incremental IRR with the cost of capital.',
      },
      outcomes: { big: { valueDelta: 0, news: 'Saoirse builds big.' }, small: { valueDelta: 0, news: 'Saoirse builds small.' } },
      cfoLine: `Incremental IRR ${pct(inc, 2)} v. ${pct(r)}: ${takeBig ? 'big' : 'small'}.`,
    };
  },
});

// ---------------------------------------------------------------- Episode 3: building the cash flows

export const cashFlowOrNot: ClassifyProblem = {
  kind: 'classify',
  id: 'cash-flow-or-not',
  title: 'Does it count?',
  host: 'kenji',
  concept: 'incremental-cf',
  prompt: ['I’m building the spreadsheet for the handbag line. Which of these go in?'],
  categories: [
    { id: 'count', label: 'Count it' },
    { id: 'ignore', label: 'Leave it out' },
  ],
  show: 6,
  items: [
    { text: '€40,000 already spent on market research for the line', category: 'ignore', why: 'Sunk: spent whatever we decide.' },
    { text: 'Rent we’d lose by using our spare studio for the line', category: 'count', why: 'An opportunity cost.' },
    { text: 'Extra leather stock the line needs on the shelves', category: 'count', why: 'Working capital: cash tied up.' },
    { text: 'A share of head-office costs that won’t change', category: 'ignore', why: 'Not incremental.' },
    { text: 'Tax on the line’s extra profits', category: 'count', why: 'Cash flows are after tax.' },
    { text: 'Interest on the loan we’d use to fund it', category: 'ignore', why: 'Financing is in the discount rate; don’t count it twice.' },
    { text: 'Sales lost on our existing bags as customers switch', category: 'count', why: 'An incremental effect of the project.' },
    { text: 'Depreciation on the new machines, as a cash outflow', category: 'ignore', why: 'Not cash; it only matters through the tax it saves.' },
  ],
};

interface SheetParams {
  capex: number;
  life: number;
  salvage: number;
  wc: number;
  cost: number;
  tax: number;
  r: number;
  sales: number[];
}

export const handbagWorksheet: WorksheetProblem<SheetParams> = {
  kind: 'worksheet',
  id: 'handbag-worksheet',
  title: 'The handbag line',
  host: 'saoirse',
  concept: 'incremental-cf',
  base: { capex: 6, life: 5, salvage: 0.5, wc: 10, cost: 25, tax: 25, r: 12, sales: [0, 2, 2.4, 4, 4, 2.4] },
  vary: (rng) => {
    const life = 5;
    return {
      capex: pickRate(rng, 3, 8, 0.5),
      life,
      salvage: pickRate(rng, 0.2, 1, 0.1),
      wc: pickInt(rng, 5, 15, 5),
      cost: pickInt(rng, 20, 40, 5),
      tax: pickInt(rng, 20, 30, 5),
      r: pickRate(rng, 8, 14, 1),
      sales: [0, ...range(1, life).map(() => pickRate(rng, 1, 5, 0.2))],
    };
  },
  build: ({ capex, life, salvage, wc, cost, tax, r, sales }) => {
    const Y = range(0, life);
    const t = dec(tax);
    const rows: WorksheetRow[] = [
      { key: 'sales', label: 'Sales', given: true, hint: '', explain: '', calc: () => sales },
      { key: 'costs', label: `Production costs (${pct(cost)} of sales)`, given: true, hint: '', explain: '', calc: () => sales.map((s) => -s * dec(cost)) },
      {
        key: 'dep',
        label: 'Depreciation (for tax only)',
        cells: range(1, life),
        concept: 'depreciation-tax',
        hint: `Straight-line: ${capex} ÷ ${life} each year, years 1 to ${life}. Enter it as a negative.`,
        explain: `${capex} ÷ ${life} = ${w4(capex / life)} a year. Not a cash flow: it only lowers tax.`,
        calc: () => Y.map((y) => (y >= 1 && y <= life ? -capex / life : 0)),
      },
      {
        key: 'tax',
        label: `Tax at ${pct(tax)}`,
        cells: range(1, life),
        concept: 'depreciation-tax',
        hint: `Tax = ${pct(tax)} × (sales − costs − depreciation). Negative: cash out.`,
        explain: 'Taxable profit is after depreciation, so depreciation cuts the tax bill.',
        calc: (rw) => Y.map((y) => -t * ((rw.sales?.[y] ?? 0) + (rw.costs?.[y] ?? 0) + (rw.dep?.[y] ?? 0))),
      },
      {
        key: 'ocf',
        label: 'Operating cash flow',
        cells: range(1, life),
        concept: 'depreciation-tax',
        hint: 'Sales − costs − tax. Leave depreciation out: it isn’t cash.',
        explain: 'Sales + costs + tax (the last two are negative). No depreciation.',
        calc: (rw) => Y.map((y) => (rw.sales?.[y] ?? 0) + (rw.costs?.[y] ?? 0) + (rw.tax?.[y] ?? 0)),
      },
      {
        key: 'wc',
        label: `Working capital needed (${pct(wc)} of next year’s sales)`,
        concept: 'working-capital',
        hint: `${pct(wc)} × next year’s sales. In the final year nothing is needed.`,
        explain: `The level at each date: ${pct(wc)} of the following year’s sales; zero at the end.`,
        calc: () => Y.map((y) => (y < life ? dec(wc) * sales[y + 1] : 0)),
      },
      {
        key: 'dwc',
        label: 'Cash flow from working capital',
        concept: 'working-capital',
        hint: 'Minus the change in working capital: a rise is cash out, a fall is cash back.',
        explain: 'Only the change counts. It all comes back by the end.',
        calc: (rw) => Y.map((y) => -((rw.wc?.[y] ?? 0) - (y > 0 ? (rw.wc?.[y - 1] ?? 0) : 0))),
      },
      {
        key: 'capital',
        label: 'Equipment and salvage (after tax)',
        cells: [0, life],
        concept: 'salvage',
        hint: `Year 0: the equipment, −${capex}. Year ${life}: sale for ${salvage}, fully depreciated, so taxed in full.`,
        explain: `After-tax salvage = ${salvage} − ${rd(tax)} × (${salvage} − 0) = ${w4(salvage * (1 - t))}.`,
        calc: () => Y.map((y) => (y === 0 ? -capex : y === life ? salvage * (1 - t) : 0)),
      },
      {
        key: 'net',
        label: 'Net cash flow',
        hint: 'Operating cash flow + working capital cash flow + equipment and salvage.',
        explain: 'Add the three cash rows.',
        calc: (rw) => Y.map((y) => (rw.ocf?.[y] ?? 0) + (rw.dwc?.[y] ?? 0) + (rw.capital?.[y] ?? 0)),
      },
    ];
    // truth for the working
    const truth: Record<string, number[]> = {};
    for (const row of rows) truth[row.key] = row.calc(truth);
    const net = truth.net;
    const value = fin.npv(dec(r), net);
    const pos = value > 0;
    return {
      prompt: [
        { who: 'saoirse', mood: 'happy', text: `The handbag line. Equipment costs €${capex}m today, written off straight-line over ${word(life)} years to zero. At the end we can sell it for €${salvage}m.` },
        { who: 'saoirse', text: `Sales forecast (€m): ${sales.slice(1).map((s, i) => `year ${i + 1}: ${s}`).join(', ')}. Production costs run at ${pct(cost)} of sales.` },
        { who: 'kenji', text: `We need working capital equal to ${pct(wc)} of next year’s sales, starting today.` },
        { who: 'margaux', text: `Tax is ${pct(tax)} and our cost of capital ${pct(r)}. Build it year by year.` },
      ],
      ask: 'What are the line’s cash flows, and its NPV? Do we launch?',
      years: life,
      unitLabel: '€m',
      rows,
      rate: r,
      netRow: 'net',
      decision: {
        question: 'Launch the handbag line?',
        options: [
          { id: 'launch', label: 'Launch' },
          { id: 'drop', label: 'Drop it' },
        ],
        correct: pos ? 'launch' : 'drop',
        why: [
          { id: 'pos', label: 'NPV of the after-tax cash flows is positive' },
          { id: 'neg', label: 'NPV of the after-tax cash flows is negative' },
          { id: 'profit', label: 'It makes an accounting profit every year' },
          { id: 'wc', label: 'Working capital comes back, so it doesn’t matter' },
        ],
        correctWhy: pos ? 'pos' : 'neg',
        explain: pos ? 'Positive NPV: launch.' : 'Negative NPV: drop it.',
      },
      working: [
        `\\text{Net cash flows (€m): } ${net.map((c) => w4(c)).join(',\\ ')}`,
        `NPV = ${net.map((c, y) => (y === 0 ? w4(c) : `\\frac{${w4(c)}}{${onePlus(r)}${y > 1 ? `^{${y}}` : ''}}`)).join(' + ').replace(/\+ -/g, '- ')}`,
        `NPV = €${w4(value)}\\text{m}`,
      ],
      outcomes: {
        launch: { valueDelta: value * 1e6, news: pos ? `Handbag line launched: +${eur(value * 1e6)} of value.` : `Handbag line launched: ${eur(-value * 1e6)} of value destroyed.` },
        drop: { valueDelta: 0, news: pos ? `Handbag line dropped, giving up ${eur(value * 1e6)}.` : 'Handbag line dropped. Wise.' },
      },
    };
  },
};

// ---------------------------------------------------------------- Episode 4: make or buy, and a tight budget

export const makeOrBuy = defineCalc({
  kind: 'calc',
  id: 'make-or-buy',
  title: 'Make our own buttons?',
  host: 'kenji',
  concept: 'working-capital',
  uses: ['incremental-cf', 'depreciation-tax', 'npv'],
  base: { units: 200000, buy: 2, make: 1.5, machine: 150000, wc: 30000, years: 10, tax: 21, r: 15 },
  vary: (rng) => {
    const buy = pickRate(rng, 1.5, 3, 0.1);
    return {
      units: pickInt(rng, 50, 300, 10) * 1000,
      buy,
      make: Math.round(buy * pickOne(rng, [0.6, 0.7, 0.8, 0.9]) * 100) / 100,
      machine: pickInt(rng, 100, 400, 10) * 1000,
      wc: pickInt(rng, 10, 60, 5) * 1000,
      years: pickInt(rng, 5, 10),
      tax: pickInt(rng, 15, 30, 1),
      r: pickRate(rng, 8, 15, 1),
    };
  },
  build: ({ units, buy, make, machine, wc, years, tax, r }) => {
    const saving = units * (buy - make);
    const after = saving * (1 - dec(tax));
    const shield = machine * dec(tax);
    const value = -machine + shield - wc + fin.annuity(after, dec(r), years) + fin.pvSingle(wc, dec(r), years);
    const naive = -machine + shield + fin.annuity(after, dec(r), years);
    const pos = value > 0;
    return {
      prompt: [
        { who: 'kenji', text: `We buy ${w0(units)} buttons a year at ${eur(buy, 2)} each. I can make them for ${eur(make, 2)}.` },
        { who: 'kenji', text: `The machine costs ${eur(machine)}, lasts ${word(years)} years, and can be written off for tax straight away. We’d also need ${eur(wc)} of extra working capital, but we get it back at the end, so I’ve left it out.` },
        { who: 'margaux', text: `Tax is ${pct(tax)}, cost of capital ${pct(r)}. Assume the write-off saves tax immediately. Do it properly.` },
      ],
      ask: 'What is the NPV of making our own buttons?',
      timeline: {
        unit: 'year',
        show: years + 1,
        streams: [
          { id: 'machine', label: 'Machine and working capital', periods: [0], direction: 'out' },
          { id: 'shield', label: 'Tax saved by the write-off', periods: [0], direction: 'in' },
          { id: 'saving', label: 'After-tax saving each year', periods: range(1, years), direction: 'in' },
          { id: 'wcback', label: 'Working capital back', periods: [years], direction: 'in' },
        ],
        explain: `Machine, write-off tax saving and working capital at year 0; savings in years 1 to ${years}; working capital back at year ${years}.`,
      },
      formula: { options: ['npv-sum', 'annuity', 'payback', 'pi'], correct: 'npv-sum', explain: 'Bring every after-tax cash flow to today: the annuity of savings plus the one-off flows.' },
      inputs: [
        { key: 'S', symbol: 'S', label: 'After-tax saving a year', unit: 'eur', expected: after, explain: `${w0(units)} × ${w2(buy - make)} × (1 − ${rd(tax)}) = ${eur(after)}.` },
        { key: 'M', symbol: 'M', label: 'Machine cost', unit: 'eur', expected: machine, explain: 'Paid today.', signless: true },
        { key: 't', symbol: 't', label: 'Tax rate', unit: 'pct', expected: tax, explain: 'For the write-off saving too.' },
        { key: 'W', symbol: 'W', label: 'Working capital', unit: 'eur', expected: wc, explain: 'Out today, back at the end.', signless: true },
        { key: 'T', symbol: 'T', label: 'Years', unit: 'years', expected: years, explain: `${years}.` },
        { key: 'r', symbol: 'r', label: 'Cost of capital', unit: 'pct', expected: r, explain: 'Discount rate.' },
      ],
      solve: (v) => {
        const M = Math.abs(v.M);
        const W = Math.abs(v.W);
        return -M + M * (v.t / 100) - W + fin.annuity(v.S, v.r / 100, v.T) + fin.pvSingle(W, v.r / 100, v.T);
      },
      answer: { label: 'NPV of making the buttons', unit: 'eur', explain: `−${w0(machine)} + ${w0(shield)} − ${w0(wc)} + ${w0(fin.annuity(after, dec(r), years))} + ${w0(fin.pvSingle(wc, dec(r), years))} = ${eur(value)}.` },
      decision: {
        question: 'Back Kenji’s plan?',
        options: [
          { id: 'back', label: 'Back it' },
          { id: 'reject', label: 'Reject it' },
        ],
        correct: pos ? 'back' : 'reject',
        why: [
          { id: 'pos-wc', label: 'NPV is positive even after counting the working capital' },
          { id: 'neg-wc', label: 'NPV is negative once the working capital is counted' },
          { id: 'ignore-wc', label: 'Working capital can be ignored because it comes back' },
          { id: 'cheaper', label: 'Each button is cheaper, so it must be worth it' },
        ],
        correctWhy: pos ? 'pos-wc' : 'neg-wc',
        explain: `With working capital, NPV is ${eur(value)}. Leaving it out would have said ${eur(naive)}: the money comes back, but later, so it costs ${eur(wc - fin.pvSingle(wc, dec(r), years))} in time value.`,
      },
      working: [
        `S = ${w0(units)} \\times ${w2(buy - make)} \\times (1 - ${rd(tax)}) = ${w0(after)}`,
        `NPV = -${w0(machine)} + ${rd(tax)} \\times ${w0(machine)} - ${w0(wc)} + \\frac{${w0(after)}}{${rd(r)}}\\left(1 - \\frac{1}{${onePlus(r)}^{${years}}}\\right) + \\frac{${w0(wc)}}{${onePlus(r)}^{${years}}}`,
        `NPV = €${w0(value)}`,
      ],
      hints: {
        timeline: 'Four kinds of cash flow. Working capital appears twice.',
        formula: 'Several one-off flows plus a level stream.',
        inputs: 'The saving is after tax.',
        answer: 'Annuity for the savings; the rest are single sums at year 0 or year T.',
        decision: 'Does the NPV stay positive with working capital in?',
      },
      outcomes: {
        back: {
          valueDelta: value,
          cashDelta: -machine + shield - wc,
          holding: { id: 'buttons', label: 'In-house buttons: savings after tax', start: 1, years, amount: after, final: wc, spread: 0.1 },
          news: pos ? `Buttons made in-house: +${eur(value)}.` : `Button machine bought: ${eur(-value)} of value lost.` },
        reject: { valueDelta: 0, news: pos ? `Kenji’s plan rejected, giving up ${eur(value)}.` : 'Kenji’s plan rejected. Correctly.' },
      },
      cfoLine: `Make-or-buy NPV ${eur(value)} with working capital counted.`,
    };
  },
});

interface RationParams {
  budget: number;
  a: { name: string; cost: number; npv: number };
  b: { name: string; cost: number; npv: number };
  c: { name: string; cost: number; npv: number };
}

export const capitalRationing = defineCalc({
  kind: 'calc',
  id: 'capital-rationing',
  title: 'Only €300,000 to spend',
  host: 'margaux',
  concept: 'profitability-index',
  uses: ['npv'],
  base: {
    budget: 300000,
    a: { name: 'Leather workshop', cost: 300000, npv: 90000 },
    b: { name: 'Button machine', cost: 150000, npv: 60000 },
    c: { name: 'Scarf line', cost: 150000, npv: 50000 },
  } as RationParams,
  vary: (rng) => {
    const half = pickInt(rng, 100, 250, 10) * 1000;
    return {
      budget: half * 2,
      a: { name: 'Leather workshop', cost: half * 2, npv: roundTo(half * 2 * pickRate(rng, 0.2, 0.45, 0.05), 1000) },
      b: { name: 'Button machine', cost: half, npv: roundTo(half * pickRate(rng, 0.15, 0.45, 0.05), 1000) },
      c: { name: 'Scarf line', cost: half, npv: roundTo(half * pickRate(rng, 0.1, 0.4, 0.05), 1000) },
    };
  },
  build: ({ budget, a, b, c }) => {
    const pis = [a, b, c].map((p) => p.npv / p.cost);
    const pairBest = b.npv + c.npv > a.npv;
    const best = Math.max(a.npv, b.npv + c.npv);
    return {
      prompt: [
        'Three positive-NPV projects, and only ' + eur(budget) + ' to spend this year. Each is all-or-nothing.',
        `${a.name}: costs ${eur(a.cost)}, NPV ${eur(a.npv)}. ${b.name}: costs ${eur(b.cost)}, NPV ${eur(b.npv)}. ${c.name}: costs ${eur(c.cost)}, NPV ${eur(c.npv)}.`,
      ],
      ask: 'What is the most NPV we can get within the budget? Which projects?',
      timeline: {
        unit: 'year',
        show: 2,
        streams: [
          { id: 'a', label: `${a.name} cost`, periods: [0], direction: 'out' },
          { id: 'b', label: `${b.name} cost`, periods: [0], direction: 'out' },
          { id: 'c', label: `${c.name} cost`, periods: [0], direction: 'out' },
        ],
        explain: 'All three costs fall today, and the budget is today’s.',
      },
      formula: { options: ['pi', 'npv-sum', 'irr', 'payback'], correct: 'pi', explain: 'With a budget limit, rank by NPV per euro invested.' },
      inputs: [
        { key: 'B', symbol: 'B', label: 'Budget', unit: 'eur', expected: budget, explain: 'This year.' },
        { key: 'Ca', symbol: 'I_{A}', label: `${a.name}: cost`, unit: 'eur', expected: a.cost, explain: '' },
        { key: 'Na', symbol: 'NPV_{A}', label: `${a.name}: NPV`, unit: 'eur', expected: a.npv, explain: '' },
        { key: 'Cb', symbol: 'I_{B}', label: `${b.name}: cost`, unit: 'eur', expected: b.cost, explain: '' },
        { key: 'Nb', symbol: 'NPV_{B}', label: `${b.name}: NPV`, unit: 'eur', expected: b.npv, explain: '' },
        { key: 'Cc', symbol: 'I_{C}', label: `${c.name}: cost`, unit: 'eur', expected: c.cost, explain: '' },
        { key: 'Nc', symbol: 'NPV_{C}', label: `${c.name}: NPV`, unit: 'eur', expected: c.npv, explain: '' },
      ],
      solve: (v) => {
        const ps = [
          [v.Ca, v.Na],
          [v.Cb, v.Nb],
          [v.Cc, v.Nc],
        ];
        let bestV = 0;
        for (let m = 1; m < 8; m++) {
          const pick = ps.filter((_, i) => m & (1 << i));
          const cost = pick.reduce((s, p) => s + p[0], 0);
          if (cost <= v.B + 1e-6) bestV = Math.max(bestV, pick.reduce((s, p) => s + p[1], 0));
        }
        return bestV;
      },
      answer: { label: 'Most NPV within budget', unit: 'eur', explain: `PIs: ${[a, b, c].map((p, i) => `${p.name} ${w2(pis[i])}`).join(', ')}. Best: ${eur(best)}.` },
      decision: {
        question: 'Which do we fund?',
        options: [
          { id: 'a', label: `${a.name} alone` },
          { id: 'bc', label: `${b.name} + ${c.name}` },
        ],
        correct: pairBest ? 'bc' : 'a',
        why: [
          { id: 'pi', label: 'With a budget limit, rank by NPV per euro invested (the profitability index)' },
          { id: 'biggest', label: 'Always pick the project with the highest NPV' },
          { id: 'all', label: 'Take every positive-NPV project' },
        ],
        correctWhy: 'pi',
        explain: `${pairBest ? `${b.name} + ${c.name} give ${eur(b.npv + c.npv)}` : `${a.name} gives ${eur(a.npv)}`}, the most NPV the budget can buy.`,
      },
      working: [
        `PI = \\frac{NPV}{I}: \\quad ${[a, b, c].map((p, i) => `${p.name.split(' ')[0]} = ${w2(pis[i])}`).join(',\\ ')}`,
        `\\text{${a.name}}: ${w0(a.npv)} \\quad \\text{v.} \\quad \\text{${b.name} + ${c.name}}: ${w0(b.npv + c.npv)}`,
      ],
      hints: {
        timeline: 'Every cost lands today.',
        formula: 'NPV per euro invested.',
        inputs: 'Seven numbers, all in the brief.',
        answer: 'Work out each PI, fund from the top, check the budget.',
        decision: 'Biggest NPV isn’t the question. Most NPV for the budget is.',
      },
      outcomes: {
        a: { valueDelta: 0, news: `Funded the ${a.name.toLowerCase()}: NPV ${eur(a.npv)}.` },
        bc: { valueDelta: 0, news: `Funded the ${b.name.toLowerCase()} and the ${c.name.toLowerCase()}: NPV ${eur(b.npv + c.npv)}.` },
      },
      cfoLine: `Capital rationing: best NPV within ${eur(budget)} is ${eur(best)}.`,
    };
  },
});

// ---------------------------------------------------------------- boss: two projects (2022 paper, Q4)

export const paybackPeriod = defineCalc({
  kind: 'calc',
  id: 'payback-period',
  title: 'How fast does it pay back?',
  host: 'theo',
  concept: 'payback',
  base: { name: 'Project Y', flows: [-12600, 1200, 15000, -1600, 4500], cutoff: 2 },
  vary: (rng) => {
    const cost = pickInt(rng, 10, 30, 1) * 1000;
    // Cash in each year is a share of the cost, so the project always pays back within four years.
    const shares = [pickRate(rng, 0.1, 0.4, 0.05), pickRate(rng, 0.2, 0.5, 0.05), pickRate(rng, 0.3, 0.6, 0.05), pickRate(rng, 0.3, 0.6, 0.05)];
    return { name: 'the project', flows: [-cost, ...shares.map((x) => roundTo(cost * x, 100))], cutoff: pickInt(rng, 2, 3) };
  },
  build: ({ name, flows, cutoff }) => {
    const pb = fin.paybackYears(flows);
    const ok = pb <= cutoff;
    return {
      prompt: [{ who: 'theo', text: `${name}: ${flowList(flows)}. Our rule of thumb is a ${word(cutoff)}-year payback.` }],
      ask: `What is ${name}’s payback period?`,
      timeline: inOutTimeline(flows),
      formula: { options: ['payback', 'npv-sum', 'arr', 'irr'], correct: 'payback', explain: 'Add the cash flows until they cover the cost; take a fraction of the year it happens in.' },
      inputs: flowInputs(flows),
      solve: (v) => fin.paybackYears(flowsFrom(v, flows.length)),
      answer: { label: 'Payback period', unit: 'years', explain: `Recovered during year ${Math.ceil(pb)}: ${w2(pb)} years.`, tolerance: 0.02 },
      decision: {
        question: `Accept with a ${word(cutoff)}-year cut-off?`,
        options: [
          { id: 'yes', label: 'Accept' },
          { id: 'no', label: 'Reject' },
        ],
        correct: ok ? 'yes' : 'no',
        why: [
          { id: 'within', label: 'It pays back within the cut-off' },
          { id: 'beyond', label: 'It takes longer than the cut-off' },
          { id: 'npv', label: 'Its NPV is positive' },
        ],
        correctWhy: ok ? 'within' : 'beyond',
        explain: `Payback ${w2(pb)} years v. a ${cutoff}-year cut-off. (Payback says nothing about NPV.)`,
      },
      working: [`\\text{Cumulative: } ${flows.reduce<number[]>((acc, c) => [...acc, (acc[acc.length - 1] ?? 0) + c], []).map((x) => w0(x)).join(',\\ ')}`, `\\text{Payback} = ${w2(pb)} \\text{ years}`],
      hints: {
        timeline: 'Mark which years bring cash in and which take it out.',
        formula: 'Keep a running total.',
        inputs: 'Each year’s flow, with its sign.',
        answer: 'Find the year the running total turns positive; the fraction is what was left ÷ that year’s cash.',
        decision: 'Compare with the cut-off.',
      },
      outcomes: { yes: { valueDelta: 0, news: `${name} pays back in ${w2(pb)} years.` }, no: { valueDelta: 0, news: `${name} pays back in ${w2(pb)} years.` } },
      cfoLine: `${name}: payback ${w2(pb)} years.`,
    };
  },
});

export const piPair = defineCalc({
  kind: 'calc',
  id: 'pi-pair',
  title: 'Money for only one',
  host: 'margaux',
  concept: 'profitability-index',
  base: { x: { cost: 21000, npv: fin.npv(0.12, [-21000, 5500, 9000, 30200, -580]) }, y: { cost: 12600, npv: fin.npv(0.12, [-12600, 1200, 15000, -1600, 4500]) } },
  vary: (rng) => ({ x: { cost: pickInt(rng, 10, 30, 1) * 1000, npv: pickInt(rng, 1, 15, 1) * 1000 }, y: { cost: pickInt(rng, 10, 30, 1) * 1000, npv: pickInt(rng, 1, 15, 1) * 1000 } }),
  build: ({ x, y }) => {
    const pix = x.npv / x.cost;
    const piy = y.npv / y.cost;
    const pickX = pix >= piy;
    return {
      prompt: [`Capital is rationed. Project X costs ${eur(x.cost)} with an NPV of ${eur(x.npv, 2)}. Project Y costs ${eur(y.cost)} with an NPV of ${eur(y.npv, 2)}.`],
      ask: 'What is Project X’s profitability index? Which project gets the money?',
      timeline: {
        unit: 'year',
        show: 1,
        streams: [
          { id: 'x', label: 'Project X cost', periods: [0], direction: 'out' },
          { id: 'y', label: 'Project Y cost', periods: [0], direction: 'out' },
        ],
        explain: 'Both investments are made today.',
      },
      formula: { options: ['pi', 'npv-sum', 'payback', 'arr'], correct: 'pi', explain: 'NPV per euro invested.' },
      inputs: [
        { key: 'N', symbol: 'NPV_{X}', label: 'NPV of X', unit: 'eur', expected: x.npv, explain: 'Given.' },
        { key: 'I', symbol: 'I_{X}', label: 'Investment in X', unit: 'eur', expected: x.cost, explain: 'Given.' },
      ],
      solve: (v) => v.N / v.I,
      answer: { label: 'PI of Project X', unit: 'number', explain: `${w0(x.npv)} ÷ ${w0(x.cost)} = ${w2(pix)}. (Y: ${w2(piy)}.)`, tolerance: 0.005 },
      decision: {
        question: 'Which project gets the money?',
        options: [
          { id: 'x', label: 'Project X' },
          { id: 'y', label: 'Project Y' },
        ],
        correct: pickX ? 'x' : 'y',
        why: [
          { id: 'pi', label: 'It has the higher profitability index' },
          { id: 'cheap', label: 'It is the cheaper project' },
          { id: 'payback', label: 'It pays back faster' },
        ],
        correctWhy: 'pi',
        explain: `PI X ${w2(pix)}, PI Y ${w2(piy)}.`,
      },
      working: [`PI_{X} = \\frac{${w2(x.npv)}}{${w0(x.cost)}} = ${w2(pix)},\\quad PI_{Y} = \\frac{${w2(y.npv)}}{${w0(y.cost)}} = ${w2(piy)}`],
      hints: { timeline: 'Both costs today.', formula: 'NPV per euro.', inputs: 'Two numbers for X.', answer: 'NPV ÷ investment.', decision: 'Higher PI.' },
      outcomes: { x: { valueDelta: 0, news: 'Project X funded.' }, y: { valueDelta: 0, news: 'Project Y funded.' } },
      cfoLine: `PI: X ${w2(pix)}, Y ${w2(piy)}.`,
    };
  },
});

export const irrUsable: BriefProblem = {
  kind: 'brief',
  id: 'irr-usable',
  title: 'Can we use IRR?',
  host: 'saoirse',
  concept: 'irr-pitfalls',
  prompt: [{ who: 'saoirse', text: 'Just give me the IRRs of X and Y. Much simpler than all this NPV business.' }],
  question: 'Can the IRR method be used to assess Projects X and Y? Explain.',
  cards: [
    { text: 'Both projects’ cash flows change sign more than once: X turns negative in year 4, Y in year 3.', kind: 'key', why: 'Look at the signs before trusting an IRR.' },
    { text: 'Each extra sign change can add another IRR, so there may be several IRRs, or none.', kind: 'key', why: 'Up to one IRR per sign change.' },
    { text: 'With several IRRs, the IRR rule can’t say which one to compare with the cost of capital.', kind: 'key', why: 'The rule becomes ambiguous.' },
    { text: 'Use NPV at the 12% cost of capital instead: it gives one clear answer.', kind: 'key', why: 'NPV always works.' },
    { text: 'IRR always works if you use a financial calculator.', kind: 'trap', why: 'The calculator finds one root; it can’t tell you which is meaningful.' },
    { text: 'IRR can be used because both projects have positive NPVs.', kind: 'trap', why: 'A positive NPV doesn’t fix multiple IRRs.' },
    { text: 'The IRR is the discount rate that makes NPV zero.', kind: 'filler', why: 'True, but it doesn’t answer the question.' },
  ],
  model:
    'Not reliably. Both projects have cash flows that change sign more than once (X becomes negative in year 4, Y in year 3), and each sign change can create another IRR. With more than one IRR, or none, the IRR rule cannot tell us which rate to compare with the 12% cost of capital. NPV at 12% gives a single, unambiguous answer, so it should be used instead.',
};

export const ACT4_PROBLEMS: Problem[] = [
  projectNpv,
  theoScarves,
  paybackTable,
  arrSpiral,
  irrBasic,
  multipleIrr,
  incrementalIrr,
  cashFlowOrNot,
  handbagWorksheet,
  makeOrBuy,
  capitalRationing,
  paybackPeriod,
  piPair,
  irrUsable,
];
