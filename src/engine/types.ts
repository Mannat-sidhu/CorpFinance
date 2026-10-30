// Content contract. Acts are plain data written against these types; the engine never
// needs to change when an act is added or edited.

export type ConceptId = string;
export type Stage = 'locked' | 'new' | 'practising' | 'common';
export type CharacterId = 'margaux' | 'theo' | 'idris' | 'ferriter' | 'aoife' | 'narrator' | 'news';

/** Formula strings use a small TeX subset: \frac{a}{b}, x^{n}, x_{n}, \times, \cdot, \approx, \infty, \to, \le, \ge. */
export type Tex = string;

export type Unit = 'eur' | 'pct' | 'years' | 'count' | 'number';

// ---------- Lessons ----------

export interface TimelineMark {
  at: number;
  label: string;
  kind?: 'in' | 'out' | 'value';
}

export interface TimelineDiagram {
  periods: number;
  unit?: 'year' | 'month' | 'quarter' | 'half-year';
  marks: TimelineMark[];
  /** Draw an arrow showing the stream carries on forever. */
  forever?: boolean;
  caption?: string;
}

export interface Lesson {
  /** Plain-English explanation, one paragraph per entry. Written for a complete beginner. */
  plain: string[];
  timeline?: TimelineDiagram;
  formula?: { tex: Tex; where?: string[]; onSheet?: boolean };
  example?: { prompt: string; working: Tex[]; answer: string };
  traps: string[];
}

export interface Concept {
  id: ConceptId;
  act: number;
  name: string;
  /** One-line summary shown in the ledger and by the CFO once it is common knowledge. */
  summary: string;
  lesson: Lesson;
}

// ---------- Five-step problems ----------

export interface TimelineStream {
  id: string;
  label: string;
  /** Periods where this cash flow lands. */
  periods: number[];
  /** True if the stream continues past the last period shown (a perpetuity). */
  forever?: boolean;
  direction: 'in' | 'out';
}

export interface TimelineSpec {
  unit: 'year' | 'month' | 'quarter' | 'half-year';
  /** Last period shown on the ruler (extra blank periods are fine and avoid giving the answer away). */
  show: number;
  streams: TimelineStream[];
  /** Optional second question: where does the formula's answer land on the ruler? */
  valueAt?: { prompt: string; period: number };
  explain: string;
}

export interface Method {
  id: string;
  name: string;
  tex: Tex;
  /** Letter of the exam formula sheet entry this uses, if any. */
  sheet?: string;
}

export interface FormulaSpec {
  options: string[]; // Method ids
  correct: string;
  explain: string;
}

export interface InputSpec {
  key: string;
  symbol: Tex;
  label: string;
  unit: Unit;
  expected: number;
  explain: string;
  /** Accept the value with either sign (a cost may be typed as 23000 or −23000). */
  signless?: boolean;
}

export interface DecisionOption {
  id: string;
  label: string;
}

export interface DecisionSpec {
  question: string;
  options: DecisionOption[];
  correct: string;
  why: DecisionOption[];
  correctWhy: string;
  explain: string;
}

export interface Outcome {
  valueDelta: number;
  cashDelta?: number;
  news: string;
}

export interface Hints {
  timeline: string;
  formula: string;
  inputs: string;
  answer: string;
  decision: string;
}

/** A problem with its numbers filled in. Everything here is derived from one parameter set. */
export interface ProblemInstance {
  /** The story, as prose. Numbers must be pulled out by the player. */
  prompt: string[];
  ask: string;
  timeline: TimelineSpec;
  formula: FormulaSpec;
  inputs: InputSpec[];
  /** Computes the answer from input values (percentages entered as percent, e.g. 6 for 6%). */
  solve: (values: Record<string, number>) => number;
  answer: { label: string; unit: Unit; explain: string };
  decision: DecisionSpec;
  /** Model exam-script solution, one line each. */
  working: Tex[];
  hints: Hints;
  /** Consequence for the house, by decision option id. */
  outcomes: Record<string, Outcome>;
  /** One-line result the CFO reports once the concept is common knowledge. */
  cfoLine: string;
}

export interface CalcProblem<P = any> {
  kind: 'calc';
  id: string;
  title: string;
  concept: ConceptId;
  /** Earlier concepts this problem reuses. */
  uses?: ConceptId[];
  base: P;
  vary: (rng: () => number) => P;
  build: (p: P) => ProblemInstance;
  paper?: string;
}

// ---------- Classification problems (for conceptual topics) ----------

export interface ClassifyItem {
  text: string;
  category: string;
  why: string;
}

export interface ClassifyProblem {
  kind: 'classify';
  id: string;
  title: string;
  concept: ConceptId;
  /** Further concepts marked by this exercise (each item can be tagged). */
  prompt: string[];
  categories: DecisionOption[];
  /** Pool of items; a play shows `show` of them. */
  items: (ClassifyItem & { concept?: ConceptId })[];
  show: number;
  outcome?: { allRight: Outcome; someWrong: Outcome };
}

export type Problem = CalcProblem | ClassifyProblem;

// ---------- Sessions and acts ----------

export interface StoryBeat {
  who: CharacterId;
  text: string;
}

export type SessionPart =
  | { kind: 'story'; beats: StoryBeat[] }
  | { kind: 'lesson'; concepts: ConceptId[] }
  | { kind: 'problem'; problem: string; params?: unknown }
  | { kind: 'spotcheck' };

export interface Session {
  id: string;
  title: string;
  /** Short teaser for the act map. */
  blurb: string;
  parts: SessionPart[];
}

export interface BossRound {
  title: string;
  intro: StoryBeat[];
  problems: { problem: string; params?: unknown }[];
  paper: { ref: string; note: string }[];
}

export interface Act {
  number: number;
  numeral: string;
  title: string;
  lecture: string;
  chapters: string;
  concepts: ConceptId[];
  sessions: Session[];
  boss?: BossRound;
  /** True while the act is only a placeholder awaiting content. */
  draft?: boolean;
  blurb: string;
}

export interface Character {
  id: CharacterId;
  name: string;
  role: string;
}
