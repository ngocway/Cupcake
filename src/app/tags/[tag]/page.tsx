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
      <div className="w-full pt-28 pb-20 px-6 md:px-10 max-w-[1600px] mx-auto min-h-screen">
        {/* Header Hero Section */}
        <div className="relative mb-12 p-8 md:p-12 rounded-[2.5rem] overflow-hidden bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-primary/10 shadow-2xl shadow-primary/5 text-center">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl pointer-events-none translate-y-1/2 -translate-x-1/3" />

          <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 border border-primary/20">
              <span className="material-symbols-outlined !text-[14px]">tag</span>
              Explore Topic
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight lowercase italic">
              #{tag}
            </h1>
            <p className="text-sm md:text-base font-semibold text-slate-500 dark:text-slate-400">
              Found <span className="text-primary font-black">{mappedLessons.length}</span> lessons and{" "}
              <span className="text-secondary font-black">{assignments.length}</span> assignments related to this topic.
            </p>
          </div>
        </div>

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
