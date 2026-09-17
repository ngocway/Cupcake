"use client";

import { useState, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { differenceInDays } from "date-fns";
import { Play, ChevronLeft, ChevronRight, Search, Sparkles } from "lucide-react";
import type { AdminTeacherGameItem } from "@/actions/admin-teacher-games";

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

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = game.title.toLowerCase().includes(q);
        const matchTeacher = game.teacher?.name?.toLowerCase().includes(q);
        const matchMode = game.gameModeLabel.toLowerCase().includes(q);
        if (!matchTitle && !matchTeacher && !matchMode) return false;
      }
      return true;
    });
  }, [teacherGames, activeTab, searchQuery]);

  return (
    <div className="space-y-12">
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* PHẦN 1: GAME HỆ THỐNG (1 hàng ngang, có thể scroll ngang)              */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section className="space-y-4">
        {/* Scroll Arrows (chỉ cần trên mobile/tablet khi có cuộn ngang) */}
        <div className="flex items-center justify-end gap-2 lg:hidden">
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

        {/* System Games Row: Grid 3 cột trên Desktop (overflow-visible) & Scroll ngang trên Mobile (pb-8 không cấn bóng) */}
        <div
          ref={scrollContainerRef}
          className="flex lg:grid lg:grid-cols-3 gap-6 overflow-x-auto lg:overflow-visible no-scrollbar pb-8 pt-2 px-2 -mb-4 lg:py-2 lg:px-1 lg:mb-0 scroll-smooth snap-x snap-mandatory"
        >
          {playableSystemGames.map((game) => (
            <div
              key={game.id}
              onClick={() => {
                window.location.href = game.href;
              }}
              className="min-w-[300px] sm:min-w-[340px] md:min-w-[380px] max-w-[400px] lg:min-w-0 lg:max-w-none lg:w-full shrink-0 lg:shrink snap-start group cursor-pointer"
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
              {searchQuery || activeTab !== "all"
                ? locale === "vi"
                  ? "Thử thay đổi từ khóa tìm kiếm hoặc chọn danh mục khác."
                  : "Try clearing search or filter."
                : locale === "vi"
                  ? "Thầy cô đang chuẩn bị thêm các trò chơi mới thú vị, bạn quay lại sau nhé!"
                  : "New games will be added soon!"}
            </p>
            {(searchQuery || activeTab !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
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

              return (
                <div
                  key={game.id}
                  className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-md rounded-3xl border border-primary/10 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col group transform hover:-translate-y-1.5"
                >
                  {/* Top 16:10 Thumbnail Frame */}
                  <Link
                    href={game.playUrl}
                    className="relative aspect-[16/10] w-full bg-slate-900 overflow-hidden shrink-0 block cursor-pointer group/thumb"
                  >
                    {/* Cover Image */}
                    {(() => {
                      const isCustomThumbnail = Boolean(
                        game.imageUrl && (game.imageUrl.startsWith("http") || game.imageUrl.startsWith("/api/"))
                      );
                      const coverSrc = isCustomThumbnail
                        ? game.imageUrl!
                        : (game.videoId
                            ? `https://img.youtube.com/vi/${game.videoId}/maxresdefault.jpg`
                            : (game.imageUrl || "/images/games/flashcard-quiz.png"));

                      return (
                        <img
                          src={coverSrc}
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (!isCustomThumbnail && game.videoId && !target.dataset.fallback) {
                              target.dataset.fallback = "1";
                              target.src = `https://img.youtube.com/vi/${game.videoId}/hqdefault.jpg`;
                            } else if (game.imageUrl && target.src !== game.imageUrl) {
                              target.src = game.imageUrl;
                            }
                          }}
                          alt={game.title}
                          className="w-full h-full object-cover scale-[1.02] group-hover/thumb:scale-[1.08] transition-transform duration-700"
                        />
                      );
                    })()}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent" />

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



                    {/* Bottom overlay: Item count badge */}
                    <div className="absolute bottom-2.5 left-3 z-10">
                      <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[11px] font-bold border border-white/10">
                        {game.itemCount} {game.group === "match" || game.group === "flip" ? "cặp thẻ" : "câu hỏi"}
                      </span>
                    </div>
                  </Link>

                  {/* Bottom Content Container */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between bg-white dark:bg-slate-900 gap-4">
                    <div>
                      {/* Game Title */}
                      <Link href={game.playUrl} className="block group/title">
                        <h3
                          className="font-headline font-black text-base sm:text-lg text-slate-800 dark:text-white leading-snug line-clamp-2 group-hover/title:text-primary transition-colors cursor-pointer"
                          title={game.title}
                        >
                          {game.title}
                        </h3>
                      </Link>
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
    </div>
  );
}
