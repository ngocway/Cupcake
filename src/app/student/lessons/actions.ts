"use server";

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function toggleLessonBookmark(lessonId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;

  if (!(prisma as any).favoriteLesson) {
     throw new Error("Tính năng này đang được bảo trì (Cần cập nhật Database Client). Vui lòng thử lại sau.");
  }

  const existing = await (prisma as any).favoriteLesson.findUnique({
    where: {
      studentId_lessonId: {
        studentId: userId,
        lessonId
      }
    }
  });

  if (existing) {
    await prisma.favoriteLesson.delete({
      where: {
        studentId_lessonId: {
          studentId: userId,
          lessonId
        }
      }
    });
    return { bookmarked: false };
  } else {
    await prisma.favoriteLesson.create({
      data: {
        studentId: userId,
        lessonId
      }
    });
    return { bookmarked: true };
  }
}

export async function incrementLessonViews(lessonId: string) {
  try {
    await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        viewsCount: { increment: 1 }
      }
    });
    revalidatePath("/student/lessons");
  } catch (error) {
    console.error("Failed to increment views:", error);
  }
}
