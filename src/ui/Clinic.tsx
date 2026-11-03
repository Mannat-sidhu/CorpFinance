// Margaux's clinic: fresh questions on the ideas an episode left shaky. Clearing it unlocks the next episode.
import { useEffect, useMemo, useRef, useState } from 'react';
import { CONCEPTS, PRACTISABLE, PROBLEMS, findSession, isCalc, problemsFor } from '../content';
import { CLEAR_AT } from '../engine/save';
import { mulberry32, newSeed, pickOne } from '../engine/rng';
import { slipConcepts } from '../engine/slips';
import type { ConceptId } from '../engine/types';
import { Bubble } from './Chat';
import { RoundRunner } from './Rounds';
import { Stars, starsFor } from './Stars';
import { useGame } from './store';

/** At most this many questions in a clinic: it is a quick fix, not a second episode. */
const MAX_IDEAS = 3;

export function ClinicPlayer({ sessionId }: { sessionId: string }) {
  const { save, setSave, go, back, recordWork, openLesson } = useGame();
  const found = findSession(sessionId);
  const rec = save.sessions[sessionId];
  const [seed] = useState(newSeed);
  const [attempt, setAttempt] = useState(0);
  const [i, setI] = useState(-1);
  const [runs, setRuns] = useState<{ score: number; max: number }[]>([]);

  // Fixed when the clinic opens: fixing one idea mid-way must not reshuffle which ones are still to come.
  const [ideas] = useState<ConceptId[]>(() => {
    if (!found) return [];
    const weak = (rec?.weak ?? []).filter((c) => PRACTISABLE.includes(c));
    const byOpen = new Map(slipConcepts(save.slips).map((s) => [s.concept, s.n]));
    const ordered = [...weak].sort((a, b) => (byOpen.get(b) ?? 0) - (byOpen.get(a) ?? 0));
    if (ordered.length) return ordered.slice(0, MAX_IDEAS);
    // Nothing recorded (a score under the bar with no single idea to blame): the episode's own problems.
    const own = found.session.parts.flatMap((p) => (p.kind === 'problem' ? [PROBLEMS[p.problem].concept] : []));
    return [...new Set(own)].filter((c) => PRACTISABLE.includes(c)).slice(0, 2);
  });

  const setups = useMemo(
    () =>
      ideas.map((c, k) => {
        const rng = mulberry32(seed + attempt * 101 + k * 13);
        const p = pickOne(rng, problemsFor(c));
        return { concept: c, p, params: isCalc(p) ? p.vary(rng) : null };
      }),
    [ideas, seed, attempt],
  );

  const done = i >= setups.length;
  const score = runs.reduce((s, r) => s + r.score, 0);
  const max = runs.reduce((s, r) => s + r.max, 0);
  const passed = done && (max === 0 || score / max >= CLEAR_AT);

  const clear = () =>
    setSave((s) => (s.sessions[sessionId] ? { ...s, sessions: { ...s.sessions, [sessionId]: { ...s.sessions[sessionId], cleared: true, weak: undefined } } } : s));

  // Nothing to work on: don't trap anyone behind an empty clinic.
  const cleared = useRef(false);
  useEffect(() => {
    if (!found || cleared.current) return;
    if (!ideas.length || passed) {
      cleared.current = true;
      clear();
    }
  }, [found, ideas.length, passed]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!found || !rec) {
    return (
      <div className="play-main narrow">
        <Bubble beat={{ who: 'margaux', text: 'There’s no clinic for an episode you haven’t played yet.' }} />
        <div className="scene-controls">
          <button type="button" className="btn ghost" onClick={back}>
            ← Back
          </button>
        </div>
      </div>
    );
  }

  const { session, act, index } = found;
  const nextSession = act.sessions[index + 1];
  const head = (
    <header className="session-head">
      <div className="eyebrow">
        Chapter {act.numeral} · Episode {index + 1} · Clinic
      </div>
      <h1>{session.title}: a second look</h1>
      <div className="progress-dots" aria-hidden>
        {setups.map((_, k) => (
          <span key={k} className={k < i ? 'done' : k === i ? 'here' : ''} />
        ))}
      </div>
    </header>
  );

  const forward = (
    <div className="scene-controls">
      <button type="button" className="btn ghost" onClick={() => go({ name: 'map' })}>
        Back to the map
      </button>
      <span />
      {nextSession ? (
        <button type="button" className="btn" onClick={() => go({ name: 'play', sessionId: nextSession.id })} autoFocus>
          Next: {nextSession.title} →
        </button>
      ) : act.boss ? (
        <button type="button" className="btn" onClick={() => go({ name: 'boss', act: act.number })} autoFocus>
          Boss level: {act.boss.title} →
        </button>
      ) : null}
    </div>
  );

  if (!ideas.length)
    return (
      <div className="play-main narrow">
        {head}
        <section className="finale">
          <Bubble beat={{ who: 'margaux', mood: 'happy', text: 'Nothing specific to fix. You’re clear to go on.' }} />
          {forward}
        </section>
      </div>
    );

  if (i < 0)
    return (
      <div className="play-main narrow">
        {head}
        <section className="panel">
          <Bubble
            beat={{
              who: 'margaux',
              mood: 'neutral',
              text: `${ideas.length === 1 ? 'One idea' : `${ideas.length} ideas`} to tighten: ${ideas.map((c) => CONCEPTS[c].name.toLowerCase()).join(', ')}. One fresh question on ${ideas.length === 1 ? 'it' : 'each'}, new numbers, ${
                attempt === 0 ? 'with a bit less help than before' : 'and the full help back this time'
              }. Get ${Math.round(CLEAR_AT * 100)}% and you’re through.`,
            }}
          />
          <div className="row" style={{ marginTop: 14, flexWrap: 'wrap' }}>
            {ideas.map((c) => (
              <button key={c} type="button" className="btn ghost small" onClick={() => openLesson(c)}>
                Cheat card: {CONCEPTS[c].name}
              </button>
            ))}
          </div>
          <div className="scene-controls">
            <button type="button" className="btn ghost" onClick={back}>
              ← Back
            </button>
            <span />
            <button type="button" className="btn" onClick={() => setI(0)} autoFocus>
              Start
            </button>
          </div>
        </section>
      </div>
    );

  if (done)
    return (
      <div className="play-main narrow">
        {head}
        <section className="finale">
          <div className="eyebrow">{passed ? 'Through' : 'Not quite'}</div>
          <div className="finale-stars">
            <Stars n={starsFor(score, max)} />
          </div>
          <div className="big-number" style={{ margin: '8px 0 16px' }}>
            {score} <span className="muted" style={{ fontSize: 24 }}>/ {max}</span>
          </div>
          <Bubble
            beat={{
              who: 'margaux',
              mood: passed ? 'happy' : 'worried',
              text: passed
                ? 'That’s it. Solid. On you go.'
                : attempt >= 1
                  ? 'Still wobbly, and that’s fine: it’s all in your notebook. You can try once more, or carry on and let the quizzes catch it later.'
                  : 'Not quite there. Read the notes, then a second go with different numbers and the full help.',
            }}
          />
          {passed ? (
            forward
          ) : (
            <div className="scene-controls">
              <button type="button" className="btn ghost" onClick={() => go({ name: 'notebook' })}>
                Open my notebook
              </button>
              <span className="row">
                {attempt >= 1 && (
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => {
                      clear();
                      go({ name: 'map' });
                    }}
                  >
                    Carry on anyway
                  </button>
                )}
                <button
                  type="button"
                  className="btn"
                  autoFocus
                  onClick={() => {
                    setAttempt((a) => a + 1);
                    setRuns([]);
                    setI(0);
                    window.scrollTo({ top: 0 });
                  }}
                >
                  Try again
                </button>
              </span>
            </div>
          )}
        </section>
      </div>
    );

  const s = setups[i];
  return (
    <div className="play-main narrow">
      {head}
      <RoundRunner
        key={`${attempt}-${i}`}
        problem={s.p}
        params={s.params}
        mode={attempt === 0 ? 'prompted' : 'guided'}
        seed={seed + attempt * 7 + i}
        count={3}
        intro={
          <div className="pop-quiz">
            <span className="pop-tag">Clinic</span> {CONCEPTS[s.concept].name} · {i + 1} of {setups.length}
          </div>
        }
        onDone={(r) => {
          for (const [c, clean] of Object.entries(r.clean)) recordWork(c, clean, false);
          setRuns((x) => [...x, { score: r.score, max: r.max }]);
          setI(i + 1);
          window.scrollTo({ top: 0 });
        }}
      />
    </div>
  );
}
