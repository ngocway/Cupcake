"use client";

import { useState, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { differenceInDays } from "date-fns";
import { Play, ChevronLeft, ChevronRight, Search, Sparkles, User, HelpCircle } from "lucide-react";
import type { AdminTeacherGameItem } from "@/actions/admin-teacher-games";
import { GameVideoModal, VideoModalGame } from "@/app/teacher/_components/GameVideoModal";

interface StudentGamesHubProps {
  systemGames: any[];
  teacherGames: AdminTeacherGameItem[];
  locale?: string;
}

type FilterGroup = "all" | "candy" | "shooter" | "egg" | "treasure" | "flip" | "match";

const CATEGORY_TABS: Array<{ key: FilterGroup; label: string; icon: string }> = [
  { key: "all", label: "Tất cả", icon: "apps" },
  { key: "candy", label: "Kẹo Ngọt", icon: "cookie" },
  { key: "shooter", label: "Bắn súng", icon: "rocket_launch" },
  { key: "egg", label: "Đập trứng", icon: "egg" },
  { key: "treasure", label: "Kho báu", icon: "diamond" },
  { key: "flip", label: "Lật ảnh", icon: "style" },
  { key: "match", label: "Nối cặp", icon: "extension" },
];

export function StudentGamesHub({ systemGames, teacherGames, locale = "vi" }: StudentGamesHubProps) {
  const [activeTab, setActiveTab] = useState<FilterGroup>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("all");
  const [activeVideoGame, setActiveVideoGame] = useState<VideoModalGame | null>(null);

  // Horizontal scroll ref for system games
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -340, behavior: "smooth" });
    }
  };

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 340, behavior: "smooth" });
    }
  };

  // Only take 3 currently playable system games (exclude comingSoon)
  const playableSystemGames = useMemo(() => {
    return (systemGames || []).filter((g) => !g.comingSoon).slice(0, 3);
  }, [systemGames]);

  // Unique teachers list for filter pills
  const teachersList = useMemo(() => {
    const map = new Map<string, { id: string; name: string; image: string | null }>();
    teacherGames.forEach((g) => {
      if (g.teacher?.id) {
        map.set(g.teacher.id, {
          id: g.teacher.id,
          name: g.teacher.name || "Thầy Cô",
          image: g.teacher.image || null,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [teacherGames]);

  // Count per category
  const categoryCounts = useMemo(() => {
    const counts: Record<FilterGroup, number> = {
      all: teacherGames.length,
      candy: 0,
      shooter: 0,
      egg: 0,
      treasure: 0,
      flip: 0,
      match: 0,
    };
    teacherGames.forEach((g) => {
      if (counts[g.group] !== undefined) {
        counts[g.group]++;
      }
    });
    return counts;
  }, [teacherGames]);

  // Filtered teacher games
  const filteredTeacherGames = useMemo(() => {
    return teacherGames.filter((game) => {
      if (activeTab !== "all" && game.group !== activeTab) return false;
      if (selectedTeacherId !== "all" && game.teacher?.id !== selectedTeacherId) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = game.title.toLowerCase().includes(q);
        const matchTeacher = game.teacher?.name?.toLowerCase().includes(q);
        const matchMode = game.gameModeLabel.toLowerCase().includes(q);
        if (!matchTitle && !matchTeacher && !matchMode) return false;
      }
      return true;
    });
  }, [teacherGames, activeTab, selectedTeacherId, searchQuery]);

  return (
    <div className="space-y-12">
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* PHẦN 1: GAME HỆ THỐNG (1 hàng ngang, có thể scroll ngang)              */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section className="space-y-4">
        {/* Scroll Arrows */}
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleScrollLeft}
            className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Cuộn sang trái"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleScrollRight}
            className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Cuộn sang phải"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Horizontal Scroll Row */}
        <div
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-auto no-scrollbar pb-3 pt-1 px-1 scroll-smooth snap-x snap-mandatory"
        >
          {playableSystemGames.map((game) => (
            <div
              key={game.id}
              onClick={() => {
                window.location.href = game.href;
              }}
              className="min-w-[300px] sm:min-w-[340px] md:min-w-[380px] max-w-[400px] shrink-0 snap-start group cursor-pointer"
            >
              <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-2xl hover:border-primary/50 transition-all duration-300 overflow-hidden flex flex-col h-full transform hover:-translate-y-1.5">
                {/* 16:9 Thumbnail Frame */}
                <div className="aspect-[16/9] relative overflow-hidden flex items-center justify-center bg-slate-900">
                  {game.thumbnail ? (
                    <Image
                      src={game.thumbnail}
                      alt={game.title}
                      fill
                      sizes="(max-width: 768px) 320px, 400px"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="relative z-20 flex flex-col items-center justify-center space-y-1">
                      <div className="text-4xl animate-bounce">{game.emoji}</div>
                      <h3 className="text-xl font-black text-white text-center drop-shadow-md">{game.title}</h3>
                    </div>
                  )}

                  {/* Top-left Tag Badge */}
                  <div className="absolute top-3 left-3 z-10">
                    <span className="px-3 py-1 bg-emerald-500 text-white rounded-full text-xs font-black uppercase tracking-wider shadow-md">
                      {game.tag || "Game"}
                    </span>
                  </div>

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4 z-10">
                    <h3 className="text-xl font-black text-white drop-shadow-md line-clamp-1">{game.title}</h3>
                  </div>
                </div>

                {/* Card Info */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {game.desc}
                  </p>

                  <div className="mt-4 flex items-center text-primary font-black text-xs uppercase tracking-widest gap-2 group-hover:translate-x-1.5 transition-transform">
                    <Play className="w-4 h-4 fill-primary" />
                    <span>{locale === "vi" ? "Chơi ngay" : "Play Now"}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* PHẦN 2: GAME GIÁO VIÊN TẠO (Grid 3 cột, Search, Filter, Play)          */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section className="space-y-6 pt-4 border-t-2 border-dashed border-slate-200 dark:border-slate-800">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
              <span className="material-symbols-outlined text-2xl">school</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-headline font-black text-2xl text-slate-800 dark:text-white tracking-tight">
                  {locale === "vi" ? "Góc sáng tạo của Thầy Cô" : "Teacher-Created Games"}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-xs font-black">
                  {teacherGames.length} {locale === "vi" ? "bài" : "games"}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-400">
                {locale === "vi"
                  ? "Các game tương tác được thầy cô thiết kế cho học sinh thực hành"
                  : "Interactive games designed by teachers for classroom practice"}
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={locale === "vi" ? "Tìm tên game, thầy cô..." : "Search games or teachers..."}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Filters Row: Category Pills + Teacher Pills */}
        <div className="space-y-3">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2.5 p-1">
            {CATEGORY_TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              const count = categoryCounts[tab.key];

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer whitespace-nowrap shadow-sm active:scale-95 ${
                    isActive
                      ? "bg-primary text-white shadow-md shadow-primary/25"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-primary/40 hover:text-primary"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                  <span>{tab.label}</span>
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                      isActive ? "bg-white/25 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Teacher Filter Bar (Avatars of teachers) */}
          {teachersList.length > 1 && (
            <div className="flex flex-wrap items-center gap-2 p-1">
              <span className="text-xs font-bold text-slate-400 shrink-0 flex items-center gap-1 pl-1">
                <User className="w-3.5 h-3.5" />
                <span>{locale === "vi" ? "Lọc theo Thầy Cô:" : "Teacher:"}</span>
              </span>

              <button
                type="button"
                onClick={() => setSelectedTeacherId("all")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedTeacherId === "all"
                    ? "bg-amber-500 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                }`}
              >
                {locale === "vi" ? "Tất cả thầy cô" : "All teachers"}
              </button>

              {teachersList.map((t) => {
                const isSelected = selectedTeacherId === t.id;
                const initial = (t.name[0] || "T").toUpperCase();

                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTeacherId(t.id)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? "bg-amber-500 text-white shadow-sm"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                    }`}
                  >
                    {t.image ? (
                      <img src={t.image} alt={t.name} className="w-4 h-4 rounded-full object-cover" />
                    ) : (
                      <span className="w-4 h-4 rounded-full bg-amber-400 text-amber-900 text-[10px] flex items-center justify-center font-black">
                        {initial}
                      </span>
                    )}
                    <span>{t.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 3-Column Grid of Teacher Games */}
        {filteredTeacherGames.length === 0 ? (
          <div className="w-full py-16 bg-white/60 dark:bg-slate-900/60 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">sports_esports</span>
            </div>
            <h3 className="font-headline font-bold text-base text-slate-700 dark:text-slate-300">
              {locale === "vi" ? "Chưa có bài tập nào" : "No games found"}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm">
              {searchQuery || selectedTeacherId !== "all"
                ? locale === "vi"
                  ? "Thử thay đổi từ khóa tìm kiếm hoặc chọn lại giáo viên khác."
                  : "Try clearing search or filter."
                : locale === "vi"
                  ? "Thầy cô đang chuẩn bị thêm các trò chơi mới thú vị, bạn quay lại sau nhé!"
                  : "New games will be added soon!"}
            </p>
            {(searchQuery || selectedTeacherId !== "all" || activeTab !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedTeacherId("all");
                  setActiveTab("all");
                }}
                className="text-xs text-primary font-bold hover:underline cursor-pointer pt-1"
              >
                {locale === "vi" ? "Xóa bộ lọc" : "Clear filters"}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
            {filteredTeacherGames.map((game) => {
              const isNew = differenceInDays(new Date(), new Date(game.createdAt)) <= 5;
              const hasVideo = Boolean(game.videoId);
              const teacherInitial = (game.teacher?.name?.[0] || "T").toUpperCase();

              // Trigger cinema video demo
              const handleOpenDemo = (e?: React.MouseEvent) => {
                e?.stopPropagation();
                if (hasVideo && game.videoId) {
                  setActiveVideoGame({
                    id: game.id,
                    title: game.title,
                    badge: game.badge,
                    badgeBg: game.badgeBg,
                    videoId: game.videoId,
                    createHref: game.playUrl,
                    videoType: "demo",
                  });
                }
              };

              return (
                <div
                  key={game.id}
                  className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-md rounded-3xl border border-primary/10 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col group transform hover:-translate-y-1.5"
                >
                  {/* Top 16:10 Thumbnail Frame */}
                  <div className="relative aspect-[16/10] w-full bg-slate-900 overflow-hidden shrink-0">
                    <div
                      onClick={hasVideo ? handleOpenDemo : undefined}
                      className={`relative w-full h-full ${hasVideo ? "cursor-pointer group/thumb" : ""}`}
                      title={hasVideo ? (locale === "vi" ? "Xem video demo cách chơi" : "Watch demo video") : undefined}
                    >
                      {/* Cover Image */}
                      <img
                        src={
                          game.videoId
                            ? `https://img.youtube.com/vi/${game.videoId}/maxresdefault.jpg`
                            : (game.imageUrl || "/images/games/flashcard-quiz.png")
                        }
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (game.videoId && !target.dataset.fallback) {
                            target.dataset.fallback = "1";
                            target.src = `https://img.youtube.com/vi/${game.videoId}/hqdefault.jpg`;
                          } else if (game.imageUrl && target.src !== game.imageUrl) {
                            target.src = game.imageUrl;
                          }
                        }}
                        alt={game.title}
                        className="w-full h-full object-cover scale-[1.18] group-hover/thumb:scale-[1.25] transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent" />

                      {/* Play Button Overlay (Cinema Demo Video Trigger) */}
                      {hasVideo && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="relative flex items-center justify-center">
                            <div className="absolute w-20 h-20 rounded-full bg-sky-500/30 animate-ping opacity-0 group-hover/thumb:opacity-100 transition-opacity duration-300 pointer-events-none" />
                            <div className="w-16 h-16 rounded-full bg-white/95 dark:bg-slate-900/95 text-sky-500 flex items-center justify-center shadow-2xl border-2 border-white/80 group-hover/thumb:scale-110 group-hover/thumb:bg-sky-500 group-hover/thumb:text-white transition-all duration-300">
                              <Play className="w-7 h-7 ml-1 fill-current" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Top-left Badge + NEW indicator */}
                    <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 pointer-events-none">
                      <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider shadow-md ${game.badgeBg}`}>
                        {game.badge}
                      </span>
                      {isNew && (
                        <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] font-black uppercase tracking-wider shadow-md flex items-center gap-1 animate-pulse">
                          <Sparkles className="w-3 h-3" />
                          <span>MỚI</span>
                        </span>
                      )}
                    </div>

                    {/* Top-right Game Controller Icon */}
                    <div className="absolute top-3 right-3 z-10 pointer-events-none">
                      <div className="w-8 h-8 rounded-full bg-slate-900/70 backdrop-blur-md text-white flex items-center justify-center border border-white/20 shadow-md">
                        <span className="material-symbols-rounded text-[18px]">sports_esports</span>
                      </div>
                    </div>

                    {/* Bottom overlay: Item count badge */}
                    <div className="absolute bottom-2.5 left-3 z-10">
                      <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[11px] font-bold border border-white/10">
                        {game.itemCount} {game.group === "match" || game.group === "flip" ? "cặp thẻ" : "câu hỏi"}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Content Container */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between bg-white dark:bg-slate-900 gap-4">
                    <div className="space-y-1.5">
                      {/* Teacher Author */}
                      <div className="flex items-center gap-2">
                        {game.teacher?.image ? (
                          <img
                            src={game.teacher.image}
                            alt={game.teacher.name || "Teacher"}
                            className="w-5 h-5 rounded-full object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[10px] font-black shrink-0">
                            {teacherInitial}
                          </div>
                        )}
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate">
                          {game.teacher?.name || "Thầy Cô"}
                        </span>
                      </div>

                      {/* Game Title */}
                      <h3
                        className="font-headline font-black text-base sm:text-lg text-slate-800 dark:text-white leading-snug line-clamp-2 group-hover:text-primary transition-colors"
                        title={game.title}
                      >
                        {game.title}
                      </h3>

                      {/* Short Description */}
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                        {game.desc}
                      </p>
                    </div>

                    {/* CTA Button: PLAY NOW */}
                    <Link
                      href={game.playUrl}
                      className="w-full py-3 px-3.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-1.5 group/btn text-center cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-white stroke-none" />
                      <span>{locale === "vi" ? "Chơi ngay" : "Play Now"}</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Cinema Video Modal for Demo Playback */}
      <GameVideoModal
        game={activeVideoGame}
        onClose={() => setActiveVideoGame(null)}
      />
    </div>
  );
}
