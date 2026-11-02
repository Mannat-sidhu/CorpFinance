// Act I: The atelier (Lectures 1–2, BMA Ch1–2). Player-facing text never mentions lectures.
import type { Act } from '../engine/types';

export const ACT_1: Act = {
  number: 1,
  numeral: 'I',
  title: 'The atelier',
  lecture: 'Lectures 1–2',
  chapters: 'BMA Ch1–2',
  blurb: 'Open the doors, hire a manager, sign a lease, take your first loan.',
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
      blurb: 'What the house is for, and your first big buy.',
      parts: [
        {
          kind: 'story',
          scene: 'Stoneybatter, Dublin · a spare room',
          beats: [
            { who: 'narrator', text: 'A cutting table, two sewing machines, and a name on the door: Atelier Noor.' },
            { who: 'idris', mood: 'happy', text: 'Ninety thousand from me for 60% of the shares. Sixty thousand from you. Don’t spend it all on silk.' },
            { who: 'margaux', text: 'I’m Margaux. I keep the books, and I stop you doing anything silly with them.' },
            { who: 'margaux', text: 'One rule in this house: does a decision make us worth more to our owners? That number at the top is the score. Watch it.' },
          ],
        },
        { kind: 'lesson', concepts: ['real-financial', 'invest-finance', 'shareholder-value'] },
        { kind: 'problem', problem: 'assets-classify' },
        { kind: 'problem', problem: 'decisions-classify' },
        { kind: 'lesson', concepts: ['opportunity-cost'] },
        { kind: 'problem', problem: 'goals-true-false' },
        {
          kind: 'story',
          beats: [
            { who: 'margaux', text: 'First real decision. A supplier wants to sell us a laser cutter.' },
            { who: 'margaux', text: 'Before you say yes, two tricks: moving money through time, and adding it all up.' },
          ],
        },
        { kind: 'lesson', concepts: ['pv-fv', 'npv'] },
        { kind: 'problem', problem: 'laser-cutter' },
        {
          kind: 'story',
          beats: [{ who: 'margaux', mood: 'happy', text: 'That’s the whole game. Timeline, bring everything to today, add it up. The rest is shortcuts.' }],
        },
        { kind: 'spotcheck' },
      ],
    },
    {
      id: 'a1s2',
      title: 'Theo’s ledger',
      blurb: 'A manager with his own agenda, and a royalty that pays forever.',
      parts: [
        {
          kind: 'story',
          scene: 'The studio · Monday morning',
          beats: [
            { who: 'narrator', text: 'Orders are flooding in. You hire a studio manager.' },
            { who: 'theo', mood: 'happy', text: 'Theo! Charmed. I’ll have this place humming. My bonus is on cash brought in this year, so trust me, I’m motivated.' },
            { who: 'margaux', mood: 'worried', text: 'His first expense claim: first class to Manchester. And Idris has sent the board a motion.' },
            { who: 'margaux', text: 'Time we talked about whose interests this house is serving.' },
          ],
        },
        { kind: 'lesson', concepts: ['agency'] },
        { kind: 'problem', problem: 'agency-classify' },
        {
          kind: 'story',
          beats: [
            { who: 'theo', mood: 'happy', text: 'Stop everything. A homeware brand wants the Liffey Rose print. And I’ve already got a buyer for the deal!' },
            { who: 'margaux', text: 'Before we sell anything that pays forever, let’s find out what forever is worth.' },
          ],
        },
        { kind: 'lesson', concepts: ['perpetuity', 'delayed-perpetuity'] },
        { kind: 'problem', problem: 'royalty-sale' },
        {
          kind: 'story',
          scene: 'The boardroom · well, the kitchen table',
          beats: [
            { who: 'idris', mood: 'happy', text: 'While we’re selling royalties, my family’s firm will take the Ha’penny licence off your hands.' },
            { who: 'margaux', mood: 'worried', text: 'He has the votes. You can still object. But first, one more kind of forever.' },
          ],
        },
        { kind: 'lesson', concepts: ['growing-perpetuity'] },
        { kind: 'problem', problem: 'idris-royalty' },
        {
          kind: 'story',
          beats: [
            { who: 'theo', mood: 'worried', text: 'So… no bonus this year?' },
            { who: 'margaux', text: 'Two offers, two people with their own agendas. The numbers are how you keep them honest.' },
          ],
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
          scene: 'Capel Street · a studio with north light',
          beats: [
            { who: 'narrator', text: 'The spare room is bursting at the seams.' },
            { who: 'ferriter', mood: 'happy', text: 'High ceilings, north light, a goods lift for your silks. Five years, dear, and I’m flexible on how you pay.' },
            { who: 'margaux', text: '“Flexible” usually means a trap. This is where everyone gets the timeline wrong.' },
          ],
        },
        { kind: 'lesson', concepts: ['annuity', 'annuity-due'] },
        { kind: 'problem', problem: 'studio-lease' },
        {
          kind: 'story',
          beats: [
            { who: 'theo', mood: 'happy', text: 'Bríd Nolan wants to join us! The best pattern-cutter in Dublin!' },
            { who: 'margaux', text: 'Her agent sent two pay packages. One looks cheaper. Let’s see if it is.' },
          ],
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
          scene: 'Merchant’s Quay Bank · the small-business desk',
          beats: [
            { who: 'narrator', text: 'Cutting tables, presses, a fitting room clients will remember. The fit-out costs €120,000.' },
            { who: 'aoife', mood: 'happy', text: 'Aoife, small business. We can do ten years at 7%, repaid once a year. I’ll pop the letter over this afternoon!' },
          ],
        },
        { kind: 'lesson', concepts: ['loan-payment'] },
        { kind: 'problem', problem: 'loan-payment' },
        {
          kind: 'story',
          beats: [{ who: 'margaux', text: 'I got a second quote. Its headline rate is higher. That doesn’t make it dearer.' }],
        },
        { kind: 'lesson', concepts: ['apr-ear'] },
        { kind: 'problem', problem: 'two-banks' },
        {
          kind: 'story',
          beats: [{ who: 'margaux', text: 'Last thing today. Let’s look inside those repayments. It’s not what you’d expect.' }],
        },
        { kind: 'lesson', concepts: ['loan-balance', 'interest-share'] },
        { kind: 'problem', problem: 'loan-balance' },
        {
          kind: 'story',
          beats: [
            { who: 'margaux', text: 'One more thing before the year closes. Everyone has a pitch, and we can only back one.' },
            { who: 'margaux', text: 'No single right answer this time. Some are safer, some pay more. Pick one you can defend.' },
          ],
        },
        { kind: 'problem', problem: 'first-bets' },
        { kind: 'spotcheck' },
      ],
    },
  ],
  boss: {
    title: 'The Merrion Square mortgage',
    intro: [
      { who: 'narrator', text: 'Three years later. A Georgian townhouse on Merrion Square comes up for sale.' },
      { who: 'aoife', mood: 'happy', text: 'We’d be delighted to lend on it. Three hundred thousand over twenty years.' },
      { who: 'margaux', text: 'Big one. I’m not helping this time. Show me every step.' },
    ],
    problems: [
      { problem: 'loan-payment', params: { P: 300000, r: 5, T: 20, error: 0, ctx: 'flagship' } },
      { problem: 'interest-share', params: { P: 300000, r: 5, T: 20, k: 1, ctx: 'flagship' } },
      { problem: 'loan-balance', params: { P: 300000, r: 5, T: 20, k: 10, ctx: 'flagship' } },
      { problem: 'house-mortgage' },
    ],
    paper: [
      { ref: 'Ch2 P1', note: 'Doubling at 4%, without a calculator.' },
      { ref: 'Ch2 P2', note: 'Discount factor and implied rate.' },
      { ref: 'Ch2 P8', note: 'Perpetuities, a delayed perpetuity, a growing perpetuity.' },
      { ref: 'Ch2 P12', note: 'PV, an annuity, and what is left over.' },
      { ref: 'Ch2 P22', note: 'Free credit v. a discount: monthly annuity.' },
      { ref: 'Ch2 P32', note: 'Level and growing annuities in retirement.' },
      { ref: 'Ch2 P36', note: 'Mortgage payment, interest share, fraction repaid.' },
    ],
  },
};
