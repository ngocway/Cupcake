"use client";

import React, { useState, useTransition, useEffect, useMemo, useRef, Suspense } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Loader2,
  CheckCircle,
  Volume2,
  VolumeX,
  ArrowLeft,
} from "lucide-react";

import { LoginModal } from "@/components/LoginButton";
import { completeSubmission } from "@/actions/submission-actions";
import { trackEvent } from "@/lib/analytics";
import { toast } from "sonner";
import { SelectionTranslator } from "@/components/common/SelectionTranslator";
import { QuestionAudioPlayButton } from "@/components/common/QuestionAudioPlayButton";
import { playCorrectSound, playIncorrectSound } from "@/utils/soundEffects";

// Internal Modular Components & Helpers
import { seedShuffle, getQuestionStatus } from "./utils/quizHelpers";
import {
  ExplanationResolver,
  GlobalTeacherInfoConsumer,
  RelatedAssignmentsConsumer,
  SidePanelToggleButton,
} from "./components/QuizConsumers";
import { QuizStartScreen } from "./components/QuizStartScreen";
import { QuizResultModal } from "./components/QuizResultModal";
import { QuizNavGuardModal } from "./components/QuizNavGuardModal";
import { QuizQuestionNumbers } from "./components/QuizQuestionNumbers";
import { MultipleChoiceBlock } from "./components/question-types/MultipleChoiceBlock";
import { TrueFalseBlock } from "./components/question-types/TrueFalseBlock";
import { ClozeTestBlock } from "./components/question-types/ClozeTestBlock";
import { useQuizAudioEngine } from "./hooks/useQuizAudioEngine";

// Dynamically load MatchingQuestionBlock to optimize bundle size
const MatchingQuestionBlock = dynamic(
  () => import("./components/question-types/MatchingQuestionBlock"),
  {
    loading: () => (
      <div className="w-full h-48 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    ),
    ssr: false,
  }
);

interface Props {
  assignment: any;
  submissionId?: string;
  questions?: any[];
  questionsPromise?: Promise<any[]>;
  initialAnswers: any;
  extraDataPromise: Promise<any>;
  relatedAssignmentsPromise?: Promise<any[]>;
  questionTranslationsPromise?: Promise<Record<string, any>>;
  assignmentTranslationsPromise?: Promise<any>;
  isGuest?: boolean;
  cefrLevel?: string;
  isReviewMode?: boolean;
  submissionScore?: number | null;
  isFromClass?: boolean;
  classId?: string;
  autoStart?: boolean;
  onComplete?: (score: number, assignmentId: string) => void;
  onRetry?: () => void;
  isEmbeddedInCanvas?: boolean;
  isAdmin?: boolean;
}

export default function KidTeenQuizRunner({
  assignment,
  submissionId,
  questions: rawQuestionsProp = [],
  questionsPromise,
  initialAnswers,
  extraDataPromise,
  relatedAssignmentsPromise,
  questionTranslationsPromise,
  assignmentTranslationsPromise,
  isGuest = false,
  cefrLevel = "a1",
  isReviewMode = false,
  submissionScore = null,
  isFromClass = false,
  classId,
  autoStart = false,
  onComplete,
  onRetry,
  isEmbeddedInCanvas = false,
  isAdmin = false,
}: Props) {
  const [rawQuestions, setRawQuestions] = useState<any[]>(rawQuestionsProp);
  const [attemptSeed, setAttemptSeed] = useState<string>(() => {
    return submissionId || `${assignment?.id || "quiz"}-${Date.now()}`;
  });

  useEffect(() => {
    if (rawQuestionsProp && rawQuestionsProp.length > 0) {
      setRawQuestions(rawQuestionsProp);
    }
  }, [rawQuestionsProp]);

  useEffect(() => {
    if (questionsPromise) {
      questionsPromise
        .then((qs) => {
          if (qs && qs.length > 0) {
            setRawQuestions(qs);
          }
        })
        .catch((err) => {
          console.error("Error loading questions in background:", err);
        });
    }
  }, [questionsPromise]);

  useEffect(() => {
    if (submissionId) {
      setAttemptSeed(submissionId);
    }
  }, [submissionId]);

  // Keep question list in original order; shuffle options within each question
  const activeQuestions = useMemo(() => {
    if (!rawQuestions || rawQuestions.length === 0) return [];
    return rawQuestions.map((q) => {
      let parsedContent: any;
      try {
        parsedContent = typeof q.content === "string" ? JSON.parse(q.content) : q.content;
      } catch {
        parsedContent = q.content;
      }

      if (parsedContent && Array.isArray(parsedContent.options)) {
        const optionsWithIndex = parsedContent.options.map((opt: any, idx: number) => ({
          ...opt,
          originalIndex: opt.originalIndex !== undefined ? opt.originalIndex : idx,
        }));
        const shuffledOptions = seedShuffle(optionsWithIndex, `${attemptSeed}-${q.id}-opts`);
        return {
          ...q,
          content: JSON.stringify({
            ...parsedContent,
            options: shuffledOptions,
          }),
        };
      }
      return q;
    });
  }, [rawQuestions, attemptSeed]);

  const questions = activeQuestions;
  const t = useTranslations("student.quiz");
  const router = useRouter();
  const [, startTransition] = useTransition();

  const hasNotifiedReviewCompleteRef = useRef(false);

  useEffect(() => {
    if (isReviewMode && !hasNotifiedReviewCompleteRef.current) {
      hasNotifiedReviewCompleteRef.current = true;
      if (onComplete && assignment?.id && submissionScore !== null && submissionScore !== undefined) {
        setTimeout(() => {
          onComplete(submissionScore, assignment.id);
        }, 0);
      }
      if (typeof window !== "undefined" && window.parent && window.parent !== window) {
        try {
          window.parent.postMessage(
            {
              type: "ACTIVITY_COMPLETED",
              assignmentId: assignment?.id,
              score: submissionScore,
            },
            "*"
          );
        } catch {}
      }
    }
  }, [isReviewMode, assignment?.id, submissionScore, onComplete]);

  const _normalizedLevel = (cefrLevel || "").toLowerCase().split(",")[0].trim();
  const isHighLevel = [
    "b1",
    "b2",
    "c1",
    "c2",
    "intermediate",
    "upper-intermediate",
    "upper_intermediate",
    "advanced",
    "proficiency",
  ].includes(_normalizedLevel);

  const isExerciseQuiz = !assignment?.materialType || assignment?.materialType === "EXERCISE";
  const shouldShowReviewStartScreen = Boolean(isReviewMode && isExerciseQuiz);
  const [hasStarted, setHasStarted] = useState(
    autoStart ? true : isReviewMode ? !shouldShowReviewStartScreen : false
  );
  const [quizMode, setQuizMode] = useState<"practice" | "autoplay">("practice");

  const [currentIndex, setCurrentIndex] = useState(0);
  const currentQuestion = activeQuestions[currentIndex];
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("right");
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isAutoRevealing, setIsAutoRevealing] = useState(false);
  const [scoreResult, setScoreResult] = useState<{ correct: number; total: number } | null>(() => {
    if (isReviewMode && questions && questions.length > 0) {
      const correct = questions.filter((q) => getQuestionStatus(q, initialAnswers[q.id]) === "correct").length;
      return { correct, total: questions.length };
    }
    return null;
  });
  const [isShowingResultScreen, setIsShowingResultScreen] = useState(false);

  // Core quiz state
  const [answers, setAnswers] = useState(initialAnswers || {});
  const [checkedQuestions, setCheckedQuestions] = useState<Record<string, boolean>>(() => {
    if (isReviewMode) {
      const initialChecked: Record<string, boolean> = {};
      (questions || []).forEach((q) => {
        initialChecked[q.id] = true;
      });
      return initialChecked;
    }
    return {};
  });
  const [expandedExplanations, setExpandedExplanations] = useState<Record<string, boolean>>(() => {
    if (isReviewMode) {
      const initialExp: Record<string, boolean> = {};
      (questions || []).forEach((q) => {
        const status = getQuestionStatus(q, initialAnswers[q.id]);
        if (status !== "correct") {
          initialExp[q.id] = true;
        }
      });
      return initialExp;
    }
    return {};
  });

  useEffect(() => {
    if (initialAnswers && Object.keys(initialAnswers).length > 0) {
      setAnswers(initialAnswers);
    }
  }, [initialAnswers]);

  useEffect(() => {
    if (isReviewMode && activeQuestions && activeQuestions.length > 0) {
      setCheckedQuestions((prev) => {
        const next = { ...prev };
        activeQuestions.forEach((q) => {
          next[q.id] = true;
        });
        return next;
      });
      setExpandedExplanations((prev) => {
        const next = { ...prev };
        activeQuestions.forEach((q) => {
          const status = getQuestionStatus(q, answers[q.id]);
          if (status !== "correct") {
            next[q.id] = true;
          }
        });
        return next;
      });
      const correct = activeQuestions.filter((q) => getQuestionStatus(q, answers[q.id]) === "correct").length;
      setScoreResult({ correct, total: activeQuestions.length });
    }
  }, [isReviewMode, activeQuestions, answers]);

  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetryAssignment = async () => {
    if (isRetrying) return;
    setIsRetrying(true);
    try {
      if (onRetry) {
        await onRetry();
        return;
      }
      const identifier = assignment.slug || assignment.id;
      const fromClassParam = isFromClass && classId ? `&fromClass=true&classId=${classId}` : "";
      router.push(`/student/assignments/${identifier}/run?direct=true&newAttempt=true${fromClassParam}`);
    } catch (err) {
      console.error("Retry failed:", err);
      setIsRetrying(false);
    }
  };

  const handleBackToClass = () => {
    if (classId) {
      router.push(`/student/classes/${classId}`);
    } else if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/student/classes");
    }
  };

  const navigateTo = (newIndex: number) => {
    if (newIndex === currentIndex && !isShowingResultScreen) return;
    if (isAutoRevealing) return;
    if (isShowingResultScreen) setIsShowingResultScreen(false);

    audioEngine.setAutoplayCountdown(null);
    audioEngine.setNextQuestionCountdown(null);
    audioEngine.setIsAnswerRevealed(false);

    setSlideDirection(newIndex > currentIndex ? "left" : "right");
    setCurrentIndex(newIndex);
  };

  // Audio Engine Hook
  const audioEngine = useQuizAudioEngine({
    isEmbeddedInCanvas,
    autoStart,
    quizMode,
    targetAudiences: assignment.targetAudiences,
    lessonTargetAudiences: assignment.lesson?.targetAudiences,
    currentQuestion,
    hasStarted,
    isShowingResultScreen,
    onAutoplayAnswerReveal: (qId) => {
      setCheckedQuestions((prev) => ({ ...prev, [qId]: true }));
    },
    onAutoplayNextQuestion: () => {
      if (currentIndex < questions.length - 1) {
        navigateTo(currentIndex + 1);
      }
    },
  });

  const handleStartReview = () => {
    setHasStarted(true);
    if (audioEngine.bgMusicRef.current && !audioEngine.isMuted) {
      audioEngine.bgMusicRef.current.play().catch(() => {});
    }
  };

  const handleStartQuiz = (mode: "practice" | "autoplay") => {
    setQuizMode(mode);
    setHasStarted(true);
    if (audioEngine.bgMusicRef.current && !audioEngine.isMuted) {
      audioEngine.bgMusicRef.current.play().catch((e) => console.error("Error playing background music on start", e));
    }
  };

  // Nav guard
  const [navGuard, setNavGuard] = useState<{ isOpen: boolean; targetUrl: string; targetTitle: string }>({
    isOpen: false,
    targetUrl: "",
    targetTitle: "",
  });
  const [showLoginModal, setShowLoginModal] = useState(false);

  const isDirty = Object.keys(answers).length > 0;
  const isAllChecked = useMemo(
    () => activeQuestions.length > 0 && activeQuestions.every((q) => checkedQuestions[q.id]),
    [activeQuestions, checkedQuestions]
  );
  const allCompleted = useMemo(
    () =>
      activeQuestions.length > 0 &&
      activeQuestions.every((q) => {
        const ans = answers[q.id];
        return ans !== undefined && ans !== null && (typeof ans === "object" ? Object.keys(ans).length > 0 : true);
      }),
    [activeQuestions, answers]
  );

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const handleSafeNavigate = (href: string, title?: string) => {
    if (isDirty) {
      setNavGuard({ isOpen: true, targetUrl: href, targetTitle: title || "..." });
    } else {
      router.push(href);
    }
  };

  // Answer change
  const handleAnswerChange = (q: any, value: any) => {
    if (isReviewMode || checkedQuestions[q.id]) return;

    audioEngine.playClickSound();

    let questionData: any;
    try {
      questionData = JSON.parse(q.content);
    } catch {
      questionData = {};
    }
    const qType = questionData.type || q.type;

    setAnswers((prev: any) => {
      const cur = prev[q.id];
      if (qType === "MULTIPLE_SELECT") {
        const arr = Array.isArray(cur) ? cur : [];
        return arr.includes(value)
          ? { ...prev, [q.id]: arr.filter((v: any) => v !== value) }
          : { ...prev, [q.id]: [...arr, value] };
      }
      if (qType === "MATCHING") {
        const m = cur && typeof cur === "object" ? { ...cur } : {};
        if (value.rightText === null) {
          delete m[value.leftId];
        } else {
          Object.keys(m).forEach((k) => {
            if (m[k] === value.rightText) delete m[k];
          });
          m[value.leftId] = value.rightText;
        }
        return { ...prev, [q.id]: m };
      }
      if (qType === "CLOZE_TEST") {
        const c = cur && typeof cur === "object" ? cur : {};
        return { ...prev, [q.id]: { ...c, ...value } };
      }
      return { ...prev, [q.id]: value };
    });
  };

  // Check all & Submit
  const handleCheckAll = async () => {
    const unanswered: number[] = [];
    questions.forEach((q, idx) => {
      const ans = answers[q.id];
      const empty =
        ans === undefined ||
        (Array.isArray(ans) && ans.length === 0) ||
        (typeof ans === "object" && ans !== null && Object.keys(ans).length === 0);
      if (empty) unanswered.push(idx);
    });

    if (unanswered.length > 0) {
      toast.error(t("unansweredError", { numbers: unanswered.map((i) => i + 1).join(", ") }));
      navigateTo(unanswered[0]);
      return;
    }

    setIsAutoRevealing(true);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    const newChecked: Record<string, boolean> = {};
    const newExpanded: Record<string, boolean> = {};
    let currentRevealIndex = 0;

    const revealInterval = setInterval(() => {
      if (currentRevealIndex >= questions.length) {
        clearInterval(revealInterval);

        const correct = questions.filter((q) => getQuestionStatus(q, answers[q.id]) === "correct").length;
        setScoreResult({ correct, total: questions.length });

        const calculatedScore = questions.length > 0 ? (correct / questions.length) * 10 : 10;
        if (onComplete && assignment?.id) {
          onComplete(calculatedScore, assignment.id);
        }

        if (submissionId) {
          trackEvent('student_assignment_submitted', {
            assignment_id: assignment?.id,
            assignment_title: assignment?.title,
            class_id: classId || (isFromClass ? 'from_class' : null),
          });
          completeSubmission(submissionId, answers).catch((err) => {
            console.error("Failed to auto-complete submission:", err);
          });
        }

        setTimeout(() => {
          setIsShowingResultScreen(true);
          setIsSidePanelOpen(false);
          setIsAutoRevealing(false);
        }, 800);
        return;
      }

      const q = questions[currentRevealIndex];
      newChecked[q.id] = true;

      const isCorrect = getQuestionStatus(q, answers[q.id]) === "correct";
      if (!audioEngine.isMuted) {
        if (isCorrect) playCorrectSound();
        else playIncorrectSound();
      }

      if (!isCorrect && q.explanation) {
        newExpanded[q.id] = true;
      }

      setCheckedQuestions({ ...newChecked });
      setExpandedExplanations({ ...newExpanded });

      currentRevealIndex++;
    }, 400);
  };

  const handleReset = () => {
    setAttemptSeed(`${assignment?.id || "quiz"}-${Date.now()}`);
    setAnswers({});
    setCheckedQuestions({});
    setExpandedExplanations({});
    setCurrentIndex(0);
    setSlideDirection("right");
    setScoreResult(null);
    setIsSidePanelOpen(false);
    setIsShowingResultScreen(false);
  };

  // Question data
  let currentQuestionData: any;
  try {
    currentQuestionData = JSON.parse(currentQuestion?.content || "{}");
  } catch {
    currentQuestionData = { questionText: currentQuestion?.content };
  }

  const qType = currentQuestionData.type || currentQuestion?.type;
  const isMultiSelect = qType === "MULTIPLE_SELECT";
  let questionText =
    currentQuestionData.instruction ??
    currentQuestionData.questionText ??
    currentQuestionData.statement ??
    currentQuestionData.textWithBlanks ??
    currentQuestion?.content;
  if (questionText?.startsWith("{") && questionText?.endsWith("}")) questionText = "";
  if (qType === "CLOZE_TEST" && questionText && questionText.includes("{{")) {
    questionText = currentQuestionData.instruction || t("clozeTest") || "Fill in the blank";
  }

  const userAnswer = answers[currentQuestion?.id];
  const isChecked = checkedQuestions[currentQuestion?.id] || false;
  const questionStatus = currentQuestion ? getQuestionStatus(currentQuestion, userAnswer) : "pending";
  const isCorrectNow = isChecked && questionStatus === "correct";
  const isWrongNow = isChecked && questionStatus !== "correct" && questionStatus !== "pending";

  const matchingColors = ["#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#3B82F6", "#EC4899"];

  // 1. Start Screen
  if (!hasStarted) {
    return (
      <QuizStartScreen
        assignment={assignment}
        activeQuestionsCount={activeQuestions.length}
        isHighLevel={isHighLevel}
        isEmbeddedInCanvas={isEmbeddedInCanvas}
        extraDataPromise={extraDataPromise}
        shouldShowReviewStartScreen={shouldShowReviewStartScreen}
        submissionScore={submissionScore}
        scoreResult={scoreResult}
        initialAnswers={initialAnswers}
        isAdmin={isAdmin}
        isFromClass={isFromClass}
        isRetrying={isRetrying}
        handleBackToClass={handleBackToClass}
        handleStartReview={handleStartReview}
        handleRetryAssignment={handleRetryAssignment}
        handleStartQuiz={handleStartQuiz}
      />
    );
  }

  if (!currentQuestion) return null;

  return (
    <div
      className={`${
        isEmbeddedInCanvas ? "h-full min-h-[580px] lg:min-h-[660px]" : "min-h-screen"
      } font-body flex flex-col ${
        isHighLevel
          ? "overflow-hidden bg-gradient-to-tr from-[#e6fcf0] via-[#f2faf5] to-[#cbf9e2]"
          : "bg-[#8cd2f6]"
      }`}
    >
      {/* Decorative blobs */}
      {isHighLevel && (
        <>
          <div
            className={`${
              isEmbeddedInCanvas ? "absolute" : "fixed"
            } top-[-5%] left-[-5%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-br from-[#6ee7b7]/65 to-transparent blur-[130px] animate-pulse pointer-events-none -z-0`}
            style={{ animationDuration: "10s" }}
          />
          <div
            className={`${
              isEmbeddedInCanvas ? "absolute" : "fixed"
            } bottom-[-10%] right-[-10%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-tl from-[#a7f3d0]/65 to-transparent blur-[150px] animate-pulse pointer-events-none -z-0`}
            style={{ animationDuration: "12s" }}
          />
        </>
      )}

      <SelectionTranslator />

      {/* Main Content Area */}
      <div
        className="flex-1 flex flex-col items-center justify-start lg:justify-center pt-14 lg:pt-16 p-2 lg:p-6 w-full relative bg-cover bg-center bg-no-repeat"
        style={isHighLevel ? {} : { backgroundImage: "url(/images/background/cartoon-background-children.jpg)" }}
      >
        {/* Floating Top-Left Controls */}
        <div className="absolute top-4 left-4 sm:left-6 z-30 flex items-center gap-2 sm:gap-2.5">
          {!isEmbeddedInCanvas && (
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 bg-white/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/80 shadow-md hover:bg-white/80 transition-all active:scale-95 group cursor-pointer"
              title="Về trang chủ"
            >
              <img
                src="/images/logo.png"
                alt="Dolcake"
                className="w-7 h-7 object-contain group-hover:rotate-12 transition-transform duration-700 shrink-0"
              />
              <div className="flex flex-col text-left">
                <span className="font-headline font-black text-base tracking-tighter text-primary leading-none">
                  Dolcake
                </span>
                <span className="text-[7px] font-black text-primary/60 tracking-[0.3em] uppercase hidden sm:block">
                  Student Portal
                </span>
              </div>
            </button>
          )}

          {!isEmbeddedInCanvas && (
            <button
              onClick={() => audioEngine.setIsMuted(!audioEngine.isMuted)}
              className="flex items-center justify-center p-2 bg-white/60 backdrop-blur-md text-purple-600 rounded-full border border-white/80 hover:bg-white/80 transition-all active:scale-95 shadow-md cursor-pointer"
              title={audioEngine.isMuted ? "Unmute music" : "Mute music"}
            >
              {audioEngine.isMuted ? (
                <VolumeX className="w-5 h-5 text-rose-500" />
              ) : (
                <Volume2 className="w-5 h-5 text-purple-500 animate-pulse" />
              )}
            </button>
          )}

          {isFromClass && !isEmbeddedInCanvas && (
            <button
              onClick={handleBackToClass}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/70 hover:bg-white text-slate-700 dark:text-slate-200 rounded-full border border-white/80 font-bold text-xs uppercase tracking-wider shadow-xs hover:shadow-md active:scale-95 transition-all cursor-pointer backdrop-blur-md"
              title="Quay về lớp học"
            >
              <ArrowLeft className="w-3.5 h-3.5 shrink-0 text-slate-600 dark:text-slate-300" />
              <span className="hidden sm:inline">Về lớp học</span>
            </button>
          )}

          {isReviewMode && !isShowingResultScreen && (
            <button
              onClick={handleRetryAssignment}
              disabled={isRetrying}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-full font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg active:scale-95 transition-all ${
                isRetrying ? "opacity-75 cursor-not-allowed" : "cursor-pointer"
              }`}
              title={t("retry") || "Làm lại"}
            >
              {isRetrying ? (
                <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />
              ) : (
                <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>{isRetrying ? "Đang tải..." : t("retry") || "Làm lại"}</span>
            </button>
          )}

          <Suspense fallback={null}>
            <GlobalTeacherInfoConsumer promise={extraDataPromise} handleSafeNavigate={handleSafeNavigate} />
          </Suspense>
        </div>

        {/* Smart Container / Main Card */}
        <div className="w-full max-w-4xl mx-auto z-10 relative transition-all duration-300 flex flex-col items-center">
          <div
            key={`${currentIndex}-${slideDirection}`}
            className={`w-full ${
              slideDirection === "left"
                ? "animate-in slide-in-from-right-16 fade-in-0"
                : "animate-in slide-in-from-left-16 fade-in-0"
            } duration-300`}
          >
            <div
              className={`bg-white rounded-[48px] shadow-xl overflow-visible transition-all duration-500 relative border-[6px] flex flex-col ${
                isChecked && quizMode !== "autoplay" ? "max-h-[60dvh]" : "max-h-[85dvh]"
              } ${
                isCorrectNow
                  ? "border-emerald-400"
                  : isWrongNow
                  ? "border-rose-400"
                  : "border-[#9A89FF]"
              }`}
            >
              {/* Card Header Row */}
              <div className="flex items-center justify-between px-6 pt-5 pb-1 z-20">
                <div className="flex items-center gap-2">
                  <Suspense fallback={null}>
                    <SidePanelToggleButton
                      promise={extraDataPromise}
                      isSidePanelOpen={isSidePanelOpen}
                      setIsSidePanelOpen={setIsSidePanelOpen}
                    />
                  </Suspense>
                </div>

                {quizMode === "autoplay" && (
                  <div className="flex sm:hidden items-center">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 border border-purple-200 text-purple-700 rounded-full font-black text-xs tracking-wider shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                      <span>{currentIndex + 1} / {activeQuestions.length}</span>
                    </div>
                  </div>
                )}

                <div className={`w-9 h-9 ${quizMode === "autoplay" ? "hidden sm:block" : "block"}`} />
              </div>

              {/* Type Label */}
              <div className="absolute -top-6 right-10 z-20 hidden sm:block">
                <span className="bg-[#9A89FF] text-white text-sm font-bold px-5 py-2 rounded-full shadow-md whitespace-nowrap">
                  {qType === "MULTIPLE_SELECT"
                    ? "Multiple Select"
                    : qType === "MATCHING"
                    ? "Matching"
                    : qType === "CLOZE_TEST"
                    ? "Fill in the blank"
                    : qType === "TRUE_FALSE"
                    ? "True / False"
                    : "Choose the correct answer"}
                </span>
              </div>

              {isChecked && quizMode !== "autoplay" && (
                <div className="absolute -top-6 right-10 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 z-20">
                  <div
                    className={`flex items-center gap-2 text-white font-black text-sm whitespace-nowrap px-5 py-2 rounded-full shadow-md ${
                      isCorrectNow ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                  >
                    {isCorrectNow ? (
                      <>
                        <CheckCircle2 className="w-5 h-5" /> Correct! 🎉
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5" /> Incorrect! 😅
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Card Body */}
              <div
                className={`flex-1 overflow-y-auto min-h-0 relative transition-all duration-500 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${
                  isChecked && quizMode !== "autoplay"
                    ? "px-[clamp(0.75rem,3vw,2rem)] pt-1 pb-[clamp(0.5rem,1.5dvh,1rem)] space-y-[clamp(0.5rem,1.5dvh,0.75rem)]"
                    : "px-[clamp(1rem,4vw,3rem)] pt-2 pb-[clamp(1rem,4dvh,2.5rem)] space-y-[clamp(1rem,2.5dvh,1.5rem)]"
                }`}
              >
                {/* Question text */}
                {qType !== "MATCHING" && questionText && questionText !== "{}" && (
                  <div className="text-center relative w-full flex items-center justify-center gap-3 flex-wrap">
                    <h3
                      className={`interactive-reading-content font-[800] text-[#2D366D] leading-tight transition-all duration-500 cursor-pointer select-text ${
                        isChecked && quizMode !== "autoplay"
                          ? "text-[clamp(1rem,2dvh,1.25rem)]"
                          : "text-[clamp(1.25rem,3.5dvh,2rem)]"
                      }`}
                      style={{ fontFamily: "'Quicksand', 'Nunito', sans-serif" }}
                      title="Tap a word to translate"
                    >
                      {questionText}
                    </h3>
                    {currentQuestion?.audioUrl && (
                      <QuestionAudioPlayButton
                        src={currentQuestion.audioUrl}
                        playbackRate={audioEngine.getQuestionSpeed()}
                      />
                    )}
                  </div>
                )}

                {/* Multiple Choice / Select */}
                {(qType === "MULTIPLE_CHOICE" || qType === "MULTIPLE_SELECT") && (
                  <MultipleChoiceBlock
                    currentQuestion={currentQuestion}
                    options={currentQuestionData.options || []}
                    userAnswer={userAnswer}
                    isChecked={isChecked}
                    isMultiSelect={isMultiSelect}
                    quizMode={quizMode}
                    handleAnswerChange={handleAnswerChange}
                  />
                )}

                {/* True / False */}
                {qType === "TRUE_FALSE" && (
                  <TrueFalseBlock
                    currentQuestion={currentQuestion}
                    currentQuestionData={currentQuestionData}
                    userAnswer={userAnswer}
                    isChecked={isChecked}
                    quizMode={quizMode}
                    attemptSeed={attemptSeed}
                    handleAnswerChange={handleAnswerChange}
                  />
                )}

                {/* Matching Question */}
                {qType === "MATCHING" && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start w-full min-h-0">
                    <div className="md:col-span-4 flex flex-col items-center md:items-start text-center md:text-left space-y-5 px-2">
                      {questionText && questionText !== "{}" && (
                        <div className="flex items-center gap-3 flex-wrap justify-center md:justify-start">
                          <h3
                            className="text-xl sm:text-2xl md:text-3xl font-[800] text-[#2D366D] leading-tight"
                            style={{ fontFamily: "'Quicksand', 'Nunito', sans-serif" }}
                          >
                            {questionText}
                          </h3>
                          {currentQuestion?.audioUrl && (
                            <QuestionAudioPlayButton
                              src={currentQuestion.audioUrl}
                              playbackRate={audioEngine.getQuestionSpeed()}
                            />
                          )}
                        </div>
                      )}
                      {currentQuestion?.imageUrl && (
                        <div className="relative w-full max-w-[280px] aspect-[4/3] rounded-3xl overflow-hidden shadow-md border-4 border-white bg-white">
                          <img
                            src={currentQuestion.imageUrl}
                            alt="Question media"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-8 w-full min-h-0">
                      <MatchingQuestionBlock
                        q={currentQuestion}
                        questionData={currentQuestionData}
                        userAnswer={userAnswer}
                        isChecked={isChecked}
                        handleAnswerChange={handleAnswerChange}
                        matchingColors={matchingColors}
                      />
                    </div>
                  </div>
                )}

                {/* Cloze Test */}
                {qType === "CLOZE_TEST" && (
                  <ClozeTestBlock
                    q={currentQuestion}
                    questionData={currentQuestionData}
                    userAnswer={userAnswer}
                    isChecked={isChecked}
                    handleAnswerChange={handleAnswerChange}
                  />
                )}

                {/* Explanation block */}
                {isChecked && currentQuestion.explanation && (
                  <div className="w-full pt-2">
                    <Suspense
                      fallback={
                        <ExplanationResolver
                          promise={undefined}
                          questionId={currentQuestion.id}
                          explanation={currentQuestion.explanation}
                          isExpanded={quizMode === "autoplay" ? true : !!expandedExplanations[currentQuestion.id]}
                          onToggleExpand={() =>
                            setExpandedExplanations((p) => ({
                              ...p,
                              [currentQuestion.id]: !p[currentQuestion.id],
                            }))
                          }
                          hideHeader={quizMode === "autoplay"}
                        />
                      }
                    >
                      <ExplanationResolver
                        promise={questionTranslationsPromise}
                        questionId={currentQuestion.id}
                        explanation={currentQuestion.explanation}
                        isExpanded={quizMode === "autoplay" ? true : !!expandedExplanations[currentQuestion.id]}
                        onToggleExpand={() =>
                          setExpandedExplanations((p) => ({
                            ...p,
                            [currentQuestion.id]: !p[currentQuestion.id],
                          }))
                        }
                        hideHeader={quizMode === "autoplay"}
                      />
                    </Suspense>
                  </div>
                )}
              </div>

              {/* Card Footer Navigation */}
              <div className="w-full bg-transparent px-[clamp(1rem,4vw,3rem)] py-[clamp(0.75rem,2dvh,1.25rem)] flex items-center justify-between border-t-2 border-slate-100 shrink-0 z-20">
                <button
                  disabled={currentIndex === 0 || isAutoRevealing}
                  onClick={() => navigateTo(currentIndex - 1)}
                  className={`flex items-center gap-2 px-5 sm:px-8 py-3 rounded-full font-black text-base sm:text-lg transition-all duration-200 border-2 cursor-pointer ${
                    currentIndex === 0 || isAutoRevealing
                      ? "border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed"
                      : "border-[#e9d5ff] bg-white text-[#9A89FF] hover:bg-[#9A89FF] hover:border-[#9A89FF] hover:text-white hover:shadow-lg active:scale-95"
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span className="hidden sm:inline">Previous</span>
                </button>

                <div className="flex-1 flex justify-center items-center">
                  {quizMode === "autoplay" &&
                    audioEngine.autoplayCountdown !== null &&
                    !audioEngine.isAnswerRevealed && (
                      <div className="w-12 h-12 rounded-full bg-amber-50/90 border-2 border-amber-200/80 shadow-[0_4px_10px_rgba(245,158,11,0.12),inset_0_2px_4px_rgba(255,255,255,0.9)] flex items-center justify-center text-2xl font-[900] text-amber-500 animate-bounce select-none">
                        {audioEngine.autoplayCountdown}
                      </div>
                    )}
                </div>

                {currentIndex < questions.length - 1 ? (
                  <button
                    disabled={isAutoRevealing}
                    onClick={() => navigateTo(currentIndex + 1)}
                    className={`flex items-center gap-2 px-5 sm:px-8 py-3 rounded-full font-black text-base sm:text-lg transition-all duration-200 border-2 cursor-pointer ${
                      isAutoRevealing
                        ? "border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed"
                        : "border-[#e9d5ff] bg-white text-[#9A89FF] hover:bg-[#9A89FF] hover:border-[#9A89FF] hover:text-white hover:shadow-lg active:scale-95"
                    }`}
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                ) : isReviewMode ? (
                  <button
                    onClick={handleRetryAssignment}
                    disabled={isRetrying}
                    className={`flex items-center gap-2 px-5 sm:px-8 py-3 rounded-full font-black text-base sm:text-lg border-2 border-[#9A89FF] bg-[#9A89FF] text-white hover:bg-[#8371f5] hover:border-[#8371f5] hover:text-white hover:shadow-lg active:scale-95 transition-all cursor-pointer ${
                      isRetrying ? "opacity-75 cursor-not-allowed" : ""
                    }`}
                  >
                    {isRetrying ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <RotateCcw className="w-5 h-5" />
                    )}
                    <span className="hidden sm:inline">
                      {isRetrying ? "Đang chuẩn bị đề thi..." : t("retryAssignment") || "Làm lại bài"}
                    </span>
                    <span className="sm:hidden">
                      {isRetrying ? "Đang tải..." : t("retry") || "Làm lại"}
                    </span>
                  </button>
                ) : isAllChecked ? (
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-2 px-5 sm:px-8 py-3 rounded-full font-black text-base sm:text-lg border-2 border-[#e9d5ff] bg-white text-[#9A89FF] hover:bg-[#9A89FF] hover:border-[#9A89FF] hover:text-white hover:shadow-lg active:scale-95 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-5 h-5" />
                    <span className="hidden sm:inline">Try again</span>
                  </button>
                ) : (
                  <button
                    disabled={isAutoRevealing}
                    onClick={handleCheckAll}
                    className={`flex items-center gap-2 px-5 sm:px-8 py-3 rounded-full font-black text-base sm:text-lg transition-all duration-200 border-2 cursor-pointer ${
                      isAutoRevealing
                        ? "border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed"
                        : "border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-500 hover:border-emerald-500 hover:text-white hover:shadow-lg active:scale-95"
                    }`}
                  >
                    {isAutoRevealing ? (
                      <>
                        <span className="animate-spin inline-block">⏳</span>
                        <span className="hidden sm:inline">Grading...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        <span>Submit</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Question circle buttons (1..15) */}
          <QuizQuestionNumbers
            questions={questions}
            currentIndex={currentIndex}
            answers={answers}
            checkedQuestions={checkedQuestions}
            isAutoRevealing={isAutoRevealing}
            navigateTo={navigateTo}
          />

          {/* Related Content in Review Mode */}
          {scoreResult && relatedAssignmentsPromise && (
            <Suspense fallback={null}>
              <RelatedAssignmentsConsumer
                promise={relatedAssignmentsPromise}
                isGuest={isGuest}
                onNavigate={handleSafeNavigate}
              />
            </Suspense>
          )}
        </div>
      </div>

      {/* Result Modal */}
      {isShowingResultScreen && scoreResult && (
        <QuizResultModal
          scoreResult={scoreResult}
          isRetrying={isRetrying}
          onClose={() => setIsShowingResultScreen(false)}
          handleRetryAssignment={handleRetryAssignment}
        />
      )}

      {/* Nav Guard Modal */}
      <QuizNavGuardModal
        isOpen={navGuard.isOpen}
        targetTitle={navGuard.targetTitle}
        targetUrl={navGuard.targetUrl}
        allCompleted={allCompleted}
        onClose={() => setNavGuard({ ...navGuard, isOpen: false })}
        onConfirm={(url) => {
          setNavGuard({ ...navGuard, isOpen: false });
          router.push(url);
        }}
      />

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        defaultView="studentLogin"
      />
    </div>
  );
}
