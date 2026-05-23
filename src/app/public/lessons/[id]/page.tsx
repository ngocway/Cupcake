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
import BackButton from "@/components/ui/BackButton";

export default async function PublicLessonPage({ 
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
      ...(session ? {
        favorites: {
          where: { studentId: session.id }
        }
      } : {}),
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

  // Fetch popular tags
  const popularTags = await prisma.tag.findMany({
    where: { isPopular: true },
    select: { name: true }
  });
  const popularTagNames = new Set(popularTags.map(t => t.name.toLowerCase().trim()));

  // Get current lesson's tags (excluding popular tags)
  const currentTags = lesson.assignment?.tags
    ? lesson.assignment.tags.split(',').map((t: string) => t.trim().toLowerCase()).filter(Boolean)
    : [];
  const filteredTags = currentTags.filter(tag => !popularTagNames.has(tag));

  const currentAudiences = lesson.targetAudiences || [];

  let relatedLessons: any[] = [];

  if (filteredTags.length > 0) {
    const candidates = await prisma.lesson.findMany({
      where: {
        id: { not: lesson.id },
        deletedAt: null,
        isBlocked: false,
        isPremium: false,
        ...(currentAudiences.length > 0 && {
          targetAudiences: { hasSome: currentAudiences }
        }),
        assignment: {
          OR: filteredTags.map(tag => ({
            tags: { contains: tag, mode: 'insensitive' }
          }))
        }
      },
      take: 100,
      select: {
        id: true,
        slug: true,
        title: true,
        thumbnail: true,
        teacher: {
          select: { name: true }
        },
        assignment: {
          select: { tags: true }
        }
      }
    });

    const getOverlapCount = (tagsStr: string | null | undefined) => {
      if (!tagsStr) return 0;
      const tags = tagsStr.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
      return tags.filter(tag => filteredTags.includes(tag)).length;
    };

    candidates.sort((a, b) => {
      const overlapA = getOverlapCount(a.assignment?.tags);
      const overlapB = getOverlapCount(b.assignment?.tags);
      return overlapB - overlapA;
    });

    relatedLessons = candidates.slice(0, 10);
  }

  // Fallback: If no lessons found or no filtered tags exist, fetch the latest public lessons
  if (relatedLessons.length === 0) {
    relatedLessons = await prisma.lesson.findMany({
      where: {
        id: { not: lesson.id },
        deletedAt: null,
        isBlocked: false,
        isPremium: false,
        ...(currentAudiences.length > 0 && {
          targetAudiences: { hasSome: currentAudiences }
        })
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10,
      select: {
        id: true,
        slug: true,
        title: true,
        thumbnail: true,
        teacher: {
          select: { name: true }
        }
      }
    });
  }

  const isBookmarked = session ? (lesson as any).favorites?.length > 0 : false;

  // Parse Youtube ID if applicable
  const getYoutubeId = (url: string | null) => {
    if (!url) return null;
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  };

  const videoId = getYoutubeId(lesson.videoUrl);

  return (
    <div className="min-h-screen bg-[#F4EFE6] dark:bg-slate-950 flex flex-col h-screen overflow-hidden font-body">
      <PublicHeader session={session} />
      
      {/* 2-Column Learning Layout */}
      <div className="flex flex-1 overflow-hidden">
         {/* Main Column: Video & Content & Reviews */}
         <div className="w-[70%] flex flex-col bg-transparent overflow-y-auto custom-scrollbar">
            <div className="px-8 lg:px-12 pt-7 pb-12 space-y-6 max-w-5xl mx-auto w-full">
               {/* Back Button */}
               <BackButton className="flex items-center gap-2 w-fit px-4 py-2 bg-white/60 hover:bg-white text-slate-600 font-black text-[10px] uppercase tracking-widest rounded-xl border border-white/40 shadow-sm backdrop-blur-md transition-all active:scale-95">
                  <ChevronLeft className="w-4 h-4" />
                  Back
               </BackButton>

               {/* Video Player */}
               {videoId && (
                  <div className="aspect-video bg-black rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/20 group relative shrink-0 border border-white/10">
                     <iframe
                       className="w-full h-full"
                       src={`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`}
                       title={lesson.title}
                       allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                       allowFullScreen
                     />
                  </div>
               )}

               {/* Lesson Details Card */}
               <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-[3.5rem] p-10 lg:p-12 space-y-12 shadow-2xl shadow-primary/5 border border-primary/5 mb-12">
                  <div className="space-y-6">
                     <div className="flex items-center justify-end">
                        
                        <div className="flex items-center gap-3">
                           {session && (
                             <BookmarkButton 
                                id={lesson.id}
                                type="LESSON"
                                initialIsBookmarked={isBookmarked}
                             />
                           )}
                           <ReviewTrigger 
                              type="lesson"
                              id={lesson.id}
                              isLoggedIn={!!session} inline
                           />
                        </div>
                     </div>
                     <h2 className="text-2xl md:text-3xl font-bold text-on-surface tracking-tight leading-tight uppercase font-headline">
                        {lesson.title}
                     </h2>
                     {(() => {
                        const tagsArray = lesson.assignment?.tags
                           ? lesson.assignment.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
                           : [];
                        if (tagsArray.length === 0) return null;
                        return (
                           <div className="flex flex-wrap gap-2 mt-4">
                              {tagsArray.map((tag: string) => (
                                 <Link 
                                    key={tag} 
                                    href={`/tags/${encodeURIComponent(tag)}`}
                                    className="bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400 px-3 py-1 rounded-full text-xs font-bold shadow-sm border border-yellow-100 dark:border-yellow-800/30 hover:scale-105 hover:bg-yellow-100 transition-all duration-300"
                                 >
                                    #{tag}
                                 </Link>
                              ))}
                           </div>
                        );
                     })()}
                  </div>


                  <div className="space-y-10">
                     <div className="text-on-surface-variant leading-loose text-lg font-medium prose prose-slate max-w-none">
                        {lesson.description || "No description provided for this lesson."}
                     </div>

                     {lesson.assignment?.readingText && (
                        <div className="space-y-8 animate-in fade-in duration-500 pt-8 border-t border-slate-100">
                           <div className="flex items-center gap-4">
                              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                              <div className="px-6 py-2 rounded-full border border-slate-200 bg-white/50 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                                 Lesson Content
                              </div>
                              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                           </div>
                           <div className="prose prose-slate prose-lg max-w-none dark:prose-invert">
                              <InteractiveReadingContent html={lesson.assignment.readingText} isLoggedIn={!!session} />
                           </div>
                        </div>
                     )}

                     {lesson.assignment && (
                        <div className="p-10 bg-primary text-white rounded-[2.5rem] shadow-2xl shadow-primary/30 relative overflow-hidden group border border-white/10">
                           <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                              <div className="space-y-4">
                                 <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
                                       <AssignmentIcon className="w-5 h-5 text-white" />
                                    </div>
                                    <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em]">Attached Assignment</p>
                                 </div>
                                 <h3 className="text-2xl font-black tracking-tight uppercase italic">{lesson.assignment.title}</h3>
                                 <div className="flex items-center gap-6">
                                    <span className="flex items-center gap-2 text-xs font-bold">
                                       <CheckCircle className="w-4 h-4 text-white/40" />
                                       {lesson.assignment._count.questions} questions
                                    </span>
                                    <span className="flex items-center gap-2 text-xs font-bold">
                                       <CheckCircle className="w-4 h-4 text-white/40" />
                                       Auto-graded
                                    </span>
                                 </div>
                              </div>
                              <Link 
                                 href={session ? `/student/assignments/${lesson.assignment.id}/run?direct=true` : `/public/assignments/${lesson.assignment.id}?direct=true`}
                                 className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-white text-slate-900 rounded-full font-black text-xs tracking-[0.2em] uppercase hover:bg-slate-100 transition-all hover:scale-105 active:scale-95 shrink-0"
                              >
                                 START ASSIGNMENT
                                 <ArrowRight className="w-5 h-5" />
                              </Link>
                           </div>
                           <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                        </div>
                     )}
                  </div>

                  {/* Reviews & Comments Section */}
                  <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-primary/5 rounded-[2.5rem] p-10 space-y-12 mb-20 shadow-xl shadow-primary/5">
                     <div className="space-y-4">
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Student Reviews</h3>
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
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{lesson.reviews.length} reviews</p>
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
                                          <button className="text-xs font-bold text-slate-400 hover:text-primary transition-colors">Reply</button>
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           ))}
                        </div>
                     ) : (
                        <div className="py-16 text-center space-y-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] border-2 border-dashed border-primary/20 shadow-xl shadow-primary/5">
                           <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
                           <p className="text-slate-400 italic font-medium text-sm">No reviews yet from students.</p>
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
              relatedItems={relatedLessons.map(l => ({ ...l, thumbnail: l.thumbnail || null }))} 
              isGuest={!session}
            />
         </div>
      </div>
   </div>
  );
}
