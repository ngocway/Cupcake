"use client";

import React, { useState, useTransition, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  CheckCircle2,
  XCircle,
  MousePointer2,
  RotateCcw,
  CheckCircle,
  Volume2,
  VolumeX,
  Info,
  BookOpen,
  Star,
  MessageCircle,
  HelpCircle,
  ChevronDown,
  Bookmark,
  Play,
  Clock,
  User,
} from "lucide-react";

import { BookmarkButton } from "@/components/common/BookmarkButton";
import { LoginModal } from "@/components/LoginButton";
import { submitAssignmentReview } from "@/actions/reviews";
import { toast } from "sonner";
import { ReviewList } from "@/components/reviews/ReviewList";
import { InteractiveReadingContent } from "@/components/common/InteractiveReadingContent";
import { GlobalAudioPlayer } from "@/components/common/GlobalAudioPlayer";
import { SelectionTranslator } from "@/components/common/SelectionTranslator";
import { QuestionAudioPlayButton } from "@/components/common/QuestionAudioPlayButton";
import { FloatingTeacherInfo } from "@/app/student/_components/FloatingTeacherInfo";
import { RelatedAssignmentsSection } from "@/app/student/_components/RelatedAssignmentsSection";
import { ExplanationBlock } from "@/components/common/ExplanationBlock";
import { InstructionsBlock } from "@/components/common/InstructionsBlock";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { playCorrectSound, playIncorrectSound } from "@/utils/soundEffects";


// ============================================================
// HELPERS (duplicated from QuizClientRunner to avoid coupling)
// ============================================================

const getQuestionStatus = (q: any, answer: any) => {
  if (answer === undefined || answer === null) return "pending";
  let questionData: any;
  try {
    questionData = typeof q.content === "string" ? JSON.parse(q.content) : q.content;
  } catch {
    questionData = {};
  }
  const qType = questionData.type || q.type;

  if (qType === "MULTIPLE_CHOICE" || qType === "MULTIPLE_SELECT") {
    const options = questionData.options || [];
    if (qType === "MULTIPLE_SELECT") {
      const answersArray = Array.isArray(answer) ? answer : [];
      const correctIndices = options
        .map((opt: any, i: number) => (opt.isCorrect ? i : -1))
        .filter((i: number) => i !== -1);
      if (answersArray.length === 0) return "pending";
      if (answersArray.length !== correctIndices.length) return "incorrect";
      return answersArray.every((v: number) => correctIndices.includes(v)) ? "correct" : "incorrect";
    } else {
      const correctIndex = options.findIndex((opt: any) => opt.isCorrect);
      return answer === correctIndex ? "correct" : "incorrect";
    }
  }
  if (qType === "TRUE_FALSE") {
    return answer === questionData.isTrue ? "correct" : "incorrect";
  }
  if (qType === "CLOZE_TEST") {
    const textWithBlanks = questionData.textWithBlanks || questionData.questionText || "";
    const blanks = Array.from(textWithBlanks.matchAll(/\{\{(.*?)\}\}/g)).map((m: any) => m[1]);
    const userAnswer = answer || {};
    if (Object.keys(userAnswer).length === 0) return "pending";
    const isAllCorrect = blanks.every((expectedWord: string, idx: number) => {
      const userWord = (userAnswer[idx] || "").trim();
      return questionData.caseSensitive
        ? expectedWord === userWord
        : expectedWord.toLowerCase() === userWord.toLowerCase();
    });
    return isAllCorrect ? "correct" : "incorrect";
  }
  if (qType === "MATCHING") {
    const pairs = questionData.pairs || [];
    const userAnswer = answer || {};
    if (Object.keys(userAnswer).length === 0) return "pending";
    const isAllCorrect = pairs.every((p: any) => userAnswer[p.id] === p.rightText);
    return isAllCorrect ? "correct" : "incorrect";
  }
  return "pending";
};

const getYoutubeVideoId = (url: string | null) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

// ============================================================
// CLOZE TEST BLOCK (Kid/Teen style)
// ============================================================
function ClozeTestBlock({ q, questionData, userAnswer, isChecked, handleAnswerChange }: any) {
  const textWithBlanks = questionData.textWithBlanks || questionData.questionText || "";
  const parts = textWithBlanks.split(/(\{\{.*?\}\})/g);
  let blankIndex = 0;

  return (
    <div className="w-full p-6 bg-white border-2 border-slate-200 rounded-3xl text-xl lg:text-2xl font-medium text-slate-700 leading-[3.5rem] lg:leading-[4.5rem] shadow-inner">
      {parts.map((part: string, i: number) => {
        if (part.startsWith("{{") && part.endsWith("}}")) {
          const expectedWord = part.slice(2, -2);
          const currentIndex = blankIndex++;
          const userWord = (userAnswer || {})[currentIndex] || "";
          const isCorrect = questionData.caseSensitive
            ? expectedWord === userWord.trim()
            : expectedWord.toLowerCase() === userWord.trim().toLowerCase();

          let inputClass = "border-b-4 border-primary/60 bg-primary/5 text-primary font-bold focus:border-primary";
          if (isChecked) {
            inputClass = isCorrect
              ? "border-4 border-emerald-500 bg-emerald-50 text-emerald-700 font-bold rounded-xl"
              : "border-4 border-rose-500 bg-rose-50 text-rose-700 font-bold opacity-70 line-through rounded-xl";
          }
          const width = Math.max(userWord.length, isChecked && !isCorrect ? expectedWord.length : 5) * 1.2 + 2;

          return (
            <span key={i} className="inline-block relative mx-2 align-middle">
              <input
                type="text"
                disabled={isChecked}
                value={userWord}
                onChange={(e) => handleAnswerChange(q, { ...(userAnswer || {}), [currentIndex]: e.target.value })}
                className={`inline-block text-center outline-none transition-all px-3 py-1 min-w-[100px] disabled:opacity-100 disabled:cursor-not-allowed text-xl ${inputClass}`}
                style={{ width: `${width}ch` }}
                placeholder="..."
              />
              {isChecked && !isCorrect && (
                <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-bold rounded-xl border border-emerald-200 shadow-md whitespace-nowrap z-30">
                  {expectedWord}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-emerald-100 rotate-45 border-r border-b border-emerald-200" />
                </span>
              )}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
}

// ============================================================
// MATCHING BLOCK (Kid/Teen style)
// ============================================================
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
      .map((p: any) => p.rightText)
      .sort(() => (seed.length % 2 === 0 ? 1 : -1) * 0.5 - Math.random());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.id, JSON.stringify(questionData.pairs)]);

  const getDotCoords = (id: string, side: "left" | "right") => {
    const el = document.getElementById(`kid-dot-${side}-${q.id}-${id}`);
    if (!el || !containerRef.current) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    return { x: rect.left - containerRect.left + rect.width / 2, y: rect.top - containerRect.top + rect.height / 2 };
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
            const dot = target?.closest('[id^="kid-dot-"]');
            if (dot) {
              const id = dot.id.replace('-wrapper', '');
              if (dragging.fromSide === 'left' && id.includes('kid-dot-right-')) {
                const idx = parseInt(id.split('-').pop()!);
                if (!isNaN(idx) && shuffledRightItems[idx] !== undefined)
                  handleAnswerChange(q, { leftId: dragging.fromId, rightText: shuffledRightItems[idx] });
              } else if (dragging.fromSide === 'right' && id.includes('kid-dot-left-')) {
                const pairId = id.replace(`kid-dot-left-${q.id}-`, '');
                handleAnswerChange(q, { leftId: pairId, rightText: shuffledRightItems[parseInt(dragging.fromId)] });
              }
            }
          }
          setDragging(null);
        }}
        onPointerCancel={() => setDragging(null)}
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ minHeight: "300px" }}>
          {Object.entries(userAnswer || {}).map(([leftId, rightText], idx) => {
            const pair = questionData.pairs.find((p: any) => p.id === leftId);
            if (!pair) return null;
            const isCorrect = isChecked && pair.rightText === rightText;
            const coords1 = getDotCoords(leftId, "left");
            const rightItemIdx = shuffledRightItems.indexOf(rightText as string);
            if (rightItemIdx === -1) return null;
            const coords2 = getDotCoords(rightItemIdx.toString(), "right");
            let strokeColor = matchingColors[idx % matchingColors.length];
            if (isChecked) strokeColor = isCorrect ? "#10B981" : "#EF4444";
            return (
              <g
                key={`kid-${leftId}`}
                onMouseEnter={(e) => isChecked && setHoveredLine({ 
                  x: e.clientX, 
                  y: e.clientY, 
                  isCorrect, 
                  content: isCorrect ? t("correct") : t("yourIncorrectMatch", { defaultMessage: "Lựa chọn của em (Sai)" }) 
                })}
                onMouseLeave={() => setHoveredLine(null)}
              >
                {/* Vùng vô hình mở rộng để dễ hover */}
                <line x1={coords1.x} y1={coords1.y} x2={coords2.x} y2={coords2.y} stroke="transparent" strokeWidth="25" className="cursor-help pointer-events-auto" />
                <line
                  x1={coords1.x}
                  y1={coords1.y}
                  x2={coords2.x}
                  y2={coords2.y}
                  stroke={strokeColor}
                  strokeWidth={isChecked ? (isCorrect ? "6" : "5") : "4"}
                  strokeDasharray="none"
                  opacity={isChecked && isCorrect ? "1" : "0.9"}
                  className="transition-all duration-500 pointer-events-none"
                />
                
                {/* Đáp án đúng của hệ thống (nét đứt mờ, chỉ hiện khi học sinh làm sai) */}
                {isChecked && !isCorrect && (() => {
                  const correctIdx = shuffledRightItems.indexOf(pair.rightText);
                  if (correctIdx === -1) return null;
                  const correctCoords = getDotCoords(correctIdx.toString(), "right");
                  return (
                    <g
                      onMouseEnter={(e) => setHoveredLine({ 
                        x: e.clientX, 
                        y: e.clientY, 
                        isCorrect: true, 
                        content: t("correctAnswer", { defaultMessage: "Đáp án đúng" }) 
                      })}
                      onMouseLeave={() => setHoveredLine(null)}
                      className="cursor-help pointer-events-auto"
                    >
                      <line x1={coords1.x} y1={coords1.y} x2={correctCoords.x} y2={correctCoords.y} stroke="transparent" strokeWidth="20" />
                      <line
                        x1={coords1.x}
                        y1={coords1.y}
                        x2={correctCoords.x}
                        y2={correctCoords.y}
                        stroke="#10B981"
                        strokeWidth="4"
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
          {dragging && <line x1={dragging.x1} y1={dragging.y1} x2={dragging.x2} y2={dragging.y2} stroke="#3B82F6" strokeWidth="5" />}
        </svg>

        {/* CSS Animation cho nét đứt chạy rần rần */}
        <style dangerouslySetInnerHTML={{ __html: "\n          @keyframes dash {\n            to {\n              stroke-dashoffset: -10;\n            }\n          }\n        " }} />
        {hoveredLine && (
          <div className="fixed z-[100] px-4 py-2 rounded-2xl bg-slate-900 text-white text-xs font-bold pointer-events-none shadow-xl -translate-x-1/2 -translate-y-full mb-4" style={{ left: hoveredLine.x, top: hoveredLine.y }}>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${hoveredLine.isCorrect ? "bg-emerald-400" : "bg-rose-400"}`} />
              {hoveredLine.content}
            </div>
          </div>
        )}
        <div className="flex flex-col justify-between gap-3 z-20">

          {(questionData.pairs || []).map((pair: any, idx: number) => {
            const pairedRightText = userAnswer?.[pair.id];
            const leftIsImage = !!(pair.leftImageUrl || pair.leftText?.startsWith("http") || pair.leftText?.startsWith("/"));
            const isSelected = selectedLeftId === pair.id;
            return (
              <div key={pair.id || idx} className="relative transition-all" style={leftIsImage && idx % 2 === 1 ? { marginTop: '-10%', zIndex: idx + 1 } : { zIndex: idx + 1 }}>
                {leftIsImage ? (
                  <div
                    className={`relative cursor-pointer rounded-2xl p-1 border-2 transition-all ${
                      isSelected 
                        ? 'border-purple-500 ring-2 ring-purple-200 bg-purple-50/50' 
                        : pairedRightText 
                          ? 'border-purple-400' 
                          : 'border-transparent hover:border-slate-200'
                    }`}
                    style={{ width: '40%', marginLeft: idx % 2 === 0 ? '0' : 'auto' }}
                    onClick={() => {
                      if (isChecked) return;
                      setSelectedLeftId(isSelected ? null : pair.id);
                    }}
                  >
                    <img src={pair.leftImageUrl || pair.leftText} alt="" className="w-full aspect-[4/3] object-cover rounded-[5px] block" />
                    <div
                      id={`kid-dot-left-${q.id}-${pair.id}-wrapper`}
                      onPointerDown={(e) => {
                        if (isChecked) return;
                        e.stopPropagation();
                        e.currentTarget.setPointerCapture(e.pointerId);
                        const coords = getDotCoords(pair.id, "left");
                        setDragging({ fromId: pair.id, fromSide: "left", x1: coords.x, y1: coords.y, x2: coords.x, y2: coords.y, pointerId: e.pointerId });
                      }}
                      onPointerUp={(e) => {
                        try {
                          e.currentTarget.releasePointerCapture(e.pointerId);
                        } catch (err) {}
                      }}
                      className="absolute -right-6 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center z-30 cursor-crosshair touch-none"
                    >
                      <div
                        id={`kid-dot-left-${q.id}-${pair.id}`}
                        className={`w-6 h-6 rounded-full border-4 border-white shadow-md transition-transform hover:scale-150 ${pairedRightText ? "bg-purple-500" : "bg-slate-300 hover:bg-purple-400"}`}
                      />
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => {
                      if (isChecked) return;
                      setSelectedLeftId(isSelected ? null : pair.id);
                    }}
                    className={`relative flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-purple-500 ring-2 ring-purple-200 bg-purple-50/50' 
                        : pairedRightText 
                          ? 'border-purple-400 bg-purple-50' 
                          : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span className="font-bold text-slate-700">{pair.leftText}</span>
                    <div
                      id={`kid-dot-left-${q.id}-${pair.id}-wrapper`}
                      onPointerDown={(e) => {
                        if (isChecked) return;
                        e.stopPropagation();
                        e.currentTarget.setPointerCapture(e.pointerId);
                        const coords = getDotCoords(pair.id, "left");
                        setDragging({ fromId: pair.id, fromSide: "left", x1: coords.x, y1: coords.y, x2: coords.x, y2: coords.y, pointerId: e.pointerId });
                      }}
                      onPointerUp={(e) => {
                        try {
                          e.currentTarget.releasePointerCapture(e.pointerId);
                        } catch (err) {}
                      }}
                      className="absolute -right-6 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center z-30 cursor-crosshair touch-none"
                    >
                      <div
                        id={`kid-dot-left-${q.id}-${pair.id}`}
                        className={`w-6 h-6 rounded-full border-4 border-white shadow-md transition-transform hover:scale-150 ${pairedRightText ? "bg-purple-500" : "bg-slate-300 hover:bg-purple-400"}`}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-col justify-between gap-3 z-20">

          {shuffledRightItems.map((rightText: string, idx: number) => {
            const pairedLeftId = Object.keys(userAnswer || {}).find((k) => userAnswer[k] === rightText);
            const isPairCorrect = isChecked && pairedLeftId && questionData.pairs.find((p: any) => p.id === pairedLeftId)?.rightText === rightText;
            const rightIsImage = !!(rightText?.startsWith("http") || rightText?.startsWith("/"));
            const isSelectedPartner = selectedLeftId === pairedLeftId;
            return (
              <div key={idx} className="relative transition-all" style={rightIsImage && idx % 2 === 1 ? { marginTop: '-10%', zIndex: idx + 1 } : { zIndex: idx + 1 }}>
                {rightIsImage ? (
                  <div
                    className={`relative cursor-pointer rounded-2xl p-1 border-2 transition-all ${
                      isSelectedPartner 
                        ? 'border-purple-500 ring-2 ring-purple-200 bg-purple-50/50' 
                        : pairedLeftId 
                          ? 'border-purple-400' 
                          : 'border-transparent hover:border-slate-200'
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
                      id={`kid-dot-right-${q.id}-${idx}-wrapper`}
                      onPointerDown={(e) => {
                        if (isChecked) return;
                        e.stopPropagation();
                        e.currentTarget.setPointerCapture(e.pointerId);
                        const rect = containerRef.current!.getBoundingClientRect();
                        if (pairedLeftId) {
                          const coords = getDotCoords(pairedLeftId, "left");
                          setDragging({ fromId: pairedLeftId, fromSide: "left", x1: coords.x, y1: coords.y, x2: e.clientX - rect.left, y2: e.clientY - rect.top, pointerId: e.pointerId });
                        } else {
                          const coords = getDotCoords(idx.toString(), "right");
                          setDragging({ fromId: idx.toString(), fromSide: "right", x1: coords.x, y1: coords.y, x2: coords.x, y2: coords.y, pointerId: e.pointerId });
                        }
                      }}
                      onPointerUp={(e) => {
                        try {
                          e.currentTarget.releasePointerCapture(e.pointerId);
                        } catch (err) {}
                      }}
                      className="absolute -left-6 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center z-30 cursor-crosshair touch-none"
                    >
                      <div
                        id={`kid-dot-right-${q.id}-${idx}`}
                        className={`w-6 h-6 rounded-full border-4 border-white shadow-md transition-transform hover:scale-150 ${pairedLeftId ? "bg-purple-500" : "bg-slate-300 hover:bg-purple-400"}`}
                      />
                    </div>
                    <img src={rightText} alt="" className="w-full aspect-[4/3] object-cover rounded-[5px] block" />
                    {isChecked && pairedLeftId && (
                      <div className="absolute top-2 right-2">{isPairCorrect ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <XCircle className="w-6 h-6 text-rose-500" />}</div>
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
                    className={`relative flex items-center p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      isSelectedPartner 
                        ? 'border-purple-500 ring-2 ring-purple-200 bg-purple-50/50' 
                        : pairedLeftId 
                          ? 'border-purple-400 bg-purple-50' 
                          : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div
                      id={`kid-dot-right-${q.id}-${idx}-wrapper`}
                      onPointerDown={(e) => {
                        if (isChecked) return;
                        e.stopPropagation();
                        e.currentTarget.setPointerCapture(e.pointerId);
                        const rect = containerRef.current!.getBoundingClientRect();
                        if (pairedLeftId) {
                          const coords = getDotCoords(pairedLeftId, "left");
                          setDragging({ fromId: pairedLeftId, fromSide: "left", x1: coords.x, y1: coords.y, x2: e.clientX - rect.left, y2: e.clientY - rect.top, pointerId: e.pointerId });
                        } else {
                          const coords = getDotCoords(idx.toString(), "right");
                          setDragging({ fromId: idx.toString(), fromSide: "right", x1: coords.x, y1: coords.y, x2: coords.x, y2: coords.y, pointerId: e.pointerId });
                        }
                      }}
                      onPointerUp={(e) => {
                        try {
                          e.currentTarget.releasePointerCapture(e.pointerId);
                        } catch (err) {}
                      }}
                      className="absolute -left-6 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center z-30 cursor-crosshair touch-none"
                    >
                      <div
                        id={`kid-dot-right-${q.id}-${idx}`}
                        className={`w-6 h-6 rounded-full border-4 border-white shadow-md transition-transform hover:scale-150 ${pairedLeftId ? "bg-purple-500" : "bg-slate-300 hover:bg-purple-400"}`}
                      />
                    </div>
                    <span className="font-bold text-slate-700">{rightText}</span>
                    {isChecked && pairedLeftId && (
                      <div className="ml-auto">{isPairCorrect ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <XCircle className="w-6 h-6 text-rose-500" />}</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bảng chú giải (Legend) */}
      {isChecked && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-8 px-6 py-3 bg-white/90 backdrop-blur-md rounded-2xl border-2 border-slate-200 shadow-sm mx-auto w-fit">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-1.5 bg-emerald-500 rounded-full"></div>
            <span className="text-sm font-bold text-slate-700">{t("yourCorrectMatch", { defaultMessage: "Lựa chọn đúng" })}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-1.5 bg-rose-500 rounded-full"></div>
            <span className="text-sm font-bold text-slate-700">{t("yourIncorrectMatch", { defaultMessage: "Lựa chọn sai" })}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 border-t-[4px] border-dashed border-emerald-500"></div>
            <span className="text-sm font-bold text-slate-700">{t("correctAnswer", { defaultMessage: "Đáp án đúng" })}</span>
          </div>
        </div>
      )}

    </div>
  );
}

// ============================================================
// OPTION COLOR PALETTE (per option index)
// ============================================================
const OPTION_COLORS = [
  { base: "border-blue-200 bg-blue-50 text-blue-800 hover:border-blue-400 hover:bg-blue-100", label: "bg-blue-500 text-white" },
  { base: "border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-400 hover:bg-emerald-100", label: "bg-emerald-500 text-white" },
  { base: "border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-400 hover:bg-amber-100", label: "bg-amber-500 text-white" },
  { base: "border-purple-200 bg-purple-50 text-purple-800 hover:border-purple-400 hover:bg-purple-100", label: "bg-purple-500 text-white" },
  { base: "border-rose-200 bg-rose-50 text-rose-800 hover:border-rose-400 hover:bg-rose-100", label: "bg-rose-500 text-white" },
];

const SIDE_PANEL_W = 400;

// ============================================================
// PROPS
// ============================================================
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
  hideHeader,
}: {
  promise: Promise<Record<string, any>> | undefined;
  questionId: string;
  explanation: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  hideHeader?: boolean;
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
      hideHeader={hideHeader}
    />
  );
}

function GlobalTeacherInfoConsumer({ promise, handleSafeNavigate }: any) {
  const extraData = React.use(promise) as any;
  if (!extraData || !extraData.teacher) return null;
  return <FloatingTeacherInfo teacher={extraData.teacher} onNavigate={handleSafeNavigate} />;
}

function StartScreenTeacherAvatar({ promise }: { promise: Promise<any> }) {
  const extraData = React.use(promise) as any;
  if (!extraData || !extraData.teacher) return null;
  const teacher = extraData.teacher;
  if (!teacher.isPortfolioPublished) return null;

  return (
    <div className="w-20 h-20 rounded-full border-4 border-white dark:border-slate-800 shadow-md overflow-hidden bg-white shrink-0">
      {teacher.image ? (
        <img src={teacher.image} alt={teacher.name || ""} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
          <User className="w-8 h-8" />
        </div>
      )}
    </div>
  );
}

function ExtraDataConsumer({ promise, translationsPromise, isGuest, t }: any) {
  const extraData = React.use(promise) as any;
  const instructionsTranslations = translationsPromise ? React.use(translationsPromise) as any : null;
  if (!extraData) return null;

  const videoUrl = extraData.lesson?.videoUrl || extraData.videoUrl;
  const audioUrl = extraData.lesson?.audioUrl || extraData.audioUrl;
  const youtubeId = getYoutubeVideoId(videoUrl);

  const hasMaterialSection = videoUrl || audioUrl || extraData.readingText;
  const hasInstructionText = !!extraData.instructions || !!extraData.instructionsImageUrl;

  return (
    <>
      {hasMaterialSection && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest">
            <BookOpen className="w-4 h-4" />
            {t("studyMaterial")}
          </div>
          <div className="space-y-6">
            {videoUrl && (
              <div className="aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-lg">
                {youtubeId ? (
                  <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${youtubeId}?rel=0`} title="Video" allowFullScreen />
                ) : (
                  <video src={videoUrl} className="w-full h-full" controls />
                )}
              </div>
            )}
             {audioUrl && (
               <GlobalAudioPlayer audioUrl={audioUrl} autoPlay={false} defaultPlaybackRate={extraData.ttsSpeed || 1.0} />
             )}
             <div className="prose prose-slate prose-lg max-w-none text-slate-700 text-lg leading-loose">
               <InteractiveReadingContent html={extraData.readingText} isLoggedIn={!isGuest} playbackRate={extraData.ttsSpeed || 1.0} />
             </div>
          </div>
        </div>
      )}

      {hasInstructionText && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-secondary font-black text-xs uppercase tracking-widest">
            <Info className="w-4 h-4" />
            {t("instructions")}
          </div>
          <InstructionsBlock
            instructions={extraData.instructions}
            instructionsTranslations={instructionsTranslations}
            instructionsImageUrl={extraData.instructionsImageUrl}
            isLoggedIn={!isGuest}
            proseClassName="prose prose-slate max-w-none bg-secondary/5 p-4 rounded-2xl border border-secondary/10"
          />
        </div>
      )}

      {extraData.tags && (
        <div className="flex flex-wrap gap-2">
          {extraData.tags.split(",").map((tag: string) => tag.trim()).filter(Boolean).map((tag: string, i: number) => (
            <Link key={i} href={`/tags/${encodeURIComponent(tag)}`} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-200 transition-all">
              #{tag}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

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

function SidePanelToggleButton({ promise, isSidePanelOpen, setIsSidePanelOpen }: { promise: Promise<any>, isSidePanelOpen: boolean, setIsSidePanelOpen: (open: boolean) => void }) {
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
      onClick={() => setIsSidePanelOpen(true)}
      className={`flex items-center justify-center p-2 bg-white text-purple-600 rounded-full border-2 border-purple-100 hover:bg-purple-50 hover:border-purple-300 transition-all active:scale-95 shadow-sm hover:scale-105 duration-200
        ${isSidePanelOpen ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}`}
      title="View lesson"
    >
      <BookOpen className="w-5 h-5 text-purple-500" />
    </button>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function KidTeenQuizRunner({
  assignment,
  submissionId,
  questions,
  initialAnswers,
  extraDataPromise,
  relatedAssignmentsPromise,
  questionTranslationsPromise,
  assignmentTranslationsPromise,
  isGuest = false,
}: Props) {
  const t = useTranslations("student.quiz");
  const router = useRouter();
  const [, startTransition] = useTransition();

  // ── Music references ─────────────────────────────────────
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const isMutedRef = useRef(isMuted);
  const autoReadAudioRef = useRef<HTMLAudioElement | null>(null);
  const segmentsRef = useRef<any[]>([]);
  const currentSegmentIndexRef = useRef<number>(0);
  const preloadedUrlsRef = useRef<string[]>([]);
  const preloadRequestIdRef = useRef<number>(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [isHintPlaying, setIsHintPlaying] = useState(false);
  const [isTtsPlaying, setIsTtsPlaying] = useState(false);
  const [quizMode, setQuizMode] = useState<"practice" | "autoplay">("practice");
  const isAutoReadEnabled = quizMode === "autoplay";
  const [autoplayCountdown, setAutoplayCountdown] = useState<number | null>(null);
  const [nextQuestionCountdown, setNextQuestionCountdown] = useState<number | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const handleStartQuiz = (mode: "practice" | "autoplay") => {
    setQuizMode(mode);
    setHasStarted(true);
    if (bgMusicRef.current && !isMuted) {
      bgMusicRef.current.play().catch((e) => console.error("Error playing background music on start click", e));
    }
  };

  // ── Background Music ─────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;

    const bgMusic = new Audio("/sounds/bg-music.mp3?v=2");
    bgMusic.loop = true;
    bgMusic.volume = isMuted ? 0 : 0.2;
    bgMusicRef.current = bgMusic;

    const playMusic = () => {
      if (!isMutedRef.current) {
        bgMusic.play().catch(() => {});
      }
      window.removeEventListener("click", playMusic);
      window.removeEventListener("touchstart", playMusic);
      window.removeEventListener("mousedown", playMusic);
      window.removeEventListener("keydown", playMusic);
    };

    bgMusic.play().catch(() => {
      window.addEventListener("click", playMusic);
      window.addEventListener("touchstart", playMusic);
      window.addEventListener("mousedown", playMusic);
      window.addEventListener("keydown", playMusic);
    });

    return () => {
      bgMusic.pause();
      bgMusic.src = "";
      bgMusicRef.current = null;
      window.removeEventListener("click", playMusic);
      window.removeEventListener("touchstart", playMusic);
      window.removeEventListener("mousedown", playMusic);
      window.removeEventListener("keydown", playMusic);
    };
  }, []);

  // Listen to Hint audio play/pause events to track if hint is playing
  useEffect(() => {
    const handleHintPlay = () => {
      setIsHintPlaying(true);
    };

    const handleHintPause = () => {
      setIsHintPlaying(false);
    };

    window.addEventListener('hintAudioPlay', handleHintPlay);
    window.addEventListener('hintAudioPause', handleHintPause);

    return () => {
      window.removeEventListener('hintAudioPlay', handleHintPlay);
      window.removeEventListener('hintAudioPause', handleHintPause);
    };
  }, []);

  // Update volume when mute state changes, hint audio state changes, or TTS playing state changes
  useEffect(() => {
    if (bgMusicRef.current) {
      if (isMuted) {
        bgMusicRef.current.pause();
        window.dispatchEvent(new CustomEvent('pauseAllAudio'));
      } else {
        bgMusicRef.current.play().catch(() => {});
        bgMusicRef.current.volume = (isHintPlaying || isTtsPlaying) ? 0.05 : 0.2;
      }
    }
  }, [isMuted, isHintPlaying, isTtsPlaying]);

  // Update background music playback based on material audio
  useEffect(() => {
    const handleMaterialPlay = () => {
      if (bgMusicRef.current) {
        bgMusicRef.current.pause();
      }
    };

    const handleMaterialPause = () => {
      if (bgMusicRef.current && !isMuted) {
        bgMusicRef.current.play().catch(() => {});
      }
    };

    window.addEventListener('materialAudioPlay', handleMaterialPlay);
    window.addEventListener('materialAudioPause', handleMaterialPause);

    return () => {
      window.removeEventListener('materialAudioPlay', handleMaterialPlay);
      window.removeEventListener('materialAudioPause', handleMaterialPause);
    };
  }, [isMuted]);



  // ── Core quiz state ──────────────────────────────────────
  const [answers, setAnswers] = useState(initialAnswers);
  const [checkedQuestions, setCheckedQuestions] = useState<Record<string, boolean>>({});
  const [expandedExplanations, setExpandedExplanations] = useState<Record<string, boolean>>({});

  // ── Kid/Teen navigation state ────────────────────────────
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("right");
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isAutoRevealing, setIsAutoRevealing] = useState(false);
  const [scoreResult, setScoreResult] = useState<{ correct: number; total: number } | null>(null);
  const [isShowingResultScreen, setIsShowingResultScreen] = useState(false);

  // ── Review state ─────────────────────────────────────────
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [userReview, setUserReview] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [hoverRating, setHoverRating] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Warm up the Edge TTS API route in the background on mount
  useEffect(() => {
    fetch("/api/tts/edge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "warmup" }),
    }).catch(() => {});
  }, []);

  // ── Nav guard ────────────────────────────────────────────
  const [navGuard, setNavGuard] = useState<{ isOpen: boolean; targetUrl: string; targetTitle: string }>({
    isOpen: false,
    targetUrl: "",
    targetTitle: "",
  });

  const matchingColors = ["#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#3B82F6", "#EC4899"];

  // ── Media ────────────────────────────────────────────────
  const videoUrl = assignment.videoUrl || assignment.lesson?.videoUrl;
  const audioUrl = assignment.audioUrl || assignment.lesson?.audioUrl;
  const youtubeId = getYoutubeVideoId(videoUrl);

  const hasMaterialSection = useMemo(() => {
    if (videoUrl || audioUrl) return true;
    if (assignment?.readingText) {
      const clean = String(assignment.readingText).replace(/<[^>]*>/g, "").trim();
      if (clean.length > 0) return true;
      if (/<(img|video|audio|iframe|embed)\b/i.test(String(assignment.readingText))) return true;
    }
    return false;
  }, [assignment?.readingText, videoUrl, audioUrl]);

  const hasInstructionText = useMemo(() => {
    if (!assignment?.instructions) return false;
    const clean = String(assignment.instructions).replace(/<[^>]*>/g, "").trim();
    if (clean.length > 0) return true;
    return /<(img|video|audio|iframe|embed)\b/i.test(String(assignment.instructions));
  }, [assignment?.instructions]);

  // ── Computed ─────────────────────────────────────────────
  const isDirty = Object.keys(answers).length > 0;

  const isAllChecked = useMemo(
    () => questions.length > 0 && questions.every((q) => checkedQuestions[q.id]),
    [questions, checkedQuestions]
  );

  const allCompleted = useMemo(
    () =>
      questions.every((q) => {
        const ans = answers[q.id];
        return ans !== undefined && ans !== null && (typeof ans === "object" ? Object.keys(ans).length > 0 : true);
      }),
    [questions, answers]
  );

  // ── Before-unload guard ──────────────────────────────────
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // ── Navigation helpers ───────────────────────────────────
  const handleSafeNavigate = (href: string, title?: string) => {
    if (isDirty) {
      setNavGuard({ isOpen: true, targetUrl: href, targetTitle: title || "..." });
    } else {
      router.push(href);
    }
  };

  const navigateTo = (newIndex: number) => {
    if (newIndex === currentIndex && !isShowingResultScreen) return;
    if (isAutoRevealing) return;
    if (isShowingResultScreen) setIsShowingResultScreen(false);

    setAutoplayCountdown(null);
    setNextQuestionCountdown(null);
    setIsAnswerRevealed(false);

    setSlideDirection(newIndex > currentIndex ? "left" : "right");
    setCurrentIndex(newIndex);
  };

  // ── Answer change ────────────────────────────────────────
  const handleAnswerChange = (q: any, value: any) => {
    if (checkedQuestions[q.id]) return;

    if (typeof window !== "undefined" && !isMuted) {
      const snd = new Audio("/sounds/click.wav");
      snd.play().catch(() => {});
    }

    let questionData: any;
    try { questionData = JSON.parse(q.content); } catch { questionData = {}; }
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
          Object.keys(m).forEach((k) => { if (m[k] === value.rightText) delete m[k]; });
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

  // ── Check all (auto-reveal) ──────────────────────────────
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

    // Scroll to top so the student can watch the progress map circles change status/color
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    const newChecked: Record<string, boolean> = {};
    const newExpanded: Record<string, boolean> = {};
    let currentRevealIndex = 0;

    const revealInterval = setInterval(() => {
      if (currentRevealIndex >= questions.length) {
        clearInterval(revealInterval);
        
        const correct = questions.filter((q) => getQuestionStatus(q, answers[q.id]) === "correct").length;
        setScoreResult({ correct, total: questions.length });

        // Wait a brief moment after the last question is revealed before popping up the result screen
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
      if (!isMuted) {
        if (isCorrect) {
          playCorrectSound();
        } else {
          playIncorrectSound();
        }
      }

      if (!isCorrect && q.explanation) {
        newExpanded[q.id] = true;
      }

      // Update state incrementally to trigger re-renders
      setCheckedQuestions({ ...newChecked });
      setExpandedExplanations({ ...newExpanded });
      
      currentRevealIndex++;
    }, 400); // 400ms delay per question
  };

  // ── Reset ────────────────────────────────────────────────
  const handleReset = () => {
    setAnswers({});
    setCheckedQuestions({});
    setExpandedExplanations({});
    setCurrentIndex(0);
    setSlideDirection("right");
    setScoreResult(null);
    setIsSidePanelOpen(false);
    setIsShowingResultScreen(false);
  };

  // ── Review submit ────────────────────────────────────────
  const handleReviewSubmit = async () => {
    if (reviewRating === 0) { toast.error(t("starRatingError")); return; }
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
    } catch {
      toast.error(t("reviewSubmitError"));
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // ── Current question data ────────────────────────────────
  const currentQuestion = questions[currentIndex];
  let currentQuestionData: any;
  try { currentQuestionData = JSON.parse(currentQuestion?.content || "{}"); }
  catch { currentQuestionData = { questionText: currentQuestion?.content }; }

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

  // ── Autoplay Mode logic ──────────────────────────────────
  useEffect(() => {
    if (quizMode !== "autoplay" || autoplayCountdown === null) return;

    if (autoplayCountdown > 0) {
      const timer = setTimeout(() => {
        setAutoplayCountdown(autoplayCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Countdown reached 0: Reveal the correct answer!
      setCheckedQuestions((prev) => ({ ...prev, [currentQuestion?.id]: true }));
      setIsAnswerRevealed(true);
      setNextQuestionCountdown(5);
    }
  }, [autoplayCountdown, quizMode, currentQuestion?.id]);

  useEffect(() => {
    if (quizMode !== "autoplay" || nextQuestionCountdown === null) return;

    if (nextQuestionCountdown > 0) {
      const timer = setTimeout(() => {
        setNextQuestionCountdown(nextQuestionCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Transition countdown reached 0: Go to next question!
      setNextQuestionCountdown(null);
      setIsAnswerRevealed(false);
      if (currentIndex < questions.length - 1) {
        navigateTo(currentIndex + 1);
      }
    }
  }, [nextQuestionCountdown, quizMode, currentIndex, questions.length]);

  // ── Auto-Read text clean and builder ──────────────────────
  // ── Auto-Read text clean and builder ──────────────────────
  const cleanTextForTTS = (text: string) => {
    if (!text) return "";
    return text
      .replace(/\s+/g, " ")             // Collapse multiple spaces
      .trim();
  };

  const getQuestionSpeed = () => {
    const audiences = assignment.targetAudiences || [];
    const lessonAudiences = assignment.lesson?.targetAudiences || [];
    const combined = [...audiences, ...lessonAudiences];
    const isLearner = combined.some(aud => String(aud).toLowerCase() === "learner");
    return isLearner ? 1.0 : 0.6;
  };

  interface AudioSegment {
    type: 'tts' | 'sound';
    text?: string;
    src?: string;
  }

  const buildAutoReadSegments = (question: any) => {
    const list: AudioSegment[] = [];
    if (!question) return list;
    
    let questionData: any;
    try {
      questionData = typeof question.content === "string" 
        ? JSON.parse(question.content) 
        : question.content;
    } catch {
      questionData = {};
    }
    const qType = questionData.type || question.type;

    let textStr =
      questionData.instruction ??
      questionData.questionText ??
      questionData.statement ??
      questionData.textWithBlanks ??
      question.content;
      
    if (textStr?.startsWith("{") && textStr?.endsWith("}")) textStr = "";
    if (qType === "CLOZE_TEST" && textStr && textStr.includes("{{")) {
      textStr = questionData.instruction || t("clozeTest") || "Fill in the blank";
    }

    if (!textStr) return list;

    // Check if the text contains a blank (e.g. ______ or {{...}})
    const hasBlank = /_+/.test(textStr) || /\{\{.*?\}\}/.test(textStr);

    if (hasBlank) {
      // Split the text by blank placeholders
      const parts = textStr.split(/_+|\{\{.*?\}\}/g);
      
      parts.forEach((part: string, idx: number) => {
        const cleanPart = cleanTextForTTS(part);
        if (cleanPart) {
          // If this is the last part, append options to it
          if (idx === parts.length - 1) {
            let lastPartWithChoices = cleanPart;
            if (qType === "MULTIPLE_CHOICE" || qType === "MULTIPLE_SELECT") {
              const options = questionData.options || [];
              options.forEach((opt: any, index: number) => {
                const letter = String.fromCharCode(65 + index);
                const optionText = cleanTextForTTS(opt.text);
                if (optionText) {
                  lastPartWithChoices += `, ${letter}. ${optionText}`;
                }
              });
            } else if (qType === "TRUE_FALSE") {
              lastPartWithChoices += `, A. True, B. False`;
            }
            list.push({ type: 'tts', text: lastPartWithChoices });
          } else {
            list.push({ type: 'tts', text: cleanPart });
          }
        }
        
        // Add chime sound if not the last part
        if (idx < parts.length - 1) {
          list.push({ type: 'sound', src: "/sounds/ting_chime.wav" });
        }
      });
    } else {
      let combinedText = cleanTextForTTS(textStr);
      if (qType === "MULTIPLE_CHOICE" || qType === "MULTIPLE_SELECT") {
        const options = questionData.options || [];
        options.forEach((opt: any, index: number) => {
          const letter = String.fromCharCode(65 + index);
          const optionText = cleanTextForTTS(opt.text);
          if (optionText) {
            combinedText += `, ${letter}. ${optionText}`;
          }
        });
      } else if (qType === "TRUE_FALSE") {
        combinedText += `, A. True, B. False`;
      }
      list.push({ type: 'tts', text: combinedText });
    }

    return list;
  };

  const revokePreloadedUrls = () => {
    preloadedUrlsRef.current.forEach((url) => {
      if (url.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {
          console.error("Error revoking blob URL:", e);
        }
      }
    });
    preloadedUrlsRef.current = [];
  };

  const stopAutoRead = () => {
    if (autoReadAudioRef.current) {
      try {
        autoReadAudioRef.current.pause();
        autoReadAudioRef.current.src = "";
        autoReadAudioRef.current.onended = null;
        autoReadAudioRef.current.onplay = null;
        autoReadAudioRef.current.onplaying = null;
        autoReadAudioRef.current.onerror = null;
      } catch (e) {
        console.error("Error stopping autoReadAudio:", e);
      }
    }
    segmentsRef.current = [];
    currentSegmentIndexRef.current = 0;
    revokePreloadedUrls();

    setIsTtsPlaying(false);
    setAutoplayCountdown(null);
    setNextQuestionCountdown(null);
    setIsAnswerRevealed(false);
  };

  const playNextSegment = async () => {
    if (!isAutoReadEnabled || currentSegmentIndexRef.current >= segmentsRef.current.length) {
      stopAutoRead();
      if (quizMode === "autoplay") {
        setAutoplayCountdown(10);
        setIsAnswerRevealed(false);
      }
      return;
    }

    setIsTtsPlaying(true);
    const segment = segmentsRef.current[currentSegmentIndexRef.current];
    currentSegmentIndexRef.current++;

    const playSpeed = getQuestionSpeed();
    let audio = autoReadAudioRef.current;
    if (!audio) {
      audio = new Audio();
      autoReadAudioRef.current = audio;
    }

    let src = segment.preloadedUrl;
    if (!src && segment.type === 'tts' && segment.text) {
      // Fallback live fetch if preload failed or was not ready
      try {
        const response = await fetch("/api/tts/edge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: segment.text })
        });
        if (response.ok) {
          const blob = await response.blob();
          src = URL.createObjectURL(blob);
          preloadedUrlsRef.current.push(src);
        }
      } catch (err) {
        console.error("Fallback live TTS fetch failed:", err);
      }
    }

    if (!src) {
      playNextSegment();
      return;
    }

    try {
      audio.onplay = () => {
        if (audio) audio.playbackRate = playSpeed;
      };
      audio.onplaying = () => {
        if (audio) audio.playbackRate = playSpeed;
      };
      audio.onended = () => {
        playNextSegment();
      };
      audio.onerror = (e) => {
        console.error("Audio player error event:", e);
        playNextSegment();
      };

      audio.src = src;
      audio.defaultPlaybackRate = playSpeed;
      audio.playbackRate = playSpeed;

      audio.play().then(() => {
        if (audio) audio.playbackRate = playSpeed;
      }).catch(err => {
        console.error("Failed to play audio segment:", err);
        playNextSegment();
      });
    } catch (err) {
      console.error("Error setting up audio playback:", err);
      playNextSegment();
    }
  };

  const startAutoReadQueue = async (question: any) => {
    stopAutoRead();
    if (!question) return;

    setIsTtsPlaying(true);
    const queue = buildAutoReadSegments(question);
    const requestId = ++preloadRequestIdRef.current;

    // Preload all TTS segments for this question
    const promises = queue.map(async (segment: any) => {
      if (segment.type === 'tts' && segment.text) {
        try {
          const response = await fetch("/api/tts/edge", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: segment.text })
          });
          if (!response.ok) throw new Error("Preload fetch failed");
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          segment.preloadedUrl = url;
          preloadedUrlsRef.current.push(url);
        } catch (err) {
          console.error("Failed to preload segment:", segment.text, err);
        }
      } else if (segment.type === 'sound' && segment.src) {
        segment.preloadedUrl = segment.src;
      }
    });

    try {
      await Promise.all(promises);
    } catch (err) {
      console.error("Error in Promise.all for preloading:", err);
    }

    // Cancel if request ID is no longer current (e.g. user moved to another slide)
    if (requestId !== preloadRequestIdRef.current) {
      return;
    }

    segmentsRef.current = queue;
    currentSegmentIndexRef.current = 0;
    playNextSegment();
  };

  // Trigger Auto-read when current question or auto-read enabled changes
  useEffect(() => {
    if (!hasStarted || isShowingResultScreen) {
      stopAutoRead();
      return;
    }
    
    if (isAutoReadEnabled && currentQuestion) {
      startAutoReadQueue(currentQuestion);
    } else {
      stopAutoRead();
    }
    
    return () => {
      stopAutoRead();
    };
  }, [currentIndex, isAutoReadEnabled, hasStarted, isShowingResultScreen]);

  // Listen to other audio events to stop auto-reading
  useEffect(() => {
    const handleOtherAudioPlay = () => {
      stopAutoRead();
    };
    window.addEventListener('materialAudioPlay', handleOtherAudioPlay);
    window.addEventListener('hintAudioPlay', handleOtherAudioPlay);
    window.addEventListener('pauseAllAudio', handleOtherAudioPlay);
    return () => {
      window.removeEventListener('materialAudioPlay', handleOtherAudioPlay);
      window.removeEventListener('hintAudioPlay', handleOtherAudioPlay);
      window.removeEventListener('pauseAllAudio', handleOtherAudioPlay);
    };
  }, []);

  // Save isAutoReadEnabled to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("quiz_auto_read_enabled", String(isAutoReadEnabled));
    }
  }, [isAutoReadEnabled]);

  const userAnswer = answers[currentQuestion?.id];
  const isChecked = checkedQuestions[currentQuestion?.id] || false;

  const questionStatus = currentQuestion ? getQuestionStatus(currentQuestion, userAnswer) : "pending";
  const isCorrectNow = isChecked && questionStatus === "correct";
  const isWrongNow = isChecked && questionStatus !== "correct" && questionStatus !== "pending";

  // ── Score helpers ────────────────────────────────────────
  const getScoreEmoji = (c: number, t2: number) => {
    const p = c / t2;
    if (p >= 0.8) return "🌟";
    if (p >= 0.5) return "👏";
    return "💪";
  };
  const getScoreMsg = (c: number, t2: number) => {
    const p = c / t2;
    if (p >= 0.8) return "Excellent!";
    if (p >= 0.5) return "Not bad!";
    return "Keep trying!";
  };
  const getStars = (c: number, t2: number) => {
    const p = c / t2;
    if (p >= 0.8) return 3;
    if (p >= 0.5) return 2;
    return 1;
  };

  if (!hasStarted) {
    return (
      <div 
        className="min-h-screen font-body flex flex-col items-center justify-center p-6 w-full relative bg-cover bg-center bg-[#8cd2f6]"
        style={{ backgroundImage: 'url(/images/background/cartoon-background-children.jpg)' }}
      >
        {/* Transparent header just for the BACK button */}


        {/* Start Card */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-[3rem] border-4 border-white dark:border-slate-800 shadow-2xl p-8 md:p-12 max-w-xl w-full text-center relative overflow-hidden animate-in fade-in zoom-in-95 duration-500 flex flex-col items-center">
          {/* Top colored strip */}
          <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-r from-orange-400 via-pink-400 to-purple-500"></div>

          {/* Teacher avatar if available */}
          <div className="mb-6 flex justify-center">
            <React.Suspense fallback={<div className="w-20 h-20 rounded-full bg-purple-100 animate-pulse border-4 border-white shadow-md shrink-0" />}>
              <StartScreenTeacherAvatar promise={extraDataPromise} />
            </React.Suspense>
          </div>

          <h4 className="text-purple-600 dark:text-purple-400 font-black text-xs uppercase tracking-[0.2em] mb-3">
            ARE YOU READY?
          </h4>
          
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight leading-tight uppercase italic mb-6">
            {assignment.title || "QUIZ FOR LITTLE LEARNERS"}
          </h1>

          <div className="flex flex-wrap items-center justify-center gap-6 mb-8 text-slate-600 dark:text-slate-300 font-bold text-sm">
            <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-950/40 rounded-2xl border border-purple-100 dark:border-purple-900/40">
              <HelpCircle className="w-5 h-5 text-purple-500" />
              {questions.length} QUESTIONS
            </div>
            {assignment.timeLimit && (
              <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-950/40 rounded-2xl border border-purple-100 dark:border-purple-900/40">
                <Clock className="w-5 h-5 text-purple-500" />
                {assignment.timeLimit} MINUTES
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-lg justify-center mt-4">
            {/* Practice Mode Button */}
            <button
              onClick={() => handleStartQuiz("practice")}
              className={`group relative px-8 py-4 w-full ${
                assignment.lesson ? "sm:w-2/3" : "sm:w-1/2"
              } rounded-3xl bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 border-2 border-purple-200 text-purple-700 font-black text-base uppercase tracking-wider shadow-md hover:scale-[1.03] active:scale-95 transition-all duration-200`}
            >
              <span className="flex items-center justify-center gap-2">
                <Play className="w-5 h-5 fill-current text-purple-600" />
                {assignment.lesson ? "Practice now" : "Practice Mode"}
              </span>
            </button>

            {/* Autoplay Mode Button (Only show if not linked to a lesson) */}
            {!assignment.lesson && (
              <button
                onClick={() => handleStartQuiz("autoplay")}
                className="group relative px-8 py-4 w-full sm:w-1/2 rounded-3xl bg-gradient-to-r from-orange-400 to-amber-500 hover:from-orange-500 hover:to-amber-600 text-white font-black text-base uppercase tracking-wider shadow-lg shadow-orange-500/30 hover:scale-[1.03] active:scale-95 transition-all duration-200"
              >
                <span className="flex items-center justify-center gap-2">
                  <Play className="w-5 h-5 fill-current text-white animate-pulse" />
                  Autoplay Mode
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  const cols = Math.ceil(questions.length / 2);

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="min-h-screen font-body flex flex-col bg-[#8cd2f6]">
      <SelectionTranslator />
      {/* ── TOP HEADER (Glass) ── */}
      <div className="relative z-30 bg-white/70 backdrop-blur-md px-4 py-3 shadow-sm border-b border-white/20">
        {/* Row 1: Back button + Title */}
        <div className="flex items-center gap-3">
          <div className="shrink-0 flex items-center gap-2">

            {/* Dolcake Logo - về trang chủ */}
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-1.5 group"
              title="Về trang chủ"
            >
              <img
                src="/images/logo.png"
                alt="Dolcake"
                className="w-8 h-8 object-contain group-hover:rotate-12 transition-transform duration-700 shrink-0"
              />
              <div className="flex flex-col">
                <span className="font-headline font-black text-lg tracking-tighter text-primary leading-none">Dolcake</span>
                <span className="text-[8px] font-black text-primary/40 tracking-[0.4em] uppercase hidden sm:block">Student Portal</span>
              </div>
            </button>

            <button
              onClick={() => setIsMuted(!isMuted)}
              className="flex items-center justify-center p-2 bg-white text-purple-600 rounded-full border-2 border-purple-100 hover:bg-purple-50 hover:border-purple-300 transition-all active:scale-95 shadow-sm"
              title={isMuted ? "Unmute music" : "Mute music"}
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-rose-500" />
              ) : (
                <Volume2 className="w-5 h-5 text-purple-500 animate-pulse" />
              )}
            </button>
          </div>
          <div className="absolute left-6 top-3 z-40 hidden md:block">
            <React.Suspense fallback={<div className="w-[72px] h-[72px] rounded-full bg-slate-200 animate-pulse border-4 border-white shadow-lg" />}>
              <GlobalTeacherInfoConsumer promise={extraDataPromise} handleSafeNavigate={handleSafeNavigate} />
            </React.Suspense>
          </div>
          <h2 className="flex-1 text-sm font-black text-slate-800 uppercase tracking-wide text-center line-clamp-2 leading-tight pr-2 hidden md:block">
            {assignment.title || "FUN WITH SCHOOL TOOLS: QUIZ FOR LITTLE LEARNERS"}
          </h2>
        </div>



        {/* Question Map */}
        <div 
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          className={`${quizMode === "autoplay" ? "hidden sm:flex" : "grid sm:flex"} sm:flex-wrap sm:items-center sm:justify-center gap-[2vw] sm:gap-2 justify-items-center mt-3 max-w-6xl mx-auto px-2 w-full`}
        >
          {questions.map((q, i) => {
            const active = i === currentIndex;
            
            // Check answer status
            const ans = answers[q.id];
            let isAnswered = false;
            if (ans !== undefined && ans !== null) {
              if (Array.isArray(ans)) {
                isAnswered = ans.length > 0;
              } else if (typeof ans === "object") {
                isAnswered = Object.keys(ans).length > 0;
              } else {
                isAnswered = true;
              }
            }

            // Check if graded
            const isGraded = checkedQuestions[q.id];
            let status = "pending";
            if (isGraded) {
              status = getQuestionStatus(q, ans);
            }

            // Determine classes based on state
            let btnClass = "";
            
            if (isGraded) {
              if (status === "correct") {
                btnClass = active 
                  ? "bg-emerald-500 text-white border-4 border-emerald-200 shadow-lg shadow-emerald-500/40 scale-110" 
                  : "bg-emerald-500 text-white border-2 border-emerald-600 hover:bg-emerald-600 opacity-90";
              } else if (status === "incorrect") {
                btnClass = active 
                  ? "bg-rose-500 text-white border-4 border-rose-200 shadow-lg shadow-rose-500/40 scale-110" 
                  : "bg-rose-500 text-white border-2 border-rose-600 hover:bg-rose-600 opacity-90";
              } else {
                // skipped/unanswered
                btnClass = active
                  ? "bg-slate-500 text-white border-4 border-slate-200 shadow-lg shadow-slate-500/40 scale-110"
                  : "bg-slate-100 text-slate-400 border-2 border-slate-300 border-dashed hover:bg-slate-200";
              }
            } else {
              // Not graded yet
              if (active) {
                btnClass = "bg-orange-500 text-white shadow-lg shadow-orange-500/40 border-4 border-orange-200 scale-110 z-10";
              } else if (isAnswered) {
                btnClass = "bg-purple-500 border-2 border-purple-600 text-white shadow-md shadow-purple-500/20 hover:bg-purple-600 hover:border-purple-700";
              } else {
                btnClass = "bg-white border-2 border-slate-200 text-slate-400 hover:border-purple-300 hover:text-purple-500";
              }
            }

            return (
              <button
                key={q.id}
                onClick={() => navigateTo(i)}
                disabled={isAutoRevealing}
                style={{ containerType: 'inline-size' }}
                className={`relative w-full max-w-[40px] aspect-square sm:w-10 sm:h-10 rounded-full transition-all duration-300 shrink-0 flex items-center justify-center ${btnClass}`}
              >
                <span className="font-black text-[38cqw] sm:text-base leading-none">
                  {i + 1}
                </span>
                {isGraded && !active && status === "correct" && (
                   <div className="absolute -top-[5%] -right-[5%] w-[38%] h-[38%] bg-emerald-100 rounded-full border border-emerald-500 flex items-center justify-center shadow-sm">
                     <Check className="w-[70%] h-[70%] text-emerald-600" strokeWidth={4} />
                   </div>
                )}
                {isGraded && !active && status === "incorrect" && (
                   <div className="absolute -top-[5%] -right-[5%] w-[38%] h-[38%] bg-rose-100 rounded-full border border-rose-500 flex items-center justify-center shadow-sm">
                     <X className="w-[70%] h-[70%] text-rose-600" strokeWidth={4} />
                   </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Decorative Sun removed */}
      </div>

      {/* ── MAIN CONTENT (Image Background) ── */}
      <div 
        className="flex-1 flex flex-col items-center justify-start pt-6 sm:justify-center sm:pt-6 p-2 sm:p-6 w-full relative bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/images/background/cartoon-background-children.jpg)' }}
      >
      {questions.length > 0 && (
        <>
        <div className="w-full max-w-4xl mx-auto z-10 relative top-0 sm:-top-[100px]">

        {isShowingResultScreen && scoreResult ? (
        <div className="w-full animate-in slide-in-from-bottom-8 fade-in-0 duration-500">
            <div className="bg-white rounded-[2rem] border-4 border-primary/20 shadow-2xl shadow-primary/10 overflow-hidden flex flex-col items-center text-center px-8 py-6 relative">
              {/* Decorative elements */}
              <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-emerald-400 via-amber-400 to-primary"></div>
              
              <div className="text-5xl mb-3 animate-bounce">
                {getScoreEmoji(scoreResult.correct, scoreResult.total)}
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-1">{getScoreMsg(scoreResult.correct, scoreResult.total)}</h2>
              <p className="text-sm text-slate-500 font-medium mb-5">
                You answered <span className="text-primary font-black text-xl px-1">{scoreResult.correct}</span> / {scoreResult.total} questions correctly.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
                <button
                  onClick={() => {
                    setIsShowingResultScreen(false);
                    navigateTo(0);
                  }}
                  className="px-6 py-2.5 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-700 font-black text-sm transition-all active:scale-95 flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <Info className="w-4 h-4" />
                  Review details
                </button>
                <button
                  onClick={handleReset}
                  className="px-6 py-2.5 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-sm transition-all shadow-xl shadow-primary/30 active:scale-95 flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <RotateCcw className="w-4 h-4" />
                  Retry assignment
                </button>
              </div>
            </div>

            {/* Related Content */}
            {relatedAssignmentsPromise && (
              <div className="mt-4 w-full bg-white rounded-[2rem] border-2 border-slate-200 p-6 shadow-xl">
                <React.Suspense fallback={<div className="h-40 animate-pulse bg-slate-100 rounded-xl w-full"></div>}>
                  <RelatedAssignmentsConsumer promise={relatedAssignmentsPromise} isGuest={isGuest} onNavigate={handleSafeNavigate} />
                </React.Suspense>
              </div>
            )}
          </div>

        ) : (
          <>
            {/* Question Card */}
            <div
              key={`${currentIndex}-${slideDirection}`}
          className={`w-full ${
            slideDirection === "left"
              ? "animate-in slide-in-from-right-16 fade-in-0"
              : "animate-in slide-in-from-left-16 fade-in-0"
          } duration-300`}
        >
          {/* Card Wrapper */}
          <div className={`bg-white rounded-[48px] shadow-xl overflow-visible transition-all duration-500 relative border-[6px] flex flex-col ${
            (isChecked && quizMode !== "autoplay") ? "max-h-[60dvh]" : "max-h-[85dvh]"
          } ${
            isCorrectNow
              ? "border-emerald-400"
              : isWrongNow
              ? "border-rose-400"
              : "border-[#9A89FF]"
          }`}>

            {/* Card Header Row */}
            <div className="flex items-center justify-between px-6 pt-5 pb-1 z-20">
              <div className="flex items-center gap-2">
                <React.Suspense fallback={null}>
                  <SidePanelToggleButton 
                    promise={extraDataPromise} 
                    isSidePanelOpen={isSidePanelOpen} 
                    setIsSidePanelOpen={setIsSidePanelOpen} 
                  />
                </React.Suspense>
              </div>
              
              {/* Autoplay mobile progress indicator inside the header */}
              {quizMode === "autoplay" ? (
                <div className="flex sm:hidden items-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 border border-purple-200 text-purple-700 rounded-full font-black text-xs tracking-wider shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                    <span>{currentIndex + 1} / {questions.length}</span>
                  </div>
                </div>
              ) : null}

              {/* Spacing alignment */}
              <div className={`w-9 h-9 ${quizMode === "autoplay" ? "hidden sm:block" : "block"}`} />
            </div>

            {/* Optional Type Label (moved to top right) */}
            <div className="absolute -top-6 right-10 z-20 hidden sm:block">
              <span className="bg-[#9A89FF] text-white text-sm font-bold px-5 py-2 rounded-full shadow-md whitespace-nowrap">
                {qType === "MULTIPLE_SELECT" ? "Multiple Select"
                  : qType === "MATCHING" ? "Matching"
                  : qType === "CLOZE_TEST" ? "Fill in the blank"
                  : qType === "TRUE_FALSE" ? "True / False"
                  : "Choose the correct answer"}
              </span>
            </div>



            {isChecked && quizMode !== "autoplay" && (
              <div className="absolute -top-6 right-10 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 z-20">
                <div className={`flex items-center gap-2 text-white font-black text-sm whitespace-nowrap px-5 py-2 rounded-full shadow-md ${isCorrectNow ? "bg-emerald-500" : "bg-rose-500"}`}>
                  {isCorrectNow
                    ? <><CheckCircle2 className="w-5 h-5" /> Correct! 🎉</>
                    : <><XCircle className="w-5 h-5" /> Incorrect! 😅</>}
                </div>
              </div>
            )}

            {/* Card body */}
            <div className={`flex-1 overflow-y-auto min-h-0 relative transition-all duration-500 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${
              (isChecked && quizMode !== "autoplay")
                ? "px-[clamp(0.75rem,3vw,2rem)] pt-1 pb-[clamp(0.5rem,1.5dvh,1rem)] space-y-[clamp(0.5rem,1.5dvh,0.75rem)]"
                : "px-[clamp(1rem,4vw,3rem)] pt-2 pb-[clamp(1rem,4dvh,2.5rem)] space-y-[clamp(1rem,2.5dvh,1.5rem)]"
            }`}>
              {/* Question text (not for MATCHING as MATCHING has it on the left column) */}
              {qType !== "MATCHING" && questionText && questionText !== "{}" && (
                <div className="text-center relative w-full flex items-center justify-center gap-3 flex-wrap">
                  <h3
                    className={`interactive-reading-content font-[800] text-[#2D366D] leading-tight transition-all duration-500 cursor-pointer select-text ${
                      (isChecked && quizMode !== "autoplay") ? "text-[clamp(1rem,2dvh,1.25rem)]" : "text-[clamp(1.25rem,3.5dvh,2rem)]"
                    }`}
                    style={{ fontFamily: "'Quicksand', 'Nunito', sans-serif" }}
                    title="Tap a word to translate"
                  >
                    {questionText}
                  </h3>
                  {currentQuestion?.audioUrl && (
                    <QuestionAudioPlayButton src={currentQuestion.audioUrl} playbackRate={getQuestionSpeed()} />
                  )}
                </div>
              )}

              {/* ── MULTIPLE CHOICE / SELECT ── */}
              {(qType === "MULTIPLE_CHOICE" || qType === "MULTIPLE_SELECT") && (
                <div className="flex flex-wrap justify-center gap-x-4 sm:gap-x-8 gap-y-[clamp(1rem,4dvh,2rem)] pt-[clamp(0.5rem,1.5dvh,1rem)] w-full">
                  {(currentQuestionData.options || []).map((option: any, i: number) => {
                    const isSelected = isMultiSelect
                      ? Array.isArray(userAnswer) && userAnswer.includes(i)
                      : userAnswer === i;
                    const isCorrectOpt = option.isCorrect;

                    const solarpunkStyles = [
                      { 
                        color: "text-emerald-900", bg: "bg-emerald-100", border: "border-emerald-300", iconBg: "bg-emerald-200", shadow: "shadow-emerald-900/10",
                        selectedBg: "bg-emerald-500", selectedBorder: "border-emerald-600", selectedColor: "text-white", selectedIconBg: "bg-white", selectedIconColor: "text-emerald-600", selectedShadow: "shadow-emerald-500/40"
                      },
                      { 
                        color: "text-orange-900", bg: "bg-orange-100", border: "border-orange-300", iconBg: "bg-orange-200", shadow: "shadow-orange-900/10",
                        selectedBg: "bg-orange-500", selectedBorder: "border-orange-600", selectedColor: "text-white", selectedIconBg: "bg-white", selectedIconColor: "text-orange-600", selectedShadow: "shadow-orange-500/40"
                      },
                      { 
                        color: "text-sky-900", bg: "bg-sky-100", border: "border-sky-300", iconBg: "bg-sky-200", shadow: "shadow-sky-900/10",
                        selectedBg: "bg-sky-500", selectedBorder: "border-sky-600", selectedColor: "text-white", selectedIconBg: "bg-white", selectedIconColor: "text-sky-600", selectedShadow: "shadow-sky-500/40"
                      },
                      { 
                        color: "text-purple-900", bg: "bg-purple-100", border: "border-purple-300", iconBg: "bg-purple-200", shadow: "shadow-purple-900/10",
                        selectedBg: "bg-purple-500", selectedBorder: "border-purple-600", selectedColor: "text-white", selectedIconBg: "bg-white", selectedIconColor: "text-purple-600", selectedShadow: "shadow-purple-500/40"
                      },
                      { 
                        color: "text-rose-900", bg: "bg-rose-100", border: "border-rose-300", iconBg: "bg-rose-200", shadow: "shadow-rose-900/10",
                        selectedBg: "bg-rose-500", selectedBorder: "border-rose-600", selectedColor: "text-white", selectedIconBg: "bg-white", selectedIconColor: "text-rose-600", selectedShadow: "shadow-rose-500/40"
                      },
                    ];
                    
                    const blobShapes = [
                      "rounded-[2rem_3.5rem_2rem_4rem_/_3.5rem_2rem_4rem_2.5rem]",
                      "rounded-[3.5rem_2rem_4rem_2.5rem_/_2rem_3.5rem_2.5rem_4rem]",
                      "rounded-[2.5rem_4.5rem_3rem_4rem_/_4rem_3rem_4.5rem_2.5rem]",
                      "rounded-[4rem_2.5rem_4rem_3rem_/_2.5rem_4.5rem_3rem_4.5rem]",
                      "rounded-[3rem_4rem_2.5rem_4.5rem_/_4.5rem_2.5rem_4.5rem_3rem]",
                    ];

                    const theme = solarpunkStyles[i % solarpunkStyles.length];
                    const blobShape = blobShapes[i % blobShapes.length];

                    let containerClass = `${theme.bg} ${theme.border} ${theme.shadow}`;
                    let textClass = theme.color;
                    let iconClass = `${theme.iconBg} ${theme.color}`;

                    if (isChecked) {
                      if (isCorrectOpt) {
                        containerClass = `bg-emerald-100 border-emerald-400 shadow-emerald-900/10 ${quizMode === "autoplay" ? "" : "scale-[1.02]"}`;
                        textClass = "text-emerald-900";
                        iconClass = "bg-emerald-500 text-white";
                      } else if (isSelected) {
                        containerClass = "bg-rose-100 border-rose-400 shadow-rose-900/10";
                        textClass = "text-rose-900";
                        iconClass = "bg-rose-500 text-white";
                      } else {
                        containerClass = "bg-slate-50 border-slate-200 opacity-60";
                        textClass = "text-slate-500";
                        iconClass = "bg-slate-200 text-slate-500";
                      }
                    } else if (isSelected) {
                      containerClass = `${theme.selectedBg} ${theme.selectedBorder} scale-[1.05] shadow-2xl ${theme.selectedShadow} z-10 animate-solar-pulse border-4`;
                      textClass = theme.selectedColor;
                      iconClass = `${theme.selectedIconBg} ${theme.selectedIconColor} scale-110 -rotate-6 shadow-xl`;
                    }

                    return (
                      <button
                        key={i}
                        disabled={isChecked}
                        onClick={() => handleAnswerChange(currentQuestion, i)}
                        className={`group relative min-h-[clamp(4.5rem,9dvh,6rem)] w-auto flex-auto min-w-[140px] max-w-full ${blobShape} py-[clamp(0.75rem,2dvh,1.25rem)] px-[clamp(1rem,3vw,1.5rem)] transition-all duration-700 flex flex-col items-center justify-center border-[3px] shadow-lg ${containerClass} ${!isChecked && !isSelected ? "hover:scale-[1.03]" : ""}`}
                        style={{ fontFamily: "'Quicksand', 'Nunito', sans-serif" }}
                      >
                        {/* Floating Badge (A, B, C, D) */}
                        <div className={`absolute -top-3 -left-2 sm:-top-4 sm:-left-3 rounded-full shadow-lg transition-all duration-700 flex items-center justify-center w-10 h-10 text-xl font-[900] ${iconClass} ${!isChecked && !isSelected ? "group-hover:scale-110 group-hover:-rotate-12" : ""}`}>
                          {isMultiSelect
                            ? <Check className={`w-6 h-6 transition-all ${isSelected ? "opacity-100 scale-100" : "opacity-0 scale-50"}`} strokeWidth={4} />
                            : String.fromCharCode(65 + i)}
                        </div>

                        <span className={`relative z-10 font-[800] text-[clamp(1rem,2.5dvh,1.25rem)] tracking-tight transition-all duration-500 ${textClass} text-center flex items-center justify-center gap-1.5`}>
                          {option.text}
                          {isChecked && isCorrectOpt && <CheckCircle2 className="w-[1.25em] h-[1.25em] text-emerald-600 shrink-0 ml-1" />}
                          {isChecked && isSelected && !isCorrectOpt && <XCircle className="w-[1.25em] h-[1.25em] text-rose-600 shrink-0 ml-1" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ── TRUE / FALSE ── */}
              {qType === "TRUE_FALSE" && (
                <div className="grid grid-cols-2 gap-6 pt-4">
                  {[
                    { 
                      label: "True", 
                      value: true,
                      icon: (colorClass: string) => (
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-2 transition-transform duration-300 group-hover:scale-110 shadow-sm ${colorClass}`}>
                          <Check className="w-8 h-8" strokeWidth={4.5} />
                        </div>
                      )
                    },
                    { 
                      label: "False", 
                      value: false,
                      icon: (colorClass: string) => (
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-2 transition-transform duration-300 group-hover:scale-110 shadow-sm ${colorClass}`}>
                          <X className="w-8 h-8" strokeWidth={4.5} />
                        </div>
                      )
                    },
                  ].map((opt, i) => {
                    const isSelected = userAnswer === opt.value;
                    const isCorrectOpt = currentQuestionData.isTrue === opt.value;
                    
                    let btnStyle = "";
                    let iconBgColor = "";
                    
                    if (isChecked) {
                      if (isCorrectOpt) {
                        btnStyle = "border-emerald-400 bg-emerald-100 text-emerald-900 shadow-md scale-[1.02]";
                        iconBgColor = "bg-emerald-500 text-white";
                      } else if (isSelected) {
                        btnStyle = "border-rose-400 bg-rose-100 text-rose-900 shadow-md";
                        iconBgColor = "bg-rose-500 text-white";
                      } else {
                        btnStyle = "border-slate-200 bg-slate-50 text-slate-400 opacity-60";
                        iconBgColor = "bg-slate-200 text-slate-400";
                      }
                    } else if (isSelected) {
                      if (opt.value) {
                        btnStyle = "border-emerald-600 bg-emerald-500 text-white scale-[1.05] shadow-xl shadow-emerald-500/30 border-4 z-10 font-black";
                        iconBgColor = "bg-white text-emerald-600 scale-110 shadow-md";
                      } else {
                        btnStyle = "border-rose-600 bg-rose-500 text-white scale-[1.05] shadow-xl shadow-rose-500/30 border-4 z-10 font-black";
                        iconBgColor = "bg-white text-rose-600 scale-110 shadow-md";
                      }
                    } else {
                      if (opt.value) {
                        btnStyle = "border-emerald-250 bg-emerald-50 text-emerald-700 hover:border-emerald-400 hover:bg-emerald-100/80 shadow-sm";
                        iconBgColor = "bg-emerald-100 text-emerald-600";
                      } else {
                        btnStyle = "border-rose-250 bg-rose-50 text-rose-700 hover:border-rose-400 hover:bg-rose-100/80 shadow-sm";
                        iconBgColor = "bg-rose-100 text-rose-600";
                      }
                    }
                    
                    return (
                      <button
                        key={i}
                        disabled={isChecked}
                        onClick={() => handleAnswerChange(currentQuestion, opt.value)}
                        className={`relative group flex flex-col items-center justify-center py-6 px-4 rounded-[2.5rem] border-[3px] font-extrabold text-xl sm:text-2xl transition-all duration-350 ${btnStyle} ${!isChecked ? "hover:scale-[1.03] active:scale-95 cursor-pointer" : "cursor-default"}`}
                        style={{ fontFamily: "'Quicksand', 'Nunito', sans-serif" }}
                      >
                        {/* Badge góc trên phải khi review */}
                        {isChecked && (isCorrectOpt || isSelected) && (
                          <div className="absolute top-3 right-3 flex flex-col items-end gap-1 z-10">
                            {isCorrectOpt && quizMode !== "autoplay" && (
                              <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wide bg-emerald-500 text-white pl-1.5 pr-2 py-0.5 rounded-full shadow-md border border-emerald-400">
                                <CheckCircle2 className="w-2.5 h-2.5 shrink-0" /> Correct
                              </span>
                            )}
                            {isSelected && !isCorrectOpt && (
                              <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wide bg-rose-500 text-white pl-1.5 pr-2 py-0.5 rounded-full shadow-md border border-rose-400">
                                <User className="w-2.5 h-2.5 shrink-0" /> Yours
                              </span>
                            )}
                            {isSelected && isCorrectOpt && (
                              <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wide bg-emerald-700 text-white pl-1.5 pr-2 py-0.5 rounded-full shadow-md border border-emerald-600">
                                <User className="w-2.5 h-2.5 shrink-0" /> Yours ✓
                              </span>
                            )}
                          </div>
                        )}

                        {opt.icon(iconBgColor)}
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ── MATCHING ── */}
              {qType === "MATCHING" && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start w-full min-h-0">
                  {/* Cột bên trái: Yêu cầu câu hỏi và media đính kèm */}
                  <div className="md:col-span-4 flex flex-col items-center md:items-start text-center md:text-left space-y-5 px-2">
                    {questionText && questionText !== "{}" && (
                      <div className="flex items-center gap-3 flex-wrap justify-center md:justify-start">
                        <h3 className="text-xl sm:text-2xl md:text-3xl font-[800] text-[#2D366D] leading-tight" style={{ fontFamily: "'Quicksand', 'Nunito', sans-serif" }}>
                          {questionText}
                        </h3>
                        {currentQuestion?.audioUrl && (
                          <QuestionAudioPlayButton src={currentQuestion.audioUrl} playbackRate={getQuestionSpeed()} />
                        )}
                      </div>
                    )}
                    {currentQuestion?.imageUrl && (
                      <div className="relative w-full max-w-[280px] aspect-[4/3] rounded-3xl overflow-hidden shadow-md border-4 border-white bg-white">
                        <img src={currentQuestion.imageUrl} alt="Question media" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  {/* Cột bên phải: Khu vực làm bài nối cặp */}
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

              {/* ── CLOZE TEST ── */}
              {qType === "CLOZE_TEST" && (
                <ClozeTestBlock
                  q={currentQuestion}
                  questionData={currentQuestionData}
                  userAnswer={userAnswer}
                  isChecked={isChecked}
                  handleAnswerChange={handleAnswerChange}
                />
              )}

              {/* ── EXPLANATION (with language toggle) ── */}
              {isChecked && currentQuestion?.explanation && (
                <div className="space-y-3 mt-2">
                  <React.Suspense
                    fallback={
                      <ExplanationBlock
                        questionId={currentQuestion.id}
                        explanation={currentQuestion.explanation}
                        explanationTranslations={null}
                        isExpanded={quizMode === "autoplay" ? true : !!expandedExplanations[currentQuestion.id]}
                        onToggleExpand={() => setExpandedExplanations((p) => ({ ...p, [currentQuestion.id]: !p[currentQuestion.id] }))}
                        hideHeader={quizMode === "autoplay"}
                      />
                    }
                  >
                    <ExplanationResolver
                      promise={questionTranslationsPromise}
                      questionId={currentQuestion.id}
                      explanation={currentQuestion.explanation}
                      isExpanded={quizMode === "autoplay" ? true : !!expandedExplanations[currentQuestion.id]}
                      onToggleExpand={() => setExpandedExplanations((p) => ({ ...p, [currentQuestion.id]: !p[currentQuestion.id] }))}
                      hideHeader={quizMode === "autoplay"}
                    />
                  </React.Suspense>
                </div>
              )}
            </div>


            {/* ── CARD FOOTER (NAVIGATION) ── */}
            <div className="w-full bg-transparent px-[clamp(1rem,4vw,3rem)] py-[clamp(0.75rem,2dvh,1.25rem)] flex items-center justify-between border-t-2 border-slate-100 shrink-0 z-20">
              {/* Back */}
              <button
                disabled={currentIndex === 0 || isAutoRevealing}
                onClick={() => navigateTo(currentIndex - 1)}
                className={`flex items-center gap-2 px-5 sm:px-8 py-3 rounded-full font-black text-base sm:text-lg transition-all duration-200 border-2 ${
                  currentIndex === 0 || isAutoRevealing
                    ? "border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed"
                    : "border-[#e9d5ff] bg-white text-[#9A89FF] hover:bg-[#9A89FF] hover:border-[#9A89FF] hover:text-white hover:shadow-lg active:scale-95"
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Previous</span>
              </button>

              <div className="flex-1 flex justify-center items-center">
                {quizMode === "autoplay" && autoplayCountdown !== null && !isAnswerRevealed && (
                  <div className="w-12 h-12 rounded-full bg-amber-50/90 border-2 border-amber-200/80 shadow-[0_4px_10px_rgba(245,158,11,0.12),inset_0_2px_4px_rgba(255,255,255,0.9)] flex items-center justify-center text-2xl font-[900] text-amber-500 animate-bounce select-none">
                    {autoplayCountdown}
                  </div>
                )}
              </div>

              {/* Next / Check / Reset */}
              {currentIndex < questions.length - 1 ? (
                <button
                  disabled={isAutoRevealing}
                  onClick={() => navigateTo(currentIndex + 1)}
                  className={`flex items-center gap-2 px-5 sm:px-8 py-3 rounded-full font-black text-base sm:text-lg transition-all duration-200 border-2 ${
                    isAutoRevealing
                      ? "border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed"
                      : "border-[#e9d5ff] bg-white text-[#9A89FF] hover:bg-[#9A89FF] hover:border-[#9A89FF] hover:text-white hover:shadow-lg active:scale-95"
                  }`}
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : isAllChecked ? (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-5 sm:px-8 py-3 rounded-full font-black text-base sm:text-lg border-2 border-[#e9d5ff] bg-white text-[#9A89FF] hover:bg-[#9A89FF] hover:border-[#9A89FF] hover:text-white hover:shadow-lg active:scale-95 transition-all"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span className="hidden sm:inline">Try again</span>
                </button>
              ) : (
                <button
                  disabled={isAutoRevealing}
                  onClick={handleCheckAll}
                  className={`flex items-center gap-2 px-5 sm:px-8 py-3 rounded-full font-black text-base sm:text-lg transition-all duration-200 border-2 ${
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

        {/* Related Content in Review Mode (static, below the sliding card) */}
        {scoreResult && relatedAssignmentsPromise && (
          <div className="mt-8 w-full bg-white rounded-[2rem] border-2 border-slate-200 p-6 shadow-xl">
            <React.Suspense fallback={<div className="h-40 animate-pulse bg-slate-100 rounded-xl w-full"></div>}>
              <RelatedAssignmentsConsumer promise={relatedAssignmentsPromise} isGuest={isGuest} onNavigate={handleSafeNavigate} />
            </React.Suspense>
          </div>
        )}
        </>
        )}
      </div>
      </>
      )}
      </div>
    {/* ── BACKDROP ── */}
      {isSidePanelOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 transition-opacity"
          onClick={() => setIsSidePanelOpen(false)}
        />
      )}

      {/* ── RIGHT SLIDE PANEL ── */}
      <div
        className="fixed top-0 right-0 bottom-0 bg-white/96 backdrop-blur-xl border-l-2 border-primary/10 shadow-2xl z-40 flex flex-col transition-transform duration-500 ease-in-out overflow-hidden w-[80vw] md:w-1/2 max-w-none"
        style={{ transform: isSidePanelOpen ? "translateX(0)" : "translateX(100%)" }}
      >
        {/* Panel header */}
        <div className="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-slate-100 px-5 py-4 flex items-center justify-start shrink-0">
          <button onClick={() => setIsSidePanelOpen(false)} className="p-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-rose-500 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Panel body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
          <React.Suspense fallback={<div className="space-y-4 animate-pulse"><div className="h-40 bg-slate-100 rounded-2xl w-full"></div><div className="h-8 bg-slate-100 rounded-lg w-1/2"></div></div>}>
            <ExtraDataConsumer promise={extraDataPromise} translationsPromise={assignmentTranslationsPromise} isGuest={isGuest} t={t} />
          </React.Suspense>
        </div>
      </div>

      {/* ── REVIEW MODAL ── */}
      {isReviewModalOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-md bg-slate-900/40 animate-in fade-in duration-300"
          onClick={() => setIsReviewModalOpen(false)}
        >
          <div
            className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 w-full max-w-lg p-8 relative animate-in zoom-in-95 slide-in-from-bottom-10 duration-500"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setIsReviewModalOpen(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 transition-colors">
              <X className="w-6 h-6" />
            </button>
            <div className="space-y-6">
              <div>
                <h4 className="text-2xl font-black text-slate-900 uppercase">{t("yourReview")}</h4>
                <p className="text-slate-500 text-sm mt-1">{t("reviewSubtitle")}</p>
              </div>
              {userReview ? (
                <div className="py-10 text-center space-y-4 bg-slate-50 rounded-3xl border border-green-100">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h5 className="text-lg font-black">{t("thankYou")}</h5>
                  <p className="text-sm text-slate-500 italic">{userReview.isApproved ? t("reviewApproved") : t("reviewPending")}</p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex justify-center gap-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} onClick={() => setReviewRating(star)} className="transition-transform hover:scale-110 active:scale-90">
                        <Star className={`w-9 h-9 ${star <= (hoverRating || reviewRating) ? "text-amber-400 fill-amber-400" : "text-slate-200"} transition-colors`} />
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <MessageCircle className="absolute top-4 left-4 w-5 h-5 text-slate-300" />
                    <textarea
                      placeholder={t("commentPlaceholder")}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 pl-12 min-h-[120px] text-base focus:border-primary outline-none transition-all resize-none"
                    />
                  </div>
                  <button
                    onClick={handleReviewSubmit}
                    disabled={isSubmittingReview || reviewRating === 0}
                    className="w-full h-12 bg-slate-900 text-white rounded-full font-black tracking-widest hover:bg-primary transition-all disabled:opacity-50 shadow-xl"
                  >
                    {isSubmittingReview ? t("sending") : t("sendReview")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── NAV GUARD MODAL ── */}
      {navGuard.isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 backdrop-blur-sm bg-slate-900/60 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-8 relative animate-in zoom-in-95 duration-300">
            <button onClick={() => setNavGuard({ ...navGuard, isOpen: false })} className="absolute top-5 left-5 p-1.5 text-slate-400 hover:text-slate-900 transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div className="mt-6 space-y-5 text-center">
              <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto">
                <HelpCircle className="w-7 h-7 text-amber-600" />
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-black text-slate-900">{t("navGuardTitle")}</h4>
                <p className="text-slate-500 text-sm leading-relaxed">{t("navGuardMessage", { unfinished: allCompleted ? "" : t("unfinished"), title: navGuard.targetTitle })}</p>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => { setNavGuard({ ...navGuard, isOpen: false }); router.push(navGuard.targetUrl); }}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm tracking-widest hover:bg-primary/90 transition-all shadow-xl uppercase italic"
                >
                  {t("confirm")}
                </button>
                <button
                  onClick={() => setNavGuard({ ...navGuard, isOpen: false })}
                  className="w-full py-3 text-slate-500 font-bold text-xs hover:text-slate-800 transition-colors uppercase tracking-widest"
                >
                  {t("continue")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} defaultView="studentLogin" />
    </div>
  );
}
