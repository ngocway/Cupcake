"use client"

import { useState } from "react"
import { Languages, ChevronDown } from "lucide-react"

export function LanguageToggle() {
  const [isOpen, setIsOpen] = useState(false)
  const [lang, setLang] = useState("VI")

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 bg-slate-50 border border-slate-200 rounded-full text-slate-500 hover:text-primary transition-all flex items-center gap-2 group"
      >
        <Languages className="w-4 h-4" />
        <span className="text-[10px] font-bold uppercase tracking-widest">{lang}/EN</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-[60]" 
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute top-full right-0 mt-2 w-40 bg-white border border-slate-100 rounded-2xl shadow-2xl py-2 z-[70] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => { setLang("VI"); setIsOpen(false); }}
              className="w-full text-left px-6 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 hover:text-primary transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span>🇻🇳</span>
                <span>Tiếng Việt</span>
              </div>
              {lang === "VI" && <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>}
            </button>
            <button 
              onClick={() => { setLang("EN"); setIsOpen(false); }}
              className="w-full text-left px-6 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 hover:text-primary transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span>🇬🇧</span>
                <span>English</span>
              </div>
              {lang === "EN" && <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
