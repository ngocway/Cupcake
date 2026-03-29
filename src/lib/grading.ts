/**
 * Utility functions for grading quiz submissions based on EngMaster business rules.
 */

/**
 * Grades a Fill-in-the-blanks (Cloze Test) answer.
 * Rule: All-or-Nothing. Trims spaces, ignores case.
 * @param studentAnswer The string the student entered
 * @param correctAnswers An array of valid correct answers (for alternative answers)
 * @returns boolean true if the answer is completely correct
 */
export function gradeClozeTest(studentAnswer: string, correctAnswers: string[]): boolean {
  if (!studentAnswer || !correctAnswers || correctAnswers.length === 0) return false;
  
  const normalizedStudent = studentAnswer.trim().toLowerCase();
  
  return correctAnswers.some(ans => {
    return normalizedStudent === ans.trim().toLowerCase();
  });
}

/**
 * Grades a Reorder (Sắp xếp) question.
 * Rule: All-or-Nothing. Strict array equality matching.
 * @param studentArray The array of strings the student arranged
 * @param correctArray The array of strings in correct order
 * @returns boolean true if the arrays match exactly
 */
export function gradeReorderTask(studentArray: string[], correctArray: string[]): boolean {
  if (!studentArray || !correctArray || studentArray.length !== correctArray.length) {
    return false;
  }
  
  // Strict comparison using JSON.stringify
  return JSON.stringify(studentArray) === JSON.stringify(correctArray);
}

/**
 * Calculates the weighted average score for a student's gradebook.
 * Null values (unsubmitted assignments) are ignored in both the sum and the total coefficient.
 * @param assignments Array of assignment objects with score and coefficient
 * @returns The calculated average score rounded to 1 decimal place, or 0 if no valid submissions
 */
export function calculateAverageScore(
  assignments: { score: number | null; coefficient: number }[]
): number {
  let totalScore = 0;
  let totalCoefficient = 0;

  for (const ass of assignments) {
    if (ass.score !== null && ass.score !== undefined) {
      totalScore += ass.score * ass.coefficient;
      totalCoefficient += ass.coefficient;
    }
  }

  if (totalCoefficient === 0) return 0;
  
  // Return rounded to 1 decimal place
  return Math.round((totalScore / totalCoefficient) * 10) / 10;
}
