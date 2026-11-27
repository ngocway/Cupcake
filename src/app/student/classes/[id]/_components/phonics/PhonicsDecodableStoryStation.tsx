'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Star,
  RotateCcw,
  ArrowLeft,
  Maximize,
  Minimize,
  Square,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { PHONICS_DAY_1_DATA, PhonicsDayData } from '@/lib/phonics-45-days-units';
import {
  playPopSound,
  playCorrectSound,
  playWrongSound,
  playCheerSound,
  playSpokenText,
  stopSpokenAudio,
  triggerConfetti,
} from './PhonicsAudioEffects';
import { PhonicsWordIllustration } from './PhonicsWordIllustrations';
import { Particles } from '@/components/ui/particles';
import { ShineBorder } from '@/components/ui/shine-border';
import { SparklesText } from '@/components/ui/sparkles-text';
import { CoolMode, type CoolParticleOptions } from '@/components/ui/cool-mode';

export interface PhonicsDecodableStoryStationProps {
  dayData?: PhonicsDayData;
  onComplete: (xp: number) => void;
  isAlreadyCompleted?: boolean;
  onClose?: () => void;
}

const STORY_WORD_COOL_OPTIONS: CoolParticleOptions = {
  particles: ['✨', '⭐', '📖'],
  particleCount: 6,
  size: 18,
};

const STORY_ACTION_COOL_OPTIONS: CoolParticleOptions = {
  particles: ['🌟', '✨', '🎉', '📚'],
  particleCount: 9,
  size: 21,
};

const BILINGUAL_EXPLANATION = {
  en: 'The story says: "The fat cat sat on the mat."',
  vi: 'Trong truyện có câu: "Chú mèo mập ngồi trên tấm thảm."',
};

function parseBilingualExplanation(raw: string) {
  if (!raw) return BILINGUAL_EXPLANATION;
  const parts = raw.split('|').map((s) => s.trim());
  const enRaw = parts[0] || raw;
  const viRaw = parts[1] || '';
  return {
    en: enRaw.replace(/^\[EN\]\s*/i, '').trim(),
    vi: viRaw.replace(/^\[VI\]\s*/i, '').trim() || enRaw.replace(/^\[EN\]\s*/i, '').trim(),
  };
}

function fireStoryConfetti(particleCount = 95) {
  try {
    confetti({
      particleCount,
      spread: 82,
      origin: { y: 0.6 },
      colors: ['#38bdf8', '#fbbf24', '#34d399', '#f472b6', '#60a5fa'],
      zIndex: 9999,
    });
  } catch {
    triggerConfetti();
  }
}

/**
 * Splits a token like `"cat."` into `{ leading: "", word: "cat", trailing: "." }`
 * so punctuation is never trapped inside the highlighted phonics pill.
 */
function splitTokenPunctuation(token: string) {
  const match = token.match(/^([^a-zA-Z]*)([a-zA-Z]+)([^a-zA-Z]*)$/);
  if (!match) {
    return { leading: '', word: token, trailing: '' };
  }
  return {
    leading: match[1] || '',
    word: match[2] || '',
    trailing: match[3] || '',
  };
}

/**
 * Dynamic Story Scene Artwork for each of the 4 story lines on the Left Page
 */
function StorySceneIllustration({
  sceneIndex,
  dayData,
}: {
  sceneIndex: number;
  dayData: PhonicsDayData;
}) {
  if (dayData.day !== 1) {
    const lineText = (dayData.decodableStory.lines[sceneIndex] || '').toLowerCase();
    const matchedWords = dayData.words.filter((item) => {
      const escaped = item.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`\\b${escaped}\\b`, 'i').test(lineText);
    });
    const displayWords = (
      matchedWords.length > 0
        ? matchedWords
        : [dayData.words[sceneIndex % dayData.words.length]].filter(Boolean)
    ).slice(0, 2);

    const bgThemes = [
      'from-[#e0f2fe] via-[#f0f9ff] to-[#fef3c7]',
      'from-[#dbeafe] via-[#eff6ff] to-[#fce7f3]',
      'from-[#ede9fe] via-[#eff6ff] to-[#fef3c7]',
      'from-[#dcfce7] via-[#f0f9ff] to-[#fef9c3]',
    ];

    return (
      <div
        className={`relative w-full h-full rounded-[26px] bg-gradient-to-b ${
          bgThemes[sceneIndex % bgThemes.length]
        } border-2 border-sky-200/80 flex flex-col items-center justify-center p-4 overflow-hidden shadow-inner`}
      >
        <div className="pointer-events-none absolute -top-8 -right-8 w-28 h-28 rounded-full bg-amber-300/35 blur-xl" />
        <div className="flex items-center justify-center gap-3">
          {displayWords.map((item, i) => (
            <motion.div
              key={item.word}
              animate={{ y: i % 2 === 0 ? [0, -5, 0] : [-4, 4, -4] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
            >
              <PhonicsWordIllustration
                word={item.word}
                size={displayWords.length > 1 ? 104 : 128}
              />
            </motion.div>
          ))}
        </div>
        <span className="mt-2.5 px-3.5 py-1 rounded-full bg-white/90 border border-sky-200 text-xs font-black text-sky-800 shadow-2xs">
          Scene {sceneIndex + 1} • {displayWords.map((w) => w.word).join(' & ')}
        </span>
      </div>
    );
  }

  switch (sceneIndex) {
    case 0:
      // Line 1: "I see a fat cat."
      return (
        <div className="relative w-full h-full rounded-[26px] bg-gradient-to-b from-[#e0f2fe] via-[#f0f9ff] to-[#fef3c7] border-2 border-sky-200/80 flex flex-col items-center justify-center p-4 overflow-hidden shadow-inner">
          <div className="pointer-events-none absolute -top-8 -right-8 w-28 h-28 rounded-full bg-amber-300/35 blur-xl" />
          <div className="flex items-center justify-center gap-3">
            <PhonicsWordIllustration word="fat" size={116} />
            <PhonicsWordIllustration word="cat" size={122} />
          </div>
          <span className="mt-2 px-3.5 py-1 rounded-full bg-white/90 border border-sky-200 text-xs font-black text-sky-800 shadow-2xs">
            Scene 1 • A fat cat
          </span>
        </div>
      );

    case 1:
      // Line 2: "The fat cat has a hat."
      return (
        <div className="relative w-full h-full rounded-[26px] bg-gradient-to-b from-[#dbeafe] via-[#eff6ff] to-[#fef9c3] border-2 border-sky-200/80 flex flex-col items-center justify-center p-4 overflow-hidden shadow-inner">
          <div className="relative flex items-center justify-center gap-2 sm:gap-3">
            <PhonicsWordIllustration word="cat" size={112} />
            <motion.div
              animate={{ y: [0, -6, 0], rotate: [-4, 4, -4] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            >
              <PhonicsWordIllustration word="hat" size={105} />
            </motion.div>
          </div>
          <span className="mt-2 px-3.5 py-1 rounded-full bg-white/90 border border-sky-200 text-xs font-black text-sky-800 shadow-2xs">
            Scene 2 • A yellow hat
          </span>
        </div>
      );

    case 2:
      // Line 3: "The cat sees a rat with a bat."
      return (
        <div className="relative w-full h-full rounded-[26px] bg-gradient-to-b from-[#ede9fe] via-[#eff6ff] to-[#fef3c7] border-2 border-sky-200/80 flex flex-col items-center justify-center p-4 overflow-hidden shadow-inner">
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            <PhonicsWordIllustration word="rat" size={112} />
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <PhonicsWordIllustration word="bat" size={104} />
            </motion.div>
          </div>
          <span className="mt-2 px-3.5 py-1 rounded-full bg-white/90 border border-sky-200 text-xs font-black text-sky-800 shadow-2xs">
            Scene 3 • A rat &amp; a bat
          </span>
        </div>
      );

    case 3:
    default:
      // Line 4: "The fat cat sat on the mat."
      return (
        <div className="relative w-full h-full rounded-[26px] bg-gradient-to-b from-[#e0f2fe] via-[#fff1f2] to-[#fef3c7] border-2 border-sky-200/80 flex flex-col items-center justify-center p-4 overflow-hidden shadow-inner">
          <div className="relative flex items-center justify-center gap-2 sm:gap-3">
            <PhonicsWordIllustration word="cat" size={110} />
            <PhonicsWordIllustration word="mat" size={112} />
          </div>
          <span className="mt-2 px-3.5 py-1 rounded-full bg-white/90 border border-sky-200 text-xs font-black text-sky-800 shadow-2xs">
            Scene 4 • On the mat
          </span>
        </div>
      );
  }
}

export function PhonicsDecodableStoryStation({
  dayData = PHONICS_DAY_1_DATA,
  onComplete,
  onClose,
}: PhonicsDecodableStoryStationProps) {
  const story = dayData.decodableStory;
  const compQ = story.comprehensionQuestion;
  const parsedExplanation = parseBilingualExplanation(compQ.explanation);
  const wordPartsMap = React.useMemo(() => {
    const map: Record<string, { onset: string; rime: string }> = {};
    for (const item of dayData.words) {
      map[item.word.toLowerCase()] = { onset: item.onset, rime: item.rime };
    }
    return map;
  }, [dayData.words]);

  const [mode, setMode] = useState<'story' | 'quiz' | 'completed'>('story');
  const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null);
  const [focusedSceneIndex, setFocusedSceneIndex] = useState<number>(0);
  const [readLines, setReadLines] = useState<Set<number>>(() => new Set());
  const [isPlayingAll, setIsPlayingAll] = useState(false);

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const playbackIdRef = useRef(0);
  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrongTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fullscreen state listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Cleanup timers & cancel audio loop on unmount
  useEffect(() => {
    return () => {
      playbackIdRef.current += 1;
      stopSpokenAudio();
      if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
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

  // Read a single sentence line with Karaoke highlight + matching Left Page scene
  const handleReadLine = async (line: string, idx: number) => {
    const runId = ++playbackIdRef.current;
    setIsPlayingAll(false);
    setFocusedSceneIndex(idx);
    setActiveLineIndex(idx);
    setReadLines((prev) => new Set([...prev, idx]));
    playPopSound();

    try {
      await playSpokenText(line);
    } catch {
      // Ignore audio errors
    } finally {
      if (playbackIdRef.current === runId) {
        setActiveLineIndex(null);
      }
    }
  };

  // Read full story sequentially (or stop if currently playing)
  const handleToggleReadAll = async () => {
    if (isPlayingAll) {
      playbackIdRef.current += 1;
      stopSpokenAudio();
      setIsPlayingAll(false);
      setActiveLineIndex(null);
      playPopSound();
      return;
    }

    const runId = ++playbackIdRef.current;
    playPopSound();
    setIsPlayingAll(true);

    for (let i = 0; i < story.lines.length; i++) {
      if (playbackIdRef.current !== runId) return;
      setFocusedSceneIndex(i);
      setActiveLineIndex(i);
      setReadLines((prev) => new Set([...prev, i]));
      try {
        await playSpokenText(story.lines[i]);
      } catch {
        // Ignore audio errors
      }
    }

    if (playbackIdRef.current === runId) {
      setActiveLineIndex(null);
      setIsPlayingAll(false);
    }
  };

  // Tap an individual -at word pill to hear isolated word pronunciation
  const handleWordClick = (cleanWord: string, lineIdx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    playbackIdRef.current += 1;
    setIsPlayingAll(false);
    setActiveLineIndex(null);
    setFocusedSceneIndex(lineIdx);
    playPopSound();
    void playSpokenText(cleanWord);
  };

  const handleOpenQuiz = () => {
    playbackIdRef.current += 1;
    setIsPlayingAll(false);
    setActiveLineIndex(null);
    setSelectedAnswer(null);
    setIsAnswerCorrect(null);
    setMode('quiz');
    playPopSound();
    setTimeout(() => {
      void playSpokenText(compQ.question);
    }, 280);
  };

  const handleAnswerClick = (option: string) => {
    if (selectedAnswer !== null && isAnswerCorrect === true) return;
    if (wrongTimerRef.current) clearTimeout(wrongTimerRef.current);

    setSelectedAnswer(option);

    if (option === compQ.correctAnswer) {
      setIsAnswerCorrect(true);
      playPopSound();
      playCorrectSound();
      playCheerSound();
      fireStoryConfetti(90);

      // Show praise + bilingual explanation for ~1.6s, then open +20 XP Destination Celebration!
      finishTimerRef.current = setTimeout(() => {
        onComplete(20);
        setMode('completed');
        fireStoryConfetti(120);
      }, 1650);
    } else {
      setIsAnswerCorrect(false);
      playWrongSound();
      wrongTimerRef.current = setTimeout(() => {
        setSelectedAnswer(null);
        setIsAnswerCorrect(null);
      }, 720);
    }
  };

  const handleReplayStory = () => {
    if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
    if (wrongTimerRef.current) clearTimeout(wrongTimerRef.current);
    playbackIdRef.current += 1;
    setSelectedAnswer(null);
    setIsAnswerCorrect(null);
    setFocusedSceneIndex(0);
    setMode('story');
    playPopSound();
  };

  return (
    <div className="fixed inset-0 z-50 w-screen h-dvh overflow-hidden flex flex-col justify-between select-none font-sans bg-gradient-to-br from-[#c9e6ff] via-[#eaf5ff] to-[#fff9eb]">
      {/* Fredoka Display Typography */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700;900&display=swap');
        .font-fredoka {
          font-family: 'Fredoka', 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
      `}</style>

      {/* Soft Sky-Cloud & Cream Ambient Glow Blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full bg-sky-300/35 blur-3xl" />
      <div className="pointer-events-none absolute top-1/4 -right-24 w-[440px] h-[440px] rounded-full bg-blue-200/35 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 w-[500px] h-80 rounded-full bg-amber-200/40 blur-3xl" />

      {/* Magic UI Sky & Starlight Particles */}
      <Particles
        className="absolute inset-0 z-0"
        quantity={45}
        staticity={45}
        ease={60}
        size={1.6}
        color="#2563eb"
      />
      <Particles
        className="absolute inset-0 z-0"
        quantity={30}
        staticity={50}
        ease={65}
        size={1.8}
        color="#f59e0b"
      />

      {/* ========================================================================= */}
      {/* 1. CLEAN FLOATING TOP BAR (Matches Stations 1, 2, 3)                      */}
      {/* ========================================================================= */}
      <header className="relative z-30 w-full px-3 py-2.5 sm:px-6 sm:py-3.5 flex items-center justify-between gap-2 bg-transparent flex-shrink-0">
        {/* Left: Back to Map */}
        <div>
          {onClose && (
            <button
              type="button"
              onClick={() => {
                playbackIdRef.current += 1;
                onClose();
              }}
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-2xl bg-white/95 hover:bg-white text-slate-700 font-bold text-xs sm:text-sm flex items-center gap-1.5 border-2 border-sky-100 shadow-[0_3px_0_#bae6fd,0_6px_14px_rgba(2,132,199,0.12)] active:translate-y-[2px] active:shadow-[0_1px_0_#bae6fd] transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-sky-600" />
              <span className="hidden sm:inline">Quay lại Bản đồ</span>
              <span className="sm:hidden">Bản đồ</span>
            </button>
          )}
        </div>

        {/* Center: Storybook Title Pill with Magic UI SparklesText */}
        {mode !== 'completed' && (
          <div className="min-w-0 max-w-[52vw] sm:max-w-md px-3 sm:px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-md border-2 border-white shadow-[0_4px_16px_rgba(2,132,199,0.14)] flex items-center gap-1.5 sm:gap-2 font-fredoka">
            <BookOpen className="w-4 h-4 text-sky-600 flex-shrink-0" />
            <SparklesText
              sparklesCount={5}
              colors={{ first: '#0284c7', second: '#f59e0b' }}
              className="block truncate text-xs sm:text-base font-black text-sky-900 tracking-wide"
            >
              {story.title}
            </SparklesText>
          </div>
        )}

        {/* Right: Fullscreen Toggle */}
        <div>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-2xl bg-white/95 hover:bg-white text-slate-700 font-bold text-xs sm:text-sm flex items-center gap-1.5 border-2 border-sky-100 shadow-[0_3px_0_#bae6fd,0_6px_14px_rgba(2,132,199,0.12)] active:translate-y-[2px] active:shadow-[0_1px_0_#bae6fd] transition-all cursor-pointer"
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
      {/* 2. OPEN 3D HARDCOVER STORYBOOK STAGE (Story Spread OR Quiz Page)          */}
      {/* ========================================================================= */}
      {mode !== 'completed' ? (
        <main className="relative z-10 flex-1 w-full max-w-5xl mx-auto flex items-start lg:items-center justify-center px-3 sm:px-6 pt-1 pb-6 min-h-0 overflow-y-auto overflow-x-hidden">
          {/* Hardcover 3D Book Outer Shell */}
          <div className="relative w-full rounded-[34px] sm:rounded-[38px] bg-gradient-to-b from-[#38bdf8] via-[#0284c7] to-[#0369a1] p-2 sm:p-3 shadow-[0_10px_0_#075985,0_24px_55px_rgba(2,132,199,0.25)] border-2 border-sky-200/90">
            <ShineBorder
              borderWidth={3}
              duration={14}
              shineColor={['#7DD3FC', '#FDE047', '#F472B6']}
            />

            {/* Stacked Paper Pages Inner Spread */}
            <div className="relative w-full rounded-[26px] sm:rounded-[30px] bg-[#fffdf9] border-2 border-white shadow-[0_5px_0_#dbeafe,inset_0_2px_8px_rgba(255,255,255,0.95)] overflow-hidden font-fredoka">
              <AnimatePresence mode="wait">
                {mode === 'story' ? (
                  /* =============================================================== */
                  /* SPREAD A: 2-PAGE OPEN STORYBOOK (Left Art + Right 4 Lines)      */
                  /* =============================================================== */
                  <motion.div
                    key="story-spread"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, x: -30, scale: 0.98 }}
                    transition={{ duration: 0.24 }}
                    className="relative grid grid-cols-1 lg:grid-cols-12"
                  >
                    {/* Center Hardcover Book Spine Crease & Ribbon (Desktop) */}
                    <div className="hidden lg:block pointer-events-none absolute top-0 bottom-0 left-[41.666%] -translate-x-1/2 w-7 z-20 bg-gradient-to-r from-slate-900/[0.04] via-sky-900/[0.10] to-slate-900/[0.04]" />
                    <div className="hidden lg:block pointer-events-none absolute top-0 left-[41.666%] -translate-x-1/2 w-4 h-9 z-30 bg-gradient-to-b from-rose-500 to-rose-600 rounded-b-md shadow-sm" />

                    {/* LEFT PAGE (5 cols): Dynamic Scene Illustration + Read All 3D Button */}
                    <div className="lg:col-span-5 p-4 sm:p-6 bg-gradient-to-br from-[#f8fbff] via-[#fffdf9] to-[#f0f9ff] border-b lg:border-b-0 lg:border-r border-sky-100 flex flex-col items-center justify-between gap-3">
                      {/* Scene Canvas */}
                      <div className="w-full h-40 sm:h-56 lg:h-64">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={focusedSceneIndex}
                            initial={{ opacity: 0, scale: 0.92 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.94 }}
                            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                            className="w-full h-full"
                          >
                            <StorySceneIllustration
                              sceneIndex={focusedSceneIndex}
                              dayData={dayData}
                            />
                          </motion.div>
                        </AnimatePresence>
                      </div>

                      {/* 4 Scene Switcher Dots */}
                      <div className="flex items-center justify-center gap-2">
                        {story.lines.map((line, idx) => {
                          const isCurrentScene = focusedSceneIndex === idx;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => void handleReadLine(line, idx)}
                              className={`h-2.5 rounded-full transition-all cursor-pointer ${
                                isCurrentScene
                                  ? 'w-8 bg-sky-500 shadow-xs'
                                  : 'w-2.5 bg-sky-200 hover:bg-sky-300'
                              }`}
                              title={`Scene ${idx + 1}`}
                            />
                          );
                        })}
                      </div>

                      {/* 3D Pushable Read All / Stop Button */}
                      <CoolMode options={STORY_ACTION_COOL_OPTIONS} className="inline-flex w-full justify-center">
                        <button
                          type="button"
                          onClick={() => void handleToggleReadAll()}
                          className="group/read relative w-full max-w-[240px] cursor-pointer border-none bg-transparent p-0 outline-none"
                        >
                          <span
                            className={`pointer-events-none absolute inset-0 translate-y-[4.5px] rounded-2xl ${
                              isPlayingAll ? 'bg-[#be123c]' : 'bg-[#0369a1]'
                            }`}
                          />
                          <span
                            className={`relative w-full py-2.5 sm:py-3 px-5 rounded-2xl border-2 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-[inset_0_2px_2px_rgba(255,255,255,0.6)] transition-transform duration-100 -translate-y-[1.5px] group-hover/read:-translate-y-[3px] group-active/read:translate-y-[3px] ${
                              isPlayingAll
                                ? 'bg-gradient-to-b from-rose-400 via-rose-500 to-rose-600 border-rose-200'
                                : 'bg-gradient-to-b from-[#38bdf8] via-[#0ea5e9] to-[#0284c7] border-[#bae6fd]'
                            }`}
                          >
                            {isPlayingAll ? (
                              <>
                                <Square className="w-4 h-4 fill-white" />
                                <span>Stop Reading</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-5 h-5 stroke-[2.6]" />
                                <span>Read Full Story</span>
                              </>
                            )}
                          </span>
                        </button>
                      </CoolMode>
                    </div>

                    {/* RIGHT PAGE (7 cols): 4 Karaoke Story Sentences + Quiz Time! 3D Button */}
                    <div className="lg:col-span-7 p-4 sm:p-6 lg:pl-8 flex flex-col justify-between gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-extrabold text-sky-700/85 tracking-wide">
                          ✨ Tap any word or line to listen:
                        </span>
                        <span className="text-xs font-bold text-slate-400">
                          {readLines.size} / {story.lines.length} lines read
                        </span>
                      </div>

                      {/* 4 Story Sentence Rows */}
                      <div className="flex flex-col gap-2.5 sm:gap-3">
                        {story.lines.map((line, lineIdx) => {
                          const isActive = activeLineIndex === lineIdx;
                          const isFocused = focusedSceneIndex === lineIdx;
                          const tokens = line.split(' ');

                          return (
                            <div
                              key={lineIdx}
                              onClick={() => void handleReadLine(line, lineIdx)}
                              className={`group/line relative px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-2 ${
                                isActive
                                  ? 'bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border-amber-400 shadow-[0_4px_14px_rgba(251,191,36,0.28)] scale-[1.01]'
                                  : isFocused
                                  ? 'bg-sky-50/75 border-sky-200 hover:border-sky-300'
                                  : 'bg-white border-slate-200/80 hover:border-sky-300 hover:bg-sky-50/40'
                              }`}
                            >
                              {/* Sentence Words with Cleanly Separated Punctuation */}
                              <div className="flex flex-wrap items-baseline gap-x-1.5 sm:gap-x-2 gap-y-1 text-base sm:text-2xl font-bold leading-snug">
                                {tokens.map((rawToken, wIdx) => {
                                  const { leading, word, trailing } =
                                    splitTokenPunctuation(rawToken);
                                  const cleanLower = word.toLowerCase();
                                  const phonicsParts = wordPartsMap[cleanLower];

                                  if (!phonicsParts) {
                                    return (
                                      <span key={wIdx} className="text-slate-700">
                                        {rawToken}
                                      </span>
                                    );
                                  }

                                  return (
                                    <span key={wIdx} className="inline-flex items-baseline">
                                      {leading && (
                                        <span className="text-slate-700">{leading}</span>
                                      )}
                                      <CoolMode
                                        options={STORY_WORD_COOL_OPTIONS}
                                        className="inline-flex"
                                      >
                                        <button
                                          type="button"
                                          onClick={(e) =>
                                            handleWordClick(cleanLower, lineIdx, e)
                                          }
                                          className="px-2 py-0.5 rounded-xl bg-gradient-to-b from-white to-sky-50 border-2 border-sky-200 shadow-[0_2px_0_#bae6fd] hover:border-amber-300 hover:scale-108 active:translate-y-[1px] transition-all cursor-pointer font-black"
                                          title={`Tap to hear "${cleanLower}"`}
                                        >
                                          <span className="text-[#e11d48]">
                                            {phonicsParts.onset}
                                          </span>
                                          <span className="text-[#0284c7]">
                                            {phonicsParts.rime}
                                          </span>
                                        </button>
                                      </CoolMode>
                                      {trailing && (
                                        <span className="text-slate-700 ml-0.5">
                                          {trailing}
                                        </span>
                                      )}
                                    </span>
                                  );
                                })}
                              </div>

                              {/* Mini 3D Line Speaker Button */}
                              <span
                                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border transition-all ${
                                  isActive
                                    ? 'bg-amber-400 text-amber-950 border-amber-300 scale-110 shadow-xs'
                                    : 'bg-sky-50 text-sky-600 border-sky-200/80 group-hover/line:bg-sky-100 group-hover/line:scale-105'
                                }`}
                              >
                                <Volume2 className="w-4 h-4 stroke-[2.5]" />
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Bottom-Right Page Footer: Flip to Reading Quiz */}
                      <div className="flex items-center justify-end pt-1">
                        <CoolMode options={STORY_ACTION_COOL_OPTIONS} className="inline-flex">
                          <button
                            type="button"
                            onClick={handleOpenQuiz}
                            className="group/quiz relative inline-flex cursor-pointer border-none bg-transparent p-0 outline-none"
                          >
                            <span className="pointer-events-none absolute inset-0 translate-y-[4.5px] rounded-2xl bg-[#b45309]" />
                            <span className="relative inline-flex items-center gap-2 rounded-2xl bg-gradient-to-b from-[#fde047] via-[#fbbf24] to-[#f59e0b] border-2 border-[#fef9c3] text-amber-950 px-5 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-black shadow-[inset_0_2px_2px_rgba(255,255,255,0.85),0_6px_18px_rgba(245,158,11,0.3)] transition-transform duration-100 -translate-y-[1.5px] group-hover/quiz:-translate-y-[3px] group-active/quiz:translate-y-[3px]">
                              <Sparkles className="w-4 h-4 text-amber-800" />
                              <span>Quiz Time! 🌟</span>
                            </span>
                          </button>
                        </CoolMode>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  /* =============================================================== */
                  /* SPREAD B: READING COMPREHENSION QUIZ PAGE (100% English Prompt) */
                  /* =============================================================== */
                  <motion.div
                    key="quiz-page"
                    initial={{ opacity: 0, x: 36, scale: 0.98 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                    className="p-4 sm:p-8 bg-gradient-to-b from-[#f8fbff] via-[#fffdf9] to-[#fefce8] flex flex-col items-center"
                  >
                    {/* Quiz Page Top Controls */}
                    <div className="w-full flex items-center justify-between mb-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
                          setMode('story');
                          playPopSound();
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Story</span>
                      </button>

                      <span className="px-3.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-xs sm:text-sm font-black">
                        🌟 Story Quiz
                      </span>
                    </div>

                    {/* Question Row (100% English + Audio Speaker) */}
                    <div className="flex items-center justify-center gap-3 my-2 sm:my-3 text-center">
                      <h3 className="text-xl sm:text-3xl font-black text-slate-800">
                        {compQ.question}
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          playPopSound();
                          void playSpokenText(compQ.question);
                        }}
                        className="w-10 h-10 rounded-2xl bg-gradient-to-b from-sky-400 to-sky-600 text-white border-2 border-sky-200 shadow-[0_3px_0_#0369a1] active:translate-y-[2px] flex items-center justify-center flex-shrink-0 cursor-pointer"
                        title="Listen to question"
                      >
                        <Volume2 className="w-5 h-5" />
                      </button>
                    </div>

                    {/* 2x2 3D Pushable Answer Options */}
                    <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 mt-3">
                      {compQ.options.map((opt) => {
                        const isSelected = selectedAnswer === opt;
                        const isCorrectOpt = isSelected && isAnswerCorrect === true;
                        const isWrongOpt = isSelected && isAnswerCorrect === false;

                        return (
                          <motion.div
                            key={opt}
                            animate={
                              isWrongOpt
                                ? { x: [0, -10, 10, -7, 7, 0] }
                                : isCorrectOpt
                                ? { scale: 1.03 }
                                : { scale: 1 }
                            }
                            transition={{ duration: 0.4 }}
                          >
                            <button
                              type="button"
                              onClick={() => handleAnswerClick(opt)}
                              disabled={selectedAnswer !== null && isAnswerCorrect === true}
                              className="group/opt relative w-full cursor-pointer border-none bg-transparent p-0 outline-none text-left"
                            >
                              <span
                                className={`pointer-events-none absolute inset-0 translate-y-[4px] rounded-2xl ${
                                  isCorrectOpt
                                    ? 'bg-[#047857]'
                                    : isWrongOpt
                                    ? 'bg-[#be123c]'
                                    : 'bg-[#bae6fd]'
                                }`}
                              />
                              <span
                                className={`relative w-full px-5 py-3.5 sm:py-4 rounded-2xl border-2 font-black text-base sm:text-xl flex items-center justify-between transition-transform duration-100 -translate-y-[1px] group-hover/opt:enabled:-translate-y-[2.5px] group-active/opt:enabled:translate-y-[3px] ${
                                  isCorrectOpt
                                    ? 'bg-gradient-to-b from-emerald-400 to-emerald-600 border-emerald-200 text-white shadow-md'
                                    : isWrongOpt
                                    ? 'bg-gradient-to-b from-rose-400 to-rose-600 border-rose-200 text-white'
                                    : 'bg-white hover:bg-sky-50/70 border-sky-200 text-slate-800'
                                }`}
                              >
                                <span>{opt}</span>
                                {isCorrectOpt && (
                                  <CheckCircle2 className="w-6 h-6 text-white flex-shrink-0" />
                                )}
                              </span>
                            </button>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Praise + Bilingual Explanation Banner (~1.6s before Celebration Modal) */}
                    <AnimatePresence>
                      {isAnswerCorrect === true && (
                        <motion.div
                          initial={{ opacity: 0, y: 12, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0 }}
                          className="w-full max-w-2xl mt-5 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 border-2 border-emerald-300 shadow-sm text-left font-sans"
                        >
                          <p className="text-sm sm:text-base font-black text-emerald-700 mb-1 font-fredoka">
                            🎉 Awesome! You got it right!
                          </p>
                          <p className="text-xs sm:text-sm font-bold text-slate-700">
                            <span className="text-sky-700 font-black">[EN]</span>{' '}
                            {parsedExplanation.en}
                          </p>
                          <p className="text-xs sm:text-sm font-bold text-slate-600 mt-0.5">
                            <span className="text-emerald-700 font-black">[VI]</span>{' '}
                            {parsedExplanation.vi}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </main>
      ) : (
        /* ========================================================================= */
        /* 3. DESTINATION STATION CELEBRATION (+20 XP - Final Station Complete!)     */
        /* ========================================================================= */
        <main className="relative z-20 flex-1 w-full flex flex-col items-center justify-center px-4 py-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-md rounded-[34px] border-3 border-sky-300 p-7 sm:p-8 shadow-[0_10px_0_#7dd3fc,0_24px_50px_rgba(2,132,199,0.22)] flex flex-col items-center text-center animate-in zoom-in-95 font-fredoka overflow-hidden">
            <ShineBorder
              borderWidth={3}
              duration={12}
              shineColor={['#38BDF8', '#FBBF24', '#F472B6']}
            />

            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-orange-500 text-white flex items-center justify-center text-4xl shadow-lg mb-4 animate-bounce border-3 border-white">
              🏆
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
              Chinh Phục Đích Đến Trạm 4!
            </h3>
            <p className="text-sm sm:text-base text-slate-600 max-w-md mb-5 font-sans">
              Bé đã đọc trọn vẹn câu chuyện <strong>&ldquo;{story.title}&rdquo;</strong> và trả lời xuất sắc câu hỏi đọc hiểu!
            </p>

            <div className="flex items-center gap-2.5 bg-amber-50 px-5 py-2.5 rounded-2xl border-2 border-amber-200 mb-6">
              <Star className="w-6 h-6 fill-amber-400 text-amber-500" />
              <span className="font-black text-amber-700 text-lg">
                +20 XP &amp; Hoàn Thành Trạm Đích
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleReplayStory}
                className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Đọc lại truyện</span>
              </button>

              {onClose && (
                <CoolMode options={STORY_ACTION_COOL_OPTIONS} className="inline-flex">
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
