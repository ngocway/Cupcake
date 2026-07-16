import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import QuizClientRunner from "./QuizClientRunner";
import { getCachedAssignmentQuestions, getQuestionTranslationMap, getAssignmentTranslations, getRelatedAssignmentsCached } from "../data";



export default async function StudentQuizPage({
  searchParams,
  params
}: {
  searchParams: Promise<{ submissionId: string }>;
  params: Promise<{ id: string }>;
}) {
  const [session, { submissionId }, { id: paramsId }] = await Promise.all([
    auth(),
    searchParams,
    params
  ]);

  if (!session?.user?.id) redirect("/student/login");
  const userId = session.user.id;

  if (!submissionId) {
    redirect(`/student/assignments/${paramsId}/run`);
  }

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { 
      assignment: {
        select: {
          id: true,
          title: true,
          slug: true,
          tags: true,
          targetAudiences: true,
          lesson: { select: { id: true, targetAudiences: true } }
        }
      }
    }
  });

  if (!submission || submission.studentId !== userId || !submission.assignment) {
    notFound();
  }

  const assignmentCore = submission.assignment;

  if (submission.submittedAt) {
    const identifier = assignmentCore.slug || assignmentCore.id;
    redirect(`/student/assignments/${identifier}/run`);
  }

  // Luồng 2: Tải ngầm dữ liệu phụ (Teacher, Lesson, Nội dung đọc hiểu, Hướng dẫn...)
  const extraDataPromise = prisma.assignment.findUnique({
    where: { id: assignmentCore.id },
    select: {
      readingText: true,
      instructions: true,
      instructionsImageUrl: true,
      videoUrl: true,
      audioUrl: true,
      teacher: {
        select: {
          id: true,
          name: true,
          image: true,
          professionalTitle: true,
          bio: true,
          isPortfolioPublished: true,
          _count: { select: { lessons: true, assignments: true } }
        }
      },
      lesson: {
        select: {
          videoUrl: true,
          audioUrl: true
        }
      },
      favoriteAssignments: { where: { studentId: userId }, select: { studentId: true } }
    }
  });

  const relatedAssignmentsPromise = getRelatedAssignmentsCached(
    assignmentCore.id,
    assignmentCore.tags,
    assignmentCore.targetAudiences as string[]
  );
  const questions = await getCachedAssignmentQuestions(assignmentCore.id);
  const questionTranslationsPromise = getQuestionTranslationMap(assignmentCore.id);
  const assignmentTranslationsPromise = getAssignmentTranslations(assignmentCore.id);

  return (
    <div className="min-h-screen w-full max-w-none bg-slate-50 dark:bg-slate-950">
       <QuizClientRunner 
          assignment={assignmentCore as any}
          submissionId={submissionId}
          questions={questions}
          initialAnswers={submission.answersDraft ? JSON.parse(submission.answersDraft as string) : {}}
          extraDataPromise={extraDataPromise}
          relatedAssignmentsPromise={relatedAssignmentsPromise}
          questionTranslationsPromise={questionTranslationsPromise}
          assignmentTranslationsPromise={assignmentTranslationsPromise}
          isGuest={!userId}
       />
    </div>
  );
}
