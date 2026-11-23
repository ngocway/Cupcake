"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Sparkles, BookOpen, AlertCircle } from "lucide-react";
import KidTeenQuizRunner from "../assignments/[id]/run/quiz/KidTeenQuizRunner";
import { getUnitReviewDataAction } from "@/actions/unit-review-actions";
import { ReviewQuestion } from "@/lib/unit-review-generator";

function UnitReviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const gradeParam = searchParams.get("grade") || "3";
  const unitParam = searchParams.get("unit") || "1";
  const returnUrl = searchParams.get("returnUrl") || "/teacher?tab=lib-global";
  const isEmbedded = searchParams.get("embedded") === "true";

  const grade = parseInt(gradeParam, 10) || 3;
  const unitNumber = parseInt(unitParam, 10) || 1;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unitTitle, setUnitTitle] = useState<string>(`Unit ${unitNumber}`);
  const [questions, setQuestions] = useState<ReviewQuestion[]>([]);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    getUnitReviewDataAction(grade, unitNumber)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.questions.length > 0) {
          setQuestions(res.questions);
          setUnitTitle(res.unitHeader);
        } else {
          setError(res.error || "Không thể tạo bộ đề ôn tập cho bài học này.");
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || "Đã xảy ra lỗi khi tải đề ôn tập.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [grade, unitNumber]);

  const assignmentMock = useMemo(() => {
    return {
      id: `unit-review-g${grade}-u${unitNumber}`,
      title: `${unitTitle} Review Test (Grade ${grade})`,
      slug: `grade-${grade}-unit-${unitNumber}-review`,
      materialType: "EXERCISE",
      targetAudiences: ["kid", "teen"],
      level: `grade-${grade}`,
      _count: { questions: questions.length },
    };
  }, [grade, unitNumber, unitTitle, questions.length]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-100 dark:from-slate-950 dark:via-purple-950/40 dark:to-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-3xl bg-white dark:bg-slate-900 shadow-xl border border-purple-200 dark:border-purple-800 flex items-center justify-center mb-4">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        </div>
        <h2 className="text-xl font-headline font-black text-slate-800 dark:text-white">
          Đang khởi tạo đề ôn tập {unitTitle}...
        </h2>
        <p className="text-xs font-semibold text-slate-500 mt-1 animate-pulse">
          Tổng hợp từ vựng, mẫu câu và câu hỏi trắc nghiệm
        </p>
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="font-headline font-black text-lg text-slate-800 dark:text-white">
            Chưa có đủ dữ liệu ôn tập
          </h3>
          <p className="text-xs text-slate-500">{error || "Vui lòng thử lại sau."}</p>
          <button
            onClick={() => router.push(returnUrl)}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
          >
            Quay lại Thư viện
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F2FF] dark:bg-slate-950 relative overflow-x-hidden">
      {/* Top Bar Navigation */}
      {!isEmbedded && (
        <div className="h-14 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-purple-100 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40 shadow-2xs">
          <Link
            href={returnUrl}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Quay lại Thư viện</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-xs text-xs font-black">
              👑
            </div>
            <div className="text-left">
              <h1 className="font-headline font-black text-xs sm:text-sm text-slate-800 dark:text-white leading-tight">
                {unitTitle} • Lớp {grade}
              </h1>
              <p className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                Đề Ôn Tập Tổng Hợp ({questions.length} câu)
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200/80 text-[11px] font-black">
            <Sparkles className="w-3 h-3 text-purple-500" />
            <span>{questions.length} câu</span>
          </div>
        </div>
      )}

      {/* Quiz Runner */}
      <div className="w-full">
        <KidTeenQuizRunner
          assignment={assignmentMock as any}
          questions={questions}
          initialAnswers={{}}
          extraDataPromise={Promise.resolve({})}
          relatedAssignmentsPromise={Promise.resolve([])}
          questionTranslationsPromise={Promise.resolve({})}
          assignmentTranslationsPromise={Promise.resolve({})}
          isGuest={true}
          cefrLevel={grade <= 5 ? "a1" : "b1"}
          autoStart={isEmbedded}
          onComplete={(score) => {
            if (typeof window !== "undefined" && window.parent && window.parent !== window) {
              try {
                window.parent.postMessage(
                  {
                    type: "GS_STATION_COMPLETED",
                    grade,
                    unit: unitNumber,
                    station: "review",
                    score,
                  },
                  "*"
                );
              } catch {}
            }
          }}
        />
      </div>
    </div>
  );
}

export default function UnitReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        </div>
      }
    >
      <UnitReviewContent />
    </Suspense>
  );
}
