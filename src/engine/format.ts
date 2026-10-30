// British/Irish number formatting.
import type { Unit } from './types';

const grouped = (n: number, dp: number) =>
  n.toLocaleString('en-GB', { minimumFractionDigits: dp, maximumFractionDigits: dp });

/** €107,163 — whole euros unless `dp` is given. */
export const eur = (n: number, dp = 0) => (n < 0 ? '−€' : '€') + grouped(Math.abs(n), dp);

/** Signed euro change: +€7,163 / −€2,000 */
export const eurSigned = (n: number) => (n >= 0 ? '+' : '') + eur(n);

/** 6% / 6.5% / 12.68% — `n` is already in percent. */
export const pct = (n: number, dp?: number) => {
  const d = dp ?? (Number.isInteger(n) ? 0 : Math.abs(n * 10 - Math.round(n * 10)) < 1e-9 ? 1 : 2);
  return grouped(n, d) + '%';
};

/** Plain number with grouping and up to `dp` decimals. */
export const num = (n: number, dp = 2) => {
  const s = n.toLocaleString('en-GB', { maximumFractionDigits: dp });
  return n < 0 ? s.replace('-', '−') : s;
};

/** Number formatted for its unit, used in feedback and model working. */
export function fmt(n: number, unit: Unit, dp?: number) {
  switch (unit) {
    case 'eur':
      return eur(n, dp ?? (Math.abs(n) < 100 ? 2 : 0));
    case 'pct':
      return pct(Math.round(n * 100) / 100, dp);
    case 'years':
      return `${num(n, 0)} ${n === 1 ? 'year' : 'years'}`;
    default:
      return num(n, dp ?? 4);
  }
}

/** Reads what the player typed: tolerates €, %, commas, spaces and a Unicode minus. */
export function parseNumber(raw: string): number | null {
  const cleaned = raw.replace(/[€%,\s]/g, '').replace(/[−–]/g, '-');
  if (cleaned === '' || cleaned === '-' || cleaned === '.') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}
