import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { HomeShell } from "@/app/_components/HomeShell";
import { TagTabsClient } from "./TagTabsClient";

export default async function TagPage({
  params
}: {
  params: Promise<{ tag: string }>
}) {
  const { tag: tagRaw } = await params;
  const tag = decodeURIComponent(tagRaw);

  const session = await auth();
  const isLoggedIn = !!session?.user;

  // 1. Fetch Lessons that have an assignment with the target tag
  const lessons = await prisma.lesson.findMany({
    where: {
      assignment: {
        status: isLoggedIn ? { in: ["PUBLIC", "PRIVATE"] as any } : "PUBLIC",
        tags: { contains: tag, mode: 'insensitive' }
      },
      isBlocked: false,
      deletedAt: null
    },
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
          image: true
        }
      },
      assignment: {
        select: {
          thumbnail: true,
          status: true,
          tags: true,
          targetAudiences: true,
          viewCount: true,
          videoUrl: true,
          audioUrl: true
        }
      },
      _count: {
        select: {
          reviews: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // 2. Fetch Assignments containing the tag that do NOT belong to any lesson
  const assignments = await prisma.assignment.findMany({
    where: {
      status: isLoggedIn ? { in: ["PUBLIC", "PRIVATE"] as any } : "PUBLIC",
      tags: { contains: tag, mode: 'insensitive' },
      lesson: null,
      deletedAt: null,
      isBlocked: false
    },
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
          image: true
        }
      },
      _count: {
        select: {
          questions: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Map lessons to match what LessonCard expects (particularly the tags property)
  const mappedLessons = lessons.map(lesson => ({
    ...lesson,
    tags: lesson.assignment?.tags || "",
    viewCount: lesson.viewsCount
  }));

  return (
    <HomeShell>
      <div className="w-full pt-40 pb-20 px-6 md:px-10 max-w-[1600px] mx-auto min-h-screen">
        {/* Tab contents (Client Component for interactive switcher) */}
        <TagTabsClient 
          initialLessons={mappedLessons} 
          initialAssignments={assignments} 
          isLoggedIn={isLoggedIn}
          tagName={tag}
        />
      </div>
    </HomeShell>
  );
}
