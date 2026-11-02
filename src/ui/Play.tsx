// Session player, boss round and free practice.
import { useEffect, useMemo, useRef, useState } from 'react';
import { ACTS, CONCEPTS, PRACTISABLE, PROBLEMS, findSession, isCalc, problemsFor } from '../content';
import { eur, eurSigned } from '../engine/format';
import { STEPS } from '../engine/grading';
import { bossHelp, helpFor, pickSpotCheck, stageOf } from '../engine/mastery';
import { mulberry32, newSeed, pickOne } from '../engine/rng';
import type { CalcProblem, ConceptId, Problem, Stage } from '../engine/types';
import { Bubble, Scene } from './Chat';
import { Ledger, LessonCard, STAGE_LABEL } from './Overlays';
import { RoundRunner, type RoundResult } from './Rounds';
import { Stars, starsFor } from './Stars';
import { bumpStreak, useGame } from './store';

// ---------------------------------------------------------------- lessons

function Lessons({
  concepts,
  onDone,
  onBack,
  fromEnd,
}: {
  concepts: ConceptId[];
  onDone: () => void;
  onBack: () => void;
  fromEnd?: boolean;
}) {
  const { save, meet } = useGame();
  const [i, setI] = useState(fromEnd ? concepts.length - 1 : 0);
  const [phase, setPhase] = useState<'talk' | 'card'>(fromEnd ? 'card' : 'talk');
  const [talkFromEnd, setTalkFromEnd] = useState(false);
  const id = concepts[i];
  const c = CONCEPTS[id];
  const stage = stageOf(save, id);
  const known = stage === 'practising' || stage === 'common';

  const nextConcept = () => {
    meet(id);
    if (i + 1 < concepts.length) {
      setI(i + 1);
      setPhase(known ? 'card' : 'talk');
      setTalkFromEnd(false);
    } else onDone();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const prevConcept = () => {
    if (i > 0) {
      setI(i - 1);
      setPhase('card');
    } else onBack();
  };

  const label = (
    <div className="lesson-label">
      <span className="eyebrow">Margaux explains</span>
      {concepts.length > 1 && (
        <span className="eyebrow">
          {i + 1} of {concepts.length}
        </span>
      )}
    </div>
  );

  if (phase === 'talk' && !known) {
    return (
      <section key={`${id}-talk`}>
        {label}
        <Scene
          beats={c.lesson.plain.map((text) => ({ who: 'margaux' as const, text }))}
          startAtEnd={talkFromEnd}
          onBack={prevConcept}
          onDone={() => setPhase('card')}
          cta="Show me the card"
        />
      </section>
    );
  }
  return (
    <section key={`${id}-card`}>
      {label}
      {known && (
        <Bubble beat={{ who: 'margaux', text: `You know this one already. Here’s the card if you want a look.` }} />
      )}
      <LessonCard concept={c} />
      <div className="scene-controls">
        <button
          type="button"
          className="btn ghost small"
          onClick={() => {
            if (known) prevConcept();
            else {
              setTalkFromEnd(true);
              setPhase('talk');
            }
          }}
        >
          ← Back
        </button>
        <span />
        <button type="button" className="btn" onClick={nextConcept}>
          {i + 1 < concepts.length ? 'Next idea' : 'Got it, let’s play'} →
        </button>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- small cards

function CfoCard({ problem, params, onDone }: { problem: CalcProblem; params: unknown; onDone: (decision: string) => void }) {
  const { openLesson } = useGame();
  const inst = useMemo(() => problem.build(params ?? problem.base), [problem, params]);
  return (
    <section>
      <Bubble beat={{ who: 'margaux', mood: 'happy', text: `You know this one cold, so I handled it. ${inst.cfoLine}` }}>
        <button type="button" className="link" style={{ fontSize: 13, marginTop: 6 }} onClick={() => openLesson(problem.concept)}>
          Brush up on {CONCEPTS[problem.concept].name}
        </button>
      </Bubble>
      <div className="scene-controls">
        <span />
        <span />
        <button type="button" className="btn" onClick={() => onDone(inst.decision.correct)} autoFocus>
          Continue →
        </button>
      </div>
    </section>
  );
}

function Promotion({ concept, to }: { concept: ConceptId; to: Stage }) {
  return (
    <div className="level-up" role="status">
      <span className="level-up-tag">Level up</span>
      <strong>{CONCEPTS[concept].name}</strong> is now <em>{STAGE_LABEL[to]}</em>.{' '}
      {to === 'practising' && 'Less help from now on: no formulas shown, and one tip per problem.'}
      {to === 'common' && 'Margaux handles it in the story. Pop quizzes come with no help at all.'}
      {to === 'new' && ''}
    </div>
  );
}

function DoneCard({ title, score, max, onNext }: { title: string; score: number; max: number; onNext: () => void }) {
  return (
    <section className="done-card">
      <div className="done-tick">✓</div>
      <div>
        <div className="eyebrow">Already played</div>
        <div className="done-title">{title}</div>
        <div className="muted">
          ✦ {score} / {max} points
        </div>
      </div>
      <button type="button" className="btn" onClick={onNext} autoFocus>
        Continue →
      </button>
    </section>
  );
}

const pickProblem = (concept: ConceptId, rng: () => number): Problem => pickOne(rng, problemsFor(concept));

/** A quick, one-minute pop quiz on something learnt earlier. */
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
      <section>
        <Bubble beat={{ who: 'margaux', mood: 'happy', text: 'No pop quiz today. Enjoy it while it lasts.' }} />
        <div className="scene-controls">
          <span />
          <span />
          <button type="button" className="btn" onClick={() => onDone(0, 0)} autoFocus>
            Finish →
          </button>
        </div>
      </section>
    );
  }
  if (done) {
    return (
      <section>
        <Bubble
          beat={{
            who: 'margaux',
            mood: done.score === done.max ? 'happy' : 'worried',
            text: done.score === done.max ? 'Still sharp. Good.' : 'Bit rusty. We’ll come back to that one.',
          }}
        />
        {promo && <Promotion concept={target} to={promo} />}
        <div className="scene-controls">
          <span />
          <span className="muted">
            ✦ {done.score} / {done.max}
          </span>
          <button type="button" className="btn" onClick={() => onDone(done.score, done.max)} autoFocus>
            Finish →
          </button>
        </div>
      </section>
    );
  }
  const stage = stageOf(save, target);
  const intro = (
    <div className="pop-quiz">
      <span className="pop-tag">Pop quiz</span> {CONCEPTS[target].name}, with new numbers. About a minute.
    </div>
  );
  return (
    <RoundRunner
      problem={setup.p}
      params={setup.params}
      mode={stage === 'common' ? 'unguided' : 'prompted'}
      seed={seed}
      count={3}
      intro={intro}
      onDone={(r) => {
        const clean = r.clean[target] ?? r.score === r.max;
        const to = recordWork(target, clean, true);
        if (to && to !== stage) setPromo(to);
        setDone({ score: r.score, max: r.max });
      }}
    />
  );
}

// ---------------------------------------------------------------- session

export function SessionPlayer({ sessionId }: { sessionId: string }) {
  const { save, setSave, go, back, applyOutcome, recordWork } = useGame();
  const found = findSession(sessionId)!;
  const { session, act, index } = found;
  const replay = !!save.sessions[sessionId];
  const resume = save.resume?.sessionId === sessionId ? save.resume : null;
  const [part, setPart] = useState(resume?.part ?? 0);
  const [done, setDone] = useState<Record<number, { score: number; max: number }>>(resume?.done ?? {});
  const [cameBack, setCameBack] = useState(false);
  const [startValue] = useState(resume?.startValue ?? save.value);
  const [seed] = useState(newSeed);
  const [promos, setPromos] = useState<{ concept: ConceptId; to: Stage }[]>([]);
  const taught = useMemo(() => session.parts.flatMap((p) => (p.kind === 'lesson' ? p.concepts : [])), [session]);
  const total = session.parts.length;
  const finished = part >= total;
  const score = Object.values(done).reduce((s, d) => s + d.score, 0);
  const max = Object.values(done).reduce((s, d) => s + d.max, 0);

  useEffect(() => {
    if (!finished) setSave((s) => ({ ...s, resume: { sessionId, part, score, max, startValue, done } }));
  }, [part, done, finished, sessionId, startValue, setSave, score, max]);

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

  const forward = (result?: { score: number; max: number }) => {
    if (result) setDone((d) => ({ ...d, [part]: result }));
    setCameBack(false);
    setPart((p) => p + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const backward = () => {
    if (part === 0) return back();
    setCameBack(true);
    setPart((p) => p - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const notePromo = (concept: ConceptId, to: Stage | null) => to && setPromos((p) => [...p, { concept, to }]);

  const head = (
    <header className="session-head">
      <div className="spread">
        <div className="eyebrow">
          Chapter {act.numeral} · Episode {index + 1}
          {replay && ' · replay, just for practice'}
        </div>
        {!finished && (
          <span className="muted num-tab" style={{ fontSize: 13 }}>
            ✦ {score} points
          </span>
        )}
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
    const stars = starsFor(score, max);
    return (
      <div className="play">
        <div className="play-main">
          {head}
          <section className="finale">
            <div className="eyebrow">Episode cleared</div>
            <div className="finale-stars">
              <Stars n={stars} />
            </div>
            <div className="finale-grid">
              <div>
                <div className="eyebrow">Points</div>
                <div className="big-number">
                  {score}
                  <span className="muted" style={{ fontSize: 24 }}>
                    {' '}
                    / {max}
                  </span>
                </div>
              </div>
              <div>
                <div className="eyebrow">House value</div>
                <div className={`big-number delta ${delta >= 0 ? 'up' : 'down'}`} style={{ fontWeight: 400 }}>
                  {eurSigned(delta)}
                </div>
              </div>
            </div>
            {promos.map((p, i) => (
              <Promotion key={i} concept={p.concept} to={p.to} />
            ))}
            <Bubble
              beat={{
                who: 'margaux',
                mood: stars === 3 ? 'happy' : 'neutral',
                text:
                  stars === 3
                    ? 'Not bad at all. Come back tomorrow and do a couple from the ledger. Ideas level up when you get them right on two different days.'
                    : 'Decent. Practise the shaky ones from the ledger tomorrow. Ideas level up when you get them right on two different days.',
              }}
            />
            <div className="scene-controls">
              <button type="button" className="btn ghost" onClick={() => go({ name: 'map' })}>
                Back to the map
              </button>
              <span />
              {nextSession ? (
                <button type="button" className="btn" onClick={() => go({ name: 'play', sessionId: nextSession.id })}>
                  Next: {nextSession.title} →
                </button>
              ) : act.boss ? (
                <button type="button" className="btn" onClick={() => go({ name: 'boss', act: act.number })}>
                  Boss level: {act.boss.title} →
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
  if (p.kind === 'story')
    body = <Scene key={part} beats={p.beats} scene={p.scene} startAtEnd={cameBack} onBack={backward} onDone={() => forward()} />;
  else if (p.kind === 'lesson')
    body = <Lessons key={part} concepts={p.concepts} fromEnd={cameBack} onBack={backward} onDone={() => forward()} />;
  else if (done[part]) {
    const title = p.kind === 'problem' ? PROBLEMS[p.problem].title : 'Pop quiz';
    body = <DoneCard key={part} title={title} score={done[part].score} max={done[part].max} onNext={() => forward()} />;
  } else if (p.kind === 'spotcheck') body = <SpotCheck key={part} exclude={taught} onDone={(s, m) => forward({ score: s, max: m })} />;
  else {
    const problem = PROBLEMS[p.problem];
    const stage = stageOf(save, problem.concept);
    if (problem.kind === 'calc' && stage === 'common') {
      body = (
        <CfoCard
          key={part}
          problem={problem}
          params={p.params}
          onDone={(d) => {
            const o = problem.build(p.params ?? problem.base).outcomes[d];
            if (!replay && o) applyOutcome(o, act.number);
            forward({ score: 0, max: 0 });
          }}
        />
      );
    } else {
      body = (
        <RoundRunner
          key={part}
          problem={problem}
          params={p.params}
          mode={helpFor(stage)}
          seed={seed + part}
          outcomeNote={!replay}
          onDone={(r: RoundResult) => {
            const o = r.calc?.instance.outcomes[r.calc.decision] ?? r.outcome;
            if (!replay && o) applyOutcome(o, act.number);
            for (const [c, clean] of Object.entries(r.clean)) notePromo(c, recordWork(c, clean, false));
            forward({ score: r.score, max: r.max });
          }}
        />
      );
    }
  }

  return (
    <div className="play">
      <div className="play-main">
        {head}
        {(p.kind === 'problem' || p.kind === 'spotcheck') && !done[part] && (
          <button type="button" className="link back-link" onClick={backward}>
            ← Back
          </button>
        )}
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
  const { save, setSave, go, back, recordWork } = useGame();
  const act = ACTS[actNumber - 1];
  const boss = act.boss!;
  const [i, setI] = useState(-1);
  const [seed] = useState(newSeed);
  const [runs, setRuns] = useState<{ title: string; r: RoundResult }[]>([]);
  const done = i >= boss.problems.length;

  useEffect(() => {
    if (!done) return;
    const score = runs.reduce((s, x) => s + x.r.score, 0);
    const max = runs.reduce((s, x) => s + x.r.max, 0);
    setSave((s) => bumpStreak({ ...s, bosses: { ...s.bosses, [actNumber]: { at: Date.now(), score, max } } }));
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const head = (
    <header className="session-head">
      <div className="eyebrow">Chapter {act.numeral} · Boss level</div>
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
      <div className="play-main narrow">
        {head}
        <Scene beats={boss.intro} onBack={back} onDone={() => setI(0)} cta="Bring it on" />
      </div>
    );

  if (done) {
    const score = runs.reduce((s, x) => s + x.r.score, 0);
    const max = runs.reduce((s, x) => s + x.r.max, 0);
    return (
      <div className="play-main narrow">
        {head}
        <section className="finale">
          <div className="eyebrow">Boss defeated</div>
          <div className="finale-stars">
            <Stars n={starsFor(score, max)} />
          </div>
          <div className="big-number" style={{ margin: '8px 0 16px' }}>
            {score} <span className="muted" style={{ fontSize: 24 }}>/ {max}</span>
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
                  {x.r.calc ? (
                    STEPS.map((s) => (
                      <td key={s} style={{ textAlign: 'right' }}>
                        {x.r.calc!.results[s]?.score ?? '–'}
                      </td>
                    ))
                  ) : (
                    <td colSpan={STEPS.length} style={{ textAlign: 'right' }}>
                      {x.r.score} / {x.r.max}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="paper-card">
          <Bubble
            beat={{
              who: 'margaux',
              text: 'Homework. Do these from your problem set on paper, every step written out, just like you did here. They’re the real test.',
            }}
          />
          <ul>
            {boss.paper.map((p) => (
              <li key={p.ref}>
                <b>{p.ref}</b>
                <span>{p.note}</span>
              </li>
            ))}
          </ul>
        </section>
        <div className="scene-controls">
          <button type="button" className="btn ghost" onClick={() => go({ name: 'map' })}>
            Back to the map
          </button>
          <span />
          {!save.yearsClosed.includes(actNumber) && (actNumber === 1 || save.yearsClosed.includes(actNumber - 1)) ? (
            <button type="button" className="btn" onClick={() => go({ name: 'yearend', act: actNumber })}>
              Close year {actNumber} →
            </button>
          ) : (
            <span />
          )}
        </div>
      </div>
    );
  }

  const spec = boss.problems[i];
  const problem = PROBLEMS[spec.problem];
  return (
    <div className="play-main narrow">
      {head}
      <RoundRunner
        key={i}
        problem={problem}
        params={spec.params}
        mode={bossHelp(act.number)}
        seed={seed + i}
        intro={<div className="pop-quiz">Part ({String.fromCharCode(97 + i)}) of {boss.problems.length}</div>}
        onDone={(r) => {
          for (const [c, clean] of Object.entries(r.clean)) recordWork(c, clean, false);
          setRuns((x) => [...x, { title: problem.title, r }]);
          setI(i + 1);
          window.scrollTo({ top: 0 });
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------- exam room

/** Value added to the house the first time an exam room is finished, at full marks. */
const EXAM_BONUS_PER_QUESTION = 2000;

export function ExamPlayer({ actNumber }: { actNumber: number }) {
  const { save, setSave, go, back, recordWork, applyOutcome } = useGame();
  const act = ACTS[actNumber - 1];
  const exam = act.exam!;
  const first = !save.exams[actNumber];
  const [i, setI] = useState(-1);
  const [seed] = useState(newSeed);
  const [runs, setRuns] = useState<{ title: string; r: RoundResult }[]>([]);
  const done = i >= exam.problems.length;
  const score = runs.reduce((s, x) => s + x.r.score, 0);
  const max = runs.reduce((s, x) => s + x.r.max, 0);
  const bonus = Math.round((EXAM_BONUS_PER_QUESTION * exam.problems.length * score) / Math.max(1, max) / 100) * 100;

  useEffect(() => {
    if (!done) return;
    if (first && bonus > 0) applyOutcome({ valueDelta: bonus, news: `Chapter ${act.numeral} exam room: ${score} / ${max}.` });
    setSave((s) => bumpStreak({ ...s, exams: { ...s.exams, [actNumber]: { at: Date.now(), score, max } } }));
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const head = (
    <header className="session-head">
      <div className="eyebrow">Chapter {act.numeral} · Exam room</div>
      <h1>{act.title}: on paper</h1>
      <div className="progress-dots" aria-hidden>
        {exam.problems.map((_, k) => (
          <span key={k} className={k < i ? 'done' : k === i ? 'here' : ''} />
        ))}
      </div>
    </header>
  );

  if (i < 0)
    return (
      <div className="play-main narrow">
        {head}
        <section className="panel">
          <p style={{ marginTop: 0 }}>{exam.intro}</p>
          <p className="muted">
            {exam.problems.length} questions. Each one is marked like an exam script: timeline, method, inputs, answer and recommendation.
            {first && ` Finishing it the first time adds up to ${eur(EXAM_BONUS_PER_QUESTION * exam.problems.length)} to the house’s value, in proportion to your marks.`}
          </p>
          <div className="scene-controls">
            <button type="button" className="btn ghost" onClick={back}>
              ← Back
            </button>
            <span />
            <button type="button" className="btn" onClick={() => setI(0)} autoFocus>
              Turn over the paper
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
          <div className="eyebrow">Paper marked</div>
          <div className="finale-stars">
            <Stars n={starsFor(score, max)} />
          </div>
          <div className="big-number" style={{ margin: '8px 0 16px' }}>
            {score} <span className="muted" style={{ fontSize: 24 }}>/ {max}</span>
          </div>
          <table className="marks-table">
            <tbody>
              {runs.map((x, k) => (
                <tr key={k}>
                  <td>
                    Q{k + 1}. {x.title}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {x.r.score} / {x.r.max}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {first && bonus > 0 && <p className="outcome">House value {eurSigned(bonus)} for a well-argued paper.</p>}
          <div className="scene-controls">
            <span />
            <span />
            <button type="button" className="btn" onClick={() => go({ name: 'map' })}>
              Back to the map
            </button>
          </div>
        </section>
      </div>
    );

  const spec = exam.problems[i];
  const problem = PROBLEMS[spec.problem];
  return (
    <div className="play-main narrow">
      {head}
      <RoundRunner
        key={i}
        problem={problem}
        params={spec.params}
        mode="unguided"
        seed={seed + i}
        intro={<div className="pop-quiz">Question {i + 1} of {exam.problems.length}</div>}
        onDone={(r) => {
          for (const [c, clean] of Object.entries(r.clean)) recordWork(c, clean, false);
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
  const mode = helpFor(stage);
  const spot = stage === 'common';
  const c = CONCEPTS[concept];

  const again = () => {
    setResult(null);
    setSeed(newSeed());
    setRound((r) => r + 1);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="play-main narrow">
      <header className="session-head">
        <div className="eyebrow">Practice · {STAGE_LABEL[stage]}</div>
        <h1>{c.name}</h1>
        <p className="muted" style={{ marginTop: 8 }}>
          New numbers every round.{' '}
          <button type="button" className="link" onClick={() => openLesson(concept)}>
            Open the cheat card
          </button>
        </p>
      </header>
      {result ? (
        <section className="finale">
          <div className="finale-stars">
            <Stars n={starsFor(result.score, result.max)} />
          </div>
          <div className="big-number" style={{ margin: '8px 0' }}>
            {result.score} <span className="muted" style={{ fontSize: 24 }}>/ {result.max}</span>
          </div>
          {result.promo && <Promotion concept={concept} to={result.promo} />}
          <div className="scene-controls">
            <button type="button" className="btn ghost" onClick={() => go({ name: 'map' })}>
              Back to the map
            </button>
            <span />
            <button type="button" className="btn" onClick={again} autoFocus>
              Another round →
            </button>
          </div>
        </section>
      ) : (
        <RoundRunner
          key={round}
          problem={setup.p}
          params={setup.params}
          mode={mode}
          seed={seed}
          onDone={(r) => {
            const promo = recordWork(concept, r.clean[concept] ?? r.score === r.max, spot);
            setResult({ score: r.score, max: r.max, promo });
          }}
        />
      )}
    </div>
  );
}
