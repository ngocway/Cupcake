
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
  ["category-tree-flat-v2"],
  { revalidate: 3600, tags: ["categories"] }
);

export const getCategoryAndDescendantIds = unstable_cache(
  async (categoryId: string): Promise<string[]> => {
    const allCategories = await prisma.category.findMany({
      select: { id: true, parentId: true }
    });

    const ids = [categoryId];
    const queue = [categoryId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const children = allCategories.filter(c => c.parentId === current).map(c => c.id);
      for (const childId of children) {
        if (!ids.includes(childId)) {
          ids.push(childId);
          queue.push(childId);
        }
      }
    }

    return ids;
  },
  ["category-descendants"],
  { revalidate: 3600, tags: ["categories"] }
);

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
  async (contentType: "EXERCISE" | "LESSON", categoryId: string, search: string, userType: string) => {
    const where: any = { status: "PUBLIC", contentType };

    if (categoryId) {
      const categoryIds = await getCategoryAndDescendantIds(categoryId);
      where.OR = categoryIds.map(id => ({
        categoryId: { contains: id }
      }));
    }
    if (search) where.title = { contains: search, mode: 'insensitive' };
    if (userType) {
      const defaultOR = [
        { targetAudiences: { has: userType } },
        { targetAudiences: { equals: [] } }
      ];
      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          { OR: defaultOR }
        ];
        delete where.OR;
      } else {
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
  ["homepage-shuffled-ids"],
  { revalidate: 600, tags: ["homepage", "shuffled"] }
);

// Server-side: newest exercises only — fast first load. Popular is fetched client-side.
const getAssignmentsInternal = unstable_cache(
  async (categoryId: string, search: string, userType: string) => {
    const randomIds = await getShuffledIds("EXERCISE", categoryId, search, userType);
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
  ["homepage-assignments-cached"],
  { revalidate: 60, tags: ["assignments", "homepage"] }
);

// Server-side: newest exercises only — fast first load. Popular is fetched client-side.
export const getCachedAssignments = async (params: any) => {
  return getAssignmentsInternal(params.categoryId || '', params.search || '', params.userType || '');
};

// ─── LESSONS (newest) ─────────────────────────────────────────────────────────

// Server-side: newest lessons only — fast first load. Popular is fetched client-side.
const getLessonsInternal = unstable_cache(
  async (categoryId: string, search: string, userType: string) => {
    const randomIds = await getShuffledIds("LESSON", categoryId, search, userType);
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
  ["homepage-lessons-cached"],
  { revalidate: 60, tags: ["lessons", "homepage"] }
);

// Server-side: newest lessons only — fast first load. Popular is fetched client-side.
export const getCachedLessons = async (params: any) => {
  return getLessonsInternal(params.categoryId || '', params.search || '', params.userType || '');
};
