"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GlobalLoader } from "@/components/ui/GlobalLoader";
import { NextIntlClientProvider } from "next-intl";
import { useState, useEffect } from "react";
import enMessages from "@/messages/en.json";
import viMessages from "@/messages/vi.json";

export function Providers({
  children,
  locale = "en",
  messages,
  session,
}: {
  children: React.ReactNode;
  locale?: string;
  messages?: any;
  session?: any;
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

  const [activeLocale, setActiveLocale] = useState<"vi" | "en">(
    locale === "vi" ? "vi" : "en"
  );

  useEffect(() => {
    const getCookie = (name: string) => {
      const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
      return match ? match[2] : null;
    };

    const savedPref = localStorage.getItem("preferred-locale");
    const cookieLocale = getCookie("NEXT_LOCALE");

    if (savedPref === "vi" || savedPref === "en") {
      setActiveLocale(savedPref);
      if (cookieLocale !== savedPref) {
        document.cookie = `NEXT_LOCALE=${savedPref};path=/;max-age=31536000;SameSite=Lax`;
      }
    } else if (cookieLocale === "vi" || cookieLocale === "en") {
      setActiveLocale(cookieLocale);
    } else {
      setActiveLocale("en");
      document.cookie = `NEXT_LOCALE=en;path=/;max-age=31536000;SameSite=Lax`;
    }

    const handleLocaleChange = (e: any) => {
      if (e?.detail === "vi" || e?.detail === "en") {
        setActiveLocale(e.detail);
      }
    };

    window.addEventListener("locale-change", handleLocaleChange);
    return () => window.removeEventListener("locale-change", handleLocaleChange);
  }, []);

  const activeMessages =
    activeLocale === "vi" ? viMessages : enMessages || messages;

  return (
    <SessionProvider session={session} refetchOnWindowFocus={false}>
      <QueryClientProvider client={queryClient}>
        <NextIntlClientProvider
          locale={activeLocale}
          messages={activeMessages}
          timeZone="Asia/Ho_Chi_Minh"
        >
          <Toaster position="top-center" richColors />
          <GlobalLoader />
          {children}
        </NextIntlClientProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
