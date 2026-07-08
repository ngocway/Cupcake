import { MetadataRoute } from "next";
import prisma from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lessons = await prisma.lesson.findMany({
    select: { id: true, slug: true, updatedAt: true },
  });

  const lessonUrls: MetadataRoute.Sitemap = lessons.map((l) => ({
    url: `https://dolcake.com/public/lessons/${l.slug ?? l.id}`,
    lastModified: l.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    {
      url: "https://dolcake.com",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: "https://dolcake.com/flashcards",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...lessonUrls,
  ];
}
