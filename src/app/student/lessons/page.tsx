import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import LessonsPageContent from "./_components/LessonsPageContent";
import { Play, Video } from "lucide-react";

export default async function StudentLessonsPage() {
  const session = await auth();
  
  if (!session || session.user?.role !== "STUDENT") {
    redirect("/student/login");
  }

  const userId = session.user.id;

  // 1. Fetch Enrolled Classes & Teachers
  const enrollments = await prisma.classEnrollment.findMany({
    where: { studentId: userId },
    include: {
      class: {
        include: {
          teacher: true
        }
      }
    }
  });

  const teacherIds = Array.from(new Set(enrollments.map(e => e.class.teacherId)));

  // 2. Fetch User Favorites (with safety check)
  let favoriteIds = new Set<string>();
  try {
    const userFavorites = await (prisma as any).favoriteLesson.findMany({
      where: { studentId: userId },
      select: { lessonId: true }
    });
    favoriteIds = new Set(userFavorites.map((f: any) => f.lessonId));
  } catch (error) {
    console.error("Prisma client may need update:", error);
  }

  // 3. Fetch Assigned Lessons
  const assignedLessonsRaw = await prisma.lesson.findMany({
    where: {
      teacherId: { in: teacherIds },
      deletedAt: null
    },
    include: {
      teacher: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  const assignedLessons = assignedLessonsRaw.map(l => {
    const enrollment = enrollments.find(e => e.class.teacherId === l.teacherId);
    return {
      id: l.id,
      title: l.title,
      description: l.description,
      videoUrl: l.videoUrl,
      teacherName: l.teacher.name,
      teacherId: l.teacherId,
      viewsCount: l.viewsCount,
      isPremium: l.isPremium,
      price: l.price,
      createdAt: l.createdAt,
      className: enrollment?.class.name,
      isFavorite: favoriteIds.has(l.id),
      type: "ASSIGNED" as const
    };
  });

  // 4. Fetch Public Lessons
  const publicLessonsRaw = await prisma.lesson.findMany({
    where: {
      OR: [
        { isPremium: false },
        { isEditorChoice: true }
      ],
      deletedAt: null,
      NOT: { id: { in: assignedLessons.map(l => l.id) } }
    },
    include: {
      teacher: { select: { name: true } }
    },
    take: 12,
    orderBy: { viewsCount: 'desc' }
  });

  const publicLessons = publicLessonsRaw.map(l => ({
    id: l.id,
    title: l.title,
    description: l.description,
    videoUrl: l.videoUrl,
    teacherName: l.teacher.name,
    teacherId: l.teacherId,
    viewsCount: l.viewsCount,
    isPremium: l.isPremium,
    price: l.price,
    createdAt: l.createdAt,
    isFavorite: favoriteIds.has(l.id),
    type: "FREE" as const
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Page Header */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest ring-1 ring-primary/20">
           <Play className="w-3 h-3 fill-current" />
           Thư viện bài giảng
        </div>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
                 Khám phá <span className="text-primary italic">Tri thức</span>
              </h1>
              <p className="text-on-surface-variant text-lg mt-4 max-w-xl">
                 Từ những bài học trọng tâm trên lớp đến các chuyên đề mở rộng từ cộng đồng giáo viên giỏi.
              </p>
            </div>
            
            <div className="hidden lg:block bg-surface-container-low p-5 rounded-[2rem] border border-outline-variant/10 shadow-sm relative overflow-hidden group">
              <div className="relative z-10 flex items-center gap-4">
                 <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg text-primary">
                    <Video className="w-6 h-6" />
                 </div>
                 <div>
                    <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Tổng bài học</p>
                    <p className="text-xl font-black">{assignedLessons.length + publicLessons.length}</p>
                 </div>
              </div>
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -mr-10 -mt-10 group-hover:scale-120 transition-transform"></div>
            </div>
        </div>
      </div>

      {/* Main Content Component */}
      <LessonsPageContent 
        assignedLessons={assignedLessons} 
        publicLessons={publicLessons}
      />
    </div>
  );
}
