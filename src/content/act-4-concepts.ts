// Chapter IV lessons: capital budgeting (Lecture 5, BMA Ch5–6). Margaux's voice; no lecture references.
import type { Concept } from '../engine/types';

const c = (x: Omit<Concept, 'act'>): Concept => ({ act: 4, ...x });

export const ACT4_CONCEPTS: Concept[] = [
  c({
    id: 'payback',
    name: 'Payback and why it misleads',
    summary: 'Years until the cash flows repay the cost. Ignores timing and everything after the cut-off.',
    lesson: {
      plain: [
        'Payback asks one thing: how many years until the project’s cash has paid back what it cost?',
        'Firms like it because it’s quick. But it ignores the time value of money, and it ignores everything that happens after the cut-off date.',
        'So it can accept a project that loses value, and reject one that creates lots. NPV is the rule we trust. Payback is, at best, a rough check.',
      ],
      formula: { tex: '\\text{payback} = \\text{years before} + \\frac{\\text{cost still to recover}}{\\text{next year’s cash flow}}' },
      example: {
        prompt: 'A project costs 5,000 and returns 1,000, 1,000, 3,000 and then 0. The cost of capital is 10%.',
        working: ['\\text{Payback: } 1,000 + 1,000 + 3,000 = 5,000 \\to 3 \\text{ years}', 'NPV = -5,000 + \\frac{1,000}{1.1} + \\frac{1,000}{1.1^{2}} + \\frac{3,000}{1.1^{3}} = -1,011'],
        answer: 'Pays back in 3 years, but its NPV is −1,011: it destroys value',
      },
      traps: ['A quick payback doesn’t mean a positive NPV.', 'One cut-off for every project favours short-lived projects.'],
    },
  }),
  c({
    id: 'arr',
    name: 'Accounting rate of return',
    summary: 'Average accounting profit ÷ average investment. Ignores timing and uses profit, not cash.',
    lesson: {
      plain: [
        'The accounting (book) rate of return divides average annual accounting profit by the average book value of the investment.',
        'Two problems. It uses accounting profit, which isn’t cash. And it ignores when the money arrives.',
        'There’s no sound benchmark to compare it with, either: a book return isn’t the same thing as the cost of capital.',
      ],
      formula: { tex: 'ARR = \\frac{\\text{average annual accounting profit}}{\\text{average book investment}}' },
      example: {
        prompt: 'An 80,000 machine is depreciated straight-line over 4 years. Profits are 5,000, 6,000, 10,000 and 7,000.',
        working: ['\\text{Average profit} = \\frac{5 + 6 + 10 + 7}{4} = 7,000', '\\text{Average investment} = \\frac{80 + 60 + 40 + 20}{4} = 50,000', 'ARR = \\frac{7,000}{50,000} = 14\\%'],
        answer: '14%',
      },
      traps: ['Book value is the value after each year’s depreciation, not the original cost.', 'A high ARR doesn’t prove a positive NPV.'],
    },
  }),
  c({
    id: 'irr',
    name: 'Internal rate of return',
    summary: 'The rate that makes NPV zero. Accept if IRR beats the cost of capital (usually).',
    lesson: {
      plain: [
        'The IRR is the discount rate that makes a project’s NPV exactly zero.',
        'The rule: accept if the IRR is above the cost of capital. For a normal project, cash out first and in after, that gives the same answer as NPV.',
        'Like the yield on a bond, there’s no formula to rearrange. Try rates until NPV hits zero.',
      ],
      example: {
        prompt: 'A project costs 100 and returns 50 a year for 3 years. What is its IRR?',
        working: ['0 = -100 + \\frac{50}{1 + IRR} + \\frac{50}{(1 + IRR)^{2}} + \\frac{50}{(1 + IRR)^{3}}', 'IRR \\approx 23.38\\%'],
        answer: '23.38%',
      },
      traps: ['IRR is a rate, not a value. It can’t tell you how much a project adds.', 'Compare IRR with the cost of capital, not with zero.'],
    },
  }),
  c({
    id: 'irr-pitfalls',
    name: 'When IRR breaks',
    summary: 'Cash flows that change sign more than once can have several IRRs. Then use NPV.',
    lesson: {
      plain: [
        'If the cash flows switch between negative and positive more than once, there can be more than one IRR: as many as there are sign changes.',
        'Which one do you compare with the cost of capital? Neither makes sense. Work out the NPV at the cost of capital instead.',
        'Typical culprit: a project with a big clean-up or restoration cost at the end.',
      ],
      example: {
        prompt: 'Cash flows: −30 today, +10 a year for 9 years, then −65 in year 10.',
        working: ['\\text{Two sign changes} \\to \\text{up to two IRRs}', 'NPV = 0 \\text{ at } 3.50\\% \\text{ and at } 19.54\\%'],
        answer: 'Two IRRs: 3.50% and 19.54%',
      },
      traps: ['Count the sign changes before you trust an IRR.', 'NPV is still a single, clear number.'],
    },
  }),
  c({
    id: 'incremental-irr',
    name: 'Choosing between projects with IRR',
    summary: 'For either-or projects, take the IRR of the difference. If it beats r, take the bigger project.',
    lesson: {
      plain: [
        'When you can only pick one of two projects, the higher IRR can point the wrong way. IRR favours small projects and ones that pay back early.',
        'The fix: subtract the smaller project’s cash flows from the bigger one’s, and find the IRR of that difference.',
        'If the incremental IRR beats the cost of capital, the extra investment is worth it: choose the bigger project. It will also have the higher NPV.',
      ],
      example: {
        prompt: 'Alpha: −400,000, then +241,000, +293,000. Beta: −200,000, then +131,000, +172,000. Cost of capital 8%. Alpha’s IRR is 21%, Beta’s 31%.',
        working: ['\\text{Alpha} - \\text{Beta}: -200,000,\\ +110,000,\\ +121,000', '\\frac{110,000}{1.10} + \\frac{121,000}{1.10^{2}} = 200,000 \\to IRR = 10\\%', '10\\% > 8\\% \\to \\text{choose Alpha}'],
        answer: 'Alpha, despite its lower IRR',
      },
      traps: ['Always subtract the smaller (or earlier-paying) project from the larger one.', 'The incremental IRR is compared with r, not with either project’s IRR.'],
    },
  }),
  c({
    id: 'incremental-cf',
    name: 'Which cash flows count',
    summary: 'Cash, after tax, with v. without the project. Ignore sunk costs; include opportunity costs.',
    lesson: {
      plain: [
        'Value a project by comparing the house with it and without it. Only the difference counts: the incremental cash flows.',
        'Cash, not accounting profit. After tax.',
        'Sunk costs are gone whatever you decide: ignore them. Opportunity costs are real: if you use a studio you could otherwise rent out, the lost rent counts.',
        'Overheads only count if the project actually changes them. Spreading head-office costs across projects doesn’t make them incremental.',
      ],
      traps: ['Last year’s market research is sunk. Don’t charge it to the project.', 'Using something you already own is not free if it could earn money elsewhere.'],
    },
  }),
  c({
    id: 'depreciation-tax',
    name: 'Tax and the depreciation shield',
    summary: 'Depreciation isn’t cash, but it cuts the tax bill. Operating cash flow = revenue − costs − tax.',
    lesson: {
      plain: [
        'Depreciation spreads an asset’s cost over its life. No cash leaves the house when you book it.',
        'But it’s deductible for tax. So it cuts the tax bill by tax rate × depreciation: the depreciation tax shield.',
        'So: tax = tax rate × (revenue − costs − depreciation). Operating cash flow = revenue − costs − tax. Depreciation is in the tax sum, not the cash sum.',
      ],
      formula: { tex: '\\text{Tax} = t \\times (R - C - D) \\qquad OCF = R - C - \\text{Tax}' },
      example: {
        prompt: 'Year 1: sales 2.0, costs 0.5, depreciation 1.2 (€m). Tax 25%.',
        working: ['\\text{Tax} = 0.25 \\times (2.0 - 0.5 - 1.2) = 0.075', 'OCF = 2.0 - 0.5 - 0.075 = 1.425'],
        answer: 'Operating cash flow €1.425m',
      },
      traps: ['Don’t subtract depreciation from cash flow: only from taxable profit.', 'Straight-line depreciation = cost ÷ years, from year 1.'],
    },
  }),
  c({
    id: 'working-capital',
    name: 'Working capital',
    summary: 'Cash tied up in stock and unpaid invoices. A rise is cash out; a fall is cash back.',
    lesson: {
      plain: [
        'A new line needs stock on the shelves and customers who pay late. That’s working capital: cash tied up in the business.',
        'What counts each year is the change. Working capital going up is cash out; going down is cash back.',
        'At the end of the project it all comes back. So it costs you the time value of money, not the money itself. But it does cost you: ignoring it overstates NPV.',
      ],
      example: {
        prompt: 'Working capital must be 10% of next year’s sales. Sales are 2.0 in year 1 and 2.4 in year 2.',
        working: ['WC_{0} = 0.10 \\times 2.0 = 0.20 \\to \\text{cash flow } -0.20', 'WC_{1} = 0.10 \\times 2.4 = 0.24 \\to \\text{cash flow } -(0.24 - 0.20) = -0.04'],
        answer: '−0.20 in year 0, −0.04 in year 1',
      },
      traps: ['Use the change in working capital, not its level.', '“Recovered at the end” doesn’t mean “ignore it”.'],
    },
  }),
  c({
    id: 'salvage',
    name: 'Salvage value after tax',
    summary: 'After-tax salvage = sale price − tax × (sale price − book value).',
    lesson: {
      plain: [
        'At the end, old equipment can often be sold. That’s a cash inflow.',
        'But if you sell it for more than its book value, the gain is taxed. If it’s fully depreciated, book value is zero, so the whole sale price is a taxable gain.',
      ],
      formula: { tex: '\\text{After-tax salvage} = S - t \\times (S - BV)' },
      example: {
        prompt: 'Equipment fully depreciated to zero is sold for €0.5m. Tax 25%.',
        working: ['0.5 - 0.25 \\times (0.5 - 0) = 0.375'],
        answer: '€0.375m',
      },
      traps: ['Fully depreciated means book value 0, so the whole price is taxed.', 'Salvage arrives in the final year, with the last operating cash flow.'],
    },
  }),
  c({
    id: 'profitability-index',
    name: 'Capital rationing and the profitability index',
    summary: 'With a limited budget, rank projects by NPV per euro invested: PI = NPV ÷ investment.',
    lesson: {
      plain: [
        'Sometimes there isn’t enough money for every positive-NPV project. Then you want the most NPV for the budget you have.',
        'The profitability index measures NPV per euro of investment: PI = NPV ÷ investment.',
        'Rank projects by PI and fund from the top until the money runs out. Two small high-PI projects can beat one big project with a higher NPV.',
      ],
      formula: { tex: 'PI = \\frac{NPV}{\\text{investment}}' },
      traps: ['Without a budget limit, just take every positive-NPV project.', 'PI ranks projects; it doesn’t replace NPV.'],
    },
  }),
];
