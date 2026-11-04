// Match and choose: real options side by side. Label them, then pick one to go ahead with.
// More than one pick is sound; the reason has to fit the pick. The pick becomes a holding.
import * as fin from '../engine/finance';
import { eur, pct } from '../engine/format';
import { pickOne } from '../engine/rng';
import type { Holding, MatchOption, MatchProblem } from '../engine/types';
import { onePlus, rd, w0, w2 } from './helpers';

const risk = (spread: number) => (spread === 0 ? 'None: contracted' : spread <= 0.1 ? 'Low' : spread <= 0.25 ? 'Medium' : 'High');
const defineMatch = <P,>(p: MatchProblem<P>) => p;

interface Project {
  id: string;
  name: string;
  cost: number;
  yearly: number;
  years: number;
  spread: number;
}

/** A project option: cash out today, a level yearly flow, and its risk. */
function projectOption(p: Project, r: number, chapterLabel: string, news: string): MatchOption & { npv: number } {
  const npv = fin.annuity(p.yearly, r / 100, p.years) - p.cost;
  const holding: Holding = { id: `${chapterLabel}-${p.id}`, label: p.name, start: 1, years: p.years, amount: p.yearly, spread: p.spread || undefined };
  return {
    id: p.id,
    name: p.name,
    cost: p.cost,
    cells: { cost: eur(p.cost), yearly: eur(p.yearly), years: String(p.years), risk: risk(p.spread) },
    outcome: { valueDelta: npv, cashDelta: -p.cost, holding, news },
    npv,
  };
}

// ---------------------------------------------------------------- Chapter I: the first bets

export const firstBets = defineMatch({
  kind: 'match',
  id: 'first-bets',
  title: 'Four ways to spend',
  host: 'margaux',
  concept: 'npv',
  uses: ['annuity', 'payback'],
  base: { k: 1, r: 8 },
  vary: (rng) => ({ k: pickOne(rng, [0.5, 1, 1.5, 2]), r: pickOne(rng, [6, 7, 8, 9]) }),
  build: ({ k, r }, { cash }) => {
    const ps: Project[] = [
      { id: 'popup', name: 'Pop-up shop in Temple Bar', cost: 20000 * k, yearly: 9000 * k, years: 3, spread: 0.05 },
      { id: 'online', name: 'Online store', cost: 60000 * k, yearly: 18000 * k, years: 5, spread: 0.4 },
      { id: 'wholesale', name: 'Wholesale deal with a department store', cost: 35000 * k, yearly: 11000 * k, years: 4, spread: 0 },
      { id: 'gifting', name: 'Celebrity gifting campaign', cost: 30000 * k, yearly: 7000 * k, years: 4, spread: 0.3 },
    ];
    const opts = ps.map((p) => projectOption(p, r, 'ch1', `${p.name}: signed.`));
    const npv = Object.fromEntries(opts.map((o) => [o.id, o.npv]));
    return {
      prompt: [
        { who: 'margaux', text: `Four people, four pitches, and we can only back one this year. We have ${eur(cash)} in the bank and our cost of capital is ${pct(r)}.` },
        { who: 'theo', mood: 'happy', text: 'The pop-up! Cash back in no time.' },
        { who: 'idris', text: 'The gifting campaign. Everyone who matters will be wearing us.' },
        { who: 'margaux', text: 'Work out each one’s NPV first. Then tell me which is which. Then pick, and tell me why.' },
      ],
      ask: 'Work out each NPV, label each option, then choose one.',
      columns: [
        { key: 'cost', label: 'Cost today' },
        { key: 'yearly', label: 'Cash a year' },
        { key: 'years', label: 'Years' },
        { key: 'risk', label: 'How sure' },
      ],
      options: opts.map(({ npv: _, ...o }) => o),
      compute: { label: 'NPV', unit: 'eur', values: npv, explain: `−cost + yearly cash × the ${pct(r)} annuity factor for its years.` },
      labels: [
        { id: 'safe', text: 'Safest: the cash is guaranteed', answer: 'wholesale', why: 'A signed contract: the yearly cash doesn’t swing.' },
        { id: 'reward', text: 'Highest expected reward', answer: 'online', why: `Highest NPV (${eur(npv.online)}), but the widest swings.` },
        { id: 'fast', text: 'Fastest cash back', answer: 'popup', why: `Pays back in ${w2(fin.paybackYears([-ps[0].cost, ...Array(ps[0].years).fill(ps[0].yearly)]))} years.` },
        { id: 'bad', text: 'Destroys value', answer: 'gifting', why: `NPV ${eur(npv.gifting)}: it never earns back its cost in today’s money.`, bad: true },
      ],
      reasons: [
        { id: 'r-safe', text: 'Cash is thin, so I want money we can count on', label: 'safe' },
        { id: 'r-reward', text: 'It adds the most value, and we can live with the swings', label: 'reward' },
        { id: 'r-fast', text: 'We need the cash back quickly for the next opportunity', label: 'fast' },
      ],
      working: opts.map((o) => {
        const p = ps.find((x) => x.id === o.id)!;
        return `${o.name.split(' ')[0]}: -${w0(p.cost)} + ${w0(p.yearly)} \\times \\frac{1}{${rd(r)}}\\left(1 - \\frac{1}{${onePlus(r)}^{${p.years}}}\\right) = ${w0(o.npv)}`;
      }),
    };
  },
});

// ---------------------------------------------------------------- Chapter II: parking the spare cash

export const spareCashBonds = defineMatch({
  kind: 'match',
  id: 'spare-cash-bonds',
  title: 'Where to park the cash',
  host: 'rupert',
  concept: 'bond-price',
  uses: ['credit-risk', 'price-yield'],
  base: { face: 100000 },
  vary: (rng) => ({ face: pickOne(rng, [50000, 100000, 150000]) }),
  build: ({ face }, { cash }) => {
    const bonds = [
      { id: 'gov', name: 'Irish government bond', coupon: 3, years: 2, y: 3, rating: 'AA', spread: 0, haircut: 1 },
      { id: 'bbb', name: 'Retailer’s bond', coupon: 5, years: 8, y: 5.5, rating: 'BBB', spread: 0.05, haircut: 0.99 },
      { id: 'junk', name: 'Start-up’s high-yield bond', coupon: 9, years: 3, y: 11, rating: 'B', spread: 0.5, haircut: 0.93 },
      { id: 'idris', name: 'Idris’s friend’s “guaranteed” note', coupon: 6, years: 4, y: 8, rating: 'unrated', spread: 0.4, haircut: 0.95, asked: 104 },
    ];
    const units = face / 100;
    const value = Object.fromEntries(bonds.map((b) => [b.id, fin.bondPrice(b.coupon, b.y / 100, b.years, 100)]));
    const opts: MatchOption[] = bonds.map((b) => {
      const price = b.asked ?? Math.round(value[b.id] * 100) / 100;
      const holding: Holding = { id: 'ch2-spare-cash', label: `${b.name}: coupons`, start: 1, years: b.years, amount: b.coupon * units * b.haircut, final: face * b.haircut, spread: b.spread || undefined };
      return {
        id: b.id,
        name: b.name,
        cost: price * units,
        cells: { coupon: pct(b.coupon), years: String(b.years), y: pct(b.y), rating: b.rating, price: w2(price) },
        outcome: { valueDelta: (value[b.id] - price) * units, cashDelta: -price * units, holding, news: `Bought ${eur(face)} of the ${b.name.toLowerCase()} at ${w2(price)}.` },
      };
    });
    return {
      prompt: [
        { who: 'margaux', text: `The bond money won’t all be spent for a while. ${eur(face)} of it can go into bonds; we have ${eur(cash)} in the bank in all.` },
        { who: 'rupert', mood: 'happy', text: 'Four on my desk. Prices are per 100 of face value, coupons paid yearly. The yield shown is what the market wants for each one’s risk.' },
        { who: 'idris', text: 'And my friend’s note is guaranteed. Six per cent!' },
      ],
      ask: 'Value each bond at its yield, label each one, then choose.',
      columns: [
        { key: 'coupon', label: 'Coupon' },
        { key: 'years', label: 'Years' },
        { key: 'y', label: 'Yield for its risk' },
        { key: 'rating', label: 'Rating' },
        { key: 'price', label: 'Price asked' },
      ],
      options: opts,
      compute: { label: 'Value per 100', unit: 'eur', values: value, explain: 'Coupons as an annuity plus the face value, both at the yield for its risk.', tolerance: 0.05 },
      labels: [
        { id: 'safe', text: 'Safest', answer: 'gov', why: 'Government-rated AA, short, and priced fairly.' },
        { id: 'yield', text: 'Highest promised yield', answer: 'junk', why: '11% promised, because default is a real risk.' },
        { id: 'rates', text: 'Hurt most if interest rates rise', answer: 'bbb', why: 'The longest bond: its price moves most when yields change.' },
        { id: 'bad', text: 'Destroys value', answer: 'idris', why: `Worth ${w2(value.idris)} at 8%, asked 104: you pay ${w2(104 - value.idris)} too much per 100.`, bad: true },
      ],
      reasons: [
        { id: 'r-safe', text: 'We may need this cash soon, so no surprises', label: 'safe' },
        { id: 'r-yield', text: 'We can take some default risk for a higher return', label: 'yield' },
        { id: 'r-rates', text: 'I expect rates to fall, and this one gains most when they do', label: 'rates' },
      ],
      working: bonds.map((b) => `${b.name.split(' ')[0]}: PV = \\frac{${b.coupon}}{${rd(b.y)}}\\left(1 - \\frac{1}{${onePlus(b.y)}^{${b.years}}}\\right) + \\frac{100}{${onePlus(b.y)}^{${b.years}}} = ${w2(value[b.id])}`),
    };
  },
});

// ---------------------------------------------------------------- Chapter III: paying for growth

export const growthMoney = defineMatch({
  kind: 'match',
  id: 'growth-money',
  title: 'Paying for the next step',
  host: 'celine',
  concept: 'gordon',
  uses: ['pvgo', 'stock-basics'],
  base: { k: 1 },
  vary: (rng) => ({ k: pickOne(rng, [0.5, 1, 1.5]) }),
  build: ({ k }, { cash }) => {
    const D1 = 60000 * k;
    const r = 12;
    const g = 7;
    const V = D1 / ((r - g) / 100);
    const stake = 0.25 * V;
    const need = 300000 * k;
    const extra = 45000 * k;
    const project = extra / (r / 100) - need;
    const loanPmt = fin.loanPayment(need, 0.07, 5);
    const small = { cost: 100000 * k, yearly: 16000 * k };
    const smallNpv = small.yearly / (r / 100) - small.cost;
    const idrisPrice = 150000 * k;
    const growth = (id: string, amount: number): Holding => ({ id: 'ch3-growth', label: 'Growth plan: extra profit', start: 1, amount, spread: id === 'small' ? 0.1 : 0.3 });
    const options: MatchOption[] = [
      {
        id: 'celine',
        name: `Sell 25% to Céline for ${eur(need)}`,
        cost: 0,
        cells: { money: eur(need), owners: '75% kept', fixed: 'None' },
        outcome: { valueDelta: project + (need - stake), holding: growth('celine', extra), news: `Céline buys 25% for ${eur(need)}. The growth plan goes ahead.` },
      },
      {
        id: 'loan',
        name: `Borrow ${eur(need)} from the bank at 7%`,
        cost: 0,
        cells: { money: eur(need), owners: '100% kept', fixed: `${eur(Math.round(loanPmt))} a year for 5 years` },
        outcome: {
          valueDelta: project,
          holding: [growth('loan', extra), { id: 'ch3-loan', label: 'Growth loan repayments', start: 1, years: 5, amount: -loanPmt }],
          news: `Borrowed ${eur(need)} for the growth plan.`,
        },
      },
      {
        id: 'small',
        name: `Grow slowly from our own ${eur(small.cost)}`,
        cost: small.cost,
        cells: { money: eur(small.cost), owners: '100% kept', fixed: 'None' },
        outcome: { valueDelta: smallNpv, cashDelta: -small.cost, holding: growth('small', small.yearly), news: 'A smaller plan, paid from the house’s own cash.' },
      },
      {
        id: 'idris',
        name: `Sell 25% to Idris for ${eur(idrisPrice)}`,
        cost: 0,
        cells: { money: eur(idrisPrice), owners: '75% kept', fixed: 'None' },
        outcome: { valueDelta: project / 2 + (idrisPrice - stake), holding: growth('idris', extra / 2), news: `Idris buys 25% for ${eur(idrisPrice)}: half the plan goes ahead.` },
      },
    ];
    return {
      prompt: [
        { who: 'celine', text: `Your growth plan needs ${eur(need)} and should add ${eur(extra)} of profit a year, for good. I’ll put in the money for 25% of the house.` },
        { who: 'margaux', text: `For a fair price on a stake: we expect to pay ${eur(D1)} in dividends next year, growing ${pct(g)} a year, and owners want ${pct(r)}.` },
        { who: 'idris', text: `I’ll take the same 25% for ${eur(idrisPrice)}. Keeps it in the family.` },
        { who: 'margaux', text: `Or the bank lends at 7%, or we do a smaller version with ${eur(small.cost)} of our own. We have ${eur(cash)} in the bank.` },
      ],
      ask: 'Value a 25% stake, label each option, then choose.',
      columns: [
        { key: 'money', label: 'Money in' },
        { key: 'owners', label: 'Ownership' },
        { key: 'fixed', label: 'Fixed payments' },
      ],
      options,
      compute: { label: 'Fair value of the 25% stake', unit: 'eur', values: { celine: stake, idris: stake }, explain: `House value = ${eur(D1)} ÷ (${rd(r)} − ${rd(g)}) = ${eur(V)}; 25% of that.` },
      labels: [
        { id: 'share', text: 'Shares the risk and the upside with a new owner', answer: 'celine', why: `A fair price (${eur(need)} for a stake worth ${eur(stake)}), and no fixed payments.` },
        { id: 'fixed', text: 'Keeps every share, but adds fixed repayments', answer: 'loan', why: `${eur(Math.round(loanPmt))} a year has to be paid whatever sales do.` },
        { id: 'small', text: 'Smallest bet: no new owners and no debt', answer: 'small', why: `NPV ${eur(smallNpv)}: less value, but nothing owed to anyone.` },
        { id: 'bad', text: 'Gives value away', answer: 'idris', why: `${eur(idrisPrice)} for a stake worth ${eur(stake)}: ${eur(stake - idrisPrice)} handed to Idris.`, bad: true },
      ],
      reasons: [
        { id: 'r-share', text: 'I’d rather not add fixed payments while cash is tight', label: 'share' },
        { id: 'r-fixed', text: 'The owners keep everything, and the profit covers the repayments', label: 'fixed' },
        { id: 'r-small', text: 'I want to grow without new owners or debt', label: 'small' },
      ],
      working: [`V = \\frac{${w0(D1)}}{${rd(r)} - ${rd(g)}} = ${w0(V)}`, `25\\% \\times ${w0(V)} = ${w0(stake)}`, `NPV_{plan} = \\frac{${w0(extra)}}{${rd(r)}} - ${w0(need)} = ${w0(project)}`],
    };
  },
});

// ---------------------------------------------------------------- Chapter IV: the real budget

export const budgetPackages = defineMatch({
  kind: 'match',
  id: 'budget-packages',
  title: 'This year’s budget',
  host: 'margaux',
  concept: 'profitability-index',
  uses: ['npv'],
  base: { k: 1 },
  vary: (rng) => ({ k: pickOne(rng, [0.5, 1, 1.5]) }),
  build: ({ k }, { cash }) => {
    const r = 10;
    const af = fin.annuityFactor(r / 100, 6);
    const pk = [
      { id: 'flagship', name: 'A flagship store on Grafton Street', cost: 280000 * k, npv: 60000 * k, spread: 0.35 },
      { id: 'popups', name: 'Two pop-ups and a new e-shop', cost: 270000 * k, npv: 85000 * k, spread: 0.2 },
      { id: 'workshop', name: 'Refit the workshop', cost: 120000 * k, npv: 30000 * k, spread: 0.05 },
      { id: 'collab', name: 'Theo’s streetwear collab', cost: 150000 * k, npv: -20000 * k, spread: 0.4 },
    ];
    const pi = Object.fromEntries(pk.map((p) => [p.id, p.npv / p.cost]));
    const options: MatchOption[] = pk.map((p) => ({
      id: p.id,
      name: p.name,
      cost: p.cost,
      cells: { cost: eur(p.cost), npv: eur(p.npv), risk: risk(p.spread) },
      outcome: {
        valueDelta: p.npv,
        cashDelta: -p.cost,
        holding: { id: 'ch4-budget', label: p.name, start: 1, years: 6, amount: (p.cost + p.npv) / af, spread: p.spread },
        news: `${p.name}: funded.`,
      },
    }));
    return {
      prompt: [
        { who: 'margaux', text: `Here’s the real budget: we have ${eur(cash)} in the bank, and that’s all there is. Anything beyond it, Aoife lends at a penalty rate.` },
        { who: 'saoirse', text: 'The flagship. It’s the brand.' },
        { who: 'kenji', text: 'Pop-ups and the e-shop. I’ve run the spreadsheet.' },
        { who: 'theo', mood: 'happy', text: 'The streetwear collab! Everyone’s doing one.' },
      ],
      ask: 'Work out each profitability index, label each package, then choose one.',
      columns: [
        { key: 'cost', label: 'Cost today' },
        { key: 'npv', label: `NPV at ${pct(r)}` },
        { key: 'risk', label: 'How sure' },
      ],
      options,
      compute: { label: 'PI', unit: 'number', values: pi, explain: 'PI = NPV ÷ cost.', tolerance: 0.005 },
      labels: [
        { id: 'per-euro', text: 'Most value per euro invested', answer: 'popups', why: `PI ${w2(pi.popups)}: the most NPV for each euro of a tight budget.` },
        { id: 'safe', text: 'Safest, and leaves cash in the bank', answer: 'workshop', why: 'Small, sure, and less than half the cost of the others.' },
        { id: 'bet', text: 'Biggest single bet', answer: 'flagship', why: 'The most cash at risk, with the widest swings.' },
        { id: 'bad', text: 'Destroys value', answer: 'collab', why: `NPV ${eur(pk[3].npv)}: fashionable, but it loses money in today’s terms.`, bad: true },
      ],
      reasons: [
        { id: 'r-per-euro', text: 'With a fixed budget, the most NPV per euro wins', label: 'per-euro' },
        { id: 'r-safe', text: 'I want cash left over for surprises', label: 'safe' },
        { id: 'r-bet', text: 'The brand needs a flagship, and I’ll accept the swings', label: 'bet' },
      ],
      working: pk.map((p) => `PI_{${p.id}} = \\frac{${w0(p.npv)}}{${w0(p.cost)}} = ${w2(pi[p.id])}`),
    };
  },
});

// ---------------------------------------------------------------- Chapter V: where the surplus goes

export const portfolioMixes = defineMatch({
  kind: 'match',
  id: 'portfolio-mixes',
  title: 'Where the surplus goes',
  host: 'rupert',
  concept: 'capital-allocation',
  uses: ['portfolio-risk', 'capm'],
  base: { rf: 4, rm: 10, sm: 15 },
  vary: (rng) => ({ rf: pickOne(rng, [3, 4, 5]), rm: pickOne(rng, [9, 10, 11]), sm: pickOne(rng, [14, 15, 18]) }),
  build: ({ rf, rm, sm }, { cash }) => {
    const amount = Math.max(20000, Math.round((cash * 0.35) / 10000) * 10000);
    const mixE = fin.portfolioReturn(0.5, rm, rf);
    const mixSd = 0.5 * sm;
    const friend = { e: Math.round((rf + 0.65 * (rm - rf)) * 10) / 10, sd: Math.round(sm * 1.9) };
    // What the same risk would earn through the market and the risk-free asset.
    const fairE = fin.capm(rf, friend.sd / sm, rm);
    const gap = fairE - friend.e;
    const opts = [
      { id: 'a', name: 'Everything in Treasury bills', mix: '100% bills', e: rf, sd: 0 },
      { id: 'b', name: 'Half the market, half Treasury bills', mix: '50% market, 50% bills', e: mixE, sd: mixSd },
      { id: 'c', name: 'The whole amount in the market index', mix: '100% market index', e: rm, sd: sm },
      { id: 'd', name: 'Idris’s friend’s textile firm', mix: 'One company', e: friend.e, sd: friend.sd },
    ];
    const options: MatchOption[] = opts.map((o) => {
      const spread = o.sd ? (o.sd * Math.sqrt(3)) / o.e : 0;
      const holding: Holding = { id: 'ch5-surplus', label: `${o.name}: yearly return`, start: 1, years: 5, amount: (amount * o.e) / 100, final: amount, spread: spread || undefined };
      return {
        id: o.id,
        name: o.name,
        cost: amount,
        cells: { mix: o.mix, er: o.id === 'b' ? 'work it out →' : pct(o.e, 1), sd: o.sd ? pct(o.sd, 1) : 'None' },
        outcome: {
          valueDelta: o.id === 'd' ? -fin.annuity((amount * gap) / 100, 0.08, 5) : 0,
          cashDelta: -amount,
          holding,
          news: `${eur(amount)} of the surplus goes into: ${o.name.toLowerCase()}.`,
        },
      };
    });
    return {
      prompt: [
        { who: 'margaux', text: `${eur(amount)} of the surplus is free to invest for five years. Treasury bills pay ${pct(rf)}. The market index is expected to return ${pct(rm)}, with a standard deviation of ${pct(sm)}. We have ${eur(cash)} in the bank in all.` },
        { who: 'idris', text: `Or my friend’s textile firm: ${pct(friend.e, 1)} a year, and a standard deviation of ${pct(friend.sd, 1)}. A real family business.` },
        { who: 'rupert', text: 'Or a half-and-half mix of the index and bills. Your call.' },
      ],
      ask: 'Work out the mix’s expected return, label each option, then choose one.',
      columns: [
        { key: 'mix', label: 'What it is' },
        { key: 'er', label: 'Expected return' },
        { key: 'sd', label: 'Risk (SD)' },
      ],
      options,
      compute: { label: 'Expected return', unit: 'pct', values: { b: mixE }, explain: `${pct(rm)} × 50% + ${pct(rf)} × 50% = ${pct(mixE, 2)}.`, tolerance: 0.05 },
      labels: [
        { id: 'safe', text: 'The safest: no risk at all', answer: 'a', why: 'Treasury bills have no standard deviation.' },
        { id: 'reward', text: 'The highest expected return among the sound choices', answer: 'c', why: `${pct(rm)}: the most you can earn without taking on extra risk for nothing.` },
        { id: 'half', text: 'Exactly half the market’s risk', answer: 'b', why: `A half-and-half mix has half the market’s standard deviation: ${pct(mixSd, 1)}.` },
        { id: 'bad', text: 'Takes risk it isn’t paid for', answer: 'd', why: `At that risk, the market and bills together would earn ${pct(fairE, 1)}, not ${pct(friend.e, 1)}: about ${pct(gap, 1)} a year given away.`, bad: true },
      ],
      reasons: [
        { id: 'r-safe', text: 'We may need this money, so I want it certain', label: 'safe' },
        { id: 'r-reward', text: 'I want the highest return the market pays, and I accept the swings', label: 'reward' },
        { id: 'r-half', text: 'I want market exposure, but only half as much risk', label: 'half' },
      ],
      working: [`E[R] = 0.5(${rm}) + 0.5(${rf}) = ${w2(mixE)}\\%`, `\\sigma = 0.5 \\times ${sm} = ${w2(mixSd)}\\%`, `\\text{Same risk as the firm via the market: } ${rf} + ${w2(friend.sd / sm)}(${rm} - ${rf}) = ${w2(fairE)}\\%`],
    };
  },
});

export const MATCH_PROBLEMS = [firstBets, spareCashBonds, growthMoney, budgetPackages, portfolioMixes];
