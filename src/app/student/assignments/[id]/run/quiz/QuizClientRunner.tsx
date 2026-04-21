"use client";

import React, { useState, useTransition, useEffect } from "react";
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
  ChevronDown
} from "lucide-react";

interface Props {
  assignment: any;
  submissionId: string;
  questions: any[];
  initialAnswers: any;
}

export default function QuizClientRunner({ assignment, submissionId, questions, initialAnswers }: Props) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState(initialAnswers);
  const [checkedQuestions, setCheckedQuestions] = useState<Record<string, boolean>>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const isChecked = checkedQuestions[currentQuestion?.id] || false;

  const handleAnswerChange = (questionId: string, value: any) => {
    if (isChecked) return; // Don't allow changes after checking
    
    setAnswers((prev: any) => {
      const currentAnswer = prev[questionId];
      
      if (currentQuestion.type === "MULTIPLE_SELECT") {
        const answersArray = Array.isArray(currentAnswer) ? currentAnswer : [];
        if (answersArray.includes(value)) {
          return { ...prev, [questionId]: answersArray.filter(v => v !== value) };
        } else {
          return { ...prev, [questionId]: [...answersArray, value] };
        }
      }

      return {
        ...prev,
        [questionId]: value
      };
    });
  };

  const handleCheck = () => {
    const currentAnswer = answers[currentQuestion.id];
    if (!currentAnswer || (Array.isArray(currentAnswer) && currentAnswer.length === 0)) {
      alert("Vui lòng chọn ít nhất một đáp án trước khi kiểm tra!");
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
               <h1 className="font-black text-on-surface truncate max-w-xs">{assignment.title}</h1>
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
        {/* Left Side: Material / Reading Content */}
        {assignment.readingText && (
          <div className="flex-1 border-r border-outline-variant/30 flex flex-col bg-white dark:bg-slate-900">
             <div className="h-12 border-b border-outline-variant/20 flex items-center justify-between px-6 bg-slate-50/50 dark:bg-slate-800/20">
                <div className="flex items-center gap-2 text-[11px] font-black text-primary uppercase tracking-[0.2em]">
                   <BookOpen className="w-4 h-4" />
                   Nội dung bài học
                </div>
             </div>
             <div className="flex-1 overflow-y-auto p-10 prose prose-slate dark:prose-invert max-w-none prose-headings:font-black prose-p:leading-loose prose-p:text-lg">
                <div dangerouslySetInnerHTML={{ __html: assignment.readingText }} />
             </div>
          </div>
        )}

        {/* Right Side: Quiz Questions */}
        <div className={`${assignment.readingText ? 'w-[500px] lg:w-[600px]' : 'flex-1'} flex flex-col bg-surface-container-low/20`}>
          <div className="h-12 border-b border-outline-variant/20 flex items-center justify-between px-6 bg-slate-50/50 dark:bg-slate-800/20">
             <div className="flex items-center gap-2 text-[11px] font-black text-secondary uppercase tracking-[0.2em]">
                <HelpCircle className="w-4 h-4" />
                Câu hỏi rèn luyện
             </div>
             <div className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">
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
              const questionText = questionData.questionText || questionData.statement || currentQuestion.content;
              const userAnswer = answers[currentQuestion.id];

              return (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
                  <div className="space-y-4">
                     <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary/10 rounded-lg text-secondary text-[10px] font-black uppercase tracking-widest">
                        Câu hỏi {currentQuestionIndex + 1} • {isMultiSelect ? 'Chọn nhiều đáp án' : 'Chọn một đáp án'}
                     </div>
                     <h3 className="text-xl font-black text-on-surface leading-snug">
                       {questionText}
                     </h3>
                  </div>

                  <div className="space-y-4">
                     <p className="text-sm italic text-on-surface-variant">
                       {isMultiSelect ? 'Bạn có thể chọn nhiều đáp án:' : 'Chọn đáp án của bạn bên dưới:'}
                     </p>
                     
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

                     {currentQuestion.type === "TRUE_FALSE" && (
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
      </div>
    </div>
  );
}
