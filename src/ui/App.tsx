// App shell: status bar, news line, and the screens.
import { useEffect, useRef, useState } from 'react';
import { ACTS, ALL_CONCEPT_IDS, CHARACTERS, CONCEPTS, findSession, seedHoldings } from '../content';
import { eur, eurSigned } from '../engine/format';
import { conceptState, intervalScale, isDue, stageOf, weakest } from '../engine/mastery';
import type { SessionRecord } from '../engine/save';
import { STARTING_VALUE, exportSave, freshSave, importSave, isCleared } from '../engine/save';
import type { Act, Stage } from '../engine/types';
import { Overlays, STAGE_LABEL } from './Overlays';
import { BossPlayer, ExamPlayer, PracticePlayer, SessionPlayer } from './Play';
import { ClinicPlayer } from './Clinic';
import { Notebook } from './Notebook';
import { YearEndScreen } from './YearEnd';
import { Portrait } from './Portrait';
import { Stars, starsFor } from './Stars';
import { useGame, useTicker, type Screen } from './store';

/** Floating +€/−€ chip whenever the house's value moves. */
function useValueToast(value: number) {
  const [toast, setToast] = useState<{ delta: number; key: number } | null>(null);
  const prev = useRef(value);
  useEffect(() => {
    const d = value - prev.current;
    prev.current = value;
    if (Math.abs(d) < 0.5) return;
    setToast({ delta: d, key: Date.now() });
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [value]);
  return toast;
}

function TopBar() {
  const { save, screen, go, back, canGoBack, openLedger, openFormulas } = useGame();
  const toast = useValueToast(save.value);
  const value = useTicker(save.value);
  const cash = useTicker(save.cash);
  const latest = save.news[0];
  const playing = screen.name === 'play' ? findSession(screen.sessionId) : null;
  const navItem = (label: string, target: Screen, active: boolean, className?: string) => (
    <button type="button" className={className} aria-current={active ? 'page' : undefined} onClick={() => go(target)}>
      {label}
    </button>
  );
  return (
    <header className="topbar">
      <div className="topbar-inner">
        {canGoBack && (
          <button type="button" className="back-btn" onClick={back} aria-label="Back">
            ←
          </button>
        )}
        <button type="button" className="brand" onClick={() => go({ name: 'map' })}>
          <small>{playing ? `Chapter ${playing.act.numeral} · ${playing.session.title}` : 'A fashion house'}</small>
          {save.houseName}
        </button>
        <div className="metrics" aria-live="polite">
          <div className="metric primary">
            <div className="label">House value</div>
            <div className="value">{eur(value)}</div>
            {toast && (
              <span key={toast.key} className={`value-toast ${toast.delta > 0 ? 'up' : 'down'}`}>
                {eurSigned(toast.delta)}
              </span>
            )}
          </div>
          <div className="metric">
            <div className="label">Cash</div>
            <div className="value">{eur(cash)}</div>
          </div>
          <div className="metric">
            <div className="label">Streak</div>
            <div className="value">
              {save.streak.count > 0 ? '🔥 ' : ''}
              {save.streak.count} {save.streak.count === 1 ? 'day' : 'days'}
            </div>
          </div>
        </div>
        <button type="button" className="fab-formulas" onClick={() => openFormulas(true)}>
          <span className="f">ƒ</span> Formulas
        </button>
        <nav className="nav" aria-label="Main">
          {navItem('Map', { name: 'map' }, screen.name === 'map', 'nav-map')}
          <button type="button" className="ledger-toggle" onClick={() => openLedger(true)}>
            Ledger
          </button>
          {navItem('Progress', { name: 'progress' }, screen.name === 'progress')}
          {navItem('Notebook', { name: 'notebook' }, screen.name === 'notebook')}
          {navItem('Settings', { name: 'settings' }, screen.name === 'settings')}
        </nav>
      </div>
      {latest && (
        <div className="newsline">
          <div className="newsline-inner">
            <span className="tag">Latest</span>
            <span className="text">{latest.news}</span>
            {latest.delta !== 0 && (
              <span className={`delta ${latest.delta > 0 ? 'up' : 'down'}`}>
                {eurSigned(latest.delta)} ({latest.delta > 0 ? '+' : '−'}
                {Math.abs((latest.delta / Math.max(1, save.value - latest.delta)) * 100).toFixed(1)}%)
              </span>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

// ---------------------------------------------------------------- act map

function actProgress(act: Act, sessions: Record<string, unknown>) {
  const done = act.sessions.filter((s) => isCleared(sessions[s.id] as SessionRecord | undefined)).length;
  return { done, total: act.sessions.length };
}

function Cast() {
  const ids = ['margaux', 'theo', 'idris', 'ferriter', 'aoife'] as const;
  return (
    <div className="cast">
      {ids.map((id) => (
        <div className="cast-card" key={id}>
          <Portrait who={id} size={56} />
          <div>
            <strong>{CHARACTERS[id].name}</strong>
            <span className="muted">{CHARACTERS[id].role}</span>
            <p>{CHARACTERS[id].vibe}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ActMap() {
  const { save, go } = useGame();
  const resume = save.resume ? findSession(save.resume.sessionId) : null;
  const firstOpen = ACTS.filter((a) => !a.draft)
    .flatMap((a) => a.sessions)
    .find((s) => !isCleared(save.sessions[s.id]));
  return (
    <>
      <section className="hero">
        <h1>{save.houseName}</h1>
        <p>From one spare room to a takeover target. Every decision moves the house’s value. Make it climb.</p>
        {resume ? (
          <button type="button" className="btn big" onClick={() => go({ name: 'play', sessionId: resume.session.id })}>
            Carry on: {resume.session.title} →
          </button>
        ) : firstOpen ? (
          <button type="button" className="btn big" onClick={() => go(save.sessions[firstOpen.id] ? { name: 'clinic', sessionId: firstOpen.id } : { name: 'play', sessionId: firstOpen.id })}>
            {save.sessions[firstOpen.id] ? 'Clinic' : 'Play'}: {firstOpen.title} →
          </button>
        ) : null}
      </section>

      <div className="chapters">
        {ACTS.map((act) => {
          const { done, total } = actProgress(act, save.sessions);
          const open = !act.draft;
          const bossOpen = open && act.boss && done === total;
          if (!open)
            return (
              <article key={act.number} className="chapter locked">
                <span className="chapter-n">{act.numeral}</span>
                <div>
                  <h2>{act.title}</h2>
                  <p className="muted">{act.blurb}</p>
                </div>
                <span className="soon">Coming soon</span>
              </article>
            );
          return (
            <article key={act.number} className="chapter open">
              <div className="chapter-head">
                <span className="chapter-n">{act.numeral}</span>
                <div>
                  <div className="eyebrow">
                    Chapter {act.numeral} · {done} of {total} episodes
                  </div>
                  <h2>{act.title}</h2>
                  <p className="muted">{act.blurb}</p>
                </div>
              </div>
              <ol className="path">
                {act.sessions.map((s, i) => {
                  const rec = save.sessions[s.id];
                  const prevAct = ACTS[act.number - 2];
                  const chapterOpen = !prevAct || prevAct.draft || prevAct.sessions.every((x) => isCleared(save.sessions[x.id]));
                  const unlocked = (i === 0 ? chapterOpen : isCleared(save.sessions[act.sessions[i - 1].id])) || !!rec;
                  const needsClinic = !!rec && !isCleared(rec);
                  const current = (unlocked && !rec) || needsClinic;
                  return (
                    <li key={s.id} className={`node${rec && !needsClinic ? ' done' : ''}${current ? ' current' : ''}${!unlocked ? ' locked' : ''}${needsClinic ? ' clinic' : ''}`}>
                      <button
                        type="button"
                        className="node-dot"
                        disabled={!unlocked}
                        onClick={() => go(needsClinic ? { name: 'clinic', sessionId: s.id } : { name: 'play', sessionId: s.id })}
                        aria-label={needsClinic ? `Clinic for episode ${i + 1}: ${s.title}` : `${rec ? 'Replay' : 'Play'} episode ${i + 1}: ${s.title}`}
                      >
                        {needsClinic ? '+' : rec ? '✓' : unlocked ? i + 1 : '🔒'}
                      </button>
                      <div className="node-title">{s.title}</div>
                      <div className="node-sub">{needsClinic ? 'Margaux wants a word.' : rec ? <Stars n={starsFor(rec.score, rec.max)} /> : s.blurb}</div>
                    </li>
                  );
                })}
                {act.boss && (
                  <li className={`node boss${save.bosses[act.number] ? ' done' : ''}${bossOpen && !save.bosses[act.number] ? ' current' : ''}${!bossOpen ? ' locked' : ''}`}>
                    <button
                      type="button"
                      className="node-dot"
                      disabled={!bossOpen}
                      onClick={() => go({ name: 'boss', act: act.number })}
                      aria-label={`Boss level: ${act.boss.title}`}
                    >
                      {bossOpen ? '♛' : '🔒'}
                    </button>
                    <div className="node-title">Boss: {act.boss.title}</div>
                    <div className="node-sub">
                      {save.bosses[act.number] ? (
                        <Stars n={starsFor(save.bosses[act.number].score, save.bosses[act.number].max)} />
                      ) : (
                        'No help from Margaux.'
                      )}
                    </div>
                  </li>
                )}
                {act.boss && (() => {
                  const closed = save.yearsClosed.includes(act.number);
                  const ready = !!save.bosses[act.number] && (act.number === 1 || save.yearsClosed.includes(act.number - 1));
                  return (
                    <li className={`node yearend${closed ? ' done' : ''}${ready && !closed ? ' current' : ''}${!ready && !closed ? ' locked' : ''}`}>
                      <button
                        type="button"
                        className="node-dot"
                        disabled={!ready && !closed}
                        onClick={() => go({ name: 'yearend', act: act.number })}
                        aria-label={`Year ${act.number} end`}
                      >
                        {closed ? '✓' : ready ? '€' : '🔒'}
                      </button>
                      <div className="node-title">Year {act.number} end</div>
                      <div className="node-sub">{closed ? 'Books closed.' : 'Cash in, cash out, and a little luck.'}</div>
                    </li>
                  );
                })()}
                {act.exam && (
                  <li className={`node exam${save.exams[act.number] ? ' done' : ''}${save.bosses[act.number] && !save.exams[act.number] ? ' current' : ''}${!save.bosses[act.number] ? ' locked' : ''}`}>
                    <button
                      type="button"
                      className="node-dot"
                      disabled={!save.bosses[act.number]}
                      onClick={() => go({ name: 'exam', act: act.number })}
                      aria-label="Exam room"
                    >
                      {save.bosses[act.number] ? '✎' : '🔒'}
                    </button>
                    <div className="node-title">Exam room</div>
                    <div className="node-sub">
                      {save.exams[act.number] ? (
                        <Stars n={starsFor(save.exams[act.number].score, save.exams[act.number].max)} />
                      ) : (
                        `${act.exam.problems.length} paper-style questions. No tips.`
                      )}
                    </div>
                  </li>
                )}
              </ol>
            </article>
          );
        })}
      </div>

      <h2 className="section-title">The cast</h2>
      <Cast />
    </>
  );
}

// ---------------------------------------------------------------- progress

function Progress() {
  const { save, openLesson, go } = useGame();
  const now = Date.now();
  const stages: Stage[] = ['new', 'practising', 'common'];
  const due = ALL_CONCEPT_IDS.filter((id) => isDue(save, id, now));
  const weak = weakest(save, ALL_CONCEPT_IDS);
  const daysLeft = Math.ceil((new Date(save.settings.examDate + 'T09:00:00').getTime() - now) / 86_400_000);
  return (
    <>
      <section className="hero">
        <h1>How you’re doing</h1>
        <p>
          {daysLeft > 0 ? `${daysLeft} days to go.` : 'The big day has passed.'} Pop quizzes come round every so often to keep things fresh
          {intervalScale(save.settings.examDate, now) < 1 ? ', a bit more often as the date gets closer' : ''}.
        </p>
      </section>
      {ACTS.filter((a) => a.concepts.length).map((a) => (
        <section key={a.number}>
          <div className="eyebrow">
            Chapter {a.numeral} · {a.title}
          </div>
          <div className="stat-grid">
            {stages.map((st) => (
              <div key={st}>
                <div className={`stage ${st}`}>{STAGE_LABEL[st]}</div>
                <div className="big-number">{a.concepts.filter((id) => stageOf(save, id) === st).length}</div>
              </div>
            ))}
            <div>
              <div className="stage locked">Not yet met</div>
              <div className="big-number">{a.concepts.filter((id) => stageOf(save, id) === 'locked').length}</div>
            </div>
          </div>
        </section>
      ))}
      <div className="play" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 32 }}>
        <section>
          <h2 style={{ fontSize: 22 }}>Pop quizzes waiting</h2>
          {due.length ? (
            <ul className="ledger" style={{ listStyle: 'none', padding: 0 }}>
              {due.map((id) => (
                <li key={id} className="spread" style={{ padding: '10px 0', borderBottom: '1px solid var(--rule)' }}>
                  <span>{CONCEPTS[id].name}</span>
                  <button type="button" className="btn small" onClick={() => go({ name: 'practice', concept: id })}>
                    Take it
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Nothing waiting. They’ll pop up at the end of episodes.</p>
          )}
        </section>
        <section>
          <h2 style={{ fontSize: 22 }}>Shakiest ideas</h2>
          {weak.length ? (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {weak.map(({ id, c }) => (
                <li key={id} className="spread" style={{ padding: '10px 0', borderBottom: '1px solid var(--rule)' }}>
                  <button type="button" className="link" onClick={() => openLesson(id)}>
                    {CONCEPTS[id].name}
                  </button>
                  <span className="muted num-tab" style={{ fontSize: 13 }}>
                    {c.cleanAttempts}/{c.attempts} clean{c.lapses ? ` · ${c.lapses} slipped` : ''}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Nothing played yet.</p>
          )}
        </section>
      </div>
      <p className="muted" style={{ marginTop: 28, fontSize: 13 }}>
        Value since you opened: {eurSigned(save.value - STARTING_VALUE)} · Episodes played: {save.sessionsPlayed} · Ideas met:{' '}
        {ALL_CONCEPT_IDS.filter((id) => conceptState(save, id).stage !== 'locked').length} of {ALL_CONCEPT_IDS.length}
      </p>
    </>
  );
}

// ---------------------------------------------------------------- settings

function Settings() {
  const { save, setSave, go } = useGame();
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <section className="hero">
        <h1>Settings</h1>
      </section>
      <div className="form-row">
        <label htmlFor="house">Name of the house</label>
        <input
          id="house"
          className="text-input"
          value={save.houseName}
          maxLength={40}
          onChange={(e) => setSave((s) => ({ ...s, houseName: e.target.value || 'Atelier Noor' }))}
        />
      </div>
      <div className="form-row">
        <label htmlFor="exam">Your deadline (pop quizzes speed up as it gets close)</label>
        <input
          id="exam"
          type="date"
          className="text-input"
          value={save.settings.examDate}
          onChange={(e) => e.target.value && setSave((s) => ({ ...s, settings: { ...s.settings, examDate: e.target.value } }))}
        />
      </div>
      <div className="form-row">
        <label htmlFor="theme">Appearance</label>
        <select
          id="theme"
          className="text-input"
          value={save.settings.theme}
          onChange={(e) => setSave((s) => ({ ...s, settings: { ...s.settings, theme: e.target.value as 'system' } }))}
        >
          <option value="system">Match this device</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>

      <h2 style={{ fontSize: 22, marginTop: 34 }}>Your save file</h2>
      <p className="muted" style={{ maxWidth: 560 }}>
        Progress saves in this browser. Export a copy to keep it safe, or to carry on in another browser.
      </p>
      <div className="row">
        <button type="button" className="btn" onClick={() => exportSave(save)}>
          Export progress
        </button>
        <button type="button" className="btn ghost" onClick={() => fileRef.current?.click()}>
          Import progress
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            try {
              const data = await importSave(f, seedHoldings);
              if (!window.confirm('Replace the progress on this device with the imported file?')) return;
              setSave(() => data);
              setMsg('Progress imported.');
            } catch {
              setMsg('That file could not be read as Atelier Noor progress.');
            }
            e.target.value = '';
          }}
        />
      </div>
      {msg && (
        <p className="muted" role="status" style={{ marginTop: 10 }}>
          {msg}
        </p>
      )}

      <h2 style={{ fontSize: 22, marginTop: 34 }}>Start again</h2>
      <p className="muted">Wipes all progress on this device. Export first if you might want it back.</p>
      <button
        type="button"
        className="btn ghost"
        onClick={() => {
          if (window.confirm('Delete all progress on this device and start again?')) {
            setSave(() => freshSave(save.houseName));
            go({ name: 'map' });
          }
        }}
      >
        Reset progress
      </button>
    </>
  );
}

// ---------------------------------------------------------------- welcome

function Welcome() {
  const { save, setSave, go } = useGame();
  return (
    <main className="page welcome">
      <div className="welcome-cast">
        {(['idris', 'margaux', 'theo'] as const).map((id) => (
          <Portrait key={id} who={id} size={id === 'margaux' ? 108 : 84} mood="happy" />
        ))}
      </div>
      <h1>Open your own fashion house.</h1>
      <p className="welcome-lede">
        Strike deals, dodge bad offers, outsmart a sly investor and a bonus-hungry manager. Every call you make moves the house’s value. Make it climb.
      </p>
      <div className="form-row" style={{ margin: '28px auto 18px' }}>
        <label htmlFor="name">Name your house</label>
        <input id="name" className="text-input" value={save.houseName} maxLength={40} onChange={(e) => setSave((s) => ({ ...s, houseName: e.target.value }))} />
      </div>
      <button
        type="button"
        className="btn big"
        onClick={() => {
          setSave((s) => ({ ...s, houseName: s.houseName.trim() || 'Atelier Noor', createdAt: Date.now() }));
          go({ name: 'map' });
        }}
      >
        Open the doors →
      </button>
    </main>
  );
}

export function App() {
  const { screen } = useGame();
  if (screen.name === 'welcome') return <Welcome />;
  return (
    <div className="shell">
      <TopBar />
      <main className="page">
        {screen.name === 'map' && <ActMap />}
        {screen.name === 'play' && <SessionPlayer key={screen.sessionId} sessionId={screen.sessionId} />}
        {screen.name === 'boss' && <BossPlayer actNumber={screen.act} />}
        {screen.name === 'exam' && <ExamPlayer actNumber={screen.act} />}
        {screen.name === 'yearend' && <YearEndScreen year={screen.act} />}
        {screen.name === 'practice' && <PracticePlayer key={screen.concept} concept={screen.concept} />}
        {screen.name === 'progress' && <Progress />}
        {screen.name === 'notebook' && <Notebook />}
        {screen.name === 'clinic' && <ClinicPlayer sessionId={screen.sessionId} />}
        {screen.name === 'settings' && <Settings />}
      </main>
      <Overlays />
    </div>
  );
}
