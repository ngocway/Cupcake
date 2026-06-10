"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function GlobalLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);

  // Dismiss loader when the route fully changes
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    // Intercept clicks on links globally
    const handleClick = (e: MouseEvent) => {
      // Find closest anchor tag
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");

      if (!anchor || !anchor.href) return;

      const targetUrl = new URL(anchor.href, window.location.href);
      const currentUrl = new URL(window.location.href);

      // Ignore links that open in a new tab
      if (anchor.target === "_blank") return;

      // Ignore non-http/https protocols (mailto:, tel:, javascript:)
      if (!targetUrl.protocol.startsWith("http")) return;

      // Ignore hash links on the same page
      if (targetUrl.pathname === currentUrl.pathname && targetUrl.search === currentUrl.search && targetUrl.hash !== currentUrl.hash) return;

      // If it's a cross-origin link, we can still show loading, but the browser will navigate anyway
      if (targetUrl.origin !== currentUrl.origin) {
         setIsNavigating(true);
         return;
      }

      // It's a same-origin route transition
      // We check if it's actually changing the path or query
      if (targetUrl.pathname !== currentUrl.pathname || targetUrl.search !== currentUrl.search) {
        // Show the loader immediately!
        setIsNavigating(true);
        
        // Also listen for pushState / replaceState just in case
      }
    };

    // Use capture phase to ensure we catch it before any stopPropagation
    document.addEventListener("click", handleClick, true);

    // Also listen to window history changes just in case (optional)
    const handlePopState = () => setIsNavigating(true);
    window.addEventListener("popstate", handlePopState);

    // Custom event to trigger it programmatically
    const handleCustomTrigger = () => setIsNavigating(true);
    window.addEventListener("show-global-loader", handleCustomTrigger);
    
    const handleCustomDismiss = () => setIsNavigating(false);
    window.addEventListener("hide-global-loader", handleCustomDismiss);

    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("show-global-loader", handleCustomTrigger);
      window.removeEventListener("hide-global-loader", handleCustomDismiss);
    };
  }, []);

  if (!isNavigating) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[999999] pointer-events-auto">
      <div className="absolute inset-0 bg-transparent" />
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-6 rounded-3xl shadow-2xl flex items-center justify-center border border-slate-200/50 dark:border-slate-800/50 pointer-events-auto">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
}
