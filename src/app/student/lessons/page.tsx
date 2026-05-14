import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import LessonsPageContent from "./_components/LessonsPageContent";
import { Play, Video } from "lucide-react";

export default async function StudentLessonsPage({
  searchParams
}: {
  searchParams: Promise<{ source?: string }>
}) {
  const { source = "public" } = await searchParams;
  const session = await auth();
  
  if (!session || session.user?.role !== "STUDENT") {
    redirect("/student/login");
  }

  const userId = session.user.id;

  // 1-3. Parallel Fetching to avoid waterfalls
  const [enrollments, progressRaw, userFavorites] = await Promise.all([
    prisma.classEnrollment.findMany({
      where: { studentId: userId },
      include: { class: { include: { teacher: true } } }
    }),
    prisma.lessonProgress.findMany({
      where: { studentId: userId }
    }),
    (prisma as any).favoriteLesson.findMany({
      where: { studentId: userId },
      select: { lessonId: true }
    }).catch(() => [])
  ]);

  const classIds = enrollments.map(e => e.classId);
  const favoriteIds = new Set(userFavorites.map((f: any) => f.lessonId));

  const progressMap = new Map();
  progressRaw.forEach(p => {
    // Keep the one with completedAt if multiple exist
    const existing = progressMap.get(p.lessonId);
    if (!existing || (!existing.completedAt && p.completedAt)) {
      progressMap.set(p.lessonId, p);
    }
  });

  // 4. Fetch Lessons based on source
  let lessonsRaw;
  if (source === "class") {
    lessonsRaw = await prisma.lesson.findMany({
      where: {
        targetClasses: { some: { classId: { in: classIds } } },
        deletedAt: null
      },
      include: {
        teacher: { select: { name: true } },
        targetClasses: {
          where: { classId: { in: classIds } },
          include: { class: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  } else {
    lessonsRaw = await prisma.lesson.findMany({
      where: {
        OR: [
          { isPremium: false },
          { isEditorChoice: true }
        ],
        deletedAt: null
      },
      include: {
        teacher: { select: { name: true } }
      },
      take: 40,
      orderBy: { viewsCount: 'desc' }
    });
  }

  const lessons = lessonsRaw.map(l => {
    const progress = progressMap.get(l.id);
    let status: "PENDING" | "COMPLETED" | "IN_PROGRESS" = "PENDING";
    if (progress) {
      status = progress.completedAt ? "COMPLETED" : "IN_PROGRESS";
    }

    return {
      id: l.id,
      slug: l.slug,
      title: l.title,
      description: l.description,
      videoUrl: l.videoUrl,
      teacherName: l.teacher.name,
      teacherId: l.teacherId,
      viewsCount: l.viewsCount,
      isPremium: l.isPremium,
      price: l.price,
      createdAt: l.createdAt,
      className: (l as any).targetClasses?.[0]?.class.name,
      isFavorite: favoriteIds.has(l.id),
      status,
      type: source === "class" ? ("ASSIGNED" as const) : ("FREE" as const)
    };
  });

  const classes = source === "class" 
    ? Array.from(new Set(lessons.filter(l => l.className).map(l => JSON.stringify({ id: l.className, name: l.className }))))
        .map(s => JSON.parse(s))
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">

      {/* Main Content Component */}
      <LessonsPageContent 
        lessons={lessons} 
        source={source as "class" | "public"}
        classes={classes}
      />
    </div>
  );
}
