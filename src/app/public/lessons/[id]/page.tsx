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
import { GlobalAudioPlayer } from "@/components/common/GlobalAudioPlayer";
import { LearningSidebar } from "@/app/student/_components/LearningSidebar";
import { PublicHeader } from "@/components/public/PublicHeader";
import { InteractiveReadingContent } from "@/components/common/InteractiveReadingContent";

import { Suspense } from "react";

import type { Metadata } from "next";

// Reuse data fetching from student page
import { getLessonBasic, getLessonExtra, getTeacherBasic, getLessonReviews, getRelatedLessons, getLessonReadingText } from "@/app/student/lessons/[id]/data";

// --- Per-lesson SEO Metadata ---

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const lesson = await getLessonBasic(id);

  if (!lesson) {
    return { title: "Lesson Not Found | Dolcake" };
  }

  const title = `${lesson.title} | Dolcake`;
  const description =
    lesson.description ||
    `Learn English with "${lesson.title}" — an interactive lesson on Dolcake, the fun English learning platform for kids and teens.`;
  const thumbnail = lesson.assignment?.thumbnail ?? "/images/og-image.png";
  const canonicalPath = `/public/lessons/${lesson.slug ?? lesson.id}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description,
      url: `https://dolcake.com${canonicalPath}`,
      siteName: "Dolcake",
      images: [{ url: thumbnail, width: 1200, height: 630, alt: lesson.title }],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [thumbnail],
    },
  };
}



// --- Sub-components for Streaming ---

async function PublicReviewsWrapper({ lessonId }: { lessonId: string }) {
  const reviews = await getLessonReviews(lessonId);

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

  return (
    <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-primary/5 rounded-[2.5rem] p-10 space-y-12 mb-20 shadow-xl shadow-primary/5">
      <div className="space-y-4">
        <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Student Reviews</h3>
        <div className="flex items-end gap-6">
          <div className="text-6xl font-black text-slate-900 dark:text-white leading-none">
            {averageRating}/5
          </div>
          <div className="space-y-1 pb-1">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />
              ))}
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{reviews.length} reviews</p>
          </div>
        </div>
      </div>

      {reviews.length > 0 ? (
        <div className="space-y-10">
          {reviews.map((review) => (
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
  );
}

async function PublicSidebarWrapper({ teacherId, lessonId, isGuest }: { teacherId: string | null, lessonId: string, isGuest: boolean }) {
  const [teacher, relatedLessons] = await Promise.all([
    teacherId ? getTeacherBasic(teacherId) : Promise.resolve(null),
    getRelatedLessons(lessonId)
  ]);

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-700 h-full">
      <LearningSidebar 
        teacher={teacher} 
        relatedItems={relatedLessons.map(l => ({ ...l, thumbnail: l.thumbnail || null }))} 
        isGuest={isGuest}
      />
    </div>
  );
}

async function PublicActionsWrapper({ lessonId, studentId }: { lessonId: string, studentId: string | undefined }) {
  let isBookmarked = false;
  if (studentId) {
    const favorite = await prisma.favoriteLesson.findUnique({
      where: {
        studentId_lessonId: { studentId, lessonId }
      }
    });
    isBookmarked = !!favorite;
  }
  
  return (
    <div className="flex items-center justify-end">
      <div className="flex items-center gap-3">
         <BookmarkButton 
             id={lessonId}
             type="LESSON"
             initialIsBookmarked={isBookmarked}
             isLoggedIn={!!studentId}
         />
         <ReviewTrigger 
             type="lesson"
             id={lessonId}
             isLoggedIn={!!studentId} inline
         />
      </div>
    </div>
  );
}

async function PublicTagsWrapper({ lessonId }: { lessonId: string }) {
  const extra = await getLessonExtra(lessonId);
  const tagsArray = extra?.assignment?.tags
     ? extra.assignment.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
     : [];
  if (tagsArray.length === 0) return null;
  return (
     <div className="flex flex-wrap gap-2 mt-4 animate-in fade-in duration-500">
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
}

async function PublicReadingContentWrapper({ lessonId, sessionExists }: { lessonId: string, sessionExists: boolean }) {
  const readingText = await getLessonReadingText(lessonId);
  if (!readingText) return null;
  return (
    <div className="animate-in fade-in duration-500">
      <div className="prose prose-slate text-lg font-medium leading-loose text-on-surface-variant max-w-none dark:prose-invert [&_p]:text-lg [&_p]:font-medium [&_p]:leading-loose">
        <InteractiveReadingContent html={readingText} isLoggedIn={sessionExists} />
      </div>
    </div>
  );
}

async function PublicLessonAssignmentBannerWrapper({ lessonId, sessionExists }: { lessonId: string, sessionExists: boolean }) {
  const extra = await getLessonExtra(lessonId);
  const assignment = extra?.assignment;

  if (!assignment) return null;

  return (
      <div className="p-10 bg-primary text-white rounded-[2.5rem] shadow-2xl shadow-primary/30 relative overflow-hidden group border border-white/10 mt-32 animate-in fade-in duration-500">
         <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
                     <AssignmentIcon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em]">Attached Assignment</p>
               </div>
               <h3 className="text-2xl font-black tracking-tight uppercase italic">{assignment.title}</h3>
               <div className="flex items-center gap-6">
                  <span className="flex items-center gap-2 text-xs font-bold">
                     <CheckCircle className="w-4 h-4 text-white/40" />
                     {assignment._count?.questions || 0} questions
                  </span>
                  <span className="flex items-center gap-2 text-xs font-bold">
                     <CheckCircle className="w-4 h-4 text-white/40" />
                     Auto-graded
                  </span>
               </div>
            </div>
            <Link 
               href={sessionExists ? `/student/assignments/${assignment.slug || assignment.id}/run?direct=true` : `/public/assignments/${assignment.slug || assignment.id}?direct=true`}
               className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-white text-slate-900 rounded-full font-black text-xs tracking-[0.2em] uppercase hover:bg-slate-100 transition-all hover:scale-105 active:scale-95 shrink-0"
            >
               START ASSIGNMENT
               <ArrowRight className="w-5 h-5" />
            </Link>
         </div>
         <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
      </div>
  );
}

// --- Main Page Component ---

export default async function PublicLessonPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  
  // Parallel fetch auth and lesson basic data
  const [sessionData, lesson] = await Promise.all([
    auth(),
    getLessonBasic(id)
  ]);

  const session = sessionData?.user ? {
    id: sessionData.user.id!,
    name: sessionData.user.name ?? null,
    image: sessionData.user.image ?? null,
    role: sessionData.user.role ?? null,
  } : null;

  if (!lesson) notFound();

  // Canonical redirect
  if (id === lesson.id && lesson.slug && id !== lesson.slug) {
    redirect(`/public/lessons/${lesson.slug}`);
  }

  // Parse Youtube ID if applicable
  const getYoutubeId = (url: string | null) => {
    if (!url) return null;
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  };

  const videoId = getYoutubeId(lesson.videoUrl);

  return (
    <div className="min-h-screen bg-[#F4EFE6] dark:bg-slate-950 flex flex-col lg:h-screen lg:overflow-hidden font-body">
      <PublicHeader session={session as any} />
      
      {/* 2-Column Learning Layout */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto lg:overflow-hidden">
         {/* Main Column: Video & Content & Reviews */}
         <div className="w-full lg:w-[70%] flex flex-col bg-transparent lg:overflow-y-auto no-scrollbar">
            <div className="px-4 md:px-8 lg:px-12 pt-4 pb-8 space-y-6 max-w-5xl mx-auto w-full">


               {/* Video Player */}
               {(videoId || lesson.videoUrl) && (
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
                     <Suspense fallback={<div className="h-8 flex justify-end"><div className="w-24 bg-white/50 animate-pulse rounded-full" /></div>}>
                        <PublicActionsWrapper lessonId={lesson.id} studentId={session?.id} />
                     </Suspense>
                     
                     <h2 className="text-2xl md:text-3xl font-bold text-on-surface tracking-tight leading-tight uppercase font-headline">
                        {lesson.title}
                     </h2>
                     
                     <Suspense fallback={<div className="flex gap-2 mt-4"><div className="w-16 h-6 bg-white/50 animate-pulse rounded-full" /></div>}>
                        <PublicTagsWrapper lessonId={lesson.id} />
                     </Suspense>
                  </div>

                  <div className="space-y-10">
                     {lesson.assignment && (lesson.audioUrl || lesson.assignment.audioUrl) && (
                        <GlobalAudioPlayer audioUrl={lesson.audioUrl || lesson.assignment.audioUrl || ''} />
                     )}
                     {lesson.assignment && (
                        <Suspense fallback={<div className="h-96 bg-white/30 animate-pulse rounded-2xl" />}>
                           <PublicReadingContentWrapper lessonId={lesson.id} sessionExists={!!session} />
                        </Suspense>
                     )}

                     {lesson.assignment && (
                        <Suspense fallback={<div className="h-48 bg-white/30 animate-pulse rounded-[2.5rem] mt-32" />}>
                           <PublicLessonAssignmentBannerWrapper lessonId={lesson.id} sessionExists={!!session} />
                        </Suspense>
                     )}
                  </div>

                  {/* Reviews & Comments Section */}
                  <Suspense fallback={<div className="h-64 bg-white/30 animate-pulse rounded-[2.5rem]" />}>
                     <PublicReviewsWrapper lessonId={lesson.id} />
                  </Suspense>
               </div>
            </div>
         </div>

         {/* Right Column: Teacher & Related */}
         <div className="w-full lg:w-[30%]">
            <Suspense fallback={<div className="w-full h-full bg-slate-50/50 dark:bg-slate-950/50 animate-pulse" />}>
               <PublicSidebarWrapper teacherId={lesson.teacherId} lessonId={lesson.id} isGuest={!session} />
            </Suspense>
         </div>
      </div>
   </div>
  );
}
