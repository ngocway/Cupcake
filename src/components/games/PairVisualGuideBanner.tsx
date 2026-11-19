"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Info, Link2, ArrowRight, Sparkles, Scissors } from "lucide-react";
import { useTeacherLocale } from "@/i18n/teacher-locale";

interface PairVisualGuideBannerProps {
  gameMode?: string; // "match" | "line" | "train" | "cut-rope"
  maxPairsPerRound?: number;
}

const STORAGE_KEY = "dolcake_pair_visual_guide_collapsed_v1";

function CuteAppleSvg({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
      {/* Stem */}
      <path d="M32 16C32 11 35 7 39 6" stroke="#78350F" strokeWidth="4" strokeLinecap="round" />
      {/* Leaf */}
      <path d="M34 14C39 8 47 9 48 15C43 18 37 18 34 14Z" fill="#34D399" stroke="#059669" strokeWidth="2.5" strokeLinejoin="round" />
      {/* Apple body */}
      <path
        d="M32 19C25 14 13 18 13 32C13 46 22 56 30 56C31.5 56 32 55 32 55C32 55 32.5 56 34 56C42 56 51 46 51 32C51 18 39 14 32 19Z"
        fill="#FB7185"
        stroke="#E11D48"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Highlight */}
      <ellipse cx="22" cy="29" rx="3.2" ry="6" transform="rotate(-18 22 29)" fill="#FFF1F2" opacity="0.85" />
      {/* Cute face */}
      <circle cx="26" cy="36" r="2.2" fill="#881337" />
      <circle cx="38" cy="36" r="2.2" fill="#881337" />
      <path d="M29 40.5C30.5 42.5 33.5 42.5 35 40.5" stroke="#881337" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function CuteDogSvg({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
      {/* Ears */}
      <ellipse cx="15" cy="31" rx="7" ry="13" transform="rotate(14 15 31)" fill="#D97706" stroke="#92400E" strokeWidth="2.5" />
      <ellipse cx="49" cy="31" rx="7" ry="13" transform="rotate(-14 49 31)" fill="#D97706" stroke="#92400E" strokeWidth="2.5" />
      {/* Face */}
      <circle cx="32" cy="34" r="18" fill="#FDE68A" stroke="#B45309" strokeWidth="2.5" />
      {/* Eyes */}
      <circle cx="25.5" cy="31" r="2.3" fill="#451A03" />
      <circle cx="38.5" cy="31" r="2.3" fill="#451A03" />
      {/* Nose & smile */}
      <ellipse cx="32" cy="36.5" rx="3.5" ry="2.5" fill="#451A03" />
      <path d="M28.5 41C30 43 34 43 35.5 41" stroke="#451A03" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function PairVisualGuideBanner({
  gameMode = "match",
  maxPairsPerRound = 7,
}: PairVisualGuideBannerProps) {
  const { locale } = useTeacherLocale();
  const isVi = locale !== "en";
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") {
        setCollapsed(true);
      }
    } catch {}
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {}
      return next;
    });
  };

  const isTrain = gameMode === "train";
  const isLine = gameMode === "line";
  const isCutRope = gameMode === "cut-rope";

  const step2Caption = isTrain
    ? isVi
      ? "Học sinh thả bóng bay Chữ rơi đúng vào toa tàu có Ảnh tương ứng."
      : "Students drop the Word balloon onto the matching Picture train car."
    : isLine
      ? isVi
        ? "Học sinh vẽ đường nối cột Ảnh bên trái với cột Chữ bên phải."
        : "Students draw a line connecting each Picture to its matching Word."
      : isCutRope
        ? isVi
          ? "Học sinh cắt dây để Ảnh rơi trúng vào ô Chữ tương ứng bên dưới."
          : "Students cut the rope to drop the Picture into the matching Word box."
        : isVi
          ? "Game tự tách & xáo trộn — học sinh kéo thẻ Ảnh ghép vào thẻ Chữ đúng."
          : "Game splits & shuffles both pieces — students match Picture to Word.";

  const roundTipText = isTrain
    ? isVi
      ? `Mỗi Vòng = 1 Chuyến tàu tối đa ${maxPairsPerRound} toa để hình và chữ to rõ nhất. Hoàn thành Vòng 1 tàu sẽ tự đón tiếp Vòng 2.`
      : `Each Round = 1 Train with up to ${maxPairsPerRound} cars for clear visibility. Completing Round 1 automatically advances to Round 2.`
    : isVi
      ? `Mỗi Vòng chứa tối đa ${maxPairsPerRound} cặp thẻ để học sinh nối trực quan không bị rối mắt. Hoàn thành Vòng 1 sẽ tự chuyển sang Vòng 2.`
      : `Each Round holds up to ${maxPairsPerRound} pairs so the board stays clear. Completing Round 1 automatically advances to Round 2.`;

  if (collapsed) {
    return (
      <div className="p-3 bg-sky-50/75 dark:bg-sky-950/30 rounded-2xl border border-sky-200/70 dark:border-sky-800/60 flex flex-wrap items-center justify-between gap-2 text-xs text-sky-800 dark:text-sky-200">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>{isVi ? "Mẹo nhanh:" : "Quick tip:"}</strong> {roundTipText}
          </p>
        </div>
        <button
          type="button"
          onClick={toggleCollapsed}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-sky-100/70 dark:hover:bg-sky-900/50 border border-sky-200 dark:border-sky-700 text-sky-700 dark:text-sky-300 font-extrabold text-[11px] shadow-2xs transition-all cursor-pointer shrink-0"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{isVi ? "Xem minh họa cách tạo cặp" : "Show visual example"}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-sky-50/90 via-indigo-50/45 to-purple-50/75 dark:from-sky-950/40 dark:via-indigo-950/25 dark:to-purple-950/30 border border-sky-200/80 dark:border-sky-800/60 p-4 space-y-3.5 shadow-2xs">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-500 text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
            <Sparkles className="w-3 h-3" />
            <span>{isVi ? "Minh họa trực quan" : "Visual Guide"}</span>
          </span>
          <span className="text-xs sm:text-sm font-black text-slate-700 dark:text-slate-100">
            {isVi
              ? "1 ô cặp bên dưới sẽ hoạt động thế nào khi học sinh chơi?"
              : "How does each pair card work when students play?"}
          </span>
        </div>

        <button
          type="button"
          onClick={toggleCollapsed}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/85 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-500 hover:text-slate-700 dark:text-slate-300 text-[11px] font-bold transition-all cursor-pointer shrink-0"
        >
          <EyeOff className="w-3.5 h-3.5" />
          <span>{isVi ? "Đã hiểu, thu gọn" : "Hide guide"}</span>
        </button>
      </div>

      {/* 2-Step Visual Diagram */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1.35fr)] items-center gap-3">
        {/* STEP 1: Teacher enters 1 pair card */}
        <div className="bg-white/95 dark:bg-slate-900/90 rounded-2xl border border-sky-200/70 dark:border-slate-700/80 p-3 flex items-center gap-3 shadow-2xs">
          {/* Mini Editor Card Mockup */}
          <div className="w-[104px] shrink-0 rounded-xl border-2 border-sky-300/80 dark:border-sky-700 bg-slate-50/70 dark:bg-slate-800/80 p-1.5 space-y-1 shadow-xs">
            <div className="flex flex-col items-center justify-center rounded-lg bg-white dark:bg-slate-900 border border-dashed border-sky-200 dark:border-slate-700 py-1.5">
              <CuteAppleSvg className="w-8 h-8" />
            </div>
            <div className="flex items-center justify-center">
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 text-[8px] font-black">
                <Link2 className="w-2.5 h-2.5" />
                <span>{isVi ? "Nối với" : "Matches"}</span>
              </span>
            </div>
            <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 py-1 text-center text-[10px] font-black text-slate-800 dark:text-white">
              Apple
            </div>
          </div>

          <div className="space-y-1 min-w-0">
            <span className="inline-block text-[10px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-400">
              {isVi ? "Bước 1 • Giáo viên nhập" : "Step 1 • You enter"}
            </span>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-snug">
              {isVi ? (
                <>
                  Chọn <strong>1 Ảnh</strong> (Mảnh 1) và gõ <strong>1 Chữ đúng</strong> (Mảnh 2) trong cùng 1 ô.
                </>
              ) : (
                <>
                  Pick <strong>1 Picture</strong> (Piece 1) and type its matching <strong>Word</strong> (Piece 2) in one card.
                </>
              )}
            </p>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {isVi ? "Ví dụ: Ảnh quả táo 🍎 + chữ Apple = 1 cặp." : "Example: Apple picture 🍎 + word Apple = 1 pair."}
            </p>
          </div>
        </div>

        {/* Center Transition Arrow */}
        <div className="flex lg:flex-col items-center justify-center gap-1 py-0.5 text-indigo-500 dark:text-indigo-400">
          <div className="px-2.5 py-1 rounded-full bg-indigo-100/90 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-[10px] font-black text-indigo-700 dark:text-indigo-300 whitespace-nowrap">
            {isVi ? "Vào game tách làm 2" : "Splits into 2 pieces"}
          </div>
          <ArrowRight className="w-4 h-4 rotate-90 lg:rotate-0 shrink-0" />
        </div>

        {/* STEP 2: Student gameplay preview by gameMode */}
        <div className="bg-white/95 dark:bg-slate-900/90 rounded-2xl border border-purple-200/80 dark:border-purple-800/60 p-3 flex flex-col sm:flex-row items-center gap-3 shadow-2xs">
          {/* Dynamic Mini Game Visual */}
          <div className="shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-purple-50 to-sky-50 dark:from-slate-800 dark:to-slate-800/70 border border-purple-200/60 dark:border-slate-700 px-3 py-2 min-w-[170px] min-h-[84px]">
            {isLine ? (
              /* Line Match Visual: 2 columns + connecting curved line */
              <div className="relative flex items-center gap-7">
                <div className="flex flex-col gap-1.5">
                  <div className="w-9 h-8 rounded-lg bg-white dark:bg-slate-900 border-2 border-violet-400 flex items-center justify-center shadow-2xs">
                    <CuteAppleSvg className="w-6 h-6" />
                  </div>
                  <div className="w-9 h-8 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center opacity-70">
                    <CuteDogSvg className="w-5 h-5" />
                  </div>
                </div>
                <svg
                  viewBox="0 0 46 68"
                  className="w-10 h-16 absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 pointer-events-none"
                  fill="none"
                >
                  <path
                    d="M3 16 C 22 16, 24 52, 43 52"
                    stroke="#8B5CF6"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <circle cx="3" cy="16" r="3.5" fill="#8B5CF6" />
                  <circle cx="43" cy="52" r="3.5" fill="#10B981" />
                </svg>
                <div className="flex flex-col gap-1.5">
                  <div className="px-2 h-8 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[10px] font-black text-slate-400">
                    Dog
                  </div>
                  <div className="px-2 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border-2 border-emerald-400 flex items-center justify-center text-[10px] font-black text-emerald-700 dark:text-emerald-300 shadow-2xs">
                    Apple
                  </div>
                </div>
              </div>
            ) : isTrain ? (
              /* Train Vocab Visual: Balloon dropping into wagon */
              <div className="flex flex-col items-center gap-1">
                <div className="px-3 py-1 rounded-full bg-sky-500 text-white text-[10px] font-black shadow-xs">
                  🎈 Apple
                </div>
                <span className="text-[11px] font-black text-amber-500 leading-none">↓</span>
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/60 border-2 border-amber-400 shadow-2xs">
                  <span className="text-xs">🚂</span>
                  <CuteAppleSvg className="w-6 h-6" />
                </div>
              </div>
            ) : isCutRope ? (
              /* Cut Rope Visual: Hanging picture dropping to word box */
              <div className="flex flex-col items-center gap-0.5">
                <div className="flex items-center gap-1 text-rose-500">
                  <Scissors className="w-3.5 h-3.5" />
                  <div className="w-6 border-t-2 border-dashed border-rose-400" />
                </div>
                <div className="w-9 h-8 rounded-lg bg-white dark:bg-slate-900 border-2 border-rose-300 flex items-center justify-center shadow-2xs">
                  <CuteAppleSvg className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black text-rose-400 leading-none">↓</span>
                <div className="px-3 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border-2 border-emerald-400 text-[10px] font-black text-emerald-700 dark:text-emerald-300">
                  Apple
                </div>
              </div>
            ) : (
              /* Default Match Visual: Separate Picture card + Drag arrow + Word card */
              <div className="flex items-center gap-2">
                <div className="flex flex-col items-center gap-0.5">
                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 border-2 border-sky-400 shadow-xs flex items-center justify-center">
                    <CuteAppleSvg className="w-8 h-8" />
                  </div>
                  <span className="text-[9px] font-extrabold text-sky-600 dark:text-sky-400">
                    {isVi ? "Thẻ Ảnh" : "Picture"}
                  </span>
                </div>

                <div className="flex flex-col items-center text-purple-500 -mt-3">
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                    {isVi ? "Ghép" : "Match"}
                  </span>
                  <span className="text-xs font-black tracking-tighter">──▶</span>
                </div>

                <div className="flex flex-col items-center gap-0.5">
                  <div className="px-3 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border-2 border-emerald-400 shadow-xs flex items-center justify-center text-xs font-black text-emerald-700 dark:text-emerald-300">
                    Apple
                  </div>
                  <span className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400">
                    {isVi ? "Thẻ Chữ" : "Word"}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1 min-w-0 text-center sm:text-left">
            <span className="inline-block text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
              {isVi ? "Bước 2 • Học sinh chơi" : "Step 2 • Student plays"}
            </span>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-snug">
              {step2Caption}
            </p>
          </div>
        </div>
      </div>

      {/* Compact Round Tip Footer */}
      <div className="flex items-start gap-2 pt-1 border-t border-sky-200/60 dark:border-sky-800/50 text-[11px] font-medium text-sky-800/90 dark:text-sky-200/90">
        <Info className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">{roundTipText}</p>
      </div>
    </div>
  );
}
