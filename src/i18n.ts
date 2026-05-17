import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import en from "./messages/en.json";
import vi from "./messages/vi.json";

export const locales = ["en", "vi"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

const messages = {
  en,
  vi,
};

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  
  // If not in URL, try to get from cookie
  if (!locale) {
    const cookieStore = await cookies();
    locale = cookieStore.get("NEXT_LOCALE")?.value;
  }

  // Fallback to default
  const finalLocale = (locale && locales.includes(locale as any)) ? locale : defaultLocale;
  
  return {
    locale: finalLocale,
    messages: messages[finalLocale as Locale] || messages[defaultLocale],
  };
});
