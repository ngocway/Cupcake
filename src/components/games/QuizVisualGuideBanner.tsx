"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Check, Crosshair } from "lucide-react";
import { useTeacherLocale } from "@/i18n/teacher-locale";
import { GameDemoVideoButton } from "./GameDemoVideoButton";

export interface QuizPreviewOption {
  id?: string;
  text?: string;
  isCorrect?: boolean;
}

export interface QuizPreviewQuestion {
  id?: string;
  questionText?: string;
  imageUrl?: string;
  options: QuizPreviewOption[];
}

export type QuizVisualGameMode =
  | "candy-quiz"
  | "treasure-hunt"
  | "shooter-quiz"
  | "choice-egg"
  | "choice-shooter";

interface QuizVisualGuideBannerProps {
  gameMode: QuizVisualGameMode;
  questions: QuizPreviewQuestion[];
  activeIndex?: number;
  onActiveIndexChange?: (index: number) => void;
  onSelectQuestionIndex?: (index: number) => void;
}

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

const CANDY_STYLES = [
  "from-pink-500 to-rose-500 border-pink-300 shadow-pink-500/20",
  "from-sky-500 to-blue-500 border-sky-300 shadow-sky-500/20",
  "from-amber-400 to-orange-500 border-amber-200 shadow-amber-500/20",
  "from-emerald-500 to-teal-500 border-emerald-300 shadow-emerald-500/20",
];

const EGG_IMAGES = [
  "https://media.dolcake.com/games/egg-smash-quiz-premium-ambient/assets/egg-blue.png",
  "https://media.dolcake.com/games/egg-smash-quiz-premium-ambient/assets/egg-pink.png",
  "https://media.dolcake.com/games/egg-smash-quiz-premium-ambient/assets/egg-yellow.png",
  "https://media.dolcake.com/games/egg-smash-quiz-premium-ambient/assets/egg-green.png",
];

const GAME_META: Record<
  QuizVisualGameMode,
  {
    gameId: string;
    titleVi: string;
    titleEn: string;
    badgeVi: string;
    badgeEn: string;
    badgeBg: string;
    videoId: string;
    containerBorder: string;
    tipVi: string;
    tipEn: string;
  }
> = {
  "candy-quiz": {
    gameId: "candy-quiz",
    titleVi: "Trắc nghiệm Kẹo Ngọt",
    titleEn: "Candy Quiz",
    badgeVi: "Kẹo Ngọt",
    badgeEn: "Candy Quiz",
    badgeBg: "bg-pink-500 text-white",
    videoId: "m6_CohSIXpo",
    containerBorder: "border-pink-200/80 dark:border-slate-800 bg-pink-50/20 dark:bg-slate-900/30",
    tipVi: "💡 Học sinh chọn viên kẹo mang đáp án đúng. Hệ thống sẽ tự động xáo trộn vị trí ngẫu nhiên.",
    tipEn: "💡 Students pick the candy with the correct answer. The system will automatically shuffle positions randomly.",
  },
  "treasure-hunt": {
    gameId: "treasure-hunt",
    titleVi: "Truy tìm Kho báu",
    titleEn: "Treasure Hunt",
    badgeVi: "Kho Báu",
    badgeEn: "Treasure Hunt",
    badgeBg: "bg-amber-500 text-white",
    videoId: "9juS0TQRyHw",
    containerBorder: "border-amber-200/80 dark:border-slate-800 bg-amber-50/20 dark:bg-slate-900/30",
    tipVi: "💡 Học sinh chọn đáp án đúng để mở khóa rương kho báu. Hệ thống sẽ tự động xáo trộn vị trí ngẫu nhiên.",
    tipEn: "💡 Students pick the correct answer to unlock treasure chests. The system will automatically shuffle positions randomly.",
  },
  "shooter-quiz": {
    gameId: "shooter-quiz",
    titleVi: "Bắn súng Trắc nghiệm",
    titleEn: "Shooter Quiz",
    badgeVi: "Bắn Súng",
    badgeEn: "Shooter Quiz",
    badgeBg: "bg-indigo-500 text-white",
    videoId: "MxrxyO1a8gM",
    containerBorder: "border-indigo-200/80 dark:border-slate-800 bg-indigo-50/20 dark:bg-slate-900/30",
    tipVi: "💡 Học sinh nhắm bắn vào mục tiêu mang đáp án đúng. Hệ thống sẽ tự động xáo trộn vị trí ngẫu nhiên.",
    tipEn: "💡 Students shoot the target holding the correct answer. The system will automatically shuffle positions randomly.",
  },
  "choice-egg": {
    gameId: "egg-crack",
    titleVi: "Đập Trứng Toán Học",
    titleEn: "Egg Smash Math",
    badgeVi: "Đập Trứng",
    badgeEn: "Egg Smash",
    badgeBg: "bg-amber-500 text-white",
    videoId: "R6fn9PnMmog",
    containerBorder: "border-amber-200/80 dark:border-slate-800 bg-amber-50/20 dark:bg-slate-900/30",
    tipVi: "💡 Học sinh đập quả trứng mang kết quả đúng. Hệ thống sẽ tự động xáo trộn vị trí ngẫu nhiên.",
    tipEn: "💡 Students smash the egg with the correct answer. The system will automatically shuffle positions randomly.",
  },
  "choice-shooter": {
    gameId: "shooter",
    titleVi: "Bắn Súng Toán Học",
    titleEn: "Math Shooter",
    badgeVi: "Bắn Súng",
    badgeEn: "Math Shooter",
    badgeBg: "bg-emerald-500 text-white",
    videoId: "vyQ8QBQ1m4E",
    containerBorder: "border-emerald-200/80 dark:border-slate-800 bg-emerald-50/20 dark:bg-slate-900/30",
    tipVi: "💡 Học sinh bắn vào mục tiêu mang kết quả đúng. Hệ thống sẽ tự động xáo trộn vị trí ngẫu nhiên.",
    tipEn: "💡 Students shoot the target with the correct answer. The system will automatically shuffle positions randomly.",
  },
};

export function QuizVisualGuideBanner({
  gameMode,
  questions,
  activeIndex,
  onActiveIndexChange,
  onSelectQuestionIndex,
}: QuizVisualGuideBannerProps) {
  const { locale } = useTeacherLocale();
  const isVi = locale !== "en";
  const [internalIndex, setInternalIndex] = useState(0);

  const safeQuestions: QuizPreviewQuestion[] =
    questions.length > 0
      ? questions
      : [
          {
            id: "placeholder",
            questionText: "",
            options: [
              { id: "A", text: "", isCorrect: true },
              { id: "B", text: "", isCorrect: false },
              { id: "C", text: "", isCorrect: false },
              { id: "D", text: "", isCorrect: false },
            ],
          },
        ];

  const controlledIndex = activeIndex !== undefined ? activeIndex : internalIndex;
  const clampedIndex = Math.max(0, Math.min(controlledIndex, safeQuestions.length - 1));

  useEffect(() => {
    if (internalIndex >= safeQuestions.length) {
      setInternalIndex(Math.max(0, safeQuestions.length - 1));
    }
  }, [internalIndex, safeQuestions.length]);

  const setIndex = (next: number) => {
    const valid = Math.max(0, Math.min(next, safeQuestions.length - 1));
    setInternalIndex(valid);
    onActiveIndexChange?.(valid);
  };

  const currentQuestion = safeQuestions[clampedIndex];
  const meta = GAME_META[gameMode];
  const questionText = currentQuestion?.questionText?.trim() || "";
  const hasQuestionText = questionText.length > 0;

  return (
    <div className={`rounded-2xl border p-3 sm:p-4 space-y-3 ${meta.containerBorder}`}>
      {/* Header Row: Left = Demo Video Button, Right = Tip */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2.5 flex-wrap">
          <GameDemoVideoButton
            gameId={meta.gameId}
            titleVi={meta.titleVi}
            titleEn={meta.titleEn}
            badgeVi={meta.badgeVi}
            badgeEn={meta.badgeEn}
            badgeBg={meta.badgeBg}
            videoId={meta.videoId}
          />

          {/* Compact Question Switcher */}
          {questions.length > 0 && (
            <div className="inline-flex items-center gap-1 px-1.5 py-1 rounded-full bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
              <button
                type="button"
                onClick={() => setIndex(clampedIndex - 1)}
                disabled={clampedIndex <= 0}
                className="w-5 h-5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-colors"
                title={isVi ? "Câu trước" : "Previous question"}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onSelectQuestionIndex?.(clampedIndex)}
                className="px-1.5 text-[11px] font-black text-slate-700 dark:text-slate-200 hover:text-sky-600 cursor-pointer"
                title={isVi ? "Bấm để cuộn tới câu hỏi này" : "Click to jump to this question"}
              >
                {isVi ? `Câu ${clampedIndex + 1} / ${questions.length}` : `Q${clampedIndex + 1} / ${questions.length}`}
              </button>
              <button
                type="button"
                onClick={() => setIndex(clampedIndex + 1)}
                disabled={clampedIndex >= safeQuestions.length - 1}
                className="w-5 h-5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-colors"
                title={isVi ? "Câu tiếp theo" : "Next question"}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 hidden md:inline">
          {isVi ? meta.tipVi : meta.tipEn}
        </span>
      </div>

      {/* Live Preview Stage */}
      <div
        onClick={() => onSelectQuestionIndex?.(clampedIndex)}
        role={onSelectQuestionIndex ? "button" : undefined}
        title={isVi ? `Bấm để cuộn tới Câu #${clampedIndex + 1}` : `Click to jump to Question #${clampedIndex + 1}`}
        className="max-w-3xl mx-auto py-1 space-y-3 select-none cursor-pointer group"
      >
        {/* Question Prompt Display */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 bg-white dark:bg-slate-800/90 rounded-2xl border-2 border-slate-200/80 dark:border-slate-700 px-4 py-3 shadow-xs group-hover:border-sky-300 transition-colors">
          {currentQuestion.imageUrl && (
            <img
              src={currentQuestion.imageUrl}
              alt=""
              className="w-14 h-14 rounded-xl object-contain bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-1 shrink-0"
            />
          )}
          <div className="text-center sm:text-left min-w-0">
            <span
              className={`font-black text-sm sm:text-base leading-snug break-words ${
                hasQuestionText
                  ? "text-slate-800 dark:text-white"
                  : "text-slate-400 dark:text-slate-500 italic font-semibold"
              }`}
            >
              {hasQuestionText
                ? questionText
                : isVi
                  ? `Chưa nhập nội dung Câu #${clampedIndex + 1}...`
                  : `Question #${clampedIndex + 1} text not entered yet...`}
            </span>
          </div>
        </div>

        {/* Options Display — Custom Visual Per Game Mode */}
        {gameMode === "choice-egg" ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            {currentQuestion.options.slice(0, 4).map((opt, oIdx) => {
              const optText = opt.text?.trim() || "";
              const isCorrect = Boolean(opt.isCorrect);
              return (
                <div
                  key={opt.id || oIdx}
                  className={`relative flex flex-col items-center justify-center p-2 rounded-2xl transition-transform group-hover:scale-[1.01] ${
                    isCorrect
                      ? "bg-emerald-50/80 dark:bg-emerald-950/30 ring-2 ring-emerald-400"
                      : "bg-white/60 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700"
                  }`}
                >
                  {isCorrect && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm z-20">
                      <Check className="w-3 h-3 stroke-[3px]" />
                    </span>
                  )}
                  <div className="relative w-16 sm:w-20 aspect-[3/4] flex items-center justify-center">
                    <img
                      src={EGG_IMAGES[oIdx % EGG_IMAGES.length]}
                      alt=""
                      className="w-full h-full object-contain filter drop-shadow-sm pointer-events-none"
                    />
                    <span className="absolute inset-0 flex items-center justify-center px-2 pt-2 font-black text-xs sm:text-sm text-slate-800 text-center break-words line-clamp-2 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]">
                      {optText || "?"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : gameMode === "shooter-quiz" || gameMode === "choice-shooter" ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            {currentQuestion.options.slice(0, 4).map((opt, oIdx) => {
              const optText = opt.text?.trim() || "";
              const isCorrect = Boolean(opt.isCorrect);
              const letter = OPTION_LETTERS[oIdx] || String(oIdx + 1);
              return (
                <div
                  key={opt.id || oIdx}
                  className={`relative rounded-2xl p-2.5 border-2 flex items-center gap-2 transition-all ${
                    isCorrect
                      ? "bg-emerald-500/10 dark:bg-emerald-950/40 border-emerald-400 shadow-sm shadow-emerald-500/15"
                      : "bg-white dark:bg-slate-800/90 border-indigo-200/80 dark:border-slate-700"
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-black text-xs ${
                      isCorrect
                        ? "bg-emerald-500 text-white"
                        : "bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300"
                    }`}
                  >
                    {isCorrect ? <Crosshair className="w-3.5 h-3.5" /> : letter}
                  </span>
                  <span
                    className={`text-xs font-bold break-words line-clamp-2 ${
                      optText ? "text-slate-800 dark:text-slate-100" : "text-slate-400 italic"
                    }`}
                  >
                    {optText || (isVi ? `Đáp án ${letter}` : `Option ${letter}`)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : gameMode === "treasure-hunt" ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            {currentQuestion.options.slice(0, 4).map((opt, oIdx) => {
              const optText = opt.text?.trim() || "";
              const isCorrect = Boolean(opt.isCorrect);
              const letter = OPTION_LETTERS[oIdx] || String(oIdx + 1);
              return (
                <div
                  key={opt.id || oIdx}
                  className={`relative rounded-2xl p-2.5 border-2 flex items-center gap-2 transition-all ${
                    isCorrect
                      ? "bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/50 dark:to-yellow-950/40 border-amber-400 shadow-sm shadow-amber-500/15"
                      : "bg-white dark:bg-slate-800/90 border-amber-200/70 dark:border-slate-700"
                  }`}
                >
                  {isCorrect && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                      <Check className="w-3 h-3 stroke-[3px]" />
                    </span>
                  )}
                  <span className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 text-sm">
                    {isCorrect ? "👑" : "🗝️"}
                  </span>
                  <span
                    className={`text-xs font-bold break-words line-clamp-2 ${
                      optText ? "text-slate-800 dark:text-slate-100" : "text-slate-400 italic"
                    }`}
                  >
                    {optText || (isVi ? `Đáp án ${letter}` : `Option ${letter}`)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          /* candy-quiz */
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            {currentQuestion.options.slice(0, 4).map((opt, oIdx) => {
              const optText = opt.text?.trim() || "";
              const isCorrect = Boolean(opt.isCorrect);
              const letter = OPTION_LETTERS[oIdx] || String(oIdx + 1);
              const candyStyle = CANDY_STYLES[oIdx % CANDY_STYLES.length];
              return (
                <div
                  key={opt.id || oIdx}
                  className={`relative rounded-2xl px-3 py-2.5 border-2 flex items-center gap-2 transition-all shadow-sm ${
                    optText
                      ? `bg-gradient-to-br text-white ${candyStyle}`
                      : "bg-white dark:bg-slate-800/90 border-dashed border-pink-200 dark:border-slate-700 text-slate-400"
                  } ${isCorrect ? "ring-2 ring-emerald-400 ring-offset-2 dark:ring-offset-slate-900" : ""}`}
                >
                  {isCorrect && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                      <Check className="w-3 h-3 stroke-[3px]" />
                    </span>
                  )}
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-black text-[11px] ${
                      optText ? "bg-white/25 text-white" : "bg-pink-100 dark:bg-slate-700 text-pink-500"
                    }`}
                  >
                    {letter}
                  </span>
                  <span className="text-xs font-extrabold break-words line-clamp-2">
                    {optText || (isVi ? `Đáp án ${letter}` : `Option ${letter}`)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
