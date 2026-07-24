import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getExercisesForLesson } from "../../../actions";
import { CEFR_LEVELS, getTopicById, ALL_LESSONS_FLAT } from "@/lib/grammar-taxonomy";
import { ArrowLeft, ChevronRight, PlayCircle, CheckCircle2, Clock, RotateCcw } from "lucide-react";

interface Props {
  params: Promise<{ level: string; topic: string; lesson: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { lesson, level } = await params;
  const lessonMeta = ALL_LESSONS_FLAT.find((l) => l.id === lesson);
  return { title: `${lessonMeta?.label ?? lesson} — Exercises` };
}

export default async function ExercisesLessonPage({ params }: Props) {
  const { level, topic, lesson } = await params;
  const session = await auth();
  if (!session || session.user?.role !== "STUDENT") redirect("/student/login");

  const lvlCfg = CEFR_LEVELS.find((l) => l.id === level);
  const topicCfg = getTopicById(topic);
  const lessonMeta = ALL_LESSONS_FLAT.find((l) => l.id === lesson);
  if (!lvlCfg || !topicCfg || !lessonMeta) notFound();

  const exercises = await getExercisesForLesson(level, topic, lesson);

  const completedCount = exercises.filter((e) => e.status === "COMPLETED").length;
  const totalCount = exercises.length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400 flex-wrap">
        <Link href="/student/exercises" className="hover:text-primary transition-colors font-medium">
          Grammar Exercises
        </Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <Link href={`/student/exercises/${level}`} className={`hover:text-primary font-black ${lvlCfg.color}`}>
          {lvlCfg.label}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <Link href={`/student/exercises/${level}/${topic}`} className="hover:text-primary transition-colors font-medium">
          {topicCfg.icon} {topicCfg.label}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <span className="font-medium text-slate-600 dark:text-slate-300">{lessonMeta.label}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">{lessonMeta.label}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">
            {topicCfg.icon} {topicCfg.label} ·{" "}
            <span className={`font-black ${lvlCfg.color}`}>{lvlCfg.label}</span>
          </p>
        </div>
        {totalCount > 0 && (
          <div className={`text-right shrink-0 px-4 py-2 rounded-2xl ${lvlCfg.bg} ${lvlCfg.border} border`}>
            <p className={`text-2xl font-black ${lvlCfg.color}`}>{completedCount}/{totalCount}</p>
            <p className="text-xs text-slate-500 font-medium">completed</p>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="space-y-2">
          <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                completedCount === totalCount ? "bg-emerald-500" :
                level === "a1" ? "bg-emerald-400" :
                level === "a2" ? "bg-sky-400" :
                level === "b1" ? "bg-amber-400" :
                level === "b2" ? "bg-orange-400" : "bg-rose-400"
              }`}
              style={{ width: `${totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Exercise list */}
      {exercises.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <p className="text-4xl mb-4">📭</p>
          <p className="font-bold">No exercises for this lesson yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {exercises.map((ex, idx) => {
            const href = `/student/assignments/${ex.slug || ex.id}`;
            const isCompleted = ex.status === "COMPLETED";
            const isInProgress = ex.status === "IN_PROGRESS";

            return (
              <Link
                key={ex.id}
                href={href}
                className={`flex items-center gap-4 p-5 rounded-2xl border transition-all duration-200 hover:shadow-md ${
                  isCompleted
                    ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/40 hover:border-emerald-300"
                    : isInProgress
                    ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/40 hover:border-amber-300"
                    : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-primary/30"
                }`}
              >
                {/* Index + status */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-black text-sm ${
                    isCompleted
                      ? "bg-emerald-500 text-white"
                      : isInProgress
                      ? "bg-amber-500 text-white"
                      : `${lvlCfg.bg} ${lvlCfg.color}`
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : isInProgress ? (
                    <Clock className="w-4 h-4" />
                  ) : (
                    idx + 1
                  )}
                </div>

                {/* Title */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-slate-800 dark:text-white truncate">
                    {ex.title}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                     {ex.questionCount} {ex.questionCount === 1 ? "question" : "questions"}
                    {ex.score !== null && (
                      <span className="ml-2 font-bold text-emerald-600">
                        · Score: {typeof ex.score === "number" ? ex.score.toFixed(1) : ex.score}
                      </span>
                    )}
                  </p>
                </div>

                {/* CTA */}
                <div
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wide ${
                    isCompleted
                      ? "text-emerald-600 bg-emerald-100"
                      : isInProgress
                      ? "text-white bg-amber-500"
                      : `${lvlCfg.color} ${lvlCfg.bg}`
                  }`}
                >
                  {isCompleted ? (
                    <><RotateCcw className="w-3 h-3" /> Ôn lại</>
                  ) : isInProgress ? (
                    <><Clock className="w-3 h-3" /> Tiếp tục</>
                  ) : (
                    <><PlayCircle className="w-3 h-3" /> Làm bài</>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
