"use client";

import { useState, useMemo, useTransition } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  toggleTeacherGamePublishAction,
  type AdminTeacherGameItem,
} from "@/actions/admin-teacher-games";

interface TeacherGamesClientProps {
  initialGames: AdminTeacherGameItem[];
}

type TabKey = "all" | "candy" | "shooter" | "egg" | "treasure" | "flip" | "match";
type StatusFilter = "all" | "published" | "hidden";

interface TabConfig {
  key: TabKey;
  label: string;
  icon: string;
}

const TABS: TabConfig[] = [
  { key: "all", label: "Tất cả game", icon: "apps" },
  { key: "candy", label: "Kẹo Ngọt", icon: "cookie" },
  { key: "shooter", label: "Bắn súng", icon: "rocket_launch" },
  { key: "egg", label: "Đập trứng", icon: "egg" },
  { key: "treasure", label: "Kho báu", icon: "diamond" },
  { key: "flip", label: "Lật ảnh", icon: "style" },
  { key: "match", label: "Nối cặp", icon: "extension" },
];

export function TeacherGamesClient({ initialGames }: TeacherGamesClientProps) {
  const [games, setGames] = useState<AdminTeacherGameItem[]>(initialGames);
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Extract unique teachers for the filter dropdown
  const teachersList = useMemo(() => {
    const map = new Map<string, { id: string; name: string; email: string }>();
    games.forEach((g) => {
      if (g.teacher?.id) {
        map.set(g.teacher.id, {
          id: g.teacher.id,
          name: g.teacher.name || "Chưa đặt tên",
          email: g.teacher.email || "",
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [games]);

  // Counts per tab
  const tabCounts = useMemo(() => {
    const counts: Record<TabKey, number> = {
      all: games.length,
      candy: 0,
      shooter: 0,
      egg: 0,
      treasure: 0,
      flip: 0,
      match: 0,
    };
    games.forEach((g) => {
      if (counts[g.group] !== undefined) {
        counts[g.group]++;
      }
    });
    return counts;
  }, [games]);

  // Status counts
  const publishedCount = useMemo(() => games.filter((g) => g.isPublished).length, [games]);
  const hiddenCount = games.length - publishedCount;

  // Handle Toggle Switch
  const handleTogglePublish = async (game: AdminTeacherGameItem) => {
    const nextState = !game.isPublished;
    setTogglingId(game.id);

    // Optimistic update
    setGames((prev) =>
      prev.map((g) => (g.id === game.id ? { ...g, isPublished: nextState } : g))
    );

    try {
      const res = await toggleTeacherGamePublishAction(game.id, nextState);
      if (res.success) {
        if (nextState) {
          toast.success(`Đã hiển thị game "${game.title}" lên menu học sinh!`);
        } else {
          toast.info(`Đã ẩn game "${game.title}" khỏi menu học sinh.`);
        }
      } else {
        // Rollback on error
        setGames((prev) =>
          prev.map((g) => (g.id === game.id ? { ...g, isPublished: !nextState } : g))
        );
        toast.error(res.error || "Không thể cập nhật trạng thái!");
      }
    } catch (e: any) {
      setGames((prev) =>
        prev.map((g) => (g.id === game.id ? { ...g, isPublished: !nextState } : g))
      );
      toast.error("Đã xảy ra lỗi khi kết nối máy chủ!");
    } finally {
      setTogglingId(null);
    }
  };

  // Filtered games
  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      // 1. Tab filter
      if (activeTab !== "all" && game.group !== activeTab) {
        return false;
      }

      // 2. Status filter
      if (statusFilter === "published" && !game.isPublished) return false;
      if (statusFilter === "hidden" && game.isPublished) return false;

      // 3. Teacher filter
      if (selectedTeacherId !== "all" && game.teacher?.id !== selectedTeacherId) {
        return false;
      }

      // 4. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = game.title.toLowerCase().includes(q);
        const matchTeacherName = game.teacher?.name?.toLowerCase().includes(q);
        const matchTeacherEmail = game.teacher?.email?.toLowerCase().includes(q);
        const matchMode = game.gameModeLabel.toLowerCase().includes(q);
        const matchSlug = game.slug.toLowerCase().includes(q);

        if (!matchTitle && !matchTeacherName && !matchTeacherEmail && !matchMode && !matchSlug) {
          return false;
        }
      }

      return true;
    });
  }, [games, activeTab, statusFilter, selectedTeacherId, searchQuery]);

  return (
    <div className="space-y-6">
      {/* 1. Header Filters: Search + Teacher Dropdown + Status Filter */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 bg-neutral-900/60 rounded-2xl border border-neutral-800/80">
        {/* Search input */}
        <div className="relative flex-1 min-w-[280px]">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 text-xl pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên game, giáo viên, email hoặc mã game..."
            className="w-full pl-10 pr-4 py-2.5 bg-neutral-950/80 border border-neutral-800 rounded-xl text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 text-xs bg-neutral-800 rounded-full w-5 h-5 flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Status Filter (All / Published / Hidden) */}
        <div className="flex items-center gap-1.5 p-1 bg-neutral-950/80 border border-neutral-800 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === "all"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Tất cả ({games.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("published")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              statusFilter === "published"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-emerald-400 hover:text-emerald-300"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Đang mở ({publishedCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("hidden")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === "hidden"
                ? "bg-neutral-800 text-neutral-200 shadow-sm"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Đang ẩn ({hiddenCount})
          </button>
        </div>

        {/* Teacher filter dropdown */}
        <div className="flex items-center gap-2 min-w-[220px]">
          <span className="material-symbols-outlined text-neutral-500 text-lg shrink-0">
            person
          </span>
          <select
            value={selectedTeacherId}
            onChange={(e) => setSelectedTeacherId(e.target.value)}
            className="w-full py-2.5 px-3 bg-neutral-950/80 border border-neutral-800 rounded-xl text-sm text-neutral-200 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
          >
            <option value="all">Tất cả giáo viên ({teachersList.length})</option>
            {teachersList.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.email})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const count = tabCounts[tab.key];

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer select-none border ${
                isActive
                  ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/20"
                  : "bg-neutral-900/60 text-neutral-400 border-neutral-800 hover:bg-neutral-850 hover:text-neutral-200"
              }`}
            >
              <span className="material-symbols-outlined text-base">{tab.icon}</span>
              <span>{tab.label}</span>
              <span
                className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  isActive ? "bg-white/20 text-white" : "bg-neutral-800 text-neutral-400"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Games Grid */}
      {filteredGames.length === 0 ? (
        <div className="w-full py-20 bg-neutral-900/40 rounded-3xl border border-neutral-800/80 p-8 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-neutral-800 text-neutral-500 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">sports_esports</span>
          </div>
          <div className="space-y-1 max-w-sm">
            <h3 className="font-bold text-base text-neutral-200">Không tìm thấy bài tập nào</h3>
            <p className="text-xs text-neutral-500">
              {searchQuery || selectedTeacherId !== "all" || statusFilter !== "all"
                ? "Thử thay đổi từ khóa tìm kiếm hoặc bỏ bớt bộ lọc."
                : "Chưa có bài tập nào trong danh mục này."}
            </p>
          </div>
          {(searchQuery || selectedTeacherId !== "all" || statusFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedTeacherId("all");
                setStatusFilter("all");
              }}
              className="text-xs text-blue-400 hover:underline cursor-pointer"
            >
              Xóa toàn bộ bộ lọc
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGames.map((game) => {
            const formattedDate = format(new Date(game.createdAt), "dd/MM/yyyy HH:mm");
            const teacherInitial = (game.teacher?.name?.[0] || game.teacher?.email?.[0] || "T").toUpperCase();
            const isToggling = togglingId === game.id;

            return (
              <div
                key={game.id}
                className={`bg-neutral-900/80 rounded-2xl border transition-all duration-200 p-5 flex flex-col justify-between gap-4 group hover:shadow-xl hover:shadow-black/40 hover:-translate-y-0.5 ${
                  game.isPublished
                    ? "border-emerald-500/30 hover:border-emerald-500/60 bg-gradient-to-b from-emerald-950/10 to-neutral-900/80"
                    : "border-neutral-800 hover:border-neutral-700"
                }`}
              >
                {/* Card Top: Category Badge + Date + Toggle Switch */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    {/* Badge */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${game.badgeColor}`}
                    >
                      <span className="material-symbols-outlined text-sm">{game.icon}</span>
                      <span>{game.gameModeLabel}</span>
                    </span>

                    {/* Right side: Date + Toggle Switch */}
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-medium text-neutral-500 hidden sm:inline">
                        {formattedDate}
                      </span>

                      {/* TOGGLE SWITCH */}
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(game)}
                        disabled={isToggling}
                        title={
                          game.isPublished
                            ? "Game đang hiển thị cho học sinh (Bấm để ẩn)"
                            : "Game đang ẩn (Bấm để hiển thị cho học sinh)"
                        }
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          game.isPublished ? "bg-emerald-500" : "bg-neutral-700 hover:bg-neutral-600"
                        } ${isToggling ? "opacity-50 cursor-wait" : ""}`}
                      >
                        <span className="sr-only">Bật tắt hiển thị</span>
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            game.isPublished ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Title & Status Indicator */}
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      {game.isPublished ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Đang mở cho học sinh
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-800 text-neutral-400 border border-neutral-700/50">
                          <span className="w-1.5 h-1.5 rounded-full bg-neutral-500" />
                          Đang ẩn
                        </span>
                      )}
                    </div>
                    <h3
                      className="font-bold text-base text-white group-hover:text-blue-400 transition-colors line-clamp-2"
                      title={game.title}
                    >
                      {game.title}
                    </h3>
                  </div>

                  {/* Teacher Info */}
                  <div className="flex items-center gap-2.5 pt-1">
                    {game.teacher?.image ? (
                      <img
                        src={game.teacher.image}
                        alt={game.teacher.name || "Teacher"}
                        className="w-7 h-7 rounded-full object-cover border border-neutral-700"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center text-xs font-black shrink-0">
                        {teacherInitial}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-neutral-300 truncate">
                        {game.teacher?.name || "Giáo viên ẩn danh"}
                      </p>
                      <p className="text-[11px] text-neutral-500 truncate">
                        {game.teacher?.email || "Không có email"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Bottom: Question Count & Preview Button */}
                <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-medium">
                    <span className="material-symbols-outlined text-sm text-neutral-500">
                      list_alt
                    </span>
                    <span>
                      {game.itemCount}{" "}
                      {game.group === "match" || game.group === "flip" ? "cặp thẻ" : "câu hỏi"}
                    </span>
                  </div>

                  {/* Preview Action (Open in New Tab) */}
                  <a
                    href={game.playUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                    title="Mở tab mới để chơi thử giao diện học sinh"
                  >
                    <span className="material-symbols-outlined text-base">play_arrow</span>
                    <span>Xem trước</span>
                    <span className="material-symbols-outlined text-xs">open_in_new</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
