"use client";

import React, { useState, useRef, useEffect } from "react";
import { User, X, ChevronRight } from "lucide-react";
import Link from "next/link";

interface TeacherInfo {
  id: string;
  name: string | null;
  image: string | null;
  professionalTitle: string | null;
  bio: string | null;
  isPortfolioPublished: boolean;
  _count: {
    lessons: number;
    assignments: number;
  };
}

export function FloatingTeacherInfo({ 
  teacher,
  onNavigate
}: { 
  teacher: TeacherInfo,
  onNavigate?: (href: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="fixed top-24 left-8 z-[150]">
      {/* Floating Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-[72px] h-[72px] rounded-full border-4 border-white dark:border-slate-800 shadow-2xl overflow-hidden bg-white hover:scale-110 active:scale-95 transition-all focus:outline-none ring-1 ring-black/5"
      >
        {teacher.image ? (
          <img src={teacher.image} alt={teacher.name || ""} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
            <User className="w-6 h-6" />
          </div>
        )}
      </button>

      {/* Popup */}
      {isOpen && (
        <div 
          ref={popupRef}
          className="absolute top-full left-0 mt-3 w-80 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200"
        >
          <div className="space-y-4 flex flex-col items-center text-center w-full">
            <div className="w-20 h-20 rounded-full border-2 border-white dark:border-slate-800 shadow-lg overflow-hidden bg-white">
              {teacher.image ? (
                <img src={teacher.image} alt={teacher.name || ""} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                  <User className="w-10 h-10" />
                </div>
              )}
            </div>
            
            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">{teacher.name}</h3>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{teacher.professionalTitle || "Giảng viên tại Học viện"}</p>
            </div>
          </div>

          <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed text-center">
            {teacher.bio || "Giảng viên tâm huyết với nhiều năm kinh nghiệm trong lĩnh vực giáo dục và đào tạo."}
          </p>

          <Link 
            href={`/public/teachers/${teacher.id}`}
            onClick={(e) => {
              setIsOpen(false);
              if (onNavigate) {
                e.preventDefault();
                onNavigate(`/public/teachers/${teacher.id}`);
              }
            }}
            className="w-full py-3 bg-slate-900 dark:bg-primary text-white rounded-full font-black text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 uppercase tracking-widest italic"
          >
            Xem Hồ Sơ
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
