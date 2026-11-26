'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Volume2,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Maximize,
  Minimize,
  Star,
  RotateCcw,
  Trophy,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { PHONICS_DAY_1_DATA, PhonicsDayData } from '@/lib/phonics-45-days-units';
import {
  playPopSound,
  playCorrectSound,
  playCheerSound,
  playSpokenText,
  triggerConfetti,
} from './PhonicsAudioEffects';
import { PhonicsWordIllustration } from './PhonicsWordIllustrations';
import { Particles } from '@/components/ui/particles';
import { ShineBorder } from '@/components/ui/shine-border';
import { CoolMode, type CoolParticleOptions } from '@/components/ui/cool-mode';
import { Dock, DockWaveItem } from '@/components/ui/dock';

export interface PhonicsFlashcardsStationProps {
  dayData?: PhonicsDayData;
  onComplete: (xp: number) => void;
  isAlreadyCompleted?: boolean;
  onClose?: () => void;
}

const FLASHCARD_COOL_OPTIONS: CoolParticleOptions = {
  particles: ['⭐', '✨', '🌟', '🌿'],
  particleCount: 7,
  size: 20,
};

function fireFlashcardConfetti(particleCount = 90) {
  try {
    confetti({
      particleCount,
      spread: 80,
      origin: { y: 0.58 },
      zIndex: 9999,
    });
  } catch {
    triggerConfetti();
  }
}

/**
 * Highlights the target word inside the English example sentence.
 */
function renderHighlightedSentence(sentence: string, targetWord: string) {
  const escaped = targetWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(\\b${escaped}\\b)`, 'gi');
  const parts = sentence.split(regex);

  return parts.map((part, idx) => {
    if (part.toLowerCase() === targetWord.toLowerCase()) {
      return (
        <span
          key={idx}
          className="inline-block px-2 py-0.5 mx-0.5 rounded-lg bg-rose-100 text-rose-600 font-black border border-rose-200 shadow-2xs"
        >
          {part}
        </span>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

export function PhonicsFlashcardsStation({
  dayData = PHONICS_DAY_1_DATA,
  onComplete,
  isAlreadyCompleted = false,
  onClose,
}: PhonicsFlashcardsStationProps) {
  const words = dayData.words;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1);
  const [reviewedIndices, setReviewedIndices] = useState<Set<number>>(
    () => new Set([0])
  );
  const [mode, setMode] = useState<'study' | 'completed'>('study');
  const [hasAwardedXp, setHasAwardedXp] = useState(isAlreadyCompleted);
  const [isSpeakingWord, setIsSpeakingWord] = useState(false);
  const [isSpeakingSentence, setIsSpeakingSentence] = useState(false);
  const [isBouncingArt, setIsBouncingArt] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const speakGenerationRef = useRef(0);

  const currentWord = words[currentIndex] || words[0];
  const isLastCard = currentIndex === words.length - 1;

  // Listen to browser fullscreen changes
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

  const speakWordWithBounce = useCallback(async (wordText: string) => {
    const gen = ++speakGenerationRef.current;
    setIsSpeakingSentence(false);
    setIsSpeakingWord(true);
    setIsBouncingArt(true);

    const bounceTimer = setTimeout(() => {
      if (speakGenerationRef.current === gen) {
        setIsBouncingArt(false);
      }
    }, 650);

    try {
      await playSpokenText(wordText);
    } catch {
      // Ignore autoplay errors
    } finally {
      clearTimeout(bounceTimer);
      if (speakGenerationRef.current === gen) {
        setIsSpeakingWord(false);
        setIsBouncingArt(false);
      }
    }
  }, []);

  // Auto-play pronunciation on initial card & whenever currentIndex changes in study mode
  useEffect(() => {
    if (mode !== 'study') return;
    const targetWord = words[currentIndex]?.word;
    if (!targetWord) return;

    const timer = setTimeout(() => {
      void speakWordWithBounce(targetWord);
    }, 320);

    return () => {
      clearTimeout(timer);
    };
  }, [currentIndex, mode, words, speakWordWithBounce]);

  const handlePlayWord = () => {
    playPopSound();
    void speakWordWithBounce(currentWord.word);
  };

  const handlePlaySentence = async () => {
    const gen = ++speakGenerationRef.current;
    playPopSound();
    setIsSpeakingWord(false);
    setIsSpeakingSentence(true);
    try {
      await playSpokenText(currentWord.exampleSentence);
    } catch {
      // Ignore audio errors
    } finally {
      if (speakGenerationRef.current === gen) {
        setIsSpeakingSentence(false);
      }
    }
  };

  const goToCard = (targetIdx: number) => {
    if (targetIdx < 0 || targetIdx >= words.length || targetIdx === currentIndex) {
      if (targetIdx === currentIndex) {
        handlePlayWord();
      }
      return;
    }
    setSlideDirection(targetIdx > currentIndex ? 1 : -1);
    setCurrentIndex(targetIdx);
    setReviewedIndices((prev) => new Set([...prev, targetIdx]));
    playPopSound();
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      goToCard(currentIndex - 1);
    }
  };

  const handleNextOrFinish = () => {
    if (!isLastCard) {
      goToCard(currentIndex + 1);
      return;
    }

    // Completed 7/7 station! Celebrate + award +10 XP!
    speakGenerationRef.current += 1;
    playCorrectSound();
    playCheerSound();
    fireFlashcardConfetti(110);
    if (!hasAwardedXp) {
      setHasAwardedXp(true);
    }
    onComplete(10);
    setMode('completed');
  };

  return (
    <div className="fixed inset-0 z-50 w-screen h-screen overflow-hidden flex flex-col justify-between select-none font-sans bg-gradient-to-br from-[#d9f9ee] via-[#f4fce8] to-[#fff6db]">
      {/* Fredoka Display Typography */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700;900&display=swap');
        .font-fredoka {
          font-family: 'Fredoka', 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
      `}</style>

      {/* Soft Ambient Pastel Glow Blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-emerald-300/30 blur-3xl" />
      <div className="pointer-events-none absolute top-1/4 -right-24 w-[420px] h-[420px] rounded-full bg-amber-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 w-[460px] h-80 rounded-full bg-teal-200/35 blur-3xl" />

      {/* Magic UI Twinkling Pastel Particles */}
      <Particles
        className="absolute inset-0 z-0"
        quantity={55}
        staticity={40}
        ease={60}
        size={1.6}
        color="#10b981"
      />
      <Particles
        className="absolute inset-0 z-0"
        quantity={35}
        staticity={50}
        ease={65}
        size={1.8}
        color="#f59e0b"
      />

      {/* ========================================================================= */}
      {/* 1. CLEAN FLOATING TOP BAR (Matches Station 1 Minimalist Header)           */}
      {/* ========================================================================= */}
      <header className="relative z-30 w-full px-3 py-2.5 sm:px-6 sm:py-3.5 flex items-center justify-between bg-transparent flex-shrink-0">
        {/* Left: Back to Map */}
        <div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-2xl bg-white/95 hover:bg-white text-slate-700 font-bold text-xs sm:text-sm flex items-center gap-1.5 border-2 border-emerald-100 shadow-[0_3px_0_#a7f3d0,0_6px_14px_rgba(16,185,129,0.1)] active:translate-y-[2px] active:shadow-[0_1px_0_#a7f3d0] transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Quay lại Bản đồ</span>
              <span className="sm:hidden">Bản đồ</span>
            </button>
          )}
        </div>

        {/* Center: Compact Glass Card Counter */}
        {mode === 'study' && (
          <div className="px-4 py-1.5 rounded-full bg-white/85 backdrop-blur-md border-2 border-white shadow-[0_4px_14px_rgba(16,185,129,0.12)] flex items-center gap-2 font-fredoka">
            <span className="text-base leading-none">🃏</span>
            <span className="text-xs sm:text-sm font-black text-emerald-800 tracking-wide">
               Card {currentIndex + 1} / {words.length}
            </span>
          </div>
        )}

        {/* Right: Fullscreen Toggle */}
        <div>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-2xl bg-white/95 hover:bg-white text-slate-700 font-bold text-xs sm:text-sm flex items-center gap-1.5 border-2 border-emerald-100 shadow-[0_3px_0_#a7f3d0,0_6px_14px_rgba(16,185,129,0.1)] active:translate-y-[2px] active:shadow-[0_1px_0_#a7f3d0] transition-all cursor-pointer"
            title="Bật/Tắt Toàn Màn Hình"
          >
            {isFullscreen ? (
              <Minimize className="w-4 h-4 text-emerald-600" />
            ) : (
              <Maximize className="w-4 h-4 text-emerald-600" />
            )}
            <span className="hidden sm:inline">
              {isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
            </span>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN SINGLE-SIDED 3D STACKED FLASHCARD STAGE (Cách 2C)                 */}
      {/* ========================================================================= */}
      {mode === 'study' && (
        <main className="relative z-10 flex-1 w-full flex flex-col items-center justify-center px-4 py-1 min-h-0">
          <div className="relative w-full max-w-xl">
            {/* Uiverse Stacked Toy Deck Background Layers */}
            <div className="pointer-events-none absolute inset-0 translate-y-3.5 -rotate-[2.2deg] scale-[0.96] rounded-[36px] bg-gradient-to-b from-amber-50 to-amber-100/90 border-2 border-amber-200/90 shadow-[0_6px_0_#fcd34d]" />
            <div className="pointer-events-none absolute inset-0 translate-y-2 rotate-[1.8deg] scale-[0.98] rounded-[36px] bg-gradient-to-b from-emerald-50 to-teal-100/90 border-2 border-emerald-200/90 shadow-[0_6px_0_#6ee7b7]" />

            {/* Animated Active Card */}
            <AnimatePresence mode="wait" custom={slideDirection}>
              <motion.div
                key={currentWord.word}
                custom={slideDirection}
                initial={{ opacity: 0, x: slideDirection * 48, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: slideDirection * -48, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                className="relative w-full rounded-[34px] sm:rounded-[38px] bg-gradient-to-b from-[#ffffff] via-[#ffffff] to-[#f7fefb] border-3 border-white shadow-[0_10px_0_#6ee7b7,0_22px_50px_rgba(16,185,129,0.18)] px-5 py-5 sm:px-8 sm:py-6 flex flex-col items-center justify-between gap-3 sm:gap-4 overflow-hidden"
              >
                <ShineBorder
                  borderWidth={3}
                  duration={14}
                  shineColor={['#34D399', '#FBBF24', '#F472B6']}
                />

                {/* Top Specular Gloss Arc */}
                <div className="pointer-events-none absolute inset-x-6 top-1.5 h-8 rounded-t-3xl bg-gradient-to-b from-emerald-50/70 to-transparent" />

                {/* 1. ILLUSTRATION SHOWCASE POD */}
                <div
                  onClick={handlePlayWord}
                  className={`relative z-10 w-36 h-36 sm:w-44 sm:h-44 rounded-[30px] bg-gradient-to-b from-[#ecfdf5] via-[#f0fdfa] to-[#fefce8] border-2 border-emerald-100/90 shadow-[inset_0_3px_8px_rgba(255,255,255,0.95),0_6px_18px_rgba(16,185,129,0.1)] flex items-center justify-center cursor-pointer transition-transform duration-300 ${
                    isBouncingArt
                      ? 'scale-110 -translate-y-1.5'
                      : 'hover:scale-105'
                  }`}
                  title={`Tap to listen: "${currentWord.word}"`}
                >
                  <PhonicsWordIllustration word={currentWord.word} size={150} />
                </div>

                {/* 2. GIANT COLOR-CODED WORD + IPA + 3D WORD SPEAKER */}
                <div className="relative z-10 flex flex-col items-center font-fredoka">
                  <div className="flex items-center justify-center gap-3 sm:gap-4">
                    <button
                      type="button"
                      onClick={handlePlayWord}
                      className="text-5xl sm:text-6xl font-black tracking-wide leading-none cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                    >
                      <span className="text-[#f43f5e] drop-shadow-[0_3px_0_rgba(244,63,94,0.18)]">
                        {currentWord.onset}
                      </span>
                      <span className="text-[#059669] drop-shadow-[0_3px_0_rgba(5,150,105,0.18)]">
                        {currentWord.rime}
                      </span>
                    </button>

                    {/* 3D Pushable Word Speaker Button */}
                    <CoolMode options={FLASHCARD_COOL_OPTIONS} className="inline-flex">
                      <button
                        type="button"
                        onClick={handlePlayWord}
                        className="group/spk relative w-11 h-11 sm:w-12 sm:h-12 cursor-pointer border-none bg-transparent p-0 outline-none"
                        title="Listen to word"
                      >
                        <span className="pointer-events-none absolute inset-0 translate-y-[4px] rounded-2xl bg-[#047857]" />
                        <span
                          className={`relative w-full h-full rounded-2xl bg-gradient-to-b from-[#34d399] via-[#10b981] to-[#059669] border-2 border-[#a7f3d0] text-white flex items-center justify-center shadow-[inset_0_2px_2px_rgba(255,255,255,0.6)] transition-transform duration-100 -translate-y-[1px] group-hover/spk:-translate-y-[2px] group-active/spk:translate-y-[3px] ${
                            isSpeakingWord ? 'ring-3 ring-emerald-300 scale-105' : ''
                          }`}
                        >
                          <Volume2 className="w-5 h-5 sm:w-5.5 sm:h-5.5 stroke-[2.6]" />
                        </span>
                      </button>
                    </CoolMode>
                  </div>

                  <span className="mt-1.5 px-3 py-0.5 rounded-full bg-slate-100/90 text-slate-500 font-sans font-bold text-xs sm:text-sm border border-slate-200/70">
                    {currentWord.ipa}
                  </span>
                </div>

                {/* 3. EXAMPLE SENTENCE PILL BOX (All on 1 Side - Cách 2C!) */}
                <div
                  onClick={handlePlaySentence}
                  className="relative z-10 w-full rounded-2xl sm:rounded-[22px] bg-gradient-to-r from-[#f0fdf4] via-[#fefce8] to-[#ecfdf5] border-2 border-emerald-200/85 px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between gap-3 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),0_4px_12px_rgba(16,185,129,0.08)] cursor-pointer hover:border-emerald-300 transition-colors"
                  title="Tap to listen to the example sentence"
                >
                  <p className="flex-1 text-sm sm:text-base font-bold text-slate-700 leading-snug text-left font-fredoka">
                    &ldquo;
                    {renderHighlightedSentence(
                      currentWord.exampleSentence,
                      currentWord.word
                    )}
                    &rdquo;
                  </p>

                  {/* 3D Pushable Sentence Speaker Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handlePlaySentence();
                    }}
                    className="group/sent relative w-10 h-10 sm:w-11 sm:h-11 flex-shrink-0 cursor-pointer border-none bg-transparent p-0 outline-none"
                    title="Listen to sentence"
                  >
                    <span className="pointer-events-none absolute inset-0 translate-y-[3.5px] rounded-xl bg-[#b45309]" />
                    <span
                      className={`relative w-full h-full rounded-xl bg-gradient-to-b from-[#fcd34d] via-[#fbbf24] to-[#f59e0b] border-2 border-[#fef08a] text-amber-950 flex items-center justify-center shadow-[inset_0_2px_1px_rgba(255,255,255,0.75)] transition-transform duration-100 -translate-y-[1px] group-hover/sent:-translate-y-[2px] group-active/sent:translate-y-[2.5px] ${
                        isSpeakingSentence ? 'ring-3 ring-amber-300 scale-105' : ''
                      }`}
                    >
                      <Volume2 className="w-4.5 h-4.5 sm:w-5 sm:h-5 stroke-[2.6]" />
                    </span>
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: CELEBRATION SCREEN (+10 XP - Matches Station 1 Celebration)       */}
      {/* ========================================================================= */}
      {mode === 'completed' && (
        <main className="relative z-20 flex-1 w-full flex flex-col items-center justify-center px-4">
          <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-md rounded-[34px] border-3 border-emerald-300 p-7 sm:p-8 shadow-[0_10px_0_#6ee7b7,0_24px_50px_rgba(16,185,129,0.2)] flex flex-col items-center text-center animate-in zoom-in-95 font-fredoka overflow-hidden">
            <ShineBorder
              borderWidth={3}
              duration={12}
              shineColor={['#34D399', '#FBBF24', '#F472B6']}
            />

            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-orange-500 text-white flex items-center justify-center text-4xl shadow-lg mb-4 animate-bounce border-3 border-white">
              🏆
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
              Tuyệt vời! Bé Đã Hoàn Thành Trạm 2!
            </h3>
            <p className="text-sm sm:text-base text-slate-600 max-w-md mb-6 font-sans">
              Bé đã học và nghe trọn vẹn cả{' '}
              <strong>
                {words.length}/{words.length} thẻ từ vựng hoạt hình
              </strong>{' '}
              của bài <strong>{dayData.title}</strong> cùng câu ví dụ!
            </p>

            <div className="flex items-center gap-2.5 bg-amber-50 px-5 py-2.5 rounded-2xl border-2 border-amber-200 mb-6">
              <Star className="w-6 h-6 fill-amber-400 text-amber-500" />
              <span className="font-black text-amber-700 text-lg">
                +10 XP & Mở Khóa Trạm Kế Tiếp
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSlideDirection(-1);
                  setCurrentIndex(0);
                  setMode('study');
                  playPopSound();
                }}
                className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Xem lại bộ thẻ</span>
              </button>

              {onClose && (
                <CoolMode options={FLASHCARD_COOL_OPTIONS} className="inline-flex">
                  <button
                    type="button"
                    onClick={onClose}
                    className="group/done relative inline-flex cursor-pointer border-none bg-transparent p-0 outline-none"
                  >
                    <span className="pointer-events-none absolute inset-0 translate-y-[4px] rounded-full bg-[#047857]" />
                    <span className="relative px-6 py-2.5 rounded-full bg-gradient-to-b from-[#34d399] via-[#10b981] to-[#059669] border-2 border-[#a7f3d0] text-white font-black text-sm shadow-[inset_0_2px_2px_rgba(255,255,255,0.5)] transition-transform duration-100 -translate-y-[1px] group-hover/done:-translate-y-[2px] group-active/done:translate-y-[3px]">
                      Trở về Bản đồ ➔
                    </span>
                  </button>
                </CoolMode>
              )}
            </div>
          </div>
        </main>
      )}

      {/* ========================================================================= */}
      {/* 3. BOTTOM NAVIGATION BAR: 3D PREV + MINI WORD DOCK + 3D NEXT/FINISH       */}
      {/* ========================================================================= */}
      {mode === 'study' && (
        <footer className="relative z-20 w-full flex-shrink-0 px-3 pt-2 pb-4 sm:px-8 sm:pb-5 flex items-center justify-center">
          <div className="w-full max-w-4xl flex items-center justify-between gap-2 sm:gap-4 font-fredoka">
            {/* LEFT: 3D Pushable PREV Button */}
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="group/prev relative inline-flex cursor-pointer select-none border-none bg-transparent p-0 outline-none disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              <span className="pointer-events-none absolute inset-0 translate-y-[4px] rounded-2xl bg-[#94a3b8]" />
              <span className="relative inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-b from-white to-slate-100 border-2 border-white text-slate-700 px-4 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-black shadow-[inset_0_2px_2px_rgba(255,255,255,0.9)] transition-transform duration-100 -translate-y-[1px] group-hover/prev:enabled:-translate-y-[2px] group-active/prev:enabled:translate-y-[3px]">
                <ChevronLeft className="w-4 h-4 stroke-[2.8]" />
                <span>Trước</span>
              </span>
            </button>

            {/* CENTER: Enlarged 7 Word Pills with macOS Wave Dock */}
            <Dock
              iconDistance={135}
              direction="bottom"
              className="hidden sm:flex h-auto bg-white/85 backdrop-blur-md border-2 border-white rounded-[24px] px-3.5 py-2.5 md:px-4 md:py-3 shadow-[0_8px_24px_rgba(16,185,129,0.14),inset_0_2px_4px_rgba(255,255,255,0.95)] gap-2 md:gap-3 overflow-visible"
            >
              {words.map((w, idx) => {
                const isActive = idx === currentIndex;
                const isSeen = reviewedIndices.has(idx);

                return (
                  <DockWaveItem
                    key={w.word}
                    maxScale={1.18}
                    maxLift={7}
                    className="hover:z-20"
                  >
                    <button
                      type="button"
                      onClick={() => goToCard(idx)}
                      className={`relative px-3.5 py-2 md:px-4.5 md:py-2.5 rounded-2xl text-sm md:text-base font-black tracking-wide transition-all cursor-pointer select-none flex items-center gap-1 ${
                        isActive
                          ? 'bg-gradient-to-b from-[#34d399] via-[#10b981] to-[#059669] text-white border-2 border-[#a7f3d0] shadow-[0_4px_0_#047857,0_6px_14px_rgba(16,185,129,0.3)] -translate-y-0.5'
                          : isSeen
                          ? 'bg-gradient-to-b from-[#f0fdf4] to-[#dcfce7] text-emerald-800 border-2 border-emerald-200 shadow-[0_3px_0_#86efac] hover:bg-emerald-50 active:translate-y-[2px] active:shadow-none'
                          : 'bg-gradient-to-b from-white to-slate-100 text-slate-600 border-2 border-slate-200/90 shadow-[0_3px_0_#cbd5e1] hover:bg-white active:translate-y-[2px] active:shadow-none'
                      }`}
                    >
                      <span>{w.word}</span>
                      {isSeen && !isActive && (
                        <span className="text-xs font-black text-emerald-600">✓</span>
                      )}
                    </button>
                  </DockWaveItem>
                );
              })}
            </Dock>

            {/* Mobile compact dots fallback */}
            <div className="flex sm:hidden items-center gap-1.5">
              {words.map((w, idx) => (
                <button
                  key={w.word}
                  type="button"
                  onClick={() => goToCard(idx)}
                  className={`h-2.5 rounded-full transition-all cursor-pointer ${
                    idx === currentIndex
                      ? 'w-7 bg-emerald-500'
                      : reviewedIndices.has(idx)
                      ? 'w-2.5 bg-emerald-300'
                      : 'w-2.5 bg-white/80'
                  }`}
                />
              ))}
            </div>

            {/* RIGHT: 3D Pushable NEXT ▶ or GOLDEN FINISH 🏆 Button */}
            <CoolMode options={FLASHCARD_COOL_OPTIONS} className="inline-flex flex-shrink-0">
              <button
                type="button"
                onClick={handleNextOrFinish}
                className="group/next relative inline-flex cursor-pointer select-none border-none bg-transparent p-0 outline-none"
              >
                {/* 3D Extruded Base */}
                <span
                  className={`pointer-events-none absolute inset-0 translate-y-[4.5px] rounded-2xl ${
                    isLastCard ? 'bg-[#b45309]' : 'bg-[#047857]'
                  }`}
                />

                {/* 3D Pushable Front */}
                <span
                  className={`relative inline-flex items-center gap-1.5 rounded-2xl px-4 py-2.5 sm:px-6 sm:py-3 text-xs sm:text-sm font-black border-2 transition-transform duration-100 -translate-y-[1.5px] group-hover/next:-translate-y-[3px] group-active/next:translate-y-[3px] overflow-hidden ${
                    isLastCard
                      ? 'bg-gradient-to-b from-[#fde047] via-[#fbbf24] to-[#f59e0b] border-[#fef9c3] text-amber-950 shadow-[inset_0_2px_2px_rgba(255,255,255,0.85),0_0_20px_rgba(251,191,36,0.55)]'
                      : 'bg-gradient-to-b from-[#34d399] via-[#10b981] to-[#059669] border-[#a7f3d0] text-white shadow-[inset_0_2px_2px_rgba(255,255,255,0.55)]'
                  }`}
                >
                  <span className="pointer-events-none absolute inset-x-2 top-0.5 h-[40%] rounded-t-xl bg-gradient-to-b from-white/50 to-transparent" />
                  {isLastCard ? (
                    <>
                      <Trophy className="relative z-10 w-4 h-4 stroke-[2.6]" />
                      <span className="relative z-10">Hoàn thành 🏆</span>
                    </>
                  ) : (
                    <>
                      <span className="relative z-10">Tiếp</span>
                      <ChevronRight className="relative z-10 w-4 h-4 stroke-[2.8]" />
                    </>
                  )}
                </span>
              </button>
            </CoolMode>
          </div>
        </footer>
      )}
    </div>
  );
}
