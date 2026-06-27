"use client";

import { useContentStore } from "@/store/useContentStore";
import { Info, Globe } from "lucide-react";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

// Supported locales that have pre-translated content
const SUPPORTED_LOCALES = ["vi", "th", "id"];

const LANG_LABELS: Record<string, string> = {
  vi: "Tiếng Việt",
  th: "ภาษาไทย",
  id: "Indonesia",
  en: "English",
};

// ─── Compact Language Toggle Pill ───────────────────────────────────────────
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
    <div className="flex items-center gap-0.5 bg-slate-100 rounded-full p-0.5 text-xs font-bold select-none">
      <button
        onClick={() => onToggle(true)}
        className={`px-2.5 py-1 rounded-full transition-all duration-200 ${
          showNative
            ? "bg-amber-500 text-white shadow-sm"
            : "text-slate-500 hover:text-slate-700"
        }`}
      >
        {nativeLabel}
      </button>
      <button
        onClick={() => onToggle(false)}
        className={`px-2.5 py-1 rounded-full transition-all duration-200 ${
          !showNative
            ? "bg-slate-600 text-white shadow-sm"
            : "text-slate-500 hover:text-slate-700"
        }`}
      >
        EN
      </button>
    </div>
  );
}

// ─── Explanation Block (for quiz questions) ──────────────────────────────────
interface ExplanationBlockProps {
  questionId: string;
  explanation: string;
  /** Map of { vi: "...", th: "...", id: "..." } — may be null if not yet translated */
  explanationTranslations?: Record<string, string> | null;
  /** Whether the accordion is already expanded (controlled externally) */
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function ExplanationBlock({
  questionId,
  explanation,
  explanationTranslations,
  isExpanded,
  onToggleExpand,
}: ExplanationBlockProps) {
  const nativeLanguage = useContentStore((s) => s.nativeLanguage);
  const showNativeLang = useContentStore((s) => s.showNativeLang);
  const setShowNativeLang = useContentStore((s) => s.setShowNativeLang);

  // If native = English, never show toggle
  const isNativeEnglish = nativeLanguage === "en";
  // If native language has a translation available
  const translatedText = explanationTranslations?.[nativeLanguage] ?? null;
  const hasTranslation = !isNativeEnglish && SUPPORTED_LOCALES.includes(nativeLanguage);

  // Text to display
  const displayText =
    hasTranslation && showNativeLang && translatedText
      ? translatedText
      : explanation;

  const nativeLabel = LANG_LABELS[nativeLanguage] ?? nativeLanguage.toUpperCase();

  return (
    <div className="space-y-3 mt-2">
      {/* Accordion Toggle Button */}
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center justify-between px-5 py-3 bg-amber-50 border-2 border-amber-200 rounded-2xl text-amber-700 font-bold hover:bg-amber-100 transition-all"
      >
        <span className="flex items-center gap-2 text-sm">
          <Info className="w-4 h-4" />
          View explanation
        </span>
        <ChevronDown
          className={`w-5 h-5 transition-transform duration-300 ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Accordion Content */}
      <div
        className={`overflow-hidden transition-all duration-400 ease-in-out ${
          isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="p-5 bg-amber-50 border-2 border-amber-200 rounded-2xl space-y-3">
          {/* Lang toggle pill — only when native ≠ English */}
          {hasTranslation && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs text-amber-600 font-semibold">
                <Globe className="w-3.5 h-3.5" />
                {showNativeLang && translatedText
                  ? nativeLabel
                  : "English"}
              </span>
              <LangTogglePill
                showNative={showNativeLang}
                onToggle={setShowNativeLang}
                nativeLabel={nativeLabel}
              />
            </div>
          )}

          {/* Explanation text */}
          <p className="text-slate-700 leading-relaxed text-base whitespace-pre-wrap">
            {displayText}
          </p>
        </div>
      </div>
    </div>
  );
}
