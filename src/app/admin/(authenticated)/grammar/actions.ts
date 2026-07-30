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
