"use server";

import { getGlobalSuccessSetsByGradeAction } from "@/actions/teacher-library-actions";
import { generateUnitReviewQuestions, ReviewQuestion } from "@/lib/unit-review-generator";

export interface UnitReviewDataResponse {
  success: boolean;
  grade: number;
  unitNumber: number;
  unitHeader: string;
  questions: ReviewQuestion[];
  error?: string;
}

export async function getUnitReviewDataAction(
  grade: number,
  unitNumber: number
): Promise<UnitReviewDataResponse> {
  try {
    if (!grade || grade < 1 || grade > 12) {
      return {
        success: false,
        grade,
        unitNumber,
        unitHeader: `Unit ${unitNumber}`,
        questions: [],
        error: "Invalid grade level",
      };
    }

    const res = await getGlobalSuccessSetsByGradeAction(grade);
    if (!res.success || !res.sets || res.sets.length === 0) {
      return {
        success: false,
        grade,
        unitNumber,
        unitHeader: `Unit ${unitNumber}`,
        questions: [],
        error: res.error || "No sets found for this grade",
      };
    }

    // Filter sets matching this unitNumber
    // Name pattern: "Grade 3 - Unit 1: Hello (Vocabulary)"
    const unitSets = res.sets.filter((setItem) => {
      const match = setItem.name.match(/Unit\s+(\d+)/i);
      if (!match) return false;
      return parseInt(match[1], 10) === unitNumber;
    });

    if (unitSets.length === 0) {
      return {
        success: false,
        grade,
        unitNumber,
        unitHeader: `Unit ${unitNumber}`,
        questions: [],
        error: `No question sets found for Grade ${grade} Unit ${unitNumber}`,
      };
    }

    // Extract Unit header name (e.g. "Unit 1: Hello")
    let unitHeader = `Unit ${unitNumber}`;
    const headerMatch = unitSets[0].name.match(/(Unit\s+\d+\s*:\s*[^(]+)/i);
    if (headerMatch) {
      unitHeader = headerMatch[1].trim();
    }

    const questions = generateUnitReviewQuestions(unitSets);

    return {
      success: true,
      grade,
      unitNumber,
      unitHeader,
      questions,
    };
  } catch (err: any) {
    console.error("Failed to generate unit review data:", err);
    return {
      success: false,
      grade,
      unitNumber,
      unitHeader: `Unit ${unitNumber}`,
      questions: [],
      error: err.message || "Failed to generate unit review questions",
    };
  }
}
