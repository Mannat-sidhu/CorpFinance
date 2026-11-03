# Atelier Noor

A browser game that teaches FIN40940 Corporate Finance by growing a fictional fashion house. Built so far: Chapters I–IV (Lectures 1–5). The plan for the rest is in `docs/plan-acts-2-10.md`.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # solver, content and engine tests
npm run build    # static site in dist/, ready for Netlify, Vercel or GitHub Pages
```

## Layout

- `src/engine/`: no content in here.
  - `finance.ts`: every formula. All numbers shown in the game come from these.
  - `grading.ts`: the five-step process mark, the ±0.5% tolerance and error carried forward.
  - `mastery.ts`: New, Practising, Common knowledge; promotion after two clean answers in separate sittings; spot-check intervals (2, 5, 12, 25 days, scaled to the exam date).
  - `save.ts`: the `SaveStore` interface, `LocalSaveStore`, and export/import. To add cloud sync, write another `SaveStore`.
  - `types.ts`: the content contract.
- `src/content/`: one set of files per act.
  - `act-1-concepts.ts`: lessons.
  - `act-1-problems.ts`: problems; each has `base` story numbers, `vary()` for new numbers, and `build()`.
  - `act-1.ts`: sessions and the boss round.
  - Chapters II–IV follow the same three-file pattern (`act-2-*`, `act-3-*`, `act-4-*`).
  - Round types: `calc` (five moves; may add `tryRate` for YTM/IRR), `classify` (sorting), `brief` (written answers from statement cards), `table` (fill the table), `worksheet` (year-by-year project cash flows, marked row by row with error carried forward), `match` (label several real options, then pick one; any sound pick scores if the reason fits).
  - `exam-rooms.ts`: paper-style questions after each boss, played unguided. `matches.ts`: the match-and-choose rounds.
  - `acts.ts`: Acts II–X as placeholders.
- `src/ui/`: React screens.
- `tests/`: `finance.test.ts` checks the solvers against the assigned-problem answers. `content.test.ts` builds every problem with 200 random parameter sets and checks they are consistent.

## Adding an act

1. Read the lecture slides and the assigned problems for it.
2. Write `act-N-concepts.ts`, `act-N-problems.ts` and `act-N.ts` against `engine/types.ts`.
3. Register them in `content/index.ts` and replace the placeholder in `acts.ts`.
4. Add solver tests for any assigned problems with worked solutions. Run `npm test`.

## Design decisions

- **Replays use the story's numbers.** The story text names specific amounts, so replaying a session uses the same numbers and does not change the house's value. Randomised numbers appear in spot checks and ledger practice, where nothing in the story depends on them.
- **The house's value** changes only through story decisions: a deal's NPV, or the present-value saving between two options. Choosing the worse option shows the value lost.
- **Help fades** with mastery: Guided (new), Prompted (practising: formula names only, one tip per problem), Unguided (common knowledge, boss levels from Chapter III, exam rooms: one page, marked when handed in).
- **Cash and holdings** (`engine/holdings.ts`): decisions that keep paying or costing money become holdings. Each chapter is a year; flows land at the year-end screen, risky ones with a seeded draw. If cash runs out, Aoife lends at a penalty rate and the extra cost comes off the house's value. Value still scores the decision (expected NPV); cash shows what luck did.
- **Understanding gates progress.** An episode under 70% isn't cleared: the next episode, and the boss, stay locked until the clinic (fresh questions on the shaky ideas, with a second attempt that restores full help) is passed, or carried on from after two failed tries. Replays never relock an episode.
- **The notebook** (`engine/slips.ts`): every mark lost, from every round type, is written up with what went wrong and the fix, grouped by idea and by step ("where your marks go"). A slip is fixed when that idea is later answered cleanly with no tips.
- **Practice depth:** `practice-extra.ts` gives each numerical idea at least two different scenarios, so repeats aren't the same story with new numbers.
- **Hints** halve that step's mark. An answer that is wrong overall but correct given her own inputs gets full marks for the answer step (error carried forward).
