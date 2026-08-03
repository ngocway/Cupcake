"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { completeSubmission } from "@/actions/submission-actions";

export async function submitLessonInlineQuizAction({
  assignmentId,
  answers
}: {
  assignmentId: string;
  answers: Record<string, any>;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }
    const userId = session.user.id;

    // Find active submission or create new one
    let submission = await prisma.submission.findFirst({
      where: {
        assignmentId,
        studentId: userId,
        submittedAt: null
      },
      orderBy: { startedAt: "desc" }
    });

    if (!submission) {
      const completedCount = await prisma.submission.count({
        where: {
          assignmentId,
          studentId: userId,
          submittedAt: { not: null }
        }
      });

      submission = await prisma.submission.create({
        data: {
          assignmentId,
          studentId: userId,
          attemptNumber: completedCount + 1
        }
      });
    }

    // Evaluate and grade submission
    const result = await completeSubmission(submission.id, answers);
    return result;
  } catch (error: any) {
    console.error("Failed to submit inline quiz:", error);
    return { success: false, message: error?.message || "Submission failed" };
  }
}
