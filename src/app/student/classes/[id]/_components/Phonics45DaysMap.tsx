'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  X,
  Sparkles,
  Trophy,
  Star,
  BookOpen,
  Gamepad2,
  Layers,
  ArrowRight,
  CheckCircle2,
  Maximize,
  Minimize,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  PHONICS_45_DAY_OVERVIEW,
  getPhonicsDayDataByNumber,
} from '@/lib/phonics-45-days-units';
import { PhonicsBlendingLab } from './phonics/PhonicsBlendingLab';
import { PhonicsFlashcardsStation } from './phonics/PhonicsFlashcardsStation';
import { PhonicsReflexGame } from './phonics/PhonicsReflexGame';
import { PhonicsDecodableStoryStation } from './phonics/PhonicsDecodableStoryStation';
import { playPopSound } from './phonics/PhonicsAudioEffects';
import { ShineBorder } from '@/components/ui/shine-border';
import { SparklesText } from '@/components/ui/sparkles-text';
import { Particles } from '@/components/ui/particles';
import { NumberTicker } from '@/components/ui/number-ticker';
import { Dock, DockWaveItem } from '@/components/ui/dock';
import { CoolMode, type CoolParticleOptions } from '@/components/ui/cool-mode';
import { GlareHover } from '@/components/ui/glare-hover';
import { Ripple } from '@/components/ui/ripple';

const STATION_COOL_OPTIONS: CoolParticleOptions = {
  particles: ['⭐', '✨', '🌟', '🫧'],
  particleCount: 6,
  size: 18,
};

const ISLAND_COOL_OPTIONS: CoolParticleOptions = {
  particles: ['⭐', '✨', '🌟', '🎈'],
  particleCount: 7,
  size: 19,
};

const SKY_BG_IMAGE =
  'https://media.dolcake.com/assests/Vocab/dolcake_15_islands/background_2to1.jpg';

export type PhonicsStationKey = 'blending' | 'flashcards' | 'game' | 'story';

interface PhonicsStationDef {
  key: PhonicsStationKey;
  order: number;
  badge: string;
  title: string;
  subtitle: string;
  time: string;
  xp: number;
  iconBg: string;
  pillBg: string;
  cardSurface: string;
  cardBorder3D: string;
  btnFront: string;
  btnEdge: string;
  accentText: string;
}

const PHONICS_STATIONS: PhonicsStationDef[] = [
  {
    key: 'blending',
    order: 1,
    badge: '🚩 Trạm 1: Khởi Hành',
    title: 'Máy Ghép Vần',
    subtitle: '7 từ ghép vần sinh động',
    time: '10p',
    xp: 15,
    iconBg: 'from-rose-500 to-pink-500',
    pillBg: 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-xs',
    cardSurface:
      'bg-gradient-to-b from-[#fff7f9] via-[#ffeff3] to-[#ffe4eb] dark:from-slate-800 dark:via-slate-800 dark:to-slate-850',
    cardBorder3D:
      'border-rose-200/90 dark:border-rose-800/70 shadow-[0_6px_0_#fda4af,0_12px_24px_rgba(244,63,94,0.1)] hover:shadow-[0_8px_0_#fda4af,0_16px_28px_rgba(244,63,94,0.18)]',
    btnFront: 'bg-gradient-to-b from-[#ff5c82] via-[#f43f5e] to-[#e11d48] border-[#fecdd3]',
    btnEdge: 'bg-[#9f1239]',
    accentText: 'text-rose-600 dark:text-rose-400',
  },
  {
    key: 'flashcards',
    order: 2,
    badge: '🃏 Trạm 2: Vui Học',
    title: 'Thẻ Từ Vựng',
    subtitle: 'Học từ vựng hoạt hình',
    time: '10p',
    xp: 10,
    iconBg: 'from-emerald-400 to-teal-500',
    pillBg: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-xs',
    cardSurface:
      'bg-gradient-to-b from-[#f3fef9] via-[#e6faef] to-[#d4f5e4] dark:from-slate-800 dark:via-slate-800 dark:to-slate-850',
    cardBorder3D:
      'border-emerald-200/90 dark:border-emerald-800/70 shadow-[0_6px_0_#6ee7b7,0_12px_24px_rgba(16,185,129,0.1)] hover:shadow-[0_8px_0_#6ee7b7,0_16px_28px_rgba(16,185,129,0.18)]',
    btnFront: 'bg-gradient-to-b from-[#34d399] via-[#10b981] to-[#059669] border-[#a7f3d0]',
    btnEdge: 'bg-[#065f46]',
    accentText: 'text-emerald-700 dark:text-emerald-400',
  },
  {
    key: 'game',
    order: 3,
    badge: '🎮 Trạm 3: Luyện Tập',
    title: 'Trò Chơi Phản Xạ',
    subtitle: 'Bong bóng phản xạ nhanh',
    time: '10p',
    xp: 20,
    iconBg: 'from-amber-400 to-orange-500',
    pillBg: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs',
    cardSurface:
      'bg-gradient-to-b from-[#fffdf4] via-[#fef6da] to-[#fdecc2] dark:from-slate-800 dark:via-slate-800 dark:to-slate-850',
    cardBorder3D:
      'border-amber-200/90 dark:border-amber-800/70 shadow-[0_6px_0_#fcd34d,0_12px_24px_rgba(245,158,11,0.1)] hover:shadow-[0_8px_0_#fcd34d,0_16px_28px_rgba(245,158,11,0.18)]',
    btnFront: 'bg-gradient-to-b from-[#fbbf24] via-[#f59e0b] to-[#ea580c] border-[#fde68a]',
    btnEdge: 'bg-[#9a3412]',
    accentText: 'text-amber-700 dark:text-amber-400',
  },
  {
    key: 'story',
    order: 4,
    badge: '📖 Trạm 4: Đích Đến',
    title: '[BÀI ĐỌC] Decodable Story',
    subtitle: 'The Fat Cat on the Mat',
    time: '15p',
    xp: 20,
    iconBg: 'from-sky-400 to-blue-600',
    pillBg: 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-xs',
    cardSurface:
      'bg-gradient-to-b from-[#f4fbff] via-[#e5f4fe] to-[#d2ecfc] dark:from-slate-800 dark:via-slate-800 dark:to-slate-850',
    cardBorder3D:
      'border-sky-200/90 dark:border-sky-800/70 shadow-[0_6px_0_#7dd3fc,0_12px_24px_rgba(14,165,233,0.1)] hover:shadow-[0_8px_0_#7dd3fc,0_16px_28px_rgba(14,165,233,0.18)]',
    btnFront: 'bg-gradient-to-b from-[#38bdf8] via-[#0ea5e9] to-[#2563eb] border-[#bae6fd]',
    btnEdge: 'bg-[#1e40af]',
    accentText: 'text-sky-700 dark:text-sky-400',
  },
];

interface StageConfig {
  stage: number;
  shortLabel: string;
  name: string;
  range: string;
  emoji: string;
  vowel: string;
  skyVeil: string;
  particleColor: string;
  activeTabGradient: string;
  activeTabShadow: string;
  rimeColor: string;
  islandEdge: string;
  islandBorder: string;
  islandBg: string;
  topCanopyGradient: string;
  chipStyle: string;
  roadBorder: string;
  roadStart: string;
  roadMid: string;
  roadEnd: string;
}

const STAGES: StageConfig[] = [
  {
    stage: 1,
    shortLabel: 'Short A',
    name: 'Chặng 1: Short A',
    range: 'Ngày 1 – 10',
    emoji: '🍎',
    vowel: 'A',
    skyVeil: 'from-sky-400/25 via-sky-200/15 to-amber-100/40',
    particleColor: '#f43f5e',
    activeTabGradient: 'from-[#ff5c82] via-[#f43f5e] to-[#e11d48]',
    activeTabShadow: 'shadow-[0_4px_0_#9f1239,0_8px_18px_rgba(244,63,94,0.35)] border-rose-200',
    rimeColor: 'text-[#e11d48]',
    islandEdge: '#be123c',
    islandBorder: 'border-rose-300',
    islandBg: 'from-[#ffffff] via-[#fff7f9] to-[#ffe4eb]',
    topCanopyGradient: 'from-[#ff6b8b] via-[#f43f5e] to-[#e11d48]',
    chipStyle: 'bg-rose-50 text-rose-700 border-rose-200/80',
    roadBorder: '#9f1239',
    roadStart: '#fb7185',
    roadMid: '#f59e0b',
    roadEnd: '#f43f5e',
  },
  {
    stage: 2,
    shortLabel: 'Short E',
    name: 'Chặng 2: Short E',
    range: 'Ngày 11 – 18',
    emoji: '🥚',
    vowel: 'E',
    skyVeil: 'from-teal-400/25 via-emerald-100/20 to-amber-100/35',
    particleColor: '#10b981',
    activeTabGradient: 'from-[#34d399] via-[#10b981] to-[#059669]',
    activeTabShadow: 'shadow-[0_4px_0_#065f46,0_8px_18px_rgba(16,185,129,0.35)] border-emerald-200',
    rimeColor: 'text-[#059669]',
    islandEdge: '#047857',
    islandBorder: 'border-emerald-300',
    islandBg: 'from-[#ffffff] via-[#f2fdf7] to-[#dcfce7]',
    topCanopyGradient: 'from-[#34d399] via-[#10b981] to-[#059669]',
    chipStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    roadBorder: '#065f46',
    roadStart: '#34d399',
    roadMid: '#f59e0b',
    roadEnd: '#10b981',
  },
  {
    stage: 3,
    shortLabel: 'Short I',
    name: 'Chặng 3: Short I',
    range: 'Ngày 19 – 27',
    emoji: '🐟',
    vowel: 'I',
    skyVeil: 'from-sky-500/25 via-cyan-100/20 to-indigo-100/35',
    particleColor: '#0284c7',
    activeTabGradient: 'from-[#38bdf8] via-[#0ea5e9] to-[#0284c7]',
    activeTabShadow: 'shadow-[0_4px_0_#075985,0_8px_18px_rgba(14,165,233,0.35)] border-sky-200',
    rimeColor: 'text-[#0284c7]',
    islandEdge: '#0369a1',
    islandBorder: 'border-sky-300',
    islandBg: 'from-[#ffffff] via-[#f0f9ff] to-[#e0f2fe]',
    topCanopyGradient: 'from-[#38bdf8] via-[#0ea5e9] to-[#0284c7]',
    chipStyle: 'bg-sky-50 text-sky-700 border-sky-200/80',
    roadBorder: '#075985',
    roadStart: '#38bdf8',
    roadMid: '#f59e0b',
    roadEnd: '#0284c7',
  },
  {
    stage: 4,
    shortLabel: 'Short O',
    name: 'Chặng 4: Short O',
    range: 'Ngày 28 – 35',
    emoji: '🦊',
    vowel: 'O',
    skyVeil: 'from-amber-400/25 via-orange-100/20 to-yellow-100/40',
    particleColor: '#ea580c',
    activeTabGradient: 'from-[#fbbf24] via-[#f59e0b] to-[#ea580c]',
    activeTabShadow: 'shadow-[0_4px_0_#9a3412,0_8px_18px_rgba(245,158,11,0.35)] border-amber-200',
    rimeColor: 'text-[#d97706]',
    islandEdge: '#b45309',
    islandBorder: 'border-amber-300',
    islandBg: 'from-[#ffffff] via-[#fffbeb] to-[#fef3c7]',
    topCanopyGradient: 'from-[#fbbf24] via-[#f59e0b] to-[#ea580c]',
    chipStyle: 'bg-amber-50 text-amber-800 border-amber-200/80',
    roadBorder: '#9a3412',
    roadStart: '#fbbf24',
    roadMid: '#f97316',
    roadEnd: '#ea580c',
  },
  {
    stage: 5,
    shortLabel: 'Short U',
    name: 'Chặng 5: Short U & Đích',
    range: 'Ngày 36 – 45',
    emoji: '🦆',
    vowel: 'U',
    skyVeil: 'from-violet-400/25 via-fuchsia-100/20 to-amber-100/35',
    particleColor: '#7c3aed',
    activeTabGradient: 'from-[#a78bfa] via-[#8b5cf6] to-[#7c3aed]',
    activeTabShadow: 'shadow-[0_4px_0_#5b21b6,0_8px_18px_rgba(139,92,246,0.35)] border-violet-200',
    rimeColor: 'text-[#7c3aed]',
    islandEdge: '#5b21b6',
    islandBorder: 'border-violet-300',
    islandBg: 'from-[#ffffff] via-[#f5f3ff] to-[#ede9fe]',
    topCanopyGradient: 'from-[#a78bfa] via-[#8b5cf6] to-[#7c3aed]',
    chipStyle: 'bg-violet-50 text-violet-700 border-violet-200/80',
    roadBorder: '#4c1d95',
    roadStart: '#a78bfa',
    roadMid: '#ec4899',
    roadEnd: '#7c3aed',
  },
];

interface CardColorTheme {
  topCanopyGradient: string;
  edgeHex: string;
  chipStyle: string;
  activeChipStyle: string;
}

const CARD_COLOR_PALETTE: CardColorTheme[] = [
  {
    // 0: Coral Rose
    topCanopyGradient: 'from-[#ff6b8b] via-[#f43f5e] to-[#e11d48]',
    edgeHex: '#be123c',
    chipStyle: 'bg-rose-50 text-rose-700 border-rose-200/90',
    activeChipStyle: 'bg-rose-500 text-white border-rose-400',
  },
  {
    // 1: Sky Azure
    topCanopyGradient: 'from-[#38bdf8] via-[#0ea5e9] to-[#0284c7]',
    edgeHex: '#0369a1',
    chipStyle: 'bg-sky-50 text-sky-700 border-sky-200/90',
    activeChipStyle: 'bg-sky-500 text-white border-sky-400',
  },
  {
    // 2: Mint Emerald
    topCanopyGradient: 'from-[#34d399] via-[#10b981] to-[#059669]',
    edgeHex: '#047857',
    chipStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200/90',
    activeChipStyle: 'bg-emerald-500 text-white border-emerald-400',
  },
  {
    // 3: Berry Fuchsia
    topCanopyGradient: 'from-[#e879f9] via-[#d946ef] to-[#c026d3]',
    edgeHex: '#86198f',
    chipStyle: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200/90',
    activeChipStyle: 'bg-fuchsia-500 text-white border-fuchsia-400',
  },
  {
    // 4: Royal Indigo
    topCanopyGradient: 'from-[#818cf8] via-[#6366f1] to-[#4f46e5]',
    edgeHex: '#3730a3',
    chipStyle: 'bg-indigo-50 text-indigo-700 border-indigo-200/90',
    activeChipStyle: 'bg-indigo-500 text-white border-indigo-400',
  },
  {
    // 5: Tangerine Orange
    topCanopyGradient: 'from-[#fb923c] via-[#f97316] to-[#ea580c]',
    edgeHex: '#c2410c',
    chipStyle: 'bg-orange-50 text-orange-700 border-orange-200/90',
    activeChipStyle: 'bg-orange-500 text-white border-orange-400',
  },
  {
    // 6: Ocean Teal
    topCanopyGradient: 'from-[#2dd4bf] via-[#14b8a6] to-[#0d9488]',
    edgeHex: '#0f766e',
    chipStyle: 'bg-teal-50 text-teal-700 border-teal-200/90',
    activeChipStyle: 'bg-teal-500 text-white border-teal-400',
  },
  {
    // 7: Grape Violet
    topCanopyGradient: 'from-[#a78bfa] via-[#8b5cf6] to-[#7c3aed]',
    edgeHex: '#5b21b6',
    chipStyle: 'bg-violet-50 text-violet-700 border-violet-200/90',
    activeChipStyle: 'bg-violet-500 text-white border-violet-400',
  },
  {
    // 8: Crisp Cyan
    topCanopyGradient: 'from-[#22d3ee] via-[#06b6d4] to-[#0891b2]',
    edgeHex: '#0e7490',
    chipStyle: 'bg-cyan-50 text-cyan-700 border-cyan-200/90',
    activeChipStyle: 'bg-cyan-500 text-white border-cyan-400',
  },
];

/**
 * Pure Phonics Representative Mascot & Anchor Word for all 45 Days (Cách A: zero wrong "My Body" text!)
 */
const DAY_PHONICS_MASCOTS: Record<
  number,
  { emoji?: string; imgSrc?: string; anchorWord: string; isBoss?: boolean }
> = {
  // Stage 1: Short A (Synced 3D Cloudflare R2 Illustrations)
  1: { imgSrc: 'https://media.dolcake.com/phonics/words/cat.png', anchorWord: 'cat' },
  2: { imgSrc: 'https://media.dolcake.com/phonics/words/van.png', anchorWord: 'van' },
  3: { imgSrc: 'https://media.dolcake.com/phonics/words/cap.png', anchorWord: 'cap' },
  4: { imgSrc: 'https://media.dolcake.com/phonics/words/jam.png', anchorWord: 'jam' },
  5: { imgSrc: 'https://media.dolcake.com/phonics/words/dad.png', anchorWord: 'dad' },
  6: { imgSrc: 'https://media.dolcake.com/phonics/words/bag.png', anchorWord: 'bag' },
  7: { imgSrc: 'https://media.dolcake.com/phonics/words/crab.png', anchorWord: 'crab' },
  8: { imgSrc: 'https://media.dolcake.com/phonics/words/pack.png', anchorWord: 'pack' },
  9: { imgSrc: 'https://media.dolcake.com/phonics/words/splash.png', anchorWord: 'splash' },
  10: { imgSrc: 'https://media.dolcake.com/phonics/words/cat.png', anchorWord: 'Review A', isBoss: true },
  // Stage 2: Short E
  11: { emoji: '✈️', anchorWord: 'jet' },
  12: { emoji: '🐔', anchorWord: 'hen' },
  13: { emoji: '🛏️', anchorWord: 'bed' },
  14: { emoji: '🥚', anchorWord: 'egg' },
  15: { emoji: '🔔', anchorWord: 'bell' },
  16: { emoji: '🪺', anchorWord: 'nest' },
  17: { emoji: '⛺', anchorWord: 'tent' },
  18: { emoji: '🎁', anchorWord: 'Review E', isBoss: true },
  // Stage 3: Short I
  19: { emoji: '🧘', anchorWord: 'sit' },
  20: { emoji: '🐬', anchorWord: 'fin' },
  21: { emoji: '🤐', anchorWord: 'zip' },
  22: { emoji: '🐷', anchorWord: 'pig' },
  23: { emoji: '🏊', anchorWord: 'swim' },
  24: { emoji: '⛰️', anchorWord: 'hill' },
  25: { emoji: '⚽', anchorWord: 'kick' },
  26: { emoji: '🐠', anchorWord: 'fish' },
  27: { emoji: '🎁', anchorWord: 'Review I', isBoss: true },
  // Stage 4: Short O
  28: { emoji: '🍲', anchorWord: 'pot' },
  29: { emoji: '🐸', anchorWord: 'hop' },
  30: { emoji: '🐶', anchorWord: 'dog' },
  31: { emoji: '🦊', anchorWord: 'fox' },
  32: { emoji: '⏰', anchorWord: 'clock' },
  33: { emoji: '🌽', anchorWord: 'cob' },
  34: { emoji: '🫛', anchorWord: 'pod' },
  35: { emoji: '🎁', anchorWord: 'Review O', isBoss: true },
  // Stage 5: Short U & Graduation
  36: { emoji: '🐞', anchorWord: 'bug' },
  37: { emoji: '☀️', anchorWord: 'sun' },
  38: { emoji: '🥜', anchorWord: 'nut' },
  39: { emoji: '🛁', anchorWord: 'tub' },
  40: { emoji: '🐶', anchorWord: 'pup' },
  41: { emoji: '🦆', anchorWord: 'duck' },
  42: { emoji: '🥁', anchorWord: 'drum' },
  43: { emoji: '🪥', anchorWord: 'brush' },
  44: { emoji: '🏅', anchorWord: 'Master', isBoss: true },
  45: { emoji: '👑', anchorWord: 'Champion', isBoss: true },
};

/**
 * Returns S-Curve Winding Sky Coordinates (in % of 1000x520 stage) for 8, 9, or 10 islands:
 * Row 1 flows Left -> Right across upper sky, curves smoothly down on the right,
 * and Row 2 flows Right -> Left across lower sky!
 */
function getWindingCoordinates(count: number): Array<{ x: number; y: number }> {
  if (count === 8) {
    return [
      { x: 14, y: 29 },
      { x: 38, y: 21 },
      { x: 62, y: 30 },
      { x: 86, y: 24 },
      { x: 86, y: 74 },
      { x: 62, y: 81 },
      { x: 38, y: 72 },
      { x: 14, y: 77 },
    ];
  }
  if (count === 9) {
    return [
      { x: 11, y: 29 },
      { x: 30, y: 21 },
      { x: 50, y: 30 },
      { x: 70, y: 21 },
      { x: 89, y: 27 },
      { x: 84, y: 75 },
      { x: 61, y: 82 },
      { x: 37, y: 73 },
      { x: 13, y: 77 },
    ];
  }
  // Default 10 islands (Stages 1 & 5)
  return [
    { x: 11, y: 29 },
    { x: 30, y: 21 },
    { x: 50, y: 30 },
    { x: 70, y: 21 },
    { x: 89, y: 27 },
    { x: 89, y: 74 },
    { x: 70, y: 82 },
    { x: 50, y: 73 },
    { x: 30, y: 82 },
    { x: 11, y: 75 },
  ];
}

/**
 * Builds a smooth Cubic Bezier SVG path through the winding S-curve island coordinates
 * inside a 1000x520 SVG viewBox.
 */
function buildWindingSvgPath(coords: Array<{ x: number; y: number }>): string {
  if (coords.length === 0) return '';
  const pts = coords.map((c) => ({ x: c.x * 10, y: c.y * 5.2 }));
  let d = `M ${pts[0].x} ${pts[0].y}`;

  const topRowEndIdx = coords.length === 8 ? 3 : 4;

  for (let i = 0; i < pts.length - 1; i++) {
    const p1 = pts[i];
    const p2 = pts[i + 1];

    if (i === topRowEndIdx) {
      // Right-hand U-turn curve sweeping outward smoothly!
      const bulgeX = Math.min(985, Math.max(p1.x, p2.x) + 75);
      d += ` C ${bulgeX} ${p1.y + 35}, ${bulgeX} ${p2.y - 35}, ${p2.x} ${p2.y}`;
    } else {
      const midX = (p1.x + p2.x) / 2;
      d += ` C ${midX} ${p1.y}, ${midX} ${p2.y}, ${p2.x} ${p2.y}`;
    }
  }
  return d;
}

export interface PhonicsCompletedStationRecord {
  completedAt: string;
  score?: number | null;
}

interface Phonics45DaysMapProps {
  initialCompletedStations?: Record<string, PhonicsCompletedStationRecord>;
}

export function Phonics45DaysMap({
  initialCompletedStations = {},
}: Phonics45DaysMapProps) {
  const router = useRouter();

  const [selectedStage, setSelectedStage] = useState(1);
  const [openDay, setOpenDay] = useState<(typeof PHONICS_45_DAY_OVERVIEW)[0] | null>(null);
  const [activeStation, setActiveStation] = useState<PhonicsStationKey | null>(null);
  const [completedStations, setCompletedStations] = useState<
    Record<string, PhonicsCompletedStationRecord>
  >(initialCompletedStations);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentStageTheme = STAGES[selectedStage - 1] || STAGES[0];

  // Fullscreen listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } else if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore fullscreen permission errors
    }
  };

  // Filter days for active stage
  const stageDays = useMemo(() => {
    return PHONICS_45_DAY_OVERVIEW.filter((d) => d.stage === selectedStage);
  }, [selectedStage]);

  const windingCoords = useMemo(
    () => getWindingCoordinates(stageDays.length),
    [stageDays.length]
  );

  const windingPathD = useMemo(
    () => buildWindingSvgPath(windingCoords),
    [windingCoords]
  );

  // Total completed stations count across entire course
  const totalCompletedCount = useMemo(() => {
    return Object.keys(completedStations).length;
  }, [completedStations]);

  // Check how many stations completed for a given day (1..45)
  const getDayCompletedCount = useCallback(
    (dayNum: number) => {
      const keys: PhonicsStationKey[] = ['blending', 'flashcards', 'game', 'story'];
      return keys.filter((k) => Boolean(completedStations[`d${dayNum}-${k}`])).length;
    },
    [completedStations]
  );

  // Highlight one recommended active day in the current stage while keeping all 45 days unlocked
  const activeStageHighlightDay = useMemo(() => {
    const firstPending = stageDays.find((d) => getDayCompletedCount(d.day) < 4);
    return firstPending?.day ?? stageDays[stageDays.length - 1]?.day ?? 1;
  }, [stageDays, getDayCompletedCount]);

  // Mark station completed & persist to server
  const markStationCompleted = useCallback(
    async (dayNum: number, station: PhonicsStationKey, score?: number | null) => {
      const key = `d${dayNum}-${station}`;
      const record: PhonicsCompletedStationRecord = {
        completedAt: new Date().toISOString(),
        score: score ?? null,
      };

      setCompletedStations((prev) => ({
        ...prev,
        [key]: record,
      }));

      try {
        await fetch('/api/student/phonics-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'completeStation',
            day: dayNum,
            station,
            score: score ?? null,
          }),
        });
      } catch (err) {
        console.error('Failed to persist phonics completion:', err);
      }
    },
    []
  );

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/student/classes');
    }
  };

  /**
   * Renders a single 3D Phonics Island Tile (Cách A: Giant Rime + Cute Representative Mascot, zero "My Body" text!)
   */
  const renderPhonicsIslandNode = (
    dayItem: (typeof PHONICS_45_DAY_OVERVIEW)[0],
    idx: number
  ) => {
    const mascot = DAY_PHONICS_MASCOTS[dayItem.day] || {
      emoji: '🌟',
      anchorWord: dayItem.wordSample[0] || '',
    };
    const completedCount = getDayCompletedCount(dayItem.day);
    const isSpotlight = dayItem.day === activeStageHighlightDay;
    const isBoss = Boolean(mascot.isBoss);
    const displayRime =
      dayItem.day === 45
        ? '45★'
        : dayItem.day === 44
        ? 'CVC'
        : dayItem.rime.includes('Review')
        ? `Ôn ${currentStageTheme.vowel}`
        : dayItem.rime;
    const sampleWords = dayItem.wordSample.filter((w) => w.length <= 6).slice(0, 3);
    const cardPalette =
      CARD_COLOR_PALETTE[
        (idx + (selectedStage - 1) * 2) % CARD_COLOR_PALETTE.length
      ];

    const cardNode = (
      <motion.button
        type="button"
        onClick={() => {
          setOpenDay(dayItem);
          playPopSound();
        }}
        animate={
          isSpotlight
            ? { y: [0, -7, 0] }
            : { y: [0, idx % 2 === 0 ? -4 : 4, 0] }
        }
        transition={{
          duration: isSpotlight ? 2.8 : 4.2 + (idx % 3) * 0.4,
          delay: idx * 0.15,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="group/isl relative flex flex-col items-center cursor-pointer border-none bg-transparent p-0 outline-none select-none font-fredoka whitespace-nowrap"
      >
        {/* Subtle Magic UI Ripple Halo behind Active Stage Spotlight Day */}
        {isSpotlight && (
          <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 z-0">
            <Ripple
              mainCircleSize={125}
              circleGap={30}
              numCircles={3}
              mainCircleOpacity={0.38}
              className="mask-none overflow-visible"
              circleClassName="border-2 border-amber-400/80 bg-amber-300/20 shadow-none [--duration:2.2s]"
            />
          </div>
        )}

        {/* TOP FLOATING CALLOUT OR 4-STAR PROGRESS BAR */}
        {isSpotlight ? (
          <div className="relative z-10 mb-1.5 flex flex-col items-center gap-1 whitespace-nowrap shrink-0">
            <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 text-white text-[10px] sm:text-[11px] font-black tracking-wide shadow-[0_4px_12px_rgba(244,63,94,0.4)] border-2 border-white flex items-center gap-1 animate-bounce whitespace-nowrap shrink-0">
              <Sparkles className="w-3 h-3 shrink-0" />
              <span className="whitespace-nowrap">{completedCount === 4 ? 'HOÀN THÀNH!' : 'VÀO HỌC!'}</span>
            </span>

            <div className="px-2.5 py-0.5 rounded-full bg-white border-2 border-amber-300 shadow-sm flex items-center gap-0.5 shrink-0">
              {[0, 1, 2, 3].map((starIdx) => {
                const earned = starIdx < completedCount;
                return (
                  <Star
                    key={starIdx}
                    className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                      earned
                        ? 'fill-amber-400 text-amber-500 scale-110'
                        : 'fill-slate-200 text-slate-300'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          <div
            className={`relative z-10 mb-2 px-3 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black flex items-center gap-1 border-2 shadow-[0_3px_10px_rgba(15,23,42,0.16)] whitespace-nowrap shrink-0 ${
              isBoss
                ? 'bg-gradient-to-b from-amber-300 to-amber-400 text-amber-950 border-white'
                : completedCount > 0
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-white text-slate-700 border-slate-200/90'
            }`}
          >
            {isBoss ? (
              <>
                <Trophy className="w-3 h-3 text-amber-900 shrink-0" />
                <span className="whitespace-nowrap">Ngày {dayItem.day}</span>
              </>
            ) : completedCount > 0 ? (
              <>
                <Star className="w-3 h-3 fill-amber-400 text-amber-500 shrink-0" />
                <span className="whitespace-nowrap">
                  Ngày {dayItem.day} ({completedCount}/4)
                </span>
              </>
            ) : (
              <>
                <Sparkles className="w-2.5 h-2.5 text-sky-500 shrink-0" />
                <span className="whitespace-nowrap">Ngày {dayItem.day}</span>
              </>
            )}
          </div>
        )}

        {/* 2-TIER 3D COLLECTIBLE PHONICS BADGE CARD (Multicolor + Magic UI GlareHover) */}
        <div className="relative z-10 w-[154px] sm:w-[162px] xl:w-[172px]">
          {/* Deep Saturated 3D Extruded Cliff Base */}
          <div
            style={{
              backgroundColor: isBoss
                ? '#b45309'
                : cardPalette.edgeHex,
            }}
            className="pointer-events-none absolute inset-0 translate-y-[7px] rounded-[24px] shadow-[0_14px_26px_rgba(15,23,42,0.22)] transition-transform duration-150 group-hover/isl:translate-y-[9px] group-active/isl:translate-y-[3px]"
          />

          {/* Card Body Wrapped in Magic UI Diagonal GlareHover */}
          <GlareHover
            width="100%"
            color="#ffffff"
            opacity={0.48}
            duration={550}
            className={`relative w-full rounded-[24px] border-3 border-white transition-transform duration-150 -translate-y-[1px] group-hover/isl:-translate-y-[4px] group-active/isl:translate-y-[3px] flex flex-col items-stretch overflow-hidden shadow-[inset_0_2px_4px_rgba(255,255,255,0.65)] ${
              isSpotlight
                ? 'ring-4 ring-amber-300/90 shadow-[0_0_28px_rgba(251,191,36,0.55)]'
                : ''
            }`}
          >
            {(isSpotlight || isBoss) && (
              <ShineBorder
                borderWidth={2.5}
                duration={10}
                shineColor={
                  isBoss
                    ? ['#FDE047', '#F97316', '#F43F5E']
                    : ['#FDE047', '#F43F5E', '#38BDF8']
                }
              />
            )}

            {/* TIER 1 (TOP): UNIQUE COLORFUL CANOPY WITH ROUND MASCOT + WHITE 3D RIME */}
            <div
              className={`relative w-full px-2.5 py-2 bg-gradient-to-br ${
                isBoss
                  ? 'from-[#fde047] via-[#f59e0b] to-[#d97706]'
                  : cardPalette.topCanopyGradient
              } flex items-center justify-center gap-2 overflow-hidden`}
            >
              {/* Glossy Dome Shine Strip */}
              <div className="pointer-events-none absolute inset-x-2 top-0.5 h-4 rounded-t-2xl bg-gradient-to-b from-white/45 to-transparent" />
              {/* Subtle Decorative Polka Dots */}
              <span className="pointer-events-none absolute -right-2 -bottom-2 w-10 h-10 rounded-full bg-white/15" />
              <span className="pointer-events-none absolute top-1 left-2 w-2 h-2 rounded-full bg-white/30" />

              {/* Round 3D Mascot Sticker Medallion */}
              <div className="relative z-10 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white border-2 border-white shadow-[0_3px_0_rgba(0,0,0,0.16),inset_0_2px_3px_rgba(255,255,255,0.9)] overflow-hidden flex items-center justify-center flex-shrink-0">
                {mascot.imgSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mascot.imgSrc}
                    alt={mascot.anchorWord}
                    className="w-8.5 h-8.5 sm:w-9.5 sm:h-9.5 object-contain rounded-full select-none pointer-events-none group-hover/isl:scale-110 transition-transform"
                  />
                ) : (
                  <span className="text-xl sm:text-2xl leading-none group-hover/isl:scale-110 transition-transform">
                    {mascot.emoji}
                  </span>
                )}
              </div>

              {/* Bold White 3D Rime Typography + Anchor Label */}
              <div className="relative z-10 flex flex-col items-start min-w-0">
                <span
                  className={`font-black leading-none tracking-tight whitespace-nowrap drop-shadow-[0_2px_0_rgba(0,0,0,0.22)] ${
                    displayRime.length >= 8
                      ? 'text-sm sm:text-[15px]'
                      : displayRime.length >= 6
                      ? 'text-base sm:text-lg'
                      : 'text-xl sm:text-[23px]'
                  } ${isBoss ? 'text-amber-950 drop-shadow-[0_1px_0_rgba(255,255,255,0.5)]' : 'text-white'}`}
                >
                  {displayRime}
                </span>
                <span
                  className={`text-[10px] font-extrabold leading-tight mt-0.5 whitespace-nowrap ${
                    isBoss ? 'text-amber-900' : 'text-white/90'
                  }`}
                >
                  {isSpotlight ? `Ngày ${dayItem.day}` : mascot.anchorWord}
                </span>
              </div>
            </div>

            {/* TIER 2 (BOTTOM): CRISP IVORY DECK WITH MINI COLOR-MATCHED WORD CHIPS */}
            <div className="relative z-10 w-full px-2 py-2 bg-gradient-to-b from-white to-slate-50/95 border-t-2 border-white/80 flex items-center justify-center gap-1">
              {sampleWords.map((word) => (
                <span
                  key={word}
                  className={`px-1.5 py-0.5 rounded-lg text-[10px] font-extrabold border whitespace-nowrap ${
                    isBoss
                      ? 'bg-amber-100 text-amber-900 border-amber-300/90'
                      : isSpotlight
                      ? `${cardPalette.activeChipStyle} shadow-2xs`
                      : cardPalette.chipStyle
                  }`}
                >
                  {word}
                </span>
              ))}
            </div>
          </GlareHover>
        </div>
      </motion.button>
    );

    if (isSpotlight) {
      return (
        <CoolMode options={ISLAND_COOL_OPTIONS} className="inline-flex">
          {cardNode}
        </CoolMode>
      );
    }
    return cardNode;
  };

  return (
    <div className="relative w-full min-h-screen lg:h-screen lg:overflow-hidden select-none flex flex-col justify-between bg-gradient-to-b from-[#7dd3fc] via-[#bae6fd] to-[#fef3c7] text-slate-800">
      {/* Fredoka Display Typography + Flowing Road Keyframes */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700;900&display=swap');
        .font-fredoka {
          font-family: 'Fredoka', 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        @keyframes skyRoadDash {
          from {
            stroke-dashoffset: 56;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
        .animate-sky-road {
          animation: skyRoadDash 2.2s linear infinite;
        }
      `}</style>

      {/* ========================================================================= */}
      {/* 1. BRIGHT WHIMSICAL SKY BACKDROP (Fixed z-0 — No longer hidden behind -z!) */}
      {/* ========================================================================= */}
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center opacity-85 transition-all duration-700"
        style={{ backgroundImage: `url(${SKY_BG_IMAGE})` }}
      />
      <div
        className={`pointer-events-none fixed inset-0 z-0 bg-gradient-to-b ${currentStageTheme.skyVeil} transition-colors duration-500`}
      />

      {/* Twinkling Sky & Stage-Colored Magic UI Particles */}
      <Particles
        className="pointer-events-none fixed inset-0 z-0"
        quantity={45}
        staticity={45}
        ease={60}
        size={1.8}
        color="#ffffff"
      />
      <Particles
        className="pointer-events-none fixed inset-0 z-0"
        quantity={30}
        staticity={50}
        ease={65}
        size={1.9}
        color={currentStageTheme.particleColor}
      />

      {/* ========================================================================= */}
      {/* 2. SINGLE-ROW TOP 3D GAME HUD (No Line Wrapping, Zero Clipping!)          */}
      {/* ========================================================================= */}
      <header className="relative z-30 w-full max-w-[1440px] mx-auto px-3 sm:px-4 lg:px-5 pt-3 sm:pt-4 flex flex-col lg:flex-row items-center justify-between gap-2 lg:gap-2.5 flex-shrink-0 font-fredoka">
        {/* Top Row on Mobile (< lg), Left Cluster on Desktop (lg+) */}
        <div className="w-full lg:w-auto flex items-center justify-between gap-2 shrink-0">
          {/* Left: 3D Back Button + Single-Line Course Title */}
          <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
            <button
              type="button"
              onClick={handleBack}
              className="group/back relative w-9 h-9 xl:w-10 xl:h-10 cursor-pointer border-none bg-transparent p-0 outline-none shrink-0"
              title="Quay lại danh sách lớp"
            >
              <span className="pointer-events-none absolute inset-0 translate-y-[3.5px] rounded-2xl bg-[#7dd3fc]" />
              <span className="relative w-full h-full rounded-2xl bg-white hover:bg-sky-50 border-2 border-white text-slate-700 flex items-center justify-center shadow-sm transition-transform duration-100 -translate-y-[1px] group-hover/back:-translate-y-[2px] group-active/back:translate-y-[2.5px]">
                <ArrowLeft className="w-4.5 h-4.5 stroke-[2.6] text-sky-600 shrink-0" />
              </span>
            </button>

            <div className="px-2.5 py-1.5 xl:px-3.5 xl:py-2 rounded-2xl bg-white/95 backdrop-blur-md border-2 border-white shadow-[0_4px_16px_rgba(2,132,199,0.14)] flex items-center gap-1.5 shrink-0 whitespace-nowrap">
              <span className="text-base xl:text-lg leading-none shrink-0">🔤</span>
              <SparklesText
                sparklesCount={5}
                colors={{ first: '#F43F5E', second: '#FBBF24' }}
                className="text-xs sm:text-sm xl:text-base font-black text-slate-800 tracking-tight whitespace-nowrap"
              >
                Bé Giỏi Phonics 45 Ngày
              </SparklesText>
            </div>
          </div>

          {/* Mobile/Tablet Right Controls (Visible < lg) */}
          <div className="flex lg:hidden items-center gap-2 shrink-0 whitespace-nowrap">
            <div className="px-3 py-1.5 rounded-2xl bg-gradient-to-b from-amber-300 to-amber-400 text-amber-950 font-black text-xs flex items-center gap-1.5 border-2 border-white shadow-[0_3px_0_#d97706] shrink-0 whitespace-nowrap">
              <Star className="w-4 h-4 fill-amber-900 text-amber-900 shrink-0" />
              <span className="whitespace-nowrap">{totalCompletedCount} Sao</span>
            </div>
          </div>
        </div>

        {/* CENTER: CLEAN 5-STAGE DOCK (🍎 Short A • 🥚 Short E • 🐟 Short I • 🦊 Short O • 🦆 Short U) */}
        <div className="w-full lg:w-auto overflow-x-auto lg:overflow-visible no-scrollbar flex items-center justify-start sm:justify-center py-1 lg:py-0 shrink-0">
          <Dock
            iconDistance={110}
            direction="bottom"
            className="mx-0 h-auto w-max shrink-0 overflow-visible bg-white/92 backdrop-blur-md border-2 border-white rounded-[20px] px-2 py-1.5 xl:px-2.5 xl:py-2 shadow-[0_6px_22px_rgba(2,132,199,0.16)] flex items-center justify-center gap-1 xl:gap-1.5"
          >
            {STAGES.map((st) => {
              const isSelected = selectedStage === st.stage;
              return (
                <DockWaveItem
                  key={st.stage}
                  maxScale={1.1}
                  maxLift={4}
                  className="shrink-0"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStage(st.stage);
                      playPopSound();
                    }}
                    className={`px-2 py-1.5 xl:px-3 xl:py-1.5 rounded-xl xl:rounded-2xl text-xs xl:text-sm font-black transition-all cursor-pointer flex items-center gap-1 xl:gap-1.5 border-2 whitespace-nowrap shrink-0 ${
                      isSelected
                        ? `bg-gradient-to-b ${st.activeTabGradient} text-white ${st.activeTabShadow} -translate-y-0.5`
                        : 'bg-white hover:bg-sky-50/70 text-slate-700 border-slate-200/85 shadow-[0_2px_0_#cbd5e1]'
                    }`}
                  >
                    <span className="text-sm xl:text-base leading-none shrink-0">
                      {st.emoji}
                    </span>
                    <span className="whitespace-nowrap">{st.shortLabel}</span>
                  </button>
                </DockWaveItem>
              );
            })}
          </Dock>
        </div>

        {/* Desktop Right Cluster: 3D Star Counter + Single-Line Fullscreen Button (lg+) */}
        <div className="hidden lg:flex items-center gap-2 shrink-0 whitespace-nowrap">
          <div className="px-2.5 py-1.5 xl:px-3.5 xl:py-2 rounded-2xl bg-gradient-to-b from-[#fde047] via-[#fbbf24] to-[#f59e0b] text-amber-950 font-black text-xs xl:text-sm flex items-center gap-1.5 border-2 border-white shadow-[0_4px_0_#b45309,0_8px_16px_rgba(245,158,11,0.28)] shrink-0 whitespace-nowrap">
            <Star className="w-4 h-4 fill-amber-900 text-amber-900 shrink-0" />
            {totalCompletedCount === 0 ? (
              <span className="tabular-nums">0</span>
            ) : (
              <NumberTicker
                value={totalCompletedCount}
                startValue={0}
                className="text-amber-950 dark:text-amber-950 font-black tracking-normal"
              />
            )}
            <span className="whitespace-nowrap">Sao</span>
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="px-2.5 py-1.5 xl:px-3.5 xl:py-2 rounded-2xl bg-white/95 hover:bg-white text-slate-700 font-bold text-xs xl:text-sm flex items-center gap-1.5 border-2 border-white shadow-[0_3px_0_#bae6fd,0_6px_14px_rgba(2,132,199,0.12)] active:translate-y-[2px] active:shadow-[0_1px_0_#bae6fd] transition-all cursor-pointer shrink-0 whitespace-nowrap"
            title="Bật/Tắt Toàn Màn Hình"
          >
            {isFullscreen ? (
              <Minimize className="w-4 h-4 text-sky-600 shrink-0" />
            ) : (
              <Maximize className="w-4 h-4 text-sky-600 shrink-0" />
            )}
            <span className="whitespace-nowrap">
              {isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
            </span>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 3. PANORAMIC WINDING SKY MAP (Phương án 2 + Cách A: 3D Phonics Islands!)  */}
      {/* ========================================================================= */}
      <main className="relative z-10 w-full max-w-7xl mx-auto flex-1 flex flex-col items-center justify-center px-3 sm:px-6 pb-4 pt-1 min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedStage}
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -10 }}
            transition={{ duration: 0.25 }}
            className="w-full h-full flex flex-col items-center justify-center"
          >
            {/* DESKTOP / TABLET LANDSCAPE PANORAMIC S-CURVE SKY TRAIL (lg+) */}
            <div className="hidden lg:block relative w-full h-[470px] xl:h-[520px] max-h-[76vh]">
              {/* High-Contrast Bold-Border Sky Trail SVG (Cách 1) */}
              <svg
                viewBox="0 0 1000 520"
                preserveAspectRatio="none"
                className="pointer-events-none absolute inset-0 w-full h-full z-0 overflow-visible"
              >
                <defs>
                  <linearGradient id="phonics-road-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={currentStageTheme.roadStart} />
                    <stop offset="50%" stopColor={currentStageTheme.roadMid} />
                    <stop offset="100%" stopColor={currentStageTheme.roadEnd} />
                  </linearGradient>
                  <filter id="phonics-road-shadow" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#0f172a" floodOpacity="0.28" />
                  </filter>
                </defs>

                <g filter="url(#phonics-road-shadow)">
                  {/* 1. Deep Stage-Colored Bold Outer Contrast Border */}
                  <path
                    d={windingPathD}
                    fill="none"
                    stroke={currentStageTheme.roadBorder}
                    strokeWidth="25"
                    strokeLinecap="round"
                  />
                  {/* 2. Crisp White Inner Halo Rim */}
                  <path
                    d={windingPathD}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="19"
                    strokeLinecap="round"
                  />
                  {/* 3. Rich Saturated Coral-Amber / Stage Gradient Core */}
                  <path
                    d={windingPathD}
                    fill="none"
                    stroke="url(#phonics-road-grad)"
                    strokeWidth="13.5"
                    strokeLinecap="round"
                  />
                  {/* 4. Animated Crisp White Stepping Stones */}
                  <path
                    d={windingPathD}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="4.5"
                    strokeDasharray="13 15"
                    strokeLinecap="round"
                    className="animate-sky-road"
                  />
                </g>
              </svg>

              {/* Positioned 3D Phonics Islands along the Winding Trail */}
              {stageDays.map((dayItem, idx) => {
                const pos = windingCoords[idx] || { x: 50, y: 50 };
                return (
                  <div
                    key={dayItem.day}
                    style={{
                      left: `${pos.x}%`,
                      top: `${pos.y}%`,
                      zIndex: dayItem.day === 1 ? 25 : 15 + idx,
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                  >
                    {renderPhonicsIslandNode(dayItem, idx)}
                  </div>
                );
              })}
            </div>

            {/* MOBILE / TABLET PORTRAIT DUOLINGO-STYLE WINDING SNAKE TRAIL (< lg) */}
            <div className="flex lg:hidden flex-col items-center gap-5 w-full max-w-md py-6">
              {stageDays.map((dayItem, idx) => {
                const waveOffsets = [
                  'translate-x-0',
                  'translate-x-10 sm:translate-x-16',
                  'translate-x-0',
                  '-translate-x-10 sm:-translate-x-16',
                ];
                return (
                  <div
                    key={dayItem.day}
                    className={`relative flex flex-col items-center transition-transform ${
                      waveOffsets[idx % waveOffsets.length]
                    }`}
                  >
                    {renderPhonicsIslandNode(dayItem, idx)}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: HÀNH TRÌNH 4 TRẠM HÔM NAY (Centered max-w-3xl + 2x2 3D Grid)     */}
      {/* ========================================================================= */}
      {openDay && (
        <div
          onClick={() => {
            setOpenDay(null);
            playPopSound();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-sky-950/40 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl max-h-[94vh] overflow-y-auto bg-gradient-to-b from-[#ffffff] via-[#f8fdff] to-[#ecf8ff] dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 rounded-[32px] sm:rounded-[38px] border-3 border-white/95 dark:border-slate-700 shadow-[0_24px_60px_rgba(2,132,199,0.28),0_8px_0_#bae6fd] dark:shadow-2xl px-5 pt-5 pb-6 sm:px-7 sm:pt-6 sm:pb-7 animate-in zoom-in-95 duration-200"
          >
            {/* Magic UI Animated Glowing Perimeter */}
            <ShineBorder
              borderWidth={3}
              duration={12}
              shineColor={['#FBBF24', '#F472B6', '#38BDF8']}
            />

            {/* Top 3D Tactile Close Button */}
            <button
              onClick={() => {
                setOpenDay(null);
                playPopSound();
              }}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 z-20 w-10 h-10 rounded-full bg-white dark:bg-slate-800 text-slate-500 hover:text-rose-600 dark:hover:text-white border-2 border-slate-200 dark:border-slate-700 shadow-[0_3px_0_#cbd5e1] dark:shadow-none hover:bg-rose-50 flex items-center justify-center transition-all cursor-pointer active:translate-y-[2px] active:shadow-[0_1px_0_#cbd5e1]"
              title="Đóng"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>

            {/* Clean, Airy Header (No cluttered word-list subtitle) */}
            <div className="text-center mb-4 sm:mb-5">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 text-white font-black text-xs shadow-[0_3px_10px_rgba(168,85,247,0.3)] border border-white/60 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                Chặng {openDay.stage} • Ngày {openDay.day}
              </span>

              <SparklesText
                sparklesCount={6}
                colors={{ first: '#FBBF24', second: '#F43F5E' }}
                className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1.5 leading-tight"
              >
                {openDay.title}
              </SparklesText>

              {/* Unified Glass Progress & Star Chest Capsule */}
              <div className="mt-3 inline-flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 bg-white/90 dark:bg-slate-800/90 px-3.5 py-1.5 rounded-full border-2 border-sky-100 dark:border-slate-700 shadow-xs">
                <div className="flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-black text-slate-700 dark:text-slate-200 whitespace-nowrap">
                    {getDayCompletedCount(openDay.day)}/4 hoàn thành
                  </span>
                </div>

                <div className="w-24 sm:w-32 h-2.5 rounded-full bg-sky-100/90 dark:bg-slate-700 overflow-hidden border border-sky-200/80 dark:border-slate-600 p-0.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-emerald-400 transition-all duration-500"
                    style={{
                      width: `${Math.max(
                        6,
                        (getDayCompletedCount(openDay.day) / 4) * 100
                      )}%`,
                    }}
                  />
                </div>

                <span className="text-[11px] font-black text-amber-700 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-300/70 whitespace-nowrap">
                  🎁 Mở Rương Sao
                </span>
              </div>
            </div>

            {/* 2x2 SPACIOUS 3D PASTEL STATION CARDS (All 45 Days Unlocked!) */}
            {(() => {
              const openDayData = getPhonicsDayDataByNumber(openDay.day);
              const doneCount = getDayCompletedCount(openDay.day);

              return (
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    {PHONICS_STATIONS.map((st) => {
                      const isDone = Boolean(
                        completedStations[`d${openDay.day}-${st.key}`]
                      );
                      const stationSubtitle =
                        st.key === 'story'
                          ? openDayData.decodableStory.title
                          : st.subtitle;

                      return (
                        <div
                          key={st.key}
                          onClick={() => {
                            setActiveStation(st.key);
                            playPopSound();
                          }}
                          className={`group relative rounded-[26px] p-4 sm:p-5 border-2 transition-all duration-200 flex flex-col justify-between cursor-pointer select-none hover:-translate-y-1 ${st.cardSurface} ${st.cardBorder3D}`}
                        >
                          {/* Top Glossy Specular Highlight */}
                          <div className="pointer-events-none absolute inset-x-4 top-1 h-5 rounded-t-2xl bg-gradient-to-b from-white/75 to-transparent dark:from-white/5" />

                          <div>
                            {/* Top Row: Station Step Badge + Duration Pill */}
                            <div className="relative z-10 flex items-center justify-between gap-2 mb-3.5">
                              <span
                                className={`text-[11px] font-black px-3 py-1 rounded-full tracking-wide ${
                                  isDone
                                    ? 'bg-emerald-500 text-white shadow-xs'
                                    : st.pillBg
                                }`}
                              >
                                {st.badge}
                              </span>

                              <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-300 bg-white/85 dark:bg-slate-900/70 px-2.5 py-0.5 rounded-full border border-white dark:border-slate-700 shadow-2xs whitespace-nowrap">
                                ⏱ {st.time}
                              </span>
                            </div>

                            {/* Middle Row: 3D Icon Cushion + Full Unclipped Title & Subtitle */}
                            <div className="relative z-10 flex items-center gap-3.5 mb-4">
                              <div
                                className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${st.iconBg} text-white flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.12),inset_0_2px_2px_rgba(255,255,255,0.45)] border-2 border-white/80 flex-shrink-0 group-hover:scale-105 group-hover:-rotate-3 transition-transform`}
                              >
                                {st.key === 'blending' && (
                                  <span className="text-base font-black tracking-tight">
                                    abc
                                  </span>
                                )}
                                {st.key === 'flashcards' && (
                                  <Layers className="w-6 h-6" />
                                )}
                                {st.key === 'game' && (
                                  <Gamepad2 className="w-6 h-6" />
                                )}
                                {st.key === 'story' && (
                                  <BookOpen className="w-6 h-6" />
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <h4 className="font-black text-base sm:text-lg text-slate-900 dark:text-white leading-snug">
                                  {st.title}
                                </h4>
                                <p
                                  className={`text-xs sm:text-[13px] font-bold mt-0.5 leading-snug ${
                                    isDone
                                      ? 'text-emerald-600 dark:text-emerald-400 flex items-center gap-1'
                                      : st.accentText
                                  }`}
                                >
                                  {isDone ? (
                                    <>
                                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                                      <span>Đã hoàn thành xuất sắc</span>
                                    </>
                                  ) : (
                                    stationSubtitle
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Bottom Row: XP Pill + Uiverse 3D Pushable CTA Button with Magic UI CoolMode */}
                          <div className="relative z-10 flex items-center justify-between gap-2 pt-3 border-t border-slate-900/[0.06] dark:border-white/10">
                            <span className="inline-flex items-center gap-1 text-xs font-black text-amber-700 dark:text-amber-300 bg-amber-100/90 dark:bg-amber-950/70 px-2.5 py-1 rounded-full border border-amber-300/80 whitespace-nowrap">
                              ⭐ +{st.xp} XP
                            </span>

                            <CoolMode
                              options={STATION_COOL_OPTIONS}
                              className="inline-flex"
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveStation(st.key);
                                  playPopSound();
                                }}
                                className="group/btn relative inline-flex cursor-pointer select-none border-none bg-transparent p-0 outline-none"
                              >
                                {/* 3D Extruded Shadow Base */}
                                <span
                                  className={`pointer-events-none absolute inset-0 translate-y-[3.5px] rounded-full ${
                                    isDone ? 'bg-[#065f46]' : st.btnEdge
                                  }`}
                                />

                                {/* 3D Pushable Front Face */}
                                <span
                                  className={`relative inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs sm:text-[13px] font-black text-white border transition-transform duration-100 -translate-y-[1px] group-hover/btn:-translate-y-[2.5px] group-active/btn:translate-y-[2.5px] shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.45)] whitespace-nowrap ${
                                    isDone
                                      ? 'bg-gradient-to-b from-emerald-400 via-emerald-500 to-teal-600 border-emerald-200'
                                      : st.btnFront
                                  }`}
                                >
                                  <span>{isDone ? 'Chơi lại' : 'Vào trạm'}</span>
                                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.8]" />
                                </span>
                              </button>
                            </CoolMode>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Celebration Star Chest Banner when 4/4 completed */}
                  {doneCount >= 4 && (
                    <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-amber-100 via-yellow-50 to-amber-100 dark:from-amber-950/60 dark:to-amber-900/40 border-2 border-amber-300 flex items-center justify-between gap-3 animate-in fade-in">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center text-2xl shadow-md flex-shrink-0">
                          🎁
                        </div>
                        <div>
                          <h4 className="text-sm sm:text-base font-black text-amber-950 dark:text-amber-200">
                            Rương Sao Ngày {openDay.day} Đã Mở!
                          </h4>
                          <p className="text-xs text-amber-800 dark:text-amber-300 font-bold">
                            Tuyệt vời! Bé đã chinh phục trọn vẹn cả 4 trạm của bài{' '}
                            {openDay.title}!
                          </p>
                        </div>
                      </div>
                      <span className="px-3.5 py-1.5 rounded-full bg-emerald-500 text-white font-black text-xs shadow-sm whitespace-nowrap">
                        +65 XP Đạt Đỉnh!
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: FULLSCREEN 100VH STATION ACTIVITIES (All 45 Days Active!)        */}
      {/* ========================================================================= */}
      {activeStation &&
        openDay &&
        (() => {
          const activeDayData = getPhonicsDayDataByNumber(openDay.day);

          if (activeStation === 'blending') {
            return (
              <PhonicsBlendingLab
                key={`d${openDay.day}-blending`}
                dayData={activeDayData}
                onClose={() => {
                  setActiveStation(null);
                  playPopSound();
                }}
                onComplete={() => {
                  markStationCompleted(openDay.day, 'blending', 100);
                }}
                isAlreadyCompleted={Boolean(
                  completedStations[`d${openDay.day}-blending`]
                )}
              />
            );
          }

          if (activeStation === 'flashcards') {
            return (
              <PhonicsFlashcardsStation
                key={`d${openDay.day}-flashcards`}
                dayData={activeDayData}
                onClose={() => {
                  setActiveStation(null);
                  playPopSound();
                }}
                onComplete={() => {
                  markStationCompleted(openDay.day, 'flashcards', 100);
                }}
                isAlreadyCompleted={Boolean(
                  completedStations[`d${openDay.day}-flashcards`]
                )}
              />
            );
          }

          if (activeStation === 'game') {
            return (
              <PhonicsReflexGame
                key={`d${openDay.day}-game`}
                dayData={activeDayData}
                onClose={() => {
                  setActiveStation(null);
                  playPopSound();
                }}
                onComplete={(score) => {
                  markStationCompleted(openDay.day, 'game', score);
                }}
                isAlreadyCompleted={Boolean(
                  completedStations[`d${openDay.day}-game`]
                )}
              />
            );
          }

          return (
            <PhonicsDecodableStoryStation
              key={`d${openDay.day}-story`}
              dayData={activeDayData}
              onClose={() => {
                setActiveStation(null);
                playPopSound();
              }}
              onComplete={() => {
                markStationCompleted(openDay.day, 'story', 100);
              }}
              isAlreadyCompleted={Boolean(
                completedStations[`d${openDay.day}-story`]
              )}
            />
          );
        })()}
    </div>
  );
}
