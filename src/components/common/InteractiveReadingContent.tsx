"use client";

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Volume2, PlusCircle, GraduationCap, BookOpen } from 'lucide-react';

interface VocabularyInfo {
  word: string;
  pronunciation: string;
  meaningVi: string;
  explanationEn: string;
  examples: string[];
}

export function InteractiveReadingContent({ html }: { html: string }) {
  const [mounted, setMounted] = useState(false);
  const [activeVocab, setActiveVocab] = useState<VocabularyInfo | null>(null);
  const [position, setPosition] = useState({ 
    x: 0, 
    y: 0, 
    side: 'top' as 'top' | 'bottom',
    arrowX: 0 
  });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const marker = target.closest('.custom-vocab-marker');
    
    if (marker) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      const rect = marker.getBoundingClientRect();
      const POPUP_WIDTH = 560;
      const MARGIN = 20;
      const POPUP_HEIGHT = 400;
      
      const spaceAbove = rect.top;
      const side = spaceAbove < POPUP_HEIGHT ? 'bottom' : 'top';

      const wordCenterX = rect.left + rect.width / 2;
      let idealLeft = wordCenterX - POPUP_WIDTH / 2;
      
      const leftBoundary = MARGIN;
      const rightBoundary = window.innerWidth - POPUP_WIDTH - MARGIN;
      const effectiveLeft = Math.max(leftBoundary, Math.min(rightBoundary, idealLeft));
      
      const arrowRelativeX = wordCenterX - effectiveLeft;

      const info: VocabularyInfo = {
        word: marker.getAttribute('data-word') || '',
        pronunciation: marker.getAttribute('data-pronunciation') || '',
        meaningVi: marker.getAttribute('data-meaning-vi') || '',
        explanationEn: marker.getAttribute('data-explanation-en') || '',
        examples: (marker.getAttribute('data-examples') || '').split(';').map(s => s.trim()),
      };
      
      setActiveVocab(info);
      setPosition({ 
        x: effectiveLeft, 
        y: side === 'top' ? rect.top - 12 : rect.bottom + 12,
        side,
        arrowX: arrowRelativeX
      });
    } else {
      // Tăng thời gian trễ lên 200ms để user kịp di chuyển chuột vào popup
      if (!timeoutRef.current) {
        timeoutRef.current = setTimeout(() => {
          setActiveVocab(null);
          timeoutRef.current = null;
        }, 200);
      }
    }
  };

  const handlePopupMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handlePopupMouseLeave = () => {
    setActiveVocab(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const renderPopup = () => {
    if (!activeVocab || !mounted) return null;

    return createPortal(
      <div 
        className="fixed z-[9999] p-4 pointer-events-auto" // Thêm padding p-4 để tạo vùng đệm cho chuột
        style={{ 
          left: `${position.x}px`, 
          top: `${position.y}px`,
          transform: position.side === 'top' ? 'translateX(0) translateY(-100%)' : 'translateX(0) translateY(0)',
          margin: position.side === 'top' ? '0 0 -16px 0' : '-16px 0 0 0' // Bù trừ cho padding đệm
        }}
        onMouseEnter={handlePopupMouseEnter}
        onMouseLeave={handlePopupMouseLeave}
      >
        <div className="w-[560px] bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_35px_100px_rgba(0,0,0,0.4)] border border-slate-100 dark:border-slate-800 p-8 animate-in fade-in zoom-in-95 duration-200 relative">
          <div className="flex gap-8 items-stretch">
            {/* Left Column */}
            <div className="w-[200px] flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-[9px] font-black text-primary/60 uppercase tracking-[0.2em]">Vocab</span>
              </div>
              
              <div className="space-y-1 mb-6">
                <h4 className="text-3xl font-black text-slate-900 dark:text-white leading-none tracking-tight">
                  {activeVocab.word}
                </h4>
                <div className="flex items-center gap-1.5 text-primary/60 font-bold text-xs">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span className="font-mono tracking-wider">/{activeVocab.pronunciation}/</span>
                </div>
              </div>

              <div className="space-y-1 mb-auto">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">Nghĩa Việt</p>
                <p className="text-slate-800 dark:text-white font-black text-xl tracking-tight leading-tight">
                  {activeVocab.meaningVi}
                </p>
              </div>

              <button className="w-full h-12 bg-primary text-white rounded-2xl font-black text-[9px] tracking-widest uppercase flex items-center justify-center gap-2 mt-6 shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors">
                <PlusCircle className="w-4 h-4" />
                Add Word
              </button>
            </div>

            {/* Right Column */}
            <div className="flex-1 space-y-5 border-l border-slate-100 dark:border-slate-800 pl-8">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">English Explanation</p>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-[14px] font-medium leading-relaxed">
                  {activeVocab.explanationEn}
                </p>
              </div>

              {activeVocab.examples[0] && (
                <div className="relative p-5 bg-slate-50/80 dark:bg-slate-800/50 rounded-[1.8rem] border border-slate-100 dark:border-slate-800/50">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2">Ví dụ minh họa</p>
                  <p className="text-slate-700 dark:text-slate-200 text-[13px] italic font-medium leading-relaxed relative z-10">
                    "{activeVocab.examples[0]}"
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Dynamic Arrow */}
          <div 
            className={`absolute w-4 h-4 pointer-events-none ${position.side === 'top' ? 'bottom-0 translate-y-full' : 'top-0 -translate-y-full'}`}
            style={{ 
              left: `${position.arrowX}px`,
              transform: `translateX(-50%)`
            }}
          >
            <div 
              className={`w-4 h-4 bg-white dark:bg-slate-900 rotate-45 border-slate-100 dark:border-slate-800 ${
                position.side === 'top' 
                ? 'border-r border-b -translate-y-2' 
                : 'border-l border-t translate-y-2'
              }`} 
            />
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div 
      className="relative"
      onMouseMove={handleMouseMove}
    >
      <div 
        dangerouslySetInnerHTML={{ __html: html }} 
        className="interactive-reading-content"
      />

      {renderPopup()}

      <style jsx global>{`
        .custom-vocab-marker {
          background-color: transparent !important;
          border-bottom: 2px dashed #facc15 !important;
          cursor: help !important;
          padding: 0 1px;
          color: #854d0e !important;
          font-weight: 700 !important;
          transition: all 0.2s;
        }
        .custom-vocab-marker:hover {
          background-color: #fef9c3 !important;
          border-bottom-style: solid !important;
          color: #713f12 !important;
        }
      `}</style>
    </div>
  );
}
