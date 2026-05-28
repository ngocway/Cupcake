import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
import { vi, enUS } from "date-fns/locale";
import { ReviewTrigger } from "@/components/reviews/ReviewTrigger";
import { BookmarkButton } from "@/components/common/BookmarkButton";
import { LearningSidebar } from "@/app/student/_components/LearningSidebar";
import { PublicHeader } from "@/components/public/PublicHeader";
import dynamic from 'next/dynamic';

const InteractiveReadingContent = dynamic(
  () => import('@/components/common/InteractiveReadingContent').then(mod => mod.InteractiveReadingContent),
  { loading: () => <div className="h-64 bg-slate-100 dark:bg-slate-900 animate-pulse rounded-2xl w-full" /> }
);

const CustomAudioPlayer = dynamic(
  () => import('@/components/common/CustomAudioPlayer').then(mod => mod.CustomAudioPlayer),
  { loading: () => <div className="h-24 bg-slate-100 dark:bg-slate-900 animate-pulse rounded-3xl w-full" /> }
);
import { Suspense } from "react";
import { LessonVideoPlayer } from "./_components/LessonVideoPlayer";
import { getLessonBasic, getLessonExtra, getTeacherBasic, getLessonReviews, getRelatedLessons, getLessonReadingText } from "./data";
import { getTranslations, getLocale } from "next-intl/server";

import BackButton from "@/components/ui/BackButton";

// --- Sub-components for Streaming ---

async function AudioPlayerWrapper({ lessonId }: { lessonId: string }) {
  const t = await getTranslations("student.lessonDetail");
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { audioUrl: true }
  });
  const audioUrl = lesson?.audioUrl;
  
  if (!audioUrl) return null;
  
  return (
    <div className="animate-in fade-in slide-in-from-top-4 duration-500">
      <CustomAudioPlayer 
        src={audioUrl} 
        title={t("listenAudio")}
        subtitle={t("audioLesson")}
      />
    </div>
  );
}

async function ReviewsWrapper({ lessonId }: { lessonId: string }) {
  const t = await getTranslations("student.lessonDetail");
  const reviews = await getLessonReviews(lessonId);

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

  return (
    <div className="bg-[#eef8fa] dark:bg-slate-900/50 rounded-3xl p-10 space-y-12 mb-20 animate-in fade-in duration-700">
      <div className="space-y-4">
        <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{t("studentReviews")}</h3>
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
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t("reviewsCount", { count: reviews.length })}</p>
          </div>
        </div>
      </div>

      {reviews.length > 0 ? (
        <div className="space-y-10">
          {reviews.map((review) => (
            <div key={review.id} className="space-y-4 animate-in fade-in duration-500">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-white shadow-sm relative">
                  {review.student.image ? (
                    <Image 
                      src={review.student.image} 
                      alt="" 
                      fill
                      className="object-cover" 
                    />
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
                </div>
              </div>
            </div>
          ))}
          {reviews.length === 5 && (
            <button className="w-full py-4 text-xs font-black uppercase tracking-[0.2em] text-slate-400 hover:text-primary transition-colors border-t border-slate-200/50 mt-4">
              {t("viewAllReviews")}
            </button>
          )}
        </div>
      ) : (
        <div className="py-16 text-center space-y-4 bg-white/50 dark:bg-slate-800/50 rounded-[2rem] border-2 border-dashed border-slate-200">
          <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-slate-400 italic font-medium text-sm">{t("noReviews")}</p>
        </div>
      )}
    </div>
  );
}

async function SidebarWrapper({ teacherId, lessonId }: { teacherId: string | null, lessonId: string }) {
  const [teacher, relatedLessons] = await Promise.all([
    teacherId ? getTeacherBasic(teacherId) : Promise.resolve(null),
    getRelatedLessons(lessonId)
  ]);

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-700">
      <LearningSidebar 
        teacher={teacher} 
        relatedItems={relatedLessons.map(l => ({ ...l, thumbnail: l.thumbnail || null }))} 
        isGuest={false}
      />
    </div>
  );
}

async function LessonActionsWrapper({ lessonId, studentId }: { lessonId: string, studentId: string }) {
  const extra = await getLessonExtra(lessonId);
  const isBookmarked = extra?.favorites?.some((f: any) => f.studentId === studentId) || false;
  
  return (
    <div className="flex items-center justify-end">
      <div className="flex items-center gap-3">
         <BookmarkButton 
             id={lessonId}
             type="LESSON"
             initialIsBookmarked={isBookmarked}
         />
         <ReviewTrigger 
             type="lesson"
             id={lessonId}
             isLoggedIn={true} inline
         />
      </div>
    </div>
  );
}

async function LessonTagsWrapper({ lessonId }: { lessonId: string }) {
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

async function LessonAssignmentBannerWrapper({ lessonId }: { lessonId: string }) {
  const t = await getTranslations("student.lessonDetail");
  const extra = await getLessonExtra(lessonId);
  const assignment = extra?.assignment;

  if (!assignment) return null;

  return (
      <div className="p-10 bg-slate-900 dark:bg-primary text-white rounded-[2.5rem] shadow-2xl relative overflow-hidden group border border-white/10 mt-32 animate-in fade-in duration-500">
         <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
                     <AssignmentIcon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em]">{t("relatedAssignment")}</p>
               </div>
               <h3 className="text-2xl font-black tracking-tight uppercase italic">{assignment.title}</h3>
               <div className="flex items-center gap-6 text-xs font-bold">
                  <span>{t("questionsCount", { count: assignment._count?.questions || 0 })}</span>
                  <span>{t("autoGrading")}</span>
               </div>
            </div>
            <Link 
               href={`/student/assignments/${assignment.slug || assignment.id}/run?direct=true`}
               className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-white text-slate-900 rounded-full font-black text-xs tracking-[0.2em] uppercase hover:bg-slate-100 transition-all hover:scale-105 active:scale-95 shrink-0"
            >
               {t("startAssignment")}
               <ArrowRight className="w-5 h-5" />
            </Link>
         </div>
      </div>
  );
}

async function ReadingContentWrapper({ lessonId }: { lessonId: string }) {
  const t = await getTranslations("student.lessonDetail");
  const readingText = await getLessonReadingText(lessonId);
  if (!readingText) return null;
  return (
    <div className="animate-in fade-in duration-500">
      
      <div className="prose prose-slate text-lg font-medium leading-loose text-on-surface-variant max-w-none dark:prose-invert [&_p]:text-lg [&_p]:font-medium [&_p]:leading-loose">
        <InteractiveReadingContent html={readingText} isLoggedIn={true} />
      </div>
    </div>
  );
}

// --- Main Page Component ---

export default async function StudentLessonDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;

  // Parallel fetch auth and cached lesson detail
  const [sessionData, lesson, t] = await Promise.all([
    auth(),
    getLessonBasic(id),
    getTranslations("student.lessonDetail")
  ]);

  if (!lesson) notFound();

  // Session is guaranteed by StudentLayout, but we need the ID
  const session = {
    id: sessionData?.user?.id || "",
    name: sessionData?.user?.name ?? null,
    image: sessionData?.user?.image ?? null,
    role: (sessionData?.user as any)?.role ?? null
  };
  if (!session.id) redirect("/student/login");
  
  if (id === lesson.id && lesson.slug && id !== lesson.slug) {
    redirect(`/student/lessons/${lesson.slug}`);
  }

  const getYoutubeId = (url: string | null) => {
    if (!url) return null;
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  };

  const videoId = getYoutubeId(lesson.videoUrl);

  return (
    <div className="min-h-screen bg-transparent flex flex-col lg:h-screen lg:overflow-hidden font-body">
      
      <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto lg:overflow-hidden">
         <div className="w-full lg:w-[70%] flex flex-col bg-transparent lg:overflow-y-auto no-scrollbar">
            <div className="px-4 md:px-8 lg:px-12 pt-4 pb-8 space-y-6 max-w-5xl mx-auto w-full">
               {/* Back Button */}
               <BackButton className="flex items-center gap-2 w-fit px-4 py-2 bg-white/50 hover:bg-white text-slate-600 font-black text-[10px] uppercase tracking-widest rounded-xl border border-slate-200 transition-all active:scale-95">
                  <ChevronLeft className="w-4 h-4" />
                  Back
               </BackButton>
               {/* Video Player (Facade Optimization) */}
               {(videoId || lesson.videoUrl) && (
                  <LessonVideoPlayer 
                    lessonId={lesson.id}
                    studentId={session.id}
                    videoId={videoId}
                    videoUrl={lesson.videoUrl}
                    title={lesson.title}
                    thumbnail={lesson.assignment?.thumbnail}
                  />
               )}

               {/* Audio Player (Streamed) */}
               <Suspense fallback={<div className="h-24 bg-slate-100 dark:bg-slate-900 animate-pulse rounded-3xl" />}>
                  <AudioPlayerWrapper lessonId={lesson.id} />
               </Suspense>

               <div className="glass rounded-3xl p-10 lg:p-12 space-y-12 shadow-xl border border-white/40 mb-12">
                  <div className="space-y-6">
                     <Suspense fallback={<div className="h-8 flex justify-end"><div className="w-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-full" /></div>}>
                        <LessonActionsWrapper lessonId={lesson.id} studentId={session.id} />
                     </Suspense>
                     <h2 className="text-2xl md:text-3xl font-bold text-on-surface tracking-tight leading-tight uppercase font-headline">
                        {lesson.title}
                     </h2>
                     <Suspense fallback={<div className="flex gap-2 mt-4"><div className="w-16 h-6 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-full" /></div>}>
                        <LessonTagsWrapper lessonId={lesson.id} />
                     </Suspense>
                  </div>

                  <div className="space-y-10">

                     {lesson.assignment && (
                        <Suspense fallback={<div className="h-96 bg-slate-50 dark:bg-slate-900 animate-pulse rounded-2xl" />}>
                           <ReadingContentWrapper lessonId={lesson.id} />
                        </Suspense>
                     )}

                     {lesson.assignment && (
                        <Suspense fallback={<div className="h-48 bg-slate-100 dark:bg-slate-900 animate-pulse rounded-[2.5rem] mt-32" />}>
                           <LessonAssignmentBannerWrapper lessonId={lesson.id} />
                        </Suspense>
                     )}
                  </div>

                  {/* Reviews Section (Streamed & Paginated) */}
                  <Suspense fallback={<div className="h-64 bg-[#eef8fa] dark:bg-slate-900 animate-pulse rounded-3xl" />}>
                     <ReviewsWrapper lessonId={lesson.id} />
                  </Suspense>
               </div>
            </div>
         </div>

         <div className="w-full lg:w-[30%]">
            {/* Sidebar (Streamed) */}
            <Suspense fallback={<div className="w-full h-full bg-slate-50 dark:bg-slate-950 animate-pulse" />}>
               <SidebarWrapper teacherId={lesson.teacherId} lessonId={lesson.id} />
            </Suspense>
         </div>
      </div>
    </div>
  );
}
