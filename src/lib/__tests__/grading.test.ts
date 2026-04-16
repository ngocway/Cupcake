
import { describe, it, expect } from 'vitest';
import { gradeClozeTest, gradeReorderTask, calculateAverageScore } from '../grading';

describe('Grading Utility Services', () => {
  
  describe('gradeClozeTest (Fill-in-the-blanks)', () => {
    it('should return true if the student answer matches correctly (case insensitive)', () => {
      const correctAnswers = ['Antigravity', 'Agent'];
      expect(gradeClozeTest('antigravity', correctAnswers)).toBe(true);
      expect(gradeClozeTest('  AGENT  ', correctAnswers)).toBe(true);
    });

    it('should return false if the student answer does not match any correct answer', () => {
      const correctAnswers = ['NextJS', 'Prisma'];
      expect(gradeClozeTest('React', correctAnswers)).toBe(false);
    });

    it('should return false for empty or null inputs', () => {
      expect(gradeClozeTest('', ['anything'])).toBe(false);
      // @ts-ignore
      expect(gradeClozeTest(null, ['anything'])).toBe(false);
    });
  });

  describe('gradeReorderTask (Ordering)', () => {
    it('should return true for an identical array of strings', () => {
      const correct = ['One', 'Two', 'Three'];
      const student = ['One', 'Two', 'Three'];
      expect(gradeReorderTask(student, correct)).toBe(true);
    });

    it('should return false if the order is different', () => {
      const correct = ['A', 'B', 'C'];
      const student = ['A', 'C', 'B'];
      expect(gradeReorderTask(student, correct)).toBe(false);
    });

    it('should return false for different lengths', () => {
      expect(gradeReorderTask(['A'], ['A', 'B'])).toBe(false);
    });
  });

  describe('calculateAverageScore (Weighted Gradebook)', () => {
    it('should calculate the correct weighted average', () => {
      const scores = [
        { score: 8, coefficient: 1 },
        { score: 10, coefficient: 2 },
      ];
      // (8*1 + 10*2) / (1+2) = 28 / 3 = 9.333...
      expect(calculateAverageScore(scores)).toBe(9.3);
    });

    it('should ignore assignments with null scores', () => {
      const scores = [
        { score: 5, coefficient: 1 },
        { score: null, coefficient: 5 },
      ];
      expect(calculateAverageScore(scores)).toBe(5);
    });

    it('should return 0 if there are no valid submissions', () => {
      expect(calculateAverageScore([])).toBe(0);
      expect(calculateAverageScore([{ score: null, coefficient: 1 }])).toBe(0);
    });
  });
});
