"use client";

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Volume2, PlusCircle, BookOpen, LogIn } from 'lucide-react';
import { getUserVocabLanguage, updateUserVocabLanguage } from '@/actions/vocab-settings';
import { SelectionTranslator } from './SelectionTranslator';

interface VocabularyInfo {
  word: string;
  pronunciation: string;
  meaningVi: string;
  meaningTh: string;
  meaningId: string;
  explanationEn: string;
  examples: string[];
  image: string;
}

export function InteractiveReadingContent({ html, isLoggedIn = false }: { html: string; isLoggedIn?: boolean }) {
  const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '—';
  const [mounted, setMounted] = useState(false);
  const [currentLang, setCurrentLang] = useState('VI');
  const [activeVocab, setActiveVocab] = useState<VocabularyInfo | null>(null);
  const [imageError, setImageError] = useState(false);
  const [position, setPosition] = useState({ 
    x: 0, 
    y: 0, 
    side: 'top' as 'top' | 'bottom',
    arrowX: 0 
  });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const playingAudioRef = useRef<HTMLAudioElement | null>(null);
  const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    
    async function loadLanguagePref() {
      const dbPref = await getUserVocabLanguage();
      if (dbPref) {
        setCurrentLang(dbPref);
      } else {
        setCurrentLang(localStorage.getItem('vocabLang') || 'VI');
      }
    }
    loadLanguagePref();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (playingAudioRef.current) {
        playingAudioRef.current.pause();
        playingAudioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Imperatively update the styling of the currently playing marker
    // since they are rendered via dangerouslySetInnerHTML
    const markers = document.querySelectorAll('.inline-audio-marker');
    markers.forEach(marker => {
      if (marker.getAttribute('data-audio-url') === playingAudioUrl) {
        marker.classList.add('bg-primary', 'text-white', 'shadow-md', 'scale-105');
        marker.classList.remove('bg-primary/10', 'text-primary');
        const icon = marker.querySelector('.material-symbols-outlined');
        if (icon) {
          icon.textContent = 'graphic_eq';
          icon.classList.add('animate-pulse');
        }
      } else {
        marker.classList.remove('bg-primary', 'text-white', 'shadow-md', 'scale-105');
        marker.classList.add('bg-primary/10', 'text-primary');
        const icon = marker.querySelector('.material-symbols-outlined');
        if (icon) {
          icon.textContent = 'volume_up';
          icon.classList.remove('animate-pulse');
        }
      }
    });
  }, [playingAudioUrl]);

  const handleLangChange = async (lang: string) => {
    setCurrentLang(lang);
    localStorage.setItem('vocabLang', lang);
    await updateUserVocabLanguage(lang);
  };

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    
    // 1. Handle Inline Audio Click
    const audioMarker = target.closest('.inline-audio-marker');
    if (audioMarker) {
      e.preventDefault();
      const url = audioMarker.getAttribute('data-audio-url');
      if (url) {
        if (playingAudioRef.current) {
          playingAudioRef.current.pause();
          playingAudioRef.current.currentTime = 0;
        }
        
        // If clicking the same audio that is playing, just stop it
        if (playingAudioUrl === url) {
          setPlayingAudioUrl(null);
          return;
        }
        
        const audio = new Audio(url);
        playingAudioRef.current = audio;
        setPlayingAudioUrl(url);
        audio.play().catch(e => console.error("Audio playback failed", e));
        
        audio.onended = () => {
          setPlayingAudioUrl(null);
        };
        return;
      }
    }
    
    // 2. Handle Vocab click
    const marker = target.closest('.custom-vocab-marker');
    
    if (marker) {
      const clickedWord = marker.getAttribute('data-word') || '';
      if (activeVocab?.word === clickedWord) {
        setActiveVocab(null);
        return;
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
        meaningTh: marker.getAttribute('data-meaning-th') || '',
        meaningId: marker.getAttribute('data-meaning-id') || '',
        explanationEn: marker.getAttribute('data-explanation-en') || '',
        examples: (marker.getAttribute('data-examples') || '').split(';').map(s => s.trim()),
        image: marker.getAttribute('data-image') || '',
      };
      
      setActiveVocab(info);
      setPosition({ 
        x: effectiveLeft, 
        y: side === 'top' ? rect.top - 12 : rect.bottom + 12,
        side,
        arrowX: arrowRelativeX
      });
      setImageError(false);
    } else {
      setActiveVocab(null);
    }
  };



  const handlePlayAudio = () => {
    if ('speechSynthesis' in window && activeVocab) {
      // Cancel any ongoing speech to prevent overlapping
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(activeVocab.word);
      utterance.lang = 'en-US';
      utterance.rate = 0.9; // Slightly slower for clearer pronunciation
      window.speechSynthesis.speak(utterance);
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
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-[560px] bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_35px_100px_rgba(0,0,0,0.4)] border border-slate-100 dark:border-slate-800 p-8 animate-in fade-in zoom-in-95 duration-200 relative">
          <div className="flex gap-8 items-stretch">
            {/* Left Column */}
            <div className="w-[200px] flex flex-col">

              {activeVocab.image && !imageError && (
                <div className="h-28 w-full rounded-[4px] overflow-hidden mb-4">
                  <img 
                    src={activeVocab.image} 
                    alt={activeVocab.word} 
                    className="w-full h-full object-cover" 
                    onError={() => setImageError(true)}
                  />
                </div>
              )}
              
              <div className="space-y-1 mb-6">
                <h4 className="text-3xl font-black text-slate-900 dark:text-white leading-none tracking-tight">
                  {activeVocab.word}
                </h4>
                <div 
                  className="flex items-center gap-1.5 text-primary/60 font-bold text-xs cursor-pointer hover:text-primary transition-colors w-fit"
                  onClick={handlePlayAudio}
                  title="Nghe phát âm"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span className="font-mono tracking-wider">{activeVocab.pronunciation.replace(/^\/+/, '/').replace(/\/+$/, '/')}</span>
                </div>
              </div>

              <div className="mb-auto space-y-1">
                {/* TRANSLATION label + flag switcher on same row */}
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">TRANSLATION</p>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleLangChange('VI')}
                      title="Vietnamese"
                      className={`w-5 h-5 rounded-full overflow-hidden transition-all duration-200 hover:scale-110 ${
                        currentLang === 'VI'
                          ? 'ring-2 ring-offset-1 ring-primary shadow-sm scale-110'
                          : 'opacity-40 hover:opacity-80'
                      }`}
                    >
                      <img src="/flags/flag-vi.png" alt="Vietnamese" className="w-full h-full object-cover" />
                    </button>
                    <button
                      onClick={() => handleLangChange('TH')}
                      title="Thai"
                      className={`w-5 h-5 rounded-full overflow-hidden transition-all duration-200 hover:scale-110 ${
                        currentLang === 'TH'
                          ? 'ring-2 ring-offset-1 ring-primary shadow-sm scale-110'
                          : 'opacity-40 hover:opacity-80'
                      }`}
                    >
                      <img src="/flags/flag-th.png" alt="Thai" className="w-full h-full object-cover" />
                    </button>
                    <button
                      onClick={() => handleLangChange('ID')}
                      title="Indonesian"
                      className={`w-5 h-5 rounded-full overflow-hidden transition-all duration-200 hover:scale-110 ${
                        currentLang === 'ID'
                          ? 'ring-2 ring-offset-1 ring-primary shadow-sm scale-110'
                          : 'opacity-40 hover:opacity-80'
                      }`}
                    >
                      <img src="/flags/flag-id.png" alt="Indonesian" className="w-full h-full object-cover" />
                    </button>
                  </div>
                </div>
                <p className="text-slate-800 dark:text-white font-black text-lg tracking-tight leading-tight">
                  {currentLang === 'VI' ? capitalize(activeVocab.meaningVi)
                   : currentLang === 'TH' ? capitalize(activeVocab.meaningTh)
                   : capitalize(activeVocab.meaningId)}
                </p>
              </div>


              <button 
                onClick={() => {
                  if (!isLoggedIn) {
                    setShowLoginPrompt(true);
                    return;
                  }
                  // TODO: Add word to user's vocabulary list
                }}
                className="w-full h-12 bg-primary text-white rounded-2xl font-black text-[9px] tracking-widest uppercase flex items-center justify-center gap-2 mt-6 shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                Add Word
              </button>
              {showLoginPrompt && !isLoggedIn && (
                <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl animate-in fade-in slide-in-from-top-2 duration-200">
                  <p className="text-[11px] font-bold text-amber-700 dark:text-amber-300 mb-2">
                    Bạn cần đăng nhập để lưu từ vựng
                  </p>
                  <a 
                    href="/student/login" 
                    className="flex items-center justify-center gap-2 w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    Đăng nhập ngay
                  </a>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="flex-1 space-y-5 border-l border-slate-100 dark:border-slate-800 pl-8">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">English Definition</p>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-[14px] font-medium leading-relaxed">
                  {activeVocab.explanationEn}
                </p>
              </div>

              {activeVocab.examples[0] && (
                <div className="space-y-2 pt-2">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">Example</p>
                  <p className="text-slate-600 dark:text-slate-300 text-[14px] italic font-medium leading-relaxed">
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

  let fixedHtml = html;
  if (fixedHtml && fixedHtml.includes('Nghe Audio')) {
    // Replace old "Nghe Audio" text and update classes for legacy markers
    fixedHtml = fixedHtml
      .replace(/<span class="material-symbols-outlined[^>]*>volume_up<\/span>\s*Nghe Audio/g, '<span class="material-symbols-outlined text-[16px]">volume_up</span>')
      .replace(/class="inline-audio-marker[^"]+"/g, 'class="inline-audio-marker text-primary bg-primary/10 rounded-full w-7 h-7 mx-1 cursor-pointer inline-flex items-center justify-center select-none hover:bg-primary/20 transition-colors shadow-sm ring-1 ring-primary/20 align-middle" title="Nghe Audio"');
  }

  return (
    <div 
      className="relative"
      onClick={handleClick}
    >
      <div 
        dangerouslySetInnerHTML={{ __html: fixedHtml }} 
        className="interactive-reading-content"
      />

      {renderPopup()}
      <SelectionTranslator />

      <style jsx global>{`
        .custom-vocab-marker,
        .custom-vocab-marker * {
          background-color: transparent !important;
          background: transparent !important;
          cursor: pointer !important;
          padding: 0 !important;
          color: inherit !important;
          font-weight: inherit !important;
          transition: all 0.2s !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          border: none !important;
        }

        .custom-vocab-marker {
          text-decoration-line: underline !important;
          text-decoration-color: #eab308 !important;
          text-decoration-thickness: 2px !important;
          text-underline-offset: 4px !important;
        }

        .custom-vocab-marker:hover,
        .custom-vocab-marker:hover * {
          color: #eab308 !important;
        }
      `}</style>
    </div>
  );
}
