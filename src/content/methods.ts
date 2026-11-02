// The formula sheet, plus the named methods built from it.
import type { Character, CharacterId, Method } from '../engine/types';

/** The seven formulas on the FIN40940 formula sheet, exactly as provided. */
export const FORMULA_SHEET: { letter: string; name: string; tex: string }[] = [
  { letter: 'a', name: 'Present value of level perpetuity', tex: 'PV = \\frac{C}{r}' },
  { letter: 'b', name: 'Present value of growing perpetuity', tex: 'PV = \\frac{C}{r - g}' },
  { letter: 'c', name: 'Present value of level annuity', tex: 'PV = \\frac{C}{r}\\left(1 - \\frac{1}{(1 + r)^{T}}\\right)' },
  {
    letter: 'd',
    name: 'Present value of growing annuity',
    tex: 'PV = \\frac{C}{(r - g)}\\left(1 - \\frac{(1 + g)^{T}}{(1 + r)^{T}}\\right)',
  },
  { letter: 'e', name: 'Effective annual rate (EAR)', tex: 'r_{EAR} = \\left(1 + \\frac{r_{APR}}{m}\\right)^{m} - 1' },
  {
    letter: 'f',
    name: 'Bond valuation',
    tex: 'PV = \\frac{C}{r}\\left(1 - \\frac{1}{(1 + r)^{T}}\\right) + \\frac{F}{(1 + r)^{T}}',
  },
  { letter: 'g', name: 'Real versus nominal rate', tex: '1 + r_{real} = \\frac{1 + r_{nominal}}{1 + inflation}' },
];

export const METHODS: Record<string, Method> = {
  'pv-single': { id: 'pv-single', name: 'Discount a single cash flow', tex: 'PV = \\frac{C_{T}}{(1 + r)^{T}}' },
  'fv-single': { id: 'fv-single', name: 'Grow a single cash flow forward', tex: 'FV = C_{0} \\times (1 + r)^{T}' },
  'npv-sum': {
    id: 'npv-sum',
    name: 'NPV: discount each cash flow and add',
    tex: 'NPV = C_{0} + \\frac{C_{1}}{1 + r} + \\frac{C_{2}}{(1 + r)^{2}} + \\cdots + \\frac{C_{T}}{(1 + r)^{T}}',
  },
  perpetuity: { id: 'perpetuity', name: 'Level perpetuity', tex: 'PV = \\frac{C}{r}', sheet: 'a' },
  'growing-perpetuity': { id: 'growing-perpetuity', name: 'Growing perpetuity', tex: 'PV = \\frac{C_{1}}{r - g}', sheet: 'b' },
  annuity: {
    id: 'annuity',
    name: 'Level annuity',
    tex: 'PV = \\frac{C}{r}\\left(1 - \\frac{1}{(1 + r)^{T}}\\right)',
    sheet: 'c',
  },
  'growing-annuity': {
    id: 'growing-annuity',
    name: 'Growing annuity',
    tex: 'PV = \\frac{C_{1}}{(r - g)}\\left(1 - \\frac{(1 + g)^{T}}{(1 + r)^{T}}\\right)',
    sheet: 'd',
  },
  'annuity-due': {
    id: 'annuity-due',
    name: 'Annuity due: level annuity × (1 + r)',
    tex: 'PV = \\frac{C}{r}\\left(1 - \\frac{1}{(1 + r)^{T}}\\right) \\times (1 + r)',
    sheet: 'c',
  },
  'delayed-perpetuity': {
    id: 'delayed-perpetuity',
    name: 'Delayed perpetuity: C/r, then discount back',
    tex: 'PV_{0} = \\frac{C / r}{(1 + r)^{t - 1}}',
    sheet: 'a',
  },
  'loan-payment': {
    id: 'loan-payment',
    name: 'Loan payment: solve the annuity for C',
    tex: 'C = \\frac{PV}{\\frac{1}{r}\\left(1 - \\frac{1}{(1 + r)^{T}}\\right)}',
    sheet: 'c',
  },
  'loan-balance': {
    id: 'loan-balance',
    name: 'Balance owed: annuity of the payments left',
    tex: 'B_{k} = \\frac{C}{r}\\left(1 - \\frac{1}{(1 + r)^{T - k}}\\right)',
    sheet: 'c',
  },
  'interest-share': {
    id: 'interest-share',
    name: 'Interest share: r × balance owed ÷ payment',
    tex: 'share_{k} = \\frac{r \\times B_{k-1}}{C}',
  },
  ear: { id: 'ear', name: 'Effective annual rate', tex: 'r_{EAR} = \\left(1 + \\frac{r_{APR}}{m}\\right)^{m} - 1', sheet: 'e' },
  'apr-simple': { id: 'apr-simple', name: 'Annual rate = period rate × periods', tex: 'r = m \\times \\frac{r_{APR}}{m}' },
  'simple-interest': { id: 'simple-interest', name: 'Simple interest', tex: 'FV = C_{0}(1 + r \\times T)' },
  bond: {
    id: 'bond',
    name: 'Bond price: coupon annuity + face value',
    tex: 'PV = \\frac{C}{r}\\left(1 - \\frac{1}{(1 + r)^{T}}\\right) + \\frac{F}{(1 + r)^{T}}',
    sheet: 'f',
  },
  'bond-semi': {
    id: 'bond-semi',
    name: 'Bond price, half-yearly: C/2, r/2, 2T',
    tex: 'PV = \\frac{C/2}{r/2}\\left(1 - \\frac{1}{(1 + r/2)^{2T}}\\right) + \\frac{F}{(1 + r/2)^{2T}}',
    sheet: 'f',
  },
  'bond-ytm': {
    id: 'bond-ytm',
    name: 'Yield to maturity: find r so PV = price',
    tex: 'P = \\frac{C}{r}\\left(1 - \\frac{1}{(1 + r)^{T}}\\right) + \\frac{F}{(1 + r)^{T}} \\to \\text{solve for } r',
    sheet: 'f',
  },
  'real-rate': { id: 'real-rate', name: 'Real v. nominal rate', tex: '1 + r_{real} = \\frac{1 + r_{nominal}}{1 + inflation}', sheet: 'g' },
  'real-compound': {
    id: 'real-compound',
    name: 'Real return over several years',
    tex: '1 + R_{real} = \\frac{(1 + r)^{T}}{(1 + i_{1})(1 + i_{2})\\cdots}',
    sheet: 'g',
  },
  'nominal-minus': { id: 'nominal-minus', name: 'Real ≈ nominal − inflation', tex: 'r_{real} \\approx r_{nominal} - inflation' },
  'ddm-one': { id: 'ddm-one', name: 'Price from next year’s dividend and price', tex: 'P_{0} = \\frac{D_{1} + P_{1}}{1 + r}' },
  'div-yield': { id: 'div-yield', name: 'Return on a level dividend: r = D ÷ P', tex: 'r = \\frac{D}{P_{0}}', sheet: 'a' },
  gordon: { id: 'gordon', name: 'Constant-growth dividends', tex: 'P_{0} = \\frac{D_{1}}{r - g}', sheet: 'b' },
  'sustainable-g': { id: 'sustainable-g', name: 'Growth = ROE × plowback', tex: 'g = ROE \\times b = ROE \\times \\left(1 - \\frac{DPS}{EPS}\\right)' },
  pvgo: { id: 'pvgo', name: 'PVGO: price minus no-growth value', tex: 'PVGO = P_{0} - \\frac{EPS_{1}}{r}' },
  'two-stage': {
    id: 'two-stage',
    name: 'Two stages: growing annuity, then a perpetuity',
    tex: 'P_{0} = \\frac{D_{1}}{r - g}\\left(1 - \\frac{(1 + g)^{N}}{(1 + r)^{N}}\\right) + \\frac{D_{N} / r}{(1 + r)^{N}}',
    sheet: 'd',
  },
  payback: { id: 'payback', name: 'Payback: years until the cost is recovered', tex: '\\text{payback} = n + \\frac{\\text{still to recover after year } n}{C_{n+1}}' },
  arr: { id: 'arr', name: 'Accounting rate of return', tex: 'ARR = \\frac{\\text{average profit}}{\\text{average book investment}}' },
  irr: { id: 'irr', name: 'IRR: the rate where NPV = 0', tex: '0 = C_{0} + \\frac{C_{1}}{1 + IRR} + \\cdots + \\frac{C_{T}}{(1 + IRR)^{T}}' },
  'incremental-irr': {
    id: 'incremental-irr',
    name: 'Incremental IRR: IRR of (big − small)',
    tex: '0 = \\Delta C_{0} + \\frac{\\Delta C_{1}}{1 + IRR} + \\frac{\\Delta C_{2}}{(1 + IRR)^{2}}',
  },
  pi: { id: 'pi', name: 'Profitability index: NPV per euro invested', tex: 'PI = \\frac{NPV}{\\text{investment}}' },
};

export const CHARACTERS: Record<CharacterId, Character> = {
  margaux: { id: 'margaux', name: 'Margaux', role: 'Your CFO', vibe: 'Sharp, dry, never signs anything she hasn\u2019t checked.' },
  theo: { id: 'theo', name: 'Theo', role: 'Studio manager', vibe: 'Charming, loud shirts, loves a quick win. Paid on this year\u2019s cash.' },
  idris: { id: 'idris', name: 'Idris Kell', role: 'Owns 60% of the house', vibe: 'Old textile money. Smooth. Always has a family firm ready to help.' },
  ferriter: { id: 'ferriter', name: 'Mrs Ferriter', role: 'Your landlord', vibe: 'Owns half of Capel Street. Generous, in her own way.' },
  aoife: { id: 'aoife', name: 'Aoife', role: 'Merchant\u2019s Quay Bank', vibe: 'Brisk, friendly, sends a lot of letters.' },
  rupert: { id: 'rupert', name: 'Rupert', role: 'Investment banker', vibe: 'Pinstripes, a London accent, and a fee on everything he touches.' },
  celine: { id: 'celine', name: 'Céline', role: 'Angel investor', vibe: 'Backed two Paris labels. Wants growth, and hates waste.' },
  saoirse: { id: 'saoirse', name: 'Saoirse', role: 'Head of leather goods', vibe: 'Thinks big, builds slow, and loves a project with a huge payoff at the end.' },
  kenji: { id: 'kenji', name: 'Kenji', role: 'Head of menswear', vibe: 'Precise, quiet, obsessed with buttons. Always has a spreadsheet.' },
  narrator: { id: 'narrator', name: '', role: '', vibe: '' },
  news: { id: 'news', name: 'The Gazette', role: 'Trade press', vibe: '' },
};
