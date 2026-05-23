import { getRequestConfig } from "next-intl/server";
import en from "./messages/en.json";

export const locales = ["en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export default getRequestConfig(async () => {
  return {
    locale: "en",
    messages: en,
  };
});
