"use client";

import { useState, useEffect } from "react";
import { useContentStore } from "@/store/useContentStore";
import { Globe } from "lucide-react";
import { InteractiveReadingContent } from "@/components/common/InteractiveReadingContent";

const SUPPORTED_LOCALES = ["vi", "th", "id"];

const LANG_LABELS: Record<string, string> = {
  vi: "Tiếng Việt",
  th: "ภาษาไทย",
  id: "Indonesia",
  en: "English",
};

function LangTogglePill({
  showNative,
  onToggle,
  nativeLabel,
}: {
  showNative: boolean;
  onToggle: (val: boolean) => void;
  nativeLabel: string;
}) {
  return (
    <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-700/60 rounded-full p-0.5 text-xs font-bold select-none shrink-0" suppressHydrationWarning>
      <button
        type="button"
        suppressHydrationWarning
        onClick={() => onToggle(true)}
        className={`px-2.5 py-1 rounded-full transition-all duration-200 cursor-pointer ${
          showNative
            ? "bg-secondary text-white shadow-sm"
            : "text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white"
        }`}
      >
        {nativeLabel}
      </button>
      <button
        type="button"
        suppressHydrationWarning
        onClick={() => onToggle(false)}
        className={`px-2.5 py-1 rounded-full transition-all duration-200 cursor-pointer ${
          !showNative
            ? "bg-slate-600 text-white shadow-sm"
            : "text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white"
        }`}
      >
        EN
      </button>
    </div>
  );
}

interface InstructionsBlockProps {
  /** The HTML instructions string (English) */
  instructions: string;
  /** The plain-text translations: { vi: "...", th: "...", id: "..." } */
  instructionsTranslations?: Record<string, string> | null;
  instructionsImageUrl?: string | null;
  isLoggedIn: boolean;
  /** CSS class for the prose wrapper */
  proseClassName?: string;
  /** Placement for the language toggle: "top-row" (default separate row) | "inside-corner" (inside top-right of content) | "none" */
  togglePlacement?: "top-row" | "inside-corner" | "none";
}

export function InstructionsBlock({
  instructions,
  instructionsTranslations,
  instructionsImageUrl,
  isLoggedIn,
  proseClassName = "prose prose-slate dark:prose-invert max-w-none prose-p:leading-relaxed prose-p:text-base bg-secondary/5 p-6 rounded-2xl border border-secondary/10",
  togglePlacement = "top-row",
}: InstructionsBlockProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const nativeLanguage = useContentStore((s) => s.nativeLanguage);
  const showNativeLang = useContentStore((s) => s.showNativeLang);
  const setShowNativeLang = useContentStore((s) => s.setShowNativeLang);

  const isNativeEnglish = nativeLanguage === "en";
  const translatedText = instructionsTranslations?.[nativeLanguage] ?? null;
  const hasTranslation = !isNativeEnglish && SUPPORTED_LOCALES.includes(nativeLanguage);
  const nativeLabel = LANG_LABELS[nativeLanguage] ?? nativeLanguage.toUpperCase();

  // Guard against SSR hydration mismatch when localStorage has showNativeLang=true
  const effectiveShowNative = mounted ? showNativeLang : false;
  const showTranslated = hasTranslation && effectiveShowNative;

  return (
    <div className={togglePlacement === "inside-corner" ? "w-full" : "space-y-3"}>
      {/* Language toggle row — only when native ≠ English and placement is 'top-row' */}
      {hasTranslation && togglePlacement === "top-row" && (
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-xs text-secondary font-semibold">
            <Globe className="w-3.5 h-3.5" />
            {showTranslated && translatedText ? nativeLabel : "English"}
          </span>
          <LangTogglePill
            showNative={effectiveShowNative}
            onToggle={setShowNativeLang}
            nativeLabel={nativeLabel}
          />
        </div>
      )}

      {/* Content */}
      <div className="relative w-full">
        {/* Inside-corner language toggle */}
        {hasTranslation && togglePlacement === "inside-corner" && (
          <div className="absolute top-2.5 right-2.5 sm:top-3.5 sm:right-3.5 z-20 shadow-xs rounded-full bg-white/95 dark:bg-slate-800/95 backdrop-blur-xs border border-slate-200/80 dark:border-slate-700/80 p-0.5">
            <LangTogglePill
              showNative={effectiveShowNative}
              onToggle={setShowNativeLang}
              nativeLabel={nativeLabel}
            />
          </div>
        )}

        <div className={proseClassName}>
          {showTranslated && translatedText ? (
            // Native translation (HTML rendered with InteractiveReadingContent)
            <InteractiveReadingContent html={translatedText} isLoggedIn={isLoggedIn} />
          ) : (
            // English HTML (original, with InteractiveReadingContent)
            <InteractiveReadingContent html={instructions} isLoggedIn={isLoggedIn} />
          )}

          {/* Global instructions image, rendered at the bottom of the instruction flow */}
          {instructionsImageUrl && (
            <div className="mt-6 border-t border-slate-200/50 dark:border-slate-800/50 pt-6 flex justify-center">
              <img 
                src={instructionsImageUrl} 
                alt="Assignment Instructions Illustration" 
                className="max-w-full h-auto rounded-2xl border border-slate-200/50 dark:border-gray-800 shadow-md"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
