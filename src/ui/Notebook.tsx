// The notebook: where marks go, grouped by idea, with a drill for each.
import { CONCEPTS, PRACTISABLE } from '../content';
import { STEP_ADVICE, STEP_LABEL, openSlips, slipConcepts, slipPattern } from '../engine/slips';
import { Bubble } from './Chat';
import { useGame } from './store';

export function Notebook() {
  const { save, go, openLesson } = useGame();
  const open = openSlips(save.slips);
  const fixed = save.slips.length - open.length;
  const pattern = slipPattern(save.slips);
  const concepts = slipConcepts(save.slips);
  const worst = concepts.find((c) => PRACTISABLE.includes(c.concept));
  const total = pattern.reduce((s, p) => s + p.n, 0);

  if (!save.slips.length)
    return (
      <>
        <section className="hero">
          <h1>Your notebook</h1>
          <p>Every mark you lose gets written up here, with what went wrong and how to fix it. Nothing yet.</p>
        </section>
      </>
    );

  return (
    <>
      <section className="hero">
        <h1>Your notebook</h1>
        <p>
          {open.length ? `${open.length} thing${open.length === 1 ? '' : 's'} still to fix` : 'Everything you’ve slipped on, you’ve since got right'}
          {fixed ? ` · ${fixed} fixed` : ''}. A slip is fixed when you get that idea fully right again, with no tips.
        </p>
        {worst && (
          <button type="button" className="btn big" onClick={() => go({ name: 'practice', concept: worst.concept })}>
            Drill: {CONCEPTS[worst.concept].name} →
          </button>
        )}
      </section>

      {pattern.length > 0 && (
        <section className="notebook-pattern">
          <h2 style={{ fontSize: 22 }}>Where your marks go</h2>
          <div className="pattern-bars">
            {pattern.map((p) => (
              <div key={p.step} className="pattern-row">
                <span>{STEP_LABEL[p.step]}</span>
                <span className="pattern-bar" aria-hidden>
                  <span style={{ width: `${(p.n / pattern[0].n) * 100}%` }} />
                </span>
                <span className="num-tab muted">{p.n}</span>
              </div>
            ))}
          </div>
          <Bubble
            beat={{
              who: 'margaux',
              mood: 'neutral',
              text: `${Math.round((pattern[0].n / total) * 100)}% of what you’ve lost is in “${STEP_LABEL[pattern[0].step]}”. ${STEP_ADVICE[pattern[0].step]}`,
            }}
          />
        </section>
      )}

      {concepts.map(({ concept, n }) => (
        <section key={concept} className="notebook-concept">
          <div className="spread">
            <h2 style={{ fontSize: 20, margin: 0 }}>
              {CONCEPTS[concept].name} <span className="muted num-tab" style={{ fontSize: 14 }}>· {n}</span>
            </h2>
            <span className="row">
              <button type="button" className="btn ghost small" onClick={() => openLesson(concept)}>
                Cheat card
              </button>
              {PRACTISABLE.includes(concept) && (
                <button type="button" className="btn small" onClick={() => go({ name: 'practice', concept })}>
                  Drill it
                </button>
              )}
            </span>
          </div>
          <ul className="slip-list">
            {openSlips(save.slips)
              .filter((s) => s.concept === concept)
              .sort((a, b) => b.at - a.at)
              .map((s, i) => (
                <li key={i}>
                  <div className="slip-head">
                    <span className="tagline">{STEP_LABEL[s.step]}</span>
                    <span className="muted" style={{ fontSize: 13 }}>
                      {s.title}
                      {s.n > 1 ? ` · ${s.n} times` : ''}
                    </span>
                  </div>
                  <div>{s.what}</div>
                  <div className="slip-fix">{s.fix}</div>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </>
  );
}
