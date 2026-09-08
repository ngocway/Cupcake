"use client";

import { useState, useEffect } from "react";
import { TeacherHomeSidebar } from "./TeacherHomeSidebar";
import { MatchGameCards } from "./MatchGameCards";
import { MyMatchGamesList } from "./MyMatchGamesList";
import { ChoiceGameCards } from "./ChoiceGameCards";
import { MyChoiceGamesList } from "./MyChoiceGamesList";
import { FlipGameCards } from "./FlipGameCards";
import { MyFlipGamesList } from "./MyFlipGamesList";
import { QuizGameCards } from "./QuizGameCards";
import { MyQuizGamesList } from "./MyQuizGamesList";

interface TeacherDashboardClientProps {
  initialTab?: string;
  isAuthenticated: boolean;
}

export function TeacherDashboardClient({
  initialTab = "match",
  isAuthenticated,
}: TeacherDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(
    () => new Set([initialTab])
  );

  const handleSelectTab = (tab: string) => {
    setActiveTab(tab);
    setVisitedTabs((prev) => {
      if (prev.has(tab)) return prev;
      const next = new Set(prev);
      next.add(tab);
      return next;
    });

    // Shallow URL update without triggering Next.js RSC server roundtrip
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.pushState(null, "", url.pathname + url.search);
    }
  };

  // Sync with browser Back / Forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const url = new URL(window.location.href);
      const tab = url.searchParams.get("tab") || "match";
      setActiveTab(tab);
      setVisitedTabs((prev) => {
        if (prev.has(tab)) return prev;
        const next = new Set(prev);
        next.add(tab);
        return next;
      });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return (
    <div className="w-full pb-20 flex flex-col lg:flex-row items-stretch lg:items-start gap-2 lg:gap-10 px-4 md:px-10 max-w-[1600px] mx-auto">
      {/* Sidebar with instant client-side tab switching */}
      <TeacherHomeSidebar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
      />

      {/* Main Workspace with Tab Keep-Alive */}
      <main className="w-full flex-1 min-w-0 min-h-[500px]">
        {/* 1. Nối cặp (Match Cards) */}
        {visitedTabs.has("match") && (
          <div className={activeTab === "match" ? "block" : "hidden"}>
            <MatchGameCards />
          </div>
        )}

        {/* 2. Bài tập Nối cặp đã tạo */}
        {visitedTabs.has("my-match-games") && (
          <div className={activeTab === "my-match-games" ? "block" : "hidden"}>
            <MyMatchGamesList />
          </div>
        )}

        {/* 3. Toán học (Choice Cards) */}
        {visitedTabs.has("choice") && (
          <div className={activeTab === "choice" ? "block" : "hidden"}>
            <ChoiceGameCards />
          </div>
        )}

        {/* 4. Bài tập Toán học đã tạo */}
        {visitedTabs.has("my-choice-games") && (
          <div className={activeTab === "my-choice-games" ? "block" : "hidden"}>
            <MyChoiceGamesList />
          </div>
        )}

        {/* 5. Lật ảnh (Flip Cards) */}
        {visitedTabs.has("flip") && (
          <div className={activeTab === "flip" ? "block" : "hidden"}>
            <FlipGameCards />
          </div>
        )}

        {/* 6. Bài tập Lật ảnh đã tạo */}
        {visitedTabs.has("my-flip-games") && (
          <div className={activeTab === "my-flip-games" ? "block" : "hidden"}>
            <MyFlipGamesList />
          </div>
        )}

        {/* 7. Trắc nghiệm (Quiz Cards) */}
        {visitedTabs.has("quiz") && (
          <div className={activeTab === "quiz" ? "block" : "hidden"}>
            <QuizGameCards />
          </div>
        )}

        {/* 8. Bài tập Trắc nghiệm đã tạo */}
        {visitedTabs.has("my-quiz-games") && (
          <div className={activeTab === "my-quiz-games" ? "block" : "hidden"}>
            <MyQuizGamesList />
          </div>
        )}

        {/* 9. Điền ô trống (Placeholder) */}
        {visitedTabs.has("fill") && (
          <div className={activeTab === "fill" ? "block" : "hidden"}>
            <div className="w-full h-full min-h-[400px] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-primary/10 p-8 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center mb-4 shadow-sm">
                <span className="material-symbols-outlined text-[36px]">edit_note</span>
              </div>
              <h3 className="font-headline font-black text-xl text-slate-700 dark:text-slate-200">
                Điền ô trống
              </h3>
              <p className="text-xs text-slate-400 font-medium max-w-sm mt-1">
                Nội dung dạng game Điền ô trống sẽ được cập nhật theo yêu cầu tiếp theo.
              </p>
            </div>
          </div>
        )}

        {/* 10. Bài tập Điền ô trống đã tạo (Placeholder) */}
        {visitedTabs.has("my-fill-games") && (
          <div className={activeTab === "my-fill-games" ? "block" : "hidden"}>
            <div className="w-full h-full min-h-[400px] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-primary/10 p-8 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center mb-4 shadow-sm">
                <span className="material-symbols-outlined text-[36px]">assignment</span>
              </div>
              <h3 className="font-headline font-black text-xl text-slate-700 dark:text-slate-200">
                Bài tập Điền ô trống đã tạo
              </h3>
              <p className="text-xs text-slate-400 font-medium max-w-sm mt-1">
                Bạn chưa tạo bài tập Điền ô trống nào.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
