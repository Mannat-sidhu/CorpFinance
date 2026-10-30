// The five-step process mark: timeline, formula, inputs, answer, decision.
import { useMemo, useState, type ReactNode } from 'react';
import { CONCEPTS, METHODS } from '../content';
import { fmt, parseNumber } from '../engine/format';
import {
  STEPS,
  cleanRun,
  expectedValues,
  inputOk,
  markAnswer,
  markDecision,
  markFormula,
  markInputs,
  markTimeline,
  totals,
  type StepKey,
  type StepResult,
  type TimelineAnswer,
} from '../engine/grading';
import { mulberry32, shuffle } from '../engine/rng';
import type { CalcProblem, InputSpec, ProblemInstance, Unit } from '../engine/types';
import { useGame } from './store';
import { Tex } from './Tex';
import { TimelineInput, emptyTimeline } from './Timeline';

export type RunMode = 'full' | 'practising' | 'exam';

export interface RunResult {
  clean: boolean;
  score: number;
  max: number;
  decision: string;
  instance: ProblemInstance;
  results: Partial<Record<StepKey, StepResult>>;
}

const STEP_NAMES: Record<StepKey, string> = {
  timeline: 'Timeline',
  formula: 'Formula',
  inputs: 'Inputs',
  answer: 'Answer',
  decision: 'Decision',
};

const STEP_HELP: Record<StepKey, string> = {
  timeline: 'Place every cash flow on the period it lands in. Today is period 0.',
  formula: 'Choose the method from the formula sheet that values these cash flows.',
  inputs: 'Pull the numbers out of the story. Enter rates as percentages (6 for 6%).',
  answer: 'Work it out on your own calculator and type the result.',
  decision: 'Make the call, and pick the reason you would write on the exam script.',
};

const affix = (u: Unit) => (u === 'eur' ? { pre: '€' } : u === 'pct' ? { post: '%' } : u === 'years' ? { post: 'yrs' } : {});

function NumberField({
  id,
  label,
  unit,
  value,
  onChange,
  state,
  big,
  disabled,
}: {
  id: string;
  label: ReactNode;
  unit: Unit;
  value: string;
  onChange: (v: string) => void;
  state?: 'good' | 'bad';
  big?: boolean;
  disabled?: boolean;
}) {
  const a = affix(unit);
  return (
    <div className={`field${big ? ' answer-field' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <div className={`input-wrap${state ? ' ' + state : ''}`}>
        {a.pre && <span className="affix">{a.pre}</span>}
        <input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
        {a.post && <span className="affix">{a.post}</span>}
      </div>
    </div>
  );
}

function Choice({
  checked,
  onClick,
  children,
  state,
  disabled,
}: {
  checked: boolean;
  onClick: () => void;
  children: ReactNode;
  state?: 'correct' | 'wrong';
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      className={`choice${state ? ' is-' + state : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="dot" aria-hidden />
      <span className="body">{children}</span>
    </button>
  );
}

function Feedback({ r, children }: { r: StepResult; children: ReactNode }) {
  const kind = r.correct ? 'good' : r.score > 0 ? 'partial' : 'bad';
  const verdict = r.ecf
    ? 'Method mark: right working from your own inputs'
    : r.correct
      ? r.hinted
        ? 'Right, with a hint'
        : 'Right'
      : r.score > 0
        ? 'Partly right'
        : 'Not quite';
  return (
    <div className={`feedback ${kind}`} role="status">
      <div className="verdict">
        {verdict} · {r.score}/{r.max}
      </div>
      {children}
    </div>
  );
}

export function ProblemRunner({
  problem,
  params,
  mode,
  seed,
  onDone,
  intro,
  outcomeNote,
}: {
  problem: CalcProblem;
  params: unknown;
  mode: RunMode;
  seed: number;
  onDone: (r: RunResult) => void;
  intro?: ReactNode;
  /** Show the consequence for the house on the summary card. */
  outcomeNote?: boolean;
}) {
  const { openFormulas, openLesson } = useGame();
  const inst = useMemo(() => problem.build(params ?? problem.base), [problem, params]);
  const order = useMemo(() => {
    const rng = mulberry32(seed);
    return { formulas: shuffle(rng, inst.formula.options), why: shuffle(rng, inst.decision.why) };
  }, [inst, seed]);

  const autoSteps: StepKey[] = mode === 'practising' ? ['inputs', 'answer'] : [];
  const [stepIdx, setStepIdx] = useState(0);
  const [phase, setPhase] = useState<'answer' | 'feedback' | 'summary'>(autoSteps.includes(STEPS[0]) ? 'feedback' : 'answer');
  const [tl, setTl] = useState<TimelineAnswer>(emptyTimeline);
  const [formula, setFormula] = useState<string | null>(null);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [answer, setAnswer] = useState('');
  const [decision, setDecision] = useState<string | null>(null);
  const [why, setWhy] = useState<string | null>(null);
  const [hints, setHints] = useState<Partial<Record<StepKey, boolean>>>({});
  const [results, setResults] = useState<Partial<Record<StepKey, StepResult>>>({});
  const [ecfDetail, setEcfDetail] = useState<{ expected: number; own?: number } | null>(null);

  const step = STEPS[stepIdx];
  const isAuto = autoSteps.includes(step);
  const expectedAnswer = inst.solve(expectedValues(inst.inputs));
  const parsedInputs = Object.fromEntries(inst.inputs.map((s) => [s.key, parseNumber(inputs[s.key] ?? '')]));
  const hintsAllowed = mode !== 'exam';

  const canCheck = (() => {
    switch (step) {
      case 'timeline':
        return Object.values(tl.placed).some((v) => v.length > 0) && (!inst.timeline.valueAt || tl.valueAt !== null);
      case 'formula':
        return formula !== null;
      case 'inputs':
        return inst.inputs.every((s) => parsedInputs[s.key] !== null);
      case 'answer':
        return parseNumber(answer) !== null;
      case 'decision':
        return decision !== null && why !== null;
    }
  })();

  const check = () => {
    const h = !!hints[step];
    let r: StepResult;
    switch (step) {
      case 'timeline':
        r = markTimeline(inst.timeline, tl, h);
        break;
      case 'formula':
        r = markFormula(inst.formula.correct, formula, h);
        break;
      case 'inputs':
        r = markInputs(inst.inputs, parsedInputs, h);
        break;
      case 'answer': {
        const a = markAnswer(inst, parseNumber(answer), results.inputs?.auto ? null : parsedInputs, h);
        setEcfDetail({ expected: a.expected, own: a.ownExpected });
        r = a;
        break;
      }
      case 'decision':
        r = markDecision(inst.decision, decision, why, h);
        break;
    }
    setResults((prev) => ({ ...prev, [step]: r }));
    setPhase('feedback');
  };

  const next = () => {
    if (stepIdx === STEPS.length - 1) {
      setPhase('summary');
      return;
    }
    const n = stepIdx + 1;
    const nextStep = STEPS[n];
    setStepIdx(n);
    if (autoSteps.includes(nextStep)) {
      setResults((prev) => ({ ...prev, [nextStep]: { score: 0, max: 0, hinted: false, correct: true, auto: true } }));
      setPhase('feedback');
    } else setPhase('answer');
    requestAnimationFrame(() => document.getElementById('work-top')?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
  };

  const finish = () => {
    const t = totals(results);
    onDone({ clean: cleanRun(results), score: t.score, max: t.max, decision: decision!, instance: inst, results });
  };

  const r = results[step];
  const showFeedback = phase === 'feedback' && r;
  const tally = totals(results);

  // ---------------------------------------------------------------- summary
  if (phase === 'summary') {
    const outcome = inst.outcomes[decision!];
    return (
      <section className="panel" aria-labelledby="summary-title">
        <div className="eyebrow">Marked</div>
        <h2 id="summary-title" className="step-title" style={{ marginTop: 4 }}>
          {problem.title}
        </h2>
        <table className="marks-table">
          <tbody>
            {STEPS.map((s, i) => {
              const res = results[s]!;
              return (
                <tr key={s}>
                  <td>
                    {i + 1}. {STEP_NAMES[s]}
                    {res.auto && <span className="tagline">done by Margaux</span>}
                    {res.hinted && <span className="tagline">hint used</span>}
                    {res.ecf && <span className="tagline">error carried forward</span>}
                  </td>
                  <td>{res.auto ? '—' : `${res.score} / ${res.max}`}</td>
                </tr>
              );
            })}
            <tr className="total">
              <td>Total</td>
              <td>
                {tally.score} / {tally.max}
              </td>
            </tr>
          </tbody>
        </table>

        <h3 className="eyebrow" style={{ marginTop: 22 }}>
          Model working, as on an exam script
        </h3>
        <div className="working">
          {inst.working.map((line, i) => (
            <div className="line" key={i}>
              <Tex>{line}</Tex>
            </div>
          ))}
        </div>
        <p className="muted" style={{ fontSize: 14 }}>
          {inst.decision.explain}
        </p>

        {outcomeNote && outcome && <p className="outcome">{outcome.news}</p>}

        <div className="step-actions">
          <button type="button" className="link" onClick={() => openLesson(problem.concept)}>
            Revise: {CONCEPTS[problem.concept]?.name}
          </button>
          <span className="spacer" />
          <button type="button" className="btn" onClick={finish} autoFocus>
            Continue
          </button>
        </div>
      </section>
    );
  }

  // ---------------------------------------------------------------- steps
  return (
    <section aria-labelledby="problem-title">
      <div className="panel">
        <div className="eyebrow">{mode === 'practising' ? 'Practising · Margaux does the arithmetic' : mode === 'exam' ? 'Exam conditions' : 'Problem'}</div>
        <h2 id="problem-title" className="step-title" style={{ marginTop: 4 }}>
          {problem.title}
        </h2>
        {intro}
        <div className="prose">
          {inst.prompt.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        <p className="ask">{inst.ask}</p>
      </div>

      <nav className="stepper" aria-label="Steps" id="work-top">
        <ol>
          {STEPS.map((s, i) => {
            const res = results[s];
            const state = i < stepIdx || (i === stepIdx && phase === 'feedback') ? 'done' : i === stepIdx ? 'current' : '';
            return (
              <li key={s} className={i === stepIdx ? 'current' : state} aria-current={i === stepIdx ? 'step' : undefined}>
                <span className="n">{i + 1}</span>
                <span className="lbl">{STEP_NAMES[s]}</span>
                {res && !res.auto && <span className="mark">{res.score}</span>}
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="panel">
        <h3 className="step-title">
          {stepIdx + 1}. {STEP_NAMES[step]}
        </h3>
        <p className="step-help">{isAuto ? 'Margaux handles the routine arithmetic while you are practising. Check it follows.' : STEP_HELP[step]}</p>

        {step === 'timeline' && <TimelineInput spec={inst.timeline} value={tl} onChange={setTl} reveal={!!showFeedback} />}

        {step === 'formula' && (
          <>
            <div className="choices" role="radiogroup" aria-label="Formula">
              {order.formulas.map((id) => {
                const m = METHODS[id];
                const st = showFeedback ? (id === inst.formula.correct ? 'correct' : id === formula ? 'wrong' : undefined) : undefined;
                return (
                  <Choice key={id} checked={formula === id} onClick={() => setFormula(id)} state={st} disabled={!!showFeedback}>
                    <span className="name">
                      {m.name}
                      {m.sheet && <span className="sheet-badge">sheet ({m.sheet})</span>}
                    </span>
                    <Tex>{m.tex}</Tex>
                  </Choice>
                );
              })}
            </div>
            <div className="row" style={{ marginTop: 12 }}>
              <button type="button" className="link" onClick={() => openFormulas(true)}>
                Open the exam formula sheet
              </button>
            </div>
          </>
        )}

        {step === 'inputs' &&
          (isAuto ? (
            <AutoInputs specs={inst.inputs} />
          ) : (
            <div className="fields">
              {inst.inputs.map((s) => {
                const ok = showFeedback ? inputOk(s, parsedInputs[s.key]) : undefined;
                return (
                  <div key={s.key}>
                    <NumberField
                      id={`in-${s.key}`}
                      label={
                        <>
                          <Tex>{s.symbol}</Tex>
                          {s.label}
                        </>
                      }
                      unit={s.unit}
                      value={inputs[s.key] ?? ''}
                      onChange={(v) => setInputs((p) => ({ ...p, [s.key]: v }))}
                      state={ok === undefined ? undefined : ok ? 'good' : 'bad'}
                      disabled={!!showFeedback}
                    />
                    {showFeedback && (
                      <div className={`check ${ok ? 'good' : 'bad'}`}>
                        {ok ? '✓ ' : `✕ Should be ${fmt(s.expected, s.unit)}. `}
                        {!ok && s.explain}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

        {step === 'answer' &&
          (isAuto ? (
            <div>
              <div className="eyebrow">{inst.answer.label}</div>
              <div className="big-number" style={{ margin: '6px 0 12px' }}>
                {fmt(expectedAnswer, inst.answer.unit, 2)}
              </div>
              <p className="muted">{inst.answer.explain}</p>
            </div>
          ) : (
            <>
              {results.inputs && !results.inputs.correct && (
                <p className="muted" style={{ fontSize: 14 }}>
                  Your inputs were not all right. Work from your own inputs if you like: a correct calculation still earns this mark.
                </p>
              )}
              <NumberField
                id="answer"
                big
                label={inst.answer.label}
                unit={inst.answer.unit}
                value={answer}
                onChange={setAnswer}
                disabled={!!showFeedback}
                state={showFeedback ? (r!.correct || r!.ecf ? 'good' : 'bad') : undefined}
              />
            </>
          ))}

        {step === 'decision' && (
          <>
            <p className="muted" style={{ fontSize: 14 }}>
              {inst.answer.label}: <strong className="num-tab">{fmt(expectedAnswer, inst.answer.unit, 2)}</strong>
            </p>
            <p style={{ fontWeight: 550 }}>{inst.decision.question}</p>
            <div className="seg" role="radiogroup" aria-label="Decision">
              {inst.decision.options.map((o) => (
                <Choice
                  key={o.id}
                  checked={decision === o.id}
                  onClick={() => setDecision(o.id)}
                  disabled={!!showFeedback}
                  state={showFeedback ? (o.id === inst.decision.correct ? 'correct' : o.id === decision ? 'wrong' : undefined) : undefined}
                >
                  {o.label}
                </Choice>
              ))}
            </div>
            <p style={{ fontWeight: 550, marginTop: 18 }}>Because…</p>
            <div className="choices" role="radiogroup" aria-label="Justification">
              {order.why.map((o) => (
                <Choice
                  key={o.id}
                  checked={why === o.id}
                  onClick={() => setWhy(o.id)}
                  disabled={!!showFeedback}
                  state={showFeedback ? (o.id === inst.decision.correctWhy ? 'correct' : o.id === why ? 'wrong' : undefined) : undefined}
                >
                  {o.label}
                </Choice>
              ))}
            </div>
          </>
        )}

        {hints[step] && !showFeedback && <div className="hint-box">{inst.hints[step]}</div>}

        {showFeedback && !r!.auto && (
          <Feedback r={r!}>
            {step === 'timeline' && <p style={{ margin: 0 }}>{inst.timeline.explain}</p>}
            {step === 'formula' && (
              <p style={{ margin: 0 }}>
                <strong>{METHODS[inst.formula.correct].name}.</strong> {inst.formula.explain}
              </p>
            )}
            {step === 'inputs' && <p style={{ margin: 0 }}>Corrections are shown above. For the answer, work from your own inputs or the corrected ones: a right calculation earns the mark either way.</p>}
            {step === 'answer' && (
              <p style={{ margin: 0 }}>
                Correct answer: <strong>{fmt(ecfDetail?.expected ?? expectedAnswer, inst.answer.unit, 2)}</strong>. {inst.answer.explain}
                {r!.ecf && ecfDetail?.own !== undefined && <> From your inputs, {fmt(ecfDetail.own, inst.answer.unit, 2)} was the right result.</>}
              </p>
            )}
            {step === 'decision' && <p style={{ margin: 0 }}>{inst.decision.explain}</p>}
          </Feedback>
        )}

        <div className="step-actions">
          {phase === 'answer' && hintsAllowed && !hints[step] && (
            <button type="button" className="btn ghost small" onClick={() => setHints((h) => ({ ...h, [step]: true }))}>
              Hint (halves this step’s mark)
            </button>
          )}
          {step === 'formula' || step === 'inputs' ? null : (
            <button type="button" className="link" style={{ fontSize: 13 }} onClick={() => openFormulas(true)}>
              Formula sheet
            </button>
          )}
          <span className="spacer" />
          <span className="muted num-tab" style={{ fontSize: 13 }}>
            {tally.score} / {tally.max} so far
          </span>
          {phase === 'answer' ? (
            <button type="button" className="btn" onClick={check} disabled={!canCheck}>
              Check
            </button>
          ) : (
            <button type="button" className="btn" onClick={next} autoFocus>
              {stepIdx === STEPS.length - 1 ? 'See the marking' : 'Next step'}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function AutoInputs({ specs }: { specs: InputSpec[] }) {
  return (
    <table className="marks-table">
      <tbody>
        {specs.map((s) => (
          <tr key={s.key}>
            <td>
              <Tex>{s.symbol}</Tex> <span className="muted">{s.label}</span>
              <div className="muted" style={{ fontSize: 12.5 }}>
                {s.explain}
              </div>
            </td>
            <td className="num-tab">{fmt(s.expected, s.unit)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
