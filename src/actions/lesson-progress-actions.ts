"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function startLessonProgress(lessonId: string, studentId: string) {
  try {
    // Check if there is an existing in-progress attempt
    const existing = await prisma.lessonProgress.findFirst({
      where: { lessonId, studentId, completedAt: null },
      orderBy: { attemptNumber: 'desc' }
    });

    if (existing) {
      return { success: true, progressId: existing.id };
    }

    // Get the latest attempt number to increment
    const latest = await prisma.lessonProgress.findFirst({
      where: { lessonId, studentId },
      orderBy: { attemptNumber: 'desc' }
    });

    const attemptNumber = latest ? latest.attemptNumber + 1 : 1;

    const progress = await prisma.lessonProgress.create({
      data: {
        lessonId,
        studentId,
        attemptNumber,
        startedAt: new Date()
      }
    });

    revalidatePath(`/student/lessons`);
    return { success: true, progressId: progress.id };
  } catch (error) {
    console.error("[START_LESSON_PROGRESS]", error);
    return { success: false };
  }
}

export async function completeLessonProgress(lessonId: string, studentId: string) {
  try {
    const existing = await prisma.lessonProgress.findFirst({
      where: { 
        lessonId, 
        studentId,
        completedAt: null
      },
      orderBy: { attemptNumber: 'desc' }
    });

    if (!existing) {
      // Check if already completed in any attempt
      const completed = await prisma.lessonProgress.findFirst({
        where: { lessonId, studentId, NOT: { completedAt: null } }
      });
      if (completed) return { success: true, alreadyCompleted: true };
      
      // If none exists, create a completed one (should not happen normally)
      await prisma.lessonProgress.create({
        data: {
          lessonId,
          studentId,
          completedAt: new Date(),
          attemptNumber: 1
        }
      });
    } else {
      await prisma.lessonProgress.update({
        where: { id: existing.id },
        data: { completedAt: new Date() }
      });
    }

    revalidatePath(`/student/lessons`);
    return { success: true };
  } catch (error) {
    console.error("[COMPLETE_LESSON_PROGRESS]", error);
    return { success: false };
  }
}
