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
  Bookmark,
  MessageSquare,
  BookOpenCheck as AssignmentIcon
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { ReviewTrigger } from "@/components/reviews/ReviewTrigger";
import { BookmarkButton } from "@/components/common/BookmarkButton";
import { Star } from "lucide-react";
import { LearningSidebar } from "@/app/student/_components/LearningSidebar";
import InteractiveLessonSidebar from "./_components/InteractiveLessonSidebar";

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
          id: true,
          name: true,
          image: true,
          professionalTitle: true,
          bio: true,
          isPortfolioPublished: true,
          _count: {
            select: {
              lessons: true,
              assignments: true
            }
          }
        }
      },
      assignment: {
        select: {
          id: true,
          title: true,
          videoUrl: true,
          audioUrl: true,
          instructions: true,
          questions: {
            orderBy: { orderIndex: 'asc' }
          },
          _count: { select: { questions: true } }
        }
      },
      favorites: {
        where: { studentId: session.user.id }
      },
      reviews: {
        where: {
          OR: [
            { isApproved: true },
            { studentId: session.user.id }
          ]
        },
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

  // Fetch related lessons
  const relatedLessons = await prisma.lesson.findMany({
    where: {
      id: { not: lesson.id },
      teacherId: lesson.teacherId,
      deletedAt: null,
      isBlocked: false
    },
    take: 5,
    select: {
      id: true,
      title: true,
      teacher: {
        select: { name: true }
      }
    }
  });

  const isBookmarked = lesson.favorites.length > 0;

  const getYoutubeId = (url: string | null) => {
    if (!url) return null;
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  };

  const rawVideoUrl = lesson.assignment?.videoUrl || lesson.videoUrl;
  const rawAudioUrl = lesson.assignment?.audioUrl;
  const videoId = getYoutubeId(rawVideoUrl);

    return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-outline-variant/30 bg-white dark:bg-slate-900 flex items-center justify-between px-6 shrink-0 z-20">
         <div className="flex items-center gap-4">
            <Link href="/student/lessons" className="p-2 hover:bg-surface-container rounded-full">
               <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="hidden md:block">
                <div className="flex items-center gap-3">
                   <h1 className="font-black text-on-surface truncate max-w-xs">{lesson.title}</h1>
                   <div className="flex items-center gap-1">
                      <BookmarkButton 
                        type="lesson" 
                        id={id} 
                        initialIsBookmarked={isBookmarked} 
                        className="scale-90"
                      />
                      <ReviewTrigger type="lesson" id={id} isLoggedIn={!!session} inline />
                   </div>
                </div>
            </div>
         </div>

         <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-surface-container rounded-full transition-colors text-on-surface-variant">
               <Share2 className="w-5 h-5" />
            </button>
            {lesson.assignment && (
               <Link 
                  href={`/student/assignments/${lesson.assignment.id}/run?direct=true`}
                  className="px-6 py-2 bg-primary text-white rounded-full font-black text-sm tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
               >
                  LÀM BÀI TẬP
               </Link>
            )}
         </div>
      </header>

      {/* 3-Column Learning Layout */}
      <div className="flex flex-1 overflow-hidden">
         {/* Left Column: Teacher & Related */}
         <LearningSidebar 
           teacher={lesson.teacher as any} 
           relatedItems={relatedLessons.map(l => ({ ...l, thumbnail: null, type: "LESSON" as const }))} 
         />

         {/* Middle Column: Video & Content & Reviews */}
         <div className="flex-1 border-r border-outline-variant/30 flex flex-col bg-white dark:bg-slate-900 overflow-y-auto custom-scrollbar">
            <div className="p-8 lg:p-12 space-y-12 max-w-5xl mx-auto w-full">
               {/* Video Player */}
               <div className="aspect-video bg-black rounded-[3rem] overflow-hidden shadow-2xl group relative ring-1 ring-white/10 shrink-0">
                  {videoId ? (
                    <iframe
                      className="w-full h-full"
                      src={`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`}
                      title={lesson.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : rawVideoUrl ? (
                    <video
                      controls
                      className="w-full h-full object-contain"
                      src={rawVideoUrl}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center space-y-4 text-white/50">
                       <VideoLargeIcon />
                       <p className="font-bold tracking-tight">Không có video bài giảng</p>
                    </div>
                  )}
               </div>

               {rawAudioUrl && (
                  <div className="bg-surface-container/50 rounded-[2rem] p-6 shadow-sm border border-outline-variant/30 flex flex-col gap-4">
                    <h4 className="text-sm font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                       <span className="material-symbols-outlined !text-[18px]">headphones</span>
                       Audio bài giảng
                    </h4>
                    <audio controls className="w-full h-12" src={rawAudioUrl} />
                  </div>
               )}

               {/* Lesson Details */}
               <div className="space-y-12">
                  <div className="space-y-6">
                     <h2 className="text-4xl md:text-5xl font-black text-on-surface tracking-tight leading-tight">
                        {lesson.title}
                     </h2>
                  </div>

                  <div className="space-y-6">
                     <h4 className="text-xl font-black tracking-tight underline decoration-primary/30 decoration-4 underline-offset-8 italic">Mô tả nội dung</h4>
                     <p className="text-on-surface-variant leading-loose text-lg font-medium">
                        {lesson.description || "Bài giảng chưa có mô tả chi tiết từ giáo viên."}
                     </p>
                  </div>

                  {/* Reviews & Comments Section */}
                  {lesson.reviews.some(r => r.isApproved) && (
                    <div className="pt-16 border-t border-outline-variant/10 space-y-12 pb-20">
                       <div className="flex items-center justify-between">
                          <h3 className="text-2xl font-black tracking-tight italic uppercase">Đánh giá & Bình luận</h3>
                          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-2xl border border-amber-100">
                             <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                             <span className="font-black text-amber-700">
                                {lesson.reviews.length > 0 
                                   ? (lesson.reviews.reduce((acc, r) => acc + r.rating, 0) / lesson.reviews.length).toFixed(1)
                                   : "N/A"
                                }
                             </span>
                          </div>
                       </div>
  
                       <div className="space-y-10">
                          {lesson.reviews.map((review) => (
                             <div key={review.id} className="space-y-4 animate-in fade-in duration-500">
                                <div className="flex items-center justify-between">
                                   <div className="flex items-center gap-3">
                                      <div className="w-12 h-12 rounded-2xl bg-surface-container overflow-hidden p-0.5 border border-outline-variant/20">
                                         {review.student.image ? (
                                           <img src={review.student.image} alt="" className="w-full h-full object-cover rounded-1.5xl" />
                                         ) : (
                                           <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold">
                                              {review.student.name?.charAt(0)}
                                           </div>
                                         )}
                                      </div>
                                      <div>
                                         <div className="flex items-center gap-2">
                                            <p className="text-sm font-black">{review.student.name}</p>
                                            {!review.isApproved && (
                                               <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[8px] font-black uppercase rounded-full tracking-widest">
                                                  Chờ duyệt
                                               </span>
                                            )}
                                         </div>
                                         <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">
                                            {format(review.createdAt, "dd/MM/yyyy", { locale: vi })}
                                         </p>
                                      </div>
                                   </div>
                                   <div className="flex gap-0.5">
                                      {[1, 2, 3, 4, 5].map((s) => (
                                         <Star key={s} className={`w-3.5 h-3.5 ${review.rating >= s ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                                      ))}
                                   </div>
                                </div>
                                <p className="text-on-surface-variant text-base leading-relaxed font-medium pl-15">
                                   {review.comment}
                                </p>
                             </div>
                          ))}
                       </div>
                    </div>
                  )}
               </div>
            </div>
         </div>

         {/* Right Column: Related Assignment */}
         <div className="w-full max-w-md flex flex-col bg-slate-50/30 dark:bg-slate-950/30 overflow-y-auto custom-scrollbar">
            <div className="p-8 space-y-10">
               <InteractiveLessonSidebar 
                  assignment={lesson.assignment} 
                  isGuest={!session} 
               />
            </div>
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
