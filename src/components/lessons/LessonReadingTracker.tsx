"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Clock, CheckCircle2, BookOpen } from "lucide-react";
import { completeClassActivityAction } from "@/actions/activity-completion-actions";

interface LessonReadingTrackerProps {
  assignmentId?: string;
  initialCompleted?: boolean;
}

const REQUIRED_SECONDS = 30;

export function LessonReadingTracker({
  assignmentId: propAssignmentId,
  initialCompleted = false,
}: LessonReadingTrackerProps) {
  const searchParams = useSearchParams();
  const assignmentId = propAssignmentId || searchParams?.get("assignmentId");

  const [activeSeconds, setActiveSeconds] = useState(0);
  const [isCompleted, setIsCompleted] = useState(initialCompleted);
  const [isTabActive, setIsTabActive] = useState(true);

  const activeSecondsRef = useRef(0);
  const isCompletedRef = useRef(isCompleted);
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    isCompletedRef.current = isCompleted;
  }, [isCompleted]);

  // Track window visibility & focus to ensure only real active reading time is counted
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === "visible";
      setIsTabActive(isVisible);
    };

    const handleFocus = () => setIsTabActive(true);
    const handleBlur = () => setIsTabActive(false);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  // Interval timer for active seconds
  useEffect(() => {
    if (isCompleted) return;

    const interval = setInterval(() => {
      // Only count when the tab is currently focused and visible
      if (document.visibilityState === "visible" && !document.hidden) {
        setActiveSeconds((prev) => {
          const next = prev + 1;
          activeSecondsRef.current = next;

          if (next >= REQUIRED_SECONDS && !hasTriggeredRef.current) {
            hasTriggeredRef.current = true;
            setIsCompleted(true);

            // Tự động ngầm ghi nhận hoàn thành vào database
            if (assignmentId) {
              completeClassActivityAction({ assignmentId, score: null }).catch((err) => {
                console.error("Failed to auto-complete lesson:", err);
              });
            }
          }
          return next;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isCompleted, assignmentId]);

  // Progress percentage (0 - 100%)
  const progressPercent = Math.min(100, Math.round((activeSeconds / REQUIRED_SECONDS) * 100));

  return (
    <aside 
      aria-label="Tiến trình học lý thuyết"
      className="fixed bottom-5 right-5 z-40 animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-auto"
    >
      <div
        className={`flex items-center gap-2.5 px-3.5 py-2 rounded-2xl shadow-lg border backdrop-blur-md transition-all duration-300 ${
          isCompleted
            ? "bg-emerald-500/90 text-white border-emerald-400/50 shadow-emerald-500/20"
            : isTabActive
            ? "bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-100 border-indigo-200 dark:border-indigo-900/50 shadow-indigo-500/10"
            : "bg-slate-100/90 dark:bg-slate-800/90 text-slate-500 border-slate-300/50 opacity-75"
        }`}
      >
        {isCompleted ? (
          <CheckCircle2 className="w-4 h-4 text-white shrink-0 animate-in zoom-in-75 duration-200" />
        ) : (
          <div className="relative w-4 h-4 shrink-0 flex items-center justify-center">
            {/* Circular mini progress */}
            <svg className="w-4 h-4 -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-200 dark:text-slate-700"
                strokeWidth="4"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-indigo-600 dark:text-indigo-400 transition-all duration-500"
                strokeDasharray={`${progressPercent}, 100`}
                strokeWidth="4"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
          </div>
        )}

        <div className="flex flex-col text-left">
          <span className="text-[11px] font-black leading-tight">
            {isCompleted
              ? "Đã hoàn thành lý thuyết"
              : isTabActive
              ? `Đọc bài: ${activeSeconds}s / ${REQUIRED_SECONDS}s`
              : "Tạm dừng (đang rời tab)"}
          </span>
          {!isCompleted && (
            <span className="text-[9px] opacity-70 font-semibold leading-tight">
              {isTabActive ? "Đang đếm thời gian đọc thực" : "Chuyển lại tab để tiếp tục đếm"}
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}
