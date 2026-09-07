'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  getTreasureHuntGameDetailsAction,
} from '@/actions/treasure-hunt-actions';
import type { QuizRound } from '@/types/candy-quiz';
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  Trophy,
} from 'lucide-react';

// Sample Questions Fallback
export interface QuestionData {
  id: string;
  questionText: string;
  imageUrl?: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

const DEFAULT_QUESTIONS: QuestionData[] = [
  {
    id: 'q1',
    questionText: "Which 2D shape usually has exactly three straight sides and three corners?",
    options: [
      "A round shape with no corners and no straight sides",
      "A shape with three straight sides and three corners",
      "A shape with four equal sides and four corners",
      "A shape with four sides where opposite sides match"
    ],
    correctIndex: 1,
    explanation: "[EN] A triangle has 3 straight sides and 3 corners. [VI] Hình tam giác có 3 cạnh thẳng và 3 góc."
  },
  { id: 'q2', questionText: "What color is a ripe banana?", options: ["Blue", "Yellow", "Purple", "Black"], correctIndex: 1, explanation: "[EN] Ripe bananas are yellow. [VI] Chuối chín có màu vàng." },
  { id: 'q3', questionText: "How many days are in a week?", options: ["5", "6", "7", "8"], correctIndex: 2, explanation: "[EN] There are 7 days in a week. [VI] Một tuần có 7 ngày." },
  { id: 'q4', questionText: "Which planet do we live on?", options: ["Mars", "Jupiter", "Earth", "Venus"], correctIndex: 2, explanation: "[EN] We live on Planet Earth. [VI] Chúng ta sống trên Trái Đất." },
  { id: 'q5', questionText: "Which shape has three sides?", options: ["Circle", "Triangle", "Square", "Rectangle"], correctIndex: 1, explanation: "[EN] A triangle has 3 sides. [VI] Hình tam giác có 3 cạnh." },
  { id: 'q6', questionText: "What sweet food do bees make?", options: ["Milk", "Honey", "Bread", "Juice"], correctIndex: 1, explanation: "[EN] Bees produce honey. [VI] Loài ong làm ra mật ong." },
  { id: 'q7', questionText: "What is 5 + 3?", options: ["7", "8", "9", "10"], correctIndex: 1, explanation: "[EN] 5 + 3 equals 8. [VI] 5 cộng 3 bằng 8." },
  { id: 'q8', questionText: "Which season is the hottest?", options: ["Winter", "Spring", "Summer", "Autumn"], correctIndex: 2, explanation: "[EN] Summer is the warmest season. [VI] Mùa hè là mùa nóng nhất." },
  { id: 'q9', questionText: "What do plants need to grow?", options: ["Sunlight", "Plastic", "Sandpaper", "Smoke"], correctIndex: 0, explanation: "[EN] Plants require sunlight and water. [VI] Cây cần ánh nắng để phát triển." },
  { id: 'q10', questionText: "Which one is a fruit?", options: ["Carrot", "Potato", "Apple", "Onion"], correctIndex: 2, explanation: "[EN] Apple is a fruit. [VI] Táo là một loại trái cây." },
  { id: 'q11', questionText: "How many legs does a spider have?", options: ["6", "8", "10", "12"], correctIndex: 1, explanation: "[EN] Spiders have 8 legs. [VI] Nhện có 8 chân." },
  { id: 'q12', questionText: "Which one can fly high in the air?", options: ["Rock", "Boat", "Bird", "Chair"], correctIndex: 2, explanation: "[EN] Birds can fly in the sky. [VI] Chim có thể bay." },
  { id: 'q13', questionText: "What color do you get from mixing red + yellow?", options: ["Orange", "Green", "Blue", "Pink"], correctIndex: 0, explanation: "[EN] Red and yellow make orange. [VI] Màu đỏ cộng màu vàng ra màu cam." },
  { id: 'q14', questionText: "Which object is used to tell time?", options: ["Clock", "Spoon", "Pillow", "Ball"], correctIndex: 0, explanation: "[EN] A clock tells time. [VI] Đồng hồ dùng để xem giờ." },
  { id: 'q15', questionText: "How many months are in one year?", options: ["10", "11", "12", "13"], correctIndex: 2, explanation: "[EN] One year has 12 months. [VI] Một năm có 12 tháng." },
  { id: 'q16', questionText: "Which place has lots of books to read?", options: ["Zoo", "Library", "Kitchen", "Beach"], correctIndex: 1, explanation: "[EN] Libraries contain many books. [VI] Thư viện có rất nhiều sách." }
];

// Mascot Item Definition & Defaults for Rounds
interface MascotItem {
  id: string;
  name: string;
  title: string;
  imageUrl: string;
  color: string;
  tag: string;
}

const DEFAULT_MASCOTS: MascotItem[] = [
  {
    id: 'baby_treasure_dragon',
    name: 'Bé Rồng Giữ Vàng',
    title: 'Thần Hộ Mệnh Long Tộc',
    imageUrl: '/games/mystery-treasure-grid-assets/assets/mascots/linhvat/01_baby_treasure_dragon.png',
    color: '#f59e0b',
    tag: 'Dũng Cảm & Cao Quý',
  },
  {
    id: 'pirate_parrot',
    name: 'Chú Vẹt Hải Tặc',
    title: 'Hoa Tiêu Biển Cả',
    imageUrl: '/games/mystery-treasure-grid-assets/assets/mascots/linhvat/02_pirate_parrot.png',
    color: '#3b82f6',
    tag: 'Thông Thái & Nhanh Nhẹn',
  },
  {
    id: 'treasure_turtle',
    name: 'Bé Rùa Biển Vàng',
    title: 'Thần Hộ Mệnh Trầm Lặng',
    imageUrl: '/games/mystery-treasure-grid-assets/assets/mascots/linhvat/03_treasure_turtle.png',
    color: '#10b981',
    tag: 'Bình An & Kiên Trì',
  },
  {
    id: 'gem_crab',
    name: 'Bé Cua Ngọc Bích',
    title: 'Chiến Binh Càng Vàng',
    imageUrl: '/games/mystery-treasure-grid-assets/assets/mascots/linhvat/04_gem_crab.png',
    color: '#ef4444',
    tag: 'Khéo Léo & Tinh Anh',
  },
  {
    id: 'treasure_slime',
    name: 'Slime Hoàng Kim',
    title: 'Tinh Linh Biển Sâu',
    imageUrl: '/games/mystery-treasure-grid-assets/assets/mascots/linhvat/05_treasure_slime.png',
    color: '#06b6d4',
    tag: 'Đáng Yêu & Diệu Kỳ',
  },
  {
    id: 'treasure_otter',
    name: 'Rái Cá Thủy Thủ',
    title: 'Thợ Lặn Đại Dương',
    imageUrl: '/games/mystery-treasure-grid-assets/assets/mascots/linhvat/06_treasure_otter.png',
    color: '#8b5cf6',
    tag: 'Chăm Chỉ & Tinh Nghịch',
  },
  {
    id: 'royal_dolphin',
    name: 'Cá Heo Hoàng Gia',
    title: 'Sứ Giả Biển Xanh',
    imageUrl: '/games/mystery-treasure-grid-assets/assets/mascots/linhvat/07_royal_dolphin.png',
    color: '#0284c7',
    tag: 'Thân Thiện & Hòa Bình',
  },
  {
    id: 'explorer_penguin',
    name: 'Cánh Cụt Thám Hiểm',
    title: 'Nhà Thám Hiểm Băng Giá',
    imageUrl: '/games/mystery-treasure-grid-assets/assets/mascots/linhvat/08_explorer_penguin.png',
    color: '#1e293b',
    tag: 'Bền Bỉ & Quyết Đoán',
  },
  {
    id: 'adventure_bunny',
    name: 'Thỏ Con Phiêu Lưu',
    title: 'Sứ Giả Tốc Độ',
    imageUrl: '/games/mystery-treasure-grid-assets/assets/mascots/linhvat/09_adventure_bunny.png',
    color: '#f97316',
    tag: 'Nhanh Nhẹn & Hoạt Bát',
  },
  {
    id: 'map_raccoon',
    name: 'Gấu Mèo Bản Đồ',
    title: 'Chuyên Gia Dẫn Đường',
    imageUrl: '/games/mystery-treasure-grid-assets/assets/mascots/linhvat/10_map_raccoon.png',
    color: '#78716c',
    tag: 'Sắc Sảo & Tỉ Mỉ',
  },
  {
    id: 'pirate_kitten',
    name: 'Mèo Con Cướp Biển',
    title: 'Thuyền Trưởng Tí Hon',
    imageUrl: '/games/mystery-treasure-grid-assets/assets/mascots/linhvat/11_pirate_kitten.png',
    color: '#ea580c',
    tag: 'Dũng Cảm & Đáng Yêu',
  },
  {
    id: 'pirate_octopus',
    name: 'Bạch Tuộc Xúc Tu Vàng',
    title: 'Chúa Tể Vực Sâu',
    imageUrl: '/games/mystery-treasure-grid-assets/assets/mascots/linhvat/12_pirate_octopus.png',
    color: '#ec4899',
    tag: 'Uy Quyền & Huyền Bí',
  },
  {
    id: 'captain_shark',
    name: 'Cá Mập Đại Dương',
    title: 'Dũng Sĩ Biển Cả',
    imageUrl: '/games/mystery-treasure-grid-assets/assets/mascots/linhvat/13_captain_shark.png',
    color: '#2563eb',
    tag: 'Mạnh Mẽ & Kiên Cường',
  },
  {
    id: 'treasure_ram',
    name: 'Cừu Sừng Vàng',
    title: 'Thần Hộ Mệnh Núi Đá',
    imageUrl: '/games/mystery-treasure-grid-assets/assets/mascots/linhvat/14_treasure_ram.png',
    color: '#d97706',
    tag: 'Vững Vàng & Trung Kiên',
  },
  {
    id: 'treasure_monkey',
    name: 'Bé Khỉ Giữ Khóa',
    title: 'Thần Hộ Vệ Kho Báu',
    imageUrl: '/games/mystery-treasure-grid-assets/assets/mascots/linhvat/15_treasure_monkey.png',
    color: '#b45309',
    tag: 'Thông Minh & Hài Hước',
  },
  {
    id: 'pirate_owl',
    name: 'Cú Mèo Thông Thái',
    title: 'Bậc Thầy Chiến Thuật',
    imageUrl: '/games/mystery-treasure-grid-assets/assets/mascots/linhvat/16_pirate_owl.png',
    color: '#6366f1',
    tag: 'Tri Thức & Sáng Suốt',
  },
  {
    id: 'adventure_fox',
    name: 'Cáo Đỏ Thám Hiểm',
    title: 'Trinh Sát Rừng Xanh',
    imageUrl: '/games/mystery-treasure-grid-assets/assets/mascots/linhvat/17_adventure_fox.png',
    color: '#dc2626',
    tag: 'Mưu Trí & Nhạy Bén',
  },
  {
    id: 'gem_seal',
    name: 'Hải Cẩu Ngọc Bích',
    title: 'Thần Hộ Vệ Băng Tuyết',
    imageUrl: '/games/mystery-treasure-grid-assets/assets/mascots/linhvat/18_gem_seal.png',
    color: '#0ea5e9',
    tag: 'Hiền Hòa & May Mắn',
  },
  {
    id: 'royal_seahorse',
    name: 'Cá Ngựa Hoàng Triều',
    title: 'Kỵ Sĩ San Hô',
    imageUrl: '/games/mystery-treasure-grid-assets/assets/mascots/linhvat/19_royal_seahorse.png',
    color: '#eab308',
    tag: 'Quý Phái & Trung Thành',
  },
  {
    id: 'jewel_starfish',
    name: 'Bé Sao Biển Lấp Lánh',
    title: 'Ngôi Sao Diệu Kỳ',
    imageUrl: '/games/mystery-treasure-grid-assets/assets/mascots/linhvat/20_jewel_starfish.png',
    color: '#f43f5e',
    tag: 'Tỏa Sáng & Diệu Kỳ',
  },
];

// Calculate layout configuration for the mascot ledge (adaptive 1 or 2 rows)
const getLedgeLayout = (count: number) => {
  const isDouble = count > 6;
  const bottomCount = isDouble ? Math.ceil(count / 2) : count;
  const topCount = isDouble ? count - bottomCount : 0;
  const maxRowItems = Math.max(bottomCount, topCount);

  // Dynamic coin badge diameter & gap to fit ~395px width
  let size = 48;
  let gap = 6;
  if (isDouble) {
    if (maxRowItems >= 10) {
      size = 34;
      gap = 4;
    } else if (maxRowItems >= 8) {
      size = 36;
      gap = 5;
    } else if (maxRowItems >= 7) {
      size = 38;
      gap = 6;
    } else {
      size = 40;
      gap = 6;
    }
  } else {
    if (count <= 3) {
      size = 54;
      gap = 10;
    } else if (count <= 4) {
      size = 50;
      gap = 8;
    } else {
      size = 46;
      gap = 6;
    }
  }

  const rowGap = 6;
  return { isDouble, bottomCount, topCount, maxRowItems, size, gap, rowGap };
};

// Calculate exact target coordinates on ledge for any round index
const getLedgeBadgeCoords = (roundIdx: number, totalRoundsCount: number) => {
  const count = totalRoundsCount > 0 ? totalRoundsCount : 4;
  const { isDouble, bottomCount, size, gap, rowGap } = getLedgeLayout(count);

  const panelLeft = 1090;
  const panelTop = 213;
  const ledgeBaseLeft = panelLeft + 14;
  const bottomRowBaseTop = panelTop - 26;

  const isTopRow = isDouble && roundIdx >= bottomCount;
  const col = isTopRow ? roundIdx - bottomCount : roundIdx;

  const targetX = ledgeBaseLeft + col * (size + gap) + size / 2;
  const targetY = isTopRow
    ? bottomRowBaseTop - (size + rowGap) + size / 2
    : bottomRowBaseTop + size / 2;

  return { targetX, targetY, size };
};

// Calculate adaptive layout for progress slot circles on right parchment
const getSlotGridLayout = (count: number) => {
  const c = Math.max(1, Math.min(20, count));
  let rowCounts: number[] = [];
  let size = 48;
  let gap = 10;
  let rowGap = 8;
  let top = 295;

  if (c <= 4) {
    rowCounts = [c];
    size = 48;
    gap = 10;
    top = 298;
  } else if (c <= 6) {
    rowCounts = [c];
    size = 44;
    gap = 8;
    top = 300;
  } else if (c <= 8) {
    const r1 = Math.ceil(c / 2);
    rowCounts = [r1, c - r1];
    size = 42;
    gap = 10;
    rowGap = 8;
    top = 280;
  } else if (c <= 10) {
    const r1 = Math.ceil(c / 2);
    rowCounts = [r1, c - r1];
    size = 40;
    gap = 8;
    rowGap = 8;
    top = 280;
  } else if (c <= 12) {
    const r1 = Math.ceil(c / 2);
    rowCounts = [r1, c - r1];
    size = 38;
    gap = 8;
    rowGap = 8;
    top = 282;
  } else if (c <= 14) {
    const r1 = Math.ceil(c / 2);
    rowCounts = [r1, c - r1];
    size = 36;
    gap = 7;
    rowGap = 8;
    top = 282;
  } else {
    // 15 to 20: 3 balanced rows
    const base = Math.floor(c / 3);
    const rem = c % 3;
    const r1 = base + (rem >= 1 ? 1 : 0);
    const r2 = base + (rem >= 2 ? 1 : 0);
    const r3 = base;
    rowCounts = [r1, r2, r3];
    size = c >= 19 ? 34 : 36;
    gap = c >= 19 ? 6 : 7;
    rowGap = 7;
    top = 270;
  }

  let currIdx = 0;
  const rows = rowCounts.map((countInRow) => {
    const rowIndices = Array.from({ length: countInRow }, (_, k) => currIdx + k);
    currIdx += countInRow;
    return rowIndices;
  });

  return { count: c, rows, size, gap, rowGap, top };
};

const TILE_COLORS = [
  'tile-red', 'tile-yellow', 'tile-green', 'tile-blue',
  'tile-purple', 'tile-blue', 'tile-red', 'tile-yellow',
  'tile-green', 'tile-yellow', 'tile-purple', 'tile-blue',
  'tile-red', 'tile-blue', 'tile-green', 'tile-purple'
];

// Web Audio API Synthesizer
class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private ensureAudio() {
    if (!this.enabled) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  playNote(freq: number, duration: number, type: OscillatorType = 'sine', gainValue = 0.04, delay = 0) {
    const ctx = this.ensureAudio();
    if (!ctx) return;
    try {
      const now = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(gainValue, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    } catch {}
  }

  playOpen() {
    this.playNote(660, 0.11, 'triangle', 0.03);
    this.playNote(880, 0.11, 'triangle', 0.028, 0.06);
  }

  playFirework() {
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) =>
      this.playNote(f, 0.2, 'triangle', 0.04, i * 0.07)
    );
  }

  playCorrect() {
    this.playNote(523.25, 0.15, 'triangle', 0.04);
    this.playNote(659.25, 0.15, 'triangle', 0.04, 0.07);
    this.playNote(783.99, 0.18, 'triangle', 0.04, 0.14);
  }

  playWrong() {
    this.playNote(280, 0.18, 'sawtooth', 0.028);
    this.playNote(220, 0.20, 'sawtooth', 0.024, 0.08);
  }

  playWin() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.playNote(f, 0.22, 'triangle', 0.04, i * 0.08));
  }

  playSparkle() {
    [784, 988, 1175, 1318, 1568].forEach((f, i) =>
      this.playNote(f, 0.12, 'sine', 0.035, i * 0.05)
    );
  }

  // 5-second dramatic rumbling and energy buildup for chest
  playRumbleBuildup(duration = 5) {
    const ctx = this.ensureAudio();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // Low sawtooth rumble with rising filter
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(55, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + duration);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, now);
      filter.frequency.linearRampToValueAtTime(400, now + duration);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.04, now + duration * 0.85);
      gain.gain.linearRampToValueAtTime(0.0001, now + duration);

      osc.connect(filter).connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration);

      // Accelerating rhythmic ticks as tension builds
      let t = 0;
      let interval = 0.55;
      while (t < duration - 0.25) {
        this.playNote(280 + t * 90, 0.07, 'triangle', 0.022, t);
        t += interval;
        interval = Math.max(0.12, interval * 0.88);
      }
    } catch {}
  }

  // 5-second triumphant victory fanfare for mascot center reveal
  playVictoryFanfare() {
    const melody = [
      { f: 523.25, d: 0.18, t: 0 },
      { f: 523.25, d: 0.18, t: 0.18 },
      { f: 523.25, d: 0.18, t: 0.36 },
      { f: 659.25, d: 0.45, t: 0.54 },
      { f: 587.33, d: 0.20, t: 1.05 },
      { f: 659.25, d: 0.20, t: 1.25 },
      { f: 783.99, d: 0.65, t: 1.45 },
      { f: 659.25, d: 0.20, t: 2.15 },
      { f: 783.99, d: 0.20, t: 2.35 },
      { f: 880.00, d: 0.25, t: 2.55 },
      { f: 1046.50, d: 0.85, t: 2.80 },
      { f: 1318.51, d: 0.90, t: 3.20 },
      { f: 1567.98, d: 1.10, t: 3.50 },
      { f: 2093.00, d: 1.30, t: 3.75 },
    ];
    melody.forEach((n) => {
      this.playNote(n.f, n.d, 'triangle', 0.042, n.t);
      this.playNote(n.f * 0.5, n.d, 'sine', 0.028, n.t);
    });
  }

  // Magical ting sound when mascot settles onto chest frame
  playBadgeSettle() {
    [987.77, 1318.51, 1975.53].forEach((f, idx) => {
      this.playNote(f, 0.22, 'sine', 0.04, idx * 0.08);
    });
  }

  // Cute squeak when clicking mascot badge
  playMascotSqueak() {
    this.playNote(1046.5, 0.08, 'triangle', 0.035);
    this.playNote(1318.5, 0.12, 'sine', 0.04, 0.06);
  }
}

const sounds = new SoundSynthesizer();

interface Particle {
  id: number;
  type: 'star' | 'normal' | 'xmark' | 'score';
  x: number;
  y: number;
  color?: string;
  dx?: string;
  dy?: string;
  rot?: string;
  text?: string;
}

interface ParsedRound {
  id: string;
  title: string;
  questions: QuestionData[];
}

interface FlyingStar {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  targetSlotIndex: number;
}

function MysteryTreasureGridContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const topicId = searchParams?.get('topicId') || null;

  const stageRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);

  // Scaling & Layout State
  const [scale, setScale] = useState<number>(1);
  const [topOffset, setTopOffset] = useState<number>(0);

  // Topic Data State
  const [isLoadingTopic, setIsLoadingTopic] = useState<boolean>(Boolean(topicId));
  const [topicTitle, setTopicTitle] = useState<string>('');
  const [rounds, setRounds] = useState<ParsedRound[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState<number>(0);

  // Format topic title to max 5 words, with '...' if longer
  const displayTopicTitle = useMemo(() => {
    const title = (topicTitle || 'TRUY TÌM KHO BÁU').trim();
    const words = title.split(/\s+/);
    if (words.length > 5) {
      return words.slice(0, 5).join(' ') + '...';
    }
    return title;
  }, [topicTitle]);

  // Gameplay State
  const [solvedSet, setSolvedSet] = useState<Set<number>>(new Set());
  const [revealedSlotsSet, setRevealedSlotsSet] = useState<Set<number>>(new Set());
  const [flyingStar, setFlyingStar] = useState<FlyingStar | null>(null);
  const [score, setScore] = useState<number>(0);
  const [timer, setTimer] = useState<number>(31);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [soundOn, setSoundOn] = useState<boolean>(true);
  const [currentTileIndex, setCurrentTileIndex] = useState<number | null>(null);
  const [pendingTileIndex, setPendingTileIndex] = useState<number | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [wrongTileIndexes, setWrongTileIndexes] = useState<Set<number>>(new Set());
  const [isUnlockChallenge, setIsUnlockChallenge] = useState<boolean>(false);
  const [challengeQuestion, setChallengeQuestion] = useState<QuestionData | null>(null);
  const [showUnlockAnnouncement, setShowUnlockAnnouncement] = useState<boolean>(false);
  const unlockTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isImageZoomed, setIsImageZoomed] = useState<boolean>(false);
  const [answerFeedback, setAnswerFeedback] = useState<'correct' | 'wrong' | null>(null);
  const feedbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [showRoundCleared, setShowRoundCleared] = useState<boolean>(false);
  const [showFinish, setShowFinish] = useState<boolean>(false);
  const [chestAnim, setChestAnim] = useState<'idle' | 'celebrate' | 'mega'>('idle');
  const [particles, setParticles] = useState<Particle[]>([]);

  // Mascot Collection & 3-Phase Chest Sequence State
  const [collectedMascots, setCollectedMascots] = useState<MascotItem[]>([]);
  const [isChestRumbling, setIsChestRumbling] = useState<boolean>(false);
  const [showGoldenFlash, setShowGoldenFlash] = useState<boolean>(false);
  const [centerMascotReveal, setCenterMascotReveal] = useState<MascotItem | null>(null);
  const [flyingMascot, setFlyingMascot] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    mascot: MascotItem;
  } | null>(null);

  // Proceed from 5s announcement popup straight to question modal
  const proceedToUnlockQuestion = useCallback(() => {
    if (unlockTimerRef.current) {
      clearTimeout(unlockTimerRef.current);
      unlockTimerRef.current = null;
    }
    setShowUnlockAnnouncement(false);
    setSelectedAnswer(null);
    setIsModalOpen(true);
    sounds.playOpen();
  }, []);

  // Fetch Topic Data from Backend
  useEffect(() => {
    if (!topicId) {
      setRounds([
        {
          id: 'default',
          title: 'Vòng 1',
          questions: DEFAULT_QUESTIONS,
        },
      ]);
      setIsLoadingTopic(false);
      return;
    }

    async function loadData() {
      setIsLoadingTopic(true);
      try {
        const res = await getTreasureHuntGameDetailsAction(topicId!);
        if (res.success && res.topic) {
          setTopicTitle(res.topic.title || '');
          if (res.topic.rounds && res.topic.rounds.length > 0) {
            const parsedRounds: ParsedRound[] = res.topic.rounds.map((r, rIdx) => {
              const questions: QuestionData[] = r.questions.map((q, qIdx) => {
                const options = q.options.map((opt) => opt.text);
                const correctIdx = q.options.findIndex((opt) => opt.isCorrect);
                return {
                  id: q.id || `q-${rIdx}-${qIdx}`,
                  questionText: q.question,
                  imageUrl: q.imageUrl || undefined,
                  options,
                  correctIndex: correctIdx !== -1 ? correctIdx : 0,
                  explanation: '',
                };
              });

              return {
                id: r.id || `round-${rIdx + 1}`,
                title: r.title || `Vòng ${rIdx + 1}`,
                questions,
              };
            });

            setRounds(parsedRounds);
            setCurrentRoundIndex(0);
          } else {
            setRounds([
              {
                id: 'default',
                title: 'Vòng 1',
                questions: DEFAULT_QUESTIONS,
              },
            ]);
          }
        }
      } catch (err) {
        console.error('Failed to load treasure hunt game topic:', err);
        setRounds([
          {
            id: 'default',
            title: 'Vòng 1',
            questions: DEFAULT_QUESTIONS,
          },
        ]);
      } finally {
        setIsLoadingTopic(false);
      }
    }

    loadData();
  }, [topicId]);

  // Current Active Round & Questions
  const currentRound = rounds[currentRoundIndex] || rounds[0] || {
    id: 'default',
    title: 'Vòng 1',
    questions: DEFAULT_QUESTIONS,
  };
  const activeQuestions = currentRound.questions || [];
  const totalRounds = rounds.length > 0 ? rounds.length : 1;

  // All questions across all rounds of the exercise for Unlock Challenge
  const allQuestions = useMemo(() => {
    const list = rounds.flatMap((r) => r.questions);
    return list.length > 0 ? list : DEFAULT_QUESTIONS;
  }, [rounds]);

  // Stage Scaling
  useEffect(() => {
    const handleResize = () => {
      const vw = window.innerWidth || shellRef.current?.clientWidth || 1672;
      const vh = window.innerHeight || shellRef.current?.clientHeight || 941;
      const newScale = Math.min(vw / 1672, vh / 941);
      const newTopOffset = Math.max(0, (vh - 941 * newScale) / 2);
      setScale(newScale);
      setTopOffset(newTopOffset);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Preload core modal assets and question illustrations for instant smooth rendering
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const coreModalAssets = [
      '/games/mystery-treasure-grid-assets/assets/treasure_modal_full_pack_v1/assets/png/tropical_treasure_map_ui_frame.png',
      '/games/mystery-treasure-grid-assets/assets/treasure_modal_full_pack_v1/assets/png/treasure_question_pirate_banner.png',
      '/games/mystery-treasure-grid-assets/assets/treasure_modal_full_pack_v1/assets/png/tropical_rope_framed_close_button.png',
      '/games/mystery-treasure-grid-assets/assets/treasure_modal_full_pack_v1/assets/png/glossy_tropical_wooden_game_button.png',
      '/games/mystery-treasure-grid-assets/assets/treasure_modal_full_pack_v1/assets/png/glossy_green_wood_game_button.png',
      '/games/mystery-treasure-grid-assets/assets/treasure_modal_full_pack_v1/assets/png/glossy_wooden_game_ui_banner.png',
      '/games/mystery-treasure-grid-assets/assets/treasure_modal_full_pack_v1/assets/png/glossy_purple_gold_game_button.png',
    ];
    coreModalAssets.forEach((src) => {
      const img = new window.Image();
      img.src = src;
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !allQuestions.length) return;
    allQuestions.forEach((q) => {
      if (q.imageUrl) {
        const img = new window.Image();
        img.src = q.imageUrl;
      }
    });
  }, [allQuestions]);



  // Sound toggle sync
  const toggleSound = () => {
    const nextSound = !soundOn;
    setSoundOn(nextSound);
    sounds.enabled = nextSound;
    if (nextSound) sounds.playOpen();
  };

  // Trigger 360-degree big fireworks star burst effect
  const triggerFireworkBurst = (tileIdx: number) => {
    const tileEl = document.querySelector(`.tile[data-index="${tileIdx}"]`);
    if (!tileEl || !stageRef.current) return;
    const rect = tileEl.getBoundingClientRect();
    const stageRect = stageRef.current.getBoundingClientRect();
    const cx = (rect.left - stageRect.left + rect.width / 2) / scale;
    const cy = (rect.top - stageRect.top + rect.height / 2) / scale;

    const colors = ['#ffd94b', '#fff6c4', '#ff3b68', '#00e5ff', '#ff66cc', '#70ff52', '#ffaa00', '#ffffff'];
    const newParticles: Particle[] = [];

    for (let i = 0; i < 65; i++) {
      const isOuter = i % 2 === 0;
      const angle = (Math.PI * 2 * i) / 65 + (Math.random() * 0.25 - 0.12);
      const distance = isOuter ? 140 + Math.random() * 200 : 60 + Math.random() * 110;
      newParticles.push({
        id: Date.now() + i + Math.random(),
        type: i % 3 === 0 ? 'star' : 'normal',
        x: cx,
        y: cy,
        color: colors[i % colors.length],
        dx: `${Math.cos(angle) * distance}px`,
        dy: `${Math.sin(angle) * distance - 40}px`,
        rot: `${(Math.random() * 480 - 240).toFixed(0)}deg`,
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);
  };

  // Open Question Modal (with 5s Announcement for locked tiles)
  const openQuestion = (index: number) => {
    if (solvedSet.has(index) || pendingTileIndex !== null || showUnlockAnnouncement) return;

    const isLocked = wrongTileIndexes.has(index);

    if (isLocked) {
      // THỬ THÁCH MỞ KHOÁ (Unlock Challenge):
      // Bốc ngẫu nhiên từ toàn bộ bài tập (loại trừ chính câu hỏi của ô đang bị khoá)
      const currentTargetQ = activeQuestions[index];
      const availableQuestions = allQuestions.filter(
        (q) => q.id !== currentTargetQ?.id && q.questionText !== currentTargetQ?.questionText
      );
      const pool = availableQuestions.length > 0 ? availableQuestions : allQuestions;
      const randomQ = pool[Math.floor(Math.random() * pool.length)];

      setIsUnlockChallenge(true);
      setChallengeQuestion(randomQ);
      setCurrentTileIndex(index);
      setShowUnlockAnnouncement(true);
      sounds.playSparkle();
      return;
    }

    setIsUnlockChallenge(false);
    setChallengeQuestion(null);

    setPendingTileIndex(index);
    triggerFireworkBurst(index);
    sounds.playFirework();

    setTimeout(() => {
      setPendingTileIndex(null);
      setCurrentTileIndex(index);
      setSelectedAnswer(null);
      setIsModalOpen(true);
      sounds.playOpen();
    }, 2000);
  };

  // Close Modal
  const closeQuestion = () => {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
    if (unlockTimerRef.current) {
      clearTimeout(unlockTimerRef.current);
      unlockTimerRef.current = null;
    }
    setShowUnlockAnnouncement(false);
    setIsModalOpen(false);
    setIsImageZoomed(false);
    setAnswerFeedback(null);
    setCurrentTileIndex(null);
    setSelectedAnswer(null);
    setIsUnlockChallenge(false);
    setChallengeQuestion(null);
  };

  // Close image zoom on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isImageZoomed) {
        setIsImageZoomed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isImageZoomed]);

  // Preload and decode modal frame and button assets into GPU memory
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const modalAssets = [
      '/games/mystery-treasure-grid-assets/assets/treasure_modal_full_pack_v1/assets/png/tropical_treasure_map_ui_frame.png',
      '/games/mystery-treasure-grid-assets/assets/treasure_modal_full_pack_v1/assets/png/treasure_question_pirate_banner.png',
      '/games/mystery-treasure-grid-assets/assets/treasure_modal_full_pack_v1/assets/png/tropical_rope_framed_close_button.png',
      '/games/mystery-treasure-grid-assets/assets/treasure_modal_full_pack_v1/assets/png/glossy_tropical_wooden_game_button.png',
      '/games/mystery-treasure-grid-assets/assets/treasure_modal_full_pack_v1/assets/png/glossy_green_wood_game_button.png',
      '/games/mystery-treasure-grid-assets/assets/treasure_modal_full_pack_v1/assets/png/glossy_wooden_game_ui_banner.png',
      '/games/mystery-treasure-grid-assets/assets/treasure_modal_full_pack_v1/assets/png/glossy_purple_gold_game_button.png',
    ];
    modalAssets.forEach((src) => {
      const img = new window.Image();
      img.src = src;
      if (typeof img.decode === 'function') {
        img.decode().catch(() => {});
      }
    });
  }, []);

  // Preload and decode active question illustration images
  useEffect(() => {
    if (typeof window === 'undefined') return;
    activeQuestions.forEach((q) => {
      if (q.imageUrl) {
        const img = new window.Image();
        img.src = q.imageUrl;
        if (typeof img.decode === 'function') {
          img.decode().catch(() => {});
        }
      }
    });
  }, [activeQuestions]);

  // Trigger burst stars effect
  const triggerBurstStars = (tileIdx: number) => {
    const tileEl = document.querySelector(`.tile[data-index="${tileIdx}"]`);
    if (!tileEl || !stageRef.current) return;
    const rect = tileEl.getBoundingClientRect();
    const stageRect = stageRef.current.getBoundingClientRect();
    const cx = (rect.left - stageRect.left + rect.width / 2) / scale;
    const cy = (rect.top - stageRect.top + rect.height / 2) / scale;

    const colors = ['#ffd94b', '#fff6c4', '#79f86c', '#38d0ff', '#ffa3d2'];
    const newParticles: Particle[] = [];
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 * i) / 16;
      const distance = 40 + Math.random() * 80;
      newParticles.push({
        id: Date.now() + i + Math.random(),
        type: i % 3 === 0 ? 'star' : 'normal',
        x: cx,
        y: cy,
        color: colors[i % colors.length],
        dx: `${Math.cos(angle) * distance}px`,
        dy: `${Math.sin(angle) * distance - 20}px`,
        rot: `${(Math.random() * 260 - 130).toFixed(0)}deg`,
      });
    }
    // Score float particle
    newParticles.push({
      id: Date.now() + 99,
      type: 'score',
      x: cx - 20,
      y: cy - 10,
      text: '+10',
    });

    setParticles((prev) => [...prev, ...newParticles]);
  };

  // Trigger multi-wave fullscreen celebration fireworks
  const triggerFullscreenFireworks = () => {
    const burstPoints = [
      { x: 340, y: 220 },
      { x: 1332, y: 220 },
      { x: 836, y: 190 },
      { x: 420, y: 640 },
      { x: 1252, y: 640 },
      { x: 836, y: 480 },
    ];

    const colors = ['#ffd700', '#fff6c4', '#ff3366', '#00e5ff', '#76ff03', '#ff9100', '#e040fb', '#ffffff'];

    burstPoints.forEach((pt, ptIdx) => {
      setTimeout(() => {
        const newParticles: Particle[] = [];
        for (let i = 0; i < 50; i++) {
          const angle = (Math.PI * 2 * i) / 50 + (Math.random() * 0.25 - 0.12);
          const distance = 90 + Math.random() * 180;
          newParticles.push({
            id: Date.now() + ptIdx * 100 + i + Math.random(),
            type: i % 2 === 0 ? 'star' : 'normal',
            x: pt.x,
            y: pt.y,
            color: colors[i % colors.length],
            dx: `${Math.cos(angle) * distance}px`,
            dy: `${Math.sin(angle) * distance - 35}px`,
            rot: `${(Math.random() * 480 - 240).toFixed(0)}deg`,
          });
        }
        setParticles((prev) => [...prev, ...newParticles]);
        sounds.playFirework();
      }, ptIdx * 320);
    });
  };

  // Trigger burst X wrong effect
  const triggerBurstX = (tileIdx: number) => {
    const tileEl = document.querySelector(`.tile[data-index="${tileIdx}"]`);
    if (!tileEl || !stageRef.current) return;
    const rect = tileEl.getBoundingClientRect();
    const stageRect = stageRef.current.getBoundingClientRect();
    const cx = (rect.left - stageRect.left + rect.width / 2) / scale;
    const cy = (rect.top - stageRect.top + rect.height / 2) / scale;

    const newParticles: Particle[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = -Math.PI / 2 + (Math.random() * 1.2 - 0.6);
      const distance = 25 + Math.random() * 50;
      newParticles.push({
        id: Date.now() + i + Math.random(),
        type: 'xmark',
        x: cx,
        y: cy,
        color: '#ff5a70',
        dx: `${Math.cos(angle) * distance + (Math.random() * 24 - 12)}px`,
        dy: `${Math.sin(angle) * distance - 20}px`,
        rot: `${(Math.random() * 120 - 60).toFixed(0)}deg`,
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);
  };

  // Expire timer handler
  const handleExpire = () => {
    if (currentTileIndex === null) return;
    setWrongTileIndexes((prev) => new Set(prev).add(currentTileIndex));
    triggerBurstX(currentTileIndex);
    sounds.playWrong();
    closeQuestion();
  };

  // Dynamic Grid Layout Math for 2 to 20 questions
  const gridLayout = useMemo(() => {
    const count = activeQuestions.length || 4;
    let cols = 4;
    if (count <= 2) cols = 2;
    else if (count <= 4) cols = 2;
    else if (count <= 9) cols = 3;
    else if (count <= 16) cols = 4;
    else cols = 5;

    const rows = Math.ceil(count / cols);
    const W_avail = 670;
    const H_avail = 570;

    const gap = Math.min(24, Math.max(12, Math.floor(96 / cols)));

    const maxW = Math.floor((W_avail - (cols - 1) * gap) / cols);
    const maxH = Math.floor((H_avail - (rows - 1) * gap) / rows);

    const tileW = Math.min(165, maxW);
    const tileH = Math.min(155, Math.floor(tileW * 0.95), maxH);

    const gridW = cols * tileW + (cols - 1) * gap;
    const gridH = rows * tileH + (rows - 1) * gap;

    const gridLeft = Math.floor(76 + (W_avail - gridW) / 2);
    const gridTop = Math.floor(115 + (H_avail - gridH) / 2);
    const fontSize = Math.min(68, Math.max(36, Math.floor(tileH * 0.48)));

    return { count, cols, rows, gap, tileW, tileH, gridW, gridH, gridLeft, gridTop, fontSize };
  }, [activeQuestions.length]);

  // Trigger flying sparkle from tile to its corresponding progress slot
  const triggerFlyToSlot = (tileIdx: number) => {
    setTimeout(() => {
      const tileEl = document.querySelector(`.tile[data-index="${tileIdx}"]`);
      const slotEl = document.querySelector(`[data-slot-index="${tileIdx}"]`);
      if (!tileEl || !slotEl || !stageRef.current) {
        setRevealedSlotsSet((prev) => new Set(prev).add(tileIdx));
        return;
      }

      const tileRect = tileEl.getBoundingClientRect();
      const slotRect = slotEl.getBoundingClientRect();
      const stageRect = stageRef.current.getBoundingClientRect();

      const startX = (tileRect.left - stageRect.left + tileRect.width / 2) / scale;
      const startY = (tileRect.top - stageRect.top + tileRect.height / 2) / scale;
      const endX = (slotRect.left - stageRect.left + slotRect.width / 2) / scale;
      const endY = (slotRect.top - stageRect.top + slotRect.height / 2) / scale;

      const starId = Date.now();
      setFlyingStar({
        id: starId,
        startX,
        startY,
        endX,
        endY,
        targetSlotIndex: tileIdx,
      });

      sounds.playSparkle();

      // When the star reaches the target slot (620ms):
      setTimeout(() => {
        setFlyingStar((current) => (current?.id === starId ? null : current));
        setRevealedSlotsSet((prev) => new Set(prev).add(tileIdx));
        setChestAnim('celebrate');
        sounds.playCorrect();

        // Spawn a burst of golden sparkles at the slot
        const burstParticles: Particle[] = [];
        for (let i = 0; i < 12; i++) {
          const angle = (Math.PI * 2 * i) / 12;
          const distance = 20 + Math.random() * 45;
          burstParticles.push({
            id: Date.now() + i,
            type: 'star',
            x: endX,
            y: endY,
            color: '#ffd700',
            dx: `${Math.cos(angle) * distance}px`,
            dy: `${Math.sin(angle) * distance}px`,
            rot: `${(Math.random() * 360).toFixed(0)}deg`,
          });
        }
        setParticles((prev) => [...prev, ...burstParticles]);

        setTimeout(() => {
          setChestAnim('idle');
        }, 800);
      }, 620);
    }, 150);
  };

  // Finalize answer result after 5-second effect or when student clicks "Tiếp tục ▶"
  const finishAnswer = (overrideAnswerIndex?: number) => {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }

    const ansIdx = overrideAnswerIndex !== undefined ? overrideAnswerIndex : selectedAnswer;
    const tileIdx = currentTileIndex;

    if (tileIdx === null || ansIdx === null) {
      closeQuestion();
      return;
    }

    const question = isUnlockChallenge && challengeQuestion ? challengeQuestion : activeQuestions[tileIdx];
    if (!question) {
      closeQuestion();
      return;
    }

    const isCorrect = ansIdx === question.correctIndex;

    if (isUnlockChallenge) {
      // THỬ THÁCH MỞ KHOÁ (Cách 2: Về bàn cờ)
      if (isCorrect) {
        // Trả lời đúng câu phụ -> Giải cứu ô trên bàn cờ trở về trạng thái bình thường
        setWrongTileIndexes((prev) => {
          const next = new Set(prev);
          next.delete(tileIdx);
          return next;
        });
        sounds.playSparkle();
      }
      // Trả lời sai câu phụ -> Ô vẫn bị khoá 🔒 trong wrongTileIndexes, nhường lượt
      closeQuestion();
      return;
    }

    // NORMAL QUESTION FLOW
    if (isCorrect) {
      const nextSolved = new Set(solvedSet).add(tileIdx);
      setSolvedSet(nextSolved);
      setWrongTileIndexes((prev) => {
        const next = new Set(prev);
        next.delete(tileIdx);
        return next;
      });
      setScore((prev) => prev + 10);

      // Trigger Flying Sparkle from tile to slot
      triggerFlyToSlot(tileIdx);

      // Check if all tiles in current round are solved
      if (nextSolved.size === activeQuestions.length) {
        setTimeout(() => {
          startRoundClearSequence();
        }, 900);
      }
    } else {
      setWrongTileIndexes((prev) => new Set(prev).add(tileIdx));
    }

    closeQuestion();
  };

  // 3-Phase Chest & Mascot Reveal Sequence
  const startRoundClearSequence = () => {
    // Chọn ngẫu nhiên 1 linh vật chưa được mở khóa trong ván chơi hiện tại
    const uncollected = DEFAULT_MASCOTS.filter(
      (m) => !collectedMascots.some((c) => c.id === m.id)
    );
    const pool = uncollected.length > 0 ? uncollected : DEFAULT_MASCOTS;
    const mascotToAward = pool[Math.floor(Math.random() * pool.length)];

    // Phase 1: 5-second intense chest rumble & golden glowing energy buildup
    setIsChestRumbling(true);
    setChestAnim('mega');
    sounds.playRumbleBuildup(5);

    // After 5000ms rumble:
    setTimeout(() => {
      setIsChestRumbling(false);
      setShowGoldenFlash(true);
      setTimeout(() => setShowGoldenFlash(false), 450);

      // Phase 2: 5-second center screen mascot reveal & celebration
      setCenterMascotReveal(mascotToAward);
      sounds.playVictoryFanfare();
      triggerFullscreenFireworks();

      // After 5000ms center reveal:
      setTimeout(() => {
        // Calculate destination badge on ledge (supporting dynamic 1 or 2 rows)
        const currentCount = collectedMascots.length;
        const { targetX, targetY } = getLedgeBadgeCoords(currentCount, totalRounds);

        setFlyingMascot({
          startX: 1672 / 2,
          startY: 941 / 2,
          endX: targetX,
          endY: targetY,
          mascot: mascotToAward,
        });
        setCenterMascotReveal(null);
        sounds.playSparkle();

        // Phase 3: Arrival at ledge (850ms)
        setTimeout(() => {
          setFlyingMascot(null);
          setCollectedMascots((prev) => [...prev, mascotToAward]);
          sounds.playBadgeSettle();

          // Conclude round or match
          setTimeout(() => {
            if (currentRoundIndex < totalRounds - 1) {
              setShowRoundCleared(true);
            } else {
              setShowFinish(true);
            }
          }, 600);
        }, 850);

      }, 5000);
    }, 5000);
  };

  // Choose Answer handler with 5-second celebratory/feedback effect
  const handleChooseAnswer = (answerIndex: number) => {
    if (currentTileIndex === null || selectedAnswer !== null) return;
    setSelectedAnswer(answerIndex);

    const question = isUnlockChallenge && challengeQuestion ? challengeQuestion : activeQuestions[currentTileIndex];
    if (!question) return;

    const isCorrect = answerIndex === question.correctIndex;

    if (isCorrect) {
      setAnswerFeedback('correct');
      sounds.playCorrect();
      triggerBurstStars(currentTileIndex);
      triggerFullscreenFireworks();
      setChestAnim('celebrate');

      // Automatically finalize and close question modal after 5 seconds
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = setTimeout(() => {
        finishAnswer(answerIndex);
      }, 5000);
    } else {
      setAnswerFeedback('wrong');
      sounds.playWrong();
      triggerBurstX(currentTileIndex);

      // Wrong answer effect: close after 3 seconds
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = setTimeout(() => {
        finishAnswer(answerIndex);
      }, 3000);
    }
  };

  // Next Round Handler (Chơi lần lượt từng vòng)
  const handleNextRound = () => {
    setShowRoundCleared(false);
    setCurrentRoundIndex((prev) => prev + 1);
    setSolvedSet(new Set());
    setRevealedSlotsSet(new Set());
    setFlyingStar(null);
    setWrongTileIndexes(new Set());
    setCurrentTileIndex(null);
    setSelectedAnswer(null);
    setIsUnlockChallenge(false);
    setChallengeQuestion(null);
    setTimer(31);
    setChestAnim('idle');
    setIsChestRumbling(false);
    setShowGoldenFlash(false);
    setCenterMascotReveal(null);
    setFlyingMascot(null);
    sounds.playOpen();
  };

  // Reset Game completely
  const resetGame = () => {
    if (unlockTimerRef.current) {
      clearTimeout(unlockTimerRef.current);
      unlockTimerRef.current = null;
    }
    setShowUnlockAnnouncement(false);
    setIsTimerRunning(false);
    setCurrentRoundIndex(0);
    setSolvedSet(new Set());
    setRevealedSlotsSet(new Set());
    setFlyingStar(null);
    setScore(0);
    setCurrentTileIndex(null);
    setSelectedAnswer(null);
    setIsUnlockChallenge(false);
    setChallengeQuestion(null);
    setTimer(31);
    setWrongTileIndexes(new Set());
    setIsModalOpen(false);
    setShowRoundCleared(false);
    setShowFinish(false);
    setChestAnim('idle');
    setParticles([]);
    setCollectedMascots([]);
    setIsChestRumbling(false);
    setShowGoldenFlash(false);
    setCenterMascotReveal(null);
    setFlyingMascot(null);
  };

  const currentQ = isUnlockChallenge && challengeQuestion
    ? challengeQuestion
    : currentTileIndex !== null
    ? activeQuestions[currentTileIndex]
    : null;

  if (isLoadingTopic) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-[#07243e] flex flex-col items-center justify-center gap-4 text-white select-none z-[200]">
        <div className="relative w-28 h-28 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-amber-400/20 border-t-amber-400 border-r-amber-300 animate-spin" />
          <div className="relative w-16 h-16 flex items-center justify-center z-10 animate-bounce">
            <img
              src="/games/mystery-treasure-grid-assets/assets/webp/treasure-chest.webp"
              alt="Treasure Chest"
              className="w-full h-full object-contain drop-shadow-[0_4px_14px_rgba(255,215,0,0.6)]"
            />
          </div>
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-xl font-black uppercase tracking-widest text-amber-300 drop-shadow-md animate-pulse">
            Đang nạp bản đồ kho báu...
          </h2>
          <p className="text-xs text-slate-300 font-bold">Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={shellRef}
      className="fixed inset-0 w-screen h-screen overflow-hidden flex justify-center items-start select-none"
      style={{
        background: "#0d5b8d url('/games/mystery-treasure-grid-assets/assets/webp/background-browser-wide.webp') center center / cover no-repeat fixed",
        fontFamily: '"Baloo 2", "Trebuchet MS", "Arial Rounded MT Bold", sans-serif',
      }}
    >
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800;900&display=swap');

        @keyframes jellyBounce {
          0%, 100% { transform: scale(1) rotate(0deg) translateY(0); }
          22% { transform: scale(1.08, 0.93) rotate(-3deg) translateY(-4px); }
          45% { transform: scale(0.94, 1.07) rotate(3.5deg) translateY(-9px); }
          68% { transform: scale(1.04, 0.97) rotate(-2deg) translateY(-11px); }
          85% { transform: scale(0.98, 1.02) rotate(1deg) translateY(-6px); }
        }
        @keyframes modalPopIn {
          0% { opacity: 0; transform: scale(0.15) rotate(-6deg) translateY(60px); }
          30% { opacity: 1; transform: scale(1.15) rotate(2.5deg) translateY(-14px); }
          55% { transform: scale(0.92) rotate(-1.5deg) translateY(6px); }
          78% { transform: scale(1.05) rotate(1deg) translateY(-3px); }
          90% { transform: scale(0.98) rotate(0deg) translateY(1px); }
          100% { opacity: 1; transform: scale(1) rotate(0deg) translateY(0); }
        }
        @keyframes backdropFadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes correctPop {
          0% { transform: scale(1); }
          24% { transform: scale(.92); }
          58% { transform: scale(1.14); }
          100% { transform: scale(1.02); }
        }
        @keyframes wrongShake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-10px) rotate(-2deg); }
          30% { transform: translateX(8px) rotate(1.5deg); }
          45% { transform: translateX(-8px) rotate(-1deg); }
          60% { transform: translateX(6px) rotate(1deg); }
          75% { transform: translateX(-3px); }
        }
        @keyframes chestBounce {
          0% { transform: scale(1) translateY(0); }
          30% { transform: scale(0.96) translateY(4px); }
          65% { transform: scale(1.08) translateY(-12px); }
          100% { transform: scale(1.02) translateY(0); }
        }
        @keyframes chestMega {
          0% { transform: scale(1) rotate(0); }
          20% { transform: scale(1.06) rotate(-2deg); }
          40% { transform: scale(1.11) rotate(2deg); }
          65% { transform: scale(1.15) rotate(-1.5deg); }
          100% { transform: scale(1.03) rotate(0); }
        }
        @keyframes slotSpark {
          0% { transform: scale(1); }
          30% { transform: scale(1.14); }
          55% { transform: scale(.92); }
          100% { transform: scale(1.02); }
        }
        @keyframes particleFly {
          0% { opacity: 1; transform: translate(0, 0) scale(.5); }
          25% { opacity: 1; transform: translate(calc(var(--dx) * 0.35), calc(var(--dy) * 0.35)) scale(1.3); }
          100% { opacity: 0; transform: translate(var(--dx), var(--dy)) rotate(var(--rot)) scale(.4); }
        }
        @keyframes scoreFloat {
          0% { opacity: 0; transform: translateY(10px) scale(.8); }
          15% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-90px) scale(1.1); }
        }

        @keyframes superTileGlow {
          0%, 100% { transform: scale(1.12); filter: brightness(1.35) drop-shadow(0 0 28px rgba(255, 215, 0, 0.95)); }
          50% { transform: scale(1.22); filter: brightness(1.55) drop-shadow(0 0 42px rgba(255, 235, 100, 1)); }
        }
        .tile-pending-glow {
          animation: superTileGlow 600ms ease-in-out infinite !important;
          z-index: 15 !important;
        }

        @keyframes numberBounceBig {
          0%, 100% {
            transform: scale(1) translateY(0);
            filter: drop-shadow(0 0 6px rgba(0, 0, 0, 0.6));
          }
          30% {
            transform: scale(1.48) translateY(-9px);
            color: #ffffff;
            filter: drop-shadow(0 0 16px rgba(255, 255, 255, 1)) drop-shadow(0 0 30px rgba(255, 220, 50, 1));
          }
          65% {
            transform: scale(1.22) translateY(2px);
          }
        }
        .animate-number-pulse {
          animation: numberBounceBig 480ms cubic-bezier(0.175, 0.885, 0.32, 1.275) infinite !important;
          display: grid !important;
          z-index: 20 !important;
        }
        .tile:active:not(:disabled) {
          transform: scale(0.88) !important;
          transition: transform 90ms ease;
        }
        .hover-jelly-bounce:not(:disabled):hover {
          animation: jellyBounce 680ms ease-in-out infinite;
          z-index: 10;
        }
        .tile.is-wrong-tile:hover {
          animation: jellyBounce 680ms ease-in-out infinite;
          filter: drop-shadow(0 0 16px rgba(255, 215, 0, 0.95)) brightness(1.15);
          z-index: 10;
        }
        .treasure-challenge-banner {
          position: absolute;
          z-index: 4;
          width: 58%;
          aspect-ratio: 950 / 280;
          left: 50%;
          top: -15%;
          transform: translateX(-50%);
          pointer-events: none;
          user-select: none;
          filter: drop-shadow(0 9px 8px rgba(74,32,0,.28));
        }
        .animate-backdrop-fade { animation: backdropFadeIn 180ms ease-out forwards; }
        .animate-zoom-in { animation: lightboxZoomIn 220ms cubic-bezier(.16,1,.3,1) both; }
        .animate-correct-pop { animation: correctPop 750ms cubic-bezier(.22,1,.36,1); }
        .animate-wrong-shake { animation: wrongShake 560ms ease; }
        .animate-chest-bounce { animation: chestBounce 800ms cubic-bezier(.22,1,.36,1); }
        .animate-chest-mega { animation: chestMega 1.8s ease; }
        .animate-slot-spark { animation: slotSpark 720ms ease; }
        .particle-fly { animation: particleFly 850ms ease-out forwards; }
        .particle-score { animation: scoreFloat 900ms ease-out forwards; }

        @keyframes flyStarKeyframes {
          0% {
            left: var(--fly-start-x);
            top: var(--fly-start-y);
            transform: translate(-50%, -50%) scale(0.6) rotate(0deg);
            opacity: 1;
          }
          35% {
            transform: translate(-50%, -50%) scale(1.4) rotate(120deg);
            opacity: 1;
            filter: drop-shadow(0 0 20px rgba(255, 225, 60, 1)) drop-shadow(0 0 35px rgba(255, 180, 0, 0.8));
          }
          75% {
            transform: translate(-50%, -50%) scale(1.15) rotate(260deg);
            opacity: 1;
          }
          100% {
            left: var(--fly-end-x);
            top: var(--fly-end-y);
            transform: translate(-50%, -50%) scale(0.65) rotate(360deg);
            opacity: 0.85;
          }
        }
        .animate-fly-star {
          animation: flyStarKeyframes 620ms cubic-bezier(0.2, 0.8, 0.25, 1) forwards;
        }

        @keyframes chestRumbleShake {
          0%, 100% { transform: scale(1.04) translate(0, 0) rotate(0deg); }
          10% { transform: scale(1.08) translate(-5px, -3px) rotate(-3.5deg); }
          20% { transform: scale(1.06) translate(6px, 3px) rotate(3deg); }
          30% { transform: scale(1.10) translate(-6px, 4px) rotate(-3.5deg); }
          40% { transform: scale(1.08) translate(5px, -3px) rotate(3.5deg); }
          50% { transform: scale(1.12) translate(-4px, -4px) rotate(-2.5deg); }
          60% { transform: scale(1.10) translate(5px, 4px) rotate(3deg); }
          70% { transform: scale(1.13) translate(-6px, -2px) rotate(-3.5deg); }
          80% { transform: scale(1.15) translate(5px, -3px) rotate(4deg); }
          90% { transform: scale(1.16) translate(-5px, 4px) rotate(-3deg); }
        }
        .animate-chest-rumble {
          animation: chestRumbleShake 180ms linear infinite !important;
        }

        @keyframes beamSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-beam-spin {
          animation: beamSpin 14s linear infinite;
        }

        @keyframes goldenAuraPulse {
          0%, 100% { transform: scale(0.95); opacity: 0.6; }
          50% { transform: scale(1.25); opacity: 1; filter: blur(35px); }
        }
        .animate-golden-aura {
          animation: goldenAuraPulse 1.2s ease-in-out infinite;
        }

        @keyframes mascotCenterPop {
          0% { opacity: 0; transform: scale(0.15) rotate(-15deg); }
          50% { opacity: 1; transform: scale(1.18) rotate(3deg); }
          72% { transform: scale(0.94) rotate(-1.5deg); }
          88% { transform: scale(1.05) rotate(1deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        .animate-mascot-pop {
          animation: mascotCenterPop 650ms cubic-bezier(.17,.89,.32,1.28) both;
        }

        @keyframes mascotFloatBreathing {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-4px) scale(1.03); }
        }
        .animate-mascot-float {
          animation: mascotFloatBreathing 2.2s ease-in-out infinite;
        }

        @keyframes flashFade {
          0% { opacity: 0; }
          40% { opacity: 0.85; }
          100% { opacity: 0; }
        }
        .animate-flash-fade {
          animation: flashFade 450ms ease-out forwards;
        }

        @keyframes flyToLedgeKeyframes {
          0% {
            left: var(--mascot-start-x);
            top: var(--mascot-start-y);
            transform: translate(-50%, -50%) scale(1) rotate(0deg);
            opacity: 1;
          }
          35% {
            transform: translate(-50%, -50%) scale(1.2) rotate(-8deg);
            filter: drop-shadow(0 0 25px rgba(255, 215, 0, 1));
          }
          75% {
            transform: translate(-50%, -50%) scale(0.65) rotate(8deg);
          }
          100% {
            left: var(--mascot-end-x);
            top: var(--mascot-end-y);
            transform: translate(-50%, -50%) scale(0.38) rotate(0deg);
            opacity: 1;
          }
        }
        .animate-fly-to-ledge {
          animation: flyToLedgeKeyframes 850ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        /* Full Pack v1 CSS Styles */
        .treasure-modal-backdrop {
          position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center;
          padding: 20px; background: rgba(7,26,43,.75);
          backdrop-filter: blur(8px) saturate(.78); -webkit-backdrop-filter: blur(8px) saturate(.78);
        }

        /* Question Modal */
        .treasure-modal {
          position: relative;
          width: min(1060px, 92vw, calc(86vh * 4 / 3));
          aspect-ratio: 4 / 3;
          isolation: isolate;
          filter: drop-shadow(0 28px 34px rgba(0,0,0,.34));
          animation: treasureModalIn 320ms cubic-bezier(.19,.9,.28,1.15) both;
          flex-shrink: 0;
        }
        .treasure-modal.has-image {
          width: min(940px, 68vw, calc(84vh * 4 / 3));
        }

        /* Fallback parchment layer (prevents see-through text flash while PNG decodes) */
        .treasure-modal-fallback-bg {
          position: absolute;
          inset: 4.5% 3.5% 4.5% 3.5%;
          background: radial-gradient(circle at center, #fff9e8 0%, #faecc7 65%, #e2cc94 100%);
          border-radius: 28px;
          z-index: 0;
          box-shadow: inset 0 0 25px rgba(133, 76, 17, 0.25);
          pointer-events: none;
        }

        /* Companion Image Frame - simple, auto-fits image natural aspect ratio without cropping */
        .treasure-image-frame {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: fit-content;
          height: fit-content;
          flex-shrink: 0;
          isolation: isolate;
          filter: drop-shadow(0 14px 24px rgba(0,0,0,.35));
          animation: treasureModalIn 320ms cubic-bezier(.19,.9,.28,1.15) both;
        }

        .treasure-image-card {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: fit-content;
          height: fit-content;
          min-width: 120px;
          min-height: 120px;
          padding: 6px;
          border-radius: 18px;
          background: linear-gradient(180deg, #fffbe8 0%, #f4e6c3 100%);
          border: 4px solid #7d3f13;
          box-shadow: 0 10px 22px rgba(0,0,0,0.4), inset 0 0 0 2px #ffe885;
          line-height: 0;
        }

        .treasure-image-card img {
          display: block;
          width: auto;
          height: auto;
          max-width: min(70vw, 20vh);
          max-height: min(70vw, 20vh);
          object-fit: contain;
          border-radius: 12px;
          transition: transform 200ms ease;
        }

        .treasure-image-card img:hover {
          transform: scale(1.02);
        }

        @media (min-width: 1024px) {
          .treasure-image-card {
            padding: 8px;
            border-radius: 20px;
            border-width: 4px;
          }
          .treasure-image-card img {
            max-width: min(290px, 20vw, 34vh);
            max-height: min(290px, 20vw, 34vh);
            border-radius: 14px;
          }
        }

        .treasure-frame {
          position: absolute; inset: 0; z-index: 1;
          width: 100%; height: 100%; object-fit: contain;
          pointer-events: none; user-select: none;
        }
        .treasure-title-banner {
          position: absolute; z-index: 4; width: 52%; left: 50%; top: -19%;
          transform: translateX(-50%); pointer-events: none; user-select: none;
          filter: drop-shadow(0 9px 8px rgba(74,32,0,.22));
        }
        .treasure-close {
          position: absolute; z-index: 6; top: 1.6%; right: -1.5%;
          width: 11.5%; aspect-ratio: 1; padding: 0; border: 0; border-radius: 50%;
          background: transparent; cursor: pointer;
          transition: transform 160ms ease, filter 160ms ease;
        }
        .treasure-close img { display: block; width: 100%; height: 100%; object-fit: contain; pointer-events: none; }
        .treasure-close:hover { transform: translateY(-4px) scale(1.06) rotate(2deg); filter: brightness(1.08) drop-shadow(0 8px 10px rgba(77,20,2,.25)); }
        .treasure-close:active { transform: translateY(2px) scale(.96); }

        .treasure-content {
          position: absolute; z-index: 3;
          left: 14%; right: 14%; top: 18%; bottom: 12%;
          display: flex; flex-direction: column; align-items: center; justify-content: flex-start;
          animation: treasureContentFadeIn 240ms cubic-bezier(0.16, 1, 0.3, 1) 140ms both;
        }
        .treasure-image-frame button {
          animation: treasureContentFadeIn 240ms cubic-bezier(0.16, 1, 0.3, 1) 140ms both;
        }
        .treasure-question {
          width: 100%; margin: 0; padding: 0 2%; color: #123b77;
          font-size: clamp(18px, 2.3vw, 34px); line-height: 1.15; font-weight: 900;
          text-align: center; letter-spacing: -.02em;
          text-shadow: 0 2px 0 rgba(255,255,255,.78), 0 4px 7px rgba(111,69,21,.15);
          display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
        }
        .treasure-answers {
          width: 100%; margin-top: clamp(10px, 2.2%, 24px);
          display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: clamp(8px, 1.4vw, 18px) clamp(12px, 1.8vw, 22px);
        }

        .treasure-answer {
          --answer-image: none;
          position: relative; width: 100%; aspect-ratio: 2.6 / 1; padding: 0; border: 0;
          border-radius: 999px; color: white; background: transparent var(--answer-image) center / 100% 100% no-repeat;
          cursor: pointer; overflow: visible;
          filter: drop-shadow(0 9px 6px rgba(85,47,10,.22));
          transition: transform 160ms cubic-bezier(.2,.8,.2,1), filter 160ms ease;
        }
        .answer-blue   { --answer-image: url("/games/mystery-treasure-grid-assets/assets/treasure_modal_full_pack_v1/assets/png/glossy_tropical_wooden_game_button.png"); }
        .answer-green  { --answer-image: url("/games/mystery-treasure-grid-assets/assets/treasure_modal_full_pack_v1/assets/png/glossy_green_wood_game_button.png"); }
        .answer-orange { --answer-image: url("/games/mystery-treasure-grid-assets/assets/treasure_modal_full_pack_v1/assets/png/glossy_wooden_game_ui_banner.png"); }
        .answer-purple { --answer-image: url("/games/mystery-treasure-grid-assets/assets/treasure_modal_full_pack_v1/assets/png/glossy_purple_gold_game_button.png"); }
        .treasure-answer:hover:not(:disabled) { transform: translateY(-6px) scale(1.025); filter: brightness(1.07) drop-shadow(0 13px 10px rgba(85,47,10,.28)); }
        .treasure-answer:active:not(:disabled) { transform: translateY(2px) scale(.985); filter: brightness(.98) drop-shadow(0 4px 3px rgba(85,47,10,.2)); }

        .answer-letter {
          position: absolute; left: 16.5%; top: 50%; transform: translate(-50%, -50%);
          color: #153b73; font-size: clamp(18px, 2.1vw, 32px); line-height: 1; font-weight: 900;
          text-shadow: 0 2px 0 rgba(255,255,255,.7); pointer-events: none;
        }
        .answer-text {
          position: absolute; left: 28%; right: 6%; top: 50%; transform: translateY(-50%);
          color: white; line-height: 1.15; font-weight: 900;
          text-align: center; white-space: normal; word-break: break-word;
          display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
          text-shadow: 0 2px 0 rgba(53,31,9,.45), 0 3px 6px rgba(0,0,0,.22); pointer-events: none;
        }
        .answer-shine {
          position: absolute; left: 28%; top: 13%; width: 17%; height: 62%; border-radius: 50%;
          background: linear-gradient(100deg, transparent, rgba(255,255,255,.65), transparent);
          opacity: 0; transform: skewX(-18deg) translateX(-80%); pointer-events: none;
        }
        .treasure-answer:hover:not(:disabled) .answer-shine { opacity: .72; animation: answerShine 720ms ease; }

        .treasure-answer.is-correct {
          animation: correctTreasure 720ms cubic-bezier(.2,.9,.25,1.25);
          filter: brightness(1.1) drop-shadow(0 0 15px rgba(255,225,74,.95)) drop-shadow(0 12px 10px rgba(25,107,38,.25));
        }
        .treasure-answer.is-correct::after {
          content: "✓"; position: absolute; right: 4.5%; top: 50%; transform: translateY(-50%);
          display: grid; place-items: center; width: 13%; aspect-ratio: 1; border-radius: 50%;
          color: white; font-size: clamp(18px,2vw,30px); font-weight: 900;
          background: linear-gradient(#71ef72,#169d37); border: 3px solid #ffe56f;
          box-shadow: 0 3px 0 #08782a, 0 0 14px rgba(255,228,84,.8);
        }
        .treasure-answer.is-wrong { animation: wrongTreasure 520ms ease; filter: saturate(.85) drop-shadow(0 0 13px rgba(255,65,83,.8)); }
        .treasure-answer.is-wrong::after {
          content: "×"; position: absolute; right: 4.5%; top: 50%; transform: translateY(-50%);
          display: grid; place-items: center; width: 13%; aspect-ratio: 1; border-radius: 50%;
          color: white; font-size: clamp(19px,2.1vw,32px); font-weight: 900;
          background: linear-gradient(#ff7979,#e72d3d); border: 3px solid #ffcf62; box-shadow: 0 3px 0 #a81729;
        }

        .sparkle {
          position: absolute; z-index: 5; width: 14px; aspect-ratio: 1; background: #fff6ad;
          clip-path: polygon(50% 0,62% 38%,100% 50%,62% 62%,50% 100%,38% 62%,0 50%,38% 38%);
          filter: drop-shadow(0 0 7px #ffc933); animation: twinkle 1.6s ease-in-out infinite; pointer-events: none;
        }
        .sparkle-1 { top: 9%; left: 27%; }
        .sparkle-2 { top: 11%; right: 26%; animation-delay: .45s; transform: scale(.7); }
        .sparkle-3 { bottom: 15%; left: 49%; animation-delay: .85s; transform: scale(.6); }

        @keyframes treasureModalIn {
          0% { opacity: 0; transform: translateY(12px) scale(.94); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes treasureContentFadeIn {
          0% { opacity: 0; transform: scale(0.97) translateY(4px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes answerShine { from { transform: skewX(-18deg) translateX(-100%); } to { transform: skewX(-18deg) translateX(360%); } }
        @keyframes correctTreasure { 0% { transform: scale(1); } 28% { transform: scale(.96); } 62% { transform: scale(1.075); } 100% { transform: scale(1.025); } }
        @keyframes wrongTreasure { 0%,100% { transform: translateX(0) rotate(0); } 18% { transform: translateX(-9px) rotate(-1.2deg); } 36% { transform: translateX(8px) rotate(1deg); } 54% { transform: translateX(-6px) rotate(-.7deg); } 72% { transform: translateX(4px) rotate(.45deg); } }
        @keyframes twinkle { 0%,100% { opacity: .35; scale: .7; rotate: 0deg; } 50% { opacity: 1; scale: 1.2; rotate: 45deg; } }
        @keyframes lightboxZoomIn {
          0% { opacity: 0; transform: scale(0.88); }
          100% { opacity: 1; transform: scale(1); }
        }

        /* Fullscreen Victory Celebration Animations */
        @keyframes victoryAuraSpin {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.1); }
          100% { transform: rotate(360deg) scale(1); }
        }
        .aura-radiant-spin {
          background: conic-gradient(
            from 0deg,
            rgba(255, 230, 70, 0.45) 0deg 20deg,
            transparent 20deg 40deg,
            rgba(255, 190, 20, 0.55) 40deg 60deg,
            transparent 60deg 80deg,
            rgba(80, 240, 140, 0.5) 80deg 100deg,
            transparent 100deg 120deg,
            rgba(255, 230, 70, 0.45) 120deg 140deg,
            transparent 140deg 160deg,
            rgba(255, 180, 20, 0.55) 160deg 180deg,
            transparent 180deg 200deg,
            rgba(80, 240, 140, 0.5) 200deg 220deg,
            transparent 220deg 240deg,
            rgba(255, 230, 70, 0.45) 240deg 260deg,
            transparent 260deg 280deg,
            rgba(255, 180, 20, 0.55) 280deg 300deg,
            transparent 300deg 320deg,
            rgba(80, 240, 140, 0.5) 320deg 340deg,
            transparent 340deg 360deg
          );
          filter: blur(14px);
          animation: victoryAuraSpin 14s linear infinite;
        }

        @keyframes auraPulseSlow {
          0%, 100% { transform: scale(1); opacity: 0.65; }
          50% { transform: scale(1.18); opacity: 0.95; }
        }
        .aura-pulse-slow {
          animation: auraPulseSlow 1.8s ease-in-out infinite;
        }

        @keyframes victoryPulse {
          0%, 100% {
            transform: scale(1);
            filter: drop-shadow(0 0 35px rgba(120, 255, 80, 0.95)) drop-shadow(0 8px 0 #0d6e10);
          }
          50% {
            transform: scale(1.08);
            filter: drop-shadow(0 0 55px rgba(150, 255, 100, 1)) drop-shadow(0 0 85px rgba(60, 220, 40, 0.95)) drop-shadow(0 12px 0 #08520a);
          }
        }
        .victory-text {
          font-size: clamp(58px, 9vw, 118px);
          font-family: "Baloo 2", sans-serif;
          font-weight: 900;
          line-height: 1.05;
          color: #fffbdf;
          background: linear-gradient(180deg, #ffffff 0%, #fff794 28%, #76f849 68%, #1ab51c 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: victoryPulse 1.2s ease-in-out infinite;
        }

        @keyframes wrongAuraSpin {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(-180deg) scale(1.08); }
          100% { transform: rotate(-360deg) scale(1); }
        }
        .aura-wrong-spin {
          background: conic-gradient(
            from 0deg,
            rgba(244, 63, 94, 0.45) 0deg 25deg,
            transparent 25deg 45deg,
            rgba(251, 146, 60, 0.4) 45deg 70deg,
            transparent 70deg 90deg,
            rgba(168, 85, 247, 0.45) 90deg 115deg,
            transparent 115deg 135deg,
            rgba(244, 63, 94, 0.45) 135deg 160deg,
            transparent 160deg 180deg,
            rgba(251, 146, 60, 0.4) 180deg 205deg,
            transparent 205deg 225deg,
            rgba(168, 85, 247, 0.45) 225deg 250deg,
            transparent 250deg 270deg,
            rgba(244, 63, 94, 0.45) 270deg 295deg,
            transparent 295deg 315deg,
            rgba(251, 146, 60, 0.4) 315deg 340deg,
            transparent 340deg 360deg
          );
          filter: blur(14px);
          animation: wrongAuraSpin 12s linear infinite;
        }

        @keyframes wrongPulse {
          0%, 100% {
            transform: scale(1);
            filter: drop-shadow(0 0 35px rgba(255, 205, 75, 0.95)) drop-shadow(0 8px 0 #8c2300);
          }
          50% {
            transform: scale(1.06);
            filter: drop-shadow(0 0 55px rgba(255, 175, 45, 1)) drop-shadow(0 0 85px rgba(255, 95, 45, 0.95)) drop-shadow(0 12px 0 #6e1900);
          }
        }
        .wrong-text {
          font-size: clamp(58px, 9vw, 118px);
          font-family: "Baloo 2", sans-serif;
          font-weight: 900;
          line-height: 1.05;
          color: #fffbdf;
          background: linear-gradient(180deg, #ffffff 0%, #fff490 28%, #ffaa2b 68%, #ff4b4b 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: wrongPulse 1.2s ease-in-out infinite;
        }

        @keyframes victoryPopIn {
          0% { opacity: 0; transform: scale(0.25) translateY(40px); }
          60% { opacity: 1; transform: scale(1.15) translateY(-8px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-victory-pop {
          animation: victoryPopIn 480ms cubic-bezier(.17,.89,.32,1.28) both;
        }

        @keyframes starTwinkleFloat {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.7; }
          50% { transform: translateY(-12px) scale(1.35); opacity: 1; }
        }
        .celebrate-star {
          position: absolute;
          font-size: clamp(26px, 3.8vw, 50px);
          animation: starTwinkleFloat 1.6s ease-in-out infinite;
          filter: drop-shadow(0 0 12px #ffd700);
        }
        .star-pos-1 { top: 16%; left: 20%; animation-delay: 0s; }
        .star-pos-2 { top: 14%; right: 20%; animation-delay: 0.3s; }
        .star-pos-3 { bottom: 26%; left: 16%; animation-delay: 0.6s; }
        .star-pos-4 { bottom: 24%; right: 16%; animation-delay: 0.9s; }
        .star-pos-5 { top: 32%; left: 10%; animation-delay: 0.4s; }
        .star-pos-6 { top: 30%; right: 10%; animation-delay: 0.7s; }
        .star-pos-7 { bottom: 36%; left: 26%; animation-delay: 0.2s; }
        .star-pos-8 { bottom: 34%; right: 26%; animation-delay: 0.8s; }

        @keyframes barrelSwaySmooth {
          0%, 100% {
            transform: rotate(0deg) translateY(0);
          }
          20% {
            transform: rotate(-5deg) translateY(-3px);
          }
          40% {
            transform: rotate(4.5deg) translateY(-1px);
          }
          60% {
            transform: rotate(-3deg) translateY(-2px);
          }
          80% {
            transform: rotate(2deg) translateY(0);
          }
        }
        .animate-barrel-sway {
          animation: barrelSwaySmooth 1.9s ease-in-out infinite;
          transform-origin: bottom center;
        }

        @keyframes crabSwaySlow {
          0%, 100% {
            transform: rotate(0deg) translateY(0);
          }
          25% {
            transform: rotate(-7deg) translateY(-3px);
          }
          50% {
            transform: rotate(0deg) translateY(0);
          }
          75% {
            transform: rotate(7deg) translateY(-3px);
          }
        }
        .animate-crab-slow {
          animation: crabSwaySlow 2.8s ease-in-out infinite;
          transform-origin: bottom center;
        }

        @keyframes chestDoubleHop {
          0% {
            transform: translateY(0) scale(1, 1);
          }
          2.5% {
            transform: translateY(2px) scale(1.08, 0.92);
          }
          6% {
            transform: translateY(-16px) scale(0.94, 1.08);
          }
          9.5% {
            transform: translateY(0) scale(1.07, 0.92);
          }
          12% {
            transform: translateY(2px) scale(1.04, 0.95);
          }
          16% {
            transform: translateY(-22px) scale(0.92, 1.1);
          }
          20% {
            transform: translateY(0) scale(1.07, 0.92);
          }
          24% {
            transform: translateY(0) scale(1, 1);
          }
          100% {
            transform: translateY(0) scale(1, 1);
          }
        }
        .animate-chest-idle-hop {
          animation: chestDoubleHop 3s cubic-bezier(0.25, 1, 0.5, 1) infinite;
          transform-origin: bottom center;
        }
      `}</style>

      {/* 1672x941 Game Stage */}
      <div
        ref={stageRef}
        className="relative overflow-visible select-none shrink-0"
        style={{
          width: '1672px',
          height: '941px',
          marginTop: `${topOffset}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
        }}
      >
        {/* Top Center Title Board */}
        <div className="absolute top-[8px] left-[50%] -translate-x-1/2 z-[12] flex items-center justify-center pointer-events-none">
          <div className="relative w-[440px] h-[82px] flex items-center justify-center">
            <img
              src="/games/mystery-treasure-grid-assets/assets/webp/title-board.webp"
              alt="Title Board"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none drop-shadow-md"
            />
            {totalRounds > 1 && (
              <div className="relative z-10 px-8 pt-8 flex flex-col items-center justify-center text-center">
                <span className="text-[#fff8da] text-[10px] font-black uppercase tracking-widest bg-amber-950/75 px-3 py-0.5 rounded-full border border-amber-400/40 shadow-xs">
                  {currentRound.title || `VÒNG ${currentRoundIndex + 1}`} ({currentRoundIndex + 1}/{totalRounds})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Left Side Decor */}
        <img src="/games/mystery-treasure-grid-assets/assets/png/parrot.png" alt="Parrot" className="absolute left-[-65px] top-[0px] w-[460px] z-[3] pointer-events-none" />
        <img src="/games/mystery-treasure-grid-assets/assets/webp/sign-left.webp" alt="Sign Left" className="absolute left-[5px] top-[430px] w-[245px] z-[4] pointer-events-none" />
        {/* Barrel of Gold (To hơn + Rung lắc nhịp nhàng + Hào quang rực rỡ) */}
        <div
          onClick={() => sounds.playSparkle()}
          className="absolute left-[-12px] bottom-[5px] w-[220px] z-[5] pointer-events-auto cursor-pointer select-none group"
          title="Thùng vàng kho báu (Bấm để nghe tiếng vàng)"
        >
          {/* Rotating Golden Sunburst Ray Aura behind Barrel */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
            <div className="w-[310px] h-[310px] rounded-full animate-beam-spin bg-[conic-gradient(from_0deg,rgba(255,225,80,0.55)_0deg,transparent_20deg,rgba(255,245,140,0.65)_40deg,transparent_60deg,rgba(255,225,80,0.55)_80deg,transparent_100deg,rgba(255,245,140,0.65)_120deg,transparent_140deg,rgba(255,225,80,0.55)_160deg,transparent_180deg,rgba(255,245,140,0.65)_200deg,transparent_220deg,rgba(255,225,80,0.55)_240deg,transparent_260deg,rgba(255,245,140,0.65)_280deg,transparent_300deg,rgba(255,225,80,0.55)_320deg,transparent_340deg,rgba(255,245,140,0.65)_360deg)] filter blur-[3px] opacity-80" />
          </div>

          {/* Radiant Pulsing Golden Halo */}
          <div className="absolute -inset-4 rounded-full bg-gradient-to-t from-amber-400/50 via-yellow-300/70 to-orange-400/50 blur-2xl animate-pulse pointer-events-none -z-10" />

          {/* Twinkling Sparkles above Gold Coins */}
          <span className="absolute top-[8px] left-[42px] text-xl select-none animate-ping opacity-90 pointer-events-none text-yellow-200 filter drop-shadow-[0_0_10px_gold]">
            ✨
          </span>
          <span className="absolute top-[-10px] right-[52px] text-lg select-none animate-pulse opacity-95 pointer-events-none text-amber-300 filter drop-shadow-[0_0_12px_gold] [animation-delay:0.35s]">
            ⭐
          </span>
          <span className="absolute top-[22px] right-[28px] text-base select-none animate-ping opacity-80 pointer-events-none text-yellow-100 filter drop-shadow-[0_0_10px_gold] [animation-delay:0.7s]">
            ✨
          </span>

          {/* Smooth Swaying Barrel with Golden Drop-Shadow */}
          <img
            src="/games/mystery-treasure-grid-assets/assets/webp/barrel-gold.webp"
            alt="Thùng vàng"
            className="relative w-full h-auto object-contain animate-barrel-sway filter drop-shadow-[0_0_24px_rgba(255,215,0,0.9)] drop-shadow-[0_10px_20px_rgba(245,158,11,0.65)] group-hover:scale-105 transition-transform"
          />
        </div>

        {/* Left Panel Wrap (Grid of Tiles) */}
        <section className="absolute left-[230px] top-[90px] w-[840px] h-[740px] z-[2]">
          <img src="/games/mystery-treasure-grid-assets/assets/webp/panel-left.webp" alt="" className="absolute left-0 top-0 w-[840px] h-[740px]" />
          
          {/* Question Ribbon Banner with Game Title */}
          <div className="absolute left-[18px] top-[6px] w-[665px] h-[92px] z-[4] flex items-center justify-center px-16">
            <img
              src="/games/mystery-treasure-grid-assets/assets/webp/question-ribbon.webp"
              alt=""
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            />
            <span
              className="relative z-10 text-[#0d3468] text-[27px] font-[900] uppercase tracking-tight text-center truncate max-w-[500px]"
              style={{
                fontFamily: '"Baloo 2", "Arial Rounded MT Bold", sans-serif',
                fontWeight: 900,
                WebkitTextStroke: '0.6px #072044',
                textShadow: '0 2px 0 rgba(255,255,255,0.85), 0 3px 6px rgba(111,69,21,0.2)',
              }}
              title={topicTitle || 'TRUY TÌM KHO BÁU'}
            >
              {displayTopicTitle}
            </span>
          </div>

          {/* Counter Wrap */}
          <div className="absolute left-[592px] top-[20px] w-[217px] h-[72px] z-[5]">
            <img src="/games/mystery-treasure-grid-assets/assets/webp/counter-board-empty.webp" alt="" className="absolute inset-0 w-full h-full" />
            <div className="absolute inset-0 grid place-items-center text-[#ffe15c] text-[30px] font-black tracking-wider text-shadow-md">
              {solvedSet.size} / {activeQuestions.length}
            </div>
          </div>

          {/* Dynamic Grid */}
          <div
            className="absolute grid z-[4]"
            style={{
              left: `${gridLayout.gridLeft}px`,
              top: `${gridLayout.gridTop}px`,
              gridTemplateColumns: `repeat(${gridLayout.cols}, minmax(0, 1fr))`,
              gap: `${gridLayout.gap}px`,
            }}
          >
            {activeQuestions.map((_, index) => {
              const isSolved = solvedSet.has(index);
              const isPending = pendingTileIndex === index;
              const isWrong = wrongTileIndexes.has(index);
              const tileColor = TILE_COLORS[index % TILE_COLORS.length];

              return (
                <button
                  key={index}
                  data-index={index}
                  onClick={() => openQuestion(index)}
                  disabled={isSolved || pendingTileIndex !== null}
                  title={isWrong ? `Ô số ${index + 1} đang bị khoá - Bấm để giải cứu! 🗝️` : undefined}
                  style={{
                    width: `${gridLayout.tileW}px`,
                    height: `${gridLayout.tileH}px`,
                  }}
                  className={`tile relative p-0 border-none bg-none cursor-pointer transition-all duration-180 group ${
                    isSolved
                      ? 'solved cursor-default drop-shadow-[0_0_20px_rgba(255,215,0,0.9)] animate-correct-pop'
                      : isWrong
                      ? 'is-wrong-tile cursor-pointer hover:brightness-105'
                      : isPending
                      ? 'tile-pending-glow'
                      : 'hover-jelly-bounce'
                  } ${isWrong ? 'animate-wrong-shake' : ''}`}
                >
                  {/* Background Tile Graphic (desaturated / stone look if wrong) */}
                  <img
                    src={`/games/mystery-treasure-grid-assets/assets/webp/${tileColor}.webp`}
                    alt=""
                    className={`absolute inset-0 w-full h-full transition-all duration-300 ${
                      isWrong ? 'grayscale-90 brightness-65 contrast-125' : ''
                    }`}
                  />


                  {/* CENTER CONTENT */}
                  {isSolved ? (
                    /* SOLVED STATE: GOLDEN OPEN TREASURE CHEST */
                    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none animate-zoom-in">
                      <img
                        src="/games/mystery-treasure-grid-assets/assets/webp/treasure-chest.webp"
                        alt=""
                        className="w-[68%] h-[68%] object-contain drop-shadow-[0_4px_12px_rgba(255,215,0,0.85)]"
                      />
                    </div>
                  ) : isWrong ? (
                    /* WRONG STATE: STONE IRON PADLOCK */
                    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                      <span className="text-4xl sm:text-5xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] select-none">
                        🔒
                      </span>
                    </div>
                  ) : (
                    /* UNREVEALED STATE: BIG NUMBER */
                    <span
                      className={`absolute inset-0 grid place-items-center font-black text-[#fff8da] transition-transform select-none ${
                        isPending ? 'animate-number-pulse' : ''
                      }`}
                      style={{
                        fontSize: `${gridLayout.fontSize}px`,
                        fontFamily: '"Baloo 2", sans-serif',
                        fontWeight: 900,
                        textShadow: `
                          -3px -3px 0 #76431c,
                           3px -3px 0 #76431c,
                          -3px  3px 0 #76431c,
                           3px  3px 0 #76431c,
                           0px  4px 0 #4a270d,
                           0px  6px 10px rgba(0,0,0,0.5)
                        `,
                      }}
                    >
                      {index + 1}
                    </span>
                  )}

                  {/* Solved / Wrong Outer Glow Overlay */}
                  <span
                    className={`absolute inset-0 rounded-[24px] pointer-events-none transition-opacity duration-300 ${
                      isSolved
                        ? 'opacity-100 ring-4 ring-yellow-300/80 shadow-[0_0_24px_rgba(255,215,0,0.8),inset_0_0_15px_rgba(255,255,200,0.5)]'
                        : isWrong
                        ? 'opacity-100 ring-3 ring-rose-500/60 shadow-[0_0_16px_rgba(244,63,94,0.5),inset_0_0_12px_rgba(0,0,0,0.5)]'
                        : 'opacity-0'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </section>

        {/* Right Panel Wrap (Chest & Progress Slots) */}
        <section className="absolute left-[1090px] top-[213px] w-[427px] h-[494px] z-[2]">
          {/* Top Ledge Mascot Badges (Adaptive 1 or 2 Rows of 100% Round Pirate Coin Medallions) */}
          {(() => {
            const displayCount = totalRounds > 0 ? totalRounds : 4;
            const { isDouble, bottomCount, topCount, size, gap, rowGap } = getLedgeLayout(displayCount);

            const renderBadge = (idx: number) => {
              const mascot = collectedMascots[idx];
              const isCurrentRound = idx === currentRoundIndex;

              if (mascot) {
                return (
                  <div
                    key={mascot.id || idx}
                    onClick={() => sounds.playMascotSqueak()}
                    className="group relative rounded-full bg-gradient-to-b from-[#fffbe6] via-[#fef08a] to-[#f59e0b] border-[2.5px] border-[#fbbf24] shadow-[0_3px_10px_rgba(0,0,0,0.35),0_0_14px_rgba(255,215,0,0.7)] flex items-center justify-center cursor-pointer hover:scale-120 active:scale-95 transition-transform animate-mascot-float shrink-0"
                    style={{
                      width: `${size}px`,
                      height: `${size}px`,
                      animationDelay: `${(idx % 10) * 0.18}s`,
                    }}
                    title={`Vòng ${idx + 1}: ${mascot.name} - ${mascot.title}`}
                  >
                    <img
                      src={mascot.imageUrl}
                      alt={mascot.name}
                      className="w-[82%] h-[82%] object-contain rounded-full drop-shadow-xs"
                    />
                    <span className="absolute -top-1 -right-1 text-[10px] select-none filter drop-shadow">
                      ⭐
                    </span>

                    {/* Smart Hover Tooltip */}
                    <div className="absolute bottom-[-34px] left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap px-2.5 py-1 rounded-lg bg-amber-950/95 text-amber-200 text-[11px] font-black border border-amber-400/60 shadow-xl z-50">
                      Vòng {idx + 1}: {mascot.name} ⭐
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={idx}
                  className={`group relative rounded-full border-2 border-dashed flex items-center justify-center select-none transition-all shrink-0 ${
                    isCurrentRound
                      ? 'border-amber-300 bg-amber-500/25 shadow-[0_0_12px_rgba(255,215,0,0.6)] animate-pulse'
                      : 'border-white/35 bg-black/25 opacity-60'
                  }`}
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                  }}
                  title={`Vòng ${idx + 1}: ${isCurrentRound ? 'Đang chơi' : 'Chưa mở khóa'}`}
                >
                  <span
                    className={`font-black ${
                      isCurrentRound ? 'text-amber-300 text-xs' : 'text-white/40 text-[11px]'
                    }`}
                  >
                    {isCurrentRound ? '✨' : `?`}
                  </span>

                  {/* Smart Hover Tooltip */}
                  <div className="absolute bottom-[-34px] left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap px-2 py-0.5 rounded-lg bg-slate-900/90 text-white/90 text-[10px] font-bold border border-white/20 shadow-md z-50">
                    Vòng {idx + 1}: {isCurrentRound ? 'Đang chinh phục' : 'Chưa mở khóa'}
                  </div>
                </div>
              );
            };

            const containerTop = -26 - (isDouble && topCount > 0 ? size + rowGap : 0);

            return (
              <div
                className="absolute left-[14px] z-[25] pointer-events-auto flex flex-col"
                style={{
                  top: `${containerTop}px`,
                  gap: `${rowGap}px`,
                }}
              >
                {/* Hàng 2 (Hàng trên): các vòng từ bottomCount -> displayCount - 1 */}
                {isDouble && topCount > 0 && (
                  <div
                    className="flex items-center"
                    style={{ gap: `${gap}px` }}
                  >
                    {Array.from({ length: topCount }).map((_, colIdx) =>
                      renderBadge(bottomCount + colIdx)
                    )}
                  </div>
                )}

                {/* Hàng 1 (Hàng dưới): các vòng từ 0 -> bottomCount - 1 */}
                <div
                  className="flex items-center"
                  style={{ gap: `${gap}px` }}
                >
                  {Array.from({ length: bottomCount }).map((_, colIdx) =>
                    renderBadge(colIdx)
                  )}
                </div>
              </div>
            );
          })()}

          <img src="/games/mystery-treasure-grid-assets/assets/webp/panel-right.webp" alt="" className="absolute left-0 top-0 w-[427px] h-[494px]" />

          {/* Inner Panel Elements */}
          <div className="absolute left-0 top-0 w-[427px] h-[494px] z-[3]">
            {/* Permanent Radiant Sunburst Aura behind Chest (vòng hào quang mờ nhẹ, êm dịu phóng to theo rương) */}
            <div className="absolute left-1/2 -translate-x-1/2 top-[216px] -translate-y-1/2 w-[480px] h-[480px] pointer-events-none z-[1] flex items-center justify-center">
              {/* Rotating Soft Misty Golden Sunburst Rays */}
              <div
                className={`w-full h-full rounded-full animate-beam-spin filter blur-[6px] transition-all duration-300 ${
                  isChestRumbling ? 'opacity-75 scale-115' : 'opacity-42 scale-100'
                }`}
                style={{
                  background: `conic-gradient(
                    from 0deg,
                    rgba(245, 158, 11, 0.38) 0deg 12deg,
                    transparent 12deg 22.5deg,
                    rgba(251, 191, 36, 0.32) 22.5deg 34.5deg,
                    transparent 34.5deg 45deg,
                    rgba(245, 158, 11, 0.38) 45deg 57deg,
                    transparent 57deg 67.5deg,
                    rgba(254, 240, 138, 0.42) 67.5deg 79.5deg,
                    transparent 79.5deg 90deg,
                    rgba(245, 158, 11, 0.38) 90deg 102deg,
                    transparent 102deg 112.5deg,
                    rgba(251, 191, 36, 0.32) 112.5deg 124.5deg,
                    transparent 124.5deg 135deg,
                    rgba(245, 158, 11, 0.38) 135deg 147deg,
                    transparent 147deg 157.5deg,
                    rgba(254, 240, 138, 0.42) 157.5deg 169.5deg,
                    transparent 169.5deg 180deg,
                    rgba(245, 158, 11, 0.38) 180deg 192deg,
                    transparent 192deg 202.5deg,
                    rgba(251, 191, 36, 0.32) 202.5deg 214.5deg,
                    transparent 214.5deg 225deg,
                    rgba(245, 158, 11, 0.38) 225deg 237deg,
                    transparent 237deg 247.5deg,
                    rgba(254, 240, 138, 0.42) 247.5deg 259.5deg,
                    transparent 259.5deg 270deg,
                    rgba(245, 158, 11, 0.38) 270deg 282deg,
                    transparent 282deg 292.5deg,
                    rgba(251, 191, 36, 0.32) 292.5deg 304.5deg,
                    transparent 304.5deg 315deg,
                    rgba(245, 158, 11, 0.38) 315deg 327deg,
                    transparent 327deg 337.5deg,
                    rgba(254, 240, 138, 0.42) 337.5deg 349.5deg,
                    transparent 349.5deg 360deg
                  )`,
                  maskImage: 'radial-gradient(circle, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 72%)',
                  WebkitMaskImage: 'radial-gradient(circle, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 72%)',
                }}
              />

              {/* Gentle Soft Warm Glow Halo */}
              <div
                className={`absolute inset-8 rounded-full bg-[radial-gradient(circle,rgba(253,224,71,0.35)_0%,rgba(245,158,11,0.18)_55%,transparent_75%)] blur-2xl animate-pulse transition-all duration-300 ${
                  isChestRumbling ? 'opacity-80 scale-120' : 'opacity-42 scale-100'
                }`}
              />

              {/* Ambient Soft Twinkles */}
              <span className="absolute top-2 left-8 text-lg select-none animate-pulse opacity-60 text-yellow-200 filter drop-shadow-[0_0_6px_gold]">
                ✨
              </span>
              <span className="absolute top-0 right-10 text-base select-none animate-pulse opacity-65 text-amber-300 filter drop-shadow-[0_0_6px_gold] [animation-delay:0.6s]">
                ⭐
              </span>
              <span className="absolute bottom-12 right-6 text-sm select-none animate-pulse opacity-55 text-yellow-100 filter drop-shadow-[0_0_5px_gold] [animation-delay:1.2s]">
                ✨
              </span>
              <span className="absolute bottom-10 left-7 text-sm select-none animate-pulse opacity-55 text-amber-200 filter drop-shadow-[0_0_5px_gold] [animation-delay:1.8s]">
                ✨
              </span>
            </div>

            {/* Treasure Chest + Nameplate Unit (To hơn 1.2 lần: w-[395px], hạ xuống top-[90px]) */}
            <div
              onClick={() => sounds.playMascotSqueak()}
              className={`absolute left-1/2 -translate-x-1/2 top-[90px] z-[3] flex flex-col items-center cursor-pointer select-none transition-transform duration-240 ${
                isChestRumbling
                  ? 'animate-chest-rumble filter drop-shadow-[0_0_35px_rgba(255,220,50,1)] brightness-110'
                  : chestAnim === 'celebrate'
                  ? 'animate-chest-bounce'
                  : chestAnim === 'mega'
                  ? 'animate-chest-mega'
                  : 'animate-chest-idle-hop filter drop-shadow-[0_0_18px_rgba(255,215,0,0.55)] drop-shadow-[0_6px_14px_rgba(0,0,0,0.22)]'
              }`}
              title="Rương Kho Báu Thần Kỳ (Bấm để nghe âm thanh)"
            >
              {/* Chest Image (To hơn 1.2 lần: w-[395px]) */}
              <img
                src="/games/mystery-treasure-grid-assets/assets/webp/treasure-chest.webp"
                alt="Treasure Chest"
                className="w-[395px] object-contain drop-shadow-md hover:scale-105 transition-transform"
              />

              {/* Nameplate (Tỉ lệ chuẩn 1.2 lần: w-[414px]) */}
              <img
                src="/games/mystery-treasure-grid-assets/assets/webp/chest-nameplate.webp"
                alt="Magical Treasure Chest"
                className="-mt-[52px] w-[414px] object-contain drop-shadow-md hover:scale-105 transition-transform"
              />
            </div>

            {/* Slot Grid (Tự động tính toán số hàng, kích thước và khoảng cách để không bị sát mép khung) */}
            {(() => {
              const slotCount = Math.min(20, activeQuestions.length || 4);
              const { rows, size, gap, rowGap, top } = getSlotGridLayout(slotCount);

              return (
                <div
                  className="absolute left-0 right-0 flex flex-col items-center z-[4] pointer-events-none"
                  style={{
                    top: `${top}px`,
                    gap: `${rowGap}px`,
                  }}
                >
                  {rows.map((rowIndices, rowIdx) => (
                    <div
                      key={rowIdx}
                      className="flex items-center justify-center"
                      style={{ gap: `${gap}px` }}
                    >
                      {rowIndices.map((i) => {
                        const isFilled = revealedSlotsSet.has(i);
                        return (
                          <div
                            key={i}
                            data-slot-index={i}
                            style={{
                              width: `${size}px`,
                              height: `${size}px`,
                            }}
                            className={`relative bg-[url('/games/mystery-treasure-grid-assets/assets/webp/progress-slot.webp')] bg-contain bg-center bg-no-repeat ${
                              isFilled ? 'after:scale-100 after:opacity-100 animate-slot-spark' : ''
                            } after:content-[''] after:absolute after:inset-[26%] after:rounded-full after:scale-25 after:opacity-0 after:bg-[radial-gradient(circle_at_35%_35%,#fff7af_0%,#ffd643_35%,#f4a012_100%)] after:shadow-[0_0_18px_rgba(255,217,74,0.82)] after:transition-all after:duration-220`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </section>

        {/* Right Side Decor */}
        <img src="/games/mystery-treasure-grid-assets/assets/webp/sign-right.webp" alt="Sign Right" className="absolute right-[80px] bottom-[110px] w-[170px] z-[2] pointer-events-none" />
        {/* Crab (Lắc chậm) */}
        <img
          src="/games/mystery-treasure-grid-assets/assets/webp/crab.webp"
          alt="Bé Cua"
          onClick={() => sounds.playMascotSqueak()}
          className="absolute right-[130px] bottom-[30px] w-[130px] z-[2] animate-crab-slow cursor-pointer hover:scale-110 transition-transform filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.25)]"
          title="Bé Cua (Bấm để nghe tiếng kêu)"
        />

        {/* Dynamic Particles Layer */}
        <div ref={particlesRef} className="absolute inset-0 pointer-events-none z-[15]">
          {particles.map((p) => {
            if (p.type === 'score') {
              return (
                <div
                  key={p.id}
                  className="absolute text-[30px] font-black text-[#fff9b1] text-shadow-md particle-score"
                  style={{ left: `${p.x}px`, top: `${p.y}px` }}
                >
                  {p.text}
                </div>
              );
            }
            if (p.type === 'xmark') {
              return (
                <div
                  key={p.id}
                  className="absolute w-[12px] h-[12px] rounded-full text-[#ff5a70] particle-fly before:content-[''] before:absolute before:left-[6px] before:top-[-1px] before:w-[4px] before:h-[18px] before:rounded-[2px] before:bg-current before:rotate-45 after:content-[''] after:absolute after:left-[6px] after:top-[-1px] after:w-[4px] after:h-[18px] after:rounded-[2px] after:bg-current after:-rotate-45"
                  style={{
                    left: `${p.x}px`,
                    top: `${p.y}px`,
                    '--dx': p.dx,
                    '--dy': p.dy,
                    '--rot': p.rot,
                  } as React.CSSProperties}
                />
              );
            }
            return (
              <div
                key={p.id}
                className={`absolute rounded-full particle-fly ${
                  p.type === 'star'
                    ? 'w-[28px] h-[28px] [clip-path:polygon(50%_0%,61%_37%,98%_37%,68%_58%,79%_94%,50%_72%,21%_94%,32%_58%,2%_37%,39%_37%)] drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]'
                    : 'w-[18px] h-[18px] shadow-[0_0_14px_currentColor]'
                }`}
                style={{
                  left: `${p.x}px`,
                  top: `${p.y}px`,
                  backgroundColor: p.color,
                  color: p.color,
                  '--dx': p.dx,
                  '--dy': p.dy,
                  '--rot': p.rot,
                } as React.CSSProperties}
              />
            );
          })}
        </div>

        {/* Flying Star Particle (from tile to corresponding progress slot) */}
        {flyingStar && (
          <div
            key={flyingStar.id}
            className="absolute pointer-events-none z-[30] animate-fly-star flex items-center justify-center"
            style={{
              '--fly-start-x': `${flyingStar.startX}px`,
              '--fly-start-y': `${flyingStar.startY}px`,
              '--fly-end-x': `${flyingStar.endX}px`,
              '--fly-end-y': `${flyingStar.endY}px`,
            } as React.CSSProperties}
          >
            <span className="text-3xl select-none filter drop-shadow-[0_0_18px_rgba(255,220,50,1)]">
              ⭐
            </span>
            <span className="absolute text-xl select-none animate-ping opacity-80">
              ✨
            </span>
          </div>
        )}

        {/* Flying Mascot to Top Ledge (Red mark area) */}
        {flyingMascot && (
          <div
            className="absolute pointer-events-none z-[40] animate-fly-to-ledge flex items-center justify-center"
            style={{
              '--mascot-start-x': `${flyingMascot.startX}px`,
              '--mascot-start-y': `${flyingMascot.startY}px`,
              '--mascot-end-x': `${flyingMascot.endX}px`,
              '--mascot-end-y': `${flyingMascot.endY}px`,
            } as React.CSSProperties}
          >
            <div className="relative w-[120px] h-[120px] rounded-full p-2.5 bg-gradient-to-b from-[#fffbe8] via-[#fef08a] to-[#fed7aa] border-[4.5px] border-amber-400 shadow-[0_0_35px_rgba(255,215,0,1)] flex items-center justify-center">
              <img
                src={flyingMascot.mascot.imageUrl}
                alt={flyingMascot.mascot.name}
                className="w-full h-full object-contain rounded-full drop-shadow-md"
              />
              <span className="absolute -top-3 -right-3 text-3xl animate-ping select-none">
                ✨
              </span>
              <span className="absolute -bottom-2 -left-2 text-2xl select-none filter drop-shadow">
                ⭐
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Question Modal (with Optional Image Frame 2/3 size to the LEFT) */}
      {isModalOpen && currentQ && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) closeQuestion();
          }}
          className="treasure-modal-backdrop animate-backdrop-fade"
        >
          <div className="flex flex-col lg:flex-row items-center justify-center gap-6 max-h-[95vh] max-w-[98vw]">
            {/* COMPANION IMAGE FRAME (Đơn giản, tự co giãn 100% theo tỉ lệ ảnh gốc + Nút phóng to) */}
            {currentQ.imageUrl && (
              <div className="treasure-image-frame flex flex-col items-center gap-2.5" role="figure" aria-label="Question Illustration">
                <div
                  onClick={() => setIsImageZoomed(true)}
                  className="treasure-image-card cursor-zoom-in group/card relative transition-transform duration-200 hover:scale-[1.02]"
                  title="Bấm để phóng to ảnh"
                >
                  <img
                    src={currentQ.imageUrl}
                    alt="Question Illustration"
                    loading="eager"
                    decoding="sync"
                  />
                  {/* Hover indicator */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/card:opacity-100 transition-opacity rounded-[12px] sm:rounded-[14px] flex items-center justify-center pointer-events-none">
                    <span className="bg-amber-950/85 text-amber-200 text-xs px-2.5 py-1 rounded-full font-black shadow-md flex items-center gap-1 border border-amber-400/40">
                      🔍 Phóng to
                    </span>
                  </div>
                </div>

                {/* ZOOM BUTTON UNDERNEATH */}
                <button
                  type="button"
                  onClick={() => setIsImageZoomed(true)}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full font-black text-xs sm:text-sm text-amber-950 bg-gradient-to-b from-[#ffe79c] via-[#ffce4b] to-[#f0a719] border-2 border-[#7e4113] shadow-[0_4px_10px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.7)] hover:brightness-108 hover:scale-105 active:scale-95 transition-all cursor-pointer select-none"
                  title="Bấm để phóng to ảnh"
                >
                  <span>🔍</span>
                  <span>Phóng to</span>
                </button>
              </div>
            )}

            {/* MAIN QUESTION MODAL */}
            <section
              className={`treasure-modal ${currentQ.imageUrl ? 'has-image' : ''}`}
              role="dialog"
              aria-modal="true"
            >
              {/* Fallback parchment layer (prevents transparent text flash while PNG decodes) */}
              <div className="treasure-modal-fallback-bg" aria-hidden="true" />

              <img
                className="treasure-frame"
                src="/games/mystery-treasure-grid-assets/assets/treasure_modal_full_pack_v1/assets/png/tropical_treasure_map_ui_frame.png"
                alt=""
                draggable="false"
                loading="eager"
                decoding="sync"
              />
              <img
                className="treasure-title-banner"
                src="/games/mystery-treasure-grid-assets/assets/treasure_modal_full_pack_v1/assets/png/treasure_question_pirate_banner.png"
                alt="Treasure Question"
                draggable="false"
                loading="eager"
                decoding="sync"
              />

              <button onClick={closeQuestion} className="treasure-close" type="button" aria-label="Close question">
                <img
                  src="/games/mystery-treasure-grid-assets/assets/treasure_modal_full_pack_v1/assets/png/tropical_rope_framed_close_button.png"
                  alt=""
                  draggable="false"
                  loading="eager"
                  decoding="sync"
                />
              </button>

              <div className="treasure-content">
                <h2 className="treasure-question">{currentQ.questionText}</h2>

                <div className="treasure-answers" role="group" aria-label="Choose an answer">
                  {currentQ.options.map((opt, optIdx) => {
                    const isSelected = selectedAnswer === optIdx;
                    const isCorrect = optIdx === currentQ.correctIndex;
                    const isAnswered = selectedAnswer !== null;

                    const colorClasses = ['answer-blue', 'answer-green', 'answer-orange', 'answer-purple'];
                    const colorClass = colorClasses[optIdx % colorClasses.length];

                    let stateClass = '';
                    if (isAnswered) {
                      if (isSelected && isCorrect) stateClass = 'is-correct';
                      else if (isSelected && !isCorrect) stateClass = 'is-wrong';
                      else stateClass = 'opacity-35 cursor-default pointer-events-none';
                    }

                    const isVeryLong = opt.length > 35;
                    const isLong = opt.length > 20;
                    const fontSize = isVeryLong
                      ? 'clamp(11px, 1.2vw, 16px)'
                      : isLong
                      ? 'clamp(12px, 1.4vw, 19px)'
                      : 'clamp(15px, 1.8vw, 26px)';

                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleChooseAnswer(optIdx)}
                        disabled={isAnswered}
                        type="button"
                        className={`treasure-answer ${colorClass} ${stateClass}`}
                      >
                        <span className="answer-letter">{String.fromCharCode(65 + optIdx)}</span>
                        <span className="answer-text" style={{ fontSize }}>{opt}</span>
                        <span className="answer-shine" aria-hidden="true" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <i className="sparkle sparkle-1" aria-hidden="true" />
              <i className="sparkle sparkle-2" aria-hidden="true" />
              <i className="sparkle sparkle-3" aria-hidden="true" />
            </section>
          </div>
        </div>
      )}

      {/* FULLSCREEN CELEBRATION: BIG GLOWING "CHÍNH XÁC" & FIREWORKS */}
      {answerFeedback === 'correct' && (
        <div
          onClick={() => finishAnswer()}
          className="fixed inset-0 z-[1300] flex flex-col items-center justify-center select-none animate-backdrop-fade bg-black/45 backdrop-blur-xs cursor-pointer"
        >
          {/* Rotating Radiant Sunburst Aura */}
          <div className="absolute w-[600px] sm:w-[850px] h-[600px] sm:h-[850px] rounded-full aura-radiant-spin opacity-90 -z-10 pointer-events-none" />

          {/* Outer Pulsing Golden Halo */}
          <div className="absolute w-[360px] sm:w-[520px] h-[360px] sm:h-[520px] rounded-full bg-gradient-to-r from-amber-400/50 via-yellow-300/60 to-emerald-400/50 blur-3xl aura-pulse-slow -z-10 pointer-events-none" />

          {/* Floating Celebratory Stars */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <span className="celebrate-star star-pos-1">✨</span>
            <span className="celebrate-star star-pos-2">⭐</span>
            <span className="celebrate-star star-pos-3">🌟</span>
            <span className="celebrate-star star-pos-4">✨</span>
            <span className="celebrate-star star-pos-5">⭐</span>
            <span className="celebrate-star star-pos-6">🌟</span>
            <span className="celebrate-star star-pos-7">✨</span>
            <span className="celebrate-star star-pos-8">⭐</span>
          </div>

          {/* Grand Center "Chính xác" Typography */}
          <div className="relative flex flex-col items-center justify-center animate-victory-pop pointer-events-none text-center px-4">
            {isUnlockChallenge && (
              <div className="text-5xl sm:text-7xl mb-1 select-none animate-bounce">
                🔓✨
              </div>
            )}
            <h1
              className="victory-text font-[900] tracking-wider uppercase text-center select-none"
              style={{
                fontFamily: '"Baloo 2", sans-serif',
                textShadow: '-2px -2px 0 #ffffff, 2px -2px 0 #ffffff, -2px 2px 0 #ffffff, 2px 2px 0 #ffffff',
              }}
            >
              CHÍNH XÁC!
            </h1>
            {isUnlockChallenge && (
              <div className="flex flex-col items-center gap-1.5 mt-3">
                <p className="px-6 py-2 rounded-full bg-amber-950/85 border-2 border-amber-400 text-amber-200 text-base sm:text-xl font-black drop-shadow-md">
                  Ô số {(currentTileIndex ?? 0) + 1} đã được giải thoát thành công! 🌟
                </p>
                <span className="text-xs sm:text-sm text-yellow-100/90 font-bold drop-shadow">
                  Bấm vào ô trên bàn cờ để trả lời câu hỏi chính nhé!
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FULLSCREEN WRONG FEEDBACK: BIG GLOWING "TIẾC QUÁ!" */}
      {answerFeedback === 'wrong' && (
        <div
          onClick={() => finishAnswer()}
          className="fixed inset-0 z-[1300] flex flex-col items-center justify-center select-none animate-backdrop-fade bg-black/45 backdrop-blur-xs cursor-pointer"
        >
          {/* Rotating Mystic Smoke / Coral Aura */}
          <div className="absolute w-[600px] sm:w-[850px] h-[600px] sm:h-[850px] rounded-full aura-wrong-spin opacity-90 -z-10 pointer-events-none" />

          {/* Outer Pulsing Coral / Amethyst Halo */}
          <div className="absolute w-[360px] sm:w-[520px] h-[360px] sm:h-[520px] rounded-full bg-gradient-to-r from-rose-500/40 via-orange-400/50 to-purple-500/40 blur-3xl aura-pulse-slow -z-10 pointer-events-none" />

          {/* Floating Cute Cartoon Particles (smoke, stars, drops) */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <span className="celebrate-star star-pos-1">💨</span>
            <span className="celebrate-star star-pos-2">⭐</span>
            <span className="celebrate-star star-pos-3">💫</span>
            <span className="celebrate-star star-pos-4">✨</span>
            <span className="celebrate-star star-pos-5">💨</span>
            <span className="celebrate-star star-pos-6">⭐</span>
            <span className="celebrate-star star-pos-7">💫</span>
            <span className="celebrate-star star-pos-8">✨</span>
          </div>

          {/* Grand Center "Tiếc quá!" Typography */}
          <div className="relative flex flex-col items-center justify-center animate-victory-pop pointer-events-none text-center px-4">
            {isUnlockChallenge && (
              <div className="text-5xl sm:text-7xl mb-1 select-none">
                🔒💨
              </div>
            )}
            <h1
              className="wrong-text font-[900] tracking-wider uppercase text-center select-none"
              style={{
                fontFamily: '"Baloo 2", sans-serif',
                textShadow: '-2px -2px 0 #ffffff, 2px -2px 0 #ffffff, -2px 2px 0 #ffffff, 2px 2px 0 #ffffff',
              }}
            >
              Tiếc quá!
            </h1>
            {isUnlockChallenge && (
              <div className="flex flex-col items-center gap-1.5 mt-3">
                <p className="px-6 py-2 rounded-full bg-amber-950/90 border-2 border-amber-400 text-amber-200 text-base sm:text-xl font-black drop-shadow-md">
                  Chưa giải cứu được ô số {(currentTileIndex ?? 0) + 1}! 🔒
                </p>
                <span className="text-xs sm:text-sm text-yellow-100/90 font-bold drop-shadow">
                  Ô tiếp tục bị khoá. Nhường cơ hội cho bạn khác ở lượt sau!
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FULLSCREEN IMAGE LIGHTBOX MODAL */}
      {isImageZoomed && currentQ?.imageUrl && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsImageZoomed(false);
          }}
          className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-8 animate-backdrop-fade select-none cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-[90vw] max-h-[88vh] rounded-2xl sm:rounded-3xl p-2.5 sm:p-3.5 bg-gradient-to-b from-[#fffbe8] to-[#f4e6c3] border-[5px] sm:border-[7px] border-[#7d3f13] shadow-[0_24px_50px_rgba(0,0,0,0.7),inset_0_0_0_2px_#ffe885] flex items-center justify-center animate-zoom-in cursor-default"
          >
            {/* Close Button at top right of image frame */}
            <button
              type="button"
              onClick={() => setIsImageZoomed(false)}
              className="absolute -top-3.5 -right-3.5 sm:-top-4 sm:-right-4 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-b from-rose-500 to-red-700 text-white border-2 sm:border-[3px] border-yellow-200 shadow-[0_6px_14px_rgba(0,0,0,0.45)] hover:scale-110 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center cursor-pointer font-black text-sm sm:text-base"
              title="Đóng phóng to (ESC)"
              aria-label="Đóng phóng to"
            >
              ✕
            </button>

            {/* Enlarged Image */}
            <img
              src={currentQ.imageUrl}
              alt="Question Illustration Zoomed"
              className="block w-auto h-auto max-w-[85vw] max-h-[82vh] object-contain rounded-xl sm:rounded-2xl drop-shadow-md"
            />
          </div>
        </div>
      )}

      {/* UNLOCK CHALLENGE ANNOUNCEMENT POPUP (manual confirm or close X) */}
      {showUnlockAnnouncement && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) closeQuestion();
          }}
          className="fixed inset-0 z-[1200] grid place-items-center bg-[#071f39]/70 backdrop-blur-[6px] p-4 animate-backdrop-fade"
        >
          <div className="relative w-full max-w-[620px] p-8 rounded-[38px] bg-gradient-to-b from-[#fff9dd] via-[#f7e6b2] to-[#ebd38e] border-[8px] border-[#ffd634] shadow-[0_12px_0_rgba(160,98,11,0.9),0_28px_45px_rgba(4,20,40,0.5)] text-center animate-victory-pop select-none flex flex-col items-center">
            
            {/* Close Button X at Top Right */}
            <button
              type="button"
              onClick={closeQuestion}
              className="absolute -top-3.5 -right-3.5 sm:-top-4 sm:-right-4 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-b from-rose-500 to-red-700 text-white border-2 sm:border-[3px] border-amber-200 shadow-[0_6px_14px_rgba(0,0,0,0.45)] hover:scale-110 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center cursor-pointer font-black text-base sm:text-lg"
              title="Đóng / Quay lại bàn cờ"
              aria-label="Đóng thông báo giải cứu"
            >
              ✕
            </button>

            {/* Animated Lock & Key Icons */}
            <div className="relative flex items-center justify-center gap-3 mb-2">
              <span className="text-5xl sm:text-6xl animate-bounce drop-shadow-md">🔒</span>
              <span className="text-5xl sm:text-6xl animate-pulse drop-shadow-md">🗝️</span>
            </div>

            {/* Title: THỬ THÁCH GIẢI CỨU Ô SỐ [X] */}
            <div
              className="text-[#5a2803] text-[28px] sm:text-[36px] font-[900] tracking-wider uppercase drop-shadow-sm leading-tight"
              style={{
                fontFamily: '"Baloo 2", sans-serif',
                textShadow: '-1.5px -1.5px 0 #fff8da, 1.5px -1.5px 0 #fff8da, -1.5px 1.5px 0 #fff8da, 1.5px 1.5px 0 #fff8da, 0 3px 0 #3b1700',
              }}
            >
              THỬ THÁCH GIẢI CỨU Ô SỐ {(currentTileIndex ?? 0) + 1}!
            </div>

            {/* Description */}
            <p className="mt-3 text-[#0d3468] text-base sm:text-xl font-bold max-w-[500px] leading-relaxed">
              Trả lời <span className="text-emerald-700 font-extrabold uppercase underline decoration-2">ĐÚNG</span> câu hỏi này để giải cứu ô số <span className="text-amber-800 font-black">{(currentTileIndex ?? 0) + 1}</span> trở lại bàn cờ!
            </p>

            {/* Jump Button */}
            <button
              type="button"
              onClick={proceedToUnlockQuestion}
              className="mt-6 px-8 py-3.5 rounded-full bg-gradient-to-b from-[#7bf568] via-[#3bdc24] to-[#1e9910] text-white text-lg sm:text-xl font-[900] shadow-[0_6px_0_#146a08] hover:brightness-110 active:translate-y-1 transition-all cursor-pointer flex items-center gap-2"
              style={{ fontFamily: '"Baloo 2", sans-serif' }}
            >
              <span>VÀO GIẢI CỨU NGAY</span>
              <span className="text-xl">➔</span>
            </button>
          </div>
        </div>
      )}

      {/* GOLDEN FLASH BURST BETWEEN RUMBLE AND CENTER REVEAL */}
      {showGoldenFlash && (
        <div className="fixed inset-0 z-[1600] pointer-events-none bg-amber-200/80 animate-flash-fade" />
      )}

      {/* CENTER SCREEN MASCOT REVEAL (5 SECONDS) */}
      {centerMascotReveal && (
        <div className="fixed inset-0 z-[1400] flex flex-col items-center justify-center select-none animate-backdrop-fade bg-black/60 backdrop-blur-sm pointer-events-none">
          {/* Rotating Sunburst Rays */}
          <div className="absolute w-[800px] sm:w-[1050px] h-[800px] sm:h-[1050px] rounded-full animate-beam-spin bg-[conic-gradient(from_0deg,#ffd700_0deg,transparent_15deg,#ffea75_30deg,transparent_45deg,#f59e0b_60deg,transparent_75deg,#ffd700_90deg,transparent_105deg,#ffea75_120deg,transparent_135deg,#f59e0b_150deg,transparent_165deg,#ffd700_180deg,transparent_195deg,#ffea75_210deg,transparent_225deg,#f59e0b_240deg,transparent_255deg,#ffd700_270deg,transparent_285deg,#ffea75_300deg,transparent_315deg,#f59e0b_330deg,transparent_345deg,#ffd700_360deg)] opacity-45 filter blur-xs -z-10" />

          {/* Expanding Radial Glow Halo */}
          <div className="absolute w-[500px] sm:w-[650px] h-[500px] sm:h-[650px] rounded-full bg-gradient-to-r from-amber-400/50 via-yellow-300/60 to-orange-400/50 blur-3xl animate-pulse -z-10" />

          {/* Sparkle Floating Stars around */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <span className="celebrate-star star-pos-1">✨</span>
            <span className="celebrate-star star-pos-2">⭐</span>
            <span className="celebrate-star star-pos-3">🌟</span>
            <span className="celebrate-star star-pos-4">✨</span>
            <span className="celebrate-star star-pos-5">⭐</span>
            <span className="celebrate-star star-pos-6">🌟</span>
            <span className="celebrate-star star-pos-7">✨</span>
            <span className="celebrate-star star-pos-8">⭐</span>
          </div>

          {/* Grand Center Mascot Display */}
          <div className="relative flex flex-col items-center justify-center animate-mascot-pop text-center px-4">
            {/* Top Banner Tag */}
            <div className="px-6 py-1.5 rounded-full bg-amber-950/90 border-2 border-yellow-300 text-yellow-300 text-base sm:text-xl font-black uppercase tracking-widest shadow-[0_4px_15px_rgba(255,215,0,0.6)] mb-3">
              🎉 MỞ KHÓA LINH VẬT VÒNG {currentRoundIndex + 1}! 🎉
            </div>

            {/* Mascot Card Frame */}
            <div className="relative w-[260px] sm:w-[320px] aspect-square rounded-[36px] p-4 bg-gradient-to-b from-[#fffbe8] via-[#faecc7] to-[#e8c98c] border-[7px] border-[#ffd634] shadow-[0_16px_38px_rgba(0,0,0,0.6),0_0_40px_rgba(255,215,0,0.85)] flex items-center justify-center">
              <img
                src={centerMascotReveal.imageUrl}
                alt={centerMascotReveal.name}
                className="w-full h-full object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.35)] rounded-2xl animate-mascot-float"
              />
              {/* Floating Mini Ribbon */}
              <div className="absolute -bottom-4 px-5 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-black text-sm sm:text-base border-2 border-white shadow-lg">
                {centerMascotReveal.tag}
              </div>
            </div>

            {/* Mascot Name Typography */}
            <h1
              className="mt-6 text-[38px] sm:text-[54px] font-[900] tracking-wider uppercase text-center select-none"
              style={{
                fontFamily: '"Baloo 2", sans-serif',
                color: '#fffef0',
                textShadow: '-2.5px -2.5px 0 #78350f, 2.5px -2.5px 0 #78350f, -2.5px 2.5px 0 #78350f, 2.5px 2.5px 0 #78350f, 0 6px 12px rgba(0,0,0,0.5)',
              }}
            >
              {centerMascotReveal.name}
            </h1>
            <p className="text-yellow-200 text-base sm:text-xl font-black drop-shadow-md">
              {centerMascotReveal.title} đã gia nhập bộ sưu tập của bạn! ⭐
            </p>
          </div>
        </div>
      )}

      {/* Round Cleared Overlay (Multi-Round Support) */}
      {showRoundCleared && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowRoundCleared(false);
          }}
          className="fixed inset-0 z-[100] grid place-items-center bg-[#071f39]/60 backdrop-blur-[6px] p-4"
        >
          <div
            className="w-full max-w-[620px] p-[28px_32px] rounded-[42px] bg-gradient-to-b from-[#fff9dc] to-[#f6ecbe] border-[8px] border-[#ffd634] shadow-[0_10px_0_rgba(180,112,11,0.8),0_26px_36px_rgba(6,28,56,0.38)] text-center animate-in zoom-in-95 duration-300"
          >
            <div
              className="text-[#ffcc34] text-[32px] sm:text-[40px] font-black tracking-wider uppercase text-shadow-md"
              style={{
                textShadow: '-2px -2px 0 #6e3406, 2px -2px 0 #6e3406, -2px 2px 0 #6e3406, 2px 2px 0 #6e3406, 0 4px 6px rgba(0,0,0,0.4)',
              }}
            >
              🎉 HOÀN THÀNH {currentRound.title}!
            </div>

            {/* Unlocked Mascot Display (Enlarged, Glowing, Transparent & No Border) */}
            {collectedMascots[currentRoundIndex] && (
              <div className="my-6 sm:my-8 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8">
                {/* Glowing Mascot Container */}
                <div className="relative flex items-center justify-center">
                  {/* Radiant Golden Glow Aura */}
                  <div className="absolute w-36 h-36 sm:w-48 sm:h-48 rounded-full bg-gradient-to-r from-amber-300/60 via-yellow-300/70 to-orange-400/50 blur-2xl animate-pulse pointer-events-none" />
                  
                  {/* Pure Transparent Glowing Mascot Image */}
                  <img
                    src={collectedMascots[currentRoundIndex].imageUrl}
                    alt={collectedMascots[currentRoundIndex].name}
                    className="relative w-32 h-32 sm:w-44 sm:h-44 object-contain filter drop-shadow-[0_8px_20px_rgba(245,158,11,0.75)] drop-shadow-[0_0_28px_rgba(255,215,0,0.9)] animate-mascot-float select-none"
                  />
                </div>

                {/* Typography (Enlarged & Prominent) */}
                <div className="text-center sm:text-left space-y-1.5 sm:space-y-2">
                  <div className="text-amber-800 text-xs sm:text-sm font-black uppercase tracking-wider bg-amber-500/15 px-3.5 py-1 rounded-full inline-block border border-amber-400/40">
                    ✨ LINH VẬT VỪA MỞ KHÓA ✨
                  </div>
                  <div
                    className="text-amber-950 text-3xl sm:text-[40px] font-black leading-tight tracking-wide"
                    style={{
                      fontFamily: '"Baloo 2", sans-serif',
                      textShadow: '0 2px 4px rgba(0,0,0,0.12)',
                    }}
                  >
                    {collectedMascots[currentRoundIndex].name}
                  </div>
                  <div className="text-amber-900 font-extrabold text-base sm:text-xl">
                    ⭐ {collectedMascots[currentRoundIndex].title}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-center gap-4 mt-6">
              <button
                type="button"
                onClick={handleNextRound}
                className="px-10 py-4 rounded-full bg-gradient-to-b from-[#7bf568] to-[#25a914] text-white text-[22px] font-black shadow-[0_6px_0_#146a08] hover:brightness-110 active:translate-y-1 transition-all cursor-pointer flex items-center gap-2"
              >
                <span>SANG VÒNG {currentRoundIndex + 2}</span>
                <span>➔</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Final Victory Finish Overlay */}
      {showFinish && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowFinish(false);
              resetGame();
            }
          }}
          className="fixed inset-0 z-[100] grid place-items-center bg-[#071f39]/70 backdrop-blur-[6px] p-4"
        >
          <div
            className="w-full max-w-[720px] p-[32px] rounded-[42px] bg-gradient-to-b from-[#fff9dc] via-[#fdf5cb] to-[#f6ecbe] border-[8px] border-[#19b6da] shadow-[0_12px_0_rgba(0,132,171,0.8),0_28px_45px_rgba(6,28,56,0.5)] text-center animate-in zoom-in-95 duration-300"
          >
            <div className="flex items-center justify-center gap-3">
              <img
                src="/games/mystery-treasure-grid-assets/assets/webp/treasure-chest.webp"
                alt="Rương kho báu"
                className="w-12 h-12 sm:w-16 sm:h-16 object-contain drop-shadow-md"
              />
              <div
                className="text-[#ffcc34] text-[38px] sm:text-[50px] font-black tracking-wider uppercase text-shadow-md"
                style={{
                  textShadow: '-2px -2px 0 #6e3406, 2px -2px 0 #6e3406, -2px 2px 0 #6e3406, 2px 2px 0 #6e3406, 0 4px 6px rgba(0,0,0,0.4)',
                }}
              >
                CHIẾN THẮNG
              </div>
              <img
                src="/games/mystery-treasure-grid-assets/assets/webp/treasure-chest.webp"
                alt="Rương kho báu"
                className="w-12 h-12 sm:w-16 sm:h-16 object-contain drop-shadow-md"
              />
            </div>
            <div className="mt-1 text-[#0c4b9f] font-bold text-[18px]">
              Chúc mừng bạn đã chinh phục toàn bộ kho báu hải tặc!
            </div>

            {/* SHOW ALL COLLECTED MASCOTS FROM ALL ROUNDS (Enlarged, Transparent, Glowing, No Gray Frame) */}
            <div className="my-6">
              <div className="text-amber-950 text-sm sm:text-base font-black uppercase tracking-wider mb-6 bg-amber-500/15 px-5 py-1.5 rounded-full inline-block border border-amber-400/40 shadow-xs">
                🌟 BỘ SƯU TẬP LINH VẬT CỦA BẠN ({collectedMascots.length} BẢO VẬT) 🌟
              </div>
              <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
                {collectedMascots.map((m, mIdx) => (
                  <div
                    key={m.id || mIdx}
                    className="group relative flex flex-col items-center animate-mascot-float cursor-pointer hover:scale-110 transition-transform"
                    style={{ animationDelay: `${mIdx * 0.2}s` }}
                    onClick={() => sounds.playMascotSqueak()}
                    title={`${m.name} - ${m.title}`}
                  >
                    {/* Glowing Mascot (Transparent, No background box, No border) */}
                    <div className="relative flex items-center justify-center">
                      {/* Radial Golden Glow Aura */}
                      <div className="absolute w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-r from-amber-300/50 via-yellow-300/60 to-orange-400/40 blur-xl animate-pulse pointer-events-none" />

                      <img
                        src={m.imageUrl}
                        alt={m.name}
                        className="relative w-24 h-24 sm:w-32 sm:h-32 object-contain filter drop-shadow-[0_8px_18px_rgba(245,158,11,0.7)] drop-shadow-[0_0_22px_rgba(255,215,0,0.85)] select-none"
                      />
                      <span className="absolute -top-1 -right-1 text-xl select-none filter drop-shadow">
                        ⭐
                      </span>
                    </div>

                    {/* Mascot Name & Title (Enlarged, Full Text) */}
                    <div className="mt-2 text-center">
                      <div className="text-base sm:text-lg font-black text-amber-950 drop-shadow-sm leading-tight">
                        {m.name}
                      </div>
                      <div className="text-xs sm:text-sm font-bold text-amber-900/80">
                        {m.title}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-7">
              <button
                type="button"
                onClick={resetGame}
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-b from-[#ffd95e] to-[#f3aa16] text-[#6b3604] text-[20px] font-black shadow-[0_6px_0_rgba(180,112,11,0.95)] hover:brightness-105 active:translate-y-1 transition-all cursor-pointer"
              >
                Chơi lại từ đầu
              </button>

              <Link
                href="/teacher?tab=my-quiz-games"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-slate-800 hover:bg-slate-900 text-white text-[18px] font-black shadow-[0_6px_0_#1e293b] active:translate-y-1 transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Quay về bài tập</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MysteryTreasureGridPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 w-screen h-screen bg-[#07243e] flex flex-col items-center justify-center gap-4 text-white select-none z-[200]">
          <div className="relative w-28 h-28 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-amber-400/20 border-t-amber-400 border-r-amber-300 animate-spin" />
            <div className="relative w-16 h-16 flex items-center justify-center z-10 animate-bounce">
              <img
                src="/games/mystery-treasure-grid-assets/assets/webp/treasure-chest.webp"
                alt="Treasure Chest"
                className="w-full h-full object-contain drop-shadow-[0_4px_14px_rgba(255,215,0,0.6)]"
              />
            </div>
          </div>
          <div className="text-center space-y-1">
            <h2 className="text-xl font-black uppercase tracking-widest text-amber-300 drop-shadow-md animate-pulse">
              Đang nạp bản đồ kho báu...
            </h2>
            <p className="text-xs text-slate-300 font-bold">Vui lòng chờ trong giây lát</p>
          </div>
        </div>
      }
    >
      <MysteryTreasureGridContent />
    </Suspense>
  );
}
