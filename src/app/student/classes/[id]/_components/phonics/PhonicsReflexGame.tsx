'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Volume2,
  ArrowLeft,
  Maximize,
  Minimize,
  Star,
  RotateCcw,
  Flame,
  Sparkles,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  PHONICS_DAY_1_DATA,
  PhonicsDayData,
  PhonicsWordItem,
} from '@/lib/phonics-45-days-units';
import {
  playPopSound,
  playCorrectSound,
  playWrongSound,
  playCheerSound,
  playSpokenText,
  triggerConfetti,
} from './PhonicsAudioEffects';
import { PhonicsWordIllustration } from './PhonicsWordIllustrations';
import { Particles } from '@/components/ui/particles';
import { Ripple } from '@/components/ui/ripple';
import { NumberTicker } from '@/components/ui/number-ticker';
import { ShineBorder } from '@/components/ui/shine-border';
import { CoolMode, type CoolParticleOptions } from '@/components/ui/cool-mode';

export interface PhonicsReflexGameProps {
  dayData?: PhonicsDayData;
  onComplete: (score: number, xp: number) => void;
  isAlreadyCompleted?: boolean;
  onClose?: () => void;
}

interface RoundData {
  targetWord: PhonicsWordItem;
  options: PhonicsWordItem[];
}

const SPEAKER_COOL_OPTIONS: CoolParticleOptions = {
  particles: ['🎵', '🎶', '✨', '🫧'],
  particleCount: 8,
  size: 20,
};

const BUBBLE_COOL_OPTIONS: CoolParticleOptions = {
  particles: ['🫧', '⭐', '✨', '🌟'],
  particleCount: 10,
  size: 22,
};

/**
 * Fisher-Yates array shuffle
 */
function shuffleArray<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Generates freshly shuffled rounds covering all words in the unit (min 5 rounds).
 */
function generateShuffledRounds(words: PhonicsWordItem[]): RoundData[] {
  const shuffledTargets = shuffleArray(words);
  const desiredCount = Math.max(words.length, Math.min(5, words.length * 2));
  const roundsList: PhonicsWordItem[] = [...shuffledTargets];
  while (roundsList.length < desiredCount && words.length > 0) {
    roundsList.push(...shuffleArray(words));
  }
  const finalTargets = roundsList.slice(0, desiredCount);

  return finalTargets.map((target) => {
    const distractors = shuffleArray(
      words.filter((w) => w.word !== target.word)
    ).slice(0, 2);
    const options = shuffleArray([target, ...distractors]);
    return { targetWord: target, options };
  });
}

function fireBubbleBurstConfetti(particleCount = 70) {
  try {
    confetti({
      particleCount,
      spread: 75,
      origin: { y: 0.62 },
      colors: ['#38bdf8', '#fbbf24', '#34d399', '#f472b6', '#a78bfa'],
      zIndex: 9999,
    });
  } catch {
    triggerConfetti();
  }
}

/**
 * Subtle iridescent soap-bubble tint variations per slot (neutral so none implies right/wrong)
 */
const BUBBLE_IRIDESCENCE = [
  {
    bg: 'radial-gradient(circle at 30% 26%, rgba(255,255,255,0.96) 0%, rgba(224,242,254,0.78) 45%, rgba(186,230,253,0.58) 78%, rgba(244,114,182,0.22) 100%)',
    shadow:
      'inset -10px -14px 26px rgba(56,189,248,0.32), inset 10px 12px 24px rgba(255,255,255,0.96), inset 0 0 18px rgba(244,114,182,0.18), 0 16px 34px rgba(14,165,233,0.18), 0 6px 0 rgba(125,211,252,0.65)',
    border: 'border-white/90',
  },
  {
    bg: 'radial-gradient(circle at 30% 26%, rgba(255,255,255,0.96) 0%, rgba(254,243,199,0.72) 44%, rgba(199,210,254,0.54) 78%, rgba(56,189,248,0.25) 100%)',
    shadow:
      'inset -10px -14px 26px rgba(129,140,248,0.28), inset 10px 12px 24px rgba(255,255,255,0.96), inset 0 0 18px rgba(251,191,36,0.2), 0 16px 34px rgba(99,102,241,0.15), 0 6px 0 rgba(165,180,252,0.6)',
    border: 'border-white/90',
  },
  {
    bg: 'radial-gradient(circle at 30% 26%, rgba(255,255,255,0.96) 0%, rgba(209,250,229,0.74) 44%, rgba(186,230,253,0.56) 78%, rgba(251,191,36,0.22) 100%)',
    shadow:
      'inset -10px -14px 26px rgba(16,185,129,0.26), inset 10px 12px 24px rgba(255,255,255,0.96), inset 0 0 18px rgba(56,189,248,0.2), 0 16px 34px rgba(16,185,129,0.16), 0 6px 0 rgba(110,231,183,0.6)',
    border: 'border-white/90',
  },
];

const AMBIENT_BUBBLES = [
  { size: 54, left: '7%', top: '20%', duration: 6.5, delay: 0 },
  { size: 34, left: '16%', top: '72%', duration: 5.4, delay: 1.1 },
  { size: 68, left: '88%', top: '22%', duration: 7.2, delay: 0.6 },
  { size: 40, left: '81%', top: '76%', duration: 5.8, delay: 1.7 },
  { size: 28, left: '28%', top: '16%', duration: 4.9, delay: 0.8 },
  { size: 32, left: '72%', top: '15%', duration: 5.5, delay: 1.4 },
];

export function PhonicsReflexGame({
  dayData = PHONICS_DAY_1_DATA,
  onComplete,
  onClose,
}: PhonicsReflexGameProps) {
  const words = dayData.words;
  const TOTAL_ROUNDS = Math.max(words.length, Math.min(5, words.length * 2));

  const [rounds, setRounds] = useState<RoundData[]>(() =>
    generateShuffledRounds(words)
  );
  const [gameSessionId, setGameSessionId] = useState(1);
  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [solvedWord, setSolvedWord] = useState<string | null>(null);
  const [wrongShakingWord, setWrongShakingWord] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const speakGenRef = useRef(0);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrongTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentRound = rounds[roundIndex] || rounds[0];

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

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      if (wrongTimerRef.current) clearTimeout(wrongTimerRef.current);
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

  const speakTargetWord = useCallback(async (wordText: string) => {
    const gen = ++speakGenRef.current;
    setIsSpeaking(true);
    try {
      await playSpokenText(wordText);
    } catch {
      // Ignore autoplay errors
    } finally {
      if (speakGenRef.current === gen) {
        setIsSpeaking(false);
      }
    }
  }, []);

  // Auto-play target word when each round starts
  useEffect(() => {
    if (isGameOver || !currentRound) return;
    const target = currentRound.targetWord.word;
    const timer = setTimeout(() => {
      void speakTargetWord(target);
    }, 340);

    return () => {
      clearTimeout(timer);
    };
  }, [roundIndex, gameSessionId, isGameOver, currentRound, speakTargetWord]);

  const handlePlayPrompt = () => {
    playPopSound();
    void speakTargetWord(currentRound.targetWord.word);
  };

  const handleSelectBubble = (item: PhonicsWordItem) => {
    if (solvedWord !== null) return;

    if (item.word === currentRound.targetWord.word) {
      // CORRECT! Pop open the reward illustration inside the bubble!
      if (wrongTimerRef.current) clearTimeout(wrongTimerRef.current);
      setWrongShakingWord(null);
      setSolvedWord(item.word);

      const earnedPoints = 20 + combo * 5;
      const nextScore = score + earnedPoints;

      playPopSound();
      playCorrectSound();
      setScore(nextScore);
      setCombo((prev) => prev + 1);
      fireBubbleBurstConfetti(55);

      // Hold 1.35s so the child enjoys the newly popped-out animal illustration!
      transitionTimerRef.current = setTimeout(() => {
        if (roundIndex + 1 < TOTAL_ROUNDS) {
          setRoundIndex((prev) => prev + 1);
          setSolvedWord(null);
        } else {
          setIsGameOver(true);
          playCheerSound();
          fireBubbleBurstConfetti(120);
          onComplete(nextScore, 20);
        }
      }, 1350);
    } else {
      // WRONG: playful wobble, reset combo, let child listen & tap again without timer stress
      setWrongShakingWord(item.word);
      playWrongSound();
      setCombo(0);

      if (wrongTimerRef.current) clearTimeout(wrongTimerRef.current);
      wrongTimerRef.current = setTimeout(() => {
        setWrongShakingWord(null);
      }, 620);
    }
  };

  const handleRestart = () => {
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    if (wrongTimerRef.current) clearTimeout(wrongTimerRef.current);
    speakGenRef.current += 1;
    setRounds(generateShuffledRounds(words));
    setGameSessionId((prev) => prev + 1);
    setRoundIndex(0);
    setScore(0);
    setCombo(0);
    setSolvedWord(null);
    setWrongShakingWord(null);
    setIsGameOver(false);
    playPopSound();
  };

  return (
    <div className="fixed inset-0 z-50 w-screen h-dvh overflow-hidden flex flex-col justify-between select-none font-sans bg-gradient-to-b from-[#c7edff] via-[#e5f7ff] to-[#fff6d6]">
      {/* Fredoka Display Typography */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700;900&display=swap');
        .font-fredoka {
          font-family: 'Fredoka', 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
      `}</style>

      {/* Soft Sunny Sky Pastel Clouds / Glow Blobs */}
      <div className="pointer-events-none absolute -top-28 -left-20 w-[420px] h-[420px] rounded-full bg-sky-300/35 blur-3xl" />
      <div className="pointer-events-none absolute top-12 -right-24 w-[440px] h-[440px] rounded-full bg-amber-200/45 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 left-1/3 w-[520px] h-80 rounded-full bg-cyan-200/40 blur-3xl" />

      {/* Decorative Floating Background Soap Bubbles */}
      {AMBIENT_BUBBLES.map((b, idx) => (
        <motion.div
          key={idx}
          animate={{ y: [0, -18, 0], x: [0, idx % 2 === 0 ? 6 : -6, 0] }}
          transition={{
            duration: b.duration,
            delay: b.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            width: b.size,
            height: b.size,
            left: b.left,
            top: b.top,
            background:
              'radial-gradient(circle at 30% 28%, rgba(255,255,255,0.85), rgba(186,230,253,0.35) 60%, rgba(244,114,182,0.15) 100%)',
            boxShadow:
              'inset -4px -5px 10px rgba(56,189,248,0.22), inset 4px 5px 10px rgba(255,255,255,0.85)',
          }}
          className="pointer-events-none absolute z-0 rounded-full border border-white/70 opacity-75"
        >
          <span className="absolute top-[18%] left-[22%] w-[26%] h-[14%] rounded-full bg-white/85 -rotate-30" />
        </motion.div>
      ))}

      {/* Magic UI Twinkling Sky & Sunny Particles */}
      <Particles
        className="absolute inset-0 z-0"
        quantity={45}
        staticity={45}
        ease={60}
        size={1.7}
        color="#0ea5e9"
      />
      <Particles
        className="absolute inset-0 z-0"
        quantity={35}
        staticity={50}
        ease={65}
        size={1.9}
        color="#f59e0b"
      />

      {/* ========================================================================= */}
      {/* 1. CLEAN FLOATING TOP HUD (Matches Station 1 & 2 Minimalist Chrome)       */}
      {/* ========================================================================= */}
      <header className="relative z-30 w-full px-2.5 py-2 sm:px-6 sm:py-3.5 flex items-center justify-between gap-1.5 sm:gap-2 bg-transparent flex-shrink-0">
        {/* Left: Back to Map */}
        <div className="flex-shrink-0">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-2xl bg-white/95 hover:bg-white text-slate-700 font-bold text-xs sm:text-sm flex items-center gap-1 sm:gap-1.5 border-2 border-sky-100 shadow-[0_3px_0_#bae6fd,0_6px_14px_rgba(14,165,233,0.12)] active:translate-y-[2px] active:shadow-[0_1px_0_#bae6fd] transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-sky-600" />
              <span className="hidden sm:inline">Quay lại Bản đồ</span>
              <span className="sm:hidden">Bản đồ</span>
            </button>
          )}
        </div>

        {/* Center: Round Progress + Animated Score Ticker + Combo Flame */}
        {!isGameOver && (
          <div className="min-w-0 flex flex-wrap items-center justify-center gap-1.5 sm:gap-3 font-fredoka">
            {/* Round Capsule */}
            <div className="px-2.5 py-1 sm:px-4 sm:py-1.5 rounded-full bg-white/90 backdrop-blur-md border-2 border-white shadow-[0_4px_14px_rgba(14,165,233,0.14)] flex items-center gap-1.5 sm:gap-2">
              <span className="text-sm sm:text-base leading-none">🫧</span>
              <span className="text-[11px] sm:text-sm font-black text-sky-800 tracking-wide whitespace-nowrap">
                {roundIndex + 1}/{TOTAL_ROUNDS}
              </span>
            </div>

            {/* Score Capsule with Magic UI NumberTicker */}
            <div className="px-2.5 py-1 sm:px-4 sm:py-1.5 rounded-full bg-gradient-to-b from-amber-50 to-amber-100/95 border-2 border-white shadow-[0_4px_14px_rgba(245,158,11,0.18)] flex items-center gap-1 sm:gap-1.5">
              <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-400 text-amber-500 flex-shrink-0" />
              {score === 0 ? (
                <span className="text-[11px] sm:text-sm font-black text-amber-800 tabular-nums">
                  0
                </span>
              ) : (
                <NumberTicker
                  key={gameSessionId}
                  value={score}
                  startValue={0}
                  className="text-[11px] sm:text-sm font-black text-amber-800 dark:text-amber-800 tracking-normal"
                />
              )}
              <span className="text-[10px] sm:text-xs font-extrabold text-amber-700">
                pts
              </span>
            </div>

            {/* Combo Flame Badge */}
            <AnimatePresence>
              {combo >= 2 && (
                <motion.div
                  key={combo}
                  initial={{ scale: 0.5, opacity: 0, y: 6 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.7, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                  className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500 text-white border-2 border-amber-200 shadow-[0_4px_12px_rgba(249,115,22,0.35)] flex items-center gap-1 whitespace-nowrap"
                >
                  <Flame className="w-3 h-3 sm:w-4 sm:h-4 fill-yellow-200 text-yellow-100" />
                  <span className="text-[11px] sm:text-sm font-black tracking-wide">
                    x{combo}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Right: Fullscreen Toggle */}
        <div className="flex-shrink-0">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-2xl bg-white/95 hover:bg-white text-slate-700 font-bold text-xs sm:text-sm flex items-center gap-1.5 border-2 border-sky-100 shadow-[0_3px_0_#bae6fd,0_6px_14px_rgba(14,165,233,0.12)] active:translate-y-[2px] active:shadow-[0_1px_0_#bae6fd] transition-all cursor-pointer"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? (
              <Minimize className="w-4 h-4 text-sky-600" />
            ) : (
              <Maximize className="w-4 h-4 text-sky-600" />
            )}
            <span className="hidden sm:inline">
              {isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
            </span>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. GAMEPLAY STAGE: RIPPLE SPEAKER ORB + 3 GIANT 3D SOAP BUBBLES           */}
      {/* ========================================================================= */}
      {!isGameOver ? (
        <main className="relative z-10 flex-1 w-full max-w-5xl mx-auto flex flex-col items-center justify-evenly px-3 sm:px-4 pb-3 sm:pb-4 min-h-0 overflow-y-auto overflow-x-hidden">
          {/* UPPER STAGE: 3D PUSHABLE SPEAKER MEDALLION + MAGIC UI SOUND-WAVE RIPPLE */}
          <div className="relative flex flex-col items-center justify-center py-1 sm:py-2">
            {/* Concentric Sound-Wave Ripple Container */}
            <div className="relative w-32 h-32 sm:w-52 sm:h-52 flex items-center justify-center">
              <Ripple
                mainCircleSize={106}
                circleGap={36}
                numCircles={4}
                mainCircleOpacity={isSpeaking ? 0.55 : 0.28}
                className="mask-none overflow-visible"
                circleClassName={
                  isSpeaking
                    ? 'border-2 border-amber-400/90 bg-amber-300/20 shadow-[0_0_20px_rgba(251,191,36,0.35)] [--duration:1.15s]'
                    : 'border-2 border-sky-400/60 bg-white/25 shadow-none [--duration:2.4s]'
                }
              />

              {/* Uiverse 3D Pushable Golden Speaker Orb */}
              <CoolMode options={SPEAKER_COOL_OPTIONS} className="relative z-10 inline-flex">
                <button
                  type="button"
                  onClick={handlePlayPrompt}
                  className="group/orb relative w-20 h-20 sm:w-28 sm:h-28 rounded-full cursor-pointer border-none bg-transparent p-0 outline-none"
                  title="Tap to listen again"
                >
                  {/* 3D Extruded Base */}
                  <span className="pointer-events-none absolute inset-0 translate-y-[6px] rounded-full bg-[#b45309] shadow-[0_12px_28px_rgba(245,158,11,0.45)]" />

                  {/* 3D Glossy Front Sphere */}
                  <span
                    className={`relative w-full h-full rounded-full bg-gradient-to-b from-[#fde047] via-[#fb923c] to-[#ea580c] border-4 border-white text-white flex items-center justify-center shadow-[inset_0_4px_8px_rgba(255,255,255,0.85),inset_0_-6px_12px_rgba(180,83,9,0.35)] transition-transform duration-100 -translate-y-[2px] group-hover/orb:-translate-y-[4px] group-active/orb:translate-y-[4px] ${
                      isSpeaking ? 'scale-108 ring-4 ring-amber-300/80' : ''
                    }`}
                  >
                    {/* Specular Dome Highlight */}
                    <span className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 w-14 sm:w-16 h-6 rounded-full bg-gradient-to-b from-white/75 to-transparent" />

                    <Volume2
                      className={`relative z-10 w-11 h-11 sm:w-13 sm:h-13 stroke-[2.6] drop-shadow-[0_2px_4px_rgba(154,52,18,0.45)] transition-transform ${
                        isSpeaking ? 'scale-115 animate-pulse' : 'group-hover/orb:scale-110'
                      }`}
                    />
                  </span>
                </button>
              </CoolMode>
            </div>

            {/* 100% English Visual Prompt Pill */}
            <button
              type="button"
              onClick={handlePlayPrompt}
              className="relative z-10 -mt-1 px-4 py-1 rounded-full bg-white/90 backdrop-blur-md border-2 border-amber-200/90 shadow-sm text-xs sm:text-sm font-black text-amber-800 tracking-wide font-fredoka flex items-center gap-1.5 hover:bg-white cursor-pointer transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Listen &amp; Tap!</span>
            </button>
          </div>

          {/* LOWER STAGE: 3 FLOATING 3D SOAP BUBBLES (Word First -> Pop Animal on Correct!) */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${gameSessionId}-${roundIndex}`}
              initial={{ opacity: 0, scale: 0.92, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -14 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              className="w-full flex flex-wrap items-center justify-center gap-3.5 sm:gap-8 md:gap-12 font-fredoka"
            >
              {currentRound.options.map((opt, idx) => {
                const isSolvedThis = solvedWord === opt.word;
                const isOtherDimmed = solvedWord !== null && !isSolvedThis;
                const isWrongThis = wrongShakingWord === opt.word;
                const bubbleStyle = BUBBLE_IRIDESCENCE[idx % BUBBLE_IRIDESCENCE.length];

                return (
                  <motion.div
                    key={opt.word}
                    animate={
                      isWrongThis
                        ? { x: [0, -12, 12, -9, 9, -4, 0], rotate: [0, -4, 4, -2, 0] }
                        : isSolvedThis
                        ? { scale: 1.12, y: -10 }
                        : isOtherDimmed
                        ? { scale: 0.86, opacity: 0.38 }
                        : { y: [0, -11, 0] }
                    }
                    transition={
                      isWrongThis
                        ? { duration: 0.5, ease: 'easeInOut' }
                        : isSolvedThis || isOtherDimmed
                        ? { type: 'spring', stiffness: 320, damping: 20 }
                        : {
                            duration: 3.1 + idx * 0.35,
                            delay: idx * 0.4,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }
                    }
                    className="relative flex items-center justify-center"
                  >
                    <CoolMode options={BUBBLE_COOL_OPTIONS} className="inline-flex">
                      <button
                        type="button"
                        onClick={() => handleSelectBubble(opt)}
                        disabled={solvedWord !== null}
                        style={{
                          background: isSolvedThis
                            ? 'radial-gradient(circle at 30% 25%, #ffffff 0%, #d1fae5 48%, #6ee7b7 85%, #34d399 100%)'
                            : isWrongThis
                            ? 'radial-gradient(circle at 30% 25%, #fff1f2 0%, #ffe4e6 55%, #fda4af 100%)'
                            : bubbleStyle.bg,
                          boxShadow: isSolvedThis
                            ? 'inset -10px -12px 24px rgba(16,185,129,0.32), inset 10px 12px 24px rgba(255,255,255,0.95), 0 18px 40px rgba(16,185,129,0.35), 0 6px 0 #10b981'
                            : isWrongThis
                            ? 'inset -8px -10px 20px rgba(244,63,94,0.28), inset 8px 10px 20px rgba(255,255,255,0.9), 0 12px 28px rgba(244,63,94,0.25), 0 5px 0 #fb7185'
                            : bubbleStyle.shadow,
                        }}
                        className={`group/bub relative w-32 h-32 sm:w-52 sm:h-52 md:w-60 md:h-60 rounded-full border-3 ${
                          isSolvedThis
                            ? 'border-emerald-300 ring-6 ring-emerald-300/50'
                            : isWrongThis
                            ? 'border-rose-300 ring-4 ring-rose-300/45'
                            : `${bubbleStyle.border} hover:scale-105 active:scale-95`
                        } flex flex-col items-center justify-center cursor-pointer transition-transform duration-150 outline-none overflow-visible`}
                      >
                        {/* Uiverse 3D Soap Bubble Specular Gloss Highlights */}
                        <span className="pointer-events-none absolute top-[13%] left-[18%] w-9 sm:w-12 h-4 sm:h-5.5 rounded-full bg-white/90 -rotate-32 blur-[0.4px]" />
                        <span className="pointer-events-none absolute top-[26%] left-[13%] w-2.5 sm:w-3.5 h-2.5 sm:h-3.5 rounded-full bg-white/85" />
                        <span className="pointer-events-none absolute bottom-[11%] right-[16%] w-10 sm:w-14 h-2.5 sm:h-3.5 rounded-full bg-white/45 -rotate-28 blur-[1px]" />

                        {/* CÁCH 1: Pop-out Animal Reward Illustration ONLY when answered correctly! */}
                        <AnimatePresence>
                          {isSolvedThis && (
                            <motion.div
                              initial={{ scale: 0.2, opacity: 0, y: 18 }}
                              animate={{ scale: 1, opacity: 1, y: 0 }}
                              transition={{
                                type: 'spring',
                                stiffness: 420,
                                damping: 16,
                              }}
                              className="relative z-10 w-18 h-18 sm:w-30 sm:h-30 md:w-34 md:h-34 flex items-center justify-center -mb-1 drop-shadow-[0_6px_12px_rgba(16,185,129,0.25)]"
                            >
                              <PhonicsWordIllustration
                                word={opt.word}
                                size={120}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* GIANT CLEAR COLOR-CODED WORD (Onset + Rime) */}
                        <span
                          className={`relative z-10 font-black tracking-wide leading-none transition-all duration-200 ${
                            isSolvedThis
                              ? 'text-2xl sm:text-4xl md:text-[2.6rem] mt-0.5'
                              : 'text-3xl sm:text-5xl md:text-[3.5rem] group-hover/bub:scale-108'
                          }`}
                        >
                          <span className="text-[#e11d48] drop-shadow-[0_2px_0_rgba(255,255,255,0.9)]">
                            {opt.onset}
                          </span>
                          <span
                            className={
                              isSolvedThis
                                ? 'text-[#047857] drop-shadow-[0_2px_0_rgba(255,255,255,0.9)]'
                                : 'text-[#0284c7] drop-shadow-[0_2px_0_rgba(255,255,255,0.9)]'
                            }
                          >
                            {opt.rime}
                          </span>
                        </span>
                      </button>
                    </CoolMode>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>

          {/* BOTTOM 7-BUBBLE PROGRESS TRAIL */}
          <div className="flex items-center justify-center gap-2 sm:gap-2.5 pt-1">
            {rounds.map((r, idx) => {
              const isPast = idx < roundIndex || (idx === roundIndex && solvedWord !== null);
              const isCurrent = idx === roundIndex && solvedWord === null;
              return (
                <div
                  key={`${r.targetWord.word}-${idx}`}
                  className={`rounded-full transition-all duration-300 flex items-center justify-center font-fredoka text-[11px] font-black ${
                    isPast
                      ? 'w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-b from-emerald-300 to-emerald-500 text-white border-2 border-white shadow-[0_3px_8px_rgba(16,185,129,0.3)]'
                      : isCurrent
                      ? 'w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-b from-amber-300 to-orange-400 text-white border-2 border-white shadow-[0_3px_10px_rgba(245,158,11,0.35)] scale-110'
                      : 'w-6 h-6 sm:w-7 sm:h-7 bg-white/75 text-sky-400 border-2 border-white/90 shadow-xs'
                  }`}
                >
                  {isPast ? '✓' : idx + 1}
                </div>
              );
            })}
          </div>
        </main>
      ) : (
        /* ========================================================================= */
        /* 3. VICTORY CELEBRATION SCREEN (+20 XP - Consistent with Stations 1 & 2)    */
        /* ========================================================================= */
        <main className="relative z-20 flex-1 w-full flex flex-col items-center justify-center px-4 py-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-md rounded-[34px] border-3 border-sky-200 p-6 sm:p-8 shadow-[0_10px_0_#7dd3fc,0_24px_50px_rgba(14,165,233,0.22)] flex flex-col items-center text-center animate-in zoom-in-95 font-fredoka overflow-hidden">
            <ShineBorder
              borderWidth={3}
              duration={12}
              shineColor={['#38BDF8', '#FBBF24', '#34D399']}
            />

            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-orange-500 text-white flex items-center justify-center text-4xl shadow-lg mb-4 animate-bounce border-3 border-white">
              🏆
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
              Phản Xạ Bong Bóng Siêu Đỉnh!
            </h3>
            <p className="text-sm sm:text-base text-slate-600 max-w-md mb-5 font-sans">
              Bé đã nghe và đập trúng trọn vẹn cả{' '}
              <strong>
                {TOTAL_ROUNDS}/{TOTAL_ROUNDS} bong bóng ({dayData.title})
              </strong>{' '}
              với tổng số điểm <strong>{score} pts</strong>!
            </p>

            <div className="flex items-center gap-2.5 bg-amber-50 px-5 py-2.5 rounded-2xl border-2 border-amber-200 mb-6">
              <Star className="w-6 h-6 fill-amber-400 text-amber-500" />
              <span className="font-black text-amber-700 text-lg">
                +20 XP &amp; Hoàn Thành Trạm 3
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleRestart}
                className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Chơi ván mới</span>
              </button>

              {onClose && (
                <CoolMode options={BUBBLE_COOL_OPTIONS} className="inline-flex">
                  <button
                    type="button"
                    onClick={onClose}
                    className="group/done relative inline-flex cursor-pointer border-none bg-transparent p-0 outline-none"
                  >
                    <span className="pointer-events-none absolute inset-0 translate-y-[4px] rounded-full bg-[#0369a1]" />
                    <span className="relative px-6 py-2.5 rounded-full bg-gradient-to-b from-[#38bdf8] via-[#0ea5e9] to-[#0284c7] border-2 border-[#bae6fd] text-white font-black text-sm shadow-[inset_0_2px_2px_rgba(255,255,255,0.55)] transition-transform duration-100 -translate-y-[1px] group-hover/done:-translate-y-[2px] group-active/done:translate-y-[3px]">
                      Trở về Bản đồ ➔
                    </span>
                  </button>
                </CoolMode>
              )}
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
