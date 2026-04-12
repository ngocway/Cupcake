import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { 
  Play, 
  ChevronLeft, 
  User, 
  Clock, 
  Eye, 
  Calendar,
  BookOpen,
  ArrowRight,
  Share2,
  Bookmark
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export default async function LessonDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/student/login");

  const { id } = await params;

  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      teacher: {
        select: {
          name: true,
          image: true,
          _count: { select: { lessons: true } }
        }
      },
      assignment: {
        select: {
          id: true,
          title: true,
          _count: { select: { questions: true } }
        }
      }
    }
  });

  if (!lesson) notFound();

  // Parse Youtube ID if applicable
  const getYoutubeId = (url: string | null) => {
    if (!url) return null;
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  };

  const videoId = getYoutubeId(lesson.videoUrl);

  return (
    <div className="min-h-screen bg-surface-container-low/20">
      {/* Top Navigation */}
      <div className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-outline-variant/30 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link 
            href="/student/lessons" 
            className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-bold text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Quay lại thư viện
          </Link>
          <div className="flex items-center gap-4">
             <button className="p-2 hover:bg-surface-container rounded-full transition-colors text-on-surface-variant">
                <Bookmark className="w-5 h-5" />
             </button>
             <button className="p-2 hover:bg-surface-container rounded-full transition-colors text-on-surface-variant">
                <Share2 className="w-5 h-5" />
             </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 lg:py-16 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content (Player & Info) */}
        <div className="lg:col-span-2 space-y-10">
          {/* Video Player Section */}
          <div className="aspect-video bg-black rounded-[3rem] overflow-hidden shadow-2xl group relative ring-1 ring-white/10">
            {videoId ? (
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`}
                title={lesson.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center space-y-4 text-white/50">
                 <VideoLargeIcon />
                 <p className="font-bold tracking-tight">Không có video bài giảng</p>
              </div>
            )}
          </div>

          {/* Lesson Details */}
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-outline-variant/20 shadow-杂志-shadow space-y-8">
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                     Lesson Detail
                  </span>
                  <div className="flex items-center gap-2 text-on-surface-variant text-xs font-bold">
                     <Calendar className="w-3.5 h-3.5" />
                     {format(lesson.createdAt, "dd/MM/yyyy", { locale: vi })}
                  </div>
               </div>
               <h1 className="text-3xl md:text-5xl font-black text-on-surface tracking-tight leading-loose">
                 {lesson.title}
               </h1>

               {/* Integrated Learning CTA */}
               {lesson.assignment && (
                 <div className="pt-4 flex flex-wrap gap-4">
                    <Link 
                      href={`/student/assignments/${lesson.assignment.id}/run?direct=true`}
                      className="inline-flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-3xl font-black text-sm tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
                    >
                       <Play className="w-5 h-5 fill-current" />
                       BẮT ĐẦU BÀI HỌC
                    </Link>
                    <button className="inline-flex items-center gap-3 px-8 py-4 bg-surface-container text-on-surface rounded-3xl font-bold text-sm hover:bg-surface-container-high transition-all">
                       <BookOpen className="w-5 h-5" />
                       TẢI TÀI LIỆU
                    </button>
                 </div>
               )}
            </div>

            <div className="grid grid-cols-3 gap-6 py-6 border-y border-outline-variant/10">
               <div className="flex flex-col gap-1">
                  <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Lượt xem</p>
                  <div className="flex items-center gap-2 font-black text-on-surface">
                     <Eye className="w-4 h-4 text-primary" />
                     {lesson.viewsCount}
                  </div>
               </div>
               <div className="flex flex-col gap-1">
                  <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Loại bài</p>
                  <div className="flex items-center gap-2 font-black text-on-surface uppercase text-xs">
                     <BookOpen className="w-4 h-4 text-secondary" />
                     {lesson.isPremium ? "Premium" : "Miễn phí"}
                  </div>
               </div>
               <div className="flex flex-col gap-1">
                  <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Trạng thái</p>
                  <div className="flex items-center gap-2 font-black text-on-surface uppercase text-xs">
                     <Play className="w-4 h-4 text-tertiary" />
                     Đang học
                  </div>
               </div>
            </div>

            <div className="space-y-4">
               <h4 className="text-xl font-black tracking-tight underline decoration-primary/30 decoration-4 underline-offset-8">Mô tả nội dung</h4>
               <p className="text-on-surface-variant leading-loose text-lg font-medium">
                 {lesson.description || "Bài giảng chưa có mô tả chi tiết từ giáo viên."}
               </p>
            </div>
          </div>
        </div>

        {/* Sidebar (Instructor & Related Assignment) */}
        <div className="space-y-8">
          {/* Instructor Card */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-outline-variant/20 shadow-sm space-y-6">
             <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-3xl bg-surface-container flex items-center justify-center overflow-hidden border-2 border-primary/20">
                   {lesson.teacher.image ? (
                     <img src={lesson.teacher.image} alt={lesson.teacher.name || "T"} className="w-full h-full object-cover" />
                   ) : (
                     <User className="w-8 h-8 text-primary" />
                   )}
                </div>
                <div>
                   <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Giáo viên</p>
                   <h5 className="text-xl font-black text-on-surface">{lesson.teacher.name || "Cố định"}</h5>
                </div>
             </div>
             <p className="text-sm text-on-surface-variant leading-relaxed font-medium pb-6 border-b border-outline-variant/10">
                Chuyên gia trong lĩnh vực giảng dạy tiếng Anh và Khoa học. Đã thực hiện hơn {lesson.teacher._count.lessons} bài giảng trên hệ thống.
             </p>
             <button className="w-full py-3 rounded-2xl bg-surface-container hover:bg-primary/10 text-primary font-bold text-sm transition-all">
                Xem hồ sơ giáo viên
             </button>
          </div>

          {/* Connected Assignment */}
          {lesson.assignment && (
            <div className="bg-primary text-white rounded-[2.5rem] p-8 shadow-2xl shadow-primary/20 space-y-8 relative overflow-hidden group">
               <div className="relative z-10 space-y-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                     <Play className="w-6 h-6 fill-current" />
                  </div>
                  <div>
                     <p className="text-primary-fixed/80 text-[10px] font-bold uppercase tracking-widest">Nhiệm vụ kèm theo</p>
                     <h5 className="text-2xl font-black leading-tight mt-2">{lesson.assignment.title}</h5>
                  </div>
                  <ul className="space-y-3">
                     <li className="flex items-center gap-2 text-sm font-medium opacity-90">
                        <CheckCircleIcon />
                        {lesson.assignment._count.questions} câu hỏi rèn luyện
                     </li>
                     <li className="flex items-center gap-2 text-sm font-medium opacity-90">
                        <CheckCircleIcon />
                        Kiểm tra kiến thức ngay
                     </li>
                  </ul>
               </div>

               <Link 
                  href={`/student/assignments/${lesson.assignment.id}/run?direct=true`}
                  className="relative z-10 w-full py-4 bg-white text-primary rounded-3xl flex items-center justify-center gap-3 font-black text-sm tracking-widest hover:bg-primary-container transition-all group-hover:scale-105 active:scale-95"
               >
                  BẮT ĐẦU LÀM BÀI
                  <ArrowRight className="w-4 h-4" />
               </Link>

               {/* Decorative Circles */}
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
               <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12 group-hover:scale-110 transition-transform"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function VideoLargeIcon() {
  return (
    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="stroke-current">
      <path d="M15 10L19.5528 7.72361C20.2177 7.39116 21 7.87465 21 8.61803V15.382C21 16.1253 20.2177 16.6088 19.5528 16.2764L15 14M3 7H13C14.1046 7 15 7.89543 15 9V15C15 16.1046 14.1046 17 13 17H3C1.89543 17 1 16.1046 1 15V9C1 7.89543 1.89543 7 3 7Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function CheckCircleIcon() {
   return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
         <polyline points="20 6 9 17 4 12" />
      </svg>
   )
}
