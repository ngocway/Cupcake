import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";

import { cache } from "react";

export const getLessonBasic = cache(async (id: string) => {
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
      teacherId: true,
      assignment: {
        select: {
          id: true,
          slug: true,
          thumbnail: true
        }
      }
    }
  });
});

export const getLessonExtra = cache(async (id: string) => {
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
      },
      favorites: {
        select: { studentId: true }
      }
    }
  });
});

export const getTeacherBasic = cache(async (teacherId: string) => {
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

export const getLessonReadingText = async (lessonId: string) => {
  const assignment = await prisma.assignment.findFirst({
    where: { lesson: { id: lessonId } },
    select: { readingText: true }
  });
  return assignment?.readingText ?? null;
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
  // 1. Fetch current lesson's assignment tags and target audiences
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      targetAudiences: true,
      assignment: {
        select: { tags: true }
      }
    }
  });

  const currentAudiences = lesson?.targetAudiences || [];

  // 2. Fetch popular tags
  const popularTags = await prisma.tag.findMany({
    where: { isPopular: true },
    select: { name: true }
  });
  const popularTagNames = new Set(popularTags.map(t => t.name.toLowerCase().trim()));

  // 3. Get non-popular tags
  const currentTags = lesson?.assignment?.tags
    ? lesson.assignment.tags.split(',').map((t: string) => t.trim().toLowerCase()).filter(Boolean)
    : [];
  const filteredTags = currentTags.filter(tag => !popularTagNames.has(tag));

  let relatedLessons: any[] = [];

  if (filteredTags.length > 0) {
    const candidates = await prisma.lesson.findMany({
      where: {
        id: { not: lessonId },
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

    relatedLessons = candidates.slice(0, 10);
  }

  // Fallback: If no lessons found or no filtered tags exist, fetch the latest public lessons
  if (relatedLessons.length === 0) {
    relatedLessons = await prisma.lesson.findMany({
      where: {
        id: { not: lessonId },
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
      take: 10,
      select: {
        id: true,
        slug: true,
        title: true,
        thumbnail: true
      }
    });
  }

  return relatedLessons;
};
