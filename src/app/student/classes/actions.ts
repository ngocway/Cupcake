'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { fetchWithRedis } from '@/lib/cached-queries';

export async function cancelJoinRequest(classId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  
  const studentId = session.user.id;

  // We only allow canceling if it's currently PENDING.
  const enrollment = await prisma.classEnrollment.findUnique({
    where: { studentId_classId: { studentId, classId } }
  });

  if (enrollment && enrollment.status === 'PENDING') {
    await prisma.classEnrollment.delete({
      where: { studentId_classId: { studentId, classId } }
    });
    
    // Invalidate caches
    revalidatePath('/student/classes');
    revalidatePath('/student/dashboard');
    return { success: true };
  }

  throw new Error("Không thể hủy yêu cầu này.");
}

export async function getStudentGrammarLessonData(assignmentId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id;

  // 1. Fetch cached static lesson template from Redis (1 hour TTL)
  const template = await fetchWithRedis(`grammar:lesson-template:v2:${assignmentId}`, 3600, async () => {
    const assignment = await prisma.assignment.findFirst({
      where: { OR: [{ id: assignmentId }, { slug: assignmentId }] },
      select: {
        id: true,
        title: true,
        slug: true,
        level: true,
        grammarLesson: true,
        instructions: true,
        instructionsTranslations: true,
        updatedAt: true,
        teacher: {
          select: { id: true, name: true, image: true }
        }
      }
    });

    if (!assignment) return null;

    let lessonId = assignment.grammarLesson;
    let topicId = 'tenses';

    if (!lessonId && assignment.instructions) {
      try {
        const meta = JSON.parse(assignment.instructions);
        if (meta.rawId) lessonId = meta.rawId;
        if (meta.playUrl) {
          const parts = meta.playUrl.replace(/^\/grammar\//, '').split('/');
          if (parts.length >= 2) {
            topicId = parts[0];
            lessonId = parts[1].split('?')[0];
          }
        }
      } catch {}
    }

    const { GRAMMAR_TOPICS, getTopicById } = await import('@/lib/grammar-taxonomy');
    if (lessonId) {
      for (const top of GRAMMAR_TOPICS) {
        if (top.lessons.some(l => l.id === lessonId)) {
          topicId = top.id;
          break;
        }
      }
    }

    let grammarLesson = null;
    if (lessonId) {
      grammarLesson = await prisma.grammarLesson.findUnique({
        where: { id: lessonId },
        select: {
          instructions: true,
          instructionsTranslations: true,
          updatedAt: true
        }
      });
    }

    const finalInstructions = grammarLesson?.instructions || assignment.instructions || '';
    const finalTranslations = grammarLesson?.instructionsTranslations || assignment.instructionsTranslations || null;
    const topicCfg = getTopicById(topicId);
    const lessonCfg = topicCfg?.lessons.find(l => l.id === lessonId);

    return {
      assignmentId: assignment.id,
      title: assignment.title,
      level: assignment.level || lessonCfg?.level || 'a1',
      topicId,
      topicLabel: topicCfg?.label || 'Grammar',
      lessonId,
      lessonLabel: lessonCfg?.label || assignment.title,
      instructions: finalInstructions,
      instructionsTranslations: finalTranslations
    };
  });

  if (!template) throw new Error("Không tìm thấy bài học");

  // 2. Check if student already submitted this lesson
  const existingSubmission = await prisma.submission.findFirst({
    where: {
      studentId: userId,
      assignmentId: template.assignmentId,
      submittedAt: { not: null }
    },
    select: { id: true, score: true, submittedAt: true }
  });

  return {
    ...template,
    isSubmitted: Boolean(existingSubmission),
    score: existingSubmission?.score ?? null
  };
}

export async function completeGrammarLesson(assignmentId: string, classId?: string, groupId?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id;

  const assignment = await prisma.assignment.findFirst({
    where: { OR: [{ id: assignmentId }, { slug: assignmentId }] },
    select: { id: true }
  });
  if (!assignment) throw new Error("Không tìm thấy bài học");

  const existing = await prisma.submission.findFirst({
    where: { 
      studentId: userId, 
      assignmentId: assignment.id,
      classId: classId || undefined,
      groupId: groupId || undefined
    },
    orderBy: { startedAt: 'desc' }
  });

  let submissionId = existing?.id;
  if (existing) {
    await prisma.submission.update({
      where: { id: existing.id },
      data: {
        submittedAt: new Date(),
        score: 10
      }
    });
  } else {
    const created = await prisma.submission.create({
      data: {
        studentId: userId,
        assignmentId: assignment.id,
        classId: classId || null,
        groupId: groupId || null,
        submittedAt: new Date(),
        score: 10,
        attemptNumber: 1
      },
      select: { id: true }
    });
    submissionId = created.id;
  }

  return { success: true, submissionId, score: 10 };
}

export async function getStudentBookData(assignmentId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Fetch cached static book data from Redis (1 hour TTL)
  const bookData = await fetchWithRedis(`book:reader-template:v2:${assignmentId}`, 3600, async () => {
    const assignment = await prisma.assignment.findFirst({
      where: { OR: [{ id: assignmentId }, { slug: assignmentId }] },
      select: {
        id: true,
        title: true,
        instructions: true,
      }
    });

    if (!assignment) return null;

    let bookIdentifier = assignment.id;
    if (assignment.instructions) {
      try {
        const meta = JSON.parse(assignment.instructions);
        if (meta.rawId) bookIdentifier = meta.rawId;
        if (meta.playUrl && meta.playUrl.includes('/student/books/')) {
          const parts = meta.playUrl.split('/student/books/')[1];
          bookIdentifier = parts.split('?')[0];
        }
      } catch {}
    }

    const book = await prisma.readAlongBook.findFirst({
      where: {
        OR: [{ bookId: bookIdentifier }, { id: bookIdentifier }]
      },
      include: {
        slides: {
          orderBy: { orderIndex: "asc" }
        }
      }
    });

    if (!book) return null;

    const formattedBook = {
      id: book.id,
      bookId: book.bookId,
      title: book.title,
      slides: book.slides.map((s) => ({
        id: s.id,
        slideNumber: s.slideNumber,
        imageUrl: s.imageUrl,
        imageName: s.imageName,
        text: s.text,
        audioUrl: s.audioUrl ?? null,
        orderIndex: s.orderIndex,
      })),
    };

    return {
      assignmentId: assignment.id,
      book: formattedBook
    };
  });

  if (!bookData) {
    throw new Error("Không tìm thấy dữ liệu sách đọc.");
  }

  return bookData;
}


