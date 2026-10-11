"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const track = async () => {
      try {
        // Ignore assets, static files, and api endpoints
        if (
          pathname.startsWith("/api") ||
          pathname.startsWith("/_next") ||
          pathname.includes(".")
        ) {
          return;
        }

        const query = searchParams?.toString();
        const fullPath = pathname + (query ? `?${query}` : "");

        fetch("/api/analytics/track", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ path: fullPath }),
          keepalive: true,
          // @ts-ignore
          priority: "low",
        }).catch(() => {});
      } catch (e) {
        // safe ignore
      }
    };

    track();
  }, [pathname, searchParams]);

  return null;
}
