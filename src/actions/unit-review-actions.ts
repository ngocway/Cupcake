"use server";

import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import { LibrarySetItem } from "@/actions/teacher-library-actions";
import { generateUnitReviewQuestions, ReviewQuestion } from "@/lib/unit-review-generator";

export interface UnitReviewDataResponse {
  success: boolean;
  grade: number;
  unitNumber: number;
  unitHeader: string;
  questions: ReviewQuestion[];
  error?: string;
}

const ALL_LIBRARY_GAME_MODES = [
  "library-image-text",
  "library-text-text",
  "library-quiz",
];

async function _fetchFullGlobalSuccessSetsByGrade(grade: number): Promise<LibrarySetItem[]> {
  const slugPrefix = `shared-lib-g${grade}-`;

  const rawTopics = await prisma.matchWordTopic.findMany({
    where: {
      OR: [
        { slug: { startsWith: slugPrefix } },
        {
          teacherId: null,
          gameMode: { in: ALL_LIBRARY_GAME_MODES },
          name: { contains: `Grade ${grade} `, mode: "insensitive" },
        },
      ],
    },
    select: {
      id: true,
      name: true,
      slug: true,
      gameMode: true,
      audioMode: true,
      ageGroup: true,
      createdAt: true,
      updatedAt: true,
      items: {
        orderBy: [{ roundIndex: "asc" }, { createdAt: "asc" }, { id: "asc" }],
        select: {
          id: true,
          roundIndex: true,
          word: true,
          imageUrl: true,
          audioUrl: true,
          imageBUrl: true,
          labelB: true,
          audioBUrl: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const sets: LibrarySetItem[] = [];
  for (const t of rawTopics) {
    if (t.gameMode === "library-hidden" || !t.items || t.items.length === 0) continue;

    const gradeMatch = t.name.match(/Grade\s+(\d+)/i);
    const topicGrade = gradeMatch ? parseInt(gradeMatch[1], 10) : 3;
    if (topicGrade !== grade) continue;

    const subType =
      t.gameMode === "library-quiz"
        ? "quiz"
        : t.gameMode === "library-text-text"
        ? "text-text"
        : "image-text";

    sets.push({
      id: t.id,
      name: t.name,
      slug: t.slug,
      category: subType === "quiz" ? "quiz" : "match",
      subType,
      gameMode: t.gameMode || "match",
      audioMode: t.audioMode || "AUTO_TTS",
      gradeLevel: t.ageGroup || "primary-1-5",
      totalItems: t.items.length,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      isLibraryRecord: true,
      items: t.items.map((item: any) => ({
        id: item.id,
        roundIndex: item.roundIndex ?? 0,
        word: item.word,
        imageUrl: item.imageUrl,
        audioUrl: item.audioUrl,
        imageBUrl: item.imageBUrl,
        labelB: item.labelB,
        audioBUrl: item.audioBUrl,
      })),
    });
  }

  return sets;
}

function getCachedFullSetsByGrade(grade: number) {
  return unstable_cache(
    () => _fetchFullGlobalSuccessSetsByGrade(grade),
    [`unit-review-full-grade-v1-${grade}`],
    { revalidate: 3600, tags: [`global-success-grade-${grade}`, "global-success-all"] }
  )();
}

export async function getUnitReviewCountsByGradeAction(
  grade: number
): Promise<Record<number, number>> {
  try {
    if (!grade || grade < 1 || grade > 12) return {};
    const sets = await getCachedFullSetsByGrade(grade);
    const byUnit = new Map<number, LibrarySetItem[]>();

    for (const s of sets) {
      const match = s.name.match(/Unit\s+(\d+)/i);
      if (!match) continue;
      const uNum = parseInt(match[1], 10);
      const arr = byUnit.get(uNum) || [];
      arr.push(s);
      byUnit.set(uNum, arr);
    }

    const result: Record<number, number> = {};
    for (const [uNum, unitSets] of byUnit.entries()) {
      result[uNum] = generateUnitReviewQuestions(unitSets, grade).length;
    }
    return result;
  } catch {
    return {};
  }
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

    const allSets = await getCachedFullSetsByGrade(grade);
    if (!allSets || allSets.length === 0) {
      return {
        success: false,
        grade,
        unitNumber,
        unitHeader: `Unit ${unitNumber}`,
        questions: [],
        error: "No sets found for this grade",
      };
    }

    // Filter sets matching this unitNumber
    // Name pattern: "Grade 3 - Unit 1: Hello (Vocabulary)"
    const unitSets = allSets.filter((setItem) => {
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

    const questions = generateUnitReviewQuestions(unitSets, grade);

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
      error: err.message || "Failed to load unit review",
    };
  }
}
