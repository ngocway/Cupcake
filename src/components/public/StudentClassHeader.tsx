"use client";

import React from "react";
import Link from "next/link";

interface StudentClassHeaderProps {
  session?: {
    id: string;
    name: string | null;
    image: string | null;
    role: string | null;
    email?: string | null;
    studyAgeGroup?: string | null;
  } | null;
}

export function StudentClassHeader({ session }: StudentClassHeaderProps) {
  return (
    <>
      {/* ════════════════════════════════════════════════════════════════
          1. FLOATING DOLCAKE LOGO (Top-Left - Quay về Trang Chủ)
          ════════════════════════════════════════════════════════════════ */}
      <Link 
        href="/" 
        className="fixed top-3 left-3 sm:top-4 sm:left-4 z-40 inline-flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-lg shadow-black/10 border-2 border-white/80 dark:border-slate-700 hover:scale-105 active:scale-95 transition-all group cursor-pointer"
        title="Về trang chủ Dolcake"
      >
        <img 
          src="/images/logo.png" 
          alt="Dolcake" 
          className="w-7 h-7 sm:w-8 sm:h-8 object-contain transition-transform duration-300 group-hover:scale-110" 
        />
        <span className="font-headline font-black text-sm sm:text-base tracking-tight text-primary">
          Dolcake
        </span>
      </Link>

      {/* ════════════════════════════════════════════════════════════════
          2. FLOATING FACEBOOK GROUP BUTTON (Bottom-Right)
          ════════════════════════════════════════════════════════════════ */}
      <a
        href="https://www.facebook.com/groups/2340951663410999"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 inline-flex items-center gap-2 px-3.5 py-2.5 sm:px-4 sm:py-2.5 rounded-full bg-[#1877F2] hover:bg-[#166fe5] text-white font-black text-xs sm:text-sm shadow-xl shadow-blue-600/30 hover:shadow-2xl hover:shadow-blue-600/45 hover:scale-105 active:scale-95 transition-all cursor-pointer border-2 border-white/90 dark:border-slate-800 backdrop-blur-xs group"
        title="Tham gia nhóm Facebook Dolcake"
      >
        <svg className="w-4 h-4 fill-current shrink-0 group-hover:rotate-12 transition-transform" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
        <span>Tham gia nhóm FB</span>
      </a>
    </>
  );
}
