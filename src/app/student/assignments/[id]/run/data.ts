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
  return fetchWithRedis(`assignment:related:v2:${assignmentId}`, 900, async () => {
    // 1. Fetch assignment with pre-computed related IDs, title and lesson relation
    const assignment = await prisma.assignment.findFirst({
      where: { OR: [{ id: assignmentId }, { slug: assignmentId }] },
      select: {
        id: true,
        title: true,
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

    // If this assignment is part of a lesson, recommend related lessons instead of exercises
    if (assignment?.lesson) {
      const parentLesson = assignment.lesson;
      let relatedLessonsList: any[] = [];
      
      if (parentLesson.relatedLessonIds && parentLesson.relatedLessonIds.length > 0) {
        relatedLessonsList = await prisma.lesson.findMany({
          where: {
            id: { in: parentLesson.relatedLessonIds },
            status: 'PUBLIC',
            deletedAt: null
          },
          include: { teacher: { select: { id: true, name: true, image: true } } }
        });
        
        // Preserve AI-ranked order
        const orderMap = new Map(parentLesson.relatedLessonIds.map((id, i) => [id, i]));
        relatedLessonsList.sort((a, b) => (orderMap.get(a.id) ?? 99) - (orderMap.get(b.id) ?? 99));
      } else {
        // Fallback: fetch latest public lessons of the same level/targetAudience
        const currentAudiences = targetAudiences || [];
        relatedLessonsList = await prisma.lesson.findMany({
          where: {
            status: 'PUBLIC',
            id: { not: parentLesson.id },
            deletedAt: null,
            ...(currentAudiences.length > 0 && {
              targetAudiences: { hasSome: currentAudiences }
            })
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { teacher: { select: { id: true, name: true, image: true } } }
        });
      }
      
      return relatedLessonsList.map(l => ({
        id: l.id,
        slug: l.slug,
        title: l.title,
        thumbnail: l.thumbnail,
        teacher: l.teacher,
        viewCount: l.viewsCount,
        type: "LESSON"
      }));
    }

    // 2. Fetch sibling parts (e.g. Part 2, Part 3) of the same exercise topic
    const hasPartSuffix = /\s+Part\s+\d+$/i.test(currentTitle);
    let siblingParts: any[] = [];
    if (hasPartSuffix) {
      const baseTitle = currentTitle.replace(/\s+Part\s+\d+$/i, "").trim();
      const potentialSiblings = await prisma.assignment.findMany({
        where: {
          status: 'PUBLIC',
          id: { not: actualId },
          deletedAt: null,
          lesson: null,
          title: {
            startsWith: baseTitle,
            mode: 'insensitive'
          }
        },
        include: { teacher: { select: { name: true, image: true } } }
      });

      // Filter to keep only those with "Part \d+" at the end
      siblingParts = potentialSiblings.filter(sibling => {
        const siblingTitle = sibling.title || "";
        return /\s+Part\s+\d+$/i.test(siblingTitle);
      });

      // Sort by part number ascending
      siblingParts.sort((a, b) => {
        const matchA = a.title.match(/Part\s+(\d+)$/i);
        const matchB = b.title.match(/Part\s+(\d+)$/i);
        const partA = matchA ? parseInt(matchA[1], 10) : 0;
        const partB = matchB ? parseInt(matchB[1], 10) : 0;
        return partA - partB;
      });
    }

    // 3. Get other related content (AI pre-computed or fallback query)
    let otherRelated: any[] = [];
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
      otherRelated = related;
    } else {
      // Fallback: tag-matching (for assignments not yet indexed by AI)
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

        otherRelated = candidates.slice(0, 10);
      }

      if (otherRelated.length === 0) {
        otherRelated = await prisma.assignment.findMany({
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
    }

    // 4. Combine: Put sibling parts first, deduplicate by ID, and limit to 10
    const siblingIds = new Set(siblingParts.map(s => s.id));
    const filteredOther = otherRelated.filter(item => !siblingIds.has(item.id));
    const combined = [...siblingParts, ...filteredOther].slice(0, 10);

    return combined;
  });
};

