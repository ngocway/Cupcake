import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import en from "./messages/en.json";
import vi from "./messages/vi.json";

export const locales = ["vi", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "vi";

export default getRequestConfig(async () => {
  let resolvedLocale: Locale = defaultLocale;

  try {
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;

    if (cookieLocale === "vi" || cookieLocale === "en") {
      resolvedLocale = cookieLocale;
    } else {
      const headerStore = await headers();
      const country =
        headerStore.get("x-vercel-ip-country") ||
        headerStore.get("cf-ipcountry") ||
        headerStore.get("x-country-code");

      if (country) {
        resolvedLocale = country.toUpperCase() === "VN" ? "vi" : "en";
      } else {
        const acceptLang = headerStore.get("accept-language") || "";
        if (acceptLang.toLowerCase().includes("vi")) {
          resolvedLocale = "vi";
        } else if (acceptLang.toLowerCase().includes("en")) {
          resolvedLocale = "en";
        }
      }
    }
  } catch {
    resolvedLocale = defaultLocale;
  }

  return {
    locale: resolvedLocale,
    messages: resolvedLocale === "vi" ? vi : en,
  };
});
