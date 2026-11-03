// The cash-flow worksheet: build a project's cash flows year by year, then its NPV and the call.
import { useMemo, useState, type ReactNode } from 'react';
import * as fin from '../engine/finance';
import { parseNumber } from '../engine/format';
import { markWorksheet } from '../engine/grading';
import type { Help } from '../engine/mastery';
import type { NewSlip } from '../engine/slips';
import { mulberry32, shuffle } from '../engine/rng';
import type { ConceptId, WorksheetProblem } from '../engine/types';
import { Bubble, Chat } from './Chat';
import type { RoundResult } from './Rounds';
import { Tex } from './Tex';

const show = (n: number) => {
  const r = Math.round(n * 1000) / 1000;
  return (Object.is(r, -0) ? 0 : r).toLocaleString('en-GB', { maximumFractionDigits: 3 }).replace('-', '−');
};

export function WorksheetRunner({
  problem,
  params,
  seed,
  help = 'guided',
  intro,
  onDone,
}: {
  problem: WorksheetProblem;
  params?: unknown;
  seed: number;
  help?: Help;
  intro?: ReactNode;
  onDone: (r: RoundResult) => void;
}) {
  const inst = useMemo(() => problem.build(params ?? problem.base), [problem, params]);
  const years = Array.from({ length: inst.years + 1 }, (_, i) => i);
  const fillRows = inst.rows.filter((r) => !r.given);
  const [typed, setTyped] = useState<Record<string, string[]>>({});
  const [hinted, setHinted] = useState<Record<string, boolean>>({});
  const [phase, setPhase] = useState<'sheet' | 'npv' | 'done'>('sheet');
  const [npv, setNpv] = useState('');
  const [choice, setChoice] = useState<string | null>(null);
  const [why, setWhy] = useState<string | null>(null);
  const whyOrder = useMemo(() => shuffle(mulberry32(seed), inst.decision.why), [inst, seed]);

  const parsed = Object.fromEntries(Object.entries(typed).map(([k, v]) => [k, v.map((x) => parseNumber(x ?? ''))]));
  const marks = useMemo(() => markWorksheet(inst.rows, inst.years, parsed as Record<string, (number | null)[]>), [typed]); // eslint-disable-line react-hooks/exhaustive-deps
  const checked = phase !== 'sheet';
  // Guided: a tip on every row. Prompted: one tip for the sheet. Unguided: none.
  const tipsLeft = help === 'guided' || (help === 'prompted' && !Object.values(hinted).some(Boolean));
  const cellsOf = (key: string) => inst.rows.find((r) => r.key === key)!.cells ?? years;
  const complete = fillRows.every((r) => cellsOf(r.key).every((y) => parseNumber(typed[r.key]?.[y] ?? '') !== null));

  const rowPoints = (key: string) => (marks.result[key]?.rowOk ? (hinted[key] ? 0.5 : 1) : 0);
  const sheetScore = fillRows.reduce((s, r) => s + rowPoints(r.key), 0);

  const trueNpv = fin.npv(inst.rate / 100, marks.truth[inst.netRow]);
  const ownNpv = fin.npv(inst.rate / 100, marks.own[inst.netRow]);
  const npvGiven = parseNumber(npv);
  const close = (a: number, b: number) => Math.abs(a - b) <= Math.max(0.0051, Math.abs(b) * 0.005);
  const npvOk = npvGiven !== null && close(npvGiven, trueNpv);
  const npvEcf = !npvOk && npvGiven !== null && close(npvGiven, ownNpv);
  const npvPoints = npvOk || npvEcf ? 2 : 0;
  const decPoints = (choice === inst.decision.correct ? 1 : 0) + (why === inst.decision.correctWhy ? 1 : 0);
  const max = fillRows.length + 4;
  const total = sheetScore + (phase === 'done' ? npvPoints + decPoints : 0);

  const finish = () => {
    const clean: Record<ConceptId, boolean> = {};
    for (const r of fillRows) {
      const c = r.concept ?? problem.concept;
      clean[c] = (clean[c] ?? true) && !!marks.result[r.key]?.rowOk && !hinted[r.key];
    }
    clean[problem.concept] = (clean[problem.concept] ?? true) && npvOk && decPoints === 2;
    const slips: NewSlip[] = fillRows
      .filter((r) => !marks.result[r.key]?.rowOk)
      .slice(0, 4)
      .map((r) => ({ concept: r.concept ?? problem.concept, problem: problem.id, title: problem.title, step: 'row' as const, what: `${r.label} row was wrong`, fix: r.explain }));
    if (!npvOk && !npvEcf) slips.push({ concept: problem.concept, problem: problem.id, title: problem.title, step: 'answer', what: `NPV should be ${show(trueNpv)} ${inst.unitLabel}`, fix: inst.decision.explain });
    onDone({ score: total, max, clean, outcome: choice ? inst.outcomes[choice] : undefined, slips });
  };

  return (
    <section aria-labelledby="ws-title">
      {intro}
      <div className="game-title">
        <span className="game-kind">Cash-flow worksheet</span>
        <h2 id="ws-title">{problem.title}</h2>
      </div>
      <Chat beats={inst.prompt} host={problem.host} />
      <div className="ask-card">
        <span className="ask-tag">The question</span>
        {inst.ask}
      </div>

      <div className="panel" style={{ marginTop: 16, overflowX: 'auto' }}>
        <p className="step-help">
          Fill each row, year by year, in {inst.unitLabel}. Cash out is negative.
          {help === 'guided' && ' Each row is marked from your own rows above it, so one slip won’t sink the rest.'}
        </p>
        <table className="worksheet">
          <thead>
            <tr>
              <th />
              {years.map((y) => (
                <th key={y}>Year {y}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {inst.rows.map((row) => {
              const res = marks.result[row.key];
              const cells = row.cells ?? years;
              return (
                <tr key={row.key} className={row.given ? 'given' : checked ? (res?.rowOk ? 'row-ok' : 'row-bad') : ''}>
                  <th scope="row">
                    <div className="ws-label">{row.label}</div>
                    {!row.given && !checked && !hinted[row.key] && tipsLeft && (
                      <button type="button" className="link ws-hint-btn" onClick={() => setHinted((h) => ({ ...h, [row.key]: true }))}>
                        tip
                      </button>
                    )}
                    {!row.given && (hinted[row.key] || checked) && <div className="ws-note">{checked ? row.explain : row.hint}</div>}
                  </th>
                  {years.map((y) => {
                    if (row.given || !cells.includes(y))
                      return (
                        <td key={y} className="ws-fixed num-tab">
                          {show(marks.truth[row.key][y])}
                        </td>
                      );
                    const ok = res?.ok[y];
                    return (
                      <td key={y}>
                        <input
                          className={`ws-input${checked ? (ok ? ' good' : ' bad') : ''}`}
                          inputMode="decimal"
                          aria-label={`${row.label}, year ${y}`}
                          value={typed[row.key]?.[y] ?? ''}
                          disabled={checked}
                          onChange={(e) =>
                            setTyped((t) => {
                              const arr = [...(t[row.key] ?? years.map(() => ''))];
                              arr[y] = e.target.value;
                              return { ...t, [row.key]: arr };
                            })
                          }
                        />
                        {checked && !ok && <div className="ws-should num-tab">{show(res!.ownExpected[y])}</div>}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>

        {phase === 'sheet' ? (
          <div className="step-actions">
            <span className="muted" style={{ fontSize: 13 }}>
              {help === 'unguided' ? 'No tips on this one.' : help === 'prompted' ? 'One tip for the whole sheet. It halves that row’s point.' : 'Tips halve that row’s point.'}
            </span>
            <span className="spacer" />
            <button type="button" className="btn" disabled={!complete} onClick={() => setPhase('npv')}>
              Check the worksheet
            </button>
          </div>
        ) : (
          <Bubble
            beat={{
              who: 'margaux',
              mood: sheetScore === fillRows.length ? 'happy' : 'neutral',
              text:
                sheetScore === fillRows.length
                  ? 'Every row right. That’s the hard part done.'
                  : `${fillRows.filter((r) => marks.result[r.key]?.rowOk).length} of ${fillRows.length} rows right. Read the notes on the red rows; the corrections are under each cell.`,
            }}
          />
        )}
      </div>

      {checked && (
        <div className="panel" style={{ marginTop: 16 }}>
          <h3 className="step-title">
            <span className="move-n">Final move</span> NPV and the call
          </h3>
          <p className="step-help">
            Discount your net cash flow row at {inst.rate}%. A right NPV from your own row still scores.
          </p>
          <div className="field answer-field">
            <label htmlFor="ws-npv">NPV ({inst.unitLabel})</label>
            <div className={`input-wrap${phase === 'done' ? (npvOk || npvEcf ? ' good' : ' bad') : ''}`}>
              <input id="ws-npv" inputMode="decimal" value={npv} onChange={(e) => setNpv(e.target.value)} disabled={phase === 'done'} />
            </div>
          </div>
          <p style={{ fontWeight: 550, marginTop: 18 }}>{inst.decision.question}</p>
          <div className="seg" role="radiogroup" aria-label="Decision">
            {inst.decision.options.map((o) => (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={choice === o.id}
                className={`choice${phase === 'done' ? (o.id === inst.decision.correct ? ' is-correct' : o.id === choice ? ' is-wrong' : '') : ''}`}
                onClick={() => setChoice(o.id)}
                disabled={phase === 'done'}
              >
                <span className="dot" aria-hidden />
                <span className="body">{o.label}</span>
              </button>
            ))}
          </div>
          <p style={{ fontWeight: 550, marginTop: 18 }}>Because…</p>
          <div className="choices" role="radiogroup" aria-label="Justification">
            {whyOrder.map((o) => (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={why === o.id}
                className={`choice${phase === 'done' ? (o.id === inst.decision.correctWhy ? ' is-correct' : o.id === why ? ' is-wrong' : '') : ''}`}
                onClick={() => setWhy(o.id)}
                disabled={phase === 'done'}
              >
                <span className="dot" aria-hidden />
                <span className="body">{o.label}</span>
              </button>
            ))}
          </div>
          {phase === 'done' && (
            <>
              <Bubble
                beat={{
                  who: 'margaux',
                  mood: npvOk && decPoints === 2 ? 'happy' : 'neutral',
                  text: `NPV ${show(trueNpv)} ${inst.unitLabel}.${npvEcf ? ` From your own row, ${show(ownNpv)} was right: method points.` : ''} ${inst.decision.explain}`,
                }}
              />
              <h3 className="eyebrow" style={{ marginTop: 22 }}>
                How Margaux writes it up
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
            <span className="points num-tab">
              ✦ {total} / {max}
            </span>
            {phase === 'npv' ? (
              <button type="button" className="btn" disabled={npvGiven === null || !choice || !why} onClick={() => setPhase('done')}>
                Check
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
