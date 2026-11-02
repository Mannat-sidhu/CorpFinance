// Holdings: decisions that keep paying or costing cash. Each chapter is a year; flows land at year end.
import { annuity, loanPayment } from './finance';
import { mulberry32 } from './rng';
import type { SaveData } from './save';
import type { Holding } from './types';

/** A holding as saved: its first flow pinned to an absolute story year. */
export interface HeldItem extends Holding {
  /** Story year of the first flow. */
  from: number;
  /** Chapter it was signed in. */
  signed: number;
}

export interface YearLine {
  label: string;
  expected: number;
  actual: number;
}

export interface YearEnd {
  year: number;
  lines: YearLine[];
  /** Emergency borrowing when cash ran out. */
  rescue?: { borrowed: number; payment: number; years: number; valueCost: number };
  cashBefore: number;
  cashAfter: number;
}

/** Penalty terms when the house runs out of cash: Aoife lends, at a price. */
export const RESCUE = { rate: 0.12, years: 3, fairRate: 0.07, buffer: 1.1 };

export const pin = (h: Holding, chapter: number): HeldItem => ({ ...h, from: chapter + h.start - 1, signed: chapter });

/** An outcome's holdings as a list (it may carry none, one or several). */
export const holdingsOf = (o?: { holding?: Holding | Holding[] }) => (!o?.holding ? [] : Array.isArray(o.holding) ? o.holding : [o.holding]);

/** Add holdings, replacing any with the same id. */
export function addHoldings(list: HeldItem[], add: Holding[], chapter: number) {
  const ids = new Set(add.map((h) => h.id));
  return [...list.filter((h) => !ids.has(h.id)), ...add.map((h) => pin(h, chapter))];
}

/** Expected flow of a holding in a given story year (0 if none). */
export function flowIn(h: HeldItem, year: number) {
  const k = year - h.from;
  if (h.flows) return h.flows[k] ?? 0;
  if (k < 0 || (h.years !== undefined && k >= h.years)) return 0;
  const base = h.amount * Math.pow(1 + (h.growth ?? 0) / 100, k);
  return base + (h.years !== undefined && k === h.years - 1 ? (h.final ?? 0) : 0);
}

/** Seeded draw in [−1, 1], fixed per save, holding and year so a reload never rerolls it. */
function draw(save: SaveData, id: string, year: number) {
  let hsh = save.createdAt % 2147483647;
  for (const ch of `${id}:${year}`) hsh = (hsh * 31 + ch.charCodeAt(0)) % 2147483647;
  return mulberry32(hsh)() * 2 - 1;
}

/** What closing a year would do, without changing anything. */
export function previewYear(save: SaveData, year: number): YearEnd {
  const lines: YearLine[] = [];
  for (const h of save.holdings) {
    const expected = flowIn(h, year);
    if (!expected) continue;
    const actual = h.spread ? Math.round(expected * (1 + h.spread * draw(save, h.id, year))) : expected;
    lines.push({ label: h.label, expected, actual });
  }
  const cashBefore = save.cash;
  let cashAfter = cashBefore + lines.reduce((s, l) => s + l.actual, 0);
  let rescue: YearEnd['rescue'];
  if (cashAfter < 0) {
    const borrowed = Math.ceil((-cashAfter * RESCUE.buffer) / 1000) * 1000;
    const payment = loanPayment(borrowed, RESCUE.rate, RESCUE.years);
    // Value lost: what the penalty payments cost over a fair loan of the same size.
    const valueCost = annuity(payment, RESCUE.fairRate, RESCUE.years) - borrowed;
    rescue = { borrowed, payment, years: RESCUE.years, valueCost };
    cashAfter += borrowed;
  }
  return { year, lines, rescue, cashBefore, cashAfter };
}

export function closeYear(save: SaveData, year: number): { save: SaveData; result: YearEnd } {
  if (save.yearsClosed.includes(year)) return { save, result: previewYear({ ...save, holdings: [] }, year) };
  const result = previewYear(save, year);
  let holdings = save.holdings;
  let value = save.value;
  const news = [...save.news];
  const luck = result.lines.reduce((s, l) => s + l.actual - l.expected, 0);
  if (result.rescue) {
    const r = result.rescue;
    holdings = [...holdings, pin({ id: `rescue-${year}`, label: `Aoife’s emergency loan (year ${year})`, start: 1, years: r.years, amount: -r.payment }, year + 1)];
    value -= r.valueCost;
    news.unshift({ at: Date.now(), delta: -r.valueCost, news: `Cash ran out at year end. Aoife lent ${Math.round(r.borrowed).toLocaleString('en-GB')} at a penalty rate.` });
  }
  news.unshift({
    at: Date.now(),
    delta: 0,
    news: `Year ${year} closed: cash ${result.cashAfter >= result.cashBefore ? 'up' : 'down'} ${Math.round(Math.abs(result.cashAfter - result.cashBefore)).toLocaleString('en-GB')}${luck ? `, luck ${luck > 0 ? '+' : '−'}${Math.round(Math.abs(luck)).toLocaleString('en-GB')}` : ''}.`,
  });
  return {
    save: { ...save, cash: result.cashAfter, value, holdings, news: news.slice(0, 40), yearsClosed: [...save.yearsClosed, year] },
    result,
  };
}

/** Holdings still running after a given year (for the year-end screen). */
export const runningAfter = (save: SaveData, year: number) =>
  save.holdings.filter((h) => {
    const n = h.flows ? h.flows.length : h.years;
    return n === undefined || h.from + n - 1 > year;
  });
