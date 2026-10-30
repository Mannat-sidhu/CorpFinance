// The formula sheet given in the exam, plus the named methods built from it.
import type { Character, CharacterId, Method } from '../engine/types';

/** The seven formulas on the FIN40940 exam sheet, exactly as provided. */
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
};

export const CHARACTERS: Record<CharacterId, Character> = {
  margaux: { id: 'margaux', name: 'Margaux Byrne', role: 'Chief financial officer' },
  theo: { id: 'theo', name: 'Theo Lalor', role: 'Studio manager' },
  idris: { id: 'idris', name: 'Idris Kell', role: 'Majority backer' },
  ferriter: { id: 'ferriter', name: 'Mrs Ferriter', role: 'Landlord' },
  aoife: { id: 'aoife', name: 'Aoife Brennan', role: "Merchant's Quay Bank" },
  narrator: { id: 'narrator', name: '', role: '' },
  news: { id: 'news', name: 'The Gazette', role: 'Trade press' },
};
