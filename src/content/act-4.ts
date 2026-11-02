// Chapter IV: The collection decision (Lecture 5, BMA Ch5–6). Player-facing text never mentions lectures.
import type { Act } from '../engine/types';

export const ACT_4: Act = {
  number: 4,
  numeral: 'IV',
  title: 'The collection decision',
  lecture: 'Lecture 5',
  chapters: 'BMA Ch5–6',
  blurb: 'Three managers pitch new lines. Each pitch hides a trap.',
  concepts: ['payback', 'arr', 'irr', 'irr-pitfalls', 'incremental-irr', 'incremental-cf', 'depreciation-tax', 'working-capital', 'salvage', 'profitability-index'],
  sessions: [
    {
      id: 'a4s1',
      title: 'Three pitches',
      blurb: 'Payback, book returns, and why only NPV can be trusted.',
      parts: [
        {
          kind: 'story',
          scene: 'The studio · pitch day',
          beats: [
            { who: 'narrator', text: 'Budget season. Three managers, three new lines, one pot of money.' },
            { who: 'theo', mood: 'happy', text: 'Scarves! Quick to make, quick to sell, pays for itself in no time.' },
            { who: 'saoirse', text: 'Saoirse, leather goods. I want a proper workshop. It’s slow, but the payoff is huge.' },
            { who: 'kenji', text: 'Kenji, menswear. I have a spreadsheet about buttons.' },
            { who: 'margaux', text: 'Every pitch sounds good. Let’s find the trap in each.' },
          ],
        },
        { kind: 'lesson', concepts: ['payback'] },
        { kind: 'problem', problem: 'theo-scarves' },
        { kind: 'problem', problem: 'payback-table' },
        { kind: 'lesson', concepts: ['arr'] },
        { kind: 'problem', problem: 'arr-spiral' },
        { kind: 'spotcheck' },
      ],
    },
    {
      id: 'a4s2',
      title: 'The IRR trap',
      blurb: 'Saoirse speaks in rates. Learn when rates lie.',
      parts: [
        {
          kind: 'story',
          scene: 'Saoirse’s bench · offcuts everywhere',
          beats: [
            { who: 'saoirse', text: 'I don’t think in NPVs. I think in returns. What does it earn, as a percentage?' },
            { who: 'margaux', text: 'That’s the IRR. Useful, until it isn’t. I’ll show you both sides.' },
          ],
        },
        { kind: 'lesson', concepts: ['irr'] },
        { kind: 'problem', problem: 'irr-basic' },
        {
          kind: 'story',
          beats: [{ who: 'saoirse', mood: 'worried', text: 'There’s a beautiful listed building. But the lease has a nasty clause at the end.' }],
        },
        { kind: 'lesson', concepts: ['irr-pitfalls'] },
        { kind: 'problem', problem: 'multiple-irr' },
        {
          kind: 'story',
          beats: [
            { who: 'theo', mood: 'happy', text: 'Simple: the small workshop has the bigger IRR. Done.' },
            { who: 'margaux', text: 'Bigger percentage, smaller project. Let’s check what the extra money earns.' },
          ],
        },
        { kind: 'lesson', concepts: ['incremental-irr'] },
        { kind: 'problem', problem: 'incremental-irr' },
        { kind: 'spotcheck' },
      ],
    },
    {
      id: 'a4s3',
      title: 'Building the cash flows',
      blurb: 'The handbag line, year by year: tax, working capital and salvage.',
      parts: [
        {
          kind: 'story',
          scene: 'Margaux’s office · late',
          beats: [
            { who: 'saoirse', mood: 'happy', text: 'The handbag line. Sales forecasts, costs, the lot. It makes a profit every single year.' },
            { who: 'margaux', text: 'Profit isn’t cash. We’re building the cash flows from scratch, row by row.' },
          ],
        },
        { kind: 'lesson', concepts: ['incremental-cf'] },
        { kind: 'problem', problem: 'cash-flow-or-not' },
        { kind: 'lesson', concepts: ['depreciation-tax', 'working-capital', 'salvage'] },
        { kind: 'problem', problem: 'handbag-worksheet' },
        { kind: 'spotcheck' },
      ],
    },
    {
      id: 'a4s4',
      title: 'Make or buy',
      blurb: 'Kenji’s buttons, and a budget too small for everything.',
      parts: [
        {
          kind: 'story',
          scene: 'The button drawer',
          beats: [
            { who: 'kenji', text: 'We spend a fortune on buttons. I can make them cheaper. I’ve left out the working capital: it comes back anyway.' },
            { who: 'margaux', mood: 'worried', text: '“Comes back anyway.” Famous last words.' },
          ],
        },
        { kind: 'problem', problem: 'make-or-buy' },
        {
          kind: 'story',
          beats: [
            { who: 'idris', text: 'Lovely projects, all of them. But the bank will only lend us €300,000 this year.' },
            { who: 'margaux', text: 'Then the question changes: not “is it positive?” but “what gives the most per euro?”' },
          ],
        },
        { kind: 'lesson', concepts: ['profitability-index'] },
        { kind: 'problem', problem: 'capital-rationing' },
        {
          kind: 'story',
          beats: [
            { who: 'margaux', text: 'That was the practice round. Now the real one: our own bank balance is the budget.' },
            { who: 'margaux', text: 'Whatever you pick will pay out, or not, for the next six years.' },
          ],
        },
        { kind: 'problem', problem: 'budget-packages' },
        { kind: 'spotcheck' },
      ],
    },
  ],
  boss: {
    title: 'Project X or Project Y',
    intro: [
      { who: 'narrator', text: 'Year-end. Two finalists, and the board wants a full paper on them.' },
      { who: 'theo', text: 'Project X: €21,000 now, then €5,500, €9,000, €30,200 and finally −€580 in year 4.' },
      { who: 'saoirse', text: 'Project Y: €12,600 now, then €1,200, €15,000, −€1,600 and €4,500.' },
      { who: 'margaux', text: 'Cost of capital 12%. Payback, NPVs, the rationing call, and whether IRR is any use. Five parts. No help.' },
    ],
    problems: [
      { problem: 'payback-period', params: { name: 'Project Y', flows: [-12600, 1200, 15000, -1600, 4500], cutoff: 2 } },
      { problem: 'project-npv', params: { name: 'Project X', flows: [-21000, 5500, 9000, 30200, -580], r: 12, who: 'theo' } },
      { problem: 'project-npv', params: { name: 'Project Y', flows: [-12600, 1200, 15000, -1600, 4500], r: 12, who: 'saoirse' } },
      { problem: 'pi-pair' },
      { problem: 'irr-usable' },
    ],
    paper: [
      { ref: 'Ch5 P1', note: 'Payback with 2- and 3-year cut-offs, and NPV at 10%.' },
      { ref: 'Ch5 P10', note: 'Alpha v. Beta: incremental IRR.' },
      { ref: 'Ch5 P12', note: 'Explaining incremental IRR to Mr Clops.' },
      { ref: 'Ch6 P14', note: 'Better Mousetrap: the full cash-flow worksheet.' },
      { ref: 'Ch6 P15', note: 'Make or buy, with working capital.' },
    ],
  },
};
