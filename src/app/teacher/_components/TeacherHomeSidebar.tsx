"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { StickySidebarWrapper } from "@/app/_components/StickySidebarWrapper";

export function TeacherHomeSidebar() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const activeTab = searchParams?.get("tab") || "match";

  const handleSelectTab = (tab: "match" | "fill") => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("tab", tab);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <StickySidebarWrapper>
      <div className="flex flex-col gap-4 w-full select-none text-[#3E3524]">
        {/* Dynamic Font Loading for Baloo 2 and Material Symbols Rounded */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Nunito:wght@400;600;700;800&family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,500,1,0" rel="stylesheet" />

        <style>{`
          .teacher-redesign-section-label {
            font-family: 'Baloo 2', 'Nunito', sans-serif;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: .06em;
            color: #8C826D;
            text-transform: uppercase;
            padding: 0 2px;
            margin-bottom: 8px;
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
          @keyframes edit-write {
            0%, 100% { transform: translate(0, 0) rotate(0); }
            50% { transform: translate(3px, -3px) rotate(12deg); }
          }

          .teacher-tile.match:hover .teacher-tile-icon .material-symbols-rounded {
            animation: match-shake 0.5s ease-in-out infinite;
          }
          .teacher-tile.fill:hover .teacher-tile-icon .material-symbols-rounded {
            animation: edit-write 0.6s ease-in-out infinite;
          }

          /* Tile variations matching home page pastel style */
          .teacher-tile.match { background: #CFE9FC !important; }
          .teacher-tile.match .teacher-tile-icon { color: #3FA9F5; }
          .teacher-tile.match .teacher-tile-label { color: #1C7FC2; }
          .teacher-tile.match.active { border-color: #3FA9F5; box-shadow: 0 0 10px rgba(63, 169, 245, 0.2); }

          .teacher-tile.fill { background: #DFD7FC !important; }
          .teacher-tile.fill .teacher-tile-icon { color: #7B5CFA; }
          .teacher-tile.fill .teacher-tile-label { color: #5A3EDB; }
          .teacher-tile.fill.active { border-color: #7B5CFA; box-shadow: 0 0 10px rgba(123, 92, 250, 0.2); }

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

        <div>
          <p className="teacher-redesign-section-label">Danh mục Giáo viên</p>
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
      </div>
    </StickySidebarWrapper>
  );
}
