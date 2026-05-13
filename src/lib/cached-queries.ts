
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

export const getCachedAssignments = unstable_cache(
  async (params: any) => {
    const { categoryId, search, sort = "newest" } = params;
    
    // ULTRA-FAST QUERY: Read only from HomepageFeed
    // Zero Joins, Zero Counts.
    const where: any = { 
      status: "PUBLIC", 
      contentType: "EXERCISE" 
    };
    
    if (categoryId) where.categoryId = categoryId;
    if (search) where.title = { contains: search, mode: 'insensitive' };
    
    const orderBy: any = sort === "popular" ? { viewCount: "desc" } : { createdAt: "desc" };

    const items = await prisma.homepageFeed.findMany({
      where,
      orderBy,
      take: 12
    });

    return {
      items: items.map(item => ({
        ...item,
        id: item.sourceId, // Keep source ID for frontend compatibility
        teacher: {
          id: item.teacherId,
          name: item.teacherName,
          image: item.teacherImage
        },
        _count: { reviews: item.reviewCount }
      })),
      total: items.length
    };
  },
  ["home-assignments-v3"],
  { revalidate: 300, tags: ["assignments", "home-feed"] }
);

export const getCachedLessons = unstable_cache(
  async (params: any) => {
    const { categoryId, search, sort = "newest" } = params;
    
    const where: any = { 
      status: "PUBLIC", 
      contentType: "LESSON" 
    };
    
    if (categoryId) where.categoryId = categoryId;
    if (search) where.title = { contains: search, mode: 'insensitive' };
    
    const orderBy: any = sort === "popular" ? { viewCount: "desc" } : { createdAt: "desc" };

    const items = await prisma.homepageFeed.findMany({
      where,
      orderBy,
      take: 12
    });

    return {
      items: items.map(item => ({
        ...item,
        id: item.sourceId,
        teacher: {
          id: item.teacherId,
          name: item.teacherName,
          image: item.teacherImage
        },
        _count: { reviews: item.reviewCount },
        type: 'VIDEO_LESSON'
      })),
      total: items.length
    };
  },
  ["home-lessons-v3"],
  { revalidate: 300, tags: ["assignments", "lessons", "home-feed"] }
);
