
import React from 'react';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  Bookmark, 
  BookOpen, 
  Assignment as AssignmentIcon,
  ChevronRight,
  Clock,
  User,
  Search
} from '@mui/icons-material';

export default async function BookmarksPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/student/login');

  const userId = session.user.id;

  // Fetch bookmarked lessons
  const bookmarkedLessons = await prisma.favoriteLesson.findMany({
    where: { studentId: userId },
    include: {
      lesson: {
        include: {
          teacher: {
            select: { name: true, image: true }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Fetch bookmarked assignments
  const bookmarkedAssignments = await prisma.favoriteAssignment.findMany({
    where: { studentId: userId },
    include: {
      assignment: {
        include: {
          teacher: {
            select: { name: true, image: true }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const hasBookmarks = bookmarkedLessons.length > 0 || bookmarkedAssignments.length > 0;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-on-surface">Của tôi & Yêu thích</h1>
          <p className="text-on-surface-variant mt-1">Quản lý các bài học và bài tập bạn đã lưu lại.</p>
        </div>
        
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-outline group-focus-within:text-primary transition-colors">
            <Search sx={{ fontSize: 20 }} />
          </div>
          <input 
            type="text" 
            placeholder="Tìm trong mục yêu thích..."
            className="pl-12 pr-6 py-3 bg-surface-container-high rounded-2xl border-none focus:ring-2 focus:ring-primary w-full md:w-80 transition-all font-medium text-sm"
          />
        </div>
      </div>

      {!hasBookmarks ? (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-20 text-center border border-dashed border-outline-variant/50">
          <div className="w-20 h-20 bg-surface-container rounded-3xl flex items-center justify-center mx-auto mb-6 text-outline">
            <Bookmark sx={{ fontSize: 40 }} />
          </div>
          <h3 className="text-xl font-bold text-on-surface">Bạn chưa lưu mục nào</h3>
          <p className="text-on-surface-variant max-w-sm mx-auto mt-2">
            Hãy khám phá các bài học và bài tập thú vị rồi nhấn icon bookmark để lưu lại xem sau nhé!
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/student/lessons" className="px-6 py-3 bg-primary text-white rounded-2xl font-bold text-sm hover:scale-105 transition-transform">
              Khám phá Lessons
            </Link>
            <Link href="/student/assignments" className="px-6 py-3 bg-surface-container text-on-surface rounded-2xl font-bold text-sm hover:bg-surface-container-high transition-colors">
              Xem Assignments
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-12">
          {/* Lessons Section */}
          {bookmarkedLessons.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <BookOpen sx={{ fontSize: 22 }} />
                </div>
                <h2 className="text-xl font-black tracking-tight">Bài học đã lưu ({bookmarkedLessons.length})</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bookmarkedLessons.map((item) => (
                  <Link 
                    key={item.lessonId}
                    href={`/student/lessons/${item.lessonId}`}
                    className="group bg-white dark:bg-slate-900 rounded-3xl border border-outline-variant/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden"
                  >
                    <div className="aspect-video bg-surface-container relative">
                       {/* Placeholder for lesson thumbnail */}
                       <div className="absolute inset-0 flex items-center justify-center opacity-20">
                         <BookOpen sx={{ fontSize: 60 }} />
                       </div>
                       <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur rounded-full text-[10px] font-black uppercase tracking-widest text-primary shadow-sm">
                          Lesson
                       </div>
                    </div>
                    <div className="p-6 space-y-4">
                      <h4 className="font-bold text-lg line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                        {item.lesson.title}
                      </h4>
                      <div className="flex items-center gap-3 pt-2 border-t border-outline-variant/10">
                        <div className="w-8 h-8 rounded-full bg-surface-container overflow-hidden">
                          {item.lesson.teacher.image ? (
                            <img src={item.lesson.teacher.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-xs font-bold">
                              {item.lesson.teacher.name?.charAt(0)}
                            </div>
                          )}
                        </div>
                        <span className="text-xs font-bold text-on-surface-variant">
                          {item.lesson.teacher.name}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Assignments Section */}
          {bookmarkedAssignments.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary">
                  <AssignmentIcon sx={{ fontSize: 22 }} />
                </div>
                <h2 className="text-xl font-black tracking-tight">Bài tập đã lưu ({bookmarkedAssignments.length})</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bookmarkedAssignments.map((item) => (
                  <Link 
                    key={item.assignmentId}
                    href={`/student/assignments/${item.assignmentId}/run`}
                    className="group bg-white dark:bg-slate-900 rounded-3xl border border-outline-variant/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden"
                  >
                    <div className="aspect-video bg-surface-container relative">
                       {/* Placeholder for assignment thumbnail */}
                       <div className="absolute inset-0 flex items-center justify-center opacity-20">
                         <AssignmentIcon sx={{ fontSize: 60 }} />
                       </div>
                       <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur rounded-full text-[10px] font-black uppercase tracking-widest text-secondary shadow-sm">
                          Exercise
                       </div>
                    </div>
                    <div className="p-6 space-y-4">
                      <h4 className="font-bold text-lg line-clamp-2 leading-tight group-hover:text-secondary transition-colors">
                        {item.assignment.title}
                      </h4>
                      <div className="flex items-center gap-4 pt-2 border-t border-outline-variant/10">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-on-surface-variant uppercase">
                          <Clock sx={{ fontSize: 14 }} />
                          {item.assignment.timeLimit ? `${item.assignment.timeLimit} Phút` : 'Không giới hạn'}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-on-surface-variant uppercase">
                          <User sx={{ fontSize: 14 }} />
                          {item.assignment.teacher.name}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
