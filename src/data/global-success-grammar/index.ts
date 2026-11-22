import type { UnitGrammarLesson } from "./types";

export type {
  GrammarExample,
  GrammarPoint,
  GrammarPracticeQuestion,
  UnitGrammarLesson,
} from "./types";

/**
 * Lightweight unit count registry per grade (avoids bundling all 12 grades statically).
 */
export const AVAILABLE_UNITS_BY_GRADE: Record<number, number> = {
  1: 16,
  2: 16,
  3: 20,
  4: 20,
  5: 20,
  6: 12,
  7: 12,
  8: 12,
  9: 12,
  10: 10,
  11: 10,
  12: 10,
};

const GRAMMAR_AUDIO_BASE =
  (process.env.NEXT_PUBLIC_R2_URL || "https://media.dolcake.com").replace(/\/+$/, "") +
  "/global-success/grammar-audio";

export function getGrammarExampleAudioUrl(
  grade: number,
  unit: number,
  pointIdx: number,
  exIdx: number
): string {
  return `${GRAMMAR_AUDIO_BASE}/g${grade}/u${unit}/ex-${pointIdx}-${exIdx}.mp3`;
}

export function getGrammarQuestionAudioUrl(
  grade: number,
  unit: number,
  questionId: string
): string {
  return `${GRAMMAR_AUDIO_BASE}/g${grade}/u${unit}/${questionId}.mp3`;
}

/**
 * Primary grades (1–5) have Deepgram MP3 audio for both summary examples and practice questions.
 * Secondary & High School (6–12) have Deepgram MP3 audio for summary examples only.
 */
export function hasGrammarQuestionAudio(grade: number): boolean {
  return grade >= 1 && grade <= 5;
}

export function hasUnitGrammarLesson(grade: number, unit: number): boolean {
  const maxUnit = AVAILABLE_UNITS_BY_GRADE[grade];
  return typeof maxUnit === "number" && unit >= 1 && unit <= maxUnit;
}

const gradeCache = new Map<number, Record<number, UnitGrammarLesson>>();

export async function loadGradeGrammarLessons(
  grade: number
): Promise<Record<number, UnitGrammarLesson> | null> {
  if (gradeCache.has(grade)) {
    return gradeCache.get(grade)!;
  }

  let data: Record<number, UnitGrammarLesson> | null = null;
  switch (grade) {
    case 1:
      data = (await import("./grade1")).GRADE_1_GRAMMAR;
      break;
    case 2:
      data = (await import("./grade2")).GRADE_2_GRAMMAR;
      break;
    case 3:
      data = (await import("./grade3")).GRADE_3_GRAMMAR;
      break;
    case 4:
      data = (await import("./grade4")).GRADE_4_GRAMMAR;
      break;
    case 5:
      data = (await import("./grade5")).GRADE_5_GRAMMAR;
      break;
    case 6:
      data = (await import("./grade6")).GRADE_6_GRAMMAR;
      break;
    case 7:
      data = (await import("./grade7")).GRADE_7_GRAMMAR;
      break;
    case 8:
      data = (await import("./grade8")).GRADE_8_GRAMMAR;
      break;
    case 9:
      data = (await import("./grade9")).GRADE_9_GRAMMAR;
      break;
    case 10:
      data = (await import("./grade10")).GRADE_10_GRAMMAR;
      break;
    case 11:
      data = (await import("./grade11")).GRADE_11_GRAMMAR;
      break;
    case 12:
      data = (await import("./grade12")).GRADE_12_GRAMMAR;
      break;
    default:
      return null;
  }

  if (data) {
    gradeCache.set(grade, data);
  }
  return data;
}

export async function loadUnitGrammarLesson(
  grade: number,
  unit: number
): Promise<UnitGrammarLesson | null> {
  const gradeData = await loadGradeGrammarLessons(grade);
  return gradeData?.[unit] ?? null;
}
