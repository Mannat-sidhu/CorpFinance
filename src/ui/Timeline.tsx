// The time ruler: the player places each cash flow on its period. Tap a flow, then tap periods;
// or drag a flow onto a period. Every control is a button, so it works by keyboard too.
import { useState } from 'react';
import type { TimelineAnswer } from '../engine/grading';
import type { TimelineDiagram, TimelineSpec } from '../engine/types';

const UNIT_NAME = { year: 'Year', month: 'Month', quarter: 'Quarter', 'half-year': 'Half-year' } as const;
const UNIT_SHORT = { year: 'Yr', month: 'M', quarter: 'Q', 'half-year': 'H' } as const;

export const emptyTimeline = (): TimelineAnswer => ({ placed: {}, forever: {}, valueAt: null });

interface Props {
  spec: TimelineSpec;
  value: TimelineAnswer;
  onChange: (v: TimelineAnswer) => void;
  /** Feedback mode: compare the player's ruler with the correct one. */
  reveal?: boolean;
}

export function TimelineInput({ spec, value, onChange, reveal }: Props) {
  const [selected, setSelected] = useState(spec.streams[0]?.id ?? '');
  const [dragOver, setDragOver] = useState<number | null>(null);
  const periods = Array.from({ length: spec.show + 1 }, (_, i) => i);
  const unit = UNIT_NAME[spec.unit];
  const short = UNIT_SHORT[spec.unit];

  const has = (stream: string, p: number) => (value.placed[stream] ?? []).includes(p);
  const toggle = (stream: string, p: number, force?: boolean) => {
    if (reveal) return;
    const cur = value.placed[stream] ?? [];
    const on = force ?? !cur.includes(p);
    const next = on ? [...new Set([...cur, p])] : cur.filter((x) => x !== p);
    onChange({ ...value, placed: { ...value.placed, [stream]: next } });
  };
  const fill = () => {
    const cur = value.placed[selected] ?? [];
    if (cur.length < 2) return;
    const lo = Math.min(...cur);
    const hi = Math.max(...cur);
    onChange({ ...value, placed: { ...value.placed, [selected]: Array.from({ length: hi - lo + 1 }, (_, i) => lo + i) } });
  };
  const clear = () => onChange({ ...value, placed: { ...value.placed, [selected]: [] } });

  const correctAt = (stream: string, p: number) => spec.streams.find((s) => s.id === stream)!.periods.includes(p);
  const selectedStream = spec.streams.find((s) => s.id === selected);

  return (
    <div className="timeline">
      <div className="tl-chips" role="group" aria-label="Cash flows">
        {spec.streams.map((s) => (
          <div
            key={s.id}
            className="tl-chip"
            aria-pressed={selected === s.id}
            draggable={!reveal}
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', s.id);
              setSelected(s.id);
            }}
          >
            <button
              type="button"
              className="link"
              style={{ color: 'inherit', textDecoration: 'none', textAlign: 'left' }}
              aria-pressed={selected === s.id}
              onClick={() => setSelected(s.id)}
              disabled={reveal}
            >
              <span className="chip-label">
                <span className={`swatch ${s.direction}`} aria-hidden />
                {s.label}
              </span>
              <span className="chip-sub">
                {s.direction === 'in' ? 'Money in' : 'Money out'} ·{' '}
                {(value.placed[s.id] ?? []).length
                  ? `${short} ${[...(value.placed[s.id] ?? [])].sort((a, b) => a - b).join(', ')}`
                  : 'not placed yet'}
              </span>
            </button>
            <label className="forever-toggle">
              <input
                type="checkbox"
                checked={!!value.forever[s.id]}
                disabled={reveal}
                onChange={(e) => onChange({ ...value, forever: { ...value.forever, [s.id]: e.target.checked } })}
              />
              Carries on forever
              {reveal && !!s.forever !== !!value.forever[s.id] && (
                <span className="check bad"> (should be {s.forever ? 'on' : 'off'})</span>
              )}
            </label>
          </div>
        ))}
      </div>

      {!reveal && selectedStream && (
        <p className="step-help" style={{ margin: '0 0 8px' }}>
          Placing: <strong>{selectedStream.label}</strong>. Tap each {unit.toLowerCase()} it lands in, or drag a flow onto the ruler.
        </p>
      )}

      <div className="ruler" role="group" aria-label={`${unit}s`}>
        {periods.map((p) => (
          <button
            type="button"
            key={p}
            className={`tick${dragOver === p ? ' drop' : ''}`}
            aria-label={`${unit} ${p}: ${spec.streams.filter((s) => has(s.id, p)).map((s) => s.label).join(', ') || 'empty'}`}
            onClick={() => toggle(selected, p)}
            onDragOver={(e) => {
              if (reveal) return;
              e.preventDefault();
              setDragOver(p);
            }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(null);
              const id = e.dataTransfer.getData('text/plain');
              if (id) toggle(id, p, true);
            }}
          >
            <span className="yr">
              {short}
              <b>{p}</b>
            </span>
            {spec.streams.map((s) => {
              const placed = has(s.id, p);
              if (!reveal) return placed ? <span key={s.id} className={`flow ${s.direction}`} /> : null;
              const right = correctAt(s.id, p);
              if (placed && right) return <span key={s.id} className={`flow ${s.direction}`} title="Correct" />;
              if (placed && !right) return <span key={s.id} className={`flow ${s.direction} extra`} title="Should not be here" />;
              if (!placed && right) return <span key={s.id} className="flow missing" title="Missing" />;
              return null;
            })}
          </button>
        ))}
      </div>
      {spec.streams.some((s) => value.forever[s.id]) && <div className="forever-arrow">→ continues forever</div>}

      {!reveal && (
        <div className="tl-tools">
          <button type="button" className="btn ghost small" onClick={fill}>
            Fill between first and last
          </button>
          <button type="button" className="btn ghost small" onClick={clear}>
            Clear this flow
          </button>
        </div>
      )}

      {spec.valueAt && (
        <div className="valueat">
          <div className="q">{spec.valueAt.prompt}</div>
          <div className="ruler" role="radiogroup" aria-label={spec.valueAt.prompt}>
            {periods.map((p) => {
              const chosen = value.valueAt === p;
              const right = spec.valueAt!.period === p;
              return (
                <button
                  type="button"
                  role="radio"
                  aria-checked={chosen}
                  key={p}
                  className={`tick${chosen ? ' value-at' : ''}`}
                  onClick={() => !reveal && onChange({ ...value, valueAt: p })}
                >
                  <span className="yr">
                    {short}
                    <b>{p}</b>
                  </span>
                  {chosen && <span className="marker">{reveal && !right ? '✕' : 'PV'}</span>}
                  {reveal && right && !chosen && <span className="marker" style={{ color: 'var(--good)' }}>here</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/** Static ruler for lessons. */
export function Diagram({ d }: { d: TimelineDiagram }) {
  const W = 640;
  const pad = 36;
  const n = d.periods;
  const x = (p: number) => pad + (p * (W - pad * 2 - (d.forever ? 40 : 0))) / Math.max(1, n);
  const short = UNIT_SHORT[d.unit ?? 'year'];
  const colour = (k?: string) => (k === 'in' ? 'var(--in)' : k === 'out' ? 'var(--out)' : 'var(--accent)');
  return (
    <figure className="diagram">
      <svg viewBox={`0 0 ${W} 132`} role="img" aria-label={d.caption ?? 'Timeline'}>
        <line x1={pad - 10} x2={W - pad + (d.forever ? 0 : -10)} y1={66} y2={66} stroke="currentColor" strokeWidth={1.2} />
        {d.forever && (
          <text x={W - pad + 4} y={71} fontSize={16} fill="currentColor" fontFamily="var(--serif)">
            → ∞
          </text>
        )}
        {Array.from({ length: n + 1 }, (_, p) => (
          <g key={p}>
            <line x1={x(p)} x2={x(p)} y1={60} y2={72} stroke="currentColor" strokeWidth={1} />
            <text x={x(p)} y={90} fontSize={11} textAnchor="middle" fill="var(--ink-3)" fontFamily="var(--sans)">
              {short} {p}
            </text>
          </g>
        ))}
        {d.marks.map((m, i) => {
          const above = m.kind !== 'out';
          return (
            <g key={i}>
              {m.kind === 'value' ? (
                <circle cx={x(m.at)} cy={66} r={5} fill="var(--paper)" stroke="var(--accent)" strokeWidth={2} />
              ) : (
                <circle cx={x(m.at)} cy={66} r={3.5} fill={colour(m.kind)} />
              )}
              <text
                x={x(m.at)}
                y={above ? 46 - (m.kind === 'value' ? 0 : 0) : 114}
                fontSize={n > 8 ? 10.5 : 13}
                textAnchor="middle"
                fill={colour(m.kind)}
                fontFamily="var(--serif)"
                fontStyle={m.kind === 'value' ? 'italic' : 'normal'}
              >
                {m.label}
              </text>
            </g>
          );
        })}
      </svg>
      {d.caption && <figcaption>{d.caption}</figcaption>}
    </figure>
  );
}
