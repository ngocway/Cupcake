import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { redis } from "@/lib/redis";

export async function fetchWithRedis<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T> {
  try {
    const cached = await redis.get(key);
    if (cached !== null && cached !== undefined && cached !== 'null' && cached !== 'undefined') {
      console.log(`[REDIS HIT] ${key}`);
      return JSON.parse(cached);
    }
  } catch (e) {
    console.warn("Redis GET failed for key:", key, e);
  }

  console.log(`[REDIS MISS] ${key} - Fetching from DB...`);
  const data = await fetcher();

  // Only cache non-null results to avoid stale null entries
  if (data !== null && data !== undefined) {
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(data));
    } catch (e) {
      console.warn("Redis SET failed for key:", key, e);
    }
  }

  return data;
}

export const getCachedTags = unstable_cache(
  async () => {
    return fetchWithRedis("feed:public-tags", 1800, async () => {
      const popularDbTags = await prisma.tag.findMany({
        where: { isPopular: true },
        select: { name: true },
        orderBy: { name: "asc" }
      });
      return popularDbTags.map(t => t.name);
    });
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
    rawUserType: string,
    studySubject?: string,
    studyLevel?: string
  ) => {
    const userType = rawUserType === "adults" ? "learner" : rawUserType;
    const cacheKey = `feed:shuffledIds:v2:${contentType}:${goal}:${search}:${userType}:${studySubject}:${studyLevel}`;
    return fetchWithRedis(cacheKey, 600, async () => {
      const where: any = { status: "PUBLIC", contentType };

      if (goal) {
        where.learningGoals = { has: goal };
      }
      if (search) where.title = { contains: search, mode: 'insensitive' };

      if (studySubject) {
        where.subject = studySubject;
      }

      // We no longer filter out Part 2-5 here because we will fetch all parts
      // and randomly choose one part per base title group below.

      if (userType) {
        if (studyLevel) {
          const mappedLevels = [studyLevel];
          if (studyLevel === 'pre-a1-a1') mappedLevels.push('beginner');
          else if (studyLevel === 'a2') mappedLevels.push('elementary');
          else if (studyLevel === 'b1') mappedLevels.push('intermediate');
          else if (studyLevel === 'b2') mappedLevels.push('upper-intermediate');

          where.targetAudiences = { has: userType };
          where.OR = mappedLevels.map(lvl => ({
            audienceLevels: { path: [userType], equals: lvl }
          }));
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
        select: { id: true, title: true }
      });

      let selectedIds: string[] = [];

      if (contentType === "EXERCISE") {
        // Group exercises by base title (ignoring "Part <Number>" suffix)
        const groups: Record<string, { id: string; title: string }[]> = {};
        for (const row of idRows) {
          const baseTitle = row.title.replace(/\s*\.?\s*Part\s+\d+/i, '').trim().toLowerCase();
          if (!groups[baseTitle]) {
            groups[baseTitle] = [];
          }
          groups[baseTitle].push(row);
        }

        // For each base title group, randomly select exactly one part to display
        for (const baseTitle of Object.keys(groups)) {
          const group = groups[baseTitle];
          const randomIndex = Math.floor(Math.random() * group.length);
          selectedIds.push(group[randomIndex].id);
        }
      } else {
        selectedIds = idRows.map(row => row.id);
      }

      const randomIds = selectedIds.sort(() => 0.5 - Math.random());

      return randomIds;
    });
  },
  ["homepage-shuffled-ids-v5"],
  { revalidate: 600, tags: ["homepage", "shuffled"] }
);

// Server-side: newest exercises only — fast first load. Popular is fetched client-side.
const getAssignmentsInternal = unstable_cache(
  async (goal: string, search: string, rawUserType: string, studySubject: string = '', studyLevel: string = '') => {
    const userType = rawUserType === "adults" ? "learner" : rawUserType;
    const cacheKey = `feed:assignments:v2:${goal}:${search}:${userType}:${studySubject}:${studyLevel}`;
    return fetchWithRedis(cacheKey, 300, async () => {
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
    });
  },
  ["homepage-assignments-cached-v5"],
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
  async (goal: string, search: string, rawUserType: string, studySubject: string = '', studyLevel: string = '') => {
    const userType = rawUserType === "adults" ? "learner" : rawUserType;
    const cacheKey = `feed:lessons:v2:${goal}:${search}:${userType}:${studySubject}:${studyLevel}`;
    return fetchWithRedis(cacheKey, 300, async () => {
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
    });
  },
  ["homepage-lessons-cached-v5"],
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

export async function invalidateMaterialCache(assignmentId: string) {
  try {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { lesson: true }
    });

    if (!assignment) return;

    const keysToDelete = new Set<string>([
      `assignment:questions:${assignment.id}`,
      `assignment:meta:${assignment.id}`,
      `assignment:instructions:${assignment.id}`,
      `assignment:teacher:${assignment.id}`,
      `assignment:related:v2:${assignment.id}`,
      `assignment:public:${assignment.id}`,
      `assignment:question-translations:${assignment.id}`,
      `assignment:translations:${assignment.id}`
    ]);

    if (assignment.slug) {
      keysToDelete.add(`assignment:meta:${assignment.slug}`);
      keysToDelete.add(`assignment:instructions:${assignment.slug}`);
      keysToDelete.add(`assignment:teacher:${assignment.slug}`);
      keysToDelete.add(`assignment:related:v2:${assignment.slug}`);
      keysToDelete.add(`assignment:public:${assignment.slug}`);
    }

    if (assignment.lesson) {
      const lesson = assignment.lesson;
      keysToDelete.add(`lesson:basic:${lesson.id}`);
      keysToDelete.add(`lesson:extra:${lesson.id}`);
      keysToDelete.add(`lesson:related:${lesson.id}`);
      if (lesson.slug) {
        keysToDelete.add(`lesson:basic:${lesson.slug}`);
        keysToDelete.add(`lesson:extra:${lesson.slug}`);
        keysToDelete.add(`lesson:related:${lesson.slug}`);
      }
    }

    const keys = Array.from(keysToDelete);
    await Promise.all(keys.map(key => redis.del(key)));
    
    // Invalidate feed caches
    try {
      const feedKeys = await redis.keys("feed:*");
      if (feedKeys.length > 0) {
        await Promise.all(feedKeys.map(k => redis.del(k)));
        console.log(`[Cache Invalidation] Successfully deleted feed keys:`, feedKeys);
      }
    } catch (e) {
      console.error("[Cache Invalidation] Failed to scan/delete feed:* keys:", e);
    }

    console.log(`[Cache Invalidation] Successfully deleted keys:`, keys);
  } catch (e) {
    console.error(`[Cache Invalidation] Error invalidating cache for assignment ${assignmentId}:`, e);
  }
}

