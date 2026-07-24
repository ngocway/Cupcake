import { auth } from "@/auth";
import Link from "next/link";
import { getAvailableLevels, getResumeExercises } from "./actions";
import { CEFR_LEVELS, getTopicById, ALL_LESSONS_FLAT, normalizeLevelId } from "@/lib/grammar-taxonomy";
import { Search, BookOpen, ArrowRight, Clock, ChevronRight } from "lucide-react";

export const metadata = {
  title: "Grammar Exercises",
  description: "Practice English grammar by topic and level",
};

export default async function ExercisesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const session = await auth();

  const [availableLevels, resumeItems] = await Promise.all([
    getAvailableLevels(),
    getResumeExercises(),
  ]);

  const levelCountMap = new Map(availableLevels.map((l) => [l.level, l.count]));

  // Search: match lesson labels or topic labels
  const searchResults =
    q && q.length >= 2
      ? ALL_LESSONS_FLAT.filter(
          (l) =>
            l.label.toLowerCase().includes(q.toLowerCase()) ||
            l.topicLabel.toLowerCase().includes(q.toLowerCase())
        ).slice(0, 12)
      : [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          📚 Grammar Exercises
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
          Chọn level → chủ đề → bài học để luyện tập ngữ pháp
        </p>
      </div>

      {/* Search */}
      <form method="GET" className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Tìm bài học... (e.g. Past Simple, Present Perfect)"
          className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm font-medium shadow-sm"
        />
      </form>

      {/* Search Results */}
      {q && q.length >= 2 && (
        <div className="space-y-3">
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest">
            Kết quả tìm kiếm cho &ldquo;{q}&rdquo;
          </h2>
          {searchResults.length === 0 ? (
            <p className="text-sm text-slate-400">Không tìm thấy bài học nào.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {searchResults.map((lesson) => (
                <Link
                  key={`${lesson.topicId}-${lesson.id}`}
                  href={`/student/exercises/${lesson.level}/${lesson.topicId}`}
                  className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl hover:border-primary/40 hover:shadow-md transition-all group"
                >
                  <span className="text-2xl">{lesson.topicIcon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-800 dark:text-white truncate group-hover:text-primary transition-colors">
                      {lesson.label}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{lesson.topicLabel}</p>
                  </div>
                  <LevelBadge level={lesson.level} />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Resume Section */}
      {!q && resumeItems.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            Tiếp tục học
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {resumeItems.map((item) => {
              const topic = item.grammarTopic ? getTopicById(item.grammarTopic) : null;
              const normalLevel = normalizeLevelId(item.level) ?? "a1";
              return (
                <Link
                  key={item.id}
                  href={`/student/assignments/${item.slug || item.id}`}
                  className="flex items-center gap-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-2xl hover:shadow-md transition-all group"
                >
                  <span className="text-2xl">{topic?.icon ?? "📝"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-800 dark:text-white truncate group-hover:text-primary transition-colors">
                      {item.title}
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                      Đang làm dở...
                    </p>
                  </div>
                  <LevelBadge level={normalLevel} />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Level Selection */}
      {!q && (
        <div className="space-y-4">
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest">
            Chọn trình độ
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CEFR_LEVELS.map((lvl) => {
              const count = levelCountMap.get(lvl.id) ?? 0;
              const hasContent = count > 0;
              return (
                <Link
                  key={lvl.id}
                  href={hasContent ? `/student/exercises/${lvl.id}` : "#"}
                  className={`relative flex items-center gap-5 p-5 rounded-3xl border transition-all duration-300 ${
                    hasContent
                      ? `${lvl.bg} ${lvl.border} hover:shadow-lg hover:-translate-y-0.5 cursor-pointer`
                      : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-50 cursor-not-allowed"
                  }`}
                >
                  {/* Level circle */}
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                      hasContent ? "bg-white/70" : "bg-white/40"
                    }`}
                  >
                    <div className="text-center">
                      <div
                        className={`w-3 h-3 rounded-full mx-auto mb-0.5 ${
                          lvl.id === "a1" ? "bg-emerald-500" :
                          lvl.id === "a2" ? "bg-sky-500" :
                          lvl.id === "b1" ? "bg-amber-500" :
                          lvl.id === "b2" ? "bg-orange-500" : "bg-rose-500"
                        }`}
                      />
                      <span className={`text-sm font-black ${lvl.color}`}>{lvl.label}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-extrabold text-base ${lvl.color}`}>{lvl.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      {count > 0 ? `${count} bài tập` : "Chưa có bài tập"}
                    </p>
                  </div>
                  {hasContent && (
                    <ArrowRight className={`w-5 h-5 shrink-0 ${lvl.color} opacity-60 group-hover:opacity-100`} />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function LevelBadge({ level }: { level: string }) {
  const cfg = CEFR_LEVELS.find((l) => l.id === level.toLowerCase());
  if (!cfg) return null;
  return (
    <span
      className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${cfg.bg} ${cfg.color} ${cfg.border} border`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${
        cfg.id === "a1" ? "bg-emerald-500" :
        cfg.id === "a2" ? "bg-sky-500" :
        cfg.id === "b1" ? "bg-amber-500" :
        cfg.id === "b2" ? "bg-orange-500" : "bg-rose-500"
      }`} />
      {cfg.label}
    </span>
  );
}
