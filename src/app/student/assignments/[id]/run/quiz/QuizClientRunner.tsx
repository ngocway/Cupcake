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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev: any) => ({
      ...prev,
      [questionId]: value
    }));
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
      // Logic for submitting (calling API) would go here
      // For now we just redirect back
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
            {currentQuestion && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
                <div className="space-y-4">
                   <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary/10 rounded-lg text-secondary text-[10px] font-black uppercase tracking-widest">
                      Câu hỏi {currentQuestionIndex + 1}
                   </div>
                   <h3 className="text-xl font-black text-on-surface leading-snug">
                     {currentQuestion.content}
                   </h3>
                </div>

                {/* Answers / Options (Simplified for demo) */}
                <div className="grid grid-cols-1 gap-4">
                   {/* This would normally be handled by a specialized component per type */}
                   <p className="text-sm italic text-on-surface-variant">Chọn đáp án của bạn bên dưới:</p>
                   <div className="grid grid-cols-1 gap-3">
                      {[1, 2, 3, 4].map(i => (
                        <button 
                          key={i}
                          onClick={() => handleAnswerChange(currentQuestion.id, i)}
                          className={`p-5 rounded-2xl border text-left font-bold transition-all ${
                            answers[currentQuestion.id] === i 
                            ? 'bg-primary/5 border-primary text-primary shadow-lg shadow-primary/5' 
                            : 'bg-white border-outline-variant/30 text-on-surface-variant hover:border-primary/50'
                          }`}
                        >
                          Lựa chọn {i}: Đây là một ví dụ về đáp án trắc nghiệm.
                        </button>
                      ))}
                   </div>
                </div>
              </div>
            )}
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

             <button 
                onClick={handleNext}
                disabled={currentQuestionIndex === questions.length - 1}
                className="flex items-center gap-2 px-6 py-2.5 bg-surface-container-high rounded-xl font-bold text-sm text-on-surface hover:bg-primary hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none"
             >
                Câu sau
                <ChevronRight className="w-5 h-5" />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
