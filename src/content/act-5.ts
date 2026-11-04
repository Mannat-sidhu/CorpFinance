// Chapter V: What investors want (Lecture 6, BMA Ch7–8). Player-facing text never mentions lectures.
import type { Act } from '../engine/types';

export const ACT_5: Act = {
  number: 5,
  numeral: 'V',
  title: 'What investors want',
  lecture: 'Lecture 6',
  chapters: 'BMA Ch7–8',
  blurb: 'The house has spare cash. How should it be invested, and what is risk worth?',
  concepts: ['returns', 'risk-premium', 'spread-risk', 'covariance', 'portfolio-risk', 'diversification', 'beta', 'capm', 'capital-allocation', 'market-efficiency'],
  sessions: [
    {
      id: 'a5s1',
      title: 'Where the surplus should go',
      blurb: 'Returns, the price of risk, and what “steady” really means.',
      parts: [
        {
          kind: 'story',
          scene: 'Margaux’s office · year-end',
          beats: [
            { who: 'narrator', text: 'A good year. For the first time, the house has more cash than it needs.' },
            { who: 'idris', text: 'Put it into my friends’ firms. Textiles, mostly. Wonderful people.' },
            { who: 'rupert', mood: 'happy', text: 'Or the stock market. I can show you what the numbers look like.' },
            { who: 'margaux', text: 'Before we choose anything, let’s agree what “return” means, and what we’re paid for putting up with risk.' },
          ],
        },
        { kind: 'lesson', concepts: ['returns'] },
        { kind: 'problem', problem: 'index-return' },
        { kind: 'problem', problem: 'real-markets' },
        { kind: 'lesson', concepts: ['risk-premium'] },
        { kind: 'problem', problem: 'risk-premium-years' },
        { kind: 'problem', problem: 'real-stock-average' },
        {
          kind: 'story',
          beats: [
            { who: 'idris', text: 'My friend’s firm has returned eleven per cent, steady as a rock. Why bother with anything else?' },
            { who: 'margaux', text: '“Steady” is a claim about how much returns bounce around. We can measure that.' },
          ],
        },
        { kind: 'lesson', concepts: ['spread-risk'] },
        { kind: 'problem', problem: 'stock-sd' },
        { kind: 'problem', problem: 'three-states' },
        { kind: 'spotcheck' },
      ],
    },
    {
      id: 'a5s2',
      title: 'Don’t put it all in silk',
      blurb: 'Two stocks, one portfolio, and why spreading the money works.',
      parts: [
        {
          kind: 'story',
          scene: 'The boardroom · a pile of prospectuses',
          beats: [
            { who: 'celine', text: 'I’ve backed two labels and both were disasters. Not the same disaster, mind. One lost a designer, the other lost a warehouse.' },
            { who: 'margaux', text: 'That’s exactly why you shouldn’t hold only one. But the gain depends on how the two move together.' },
          ],
        },
        { kind: 'lesson', concepts: ['covariance'] },
        { kind: 'problem', problem: 'two-stock-cov' },
        { kind: 'problem', problem: 'cov-sign' },
        { kind: 'lesson', concepts: ['portfolio-risk'] },
        { kind: 'problem', problem: 'mix-two-stocks' },
        { kind: 'problem', problem: 'scrooge-portfolio' },
        {
          kind: 'story',
          beats: [
            { who: 'celine', text: 'So with enough shares, I’d have no risk at all.' },
            { who: 'margaux', text: 'Not quite. Some risk goes. Some never does.' },
          ],
        },
        { kind: 'lesson', concepts: ['diversification'] },
        { kind: 'problem', problem: 'diversify-classify' },
        { kind: 'problem', problem: 'why-not-all-risk' },
        { kind: 'spotcheck' },
      ],
    },
    {
      id: 'a5s3',
      title: 'The price of risk',
      blurb: 'Beta, and a single formula that says what a risky stock should earn.',
      parts: [
        {
          kind: 'story',
          scene: 'Theo’s desk · a hot tip',
          beats: [
            { who: 'theo', mood: 'happy', text: 'A tip from a man at the fabric fair: a holding company that’s sure to beat the market!' },
            { who: 'margaux', text: 'Beat the market for its risk, or just by taking more of it? We need to measure how much market risk it carries.' },
          ],
        },
        { kind: 'lesson', concepts: ['beta'] },
        { kind: 'problem', problem: 'stock-beta' },
        { kind: 'problem', problem: 'portfolio-beta' },
        {
          kind: 'story',
          beats: [{ who: 'rupert', text: 'Fine, it has a beta. But what should a beta of, say, 1.5 actually earn?' }],
        },
        { kind: 'lesson', concepts: ['capm'] },
        { kind: 'problem', problem: 'required-return' },
        { kind: 'problem', problem: 'implied-beta' },
        { kind: 'spotcheck' },
      ],
    },
    {
      id: 'a5s4',
      title: 'The right mix',
      blurb: 'Market plus risk-free, who’s efficient, and why charts don’t work.',
      parts: [
        {
          kind: 'story',
          scene: 'Merchant’s Quay Bank · a quiet counter',
          beats: [
            { who: 'aoife', text: 'You can lend to us at the risk-free rate, or borrow from us. So who needs to pick shares at all?' },
            { who: 'margaux', text: 'Exactly. Everyone holds the market and some risk-free. The only choice is how much of each.' },
          ],
        },
        { kind: 'lesson', concepts: ['capital-allocation'] },
        { kind: 'problem', problem: 'mix-risk-free' },
        { kind: 'problem', problem: 'efficient-or-not' },
        {
          kind: 'story',
          beats: [
            { who: 'theo', text: 'But I can read a chart. This one’s about to go up.' },
            { who: 'margaux', text: 'If it were that easy, everyone would already have bought it.' },
          ],
        },
        { kind: 'lesson', concepts: ['market-efficiency'] },
        { kind: 'problem', problem: 'efficiency-classify' },
        { kind: 'problem', problem: 'why-no-patterns' },
        {
          kind: 'story',
          beats: [
            { who: 'margaux', text: 'Time to decide where the surplus goes. More than one of these is sound. Pick one you can defend.' },
          ],
        },
        { kind: 'problem', problem: 'portfolio-mixes' },
        { kind: 'spotcheck' },
      ],
    },
  ],
  boss: {
    title: 'The investment committee',
    intro: [
      { who: 'narrator', text: 'Year-end. The committee meets to approve the portfolio, and Margaux has put her papers away.' },
      { who: 'margaux', text: 'Treasury bills pay 4%. The market is expected to return 12%. Six questions: required returns, an implied beta, a portfolio, a mix, and a short explanation. No help.' },
    ],
    problems: [
      { problem: 'required-return', params: { rf: 4, rm: 12, beta: 1.5, expected: 15 } },
      { problem: 'required-return', params: { rf: 4, rm: 12, beta: 0.8, expected: 9.8 } },
      { problem: 'implied-beta', params: { rf: 4, rm: 12, r: 11.2 } },
      { problem: 'scrooge-portfolio' },
      { problem: 'mix-risk-free' },
      { problem: 'why-not-all-risk' },
    ],
    paper: [
      { ref: 'Ch7 P1, P2, P4', note: 'Returns, real returns and risk premiums.' },
      { ref: 'Ch7 P11, P19, P24', note: 'Standard deviation of two stocks and of portfolios, at different correlations.' },
      { ref: 'Ch7 P18, P21', note: 'The safest attainable portfolio, and which portfolios are efficient.' },
      { ref: 'Ch8 P1, P2, P3', note: 'Betas from returns, negative betas, portfolio beta.' },
      { ref: 'Ch8 P9', note: 'CAPM in full: required return, NPV test, implied beta.' },
    ],
  },
};
