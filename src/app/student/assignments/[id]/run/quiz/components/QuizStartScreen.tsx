"use client";

import React from "react";
import {
  X,
  CheckCircle2,
  Award,
  HelpCircle,
  Clock,
  Eye,
  RotateCcw,
  Loader2,
  Play,
  ArrowLeft,
} from "lucide-react";
import { StartScreenTeacherAvatar } from "./QuizConsumers";

interface QuizStartScreenProps {
  assignment: any;
  activeQuestionsCount: number;
  isHighLevel: boolean;
  isEmbeddedInCanvas: boolean;
  extraDataPromise: Promise<any>;
  shouldShowReviewStartScreen: boolean;
  submissionScore?: number | null;
  scoreResult: { correct: number; total: number } | null;
  initialAnswers: any;
  isAdmin: boolean;
  isFromClass: boolean;
  isRetrying: boolean;
  handleBackToClass: () => void;
  handleStartReview: () => void;
  handleRetryAssignment: () => void;
  handleStartQuiz: (mode: "practice" | "autoplay") => void;
}

export function QuizStartScreen({
  assignment,
  activeQuestionsCount,
  isHighLevel,
  isEmbeddedInCanvas,
  extraDataPromise,
  shouldShowReviewStartScreen,
  submissionScore,
  scoreResult,
  initialAnswers,
  isAdmin,
  isFromClass,
  isRetrying,
  handleBackToClass,
  handleStartReview,
  handleRetryAssignment,
  handleStartQuiz,
}: QuizStartScreenProps) {
  const qCount = assignment._count?.questions ?? activeQuestionsCount;

  return (
    <div 
      className={`${isEmbeddedInCanvas ? 'h-full min-h-[580px] lg:min-h-[660px]' : 'min-h-screen'} font-body flex flex-col items-center justify-center p-6 w-full relative ${
        isHighLevel
          ? "overflow-hidden bg-gradient-to-tr from-[#e6fcf0] via-[#f2faf5] to-[#cbf9e2]"
          : "bg-cover bg-center bg-[#8cd2f6]"
      }`}
      style={isHighLevel ? {} : { backgroundImage: 'url(/images/background/cartoon-background-children.jpg)' }}
    >
      {/* B1+ floating decorative blobs */}
      {isHighLevel && (
        <>
          <div className="absolute top-[-5%] left-[-5%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-br from-[#6ee7b7]/65 to-transparent blur-[130px] animate-pulse pointer-events-none" style={{ animationDuration: '10s' }} />
          <div className="absolute bottom-[-10%] right-[-10%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-tl from-[#a7f3d0]/65 to-transparent blur-[150px] animate-pulse pointer-events-none" style={{ animationDuration: '12s' }} />
          <div className="absolute top-[15%] right-[5%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-bl from-[#5eead4]/55 to-transparent blur-[120px] animate-pulse pointer-events-none" style={{ animationDuration: '15s' }} />
          <div className="absolute top-[25%] left-[8%] w-[120px] h-[120px] rounded-full bg-[#34d399]/20 blur-[15px] animate-bounce pointer-events-none" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-[35%] right-[12%] w-[150px] h-[150px] rounded-full bg-[#a3e635]/15 blur-[20px] animate-bounce pointer-events-none" style={{ animationDuration: '10s' }} />
          <div className="absolute top-[50%] right-[25%] w-[100px] h-[100px] rounded-full bg-[#14b8a6]/18 blur-[15px] animate-pulse pointer-events-none" style={{ animationDuration: '6s' }} />
        </>
      )}

      {/* Start Card */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-[3rem] border-4 border-white dark:border-slate-800 shadow-2xl p-8 md:p-12 max-w-xl w-full text-center relative overflow-hidden animate-in fade-in zoom-in-95 duration-500 flex flex-col items-center">
        {/* Top colored strip */}
        <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-r from-orange-400 via-pink-400 to-purple-500"></div>

        {/* Close button (X) */}
        {!isEmbeddedInCanvas && (
          <button
            onClick={handleBackToClass}
            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-20 cursor-pointer"
            title="Đóng / Quay lại"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Teacher avatar if available */}
        <div className="mb-6 flex justify-center">
          <React.Suspense fallback={<div className="w-20 h-20 rounded-full bg-purple-100 animate-pulse border-4 border-white shadow-md shrink-0" />}>
            <StartScreenTeacherAvatar promise={extraDataPromise} />
          </React.Suspense>
        </div>

        {shouldShowReviewStartScreen ? (
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-black text-xs uppercase tracking-widest mb-3 shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>BÀI TẬP ĐÃ HOÀN THÀNH</span>
          </div>
        ) : (
          <h4 className="text-purple-600 dark:text-purple-400 font-black text-xs uppercase tracking-[0.2em] mb-3">
            {Object.keys(initialAnswers || {}).length > 0
              ? `ĐANG LÀM DỞ (${Object.keys(initialAnswers || {}).length}/${qCount} CÂU)`
              : "ARE YOU READY?"}
          </h4>
        )}
        
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight leading-tight uppercase italic mb-4">
          {assignment.title || "QUIZ FOR LITTLE LEARNERS"}
        </h1>

        {/* Previous result summary card */}
        {shouldShowReviewStartScreen && (
          <div className="flex flex-wrap items-center justify-center gap-3 mb-6 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50/80 via-teal-50/60 to-sky-50/80 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-sky-950/40 border border-emerald-200/70 dark:border-emerald-800/50 shadow-xs w-full max-w-md">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/90 dark:bg-slate-800/90 shadow-xs border border-emerald-100 dark:border-emerald-900/60">
              <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Điểm:</span>
              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                {submissionScore !== null && submissionScore !== undefined
                  ? `${Number(submissionScore.toFixed(1))} đ`
                  : scoreResult
                  ? `${Number(((scoreResult.correct / scoreResult.total) * 10).toFixed(1))} đ`
                  : 'Đã nộp'}
              </span>
            </div>

            {scoreResult && (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/90 dark:bg-slate-800/90 shadow-xs border border-teal-100 dark:border-teal-900/60">
                <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Đúng:</span>
                <span className="text-sm font-black text-teal-600 dark:text-teal-400">
                  {scoreResult.correct}/{scoreResult.total} câu
                </span>
              </div>
            )}
          </div>
        )}

        {!shouldShowReviewStartScreen && (
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-6 text-slate-600 dark:text-slate-300 font-bold text-sm">
            <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-950/40 rounded-2xl border border-purple-100 dark:border-purple-900/40">
              <HelpCircle className="w-5 h-5 text-purple-500" />
              {qCount} QUESTIONS
            </div>
            {assignment.timeLimit && (
              <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-950/40 rounded-2xl border border-purple-100 dark:border-purple-900/40">
                <Clock className="w-5 h-5 text-purple-500" />
                {assignment.timeLimit} MINUTES
              </div>
            )}
          </div>
        )}

        {shouldShowReviewStartScreen ? (
          /* 2 Action Buttons for Completed Exercise */
          <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full max-w-lg justify-center mt-2">
            {/* Review Button */}
            <button
              onClick={handleStartReview}
              className="group relative px-6 py-4 w-full sm:w-1/2 rounded-3xl bg-white dark:bg-slate-800 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/40 border-2 border-emerald-500/40 hover:border-emerald-500 text-emerald-700 dark:text-emerald-300 font-black text-sm uppercase tracking-wider shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>Review kết quả</span>
            </button>

            {/* Làm lại bài (Practise) Button */}
            <button
              onClick={handleRetryAssignment}
              disabled={isRetrying}
              className={`group relative px-6 py-4 w-full sm:w-1/2 rounded-3xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 ${
                isRetrying ? "opacity-75 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              {isRetrying ? (
                <Loader2 className="w-4 h-4 text-white animate-spin shrink-0" />
              ) : (
                <RotateCcw className="w-4 h-4 text-white group-hover:-rotate-90 transition-transform duration-300 shrink-0" />
              )}
              <span>{isRetrying ? "Đang chuẩn bị đề thi..." : "Làm lại (Practise)"}</span>
            </button>
          </div>
        ) : (
          /* Start buttons */
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-lg justify-center mt-4">
            {isAdmin ? (
              <>
                {/* Practice Mode Button (Admin only) */}
                <button
                  onClick={() => handleStartQuiz("practice")}
                  className="group relative px-8 py-4 w-full sm:w-1/2 rounded-3xl bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 border-2 border-purple-200 text-purple-700 font-black text-base uppercase tracking-wider shadow-md hover:scale-[1.03] active:scale-95 transition-all duration-200"
                >
                  <span className="flex items-center justify-center gap-2">
                    <Play className="w-5 h-5 fill-current text-purple-600" />
                    Practice Mode
                  </span>
                </button>

                {/* Autoplay Mode Button (Admin only) */}
                <button
                  onClick={() => handleStartQuiz("autoplay")}
                  className="group relative px-8 py-4 w-full sm:w-1/2 rounded-3xl bg-gradient-to-r from-orange-400 to-amber-500 hover:from-orange-500 hover:to-amber-600 text-white font-black text-base uppercase tracking-wider shadow-lg shadow-orange-500/30 hover:scale-[1.03] active:scale-95 transition-all duration-200"
                >
                  <span className="flex items-center justify-center gap-2">
                    <Play className="w-5 h-5 fill-current text-white animate-pulse" />
                    Autoplay Mode
                  </span>
                </button>
              </>
            ) : (
              /* Regular users: Practice now */
              <button
                onClick={() => handleStartQuiz("practice")}
                className="group relative px-8 py-4 w-full sm:w-2/3 max-w-sm rounded-3xl bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 border-2 border-purple-200 text-purple-700 font-black text-base uppercase tracking-wider shadow-md hover:scale-[1.03] active:scale-95 transition-all duration-200"
              >
                <span className="flex items-center justify-center gap-2">
                  <Play className="w-5 h-5 fill-current text-purple-600" />
                  {Object.keys(initialAnswers || {}).length > 0
                    ? `Tiếp tục làm bài (${Object.keys(initialAnswers || {}).length}/${qCount})`
                    : "Practice now"}
                </span>
              </button>
            )}
          </div>
        )}

        {/* Back to class link */}
        {isFromClass && (
          <button
            onClick={handleBackToClass}
            className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors py-1 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại lớp học</span>
          </button>
        )}
      </div>
    </div>
  );
}
export default QuizStartScreen;
