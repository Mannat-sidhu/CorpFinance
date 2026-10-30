// App shell: status bar, news line, and the screens.
import { useRef, useState } from 'react';
import { ACTS, ALL_CONCEPT_IDS, CONCEPTS, findSession } from '../content';
import { eur, eurSigned } from '../engine/format';
import { conceptState, intervalScale, isDue, stageOf, weakest } from '../engine/mastery';
import { STARTING_VALUE, exportSave, freshSave, importSave } from '../engine/save';
import type { Act, Stage } from '../engine/types';
import { Overlays, STAGE_LABEL } from './Overlays';
import { BossPlayer, PracticePlayer, SessionPlayer } from './Play';
import { useGame, useTicker, type Screen } from './store';

function TopBar() {
  const { save, screen, go, openLedger } = useGame();
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
        <button type="button" className="brand" onClick={() => go({ name: 'map' })}>
          <small>{playing ? `Act ${playing.act.numeral} · ${playing.session.title}` : 'Corporate finance'}</small>
          {save.houseName}
        </button>
        <div className="metrics" aria-live="polite">
          <div className="metric primary">
            <div className="label">House value</div>
            <div className="value">{eur(value)}</div>
          </div>
          <div className="metric">
            <div className="label">Cash</div>
            <div className="value">{eur(cash)}</div>
          </div>
          <div className="metric">
            <div className="label">Streak</div>
            <div className="value">
              {save.streak.count} {save.streak.count === 1 ? 'day' : 'days'}
            </div>
          </div>
        </div>
        <nav className="nav" aria-label="Main">
          {navItem('Map', { name: 'map' }, screen.name === 'map', 'nav-map')}
          <button type="button" className="ledger-toggle" onClick={() => openLedger(true)}>
            Ledger
          </button>
          {navItem('Progress', { name: 'progress' }, screen.name === 'progress')}
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
  const done = act.sessions.filter((s) => sessions[s.id]).length;
  return { done, total: act.sessions.length };
}

function ActMap() {
  const { save, go } = useGame();
  const resume = save.resume ? findSession(save.resume.sessionId) : null;
  return (
    <>
      <section className="hero">
        <div className="eyebrow">FIN40940 · Corporate Finance</div>
        <h1>{save.houseName}</h1>
        <p>
          Grow a fashion house from a single atelier into a takeover target. Every decision is marked like an exam script, and the house is worth
          exactly what your decisions make it.
        </p>
        {resume && (
          <button type="button" className="btn" style={{ marginTop: 8 }} onClick={() => go({ name: 'play', sessionId: resume.session.id })}>
            Resume: {resume.session.title}
          </button>
        )}
      </section>
      <div className="acts">
        {ACTS.map((act) => {
          const { done, total } = actProgress(act, save.sessions);
          const open = !act.draft;
          const bossOpen = open && act.boss && done === total;
          return (
            <article key={act.number} className={`act ${open ? 'open' : 'locked'}`}>
              <div className="numeral" aria-hidden>
                {act.numeral}
              </div>
              <div>
                <h2>
                  <span className="sr-only" style={{ position: 'absolute', left: -9999 }}>
                    Act {act.numeral}:{' '}
                  </span>
                  {act.title}
                </h2>
                <div className="meta">
                  {act.lecture} · {act.chapters}
                  {open ? ` · ${done} of ${total} sessions` : ' · arrives with the lecture'}
                </div>
                <p className="muted" style={{ margin: 0 }}>
                  {act.blurb}
                </p>
                {open && (
                  <>
                    <div className="act-bar" aria-hidden>
                      <span style={{ width: `${(done / Math.max(1, total)) * 100}%` }} />
                    </div>
                    <ul className="sessions">
                      {act.sessions.map((s, i) => {
                        const rec = save.sessions[s.id];
                        const unlocked = i === 0 || !!save.sessions[act.sessions[i - 1].id] || !!rec;
                        return (
                          <li key={s.id}>
                            <span className="sn">{i + 1}</span>
                            <span className="st">
                              <strong>{s.title}</strong>
                              <span>{s.blurb}</span>
                            </span>
                            {rec ? (
                              <span className="status done">
                                {rec.score}/{rec.max}
                              </span>
                            ) : null}
                            <button
                              type="button"
                              className={`btn small${rec ? ' ghost' : ''}`}
                              disabled={!unlocked}
                              onClick={() => go({ name: 'play', sessionId: s.id })}
                              aria-label={`${rec ? 'Replay' : 'Play'} ${s.title}`}
                            >
                              {rec ? 'Replay' : unlocked ? 'Play' : 'Locked'}
                            </button>
                          </li>
                        );
                      })}
                      {act.boss && (
                        <li>
                          <span className="sn">★</span>
                          <span className="st">
                            <strong>Boss round: {act.boss.title}</strong>
                            <span>A full written question, marked step by step.</span>
                          </span>
                          {save.bosses[act.number] && (
                            <span className="status done">
                              {save.bosses[act.number].score}/{save.bosses[act.number].max}
                            </span>
                          )}
                          <button type="button" className="btn small" disabled={!bossOpen} onClick={() => go({ name: 'boss', act: act.number })}>
                            {bossOpen ? 'Begin' : 'Locked'}
                          </button>
                        </li>
                      )}
                    </ul>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>
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
        <div className="eyebrow">Progress</div>
        <h1>Where you stand</h1>
        <p>
          {daysLeft > 0 ? `${daysLeft} days to the exam.` : 'Exam day has passed.'} Spot checks are spaced at {Math.round(intervalScale(save.settings.examDate, now) * 100)}% of
          the full interval to fit.
        </p>
      </section>
      {ACTS.filter((a) => a.concepts.length).map((a) => (
        <section key={a.number}>
          <div className="eyebrow">
            Act {a.numeral} · {a.title}
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
          <h2 style={{ fontSize: 22 }}>Spot checks due</h2>
          {due.length ? (
            <ul className="ledger" style={{ listStyle: 'none', padding: 0 }}>
              {due.map((id) => (
                <li key={id} className="spread" style={{ padding: '10px 0', borderBottom: '1px solid var(--rule)' }}>
                  <span>{CONCEPTS[id].name}</span>
                  <button type="button" className="btn small" onClick={() => go({ name: 'practice', concept: id })}>
                    Check now
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">None due. They will appear at the end of sessions as they fall due.</p>
          )}
        </section>
        <section>
          <h2 style={{ fontSize: 22 }}>Weakest concepts</h2>
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
            <p className="muted">Nothing attempted yet.</p>
          )}
        </section>
      </div>
      <p className="muted" style={{ marginTop: 28, fontSize: 13 }}>
        Value since founding: {eurSigned(save.value - STARTING_VALUE)} · Sessions played: {save.sessionsPlayed} · Concepts met:{' '}
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
        <div className="eyebrow">Settings</div>
        <h1>The house</h1>
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
        <label htmlFor="exam">Exam date (sets how far apart spot checks are)</label>
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

      <h2 style={{ fontSize: 22, marginTop: 34 }}>Moving between devices</h2>
      <p className="muted" style={{ maxWidth: 560 }}>
        Progress is saved in this browser. To carry on elsewhere, export it here and import the file on the other device.
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
              const data = await importSave(f);
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
    <main className="page" style={{ maxWidth: 680, paddingTop: '12vh' }}>
      <div className="eyebrow">FIN40940 · Corporate Finance</div>
      <h1 style={{ fontSize: 46, margin: '8px 0 18px' }}>Found a fashion house.</h1>
      <div className="prose">
        <p>
          You will grow a fictional house from one atelier into a takeover target. Each finance idea arrives when the business needs it, and every
          calculation is marked in five steps, as an examiner would: timeline, formula, inputs, answer, decision.
        </p>
        <p>Your score is the house’s value. Good decisions raise it. Bad ones destroy it.</p>
      </div>
      <div className="form-row" style={{ marginTop: 24 }}>
        <label htmlFor="name">Name of the house (you can change it later)</label>
        <input id="name" className="text-input" value={save.houseName} maxLength={40} onChange={(e) => setSave((s) => ({ ...s, houseName: e.target.value }))} />
      </div>
      <button
        type="button"
        className="btn"
        onClick={() => {
          setSave((s) => ({ ...s, houseName: s.houseName.trim() || 'Atelier Noor', createdAt: Date.now() }));
          go({ name: 'map' });
        }}
      >
        Open the doors
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
        {screen.name === 'practice' && <PracticePlayer key={screen.concept} concept={screen.concept} />}
        {screen.name === 'progress' && <Progress />}
        {screen.name === 'settings' && <Settings />}
      </main>
      <Overlays />
    </div>
  );
}
