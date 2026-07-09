"use client";

import { useState, useEffect, useRef, Fragment } from "react";
import Link from "next/link";
import { toast } from "sonner";

interface BookSlide {
  id: string;
  slideNumber: string;
  imageName: string | null;
  imageUrl: string | null;
  text: string;
  audioUrl: string | null;
  orderIndex: number;
}

interface BookWithSlides {
  id: string;
  bookId: string;
  title: string;
  slides: BookSlide[];
}

interface BookReaderClientProps {
  book: BookWithSlides;
}

interface WordToken {
  original: string;
  clean: string;
  isRead: boolean;
  newLineBefore?: boolean;
}

interface FloatingStar {
  id: number;
  x: number;
  y: number;
  color: string;
}

const STAR_COLORS = ["#fbbf24", "#f59e0b", "#3b82f6", "#10b981", "#ec4899", "#8b5cf6"];

export default function BookReaderClient({ book }: BookReaderClientProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [words, setWords] = useState<WordToken[]>([]);
  
  // Speech States
  const [isTtsSpeaking, setIsTtsSpeaking] = useState(false);
  const [ttsActiveWordIndex, setTtsActiveWordIndex] = useState(-1);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState("");
  
  // Page completion / reward states
  const [isPageCompleted, setIsPageCompleted] = useState(false);
  const [stars, setStars] = useState<FloatingStar[]>([]);
  const [scoreResult, setScoreResult] = useState<"excellent" | "good" | null>(null);

  // Mode: "reading" = listen only; "shadowing" = listen + record + grade
  const [mode, setMode] = useState<"reading" | "shadowing">("shadowing");

  // Translation
  const [isTranslateOn, setIsTranslateOn] = useState(false);
  const [slideTranslations, setSlideTranslations] = useState<Record<string, string[]>>({});
  const [isFetchingTranslation, setIsFetchingTranslation] = useState(false);

  const recognitionRef = useRef<any>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const r2AudioRef = useRef<HTMLAudioElement | null>(null);
  // Refs for immediate reads inside async callbacks (updated alongside state, not via useEffect)
  const isListeningRef = useRef(false);
  const isTtsSpeakingRef = useRef(false);
  const gradeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Fuzzy word matching (lenient pronunciation evaluation) ---
  const levenshtein = (a: string, b: string): number => {
    if (a === b) return 0;
    const m = a.length, n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
      Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
    );
    for (let i = 1; i <= m; i++)
      for (let j = 1; j <= n; j++)
        dp[i][j] = a[i-1] === b[j-1]
          ? dp[i-1][j-1]
          : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    return dp[m][n];
  };

  const fuzzyWordMatch = (spoken: string, target: string): boolean => {
    if (!spoken || !target) return false;
    if (spoken === target) return true;
    // Very short words: require exact match
    if (target.length <= 2) return spoken === target;
    // One contains the other (handles dropped endings, e.g. "ridin" = "ride")
    if (spoken.startsWith(target.slice(0, Math.ceil(target.length * 0.8)))) return true;
    if (target.startsWith(spoken.slice(0, Math.ceil(spoken.length * 0.8)))) return true;
    // Levenshtein: allow 1 error for 3-5 char words, 2 errors for 6+ char words
    const maxDist = target.length >= 6 ? 2 : 1;
    return levenshtein(spoken, target) <= maxDist;
  };
  
  const currentSlide = book.slides[currentPageIndex];
  
  const cleanWord = (w: string): string => {
    return w
      .toLowerCase()
      .trim()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "");
  };

  const isSpeechSynthesisSupported = typeof window !== "undefined" && !!window.speechSynthesis;
  const isSpeechRecognitionSupported =
    typeof window !== "undefined" &&
    (!!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition);

  const playWordSuccessSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
      
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {
      console.warn("Audio block", e);
    }
  };

  const playPageSuccessSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const notes = [523.25, 659.25, 783.99, 1046.5];
      const startTime = ctx.currentTime;
      
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, startTime + idx * 0.08);
        
        gain.gain.setValueAtTime(0.06, startTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + idx * 0.08 + 0.22);
        
        osc.start(startTime + idx * 0.08);
        osc.stop(startTime + idx * 0.08 + 0.22);
      });
    } catch (e) {
      console.warn("Audio block", e);
    }
  };

  const triggerStars = () => {
    const newStars = Array.from({ length: 15 }).map((_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 240,
      y: -120 - Math.random() * 150,
      color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)]
    }));
    setStars(newStars);
    setTimeout(() => setStars([]), 1300);
  };

  useEffect(() => {
    if (!currentSlide) return;

    stopListening();
    if (isSpeechSynthesisSupported) {
      window.speechSynthesis.cancel();
    }
    setIsTtsSpeaking(false);
    setTtsActiveWordIndex(-1);

    const slideText = currentSlide.text;
    
    // Split by lines first to preserve newlines, then by words within each line
    const lines = slideText.split(/\n/);
    const tokens: WordToken[] = [];
    lines.forEach((line, lineIdx) => {
      const lineWords = line.split(/\s+/).filter(Boolean);
      lineWords.forEach((word, wordIdx) => {
        const isParentheses = word.startsWith("(") && word.endsWith(")");
        const token: WordToken = {
          original: word,
          clean: cleanWord(word),
          isRead: isParentheses,
          newLineBefore: lineIdx > 0 && wordIdx === 0,
        };
        if (token.clean !== "") tokens.push(token);
      });
    });

    setWords(tokens);
    setIsPageCompleted(tokens.every((w) => w.isRead));

    const timer = setTimeout(() => {
      handleReadSlide(tokens);
    }, 400);

    return () => {
      clearTimeout(timer);
      // Clear any pending grade timer when changing page
      if (gradeTimerRef.current) {
        clearTimeout(gradeTimerRef.current);
        gradeTimerRef.current = null;
      }
      setScoreResult(null);
    };
  }, [currentPageIndex]);

  // Auto-fetch translation when translate is on and page changes
  useEffect(() => {
    if (isTranslateOn && currentSlide?.text && currentSlide?.id) {
      fetchSlideTranslations(currentSlide.id, currentSlide.text);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPageIndex, isTranslateOn]);

  useEffect(() => {
    return () => {
      if (isSpeechSynthesisSupported) {
        window.speechSynthesis.cancel();
      }
      if (r2AudioRef.current) {
        r2AudioRef.current.pause();
        r2AudioRef.current = null;
      }
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const configureChildVoice = (utterance: SpeechSynthesisUtterance) => {
    const voices = window.speechSynthesis.getVoices();
    const enVoices = voices.filter(v => v.lang.startsWith("en"));
    
    // 1. Try to find native child/kid voices
    let voice = enVoices.find((v) => 
      v.name.toLowerCase().includes("kid") || 
      v.name.toLowerCase().includes("child") || 
      v.name.toLowerCase().includes("junior") || 
      v.name.toLowerCase().includes("flo") || 
      v.name.toLowerCase().includes("eddy") ||
      v.name.toLowerCase().includes("sandy") ||
      v.name.toLowerCase().includes("shelly")
    );

    // 2. Try to find local/offline female voices that respect pitch (avoiding cloud online/neural voices)
    if (!voice) {
      const localEnVoices = enVoices.filter(v => 
        v.localService === true || 
        (!v.name.toLowerCase().includes("online") && !v.name.toLowerCase().includes("neural"))
      );
      
      voice = localEnVoices.find((v) => v.name.toLowerCase().includes("zira")) ||
              localEnVoices.find((v) => v.name.toLowerCase().includes("google")) ||
              localEnVoices.find((v) => v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("woman") || v.name.toLowerCase().includes("girl")) ||
              localEnVoices[0] ||
              enVoices.find((v) => v.name.toLowerCase().includes("zira")) ||
              enVoices.find((v) => v.name.toLowerCase().includes("google")) ||
              enVoices[0];
    }

    if (voice) {
      utterance.voice = voice;
    }
    
    // Set pitch to 1.55 to make it sound like a young child/cute voice
    utterance.pitch = 1.55; 
    utterance.rate = 0.8;
  };

  const handleReadSlide = (overrideTokens?: WordToken[]) => {
    if (!currentSlide) return;

    const currentTokens = overrideTokens || words;
    const isParenthesesOnly = currentTokens.every((w) => w.isRead);

    // Stop any in-progress speech/audio
    if (isSpeechSynthesisSupported) window.speechSynthesis.cancel();
    if (r2AudioRef.current) {
      r2AudioRef.current.pause();
      r2AudioRef.current = null;
    }
    stopListening();
    setTtsActiveWordIndex(-1);

    if (isParenthesesOnly) {
      setIsTtsSpeaking(false);
      return;
    }

    // --- Priority 1: Use pre-generated Gemini R2 audio ---
    if (currentSlide.audioUrl) {
      isTtsSpeakingRef.current = true;
      setIsTtsSpeaking(true);
      const audio = new Audio(currentSlide.audioUrl);
      audio.playbackRate = 0.75;
      r2AudioRef.current = audio;

      // Simulate word highlighting by evenly distributing time across words
      const nonParenWords = currentTokens.filter((w) => !w.isRead);
      let wordTimer: ReturnType<typeof setInterval> | null = null;

      audio.onloadedmetadata = () => {
        const totalDuration = audio.duration; // seconds
        if (nonParenWords.length === 0 || !totalDuration) return;
        const msPerWord = (totalDuration * 1000) / nonParenWords.length;
        let wordIdx = 0;

        // Map non-paren words back to full token indices
        const nonParenIndices = currentTokens
          .map((w, i) => (!w.isRead ? i : -1))
          .filter((i) => i !== -1);

        wordTimer = setInterval(() => {
          if (wordIdx < nonParenIndices.length) {
            setTtsActiveWordIndex(nonParenIndices[wordIdx]);
            wordIdx++;
          } else {
            if (wordTimer) clearInterval(wordTimer);
          }
        }, msPerWord);
      };

      audio.onended = () => {
        if (wordTimer) clearInterval(wordTimer);
        isTtsSpeakingRef.current = false;
        setIsTtsSpeaking(false);
        setTtsActiveWordIndex(-1);
        r2AudioRef.current = null;
        // Only start listening in shadowing mode
        if (mode === "shadowing") startListening();
      };

      audio.onerror = () => {
        if (wordTimer) clearInterval(wordTimer);
        isTtsSpeakingRef.current = false;
        setIsTtsSpeaking(false);
        setTtsActiveWordIndex(-1);
        r2AudioRef.current = null;
        // Fallback to Edge TTS
        useEdgeTTSFallback(currentSlide.text, currentTokens);
      };

      audio.play().catch(() => {
        setIsTtsSpeaking(false);
        r2AudioRef.current = null;
      });
      return;
    }

    // --- Priority 2: Edge TTS real-time fallback ---
    useEdgeTTSFallback(currentSlide.text, currentTokens);
  };

  const useEdgeTTSFallback = async (slideText: string, currentTokens: WordToken[]) => {
    isTtsSpeakingRef.current = true;
    setIsTtsSpeaking(true);
    setTtsActiveWordIndex(-1);

    try {
      const res = await fetch("/api/tts/edge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: slideText }),
      });

      if (!res.ok) throw new Error("Edge TTS failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.playbackRate = 0.85;
      r2AudioRef.current = audio;

      const nonParenWords = currentTokens.filter(w => !w.isRead);
      let wordTimer: ReturnType<typeof setInterval> | null = null;

      audio.onloadedmetadata = () => {
        const totalDuration = audio.duration;
        if (nonParenWords.length === 0 || !totalDuration) return;
        const msPerWord = (totalDuration * 1000) / nonParenWords.length;
        let wordIdx = 0;
        const nonParenIndices = currentTokens
          .map((w, i) => (!w.isRead ? i : -1))
          .filter(i => i !== -1);
        wordTimer = setInterval(() => {
          if (wordIdx < nonParenIndices.length) {
            setTtsActiveWordIndex(nonParenIndices[wordIdx]);
            wordIdx++;
          } else {
            if (wordTimer) clearInterval(wordTimer);
          }
        }, msPerWord);
      };

      audio.onended = () => {
        if (wordTimer) clearInterval(wordTimer);
        isTtsSpeakingRef.current = false;
        setIsTtsSpeaking(false);
        setTtsActiveWordIndex(-1);
        r2AudioRef.current = null;
        URL.revokeObjectURL(url);
        if (mode === "shadowing") startListening();
      };

      audio.onerror = () => {
        if (wordTimer) clearInterval(wordTimer);
        isTtsSpeakingRef.current = false;
        setIsTtsSpeaking(false);
        setTtsActiveWordIndex(-1);
        r2AudioRef.current = null;
        URL.revokeObjectURL(url);
        // Final fallback: Web Speech API
        if (isSpeechSynthesisSupported) useSpeechSynthesisFallback(slideText, currentTokens);
      };

      await audio.play();
    } catch {
      // Edge TTS failed — fall back to Web Speech API
      isTtsSpeakingRef.current = false;
      setIsTtsSpeaking(false);
      if (isSpeechSynthesisSupported) {
        useSpeechSynthesisFallback(slideText, currentTokens);
      }
    }
  };

  const useSpeechSynthesisFallback = (slideText: string, currentTokens: WordToken[]) => {
    isTtsSpeakingRef.current = true;
    setIsTtsSpeaking(true);

    const utterance = new SpeechSynthesisUtterance(slideText);
    currentUtteranceRef.current = utterance;
    configureChildVoice(utterance);

    let textPos = 0;
    const wordRanges = currentTokens.map((token) => {
      const index = slideText.toLowerCase().indexOf(token.clean, textPos);
      if (index !== -1) {
        textPos = index + token.clean.length;
        return { start: index, end: index + token.clean.length };
      }
      return { start: -1, end: -1 };
    });

    utterance.onboundary = (event) => {
      if (event.name === "word") {
        const charIndex = event.charIndex;
        const index = wordRanges.findIndex((r) => charIndex >= r.start && charIndex <= r.end);
        if (index !== -1) {
          setTtsActiveWordIndex(index);
        }
      }
    };

    utterance.onend = () => {
      isTtsSpeakingRef.current = false;
      setIsTtsSpeaking(false);
      setTtsActiveWordIndex(-1);
      // Only start listening in shadowing mode
      if (mode === "shadowing") startListening();
    };

    utterance.onerror = () => {
      isTtsSpeakingRef.current = false;
      setIsTtsSpeaking(false);
      setTtsActiveWordIndex(-1);
    };

    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    if (!isSpeechRecognitionSupported) return;
    if (isListeningRef.current) return;       // use ref — avoids stale closure
    if (isTtsSpeakingRef.current) return;     // use ref — avoids stale closure

    if (isSpeechSynthesisSupported) {
      window.speechSynthesis.cancel();
      setTtsActiveWordIndex(-1);
    }

    setSpeechError("");
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SpeechRecognition();
    recognitionRef.current = rec;
    
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onstart = () => {
      isListeningRef.current = true;
      setIsListening(true);
    };

    rec.onresult = (event: any) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
      }

      const spokenTokens = transcript
        .toLowerCase()
        .split(/\s+/)
        .map(cleanWord)
        .filter(Boolean);

      setWords((prevWords) => {
        const updated = [...prevWords];
        let hasNewMatch = false;

        for (const spoken of spokenTokens) {
          for (let j = 0; j < updated.length; j++) {
            if (!updated[j].isRead && fuzzyWordMatch(spoken, updated[j].clean)) {
              updated[j].isRead = true;
              hasNewMatch = true;
              break;
            }
          }
        }

        if (hasNewMatch) playWordSuccessSound();
        // NOTE: completion detection is handled in useEffect below — not here
        return updated;
      });
    };

    rec.onerror = (e: any) => {
      if (e.error !== "no-speech") {
        setSpeechError("Không nghe rõ giọng đọc, hãy bấm thử lại.");
        isListeningRef.current = false;
        setIsListening(false);
      }
    };

    rec.onend = () => {
      isListeningRef.current = false;
      setIsListening(false);
    };

    try {
      rec.start();
    } catch (err) {
      console.error(err);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      isListeningRef.current = false;  // update ref immediately
      setIsListening(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Replay the current slide audio (reset words + restart TTS)
  const handleReplaySlide = () => {
    stopListening();
    // Reset all word read states so highlighting works from scratch
    const resetTokens = words.map((w) => ({ ...w, isRead: false }));
    setWords(resetTokens);
    setIsPageCompleted(false);
    setScoreResult(null);
    if (gradeTimerRef.current) {
      clearTimeout(gradeTimerRef.current);
      gradeTimerRef.current = null;
    }
    handleReadSlide(resetTokens);
  };

  // --- triggerPageResult: stop mic, show animation, advance ---
  const triggerPageResult = (result: "excellent" | "good") => {
    if (gradeTimerRef.current) {
      clearTimeout(gradeTimerRef.current);
      gradeTimerRef.current = null;
    }
    if (recognitionRef.current) recognitionRef.current.abort();
    isListeningRef.current = false;
    setIsListening(false);
    setIsPageCompleted(true);
    setScoreResult(result);

    playPageSuccessSound();
    if (result === "excellent") triggerStars();

    setTimeout(() => {
      setScoreResult(null);
      if (currentPageIndex < book.slides.length - 1) {
        setCurrentPageIndex((prev) => prev + 1);
      } else {
        toast.success("Chúc mừng con đã hoàn thành cuốn sách! 🎉");
      }
    }, 1800);
  };

  // --- Graded page completion: watches words changes (Shadowing mode only) ---
  useEffect(() => {
    if (mode !== "shadowing") return;  // Reading mode: no auto-grading
    if (!isListening || words.length === 0 || isPageCompleted) return;

    const unread = words.filter((w) => !w.isRead).length;

    // Clear any pending grade timer
    if (gradeTimerRef.current) {
      clearTimeout(gradeTimerRef.current);
      gradeTimerRef.current = null;
    }

    if (unread === 0) {
      // All words correct → Excellent!
      triggerPageResult("excellent");
    } else if (unread === 1) {
      // 1 word missing → wait 2s, then Good!
      gradeTimerRef.current = setTimeout(() => {
        triggerPageResult("good");
      }, 2000);
    }
    // More than 1 word missing → keep listening
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words, isListening]);

  // ---- Translation ----
  const fetchSlideTranslations = async (slideId: string, slideText: string) => {
    if (slideTranslations[slideId]) return; // already cached in session
    setIsFetchingTranslation(true);
    try {
      // Prefer native_language cookie (user's selected native language from onboarding)
      // over navigator.language (browser UI language, often 'en' even for non-English speakers)
      const getCookieLang = () => {
        try {
          const match = document.cookie.match(/(?:^|;\s*)native_language=([^;]+)/);
          return match ? decodeURIComponent(match[1]) : null;
        } catch { return null; }
      };
      const targetLang = getCookieLang() || navigator.language || "vi"; // e.g. "de", "vi", "zh"
      const res = await fetch("/api/translate/slide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Send slideId so server can query DB (no Google API cost when pre-generated)
        body: JSON.stringify({ slideId, targetLang }),
      });
      const data = await res.json();
      if (data.translations) {
        setSlideTranslations(prev => ({ ...prev, [slideId]: data.translations }));
      }
    } catch (e) {
      console.error("Translation fetch failed:", e);
    } finally {
      setIsFetchingTranslation(false);
    }
  };

  const toggleTranslate = () => {
    const next = !isTranslateOn;
    setIsTranslateOn(next);
    if (next && currentSlide?.text) {
      fetchSlideTranslations(currentSlide.id, currentSlide.text);
    }
  };

  const handleNextPage = () => {
    if (currentPageIndex < book.slides.length - 1) {
      setCurrentPageIndex((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex((prev) => prev - 1);
    }
  };

  const handleWordClick = (word: WordToken) => {
    if (!isSpeechSynthesisSupported || isTtsSpeaking) return;
    
    window.speechSynthesis.cancel();
    const voiceUtterance = new SpeechSynthesisUtterance(word.clean);
    configureChildVoice(voiceUtterance);
    voiceUtterance.rate = 0.8; // Slow child rate
    window.speechSynthesis.speak(voiceUtterance);
  };

  // Progress Bar width percentage
  const progressPercent = ((currentPageIndex + 1) / book.slides.length) * 100;

  return (
    <div className="h-screen w-screen bg-gradient-to-tr from-amber-100 via-pink-50 to-sky-100 text-slate-800 flex flex-col justify-between select-none relative overflow-hidden font-body">
      
      {/* 1. Header Toolbar (Kid Style - Matches Flashcards Header) */}
      <div className="w-full h-16 flex flex-col justify-between shrink-0 bg-white/90 border-b-4 border-amber-200/50 backdrop-blur-md z-10 relative">
        <div className="flex-1 flex items-center justify-between px-6 md:px-12">
          {/* Back Button */}
          <Link
            href="/student/books"
            onClick={() => {
              stopListening();
              if (isSpeechSynthesisSupported) window.speechSynthesis.cancel();
            }}
            className="flex items-center gap-2 px-4 py-1.5 text-xs font-black bg-amber-100 hover:bg-amber-200 border-2 border-amber-300 text-amber-800 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
          >
            <span className="material-symbols-outlined text-[14px]">arrow_back</span>
            <span>Back to Stories</span>
          </Link>
          
          {/* Book Title */}
          <div className="text-center">
            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-none">Read Along Book</p>
            <h2 className="font-extrabold text-base md:text-lg text-amber-900 line-clamp-1 max-w-sm md:max-w-md mt-0.5">
              {book.title}
            </h2>
          </div>
          
          {/* Read Aloud sample / Page Count indicator */}
          <div className="flex items-center gap-3">
            {/* Translate toggle */}
            <button
              onClick={toggleTranslate}
              title={isTranslateOn ? "Tắt dịch" : "Bật dịch"}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black border-2 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm ${
                isTranslateOn
                  ? "bg-emerald-100 border-emerald-400 text-emerald-800"
                  : "bg-amber-100 border-amber-300 text-amber-700"
              }`}
            >
              {isFetchingTranslation ? (
                <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <span className="material-symbols-outlined text-[14px]">translate</span>
              )}
              <span>Translate</span>
              <span className={`w-7 h-4 rounded-full flex items-center transition-all duration-200 ${
                isTranslateOn ? "bg-emerald-400" : "bg-amber-300"
              }`}>
                <span className={`w-3 h-3 rounded-full bg-white shadow transition-all duration-200 mx-0.5 ${
                  isTranslateOn ? "translate-x-3" : "translate-x-0"
                }`} />
              </span>
            </button>

            <button
              onClick={() => handleReadSlide()}
              className="w-9 h-9 rounded-full bg-amber-100 hover:bg-amber-200 border-2 border-amber-300 text-amber-800 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
              title="Đọc mẫu"
            >
              <span className="material-symbols-outlined text-lg">volume_up</span>
            </button>
            <span className="px-4 py-1.5 rounded-full text-xs font-black bg-amber-100 border-2 border-amber-300 text-amber-800">
              {currentPageIndex + 1} / {book.slides.length}
            </span>
          </div>
        </div>

        {/* Dynamic Progress Bar directly below Header */}
        <div className="w-full h-1 bg-amber-100">
          <div 
            style={{ width: `${progressPercent}%` }}
            className="h-full bg-gradient-to-r from-emerald-450 to-teal-500 transition-all duration-300 ease-out"
          />
        </div>
      </div>

      {/* 2. Central Content Area: Card Layout */}
      <div className="flex-grow w-full max-w-6xl mx-auto flex items-center justify-center px-12 md:px-20 relative overflow-hidden">
        
        {/* Left Floating Arrow */}
        <button
          onClick={handlePrevPage}
          disabled={currentPageIndex === 0}
          className="absolute left-3 md:left-6 w-11 h-11 rounded-full bg-emerald-100 border-2 border-emerald-300 text-emerald-800 hover:bg-emerald-200 hover:scale-105 active:scale-95 flex items-center justify-center transition-all disabled:opacity-20 disabled:pointer-events-none z-20 shadow-md"
        >
          <span className="material-symbols-outlined text-2xl font-bold">navigate_before</span>
        </button>

        {/* Central Book Card (Kid-styled card like flashcards) */}
        <div className="w-full h-[90%] max-h-[calc(100vh-210px)] rounded-[40px] md:rounded-[48px] bg-white border-8 border-emerald-300 flex flex-col md:flex-row gap-6 p-4 md:p-6 overflow-hidden shadow-[0_24px_50px_rgba(16,185,129,0.18)] relative items-center justify-center">
          
          {/* Card internal gradient */}
          <span className="absolute inset-0 bg-gradient-to-b from-slate-50/10 via-transparent to-transparent pointer-events-none rounded-[40px]" />

          {/* Score Result Overlay */}
          {scoreResult && (
            <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none rounded-[40px] overflow-hidden">
              <div
                className={`animate-score-pop select-none text-center ${
                  scoreResult === "excellent"
                    ? "text-yellow-400"
                    : "text-emerald-500"
                }`}
              >
                <div
                  className="font-black drop-shadow-[0_4px_24px_rgba(0,0,0,0.18)]"
                  style={{ fontSize: "clamp(3rem,10vw,7rem)", lineHeight: 1 }}
                >
                  {scoreResult === "excellent" ? "⭐ Excellent!" : "👍 Good!"}
                </div>
              </div>
            </div>
          )}

          {/* Left Column: Image — border follows natural image dimensions */}
          <div className="flex-shrink-0 flex items-center justify-center md:w-[48%]">
            {currentSlide?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentSlide.imageUrl}
                alt=""
                className="max-h-[calc(100vh-280px)] w-auto max-w-full rounded-[20px] object-contain transition-all duration-700 hover:scale-105 animate-in fade-in zoom-in-95 duration-350 border-4 border-amber-200 shadow-md"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center">
                <span className="text-6xl opacity-30">✨</span>
              </div>
            )}
          </div>

          {/* Right Column: Sentence Reader Block */}
          <div className="flex-1 h-1/2 md:h-full flex flex-col justify-center overflow-y-auto custom-scrollbar pr-2 py-4">
            <div className="flex flex-col gap-2 font-headline font-black leading-snug text-amber-950" style={{ fontSize: 'clamp(1.1rem, 2.2vw, 2.2rem)' }}>
              {(() => {
                // Group words into lines
                const lineGroups: { words: WordToken[]; indices: number[] }[] = [];
                words.forEach((word, idx) => {
                  if (word.newLineBefore || lineGroups.length === 0) {
                    lineGroups.push({ words: [word], indices: [idx] });
                  } else {
                    lineGroups[lineGroups.length - 1].words.push(word);
                    lineGroups[lineGroups.length - 1].indices.push(idx);
                  }
                });
                const currentTranslations = currentSlide ? slideTranslations[currentSlide.id] : undefined;
                return lineGroups.map((group, lineIdx) => (
                  <div key={lineIdx} className="flex flex-col">
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {group.words.map((word, wi) => {
                        const idx = group.indices[wi];
                        const isSpoken = idx === ttsActiveWordIndex;
                        const isRead = word.isRead;
                        return (
                          <span
                            key={wi}
                            onClick={() => handleWordClick(word)}
                            className={`cursor-pointer transition-all rounded-xl duration-200 px-1 py-0.5 hover:scale-[1.08] active:scale-95 ${
                              isRead
                                ? "text-blue-500 dark:text-blue-400 scale-[1.02]"
                                : isSpoken
                                ? "bg-yellow-100 text-yellow-900 dark:bg-yellow-500/20 dark:text-yellow-300 ring-2 ring-yellow-400/40"
                                : "text-slate-800 hover:text-blue-450 hover:scale-[1.02]"
                            }`}
                          >
                            {word.original}
                          </span>
                        );
                      })}
                    </div>
                    {isTranslateOn && currentTranslations?.[lineIdx] && (
                      <p className="text-[0.55em] font-medium text-slate-400 italic mt-0.5 leading-tight pl-1">
                        {currentTranslations[lineIdx]}
                      </p>
                    )}
                  </div>
                ));
              })()}

              {/* Replay audio button — inline at end of sentence */}
              {words.length > 0 && (
                <button
                  onClick={handleReplaySlide}
                  disabled={isTtsSpeaking}
                  title="Replay audio"
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 hover:bg-amber-200 border-2 border-amber-300 text-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:scale-110 active:scale-95 self-center ml-1 shrink-0"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>volume_up</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Floating Arrow */}
        <button
          onClick={handleNextPage}
          disabled={currentPageIndex === book.slides.length - 1}
          className="absolute right-3 md:right-6 w-11 h-11 rounded-full bg-emerald-100 border-2 border-emerald-300 text-emerald-800 hover:bg-emerald-200 hover:scale-105 active:scale-95 flex items-center justify-center transition-all disabled:opacity-20 disabled:pointer-events-none z-20 shadow-md"
        >
          <span className="material-symbols-outlined text-2xl font-bold">navigate_next</span>
        </button>

        {/* Star Reward Particles */}
        {stars.map((star) => (
          <div
            key={star.id}
            style={
              {
                "--x": `${star.x}px`,
                "--y": `${star.y}px`,
                color: star.color,
              } as React.CSSProperties
            }
            className="absolute bottom-16 left-1/2 -translate-x-1/2 pointer-events-none text-3xl select-none z-50 animate-star-fly"
          >
            ★
          </div>
        ))}
      </div>

      {/* 3. Control & Mic Bar */}
      <div className="w-full h-20 flex flex-col items-center justify-center shrink-0 bg-white/95 border-t border-amber-200/50 z-10 relative">

        {/* Status label */}
        <p className={`text-[10px] font-bold mb-1.5 transition-colors duration-300 ${
          isPageCompleted
            ? "text-emerald-600"
            : isTtsSpeaking
            ? "text-amber-500"
            : isListening
            ? "text-blue-500"
            : "text-slate-400"
        }`}>
          {isPageCompleted
            ? "✅ Well done!"
            : isTtsSpeaking
            ? "🔊 Playing..."
            : isListening
            ? "🎙️ Listening..."
            : mode === "reading"
            ? "📖 Reading mode — listen along"
            : isSpeechRecognitionSupported
            ? "Read after the audio finishes..."
            : "Speech recognition not supported"}
        </p>

        {/* Icon + Mode toggle — centered row */}
        <div className="flex items-center gap-3">

          <div className="relative">
            {/* Blue pulsing rings when actively listening */}
            {isListening && !isPageCompleted && (
              <>
                <div className="absolute inset-0 bg-blue-400/25 rounded-full scale-[1.6] animate-ping" style={{ animationDuration: "1s" }} />
                <div className="absolute inset-0 bg-blue-400/15 rounded-full scale-[2.2] animate-ping" style={{ animationDuration: "1.5s" }} />
              </>
            )}

            {/* Mic button — only shown in shadowing mode */}
            {mode === "shadowing" && (
              <button
                onClick={toggleListening}
                disabled={isTtsSpeaking || !isSpeechRecognitionSupported || isPageCompleted}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transform transition-all duration-300 disabled:cursor-not-allowed ${
                  isPageCompleted
                    ? "bg-emerald-500 shadow-emerald-500/30 scale-95"
                    : isListening
                    ? "bg-blue-500 shadow-blue-500/40 hover:scale-105 active:scale-95"
                    : isTtsSpeaking
                    ? "bg-slate-300 opacity-50"
                    : "bg-slate-400 hover:bg-slate-500 shadow-slate-500/20 hover:scale-105 active:scale-95"
                }`}
              >
                <span className="material-symbols-outlined text-xl font-bold">
                  {isPageCompleted ? "check_circle" : isListening ? "mic" : isTtsSpeaking ? "volume_up" : "mic"}
                </span>
              </button>
            )}

            {/* Reading mode: book icon */}
            {mode === "reading" && (
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-amber-100 border-2 border-amber-200 text-amber-600">
                <span className="material-symbols-outlined text-xl">menu_book</span>
              </div>
            )}
          </div>

          {/* Mode toggle pill — right next to the icon */}
          <button
            onClick={() => {
              const next = mode === "reading" ? "shadowing" : "reading";
              setMode(next);
              if (next === "reading") stopListening();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black border-2 transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: mode === "shadowing" ? "#dbeafe" : "#fef3c7",
              borderColor: mode === "shadowing" ? "#93c5fd" : "#fcd34d",
              color: mode === "shadowing" ? "#1d4ed8" : "#92400e",
            }}
          >
            <span className="material-symbols-outlined text-[13px]">
              {mode === "shadowing" ? "mic" : "menu_book"}
            </span>
            {mode === "shadowing" ? "Shadowing" : "Reading"}
          </button>

        </div>
      </div>

      {/* Global animations */}
      <style jsx global>{`
        @keyframes scorePop {
          0%   { transform: scale(0.2) rotate(-8deg); opacity: 0; }
          40%  { transform: scale(1.25) rotate(4deg);  opacity: 1; }
          60%  { transform: scale(0.92) rotate(-2deg); opacity: 1; }
          75%  { transform: scale(1.06);               opacity: 1; }
          88%  { transform: scale(1);                  opacity: 1; }
          100% { transform: scale(1.1);                opacity: 0; }
        }
        .animate-score-pop {
          animation: scorePop 1.8s cubic-bezier(0.36, 0.07, 0.19, 0.97) forwards;
        }

        @keyframes starFly {
          0% {
            transform: translate(0, 0) scale(0) rotate(0deg);
            opacity: 1;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translate(var(--x), var(--y)) scale(1.6) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-star-fly {
          animation: starFly 1.2s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }

        /* Custom scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.02);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.08);
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}
