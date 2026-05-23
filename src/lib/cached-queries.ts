
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

export async function getCategoryAndDescendantIds(categoryId: string): Promise<string[]> {
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
}

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
    teacher: {
      id: item.teacherId,
      name: item.teacherName,
      image: item.teacherImage
    },
    _count: { reviews: item.reviewCount }
  };
}

// Server-side: newest exercises only — fast first load. Popular is fetched client-side.
export const getCachedAssignments = async (params: any) => {
  const { categoryId, search, userType } = params;

  const where: any = { status: "PUBLIC", contentType: "EXERCISE" };

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
      // If we already have categoryId filters in where.OR, we combine them
      where.AND = [
        { OR: where.OR },
        { OR: defaultOR }
      ];
      delete where.OR;
    } else {
      where.OR = defaultOR;
    }
  }

  const items = await prisma.homepageFeed.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 12
  });

  return { items: items.map(mapFeedItem), total: items.length };
};

// ─── LESSONS (newest) ─────────────────────────────────────────────────────────

// Server-side: newest lessons only — fast first load. Popular is fetched client-side.
export const getCachedLessons = async (params: any) => {
  const { categoryId, search, userType } = params;

  const where: any = { status: "PUBLIC", contentType: "LESSON" };
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

  const items = await prisma.homepageFeed.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 12
  });

  return {
    items: items.map(item => ({ ...mapFeedItem(item), type: 'VIDEO_LESSON' })),
    total: items.length
  };
};
