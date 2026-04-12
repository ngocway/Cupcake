"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SideNavItemProps {
  href: string;
  icon: string;
  label: string;
}

export function SideNavItem({ href, icon, label }: SideNavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || (pathname.startsWith(href) && href !== "/student/dashboard");

  return (
    <Link 
      href={href} 
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
        isActive 
        ? "text-primary dark:text-blue-400 font-bold border-r-4 border-primary dark:border-blue-400 bg-primary/10 dark:bg-blue-900/20 shadow-sm" 
        : "text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-blue-300 hover:bg-slate-100 dark:hover:bg-slate-800"
      }`}
    >
      <span 
        className="material-symbols-outlined" 
        style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
      >
        {icon}
      </span>
      <span className="font-label text-sm">{label}</span>
    </Link>
  );
}
