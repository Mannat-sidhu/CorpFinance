// Save layer. The game talks only to the SaveStore interface, so a cloud store
// (e.g. Supabase) can replace LocalSaveStore later without touching the rest.
import type { HeldItem } from './holdings';
import type { Slip } from './slips';
import type { ConceptId, Stage } from './types';

export interface ConceptState {
  stage: Stage;
  /** Timestamps of clean (correct, unassisted) answers at the current stage. */
  wins: number[];
  /** Index into the spot-check interval ladder. */
  checkLevel: number;
  dueAt: number | null;
  /** Spot check also falls due after this many completed sessions (for one-sitting play). */
  dueAfterSession: number | null;
  attempts: number;
  cleanAttempts: number;
  lapses: number;
  lastSeen: number | null;
}

export interface SessionRecord {
  at: number;
  score: number;
  max: number;
  /** False until the learner has shown they grasped the episode (about 70%, or the clinic). Missing means cleared. */
  cleared?: boolean;
  /** Ideas that weren't answered cleanly in the episode: what the clinic works on. */
  weak?: ConceptId[];
}

/** An episode counts as done for unlocking only once it is cleared. */
export const isCleared = (rec: SessionRecord | undefined): boolean => !!rec && rec.cleared !== false;

/** Share of marks needed to clear an episode without the clinic. */
export const CLEAR_AT = 0.7;

export interface NewsItem {
  at: number;
  delta: number;
  news: string;
}

export interface SaveData {
  version: 1;
  houseName: string;
  createdAt: number;
  settings: { examDate: string; theme: 'system' | 'light' | 'dark' };
  value: number;
  cash: number;
  news: NewsItem[];
  streak: { count: number; lastDay: string | null };
  sessions: Record<string, SessionRecord>;
  bosses: Record<number, SessionRecord>;
  /** Exam rooms (paper-style questions after each boss). */
  exams: Record<number, SessionRecord>;
  /** Decisions still paying or costing cash. */
  holdings: HeldItem[];
  /** The notebook: marks lost, and how to fix them. */
  slips: Slip[];
  /** Story years already settled at a year-end screen. */
  yearsClosed: number[];
  resume: {
    sessionId: string;
    part: number;
    score: number;
    max: number;
    startValue: number;
    /** Ideas missed so far this sitting. */
    weak?: ConceptId[];
    /** Parts already finished, with their points, so going back never re-marks them. */
    done?: Record<number, { score: number; max: number }>;
  } | null;
  mastery: Record<ConceptId, ConceptState>;
  sessionsPlayed: number;
}

export interface SaveStore {
  load(): SaveData | null;
  save(data: SaveData): void;
  clear(): void;
}

const KEY = 'atelier-noor/save/v1';

/** Builds holdings for a save written before holdings existed, from the episodes it has played. */
export type SeedHoldings = (save: SaveData) => HeldItem[];

export class LocalSaveStore implements SaveStore {
  constructor(private seed?: SeedHoldings) {}
  load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? migrate(JSON.parse(raw), this.seed) : null;
    } catch {
      return null;
    }
  }
  save(data: SaveData) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      /* storage full or blocked: progress stays in memory for this visit */
    }
  }
  clear() {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }
}

export const STARTING_VALUE = 150_000;

/** The house's own trading: the profit that pays the bills before any decision is made. */
export const CORE_TRADING: HeldItem = { id: 'core', label: 'The atelier’s own trading profit', start: 1, amount: 60_000, growth: 3, spread: 0.15, from: 1, signed: 0 };

export function freshSave(houseName = 'Atelier Noor', now = Date.now()): SaveData {
  return {
    version: 1,
    houseName,
    createdAt: now,
    settings: { examDate: '2026-11-27', theme: 'system' },
    value: STARTING_VALUE,
    cash: STARTING_VALUE,
    news: [],
    streak: { count: 0, lastDay: null },
    sessions: {},
    bosses: {},
    exams: {},
    holdings: [CORE_TRADING],
    slips: [],
    yearsClosed: [],
    resume: null,
    mastery: {},
    sessionsPlayed: 0,
  };
}

/** Fills in fields added after a save was written, so old exports keep loading. */
export function migrate(raw: unknown, seed?: SeedHoldings): SaveData {
  if (!raw || typeof raw !== 'object' || (raw as SaveData).version !== 1) throw new Error('Not an Atelier Noor save file');
  const base = freshSave();
  const d = raw as Partial<SaveData>;
  const save = { ...base, ...d, settings: { ...base.settings, ...d.settings } } as SaveData;
  return d.holdings === undefined && seed ? { ...save, holdings: seed(save) } : save;
}

export function exportSave(data: SaveData) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `atelier-noor-progress-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function importSave(file: File, seed?: SeedHoldings): Promise<SaveData> {
  return migrate(JSON.parse(await file.text()), seed);
}
