// Game state: one SaveData object, persisted through the SaveStore on every change.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { recordAttempt, recordSpotCheck, introduce } from '../engine/mastery';
import { addHoldings, holdingsOf } from '../engine/holdings';
import { addSlips, fixConcept, type NewSlip } from '../engine/slips';
import { LocalSaveStore, freshSave, type SaveData, type SaveStore } from '../engine/save';
import { seedHoldings } from '../content';
import type { ConceptId, Outcome, Stage } from '../engine/types';

const store: SaveStore = new LocalSaveStore(seedHoldings);

export type Screen =
  | { name: 'welcome' }
  | { name: 'map' }
  | { name: 'play'; sessionId: string }
  | { name: 'boss'; act: number }
  | { name: 'exam'; act: number }
  | { name: 'yearend'; act: number }
  | { name: 'notebook' }
  | { name: 'paper' }
  | { name: 'clinic'; sessionId: string }
  | { name: 'practice'; concept: ConceptId }
  | { name: 'progress' }
  | { name: 'settings' };

interface Overlays {
  lesson: ConceptId | null;
  formulas: boolean;
  ledger: boolean;
}

interface Game {
  save: SaveData;
  setSave: (fn: (s: SaveData) => SaveData) => void;
  screen: Screen;
  go: (s: Screen) => void;
  /** Return to the previous screen (the map if there is none). */
  back: () => void;
  canGoBack: boolean;
  overlays: Overlays;
  openLesson: (id: ConceptId | null) => void;
  openFormulas: (open: boolean) => void;
  openLedger: (open: boolean) => void;
  /** Apply a decision's consequence to value, cash, holdings and the news feed. `chapter` dates any holding. */
  applyOutcome: (o: Outcome, chapter?: number) => void;
  /** Add marks lost to the notebook. */
  logSlips: (slips: NewSlip[]) => void;
  /** Record a worked problem towards mastery; returns any promotion. */
  recordWork: (concept: ConceptId, clean: boolean, spotCheck: boolean) => Stage | null;
  meet: (concept: ConceptId) => void;
}

const Ctx = createContext<Game | null>(null);

export const useGame = () => {
  const g = useContext(Ctx);
  if (!g) throw new Error('useGame outside provider');
  return g;
};

const todayKey = (t = Date.now()) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Daily streak: continues if the last play was yesterday, holds if today, restarts otherwise. */
export function bumpStreak(s: SaveData, now = Date.now()): SaveData {
  const today = todayKey(now);
  const yesterday = todayKey(now - 86_400_000);
  const { count, lastDay } = s.streak;
  if (lastDay === today) return s;
  return { ...s, streak: { count: lastDay === yesterday ? count + 1 : 1, lastDay: today } };
}

export function GameProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(() => store.load(), []);
  const [save, setSaveState] = useState<SaveData>(() => initial ?? freshSave());
  const [screen, setScreen] = useState<Screen>(() => (initial ? { name: 'map' } : { name: 'welcome' }));
  const [overlays, setOverlays] = useState<Overlays>({ lesson: null, formulas: false, ledger: false });
  const [, setHistory] = useState<Screen[]>([]);
  const latest = useRef(save);
  latest.current = save;

  const setSave = useCallback((fn: (s: SaveData) => SaveData) => {
    setSaveState((prev) => {
      const next = fn(prev);
      latest.current = next;
      return next;
    });
  }, []);

  useEffect(() => {
    if (screen.name !== 'welcome') store.save(save);
  }, [save, screen.name]);

  useEffect(() => {
    const root = document.documentElement;
    if (save.settings.theme === 'system') delete root.dataset.theme;
    else root.dataset.theme = save.settings.theme;
  }, [save.settings.theme]);

  const go = useCallback((s: Screen) => {
    setScreen((cur) => {
      if (cur.name !== 'welcome') setHistory((h) => [...h.slice(-20), cur]);
      return s;
    });
    setOverlays((o) => ({ ...o, ledger: false }));
    window.scrollTo({ top: 0 });
  }, []);

  const back = useCallback(() => {
    setHistory((h) => {
      const prev = h[h.length - 1] ?? { name: 'map' };
      setScreen(prev);
      return h.slice(0, -1);
    });
    setOverlays((o) => ({ ...o, ledger: false }));
    window.scrollTo({ top: 0 });
  }, []);

  const applyOutcome = useCallback(
    (o: Outcome, chapter?: number) =>
      setSave((s) => ({
        ...s,
        value: s.value + o.valueDelta,
        cash: s.cash + (o.cashDelta ?? 0),
        holdings: chapter ? addHoldings(s.holdings, holdingsOf(o), chapter) : s.holdings,
        news: [{ at: Date.now(), delta: o.valueDelta, news: o.news }, ...s.news].slice(0, 50),
      })),
    [setSave],
  );

  const logSlips = useCallback(
    (slips: NewSlip[]) => {
      if (slips.length) setSave((s) => ({ ...s, slips: addSlips(s.slips, slips, Date.now()) }));
    },
    [setSave],
  );

  const recordWork = useCallback(
    (concept: ConceptId, clean: boolean, spotCheck: boolean) => {
      // Apply through an updater so it composes with other pending changes (e.g. an outcome);
      // the returned stage change is read from the latest snapshot, for display only.
      const now = Date.now();
      const before = latest.current;
      const tidy = (s: SaveData) => (clean ? { ...s, slips: fixConcept(s.slips, concept) } : s);
      if (spotCheck && before.mastery[concept]?.stage === 'common') {
        setSave((s) => tidy(recordSpotCheck(s, concept, clean, now)));
        return clean ? null : 'practising';
      }
      setSave((s) => tidy(recordAttempt(s, concept, clean, now).save));
      return recordAttempt(before, concept, clean, now).promotedTo;
    },
    [setSave],
  );

  const meet = useCallback((concept: ConceptId) => setSave((s) => introduce(s, concept, Date.now())), [setSave]);

  const value: Game = {
    save,
    setSave,
    screen,
    go,
    back,
    canGoBack: screen.name !== 'map' && screen.name !== 'welcome',
    overlays,
    openLesson: (id) => setOverlays((o) => ({ ...o, lesson: id })),
    openFormulas: (open) => setOverlays((o) => ({ ...o, formulas: open })),
    openLedger: (open) => setOverlays((o) => ({ ...o, ledger: open })),
    applyOutcome,
    logSlips,
    recordWork,
    meet,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Animated number for value changes: a soft tick, skipped when reduced motion is preferred. */
export function useTicker(target: number, ms = 700) {
  const [shown, setShown] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || from.current === target) {
      from.current = target;
      setShown(target);
      return;
    }
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / ms);
      const eased = 1 - Math.pow(1 - k, 3);
      setShown(a + (target - a) * eased);
      if (k < 1) raf = requestAnimationFrame(step);
      else from.current = target;
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      from.current = target;
    };
  }, [target, ms]);
  return shown;
}
