// Year end: each chapter is a year. Holdings pay or cost cash, risky ones with a little luck.
import { useEffect, useMemo, useState } from 'react';
import { ACTS } from '../content';
import { eur, eurSigned } from '../engine/format';
import { RESCUE, closeYear, flowIn, previewYear, runningAfter, type YearEnd } from '../engine/holdings';
import { Bubble } from './Chat';
import { useGame } from './store';

export function YearEndScreen({ year }: { year: number }) {
  const { save, setSave, go, back } = useGame();
  const act = ACTS[year - 1];
  const alreadyClosed = save.yearsClosed.includes(year);
  const preview = useMemo(() => previewYear(save, year), [save, year]);
  const [result, setResult] = useState<YearEnd | null>(null);
  const shown = result ?? preview;
  const closed = alreadyClosed || !!result;
  const running = runningAfter(save, year);
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  const close = () => {
    const { save: next, result: r } = closeYear(save, year);
    setResult(r);
    setSave(() => next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const net = shown.lines.reduce((s, l) => s + (closed ? l.actual : l.expected), 0);
  const luck = shown.lines.reduce((s, l) => s + l.actual - l.expected, 0);

  return (
    <div className="play-main narrow">
      <header className="session-head">
        <div className="eyebrow">
          Chapter {act.numeral} · Year {year} end
        </div>
        <h1>Closing the books</h1>
      </header>

      {alreadyClosed && !result ? (
        <section className="panel">
          <p style={{ marginTop: 0 }}>Year {year} is closed. Here is what the house is still committed to.</p>
        </section>
      ) : (
        <section className="panel">
          <Bubble
            beat={{
              who: 'margaux',
              mood: closed ? (net >= 0 && !shown.rescue ? 'happy' : 'worried') : 'neutral',
              text: closed
                ? shown.rescue
                  ? 'We ran dry. Aoife covered us, at a rate I’d rather not repeat.'
                  : luck
                    ? `Done. Luck was ${luck > 0 ? 'on our side' : 'against us'} this year, by ${eur(Math.abs(luck))}. The decisions were the same either way.`
                    : 'Done. Every line came in as planned.'
                : shown.lines.length
                  ? 'Here’s what lands this year from everything you’ve signed. Risky lines show what we expect; the actual number comes when we close.'
                  : 'Nothing you’ve signed pays or costs anything this year.'
            }}
          />
          {shown.lines.length > 0 && (
            <table className="marks-table year-table">
              <thead>
                <tr>
                  <td className="muted">Line</td>
                  <td className="muted num-tab">Expected</td>
                  {closed && <td className="muted num-tab">Actual</td>}
                </tr>
              </thead>
              <tbody>
                {shown.lines.map((l, i) => (
                  <tr key={i}>
                    <td>{l.label}</td>
                    <td className="num-tab">{eurSigned(Math.round(l.expected))}</td>
                    {closed && (
                      <td className={`num-tab ${l.actual >= 0 ? 'up' : 'down'}`}>
                        {eurSigned(Math.round(l.actual))}
                        {l.actual !== l.expected && <span className="tagline">{l.actual > l.expected ? 'lucky' : 'unlucky'}</span>}
                      </td>
                    )}
                  </tr>
                ))}
                {shown.rescue && (
                  <tr>
                    <td>Emergency loan from Aoife ({RESCUE.rate * 100}%, {shown.rescue.years} years)</td>
                    <td className="num-tab">—</td>
                    {closed && <td className="num-tab up">{eurSigned(shown.rescue.borrowed)}</td>}
                  </tr>
                )}
                <tr className="total">
                  <td>Cash</td>
                  <td className="num-tab">{eur(Math.round(shown.cashBefore))} before</td>
                  {closed && <td className="num-tab">{eur(Math.round(shown.cashAfter))} after</td>}
                </tr>
              </tbody>
            </table>
          )}
          {closed && shown.rescue && (
            <p className="outcome">
              Repaying {eur(Math.round(shown.rescue.payment))} a year for {shown.rescue.years} years. Against a fair loan, the penalty rate costs the house{' '}
              {eur(Math.round(shown.rescue.valueCost))} of value.
            </p>
          )}
          {!closed && preview.rescue && (
            <p className="muted" style={{ fontSize: 14 }}>
              Heads up: this would leave the house short of cash. Aoife will lend what’s missing at a penalty rate.
            </p>
          )}
        </section>
      )}

      {running.length > 0 && (
        <section className="panel" style={{ marginTop: 16 }}>
          <h3 className="eyebrow" style={{ marginTop: 0 }}>
            Still running after year {year}
          </h3>
          <table className="marks-table">
            <tbody>
              {running.map((h) => {
                const nextFlow = flowIn(h, year + 1);
                const n = h.flows ? h.flows.length : h.years;
                return (
                  <tr key={h.id}>
                    <td>
                      {h.label}
                      {h.spread ? <span className="tagline">risky</span> : null}
                    </td>
                    <td className="num-tab">
                      {nextFlow ? `${eurSigned(Math.round(nextFlow))} next year` : 'starts later'}
                      <div className="muted" style={{ fontSize: 12 }}>
                        {n === undefined ? 'forever' : `until year ${h.from + n - 1}`}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      <div className="scene-controls">
        <button type="button" className="btn ghost" onClick={back}>
          ← Back
        </button>
        <span />
        {closed ? (
          <button type="button" className="btn" onClick={() => go({ name: 'map' })} autoFocus>
            Back to the map
          </button>
        ) : (
          <button type="button" className="btn" onClick={close} autoFocus>
            Close year {year}
          </button>
        )}
      </div>
    </div>
  );
}
