"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";

export function LanguageToggle() {
  const [isOpen, setIsOpen] = useState(false);
  const locale = useLocale();

  const handleSelect = (newLocale: string) => {
    if (newLocale === locale) {
      setIsOpen(false);
      return;
    }

    setIsOpen(false);
    
    // Save to localStorage for guest users
    localStorage.setItem("preferred-locale", newLocale);
    
    // Update cookie for next-intl detection
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`;
    
    // Save to DB if user is logged in
    fetch("/api/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: newLocale }),
    }).finally(() => {
      // Full reload to ensure server-side and client-side are in sync
      window.location.reload();
    });
  };

  // Close on outside click
  useEffect(() => {
    const handleClick = () => setIsOpen(false);
    if (isOpen) {
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [isOpen]);

  const isEn = locale === "en";

  return (
    <div className="relative">
      <button 
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-2 px-4 bg-surface-container-low border border-primary/10 rounded-full text-on-surface-variant/60 hover:text-primary transition-all flex items-center gap-2 group font-display"
      >
        <span className="material-symbols-outlined text-sm">language</span>
        <span className="text-[10px] font-bold uppercase tracking-widest">{isEn ? "EN" : "VI"}</span>
        <span className={`material-symbols-outlined text-xs transition-transform ${isOpen ? "rotate-180" : ""}`}>expand_more</span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-3 w-44 bg-white border border-primary/10 rounded-[24px] shadow-2xl py-2 z-[70] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <button 
            onClick={() => handleSelect("vi")}
            className={`w-full text-left px-5 py-3 text-xs font-bold transition-colors flex items-center justify-between ${
              !isEn 
                ? "bg-primary/5 text-primary" 
                : "text-on-surface-variant/70 hover:bg-surface-container-low hover:text-primary"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">🇻🇳</span>
              <span className="tracking-tight">Tiếng Việt</span>
            </div>
            {!isEn && <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>}
          </button>
          <button 
            onClick={() => handleSelect("en")}
            className={`w-full text-left px-5 py-3 text-xs font-bold transition-colors flex items-center justify-between ${
              isEn 
                ? "bg-primary/5 text-primary" 
                : "text-on-surface-variant/70 hover:bg-surface-container-low hover:text-primary"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">🇬🇧</span>
              <span className="tracking-tight">English</span>
            </div>
            {isEn && <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>}
          </button>
        </div>
      )}
    </div>
  );
}
