"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface UseQuizAudioEngineProps {
  isEmbeddedInCanvas: boolean;
  autoStart: boolean;
  quizMode: "practice" | "autoplay";
  targetAudiences: any[];
  lessonTargetAudiences: any[];
  currentQuestion: any;
  hasStarted: boolean;
  isShowingResultScreen: boolean;
  onAutoplayAnswerReveal: (questionId: string) => void;
  onAutoplayNextQuestion: () => void;
}

interface AudioSegment {
  type: "tts" | "sound";
  text?: string;
  src?: string;
  preloadedUrl?: string;
}

export function useQuizAudioEngine({
  isEmbeddedInCanvas,
  autoStart,
  quizMode,
  targetAudiences,
  lessonTargetAudiences,
  currentQuestion,
  hasStarted,
  isShowingResultScreen,
  onAutoplayAnswerReveal,
  onAutoplayNextQuestion,
}: UseQuizAudioEngineProps) {
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const isMutedRef = useRef(isMuted);

  const [isHintPlaying, setIsHintPlaying] = useState(false);
  const [isTtsPlaying, setIsTtsPlaying] = useState(false);

  const [autoplayCountdown, setAutoplayCountdown] = useState<number | null>(null);
  const [nextQuestionCountdown, setNextQuestionCountdown] = useState<number | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);

  const autoReadAudioRef = useRef<HTMLAudioElement | null>(null);
  const segmentsRef = useRef<AudioSegment[]>([]);
  const currentSegmentIndexRef = useRef<number>(0);
  const preloadedUrlsRef = useRef<string[]>([]);
  const preloadRequestIdRef = useRef<number>(0);

  const isAutoReadEnabled = quizMode === "autoplay";

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Background music initialization
  useEffect(() => {
    if (typeof window === "undefined" || isEmbeddedInCanvas) return;

    const bgMusic = new Audio("/sounds/bg-music.mp3?v=2");
    bgMusic.loop = true;
    bgMusic.volume = isMuted ? 0 : 0.1;
    bgMusicRef.current = bgMusic;

    const playMusic = () => {
      if (!isMutedRef.current) {
        bgMusic.play().catch(() => {});
      }
      window.removeEventListener("click", playMusic);
      window.removeEventListener("touchstart", playMusic);
      window.removeEventListener("mousedown", playMusic);
      window.removeEventListener("keydown", playMusic);
    };

    bgMusic.play().catch(() => {
      window.addEventListener("click", playMusic);
      window.addEventListener("touchstart", playMusic);
      window.addEventListener("mousedown", playMusic);
      window.addEventListener("keydown", playMusic);
    });

    return () => {
      bgMusic.pause();
      bgMusic.src = "";
      bgMusicRef.current = null;
      window.removeEventListener("click", playMusic);
      window.removeEventListener("touchstart", playMusic);
      window.removeEventListener("mousedown", playMusic);
      window.removeEventListener("keydown", playMusic);
    };
  }, [isEmbeddedInCanvas]);

  useEffect(() => {
    if (autoStart && bgMusicRef.current && !isMutedRef.current) {
      bgMusicRef.current.play().catch(() => {});
    }
  }, [autoStart]);

  // Listen to Hint audio play/pause
  useEffect(() => {
    const handleHintPlay = () => setIsHintPlaying(true);
    const handleHintPause = () => setIsHintPlaying(false);

    window.addEventListener("hintAudioPlay", handleHintPlay);
    window.addEventListener("hintAudioPause", handleHintPause);

    return () => {
      window.removeEventListener("hintAudioPlay", handleHintPlay);
      window.removeEventListener("hintAudioPause", handleHintPause);
    };
  }, []);

  // Update volume on mute or speech playing
  useEffect(() => {
    if (bgMusicRef.current) {
      if (isMuted) {
        bgMusicRef.current.pause();
        window.dispatchEvent(new CustomEvent("pauseAllAudio"));
      } else {
        bgMusicRef.current.play().catch(() => {});
        bgMusicRef.current.volume = isHintPlaying || isTtsPlaying ? 0.03 : 0.1;
      }
    }
  }, [isMuted, isHintPlaying, isTtsPlaying]);

  // Material audio listener
  useEffect(() => {
    const handleMaterialPlay = () => {
      if (bgMusicRef.current) bgMusicRef.current.pause();
    };
    const handleMaterialPause = () => {
      if (bgMusicRef.current && !isMuted) bgMusicRef.current.play().catch(() => {});
    };

    window.addEventListener("materialAudioPlay", handleMaterialPlay);
    window.addEventListener("materialAudioPause", handleMaterialPause);

    return () => {
      window.removeEventListener("materialAudioPlay", handleMaterialPlay);
      window.removeEventListener("materialAudioPause", handleMaterialPause);
    };
  }, [isMuted]);

  // Speed calculation
  const getQuestionSpeed = useCallback(() => {
    const combined = [...(targetAudiences || []), ...(lessonTargetAudiences || [])];
    const isLearner = combined.some((aud) => String(aud).toLowerCase() === "learner");
    const configuredSpeed = parseFloat(process.env.NEXT_PUBLIC_TTS_PLAYBACK_SPEED || "0.6");
    return isLearner ? 1.0 : configuredSpeed;
  }, [targetAudiences, lessonTargetAudiences]);

  const cleanTextForTTS = (text: string) => {
    if (!text) return "";
    return text.replace(/\s+/g, " ").trim();
  };

  const buildAutoReadSegments = useCallback((question: any) => {
    const list: AudioSegment[] = [];
    if (!question) return list;

    let questionData: any;
    try {
      questionData = typeof question.content === "string" ? JSON.parse(question.content) : question.content;
    } catch {
      questionData = {};
    }
    const qType = questionData.type || question.type;

    let textStr =
      questionData.instruction ??
      questionData.questionText ??
      questionData.statement ??
      questionData.textWithBlanks ??
      question.content;

    if (textStr?.startsWith("{") && textStr?.endsWith("}")) textStr = "";
    if (qType === "CLOZE_TEST" && textStr && textStr.includes("{{")) {
      textStr = questionData.instruction || "Fill in the blank";
    }

    if (!textStr) return list;

    const hasBlank = /_+/.test(textStr) || /\{\{.*?\}\}/.test(textStr);

    if (hasBlank) {
      const parts = textStr.split(/_+|\{\{.*?\}\}/g);
      parts.forEach((part: string, idx: number) => {
        const cleanPart = cleanTextForTTS(part);
        if (cleanPart) {
          if (idx === parts.length - 1) {
            let lastPartWithChoices = cleanPart;
            if (qType === "MULTIPLE_CHOICE" || qType === "MULTIPLE_SELECT") {
              const options = questionData.options || [];
              options.forEach((opt: any, index: number) => {
                const letter = String.fromCharCode(65 + index);
                const optionText = cleanTextForTTS(opt.text);
                if (optionText) {
                  lastPartWithChoices += `, ${letter}. ${optionText}`;
                }
              });
            } else if (qType === "TRUE_FALSE") {
              lastPartWithChoices += `, A. True, B. False`;
            }
            list.push({ type: "tts", text: lastPartWithChoices });
          } else {
            list.push({ type: "tts", text: cleanPart });
          }
        }
        if (idx < parts.length - 1) {
          list.push({ type: "sound", src: "/sounds/ting_chime.wav" });
        }
      });
    } else {
      let combinedText = cleanTextForTTS(textStr);
      if (qType === "MULTIPLE_CHOICE" || qType === "MULTIPLE_SELECT") {
        const options = questionData.options || [];
        options.forEach((opt: any, index: number) => {
          const letter = String.fromCharCode(65 + index);
          const optionText = cleanTextForTTS(opt.text);
          if (optionText) {
            combinedText += `, ${letter}. ${optionText}`;
          }
        });
      } else if (qType === "TRUE_FALSE") {
        combinedText += `, A. True, B. False`;
      }
      list.push({ type: "tts", text: combinedText });
    }

    return list;
  }, []);

  const revokePreloadedUrls = () => {
    preloadedUrlsRef.current.forEach((url) => {
      if (url.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {
          console.error("Error revoking blob URL:", e);
        }
      }
    });
    preloadedUrlsRef.current = [];
  };

  const stopAutoRead = useCallback(() => {
    if (autoReadAudioRef.current) {
      try {
        autoReadAudioRef.current.pause();
        autoReadAudioRef.current.src = "";
        autoReadAudioRef.current.onended = null;
        autoReadAudioRef.current.onplay = null;
        autoReadAudioRef.current.onplaying = null;
        autoReadAudioRef.current.onerror = null;
      } catch (e) {
        console.error("Error stopping autoReadAudio:", e);
      }
    }
    segmentsRef.current = [];
    currentSegmentIndexRef.current = 0;
    revokePreloadedUrls();

    setIsTtsPlaying(false);
    setAutoplayCountdown(null);
    setNextQuestionCountdown(null);
    setIsAnswerRevealed(false);
  }, []);

  const fetchTtsSegment = async (segment: any) => {
    if (segment.preloadedUrl || segment.type !== "tts" || !segment.text) return;
    try {
      const response = await fetch("/api/tts/edge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: segment.text }),
      });
      if (!response.ok) throw new Error(`TTS fetch failed: ${response.status}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      segment.preloadedUrl = url;
      preloadedUrlsRef.current.push(url);
    } catch (err) {
      console.error("[TTS] Failed to fetch segment:", segment.text, err);
    }
  };

  const waitForSegment = (segment: any): Promise<void> => {
    return new Promise((resolve) => {
      if (segment.preloadedUrl || segment.type === "sound") {
        resolve();
        return;
      }
      const start = Date.now();
      const interval = setInterval(() => {
        if (segment.preloadedUrl || Date.now() - start > 5000) {
          clearInterval(interval);
          resolve();
        }
      }, 30);
    });
  };

  const playNextSegment = useCallback(async () => {
    if (!isAutoReadEnabled || currentSegmentIndexRef.current >= segmentsRef.current.length) {
      stopAutoRead();
      if (quizMode === "autoplay") {
        setAutoplayCountdown(10);
        setIsAnswerRevealed(false);
      }
      return;
    }

    setIsTtsPlaying(true);
    const segment = segmentsRef.current[currentSegmentIndexRef.current];
    currentSegmentIndexRef.current++;

    const playSpeed = getQuestionSpeed();
    let audio = autoReadAudioRef.current;
    if (!audio) {
      audio = new Audio();
      autoReadAudioRef.current = audio;
    }

    await waitForSegment(segment);

    const src = segment.preloadedUrl;
    if (!src) {
      playNextSegment();
      return;
    }

    try {
      audio.onplay = () => {
        if (audio) audio.playbackRate = playSpeed;
      };
      audio.onplaying = () => {
        if (audio) audio.playbackRate = playSpeed;
      };
      audio.onended = () => {
        playNextSegment();
      };
      audio.onerror = (e) => {
        console.error("Audio player error event:", e);
        playNextSegment();
      };

      audio.src = src;
      audio.defaultPlaybackRate = playSpeed;
      audio.playbackRate = playSpeed;

      audio.play().then(() => {
        if (audio) audio.playbackRate = playSpeed;
      }).catch((err) => {
        console.error("Failed to play audio segment:", err);
        playNextSegment();
      });
    } catch (err) {
      console.error("Error setting up audio playback:", err);
      playNextSegment();
    }
  }, [isAutoReadEnabled, quizMode, getQuestionSpeed, stopAutoRead]);

  const startAutoReadQueue = useCallback(async (question: any) => {
    stopAutoRead();
    if (!question) return;

    setIsTtsPlaying(true);
    const queue = buildAutoReadSegments(question);
    const requestId = ++preloadRequestIdRef.current;

    if (queue.length === 0) return;

    queue.forEach((segment: any) => {
      if (segment.type === "sound" && segment.src) {
        segment.preloadedUrl = segment.src;
      }
    });

    const ttsSegments = queue.filter((s: any) => s.type === "tts" && s.text);
    ttsSegments.forEach((segment: any) => fetchTtsSegment(segment));

    segmentsRef.current = queue;
    currentSegmentIndexRef.current = 0;

    if (requestId !== preloadRequestIdRef.current) return;

    playNextSegment();
  }, [buildAutoReadSegments, playNextSegment, stopAutoRead]);

  // Autoplay countdown effect
  useEffect(() => {
    if (quizMode !== "autoplay" || autoplayCountdown === null) return;

    if (autoplayCountdown > 0) {
      const timer = setTimeout(() => {
        setAutoplayCountdown(autoplayCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      if (currentQuestion?.id) {
        onAutoplayAnswerReveal(currentQuestion.id);
      }
      setIsAnswerRevealed(true);
      setNextQuestionCountdown(5);
    }
  }, [autoplayCountdown, quizMode, currentQuestion?.id, onAutoplayAnswerReveal]);

  // Next question countdown effect
  useEffect(() => {
    if (quizMode !== "autoplay" || nextQuestionCountdown === null) return;

    if (nextQuestionCountdown > 0) {
      const timer = setTimeout(() => {
        setNextQuestionCountdown(nextQuestionCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setNextQuestionCountdown(null);
      setIsAnswerRevealed(false);
      onAutoplayNextQuestion();
    }
  }, [nextQuestionCountdown, quizMode, onAutoplayNextQuestion]);

  // Trigger auto-read when current question changes
  useEffect(() => {
    if (!hasStarted || isShowingResultScreen) {
      stopAutoRead();
      return;
    }

    if (isAutoReadEnabled && currentQuestion) {
      startAutoReadQueue(currentQuestion);
    } else {
      stopAutoRead();
    }

    return () => {
      stopAutoRead();
    };
  }, [currentQuestion?.id, isAutoReadEnabled, hasStarted, isShowingResultScreen, startAutoReadQueue, stopAutoRead]);

  const playClickSound = useCallback(() => {
    if (typeof window !== "undefined" && !isMuted) {
      const snd = new Audio("/sounds/click.wav");
      snd.play().catch(() => {});
    }
  }, [isMuted]);

  return {
    isMuted,
    setIsMuted,
    bgMusicRef,
    autoplayCountdown,
    setAutoplayCountdown,
    nextQuestionCountdown,
    setNextQuestionCountdown,
    isAnswerRevealed,
    setIsAnswerRevealed,
    getQuestionSpeed,
    stopAutoRead,
    playClickSound,
  };
}
export default useQuizAudioEngine;
