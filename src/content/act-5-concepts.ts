// Chapter V lessons: risk and return (Lecture 6, BMA Ch7–8). Margaux's voice; no lecture references.
// None of these formulas is on the exam formula sheet, so each says so.
import type { Concept } from '../engine/types';

const c = (x: Omit<Concept, 'act'>): Concept => ({ act: 5, ...x });
const LEARN = 'Not on your formula sheet: learn it';

export const ACT5_CONCEPTS: Concept[] = [
  c({
    id: 'returns',
    name: 'Returns: gain plus income',
    summary: 'Return = (end value − start value + dividends) ÷ start value. Compare real returns, not nominal.',
    lesson: {
      plain: [
        'Before we talk about risk, we need to say exactly what an investment earned. Two things can happen to money you invest: its price moves, and it pays you something along the way.',
        'The return is both together, as a share of what you put in: the capital gain (price change ÷ starting price) plus the income yield (dividend ÷ starting price).',
        'It’s a nominal figure until you strip out inflation. A 95% return in a country with 80% inflation is a worse deal than 12% where prices rose 2%. Use the real rate: (1 + nominal) ÷ (1 + inflation) − 1.',
      ],
      formula: { tex: 'R = \\frac{P_{1} - P_{0} + D}{P_{0}} = \\text{capital gain} + \\text{dividend yield}', where: [LEARN] },
      example: {
        prompt: 'A share index starts the year at 21,000 and ends at 25,500. It paid a dividend yield of 4.2%. Inflation was 8%.',
        working: ['\\text{Capital gain} = \\frac{25,500 - 21,000}{21,000} = 21.43\\%', 'R = 21.43\\% + 4.2\\% = 25.63\\%', '\\text{Real return} = \\frac{1.2563}{1.08} - 1 = 16.32\\%'],
        answer: '25.63% nominal, 16.32% real',
      },
      traps: ['The dividend is part of the return. Leave it out and you understate it.', 'Real return isn’t “nominal minus inflation” exactly: divide, don’t subtract.', 'Divide by the starting price, not the ending one.'],
    },
  }),
  c({
    id: 'risk-premium',
    name: 'The risk premium',
    summary: 'Premium = return on a risky asset − return on a risk-free one. Risk-averse investors demand it.',
    lesson: {
      plain: [
        'Treasury bills are as close to risk-free as it gets. Shares are not. And over long periods, shares have paid more than bills.',
        'That extra is the risk premium: the return on a risky investment minus the risk-free return. In the US over 1900–2020, bills averaged 3.7% and shares 11.5%, so the premium was 7.8%.',
        'People are risk-averse: they don’t like risk, so they only take it if they’re paid for it. So: risky return = risk-free return + risk premium, and more risk means a bigger premium.',
      ],
      formula: { tex: '\\text{risk premium} = R_{risky} - R_{f}', where: [LEARN] },
      example: {
        prompt: 'Bills returned 4.8%, 2.4% and 1.1% over three years. Shares returned −14.5%, −28.3% and −43.9%.',
        working: ['\\text{Premiums: } -19.3,\\ -30.7,\\ -45.0', '\\text{Average} = \\frac{-19.3 - 30.7 - 45.0}{3} = -31.67\\%'],
        answer: 'An average premium of −31.67%: in those years, risk wasn’t rewarded',
      },
      traps: ['The premium is measured against the risk-free rate, not against zero.', 'A negative premium in a short run doesn’t mean there’s no premium over decades.'],
    },
  }),
  c({
    id: 'spread-risk',
    name: 'Measuring risk: variance and standard deviation',
    summary: 'Average the squared distances from the mean. Past data: weights 1/n. Forecasts: weights are probabilities.',
    lesson: {
      plain: [
        'Risk is how much returns spread out. Two investments can have the same average return and be wildly different to hold. The measure is variance: the average squared distance from the mean.',
        'Square the distances so ups and downs don’t cancel. Then take the square root to get back to percent: that’s the standard deviation.',
        'Two situations, one calculation. From past returns, every year counts equally (weight 1 ÷ n). From a forecast, each outcome is weighted by its probability. Find the mean first: every later step depends on it.',
      ],
      formula: {
        tex: '\\sigma^{2} = \\frac{1}{n}\\sum (R_{t} - \\bar{R})^{2} \\qquad \\sigma^{2} = \\sum p_{i}\\,(R_{i} - E[R])^{2}',
        where: [LEARN, 'The first is from past data, the second from probabilities'],
      },
      example: {
        prompt: 'A forecast: boom (30%) returns +25%, normal (40%) +10%, recession (30%) −5%.',
        working: ['E[R] = 0.3(25) + 0.4(10) + 0.3(-5) = 10\\%', '\\sigma^{2} = 0.3(15)^{2} + 0.4(0)^{2} + 0.3(-15)^{2} = 135', '\\sigma = \\sqrt{135} = 11.62\\%'],
        answer: 'Expected return 10%, standard deviation 11.62%',
      },
      traps: ['Deviations from the mean always sum to zero: use that as a check.', 'Variance is in “percent squared”. Report the standard deviation.', 'Don’t divide by n when you have probabilities: the probabilities are the weights.'],
    },
  }),
  c({
    id: 'covariance',
    name: 'Covariance and correlation',
    summary: 'Covariance: do two returns move together? Correlation scales it to between −1 and +1.',
    lesson: {
      plain: [
        'A portfolio’s risk isn’t just the risk of its parts. It also depends on whether the parts rise and fall together. For that we need a measure of co-movement.',
        'Covariance multiplies the two stocks’ deviations from their means, year by year, and averages them. Positive: they tend to move together. Negative: they move in opposite directions.',
        'Its size depends on how volatile the stocks happen to be, so divide by both standard deviations to get the correlation: always between −1 and +1. Most pairs of shares sit between 0.2 and 0.8.',
      ],
      formula: { tex: '\\text{Cov}(A,B) = \\frac{1}{n}\\sum (R_{A} - \\bar{R}_{A})(R_{B} - \\bar{R}_{B}) \\qquad \\rho_{AB} = \\frac{\\text{Cov}(A,B)}{\\sigma_{A}\\sigma_{B}}', where: [LEARN] },
      example: {
        prompt: 'Stocks X and Y over five years: X returns 14, 22, 6, −2, 10; Y returns 17, 11, −1, 5, 8 (%).',
        working: ['\\bar{R}_{X} = 10,\\ \\bar{R}_{Y} = 8,\\ \\sigma_{X} = 8,\\ \\sigma_{Y} = 6', '\\text{Cov} = \\frac{36 + 36 + 36 + 36 + 0}{5} = 28.8', '\\rho = \\frac{28.8}{8 \\times 6} = 0.6'],
        answer: 'Covariance 28.8, correlation 0.6',
      },
      traps: ['Covariance of a stock with itself is its variance.', 'Correlation carries the same sign as covariance: it adds interpretability, not new information.', 'Use the same years for both stocks.'],
    },
  }),
  c({
    id: 'portfolio-risk',
    name: 'Risk and return of a two-stock portfolio',
    summary: 'Return is the weighted average; risk is lower than the weighted average unless the correlation is +1.',
    lesson: {
      plain: [
        'The expected return of a portfolio is just the weighted average of its parts. No surprises there.',
        'The risk is different. Variance picks up a cross-term that depends on how the two stocks move together. The lower the correlation, the more the risk shrinks below the weighted average of the two standard deviations.',
        'At correlation +1 you get no help at all. At −1 you can cancel the risk out completely. Diversification is the only free lunch in finance.',
      ],
      formula: {
        tex: 'E[R_{p}] = w_{1}E[R_{1}] + w_{2}E[R_{2}] \\qquad \\sigma_{p}^{2} = w_{1}^{2}\\sigma_{1}^{2} + w_{2}^{2}\\sigma_{2}^{2} + 2w_{1}w_{2}\\rho_{12}\\sigma_{1}\\sigma_{2}',
        where: [LEARN, 'w₂ = 1 − w₁'],
      },
      example: {
        prompt: '60% in a stock with SD 10% and 40% in one with SD 20%. Correlation 0.5.',
        working: ['\\sigma_{p}^{2} = 0.36(100) + 0.16(400) + 2(0.6)(0.4)(0.5)(10)(20)', '= 36 + 64 + 48 = 148', '\\sigma_{p} = \\sqrt{148} = 12.17\\%'],
        answer: '12.17%, against a weighted average of 14%',
      },
      traps: ['Take the square root at the end: the formula gives a variance.', 'The weights must add to 1.', 'At correlation +1, the portfolio SD is exactly the weighted average of the two SDs.'],
    },
  }),
  c({
    id: 'diversification',
    name: 'Diversification: specific and market risk',
    summary: 'Specific risk disappears in a big portfolio; market risk stays. Only market risk earns a premium.',
    lesson: {
      plain: [
        'A single share’s risk has two parts. Specific (idiosyncratic) risk belongs to one company: a factory fire, a key designer leaving. Market (systematic) risk hits everyone: recessions, wars, interest rates.',
        'Hold lots of shares and the specific bits cancel out, because they don’t all go wrong at once. By about 20 stocks, diversification has done the bulk of its work. What’s left is market risk, and no number of shares removes it.',
        'Diversifying is free, so the market doesn’t pay you for specific risk. Only market risk earns a risk premium.',
      ],
      traps: ['“Diversified” doesn’t mean “safe”: market risk is still there.', 'Ten stocks in the same industry share the same specific risks. Spread across industries.', 'No one is paid for taking a risk they could have diversified away.'],
    },
  }),
  c({
    id: 'beta',
    name: 'Beta: a stock’s market risk',
    summary: 'Beta = Cov(stock, market) ÷ Var(market): the slope of the stock’s returns on the market’s. Portfolio beta is the weighted average.',
    lesson: {
      plain: [
        'For someone who already holds the market, the only risk a new investment adds is its market risk. Beta measures it: how much the stock tends to move when the market moves 1%.',
        'It’s the slope when you plot the stock’s returns against the market’s. Beta 1 moves with the market. Above 1 amplifies it; below 1 dampens it; zero ignores it; negative moves against it.',
        'Betas average neatly: a portfolio’s beta is the weighted average of the betas inside it.',
      ],
      formula: { tex: '\\beta_{i} = \\frac{\\text{Cov}(R_{i}, R_{m})}{\\text{Var}(R_{m})} \\qquad \\beta_{p} = \\sum w_{i}\\beta_{i}', where: [LEARN] },
      example: {
        prompt: 'When the market returns −10%, a stock returns −20%. When the market returns +10%, it returns +20%.',
        working: ['\\beta = \\frac{20 - (-20)}{10 - (-10)} = 2'],
        answer: 'Beta of 2: it moves twice as far as the market',
      },
      traps: ['Beta is not total risk. A stock can have a high SD and a low beta.', 'Diversification doesn’t reduce beta: portfolio beta is a straight weighted average.', 'The market’s own beta is 1.'],
    },
  }),
  c({
    id: 'capm',
    name: 'CAPM: the price of risk',
    summary: 'Required return = risk-free rate + beta × (market return − risk-free rate).',
    lesson: {
      plain: [
        'Now put a price on market risk. The risk premium on any investment is its quantity of risk (beta) times the price per unit of risk. For the market itself, beta is 1, so the price of risk is the market return minus the risk-free rate.',
        'That’s the Capital Asset Pricing Model: required return = risk-free rate + beta × market risk premium. It’s a straight line against beta, the security market line.',
        'The required return is the discount rate for a project with that risk. If an investment’s expected return is above the line, it has a positive NPV; below, negative.',
      ],
      formula: { tex: 'E[R_{i}] = R_{f} + \\beta_{i}\\,(R_{m} - R_{f})', where: [LEARN, 'R_m − R_f is the market risk premium'] },
      example: {
        prompt: 'The Treasury bill rate is 4% and the market is expected to return 12%. What return should a stock with beta 1.5 give?',
        working: ['R_{m} - R_{f} = 12 - 4 = 8\\%', 'E[R] = 4 + 1.5 \\times 8 = 16\\%'],
        answer: '16%',
      },
      traps: ['Multiply beta by the premium (R_m − R_f), not by R_m.', 'Beta below 1 gives a required return below the market’s, not below the risk-free rate.', 'Expected return above the CAPM return means a positive NPV.'],
    },
  }),
  c({
    id: 'capital-allocation',
    name: 'Mixing the market with the risk-free asset',
    summary: 'Everyone holds the market portfolio plus the risk-free asset. How much of each depends on target risk or return.',
    lesson: {
      plain: [
        'With a risk-free asset available, every investor should hold the same risky portfolio: the market. Combining it with a risk-free asset is what sets your risk.',
        'Portfolio risk = weight in the market × the market’s SD (the risk-free asset adds none). Portfolio return = risk-free rate + weight × the market premium.',
        'Want less risk? Hold more risk-free. Want more return? Hold more market. A weight above 100% means borrowing at the risk-free rate to invest more in the market.',
      ],
      formula: { tex: 'w_{m} = \\frac{\\sigma_{target}}{\\sigma_{m}} \\qquad w_{m} = \\frac{R_{target} - R_{f}}{R_{m} - R_{f}}', where: [LEARN, 'The first for a target risk, the second for a target return'] },
      example: {
        prompt: 'The market returns 10% with SD 15%; the risk-free rate is 5%. You want a portfolio SD of 10%.',
        working: ['w_{m} = \\frac{10}{15} = 0.667', 'w_{rf} = 1 - 0.667 = 0.333'],
        answer: '66.7% in the market, 33.3% risk-free',
      },
      traps: ['The weights add to 1; a negative risk-free weight means borrowing.', 'Hitting a target return uses the premium; hitting a target risk uses the SDs.', 'A portfolio is efficient if nothing else offers more return for the same risk, or less risk for the same return.'],
    },
  }),
  c({
    id: 'market-efficiency',
    name: 'Market efficiency',
    summary: 'Weak: past prices say nothing. Semi-strong: all public information is in the price. Strong: all information is.',
    lesson: {
      plain: [
        'All of this assumes you can’t reliably pick winners. That holds if markets are efficient: prices already reflect what is knowable.',
        'Weak form: today’s price already reflects all past prices, so charts can’t predict tomorrow. Prices follow a random walk. If they didn’t, people would trade on the pattern until it disappeared.',
        'Semi-strong: prices also reflect all public information, so they jump the moment news breaks and don’t drift afterwards. Strong: prices reflect all information, even private. If so, professional fund managers wouldn’t beat the market on average.',
      ],
      traps: ['“Efficient” doesn’t mean prices are always right. It means you can’t systematically predict their changes.', 'Each form includes the one before: strong includes semi-strong, which includes weak.', 'Evidence that managers fail to beat the index supports the strong form.'],
    },
  }),
];
