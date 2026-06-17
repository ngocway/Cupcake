"use client";

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Volume2, PlusCircle, BookOpen, LogIn, X } from 'lucide-react';
import { LoginModal } from '@/components/LoginButton';
import { setNativeLanguagePreference } from '@/actions/user-preferences-actions';
import { SelectionTranslator } from './SelectionTranslator';
import { useContentStore } from '@/store/useContentStore';

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
  const currentLang = useContentStore(s => s.nativeLanguage);
  const setNativeLanguage = useContentStore(s => s.setNativeLanguage);
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
  const [showLoginModal, setShowLoginModal] = useState(false);
  const playingAudioRef = useRef<HTMLAudioElement | null>(null);
  const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    
    // Tự nhận diện ngôn ngữ thiết bị lần đầu tiên nếu chưa có
    if (typeof window !== "undefined") {
      const localPref = localStorage.getItem('cupcakes_native_language')
      if (!localPref) {
        const browserLang = navigator.language.toLowerCase()
        let defaultLang = 'vi'
        if (browserLang.includes('th')) defaultLang = 'th'
        else if (browserLang.includes('id')) defaultLang = 'id'
        setNativeLanguage(defaultLang)
      }
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (playingAudioRef.current) {
        playingAudioRef.current.pause();
        playingAudioRef.current = null;
      }
    };
  }, [setNativeLanguage]);

  useEffect(() => {
    const handleGlobalPause = (e: CustomEvent) => {
      if (e.detail?.source !== 'InteractiveReadingContent') {
        if (playingAudioRef.current) {
          playingAudioRef.current.pause();
          playingAudioRef.current.currentTime = 0;
          setPlayingAudioUrl(null);
        }
      }
    };
    window.addEventListener('pauseAllAudio', handleGlobalPause as EventListener);
    return () => {
      window.removeEventListener('pauseAllAudio', handleGlobalPause as EventListener);
    };
  }, []);

  useEffect(() => {
    const handleTimeUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ currentTime: number }>;
      const { currentTime } = customEvent.detail;
      
      const sentences = document.querySelectorAll('.interactive-reading-content .reading-sentence');
      sentences.forEach(sentence => {
        const start = parseFloat(sentence.getAttribute('data-start') || '0');
        const end = parseFloat(sentence.getAttribute('data-end') || '0');
        
        if (currentTime !== -1 && currentTime >= start && currentTime <= end) {
          sentence.classList.add('highlighted');
        } else {
          sentence.classList.remove('highlighted');
        }
      });

      // Fallback for old word-level highlights
      const words = document.querySelectorAll('.interactive-reading-content .reading-word');
      words.forEach(word => {
        const start = parseFloat(word.getAttribute('data-start') || '0');
        const end = parseFloat(word.getAttribute('data-end') || '0');
        
        if (currentTime !== -1 && currentTime >= start && currentTime <= end) {
          word.classList.add('highlighted');
        } else {
          word.classList.remove('highlighted');
        }
      });
    };

    window.addEventListener('readingAudioTimeUpdate', handleTimeUpdate as EventListener);
    return () => {
      window.removeEventListener('readingAudioTimeUpdate', handleTimeUpdate as EventListener);
    };
  }, []);

  useEffect(() => {
    // Imperatively update the styling of the currently playing marker
    // since they are rendered via dangerouslySetInnerHTML
    const markers = document.querySelectorAll('.inline-audio-marker, .inline-audio-wrapper');
    markers.forEach(marker => {
      const isWrapper = marker.classList.contains('inline-audio-wrapper');
      const isPlaying = marker.getAttribute('data-audio-url') === playingAudioUrl;
      const icon = marker.querySelector('.material-symbols-outlined');

      if (isPlaying) {
        if (isWrapper) {
          marker.classList.add('bg-blue-100', 'dark:bg-blue-900/40', 'scale-[1.02]');
          marker.classList.remove('bg-blue-50', 'dark:bg-blue-900/20');
        } else {
          marker.classList.add('bg-primary', 'text-white', 'shadow-md', 'scale-105');
          marker.classList.remove('bg-primary/10', 'text-primary');
        }
        if (icon) {
          icon.textContent = 'graphic_eq';
          icon.classList.add('animate-pulse');
        }
      } else {
        if (isWrapper) {
          marker.classList.remove('bg-blue-100', 'dark:bg-blue-900/40', 'scale-[1.02]');
          marker.classList.add('bg-blue-50', 'dark:bg-blue-900/20');
        } else {
          marker.classList.remove('bg-primary', 'text-white', 'shadow-md', 'scale-105');
          marker.classList.add('bg-primary/10', 'text-primary');
        }
        if (icon) {
          icon.textContent = 'volume_up';
          icon.classList.remove('animate-pulse');
        }
      }
    });
  }, [playingAudioUrl]);

  const handleLangChange = async (lang: string) => {
    setNativeLanguage(lang);
    await setNativeLanguagePreference(lang);
  };

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    
    // 1. Handle Inline Audio Click
    const audioMarker = target.closest('.inline-audio-marker, .inline-audio-wrapper');
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
        
        window.dispatchEvent(new CustomEvent('pauseAllAudio', { detail: { source: 'InteractiveReadingContent' } }));
        
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
          <button 
            onClick={() => setActiveVocab(null)}
            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
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
                  title="Listen to pronunciation"
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
                      onClick={() => handleLangChange('vi')}
                      title="Vietnamese"
                      className={`w-5 h-5 rounded-full overflow-hidden transition-all duration-200 hover:scale-110 ${
                        currentLang === 'vi'
                          ? 'ring-2 ring-offset-1 ring-primary shadow-sm scale-110'
                          : 'opacity-40 hover:opacity-80'
                      }`}
                    >
                      <img src="/flags/flag-vi.png" alt="Vietnamese" className="w-full h-full object-cover" />
                    </button>
                    <button
                      onClick={() => handleLangChange('th')}
                      title="Thai"
                      className={`w-5 h-5 rounded-full overflow-hidden transition-all duration-200 hover:scale-110 ${
                        currentLang === 'th'
                          ? 'ring-2 ring-offset-1 ring-primary shadow-sm scale-110'
                          : 'opacity-40 hover:opacity-80'
                      }`}
                    >
                      <img src="/flags/flag-th.png" alt="Thai" className="w-full h-full object-cover" />
                    </button>
                    <button
                      onClick={() => handleLangChange('id')}
                      title="Indonesian"
                      className={`w-5 h-5 rounded-full overflow-hidden transition-all duration-200 hover:scale-110 ${
                        currentLang === 'id'
                          ? 'ring-2 ring-offset-1 ring-primary shadow-sm scale-110'
                          : 'opacity-40 hover:opacity-80'
                      }`}
                    >
                      <img src="/flags/flag-id.png" alt="Indonesian" className="w-full h-full object-cover" />
                    </button>
                  </div>
                </div>
                <p className="text-slate-800 dark:text-white font-black text-lg tracking-tight leading-tight">
                  {currentLang === 'vi' ? capitalize(activeVocab.meaningVi)
                   : currentLang === 'th' ? capitalize(activeVocab.meaningTh)
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
                    You need to log in to save vocabulary
                  </p>
                  <button 
                    onClick={() => {
                      setActiveVocab(null);
                      setShowLoginModal(true);
                    }}
                    className="flex items-center justify-center gap-2 w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    Log in now
                  </button>
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
  if (fixedHtml) {
    // 1. Thay thế chữ "Nghe Audio" cũ
    if (fixedHtml.includes('Nghe Audio')) {
      fixedHtml = fixedHtml
        .replace(/<span class="material-symbols-outlined[^>]*>volume_up<\/span>\s*Nghe Audio/g, '<span class="material-symbols-outlined text-[16px]">volume_up</span>')
        .replace(/class="inline-audio-marker[^"]+"/g, 'class="inline-audio-marker text-primary bg-primary/10 rounded-full w-7 h-7 mx-1 cursor-pointer inline-flex items-center justify-center select-none hover:bg-primary/20 transition-colors shadow-sm ring-1 ring-primary/20 align-middle" title="Nghe Audio"');
    }

    // 2. Bảo vệ Layout của hệ thống: Biến đổi thẻ `body` bên trong `<style>` thành class `.interactive-reading-content`
    // Điều này giúp CSS của giáo viên (ví dụ: body { max-width: 1000px }) chỉ áp dụng cho khung hướng dẫn, không bóp nhỏ toàn bộ web.
    fixedHtml = fixedHtml.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (match, cssContent) => {
      let scopedCss = cssContent.replace(/\bbody\s*\{/gi, '.interactive-reading-content {');
      scopedCss = scopedCss.replace(/\bbody\s+/gi, '.interactive-reading-content ');
      return `<style>${scopedCss}</style>`;
    });
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

        .reading-word,
        .reading-sentence {
          transition: background-color 0.15s ease, color 0.15s ease;
          border-radius: 0.25rem;
          padding: 0 0.125rem;
          margin: 0 -0.125rem;
        }

        .reading-word.highlighted,
        .reading-sentence.highlighted {
          background-color: #fef08a !important; /* bg-yellow-200 */
          color: #1e293b !important; /* text-slate-800 */
        }

        :global(.dark) .reading-word.highlighted,
        :global(.dark) .reading-sentence.highlighted {
          background-color: rgba(234, 179, 8, 0.4) !important; /* yellow-500 with opacity */
          color: #ffffff !important;
        }
      `}</style>
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} defaultView="studentLogin" />
    </div>
  );
}
