// Act I lessons. Explained by Margaux, in her voice.
import type { Concept } from '../engine/types';

const c = (x: Omit<Concept, 'act'>): Concept => ({ act: 1, ...x });

export const ACT1_CONCEPTS: Concept[] = [
  c({
    id: 'real-financial',
    name: 'Real and financial assets',
    summary: 'Real assets produce goods and cash; financial assets are claims on them.',
    lesson: {
      plain: [
        'A business needs things that actually make money: a studio, sewing machines, bolts of silk, a brand that people trust. These are real assets. They produce goods and services, and so they produce cash.',
        'To pay for real assets, a business sells claims on them to investors. A share says “you own part of whatever the house earns”. A loan or a bond says “you will be paid back, with interest”. These claims are financial assets, also called securities.',
        'A quick test: a real asset would still be useful if all the paperwork vanished. A financial asset is the paperwork: a claim on someone else\'s real assets.',
        'A financial market is where people who want to borrow meet people who want to invest or lend.',
      ],
      traps: [
        'Intangible things such as a brand name, a patent or a print archive are real assets. They produce cash.',
        'A loan is a financial asset for the lender. It is the same contract seen from the other side.',
      ],
    },
  }),
  c({
    id: 'invest-finance',
    name: 'Investment and financing decisions',
    summary: 'Investment: which real assets to buy. Financing: where the money comes from.',
    lesson: {
      plain: [
        'All of corporate finance comes down to two questions: where do we get the money, and where do we put it?',
        'The investment decision (also called capital budgeting) is which real assets to buy: a machine, a new collection, a second boutique.',
        'The financing decision is how to pay for them: borrow (debt, such as a bank loan or a bond) or sell part of the business (equity, that is shares).',
        'Answer those two well and you have run a business.',
      ],
      traps: [
        'Buying a machine with a bank loan involves both decisions. Buying the machine is the investment decision; taking the loan is the financing decision. Judge them separately.',
        'Issuing shares or bonds is always financing, even when the money is earmarked for a specific project.',
      ],
    },
  }),
  c({
    id: 'shareholder-value',
    name: 'Maximising shareholder value',
    summary: 'The goal: make the owners’ stake worth as much as possible.',
    lesson: {
      plain: [
        'Whose interests should the financial manager serve? The widely agreed answer is the shareholders: decisions should maximise the value of their stake.',
        'Four reasons. Shareholders own the business. They control it, by electing the board. In some countries it is the law. And they are the residual claimants: the bank, staff and suppliers all have fixed, contracted payoffs, so any extra value the business creates goes to the shareholders.',
        'Because everyone else is paid a fixed amount, maximising shareholder value usually means maximising the market value of the whole firm.',
        'Finance is about decisions for the future. Accounting (financial reporting) records and communicates the effects of past decisions. Accounting data feed finance decisions, but the focus is the future.',
        'In this game, the value shown at the top is the house\'s value to its owners. Good decisions raise it; bad ones visibly destroy it.',
      ],
      traps: [
        'Maximising this year\'s accounting profit is not the same thing. Profit ignores when the cash arrives and how risky it is.',
        'People argue about this goal (ESG, for one), but it is still the yardstick we use.',
      ],
    },
  }),
  c({
    id: 'opportunity-cost',
    name: 'Opportunity cost of capital',
    summary: 'The return given up by not investing elsewhere at the same risk: r.',
    lesson: {
      plain: [
        'Money put into a project could have been invested somewhere else. The return you give up is the opportunity cost of capital, written r.',
        'It is set by the market: what investors could earn on other investments of similar risk.',
        'This is why a euro today is worth more than a euro next year. Today\'s euro can be invested to earn r, so €1 now becomes €(1 + r) in a year.',
        'r acts as the “exchange rate” between euros at different dates. Everything in the rest of the module uses it.',
      ],
      formula: { tex: '€1 \\text{ today} = €(1 + r) \\text{ in one year}' },
      traps: [
        'Spare cash is not free to use. Its opportunity cost is what it could earn elsewhere.',
        'A project is worth doing only if it earns more than r: more than investors could get elsewhere at the same risk.',
      ],
    },
  }),
  c({
    id: 'pv-fv',
    name: 'Present value, future value and discount factors',
    summary: 'Grow forward with (1 + r)^T; discount back with 1/(1 + r)^T.',
    lesson: {
      plain: [
        'Think of cash at different dates as different currencies. You cannot add €150 and $300 without converting one into the other first. In the same way, you cannot add a euro today and a euro in three years until you convert them to the same date.',
        'Growing forward: €1 invested today at r becomes €(1 + r) after one year, €(1 + r)² after two, and €(1 + r)^T after T years. This is future value.',
        'Discounting back: €1 received in year T is worth 1/(1 + r)^T today. That fraction is the discount factor, the “exchange rate” from year-T euros into today\'s euros.',
        'Always draw a timeline first. Today is year 0. A payment “in five years” sits at year 5.',
      ],
      timeline: {
        periods: 5,
        marks: [
          { at: 0, label: 'PV = ?', kind: 'value' },
          { at: 5, label: '€10,000', kind: 'in' },
        ],
        caption: 'Discount the year-5 amount back five steps to year 0.',
      },
      formula: { tex: 'PV = \\frac{C_{T}}{(1 + r)^{T}} \\qquad DF_{T} = \\frac{1}{(1 + r)^{T}}', where: ['C_T: cash flow at year T', 'r: opportunity cost of capital', 'T: number of years from today'] },
      example: {
        prompt: 'A new car will cost $10,000 in five years. The interest rate is 5%. How much must you set aside today?',
        working: ['PV = \\frac{10,000}{1.05^{5}} = \\frac{10,000}{1.27628}', 'PV = \\$7,835.26'],
        answer: '$7,835.26',
      },
      traps: [
        'A discount factor is always below 1 when r is positive. If yours is above 1, you multiplied instead of dividing.',
        'Count years from today. Something paid “in year 5” is discounted five times, not four.',
      ],
    },
  }),
  c({
    id: 'npv',
    name: 'Net present value (NPV)',
    summary: 'Discount every cash flow to today and add, including the cost. Take positive NPV.',
    lesson: {
      plain: [
        'Net present value is the value today of all of a project\'s cash flows, net of what it costs. The cost today is the year-0 cash flow, C₀, and it is negative.',
        'Convert each cash flow into today\'s euros with its discount factor, then add them up.',
        'The rule: take projects with a positive NPV and reject those with a negative NPV. If you must choose, rank them by NPV. Every investment decision in this house comes back to this one sum.',
      ],
      timeline: {
        periods: 3,
        marks: [
          { at: 0, label: '−230,000', kind: 'out' },
          { at: 1, label: '90,000', kind: 'in' },
          { at: 2, label: '90,000', kind: 'in' },
          { at: 3, label: '90,000', kind: 'in' },
        ],
        caption: 'A lighting system: pay now, save for three years.',
      },
      formula: {
        tex: 'NPV = C_{0} + \\frac{C_{1}}{1 + r} + \\frac{C_{2}}{(1 + r)^{2}} + \\cdots + \\frac{C_{T}}{(1 + r)^{T}}',
        where: ['C₀ is negative when there is an upfront cost'],
      },
      example: {
        prompt:
          'A lighting system costs $230,000 installed and saves $90,000 in each of the next three years. The interest rate is 4%. Is it a good investment?',
        working: [
          'NPV = -230,000 + \\frac{90,000}{1.04} + \\frac{90,000}{1.04^{2}} + \\frac{90,000}{1.04^{3}}',
          'NPV = -230,000 + 86,538 + 83,210 + 80,010',
          'NPV = \\$19,758 > 0 \\to \\text{invest}',
        ],
        answer: '$19,758: go ahead.',
      },
      traps: [
        'Do not discount C₀. It is already in today’s money.',
        'Adding undiscounted cash flows (3 × 90,000 = 270,000) overstates their value. Cash later is worth less.',
      ],
    },
  }),
  c({
    id: 'agency',
    name: 'Agency problems: Type I and Type II',
    summary: 'Type I: managers v. shareholders. Type II: large v. small shareholders.',
    lesson: {
      plain: [
        'Owners hire managers to run the business for them. The managers are their agents. Agents may pursue their own interests instead of the owners\'. As Adam Smith noted in 1776, people managing “other people\'s money” rarely watch over it as carefully as their own.',
        'Type I: managers against shareholders. Managers want wealth, perks and power; shareholders want the firm\'s value maximised. Think of a chief executive with a huge salary and a private jet, paid for by pension funds that own the shares.',
        'Type II: large shareholders against small shareholders. A controlling holder can use their votes to benefit themselves at the small holders\' expense. Think of a founder whose super-voting shares outvote everyone else.',
        'Agency costs come in two kinds. Direct costs: value lost through mismanagement and the conflict itself. Indirect costs: money spent to reduce the conflict, such as audits and monitoring.',
        'Remedies include tying managers\' pay to performance, a board that holds managers to account, and shareholders\' votes, including proxy votes.',
      ],
      traps: [
        'A founder who is also a large shareholder can still cause a Type II problem by gaining at the small shareholders\' expense.',
        'Spending on monitoring is itself an agency cost (the indirect kind), even though it is meant to help.',
      ],
    },
  }),
  c({
    id: 'perpetuity',
    name: 'Level perpetuity',
    summary: 'C every year forever, first payment in a year: PV = C / r.',
    lesson: {
      plain: [
        'A perpetuity pays the same amount C every period, forever. The first payment arrives one period from now.',
        'Its value today is C / r. One way to see it: if you put C / r in the bank at rate r, the interest each year is exactly C, and the deposit never runs down.',
      ],
      timeline: {
        periods: 4,
        forever: true,
        marks: [
          { at: 0, label: 'C / r', kind: 'value' },
          { at: 1, label: 'C', kind: 'in' },
          { at: 2, label: 'C', kind: 'in' },
          { at: 3, label: 'C', kind: 'in' },
          { at: 4, label: 'C', kind: 'in' },
        ],
        caption: 'C / r lands one period before the first payment.',
      },
      formula: { tex: 'PV = \\frac{C}{r}', onSheet: true, where: ['C: payment each period, first one at year 1'] },
      example: {
        prompt: 'You win $100,000 a year forever. The interest rate is 10%. What is it worth today?',
        working: ['PV = \\frac{100,000}{0.10} = \\$1,000,000'],
        answer: '$1,000,000',
      },
      traps: [
        'C / r assumes the first payment is one period from now. If the first payment is today, add it: C + C / r.',
        'Use the rate for the same period as the payments (annual payments, annual rate).',
      ],
    },
  }),
  c({
    id: 'delayed-perpetuity',
    name: 'Delayed perpetuity',
    summary: 'C / r lands one year before the first payment; discount it back from there.',
    lesson: {
      plain: [
        'Sometimes a perpetuity starts later: the first payment arrives at year t instead of year 1.',
        'Use the perpetuity formula as normal. But C / r gives you a value one year before the first payment, at year t − 1, not today.',
        'So treat C / r as a single lump sum sitting at year t − 1, and discount it back to today.',
        'Time-ruler rule: the formula always lands one step before the first payment.',
      ],
      timeline: {
        periods: 5,
        forever: true,
        marks: [
          { at: 0, label: 'PV₀', kind: 'value' },
          { at: 2, label: 'C / r', kind: 'value' },
          { at: 3, label: 'C', kind: 'in' },
          { at: 4, label: 'C', kind: 'in' },
          { at: 5, label: 'C', kind: 'in' },
        ],
        caption: 'First payment at year 3, so C / r sits at year 2; discount back 2 years.',
      },
      formula: { tex: 'PV_{0} = \\frac{C / r}{(1 + r)^{t - 1}}', where: ['t: year of the first payment'] },
      example: {
        prompt: 'At 10%, what is the PV of $1 a year forever, with the first payment in year 8?',
        working: ['\\text{Value at year 7} = \\frac{1}{0.10} = 10', 'PV_{0} = \\frac{10}{1.10^{7}} = 5.13'],
        answer: 'About $5.13',
      },
      traps: [
        'Discount back t − 1 years, not t. First payment in year 3 means C / r sits at year 2, so divide by (1 + r)².',
        'The delay is not an annuity. Nothing is paid during the waiting years.',
      ],
    },
  }),
  c({
    id: 'growing-perpetuity',
    name: 'Growing perpetuity',
    summary: 'PV = C₁ / (r − g), where C₁ is next year’s payment.',
    lesson: {
      plain: [
        'A growing perpetuity pays an amount that grows at rate g every year, forever.',
        'Its value today is C₁ / (r − g), where C₁ is the payment one year from now. It only works if r is bigger than g.',
        'Watch which payment you are given. If the question says the payment “just paid” or “this year” was C₀, the next one is C₁ = C₀ × (1 + g). This is exactly the D₁ vs D₀ trap you will meet again when valuing shares.',
      ],
      timeline: {
        periods: 4,
        forever: true,
        marks: [
          { at: 0, label: 'C₀ (paid)', kind: 'out' },
          { at: 1, label: 'C₁', kind: 'in' },
          { at: 2, label: 'C₁(1+g)', kind: 'in' },
          { at: 3, label: 'C₁(1+g)²', kind: 'in' },
        ],
        caption: 'The formula needs C₁, the first payment still to come.',
      },
      formula: { tex: 'PV = \\frac{C_{1}}{r - g}', onSheet: true, where: ['C₁: payment at year 1', 'g: growth rate, with g < r'] },
      example: {
        prompt: 'Land produces income that grows 5% a year. The first year’s income is $10,000 and r = 10%. What is the land worth?',
        working: ['PV = \\frac{10,000}{0.10 - 0.05} = \\$200,000'],
        answer: '$200,000',
      },
      traps: [
        'C₁ vs C₀: if you are told the payment just made, grow it by one year first.',
        'r − g, not r + g. Growth makes the stream more valuable, so the denominator shrinks.',
      ],
    },
  }),
  c({
    id: 'annuity',
    name: 'Level annuity',
    summary: 'C for T periods, first payment in one period: PV = C/r × (1 − 1/(1 + r)^T).',
    lesson: {
      plain: [
        'An annuity pays the same amount C for a fixed number of periods T. In an ordinary annuity the first payment is one period from now, so “at the end of each year”.',
        'You can think of it as a perpetuity starting now, minus a perpetuity that starts after T years. That gives the formula on the sheet.',
        'The part in brackets times 1/r is called the present value annuity factor (PVAF).',
      ],
      timeline: {
        periods: 6,
        marks: [
          { at: 0, label: 'PV', kind: 'value' },
          { at: 1, label: '12,000', kind: 'in' },
          { at: 2, label: '12,000', kind: 'in' },
          { at: 3, label: '12,000', kind: 'in' },
          { at: 4, label: '12,000', kind: 'in' },
          { at: 5, label: '12,000', kind: 'in' },
          { at: 6, label: '12,000', kind: 'in' },
        ],
      },
      formula: {
        tex: 'PV = \\frac{C}{r}\\left(1 - \\frac{1}{(1 + r)^{T}}\\right)',
        onSheet: true,
        where: ['T: number of payments', 'first payment at year 1'],
      },
      example: {
        prompt: 'School fees of $12,000 are due at the end of each of the next six years. At 8%, how much must you set aside today?',
        working: ['PV = \\frac{12,000}{0.08}\\left(1 - \\frac{1}{1.08^{6}}\\right)', 'PV = 150,000 \\times (1 - 0.63017) = \\$55,474.56'],
        answer: '$55,474.56',
      },
      traps: [
        '“At the end of each year” means the first payment is at year 1. That is the ordinary annuity on the sheet.',
        'T counts payments. Six payments from year 1 end at year 6.',
      ],
    },
  }),
  c({
    id: 'annuity-due',
    name: 'Annuity due',
    summary: 'Payments at the start of each period: level annuity × (1 + r).',
    lesson: {
      plain: [
        'In an annuity due, payments come at the start of each period, so the first one is today.',
        'Every payment arrives one year earlier than in an ordinary annuity, so each is worth (1 + r) times as much. Take the ordinary annuity formula and multiply by (1 + r).',
        'Time ruler: five payments “at the start of each year” land at years 0, 1, 2, 3 and 4, not 1 to 5. This is the classic trap.',
      ],
      timeline: {
        periods: 5,
        marks: [
          { at: 0, label: '24,000', kind: 'out' },
          { at: 1, label: '24,000', kind: 'out' },
          { at: 2, label: '24,000', kind: 'out' },
          { at: 3, label: '24,000', kind: 'out' },
          { at: 4, label: '24,000', kind: 'out' },
        ],
        caption: 'Five payments, starting today. Nothing at year 5.',
      },
      formula: {
        tex: 'PV_{due} = \\frac{C}{r}\\left(1 - \\frac{1}{(1 + r)^{T}}\\right) \\times (1 + r)',
        where: ['T: number of payments (still 5, even though the last is at year 4)'],
      },
      example: {
        prompt: 'Rent of €24,000 is paid at the start of each year for 5 years. At 6%, what is the rent worth today?',
        working: [
          'PV = \\frac{24,000}{0.06}\\left(1 - \\frac{1}{1.06^{5}}\\right) \\times 1.06',
          'PV = 101,096.73 \\times 1.06 = €107,162.53',
        ],
        answer: '€107,162.53',
      },
      traps: [
        'Clue words: “at the start of each year”, “in advance”, “beginning today”.',
        'An equivalent route: the first payment today plus an ordinary annuity of T − 1 payments. Same answer.',
      ],
    },
  }),
  c({
    id: 'growing-annuity',
    name: 'Growing annuity',
    summary: 'T payments growing at g, first C₁ at year 1: formula (d) on the sheet.',
    lesson: {
      plain: [
        'A growing annuity pays an amount that grows at rate g each period, for T periods. The first payment, C₁, arrives at year 1.',
        'It is a growing perpetuity, minus the part after year T. That gives formula (d) on the sheet.',
        'Typical uses: a salary that rises with inflation, or rent that rises each year.',
      ],
      timeline: {
        periods: 4,
        marks: [
          { at: 0, label: 'PV', kind: 'value' },
          { at: 1, label: 'C₁', kind: 'in' },
          { at: 2, label: 'C₁(1+g)', kind: 'in' },
          { at: 3, label: 'C₁(1+g)²', kind: 'in' },
          { at: 4, label: 'C₁(1+g)³', kind: 'in' },
        ],
      },
      formula: {
        tex: 'PV = \\frac{C_{1}}{(r - g)}\\left(1 - \\frac{(1 + g)^{T}}{(1 + r)^{T}}\\right)',
        onSheet: true,
        where: ['C₁: first payment, at year 1', 'T: number of payments'],
      },
      example: {
        prompt:
          'You retire with $2 million, live 15 more years, r = 8% and inflation is 4%. What first-year spending, rising with inflation, will the savings support?',
        working: [
          '2,000,000 = \\frac{C_{1}}{0.08 - 0.04}\\left(1 - \\frac{1.04^{15}}{1.08^{15}}\\right)',
          '2,000,000 = C_{1} \\times 10.8067',
          'C_{1} = \\$185,071',
        ],
        answer: 'About $185,071 in the first year, rising 4% a year',
      },
      traps: [
        'C₁ vs C₀ again. The formula needs the first payment still to come.',
        'Both (1 + g) and (1 + r) are raised to the power T.',
      ],
    },
  }),
  c({
    id: 'loan-payment',
    name: 'Amortising loans: the payment',
    summary: 'The payments are an annuity whose PV equals the loan; solve for C.',
    lesson: {
      plain: [
        'An amortising loan is repaid in equal payments. Each one covers that year’s interest and pays off part of what you borrowed (the principal).',
        'The bank lends you PV today. In return you make T equal payments: an annuity. A fair loan means the annuity’s present value equals the amount borrowed.',
        'So write the annuity formula with PV equal to the loan, and rearrange it for C.',
      ],
      timeline: {
        periods: 5,
        marks: [
          { at: 0, label: '+ loan', kind: 'in' },
          { at: 1, label: 'C', kind: 'out' },
          { at: 2, label: 'C', kind: 'out' },
          { at: 3, label: 'C', kind: 'out' },
          { at: 4, label: 'C', kind: 'out' },
          { at: 5, label: 'C', kind: 'out' },
        ],
      },
      formula: {
        tex: 'C = \\frac{PV}{\\frac{1}{r}\\left(1 - \\frac{1}{(1 + r)^{T}}\\right)}',
        where: ['PV: amount borrowed', 'T: number of payments'],
      },
      example: {
        prompt: 'A $200,000, 20-year mortgage at 6%, paid annually at the end of each year. What is the payment?',
        working: [
          '200,000 = \\frac{C}{0.06}\\left(1 - \\frac{1}{1.06^{20}}\\right) = C \\times 11.4699',
          'C = \\frac{200,000}{11.4699} = \\$17,436.91',
        ],
        answer: '$17,436.91 a year',
      },
      traps: [
        'Monthly payments need the monthly rate (r ÷ 12) and the number of months (T × 12).',
        'The payment is not loan ÷ T plus interest. Interest is charged on the falling balance.',
      ],
    },
  }),
  c({
    id: 'loan-balance',
    name: 'Outstanding balance and fraction repaid',
    summary: 'Balance after k payments = PV of the payments left, valued at year k.',
    lesson: {
      plain: [
        'What do you still owe after k payments? Exactly the present value of the payments still to come, valued at year k.',
        'So stand at year k on the timeline and value the remaining T − k payments as an annuity.',
        'The fraction repaid is (amount borrowed − balance) ÷ amount borrowed.',
        'Halfway through the term you have repaid less than half. Early payments are mostly interest, because the balance is still large.',
      ],
      timeline: {
        periods: 8,
        marks: [
          { at: 4, label: 'B₄', kind: 'value' },
          { at: 5, label: 'C', kind: 'out' },
          { at: 6, label: 'C', kind: 'out' },
          { at: 7, label: 'C', kind: 'out' },
          { at: 8, label: 'C', kind: 'out' },
        ],
        caption: 'After 4 of 8 payments: value the last 4 at year 4.',
      },
      formula: {
        tex: 'B_{k} = \\frac{C}{r}\\left(1 - \\frac{1}{(1 + r)^{T - k}}\\right) \\qquad \\text{fraction repaid} = \\frac{PV - B_{k}}{PV}',
      },
      example: {
        prompt: 'The $200,000, 20-year, 6% mortgage (payment $17,436.91). What fraction is repaid after 10 years?',
        working: [
          'B_{10} = \\frac{17,436.91}{0.06}\\left(1 - \\frac{1}{1.06^{10}}\\right) = \\$128,337.19',
          '\\text{fraction} = \\frac{200,000 - 128,337.19}{200,000} = 35.8\\%',
        ],
        answer: '35.8%, less than half',
      },
      traps: [
        'Use the number of payments left (T − k), not T.',
        'Do not subtract k × C from the loan: part of every payment was interest.',
      ],
    },
  }),
  c({
    id: 'interest-share',
    name: 'Interest share of a payment',
    summary: 'Interest in payment k = r × balance at the start of that year.',
    lesson: {
      plain: [
        'Each loan payment has two parts: interest on what you owed at the start of the year, and the rest, which pays down the balance.',
        'Interest in payment k = r × B₍k−1₎, the balance just before that payment. For the first payment, that balance is the full loan.',
        'Interest share = that interest ÷ the payment. It falls over the life of the loan, because the balance shrinks.',
      ],
      formula: { tex: 'share_{k} = \\frac{r \\times B_{k-1}}{C}', where: ['B₀ = amount borrowed'] },
      example: {
        prompt: 'The $200,000, 6% mortgage with payment $17,436.91. What fraction of the first payment is interest? And the last?',
        working: [
          '\\text{first: } \\frac{0.06 \\times 200,000}{17,436.91} = \\frac{12,000}{17,436.91} = 68.8\\%',
          '\\text{last: } B_{19} = \\frac{17,436.91}{1.06} = 16,449.92 \\to \\frac{0.06 \\times 16,449.92}{17,436.91} = 5.7\\%',
        ],
        answer: '68.8% of the first payment; 5.7% of the last',
      },
      traps: [
        'Use the balance at the start of the year, before that payment is made.',
        'The payment stays the same; it is the split between interest and principal that changes.',
      ],
    },
  }),
  c({
    id: 'apr-ear',
    name: 'APR and the effective annual rate',
    summary: 'Compare loans by EAR = (1 + APR/m)^m − 1.',
    lesson: {
      plain: [
        'Banks quote an annual percentage rate (APR): the rate per period times the number of periods in a year. A card charging 1% a month is quoted as 12% APR.',
        'If interest is added more than once a year, interest starts earning interest within the year. The effective annual rate (EAR) is what you actually pay over a full year.',
        'To compare loans or deposits with different compounding, always compare EARs.',
      ],
      timeline: {
        periods: 12,
        unit: 'month',
        marks: Array.from({ length: 12 }, (_, i) => ({ at: i + 1, label: '1%', kind: 'out' as const })),
        caption: '12% APR, compounded monthly: 1% added twelve times.',
      },
      formula: {
        tex: 'r_{EAR} = \\left(1 + \\frac{r_{APR}}{m}\\right)^{m} - 1',
        onSheet: true,
        where: ['m: number of compounding periods a year'],
      },
      example: {
        prompt: 'A credit card quotes 12% APR, compounded monthly. What is the EAR?',
        working: ['r_{EAR} = \\left(1 + \\frac{0.12}{12}\\right)^{12} - 1 = 1.01^{12} - 1', 'r_{EAR} = 12.68\\%'],
        answer: '12.68%',
      },
      traps: [
        'Divide the APR by m first, then compound. Do not compound the APR itself.',
        'A rate that is already compounded annually is its own EAR.',
      ],
    },
  }),
];
