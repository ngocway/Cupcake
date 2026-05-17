"use client";

import React, { useState, useTransition, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  ChevronLeft, 
  ChevronRight, 
  Send, 
  Clock, 
  Layout, 
  BookOpen, 
  HelpCircle,
  Menu,
  ChevronDown,
  Star,
  MessageCircle,
  X,
  CheckCircle2,
  Check
} from "lucide-react";
import BackButton from "@/components/ui/BackButton";
import { BookmarkButton } from "@/components/common/BookmarkButton";
import { submitAssignmentReview } from "@/actions/reviews";
import { toast } from "sonner";
import { ReviewList } from "@/components/reviews/ReviewList";
import { FloatingTeacherInfo } from "@/app/student/_components/FloatingTeacherInfo";
import { RelatedAssignmentsSection } from "@/app/student/_components/RelatedAssignmentsSection";
import { completeSubmission } from "@/actions/submission-actions";
import { useTranslations } from "next-intl";

// Helper to determine question correctness
const getQuestionStatus = (q: any, answer: any) => {
  if (answer === undefined || answer === null) return 'pending';
  
  let questionData: any;
  try {
    questionData = typeof q.content === 'string' ? JSON.parse(q.content) : q.content;
  } catch (e) {
    questionData = {};
  }
  
  const qType = questionData.type || q.type;

  if (qType === "MULTIPLE_CHOICE" || qType === "MULTIPLE_SELECT") {
    const options = questionData.options || [];
    if (qType === "MULTIPLE_SELECT") {
      const answersArray = Array.isArray(answer) ? answer : [];
      const correctIndices = options
        .map((opt: any, i: number) => opt.isCorrect ? i : -1)
        .filter((i: number) => i !== -1);
      
      if (answersArray.length === 0) return 'pending';
      if (answersArray.length !== correctIndices.length) return 'incorrect';
      return answersArray.every(v => correctIndices.includes(v)) ? 'correct' : 'incorrect';
    } else {
      const correctIndex = options.findIndex((opt: any) => opt.isCorrect);
      return answer === correctIndex ? 'correct' : 'incorrect';
    }
  }

  if (qType === "TRUE_FALSE") {
    return answer === questionData.isTrue ? 'correct' : 'incorrect';
  }

  if (qType === "MATCHING") {
    const pairs = questionData.pairs || [];
    const userAnswer = answer || {};
    if (Object.keys(userAnswer).length === 0) return 'pending';
    const isAllCorrect = pairs.every((p: any) => userAnswer[p.id] === p.rightText);
    return isAllCorrect ? 'correct' : 'incorrect';
  }

  return 'pending';
};

function MatchingQuestionBlock({ q, questionData, userAnswer, isChecked, handleAnswerChange, matchingColors }: any) {
  const t = useTranslations("student.quiz");
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<any>(null);
  const [hoveredLine, setHoveredLine] = useState<any>(null);

  const shuffledRightItems = useMemo(() => {
    if (!questionData.pairs) return [];
    const seed = q.id;
    return [...questionData.pairs]
      .map(p => p.rightText)
      .sort(() => (seed.length % 2 === 0 ? 1 : -1) * 0.5 - Math.random());
  }, [q.id, questionData.pairs]);

  const getDotCoords = (id: string, side: 'left' | 'right') => {
    const el = document.getElementById(`dot-${side}-${q.id}-${id}`);
    if (!el || !containerRef.current) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    return {
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.top - containerRect.top + rect.height / 2
    };
  };

  return (
    <div className="space-y-6 select-none">
      <div 
        ref={containerRef}
        className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-6 relative p-4"
        onMouseMove={(e) => {
          if (!dragging || !containerRef.current) return;
          const rect = containerRef.current.getBoundingClientRect();
          setDragging({
            ...dragging,
            x2: e.clientX - rect.left,
            y2: e.clientY - rect.top
          });
        }}
        onMouseUp={() => setDragging(null)}
        onMouseLeave={() => setDragging(null)}
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ minHeight: '300px' }}>
          {Object.entries(userAnswer || {}).map(([leftId, rightText], idx) => {
            const pair = questionData.pairs.find((p: any) => p.id === leftId);
            if (!pair) return null;
            const isCorrect = isChecked && pair.rightText === rightText;
            const coords1 = getDotCoords(leftId, 'left');
            const rightItemIdx = shuffledRightItems.indexOf(rightText as string);
            if (rightItemIdx === -1) return null;
            const coords2 = getDotCoords(rightItemIdx.toString(), 'right');
            let strokeColor = matchingColors[idx % matchingColors.length];
            if (isChecked) strokeColor = isCorrect ? '#10B981' : '#EF4444';

            return (
              <g key={`student-${leftId}`} onMouseEnter={(e) => isChecked && setHoveredLine({ x: e.clientX, y: e.clientY, content: isCorrect ? t('correct') : t('incorrect') })} onMouseLeave={() => setHoveredLine(null)}>
                <line x1={coords1.x} y1={coords1.y} x2={coords2.x} y2={coords2.y} stroke="transparent" strokeWidth="15" className="cursor-help pointer-events-auto" />
                <line x1={coords1.x} y1={coords1.y} x2={coords2.x} y2={coords2.y} stroke={strokeColor} strokeWidth={isCorrect ? "4" : "2"} strokeDasharray={isChecked && !isCorrect ? "6,4" : "0"} className="transition-all duration-500 pointer-events-none" />
                {isChecked && !isCorrect && (() => {
                  const correctIdx = shuffledRightItems.indexOf(pair.rightText);
                  if (correctIdx === -1) return null;
                  const correctCoords = getDotCoords(correctIdx.toString(), 'right');
                  return <line x1={coords1.x} y1={coords1.y} x2={correctCoords.x} y2={correctCoords.y} stroke="#CBD5E1" strokeWidth="2" strokeDasharray="2,4" className="opacity-60 pointer-events-none" />;
                })()}
              </g>
            );
          })}
          {dragging && <line x1={dragging.x1} y1={dragging.y1} x2={dragging.x2} y2={dragging.y2} stroke="#3B82F6" strokeWidth="3" strokeDasharray="6,4" />}
        </svg>
        {hoveredLine && (
          <div className="fixed z-[100] px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold pointer-events-none shadow-xl -translate-x-1/2 -translate-y-full mb-4" style={{ left: hoveredLine.x, top: hoveredLine.y }}>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${hoveredLine.content === 'Đúng' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              {hoveredLine.content}
            </div>
          </div>
        )}
        <div className="space-y-4 z-20">
          <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest block mb-2 px-2">{t("matchingLeftColumn")}</span>
          {(questionData.pairs || []).map((pair: any, idx: number) => {
            const pairedRightText = userAnswer?.[pair.id];
            return (
              <div key={pair.id || idx} className={`group relative p-5 rounded-2xl border-2 transition-all flex items-center justify-between ${pairedRightText ? 'border-secondary/40 bg-secondary/5' : 'border-outline-variant/30 bg-white'}`}>
                <div className="flex items-center gap-4">
                   <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-xs font-black shrink-0">{String.fromCharCode(65 + idx)}</div>
                   {pair.leftImageUrl || (pair.leftText?.startsWith('http') || pair.leftText?.startsWith('/')) ? <img src={pair.leftImageUrl || pair.leftText} alt="" className="h-16 w-16 object-cover rounded-lg border border-outline-variant" /> : <span className="font-bold text-on-surface">{pair.leftText}</span>}
                </div>
                <div id={`dot-left-${q.id}-${pair.id}`} onMouseDown={(e) => {
                  if (isChecked) return;
                  const coords = getDotCoords(pair.id, 'left');
                  setDragging({ fromId: pair.id, fromSide: 'left', x1: coords.x, y1: coords.y, x2: coords.x, y2: coords.y });
                }} onMouseUp={() => {
                  if (dragging && dragging.fromSide === 'right') {
                    handleAnswerChange(q, { leftId: pair.id, rightText: shuffledRightItems[parseInt(dragging.fromId)] });
                    setDragging(null);
                  }
                }} className={`w-5 h-5 rounded-full border-4 border-white shadow-sm cursor-crosshair absolute -right-2.5 top-1/2 -translate-y-1/2 z-30 transition-transform hover:scale-150 ${pairedRightText ? 'bg-secondary' : 'bg-outline-variant hover:bg-primary'}`} />
              </div>
            );
          })}
        </div>
        <div className="space-y-4 z-20">
          <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest block mb-2 px-2">{t("matchingRightColumn")}</span>
          {shuffledRightItems.map((rightText: string, idx: number) => {
            const pairedLeftId = Object.keys(userAnswer || {}).find(k => userAnswer[k] === rightText);
            const isPairCorrect = isChecked && pairedLeftId && (questionData.pairs.find((p:any) => p.id === pairedLeftId)?.rightText === rightText);
            return (
              <div key={idx} className={`group relative p-5 rounded-2xl border-2 transition-all flex items-center gap-4 ${pairedLeftId ? 'border-secondary/40 bg-secondary/5' : 'border-outline-variant/30 bg-white'}`}>
                <div id={`dot-right-${q.id}-${idx}`} onMouseUp={() => {
                  if (dragging && dragging.fromSide === 'left') {
                    handleAnswerChange(q, { leftId: dragging.fromId, rightText });
                    setDragging(null);
                  }
                }} onMouseDown={(e) => {
                  if (isChecked) return;
                  const rect = containerRef.current!.getBoundingClientRect();
                  if (pairedLeftId) {
                    const coords = getDotCoords(pairedLeftId, 'left');
                    setDragging({ fromId: pairedLeftId, fromSide: 'left', x1: coords.x, y1: coords.y, x2: e.clientX - rect.left, y2: e.clientY - rect.top });
                  } else {
                    const coords = getDotCoords(idx.toString(), 'right');
                    setDragging({ fromId: idx.toString(), fromSide: 'right', x1: coords.x, y1: coords.y, x2: coords.x, y2: coords.y });
                  }
                }} className={`w-5 h-5 rounded-full border-4 border-white shadow-sm cursor-crosshair absolute -left-2.5 top-1/2 -translate-y-1/2 z-30 transition-transform hover:scale-150 ${pairedLeftId ? 'bg-secondary' : 'bg-outline-variant hover:bg-primary'}`} />
                {rightText?.startsWith('http') || rightText?.startsWith('/') ? <img src={rightText} alt="" className="h-16 w-16 object-cover rounded-lg border border-outline-variant" /> : <span className="font-bold text-on-surface">{rightText}</span>}
                {isChecked && pairedLeftId && <span className={`material-symbols-outlined ml-auto ${isPairCorrect ? 'text-emerald-500' : 'text-rose-500'}`}>{isPairCorrect ? 'check_circle' : 'cancel'}</span>}
              </div>
            );
          })}
        </div>
      </div>
      {!isChecked && (
        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
           <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-primary"><span className="material-symbols-outlined text-sm">gesture</span></div>
           <p className="text-xs text-slate-500 font-medium">{t("matchingTip")}</p>
        </div>
      )}
    </div>
  );
}

interface Props {
  assignment: any;
  submissionId?: string;
  questions: any[];
  initialAnswers: any;
  isBookmarked: boolean;
  initialReview: any;
  allReviews: any[];
  relatedAssignments: any[];
  isGuest?: boolean;
}

const getYoutubeVideoId = (url: string | null) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export default function QuizClientRunner({ 
  assignment, 
  submissionId, 
  questions, 
  initialAnswers,
  isBookmarked,
  initialReview,
  allReviews = [],
  relatedAssignments = [],
  isGuest = false
}: Props) {
  const t = useTranslations("student.quiz");
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState(initialAnswers);
  const [checkedQuestions, setCheckedQuestions] = useState<Record<string, boolean>>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPending, startTransition] = useTransition();

  const videoUrl = assignment.videoUrl || assignment.lesson?.videoUrl;
  const audioUrl = assignment.audioUrl || assignment.lesson?.audioUrl;
  const youtubeId = getYoutubeVideoId(videoUrl);

  const hasMaterialSection = useMemo(() => {
    if (videoUrl || audioUrl) return true;
    if (assignment?.readingText) {
      const cleanText = String(assignment.readingText).replace(/<[^>]*>/g, "").trim();
      if (cleanText.length > 0) return true;
      if (/<(img|video|audio|iframe|embed)\b/i.test(String(assignment.readingText))) return true;
    }
    return false;
  }, [assignment?.readingText, videoUrl, audioUrl]);

  const hasInstructionText = useMemo(() => {
    if (!assignment?.instructions) return false;
    const cleanText = String(assignment.instructions).replace(/<[^>]*>/g, "").trim();
    if (cleanText.length > 0) return true;
    return /<(img|video|audio|iframe|embed)\b/i.test(String(assignment.instructions));
  }, [assignment?.instructions]);

  // Review State
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [userReview, setUserReview] = useState<any>(initialReview);
  const [reviewRating, setReviewRating] = useState(initialReview?.rating || 0);
  const [reviewComment, setReviewComment] = useState(initialReview?.comment || "");
  const [hoverRating, setHoverRating] = useState(0);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const handleReviewSubmit = async () => {
    if (reviewRating === 0) {
      toast.error(t("starRatingError"));
      return;
    }
    
    setIsSubmittingReview(true);
    try {
      const result = await submitAssignmentReview(assignment.id, reviewRating, reviewComment);
      if (result.success) {
        toast.success(result.message);
        setUserReview({ rating: reviewRating, comment: reviewComment, isApproved: false });
        setTimeout(() => setIsReviewModalOpen(false), 2000);
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      toast.error(t("reviewSubmitError"));
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const [navGuard, setNavGuard] = useState<{ isOpen: boolean; targetUrl: string; targetTitle: string }>({
    isOpen: false,
    targetUrl: "",
    targetTitle: "",
  });
  const router = useRouter();

  const matchingColors = [
    "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316"
  ];

  const isDirty = Object.keys(answers).length > 0;

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const handleSafeNavigate = (href: string, title?: string) => {
    if (isDirty) {
      setNavGuard({
        isOpen: true,
        targetUrl: href,
        targetTitle: title || "...",
      });
    } else {
      router.push(href);
    }
  };

  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveQuestionId(entry.target.id);
          }
        });
      },
      { threshold: 0.3, rootMargin: "-20% 0px -40% 0px" }
    );

    Object.values(questionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [questions]);

  const allCompleted = useMemo(() => {
    return questions.every(q => {
      const ans = answers[q.id];
      return ans !== undefined && ans !== null && (
        (typeof ans === 'object' ? Object.keys(ans).length > 0 : true)
      );
    });
  }, [questions, answers]);

  const isAllChecked = useMemo(() => {
    return questions.length > 0 && questions.every(q => checkedQuestions[q.id]);
  }, [questions, checkedQuestions]);

  const scrollToQuestion = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };
  
  // Shuffling for matching is now handled per-question to avoid ReferenceErrors and support multiple matching questions.

  // Matching state reset is now handled per-question if needed, 
  // but since we render all, we don't need a central reset on index change.

  // Progress is now implied by the sticky circles bar.
  // const isChecked = checkedQuestions[currentQuestion?.id] || false; // Removed stale reference

  const handleAnswerChange = (q: any, value: any) => {
    if (checkedQuestions[q.id]) return;
    
    let questionData: any;
    try {
      questionData = JSON.parse(q.content);
    } catch (e) {
      questionData = {};
    }
    const qType = questionData.type || q.type;

    setAnswers((prev: any) => {
      const currentAnswer = prev[q.id];
      
      if (qType === "MULTIPLE_SELECT") {
        const answersArray = Array.isArray(currentAnswer) ? currentAnswer : [];
        if (answersArray.includes(value)) {
          return { ...prev, [q.id]: answersArray.filter(v => v !== value) };
        } else {
          return { ...prev, [q.id]: [...answersArray, value] };
        }
      }

      if (qType === "MATCHING") {
        const currentMatching = (currentAnswer && typeof currentAnswer === 'object') ? currentAnswer : {};
        const newMatching = { ...currentMatching };
        if (value.rightText === null) {
          delete newMatching[value.leftId];
        } else {
          Object.keys(newMatching).forEach(key => {
            if (newMatching[key] === value.rightText) delete newMatching[key];
          });
          newMatching[value.leftId] = value.rightText;
        }
        return { ...prev, [q.id]: newMatching };
      }

      return {
        ...prev,
        [q.id]: value
      };
    });
  };

  const handleCheckAll = async () => {
    const unansweredIndices: number[] = [];
    questions.forEach((q, idx) => {
      const currentAnswer = answers[q.id];
      const isEmpty = currentAnswer === undefined || 
                      (Array.isArray(currentAnswer) && currentAnswer.length === 0) ||
                      (typeof currentAnswer === 'object' && currentAnswer !== null && Object.keys(currentAnswer).length === 0);
      if (isEmpty) unansweredIndices.push(idx + 1);
    });

    if (unansweredIndices.length > 0) {
      toast.error(t("unansweredError", { numbers: unansweredIndices.join(", ") }));
      scrollToQuestion(questions[unansweredIndices[0] - 1].id);
      return;
    }
    
    // Start sequential reveal
    setCheckedQuestions({}); // Reset first
    
    for (const q of questions) {
      await new Promise(resolve => setTimeout(resolve, 500)); // Delay between reveals
      setCheckedQuestions(prev => ({ ...prev, [q.id]: true }));
    }
    
    toast.success(t("checkAllSuccess"));
  };

  const handleReset = () => {
    // Reset all answers to initial empty state
    const emptyAnswers: Record<string, any> = {};
    setAnswers(emptyAnswers);
    // Reset checked questions to hide answer reveals
    setCheckedQuestions({});
  };

  const handleSubmit = () => {
    if (isGuest) {
      if (confirm(t("guestSubmitConfirm"))) {
        router.push(`/student/login?callbackUrl=/student/assignments/${assignment.id}/run?direct=true`);
      }
      return;
    }
    if (!confirm(t("submitConfirm"))) return;
    
    // Clear dirty state
    setAnswers({});
    startTransition(async () => {
      router.push(`/student/assignments/${assignment.id}/run`);
    });
  };

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden relative">
      {/* Floating Teacher Info */}
      <FloatingTeacherInfo 
        teacher={assignment.teacher} 
        onNavigate={handleSafeNavigate}
      />
      
      {/* Header removed as per user request */}

      {/* Integrated Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Middle Column: Questions (70%) */}
        <div className="w-[70%] shrink-0 flex flex-col bg-slate-50/30 dark:bg-slate-950/30 border-r border-outline-variant/30 relative">
           {/* Progress Navigation Header (Sticky) */}
           <div className="sticky top-0 z-50 min-h-[5rem] py-3 border-b border-outline-variant/20 flex items-center px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shrink-0 gap-6">
              <div className="shrink-0">
                <BackButton className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-black text-[10px] uppercase tracking-widest rounded-xl border border-slate-200 transition-all active:scale-95">
                  <ChevronLeft className="w-4 h-4" />
                  Quay lại
                </BackButton>
              </div>
              
              <div className="flex-1 flex flex-col items-center justify-center gap-2 pr-20"> {/* pr-20 to balance the back button */}
                <h2 className="text-[11px] font-black text-on-surface/80 uppercase tracking-[0.2em] line-clamp-1 max-w-[80%] text-center">
                  {assignment.title}
                </h2>
                <div className="flex items-center gap-3">
                   {questions.map((q, i) => {
                      const ans = answers[q.id];
                      const isCompleted = ans !== undefined && ans !== null && (
                        (typeof ans === 'object' ? Object.keys(ans).length > 0 : true)
                      );
                      const isActive = activeQuestionId === q.id;

                      return (
                          <button
                            key={q.id}
                            onClick={() => scrollToQuestion(q.id)}
                            className={`relative flex items-center justify-center w-10 h-10 rounded-full text-xs font-black transition-all duration-300 border-2 ${
                              isActive 
                               ? "bg-amber-100 border-amber-500 text-amber-600 scale-110 shadow-lg shadow-amber-500/20" 
                               : isCompleted
                                 ? "bg-primary border-primary text-white shadow-md shadow-primary/20"
                                 : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"
                            }`}
                          >
                             {i + 1}
                             
                             {/* Feedback indicator above circle */}
                             {checkedQuestions[q.id] && (
                               <div className="absolute -top-5 left-1/2 -translate-x-1/2 animate-in zoom-in slide-in-from-bottom-2 duration-500 z-20">
                                 {getQuestionStatus(q, answers[q.id]) === 'correct' ? (
                                   <div className="bg-emerald-500 text-white rounded-full p-1 shadow-lg shadow-emerald-500/40 border-2 border-white dark:border-slate-900">
                                     <Check className="w-2.5 h-2.5 stroke-[4px]" />
                                   </div>
                                 ) : (
                                   <div className="bg-rose-500 text-white rounded-full p-1 shadow-lg shadow-rose-500/40 border-2 border-white dark:border-slate-900">
                                     <X className="w-2.5 h-2.5 stroke-[4px]" />
                                   </div>
                                 )}
                               </div>
                             )}

                             {/* Connection line between circles */}
                             {i < questions.length - 1 && (
                               <div className={`absolute left-full w-3 h-0.5 -z-10 ${isCompleted ? 'bg-primary/30' : 'bg-slate-100 dark:bg-slate-800'}`} />
                             )}
                          </button>
                      )
                   })}
                </div>
              </div>
           </div>

          <div className="flex-1 overflow-y-auto no-scrollbar p-8 lg:p-12 pl-12 lg:pl-20 space-y-24 scroll-smooth">
            {/* All Questions Rendered */}
            {questions.map((q, idx) => {
              let questionData: any;
              try {
                questionData = JSON.parse(q.content);
              } catch (e) {
                questionData = { questionText: q.content };
              }

              const qType = questionData.type || q.type;
              const isMultiSelect = qType === "MULTIPLE_SELECT";
              let questionText = questionData.instruction ?? questionData.questionText ?? questionData.statement ?? q.content;
              
              // Prevent showing raw JSON if questionText is just the stringified content
              if (questionText && questionText.startsWith('{') && questionText.endsWith('}')) {
                questionText = "";
              }
              
              const userAnswer = answers[q.id];
              const isChecked = checkedQuestions[q.id] || false;

              return (
                <div 
                  key={q.id}
                  id={q.id}
                  ref={el => { questionRefs.current[q.id] = el }}
                  className="space-y-8 pb-12 border-b border-outline-variant/10 last:border-0"
                >
                  <div className="space-y-4">
                     <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary/10 rounded-lg text-secondary text-[10px] font-black uppercase tracking-widest">
                        {t("questionPrefix")} {idx + 1} • {
                          qType === "MULTIPLE_SELECT" ? t('multipleSelect') : 
                          qType === "MATCHING" ? t('matching') : 
                          t('multipleChoice')
                        }
                     </div>
                      {questionText && questionText !== "{}" && (
                        <h3 className="text-xl font-black text-on-surface leading-snug">
                          {questionText}
                        </h3>
                      )}
                  </div>

                  <div className="space-y-4">
                     {(qType === "MULTIPLE_CHOICE" || qType === "MULTIPLE_SELECT") && (
                       <div className="grid grid-cols-1 gap-3">
                         {(questionData.options || []).map((option: any, i: number) => {
                           const isSelected = isMultiSelect 
                             ? (Array.isArray(userAnswer) && userAnswer.includes(i))
                             : userAnswer === i;
                           const isCorrect = option.isCorrect;
                           
                           let borderClass = 'border-outline-variant/30';
                           let bgClass = 'bg-white dark:bg-slate-900';
                           let textClass = 'text-on-surface-variant';
                           let iconClass = 'bg-surface-container text-on-surface-variant';

                           if (isSelected) {
                             borderClass = 'border-amber-500';
                             bgClass = 'bg-amber-50 dark:bg-amber-900/20';
                             textClass = 'text-amber-700 dark:text-amber-400';
                             iconClass = 'bg-amber-500 text-white';
                           }

                           if (isChecked) {
                             if (isCorrect) {
                               borderClass = 'border-emerald-500';
                               bgClass = 'bg-emerald-500/10';
                               textClass = 'text-emerald-700';
                               iconClass = 'bg-emerald-500 text-white';
                             } else if (isSelected && !isCorrect) {
                               borderClass = 'border-rose-500';
                               bgClass = 'bg-rose-500/10';
                               textClass = 'text-rose-700';
                               iconClass = 'bg-rose-500 text-white';
                             }
                           }

                            return (
                             <button 
                               key={i}
                               disabled={isChecked}
                               onClick={() => handleAnswerChange(q, i)}
                               className={`p-5 rounded-2xl border-2 text-left font-bold transition-all relative ${borderClass} ${bgClass} ${textClass} ${isChecked ? 'cursor-default' : 'hover:border-primary/50'}`}
                             >
                               <div className="flex items-center gap-4">
                                 <div className={`w-8 h-8 flex items-center justify-center text-xs font-black shrink-0 transition-all shadow-sm ${isMultiSelect ? 'rounded-lg' : 'rounded-full'} ${iconClass}`}>
                                   {isMultiSelect ? (
                                      <span className="material-symbols-outlined text-base">
                                        {isSelected ? 'check_box' : 'check_box_outline_blank'}
                                      </span>
                                   ) : String.fromCharCode(65 + i)}
                                 </div>
                                 <span className="flex-1">{option.text}</span>
                                 {isChecked && isCorrect && (
                                   <span className="material-symbols-outlined text-emerald-600 ml-auto">check_circle</span>
                                 )}
                                 {isChecked && isSelected && !isCorrect && (
                                   <span className="material-symbols-outlined text-rose-600 ml-auto">cancel</span>
                                 )}
                               </div>
                             </button>
                           );
                         })}
                       </div>
                     )}

                     {qType === "TRUE_FALSE" && (
                        <div className="grid grid-cols-2 gap-4">
                          {[
                             { label: t("correct"), value: true },
                             { label: t("incorrect"), value: false }
                          ].map((opt) => {
                            const isSelected = userAnswer === opt.value;
                            const isCorrect = questionData.isTrue === opt.value;
                            
                            let borderClass = 'border-outline-variant/30';
                            let bgClass = 'bg-white dark:bg-slate-900';
                            let textClass = 'text-on-surface-variant';

                            if (isSelected) {
                              borderClass = 'border-amber-500';
                              bgClass = 'bg-amber-50 dark:bg-amber-900/20';
                              textClass = 'text-amber-700 dark:text-amber-400';
                            }

                            if (isChecked) {
                              if (isCorrect) {
                                borderClass = 'border-emerald-500 bg-emerald-500';
                                textClass = 'text-white';
                              } else if (isSelected && !isCorrect) {
                                borderClass = 'border-rose-500 bg-rose-500';
                                textClass = 'text-white';
                              }
                            }

                            return (
                              <button 
                                key={opt.label}
                                disabled={isChecked}
                                onClick={() => handleAnswerChange(q, opt.value)}
                                className={`p-6 rounded-2xl border-2 flex items-center justify-center gap-3 font-black transition-all ${borderClass} ${bgClass} ${textClass} ${isChecked ? 'cursor-default' : 'hover:border-primary/50'}`}
                              >
                                <span className="material-symbols-outlined">
                                  {isChecked && isCorrect ? 'check_circle' : (isChecked && isSelected && !isCorrect ? 'cancel' : (opt.value ? 'check_circle' : 'cancel'))}
                                </span>
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {qType === "MATCHING" && (
                        <MatchingQuestionBlock 
                          q={q}
                          questionData={questionData}
                          userAnswer={userAnswer}
                          isChecked={isChecked}
                          handleAnswerChange={handleAnswerChange}
                          matchingColors={matchingColors}
                        />
                      )}
                  </div>
                </div>
              )
            })}
            {/* Bottom Actions */}
            <div className="pt-20 pb-40 flex flex-col items-center gap-8">
                <div className="flex items-center gap-6">
                  {isAllChecked ? (
                    <button
                      onClick={handleReset}
                      className="flex items-center gap-3 px-10 py-4 bg-orange-500 text-white rounded-[2rem] font-black text-lg tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-orange-500/20 uppercase italic"
                    >
                      {t("resetAll")}
                      <span className="material-symbols-outlined text-xl">restart_alt</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleCheckAll}
                      className="flex items-center gap-3 px-10 py-4 bg-secondary text-white rounded-[2rem] font-black text-lg tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-secondary/20 uppercase italic"
                    >
                      {t("checkAll")}
                      <span className="material-symbols-outlined text-xl">verified</span>
                    </button>
                  )}
                  
                  <div className="relative">
                    <button 
                        disabled
                        className="flex items-center gap-3 px-10 py-4 bg-primary/20 text-primary/40 cursor-not-allowed rounded-[2rem] font-black text-lg tracking-widest transition-all uppercase italic border-2 border-primary/10"
                    >
                        {t("submit")}
                        <Send className="w-5 h-5" />
                    </button>
                    <div className="absolute -top-3 -right-3 bg-amber-500 text-white text-[10px] font-black uppercase tracking-tighter px-3 py-1 rounded-full shadow-lg border-2 border-white transform rotate-12">
                      {t("comingSoon")}
                    </div>
                  </div>
                </div>
            </div>
          </div>

          {/* Footer removed/collapsed into main scroll area or bottom bar */}
        </div>

        {/* Right Column: Material / Reading Content & Reviews (30%) */}
        <div className="w-[30%] shrink-0 flex flex-col bg-white dark:bg-slate-900 border-l border-outline-variant/30">
           <div className="h-12 border-b border-outline-variant/20 flex items-center justify-between px-6 bg-slate-50/50 dark:bg-slate-800/20 shrink-0">
              <div className="flex items-center gap-2 text-[11px] font-black text-primary uppercase tracking-[0.2em]">
                 <BookOpen className="w-4 h-4" />
                 {t("resources")}
              </div>
              <div className="flex items-center gap-4">
                 {!isGuest && (
                   <>
                     <BookmarkButton 
                       id={assignment.id} 
                       type="ASSIGNMENT" 
                       initialIsBookmarked={assignment.favoriteAssignments?.length > 0} 
                     />
                     <button 
                       onClick={() => setIsReviewModalOpen(true)}
                       className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-outline-variant/20 hover:scale-105 active:scale-95 transition-all"
                     >
                       <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">{t("sendReview")}</span>
                     </button>
                   </>
                 )}
              </div>
           </div>
           <div className="flex-1 overflow-y-auto no-scrollbar p-10 custom-scrollbar pb-20 space-y-12">
              {/* Instructions Section */}
              {hasMaterialSection && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest">
                    <span className="material-symbols-outlined text-sm">menu_book</span>
                    {t("studyMaterial")}
                  </div>
                  <div className="flex-1 overflow-y-auto no-scrollbar space-y-6">
                    {/* Video Player */}
                    {videoUrl && (
                      <div className="aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-lg ring-1 ring-white/10 shrink-0 mb-6">
                        {youtubeId ? (
                          <iframe
                            className="w-full h-full"
                            src={`https://www.youtube.com/embed/${youtubeId}?rel=0`}
                            title={assignment.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        ) : (
                          <video src={videoUrl} className="w-full h-full" controls />
                        )}
                      </div>
                    )}

                    {/* Audio Player */}
                    {audioUrl && (
                      <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl flex items-center gap-4 mb-6 ring-1 ring-slate-200 dark:ring-slate-700">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined">audiotrack</span>
                        </div>
                        <audio src={audioUrl} className="flex-1 h-8" controls />
                      </div>
                    )}

                    <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-black prose-p:leading-loose prose-p:text-lg">
                      <div dangerouslySetInnerHTML={{ __html: assignment.readingText }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Tags Section */}
              {assignment.tags && (
                <div className="flex flex-wrap gap-2">
                  {assignment.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean).map((tag: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-slate-200/50 dark:border-slate-700/50">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Material Section */}
              {hasInstructionText && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-secondary font-black text-xs uppercase tracking-widest">
                    <span className="material-symbols-outlined text-sm">info</span>
                    {t("instructions")}
                  </div>
                  <div className="prose prose-slate dark:prose-invert max-w-none prose-p:leading-relaxed prose-p:text-base bg-secondary/5 p-6 rounded-2xl border border-secondary/10">
                    <div dangerouslySetInnerHTML={{ __html: assignment.instructions }} />
                  </div>
                </div>
              )}

              {/* Reviews Section below material */}
              {allReviews.some(r => r.isApproved) && (
                <div className="border-t border-outline-variant/20 pt-16 space-y-12">
                   <div className="flex items-center justify-between">
                      <div className="space-y-1">
                         <h3 className="text-2xl font-black tracking-tight italic uppercase">{t("studentFeedback")}</h3>
                         <p className="text-sm text-slate-500 font-medium">{t("feedbackSubtitle")}</p>
                      </div>
                      {allReviews.length > 0 && (
                         <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-2xl border border-amber-100">
                            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                            <span className="font-black text-amber-700">
                               {(allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length).toFixed(1)}
                            </span>
                         </div>
                      )}
                   </div>
                    <ReviewList reviews={allReviews} />
                </div>
              )}

              {/* Related Assignments Section at the bottom of right column */}
              <RelatedAssignmentsSection 
                items={relatedAssignments.map(a => ({ ...a, type: "ASSIGNMENT" as const }))} 
                isGuest={isGuest}
                onNavigate={handleSafeNavigate}
              />
           </div>
        </div>
      </div>

      {/* Review Modal */}
      {isReviewModalOpen && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-md bg-slate-900/40 animate-in fade-in duration-300"
          onClick={() => setIsReviewModalOpen(false)}
        >
            <div 
             className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-lg p-8 md:p-12 relative animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 max-h-[90vh] flex flex-col"
             onClick={(e) => e.stopPropagation()}
           >
              <button 
                onClick={() => setIsReviewModalOpen(false)}
                className="absolute top-8 right-8 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors z-10"
              >
                 <X className="w-6 h-6" />
              </button>

              <div className="space-y-8">
                 <div className="space-y-2">
                    <h4 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase">{t("yourReview")}</h4>
                    <p className="text-slate-500 font-medium text-sm">{t("reviewSubtitle")}</p>
                 </div>

                 <div className="overflow-y-auto pr-2 space-y-8">
                   {userReview ? (
                     <div className="py-12 text-center space-y-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] border border-green-100">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-100">
                           <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <div className="space-y-2 px-6">
                           <h5 className="text-xl font-black text-slate-900 dark:text-white">{t("thankYou")}</h5>
                           <p className="text-sm text-slate-500 font-medium italic">
                              {userReview.isApproved ? t("reviewApproved") : t("reviewPending")}
                           </p>
                        </div>
                     </div>
                   ) : (
                     <div className="space-y-8">
                        {/* Simple Star Rating */}
                        <div className="flex justify-center items-center gap-3">
                           {[1, 2, 3, 4, 5].map((star) => (
                             <button
                               key={star}
                               onMouseEnter={() => setHoverRating(star)}
                               onMouseLeave={() => setHoverRating(0)}
                               onClick={() => setReviewRating(star)}
                               className="transition-all transform hover:scale-110 active:scale-90"
                             >
                                <Star 
                                  className={`w-10 h-10 ${
                                    star <= (hoverRating || reviewRating) 
                                    ? 'text-amber-400 fill-amber-400' 
                                    : 'text-slate-200'
                                  } transition-colors`} 
                                />
                             </button>
                           ))}
                        </div>

                        {/* Comment Area */}
                        <div className="space-y-4">
                           <div className="relative">
                              <MessageCircle className="absolute top-5 left-5 w-5 h-5 text-slate-300" />
                              <textarea 
                                placeholder={t("commentPlaceholder")}
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-[2rem] p-5 pl-14 min-h-[150px] text-base font-medium focus:border-primary focus:ring-0 transition-all outline-none"
                              />
                           </div>
                           <button
                             onClick={handleReviewSubmit}
                             disabled={isSubmittingReview || reviewRating === 0}
                             className="w-full h-14 bg-slate-950 dark:bg-primary text-white rounded-full font-black tracking-[0.2em] hover:bg-primary transition-all disabled:opacity-50 shadow-xl"
                           >
                              {isSubmittingReview ? t("sending") : t("sendReview")}
                           </button>
                        </div>
                     </div>
                   )}
                 </div>
              </div>
           </div>
        </div>
      )}


    {/* Navigation Guard Modal */}
    {navGuard.isOpen && (
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 backdrop-blur-sm bg-slate-900/60 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-8 relative animate-in zoom-in-95 duration-300">
          <button 
            onClick={() => setNavGuard({ ...navGuard, isOpen: false })}
            className="absolute top-6 left-6 p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="mt-8 space-y-6 text-center">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto">
               <HelpCircle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            
            <div className="space-y-3">
              <h4 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                {t("navGuardTitle")}
              </h4>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed">
                {t("navGuardMessage", { 
                    unfinished: allCompleted ? "" : t("unfinished"),
                    title: navGuard.targetTitle 
                  })}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setNavGuard({ ...navGuard, isOpen: false });
                  router.push(navGuard.targetUrl);
                }}
                className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm tracking-widest hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 uppercase italic"
              >
                {t("confirm")}
              </button>
              <button
                onClick={() => setNavGuard({ ...navGuard, isOpen: false })}
                className="w-full py-3 text-slate-500 dark:text-slate-400 font-bold text-xs hover:text-slate-800 dark:hover:text-white transition-colors uppercase tracking-widest"
              >
                {t("continue")}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
    );
}
