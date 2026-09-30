import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import KidTeenQuizRunner from "./KidTeenQuizRunner";
import { getCachedAssignmentQuestions, getQuestionTranslationMap, getAssignmentTranslations, getRelatedAssignmentsCached } from "../data";



export default async function StudentQuizPage({
  searchParams,
  params
}: {
  searchParams: Promise<{ submissionId: string; review?: string; fromClass?: string; classId?: string; autoStart?: string; embedded?: string }>;
  params: Promise<{ id: string }>;
}) {
  const [session, { submissionId, review, fromClass, classId, autoStart, embedded }, { id: paramsId }] = await Promise.all([
    auth(),
    searchParams,
    params
  ]);

  if (!session?.user?.id) redirect("/student/login");
  const userId = session.user.id;

  const isClassMode = embedded === "true" || fromClass === "true" || !!classId;

  // 1. Kick off cached questions and translations immediately in parallel
  const questionsPromise = getCachedAssignmentQuestions(paramsId);
  const questionTranslationsPromise = getQuestionTranslationMap(paramsId);
  const assignmentTranslationsPromise = getAssignmentTranslations(paramsId);

  // In embedded classroom mode, students don't need external related recommendations
  const relatedAssignmentsPromise = isClassMode
    ? Promise.resolve([])
    : getRelatedAssignmentsCached(paramsId, null, []);

  // 2. Fetch or create submission with assignment in a fast path
  let targetSubmissionId = submissionId;
  let submission: any = null;

  if (targetSubmissionId) {
    submission = await prisma.submission.findUnique({
      where: { id: targetSubmissionId },
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
  } else {
    // Fast path: find existing submission directly with paramsId (matches ID or slug)
    const existing = await prisma.submission.findFirst({
      where: {
        studentId: userId,
        OR: [
          { assignmentId: paramsId },
          { assignment: { slug: paramsId } }
        ]
      },
      orderBy: { startedAt: "desc" },
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

    if (existing) {
      submission = existing;
    } else {
      // Create new submission: resolve assignment
      const assignmentRecord = await prisma.assignment.findFirst({
        where: { OR: [{ id: paramsId }, { slug: paramsId }] },
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
      });
      if (!assignmentRecord) notFound();

      const created = await prisma.submission.create({
        data: {
          assignmentId: assignmentRecord.id,
          studentId: userId,
          attemptNumber: 1
        },
        select: { id: true }
      });

      submission = {
        id: created.id,
        assignmentId: assignmentRecord.id,
        studentId: userId,
        assignment: assignmentRecord,
        answers: [],
        score: null,
        submittedAt: null
      };
    }
  }

  if (!submission || submission.studentId !== userId || !submission.assignment) {
    notFound();
  }

  const assignmentCore = submission.assignment;
  const isReviewMode = Boolean(submission.submittedAt || review === "true");
  const isFromClass = isClassMode;

  let initialAnswers: any = {};
  if (submission.answers && submission.answers.length > 0) {
    submission.answers.forEach((ans: any) => {
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

  const questions = await questionsPromise;

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
    <div className={`w-full max-w-none ${embedded === "true" ? "min-h-0 bg-transparent" : "min-h-screen"}`}>
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
