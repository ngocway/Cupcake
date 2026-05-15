
import prisma from "@/lib/prisma";

export async function syncToHomepageFeed(sourceId: string, type: "EXERCISE" | "LESSON") {
  try {
    if (type === "EXERCISE") {
      const ass = await prisma.assignment.findUnique({
        where: { id: sourceId },
        include: { 
          teacher: true, 
          categories: true,
          lesson: true,
          _count: { select: { reviews: true } }
        }
      });

      if (!ass || ass.deletedAt || ass.status !== "PUBLIC" || ass.lesson) {
        await prisma.homepageFeed.deleteMany({ where: { sourceId } });
        return;
      }

      await prisma.homepageFeed.upsert({
        where: { sourceId },
        update: {
          title: ass.title,
          slug: ass.slug || '',
          thumbnail: ass.thumbnail ?? undefined,
          videoUrl: ass.videoUrl ?? undefined,
          audioUrl: ass.audioUrl ?? undefined,
          materialType: ass.materialType,
          teacherName: ass.teacher.name || "Teacher",
          teacherImage: ass.teacher.image ?? undefined,
          viewCount: ass.viewCount,
          reviewCount: ass._count.reviews,
          categoryId: ass.categories[0]?.id ?? undefined,
          status: ass.status,
          updatedAt: new Date()
        },
        create: {
          sourceId,
          contentType: "EXERCISE",
          title: ass.title,
          slug: ass.slug || '',
          thumbnail: ass.thumbnail ?? undefined,
          videoUrl: ass.videoUrl ?? undefined,
          audioUrl: ass.audioUrl ?? undefined,
          materialType: ass.materialType,
          teacherId: ass.teacherId,
          teacherName: ass.teacher.name || "Teacher",
          teacherImage: ass.teacher.image ?? undefined,
          viewCount: ass.viewCount,
          reviewCount: ass._count.reviews,
          categoryId: ass.categories[0]?.id ?? undefined,
          status: ass.status,
          createdAt: ass.createdAt
        }
      });
    } else {
      const lesson = await prisma.lesson.findUnique({
        where: { id: sourceId },
        include: { 
          teacher: true, 
          categories: true,
          _count: { select: { reviews: true } }
        }
      });

      if (!lesson || lesson.deletedAt || lesson.isBlocked || lesson.isPremium) {
        await prisma.homepageFeed.deleteMany({ where: { sourceId } });
        return;
      }

      await prisma.homepageFeed.upsert({
        where: { sourceId },
        update: {
          title: lesson.title,
          slug: lesson.slug || '',
          thumbnail: lesson.thumbnail ?? undefined,
          videoUrl: lesson.videoUrl ?? undefined,
          audioUrl: lesson.audioUrl ?? undefined,
          materialType: lesson.materialType,
          teacherName: lesson.teacher.name || "Teacher",
          teacherImage: lesson.teacher.image ?? undefined,
          viewCount: lesson.viewsCount,
          reviewCount: lesson._count.reviews,
          categoryId: lesson.categories[0]?.id ?? undefined,
          updatedAt: new Date()
        },
        create: {
          sourceId,
          contentType: "LESSON",
          title: lesson.title,
          slug: lesson.slug || '',
          thumbnail: lesson.thumbnail ?? undefined,
          videoUrl: lesson.videoUrl ?? undefined,
          audioUrl: lesson.audioUrl ?? undefined,
          materialType: lesson.materialType,
          teacherId: lesson.teacherId,
          teacherName: lesson.teacher.name || "Teacher",
          teacherImage: lesson.teacher.image ?? undefined,
          viewCount: lesson.viewsCount,
          reviewCount: lesson._count.reviews,
          categoryId: lesson.categories[0]?.id ?? undefined,
          createdAt: lesson.createdAt
        }
      });
    }
    console.log(`[FeedSync] Successfully synced ${type} ${sourceId}`);
  } catch (error) {
    console.error(`[FeedSync] Error syncing ${type} ${sourceId}:`, error);
  }
}

export async function removeFromHomepageFeed(sourceId: string) {
  await prisma.homepageFeed.deleteMany({ where: { sourceId } });
}
