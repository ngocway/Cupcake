import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { translateSlideToAllLangs } from "@/lib/translate-slide";

export const maxDuration = 15;

/**
 * POST /api/translate/slide
 * Returns translated lines for a slide in the requested language.
 *
 * Body: { slideId: string, targetLang: string }
 *   OR  { lines: string[], targetLang: string }  (legacy fallback)
 *
 * Strategy:
 *   1. If slideId provided → look up DB translations first
 *   2. If found in DB → return (0 API cost)
 *   3. If not found → call Google Translate, save to DB, return result
 *   4. Legacy: if only lines provided → translate directly (no DB)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slideId, lines, targetLang } = body;

    if (!targetLang || typeof targetLang !== "string") {
      return NextResponse.json({ error: "targetLang is required" }, { status: 400 });
    }

    // Normalize lang code: "vi-VN" → "vi", "zh-CN" → "zh"
    const lang = targetLang.split("-")[0].toLowerCase();

    // If English, return original lines as-is
    if (lang === "en") {
      if (slideId) {
        const slide = await prisma.readAlongSlide.findUnique({
          where: { id: slideId },
          select: { text: true },
        });
        const originalLines = slide?.text?.split("\n").filter((l) => l.trim()) ?? [];
        return NextResponse.json({ translations: originalLines, cached: true });
      }
      return NextResponse.json({ translations: lines ?? [], cached: true });
    }

    // --- Path 1: slideId provided (preferred) ---
    if (slideId) {
      const slide = await prisma.readAlongSlide.findUnique({
        where: { id: slideId },
        select: { text: true, translations: true },
      });

      if (!slide) {
        return NextResponse.json({ error: "Slide not found" }, { status: 404 });
      }

      const stored = slide.translations as Record<string, string[]> | null;

      // Cache hit — return from DB
      if (stored?.[lang] && stored[lang].length > 0) {
        return NextResponse.json({ translations: stored[lang], cached: true });
      }

      // Cache miss — generate + store
      const allTranslations = await translateSlideToAllLangs(slide.text);

      if (Object.keys(allTranslations).length > 0) {
        // Merge with existing translations (if any)
        const merged = { ...(stored ?? {}), ...allTranslations };
        await prisma.readAlongSlide.update({
          where: { id: slideId },
          data: { translations: merged },
        }).catch((e) => console.error("[TranslateSlide] DB save error:", e));
      }

      return NextResponse.json({
        translations: allTranslations[lang] ?? [],
        cached: false,
      });
    }

    // --- Path 2: Legacy — lines[] provided directly ---
    if (!Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json({ error: "slideId or lines is required" }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GOOGLE_TRANSLATE_API_KEY not configured" }, { status: 500 });
    }

    const params = new URLSearchParams();
    params.set("key", apiKey);
    params.set("source", "en");
    params.set("target", lang);
    params.set("format", "text");
    for (const line of lines) params.append("q", line);

    const res = await fetch(
      `https://translation.googleapis.com/language/translate/v2?${params.toString()}`,
      { method: "GET" }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Google Translate error: ${res.status}`);
    }

    const data = await res.json();
    const translations: string[] = (data.data?.translations ?? []).map(
      (t: { translatedText: string }) => t.translatedText
    );

    return NextResponse.json({ translations, cached: false });
  } catch (error: any) {
    console.error("[Translate Slide] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
