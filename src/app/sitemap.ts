import { MetadataRoute } from "next";
import prisma from "@/lib/prisma";

// Slug patterns that indicate test/draft/demo content – exclude from sitemap
const EXCLUDED_SLUG_PATTERNS = [
  /^bai-hoc-moi/,        // "bài học mới" test lessons
  /^bai-tap-moi/,        // "bài tập mới" test exercises
  /demo/i,               // demo content
  /ban-sao$/,            // "bản sao" = copies
  /test/i,               // test content
];

function isExcludedSlug(slug: string): boolean {
  return EXCLUDED_SLUG_PATTERNS.some((pattern) => pattern.test(slug));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lessons = await prisma.lesson.findMany({
    where: {
      deletedAt: null,
      isBlocked: false,
      // Only include lessons with a proper slug
      slug: { not: null },
    },
    select: {
      id: true,
      slug: true,
      title: true,
      updatedAt: true,
      thumbnail: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  // Filter out test/draft lessons by slug pattern and require meaningful title
  const publishedLessons = lessons.filter((l) => {
    if (!l.slug) return false;
    if (isExcludedSlug(l.slug)) return false;
    // Title should be at least 5 chars and not look like a placeholder
    if (!l.title || l.title.length < 5) return false;
    return true;
  });

  const lessonUrls: MetadataRoute.Sitemap = publishedLessons.map((l) => ({
    url: `https://dolcake.com/public/lessons/${l.slug ?? l.id}`,
    lastModified: l.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Find the most recent lesson update to use as lastModified for static pages
  const latestLessonUpdate = publishedLessons.length > 0
    ? publishedLessons[0].updatedAt
    : new Date("2026-07-20");

  return [
    {
      url: "https://dolcake.com",
      lastModified: latestLessonUpdate,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: "https://dolcake.com/flashcards",
      lastModified: latestLessonUpdate,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...lessonUrls,
  ];
}
