import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import en from "./messages/en.json";
import vi from "./messages/vi.json";

export const locales = ["vi", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export default getRequestConfig(async () => {
  let resolvedLocale: Locale = defaultLocale;

  try {
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;

    if (cookieLocale === "vi" || cookieLocale === "en") {
      resolvedLocale = cookieLocale;
    }
  } catch {
    resolvedLocale = defaultLocale;
  }

  return {
    locale: resolvedLocale,
    messages: resolvedLocale === "vi" ? vi : en,
  };
});
