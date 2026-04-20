
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { 
  ChevronLeft, 
  User, 
  Calendar,
  Eye,
  BookOpen,
  Share2,
  Bookmark,
  Lock,
  Tag,
  ArrowRight
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import PublicQuestionViewer from "@/components/lessons/PublicQuestionViewer";
import LessonReviewSection from "@/components/lessons/LessonReviewSection";

export default async function PublicLessonPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const session = await auth();
  const { id } = await params;

  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
          image: true,
          professionalTitle: true,
          bio: true,
          _count: { select: { lessons: true } }
        }
      },
      assignment: {
        include: {
          questions: {
            orderBy: { orderIndex: 'asc' }
          }
        }
      },
      reviews: {
        where: { isApproved: true },
        include: {
          student: {
            select: { name: true, image: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!lesson) notFound();

  // ACCESS CONTROL
  const isPublic = lesson.assignment?.status === "PUBLIC";
  const isLoggedIn = !!session?.user;
  const isStudent = session?.user?.role === "STUDENT";

  // Guest cannot view PRIVATE lessons
  if (!isPublic && !isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-container-low/20 p-6">
        <div className="max-w-md w-full bg-white rounded-[2rem] p-10 border border-outline-variant/30 text-center space-y-6 shadow-xl">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-black text-on-surface">Bài học riêng tư</h1>
          <p className="text-on-surface-variant leading-relaxed">
            Bài học này đã được đặt ở chế độ riêng tư bởi giáo viên. Vui lòng đăng nhập bằng tài khoản học sinh để tiếp tục.
          </p>
          <Link 
            href="/student/login"
            className="block w-full py-4 bg-primary text-white rounded-2xl font-black tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/20"
          >
            ĐĂNG NHẬP NGAY
          </Link>
          <Link href="/" className="block text-sm font-bold text-outline hover:text-primary transition-colors">
            Quay lại trang chủ
          </Link>
        </div>
      </div>
    );
  }

  // Related Lessons Logic
  const currentTags = lesson.assignment?.tags?.split(',').map(t => t.trim()).filter(Boolean) || [];
  let relatedLessons: any[] = [];
  
  if (currentTags.length > 0) {
    relatedLessons = await prisma.lesson.findMany({
      where: {
        id: { not: id },
        assignment: {
          status: isLoggedIn ? { in: ["PUBLIC", "PRIVATE"] as any } : "PUBLIC",
          OR: currentTags.map(tag => ({
             tags: { contains: tag }
          }))
        }
      },
      take: 4,
      include: {
        teacher: { select: { name: true } },
        assignment: { select: { thumbnail: true, tags: true } }
      }
    });
  }

  // Parse Youtube ID
  const getYoutubeId = (url: string | null) => {
    if (!url) return null;
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  };

  const videoId = getYoutubeId(lesson.videoUrl);

  // --- CHECK IF ASSIGNED TO STUDENT'S CLASS ---
  let isAssignedToUser = false;
  if (session?.user?.id) {
    const studentClasses = await prisma.classEnrollment.findMany({
      where: { studentId: session.user.id, status: 'ACTIVE' },
      select: { classId: true }
    });
    
    const classIds = studentClasses.map(c => c.classId);
    
    if (classIds.length > 0) {
      const assignmentInClass = await prisma.assignmentClass.findFirst({
        where: {
          assignmentId: lesson.assignmentId!,
          classId: { in: classIds }
        }
      });
      isAssignedToUser = !!assignmentInClass;
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Sticky Header */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-black group-hover:rotate-12 transition-transform">
              C
            </div>
            <span className="font-black text-xl tracking-tighter text-slate-900">CUPCAKES</span>
          </Link>
          <div className="flex items-center gap-4">
             <button className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><Bookmark className="w-5 h-5" /></button>
             <button className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><Share2 className="w-5 h-5" /></button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Video & Description & Questions */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* 1. Video Player */}
            <section className="space-y-6">
              <div className="aspect-video bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl ring-1 ring-slate-200">
                {videoId ? (
                  <iframe
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                    allowFullScreen
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-4">
                    <BookOpen className="w-16 h-16 opacity-20" />
                    <p className="font-bold">Nội dung bài học không có video</p>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                   <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isPublic ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {isPublic ? 'Public Lesson' : 'Private Lesson'}
                   </span>
                   <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(lesson.createdAt, "dd MMMM, yyyy", { locale: vi })}
                   </div>
                </div>
                <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight">
                  {lesson.title}
                </h1>

                {/* Tags Display (New Requirement) */}
                {currentTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                     {currentTags.map((tag, idx) => (
                       <Link 
                         key={idx} 
                         href={`/public/tags/${encodeURIComponent(tag)}`}
                         className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold border border-slate-200 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all"
                       >
                          <Tag className="w-3 h-3" />
                          {tag}
                       </Link>
                     ))}
                  </div>
                )}

                <div className="flex items-center gap-6 py-2">
                   <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                      <Eye className="w-4 h-4 text-primary" />
                      {lesson.viewsCount.toLocaleString()} lượt xem
                   </div>
                   <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                      <BookOpen className="w-4 h-4 text-primary" />
                      {lesson.assignment?.questions.length || 0} câu hỏi
                   </div>
                </div>
              </div>
            </section>

            {/* 2. Description */}
            <section className="bg-white rounded-[2.5rem] p-8 lg:p-10 border border-slate-200 shadow-sm space-y-6">
               <h2 className="text-2xl font-black text-slate-900">Về bài học này</h2>
               <div className="text-slate-600 leading-relaxed text-lg whitespace-pre-wrap font-medium">
                  {lesson.description || "Chưa có mô tả cho bài học này."}
               </div>
            </section>

            {/* 3. Questions (UC-03) */}
            <section id="questions" className="space-y-8">
               <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-slate-900">Câu hỏi luyện tập</h2>
                  {!isLoggedIn && (
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                       Đăng nhập để lưu kết quả
                    </span>
                  )}
               </div>
               
               {lesson.assignment ? (
                 <PublicQuestionViewer 
                   questions={lesson.assignment.questions} 
                   assignmentId={lesson.assignment.id}
                   isLoggedIn={isLoggedIn}
                   showSubmitButton={isAssignedToUser}
                 />
               ) : (
                 <div className="p-10 bg-slate-50 rounded-3xl text-center text-slate-400 font-bold border-2 border-dashed border-slate-200">
                    Không có câu hỏi đính kèm
                 </div>
               )}
            </section>

            {/* 4. Reviews (UC-02.4) */}
            <LessonReviewSection 
              reviews={lesson.reviews} 
              lessonId={lesson.id}
              isLoggedIn={isLoggedIn}
              isPublic={isPublic}
            />

          </div>

          {/* Right Column: Instructor & Related Lessons (New Requirement) */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Instructor Card */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm">
               <div className="space-y-6">
                  <div className="flex items-center gap-4">
                     <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden ring-2 ring-primary/10">
                        {lesson.teacher.image ? (
                          <img src={lesson.teacher.image} alt={lesson.teacher.name || ""} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><User className="w-8 h-8 text-slate-300" /></div>
                        )}
                     </div>
                     <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Giáo viên</p>
                        <h3 className="text-xl font-black text-slate-900">{lesson.teacher.name}</h3>
                     </div>
                  </div>
                  
                  <div className="space-y-2">
                     <p className="text-sm font-bold text-primary">{lesson.teacher.professionalTitle}</p>
                     <p className="text-sm text-slate-500 leading-relaxed italic">
                        "{lesson.teacher.bio?.substring(0, 100)}..."
                     </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-400">
                     <Link 
                        href={`/public/teachers/${lesson.teacher.id}/lessons`}
                        className="hover:text-primary transition-colors flex items-center gap-1 underline decoration-dotted underline-offset-4"
                     >
                        {lesson.teacher._count.lessons} bài giảng
                     </Link>
                     <Link href={`/profile/${lesson.teacher.id}`} className="text-primary hover:underline font-black">Xem hồ sơ</Link>
                  </div>
               </div>
            </div>

            {/* Related Lessons Section (Marked in Red) */}
            <div className="space-y-6">
               <h3 className="text-xl font-black text-slate-900 px-2 flex items-center gap-2">
                  Bài học liên quan
                  <div className="h-1 flex-1 bg-slate-100 rounded-full" />
               </h3>
               
               {relatedLessons.length > 0 ? (
                 <div className="space-y-4">
                    {relatedLessons.map((rel) => (
                      <Link 
                        key={rel.id} 
                        href={`/public/lessons/${rel.id}`}
                        className="group flex gap-4 p-4 bg-white rounded-3xl border border-slate-100 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all"
                      >
                         <div className="w-20 h-20 bg-slate-100 rounded-2xl overflow-hidden shrink-0 ring-1 ring-slate-200">
                            {rel.assignment?.thumbnail ? (
                              <img src={rel.assignment.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300"><BookOpen className="w-8 h-8" /></div>
                            )}
                         </div>
                         <div className="flex flex-col justify-center gap-1 overflow-hidden">
                            <h4 className="font-black text-slate-900 text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                               {rel.title}
                            </h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                               {rel.teacher.name}
                            </p>
                         </div>
                      </Link>
                    ))}
                 </div>
               ) : (
                 <div className="p-8 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center text-slate-400 text-xs font-bold">
                    Không tìm thấy bài học tương tự
                 </div>
               )}
            </div>

            {/* CTA for guests */}
            {!isLoggedIn && (
               <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-6 relative overflow-hidden">
                  <div className="relative z-10 space-y-4">
                     <h4 className="text-2xl font-black leading-tight">Muốn lưu lại tiến độ học tập?</h4>
                     <p className="text-slate-400 text-sm leading-relaxed">
                        Đăng nhập ngay để theo dõi lịch sử làm bài và nhận chứng chỉ.
                     </p>
                     <Link 
                        href="/student/login"
                        className="block w-full py-4 bg-white text-slate-900 rounded-2xl text-center font-black tracking-widest hover:bg-primary hover:text-white transition-all group"
                     >
                        ĐĂNG NHẬP
                        <ArrowRight className="inline-block ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                     </Link>
                  </div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-16 -mt-16"></div>
               </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
