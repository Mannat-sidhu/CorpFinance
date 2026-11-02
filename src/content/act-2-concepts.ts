// Chapter II lessons: bonds (Lecture 3, BMA Ch3). Margaux's voice; no lecture references.
import type { Concept } from '../engine/types';

const c = (x: Omit<Concept, 'act'>): Concept => ({ act: 2, ...x });

export const ACT2_CONCEPTS: Concept[] = [
  c({
    id: 'bond-basics',
    name: 'What a bond is',
    summary: 'Coupons along the way, face value at the end. Coupon = coupon rate × face value.',
    lesson: {
      plain: [
        'A bond is an IOU we sell to investors. We get the money now and promise fixed payments later.',
        'The face value (or par value) is what we repay at the end, usually €100 or €1,000 a bond. The coupon is the interest we pay along the way: coupon rate × face value. A 5% bond with €100 face pays €5 a year.',
        'Maturity is the date it all ends. The small print lives in the indenture, and a trustee looks after the bondholders if we miss a payment.',
        'Governments borrow this way too. Our bonds have to pay more than theirs, because we might not pay.',
      ],
      timeline: {
        periods: 5,
        marks: [
          { at: 0, label: 'price', kind: 'value' },
          { at: 1, label: 'C', kind: 'in' },
          { at: 2, label: 'C', kind: 'in' },
          { at: 3, label: 'C', kind: 'in' },
          { at: 4, label: 'C', kind: 'in' },
          { at: 5, label: 'C + F', kind: 'in' },
        ],
        caption: 'A 5-year bond from the buyer’s side: coupons every year, coupon plus face value at the end.',
      },
      traps: [
        'The coupon rate is fixed in the contract. The yield moves with the market every day.',
        'Coupon = coupon rate × face value, not × price.',
      ],
    },
  }),
  c({
    id: 'bond-price',
    name: 'Pricing a bond',
    summary: 'Price = PV of the coupons (an annuity) + PV of the face value, at the market yield.',
    lesson: {
      plain: [
        'A bond’s price is just the present value of what it pays: the coupons, plus the face value at the end.',
        'The coupons are a level annuity. The face value is one payment at year T. Value each and add them up.',
        'Discount at the market’s yield on bonds like this one: the yield to maturity. Not at the coupon rate.',
      ],
      formula: {
        tex: 'PV = \\frac{C}{r}\\left(1 - \\frac{1}{(1 + r)^{T}}\\right) + \\frac{F}{(1 + r)^{T}}',
        onSheet: true,
        where: ['C: coupon each year', 'F: face value', 'r: yield to maturity', 'T: years to maturity'],
      },
      example: {
        prompt: 'A bond pays $115 a year for 5 years, plus its $1,000 face value at the end. Similar bonds yield 7.5%. What is it worth?',
        working: [
          'PV = \\frac{115}{0.075}\\left(1 - \\frac{1}{1.075^{5}}\\right) + \\frac{1,000}{1.075^{5}}',
          'PV = 465.28 + 696.56 = \\$1,161.84',
        ],
        answer: '$1,161.84',
      },
      traps: ['Discount the face value too. It arrives at year T, not today.', 'Use the market yield, not the coupon rate, as r.'],
    },
  }),
  c({
    id: 'premium-discount',
    name: 'Premium, discount and par',
    summary: 'Coupon above the yield: premium. Below: discount. Prices pull to par as maturity nears.',
    lesson: {
      plain: [
        'If a bond’s coupon rate is above the market yield, it pays more than investors need. They’ll pay above face value for it: it trades at a premium.',
        'Coupon below the yield: it trades at a discount. Coupon equal to the yield: at par, exactly face value.',
        'Pull to par: on the day it matures, every bond is worth its face value. So as the date nears, a premium bond’s price drifts down and a discount bond’s drifts up.',
      ],
      example: {
        prompt: 'Three 2-year bonds with €100 face value, all priced at a 6% yield. Coupons of 4%, 6% and 8%.',
        working: ['4\\%: \\frac{4}{1.06} + \\frac{104}{1.06^{2}} = 96.33 \\text{ (discount)}', '6\\%: 100.00 \\text{ (par)}', '8\\%: \\frac{8}{1.06} + \\frac{108}{1.06^{2}} = 103.67 \\text{ (premium)}'],
        answer: '96.33, 100 and 103.67',
      },
      traps: [
        'A premium bond still earns only the yield to maturity: the price falling towards par eats into the high coupons.',
        'Price above face value means the yield is below the coupon, and the other way round.',
      ],
    },
  }),
  c({
    id: 'bond-semiannual',
    name: 'Coupons twice a year',
    summary: 'Halve the coupon, halve the yield, double the periods. The face value is paid once.',
    lesson: {
      plain: [
        'Lots of bonds pay coupons every six months. Then put everything on a six-month footing.',
        'Coupon per period = annual coupon ÷ 2. Rate per period = annual yield ÷ 2. Number of periods = years × 2.',
        'The face value still comes once, right at the end, discounted over all 2T periods.',
      ],
      timeline: {
        periods: 6,
        unit: 'half-year',
        marks: [
          { at: 0, label: 'price', kind: 'value' },
          { at: 1, label: 'C/2', kind: 'in' },
          { at: 2, label: 'C/2', kind: 'in' },
          { at: 3, label: 'C/2', kind: 'in' },
          { at: 4, label: 'C/2', kind: 'in' },
          { at: 5, label: 'C/2', kind: 'in' },
          { at: 6, label: 'C/2 + F', kind: 'in' },
        ],
        caption: 'A 3-year bond paying twice a year: six half-year periods.',
      },
      example: {
        prompt: 'A 10-year $1,000 bond with a 5.5% coupon paid twice a year. The yield is 5.2%. What is it worth?',
        working: [
          'C = 27.50,\\quad r = 2.6\\%,\\quad T = 20',
          'PV = \\frac{27.50}{0.026}\\left(1 - \\frac{1}{1.026^{20}}\\right) + \\frac{1,000}{1.026^{20}} = \\$1,023.16',
        ],
        answer: '$1,023.16, a small premium',
      },
      traps: ['Change all three: coupon ÷ 2, yield ÷ 2, years × 2. Missing one gives the wrong price.', 'Don’t halve the face value.'],
    },
  }),
  c({
    id: 'price-yield',
    name: 'When rates move',
    summary: 'Yields up, prices down. Longer bonds swing more: that is interest-rate risk.',
    lesson: {
      plain: [
        'When market yields rise, bond prices fall. The payments are fixed, so the only way a bond can offer the new, higher return is to cost less.',
        'The coupon rate doesn’t change. It’s in the contract.',
        'Longer bonds swing more. More of their value sits far in the future, and distant payments are hit hardest by a higher rate. That sensitivity is interest-rate risk.',
      ],
      example: {
        prompt: 'A 10-year bond with a 6% coupon and $1,000 face value. Yields jump from 6% to 8%. What happens to its price?',
        working: [
          '\\text{At } 6\\%: PV = \\$1,000 \\text{ (par)}',
          '\\text{At } 8\\%: PV = \\frac{60}{0.08}\\left(1 - \\frac{1}{1.08^{10}}\\right) + \\frac{1,000}{1.08^{10}} = 402.60 + 463.19 = \\$865.80',
        ],
        answer: 'It falls from $1,000 to $865.80',
      },
      traps: ['Price and yield always move in opposite directions.', 'A 10-year bond falls further than a 5-year bond for the same jump in yields.'],
    },
  }),
  c({
    id: 'ytm',
    name: 'Yield to maturity',
    summary: 'The rate that makes the PV of a bond’s payments equal its price. Found by trial and error.',
    lesson: {
      plain: [
        'Flip the question round. You know the price. What return do you get if you hold the bond to the end? That’s the yield to maturity.',
        'It’s the rate that makes the present value of the bond’s payments equal its price.',
        'There’s nothing to rearrange. Try a rate, see what price it gives, adjust. Price too high? Try a higher rate. Too low? Try a lower one.',
      ],
      example: {
        prompt: 'A bond costs $950. Face value $1,000, 5% annual coupon, 3 years to go. What is its yield to maturity?',
        working: [
          '950 = \\frac{50}{1 + y} + \\frac{50}{(1 + y)^{2}} + \\frac{1,050}{(1 + y)^{3}}',
          '\\text{Try } 6\\%: 973.27 \\text{ (too high)} \\quad \\text{Try } 7\\%: 947.51 \\text{ (just under)}',
          'y \\approx 6.90\\%',
        ],
        answer: 'About 6.9%',
      },
      traps: [
        'Below face value means the yield is above the coupon rate. Use that to make a sensible first guess.',
        'The yield assumes you hold to maturity and every payment arrives in full.',
      ],
    },
  }),
  c({
    id: 'credit-risk',
    name: 'Default risk and ratings',
    summary: 'Companies can default, so their bonds pay a default premium. BBB and above is investment grade.',
    lesson: {
      plain: [
        'Governments rarely miss a payment in their own currency. Companies can. That’s credit risk, or default risk.',
        'Investors want paying for it: a default premium, the extra yield on top of a safe bond with the same maturity.',
        'Rating agencies grade the risk. BBB and above is investment grade. Below that it’s junk, politely called high-yield.',
        'In a recession, defaults look likelier, so default premiums widen.',
      ],
      traps: ['A lower rating means a higher yield and a lower price, not the other way round.', 'BBB is still investment grade. BB is not.'],
    },
  }),
  c({
    id: 'real-nominal',
    name: 'Real and nominal rates',
    summary: '1 + real = (1 + nominal) ÷ (1 + inflation). Real is what your money can buy.',
    lesson: {
      plain: [
        'Every rate you’re quoted is nominal: how fast your euros grow. What matters is what those euros buy. That’s the real rate.',
        'Say you’ve €100, pints cost €5, and the bank pays 21%. A year on you’ve €121, but a pint costs €5.50. You can buy 22 pints instead of 20: only 10% more. The real rate is 10%.',
        'Over more than one year, inflation compounds: multiply the years’ (1 + inflation) together.',
      ],
      formula: { tex: '1 + r_{real} = \\frac{1 + r_{nominal}}{1 + inflation}', onSheet: true },
      example: {
        prompt: 'A two-year interest rate of 10% a year, with expected inflation of 5% a year. What is the real rate?',
        working: ['1 + r_{real} = \\frac{1.10}{1.05} = 1.047619', 'r_{real} = 4.76\\%'],
        answer: '4.76% a year',
      },
      traps: ['Nominal minus inflation (10 − 5 = 5%) is only an approximation. Use the formula.', 'Inflation of 3% then 5% is ×1.03 × 1.05, not 8%.'],
    },
  }),
];
