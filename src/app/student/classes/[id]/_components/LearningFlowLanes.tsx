"use client";

import React, { useMemo } from 'react';
import { 
  BookOpen, 
  Layers, 
  ClipboardList, 
  BookText, 
  Gamepad2, 
  CheckCircle2, 
  CircleDashed,
  Volume2,
  ArrowRight,
  RotateCcw,
  Sparkles,
  GraduationCap,
  Mic
} from 'lucide-react';
import { StudentGroupItem } from './StudentAssignmentsView';
import { 
  GrammarLessonCard, 
  GrammarExerciseCard, 
  ReadingStoryCard, 
  FlashcardLaneCard, 
  BookShadowingCard, 
  EducationalGameCard 
} from './LearningFlowCards';

interface LearningFlowLanesProps {
  items: StudentGroupItem[];
}

type ParsedItem = {
  item: StudentGroupItem;
  kind: string;
  targetUrl: string;
  isReview: boolean;
  cleanTitle: string;
  formula?: string;
  itemCount?: number;
};

/** Render đúng card component theo loại bài */
function renderCard(it: ParsedItem, classId?: string) {
  const props = {
    item: it.item,
    targetUrl: it.targetUrl,
    isReview: it.isReview,
    cleanTitle: it.cleanTitle,
  };
  const key = it.item.assignment.id;
  if (it.kind === 'LESSON')    return <GrammarLessonCard   key={key} {...props} formula={it.formula} />;
  if (it.kind === 'FLASHCARD') return <FlashcardLaneCard   key={key} {...props} itemCount={it.itemCount} />;
  if (it.kind === 'EXERCISE')  return <GrammarExerciseCard key={key} {...props} itemCount={it.itemCount} />;
  if (it.kind === 'READING')   return <ReadingStoryCard    key={key} {...props} />;
  if (it.kind === 'BOOK')      return <BookShadowingCard   key={key} {...props} />;
  if (it.kind === 'GAME')      return <EducationalGameCard key={key} {...props} itemCount={it.itemCount} />;
  return null;
}

/** Divider giữa 2 sub-type trong cùng 1 cột gộp */
function SubSectionDivider({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <div className="w-4 h-4 flex items-center justify-center text-slate-400 shrink-0">
        {icon}
      </div>
      <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 h-px bg-slate-200/70 dark:bg-slate-700/50" />
    </div>
  );
}

export function LearningFlowLanes({ items }: LearningFlowLanesProps) {
  const parsedItems = useMemo<ParsedItem[]>(() => {
    return items.map((item) => {
      let kind = 'EXERCISE';
      let targetUrl = `/student/assignments/${item.assignment.id}/run`;
      let isReview = false;
      let formula: string | undefined;
      let itemCount: number | undefined;

      if (item.assignment.instructions) {
        try {
          const meta = JSON.parse(item.assignment.instructions);
          if (meta.kind)              kind      = meta.kind;
          if (meta.playUrl)           targetUrl = meta.playUrl;
          if (meta.section === 'REVIEW') isReview = true;
          if (meta.formula)           formula   = meta.formula;
          if (meta.itemCount)         itemCount = meta.itemCount;
        } catch {}
      }

      // Material type fallbacks
      if (kind === 'EXERCISE' || kind === 'GRAMMAR') {
        if      (item.assignment.materialType === 'READING')   kind = 'READING';
        else if (item.assignment.materialType === 'FLASHCARD') kind = 'FLASHCARD';
        else                                                    kind = 'EXERCISE';
      }

      // For in-class assignments, tag fromClass=true and direct=true
      if (kind === 'EXERCISE' || kind === 'READING' || kind === 'GRAMMAR') {
        if (!targetUrl.includes('direct=true')) {
          const separator = targetUrl.includes('?') ? '&' : '?';
          targetUrl = `${targetUrl}${separator}direct=true`;
        }
      }
      if (!targetUrl.includes('fromClass=true')) {
        const separator = targetUrl.includes('?') ? '&' : '?';
        targetUrl = `${targetUrl}${separator}fromClass=true`;
      }

      // If already submitted in class, request review mode
      if (item.isSubmitted && !targetUrl.includes('review=true')) {
        const separator = targetUrl.includes('?') ? '&' : '?';
        targetUrl = `${targetUrl}${separator}review=true`;
      }

      // Append assignmentId query param so destination activities (Lesson, Flashcard, Book, Game) can sync progress
      if (targetUrl && !targetUrl.includes('assignmentId=')) {
        const separator = targetUrl.includes('?') ? '&' : '?';
        targetUrl = `${targetUrl}${separator}assignmentId=${item.assignment.id}`;
      }

      const cleanTitle = item.assignment.title.replace(
        /^(Lý thuyết|Bài tập|Grammar lesson|Grammar exercise):\s*/i, ''
      );

      return { item, kind, targetUrl, isReview, cleanTitle, formula, itemCount };
    });
  }, [items]);

  // Split review vs new
  const reviewItems  = parsedItems.filter((i) => i.isReview);
  const newItems     = parsedItems.filter((i) => !i.isReview);

  // Sub-groups for the 3 "new" columns
  const lessons      = newItems.filter((i) => i.kind === 'LESSON');
  const exercises    = newItems.filter((i) => i.kind === 'EXERCISE');
  const readings     = newItems.filter((i) => i.kind === 'READING');
  const books        = newItems.filter((i) => i.kind === 'BOOK');
  const flashcards   = newItems.filter((i) => i.kind === 'FLASHCARD');
  const games        = newItems.filter((i) => i.kind === 'GAME');

  // Build 4 candidate columns (always in this order)
  type Column = {
    id: string;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    topColor: string;
    cardBg: string;
    borderColor: string;
    isReviewCol: boolean;
    sections: { label: string; icon: React.ReactNode; items: ParsedItem[] }[];
  };

  const candidateColumns: Column[] = [
    // ── COL 1: ÔN TẬP ──
    {
      id: 'col-review',
      title: 'Ôn tập',
      subtitle: 'Luyện lại để nhớ lâu hơn',
      icon: <RotateCcw className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      topColor: 'from-amber-400 to-orange-500',
      cardBg: 'bg-amber-50/60 dark:bg-amber-950/20',
      borderColor: 'border-amber-200 dark:border-amber-800/50',
      isReviewCol: true,
      sections: [{ label: 'Ôn tập', icon: <RotateCcw className="w-3 h-3" />, items: reviewItems }],
    },
    // ── COL 2: NGỮ PHÁP ──
    {
      id: 'col-grammar',
      title: 'Ngữ pháp',
      subtitle: 'Lý thuyết & luyện tập',
      icon: <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      topColor: 'from-indigo-500 to-blue-500',
      cardBg: 'bg-indigo-50/40 dark:bg-indigo-950/20',
      borderColor: 'border-indigo-100 dark:border-indigo-900/40',
      isReviewCol: false,
      sections: [
        { label: 'Lý thuyết', icon: <BookOpen className="w-3 h-3" />, items: lessons },
        { label: 'Bài tập',   icon: <ClipboardList className="w-3 h-3" />, items: exercises },
      ],
    },
    // ── COL 3: ĐỌC & NÓI ──
    {
      id: 'col-reading-speaking',
      title: 'Đọc & Luyện nói',
      subtitle: 'Truyện tranh & Shadowing',
      icon: <Mic className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      topColor: 'from-emerald-500 to-teal-500',
      cardBg: 'bg-emerald-50/40 dark:bg-emerald-950/20',
      borderColor: 'border-emerald-100 dark:border-emerald-900/40',
      isReviewCol: false,
      sections: [
        { label: 'Đọc hiểu',    icon: <BookText className="w-3 h-3" />, items: readings },
        { label: 'Luyện nói',   icon: <Volume2  className="w-3 h-3" />, items: books },
      ],
    },
    // ── COL 4: TỪ VỰNG & GAME ──
    {
      id: 'col-vocab-game',
      title: 'Từ vựng & Game',
      subtitle: 'Flashcard & Trò chơi ôn luyện',
      icon: <Layers className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
      topColor: 'from-purple-500 to-pink-500',
      cardBg: 'bg-purple-50/40 dark:bg-purple-950/20',
      borderColor: 'border-purple-100 dark:border-purple-900/40',
      isReviewCol: false,
      sections: [
        { label: 'Flashcard', icon: <Layers   className="w-3 h-3" />, items: flashcards },
        { label: 'Game',      icon: <Gamepad2 className="w-3 h-3" />, items: games },
      ],
    },
  ];

  // Hide columns with zero items total
  const activeColumns = candidateColumns
    .filter((col) => col.sections.some((s) => s.items.length > 0))
    .map((col, idx) => ({ ...col, stageNumber: idx + 1 }));

  if (activeColumns.length === 0) {
    return (
      <div className="p-10 text-center bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-dashed border-slate-200 dark:border-slate-700 rounded-md">
        <p className="text-slate-500 text-sm font-medium">Chưa có bài tập nào trong nhóm này.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 items-start w-full">
        {activeColumns.map((col, colIdx) => {
          const allItems   = col.sections.flatMap((s) => s.items);
          const totalInCol = allItems.length;
          const completedInCol = allItems.filter((i) => i.item.isSubmitted).length;
          const isDoneAll  = totalInCol > 0 && completedInCol === totalInCol;

          return (
            <div
              key={col.id}
              id={col.id}
              className={`flex flex-col gap-3.5 sm:gap-4 rounded-md p-3.5 sm:p-4.5 border transition-all duration-300 ${col.cardBg} ${col.borderColor} shadow-xs relative w-full scroll-mt-20`}
            >
              {/* Top Accent Gradient Line */}
              <div className={`h-1.5 w-14 rounded-full bg-gradient-to-r ${col.topColor}`} />

              {/* Column Header */}
              <div className="flex items-start gap-2.5 pb-2.5 border-b border-slate-200/60 dark:border-slate-700/60">
                <div className="w-10 h-10 rounded-md bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-xs border border-slate-100 dark:border-slate-700">
                  {col.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {col.isReviewCol && (
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider bg-amber-500 text-white">
                        🔁 Ôn tập
                      </span>
                    )}
                    <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight truncate">
                      {col.title}
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                    {col.subtitle}
                  </p>
                </div>
              </div>

              {/* Progress */}
              <div className="flex items-center justify-between text-xs px-0.5">
                <span className="text-slate-500 dark:text-slate-400 font-bold text-[10px]">Tiến độ</span>
                {isDoneAll ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-black text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Đã xong ({completedInCol}/{totalInCol})
                  </span>
                ) : (
                  <span className="text-slate-600 dark:text-slate-300 font-bold text-[10px] flex items-center gap-1">
                    <CircleDashed className="w-3 h-3 text-blue-500" />
                    {completedInCol}/{totalInCol} bài
                  </span>
                )}
              </div>

              {/* Cards — review column: amber ring badge; merged columns: section dividers */}
              <div className="flex flex-col gap-3 sm:gap-3.5">
                {col.isReviewCol ? (
                  // ── Ôn tập column: mỗi card có amber ring + badge loại bài ──
                  col.sections[0].items.map((it) => (
                    <div key={it.item.assignment.id} className="relative">
                      <div className="absolute inset-0 rounded-md ring-2 ring-amber-400/70 dark:ring-amber-500/50 pointer-events-none z-10" />
                      {/* Badge loại bài gốc (để phân biệt trong cột ôn tập) */}
                      <div className="absolute -top-2 left-3 z-20 flex items-center gap-1 bg-amber-400 text-amber-950 text-[9px] font-black px-2 py-0.5 rounded-md shadow-sm">
                        <RotateCcw className="w-2.5 h-2.5" />
                        {it.kind === 'LESSON'    ? 'Lý thuyết' :
                         it.kind === 'EXERCISE'  ? 'Bài tập'   :
                         it.kind === 'FLASHCARD' ? 'Từ vựng'   :
                         it.kind === 'READING'   ? 'Đọc hiểu'  :
                         it.kind === 'BOOK'      ? 'Luyện nói' :
                         it.kind === 'GAME'      ? 'Game'      : 'Ôn tập'}
                      </div>
                      <div className="pt-1">{renderCard(it)}</div>
                    </div>
                  ))
                ) : (
                  // ── Merged columns: section dividers ──
                  col.sections.map((section, sIdx) => {
                    if (section.items.length === 0) return null;
                    const hasMultipleSections = col.sections.filter((s) => s.items.length > 0).length > 1;
                    return (
                      <div key={section.label} className="flex flex-col gap-3 sm:gap-3.5">
                        {hasMultipleSections && (
                          <SubSectionDivider
                            label={section.label}
                            icon={section.icon}
                          />
                        )}
                        {section.items.map((it) => renderCard(it))}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Mobile Quick-Jump Footer */}
              <div className="sm:hidden pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                {colIdx < activeColumns.length - 1 ? (
                  <button
                    onClick={() => {
                      const el = document.getElementById(activeColumns[colIdx + 1].id);
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="w-full py-2 px-3 rounded-md bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-[11px] font-black text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 shadow-2xs hover:bg-blue-50 transition-colors"
                  >
                    <span>
                      {activeColumns[colIdx + 1].isReviewCol
                        ? '🔁 Ôn tập'
                        : `Sang Chặng ${activeColumns[colIdx + 1].stageNumber}: ${activeColumns[colIdx + 1].title}`}
                    </span>
                    <ArrowRight className="w-3 h-3 text-blue-500" />
                  </button>
                ) : (
                  <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="w-full py-2 px-3 rounded-md bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-[11px] font-black text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1 shadow-2xs"
                  >
                    <span>↑ Lên đầu trang</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
