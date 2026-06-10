"use client"

import { SessionProvider } from "next-auth/react"
import { Toaster } from "sonner"
import { AppProgressBar as ProgressBar } from 'next-nprogress-bar';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { useState, useEffect } from "react";

const customStyles = `
#nprogress {
  pointer-events: none;
}
#nprogress .bar {
  background: #3B82F6;
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
  box-shadow: 0 0 10px #3B82F6, 0 0 5px #3B82F6;
  opacity: 1.0;
  transform: rotate(3deg) translate(0px, -4px);
}
#nprogress .spinner {
  display: flex !important;
  position: fixed !important;
  z-index: 999999 !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  background-color: rgba(255, 255, 255, 0.9) !important;
  backdrop-filter: blur(8px) !important;
  padding: 24px !important;
  border-radius: 24px !important;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
}
.dark #nprogress .spinner {
  background-color: rgba(15, 23, 42, 0.9) !important;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2) !important;
}
#nprogress .spinner::before {
  content: "" !important;
  position: fixed !important;
  top: -50vh !important;
  left: -50vw !important;
  width: 200vw !important;
  height: 200vh !important;
  background: rgba(0, 0, 0, 0.1) !important;
  z-index: -1 !important;
  pointer-events: auto !important;
}
#nprogress .spinner-icon {
  width: 48px !important;
  height: 48px !important;
  border: 4px solid #e2e8f0 !important;
  border-top-color: #3b82f6 !important;
  border-radius: 50% !important;
  animation: nprogress-spinner 800ms linear infinite !important;
}
.dark #nprogress .spinner-icon {
  border-color: #334155 !important;
  border-top-color: #3b82f6 !important;
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
          <Toaster position="top-center" richColors />
          <ProgressBar
            height="3px"
            color="#3B82F6"
            options={{ showSpinner: true }}
            shallowRouting
            style={customStyles}
          />
          {children}
        </NextIntlClientProvider>
      </QueryClientProvider>
    </SessionProvider>
  )
}
