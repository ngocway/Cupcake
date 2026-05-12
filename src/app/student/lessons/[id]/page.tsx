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
  BookOpenCheck as AssignmentIcon,
  CheckCircle,
  Star,
  ThumbsUp
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { ReviewTrigger } from "@/components/reviews/ReviewTrigger";
import { BookmarkButton } from "@/components/common/BookmarkButton";
import { LearningSidebar } from "@/app/student/_components/LearningSidebar";
import { PublicHeader } from "@/components/public/PublicHeader";
import { InteractiveReadingContent } from "@/components/common/InteractiveReadingContent";
import { CustomAudioPlayer } from "@/components/common/CustomAudioPlayer";


export default async function StudentLessonDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const sessionData = await auth();
  const session = sessionData?.user ? {
    id: sessionData.user.id!,
    name: sessionData.user.name ?? null,
    image: sessionData.user.image ?? null,
    role: sessionData.user.role ?? null,
  } : null;

  if (!session) redirect("/login");
  
  const { id } = await params;

  const lesson = await prisma.lesson.findFirst({
    where: {
      OR: [
        { id },
        { slug: id }
      ]
    },
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
        include: {
          _count: {
             select: { questions: true }
          }
        }
      },
      favorites: {
        where: { studentId: session.id }
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
  
  // Patch audioUrl since prisma client might not know about it yet
  const audioPatch: any = await prisma.$queryRawUnsafe(
    `SELECT "audioUrl" FROM "Lesson" WHERE "id" = $1`,
    lesson.id
  );
  if (audioPatch?.[0]?.audioUrl) {
    (lesson as any).audioUrl = audioPatch[0].audioUrl;
  }

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
      slug: true,
      title: true,
      teacher: {
        select: { name: true }
      }
    }
  });

  const isBookmarked = (lesson as any).favorites?.length > 0;

  // Parse Youtube ID if applicable
  const getYoutubeId = (url: string | null) => {
    if (!url) return null;
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  };

  const videoId = getYoutubeId(lesson.videoUrl);

  return (
    <div className="min-h-screen bg-transparent flex flex-col h-screen overflow-hidden font-body">
      <PublicHeader session={session} />
      
      {/* 2-Column Learning Layout */}
      <div className="flex flex-1 overflow-hidden">
         {/* Main Column: Video & Content & Reviews */}
         <div className="w-[70%] flex flex-col bg-transparent overflow-y-auto custom-scrollbar">
            <div className="px-8 lg:px-12 pt-7 pb-12 space-y-12 max-w-5xl mx-auto w-full">
               {/* Video Player */}
               {(videoId || lesson.videoUrl) && (
                  <div className="aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl group relative ring-1 ring-white/10 shrink-0">
                     {videoId ? (
                        <iframe
                          className="w-full h-full"
                          src={`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`}
                          title={lesson.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                     ) : (
                        <video 
                          src={lesson.videoUrl!} 
                          className="w-full h-full" 
                          controls 
                          poster={lesson.assignment?.thumbnail || undefined}
                        />
                     )}
                  </div>
               )}

               {/* Audio Player */}
               {(lesson as any).audioUrl && (
                  <CustomAudioPlayer 
                    src={(lesson as any).audioUrl} 
                    title="Nghe bài giảng"
                    subtitle="Audio Lesson"
                  />
               )}

               {/* Lesson Details Card */}
               <div className="glass rounded-3xl p-10 lg:p-12 space-y-12 shadow-xl border border-white/40 mb-12">
                  <div className="space-y-6">
                     <div className="flex items-center justify-end">
                        <div className="flex items-center gap-3">
                           <BookmarkButton 
                              id={lesson.id}
                              type="LESSON"
                              initialIsBookmarked={isBookmarked}
                           />
                           <ReviewTrigger 
                              type="lesson"
                              id={lesson.id}
                              isLoggedIn={true} inline
                           />
                        </div>
                     </div>
                     <h2 className="text-2xl md:text-3xl font-bold text-on-surface tracking-tight leading-tight uppercase font-headline">
                        {lesson.title}
                     </h2>
                  </div>

                  <div className="space-y-10">
                     <div className="text-on-surface-variant leading-loose text-lg font-medium prose prose-slate max-w-none">
                        {lesson.description || "Bài giảng chưa có mô tả chi tiết từ giáo viên."}
                     </div>

                     {lesson.assignment?.readingText && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                           <div className="flex items-center gap-4">
                              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                              <div className="px-6 py-2 rounded-full border border-slate-200 bg-white/50 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                                 Nội dung bài học
                              </div>
                              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                           </div>
                           
                           <div className="prose prose-slate prose-lg max-w-none dark:prose-invert 
                                 prose-headings:font-headline prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight
                                 prose-p:text-on-surface-variant prose-p:leading-loose prose-p:text-lg prose-p:font-normal
                                 prose-img:rounded-3xl prose-img:border-0 prose-img:ring-0
                                 prose-strong:text-primary prose-strong:font-bold
                                 selection:bg-primary/10"
                              >
                                 <InteractiveReadingContent html={lesson.assignment.readingText} />
                              </div>
                        </div>
                     )}

                     {lesson.assignment && (
                        <div className="p-10 bg-slate-900 dark:bg-primary text-white rounded-[2.5rem] shadow-2xl relative overflow-hidden group border border-white/10 clear-both mt-32">
                           <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                              <div className="space-y-4">
                                 <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
                                       <AssignmentIcon className="w-5 h-5 text-white" />
                                    </div>
                                    <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em]">Nhiệm vụ đi kèm</p>
                                 </div>
                                 <h3 className="text-2xl font-black tracking-tight uppercase italic">{lesson.assignment.title}</h3>
                                 <div className="flex items-center gap-6">
                                    <span className="flex items-center gap-2 text-xs font-bold">
                                       <CheckCircle className="w-4 h-4 text-white/40" />
                                       {lesson.assignment._count.questions} câu hỏi
                                    </span>
                                    <span className="flex items-center gap-2 text-xs font-bold">
                                       <CheckCircle className="w-4 h-4 text-white/40" />
                                       Chấm điểm tự động
                                    </span>
                                 </div>
                              </div>
                              <Link 
                                 href={`/student/assignments/${lesson.assignment.id}/run?direct=true`}
                                 className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-white text-slate-900 rounded-full font-black text-xs tracking-[0.2em] uppercase hover:bg-slate-100 transition-all hover:scale-105 active:scale-95 shrink-0"
                              >
                                 BẮT ĐẦU LÀM BÀI
                                 <ArrowRight className="w-5 h-5" />
                              </Link>
                           </div>
                           <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                        </div>
                     )}
                  </div>

                  {/* Reviews & Comments Section */}
                  <div className="bg-[#eef8fa] dark:bg-slate-900/50 rounded-3xl p-10 space-y-12 mb-20">
                     <div className="space-y-4">
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Đánh giá từ học viên</h3>
                        <div className="flex items-end gap-6">
                           <div className="text-6xl font-black text-slate-900 dark:text-white leading-none">
                              {lesson.reviews.length > 0 
                                 ? (lesson.reviews.reduce((acc, r) => acc + r.rating, 0) / lesson.reviews.length).toFixed(1)
                                 : "0"
                              }/5
                           </div>
                           <div className="space-y-1 pb-1">
                              <div className="flex gap-0.5">
                                 {[1, 2, 3, 4, 5].map((s) => (
                                    <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />
                                 ))}
                              </div>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{lesson.reviews.length} đánh giá</p>
                           </div>
                        </div>
                     </div>

                     {lesson.reviews.length > 0 ? (
                        <div className="space-y-10">
                           {lesson.reviews.map((review) => (
                              <div key={review.id} className="space-y-4 animate-in fade-in duration-500">
                                 <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-white shadow-sm">
                                       {review.student.image ? (
                                         <img src={review.student.image} alt="" className="w-full h-full object-cover" />
                                       ) : (
                                         <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold">
                                            {review.student.name?.charAt(0)}
                                         </div>
                                       )}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                       <div className="flex items-center gap-3">
                                          <p className="text-sm font-black text-slate-800 dark:text-white">{review.student.name}</p>
                                          <div className="flex gap-0.5">
                                             {[1, 2, 3, 4, 5].map((s) => (
                                                <Star key={s} className={`w-3 h-3 ${review.rating >= s ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                                             ))}
                                          </div>
                                       </div>
                                       <p className="text-slate-600 dark:text-slate-300 text-sm font-medium leading-relaxed">
                                          {review.comment}
                                       </p>
                                       <div className="flex items-center gap-6 pt-1">
                                          <button className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-primary transition-colors">
                                             <ThumbsUp className="w-3.5 h-3.5" />
                                             <span>12</span>
                                          </button>
                                          <button className="text-xs font-bold text-slate-400 hover:text-primary transition-colors">Phản hồi</button>
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           ))}
                        </div>
                     ) : (
                        <div className="py-16 text-center space-y-4 bg-white/50 dark:bg-slate-800/50 rounded-[2rem] border-2 border-dashed border-slate-200">
                           <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
                           <p className="text-slate-400 italic font-medium text-sm">Chưa có bình luận nào từ học viên.</p>
                        </div>
                     )}
                  </div>
               </div>
            </div>
         </div>

         {/* Right Column: Teacher & Related */}
         <div className="w-[30%]">
            <LearningSidebar 
              teacher={lesson.teacher as any} 
              relatedItems={relatedLessons.map(l => ({ ...l, thumbnail: null }))} 
              isGuest={false}
            />
         </div>
      </div>
    </div>
  );
}
