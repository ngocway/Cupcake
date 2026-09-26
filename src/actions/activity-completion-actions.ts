"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

interface CompleteActivityParams {
  assignmentId: string;
  score?: number | null;
  classId?: string;
}

/**
 * Ghi nhận hoàn thành bài học cho các hoạt động lớp (Lý thuyết, Flashcard, Sách, Game...)
 * Với các bài không tính điểm, score mặc định là null.
 */
export async function completeClassActivityAction({
  assignmentId,
  score = null,
  classId,
}: CompleteActivityParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }
    const studentId = session.user.id;

    if (!assignmentId) {
      return { success: false, message: "Missing assignmentId" };
    }

    const existing = await prisma.submission.findFirst({
      where: {
        assignmentId,
        studentId,
        submittedAt: { not: null },
      },
    });

    if (!existing) {
      // Tìm số lần làm trước đó nếu có
      const previousCount = await prisma.submission.count({
        where: { assignmentId, studentId },
      });

      await prisma.submission.create({
        data: {
          assignmentId,
          studentId,
          startedAt: new Date(),
          submittedAt: new Date(),
          score: score !== undefined ? score : null,
          attemptNumber: previousCount + 1,
        },
      });
    } else if (score !== null && score !== undefined && (existing.score === null || score > existing.score)) {
      // Cập nhật điểm cao hơn nếu có tính điểm
      await prisma.submission.update({
        where: { id: existing.id },
        data: {
          score,
          submittedAt: new Date(),
        },
      });
    }

    if (classId) {
      revalidatePath(`/student/classes/${classId}`);
      revalidatePath(`/teacher/classes/${classId}`);
    }
    revalidatePath(`/student/classes`);

    return { success: true };
  } catch (error: any) {
    console.error("[completeClassActivityAction] Error:", error);
    return { success: false, message: error?.message || "Failed to complete activity" };
  }
}
