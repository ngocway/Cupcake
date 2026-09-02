'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import {
  RotateCcw,
  Volume2,
  VolumeX,
  Trophy,
  Clock,
  Sparkles,
  Star,
  ArrowLeft,
  ArrowRight,
  Layers,
  CheckCircle2,
  Cat,
  Dog,
  Rocket,
  Bot,
  Crown,
  Heart,
  Moon,
  Sun,
  Apple,
  Gem,
  Music,
  Trees,
  Flower2,
  Gift,
  Smile,
  Pencil,
  Pizza,
  Loader2,
} from 'lucide-react';
import { getMatchImageTextGameDetailsAction } from '@/actions/match-image-text-actions';

// Path constant for ocean_ui_web assets
const ASSET_PATH = '/images/assest/ocean_ui_web/assets';

// Teacher Card Interface
export interface TeacherCardData {
  pairId: number | string;
  name: string;
  word?: string;
  imageUrl?: string;
  imageBUrl?: string;
  audioUrl?: string;
  cardType?: 'IMAGE' | 'TEXT';
  icon?: React.ElementType;
  bgGradient?: string;
  textColor?: string;
  borderColor?: string;
}

// Default Fallback Vocabulary Cards
const DEFAULT_TEACHER_CARDS: TeacherCardData[] = [
  { pairId: 1, name: 'Clownfish', icon: Cat, bgGradient: 'from-amber-100 to-orange-200', textColor: 'text-amber-950', borderColor: 'border-amber-300' },
  { pairId: 2, name: 'Dolphin', icon: Dog, bgGradient: 'from-sky-100 to-blue-200', textColor: 'text-sky-950', borderColor: 'border-sky-300' },
  { pairId: 3, name: 'Sea Turtle', icon: Rocket, bgGradient: 'from-emerald-100 to-green-200', textColor: 'text-emerald-950', borderColor: 'border-emerald-300' },
  { pairId: 4, name: 'Octopus', icon: Bot, bgGradient: 'from-purple-100 to-pink-200', textColor: 'text-purple-950', borderColor: 'border-purple-300' },
  { pairId: 5, name: 'Jellyfish', icon: Crown, bgGradient: 'from-fuchsia-100 to-rose-200', textColor: 'text-fuchsia-950', borderColor: 'border-fuchsia-300' },
  { pairId: 6, name: 'Starfish', icon: Heart, bgGradient: 'from-pink-100 to-amber-200', textColor: 'text-rose-950', borderColor: 'border-rose-300' },
  { pairId: 7, name: 'Seahorse', icon: Star, bgGradient: 'from-yellow-100 to-amber-200', textColor: 'text-amber-950', borderColor: 'border-yellow-300' },
  { pairId: 8, name: 'Blue Whale', icon: Moon, bgGradient: 'from-blue-100 to-indigo-200', textColor: 'text-blue-950', borderColor: 'border-blue-300' },
];

interface CardItem {
  id: string;
  pairId: string | number;
  name: string;
  word?: string;
  imageUrl?: string;
  cardType: 'IMAGE' | 'TEXT';
  audioUrl?: string;
  icon?: React.ElementType;
  bgGradient: string;
  textColor: string;
  borderColor: string;
  isFlipped: boolean;
  isMatched: boolean;
  isShaking?: boolean;
}

interface ParticleFx {
  id: number;
  text: string;
  x: number;
  y: number;
}

interface GameRoundData {
  roundIndex: number;
  title: string;
  pairs: Array<{
    id: string;
    word: string;
    imageUrl?: string;
    imageBUrl?: string;
    labelB?: string;
    audioUrl?: string;
  }>;
}

// Sound Synthesizer for Bubble Pop SFX & Ocean Melodies
class OceanSoundSynthesizer {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playBubblePop() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1350, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {
      // Audio fallback
    }
  }

  playMatch() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.06);

        gain.gain.setValueAtTime(0.2, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.25);
      });
    } catch {
      // Audio fallback
    }
  }

  playMismatch() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.linearRampToValueAtTime(190, now + 0.2);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch {
      // Audio fallback
    }
  }

  playWin() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
      notes.forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.09);

        gain.gain.setValueAtTime(0.25, now + i * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + i * 0.09);
        osc.stop(now + i * 0.09 + 0.4);
      });
    } catch {
      // Audio fallback
    }
  }
}

function MemoryGameContent() {
  const searchParams = useSearchParams();
  const topicId = searchParams.get('topicId');

  const [isLoadingTopic, setIsLoadingTopic] = useState(Boolean(topicId));
  const [topicTitle, setTopicTitle] = useState('Ghép Hình Đại Dương');
  const [isImageImageMode, setIsImageImageMode] = useState(false);
  const [rounds, setRounds] = useState<GameRoundData[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState<number>(0);

  const [deck, setDeck] = useState<CardItem[]>([]);
  const [flippedIds, setFlippedIds] = useState<string[]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [matchedCount, setMatchedCount] = useState<number>(0);
  const [seconds, setSeconds] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isRoundWon, setIsRoundWon] = useState<boolean>(false);
  const [isGameWon, setIsGameWon] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(3);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [streak, setStreak] = useState<number>(0);

  const [particles, setParticles] = useState<ParticleFx[]>([]);
  const soundRef = useRef<OceanSoundSynthesizer | null>(null);
  const nextRoundTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Sound synthesizer
  useEffect(() => {
    soundRef.current = new OceanSoundSynthesizer();
  }, []);

  // Update sound state
  useEffect(() => {
    if (soundRef.current) {
      soundRef.current.enabled = soundEnabled;
    }
  }, [soundEnabled]);

  // Load Topic Data if topicId exists
  useEffect(() => {
    const defaultRound: GameRoundData = {
      roundIndex: 0,
      title: 'Vòng 1',
      pairs: DEFAULT_TEACHER_CARDS.map((c) => ({
        id: `default-${c.pairId}`,
        word: c.name,
        imageUrl: c.imageUrl,
      })),
    };

    if (!topicId) {
      setRounds([defaultRound]);
      setIsLoadingTopic(false);
      return;
    }

    async function loadTopic() {
      setIsLoadingTopic(true);
      const res = await getMatchImageTextGameDetailsAction(topicId!);
      if (res.success && res.topic) {
        setTopicTitle(res.topic.title || 'Game Lật Ảnh');

        const titleLower = (res.topic.title || '').toLowerCase();
        const isImgImg = Boolean(
          titleLower.includes('ảnh-ảnh') ||
          titleLower.includes('ảnh - ảnh') ||
          titleLower.includes('ảnh ảnh') ||
          res.topic.gameMode?.includes('image-image') ||
          res.topic.items.some((i: any) => Boolean(i.imageBUrl))
        );
        setIsImageImageMode(isImgImg);

        // Group items by roundIndex
        const roundsMap: Record<number, any[]> = {};
        res.topic.items.forEach((item: any) => {
          const rIdx = item.roundIndex ?? 0;
          if (!roundsMap[rIdx]) roundsMap[rIdx] = [];
          roundsMap[rIdx].push(item);
        });

        const sortedRoundIndices = Object.keys(roundsMap).map(Number).sort((a, b) => a - b);
        const parsedRounds: GameRoundData[] = sortedRoundIndices.map((rIdx, i) => ({
          roundIndex: i,
          title: `Vòng ${i + 1}`,
          pairs: roundsMap[rIdx],
        }));

        const finalRounds = parsedRounds.length > 0 ? parsedRounds : [defaultRound];
        setRounds(finalRounds);
        startRound(0, finalRounds, isImgImg);
      }
      setIsLoadingTopic(false);
    }

    loadTopic();
  }, [topicId]);

  // Build deck for a specific round
  const buildRoundDeck = useCallback((round: GameRoundData, isImgImg: boolean) => {
    const pairs = round.pairs;
    const newDeck: CardItem[] = [];

    const PASTEL_GRADIENTS = [
      { bg: 'from-amber-100 to-orange-200', text: 'text-amber-950', border: 'border-amber-300' },
      { bg: 'from-sky-100 to-blue-200', text: 'text-sky-950', border: 'border-sky-300' },
      { bg: 'from-emerald-100 to-green-200', text: 'text-emerald-950', border: 'border-emerald-300' },
      { bg: 'from-purple-100 to-pink-200', text: 'text-purple-950', border: 'border-purple-300' },
      { bg: 'from-fuchsia-100 to-rose-200', text: 'text-fuchsia-950', border: 'border-fuchsia-300' },
      { bg: 'from-pink-100 to-amber-200', text: 'text-rose-950', border: 'border-rose-300' },
      { bg: 'from-yellow-100 to-amber-200', text: 'text-amber-950', border: 'border-yellow-300' },
      { bg: 'from-blue-100 to-indigo-200', text: 'text-blue-950', border: 'border-blue-300' },
    ];

    pairs.forEach((pair, idx) => {
      const theme = PASTEL_GRADIENTS[idx % PASTEL_GRADIENTS.length];

      if (isImgImg) {
        // LẬT ẢNH - ẢNH (Image A ↔ Image B)
        newDeck.push({
          id: `${pair.id}-card-a`,
          pairId: pair.id,
          name: pair.word || `Hình ${idx + 1}`,
          imageUrl: pair.imageUrl,
          cardType: 'IMAGE',
          bgGradient: theme.bg,
          textColor: theme.text,
          borderColor: theme.border,
          isFlipped: false,
          isMatched: false,
        });

        newDeck.push({
          id: `${pair.id}-card-b`,
          pairId: pair.id,
          name: pair.labelB || pair.word || `Hình ${idx + 1}`,
          imageUrl: pair.imageBUrl || pair.imageUrl,
          cardType: 'IMAGE',
          bgGradient: theme.bg,
          textColor: theme.text,
          borderColor: theme.border,
          isFlipped: false,
          isMatched: false,
        });
      } else {
        // LẬT ẢNH - CHỮ (Image ↔ Word)
        newDeck.push({
          id: `${pair.id}-img`,
          pairId: pair.id,
          name: '',
          word: pair.word,
          imageUrl: pair.imageUrl,
          audioUrl: pair.audioUrl,
          cardType: 'IMAGE',
          bgGradient: theme.bg,
          textColor: theme.text,
          borderColor: theme.border,
          isFlipped: false,
          isMatched: false,
        });

        newDeck.push({
          id: `${pair.id}-txt`,
          pairId: pair.id,
          name: pair.word,
          word: pair.word,
          cardType: 'TEXT',
          audioUrl: pair.audioUrl,
          bgGradient: theme.bg,
          textColor: theme.text,
          borderColor: theme.border,
          isFlipped: false,
          isMatched: false,
        });
      }
    });

    // Fisher-Yates Shuffle
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }

    return newDeck;
  }, []);

  // Start a specific round
  const startRound = useCallback((roundIdx: number, customRounds?: GameRoundData[], customIsImgImg?: boolean) => {
    const targetRounds = customRounds || rounds;
    if (targetRounds.length === 0) return;
    const targetRound = targetRounds[roundIdx] || targetRounds[0];
    const imgMode = customIsImgImg !== undefined ? customIsImgImg : isImageImageMode;
    setCurrentRoundIndex(roundIdx);
    setDeck(buildRoundDeck(targetRound, imgMode));
    setFlippedIds([]);
    setMatchedCount(0);
    setIsRoundWon(false);
    setIsChecking(false);
    setStreak(0);
  }, [rounds, isImageImageMode, buildRoundDeck]);

  // Initialize first round when rounds are loaded
  useEffect(() => {
    if (rounds.length > 0) {
      startRound(0);
      setMoves(0);
      setSeconds(0);
      setIsPlaying(false);
      setIsGameWon(false);
    }
  }, [rounds, startRound]);

  // Timer interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying && !isGameWon && !isRoundWon) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, isGameWon, isRoundWon]);

  // Audio Pronunciation TTS for Word on Match
  const playWordTTS = useCallback((word?: string, audioUrl?: string) => {
    if (!word || !soundEnabled) return;

    if (audioUrl) {
      try {
        const audio = new Audio(audioUrl);
        audio.play().catch(() => {});
        return;
      } catch {}
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'en-US';
        utterance.rate = 0.85;
        utterance.pitch = 1.05;
        window.speechSynthesis.speak(utterance);
      } catch {}
    }
  }, [soundEnabled]);

  // Card click handler
  const handleCardClick = (clickedCard: CardItem, e: React.MouseEvent<HTMLDivElement>) => {
    if (
      isChecking ||
      isRoundWon ||
      isGameWon ||
      clickedCard.isFlipped ||
      clickedCard.isMatched ||
      flippedIds.length >= 2
    ) {
      return;
    }

    if (!isPlaying) {
      setIsPlaying(true);
    }

    soundRef.current?.playBubblePop();

    const newFlipped = [...flippedIds, clickedCard.id];
    setFlippedIds(newFlipped);

    setDeck((prevDeck) =>
      prevDeck.map((c) => (c.id === clickedCard.id ? { ...c, isFlipped: true } : c))
    );

    if (newFlipped.length === 2) {
      const firstCard = deck.find((c) => c.id === newFlipped[0]);
      const secondCard = clickedCard;
      setMoves((prev) => prev + 1);

      if (firstCard && String(firstCard.pairId) === String(secondCard.pairId)) {
        // MATCH!
        soundRef.current?.playMatch();
        setStreak((prev) => prev + 1);
        const newMatchedCount = matchedCount + 1;
        setMatchedCount(newMatchedCount);

        // If Lật Ảnh - Chữ: play English TTS
        if (!isImageImageMode) {
          playWordTTS(firstCard.word || secondCard.word || firstCard.name || secondCard.name, firstCard.audioUrl || secondCard.audioUrl);
        }

        // Spawn Floating Particle Star FX at click coordinates
        const rect = e.currentTarget.getBoundingClientRect();
        const pId = Date.now();
        setParticles((prev) => [
          ...prev,
          { id: pId, text: streak >= 1 ? `COMBO x${streak + 1}! 🔥` : '+10 PTS ⭐', x: rect.left + rect.width / 2, y: rect.top },
        ]);
        setTimeout(() => {
          setParticles((prev) => prev.filter((p) => p.id !== pId));
        }, 1200);

        setDeck((prevDeck) =>
          prevDeck.map((c) =>
            c.id === firstCard.id || c.id === secondCard.id
              ? { ...c, isFlipped: true, isMatched: true }
              : c
          )
        );
        setFlippedIds([]);

        const currentRound = rounds[currentRoundIndex];
        const targetPairsInRound = currentRound ? currentRound.pairs.length : deck.length / 2;

        // Check if all pairs in current round are matched
        if (newMatchedCount >= targetPairsInRound) {
          soundRef.current?.playWin();

          // Check if there are more rounds
          if (currentRoundIndex + 1 < rounds.length) {
            // Round victory: Show 3s countdown overlay then auto advance
            setIsRoundWon(true);
            setCountdown(3);

            countdownIntervalRef.current = setInterval(() => {
              setCountdown((prev) => Math.max(0, prev - 1));
            }, 1000);

            nextRoundTimerRef.current = setTimeout(() => {
              if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
              startRound(currentRoundIndex + 1);
            }, 3000);
          } else {
            // ALL ROUNDS COMPLETED!
            setIsGameWon(true);
            setIsPlaying(false);
          }
        }
      } else {
        // MISMATCH!
        setIsChecking(true);
        setStreak(0);
        soundRef.current?.playMismatch();

        // Shake effect
        setDeck((prevDeck) =>
          prevDeck.map((c) =>
            c.id === firstCard?.id || c.id === secondCard.id
              ? { ...c, isShaking: true }
              : c
          )
        );

        setTimeout(() => {
          setDeck((prevDeck) =>
            prevDeck.map((c) =>
              c.id === firstCard?.id || c.id === secondCard.id
                ? { ...c, isFlipped: false, isShaking: false }
                : c
            )
          );
          setFlippedIds([]);
          setIsChecking(false);
        }, 800);
      }
    }
  };

  const handleNextRoundImmediately = () => {
    if (nextRoundTimerRef.current) clearTimeout(nextRoundTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    startRound(currentRoundIndex + 1);
  };

  const resetAllGame = () => {
    if (nextRoundTimerRef.current) clearTimeout(nextRoundTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setMoves(0);
    setSeconds(0);
    setIsPlaying(false);
    setIsGameWon(false);
    setIsRoundWon(false);
    startRound(0);
  };

  // Calculate dynamic grid columns & rows based on deck size
  const getGridStyle = () => {
    const totalCards = deck.length;
    if (totalCards <= 4) return { cols: 2, rows: 2 };
    if (totalCards <= 6) return { cols: 3, rows: 2 };
    if (totalCards <= 8) return { cols: 4, rows: 2 };
    if (totalCards <= 12) return { cols: 4, rows: 3 };
    return { cols: 4, rows: 4 };
  };

  const gridDimensions = getGridStyle();
  const currentRound = rounds[currentRoundIndex];
  const targetPairs = currentRound ? currentRound.pairs.length : Math.floor(deck.length / 2);

  // Format time (mm:ss)
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStars = () => {
    const totalPairsAcrossAll = rounds.reduce((acc, r) => acc + r.pairs.length, 0);
    if (moves <= totalPairsAcrossAll + 6) return 3;
    if (moves <= totalPairsAcrossAll * 2) return 2;
    return 1;
  };

  if (isLoadingTopic) {
    return (
      <div className="w-screen h-screen bg-[#35b8e5] flex flex-col items-center justify-center space-y-4 text-white">
        <Loader2 className="w-12 h-12 animate-spin text-white drop-shadow-md" />
        <span className="text-lg font-black tracking-widest uppercase animate-pulse drop-shadow-sm">
          Đang tải bài tập Lật Ảnh...
        </span>
      </div>
    );
  }

  return (
    <div className="ocean-web-root select-none font-sans relative">
      {/* Baloo 2 Google Font */}
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&display=swap");

        :root {
          --font: "Baloo 2", Arial, sans-serif;
        }

        .ocean-web-root {
          width: 100vw;
          height: 100vh;
          margin: 0;
          padding: 0;
          overflow: hidden;
          background: #35b8e5;
          font-family: var(--font);
          position: relative;
        }

        .global-full-bg {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          object-fit: cover;
          z-index: 0;
        }

        .page {
          width: 100vw;
          height: 100vh;
          display: grid;
          place-items: center;
          overflow: hidden;
          position: relative;
          z-index: 1;
        }

        .scene {
          position: relative;
          width: min(100vw, calc(100vh * 1672 / 941));
          aspect-ratio: 1672/941;
          overflow: hidden;
          container-type: inline-size;
          background: transparent;
        }

        .scene-bg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0;
        }

        .decor {
          position: absolute;
          z-index: 10;
          pointer-events: none;
          user-select: none;
          object-fit: contain;
          filter: drop-shadow(0 0.55cqw 0.7cqw rgba(6,91,155,0.18));
        }

        /* Natural Sea Creature Floating & Swimming Animations */
        @keyframes floatDolphin {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-0.8cqw) rotate(3deg); }
        }
        @keyframes floatJellyfish {
          0%, 100% { transform: translateY(0) scaleY(1); }
          50% { transform: translateY(-0.6cqw) scaleY(1.06); }
        }
        @keyframes swayTurtle {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-0.5cqw) rotate(5deg); }
        }
        @keyframes swimFishLeft {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-0.6cqw) rotate(-4deg); }
        }
        @keyframes swimFishRight {
          0%, 100% { transform: scaleX(-1) translateY(0) rotate(0deg); }
          50% { transform: scaleX(-1) translateY(-0.6cqw) rotate(-4deg); }
        }
        @keyframes bobStarfishPink {
          0%, 100% { transform: translateY(0) scale(1) rotate(0deg); }
          50% { transform: translateY(-0.4cqw) scale(1.05) rotate(3deg); }
        }
        @keyframes bobStarfishOrange {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-0.5cqw) rotate(-4deg); }
        }
        @keyframes swayOctopus {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-0.7cqw) scale(1.03); }
        }
        @keyframes pulsePearlShell {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }

        .fish-left { left: 0.2%; top: 38.0%; width: 6.5%; animation: swimFishLeft 2.7s ease-in-out infinite; }
        .fish-right { right: 0.4%; top: 37.2%; width: 7%; animation: swimFishRight 2.9s ease-in-out infinite; }
        .dolphin { right: -1.4%; top: 8.4%; width: 12%; animation: floatDolphin 4s ease-in-out infinite; }
        .octopus { right: -0.7%; bottom: -1.5%; width: 12.5%; animation: swayOctopus 3.6s ease-in-out infinite; }
        .starfish-left { left: 2.2%; bottom: 7.5%; width: 9.5%; animation: bobStarfishPink 3.2s ease-in-out infinite; }
        .starfish-bottom { left: 34.0%; bottom: 7.5%; width: 8.8%; animation: bobStarfishOrange 2.8s ease-in-out infinite; }
        .pearl-shell { right: 12.4%; bottom: 1%; width: 9.3%; animation: pulsePearlShell 4.2s ease-in-out infinite; }

        .title-jellyfish { position: absolute; left: -1.0%; top: 20%; width: 17%; animation: floatJellyfish 3s ease-in-out infinite; }
        .title-turtle { position: absolute; right: -2.5%; bottom: -18%; width: 21%; animation: swayTurtle 3.4s ease-in-out infinite; }

        .panel {
          position: absolute;
          z-index: 3;
          left: 4.35%; top: 10.8%;
          width: 34.15%; height: 76.7%;
          border: 0.22cqw solid rgba(255,255,255,0.88);
          border-radius: 2.15cqw;
          background: linear-gradient(180deg, rgba(78,220,248,0.80) 0%, rgba(8,165,222,0.82) 46%, rgba(18,149,211,0.88) 100%);
          box-shadow: inset 0 0.22cqw 0 rgba(255,255,255,0.35), inset 0 -0.25cqw 0 rgba(0,110,190,0.15), 0 0.7cqw 1.6cqw rgba(0,88,156,0.16);
        }

        .panel::before {
          content: ""; position: absolute; left: 6%; right: 6%; top: 31.5%; height: 0.17cqw;
          background: rgba(255,255,255,0.6); border-radius: 1cqw;
        }

        .title-block { position: absolute; left: 5.2%; top: 4.5%; width: 90%; height: 25%; }
        .title-text { position: absolute; left: 18.5%; top: 8%; width: 63%; line-height: 0.93; transform: rotate(-2deg); }
        .title-line {
          display: block; white-space: nowrap; font-weight: 800; letter-spacing: -0.035em;
          paint-order: stroke fill; -webkit-text-stroke: 0.43cqw #fff;
          text-shadow: 0 0.31cqw 0 #2468b9, 0 0.48cqw 0.5cqw rgba(9,74,138,0.18);
        }
        .title-line.top { font-size: 3.35cqw; color: #f64c9d; }
        .title-line.bottom { font-size: 3.25cqw; color: #3dbcf7; margin-top: 0.10cqw; }

        .sound-button { position: absolute; right: 1.5%; top: 10%; width: 11.2%; aspect-ratio: 1; border: 0; background: none; cursor: pointer; padding: 0; transition: transform 0.2s; }
        .sound-button:hover { transform: scale(1.1); }
        .sound-button img { width: 100%; height: 100%; object-fit: contain; }

        .stats-grid { position: absolute; left: 6.4%; top: 35.5%; width: 87.2%; display: grid; grid-template-columns: 1fr 1fr; gap: 1.4cqw 1.1cqw; }
        .stat-card {
          height: 9.6cqw; min-height: 0; max-height: none;
          border-radius: 1.45cqw; padding: 0.85cqw 0.9cqw;
          display: flex; align-items: center; gap: 0.72cqw;
          border: 0.16cqw solid rgba(97,198,245,0.55);
          box-shadow: inset 0 0.18cqw 0 rgba(255,255,255,0.82), 0 0.32cqw 0.5cqw rgba(22,95,160,0.13);
        }
        .stat-card.time { background: linear-gradient(180deg,#f8fdff,#dff2ff); }
        .stat-card.moves { background: linear-gradient(180deg,#fffaf1,#fff0e1); }
        .stat-card.pairs { background: linear-gradient(180deg,#f1fff1,#dbf6dc); }
        .stat-card.best { background: linear-gradient(180deg,#fbf1ff,#efdfff); }

        .stat-icon { 
          flex: 0 0 3.6cqw; 
          width: 3.6cqw; 
          height: 3.6cqw; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          border-radius: 999px; 
          filter: drop-shadow(0 0.15cqw 0.25cqw rgba(0,0,0,0.12));
        }

        .stat-copy { min-width: 0; }
        .stat-label { margin: 0 0 0.24cqw; color: #3d72a6; font-size: 1.05cqw; font-weight: 800; line-height: 1; text-transform: uppercase; white-space: nowrap; }
        .stat-value { margin: 0; color: #1488eb; font-size: 2.05cqw; font-weight: 800; line-height: 1; white-space: nowrap; }
        .accent-orange { color: #ff920a; } .accent-green { color: #16ac67; } .accent-purple { color: #8242d4; }
        .subtle { font-size: 0.58em; margin-left: 0.08em; }

        .restart-button { 
          position: absolute; 
          left: 12%; 
          bottom: 5.5%; 
          width: 76%; 
          height: 11%; 
          border: none; 
          background: none; 
          cursor: pointer; 
          padding: 0;
          transition: transform 0.15s ease-in-out;
        }
        .restart-button:hover {
          transform: scale(1.04);
        }
        .restart-button:active {
          transform: scale(0.96);
        }
        .restart-button img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          filter: drop-shadow(0 0.25cqw 0.4cqw rgba(180,70,0,0.3));
        }

        .board { position: absolute; z-index: 3; left: 43.5%; top: 8.4%; width: 46.5%; height: 78.6%; display: flex; align-items: center; justify-content: center; overflow: hidden; padding: 0.5cqw; }
        .cards-grid { width: 100%; height: auto; max-width: 100%; max-height: 100%; margin: auto; display: grid; column-gap: 1.2cqw; row-gap: 1.2cqw; justify-items: center; align-items: center; }

        .memory-card-wrapper {
          width: 100%;
          height: 100%;
          aspect-ratio: 1 / 1;
          max-height: 100%;
          max-width: 100%;
          margin: auto;
          position: relative;
          cursor: pointer;
          perspective: 1000px;
          transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.22s ease;
        }

        .memory-card-wrapper:hover {
          transform: translateY(-0.4cqw) scale(1.06);
          filter: drop-shadow(0 0.5cqw 0.8cqw rgba(38, 198, 255, 0.7)) brightness(1.06);
          z-index: 10;
        }

        .memory-card-wrapper:active {
          transform: scale(0.95);
        }

        .memory-card-inner {
          width: 100%;
          height: 100%;
          position: relative;
          transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          transform-style: preserve-3d;
          border-radius: 1.1cqw;
        }

        .memory-card-inner.flipped {
          transform: rotateY(180deg);
        }

        .card-face-back {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          background: url("${ASSET_PATH}/card-starfish.png") center/contain no-repeat;
          filter: drop-shadow(0 0.26cqw 0.32cqw rgba(0,87,153,0.12));
          border-radius: 1.1cqw;
          transition: filter 0.2s ease;
        }

        .memory-card-wrapper:hover .card-face-back {
          filter: drop-shadow(0 0.35cqw 0.55cqw rgba(0, 120, 210, 0.35)) brightness(1.05);
        }

        .card-face-front {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          transform: rotateY(180deg);
          border-radius: 1.1cqw;
          border: 0.18cqw solid #80c6f5;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.35cqw;
          overflow: hidden;
          box-shadow: inset 0 0.15cqw 0 rgba(255,255,255,0.9), 0 0.3cqw 0.5cqw rgba(0,87,153,0.15);
        }

        @keyframes cardShake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-0.4cqw) rotate(-2deg); }
          40%, 80% { transform: translateX(0.4cqw) rotate(2deg); }
        }
        .animate-shake {
          animation: cardShake 0.4s ease-in-out;
        }

        @keyframes floatUp {
          0% { transform: translateY(0) scale(0.8); opacity: 1; }
          100% { transform: translateY(-3cqw) scale(1.2); opacity: 0; }
        }
        .animate-float-up {
          animation: floatUp 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
      `}</style>

      {/* FULLSCREEN OCEAN COVER BACKGROUND IMAGE */}
      <img
        className="global-full-bg"
        src={`${ASSET_PATH}/background-ocean.png`}
        alt="Ocean Background Fullscreen"
      />

      {/* Floating Match Particle FX */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="fixed z-50 pointer-events-none font-black text-amber-300 drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] animate-float-up"
          style={{ left: `${p.x - 40}px`, top: `${p.y - 20}px`, fontSize: '1.8cqw' }}
        >
          {p.text}
        </div>
      ))}

      {/* SCENE CONTAINER */}
      <main className="page">
        <section className="scene" aria-label="Ocean Memory Match Game">
          {/* Decor Mascots */}
          <img className="decor fish-left" src={`${ASSET_PATH}/mascot-fish.png`} alt="" />
          <img className="decor fish-right" src={`${ASSET_PATH}/mascot-fish.png`} alt="" />
          <img className="decor dolphin" src={`${ASSET_PATH}/mascot-dolphin.png`} alt="" />
          <img className="decor octopus" src={`${ASSET_PATH}/mascot-octopus.png`} alt="" />
          <img className="decor starfish-left" src={`${ASSET_PATH}/mascot-starfish-pink.png`} alt="" />
          <img className="decor starfish-bottom" src={`${ASSET_PATH}/mascot-starfish-orange.png`} alt="" />
          <img className="decor pearl-shell" src={`${ASSET_PATH}/prop-pearl-shell.png`} alt="" />

          {/* LEFT PANEL CONTROLS */}
          <section className="panel" aria-label="Game controls">

            {/* Title Block */}
            <div className="title-block">
              <img className="title-jellyfish" src={`${ASSET_PATH}/mascot-jellyfish.png`} alt="" />
              <div className="title-text">
                <span className="title-line top">Ghép Hình</span>
                <span className="title-line bottom">Đại Dương</span>
              </div>
              <button
                className="sound-button"
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                aria-label="Âm thanh"
              >
                <img
                  src={`${ASSET_PATH}/icon-sound.png`}
                  alt="Sound Icon"
                  className={!soundEnabled ? 'opacity-50 grayscale' : ''}
                />
              </button>
              <img className="title-turtle" src={`${ASSET_PATH}/mascot-turtle.png`} alt="" />
            </div>

            {/* Stats Dashboard Grid */}
            <div className="stats-grid">
              <article className="stat-card time">
                <div className="stat-icon flex items-center justify-center">
                  <img
                    src={`${ASSET_PATH}/icon-clock.png`}
                    alt="Thời gian"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                      const parent = (e.target as HTMLElement).parentElement;
                      if (parent) parent.innerHTML = '<div class="clock-icon w-full h-full rounded-full"></div>';
                    }}
                  />
                </div>
                <div className="stat-copy">
                  <p className="stat-label">Thời gian</p>
                  <p className="stat-value">{formatTime(seconds)}</p>
                </div>
              </article>

              <article className="stat-card moves">
                <div className="stat-icon flex items-center justify-center">
                  <img
                    src={`${ASSET_PATH}/icon-starfish.png`}
                    alt="Lượt"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                      const parent = (e.target as HTMLElement).parentElement;
                      if (parent) parent.innerHTML = '<span class="star-icon text-[2.2cqw]">★</span>';
                    }}
                  />
                </div>
                <div className="stat-copy">
                  <p className="stat-label">Lượt lật</p>
                  <p className="stat-value accent-orange">{moves}</p>
                </div>
              </article>

              <article className="stat-card pairs">
                <div className="stat-icon flex items-center justify-center">
                  <img
                    src={`${ASSET_PATH}/icon-shell.png`}
                    alt="Cặp thẻ"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                      const parent = (e.target as HTMLElement).parentElement;
                      if (parent) parent.innerHTML = '<span class="shell-icon text-[2.2cqw]">◔</span>';
                    }}
                  />
                </div>
                <div className="stat-copy">
                  <p className="stat-label">Cặp thẻ</p>
                  <p className="stat-value accent-green">
                    {matchedCount}<span className="subtle">/{targetPairs}</span>
                  </p>
                </div>
              </article>

              <article className="stat-card best">
                <div className="stat-icon flex items-center justify-center">
                  <img
                    src={`${ASSET_PATH}/icon-trophy.png`}
                    alt="Vòng chơi"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                      const parent = (e.target as HTMLElement).parentElement;
                      if (parent) parent.innerHTML = '<span class="trophy-icon text-[2.05cqw]">🏆</span>';
                    }}
                  />
                </div>
                <div className="stat-copy">
                  <p className="stat-label">Vòng chơi</p>
                  <p className="stat-value accent-purple">
                    {currentRoundIndex + 1}<span className="subtle">/{rounds.length || 1}</span>
                  </p>
                </div>
              </article>
            </div>

            {/* Restart Button */}
            <button className="restart-button" type="button" onClick={resetAllGame} aria-label="Chơi lại">
              <img src={`${ASSET_PATH}/button-replay-vn.png`} alt="Chơi lại" />
            </button>
          </section>

          {/* DYNAMIC CARD BOARD */}
          <section className="board" aria-label="Memory grid">
            <div
              className="cards-grid"
              style={{
                gridTemplateColumns: `repeat(${gridDimensions.cols}, 1fr)`,
                gridTemplateRows: `repeat(${gridDimensions.rows}, 1fr)`,
                aspectRatio: `${gridDimensions.cols} / ${gridDimensions.rows}`,
              }}
            >
              {deck.map((card) => {
                const isRevealed = card.isFlipped || card.isMatched;

                return (
                  <div
                    key={card.id}
                    className={`memory-card-wrapper ${card.isShaking ? 'animate-shake' : ''}`}
                    onClick={(e) => handleCardClick(card, e)}
                  >
                    <div className={`memory-card-inner ${isRevealed ? 'flipped' : ''}`}>
                      {/* CARD BACK */}
                      <div className="card-face-back" />

                      {/* CARD FRONT */}
                      <div className="card-face-front">
                        {card.cardType === 'IMAGE' && card.imageUrl ? (
                          <div className="relative w-full h-full flex items-center justify-center bg-white rounded-[0.75cqw] overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={card.imageUrl}
                              alt={card.name || 'Card image'}
                              className="w-full h-full object-cover pointer-events-none select-none"
                            />
                          </div>
                        ) : card.cardType === 'TEXT' || (!card.imageUrl && card.name) ? (
                          <div className={`w-full h-full flex flex-col items-center justify-center p-2 text-center rounded-[0.75cqw] bg-gradient-to-br ${card.bgGradient}`}>
                            <span className="text-[1.3cqw] font-black text-slate-800 uppercase tracking-wide leading-tight line-clamp-3">
                              {card.name || card.word}
                            </span>
                          </div>
                        ) : card.icon ? (
                          <card.icon className={`w-3/5 h-3/5 ${card.textColor} drop-shadow-sm`} />
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </section>
      </main>

      {/* Round Victory Countdown Overlay (Auto next round in 3s) */}
      {isRoundWon && (
        <div className="fixed inset-0 z-50 bg-sky-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-white border-4 border-cyan-400 rounded-[2.5rem] p-6 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
            <div className="w-16 h-16 bg-gradient-to-tr from-amber-400 to-yellow-300 rounded-full flex items-center justify-center text-amber-950 mb-3 shadow-xl shadow-amber-400/30 animate-bounce">
              <CheckCircle2 className="w-9 h-9 text-white" />
            </div>

            <h2 className="text-2xl font-black text-cyan-700 mb-1 tracking-wide">
              XUẤT SẮC! 🎉
            </h2>
            <p className="text-xs font-bold text-slate-600 mb-3">
              Đã hoàn thành {currentRound?.title || 'Vòng chơi'}!
            </p>

            <div className="w-full bg-cyan-50 border-2 border-cyan-200 rounded-2xl p-3 flex flex-col items-center justify-center mb-4">
              <span className="text-xs text-cyan-800 font-bold mb-1">Tự động chuyển sang Vòng tiếp theo sau</span>
              <span className="text-3xl font-black text-orange-500 font-mono animate-pulse">
                {countdown}s
              </span>
            </div>

            <button
              onClick={handleNextRoundImmediately}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 border-2 border-white text-white font-black text-sm py-3 px-4 rounded-full shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              <span>Tiếp tục ngay</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>
      )}

      {/* Final Game Victory Celebration Modal */}
      {isGameWon && (
        <div className="fixed inset-0 z-50 bg-sky-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
          <div className="w-full max-w-sm bg-white border-4 border-cyan-300 rounded-[2.5rem] p-6 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
            <div className="w-16 h-16 bg-gradient-to-tr from-amber-400 to-yellow-300 rounded-full flex items-center justify-center text-amber-950 mb-3 shadow-xl shadow-amber-400/30 animate-bounce">
              <Trophy className="w-8 h-8 text-amber-950" />
            </div>

            <h2 className="text-3xl font-extrabold text-cyan-600 mb-1 tracking-wider">
              CHIẾN THẮNG! 🏆
            </h2>
            <p className="text-xs text-slate-600 mb-4 font-bold">
              Chúc mừng bạn đã hoàn thành tất cả các Vòng của {topicTitle}!
            </p>

            <div className="flex items-center gap-1.5 mb-4">
              {[1, 2, 3].map((star) => (
                <Star
                  key={star}
                  className={`w-7 h-7 ${
                    star <= getStars()
                      ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                      : 'text-slate-300'
                  }`}
                />
              ))}
            </div>

            <div className="w-full bg-cyan-50 border-2 border-cyan-200 rounded-2xl p-3 grid grid-cols-2 gap-2 mb-5">
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-cyan-900 font-bold mb-0.5">TỔNG THỜI GIAN</span>
                <span className="text-base font-black text-cyan-700 font-mono">{formatTime(seconds)}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-amber-900 font-bold mb-0.5">TỔNG LƯỢT LẬT</span>
                <span className="text-base font-black text-amber-600">{moves}</span>
              </div>
            </div>

            <button
              onClick={resetAllGame}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 border-2 border-white text-white font-black text-sm py-3 px-4 rounded-full shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Chơi lại từ đầu</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OceanAquariumMemoryGamePage() {
  return (
    <Suspense fallback={
      <div className="w-screen h-screen bg-[#35b8e5] flex flex-col items-center justify-center text-white font-bold">
        <Loader2 className="w-10 h-10 animate-spin mb-2" />
        <span>Loading Game...</span>
      </div>
    }>
      <MemoryGameContent />
    </Suspense>
  );
}
