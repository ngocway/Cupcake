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

      // Age-group filtering removed: all Reading and Grammar content is visible to
      // every user. Level is filtered directly via the canonical `level` field.
      if (studyLevel) {
        where.level = studyLevel;
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

export async function getCachedStudentClasses(userId: string): Promise<{ activeClasses: any[]; pendingRequests: any[] }> {
  // Use Redis cache (TTL 24 hours = 86400s) with active invalidation
  return fetchWithRedis(`student:classes:${userId}`, 86400, async () => {
    try {
      const rows: any[] = await prisma.$queryRawUnsafe(`
        SELECT 
          ce."classId" as "id", 
          ce."status", 
          ce."joinedAt",
          c."id" as "classId",
          c."name" as "className",
          c."thumbnail" as "classThumbnail",
          c."gradeLevel" as "gradeLevel",
          COALESCE(u."name", u."email") as "teacherName",
          u."image" as "teacherAvatar",
          (SELECT COUNT(*)::int FROM "AssignmentClass" ac WHERE ac."classId" = c."id") AS "totalAssignments",
          (
            SELECT COUNT(DISTINCT s."assignmentId")::int
            FROM "Submission" s
            JOIN "AssignmentClass" ac ON s."assignmentId" = ac."assignmentId" AND ac."classId" = c."id"
            WHERE s."studentId" = ce."studentId" AND s."submittedAt" IS NOT NULL
          ) AS "completedAssignments",
          CASE 
            WHEN ce."status" = 'ACTIVE' THEN (
              GREATEST(0, 
                (SELECT COUNT(*)::int FROM "AssignmentClass" ac WHERE ac."classId" = c."id") - 
                (
                  SELECT COUNT(DISTINCT s."assignmentId")::int
                  FROM "Submission" s
                  JOIN "AssignmentClass" ac ON s."assignmentId" = ac."assignmentId" AND ac."classId" = c."id"
                  WHERE s."studentId" = ce."studentId" AND s."submittedAt" IS NOT NULL
                )
              )
            )
            ELSE 0 
          END AS "pendingCount",
          (
            SELECT MIN(ac."dueDate")
            FROM "AssignmentClass" ac
            LEFT JOIN "Submission" s ON s."assignmentId" = ac."assignmentId" AND s."studentId" = ce."studentId" AND s."submittedAt" IS NOT NULL
            WHERE ac."classId" = c."id"
              AND ac."dueDate" > NOW()
              AND s."id" IS NULL
          ) AS "nearestDueDate"
        FROM "ClassEnrollment" ce
        JOIN "Class" c ON ce."classId" = c."id"
        LEFT JOIN "User" u ON c."teacherId" = u."id"
        WHERE ce."studentId" = $1
        ORDER BY ce."joinedAt" DESC
      `, userId);

      const activeClasses: any[] = [];
      const pendingRequests: any[] = [];

      for (const row of rows) {
        const item = {
          id: row.id,
          status: row.status,
          joinedAt: row.joinedAt,
          class: {
            id: row.classId,
            name: row.className,
            thumbnail: row.classThumbnail,
            gradeLevel: row.gradeLevel,
            teacherName: row.teacherName || 'Teacher',
            teacherAvatar: row.teacherAvatar,
            totalAssignments: Number(row.totalAssignments) || 0,
            completedAssignments: Number(row.completedAssignments) || 0,
          },
          pendingCount: Number(row.pendingCount) || 0,
          nearestDueDate: row.nearestDueDate ? new Date(row.nearestDueDate).toISOString() : null,
        };

        if (row.status === 'ACTIVE') {
          activeClasses.push(item);
        } else if (row.status === 'PENDING') {
          pendingRequests.push(item);
        }
      }

      return { activeClasses, pendingRequests };
    } catch (err) {
      console.error("[getCachedStudentClasses] Error fetching student classes:", err);
      return { activeClasses: [], pendingRequests: [] };
    }
  });
}

export type PublicClassItemType = {
  id: string;
  title: string;
  description: string;
  gradeLevel: string | null;
  subjectBadge: string;
  subjectBadgeClass: string;
  typeBadge: string;
  typeBadgeClass: string;
  thumbnail: string;
  rating: number;
  reviewsCount: number;
  studentsCount: string;
  lessonsCount: number;
  btnGradient: string;
  teacher: {
    name: string;
    avatar: string;
    role: string;
  };
};

export async function getCachedPublicClasses(): Promise<PublicClassItemType[]> {
  return fetchWithRedis('public:classes:catalog:v2', 3600, async () => {
    try {
      const classes = await prisma.class.findMany({
        where: {
          deletedAt: null,
          isBlocked: false,
          isJoinable: true,
        },
        include: {
          teacher: {
            select: {
              name: true,
              image: true,
              email: true,
              professionalTitle: true,
            },
          },
          _count: {
            select: {
              enrollments: true,
              assignments: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 20,
      });

      const palettes = [
        {
          subjectBadgeClass: 'bg-[#dcfce7] text-[#15803d] border-[#86efac]',
          typeBadgeClass: 'bg-[#fef3c7] text-[#b45309] border-[#fde68a]',
          typeBadge: '🔥 Miễn phí',
          btnGradient: 'from-[#06b6d4] to-[#0ea5e9] hover:from-[#0891b2] hover:to-[#0284c7] shadow-cyan-500/25',
          fallbackThumb: '/assests/Classes/thumbnails/class-thumb-neutral-default.jpg',
        },
        {
          subjectBadgeClass: 'bg-[#ffedd5] text-[#c2410c] border-[#fdba74]',
          typeBadgeClass: 'bg-[#fee2e2] text-[#b91c1c] border-[#fca5a5]',
          typeBadge: '🔥 Hot',
          btnGradient: 'from-[#f97316] to-[#f43f5e] hover:from-[#ea580c] hover:to-[#e11d48] shadow-rose-500/25',
          fallbackThumb: '/assests/Classes/thumbnails/class-thumb-neutral-default.jpg',
        },
        {
          subjectBadgeClass: 'bg-[#ede9fe] text-[#6d28d9] border-[#c4b5fd]',
          typeBadgeClass: 'bg-[#fef3c7] text-[#b45309] border-[#fde68a]',
          typeBadge: '🔥 Mới mở',
          btnGradient: 'from-[#8b5cf6] to-[#6366f1] hover:from-[#7c3aed] hover:to-[#4f46e5] shadow-indigo-500/25',
          fallbackThumb: '/assests/Classes/thumbnails/class-thumb-neutral-default.jpg',
        },
      ];

      return classes.map((c, index) => {
        const palette = palettes[index % palettes.length];
        const grade = c.gradeLevel ? `Lớp ${c.gradeLevel}` : 'Tiểu học';
        const teacherName = c.teacher?.name || 'Giáo viên Dolcake';
        const teacherAvatar = c.teacher?.image || '/assests/Classes/avatars/teacher-avatar-ms-jessica.png';

        return {
          id: c.id,
          title: c.name,
          description: c.description || `Lớp học tiếng Anh ${grade} tương tác sinh động cùng giáo viên ${teacherName}.`,
          gradeLevel: c.gradeLevel,
          subjectBadge: `English • ${grade}`,
          subjectBadgeClass: palette.subjectBadgeClass,
          typeBadge: palette.typeBadge,
          typeBadgeClass: palette.typeBadgeClass,
          thumbnail: c.thumbnail || palette.fallbackThumb,
          rating: 5.0,
          reviewsCount: Math.max(12, (c._count.enrollments || 0) * 3 + 6),
          studentsCount: `${Math.max(15, c._count.enrollments || 0)}+ học viên`,
          lessonsCount: Math.max(8, c._count.assignments || 0),
          btnGradient: palette.btnGradient,
          teacher: {
            name: teacherName,
            avatar: teacherAvatar,
            role: c.teacher?.professionalTitle || 'Giáo viên chủ nhiệm',
          },
        };
      });
    } catch (err) {
      console.error('[getCachedPublicClasses] Error:', err);
      return [];
    }
  });
}

export async function invalidatePublicClassesCache() {
  try {
    await redis.del('public:classes:catalog:v2');
  } catch (e) {
    console.warn("[invalidatePublicClassesCache] Failed to delete cache:", e);
  }
}

export async function invalidateStudentClassesCache(userId: string) {
  try {
    await redis.del(`student:classes:${userId}`);
  } catch (e) {
    console.warn("[invalidateStudentClassesCache] Failed to delete cache for:", userId, e);
  }
}

export async function invalidateStudentClassDetailCache(classId: string, studentId?: string) {
  try {
    if (studentId) {
      await redis.del(`student:class-detail:${studentId}:${classId}`);
    } else {
      const enrollments = await prisma.classEnrollment.findMany({
        where: { classId },
        select: { studentId: true }
      });
      const keys = enrollments.map(e => `student:class-detail:${e.studentId}:${classId}`);
      if (keys.length > 0) {
        await Promise.all(keys.map(k => redis.del(k)));
      }
      try {
        const scannedKeys = await redis.keys(`student:class-detail:*:${classId}`);
        if (scannedKeys.length > 0) {
          await Promise.all(scannedKeys.map(k => redis.del(k)));
        }
      } catch {}
    }
  } catch (e) {
    console.warn("[invalidateStudentClassDetailCache] Failed to invalidate cache for class:", classId, e);
  }
}

