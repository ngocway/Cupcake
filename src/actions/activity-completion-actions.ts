"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { invalidateStudentClassDetailCache } from "@/lib/cached-queries";

interface CompleteActivityParams {
  assignmentId: string;
  score?: number | null;
  classId?: string;
  groupId?: string;
}

/**
 * Ghi nhận hoàn thành bài học cho các hoạt động lớp (Lý thuyết, Flashcard, Sách, Game...)
 * Với các bài không tính điểm, score mặc định là null.
 */
export async function completeClassActivityAction({
  assignmentId,
  score = null,
  classId,
  groupId,
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
        classId: classId || undefined,
        groupId: groupId || undefined,
        submittedAt: { not: null },
      },
    });

    if (!existing) {
      // Tìm số lần làm trước đó nếu có
      const previousCount = await prisma.submission.count({
        where: { 
          assignmentId, 
          studentId,
          classId: classId || undefined 
        },
      });

      await prisma.submission.create({
        data: {
          assignmentId,
          studentId,
          classId: classId || null,
          groupId: groupId || null,
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
          ...(classId && !existing.classId ? { classId } : {}),
          ...(groupId && !existing.groupId ? { groupId } : {}),
        },
      });
    }

    if (classId) {
      await invalidateStudentClassDetailCache(classId, studentId);
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
