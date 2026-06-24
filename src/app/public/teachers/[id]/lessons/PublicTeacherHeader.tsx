"use client";

import Link from "next/link";

import { useScrollDirection } from "@/hooks/useScrollDirection";

export function PublicTeacherHeader() {
  const { isHidden } = useScrollDirection();

  return (
    <>
      {/* Spacer to prevent content jump when header is hidden */}
      <div 
        className="h-[96px] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ display: isHidden ? 'none' : 'block' }}
      />

      <header className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-[1440px] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isHidden ? '-translate-y-40 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
        <nav className="bg-white/70 backdrop-blur-xl border border-primary/10 rounded-full shadow-2xl flex justify-between items-center px-3 sm:px-6 md:px-10 py-2.5 sm:py-4">
          <Link href="/" className="flex items-center gap-1.5 sm:gap-3 group">
            <div className="w-9 h-9 sm:w-12 sm:h-12 bg-primary text-on-primary rounded-full flex items-center justify-center font-black group-hover:rotate-12 transition-all duration-700 shadow-xl shadow-primary/20 shrink-0">
              <span className="material-symbols-outlined text-[20px] sm:text-[28px] animate-leaf-sway">eco</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline font-black text-lg sm:text-2xl tracking-tighter text-primary leading-none">Cupcakes</span>
              <span className="text-[8px] font-black text-primary/40 tracking-[0.4em] uppercase hidden sm:block">Student Portal</span>
            </div>
          </Link>

        </nav>
      </header>
    </>
  );
}
