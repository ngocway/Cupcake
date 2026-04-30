"use client";

import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight, 
  Star,
  BookOpen,
  CheckCircle,
  Play,
  BookOpenCheck as AssignmentIcon,
  Info,
  X
} from 'lucide-react';
import { toast } from "sonner";

interface Props {
  assignment: any;
  isGuest?: boolean;
}

export default function InteractiveLessonSidebar({ assignment, isGuest = false }: Props) {
  const [isDoingQuiz, setIsDoingQuiz] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [checkedQuestions, setCheckedQuestions] = useState<Record<string, boolean>>({});
  const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);

  const hasInstructions = useMemo(() => {
    if (!assignment?.instructions) return false;
    const cleanText = assignment.instructions.replace(/<[^>]*>/g, '').trim();
    if (cleanText.length > 0) return true;
    return /<(img|video|audio|iframe|embed)\b/i.test(assignment.instructions);
  }, [assignment?.instructions]);

  const questions = assignment?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];

  const shuffledRightItems = useMemo(() => {
    if (!currentQuestion) return [];
    try {
      const questionData = JSON.parse(currentQuestion.content);
      const qType = questionData.type || currentQuestion.type;
      if (qType === "MATCHING" && questionData.pairs) {
        const seed = currentQuestion.id;
        return [...questionData.pairs]
          .map(p => p.rightText)
          .sort(() => (seed.length % 2 === 0 ? 1 : -1) * 0.5 - Math.random());
      }
    } catch (e) {}
    return [];
  }, [currentQuestionIndex, currentQuestion]);

  if (!assignment) {
    return (
      <div className="p-10 text-center space-y-4 bg-white dark:bg-slate-900 rounded-[3rem] border border-outline-variant/20 shadow-sm">
         <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
            <AssignmentIcon className="w-8 h-8 text-slate-200" />
         </div>
         <p className="text-slate-400 font-bold text-sm italic uppercase tracking-widest leading-loose">Bài học này chưa có bài tập rèn luyện.</p>
      </div>
    );
  }

  const matchingColors = [
    "border-blue-500 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400",
    "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400",
    "border-amber-500 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400",
    "border-rose-500 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400",
    "border-purple-500 bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400",
    "border-pink-500 bg-pink-50 dark:bg-pink-950/20 text-pink-700 dark:text-pink-400",
  ];

  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
  const isChecked = currentQuestion ? !!checkedQuestions[currentQuestion.id] : false;

  const handleAnswerChange = (questionId: string, value: any) => {
    if (isChecked) return;

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
          Object.keys(newMatching).forEach(key => {
            if (newMatching[key] === value.rightText) delete newMatching[key];
          });
          newMatching[value.leftId] = value.rightText;
        }
        return { ...prev, [questionId]: newMatching };
      }

      return { ...prev, [questionId]: value };
    });
  };

  const handleCheck = () => {
    if (!currentQuestion) return;
    const currentAnswer = answers[currentQuestion.id];
    const isEmpty = currentAnswer === undefined || 
                    (Array.isArray(currentAnswer) && currentAnswer.length === 0) ||
                    (typeof currentAnswer === 'object' && currentAnswer !== null && Object.keys(currentAnswer).length === 0);

    if (isEmpty) {
      toast.error("Vui lòng hoàn thành câu hỏi trước khi kiểm tra!");
      return;
    }
    setCheckedQuestions(prev => ({ ...prev, [currentQuestion.id]: true }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedLeftId(null);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedLeftId(null);
    }
  };

  if (!isDoingQuiz) {
    return (
      <>
      <div className="space-y-10">
        <div className="bg-slate-900 dark:bg-primary text-white rounded-[3rem] p-10 shadow-2xl space-y-10 relative overflow-hidden group">
           <div className="relative z-10 space-y-6">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-[1.5rem] flex items-center justify-center border border-white/20">
                 <AssignmentIcon className="w-8 h-8 text-white" />
              </div>
              <div className="space-y-2">
                 <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.3em]">Nhiệm vụ đi kèm</p>
                 <h3 className="text-3xl font-black leading-tight tracking-tight italic uppercase">{assignment.title}</h3>
              </div>
              <ul className="space-y-4">
                  <li className="flex items-center gap-3 text-sm font-bold">
                     <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                        <CheckCircle className="w-3.5 h-3.5 text-white" />
                     </div>
                     <span className="flex items-center gap-2">
                       {questions.length} câu hỏi luyện tập
                       {hasInstructions && (
                         <button 
                           onClick={() => setIsInstructionsOpen(true)}
                           className="p-1 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all active:scale-95 flex items-center justify-center shadow-sm shadow-white/5 animate-pulse"
                           title="Hướng dẫn làm bài"
                         >
                           <Info className="w-3.5 h-3.5" />
                         </button>
                       )}
                     </span>
                  </li>
                 <li className="flex items-center gap-3 text-sm font-bold">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                       <CheckCircle className="w-3.5 h-3.5 text-white" />
                    </div>
                    Chấm điểm & Phản hồi ngay
                 </li>
              </ul>
              
              <button 
                 onClick={() => setIsDoingQuiz(true)}
                 className="flex items-center justify-center gap-3 w-full py-5 bg-white text-slate-900 rounded-[2rem] font-black text-xs tracking-[0.2em] uppercase hover:bg-slate-100 transition-all group-hover:scale-105 active:scale-95"
              >
                 BẮT ĐẦU LÀM BÀI
                 <ArrowRight className="w-5 h-5" />
              </button>
           </div>

           <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24 blur-3xl" />
           <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16 blur-2xl" />
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/20 rounded-[2.5rem] p-8 border border-amber-100 dark:border-amber-900/30 space-y-4">
           <h5 className="font-black text-sm uppercase tracking-widest text-amber-900 dark:text-amber-400 flex items-center gap-2">
              <Star className="w-4 h-4 fill-current" />
              Lời khuyên học tập
           </h5>
           <p className="text-xs font-medium text-amber-800 dark:text-amber-300/80 leading-loose">
              Hãy xem hết video bài giảng và ghi chép lại các cấu trúc quan trọng trước khi bắt đầu làm bài tập để đạt kết quả tốt nhất nhé!
           </p>
        </div>
      </div>

      {isInstructionsOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[100] flex items-center justify-center animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-2xl border border-slate-100 dark:border-slate-800 w-[450px] max-h-[80vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-300 relative flex flex-col">
            <button 
              onClick={() => setIsInstructionsOpen(false)} 
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-6">
              <div className="flex items-center gap-3 text-primary">
                <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Info className="w-5 h-5" />
                </div>
                <h4 className="text-xl font-black italic uppercase tracking-tight">Hướng dẫn làm bài</h4>
              </div>

              <div 
                className="text-slate-700 dark:text-slate-300 text-sm font-medium leading-loose bg-slate-50 dark:bg-slate-800/30 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800/50 prose prose-slate dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: assignment.instructions }}
              />
            </div>
          </div>
        </div>
      )}
      </>
    );
  }

  // Quiz UI
  let questionData: any;
  try {
    questionData = currentQuestion ? JSON.parse(currentQuestion.content) : {};
  } catch (e) {
    questionData = { questionText: currentQuestion?.content };
  }

  const qType = questionData.type || currentQuestion?.type;
  const isMultiSelect = qType === "MULTIPLE_SELECT";
  const questionText = questionData.instruction || questionData.questionText || questionData.statement || currentQuestion?.content;
  const userAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;

  return (
    <>
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-outline-variant/20 shadow-xl overflow-hidden flex flex-col h-[600px]">
      {/* Quiz Header */}
      <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-outline-variant/20 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 text-xs font-black text-primary uppercase tracking-widest">
          <div className="flex items-center gap-2">
            Luyện tập
          </div>
          {hasInstructions && (
            <button 
              onClick={() => setIsInstructionsOpen(true)}
              className="p-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-full transition-all active:scale-95 flex items-center justify-center shadow-sm shadow-primary/5 animate-pulse"
              title="Xem hướng dẫn làm bài"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <span className="text-xs font-black text-slate-400">
          {currentQuestionIndex + 1} / {questions.length}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-slate-100 dark:bg-slate-800">
        <div 
          className="h-full bg-primary transition-all duration-300" 
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        <div className="space-y-2">
          <span className="text-[10px] font-black text-secondary uppercase tracking-widest">
            {qType === "MULTIPLE_SELECT" ? 'Chọn nhiều đáp án' : 
             qType === "MATCHING" ? 'Nối cặp đáp án' : 
             'Chọn một đáp án'}
          </span>
          <h4 className="text-lg font-black text-on-surface leading-tight">
            {questionText === "{}" ? "Nối các cặp từ phù hợp:" : questionText}
          </h4>
        </div>

        {/* Options Grid */}
        {(qType === "MULTIPLE_CHOICE" || qType === "MULTIPLE_SELECT") && (
          <div className="space-y-2.5">
            {(questionData.options || []).map((option: any, i: number) => {
              const isSelected = isMultiSelect 
                ? (Array.isArray(userAnswer) && userAnswer.includes(i))
                : userAnswer === i;
              const isCorrect = option.isCorrect;
              
              let borderClass = 'border-slate-200 dark:border-slate-700';
              let bgClass = 'bg-white dark:bg-slate-800';
              let textClass = 'text-slate-700 dark:text-slate-300';
              let iconClass = 'bg-slate-100 text-slate-600';

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
                  textClass = 'text-emerald-700 dark:text-emerald-400';
                  iconClass = 'bg-emerald-500 text-white';
                } else if (isSelected && !isCorrect) {
                  borderClass = 'border-rose-500';
                  bgClass = 'bg-rose-500/10';
                  textClass = 'text-rose-700 dark:text-rose-400';
                  iconClass = 'bg-rose-500 text-white';
                }
              }

              return (
                <button 
                  key={i}
                  disabled={isChecked}
                  onClick={() => handleAnswerChange(currentQuestion.id, i)}
                  className={`w-full p-4 rounded-2xl border-2 text-left font-bold transition-all relative flex items-center gap-3 ${borderClass} ${bgClass} ${textClass} ${isChecked ? 'cursor-default' : 'hover:border-primary/50'}`}
                >
                  <div className={`w-6 h-6 flex items-center justify-center text-xs font-black shrink-0 transition-all shadow-sm ${isMultiSelect ? 'rounded-lg' : 'rounded-full'} ${iconClass}`}>
                    {isMultiSelect ? (
                       <span className="text-xs">{isSelected ? '✓' : ''}</span>
                    ) : String.fromCharCode(65 + i)}
                  </div>
                  <span className="text-sm">{option.text}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* True False */}
        {qType === "TRUE_FALSE" && (
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Đúng", value: true },
              { label: "Sai", value: false }
            ].map((opt) => {
              const isSelected = userAnswer === opt.value;
              const isCorrect = questionData.isTrue === opt.value;
              
              let borderClass = 'border-slate-200 dark:border-slate-700';
              let bgClass = 'bg-white dark:bg-slate-800';
              let textClass = 'text-slate-700 dark:text-slate-300';

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
                  className={`p-4 rounded-2xl border-2 flex items-center justify-center gap-2 font-black text-sm transition-all ${borderClass} ${textClass} ${isChecked ? 'cursor-default' : 'hover:border-primary/50'}`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Matching (Click to connect version) */}
        {qType === "MATCHING" && (
          <div className="space-y-4">
            <p className="text-[10px] text-slate-400 italic">
              {isChecked ? "Kết quả đối chiếu:" : "Mẹo: Click 1 ô bên trái rồi click 1 ô bên phải để nối!"}
            </p>
            <div className="grid grid-cols-2 gap-4 relative">
              {/* Left items */}
              <div className="space-y-2">
                <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Vế hỏi</span>
                {(questionData.pairs || []).map((pair: any, idx: number) => {
                  const pairedRightText = userAnswer?.[pair.id];
                  const isCorrect = isChecked && pairedRightText === pair.rightText;
                  
                  // Find color index
                  const colorIdx = Object.keys(userAnswer || {}).indexOf(pair.id);
                  const colorClass = pairedRightText && colorIdx !== -1 ? matchingColors[colorIdx % matchingColors.length] : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300";

                  let finalBorder = colorClass;
                  if (isChecked) {
                    finalBorder = isCorrect ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-rose-500 bg-rose-50 text-rose-700";
                  }

                  return (
                    <button
                      key={pair.id}
                      disabled={isChecked}
                      onClick={() => setSelectedLeftId(pair.id === selectedLeftId ? null : pair.id)}
                      className={`w-full p-3 rounded-xl border-2 text-left font-bold text-xs transition-all relative ${
                        selectedLeftId === pair.id ? 'border-primary ring-2 ring-primary/20' : ''
                      } ${finalBorder}`}
                    >
                      {pair.leftText}
                    </button>
                  );
                })}
              </div>

              {/* Right items */}
              <div className="space-y-2">
                <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Trả lời</span>
                {shuffledRightItems.map((rightText: string, idx: number) => {
                  const pairedLeftId = Object.keys(userAnswer || {}).find(k => userAnswer[k] === rightText);
                  const pair = pairedLeftId ? questionData.pairs.find((p:any) => p.id === pairedLeftId) : null;
                  const isCorrect = isChecked && pair && pair.rightText === rightText;
                  
                  const colorIdx = pairedLeftId ? Object.keys(userAnswer || {}).indexOf(pairedLeftId) : -1;
                  const colorClass = pairedLeftId && colorIdx !== -1 ? matchingColors[colorIdx % matchingColors.length] : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300";

                  let finalBorder = colorClass;
                  if (isChecked) {
                    finalBorder = isCorrect ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-rose-500 bg-rose-50 text-rose-700";
                  }

                  return (
                    <button
                      key={idx}
                      disabled={isChecked}
                      onClick={() => {
                        if (selectedLeftId) {
                          handleAnswerChange(currentQuestion.id, { leftId: selectedLeftId, rightText });
                          setSelectedLeftId(null);
                        }
                      }}
                      className={`w-full p-3 rounded-xl border-2 text-left font-bold text-xs transition-all ${finalBorder}`}
                    >
                      {rightText}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Explanation */}
        {isChecked && currentQuestion.explanation && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-l-4 border-primary text-xs italic text-slate-600 dark:text-slate-300">
            <span className="font-black text-primary block mb-1 not-italic">GIẢI THÍCH:</span>
            {currentQuestion.explanation}
          </div>
        )}
      </div>

      {/* Quiz Footer / Nav */}
      <div className="p-6 border-t border-outline-variant/20 bg-slate-50 dark:bg-slate-800/50 shrink-0 flex items-center justify-between">
        <button 
          onClick={handlePrev}
          disabled={currentQuestionIndex === 0}
          className="p-2.5 rounded-xl font-bold text-xs text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-all"
        >
          Quay lại
        </button>

        {isChecked ? (
          currentQuestionIndex === questions.length - 1 ? (
            <button 
              onClick={() => {
                toast.success("Bạn đã hoàn thành bài tập!");
                setIsDoingQuiz(false);
                setCurrentQuestionIndex(0);
                setAnswers({});
                setCheckedQuestions({});
              }}
              className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition-all animate-in zoom-in-95"
            >
              Hoàn thành
            </button>
          ) : (
            <button 
              onClick={handleNext}
              className="flex items-center gap-1 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-all animate-in zoom-in-95"
            >
              Câu sau
              <ChevronRight className="w-4 h-4" />
            </button>
          )
        ) : (
          <button 
            onClick={handleCheck}
            className="px-6 py-2.5 bg-primary text-white rounded-xl font-black text-xs tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
          >
            KIỂM TRA
          </button>
        )}
      </div>
    </div>
    
    {isInstructionsOpen && (
      <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[100] flex items-center justify-center animate-in fade-in duration-300">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-2xl border border-slate-100 dark:border-slate-800 w-[450px] max-h-[80vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-300 relative flex flex-col">
          <button 
            onClick={() => setIsInstructionsOpen(false)} 
            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="space-y-6">
            <div className="flex items-center gap-3 text-primary">
              <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Info className="w-5 h-5" />
              </div>
              <h4 className="text-xl font-black italic uppercase tracking-tight">Hướng dẫn làm bài</h4>
            </div>

            <div 
              className="text-slate-700 dark:text-slate-300 text-sm font-medium leading-loose bg-slate-50 dark:bg-slate-800/30 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800/50 prose prose-slate dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: assignment.instructions }}
            />
          </div>
        </div>
      </div>
    )}
    </>
  );
}
