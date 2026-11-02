// Chapter II: Borrowing to grow (Lecture 3, BMA Ch3). Player-facing text never mentions lectures.
import type { Act } from '../engine/types';

export const ACT_2: Act = {
  number: 2,
  numeral: 'II',
  title: 'Borrowing to grow',
  lecture: 'Lecture 3',
  chapters: 'BMA Ch3',
  blurb: 'Issue your first bond. Then rates rise and the rating agency comes calling.',
  concepts: ['bond-basics', 'bond-price', 'premium-discount', 'bond-semiannual', 'price-yield', 'ytm', 'credit-risk', 'real-nominal'],
  sessions: [
    {
      id: 'a2s1',
      title: 'The bond issue',
      blurb: 'Meet Rupert, price a bond, and spot a premium from a discount.',
      parts: [
        {
          kind: 'story',
          scene: 'A private dining room, Merrion Row',
          beats: [
            { who: 'narrator', text: 'Two years in. Orders from Paris and Milan. The house needs €1 million for a second atelier.' },
            { who: 'rupert', mood: 'happy', text: 'Rupert. Pleasure. Banks are so tiresome, aren’t they? Let’s borrow straight from investors instead. Bonds.' },
            { who: 'idris', text: 'As long as I don’t have to put in another cent.' },
            { who: 'margaux', text: 'Bonds it is. But we price them, not Rupert.' },
          ],
        },
        { kind: 'lesson', concepts: ['bond-basics'] },
        { kind: 'problem', problem: 'contract-or-market' },
        { kind: 'lesson', concepts: ['bond-price'] },
        { kind: 'problem', problem: 'house-bond' },
        { kind: 'lesson', concepts: ['premium-discount'] },
        { kind: 'problem', problem: 'premium-table' },
        {
          kind: 'story',
          beats: [
            { who: 'rupert', text: 'Good news: there’s appetite for more. Bad news: these investors want their coupons twice a year.' },
            { who: 'margaux', text: 'That changes three numbers, not one.' },
          ],
        },
        { kind: 'lesson', concepts: ['bond-semiannual'] },
        { kind: 'problem', problem: 'semi-bond' },
        { kind: 'spotcheck' },
      ],
    },
    {
      id: 'a2s2',
      title: 'Rates rise, the rating falls',
      blurb: 'Watch prices drop, find a hidden yield, and survive a downgrade.',
      parts: [
        {
          kind: 'story',
          scene: 'The studio · a grey Tuesday',
          beats: [
            { who: 'narrator', text: 'The central bank surprises everyone. Rates up, sharply.' },
            { who: 'theo', mood: 'worried', text: 'Our bond holdings are down! How can they be down? They pay exactly what they paid yesterday!' },
            { who: 'margaux', text: 'Exactly. That’s the point.' },
          ],
        },
        { kind: 'lesson', concepts: ['price-yield'] },
        { kind: 'problem', problem: 'rate-rise' },
        {
          kind: 'story',
          beats: [{ who: 'margaux', text: 'One of our suppliers is selling its old bond for cash. Cheap. Let’s see how cheap.' }],
        },
        { kind: 'lesson', concepts: ['ytm'] },
        { kind: 'problem', problem: 'bond-ytm' },
        {
          kind: 'story',
          scene: 'An email, 7.02 a.m.',
          beats: [
            { who: 'narrator', text: 'Subject: Rating action. Atelier Noor cut from BBB to BB+. Outlook negative.' },
            { who: 'rupert', mood: 'worried', text: 'Ah. That’s… below the line. Some of your investors aren’t allowed to hold you any more.' },
          ],
        },
        { kind: 'lesson', concepts: ['credit-risk'] },
        { kind: 'problem', problem: 'ratings' },
        { kind: 'problem', problem: 'why-pay-more' },
        { kind: 'lesson', concepts: ['real-nominal'] },
        { kind: 'problem', problem: 'real-rate' },
        {
          kind: 'story',
          beats: [
            { who: 'margaux', text: 'Some of the bond money sits idle until the second atelier is built. It should earn something meanwhile.' },
            { who: 'margaux', text: 'Rupert has four bonds. More than one is sensible. Pick one and argue for it.' },
          ],
        },
        { kind: 'problem', problem: 'spare-cash-bonds' },
        { kind: 'spotcheck' },
      ],
    },
  ],
  boss: {
    title: 'The refinancing',
    intro: [
      { who: 'narrator', text: 'A year later. The house wants to refinance with a new bond.' },
      { who: 'rupert', mood: 'happy', text: 'Seven years, a 7% coupon paid half-yearly, and the market only wants 4% from you now. You’ve been rehabilitated!' },
      { who: 'margaux', text: 'Four parts. No help from me.' },
    ],
    problems: [
      { problem: 'semi-bond', params: { face: 1000, coupon: 7, years: 7, y: 4 } },
      { problem: 'rate-rise', params: { face: 1000, coupon: 6, years: 10, y2: 8, held: 50 } },
      { problem: 'real-return-2y', params: { r: 8, i1: 3, i2: 5 } },
      { problem: 'why-pay-more' },
    ],
    paper: [
      { ref: 'Ch3 P1', note: 'Coupon rate, price and yield when yields rise.' },
      { ref: 'Ch3 P2', note: 'Why premium bonds sell above face value; pull to par.' },
      { ref: 'Ch3 P3', note: 'Pricing a 10-year bund.' },
      { ref: 'Ch3 P4', note: 'Simple examples on prices and yields.' },
      { ref: 'Ch3 P5', note: 'Half-yearly coupons, and maturity v. interest-rate risk.' },
      { ref: 'Ch3 P6', note: 'Real interest rate.' },
      { ref: 'Ch3 P7', note: 'Nominal and real return over two years.' },
    ],
  },
};
