// Sorting exercise for conceptual topics (assets, decisions, agency).
import { useMemo, useState } from 'react';
import { mulberry32, shuffle } from '../engine/rng';
import type { ClassifyProblem, ConceptId } from '../engine/types';

export interface ClassifyResult {
  score: number;
  max: number;
  /** Per concept: were all its items right? */
  clean: Record<ConceptId, boolean>;
}

export function ClassifyRunner({
  problem,
  seed,
  count,
  onDone,
}: {
  problem: ClassifyProblem;
  seed: number;
  count?: number;
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
    onDone({ score, max: items.length, clean });
  };

  return (
    <section className="panel" aria-labelledby="classify-title">
      <div className="eyebrow">Sort</div>
      <h2 id="classify-title" className="step-title" style={{ marginTop: 4 }}>
        {problem.title}
      </h2>
      <div className="prose">
        {problem.prompt.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
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
      <div className="step-actions">
        <span className="spacer" />
        {checked && (
          <span className="muted num-tab" style={{ fontSize: 13 }}>
            {score} / {items.length}
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
    </section>
  );
}
