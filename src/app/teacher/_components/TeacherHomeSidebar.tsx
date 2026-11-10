import { StickySidebarWrapper } from "@/app/_components/StickySidebarWrapper";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useTeacherLocale } from "@/i18n/teacher-locale";
import {
  PlusCircle,
  ChevronDown,
  Puzzle,
  Calculator,
  FileEdit,
  Lock,
  Layers,
  HelpCircle,
  Library,
  BookOpen,
  FolderHeart,
  FolderOpen,
  Copy,
  ClipboardList,
} from "lucide-react";

export type TeacherPortalTab =
  | "match"
  | "choice"
  | "fill"
  | "flip"
  | "quiz"
  | "my-match-games"
  | "my-choice-games"
  | "my-fill-games"
  | "my-flip-games"
  | "my-quiz-games"
  | "lib-global"
  | "lib-match"
  | "lib-choice"
  | "lib-flip"
  | "lib-quiz";

interface TeacherHomeSidebarProps {
  activeTab?: string;
  onSelectTab?: (tab: TeacherPortalTab) => void;
  libraryCounts?: {
    match: number | null;
    quiz: number | null;
    choice: number | null;
  };
}

export function TeacherHomeSidebar({
  activeTab: propActiveTab,
  onSelectTab,
  libraryCounts,
}: TeacherHomeSidebarProps = {}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTeacherLocale();

  const rawActiveTab = propActiveTab ?? (searchParams?.get("tab") || "match");
  const activeTab =
    rawActiveTab === "fill" || rawActiveTab === "my-fill-games"
      ? "match"
      : rawActiveTab === "lib-flip"
      ? "lib-match"
      : rawActiveTab;

  const isPersonalLibActive =
    activeTab === "lib-match" || activeTab === "lib-quiz" || activeTab === "lib-choice";

  const [isCreateOpen, setIsCreateOpen] = useState(true);
  const [isMyGamesOpen, setIsMyGamesOpen] = useState(true);
  const [isLibraryOpen, setIsLibraryOpen] = useState(true);
  const [isMyQuestionSetsOpen, setIsMyQuestionSetsOpen] = useState<boolean>(isPersonalLibActive);

  useEffect(() => {
    if (
      activeTab === "lib-match" ||
      activeTab === "lib-quiz" ||
      activeTab === "lib-choice"
    ) {
      setIsMyQuestionSetsOpen(true);
    }
  }, [activeTab]);

  useEffect(() => {
    const savedCreate = localStorage.getItem("teacher_create_menu_open");
    if (savedCreate !== null) {
      setIsCreateOpen(savedCreate === "true");
    }
    const savedMyGames = localStorage.getItem("teacher_mygames_menu_open");
    if (savedMyGames !== null) {
      setIsMyGamesOpen(savedMyGames === "true");
    }
    const savedLib = localStorage.getItem("teacher_library_menu_open");
    if (savedLib !== null) {
      setIsLibraryOpen(savedLib === "true");
    }
  }, []);

  const toggleCreateMenu = () => {
    const next = !isCreateOpen;
    setIsCreateOpen(next);
    localStorage.setItem("teacher_create_menu_open", String(next));
  };

  const toggleMyGamesMenu = () => {
    const next = !isMyGamesOpen;
    setIsMyGamesOpen(next);
    localStorage.setItem("teacher_mygames_menu_open", String(next));
  };

  const toggleLibraryMenu = () => {
    const next = !isLibraryOpen;
    setIsLibraryOpen(next);
    localStorage.setItem("teacher_library_menu_open", String(next));
  };

  const handleSelectTab = (tab: TeacherPortalTab) => {
    if (onSelectTab) {
      onSelectTab(tab);
      return;
    }
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("tab", tab);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <StickySidebarWrapper>
      <div className="flex flex-col gap-5 w-full select-none text-[#3E3524]">
        {/* Dynamic Font Loading for Baloo 2 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet" />

        <style>{`
          .teacher-level1-btn {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            border-radius: 18px;
            font-family: 'Baloo 2', 'Nunito', sans-serif;
            font-weight: 800;
            font-size: 15px;
            letter-spacing: .02em;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            cursor: pointer;
            width: 100%;
            border: 2px solid transparent;
          }

          .teacher-level1-btn:active {
            transform: scale(0.98);
          }

          .teacher-level1-create {
            background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
            color: #FFFFFF;
            box-shadow: 0 4px 14px rgba(59, 130, 246, 0.25);
          }
          .teacher-level1-create:hover {
            box-shadow: 0 6px 18px rgba(59, 130, 246, 0.35);
            transform: translateY(-1px);
          }

          .teacher-level1-mygames {
            background: linear-gradient(135deg, #7B5CFA 0%, #633EE3 100%);
            color: #FFFFFF;
            box-shadow: 0 4px 14px rgba(123, 92, 250, 0.25);
          }
          .teacher-level1-mygames:hover {
            box-shadow: 0 6px 18px rgba(123, 92, 250, 0.35);
            transform: translateY(-1px);
          }

          .teacher-level1-library {
            background: linear-gradient(135deg, #10B981 0%, #059669 100%);
            color: #FFFFFF;
            box-shadow: 0 4px 14px rgba(16, 185, 129, 0.25);
          }
          .teacher-level1-library:hover {
            box-shadow: 0 6px 18px rgba(16, 185, 129, 0.35);
            transform: translateY(-1px);
          }

          .teacher-tile-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            padding: 6px 4px;
          }

          .teacher-tile {
            padding: 12px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            border: 2px solid transparent;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            cursor: pointer;
            border-radius: 20px 14px 20px 16px;
            position: relative;
            z-index: 1;
          }

          .teacher-tile:nth-child(odd):hover {
            transform: scale(1.05) rotate(-1.5deg);
            box-shadow: 0 8px 18px rgba(62, 53, 36, 0.12);
            z-index: 10;
          }

          .teacher-tile:nth-child(even):hover {
            transform: scale(1.05) rotate(1.5deg);
            box-shadow: 0 8px 18px rgba(62, 53, 36, 0.12);
            z-index: 10;
          }

          .teacher-tile:active {
            transform: scale(0.98);
          }

          .teacher-tile-top {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
          }

          .teacher-tile-icon {
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: transparent !important;
            box-shadow: none !important;
          }

          .teacher-tile-icon .material-symbols-rounded {
            font-size: 26px !important;
          }

          .teacher-tile-label {
            font-family: 'Baloo 2', 'Nunito', sans-serif;
            font-weight: 800;
            font-size: 15px;
            margin-top: 2px;
          }

          /* Micro-interaction animations */
          @keyframes match-shake {
            0%, 100% { transform: rotate(0); }
            25% { transform: rotate(-8deg); }
            75% { transform: rotate(8deg); }
          }
          @keyframes choice-bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-3px); }
          }
          @keyframes edit-write {
            0%, 100% { transform: translate(0, 0) rotate(0); }
            50% { transform: translate(3px, -3px) rotate(12deg); }
          }
          @keyframes flip-card {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.2) rotate(10deg); }
          }
          @keyframes quiz-pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.15) rotate(-5deg); }
          }

          .teacher-tile.match:hover .teacher-tile-icon .material-symbols-rounded {
            animation: match-shake 0.5s ease-in-out infinite;
          }
          .teacher-tile.choice:hover .teacher-tile-icon .material-symbols-rounded {
            animation: choice-bounce 0.5s ease-in-out infinite;
          }
          .teacher-tile.fill:hover .teacher-tile-icon .material-symbols-rounded {
            animation: edit-write 0.6s ease-in-out infinite;
          }
          .teacher-tile.flip:hover .teacher-tile-icon .material-symbols-rounded {
            animation: flip-card 0.5s ease-in-out infinite;
          }
          .teacher-tile.quiz:hover .teacher-tile-icon .material-symbols-rounded {
            animation: quiz-pulse 0.5s ease-in-out infinite;
          }

          /* Tile variations matching home page pastel style */
          .teacher-tile.match { background: #CFE9FC !important; }
          .teacher-tile.match .teacher-tile-icon { color: #3FA9F5; }
          .teacher-tile.match .teacher-tile-label { color: #1C7FC2; }
          .teacher-tile.match.active { border-color: #3FA9F5; box-shadow: 0 0 10px rgba(63, 169, 245, 0.2); }

          .teacher-tile.choice { background: #D1F4E0 !important; }
          .teacher-tile.choice .teacher-tile-icon { color: #10B981; }
          .teacher-tile.choice .teacher-tile-label { color: #047857; }
          .teacher-tile.choice.active { border-color: #10B981; box-shadow: 0 0 10px rgba(16, 185, 129, 0.2); }

          .teacher-tile.fill { background: #DFD7FC !important; }
          .teacher-tile.fill .teacher-tile-icon { color: #7B5CFA; }
          .teacher-tile.fill .teacher-tile-label { color: #5A3EDB; }
          .teacher-tile.fill.active { border-color: #7B5CFA; box-shadow: 0 0 10px rgba(123, 92, 250, 0.2); }

          .teacher-tile.flip { background: #FFE4E8 !important; }
          .teacher-tile.flip .teacher-tile-icon { color: #F43F5E; }
          .teacher-tile.flip .teacher-tile-label { color: #BE123C; }
          .teacher-tile.flip.active { border-color: #F43F5E; box-shadow: 0 0 10px rgba(244, 63, 94, 0.2); }

          .teacher-tile.quiz { background: #FEF3C7 !important; }
          .teacher-tile.quiz .teacher-tile-icon { color: #F59E0B; }
          .teacher-tile.quiz .teacher-tile-label { color: #B45309; }
          .teacher-tile.quiz.active { border-color: #F59E0B; box-shadow: 0 0 10px rgba(245, 158, 11, 0.2); }

          .teacher-list-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 12px;
            border-radius: 16px;
            background: #F8FAF9;
            border: 2px solid transparent;
            transition: all 0.25s ease;
            cursor: pointer;
            position: relative;
            z-index: 1;
          }
          .teacher-list-item:hover {
            background: #FFFFFF;
            border-color: #E2E8F0;
            transform: translateX(4px);
            z-index: 10;
          }
          .teacher-list-item.active {
            background: #FFFFFF;
            border-color: #3FA9F5;
            box-shadow: 0 4px 12px rgba(63, 169, 245, 0.15);
          }
          .teacher-list-item.active.choice-active {
            border-color: #10B981;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
          }
          .teacher-list-item.active.fill-active {
            border-color: #7B5CFA;
            box-shadow: 0 4px 12px rgba(123, 92, 250, 0.15);
          }
          .teacher-list-item.active.flip-active {
            border-color: #F43F5E;
            box-shadow: 0 4px 12px rgba(244, 63, 94, 0.15);
          }
          .teacher-list-item.active.quiz-active {
            border-color: #F59E0B;
            box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15);
          }

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

        {/* MENU CẤP 1 - TẠO MỚI */}
        <div className="flex flex-col w-full">
          <button
            type="button"
            onClick={toggleCreateMenu}
            className="teacher-level1-btn teacher-level1-create group"
          >
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <PlusCircle className="w-4 h-4 text-white stroke-[2.5]" />
            </div>
            <span>{t.sidebar.createNewTitle}</span>
            <ChevronDown
              className={`ml-auto w-5 h-5 text-white transition-transform duration-300 shrink-0 ${
                isCreateOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* SUBMENU CẤP 2 - TẠO MỚI (GRID 2 CỘT) */}
          <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isCreateOpen ? "max-h-[600px] opacity-100 mt-2.5" : "max-h-0 opacity-0 pointer-events-none"}`}>
            <div className="teacher-tile-grid">
              {/* Nối cặp */}
              <div
                onClick={() => handleSelectTab("match")}
                className={`teacher-tile match ${activeTab === "match" ? "active" : ""}`}
              >
                <div className="teacher-tile-top">
                  <div className="teacher-tile-icon">
                    <Puzzle className="w-5 h-5" />
                  </div>
                </div>
                <p className="teacher-tile-label">{t.sidebar.match}</p>
              </div>

              {/* Toán học */}
              <div
                onClick={() => handleSelectTab("choice")}
                className={`teacher-tile choice ${activeTab === "choice" ? "active" : ""}`}
              >
                <div className="teacher-tile-top">
                  <div className="teacher-tile-icon">
                    <Calculator className="w-5 h-5" />
                  </div>
                </div>
                <p className="teacher-tile-label">{t.sidebar.math}</p>
              </div>

              {/* Điền ô trống (Tạm khóa) */}
              <div
                className="teacher-tile fill opacity-50 cursor-not-allowed pointer-events-none grayscale-[30%] relative"
                title={t.sidebar.comingSoonTooltip}
              >
                <div className="teacher-tile-top">
                  <div className="teacher-tile-icon">
                    <FileEdit className="w-5 h-5" />
                  </div>
                  <Lock className="w-4 h-4 text-purple-700/80" />
                </div>
                <p className="teacher-tile-label">{t.sidebar.fillInBlanks}</p>
              </div>

              {/* Lật ảnh */}
              <div
                onClick={() => handleSelectTab("flip")}
                className={`teacher-tile flip ${activeTab === "flip" ? "active" : ""}`}
              >
                <div className="teacher-tile-top">
                  <div className="teacher-tile-icon">
                    <Layers className="w-5 h-5" />
                  </div>
                </div>
                <p className="teacher-tile-label">{t.sidebar.flipCards}</p>
              </div>

              {/* Trắc nghiệm */}
              <div
                onClick={() => handleSelectTab("quiz")}
                className={`teacher-tile quiz ${activeTab === "quiz" ? "active" : ""}`}
              >
                <div className="teacher-tile-top">
                  <div className="teacher-tile-icon">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                </div>
                <p className="teacher-tile-label">{t.sidebar.quiz}</p>
              </div>
            </div>
          </div>

          {/* Collapsed state mini-preview icons */}
          {!isCreateOpen && (
            <div
              onClick={toggleCreateMenu}
              className="flex gap-3 px-3 py-2 bg-emerald-50/80 rounded-[14px] border border-emerald-200/60 w-full items-center justify-center animate-in fade-in duration-300 mt-1 cursor-pointer hover:bg-emerald-100/60 transition-all shadow-xs"
            >
              <Puzzle className="w-4 h-4 text-sky-500" />
              <Calculator className="w-4 h-4 text-emerald-500" />
              <Lock className="w-4 h-4 text-purple-400 opacity-50" />
              <Layers className="w-4 h-4 text-rose-500" />
              <HelpCircle className="w-4 h-4 text-amber-500" />
            </div>
          )}
        </div>

        {/* MENU CẤP 1 - THƯ VIỆN CÂU HỎI (QUESTION LIBRARY) */}
        <div className="flex flex-col w-full">
          <button
            type="button"
            onClick={toggleLibraryMenu}
            className="teacher-level1-btn teacher-level1-library group"
          >
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <Library className="w-4 h-4 text-white stroke-[2.5]" />
            </div>
            <span>{t.sidebar.libraryTitle}</span>
            <ChevronDown
              className={`ml-auto w-5 h-5 text-white transition-transform duration-300 shrink-0 ${
                isLibraryOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* SUBMENU CẤP 2 - THƯ VIỆN CÂU HỎI */}
          <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isLibraryOpen ? "max-h-[750px] opacity-100 mt-2.5" : "max-h-0 opacity-0 pointer-events-none"}`}>
            <div className="ml-2.5 pl-2.5 py-1 pr-1 border-l-2 border-emerald-200/70 flex flex-col gap-2">
              {/* 1. Sách Giáo Khoa Global Success */}
              <div
                onClick={() => handleSelectTab("lib-global")}
                className={`teacher-list-item ${activeTab === "lib-global" ? "active quiz-active" : ""}`}
                style={
                  activeTab === "lib-global"
                    ? { background: "#FFFBEB", borderColor: "#F59E0B" }
                    : { background: "#FEFCE8" }
                }
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-headline font-black text-sm text-amber-900 truncate">
                    {t.sidebar.libraryGlobalTitle}
                  </span>
                  <span className="text-[11px] font-semibold text-amber-600/80 truncate">
                    {t.sidebar.libraryGlobalSub}
                  </span>
                </div>
              </div>

              {/* 2. Bộ câu hỏi của tôi (My Question Sets - Collapsible Parent) */}
              <div className="flex flex-col">
                <div
                  onClick={() => setIsMyQuestionSetsOpen((prev) => !prev)}
                  className={`teacher-list-item ${isPersonalLibActive ? "active choice-active" : ""}`}
                  style={
                    isPersonalLibActive
                      ? { background: "#F0FDF4", borderColor: "#10B981" }
                      : undefined
                  }
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <FolderHeart className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-headline font-black text-sm text-slate-800 truncate">
                      {t.sidebar.myQuestionSetsTitle}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400 truncate">
                      {t.sidebar.myQuestionSetsSub}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMyQuestionSetsOpen((prev) => !prev);
                    }}
                    className="w-6 h-6 rounded-lg hover:bg-emerald-100/80 text-slate-500 flex items-center justify-center shrink-0 transition-colors"
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-300 ${
                        isMyQuestionSetsOpen ? "rotate-180 text-emerald-600" : ""
                      }`}
                    />
                  </button>
                </div>

                {/* 3 Menu con (Sub-items của Bộ câu hỏi của tôi) */}
                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isMyQuestionSetsOpen
                      ? "max-h-[320px] opacity-100 mt-1.5"
                      : "max-h-0 opacity-0 pointer-events-none"
                  }`}
                >
                  <div className="ml-4 pl-2.5 py-0.5 border-l-2 border-emerald-200/80 flex flex-col gap-1.5">
                    {/* 2.1. Ghép cặp & Lật thẻ (Matching & Flip) */}
                    <div
                      onClick={() => handleSelectTab("lib-match")}
                      className={`teacher-list-item !py-2 !px-2.5 !rounded-xl ${
                        activeTab === "lib-match" ? "active" : ""
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                        <Puzzle className="w-4 h-4" />
                      </div>
                      <span className="font-headline font-bold text-[13px] text-slate-800 truncate flex-1">
                        {t.sidebar.libraryMatchTitle}
                      </span>
                      {libraryCounts?.match !== null && libraryCounts?.match !== undefined && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold shrink-0 ${
                            activeTab === "lib-match"
                              ? "bg-sky-500 text-white"
                              : "bg-sky-100 text-sky-700"
                          }`}
                        >
                          {libraryCounts.match}
                        </span>
                      )}
                    </div>

                    {/* 2.2. Trắc nghiệm (Multiple Choice) */}
                    <div
                      onClick={() => handleSelectTab("lib-quiz")}
                      className={`teacher-list-item !py-2 !px-2.5 !rounded-xl ${
                        activeTab === "lib-quiz" ? "active quiz-active" : ""
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                        <HelpCircle className="w-4 h-4" />
                      </div>
                      <span className="font-headline font-bold text-[13px] text-slate-800 truncate flex-1">
                        {t.sidebar.libraryQuizTitle}
                      </span>
                      {libraryCounts?.quiz !== null && libraryCounts?.quiz !== undefined && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold shrink-0 ${
                            activeTab === "lib-quiz"
                              ? "bg-amber-500 text-white"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {libraryCounts.quiz}
                        </span>
                      )}
                    </div>

                    {/* 2.3. Toán học (Math) */}
                    <div
                      onClick={() => handleSelectTab("lib-choice")}
                      className={`teacher-list-item !py-2 !px-2.5 !rounded-xl ${
                        activeTab === "lib-choice" ? "active choice-active" : ""
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                        <Calculator className="w-4 h-4" />
                      </div>
                      <span className="font-headline font-bold text-[13px] text-slate-800 truncate flex-1">
                        {t.sidebar.libraryMathTitle}
                      </span>
                      {libraryCounts?.choice !== null && libraryCounts?.choice !== undefined && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold shrink-0 ${
                            activeTab === "lib-choice"
                              ? "bg-emerald-500 text-white"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {libraryCounts.choice}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Collapsed state mini-preview icons */}
          {!isLibraryOpen && (
            <div
              onClick={toggleLibraryMenu}
              className="flex gap-3 px-3 py-2 bg-emerald-50/80 rounded-[14px] border border-emerald-200/60 w-full items-center justify-center animate-in fade-in duration-300 mt-1 cursor-pointer hover:bg-emerald-100/60 transition-all shadow-xs"
            >
              <BookOpen className="w-4 h-4 text-amber-500" />
              <FolderHeart className="w-4 h-4 text-emerald-600" />
              <Puzzle className="w-4 h-4 text-sky-500" />
              <HelpCircle className="w-4 h-4 text-amber-500" />
              <Calculator className="w-4 h-4 text-emerald-500" />
            </div>
          )}
        </div>

        {/* MENU CẤP 1 - BÀI TẬP ĐÃ TẠO */}
        <div className="flex flex-col w-full">
          <button
            type="button"
            onClick={toggleMyGamesMenu}
            className="teacher-level1-btn teacher-level1-mygames group"
          >
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <FolderOpen className="w-4 h-4 text-white stroke-[2.5]" />
            </div>
            <span>{t.sidebar.createdTitle}</span>
            <ChevronDown
              className={`ml-auto w-5 h-5 text-white transition-transform duration-300 shrink-0 ${
                isMyGamesOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* SUBMENU CẤP 2 - BÀI TẬP ĐÃ TẠO */}
          <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isMyGamesOpen ? "max-h-[600px] opacity-100 mt-2.5" : "max-h-0 opacity-0 pointer-events-none"}`}>
            <div className="ml-2.5 pl-2.5 py-1 pr-1 border-l-2 border-purple-200/60 flex flex-col gap-2">
              {/* Nối cặp đã tạo */}
              <div
                onClick={() => handleSelectTab("my-match-games")}
                className={`teacher-list-item ${activeTab === "my-match-games" ? "active" : ""}`}
              >
                <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                  <Copy className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-headline font-black text-sm text-slate-800">{t.sidebar.createdMatchTitle}</span>
                  <span className="text-[11px] font-semibold text-slate-400">{t.sidebar.createdMatchSub}</span>
                </div>
              </div>

              {/* Toán học đã tạo */}
              <div
                onClick={() => handleSelectTab("my-choice-games")}
                className={`teacher-list-item ${activeTab === "my-choice-games" ? "active choice-active" : ""}`}
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <Calculator className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-headline font-black text-sm text-slate-800">{t.sidebar.createdMathTitle}</span>
                  <span className="text-[11px] font-semibold text-slate-400">{t.sidebar.createdMathSub}</span>
                </div>
              </div>

              {/* Điền ô trống đã tạo (Tạm khóa) */}
              <div
                className="teacher-list-item opacity-50 cursor-not-allowed pointer-events-none relative select-none grayscale-[30%]"
                title={t.sidebar.comingSoonTooltip}
              >
                <div className="w-9 h-9 rounded-xl bg-purple-100/70 text-purple-500 flex items-center justify-center shrink-0">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div className="flex flex-col flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-headline font-black text-sm text-slate-600">{t.sidebar.createdFillTitle}</span>
                    <Lock className="w-4 h-4 text-purple-600/80" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">{t.sidebar.createdFillSub}</span>
                </div>
              </div>

              {/* Lật ảnh đã tạo */}
              <div
                onClick={() => handleSelectTab("my-flip-games")}
                className={`teacher-list-item ${activeTab === "my-flip-games" ? "active flip-active" : ""}`}
              >
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-headline font-black text-sm text-slate-800">{t.sidebar.createdFlipTitle}</span>
                  <span className="text-[11px] font-semibold text-slate-400">{t.sidebar.createdFlipSub}</span>
                </div>
              </div>

              {/* Trắc nghiệm đã tạo */}
              <div
                onClick={() => handleSelectTab("my-quiz-games")}
                className={`teacher-list-item ${activeTab === "my-quiz-games" ? "active quiz-active" : ""}`}
              >
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-headline font-black text-sm text-slate-800">{t.sidebar.createdQuizTitle}</span>
                  <span className="text-[11px] font-semibold text-slate-400">{t.sidebar.createdQuizSub}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Collapsed state mini-preview icons */}
          {!isMyGamesOpen && (
            <div
              onClick={toggleMyGamesMenu}
              className="flex gap-3 px-3 py-2 bg-purple-50/80 rounded-[14px] border border-purple-200/60 w-full items-center justify-center animate-in fade-in duration-300 mt-1 cursor-pointer hover:bg-purple-100/60 transition-all shadow-xs"
            >
              <Copy className="w-4 h-4 text-sky-500" />
              <Calculator className="w-4 h-4 text-emerald-500" />
              <ClipboardList className="w-4 h-4 text-purple-500" />
              <Layers className="w-4 h-4 text-rose-500" />
              <HelpCircle className="w-4 h-4 text-amber-500" />
            </div>
          )}
        </div>
      </div>
    </StickySidebarWrapper>
  );
}
