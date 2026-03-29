"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"

export async function startOrResumeAttempt(assignmentId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  const studentId = session.user.id

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId }
  })
  if (!assignment) throw new Error("Not found")

  const activeSubmission = await prisma.submission.findFirst({
    where: { assignmentId, studentId, submittedAt: null }
  })

  if (activeSubmission) {
    redirect(`/student/assignments/${assignmentId}/run/quiz?submissionId=${activeSubmission.id}`)
  }

  const pastSubmissionsCount = await prisma.submission.count({
    where: { assignmentId, studentId, submittedAt: { not: null } }
  })

  if (pastSubmissionsCount >= assignment.maxAttempts) {
    throw new Error("No attempts remaining")
  }

  const newSubmission = await prisma.submission.create({
    data: {
      assignmentId,
      studentId,
      attemptNumber: pastSubmissionsCount + 1
    }
  })

  redirect(`/student/assignments/${assignmentId}/run/quiz?submissionId=${newSubmission.id}`)
}
