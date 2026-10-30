// Session player, boss round and free practice.
import { useEffect, useMemo, useRef, useState } from 'react';
import { ACTS, CHARACTERS, CONCEPTS, PRACTISABLE, PROBLEMS, findSession, isCalc, problemsFor } from '../content';
import { eurSigned, pct } from '../engine/format';
import { STEPS } from '../engine/grading';
import { modeFor, pickSpotCheck, stageOf } from '../engine/mastery';
import { mulberry32, newSeed, pickOne } from '../engine/rng';
import type { CalcProblem, ConceptId, Problem, Stage, StoryBeat } from '../engine/types';
import { ClassifyRunner } from './Classify';
import { Ledger, LessonView, STAGE_LABEL } from './Overlays';
import { ProblemRunner, type RunResult } from './ProblemRunner';
import { bumpStreak, useGame } from './store';

// ---------------------------------------------------------------- shared pieces

export function Story({ beats, onDone, cta = 'Continue' }: { beats: StoryBeat[]; onDone: () => void; cta?: string }) {
  return (
    <section>
      <div className="story">
        {beats.map((b, i) => {
          const c = CHARACTERS[b.who];
          const narration = b.who === 'narrator';
          return (
            <div key={i} className={`beat ${narration ? 'narration' : 'speech'}`} style={{ animationDelay: `${i * 0.12}s` }}>
              {!narration && (
                <div className="who">
                  {c.name} <em>· {c.role}</em>
                </div>
              )}
              <div className="line">{b.text}</div>
            </div>
          );
        })}
      </div>
      <div className="step-actions">
        <span className="spacer" />
        <button type="button" className="btn" onClick={onDone} autoFocus>
          {cta}
        </button>
      </div>
    </section>
  );
}

function Lessons({ concepts, onDone }: { concepts: ConceptId[]; onDone: () => void }) {
  const { save, meet } = useGame();
  const [i, setI] = useState(0);
  const [reread, setReread] = useState(false);
  const id = concepts[i];
  const c = CONCEPTS[id];
  const stage = stageOf(save, id);
  const known = stage === 'practising' || stage === 'common';
  const advance = () => {
    meet(id);
    setReread(false);
    if (i + 1 < concepts.length) {
      setI(i + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else onDone();
  };
  if (known && !reread) {
    return (
      <section className="panel">
        <div className="eyebrow">Lesson · {STAGE_LABEL[stage]}</div>
        <h2 className="step-title" style={{ marginTop: 4 }}>
          {c.name}
        </h2>
        <p className="muted">You know this one: {c.summary}</p>
        <div className="step-actions">
          <button type="button" className="btn ghost" onClick={() => setReread(true)}>
            Read it again
          </button>
          <span className="spacer" />
          <button type="button" className="btn" onClick={advance}>
            Skip
          </button>
        </div>
      </section>
    );
  }
  return (
    <section>
      {concepts.length > 1 && (
        <div className="eyebrow" style={{ marginBottom: 8 }}>
          Lesson {i + 1} of {concepts.length}
        </div>
      )}
      <LessonView key={id} concept={c} />
      <div className="step-actions">
        <span className="spacer" />
        <button type="button" className="btn" onClick={advance}>
          {i + 1 < concepts.length ? 'Next lesson' : 'I’ve read it'}
        </button>
      </div>
    </section>
  );
}

function CfoCard({ problem, params, onDone }: { problem: CalcProblem; params: unknown; onDone: (decision: string) => void }) {
  const { openLesson } = useGame();
  const inst = useMemo(() => problem.build(params ?? problem.base), [problem, params]);
  return (
    <section className="panel">
      <div className="eyebrow">Common knowledge · handled by your CFO</div>
      <div className="cfo" style={{ marginTop: 12 }}>
        <div className="monogram" aria-hidden>
          M
        </div>
        <div>
          <div className="prose" style={{ fontSize: 17 }}>
            {inst.prompt[0]}
          </div>
          <p className="outcome" style={{ paddingTop: 4 }}>
            {inst.cfoLine}
          </p>
          <button type="button" className="link" onClick={() => openLesson(problem.concept)}>
            Revise: {CONCEPTS[problem.concept].name}
          </button>
        </div>
      </div>
      <div className="step-actions">
        <span className="spacer" />
        <button type="button" className="btn" onClick={() => onDone(inst.decision.correct)} autoFocus>
          Continue
        </button>
      </div>
    </section>
  );
}

function Promotion({ concept, to }: { concept: ConceptId; to: Stage }) {
  return (
    <div className="feedback good" role="status">
      <div className="verdict">
        {CONCEPTS[concept].name} → {STAGE_LABEL[to]}
      </div>
      {to === 'practising' && 'Two clean answers on separate days. From now on Margaux does the routine arithmetic.'}
      {to === 'common' && 'Common knowledge: Margaux will handle it, with the occasional spot check.'}
    </div>
  );
}

const pickProblem = (concept: ConceptId, rng: () => number): Problem => pickOne(rng, problemsFor(concept));

/** Picks and runs a quick check on one concept. Records the result. */
function SpotCheck({ exclude, onDone }: { exclude: ConceptId[]; onDone: (score: number, max: number) => void }) {
  const { save, recordWork } = useGame();
  const [seed] = useState(newSeed);
  const [target] = useState(() => pickSpotCheck(save, PRACTISABLE, exclude, Date.now()));
  const [promo, setPromo] = useState<Stage | null>(null);
  const [done, setDone] = useState<{ score: number; max: number } | null>(null);
  const setup = useMemo(() => {
    if (!target) return null;
    const rng = mulberry32(seed);
    const p = pickProblem(target, rng);
    return { p, params: isCalc(p) ? p.vary(rng) : null };
  }, [target, seed]);

  if (!target || !setup) {
    return (
      <section className="panel">
        <div className="eyebrow">Spot check</div>
        <p style={{ marginTop: 8 }}>Nothing is due for a spot check today.</p>
        <div className="step-actions">
          <span className="spacer" />
          <button type="button" className="btn" onClick={() => onDone(0, 0)} autoFocus>
            Continue
          </button>
        </div>
      </section>
    );
  }
  if (done) {
    return (
      <section className="panel">
        <div className="eyebrow">Spot check · {CONCEPTS[target].name}</div>
        <p style={{ marginTop: 8 }}>
          {done.score} / {done.max}.
        </p>
        {promo && <Promotion concept={target} to={promo} />}
        <div className="step-actions">
          <span className="spacer" />
          <button type="button" className="btn" onClick={() => onDone(done.score, done.max)} autoFocus>
            Continue
          </button>
        </div>
      </section>
    );
  }
  const stage = stageOf(save, target);
  const intro = (
    <p className="muted" style={{ fontSize: 14 }}>
      Spot check on <strong>{CONCEPTS[target].name}</strong> ({STAGE_LABEL[stage].toLowerCase()}). About a minute. New numbers.
    </p>
  );
  if (setup.p.kind === 'classify') {
    return (
      <>
        {intro}
        <ClassifyRunner
          problem={setup.p}
          seed={seed}
          count={3}
          onDone={(r) => {
            const clean = r.clean[target] ?? r.score === r.max;
            const to = recordWork(target, clean, true);
            if (to && to !== stage) setPromo(to);
            setDone({ score: r.score, max: r.max });
          }}
        />
      </>
    );
  }
  return (
    <ProblemRunner
      problem={setup.p}
      params={setup.params}
      mode="practising"
      seed={seed}
      intro={intro}
      onDone={(r) => {
        const to = recordWork(target, r.clean, true);
        if (to && to !== stage) setPromo(to);
        setDone({ score: r.score, max: r.max });
      }}
    />
  );
}

// ---------------------------------------------------------------- session

export function SessionPlayer({ sessionId }: { sessionId: string }) {
  const { save, setSave, go, applyOutcome, recordWork } = useGame();
  const found = findSession(sessionId)!;
  const { session, act, index } = found;
  const replay = !!save.sessions[sessionId];
  const resume = save.resume?.sessionId === sessionId ? save.resume : null;
  const [part, setPart] = useState(resume?.part ?? 0);
  const [score, setScore] = useState(resume?.score ?? 0);
  const [max, setMax] = useState(resume?.max ?? 0);
  const [startValue] = useState(resume?.startValue ?? save.value);
  const [seed] = useState(newSeed);
  const [promos, setPromos] = useState<{ concept: ConceptId; to: Stage }[]>([]);
  const taught = useMemo(() => session.parts.flatMap((p) => (p.kind === 'lesson' ? p.concepts : [])), [session]);
  const total = session.parts.length;
  const finished = part >= total;

  useEffect(() => {
    if (!finished) setSave((s) => ({ ...s, resume: { sessionId, part, score, max, startValue } }));
  }, [part, score, max, finished, sessionId, startValue, setSave]);

  const recorded = useRef(false);
  useEffect(() => {
    if (!finished || recorded.current) return;
    recorded.current = true;
    setSave((s) =>
      bumpStreak({
        ...s,
        resume: null,
        sessionsPlayed: s.sessionsPlayed + 1,
        sessions: { ...s.sessions, [sessionId]: { at: Date.now(), score, max } },
      }),
    );
  }, [finished, score, max, sessionId, setSave]);

  const advance = (dScore = 0, dMax = 0) => {
    setScore((s) => s + dScore);
    setMax((m) => m + dMax);
    setPart((p) => p + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const notePromo = (concept: ConceptId, to: Stage | null) => to && setPromos((p) => [...p, { concept, to }]);

  const head = (
    <header className="session-head">
      <div className="eyebrow">
        Act {act.numeral} · Session {index + 1} of {act.sessions.length}
        {replay && ' · replay: the house’s value is not affected'}
      </div>
      <h1>{session.title}</h1>
      <div className="progress-dots" aria-hidden>
        {session.parts.map((_, i) => (
          <span key={i} className={i < part ? 'done' : i === part ? 'here' : ''} />
        ))}
      </div>
    </header>
  );

  if (finished) {
    const nextSession = act.sessions[index + 1];
    const delta = save.value - startValue;
    return (
      <div className="play">
        <div className="play-main">
          {head}
          <section className="panel">
            <div className="eyebrow">Session complete</div>
            <div className="spread" style={{ marginTop: 14 }}>
              <div>
                <div className="eyebrow">Marks</div>
                <div className="big-number">
                  {score}
                  <span className="muted" style={{ fontSize: 24 }}>
                    {' '}
                    / {max}
                  </span>
                </div>
              </div>
              <div>
                <div className="eyebrow">House value this session</div>
                <div className={`big-number delta ${delta >= 0 ? 'up' : 'down'}`} style={{ fontWeight: 400 }}>
                  {eurSigned(delta)}
                </div>
              </div>
            </div>
            {promos.map((p, i) => (
              <Promotion key={i} concept={p.concept} to={p.to} />
            ))}
            <p className="muted" style={{ marginTop: 16, fontSize: 14 }}>
              Concepts move up a stage after two clean answers in separate sittings (different days, or six hours apart). Come back tomorrow and practise
              from the ledger.
            </p>
            <div className="step-actions">
              <button type="button" className="btn ghost" onClick={() => go({ name: 'map' })}>
                Back to the map
              </button>
              <span className="spacer" />
              {nextSession ? (
                <button type="button" className="btn" onClick={() => go({ name: 'play', sessionId: nextSession.id })}>
                  Next: {nextSession.title}
                </button>
              ) : act.boss ? (
                <button type="button" className="btn" onClick={() => go({ name: 'boss', act: act.number })}>
                  Boss round: {act.boss.title}
                </button>
              ) : null}
            </div>
          </section>
        </div>
        <aside className="play-side">
          <Ledger />
        </aside>
      </div>
    );
  }

  const p = session.parts[part];
  let body: JSX.Element;
  if (p.kind === 'story') body = <Story key={part} beats={p.beats} onDone={() => advance()} />;
  else if (p.kind === 'lesson') body = <Lessons key={part} concepts={p.concepts} onDone={() => advance()} />;
  else if (p.kind === 'spotcheck') body = <SpotCheck key={part} exclude={taught} onDone={(s, m) => advance(s, m)} />;
  else {
    const problem = PROBLEMS[p.problem];
    if (problem.kind === 'classify') {
      body = (
        <ClassifyRunner
          key={part}
          problem={problem}
          seed={seed + part}
          onDone={(r) => {
            for (const [c, clean] of Object.entries(r.clean)) notePromo(c, recordWork(c, clean, false));
            advance(r.score, r.max);
          }}
        />
      );
    } else {
      const mode = modeFor(stageOf(save, problem.concept));
      if (mode === 'auto') {
        body = (
          <CfoCard
            key={part}
            problem={problem}
            params={p.params}
            onDone={(d) => {
              const o = problem.build(p.params ?? problem.base).outcomes[d];
              if (!replay && o) applyOutcome(o);
              advance();
            }}
          />
        );
      } else {
        body = (
          <ProblemRunner
            key={part}
            problem={problem}
            params={p.params}
            mode={mode}
            seed={seed + part}
            outcomeNote={!replay}
            onDone={(r: RunResult) => {
              const o = r.instance.outcomes[r.decision];
              if (!replay && o) applyOutcome(o);
              notePromo(problem.concept, recordWork(problem.concept, r.clean, false));
              advance(r.score, r.max);
            }}
          />
        );
      }
    }
  }

  return (
    <div className="play">
      <div className="play-main">
        {head}
        {body}
      </div>
      <aside className="play-side" aria-label="Ledger">
        <Ledger />
      </aside>
    </div>
  );
}

// ---------------------------------------------------------------- boss round

export function BossPlayer({ actNumber }: { actNumber: number }) {
  const { setSave, go, recordWork } = useGame();
  const act = ACTS[actNumber - 1];
  const boss = act.boss!;
  const [i, setI] = useState(-1);
  const [seed] = useState(newSeed);
  const [runs, setRuns] = useState<{ title: string; r: RunResult }[]>([]);
  const done = i >= boss.problems.length;

  useEffect(() => {
    if (!done) return;
    const score = runs.reduce((s, x) => s + x.r.score, 0);
    const max = runs.reduce((s, x) => s + x.r.max, 0);
    setSave((s) => bumpStreak({ ...s, bosses: { ...s.bosses, [actNumber]: { at: Date.now(), score, max } } }));
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const head = (
    <header className="session-head">
      <div className="eyebrow">Act {act.numeral} · Boss round</div>
      <h1>{boss.title}</h1>
      <div className="progress-dots" aria-hidden>
        {boss.problems.map((_, k) => (
          <span key={k} className={k < i ? 'done' : k === i ? 'here' : ''} />
        ))}
      </div>
    </header>
  );

  if (i < 0)
    return (
      <div className="play-main" style={{ maxWidth: 820 }}>
        {head}
        <Story beats={boss.intro} onDone={() => setI(0)} cta="Begin" />
      </div>
    );

  if (done) {
    const score = runs.reduce((s, x) => s + x.r.score, 0);
    const max = runs.reduce((s, x) => s + x.r.max, 0);
    return (
      <div className="play-main" style={{ maxWidth: 820 }}>
        {head}
        <section className="panel">
          <div className="eyebrow">Marks by step</div>
          <div className="big-number" style={{ margin: '8px 0 16px' }}>
            {score} <span className="muted" style={{ fontSize: 24 }}>/ {max}</span>
            <span className="muted" style={{ fontSize: 18, marginLeft: 12 }}>
              {pct(Math.round((score / max) * 100))}
            </span>
          </div>
          <table className="marks-table">
            <tbody>
              <tr>
                <td className="muted">Part</td>
                {STEPS.map((s) => (
                  <td key={s} className="muted" style={{ textAlign: 'right' }}>
                    {s[0].toUpperCase() + s.slice(1, 4)}
                  </td>
                ))}
              </tr>
              {runs.map((x, k) => (
                <tr key={k}>
                  <td>
                    ({String.fromCharCode(97 + k)}) {x.title}
                  </td>
                  {STEPS.map((s) => (
                    <td key={s} style={{ textAlign: 'right' }}>
                      {x.r.results[s]?.score ?? '–'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="paper-card">
          <div className="eyebrow">Now on paper</div>
          <h2 style={{ fontSize: 22, marginTop: 4 }}>The assigned problems for this act</h2>
          <p className="muted" style={{ fontSize: 14, marginTop: 6 }}>
            These are the highest-priority exam material: most of the mock exam came almost word for word from them. Write out every step, as you did here.
          </p>
          <ul>
            {boss.paper.map((p) => (
              <li key={p.ref}>
                <b>{p.ref}</b>
                <span>{p.note}</span>
              </li>
            ))}
          </ul>
        </section>
        <div className="step-actions">
          <span className="spacer" />
          <button type="button" className="btn" onClick={() => go({ name: 'map' })}>
            Back to the map
          </button>
        </div>
      </div>
    );
  }

  const spec = boss.problems[i];
  const problem = PROBLEMS[spec.problem] as CalcProblem;
  return (
    <div className="play-main" style={{ maxWidth: 820 }}>
      {head}
      <ProblemRunner
        key={i}
        problem={problem}
        params={spec.params}
        mode="full"
        seed={seed + i}
        intro={<div className="eyebrow">Part ({String.fromCharCode(97 + i)})</div>}
        onDone={(r) => {
          recordWork(problem.concept, r.clean, false);
          setRuns((x) => [...x, { title: problem.title, r }]);
          setI(i + 1);
          window.scrollTo({ top: 0 });
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------- practice from the ledger

export function PracticePlayer({ concept }: { concept: ConceptId }) {
  const { save, go, recordWork, openLesson } = useGame();
  const [round, setRound] = useState(0);
  const [seed, setSeed] = useState(newSeed);
  const [result, setResult] = useState<{ score: number; max: number; promo: Stage | null } | null>(null);
  const stage = stageOf(save, concept);
  const setup = useMemo(() => {
    const rng = mulberry32(seed);
    const p = pickProblem(concept, rng);
    return { p, params: isCalc(p) ? p.vary(rng) : null };
  }, [concept, seed]);
  const mode = stage === 'practising' || stage === 'common' ? 'practising' : 'full';
  const spot = stage === 'common';
  const c = CONCEPTS[concept];

  const again = () => {
    setResult(null);
    setSeed(newSeed());
    setRound((r) => r + 1);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="play-main" style={{ maxWidth: 820 }}>
      <header className="session-head">
        <div className="eyebrow">Practice · {STAGE_LABEL[stage]}</div>
        <h1>{c.name}</h1>
        <p className="muted" style={{ marginTop: 8 }}>
          Fresh numbers each time. Clean answers here count towards moving up a stage.{' '}
          <button type="button" className="link" onClick={() => openLesson(concept)}>
            Revise the lesson
          </button>
        </p>
      </header>
      {result ? (
        <section className="panel">
          <div className="eyebrow">Result</div>
          <div className="big-number" style={{ margin: '8px 0' }}>
            {result.score} <span className="muted" style={{ fontSize: 24 }}>/ {result.max}</span>
          </div>
          {result.promo && <Promotion concept={concept} to={result.promo} />}
          <div className="step-actions">
            <button type="button" className="btn ghost" onClick={() => go({ name: 'map' })}>
              Back to the map
            </button>
            <span className="spacer" />
            <button type="button" className="btn" onClick={again} autoFocus>
              Another one
            </button>
          </div>
        </section>
      ) : setup.p.kind === 'classify' ? (
        <ClassifyRunner
          key={round}
          problem={setup.p}
          seed={seed}
          count={setup.p.show}
          onDone={(r) => {
            const promo = recordWork(concept, r.clean[concept] ?? r.score === r.max, spot);
            setResult({ score: r.score, max: r.max, promo });
          }}
        />
      ) : (
        <ProblemRunner
          key={round}
          problem={setup.p}
          params={setup.params}
          mode={mode}
          seed={seed}
          onDone={(r) => {
            const promo = recordWork(concept, r.clean, spot);
            setResult({ score: r.score, max: r.max, promo });
          }}
        />
      )}
    </div>
  );
}

