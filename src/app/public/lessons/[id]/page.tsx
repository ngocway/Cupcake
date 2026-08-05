import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { 
  ChevronLeft, 
  BookOpenCheck as AssignmentIcon,
  CheckCircle,
  Star,
  Heart,
  Sparkles,
  ThumbsUp,
  MessageSquare,
  ArrowRight,
  Globe,
} from "lucide-react";
import dynamic from "next/dynamic";
import type { VocabItem } from "@/app/student/lessons/[id]/_components/KeyVocabularyWidget";
import { GlobalAudioPlayer } from "@/components/common/GlobalAudioPlayer";
import { LearningSidebar } from "@/app/student/_components/LearningSidebar";
import { PublicHeader } from "@/components/public/PublicHeader";
import { InteractiveReadingContent } from "@/components/common/InteractiveReadingContent";

const KeyVocabularyWidget = dynamic(
  () => import("@/app/student/lessons/[id]/_components/KeyVocabularyWidget").then(mod => mod.KeyVocabularyWidget),
  { loading: () => <div className="h-48 rounded-[28px] bg-white/50 animate-pulse shadow-xl" /> }
);
const InlineReviewForm = dynamic(
  () => import("@/app/student/lessons/[id]/_components/InlineReviewForm").then(mod => mod.InlineReviewForm)
);
const BookmarkButton = dynamic(
  () => import("@/components/common/BookmarkButton").then(mod => mod.BookmarkButton)
);
const ReviewTrigger = dynamic(
  () => import("@/components/reviews/ReviewTrigger").then(mod => mod.ReviewTrigger)
);

import { Suspense } from "react";

import type { Metadata } from "next";

// Reuse data fetching from student page
import { getLessonBasic, getLessonExtra, getTeacherBasic, getLessonReviews, getRelatedLessons, getLessonReadingText, getLessonInlineQuestions } from "@/app/student/lessons/[id]/data";
import { fetchWithRedis } from "@/lib/cached-queries";
import { LessonInlineQuiz } from "@/components/lessons/LessonInlineQuiz";

async function PublicQuestionsSectionWrapper({ lessonId }: { lessonId: string }) {
  const data = await getLessonInlineQuestions(lessonId);
  if (!data || !data.questions || data.questions.length === 0) return null;

  const session = await auth();
  const isLoggedIn = !!session?.user?.id;

  return (
    <div className="mt-8">
      <LessonInlineQuiz
        assignmentId={data.assignmentId}
        assignmentTitle={data.assignmentTitle}
        questions={data.questions}
        isLoggedIn={isLoggedIn}
      />
    </div>
  );
}

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

async function PublicReviewsWrapper({ lessonId, isLoggedIn }: { lessonId: string; isLoggedIn: boolean }) {
  const reviews = await getLessonReviews(lessonId);

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

  return (
    <div className="bg-white/85 backdrop-blur-xl border-2 border-emerald-100 rounded-[28px] p-6 sm:p-8 space-y-6 shadow-xl shadow-primary/5 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-emerald-100/80 pb-4">
        <div className="flex items-center gap-2.5">
          <MessageSquare className="w-5 h-5 text-emerald-600" />
          <h3 className="font-headline text-xl font-black text-slate-800 uppercase tracking-tight">
            Student Reviews
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
        {/* Left column: Summary rating & write review button */}
        <div className="md:col-span-4 bg-emerald-50/50 rounded-2xl p-6 border border-emerald-100/80 flex flex-col items-center justify-between text-center space-y-4 h-full">
          <div className="space-y-4 w-full flex flex-col items-center justify-center flex-1">
            <div className="text-5xl font-black text-slate-900 leading-none">
              {averageRating}<span className="text-2xl text-slate-400 font-bold">/5</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-5 h-5 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pt-1">{reviews.length} reviews</p>
            </div>
          </div>

          <div className="w-full pt-2">
            <InlineReviewForm lessonId={lessonId} isLoggedIn={isLoggedIn} />
          </div>
        </div>

        {/* Right column: Review list */}
        <div className="md:col-span-8 h-full flex flex-col justify-center">
          {reviews.length > 0 ? (
            <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1">
              {reviews.map((review) => (
                <div key={review.id} className="flex items-start gap-3.5 bg-white/80 p-4 rounded-2xl border border-slate-100 shadow-sm animate-in fade-in duration-500">
                  <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border-2 border-white shadow-sm relative">
                    {review.student.image ? (
                      <img src={review.student.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-sm">
                        {review.student.name?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-black text-slate-800">{review.student.name}</p>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`w-3 h-3 ${review.rating >= s ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-slate-600 text-xs font-medium leading-relaxed">
                      {review.comment}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full min-h-[180px] flex flex-col items-center justify-center p-6 text-center space-y-3 bg-white/60 rounded-2xl border-2 border-dashed border-emerald-200">
              <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-slate-400 italic font-medium text-xs px-4">No reviews yet from students.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

async function KeyVocabularyWrapper({ lessonId }: { lessonId: string }) {
  const readingText = await getLessonReadingText(lessonId);
  if (!readingText) return null;

  const vocabularyList: VocabItem[] = [];
  const seenWords = new Set<string>();

  const markerRegex = /class="[^"]*custom-vocab-marker[^"]*"([^>]*)/g;
  let match;
  while ((match = markerRegex.exec(readingText)) !== null) {
    const attrString = match[1];
    const wordMatch = attrString.match(/data-word="([^"]+)"/);
    const word = wordMatch ? wordMatch[1].trim() : "";
    if (word && !seenWords.has(word.toLowerCase())) {
      seenWords.add(word.toLowerCase());
      const pronunciation = attrString.match(/data-pronunciation="([^"]+)"/)?.[1] || "";
      const meaningVi = attrString.match(/data-meaning-vi="([^"]+)"/)?.[1] || "";
      const meaningTh = attrString.match(/data-meaning-th="([^"]+)"/)?.[1] || "";
      const meaningId = attrString.match(/data-meaning-id="([^"]+)"/)?.[1] || "";
      const meaningZh = attrString.match(/data-meaning-zh="([^"]+)"/)?.[1] || "";
      const meaningJa = attrString.match(/data-meaning-ja="([^"]+)"/)?.[1] || "";
      const meaningKo = attrString.match(/data-meaning-ko="([^"]+)"/)?.[1] || "";
      const meaningEs = attrString.match(/data-meaning-es="([^"]+)"/)?.[1] || "";
      const meaningFr = attrString.match(/data-meaning-fr="([^"]+)"/)?.[1] || "";
      const meaningDe = attrString.match(/data-meaning-de="([^"]+)"/)?.[1] || "";
      const explanationEn = attrString.match(/data-explanation-en="([^"]+)"/)?.[1] || "";
      const image = attrString.match(/data-image="([^"]+)"/)?.[1] || "";
      const examples = attrString.match(/data-examples="([^"]+)"/)?.[1] || "";

      vocabularyList.push({
        word,
        pronunciation: pronunciation || undefined,
        meaningVi: meaningVi || undefined,
        meaningTh: meaningTh || undefined,
        meaningId: meaningId || undefined,
        meaningZh: meaningZh || undefined,
        meaningJa: meaningJa || undefined,
        meaningKo: meaningKo || undefined,
        meaningEs: meaningEs || undefined,
        meaningFr: meaningFr || undefined,
        meaningDe: meaningDe || undefined,
        explanationEn: explanationEn || undefined,
        example: examples ? examples.split(';')[0].trim() : undefined,
        image: image || undefined
      });
    }
  }

  if (vocabularyList.length === 0) {
    const uTagRegex = /<u[^>]*>([^<]+)<\/u>/gi;
    let uMatch;
    while ((uMatch = uTagRegex.exec(readingText)) !== null) {
      const word = uMatch[1].replace(/<[^>]+>/g, '').trim();
      if (word.length > 1 && !seenWords.has(word.toLowerCase())) {
        seenWords.add(word.toLowerCase());
        vocabularyList.push({ word });
      }
    }
  }

  if (vocabularyList.length === 0) return null;

  return <KeyVocabularyWidget vocabulary={vocabularyList} />;
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
    const favorite = await fetchWithRedis(
      `bookmark:${studentId}:lesson:${lessonId}`,
      120, // 2-min TTL — short enough to reflect user actions
      () => prisma.favoriteLesson.findUnique({
        where: { studentId_lessonId: { studentId, lessonId } }
      })
    );
    isBookmarked = !!favorite;
  }
  
  return (
    <div className="flex items-center gap-2">
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
    <div
      className="rounded-[28px] p-6 text-white shadow-2xl shadow-[#12A375]/30 relative overflow-hidden animate-in fade-in duration-500"
      style={{ background: 'linear-gradient(135deg, #12A375, #0B7A58)' }}
    >
      {/* Decorative blur circle */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-14 -mt-14 blur-2xl" />

      <div className="relative z-10 space-y-4">
        {/* Header row */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center border border-white/20 shrink-0">
            <AssignmentIcon className="w-5 h-5 text-white" />
          </div>
          <p className="text-white/70 text-[10px] font-black uppercase tracking-[0.2em]">Attached Assignment</p>
        </div>

        {/* Title */}
        <h3 className="font-headline text-xl font-black tracking-tight uppercase">{assignment.title}</h3>

        {/* Meta */}
        <div className="flex flex-col gap-2 text-xs font-bold">
          <span className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-white/60" />
            {assignment._count?.questions || 0} questions
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-white/60" />
            Auto-graded
          </span>
        </div>

        {/* CTA button */}
        <Link 
          href={sessionExists
            ? `/student/assignments/${assignment.slug || assignment.id}/run?direct=true`
            : `/public/assignments/${assignment.slug || assignment.id}?direct=true`
          }
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-[#0B7A58] rounded-full font-black text-xs tracking-[0.15em] uppercase hover:bg-emerald-50 transition-all hover:scale-105 active:scale-95"
        >
          Start Assignment
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
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

  // Build JSON-LD Course schema
  const canonicalUrl = `https://dolcake.com/public/lessons/${lesson.slug ?? lesson.id}`;
  const thumbnail = lesson.assignment?.thumbnail ?? "https://dolcake.com/images/og-image.png";
  const courseJsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: lesson.title,
    description:
      lesson.description ||
      `Learn English with "${lesson.title}" — an interactive lesson on Dolcake.`,
    url: canonicalUrl,
    provider: {
      "@type": "EducationalOrganization",
      name: "Dolcake",
      url: "https://dolcake.com",
      logo: "https://dolcake.com/images/og-image.png",
    },
    image: thumbnail,
    inLanguage: "en",
    isAccessibleForFree: true,
    ...(lesson.level && {
      educationalLevel: lesson.level,
    }),
    ...(lesson.learningGoals && lesson.learningGoals.length > 0 && {
      teaches: lesson.learningGoals,
    }),
    ...(lesson.targetAudiences && lesson.targetAudiences.length > 0 && {
      audience: {
        "@type": "EducationalAudience",
        educationalRole: "student",
        audienceType: lesson.targetAudiences.join(", "),
      },
    }),
    ...(lesson.teacher?.name && {
      creator: {
        "@type": "Person",
        name: lesson.teacher.name,
      },
    }),
    dateCreated: lesson.createdAt ? new Date(lesson.createdAt).toISOString() : undefined,
    dateModified: lesson.updatedAt ? new Date(lesson.updatedAt).toISOString() : undefined,
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: "PT15M",
      inLanguage: "en",
    },
  };

  return (
    <div className="min-h-screen font-body relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }}
      />


      <PublicHeader session={session as any} />

      {/* ===== 3-column layout ===== */}
      <div className="relative pt-10 pb-16">
        <div className="w-full flex flex-col lg:flex-row items-start gap-8 px-4 sm:px-6 md:px-10 max-w-[1600px] mx-auto">

          {/* === LEFT SIDEBAR: Key Vocabulary === */}
          <aside className="w-full lg:w-[300px] shrink-0">
            <div className="lg:sticky lg:top-6">
              <Suspense fallback={
                <div className="h-48 rounded-[28px] bg-white/50 animate-pulse shadow-xl hidden lg:block" />
              }>
                <KeyVocabularyWrapper lessonId={lesson.id} />
              </Suspense>
            </div>
          </aside>

          {/* === MAIN CONTENT === */}
          <main className="flex-1 min-w-0 space-y-8 w-full max-w-full">

            {/* Video Player */}
            {(videoId || lesson.videoUrl) && (
              <div className="aspect-video bg-black rounded-[24px] overflow-hidden shadow-2xl shadow-black/20 relative shrink-0 border border-white/10">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`}
                  title={lesson.title}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            {/* Main lesson card */}
            <div className="bg-white/85 backdrop-blur-xl rounded-[28px] p-4 sm:p-6 md:p-10 shadow-xl shadow-primary/5 border-2 border-emerald-100 max-w-full overflow-hidden">

              {/* Top bar: Level badge + Action buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 mb-4">
                <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider shadow">
                  {lesson.level
                    ? [...new Set(lesson.level.split(',').map((l: string) => l.trim()))].join(' / ')
                    : 'Pre-A1 / A1'}
                </span>
                <div className="flex items-center gap-3">
                  {/* Translate hint */}
                  <div className="flex items-center gap-1.5 select-none bg-amber-50 border border-amber-100 rounded-full px-3 py-1">
                    <Globe className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Tap word to translate</span>
                  </div>
                  <Suspense fallback={
                    <div className="flex gap-2">
                      <div className="w-10 h-10 bg-white/50 animate-pulse rounded-full" />
                      <div className="w-10 h-10 bg-white/50 animate-pulse rounded-full" />
                    </div>
                  }>
                    <PublicActionsWrapper lessonId={lesson.id} studentId={session?.id} />
                  </Suspense>
                </div>
              </div>

              {/* Title */}
              <h1 className="font-headline text-3xl sm:text-4xl font-black tracking-tight uppercase leading-tight">
                {lesson.title}
              </h1>

              {/* Tags */}
              <Suspense fallback={
                <div className="flex gap-2 mt-4">
                  <div className="w-16 h-6 bg-white/50 animate-pulse rounded-full" />
                </div>
              }>
                <PublicTagsWrapper lessonId={lesson.id} />
              </Suspense>

              {/* Audio Player */}
              {lesson.assignment && (lesson.audioUrl || lesson.assignment.audioUrl) && (
                <div className="mt-6">
                  <GlobalAudioPlayer audioUrl={lesson.audioUrl || lesson.assignment.audioUrl || ''} />
                </div>
              )}

              {/* Reading Content */}
              {lesson.assignment && (
                <div className="mt-8">
                  <Suspense fallback={<div className="h-96 bg-white/30 animate-pulse rounded-2xl" />}>
                    <PublicReadingContentWrapper lessonId={lesson.id} sessionExists={!!session} />
                  </Suspense>
                </div>
              )}
            </div>

            {/* Practice Questions Section */}
            <Suspense fallback={null}>
              <PublicQuestionsSectionWrapper lessonId={lesson.id} />
            </Suspense>

            {/* Section Divider & Reviews Section */}
            <div className="pt-4 border-t-2 border-dashed border-emerald-200/60">
              <Suspense fallback={
                <div className="h-64 rounded-[28px] bg-white/50 animate-pulse shadow-xl" />
              }>
                <PublicReviewsWrapper lessonId={lesson.id} isLoggedIn={!!session} />
              </Suspense>
            </div>
          </main>

          {/* === RIGHT SIDEBAR: Teacher + Related Lessons === */}
          <aside className="w-full lg:w-[320px] shrink-0">
            <div className="lg:sticky lg:top-6">
              <Suspense fallback={
                <div className="w-full h-64 bg-white/30 animate-pulse rounded-[28px]" />
              }>
                <PublicSidebarWrapper teacherId={lesson.teacherId} lessonId={lesson.id} isGuest={!session} />
              </Suspense>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
