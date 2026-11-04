// The mock paper: four 25-mark questions, 120 minutes, no tips, marked only when handed in.
import { useEffect, useMemo, useRef, useState } from 'react';
import { PROBLEMS } from '../content';
import { buildPaper } from '../content/paper';
import { STEPS } from '../engine/grading';
import { PAPER_MARKS, PAPER_MINUTES, finishPaper, marksFor, stepTotals, type PartResult, type PaperRecord } from '../engine/paper';
import { newSeed } from '../engine/rng';
import { STEP_LABEL, type SlipStep } from '../engine/slips';
import { Bubble } from './Chat';
import { RoundRunner, type RoundResult } from './Rounds';
import { Stars, starsFor } from './Stars';
import { useGame } from './store';
import { Tex } from './Tex';

const STEP_NAME: Record<string, string> = { timeline: 'Timeline', formula: 'Method', inputs: 'Inputs', answer: 'Answer', decision: 'Recommendation' };
const letter = (i: number) => String.fromCharCode(97 + i);
const clock = (ms: number) => {
  const t = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(t / 3600)}:${String(Math.floor((t % 3600) / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
};
const pctOf = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

export function ExamPaper() {
  const { save, setSave, go, back, recordWork } = useGame();
  const attempt = save.paper;
  const [timed, setTimed] = useState(true);
  const [viewing, setViewing] = useState<PaperRecord | null>(null);
  const [now, setNow] = useState(Date.now());
  const [confirmEnd, setConfirmEnd] = useState(false);
  const ended = useRef(false);

  const plan = useMemo(() => (attempt ? buildPaper(attempt.seed) : []), [attempt?.seed]); // eslint-disable-line react-hooks/exhaustive-deps
  const flat = useMemo(() => plan.flatMap((q, qi) => q.parts.map((part, pi) => ({ qi, pi, part }))), [plan]);
  const idx = attempt?.parts.length ?? 0;
  const msLeft = attempt && attempt.timed ? attempt.startedAt + PAPER_MINUTES * 60_000 - now : Infinity;

  useEffect(() => {
    if (!attempt?.timed) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [attempt?.timed, attempt?.seed]);

  const end = () => {
    if (!attempt || ended.current) return;
    ended.current = true;
    const rec = finishPaper(attempt, plan, Date.now());
    setSave((s) => ({ ...s, paper: null, papers: [...s.papers, rec] }));
    setViewing(rec);
    setConfirmEnd(false);
    window.scrollTo({ top: 0 });
  };

  // The paper ends when the clock runs out or the last part is in.
  useEffect(() => {
    if (!attempt || viewing) return;
    if (msLeft <= 0 || (flat.length && idx >= flat.length)) end();
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const addPart = (res: PartResult) => setSave((s) => (s.paper ? { ...s, paper: { ...s.paper, parts: [...s.paper.parts, res] } } : s));

  // ---------------------------------------------------------------- report
  if (viewing) return <Report rec={viewing} previous={save.papers.filter((p) => p.at < viewing.at).slice(-1)[0]} onMap={() => go({ name: 'map' })} onNotebook={() => go({ name: 'notebook' })} onAgain={() => { ended.current = false; setViewing(null); }} />;

  // ---------------------------------------------------------------- briefing
  if (!attempt) {
    const best = save.papers.reduce((m, p) => Math.max(m, p.total), 0);
    return (
      <div className="play-main narrow">
        <header className="session-head">
          <div className="eyebrow">Mock exam</div>
          <h1>The paper</h1>
        </header>
        <section className="panel">
          <p style={{ marginTop: 0 }}>
            Four questions, 25 marks each, in {PAPER_MINUTES / 60} hours. Each question has parts (a), (b) and (c), on one topic. Show your working: the timeline, the method, the inputs, the answer and a recommendation.
          </p>
          <ul className="paper-rules">
            <li>No tips, no Margaux, and nothing is marked until you hand the paper in.</li>
            <li>Fresh numbers every time you sit it.</li>
            <li>You can leave a part blank (zero marks) and move on. You can’t come back to it.</li>
            <li>Don’t refresh the page mid-part: a half-finished part is lost. Finished parts and the clock are kept.</li>
            <li>Each paper draws four topics from the chapters in the game so far. The real paper may cover more.</li>
          </ul>
          <label className="paper-toggle">
            <input type="checkbox" checked={timed} onChange={(e) => setTimed(e.target.checked)} /> Against the clock ({PAPER_MINUTES} minutes). Untick to practise without time pressure.
          </label>
          <div className="scene-controls">
            <button type="button" className="btn ghost" onClick={back}>
              ← Back
            </button>
            <span />
            <button
              type="button"
              className="btn"
              autoFocus
              onClick={() => {
                ended.current = false;
                setNow(Date.now());
                setSave((s) => ({ ...s, paper: { seed: newSeed(), startedAt: Date.now(), timed, parts: [] } }));
              }}
            >
              Turn over the paper
            </button>
          </div>
        </section>
        {save.papers.length > 0 && (
          <section className="panel" style={{ marginTop: 16 }}>
            <h3 className="eyebrow" style={{ marginTop: 0 }}>
              Papers you’ve sat {best ? `· best ${best} / ${PAPER_MARKS}` : ''}
            </h3>
            <table className="marks-table">
              <tbody>
                {[...save.papers].reverse().map((p) => (
                  <tr key={p.at}>
                    <td>
                      {new Date(p.at).toLocaleDateString('en-IE', { day: 'numeric', month: 'short' })}
                      <span className="tagline">{p.timed ? `${p.minutesUsed} min` : 'untimed'}</span>
                    </td>
                    <td className="num-tab">{p.total} / {PAPER_MARKS}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button type="button" className="link" onClick={() => { ended.current = true; setViewing(p); }}>
                        Marked script
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------- sitting
  const cur = flat[idx];
  if (!cur) return null;
  const problem = PROBLEMS[cur.part.problem];
  const q = plan[cur.qi];
  const low = msLeft < 10 * 60_000;

  const complete = (r: RoundResult) => {
    for (const [c, clean] of Object.entries(r.clean)) recordWork(c, clean, false);
    addPart({
      q: cur.qi,
      p: cur.pi,
      title: problem.title,
      weight: cur.part.weight,
      score: r.score,
      max: r.max,
      marks: marksFor(r.score, r.max, cur.part.weight),
      steps: r.calc ? STEPS.map((k) => ({ step: k, score: r.calc!.results[k]?.score ?? 0, max: r.calc!.results[k]?.max ?? 0 })) : undefined,
      slips: r.slips ?? [],
      working: r.calc?.instance.working ?? [],
    });
    window.scrollTo({ top: 0 });
  };
  const leave = () => {
    addPart({ q: cur.qi, p: cur.pi, title: 'Left blank', weight: cur.part.weight, score: 0, max: 1, marks: 0, left: true, slips: [], working: [] });
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="play-main narrow">
      <header className="session-head paper-head">
        <div className="spread">
          <div className="eyebrow">
            Mock exam · Question {cur.qi + 1} of {plan.length} · part ({letter(cur.pi)})
          </div>
          {attempt.timed && <span className={`paper-clock num-tab${low ? ' low' : ''}`} aria-label="Time left">{clock(msLeft)}</span>}
        </div>
        <h1>
          Question {cur.qi + 1}: {q.title}
        </h1>
        <div className="progress-dots" aria-hidden>
          {flat.map((_, k) => (
            <span key={k} className={k < idx ? 'done' : k === idx ? 'here' : ''} />
          ))}
        </div>
      </header>
      <RoundRunner
        key={`${attempt.seed}-${idx}`}
        problem={problem}
        params={cur.part.params}
        mode="unguided"
        exam
        seed={attempt.seed + idx}
        intro={
          <div className="pop-quiz">
            ({letter(cur.pi)}) · {cur.part.weight} marks
          </div>
        }
        onDone={complete}
      />
      <div className="paper-foot">
        {confirmEnd ? (
          <>
            <span>End the paper now? Parts you haven’t sat score zero.</span>
            <button type="button" className="btn small" onClick={end}>
              Yes, hand it in
            </button>
            <button type="button" className="btn ghost small" onClick={() => setConfirmEnd(false)}>
              Keep going
            </button>
          </>
        ) : (
          <>
            <button type="button" className="link" onClick={leave}>
              Leave this part blank and move on
            </button>
            <button type="button" className="link" onClick={() => setConfirmEnd(true)}>
              Hand in the paper now
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- the marked paper

function Report({ rec, previous, onMap, onNotebook, onAgain }: { rec: PaperRecord; previous?: PaperRecord; onMap: () => void; onNotebook: () => void; onAgain: () => void }) {
  const plan = useMemo(() => buildPaper(rec.seed), [rec.seed]);
  const steps = stepTotals(rec.parts);
  const stepRows = STEPS.filter((s) => steps[s]?.max).map((s) => ({ s, ...steps[s], pct: pctOf(steps[s].score, steps[s].max) }));
  const weakest = [...stepRows].sort((a, b) => a.pct - b.pct)[0];
  const diff = previous ? rec.total - previous.total : null;
  const pct = pctOf(rec.total, PAPER_MARKS);

  return (
    <div className="play-main narrow">
      <header className="session-head">
        <div className="eyebrow">Mock exam · marked</div>
        <h1>Your paper</h1>
      </header>
      <section className="finale">
        <div className="finale-stars">
          <Stars n={starsFor(rec.total, PAPER_MARKS)} />
        </div>
        <div className="big-number">
          {rec.total} <span className="muted" style={{ fontSize: 24 }}>/ {PAPER_MARKS}</span> <span className="muted" style={{ fontSize: 20 }}>· {pct}%</span>
        </div>
        <p className="muted" style={{ marginTop: 6 }}>
          {rec.timed ? `${rec.minutesUsed} of ${PAPER_MINUTES} minutes` : 'Untimed'}
          {diff !== null && ` · ${diff >= 0 ? '+' : '−'}${Math.abs(diff)} on your last paper`}
        </p>

        <table className="marks-table">
          <tbody>
            {plan.map((q, qi) => (
              <tr key={qi}>
                <td>
                  Q{qi + 1}. {q.title}
                </td>
                <td className="num-tab" style={{ textAlign: 'right' }}>
                  {rec.byQuestion[qi]} / 25
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3 className="eyebrow" style={{ marginTop: 26 }}>
          Marks by move
        </h3>
        <div className="pattern-bars">
          {stepRows.map((r) => (
            <div key={r.s} className="pattern-row">
              <span>{STEP_NAME[r.s]}</span>
              <span className="pattern-bar" aria-hidden>
                <span style={{ width: `${r.pct}%` }} />
              </span>
              <span className="num-tab muted">{r.pct}%</span>
            </div>
          ))}
        </div>
        {weakest && weakest.pct < 100 && (
          <Bubble
            beat={{
              who: 'margaux',
              mood: weakest.pct >= 80 ? 'happy' : 'neutral',
              text: `Your weakest move was “${STEP_NAME[weakest.s]}”: ${weakest.pct}% of the marks. ${
                { timeline: 'Draw it before you calculate.', formula: 'Ask what shape the cash flows have before choosing a formula.', inputs: 'Underline each number as you use it, and check whether a rate is quoted or effective.', answer: 'Keep the unrounded figure until the end.', decision: 'Finish the sentence “the answer means…”.' }[weakest.s]
              }`,
            }}
          />
        )}
        {rec.parts.some((p) => p.left) && (
          <p className="muted" style={{ fontSize: 14 }}>
            {rec.parts.filter((p) => p.left).length} part(s) were left blank. A part with a sound method and a slip in the arithmetic still earns most of its marks, so it’s worth writing something down.
          </p>
        )}

        <h3 className="eyebrow" style={{ marginTop: 26 }}>
          Marked scripts
        </h3>
        {plan.map((q, qi) => (
          <div key={qi} className="paper-q">
            <div className="paper-q-title">
              Question {qi + 1}: {q.title} <span className="muted num-tab">{rec.byQuestion[qi]} / 25</span>
            </div>
            {rec.parts
              .filter((p) => p.q === qi)
              .map((p) => (
                <details key={p.p} className="paper-part">
                  <summary>
                    ({letter(p.p)}) {p.title}
                    <span className="num-tab muted">
                      {p.marks} / {p.weight}
                    </span>
                  </summary>
                  {p.steps && (
                    <table className="marks-table">
                      <tbody>
                        {p.steps.map((s) => (
                          <tr key={s.step}>
                            <td>{STEP_NAME[s.step]}</td>
                            <td className="num-tab" style={{ textAlign: 'right' }}>
                              {s.score} / {s.max}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  {p.slips.length > 0 && (
                    <ul className="slip-list">
                      {p.slips.map((s, i) => (
                        <li key={i}>
                          <div className="slip-head">
                            <span className="tagline">{STEP_LABEL[s.step as SlipStep]}</span>
                          </div>
                          <div>{s.what}</div>
                          <div className="slip-fix">{s.fix}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                  {p.working.length > 0 && (
                    <>
                      <div className="eyebrow" style={{ marginTop: 12 }}>
                        Model working
                      </div>
                      <div className="working">
                        {p.working.map((w, i) => (
                          <div className="line" key={i}>
                            <Tex>{w}</Tex>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  {p.left && <p className="muted">Left blank.</p>}
                </details>
              ))}
          </div>
        ))}
        <p className="muted" style={{ fontSize: 13 }}>
          Every slip above is also in your notebook, with a drill.
        </p>

        <div className="scene-controls">
          <button type="button" className="btn ghost" onClick={onMap}>
            Back to the map
          </button>
          <span className="row">
            <button type="button" className="btn ghost" onClick={onNotebook}>
              Open my notebook
            </button>
            <button type="button" className="btn" onClick={onAgain} autoFocus>
              Sit another paper
            </button>
          </span>
        </div>
      </section>
    </div>
  );
}

