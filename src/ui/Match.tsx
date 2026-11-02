// Match and choose: label the options, then pick one to go ahead with. Any sound pick scores
// if the reason fits it; the pick's cash flows follow the house into later chapters.
import { useMemo, useState, type ReactNode } from 'react';
import { eur, eurSigned, fmt, parseNumber } from '../engine/format';
import { markMatch } from '../engine/grading';
import { holdingsOf } from '../engine/holdings';
import { mulberry32, shuffle } from '../engine/rng';
import type { MatchProblem } from '../engine/types';
import { Bubble, Chat } from './Chat';
import type { RoundResult } from './Rounds';
import { useGame } from './store';
import { Tex } from './Tex';

const LETTERS = 'ABCDEFG';

export function MatchRunner({ problem, params, seed, intro, onDone }: { problem: MatchProblem; params?: unknown; seed: number; intro?: ReactNode; onDone: (r: RoundResult) => void }) {
  const { save } = useGame();
  // Built once against the cash on arrival, so the numbers don't shift as the round plays.
  const [cash] = useState(save.cash);
  const inst = useMemo(() => problem.build(params ?? problem.base, { cash }), [problem, params, cash]);
  const reasons = useMemo(() => shuffle(mulberry32(seed), inst.reasons), [inst, seed]);
  const [typed, setTyped] = useState<Record<string, string>>({});
  const [matched, setMatched] = useState<Record<string, string | null>>({});
  const [chosen, setChosen] = useState<string | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [phase, setPhase] = useState<'label' | 'choose' | 'done'>('label');

  const parsed = Object.fromEntries(Object.entries(typed).map(([k, v]) => [k, parseNumber(v)]));
  const marks = markMatch(inst, parsed, matched, chosen, reason);
  const computeIds = inst.compute ? Object.keys(inst.compute.values) : [];
  const letter = (id: string) => LETTERS[inst.options.findIndex((o) => o.id === id)];
  const labelled = computeIds.every((id) => parsed[id] !== null && parsed[id] !== undefined) && inst.labels.every((l) => matched[l.id]);
  const pick = inst.options.find((o) => o.id === chosen);
  const short = pick ? pick.cost > cash : false;
  const shown = phase !== 'label';
  const labelScore = computeIds.filter((id) => marks.computeOk[id]).length + inst.labels.filter((l) => marks.labelOk[l.id]).length;

  const finish = () => {
    const o = pick!.outcome;
    onDone({
      score: marks.score,
      max: marks.max,
      clean: { [problem.concept]: marks.clean },
      outcome: o,
    });
  };

  return (
    <section aria-labelledby="match-title">
      {intro}
      <div className="game-title">
        <span className="game-kind">Match and choose</span>
        <h2 id="match-title">{problem.title}</h2>
      </div>
      <Chat beats={inst.prompt} host={problem.host} />
      <div className="ask-card">
        <span className="ask-tag">The question</span>
        {inst.ask}
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <h3 className="step-title">
          <span className="move-n">1</span> The options
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="match-table">
            <thead>
              <tr>
                <th />
                {inst.columns.map((c) => (
                  <th key={c.key}>{c.label}</th>
                ))}
                {inst.compute && <th className="compute-col">{inst.compute.label} (you work out)</th>}
              </tr>
            </thead>
            <tbody>
              {inst.options.map((o, i) => (
                <tr key={o.id} className={phase === 'done' && o.id === chosen ? 'picked' : ''}>
                  <th scope="row">
                    <span className="opt-letter">{LETTERS[i]}</span> {o.name}
                  </th>
                  {inst.columns.map((c) => (
                    <td key={c.key} className="num-tab">
                      {o.cells[c.key]}
                    </td>
                  ))}
                  {inst.compute && (
                    <td className="compute-col">
                      {computeIds.includes(o.id) ? (
                        <>
                          <input
                            className={`ws-input${shown ? (marks.computeOk[o.id] ? ' good' : ' bad') : ''}`}
                            inputMode="decimal"
                            aria-label={`${inst.compute.label}, option ${LETTERS[i]}`}
                            value={typed[o.id] ?? ''}
                            disabled={shown}
                            onChange={(e) =>
                              setTyped((t) => ({
                                ...t,
                                [o.id]: e.target.value,
                              }))
                            }
                          />
                          {shown && !marks.computeOk[o.id] && <div className="ws-should num-tab">{fmt(inst.compute.values[o.id], inst.compute.unit, 2)}</div>}
                        </>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {shown && inst.compute && (
          <p className="muted" style={{ fontSize: 13 }}>
            {inst.compute.explain}
          </p>
        )}

        <h3 className="step-title" style={{ marginTop: 22 }}>
          <span className="move-n">2</span> Match each label to an option
        </h3>
        <div className="match-labels">
          {inst.labels.map((l) => (
            <div key={l.id} className="match-label">
              <div className="match-text">
                {l.text}
                {shown && (
                  <div className={`check ${marks.labelOk[l.id] ? 'good' : 'bad'}`}>
                    {marks.labelOk[l.id] ? '✓ ' : `✕ It’s ${letter(l.answer)}. `}
                    {l.why}
                  </div>
                )}
              </div>
              <div className="pills" role="radiogroup" aria-label={l.text}>
                {inst.options.map((o, i) => {
                  const on = matched[l.id] === o.id;
                  const st = shown ? (o.id === l.answer ? 'right' : on ? 'wrong' : '') : '';
                  return (
                    <button
                      key={o.id}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      className={`pill ${on ? 'on' : ''} ${st}`}
                      disabled={shown}
                      onClick={() => setMatched((m) => ({ ...m, [l.id]: o.id }))}
                    >
                      {LETTERS[i]}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {phase === 'label' && (
          <div className="step-actions">
            <span className="spacer" />
            <button type="button" className="btn" disabled={!labelled} onClick={() => setPhase('choose')}>
              Check my labels
            </button>
          </div>
        )}
        {shown && (
          <Bubble
            beat={{
              who: 'margaux',
              mood: labelScore === computeIds.length + inst.labels.length ? 'happy' : 'neutral',
              text:
                labelScore === computeIds.length + inst.labels.length
                  ? 'All right. Now it’s your call: more than one of these is sound.'
                  : 'Read the corrections. Now pick one. More than one is sound; your reason has to fit the one you pick.',
            }}
          />
        )}
      </div>

      {shown && (
        <div className="panel" style={{ marginTop: 16 }}>
          <h3 className="step-title">
            <span className="move-n">3</span> Choose one and say why
          </h3>
          <div className="seg" role="radiogroup" aria-label="Choice">
            {inst.options.map((o, i) => (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={chosen === o.id}
                className={`choice${phase === 'done' && chosen === o.id ? (marks.choiceOk ? ' is-correct' : ' is-wrong') : ''}`}
                onClick={() => setChosen(o.id)}
                disabled={phase === 'done'}
              >
                <span className="dot" aria-hidden />
                <span className="body">
                  {LETTERS[i]}. {o.name}
                </span>
              </button>
            ))}
          </div>
          {short && phase === 'choose' && (
            <p className="muted" style={{ fontSize: 14 }}>
              This needs {eur(pick!.cost)} and the house has {eur(cash)}. You can still go ahead: Aoife will cover the gap at year end, at a penalty rate.
            </p>
          )}
          <p style={{ fontWeight: 550, marginTop: 18 }}>Because…</p>
          <div className="choices" role="radiogroup" aria-label="Reason">
            {reasons.map((r) => (
              <button
                key={r.id}
                type="button"
                role="radio"
                aria-checked={reason === r.id}
                className={`choice${phase === 'done' && reason === r.id ? (marks.choiceOk ? ' is-correct' : ' is-wrong') : ''}`}
                onClick={() => setReason(r.id)}
                disabled={phase === 'done'}
              >
                <span className="dot" aria-hidden />
                <span className="body">{r.text}</span>
              </button>
            ))}
          </div>

          {phase === 'done' && pick && (
            <>
              <Bubble
                beat={{
                  who: 'margaux',
                  mood: marks.choiceOk ? 'happy' : 'worried',
                  text: marks.choiceOk
                    ? 'A defensible call, argued the right way. Let’s see how it plays out.'
                    : inst.labels.some((l) => l.bad && l.answer === chosen)
                      ? 'That one loses money in today’s terms. No reason makes it a good call.'
                      : `That reason doesn’t fit ${pick.name.toLowerCase()}. ${inst.labels
                          .filter((l) => l.answer === chosen)
                          .map((l) => l.text)
                          .join('; ')}: argue from that.`,
                }}
              />
              <div className="consequence">
                <div>
                  <div className="eyebrow">House value</div>
                  <div className={`big-number delta ${pick.outcome.valueDelta >= 0 ? 'up' : 'down'}`}>{eurSigned(Math.round(pick.outcome.valueDelta))}</div>
                </div>
                <div>
                  <div className="eyebrow">Cash today</div>
                  <div className="big-number">{eurSigned(Math.round(pick.outcome.cashDelta ?? 0))}</div>
                </div>
                <div>
                  <div className="eyebrow">From now on</div>
                  {holdingsOf(pick.outcome).map((h) => (
                    <div key={h.id} className="muted" style={{ fontSize: 14 }}>
                      {h.label}: {eurSigned(Math.round(h.flows ? h.flows[0] : h.amount))} a year{h.years ? `, ${h.years} years` : ', for good'}
                      {h.spread ? ` (±${Math.round(h.spread * 100)}% luck)` : ''}
                    </div>
                  ))}
                </div>
              </div>
              <h3 className="eyebrow" style={{ marginTop: 22 }}>
                How Margaux works it
              </h3>
              <div className="working">
                {inst.working.map((w, i) => (
                  <div className="line" key={i}>
                    <Tex>{w}</Tex>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="step-actions">
            <span className="spacer" />
            {phase === 'done' && (
              <span className="points num-tab">
                ✦ {marks.score} / {marks.max}
              </span>
            )}
            {phase === 'choose' ? (
              <button type="button" className="btn" disabled={!chosen || !reason} onClick={() => setPhase('done')}>
                Go ahead
              </button>
            ) : (
              <button type="button" className="btn" autoFocus onClick={finish}>
                Continue →
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
