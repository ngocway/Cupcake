import { getRequestConfig } from "next-intl/server";
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
  const locale = await requestLocale;
  
  return {
    locale: locale || defaultLocale,
    messages: messages[(locale || defaultLocale) as Locale] || messages[defaultLocale],
  };
});
