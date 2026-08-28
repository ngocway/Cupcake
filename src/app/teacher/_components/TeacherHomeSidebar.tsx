"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { StickySidebarWrapper } from "@/app/_components/StickySidebarWrapper";
import { useState, useEffect } from "react";

export function TeacherHomeSidebar() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const activeTab = searchParams?.get("tab") || "match";

  const [isCreateOpen, setIsCreateOpen] = useState(true);
  const [isMyGamesOpen, setIsMyGamesOpen] = useState(true);

  useEffect(() => {
    const savedCreate = localStorage.getItem("teacher_create_menu_open");
    if (savedCreate !== null) {
      setIsCreateOpen(savedCreate === "true");
    }
    const savedMyGames = localStorage.getItem("teacher_mygames_menu_open");
    if (savedMyGames !== null) {
      setIsMyGamesOpen(savedMyGames === "true");
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

  const handleSelectTab = (tab: "match" | "choice" | "fill" | "my-match-games" | "my-choice-games" | "my-fill-games") => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("tab", tab);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <StickySidebarWrapper>
      <div className="flex flex-col gap-5 w-full select-none text-[#3E3524]">
        {/* Dynamic Font Loading for Baloo 2 and Material Symbols Rounded */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Nunito:wght@400;600;700;800&family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,500,1,0" rel="stylesheet" />

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

          .teacher-tile-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
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
          }

          .teacher-tile:nth-child(odd):hover {
            transform: scale(1.05) rotate(-1.5deg);
            box-shadow: 0 8px 18px rgba(62, 53, 36, 0.1);
          }

          .teacher-tile:nth-child(even):hover {
            transform: scale(1.05) rotate(1.5deg);
            box-shadow: 0 8px 18px rgba(62, 53, 36, 0.1);
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

          .teacher-tile.match:hover .teacher-tile-icon .material-symbols-rounded {
            animation: match-shake 0.5s ease-in-out infinite;
          }
          .teacher-tile.choice:hover .teacher-tile-icon .material-symbols-rounded {
            animation: choice-bounce 0.5s ease-in-out infinite;
          }
          .teacher-tile.fill:hover .teacher-tile-icon .material-symbols-rounded {
            animation: edit-write 0.6s ease-in-out infinite;
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
          }
          .teacher-list-item:hover {
            background: #FFFFFF;
            border-color: #E2E8F0;
            transform: translateX(4px);
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
              <span className="material-symbols-rounded text-xl text-white">add_circle</span>
            </div>
            <span>Danh mục Tạo mới</span>
            <span className={`material-symbols-rounded ml-auto text-xl font-normal transition-transform duration-300 ${isCreateOpen ? "rotate-180" : ""}`}>
              expand_more
            </span>
          </button>

          {/* SUBMENU CẤP 2 - TẠO MỚI (GRID 2 CỘT) */}
          <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isCreateOpen ? "max-h-[500px] opacity-100 mt-2.5" : "max-h-0 opacity-0 pointer-events-none"}`}>
            <div className="teacher-tile-grid">
              {/* Nối cặp */}
              <div
                onClick={() => handleSelectTab("match")}
                className={`teacher-tile match ${activeTab === "match" ? "active" : ""}`}
              >
                <div className="teacher-tile-top">
                  <div className="teacher-tile-icon">
                    <span className="material-symbols-rounded">extension</span>
                  </div>
                </div>
                <p className="teacher-tile-label">Nối cặp</p>
              </div>

              {/* Toán học */}
              <div
                onClick={() => handleSelectTab("choice")}
                className={`teacher-tile choice ${activeTab === "choice" ? "active" : ""}`}
              >
                <div className="teacher-tile-top">
                  <div className="teacher-tile-icon">
                    <span className="material-symbols-rounded">calculate</span>
                  </div>
                </div>
                <p className="teacher-tile-label">Toán học</p>
              </div>

              {/* Điền ô trống */}
              <div
                onClick={() => handleSelectTab("fill")}
                className={`teacher-tile fill ${activeTab === "fill" ? "active" : ""}`}
              >
                <div className="teacher-tile-top">
                  <div className="teacher-tile-icon">
                    <span className="material-symbols-rounded">edit_note</span>
                  </div>
                </div>
                <p className="teacher-tile-label">Điền ô trống</p>
              </div>
            </div>
          </div>

          {/* Collapsed state mini-preview icons */}
          {!isCreateOpen && (
            <div
              onClick={toggleCreateMenu}
              className="flex gap-3 px-3 py-2 bg-emerald-50/80 rounded-[14px] border border-emerald-200/60 w-full items-center justify-center animate-in fade-in duration-300 mt-1 cursor-pointer hover:bg-emerald-100/60 transition-all shadow-xs"
            >
              <span className="material-symbols-rounded text-base text-sky-500">extension</span>
              <span className="material-symbols-rounded text-base text-emerald-500">calculate</span>
              <span className="material-symbols-rounded text-base text-purple-500">edit_note</span>
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
              <span className="material-symbols-rounded text-xl text-white">folder_open</span>
            </div>
            <span>Bài tập đã tạo</span>
            <span className={`material-symbols-rounded ml-auto text-xl font-normal transition-transform duration-300 ${isMyGamesOpen ? "rotate-180" : ""}`}>
              expand_more
            </span>
          </button>

          {/* SUBMENU CẤP 2 - BÀI TẬP ĐÃ TẠO */}
          <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isMyGamesOpen ? "max-h-[500px] opacity-100 mt-2.5" : "max-h-0 opacity-0 pointer-events-none"}`}>
            <div className="ml-2.5 pl-2.5 border-l-2 border-purple-200/60 flex flex-col gap-2">
              {/* Nối cặp đã tạo */}
              <div
                onClick={() => handleSelectTab("my-match-games")}
                className={`teacher-list-item ${activeTab === "my-match-games" ? "active" : ""}`}
              >
                <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-rounded text-[22px]">auto_awesome_motion</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-headline font-black text-sm text-slate-800">Nối cặp đã tạo</span>
                  <span className="text-[11px] font-semibold text-slate-400">Danh sách game Nối Cặp</span>
                </div>
              </div>

              {/* Toán học đã tạo */}
              <div
                onClick={() => handleSelectTab("my-choice-games")}
                className={`teacher-list-item ${activeTab === "my-choice-games" ? "active choice-active" : ""}`}
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-rounded text-[22px]">calculate</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-headline font-black text-sm text-slate-800">Toán học đã tạo</span>
                  <span className="text-[11px] font-semibold text-slate-400">Danh sách game Toán học</span>
                </div>
              </div>

              {/* Điền ô trống đã tạo */}
              <div
                onClick={() => handleSelectTab("my-fill-games")}
                className={`teacher-list-item ${activeTab === "my-fill-games" ? "active fill-active" : ""}`}
              >
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-rounded text-[22px]">assignment</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-headline font-black text-sm text-slate-800">Điền ô trống đã tạo</span>
                  <span className="text-[11px] font-semibold text-slate-400">Danh sách game Điền ô</span>
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
              <span className="material-symbols-rounded text-base text-sky-500">auto_awesome_motion</span>
              <span className="material-symbols-rounded text-base text-emerald-500">calculate</span>
              <span className="material-symbols-rounded text-base text-purple-500">assignment</span>
            </div>
          )}
        </div>
      </div>
    </StickySidebarWrapper>
  );
}
