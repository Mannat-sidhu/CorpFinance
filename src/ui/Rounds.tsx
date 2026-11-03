// "Brief the board" (written answers) and table-fill rounds, plus one runner that plays any round type.
import { useMemo, useState, type ReactNode } from 'react';
import { markBrief, markTable } from '../engine/grading';
import { mulberry32, shuffle } from '../engine/rng';
import type { NewSlip } from '../engine/slips';
import type { BriefProblem, ConceptId, Outcome, Problem, TableProblem } from '../engine/types';
import { Bubble, Chat } from './Chat';
import { ClassifyRunner } from './Classify';
import { ProblemRunner, type RunMode, type RunResult } from './ProblemRunner';
import { MatchRunner } from './Match';
import { useGame } from './store';
import { WorksheetRunner } from './Worksheet';

/** What every round reports back. */
export interface RoundResult {
  score: number;
  max: number;
  /** Clean (correct, unaided) per concept the round touched. */
  clean: Record<ConceptId, boolean>;
  /** Calculation rounds only: the decision taken, for the story outcome. */
  calc?: RunResult;
  /** Other rounds with a decision (the worksheet): its consequence for the house. */
  outcome?: Outcome;
  /** Marks lost, for the notebook. */
  slips?: NewSlip[];
}

function Actions({ children }: { children: ReactNode }) {
  return <div className="step-actions">{children}</div>;
}

export function BriefRunner({ problem, seed, onDone, intro, exam }: { problem: BriefProblem; seed: number; onDone: (r: RoundResult) => void; intro?: ReactNode; exam?: boolean }) {
  const order = useMemo(() => shuffle(mulberry32(seed), problem.cards.map((_, i) => i)), [problem, seed]);
  const [chosen, setChosen] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const keys = problem.cards.filter((c) => c.kind === 'key').length;
  const result = markBrief(problem.cards, chosen);
  const toggle = (i: number) => !checked && setChosen((c) => (c.includes(i) ? c.filter((x) => x !== i) : [...c, i]));
  const complete = () => {
    const base = { concept: problem.concept, problem: problem.id, title: problem.title, step: 'point' as const };
    const slips: NewSlip[] = [
      ...problem.cards.filter((c, i) => c.kind === 'key' && !chosen.includes(i)).map((c) => ({ ...base, what: `Missed a key point: ${c.text}`, fix: c.why })),
      ...problem.cards.filter((c, i) => c.kind === 'trap' && chosen.includes(i)).map((c) => ({ ...base, what: `Used a wrong point: ${c.text}`, fix: c.why })),
    ].slice(0, 4);
    onDone({ score: result.score, max: result.max, clean: { [problem.concept]: result.clean }, slips });
  };

  return (
    <section aria-labelledby="brief-title">
      {intro}
      <div className="game-title">
        <span className="game-kind">Brief the board</span>
        <h2 id="brief-title">{problem.title}</h2>
      </div>
      <Chat beats={problem.prompt} host={problem.host} plain={exam} />
      <div className="ask-card">
        <span className="ask-tag">Explain</span>
        {problem.question}
      </div>
      <div className="panel" style={{ marginTop: 16 }}>
        <p className="step-help">
          Build your answer: pick the points you’d write. There are {keys} that earn marks. Wrong points cost one.
        </p>
        <div className="cards">
          {order.map((i) => {
            const c = problem.cards[i];
            const on = chosen.includes(i);
            const state = checked ? (c.kind === 'key' ? (on ? 'hit' : 'missed') : c.kind === 'trap' ? (on ? 'trap-hit' : 'trap') : on ? 'filler-hit' : 'filler') : '';
            return (
              <button key={i} type="button" className={`card-pick ${on ? 'on' : ''} ${state}`} aria-pressed={on} onClick={() => toggle(i)} disabled={checked}>
                <span className="card-text">{c.text}</span>
                {checked && (
                  <span className="card-why">
                    {c.kind === 'key' ? (on ? '✓ Key point. ' : '○ You missed this key point. ') : c.kind === 'trap' ? (on ? '✕ Wrong: ' : '✕ Rightly left out: ') : 'True, but not what was asked. '}
                    {c.why}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {checked && (
          <div style={{ marginTop: 18 }}>
            <Bubble beat={{ who: 'margaux', mood: result.clean ? 'happy' : 'neutral', text: result.clean ? 'That’s the answer. Here’s how I’d write it up:' : 'Here’s how I’d write it up. Copy this shape on paper:' }}>
              <p className="model-answer">{problem.model}</p>
            </Bubble>
          </div>
        )}
        <Actions>
          <span className="spacer" />
          {checked && (
            <span className="points num-tab">
              ✦ {result.score} / {result.max}
            </span>
          )}
          {!checked ? (
            <button type="button" className="btn" disabled={!chosen.length} onClick={exam ? complete : () => setChecked(true)}>
              {exam ? 'Next part' : 'Submit my answer'}
            </button>
          ) : (
            <button
              type="button"
              className="btn"
              autoFocus
              onClick={complete}
            >
              Continue →
            </button>
          )}
        </Actions>
      </div>
    </section>
  );
}

export function TableRunner({ problem, onDone, intro }: { problem: TableProblem; onDone: (r: RoundResult) => void; intro?: ReactNode }) {
  const [given, setGiven] = useState<(string | null)[][]>(() => problem.rows.map((r) => r.answers.map(() => null)));
  const [checked, setChecked] = useState(false);
  const result = markTable(problem.rows, given);
  const set = (i: number, j: number, v: string) => !checked && setGiven((g) => g.map((row, a) => (a === i ? row.map((c, b) => (b === j ? v : c)) : row)));
  const complete = given.every((row) => row.every((c) => c !== null));

  return (
    <section aria-labelledby="table-title">
      {intro}
      <div className="game-title">
        <span className="game-kind">Fill the table</span>
        <h2 id="table-title">{problem.title}</h2>
      </div>
      <Chat beats={problem.prompt} host={problem.host} />
      <div className="panel" style={{ overflowX: 'auto' }}>
        <table className="fill-table">
          <thead>
            <tr>
              <th />
              {problem.columns.map((c) => (
                <th key={c.label}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {problem.rows.map((row, i) => (
              <tr key={row.label}>
                <th scope="row">
                  {row.label}
                  {checked && <div className="row-why">{row.why}</div>}
                </th>
                {problem.columns.map((col, j) => (
                  <td key={col.label}>
                    <div className="pills" role="radiogroup" aria-label={`${row.label}: ${col.label}`}>
                      {col.options.map((o) => {
                        const on = given[i][j] === o;
                        const st = checked ? (o === row.answers[j] ? 'right' : on ? 'wrong' : '') : '';
                        return (
                          <button key={o} type="button" role="radio" aria-checked={on} className={`pill ${on ? 'on' : ''} ${st}`} onClick={() => set(i, j, o)} disabled={checked}>
                            {o}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {checked && (
          <Bubble
            beat={{
              who: 'margaux',
              mood: result.clean ? 'happy' : 'neutral',
              text: result.clean ? 'Every cell right. Lovely.' : 'Check the reasons under each row, then try it on paper.',
            }}
          />
        )}
        <Actions>
          <span className="spacer" />
          {checked && (
            <span className="points num-tab">
              ✦ {result.score} / {result.max}
            </span>
          )}
          {!checked ? (
            <button type="button" className="btn" disabled={!complete} onClick={() => setChecked(true)}>
              Check
            </button>
          ) : (
            <button
              type="button"
              className="btn"
              autoFocus
              onClick={() => {
                const slips: NewSlip[] = problem.rows
                  .map((row, i) => ({ row, i }))
                  .filter(({ row, i }) => row.answers.some((a, j) => given[i][j] !== a))
                  .slice(0, 4)
                  .map(({ row }) => ({ concept: problem.concept, problem: problem.id, title: problem.title, step: 'cell' as const, what: `Got ${row.label} wrong`, fix: row.why }));
                onDone({ score: result.score, max: result.max, clean: { [problem.concept]: result.clean }, slips });
              }}
            >
              Continue →
            </button>
          )}
        </Actions>
      </div>
    </section>
  );
}

/** Plays any kind of round. `count` limits sorting rounds (pop quizzes use 3). */
export function RoundRunner(props: RoundRunnerProps) {
  const { logSlips } = useGame();
  const { onDone } = props;
  // Every round, wherever it's played, reports the marks it lost to the notebook.
  return <Round {...props} onDone={(r) => { logSlips(r.slips ?? []); onDone(r); }} />;
}

interface RoundRunnerProps {
  problem: Problem;
  params?: unknown;
  mode: RunMode;
  seed: number;
  count?: number;
  intro?: ReactNode;
  outcomeNote?: boolean;
  /** Paper conditions: plain prompts, nothing marked on screen. */
  exam?: boolean;
  onDone: (r: RoundResult) => void;
}

function Round({
  problem,
  params,
  mode,
  seed,
  count,
  intro,
  outcomeNote,
  exam,
  onDone,
}: {
  problem: Problem;
  params?: unknown;
  mode: RunMode;
  seed: number;
  count?: number;
  intro?: ReactNode;
  outcomeNote?: boolean;
  exam?: boolean;
  onDone: (r: RoundResult) => void;
}) {
  switch (problem.kind) {
    case 'calc':
      return (
        <ProblemRunner
          problem={problem}
          params={params}
          mode={mode}
          seed={seed}
          intro={intro}
          outcomeNote={outcomeNote}
          exam={exam}
          onDone={(r) => onDone({ score: r.score, max: r.max, clean: { [problem.concept]: r.clean }, calc: r, slips: r.slips })}
        />
      );
    case 'classify':
      return <ClassifyRunner problem={problem} seed={seed} count={count} intro={intro} onDone={(r) => onDone({ score: r.score, max: r.max, clean: r.clean, slips: r.slips })} />;
    case 'brief':
      return <BriefRunner problem={problem} seed={seed} intro={intro} exam={exam} onDone={onDone} />;
    case 'table':
      return <TableRunner problem={problem} intro={intro} onDone={onDone} />;
    case 'worksheet':
      return <WorksheetRunner problem={problem} params={params} seed={seed} help={mode} intro={intro} onDone={onDone} />;
    case 'match':
      return <MatchRunner problem={problem} params={params} seed={seed} intro={intro} onDone={onDone} />;
  }
}
