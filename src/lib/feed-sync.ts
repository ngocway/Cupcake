import prisma from "@/lib/prisma";
import { revalidateTag } from "next/cache";

export async function syncToHomepageFeed(sourceId: string, type: "EXERCISE" | "LESSON") {
  try {
    if (type === "EXERCISE") {
      const ass = await prisma.assignment.findUnique({
        where: { id: sourceId },
        include: { 
          teacher: true, 
          lesson: true,
          _count: { select: { reviews: true, questions: true } }
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
          slug: ass.slug || sourceId,
          thumbnail: ass.thumbnail ?? undefined,
          videoUrl: ass.videoUrl ?? undefined,
          audioUrl: ass.audioUrl ?? undefined,
          materialType: ass.materialType,
          teacherName: ass.teacher.name || "Teacher",
          teacherImage: ass.teacher.image ?? undefined,
          viewCount: ass.viewCount,
          reviewCount: ass._count.reviews,
          questionCount: ass._count.questions,
          status: ass.status,
          targetAudiences: ass.targetAudiences,
          learningGoals: ass.learningGoals,
          level: ass.level,
          audienceLevels: ass.audienceLevels as any,
          subject: ass.subject,
          tags: ass.tags ? ass.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
          updatedAt: new Date()
        },
        create: {
          sourceId,
          contentType: "EXERCISE",
          title: ass.title,
          slug: ass.slug || sourceId,
          thumbnail: ass.thumbnail ?? undefined,
          videoUrl: ass.videoUrl ?? undefined,
          audioUrl: ass.audioUrl ?? undefined,
          materialType: ass.materialType,
          teacherId: ass.teacherId,
          teacherName: ass.teacher.name || "Teacher",
          teacherImage: ass.teacher.image ?? undefined,
          viewCount: ass.viewCount,
          reviewCount: ass._count.reviews,
          questionCount: ass._count.questions,
          status: ass.status,
          targetAudiences: ass.targetAudiences,
          learningGoals: ass.learningGoals,
          level: ass.level,
          audienceLevels: ass.audienceLevels as any,
          subject: ass.subject,
          tags: ass.tags ? ass.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
          createdAt: ass.createdAt
        }
      });
    } else {
      const lesson = await prisma.lesson.findUnique({
        where: { id: sourceId },
        include: { 
          teacher: true, 
          assignment: { select: { tags: true, status: true, subject: true, thumbnail: true } },
          _count: { select: { reviews: true } }
        }
      });

      if (!lesson || lesson.deletedAt || lesson.isBlocked || lesson.isPremium || !lesson.assignment || lesson.assignment.status !== 'PUBLIC') {
        await prisma.homepageFeed.deleteMany({ where: { sourceId } });
        return;
      }

      await prisma.homepageFeed.upsert({
        where: { sourceId },
        update: {
          title: lesson.title,
          slug: lesson.slug || sourceId,
          thumbnail: lesson.assignment?.thumbnail ?? undefined,
          videoUrl: lesson.videoUrl ?? undefined,
          audioUrl: lesson.audioUrl ?? undefined,
          materialType: lesson.materialType,
          teacherName: lesson.teacher.name || "Teacher",
          teacherImage: lesson.teacher.image ?? undefined,
          viewCount: lesson.viewsCount,
          reviewCount: lesson._count.reviews,
          status: lesson.assignment.status,
          targetAudiences: lesson.targetAudiences,
          learningGoals: lesson.learningGoals,
          level: lesson.level,
          audienceLevels: lesson.audienceLevels as any,
          subject: lesson.assignment?.subject || null,
          tags: lesson.assignment?.tags ? lesson.assignment.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
          updatedAt: new Date()
        },
        create: {
          sourceId,
          contentType: "LESSON",
          title: lesson.title,
          slug: lesson.slug || sourceId,
          thumbnail: lesson.assignment?.thumbnail ?? undefined,
          videoUrl: lesson.videoUrl ?? undefined,
          audioUrl: lesson.audioUrl ?? undefined,
          materialType: lesson.materialType,
          teacherId: lesson.teacherId,
          teacherName: lesson.teacher.name || "Teacher",
          teacherImage: lesson.teacher.image ?? undefined,
          viewCount: lesson.viewsCount,
          reviewCount: lesson._count.reviews,
          status: lesson.assignment.status,
          targetAudiences: lesson.targetAudiences,
          learningGoals: lesson.learningGoals,
          level: lesson.level,
          audienceLevels: lesson.audienceLevels as any,
          subject: lesson.assignment?.subject || null,
          tags: lesson.assignment?.tags ? lesson.assignment.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
          createdAt: lesson.createdAt
        }
      });
    }
    console.log(`[FeedSync] Successfully synced ${type} ${sourceId}`);
    try {
      revalidateTag("home-feed", {});
      revalidateTag("assignments", {});
      revalidateTag("lessons", {});
    } catch (e) {
      console.log("[FeedSync] Failed to revalidate tags:", e);
    }
  } catch (error) {
    console.error(`[FeedSync] Error syncing ${type} ${sourceId}:`, error);
  }
}

export async function removeFromHomepageFeed(sourceId: string) {
  await prisma.homepageFeed.deleteMany({ where: { sourceId } });
}
