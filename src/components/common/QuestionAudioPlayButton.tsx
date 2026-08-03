"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Pause, Lightbulb } from 'lucide-react';

interface QuestionAudioPlayButtonProps {
  src?: string | null;
  text?: string;
  className?: string;
  playbackRate?: number;
}

export function QuestionAudioPlayButton({ src, text, className = "", playbackRate = 1.0 }: QuestionAudioPlayButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      window.dispatchEvent(new CustomEvent('hintAudioPause'));
    };
  }, []);

  const playTTS = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !text) {
      setIsPlaying(false);
      setIsLoading(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = playbackRate;

    utterance.onstart = () => {
      setIsLoading(false);
      setIsPlaying(true);
      window.dispatchEvent(new CustomEvent('hintAudioPlay'));
    };

    utterance.onend = () => {
      setIsPlaying(false);
      window.dispatchEvent(new CustomEvent('hintAudioPause'));
    };

    utterance.onerror = () => {
      setIsLoading(false);
      setIsPlaying(false);
      window.dispatchEvent(new CustomEvent('hintAudioPause'));
    };

    window.speechSynthesis.speak(utterance);
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
      return;
    }

    // Pause all other audio
    window.dispatchEvent(new CustomEvent('pauseAllAudio', { detail: { source: 'QuestionAudio' } }));

    if (!src) {
      if (text) {
        playTTS();
      }
      return;
    }

    if (!audioRef.current) {
      setIsLoading(true);
      const audio = new Audio(src);
      audio.defaultPlaybackRate = playbackRate;
      audio.playbackRate = playbackRate;
      audioRef.current = audio;

      audio.addEventListener('canplaythrough', () => setIsLoading(false));
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        window.dispatchEvent(new CustomEvent('hintAudioPause'));
      });
      audio.addEventListener('pause', () => {
        setIsPlaying(false);
        window.dispatchEvent(new CustomEvent('hintAudioPause'));
      });
      audio.addEventListener('play', () => {
        audio.playbackRate = playbackRate;
        setIsPlaying(true);
        window.dispatchEvent(new CustomEvent('hintAudioPlay'));
      });
      audio.addEventListener('playing', () => {
        audio.playbackRate = playbackRate;
      });
      audio.addEventListener('error', () => {
        setIsLoading(false);
        if (text) {
          playTTS();
        } else {
          setIsPlaying(false);
        }
      });
    }

    audioRef.current.play().then(() => {
      if (audioRef.current) {
        audioRef.current.playbackRate = playbackRate;
      }
    }).catch(() => {
      setIsLoading(false);
      if (text) {
        playTTS();
      } else {
        setIsPlaying(false);
      }
    });
  };

  useEffect(() => {
    const handleGlobalPause = (e: CustomEvent) => {
      if (e.detail?.source !== 'QuestionAudio' || e.detail?.src !== src) {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        if (typeof window !== 'undefined' && window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
        setIsPlaying(false);
      }
    };
    window.addEventListener('pauseAllAudio', handleGlobalPause as EventListener);
    window.addEventListener('materialAudioPlay', handleGlobalPause as EventListener);
    return () => {
      window.removeEventListener('pauseAllAudio', handleGlobalPause as EventListener);
      window.removeEventListener('materialAudioPlay', handleGlobalPause as EventListener);
    };
  }, [src]);

  if (!src && !text) return null;

  return (
    <button
      onClick={handlePlay}
      className={`inline-flex items-center justify-center gap-1.5 px-4.5 py-2 rounded-full border transition-all duration-300 active:scale-95 select-none cursor-pointer text-xs font-black uppercase tracking-wider ${
        isPlaying
          ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-500/20 animate-pulse'
          : isLoading
            ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 cursor-wait'
            : 'bg-amber-50 hover:bg-amber-100 border-amber-200 hover:border-amber-300 text-amber-700 hover:text-amber-800 dark:bg-amber-950/20 dark:hover:bg-amber-950/40 dark:border-amber-900/40 dark:text-amber-300 dark:hover:text-amber-200 shadow-sm'
      } ${className}`}
      title={isPlaying ? "Pause" : isLoading ? "Loading..." : "Listen to audio hint"}
    >
      {isLoading ? (
        <span className="w-3.5 h-3.5 rounded-full border-2 border-amber-500/20 border-t-amber-600 animate-spin" />
      ) : isPlaying ? (
        <Pause className="w-3.5 h-3.5 fill-current" />
      ) : (
        <Lightbulb className="w-3.5 h-3.5" />
      )}
      <span>{isPlaying ? "Playing..." : isLoading ? "Loading..." : "Hint"}</span>
    </button>
  );
}
