// Speech bubbles for the cast. Margaux (your adviser) sits on the left; everyone else on the right.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { CHARACTERS } from '../content';
import type { CharacterId, StoryBeat } from '../engine/types';
import { CAST_COLOUR, Portrait } from './Portrait';

export function Bubble({
  beat,
  faded,
  continued,
  children,
}: {
  beat: StoryBeat;
  faded?: boolean;
  /** Same speaker as the line before: hide the repeated portrait and name. */
  continued?: boolean;
  children?: ReactNode;
}) {
  if (beat.who === 'narrator') {
    return <div className={`caption${faded ? ' faded' : ''}`}>{beat.text}</div>;
  }
  const c = CHARACTERS[beat.who];
  const side = beat.who === 'margaux' ? 'left' : 'right';
  return (
    <div className={`bubble-row ${side}${faded ? ' faded' : ''}${continued ? ' continued' : ''}`} style={{ ['--who' as string]: CAST_COLOUR[beat.who] }}>
      <div className="who-col">{continued ? <div style={{ width: 64 }} /> : <Portrait who={beat.who} mood={beat.mood} size={64} />}</div>
      <div className="bubble">
        {!continued && (
          <div className="bubble-name">
            {c.name} <span>{c.role}</span>
          </div>
        )}
        <div className="bubble-text">{beat.text}</div>
        {children}
      </div>
    </div>
  );
}

/** All lines at once (used for problem briefs and revision). */
export function Chat({ beats, host }: { beats: (string | StoryBeat)[]; host?: CharacterId }) {
  return (
    <div className={`chat${host === 'narrator' ? ' paper' : ''}`}>
      {beats.map((b, i) => {
        const beat = typeof b === 'string' ? { who: host ?? 'margaux', text: b } : b;
        const prev = i > 0 ? beats[i - 1] : null;
        const prevWho = prev === null ? null : typeof prev === 'string' ? (host ?? 'margaux') : prev.who;
        return <Bubble key={i} beat={beat} continued={prevWho === beat.who} />;
      })}
    </div>
  );
}

/** One line at a time, with back and continue. Arrow keys work too. */
export function Scene({
  beats,
  scene,
  onDone,
  onBack,
  cta = 'Continue',
  startAtEnd,
}: {
  beats: StoryBeat[];
  scene?: string;
  onDone: () => void;
  onBack?: () => void;
  cta?: string;
  startAtEnd?: boolean;
}) {
  const [n, setN] = useState(startAtEnd ? beats.length : 1);
  const last = useRef<HTMLDivElement>(null);
  const next = () => (n < beats.length ? setN(n + 1) : onDone());
  const back = () => (n > 1 ? setN(n - 1) : onBack?.());
  useEffect(() => {
    last.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [n]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') back();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  return (
    <section className="scene">
      {scene && <div className="scene-tag">{scene}</div>}
      <div className="chat" onClick={next}>
        {beats.slice(0, n).map((b, i) => (
          <div key={i} ref={i === n - 1 ? last : undefined} className="enter">
            <Bubble beat={b} faded={i < n - 1} continued={i > 0 && beats[i - 1].who === b.who && b.who !== 'narrator'} />
          </div>
        ))}
      </div>
      <div className="scene-controls">
        <button type="button" className="btn ghost small" onClick={back} disabled={n <= 1 && !onBack}>
          ← Back
        </button>
        <div className="beat-dots" aria-hidden>
          {beats.map((_, i) => (
            <span key={i} className={i < n ? 'on' : ''} />
          ))}
        </div>
        <button type="button" className="btn" onClick={next} autoFocus>
          {n < beats.length ? 'Next' : cta} →
        </button>
      </div>
    </section>
  );
}
