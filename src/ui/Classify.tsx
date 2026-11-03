// Sorting exercise for conceptual topics (assets, decisions, agency).
import { useMemo, useState, type ReactNode } from 'react';
import { mulberry32, shuffle } from '../engine/rng';
import type { NewSlip } from '../engine/slips';
import type { ClassifyProblem, ConceptId } from '../engine/types';
import { Bubble, Chat } from './Chat';

export interface ClassifyResult {
  score: number;
  max: number;
  /** Per concept: were all its items right? */
  clean: Record<ConceptId, boolean>;
  slips: NewSlip[];
}

export function ClassifyRunner({
  problem,
  seed,
  count,
  onDone,
  intro,
}: {
  problem: ClassifyProblem;
  seed: number;
  count?: number;
  intro?: ReactNode;
  onDone: (r: ClassifyResult) => void;
}) {
  const items = useMemo(() => shuffle(mulberry32(seed), problem.items).slice(0, count ?? problem.show), [problem, seed, count]);
  const [answers, setAnswers] = useState<(string | null)[]>(() => items.map(() => null));
  const [checked, setChecked] = useState(false);

  const score = items.filter((it, i) => answers[i] === it.category).length;
  const finish = () => {
    const clean: Record<string, boolean> = {};
    items.forEach((it, i) => {
      const c = it.concept ?? problem.concept;
      clean[c] = (clean[c] ?? true) && answers[i] === it.category;
    });
    const slips: NewSlip[] = items
      .map((it, i) => ({ it, i }))
      .filter(({ it, i }) => answers[i] !== it.category)
      .slice(0, 4)
      .map(({ it }) => ({
        concept: it.concept ?? problem.concept,
        problem: problem.id,
        title: problem.title,
        step: 'item' as const,
        what: `“${it.text}” belongs under ${problem.categories.find((c) => c.id === it.category)?.label ?? it.category}`,
        fix: it.why,
      }));
    onDone({ score, max: items.length, clean, slips });
  };

  return (
    <section aria-labelledby="classify-title">
      {intro}
      <div className="game-title">
        <span className="game-kind">Sorting round</span>
        <h2 id="classify-title">{problem.title}</h2>
      </div>
      <Chat beats={problem.prompt} host={problem.host} />
      <div className="panel">
      {items.map((it, i) => {
        const right = answers[i] === it.category;
        return (
          <div className="classify-item" key={it.text}>
            <div className="text">{it.text}</div>
            <div className="seg" role="radiogroup" aria-label={it.text}>
              {problem.categories.map((c) => {
                const state = checked ? (c.id === it.category ? 'correct' : c.id === answers[i] ? 'wrong' : undefined) : undefined;
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="radio"
                    aria-checked={answers[i] === c.id}
                    className={`choice${state ? ' is-' + state : ''}`}
                    disabled={checked}
                    onClick={() => setAnswers((a) => a.map((v, j) => (j === i ? c.id : v)))}
                  >
                    <span className="dot" aria-hidden />
                    <span className="body">{c.label}</span>
                  </button>
                );
              })}
            </div>
            {checked && (
              <div className={`why check ${right ? 'good' : 'bad'}`}>
                {right ? '✓ ' : '✕ '}
                <span style={{ color: 'var(--ink-2)' }}>{it.why}</span>
              </div>
            )}
          </div>
        );
      })}
      {checked && (
        <Bubble
          beat={{
            who: 'margaux',
            mood: score === items.length ? 'happy' : score >= items.length / 2 ? 'neutral' : 'worried',
            text:
              score === items.length
                ? 'Clean sweep. Lovely.'
                : score >= items.length / 2
                  ? 'Mostly there. Read the ones you missed.'
                  : 'Hmm. Have a proper look at the reasons above.',
          }}
        />
      )}
      <div className="step-actions">
        <span className="spacer" />
        {checked && (
          <span className="points num-tab">
            ✦ {score} / {items.length}
          </span>
        )}
        {!checked ? (
          <button type="button" className="btn" disabled={answers.some((a) => a === null)} onClick={() => setChecked(true)}>
            Check
          </button>
        ) : (
          <button type="button" className="btn" onClick={finish} autoFocus>
            Continue
          </button>
        )}
      </div>
      </div>
    </section>
  );
}
