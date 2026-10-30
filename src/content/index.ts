// Registries the engine reads. Adding an act means adding its files here, nothing else.
import type { CalcProblem, Concept, ConceptId, Problem, Session } from '../engine/types';
import { ACT1_CONCEPTS } from './act-1-concepts';
import { ACT1_PROBLEMS } from './act-1-problems';
import { ACTS } from './acts';

export { ACTS } from './acts';
export { CHARACTERS, FORMULA_SHEET, METHODS } from './methods';

export const CONCEPTS: Record<ConceptId, Concept> = Object.fromEntries([...ACT1_CONCEPTS].map((c) => [c.id, c]));

export const PROBLEMS: Record<string, Problem> = Object.fromEntries([...ACT1_PROBLEMS].map((p) => [p.id, p]));

export const ALL_CONCEPT_IDS: ConceptId[] = ACTS.flatMap((a) => a.concepts);

/** Problems that can practise a concept (a classify item tagged with it also counts). */
export function problemsFor(concept: ConceptId): Problem[] {
  return Object.values(PROBLEMS).filter(
    (p) => p.concept === concept || (p.kind === 'classify' && p.items.some((i) => i.concept === concept)),
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
