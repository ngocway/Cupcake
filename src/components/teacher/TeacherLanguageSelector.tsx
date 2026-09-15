"use client";

import { useState, useEffect } from "react";

interface TeacherLanguageSelectorProps {
  initialLocale?: string | null;
  onLocaleChange?: (locale: string) => void;
}

export function TeacherLanguageSelector({ initialLocale, onLocaleChange }: TeacherLanguageSelectorProps) {
  const [currentLocale, setCurrentLocale] = useState<string>(initialLocale || "vi");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!initialLocale) {
      fetch("/api/locale")
        .then((res) => res.json())
        .then((data) => {
          if (data?.locale) {
            setCurrentLocale(data.locale);
          }
        })
        .catch(() => {});
    }
  }, [initialLocale]);

  const handleSelect = async (locale: "vi" | "en") => {
    if (locale === currentLocale || isSaving) return;

    setCurrentLocale(locale);
    setIsSaving(true);

    try {
      // Set cookie immediately for client
      document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=31536000`;
      localStorage.setItem("preferred-locale", locale);

      await fetch("/api/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });

      if (onLocaleChange) {
        onLocaleChange(locale);
      }
    } catch (err) {
      console.error("Failed to save locale to DB:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="px-5 py-2.5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-wider">
          Ngôn ngữ / Language
        </span>
        {isSaving && (
          <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      <div className="space-y-1">
        {/* Option 1: Tiếng Việt */}
        <button
          type="button"
          onClick={() => handleSelect("vi")}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
            currentLocale === "vi"
              ? "bg-primary/10 text-primary font-black"
              : "text-on-surface-variant/70 hover:bg-surface-container-low hover:text-primary"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-base leading-none">🇻🇳</span>
            <span>Tiếng Việt</span>
          </div>
          <div
            className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
              currentLocale === "vi"
                ? "border-primary bg-primary text-white"
                : "border-on-surface-variant/30 bg-white"
            }`}
          >
            {currentLocale === "vi" && (
              <span className="material-symbols-outlined text-[13px] font-black">check</span>
            )}
          </div>
        </button>

        {/* Option 2: English */}
        <button
          type="button"
          onClick={() => handleSelect("en")}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
            currentLocale === "en"
              ? "bg-primary/10 text-primary font-black"
              : "text-on-surface-variant/70 hover:bg-surface-container-low hover:text-primary"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-base leading-none">🇬🇧</span>
            <span>English</span>
          </div>
          <div
            className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
              currentLocale === "en"
                ? "border-primary bg-primary text-white"
                : "border-on-surface-variant/30 bg-white"
            }`}
          >
            {currentLocale === "en" && (
              <span className="material-symbols-outlined text-[13px] font-black">check</span>
            )}
          </div>
        </button>
      </div>
    </div>
  );
}
