"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function startOrResumeAttempt(assignmentId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;

  // Find active submission
  const activeSubmission = await prisma.submission.findFirst({
    where: {
      assignmentId,
      studentId: userId,
      submittedAt: null
    }
  });

  const assignment = await prisma.assignment.findFirst({
    where: {
      OR: [{ id: assignmentId }, { slug: assignmentId }]
    },
    select: { id: true, slug: true, maxAttempts: true }
  });

  if (!assignment) throw new Error("Assignment not found.");

  const identifier = assignment.slug || assignment.id;

  if (activeSubmission) {
    redirect(`/student/assignments/${identifier}/run/quiz?submissionId=${activeSubmission.id}`);
  }

  // Create new submission
  const completedCount = await prisma.submission.count({
    where: {
      assignmentId,
      studentId: userId,
      submittedAt: { not: null }
    }
  });

  if (completedCount >= assignment.maxAttempts) {
    throw new Error("Maximum attempts reached.");
  }

  const newSubmission = await prisma.submission.create({
    data: {
      assignmentId,
      studentId: userId,
      attemptNumber: completedCount + 1
    }
  });

  redirect(`/student/assignments/${identifier}/run/quiz?submissionId=${newSubmission.id}`);
}
