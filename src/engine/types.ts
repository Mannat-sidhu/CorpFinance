// Content contract. Acts are plain data written against these types; the engine never
// needs to change when an act is added or edited.

export type ConceptId = string;
export type Stage = 'locked' | 'new' | 'practising' | 'common';
export type CharacterId = 'margaux' | 'theo' | 'idris' | 'ferriter' | 'aoife' | 'rupert' | 'celine' | 'saoirse' | 'kenji' | 'narrator' | 'news';

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
  /** Other methods that also get there (marked right in unguided rounds, where every method is offered). */
  accept?: string[];
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
  /** Commitments that keep paying or costing cash at each year end. */
  holding?: Holding | Holding[];
}

/**
 * A decision's cash flows after the day it is signed. Each chapter is a year of story time;
 * flows land at the year-end screen. `start` is counted from the decision: 1 = this year's end.
 */
export interface Holding {
  /** Re-deciding the same thing replaces the old holding. */
  id: string;
  label: string;
  start: number;
  /** Number of yearly flows; leave out for one that runs forever. */
  years?: number;
  /** First flow, signed: positive is cash in. */
  amount: number;
  /** Growth of the flow, % a year. */
  growth?: number;
  /** One-off flow paid with the last one (a bond's face value). */
  final?: number;
  /** Uneven flows, one a year from `start`; replaces amount, growth and years. */
  flows?: number[];
  /** Risky: the actual flow is the expected one × (1 ± spread), drawn at year end. */
  spread?: number;
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
  /** The story, spoken by the cast. Plain strings are said by the problem's host. Numbers must be pulled out by the player. */
  prompt: (string | StoryBeat)[];
  ask: string;
  timeline: TimelineSpec;
  formula: FormulaSpec;
  inputs: InputSpec[];
  /** Computes the answer from input values (percentages entered as percent, e.g. 6 for 6%). */
  solve: (values: Record<string, number>) => number;
  /** `tolerance` overrides the default ±0.5% with an absolute band (in the answer's unit). */
  answer: { label: string; unit: Unit; explain: string; tolerance?: number };
  /**
   * For answers with no closed form (YTM, IRR): a widget where the player tries a rate
   * and sees the resulting value, to home in by trial and error as on a calculator.
   */
  tryRate?: { valueLabel: string; value: (ratePct: number) => number; target: number; targetLabel: string; unit: Unit; /** Show higher/lower nudges (off when there may be several answers). */ nudge?: boolean };
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
  /** Who brings this problem to you. */
  host: CharacterId;
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
  host: CharacterId;
  concept: ConceptId;
  /** Further concepts marked by this exercise (each item can be tagged). */
  prompt: string[];
  categories: DecisionOption[];
  /** Pool of items; a play shows `show` of them. */
  items: (ClassifyItem & { concept?: ConceptId })[];
  show: number;
  outcome?: { allRight: Outcome; someWrong: Outcome };
}

// ---------- Written answers: "Brief the board" ----------

export interface BriefCard {
  text: string;
  /** key: earns a mark. trap: wrong, costs a mark. filler: true but not worth a mark here. */
  kind: 'key' | 'trap' | 'filler';
  why: string;
}

export interface BriefProblem {
  kind: 'brief';
  id: string;
  title: string;
  host: CharacterId;
  concept: ConceptId;
  /** Who asks, in their own words. */
  prompt: (string | StoryBeat)[];
  /** The exam-style question being answered. */
  question: string;
  cards: BriefCard[];
  /** The paragraph Margaux would write, to copy out on paper. */
  model: string;
}

// ---------- Table-fill rounds ----------

export interface TableProblem {
  kind: 'table';
  id: string;
  title: string;
  host: CharacterId;
  concept: ConceptId;
  prompt: (string | StoryBeat)[];
  /** Each column has its own set of choices. */
  columns: { label: string; options: string[] }[];
  rows: { label: string; answers: string[]; why: string }[];
}

// ---------- Cash-flow worksheet ----------

export interface WorksheetRow {
  key: string;
  label: string;
  /** Shown filled in; the player doesn't type it. */
  given?: boolean;
  /** Which years the player fills; other years show the computed value greyed out. Defaults to all. */
  cells?: number[];
  /** Concept this row trains, for mastery. */
  concept?: ConceptId;
  hint: string;
  explain: string;
  /** Computes the row from earlier rows. Fed the player's own earlier rows for error carried forward. */
  calc: (rows: Record<string, number[]>) => number[];
}

export interface WorksheetInstance {
  prompt: (string | StoryBeat)[];
  ask: string;
  /** Last year shown (columns are years 0..years). */
  years: number;
  unitLabel: string;
  rows: WorksheetRow[];
  /** Discount rate in percent, for the NPV of the last row. */
  rate: number;
  /** Key of the row whose NPV is the answer. */
  netRow: string;
  decision: DecisionSpec;
  working: Tex[];
  outcomes: Record<string, Outcome>;
}

export interface WorksheetProblem<P = any> {
  kind: 'worksheet';
  id: string;
  title: string;
  host: CharacterId;
  concept: ConceptId;
  base: P;
  vary: (rng: () => number) => P;
  build: (p: P) => WorksheetInstance;
}

// ---------- Match and choose (several real options, more than one defensible) ----------

export interface MatchOption {
  id: string;
  name: string;
  /** Facts shown in the comparison table, by column key. */
  cells: Record<string, string>;
  /** Cash needed today: options the house can't afford are greyed out at the choose step. */
  cost: number;
  /** What going ahead does to the house. */
  outcome: Outcome;
}

export interface MatchLabel {
  id: string;
  text: string;
  /** The one option this label fits. */
  answer: string;
  why: string;
  /** Labels for options nobody should pick (they destroy value): not offered as a reason. */
  bad?: boolean;
}

export interface MatchInstance {
  prompt: (string | StoryBeat)[];
  ask: string;
  columns: { key: string; label: string }[];
  options: MatchOption[];
  /** A number the player works out for some or all options before matching (NPV, PI, a stake's value). */
  compute?: { label: string; unit: Unit; values: Record<string, number>; explain: string; tolerance?: number };
  labels: MatchLabel[];
  /** Reasons for going ahead, each tied to the label it argues from. */
  reasons: { id: string; text: string; label: string }[];
  working: Tex[];
}

export interface MatchProblem<P = any> {
  kind: 'match';
  id: string;
  title: string;
  host: CharacterId;
  concept: ConceptId;
  uses?: ConceptId[];
  base: P;
  vary: (rng: () => number) => P;
  /** `cash` is the house's real bank balance, so the options can be checked against it. */
  build: (p: P, ctx: { cash: number }) => MatchInstance;
}

export type Problem = CalcProblem | ClassifyProblem | BriefProblem | TableProblem | WorksheetProblem | MatchProblem;

// ---------- Sessions and acts ----------

export type Mood = 'neutral' | 'happy' | 'worried';

export interface StoryBeat {
  who: CharacterId;
  text: string;
  mood?: Mood;
}

export type SessionPart =
  | { kind: 'story'; scene?: string; beats: StoryBeat[] }
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

/** Exam-style questions after the boss: no story, no tips, extra data. */
export interface ExamRoom {
  intro: string;
  problems: { problem: string; params?: unknown }[];
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
  exam?: ExamRoom;
  /** True while the act is only a placeholder awaiting content. */
  draft?: boolean;
  blurb: string;
}

export interface Character {
  id: CharacterId;
  name: string;
  role: string;
  /** One-line personality, shown on the cast card. */
  vibe: string;
}
