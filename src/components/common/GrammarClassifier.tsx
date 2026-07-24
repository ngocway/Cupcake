"use client";

import { CEFR_LEVELS, GRAMMAR_TOPICS, getTopicsForLevel, getTopicById, type CefrLevel } from "@/lib/grammar-taxonomy";

const LEVEL_BADGE: Record<string, string> = {
  a1: "bg-emerald-500 text-white",
  a2: "bg-sky-500 text-white",
  b1: "bg-amber-500 text-white",
  b2: "bg-orange-500 text-white",
  c1: "bg-rose-500 text-white",
};

const LEVEL_SELECTED_RING: Record<string, string> = {
  a1: "ring-2 ring-emerald-400",
  a2: "ring-2 ring-sky-400",
  b1: "ring-2 ring-amber-400",
  b2: "ring-2 ring-orange-400",
  c1: "ring-2 ring-rose-400",
};

interface GrammarClassifierProps {
  level: string;
  setLevel: (v: string) => void;
  grammarTopic: string;
  setGrammarTopic: (v: string) => void;
  grammarLesson: string;
  setGrammarLesson: (v: string) => void;
  /** Fields that were just auto-detected — will flash briefly */
  highlightedFields?: ("level" | "grammarTopic" | "grammarLesson")[];
}

export function GrammarClassifier({
  level,
  setLevel,
  grammarTopic,
  setGrammarTopic,
  grammarLesson,
  setGrammarLesson,
  highlightedFields = [],
}: GrammarClassifierProps) {
  const availableTopics = level ? getTopicsForLevel(level) : [];
  const selectedTopic = grammarTopic ? getTopicById(grammarTopic) : null;
  const availableLessons = selectedTopic
    ? selectedTopic.lessons.filter((l) => l.level === level)
    : [];

  const hlLevel = highlightedFields.includes("level");
  const hlTopic = highlightedFields.includes("grammarTopic");
  const hlLesson = highlightedFields.includes("grammarLesson");

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
        <span className="text-base">📚</span> Phân loại ngữ pháp
      </h3>

      {/* Step 1 — Level */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
          Bước 1 — Trình độ (Level)
        </label>
        <div className="flex flex-wrap gap-2">
          {CEFR_LEVELS.map((lvl) => (
            <button
              key={lvl.id}
              type="button"
              onClick={() => {
                setLevel(lvl.id);
                setGrammarTopic("");
                setGrammarLesson("");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                LEVEL_BADGE[lvl.id]
              } ${
                level === lvl.id
                  ? `${LEVEL_SELECTED_RING[lvl.id]} opacity-100 scale-105 ${hlLevel ? "animate-pulse ring-4" : ""}`
                  : "opacity-40 hover:opacity-70"
              }`}
            >
              {lvl.label}
            </button>
          ))}
          {level && (
            <button
              type="button"
              onClick={() => { setLevel(""); setGrammarTopic(""); setGrammarLesson(""); }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              ✕ Bỏ chọn
            </button>
          )}
        </div>
      </div>

      {/* Step 2 — Topic (only show if level selected) */}
      {level && (
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
            Bước 2 — Chủ đề (Topic)
          </label>
          {availableTopics.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Không có chủ đề nào ở trình độ {level.toUpperCase()}.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableTopics.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setGrammarTopic(grammarTopic === t.id ? "" : t.id);
                    setGrammarLesson("");
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    grammarTopic === t.id
                      ? `bg-primary text-white border-primary shadow-sm ${hlTopic ? "ring-2 ring-primary/50 scale-105 animate-pulse" : ""}`
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-primary/40"
                  }`}
                >
                  <span>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 3 — Lesson (only show if topic selected) */}
      {level && grammarTopic && (
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
            Bước 3 — Bài học (Lesson)
          </label>
          {availableLessons.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Không có bài học nào ở trình độ {level.toUpperCase()} cho chủ đề này.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableLessons.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setGrammarLesson(grammarLesson === l.id ? "" : l.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    grammarLesson === l.id
                      ? `bg-secondary text-white border-secondary shadow-sm ${hlLesson ? "ring-2 ring-secondary/50 scale-105 animate-pulse" : ""}`
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-secondary/40"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      {(level || grammarTopic || grammarLesson) && (
        <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100 dark:border-slate-700">
          {level && (
            <span className={`px-2 py-0.5 rounded text-[10px] font-black ${LEVEL_BADGE[level]}`}>
              {level.toUpperCase()}
            </span>
          )}
          {grammarTopic && selectedTopic && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">
              {selectedTopic.icon} {selectedTopic.label}
            </span>
          )}
          {grammarLesson && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-secondary/10 text-secondary">
              {availableLessons.find((l) => l.id === grammarLesson)?.label ?? grammarLesson}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
