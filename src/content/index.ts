// Registries the engine reads. Adding an act means adding its files here, nothing else.
import { holdingsOf, pin, type HeldItem } from '../engine/holdings';
import { CORE_TRADING, type SaveData } from '../engine/save';
import type { CalcProblem, Concept, ConceptId, Problem, Session } from '../engine/types';
import { ACT1_CONCEPTS } from './act-1-concepts';
import { ACT1_PROBLEMS } from './act-1-problems';
import { ACT2_CONCEPTS } from './act-2-concepts';
import { ACT2_PROBLEMS } from './act-2-problems';
import { ACT3_CONCEPTS } from './act-3-concepts';
import { ACT3_PROBLEMS } from './act-3-problems';
import { ACT4_CONCEPTS } from './act-4-concepts';
import { ACT4_PROBLEMS } from './act-4-problems';
import { ACT5_CONCEPTS } from './act-5-concepts';
import { ACT5_PROBLEMS } from './act-5-problems';
import { ACTS } from './acts';
import { EXAM_PROBLEMS } from './exam-rooms';
import { MATCH_PROBLEMS } from './matches';
import { EXTRA_PROBLEMS } from './practice-extra';
import { METHODS } from './methods';

export { ACTS } from './acts';
export { CHARACTERS, FORMULA_SHEET, METHODS } from './methods';

export const CONCEPTS: Record<ConceptId, Concept> = Object.fromEntries([...ACT1_CONCEPTS, ...ACT2_CONCEPTS, ...ACT3_CONCEPTS, ...ACT4_CONCEPTS, ...ACT5_CONCEPTS].map((c) => [c.id, c]));

export const PROBLEMS: Record<string, Problem> = Object.fromEntries([...ACT1_PROBLEMS, ...ACT2_PROBLEMS, ...ACT3_PROBLEMS, ...ACT4_PROBLEMS, ...ACT5_PROBLEMS, ...EXAM_PROBLEMS, ...MATCH_PROBLEMS, ...EXTRA_PROBLEMS].map((p) => [p.id, p]));

export const ALL_CONCEPT_IDS: ConceptId[] = ACTS.flatMap((a) => a.concepts);

/** Problems that can practise a concept (a classify item tagged with it also counts). Story choices (match) are not practice. */
export function problemsFor(concept: ConceptId): Problem[] {
  return Object.values(PROBLEMS).filter(
    (p) =>
      (p.kind !== 'match' && p.concept === concept) ||
      (p.kind === 'classify' && p.items.some((i) => i.concept === concept)) ||
      (p.kind === 'worksheet' && p.build(p.base).rows.some((r) => r.concept === concept)),
  );
}

export const PRACTISABLE: ConceptId[] = ALL_CONCEPT_IDS.filter((id) => problemsFor(id).length > 0);

export function findSession(id: string): { session: Session; act: (typeof ACTS)[number]; index: number } | null {
  for (const act of ACTS) {
    const index = act.sessions.findIndex((s) => s.id === id);
    if (index >= 0) return { session: act.sessions[index], act, index };
  }
  return null;
}

export const isCalc = (p: Problem): p is CalcProblem => p.kind === 'calc';

/** The chapter each method is first needed in, from the problems that use it. */
const METHOD_ACT: Record<string, number> = {};
for (const p of Object.values(PROBLEMS)) {
  if (p.kind !== 'calc') continue;
  const id = p.build(p.base).formula.correct;
  const act = CONCEPTS[p.concept].act;
  METHOD_ACT[id] = Math.min(METHOD_ACT[id] ?? act, act);
}

/** Every method taught up to and including a chapter, in formula-sheet order. */
export const methodsUpTo = (act: number) => Object.keys(METHODS).filter((id) => (METHOD_ACT[id] ?? 99) <= act);

/** Methods first taught in one chapter. */
export const methodsOf = (act: number) => Object.keys(METHODS).filter((id) => METHOD_ACT[id] === act);

/** For saves from before holdings: assume the right call was made in every episode already played. */
export function seedHoldings(save: SaveData): HeldItem[] {
  const out: HeldItem[] = [CORE_TRADING];
  for (const act of ACTS)
    for (const session of act.sessions) {
      if (!save.sessions[session.id]) continue;
      for (const part of session.parts) {
        if (part.kind !== 'problem') continue;
        const p = PROBLEMS[part.problem];
        if (p.kind !== 'calc') continue;
        const inst = p.build(part.params ?? p.base);
        for (const h of holdingsOf(inst.outcomes[inst.decision.correct])) out.push(pin(h, act.number));
      }
    }
  return out;
}
