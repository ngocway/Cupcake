"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function startOrResumeAttempt(assignmentId: string, classId?: string, groupId?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;

  const assignment = await prisma.assignment.findFirst({
    where: {
      OR: [{ id: assignmentId }, { slug: assignmentId }]
    },
    select: { id: true, slug: true, maxAttempts: true }
  });

  if (!assignment) throw new Error("Assignment not found.");

  const identifier = assignment.slug || assignment.id;

  // Find active submission scoped to class/group if provided
  const activeSubmission = await prisma.submission.findFirst({
    where: {
      assignmentId: assignment.id,
      studentId: userId,
      classId: classId || undefined,
      groupId: groupId || undefined,
      submittedAt: null
    }
  });

  const queryParams = new URLSearchParams();
  if (classId) queryParams.set('classId', classId);
  if (groupId) queryParams.set('groupId', groupId);
  const qStr = queryParams.toString() ? `&${queryParams.toString()}` : '';

  if (activeSubmission) {
    redirect(`/student/assignments/${identifier}/run/quiz?submissionId=${activeSubmission.id}${qStr}`);
  }

  // Create new submission (allow unlimited retry without max attempts limit)
  const completedCount = await prisma.submission.count({
    where: {
      assignmentId: assignment.id,
      studentId: userId,
      classId: classId || undefined,
      submittedAt: { not: null }
    }
  });

  const newSubmission = await prisma.submission.create({
    data: {
      assignmentId: assignment.id,
      studentId: userId,
      classId: classId || null,
      groupId: groupId || null,
      attemptNumber: completedCount + 1
    }
  });

  redirect(`/student/assignments/${identifier}/run/quiz?submissionId=${newSubmission.id}${qStr}`);
}

export async function prewarmQuestionsAction(assignmentId: string) {
  const { prewarmAssignmentQuestions } = await import("./data");
  return prewarmAssignmentQuestions(assignmentId);
}

/** Fetch full questions for lobby prefetch — returns cached data from Redis (TTL 1h).
 *  Called by QuizPrefetcher client component to seed Zustand store immediately.
 *  No auth needed since questions are already assigned/visible to the student.
 */
export async function fetchQuestionsForLobby(assignmentId: string) {
  const { getCachedAssignmentQuestions } = await import("./data");
  return getCachedAssignmentQuestions(assignmentId);
}

export async function getStudentQuizRunnerData(
  assignmentId: string, 
  forceNewAttempt = false,
  forPreload = false,
  classId?: string,
  groupId?: string
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id;

  const { getCachedQuizRunnerTemplate } = await import("./data");

  const isCuid = assignmentId.startsWith('cm') || assignmentId.length >= 24;
  const targetClassId = classId ? classId : null;
  const targetGroupId = classId && groupId ? groupId : (classId ? undefined : null);

  const hasSubstantiveAnswers = (sub: any) => {
    if (!sub) return false;
    if (sub.answers && sub.answers.length > 0) return true;
    if (sub.answersDraft) {
      try {
        const parsed = typeof sub.answersDraft === 'string' ? JSON.parse(sub.answersDraft) : sub.answersDraft;
        return parsed && Object.keys(parsed).length > 0;
      } catch {
        return false;
      }
    }
    return false;
  };

  // Run template resolution and submission lookup concurrently to eliminate sequential roundtrips
  const templatePromise = getCachedQuizRunnerTemplate(assignmentId);
  const preliminarySubmissionPromise = (!forceNewAttempt && isCuid)
    ? prisma.submission.findFirst({
        where: { 
          assignmentId, 
          studentId: userId, 
          classId: targetClassId,
          groupId: targetGroupId,
          submittedAt: null 
        },
        orderBy: { startedAt: "desc" },
        include: { answers: true }
      })
    : Promise.resolve(null);

  const [template, preliminarySubmission] = await Promise.all([
    templatePromise,
    preliminarySubmissionPromise
  ]);

  if (!template) throw new Error("Assignment not found");
  const actualAssignmentId = template.actualAssignmentId || template.assignment.id;

  // 2. Resolve or create submission
  let submission: any = preliminarySubmission;

  // If in-progress submission exists but has NO substantive answers, check if there's a completed submission
  if (!forceNewAttempt && submission && !hasSubstantiveAnswers(submission)) {
    const latestCompleted = await prisma.submission.findFirst({
      where: { 
        assignmentId: actualAssignmentId, 
        studentId: userId, 
        classId: targetClassId,
        groupId: targetGroupId,
        submittedAt: { not: null } 
      },
      orderBy: { submittedAt: "desc" },
      include: { answers: true }
    });

    if (latestCompleted) {
      // Clean up orphaned empty draft so it does not leave clutter in DB
      if (submission.id) {
        try {
          await prisma.submission.delete({ where: { id: submission.id } });
        } catch {}
      }
      submission = latestCompleted;
    }
  }

  if (!submission && forceNewAttempt) {
    const completedCount = await prisma.submission.count({
      where: { 
        assignmentId: actualAssignmentId, 
        studentId: userId, 
        classId: targetClassId,
        groupId: targetGroupId,
        submittedAt: { not: null } 
      }
    });

    // Delete any prior empty drafts for this user & assignment
    try {
      await prisma.submission.deleteMany({
        where: {
          assignmentId: actualAssignmentId,
          studentId: userId,
          classId: targetClassId,
          groupId: targetGroupId,
          submittedAt: null,
          answers: { none: {} }
        }
      });
    } catch {}

    submission = await prisma.submission.create({
      data: {
        assignmentId: actualAssignmentId,
        studentId: userId,
        classId: classId || null,
        groupId: classId ? (groupId || null) : null,
        attemptNumber: completedCount + 1
      },
      include: { answers: true }
    });
  } else if (!submission) {
    // If not found in-progress during preliminary check (e.g. non-cuid or none in progress), check in-progress if needed
    if (!isCuid) {
      submission = await prisma.submission.findFirst({
        where: { 
          assignmentId: actualAssignmentId, 
          studentId: userId, 
          classId: targetClassId,
          groupId: targetGroupId,
          submittedAt: null 
        },
        orderBy: { startedAt: "desc" },
        include: { answers: true }
      });

      if (submission && !hasSubstantiveAnswers(submission)) {
        const latestCompleted = await prisma.submission.findFirst({
          where: { 
            assignmentId: actualAssignmentId, 
            studentId: userId, 
            classId: targetClassId,
            groupId: targetGroupId,
            submittedAt: { not: null } 
          },
          orderBy: { submittedAt: "desc" },
          include: { answers: true }
        });
        if (latestCompleted) {
          try {
            await prisma.submission.delete({ where: { id: submission.id } });
          } catch {}
          submission = latestCompleted;
        }
      }
    }

    if (!submission) {
      // Check for latest completed submission (Review mode)
      submission = await prisma.submission.findFirst({
        where: { 
          assignmentId: actualAssignmentId, 
          studentId: userId,
          classId: targetClassId,
          groupId: targetGroupId,
          submittedAt: { not: null }
        },
        orderBy: { submittedAt: "desc" },
        include: { answers: true }
      });
    }

    if (!submission) {
      if (forPreload) {
        // Fast path for preload: do NOT write to database
        submission = null;
      } else {
        submission = await prisma.submission.create({
          data: {
            assignmentId: actualAssignmentId,
            studentId: userId,
            classId: classId || null,
            groupId: classId ? (groupId || null) : null,
            attemptNumber: 1
          },
          include: { answers: true }
        });
      }
    }
  }

  // 3. Parse initial answers
  const initialAnswers: Record<string, any> = {};
  if (submission?.answers && submission.answers.length > 0) {
    submission.answers.forEach((ans: any) => {
      try {
        initialAnswers[ans.questionId] = JSON.parse(ans.studentAnswer);
      } catch {
        initialAnswers[ans.questionId] = ans.studentAnswer;
      }
    });
  } else if (submission?.answersDraft) {
    try {
      const parsedDraft = JSON.parse(submission.answersDraft as string);
      Object.assign(initialAnswers, parsedDraft);
    } catch {}
  }

  const isReviewMode = Boolean(submission?.submittedAt);

  return {
    assignment: template.assignment,
    submissionId: submission?.id ?? null,
    submissionScore: submission?.score ?? null,
    isReviewMode,
    initialAnswers,
    questions: template.questions,
    questionTranslations: template.questionTranslations,
    assignmentTranslations: template.assignmentTranslations,
    extraData: template.extraData
  };
}

/**
 * Ensures an active submission exists when a student starts answering questions
 * (called just-in-time when opening a preloaded assignment).
 */
export async function ensureStudentSubmission(assignmentId: string, classId?: string, groupId?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id;

  const isId = assignmentId.startsWith('cm') || assignmentId.length >= 24;
  const assignmentRecord = isId
    ? await prisma.assignment.findUnique({
        where: { id: assignmentId },
        select: { id: true }
      })
    : await prisma.assignment.findFirst({
        where: { OR: [{ id: assignmentId }, { slug: assignmentId }] },
        select: { id: true }
      });
  if (!assignmentRecord) throw new Error("Assignment not found");
  const actualAssignmentId = assignmentRecord.id;

  // 1. Check if active submission already exists
  const targetClassId = classId ? classId : null;
  const targetGroupId = classId && groupId ? groupId : (classId ? undefined : null);

  const activeSubmission = await prisma.submission.findFirst({
    where: { 
      assignmentId: actualAssignmentId, 
      studentId: userId, 
      classId: targetClassId,
      groupId: targetGroupId,
      submittedAt: null 
    },
    select: { id: true, score: true }
  });
  if (activeSubmission) return activeSubmission;

  // 2. Check if completed submission exists
  const latestCompleted = await prisma.submission.findFirst({
    where: { 
      assignmentId: actualAssignmentId, 
      studentId: userId,
      classId: targetClassId,
      groupId: targetGroupId,
      submittedAt: { not: null }
    },
    orderBy: { submittedAt: "desc" },
    select: { id: true, score: true }
  });
  if (latestCompleted) return latestCompleted;

  // 3. Create attempt 1
  return prisma.submission.create({
    data: {
      assignmentId: actualAssignmentId,
      studentId: userId,
      classId: classId || null,
      groupId: classId ? (groupId || null) : null,
      attemptNumber: 1
    },
    select: { id: true, score: true }
  });
}

/**
 * High-speed batch preload for quiz runner data:
 * Resolves cached templates and submissions for multiple assignments in a single Server Action.
 */
export async function getBatchStudentQuizRunnerData(
  assignmentIds: string[],
  classId?: string,
  groupId?: string
): Promise<Record<string, any>> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id;

  if (!assignmentIds || assignmentIds.length === 0) return {};

  const { getCachedQuizRunnerTemplate } = await import("./data");

  // Parallel template resolution from Redis/DB
  const templates = await Promise.all(
    assignmentIds.map(id => getCachedQuizRunnerTemplate(id).catch(() => null))
  );

  const validTemplates = templates.filter(Boolean);
  const actualIds = validTemplates.map(t => t.actualAssignmentId || t.assignment.id);

  // Single batch query for student submissions
  const targetClassId = classId ? classId : null;
  const targetGroupId = classId && groupId ? groupId : (classId ? undefined : null);

  const submissions = actualIds.length > 0
    ? await prisma.submission.findMany({
        where: {
          assignmentId: { in: actualIds },
          studentId: userId,
          classId: targetClassId,
          groupId: targetGroupId,
        },
        orderBy: { startedAt: "desc" },
        include: { answers: true }
      })
    : [];

  const subMap = new Map<string, any>();
  const byAssignment = new Map<string, any[]>();
  submissions.forEach(s => {
    const list = byAssignment.get(s.assignmentId) || [];
    list.push(s);
    byAssignment.set(s.assignmentId, list);
  });

  const checkHasAnswers = (sub: any) => {
    if (!sub) return false;
    if (sub.answers && sub.answers.length > 0) return true;
    if (sub.answersDraft) {
      try {
        const parsed = typeof sub.answersDraft === 'string' ? JSON.parse(sub.answersDraft) : sub.answersDraft;
        return parsed && Object.keys(parsed).length > 0;
      } catch {
        return false;
      }
    }
    return false;
  };

  byAssignment.forEach((list, aid) => {
    // 1. Prioritize active submission with substantive answers
    const activeWithAnswers = list.find(s => s.submittedAt === null && checkHasAnswers(s));
    if (activeWithAnswers) {
      subMap.set(aid, activeWithAnswers);
      return;
    }
    // 2. Find latest completed submission
    const latestCompleted = list
      .filter(s => s.submittedAt !== null)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0];
    if (latestCompleted) {
      subMap.set(aid, latestCompleted);
      return;
    }
    // 3. Fallback to any active draft
    const anyActive = list.find(s => s.submittedAt === null);
    if (anyActive) {
      subMap.set(aid, anyActive);
    }
  });

  const resultMap: Record<string, any> = {};

  validTemplates.forEach(template => {
    const aid = template.actualAssignmentId || template.assignment.id;
    const submission = subMap.get(aid) || null;

    const initialAnswers: Record<string, any> = {};
    if (submission?.answers && submission.answers.length > 0) {
      submission.answers.forEach((ans: any) => {
        try {
          initialAnswers[ans.questionId] = JSON.parse(ans.studentAnswer);
        } catch {
          initialAnswers[ans.questionId] = ans.studentAnswer;
        }
      });
    } else if (submission?.answersDraft) {
      try {
        const parsedDraft = JSON.parse(submission.answersDraft as string);
        Object.assign(initialAnswers, parsedDraft);
      } catch {}
    }

    const isReviewMode = Boolean(submission?.submittedAt);

    resultMap[aid] = {
      assignment: template.assignment,
      submissionId: submission?.id ?? null,
      submissionScore: submission?.score ?? null,
      isReviewMode,
      initialAnswers,
      questions: template.questions,
      questionTranslations: template.questionTranslations,
      assignmentTranslations: template.assignmentTranslations,
      extraData: template.extraData
    };
  });

  return resultMap;
}


