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
  meaningZh?: string;
  meaningHi?: string;
  meaningJa?: string;
  meaningEs?: string;
  meaningAr?: string;
  meaningFr?: string;
  meaningKo?: string;
  meaningPt?: string;
  meaningRu?: string;
  meaningDe?: string;
  explanationEn: string;
  examples: string[];
  image: string;
}

const getDefinitionText = (vocab: VocabularyInfo, lang: string) => {
  if (lang === "en" || lang === "other") return "";
  if (lang === "vi") return vocab.meaningVi;
  if (lang === "th") return vocab.meaningTh;
  if (lang === "id") return vocab.meaningId;
  
  const mapping: Record<string, string | undefined> = {
    zh: vocab.meaningZh,
    hi: vocab.meaningHi,
    ja: vocab.meaningJa,
    es: vocab.meaningEs,
    ar: vocab.meaningAr,
    fr: vocab.meaningFr,
    ko: vocab.meaningKo,
    pt: vocab.meaningPt,
    ru: vocab.meaningRu,
    de: vocab.meaningDe
  };
  return mapping[lang] || "";
};

const getFlagUrl = (lang: string) => {
  if (lang === "en") return "/flags/flag-en.png";
  if (lang === "vi") return "/flags/flag-vi.png";
  if (lang === "th") return "/flags/flag-th.png";
  if (lang === "id") return "/flags/flag-id.png";
  
  const cdnCodes: Record<string, string> = {
    zh: "cn",
    hi: "in",
    ja: "jp",
    es: "es",
    ar: "sa",
    fr: "fr",
    ko: "kr",
    pt: "pt",
    ru: "ru",
    de: "de",
    other: "other"
  };
  
  const code = cdnCodes[lang];
  if (code === "other") return "/globe.svg";
  if (code) return `https://flagcdn.com/w40/${code}.png`;
  return "/globe.svg";
};

const getLangTitle = (lang: string) => {
  const titles: Record<string, string> = {
    en: "English",
    vi: "Vietnamese",
    th: "Thai",
    id: "Indonesian",
    zh: "Mandarin Chinese",
    hi: "Hindi",
    ja: "Japanese",
    es: "Spanish",
    ar: "Arabic",
    fr: "French",
    ko: "Korean",
    pt: "Portuguese",
    ru: "Russian",
    de: "German",
    other: "Other"
  };
  return titles[lang] || lang.toUpperCase();
};

export function InteractiveReadingContent({ html, isLoggedIn = false, playbackRate = 1.0 }: { html: string; isLoggedIn?: boolean; playbackRate?: number }) {
  const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '—';
  const [mounted, setMounted] = useState(false);
  const currentLang = useContentStore(s => s.nativeLanguage);
  const [displayLang, setDisplayLang] = useState<string>(currentLang);

  useEffect(() => {
    setDisplayLang(currentLang);
  }, [currentLang]);
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
    if (playingAudioRef.current) {
      playingAudioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

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
        audio.defaultPlaybackRate = playbackRate;
        audio.playbackRate = playbackRate;
        
        audio.addEventListener('play', () => {
          audio.playbackRate = playbackRate;
        });
        audio.addEventListener('playing', () => {
          audio.playbackRate = playbackRate;
        });
        
        playingAudioRef.current = audio;
        setPlayingAudioUrl(url);
        audio.play().then(() => {
          audio.playbackRate = playbackRate;
        }).catch(e => console.error("Audio playback failed", e));
        
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
        meaningZh: marker.getAttribute('data-meaning-zh') || '',
        meaningHi: marker.getAttribute('data-meaning-hi') || '',
        meaningJa: marker.getAttribute('data-meaning-ja') || '',
        meaningEs: marker.getAttribute('data-meaning-es') || '',
        meaningAr: marker.getAttribute('data-meaning-ar') || '',
        meaningFr: marker.getAttribute('data-meaning-fr') || '',
        meaningKo: marker.getAttribute('data-meaning-ko') || '',
        meaningPt: marker.getAttribute('data-meaning-pt') || '',
        meaningRu: marker.getAttribute('data-meaning-ru') || '',
        meaningDe: marker.getAttribute('data-meaning-de') || '',
        explanationEn: marker.getAttribute('data-explanation-en') || '',
        examples: (marker.getAttribute('data-examples') || '').split(';').map(s => s.trim()),
        image: marker.getAttribute('data-image') || '',
      };
      
      setDisplayLang(currentLang);
      
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



  const handlePlayAudio = async () => {
    if (!activeVocab || !activeVocab.word) return;

    try {
      const res = await fetch("/api/tts/edge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: activeVocab.word.trim(), voice: "en-US-AnaNeural", forceEdge: true })
      });

      if (res.ok) {
        const blob = await res.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        audio.onended = () => URL.revokeObjectURL(audioUrl);
        audio.onerror = () => URL.revokeObjectURL(audioUrl);
        await audio.play();
        return;
      }
    } catch (err) {
      console.warn("Edge TTS fallback to SpeechSynthesis:", err);
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(activeVocab.word);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
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
                      onClick={() => setDisplayLang('en')}
                      title="English"
                      className={`w-5 h-5 rounded-full overflow-hidden transition-all duration-200 hover:scale-110 ${
                        displayLang === 'en'
                          ? 'ring-2 ring-offset-1 ring-primary shadow-sm scale-110'
                          : 'opacity-40 hover:opacity-80'
                      }`}
                    >
                      <img src="/flags/flag-en.png" alt="English" className="w-full h-full object-cover" />
                    </button>
                    
                    {currentLang !== 'en' && currentLang !== 'other' && (
                      <button
                        onClick={() => setDisplayLang(currentLang)}
                        title={getLangTitle(currentLang)}
                        className={`w-5 h-5 rounded-full overflow-hidden transition-all duration-200 hover:scale-110 ${
                          displayLang === currentLang
                            ? 'ring-2 ring-offset-1 ring-primary shadow-sm scale-110'
                            : 'opacity-40 hover:opacity-80'
                        }`}
                      >
                        <img src={getFlagUrl(currentLang)} alt={getLangTitle(currentLang)} className="w-full h-full object-cover" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-slate-800 dark:text-white font-black text-lg tracking-tight leading-tight">
                  {displayLang === 'en' || displayLang === 'other'
                    ? capitalize(activeVocab.explanationEn)
                    : capitalize(getDefinitionText(activeVocab, displayLang))}
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
        .replace(/class="inline-audio-marker[^"]+"/g, 'class="inline-audio-marker" title="Nghe câu"');
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
        /* ===== Reading content line height & responsive protection ===== */
        .interactive-reading-content {
          line-height: 2.2 !important;
          max-width: 100% !important;
        }
        .interactive-reading-content p {
          line-height: 2.2 !important;
          margin-bottom: 1.2em !important;
        }

        @media (max-width: 767px) {
          .interactive-reading-content {
            width: 100% !important;
            max-width: 100% !important;
            overflow-x: hidden !important;
            box-sizing: border-box !important;
          }
          .interactive-reading-content div,
          .interactive-reading-content section,
          .interactive-reading-content article,
          .interactive-reading-content main,
          .interactive-reading-content figure {
            max-width: 100% !important;
            width: 100% !important;
            min-width: 0 !important;
            float: none !important;
            box-sizing: border-box !important;
          }
          .interactive-reading-content [style*="display: flex"],
          .interactive-reading-content [style*="display:flex"],
          .interactive-reading-content [style*="display: flex;"],
          .interactive-reading-content [style*="flex"] {
            flex-direction: column !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
          }
          .interactive-reading-content img,
          .interactive-reading-content svg,
          .interactive-reading-content iframe {
            max-width: 100% !important;
            height: auto !important;
            box-sizing: border-box !important;
          }
        }

        /* ===== Vocab marker — matches reference HTML .vocab ===== */
        .custom-vocab-marker {
          background: rgba(196, 239, 224, 0.45) !important;
          color: #0B7A58 !important;
          font-weight: 800 !important;
          padding: 0px 5px !important;
          display: inline-block !important;
          line-height: 1.2 !important;
          white-space: nowrap !important;
          vertical-align: middle !important;
          border-radius: 4px !important;
          border-bottom: 2px solid #0B7A58 !important;
          border-top: none !important;
          border-left: none !important;
          border-right: none !important;
          cursor: help !important;
          text-decoration: none !important;
          box-shadow: none !important;
          position: relative !important;
          transition: all 0.2s !important;
        }
        .custom-vocab-marker * {
          color: #0B7A58 !important;
          font-weight: 800 !important;
        }
        .custom-vocab-marker:hover {
          background: rgba(196, 239, 224, 0.75) !important;
        }

        /* ===== Inline audio dot — matches reference HTML .audio-dot ===== */
        .inline-audio-marker {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: 22px !important;
          height: 22px !important;
          border-radius: 999px !important;
          background: rgba(18, 163, 117, 0.12) !important;
          color: #12A375 !important;
          margin: 0 2px !important;
          cursor: pointer !important;
          vertical-align: middle !important;
          transition: all .2s !important;
          box-shadow: none !important;
          outline: none !important;
          border: none !important;
          flex-shrink: 0 !important;
        }
        .inline-audio-marker:hover {
          background: rgba(18, 163, 117, 0.25) !important;
          transform: scale(1.1) !important;
        }
        .inline-audio-marker svg,
        .inline-audio-marker span.material-symbols-outlined {
          width: 14px !important;
          height: 14px !important;
          font-size: 14px !important;
          line-height: 1 !important;
        }

        /* ===== Reading word highlight ===== */
        .reading-word,
        .reading-sentence {
          transition: background-color 0.15s ease, color 0.15s ease;
          border-radius: 0.25rem;
          padding: 0 0.125rem;
          margin: 0 -0.125rem;
        }

        .reading-word.highlighted,
        .reading-sentence.highlighted {
          background-color: #fef08a !important;
          color: #1e293b !important;
        }

        :global(.dark) .reading-word.highlighted,
        :global(.dark) .reading-sentence.highlighted {
          background-color: rgba(234, 179, 8, 0.4) !important;
          color: #ffffff !important;
        }
      `}</style>
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} defaultView="studentLogin" />
    </div>
  );
}
