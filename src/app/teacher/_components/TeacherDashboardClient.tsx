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
import { LoginModal } from "@/components/LoginButton";
import { trackEvent } from "@/lib/analytics";
import { TeacherLocaleSwitch, useTeacherLocale } from "@/i18n/teacher-locale";

interface TeacherDashboardClientProps {
  initialTab?: string;
  isAuthenticated: boolean;
}

export function TeacherDashboardClient({
  initialTab = "match",
  isAuthenticated,
}: TeacherDashboardClientProps) {
  const { t } = useTeacherLocale();
  const safeInitialTab =
    !isAuthenticated && initialTab.startsWith("my-") ? "match" : initialTab;

  const [activeTab, setActiveTab] = useState<string>(safeInitialTab);
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(
    () => new Set([safeInitialTab])
  );
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [pendingRedirectUrl, setPendingRedirectUrl] = useState<string>("/teacher");

  const handleRequireAuth = (targetHref: string, gameId?: string, gameTitle?: string) => {
    trackEvent("teacher_auth_prompt", { targetUrl: targetHref, gameId: gameId || "", gameTitle: gameTitle || "" });
    if (typeof window !== "undefined") window.dispatchEvent(new Event("hide-global-loader")); setPendingRedirectUrl(targetHref);
    setLoginModalOpen(true);
  };

  // If unauthenticated user navigated directly to a "my-*-games" tab or returned with RoleStudentExists error, open Teacher Login modal
  useEffect(() => {
    if (!isAuthenticated && initialTab.startsWith("my-")) {
      setPendingRedirectUrl(`/teacher?tab=${initialTab}`);
      setLoginModalOpen(true);
    } else if (!isAuthenticated && typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("error") === "RoleStudentExists") {
        setLoginModalOpen(true);
      }
    }
  }, [isAuthenticated, initialTab]);

  // If authentication state updates to true (e.g. after router.refresh()) and pendingRedirectUrl is a /teacher?tab=... URL, sync the activeTab
  useEffect(() => {
    if (isAuthenticated && initialTab && activeTab !== initialTab) {
      setActiveTab(initialTab);
      setVisitedTabs((prev) => {
        if (prev.has(initialTab)) return prev;
        const next = new Set(prev);
        next.add(initialTab);
        return next;
      });
    }
  }, [isAuthenticated, initialTab]);

  const handleSelectTab = (tab: string) => {
    trackEvent("teacher_category_click", { tab, isAuthenticated });
    // Option A: Clicking "Bài tập đã tạo" tabs when not authenticated as Teacher immediately opens Teacher Login modal
    if (tab.startsWith("my-") && !isAuthenticated) {
      handleRequireAuth(`/teacher?tab=${tab}`);
      return;
    }

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
      if (tab.startsWith("my-") && !isAuthenticated) {
        handleRequireAuth(`/teacher?tab=${tab}`);
        return;
      }
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
  }, [isAuthenticated]);

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
            <MatchGameCards
              isAuthenticated={isAuthenticated}
              onRequireAuth={handleRequireAuth}
            />
          </div>
        )}

        {/* 2. Bài tập Nối cặp đã tạo */}
        {isAuthenticated && visitedTabs.has("my-match-games") && (
          <div className={activeTab === "my-match-games" ? "block space-y-6" : "hidden"}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-headline font-black text-2xl text-slate-800 dark:text-white tracking-tight">
                  {t.sidebar.createdMatchTitle}
                </h2>
                <p className="text-xs font-semibold text-slate-400 mt-1">
                  {t.sidebar.createdMatchSub}
                </p>
              </div>
              <TeacherLocaleSwitch />
            </div>
            <MyMatchGamesList />
          </div>
        )}

        {/* 3. Toán học (Choice Cards) */}
        {visitedTabs.has("choice") && (
          <div className={activeTab === "choice" ? "block" : "hidden"}>
            <ChoiceGameCards
              isAuthenticated={isAuthenticated}
              onRequireAuth={handleRequireAuth}
            />
          </div>
        )}

        {/* 4. Bài tập Toán học đã tạo */}
        {isAuthenticated && visitedTabs.has("my-choice-games") && (
          <div className={activeTab === "my-choice-games" ? "block space-y-6" : "hidden"}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-headline font-black text-2xl text-slate-800 dark:text-white tracking-tight">
                  {t.sidebar.createdMathTitle}
                </h2>
                <p className="text-xs font-semibold text-slate-400 mt-1">
                  {t.sidebar.createdMathSub}
                </p>
              </div>
              <TeacherLocaleSwitch />
            </div>
            <MyChoiceGamesList />
          </div>
        )}

        {/* 5. Lật ảnh (Flip Cards) */}
        {visitedTabs.has("flip") && (
          <div className={activeTab === "flip" ? "block" : "hidden"}>
            <FlipGameCards
              isAuthenticated={isAuthenticated}
              onRequireAuth={handleRequireAuth}
            />
          </div>
        )}

        {/* 6. Bài tập Lật ảnh đã tạo */}
        {isAuthenticated && visitedTabs.has("my-flip-games") && (
          <div className={activeTab === "my-flip-games" ? "block space-y-6" : "hidden"}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-headline font-black text-2xl text-slate-800 dark:text-white tracking-tight">
                  {t.sidebar.createdFlipTitle}
                </h2>
                <p className="text-xs font-semibold text-slate-400 mt-1">
                  {t.sidebar.createdFlipSub}
                </p>
              </div>
              <TeacherLocaleSwitch />
            </div>
            <MyFlipGamesList />
          </div>
        )}

        {/* 7. Trắc nghiệm (Quiz Cards) */}
        {visitedTabs.has("quiz") && (
          <div className={activeTab === "quiz" ? "block" : "hidden"}>
            <QuizGameCards
              isAuthenticated={isAuthenticated}
              onRequireAuth={handleRequireAuth}
            />
          </div>
        )}

        {/* 8. Bài tập Trắc nghiệm đã tạo */}
        {isAuthenticated && visitedTabs.has("my-quiz-games") && (
          <div className={activeTab === "my-quiz-games" ? "block space-y-6" : "hidden"}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-headline font-black text-2xl text-slate-800 dark:text-white tracking-tight">
                  {t.sidebar.createdQuizTitle}
                </h2>
                <p className="text-xs font-semibold text-slate-400 mt-1">
                  {t.sidebar.createdQuizSub}
                </p>
              </div>
              <TeacherLocaleSwitch />
            </div>
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
        {isAuthenticated && visitedTabs.has("my-fill-games") && (
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

      {/* Teacher Login Modal on Demand (with Smart Redirect to clicked game or tab) */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        defaultView="teacherLogin"
        callbackUrl={pendingRedirectUrl}
      />
    </div>
  );
}
