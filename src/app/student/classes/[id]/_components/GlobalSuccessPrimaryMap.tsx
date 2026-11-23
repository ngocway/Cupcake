"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  CheckCircle2,
  X,
  Sparkles,
  Trophy,
  Star,
  BookOpen,
  Gamepad2,
  MessageCircle,
  ClipboardCheck,
  Layers,
  RotateCcw,
  ArrowRight,
  Rocket,
  Loader2,
} from "lucide-react";
import { STAGE_1_ISLAND_IMAGES } from "./ClassAdventureMap";
import type {
  GlobalSuccessPrimaryUnitsByGrade,
  GlobalSuccessUnitData,
} from "@/lib/global-success-primary-class";

const SKY_BG_IMAGE =
  "https://media.dolcake.com/assests/Vocab/dolcake_15_islands/background_2to1.jpg";

/**
 * Resolves the transparent PNG island art for each unit across Grades 1–5.
 * - Grade 1: 16 custom units (Semester 1 & 2)
 * - Grade 2: Units 1–8 (Semester 1 custom, Semester 2 fallback)
 * - Grade 3: Units 1–10 (Semester 1 custom, Semester 2 fallback)
 * - Grade 4: Units 1–10 (Semester 1 custom, Semester 2 fallback)
 * - Grade 5: Units 1–10 (Semester 1 custom, Semester 2 fallback)
 * Other units gracefully rotate through the 15 floating islands.
 */
function getUnitIslandImage(grade: number, unitNumber: number): string {
  const pad = String(unitNumber).padStart(2, "0");

  if (grade === 1 && unitNumber >= 1 && unitNumber <= 16) {
    return `https://media.dolcake.com/global-success/grade1/islands/unit_${pad}.png`;
  }
  if (grade === 2 && unitNumber >= 1 && unitNumber <= 8) {
    return `https://media.dolcake.com/global-success/grade2/islands/unit_${pad}.png`;
  }
  if (grade === 3 && unitNumber >= 1 && unitNumber <= 10) {
    return `https://media.dolcake.com/global-success/grade3/islands/unit_${pad}.png`;
  }
  if (grade === 4 && unitNumber >= 1 && unitNumber <= 10) {
    return `https://media.dolcake.com/global-success/grade4/islands/unit_${pad}.png`;
  }
  if (grade === 5 && unitNumber >= 1 && unitNumber <= 10) {
    return `https://media.dolcake.com/global-success/grade5/islands/unit_${pad}.png`;
  }

  return (
    STAGE_1_ISLAND_IMAGES[((unitNumber - 1) % 15) + 1] ||
    STAGE_1_ISLAND_IMAGES[1]
  );
}

export type StationKey = "vocab" | "conv" | "grammar" | "game" | "review";

interface StationDef {
  key: StationKey;
  order: number;
  badge: string;
  title: string;
  subtitle: string;
  gameLabel: string;
  xp: number;
  url: string | null;
  isHtml5Game: boolean;
  theme: {
    border: string;
    bg: string;
    pillBg: string;
    iconBg: string;
    accentText: string;
  };
  icon: "vocab" | "conv" | "grammar" | "game" | "review";
}

interface CompletedStationRecord {
  completedAt: string;
  score?: number | null;
}

interface GlobalSuccessPrimaryMapProps {
  unitsByGrade: GlobalSuccessPrimaryUnitsByGrade;
  initialGrade: number | null;
  initialCompletedStations: Record<string, CompletedStationRecord>;
}

const GRADE_META: Array<{
  grade: number;
  label: string;
  sub: string;
  unitsCount: number;
  gradient: string;
  emoji: string;
}> = [
  {
    grade: 1,
    label: "Lớp 1",
    sub: "16 Đảo • Làm quen & Mẫu câu",
    unitsCount: 16,
    gradient: "from-amber-400 via-orange-400 to-rose-400",
    emoji: "🐣",
  },
  {
    grade: 2,
    label: "Lớp 2",
    sub: "16 Đảo • Từ vựng & Giao tiếp",
    unitsCount: 16,
    gradient: "from-sky-400 via-cyan-400 to-blue-500",
    emoji: "🐬",
  },
  {
    grade: 3,
    label: "Lớp 3",
    sub: "20 Đảo • Nền tảng Ngữ pháp",
    unitsCount: 20,
    gradient: "from-emerald-400 via-teal-400 to-green-500",
    emoji: "🦊",
  },
  {
    grade: 4,
    label: "Lớp 4",
    sub: "20 Đảo • Mở rộng Mẫu câu",
    unitsCount: 20,
    gradient: "from-violet-400 via-purple-500 to-indigo-500",
    emoji: "🦄",
  },
  {
    grade: 5,
    label: "Lớp 5",
    sub: "20 Đảo • Vững vàng chuyển cấp",
    unitsCount: 20,
    gradient: "from-pink-400 via-rose-500 to-fuchsia-500",
    emoji: "🚀",
  },
];

function buildStationsForUnit(unit: GlobalSuccessUnitData): StationDef[] {
  const isOdd = unit.unit % 2 === 1;
  const vocabTopicId = unit.vocabTopicId || unit.enViTopicId;
  const convTopicId = unit.convTopicId || unit.enViTopicId;
  const quizTopicId = unit.quizTopicId || unit.vocabTopicId;

  // Station 1: Vocab — Odd: Match Words, Even: Conveyor Drop
  const vocabUrl = vocabTopicId
    ? isOdd
      ? `/games/match-words/index.html?v=1.5&age=6-12&topicId=${encodeURIComponent(vocabTopicId)}`
      : `/games/conveyor-drop/index.html?topicId=${encodeURIComponent(vocabTopicId)}`
    : null;
  const vocabGameLabel = isOdd ? "Nối Từ Vựng" : "Băng Chuyền Từ Vựng";

  // Station 2: Conversations — Odd: Match Text-Text, Even: Candy Quiz
  const convUrl = convTopicId
    ? isOdd
      ? `/games/match-text-text/index.html?topicId=${encodeURIComponent(convTopicId)}`
      : `/games/candy-grammar-sugar-jelly/index.html?topicId=${encodeURIComponent(convTopicId)}`
    : null;
  const convGameLabel = isOdd ? "Ghép Hội Thoại" : "Kẹo Ngọt Mẫu Câu";

  // Station 3: Grammar / Key Sentences
  const grammarTitle =
    unit.grade <= 2 ? "Mẫu Câu Trọng Tâm" : "Ôn Tập Ngữ Pháp";
  const grammarUrl = `/student/unit-grammar?grade=${unit.grade}&unit=${unit.unit}&embedded=true&fromClass=global-success-primary`;

  // Station 4: Fun Practice Game — Rotate 4 games by unit number
  const gameSlot = (unit.unit - 1) % 4;
  let funGameLabel = "Đập Trứng Trắc Nghiệm";
  let funGameUrl: string | null = null;
  if (quizTopicId) {
    const encoded = encodeURIComponent(quizTopicId);
    if (gameSlot === 0) {
      funGameLabel = "Đập Trứng Chọn Đáp Án";
      funGameUrl = `/games/egg-smash-quiz-premium-ambient/index.html?topicId=${encoded}`;
    } else if (gameSlot === 1) {
      funGameLabel = "Kẹo Ngọt Thử Thách";
      funGameUrl = `/games/candy-grammar-sugar-jelly/index.html?topicId=${encoded}`;
    } else if (gameSlot === 2) {
      funGameLabel = "Đoàn Tàu Từ Vựng";
      funGameUrl = `/games/Doan-tau-tu-vung/index.html?topicId=${encoded}`;
    } else {
      funGameLabel = "Truy Tìm Kho Báu";
      funGameUrl = `/game/treasure-grid?topicId=${encoded}&embedded=true`;
    }
  }

  // Station 5 (Now Station 4): Unit Comprehensive Review
  const reviewUrl = `/student/unit-review?grade=${unit.grade}&unit=${unit.unit}&embedded=true&fromClass=global-success-primary`;

  return [
    {
      key: "vocab",
      order: 1,
      badge: "Trạm 1: Khởi Hành",
      title: "Học & Chơi Từ Vựng",
      subtitle: vocabGameLabel,
      gameLabel: vocabGameLabel,
      xp: 15,
      url: vocabUrl,
      isHtml5Game: true,
      icon: "vocab",
      theme: {
        border: "border-emerald-300 hover:border-emerald-400",
        bg: "from-emerald-50/90 via-white to-teal-50/60",
        pillBg: "bg-emerald-500 text-white",
        iconBg: "from-emerald-400 to-teal-500",
        accentText: "text-emerald-700",
      },
    },
    {
      key: "conv",
      order: 2,
      badge: "Trạm 2: Giao Tiếp",
      title: "Luyện Hội Thoại",
      subtitle: convGameLabel,
      gameLabel: convGameLabel,
      xp: 15,
      url: convUrl,
      isHtml5Game: true,
      icon: "conv",
      theme: {
        border: "border-amber-300 hover:border-amber-400",
        bg: "from-amber-50/90 via-white to-orange-50/60",
        pillBg: "bg-amber-500 text-white",
        iconBg: "from-amber-400 to-orange-500",
        accentText: "text-amber-700",
      },
    },
    {
      key: "game",
      order: 3,
      badge: "Trạm 3: Vui Học",
      title: "Game Luyện Tập Vui",
      subtitle: funGameLabel,
      gameLabel: funGameLabel,
      xp: 20,
      url: funGameUrl,
      isHtml5Game: true,
      icon: "game",
      theme: {
        border: "border-rose-300 hover:border-rose-400",
        bg: "from-rose-50/90 via-white to-pink-50/60",
        pillBg: "bg-rose-500 text-white",
        iconBg: "from-rose-400 to-pink-500",
        accentText: "text-rose-700",
      },
    },
    {
      key: "review",
      order: 4,
      badge: "Trạm 4: Đích Đến",
      title: "Kiểm Tra Tổng Hợp",
      subtitle: "Ôn tập toàn diện Unit",
      gameLabel: "Kiểm Tra Tổng Hợp",
      xp: 30,
      url: reviewUrl,
      isHtml5Game: false,
      icon: "review",
      theme: {
        border: "border-sky-300 hover:border-sky-400",
        bg: "from-sky-50/90 via-white to-blue-50/60",
        pillBg: "bg-sky-500 text-white",
        iconBg: "from-sky-400 to-blue-600",
        accentText: "text-sky-700",
      },
    },
  ];
}

function StationIcon({ type }: { type: StationDef["icon"] }) {
  switch (type) {
    case "vocab":
      return <Layers className="w-6 h-6 text-white" />;
    case "conv":
      return <MessageCircle className="w-6 h-6 text-white" />;
    case "grammar":
      return <BookOpen className="w-6 h-6 text-white" />;
    case "game":
      return <Gamepad2 className="w-6 h-6 text-white" />;
    case "review":
      return <ClipboardCheck className="w-6 h-6 text-white" />;
  }
}

export function GlobalSuccessPrimaryMap({
  unitsByGrade,
  initialGrade,
  initialCompletedStations,
}: GlobalSuccessPrimaryMapProps) {
  const router = useRouter();
  const [selectedGrade, setSelectedGrade] = useState<number | null>(initialGrade);
  const [isSavingGrade, setIsSavingGrade] = useState(false);
  const [showGradeMenu, setShowGradeMenu] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [openUnit, setOpenUnit] = useState<GlobalSuccessUnitData | null>(null);
  const [completedStations, setCompletedStations] = useState<
    Record<string, CompletedStationRecord>
  >(initialCompletedStations);

  // Active fullscreen station overlay
  const [activeActivity, setActiveActivity] = useState<{
    unit: GlobalSuccessUnitData;
    station: StationDef;
    startedAt: number;
  } | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // Touch swipe tracking for coverflow
  const touchStartX = useRef<number | null>(null);

  // Navigate back to the previous screen (or fallback to student classes)
  const handleBack = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/student/classes");
    }
  }, [router]);

  const currentGradeUnits = useMemo(() => {
    if (!selectedGrade) return [];
    return unitsByGrade[selectedGrade] || [];
  }, [unitsByGrade, selectedGrade]);

  // Keep activeIndex in bounds when switching grade
  useEffect(() => {
    if (activeIndex >= currentGradeUnits.length) {
      setActiveIndex(0);
    }
  }, [currentGradeUnits.length, activeIndex]);

  const handleSelectGrade = useCallback(async (grade: number) => {
    setIsSavingGrade(true);
    setSelectedGrade(grade);
    setActiveIndex(0);
    setShowGradeMenu(false);
    setOpenUnit(null);
    try {
      await fetch("/api/student/global-success-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setGrade", grade }),
      });
    } catch (err) {
      console.error("Failed to save grade:", err);
    } finally {
      setIsSavingGrade(false);
    }
  }, []);

  const markStationCompleted = useCallback(
    async (grade: number, unit: number, station: StationKey, score?: number | null) => {
      const stationKey = `g${grade}-u${unit}-${station}`;
      const record: CompletedStationRecord = {
        completedAt: new Date().toISOString(),
        score: score ?? null,
      };

      setCompletedStations((prev) => ({
        ...prev,
        [stationKey]: record,
      }));

      try {
        await fetch("/api/student/global-success-progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "completeStation",
            grade,
            unit,
            station,
            score: score ?? null,
          }),
        });
      } catch (err) {
        console.error("Failed to persist station completion:", err);
      }
    },
    []
  );

  // Listen for completion events from embedded iframes (unit-grammar, unit-review, HTML5 games)
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== "object") return;

      if (data.type === "GS_STATION_COMPLETED" && data.grade && data.unit && data.station) {
        markStationCompleted(
          Number(data.grade),
          Number(data.unit),
          data.station as StationKey,
          typeof data.score === "number" ? data.score : null
        );
      } else if (
        (data.type === "ACTIVITY_COMPLETED" || data.type === "GAME_COMPLETED") &&
        activeActivity
      ) {
        markStationCompleted(
          activeActivity.unit.grade,
          activeActivity.unit.unit,
          activeActivity.station.key,
          typeof data.score === "number" ? data.score : null
        );
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [activeActivity, markStationCompleted]);

  // Keyboard navigation on coverflow
  useEffect(() => {
    if (!selectedGrade || openUnit || activeActivity) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setActiveIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === "ArrowRight") {
        setActiveIndex((prev) => Math.min(currentGradeUnits.length - 1, prev + 1));
      } else if (e.key === "Enter" && currentGradeUnits[activeIndex]) {
        setOpenUnit(currentGradeUnits[activeIndex]);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedGrade, openUnit, activeActivity, currentGradeUnits, activeIndex]);

  const getUnitCompletedCount = useCallback(
    (grade: number, unit: number) => {
      const keys: StationKey[] = ["vocab", "conv", "game", "review"];
      return keys.filter((k) => Boolean(completedStations[`g${grade}-u${unit}-${k}`])).length;
    },
    [completedStations]
  );

  const gradeStats = useMemo(() => {
    if (!selectedGrade) return { doneStations: 0, totalStations: 0, totalXp: 0 };
    const xpMap: Record<StationKey, number> = {
      vocab: 15,
      conv: 15,
      grammar: 20,
      game: 20,
      review: 30,
    };
    let doneStations = 0;
    let totalXp = 0;
    const keys: StationKey[] = ["vocab", "conv", "game", "review"];
    for (const u of currentGradeUnits) {
      for (const k of keys) {
        if (completedStations[`g${selectedGrade}-u${u.unit}-${k}`]) {
          doneStations++;
          totalXp += xpMap[k];
        }
      }
      if (completedStations[`g${selectedGrade}-u${u.unit}-grammar`]) {
        totalXp += xpMap.grammar;
      }
    }
    return {
      doneStations,
      totalStations: currentGradeUnits.length * 4,
      totalXp,
    };
  }, [selectedGrade, currentGradeUnits, completedStations]);

  const handleCloseActivity = () => {
    if (activeActivity) {
      const elapsedMs = Date.now() - activeActivity.startedAt;
      // For HTML5 games without explicit postMessage, auto-credit if played >= 12s
      if (activeActivity.station.isHtml5Game && elapsedMs >= 12000) {
        const key = `g${activeActivity.unit.grade}-u${activeActivity.unit.unit}-${activeActivity.station.key}`;
        if (!completedStations[key]) {
          markStationCompleted(
            activeActivity.unit.grade,
            activeActivity.unit.unit,
            activeActivity.station.key
          );
        }
      }
    }
    setActiveActivity(null);
    setIframeLoaded(false);
  };

  // ================= VIEW 1: GRADE PICKER GATE =================
  if (!selectedGrade) {
    return (
      <div
        className="min-h-screen w-full relative flex flex-col items-center justify-center p-4 sm:p-6 bg-cover bg-center bg-no-repeat overflow-hidden"
        style={{ backgroundImage: `url(${SKY_BG_IMAGE})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-sky-900/35 via-indigo-900/25 to-purple-950/45 backdrop-blur-[2px]" />

        <div className="relative z-10 w-full max-w-4xl">
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/85 hover:bg-white text-slate-700 font-black text-xs sm:text-sm shadow-lg backdrop-blur-md transition-all active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại</span>
            </button>
          </div>

          <div className="bg-white/95 backdrop-blur-xl rounded-[36px] border-4 border-amber-300 shadow-2xl p-6 sm:p-10 text-center space-y-7 animate-in fade-in zoom-in-95 duration-300">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-black uppercase tracking-wider shadow-md">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Global Success Tiểu Học • Miễn Phí</span>
              </div>
              <h1 className="font-headline font-black text-2xl sm:text-4xl text-slate-800 leading-tight">
                Bé đang học lớp mấy? 🎒
              </h1>
              <p className="text-sm sm:text-base font-semibold text-slate-500 max-w-xl mx-auto">
                Chọn khối lớp của bé để mở ngay bản đồ Đảo Tiếng Anh bám sát SGK Global Success!
                (Bé có thể đổi lớp bất cứ lúc nào.)
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
              {GRADE_META.map((g) => (
                <button
                  key={g.grade}
                  type="button"
                  disabled={isSavingGrade}
                  onClick={() => handleSelectGrade(g.grade)}
                  className="group relative rounded-3xl p-4 sm:p-5 bg-white border-2 border-slate-100 hover:border-amber-300 shadow-md hover:shadow-xl hover:-translate-y-1.5 active:scale-95 transition-all cursor-pointer flex flex-col items-center text-center gap-2.5 overflow-hidden"
                >
                  <div
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${g.gradient} flex items-center justify-center text-3xl sm:text-4xl shadow-lg group-hover:scale-110 transition-transform`}
                  >
                    {g.emoji}
                  </div>
                  <div>
                    <div className="font-headline font-black text-lg sm:text-xl text-slate-800 group-hover:text-indigo-600 transition-colors">
                      {g.label}
                    </div>
                    <div className="text-[11px] font-bold text-slate-500 mt-0.5 leading-snug">
                      {g.unitsCount} Đảo Unit
                    </div>
                  </div>
                  <span className="mt-1 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 group-hover:bg-indigo-600 text-indigo-600 group-hover:text-white text-[11px] font-black transition-colors">
                    Chọn <ArrowRight className="w-3 h-3" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const activeUnit = currentGradeUnits[activeIndex] || currentGradeUnits[0] || null;
  const openUnitStations = openUnit ? buildStationsForUnit(openUnit) : [];
  const openUnitDoneCount = openUnit
    ? getUnitCompletedCount(openUnit.grade, openUnit.unit)
    : 0;

  // ================= VIEW 2: 3D SKY-ISLAND COVERFLOW =================
  return (
    <div
      className="min-h-screen w-full relative overflow-hidden flex flex-col justify-between bg-cover bg-center bg-no-repeat select-none"
      style={{ backgroundImage: `url(${SKY_BG_IMAGE})` }}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null || openUnit || activeActivity) return;
        const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
        const diff = endX - touchStartX.current;
        touchStartX.current = null;
        if (diff > 45) {
          setActiveIndex((prev) => Math.max(0, prev - 1));
        } else if (diff < -45) {
          setActiveIndex((prev) => Math.min(currentGradeUnits.length - 1, prev + 1));
        }
      }}
    >
      {/* Subtle sky atmosphere vignette */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-sky-950/20 via-transparent to-indigo-950/30" />

      {/* TOP HUD BAR */}
      <header className="relative z-30 w-full px-3 sm:px-6 pt-3 sm:pt-4 flex items-center justify-between gap-2.5">
        {/* Left: Empty for airy, open sky view (Option A) */}
        <div />

        {/* Right: Grade Switcher + Progress / XP */}
        <div className="flex items-center gap-2">
          {/* XP & Progress Pill */}
          <div className="hidden md:inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/90 backdrop-blur-md border-2 border-amber-200 shadow-md text-xs font-black text-slate-700">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>
              {gradeStats.doneStations}/{gradeStats.totalStations} trạm
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="text-amber-600 flex items-center gap-0.5">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              {gradeStats.totalXp} XP
            </span>
          </div>

          {/* Grade Switcher Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowGradeMenu((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/95 hover:bg-white text-indigo-700 border-2 border-indigo-200 font-black text-xs sm:text-sm shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <span>🎒 Lớp {selectedGrade}</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  showGradeMenu ? "rotate-180" : ""
                }`}
              />
            </button>

            {showGradeMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowGradeMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-52 bg-white/95 backdrop-blur-xl rounded-2xl border-2 border-indigo-100 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Đổi khối lớp Global Success
                  </div>
                  {GRADE_META.map((g) => (
                    <button
                      key={g.grade}
                      type="button"
                      onClick={() => handleSelectGrade(g.grade)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-extrabold transition-colors cursor-pointer ${
                        selectedGrade === g.grade
                          ? "bg-indigo-50 text-indigo-700"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-base">{g.emoji}</span>
                        <span>{g.label}</span>
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {g.unitsCount} Units
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* CENTER 3D COVERFLOW STAGE */}
      <main className="relative z-20 flex-1 flex items-center justify-center w-full px-4 py-6">
        {/* Left Navigation Arrow */}
        <button
          type="button"
          disabled={activeIndex <= 0}
          onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
          className={`absolute left-3 sm:left-6 z-30 w-11 h-11 sm:w-13 sm:h-13 rounded-full flex items-center justify-center border-2 border-white/80 shadow-xl transition-all ${
            activeIndex <= 0
              ? "bg-slate-400/50 text-white/60 cursor-not-allowed"
              : "bg-gradient-to-br from-violet-500 to-indigo-600 hover:scale-110 active:scale-95 text-white cursor-pointer"
          }`}
          aria-label="Unit trước"
        >
          <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
        </button>

        {/* Right Navigation Arrow */}
        <button
          type="button"
          disabled={activeIndex >= currentGradeUnits.length - 1}
          onClick={() =>
            setActiveIndex((prev) => Math.min(currentGradeUnits.length - 1, prev + 1))
          }
          className={`absolute right-3 sm:right-6 z-30 w-11 h-11 sm:w-13 sm:h-13 rounded-full flex items-center justify-center border-2 border-white/80 shadow-xl transition-all ${
            activeIndex >= currentGradeUnits.length - 1
              ? "bg-slate-400/50 text-white/60 cursor-not-allowed"
              : "bg-gradient-to-br from-violet-500 to-indigo-600 hover:scale-110 active:scale-95 text-white cursor-pointer"
          }`}
          aria-label="Unit tiếp theo"
        >
          <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" />
        </button>

        {/* Floating Islands Stage */}
        <div className="relative w-full max-w-6xl h-[450px] sm:h-[520px] flex items-center justify-center">
          {currentGradeUnits.map((unit, idx) => {
            const offset = idx - activeIndex;
            if (Math.abs(offset) > 2) return null;

            const isCenter = offset === 0;
            const islandImg = getUnitIslandImage(unit.grade, unit.unit);
            const doneCount = getUnitCompletedCount(unit.grade, unit.unit);
            const isAllDone = doneCount === 4;

            // 3D Coverflow placement
            const translateX =
              offset === 0
                ? 0
                : offset === -1
                  ? -320
                  : offset === 1
                    ? 320
                    : offset === -2
                      ? -550
                      : 550;
            const translateY = Math.abs(offset) === 0 ? 0 : Math.abs(offset) === 1 ? -18 : -42;
            const scale = isCenter ? 1.05 : Math.abs(offset) === 1 ? 0.72 : 0.50;
            const opacity = isCenter ? 1 : Math.abs(offset) === 1 ? 0.9 : 0.65;
            const zIndex = 30 - Math.abs(offset) * 10;

            return (
              <div
                key={`${unit.grade}-${unit.unit}`}
                onClick={() => {
                  if (isCenter) {
                    setOpenUnit(unit);
                  } else {
                    setActiveIndex(idx);
                  }
                }}
                style={{
                  transform: `translateX(${translateX}px) translateY(${translateY}px) scale(${scale})`,
                  opacity,
                  zIndex,
                }}
                className="absolute transition-all duration-500 ease-out cursor-pointer flex flex-col items-center group"
              >
                {/* Top Speech Indicator on Center Island */}
                {isCenter && (
                  <div className="mb-1 animate-bounce">
                    <div
                      className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider text-white shadow-lg border-2 border-white/80 flex items-center gap-1.5 ${
                        isAllDone
                          ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                          : "bg-gradient-to-r from-amber-500 to-orange-500"
                      }`}
                    >
                      <span>{isAllDone ? "🏆 ĐÃ HOÀN THÀNH!" : "🔥 BẠN ĐANG Ở ĐÂY!"}</span>
                    </div>
                  </div>
                )}

                {/* Island Artwork */}
                <div className="relative w-[330px] sm:w-[425px] h-[270px] sm:h-[335px] flex items-center justify-center">
                  <img
                    src={islandImg}
                    alt={`Unit ${unit.unit}: ${unit.title}`}
                    draggable={false}
                    className={`w-full h-full object-contain drop-shadow-[0_24px_24px_rgba(15,23,42,0.35)] transition-transform duration-500 ${
                      isCenter ? "group-hover:scale-105" : "group-hover:scale-105"
                    }`}
                  />
                </div>

                {/* Open CTA Button on Center Island */}
                {isCenter && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenUnit(unit);
                    }}
                    className="-mt-5 sm:-mt-7 relative z-20 px-7 py-2.5 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 hover:from-amber-500 hover:to-rose-600 text-white font-headline font-black text-sm sm:text-base tracking-wide border-[3px] border-white shadow-[0_10px_25px_rgba(249,115,22,0.45)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Rocket className="w-4 h-4" />
                    <span>MỞ ĐẢO</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* BOTTOM QUICK-JUMP UNIT STRIP */}
      <footer className="relative z-30 pb-4 px-3 flex justify-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/85 backdrop-blur-md border-2 border-white/90 shadow-xl max-w-full overflow-x-auto">
          {currentGradeUnits.map((u, idx) => {
            const isCurrent = idx === activeIndex;
            const doneCount = getUnitCompletedCount(u.grade, u.unit);
            const isAllDone = doneCount === 4;
            return (
              <button
                key={u.unit}
                type="button"
                onClick={() => setActiveIndex(idx)}
                title={`Unit ${u.unit}: ${u.title} (${doneCount}/4)`}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full font-black text-xs flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                  isCurrent
                    ? "bg-gradient-to-br from-orange-500 to-rose-500 text-white scale-110 shadow-md ring-2 ring-amber-300"
                    : isAllDone
                      ? "bg-emerald-500 text-white hover:scale-105"
                      : doneCount > 0
                        ? "bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200"
                        : "bg-slate-100 text-slate-600 hover:bg-indigo-100 hover:text-indigo-700"
                }`}
              >
                {isAllDone && !isCurrent ? <Check className="w-4 h-4 stroke-[3]" /> : u.unit}
              </button>
            );
          })}
        </div>
      </footer>

      {/* ================= UNIT 5-STATION POPUP MODAL ================= */}
      {openUnit && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-white rounded-[32px] border-4 border-amber-300 shadow-2xl p-5 sm:p-7 relative space-y-5 animate-in zoom-in-95 duration-200"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setOpenUnit(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 border border-slate-200"
              aria-label="Đóng"
              title="Đóng (quay lại bản đồ đảo)"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>

            {/* Modal Header */}
            <div className="text-center space-y-2 pt-1">
              <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[11px] font-black uppercase tracking-wider shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>
                  Lớp {openUnit.grade} • Unit {openUnit.unit}
                </span>
              </div>
              <h2 className="font-headline font-black text-2xl sm:text-3xl text-slate-800 leading-tight">
                {openUnit.title}
              </h2>

              {/* Progress Bar */}
              <div className="max-w-md mx-auto pt-1">
                <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-slate-100 border border-slate-200">
                  <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                  <div className="flex-1 h-2.5 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-emerald-500 transition-all duration-500"
                      style={{ width: `${(openUnitDoneCount / 4) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-black text-slate-700 shrink-0">
                    {openUnitDoneCount}/4 hoàn thành
                  </span>
                </div>
              </div>
            </div>

            {/* Section Header with Grammar Review Button & Star Chest Badge */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <button
                type="button"
                onClick={() => {
                  const grammarTitle =
                    openUnit.grade <= 2 ? "Mẫu Câu Trọng Tâm" : "Ôn Tập Ngữ Pháp";
                  const grammarUrl = `/student/unit-grammar?grade=${openUnit.grade}&unit=${openUnit.unit}&embedded=true&fromClass=global-success-primary`;
                  setIframeLoaded(false);
                  setActiveActivity({
                    unit: openUnit,
                    station: {
                      key: "grammar",
                      order: 0,
                      badge: "Lý Thuyết & Mẫu Câu",
                      title: grammarTitle,
                      subtitle: "Công thức có loa + 15 câu",
                      gameLabel: grammarTitle,
                      xp: 20,
                      url: grammarUrl,
                      isHtml5Game: false,
                      icon: "grammar",
                      theme: {
                        border: "border-violet-300 hover:border-violet-400",
                        bg: "from-violet-50/90 via-white to-purple-50/60",
                        pillBg: "bg-violet-500 text-white",
                        iconBg: "from-violet-500 to-purple-600",
                        accentText: "text-violet-700",
                      },
                    },
                    startedAt: Date.now(),
                  });
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-700 hover:to-indigo-700 text-white font-headline font-black text-xs sm:text-sm shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer border-2 border-white/80"
              >
                <BookOpen className="w-4 h-4 text-amber-300" />
                <span>{openUnit.grade <= 2 ? "Mẫu câu trọng tâm" : "Ôn tập ngữ pháp"}</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-80" />
              </button>

              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-black">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>
                  {openUnitDoneCount === 4
                    ? "Đã mở Rương Sao Unit! 🏆"
                    : "Hoàn thành đủ 4 trạm mở Rương Sao ⭐"}
                </span>
              </div>
            </div>

            {/* 4 Station Cards Grid (2x2 balanced layout) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {openUnitStations.map((st) => {
                const stationKey = `g${openUnit.grade}-u${openUnit.unit}-${st.key}`;
                const doneRecord = completedStations[stationKey];
                const isDone = Boolean(doneRecord);
                const disabled = !st.url;

                return (
                  <button
                    key={st.key}
                    type="button"
                    disabled={disabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!st.url) return;
                      setIframeLoaded(false);
                      setActiveActivity({
                        unit: openUnit,
                        station: st,
                        startedAt: Date.now(),
                      });
                    }}
                    className={`group text-left rounded-3xl p-4 sm:p-5 bg-gradient-to-br ${st.theme.bg} border-2 ${st.theme.border} shadow-sm hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all flex flex-col justify-between gap-4 ${
                      disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                    }`}
                  >
                    {/* Card Top Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide ${st.theme.pillBg}`}
                      >
                        {st.badge}
                      </span>
                      {isDone && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black shadow-xs">
                          <Check className="w-3 h-3 stroke-[3]" />
                          Đã xong
                        </span>
                      )}
                    </div>

                    {/* Card Middle Icon + Text */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${st.theme.iconBg} flex items-center justify-center shadow-md shrink-0 group-hover:scale-105 transition-transform`}
                      >
                        <StationIcon type={st.icon} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-headline font-black text-base text-slate-800 leading-snug">
                          {st.title}
                        </h3>
                        <p className={`text-xs font-bold mt-0.5 ${st.theme.accentText}`}>
                          ✨ {st.subtitle}
                        </p>
                      </div>
                    </div>

                    {/* Card Footer XP + Action */}
                    <div className="pt-2.5 border-t border-slate-200/70 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100/90 text-amber-800 text-[11px] font-black">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />+{st.xp} XP
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-black text-slate-700 group-hover:text-indigo-600 transition-colors">
                        {isDone ? (
                          <>
                            <span>Luyện lại</span>
                            <RotateCcw className="w-3.5 h-3.5" />
                          </>
                        ) : (
                          <>
                            <span>Vào trạm ngay</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </>
                        )}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= FULLSCREEN IN-CLASS ACTIVITY OVERLAY ================= */}
      {activeActivity && activeActivity.station.url && (
        <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col">
          {/* Compact Top Bar */}
          <div className="h-12 sm:h-13 px-3 sm:px-5 bg-slate-900/95 border-b border-white/10 flex items-center justify-between gap-2 shrink-0 text-white">
            <button
              type="button"
              onClick={handleCloseActivity}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white font-black text-xs transition-all active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại Đảo Unit {activeActivity.unit.unit}</span>
            </button>

            <div className="text-center min-w-0 hidden sm:block">
              <div className="font-headline font-black text-xs sm:text-sm truncate">
                Lớp {activeActivity.unit.grade} • Unit {activeActivity.unit.unit}:{" "}
                {activeActivity.station.title}
              </div>
            </div>

            {(() => {
              const key = `g${activeActivity.unit.grade}-u${activeActivity.unit.unit}-${activeActivity.station.key}`;
              const isDone = Boolean(completedStations[key]);
              return isDone ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 font-black text-xs shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Đã xong (+{activeActivity.station.xp} XP)</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    markStationCompleted(
                      activeActivity.unit.grade,
                      activeActivity.unit.unit,
                      activeActivity.station.key
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-400/20 hover:bg-amber-400/35 border border-amber-300/50 text-amber-200 font-black text-xs transition-all cursor-pointer shrink-0"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Hoàn thành trạm</span>
                </button>
              );
            })()}
          </div>

          {/* Embedded Game / Grammar / Review Iframe */}
          <div className="relative flex-1 w-full h-full bg-slate-950">
            {!iframeLoaded && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/90 text-white gap-3">
                <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
                <p className="font-headline font-black text-sm text-amber-200">
                  Đang mở {activeActivity.station.title}...
                </p>
              </div>
            )}
            <iframe
              src={activeActivity.station.url}
              title={activeActivity.station.title}
              className="w-full h-full border-none block bg-white"
              allow="autoplay; fullscreen"
              onLoad={() => setIframeLoaded(true)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
