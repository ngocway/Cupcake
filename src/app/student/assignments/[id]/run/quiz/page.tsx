import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import KidTeenQuizRunner from "./KidTeenQuizRunner";
import { getCachedAssignmentQuestions, getQuestionTranslationMap, getAssignmentTranslations, getRelatedAssignmentsCached } from "../data";



export default async function StudentQuizPage({
  searchParams,
  params
}: {
  searchParams: Promise<{ submissionId: string; review?: string; fromClass?: string; classId?: string; autoStart?: string }>;
  params: Promise<{ id: string }>;
}) {
  const [session, { submissionId, review, fromClass, classId, autoStart }, { id: paramsId }] = await Promise.all([
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
          level: true,
          materialType: true,
          grammarLesson: true,
          targetAudiences: true,
          lesson: { select: { id: true, targetAudiences: true } }
        }
      },
      answers: true
    }
  });

  if (!submission || submission.studentId !== userId || !submission.assignment) {
    notFound();
  }

  const assignmentCore = submission.assignment;
  const isReviewMode = Boolean(submission.submittedAt || review === "true");

  let isFromClass = fromClass === "true" || !!classId;
  if (!isFromClass && userId) {
    const assignedClass = await prisma.assignmentClass.findFirst({
      where: {
        assignmentId: assignmentCore.id,
        class: {
          enrollments: {
            some: { studentId: userId, status: "ACTIVE" }
          }
        }
      },
      select: { classId: true }
    });
    if (assignedClass) {
      isFromClass = true;
    }
  }

  let initialAnswers: any = {};
  if (submission.answers && submission.answers.length > 0) {
    submission.answers.forEach((ans) => {
      try {
        initialAnswers[ans.questionId] = JSON.parse(ans.studentAnswer);
      } catch {
        initialAnswers[ans.questionId] = ans.studentAnswer;
      }
    });
  } else if (submission.answersDraft) {
    try {
      initialAnswers = JSON.parse(submission.answersDraft as string);
    } catch {}
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

  // Wrap to fetch grammar instructions dynamically if grammarLesson is present
  const getExtraDataWithGrammar = async () => {
    const extraData = await extraDataPromise;
    if (extraData && assignmentCore.grammarLesson) {
      const gLesson = await prisma.grammarLesson.findUnique({
        where: { id: assignmentCore.grammarLesson },
        select: { instructions: true }
      });
      if (gLesson?.instructions) {
        extraData.instructions = gLesson.instructions;
      }
    }
    return extraData;
  };
  const resolvedExtraDataPromise = getExtraDataWithGrammar();

  return (
    <div className="min-h-screen w-full max-w-none">
       <KidTeenQuizRunner 
          assignment={assignmentCore as any}
          submissionId={submissionId}
          questions={questions}
          cefrLevel={assignmentCore.level || "a1"}
          initialAnswers={initialAnswers}
          extraDataPromise={resolvedExtraDataPromise}
          relatedAssignmentsPromise={relatedAssignmentsPromise}
          questionTranslationsPromise={questionTranslationsPromise}
          assignmentTranslationsPromise={assignmentTranslationsPromise}
          isGuest={!userId}
          isReviewMode={isReviewMode}
          submissionScore={submission.score}
          isFromClass={isFromClass}
          autoStart={autoStart === "true"}
       />
    </div>
  );
}
