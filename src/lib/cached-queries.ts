import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export const getCachedTags = unstable_cache(
  async () => {
    const popularDbTags = await prisma.tag.findMany({
      where: { isPopular: true },
      select: { name: true },
      orderBy: { name: "asc" }
    });

    return popularDbTags.map(t => t.name);
  },
  ["public-tags"],
  { revalidate: 1800, tags: ["tags"] }
);

// ─── Shared mapper ────────────────────────────────────────────────────────────

function mapFeedItem(item: any) {
  return {
    ...item,
    id: item.sourceId,
    // Normalize empty string slug to null so consumers can safely do `slug || id`
    slug: item.slug || null,
    teacher: {
      id: item.teacherId,
      name: item.teacherName,
      image: item.teacherImage
    },
    _count: { reviews: item.reviewCount, questions: item.questionCount }
  };
}

export const getShuffledIds = unstable_cache(
  async (
    contentType: "EXERCISE" | "LESSON",
    goal: string,
    search: string,
    userType: string,
    studySubject?: string,
    studyLevel?: string
  ) => {
    const where: any = { status: "PUBLIC", contentType };

    if (goal) {
      where.learningGoals = { has: goal };
    }
    if (search) where.title = { contains: search, mode: 'insensitive' };

    if (studySubject) {
      where.subject = studySubject;
    }

    if (userType) {
      if (studyLevel) {
        const ageAndLevelCondition = {
          targetAudiences: { has: userType },
          audienceLevels: { path: [userType], equals: studyLevel }
        };

        where.targetAudiences = ageAndLevelCondition.targetAudiences;
        where.audienceLevels = ageAndLevelCondition.audienceLevels;
      } else {
        const defaultOR = [
          { targetAudiences: { has: userType } },
          { targetAudiences: { equals: [] } }
        ];
        where.OR = defaultOR;
      }
    }

    const idRows = await prisma.homepageFeed.findMany({
      where,
      select: { id: true }
    });

    const randomIds = idRows
      .map(row => row.id)
      .sort(() => 0.5 - Math.random());

    return randomIds;
  },
  ["homepage-shuffled-ids-v4"],
  { revalidate: 600, tags: ["homepage", "shuffled"] }
);

// Server-side: newest exercises only — fast first load. Popular is fetched client-side.
const getAssignmentsInternal = unstable_cache(
  async (goal: string, search: string, userType: string, studySubject: string = '', studyLevel: string = '') => {
    const randomIds = await getShuffledIds("EXERCISE", goal, search, userType, studySubject, studyLevel);
    const slicedIds = randomIds.slice(0, 12);

    let items: any[] = [];
    if (slicedIds.length > 0) {
      const placeholders = slicedIds.map((_, i) => `$${i + 1}`).join(',');
      items = await prisma.$queryRawUnsafe(`SELECT * FROM "HomepageFeed" WHERE id IN (${placeholders})`, ...slicedIds);
    }

    // Restore the exact random order
    items.sort((a, b) => slicedIds.indexOf(a.id) - slicedIds.indexOf(b.id));

    return { items: items.map(mapFeedItem), total: randomIds.length };
  },
  ["homepage-assignments-cached-v4"],
  { revalidate: 60, tags: ["assignments", "homepage"] }
);

// Server-side: newest exercises only — fast first load. Popular is fetched client-side.
export const getCachedAssignments = async (params: any) => {
  return getAssignmentsInternal(
    params.goal || params.categoryId || '',
    params.search || '',
    params.userType || '',
    params.studySubject || '',
    params.studyLevel || ''
  );
};

// ─── LESSONS (newest) ─────────────────────────────────────────────────────────

// Server-side: newest lessons only — fast first load. Popular is fetched client-side.
const getLessonsInternal = unstable_cache(
  async (goal: string, search: string, userType: string, studySubject: string = '', studyLevel: string = '') => {
    const randomIds = await getShuffledIds("LESSON", goal, search, userType, studySubject, studyLevel);
    const slicedIds = randomIds.slice(0, 12);

    const items = slicedIds.length > 0 
      ? await prisma.homepageFeed.findMany({ where: { id: { in: slicedIds } } })
      : [];

    // Restore the exact random order
    items.sort((a, b) => slicedIds.indexOf(a.id) - slicedIds.indexOf(b.id));

    return {
      items: items.map(item => ({ ...mapFeedItem(item), type: 'VIDEO_LESSON' })),
      total: randomIds.length
    };
  },
  ["homepage-lessons-cached-v4"],
  { revalidate: 60, tags: ["lessons", "homepage"] }
);

// Server-side: newest lessons only — fast first load. Popular is fetched client-side.
export const getCachedLessons = async (params: any) => {
  return getLessonsInternal(
    params.goal || params.categoryId || '',
    params.search || '',
    params.userType || '',
    params.studySubject || '',
    params.studyLevel || ''
  );
};
