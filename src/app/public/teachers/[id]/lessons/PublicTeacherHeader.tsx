"use client";

import Link from "next/link";
import BackButton from "@/components/ui/BackButton";
import { useScrollDirection } from "@/hooks/useScrollDirection";

export function PublicTeacherHeader() {
  const { isHidden } = useScrollDirection();

  return (
    <nav className={`sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 transition-transform duration-500 ease-in-out ${isHidden ? '-translate-y-[120%]' : 'translate-y-0'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-black">C</div>
          <span className="font-black text-xl tracking-tighter text-slate-900 uppercase">CUPCAKES</span>
        </Link>
        <BackButton />
      </div>
    </nav>
  );
}
