"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface GlobalAudioPlayerProps {
  audioUrl: string;
  autoPlay?: boolean;
  defaultPlaybackRate?: number;
}

export function GlobalAudioPlayer({ audioUrl, autoPlay = false, defaultPlaybackRate = 1.0 }: GlobalAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(defaultPlaybackRate);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const speeds = [0.65, 0.75, 0.8, 0.9, 1, 1.2, 1.5];

  useEffect(() => {
    setPlaybackSpeed(defaultPlaybackRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = defaultPlaybackRate;
    }
  }, [defaultPlaybackRate]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      setDuration(audio.duration);
      audio.defaultPlaybackRate = playbackSpeed;
      audio.playbackRate = playbackSpeed;
    };

    const setAudioTime = () => {
      setProgress((audio.currentTime / audio.duration) * 100);
      window.dispatchEvent(new CustomEvent('readingAudioTimeUpdate', { detail: { currentTime: audio.currentTime } }));
    };

    const handleAudioEnd = () => {
      setIsPlaying(false);
      setProgress(0);
      audio.currentTime = 0;
      window.dispatchEvent(new CustomEvent('readingAudioTimeUpdate', { detail: { currentTime: -1 } }));
    };

    const handlePauseEvent = () => {
      setIsPlaying(false);
      window.dispatchEvent(new CustomEvent('materialAudioPause'));
    };

    const handlePlayEvent = () => {
      setIsPlaying(true);
      audio.playbackRate = playbackSpeed;
      window.dispatchEvent(new CustomEvent('materialAudioPlay'));
    };

    const handlePlayingEvent = () => {
      audio.playbackRate = playbackSpeed;
    };

    audio.addEventListener('loadedmetadata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('ended', handleAudioEnd);
    audio.addEventListener('pause', handlePauseEvent);
    audio.addEventListener('play', handlePlayEvent);
    audio.addEventListener('playing', handlePlayingEvent);

    return () => {
      audio.removeEventListener('loadedmetadata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('ended', handleAudioEnd);
      audio.removeEventListener('pause', handlePauseEvent);
      audio.removeEventListener('play', handlePlayEvent);
      audio.removeEventListener('playing', handlePlayingEvent);
      window.dispatchEvent(new CustomEvent('readingAudioTimeUpdate', { detail: { currentTime: -1 } }));
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (autoPlay && audio && audioUrl) {
      const attemptPlay = () => {
        audio.play().catch(e => {
          console.log("Autoplay blocked for material audio, waiting for interaction", e);
          const playOnInteraction = () => {
            audio.play().catch(() => {});
            window.removeEventListener('click', playOnInteraction);
            window.removeEventListener('touchstart', playOnInteraction);
            window.removeEventListener('keydown', playOnInteraction);
            window.removeEventListener('mousedown', playOnInteraction);
          };
          window.addEventListener('click', playOnInteraction);
          window.addEventListener('touchstart', playOnInteraction);
          window.addEventListener('keydown', playOnInteraction);
          window.addEventListener('mousedown', playOnInteraction);
        });
      };
      
      const timer = setTimeout(attemptPlay, 100);
      return () => clearTimeout(timer);
    }
  }, [audioUrl, autoPlay]);

  useEffect(() => {
    const handleGlobalPause = (e: CustomEvent) => {
      if (e.detail?.source !== 'GlobalAudioPlayer') {
        audioRef.current?.pause();
      }
    };
    window.addEventListener('pauseAllAudio', handleGlobalPause as EventListener);
    return () => {
      window.removeEventListener('pauseAllAudio', handleGlobalPause as EventListener);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      // Dispatch event to pause other audios
      window.dispatchEvent(new CustomEvent('pauseAllAudio', { detail: { source: 'GlobalAudioPlayer' } }));
      audio.play().catch(e => console.error("Error playing audio", e));
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !audioRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width);
    const newTime = percentage * duration;
    
    audioRef.current.currentTime = newTime;
    setProgress(percentage * 100);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!audioUrl) return null;

  return (
    <div className="w-full bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-[2rem] p-6 shadow-xl shadow-primary/5 border border-primary/10 mt-8 mb-4 flex items-center gap-6 animate-in fade-in duration-500">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      {/* Play/Pause Button */}
      <button 
        onClick={togglePlay}
        className="size-14 rounded-full bg-primary hover:bg-primary/90 text-white flex items-center justify-center shrink-0 shadow-lg shadow-primary/30 transition-all hover:scale-105 active:scale-95"
      >
        {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
      </button>

      {/* Progress & Time */}
      <div className="flex-1 flex flex-col gap-2">
        <div className="flex justify-between items-center text-xs font-bold text-slate-500 dark:text-slate-400">
          <span>{formatTime(audioRef.current?.currentTime || 0)}</span>
          <span className="hidden sm:inline text-[10px] uppercase tracking-widest text-primary/70">Lesson Audio</span>
          <span>{formatTime(duration)}</span>
        </div>
        
        {/* Progress Bar */}
        <div 
          ref={progressRef}
          onClick={handleProgressClick}
          className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden cursor-pointer relative group"
        >
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-blue-400 rounded-full transition-all duration-150 ease-out"
            style={{ width: `${progress}%` }}
          />
          {/* Hover indicator could be added here if desired */}
        </div>
      </div>

      {/* Speed Button & Menu */}
      <div className="relative shrink-0">
        <button 
          onClick={() => setShowSpeedMenu(!showSpeedMenu)}
          className={`h-10 px-3 min-w-[3rem] rounded-full flex items-center justify-center font-bold text-[11px] transition-colors ${showSpeedMenu ? 'bg-primary text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}`}
        >
          {playbackSpeed}x
        </button>
        
        {showSpeedMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowSpeedMenu(false)} />
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-slate-100 dark:border-slate-700 p-1.5 z-50 flex flex-col gap-0.5 min-w-[4rem] animate-in slide-in-from-bottom-2 fade-in duration-200">
              {speeds.map(s => (
                <button
                  key={s}
                  onClick={() => {
                    setPlaybackSpeed(s);
                    if (audioRef.current) audioRef.current.playbackRate = s;
                    setShowSpeedMenu(false);
                  }}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${playbackSpeed === s ? 'bg-primary/10 text-primary scale-100' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:scale-105'}`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Mute Button */}
      <button 
        onClick={toggleMute}
        className="size-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors shrink-0"
      >
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>
    </div>
  );
}
