// Act I: The atelier (Lectures 1–2, BMA Ch1–2).
import type { Act } from '../engine/types';

export const ACT_1: Act = {
  number: 1,
  numeral: 'I',
  title: 'The atelier',
  lecture: 'Lectures 1–2',
  chapters: 'BMA Ch1–2',
  blurb: 'Found the house, hire a manager, sign a lease, take your first loan.',
  concepts: [
    'real-financial',
    'invest-finance',
    'shareholder-value',
    'opportunity-cost',
    'pv-fv',
    'npv',
    'agency',
    'perpetuity',
    'delayed-perpetuity',
    'growing-perpetuity',
    'annuity',
    'annuity-due',
    'growing-annuity',
    'loan-payment',
    'loan-balance',
    'interest-share',
    'apr-ear',
  ],
  sessions: [
    {
      id: 'a1s1',
      title: 'The atelier opens',
      blurb: 'What the house is for, and your first investment.',
      parts: [
        {
          kind: 'story',
          beats: [
            { who: 'narrator', text: 'Dublin, early autumn. A spare room in Stoneybatter, a cutting table, two sewing machines and a name painted on the door: Atelier Noor.' },
            { who: 'narrator', text: 'You put in €60,000 of your savings. Idris Kell, a family friend who made his money in textiles, put in €90,000 for 60% of the shares. Together, the house is worth what its owners have put in: €150,000.' },
            { who: 'margaux', text: 'I’m Margaux. I’ll keep the books and, more importantly, help you decide. Every decision we make comes down to two questions: what to spend the money on, and where the money comes from.' },
            { who: 'margaux', text: 'And one rule for judging them: does it make the house worth more to its owners? The value at the top of the screen is that number. Watch it.' },
          ],
        },
        { kind: 'lesson', concepts: ['real-financial', 'invest-finance', 'shareholder-value'] },
        { kind: 'problem', problem: 'assets-classify' },
        { kind: 'problem', problem: 'decisions-classify' },
        { kind: 'lesson', concepts: ['opportunity-cost'] },
        { kind: 'problem', problem: 'goals-true-false' },
        {
          kind: 'story',
          beats: [{ who: 'margaux', text: 'First real decision. A supplier has offered us a laser cutter. Before we decide, you need two tools: how to move money through time, and how to add it all up.' }],
        },
        { kind: 'lesson', concepts: ['pv-fv', 'npv'] },
        { kind: 'problem', problem: 'laser-cutter' },
        {
          kind: 'story',
          beats: [{ who: 'margaux', text: 'That is the whole subject in miniature. Put every cash flow on a timeline, bring it to today, add it up. Everything else is a shortcut for doing that faster.' }],
        },
        { kind: 'spotcheck' },
      ],
    },
    {
      id: 'a1s2',
      title: 'Theo’s ledger',
      blurb: 'A manager with his own interests, and a royalty that pays forever.',
      parts: [
        {
          kind: 'story',
          beats: [
            { who: 'narrator', text: 'Orders are coming in faster than you can cut. You hire Theo Lalor as studio manager: talented, charming, and paid a bonus on the cash he brings in each year.' },
            { who: 'margaux', text: 'Theo’s expense claims came in this morning. First class to Manchester. And Idris has sent a motion to the board. We need to talk about whose interests this house is serving.' },
          ],
        },
        { kind: 'lesson', concepts: ['agency'] },
        { kind: 'problem', problem: 'agency-classify' },
        {
          kind: 'story',
          beats: [
            { who: 'theo', text: 'Good news! A homeware brand wants the Liffey Rose print. Better news: I’ve found someone who’ll pay us cash for the whole deal, today.' },
            { who: 'margaux', text: 'Before we sell anything that pays forever, let’s work out what forever is worth.' },
          ],
        },
        { kind: 'lesson', concepts: ['perpetuity', 'delayed-perpetuity'] },
        { kind: 'problem', problem: 'royalty-sale' },
        {
          kind: 'story',
          beats: [
            { who: 'idris', text: 'While we’re selling royalties: my family’s firm will take the Ha’penny licence off your hands. I have the votes.' },
            { who: 'margaux', text: 'He does. But you can object, and you should check the price first.' },
          ],
        },
        { kind: 'lesson', concepts: ['growing-perpetuity'] },
        { kind: 'problem', problem: 'idris-royalty' },
        {
          kind: 'story',
          beats: [{ who: 'margaux', text: 'Two offers, two people with their own interests. The numbers are how you hold them to account.' }],
        },
        { kind: 'spotcheck' },
      ],
    },
    {
      id: 'a1s3',
      title: 'The studio lease',
      blurb: 'Pay now or pay yearly, and a salary that rises.',
      parts: [
        {
          kind: 'story',
          beats: [
            { who: 'narrator', text: 'The spare room is bursting. Mrs Ferriter has a studio on Capel Street: north light, high ceilings, a goods lift for the bolts of cloth.' },
            { who: 'ferriter', text: 'Five years, and I’m flexible on how you pay. Yearly in advance, or the lot now and I’ll knock a bit off.' },
            { who: 'margaux', text: 'This is where most people get the timeline wrong. Draw it before you touch a formula.' },
          ],
        },
        { kind: 'lesson', concepts: ['annuity', 'annuity-due'] },
        { kind: 'problem', problem: 'studio-lease' },
        {
          kind: 'story',
          beats: [{ who: 'margaux', text: 'With the studio sorted, we can hire properly. Bríd Nolan’s agent has sent two packages. One looks cheaper. Let’s see if it is.' }],
        },
        { kind: 'lesson', concepts: ['growing-annuity'] },
        { kind: 'problem', problem: 'cutter-contract' },
        { kind: 'spotcheck' },
      ],
    },
    {
      id: 'a1s4',
      title: 'The first loan',
      blurb: 'Check the bank’s letter, compare two rates, look inside a repayment.',
      parts: [
        {
          kind: 'story',
          beats: [
            { who: 'narrator', text: 'Fitting out Capel Street will cost €120,000: cutting tables, presses, lighting, and a fitting room clients will remember. You go to Merchant’s Quay Bank.' },
            { who: 'aoife', text: 'We can do ten years at 7%, repaid annually. I’ll send the letter over this afternoon.' },
            { who: 'margaux', text: 'Never sign a loan you haven’t checked yourself.' },
          ],
        },
        { kind: 'lesson', concepts: ['loan-payment'] },
        { kind: 'problem', problem: 'loan-payment' },
        {
          kind: 'story',
          beats: [{ who: 'margaux', text: 'Another lender has quoted too. Its headline rate is higher. That doesn’t make it dearer.' }],
        },
        { kind: 'lesson', concepts: ['apr-ear'] },
        { kind: 'problem', problem: 'two-banks' },
        {
          kind: 'story',
          beats: [{ who: 'margaux', text: 'One last thing. I want you to see what happens inside those repayments.' }],
        },
        { kind: 'lesson', concepts: ['loan-balance', 'interest-share'] },
        { kind: 'problem', problem: 'loan-balance' },
        { kind: 'spotcheck' },
      ],
    },
  ],
  boss: {
    title: 'The Merrion Square mortgage',
    intro: [
      { who: 'narrator', text: 'Three years later. Atelier Noor is ready for a flagship: a Georgian townhouse on Merrion Square.' },
      { who: 'margaux', text: 'The board wants the full workup. No shortcuts from me this time: every step, written out as you would on an exam script.' },
    ],
    problems: [
      { problem: 'loan-payment', params: { P: 300000, r: 5, T: 20, error: 0, ctx: 'flagship' } },
      { problem: 'interest-share', params: { P: 300000, r: 5, T: 20, k: 1, ctx: 'flagship' } },
      { problem: 'loan-balance', params: { P: 300000, r: 5, T: 20, k: 10, ctx: 'flagship' } },
    ],
    paper: [
      { ref: 'BMA Ch2 P1', note: 'Doubling at 4%, without a calculator.' },
      { ref: 'BMA Ch2 P2', note: 'Discount factor and implied rate.' },
      { ref: 'BMA Ch2 P8', note: 'Perpetuities, a delayed perpetuity, a growing perpetuity.' },
      { ref: 'BMA Ch2 P12', note: 'PV, an annuity, and what is left over.' },
      { ref: 'BMA Ch2 P22', note: 'Free credit v. a discount: monthly annuity.' },
      { ref: 'BMA Ch2 P32', note: 'Level and growing annuities in retirement.' },
      { ref: 'BMA Ch2 P36', note: 'Mortgage payment, interest share, fraction repaid.' },
    ],
  },
};
