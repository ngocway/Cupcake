"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

interface StudentUserNavProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function StudentUserNav({ user }: StudentUserNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-fixed hover:border-primary transition-all active:scale-95"
      >
        <img 
          alt="Student Profile Avatar" 
          className="w-full h-full object-cover" 
          src={user.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuDG4UeVjdE9vLCqkj7SyCEGler4aGvlCwdYpmqVp0cDgQN-B09pvN9OrtVWynZmUUxvTVP9mAsgSLWx-Ag5kxfQqqRcSdYN61zxDBeCHI71WSlnCIo6Kxz83OBuTEfG3qVktRHHG_LyuaozLOD4wQOQ54OCfGNgnP2_VH7ocpD6u0Ypc3y0Zu52SVqPW0sW4guBb4C06oiwglwM15Fhah6pGngIrtFVsU47mG1qGAnOMnQZFV6fGI_6uFlo89i4ULCFPitxZrmXH4QS"} 
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-800/50 py-2 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 mb-1">
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.name || "Student"}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
          
          <Link 
            href="/student/settings" 
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
            <span className="font-medium">Settings</span>
          </Link>
          
          <a 
            href="#" 
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">help_outline</span>
            <span className="font-medium">Help</span>
          </a>

          <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-2" />

          <button 
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span className="font-bold">Đăng xuất</span>
          </button>
        </div>
      )}
    </div>
  );
}
