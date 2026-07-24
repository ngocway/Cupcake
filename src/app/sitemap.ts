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
  const [lessons, assignments] = await Promise.all([
    prisma.lesson.findMany({
      where: {
        deletedAt: null,
        isBlocked: false,
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
    }),
    prisma.assignment.findMany({
      where: {
        deletedAt: null,
        isBlocked: false,
        status: "PUBLIC",
        slug: { not: null },
      },
      select: {
        id: true,
        slug: true,
        title: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  // Filter out test/draft lessons by slug pattern and require meaningful title
  const publishedLessons = lessons.filter((l) => {
    if (!l.slug) return false;
    if (isExcludedSlug(l.slug)) return false;
    if (!l.title || l.title.length < 5) return false;
    return true;
  });

  // Filter out test/draft assignments similarly
  const publishedAssignments = assignments.filter((a) => {
    if (!a.slug) return false;
    if (isExcludedSlug(a.slug)) return false;
    if (!a.title || a.title.length < 5) return false;
    return true;
  });

  const lessonUrls: MetadataRoute.Sitemap = publishedLessons.map((l) => ({
    url: `https://dolcake.com/public/lessons/${l.slug ?? l.id}`,
    lastModified: l.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const assignmentUrls: MetadataRoute.Sitemap = publishedAssignments.map((a) => ({
    url: `https://dolcake.com/public/assignments/${a.slug ?? a.id}`,
    lastModified: a.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // Find the most recent update to use as lastModified for static pages
  const allDates = [
    ...publishedLessons.map((l) => l.updatedAt),
    ...publishedAssignments.map((a) => a.updatedAt),
  ];
  const latestUpdate = allDates.length > 0
    ? allDates.reduce((a, b) => (a > b ? a : b))
    : new Date("2026-07-20");

  return [
    {
      url: "https://dolcake.com",
      lastModified: latestUpdate,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: "https://dolcake.com/flashcards",
      lastModified: latestUpdate,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...lessonUrls,
    ...assignmentUrls,
  ];
}
