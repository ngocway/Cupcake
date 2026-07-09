/**
 * translate-slide.ts
 * Server-side helper: translates slide text into all supported languages
 * using Google Translate v2 batch API.
 *
 * Called after audio generation for a slide (single or batch).
 */

/** All native languages the platform supports */
export const SUPPORTED_LANGS = [
  "vi", // Vietnamese
  "id", // Indonesian
  "zh", // Mandarin Chinese
  "hi", // Hindi
  "ja", // Japanese
  "es", // Spanish
  "ar", // Arabic
  "fr", // French
  "ko", // Korean
  "pt", // Portuguese
  "ru", // Russian
  "de", // German
] as const;

export type SupportedLang = (typeof SUPPORTED_LANGS)[number];

/** Shape stored in DB: { vi: ["line1","line2"], zh: [...], ... } */
export type SlideTranslations = Record<string, string[]>;

/**
 * Translate all lines of a slide into all supported languages.
 * Uses Google Translate v2 batch API (one request per language).
 *
 * @param text - Raw slide text (may contain \n line breaks)
 * @returns Record<lang, translatedLines[]> — empty object if API key missing
 */
export async function translateSlideToAllLangs(text: string): Promise<SlideTranslations> {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) {
    console.warn("[TranslateSlide] GOOGLE_TRANSLATE_API_KEY not set — skipping translation.");
    return {};
  }

  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length === 0) return {};

  const result: SlideTranslations = {};

  // Translate to all languages in parallel (one request per lang, each batches all lines)
  await Promise.allSettled(
    SUPPORTED_LANGS.map(async (lang) => {
      try {
        const params = new URLSearchParams();
        params.set("key", apiKey);
        params.set("source", "en");
        params.set("target", lang);
        params.set("format", "text");
        for (const line of lines) {
          params.append("q", line);
        }

        const res = await fetch(
          `https://translation.googleapis.com/language/translate/v2?${params.toString()}`,
          { method: "GET" }
        );

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error?.message || `HTTP ${res.status}`);
        }

        const data = await res.json();
        const translated: string[] = (data.data?.translations ?? []).map(
          (t: { translatedText: string }) => t.translatedText
        );
        result[lang] = translated;
      } catch (err: any) {
        console.warn(`[TranslateSlide] Failed to translate to ${lang}: ${err.message}`);
        // Skip this language — don't block audio generation
      }
    })
  );

  return result;
}
