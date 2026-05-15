import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || session.user?.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const source = searchParams.get("source") || "public";
    const skip = parseInt(searchParams.get("skip") || "0", 10);
    const take = parseInt(searchParams.get("take") || "20", 10);

    const userId = session.user.id;

    // Parallel fetch for better performance
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
      const existing = progressMap.get(p.lessonId);
      if (!existing || (!existing.completedAt && p.completedAt)) {
        progressMap.set(p.lessonId, p);
      }
    });

    let lessonsRaw;
    let total: number;

    if (source === "class") {
      // Count total first
      total = await prisma.lesson.count({
        where: {
          targetClasses: { some: { classId: { in: classIds } } },
          deletedAt: null
        }
      });

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
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      });
    } else {
      total = await prisma.lesson.count({
        where: {
          OR: [
            { isPremium: false },
            { isEditorChoice: true }
          ],
          deletedAt: null
        }
      });

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
        orderBy: { viewsCount: 'desc' },
        skip,
        take,
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

    return NextResponse.json({
      lessons,
      classes,
      hasMore: skip + take < total,
      total,
    });
  } catch (error) {
    console.error("Error fetching lessons:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
