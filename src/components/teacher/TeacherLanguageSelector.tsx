"use client";

import { useState, useEffect, useRef } from "react";

interface TeacherLanguageSelectorProps {
  initialLocale?: string | null;
  onLocaleChange?: (locale: string) => void;
}

export function TeacherLanguageSelector({ initialLocale, onLocaleChange }: TeacherLanguageSelectorProps) {
  const [currentLocale, setCurrentLocale] = useState<string>(initialLocale || "vi");
  const [isSaving, setIsSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = async (locale: "vi" | "en") => {
    if (locale === currentLocale || isSaving) {
      setIsOpen(false);
      return;
    }

    setCurrentLocale(locale);
    setIsSaving(true);
    setIsOpen(false);

    try {
      // Set cookie immediately for client
      document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=31536000`;
      localStorage.setItem("preferred-locale", locale);
      window.dispatchEvent(new CustomEvent("locale-change", { detail: locale }));

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
    <div className="px-4 py-2" ref={dropdownRef}>
      <div className="flex items-center justify-between mb-1.5 px-1">
        <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-wider">
          Ngôn ngữ / Language
        </span>
        {isSaving && (
          <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3 py-2 bg-surface-container-low hover:bg-surface-container border border-primary/10 rounded-xl text-xs font-bold transition-all text-on-surface group"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm leading-none">{currentLocale === "vi" ? "🇻🇳" : "🇬🇧"}</span>
            <span className="font-extrabold text-[12px]">
              {currentLocale === "vi" ? "Tiếng Việt" : "English"}
            </span>
          </div>
          <span
            className={`material-symbols-outlined text-[18px] text-on-surface-variant/70 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          >
            expand_more
          </span>
        </button>

        {isOpen && (
          <div className="mt-1 p-1 bg-white border border-primary/10 rounded-xl shadow-lg space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
            {/* Option 1: Tiếng Việt */}
            <button
              type="button"
              onClick={() => handleSelect("vi")}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentLocale === "vi"
                  ? "bg-primary/10 text-primary font-black"
                  : "text-on-surface-variant/80 hover:bg-surface-container-low hover:text-primary"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm leading-none">🇻🇳</span>
                <span>Tiếng Việt</span>
              </div>
              {currentLocale === "vi" && (
                <span className="material-symbols-outlined text-[15px] font-black">check</span>
              )}
            </button>

            {/* Option 2: English */}
            <button
              type="button"
              onClick={() => handleSelect("en")}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentLocale === "en"
                  ? "bg-primary/10 text-primary font-black"
                  : "text-on-surface-variant/80 hover:bg-surface-container-low hover:text-primary"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm leading-none">🇬🇧</span>
                <span>English</span>
              </div>
              {currentLocale === "en" && (
                <span className="material-symbols-outlined text-[15px] font-black">check</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
