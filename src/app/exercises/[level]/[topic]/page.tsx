import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { CEFR_LEVELS, getTopicById } from "@/lib/grammar-taxonomy";
import { ChevronRight, BookOpen } from "lucide-react";
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

export default async function PublicExercisesTopicPage({ params, searchParams }: Props) {
  const { level, topic } = await params;
  const resolvedParams = await searchParams;

  const lvlCfg = CEFR_LEVELS.find((l) => l.id === level);
  const topicCfg = getTopicById(topic);
  if (!lvlCfg || !topicCfg) notFound();

  // ── Same cookie / auth pattern as page.tsx ──
  const cookieStore = await cookies();
  const userTypeCookie = cookieStore.get("user_type")?.value;
  let initialUserType = userTypeCookie || "learner";
  const studySubjectCookie = cookieStore.get("study_subject")?.value;
  const studyAgeGroupCookie = cookieStore.get("study_age_group")?.value;
  let studySubject = studySubjectCookie || "english";
  let studyAgeGroup = studyAgeGroupCookie || "";

  const session = await auth();
  const userId = session?.user?.id;

  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { userType: true, studySubject: true, studyAgeGroup: true },
    });
    if (user) {
      if (user.userType) initialUserType = user.userType;
      if (user.studySubject) studySubject = user.studySubject;
      if (user.studyAgeGroup) studyAgeGroup = user.studyAgeGroup;
    }
  }

  const isLoggedIn = !!userId;
  const exercises = await fetchExercises(level, topic, userId);

  const lessonsAtLevel = topicCfg.lessons.filter((l) => l.level === level);

  // Group by lesson
  const byLesson = new Map<string, typeof exercises>();
  for (const ex of exercises) {
    const key = (ex as any).grammarLesson ?? "__none__";
    if (!byLesson.has(key)) byLesson.set(key, []);
    byLesson.get(key)!.push(ex);
  }

  const levelDotColor =
    level === "a1" ? "bg-emerald-500" :
    level === "a2" ? "bg-sky-500" :
    level === "b1" ? "bg-amber-500" :
    level === "b2" ? "bg-orange-500" : "bg-rose-500";

  return (
    <HomeShell>
      <div className="w-full pb-20 flex flex-col lg:flex-row items-start gap-10 px-6 md:px-10 max-w-[1600px] mx-auto">
        {/* Sidebar — same as homepage */}
        <HomeSidebar
          searchParams={resolvedParams}
          initialUserType={initialUserType}
          studySubject={studySubject}
          studyAgeGroup={studyAgeGroup}
        />

        {/* Main content */}
        <main className="flex-1 min-w-0 space-y-8">
          {/* Breadcrumb */}
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



          {/* No exercises */}
          {exercises.length === 0 && (
            <div className="text-center py-24 text-slate-400">
              <p className="text-5xl mb-4">📭</p>
              <p className="font-bold text-lg">No exercises yet.</p>
              <p className="text-sm mt-2">
                Topic <strong>{topicCfg.label}</strong> has no exercises at {lvlCfg.label} level.
              </p>
              <Link
                href="/?tab=exercises"
                className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
              >
                ← Choose another topic
              </Link>
            </div>
          )}

          {/* Exercises grouped by lesson */}
          {exercises.length > 0 && (
            <div className="space-y-10">
              {lessonsAtLevel.map((lesson) => {
                const lessonExs = byLesson.get(lesson.id) ?? [];
                if (lessonExs.length === 0) return null;
                return (
                  <div key={lesson.id}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black ${lvlCfg.bg} ${lvlCfg.border} border`}>
                        <BookOpen className={`w-3.5 h-3.5 ${lvlCfg.color}`} />
                        <span className={lvlCfg.color}>{lesson.label}</span>
                      </div>
                      <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                      <span className="text-xs text-slate-400 font-medium shrink-0">{lessonExs.length} bài</span>
                    </div>
                    <ExerciseGrid exercises={lessonExs} isLoggedIn={isLoggedIn} />
                  </div>
                );
              })}

              {/* Exercises without matched lesson */}
              {byLesson.has("__none__") && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black ${lvlCfg.bg} ${lvlCfg.border} border`}>
                      <span className={lvlCfg.color}>Khác</span>
                    </div>
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                  </div>
                  <ExerciseGrid exercises={byLesson.get("__none__") ?? []} isLoggedIn={isLoggedIn} />
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </HomeShell>
  );
}
