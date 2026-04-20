
"use client";

import React, { useState, useMemo } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  HelpCircle,
  AlertCircle
} from "lucide-react";

interface Question {
  id: string;
  type: string;
  content: string;
  explanation: string | null;
  orderIndex: number;
  points: number;
}

interface Props {
  questions: Question[];
  assignmentId: string;
  isLoggedIn: boolean;
  showSubmitButton?: boolean;
}

export default function PublicQuestionViewer({ 
  questions, 
  assignmentId, 
  isLoggedIn, 
  showSubmitButton = false 
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [showExplanation, setShowExplanation] = useState<Record<string, boolean>>({});

  const currentQuestion = questions[currentIndex];
  
  // Parse question content safely
  const questionData = useMemo(() => {
    try {
      return JSON.parse(currentQuestion.content);
    } catch (e) {
      return null;
    }
  }, [currentQuestion]);

  const handleSelect = (questionId: string, value: any, isCorrect: boolean) => {
    if (answers[questionId] !== undefined) return; // Prevent multiple attempts if already answered in practice mode
    
    setAnswers(prev => ({ 
      ...prev, 
      [questionId]: { value, isCorrect } 
    }));
    
    // Show explanation immediately
    setShowExplanation(prev => ({ ...prev, [questionId]: true }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (!questionData) {
    return (
       <div className="p-10 bg-slate-50 rounded-3xl text-center text-slate-400 font-bold border-2 border-dashed border-slate-200">
          Dữ liệu câu hỏi bị lỗi
       </div>
    );
  }

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
      {/* Question Header */}
      <div className="bg-slate-50 px-8 py-4 border-b border-slate-100 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-black text-sm">
               {currentIndex + 1}
            </div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Câu hỏi</span>
         </div>
         <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-slate-200">
            {currentQuestion.type.replace('_', ' ')} • {currentQuestion.points} Điểm
         </div>
      </div>

      {/* Question Content */}
      <div className="flex-1 p-8 lg:p-12 space-y-10">
         <div className="space-y-6">
            <h3 className="text-2xl font-black text-slate-900 leading-snug">
               {questionData.questionText || questionData.statement || currentQuestion.content}
            </h3>
            
            {/* Options Rendering */}
            <div className="grid grid-cols-1 gap-4">
               
               {/* MULTIPLE CHOICE */}
               {currentQuestion.type === 'MULTIPLE_CHOICE' && questionData.options && (
                 <div className="grid grid-cols-1 gap-3">
                    {questionData.options.map((opt: any) => {
                      const isSelected = answers[currentQuestion.id]?.value === opt.id;
                      const isCorrect = opt.isCorrect;
                      const hasAnswered = answers[currentQuestion.id] !== undefined;

                      let stateClasses = "bg-white border-slate-100 text-slate-600 hover:border-slate-200";
                      if (isSelected) {
                        stateClasses = isCorrect 
                          ? "bg-green-50 border-green-500 text-green-700" 
                          : "bg-red-50 border-red-500 text-red-700";
                      } else if (hasAnswered && isCorrect) {
                        // Highlight correct answer if user got it wrong
                        stateClasses = "bg-green-50/30 border-green-200 text-green-600";
                      }

                      return (
                        <button
                          key={opt.id}
                          disabled={hasAnswered}
                          onClick={() => handleSelect(currentQuestion.id, opt.id, opt.isCorrect)}
                          className={`p-5 rounded-2xl border-2 text-left transition-all group relative ${stateClasses}`}
                        >
                          <div className="flex items-center justify-between">
                             <span className="font-bold">{opt.text}</span>
                             {isSelected && (
                               isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />
                             )}
                          </div>
                        </button>
                      );
                    })}
                 </div>
               )}

               {/* TRUE / FALSE */}
               {currentQuestion.type === 'TRUE_FALSE' && (
                 <div className="grid grid-cols-2 gap-4">
                    {[
                      { id: 'true', text: 'Đúng', val: true },
                      { id: 'false', text: 'Sai', val: false }
                    ].map((opt) => {
                      const isSelected = answers[currentQuestion.id]?.value === opt.id;
                      const isCorrect = opt.val === questionData.isTrue;
                      const hasAnswered = answers[currentQuestion.id] !== undefined;

                      let stateClasses = "bg-white border-slate-100 text-slate-600 hover:border-slate-200";
                      if (isSelected) {
                        stateClasses = isCorrect 
                          ? "bg-green-50 border-green-500 text-green-700" 
                          : "bg-red-50 border-red-500 text-red-700";
                      } else if (hasAnswered && opt.val === questionData.isTrue) {
                         stateClasses = "bg-green-50/30 border-green-200 text-green-600";
                      }

                      return (
                        <button
                          key={opt.id}
                          disabled={hasAnswered}
                          onClick={() => handleSelect(currentQuestion.id, opt.id, isCorrect)}
                          className={`p-6 rounded-3xl border-2 font-black tracking-widest transition-all ${stateClasses}`}
                        >
                           {opt.text.toUpperCase()}
                        </button>
                      );
                    })}
                 </div>
               )}

               {/* OTHER TYPES (Matching, etc.) */}
               {currentQuestion.type !== 'MULTIPLE_CHOICE' && currentQuestion.type !== 'TRUE_FALSE' && (
                 <div className="p-8 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-center">
                    <p className="text-slate-400 font-bold italic">
                       Loại câu hỏi {currentQuestion.type} đang được cập nhật...
                    </p>
                 </div>
               )}
            </div>
         </div>

         {/* Explanation Box */}
         {showExplanation[currentQuestion.id] && (
           <div className="animate-in fade-in slide-in-from-top-2 duration-500 bg-blue-50/50 rounded-3xl p-8 border border-blue-100 space-y-3">
              <div className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest">
                 <HelpCircle className="w-4 h-4" />
                 Giải thích đáp án
              </div>
              <p className="text-slate-600 leading-relaxed font-medium">
                 {currentQuestion.explanation || "Không có giải thích chi tiết cho câu hỏi này."}
              </p>
           </div>
         )}
      </div>

      {/* Navigation Footer */}
      <div className="bg-slate-50/50 p-6 border-t border-slate-100 flex items-center justify-between">
         <button
           onClick={handlePrev}
           disabled={currentIndex === 0}
           className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm text-slate-500 hover:bg-white disabled:opacity-30 transition-all"
         >
            <ChevronLeft className="w-5 h-5" />
            Câu trước
         </button>

         <div className="flex items-center gap-1.5">
            {questions.map((_, i) => (
               <div 
                 key={i}
                 className={`h-1.5 rounded-full transition-all ${
                   i === currentIndex ? 'w-8 bg-primary' : 'w-1.5 bg-slate-300'
                 }`}
               />
            ))}
         </div>

         {currentIndex === questions.length - 1 ? (
            showSubmitButton && (
              <button
                 onClick={() => alert('Chức năng nộp bài đang được hoàn thiện!')}
                 className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-900/10"
              >
                 HOÀN THÀNH
              </button>
            )
         ) : (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-2xl font-black text-sm tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
            >
               CÂU TIẾP THEO
               <ChevronRight className="w-5 h-5" />
            </button>
         )}
      </div>
    </div>
  );
}
