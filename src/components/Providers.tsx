"use client"

import { SessionProvider } from "next-auth/react"
import { Toaster } from "sonner"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GlobalLoader } from "@/components/ui/GlobalLoader";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { useState, useEffect } from "react";

const customStyles = `
#nprogress {
  pointer-events: none;
}
#nprogress .bar {
  background: #10B981;
  position: fixed;
  z-index: 99999;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
}
#nprogress .peg {
  display: block;
  position: absolute;
  right: 0px;
  width: 100px;
  height: 100%;
  box-shadow: 0 0 10px #10B981, 0 0 5px #10B981;
  opacity: 1.0;
  transform: rotate(3deg) translate(0px, -4px);
}
#nprogress .spinner {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 12px !important;
  position: fixed !important;
  z-index: 999999 !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  background-color: rgba(255, 255, 255, 0.7) !important;
  backdrop-filter: blur(12px) !important;
  padding: 24px !important;
  border-radius: 24px !important;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
  border: 1px solid rgba(226, 232, 240, 0.5) !important;
}
.dark #nprogress .spinner {
  background-color: rgba(15, 23, 42, 0.7) !important;
  border-color: rgba(30, 41, 59, 0.5) !important;
}
#nprogress .spinner::before {
  content: "" !important;
  position: fixed !important;
  top: -50vh !important;
  left: -50vw !important;
  width: 200vw !important;
  height: 200vh !important;
  background: transparent !important;
  z-index: -1 !important;
  pointer-events: auto !important;
}
#nprogress .spinner-icon {
  width: 40px !important;
  height: 40px !important;
  border: 4px solid #10B981 !important;
  border-top-color: transparent !important;
  border-radius: 50% !important;
  animation: nprogress-spinner 1s linear infinite !important;
}
@keyframes nprogress-spinner {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

export function Providers({ children, locale = "en", messages }: { 
  children: React.ReactNode;
  locale?: string;
  messages?: any;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            gcTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  // Hydration fix: show children immediately, don't wait for locale
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    // Force English locale
    document.cookie = `NEXT_LOCALE=en;path=/;max-age=31536000`;
  }, []);

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <NextIntlClientProvider 
          locale={locale} 
          messages={messages}
          timeZone="Asia/Ho_Chi_Minh"
        >
          <Toaster position="bottom-right" richColors />
          <GlobalLoader />
          {children}
        </NextIntlClientProvider>
      </QueryClientProvider>
    </SessionProvider>
  )
}
