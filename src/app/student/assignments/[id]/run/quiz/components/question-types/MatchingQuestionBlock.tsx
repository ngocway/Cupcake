"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, XCircle } from "lucide-react";

interface MatchingQuestionBlockProps {
  q: any;
  questionData: any;
  userAnswer: any;
  isChecked: boolean;
  handleAnswerChange: (q: any, value: any) => void;
  matchingColors: string[];
}

export function MatchingQuestionBlock({
  q,
  questionData,
  userAnswer,
  isChecked,
  handleAnswerChange,
  matchingColors,
}: MatchingQuestionBlockProps) {
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
export default MatchingQuestionBlock;
