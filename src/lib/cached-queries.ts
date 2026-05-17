
import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export const getCachedCategoryTree = unstable_cache(
  async () => {
    const allCategories = await prisma.category.findMany({
      where: { isHidden: false },
      orderBy: { orderIndex: 'asc' }
    });

    const buildTree = (parentId: string | null = null): any[] => {
      return allCategories
        .filter(c => c.parentId === parentId)
        .map(c => ({
          ...c,
          children: buildTree(c.id)
        }));
    };

    return buildTree(null);
  },
  ["category-tree-flat"],
  { revalidate: 3600, tags: ["categories"] }
);

export const getCachedTags = unstable_cache(
  async () => {
    const rawTags = await prisma.assignment.findMany({
      where: { status: "PUBLIC", deletedAt: null, tags: { not: { equals: "" } } },
      select: { tags: true },
      take: 200
    });

    const allTags = [...new Set(
      rawTags.flatMap(a => (a.tags || "").split(",").map((t: string) => t.trim()).filter(Boolean))
    )].sort();

    return allTags;
  },
  ["public-tags"],
  { revalidate: 1800, tags: ["assignments", "tags"] }
);

// ─── Shared mapper ────────────────────────────────────────────────────────────

function mapFeedItem(item: any) {
  return {
    ...item,
    id: item.sourceId,
    teacher: {
      id: item.teacherId,
      name: item.teacherName,
      image: item.teacherImage
    },
    _count: { reviews: item.reviewCount }
  };
}

// ─── EXERCISES (newest) ───────────────────────────────────────────────────────

/** Server-side: newest exercises only — fast first load. Popular is fetched client-side. */
export const getCachedAssignments = (params: any) => unstable_cache(
  async () => {
    const { categoryId, search, userType } = params;

    const where: any = { status: "PUBLIC", contentType: "EXERCISE" };
    if (categoryId) where.categoryId = categoryId;
    if (search) where.title = { contains: search, mode: 'insensitive' };
    if (userType) {
      where.OR = [
        { targetAudiences: { has: userType } },
        { targetAudiences: { equals: [] } }
      ];
    }

    const items = await prisma.homepageFeed.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 12
    });

    return { items: items.map(mapFeedItem), total: items.length };
  },
  ["home-assignments-newest-v4", JSON.stringify(params)],
  { revalidate: 300, tags: ["assignments", "home-feed"] }
)();

// ─── LESSONS (newest) ─────────────────────────────────────────────────────────

/** Server-side: newest lessons only — fast first load. Popular is fetched client-side. */
export const getCachedLessons = (params: any) => unstable_cache(
  async () => {
    const { categoryId, search, userType } = params;

    const where: any = { status: "PUBLIC", contentType: "LESSON" };
    if (categoryId) where.categoryId = categoryId;
    if (search) where.title = { contains: search, mode: 'insensitive' };
    if (userType) {
      where.OR = [
        { targetAudiences: { has: userType } },
        { targetAudiences: { equals: [] } }
      ];
    }

    const items = await prisma.homepageFeed.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 12
    });

    return {
      items: items.map(item => ({ ...mapFeedItem(item), type: 'VIDEO_LESSON' })),
      total: items.length
    };
  },
  ["home-lessons-newest-v4", JSON.stringify(params)],
  { revalidate: 300, tags: ["assignments", "lessons", "home-feed"] }
)();
