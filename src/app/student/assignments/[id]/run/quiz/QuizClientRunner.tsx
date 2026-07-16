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
  Check,
  MousePointer2,
  RotateCcw,
  CheckCircle,
  XCircle,
  FileText,
  Volume2,
  Info
} from "lucide-react";

import { BookmarkButton } from "@/components/common/BookmarkButton";
import { submitAssignmentReview } from "@/actions/reviews";
import { GlobalAudioPlayer } from "@/components/common/GlobalAudioPlayer";
import { QuestionAudioPlayButton } from "@/components/common/QuestionAudioPlayButton";
import { toast } from "sonner";
import { ReviewList } from "@/components/reviews/ReviewList";
import { InteractiveReadingContent } from "@/components/common/InteractiveReadingContent";
import { InstructionsBlock } from "@/components/common/InstructionsBlock";
import { ExplanationBlock } from "@/components/common/ExplanationBlock";
import { FloatingTeacherInfo } from "@/app/student/_components/FloatingTeacherInfo";
import { RelatedAssignmentsSection } from "@/app/student/_components/RelatedAssignmentsSection";
import KidTeenQuizRunner from "./KidTeenQuizRunner";
import Link from "next/link";
import { LoginModal } from "@/components/LoginButton";
import { completeSubmission } from "@/actions/submission-actions";
import { useTranslations } from "next-intl";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { playCorrectSound, playIncorrectSound } from "@/utils/soundEffects";


// Helper to determine question correctness
const getQuestionStatus = (q: any, answer: any) => {
  if (answer === undefined || answer === null) return 'pending';
  
  let questionData: any;
  try {
    questionData = typeof q.content === 'string' ? JSON.parse(q.content) : q.content;
  } catch (e) {
    questionData = {};
  }
  
  const qType = questionData.isMultiple ? "MULTIPLE_SELECT" : (questionData.type || q.type);

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

  if (qType === "CLOZE_TEST") {
    const textWithBlanks = questionData.textWithBlanks || questionData.questionText || "";
    const blanks = Array.from(textWithBlanks.matchAll(/\{\{(.*?)\}\}/g)).map((m: any) => m[1]);
    const userAnswer = answer || {};
    
    if (Object.keys(userAnswer).length === 0) return 'pending';
    
    const isAllCorrect = blanks.every((expectedWord, idx) => {
      const userWord = (userAnswer[idx] || "").trim();
      if (questionData.caseSensitive) {
        return expectedWord === userWord;
      }
      return expectedWord.toLowerCase() === userWord.toLowerCase();
    });
    
    return isAllCorrect ? 'correct' : 'incorrect';
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

function ClozeTestQuestionBlock({ q, questionData, userAnswer, isChecked, handleAnswerChange }: any) {
  const textWithBlanks = questionData.textWithBlanks || questionData.questionText || "";
  const parts = textWithBlanks.split(/(\{\{.*?\}\})/g);
  let blankIndex = 0;

  return (
    <div className="w-full p-6 lg:p-10 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-3xl text-xl lg:text-2xl font-medium text-slate-700 dark:text-slate-200 leading-[3rem] lg:leading-[4rem] relative shadow-inner">
      <div className="relative z-20">
        {parts.map((part: string, i: number) => {
          if (part.startsWith('{{') && part.endsWith('}}')) {
            const expectedWord = part.slice(2, -2);
            const currentIndex = blankIndex++;
            const userWord = (userAnswer || {})[currentIndex] || "";
            
            let isCorrect = false;
            if (questionData.caseSensitive) {
              isCorrect = expectedWord === userWord.trim();
            } else {
              isCorrect = expectedWord.toLowerCase() === userWord.trim().toLowerCase();
            }

            let borderClass = 'border-b-2 border-slate-300 dark:border-slate-600 focus:border-primary';
            let bgClass = 'bg-white dark:bg-slate-800 focus:bg-primary/5';
            let textClass = 'text-primary font-bold';

            if (isChecked) {
              if (isCorrect) {
                borderClass = 'border-2 border-emerald-500 rounded-lg';
                bgClass = 'bg-emerald-50 dark:bg-emerald-900/20';
                textClass = 'text-emerald-700 dark:text-emerald-400 font-bold';
              } else {
                borderClass = 'border-2 border-rose-500 rounded-lg';
                bgClass = 'bg-rose-50 dark:bg-rose-900/20';
                textClass = 'text-rose-700 dark:text-rose-400 font-bold opacity-70 line-through';
              }
            }

            const width = Math.max(userWord.length, isChecked && !isCorrect ? expectedWord.length : 5) * 1.2 + 2;

            return (
              <span key={i} className="inline-block relative mx-2 align-middle">
                <input
                  type="text"
                  disabled={isChecked}
                  value={userWord}
                  onChange={(e) => {
                    const currentAnswers = userAnswer || {};
                    handleAnswerChange(q, {
                      ...currentAnswers,
                      [currentIndex]: e.target.value
                    });
                  }}
                  className={`inline-block text-center outline-none transition-all px-2 py-1 ${borderClass} ${bgClass} ${textClass} min-w-[80px] disabled:opacity-100 disabled:cursor-not-allowed`}
                  style={{ width: `${width}ch` }}
                  placeholder="..."
                />
                {isChecked && !isCorrect && (
                  <span className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-bold rounded-lg border border-emerald-200 shadow-md whitespace-nowrap z-30">
                    {expectedWord}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-emerald-100 rotate-45 border-r border-b border-emerald-200"></div>
                  </span>
                )}
              </span>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </div>
    </div>
  );
}

function MatchingQuestionBlock({ q, questionData, userAnswer, isChecked, handleAnswerChange, matchingColors }: any) {
  const t = useTranslations("student.quiz");
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<any>(null);
  const [hoveredLine, setHoveredLine] = useState<any>(null);
  const [, setForceUpdate] = useState({});
  const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);

  useEffect(() => {
    // Force a re-render after mount to ensure DOM nodes exist for getDotCoords
    setForceUpdate({});
    
    // Also re-calculate lines if window resizes
    const handleResize = () => setForceUpdate({});
    window.addEventListener("resize", handleResize);
    
    return () => window.removeEventListener("resize", handleResize);
  }, [q.id]);

  const shuffledRightItems = useMemo(() => {
    if (!questionData.pairs) return [];
    const seed = q.id;
    return [...questionData.pairs]
      .map(p => p.rightText)
      .sort(() => (seed.length % 2 === 0 ? 1 : -1) * 0.5 - Math.random());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.id, JSON.stringify(questionData.pairs)]);

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
        className="grid grid-cols-2 gap-x-8 md:gap-x-16 gap-y-4 relative p-2 md:p-4"
        style={{ touchAction: "auto" }}
        onPointerMove={(e) => {
          if (!dragging || !containerRef.current) return;
          const rect = containerRef.current.getBoundingClientRect();
          setDragging({ ...dragging, x2: e.clientX - rect.left, y2: e.clientY - rect.top });
        }}
        onPointerUp={(e) => {
          if (dragging) {
            const target = document.elementFromPoint(e.clientX, e.clientY);
            const dot = target?.closest('[id^="dot-"]');
            if (dot) {
              const id = dot.id.replace('-wrapper', '');
              if (dragging.fromSide === 'left' && id.includes('dot-right-')) {
                const idx = parseInt(id.split('-').pop()!);
                if (!isNaN(idx) && shuffledRightItems[idx] !== undefined)
                  handleAnswerChange(q, { leftId: dragging.fromId, rightText: shuffledRightItems[idx] });
              } else if (dragging.fromSide === 'right' && id.includes('dot-left-')) {
                const pairId = id.replace(`dot-left-${q.id}-`, '');
                handleAnswerChange(q, { leftId: pairId, rightText: shuffledRightItems[parseInt(dragging.fromId)] });
              }
            }
          }
          setDragging(null);
        }}
        onPointerCancel={() => setDragging(null)}
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
              <g 
                key={`student-${leftId}`} 
                onMouseEnter={(e) => isChecked && setHoveredLine({ 
                  x: e.clientX, 
                  y: e.clientY, 
                  isCorrect, 
                  content: isCorrect ? t('correct') : t('yourIncorrectMatch', { defaultMessage: 'Your choice (Incorrect)' }) 
                })} 
                onMouseLeave={() => setHoveredLine(null)}
              >
                <line x1={coords1.x} y1={coords1.y} x2={coords2.x} y2={coords2.y} stroke="transparent" strokeWidth="25" className="cursor-help pointer-events-auto" />
                <line 
                  x1={coords1.x} y1={coords1.y} x2={coords2.x} y2={coords2.y} 
                  stroke={strokeColor} 
                  strokeWidth={isChecked ? (isCorrect ? "5" : "4") : "3"} 
                  strokeDasharray="none" 
                  opacity={isChecked && isCorrect ? "1" : "0.9"} 
                  className="transition-all duration-500 pointer-events-none" 
                />
                {isChecked && !isCorrect && (() => {
                  const correctIdx = shuffledRightItems.indexOf(pair.rightText);
                  if (correctIdx === -1) return null;
                  const correctCoords = getDotCoords(correctIdx.toString(), 'right');
                  return (
                    <g
                      onMouseEnter={(e) => setHoveredLine({ 
                        x: e.clientX, 
                        y: e.clientY, 
                        isCorrect: true, 
                        content: t('correctAnswer', { defaultMessage: 'Correct answer' }) 
                      })}
                      onMouseLeave={() => setHoveredLine(null)}
                      className="cursor-help pointer-events-auto"
                    >
                      <line x1={coords1.x} y1={coords1.y} x2={correctCoords.x} y2={correctCoords.y} stroke="transparent" strokeWidth="20" />
                      <line 
                        x1={coords1.x} y1={coords1.y} x2={correctCoords.x} y2={correctCoords.y} 
                        stroke="#10B981" 
                        strokeWidth="3" 
                        strokeDasharray="6,4" 
                        opacity="0.8" 
                        className="pointer-events-none"
                        style={{ animation: "dash 1s linear infinite" }}
                      />
                    </g>
                  );
                })()}
              </g>
            );
          })}
          {dragging && <line x1={dragging.x1} y1={dragging.y1} x2={dragging.x2} y2={dragging.y2} stroke="#3B82F6" strokeWidth="4" />}
        </svg>
        
        {/* CSS Animation cho nét đứt chạy rần rần */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes dash {
            to {
              stroke-dashoffset: -10;
            }
          }
        `}} />
        {hoveredLine && (
          <div className="fixed z-[100] px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold pointer-events-none shadow-xl -translate-x-1/2 -translate-y-full mb-4" style={{ left: hoveredLine.x, top: hoveredLine.y }}>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${hoveredLine.isCorrect ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              {hoveredLine.content}
            </div>
          </div>
        )}
        <div className="flex flex-col justify-between gap-3 z-20">

          {(questionData.pairs || []).map((pair: any, idx: number) => {
            const pairedRightText = userAnswer?.[pair.id];
            const leftIsImage = !!(pair.leftImageUrl || pair.leftText?.startsWith('http') || pair.leftText?.startsWith('/'));
            const isSelected = selectedLeftId === pair.id;
            return (
              <div key={pair.id || idx} className="relative transition-all" style={leftIsImage && idx % 2 === 1 ? { marginTop: '-10%', zIndex: idx + 1 } : { zIndex: idx + 1 }}>
                {leftIsImage ? (
                  <div
                    className={`relative cursor-pointer rounded-2xl p-1 border-2 transition-all ${
                      isSelected 
                        ? 'border-primary ring-2 ring-primary/20 bg-primary/5' 
                        : pairedRightText 
                          ? 'border-secondary/40' 
                          : 'border-transparent hover:border-outline-variant/30'
                    }`}
                    style={{ width: '40%', marginLeft: idx % 2 === 0 ? '0' : 'auto' }}
                    onClick={() => {
                      if (isChecked) return;
                      setSelectedLeftId(isSelected ? null : pair.id);
                    }}
                  >
                    <img src={pair.leftImageUrl || pair.leftText} alt="" className="w-full aspect-[4/3] object-cover rounded-[5px] block" />
                    <div 
                      id={`dot-left-${q.id}-${pair.id}-wrapper`}
                      onPointerDown={(e) => {
                        if (isChecked) return;
                        e.stopPropagation();
                        e.currentTarget.setPointerCapture(e.pointerId);
                        const coords = getDotCoords(pair.id, 'left');
                        setDragging({ fromId: pair.id, fromSide: 'left', x1: coords.x, y1: coords.y, x2: coords.x, y2: coords.y, pointerId: e.pointerId });
                      }}
                      onPointerUp={(e) => {
                        try {
                          e.currentTarget.releasePointerCapture(e.pointerId);
                        } catch (err) {}
                      }}
                      className="absolute -right-5 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center z-30 cursor-crosshair touch-none"
                    >
                      <div id={`dot-left-${q.id}-${pair.id}`}
                        className={`w-5 h-5 rounded-full border-4 border-white shadow-sm transition-transform hover:scale-150 ${pairedRightText ? 'bg-secondary' : 'bg-outline-variant hover:bg-primary'}`} />
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => {
                      if (isChecked) return;
                      setSelectedLeftId(isSelected ? null : pair.id);
                    }}
                    className={`relative flex items-center justify-between p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-primary ring-2 ring-primary/20 bg-primary/5' 
                        : pairedRightText 
                          ? 'border-secondary/40 bg-secondary/5' 
                          : 'border-outline-variant/30 bg-white hover:border-outline-variant'
                    }`}
                  >
                    <span className="font-bold text-on-surface">{pair.leftText}</span>
                    <div 
                      id={`dot-left-${q.id}-${pair.id}-wrapper`}
                      onPointerDown={(e) => {
                        if (isChecked) return;
                        e.stopPropagation();
                        e.currentTarget.setPointerCapture(e.pointerId);
                        const coords = getDotCoords(pair.id, 'left');
                        setDragging({ fromId: pair.id, fromSide: 'left', x1: coords.x, y1: coords.y, x2: coords.x, y2: coords.y, pointerId: e.pointerId });
                      }}
                      onPointerUp={(e) => {
                        try {
                          e.currentTarget.releasePointerCapture(e.pointerId);
                        } catch (err) {}
                      }}
                      className="absolute -right-5 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center z-30 cursor-crosshair touch-none"
                    >
                      <div id={`dot-left-${q.id}-${pair.id}`}
                        className={`w-5 h-5 rounded-full border-4 border-white shadow-sm transition-transform hover:scale-150 ${pairedRightText ? 'bg-secondary' : 'bg-outline-variant hover:bg-primary'}`} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex flex-col justify-between gap-3 z-20">

          {shuffledRightItems.map((rightText: string, idx: number) => {
            const pairedLeftId = Object.keys(userAnswer || {}).find(k => userAnswer[k] === rightText);
            const isPairCorrect = isChecked && pairedLeftId && (questionData.pairs.find((p:any) => p.id === pairedLeftId)?.rightText === rightText);
            const rightIsImage = !!(rightText?.startsWith('http') || rightText?.startsWith('/'));
            const isSelectedPartner = selectedLeftId === pairedLeftId;
            return (
              <div key={idx} className="relative transition-all" style={rightIsImage && idx % 2 === 1 ? { marginTop: '-10%', zIndex: idx + 1 } : { zIndex: idx + 1 }}>
                {rightIsImage ? (
                  <div
                    className={`relative cursor-pointer rounded-2xl p-1 border-2 transition-all ${
                      isSelectedPartner 
                        ? 'border-primary ring-2 ring-primary/20 bg-primary/5' 
                        : pairedLeftId 
                          ? 'border-secondary/40' 
                          : 'border-transparent hover:border-outline-variant/30'
                    }`}
                    style={{ width: '40%', marginLeft: idx % 2 === 0 ? '0' : 'auto' }}
                    onClick={() => {
                      if (isChecked) return;
                      if (selectedLeftId) {
                        handleAnswerChange(q, { leftId: selectedLeftId, rightText });
                        setSelectedLeftId(null);
                      } else if (pairedLeftId) {
                        setSelectedLeftId(pairedLeftId);
                      }
                    }}
                  >
                    <div 
                      id={`dot-right-${q.id}-${idx}-wrapper`}
                      onPointerDown={(e) => {
                        if (isChecked) return;
                        e.stopPropagation();
                        e.currentTarget.setPointerCapture(e.pointerId);
                        const rect = containerRef.current!.getBoundingClientRect();
                        if (pairedLeftId) {
                          const coords = getDotCoords(pairedLeftId, 'left');
                          setDragging({ fromId: pairedLeftId, fromSide: 'left', x1: coords.x, y1: coords.y, x2: e.clientX - rect.left, y2: e.clientY - rect.top, pointerId: e.pointerId });
                        } else {
                          const coords = getDotCoords(idx.toString(), 'right');
                          setDragging({ fromId: idx.toString(), fromSide: 'right', x1: coords.x, y1: coords.y, x2: coords.x, y2: coords.y, pointerId: e.pointerId });
                        }
                      }}
                      onPointerUp={(e) => {
                        try {
                          e.currentTarget.releasePointerCapture(e.pointerId);
                        } catch (err) {}
                      }}
                      className="absolute -left-5 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center z-30 cursor-crosshair touch-none"
                    >
                      <div id={`dot-right-${q.id}-${idx}`}
                        className={`w-5 h-5 rounded-full border-4 border-white shadow-sm transition-transform hover:scale-150 ${pairedLeftId ? 'bg-secondary' : 'bg-outline-variant hover:bg-primary'}`} />
                    </div>
                    <img src={rightText} alt="" className="w-full aspect-[4/3] object-cover rounded-[5px] block" />
                    {isChecked && pairedLeftId && (
                      <div className="absolute top-2 right-2">{isPairCorrect ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-rose-500" />}</div>
                    )}
                  </div>
                ) : (
                  <div 
                    onClick={() => {
                      if (isChecked) return;
                      if (selectedLeftId) {
                        handleAnswerChange(q, { leftId: selectedLeftId, rightText });
                        setSelectedLeftId(null);
                      } else if (pairedLeftId) {
                        setSelectedLeftId(pairedLeftId);
                      }
                    }}
                    className={`relative flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                      isSelectedPartner 
                        ? 'border-primary ring-2 ring-primary/20 bg-primary/5' 
                        : pairedLeftId 
                          ? 'border-secondary/40 bg-secondary/5' 
                          : 'border-outline-variant/30 bg-white hover:border-outline-variant'
                    }`}
                  >
                    <div 
                      id={`dot-right-${q.id}-${idx}-wrapper`}
                      onPointerDown={(e) => {
                        if (isChecked) return;
                        e.stopPropagation();
                        e.currentTarget.setPointerCapture(e.pointerId);
                        const rect = containerRef.current!.getBoundingClientRect();
                        if (pairedLeftId) {
                          const coords = getDotCoords(pairedLeftId, 'left');
                          setDragging({ fromId: pairedLeftId, fromSide: 'left', x1: coords.x, y1: coords.y, x2: e.clientX - rect.left, y2: e.clientY - rect.top, pointerId: e.pointerId });
                        } else {
                          const coords = getDotCoords(idx.toString(), 'right');
                          setDragging({ fromId: idx.toString(), fromSide: 'right', x1: coords.x, y1: coords.y, x2: coords.x, y2: coords.y, pointerId: e.pointerId });
                        }
                      }}
                      onPointerUp={(e) => {
                        try {
                          e.currentTarget.releasePointerCapture(e.pointerId);
                        } catch (err) {}
                      }}
                      className="absolute -left-5 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center z-30 cursor-crosshair touch-none"
                    >
                      <div id={`dot-right-${q.id}-${idx}`}
                        className={`w-5 h-5 rounded-full border-4 border-white shadow-sm transition-transform hover:scale-150 ${pairedLeftId ? 'bg-secondary' : 'bg-outline-variant hover:bg-primary'}`} />
                    </div>
                    <span className="font-bold text-on-surface">{rightText}</span>
                    {isChecked && pairedLeftId && <div className="ml-auto">{isPairCorrect ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-rose-500" />}</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bảng chú giải (Legend) */}
      {isChecked && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-6 px-4 py-3 bg-slate-50/80 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 w-fit mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-5 h-1 bg-emerald-500 rounded-full"></div>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{t("yourCorrectMatch", { defaultMessage: "Correct choice" })}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-1 bg-rose-500 rounded-full"></div>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{t("yourIncorrectMatch", { defaultMessage: "Incorrect choice" })}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 border-t-[3px] border-dashed border-emerald-500"></div>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{t("correctAnswer", { defaultMessage: "Correct answer" })}</span>
          </div>
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
  extraDataPromise: Promise<any>;
  relatedAssignmentsPromise?: Promise<any[]>;
  questionTranslationsPromise?: Promise<Record<string, any>>;
  assignmentTranslationsPromise?: Promise<any>;
  isGuest?: boolean;
}

/** Resolves questionTranslationsPromise and renders ExplanationBlock with translations.
 *  Must be inside a React.Suspense boundary. */
function ExplanationResolver({
  promise,
  questionId,
  explanation,
  isExpanded,
  onToggleExpand,
}: {
  promise: Promise<Record<string, any>> | undefined;
  questionId: string;
  explanation: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const translationMap = promise ? React.use(promise) : null;
  const translations = translationMap?.[questionId] ?? null;
  return (
    <ExplanationBlock
      questionId={questionId}
      explanation={explanation}
      explanationTranslations={translations}
      isExpanded={isExpanded}
      onToggleExpand={onToggleExpand}
    />
  );
}

function GlobalTeacherInfoConsumer({ promise, handleSafeNavigate }: any) {
  const extraData = React.use(promise) as any;
  if (!extraData || !extraData.teacher) return null;
  return <FloatingTeacherInfo teacher={extraData.teacher} onNavigate={handleSafeNavigate} />;
}

function AssignmentExtraDataConsumer({ promise, translationsPromise, isGuest, handleSafeNavigate, t }: any) {
  const extraData = React.use(promise) as any;
  const instructionsTranslations = translationsPromise ? React.use(translationsPromise) as any : null;
  if (!extraData) return null;

  const videoUrl = extraData.lesson?.videoUrl || extraData.videoUrl;
  const audioUrl = extraData.lesson?.audioUrl || extraData.audioUrl;
  const youtubeId = getYoutubeVideoId(videoUrl);

  const hasMaterialSection = videoUrl || audioUrl || extraData.readingText;
  const hasInstructionText = !!extraData.instructionsImageUrl ||
    (extraData.instructions &&
      (String(extraData.instructions).replace(/<[^>]*>/g, "").trim().length > 0 ||
       /<(img|video|audio|iframe|embed)\b/i.test(String(extraData.instructions))));

  return (
    <>
      <div className="h-12 border-b border-outline-variant/10 flex items-center justify-start px-6 bg-transparent shrink-0">
        <div className="flex items-center gap-4">
             <BookmarkButton 
               id={extraData.id} 
               type="ASSIGNMENT" 
               initialIsBookmarked={extraData.favoriteAssignments?.length > 0} 
               isLoggedIn={!isGuest}
             />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-8 lg:p-10 custom-scrollbar lg:pb-20 pb-20 space-y-12">
        {/* Instructions Section */}
        {hasMaterialSection && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest">
              <BookOpen className="w-4 h-4 stroke-[2px]" />
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
                      title="Video"
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
                <GlobalAudioPlayer audioUrl={audioUrl} autoPlay={false} />
              )}

              <div className="prose prose-slate prose-lg dark:prose-invert max-w-none prose-headings:font-black prose-p:leading-loose prose-p:text-xl text-lg leading-loose">
                <InteractiveReadingContent html={extraData.readingText} isLoggedIn={!isGuest} />
              </div>
            </div>
          </div>
        )}

        {/* Tags Section */}
        {extraData.tags && (
          <div className="flex flex-wrap gap-2">
            {extraData.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean).map((tag: string, i: number) => (
              <Link 
                key={i} 
                href={`/tags/${encodeURIComponent(tag)}`}
                className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-300"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* Instructions with language toggle */}
        {hasInstructionText && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-secondary font-black text-xs uppercase tracking-widest">
              <Info className="w-4 h-4 stroke-[2px]" />
              {t("instructions")}
            </div>
            <InstructionsBlock
              instructions={extraData.instructions}
              instructionsTranslations={instructionsTranslations}
              instructionsImageUrl={extraData.instructionsImageUrl}
              isLoggedIn={!isGuest}
            />
          </div>
        )}
      </div>
    </>
  );
}

const getYoutubeVideoId = (url: string | null) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

function RelatedAssignmentsConsumer({ promise, isGuest, onNavigate }: { promise: Promise<any[]>, isGuest: boolean, onNavigate: (url: string) => void }) {
  const relatedAssignments = React.use(promise);
  if (!relatedAssignments || relatedAssignments.length === 0) return null;
  return (
    <RelatedAssignmentsSection 
      items={relatedAssignments.map((a: any) => ({ ...a, type: a.type || ("ASSIGNMENT" as const) }))} 
      isGuest={isGuest}
      onNavigate={onNavigate}
    />
  );
}

function SidePanelToggleButton({ promise, isSidebarOpen, setIsSidebarOpen }: { promise: Promise<any>, isSidebarOpen: boolean, setIsSidebarOpen: (open: boolean) => void }) {
  const extraData = React.use(promise) as any;
  if (!extraData) return null;

  const videoUrl = extraData.lesson?.videoUrl || extraData.videoUrl;
  const audioUrl = extraData.lesson?.audioUrl || extraData.audioUrl;
  const hasMaterialSection = videoUrl || audioUrl || (extraData.readingText && String(extraData.readingText).replace(/<[^>]*>/g, "").trim().length > 0);
  
  const hasInstructionText = extraData.instructions && (
    String(extraData.instructions).replace(/<[^>]*>/g, "").trim().length > 0 || 
    /<(img|video|audio|iframe|embed)\b/i.test(String(extraData.instructions))
  );

  const hasTags = !!extraData.tags;

  if (!hasMaterialSection && !hasInstructionText && !hasTags) {
    return null;
  }

  return (
    <button
      onClick={() => setIsSidebarOpen(true)}
      className={`fixed right-0 z-[90] px-4 py-3 bg-blue-500 border-2 border-green-400 text-white font-bold rounded-l-2xl shadow-[-4px_0_20px_rgba(0,0,0,0.15)] flex items-center justify-center hover:bg-blue-600 active:scale-95 transition-all duration-300
        top-1/2 [@media(max-width:800px)]:top-auto
        -translate-y-1/2 [@media(max-width:800px)]:translate-y-0
        [@media(max-width:800px)]:bottom-24
        ${isSidebarOpen ? 'opacity-0 pointer-events-none translate-x-10' : 'opacity-100 translate-x-0'}`}
    >
      <span className="font-black text-xs uppercase tracking-widest">View lesson</span>
    </button>
  );
}

export default function QuizClientRunner({ 
  assignment, 
  submissionId, 
  questions, 
  initialAnswers,
  extraDataPromise,
  relatedAssignmentsPromise,
  questionTranslationsPromise,
  assignmentTranslationsPromise,
  isGuest = false
}: Props) {
  const t = useTranslations("student.quiz");
  const { isHidden } = useScrollDirection();

  const isKidTeenMode = useMemo(() => {
    const audiences: string[] = assignment.targetAudiences || [];
    const lessonAudiences: string[] = assignment.lesson?.targetAudiences || [];
    const combined = [...audiences, ...lessonAudiences];
    const isKidOrTeen = combined.some(aud => {
      const lower = String(aud).toLowerCase();
      return lower === "kindergarten" || lower === "kid" || lower === "teen";
    });
    return isKidOrTeen;
  }, [assignment.targetAudiences, assignment.lesson?.targetAudiences]);

  // ────────────────────────────────────────────────────────
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState(initialAnswers);
  const [checkedQuestions, setCheckedQuestions] = useState<Record<string, boolean>>({});
  const [expandedExplanations, setExpandedExplanations] = useState<Record<string, boolean>>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [showLoginModal, setShowLoginModal] = useState(false);

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
  const [userReview, setUserReview] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
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

  // Dynamic sizing configuration based on question count to prevent horizontal overflows
  const sizeConfig = useMemo(() => {
    const qCount = questions.length;
    if (qCount <= 10) {
      return {
        circle: "w-10 h-10 text-xs",
        gap: "gap-3",
        line: "w-3",
        badgePos: "-top-3.5",
        badgePadding: "p-1",
        badgeIconSize: "w-2.5 h-2.5"
      };
    } else if (qCount <= 15) {
      return {
        circle: "w-9 h-9 text-xs",
        gap: "gap-2",
        line: "w-2",
        badgePos: "-top-3.2",
        badgePadding: "p-0.5",
        badgeIconSize: "w-2.5 h-2.5"
      };
    } else if (qCount <= 22) {
      return {
        circle: "w-8 h-8 text-[10px]",
        gap: "gap-1.5",
        line: "w-1.5",
        badgePos: "-top-3",
        badgePadding: "p-0.5",
        badgeIconSize: "w-2 h-2"
      };
    } else {
      return {
        circle: "w-7 h-7 text-[9px]",
        gap: "gap-1",
        line: "w-1",
        badgePos: "-top-2.5",
        badgePadding: "p-0.5",
        badgeIconSize: "w-1.5 h-1.5"
      };
    }
  }, [questions.length]);

  const isAllChecked = useMemo(() => {
    return questions.length > 0 && questions.every(q => checkedQuestions[q.id]);
  }, [questions, checkedQuestions]);

  const hasAnyChecked = useMemo(() => {
    return Object.keys(checkedQuestions).length > 0;
  }, [checkedQuestions]);

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
    const qType = questionData.isMultiple ? "MULTIPLE_SELECT" : (questionData.type || q.type);

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

      if (qType === "CLOZE_TEST") {
        const currentCloze = (currentAnswer && typeof currentAnswer === 'object') ? currentAnswer : {};
        return {
          ...prev,
          [q.id]: {
            ...currentCloze,
            ...value
          }
        };
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
    
    // Scroll to top instantly so student can watch the progress circles change color
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
    
    for (const q of questions) {
      await new Promise(resolve => setTimeout(resolve, 500)); // Delay between reveals
      setCheckedQuestions(prev => ({ ...prev, [q.id]: true }));
      
      const isCorrect = getQuestionStatus(q, answers[q.id]) === 'correct';
      if (isCorrect) {
        playCorrectSound();
      } else {
        playIncorrectSound();
      }
      if (!isCorrect && q.explanation) {
        setExpandedExplanations(prev => ({ ...prev, [q.id]: true }));
      }
    }
  };

  const handleReset = () => {
    // Reset all answers to initial empty state
    const emptyAnswers: Record<string, any> = {};
    setAnswers(emptyAnswers);
    // Reset checked questions to hide answer reveals
    setCheckedQuestions({});
    setExpandedExplanations({});
  };

  const handleSubmit = () => {
    if (isGuest) {
      if (confirm(t("guestSubmitConfirm"))) {
        setShowLoginModal(true);
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

  // ── Kid/Teen mode: delegate AFTER all hooks are called ────────────────────
  if (isKidTeenMode) {
    return (
      <KidTeenQuizRunner
        assignment={assignment}
        submissionId={submissionId}
        questions={questions}
        initialAnswers={initialAnswers}
        extraDataPromise={extraDataPromise}
        relatedAssignmentsPromise={relatedAssignmentsPromise}
        questionTranslationsPromise={questionTranslationsPromise}
        assignmentTranslationsPromise={assignmentTranslationsPromise}
        isGuest={isGuest}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen lg:h-screen lg:max-h-screen lg:overflow-hidden relative bg-[#F4EFE6] dark:bg-slate-950 lg:p-6 font-body">
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} defaultView="studentLogin" />
      
      {/* Header removed as per user request */}

      <React.Suspense fallback={null}>
        <GlobalTeacherInfoConsumer promise={extraDataPromise} handleSafeNavigate={handleSafeNavigate} />
      </React.Suspense>

      {/* Integrated Workspace */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-primary/5 rounded-none lg:rounded-[3.5rem] shadow-2xl shadow-primary/5">
        {/* Main Column: Questions (Full width now since right column is a drawer) */}
        <div className="w-full shrink-0 flex flex-col border-b lg:border-b-0 lg:border-r border-outline-variant/20 relative">
           {/* Progress Navigation Header (Sticky) */}
           <div className={`sticky top-0 z-50 transition-transform duration-500 ease-in-out ${(isHidden && !hasAnyChecked) ? '-translate-y-[120%] pointer-events-none' : 'translate-y-0'} min-h-[5rem] py-3 border-b border-outline-variant/10 flex flex-col md:flex-row items-center md:items-center px-4 md:px-6 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md shrink-0 gap-3 md:gap-6`}>
              <div className="shrink-0 w-full md:w-auto flex justify-start">

              </div>
              
              <div className="flex-1 flex flex-col items-center justify-center gap-2 md:gap-4 pr-0 md:pr-20 w-full min-w-0"> {/* min-w-0 to allow flex child to shrink properly */}
                <h2 className="text-[11px] font-black text-on-surface/80 uppercase tracking-[0.2em] line-clamp-1 max-w-[100%] md:max-w-[80%] text-center">
                  {assignment.title}
                </h2>
                <div className={`flex items-center max-w-full overflow-x-auto no-scrollbar px-4 pt-4 pb-2 ${sizeConfig.gap}`}>
                   {questions.map((q, i) => {
                      const ans = answers[q.id];
                      const isCompleted = ans !== undefined && ans !== null && (
                        (typeof ans === 'object' ? Object.keys(ans).length > 0 : true)
                      );
                      const isActive = activeQuestionId === q.id;
                      const isChecked = checkedQuestions[q.id];
                      const status = isChecked ? getQuestionStatus(q, ans) : null;

                      return (
                          <button
                            key={q.id}
                            onClick={() => scrollToQuestion(q.id)}
                            className={`relative shrink-0 flex items-center justify-center rounded-full font-black transition-all duration-300 border-2 ${sizeConfig.circle} ${
                              isActive 
                               ? "bg-amber-100 border-amber-500 text-amber-600 scale-110 shadow-lg shadow-amber-500/20" 
                               : status === 'correct'
                                 ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20"
                                 : status === 'incorrect'
                                   ? "bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-500/20"
                                   : isCompleted
                                     ? "bg-primary border-primary text-white shadow-md shadow-primary/20"
                                     : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"
                            }`}
                          >
                             {i + 1}
                             
                             {/* Feedback indicator above circle */}
                             {checkedQuestions[q.id] && (
                               <div className={`absolute left-1/2 -translate-x-1/2 animate-in zoom-in slide-in-from-bottom-2 duration-500 z-20 ${sizeConfig.badgePos}`}>
                                 {getQuestionStatus(q, answers[q.id]) === 'correct' ? (
                                   <div className={`bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-500/40 border-2 border-white dark:border-slate-900 ${sizeConfig.badgePadding}`}>
                                     <Check className={`stroke-[4px] ${sizeConfig.badgeIconSize}`} />
                                   </div>
                                 ) : (
                                   <div className={`bg-rose-500 text-white rounded-full shadow-lg shadow-rose-500/40 border-2 border-white dark:border-slate-900 ${sizeConfig.badgePadding}`}>
                                     <X className={`stroke-[4px] ${sizeConfig.badgeIconSize}`} />
                                   </div>
                                 )}
                               </div>
                             )}

                             {/* Connection line between circles */}
                             {i < questions.length - 1 && (
                               <div className={`absolute left-full h-0.5 -z-10 ${sizeConfig.line} ${isCompleted ? 'bg-primary/30' : 'bg-slate-100 dark:bg-slate-800'}`} />
                             )}
                          </button>
                      )
                   })}
                </div>
              </div>
           </div>

          <div className="flex-1 overflow-y-auto no-scrollbar p-5 lg:p-12 lg:pl-20 space-y-12 scroll-smooth">
            {/* All Questions Rendered */}
            {questions.map((q, idx) => {
              let questionData: any;
              try {
                questionData = JSON.parse(q.content);
              } catch (e) {
                questionData = { questionText: q.content };
              }

              const qType = questionData.isMultiple ? "MULTIPLE_SELECT" : (questionData.type || q.type);
              const isMultiSelect = qType === "MULTIPLE_SELECT";
              let questionText = questionData.instruction ?? questionData.questionText ?? questionData.statement ?? questionData.textWithBlanks ?? q.content;
              
              // Prevent showing raw JSON if questionText is just the stringified content
              if (questionText && questionText.startsWith('{') && questionText.endsWith('}')) {
                questionText = "";
              }
              if (qType === "CLOZE_TEST" && questionText && questionText.includes("{{")) {
                questionText = questionData.instruction || t("clozeTest") || "Fill in the blank";
              }
              
              const userAnswer = answers[q.id];
              const isChecked = checkedQuestions[q.id] || false;

              return (
                <div 
                  key={q.id}
                  id={q.id}
                  ref={el => { questionRefs.current[q.id] = el }}
                  className="space-y-8 pb-8 border-b border-outline-variant/10 last:border-0"
                >
                  <div className="space-y-4 flex flex-col items-center text-center">
                     <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 bg-secondary/10 rounded-xl text-primary text-[10px] font-black uppercase tracking-widest">
                        {t("questionPrefix")} {idx + 1} • {
                          qType === "MULTIPLE_SELECT" ? t('multipleSelect') : 
                          qType === "MATCHING" ? t('matching') : 
                          qType === "CLOZE_TEST" ? t('clozeTest') :
                          qType === "TRUE_FALSE" ? t('trueFalse') :
                          t('multipleChoice')
                        }
                     </div>
                      {qType !== "MATCHING" && questionText && questionText !== "{}" && (
                        <div className="flex items-center justify-center gap-3 flex-wrap">
                          <h3 className="text-2xl md:text-3xl font-black text-on-surface leading-tight text-center">
                            {questionText}
                          </h3>
                          {q.audioUrl && (
                             <QuestionAudioPlayButton src={q.audioUrl} />
                          )}
                        </div>
                      )}
                  </div>

                  <div className="space-y-6 flex flex-col items-center">
                     {(qType === "MULTIPLE_CHOICE" || qType === "MULTIPLE_SELECT") && (
                       <div className="flex flex-wrap justify-center gap-4 w-full">
                         {(() => {
                           const blobShapes = [
                             "rounded-[2rem_3.5rem_2rem_4rem_/_3.5rem_2rem_4rem_2.5rem]",
                             "rounded-[3.5rem_2rem_4rem_2.5rem_/_2rem_3.5rem_2.5rem_4rem]",
                             "rounded-[2.5rem_4.5rem_3rem_4rem_/_4rem_3rem_4.5rem_2.5rem]",
                             "rounded-[4rem_2.5rem_4rem_3rem_/_2.5rem_4.5rem_3rem_4.5rem]",
                             "rounded-[3rem_4rem_2.5rem_4.5rem_/_4.5rem_2.5rem_4.5rem_3rem]",
                           ];
                           return (questionData.options || []).map((option: any, i: number) => {
                             const blobShape = blobShapes[i % blobShapes.length];
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
                               className={`px-6 py-4 ${blobShape} border-2 text-left font-bold transition-all duration-300 relative inline-flex items-center gap-4 ${borderClass} ${bgClass} ${textClass} ${isChecked ? 'cursor-default' : 'hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5'}`}
                             >
                               <div className={`w-6 h-6 flex items-center justify-center text-xs font-black shrink-0 transition-all shadow-sm ${isMultiSelect ? 'rounded-md border-2' : 'rounded-full'} ${!isSelected && isMultiSelect ? 'border-primary/20 bg-white/50 dark:bg-slate-800/50' : 'border-transparent'} ${iconClass}`}>
                                 {isMultiSelect ? (
                                    <Check className={`w-4 h-4 transition-all duration-300 ${isSelected ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`} strokeWidth={3.5} />
                                 ) : String.fromCharCode(65 + i)}
                               </div>
                               <span className="text-sm">{option.text}</span>
                               {isChecked && isCorrect && (
                                 <CheckCircle2 className="text-emerald-600 ml-2 w-5 h-5 stroke-[2px]" />
                               )}
                               {isChecked && isSelected && !isCorrect && (
                                 <XCircle className="text-rose-600 ml-2 w-5 h-5 stroke-[2px]" />
                               )}
                             </button>
                           );
                           });
                         })()}
                       </div>
                     )}

                     {qType === "TRUE_FALSE" && (
                        <div className="flex flex-row justify-center gap-3 sm:gap-6 py-4 w-full">
                          {(() => {
                            const blobShapes = [
                              "rounded-[2rem_3.5rem_2rem_4rem_/_3.5rem_2rem_4rem_2.5rem]",
                              "rounded-[3.5rem_2rem_4rem_2.5rem_/_2rem_3.5rem_2.5rem_4rem]",
                            ];
                            return [
                               { label: t("correct"), value: true },
                               { label: t("incorrect"), value: false }
                            ].map((opt, i) => {
                              const blobShape = blobShapes[i % blobShapes.length];
                              const isSelected = userAnswer === opt.value;
                              const isCorrect = questionData.isTrue === opt.value;
                              let borderClass = '';
                              let bgClass = '';
                              let textClass = '';
                              let iconClass = '';

                              if (opt.value) {
                                // True Button Default (Green)
                                borderClass = 'border-emerald-200 dark:border-emerald-800/50';
                                bgClass = 'bg-emerald-50/50 dark:bg-emerald-900/10';
                                textClass = 'text-emerald-700 dark:text-emerald-400';
                                iconClass = 'bg-emerald-100 text-emerald-600 dark:bg-emerald-800/50 dark:text-emerald-300';

                                if (isSelected) {
                                  borderClass = 'border-emerald-500';
                                  bgClass = 'bg-emerald-100 dark:bg-emerald-900/30';
                                  textClass = 'text-emerald-800 dark:text-emerald-300';
                                  iconClass = 'bg-emerald-500 text-white';
                                }
                              } else {
                                // False Button Default (Red)
                                borderClass = 'border-rose-200 dark:border-rose-800/50';
                                bgClass = 'bg-rose-50/50 dark:bg-rose-900/10';
                                textClass = 'text-rose-700 dark:text-rose-400';
                                iconClass = 'bg-rose-100 text-rose-600 dark:bg-rose-800/50 dark:text-rose-300';

                                if (isSelected) {
                                  borderClass = 'border-rose-500';
                                  bgClass = 'bg-rose-100 dark:bg-rose-900/30';
                                  textClass = 'text-rose-800 dark:text-rose-300';
                                  iconClass = 'bg-rose-500 text-white';
                                }
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
                                } else {
                                  // Dim unselected incorrect options
                                  borderClass = 'border-slate-200 dark:border-slate-800 opacity-50';
                                  bgClass = 'bg-slate-50 dark:bg-slate-900';
                                  textClass = 'text-slate-400';
                                  iconClass = 'bg-slate-100 text-slate-300';
                                }
                              }

                               return (
                                 <button
                                   key={i}
                                   disabled={isChecked}
                                   onClick={() => handleAnswerChange(q, opt.value)}
                                   className={`flex-1 sm:flex-none w-full sm:w-auto px-4 sm:px-8 py-4 sm:py-5 ${blobShape} border-2 font-bold transition-all duration-300 relative inline-flex items-center justify-center gap-2 sm:gap-3 ${borderClass} ${bgClass} ${textClass} ${isChecked ? 'cursor-default' : 'hover:-translate-y-1 hover:shadow-lg'}`}
                                 >
                                   <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 ${iconClass}`}>
                                     {opt.value ? <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3px]" /> : <X className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3px]" />}
                                   </div>
                                   <span className="text-sm sm:text-base tracking-wide whitespace-nowrap">{opt.label}</span>
                                   {isChecked && isSelected && !isCorrect && (
                                     <XCircle className="text-rose-600 ml-2 w-4 h-4 sm:w-5 sm:h-5 stroke-[2px]" />
                                   )}
                                   {isChecked && isCorrect && (
                                     <CheckCircle2 className="text-emerald-600 ml-2 w-4 h-4 sm:w-5 sm:h-5 stroke-[2px]" />
                                   )}
                                 </button>
                               );
                            });
                          })()}
                        </div>
                      )}

                      {qType === "MATCHING" && (
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start w-full min-h-0">
                          {/* Cột bên trái: Yêu cầu câu hỏi và media đính kèm */}
                          <div className="md:col-span-4 flex flex-col items-center md:items-start text-center md:text-left space-y-5 px-2">
                            {questionText && questionText !== "{}" && (
                              <div className="flex items-center gap-3 flex-wrap justify-center md:justify-start">
                                <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-on-surface leading-tight">
                                  {questionText}
                                </h3>
                                {q.audioUrl && (
                                  <QuestionAudioPlayButton src={q.audioUrl} />
                                )}
                              </div>
                            )}
                            {q.imageUrl && (
                              <div className="relative w-full max-w-[280px] aspect-[4/3] rounded-3xl overflow-hidden shadow-md border-4 border-white dark:border-slate-800 bg-white dark:bg-slate-900">
                                <img src={q.imageUrl} alt="Question media" className="w-full h-full object-cover" />
                              </div>
                            )}
                          </div>

                          {/* Cột bên phải: Khu vực làm bài nối cặp */}
                          <div className="md:col-span-8 w-full min-h-0">
                            <MatchingQuestionBlock 
                              q={q}
                              questionData={questionData}
                              userAnswer={userAnswer}
                              isChecked={isChecked}
                              handleAnswerChange={handleAnswerChange}
                              matchingColors={matchingColors}
                            />
                          </div>
                        </div>
                      )}

                      {qType === "CLOZE_TEST" && (
                        <ClozeTestQuestionBlock 
                          q={q}
                          questionData={questionData}
                          userAnswer={userAnswer}
                          isChecked={isChecked}
                          handleAnswerChange={handleAnswerChange}
                        />
                      )}

                      {/* Explanation Section — with language toggle */}
                      {isChecked && q.explanation && (
                        <div className="flex flex-col items-center mt-6 relative">
                          <button
                            onClick={() => setExpandedExplanations(prev => ({...prev, [q.id]: !prev[q.id]}))}
                            className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-500 hover:text-primary hover:border-primary transition-all duration-300 flex items-center justify-center shadow-sm z-10 group"
                          >
                            <ChevronDown className={`w-6 h-6 transition-transform duration-300 ${expandedExplanations[q.id] ? 'rotate-180' : ''}`} />
                            <div className="absolute -top-10 scale-0 group-hover:scale-100 transition-all bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap pointer-events-none shadow-xl border border-slate-700">
                              {t("viewExplanation")}
                              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45 border-r border-b border-slate-700"></div>
                            </div>
                          </button>
                          
                          {/* Animated Explanation Box with Lang Toggle */}
                          <div className={`w-full mx-auto overflow-hidden transition-all duration-500 ease-in-out ${expandedExplanations[q.id] ? 'max-h-[800px] opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'}`}>
                            <div className="pt-5 pb-2 px-1">
                              <React.Suspense
                                fallback={
                                  <ExplanationBlock
                                    questionId={q.id}
                                    explanation={q.explanation}
                                    explanationTranslations={null}
                                    isExpanded={!!expandedExplanations[q.id]}
                                    onToggleExpand={() => setExpandedExplanations(prev => ({...prev, [q.id]: !prev[q.id]}))}
                                  />
                                }
                              >
                                <ExplanationResolver
                                  promise={questionTranslationsPromise}
                                  questionId={q.id}
                                  explanation={q.explanation}
                                  isExpanded={!!expandedExplanations[q.id]}
                                  onToggleExpand={() => setExpandedExplanations(prev => ({...prev, [q.id]: !prev[q.id]}))}
                                />
                              </React.Suspense>
                            </div>
                          </div>

                        </div>
                      )}
                  {/* Next Question Button - mobile only */}
                  {idx < questions.length - 1 && (
                    <div className="md:hidden flex justify-center pt-4">
                      <button
                        onClick={() => {
                          const nextEl = document.getElementById(questions[idx + 1].id);
                          nextEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                        className="flex flex-col items-center gap-0.5 text-primary font-black text-sm uppercase tracking-widest active:opacity-70 transition-opacity"
                      >
                        Next
                        <ChevronDown className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                  </div>
                </div>
              )
            })}
            {/* Bottom Actions */}
            <div className="pt-8 md:pt-20 pb-24 md:pb-40 flex flex-col items-center gap-4">
                <div className="flex flex-col md:flex-row items-center gap-3 md:gap-6 w-full px-4 md:px-0 md:w-auto">
                  {isAllChecked ? (
                    <button
                      onClick={handleReset}
                      className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-3 md:px-10 md:py-4 bg-orange-500 text-white rounded-[2rem] font-black text-base md:text-lg tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-orange-500/20 uppercase italic"
                    >
                      {t("resetAll")}
                      <RotateCcw className="w-5 h-5 stroke-[2px]" />
                    </button>
                  ) : (
                    <button
                      onClick={handleCheckAll}
                      className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-3 md:px-10 md:py-4 bg-secondary text-white rounded-[2rem] font-black text-base md:text-lg tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-secondary/20 uppercase italic"
                    >
                      {t("checkAll")}
                      <CheckCircle className="w-5 h-5 stroke-[2px]" />
                    </button>
                  )}
                  
                  <button 
                      disabled
                      className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-3 md:px-10 md:py-4 bg-primary/20 text-primary/40 cursor-not-allowed rounded-[2rem] font-black text-base md:text-lg tracking-widest transition-all uppercase italic border-2 border-primary/10"
                  >
                      {t("submit")}
                      <Send className="w-5 h-5" />
                      <span className="bg-amber-500 text-white text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full">
                        {t("comingSoon")}
                      </span>
                  </button>
                </div>
                
                {/* Related Assignments Section moved below questions */}
                {relatedAssignmentsPromise && (
                  <div className="mt-12 pt-8 border-t border-outline-variant/10">
                    <React.Suspense fallback={<div className="p-6"><div className="h-40 bg-slate-200 dark:bg-slate-700 animate-pulse rounded-2xl w-full" /></div>}>
                      <RelatedAssignmentsConsumer 
                        promise={relatedAssignmentsPromise} 
                        isGuest={isGuest} 
                        onNavigate={handleSafeNavigate} 
                      />
                    </React.Suspense>
                  </div>
                )}
            </div>
          </div>

          {/* Footer removed/collapsed into main scroll area or bottom bar */}
        </div>
      </div>

      {/* Floating Toggle Button */}
      <React.Suspense fallback={null}>
        <SidePanelToggleButton promise={extraDataPromise} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      </React.Suspense>

      {/* Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sliding Right Column / Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full md:w-1/2 z-[110] bg-white dark:bg-slate-900 shadow-2xl transition-transform duration-500 ease-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <button 
          onClick={() => setIsSidebarOpen(false)} 
          className={`absolute top-6 right-6 md:right-full md:mr-0 z-50 p-2.5 text-white bg-primary hover:bg-primary/90 rounded-full shadow-lg shadow-primary/30 transition-all duration-500 hover:scale-110 active:scale-95 ${isSidebarOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-50 pointer-events-none'}`}
        >
          <X className="w-5 h-5" />
        </button>
        <React.Suspense fallback={<div className="p-8 space-y-8 animate-pulse"><div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg w-1/3"></div><div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-2xl w-full"></div></div>}>
          <AssignmentExtraDataConsumer promise={extraDataPromise} translationsPromise={assignmentTranslationsPromise} isGuest={isGuest} handleSafeNavigate={handleSafeNavigate} t={t} />
        </React.Suspense>
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
