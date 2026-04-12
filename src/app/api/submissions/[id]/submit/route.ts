import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    // Read answers, forceSubmitted block, and focus_lost_count mapped from the client.
    const { answers, forceSubmitted = false, focus_lost_count = 0, cheatCount = 0 } = body

    const finalCheatCount = focus_lost_count || cheatCount

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        assignment: {
          include: {
            questions: true
          }
        }
      }
    })

    if (!submission) return new NextResponse("Not found", { status: 404 })
    if (submission.studentId !== session.user.id) return new NextResponse("Forbidden", { status: 403 })
    if (submission.submittedAt) return new NextResponse("Already submitted", { status: 400 })

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
              const correctOptionIds = content.options.filter((o: any) => o.isCorrect).map((o: any) => o.id)
              if (Array.isArray(studentAns)) {
                // For multiple answers logic
                isCorrect = studentAns.length === correctOptionIds.length && studentAns.every(aid => correctOptionIds.includes(aid))
              } else {
                isCorrect = correctOptionIds.includes(studentAns)
              }
              break;
            }

            case "TRUE_FALSE": {
              stringifiedAns = String(studentAns)
              isCorrect = studentAns === content.isTrue
              break;
            }

            case "CLOZE_TEST": {
              stringifiedAns = JSON.stringify(studentAns)
              const textWithBlanks = content.textWithBlanks || ""
              const matches = [...textWithBlanks.matchAll(/\{\{(.*?)\}\}/g)]
              
              if (Array.isArray(studentAns)) {
                let correctCount = 0
                studentAns.forEach((ans, idx) => {
                  if (ans && matches[idx]) {
                    const studentCleaned = String(ans).trim().toLowerCase()
                    // Allow splitting multiple correct variants using pipe "|"
                    const validOptions = String(matches[idx][1]).split('|').map(v => v.trim().toLowerCase())
                    
                    if (validOptions.includes(studentCleaned)) {
                      correctCount++
                    }
                  }
                })
                // ALL OR NOTHING PER QUESTION (can be customized later to partial points)
                isCorrect = correctCount === matches.length && matches.length > 0
              }
              break;
            }

            case "REORDER": {
              stringifiedAns = JSON.stringify(studentAns)
              // Strict JSON comparison for Reorder exactly as the user specified.
              if (content.items && Array.isArray(studentAns)) {
                const correctArr = content.items.map((i: any) => i.id)
                isCorrect = JSON.stringify(studentAns) === JSON.stringify(correctArr)
              }
              break;
            }

            case "MATCHING": {
              stringifiedAns = JSON.stringify(studentAns)
              // Basic placeholder logic for matching if needed.
              // Assuming studentAns is object like { [leftId]: rightId/rightText }
              isCorrect = false // specific matching logic requires Exact structure comparison.
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
          console.error("Parse Error for question", question.id, e)
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

    // Final Score Calculation (Scale of 10)
    let final_score = 0
    if (total_max_points > 0) {
      final_score = (total_achieved_points / total_max_points) * 10
    }

    // Transaction to update submission and audit trails
    const updated = await prisma.$transaction(async (tx) => {
      const sub = await tx.submission.update({
        where: { id },
        data: {
          submittedAt: new Date(),
          forceSubmitted,
          cheatCount: finalCheatCount,
          score: final_score,
          answersDraft: null,
          answers: {
            create: studentAnswersToCreate
          }
        },
        include: {
          assignment: true
        }
      })

      // Send completion notification
      const { createNotification } = await import('@/actions/notification-actions');
      await createNotification(
        session.user.id,
        'GRADING_UPDATE',
        'Bài tập đã hoàn thành',
        `Bạn đã hoàn thành bài tập "${sub.assignment.title}" với điểm số ${final_score.toFixed(2)}/10.0`,
        `/student/assignments/${sub.assignmentId}/run`
      );

      return sub
    })

    return NextResponse.json({
      status: 200,
      message: "Nộp bài thành công!",
      final_score: final_score, // Stored exact Float, Frontend will use toFixed(2)
      submission: updated
    })

  } catch (error) {
    console.error("[SUBMISSION_SUBMIT_POST]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
