// The ten chapters. IV–X are placeholders until built. VI and VII follow the lecture order (L8, then L9).
import type { Act } from '../engine/types';
import { ACT_1 } from './act-1';
import { ACT_2 } from './act-2';
import { ACT_3 } from './act-3';
import { ACT_4 } from './act-4';
import { ACT_5 } from './act-5';
import { EXAM_ROOMS } from './exam-rooms';

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
  ...[ACT_1, ACT_2, ACT_3, ACT_4, ACT_5].map((a) => ({ ...a, exam: EXAM_ROOMS[a.number] })),
  draft(6, 'VI', 'Debt or equity', 'Lecture 8', 'BMA Ch16–17', 'How much to borrow, and what it does to risk.'),
  draft(7, 'VII', 'The hurdle rate', 'Lecture 9', 'BMA Ch9', 'A risky streetwear line, judged at the wrong rate.'),
  draft(8, 'VIII', 'Valuing the maison', 'Lecture 10', 'BMA Ch18', 'The house is valued two ways.'),
  draft(9, 'IX', 'Paying the family', 'Lecture 11', 'BMA Ch15', 'A dividend or a buyback, and how the market reacts.'),
  draft(10, 'X', 'The conglomerate calls', 'Lecture 12', 'BMA Ch32', 'A luxury group bids for the house.'),
];
