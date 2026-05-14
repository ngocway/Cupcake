"use client";

import React, { useState, useEffect } from 'react';
import { Play } from 'lucide-react';
import Image from 'next/image';

interface LessonVideoPlayerProps {
  videoId: string | null;
  videoUrl: string | null;
  title: string;
  thumbnail?: string | null;
  lessonId?: string;
  studentId?: string;
}

import { startLessonProgress, completeLessonProgress } from "@/actions/lesson-progress-actions";

export function LessonVideoPlayer({ videoId, videoUrl, title, thumbnail, lessonId, studentId }: LessonVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  useEffect(() => {
    // Try highest quality YouTube thumbnail first
    if (videoId) {
      setImgSrc(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`);
    } else if (thumbnail) {
      setImgSrc(thumbnail);
    }
  }, [videoId, thumbnail]);

  const handlePlay = () => {
    setIsPlaying(true);
    if (lessonId && studentId) {
      startLessonProgress(lessonId, studentId);
    }
  };

  const handleEnded = () => {
    if (lessonId && studentId) {
      completeLessonProgress(lessonId, studentId);
    }
  };

  const handleImgError = () => {
    if (videoId && imgSrc?.includes('maxresdefault')) {
      setImgSrc(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);
    }
  };

  if (isPlaying) {
    return (
      <div className="aspect-video bg-black rounded-[2rem] overflow-hidden shadow-2xl ring-1 ring-white/10 shrink-0">
        {videoId ? (
          <iframe
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video 
            src={videoUrl!} 
            className="w-full h-full" 
            controls 
            autoPlay
            onEnded={handleEnded}
          />
        )}
      </div>
    );
  }

  return (
    <div 
      className="aspect-video bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl group relative ring-1 ring-white/10 shrink-0 cursor-pointer overflow-hidden"
      onClick={handlePlay}
    >
      {/* Background Image / Mesh Gradient */}
      {imgSrc ? (
        <img 
          src={imgSrc} 
          alt={title} 
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          onError={handleImgError}
        />
      ) : (
        <div className="w-full h-full bg-[#00adef] relative overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-br from-[#00adef] via-[#007bbd] to-[#005a8d]" />
           <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-white/20 rounded-full blur-[120px] animate-pulse" />
           <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-400/20 rounded-full blur-[100px]" />
        </div>
      )}
      
      {/* Dark Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

      {/* Play Button with Glow */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
           <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
           <div className="w-20 h-20 md:w-28 md:h-28 bg-white/10 backdrop-blur-2xl rounded-full flex items-center justify-center border border-white/20 transition-all duration-500 group-hover:scale-110 group-hover:bg-white group-hover:border-white shadow-2xl">
             <Play className="w-8 h-8 md:w-12 md:h-12 text-white fill-white group-hover:text-primary group-hover:fill-primary transition-colors ml-1.5" />
           </div>
        </div>
      </div>

      {/* Bottom Content Information */}
      <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 space-y-4 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
        <div className="flex items-center gap-3">
           <div className="px-4 py-1.5 bg-primary rounded-full border border-white/20 shadow-lg">
              <span className="text-white font-black text-[9px] uppercase tracking-[0.2em]">Video Bài Giảng</span>
           </div>
           <div className="h-[1px] w-12 bg-white/20" />
        </div>
        <h3 className="text-xl md:text-3xl font-black text-white uppercase italic tracking-tight leading-tight drop-shadow-lg max-w-2xl">
           {title}
        </h3>
      </div>

      {/* Glassy Tag */}
      <div className="absolute top-8 left-8">
        <div className="px-5 py-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 flex items-center gap-3">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
          <span className="text-white font-black text-[10px] uppercase tracking-[0.2em] opacity-80">4K Ultra HD</span>
        </div>
      </div>
    </div>
  );
}
