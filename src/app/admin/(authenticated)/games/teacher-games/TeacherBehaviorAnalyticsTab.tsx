"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import type { AdminTeacherBehaviorAnalytics } from "@/actions/admin-teacher-games";

interface TeacherBehaviorAnalyticsTabProps {
  analytics: AdminTeacherBehaviorAnalytics;
}

export function TeacherBehaviorAnalyticsTab({
  analytics,
}: TeacherBehaviorAnalyticsTabProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [eventFilter, setEventFilter] = useState<string>("all");

  const { funnel, categoryStats, templates, recentEvents } = analytics;

  const filteredTemplates = useMemo(() => {
    if (categoryFilter === "all") return templates;
    return templates.filter((t) => t.category === categoryFilter);
  }, [templates, categoryFilter]);

  const filteredEvents = useMemo(() => {
    if (eventFilter === "all") return recentEvents;
    return recentEvents.filter((ev) => ev.eventName === eventFilter);
  }, [recentEvents, eventFilter]);

  const maxTemplateScore = useMemo(() => {
    return Math.max(
      1,
      ...templates.map((t) => t.createClicks + t.demoViews + t.createdCount)
    );
  }, [templates]);

  const maxCategoryClicks = useMemo(() => {
    return Math.max(1, ...categoryStats.map((c) => c.clicks));
  }, [categoryStats]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. 4-Step Teacher Conversion Funnel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Step 1: Portal Exploration */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between gap-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2.5 py-1 rounded-lg">
              Bước 1 • Khám phá /teacher
            </span>
            <span className="material-symbols-outlined text-sky-400 text-2xl">
              travel_explore
            </span>
          </div>
          <div>
            <p className="text-3xl font-black text-white">{funnel.portalVisits}</p>
            <p className="text-xs text-neutral-400 mt-1">
              Lượt mở trang & chuyển tab danh mục
            </p>
          </div>
          <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs">
            <span className="text-neutral-400">Người dùng / Khách duy nhất:</span>
            <span className="font-bold text-sky-400">{funnel.uniqueVisitors}</span>
          </div>
        </div>

        {/* Step 2: Video Demo & Guide */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between gap-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
              Bước 2 • Xem Video Game
            </span>
            <span className="material-symbols-outlined text-amber-400 text-2xl">
              smart_display
            </span>
          </div>
          <div>
            <p className="text-3xl font-black text-white">{funnel.videoOpens}</p>
            <p className="text-xs text-neutral-400 mt-1">
              Tổng lượt bấm xem Video giới thiệu & HD
            </p>
          </div>
          <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs">
            <span className="text-neutral-400">
              ▶️ Demo: <strong className="text-white">{funnel.demoViews}</strong>
            </span>
            <span className="text-neutral-400">
              📹 Hướng dẫn: <strong className="text-amber-400">{funnel.guideViews}</strong>
            </span>
          </div>
        </div>

        {/* Step 3: Click + TẠO BÀI TẬP */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between gap-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-lg">
              Bước 3 • Bấm + Tạo bài tập
            </span>
            <span className="material-symbols-outlined text-purple-400 text-2xl">
              add_circle
            </span>
          </div>
          <div>
            <p className="text-3xl font-black text-white">{funnel.createClicks}</p>
            <p className="text-xs text-neutral-400 mt-1">
              Từ thẻ game: <strong className="text-neutral-200">{funnel.cardCreateClicks}</strong> • Từ popup video:{" "}
              <strong className="text-neutral-200">{funnel.modalCreateClicks}</strong>
            </p>
          </div>
          <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs">
            <span className="text-neutral-400">
              👨‍🏫 Đã ĐN: <strong className="text-emerald-400">{funnel.authCreateClicks}</strong>
            </span>
            <span className="text-neutral-400">
              👤 Khách bấm: <strong className="text-amber-400">{funnel.guestCreateClicks}</strong>
            </span>
          </div>
        </div>

        {/* Step 4: Login Conversion & Created Games */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between gap-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
              Bước 4 • Tạo & Giao bài
            </span>
            <span className="material-symbols-outlined text-emerald-400 text-2xl">
              rocket_launch
            </span>
          </div>
          <div>
            <p className="text-3xl font-black text-white">{funnel.totalGamesCreated}</p>
            <p className="text-xs text-neutral-400 mt-1">
              Tổng bài tập đã xuất bản • <strong className="text-emerald-400">{funnel.shareActions}</strong> lượt chia sẻ/copy link
            </p>
          </div>
          <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs">
            <span className="text-neutral-400">
              🔒 Bật Popup ĐN: <strong className="text-white">{funnel.authPrompts}</strong>
            </span>
            <span className="text-neutral-400">
              ✅ ĐN thành công: <strong className="text-emerald-400">{funnel.authConverted}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Category Interest Strip */}
      <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-400 text-xl">
                category
              </span>
              Mức độ quan tâm theo Nhóm Danh mục (Sidebar cột trái)
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Số lần giáo viên & khách chuyển sang từng nhóm trò chơi trên trang /teacher
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {categoryStats.map((cat) => {
            const pct = Math.round((cat.clicks / maxCategoryClicks) * 100);
            return (
              <div
                key={cat.key}
                className="bg-neutral-950/80 border border-neutral-800/90 rounded-xl p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-200">{cat.label}</span>
                  <span className="text-sm font-black text-blue-400">{cat.clicks} lượt</span>
                </div>
                <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(pct, cat.clicks > 0 ? 8 : 0)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. 14 Game Templates Ranking Table */}
      <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-400 text-xl">
                leaderboard
              </span>
              Bảng Xếp Hạng 14 Mẫu Game (Xem Video ➔ Bấm Tạo ➔ Đã Xuất Bản)
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              So sánh trực quan mẫu game nào thu hút nhiều lượt xem Demo, nhiều lượt bấm + TẠO BÀI TẬP và số bài được tạo thực tế
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { key: "all", label: "Tất cả (14)" },
              { key: "match", label: "Nối cặp (7)" },
              { key: "choice", label: "Toán học (2)" },
              { key: "flip", label: "Lật ảnh (2)" },
              { key: "quiz", label: "Trắc nghiệm (3)" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setCategoryFilter(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  categoryFilter === tab.key
                    ? "bg-blue-600 text-white border-blue-500"
                    : "bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 text-[11px] font-black uppercase tracking-wider text-neutral-400">
                <th className="py-3 px-4">Mẫu Game</th>
                <th className="py-3 px-3">Danh mục</th>
                <th className="py-3 px-3 text-center">▶️ Xem Demo</th>
                <th className="py-3 px-3 text-center">📹 Xem HD</th>
                <th className="py-3 px-3 text-center">➕ Bấm Tạo Bài Tập</th>
                <th className="py-3 px-3 text-center">👤 Khách Bấm Tạo</th>
                <th className="py-3 px-3 text-center">✅ Bài Đã Tạo</th>
                <th className="py-3 px-4 w-44">Độ Thu Hút</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-xs">
              {filteredTemplates.map((tpl, idx) => {
                const score = tpl.createClicks + tpl.demoViews + tpl.createdCount;
                const barPct = Math.round((score / maxTemplateScore) * 100);

                return (
                  <tr
                    key={tpl.id}
                    className="hover:bg-neutral-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-neutral-800 text-neutral-400 font-black text-[11px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-bold text-white text-sm">{tpl.title}</p>
                          <span className="text-[10px] text-neutral-500 font-mono">
                            ID: {tpl.id}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-neutral-800 text-neutral-300 border border-neutral-700">
                        {tpl.categoryLabel}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`font-bold text-sm ${
                          tpl.demoViews > 0 ? "text-sky-400" : "text-neutral-600"
                        }`}
                      >
                        {tpl.demoViews}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`font-bold text-sm ${
                          tpl.guideViews > 0 ? "text-amber-400" : "text-neutral-600"
                        }`}
                      >
                        {tpl.guideViews}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center justify-center px-2.5 py-1 rounded-lg font-black text-sm ${
                          tpl.createClicks > 0
                            ? "bg-purple-500/15 text-purple-300 border border-purple-500/30"
                            : "text-neutral-600"
                        }`}
                      >
                        {tpl.createClicks}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`font-bold text-sm ${
                          tpl.guestCreateClicks > 0 ? "text-amber-400" : "text-neutral-600"
                        }`}
                      >
                        {tpl.guestCreateClicks}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center justify-center px-2.5 py-1 rounded-lg font-black text-sm ${
                          tpl.createdCount > 0
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : "text-neutral-600"
                        }`}
                      >
                        {tpl.createdCount}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 via-sky-400 to-emerald-400 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(barPct, score > 0 ? 6 : 0)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Real-Time Teacher & Guest Activity Stream */}
      <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-400 text-xl">
                bolt
              </span>
              Nhật ký Tương tác Giáo viên & Khách vãng lai (Gần đây nhất)
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Theo dõi chi tiết từng cú click xem video, bấm tạo bài tập, bật popup đăng nhập và chia sẻ link
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { key: "all", label: "Tất cả sự kiện" },
              { key: "teacher_create_click", label: "➕ Bấm Tạo bài" },
              { key: "teacher_video_open", label: "▶️ Xem Video" },
              { key: "teacher_auth_prompt", label: "🔒 Bật Popup ĐN" },
              { key: "teacher_auth_converted", label: "✅ ĐN Thành công" },
              { key: "teacher_my_game_action", label: "🔗 Chia sẻ / Xem thử" },
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setEventFilter(f.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  eventFilter === f.key
                    ? "bg-emerald-600 text-white border-emerald-500"
                    : "bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="py-12 text-center text-neutral-500 text-xs font-medium">
            Chưa có sự kiện nào trong bộ lọc này. Hãy thử bấm xem video hoặc bấm + TẠO BÀI TẬP trên trang /teacher!
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1 custom-scrollbar">
            {filteredEvents.map((ev) => (
              <div
                key={ev.id}
                className="bg-neutral-950/80 border border-neutral-800/90 hover:border-neutral-700 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-black shrink-0 border ${
                      ev.eventName === "teacher_create_click"
                        ? "bg-purple-500/15 text-purple-300 border-purple-500/30"
                        : ev.eventName === "teacher_video_open"
                          ? "bg-sky-500/15 text-sky-300 border-sky-500/30"
                          : ev.eventName === "teacher_auth_converted"
                            ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                            : ev.eventName === "teacher_auth_prompt"
                              ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                              : "bg-neutral-800 text-neutral-300 border-neutral-700"
                    }`}
                  >
                    {ev.actionLabel}
                  </span>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm truncate">
                        {ev.gameTitle}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-400">
                        {ev.categoryLabel}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-2 flex-wrap">
                      <span
                        className={
                          ev.isGuest ? "text-amber-400 font-semibold" : "text-emerald-400 font-semibold"
                        }
                      >
                        {ev.isGuest ? "👤 " : "👨‍🏫 "}
                        {ev.userName}
                      </span>
                      {ev.userEmail && (
                        <span className="text-neutral-500">({ev.userEmail})</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-neutral-500 shrink-0">
                  <span className="px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-400">
                    {ev.device === "Mobile"
                      ? "📱 Mobile"
                      : ev.device === "Tablet"
                        ? "📟 Tablet"
                        : "💻 Desktop"}
                  </span>
                  <span className="font-mono whitespace-nowrap">
                    {format(new Date(ev.createdAt), "HH:mm:ss • dd/MM/yyyy")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

