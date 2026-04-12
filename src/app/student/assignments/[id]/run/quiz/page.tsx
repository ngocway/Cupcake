import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import QuizClientRunner from "./QuizClientRunner";

export default async function StudentQuizPage({
  searchParams,
  params
}: {
  searchParams: Promise<{ submissionId: string }>;
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { submissionId } = await searchParams;
  const { id } = await params;

  if (!submissionId) {
    redirect(`/student/assignments/${id}/run`);
  }

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      assignment: {
        include: {
          questions: {
            orderBy: { orderIndex: 'asc' }
          }
        }
      }
    }
  });

  if (!submission || submission.studentId !== session.user.id) {
    notFound();
  }

  if (submission.submittedAt) {
    redirect(`/student/assignments/${id}/run`);
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
       <QuizClientRunner 
          assignment={submission.assignment}
          submissionId={submissionId}
          questions={submission.assignment.questions}
          initialAnswers={submission.answersDraft ? JSON.parse(submission.answersDraft) : {}}
       />
    </div>
  );
}
