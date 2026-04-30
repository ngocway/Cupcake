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
  CheckCircle2
} from "lucide-react";
import { BookmarkButton } from "@/components/common/BookmarkButton";
import { submitAssignmentReview } from "@/actions/reviews";
import { toast } from "sonner";
import { ReviewList } from "@/components/reviews/ReviewList";
import { LearningSidebar } from "@/app/student/_components/LearningSidebar";

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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState(initialAnswers);
  const [checkedQuestions, setCheckedQuestions] = useState<Record<string, boolean>>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPending, startTransition] = useTransition();

  const hasInstructions = useMemo(() => {
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
      toast.error("Vui lòng chọn số sao đánh giá.");
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
      toast.error("Lỗi khi gửi đánh giá.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<{ 
    fromId: string; 
    fromSide: 'left' | 'right'; 
    x1: number; 
    y1: number; 
    x2: number; 
    y2: number;
    originalLeftId?: string;
  } | null>(null);
  const [hoveredLine, setHoveredLine] = useState<{ x: number, y: number, content: string } | null>(null);
  const router = useRouter();

  const currentQuestion = questions[currentQuestionIndex];
  
  const shuffledRightItems = useMemo(() => {
    if (!currentQuestion) return [];
    try {
      const questionData = JSON.parse(currentQuestion.content);
      const qType = questionData.type || currentQuestion.type;
      if (qType === "MATCHING" && questionData.pairs) {
        // Deterministic shuffle based on question ID to keep it consistent during session
        const seed = currentQuestion.id;
        return [...questionData.pairs]
          .map(p => p.rightText)
          .sort(() => (seed.length % 2 === 0 ? 1 : -1) * 0.5 - Math.random());
      }
    } catch (e) {}
    return [];
  }, [currentQuestionIndex, currentQuestion]);

  useEffect(() => {
    setSelectedLeftId(null);
    setDragging(null);
  }, [currentQuestionIndex]);

  const matchingColors = [
    "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316"
  ];

  const getDotCoords = (id: string, side: 'left' | 'right') => {
    const el = document.getElementById(`dot-${side}-${id}`);
    if (!el || !containerRef.current) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    return {
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.top - containerRect.top + rect.height / 2
    };
  };

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const isChecked = checkedQuestions[currentQuestion?.id] || false;

  const handleAnswerChange = (questionId: string, value: any) => {
    if (isChecked) return; // Don't allow changes after checking
    
    // Determine the type correctly from JSON or DB field
    let questionData: any;
    try {
      questionData = JSON.parse(currentQuestion.content);
    } catch (e) {
      questionData = {};
    }
    const qType = questionData.type || currentQuestion.type;

    setAnswers((prev: any) => {
      const currentAnswer = prev[questionId];
      
      if (qType === "MULTIPLE_SELECT") {
        const answersArray = Array.isArray(currentAnswer) ? currentAnswer : [];
        if (answersArray.includes(value)) {
          return { ...prev, [questionId]: answersArray.filter(v => v !== value) };
        } else {
          return { ...prev, [questionId]: [...answersArray, value] };
        }
      }

      if (qType === "MATCHING") {
        const currentMatching = (currentAnswer && typeof currentAnswer === 'object') ? currentAnswer : {};
        const newMatching = { ...currentMatching };
        if (value.rightText === null) {
          delete newMatching[value.leftId];
        } else {
          // Remove this rightText from any other leftId (one-to-one)
          Object.keys(newMatching).forEach(key => {
            if (newMatching[key] === value.rightText) delete newMatching[key];
          });
          newMatching[value.leftId] = value.rightText;
        }
        return { ...prev, [questionId]: newMatching };
      }

      return {
        ...prev,
        [questionId]: value
      };
    });
  };

  const handleCheck = () => {
    const currentAnswer = answers[currentQuestion.id];
    const isEmpty = currentAnswer === undefined || 
                    (Array.isArray(currentAnswer) && currentAnswer.length === 0) ||
                    (typeof currentAnswer === 'object' && currentAnswer !== null && Object.keys(currentAnswer).length === 0);

    if (isEmpty) {
      alert("Vui lòng hoàn thành câu hỏi trước khi kiểm tra!");
      return;
    }
    setCheckedQuestions(prev => ({ ...prev, [currentQuestion.id]: true }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = () => {
    if (isGuest) {
      if (confirm("Vui lòng đăng nhập để nộp bài và lưu kết quả. Chuyển đến trang đăng nhập?")) {
        router.push(`/student/login?callbackUrl=/student/assignments/${assignment.id}/run?direct=true`);
      }
      return;
    }
    if (!confirm("Bạn có chắc chắn muốn nộp bài không?")) return;
    
    startTransition(async () => {
      router.push(`/student/assignments/${assignment.id}/run`);
    });
  };

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-outline-variant/30 bg-white dark:bg-slate-900 flex items-center justify-between px-6 shrink-0 z-20">
         <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="p-2 hover:bg-surface-container rounded-full"
            >
               <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="hidden md:block">
               <div className="flex items-center gap-3">
                  <h1 className="font-black text-on-surface truncate max-w-xs">{assignment.title}</h1>
                  {!isGuest && (
                    <div className="flex items-center gap-1">
                      <BookmarkButton 
                        type="assignment" 
                        id={assignment.id} 
                        initialIsBookmarked={isBookmarked} 
                        className="scale-90"
                      />
                      <button 
                        onClick={() => setIsReviewModalOpen(true)}
                        className={`p-2 rounded-full transition-all active:scale-90 ${
                          userReview ? 'bg-amber-100 text-amber-600' : 'bg-surface-container text-on-surface-variant hover:bg-amber-50 hover:text-amber-600'
                        }`}
                        title="Đánh giá bài tập"
                      >
                         <Star className={`w-5 h-5 ${userReview ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  )}
               </div>
               <div className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span>45:00 Còn lại</span>
               </div>
            </div>
         </div>

         <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end gap-1">
               <span className="text-[10px] font-bold text-outline uppercase tracking-widest">Tiến độ</span>
               <div className="w-32 h-1.5 bg-surface-container rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-500 ease-out" 
                    style={{ width: `${progress}%` }}
                  />
               </div>
            </div>
            
            <button 
              onClick={handleSubmit}
              disabled={isPending}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-full font-black text-sm tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
            >
               {isPending ? "ĐANG NỘP..." : "NỘP BÀI"}
               <Send className="w-4 h-4" />
            </button>
         </div>
      </header>

      {/* Integrated Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Column: Teacher & Related */}
        <LearningSidebar 
          teacher={assignment.teacher} 
          relatedItems={relatedAssignments.map(a => ({ ...a, type: "ASSIGNMENT" as const }))} 
          isGuest={isGuest}
        />

        {/* Middle Column: Questions */}
        <div className="flex-1 flex flex-col bg-slate-50/30 dark:bg-slate-950/30 border-r border-outline-variant/30">
           {/* Question Header */}
           <div className="h-12 border-b border-outline-variant/20 flex items-center justify-between px-6 bg-slate-50/50 dark:bg-slate-800/20 shrink-0">
              <div className="flex items-center gap-2 text-[11px] font-black text-on-surface-variant uppercase tracking-[0.2em]">
                 <HelpCircle className="w-4 h-4" />
                 Câu hỏi rèn luyện
              </div>
              <div className="text-[10px] font-black text-outline uppercase tracking-widest">
                 Câu {currentQuestionIndex + 1} / {questions.length}
              </div>
           </div>

          <div className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-10">
            {/* Question Display */}
            {currentQuestion && (() => {
              let questionData: any;
              try {
                questionData = JSON.parse(currentQuestion.content);
              } catch (e) {
                questionData = { questionText: currentQuestion.content };
              }

              const qType = questionData.type || currentQuestion.type;
              const isMultiSelect = qType === "MULTIPLE_SELECT";
              const questionText = questionData.instruction ?? questionData.questionText ?? questionData.statement ?? currentQuestion.content;
              const userAnswer = answers[currentQuestion.id];

              return (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
                  <div className="space-y-4">
                     <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary/10 rounded-lg text-secondary text-[10px] font-black uppercase tracking-widest">
                        Câu hỏi {currentQuestionIndex + 1} • {
                          qType === "MULTIPLE_SELECT" ? 'Chọn nhiều đáp án' : 
                          qType === "MATCHING" ? 'Nối cặp đáp án' : 
                          'Chọn một đáp án'
                        }
                     </div>
                      <h3 className="text-xl font-black text-on-surface leading-snug">
                        {questionText === "{}" ? "" : questionText}
                      </h3>
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
                           let bgClass = 'bg-white';
                           let textClass = 'text-on-surface-variant';
                           let iconClass = 'bg-surface-container text-on-surface-variant';

                           if (isSelected) {
                             borderClass = 'border-primary';
                             bgClass = 'bg-primary/5';
                             textClass = 'text-primary';
                             iconClass = 'bg-primary text-white';
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
                               onClick={() => handleAnswerChange(currentQuestion.id, i)}
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
                                   <span className="material-symbols-outlined text-emerald-600">check_circle</span>
                                 )}
                                 {isChecked && isSelected && !isCorrect && (
                                   <span className="material-symbols-outlined text-rose-600">cancel</span>
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
                            { label: "Đúng", value: true },
                            { label: "Sai", value: false }
                          ].map((opt) => {
                            const isSelected = userAnswer === opt.value;
                            const isCorrect = questionData.isTrue === opt.value;
                            
                            let borderClass = 'border-outline-variant/30';
                            let bgClass = 'bg-white';
                            let textClass = 'text-on-surface-variant';

                            if (isSelected) {
                              borderClass = 'border-primary bg-primary/5';
                              textClass = 'text-primary';
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
                                onClick={() => handleAnswerChange(currentQuestion.id, opt.value)}
                                className={`p-6 rounded-2xl border-2 flex items-center justify-center gap-3 font-black transition-all ${borderClass} ${textClass} ${isChecked ? 'cursor-default' : 'hover:border-primary/50'}`}
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
                            {/* SVG Layer for Connections */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ minHeight: '300px' }}>
                              <defs>
                                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                  <feGaussianBlur stdDeviation="2" result="blur" />
                                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                </filter>
                              </defs>
                              
                              {/* 1. Draw Correct Connections & Student's Wrong Connections */}
                              {Object.entries(answers[currentQuestion.id] || {}).map(([leftId, rightText], idx) => {
                                const pair = questionData.pairs.find((p: any) => p.id === leftId);
                                if (!pair) return null;
                                
                                const isCorrect = isChecked && pair.rightText === rightText;
                                const coords1 = getDotCoords(leftId, 'left');
                                const rightItemIdx = shuffledRightItems.indexOf(rightText as string);
                                if (rightItemIdx === -1) return null;
                                const coords2 = getDotCoords(rightItemIdx.toString(), 'right');
                                
                                let strokeColor = matchingColors[idx % matchingColors.length];
                                if (isChecked) {
                                  strokeColor = isCorrect ? '#10B981' : '#EF4444'; // Emerald-500 or Rose-500
                                }

                                 return (
                                  <g 
                                    key={`student-${leftId}`}
                                    onMouseEnter={(e) => {
                                      if (!isChecked) return;
                                      setHoveredLine({
                                        x: e.clientX,
                                        y: e.clientY,
                                        content: isCorrect ? 'Đúng' : 'Sai'
                                      });
                                    }}
                                    onMouseMove={(e) => {
                                      if (hoveredLine) {
                                        setHoveredLine({ ...hoveredLine, x: e.clientX, y: e.clientY });
                                      }
                                    }}
                                    onMouseLeave={() => setHoveredLine(null)}
                                  >
                                    {/* Invisible wider line for easier hover */}
                                    <line 
                                      x1={coords1.x} y1={coords1.y} 
                                      x2={coords2.x} y2={coords2.y} 
                                      stroke="transparent"
                                      strokeWidth="15"
                                      className="cursor-help pointer-events-auto"
                                    />
                                    <line 
                                      x1={coords1.x} y1={coords1.y} 
                                      x2={coords2.x} y2={coords2.y} 
                                      stroke={strokeColor}
                                      strokeWidth={isCorrect ? "4" : "2"}
                                      strokeDasharray={isChecked && !isCorrect ? "6,4" : "0"}
                                      className="transition-all duration-500 pointer-events-none"
                                    />
                                    {/* If Wrong, draw the Ghost Line to the CORRECT answer */}
                                    {isChecked && !isCorrect && (() => {
                                      const correctIdx = shuffledRightItems.indexOf(pair.rightText);
                                      if (correctIdx === -1) return null;
                                      const correctCoords = getDotCoords(correctIdx.toString(), 'right');
                                      return (
                                        <line 
                                          x1={coords1.x} y1={coords1.y} 
                                          x2={correctCoords.x} y2={correctCoords.y} 
                                          stroke="#CBD5E1" // Slate-300 for ghost line
                                          strokeWidth="2"
                                          strokeDasharray="2,4"
                                          className="opacity-60 pointer-events-none"
                                        />
                                      );
                                    })()}
                                  </g>
                                );
                              })}

                              {/* 2. Handle items NOT connected but have a correct answer (Ghost lines for skipped items) */}
                              {isChecked && questionData.pairs.map((pair: any) => {
                                const studentConnected = (answers[currentQuestion.id] || {})[pair.id];
                                if (studentConnected) return null; // Already handled above

                                const coords1 = getDotCoords(pair.id, 'left');
                                const correctIdx = shuffledRightItems.indexOf(pair.rightText);
                                if (correctIdx === -1) return null;
                                const correctCoords = getDotCoords(correctIdx.toString(), 'right');

                                return (
                                  <line 
                                    key={`ghost-missing-${pair.id}`}
                                    x1={coords1.x} y1={coords1.y} 
                                    x2={correctCoords.x} y2={correctCoords.y} 
                                    stroke="#CBD5E1"
                                    strokeWidth="2"
                                    strokeDasharray="2,4"
                                    className="opacity-40"
                                  />
                                );
                              })}

                              {/* 3. Dragging Line */}
                              {dragging && (
                                <line 
                                  x1={dragging.x1} y1={dragging.y1} 
                                  x2={dragging.x2} y2={dragging.y2} 
                                  stroke="#3B82F6" 
                                  strokeWidth="3" 
                                  strokeDasharray="6,4"
                                />
                              )}
                            </svg>
{hoveredLine && (
  <div 
    className="fixed z-[100] px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold pointer-events-none shadow-xl -translate-x-1/2 -translate-y-full mb-4"
    style={{ left: hoveredLine.x, top: hoveredLine.y }}
  >
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${hoveredLine.content === 'Đúng' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
      {hoveredLine.content}
    </div>
    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
  </div>
)}

                            {/* Left Column */}
                            <div className="space-y-4 z-20">
                              <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest block mb-2 px-2">Cột vế hỏi</span>
                              {(questionData.pairs || []).map((pair: any, idx: number) => {
                                const pairedRightText = userAnswer?.[pair.id];
                                const isBeingDragged = dragging?.fromId === pair.id && dragging?.fromSide === 'left';
                                
                                return (
                                  <div 
                                    key={pair.id}
                                    className={`group relative p-5 rounded-2xl border-2 transition-all flex items-center justify-between ${
                                      pairedRightText ? 'border-secondary/40 bg-secondary/5' : 'border-outline-variant/30 bg-white'
                                    }`}
                                  >
                                    <div className="flex items-center gap-4">
                                       <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-xs font-black shrink-0">
                                         {String.fromCharCode(65 + idx)}
                                       </div>
                                       {pair.leftImageUrl || (pair.leftText?.startsWith('http') || pair.leftText?.startsWith('/')) ? (
                                         <img src={pair.leftImageUrl || pair.leftText} alt="" className="h-16 w-16 object-cover rounded-lg border border-outline-variant" />
                                       ) : (
                                         <span className="font-bold text-on-surface">{pair.leftText}</span>
                                       )}
                                    </div>
                                    
                                    {/* Dot Anchor */}
                                    <div 
                                      id={`dot-left-${pair.id}`}
                                      onMouseDown={(e) => {
                                        if (isChecked) return;
                                        const coords = getDotCoords(pair.id, 'left');
                                        setDragging({
                                          fromId: pair.id,
                                          fromSide: 'left',
                                          x1: coords.x,
                                          y1: coords.y,
                                          x2: coords.x,
                                          y2: coords.y
                                        });
                                      }}
                                      onMouseUp={() => {
                                        if (dragging && dragging.fromSide === 'right') {
                                          // Find the rightText from the dragging.fromId (which is index)
                                          const rightText = shuffledRightItems[parseInt(dragging.fromId)];
                                          handleAnswerChange(currentQuestion.id, { leftId: pair.id, rightText });
                                          setDragging(null);
                                        }
                                      }}
                                      className={`w-5 h-5 rounded-full border-4 border-white shadow-sm cursor-crosshair absolute -right-2.5 top-1/2 -translate-y-1/2 z-30 transition-transform hover:scale-150 ${
                                        pairedRightText ? 'bg-secondary' : 'bg-outline-variant hover:bg-primary'
                                      }`}
                                    />
                                  </div>
                                );
                              })}
                            </div>

                            {/* Right Column */}
                            <div className="space-y-4 z-20">
                              <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest block mb-2 px-2">Cột trả lời</span>
                              {shuffledRightItems.map((rightText: string, idx: number) => {
                                const pairedLeftId = Object.keys(userAnswer || {}).find(k => userAnswer[k] === rightText);
                                const isCorrect = isChecked && pairedLeftId && (questionData.pairs.find((p:any) => p.id === pairedLeftId)?.rightText === rightText);

                                return (
                                  <div 
                                    key={idx}
                                    className={`group relative p-5 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                                      pairedLeftId ? 'border-secondary/40 bg-secondary/5' : 'border-outline-variant/30 bg-white'
                                    }`}
                                  >
                                    {/* Dot Anchor */}
                                    <div 
                                      id={`dot-right-${idx}`}
                                      onMouseUp={() => {
                                        if (dragging && dragging.fromSide === 'left') {
                                          handleAnswerChange(currentQuestion.id, { leftId: dragging.fromId, rightText });
                                          setDragging(null);
                                        }
                                      }}
                                      onMouseDown={(e) => {
                                        if (isChecked) return;
                                        const rect = containerRef.current!.getBoundingClientRect();
                                        
                                        if (pairedLeftId) {
                                          // Re-drag logic: start from the left partner
                                          const coords = getDotCoords(pairedLeftId, 'left');
                                          setDragging({
                                            fromId: pairedLeftId,
                                            fromSide: 'left',
                                            x1: coords.x, y1: coords.y,
                                            x2: e.clientX - rect.left, y2: e.clientY - rect.top
                                          });
                                        } else {
                                          // New drag from right side
                                          const coords = getDotCoords(idx.toString(), 'right');
                                          setDragging({
                                            fromId: idx.toString(),
                                            fromSide: 'right',
                                            x1: coords.x, y1: coords.y,
                                            x2: coords.x, y2: coords.y
                                          });
                                        }
                                      }}
                                      className={`w-5 h-5 rounded-full border-4 border-white shadow-sm cursor-crosshair absolute -left-2.5 top-1/2 -translate-y-1/2 z-30 transition-transform hover:scale-150 ${
                                        pairedLeftId ? 'bg-secondary' : 'bg-outline-variant hover:bg-primary'
                                      }`}
                                    />
                                    {rightText.startsWith('http') || rightText.startsWith('/') ? (
                                      <img src={rightText} alt="" className="h-16 w-16 object-cover rounded-lg border border-outline-variant" />
                                    ) : (
                                      <span className="font-bold text-on-surface">{rightText}</span>
                                    )}
                                    {isChecked && pairedLeftId && (
                                      <span className={`material-symbols-outlined ml-auto ${isCorrect ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {isCorrect ? 'check_circle' : 'cancel'}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          
                          {!isChecked && (
                            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                               <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-primary">
                                  <span className="material-symbols-outlined text-sm">gesture</span>
                               </div>
                               <p className="text-xs text-slate-500 font-medium">
                                  Mẹo: Nhấn vào nốt tròn và kéo để nối. Bạn có thể kéo lại các đầu dây đã nối để thay đổi đáp án!
                                </p>
                            </div>
                          )}
                        </div>
                      )}

                     {isChecked && currentQuestion.explanation && (
                       <div className="mt-6 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-l-4 border-primary animate-in fade-in slide-in-from-left-2 duration-300">
                         <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest mb-2">
                           <span className="material-symbols-outlined text-sm">info</span>
                           Giải thích của AI
                         </div>
                         <p className="text-on-surface leading-relaxed text-sm italic">
                           {currentQuestion.explanation}
                         </p>
                       </div>
                     )}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Navigation Controls */}
          <div className="h-20 border-t border-outline-variant/20 bg-white dark:bg-slate-900 flex items-center justify-between px-6 shrink-0">
             <button 
                onClick={handlePrev}
                disabled={currentQuestionIndex === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-on-surface-variant hover:bg-surface-container disabled:opacity-30 disabled:pointer-events-none transition-all"
             >
                <ChevronLeft className="w-5 h-5" />
                Quay lại
             </button>

             <div className="flex items-center gap-1">
                {questions.map((_, i) => (
                   <div 
                     key={i}
                     className={`w-1.5 h-1.5 rounded-full transition-all ${
                       i === currentQuestionIndex ? 'w-6 bg-primary' : 'bg-outline-variant/50'
                     }`}
                   />
                ))}
             </div>

             {isChecked ? (
               <button 
                  onClick={handleNext}
                  disabled={currentQuestionIndex === questions.length - 1}
                  className="flex items-center gap-2 px-6 py-2.5 bg-on-surface text-white rounded-xl font-bold text-sm hover:bg-primary transition-all disabled:opacity-30 disabled:pointer-events-none animate-in zoom-in-95 duration-200"
               >
                  Câu sau
                  <ChevronRight className="w-5 h-5" />
               </button>
             ) : (
               <button 
                  onClick={handleCheck}
                  className="flex items-center gap-2 px-8 py-2.5 bg-primary text-white rounded-xl font-black text-sm tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
               >
                  KIỂM TRA
                  <span className="material-symbols-outlined text-lg">verified</span>
               </button>
             )}
          </div>
        </div>

        {/* Right Column: Material / Reading Content & Reviews */}
        <div className="w-full max-w-2xl flex flex-col bg-white dark:bg-slate-900 border-l border-outline-variant/30">
           <div className="h-12 border-b border-outline-variant/20 flex items-center justify-between px-6 bg-slate-50/50 dark:bg-slate-800/20 shrink-0">
              <div className="flex items-center gap-2 text-[11px] font-black text-primary uppercase tracking-[0.2em]">
                 <BookOpen className="w-4 h-4" />
                 Hướng dẫn & Tài liệu
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
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Đánh giá</span>
                     </button>
                   </>
                 )}
              </div>
           </div>
           <div className="flex-1 overflow-y-auto p-10 custom-scrollbar pb-20 space-y-12">
              {/* Instructions Section */}
              {hasInstructions && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-secondary font-black text-xs uppercase tracking-widest">
                    <span className="material-symbols-outlined text-sm">info</span>
                    Hướng dẫn làm bài
                  </div>
                  <div className="prose prose-slate dark:prose-invert max-w-none prose-p:leading-relaxed prose-p:text-base bg-secondary/5 p-6 rounded-2xl border border-secondary/10">
                    <div dangerouslySetInnerHTML={{ __html: assignment.instructions }} />
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
              {assignment.readingText && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest">
                    <span className="material-symbols-outlined text-sm">menu_book</span>
                    Tài liệu học tập
                  </div>
                  <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-black prose-p:leading-loose prose-p:text-lg">
                    <div dangerouslySetInnerHTML={{ __html: assignment.readingText }} />
                  </div>
                </div>
              )}

              {/* Reviews Section below material */}
              {allReviews.some(r => r.isApproved) && (
                <div className="border-t border-outline-variant/20 pt-16 space-y-12">
                   <div className="flex items-center justify-between">
                      <div className="space-y-1">
                         <h3 className="text-2xl font-black tracking-tight italic uppercase">Phản hồi từ học viên</h3>
                         <p className="text-sm text-slate-500 font-medium">Những chia sẻ từ các bạn đã hoàn thành bài tập này.</p>
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
                    <h4 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase">Đánh giá của bạn</h4>
                    <p className="text-slate-500 font-medium text-sm">Cảm nhận của bạn về nội dung và độ khó của các câu hỏi?</p>
                 </div>

                 <div className="overflow-y-auto pr-2 space-y-8">
                   {userReview ? (
                     <div className="py-12 text-center space-y-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] border border-green-100">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-100">
                           <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <div className="space-y-2 px-6">
                           <h5 className="text-xl font-black text-slate-900 dark:text-white">Cảm ơn bạn!</h5>
                           <p className="text-sm text-slate-500 font-medium italic">
                              {userReview.isApproved ? "Đánh giá của bạn đã được duyệt" : "Đánh giá của bạn đã được ghi nhận và đang chờ phê duyệt."}
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
                                placeholder="Viết nhận xét của bạn tại đây..."
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
                              {isSubmittingReview ? "ĐANG GỬI..." : "GỬI ĐÁNH GIÁ"}
                           </button>
                        </div>
                     </div>
                   )}
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
