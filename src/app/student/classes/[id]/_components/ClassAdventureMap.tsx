"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Gift, 
  Lock, 
  CheckCircle2, 
  Play, 
  ChevronRight, 
  ChevronLeft,
  RotateCcw, 
  MapPin, 
  BookOpen, 
  Gamepad2, 
  Layers, 
  BookText, 
  Flame, 
  Award, 
  Check, 
  X, 
  Zap,
  Mic,
  Target,
  Puzzle,
  Keyboard,
  Clock,
  CircleDashed,
  GraduationCap,
  HelpCircle,
  HelpCircle as QuizIcon,
  Crown,
  Star,
  Sparkles,
  Trophy,
  ArrowRight
} from 'lucide-react';
import { 
  StudentAssignmentGroup, 
  StudentGroupItem, 
  cleanGroupTitle,
  STAGE_THEMES,
  DEFAULT_STAGE_THEME
} from './StudentAssignmentsView';
import { buildGroupTree, getItemStage, isScoredAssignment } from '../_utils/assignmentOrder';
import { toast } from 'sonner';

export interface DayStationActivity {
  item: StudentGroupItem;
  kind: 'lesson' | 'flashcard' | 'game' | 'reading' | 'exercise' | 'review';
  title: string;
  isSubmitted: boolean;
  score: number | null;
  cardCount?: number;
}

export interface DayStation {
  id: string; // cluster lesson id or group id
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
  activities: DayStationActivity[];
  firstUncompletedActivityId: string | null;
  lessonItem?: StudentGroupItem;
}

export interface ClassAdventureMapProps {
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

/** 15 Coordinate Waypoints for each stage aligned to the winding trails */
const STAGE_1_COORDINATES: Array<{ x: number; y: number; labelPos: 'top' | 'bottom' }> = [
  // Precise badge centers detected from "Whimsical Sky Learning Path.png" (2172x724)
  { x: 6.05,  y: 39.09, labelPos: 'bottom' }, // 0: Day 1  (My Body)
  { x: 13.25, y: 60.29, labelPos: 'top' },    // 1: Day 2  (My Colors)
  { x: 23.48, y: 43.64, labelPos: 'bottom' }, // 2: Day 3  (My Family)
  { x: 31.95, y: 70.66, labelPos: 'top' },    // 3: Day 4  (My Clothes)
  { x: 39.08, y: 46.16, labelPos: 'bottom' }, // 4: Day 5  (My Toys)
  { x: 45.64, y: 62.24, labelPos: 'top' },    // 5: Day 6  (Fruits)
  { x: 51.75, y: 80.92, labelPos: 'top' },    // 6: Day 7  (Vegetables)
  { x: 54.48, y: 47.74, labelPos: 'bottom' }, // 7: Day 8  (Favorite Food)
  { x: 60.59, y: 70.81, labelPos: 'top' },    // 8: Day 9  (Drinks)
  { x: 67.92, y: 84.29, labelPos: 'top' },    // 9: Day 10 (Sweet Treats)
  { x: 70.38, y: 46.64, labelPos: 'bottom' }, // 10: Day 11 (My Pets)
  { x: 76.90, y: 70.96, labelPos: 'top' },    // 11: Day 12 (Farm Animal)
  { x: 82.25, y: 47.51, labelPos: 'bottom' }, // 12: Day 13 (Wild Animals)
  { x: 87.21, y: 82.14, labelPos: 'top' },    // 13: Day 14 (Sea Animals)
  { x: 94.24, y: 63.54, labelPos: 'bottom' }, // 14: Day 15 (Cute Bugs)
];

const STAGE_2_COORDINATES: Array<{ x: number; y: number; labelPos: 'top' | 'bottom' }> = [
  { x: 7.5,  y: 38.5, labelPos: 'bottom' }, // 0: Day 16 (Toy blocks & playground entrance)
  { x: 13.0, y: 37.0, labelPos: 'top' },    // 1: Day 17 (Meadow path next to teddy bear)
  { x: 19.0, y: 37.0, labelPos: 'top' },    // 2: Day 18 (Hill crest above slide)
  { x: 23.5, y: 44.0, labelPos: 'bottom' }, // 3: Day 19 (Curve around the slide)
  { x: 27.0, y: 51.5, labelPos: 'top' },    // 4: Day 20 (Path beside the playground)
  { x: 32.0, y: 57.0, labelPos: 'bottom' }, // 5: Day 21 (Lower meadow trail)
  { x: 37.0, y: 63.5, labelPos: 'top' },    // 6: Day 22 (Approach to wooden bridge)
  { x: 42.5, y: 67.0, labelPos: 'bottom' }, // 7: Day 23 (Left entrance of wooden bridge)
  { x: 48.5, y: 65.5, labelPos: 'top' },    // 8: Day 24 (Crossing river on wooden bridge)
  { x: 54.5, y: 65.0, labelPos: 'bottom' }, // 9: Day 25 (Exiting bridge / Milestone!)
  { x: 61.5, y: 63.5, labelPos: 'top' },    // 10: Day 26 (Pinwheel cottage front yard)
  { x: 69.0, y: 60.5, labelPos: 'bottom' }, // 11: Day 27 (Cozy village path)
  { x: 76.5, y: 56.0, labelPos: 'bottom' }, // 12: Day 28 (Turn towards hill stairs)
  { x: 81.5, y: 45.0, labelPos: 'top' },    // 13: Day 29 (Ascending stairs to Treehouse)
  { x: 86.5, y: 29.5, labelPos: 'bottom' }, // 14: Day 30 (Magical Treehouse Palace summit!)
];

const STAGE_3_COORDINATES: Array<{ x: number; y: number; labelPos: 'top' | 'bottom' }> = [
  { x: 6.0,  y: 53.5, labelPos: 'bottom' }, // 0: Day 31 (Coastal cottage on far left)
  { x: 11.5, y: 47.5, labelPos: 'top' },    // 1: Day 32 (Path in front of lighthouse)
  { x: 16.5, y: 47.0, labelPos: 'bottom' }, // 2: Day 33 (Sunflower meadow path)
  { x: 21.5, y: 52.0, labelPos: 'top' },    // 3: Day 34 (Curve towards the beach)
  { x: 27.0, y: 57.5, labelPos: 'bottom' }, // 4: Day 35 (Sandy shore trail)
  { x: 33.0, y: 63.0, labelPos: 'top' },    // 5: Day 36 (Palm tree coastal road)
  { x: 39.0, y: 68.0, labelPos: 'bottom' }, // 6: Day 37 (Sunflowers & rocky outcrop)
  { x: 44.5, y: 66.5, labelPos: 'top' },    // 7: Day 38 (Ocean bridge entrance)
  { x: 51.0, y: 64.5, labelPos: 'bottom' }, // 8: Day 39 (Crossing wooden ocean bridge)
  { x: 58.0, y: 64.5, labelPos: 'top' },    // 9: Day 40 (Bridge exit / Day 40 milestone!)
  { x: 65.0, y: 62.0, labelPos: 'bottom' }, // 10: Day 41 (Flower cliff path to arch)
  { x: 73.0, y: 56.0, labelPos: 'top' },    // 11: Day 42 (Passing celebratory stone arch)
  { x: 77.5, y: 49.0, labelPos: 'bottom' }, // 12: Day 43 (Waterfall cliff road)
  { x: 83.0, y: 39.0, labelPos: 'top' },    // 13: Day 44 (Grand stone stairway climb)
  { x: 87.5, y: 29.0, labelPos: 'bottom' }, // 14: Day 45 (Celestial Star Castle - Graduation!)
];

interface StageMapConfig {
  bgImage: string;
  coordinates: Array<{ x: number; y: number; labelPos: 'top' | 'bottom' }>;
  finishTitle: string;
}

const STAGE_MAP_CONFIGS: Record<number, StageMapConfig> = {
  1: {
    bgImage: '/assests/Vocab/dolcake_15_islands/background_2to1.jpg',
    coordinates: STAGE_1_COORDINATES,
    finishTitle: 'Lâu đài Cổ tích',
  },
  2: {
    bgImage: '/assests/Vocab/Whimsical Treehouse Kingdom Valley.png',
    coordinates: STAGE_2_COORDINATES,
    finishTitle: 'Vương quốc Cây Cổ thụ',
  },
  3: {
    bgImage: '/assests/Vocab/Starry Isle Adventure Map.png',
    coordinates: STAGE_3_COORDINATES,
    finishTitle: 'Lâu đài Ngôi sao Tốt nghiệp',
  },
};

/** Individual 15 Island Transparent PNG Assets for Stage 1 3D Coverflow */
export const STAGE_1_ISLAND_IMAGES: Record<number, string> = {
  1: '/assests/Vocab/dolcake_15_islands/01_my_body.png?v=2',
  2: '/assests/Vocab/dolcake_15_islands/02_my_colors.png',
  3: '/assests/Vocab/dolcake_15_islands/03_my_family.png',
  4: '/assests/Vocab/dolcake_15_islands/04_my_clothes.png',
  5: '/assests/Vocab/dolcake_15_islands/05_my_toys.png',
  6: '/assests/Vocab/dolcake_15_islands/06_fruits.png',
  7: '/assests/Vocab/dolcake_15_islands/07_vegetables.png',
  8: '/assests/Vocab/dolcake_15_islands/08_favorite_food.png',
  9: '/assests/Vocab/dolcake_15_islands/09_drinks.png',
  10: '/assests/Vocab/dolcake_15_islands/10_sweet_treats.png',
  11: '/assests/Vocab/dolcake_15_islands/11_my_pets.png',
  12: '/assests/Vocab/dolcake_15_islands/12_farm_animal.png',
  13: '/assests/Vocab/dolcake_15_islands/13_wild_animals.png',
  14: '/assests/Vocab/dolcake_15_islands/14_sea_animals.png',
  15: '/assests/Vocab/dolcake_15_islands/15_cute_bugs.png',
};

/** Rich Topic Meta with adorable child-friendly emojis and vibrant gradients */
const DAY_TOPIC_EMOJIS: Record<number, { emoji: string; color: string; heroBg: string }> = {
  // Chặng 1: All About Me, Food & Animals (Day 1 - 15)
  1: { emoji: '🧒', color: 'from-blue-500 to-indigo-600', heroBg: 'from-blue-600 via-indigo-600 to-sky-500' },
  2: { emoji: '🎨', color: 'from-pink-500 to-rose-600', heroBg: 'from-pink-500 via-rose-500 to-orange-400' },
  3: { emoji: '👨‍👩‍👧‍👦', color: 'from-amber-500 to-orange-600', heroBg: 'from-amber-500 via-orange-500 to-yellow-400' },
  4: { emoji: '👕', color: 'from-sky-500 to-blue-600', heroBg: 'from-sky-500 via-blue-600 to-indigo-500' },
  5: { emoji: '😊', color: 'from-yellow-400 to-amber-500', heroBg: 'from-amber-400 via-yellow-500 to-orange-400' },
  6: { emoji: '🍎', color: 'from-red-500 to-rose-600', heroBg: 'from-red-500 via-rose-600 to-pink-500' },
  7: { emoji: '🥕', color: 'from-orange-500 to-amber-600', heroBg: 'from-orange-500 via-amber-600 to-yellow-500' },
  8: { emoji: '🍔', color: 'from-amber-500 to-red-500', heroBg: 'from-amber-500 via-orange-600 to-red-500' },
  9: { emoji: '🧃', color: 'from-teal-500 to-emerald-600', heroBg: 'from-teal-500 via-emerald-600 to-green-500' },
  10: { emoji: '🧁', color: 'from-purple-500 to-pink-600', heroBg: 'from-purple-600 via-pink-500 to-rose-500' },
  11: { emoji: '🐶', color: 'from-amber-600 to-orange-700', heroBg: 'from-amber-600 via-orange-600 to-yellow-500' },
  12: { emoji: '🐮', color: 'from-emerald-500 to-teal-600', heroBg: 'from-emerald-500 via-teal-600 to-cyan-500' },
  13: { emoji: '🦁', color: 'from-yellow-500 to-amber-600', heroBg: 'from-yellow-500 via-amber-600 to-orange-500' },
  14: { emoji: '🐬', color: 'from-cyan-500 to-blue-600', heroBg: 'from-cyan-500 via-blue-600 to-indigo-500' },
  15: { emoji: '🐞', color: 'from-rose-500 to-red-600', heroBg: 'from-rose-600 via-red-600 to-amber-500' },

  // Chặng 2: Toys, Sweet Home & Colors (Day 16 - 30)
  16: { emoji: '🧸', color: 'from-pink-500 to-purple-600', heroBg: 'from-pink-500 via-purple-600 to-indigo-500' },
  17: { emoji: '🎒', color: 'from-purple-500 to-indigo-600', heroBg: 'from-purple-500 via-indigo-600 to-blue-500' },
  18: { emoji: '🏫', color: 'from-blue-500 to-sky-600', heroBg: 'from-blue-500 via-sky-600 to-teal-500' },
  19: { emoji: '🛝', color: 'from-emerald-500 to-green-600', heroBg: 'from-emerald-500 via-green-600 to-lime-500' },
  20: { emoji: '🔺', color: 'from-amber-500 to-yellow-600', heroBg: 'from-amber-500 via-yellow-500 to-orange-500' },
  21: { emoji: '🏡', color: 'from-teal-500 to-cyan-600', heroBg: 'from-teal-500 via-cyan-600 to-blue-500' },
  22: { emoji: '🛏️', color: 'from-indigo-500 to-purple-600', heroBg: 'from-indigo-500 via-purple-600 to-pink-500' },
  23: { emoji: '🍳', color: 'from-orange-500 to-amber-600', heroBg: 'from-orange-500 via-amber-600 to-red-500' },
  24: { emoji: '🛁', color: 'from-cyan-500 to-sky-600', heroBg: 'from-cyan-500 via-sky-600 to-blue-500' },
  25: { emoji: '🛋️', color: 'from-amber-500 to-orange-600', heroBg: 'from-amber-500 via-orange-600 to-yellow-500' },
  26: { emoji: '🌈', color: 'from-rose-500 to-pink-600', heroBg: 'from-rose-500 via-purple-500 to-sky-500' },
  27: { emoji: '🎨', color: 'from-purple-500 to-pink-500', heroBg: 'from-purple-500 via-pink-500 to-rose-500' },
  28: { emoji: '🔢', color: 'from-blue-500 to-indigo-600', heroBg: 'from-blue-500 via-indigo-600 to-purple-500' },
  29: { emoji: '🔟', color: 'from-indigo-500 to-purple-600', heroBg: 'from-indigo-500 via-purple-600 to-pink-500' },
  30: { emoji: '⚖️', color: 'from-emerald-500 to-teal-600', heroBg: 'from-emerald-500 via-teal-600 to-cyan-500' },

  // Chặng 3: Nature, Vehicles & Happy Day (Day 31 - 45)
  31: { emoji: '⛅', color: 'from-sky-400 to-blue-500', heroBg: 'from-sky-400 via-blue-500 to-indigo-500' },
  32: { emoji: '🚀', color: 'from-indigo-500 to-purple-600', heroBg: 'from-indigo-600 via-purple-600 to-pink-500' },
  33: { emoji: '🚗', color: 'from-red-500 to-orange-500', heroBg: 'from-red-500 via-orange-500 to-amber-500' },
  34: { emoji: '🚢', color: 'from-blue-500 to-cyan-600', heroBg: 'from-blue-500 via-cyan-600 to-teal-500' },
  35: { emoji: '✈️', color: 'from-sky-500 to-indigo-500', heroBg: 'from-sky-500 via-indigo-500 to-purple-500' },
  36: { emoji: '🌲', color: 'from-emerald-500 to-green-600', heroBg: 'from-emerald-500 via-green-600 to-lime-500' },
  37: { emoji: '🏖️', color: 'from-amber-400 to-yellow-500', heroBg: 'from-amber-400 via-yellow-500 to-orange-400' },
  38: { emoji: '🎵', color: 'from-pink-500 to-rose-600', heroBg: 'from-pink-500 via-rose-600 to-purple-500' },
  39: { emoji: '⚽', color: 'from-orange-500 to-amber-600', heroBg: 'from-orange-500 via-amber-600 to-yellow-500' },
  40: { emoji: '🎂', color: 'from-purple-500 to-pink-600', heroBg: 'from-purple-500 via-pink-600 to-rose-500' },
  41: { emoji: '🎪', color: 'from-rose-500 to-red-600', heroBg: 'from-rose-500 via-red-600 to-orange-500' },
  42: { emoji: '👨‍🌾', color: 'from-emerald-600 to-teal-700', heroBg: 'from-emerald-600 via-teal-700 to-cyan-600' },
  43: { emoji: '⏰', color: 'from-indigo-500 to-blue-600', heroBg: 'from-indigo-500 via-blue-600 to-sky-500' },
  44: { emoji: '🌟', color: 'from-amber-500 to-yellow-500', heroBg: 'from-amber-500 via-yellow-500 to-orange-500' },
  45: { emoji: '🎓', color: 'from-yellow-400 to-amber-500', heroBg: 'from-amber-400 via-yellow-500 to-orange-500' },
};

/** Helper to cleanly extract English topic and Vietnamese meaning from raw title */
export function parseDayTitle(title: string): { enTitle: string; viTitle?: string } {
  let cleaned = title
    .replace(/^\[?(?:Chặng|Stage)\s*\d+[^\]]*\]?\s*[-–—:]?\s*/i, '')
    .trim();
  cleaned = cleaned
    .replace(/^(?:Bài|Day|Ngày)\s*\d+\s*[-–—:]?\s*/i, '')
    .replace(/^Lý thuyết:\s*/i, '')
    .trim();

  let enTitle = cleaned;
  let viTitle: string | undefined = undefined;

  if (cleaned.includes(' - ')) {
    const parts = cleaned.split(' - ');
    enTitle = parts[0]?.trim() || cleaned;
    viTitle = parts.slice(1).join(' - ').trim();
  } else if (cleaned.includes(' – ')) {
    const parts = cleaned.split(' – ');
    enTitle = parts[0]?.trim() || cleaned;
    viTitle = parts.slice(1).join(' – ').trim();
  } else if (cleaned.includes(' : ')) {
    const parts = cleaned.split(' : ');
    enTitle = parts[0]?.trim() || cleaned;
    viTitle = parts.slice(1).join(' : ').trim();
  }

  // Handle parenthesized subtitle like "Colors (Màu sắc)"
  if (!viTitle && enTitle.includes('(') && enTitle.endsWith(')')) {
    const parenMatch = enTitle.match(/^(.*?)\s*\(([^)]+)\)$/);
    if (parenMatch && parenMatch[1] && parenMatch[2]) {
      enTitle = parenMatch[1].trim();
      viTitle = parenMatch[2].trim();
    }
  }

  return { enTitle, viTitle };
}

/** Helper to clean raw titles into friendly child-oriented strings */
export function formatDayTitle(title: string): string {
  return parseDayTitle(title).enTitle;
}

/** Helper to extract day number from title string */
export function extractDayNumber(title?: string | null): number | null {
  if (!title) return null;
  const match = title.match(/(?:day|ngày)[-_\s]*0*(\d+)/i);
  if (match && match[1]) return parseInt(match[1], 10);
  return null;
}

export function ClassAdventureMap({
  assignmentGroups,
  submissionsState,
  currentClass,
  onSelectActivity,
}: ClassAdventureMapProps) {
  const isVocabClass = useMemo(() => {
    return currentClass?.id === 'tiny-vocab-wonders' ||
      currentClass?.joinCode === 'VOCAB45' ||
      currentClass?.name?.toLowerCase().includes('vocab') ||
      currentClass?.name?.toLowerCase().includes('từ vựng') ||
      assignmentGroups.some(g => g.title.toLowerCase().includes('bài'));
  }, [currentClass, assignmentGroups]);

  // Parse all groups & clusters into a flat list of 45 Day Stations
  const dayStations = useMemo<DayStation[]>(() => {
    const stations: DayStation[] = [];
    let runningDayIndex = 1;

    assignmentGroups.forEach((group) => {
      // Determine stage number from group title or fallback
      let stageNumber = 1;
      const stageMatch = group.title.match(/\[?(?:Chặng|Stage)\s*(\d+)/i);
      if (stageMatch && stageMatch[1]) {
        stageNumber = parseInt(stageMatch[1], 10);
      }

      const tree = buildGroupTree(group.items);

      if (tree.clusters && tree.clusters.length > 0) {
        // Group contains multiple lesson clusters (each cluster is 1 Day)
        tree.clusters.forEach((cluster) => {
          const lesson = cluster.lesson;
          const dayNum = extractDayNumber(lesson.assignment.title) ??
                         extractDayNumber(lesson.assignment.id) ??
                         runningDayIndex;
          runningDayIndex = Math.max(runningDayIndex, dayNum + 1);

          // Force correct stage based on 15-day chunks
          const calculatedStage = Math.ceil(dayNum / 15) || stageNumber || 1;

          const allClusterItems = [lesson, ...cluster.exercises];

          const activities: DayStationActivity[] = allClusterItems.map((it) => {
            const stg = getItemStage(it);
            let kind: DayStationActivity['kind'] = 'exercise';
            if (stg === 'lesson') kind = 'lesson';
            else if (stg === 'flashcard') kind = 'flashcard';
            else if (stg === 'game') kind = 'game';
            else if (stg === 'reading') kind = 'reading';
            else if (stg === 'review') kind = 'review';

            let cardCount: number | undefined;
            if (it.assignment.instructions) {
              try {
                const meta = JSON.parse(it.assignment.instructions);
                if (typeof meta.cardCount === 'number') cardCount = meta.cardCount;
              } catch {}
            }

            const isSub = Boolean(submissionsState[it.assignment.id]?.isSubmitted || it.isSubmitted);
            const score = submissionsState[it.assignment.id]?.score ?? it.score ?? null;

            return {
              item: it,
              kind,
              title: it.assignment.title,
              isSubmitted: isSub,
              score,
              cardCount,
            };
          });

          const scoredActivities = activities.filter(a => isScoredAssignment(a.item));
          const targetActivities = scoredActivities.length > 0 ? scoredActivities : activities;
          const completedCount = targetActivities.filter(a => a.isSubmitted).length;
          const totalCount = targetActivities.length;
          const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
          const isCompleted = totalCount > 0 && completedCount >= totalCount;

          const firstUncompleted = activities.find(a => !a.isSubmitted);
          const parsed = parseDayTitle(lesson.assignment.title);

          stations.push({
            id: lesson.assignment.id,
            groupId: group.id,
            groupTitle: cleanGroupTitle(group.title),
            dayNumber: dayNum,
            stageNumber: calculatedStage,
            title: lesson.assignment.title,
            cleanTitle: parsed.enTitle,
            viTitle: parsed.viTitle,
            isLocked: Boolean(group.isLocked),
            lockReason: group.lockReason,
            isCompleted,
            completedCount,
            totalCount,
            percent,
            activities,
            firstUncompletedActivityId: firstUncompleted?.item.assignment.id || activities[0]?.item.assignment.id || null,
            lessonItem: lesson,
          });
        });
      } else {
        // Flat group without clusters (The whole group is 1 Day station)
        const dayNum = extractDayNumber(group.title) ?? runningDayIndex++;
        const calculatedStage = Math.ceil(dayNum / 15) || stageNumber || 1;

        const activities: DayStationActivity[] = group.items.map((it) => {
          const stg = getItemStage(it);
          let kind: DayStationActivity['kind'] = 'exercise';
          if (stg === 'lesson') kind = 'lesson';
          else if (stg === 'flashcard') kind = 'flashcard';
          else if (stg === 'game') kind = 'game';
          else if (stg === 'reading') kind = 'reading';
          else if (stg === 'review') kind = 'review';

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

        const scoredActivities = activities.filter(a => isScoredAssignment(a.item));
        const targetActivities = scoredActivities.length > 0 ? scoredActivities : activities;
        const completedCount = targetActivities.filter(a => a.isSubmitted).length;
        const totalCount = targetActivities.length;
        const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
        const isCompleted = totalCount > 0 && completedCount >= totalCount;

        const firstUncompleted = activities.find(a => !a.isSubmitted);
        const parsed = parseDayTitle(group.title);

        stations.push({
          id: group.id,
          groupId: group.id,
          groupTitle: cleanGroupTitle(group.title),
          dayNumber: dayNum,
          stageNumber: calculatedStage,
          title: group.title,
          cleanTitle: parsed.enTitle,
          viTitle: parsed.viTitle,
          isLocked: Boolean(group.isLocked),
          lockReason: group.lockReason,
          isCompleted,
          completedCount,
          totalCount,
          percent,
          activities,
          firstUncompletedActivityId: firstUncompleted?.item.assignment.id || activities[0]?.item.assignment.id || null,
        });
      }
    });

    return stations.sort((a, b) => a.dayNumber - b.dayNumber);
  }, [assignmentGroups, submissionsState]);

  // Current active day (first unlocked uncompleted day)
  const currentStation = useMemo(() => {
    const firstUncompletedUnlocked = dayStations.find(s => !s.isLocked && !s.isCompleted);
    if (firstUncompletedUnlocked) return firstUncompletedUnlocked;
    const unlocked = dayStations.filter(s => !s.isLocked);
    return unlocked[unlocked.length - 1] || dayStations[0] || null;
  }, [dayStations]);

  // Selected Stage Number (1, 2, or 3)
  const [selectedStage, setSelectedStage] = useState<number>(() => {
    return currentStation?.stageNumber || 1;
  });

  // Keep selected stage synced with active progress on initial load
  useEffect(() => {
    if (currentStation?.stageNumber) {
      setSelectedStage(currentStation.stageNumber);
    }
  }, [currentStation?.stageNumber]);

  // Selected Day station for Slide-over Drawer / Details Panel
  const [selectedStation, setSelectedStation] = useState<DayStation | null>(null);

  // Game Picker: khi station có nhiều games, lưu danh sách để user chọn
  const [gamePickerActivities, setGamePickerActivities] = useState<DayStationActivity[] | null>(null);

  // Reset game picker khi đóng station modal
  useEffect(() => {
    if (!selectedStation) setGamePickerActivities(null);
  }, [selectedStation]);

  // Group stations by Stage (Chặng)
  const stagesList = useMemo(() => {
    const stages = [
      {
        stageNumber: 1,
        title: 'Chặng 1: Khám phá bản thân & Sắc màu',
        subTitle: 'All About Me, Food & Animals (Day 01 – 15)',
        range: 'Day 1 – 15',
        startDay: 1,
        endDay: 15,
      },
      {
        stageNumber: 2,
        title: 'Chặng 2: Đồ chơi, Ngôi nhà & Màu sắc',
        subTitle: 'Toys, Sweet Home & Colors (Day 16 – 30)',
        range: 'Day 16 – 30',
        startDay: 16,
        endDay: 30,
      },
      {
        stageNumber: 3,
        title: 'Chặng 3: Thiên nhiên, Xe cộ & Ngày vui',
        subTitle: 'Nature, Vehicles & Happy Day (Day 31 – 45)',
        range: 'Day 31 – 45',
        startDay: 31,
        endDay: 45,
      },
    ];

    return stages.map(stg => {
      const stations = dayStations.filter(s => s.dayNumber >= stg.startDay && s.dayNumber <= stg.endDay);
      const completedCount = stations.filter(s => s.isCompleted).length;
      const isLocked = stations.length > 0 && stations.every(s => s.isLocked);
      return {
        ...stg,
        stations,
        completedCount,
        totalCount: stations.length || 15,
        isLocked,
        theme: STAGE_THEMES[stg.stageNumber] || DEFAULT_STAGE_THEME,
      };
    });
  }, [dayStations]);

  // Active Stage object & its 15 stations
  const activeStageInfo = useMemo(() => {
    return stagesList.find(s => s.stageNumber === selectedStage) || stagesList[0];
  }, [stagesList, selectedStage]);

  // Overall course statistics
  const totalCompletedDays = dayStations.filter(s => s.isCompleted).length;
  const totalDaysCount = Math.max(dayStations.length, 45);
  const overallPercent = totalDaysCount > 0
    ? Math.round((totalCompletedDays / totalDaysCount) * 100)
    : 0;

  // Handle station click
  const handleStationClick = (station: DayStation) => {
    if (station.isLocked) {
      toast.info(station.lockReason || `Ngày ${station.dayNumber} đang tạm khóa. Bé hãy hoàn thành các ngày trước nhé!`, {
        icon: '🔒',
        duration: 3500,
      });
      return;
    }
    setSelectedStation(station);
  };

  // Launch station action
  const handleLaunchDay = (station: DayStation, specificActivityId?: string) => {
    const targetActivityId = specificActivityId || station.firstUncompletedActivityId || station.activities[0]?.item.assignment.id;
    if (!targetActivityId) {
      toast.error('Chưa có hoạt động nào trong ngày học này.');
      return;
    }
    setSelectedStation(null);
    onSelectActivity(targetActivityId, station.groupId);
  };

  // Map scroll container ref to auto-scroll horizontally on mobile
  const mapScrollRef = useRef<HTMLDivElement | null>(null);
  const activeStageMapConfig = STAGE_MAP_CONFIGS[selectedStage] || STAGE_MAP_CONFIGS[1];

  // Active Island Index for Stage 1 3D Carousel (0 to 14)
  const [activeIslandIdx, setActiveIslandIdx] = useState<number>(0);
  const [shakingDay, setShakingDay] = useState<number | null>(null);

  // Initialize/sync active island when currentStation changes or stage changes
  useEffect(() => {
    if (selectedStage === 1 && currentStation && currentStation.stageNumber === 1) {
      const idx = Math.max(0, Math.min(14, (currentStation.dayNumber - 1) % 15));
      setActiveIslandIdx(idx);
    }
  }, [selectedStage, currentStation]);

  // Touch swipe support for Stage 1 3D Carousel
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

  // Keyboard navigation for Stage 1 Carousel
  useEffect(() => {
    if (selectedStage !== 1) return;
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
  }, [selectedStage, selectedStation]);

  useEffect(() => {
    // If current station is in the selected stage, gently scroll to center it on small screens (Stages 2 & 3)
    if (selectedStage !== 1 && mapScrollRef.current && currentStation && currentStation.stageNumber === selectedStage) {
      const idxInStage = (currentStation.dayNumber - 1) % 15;
      const coord = activeStageMapConfig.coordinates[idxInStage];
      if (coord) {
        const containerWidth = mapScrollRef.current.scrollWidth;
        const targetX = (coord.x / 100) * containerWidth;
        mapScrollRef.current.scrollTo({
          left: Math.max(0, targetX - mapScrollRef.current.clientWidth / 2),
          behavior: 'smooth',
        });
      }
    }
  }, [selectedStage, currentStation, activeStageMapConfig]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-900 font-['Baloo_2',_'Nunito',_sans-serif] select-none">
      
      {/* ══════════════════════════════════════════════════════════════════
          1. FLOATING STAGE PILL BAR (centered top, no full HUD)
          ══════════════════════════════════════════════════════════════════ */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 sm:top-4 sm:left-4 sm:translate-x-0 md:left-6 z-20 flex items-center gap-1.5 bg-black/30 backdrop-blur-xl border border-white/20 rounded-2xl px-2 py-1.5 shadow-xl shadow-black/20">
        {stagesList.map((stg) => {
          const isActive = stg.stageNumber === selectedStage;
          const isHardLocked = stg.stageNumber > 1;
          return (
            <button
              key={`stage-tab-${stg.stageNumber}`}
              type="button"
              onClick={() => {
                if (isHardLocked) {
                  toast.info(`Chặng ${stg.stageNumber} đang tạm khóa. Bé hãy hoàn thành thật tốt Chặng 1 trước nhé! 🌟`, {
                    icon: '🔒',
                    duration: 3500,
                  });
                  return;
                }
                setSelectedStage(stg.stageNumber);
                setSelectedStation(null);
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap active:scale-95 ${
                isHardLocked
                  ? 'text-white/40 cursor-not-allowed opacity-60'
                  : isActive
                    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/30 ring-2 ring-white/30 cursor-pointer'
                    : 'text-white/80 hover:text-white hover:bg-white/10 cursor-pointer'
              }`}
            >
              {isHardLocked && <Lock className="w-3 h-3 text-amber-400/80 stroke-[2.5px] shrink-0" />}
              <span>Chặng {stg.stageNumber}</span>
              {!isHardLocked && <span className="text-[10px] opacity-75 font-semibold">({stg.totalCount} ngày)</span>}
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          2A. STAGE 1: 3D ISLAND COVERFLOW CAROUSEL (Flyer.us Style)
          ══════════════════════════════════════════════════════════════════ */}
      {selectedStage === 1 ? (
        <div
          className="absolute inset-0 w-full h-full flex flex-col items-center justify-between pt-14 sm:pt-4 pb-2 sm:pb-3 overflow-hidden bg-cover bg-center select-none"
          style={{ backgroundImage: `url('/assests/Vocab/dolcake_15_islands/background_2to1.jpg')` }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Ambient Sky Gradient & Stardust Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-sky-950/25 via-transparent to-slate-950/45 pointer-events-none" />

          {/* ── 3D COVERFLOW STAGE CONTAINER ── */}
          <div className="relative w-full flex-1 flex items-center justify-center overflow-visible [perspective:1400px] [transform-style:preserve-3d]">
            {/* ── 15 ISLANDS PERMANENTLY MOUNTED IN 3D SPACE (Zero unmount for 60fps) ── */}
            {Array.from({ length: 15 }).map((_, idx) => {
              const dayNum = 1 + idx;
              const station = dayStations.find(s => s.dayNumber === dayNum) || {
                id: `placeholder-day-${dayNum}`,
                groupId: `group-day-${dayNum}`,
                groupTitle: `Ngày ${dayNum}`,
                dayNumber: dayNum,
                stageNumber: 1,
                title: `Day ${dayNum < 10 ? `0${dayNum}` : dayNum}`,
                cleanTitle: `Day ${dayNum}`,
                viTitle: undefined,
                isLocked: dayNum > (currentStation?.dayNumber || 1),
                isCompleted: false,
                completedCount: 0,
                totalCount: 4,
                percent: 0,
                activities: [],
                firstUncompletedActivityId: null,
              };

              // Determine offset & teaser preview status
              let offset = idx - activeIslandIdx;
              let isDecorativePreview = false;

              if (activeIslandIdx === 0) {
                if (idx === 14) {
                  offset = -1; // Day 15 teaser preview on the left of Day 1
                  isDecorativePreview = true;
                } else if (idx === 13) {
                  offset = -2; // Day 14 teaser preview on PC
                  isDecorativePreview = true;
                }
              } else if (activeIslandIdx === 1) {
                if (idx === 14) {
                  offset = -2; // Day 15 teaser preview on PC
                  isDecorativePreview = true;
                }
              }

              const absOffset = Math.abs(offset);
              const isCenter = offset === 0;
              const isCurrent = station.dayNumber === currentStation?.dayNumber;
              const isCompleted = station.isCompleted;
              const isLocked = isDecorativePreview || station.isLocked;
              const isShaking = shakingDay === dayNum;
              const islandImg = STAGE_1_ISLAND_IMAGES[dayNum] || '/assests/Vocab/dolcake_15_islands/01_my_body.png?v=2';

              const topicMeta = DAY_TOPIC_EMOJIS[dayNum] || {
                emoji: '⭐',
                color: 'from-blue-500 to-indigo-600',
                heroBg: 'from-blue-600 via-indigo-600 to-purple-600'
              };

              // Determine 3D transform, scale, depth, and visibility
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
                  key={`island-node-${dayNum}`}
                  onClick={() => {
                    if (isOffscreen) return;
                    if (isDecorativePreview) {
                      setShakingDay(dayNum);
                      setTimeout(() => setShakingDay(null), 500);
                      toast.info(`👑 Đây là Đảo Đích Chặng (Ngày ${dayNum}). Bé hãy bắt đầu từ Ngày 1 để mở khóa nhé!`, {
                        icon: '✨',
                        duration: 3500,
                      });
                      return;
                    }

                    if (isCenter) {
                      if (isLocked) {
                        setShakingDay(dayNum);
                        setTimeout(() => setShakingDay(null), 500);
                        toast.info(station.lockReason || `Ngày ${dayNum} đang tạm khóa. Bé hãy hoàn thành các bài trước nhé!`, {
                          icon: '🔒',
                          duration: 3000,
                        });
                      } else {
                        handleStationClick(station);
                      }
                    } else {
                      // Click on left/right island slides it smoothly into center!
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
                      ? 'drop-shadow(0 25px 35px rgba(0,0,0,0.38)) brightness(1.03)' 
                      : 'drop-shadow(0 12px 20px rgba(0,0,0,0.22)) brightness(0.88)',
                    transition: 'transform 650ms cubic-bezier(0.34, 1.35, 0.64, 1), opacity 500ms ease, filter 500ms ease',
                    willChange: 'transform, opacity',
                    transformStyle: 'preserve-3d',
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                  }}
                >
                  {/* Floating bobbing wrapper on the active center island & shake target */}
                  <div className={`relative flex flex-col items-center ${isCenter ? 'animate-island-float' : ''} ${isShaking ? 'animate-locked-shake' : ''}`}>
                    
                    {/* ── AMBIENT WARM SUNBEAM GLOW (Behind active center island) ── */}
                    {isCenter && (
                      <div className="absolute -inset-6 sm:-inset-10 rounded-full bg-gradient-to-r from-amber-300/25 via-orange-300/20 to-yellow-300/25 blur-2xl pointer-events-none -z-10 animate-pulse" />
                    )}

                    {/* ── MASCOT AVATAR PIN (Bouncing over Active Day) ── */}
                    {isCurrent && isCenter && (
                      <div className="absolute -top-6 sm:-top-8 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce z-40 pointer-events-none whitespace-nowrap">
                        <div className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-black text-xs sm:text-sm shadow-xl tracking-wide uppercase flex items-center gap-1.5 border-2 border-white ring-2 ring-amber-400/50">
                          <Flame className="w-4 h-4 fill-amber-300 text-amber-300" />
                          <span>Bé đang ở đây!</span>
                        </div>
                        <div className="w-2.5 h-2.5 bg-orange-500 rotate-45 -mt-1 shadow-xs border-r-2 border-b-2 border-white" />
                      </div>
                    )}

                    {/* ── COMPLETED VICTORY BADGE ── */}
                    {isCompleted && (
                      <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-30 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-white flex items-center justify-center border-2 border-white shadow-xl">
                        <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3px] fill-white text-emerald-600" />
                      </div>
                    )}

                    {/* ── MILESTONE GIFT (Day 10) ── */}
                    {idx === 9 && !isCompleted && (
                      <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-30 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 text-white flex items-center justify-center border-2 border-white shadow-xl animate-pulse">
                        <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                    )}

                    {/* ── FINISH CROWN (Day 15) ── */}
                    {idx === 14 && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 text-amber-950 border-2 border-white shadow-xl animate-bounce">
                        <Crown className="w-5 h-5 fill-amber-900 stroke-[2px]" />
                      </div>
                    )}

                    {/* ── TEASER GOAL BADGE (For preview island 15 next to Day 1) ── */}
                    {isDecorativePreview && idx === 14 && (
                      <div className="absolute -top-11 left-1/2 -translate-x-1/2 z-40 pointer-events-none whitespace-nowrap">
                        <div className="px-2.5 py-0.5 rounded-full bg-amber-500/95 text-white font-black text-[10px] sm:text-[11px] shadow-lg flex items-center gap-1 border border-white/80 ring-2 ring-amber-300/40">
                          <Sparkles className="w-3 h-3 fill-amber-200 text-amber-200" />
                          <span>Đích đến Chặng 1</span>
                        </div>
                      </div>
                    )}

                    {/* ── TRANSPARENT PNG ISLAND IMAGE (Art preserved 100%) ── */}
                    <div className="relative w-[260px] h-[260px] sm:w-[320px] sm:h-[320px] md:w-[370px] md:h-[370px] lg:w-[410px] lg:h-[410px] flex items-center justify-center">
                      <img
                        src={islandImg}
                        alt={station.title}
                        className={`w-full h-full object-contain pointer-events-none select-none transition-all duration-500 ${
                          isLocked ? 'filter brightness-90 saturate-[0.85] contrast-[0.95]' : ''
                        }`}
                        draggable={false}
                      />

                      {/* ── PHONG CÁCH A: Ổ KHÓA HOÀNG GIA MA THUẬT (Dành cho các đảo 2 bên) ── */}
                      {isLocked && !isCompleted && !isCenter && (
                        <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center">
                          <div className="relative">
                            {/* Golden magical outer glow */}
                            <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 blur-md opacity-80 animate-pulse" />
                            
                            {/* 3D Chunky Royal Padlock Medal */}
                            <div className="relative px-3 sm:px-3.5 py-1.5 rounded-full bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 text-amber-950 font-black text-[11px] sm:text-xs flex items-center gap-1.5 shadow-[0_4px_0_#92400e,0_8px_18px_rgba(245,158,11,0.5)] border-2 border-white ring-2 ring-amber-300/70 select-none">
                              <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3px] fill-amber-900 text-amber-950" />
                              <span className="tracking-wide uppercase text-[10px] sm:text-[11px] font-black text-amber-950 drop-shadow-xs">
                                {isDecorativePreview ? 'Đích đến' : `Ngày ${dayNum}`}
                              </span>
                              <Sparkles className="w-3 h-3 text-amber-100 fill-amber-100" />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ── CHUNKY 3D ACTION BUTTON DƯỚI ĐÁY ĐẢO TÂM ĐIỂM (🚀 MỞ / 🔒 ĐANG KHÓA) ── */}
                      {isCenter && (
                        <div className="absolute bottom-1 sm:bottom-2 md:bottom-2.5 left-1/2 -translate-x-1/2 z-40">
                          {isLocked && !isCompleted ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShakingDay(dayNum);
                                setTimeout(() => setShakingDay(null), 500);
                                toast.info(station.lockReason || `Ngày ${dayNum} đang tạm khóa. Bé hãy hoàn thành các bài trước nhé!`, {
                                  icon: '🔒',
                                  duration: 3000,
                                });
                              }}
                              className="group relative px-3.5 sm:px-4.5 py-1 sm:py-1.5 rounded-full bg-gradient-to-b from-stone-600 via-stone-700 to-stone-800 text-amber-300 font-black text-[10.5px] sm:text-xs border border-stone-400/80 shadow-[0_3px_0_#292524,0_6px_12px_rgba(0,0,0,0.3)] ring-2 ring-stone-500/30 active:translate-y-0.5 active:shadow-[0_1px_0_#292524] transition-all flex items-center gap-1.5 cursor-pointer select-none whitespace-nowrap"
                            >
                              <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.8px]" />
                              <span>🔒 ĐANG KHÓA</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStationClick(station);
                              }}
                              className="group relative px-4.5 sm:px-5.5 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:from-amber-500 hover:to-orange-600 text-white font-black text-[11px] sm:text-xs md:text-sm border-2 border-white shadow-[0_3px_0_#9a3412,0_8px_16px_rgba(249,115,22,0.45)] ring-2 ring-amber-300/60 active:translate-y-0.5 active:shadow-[0_1px_0_#9a3412] hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer select-none whitespace-nowrap animate-pulse hover:animate-none"
                            >
                              {/* Top glossy curved highlight reflection */}
                              <div className="absolute inset-x-2 top-0.5 h-1.5 rounded-full bg-gradient-to-b from-white/70 to-transparent pointer-events-none" />
                              <span className="text-xs sm:text-sm">🚀</span>
                              <span className="tracking-wider uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
                                MỞ
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

            {/* ── PREV / NEXT NAVIGATION ARROWS ── */}
            <button
              type="button"
              onClick={() => setActiveIslandIdx(prev => Math.max(0, prev - 1))}
              disabled={activeIslandIdx === 0}
              className="absolute left-2 sm:left-4 md:left-8 top-1/2 -translate-y-1/2 z-40 w-11 h-11 sm:w-13 sm:h-13 md:w-15 md:h-15 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-center border-2 border-white shadow-[0_8px_20px_rgba(99,102,241,0.4)] transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-25 disabled:pointer-events-none cursor-pointer"
              title="Đảo trước"
            >
              <ChevronLeft className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 stroke-[3px]" />
            </button>

            <button
              type="button"
              onClick={() => setActiveIslandIdx(prev => Math.min(14, prev + 1))}
              disabled={activeIslandIdx === 14}
              className="absolute right-2 sm:right-4 md:right-8 top-1/2 -translate-y-1/2 z-40 w-11 h-11 sm:w-13 sm:h-13 md:w-15 md:h-15 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-center border-2 border-white shadow-[0_8px_20px_rgba(99,102,241,0.4)] transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-25 disabled:pointer-events-none cursor-pointer"
              title="Đảo tiếp theo"
            >
              <ChevronRight className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 stroke-[3px]" />
            </button>
          </div>




          {/* Keyframe Animations */}
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
      ) : (
        /* ══════════════════════════════════════════════════════════════════
            2B. STAGES 2 & 3: THE ADVENTURE PANORAMIC MAP CANVAS
            ══════════════════════════════════════════════════════════════════ */
        <div 
          ref={mapScrollRef}
          className="absolute inset-0 w-full h-full overflow-x-auto overflow-y-hidden select-none bg-sky-200 cursor-grab active:cursor-grabbing"
          style={{ scrollBehavior: 'smooth' }}
        >
          {/* Panorama Canvas: Full width and height on desktop, scrollable on mobile */}
          <div 
            className="relative min-w-[2172px] w-full h-full min-h-[580px] bg-[length:100%_100%] bg-center overflow-hidden transition-[background-image] duration-500"
            style={{ backgroundImage: `url('${activeStageMapConfig.bgImage}')` }}
            onClick={() => {
              if (selectedStation) setSelectedStation(null);
            }}
          >
            {/* Subtle Sunbeam & Atmospheric Shimmer */}
            <div className="absolute inset-0 bg-gradient-to-b from-sky-400/10 via-transparent to-amber-900/15 pointer-events-none" />

            {/* ── MOBILE "DRAG TO EXPLORE" BADGE ── */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 lg:hidden pointer-events-none">
              <div className="bg-black/60 backdrop-blur-md text-white text-[11px] font-black px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg border border-white/20">
                <span>👉 Vuốt ngang để khám phá</span>
              </div>
            </div>

            {/* ── THE 15 INTERACTIVE DAY STATIONS ALONG THE S-CURVE ROAD ── */}
            {Array.from({ length: 15 }).map((_, stationIdx) => {
              const dayNum = activeStageInfo.startDay + stationIdx;
              const station = dayStations.find(s => s.dayNumber === dayNum) || {
                id: `placeholder-day-${dayNum}`,
                groupId: `group-day-${dayNum}`,
                groupTitle: `Ngày ${dayNum}`,
                dayNumber: dayNum,
                stageNumber: activeStageInfo.stageNumber,
                title: `Day ${dayNum < 10 ? `0${dayNum}` : dayNum}`,
                cleanTitle: `Day ${dayNum}`,
                viTitle: undefined,
                isLocked: dayNum > (currentStation?.dayNumber || 1),
                isCompleted: false,
                completedCount: 0,
                totalCount: 4,
                percent: 0,
                activities: [],
                firstUncompletedActivityId: null,
              };

              const coord = activeStageMapConfig.coordinates[stationIdx];
              if (!coord) return null;

              const isCurrent = station.dayNumber === currentStation?.dayNumber;
              const isCompleted = station.isCompleted;
              const isLocked = station.isLocked;
              const isSelected = selectedStation?.dayNumber === station.dayNumber;
              const isMilestone = stationIdx === 9; // Day 10 in stage
              const isCastleFinish = stationIdx === 14; // Day 15 castle top!

              const topicMeta = DAY_TOPIC_EMOJIS[dayNum] || {
                emoji: '⭐',
                color: 'from-blue-500 to-indigo-600',
                heroBg: 'from-blue-600 via-indigo-600 to-purple-600'
              };

              return (
                <div
                  key={`station-node-${dayNum}`}
                  className="absolute z-20 -translate-x-1/2 -translate-y-1/2 transition-transform duration-300"
                  style={{
                    left: `${coord.x}%`,
                    top: `${coord.y}%`,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* ── MASCOT AVATAR PIN (Pulsing over Current Day) ── */}
                  {isCurrent && (
                    <div className={`absolute left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce z-40 pointer-events-none whitespace-nowrap ${
                      coord.labelPos === 'top'
                        ? '-top-32 sm:-top-34'
                        : '-top-12 sm:-top-13'
                    }`}>
                      <div className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-black text-[10px] sm:text-[11px] shadow-lg tracking-wide uppercase flex items-center gap-1.5 border-2 border-white ring-2 ring-amber-400/50">
                        <Flame className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                        <span>Bé đang ở đây!</span>
                      </div>
                      <div className="w-2.5 h-2.5 bg-orange-500 rotate-45 -mt-1 shadow-xs border-r-2 border-b-2 border-white" />
                    </div>
                  )}

                  {/* ── CASTLE CROWN OR TREASURE CHEST ICON ── */}
                  {isCastleFinish && (
                    <div className="absolute -top-9 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 text-amber-950 flex items-center justify-center shadow-xl border-2 border-white animate-bounce ring-2 ring-amber-300/50">
                        {selectedStage === 3 ? (
                          <Star className="w-4.5 h-4.5 fill-amber-900 stroke-[2px]" />
                        ) : selectedStage === 2 ? (
                          <Sparkles className="w-4.5 h-4.5 fill-amber-900 stroke-[2px]" />
                        ) : (
                          <Crown className="w-4.5 h-4.5 fill-amber-900 stroke-[2px]" />
                        )}
                      </div>
                    </div>
                  )}

                  {isMilestone && !isCompleted && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-500 via-rose-500 to-amber-500 text-white flex items-center justify-center shadow-lg border-2 border-white animate-pulse ring-2 ring-pink-300/50">
                        <Gift className="w-3.5 h-3.5 stroke-[2.5px]" />
                      </div>
                    </div>
                  )}

                  {/* ── MAIN STATION CIRCULAR BUTTON (Chunky 3D Stepping Pad) ── */}
                  <button
                    type="button"
                    onClick={() => handleStationClick(station)}
                    className={`group relative flex flex-col items-center cursor-pointer transition-all duration-200 active:scale-95 focus:outline-none select-none ${
                      isSelected ? 'scale-115 z-30' : 'hover:scale-110'
                    }`}
                    title={`${station.title} (Day ${dayNum})`}
                  >
                    {/* Outer Pulsing Glow Ring for Current / Selected */}
                    {(isCurrent || isSelected) && (
                      <div className="absolute -inset-2.5 rounded-full bg-amber-400/40 blur-md animate-pulse" />
                    )}

                    {/* Circular Checkpoint Node - 3D Stepping Stone */}
                    <div
                      className={`relative w-12 h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-full flex flex-col items-center justify-center border-2 transition-all duration-200 ${
                        isCompleted
                          ? 'bg-gradient-to-b from-emerald-300 via-emerald-500 to-teal-600 border-white text-white shadow-[0_5px_0_#065f46,0_8px_16px_rgba(16,185,129,0.35)] group-active:translate-y-1 group-active:shadow-[0_2px_0_#065f46]'
                          : isCurrent
                            ? 'bg-gradient-to-b from-amber-300 via-orange-500 to-amber-600 border-white text-white shadow-[0_5px_0_#9a3412,0_10px_20px_rgba(249,115,22,0.45)] ring-4 ring-amber-300/60 group-active:translate-y-1 group-active:shadow-[0_2px_0_#9a3412]'
                            : isLocked
                              ? 'bg-gradient-to-b from-amber-50 via-amber-100 to-stone-300 dark:from-slate-700 dark:via-slate-800 dark:to-slate-900 border-amber-200/90 dark:border-slate-600 text-stone-700 dark:text-stone-300 shadow-[0_4px_0_#a8a29e,0_6px_12px_rgba(0,0,0,0.12)] group-active:translate-y-0.5 group-active:shadow-[0_2px_0_#a8a29e]'
                              : 'bg-gradient-to-b from-sky-300 via-blue-500 to-indigo-600 border-white text-white shadow-[0_5px_0_#1e3a8a,0_8px_16px_rgba(37,99,235,0.35)] group-active:translate-y-1 group-active:shadow-[0_2px_0_#1e3a8a]'
                      }`}
                    >
                      {/* Top glossy curved highlight reflection */}
                      <div className="absolute inset-x-2 top-1 h-3 rounded-full bg-gradient-to-b from-white/70 to-transparent pointer-events-none" />

                      {/* Node Interior */}
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.8px] fill-white text-emerald-600 drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]" />
                      ) : isLocked ? (
                        <div className="flex flex-col items-center">
                          <div className="w-4.5 h-4.5 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center shadow-xs border border-amber-300/80">
                            <Lock className="w-2.5 h-2.5 stroke-[2.8px]" />
                          </div>
                          <span className="text-[10.5px] font-black leading-none mt-0.5 text-stone-700 dark:text-stone-300 drop-shadow-xs">
                            {dayNum}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <span className="text-base sm:text-lg md:text-xl font-black leading-none drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.4)]">
                            {dayNum}
                          </span>
                          {isCurrent && (
                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-200 animate-ping mt-0.5" />
                          )}
                        </div>
                      )}
                    </div>

                    {/* ── VERTICAL TOPIC BADGE ── */}
                    <div 
                      className={`absolute left-1/2 -translate-x-1/2 pointer-events-none transition-all duration-200 z-20 ${
                        coord.labelPos === 'top' 
                          ? 'bottom-full mb-3.5' 
                          : 'top-full mt-3.5'
                      }`}
                    >
                      <div 
                        className={`relative flex flex-col items-center w-[114px] sm:w-[126px] px-2.5 py-2 rounded-[18px] border-2 backdrop-blur-md text-center transition-all ${
                          isCurrent
                            ? 'bg-white/95 dark:bg-slate-900/95 border-amber-400 dark:border-amber-400 shadow-[0_6px_18px_rgba(245,158,11,0.32)] ring-2 ring-amber-300/60'
                            : isCompleted
                              ? 'bg-white/95 dark:bg-slate-900/95 border-emerald-400 dark:border-emerald-500 shadow-[0_4px_14px_rgba(16,185,129,0.22)]'
                            : isLocked
                              ? 'bg-white/90 dark:bg-slate-900/90 border-stone-200/90 dark:border-slate-700 shadow-sm opacity-90'
                              : 'bg-white/95 dark:bg-slate-900/95 border-sky-300 dark:border-sky-600 shadow-[0_4px_14px_rgba(14,165,233,0.2)]'
                        }`}
                      >
                        {/* Big Topic Icon on Top */}
                        <span className="text-xl sm:text-2xl leading-none select-none mb-1 drop-shadow-xs">
                          {topicMeta.emoji}
                        </span>

                        {/* Line 1: English Topic Title */}
                        <span
                          className={`font-black text-[11px] sm:text-[11.5px] leading-tight text-center break-words w-full ${
                            isCurrent
                              ? 'text-amber-950 dark:text-amber-100'
                              : isCompleted
                                ? 'text-emerald-950 dark:text-emerald-100'
                                : isLocked
                                  ? 'text-stone-600 dark:text-stone-400'
                                  : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {station.cleanTitle || `Day ${dayNum}`}
                        </span>

                        {/* Line 2-3: Vietnamese Meaning */}
                        {station.viTitle && (
                          <span
                            className={`font-bold text-[9px] sm:text-[9.5px] leading-tight text-center break-words w-full mt-0.5 ${
                              isCurrent
                                ? 'text-orange-700 dark:text-orange-300'
                                : isCompleted
                                  ? 'text-emerald-700 dark:text-emerald-300'
                                  : isLocked
                                    ? 'text-stone-400 dark:text-stone-500'
                                    : 'text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            {station.viTitle}
                          </span>
                        )}

                        {/* Directional pointer notch */}
                        {coord.labelPos === 'top' ? (
                          <div
                            className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 border-r-2 border-b-2 bg-white dark:bg-slate-900 ${
                              isCurrent
                                ? 'border-amber-400'
                                : isCompleted
                                  ? 'border-emerald-400'
                                  : isLocked
                                    ? 'border-stone-200/90 dark:border-slate-700'
                                    : 'border-sky-300 dark:border-sky-600'
                            }`}
                          />
                        ) : (
                          <div
                            className={`absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 border-l-2 border-t-2 bg-white dark:bg-slate-900 ${
                              isCurrent
                                ? 'border-amber-400'
                                : isCompleted
                                  ? 'border-emerald-400'
                                  : isLocked
                                    ? 'border-stone-200/90 dark:border-slate-700'
                                    : 'border-sky-300 dark:border-sky-600'
                            }`}
                          />
                        )}
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          3. CENTER POPUP MODAL (Game Quest Board - Cách A)
          ════════════════════════════════════════════════════════════════ */}
      {selectedStation && (() => {
            const topicMeta = DAY_TOPIC_EMOJIS[selectedStation.dayNumber] || {
              emoji: '🌟',
              color: 'from-blue-500 to-indigo-600',
              heroBg: 'from-blue-600 via-indigo-600 to-purple-600'
            };

            // Group real activities into the 4 target categories: Vocab, Practice, Game, Quiz
            const vocabAct = 
              selectedStation.activities.find(a => a.kind === 'flashcard') ||
              selectedStation.activities.find(a => {
                const id = a.item?.assignment?.id || '';
                return !id.startsWith('tiny-vocab-day-') && a.kind === 'lesson';
              }) ||
              selectedStation.activities.find(a => a.kind === 'flashcard' || a.kind === 'lesson');

            const practiceAct = 
              selectedStation.activities.find(a => {
                const id = a.item?.assignment?.id || '';
                const titleLower = (a.item?.assignment?.title || '').toLowerCase();
                return id.startsWith('tiny-vocab-reading-') || titleLower.includes('bài đọc');
              }) ||
              selectedStation.activities.find(a => {
                const id = a.item?.assignment?.id || '';
                if (id.startsWith('tiny-vocab-day-')) return false;
                return a.kind === 'reading' || (a.kind === 'exercise' && a !== vocabAct);
              });

            const gameActivities = selectedStation.activities.filter(a => a.kind === 'game');
            const hasMultipleGames = gameActivities.length > 1;
            const gameAct = gameActivities[0];
            const quizAct = selectedStation.activities.find(a => a.kind === 'review' || (a.kind === 'exercise' && a !== practiceAct && a !== vocabAct));
            // Vocab class: no real quiz → station 4 becomes a reading challenge
            const isReadingChallenge = !quizAct && practiceAct?.kind === 'reading';

            const displayActivities = isVocabClass ? [
              {
                id: 'vocab',
                step: 1,
                stationName: '🚩 Trạm 1: Khởi Hành',
                tag: vocabAct?.cardCount ? `${vocabAct.cardCount} thẻ từ mới` : 'Học từ vựng mới',
                kind: 'flashcard' as const,
                title: 'Thẻ Từ Vựng',
                time: '10p',
                xp: 10,
                icon: (
                  <div className="relative w-8 h-8 flex items-center justify-center">
                    <div className="absolute w-6.5 h-7.5 rounded-md bg-emerald-200/90 dark:bg-emerald-700/80 border-[1.8px] border-emerald-400 rotate-12 group-hover:rotate-[18deg] shadow-xs transition-transform duration-300" />
                    <div className="relative w-6.5 h-7.5 rounded-md bg-white dark:bg-slate-900 border-[1.8px] border-emerald-500 -rotate-6 group-hover:-rotate-3 shadow-xs flex flex-col items-center justify-center transition-transform duration-300">
                      <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 leading-none">Aa</span>
                      <span className="w-3 h-0.5 rounded-full bg-emerald-400 dark:bg-emerald-500 mt-0.5" />
                    </div>
                    <Sparkles className="absolute -top-1 -right-1 w-3.5 h-3.5 fill-amber-400 text-amber-500 drop-shadow-xs group-hover:scale-125 group-hover:rotate-12 transition-transform duration-300" />
                  </div>
                ),
                cardBg: 'from-emerald-500/12 via-white to-teal-500/10 dark:from-emerald-950/40 dark:to-teal-950/30',
                borderStyle: 'border-emerald-300 dark:border-emerald-700/80 shadow-[0_4px_0_#059669] hover:border-emerald-400',
                hoverGlow: 'hover:shadow-xl hover:shadow-emerald-500/25',
                iconBg: 'bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 text-white shadow-md shadow-emerald-500/35 ring-2 ring-white/60 dark:ring-white/20',
                badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200',
                stationBadgeBg: 'bg-emerald-500 text-white shadow-xs',
                accentColor: 'text-emerald-600 dark:text-emerald-400',
                act: vocabAct || selectedStation.activities[0],
              },
              {
                id: 'game',
                step: 2,
                stationName: '🎮 Trạm 2: Vui Học',
                tag: 'Trò chơi phản xạ',
                kind: 'game' as const,
                title: 'Trò Chơi Phản Xạ',
                time: '10p',
                xp: 15,
                icon: (
                  <div className="relative w-8 h-8 flex items-center justify-center">
                    <Gamepad2 className="w-7 h-7 text-white stroke-[2.3px] drop-shadow-xs" />
                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-yellow-300 text-amber-950 flex items-center justify-center shadow-xs border border-white group-hover:scale-125 group-hover:rotate-12 transition-transform duration-300">
                      <Zap className="w-2.5 h-2.5 fill-amber-900 text-amber-900" />
                    </div>
                  </div>
                ),
                cardBg: 'from-amber-500/12 via-white to-orange-500/10 dark:from-amber-950/40 dark:to-orange-950/30',
                borderStyle: 'border-amber-300 dark:border-amber-700/80 shadow-[0_4px_0_#d97706] hover:border-amber-400',
                hoverGlow: 'hover:shadow-xl hover:shadow-amber-500/25',
                iconBg: 'bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/35 ring-2 ring-white/60 dark:ring-white/20',
                badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200',
                stationBadgeBg: 'bg-amber-500 text-white shadow-xs',
                accentColor: 'text-amber-600 dark:text-amber-400',
                act: gameAct || selectedStation.activities[2] || selectedStation.activities[0],
              },
              {
                id: 'reading',
                step: 3,
                stationName: '📖 Trạm 3: Đích Đến',
                tag: 'Thử thách bài đọc hiểu',
                kind: 'reading' as const,
                title: practiceAct?.title || 'Bài Đọc Hiểu',
                time: '15p',
                xp: 20,
                isFinal: true,
                icon: (
                  <div className="relative w-8 h-8 flex items-center justify-center">
                    <BookOpen className="w-7 h-7 text-white stroke-[2.3px] drop-shadow-xs" />
                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-sky-300 text-sky-950 flex items-center justify-center shadow-xs border border-white animate-bounce group-hover:scale-125 transition-transform duration-300">
                      <Star className="w-2.5 h-2.5 fill-sky-950 text-sky-950" />
                    </div>
                  </div>
                ),
                cardBg: 'from-sky-400/25 via-blue-200/20 to-cyan-400/20 dark:from-sky-950/60 dark:to-blue-950/40',
                borderStyle: 'border-sky-400 dark:border-sky-500 shadow-[0_4px_0_#0284c7] hover:border-sky-300',
                hoverGlow: 'hover:shadow-2xl hover:shadow-sky-400/35',
                iconBg: 'bg-gradient-to-br from-sky-400 via-blue-500 to-cyan-500 text-white shadow-md shadow-sky-500/40 ring-2 ring-white/80',
                badgeBg: 'bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200',
                stationBadgeBg: 'bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-xs',
                accentColor: 'text-sky-700 dark:text-sky-300',
                act: practiceAct || selectedStation.activities[1] || selectedStation.activities[0],
              },
            ] : [
              {
                id: 'vocab',
                step: 1,
                stationName: '🚩 Trạm 1: Khởi Hành',
                tag: vocabAct?.cardCount ? `${vocabAct.cardCount} thẻ từ mới` : 'Học từ vựng mới',
                kind: 'flashcard' as const,
                title: 'Thẻ Từ Vựng',
                time: '10p',
                xp: 10,
                icon: (
                  <div className="relative w-8 h-8 flex items-center justify-center">
                    {/* Back tilted card */}
                    <div className="absolute w-6.5 h-7.5 rounded-md bg-emerald-200/90 dark:bg-emerald-700/80 border-[1.8px] border-emerald-400 rotate-12 group-hover:rotate-[18deg] shadow-xs transition-transform duration-300" />
                    {/* Front tilted card with Aa letters */}
                    <div className="relative w-6.5 h-7.5 rounded-md bg-white dark:bg-slate-900 border-[1.8px] border-emerald-500 -rotate-6 group-hover:-rotate-3 shadow-xs flex flex-col items-center justify-center transition-transform duration-300">
                      <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 leading-none">Aa</span>
                      <span className="w-3 h-0.5 rounded-full bg-emerald-400 dark:bg-emerald-500 mt-0.5" />
                    </div>
                    {/* Sparkle badge */}
                    <Sparkles className="absolute -top-1 -right-1 w-3.5 h-3.5 fill-amber-400 text-amber-500 drop-shadow-xs group-hover:scale-125 group-hover:rotate-12 transition-transform duration-300" />
                  </div>
                ),
                cardBg: 'from-emerald-500/12 via-white to-teal-500/10 dark:from-emerald-950/40 dark:to-teal-950/30',
                borderStyle: 'border-emerald-300 dark:border-emerald-700/80 shadow-[0_4px_0_#059669] hover:border-emerald-400',
                hoverGlow: 'hover:shadow-xl hover:shadow-emerald-500/25',
                iconBg: 'bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 text-white shadow-md shadow-emerald-500/35 ring-2 ring-white/60 dark:ring-white/20',
                badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200',
                stationBadgeBg: 'bg-emerald-500 text-white shadow-xs',
                accentColor: 'text-emerald-600 dark:text-emerald-400',
                act: vocabAct || selectedStation.activities[0],
              },
              {
                id: 'practice',
                step: 2,
                stationName: 'Trạm 2: Luyện Tập',
                tag: 'Luyện nghe & đọc to',
                kind: 'reading' as const,
                title: 'Luyện Phát Âm',
                time: '10p',
                xp: 15,
                isLocked: true,
                icon: (
                  <div className="relative w-8 h-8 flex items-center justify-center">
                    <Mic className="w-6.5 h-6.5 text-white stroke-[2.4px] drop-shadow-xs" />
                    {/* Floating audio note badge */}
                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-purple-300 text-purple-950 flex items-center justify-center shadow-xs">
                      <Sparkles className="w-2 h-2 fill-purple-950 text-purple-950" />
                    </div>
                  </div>
                ),
                cardBg: 'from-purple-500/12 via-white to-indigo-500/10 dark:from-purple-950/40 dark:to-indigo-950/30',
                borderStyle: 'border-purple-300 dark:border-purple-700/80 shadow-[0_4px_0_#7c3aed] hover:border-purple-400',
                hoverGlow: 'hover:shadow-xl hover:shadow-purple-500/25',
                iconBg: 'bg-gradient-to-br from-purple-400 via-indigo-500 to-purple-600 text-white shadow-md shadow-purple-500/35 ring-2 ring-white/60 dark:ring-white/20',
                badgeBg: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200',
                stationBadgeBg: 'bg-purple-500 text-white shadow-xs',
                accentColor: 'text-purple-600 dark:text-purple-400',
                act: practiceAct || selectedStation.activities[1] || selectedStation.activities[0],
              },
              {
                id: 'game',
                step: 3,
                stationName: '🎮 Trạm 3: Vui Học',
                tag: 'Ghép thẻ tốc độ',
                kind: 'game' as const,
                title: 'Trò Chơi Phản Xạ',
                time: '10p',
                xp: 15,
                icon: (
                  <div className="relative w-8 h-8 flex items-center justify-center">
                    <Gamepad2 className="w-7 h-7 text-white stroke-[2.3px] drop-shadow-xs" />
                    {/* Lightning reflex badge */}
                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-yellow-300 text-amber-950 flex items-center justify-center shadow-xs border border-white group-hover:scale-125 group-hover:rotate-12 transition-transform duration-300">
                      <Zap className="w-2.5 h-2.5 fill-amber-900 text-amber-900" />
                    </div>
                  </div>
                ),
                cardBg: 'from-amber-500/12 via-white to-orange-500/10 dark:from-amber-950/40 dark:to-orange-950/30',
                borderStyle: 'border-amber-300 dark:border-amber-700/80 shadow-[0_4px_0_#d97706] hover:border-amber-400',
                hoverGlow: 'hover:shadow-xl hover:shadow-amber-500/25',
                iconBg: 'bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/35 ring-2 ring-white/60 dark:ring-white/20',
                badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200',
                stationBadgeBg: 'bg-amber-500 text-white shadow-xs',
                accentColor: 'text-amber-600 dark:text-amber-400',
                act: gameAct || selectedStation.activities[2] || selectedStation.activities[0],
              },
              {
                id: 'quiz',
                step: 4,
                stationName: isReadingChallenge ? '📖 Thử Thách Hôm Nay' : '👑 Đích Đến: Mở Rương',
                tag: isReadingChallenge ? 'Thử thách bài đọc hiểu' : 'Chinh phục 3 Sao Vàng ⭐',
                kind: isReadingChallenge ? 'reading' as const : 'review' as const,
                title: isReadingChallenge ? 'Thử Thách Bài Đọc' : 'Thử Thách Bài Học',
                time: '5p',
                xp: 20,
                isFinal: true,
                icon: isReadingChallenge ? (
                  <div className="relative w-8 h-8 flex items-center justify-center">
                    <BookOpen className="w-7 h-7 text-white stroke-[2.3px] drop-shadow-xs" />
                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-sky-300 text-sky-950 flex items-center justify-center shadow-xs border border-white animate-bounce group-hover:scale-125 transition-transform duration-300">
                      <Star className="w-2.5 h-2.5 fill-sky-950 text-sky-950" />
                    </div>
                  </div>
                ) : (
                  <div className="relative w-8 h-8 flex items-center justify-center">
                    <Trophy className="w-7 h-7 fill-yellow-300 text-amber-600 stroke-[2px] drop-shadow-md" />
                    {/* Bouncing star badge */}
                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-yellow-400 text-white flex items-center justify-center shadow-xs border border-white animate-bounce group-hover:scale-125 transition-transform duration-300">
                      <Star className="w-2.5 h-2.5 fill-amber-950 text-amber-950" />
                    </div>
                  </div>
                ),
                cardBg: isReadingChallenge
                  ? 'from-sky-400/25 via-blue-200/20 to-cyan-400/20 dark:from-sky-950/60 dark:to-blue-950/40'
                  : 'from-amber-400/25 via-yellow-200/20 to-orange-400/20 dark:from-amber-950/60 dark:to-yellow-950/40',
                borderStyle: isReadingChallenge
                  ? 'border-sky-400 dark:border-sky-500 shadow-[0_4px_0_#0284c7] hover:border-sky-300'
                  : 'border-amber-400 dark:border-amber-500 shadow-[0_4px_0_#b45309] hover:border-amber-300',
                hoverGlow: isReadingChallenge
                  ? 'hover:shadow-2xl hover:shadow-sky-400/35'
                  : 'hover:shadow-2xl hover:shadow-amber-400/35',
                iconBg: isReadingChallenge
                  ? 'bg-gradient-to-br from-sky-400 via-blue-500 to-cyan-500 text-white shadow-md shadow-sky-500/40 ring-2 ring-white/80'
                  : 'bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 text-amber-950 shadow-md shadow-amber-500/40 ring-2 ring-white/80',
                badgeBg: isReadingChallenge
                  ? 'bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200',
                stationBadgeBg: isReadingChallenge
                  ? 'bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-xs'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs',
                accentColor: isReadingChallenge
                  ? 'text-sky-700 dark:text-sky-300'
                  : 'text-amber-700 dark:text-amber-300',
                // For reading challenge, navigate to the reading assignment
                act: isReadingChallenge
                  ? (practiceAct || selectedStation.activities[0])
                  : (quizAct || selectedStation.activities[3] || selectedStation.activities[0]),
              },
            ];

            return (
              <div 
                className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/65 backdrop-blur-md animate-in fade-in duration-200"
                onClick={() => setSelectedStation(null)}
              >
                {/* Modal Container */}
                <div 
                  className="relative w-full max-w-2xl sm:max-w-3xl bg-white dark:bg-slate-900 rounded-[32px] sm:rounded-[40px] shadow-2xl border-4 border-amber-300/90 dark:border-slate-700 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <style>{`
                    @keyframes quest-lock-shake {
                      0%, 100% { transform: translateX(0); }
                      20%, 60% { transform: translateX(-4px); }
                      40%, 80% { transform: translateX(4px); }
                    }
                    .card-lock-shake:hover {
                      animation: quest-lock-shake 0.35s ease-in-out;
                    }
                  `}</style>

                  {/* ── CLOSE '✕' BUTTON ── */}
                  <button
                    type="button"
                    onClick={() => setSelectedStation(null)}
                    className="absolute top-4 right-4 sm:top-5 sm:right-5 z-20 w-10 h-10 rounded-full bg-slate-100 hover:bg-rose-100 dark:bg-slate-800 dark:hover:bg-rose-950/60 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-300 flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-90 border border-slate-200 dark:border-slate-700"
                    title="Đóng bảng"
                  >
                    <X className="w-5 h-5 stroke-[2.8px]" />
                  </button>

                  {/* ── MODAL HEADER ── */}
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

                    {/* Gamified Progress Bar in Header */}
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

                  {/* ── MINI QUEST TRAIL (2x2 QUEST STATIONS WITH SNUG FIT) ── */}
                  <div className="overflow-y-auto p-5 sm:p-7 pt-4 sm:pt-5 pb-6 sm:pb-7 no-scrollbar">
                  {gamePickerActivities ? (
                    /* ── GAME PICKER VIEW ─────────────────────────────── */
                    <div className="animate-in slide-in-from-right-8 duration-200">
                      {/* Back + Title */}
                      <div className="flex items-center gap-3 px-1 mb-4">
                        <button
                          type="button"
                          onClick={() => setGamePickerActivities(null)}
                          className="flex items-center gap-1 text-xs font-black text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4 stroke-[2.8px]" />
                          Quay lại
                        </button>
                        <div className="flex-1 flex items-center gap-1.5 text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                          <Gamepad2 className="w-3.5 h-3.5 text-amber-500" />
                          <span>Chọn Game Yêu Thích</span>
                        </div>
                        <span className="text-[11px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-200/80">
                          {gamePickerActivities.length} games
                        </span>
                      </div>

                      {/* Game Cards */}
                      <div className="flex flex-col gap-3">
                        {gamePickerActivities.map((gameActivity, idx) => {
                          const assignment = gameActivity.item.assignment;
                          let gameMode = '';
                          let playUrl = '';
                          if (assignment.instructions) {
                            try {
                              const meta = JSON.parse(assignment.instructions);
                              if (meta.playUrl) playUrl = meta.playUrl;
                              if (meta.gameMode) gameMode = meta.gameMode;
                            } catch {}
                          }
                          if (!gameMode && playUrl) {
                            if (playUrl.includes('shooter-quiz')) gameMode = 'shooter-quiz';
                            else if (playUrl.includes('candy-quiz')) gameMode = 'candy-quiz';
                            else if (playUrl.includes('word-match')) gameMode = 'word-match';
                            else if (playUrl.includes('sentence')) gameMode = 'sentence-builder';
                          }
                          const thumbnail = assignment.thumbnail;
                          const gameTitle = (gameActivity.title || assignment.title || 'Mini Game').replace(/^(Game:|Trò chơi:)\s*/i, '');
                          const isDone = gameActivity.isSubmitted;

                          const gameModeLabel = gameMode.includes('shooter') ? '🚀 Xạ Thủ'
                            : gameMode.includes('candy') ? '🍬 Kẹo Ngọt'
                            : gameMode.includes('word') ? '🎯 Ghép Chữ'
                            : gameMode.includes('sentence') ? '✏️ Xếp Câu'
                            : '⚡ Phản Xạ';

                          const gamePalettes = [
                            { bg: 'from-amber-500/15 via-white to-orange-500/12 dark:from-amber-950/40 dark:to-orange-950/30', border: 'border-amber-300 dark:border-amber-700 shadow-[0_4px_0_#d97706]', iconBg: 'from-amber-400 via-orange-500 to-amber-600', glow: 'hover:shadow-amber-400/30' },
                            { bg: 'from-pink-500/15 via-white to-rose-500/12 dark:from-pink-950/40 dark:to-rose-950/30', border: 'border-pink-300 dark:border-pink-700 shadow-[0_4px_0_#e11d48]', iconBg: 'from-pink-400 via-rose-500 to-pink-600', glow: 'hover:shadow-pink-400/30' },
                            { bg: 'from-sky-500/15 via-white to-blue-500/12 dark:from-sky-950/40 dark:to-blue-950/30', border: 'border-sky-300 dark:border-sky-700 shadow-[0_4px_0_#0284c7]', iconBg: 'from-sky-400 via-blue-500 to-sky-600', glow: 'hover:shadow-sky-400/30' },
                            { bg: 'from-violet-500/15 via-white to-purple-500/12 dark:from-violet-950/40 dark:to-purple-950/30', border: 'border-violet-300 dark:border-violet-700 shadow-[0_4px_0_#7c3aed]', iconBg: 'from-violet-400 via-purple-500 to-violet-600', glow: 'hover:shadow-violet-400/30' },
                          ];
                          const palette = gamePalettes[idx % gamePalettes.length];

                          return (
                            <div
                              key={gameActivity.item.assignment.id}
                              onClick={() => {
                                handleLaunchDay(selectedStation, gameActivity.item.assignment.id);
                                setGamePickerActivities(null);
                              }}
                              className={`group relative overflow-hidden rounded-2xl border-2 bg-gradient-to-b ${palette.bg} ${palette.border} hover:shadow-xl ${palette.glow} hover:-translate-y-1 active:translate-y-0 transition-all duration-300 cursor-pointer p-4 flex items-center gap-4`}
                            >
                              {/* Shimmer on hover */}
                              <div className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-white/30 to-transparent z-10" />

                              {/* Thumbnail / Icon */}
                              <div className={`relative shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-gradient-to-br ${palette.iconBg} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300`}>
                                {thumbnail ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={thumbnail} alt={gameTitle} className="w-full h-full object-cover" />
                                ) : (
                                  <Gamepad2 className="w-7 h-7 text-white stroke-[2.3px] drop-shadow-sm" />
                                )}
                                {isDone && (
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <Check className="w-5 h-5 text-white stroke-[3px]" />
                                  </div>
                                )}
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 mb-1">
                                  {gameModeLabel}
                                </span>
                                <h4 className="text-sm sm:text-base font-black text-slate-800 dark:text-white leading-tight line-clamp-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                  {gameTitle}
                                </h4>
                                <p className={`text-[11px] font-bold flex items-center gap-1 mt-0.5 ${
                                  isDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
                                }`}>
                                  {isDone ? (
                                    <><Check className="w-3 h-3 stroke-[3px]" /> Đã hoàn thành · Chơi lại?</>
                                  ) : (
                                    <><Zap className="w-3 h-3 text-amber-500" /> Vào chơi ngay!</>
                                  )}
                                </p>
                              </div>

                              {/* Arrow CTA */}
                              <div className="shrink-0 w-9 h-9 rounded-full bg-white dark:bg-slate-800 group-hover:bg-amber-500 shadow-md flex items-center justify-center group-hover:translate-x-1 transition-all duration-300">
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
                    <div className="flex items-center justify-between px-1 mb-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        <MapPin className="w-3.5 h-3.5 text-amber-500" />
                        <span>{isVocabClass ? 'Hành trình 3 trạm hôm nay' : 'Hành trình 4 trạm hôm nay'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-200/80 dark:border-amber-800/80">
                        <Sparkles className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span>Hoàn thành mở Rương Sao ⭐</span>
                      </div>
                    </div>

                    <div className={`grid gap-3.5 sm:gap-4 ${isVocabClass ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
                      {displayActivities.map((item) => {
                        const act = item.act;
                        const isDone = act ? Boolean(act.isSubmitted) : false;
                        const isLocked = Boolean(item.isLocked);

                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              if (isLocked) {
                                toast.info('🔒 Bài Luyện Phát Âm đang khóa. Bé hãy hoàn thành Thẻ Từ Vựng ở Trạm 1 trước nhé!', {
                                  icon: '🔒',
                                  duration: 3500,
                                });
                                return;
                              }
                              if (act) {
                                // Nếu là trạm Game và có nhiều games → mở Game Picker
                                if (item.id === 'game' && hasMultipleGames) {
                                  setGamePickerActivities(gameActivities);
                                  return;
                                }
                                handleLaunchDay(selectedStation, act.item.assignment.id);
                              }
                            }}
                            className={`group relative overflow-hidden p-4 sm:p-5 rounded-2xl sm:rounded-3xl border-2 transition-all duration-300 ease-out flex flex-col justify-between ${
                              isLocked
                                ? 'bg-gradient-to-b from-slate-100/90 to-slate-200/60 dark:from-slate-800/60 dark:to-slate-900/60 border-slate-300/80 dark:border-slate-700/80 opacity-70 cursor-not-allowed card-lock-shake'
                                : `bg-gradient-to-b ${item.cardBg} ${item.borderStyle} ${item.hoverGlow} cursor-pointer hover:-translate-y-1.5 active:translate-y-0 active:scale-[0.99]`
                            }`}
                          >
                            {/* Shimmer Light Beam on hover for final destination */}
                            {item.isFinal && !isLocked && (
                              <div className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/35 to-transparent z-10" />
                            )}

                            {/* Card Top: Station Milestone Pin & Status/Time */}
                            <div className="flex items-center justify-between gap-2">
                              {isLocked ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-black text-[11px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                  <Lock className="w-3 h-3 stroke-[2.5px] text-slate-500 dark:text-slate-400" />
                                  <span>{item.stationName}</span>
                                </span>
                              ) : (
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-black text-[11px] ${item.stationBadgeBg}`}>
                                  {item.stationName}
                                </span>
                              )}

                              {isLocked ? (
                                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-black text-[11px] bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300 shadow-xs">
                                  <Lock className="w-3 h-3 stroke-[2.5px]" />
                                  <span>Đang khóa</span>
                                </div>
                              ) : isDone ? (
                                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500 text-white font-black text-[11px] shadow-xs">
                                  <Check className="w-3.5 h-3.5 stroke-[3.5px]" />
                                  <span>Đã xong</span>
                                </div>
                              ) : (
                                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[11px] ${item.badgeBg}`}>
                                  <Clock className="w-3 h-3" />
                                  <span>{item.time}</span>
                                </div>
                              )}
                            </div>

                            {/* Card Middle: Rich Game Icon & Quest Hint */}
                            <div className="my-3 flex items-center gap-3.5">
                              <div className="relative shrink-0">
                                <div className={`w-13 h-13 rounded-2xl flex items-center justify-center transition-transform duration-300 ${
                                  isLocked 
                                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 grayscale group-hover:scale-105' 
                                    : `${item.iconBg} group-hover:scale-110 group-hover:rotate-3`
                                }`}>
                                  {item.icon}
                                </div>
                                {isLocked && (
                                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-700 text-white flex items-center justify-center shadow-xs border-2 border-white dark:border-slate-800 group-hover:scale-110 transition-transform">
                                    <Lock className="w-2.5 h-2.5 stroke-[3px]" />
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <h4 className={`text-base sm:text-lg font-black leading-tight ${
                                  isLocked ? 'text-slate-500 dark:text-slate-400' : 'text-slate-800 dark:text-white'
                                }`}>
                                  {item.title}
                                </h4>
                                {isLocked ? (
                                  <p className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-0.5">
                                    <Lock className="w-3 h-3 shrink-0" />
                                    <span>Hoàn thành Trạm 1 để mở</span>
                                  </p>
                                ) : (
                                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                                    <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                                    <span>{item.tag}</span>
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Card Bottom: Reward XP + Action */}
                            <div className="pt-2.5 border-t border-black/5 dark:border-white/10 flex items-center justify-between text-xs font-black">
                              <span className={`inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-full ${
                                isLocked
                                  ? 'text-slate-500 bg-slate-200 dark:bg-slate-700 dark:text-slate-400'
                                  : 'text-amber-600 dark:text-amber-400 bg-amber-100/70 dark:bg-amber-950/50'
                              }`}>
                                <Star className={`w-3 h-3 ${isLocked ? 'text-slate-400 fill-slate-400' : 'fill-amber-500 text-amber-500'}`} />
                                +{item.xp} XP
                              </span>

                              {isLocked ? (
                                <div className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500 text-[11px] font-black">
                                  <Lock className="w-3 h-3" />
                                  <span>Chưa mở khóa</span>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                  <span className="text-[11px] font-black group-hover:translate-x-0.5 transition-transform duration-300">
                                    {isDone ? 'Luyện lại ↺' : 'Vào trạm ngay'}
                                  </span>
                                  <div className="w-5 h-5 rounded-full bg-white dark:bg-slate-800 group-hover:bg-amber-500 shadow-xs flex items-center justify-center group-hover:translate-x-1.5 transition-all duration-300">
                                    <ArrowRight className="w-3 h-3 stroke-[2.8px] text-slate-700 dark:text-slate-300 group-hover:text-white transition-colors" />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    </>
                  )}
                  </div>
                </div>
              </div>
            );
          })()}
    </div>
  );
}
