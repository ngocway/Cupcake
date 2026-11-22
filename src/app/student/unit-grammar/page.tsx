"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Volume2,
  Sparkles,
  PenLine,
  Share2,
  X,
  ArrowRight,
  Lightbulb,
  AlertCircle,
} from "lucide-react";
import {
  loadUnitGrammarLesson,
  getGrammarExampleAudioUrl,
  getGrammarQuestionAudioUrl,
  hasGrammarQuestionAudio,
  type GrammarPoint,
  type UnitGrammarLesson,
} from "@/data/global-success-grammar";
import { useTeacherLocale, TeacherLocaleSwitch } from "@/i18n/teacher-locale";
import { MatchGameShareModal } from "@/app/teacher/_components/MatchGameShareModal";
import KidTeenQuizRunner from "../assignments/[id]/run/quiz/KidTeenQuizRunner";

function speakEnglishFallback(text: string, onEnd?: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    onEnd?.();
    return;
  }
  try {
    const clean = text
      .replace(/→|—/g, ". ")
      .replace(/[^\w\s'.,?!-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!clean) {
      onEnd?.();
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(clean);
    utter.lang = "en-US";
    utter.rate = 1.0;
    utter.onend = () => onEnd?.();
    utter.onerror = () => onEnd?.();
    window.speechSynthesis.speak(utter);
  } catch {
    onEnd?.();
  }
}

function GrammarSummaryCards({
  grade,
  unit,
  points,
  isVi,
  playingKey,
  onPlayAudio,
}: {
  grade: number;
  unit: number;
  points: GrammarPoint[];
  isVi: boolean;
  playingKey: string | null;
  onPlayAudio: (key: string, url: string, fallbackText: string) => void;
}) {
  return (
    <div className="space-y-4">
      {points.map((pt, idx) => (
        <div
          key={idx}
          className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4"
        >
          {/* Point Header */}
          <div className="flex items-start gap-3">
            <span className="w-8 h-8 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
              {idx + 1}
            </span>
            <div className="min-w-0">
              <h3 className="font-headline font-black text-base sm:text-lg text-slate-800 dark:text-white leading-snug">
                {isVi ? pt.titleVi : pt.titleEn}
              </h3>
              {isVi && (
                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  {pt.titleEn}
                </p>
              )}
            </div>
          </div>

          {/* Formula Pill */}
          {pt.formula && (
            <div className="rounded-2xl bg-gradient-to-r from-indigo-50 via-sky-50 to-violet-50 dark:from-indigo-950/50 dark:via-sky-950/40 dark:to-violet-950/50 border-2 border-indigo-200/80 dark:border-indigo-800/70 px-4 py-3">
              <div className="text-[10px] font-black uppercase tracking-wider text-indigo-500 dark:text-indigo-400 mb-1">
                {isVi ? "Công thức / Cấu trúc" : "Pattern / Formula"}
              </div>
              <p className="font-mono font-black text-sm sm:text-base text-indigo-950 dark:text-indigo-100 whitespace-pre-line leading-relaxed">
                {pt.formula}
              </p>
            </div>
          )}

          {/* Usage Description */}
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
            {isVi ? pt.usageVi : pt.usageEn}
          </p>

          {/* Examples with Deepgram TTS Audio */}
          <div className="space-y-2">
            <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              {isVi ? "Ví dụ minh họa (bấm loa để nghe)" : "Examples (tap speaker to listen)"}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {pt.examples.map((ex, eIdx) => {
                const exKey = `ex-${idx}-${eIdx}`;
                const isPlaying = playingKey === exKey;
                const audioUrl = getGrammarExampleAudioUrl(grade, unit, idx, eIdx);
                return (
                  <button
                    key={eIdx}
                    type="button"
                    onClick={() => onPlayAudio(exKey, audioUrl, ex.en)}
                    className={`group flex items-start gap-2.5 p-3 rounded-2xl border text-left transition-all cursor-pointer active:scale-[0.99] ${
                      isPlaying
                        ? "bg-sky-50 dark:bg-sky-950/60 border-sky-400 ring-2 ring-sky-300/60 dark:ring-sky-700/60"
                        : "bg-slate-50/90 hover:bg-sky-50/80 dark:bg-slate-800/70 dark:hover:bg-sky-950/40 border-slate-200/70 hover:border-sky-300 dark:border-slate-700"
                    }`}
                  >
                    <span
                      className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs transition-all ${
                        isPlaying
                          ? "bg-sky-500 border-sky-500 text-white animate-pulse scale-105"
                          : "bg-white dark:bg-slate-900 border-sky-200/80 dark:border-slate-700 text-sky-600 dark:text-sky-400 group-hover:scale-105"
                      }`}
                    >
                      <Volume2 className="w-4 h-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-sm text-slate-800 dark:text-white leading-snug">
                        {ex.emoji ? `${ex.emoji} ` : ""}
                        {ex.en}
                      </p>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                        {ex.vi}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Tip */}
          {(pt.tipVi || pt.tipEn) && (
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200">
              <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="font-semibold leading-relaxed">
                <strong>{isVi ? "Mẹo nhỏ: " : "Tip: "}</strong>
                {isVi ? pt.tipVi || pt.tipEn : pt.tipEn || pt.tipVi}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function UnitGrammarContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { locale } = useTeacherLocale();
  const isVi = locale !== "en";

  const grade = parseInt(searchParams.get("grade") || "3", 10) || 3;
  const unit = parseInt(searchParams.get("unit") || "1", 10) || 1;
  const returnUrl = searchParams.get("returnUrl") || "/teacher?tab=lib-global";

  const [lesson, setLesson] = useState<UnitGrammarLesson | null>(null);
  const [isLoadingLesson, setIsLoadingLesson] = useState(true);

  useEffect(() => {
    let active = true;
    setIsLoadingLesson(true);
    loadUnitGrammarLesson(grade, unit)
      .then((res) => {
        if (active) {
          setLesson(res);
          setIsLoadingLesson(false);
        }
      })
      .catch(() => {
        if (active) {
          setLesson(null);
          setIsLoadingLesson(false);
        }
      });
    return () => {
      active = false;
    };
  }, [grade, unit]);

  const [stage, setStage] = useState<"summary" | "practice">("summary");
  const [practiceRetryKey, setPracticeRetryKey] = useState(0);
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    setPlayingKey(null);
  }, []);

  useEffect(() => {
    return () => stopAudio();
  }, [stopAudio]);

  const playAudio = useCallback(
    (key: string, url: string, fallbackText: string) => {
      stopAudio();
      setPlayingKey(key);
      try {
        const audio = new Audio(url);
        audio.playbackRate = 1.0;
        audioRef.current = audio;
        audio.onended = () => {
          if (audioRef.current === audio) {
            audioRef.current = null;
            setPlayingKey(null);
          }
        };
        audio.onerror = () => {
          if (audioRef.current === audio) {
            audioRef.current = null;
            speakEnglishFallback(fallbackText, () => setPlayingKey(null));
          }
        };
        audio.play().catch(() => {
          if (audioRef.current === audio) {
            audioRef.current = null;
            speakEnglishFallback(fallbackText, () => setPlayingKey(null));
          }
        });
      } catch {
        speakEnglishFallback(fallbackText, () => setPlayingKey(null));
      }
    },
    [stopAudio]
  );

  const handleStartPractice = useCallback(() => {
    if (!lesson) return;
    stopAudio();
    setPracticeRetryKey((k) => k + 1);
    setStage("practice");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [lesson, stopAudio]);

  // Map grammar practice questions to KidTeenQuizRunner's question schema
  const quizQuestions = useMemo(() => {
    if (!lesson) return [];
    const includeQuestionAudio = hasGrammarQuestionAudio(lesson.grade);
    return lesson.questions.map((q) => ({
      id: q.id,
      type: "MULTIPLE_CHOICE",
      audioUrl: includeQuestionAudio
        ? getGrammarQuestionAudioUrl(lesson.grade, lesson.unit, q.id)
        : undefined,
      explanation: `[EN] ${q.explanationEn}\n\n[VI] ${q.explanationVi}`,
      content: JSON.stringify({
        type: "MULTIPLE_CHOICE",
        questionText: q.prompt,
        options: q.options.map((text, idx) => ({
          text,
          isCorrect: idx === q.correctIndex,
        })),
      }),
    }));
  }, [lesson]);

  const assignmentMock = useMemo(() => {
    if (!lesson) return null;
    return {
      id: `unit-grammar-g${lesson.grade}-u${lesson.unit}`,
      title: `Grade ${lesson.grade} • Unit ${lesson.unit}: ${lesson.unitTitle}`,
      slug: `grade-${lesson.grade}-unit-${lesson.unit}-grammar`,
      materialType: "EXERCISE",
      targetAudiences: ["kid", "teen"],
      level: `grade-${lesson.grade}`,
      _count: { questions: quizQuestions.length },
    };
  }, [lesson, quizQuestions.length]);

  const emptyPromise = useMemo(() => Promise.resolve({}), []);
  const emptyArrayPromise = useMemo(() => Promise.resolve([]), []);

  if (isLoadingLesson) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50/80 via-sky-50/50 to-purple-50/70 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin mx-auto" />
          <p className="font-headline font-bold text-sm text-indigo-700 dark:text-indigo-300">
            {isVi ? `Đang tải ngữ pháp Lớp ${grade} - Unit ${unit}...` : `Loading Grade ${grade} - Unit ${unit} Grammar...`}
          </p>
        </div>
      </div>
    );
  }

  if (!lesson || !assignmentMock) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="font-headline font-black text-lg text-slate-800 dark:text-white">
            {isVi
              ? `Chưa có bài ôn ngữ pháp cho Grade ${grade} - Unit ${unit}`
              : `Grammar lesson not available yet for Grade ${grade} - Unit ${unit}`}
          </h3>
          <p className="text-xs text-slate-500">
            {isVi
              ? "Nội dung ngữ pháp cho khối lớp này đang được cập nhật."
              : "Grammar content for this grade is being updated."}
          </p>
          <button
            type="button"
            onClick={() => router.push(returnUrl)}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            {isVi ? "Quay lại Thư viện" : "Back to Library"}
          </button>
        </div>
      </div>
    );
  }

  const pageLabel = lesson.isSentencePattern
    ? isVi
      ? "Mẫu câu trọng tâm"
      : "Key Sentences"
    : isVi
      ? "Ôn tập Ngữ pháp"
      : "Grammar Review";

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/80 via-sky-50/50 to-purple-50/70 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30">
      {/* ================= STAGE 1: GRAMMAR SUMMARY ================= */}
      {stage === "summary" && (
        <div className="pb-16">
          <header className="sticky top-0 z-30 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800">
            <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => router.push(returnUrl)}
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                  title={isVi ? "Quay lại Thư viện" : "Back to Library"}
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-[10px] font-black uppercase tracking-wider">
                      Grade {lesson.grade} • Unit {lesson.unit}
                    </span>
                    <span className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400">
                      {pageLabel}
                    </span>
                  </div>
                  <h1 className="font-headline font-black text-sm sm:text-base text-slate-800 dark:text-white truncate">
                    {lesson.unitTitle}
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowShareModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/50 dark:hover:bg-sky-900/60 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 font-extrabold text-xs transition-all cursor-pointer active:scale-95"
                  title={isVi ? "Chia sẻ link & mã QR cho học sinh" : "Share link & QR code"}
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isVi ? "Chia sẻ" : "Share"}</span>
                </button>
                <TeacherLocaleSwitch />
              </div>
            </div>
          </header>

          <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
            {/* Hero Banner */}
            <div className="rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white p-6 sm:p-7 shadow-xl shadow-indigo-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-black uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>
                    Global Success • Grade {lesson.grade} • Unit {lesson.unit}
                  </span>
                </div>
                <h2 className="font-headline font-black text-2xl sm:text-3xl leading-tight">
                  {pageLabel}: {lesson.unitTitle}
                </h2>
                <p className="text-xs sm:text-sm text-indigo-100 font-medium">
                  {isVi
                    ? `Xem nhanh ${lesson.summaryPoints.length} trọng tâm bên dưới, sau đó bấm Làm bài tập để thực hành ngay ${lesson.questions.length} câu hỏi!`
                    : `Review the ${lesson.summaryPoints.length} key point(s) below, then start practicing ${lesson.questions.length} questions!`}
                </p>
              </div>
              <button
                type="button"
                onClick={handleStartPractice}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white hover:bg-amber-50 text-indigo-700 font-headline font-black text-sm shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <PenLine className="w-4 h-4" />
                <span>
                  {isVi
                    ? `Làm bài tập (${lesson.questions.length} câu)`
                    : `Start Practice (${lesson.questions.length} Qs)`}
                </span>
              </button>
            </div>

            {/* Grammar Points */}
            <GrammarSummaryCards
              grade={lesson.grade}
              unit={lesson.unit}
              points={lesson.summaryPoints}
              isVi={isVi}
              playingKey={playingKey}
              onPlayAudio={playAudio}
            />

            {/* Bottom CTA */}
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={handleStartPractice}
                className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-headline font-black text-base shadow-xl shadow-indigo-500/25 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <PenLine className="w-5 h-5" />
                <span>
                  {isVi
                    ? `Bắt đầu làm bài tập ngay (${lesson.questions.length} câu)`
                    : `Start Practice Now (${lesson.questions.length} Questions)`}
                </span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </main>
        </div>
      )}

      {/* ================= STAGE 2: PRACTICE QUIZ (KidTeenQuizRunner) ================= */}
      {stage === "practice" && (
        <div className="min-h-screen flex flex-col">
          {/* Compact Top Navigation Bar */}
          <div className="h-14 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-purple-100 dark:border-slate-800 flex items-center justify-between px-3 sm:px-6 sticky top-0 z-40 shadow-2xs gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => {
                  stopAudio();
                  setStage("summary");
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 border border-purple-200/80 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-bold text-xs transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{isVi ? "Tóm tắt ngữ pháp" : "Grammar Summary"}</span>
              </button>
              <Link
                href={returnUrl}
                className="hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs transition-all active:scale-95 shrink-0"
              >
                <span>{isVi ? "Thư viện" : "Library"}</span>
              </Link>
            </div>

            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 text-white hidden sm:flex items-center justify-center shadow-xs shrink-0">
                <BookOpen className="w-3.5 h-3.5" />
              </div>
              <div className="text-left min-w-0">
                <h1 className="font-headline font-black text-xs sm:text-sm text-slate-800 dark:text-white leading-tight truncate">
                  Unit {lesson.unit}: {lesson.unitTitle} • Lớp {lesson.grade}
                </h1>
                <p className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 truncate">
                  {pageLabel} ({quizQuestions.length} {isVi ? "câu" : "Qs"})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowShareModal(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 font-extrabold text-xs transition-all cursor-pointer active:scale-95"
                title={isVi ? "Chia sẻ link & mã QR" : "Share link & QR"}
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isVi ? "Chia sẻ" : "Share"}</span>
              </button>
            </div>
          </div>

          {/* Reused KidTeenQuizRunner */}
          <div className="w-full flex-1">
            <KidTeenQuizRunner
              key={practiceRetryKey}
              assignment={assignmentMock as any}
              questions={quizQuestions}
              initialAnswers={{}}
              extraDataPromise={emptyPromise}
              relatedAssignmentsPromise={emptyArrayPromise}
              questionTranslationsPromise={emptyPromise}
              assignmentTranslationsPromise={emptyPromise}
              isGuest={true}
              cefrLevel={lesson.grade <= 5 ? "a1" : "b1"}
              autoStart={true}
              audioOnlyAfterCheck={hasGrammarQuestionAudio(lesson.grade)}
              customBookButton={{
                title: isVi ? "Xem lại tóm tắt ngữ pháp" : "Review Grammar Summary",
                onClick: () => setShowFormulaModal(true),
              }}
              onRetry={() => {
                stopAudio();
                setPracticeRetryKey((k) => k + 1);
              }}
            />
          </div>
        </div>
      )}

      {/* Quick Grammar Summary Modal (opened from 📖 button inside KidTeenQuizRunner) */}
      {showFormulaModal && (
        <div
          onClick={() => {
            stopAudio();
            setShowFormulaModal(false);
          }}
          className="fixed inset-0 z-[220] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-slate-50 dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <h3 className="font-headline font-black text-base text-slate-800 dark:text-white">
                  {pageLabel} — Unit {lesson.unit}: {lesson.unitTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  stopAudio();
                  setShowFormulaModal(false);
                }}
                className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <GrammarSummaryCards
              grade={lesson.grade}
              unit={lesson.unit}
              points={lesson.summaryPoints}
              isVi={isVi}
              playingKey={playingKey}
              onPlayAudio={playAudio}
            />
          </div>
        </div>
      )}

      {/* Share Link & QR Modal */}
      {showShareModal && (
        <MatchGameShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          topicName={`Grade ${lesson.grade} - Unit ${lesson.unit}: ${lesson.unitTitle} (${pageLabel})`}
          topicId={`unit-grammar-${lesson.grade}-${lesson.unit}`}
          gamePath={`/student/unit-grammar?grade=${lesson.grade}&unit=${lesson.unit}`}
          isGlobalSuccess
          gradeLevel={`grade-${lesson.grade}`}
          subType="quiz"
        />
      )}
    </div>
  );
}

export default function UnitGrammarPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-indigo-600 font-bold">
          Loading Grammar Review...
        </div>
      }
    >
      <UnitGrammarContent />
    </Suspense>
  );
}
