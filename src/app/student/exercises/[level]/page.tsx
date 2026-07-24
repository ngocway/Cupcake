import { notFound } from "next/navigation";
import Link from "next/link";
import { getTopicsProgressForLevel } from "../actions";
import { CEFR_LEVELS, GRAMMAR_TOPICS, getTopicsForLevel } from "@/lib/grammar-taxonomy";
import { ArrowLeft, ChevronRight } from "lucide-react";

interface Props {
  params: Promise<{ level: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { level } = await params;
  const lvlCfg = CEFR_LEVELS.find((l) => l.id === level);
  return {
    title: `${lvlCfg?.label ?? level.toUpperCase()} Grammar Exercises`,
  };
}

export default async function ExercisesLevelPage({ params }: Props) {
  const { level } = await params;
  const lvlCfg = CEFR_LEVELS.find((l) => l.id === level);
  if (!lvlCfg) notFound();

  const [topicProgressMap] = await Promise.all([
    getTopicsProgressForLevel(level),
  ]);

  const topicsAtLevel = getTopicsForLevel(level);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Link
          href="/student/exercises"
          className="hover:text-primary transition-colors flex items-center gap-1 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Grammar Exercises
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className={`font-black ${lvlCfg.color}`}>{lvlCfg.label}</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div
          className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center ${lvlCfg.bg} ${lvlCfg.border} border shadow-sm`}
        >
          <div
            className={`w-3 h-3 rounded-full mb-0.5 ${
              level === "a1" ? "bg-emerald-500" :
              level === "a2" ? "bg-sky-500" :
              level === "b1" ? "bg-amber-500" :
              level === "b2" ? "bg-orange-500" : "bg-rose-500"
            }`}
          />
          <span className={`text-lg font-black ${lvlCfg.color}`}>{lvlCfg.label}</span>
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Level {lvlCfg.label}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
            {topicsAtLevel.length} {topicsAtLevel.length === 1 ? "topic" : "topics"} · Select a topic to view lessons
          </p>
        </div>
      </div>

      {/* Topics Grid */}
      {topicsAtLevel.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <p className="text-4xl mb-4">📭</p>
          <p className="font-bold">No exercises available at this level.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {topicsAtLevel.map((topic) => {
            const progress = topicProgressMap.get(topic.id);
            const total = progress?.total ?? 0;
            const completed = progress?.completed ?? 0;
            const lessonCount = topic.lessons.filter((l) => l.level === level).length;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

            return (
              <Link
                key={topic.id}
                href={`/student/exercises/${level}/${topic.id}`}
                className={`group flex flex-col gap-4 p-5 bg-white dark:bg-slate-800 border rounded-3xl transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 ${
                  total > 0
                    ? `border-slate-100 dark:border-slate-700 hover:border-primary/30`
                    : "border-slate-100 dark:border-slate-700 opacity-70"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{topic.icon}</span>
                    <div>
                      <h3 className="font-extrabold text-slate-800 dark:text-white text-sm leading-tight group-hover:text-primary transition-colors">
                        {topic.label}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">{topic.labelVi}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-slate-500">{lessonCount} {lessonCount === 1 ? "lesson" : "lessons"}</p>
                    {total > 0 && (
                      <p className="text-xs text-slate-400">{total} {total === 1 ? "exercise" : "exercises"}</p>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                {total > 0 ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-400">
                        {completed}/{total} completed
                      </span>
                      <span
                        className={pct === 100 ? "text-emerald-500" : "text-slate-400"}
                      >
                        {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          pct === 100
                            ? "bg-emerald-500"
                            : level === "a1" ? "bg-emerald-400" :
                              level === "a2" ? "bg-sky-400" :
                              level === "b1" ? "bg-amber-400" :
                              level === "b2" ? "bg-orange-400" : "bg-rose-400"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-300 dark:text-slate-600 italic">
                    No exercises yet
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
