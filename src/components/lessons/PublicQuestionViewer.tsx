
"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredLine, setHoveredLine] = useState<{ x: number, y: number, content: string } | null>(null);
  const [dragging, setDragging] = useState<{ 
    fromId: string; 
    fromSide: 'left' | 'right'; 
    x1: number; 
    y1: number; 
    x2: number; 
    y2: number;
  } | null>(null);

  const currentQuestion = questions[currentIndex];
  
  // Parse question content safely
  const questionData = useMemo(() => {
    try {
      return JSON.parse(currentQuestion.content);
    } catch (e) {
      return null;
    }
  }, [currentQuestion]);

  const shuffledRightItems = useMemo(() => {
    if (!questionData || !questionData.pairs) return [];
    return [...questionData.pairs].map(p => p.rightText).sort(() => Math.random() - 0.5);
  }, [currentIndex, questionData]);

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
       <div className="p-10 bg-slate-50 rounded-xl text-center text-slate-400 font-bold border-2 border-dashed border-slate-200">
          Dữ liệu câu hỏi bị lỗi
       </div>
    );
  }

  return (
    <div className="bg-white rounded-[20px] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
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
                          className={`p-5 rounded-lg border-2 text-left transition-all group relative ${stateClasses}`}
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
                          className={`p-6 rounded-xl border-2 font-black tracking-widest transition-all ${stateClasses}`}
                        >
                           {opt.text.toUpperCase()}
                        </button>
                      );
                    })}
                 </div>
               )}

                {/* MATCHING */}
                {currentQuestion.type === 'MATCHING' && questionData.pairs && (
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
                        {Object.entries(answers[currentQuestion.id]?.value || {}).map(([leftId, rightText], idx) => {
                          const pair = questionData.pairs.find((p: any) => p.id === leftId);
                          if (!pair) return null;

                          const isChecked = answers[currentQuestion.id]?.isCorrect !== undefined;
                          const isCorrect = isChecked && pair.rightText === rightText;
                          
                          const coords1 = getDotCoords(leftId, 'left');
                          const rightItemIdx = shuffledRightItems.indexOf(rightText as string);
                          if (rightItemIdx === -1) return null;
                          const coords2 = getDotCoords(rightItemIdx.toString(), 'right');
                          
                          let strokeColor = matchingColors[idx % matchingColors.length];
                          if (isChecked) {
                            strokeColor = isCorrect ? '#10B981' : '#EF4444';
                          }
                          
                          return (
                            <g 
                              key={`student-${leftId}`}
                              onMouseEnter={(e) => {
                                if (isChecked) {
                                  setHoveredLine({ x: e.clientX, y: e.clientY, content: isCorrect ? 'Đúng' : 'Sai' });
                                }
                              }}
                              onMouseMove={(e) => {
                                if (hoveredLine) setHoveredLine({ ...hoveredLine, x: e.clientX, y: e.clientY });
                              }}
                              onMouseLeave={() => setHoveredLine(null)}
                            >
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
                                className="pointer-events-none"
                              />
                              {isChecked && !isCorrect && (() => {
                                const correctIdx = shuffledRightItems.indexOf(pair.rightText);
                                if (correctIdx === -1) return null;
                                const correctCoords = getDotCoords(correctIdx.toString(), 'right');
                                return (
                                  <line 
                                    x1={coords1.x} y1={coords1.y} 
                                    x2={correctCoords.x} y2={correctCoords.y} 
                                    stroke="#CBD5E1"
                                    strokeWidth="2"
                                    strokeDasharray="2,4"
                                    className="opacity-60 pointer-events-none"
                                  />
                                );
                              })()}
                            </g>
                          );
                        })}
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

                      {/* Tooltip */}
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
                        {questionData.pairs.map((pair: any, idx: number) => {
                          const pairedRightText = (answers[currentQuestion.id]?.value || {})[pair.id];
                          return (
                            <div key={pair.id} className={`relative p-4 rounded-xl border-2 flex items-center gap-3 ${pairedRightText ? 'border-primary/40 bg-primary/5' : 'border-slate-100 bg-white'}`}>
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black shrink-0">{String.fromCharCode(65 + idx)}</div>
                              {pair.leftImageUrl || (pair.leftText?.startsWith('http') || pair.leftText?.startsWith('/')) ? (
                                <img src={pair.leftImageUrl || pair.leftText} alt="" className="h-14 w-14 object-cover rounded-lg" />
                              ) : (
                                <span className="font-bold text-slate-700">{pair.leftText}</span>
                              )}
                              <div 
                                id={`dot-left-${pair.id}`}
                                onMouseDown={() => {
                                  const coords = getDotCoords(pair.id, 'left');
                                  setDragging({ fromId: pair.id, fromSide: 'left', x1: coords.x, y1: coords.y, x2: coords.x, y2: coords.y });
                                }}
                                onMouseUp={() => {
                                  if (dragging && dragging.fromSide === 'right') {
                                    const rightText = shuffledRightItems[parseInt(dragging.fromId)];
                                    const currentVal = answers[currentQuestion.id]?.value || {};
                                    const newVal = { ...currentVal };
                                    Object.keys(newVal).forEach(k => { if (newVal[k] === rightText) delete newVal[k]; });
                                    newVal[pair.id] = rightText;
                                    setAnswers(prev => ({ ...prev, [currentQuestion.id]: { value: newVal, isCorrect: false } }));
                                    setDragging(null);
                                  }
                                }}
                                className={`w-4 h-4 rounded-full border-2 border-white shadow-sm absolute -right-2 top-1/2 -translate-y-1/2 z-30 cursor-crosshair ${pairedRightText ? 'bg-primary' : 'bg-slate-300'}`}
                              />
                            </div>
                          );
                        })}
                      </div>

                      {/* Right Column */}
                      <div className="space-y-4 z-20">
                        {shuffledRightItems.map((rightText: string, idx: number) => {
                          const pairedLeftId = Object.keys(answers[currentQuestion.id]?.value || {}).find(k => (answers[currentQuestion.id]?.value || {})[k] === rightText);
                          return (
                            <div key={idx} className={`relative p-4 rounded-xl border-2 flex items-center gap-3 ${pairedLeftId ? 'border-primary/40 bg-primary/5' : 'border-slate-100 bg-white'}`}>
                              <div 
                                id={`dot-right-${idx}`}
                                onMouseUp={() => {
                                  if (dragging && dragging.fromSide === 'left') {
                                    const currentVal = answers[currentQuestion.id]?.value || {};
                                    const newVal = { ...currentVal };
                                    // Overwrite: remove this rightText from other leftIds
                                    Object.keys(newVal).forEach(k => { if (newVal[k] === rightText) delete newVal[k]; });
                                    newVal[dragging.fromId] = rightText;
                                    setAnswers(prev => ({ ...prev, [currentQuestion.id]: { value: newVal, isCorrect: false } }));
                                    setDragging(null);
                                  }
                                }}
                                onMouseDown={(e) => {
                                  const rect = containerRef.current!.getBoundingClientRect();
                                  if (pairedLeftId) {
                                    // Re-drag logic
                                    const coords = getDotCoords(pairedLeftId, 'left');
                                    setDragging({
                                      fromId: pairedLeftId,
                                      fromSide: 'left',
                                      x1: coords.x, y1: coords.y,
                                      x2: e.clientX - rect.left, y2: e.clientY - rect.top
                                    });
                                  } else {
                                    // New drag from right
                                    const coords = getDotCoords(idx.toString(), 'right');
                                    setDragging({
                                      fromId: idx.toString(),
                                      fromSide: 'right',
                                      x1: coords.x, y1: coords.y,
                                      x2: coords.x, y2: coords.y
                                    });
                                  }
                                }}
                                className={`w-4 h-4 rounded-full border-2 border-white shadow-sm absolute -left-2 top-1/2 -translate-y-1/2 z-30 cursor-crosshair ${pairedLeftId ? 'bg-primary' : 'bg-slate-300'}`}
                              />
                              {rightText.startsWith('http') || rightText.startsWith('/') ? (
                                <img src={rightText} alt="" className="h-14 w-14 object-cover rounded-lg" />
                              ) : (
                                <span className="font-bold text-slate-700">{rightText}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* OTHER TYPES */}
                {currentQuestion.type !== 'MULTIPLE_CHOICE' && currentQuestion.type !== 'TRUE_FALSE' && currentQuestion.type !== 'MATCHING' && (
                 <div className="p-8 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 text-center">
                    <p className="text-slate-400 font-bold italic">
                       Loại câu hỏi {currentQuestion.type} đang được cập nhật...
                    </p>
                 </div>
               )}
            </div>
         </div>

         {/* Explanation Box */}
         {showExplanation[currentQuestion.id] && (
           <div className="animate-in fade-in slide-in-from-top-2 duration-500 bg-blue-50/50 rounded-xl p-8 border border-blue-100 space-y-3">
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
           className="flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm text-slate-500 hover:bg-white disabled:opacity-30 transition-all"
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
                 className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-lg font-black text-sm tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-900/10"
              >
                 HOÀN THÀNH
              </button>
            )
         ) : (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-lg font-black text-sm tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
            >
               CÂU TIẾP THEO
               <ChevronRight className="w-5 h-5" />
            </button>
         )}
      </div>
    </div>
  );
}
