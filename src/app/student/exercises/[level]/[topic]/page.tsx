import { notFound } from "next/navigation";
import Link from "next/link";
import { getExercisesForTopic } from "../../actions";
import { CEFR_LEVELS, getTopicById, ALL_LESSONS_FLAT } from "@/lib/grammar-taxonomy";
import { ArrowLeft, ChevronRight, PlayCircle, CheckCircle2, Clock, RotateCcw, BookOpen } from "lucide-react";

interface Props {
  params: Promise<{ level: string; topic: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { level, topic } = await params;
  const topicCfg = getTopicById(topic);
  const lvlCfg = CEFR_LEVELS.find((l) => l.id === level);
  return {
    title: `${topicCfg?.label ?? topic} — ${lvlCfg?.label ?? level.toUpperCase()} Exercises`,
  };
}

export default async function ExercisesTopicPage({ params }: Props) {
  const { level, topic } = await params;
  const lvlCfg = CEFR_LEVELS.find((l) => l.id === level);
  const topicCfg = getTopicById(topic);
  if (!lvlCfg || !topicCfg) notFound();

  const exercises = await getExercisesForTopic(level, topic);

  // Group by lesson
  const lessonsAtLevel = topicCfg.lessons.filter((l) => l.level === level);
  const byLesson = new Map<string, typeof exercises>();
  for (const ex of exercises) {
    const key = ex.grammarLesson ?? "__none__";
    if (!byLesson.has(key)) byLesson.set(key, []);
    byLesson.get(key)!.push(ex);
  }

  const completedCount = exercises.filter((e) => e.status === "COMPLETED").length;
  const totalCount = exercises.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const levelDotColor =
    level === "a1" ? "bg-emerald-500" :
    level === "a2" ? "bg-sky-500" :
    level === "b1" ? "bg-amber-500" :
    level === "b2" ? "bg-orange-500" : "bg-rose-500";

  const levelBarColor =
    level === "a1" ? "bg-emerald-400" :
    level === "a2" ? "bg-sky-400" :
    level === "b1" ? "bg-amber-400" :
    level === "b2" ? "bg-orange-400" : "bg-rose-400";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400 flex-wrap">
        <Link href="/student/exercises" className="hover:text-primary transition-colors font-medium flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          Grammar Exercises
        </Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <Link href={`/student/exercises/${level}`} className={`hover:text-primary transition-colors font-black ${lvlCfg.color}`}>
          {lvlCfg.label}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <span className="font-semibold text-slate-600 dark:text-slate-300">
          {topicCfg.icon} {topicCfg.label}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <span className="text-5xl">{topicCfg.icon}</span>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">{topicCfg.label}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-0.5">
              {topicCfg.labelVi} ·{" "}
              <span className={`inline-flex items-center gap-1 font-black ${lvlCfg.color}`}>
                <span className={`w-2 h-2 rounded-full ${levelDotColor}`} />
                {lvlCfg.label}
              </span>
            </p>
          </div>
        </div>
        {totalCount > 0 && (
          <div className={`shrink-0 text-right px-5 py-3 rounded-2xl ${lvlCfg.bg} ${lvlCfg.border} border`}>
            <p className={`text-2xl font-black ${lvlCfg.color}`}>{completedCount}/{totalCount}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">bài tập hoàn thành</p>
          </div>
        )}
      </div>

      {/* Overall progress bar */}
      {totalCount > 0 && (
        <div className="space-y-1.5">
          <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${pct === 100 ? "bg-emerald-500" : levelBarColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 font-medium text-right">{pct}% hoàn thành</p>
        </div>
      )}

      {/* Content */}
      {totalCount === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <p className="text-5xl mb-4">📭</p>
          <p className="font-bold text-lg">Chưa có bài tập nào.</p>
          <p className="text-sm mt-2">Chủ đề này chưa có bài tập ở trình độ {lvlCfg.label}.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Render lessons in taxonomy order, skip lessons with no exercises */}
          {lessonsAtLevel.map((lesson) => {
            const lessonExercises = byLesson.get(lesson.id) ?? [];
            if (lessonExercises.length === 0) return null;

            const lessonCompleted = lessonExercises.filter((e) => e.status === "COMPLETED").length;
            const lessonTotal = lessonExercises.length;
            const lessonPct = Math.round((lessonCompleted / lessonTotal) * 100);
            const allDone = lessonCompleted === lessonTotal;

            return (
              <div key={lesson.id} className="space-y-3">
                {/* Lesson header */}
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black ${lvlCfg.bg} ${lvlCfg.border} border`}>
                    <BookOpen className={`w-3.5 h-3.5 ${lvlCfg.color}`} />
                    <span className={lvlCfg.color}>{lesson.label}</span>
                  </div>
                  {lessonTotal > 0 && (
                    <span className="text-xs text-slate-400 font-medium">
                      {lessonCompleted}/{lessonTotal}
                      {allDone && <span className="ml-1 text-emerald-500">✓</span>}
                    </span>
                  )}
                  <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                </div>

                {/* Exercise cards */}
                <div className="space-y-2.5 pl-1">
                  {lessonExercises.map((ex, idx) => {
                    const href = `/student/assignments/${ex.slug || ex.id}`;
                    const isCompleted = ex.status === "COMPLETED";
                    const isInProgress = ex.status === "IN_PROGRESS";

                    return (
                      <Link
                        key={ex.id}
                        href={href}
                        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 hover:shadow-md group ${
                          isCompleted
                            ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/40 hover:border-emerald-300"
                            : isInProgress
                            ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/40 hover:border-amber-300"
                            : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-primary/30"
                        }`}
                      >
                        {/* Thumbnail */}
                        {ex.thumbnail ? (
                          <div className="w-16 h-11 rounded-xl overflow-hidden shrink-0 shadow-sm">
                            <img
                              src={ex.thumbnail}
                              alt={ex.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                        ) : (
                          <div className={`w-16 h-11 rounded-xl shrink-0 flex items-center justify-center font-black text-sm ${
                            isCompleted ? "bg-emerald-500 text-white" :
                            isInProgress ? "bg-amber-500 text-white" :
                            `${lvlCfg.bg} ${lvlCfg.color}`
                          }`}>
                            {idx + 1}
                          </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-slate-800 dark:text-white truncate group-hover:text-primary transition-colors">
                            {ex.title}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {ex.questionCount} câu hỏi
                            {ex.score !== null && (
                              <span className="ml-2 font-bold text-emerald-600 dark:text-emerald-400">
                                · Điểm: {typeof ex.score === "number" ? ex.score.toFixed(1) : ex.score}
                              </span>
                            )}
                          </p>
                        </div>

                        {/* Status chip */}
                        <div className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wide ${
                          isCompleted
                            ? "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40"
                            : isInProgress
                            ? "text-white bg-amber-500"
                            : `${lvlCfg.color} ${lvlCfg.bg}`
                        }`}>
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
              </div>
            );
          })}

          {/* Exercises without a matched lesson (safety net) */}
          {byLesson.has("__none__") && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black ${lvlCfg.bg} ${lvlCfg.border} border`}>
                  <span className={lvlCfg.color}>Khác</span>
                </div>
                <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
              </div>
              <div className="space-y-2.5 pl-1">
                {(byLesson.get("__none__") ?? []).map((ex) => {
                  const href = `/student/assignments/${ex.slug || ex.id}`;
                  const isCompleted = ex.status === "COMPLETED";
                  const isInProgress = ex.status === "IN_PROGRESS";
                  return (
                    <Link
                      key={ex.id}
                      href={href}
                      className={`flex items-center gap-4 p-4 rounded-2xl border transition-all hover:shadow-md group ${
                        isCompleted ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200" :
                        isInProgress ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200" :
                        "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-primary/30"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-slate-800 dark:text-white truncate group-hover:text-primary transition-colors">{ex.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{ex.questionCount} câu hỏi</p>
                      </div>
                      <div className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black ${
                        isCompleted ? "text-emerald-600 bg-emerald-100" :
                        isInProgress ? "text-white bg-amber-500" :
                        `${lvlCfg.color} ${lvlCfg.bg}`
                      }`}>
                        {isCompleted ? <><RotateCcw className="w-3 h-3" /> Ôn lại</> :
                         isInProgress ? <><Clock className="w-3 h-3" /> Tiếp tục</> :
                         <><PlayCircle className="w-3 h-3" /> Làm bài</>}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
