"use client";

import { useContentStore } from "@/store/useContentStore";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { useMemo, useState, useEffect } from "react";
import Link from "next/link";

export function SidebarContentTypeMenu() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();

  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("english_menu_open");
    if (saved !== null) {
      setIsOpen(saved === "true");
    }

    const handleToggle = (e: any) => {
      setIsOpen(e.detail.open);
    };
    window.addEventListener("toggle-english-menu", handleToggle);
    return () => window.removeEventListener("toggle-english-menu", handleToggle);
  }, []);

  const studyAgeGroup = useContentStore((s) => (s as any).studyAgeGroup) || "";

  const isKindergarten = useMemo(() => {
    const ag = studyAgeGroup.toLowerCase();
    return ag.includes("kindergarten") || ag.includes("kindergarden") || ag === "kids-2-5";
  }, [studyAgeGroup]);

  const isKid = studyAgeGroup === "kid" || studyAgeGroup.toLowerCase().includes("kid");
  const isTeen = studyAgeGroup === "teen" || studyAgeGroup.toLowerCase().includes("teen");
  const isLearner = studyAgeGroup === "learner" || studyAgeGroup.toLowerCase().includes("learner") || studyAgeGroup.toLowerCase().includes("adult");

  // Determine available tabs based on age group filtering logic
  const availableTabIds = useMemo(() => {
    if (isKindergarten) return ["flashcards", "games"];
    if (isKid || isTeen) return ["flashcards", "games", "lessons", "exercises"];
    if (isLearner) return ["lessons", "exercises", "flashcards", "games"];
    return ["lessons", "exercises", "flashcards", "games"];
  }, [isKindergarten, isKid, isTeen, isLearner]);

  const activeTab = searchParams.get("tab") || availableTabIds[0];

  const pathname = usePathname();

  const handleSelectTab = (tabId: string) => {
    if (tabId === activeTab && pathname === "/") return;
    // If not on home page, always navigate home with the selected tab
    if (pathname !== "/") {
      router.push(`/?tab=${tabId}`, { scroll: false });
      return;
    }
    const p = new URLSearchParams(window.location.search);
    p.set("tab", tabId);
    router.push(`?${p.toString()}`, { scroll: false });
  };

  const showFlashcards = availableTabIds.includes("flashcards");
  const showGames = availableTabIds.includes("games");
  const showExercises = availableTabIds.includes("exercises");
  const showLessons = availableTabIds.includes("lessons");

  return (
    <div className="flex flex-col w-full text-[#3E3524] select-none">
      {/* Dynamic Font Loading for Baloo 2 and Material Symbols Rounded */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Nunito:wght@400;600;700;800&family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,500,1,0" rel="stylesheet" />

      <style>{`
        /* Scoped styles with hex codes directly to match user html exactly */
        .cefr-redesign-section-label {
          font-family: 'Baloo 2', 'Nunito', sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .06em;
          color: #8C826D;
          text-transform: uppercase;
          padding: 0 2px;
          margin-bottom: 8px;
        }

        .cefr-redesign-tile-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .cefr-redesign-tile {
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          border: 2px solid transparent;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          cursor: pointer;
          border-radius: 20px 14px 20px 16px;
        }

        .cefr-redesign-tile:nth-child(odd):hover {
          transform: scale(1.05) rotate(-1.5deg);
          box-shadow: 0 8px 18px rgba(62, 53, 36, 0.1);
        }

        .cefr-redesign-tile:nth-child(even):hover {
          transform: scale(1.05) rotate(1.5deg);
          box-shadow: 0 8px 18px rgba(62, 53, 36, 0.1);
        }

        .cefr-redesign-tile:active {
          transform: scale(0.98);
        }

        /* Micro-interaction Keyframes */
        @keyframes book-shake {
          0%, 100% { transform: rotate(0); }
          25% { transform: rotate(-7deg); }
          75% { transform: rotate(7deg); }
        }
        @keyframes flash-flip-anim {
          0%, 100% { transform: rotate(0) scale(1); }
          50% { transform: rotate(12deg) scale(1.12); }
        }
        @keyframes wiggle-gamepad {
          0%, 100% { transform: rotate(0); }
          25% { transform: rotate(-10deg) scale(1.1); }
          75% { transform: rotate(10deg) scale(1.1); }
        }
        @keyframes pencil-write-anim {
          0%, 100% { transform: translate(0, 0) rotate(0); }
          50% { transform: translate(3px, -3px) rotate(12deg); }
        }
        @keyframes book-float-anim {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        /* Micro-interactions applied on hover */
        .cefr-redesign-tile.lessons:hover .cefr-redesign-tile-icon .material-symbols-rounded {
          animation: book-shake 0.6s ease-in-out infinite;
        }
        .cefr-redesign-tile.flash:hover .cefr-redesign-tile-icon .material-symbols-rounded {
          animation: flash-flip-anim 0.6s ease-in-out infinite;
        }
        .cefr-redesign-tile.games:hover .cefr-redesign-tile-icon .material-symbols-rounded {
          animation: wiggle-gamepad 0.5s ease-in-out infinite;
        }
        .cefr-redesign-tile.exercise:hover .cefr-redesign-tile-icon .material-symbols-rounded {
          animation: pencil-write-anim 0.6s ease-in-out infinite;
        }
        .cefr-redesign-tile.story:hover .cefr-redesign-tile-icon .material-symbols-rounded {
          animation: book-float-anim 0.8s ease-in-out infinite;
        }

        .cefr-redesign-tile-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
        }

        .cefr-redesign-tile-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent !important;
          box-shadow: none !important;
        }
 
        .cefr-redesign-tile-icon .material-symbols-rounded {
          font-size: 26px !important;
        }

        .cefr-redesign-tile-label {
          font-family: 'Baloo 2', 'Nunito', sans-serif;
          font-weight: 800;
          font-size: 15px;
          margin-top: 2px;
        }

        /* Individual Pastel Frame colors and matching text colors */
        .cefr-redesign-tile.lessons { background: #C4EFE0 !important; }
        .cefr-redesign-tile.lessons .cefr-redesign-tile-icon { color: #0B7A58; }
        .cefr-redesign-tile.lessons .cefr-redesign-tile-label { color: #0B7A58; }
        .cefr-redesign-tile.lessons.active { border-color: #0B7A58; box-shadow: 0 0 10px rgba(11, 122, 88, 0.2); }

        .cefr-redesign-tile.flash { background: #DFD7FC !important; }
        .cefr-redesign-tile.flash .cefr-redesign-tile-icon { color: #7B5CFA; }
        .cefr-redesign-tile.flash .cefr-redesign-tile-label { color: #5A3EDB; }
        .cefr-redesign-tile.flash.active { border-color: #7B5CFA; box-shadow: 0 0 10px rgba(123, 92, 250, 0.2); }

        .cefr-redesign-tile.games { background: #FCD5DF !important; }
        .cefr-redesign-tile.games .cefr-redesign-tile-icon { color: #FF6F96; }
        .cefr-redesign-tile.games .cefr-redesign-tile-label { color: #D9436C; }
        .cefr-redesign-tile.games.active { border-color: #FF6F96; box-shadow: 0 0 10px rgba(255, 111, 150, 0.2); }

        .cefr-redesign-tile.exercise { background: #CFE9FC !important; }
        .cefr-redesign-tile.exercise .cefr-redesign-tile-icon { color: #3FA9F5; }
        .cefr-redesign-tile.exercise .cefr-redesign-tile-label { color: #1C7FC2; }
        .cefr-redesign-tile.exercise.active { border-color: #3FA9F5; box-shadow: 0 0 10px rgba(63, 169, 245, 0.2); }

        .cefr-redesign-tile.story { background: #FFE0CC !important; }
        .cefr-redesign-tile.story .cefr-redesign-tile-icon { color: #E26D33; }
        .cefr-redesign-tile.story .cefr-redesign-tile-label { color: #E26D33; }

        /* dolbot cta button - Modern Glassmorphism */
        @keyframes robot-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }

        .cefr-redesign-dolbot-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          background: linear-gradient(135deg, rgba(123, 92, 250, 0.85), rgba(90, 62, 219, 0.95)) !important;
          color: #FFFFFF !important;
          border-radius: 16px;
          padding: 13px 14px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.25);
        }

        .cefr-redesign-dolbot-btn:hover {
          transform: translateY(-3px);
          background: linear-gradient(135deg, rgba(123, 92, 250, 0.95), rgba(255, 111, 150, 0.95)) !important;
          box-shadow: 0 6px 14px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.35);
        }

        .cefr-redesign-dolbot-btn:hover .material-symbols-rounded {
          animation: robot-float 1s ease-in-out infinite;
        }

        .cefr-redesign-dolbot-btn:active {
          transform: translateY(-1px);
        }

        .cefr-redesign-dolbot-btn .material-symbols-rounded {
          font-size: 20px !important;
          color: #FFFFFF !important;
          transition: transform 0.3s ease;
        }

        .cefr-redesign-dolbot-text {
          font-family: 'Baloo 2', 'Nunito', sans-serif;
          font-weight: 700;
          font-size: 14px;
          color: #FFFFFF !important;
        }

        .cefr-redesign-dolbot-badge {
          margin-left: auto;
          background: rgba(255, 255, 255, 0.25) !important;
          border: 1px solid rgba(255, 255, 255, 0.3);
          font-size: 10px;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 999px;
          letter-spacing: .03em;
          color: #FFFFFF !important;
        }

        /* Ensure material symbols rounded render properly */
        .material-symbols-rounded {
          font-family: 'Material Symbols Rounded' !important;
          font-weight: normal;
          font-style: normal;
          font-size: 24px;
          line-height: 1;
          letter-spacing: normal;
          text-transform: none;
          display: inline-block;
          white-space: nowrap;
          word-wrap: normal;
          direction: ltr;
          -webkit-font-smoothing: antialiased;
        }
      `}</style>

      {/* Container wrapper (no overflow clipping) */}
      <div className="flex flex-col gap-4 mt-1">
        {/* Luyện tập nhanh section */}
        <div>
          <p className="cefr-redesign-section-label">
            {locale === "vi" ? "Luyện tập nhanh" : "Quick Practice"}
          </p>
          <div className="cefr-redesign-tile-grid">
            {/* Lessons */}
            {showLessons && (
              <div
                onClick={() => handleSelectTab("lessons")}
                className={`cefr-redesign-tile lessons ${activeTab === "lessons" ? "active" : ""}`}
              >
                <div className="cefr-redesign-tile-top">
                  <div className="cefr-redesign-tile-icon">
                    <span className="material-symbols-rounded">menu_book</span>
                  </div>
                </div>
                <p className="cefr-redesign-tile-label">
                  {locale === "vi" ? "Bài học" : "Lessons"}
                </p>
              </div>
            )}

            {/* Flashcards */}
            {showFlashcards && (
              <div
                onClick={() => handleSelectTab("flashcards")}
                className={`cefr-redesign-tile flash ${activeTab === "flashcards" ? "active" : ""}`}
              >
                <div className="cefr-redesign-tile-top">
                  <div className="cefr-redesign-tile-icon">
                    <span className="material-symbols-rounded">layers</span>
                  </div>
                </div>
                <p className="cefr-redesign-tile-label">
                  {locale === "vi" ? "Flashcards" : "Flashcards"}
                </p>
              </div>
            )}

            {/* Games */}
            {showGames && (
              <div
                onClick={() => handleSelectTab("games")}
                className={`cefr-redesign-tile games ${activeTab === "games" ? "active" : ""}`}
              >
                <div className="cefr-redesign-tile-top">
                  <div className="cefr-redesign-tile-icon">
                    <span className="material-symbols-rounded">sports_esports</span>
                  </div>
                </div>
                <p className="cefr-redesign-tile-label">
                  {locale === "vi" ? "Trò chơi" : "Games"}
                </p>
              </div>
            )}

            {/* Exercises */}
            {showExercises && (
              <div
                onClick={() => handleSelectTab("exercises")}
                className={`cefr-redesign-tile exercise ${activeTab === "exercises" ? "active" : ""}`}
              >
                <div className="cefr-redesign-tile-top">
                  <div className="cefr-redesign-tile-icon">
                    <span className="material-symbols-rounded">quiz</span>
                  </div>
                </div>
                <p className="cefr-redesign-tile-label">
                  {locale === "vi" ? "Bài tập" : "Exercises"}
                </p>
              </div>
            )}

            {/* Shadowing by Books */}
            <Link
              href="/student/books"
              className="cefr-redesign-tile story decoration-transparent text-inherit"
            >
              <div className="cefr-redesign-tile-top">
                <div className="cefr-redesign-tile-icon">
                  <span className="material-symbols-rounded">auto_stories</span>
                </div>
              </div>
              <p className="cefr-redesign-tile-label">
                {locale === "vi" ? "Shadowing by Books" : "Shadowing by Books"}
              </p>
            </Link>
          </div>
        </div>

        {/* Dolbot Chat button */}
        <Link href="/student/game/robot-chat" className="decoration-transparent text-inherit">
          <div className="cefr-redesign-dolbot-btn">
            <span className="material-symbols-rounded">smart_toy</span>
            <span className="cefr-redesign-dolbot-text">
              {locale === "vi" ? "Chat với Dolbot" : "Chat with Dolbot"}
            </span>
            <span className="cefr-redesign-dolbot-badge">AI</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
