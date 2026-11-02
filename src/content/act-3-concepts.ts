// Chapter III lessons: stocks (Lecture 4, BMA Ch4). Margaux's voice; no lecture references.
import type { Concept } from '../engine/types';

const c = (x: Omit<Concept, 'act'>): Concept => ({ act: 3, ...x });

export const ACT3_CONCEPTS: Concept[] = [
  c({
    id: 'stock-basics',
    name: 'What a share is',
    summary: 'Shareholders own what’s left after everyone else is paid. New shares are sold in the primary market.',
    lesson: {
      plain: [
        'A share is a slice of ownership. Shareholders get paid last, after the bank and the bondholders: they’re the residual claimants. In return they get the votes, and limited liability: they can lose what they put in, no more.',
        'Their payouts are dividends, and unlike coupons nobody promises how big or when. That’s what makes shares hard to value.',
        'When a company sells new shares, that’s the primary market: venture capital for young firms, an IPO when it first goes public, a seasoned offering after that. When investors trade existing shares with each other, that’s the secondary market. The company gets nothing from those trades.',
      ],
      traps: ['Buying shares on an exchange or an app is the secondary market: the money goes to the seller, not the company.', 'Dividends aren’t promised. Coupons are.'],
    },
  }),
  c({
    id: 'ddm',
    name: 'The dividend discount model',
    summary: 'A share is worth the PV of its future dividends. One year ahead: P₀ = (D₁ + P₁) ÷ (1 + r).',
    lesson: {
      plain: [
        'What’s a share worth? What it pays you, brought back to today: next year’s dividend plus whatever you can sell it for then.',
        'Keep rolling that forward and the price is simply the present value of every future dividend.',
        'If the dividend never changes, that’s a level perpetuity: P = D ÷ r. Turn it round and the return investors expect is r = D ÷ P.',
        'The r here is the market capitalisation rate: the return investors require on shares this risky.',
      ],
      formula: { tex: 'P_{0} = \\frac{D_{1} + P_{1}}{1 + r} \\qquad P_{0} = \\sum_{t=1}^{\\infty} \\frac{D_{t}}{(1 + r)^{t}}' },
      example: {
        prompt: 'A share will pay a $5 dividend at the end of the year and then sell for $110. Investors want 8%. What is it worth today?',
        working: ['P_{0} = \\frac{5 + 110}{1.08} = \\$106.48'],
        answer: '$106.48',
      },
      traps: ['P₀ is the price today, just after any dividend already paid.', 'A level dividend is just a perpetuity: everything from the first act still works.'],
    },
  }),
  c({
    id: 'gordon',
    name: 'Constant growth',
    summary: 'P₀ = D₁ ÷ (r − g). D₁ is next year’s dividend, not the one just paid.',
    lesson: {
      plain: [
        'If dividends grow at a steady rate g forever, the share is a growing perpetuity. Same formula you already know: P₀ = D₁ ÷ (r − g).',
        'The usual trap: “just paid”. If the dividend just paid is D₀, next year’s is D₀ × (1 + g).',
        'It only works if r is bigger than g, and it is very sensitive to both.',
      ],
      formula: { tex: 'P_{0} = \\frac{D_{1}}{r - g}', onSheet: true, where: ['D₁ = D₀ × (1 + g)'] },
      example: {
        prompt: 'Next year’s dividend is $1.06 and dividends grow 6% a year. Investors want 20%. What should the share cost?',
        working: ['P_{0} = \\frac{1.06}{0.20 - 0.06} = \\$7.57'],
        answer: '$7.57',
      },
      traps: ['D₁ v. D₀: grow the dividend just paid by one year first.', 'In real terms, use real dividends and a real rate. Both routes give the same price.'],
    },
  }),
  c({
    id: 'payout-plowback',
    name: 'Payout, plowback and growth',
    summary: 'Payout = DPS ÷ EPS. Plowback b = 1 − payout. Growth g = ROE × b.',
    lesson: {
      plain: [
        'A company can pay its profits out, or plough them back in. The payout ratio is dividends ÷ earnings; the plowback ratio is what’s left: 1 − payout.',
        'Money ploughed back earns the return on equity, ROE. So earnings and dividends grow at g = ROE × plowback.',
        'That’s growth the company can keep up from its own profits: the sustainable growth rate.',
      ],
      formula: { tex: 'g = ROE \\times b \\qquad b = 1 - \\frac{DPS}{EPS}' },
      example: {
        prompt: 'ROE 15%, EPS $2.00, dividend $1.00. What is the sustainable growth rate?',
        working: ['b = 1 - \\frac{1.00}{2.00} = 0.5', 'g = 0.15 \\times 0.5 = 7.5\\%'],
        answer: '7.5% a year',
      },
      traps: ['Use the plowback ratio, not the payout ratio.', 'ROE is earnings ÷ book equity, not the return investors require.'],
    },
  }),
  c({
    id: 'pvgo',
    name: 'Growth opportunities (PVGO)',
    summary: 'Price = value with no growth (EPS₁ ÷ r) + PVGO. Growth adds value only if ROE > r.',
    lesson: {
      plain: [
        'Split any share price in two: what the business is worth if it just paid out everything and never grew (EPS₁ ÷ r), plus the present value of its growth opportunities, PVGO.',
        'Growth opportunities are investments that earn more than investors require. That’s what makes a growth stock, not merely growing earnings or dividends.',
        'If the money ploughed back only earns r, growth adds nothing. If it earns less, ploughing back destroys value.',
      ],
      formula: { tex: 'P_{0} = \\frac{EPS_{1}}{r} + PVGO' },
      example: {
        prompt: 'Expected EPS $8.33, payout 0.6, ROE 25%, investors want 15%. How much of the price is growth?',
        working: [
          'D_{1} = 0.6 \\times 8.33 = 5.00,\\quad g = 0.4 \\times 0.25 = 10\\%',
          'P_{0} = \\frac{5.00}{0.15 - 0.10} = \\$100,\\quad \\frac{EPS_{1}}{r} = \\frac{8.33}{0.15} = \\$55.56',
          'PVGO = 100 - 55.56 = \\$44.44',
        ],
        answer: '$44.44 of the $100 price is growth',
      },
      traps: ['The no-growth value uses earnings (EPS₁), not dividends.', 'Growing earnings alone doesn’t make a growth stock. Returns above r do.'],
    },
  }),
  c({
    id: 'multi-stage',
    name: 'Growth in stages',
    summary: 'Value the fast-growth years as a growing annuity, then what comes after as a perpetuity, discounted back.',
    lesson: {
      plain: [
        'Young companies grow fast, then competition catches up and growth slows. One growth rate forever doesn’t fit.',
        'Split the timeline. The fast-growth dividends are a growing annuity. After that, value everything from then on as a perpetuity at that date, and discount it back.',
        'Same rule as a delayed perpetuity: the perpetuity formula lands one year before its first payment.',
      ],
      timeline: {
        periods: 9,
        forever: true,
        marks: [
          { at: 0, label: 'P₀', kind: 'value' },
          { at: 1, label: 'D₁', kind: 'in' },
          { at: 4, label: 'growing', kind: 'in' },
          { at: 7, label: 'D₇ · D₇/r', kind: 'value' },
          { at: 8, label: 'D₇', kind: 'in' },
          { at: 9, label: 'D₇', kind: 'in' },
        ],
        caption: 'Seven years of growth, then flat forever. The flat part is valued at year 7.',
      },
      formula: {
        tex: 'P_{0} = \\frac{D_{1}}{r - g}\\left(1 - \\frac{(1 + g)^{N}}{(1 + r)^{N}}\\right) + \\frac{D_{N} / r}{(1 + r)^{N}}',
        where: ['N: last year of growth', 'after N the dividend stays at D_N'],
      },
      example: {
        prompt: 'D₀ = $1. Dividends grow 6% a year for 7 years, then stop growing. Investors want 20%. What is the share worth?',
        working: [
          'D_{1} = 1.06,\\quad D_{7} = 1.06^{7} = 1.5036',
          'P_{0} = \\frac{1.06}{0.20 - 0.06}\\left(1 - \\frac{1.06^{7}}{1.20^{7}}\\right) + \\frac{1.5036 / 0.20}{1.20^{7}} = 4.39 + 2.10 = \\$6.49',
        ],
        answer: '$6.49',
      },
      traps: ['Value the flat stage at year N, then discount it N years, not N + 1.', 'If you’re given D₀, grow it to D₁ first.'],
    },
  }),
];
