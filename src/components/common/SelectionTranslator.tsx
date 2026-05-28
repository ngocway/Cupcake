"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Globe, X, Volume2, Loader2, Check } from 'lucide-react';
import { translateSelection } from '@/actions/translate-actions';

const LANGUAGES = [
  { code: 'vi', name: 'Tiếng Việt', flag: '/flags/flag-vi.png' },
  { code: 'th', name: 'ภาษาไทย', flag: '/flags/flag-th.png' },
  { code: 'id', name: 'Bahasa Indonesia', flag: '/flags/flag-id.png' },
  { code: 'en', name: 'English', flag: '/flags/flag-en.png' }, // Fallback/demo
];

export function SelectionTranslator() {
  const [mounted, setMounted] = useState(false);
  const [selection, setSelection] = useState<{ text: string; rect: DOMRect } | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  
  // State for the translation flow
  const [targetLang, setTargetLang] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationResult, setTranslationResult] = useState<string | null>(null);
  const [showLanguageSelect, setShowLanguageSelect] = useState(false);
  
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const savedLang = localStorage.getItem('targetLanguage');
    if (savedLang) {
      setTargetLang(savedLang);
    }
  }, []);

  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      // Don't trigger if clicking inside the popup
      if (popupRef.current && popupRef.current.contains(e.target as Node)) {
        return;
      }

      setTimeout(() => {
        const windowSelection = window.getSelection();
        if (!windowSelection || windowSelection.isCollapsed) {
          if (!popupRef.current?.contains(e.target as Node)) {
             setSelection(null);
             setShowPopup(false);
             setTranslationResult(null);
             setShowLanguageSelect(false);
          }
          return;
        }

        const text = windowSelection.toString().trim();
        
        // Only show for reasonable length selections
        if (text.length > 0 && text.length < 500) {
          // Verify if selection is inside our reading content area
          let isInsideReading = false;
          let node = windowSelection.anchorNode;
          while (node) {
            if (node.nodeType === 1 && (node as Element).classList?.contains('interactive-reading-content')) {
              isInsideReading = true;
              break;
            }
            node = node.parentNode;
          }

          if (isInsideReading) {
             const range = windowSelection.getRangeAt(0);
             const rect = range.getBoundingClientRect();
             setSelection({ text, rect });
             setShowPopup(true);
             setTranslationResult(null);
             setShowLanguageSelect(false);
          }
        }
      }, 10);
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setShowPopup(false);
        setSelection(null);
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);
    
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  const handleTranslateClick = async () => {
    if (!selection) return;
    
    if (!targetLang) {
      setShowLanguageSelect(true);
      return;
    }

    await performTranslation(selection.text, targetLang);
  };

  const performTranslation = async (text: string, lang: string) => {
    setIsTranslating(true);
    setTranslationResult(null);
    setShowLanguageSelect(false);

    const result = await translateSelection(text, lang);
    if (result.success && result.translation) {
      setTranslationResult(result.translation);
    } else {
      setTranslationResult("Translation failed. Please try again.");
    }
    
    setIsTranslating(false);
  };

  const handleSaveLanguage = (langCode: string) => {
    setTargetLang(langCode);
    localStorage.setItem('targetLanguage', langCode);
    if (selection) {
      performTranslation(selection.text, langCode);
    }
  };

  const handlePlayAudio = () => {
    if ('speechSynthesis' in window && selection) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(selection.text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  if (!mounted || !showPopup || !selection) return null;

  // Calculate position
  const POPUP_WIDTH = showLanguageSelect ? 300 : translationResult ? 320 : 120;
  const ESTIMATED_HEIGHT = showLanguageSelect ? 220 : translationResult ? 180 : 50;
  const MARGIN = 10;
  
  const isAbove = selection.rect.top > ESTIMATED_HEIGHT + MARGIN;
  
  let top = isAbove 
    ? selection.rect.top - MARGIN + window.scrollY
    : selection.rect.bottom + MARGIN + window.scrollY;
    
  let left = selection.rect.left + (selection.rect.width / 2) + window.scrollX;
  
  // Adjust horizontal boundaries
  left = Math.max(left, POPUP_WIDTH / 2 + MARGIN);
  left = Math.min(left, window.innerWidth - POPUP_WIDTH / 2 - MARGIN);

  return createPortal(
    <div 
      ref={popupRef}
      className={`absolute z-[9999] pointer-events-auto transform -translate-x-1/2 ${isAbove ? '-translate-y-full' : 'translate-y-0'}`}
      style={{ left: `${left}px`, top: `${top}px` }}
      onMouseDown={(e) => e.stopPropagation()} // Prevent closing when clicking inside
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-1 animate-in fade-in zoom-in-95 duration-200 relative">
        
        {/* State 1: Translate Button */}
        {!isTranslating && !translationResult && !showLanguageSelect && (
          <button 
            onClick={handleTranslateClick}
            className="flex items-center gap-2 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-800 dark:text-white text-sm font-bold"
          >
            <Globe className="w-4 h-4 text-primary" />
            Translate
          </button>
        )}

        {/* State 2: Translating Spinner */}
        {isTranslating && (
          <div className="flex items-center gap-2 px-4 py-3 min-w-[120px] justify-center">
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
            <span className="text-sm font-medium text-slate-500">Translating...</span>
          </div>
        )}

        {/* State 3: Language Selection (First time) */}
        {showLanguageSelect && (
          <div className="p-3 w-[280px]">
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs font-black uppercase tracking-wider text-slate-500">Select target language</p>
              <button onClick={() => setShowLanguageSelect(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleSaveLanguage(lang.code)}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
                >
                  <div className="flex items-center gap-3">
                    <img src={lang.flag} alt={lang.name} className="w-5 h-5 rounded-full object-cover shadow-sm" />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{lang.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* State 4: Translation Result */}
        {translationResult && (
          <div className="p-4 w-[320px] relative">
            <button 
              onClick={() => setShowPopup(false)} 
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full p-1 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            
            <div className="mb-3 pr-6">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-[10px] font-black uppercase tracking-[0.1em] text-primary bg-primary/10 px-2 py-0.5 rounded text-primary">Translation</p>
                <div 
                  className="flex items-center gap-1 text-slate-400 hover:text-primary cursor-pointer transition-colors"
                  onClick={handlePlayAudio}
                  title="Listen to original text"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 italic line-clamp-3">"{selection.text}"</p>
            </div>
            
            <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
               <p className="text-base font-bold text-slate-800 dark:text-white leading-relaxed">
                 {translationResult}
               </p>
            </div>
            
            <div className="mt-3 flex justify-end">
               <button 
                  onClick={() => {
                    setTargetLang(null);
                    setShowLanguageSelect(true);
                    setTranslationResult(null);
                  }}
                  className="text-[10px] text-slate-400 hover:text-primary transition-colors underline underline-offset-2"
               >
                 Change language
               </button>
            </div>
          </div>
        )}
        
        {/* Arrow */}
        {isAbove ? (
          <>
            <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-200 dark:border-t-slate-800" />
            <div className="absolute left-1/2 bottom-[1px] transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-white dark:border-t-slate-900" />
          </>
        ) : (
          <>
            <div className="absolute left-1/2 top-0 transform -translate-x-1/2 -translate-y-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-slate-200 dark:border-b-slate-800" />
            <div className="absolute left-1/2 top-[1px] transform -translate-x-1/2 -translate-y-full w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[5px] border-b-white dark:border-b-slate-900" />
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
