"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Volume2, Sparkles, BookOpen, Layers, X, ChevronRight, ChevronLeft, RotateCw } from "lucide-react";
import Image from "next/image";
import { useContentStore } from "@/store/useContentStore";

export interface VocabItem {
  word: string;
  pronunciation?: string;
  meaningVi?: string;
  meaningTh?: string;
  meaningId?: string;
  meaningZh?: string;
  meaningJa?: string;
  meaningKo?: string;
  meaningEs?: string;
  meaningFr?: string;
  meaningDe?: string;
  explanationEn?: string;
  example?: string;
  image?: string;
}

interface KeyVocabularyWidgetProps {
  vocabulary: VocabItem[];
}

export function KeyVocabularyWidget({ vocabulary }: KeyVocabularyWidgetProps) {
  const nativeLang = useContentStore((s) => s.nativeLanguage);
  const [mounted, setMounted] = useState(false);
  const [activeAudioWord, setActiveAudioWord] = useState<string | null>(null);
  const [hoveredWord, setHoveredWord] = useState<VocabItem | null>(null);
  const [isFlashcardOpen, setIsFlashcardOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!vocabulary || vocabulary.length === 0) {
    return null;
  }

  const capitalizeStr = (str: string) => (str ? str.charAt(0).toUpperCase() + str.slice(1) : "");

  const getMeaning = (item: VocabItem) => {
    let text = "";
    // Avoid React SSR hydration mismatch by using default "vi" until component is mounted
    const lang = mounted ? nativeLang : "vi";

    if (lang === "th") text = item.meaningTh || item.meaningVi || "";
    else if (lang === "id") text = item.meaningId || item.meaningVi || "";
    else if (lang === "zh") text = item.meaningZh || item.meaningVi || "";
    else if (lang === "ja") text = item.meaningJa || item.meaningVi || "";
    else if (lang === "ko") text = item.meaningKo || item.meaningVi || "";
    else if (lang === "es") text = item.meaningEs || item.meaningVi || "";
    else if (lang === "fr") text = item.meaningFr || item.meaningVi || "";
    else if (lang === "de") text = item.meaningDe || item.meaningVi || "";
    else text = item.meaningVi || "";

    return capitalizeStr(text);
  };

  const playAudio = (word: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-US";
    utterance.rate = 0.85;

    setActiveAudioWord(word);
    utterance.onend = () => setActiveAudioWord(null);
    utterance.onerror = () => setActiveAudioWord(null);

    window.speechSynthesis.speak(utterance);
  };

  const handleWordClick = (word: string) => {
    // 1. Play audio
    playAudio(word);

    // 2. Smooth scroll to word in the reading section if available
    const mainReading = document.querySelector(".interactive-reading-content");
    if (mainReading) {
      const elements = mainReading.querySelectorAll(".custom-vocab-marker, u, .reading-word");
      for (const el of Array.from(elements)) {
        const text = el.textContent?.trim().toLowerCase() || "";
        const dataWord = el.getAttribute("data-word")?.trim().toLowerCase() || "";
        if (text === word.toLowerCase() || dataWord === word.toLowerCase()) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("ring-4", "ring-emerald-400", "ring-offset-2", "rounded-md", "transition-all");
          setTimeout(() => {
            el.classList.remove("ring-4", "ring-emerald-400", "ring-offset-2");
          }, 2000);
          break;
        }
      }
    }
  };

  return (
    <>
      {/* Top Inline Slider Button for Mobile */}
      <button
        type="button"
        onClick={() => setIsDrawerOpen(true)}
        className="lg:hidden w-full inline-flex items-center justify-between px-5 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-md border border-emerald-400/40 transition-all duration-200"
      >
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-4 h-4 text-emerald-200" />
          <span>Key Vocabulary ({vocabulary.length} Words)</span>
        </div>
        <ChevronRight className="w-4 h-4 text-emerald-200" />
      </button>

      {/* Main Desktop Widget */}
      <div className="hidden lg:block bg-white/85 backdrop-blur-xl border-2 border-emerald-100 rounded-[28px] p-5 shadow-xl shadow-primary/5 space-y-4 animate-in fade-in duration-500 relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
              <BookOpen className="w-4 h-4" />
            </div>
            <h3 className="font-headline text-sm font-black text-slate-800 uppercase tracking-wide">
              Key Vocabulary
            </h3>
          </div>
          <span className="bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
            {vocabulary.length} Words
          </span>
        </div>

        {/* Vocabulary List */}
        <div className="space-y-2.5">
          {vocabulary.map((item, index) => {
            const meaning = getMeaning(item);
            return (
              <div
                key={`${item.word}-${index}`}
                onClick={() => handleWordClick(item.word)}
                onMouseEnter={() => setHoveredWord(item)}
                onMouseLeave={() => setHoveredWord(null)}
                className="group relative bg-white/90 border border-slate-100 hover:border-emerald-300 rounded-[10px] p-3 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex items-center justify-between gap-3"
              >
                {/* Word info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-800 group-hover:text-emerald-600 transition-colors capitalize">
                      {item.word}
                    </span>
                    {item.pronunciation && (
                      <span className="text-[11px] font-medium text-slate-400 font-mono">
                        {item.pronunciation}
                      </span>
                    )}
                  </div>
                  {meaning && (
                    <p className="text-xs font-semibold text-slate-500 group-hover:text-slate-700 transition-colors truncate mt-0.5 capitalize">
                      {meaning}
                    </p>
                  )}
                </div>

                {/* Audio button */}
                <button
                  type="button"
                  onClick={(e) => playAudio(item.word, e)}
                  className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center transition-all ${
                    activeAudioWord === item.word
                      ? "bg-emerald-500 text-white scale-110 shadow-md"
                      : "bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white group-hover:scale-105"
                  }`}
                  title="Listen pronunciation"
                >
                  <Volume2 className={`w-4 h-4 ${activeAudioWord === item.word ? "animate-bounce" : ""}`} />
                </button>

                {/* Floating Hover Card Preview for images */}
                {hoveredWord?.word === item.word && item.image && (
                  <div className="absolute left-full top-0 ml-3 z-30 w-44 bg-white rounded-2xl p-2.5 shadow-2xl border-2 border-emerald-200 animate-in fade-in slide-in-from-left-2 duration-200 pointer-events-none hidden md:block">
                    <div className="relative w-full h-28 rounded-xl overflow-hidden mb-2 bg-slate-100">
                      <Image src={item.image} alt={item.word} fill className="object-cover" />
                    </div>
                    <p className="text-xs font-black text-slate-800 text-center capitalize">{item.word}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Practice Flashcards Action Button */}
        <button
          onClick={() => {
            setCurrentCardIndex(0);
            setIsFlipped(false);
            setIsFlashcardOpen(true);
          }}
          className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-600/20 hover:shadow-xl transition-all duration-200 group"
        >
          <Sparkles className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform" />
          <span>Practice Flashcards</span>
        </button>
      </div>

      {/* Slide-Over Drawer Portal */}
      {isDrawerOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[9990] flex animate-in fade-in duration-300">
          {/* Translucent Backdrop */}
          <div
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer Container Sliding in from Left */}
          <div className="relative z-10 w-[340px] max-w-[85vw] bg-white h-full shadow-2xl p-5 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-left duration-300 border-r-2 border-emerald-100">
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-emerald-100 pb-4 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-headline text-sm font-black text-slate-800 uppercase tracking-wide">
                    Key Vocabulary
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {vocabulary.length} Words extracted
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsDrawerOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Vocabulary List */}
            <div className="space-y-2.5 my-4 flex-1 overflow-y-auto pr-1">
              {vocabulary.map((item, index) => {
                const meaning = getMeaning(item);
                return (
                  <div
                    key={`drawer-${item.word}-${index}`}
                    onClick={() => {
                      handleWordClick(item.word);
                      setIsDrawerOpen(false);
                    }}
                    className="group relative bg-slate-50 hover:bg-emerald-50 border border-slate-200/80 hover:border-emerald-300 rounded-xl p-3 transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 active:scale-98"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-slate-800 group-hover:text-emerald-600 transition-colors capitalize">
                          {item.word}
                        </span>
                        {item.pronunciation && (
                          <span className="text-[11px] font-medium text-slate-400 font-mono">
                            {item.pronunciation}
                          </span>
                        )}
                      </div>
                      {meaning && (
                        <p className="text-xs font-semibold text-slate-500 group-hover:text-slate-700 truncate mt-0.5 capitalize">
                          {meaning}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => playAudio(item.word, e)}
                      className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center bg-emerald-100 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-colors"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Drawer Practice Flashcards Button */}
            <div className="pt-3 border-t border-slate-100 shrink-0">
              <button
                onClick={() => {
                  setIsDrawerOpen(false);
                  setCurrentCardIndex(0);
                  setIsFlipped(false);
                  setIsFlashcardOpen(true);
                }}
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-600/20 transition-all group"
              >
                <Sparkles className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform" />
                <span>Practice Flashcards</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Flashcard Practice Modal rendered at body root via Portal */}
      {isFlashcardOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[36px] max-w-md w-full p-6 sm:p-8 shadow-2xl border border-emerald-100 relative space-y-6 animate-in zoom-in-95 duration-300">
            {/* Top Modal Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Flashcard {currentCardIndex + 1} of {vocabulary.length}
                </span>
              </div>
              <button
                onClick={() => setIsFlashcardOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Flashcard Card Container */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="relative w-full h-72 bg-gradient-to-br from-emerald-50 to-teal-50/50 rounded-[28px] border-2 border-emerald-200/80 shadow-inner p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-transform duration-500 hover:scale-[1.01]"
            >
              <div className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-white/80 px-3 py-1 rounded-full border border-emerald-100 shadow-sm">
                <RotateCw className="w-3 h-3" />
                <span>Tap to Flip</span>
              </div>

              {!isFlipped ? (
                /* FRONT SIDE */
                <div className="space-y-4 animate-in fade-in duration-300">
                  {vocabulary[currentCardIndex].image && (
                    <div className="relative w-24 h-24 rounded-2xl overflow-hidden shadow-md mx-auto border-2 border-white">
                      <Image
                        src={vocabulary[currentCardIndex].image!}
                        alt={vocabulary[currentCardIndex].word}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <h4 className="text-3xl font-black text-slate-900 capitalize tracking-tight">
                      {vocabulary[currentCardIndex].word}
                    </h4>
                    {vocabulary[currentCardIndex].pronunciation && (
                      <p className="text-xs font-mono font-medium text-slate-400 mt-1">
                        {vocabulary[currentCardIndex].pronunciation}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => playAudio(vocabulary[currentCardIndex].word, e)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-bold text-xs shadow-md transition-all active:scale-95"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Listen</span>
                  </button>
                </div>
              ) : (
                /* BACK SIDE */
                <div className="space-y-3 animate-in fade-in duration-300 px-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">
                    Meaning
                  </span>
                  <h4 className="text-2xl font-black text-slate-800">
                    {getMeaning(vocabulary[currentCardIndex]) || vocabulary[currentCardIndex].word}
                  </h4>
                  {vocabulary[currentCardIndex].explanationEn && (
                    <p className="text-xs font-medium text-slate-600 leading-relaxed italic">
                      "{vocabulary[currentCardIndex].explanationEn}"
                    </p>
                  )}
                  {vocabulary[currentCardIndex].example && (
                    <div className="p-3 bg-white/80 rounded-xl border border-emerald-100 text-xs font-medium text-slate-700">
                      <span className="font-bold text-emerald-600">Ex: </span>
                      {vocabulary[currentCardIndex].example}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Navigation Bar */}
            <div className="flex items-center justify-between pt-2">
              <button
                disabled={currentCardIndex === 0}
                onClick={() => {
                  setIsFlipped(false);
                  setCurrentCardIndex((prev) => Math.max(0, prev - 1));
                }}
                className="inline-flex items-center gap-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase disabled:opacity-30 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </button>

              <span className="text-xs font-black text-slate-500">
                {currentCardIndex + 1} / {vocabulary.length}
              </span>

              <button
                disabled={currentCardIndex === vocabulary.length - 1}
                onClick={() => {
                  setIsFlipped(false);
                  setCurrentCardIndex((prev) => Math.min(vocabulary.length - 1, prev + 1));
                }}
                className="inline-flex items-center gap-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase disabled:opacity-30 transition-all shadow-md"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
