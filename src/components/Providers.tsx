"use client"

import { SessionProvider } from "next-auth/react"
import { Toaster } from "sonner"
import { AppProgressBar as ProgressBar } from 'next-nprogress-bar';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { useState, useEffect } from "react";

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
          />
          {children}
        </NextIntlClientProvider>
      </QueryClientProvider>
    </SessionProvider>
  )
}
