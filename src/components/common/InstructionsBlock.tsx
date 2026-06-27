"use client";

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
    <div className="flex items-center gap-0.5 bg-slate-100 rounded-full p-0.5 text-xs font-bold select-none shrink-0">
      <button
        onClick={() => onToggle(true)}
        className={`px-2.5 py-1 rounded-full transition-all duration-200 ${
          showNative
            ? "bg-secondary text-white shadow-sm"
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

interface InstructionsBlockProps {
  /** The HTML instructions string (English) */
  instructions: string;
  /** The plain-text translations: { vi: "...", th: "...", id: "..." } */
  instructionsTranslations?: Record<string, string> | null;
  isLoggedIn: boolean;
  /** CSS class for the prose wrapper */
  proseClassName?: string;
}

export function InstructionsBlock({
  instructions,
  instructionsTranslations,
  isLoggedIn,
  proseClassName = "prose prose-slate dark:prose-invert max-w-none prose-p:leading-relaxed prose-p:text-base bg-secondary/5 p-6 rounded-2xl border border-secondary/10",
}: InstructionsBlockProps) {
  const nativeLanguage = useContentStore((s) => s.nativeLanguage);
  const showNativeLang = useContentStore((s) => s.showNativeLang);
  const setShowNativeLang = useContentStore((s) => s.setShowNativeLang);

  const isNativeEnglish = nativeLanguage === "en";
  const translatedText = instructionsTranslations?.[nativeLanguage] ?? null;
  const hasTranslation = !isNativeEnglish && SUPPORTED_LOCALES.includes(nativeLanguage);
  const nativeLabel = LANG_LABELS[nativeLanguage] ?? nativeLanguage.toUpperCase();

  const showTranslated = hasTranslation && showNativeLang;

  return (
    <div className="space-y-3">
      {/* Language toggle row — only when native ≠ English */}
      {hasTranslation && (
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-xs text-secondary font-semibold">
            <Globe className="w-3.5 h-3.5" />
            {showTranslated && translatedText ? nativeLabel : "English"}
          </span>
          <LangTogglePill
            showNative={showNativeLang}
            onToggle={setShowNativeLang}
            nativeLabel={nativeLabel}
          />
        </div>
      )}

      {/* Content */}
      {showTranslated && translatedText ? (
        // Native translation (HTML rendered with InteractiveReadingContent)
        <div className={proseClassName}>
          <InteractiveReadingContent html={translatedText} isLoggedIn={isLoggedIn} />
        </div>
      ) : (
        // English HTML (original, with InteractiveReadingContent)
        <div className={proseClassName}>
          <InteractiveReadingContent html={instructions} isLoggedIn={isLoggedIn} />
        </div>
      )}
    </div>
  );
}
