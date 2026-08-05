import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { CEFR_LEVELS, getTopicById } from "@/lib/grammar-taxonomy";
import { ChevronRight, BookOpen, ExternalLink } from "lucide-react";
import { HomeShell } from "@/app/_components/HomeShell";
import { HomeSidebar } from "@/app/_components/HomeSidebar";
import { ExerciseGrid } from "./ExerciseGrid";

interface Props {
  params: Promise<{ level: string; topic: string }>;
  searchParams: Promise<any>;
}

export async function generateMetadata({ params }: Props) {
  const { level, topic } = await params;
  const topicCfg = getTopicById(topic);
  const lvlCfg = CEFR_LEVELS.find((l) => l.id === level);
  return {
    title: `${topicCfg?.label ?? topic} — ${lvlCfg?.label ?? level.toUpperCase()} Exercises | Dolcake`,
    description: `Practice ${topicCfg?.label ?? topic} grammar exercises at ${lvlCfg?.label ?? level} level.`,
  };
}

async function fetchExercises(level: string, topicId: string, userId?: string) {
  const baseWhere = {
    materialType: "EXERCISE" as const,
    status: "PUBLIC" as const,
    deletedAt: null as null,
    grammarTopic: topicId,
    level: { in: [level, level.toUpperCase()] },
  };

  if (userId) {
    return prisma.assignment.findMany({
      where: baseWhere,
      select: {
        id: true, slug: true, title: true, thumbnail: true,
        level: true, grammarLesson: true, viewCount: true,
        tags: true, videoUrl: true, audioUrl: true,
        teacher: { select: { id: true, name: true, image: true } },
        _count: { select: { questions: true } },
        submissions: {
          where: { studentId: userId },
          select: { submittedAt: true, score: true },
          orderBy: { submittedAt: "desc" as const },
          take: 1,
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  return prisma.assignment.findMany({
    where: baseWhere,
    select: {
      id: true, slug: true, title: true, thumbnail: true,
      level: true, grammarLesson: true, viewCount: true,
      tags: true, videoUrl: true, audioUrl: true,
      teacher: { select: { id: true, name: true, image: true } },
      _count: { select: { questions: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

async function ExerciseListSection({
  level,
  topic,
  userId,
  lessonsAtLevel,
  lvlCfg
}: {
  level: string;
  topic: string;
  userId?: string;
  lessonsAtLevel: any[];
  lvlCfg: any;
}) {
  const isLoggedIn = !!userId;
  const exercises = await fetchExercises(level, topic, userId);

  const LESSON_PILL_COLORS = [
    { bg: "bg-emerald-500", text: "text-white", icon: "text-white" },
    { bg: "bg-sky-500",     text: "text-white", icon: "text-white" },
    { bg: "bg-violet-500", text: "text-white", icon: "text-white" },
    { bg: "bg-amber-500",  text: "text-white", icon: "text-white" },
    { bg: "bg-rose-500",   text: "text-white", icon: "text-white" },
    { bg: "bg-teal-500",   text: "text-white", icon: "text-white" },
    { bg: "bg-pink-500",   text: "text-white", icon: "text-white" },
    { bg: "bg-orange-500", text: "text-white", icon: "text-white" },
    { bg: "bg-indigo-500", text: "text-white", icon: "text-white" },
    { bg: "bg-cyan-500",   text: "text-white", icon: "text-white" },
  ];

  let lessonColorIndex = 0;

  const byLesson = new Map<string, typeof exercises>();
  for (const ex of exercises) {
    const key = (ex as any).grammarLesson ?? "__none__";
    if (!byLesson.has(key)) byLesson.set(key, []);
    byLesson.get(key)!.push(ex);
  }

  if (lessonsAtLevel.length === 0) {
    return (
      <div className="text-center py-24 text-slate-400">
        <p className="text-5xl mb-4">📭</p>
        <p className="font-bold text-lg">No lessons yet.</p>
        <Link
          href="/?tab=exercises"
          className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
        >
          ← Choose another topic
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {lessonsAtLevel.map((lesson) => {
        const lessonExs = byLesson.get(lesson.id) ?? [];
        const pillColor = LESSON_PILL_COLORS[lessonColorIndex % LESSON_PILL_COLORS.length];
        lessonColorIndex++;
        return (
          <div key={lesson.id}>
            <div className="flex items-center gap-3 mb-4">
              <Link
                href={`/grammar/${topic}/${lesson.id}`}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black ${pillColor.bg} hover:opacity-90 transition-opacity`}
              >
                <BookOpen className={`w-3.5 h-3.5 ${pillColor.icon}`} />
                <span className={pillColor.text}>{lesson.label}</span>
                <ExternalLink className={`w-3 h-3 ${pillColor.icon} opacity-70`} />
              </Link>
              <Link
                href={`/grammar/${topic}/${lesson.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-amber-500 hover:text-amber-400 hover:underline underline-offset-2 shrink-0 transition-colors"
              >
                View grammar lesson
              </Link>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
              <span className="text-xs text-slate-400 font-medium shrink-0">{lessonExs.length} exercise{lessonExs.length !== 1 ? "s" : ""}</span>
            </div>
            {lessonExs.length === 0 ? (
              <p className="text-xs italic text-slate-400 pl-4 py-2">No practice exercises available yet.</p>
            ) : (
              <ExerciseGrid exercises={lessonExs} isLoggedIn={isLoggedIn} />
            )}
          </div>
        );
      })}

      {byLesson.has("__none__") && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black ${lvlCfg.bg} ${lvlCfg.border} border`}>
              <span className={lvlCfg.color}>Other</span>
            </div>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
          </div>
          <ExerciseGrid exercises={byLesson.get("__none__") ?? []} isLoggedIn={isLoggedIn} />
        </div>
      )}
    </div>
  );
}

function ExerciseListSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-48" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="aspect-video bg-slate-100 dark:bg-slate-800/50 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export default async function PublicExercisesTopicPage({ params, searchParams }: Props) {
  const { level, topic } = await params;
  const resolvedParams = await searchParams;

  const lvlCfg = CEFR_LEVELS.find((l) => l.id === level);
  const topicCfg = getTopicById(topic);
  if (!lvlCfg || !topicCfg) notFound();

  const cookieStore = await cookies();
  const userTypeCookie = cookieStore.get("user_type")?.value;
  let initialUserType = userTypeCookie || "learner";
  const studySubjectCookie = cookieStore.get("study_subject")?.value;
  const studyAgeGroupCookie = cookieStore.get("study_age_group")?.value;
  let studySubject = studySubjectCookie || "english";
  let studyAgeGroup = studyAgeGroupCookie || "";

  const session = await auth();
  const userId = session?.user?.id;

  const lessonsAtLevel = topicCfg.lessons.filter((l) => l.level === level);

  const levelDotColor =
    level === "a1" ? "bg-emerald-500" :
    level === "a2" ? "bg-sky-500" :
    level === "b1" ? "bg-amber-500" :
    level === "b2" ? "bg-orange-500" : "bg-rose-500";

  return (
    <HomeShell>
      <div className="w-full pb-20 flex flex-col lg:flex-row items-start gap-2 lg:gap-10 px-4 md:px-10 max-w-[1600px] mx-auto">
        <HomeSidebar
          searchParams={resolvedParams}
          initialUserType={initialUserType}
          studySubject={studySubject}
          studyAgeGroup={studyAgeGroup}
        />

        <main className="flex-1 min-w-0 space-y-2 lg:space-y-8">
          <div className="flex items-center gap-2 text-sm text-slate-400 flex-wrap pt-2">
            <Link href="/?tab=exercises" className="hover:text-primary transition-colors font-medium">
              Grammar Exercises
            </Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <span className={`inline-flex items-center gap-1 font-black ${lvlCfg.color}`}>
              <span className={`w-2 h-2 rounded-full ${levelDotColor}`} />
              {lvlCfg.label}
            </span>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <span className="font-semibold text-slate-600 dark:text-slate-300">
              {topicCfg.icon} {topicCfg.label}
            </span>
          </div>

          <Suspense fallback={<ExerciseListSkeleton />}>
            <ExerciseListSection
              level={level}
              topic={topic}
              userId={userId}
              lessonsAtLevel={lessonsAtLevel}
              lvlCfg={lvlCfg}
            />
          </Suspense>
        </main>
      </div>
    </HomeShell>
  );
}
