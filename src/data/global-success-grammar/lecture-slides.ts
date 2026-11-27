export interface UnitLectureSlideItem {
  index: number;
  imageUrl: string;
  title: string;
  label?: string;
  type: string;
  timerSeconds?: number;
  narration?: string;
  notes?: string;
}

export interface UnitLectureDeck {
  grade: number;
  unit: number;
  title: string;
  subtitle: string;
  theme?: string;
  pptxUrl: string;
  pptxFileName: string;
  slides: UnitLectureSlideItem[];
}

export const SLIDE_ASSET_VERSION = "7";

const SLIDES_CDN_BASE =
  (process.env.NEXT_PUBLIC_R2_URL || "https://media.dolcake.com").replace(/\/+$/, "") +
  "/global-success/grammar-slides";

/**
 * Lightweight registry of units that have published slide decks on R2.
 * Maps `${grade}-${unit}` -> slide count so UI buttons stay instant without bundling 170 manifests.
 */
export const LECTURE_SLIDE_COUNTS: Record<string, number> = {
  "1-1": 12, "1-2": 12, "1-3": 12, "1-4": 12, "1-5": 12,
  "1-6": 12, "1-7": 12, "1-8": 12, "1-9": 12, "1-10": 12,
  "1-11": 12, "1-12": 12, "1-13": 12, "1-14": 12, "1-15": 12,
  "1-16": 12,
  "2-1": 13, "2-2": 12, "2-3": 12, "2-4": 12, "2-5": 12,
  "2-6": 12, "2-7": 12, "2-8": 12, "2-9": 12, "2-10": 12,
  "2-11": 12, "2-12": 12, "2-13": 12, "2-14": 12, "2-15": 12,
  "2-16": 12,
  "3-1": 17, "3-2": 15, "3-3": 15, "3-4": 15, "3-5": 14,
  "3-6": 15, "3-7": 15, "3-8": 14, "3-9": 14, "3-10": 14,
  "3-11": 15, "3-12": 15, "3-13": 14, "3-14": 15, "3-15": 15,
  "3-16": 15, "3-17": 14, "3-18": 14, "3-19": 14, "3-20": 15,
  "4-1": 15, "4-2": 15, "4-3": 15, "4-4": 15, "4-5": 15,
  "4-6": 15, "4-7": 15, "4-8": 15, "4-9": 15, "4-10": 15,
  "4-11": 15, "4-12": 15, "4-13": 15, "4-14": 15, "4-15": 15,
  "4-16": 15, "4-17": 15, "4-18": 15, "4-19": 15, "4-20": 15,
  "5-1": 15, "5-2": 15, "5-3": 15, "5-4": 15, "5-5": 15,
  "5-6": 15, "5-7": 15, "5-8": 15, "5-9": 15, "5-10": 15,
  "5-11": 15, "5-12": 15, "5-13": 15, "5-14": 15, "5-15": 15,
  "5-16": 15, "5-17": 15, "5-18": 15, "5-19": 15, "5-20": 15,
  "6-1": 14, "6-2": 14, "6-3": 14, "6-4": 14, "6-5": 14,
  "6-6": 14, "6-7": 14, "6-8": 14, "6-9": 14, "6-10": 14,
  "6-11": 14, "6-12": 14,
  "7-1": 14, "7-2": 14, "7-3": 14, "7-4": 14, "7-5": 14,
  "7-6": 14, "7-7": 14, "7-8": 14, "7-9": 14, "7-10": 14,
  "7-11": 14, "7-12": 14,
  "8-1": 15, "8-2": 14, "8-3": 15, "8-4": 14, "8-5": 14,
  "8-6": 14, "8-7": 14, "8-8": 14, "8-9": 14, "8-10": 14,
  "8-11": 14, "8-12": 14,
  "9-1": 14, "9-2": 14, "9-3": 14, "9-4": 14, "9-5": 14,
  "9-6": 14, "9-7": 14, "9-8": 14, "9-9": 14, "9-10": 14,
  "9-11": 14, "9-12": 15,
  "10-1": 15, "10-2": 14, "10-3": 14, "10-4": 14, "10-5": 14,
  "10-6": 14, "10-7": 14, "10-8": 14, "10-9": 14, "10-10": 14,
  "11-1": 14, "11-2": 15, "11-3": 14, "11-4": 14, "11-5": 14,
  "11-6": 14, "11-7": 14, "11-8": 14, "11-9": 14, "11-10": 14,
  "12-1": 14, "12-2": 14, "12-3": 14, "12-4": 14, "12-5": 14,
  "12-6": 14, "12-7": 14, "12-8": 14, "12-9": 14, "12-10": 14,
};

export function getUnitLectureSlideCount(grade: number, unit: number): number | null {
  return LECTURE_SLIDE_COUNTS[`${grade}-${unit}`] ?? null;
}

export function hasUnitLectureSlides(grade: number, unit: number): boolean {
  return getUnitLectureSlideCount(grade, unit) !== null;
}

export function getUnitLectureManifestUrl(grade: number, unit: number): string {
  return `${SLIDES_CDN_BASE}/g${grade}/u${unit}/manifest.json?v=${SLIDE_ASSET_VERSION}`;
}

export function getUnitLectureSlideThumbUrl(
  grade: number,
  unit: number,
  slideNumber = 1
): string {
  const idx = String(Math.max(1, slideNumber)).padStart(2, "0");
  return `${SLIDES_CDN_BASE}/g${grade}/u${unit}/slide-${idx}.png?v=${SLIDE_ASSET_VERSION}`;
}

const deckCache = new Map<string, UnitLectureDeck>();

/**
 * Dynamically fetches the light manifest.json for a published unit slide deck from Cloudflare R2.
 */
export async function loadUnitLectureDeck(grade: number, unit: number): Promise<UnitLectureDeck | null> {
  const key = `${grade}-${unit}`;
  if (!hasUnitLectureSlides(grade, unit)) return null;
  const cached = deckCache.get(key);
  if (cached) return cached;

  try {
    const res = await fetch(`/api/grammar-slides?grade=${grade}&unit=${unit}&v=${SLIDE_ASSET_VERSION}`);
    if (!res.ok) return null;
    const deck = (await res.json()) as UnitLectureDeck;
    if (deck && Array.isArray(deck.slides) && deck.slides.length > 0) {
      deckCache.set(key, deck);
      return deck;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Synchronous lookup for already-cached decks (returns null before loadUnitLectureDeck completes).
 */
export function getUnitLectureDeck(grade: number, unit: number): UnitLectureDeck | null {
  return deckCache.get(`${grade}-${unit}`) ?? null;
}
