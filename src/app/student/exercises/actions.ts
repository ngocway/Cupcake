"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { getTopicsForLevel, getTopicById, normalizeLevelId, GRAMMAR_TOPICS, ALL_LESSONS_FLAT } from "@/lib/grammar-taxonomy";

/** Fetch ALL public exercises for a topic at a level, grouped by grammarLesson */
export async function getExercisesForTopic(level: string, topicId: string) {
  const session = await auth();
  const userId = session?.user?.id;

  const baseWhere = {
    materialType: "EXERCISE" as const,
    status: "PUBLIC" as const,
    deletedAt: null,
    grammarTopic: topicId,
    level: { in: [level, level.toUpperCase()] },
  };

  if (userId) {
    const exercises = await prisma.assignment.findMany({
      where: baseWhere,
      select: {
        id: true,
        slug: true,
        title: true,
        thumbnail: true,
        level: true,
        grammarLesson: true,
        _count: { select: { questions: true } },
        submissions: {
          where: { studentId: userId },
          select: { submittedAt: true, score: true },
          orderBy: { submittedAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return exercises.map((ex) => {
      const sub = ex.submissions?.[0] ?? null;
      const status = !sub ? "PENDING" : sub.submittedAt ? "COMPLETED" : "IN_PROGRESS";
      return {
        id: ex.id, slug: ex.slug, title: ex.title, thumbnail: ex.thumbnail,
        level: ex.level, grammarLesson: ex.grammarLesson,
        questionCount: ex._count.questions, status, score: sub?.score ?? null,
      };
    });
  }

  // Not logged in — no submission data
  const exercises = await prisma.assignment.findMany({
    where: baseWhere,
    select: {
      id: true, slug: true, title: true, thumbnail: true,
      level: true, grammarLesson: true,
      _count: { select: { questions: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return exercises.map((ex) => ({
    id: ex.id, slug: ex.slug, title: ex.title, thumbnail: ex.thumbnail,
    level: ex.level, grammarLesson: ex.grammarLesson,
    questionCount: ex._count.questions, status: "PENDING" as const, score: null,
  }));
}

/** Fetch all public exercises for a given level+topic+lesson, with student's submission status */
export async function getExercisesForLesson(level: string, topicId: string, lessonId: string) {
  const session = await auth();
  const userId = session?.user?.id;

  const exercises = await prisma.assignment.findMany({
    where: {
      materialType: "EXERCISE",
      status: "PUBLIC",
      deletedAt: null,
      grammarTopic: topicId,
      grammarLesson: lessonId,
      level: { in: [level, level.toUpperCase()] },
    },
    select: {
      id: true,
      slug: true,
      title: true,
      thumbnail: true,
      level: true,
      grammarTopic: true,
      grammarLesson: true,
      _count: { select: { questions: true } },
      ...(userId ? {
        submissions: {
          where: { studentId: userId },
          select: { submittedAt: true, score: true },
          orderBy: { submittedAt: "desc" as const },
          take: 1,
        }
      } : {}),
    },
    orderBy: { createdAt: "asc" },
  });

  return exercises.map((ex) => {
    const sub = (ex.submissions as any)?.[0] ?? null;
    const status = !sub ? "PENDING" : sub.submittedAt ? "COMPLETED" : "IN_PROGRESS";
    return {
      id: ex.id,
      slug: ex.slug,
      title: ex.title,
      thumbnail: ex.thumbnail,
      level: ex.level,
      questionCount: ex._count.questions,
      status,
      score: sub?.score ?? null,
    };
  });
}

/** Fetch progress summary per topic for a given level (for the topic selection screen) */
export async function getTopicsProgressForLevel(level: string) {
  const session = await auth();
  const userId = session?.user?.id;

  // All public exercises at this level that have a grammarTopic
  const exercises = await prisma.assignment.findMany({
    where: {
      materialType: "EXERCISE",
      status: "PUBLIC",
      deletedAt: null,
      grammarTopic: { not: null },
      level: { in: [level, level.toUpperCase()] },
    },
    select: {
      id: true,
      grammarTopic: true,
      grammarLesson: true,
      ...(userId ? {
        submissions: {
          where: { studentId: userId, submittedAt: { not: null } },
          select: { id: true },
          take: 1,
        }
      } : {}),
    },
  });

  // Group by topic
  const topicMap = new Map<string, { total: number; completed: number; lessons: Set<string> }>();

  for (const ex of exercises) {
    const topic = ex.grammarTopic!;
    if (!topicMap.has(topic)) {
      topicMap.set(topic, { total: 0, completed: 0, lessons: new Set() });
    }
    const entry = topicMap.get(topic)!;
    entry.total++;
    if (ex.grammarLesson) entry.lessons.add(ex.grammarLesson);
    const hasSub = Array.isArray((ex as any).submissions) && (ex as any).submissions.length > 0;
    if (hasSub) entry.completed++;
  }

  return topicMap;
}

/** Fetch lesson-level progress for a specific topic (for the lesson list screen) */
export async function getLessonsProgressForTopic(level: string, topicId: string) {
  const session = await auth();
  const userId = session?.user?.id;

  const exercises = await prisma.assignment.findMany({
    where: {
      materialType: "EXERCISE",
      status: "PUBLIC",
      deletedAt: null,
      grammarTopic: topicId,
      level: { in: [level, level.toUpperCase()] },
      grammarLesson: { not: null },
    },
    select: {
      id: true,
      grammarLesson: true,
      ...(userId ? {
        submissions: {
          where: { studentId: userId, submittedAt: { not: null } },
          select: { id: true },
          take: 1,
        }
      } : {}),
    },
  });

  // Group by lesson
  const lessonMap = new Map<string, { total: number; completed: number }>();
  for (const ex of exercises) {
    const lesson = ex.grammarLesson!;
    if (!lessonMap.has(lesson)) lessonMap.set(lesson, { total: 0, completed: 0 });
    const entry = lessonMap.get(lesson)!;
    entry.total++;
    const hasSub = Array.isArray((ex as any).submissions) && (ex as any).submissions.length > 0;
    if (hasSub) entry.completed++;
  }
  return lessonMap;
}

/** Get all levels that have at least one public exercise */
export async function getAvailableLevels() {
  const raw = await prisma.assignment.groupBy({
    by: ["level"],
    where: {
      materialType: "EXERCISE",
      status: "PUBLIC",
      deletedAt: null,
      grammarTopic: { not: null },
      level: { not: null },
    },
    _count: { id: true },
  });

  return raw
    .map((r) => ({ level: normalizeLevelId(r.level), count: r._count.id }))
    .filter((r) => r.level !== null) as { level: string; count: number }[];
}

/** Resume: Get in-progress exercises for the current student */
export async function getResumeExercises() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const inProgress = await prisma.submission.findMany({
    where: { studentId: session.user.id, submittedAt: null },
    include: {
      assignment: {
        select: {
          id: true,
          slug: true,
          title: true,
          thumbnail: true,
          level: true,
          grammarTopic: true,
          grammarLesson: true,
          materialType: true,
          status: true,
          deletedAt: true,
        },
      },
    },
    orderBy: { startedAt: "desc" },
    take: 5,
  });

  return inProgress
    .filter(
      (s) =>
        s.assignment.materialType === "EXERCISE" &&
        s.assignment.status === "PUBLIC" &&
        !s.assignment.deletedAt
    )
    .map((s) => ({
      id: s.assignment.id,
      slug: s.assignment.slug,
      title: s.assignment.title,
      thumbnail: s.assignment.thumbnail,
      level: s.assignment.level,
      grammarTopic: s.assignment.grammarTopic,
      grammarLesson: s.assignment.grammarLesson,
    }));
}

/** Search exercises by title or lesson name */
export async function searchExercises(query: string) {
  if (!query || query.length < 2) return [];

  // Match title in DB
  const byTitle = await prisma.assignment.findMany({
    where: {
      materialType: "EXERCISE",
      status: "PUBLIC",
      deletedAt: null,
      grammarTopic: { not: null },
      title: { contains: query, mode: "insensitive" },
    },
    select: {
      id: true,
      slug: true,
      title: true,
      level: true,
      grammarTopic: true,
      grammarLesson: true,
    },
    take: 10,
  });

  // Also match taxonomy lesson labels
  const lcQuery = query.toLowerCase();
  const matchedLessons = ALL_LESSONS_FLAT.filter(
    (l) =>
      l.label.toLowerCase().includes(lcQuery) ||
      l.topicLabel.toLowerCase().includes(lcQuery)
  );

  return { byTitle, matchedLessons: matchedLessons.slice(0, 5) };
}
