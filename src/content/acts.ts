// The ten acts. Acts II–X are placeholders until their lectures are built.
import type { Act } from '../engine/types';
import { ACT_1 } from './act-1';

const draft = (number: number, numeral: string, title: string, lecture: string, chapters: string, blurb: string): Act => ({
  number,
  numeral,
  title,
  lecture,
  chapters,
  blurb,
  concepts: [],
  sessions: [],
  draft: true,
});

export const ACTS: Act[] = [
  ACT_1,
  draft(2, 'II', 'Borrowing to grow', 'Lecture 3', 'BMA Ch3', 'The house issues a bond, then rates rise and its rating is cut.'),
  draft(3, 'III', 'Investors at the door', 'Lecture 4', 'BMA Ch4', 'An angel investor wants a stake.'),
  draft(4, 'IV', 'The collection decision', 'Lecture 5', 'BMA Ch5–6, 10', 'Three managers pitch new lines, each with a hidden trap.'),
  draft(5, 'V', 'What investors want', 'Lectures 6–7', 'BMA Ch7–8', 'The house builds an investment portfolio.'),
  draft(6, 'VI', 'The hurdle rate', 'Lecture 9', 'BMA Ch9', 'A risky streetwear line, judged at the wrong rate.'),
  draft(7, 'VII', 'Debt or equity', 'Lecture 8', 'BMA Ch16–17', 'How much to borrow, and what it does to risk.'),
  draft(8, 'VIII', 'Valuing the maison', 'Lecture 10', 'BMA Ch18', 'The house is valued two ways.'),
  draft(9, 'IX', 'Paying the family', 'Lecture 11', 'BMA Ch15', 'A dividend or a buyback, and how the market reacts.'),
  draft(10, 'X', 'The conglomerate calls', 'Lecture 12', 'BMA Ch32', 'A luxury group bids for the house.'),
];
