"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Play, Pause } from 'lucide-react';

interface CustomAudioPlayerProps {
  src: string;
  title?: string;
  subtitle?: string;
  className?: string;
}

export function CustomAudioPlayer({ 
  src, 
  title = "Nghe bài giảng", 
  subtitle = "Audio Lesson",
  className = "" 
}: CustomAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Safe percentage: returns 0 if duration is 0 or NaN
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

  const stopAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
    setCurrentTime(0);
    window.dispatchEvent(new CustomEvent('readingAudioTimeUpdate', { detail: { currentTime: -1 } }));
  };

  const changeSpeed = (speed: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = speed;
    setPlaybackRate(speed);
  };

  // Seek by clicking/dragging directly on the progress track
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
    if (e.buttons !== 1) return; // only when mouse button held
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
      // duration is reliable here
      if (isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };

    // Some browsers fire durationchange separately
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

    // Apply current playback rate in case component re-mounts
    audio.playbackRate = playbackRate;

    // If metadata already loaded (e.g. cached)
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

  // Keep playback rate in sync without re-attaching all listeners
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const formatTime = (time: number) => {
    if (!isFinite(time) || time < 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`bg-white/40 backdrop-blur-md rounded-3xl p-6 border border-white/60 shadow-xl flex items-center gap-6 animate-in slide-in-from-top-4 duration-500 ${className}`}>
      <audio ref={audioRef} src={src} preload="metadata" />
      
      {/* Play/Pause Button */}
      <button 
        onClick={togglePlay}
        className="size-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 shrink-0 hover:scale-105 active:scale-95 transition-all"
      >
        {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
      </button>

      <div className="flex-1 min-w-0 space-y-3">
        {/* Title row + controls */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-black text-slate-700 uppercase tracking-widest truncate">{title}</span>
            {subtitle && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{subtitle}</span>}
          </div>
          
          <div className="flex items-center gap-2 shrink-0">

            
            {/* Speed buttons */}
            {([1, 1.5, 2] as const).map((speed) => (
              <button
                key={speed}
                onClick={() => changeSpeed(speed)}
                className={`px-3 py-1 rounded-full text-[10px] font-black transition-all ${
                  playbackRate === speed 
                  ? "bg-primary text-white shadow-sm" 
                  : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        {/* Progress row */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-slate-400 w-8 shrink-0">{formatTime(currentTime)}</span>

          {/* Progress track — single source of truth, no overlapping absolutes */}
          <div
            ref={progressRef}
            onClick={handleSeek}
            onMouseMove={handleMouseMove}
            className="flex-1 h-2 bg-slate-200 rounded-full cursor-pointer overflow-hidden"
          >
            <div
              className="h-full bg-primary rounded-full transition-none"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <span className="text-[10px] font-bold text-slate-400 w-8 text-right shrink-0">{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}
