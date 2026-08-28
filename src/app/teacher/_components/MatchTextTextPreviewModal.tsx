"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { X, RefreshCw, Trophy, Flame } from "lucide-react";
import { toast } from "sonner";

export interface PreviewTextTextItem {
  id: string;
  word: string; // Vế A
  labelB?: string | null; // Vế B
}

export interface PreviewTextTextTopic {
  id: string;
  name: string;
  ageGroup?: string;
  items: PreviewTextTextItem[];
}

interface Point {
  x: number;
  y: number;
}

interface Connection {
  topId: string;
  bottomId: string;
}

// Utility for Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function MatchTextTextPreviewModal({
  topic,
  onClose,
}: {
  topic: PreviewTextTextTopic;
  onClose: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const topRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const bottomRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Shuffled items for bottom row
  const bottomItems = useMemo(() => {
    return shuffleArray(topic.items);
  }, [topic.items]);

  // State
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedTopId, setSelectedTopId] = useState<string | null>(null);
  const [selectedBottomId, setSelectedBottomId] = useState<string | null>(null);

  // Dragging line state
  const [dragState, setDragState] = useState<{
    fromType: "top" | "bottom";
    fromId: string;
    startPoint: Point;
    currentPoint: Point;
  } | null>(null);

  // Wrong attempt animation state
  const [wrongPair, setWrongPair] = useState<Connection | null>(null);

  // Combo Streak state
  const [streak, setStreak] = useState<number>(0);
  const [comboToast, setComboToast] = useState<string | null>(null);

  // Anchor points for drawing SVG lines
  const [topPoints, setTopPoints] = useState<Map<string, Point>>(new Map());
  const [bottomPoints, setBottomPoints] = useState<Map<string, Point>>(new Map());

  // Update connector dot anchor points on render or resize
  const updatePoints = () => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();

    const newTopPoints = new Map<string, Point>();
    topRefs.current.forEach((el, id) => {
      if (el) {
        const rect = el.getBoundingClientRect();
        newTopPoints.set(id, {
          x: rect.left + rect.width / 2 - containerRect.left,
          y: rect.bottom - containerRect.top,
        });
      }
    });

    const newBottomPoints = new Map<string, Point>();
    bottomRefs.current.forEach((el, id) => {
      if (el) {
        const rect = el.getBoundingClientRect();
        newBottomPoints.set(id, {
          x: rect.left + rect.width / 2 - containerRect.left,
          y: rect.top - containerRect.top,
        });
      }
    });

    setTopPoints(newTopPoints);
    setBottomPoints(newBottomPoints);
  };

  useEffect(() => {
    updatePoints();
    window.addEventListener("resize", updatePoints);
    const timer = setTimeout(updatePoints, 100);
    return () => {
      window.removeEventListener("resize", updatePoints);
      clearTimeout(timer);
    };
  }, [topic.items, connections]);

  // Handle successful match
  const handleMatchSuccess = (topId: string, bottomId: string) => {
    setConnections((prev) => [...prev, { topId, bottomId }]);
    setSelectedTopId(null);
    setSelectedBottomId(null);
    setDragState(null);

    const newStreak = streak + 1;
    setStreak(newStreak);

    if (newStreak >= 2) {
      const msg = newStreak >= 4 ? `🔥 SƯU TẦM COMBO x${newStreak}! XUẤT SẮC!` : `⚡ COMBO x${newStreak}!`;
      setComboToast(msg);
      setTimeout(() => setComboToast(null), 1500);
    }

    toast.success("Chính xác!");
  };

  // Handle wrong match
  const handleMatchWrong = (topId: string, bottomId: string) => {
    setWrongPair({ topId, bottomId });
    setStreak(0);
    setSelectedTopId(null);
    setSelectedBottomId(null);
    setDragState(null);

    setTimeout(() => {
      setWrongPair(null);
    }, 600);
  };

  // Check if topId and bottomId match
  const checkPair = (topId: string, bottomId: string) => {
    if (topId === bottomId) {
      handleMatchSuccess(topId, bottomId);
    } else {
      handleMatchWrong(topId, bottomId);
    }
  };

  // Tap interaction handler
  const handleTopClick = (id: string) => {
    if (connections.some((c) => c.topId === id)) return;

    if (selectedBottomId) {
      checkPair(id, selectedBottomId);
    } else {
      setSelectedTopId((prev) => (prev === id ? null : id));
    }
  };

  const handleBottomClick = (id: string) => {
    if (connections.some((c) => c.bottomId === id)) return;

    if (selectedTopId) {
      checkPair(selectedTopId, id);
    } else {
      setSelectedBottomId((prev) => (prev === id ? null : id));
    }
  };

  // Drag Pointer Handlers
  const handlePointerDown = (
    e: React.PointerEvent,
    fromType: "top" | "bottom",
    fromId: string
  ) => {
    if (
      fromType === "top" &&
      connections.some((c) => c.topId === fromId)
    )
      return;
    if (
      fromType === "bottom" &&
      connections.some((c) => c.bottomId === fromId)
    )
      return;

    e.preventDefault();
    if (!containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const startP =
      fromType === "top"
        ? topPoints.get(fromId)
        : bottomPoints.get(fromId);

    if (!startP) return;

    setDragState({
      fromType,
      fromId,
      startPoint: startP,
      currentPoint: {
        x: e.clientX - containerRect.left,
        y: e.clientY - containerRect.top,
      },
    });

    if (fromType === "top") setSelectedTopId(fromId);
    else setSelectedBottomId(fromId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    setDragState((prev) =>
      prev
        ? {
            ...prev,
            currentPoint: {
              x: e.clientX - containerRect.left,
              y: e.clientY - containerRect.top,
            },
          }
        : null
    );
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragState) return;

    const elementUnderPointer = document.elementFromPoint(
      e.clientX,
      e.clientY
    );
    const cardEl = elementUnderPointer?.closest("[data-card-id]");

    if (cardEl) {
      const targetId = cardEl.getAttribute("data-card-id");
      const targetType = cardEl.getAttribute("data-card-type");

      const isTargetMatched = connections.some((c) =>
        targetType === "top" ? c.topId === targetId : c.bottomId === targetId
      );

      if (targetId && targetType && targetType !== dragState.fromType && !isTargetMatched) {
        const topId = dragState.fromType === "top" ? dragState.fromId : targetId;
        const bottomId = dragState.fromType === "bottom" ? dragState.fromId : targetId;
        checkPair(topId, bottomId);
        return;
      }
    }

    setDragState(null);
  };

  const isCompleted =
    topic.items.length > 0 && connections.length === topic.items.length;

  const restartGame = () => {
    setConnections([]);
    setSelectedTopId(null);
    setSelectedBottomId(null);
    setDragState(null);
    setWrongPair(null);
    setStreak(0);
  };

  // Helper for generating Bezier curve path
  const createBezierPath = (p1: Point, p2: Point) => {
    const deltaY = Math.abs(p2.y - p1.y);
    const controlOffsetY = Math.max(deltaY * 0.5, 40);
    return `M ${p1.x} ${p1.y} C ${p1.x} ${p1.y + controlOffsetY}, ${p2.x} ${p2.y - controlOffsetY}, ${p2.x} ${p2.y}`;
  };

  return (
    <div className="fixed inset-0 z-[300] overflow-y-auto flex items-center justify-center p-3 md:p-6">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
      />

      {/* Modal Box */}
      <div className="relative z-10 w-full max-w-5xl bg-slate-900 text-white rounded-3xl shadow-2xl border border-sky-500/30 p-5 md:p-8 space-y-6 animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-sky-500/20 text-sky-400 border border-sky-500/30">
                Chế độ Chữ - Chữ (Nối Dây)
              </span>
              {streak >= 2 && (
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500 text-slate-950 flex items-center gap-1 animate-bounce">
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  <span>Streak x{streak}</span>
                </span>
              )}
            </div>
            <h2 className="font-headline font-black text-2xl text-white">
              {topic.name}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Combo Toast Banner */}
        {comboToast && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-black text-sm uppercase tracking-widest rounded-full shadow-lg shadow-amber-500/30 animate-in zoom-in duration-200">
            {comboToast}
          </div>
        )}

        {/* Interactive Matching Board */}
        {isCompleted ? (
          <div className="py-16 flex flex-col items-center justify-center text-center space-y-5 bg-gradient-to-b from-sky-950/40 to-slate-900 rounded-3xl border border-sky-500/30">
            <div className="w-20 h-20 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/40 animate-bounce">
              <Trophy className="w-11 h-11 stroke-[2.5]" />
            </div>
            <div className="space-y-2">
              <h3 className="font-headline font-black text-3xl text-emerald-400">
                Xuất Sắc! Đã Nối Hoàn Thành!
              </h3>
              <p className="text-sm text-slate-400 max-w-md">
                Tất cả các vế A và B đã được nối chính xác.
              </p>
            </div>
            <button
              onClick={restartGame}
              className="px-8 py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-lg shadow-sky-500/30 flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
            >
              <RefreshCw className="w-5 h-5 stroke-[2.5]" />
              <span>Thử lại từ đầu</span>
            </button>
          </div>
        ) : (
          <div
            ref={containerRef}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="relative min-h-[420px] bg-slate-950/80 rounded-3xl p-6 border border-slate-800 flex flex-col justify-between select-none touch-none overflow-hidden"
          >
            {/* SVG Connecting Lines Overlay */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
              <defs>
                <linearGradient id="lineCorrect" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
                <linearGradient id="lineActive" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0284c7" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* Render Matched Lines */}
              {connections.map((c) => {
                const p1 = topPoints.get(c.topId);
                const p2 = bottomPoints.get(c.bottomId);
                if (!p1 || !p2) return null;

                return (
                  <path
                    key={`connected-${c.topId}-${c.bottomId}`}
                    d={createBezierPath(p1, p2)}
                    stroke="url(#lineCorrect)"
                    strokeWidth="5"
                    fill="none"
                    filter="url(#glow)"
                    className="transition-all duration-300"
                  />
                );
              })}

              {/* Render Active Tap Connection (when 1 top selected) */}
              {selectedTopId && !dragState && topPoints.get(selectedTopId) && (
                <circle
                  cx={topPoints.get(selectedTopId)!.x}
                  cy={topPoints.get(selectedTopId)!.y}
                  r="6"
                  fill="#38bdf8"
                  className="animate-ping"
                />
              )}

              {/* Render Dragging Line */}
              {dragState && (
                <path
                  d={createBezierPath(dragState.startPoint, dragState.currentPoint)}
                  stroke="url(#lineActive)"
                  strokeWidth="5"
                  strokeDasharray="6 6"
                  fill="none"
                  filter="url(#glow)"
                />
              )}

              {/* Render Wrong Pair Flash Line */}
              {wrongPair && (
                (() => {
                  const p1 = topPoints.get(wrongPair.topId);
                  const p2 = bottomPoints.get(wrongPair.bottomId);
                  if (!p1 || !p2) return null;
                  return (
                    <path
                      d={createBezierPath(p1, p2)}
                      stroke="#f43f5e"
                      strokeWidth="6"
                      fill="none"
                      filter="url(#glow)"
                      className="animate-pulse"
                    />
                  );
                })()
              )}
            </svg>

            {/* TOP ROW (Vế A) */}
            <div className="relative z-20 space-y-3">
              <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-sky-400">
                <span>Hàng A (Kéo hoặc Chạm ô để nối)</span>
                <span>{connections.length}/{topic.items.length} Hoàn thành</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                {topic.items.map((item) => {
                  const isMatched = connections.some((c) => c.topId === item.id);
                  const isSelected = selectedTopId === item.id;
                  const isWrong = wrongPair?.topId === item.id;

                  return (
                    <div
                      key={`top-${item.id}`}
                      ref={(el) => {
                        if (el) topRefs.current.set(item.id, el);
                        else topRefs.current.delete(item.id);
                      }}
                      data-card-id={item.id}
                      data-card-type="top"
                      onClick={() => handleTopClick(item.id)}
                      onPointerDown={(e) => handlePointerDown(e, "top", item.id)}
                      className={`relative min-h-[72px] p-4 rounded-2xl border-2 flex items-center justify-center text-center font-black text-base md:text-lg transition-all duration-200 cursor-pointer ${
                        isMatched
                          ? "bg-emerald-950/40 border-emerald-500 text-emerald-300 opacity-80 cursor-not-allowed shadow-lg shadow-emerald-500/10"
                          : isWrong
                          ? "bg-rose-950/60 border-rose-500 text-rose-200 animate-bounce"
                          : isSelected
                          ? "bg-sky-950 border-sky-400 text-white shadow-xl shadow-sky-500/30 scale-105 ring-4 ring-sky-500/20"
                          : "bg-slate-900 hover:bg-slate-800 border-slate-700 hover:border-sky-500/50 text-slate-100"
                      }`}
                    >
                      <span className="line-clamp-2">{item.word}</span>

                      {/* Connector Dot at Bottom Edge */}
                      <div
                        className={`absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          isMatched
                            ? "bg-emerald-500 border-emerald-300"
                            : isSelected
                            ? "bg-sky-400 border-white scale-125 animate-pulse"
                            : "bg-slate-800 border-sky-400 group-hover:bg-sky-400"
                        }`}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* BOTTOM ROW (Vế B) */}
            <div className="relative z-20 space-y-3 pt-12">
              <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-indigo-400">
                <span>Hàng B (Kết quả xáo trộn)</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                {bottomItems.map((item) => {
                  const isMatched = connections.some((c) => c.bottomId === item.id);
                  const isSelected = selectedBottomId === item.id;
                  const isWrong = wrongPair?.bottomId === item.id;

                  return (
                    <div
                      key={`bottom-${item.id}`}
                      ref={(el) => {
                        if (el) bottomRefs.current.set(item.id, el);
                        else bottomRefs.current.delete(item.id);
                      }}
                      data-card-id={item.id}
                      data-card-type="bottom"
                      onClick={() => handleBottomClick(item.id)}
                      onPointerDown={(e) => handlePointerDown(e, "bottom", item.id)}
                      className={`relative min-h-[72px] p-4 rounded-2xl border-2 flex items-center justify-center text-center font-black text-base md:text-lg transition-all duration-200 cursor-pointer ${
                        isMatched
                          ? "bg-emerald-950/40 border-emerald-500 text-emerald-300 opacity-80 cursor-not-allowed shadow-lg shadow-emerald-500/10"
                          : isWrong
                          ? "bg-rose-950/60 border-rose-500 text-rose-200 animate-bounce"
                          : isSelected
                          ? "bg-indigo-950 border-indigo-400 text-white shadow-xl shadow-indigo-500/30 scale-105 ring-4 ring-indigo-500/20"
                          : "bg-slate-900 hover:bg-slate-800 border-slate-700 hover:border-indigo-500/50 text-slate-100"
                      }`}
                    >
                      {/* Connector Dot at Top Edge */}
                      <div
                        className={`absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          isMatched
                            ? "bg-emerald-500 border-emerald-300"
                            : isSelected
                            ? "bg-indigo-400 border-white scale-125 animate-pulse"
                            : "bg-slate-800 border-indigo-400 group-hover:bg-indigo-400"
                        }`}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>

                      <span className="line-clamp-2">{item.labelB || item.word}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
