"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface CustomAudioPlayerProps {
  src: string;
  title?: string;
  subtitle?: string;
  className?: string;
}

export function CustomAudioPlayer({ 
  src, 
  title = "Nghe bài giảng", 
  subtitle = "Lesson Audio",
  className = "" 
}: CustomAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(0);

  const speeds = [1, 1.25, 1.5, 0.75];
  const progressPercent = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const cycleSpeed = () => {
    const audio = audioRef.current;
    const nextIdx = (speedIdx + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    if (audio) audio.playbackRate = nextSpeed;
    setSpeedIdx(nextIdx);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressRef.current;
    const audio = audioRef.current;
    if (!bar || !audio || duration <= 0) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min((e.clientX - rect.left) / rect.width, 1));
    const newTime = ratio * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  }, [duration]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return;
    handleSeek(e);
  }, [handleSeek]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      window.dispatchEvent(new CustomEvent('readingAudioTimeUpdate', { detail: { currentTime: audio.currentTime } }));
    };

    const handleLoadedMetadata = () => {
      if (isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };

    const handleDurationChange = () => {
      if (isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      window.dispatchEvent(new CustomEvent('readingAudioTimeUpdate', { detail: { currentTime: -1 } }));
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    // Apply current speed
    audio.playbackRate = speeds[speedIdx] ?? 1;

    // If metadata already loaded (cached)
    if (isFinite(audio.duration) && audio.duration > 0) {
      setDuration(audio.duration);
    }

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      window.dispatchEvent(new CustomEvent('readingAudioTimeUpdate', { detail: { currentTime: -1 } }));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  const formatTime = (time: number) => {
    if (!isFinite(time) || time < 0) return '00:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`bg-emerald-50/70 backdrop-blur-xl rounded-[20px] p-4 sm:p-6 border border-emerald-100 shadow-xl flex items-center gap-4 sm:gap-6 animate-in slide-in-from-top-4 duration-500 ${className}`}>
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* ── Play/Pause button ── round, like reference */}
      <button
        onClick={togglePlay}
        className="size-12 sm:size-14 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30 shrink-0 hover:scale-105 active:scale-95 transition-all"
      >
        {isPlaying
          ? <Pause className="w-5 h-5 fill-current" />
          : <Play className="w-5 h-5 fill-current ml-0.5" />
        }
      </button>

      {/* ── Progress + timestamps ── */}
      <div className="flex-1 flex flex-col gap-2 min-w-0">
        <div className="flex justify-between items-center text-[11px] font-black text-slate-500">
          <span>{formatTime(currentTime)}</span>
          <span className="hidden sm:inline text-[10px] uppercase tracking-widest text-primary/70">{subtitle}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <div
          ref={progressRef}
          onClick={handleSeek}
          onMouseMove={handleMouseMove}
          className="h-3 w-full bg-white rounded-full overflow-hidden cursor-pointer relative"
        >
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-emerald-300 rounded-full transition-none"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* ── Speed cycle button ── single button like reference */}
      <button
        onClick={cycleSpeed}
        className="h-10 px-3 rounded-full font-black text-[11px] text-slate-500 hover:bg-white transition-colors shrink-0"
      >
        {speeds[speedIdx]}x
      </button>

      {/* ── Mute toggle ── */}
      <button
        onClick={toggleMute}
        className="size-10 rounded-full hover:bg-white flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors shrink-0"
      >
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>
    </div>
  );
}
