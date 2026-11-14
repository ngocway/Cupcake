"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import type {
  AdminGlobalSuccessAnalytics,
  GlobalSuccessActionType,
} from "@/actions/admin-teacher-games";

interface AdminGlobalSuccessAnalyticsTabProps {
  analytics?: AdminGlobalSuccessAnalytics;
}

export function AdminGlobalSuccessAnalyticsTab({
  analytics,
}: AdminGlobalSuccessAnalyticsTabProps) {
  const [selectedAction, setSelectedAction] = useState<"all" | GlobalSuccessActionType>("all");
  const [selectedGrade, setSelectedGrade] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  if (!analytics) {
    return (
      <div className="p-8 text-center bg-neutral-900/60 rounded-3xl border border-neutral-800 text-neutral-400">
        <span className="material-symbols-outlined text-4xl mb-2 text-neutral-500 animate-spin">
          progress_activity
        </span>
        <p>Đang tải dữ liệu thống kê Global Success...</p>
      </div>
    );
  }

  const { totals, byFormat, byGrade, topUnits, recentEvents } = analytics;

  // Filtered recent events
  const filteredEvents = useMemo(() => {
    return recentEvents.filter((ev) => {
      if (selectedAction !== "all" && ev.action !== selectedAction) return false;
      if (selectedGrade !== "all" && ev.grade !== selectedGrade) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = ev.fullTitle.toLowerCase().includes(q);
        const matchUnit = ev.unitTitle.toLowerCase().includes(q) || ev.unit.toLowerCase().includes(q);
        const matchUser = ev.userName.toLowerCase().includes(q) || (ev.userEmail && ev.userEmail.toLowerCase().includes(q));
        const matchFormat = ev.gameFormatLabel.toLowerCase().includes(q);
        if (!matchTitle && !matchUnit && !matchUser && !matchFormat) return false;
      }
      return true;
    });
  }, [recentEvents, selectedAction, selectedGrade, searchQuery]);

  // Filtered top units
  const filteredTopUnits = useMemo(() => {
    return topUnits.filter((u) => {
      if (selectedGrade !== "all" && u.grade !== selectedGrade) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = u.unitTitle.toLowerCase().includes(q);
        const matchUnit = u.unit.toLowerCase().includes(q) || u.grade.toLowerCase().includes(q);
        if (!matchTitle && !matchUnit) return false;
      }
      return true;
    });
  }, [topUnits, selectedGrade, searchQuery]);

  const maxFormatTotal = useMemo(() => {
    return Math.max(1, ...byFormat.map((f) => f.totalActions));
  }, [byFormat]);

  const maxGradeTotal = useMemo(() => {
    return Math.max(1, ...byGrade.map((g) => g.totalActions));
  }, [byGrade]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Header Overview Banner */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-neutral-900 border border-emerald-800/40 rounded-3xl p-6 sm:p-7 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-black uppercase tracking-wider">
                Thư viện Giáo trình Global Success
              </span>
              <span className="text-xs text-neutral-400">
                Lớp 1 đến Lớp 12
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Thống kê Tương tác &amp; Preview Game Global Success
            </h2>
            <p className="text-sm text-neutral-300/80 mt-1.5 max-w-2xl leading-relaxed">
              Theo dõi chi tiết giáo viên đã bấm <strong>Xem thử (Preview)</strong>, <strong>Sao chép link (Copy)</strong> và <strong>Tải mã QR</strong> cho từng khối lớp và dạng game.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="px-4 py-2.5 rounded-2xl bg-neutral-900/90 border border-neutral-700/80 text-right">
              <p className="text-[11px] font-bold text-neutral-400 uppercase">Khối lớp Hot nhất</p>
              <p className="text-base font-black text-emerald-400 mt-0.5">{totals.topGrade}</p>
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-neutral-900/90 border border-neutral-700/80 text-right">
              <p className="text-[11px] font-bold text-neutral-400 uppercase">Dạng Game yêu thích</p>
              <p className="text-base font-black text-sky-400 mt-0.5">{totals.topFormat}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Previews */}
        <div className="bg-neutral-900/90 border border-sky-500/20 hover:border-sky-500/40 rounded-3xl p-5 flex flex-col justify-between gap-3 relative overflow-hidden transition-all shadow-lg shadow-sky-950/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2.5 py-1 rounded-xl">
              Hành vi 1 • Xem thử Game
            </span>
            <span className="material-symbols-outlined text-sky-400 text-2xl">
              visibility
            </span>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-black text-white">{totals.totalPreviews}</p>
            <p className="text-xs text-neutral-400 mt-1 font-medium">
              Lượt bấm nút &quot;Preview&quot; trong hộp thoại Share
            </p>
          </div>
          <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs">
            <span className="text-neutral-400">Tỷ trọng tương tác:</span>
            <span className="font-bold text-sky-400">
              {totals.totalActions > 0
                ? `${Math.round((totals.totalPreviews / totals.totalActions) * 100)}%`
                : "0%"}
            </span>
          </div>
        </div>

        {/* KPI 2: Copy Link */}
        <div className="bg-neutral-900/90 border border-purple-500/20 hover:border-purple-500/40 rounded-3xl p-5 flex flex-col justify-between gap-3 relative overflow-hidden transition-all shadow-lg shadow-purple-950/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-xl">
              Hành vi 2 • Sao chép link
            </span>
            <span className="material-symbols-outlined text-purple-400 text-2xl">
              link
            </span>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-black text-white">{totals.totalCopyLinks}</p>
            <p className="text-xs text-neutral-400 mt-1 font-medium">
              Lượt bấm Copy link gửi Zalo / Facebook / Classroom
            </p>
          </div>
          <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs">
            <span className="text-neutral-400">Tỷ trọng tương tác:</span>
            <span className="font-bold text-purple-400">
              {totals.totalActions > 0
                ? `${Math.round((totals.totalCopyLinks / totals.totalActions) * 100)}%`
                : "0%"}
            </span>
          </div>
        </div>

        {/* KPI 3: Download QR */}
        <div className="bg-neutral-900/90 border border-amber-500/20 hover:border-amber-500/40 rounded-3xl p-5 flex flex-col justify-between gap-3 relative overflow-hidden transition-all shadow-lg shadow-amber-950/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-xl">
              Hành vi 3 • Tải ảnh QR
            </span>
            <span className="material-symbols-outlined text-amber-400 text-2xl">
              qr_code_2
            </span>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-black text-white">{totals.totalDownloadQrs}</p>
            <p className="text-xs text-neutral-400 mt-1 font-medium">
              Lượt tải mã QR về chèn Slide chiếu trên lớp
            </p>
          </div>
          <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs">
            <span className="text-neutral-400">Tỷ trọng tương tác:</span>
            <span className="font-bold text-amber-400">
              {totals.totalActions > 0
                ? `${Math.round((totals.totalDownloadQrs / totals.totalActions) * 100)}%`
                : "0%"}
            </span>
          </div>
        </div>

        {/* KPI 4: Unique Teachers */}
        <div className="bg-neutral-900/90 border border-emerald-500/20 hover:border-emerald-500/40 rounded-3xl p-5 flex flex-col justify-between gap-3 relative overflow-hidden transition-all shadow-lg shadow-emerald-950/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl">
              Tổng số Giáo viên
            </span>
            <span className="material-symbols-outlined text-emerald-400 text-2xl">
              school
            </span>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-black text-white">{totals.uniqueTeachers}</p>
            <p className="text-xs text-neutral-400 mt-1 font-medium">
              Giáo viên / Khách duy nhất đã thao tác
            </p>
          </div>
          <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs">
            <span className="text-neutral-400">Tổng lượt hành động:</span>
            <span className="font-bold text-emerald-400">{totals.totalActions}</span>
          </div>
        </div>
      </div>

      {/* 3. Filter Bar */}
      <div className="bg-neutral-900/90 border border-neutral-800 p-4 rounded-3xl flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-lg">
            search
          </span>
          <input
            type="text"
            placeholder="Tìm theo tên bài học, Unit, hoặc email giáo viên..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Action and Grade Filter Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Action Filter */}
          <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-2xl border border-neutral-800 text-xs">
            <button
              type="button"
              onClick={() => setSelectedAction("all")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                selectedAction === "all"
                  ? "bg-neutral-800 text-white shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Tất cả hành vi
            </button>
            <button
              type="button"
              onClick={() => setSelectedAction("preview")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                selectedAction === "preview"
                  ? "bg-sky-600 text-white shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              👁️ Xem thử
            </button>
            <button
              type="button"
              onClick={() => setSelectedAction("copy_link")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                selectedAction === "copy_link"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              🔗 Copy link
            </button>
            <button
              type="button"
              onClick={() => setSelectedAction("download_qr")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                selectedAction === "download_qr"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              📲 Tải QR
            </button>
          </div>

          {/* Grade Select */}
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 rounded-2xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="all">Tất cả Khối lớp (1–12)</option>
            {Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`).map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. Two Comparison Columns: By Format & By Grade */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: By Game Format */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400 text-xl">
                  sports_esports
                </span>
                Tỷ lệ Dạng Game được chọn xem &amp; chia sẻ
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Giáo viên chuộng mini-game nào khi giao bài Global Success
              </p>
            </div>
            <span className="text-xs font-bold text-neutral-500">
              {byFormat.length} dạng game
            </span>
          </div>

          {byFormat.length === 0 ? (
            <p className="text-xs text-neutral-500 italic py-6 text-center">
              Chưa ghi nhận dữ liệu dạng game nào.
            </p>
          ) : (
            <div className="space-y-4">
              {byFormat.map((fmt) => {
                const pct = Math.round((fmt.totalActions / maxFormatTotal) * 100);
                const shareOfAll = totals.totalActions > 0
                  ? Math.round((fmt.totalActions / totals.totalActions) * 100)
                  : 0;
                return (
                  <div key={fmt.formatId} className="space-y-2 p-3 rounded-2xl bg-neutral-950/60 border border-neutral-800/80">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-emerald-400 text-lg">
                          {fmt.icon}
                        </span>
                        <span className="text-xs font-bold text-white">
                          {fmt.formatLabel}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-white">
                          {fmt.totalActions}
                        </span>
                        <span className="text-[11px] text-neutral-500 ml-1.5">
                          ({shareOfAll}%)
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(5, pct)}%` }}
                      />
                    </div>

                    {/* Sub-breakdown: Preview vs Copy vs QR */}
                    <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1">
                      <span>👁️ Preview: <strong className="text-sky-300">{fmt.previewCount}</strong></span>
                      <span>🔗 Copy Link: <strong className="text-purple-300">{fmt.copyCount}</strong></span>
                      <span>📲 Tải QR: <strong className="text-amber-300">{fmt.downloadQrCount}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Column 2: By Grade Level (Grade 1 - 12) */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-sky-400 text-xl">
                  bar_chart
                </span>
                Phân bố tương tác theo Khối lớp (Lớp 1 – 12)
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Lớp học nào đang có nhu cầu tài liệu và game tương tác cao nhất
              </p>
            </div>
            <span className="text-xs font-bold text-neutral-500">
              12 Khối lớp
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {byGrade.map((g) => {
              const pct = maxGradeTotal > 0 ? Math.round((g.totalActions / maxGradeTotal) * 100) : 0;
              const isPrimary = g.gradeNumber <= 5;
              const isLower = g.gradeNumber >= 6 && g.gradeNumber <= 9;
              const tierBadge = isPrimary
                ? "Tiểu học"
                : isLower
                ? "THCS"
                : "THPT";

              return (
                <div
                  key={g.grade}
                  className={`p-3 rounded-2xl border transition-all ${
                    g.totalActions > 0
                      ? "bg-neutral-950/80 border-neutral-800"
                      : "bg-neutral-950/30 border-neutral-900 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white flex items-center gap-1.5">
                      <span>{g.grade}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 font-normal">
                        {tierBadge}
                      </span>
                    </span>
                    <span className="text-xs font-black text-emerald-400">
                      {g.totalActions} lượt
                    </span>
                  </div>

                  <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full bg-sky-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(g.totalActions > 0 ? 6 : 0, pct)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-neutral-500 mt-1.5">
                    <span>👁️ {g.previewCount}</span>
                    <span>🔗 {g.copyCount}</span>
                    <span>📲 {g.downloadQrCount}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. Top Units Leaderboard */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-400 text-xl">
                leaderboard
              </span>
              Top Bài học Global Success được quan tâm nhiều nhất
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Bảng xếp hạng Unit có số lượt xem thử và chia sẻ cao nhất
            </p>
          </div>
          <span className="text-xs font-bold text-neutral-500">
            Hiển thị {filteredTopUnits.length} bài học
          </span>
        </div>

        {filteredTopUnits.length === 0 ? (
          <p className="text-xs text-neutral-500 italic py-8 text-center">
            Chưa có bài học nào khớp với bộ lọc hiện tại.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-800 text-neutral-400 uppercase text-[10px] font-black tracking-wider">
                  <th className="py-3 px-3">Khối lớp</th>
                  <th className="py-3 px-3">Bài học (Unit)</th>
                  <th className="py-3 px-3">Dạng bài</th>
                  <th className="py-3 px-3">Dạng Game xem nhiều</th>
                  <th className="py-3 px-3 text-center">👁️ Preview</th>
                  <th className="py-3 px-3 text-center">🔗 Copy</th>
                  <th className="py-3 px-3 text-center">📲 Tải QR</th>
                  <th className="py-3 px-3 text-right">Tổng tương tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filteredTopUnits.map((u, idx) => (
                  <tr
                    key={u.key}
                    className="hover:bg-neutral-800/40 transition-colors"
                  >
                    <td className="py-3 px-3 font-black text-white whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px]">
                        {u.grade}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-white">{u.unit}</p>
                      {u.unitTitle && (
                        <p className="text-[11px] text-neutral-400 truncate max-w-xs">
                          {u.unitTitle}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-3 text-neutral-300">
                      <span className="px-2 py-0.5 rounded-md bg-neutral-800 text-[11px]">
                        {u.setCategory || "Chung"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-sky-400 font-bold whitespace-nowrap">
                      {u.topFormatLabel}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-sky-300">
                      {u.previewCount}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-purple-300">
                      {u.copyCount}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-amber-300">
                      {u.downloadQrCount}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-emerald-400 text-sm whitespace-nowrap">
                      {u.totalActions}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. Live Stream of Recent Events */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-400 text-xl animate-pulse">
                sensors
              </span>
              Nhật ký tương tác thời gian thực
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Dòng thời gian các thao tác Preview, Copy link và Tải mã QR gần nhất
            </p>
          </div>
          <span className="text-xs font-bold text-neutral-500">
            {filteredEvents.length} sự kiện gần nhất
          </span>
        </div>

        {filteredEvents.length === 0 ? (
          <p className="text-xs text-neutral-500 italic py-8 text-center">
            Không tìm thấy sự kiện nào trong danh sách.
          </p>
        ) : (
          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {filteredEvents.map((ev) => (
              <div
                key={ev.id}
                className="p-3.5 rounded-2xl bg-neutral-950/70 border border-neutral-800/70 hover:border-neutral-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all"
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <span
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-black border uppercase tracking-wider shrink-0 ${ev.actionColor}`}
                  >
                    {ev.actionLabel}
                  </span>

                  <div className="min-w-0">
                    <p className="font-bold text-white truncate">
                      {ev.fullTitle}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                      <span className="text-sky-400 font-semibold">{ev.gameFormatLabel}</span>
                      <span>•</span>
                      <span>{ev.userName}</span>
                      {ev.userEmail && <span className="text-neutral-500 font-mono">({ev.userEmail})</span>}
                      {ev.isGuest && (
                        <span className="px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 text-[10px]">
                          Khách
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 sm:text-right">
                  <span className="text-[11px] px-2 py-0.5 rounded-lg bg-neutral-800/80 text-neutral-300 font-medium">
                    {ev.device}
                  </span>
                  <span className="text-[11px] text-neutral-400 font-mono">
                    {format(new Date(ev.createdAt), "HH:mm dd/MM")}
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
