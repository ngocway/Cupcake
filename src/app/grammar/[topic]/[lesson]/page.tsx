import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
import { getTopicById, GRAMMAR_TOPICS, CEFR_LEVELS } from "@/lib/grammar-taxonomy";
import { HomeShell } from "@/app/_components/HomeShell";
import { ChevronRight, BookOpen, ExternalLink, Clock, Calendar } from "lucide-react";
import { ExerciseCardHorizontal } from "@/components/public/ContentCards";
import { InstructionsBlock } from "@/components/common/InstructionsBlock";

interface Props {
  params: Promise<{ topic: string; lesson: string }>;
}

async function getGrammarPageData(topicId: string, lessonId: string) {
  const grammarLesson = await prisma.grammarLesson.findUnique({
    where: { id: lessonId },
    select: {
      instructions: true,
      instructionsTranslations: true,
      updatedAt: true,
    },
  });

  const relatedExercises = await prisma.assignment.findMany({
    where: { grammarLesson: lessonId, status: "PUBLIC", deletedAt: null },
    select: {
      id: true, slug: true, title: true, thumbnail: true,
      level: true, viewCount: true, tags: true,
      teacher: { select: { id: true, name: true, image: true } },
      _count: { select: { questions: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  return { grammarLesson, relatedExercises };
}

// Estimate reading time from HTML (strip tags, count words, 200 wpm)
function estimateReadingTime(html: string): number {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const words = text.split(" ").length;
  return Math.max(1, Math.ceil(words / 200));
}

function extractFaqItems(html: string): { q: string; a: string }[] {
  if (!html) return [];
  const tipMatches = [...html.matchAll(/<li[^>]*>💡\s*(.*?)<\/li>/gi)];
  return tipMatches.slice(0, 4).map((m) => {
    const tip = m[1].replace(/<[^>]+>/g, "").trim();
    return {
      q: `How do I remember: "${tip.slice(0, 60)}${tip.length > 60 ? "..." : ""}"?`,
      a: tip,
    };
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic, lesson } = await params;
  const topicCfg = getTopicById(topic);
  const lessonCfg = topicCfg?.lessons.find((l) => l.id === lesson);
  if (!topicCfg || !lessonCfg) return { title: "Grammar | Dolcake" };

  const canonicalPath = `/grammar/${topic}/${lesson}`;
  // SEO-optimised title: keyword-rich, natural
  const title = `${lessonCfg.label} Tense: Rules, Examples & Exercises | Dolcake`;
  const description = `Master the ${lessonCfg.label} with clear rules, grammar formulas, example sentences, memory tips, and ${lessonCfg.level.toUpperCase()} practice exercises. Free interactive English learning on Dolcake.`;

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description,
      url: `https://dolcake.com${canonicalPath}`,
      siteName: "Dolcake",
      type: "article",
      // OG image auto-served by opengraph-image.tsx in the same directory
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function GrammarLessonPage({ params }: Props) {
  const { topic, lesson } = await params;

  const topicCfg = getTopicById(topic);
  const lessonCfg = topicCfg?.lessons.find((l) => l.id === lesson);
  if (!topicCfg || !lessonCfg) notFound();

  const { grammarLesson, relatedExercises } = await getGrammarPageData(topic, lesson);
  const referenceExercise = relatedExercises[0];

  const lvlCfg = CEFR_LEVELS.find((l) => l.id === lessonCfg.level) ?? CEFR_LEVELS[0];
  const faqItems = grammarLesson ? extractFaqItems(grammarLesson.instructions ?? "") : [];
  const readingMins = grammarLesson?.instructions
    ? estimateReadingTime(grammarLesson.instructions)
    : null;
  const lastUpdated = grammarLesson?.updatedAt
    ? new Date(grammarLesson.updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : null;

  // Other lessons in the same topic (for internal linking)
  const siblingLessons = topicCfg.lessons.filter((l) => l.id !== lesson);

  const canonicalUrl = `https://dolcake.com/grammar/${topic}/${lesson}`;
  const description = `Master the ${lessonCfg.label} with clear rules, grammar formulas, example sentences, memory tips, and ${lessonCfg.level.toUpperCase()} practice exercises. Free interactive English learning on Dolcake.`;

  // JSON-LD: LearningResource + Course + BreadcrumbList + FAQPage
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": ["LearningResource", "Course"],
      name: `${lessonCfg.label} Grammar`,
      description,
      url: canonicalUrl,
      inLanguage: "en",
      isAccessibleForFree: true,
      educationalLevel: lessonCfg.level.toUpperCase(),
      about: { "@type": "Thing", name: topicCfg.label },
      provider: { "@type": "EducationalOrganization", name: "Dolcake", url: "https://dolcake.com" },
      hasCourseInstance: {
        "@type": "CourseInstance",
        courseMode: "online",
        inLanguage: "en",
      },
      ...(readingMins && { timeRequired: `PT${readingMins}M` }),
      ...(lastUpdated && { dateModified: referenceExercise?.updatedAt?.toISOString() }),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Grammar Exercises", item: "https://dolcake.com/?tab=exercises" },
        { "@type": "ListItem", position: 2, name: topicCfg.label, item: `https://dolcake.com/exercises/${lessonCfg.level}/${topic}` },
        { "@type": "ListItem", position: 3, name: lessonCfg.label, item: canonicalUrl },
      ],
    },
    ...(faqItems.length > 0 ? [{
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqItems.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    }] : []),
  ];

  return (
    <HomeShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="w-full pb-24 px-4 md:px-8 max-w-[1400px] mx-auto">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-400 flex-wrap pt-2 mb-6">
          <Link href="/?tab=exercises" className="hover:text-primary transition-colors font-medium">
            Grammar Exercises
          </Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <Link href={`/exercises/${lessonCfg.level}/${topic}`} className="hover:text-primary transition-colors font-medium">
            {topicCfg.icon} {topicCfg.label}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <span className="font-semibold text-slate-700 dark:text-slate-200">{lessonCfg.label}</span>
        </nav>

        {/* Hero */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${lvlCfg.bg} ${lvlCfg.color} border ${lvlCfg.border}`}>
              {lessonCfg.level.toUpperCase()}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <BookOpen className="w-3 h-3" />
              {topicCfg.label}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-slate-100 leading-tight mb-3">
            {lessonCfg.label}
          </h1>
          {/* Reading time + Last updated */}
          <div className="flex items-center gap-4 flex-wrap text-xs text-slate-400">
            {readingMins && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                ~{readingMins} min read
              </span>
            )}
            {lastUpdated && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Updated {lastUpdated}
              </span>
            )}
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              {relatedExercises.length} practice exercise{relatedExercises.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Main layout */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Left — grammar content */}
          <div className="flex-1 min-w-0">
            {grammarLesson?.instructions ? (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="p-6 md:p-8">
                  <InstructionsBlock
                    instructions={grammarLesson.instructions || ""}
                    instructionsTranslations={grammarLesson.instructionsTranslations as any}
                    isLoggedIn={false}
                    proseClassName="prose prose-slate max-w-none dark:prose-invert
                      [&_h2]:text-orange-500 [&_h2]:font-black [&_h2]:text-sm [&_h2]:uppercase [&_h2]:tracking-widest [&_h2]:mt-6 [&_h2]:mb-2
                      [&_p]:text-slate-700 [&_p]:dark:text-slate-300 [&_p]:leading-relaxed
                      [&_ul]:space-y-1.5 [&_li]:text-slate-700 [&_li]:dark:text-slate-300
                      [&_div]:rounded-lg"
                  />

                  {/* FAQ Section */}
                  {faqItems.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700">
                      <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-4">
                        ❓ Frequently Asked Questions
                      </h2>
                      <div className="space-y-4">
                        {faqItems.map((faq, i) => (
                          <details
                            key={i}
                            className="group bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-100 dark:border-slate-600 overflow-hidden"
                          >
                            <summary className="flex items-center justify-between gap-3 px-5 py-4 cursor-pointer font-semibold text-slate-800 dark:text-slate-100 text-sm list-none select-none">
                              <span>{faq.q}</span>
                              <ChevronRight className="w-4 h-4 shrink-0 text-slate-400 group-open:rotate-90 transition-transform" />
                            </summary>
                            <div className="px-5 pb-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-600 pt-3">
                              {faq.a}
                            </div>
                          </details>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-12 text-center">
                <p className="text-4xl mb-4">📚</p>
                <p className="font-bold text-slate-600 dark:text-slate-300">Grammar content coming soon.</p>
              </div>
            )}

            {/* Internal linking — other lessons in this topic */}
            {siblingLessons.length > 0 && (
              <div className="mt-8">
                <h2 className="text-base font-black text-slate-700 dark:text-slate-200 mb-3">
                  Other {topicCfg.label} lessons
                </h2>
                <div className="flex flex-wrap gap-2">
                  {siblingLessons.map((sib) => {
                    const sibLvl = CEFR_LEVELS.find((l) => l.id === sib.level) ?? CEFR_LEVELS[0];
                    return (
                      <Link
                        key={sib.id}
                        href={`/grammar/${topic}/${sib.id}`}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all hover:shadow-sm ${sibLvl.bg} ${sibLvl.color} ${sibLvl.border}`}
                      >
                        {sib.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right — related exercises */}
          <div className="w-full lg:w-[380px] shrink-0">
            <div className="sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-black text-slate-800 dark:text-slate-100 text-lg">
                  Practice Exercises
                </h2>
                <span className="text-xs font-semibold text-slate-400">
                  {relatedExercises.length} exercise{relatedExercises.length !== 1 ? "s" : ""}
                </span>
              </div>
              {relatedExercises.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-8 text-center">
                  <p className="text-3xl mb-3">📭</p>
                  <p className="text-sm text-slate-500">No exercises yet for this lesson.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {relatedExercises.map((ex) => (
                    <ExerciseCardHorizontal key={ex.id} item={ex} isLoggedIn={false} />
                  ))}
                </div>
              )}

              <Link
                href={`/exercises/${lessonCfg.level}/${topic}`}
                className="mt-5 flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:opacity-90 transition-opacity"
              >
                View all {topicCfg.label} exercises
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </HomeShell>
  );
}
