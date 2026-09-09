"use server";

// Helper: Timeout wrapper for promises
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

async function searchPixabayImages(query: string, isCartoon = false) {
  try {
    const type = isCartoon ? "illustration" : "photo";
    const apiKey = process.env.PIXABAY_API_KEY || "39818817-48f57297e682e0df8d0e74ee8";
    const res = await fetch(
      `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(query)}&image_type=${type}&per_page=30&safesearch=true`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Accept": "application/json, text/plain, */*"
        },
        signal: AbortSignal.timeout(2000)
      }
    );
    if (res.ok) {
      const data = await res.json();
      if (data.hits && data.hits.length > 0) {
        return data.hits.map((img: any, i: number) => ({
          id: `pixabay-img-${img.id || i}`,
          url: img.webformatURL || img.largeImageURL,
          thumb: img.previewURL || img.webformatURL,
          author: img.user || "Pixabay",
          authorLink: img.pageURL || "#"
        }));
      }
    }
  } catch (e) {
    // Silent fail or timeout to continue to next provider
  }
  return [];
}

async function searchUnsplashImages(query: string) {
  try {
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    const url = accessKey
      ? `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=30`
      : `https://unsplash.com/napi/search/photos?query=${encodeURIComponent(query)}&per_page=30`;

    const headers: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    };
    if (accessKey) {
      headers["Authorization"] = `Client-ID ${accessKey}`;
    }

    const res = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(1500)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        return data.results.map((img: any, i: number) => ({
          id: `unsplash-img-${img.id || i}`,
          url: img.urls?.regular || img.urls?.small,
          thumb: img.urls?.thumb || img.urls?.small,
          author: img.user?.name || "Unsplash",
          authorLink: img.user?.links?.html || "#"
        }));
      }
    }
  } catch (e) {
    // Silent fail or timeout
  }
  return [];
}

// Pexels API (High-quality photos & art, 20,000 requests/month free)
async function searchPexelsImages(query: string) {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=30`,
      {
        headers: {
          Authorization: apiKey,
          "User-Agent": "CupcakesEducationalApp/1.0"
        },
        signal: AbortSignal.timeout(2000)
      }
    );

    if (res.ok) {
      const data = await res.json();
      if (data.photos && data.photos.length > 0) {
        return data.photos.map((photo: any) => ({
          id: `pexels-img-${photo.id}`,
          url: photo.src?.large || photo.src?.original,
          thumb: photo.src?.medium || photo.src?.small || photo.src?.tiny,
          author: photo.photographer || "Pexels",
          authorLink: photo.url || photo.photographer_url || "https://www.pexels.com"
        }));
      }
    }
  } catch (e) {
    console.error("Pexels image search error:", e);
  }
  return [];
}

async function searchDDGImages(query: string) {
  try {
    const tokenRes = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(query)}&iar=images&iax=images`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,vi;q=0.8",
        "Sec-Ch-Ua": '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"Windows"',
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1"
      },
      signal: AbortSignal.timeout(4500)
    });

    if (!tokenRes.ok) return [];
    const html = await tokenRes.text();
    const vqdMatch = html.match(/vqd=["']?([^&"'\s]+)/i) || html.match(/vqd=([\d-]+)/i);
    const vqd = vqdMatch ? vqdMatch[1] : null;

    if (!vqd) return [];

    const imgRes = await fetch(`https://duckduckgo.com/i.js?q=${encodeURIComponent(query)}&o=json&vqd=${vqd}&f=,,,`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://duckduckgo.com/",
        "Sec-Ch-Ua": '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "X-Requested-With": "XMLHttpRequest"
      },
      signal: AbortSignal.timeout(4500)
    });

    if (imgRes.ok) {
      const data = await imgRes.json();
      if (data.results && data.results.length > 0) {
        return data.results.slice(0, 50).map((img: any, i: number) => ({
          id: `ddg-img-${i}`,
          url: img.image,
          thumb: img.thumbnail || img.image,
          author: img.title || "Internet Image",
          authorLink: img.url || "#"
        }));
      }
    }
  } catch (e) {
    // Silent fail or timeout to continue to next provider
  }
  return [];
}

async function searchWebImages(query: string, isCartoon = false) {
  try {
    // Search clean query without appending conflicting suffixes to prevent Bing query parsing corruption
    const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC2&first=1`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9"
      },
      signal: AbortSignal.timeout(2000)
    });

    if (!res.ok) return [];
    const html = await res.text();

    const matches = [...html.matchAll(/class="iusc"[^>]*m="([^"]+)"/g)];
    const results: any[] = [];

    for (let i = 0; i < matches.length && results.length < 30; i++) {
      try {
        const rawJson = matches[i][1].replace(/&quot;/g, '"');
        const data = JSON.parse(rawJson);
        if (data.murl) {
          results.push({
            id: `web-img-${i}`,
            url: data.murl,
            thumb: data.turl || data.murl,
            author: data.t || "Web Search Image",
            authorLink: data.purl || "#"
          });
        }
      } catch (e) {
        // Skip malformed item
      }
    }

    return results;
  } catch (e) {
    return [];
  }
}

// 5. Fallback Provider: Wikimedia Commons (Educational media repository)
async function searchWikimediaImages(query: string, isCartoon = false) {
  try {
    const searchTerm = isCartoon ? `${query} clipart` : query;
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchTerm)}&srnamespace=6&srlimit=24&format=json&origin=*`;
    const res = await fetch(searchUrl, {
      headers: {
        "User-Agent": "CupcakesEducationalApp/1.0 (Educational Classroom App)"
      },
      signal: AbortSignal.timeout(2500)
    });

    if (!res.ok) return [];
    const data = await res.json();
    let searchResults = data.query?.search || [];

    // If clipart specific search returned few results, try raw query on Wikimedia
    if (searchResults.length < 3 && isCartoon) {
      const fallbackUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&srlimit=24&format=json&origin=*`;
      const fallbackRes = await fetch(fallbackUrl, {
        headers: { "User-Agent": "CupcakesEducationalApp/1.0" },
        signal: AbortSignal.timeout(2000)
      });
      if (fallbackRes.ok) {
        const fallbackData = await fallbackRes.json();
        const fallbackItems = fallbackData.query?.search || [];
        if (fallbackItems.length > 0) {
          searchResults = fallbackItems;
        }
      }
    }

    if (searchResults.length === 0) return [];

    const titles = searchResults.map((r: any) => r.title).join("|");
    const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(titles)}&prop=imageinfo&iiprop=url|thumbmime&iiurlwidth=500&format=json&origin=*`;
    const infoRes = await fetch(infoUrl, { signal: AbortSignal.timeout(2500) });
    if (!infoRes.ok) return [];
    const infoData = await infoRes.json();
    const pages = Object.values(infoData.query?.pages || {});

    const pageMap = new Map<string, any>();
    pages.forEach((p: any) => {
      if (p.title) pageMap.set(p.title, p);
    });

    return searchResults
      .map((r: any, i: number) => {
        const page = pageMap.get(r.title);
        const info = page?.imageinfo?.[0];
        if (!info?.url) return null;
        const cleanTitle = r.title.replace(/^File:/, "").replace(/\.[^/.]+$/, "");
        return {
          id: `wikimedia-img-${page.pageid || i}`,
          url: info.url,
          thumb: info.thumburl || info.url,
          author: cleanTitle || "Wikimedia Commons",
          authorLink: `https://commons.wikimedia.org/wiki/${encodeURIComponent(r.title)}`
        };
      })
      .filter((img: any) => Boolean(img && img.thumb));
  } catch (e) {
    console.error("Wikimedia image search error:", e);
    return [];
  }
}

// 6. Fallback Provider: Openverse (WordPress Foundation Creative Commons repository)
async function searchOpenverseImages(query: string) {
  try {
    const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&page_size=30`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "CupcakesEducationalApp/1.0"
      },
      signal: AbortSignal.timeout(2500)
    });

    if (!res.ok) return [];
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      return data.results.map((img: any, i: number) => ({
        id: `openverse-img-${img.id || i}`,
        url: img.url,
        thumb: img.thumbnail || img.url,
        author: img.title || img.creator || "Openverse",
        authorLink: img.foreign_landing_url || "#"
      }));
    }
  } catch (e) {
    console.error("Openverse image search error:", e);
  }
  return [];
}

const COMMON_VI_MAP: Record<string, string> = {
  "cá voi xanh": "blue whale",
  "hươu cao cổ": "giraffe",
  "tam giác vuông": "right triangle",
  "tam giác cân": "isosceles triangle",
  "tam giác đều": "equilateral triangle",
  "tam giác nhọn": "acute triangle",
  "tam giác tù": "obtuse triangle",
  "sóc bay": "flying squirrel",
  "cáo túi": "opossum",
  "chim én": "swallow bird",
  "dơi": "bat",
  "hình vuông": "square shape",
  "hình tròn": "circle shape",
  "hình chữ nhật": "rectangle shape",
  "hình thoi": "rhombus shape"
};

function hasVietnameseDiacritics(text: string): boolean {
  return /[àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(text);
}

async function translateOrExtractKeyword(rawQuery: string): Promise<string> {
  const clean = rawQuery.trim().replace(/[?!.,;:()'"]/g, "");
  if (!clean) return "";

  const lower = clean.toLowerCase();
  if (COMMON_VI_MAP[lower]) {
    return COMMON_VI_MAP[lower];
  }

  // 1. Try Gemini AI Translation
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const IS_PROXY = !!process.env.GEMINI_API_ENDPOINT;
      const GEMINI_BASE = (process.env.GEMINI_API_ENDPOINT ?? "https://generativelanguage.googleapis.com").replace(/\/$/, "");
      const url = IS_PROXY
        ? `${GEMINI_BASE}/v1beta/models/gemini-2.0-flash:generateContent`
        : `${GEMINI_BASE}/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
      const headers: Record<string, string> = IS_PROXY
        ? { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` }
        : { "Content-Type": "application/json" };

      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Extract the main visual subject noun or translate this text to a concise 1-3 word English search term for image search (e.g. "Loài động vật có vú duy nhất bay được?" -> "bat", "Hình tam giác có một góc 90 độ" -> "right triangle", "Sóc bay" -> "flying squirrel", "Dơi" -> "bat", "Quả táo" -> "apple", "Hươu cao cổ" -> "giraffe"). Return ONLY the English keyword phrase in plain text, no quotes, no extra words.\nText: "${clean}"`
            }]
          }]
        }),
        signal: AbortSignal.timeout(2500)
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()?.replace(/["']/g, "");
        if (text && text.length > 0 && text.length < 50) {
          return text;
        }
      }
    } catch (e) {
      // Fallback to MyMemory
    }
  }

  // 2. Free MyMemory Translation API (Only if query contains Vietnamese diacritics)
  if (hasVietnameseDiacritics(clean)) {
    try {
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(clean)}&langpair=vi|en`, {
        signal: AbortSignal.timeout(2500)
      });
      if (res.ok) {
        const data = await res.json();
        const translatedText = data.responseData?.translatedText?.trim()?.replace(/["']/g, "");
        if (translatedText && translatedText.length > 0 && translatedText.length < 50) {
          return translatedText;
        }
      }
    } catch (e) {
      // Fallback
    }
  }

  return clean;
}

export async function resolveQuestionKeywordAction(
  questionText: string,
  options?: Array<{ text: string; isCorrect?: boolean }>
): Promise<string> {
  const correctOption = options?.find((opt) => opt.isCorrect && opt.text && opt.text.trim().length > 0);
  
  if (!correctOption) {
    // Leave empty for manual typing as requested by user
    return "";
  }

  const rawAnswer = correctOption.text.trim();
  const words = rawAnswer.split(/\s+/).filter(Boolean);

  if (words.length <= 4) {
    return rawAnswer;
  }

  try {
    const extracted = await translateOrExtractKeyword(rawAnswer);
    if (extracted) return extracted;
  } catch (e) {
    // Ignore error
  }

  return rawAnswer;
}

const ANIMAL_WORDS = new Set([
  "dog", "cat", "bat", "cow", "pig", "rat", "fox", "owl", "hen", "duck",
  "fish", "bear", "lion", "wolf", "frog", "deer", "goat", "seal", "swan",
  "ant", "bee", "bug", "fly", "ram", "elk", "ape", "yak"
]);

function disambiguateQuery(query: string): string {
  const clean = query.trim();
  const lower = clean.toLowerCase();

  if (lower === "bat") {
    return "bat animal flying";
  }

  if (ANIMAL_WORDS.has(lower)) {
    return `${clean} animal pet`;
  }

  return clean;
}

export async function searchImagesAction(query: string, style: "CARTOON" | "REALISTIC" = "CARTOON") {
  if (!query || !query.trim()) return [];

  const cleanQuery = query.trim().replace(/[?!.,;:()'"]/g, "");
  if (!cleanQuery) return [];

  const isCartoon = style === "CARTOON";

  // Translate or extract English keyword for stock photo engines
  let englishKeyword = cleanQuery;
  try {
    const translated = await translateOrExtractKeyword(cleanQuery);
    if (translated && translated.trim().length > 0) {
      englishKeyword = translated.trim();
    }
  } catch (e) {
    // Fallback to cleanQuery
  }

  // Always disambiguate short words (e.g. "dog" -> "dog animal pet") to prevent financial ticker collisions on US server IPs
  englishKeyword = disambiguateQuery(englishKeyword);

  const isTranslated = englishKeyword.toLowerCase() !== cleanQuery.toLowerCase();

  try {
    // 1. Try translated English term first (if available)
    if (isTranslated) {
      const engSearchQuery = isCartoon ? `${englishKeyword} cartoon illustration` : englishKeyword;

      const ddgResults = await searchDDGImages(engSearchQuery);
      if (ddgResults && ddgResults.length > 0) return ddgResults;

      const webResults = await searchWebImages(englishKeyword, isCartoon);
      if (webResults && webResults.length > 0) return webResults;

      const pixabayResults = await searchPixabayImages(englishKeyword, isCartoon);
      if (pixabayResults && pixabayResults.length > 0) return pixabayResults;

      const openverseResults = await searchOpenverseImages(isCartoon ? `${englishKeyword} illustration` : englishKeyword);
      if (openverseResults && openverseResults.length > 0) return openverseResults;

      const wikimediaResults = await searchWikimediaImages(englishKeyword, isCartoon);
      if (wikimediaResults && wikimediaResults.length > 0) return wikimediaResults;
    }

    // 2. Fallback to original cleanQuery with disambiguation
    const safeRawQuery = disambiguateQuery(cleanQuery);
    const rawSearchQuery = isCartoon
      ? `${safeRawQuery} cartoon illustration`
      : safeRawQuery;

    const ddgResults = await searchDDGImages(rawSearchQuery);
    if (ddgResults && ddgResults.length > 0) return ddgResults;

    const webResults = await searchWebImages(safeRawQuery, isCartoon);
    if (webResults && webResults.length > 0) return webResults;

    const pixabayResults = await searchPixabayImages(safeRawQuery, isCartoon);
    if (pixabayResults && pixabayResults.length > 0) return pixabayResults;

    const openverseResults = await searchOpenverseImages(isCartoon ? `${safeRawQuery} illustration` : safeRawQuery);
    if (openverseResults && openverseResults.length > 0) return openverseResults;

    const pexelsResults = await searchPexelsImages(isCartoon ? `${safeRawQuery} illustration` : safeRawQuery);
    if (pexelsResults && pexelsResults.length > 0) return pexelsResults;

    const wikimediaResults = await searchWikimediaImages(safeRawQuery, isCartoon);
    if (wikimediaResults && wikimediaResults.length > 0) return wikimediaResults;

    return [];
  } catch (error) {
    console.error("Image search failed:", error);
    return [];
  }
}


