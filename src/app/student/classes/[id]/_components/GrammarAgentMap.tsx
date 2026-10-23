"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Lock, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  BookOpen, 
  Trophy, 
  Crown, 
  Star, 
  Sparkles, 
  Flame, 
  Zap, 
  RotateCcw, 
  FileText, 
  ArrowRight, 
  Play, 
  X, 
  Check,
  Compass,
  MapPin,
  Gift,
  Gamepad2
} from 'lucide-react';
import { 
  StudentAssignmentGroup, 
  StudentGroupItem, 
  cleanGroupTitle 
} from './StudentAssignmentsView';
import { getItemStage, isScoredAssignment } from '../_utils/assignmentOrder';
import { prefetchAssignmentData, promoteAssignmentPriority } from '../_utils/assignmentCache';
import { toast } from 'sonner';

export interface GrammarAgentMapProps {
  assignmentGroups: StudentAssignmentGroup[];
  submissionsState: Record<string, { isSubmitted: boolean; score: number | null }>;
  currentClass?: {
    id: string;
    name: string;
    gradeLevel?: string | null;
    joinCode?: string | null;
    slug?: string | null;
  };
  onSelectActivity: (assignmentId: string, groupId: string) => void;
  onEnterActivityMode?: () => void;
}

export interface GrammarDayStationActivity {
  item: StudentGroupItem;
  kind: 'lesson' | 'exercise' | 'reading' | 'review' | 'game' | 'flashcard';
  title: string;
  isSubmitted: boolean;
  score: number | null;
}

export interface GrammarDayStation {
  id: string;
  groupId: string;
  groupTitle: string;
  dayNumber: number;
  stageNumber: number;
  title: string;
  cleanTitle: string;
  viTitle?: string;
  isLocked: boolean;
  lockReason?: string;
  isCompleted: boolean;
  completedCount: number;
  totalCount: number;
  percent: number;
  theoryAct?: GrammarDayStationActivity;
  newExercises: GrammarDayStationActivity[];
  reviewExercises: GrammarDayStationActivity[];
  readingAct?: GrammarDayStationActivity;
  allActivities: GrammarDayStationActivity[];
  firstUncompletedActivityId: string | null;
  isCheckpoint: boolean;
  isStageBoss: boolean;
}

/** 15 Transparent PNG Badges for 45 Grammar Stage 1 (Days 1 - 15) */
export const GRAMMAR_STAGE_1_ISLAND_IMAGES: Record<number, string> = {
  1: '/assests/45 grammar/Map/Day_01.png',
  2: '/assests/45 grammar/Map/Day_02.png',
  3: '/assests/45 grammar/Map/Day_03.png',
  4: '/assests/45 grammar/Map/Day_04.png',
  5: '/assests/45 grammar/Map/Day_05.png',
  6: '/assests/45 grammar/Map/Day_06.png',
  7: '/assests/45 grammar/Map/Day_07.png',
  8: '/assests/45 grammar/Map/Day_08.png',
  9: '/assests/45 grammar/Map/Day_09.png',
  10: '/assests/45 grammar/Map/Day_10.png',
  11: '/assests/45 grammar/Map/Day_11.png',
  12: '/assests/45 grammar/Map/Day_12.png',
  13: '/assests/45 grammar/Map/Day_13.png',
  14: '/assests/45 grammar/Map/Day_14.png',
  15: '/assests/45 grammar/Map/Day_15.png',
};

/** Metadata for Stage 1 Day Topics */
export const GRAMMAR_DAY_TOPICS: Record<number, { en: string; vi: string; emoji: string; color: string; heroBg: string }> = {
  1: { en: 'Singular & Plural Nouns', vi: 'Danh từ số ít & Số nhiều (-s, -es, -ies, -ves)', emoji: '🐱', color: 'from-blue-500 to-indigo-600', heroBg: 'from-blue-600 via-indigo-600 to-sky-500' },
  2: { en: 'Countable vs Uncountable Nouns', vi: 'Danh từ đếm được & Không đếm được (Much, Many, Some, Any)', emoji: '⚖️', color: 'from-pink-500 to-rose-600', heroBg: 'from-pink-500 via-rose-500 to-orange-400' },
  3: { en: 'Subject Pronouns', vi: 'Đại từ nhân xưng chủ ngữ (I, You, He, She, It, We, They)', emoji: '🧒', color: 'from-emerald-500 to-teal-600', heroBg: 'from-emerald-500 via-teal-600 to-cyan-500' },
  4: { en: 'Object & Possessive', vi: 'Đại từ tân ngữ & Tính từ sở hữu (Me, Him, Her, My, His...)', emoji: '👥', color: 'from-purple-500 to-pink-600', heroBg: 'from-purple-600 via-pink-500 to-rose-500' },
  5: { en: "Present 'To Be' Verbs", vi: 'Động từ To Be ở hiện tại (Am / Is / Are & Hòa hợp chủ vị)', emoji: '✨', color: 'from-sky-500 to-blue-600', heroBg: 'from-sky-500 via-blue-600 to-indigo-500' },
  6: { en: 'There is & There are', vi: 'Cấu trúc chỉ sự tồn tại There is / There are & This / That', emoji: '🏡', color: 'from-emerald-600 to-teal-700', heroBg: 'from-emerald-600 via-teal-700 to-cyan-600' },
  7: { en: 'Checkpoint: Basic Sentences Mastery', vi: 'Tổng ôn Tuần 1: Mẫu câu đơn cơ bản S + V + O', emoji: '👑', color: 'from-amber-500 to-yellow-600', heroBg: 'from-amber-500 via-orange-500 to-yellow-400' },
  8: { en: 'Action Verbs & S-V-O Pattern', vi: 'Động từ hành động & Cấu trúc câu chủ - vị - tân', emoji: '⚽', color: 'from-amber-600 to-orange-700', heroBg: 'from-amber-600 via-orange-600 to-yellow-500' },
  9: { en: 'Present Simple: Affirmative', vi: 'Hiện tại đơn: Câu khẳng định & Quy tắc thêm s/es', emoji: '☀️', color: 'from-blue-500 to-cyan-600', heroBg: 'from-blue-600 via-cyan-600 to-indigo-500' },
  10: { en: 'Present Simple: Negative & Questions', vi: 'Hiện tại đơn: Câu phủ định (Do/Does not) & Nghi vấn', emoji: '❓', color: 'from-purple-500 to-indigo-600', heroBg: 'from-purple-600 via-indigo-600 to-pink-500' },
  11: { en: 'Adverbs of Frequency', vi: 'Trạng từ chỉ tần suất (Always, Usually, Sometimes, Never)', emoji: '📊', color: 'from-orange-500 to-red-500', heroBg: 'from-orange-500 via-red-500 to-amber-500' },
  12: { en: 'Articles: A, An, The', vi: 'Mạo từ bất định (A, An) & Mạo từ xác định (The)', emoji: '🍎', color: 'from-rose-500 to-pink-600', heroBg: 'from-rose-600 via-pink-600 to-orange-500' },
  13: { en: 'Quantifiers: Some & Any', vi: 'Từ chỉ lượng: Quy tắc dùng Some & Any trong câu', emoji: '🍓', color: 'from-teal-500 to-emerald-600', heroBg: 'from-teal-500 via-emerald-600 to-cyan-500' },
  14: { en: 'Checkpoint: Much vs Many Review', vi: 'Tổng ôn Tuần 2: Luyện tập Much vs Many & Lượng từ', emoji: '🏆', color: 'from-amber-500 to-yellow-500', heroBg: 'from-amber-500 via-yellow-500 to-orange-500' },
  15: { en: 'The -Ing Realm: Present Continuous', vi: 'Thì Hiện tại tiếp diễn: Cấu trúc Be + V-ing', emoji: '🌊', color: 'from-cyan-500 to-blue-600', heroBg: 'from-cyan-600 via-blue-600 to-indigo-500' },
};

export function parseGrammarDayTitle(title: string): { enTitle: string; viTitle?: string } {
  let cleaned = title
    .replace(/^\[?(?:Chặng|Stage)\s*\d+[^\]]*\]?\s*[-–—:]?\s*/i, '')
    .trim();
  cleaned = cleaned
    .replace(/^(?:Bài|Day|Ngày)\s*\d+\s*[-–—:]?\s*/i, '')
    .replace(/^Lý thuyết:\s*/i, '')
    .trim();

  if (cleaned.includes(' - ')) {
    const parts = cleaned.split(' - ');
    return { enTitle: parts[0].trim(), viTitle: parts.slice(1).join(' - ').trim() };
  }
  if (cleaned.includes(' : ')) {
    const parts = cleaned.split(' : ');
    return { enTitle: parts[0].trim(), viTitle: parts.slice(1).join(' : ').trim() };
  }
  const parenMatch = cleaned.match(/^(.*?)\s*\((.*?)\)$/);
  if (parenMatch) {
    return { enTitle: parenMatch[1].trim(), viTitle: parenMatch[2].trim() };
  }
  return { enTitle: cleaned };
}

export function GrammarAgentMap({
  assignmentGroups,
  submissionsState,
  currentClass,
  onSelectActivity,
}: GrammarAgentMapProps) {
  // Selected Station for the Day Modal Popup
  const [selectedStation, setSelectedStation] = useState<GrammarDayStation | null>(null);

  // Sub-Picker view: when station has multiple exercises (Trạm 2 hoặc Trạm 3)
  const [exercisePickerData, setExercisePickerData] = useState<{
    type: 'practice' | 'review';
    title: string;
    activities: GrammarDayStationActivity[];
  } | null>(null);

  // Reset exercise picker khi đóng hoặc đổi station modal & Predictive Preload
  useEffect(() => {
    if (!selectedStation) {
      setExercisePickerData(null);
      return;
    }
    // Predictive Preload: User is viewing this day's modal.
    // Prefetch all activities in background so clicking is 0ms instant!
    if (selectedStation.allActivities && selectedStation.allActivities.length > 0) {
      selectedStation.allActivities.forEach(act => {
        prefetchAssignmentData(act.item, currentClass?.id, selectedStation.groupId);
      });
    }
    // Pre-bundle dynamic imports for quiz runner and reading lesson
    if (typeof window !== 'undefined') {
      import('@/app/student/assignments/[id]/run/quiz/KidTeenQuizRunner').catch(() => {});
      import('./EmbeddedQuizContainer').catch(() => {});
    }
  }, [selectedStation, currentClass?.id]);

  // Active Stage (Default: Stage 1)
  const [selectedStage, setSelectedStage] = useState<number>(1);

  // Active Island index in the Stage 1 3D Coverflow (0 to 14)
  const [activeIslandIdx, setActiveIslandIdx] = useState<number>(0);
  const [shakingDay, setShakingDay] = useState<number | null>(null);

  // Parse assignment groups into 45 Day Stations
  const dayStations = useMemo<GrammarDayStation[]>(() => {
    const stations: GrammarDayStation[] = [];
    let runningDayIndex = 1;

    assignmentGroups.forEach((group) => {
      let stageNumber = 1;
      const stageMatch = group.title.match(/\[?(?:Chặng|Stage)\s*(\d+)/i);
      if (stageMatch && stageMatch[1]) {
        stageNumber = parseInt(stageMatch[1], 10);
      }

      const dayMatch = group.title.match(/(?:Ngày|Day|Bài)\s*(\d+)/i);
      const dayNum = dayMatch ? parseInt(dayMatch[1], 10) : runningDayIndex;
      runningDayIndex = Math.max(runningDayIndex, dayNum + 1);

      const calculatedStage = Math.ceil(dayNum / 15) || stageNumber || 1;

      // Map group items into structured activities
      const allActivities: GrammarDayStationActivity[] = group.items.map((it) => {
        const stg = getItemStage(it);
        let kind: GrammarDayStationActivity['kind'] = 'exercise';
        const titleLower = (it.assignment.title || '').toLowerCase();
        
        if (titleLower.includes('lý thuyết') || titleLower.includes('ly thuyet') || titleLower.includes('grammar lesson') || stg === 'lesson') {
          kind = 'lesson';
        } else if (titleLower.includes('[bài đọc]') || titleLower.includes('bài đọc') || stg === 'reading') {
          kind = 'reading';
        } else if (stg === 'game') {
          kind = 'game';
        } else if (stg === 'review') {
          kind = 'review';
        }

        const isSub = Boolean(submissionsState[it.assignment.id]?.isSubmitted || it.isSubmitted);
        const score = submissionsState[it.assignment.id]?.score ?? it.score ?? null;

        return {
          item: it,
          kind,
          title: it.assignment.title,
          isSubmitted: isSub,
          score,
        };
      });

      // Split into 4 Pedagogy Stations
      // 1. Theory activity
      const theoryAct = allActivities.find(a => a.kind === 'lesson');

      // 2. Reading activity
      const readingAct = allActivities.find(a => a.kind === 'reading');

      // 3. Exercise activities
      const exerciseActs = allActivities.filter(a => a !== theoryAct && a !== readingAct);

      let newExercises: GrammarDayStationActivity[] = [];
      let reviewExercises: GrammarDayStationActivity[] = [];

      const isCheckpoint = [7, 14, 21, 28, 35, 42].includes(dayNum);
      const isStageBoss = [15, 30, 45].includes(dayNum);

      if (dayNum === 1) {
        // Day 1: All exercises are new
        newExercises = exerciseActs;
        reviewExercises = [];
      } else if (isCheckpoint) {
        // Checkpoint Day: Split 3 / 2 for Part 1 & Part 2
        newExercises = exerciseActs.slice(0, 3);
        reviewExercises = exerciseActs.slice(3);
      } else {
        // Normal Day: 3 new exercises + 2 spaced review exercises
        newExercises = exerciseActs.slice(0, 3);
        reviewExercises = exerciseActs.slice(3);
      }

      // Completion counts
      const scoredActivities = allActivities.filter(a => isScoredAssignment(a.item));
      const targetActivities = scoredActivities.length > 0 ? scoredActivities : allActivities;
      const completedCount = targetActivities.filter(a => a.isSubmitted).length;
      const totalCount = targetActivities.length;
      const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
      const isCompleted = totalCount > 0 && completedCount >= totalCount;

      const firstUncompleted = allActivities.find(a => !a.isSubmitted);
      const parsed = parseGrammarDayTitle(group.title);
      const topicConfig = GRAMMAR_DAY_TOPICS[dayNum];

      stations.push({
        id: group.id,
        groupId: group.id,
        groupTitle: cleanGroupTitle(group.title),
        dayNumber: dayNum,
        stageNumber: calculatedStage,
        title: group.title,
        cleanTitle: topicConfig?.en || parsed.enTitle,
        viTitle: topicConfig?.vi || parsed.viTitle,
        isLocked: Boolean(group.isLocked),
        lockReason: group.lockReason,
        isCompleted,
        completedCount,
        totalCount,
        percent,
        theoryAct,
        newExercises,
        reviewExercises,
        readingAct,
        allActivities,
        firstUncompletedActivityId: firstUncompleted?.item.assignment.id || allActivities[0]?.item.assignment.id || null,
        isCheckpoint,
        isStageBoss,
      });
    });

    return stations.sort((a, b) => a.dayNumber - b.dayNumber);
  }, [assignmentGroups, submissionsState]);

  // Current active station (first unlocked uncompleted day)
  const currentStation = useMemo(() => {
    const firstUncompletedUnlocked = dayStations.find(s => !s.isLocked && !s.isCompleted);
    if (firstUncompletedUnlocked) return firstUncompletedUnlocked;
    const unlocked = dayStations.filter(s => !s.isLocked);
    return unlocked[unlocked.length - 1] || dayStations[0] || null;
  }, [dayStations]);

  // Sync active island index with currentStation on initial load
  useEffect(() => {
    if (currentStation && currentStation.dayNumber <= 15) {
      const idx = Math.max(0, Math.min(14, currentStation.dayNumber - 1));
      setActiveIslandIdx(idx);
    }
  }, [currentStation]);

  // Touch swipe support for 3D Carousel
  const touchStartXRef = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartXRef.current - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        setActiveIslandIdx(prev => Math.min(14, prev + 1));
      } else {
        setActiveIslandIdx(prev => Math.max(0, prev - 1));
      }
    }
    touchStartXRef.current = null;
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedStation) return;
      if (e.key === 'ArrowLeft') {
        setActiveIslandIdx(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setActiveIslandIdx(prev => Math.min(14, prev + 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedStation]);

  // Handle station click
  const handleStationClick = (station: GrammarDayStation) => {
    if (station.isLocked) {
      setShakingDay(station.dayNumber);
      setTimeout(() => setShakingDay(null), 500);
      toast.info(station.lockReason || `Ngày ${station.dayNumber} đang tạm khóa. Bạn hãy hoàn thành các ngày trước nhé! 🔒`, {
        icon: '🔒',
        duration: 3500,
      });
      return;
    }
    setSelectedStation(station);
  };

  // Predictive Preload: Preload primary activity of centered island in 3D carousel
  useEffect(() => {
    const currentIslandStation = dayStations.find(s => s.dayNumber === activeIslandIdx + 1);
    if (currentIslandStation && !currentIslandStation.isLocked && currentIslandStation.allActivities?.length) {
      const primaryAct = currentIslandStation.theoryAct || currentIslandStation.allActivities[0];
      if (primaryAct) {
        prefetchAssignmentData(primaryAct.item, currentClass?.id, currentIslandStation.groupId);
      }
    }
  }, [activeIslandIdx, dayStations, currentClass?.id]);

  // Launch assignment activity with Express Lane Priority
  const handleLaunchActivity = (assignmentId: string, groupId: string) => {
    const act = selectedStation?.allActivities.find(a => a.item.assignment.id === assignmentId);
    if (act) {
      promoteAssignmentPriority(assignmentId, currentClass?.id, groupId, act.item);
    }
    setSelectedStation(null);
    onSelectActivity(assignmentId, groupId);
  };

  // Stages List configuration
  const stagesList = [
    {
      stageNumber: 1,
      title: 'Chặng 1: Nền Tảng Căn Bản A1',
      range: 'Ngày 01 – 15',
      isLocked: false,
    },
    {
      stageNumber: 2,
      title: 'Chặng 2: Đột Phá Phản Xạ A2',
      range: 'Ngày 16 – 30',
      isLocked: true,
    },
    {
      stageNumber: 3,
      title: 'Chặng 3: Làm Chủ Ngữ Pháp B1',
      range: 'Ngày 31 – 45',
      isLocked: true,
    },
  ];

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950 font-['Baloo_2',_'Nunito',_sans-serif] select-none">
      
      {/* ══════════════════════════════════════════════════════════════════
          1. FLOATING STAGE PILL BAR (Top Center)
          ══════════════════════════════════════════════════════════════════ */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-black/40 backdrop-blur-xl border border-white/20 rounded-2xl px-2 py-1.5 shadow-xl shadow-black/30">
        {stagesList.map((stg) => {
          const isActive = stg.stageNumber === selectedStage;
          const isHardLocked = stg.isLocked;

          return (
            <button
              key={`grammar-stage-${stg.stageNumber}`}
              type="button"
              onClick={() => {
                if (isHardLocked) {
                  toast.info(`Chặng ${stg.stageNumber} (${stg.range}) đang được chuẩn bị và sẽ sớm ra mắt bạn nhé! 🚀`, {
                    icon: '🔒',
                    duration: 3500,
                  });
                  return;
                }
                setSelectedStage(stg.stageNumber);
                setSelectedStation(null);
              }}
              className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all whitespace-nowrap active:scale-95 ${
                isHardLocked
                  ? 'text-white/40 cursor-not-allowed opacity-65'
                  : isActive
                    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/30 ring-2 ring-white/40 cursor-pointer'
                    : 'text-white/80 hover:text-white hover:bg-white/10 cursor-pointer'
              }`}
            >
              {isHardLocked && <Lock className="w-3 h-3 text-amber-400 stroke-[2.8px] shrink-0" />}
              <span>Chặng {stg.stageNumber}</span>
              <span className="text-[10px] sm:text-[11px] opacity-75 font-semibold hidden sm:inline">
                ({stg.range})
              </span>
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          2. 3D ISLAND COVERFLOW CAROUSEL (Flyer.us 3D Style)
          ══════════════════════════════════════════════════════════════════ */}
      <div
        className="absolute inset-0 w-full h-full flex flex-col items-center justify-between pt-16 sm:pt-20 pb-4 sm:pb-6 overflow-hidden bg-cover bg-center select-none"
        style={{ backgroundImage: `url('/assests/45 grammar/Map/background.png')` }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Ambient Cosmic Star Dust Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/30 via-transparent to-slate-950/50 pointer-events-none" />

        {/* ── 3D COVERFLOW STAGE CONTAINER ── */}
        <div className="relative w-full flex-1 flex items-center justify-center overflow-hidden [perspective:1400px] [transform-style:preserve-3d]">
          {Array.from({ length: 15 }).map((_, idx) => {
            const dayNum = 1 + idx;
            const station = dayStations.find(s => s.dayNumber === dayNum) || {
              id: `placeholder-grammar-day-${dayNum}`,
              groupId: `group-day-${dayNum}`,
              groupTitle: `Ngày ${dayNum}`,
              dayNumber: dayNum,
              stageNumber: 1,
              title: `Day ${dayNum < 10 ? `0${dayNum}` : dayNum}`,
              cleanTitle: GRAMMAR_DAY_TOPICS[dayNum]?.en || `Day ${dayNum}`,
              viTitle: GRAMMAR_DAY_TOPICS[dayNum]?.vi,
              isLocked: dayNum > (currentStation?.dayNumber || 1),
              isCompleted: false,
              completedCount: 0,
              totalCount: 5,
              percent: 0,
              theoryAct: undefined,
              newExercises: [],
              reviewExercises: [],
              readingAct: undefined,
              allActivities: [],
              firstUncompletedActivityId: null,
              isCheckpoint: [7, 14].includes(dayNum),
              isStageBoss: dayNum === 15,
            };

            // Offset calculation identical to Vocab 3D Carousel
            let offset = idx - activeIslandIdx;
            let isDecorativePreview = false;

            if (activeIslandIdx === 0) {
              if (idx === 14) {
                offset = -1; // Day 15 teaser preview on the left of Day 1
                isDecorativePreview = true;
              } else if (idx === 13) {
                offset = -2;
                isDecorativePreview = true;
              }
            } else if (activeIslandIdx === 1) {
              if (idx === 14) {
                offset = -2;
                isDecorativePreview = true;
              }
            }

            const absOffset = Math.abs(offset);
            const isCenter = offset === 0;
            const isCurrent = station.dayNumber === currentStation?.dayNumber;
            const isCompleted = station.isCompleted;
            const isLocked = isDecorativePreview || station.isLocked;
            const isShaking = shakingDay === dayNum;
            const islandImg = GRAMMAR_STAGE_1_ISLAND_IMAGES[dayNum] || '/assests/45 grammar/Map/Day_01.png';

            const isOffscreen = absOffset > 2;
            const direction = offset >= 0 ? 1 : -1;

            const transformValue = isOffscreen
              ? `translate(-50%, -50%) translateX(${direction * 750}px) translateZ(-400px) rotateY(${direction * -35}deg) scale(0.35)`
              : `
                translate(-50%, -50%)
                translateX(${
                  offset === 0 
                    ? '0px' 
                    : offset === -1 
                      ? 'clamp(-340px, -28vw, -180px)' 
                      : offset === 1 
                        ? 'clamp(180px, 28vw, 340px)' 
                        : offset === -2 
                          ? 'clamp(-560px, -46vw, -360px)' 
                          : 'clamp(360px, 46vw, 560px)'
                })
                translateZ(${
                  offset === 0 
                    ? '60px' 
                    : absOffset === 1 
                      ? '-100px' 
                      : '-240px'
                })
                rotateY(${
                  offset === 0 
                    ? '0deg' 
                    : offset === -1 
                      ? '16deg' 
                      : offset === 1 
                        ? '-16deg' 
                        : offset === -2 
                          ? '28deg' 
                          : '-28deg'
                })
                scale(${
                  offset === 0 
                    ? 1.18 
                    : absOffset === 1 
                      ? 0.78 
                      : 0.54
                })
              `;

            const zIndexValue = isOffscreen ? 0 : offset === 0 ? 30 : absOffset === 1 ? 20 : 10;
            const opacityValue = isOffscreen ? 0 : offset === 0 ? 1 : absOffset === 1 ? 0.8 : 0.42;

            return (
              <div
                key={`grammar-island-${dayNum}`}
                onClick={() => {
                  if (isOffscreen) return;
                  if (isDecorativePreview) {
                    setShakingDay(dayNum);
                    setTimeout(() => setShakingDay(null), 500);
                    toast.info(`👑 Đây là Đích đến Chặng 1 (Ngày ${dayNum}). Bạn hãy bắt đầu từ Ngày 1 để mở khóa nhé! ✨`, {
                      icon: '✨',
                      duration: 3500,
                    });
                    return;
                  }

                  if (isCenter) {
                    handleStationClick(station);
                  } else {
                    setActiveIslandIdx(idx);
                  }
                }}
                className={`absolute top-1/2 left-1/2 flex flex-col items-center justify-center cursor-pointer select-none ${
                  absOffset === 2 ? 'hidden lg:flex' : isOffscreen ? 'pointer-events-none' : 'flex'
                }`}
                style={{
                  transform: transformValue,
                  zIndex: zIndexValue,
                  opacity: opacityValue,
                  pointerEvents: isOffscreen ? 'none' : 'auto',
                  filter: isCenter 
                    ? 'drop-shadow(0 25px 35px rgba(0,0,0,0.5)) brightness(1.05)' 
                    : 'drop-shadow(0 12px 20px rgba(0,0,0,0.35)) brightness(0.85)',
                  transition: 'transform 650ms cubic-bezier(0.34, 1.35, 0.64, 1), opacity 500ms ease, filter 500ms ease',
                  willChange: 'transform, opacity',
                  transformStyle: 'preserve-3d',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }}
              >
                {/* Floating Bobbing Wrapper */}
                <div className={`relative flex flex-col items-center ${isCenter ? 'animate-island-float' : ''} ${isShaking ? 'animate-locked-shake' : ''}`}>
                  
                  {/* Ambient Glow behind active center island */}
                  {isCenter && (
                    <div className="absolute -inset-8 sm:-inset-12 rounded-full bg-gradient-to-r from-amber-400/25 via-sky-400/20 to-indigo-400/25 blur-3xl pointer-events-none -z-10 animate-pulse" />
                  )}

                  {/* Mascot Pin over Current Day - Left Shoulder Position */}
                  {isCurrent && isCenter && (
                    <div className="absolute top-2 left-2 sm:top-3 sm:left-3 md:top-4 md:left-4 z-40 pointer-events-none whitespace-nowrap animate-bounce">
                      <div className="px-3 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-black text-xs sm:text-sm shadow-xl tracking-wide uppercase flex items-center gap-1.5 border-2 border-white ring-2 ring-amber-400/50 drop-shadow-[0_4px_12px_rgba(245,158,11,0.5)]">
                        <Flame className="w-4 h-4 fill-amber-300 text-amber-300 animate-pulse" />
                        <span>Bạn đang ở đây!</span>
                      </div>
                    </div>
                  )}

                  {/* Completed Checkmark Badge */}
                  {isCompleted && (
                    <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-30 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-white flex items-center justify-center border-2 border-white shadow-xl">
                      <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3px] fill-white text-emerald-600" />
                    </div>
                  )}

                  {/* Milestone Crowns */}
                  {(station.isCheckpoint || station.isStageBoss) && !isCompleted && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 text-amber-950 border-2 border-white shadow-xl animate-bounce">
                      <Crown className="w-5 h-5 fill-amber-900 stroke-[2px]" />
                    </div>
                  )}

                  {/* Island PNG Image */}
                  <div className="relative w-[260px] h-[260px] sm:w-[320px] sm:h-[320px] md:w-[370px] md:h-[370px] lg:w-[410px] lg:h-[410px] flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={islandImg}
                      alt={station.title}
                      className={`w-full h-full object-contain pointer-events-none select-none transition-all duration-500 ${
                        isLocked ? 'filter brightness-90 saturate-[0.85] contrast-[0.95]' : ''
                      }`}
                      draggable={false}
                    />

                    {/* Side Islands Locked Medal */}
                    {isLocked && !isCompleted && !isCenter && (
                      <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center">
                        <div className="relative px-3 sm:px-3.5 py-1.5 rounded-full bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 text-amber-950 font-black text-[11px] sm:text-xs flex items-center gap-1.5 shadow-[0_4px_0_#92400e,0_8px_18px_rgba(245,158,11,0.5)] border-2 border-white ring-2 ring-amber-300/70 select-none">
                          <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3px] fill-amber-900 text-amber-950" />
                          <span className="tracking-wide uppercase text-[10px] sm:text-[11px] font-black text-amber-950">
                            {isDecorativePreview ? 'Đích đến' : `Ngày ${dayNum}`}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Center Action Button - Positioned lower to avoid covering title */}
                    {isCenter && (
                      <div className="absolute -bottom-6 sm:-bottom-7 md:-bottom-8 left-1/2 -translate-x-1/2 z-40">
                        {isLocked && !isCompleted ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShakingDay(dayNum);
                              setTimeout(() => setShakingDay(null), 500);
                              toast.info(station.lockReason || `Ngày ${dayNum} đang tạm khóa. Bạn hãy hoàn thành các bài trước nhé! 🔒`, {
                                icon: '🔒',
                                duration: 3000,
                              });
                            }}
                            className="px-4 py-1.5 rounded-full bg-gradient-to-b from-stone-600 via-stone-700 to-stone-800 text-amber-300 font-black text-xs sm:text-sm border border-stone-400/80 shadow-[0_3px_0_#292524,0_6px_12px_rgba(0,0,0,0.3)] flex items-center gap-1.5 cursor-pointer select-none whitespace-nowrap active:translate-y-0.5"
                          >
                            <Lock className="w-3.5 h-3.5 stroke-[2.8px]" />
                            <span>🔒 ĐANG KHÓA</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStationClick(station);
                            }}
                            className="px-5 sm:px-6 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:from-amber-500 hover:to-orange-600 text-white font-black text-xs sm:text-sm md:text-base border-2 border-white shadow-[0_4px_0_#9a3412,0_10px_20px_rgba(249,115,22,0.45)] ring-2 ring-amber-300/60 active:translate-y-0.5 hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer select-none whitespace-nowrap animate-pulse hover:animate-none"
                          >
                            <span>🚀</span>
                            <span className="tracking-wider uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
                              MỞ BÀI HỌC
                            </span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Previous / Next Arrow Buttons */}
          <button
            type="button"
            onClick={() => setActiveIslandIdx(prev => Math.max(0, prev - 1))}
            disabled={activeIslandIdx === 0}
            className="absolute left-2 sm:left-4 md:left-8 top-1/2 -translate-y-1/2 z-40 w-11 h-11 sm:w-13 sm:h-13 md:w-15 md:h-15 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-center border-2 border-white shadow-[0_8px_20px_rgba(99,102,241,0.4)] transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-25 disabled:pointer-events-none cursor-pointer"
            title="Ngày trước"
          >
            <ChevronLeft className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 stroke-[3px]" />
          </button>

          <button
            type="button"
            onClick={() => setActiveIslandIdx(prev => Math.min(14, prev + 1))}
            disabled={activeIslandIdx === 14}
            className="absolute right-2 sm:right-4 md:right-8 top-1/2 -translate-y-1/2 z-40 w-11 h-11 sm:w-13 sm:h-13 md:w-15 md:h-15 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-center border-2 border-white shadow-[0_8px_20px_rgba(99,102,241,0.4)] transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-25 disabled:pointer-events-none cursor-pointer"
            title="Ngày tiếp theo"
          >
            <ChevronRight className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 stroke-[3px]" />
          </button>
        </div>


        {/* CSS Keyframes */}
        <style jsx>{`
          @keyframes islandFloat {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
          }
          @keyframes lockedShake {
            0%, 100% { transform: translateX(0px) rotate(0deg); }
            20%, 60% { transform: translateX(-9px) rotate(-2.5deg); }
            40%, 80% { transform: translateX(9px) rotate(2.5deg); }
          }
          .animate-island-float {
            animation: islandFloat 3.8s ease-in-out infinite;
          }
          .animate-locked-shake {
            animation: lockedShake 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
          }
        `}</style>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          3. GAMIFIED 4-STATION QUEST JOURNEY MODAL (Matching 45 Vocab Style)
          ══════════════════════════════════════════════════════════════════ */}
      {selectedStation && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/65 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedStation(null)}
        >
          {/* Modal Container */}
          <div 
            className="relative w-full max-w-2xl sm:max-w-3xl bg-white dark:bg-slate-900 rounded-[32px] sm:rounded-[40px] shadow-2xl border-4 border-amber-300/90 dark:border-slate-700 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close '✕' Button */}
            <button
              type="button"
              onClick={() => setSelectedStation(null)}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 z-20 w-10 h-10 rounded-full bg-slate-100 hover:bg-rose-100 dark:bg-slate-800 dark:hover:bg-rose-950/60 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-300 flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-90 border border-slate-200 dark:border-slate-700"
              title="Đóng bảng"
            >
              <X className="w-5 h-5 stroke-[2.8px]" />
            </button>

            {/* Modal Header */}
            <div className="pt-6 sm:pt-7 px-6 sm:px-8 text-center space-y-1.5 shrink-0">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-black text-xs uppercase tracking-wider shadow-xs">
                <Sparkles className="w-3.5 h-3.5 fill-white" />
                <span>Chặng {selectedStation.stageNumber} • Ngày {selectedStation.dayNumber}</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {selectedStation.cleanTitle || selectedStation.title}
              </h2>
              {selectedStation.viTitle && (
                <p className="text-sm sm:text-base font-bold text-amber-600 dark:text-amber-400 -mt-0.5">
                  {selectedStation.viTitle}
                </p>
              )}

              {/* Progress Bar in Header */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <div className="flex-1 max-w-sm flex items-center gap-2.5 bg-slate-100 dark:bg-slate-800/80 px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-xs">
                  <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                  <div className="flex-1 h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden p-0.5">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${selectedStation.percent}%` }}
                    />
                  </div>
                  <span className="text-xs font-black text-slate-700 dark:text-slate-300 tabular-nums">
                    {selectedStation.completedCount}/{selectedStation.totalCount} hoàn thành
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Content: 4 Quest Stations Grid OR Exercise Sub-Picker */}
            <div className="overflow-y-auto p-5 sm:p-7 pt-4 sm:pt-5 pb-6 sm:pb-7 no-scrollbar">
              {exercisePickerData ? (
                /* ── EXERCISE SUB-PICKER VIEW (Matching 45 Vocab Game Picker Style) ── */
                <div className="animate-in slide-in-from-right-8 duration-200">
                  {/* Back Button + Title Header */}
                  <div className="flex items-center gap-3 px-1 mb-4">
                    <button
                      type="button"
                      onClick={() => setExercisePickerData(null)}
                      className="flex items-center gap-1 text-xs font-black text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4 stroke-[2.8px]" />
                      Quay lại
                    </button>
                    <div className="flex-1 flex items-center gap-1.5 text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                      {exercisePickerData.type === 'practice' ? (
                        <Zap className="w-3.5 h-3.5 text-sky-500 fill-sky-500" />
                      ) : (
                        <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                      )}
                      <span>{exercisePickerData.title}</span>
                    </div>
                    <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${
                      exercisePickerData.type === 'practice'
                        ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 border-sky-200/80 dark:border-sky-800/80'
                        : 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-200/80 dark:border-amber-800/80'
                    }`}>
                      {exercisePickerData.activities.length} bài tập
                    </span>
                  </div>

                  {/* Exercise Cards List */}
                  <div className="flex flex-col gap-3">
                    {exercisePickerData.activities.map((act, idx) => {
                      const assignment = act.item.assignment;
                      const thumbnail = assignment.thumbnail;
                      const cleanTitle = act.title
                        .replace(/^(?:\[.*?\]|\(.*?\))\s*/g, '')
                        .trim();
                      const isDone = act.isSubmitted;
                      const isPractice = exercisePickerData.type === 'practice';

                      // Palette per item
                      const practicePalettes = [
                        { bg: 'from-sky-500/15 via-white to-blue-500/12 dark:from-sky-950/40 dark:to-blue-950/30', border: 'border-sky-300 dark:border-sky-700 shadow-[0_4px_0_#0284c7]', iconBg: 'from-sky-400 via-blue-500 to-indigo-600', glow: 'hover:shadow-sky-400/30', badgeBg: 'bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200', btnHover: 'group-hover:bg-sky-500' },
                        { bg: 'from-blue-500/15 via-white to-indigo-500/12 dark:from-blue-950/40 dark:to-indigo-950/30', border: 'border-blue-300 dark:border-blue-700 shadow-[0_4px_0_#2563eb]', iconBg: 'from-blue-400 via-indigo-500 to-violet-600', glow: 'hover:shadow-blue-400/30', badgeBg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200', btnHover: 'group-hover:bg-blue-500' },
                        { bg: 'from-cyan-500/15 via-white to-teal-500/12 dark:from-cyan-950/40 dark:to-teal-950/30', border: 'border-cyan-300 dark:border-cyan-700 shadow-[0_4px_0_#0891b2]', iconBg: 'from-cyan-400 via-teal-500 to-blue-600', glow: 'hover:shadow-cyan-400/30', badgeBg: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/60 dark:text-cyan-200', btnHover: 'group-hover:bg-cyan-500' },
                      ];

                      const reviewPalettes = [
                        { bg: 'from-amber-500/15 via-white to-orange-500/12 dark:from-amber-950/40 dark:to-orange-950/30', border: 'border-amber-300 dark:border-amber-700 shadow-[0_4px_0_#d97706]', iconBg: 'from-amber-400 via-orange-500 to-amber-600', glow: 'hover:shadow-amber-400/30', badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200', btnHover: 'group-hover:bg-amber-500' },
                        { bg: 'from-orange-500/15 via-white to-rose-500/12 dark:from-orange-950/40 dark:to-rose-950/30', border: 'border-orange-300 dark:border-orange-700 shadow-[0_4px_0_#ea580c]', iconBg: 'from-orange-400 via-rose-500 to-red-600', glow: 'hover:shadow-orange-400/30', badgeBg: 'bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-200', btnHover: 'group-hover:bg-orange-500' },
                      ];

                      const palettes = isPractice ? practicePalettes : reviewPalettes;
                      const palette = palettes[idx % palettes.length];

                      const badgeLabel = isPractice 
                        ? `Bài ${idx + 1} · Luyện tập mới` 
                        : `Ôn ${idx + 1} · Kiến thức cũ`;

                      return (
                        <div
                          key={act.item.assignment.id}
                          onClick={() => {
                            handleLaunchActivity(act.item.assignment.id, selectedStation.groupId);
                            setExercisePickerData(null);
                          }}
                          className={`group relative overflow-hidden rounded-2xl border-2 bg-gradient-to-b ${palette.bg} ${palette.border} hover:shadow-xl ${palette.glow} hover:-translate-y-1 active:translate-y-0 transition-all duration-300 cursor-pointer p-4 flex items-center gap-4`}
                        >
                          {/* Shimmer on hover */}
                          <div className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-white/30 to-transparent z-10" />

                          {/* Thumbnail / Icon */}
                          <div className={`relative shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-gradient-to-br ${palette.iconBg} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300 text-white`}>
                            {thumbnail ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={thumbnail} alt={cleanTitle} className="w-full h-full object-cover" />
                            ) : isPractice ? (
                              <Zap className="w-7 h-7 stroke-[2.3px] drop-shadow-sm" />
                            ) : (
                              <RotateCcw className="w-7 h-7 stroke-[2.3px] drop-shadow-sm" />
                            )}
                            {isDone && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <Check className="w-6 h-6 text-white stroke-[3px]" />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full ${palette.badgeBg} mb-1`}>
                              {badgeLabel}
                            </span>
                            <h4 className="text-sm sm:text-base font-black text-slate-800 dark:text-white leading-tight line-clamp-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                              {cleanTitle}
                            </h4>
                            <p className={`text-[11px] font-bold flex items-center gap-1 mt-0.5 ${
                              isDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
                            }`}>
                              {isDone ? (
                                <><Check className="w-3 h-3 stroke-[3px]" /> Đã hoàn thành · Làm lại?</>
                              ) : (
                                <><Zap className="w-3 h-3 text-amber-500" /> Vào làm ngay!</>
                              )}
                            </p>
                          </div>

                          {/* Arrow CTA */}
                          <div className={`shrink-0 w-9 h-9 rounded-full bg-white dark:bg-slate-800 ${palette.btnHover} shadow-md flex items-center justify-center group-hover:translate-x-1 transition-all duration-300`}>
                            <ArrowRight className="w-4 h-4 stroke-[2.8px] text-slate-700 dark:text-slate-300 group-hover:text-white transition-colors" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* ── NORMAL 4-STATION VIEW ─────────────────────────── */
                <>
                  {/* Adventure Sub-header */}
                  <div className="flex items-center justify-between px-1 mb-3">
                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      <MapPin className="w-3.5 h-3.5 text-amber-500" />
                      <span>
                        {selectedStation.reviewExercises.length > 0 
                          ? 'Hành trình 4 trạm hôm nay' 
                          : 'Hành trình 3 trạm hôm nay'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-200/80 dark:border-amber-800/80">
                      <Sparkles className="w-3 h-3 fill-amber-500 text-amber-500" />
                      <span>Hoàn thành mở Rương Sao ⭐</span>
                    </div>
                  </div>

                  {/* Stations Grid */}
                  <div className={`grid gap-3.5 sm:gap-4 ${
                    selectedStation.reviewExercises.length > 0
                      ? 'grid-cols-1 sm:grid-cols-2'
                      : 'grid-cols-1 sm:grid-cols-3'
                  }`}>

                    {/* ── TRẠM 1: BÍ KÍP NGỮ PHÁP (LÝ THUYẾT) ── */}
                    {selectedStation.theoryAct && (
                      <div
                        onClick={() => handleLaunchActivity(selectedStation.theoryAct!.item.assignment.id, selectedStation.groupId)}
                        className="group relative overflow-hidden p-4 sm:p-5 rounded-2xl sm:rounded-3xl border-2 transition-all duration-300 ease-out flex flex-col justify-between cursor-pointer border-emerald-300 dark:border-emerald-700/80 shadow-[0_4px_0_#059669] hover:border-emerald-400 bg-gradient-to-b from-emerald-500/12 via-white to-teal-500/10 dark:from-emerald-950/40 dark:to-teal-950/30 hover:shadow-xl hover:shadow-emerald-500/25 hover:-translate-y-1 active:translate-y-0"
                      >
                        <div>
                          {/* Step Badge */}
                          <div className="flex items-center justify-between gap-2 mb-2.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500 text-white shadow-xs">
                              Trạm 1: Bí Kíp
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                              Khám phá kiến thức
                            </span>
                          </div>

                          {/* Header + Icon */}
                          <div className="flex items-start gap-3">
                            <div className="shrink-0 w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 text-white shadow-md shadow-emerald-500/35 ring-2 ring-white/60 dark:ring-white/20 flex items-center justify-center">
                              <BookOpen className="w-5 h-5 stroke-[2.4px]" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                Lý thuyết ngữ pháp
                              </h3>
                              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 font-medium">
                                {selectedStation.theoryAct.title.replace(/^[📘📗📕📙📓📖\s]*\[?LÝ THUYẾT\]?:?\s*(?:Ngày\s*\d+:?\s*)?/i, '')}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Footer Status */}
                        <div className="mt-4 pt-2.5 border-t border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-between">
                          <span className={`text-xs font-black flex items-center gap-1 ${
                            selectedStation.theoryAct.isSubmitted 
                              ? 'text-emerald-600 dark:text-emerald-400' 
                              : 'text-slate-600 dark:text-slate-300'
                          }`}>
                            {selectedStation.theoryAct.isSubmitted ? (
                              <><Check className="w-3.5 h-3.5 stroke-[3px]" /> Đã đọc · Đọc lại?</>
                            ) : (
                              <><Zap className="w-3.5 h-3.5 text-amber-500" /> Bắt đầu học ngay</>
                            )}
                          </span>
                          <div className="w-7 h-7 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center group-hover:translate-x-1 transition-transform">
                            <ArrowRight className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300 group-hover:text-emerald-600" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── TRẠM 2: LUYỆN TẬP TRỌNG TÂM (3 BÀI MỚI) ── */}
                    {selectedStation.newExercises.length > 0 && (() => {
                      const newDoneCount = selectedStation.newExercises.filter(e => e.isSubmitted).length;
                      const newTotalCount = selectedStation.newExercises.length;
                      const isAllNewDone = newDoneCount >= newTotalCount;
                      const targetEx = selectedStation.newExercises.find(e => !e.isSubmitted) || selectedStation.newExercises[0];

                      return (
                        <div
                          onClick={() => {
                            if (selectedStation.newExercises.length > 1) {
                              setExercisePickerData({
                                type: 'practice',
                                title: 'Chọn Bài tập vận dụng ngữ pháp',
                                activities: selectedStation.newExercises,
                              });
                            } else {
                              handleLaunchActivity(targetEx.item.assignment.id, selectedStation.groupId);
                            }
                          }}
                          className="group relative overflow-hidden p-4 sm:p-5 rounded-2xl sm:rounded-3xl border-2 transition-all duration-300 ease-out flex flex-col justify-between cursor-pointer border-sky-300 dark:border-sky-700/80 shadow-[0_4px_0_#0284c7] hover:border-sky-400 bg-gradient-to-b from-sky-500/12 via-white to-blue-500/10 dark:from-sky-950/40 dark:to-blue-950/30 hover:shadow-xl hover:shadow-sky-500/25 hover:-translate-y-1 active:translate-y-0"
                        >
                          <div>
                            {/* Step Badge */}
                            <div className="flex items-center justify-between gap-2 mb-2.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-sky-500 text-white shadow-xs">
                                Trạm 2: Luyện Tập
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200">
                                {newDoneCount}/{newTotalCount} hoàn thành
                              </span>
                            </div>

                            {/* Header + Icon */}
                            <div className="flex items-start gap-3">
                              <div className="shrink-0 w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 text-white shadow-md shadow-sky-500/35 ring-2 ring-white/60 dark:ring-white/20 flex items-center justify-center">
                                <Zap className="w-5 h-5 stroke-[2.4px]" />
                              </div>
                              <div className="min-w-0">
                                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                                  Bài tập vận dụng ngữ pháp
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 font-medium">
                                  {newTotalCount} bài tập tương tác phản xạ
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Footer Status */}
                          <div className="mt-4 pt-2.5 border-t border-sky-200/60 dark:border-sky-800/40 flex items-center justify-between">
                            <span className={`text-xs font-black flex items-center gap-1 ${
                              isAllNewDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'
                            }`}>
                              {isAllNewDone ? (
                                <><Check className="w-3.5 h-3.5 stroke-[3px]" /> Hoàn thành 100% · Luyện lại</>
                              ) : (
                                <><Play className="w-3 h-3 fill-sky-600 text-sky-600" /> Chọn bài làm ngay</>
                              )}
                            </span>
                            <div className="w-7 h-7 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center group-hover:translate-x-1 transition-transform">
                              <ArrowRight className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300 group-hover:text-sky-600" />
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* ── TRẠM 3: ĐẤU TRƯỜNG ÔN LUYỆN (2 BÀI CŨ - TỰ ĐỘNG ẨN Ở DAY 1) ── */}
                    {selectedStation.reviewExercises.length > 0 && (() => {
                      const revDoneCount = selectedStation.reviewExercises.filter(e => e.isSubmitted).length;
                      const revTotalCount = selectedStation.reviewExercises.length;
                      const isAllRevDone = revDoneCount >= revTotalCount;
                      const targetRev = selectedStation.reviewExercises.find(e => !e.isSubmitted) || selectedStation.reviewExercises[0];

                      return (
                        <div
                          onClick={() => {
                            if (selectedStation.reviewExercises.length > 1) {
                              setExercisePickerData({
                                type: 'review',
                                title: 'Chọn Bài Ôn Tập',
                                activities: selectedStation.reviewExercises,
                              });
                            } else {
                              handleLaunchActivity(targetRev.item.assignment.id, selectedStation.groupId);
                            }
                          }}
                          className="group relative overflow-hidden p-4 sm:p-5 rounded-2xl sm:rounded-3xl border-2 transition-all duration-300 ease-out flex flex-col justify-between cursor-pointer border-amber-300 dark:border-amber-700/80 shadow-[0_4px_0_#d97706] hover:border-amber-400 bg-gradient-to-b from-amber-500/12 via-white to-orange-500/10 dark:from-amber-950/40 dark:to-orange-950/30 hover:shadow-xl hover:shadow-amber-500/25 hover:-translate-y-1 active:translate-y-0"
                        >
                          <div>
                            {/* Step Badge */}
                            <div className="flex items-center justify-between gap-2 mb-2.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500 text-white shadow-xs">
                                Trạm 3: Đấu Trường
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                                {revDoneCount}/{revTotalCount} hoàn thành
                              </span>
                            </div>

                            {/* Header + Icon */}
                            <div className="flex items-start gap-3">
                              <div className="shrink-0 w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/35 ring-2 ring-white/60 dark:ring-white/20 flex items-center justify-center">
                                <RotateCcw className="w-5 h-5 stroke-[2.4px]" />
                              </div>
                              <div className="min-w-0">
                                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                  Ôn tập bài cũ
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 font-medium">
                                  Củng cố kiến thức các ngày trước
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Footer Status */}
                          <div className="mt-4 pt-2.5 border-t border-amber-200/60 dark:border-amber-800/40 flex items-center justify-between">
                            <span className={`text-xs font-black flex items-center gap-1 ${
                              isAllRevDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'
                            }`}>
                              {isAllRevDone ? (
                                <><Check className="w-3.5 h-3.5 stroke-[3px]" /> Hoàn thành 100% · Ôn lại</>
                              ) : (
                                <><Play className="w-3 h-3 fill-amber-600 text-amber-600" /> Vào thử thách ngay</>
                              )}
                            </span>
                            <div className="w-7 h-7 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center group-hover:translate-x-1 transition-transform">
                              <ArrowRight className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300 group-hover:text-amber-600" />
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* ── TRẠM 4: ĐÍCH ĐẾN: THỬ THÁCH BÀI ĐỌC & MỞ RƯƠNG SAO ⭐ ── */}
                    {selectedStation.readingAct && (
                      <div
                        onClick={() => handleLaunchActivity(selectedStation.readingAct!.item.assignment.id, selectedStation.groupId)}
                        className="group relative overflow-hidden p-4 sm:p-5 rounded-2xl sm:rounded-3xl border-2 transition-all duration-300 ease-out flex flex-col justify-between cursor-pointer border-purple-400 dark:border-purple-600 shadow-[0_4px_0_#7c3aed] hover:border-purple-300 bg-gradient-to-b from-purple-500/15 via-white to-pink-500/12 dark:from-purple-950/40 dark:to-pink-950/30 hover:shadow-2xl hover:shadow-purple-400/35 hover:-translate-y-1 active:translate-y-0"
                      >
                        <div>
                          {/* Step Badge */}
                          <div className="flex items-center justify-between gap-2 mb-2.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xs">
                              {selectedStation.reviewExercises.length > 0 ? 'Trạm 4: Đích Đến' : 'Trạm 3: Đích Đến'}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200">
                              Mở Rương Sao ⭐
                            </span>
                          </div>

                          {/* Header + Icon */}
                          <div className="flex items-start gap-3">
                            <div className="relative shrink-0 w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-400 via-pink-500 to-amber-500 text-white shadow-md shadow-purple-500/40 ring-2 ring-white/60 dark:ring-white/20 flex items-center justify-center">
                              <BookOpen className="w-5 h-5 stroke-[2.4px]" />
                              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-yellow-300 text-amber-950 flex items-center justify-center shadow-xs border border-white animate-bounce">
                                <Star className="w-2.5 h-2.5 fill-amber-950 text-amber-950" />
                              </div>
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                Bài reading
                              </h3>
                              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 font-medium">
                                {selectedStation.readingAct.title.replace(/^[📘📗📕📙📓📖\s]*\[?BÀI ĐỌC\]?:?\s*/i, '')}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Footer Status */}
                        <div className="mt-4 pt-2.5 border-t border-purple-200/60 dark:border-purple-800/40 flex items-center justify-between">
                          <span className={`text-xs font-black flex items-center gap-1 ${
                            selectedStation.readingAct.isSubmitted 
                              ? 'text-purple-600 dark:text-purple-400' 
                              : 'text-slate-600 dark:text-slate-300'
                          }`}>
                            {selectedStation.readingAct.isSubmitted ? (
                              <><Star className="w-3.5 h-3.5 fill-yellow-400 text-amber-500" /> Đã mở rương · Đọc lại</>
                            ) : (
                              <><Trophy className="w-3.5 h-3.5 text-amber-500" /> Chinh phục rương sao!</>
                            )}
                          </span>
                          <div className="w-7 h-7 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center group-hover:translate-x-1 transition-transform">
                            <ArrowRight className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300 group-hover:text-purple-600" />
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                </>
              )}
            </div>


          </div>
        </div>
      )}

    </div>
  );
}
