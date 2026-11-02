// Chapter III: Investors at the door (Lecture 4, BMA Ch4). Player-facing text never mentions lectures.
import type { Act } from '../engine/types';

export const ACT_3: Act = {
  number: 3,
  numeral: 'III',
  title: 'Investors at the door',
  lecture: 'Lecture 4',
  chapters: 'BMA Ch4',
  blurb: 'An angel investor wants a stake. What is a share in the house worth?',
  concepts: ['stock-basics', 'ddm', 'gordon', 'payout-plowback', 'pvgo', 'multi-stage'],
  sessions: [
    {
      id: 'a3s1',
      title: 'What is a share worth?',
      blurb: 'Meet Céline, and value a rival’s shares three ways.',
      parts: [
        {
          kind: 'story',
          scene: 'Café on rue Saint-Honoré, Paris',
          beats: [
            { who: 'narrator', text: 'A Paris showroom. A woman in black studies your collection for a long time, then hands you a card.' },
            { who: 'celine', text: 'Céline. I backed two houses here, both now listed. I’d like a stake in yours.' },
            { who: 'celine', mood: 'happy', text: 'But first, show me you know what a share is worth. Start with someone else’s.' },
            { who: 'idris', mood: 'worried', text: 'A stake? Out of whose 60%, exactly?' },
          ],
        },
        { kind: 'lesson', concepts: ['stock-basics'] },
        { kind: 'problem', problem: 'primary-secondary' },
        { kind: 'lesson', concepts: ['ddm'] },
        { kind: 'problem', problem: 'one-year-price' },
        { kind: 'problem', problem: 'level-yield' },
        {
          kind: 'story',
          beats: [{ who: 'celine', text: 'Most dividends don’t stand still. Let’s value one that grows.' }],
        },
        { kind: 'lesson', concepts: ['gordon'] },
        { kind: 'problem', problem: 'gordon-d0' },
        { kind: 'spotcheck' },
      ],
    },
    {
      id: 'a3s2',
      title: 'Grow or pay out',
      blurb: 'Idris wants dividends. Céline wants growth. Who’s right?',
      parts: [
        {
          kind: 'story',
          scene: 'The boardroom · now with a real table',
          beats: [
            { who: 'narrator', text: 'Céline buys in. The first board meeting with three owners.' },
            { who: 'idris', text: 'Simple. We made a profit. Pay it out.' },
            { who: 'celine', text: 'Or reinvest it and grow. That’s where the value is.' },
            { who: 'margaux', text: 'You’re arguing about plowback. Let’s put numbers on it.' },
          ],
        },
        { kind: 'lesson', concepts: ['payout-plowback'] },
        { kind: 'problem', problem: 'sustainable-growth' },
        { kind: 'lesson', concepts: ['pvgo'] },
        { kind: 'problem', problem: 'pvgo-house' },
        { kind: 'problem', problem: 'retain-or-pay' },
        {
          kind: 'story',
          beats: [{ who: 'celine', text: 'Fast growth doesn’t last forever. Every young house slows down eventually. Value one that does.' }],
        },
        { kind: 'lesson', concepts: ['multi-stage'] },
        { kind: 'problem', problem: 'two-stage' },
        {
          kind: 'story',
          beats: [
            { who: 'celine', text: 'Enough valuing other people’s houses. Yours needs money to grow, and I have an offer.' },
            { who: 'margaux', text: 'So do others. Four ways to pay for it. None is free, and the cheapest-looking one isn’t.' },
          ],
        },
        { kind: 'problem', problem: 'growth-money' },
        { kind: 'spotcheck' },
      ],
    },
  ],
  boss: {
    title: 'Three houses',
    intro: [
      { who: 'celine', text: 'Final test before I sign. Three listed houses: Aurore, Belcour and Céleste. I can buy one.' },
      { who: 'celine', text: 'Aurore pays €10 a share forever. Belcour pays €5 next year, growing 4% a year forever. Céleste pays €5 next year, growing 20% a year until year 6, then flat.' },
      { who: 'margaux', text: 'Value them at 10%, then at 7%. On your own.' },
    ],
    problems: [
      { problem: 'gordon-d0', params: { D: 5, g: 4, r: 10, basis: 'next', market: 80, name: 'Belcour' } },
      {
        problem: 'two-stage',
        params: { D: 5, basis: 'next', g: 20, last: 6, r: 10, market: null, compare: [{ label: 'Aurore', value: 100 }, { label: 'Belcour', value: 250 / 3 }], name: 'Céleste' },
      },
      {
        problem: 'two-stage',
        params: { D: 5, basis: 'next', g: 20, last: 6, r: 7, market: null, compare: [{ label: 'Aurore', value: 10 / 0.07 }, { label: 'Belcour', value: 5 / 0.03 }], name: 'Céleste' },
      },
      { problem: 'growth-premium' },
    ],
    paper: [
      { ref: 'Ch4 Q1', note: 'Price from next year’s dividend and price.' },
      { ref: 'Ch4 Q2', note: 'Return implied by a level dividend.' },
      { ref: 'Ch4 Q3', note: 'Constant growth.' },
      { ref: 'Ch4 Q4', note: 'What the market pays for growth.' },
      { ref: 'Ch4 P18', note: 'Three stocks at 10% and 7%.' },
      { ref: 'Ch4 P19', note: 'Dividend just paid; nominal and real.' },
      { ref: 'Stock A/B', note: 'Payout, sustainable growth, value.' },
    ],
  },
};
