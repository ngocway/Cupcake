"use client"
import { useState } from "react"

export function LanguageToggle() {
  const [isOpen, setIsOpen] = useState(false)
  const [lang, setLang] = useState("VI")

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 px-4 bg-surface-container-low border border-primary/10 rounded-full text-on-surface-variant/60 hover:text-primary transition-all flex items-center gap-2 group font-display"
      >
        <span className="material-symbols-outlined text-sm">language</span>
        <span className="text-[10px] font-bold uppercase tracking-widest">{lang}</span>
        <span className={`material-symbols-outlined text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`}>expand_more</span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-[60]" 
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute top-full right-0 mt-3 w-44 bg-white border border-primary/10 rounded-[24px] shadow-2xl py-2 z-[70] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => { setLang("VI"); setIsOpen(false); }}
              className="w-full text-left px-5 py-3 text-xs font-bold text-on-surface-variant/70 hover:bg-surface-container-low hover:text-primary transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">🇻🇳</span>
                <span className="tracking-tight">Tiếng Việt</span>
              </div>
              {lang === "VI" && <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>}
            </button>
            <button 
              onClick={() => { setLang("EN"); setIsOpen(false); }}
              className="w-full text-left px-5 py-3 text-xs font-bold text-on-surface-variant/70 hover:bg-surface-container-low hover:text-primary transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">🇬🇧</span>
                <span className="tracking-tight">English</span>
              </div>
              {lang === "EN" && <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
