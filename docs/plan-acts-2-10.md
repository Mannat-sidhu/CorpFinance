# Atelier Noor: plan for Chapters II–X

Status: **agreed 31 October 2026. Built: engine features E1, E2 (via existing streams), E3, E4, E5, E7; Chapters II–V.** Chapters VI–X wait for their slides (Lecture 7 onwards).

**Revision, 31 October 2026:** the game felt one-directional and spoon-fed. §7 adds fading help, real cash with consequences, a match-and-choose round and exam-style questions for Chapters I–IV. **Approved and built (F1–F4) for Chapters I–IV.**

Sources used:
- Lectures 3, 4 and 5: slides read.
- Problem sets: Ch3 (with worked solutions), Ch4 and Ch5–6 (questions only).
- The 2022 past paper.
- Lectures 6–12: no slides in the folder yet, so those chapters are planned from the textbook (BMA 14e Ch7–9, 15–18, 32). They must be checked against the slides when they arrive.
- Class Notes 3–7 are handwritten scans with no readable text, so they weren't used.

The player never sees lecture or textbook references. Those stay in this plan and in code comments.

---

## 1. What the 2022 paper tells us

- **Format:** 4 questions × 25 marks in 120 minutes, "show your workings". That is about 30 minutes a question, so roughly 1 mark a minute.
- **The mix:** about two-thirds calculation, one-third short written answers:
  - **Calculation:** CAPM, WACC for three firms, semi-annual bond, monthly mortgage, payback / NPV / capital rationing for two projects.
  - **Written:** semi-strong efficiency, debt and WACC, the trade-off theory, two bad reasons for mergers, how agency costs arise and two remedies, merger type and motives, and a table on dividends v. buybacks.
- **Different coordinator** (Dr Tiffany Thng), so treat it as a guide to style, not to syllabus.

**What this changes in the plan:**
- **Written answers need their own round type.** Act I only has sorting rounds; see §3, "Brief the board".
- **Multi-part questions over one data set** are the norm, for example Project X/Y asking for (i) payback, (ii) NPV, (iii) capital rationing, (iv) is IRR usable? Boss levels should copy this shape.
- **Fill-the-table questions** need a grid version of the sorting round.

---

## 2. Chapter order and episode count (20 in total)

| Ch | Title | Lecture | Episodes | New cast |
|---|---|---|---|---|
| I | The atelier | L1–2 | 4 (built) | — |
| II | Borrowing to grow | L3 Bonds | 2 | Rupert (banker) |
| III | Investors at the door | L4 Stocks | 2 | Céline (angel investor) |
| IV | The collection decision | L5 Capital budgeting | 4 | Saoirse and Kenji (heads of new lines) |
| V | What investors want | L6–7 Risk and return | 2 | — |
| VI | Debt or equity | L8 Capital structure | 2 | — |
| VII | The hurdle rate | L9 Cost of capital | 1 | — |
| VIII | Valuing the maison | L10 Financing and valuation | 1 | — |
| IX | Paying the family | L11 Payout | 1 | — |
| X | The conglomerate calls | L12 M&A | 1 | Lucien Arnault (luxury group chief) |

**Decided:** the brief's VI and VII are swapped so the game follows the lecture order (L8 before L9). The WACC chapter comes after the player has seen how debt changes risk, which is what "How does debt affect WACC?" (2022 Q2a-ii) needs.

**Cast:** six new faces at most across the whole game. The existing cast keeps returning: Theo pitches projects, Idris pushes deals, Aoife lends, Mrs Ferriter offers a building.

---

## 3. New engine features needed

Each is built once and reused by every chapter after it. Content stays as data files, as in Act I.

| # | Feature | What it does | First used |
|---|---|---|---|
| E1 | **Try-a-rate widget** | For YTM and IRR, which have no formula. The player guesses a rate and sees the PV/NPV at that rate, then narrows in. This is the trial-and-error method a non-programmable calculator forces, and it is marked on the final rate (±0.05 percentage points). | II |
| E2 | **Uneven cash-flow timeline** | A different amount in each year, typed into each period. Act I only has level streams. | III, IV |
| E3 | **Cash-flow worksheet move** | Replaces "Map the cash" for project questions: a grid with rows for revenue, costs, depreciation, tax, operating cash flow, working capital and salvage, by year. Marked row by row, with error carried forward between rows. The biggest single build. | IV |
| E4 | **Brief the board** (written answers) | The player builds an answer from statement cards: pick the right points out of about 7, some of them traps, then optionally add a line of their own. Marked against key points, like an examiner's scheme. Ends with Margaux's model paragraph to copy out on paper. | II (credit risk), then most chapters |
| E5 | **Table-fill round** | A grid of Increases / Decreases / Unchanged, or similar (2022 Q3a). An extension of the sorting round. | IX, also II and VI |
| E6 | **Sandbox scenes** | A slider the player plays with before the question. Diversification: add stocks and watch risk fall to the market level. Leverage: slide debt up and watch equity returns swing and distress risk rise. Not marked. | V, VI |
| E7 | **Multi-part boss levels** | One data set, parts (a)–(d), each marked in moves, with an exam-style marks total. | II onwards |
| E8 | **Charts** | Small inline SVG charts: price–yield curve, the security market line, value against debt for the trade-off theory. Used in cheat cards and sandboxes. | II, V, VI |

---

## 4. Chapter by chapter

Notation for problems: **story numbers** are the fixed numbers used in the episode; **vary** means the ranges used for pop quizzes and practice. Where an assigned problem has a worked answer, its numbers are reused with a fashion-house setting and become a solver test.

### Chapter II · Borrowing to grow (bonds)

*Story:* the house needs €1m for a second atelier and issues its first bond. Rupert, a smooth investment banker, runs the issue. Then rates rise and a ratings agency downgrades the house.

**Episode 1 · The bond issue**
- **Ideas:** what a bond is (face value, coupon, coupon rate, maturity, the indenture and trustee; sorting round); pricing with annual coupons; semi-annual coupons (rate ÷ 2, periods × 2); yield to maturity.
- **Problems:**
  - Pricing the house's 10-year 5% bond at a 6% market yield → 92.64 per 100 *(Ch3 P3)*.
  - Semi-annual: 10-year 5.5% coupon, YTM 5.2% → 1,023.16 *(Ch3 P5a)*, plus a 2022-style one: 7-year 7% coupon at 4% → premium.
  - YTM by trial and error: price 950, 5% coupon, 3 years → **6.90%** (uses E1). The slide gives 6.53%, but that rate reprices the bond to 959.50, not 950.
- **Traps to train:** C = coupon rate × face; semi-annual halving; the timeline of a bond (coupons years 1–T, face at T).

**Episode 2 · Rates rise, the rating falls**
- **Ideas:**
  - prices and yields move in opposite directions;
  - premium, discount and par;
  - pull to par;
  - longer bonds carry more interest-rate risk;
  - default risk, credit ratings, investment grade (BBB and above) v. junk, the default premium widening in recessions;
  - real v. nominal rates.
- **Problems:**
  - Yields jump from 6% to 8%: the house's 6% bond falls from 1,000 to 865.80 *(Ch3 P1)*.
  - Premium or discount and pull to par: table-fill (E5) *(Ch3 P2, P4)*.
  - 5-year v. 10-year price changes, with a price–yield chart (E8) *(Ch3 P5b–d)*.
  - Real rate: 10% nominal, 5% inflation → 4.76% *(Ch3 P6)*.
  - Real return over two years: 16.64% nominal, 7.85% real *(Ch3 P7)*.
  - Brief the board: "Why does our new bond pay more than a government bond?"
- **Boss:** one bond, four parts: the price; a premium or discount call; the new price after a rate rise; the real yield.
- **Paper:** Ch3 P1–P7.
- **Reuse:** Act I annuities (the coupon stream is an annuity) and EAR.

### Chapter III · Investors at the door (stocks)

*Story:* Céline, an angel investor who has backed two Paris labels, wants a stake. What is a share worth? Idris wants to keep paying himself dividends; Céline wants the profits put back into growth.

**Episode 1 · What is a share worth?**
- **Ideas:** what common stock is (residual claimant, limited liability, votes; the primary market of VC, IPO and SEO v. the secondary market; sorting round); the dividend discount model; one-year price, P₀ = (D₁ + P₁)/(1 + r); level dividends; constant growth (Gordon); D₁ v. D₀; nominal v. real dividends.
- **Problems:**
  - One-year: $5 dividend, $110 price after it, at 8% *(Ch4 Q1)*.
  - Level dividend: what return does a $5 dividend at a $40 price imply? *(Q2)*
  - Gordon: D₁ = 10, g = 5%, r = 8% *(Q3)*.
  - Gordon from the slides: D₁ = 1.06, g = 6%, r = 20% → 7.57.
  - D₀ trap: dividend of 1.35 just paid, growing with 2.75% inflation, at 9.5%; then redo it in real terms *(Ch4 P19)*.

**Episode 2 · Grow or pay out**
- **Ideas:** payout and plowback ratios; g = ROE × plowback; PVGO (P₀ = EPS₁/r + PVGO); what is and isn't a growth stock; multi-stage growth.
- **Problems:**
  - Stocks A and B: payout ratios, growth rates, values at 15% *(the Stock A/B question)*.
  - PVGO as in the slides' ABC Software: EPS 8.33, payout 0.6, ROE 25%, r = 15% → 100 v. 55.56, so PVGO = 44.44.
  - What is the market paying for growth? *(Ch4 Q4)*
  - Multi-stage: D₀ = 1, 6% growth for 7 years, then zero, at r = 20% → 6.49 (slides).
  - The decision: "Should the house retain profits?" Only if ROE > r.
- **Boss:** three stocks A, B and C at r = 10% and then 7%: which is worth most? *(Ch4 P18)*
- **Paper:** Ch4 Q1–4, 18, 19, Stock A/B.
- **Reuse:** Act I growing perpetuity (Gordon is the same formula), the C₁ v. C₀ trap, real v. nominal from Chapter II.
- **Gap:** the brief mentions an Nvidia multi-stage example, but the slides show a generic one. I'll use the slide example unless you have the Nvidia one.

### Chapter IV · The collection decision (capital budgeting): 4 episodes, the heaviest

*Story:* three pitches for a new line, each with a hidden trap.
- **Theo:** a quick-payback scarf line.
- **Saoirse:** a leather goods workshop. Big, slow and lucrative, with IRR traps.
- **Kenji:** making buttons in-house instead of buying them. Working capital and opportunity cost traps.

**Episode 1 · Three pitches (the decision rules)**
- **Ideas:** NPV as the rule; payback and its flaws; the accounting rate of return and its flaws.
- **Problems:**
  - Payback v. NPV for projects A, B and C with cut-offs of 2 and 3 years and r = 10% *(Ch5 P1)*.
  - ARR from the slides' Spiral Corp example → 14%.
  - Brief the board: "Why is payback dangerous?"

**Episode 2 · The IRR trap**
- **Ideas:** IRR (uses E1); IRR v. NPV; multiple IRRs from sign changes; mutually exclusive projects; incremental IRR.
- **Problems:**
  - IRR of −100, 50, 50, 50 → 23.38% (slides).
  - Multiple IRRs: −30, then 10 a year for 9 years, then −65 → 3.50% and 19.54% (slides; a sorting round on "which IRR do you trust?").
  - Saoirse's mutually exclusive pair → incremental IRR *(Ch5 P10 Alpha/Beta and P12 A/B)*.

**Episode 3 · Building the cash flows** (worksheet, E3)
- **Ideas:** cash flow, not profit; after-tax; incremental; sunk costs; opportunity costs; depreciation tax shield; working capital (in, then recovered); after-tax salvage.
- **Problem:** Better Mousetrap rebuilt as the house's new handbag line *(Ch5–6 P14)*: $6m equipment, 5-year straight-line, salvage $0.5m, working capital at 10% of next year's sales, costs 25% of revenue, tax 25%, r = 12%. Full worksheet, then NPV.

**Episode 4 · Make or buy**
- **Problem:** Kenji's buttons, rebuilt from the lids problem *(P15)*: 200,000 units, buy at 2.00 or make at 1.50, machine 150,000 written off at once, extra working capital 30,000 recovered after 10 years, tax 21%, r = 15%.
- **Sorting round:** "Is it a cash flow for this project?" Sunk market research, the studio space you'd otherwise rent out, allocated overheads, and so on.
- **Capital rationing** with the profitability index (2022 Q4a-iii), as one problem.

**Boss:** a 2022-style two-project question with (i) payback, (ii) NPV at 12%, (iii) capital rationing, and (iv) "Can IRR be used here?", with sign changes in one project. Uses the paper's Project X/Y numbers.

**Paper:** Ch5–6 P1, 10, 12, 14, 15.

**Reuse:** Act I NPV and annuities; Chapter II's try-a-rate.

### Chapter V · What investors want (risk and return) ⚠ no slides yet

*Story:* the house has spare cash and Margaux wants it invested properly, not in Idris's friends' companies.

- **Episode 1 · Don't put it all in silk**
  - **Ideas:** returns, average return, variance and standard deviation; the risk premium; diversification (sandbox, E6); company-specific v. market risk; two-asset portfolio return and variance.
- **Episode 2 · Beta**
  - **Ideas:** beta as market risk; CAPM, r = r_f + β(r_m − r_f); the security market line (chart, E8).
  - **Problems:** the 2022 Q1(a) table, solving for return or beta in each row (r_f = 1.5%, r_m = 6.3%), then "Which asset has the most systematic risk?"
- **Boss:** a CAPM table with four assets, plus a two-asset portfolio's expected return and beta.
- **Formula sheet:** add only the formulas the L6–7 slides give.
- **The efficient-market hypothesis** (2022 Q1c) is left out unless the slides cover it: it is textbook Ch12, which isn't on this year's lecture list.

### Chapter VI · Debt or equity (capital structure, L8) ⚠ no slides yet

*Story:* Céline wants the house to borrow heavily and buy back Idris's shares. A leverage sandbox shows what that does.

- **Episode 1 · The leverage slider**
  - **Ideas:** MM Proposition I (with no taxes, the debt–equity mix doesn't change value); MM II (equity risk and the cost of equity rise with debt); leverage and EPS swings (sandbox).
  - **Problems:** r_E = r_A + D/E (r_A − r_D); a return table across good and bad years at two leverage levels.
- **Episode 2 · Taxes and trouble**
  - **Ideas:** the interest tax shield, with PV = T_c × D for permanent debt; financial distress costs; the trade-off theory (chart, E8); the pecking order.
  - **Problems:**
    - Value of the house with €2m of permanent debt at 25% tax.
    - Brief the board: "Explain the trade-off theory" (2022 Q3b).
    - Sorting: which firms should borrow more? (Stable cash flows and tangible assets, or a risky start-up.)
- **Reuse:** Chapter II bonds reprice as the house's rating falls with leverage, as the brief asked.

### Chapter VII · The hurdle rate (cost of capital, L9) ⚠ no slides yet

*Story:* Theo launches a streetwear line and judges it at the house's WACC. It looks great, then it fails.

- **One episode.**
- **Ideas:** WACC, using the after-tax cost of debt and CAPM for the cost of equity; company v. project cost of capital; asset betas (if the slides have them).
- **Problems:**
  - WACC for three firms (2022 Q2a-i), with r_f 1.5%, r_m 6.63%, tax 32%.
  - The streetwear line: wrong rate v. right rate, and the decision flips.
  - Brief the board: "How does more debt affect WACC?"
- **Boss:** a two-part question: WACC, then the project decision at the right rate.

### Chapter VIII · Valuing the maison (L10) ⚠ no slides yet

*Story:* before any sale, Margaux values the house two ways and they must agree.

- **One episode.**
- **Ideas:** free cash flow; terminal value as a growing perpetuity (Act I again); the WACC method; adjusted present value (APV = base-case NPV + PV of financing side effects).
- **Problems:** the house valued with WACC, then with APV on the same numbers.

### Chapter IX · Paying the family (L11) ⚠ no slides yet

*Story:* Idris wants a big dividend; Céline prefers a buyback. How will the market react?

- **One episode.**
- **Ideas:** cash dividends v. repurchases; MM dividend irrelevance; signalling.
- **Problems:**
  - Table-fill (E5): effect on firm value, number of shares and share price (2022 Q3a).
  - Share price before and after each, with the numbers.
  - Brief the board: "Why did the share price jump when we announced a dividend increase?"

### Chapter X · The conglomerate calls (M&A, L12) ⚠ no slides yet

*Story:* Lucien Arnault's luxury group bids for Atelier Noor. The final decision of the game.

- **One episode.**
- **Ideas:** types of merger (horizontal, vertical, conglomerate; sorting, 2022 Q4b); sensible motives v. dubious ones such as diversification and EPS bootstrapping (2022 Q3c); synergies, gain = PV_AB − (PV_A + PV_B); cost of a cash offer v. a stock offer; who gains.
- **Problems:** the cash bid v. the stock bid. Which should the owners take, and how much of the synergy do they keep?
- **Finale:** the house's final value is your score.

### Finale · Exam mode (after all chapters)

- **Shape:** 4 mixed questions × 25 marks, 120 minutes, no tips and no Margaux, mirroring the 2022 paper.
- **Fresh numbers each attempt**, from each problem's vary().
- **Score report** by topic and by move. Timeline and inputs errors are reported separately, because those were her slips in the mock.

---

## 5. Build order (when we execute)

1. **Engine features E1, E2, E4, E5 and E7**, needed from Chapter II on, each with tests.
2. **Chapters II and III**: material already taught. Then you play them.
3. **E3 (worksheet), then Chapter IV.** Give it the most care.
4. **E6 and E8, then Chapters V to X**, one chapter per lecture as the slides arrive. Check each against its slides.
5. **Exam mode and an upgraded progress screen.**

At every step: a solver test for each assigned problem with a known answer; the 200-variation content test; a play-through of each episode.

---

## 6. Decisions (agreed 31 October 2026)

1. **Lecture 6–7 slides:** you'll add them to the folder. Chapter V is built from them, not from the textbook.
2. **Chapters VI and VII swapped** to follow the lecture order: capital structure (L8), then cost of capital (L9).
3. **Capital rationing and the profitability index:** included in Chapter IV as one problem.
4. **The efficient-market hypothesis:** left out unless a lecture covers it.
5. **Written answers:** statement cards, marked automatically against key points ("Brief the board").
6. **New cast:** Rupert, Céline, Saoirse, Kenji and Lucien, as proposed.

---

## 7. Revision: less spoon-feeding, more consequences (built, 31 October 2026)

Four additions. All four go into Chapters I–IV first, then every chapter after.

### F1 · Help that fades

Today every problem gets the same help: named moves, a shortlist of about four formulas with the maths shown, Margaux's lesson just before, and a hint on every move. From now on, help depends on how well you know the concept, and it fades one level at a time:

| Level | When | What you get |
|---|---|---|
| **Guided** | A concept is **New** | As now. |
| **Prompted** | The concept is **Practising** | Formula choices show names only, not the maths, and the list widens to every method from this chapter. No lesson replay before the problem (still in the ledger). One hint per problem, not per move. |
| **Unguided** | The concept is **Common knowledge**, all boss levels from Chapter III, and every exam-room question (F4) | One plain paragraph, with the numbers you need and some you don't. The moves aren't named: you see "Show your working", then the timeline, formula, inputs and answer as blank boxes. The formula list is every method unlocked so far. No hints. Feedback comes only after you submit. |
| **Exam** | Exam mode at the end | As Unguided, plus a clock, and no Margaux. |

Marking is the same five-step process mark at every level. Less help means a harder path to the same marks, not fewer marks. A clean Unguided answer earns a small value bonus, a reason to take the harder path.

### F2 · Cash, holdings and consequences

The house already shows cash, but nothing uses it. From now on:

- **Cash is the bank balance; value is what the house is worth.** Value stays the skill score (NPV of your decisions at the time you make them). Cash is what actually happens.
- **Each chapter is a year of story time.** Between chapters a **year-end screen** shows money in and out: coupons paid, project cash flows received, lease payments, dividends. Each line names the decision it came from.
- **Holdings:** every decision you sign becomes a holding with its own cash flows: Ch I's lease or purchase, Ch II's bond (size and term), Ch III's stake sold to Céline (your ownership %), Ch IV's projects.
- **Later chapters use your holdings as their numbers.** Examples:
  - Ch IV's capital-rationing budget is your actual cash.
  - Ch VI's leverage question uses the debt you issued in Ch II.
  - Ch X's bid pays you your ownership share, so selling too much to Céline in Ch III costs you at the end.

  Problems already have `vary()` ranges, so a holding just fills the parameters inside those ranges; the 200-variation tests still cover every case.
- **Running short:** if a decision needs more cash than you have, you can borrow from Aoife at a penalty rate (a cost you can calculate) or pass. There is no game over.
- **Risk with real outcomes:** a risky choice has a spread of possible cash results. The draw is seeded and shown at year end ("the silk harvest failed: −€40,000"). Value still credits the expected NPV, so a good decision isn't punished for bad luck; cash shows what luck did.
- **Replays:** replaying an old episode is practice. It never changes holdings.
- **Existing saves** get default holdings that match the story's choices, so your current progress carries over.

### F3 · Match and choose (new round type)

A round with 3–4 real options, laid out side by side with their numbers (cost, NPV, IRR, payback, risk; some cells left for you to work out).

1. **Match:** pair each option with a label: *Safest*, *Highest expected reward*, *Most value per euro*, *Fastest cash back*, *Destroys value*. Marked: this tests the logic, and some labels need a quick calculation first (e.g. PI).
2. **Choose:** pick the one you go ahead with. Any option that doesn't destroy value is accepted, and you pick a reason that has to match the label you gave it ("B, because it's the safest and our cash is thin"). The reason is marked for consistency, not for which option you chose.
3. **Consequence:** your choice becomes a holding (F2). The safe option gives steady cash; the high-reward one gives a wider spread; a value-destroying pick loses value as now.

Where it appears:

| Ch | Choice |
|---|---|
| I | Lease, buy, or a shorter lease with an option to buy |
| II | Short or long bond, small or large issue |
| III | Céline's stake, a bank loan, or keep growing on profits |
| IV | Capital rationing: three packages under your real budget (replaces the single PI problem) |
| V | Portfolio mixes |
| VI | Debt level |
| IX | Dividend, buyback, or retain |
| X | Cash bid or stock bid |

### F4 · The exam room (Chapters I–IV now, every chapter later)

A level after each boss, unlocked when the boss is beaten. It has 3–4 **Unguided** questions written like the paper: plain prose, no character bubbles, extra data, and each needing two or more ideas combined, with no formula hint. Drafts, to be checked against the problem sets and the 2022 paper before building:

- **Chapter I:**
  - A loan quoted at an APR, paid monthly, deferred by a year.
  - A growing annuity that starts in year 3.
  - Lease v. buy with different payment timings.
- **Chapter II:**
  - A bond two years after issue, semi-annual coupons, after a yield change: its price and the holding-period return.
  - YTM, then the real yield.
- **Chapter III:**
  - Two-stage growth, where you must work out g from ROE and plowback first, then PVGO.
  - Valuing with D₀ given in real terms.
- **Chapter IV:**
  - A worksheet with a sunk cost, an opportunity cost and allocated overheads mixed into the data, and no rows labelled for you.
  - Incremental IRR v. NPV, with the projects' scales hidden.

Each question has its own answer and is graded by the same engine.

### Build order for §7

1. F1 (help levels): engine plus the problem runner. The quickest win.
2. F4 exam rooms for Chapters I–IV, using F1's Unguided level.
3. F2 (cash, holdings, year-end screen) and its save migration.
4. F3 (match and choose), placed in Chapters I–IV.
5. Then Chapter V onwards with all four built in.

### As built (differences from the draft above)

- **F1:** in story episodes a Common-knowledge idea is still handled by Margaux (the CFO card), to keep the story moving; Unguided play happens in pop quizzes, ledger practice, boss levels from Chapter III, and exam rooms. Unguided rounds are one page ("Show your working") and are marked only when handed in. "Discount each cash flow and add" is always accepted for finite streams.
- **F2:** the house now has a base holding, its own trading profit (€60,000 a year, growing 3%, ±15%), so commitments like salaries don't drain cash with nothing coming in. Holdings exist for: laser cutter, design prize (if declined), both royalties (if kept), the studio rent, Bríd's pay, the bank loan, the bond's coupons and principal, the scarves, the restoration lease, the buttons, and every match-and-choose pick. The handbag line (€m scale) stays value-only. A year-end node follows each boss; years close in order.
- **F3:** the four rounds are *Four ways to spend* (I), *Where to park the cash* (II), *Paying for the next step* (III) and *This year's budget* (IV, after the PI practice round). Unaffordable picks are allowed, with a warning that Aoife will cover the gap at a penalty rate. Ownership after selling a stake is not tracked yet; Chapter X will need it.
- **F4:** 9 questions: I × 3, II × 2, III × 2, IV × 2. First completion adds up to €2,000 a question to house value, in proportion to the marks.

## 8. Learning loop (built, 3 November 2026)

- **Gating:** an episode is cleared at 70% of its marks, or by passing Margaux's clinic. Old saves count as cleared.
- **Clinic:** up to three of the episode's shaky ideas, one fresh question on each (a different problem than the episode used where one exists), prompted help first and full help on a retry. After two failed tries there is "Carry on anyway", so nobody is stuck.
- **Notebook:** `slips` in the save. Every round type reports its lost marks (calc by move, worksheet rows, match labels, table rows, written points, sorting items). The screen shows where marks go by step, with advice for the biggest, and a drill for the idea with the most open slips.
- **Practice depth:** 18 new scenarios (perpetuities, growing and delayed perpetuities, PV/FV, loans, bonds, payout, two-stage, ARR, IRR, depreciation shield, salvage). Chapters V–X should ship with at least two scenarios per idea.
- **Exam mode (built):** see the README. Chapters V–X must add their own question to the blueprint in `content/paper.ts` (weights must still total 25 a question).
- **Not built yet:** predict-before-reveal prompts, worked-example fading in lessons, mixed cross-chapter review sets.

## 9. Chapter V as built (4 November 2026, from Lecture 6, the Statistics Recap and the Ch7–8 problem set)

- **Source note:** Lecture 6 covers the whole of the planned Chapter V (returns through market efficiency) and CAPM, so Chapter V is four episodes: *Where the surplus should go* (returns, risk premium, SD), *Don't put it all in silk* (covariance, portfolios, diversification), *The price of risk* (beta, CAPM), *The right mix* (market plus risk-free, efficient portfolios, market efficiency, and a match-and-choose round on the real surplus).
- **Boss:** *The investment committee*: the Ch8 P9 CAPM numbers (rf 4%, rm 12%), P24's portfolio, the slides' 10%/15% mix, and a written answer. **Exam room:** beta from five years of data into CAPM; a risk budget in the market plus bills.
- **No new cast.** Rupert, Idris, Céline, Theo and Aoife carry it.
- **Not on the formula sheet:** none of the Chapter V formulas is among the seven provided. Every lesson says so.
- **Mock paper:** now five topics; each sitting draws four.
- **Gaps:** Ch7 P11 (variance of two stocks from monthly data) and P18 (the safest portfolio with a stock you can't sell) have no dedicated problem; P11 is the same calculation as `stock-sd` and `two-stock-cov`. Ch8 P2(b) (which action gives the safest portfolio) is covered by `portfolio-beta`'s explanation.
- **Lecture 7 and later:** still to come. When it arrives, add the next chapter the same way.
