// Seeded random numbers so a replay can be reproduced, and helpers for picking sensible values.

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const newSeed = () => Math.floor(Math.random() * 2 ** 31);

/** Integer in [lo, hi] that is a multiple of `step`. */
export const pickInt = (rng: () => number, lo: number, hi: number, step = 1) =>
  lo + step * Math.floor(rng() * (Math.floor((hi - lo) / step) + 1));

/** Rate in percent within [lo, hi], in steps of `step` (e.g. 0.5). */
export const pickRate = (rng: () => number, lo: number, hi: number, step = 0.5) =>
  Math.round(pickInt(rng, Math.round(lo / step), Math.round(hi / step)) * step * 100) / 100;

export const pickOne = <T,>(rng: () => number, list: readonly T[]) => list[Math.floor(rng() * list.length)];

export function shuffle<T>(rng: () => number, list: readonly T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
