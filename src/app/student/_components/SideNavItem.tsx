"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface SideNavItemProps {
  href: string;
  icon: string;
  label: string;
  comingSoon?: boolean;
}

export function SideNavItem({ href, icon, label, comingSoon }: SideNavItemProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    // Extract base path and params from href
    const [basePath, queryStr] = href.split('?');
    const hrefParams = new URLSearchParams(queryStr);
    
    const isPathMatch = pathname === basePath;
    const isDashboardMatch = pathname === "/student/dashboard" && basePath === "/student/dashboard";
    const isSubPathMatch = pathname.startsWith(basePath) && basePath !== "/student" && basePath !== "/student/dashboard";

    if (queryStr) {
      // If href has query params, they must match exactly
      const sourceMatch = searchParams.get('source') === hrefParams.get('source');
      setIsActive(isPathMatch && sourceMatch);
    } else {
      // If href has no query params, just match the path
      // But if we are on a page that HAS source param, and this link doesn't have it, it's not a match for specific tabs
      const hasSourceParam = searchParams.has('source');
      if (hasSourceParam && (basePath === "/student/lessons" || basePath === "/student/assignments")) {
        setIsActive(false);
      } else {
        setIsActive(isPathMatch || (isSubPathMatch && !hasSourceParam));
      }
    }
  }, [pathname, searchParams, href]);

  return (
    <Link 
      href={comingSoon ? "#" : href} 
      onClick={comingSoon ? (e) => e.preventDefault() : undefined}
      className={`flex items-center gap-3 py-3 transition-all duration-300 ${
        comingSoon ? "opacity-50 cursor-not-allowed px-4" :
        isActive 
        ? "text-primary font-black bg-primary/10 border-l-4 border-primary pl-3 pr-4 rounded-r-xl shadow-sm" 
        : "text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-blue-300 hover:bg-slate-50 dark:hover:bg-slate-800 px-4 rounded-xl"
      }`}
    >
      <span 
        className="material-symbols-outlined" 
        style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
      >
        {icon}
      </span>
      <div className="flex-1 flex items-center justify-between gap-2">
        <span className="font-label text-sm">{label}</span>
        {comingSoon && (
          <span className="text-[7px] font-black uppercase tracking-[0.2em] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-500">Soon</span>
        )}
      </div>
    </Link>
  );
}
