'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Volume2,
  Sparkles,
  RotateCcw,
  Star,
  ArrowLeft,
  Maximize,
  Minimize,
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
  playMagneticSnapSound,
  playToyBounceSound,
  playCorrectSound,
  playCheerSound,
  playWrongSound,
  playLetterPhoneme,
  playSpokenText,
  preloadJollyPhonicsAudio,
  triggerConfetti,
} from './PhonicsAudioEffects';
import { PhonicsWordIllustration } from './PhonicsWordIllustrations';
import { Dock, DockWaveItem } from '@/components/ui/dock';
import { Particles } from '@/components/ui/particles';
import { Ripple } from '@/components/ui/ripple';
import { AnimatedBeam } from '@/components/ui/animated-beam';
import { TextureCardStyled } from '@/components/ui/texture-card';

function fireSkyConfetti(particleCount = 55) {
  try {
    confetti({
      particleCount,
      spread: 78,
      origin: { y: 0.56 },
      colors: ['#38bdf8', '#fb7185', '#fbbf24', '#34d399', '#a78bfa'],
      zIndex: 9999,
    });
  } catch {
    triggerConfetti();
  }
}

export interface PhonicsBlendingLabProps {
  dayData?: PhonicsDayData;
  onComplete: (xp: number) => void;
  isAlreadyCompleted?: boolean;
  onClose?: () => void;
}

const VOWEL_IPA_MAP: Record<string, string> = {
  a: '/æ/',
  e: '/ɛ/',
  i: '/ɪ/',
  o: '/ɑː/',
  u: '/ʌ/',
};

/**
 * Keeps only the primary Vietnamese meaning before "/" and strips parenthetical notes
 * so the label stays short and matches the illustration cleanly.
 */
function formatShortMeaningVi(raw?: string): string {
  if (!raw) return '';
  return raw
    .split('/')[0]
    .replace(/\s*\([^)]*\)/g, '')
    .trim();
}

function splitWordForBubbles(wordItem: PhonicsWordItem, fallbackVowel: string) {
  const onset = (wordItem.onset || '').toLowerCase().trim();
  const rime = (wordItem.rime || '').toLowerCase().trim();
  const vowelIdx = rime.search(/[aeiou]/);

  if (vowelIdx >= 0) {
    const b1 = onset || wordItem.word.slice(0, 1).toLowerCase();
    const b2 = rime[vowelIdx];
    const b3 = rime.slice(vowelIdx + 1) || rime.slice(1) || '✨';
    const isB1Vowel = /^[aeiou]$/.test(b1);
    return {
      b1,
      b1Phoneme: b1,
      b1Label: isB1Vowel
        ? VOWEL_IPA_MAP[b1] || `/${b1}/`
        : `/${b1 === 'c' ? 'k' : b1}/`,
      b2,
      b2Phoneme: b2,
      b2Label: VOWEL_IPA_MAP[b2] || `/${b2}/`,
      b3,
      b3Phoneme: b3 === '✨' ? '' : b3,
      b3Label: b3 === '✨' ? '✨' : `/${b3}/`,
    };
  }

  // Edge cases where onset holds the vowel (e.g. "egg": onset='e', rime='gg', or "ox": onset='o', rime='x')
  const fb = (fallbackVowel || 'a').toLowerCase();
  const b1 = onset || fb;
  const b2 = rime.length >= 2 ? rime[0] : rime || fb;
  const b3 = rime.length >= 2 ? rime.slice(1) : '✨';
  return {
    b1,
    b1Phoneme: b1,
    b1Label: VOWEL_IPA_MAP[b1] || `/${b1}/`,
    b2,
    b2Phoneme: b2,
    b2Label: /^[aeiou]$/.test(b2) ? VOWEL_IPA_MAP[b2] || `/${b2}/` : `/${b2}/`,
    b3,
    b3Phoneme: b3 === '✨' ? '' : b3,
    b3Label: b3 === '✨' ? '✨' : `/${b3}/`,
  };
}

type BubbleTint = 'rose' | 'amber' | 'sky';

const BUBBLE_TINTS: Record<
  BubbleTint,
  {
    fill: string;
    border: string;
    glow: string;
    letterColor: string;
    pillActive: string;
  }
> = {
  rose: {
    fill: 'radial-gradient(circle at 28% 24%, rgba(255,255,255,0.96) 0%, rgba(254,205,211,0.9) 46%, rgba(251,113,133,0.88) 100%)',
    border: 'rgba(255, 255, 255, 0.95)',
    glow: '0 8px 22px rgba(244, 63, 94, 0.22), inset 0 4px 10px rgba(255, 255, 255, 0.95)',
    letterColor: 'text-[#be123c]',
    pillActive: 'bg-rose-500 text-white border-white ring-3 ring-rose-300/70',
  },
  amber: {
    fill: 'radial-gradient(circle at 28% 24%, rgba(255,255,255,0.96) 0%, rgba(254,240,138,0.9) 46%, rgba(251,191,36,0.88) 100%)',
    border: 'rgba(255, 255, 255, 0.95)',
    glow: '0 8px 22px rgba(245, 158, 11, 0.22), inset 0 4px 10px rgba(255, 255, 255, 0.95)',
    letterColor: 'text-[#b45309]',
    pillActive: 'bg-amber-400 text-amber-950 border-white ring-3 ring-amber-200/80',
  },
  sky: {
    fill: 'radial-gradient(circle at 28% 24%, rgba(255,255,255,0.96) 0%, rgba(186,230,253,0.9) 46%, rgba(56,189,248,0.88) 100%)',
    border: 'rgba(255, 255, 255, 0.95)',
    glow: '0 8px 22px rgba(14, 165, 233, 0.22), inset 0 4px 10px rgba(255, 255, 255, 0.95)',
    letterColor: 'text-[#0369a1]',
    pillActive: 'bg-sky-500 text-white border-white ring-3 ring-sky-300/70',
  },
};

/**
 * 2D GLOSSY WATER BUBBLE LETTER COMPONENT
 * Clean 2D translucent water bubble with flat vector highlights, squash-and-stretch bounce,
 * water Ripple ring when sounding out, and CoolMode droplet splashes on tap.
 */
interface WaterBubbleLetterProps {
  letter: string;
  phonemeLabel: string;
  tint: BubbleTint;
  isActiveStep: boolean;
  isFusing: boolean;
  floatDelay: number;
  bubbleRef?: React.RefObject<HTMLDivElement | null>;
  onClick: () => void;
  disabled?: boolean;
}

const WaterBubbleLetter = React.memo(function WaterBubbleLetter({
  letter,
  phonemeLabel,
  tint,
  isActiveStep,
  isFusing,
  isIdleFloating,
  floatDelay,
  bubbleRef,
  onClick,
  disabled = false,
}: WaterBubbleLetterProps & { isIdleFloating: boolean }) {
  const palette = BUBBLE_TINTS[tint];

  return (
    <div className="relative flex flex-col items-center select-none font-fredoka z-10">
      <motion.button
        type="button"
          onClick={onClick}
          disabled={disabled}
          animate={
            isFusing
              ? { y: 0, scale: 0.9 }
              : isActiveStep
                ? { y: -14, scale: 1.12 }
                : isIdleFloating
                  ? { y: [0, -5, 0], scale: 1 }
                  : { y: 0, scale: 1 }
          }
          transition={
            isFusing
              ? { duration: 0.28, ease: [0.22, 1, 0.36, 1] }
              : isActiveStep
                ? { type: 'spring', stiffness: 360, damping: 18 }
                : isIdleFloating
                  ? {
                    duration: 3.1 + floatDelay,
                    delay: floatDelay,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }
                  : { duration: 0.24, ease: 'easeOut' }
          }
          whileHover={isFusing ? undefined : { scale: 1.07 }}
          whileTap={isFusing ? undefined : { scale: 0.93 }}
          className="relative cursor-pointer border-none bg-transparent p-0 outline-none disabled:cursor-default will-change-transform"
        >
          {/* Water Ripple Aura when speaking phoneme (lightweight, 2 rings, no shadow) */}
          {isActiveStep && !isFusing && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <Ripple
                mainCircleSize={100}
                circleGap={28}
                numCircles={2}
                mainCircleOpacity={0.48}
                className="mask-none overflow-visible"
                circleClassName="border-2 border-white/90 bg-white/20 shadow-none [--duration:1.1s] will-change-transform"
              />
            </div>
          )}

          {/* Crisp 2D Glass Water Shell (pure GPU gradient, zero backdrop-blur) */}
          <div
            ref={bubbleRef}
            style={{
              background: palette.fill,
              borderColor: palette.border,
              boxShadow: palette.glow,
            }}
            className={`relative w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full border-[3px] flex items-center justify-center transition-[border-color] duration-200 ${isActiveStep ? 'ring-4 ring-white/90' : ''
              } ${isFusing ? 'border-white/60' : ''}`}
          >
            {/* 2D Flat Water Highlight Arc & Dot */}
            <svg
              viewBox="0 0 100 100"
              className="pointer-events-none absolute inset-0 w-full h-full"
            >
              <path
                d="M 24 40 A 30 30 0 0 1 48 18"
                fill="none"
                stroke="rgba(255,255,255,0.9)"
                strokeWidth="5.5"
                strokeLinecap="round"
              />
              <circle cx="22" cy="51" r="3.5" fill="rgba(255,255,255,0.85)" />
              <path
                d="M 58 82 A 28 28 0 0 0 80 62"
                fill="none"
                stroke="rgba(255,255,255,0.45)"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </svg>

            {/* Bold Crisp Letter (never distorted by Gooey blur) */}
            <span
              className={`relative z-10 font-black leading-none tracking-tight ${
                letter.length >= 3
                  ? 'text-3xl sm:text-5xl'
                  : letter.length === 2
                    ? 'text-4xl sm:text-5xl'
                    : 'text-4xl sm:text-6xl'
              } ${palette.letterColor}`}
              style={{
                textShadow: '0 2px 0 rgba(255, 255, 255, 0.92)',
              }}
            >
              {letter}
            </span>
          </div>
        </motion.button>

      {/* Phoneme Pill Below Bubble (fades out gently as bubbles approach & fuse) */}
      <motion.button
        type="button"
        onClick={onClick}
        disabled={disabled}
        animate={{
          opacity: isFusing ? 0 : 1,
          scale: isFusing ? 0.8 : isActiveStep ? 1.1 : 1,
        }}
        transition={{ duration: 0.22 }}
        className={`mt-2.5 px-3.5 py-0.5 sm:px-4 sm:py-1 rounded-full text-xs sm:text-sm font-black cursor-pointer border-2 shadow-sm ${isActiveStep
          ? palette.pillActive
          : 'bg-white/90 text-slate-700 border-white hover:bg-white hover:scale-105'
          }`}
        title={`Listen: ${phonemeLabel}`}
      >
        {phonemeLabel}
      </motion.button>
    </div>
  );
});

/**
 * Progressive Pastel Rainbow Arc Across the Sky (1/7 -> 7/7)
 */
const ProgressiveSkyRainbow = React.memo(function ProgressiveSkyRainbow({
  progressRatio,
}: {
  progressRatio: number;
}) {
  const bands = [
    { r: 440, color: '#fb7185' },
    { r: 422, color: '#fb923c' },
    { r: 404, color: '#fde047' },
    { r: 386, color: '#4ade80' },
    { r: 368, color: '#38bdf8' },
    { r: 350, color: '#a78bfa' },
  ];

  // Keep a faint guide at 0%, then draw smoothly up to 100% at 7/7
  const reveal = Math.max(0, Math.min(1, progressRatio));

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[16%] flex items-end justify-center overflow-hidden z-0">
      <svg
        viewBox="0 0 1000 500"
        className="w-[1000px] max-w-[96vw] h-auto opacity-85"
      >
        {bands.map((b) => {
          const arcLen = Math.PI * b.r;
          const dashOffset = arcLen * (1 - reveal);
          return (
            <g key={b.r}>
              {/* Faint sky guide arc */}
              <path
                d={`M ${500 - b.r} 480 A ${b.r} ${b.r} 0 0 1 ${500 + b.r} 480`}
                fill="none"
                stroke="rgba(255,255,255,0.16)"
                strokeWidth="16"
                strokeLinecap="round"
              />
              {/* Progressive glowing rainbow band */}
              {reveal > 0 && (
                <path
                  d={`M ${500 - b.r} 480 A ${b.r} ${b.r} 0 0 1 ${500 + b.r} 480`}
                  fill="none"
                  stroke={b.color}
                  strokeWidth="15"
                  strokeOpacity={reveal >= 1 ? 0.65 : 0.48}
                  strokeLinecap="round"
                  strokeDasharray={arcLen}
                  strokeDashoffset={dashOffset}
                  style={{
                    transition: 'stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1)',
                  }}
                />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
});

/**
 * Clean 2D Vector Fluffy Sky Cloud
 */
function FluffyCloud({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 90" fill="none" className={className}>
      <path
        d="M36 74 H164 C179 74 190 63 190 49 C190 36 180 26 167 25 C161 11 146 2 130 4 C118 -2 101 0 92 10 C82 3 66 5 57 15 C46 13 34 20 30 31 C17 33 8 43 8 55 C8 66 19 74 36 74 Z"
        fill="rgba(255,255,255,0.88)"
      />
    </svg>
  );
}

const SkyBackdrop = React.memo(function SkyBackdrop() {
  return (
    <>
      {/* Warm Morning Sun Glow at Top Right (smaller GPU-friendly radial gradient instead of blur-3xl) */}
      <div
        className="pointer-events-none absolute -top-20 -right-16 w-[320px] h-[320px] rounded-full z-0"
        style={{
          background:
            'radial-gradient(circle, rgba(254,240,138,0.65) 0%, rgba(253,230,138,0.22) 45%, transparent 72%)',
        }}
      />

      {/* Soft Floating 2D Vector Clouds */}
      <motion.div
        animate={{ x: [0, 24, 0], y: [0, -5, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute top-14 left-[5%] w-40 sm:w-52 opacity-90 z-0 will-change-transform"
      >
        <FluffyCloud />
      </motion.div>
      <motion.div
        animate={{ x: [0, -22, 0], y: [0, 6, 0] }}
        transition={{ duration: 17, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute top-20 right-[6%] w-44 sm:w-56 opacity-85 z-0 will-change-transform"
      >
        <FluffyCloud />
      </motion.div>
      <motion.div
        animate={{ x: [0, 16, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute bottom-8 left-[10%] w-32 sm:w-44 opacity-70 z-0 will-change-transform"
      >
        <FluffyCloud />
      </motion.div>
      <motion.div
        animate={{ x: [0, -16, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute bottom-12 right-[10%] w-36 sm:w-48 opacity-75 z-0 will-change-transform"
      >
        <FluffyCloud />
      </motion.div>

      {/* Magic UI Twinkling Sky Particles (reduced count + ref-tracked mouse) */}
      <Particles
        className="pointer-events-none absolute inset-0 z-0"
        quantity={22}
        staticity={48}
        ease={60}
        size={1.8}
        color="#ffffff"
      />
    </>
  );
});

interface BottomWordDockProps {
  words: PhonicsWordItem[];
  activeWordWord: string;
  blendedWords: Set<string>;
  hintKeyIndex: number | null;
  hasEntryCountdown: boolean;
  isSequenceRunning: boolean;
  onSelectWord: (item: PhonicsWordItem, idx: number) => void;
}

const BottomWordDock = React.memo(function BottomWordDock({
  words,
  activeWordWord,
  blendedWords,
  hintKeyIndex,
  hasEntryCountdown,
  isSequenceRunning,
  onSelectWord,
}: BottomWordDockProps) {
  return (
    <footer className="relative z-30 w-full min-h-[84px] sm:h-[104px] flex-shrink-0 overflow-visible bg-white/90 rounded-t-[26px] sm:rounded-t-[32px] border-t-2 border-white shadow-[0_-8px_24px_rgba(2,132,199,0.12)] px-2 sm:px-8 py-1.5 sm:py-0 flex items-center justify-center">
      <Dock
        iconDistance={150}
        direction="bottom"
        disableMagnification={isSequenceRunning}
        className={`w-full max-w-4xl h-auto bg-white/85 border-2 border-white shadow-[inset_0_2px_6px_rgba(255,255,255,0.95),0_6px_20px_rgba(2,132,199,0.1)] rounded-[22px] sm:rounded-[28px] px-2.5 pt-3 pb-2.5 sm:px-4 sm:pt-2.5 sm:pb-3.5 flex sm:grid overflow-x-auto sm:overflow-visible no-scrollbar ${({
          3: 'sm:grid-cols-3',
          4: 'sm:grid-cols-4',
          5: 'sm:grid-cols-5',
          6: 'sm:grid-cols-6',
          7: 'sm:grid-cols-7',
        } as Record<number, string>)[words.length] || 'sm:grid-cols-7'
          } gap-2 sm:gap-3.5 items-center font-fredoka`}
      >
        {words.map((item, idx) => {
          const isSelected = activeWordWord === item.word;
          const isLearned = blendedWords.has(item.word);
          const isHintedNextKey =
            idx === hintKeyIndex && !isSelected && !isLearned && !hasEntryCountdown;

          const edgeColorClass = isSelected
            ? 'bg-gradient-to-r from-[#881337] via-[#be123c] to-[#881337]'
            : isLearned
              ? 'bg-gradient-to-r from-[#047857] via-[#059669] to-[#047857]'
              : 'bg-gradient-to-r from-[#0369a1] via-[#0284c7] to-[#0369a1]';

          const frontSurfaceClass = isSelected
            ? 'bg-gradient-to-b from-[#ff6b8b] via-[#f43f5e] to-[#e11d48] border-2 border-[#ffe4e6] text-white -translate-y-[4px] group-hover:-translate-y-[5px] shadow-[inset_0_3px_2px_rgba(255,255,255,0.55),inset_0_-3px_4px_rgba(136,19,55,0.28),0_0_16px_rgba(244,63,94,0.4)]'
            : isLearned
              ? 'bg-gradient-to-b from-[#f0fdf4] via-[#bbf7d0] to-[#6ee7b7] border-2 border-white text-[#064e3b] -translate-y-[1px] group-hover:-translate-y-[3px] shadow-[inset_0_3px_2px_rgba(255,255,255,0.95),inset_0_-3px_4px_rgba(5,150,105,0.18)]'
              : `bg-gradient-to-b from-[#ffffff] via-[#f0f9ff] to-[#bae6fd] border-2 border-[#7dd3fc] text-[#0c4a6e] -translate-y-[1px] group-hover:-translate-y-[3px] shadow-[inset_0_3px_2px_rgba(255,255,255,0.95),inset_0_-3px_4px_rgba(2,132,199,0.18)] ${isHintedNextKey ? 'ring-3 ring-amber-300 shadow-[0_0_18px_rgba(251,191,36,0.7)] animate-pulse' : ''
              }`;

          const formulaBadgeClass = isSelected
            ? 'bg-black/20 text-white border border-white/25'
            : isLearned
              ? 'bg-[#065f46]/12 text-[#064e3b]'
              : 'bg-[#0284c7]/12 text-[#0369a1]';

          return (
            <DockWaveItem
              key={item.word}
              maxScale={1.16}
              maxLift={10}
              disableMagnification={isSequenceRunning}
              className="flex-1 min-w-[68px] sm:min-w-0 sm:w-full hover:z-30"
            >
              <button
                type="button"
                onClick={() => onSelectWord(item, idx)}
                  disabled={isSequenceRunning}
                  className="group relative w-full cursor-pointer select-none border-none bg-transparent p-0 outline-none disabled:cursor-not-allowed"
                >
                  <span className="pointer-events-none absolute inset-0 translate-y-[7px] rounded-2xl sm:rounded-[20px] bg-slate-900/18 blur-[3px] transition-transform duration-150 ease-out group-hover:translate-y-[9px] group-active:translate-y-[3px]" />

                  <span
                    className={`pointer-events-none absolute inset-0 translate-y-[5px] rounded-2xl sm:rounded-[20px] transition-colors duration-200 ${edgeColorClass}`}
                  />

                  <span
                    className={`relative flex w-full flex-col items-center justify-center rounded-2xl sm:rounded-[20px] py-1.5 px-1 sm:py-2 sm:px-2 transition-transform duration-100 ease-out group-active:translate-y-[4px] ${frontSurfaceClass}`}
                  >
                    <span className="pointer-events-none absolute inset-x-2 top-1 h-[38%] rounded-t-xl bg-gradient-to-b from-white/65 via-white/20 to-transparent" />

                    {(isSelected || isLearned) && (
                      <span
                        className={`absolute -top-2 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shadow-md ring-2 ring-white z-20 ${isSelected
                          ? 'bg-gradient-to-b from-amber-300 to-amber-500 text-amber-950'
                          : 'bg-gradient-to-b from-emerald-400 to-emerald-600 text-white'
                          }`}
                      >
                        {isSelected ? '★' : '✓'}
                      </span>
                    )}

                    <span
                      className={`relative z-10 text-2xl sm:text-3xl md:text-[34px] font-black leading-none mb-1 ${isSelected
                        ? 'text-white drop-shadow-[0_2px_2px_rgba(136,19,55,0.55)]'
                        : 'drop-shadow-[0_1px_0_rgba(255,255,255,0.9)]'
                        }`}
                    >
                      {item.onset}
                    </span>

                    <span
                      className={`relative z-10 rounded-full px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[11px] font-bold leading-none tracking-tight whitespace-nowrap ${formulaBadgeClass}`}
                    >
                      -{item.rime} ➔ <strong className="font-black">{item.word}</strong>
                    </span>
                  </span>
                </button>
            </DockWaveItem>
          );
        })}
      </Dock>
    </footer>
  );
});

export function PhonicsBlendingLab({
  dayData = PHONICS_DAY_1_DATA,
  onComplete,
  isAlreadyCompleted = false,
  onClose,
}: PhonicsBlendingLabProps) {
  const words = dayData.words;
  const rime = dayData.rime;

  const [activeWordIndex, setActiveWordIndex] = useState<number>(0);
  const activeWord = words[activeWordIndex] ?? words[0];
  const activeBubbles = splitWordForBubbles(activeWord, dayData.vowel);
  const shortMeaningVi = formatShortMeaningVi(activeWord?.meaningVi);
  const [blendedWords, setBlendedWords] = useState<Set<string>>(() => new Set());
  const blendedWordsRef = useRef<Set<string>>(new Set());
  const hasCompletedOnceRef = useRef<boolean>(Boolean(isAlreadyCompleted));
  const completionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mergeTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // 5-second Game Ready Countdown (runs ONLY ONCE on initial station entry)
  const [entryCountdown, setEntryCountdown] = useState<number | null>(5);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownCancelledRef = useRef<boolean>(false);

  // Smart Next-Key Hint (highlights next unexplored key after 2s idle)
  const [hintKeyIndex, setHintKeyIndex] = useState<number | null>(null);

  // Unified 2-phase merge state (1 continuous GPU timeline, zero mid-flight React re-renders)
  const [activeCardStep, setActiveCardStep] = useState<1 | 2 | 3 | 'blended' | null>(null);
  const [mergePhase, setMergePhase] = useState<'split' | 'merged'>('split');
  const [isCompactViewport, setIsCompactViewport] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isAnimalBouncing, setIsAnimalBouncing] = useState(false);
  const [isSequenceRunning, setIsSequenceRunning] = useState(false);
  const isSequenceRunningRef = useRef<boolean>(false);
  const runBlendingSequenceRef = useRef<
    (wordItem: PhonicsWordItem, wordIdx: number, preReadDelayMs?: number) => Promise<void>
  >(async () => { });

  // Refs for Magic UI AnimatedBeam between the 3 water bubbles
  const bubblesStageRef = useRef<HTMLDivElement>(null);
  const bubble1Ref = useRef<HTMLDivElement>(null);
  const bubble2Ref = useRef<HTMLDivElement>(null);
  const bubble3Ref = useRef<HTMLDivElement>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mode, setMode] = useState<'explore' | 'challenge' | 'completed'>('explore');
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [selectedOnsetChoice, setSelectedOnsetChoice] = useState<string | null>(null);
  const [isChallengeAnswerCorrect, setIsChallengeAnswerCorrect] = useState<boolean | null>(null);

  const challengeItems = useRef(
    (() => {
      const candidateIndices = Array.from(
        new Set([
          Math.min(1, words.length - 1),
          Math.min(3, words.length - 1),
          Math.min(4, words.length - 1),
        ])
      );
      const fallbackPool = ['b', 'c', 'f', 'h', 'm', 'r', 's', 't', 'p', 'd', 'n', 'g'];
      const onsetPool = Array.from(
        new Set([...words.map((w) => w.onset), ...fallbackPool])
      );
      return candidateIndices.map((idx, i) => {
        const w = words[idx] ?? words[0];
        const distractors = onsetPool
          .filter((o) => o && o !== w.onset)
          .slice(i, i + 2);
        const options = [w.onset, ...distractors];
        return { word: w, options, target: w.onset };
      });
    })()
  ).current;

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // Track compact viewport
  useEffect(() => {
    const updateViewport = () => {
      setIsCompactViewport(window.innerWidth < 640);
    };
    updateViewport();
    window.addEventListener('resize', updateViewport, { passive: true });
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  const cancelEntryCountdown = useCallback(() => {
    countdownCancelledRef.current = true;
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setEntryCountdown(null);
  }, []);

  // Preload Jolly Phonics audio + Run 5-second Game Ready Countdown ONCE on entry
  useEffect(() => {
    const uniquePhonemes = Array.from(
      new Set(
        words.flatMap((w) => {
          const b = splitWordForBubbles(w, dayData.vowel);
          return [b.b1Phoneme, b.b2Phoneme, b.b3Phoneme].filter(Boolean);
        })
      )
    );
    preloadJollyPhonicsAudio(
      uniquePhonemes,
      words.map((w) => w.word)
    );
    countdownCancelledRef.current = false;
    setEntryCountdown(5);

    let remaining = 5;
    countdownIntervalRef.current = setInterval(() => {
      if (countdownCancelledRef.current) return;
      remaining -= 1;

      if (remaining > 0) {
        playPopSound();
        setEntryCountdown(remaining);
      } else {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        countdownCancelledRef.current = true;
        setEntryCountdown(null);
        void runBlendingSequenceRef.current(words[0], 0, 500);
      }
    }, 1000);

    return () => {
      countdownCancelledRef.current = true;
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      if (completionTimerRef.current) {
        clearTimeout(completionTimerRef.current);
      }
      mergeTimersRef.current.forEach((t) => clearTimeout(t));
      mergeTimersRef.current = [];
    };
  }, [words]);

  // Smart Next-Key Guide after 2s idle
  useEffect(() => {
    if (isSequenceRunning || entryCountdown !== null || mode !== 'explore') {
      setHintKeyIndex(null);
      return;
    }
    const nextUnlearnedIdx = words.findIndex((w) => !blendedWords.has(w.word));
    if (nextUnlearnedIdx === -1) {
      setHintKeyIndex(null);
      return;
    }
    const timer = setTimeout(() => {
      setHintKeyIndex(nextUnlearnedIdx);
    }, 2000);

    return () => clearTimeout(timer);
  }, [isSequenceRunning, entryCountdown, mode, blendedWords, words]);

  // Browser fullscreen listener
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

  /**
   * Blue Sky & 2D Water Bubbles Blending Sequence:
   * 1. Show 3 floating 2D bubbles connected by AnimatedBeam sky arcs
   * 2. Bubble 1 bounces + speaks onset (/b/)
   * 3. Bubble 2 bounces + speaks vowel (/æ/)
   * 4. Bubble 3 bounces + speaks coda (/t/)
   * 5. 3 Bubbles merge cleanly into 1 Giant Iridescent Water Bubble ("bat")
   * 6. Tilted 3D Animal Card pops into the sky & Rainbow grows (+1/7)!
   * 7. Auto-celebrate +15 XP 1.5s after completing all 7/7 words!
   */
  const runBlendingSequence = useCallback(
    async (wordItem: PhonicsWordItem, wordIdx: number, preReadDelayMs = 300) => {
      cancelEntryCountdown();

      if (isSequenceRunningRef.current) return;
      isSequenceRunningRef.current = true;
      setHintKeyIndex(null);
      if (completionTimerRef.current) {
        clearTimeout(completionTimerRef.current);
        completionTimerRef.current = null;
      }
      mergeTimersRef.current.forEach((t) => clearTimeout(t));
      mergeTimersRef.current = [];

      setIsSequenceRunning(true);
      setActiveWordIndex(wordIdx);
      setIsRevealed(false);
      setMergePhase('split');
      setActiveCardStep(null);
      playPopSound();

      await sleep(preReadDelayMs);

      const itemBubbles = splitWordForBubbles(wordItem, dayData.vowel);

      // STEP 1: Onset Water Bubble
      setActiveCardStep(1);
      playToyBounceSound();
      await playLetterPhoneme(itemBubbles.b1Phoneme);
      await sleep(230);

      // STEP 2: Vowel Water Bubble
      setActiveCardStep(2);
      playToyBounceSound();
      await playLetterPhoneme(itemBubbles.b2Phoneme);
      await sleep(230);

      // STEP 3: Coda Water Bubble
      setActiveCardStep(3);
      playToyBounceSound();
      if (itemBubbles.b3Phoneme) {
        await playLetterPhoneme(itemBubbles.b3Phoneme);
      }
      await sleep(260);

      // STEP 4 — CONTINUOUS 1-SHOT MERGE:
      // 3 bubbles glide continuously into center (0->480ms) while Giant Bubble blooms from center (260->700ms)
      setActiveCardStep(null);
      setMergePhase('merged');

      mergeTimersRef.current.push(
        setTimeout(() => {
          playMagneticSnapSound();
        }, 250),
        setTimeout(() => {
          setActiveCardStep('blended');
          setIsRevealed(true);
          setIsAnimalBouncing(true);
          playCorrectSound();
        }, 310)
      );

      await sleep(580);

      fireSkyConfetti(32);

      const nextSet = new Set([...blendedWordsRef.current, wordItem.word]);
      blendedWordsRef.current = nextSet;
      setBlendedWords(nextSet);

      await playSpokenText(wordItem.word);

      setTimeout(() => {
        setIsAnimalBouncing(false);
      }, 650);

      isSequenceRunningRef.current = false;
      setIsSequenceRunning(false);

      // Completion: all words blended -> wait 1.5s -> Celebrate (+15 XP)!
      if (nextSet.size >= words.length && !hasCompletedOnceRef.current) {
        hasCompletedOnceRef.current = true;
        completionTimerRef.current = setTimeout(() => {
          playCheerSound();
          fireSkyConfetti(120);
          onComplete(15);
          setMode('completed');
        }, 1500);
      }
    },
    [cancelEntryCountdown, dayData.vowel, words.length, onComplete]
  );

  runBlendingSequenceRef.current = runBlendingSequence;

  const handleSelectWord = useCallback((item: PhonicsWordItem, idx: number) => {
    void runBlendingSequenceRef.current(item, idx, 500);
  }, []);

  // Interactive Bubble Tap Handlers
  const handleTapBubble1 = async () => {
    if (entryCountdown !== null) {
      void runBlendingSequence(activeWord, activeWordIndex, 500);
      return;
    }
    if (isSequenceRunningRef.current) return;
    setActiveCardStep(1);
    playToyBounceSound();
    await playLetterPhoneme(activeBubbles.b1Phoneme);
    setTimeout(() => setActiveCardStep(null), 380);
  };

  const handleTapBubble2 = async () => {
    if (entryCountdown !== null) {
      void runBlendingSequence(activeWord, activeWordIndex, 500);
      return;
    }
    if (isSequenceRunningRef.current) return;
    setActiveCardStep(2);
    playToyBounceSound();
    await playLetterPhoneme(activeBubbles.b2Phoneme);
    setTimeout(() => setActiveCardStep(null), 380);
  };

  const handleTapBubble3 = async () => {
    if (entryCountdown !== null) {
      void runBlendingSequence(activeWord, activeWordIndex, 500);
      return;
    }
    if (isSequenceRunningRef.current) return;
    setActiveCardStep(3);
    playToyBounceSound();
    if (activeBubbles.b3Phoneme) {
      await playLetterPhoneme(activeBubbles.b3Phoneme);
    }
    setTimeout(() => setActiveCardStep(null), 380);
  };

  const handleTapMergedWordOrAnimal = async () => {
    if (isSequenceRunning || !activeWord) return;
    setIsAnimalBouncing(true);
    fireSkyConfetti(40);
    playCorrectSound();
    await playSpokenText(activeWord.word);
    setTimeout(() => setIsAnimalBouncing(false), 850);
  };

  const handleAnswerChallenge = async (choice: string) => {
    if (selectedOnsetChoice !== null) return;
    setSelectedOnsetChoice(choice);
    const curr = challengeItems[challengeIndex];

    if (choice === curr.target) {
      setIsChallengeAnswerCorrect(true);
      playMagneticSnapSound();
      playCorrectSound();
      await playLetterPhoneme(choice);
      await playSpokenText(curr.word.word);
      triggerConfetti();

      setTimeout(() => {
        if (challengeIndex + 1 < challengeItems.length) {
          setChallengeIndex((prev) => prev + 1);
          setSelectedOnsetChoice(null);
          setIsChallengeAnswerCorrect(null);
        } else {
          playCheerSound();
          triggerConfetti();
          setMode('completed');
          onComplete(15);
        }
      }, 1300);
    } else {
      setIsChallengeAnswerCorrect(false);
      playWrongSound();
      setTimeout(() => {
        setSelectedOnsetChoice(null);
        setIsChallengeAnswerCorrect(null);
      }, 800);
    }
  };

  const rainbowProgress = blendedWords.size / words.length;
  const splitSpread = isCompactViewport ? 94 : 162;
  const isMerged = mergePhase === 'merged';

  return (
    <div className="fixed inset-0 z-50 w-screen h-dvh overflow-hidden flex flex-col justify-between select-none font-sans bg-gradient-to-b from-[#38bdf8] via-[#7dd3fc] to-[#e0f2fe]">

      {/* ========================================================================= */}
      {/* 1. MODERN BLUE SKY TOP STAGE (Memoized Backdrop + Zero Backdrop-Blur Lag) */}
      {/* ========================================================================= */}
      <div className="relative flex-1 w-full flex flex-col justify-between overflow-hidden">
        <SkyBackdrop />

        {/* Progressive Sky Rainbow (grows 1/7 -> 7/7!) */}
        {mode === 'explore' && (
          <ProgressiveSkyRainbow progressRatio={rainbowProgress} />
        )}

        {/* TOP TRANSPARENT FLOATING HEADER */}
        <header className="relative z-30 w-full px-3 py-2 sm:px-6 sm:py-3 flex items-center justify-between gap-2 bg-transparent pointer-events-none flex-shrink-0">
          {/* Left: 3D Back to Map */}
          <div className="pointer-events-auto">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-2xl bg-white/95 hover:bg-white text-slate-700 font-bold text-xs sm:text-sm flex items-center gap-1.5 border-2 border-white shadow-[0_3px_0_#7dd3fc,0_6px_14px_rgba(2,132,199,0.16)] active:translate-y-[2px] transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-sky-600" />
                <span className="hidden sm:inline">Quay lại Bản đồ</span>
                <span className="sm:hidden">Bản đồ</span>
              </button>
            )}
          </div>

          {/* Right: Fullscreen Toggle */}
          <div className="pointer-events-auto">
            <button
              type="button"
              onClick={toggleFullscreen}
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-2xl bg-white/95 hover:bg-white text-slate-700 font-bold text-xs sm:text-sm flex items-center gap-1.5 border-2 border-white shadow-[0_3px_0_#7dd3fc,0_6px_14px_rgba(2,132,199,0.16)] active:translate-y-[2px] transition-all cursor-pointer"
              title="Bật/Tắt Toàn Màn Hình"
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
        {/* MAIN SKY STAGE: 3D TILTED ANIMAL CARD + 2D WATER BUBBLE MERGE             */}
        {/* ========================================================================= */}
        {mode === 'explore' && (
          <main className="relative z-10 flex-1 w-full max-w-4xl mx-auto flex flex-col items-center justify-center gap-2.5 sm:gap-3.5 px-3 sm:px-4 pb-2 min-h-0 overflow-y-auto overflow-x-hidden">
            {/* 0. ENTRY COUNTDOWN INSIDE 2D CENTER WATER BUBBLE (5 -> 1) */}
            <AnimatePresence>
              {entryCountdown !== null && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => void runBlendingSequence(activeWord, activeWordIndex, 500)}
                  className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-sky-900/30 backdrop-blur-[5px] cursor-pointer"
                  title="Tap anywhere to start immediately"
                >
                  <div className="relative flex flex-col items-center justify-center">
                    <div
                      style={{
                        background:
                          'linear-gradient(155deg, rgba(255,255,255,0.65) 0%, rgba(125,211,252,0.45) 55%, rgba(14,165,233,0.38) 100%)',
                        boxShadow:
                          '0 18px 48px rgba(2,132,199,0.4), inset 0 6px 14px rgba(255,255,255,0.9)',
                      }}
                      className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full border-4 border-white/95 backdrop-blur-xl flex items-center justify-center"
                    >
                      <svg
                        className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
                        viewBox="0 0 120 120"
                      >
                        <circle
                          cx="60"
                          cy="60"
                          r="52"
                          fill="none"
                          stroke="rgba(255,255,255,0.3)"
                          strokeWidth="7"
                        />
                        <circle
                          cx="60"
                          cy="60"
                          r="52"
                          fill="none"
                          stroke="#FDE047"
                          strokeWidth="7"
                          strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 52}
                          strokeDashoffset={2 * Math.PI * 52 * (1 - entryCountdown / 5)}
                          className="transition-all duration-700 ease-out"
                        />
                      </svg>

                      <span
                        key={entryCountdown}
                        className="font-fredoka text-6xl sm:text-7xl md:text-8xl font-black text-white leading-none select-none animate-in zoom-in-50 duration-200"
                        style={{
                          textShadow:
                            '0 4px 0 #0284c7, 0 10px 22px rgba(2, 132, 199, 0.5)',
                        }}
                      >
                        {entryCountdown}
                      </span>
                    </div>

                    <span className="mt-4 px-5 py-1.5 rounded-full bg-white/95 text-[#0369a1] font-fredoka font-black text-sm sm:text-base tracking-wide uppercase shadow-lg border-2 border-white">
                      Get Ready! 🫧
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* UPPER ZONE: LIGHTWEIGHT GPU ANIMAL CARD (1.5x enlarged edge-to-edge card) */}
            <div className="relative h-[min(240px,36vh)] sm:h-[min(288px,39vh)] md:h-[min(312px,42vh)] w-full flex items-center justify-center">
              {/* Subtle Waiting Sky Hint While Sounding Out */}
              <motion.div
                initial={false}
                animate={{
                  opacity: isRevealed ? 0 : 1,
                  scale: isRevealed ? 0.9 : 1,
                }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                style={{ pointerEvents: isRevealed ? 'none' : 'auto' }}
                className="absolute px-6 py-4 rounded-[28px] bg-white/75 border-2 border-white/90 shadow-[0_8px_24px_rgba(2,132,199,0.12)] flex flex-col items-center gap-1.5 font-fredoka will-change-transform"
              >
                <span className="text-2xl sm:text-3xl">🫧✨</span>
                <span className="text-xs sm:text-sm font-black text-sky-900 tracking-wide">
                  Listen &amp; Blend!
                </span>
              </motion.div>

              {/* Revealed Word Illustration Card */}
              <motion.div
                initial={false}
                animate={{
                  opacity: isRevealed && activeWord ? 1 : 0,
                  scale: isRevealed ? (isAnimalBouncing ? 1.05 : 1) : 0.72,
                  y: isRevealed ? (isAnimalBouncing ? -5 : 0) : 14,
                }}
                transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                style={{ pointerEvents: isRevealed ? 'auto' : 'none' }}
                className="relative flex items-center justify-center will-change-transform"
              >
                <motion.div
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => void handleTapMergedWordOrAnimal()}
                  className="relative w-[min(240px,36vh)] h-[min(240px,36vh)] sm:w-[min(288px,39vh)] sm:h-[min(288px,39vh)] md:w-[min(312px,42vh)] md:h-[min(312px,42vh)] rounded-[36px] bg-white/95 border-3 border-white ring-2 ring-sky-200/80 shadow-[0_18px_38px_rgba(2,132,199,0.22),0_6px_0_#bae6fd] flex items-center justify-center cursor-pointer overflow-visible"
                  title={`Tap to hear "${activeWord.word}"`}
                >
                  {/* Word Badge Top Corner */}
                  <div className="absolute -top-3 -left-3 z-20 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 text-amber-950 font-fredoka font-black text-xs sm:text-sm border-2 border-white shadow-md">
                    {activeWord.word.toUpperCase()} ✨
                  </div>

                  {/* Animal Artwork (fills edge-to-edge inside outer frame) */}
                  <div className="w-full h-full rounded-[33px] overflow-hidden flex items-center justify-center bg-white">
                    <PhonicsWordIllustration
                      word={activeWord.word}
                      size={260}
                      frameless
                    />
                  </div>
                </motion.div>

                {/* SHORT VIETNAMESE MEANING BESIDE THE CARD (no label prefix) */}
                {isRevealed && !isSequenceRunning && shortMeaningVi && (
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="pointer-events-none absolute -bottom-3.5 left-1/2 -translate-x-1/2 sm:bottom-auto sm:left-[calc(100%+24px)] sm:top-1/2 sm:translate-x-0 sm:-translate-y-1/2 z-30"
                  >
                    <div
                      className="px-3.5 py-1 sm:px-5 sm:py-2 rounded-full sm:rounded-2xl bg-white/95 border-2 border-white text-[#0c4a6e] font-fredoka font-bold text-xs sm:text-lg leading-snug shadow-[0_6px_16px_rgba(2,132,199,0.16),0_3px_0_#bae6fd] whitespace-nowrap sm:whitespace-normal sm:w-max sm:max-w-[230px] md:max-w-[260px]"
                      title={activeWord.meaningVi}
                    >
                      {shortMeaningVi}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </div>

            {/* LOWER ZONE: SINGLE-TIMELINE 60FPS GPU BUBBLE MERGE (Zero mid-flight re-renders) */}
            <div
              ref={bubblesStageRef}
              className="relative w-full h-[176px] sm:h-[214px] flex items-center justify-center"
            >
              {/* LAYER 1: 100% GPU LIQUID COLOR HALOS (Aligned on y=0, smooth convergence in 1 curve) */}
              <div className="pointer-events-none absolute w-[360px] h-[160px] flex items-center justify-center">
                {/* Glow Pool 1 (Rose - Onset) */}
                <motion.div
                  initial={false}
                  animate={
                    isMerged
                      ? { x: 0, scale: [1, 1.12, 0.85], opacity: [0, 0.9, 0] }
                      : { x: -splitSpread, scale: 0.9, opacity: 0 }
                  }
                  transition={
                    isMerged
                      ? { duration: 0.48, times: [0, 0.56, 1], ease: [0.42, 0, 0.2, 1] }
                      : { duration: 0.2 }
                  }
                  style={{
                    background:
                      'radial-gradient(circle, rgba(251,113,133,0.7) 0%, rgba(251,113,133,0.22) 55%, transparent 78%)',
                  }}
                  className="absolute w-28 h-28 sm:w-32 sm:h-32 rounded-full will-change-transform"
                />

                {/* Glow Pool 2 (Amber - Vowel) */}
                <motion.div
                  initial={false}
                  animate={
                    isMerged
                      ? { x: 0, scale: [1, 1.24, 0.9], opacity: [0, 0.9, 0] }
                      : { x: 0, scale: 0.9, opacity: 0 }
                  }
                  transition={
                    isMerged
                      ? { duration: 0.48, times: [0, 0.56, 1], ease: [0.42, 0, 0.2, 1] }
                      : { duration: 0.2 }
                  }
                  style={{
                    background:
                      'radial-gradient(circle, rgba(251,191,36,0.7) 0%, rgba(251,191,36,0.22) 55%, transparent 78%)',
                  }}
                  className="absolute w-28 h-28 sm:w-32 sm:h-32 rounded-full will-change-transform"
                />

                {/* Glow Pool 3 (Sky - Coda) */}
                <motion.div
                  initial={false}
                  animate={
                    isMerged
                      ? { x: 0, scale: [1, 1.12, 0.85], opacity: [0, 0.9, 0] }
                      : { x: splitSpread, scale: 0.9, opacity: 0 }
                  }
                  transition={
                    isMerged
                      ? { duration: 0.48, times: [0, 0.56, 1], ease: [0.42, 0, 0.2, 1] }
                      : { duration: 0.2 }
                  }
                  style={{
                    background:
                      'radial-gradient(circle, rgba(56,189,248,0.7) 0%, rgba(56,189,248,0.22) 55%, transparent 78%)',
                  }}
                  className="absolute w-28 h-28 sm:w-32 sm:h-32 rounded-full will-change-transform"
                />
              </div>

              {/* LAYER 1.5: PURE GPU TRI-COLOR BLEND GLOW AURA (Blooms right as bubbles meet at center) */}
              <motion.div
                initial={false}
                animate={
                  isMerged
                    ? { opacity: [0, 0.88, 0.34], scale: [0.45, 1.18, 1.04] }
                    : { opacity: 0, scale: 0.45 }
                }
                transition={
                  isMerged
                    ? { delay: 0.22, duration: 0.46, times: [0, 0.45, 1], ease: 'easeOut' }
                    : { duration: 0.16, ease: 'easeOut' }
                }
                style={{
                  background:
                    'radial-gradient(circle, rgba(255,255,255,0.92) 0%, rgba(253,164,175,0.65) 35%, rgba(253,224,71,0.55) 60%, rgba(56,189,248,0.45) 82%, transparent 100%)',
                }}
                className="pointer-events-none absolute w-48 h-48 sm:w-56 sm:h-56 rounded-full will-change-transform"
              />

              {/* LAYER 2A: CRISP 3 WATER BUBBLES (Continuous 1-curve convergence, zero scale/opacity reversal) */}
              <div
                style={{ pointerEvents: isMerged ? 'none' : 'auto' }}
                className="relative w-full h-full flex items-center justify-center"
              >
                {/* Animated Beams kept mounted and faded cleanly before slide */}
                <div
                  className={`pointer-events-none absolute inset-0 transition-opacity duration-150 ${
                    !isMerged ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <AnimatedBeam
                    containerRef={bubblesStageRef}
                    fromRef={bubble1Ref}
                    toRef={bubble2Ref}
                    curvature={-16}
                    pathColor="#ffffff"
                    pathOpacity={0.45}
                    pathWidth={3}
                    gradientStartColor="#fb7185"
                    gradientStopColor="#fbbf24"
                    duration={2.4}
                  />
                  <AnimatedBeam
                    containerRef={bubblesStageRef}
                    fromRef={bubble2Ref}
                    toRef={bubble3Ref}
                    curvature={-16}
                    pathColor="#ffffff"
                    pathOpacity={0.45}
                    pathWidth={3}
                    gradientStartColor="#fbbf24"
                    gradientStopColor="#38bdf8"
                    duration={2.4}
                    delay={0.35}
                  />
                </div>

                {/* BUBBLE 1: ONSET (Glides smoothly -splitSpread -> 0 in 1 curve) */}
                <motion.div
                  initial={false}
                  animate={
                    isMerged
                      ? { x: 0, scale: [1, 0.96, 0.56], opacity: [1, 0.94, 0] }
                      : { x: -splitSpread, scale: 1, opacity: 1 }
                  }
                  transition={
                    isMerged
                      ? { duration: 0.46, times: [0, 0.6, 1], ease: [0.42, 0, 0.2, 1] }
                      : { duration: 0.28, ease: [0.22, 1, 0.36, 1] }
                  }
                  className="absolute will-change-transform"
                >
                  <WaterBubbleLetter
                    letter={activeBubbles.b1}
                    phonemeLabel={activeBubbles.b1Label}
                    tint="rose"
                    isActiveStep={activeCardStep === 1}
                    isFusing={isMerged}
                    isIdleFloating={!isSequenceRunning && !isMerged}
                    floatDelay={0}
                    bubbleRef={bubble1Ref}
                    onClick={() => void handleTapBubble1()}
                    disabled={isSequenceRunning}
                  />
                </motion.div>

                {/* BUBBLE 2: VOWEL (Center Anchor absorbs neighbors & dissolves into giant bubble) */}
                <motion.div
                  initial={false}
                  animate={
                    isMerged
                      ? { x: 0, scale: [1, 1.08, 0.62], opacity: [1, 0.94, 0] }
                      : { x: 0, scale: 1, opacity: 1 }
                  }
                  transition={
                    isMerged
                      ? { duration: 0.46, times: [0, 0.56, 1], ease: [0.42, 0, 0.2, 1] }
                      : { duration: 0.28, ease: [0.22, 1, 0.36, 1] }
                  }
                  className="absolute z-10 will-change-transform"
                >
                  <WaterBubbleLetter
                    letter={activeBubbles.b2}
                    phonemeLabel={activeBubbles.b2Label}
                    tint="amber"
                    isActiveStep={activeCardStep === 2}
                    isFusing={isMerged}
                    isIdleFloating={!isSequenceRunning && !isMerged}
                    floatDelay={0.35}
                    bubbleRef={bubble2Ref}
                    onClick={() => void handleTapBubble2()}
                    disabled={isSequenceRunning}
                  />
                </motion.div>

                {/* BUBBLE 3: CODA (Glides smoothly +splitSpread -> 0 in 1 curve) */}
                <motion.div
                  initial={false}
                  animate={
                    isMerged
                      ? { x: 0, scale: [1, 0.96, 0.56], opacity: [1, 0.94, 0] }
                      : { x: splitSpread, scale: 1, opacity: 1 }
                  }
                  transition={
                    isMerged
                      ? { duration: 0.46, times: [0, 0.6, 1], ease: [0.42, 0, 0.2, 1] }
                      : { duration: 0.28, ease: [0.22, 1, 0.36, 1] }
                  }
                  className="absolute will-change-transform"
                >
                  <WaterBubbleLetter
                    letter={activeBubbles.b3}
                    phonemeLabel={activeBubbles.b3Label}
                    tint="sky"
                    isActiveStep={activeCardStep === 3}
                    isFusing={isMerged}
                    isIdleFloating={!isSequenceRunning && !isMerged}
                    floatDelay={0.7}
                    bubbleRef={bubble3Ref}
                    onClick={() => void handleTapBubble3()}
                    disabled={isSequenceRunning}
                  />
                </motion.div>
              </div>

              {/* LAYER 2B: MERGED GIANT IRIDESCENT 2D WATER BUBBLE (Overlaps & blooms seamlessly at center!) */}
              <motion.div
                initial={false}
                animate={
                  isMerged
                    ? { opacity: 1, scale: [0.42, 1.08, 0.97, 1] }
                    : { opacity: 0, scale: 0.52 }
                }
                transition={
                  isMerged
                    ? {
                        delay: 0.26,
                        duration: 0.44,
                        times: [0, 0.58, 0.82, 1],
                        ease: [0.22, 1, 0.36, 1],
                      }
                    : { duration: 0.16, ease: 'easeOut' }
                }
                style={{ pointerEvents: isMerged ? 'auto' : 'none' }}
                className="absolute flex flex-col items-center justify-center font-fredoka will-change-transform"
              >
                <motion.button
                  type="button"
                  onClick={() => void handleTapMergedWordOrAnimal()}
                    animate={
                      isMerged && !isSequenceRunning
                        ? { y: [0, -6, 0] }
                        : { y: 0 }
                    }
                    transition={
                      isMerged && !isSequenceRunning
                        ? {
                            duration: 3.2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }
                        : { duration: 0.15 }
                    }
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.94 }}
                    style={{
                      background:
                        'radial-gradient(circle at 26% 24%, rgba(255,255,255,0.97) 0%, rgba(254,205,211,0.88) 36%, rgba(254,240,138,0.84) 64%, rgba(125,211,252,0.9) 100%)',
                      boxShadow:
                        '0 16px 36px rgba(2,132,199,0.25), inset 0 8px 16px rgba(255,255,255,0.95), inset -10px -12px 22px rgba(56,189,248,0.25)',
                    }}
                    className="relative w-40 h-40 sm:w-48 sm:h-48 md:w-52 md:h-52 rounded-full border-4 border-white flex flex-col items-center justify-center cursor-pointer outline-none will-change-transform"
                    title={`Tap bubble to listen: "${activeWord.word}"`}
                  >
                    {/* Magic UI Ripple Celebration Halo (Always mounted, toggled via opacity for zero DOM churn) */}
                    <div
                      className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
                        isMerged && !isSequenceRunning ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      <Ripple
                        mainCircleSize={170}
                        circleGap={36}
                        numCircles={2}
                        mainCircleOpacity={0.36}
                        className="mask-none overflow-visible"
                        circleClassName="border-2 border-white/85 bg-white/12 shadow-none [--duration:2.2s] will-change-transform"
                      />
                    </div>

                    {/* 2D Vector Flat Specular Bubble Highlights */}
                    <svg
                      viewBox="0 0 100 100"
                      className="pointer-events-none absolute inset-0 w-full h-full"
                    >
                      <path
                        d="M 22 40 A 32 32 0 0 1 48 16"
                        fill="none"
                        stroke="rgba(255,255,255,0.95)"
                        strokeWidth="4.8"
                        strokeLinecap="round"
                      />
                      <circle cx="20" cy="50" r="3" fill="rgba(255,255,255,0.9)" />
                      <path
                        d="M 60 84 A 30 30 0 0 0 82 62"
                        fill="none"
                        stroke="rgba(255,255,255,0.5)"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>

                    {/* Merged Full Word (Onset + Rime Highlighted) */}
                    <div
                      className="relative z-10 text-5xl sm:text-6xl md:text-[4rem] font-black leading-none tracking-wide"
                      style={{
                        textShadow: '0 3px 0 rgba(255, 255, 255, 0.92)',
                      }}
                    >
                      <span className="text-[#e11d48]">{activeWord.onset}</span>
                      <span className="text-[#0369a1]">{activeWord.rime}</span>
                    </div>

                    {/* IPA + Sound Pill Inside Giant Bubble */}
                    <span className="relative z-10 mt-2 px-3 py-0.5 rounded-full bg-white/92 text-sky-800 font-sans font-extrabold text-xs sm:text-sm border border-white shadow-xs flex items-center gap-1">
                      <Volume2 className="w-3.5 h-3.5 text-sky-600" />
                      <span>{activeWord.ipa}</span>
                    </span>
                  </motion.button>
              </motion.div>
            </div>

            {/* REPLAY 3D BUTTON DIRECTLY BELOW THE MERGED BUBBLE */}
            <div className="h-[38px] sm:h-[44px] flex items-center justify-center flex-shrink-0">
              {isRevealed && !isSequenceRunning && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="z-30"
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void runBlendingSequence(activeWord, activeWordIndex);
                    }}
                    className="group/rep relative inline-flex flex-shrink-0 cursor-pointer border-none bg-transparent p-0 outline-none"
                    title="Đọc lại từ này"
                  >
                    <span className="pointer-events-none absolute inset-0 translate-y-[4px] rounded-full bg-[#be123c]" />
                    <span className="relative px-4 py-1.5 sm:px-5 sm:py-2 rounded-full bg-gradient-to-b from-[#ff5c82] via-[#f43f5e] to-[#e11d48] border-2 border-white text-white font-fredoka font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md transition-transform duration-100 -translate-y-[1px] group-hover/rep:-translate-y-[2.5px] group-active/rep:translate-y-[3px] whitespace-nowrap">
                      <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>Đọc Lại</span>
                    </span>
                  </button>
                </motion.div>
              )}
            </div>
          </main>
        )}

        {/* ========================================================================= */}
        {/* MODE 2: CHALLENGE MODE (Using 2D Water Bubbles + Cult UI TextureCard!)    */}
        {/* ========================================================================= */}
        {mode === 'challenge' && (
          <main className="relative z-10 flex-1 w-full flex flex-col items-center justify-center px-3 sm:px-4 py-2 overflow-y-auto overflow-x-hidden">
            <TextureCardStyled className="w-full max-w-xl shadow-2xl font-fredoka">
              <div className="p-5 sm:p-8 flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-4">
                  <span className="text-xs sm:text-sm font-black text-sky-800 bg-sky-100 px-3.5 py-1 rounded-full border border-sky-200">
                    Challenge {challengeIndex + 1} / {challengeItems.length}
                  </span>
                </div>

                <div className="w-24 h-24 sm:w-28 sm:h-28 mb-4 bg-white rounded-2xl p-2 shadow-sm border border-sky-100 flex items-center justify-center">
                  <PhonicsWordIllustration
                    word={challengeItems[challengeIndex].word.word}
                    size={90}
                  />
                </div>

                <div className="flex items-center gap-2 text-4xl sm:text-5xl font-black mb-6">
                  <div className="w-14 h-16 rounded-2xl border-2 border-dashed border-sky-400 bg-sky-50 flex items-center justify-center text-sky-700">
                    {selectedOnsetChoice || '?'}
                  </div>
                  <span className="text-slate-800">
                    {challengeItems[challengeIndex].word.rime}
                  </span>
                </div>

                <div className="flex items-center justify-center gap-5 w-full">
                  {challengeItems[challengeIndex].options.map((opt, idx) => {
                    const tint: BubbleTint = idx === 0 ? 'rose' : idx === 1 ? 'amber' : 'sky';
                    const palette = BUBBLE_TINTS[tint];
                    const isSelected = selectedOnsetChoice === opt;

                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => void handleAnswerChallenge(opt)}
                        disabled={selectedOnsetChoice !== null}
                        style={{
                          background: palette.fill,
                          borderColor: palette.border,
                          boxShadow: palette.glow,
                        }}
                        className={`w-20 h-20 rounded-full border-3 flex items-center justify-center font-black text-3xl cursor-pointer transition-transform ${palette.letterColor
                          } ${isSelected
                            ? isChallengeAnswerCorrect
                              ? 'scale-115 ring-4 ring-emerald-400'
                              : 'opacity-50'
                            : 'hover:scale-110 active:scale-95'
                          }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            </TextureCardStyled>
          </main>
        )}

        {/* ========================================================================= */}
        {/* MODE 3: CELEBRATION SCREEN (+15 XP - Blue Sky & Magic Water Bubbles!)     */}
        {/* ========================================================================= */}
        {mode === 'completed' && (
          <main className="relative z-20 flex-1 w-full flex flex-col items-center justify-center px-4 py-4 overflow-y-auto">
            <div className="relative w-full max-w-lg bg-white/96 rounded-[34px] border-3 border-sky-200 p-6 sm:p-8 shadow-[0_10px_0_#7dd3fc,0_24px_50px_rgba(2,132,199,0.22)] flex flex-col items-center text-center animate-in zoom-in-95 font-fredoka overflow-hidden">

              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-orange-500 text-white flex items-center justify-center text-4xl shadow-lg mb-4 animate-bounce border-3 border-white">
                🏆
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
                Tuyệt vời! Bé Đã Hoàn Thành Trạm 1!
              </h3>
              <p className="text-sm sm:text-base text-slate-600 max-w-md mb-6 font-sans">
                Bé đã ghép trọn vẹn cả{' '}
                <strong>
                  {words.length}/{words.length} bong bóng nước ({dayData.title})
                </strong>{' '}
                và thắp sáng cầu vồng bầu trời!
              </p>

              <div className="flex items-center gap-2.5 bg-amber-50 px-5 py-2.5 rounded-2xl border-2 border-amber-200 mb-6">
                <Star className="w-6 h-6 fill-amber-400 text-amber-500" />
                <span className="font-black text-amber-700 text-lg">
                  +15 XP &amp; Mở Khóa Trạm Kế Tiếp
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    blendedWordsRef.current = new Set();
                    setBlendedWords(new Set());
                    setActiveWordIndex(0);
                    setMergePhase('split');
                    setIsRevealed(false);
                    setActiveCardStep(null);
                    hasCompletedOnceRef.current = false;
                    setMode('explore');
                    setTimeout(() => {
                      void runBlendingSequenceRef.current(words[0], 0);
                    }, 150);
                  }}
                  className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Luyện tập lại</span>
                </button>

                {onClose && (
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
                )}
              </div>
            </div>
          </main>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. BOTTOM TIER: MEMOIZED SKY DOCK + 7 3D PUSHABLE KEYCAPS                 */}
      {/* ========================================================================= */}
      {mode === 'explore' && (
        <BottomWordDock
          words={words}
          activeWordWord={activeWord.word}
          blendedWords={blendedWords}
          hintKeyIndex={hintKeyIndex}
          hasEntryCountdown={entryCountdown !== null}
          isSequenceRunning={isSequenceRunning}
          onSelectWord={handleSelectWord}
        />
      )}
    </div>
  );
}
