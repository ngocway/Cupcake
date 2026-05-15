"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { Globe, ChevronDown, Check } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useLocale } from "next-intl";

const languages = [
  { code: "en", label: "English", flag: "EN" },
  { code: "vi", label: "Tiếng Việt", flag: "VI" },
];

interface LanguageSelectorProps {
  variant?: "header" | "dropdown" | "minimal";
  className?: string;
}

export function LanguageSelector({ variant = "header", className = "" }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = languages.find(l => l.code === locale) || languages[0];

  const handleSelect = (langCode: string) => {
    setIsOpen(false);
    
    startTransition(() => {
      // Update locale in localStorage for guest
      localStorage.setItem("preferred-locale", langCode);
      
      // Save to DB if logged in
      fetch("/api/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: langCode }),
      }).catch(() => {}); // Silent fail for guest users
      
      // Trigger navigation to update locale
      router.refresh();
    });
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (variant === "minimal") {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isPending}
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all hover:bg-surface-container-high ${isPending ? "opacity-50" : ""} ${className}`}
        >
          <span>{currentLang.flag}</span>
        </button>
        
        {isOpen && (
          <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-outline-variant/30 rounded-xl shadow-xl overflow-hidden z-50 min-w-[120px]">
            {languages.map(lang => (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium hover:bg-surface-container-high transition-colors ${lang.code === locale ? "text-primary" : "text-on-surface"}`}
              >
                <span>{lang.label}</span>
                {lang.code === locale && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-surface-container-high ${isPending ? "opacity-50" : ""} ${className}`}
      >
        <Globe className="w-4 h-4" />
        <span>{currentLang.flag}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-outline-variant/30 rounded-xl shadow-xl overflow-hidden z-50 min-w-[140px]">
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-surface-container-high transition-colors ${lang.code === locale ? "text-primary bg-primary/5" : "text-on-surface"}`}
            >
              <span>{lang.label}</span>
              {lang.code === locale && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
