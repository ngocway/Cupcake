import { fetchWithRedis } from "@/lib/cached-queries";
import prisma from "@/lib/prisma";

export const getAssignmentMeta = async (id: string) => {
  return fetchWithRedis(`assignment:meta:${id}`, 300, async () => {
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
        _count: { select: { questions: true } }
      }
    });
  });
};

export const getAssignmentInstructions = async (id: string) => {
  return fetchWithRedis(`assignment:instructions:${id}`, 600, async () => {
    return prisma.assignment.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: { instructions: true, readingText: true }
    });
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
  return prisma.assignmentReview.findMany({
    where: { assignmentId, isApproved: true },
    take: 3,
    include: { student: { select: { name: true, image: true } } },
    orderBy: { createdAt: "desc" }
  });
};

export const prewarmAssignmentQuestions = async (assignmentId: string) => {
  // Hàm này chỉ gọi để Prisma cache lại query câu hỏi
  return prisma.question.findMany({
    where: { assignmentId },
    orderBy: { orderIndex: "asc" },
    select: { id: true } // Chỉ lấy ID để nhẹ, nhưng đủ để warm up DB cache
  });
};

export const getCachedAssignmentQuestions = async (assignmentId: string) => {
  return fetchWithRedis(`assignment:questions:${assignmentId}`, 3600, async () => {
    return prisma.question.findMany({
      where: { assignmentId },
      orderBy: { orderIndex: 'asc' }
    });
  });
};

/** Fetch explanationTranslations for all questions in an assignment (raw SQL, bypasses Prisma schema cache).
 *  Returns a map: { [questionId]: { vi, th, id } | null }
 */
export const getQuestionTranslationMap = async (assignmentId: string) => {
  return fetchWithRedis(`assignment:question-translations:${assignmentId}`, 3600, async () => {
    const rows = await prisma.$queryRawUnsafe<Array<{ id: string; explanationTranslations: any }>>(
      `SELECT id, "explanationTranslations" FROM "Question" WHERE "assignmentId" = $1`,
      assignmentId
    );
    const map: Record<string, any> = {};
    for (const r of rows) {
      map[r.id] = r.explanationTranslations ?? null;
    }
    return map;
  });
};

/** Fetch instructionsTranslations for an assignment (raw SQL). */
export const getAssignmentTranslations = async (assignmentId: string) => {
  return fetchWithRedis(`assignment:translations:${assignmentId}`, 3600, async () => {
    const rows = await prisma.$queryRawUnsafe<Array<{ instructionsTranslations: any }>>(
      `SELECT "instructionsTranslations" FROM "Assignment" WHERE id = $1`,
      assignmentId
    );
    return rows[0]?.instructionsTranslations ?? null;
  });
};


export const getRelatedAssignmentsCached = async (assignmentId: string, assignmentTags: string | null, targetAudiences: string[]) => {
  return fetchWithRedis(`assignment:related:${assignmentId}`, 900, async () => {
    // 1. Fetch assignment with pre-computed related IDs
    const assignment = await prisma.assignment.findFirst({
      where: { OR: [{ id: assignmentId }, { slug: assignmentId }] },
      select: { id: true, relatedAssignmentIds: true }
    });

    const actualId = assignment?.id ?? assignmentId;

    // 2. If AI has pre-computed related IDs, use them directly (fast DB read)
    if (assignment?.relatedAssignmentIds && assignment.relatedAssignmentIds.length > 0) {
      const related = await prisma.assignment.findMany({
        where: {
          id: { in: assignment.relatedAssignmentIds },
          status: 'PUBLIC',
          deletedAt: null
        },
        include: { teacher: { select: { name: true, image: true } } }
      });

      // Preserve AI-ranked order
      const orderMap = new Map(assignment.relatedAssignmentIds.map((id, i) => [id, i]));
      related.sort((a, b) => (orderMap.get(a.id) ?? 99) - (orderMap.get(b.id) ?? 99));
      return related;
    }

    // 3. Fallback: tag-matching (for assignments not yet indexed by AI)
    const popularTags = await prisma.tag.findMany({
      where: { isPopular: true },
      select: { name: true }
    });
    const popularTagNames = new Set(popularTags.map(t => t.name.toLowerCase().trim()));

    const currentTags = assignmentTags
      ? assignmentTags.split(',').map((t: string) => t.trim().toLowerCase()).filter(Boolean)
      : [];
    const filteredTags = currentTags.filter((tag: string) => !popularTagNames.has(tag));
    const currentAudiences = targetAudiences || [];

    let relatedAssignments: any[] = [];

    if (filteredTags.length > 0) {
      const candidates = await prisma.assignment.findMany({
        where: {
          status: 'PUBLIC',
          id: { not: actualId },
          deletedAt: null,
          lesson: null,
          ...(currentAudiences.length > 0 && {
            targetAudiences: { hasSome: currentAudiences }
          }),
          OR: filteredTags.map((tag: string) => ({
            tags: { contains: tag, mode: 'insensitive' }
          }))
        },
        take: 100,
        include: { teacher: { select: { name: true, image: true } } }
      });

      const getOverlapCount = (tagsStr: string | null | undefined) => {
        if (!tagsStr) return 0;
        const tags = tagsStr.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
        return tags.filter(tag => filteredTags.includes(tag)).length;
      };

      candidates.sort((a, b) => {
        const overlapA = getOverlapCount(a.tags);
        const overlapB = getOverlapCount(b.tags);
        return overlapB - overlapA;
      });

      relatedAssignments = candidates.slice(0, 10);
    }

    if (relatedAssignments.length === 0) {
      relatedAssignments = await prisma.assignment.findMany({
        where: {
          status: 'PUBLIC',
          id: { not: actualId },
          deletedAt: null,
          lesson: null,
          ...(currentAudiences.length > 0 && {
            targetAudiences: { hasSome: currentAudiences }
          })
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { teacher: { select: { name: true, image: true } } }
      });
    }

    return relatedAssignments;
  });
};

