"use server";

import prisma from "@/lib/prisma";

/**
 * Fetch grammar lesson HTML instructions and translations from GrammarLesson table
 */
export async function getLessonGrammarContent(lessonId: string): Promise<{ instructions: string | null; instructionsTranslations: any } | null> {
  const lesson = await prisma.grammarLesson.findUnique({
    where: { id: lessonId },
    select: { instructions: true, instructionsTranslations: true },
  });
  return lesson ? {
    instructions: lesson.instructions,
    instructionsTranslations: lesson.instructionsTranslations
  } : null;
}

/**
 * Save/Upsert grammar lesson HTML instructions and translations to GrammarLesson table
 */
export async function saveLessonGrammarContent(
  lessonId: string, 
  instructions: string, 
  instructionsTranslations?: any
): Promise<boolean> {
  try {
    await prisma.grammarLesson.upsert({
      where: { id: lessonId },
      update: { 
        instructions,
        ...(instructionsTranslations !== undefined && { instructionsTranslations })
      },
      create: { 
        id: lessonId, 
        instructions,
        instructionsTranslations: instructionsTranslations || null
      },
    });
    return true;
  } catch (err) {
    console.error("Failed to save grammar lesson content:", err);
    return false;
  }
}

export interface GrammarExerciseItem {
  id: string;
  slug?: string | null;
  title: string;
  materialType: string;
  gameType: string | null;
  status: string;
  createdAt: Date;
  instructions: string | null;
  questions: any;
  teacherName?: string | null;
  questionCount?: number;
}

/**
 * Fetch linked assignments/exercises for a specific grammar lesson
 */
export async function getLessonExercises(
  levelId: string,
  topicId: string,
  lessonId: string
): Promise<GrammarExerciseItem[]> {
  try {
    const assignments = await prisma.assignment.findMany({
      where: {
        grammarTopic: topicId,
        grammarLesson: lessonId,
        deletedAt: null,
      },
      select: {
        id: true,
        slug: true,
        title: true,
        materialType: true,
        status: true,
        createdAt: true,
        instructions: true,
        questions: true,
        teacher: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    return assignments.map(a => {
      let qCount = 0;
      if (Array.isArray(a.questions)) {
        qCount = a.questions.length;
      } else if (a.questions && typeof a.questions === 'object') {
        if (Array.isArray((a.questions as any).items)) qCount = (a.questions as any).items.length;
        else if (Array.isArray((a.questions as any).questions)) qCount = (a.questions as any).questions.length;
      }

      return {
        id: a.id,
        slug: a.slug,
        title: a.title,
        materialType: a.materialType,
        gameType: null,
        status: a.status,
        createdAt: a.createdAt,
        instructions: a.instructions,
        questions: a.questions,
        teacherName: a.teacher?.name ?? null,
        questionCount: qCount,
      };
    });
  } catch (err) {
    console.error("Failed to fetch lesson exercises:", err);
    return [];
  }
}
