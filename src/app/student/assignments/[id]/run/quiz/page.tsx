import React from 'react'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import QuizClientRunner from './QuizClientRunner'

export default async function QuizRunnerPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string }>, 
  searchParams: Promise<{ submissionId?: string }> 
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { submissionId } = await searchParams
  if (!submissionId) redirect(`/student/assignments/${(await params).id}/run`)

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      assignment: {
        include: { questions: { orderBy: { orderIndex: 'asc' } } }
      }
    }
  })

  if (!submission) redirect('/student/dashboard')
  if (submission.studentId !== session.user.id) redirect('/student/dashboard')
  if (submission.submittedAt) redirect(`/student/assignments/${submission.assignmentId}/run`)

  let initialAnswers = {}
  if (submission.answersDraft) {
    try {
      initialAnswers = JSON.parse(submission.answersDraft)
    } catch(e) {}
  }

  return (
    <QuizClientRunner 
      submission={submission} 
      assignment={submission.assignment} 
      questions={submission.assignment.questions}
      initialAnswers={initialAnswers}
    />
  )
}
