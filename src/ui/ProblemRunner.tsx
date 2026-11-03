// The five-step process mark: timeline, formula, inputs, answer, decision.
import { useMemo, useState, type ReactNode } from 'react';
import { CONCEPTS, METHODS, methodsOf, methodsUpTo } from '../content';
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
import type { Help } from '../engine/mastery';
import type { NewSlip } from '../engine/slips';
import { mulberry32, shuffle } from '../engine/rng';
import type { CalcProblem, ProblemInstance, Unit } from '../engine/types';
import { Bubble, Chat } from './Chat';
import { Stars, starsFor } from './Stars';
import { useGame } from './store';
import { Tex } from './Tex';
import { TimelineInput, emptyTimeline } from './Timeline';

export type RunMode = Help;

export interface RunResult {
  clean: boolean;
  score: number;
  max: number;
  decision: string;
  instance: ProblemInstance;
  results: Partial<Record<StepKey, StepResult>>;
  /** Marks lost, for the notebook. */
  slips: NewSlip[];
}

const STEP_NAMES: Record<StepKey, string> = {
  timeline: 'Map the cash',
  formula: 'Pick a formula',
  inputs: 'Plug in',
  answer: 'Crunch it',
  decision: 'Make the call',
};

/** Unguided rounds use exam-script headings, not game moves. */
const PLAIN_NAMES: Record<StepKey, string> = {
  timeline: 'Timeline',
  formula: 'Method',
  inputs: 'Inputs',
  answer: 'Answer',
  decision: 'Recommendation',
};

const STEP_HELP: Record<StepKey, string> = {
  timeline: 'Where does each payment land? Today is 0. Tap a period to drop the payment there.',
  formula: 'Which tool values this? Peek at the formula sheet if you need it.',
  inputs: 'Fish the numbers out of the conversation. Rates as percentages: 6 for 6%.',
  answer: 'Grab your calculator. Type what you get.',
  decision: 'Your call, and the reason you’d give the board.',
};

const PRAISE = ['Spot on.', 'Lovely.', 'Exactly right.', 'Nailed it.', 'That’s the one.'];
const NUDGE = ['Close. Here’s the fix.', 'Not quite. Look at this.', 'Ah, careful.', 'Nearly. One thing.'];

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

function Pips({ score, max }: { score: number; max: number }) {
  return (
    <span className="pips" aria-label={`${score} of ${max} points`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={score >= i + 1 ? 'on' : score > i ? 'half' : ''} />
      ))}
    </span>
  );
}

function Feedback({ r, seed, children }: { r: StepResult; seed: number; children: ReactNode }) {
  const kind = r.correct || r.ecf ? 'good' : r.score > 0 ? 'partial' : 'bad';
  const line = r.ecf
    ? 'Wrong inputs, but your maths from them is right. Method points, earned.'
    : r.correct
      ? PRAISE[seed % PRAISE.length] + (r.hinted ? ' With a little help.' : '')
      : NUDGE[seed % NUDGE.length];
  return (
    <div className={`reaction ${kind}`} role="status">
      <Bubble beat={{ who: 'margaux', mood: kind === 'good' ? 'happy' : kind === 'bad' ? 'worried' : 'neutral', text: line }}>
        <div className="reaction-body">{children}</div>
        <div className="reaction-points">
          <Pips score={r.score} max={r.max} /> +{r.score} points
        </div>
      </Bubble>
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
    return { formulas: shuffle(rng, formulaChoices(problem, inst, mode)), why: shuffle(rng, inst.decision.why) };
  }, [problem, inst, mode, seed]);

  const unguided = mode === 'unguided';
  const [stepIdx, setStepIdx] = useState(0);
  const [phase, setPhase] = useState<'answer' | 'feedback' | 'summary'>('answer');
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
  const expectedAnswer = inst.solve(expectedValues(inst.inputs));
  const parsedInputs = Object.fromEntries(inst.inputs.map((s) => [s.key, parseNumber(inputs[s.key] ?? '')]));
  // Guided: a tip on every move. Prompted: one tip for the whole problem. Unguided: none.
  const tipAvailable = mode === 'guided' ? !hints[step] : mode === 'prompted' ? !Object.values(hints).some(Boolean) : false;

  const ready = (k: StepKey) => {
    switch (k) {
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
  };

  const mark = (k: StepKey): StepResult => {
    const h = !!hints[k];
    switch (k) {
      case 'timeline':
        return markTimeline(inst.timeline, tl, h);
      case 'formula':
        return markFormula(inst.formula.correct, formula, h, accepted(inst));
      case 'inputs':
        return markInputs(inst.inputs, parsedInputs, h);
      case 'answer': {
        const a = markAnswer(inst, parseNumber(answer), parsedInputs, h);
        setEcfDetail({ expected: a.expected, own: a.ownExpected });
        return a;
      }
      case 'decision':
        return markDecision(inst.decision, decision, why, h);
    }
  };

  const check = () => {
    setResults((prev) => ({ ...prev, [step]: mark(step) }));
    setPhase('feedback');
  };

  /** Unguided: everything is handed in at once and marked at the end, as on paper. */
  const handIn = () => {
    setResults(Object.fromEntries(STEPS.map((k) => [k, mark(k)])));
    setPhase('summary');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const next = () => {
    if (stepIdx === STEPS.length - 1) {
      setPhase('summary');
      return;
    }
    setStepIdx(stepIdx + 1);
    setPhase('answer');
    requestAnimationFrame(() => document.getElementById('work-top')?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
  };

  const slips = (): NewSlip[] => {
    const base = { concept: problem.concept, problem: problem.id, title: problem.title };
    const out: NewSlip[] = [];
    const lost = (k: StepKey) => !!results[k] && !results[k]!.correct && !results[k]!.ecf;
    if (lost('timeline')) out.push({ ...base, step: 'timeline', what: 'The cash flows weren’t placed on the right dates', fix: inst.timeline.explain });
    if (lost('formula'))
      out.push({
        ...base,
        step: 'formula',
        what: `Chose “${formula ? METHODS[formula]?.name : 'nothing'}” where “${METHODS[inst.formula.correct].name}” was needed`,
        fix: inst.formula.explain,
      });
    if (lost('inputs'))
      for (const s of inst.inputs.filter((x) => !inputOk(x, parsedInputs[x.key])).slice(0, 3))
        out.push({ ...base, step: 'inputs', what: `${s.label}: should be ${fmt(s.expected, s.unit)}`, fix: s.explain });
    if (lost('answer')) out.push({ ...base, step: 'answer', what: `Answer should be ${fmt(expectedAnswer, inst.answer.unit, 2)}`, fix: inst.answer.explain });
    if (lost('decision')) out.push({ ...base, step: 'decision', what: 'The call, or the reason for it, didn’t follow from the numbers', fix: inst.decision.explain });
    return out;
  };

  const finish = () => {
    const t = totals(results);
    onDone({ clean: cleanRun(results), score: t.score, max: t.max, decision: decision!, instance: inst, results, slips: slips() });
  };

  const r = results[step];
  const showFeedback = phase === 'feedback' && r;
  const tally = totals(results);

  /** What the marker says about each move, shown after the fact in an unguided round. */
  const note = (k: StepKey): ReactNode => {
    switch (k) {
      case 'timeline':
        return inst.timeline.explain;
      case 'formula':
        return (
          <>
            <strong>{METHODS[inst.formula.correct].name}.</strong> {inst.formula.explain}
          </>
        );
      case 'inputs':
        return inst.inputs
          .filter((s) => !inputOk(s, parsedInputs[s.key]))
          .map((s) => (
            <span key={s.key} style={{ display: 'block' }}>
              <Tex>{s.symbol}</Tex> should be {fmt(s.expected, s.unit)}. {s.explain}
            </span>
          ));
      case 'answer':
        return (
          <>
            Correct answer: <strong>{fmt(ecfDetail?.expected ?? expectedAnswer, inst.answer.unit, 2)}</strong>. {inst.answer.explain}
            {results.answer?.ecf && ecfDetail?.own !== undefined && <> From your inputs, {fmt(ecfDetail.own, inst.answer.unit, 2)} was right: method points.</>}
          </>
        );
      case 'decision':
        return inst.decision.explain;
    }
  };

  // ---------------------------------------------------------------- summary
  if (phase === 'summary') {
    const outcome = inst.outcomes[decision!];
    return (
      <section className="panel" aria-labelledby="summary-title">
        <div className="spread">
          <div>
            <div className="eyebrow">{unguided ? 'Marked script' : 'Round over'}</div>
            <h2 id="summary-title" className="step-title" style={{ marginTop: 4 }}>
              {problem.title}
            </h2>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Stars n={starsFor(tally.score, tally.max)} />
            <div className="points num-tab">
              ✦ {tally.score} / {tally.max}
            </div>
          </div>
        </div>
        <table className="marks-table">
          <tbody>
            {STEPS.map((s, i) => {
              const res = results[s]!;
              const ok = res.correct || res.ecf;
              return (
                <tr key={s}>
                  <td>
                    {i + 1}. {unguided ? PLAIN_NAMES[s] : STEP_NAMES[s]}
                    {res.hinted && <span className="tagline">used a tip</span>}
                    {res.ecf && <span className="tagline">method points</span>}
                    {unguided && !ok && <div className="marker-note">{note(s)}</div>}
                  </td>
                  <td>
                    <Pips score={res.score} max={res.max} />
                  </td>
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
          How Margaux writes it up
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
            Cheat card: {CONCEPTS[problem.concept]?.name}
          </button>
          <span className="spacer" />
          <button type="button" className="btn" onClick={finish} autoFocus>
            Continue
          </button>
        </div>
      </section>
    );
  }

  // ---------------------------------------------------------------- one move's inputs
  const body = (k: StepKey, reveal: boolean) => (
    <>
      {k === 'timeline' && <TimelineInput spec={inst.timeline} value={tl} onChange={setTl} reveal={reveal} />}

      {k === 'formula' && (
        <>
          <div className={`choices${mode === 'guided' ? '' : ' compact'}`} role="radiogroup" aria-label="Formula">
            {order.formulas.map((id) => {
              const m = METHODS[id];
              const st = reveal ? (id === inst.formula.correct || accepted(inst).includes(id) ? 'correct' : id === formula ? 'wrong' : undefined) : undefined;
              return (
                <Choice key={id} checked={formula === id} onClick={() => setFormula(id)} state={st} disabled={reveal}>
                  <span className="name">
                    {m.name}
                    {mode === 'guided' && m.sheet && <span className="sheet-badge">sheet ({m.sheet})</span>}
                  </span>
                  {mode === 'guided' && <Tex>{m.tex}</Tex>}
                </Choice>
              );
            })}
          </div>
          {!unguided && (
            <div className="row" style={{ marginTop: 12 }}>
              <button type="button" className="link" onClick={() => openFormulas(true)}>
                Peek at the formula sheet
              </button>
            </div>
          )}
        </>
      )}

      {k === 'inputs' && (
        <div className="fields">
          {inst.inputs.map((s) => {
            const ok = reveal ? inputOk(s, parsedInputs[s.key]) : undefined;
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
                  disabled={reveal}
                />
                {reveal && (
                  <div className={`check ${ok ? 'good' : 'bad'}`}>
                    {ok ? '✓ ' : `✕ Should be ${fmt(s.expected, s.unit)}. `}
                    {!ok && s.explain}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {k === 'answer' && (
        <>
          {!unguided && results.inputs && !results.inputs.correct && (
            <p className="muted" style={{ fontSize: 14 }}>
              Some inputs were off. Use yours or the corrected ones: right maths from either earns the points.
            </p>
          )}
          {inst.tryRate && !reveal && <TryRate spec={unguided ? { ...inst.tryRate, nudge: false } : inst.tryRate} />}
          <NumberField
            id="answer"
            big
            label={inst.answer.label}
            unit={inst.answer.unit}
            value={answer}
            onChange={setAnswer}
            disabled={reveal}
            state={reveal ? (r!.correct || r!.ecf ? 'good' : 'bad') : undefined}
          />
        </>
      )}

      {k === 'decision' && (
        <>
          {!unguided && (
            <p className="muted" style={{ fontSize: 14 }}>
              {inst.answer.label}: <strong className="num-tab">{fmt(expectedAnswer, inst.answer.unit, 2)}</strong>
            </p>
          )}
          <p style={{ fontWeight: 550 }}>{inst.decision.question}</p>
          <div className="seg" role="radiogroup" aria-label="Decision">
            {inst.decision.options.map((o) => (
              <Choice
                key={o.id}
                checked={decision === o.id}
                onClick={() => setDecision(o.id)}
                disabled={reveal}
                state={reveal ? (o.id === inst.decision.correct ? 'correct' : o.id === decision ? 'wrong' : undefined) : undefined}
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
                disabled={reveal}
                state={reveal ? (o.id === inst.decision.correctWhy ? 'correct' : o.id === why ? 'wrong' : undefined) : undefined}
              >
                {o.label}
              </Choice>
            ))}
          </div>
        </>
      )}
    </>
  );

  const head = (
    <>
      {intro}
      <div className="game-title">
        <span className="game-kind">{unguided ? 'On your own · show your working' : mode === 'prompted' ? 'Your move · one tip only' : 'Your move'}</span>
        <h2 id="problem-title">{problem.title}</h2>
      </div>
      <Chat beats={inst.prompt} host={problem.host} />
      <div className="ask-card">
        <span className="ask-tag">The question</span>
        {inst.ask}
      </div>
    </>
  );

  // ---------------------------------------------------------------- unguided: one page, handed in at once
  if (unguided) {
    const done = STEPS.filter(ready).length;
    return (
      <section aria-labelledby="problem-title">
        {head}
        <div className="panel script" id="work-top">
          <p className="step-help">No tips and no ticks until you hand it in. Write it the way you would on paper.</p>
          {STEPS.map((k, i) => (
            <div className="script-part" key={k}>
              <h3 className="step-title">
                <span className="move-n">{i + 1}</span> {PLAIN_NAMES[k]}
              </h3>
              {body(k, false)}
            </div>
          ))}
          <div className="step-actions">
            <span className="muted" style={{ fontSize: 13 }}>
              {done} of {STEPS.length} parts filled
            </span>
            <span className="spacer" />
            <button type="button" className="btn" onClick={handIn} disabled={done < STEPS.length}>
              Hand it in
            </button>
          </div>
        </div>
      </section>
    );
  }

  // ---------------------------------------------------------------- guided and prompted: move by move
  return (
    <section aria-labelledby="problem-title">
      {head}

      <nav className="stepper" aria-label="Steps" id="work-top">
        <ol>
          {STEPS.map((s, i) => {
            const res = results[s];
            const state = i < stepIdx || (i === stepIdx && phase === 'feedback') ? 'done' : i === stepIdx ? 'current' : '';
            return (
              <li key={s} className={i === stepIdx ? 'current' : state} aria-current={i === stepIdx ? 'step' : undefined}>
                <span className="n">{res && (res.correct || res.ecf) ? '✓' : i + 1}</span>
                <span className="lbl">{STEP_NAMES[s]}</span>
                {res && <Pips score={res.score} max={res.max} />}
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="panel">
        <h3 className="step-title">
          <span className="move-n">Move {stepIdx + 1}</span> {STEP_NAMES[step]}
        </h3>
        {mode === 'guided' && <p className="step-help">{STEP_HELP[step]}</p>}

        {body(step, !!showFeedback)}

        {hints[step] && !showFeedback && (
          <div className="hint-wrap">
            <Bubble beat={{ who: 'margaux', text: `Psst. ${inst.hints[step]}` }} />
          </div>
        )}

        {showFeedback && (
          <Feedback r={r!} seed={seed + stepIdx}>
            {step === 'inputs' ? (
              <p style={{ margin: 0 }}>Corrections are above. For the next move, use your numbers or mine: right maths from either earns the points.</p>
            ) : (
              <p style={{ margin: 0 }}>{note(step)}</p>
            )}
          </Feedback>
        )}

        <div className="step-actions">
          {phase === 'answer' && tipAvailable && (
            <button type="button" className="btn ghost small" onClick={() => setHints((h) => ({ ...h, [step]: true }))}>
              {mode === 'prompted' ? 'Use your one tip (halves these points)' : 'Ask Margaux for a tip (halves these points)'}
            </button>
          )}
          <span className="spacer" />
          <span className="points num-tab">✦ {tally.score}</span>
          {phase === 'answer' ? (
            <button type="button" className="btn" onClick={check} disabled={!ready(step)}>
              Check
            </button>
          ) : (
            <button type="button" className="btn" onClick={next} autoFocus>
              {stepIdx === STEPS.length - 1 ? 'See how I did' : 'Next move →'}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

/** Finite streams can always be valued by discounting each payment, so that is never marked wrong. */
const FINITE_PV = ['pv-single', 'annuity', 'annuity-due', 'growing-annuity', 'bond', 'bond-semi'];
const accepted = (inst: ProblemInstance) => [
  ...(inst.formula.accept ?? []),
  ...(FINITE_PV.includes(inst.formula.correct) && !inst.timeline.streams.some((st) => st.forever) ? ['npv-sum'] : []),
];

/**
 * Formula choices fade with help. Guided: the problem's own shortlist, with the maths.
 * Prompted: widened to everything from this chapter (up to 8). Unguided: everything taught so far.
 */
function formulaChoices(problem: CalcProblem, inst: ProblemInstance, mode: RunMode): string[] {
  const own = inst.formula.options;
  if (mode === 'guided') return own;
  const act = CONCEPTS[problem.concept].act;
  if (mode === 'unguided') return [...new Set([...methodsUpTo(act), inst.formula.correct])];
  const extra = methodsOf(act).filter((id) => !own.includes(id));
  return [...own, ...extra].slice(0, Math.max(8, own.length));
}

/** Trial and error, as on a calculator: try a rate, see the value, close in on the target. */
function TryRate({ spec }: { spec: NonNullable<ProblemInstance['tryRate']> }) {
  const [raw, setRaw] = useState('');
  const [tries, setTries] = useState<{ rate: number; value: number }[]>([]);
  const go = () => {
    const r = parseNumber(raw);
    if (r === null) return;
    setTries((t) => [{ rate: r, value: spec.value(r) }, ...t].slice(0, 6));
    setRaw('');
  };
  return (
    <div className="try-rate">
      <div className="try-head">
        <strong>Try a rate</strong>
        <span className="muted">
          Target: {spec.targetLabel} = {fmt(spec.target, spec.unit, 2)}. Guess a rate, see what {spec.valueLabel.toLowerCase()} it gives, adjust.
        </span>
      </div>
      <div className="row">
        <div className="input-wrap" style={{ maxWidth: 160 }}>
          <input
            aria-label="Rate to try, in percent"
            inputMode="decimal"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && go()}
            placeholder="e.g. 6"
          />
          <span className="affix">%</span>
        </div>
        <button type="button" className="btn ghost small" onClick={go}>
          Try it
        </button>
      </div>
      {tries.length > 0 && (
        <table className="marks-table try-table">
          <tbody>
            {tries.map((t, i) => {
              const diff = t.value - spec.target;
              const close = Math.abs(diff) <= Math.abs(spec.target) * 0.0005;
              return (
                <tr key={i}>
                  <td>At {fmt(t.rate, 'pct', 2)}</td>
                  <td className="num-tab">
                    {spec.valueLabel} {fmt(t.value, spec.unit, 2)}{' '}
                    {spec.nudge !== false && (
                      <span className={`tag-${close ? 'good' : 'off'}`}>{close ? 'bang on' : diff > 0 ? 'too high: try a higher rate' : 'too low: try a lower rate'}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
