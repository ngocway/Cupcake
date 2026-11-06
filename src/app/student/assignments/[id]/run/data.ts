import { fetchWithRedis } from "@/lib/cached-queries";
import prisma from "@/lib/prisma";

export const getAssignmentMeta = async (id: string) => {
  return fetchWithRedis(`assignment:meta:v2:${id}`, 300, async () => {
    return prisma.assignment.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: {
        id: true,
        slug: true,
        title: true,
        timeLimit: true,
        deadline: true,
        maxAttempts: true,
        defaultPoints: true,
        focusMode: true,
        level: true,
        instructions: true,
        _count: { select: { questions: true } }
      }
    });
  });
};

export const getAssignmentInstructions = async (id: string) => {
  return fetchWithRedis(`assignment:instructions:v3:${id}`, 600, async () => {
    const ass = await prisma.assignment.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: { instructions: true, readingText: true, grammarLesson: true }
    });
    if (ass?.grammarLesson) {
      const gLesson = await prisma.grammarLesson.findUnique({
        where: { id: ass.grammarLesson },
        select: { instructions: true }
      });
      return {
        instructions: gLesson?.instructions ?? ass.instructions,
        readingText: ass.readingText
      };
    }
    return ass;
  });
};

export const getAssignmentTeacher = async (id: string) => {
  return fetchWithRedis(`assignment:teacher:${id}`, 3600, async () => {
    const assignment = await prisma.assignment.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: {
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
        }
      }
    });
    return assignment?.teacher || null;
  });
};

export const getAssignmentReviews = async (assignmentId: string) => {
  return fetchWithRedis(`assignment:reviews:${assignmentId}`, 600, async () => {
    return prisma.assignmentReview.findMany({
      where: { assignmentId, isApproved: true },
      take: 3,
      include: { student: { select: { name: true, image: true } } },
      orderBy: { createdAt: "desc" }
    });
  });
};

export const prewarmAssignmentQuestions = async (assignmentId: string) => {
  // Hàm này chỉ gọi để Prisma cache lại query câu hỏi
  return prisma.question.findMany({
    where: {
      assignment: {
        OR: [{ id: assignmentId }, { slug: assignmentId }]
      }
    },
    orderBy: { orderIndex: "asc" },
    select: { id: true } // Chỉ lấy ID để nhẹ, nhưng đủ để warm up DB cache
  });
};

export const getCachedAssignmentQuestions = async (assignmentId: string) => {
  return fetchWithRedis(`assignment:questions:v2:${assignmentId}`, 3600, async () => {
    const isId = assignmentId.startsWith('cm') || assignmentId.length >= 24;
    return prisma.question.findMany({
      where: isId
        ? { assignmentId }
        : {
            assignment: {
              OR: [{ id: assignmentId }, { slug: assignmentId }]
            }
          },
      orderBy: { orderIndex: 'asc' }
    });
  });
};

/** Fetch explanationTranslations for all questions in an assignment (raw SQL, bypasses Prisma schema cache).
 *  Returns a map: { [questionId]: { vi, th, id } | null }
 */
export const getQuestionTranslationMap = async (assignmentId: string) => {
  return fetchWithRedis(`assignment:question-translations:v2:${assignmentId}`, 3600, async () => {
    const isId = assignmentId.startsWith('cm') || assignmentId.length >= 24;
    const query = isId
      ? `SELECT q.id, q."explanationTranslations" 
         FROM "Question" q 
         WHERE q."assignmentId" = $1`
      : `SELECT q.id, q."explanationTranslations" 
         FROM "Question" q 
         JOIN "Assignment" a ON q."assignmentId" = a.id 
         WHERE a.id = $1 OR a.slug = $1`;
    const rows = await prisma.$queryRawUnsafe<Array<{ id: string; explanationTranslations: any }>>(
      query,
      assignmentId
    );
    const map: Record<string, any> = {};
    for (const r of rows) {
      map[r.id] = r.explanationTranslations ?? null;
    }
    return map;
  });
};

export const getAssignmentTranslations = async (assignmentId: string) => {
  return fetchWithRedis(`assignment:translations:v4:${assignmentId}`, 3600, async () => {
    const isId = assignmentId.startsWith('cm') || assignmentId.length >= 24;
    const ass = isId
      ? await prisma.assignment.findUnique({
          where: { id: assignmentId },
          select: { grammarLesson: true, instructionsTranslations: true }
        })
      : await prisma.assignment.findFirst({
          where: { OR: [{ id: assignmentId }, { slug: assignmentId }] },
          select: { grammarLesson: true, instructionsTranslations: true }
        });
    if (ass?.grammarLesson) {
      const gLesson = await prisma.grammarLesson.findUnique({
        where: { id: ass.grammarLesson },
        select: { instructionsTranslations: true }
      });
      return gLesson?.instructionsTranslations ?? ass.instructionsTranslations ?? null;
    }
    return ass?.instructionsTranslations ?? null;
  });
};

/**
 * Cached Quiz Runner Template (Static questions, translations, instructions, teacher meta).
 * Shared across ALL students and cached in Redis with 1h TTL.
 */
export const getCachedQuizRunnerTemplate = async (assignmentId: string) => {
  return fetchWithRedis(`assignment:runner-template:v2:${assignmentId}`, 3600, async () => {
    // 1. Lean query with primary key index when assignmentId is CUID
    const isId = assignmentId.startsWith('cm') || assignmentId.length >= 24;
    const assignmentSelect = {
      id: true,
      title: true,
      slug: true,
      tags: true,
      level: true,
      materialType: true,
      grammarLesson: true,
      targetAudiences: true,
      readingText: true,
      instructions: true,
      instructionsImageUrl: true,
      instructionsTranslations: true,
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
        }
      },
      lesson: {
        select: {
          id: true,
          videoUrl: true,
          audioUrl: true,
          targetAudiences: true
        }
      }
    };

    const assignmentRecord = isId
      ? await prisma.assignment.findUnique({
          where: { id: assignmentId },
          select: assignmentSelect
        })
      : await prisma.assignment.findFirst({
          where: { OR: [{ id: assignmentId }, { slug: assignmentId }] },
          select: assignmentSelect
        });

    if (!assignmentRecord) return null;
    const actualAssignmentId = assignmentRecord.id;

    // 2. Parallel fetch questions, translations & extra grammar instructions without redundant queries
    const [questions, questionTranslations, grammarLesson] = await Promise.all([
      getCachedAssignmentQuestions(actualAssignmentId),
      getQuestionTranslationMap(actualAssignmentId),
      assignmentRecord.grammarLesson 
        ? prisma.grammarLesson.findUnique({
            where: { id: assignmentRecord.grammarLesson },
            select: { instructions: true, instructionsTranslations: true }
          })
        : Promise.resolve(null)
    ]);

    let instructions = assignmentRecord.instructions;
    if (grammarLesson?.instructions) {
      instructions = grammarLesson.instructions;
    }

    const assignmentTranslations = grammarLesson?.instructionsTranslations ?? assignmentRecord.instructionsTranslations ?? null;

    const extraData = {
      readingText: assignmentRecord.readingText,
      instructions,
      instructionsImageUrl: assignmentRecord.instructionsImageUrl,
      videoUrl: assignmentRecord.videoUrl,
      audioUrl: assignmentRecord.audioUrl,
      teacher: assignmentRecord.teacher,
      lesson: assignmentRecord.lesson,
      favoriteAssignments: []
    };

    return {
      actualAssignmentId,
      assignment: {
        id: assignmentRecord.id,
        title: assignmentRecord.title,
        slug: assignmentRecord.slug,
        tags: assignmentRecord.tags,
        level: assignmentRecord.level,
        materialType: assignmentRecord.materialType,
        grammarLesson: assignmentRecord.grammarLesson,
        targetAudiences: assignmentRecord.targetAudiences,
        _count: { questions: questions.length }
      },
      questions,
      questionTranslations,
      assignmentTranslations,
      extraData
    };
  });
};

const STOP_WORDS = new Set([
  "the", "and", "for", "with", "from", "into", "onto", "part", "exercise", "exercises",
  "practice", "quiz", "test", "lesson", "unit", "day", "bai", "tap", "doc", "game"
]);

/**
 * Filter out internal 45-Day Vocab sub-activities (Game wrappers, Flashcard wrappers, daily internal sub-items)
 * so they don't pollute general related exercise recommendations.
 */
function isInternalClassSubItem(item: {
  id?: string | null;
  slug?: string | null;
  title?: string | null;
  materialType?: string | null;
  grammarLesson?: string | null;
}): boolean {
  const id = (item.id || "").toLowerCase();
  const slug = (item.slug || "").toLowerCase();
  const title = (item.title || "").trim();
  const grammarLesson = (item.grammarLesson || "").toLowerCase();

  if (item.materialType === "FLASHCARD") return true;
  if (id.startsWith("tiny-vocab-") || slug.startsWith("vocab45-")) return true;
  if (grammarLesson.startsWith("tiny-vocab-")) return true;
  if (/^(Game:\s*|Flashcard\s*\()/i.test(title)) return true;
  return false;
}

export const getRelatedAssignmentsCached = async (
  assignmentId: string,
  assignmentTags: string | null,
  targetAudiences: string[]
) => {
  return fetchWithRedis(`assignment:related:v4:${assignmentId}`, 900, async () => {
    // 1. Fetch assignment with full metadata so tags/grammarTopic/level are always available
    // even when caller passes null/empty arguments.
    const assignment = await prisma.assignment.findFirst({
      where: { OR: [{ id: assignmentId }, { slug: assignmentId }] },
      select: {
        id: true,
        slug: true,
        title: true,
        tags: true,
        level: true,
        materialType: true,
        grammarTopic: true,
        grammarLesson: true,
        targetAudiences: true,
        relatedAssignmentIds: true,
        lesson: {
          select: {
            id: true,
            relatedLessonIds: true
          }
        }
      }
    });

    const actualId = assignment?.id ?? assignmentId;
    const currentTitle = assignment?.title || "";
    const resolvedTags = assignmentTags || assignment?.tags || null;
    const resolvedAudiences =
      targetAudiences && targetAudiences.length > 0
        ? targetAudiences
        : ((assignment?.targetAudiences as string[]) || []);

    // If this assignment is part of a lesson, recommend related lessons instead of exercises
    if (assignment?.lesson) {
      const parentLesson = assignment.lesson;
      let relatedLessonsList: any[] = [];

      if (parentLesson.relatedLessonIds && parentLesson.relatedLessonIds.length > 0) {
        relatedLessonsList = await prisma.lesson.findMany({
          where: {
            id: { in: parentLesson.relatedLessonIds },
            deletedAt: null
          },
          include: { teacher: { select: { id: true, name: true, image: true } } }
        });

        // Preserve AI-ranked order
        const orderMap = new Map(parentLesson.relatedLessonIds.map((id, i) => [id, i]));
        relatedLessonsList.sort((a, b) => (orderMap.get(a.id) ?? 99) - (orderMap.get(b.id) ?? 99));
      } else {
        // Fallback: fetch latest public lessons of the same level/targetAudience
        relatedLessonsList = await prisma.lesson.findMany({
          where: {
            id: { not: parentLesson.id },
            deletedAt: null,
            ...(resolvedAudiences.length > 0 && {
              targetAudiences: { hasSome: resolvedAudiences }
            })
          },
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { teacher: { select: { id: true, name: true, image: true } } }
        });
      }

      return relatedLessonsList.map((l) => ({
        id: l.id,
        slug: l.slug,
        title: l.title,
        thumbnail: l.thumbnail,
        teacher: l.teacher,
        viewCount: l.viewsCount,
        type: "LESSON"
      }));
    }

    // Common exclusion filter for public standalone exercises
    const basePublicExerciseWhere: any = {
      status: "PUBLIC",
      id: { not: actualId },
      deletedAt: null,
      lesson: null,
      materialType: { not: "FLASHCARD" },
      NOT: [
        { id: { startsWith: "tiny-vocab-" } },
        { slug: { startsWith: "vocab45-" } },
        { title: { startsWith: "Game:" } },
        { title: { startsWith: "Flashcard (" } },
        { title: { startsWith: "[BÀI ĐỌC]" } }
      ]
    };

    // 2. Fetch sibling parts (e.g. Part 2, Part 3) of the same exercise topic
    const hasPartSuffix = /\s+Part\s+\d+$/i.test(currentTitle);
    let siblingParts: any[] = [];
    if (hasPartSuffix) {
      const baseTitle = currentTitle.replace(/\s+Part\s+\d+$/i, "").trim();
      const potentialSiblings = await prisma.assignment.findMany({
        where: {
          ...basePublicExerciseWhere,
          title: {
            startsWith: baseTitle,
            mode: "insensitive"
          }
        },
        include: { teacher: { select: { name: true, image: true } } }
      });

      siblingParts = potentialSiblings.filter((sibling) => {
        const siblingTitle = sibling.title || "";
        return /\s+Part\s+\d+$/i.test(siblingTitle) && !isInternalClassSubItem(sibling);
      });

      siblingParts.sort((a, b) => {
        const matchA = a.title.match(/Part\s+(\d+)$/i);
        const matchB = b.title.match(/Part\s+(\d+)$/i);
        const partA = matchA ? parseInt(matchA[1], 10) : 0;
        const partB = matchB ? parseInt(matchB[1], 10) : 0;
        return partA - partB;
      });
    }

    // 3. Get other related content (AI pre-computed -> Grammar Topic/Lesson -> Tag/Title keyword matching -> Same Level/Type fallback)
    let otherRelated: any[] = [];
    if (assignment?.relatedAssignmentIds && assignment.relatedAssignmentIds.length > 0) {
      const related = await prisma.assignment.findMany({
        where: {
          id: { in: assignment.relatedAssignmentIds },
          status: "PUBLIC",
          deletedAt: null
        },
        include: { teacher: { select: { name: true, image: true } } }
      });

      const orderMap = new Map(assignment.relatedAssignmentIds.map((id, i) => [id, i]));
      related.sort((a, b) => (orderMap.get(a.id) ?? 99) - (orderMap.get(b.id) ?? 99));
      otherRelated = related.filter((item) => !isInternalClassSubItem(item));
    }

    if (otherRelated.length < 10) {
      const existingIds = new Set<string>([
        actualId,
        ...siblingParts.map((s) => s.id),
        ...otherRelated.map((r) => r.id)
      ]);

      // Build keyword & tag signals from the current assignment
      const popularTags = await prisma.tag.findMany({
        where: { isPopular: true },
        select: { name: true }
      });
      const popularTagNames = new Set(popularTags.map((t) => t.name.toLowerCase().trim()));

      const currentTags = resolvedTags
        ? resolvedTags
            .split(",")
            .map((t: string) => t.trim().toLowerCase())
            .filter(Boolean)
        : [];
      const filteredTags = currentTags.filter((tag: string) => !popularTagNames.has(tag));

      // Extract meaningful keywords from title (e.g. "Past Simple", "Regular Verbs")
      const titleKeywords = currentTitle
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length >= 4 && !STOP_WORDS.has(w))
        .slice(0, 5);

      const orConditions: any[] = [];
      if (assignment?.grammarLesson && !assignment.grammarLesson.startsWith("tiny-vocab-")) {
        orConditions.push({ grammarLesson: assignment.grammarLesson });
      }
      if (assignment?.grammarTopic) {
        orConditions.push({ grammarTopic: assignment.grammarTopic });
      }
      for (const tag of filteredTags) {
        orConditions.push({ tags: { contains: tag, mode: "insensitive" } });
      }
      for (const kw of titleKeywords) {
        orConditions.push({ title: { contains: kw, mode: "insensitive" } });
        orConditions.push({ tags: { contains: kw, mode: "insensitive" } });
      }

      if (orConditions.length > 0) {
        const candidates = await prisma.assignment.findMany({
          where: {
            ...basePublicExerciseWhere,
            id: { notIn: Array.from(existingIds) },
            ...(resolvedAudiences.length > 0 && {
              targetAudiences: { hasSome: resolvedAudiences }
            }),
            OR: orConditions
          },
          take: 80,
          include: { teacher: { select: { name: true, image: true } } }
        });

        const scoreCandidate = (cand: any) => {
          let score = 0;
          if (
            assignment?.grammarLesson &&
            cand.grammarLesson === assignment.grammarLesson
          ) {
            score += 50;
          }
          if (
            assignment?.grammarTopic &&
            cand.grammarTopic === assignment.grammarTopic
          ) {
            score += 30;
          }
          if (assignment?.materialType && cand.materialType === assignment.materialType) {
            score += 10;
          }
          if (assignment?.level && cand.level === assignment.level) {
            score += 8;
          }
          const candTags = cand.tags
            ? cand.tags
                .split(",")
                .map((t: string) => t.trim().toLowerCase())
                .filter(Boolean)
            : [];
          for (const t of candTags) {
            if (filteredTags.includes(t)) score += 15;
          }
          const candTitleLower = (cand.title || "").toLowerCase();
          for (const kw of titleKeywords) {
            if (candTitleLower.includes(kw)) score += 6;
            if (candTags.some((t: string) => t.includes(kw))) score += 4;
          }
          return score;
        };

        const validCandidates = candidates.filter((c) => !isInternalClassSubItem(c));
        validCandidates.sort((a, b) => scoreCandidate(b) - scoreCandidate(a));

        for (const cand of validCandidates) {
          if (otherRelated.length >= 10) break;
          if (!existingIds.has(cand.id)) {
            otherRelated.push(cand);
            existingIds.add(cand.id);
          }
        }
      }

      // Final fallback if still fewer than 10: fetch public exercises with same materialType / level (excluding internal 45vocab games/flashcards)
      if (otherRelated.length < 10) {
        const fallbackItems = await prisma.assignment.findMany({
          where: {
            ...basePublicExerciseWhere,
            id: { notIn: Array.from(existingIds) },
            ...(assignment?.materialType && assignment.materialType !== "FLASHCARD"
              ? { materialType: assignment.materialType }
              : {}),
            ...(resolvedAudiences.length > 0 && {
              targetAudiences: { hasSome: resolvedAudiences }
            })
          },
          orderBy: { viewCount: "desc" },
          take: 15,
          include: { teacher: { select: { name: true, image: true } } }
        });

        for (const item of fallbackItems) {
          if (otherRelated.length >= 10) break;
          if (!existingIds.has(item.id) && !isInternalClassSubItem(item)) {
            otherRelated.push(item);
            existingIds.add(item.id);
          }
        }
      }
    }

    // 4. Combine: Put sibling parts first, deduplicate by ID, and limit to 10
    const siblingIds = new Set(siblingParts.map((s) => s.id));
    const filteredOther = otherRelated.filter((item) => !siblingIds.has(item.id));
    const combined = [...siblingParts, ...filteredOther].slice(0, 10);

    return combined;
  });
};

/** Pre-warm questions and translations into Redis Cache in background */
export const prewarmAssignmentsData = async (assignmentIds: string[]) => {
  if (!assignmentIds || assignmentIds.length === 0) return;
  // Non-blocking fire-and-forget
  Promise.all(
    assignmentIds.slice(0, 8).map(async (id) => {
      try {
        await Promise.all([
          getCachedAssignmentQuestions(id),
          getQuestionTranslationMap(id),
          getAssignmentTranslations(id),
        ]);
      } catch {}
    })
  ).catch(() => {});
};
