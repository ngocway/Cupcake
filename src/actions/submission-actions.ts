"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function completeSubmission(submissionId: string, answers: any) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" }
    }

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          include: {
            questions: true,
            lesson: { select: { id: true } }
          }
        }
      }
    })

    if (!submission) return { success: false, message: "Submission not found" }
    if (submission.studentId !== session.user.id) return { success: false, message: "Forbidden" }
    if (submission.submittedAt) return { success: true, message: "Already submitted" }

    const studentAnswersToCreate: any[] = []
    let total_achieved_points = 0
    let total_max_points = 0

    for (const question of submission.assignment.questions) {
      total_max_points += question.points

      const studentAns = answers[question.id]
      let isCorrect = false
      let pointsAwarded = 0
      let stringifiedAns = ""

      if (studentAns !== undefined && studentAns !== null) {
        try {
          const content = JSON.parse(question.content)
          
          switch (question.type) {
            case "MULTIPLE_CHOICE": {
              stringifiedAns = JSON.stringify(studentAns)
              const options = content.options || []
              const correctIndices = options
                .map((opt: any, i: number) => opt.isCorrect ? i : -1)
                .filter((i: number) => i !== -1);
              
              isCorrect = correctIndices.includes(studentAns);
              break;
            }

            case "TRUE_FALSE": {
              stringifiedAns = String(studentAns)
              isCorrect = studentAns === content.isTrue
              break;
            }

            case "MATCHING": {
              stringifiedAns = JSON.stringify(studentAns)
              if (content.pairs && typeof studentAns === 'object' && studentAns !== null) {
                let correctCount = 0
                content.pairs.forEach((pair: any) => {
                  if (studentAns[pair.id] === pair.rightText) {
                    correctCount++
                  }
                })
                isCorrect = correctCount === content.pairs.length && content.pairs.length > 0
              }
              break;
            }

            default:
              stringifiedAns = JSON.stringify(studentAns)
              break;
          }

          if (isCorrect) {
            pointsAwarded = question.points
          }
        } catch(e) {
          stringifiedAns = JSON.stringify(studentAns)
        }
      }

      total_achieved_points += pointsAwarded
      studentAnswersToCreate.push({
        questionId: question.id,
        studentAnswer: stringifiedAns,
        isCorrect,
        pointsAwarded
      })
    }

    let final_score = 0
    if (total_max_points > 0) {
      final_score = (total_achieved_points / total_max_points) * 10
    }

    await prisma.$transaction(async (tx) => {
      await tx.submission.update({
        where: { id: submissionId },
        data: {
          submittedAt: new Date(),
          score: final_score,
          answersDraft: null,
          answers: {
            create: studentAnswersToCreate
          }
        }
      })

      // Send notification
      const { createNotification } = await import('@/actions/notification-actions');
      await createNotification(
        session.user.id,
        'GRADING_UPDATE',
        'Bài tập đã hoàn thành',
        `Bạn đã hoàn thành bài tập "${submission.assignment.title}" với điểm số ${final_score.toFixed(2)}/10.0`,
        `/student/assignments/${submission.assignmentId}/run`
      );

      // 3. Complete lesson progress if linked
      if (submission.assignment.lesson) {
        const lessonId = submission.assignment.lesson.id;
        const studentId = submission.studentId;
        
        const existingProgress = await tx.lessonProgress.findFirst({
          where: { lessonId, studentId, completedAt: null },
          orderBy: { attemptNumber: 'desc' }
        });
        
        if (existingProgress) {
          await tx.lessonProgress.update({
            where: { id: existingProgress.id },
            data: { completedAt: new Date() }
          });
        } else {
          const alreadyCompleted = await tx.lessonProgress.findFirst({
            where: { lessonId, studentId, NOT: { completedAt: null } }
          });
          if (!alreadyCompleted) {
            await tx.lessonProgress.create({
              data: {
                lessonId,
                studentId,
                completedAt: new Date(),
                attemptNumber: 1
              }
            });
          }
        }
      }
    })

    revalidatePath(`/student/my-learning/assignments`)
    return { success: true, score: final_score }

  } catch (error) {
    console.error("[COMPLETE_SUBMISSION]", error)
    return { success: false, message: "Internal Server Error" }
  }
}
