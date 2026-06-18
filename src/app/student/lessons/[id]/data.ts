import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import { fetchWithRedis } from "@/lib/cached-queries";
import { cache } from "react";

export const getLessonBasic = cache(async (id: string) => {
  return fetchWithRedis(`lesson:basic:${id}`, 300, async () => {
    return prisma.lesson.findFirst({
      where: {
        OR: [{ id }, { slug: id }]
      },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        videoUrl: true,
        audioUrl: true,
        audioMetadata: true,
        teacherId: true,
        assignment: {
          select: {
            id: true,
            slug: true,
            thumbnail: true,
            readingText: true,
            audioUrl: true,
            audioMetadata: true
          }
        }
      }
    });
  });
});

export const getLessonExtra = cache(async (id: string) => {
  return fetchWithRedis(`lesson:extra:${id}`, 300, async () => {
    return prisma.lesson.findFirst({
      where: {
        OR: [{ id }, { slug: id }]
      },
      select: {
        assignment: {
          select: {
            id: true,
            slug: true,
            title: true,
            tags: true,
            _count: { select: { questions: true } }
          }
        }
      }
    });
  });
});

export const getTeacherBasic = cache(async (teacherId: string) => {
  return fetchWithRedis(`teacher:basic:${teacherId}`, 3600, async () => {
    return prisma.user.findUnique({
      where: { id: teacherId },
      select: {
        id: true,
        name: true,
        image: true,
        professionalTitle: true,
        bio: true,
        isPortfolioPublished: true,
        _count: {
          select: { lessons: true, assignments: true }
        }
      }
    });
  });
});

export const getLessonReadingText = async (lessonId: string) => {
  const assignment = await prisma.assignment.findFirst({
    where: { lesson: { id: lessonId } },
    select: { readingText: true, audioMetadata: true }
  });
  if (!assignment || !assignment.readingText) return null;

  // Nếu có audioMetadata nhưng chưa có span nào được bọc trong readingText, tiến hành bọc động
  if (assignment.audioMetadata && Array.isArray(assignment.audioMetadata) && assignment.audioMetadata.length > 0) {
    const hasSpans = assignment.readingText.includes('class="reading-word"');
    if (!hasSpans) {
      const { alignAndWrapHtmlServer } = await import("@/actions/material-actions");
      return await alignAndWrapHtmlServer(assignment.readingText, assignment.audioMetadata as any);
    }
  }

  return assignment.readingText;
};

export const getLessonReviews = async (lessonId: string) => {
  return prisma.lessonReview.findMany({
    where: { lessonId, isApproved: true },
    include: {
      student: {
        select: { name: true, image: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  });
};

export const getRelatedLessons = async (lessonId: string) => {
  return fetchWithRedis(`lesson:related:${lessonId}`, 900, async () => {
    // 1. Resolve actual lesson UUID and fetch tags/target audiences
    const lesson = await prisma.lesson.findFirst({
      where: {
        OR: [{ id: lessonId }, { slug: lessonId }]
      },
      select: {
        id: true,
        targetAudiences: true,
        assignment: {
          select: { tags: true }
        }
      }
    });

    if (!lesson) return [];
    const actualId = lesson.id;
    const currentAudiences = lesson.targetAudiences || [];

    // 2. Fetch popular tags
    const popularTags = await prisma.tag.findMany({
      where: { isPopular: true },
      select: { name: true }
    });
    const popularTagNames = new Set(popularTags.map(t => t.name.toLowerCase().trim()));

    // 3. Get non-popular tags
    const currentTags = lesson.assignment?.tags
      ? lesson.assignment.tags.split(',').map((t: string) => t.trim().toLowerCase()).filter(Boolean)
      : [];
    const filteredTags = currentTags.filter(tag => !popularTagNames.has(tag));

    let relatedLessons: any[] = [];

    if (filteredTags.length > 0) {
      const candidates = await prisma.lesson.findMany({
        where: {
          id: { not: actualId },
          deletedAt: null,
          isBlocked: false,
          isPremium: false,
          ...(currentAudiences.length > 0 && {
            targetAudiences: { hasSome: currentAudiences }
          }),
          assignment: {
            OR: filteredTags.map(tag => ({
              tags: { contains: tag, mode: 'insensitive' }
            }))
          }
        },
        take: 100,
        select: {
          id: true,
          slug: true,
          title: true,
          thumbnail: true,
          assignment: {
            select: { tags: true }
          }
        }
      });

      const getOverlapCount = (tagsStr: string | null | undefined) => {
        if (!tagsStr) return 0;
        const tags = tagsStr.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
        return tags.filter(tag => filteredTags.includes(tag)).length;
      };

      candidates.sort((a, b) => {
        const overlapA = getOverlapCount(a.assignment?.tags);
        const overlapB = getOverlapCount(b.assignment?.tags);
        return overlapB - overlapA;
      });

      relatedLessons = candidates;
    }

    // Fallback: If no lessons found or no filtered tags exist, fetch the latest public lessons
    if (relatedLessons.length === 0) {
      relatedLessons = await prisma.lesson.findMany({
        where: {
          id: { not: actualId },
          deletedAt: null,
          isBlocked: false,
          isPremium: false,
          ...(currentAudiences.length > 0 && {
            targetAudiences: { hasSome: currentAudiences }
          })
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 50,
        select: {
          id: true,
          slug: true,
          title: true,
          thumbnail: true,
          assignment: {
            select: { tags: true }
          }
        }
      });
    }

    // Filter out duplicate titles and limit to 10 items
    const seenTitles = new Set<string>();
    const uniqueLessons: any[] = [];
    for (const item of relatedLessons) {
      const normalizedTitle = item.title.trim().toLowerCase();
      if (!seenTitles.has(normalizedTitle)) {
        seenTitles.add(normalizedTitle);
        uniqueLessons.push(item);
      }
      if (uniqueLessons.length >= 10) break;
    }

    return uniqueLessons;
  });
};
