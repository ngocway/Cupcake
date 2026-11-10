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
import { MyLibraryList } from "./MyLibraryList";
import { GlobalSuccessLibraryList } from "./GlobalSuccessLibraryList";
import {
  getTeacherLibrarySetsAction,
  getGlobalSuccessLibrarySetsAction,
} from "@/actions/teacher-library-actions";
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
  const normalizeTab = (tab: string) => (tab === "lib-flip" ? "lib-match" : tab);
  const normalizedInitialTab = normalizeTab(initialTab);
  const isProtectedTab = (tab: string) => tab.startsWith("my-") || tab.startsWith("lib-");
  const safeInitialTab =
    !isAuthenticated && isProtectedTab(normalizedInitialTab) ? "match" : normalizedInitialTab;

  const [activeTab, setActiveTab] = useState<string>(safeInitialTab);
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(
    () => new Set([safeInitialTab])
  );
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [pendingRedirectUrl, setPendingRedirectUrl] = useState<string>("/teacher");
  const [libraryCounts, setLibraryCounts] = useState<{
    match: number | null;
    quiz: number | null;
    choice: number | null;
  }>({ match: null, quiz: null, choice: null });

  const refreshLibraryCountsFromStorage = () => {
    if (typeof window === "undefined") return;
    try {
      const parseCount = (key: string): number | null => {
        const raw = sessionStorage.getItem(key);
        if (!raw) return null;
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr.length : null;
      };
      setLibraryCounts({
        match: parseCount("cached_teacher_library_match"),
        quiz: parseCount("cached_teacher_library_quiz"),
        choice: parseCount("cached_teacher_library_choice"),
      });
    } catch {}
  };

  useEffect(() => {
    if (!isAuthenticated || typeof window === "undefined") return;
    refreshLibraryCountsFromStorage();
    const handler = () => refreshLibraryCountsFromStorage();
    window.addEventListener("teacher-library-updated", handler);
    return () => window.removeEventListener("teacher-library-updated", handler);
  }, [isAuthenticated]);

  const handleRequireAuth = (targetHref: string, gameId?: string, gameTitle?: string) => {
    trackEvent("teacher_auth_prompt", { targetUrl: targetHref, gameId: gameId || "", gameTitle: gameTitle || "" });
    if (typeof window !== "undefined") window.dispatchEvent(new Event("hide-global-loader"));
    setPendingRedirectUrl(targetHref);
    setLoginModalOpen(true);
  };

  // If unauthenticated user navigated directly to a protected tab or returned with RoleStudentExists error, open Teacher Login modal
  useEffect(() => {
    if (!isAuthenticated && isProtectedTab(initialTab)) {
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
    if (isAuthenticated && normalizedInitialTab && activeTab !== normalizedInitialTab) {
      setActiveTab(normalizedInitialTab);
      setVisitedTabs((prev) => {
        if (prev.has(normalizedInitialTab)) return prev;
        const next = new Set(prev);
        next.add(normalizedInitialTab);
        return next;
      });
    }
  }, [isAuthenticated, normalizedInitialTab]);

  const handleSelectTab = (rawTab: string) => {
    const tab = normalizeTab(rawTab);
    trackEvent("teacher_category_click", { tab, isAuthenticated });
    if (isProtectedTab(tab) && !isAuthenticated) {
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
      const tab = normalizeTab(url.searchParams.get("tab") || "match");
      if (isProtectedTab(tab) && !isAuthenticated) {
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

  // Background pre-warm My Library caches so clicking My Library tabs is instant (0ms)
  useEffect(() => {
    if (!isAuthenticated || typeof window === "undefined") return;
    const timer = setTimeout(() => {
      try {
        if (!sessionStorage.getItem("cached_teacher_library_match")) {
          getTeacherLibrarySetsAction("match").then((res) => {
            if (res.success && Array.isArray(res.sets)) {
              try {
                sessionStorage.setItem("cached_teacher_library_match", JSON.stringify(res.sets));
                const flipSets = res.sets.filter(
                  (s) => s.subType === "image-text" || s.subType === "image-image"
                );
                sessionStorage.setItem("cached_teacher_library_flip", JSON.stringify(flipSets));
                window.dispatchEvent(new CustomEvent("teacher-library-updated"));
              } catch {}
            }
          });
        }
        if (!sessionStorage.getItem("cached_teacher_library_quiz")) {
          getTeacherLibrarySetsAction("quiz").then((res) => {
            if (res.success && Array.isArray(res.sets)) {
              try {
                sessionStorage.setItem("cached_teacher_library_quiz", JSON.stringify(res.sets));
                window.dispatchEvent(new CustomEvent("teacher-library-updated"));
              } catch {}
            }
          });
        }
        if (!sessionStorage.getItem("cached_teacher_library_choice")) {
          getTeacherLibrarySetsAction("choice").then((res) => {
            if (res.success && Array.isArray(res.sets)) {
              try {
                sessionStorage.setItem("cached_teacher_library_choice", JSON.stringify(res.sets));
                window.dispatchEvent(new CustomEvent("teacher-library-updated"));
              } catch {}
            }
          });
        }
        if (!sessionStorage.getItem("cached_global_success_sets_v2")) {
          getGlobalSuccessLibrarySetsAction().then((res) => {
            if (res.success && Array.isArray(res.sets)) {
              try {
                sessionStorage.setItem("cached_global_success_sets_v2", JSON.stringify(res.sets));
              } catch {}
            }
          });
        }
      } catch {}
    }, 600);

    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  return (
    <div className="w-full pb-20 flex flex-col lg:flex-row items-stretch lg:items-start gap-2 lg:gap-10 px-4 md:px-10 max-w-[1600px] mx-auto">
      {/* Sidebar with instant client-side tab switching */}
      <TeacherHomeSidebar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        libraryCounts={isAuthenticated ? libraryCounts : undefined}
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

        {/* 8.5. Sách Giáo Khoa Global Success (Global Success Library) */}
        {isAuthenticated && visitedTabs.has("lib-global") && (
          <div className={activeTab === "lib-global" ? "block space-y-6" : "hidden"}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-headline font-black text-2xl text-slate-800 dark:text-white tracking-tight">
                  📘 {t.sidebar.libraryGlobalTitle}
                </h2>
                <p className="text-xs font-semibold text-slate-400 mt-1">
                  {t.sidebar.libraryGlobalSub}
                </p>
              </div>
              <TeacherLocaleSwitch />
            </div>
            <GlobalSuccessLibraryList />
          </div>
        )}

        {/* 9. Thư viện Nối cặp (Matching Library) */}
        {isAuthenticated && visitedTabs.has("lib-match") && (
          <div className={activeTab === "lib-match" ? "block space-y-6" : "hidden"}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-headline font-black text-2xl text-slate-800 dark:text-white tracking-tight">
                  {t.sidebar.libraryMatchTitle}
                </h2>
                <p className="text-xs font-semibold text-slate-400 mt-1">
                  {t.sidebar.libraryMatchSub}
                </p>
              </div>
              <TeacherLocaleSwitch />
            </div>
            <MyLibraryList category="match" />
          </div>
        )}

        {/* 10. Thư viện Toán học (Math Library) */}
        {isAuthenticated && visitedTabs.has("lib-choice") && (
          <div className={activeTab === "lib-choice" ? "block space-y-6" : "hidden"}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-headline font-black text-2xl text-slate-800 dark:text-white tracking-tight">
                  {t.sidebar.libraryMathTitle}
                </h2>
                <p className="text-xs font-semibold text-slate-400 mt-1">
                  {t.sidebar.libraryMathSub}
                </p>
              </div>
              <TeacherLocaleSwitch />
            </div>
            <MyLibraryList category="choice" />
          </div>
        )}

        {/* 11. Thư viện Lật ảnh (Flip Cards Library) */}
        {isAuthenticated && visitedTabs.has("lib-flip") && (
          <div className={activeTab === "lib-flip" ? "block space-y-6" : "hidden"}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-headline font-black text-2xl text-slate-800 dark:text-white tracking-tight">
                  {t.sidebar.libraryFlipTitle}
                </h2>
                <p className="text-xs font-semibold text-slate-400 mt-1">
                  {t.sidebar.libraryFlipSub}
                </p>
              </div>
              <TeacherLocaleSwitch />
            </div>
            <MyLibraryList category="flip" />
          </div>
        )}

        {/* 12. Thư viện Trắc nghiệm (Quiz Library) */}
        {isAuthenticated && visitedTabs.has("lib-quiz") && (
          <div className={activeTab === "lib-quiz" ? "block space-y-6" : "hidden"}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-headline font-black text-2xl text-slate-800 dark:text-white tracking-tight">
                  {t.sidebar.libraryQuizTitle}
                </h2>
                <p className="text-xs font-semibold text-slate-400 mt-1">
                  {t.sidebar.libraryQuizSub}
                </p>
              </div>
              <TeacherLocaleSwitch />
            </div>
            <MyLibraryList category="quiz" />
          </div>
        )}

        {/* 13. Điền ô trống (Placeholder) */}
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

        {/* 14. Bài tập Điền ô trống đã tạo (Placeholder) */}
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
