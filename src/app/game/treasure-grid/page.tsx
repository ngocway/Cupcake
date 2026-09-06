'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// 16 Sample English Questions for 4x4 Grid (100% English Content)
export interface QuestionData {
  id: string;
  questionText: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const QUESTIONS: QuestionData[] = [
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

export default function MysteryTreasureGridPage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);

  const [scale, setScale] = useState<number>(1);
  const [topOffset, setTopOffset] = useState<number>(0);
  const [solvedSet, setSolvedSet] = useState<Set<number>>(new Set());
  const [score, setScore] = useState<number>(0);
  const [timer, setTimer] = useState<number>(31);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [soundOn, setSoundOn] = useState<boolean>(true);
  const [currentTileIndex, setCurrentTileIndex] = useState<number | null>(null);
  const [pendingTileIndex, setPendingTileIndex] = useState<number | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [wrongTileIndexes, setWrongTileIndexes] = useState<Set<number>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [showFinish, setShowFinish] = useState<boolean>(false);
  const [chestAnim, setChestAnim] = useState<'idle' | 'celebrate' | 'mega'>('idle');
  const [particles, setParticles] = useState<Particle[]>([]);

  // Stage scaling
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

  // Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (isTimerRunning && timer === 0) {
      setIsTimerRunning(false);
      handleExpire();
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timer]);

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
    
    // 65 particles in 2 bursting waves (inner & outer)
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
        rot: `${(Math.random() * 480 - 240).toFixed(0)}deg`
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);
  };

  // Open Question Modal with 2s fireworks delay
  const openQuestion = (index: number) => {
    if (solvedSet.has(index) || pendingTileIndex !== null) return;
    setPendingTileIndex(index);
    triggerFireworkBurst(index);
    sounds.playFirework();

    setTimeout(() => {
      setPendingTileIndex(null);
      setCurrentTileIndex(index);
      setSelectedAnswer(null);
      setIsModalOpen(true);
      setTimer(31);
      setIsTimerRunning(true);
      sounds.playOpen();
    }, 2000);
  };

  // Close Modal
  const closeQuestion = () => {
    setIsModalOpen(false);
    setIsTimerRunning(false);
    setCurrentTileIndex(null);
    setSelectedAnswer(null);
  };

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
        rot: `${(Math.random() * 260 - 130).toFixed(0)}deg`
      });
    }
    // Score float particle
    newParticles.push({
      id: Date.now() + 99,
      type: 'score',
      x: cx - 20,
      y: cy - 10,
      text: '+10'
    });

    setParticles((prev) => [...prev, ...newParticles]);
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
        rot: `${(Math.random() * 120 - 60).toFixed(0)}deg`
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

  // Dynamic Grid Layout Math for 4 to 16 questions
  const gridLayout = useMemo(() => {
    const N = Math.min(16, Math.max(4, QUESTIONS.length));
    let cols = 4;
    if (N <= 4) cols = 2;
    else if (N <= 9) cols = 3;
    else cols = 4;

    const rows = Math.ceil(N / cols);
    const W_avail = 670;
    const H_avail = 570;

    const gap = Math.min(24, Math.max(14, Math.floor(100 / cols)));

    const maxW = Math.floor((W_avail - (cols - 1) * gap) / cols);
    const maxH = Math.floor((H_avail - (rows - 1) * gap) / rows);

    const tileW = Math.min(165, maxW);
    const tileH = Math.min(155, Math.floor(tileW * 0.95), maxH);

    const gridW = cols * tileW + (cols - 1) * gap;
    const gridH = rows * tileH + (rows - 1) * gap;

    const gridLeft = Math.floor(76 + (W_avail - gridW) / 2);
    const gridTop = Math.floor(115 + (H_avail - gridH) / 2);
    const fontSize = Math.min(68, Math.max(44, Math.floor(tileH * 0.48)));

    return { N, cols, rows, gap, tileW, tileH, gridW, gridH, gridLeft, gridTop, fontSize };
  }, [QUESTIONS.length]);

  // Choose Answer handler
  const handleChooseAnswer = (answerIndex: number) => {
    if (currentTileIndex === null || selectedAnswer !== null) return;
    setSelectedAnswer(answerIndex);

    const question = QUESTIONS[currentTileIndex];
    if (answerIndex === question.correctIndex) {
      // Correct!
      setIsTimerRunning(false);
      sounds.playCorrect();

      setTimeout(() => {
        const nextSolved = new Set(solvedSet).add(currentTileIndex);
        setSolvedSet(nextSolved);
        setScore((prev) => prev + 10);
        triggerBurstStars(currentTileIndex);

        // Chest bounce or mega celebration
        if (nextSolved.size === QUESTIONS.length) {
          setChestAnim('mega');
          sounds.playWin();
          setTimeout(() => setShowFinish(true), 1200);
        } else {
          setChestAnim('celebrate');
          setTimeout(() => setChestAnim('idle'), 820);
        }

        closeQuestion();
      }, 360);
    } else {
      // Wrong!
      setWrongTileIndexes((prev) => new Set(prev).add(currentTileIndex));
      triggerBurstX(currentTileIndex);
      sounds.playWrong();
    }
  };

  // Reset Game
  const resetGame = () => {
    setIsTimerRunning(false);
    setSolvedSet(new Set());
    setScore(0);
    setCurrentTileIndex(null);
    setSelectedAnswer(null);
    setTimer(31);
    setWrongTileIndexes(new Set());
    setIsModalOpen(false);
    setShowFinish(false);
    setChestAnim('idle');
    setParticles([]);
  };

  const formatTimerStr = (num: number) => `00:${String(num).padStart(2, '0')}`;

  const currentQ = currentTileIndex !== null ? QUESTIONS[currentTileIndex] : null;

  return (
    <div
      ref={shellRef}
      className="fixed inset-0 w-screen h-screen overflow-hidden flex justify-center items-start select-none"
      style={{
        background: "#0d5b8d url('/games/mystery-treasure-grid-assets/assets/webp/background-browser-wide.webp') center center / cover no-repeat fixed",
        fontFamily: '"Trebuchet MS", "Arial Rounded MT Bold", "Segoe UI", sans-serif'
      }}
    >
      <style jsx global>{`
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
        @keyframes staggeredItemPop {
          0% { opacity: 0; transform: translateY(36px) scale(0.82); }
          60% { opacity: 1; transform: translateY(-6px) scale(1.05); }
          85% { transform: translateY(2px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes sunburstRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
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
        @keyframes answerCorrect {
          0% { transform: scale(1); }
          45% { transform: scale(1.06); }
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
        .animate-backdrop-fade { animation: backdropFadeIn 300ms ease-out forwards; }
        .animate-modal-pop { animation: modalPopIn 2000ms cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .animate-stagger-1 { animation: staggeredItemPop 600ms cubic-bezier(0.175, 0.885, 0.32, 1.275) 2000ms both; }
        .animate-stagger-2 { animation: staggeredItemPop 600ms cubic-bezier(0.175, 0.885, 0.32, 1.275) 2400ms both; }
        .animate-stagger-3 { animation: staggeredItemPop 600ms cubic-bezier(0.175, 0.885, 0.32, 1.275) 2800ms both; }
        .animate-stagger-opt-0 { animation: staggeredItemPop 500ms cubic-bezier(0.175, 0.885, 0.32, 1.275) 3200ms both; }
        .animate-stagger-opt-1 { animation: staggeredItemPop 500ms cubic-bezier(0.175, 0.885, 0.32, 1.275) 3600ms both; }
        .animate-stagger-opt-2 { animation: staggeredItemPop 500ms cubic-bezier(0.175, 0.885, 0.32, 1.275) 4000ms both; }
        .animate-stagger-opt-3 { animation: staggeredItemPop 500ms cubic-bezier(0.175, 0.885, 0.32, 1.275) 4400ms both; }
        .animate-stagger-btn { animation: staggeredItemPop 500ms cubic-bezier(0.175, 0.885, 0.32, 1.275) 4700ms both; }
        .animate-sunburst { animation: sunburstRotate 20s linear infinite; }
        .animate-correct-pop { animation: correctPop 750ms cubic-bezier(.22,1,.36,1); }
        .animate-wrong-shake { animation: wrongShake 560ms ease; }
        .animate-chest-bounce { animation: chestBounce 800ms cubic-bezier(.22,1,.36,1); }
        .animate-chest-mega { animation: chestMega 1.8s ease; }
        .animate-slot-spark { animation: slotSpark 720ms ease; }
        .animate-answer-correct { animation: answerCorrect 720ms ease; }
        .particle-fly { animation: particleFly 850ms ease-out forwards; }
        .particle-score { animation: scoreFloat 900ms ease-out forwards; }

        /* Full Pack v1 CSS Styles */
        .treasure-modal-backdrop {
          position: fixed; inset: 0; z-index: 1000; display: grid; place-items: center;
          padding: 24px; background: rgba(7,26,43,.62);
          backdrop-filter: blur(8px) saturate(.78); -webkit-backdrop-filter: blur(8px) saturate(.78);
        }
        .treasure-modal {
          position: relative;
          width: min(1060px, 92vw, calc(86vh * 4 / 3));
          aspect-ratio: 4 / 3;
          isolation: isolate;
          filter: drop-shadow(0 28px 34px rgba(0,0,0,.34));
          animation: treasureModalIn 420ms cubic-bezier(.19,.9,.28,1.18) both;
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
          left: 14%; right: 14%; top: 22%; bottom: 15%;
          display: flex; flex-direction: column; align-items: center; justify-content: flex-start;
        }
        .treasure-question {
          width: 100%; margin: 0; padding: 0 2%; color: #123b77;
          font-size: clamp(20px, 2.5vw, 36px); line-height: 1.15; font-weight: 900;
          text-align: center; letter-spacing: -.02em;
          text-shadow: 0 2px 0 rgba(255,255,255,.78), 0 4px 7px rgba(111,69,21,.15);
          display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
        }
        .treasure-answers {
          width: 100%; margin-top: clamp(12px, 2.5%, 28px);
          display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: clamp(10px, 1.6vw, 20px) clamp(14px, 2vw, 24px);
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
          color: #153b73; font-size: clamp(20px, 2.3vw, 36px); line-height: 1; font-weight: 900;
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
          color: white; font-size: clamp(19px,2.2vw,34px); font-weight: 900;
          background: linear-gradient(#71ef72,#169d37); border: 3px solid #ffe56f;
          box-shadow: 0 3px 0 #08782a, 0 0 14px rgba(255,228,84,.8);
        }
        .treasure-answer.is-wrong { animation: wrongTreasure 520ms ease; filter: saturate(.85) drop-shadow(0 0 13px rgba(255,65,83,.8)); }
        .treasure-answer.is-wrong::after {
          content: "×"; position: absolute; right: 4.5%; top: 50%; transform: translateY(-50%);
          display: grid; place-items: center; width: 13%; aspect-ratio: 1; border-radius: 50%;
          color: white; font-size: clamp(20px,2.35vw,36px); font-weight: 900;
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
          0% { opacity: 0; transform: translateY(20px) scale(.88); }
          72% { opacity: 1; transform: translateY(-4px) scale(1.018); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes answerShine { from { transform: skewX(-18deg) translateX(-100%); } to { transform: skewX(-18deg) translateX(360%); } }
        @keyframes correctTreasure { 0% { transform: scale(1); } 28% { transform: scale(.96); } 62% { transform: scale(1.075); } 100% { transform: scale(1.025); } }
        @keyframes wrongTreasure { 0%,100% { transform: translateX(0) rotate(0); } 18% { transform: translateX(-9px) rotate(-1.2deg); } 36% { transform: translateX(8px) rotate(1deg); } 54% { transform: translateX(-6px) rotate(-.7deg); } 72% { transform: translateX(4px) rotate(.45deg); } }
        @keyframes twinkle { 0%,100% { opacity: .35; scale: .7; rotate: 0deg; } 50% { opacity: 1; scale: 1.2; rotate: 45deg; } }
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
          transformOrigin: 'top center'
        }}
      >
        {/* Left Side Decor */}
        <img src="/games/mystery-treasure-grid-assets/assets/png/parrot.png" alt="Parrot" className="absolute left-[-65px] top-[0px] w-[460px] z-[3]" />
        <img src="/games/mystery-treasure-grid-assets/assets/webp/sign-left.webp" alt="Sign Left" className="absolute left-[5px] top-[430px] w-[245px] z-[4]" />
        <img src="/games/mystery-treasure-grid-assets/assets/webp/barrel-gold.webp" alt="Barrel" className="absolute left-[0px] bottom-[10px] w-[175px] z-[5]" />

        {/* Left Panel Wrap (Grid of Tiles) */}
        <section className="absolute left-[230px] top-[90px] w-[840px] h-[740px] z-[2]">
          <img src="/games/mystery-treasure-grid-assets/assets/webp/panel-left.webp" alt="" className="absolute left-0 top-0 w-[840px] h-[740px]" />
          <img src="/games/mystery-treasure-grid-assets/assets/webp/question-ribbon.webp" alt="" className="absolute left-[46px] top-[12px] w-[615px] z-[4]" />

          {/* Counter Wrap */}
          <div className="absolute left-[592px] top-[20px] w-[217px] h-[72px] z-[5]">
            <img src="/games/mystery-treasure-grid-assets/assets/webp/counter-board-empty.webp" alt="" className="absolute inset-0 w-full h-full" />
            <div className="absolute inset-0 grid place-items-center text-[#ffe15c] text-[30px] font-black tracking-wider text-shadow-md">
              {solvedSet.size} / {QUESTIONS.length}
            </div>
          </div>

          {/* Dynamic Grid */}
          <div
            className="absolute grid z-[4]"
            style={{
              left: `${gridLayout.gridLeft}px`,
              top: `${gridLayout.gridTop}px`,
              gridTemplateColumns: `repeat(${gridLayout.cols}, minmax(0, 1fr))`,
              gap: `${gridLayout.gap}px`
            }}
          >
            {QUESTIONS.slice(0, 16).map((_, index) => {
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
                  style={{
                    width: `${gridLayout.tileW}px`,
                    height: `${gridLayout.tileH}px`
                  }}
                  className={`tile relative p-0 border-none bg-none cursor-pointer transition-all duration-180 group ${
                    isSolved
                      ? 'solved cursor-default drop-shadow-[0_0_14px_rgba(255,220,73,0.8)] animate-correct-pop'
                      : isPending
                      ? 'tile-pending-glow'
                      : 'hover-jelly-bounce'
                  } ${isWrong ? 'animate-wrong-shake' : ''}`}
                >
                  <img src={`/games/mystery-treasure-grid-assets/assets/webp/${tileColor}.webp`} alt="" className="absolute inset-0 w-full h-full" />
                  <span
                    className={`absolute inset-0 grid place-items-center font-black text-[#fff8da] text-shadow-lg transition-transform ${
                      isPending ? 'animate-number-pulse' : ''
                    }`}
                    style={{
                      fontSize: `${gridLayout.fontSize}px`,
                      WebkitTextStroke: '4px #76431c'
                    }}
                  >
                    {index + 1}
                  </span>
                  {/* Solved / Wrong Overlay */}
                  <span
                    className={`absolute inset-0 rounded-[24px] pointer-events-none transition-opacity duration-200 ${
                      isSolved
                        ? 'opacity-100 bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.3)_0%,transparent_45%),linear-gradient(180deg,rgba(126,241,125,0.15),rgba(255,212,71,0.25))] shadow-[inset_0_0_0_4px_rgba(255,233,114,0.65),0_0_24px_rgba(111,255,143,0.55)]'
                        : isWrong
                        ? 'opacity-100 bg-[linear-gradient(180deg,rgba(255,50,78,0.26),rgba(255,0,0,0.18))] shadow-[inset_0_0_0_4px_rgba(255,87,110,0.55),0_0_22px_rgba(255,96,96,0.42)]'
                        : 'opacity-0'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </section>

        {/* Right Panel Wrap (Chest & Code Slots) */}
        <section className="absolute left-[1090px] top-[213px] w-[427px] h-[494px] z-[2]">
          <img src="/games/mystery-treasure-grid-assets/assets/webp/panel-right.webp" alt="" className="absolute left-0 top-0 w-[427px] h-[494px]" />

          {/* Inner Panel Elements (Scaled down) */}
          <div className="absolute left-0 top-0 w-[427px] h-[494px] scale-[0.85] origin-center z-[3]">
            {/* Treasure Chest */}
            <div className="absolute left-[28px] top-[39px] w-[333px] z-[3]">
              <img
                src="/games/mystery-treasure-grid-assets/assets/webp/treasure-chest.webp"
                alt="Chest"
                className={`w-[333px] transition-transform duration-240 ${
                  chestAnim === 'celebrate' ? 'animate-chest-bounce' : chestAnim === 'mega' ? 'animate-chest-mega' : ''
                }`}
              />
            </div>

            <img src="/games/mystery-treasure-grid-assets/assets/webp/chest-nameplate.webp" alt="Nameplate" className="absolute left-[45px] top-[232px] w-[330px] z-[4]" />

            {/* Slot Grid (16 slots) */}
            <div className="absolute left-[22px] top-[336px] w-[384px] grid grid-cols-8 gap-x-[5px] gap-y-[7px] z-[4]">
              {Array.from({ length: 16 }).map((_, i) => {
                const isFilled = i < solvedSet.size;
                return (
                  <div
                    key={i}
                    className={`relative w-[43px] h-[43px] bg-[url('/games/mystery-treasure-grid-assets/assets/webp/progress-slot.webp')] bg-contain bg-center bg-no-repeat ${
                      isFilled ? 'after:scale-100 after:opacity-100 animate-slot-spark' : ''
                    } after:content-[''] after:absolute after:inset-[12px] after:rounded-full after:scale-25 after:opacity-0 after:bg-[radial-gradient(circle_at_35%_35%,#fff7af_0%,#ffd643_35%,#f4a012_100%)] after:shadow-[0_0_18px_rgba(255,217,74,0.82)] after:transition-all after:duration-220`}
                  />
                );
              })}
            </div>
          </div>
        </section>

        {/* Right Side Decor */}
        <img src="/games/mystery-treasure-grid-assets/assets/webp/sign-right.webp" alt="Sign Right" className="absolute right-[80px] bottom-[110px] w-[170px] z-[2]" />
        <img src="/games/mystery-treasure-grid-assets/assets/webp/crab.webp" alt="Crab" className="absolute right-[130px] bottom-[30px] w-[130px] z-[2]" />

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
                    '--rot': p.rot
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
                  '--rot': p.rot
                } as React.CSSProperties}
              />
            );
          })}
        </div>
      </div>

      {/* Question Modal (Full Pack v1 exact HTML + CSS) */}
      {isModalOpen && currentQ && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) closeQuestion();
          }}
          className="treasure-modal-backdrop animate-backdrop-fade"
        >
          <section className="treasure-modal" role="dialog" aria-modal="true">
            <img
              className="treasure-frame"
              src="/games/mystery-treasure-grid-assets/assets/treasure_modal_full_pack_v1/assets/png/tropical_treasure_map_ui_frame.png"
              alt=""
              draggable="false"
            />
            <img
              className="treasure-title-banner"
              src="/games/mystery-treasure-grid-assets/assets/treasure_modal_full_pack_v1/assets/png/treasure_question_pirate_banner.png"
              alt="Treasure Question"
              draggable="false"
            />

            <button onClick={closeQuestion} className="treasure-close" type="button" aria-label="Close question">
              <img
                src="/games/mystery-treasure-grid-assets/assets/treasure_modal_full_pack_v1/assets/png/tropical_rope_framed_close_button.png"
                alt=""
                draggable="false"
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
                    else stateClass = 'opacity-40 cursor-default';
                  }

                  const isVeryLong = opt.length > 35;
                  const isLong = opt.length > 20;
                  const fontSize = isVeryLong
                    ? 'clamp(12px, 1.25vw, 17px)'
                    : isLong
                    ? 'clamp(13px, 1.45vw, 20px)'
                    : 'clamp(17px, 2vw, 28px)';

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
      )}

      {/* Finish Overlay */}
      {showFinish && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowFinish(false);
          }}
          className="fixed inset-0 z-[100] grid place-items-center bg-[#071f39]/50 backdrop-blur-[4px]"
        >
          <div
            className="w-[640px] min-h-[360px] p-[28px_32px] rounded-[42px] bg-gradient-to-b from-[#fff9dc] to-[#f6ecbe] border-[8px] border-[#19b6da] shadow-[0_10px_0_rgba(0,132,171,0.8),0_26px_36px_rgba(6,28,56,0.38),inset_0_0_0_7px_rgba(255,255,255,0.46)] text-center"
            style={{ transform: `scale(${scale})` }}
          >
            <div
              className="text-[#ffcc34] text-[42px] font-black tracking-wider uppercase text-shadow-md"
              style={{ WebkitTextStroke: '3px #6e3406' }}
            >
              Treasure Complete!
            </div>
            <div className="mt-2 text-[#0c4b9f] font-black text-[24px]">You opened all 16 treasure tiles!</div>
            <div className="mt-6 text-[32px] text-[#0f408a] font-black">Final Score: {score} pts</div>

            <button
              onClick={resetGame}
              className="mt-6 min-w-[200px] px-8 py-4 rounded-full bg-gradient-to-b from-[#ffd95e] to-[#f3aa16] text-[#6b3604] text-[26px] font-black shadow-[0_6px_0_rgba(180,112,11,0.95),0_10px_18px_rgba(6,28,56,0.22),inset_0_2px_0_rgba(255,255,255,0.48)] hover:-translate-y-[3px] hover:brightness-105 active:translate-y-[1px]"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
