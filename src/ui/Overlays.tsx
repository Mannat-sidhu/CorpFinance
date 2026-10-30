// Lesson pages, the ledger and the formula sheet. Reachable from anywhere.
import { useEffect, useRef, type ReactNode } from 'react';
import { ACTS, CONCEPTS, FORMULA_SHEET, PRACTISABLE } from '../content';
import { conceptState, stageOf } from '../engine/mastery';
import type { Concept, Stage } from '../engine/types';
import { useGame } from './store';
import { Tex } from './Tex';
import { Diagram } from './Timeline';

export const STAGE_LABEL: Record<Stage, string> = {
  locked: 'Locked',
  new: 'New',
  practising: 'Practising',
  common: 'Common knowledge',
};

function Overlay({ onClose, center, label, children }: { onClose: () => void; center?: boolean; label: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prev?.focus?.();
    };
  }, [onClose]);
  return (
    <div className={`overlay${center ? ' center' : ''}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} ref={ref}>
        {children}
      </div>
    </div>
  );
}

export function LessonView({ concept, compact }: { concept: Concept; compact?: boolean }) {
  const l = concept.lesson;
  return (
    <article className="lesson">
      {!compact && <div className="eyebrow">Lesson · Act {ACTS[concept.act - 1].numeral}</div>}
      <h2>{concept.name}</h2>
      <div className="prose">
        {l.plain.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      {l.timeline && (
        <>
          <h3>On the time ruler</h3>
          <Diagram d={l.timeline} />
        </>
      )}
      {l.formula && (
        <>
          <h3>
            Formula
            {l.formula.onSheet && <span className="sheet-badge">on the exam sheet</span>}
          </h3>
          <div className="formula">
            <Tex block>{l.formula.tex}</Tex>
            {l.formula.where && <div className="where">{l.formula.where.join(' · ')}</div>}
          </div>
        </>
      )}
      {l.example && (
        <>
          <h3>Worked example</h3>
          <p className="prose" style={{ fontSize: 17 }}>
            {l.example.prompt}
          </p>
          <div className="working">
            {l.example.working.map((w, i) => (
              <div className="line" key={i}>
                <Tex>{w}</Tex>
              </div>
            ))}
          </div>
          <p>
            <strong>Answer:</strong> {l.example.answer}
          </p>
        </>
      )}
      <h3>Common traps</h3>
      <ul className="traps">
        {l.traps.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    </article>
  );
}

function LessonOverlay() {
  const { overlays, openLesson, save, go } = useGame();
  const c = overlays.lesson ? CONCEPTS[overlays.lesson] : null;
  if (!c) return null;
  const stage = stageOf(save, c.id);
  return (
    <Overlay onClose={() => openLesson(null)} center label={c.name}>
      <div className="sheet-head">
        <span className={`stage ${stage}`}>{STAGE_LABEL[stage]}</span>
        <div className="row">
          {PRACTISABLE.includes(c.id) && stage !== 'locked' && (
            <button
              type="button"
              className="btn small"
              onClick={() => {
                openLesson(null);
                go({ name: 'practice', concept: c.id });
              }}
            >
              Practise
            </button>
          )}
          <button type="button" className="btn ghost small" onClick={() => openLesson(null)}>
            Close
          </button>
        </div>
      </div>
      <LessonView concept={c} />
    </Overlay>
  );
}

export function Ledger() {
  const { save, openLesson } = useGame();
  const acts = ACTS.filter((a) => a.concepts.length);
  return (
    <div className="ledger">
      <h2>The ledger</h2>
      <p className="stage-legend">Everything you have learnt. Tap a concept to revise it.</p>
      {acts.map((a) => (
        <div className="act-group" key={a.number}>
          <div className="eyebrow">
            Act {a.numeral} · {a.title}
          </div>
          <ul>
            {a.concepts.map((id) => {
              const c = CONCEPTS[id];
              const st = conceptState(save, id);
              return (
                <li key={id}>
                  <button type="button" disabled={st.stage === 'locked'} onClick={() => openLesson(id)}>
                    <span className="cname">{st.stage === 'locked' ? c.name : c.name}</span>
                    <span className={`stage ${st.stage}`}>{STAGE_LABEL[st.stage]}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

function LedgerDrawer() {
  const { overlays, openLedger } = useGame();
  if (!overlays.ledger) return null;
  return (
    <Overlay onClose={() => openLedger(false)} label="Ledger">
      <div className="sheet-head">
        <span />
        <button type="button" className="btn ghost small" onClick={() => openLedger(false)}>
          Close
        </button>
      </div>
      <Ledger />
    </Overlay>
  );
}

function FormulaSheetOverlay() {
  const { overlays, openFormulas } = useGame();
  if (!overlays.formulas) return null;
  return (
    <Overlay onClose={() => openFormulas(false)} center label="Formula sheet">
      <div className="sheet-head">
        <div>
          <div className="eyebrow">FIN40940 Corporate Finance</div>
          <h2 style={{ fontSize: 24, marginTop: 4 }}>Formulas</h2>
        </div>
        <button type="button" className="btn ghost small" onClick={() => openFormulas(false)}>
          Close
        </button>
      </div>
      <p className="muted" style={{ fontSize: 13 }}>
        The sheet you will be given in the exam, exactly as provided.
      </p>
      <div className="formula-sheet">
        <ol>
          {FORMULA_SHEET.map((f) => (
            <li key={f.letter}>
              <div className="fname">
                <b>({f.letter})</b>
                {f.name}
              </div>
              <Tex>{f.tex}</Tex>
            </li>
          ))}
        </ol>
      </div>
    </Overlay>
  );
}

export function Overlays() {
  return (
    <>
      <LedgerDrawer />
      <FormulaSheetOverlay />
      {/* Last, so a lesson opened from the ledger sits on top of it. */}
      <LessonOverlay />
    </>
  );
}
