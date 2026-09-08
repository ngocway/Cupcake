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
      { signal: AbortSignal.timeout(1500) }
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
    const tokenRes = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(query)}&iar=images`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      signal: AbortSignal.timeout(1000)
    });
    const html = await tokenRes.text();
    const vqdMatch = html.match(/vqd=["']?([^&"'\s]+)/i) || html.match(/vqd=([\d-]+)/i);
    const vqd = vqdMatch ? vqdMatch[1] : null;

    if (!vqd) return [];

    const imgRes = await fetch(`https://duckduckgo.com/i.js?q=${encodeURIComponent(query)}&o=json&vqd=${vqd}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://duckduckgo.com/"
      },
      signal: AbortSignal.timeout(1000)
    });

    if (imgRes.ok) {
      const data = await imgRes.json();
      return (data.results || []).slice(0, 50).map((img: any, i: number) => ({
        id: `ddg-img-${i}`,
        url: img.image,
        thumb: img.thumbnail || img.image,
        author: img.title || "Internet Image",
        authorLink: img.url || "#"
      }));
    }
  } catch (e) {
    // Silent fail or timeout
  }
  return [];
}

// Modern Search Engine Parser for Web Images (Replaces obsolete googlethis, extracts high-res images & CDN thumbs)
async function searchWebImages(query: string, isCartoon = false) {
  try {
    const searchTerm = isCartoon ? `${query} cartoon illustration clipart` : query;
    const url = `https://www.bing.com/images/search?q=${encodeURIComponent(searchTerm)}&form=HDRSC2&first=1`;
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

export async function searchImagesAction(query: string, style: "CARTOON" | "REALISTIC" = "CARTOON") {
  if (!query || !query.trim()) return [];

  const cleanQuery = query.trim();
  const isCartoon = style === "CARTOON";
  const searchQuery = isCartoon ? `${cleanQuery} cartoon illustration` : cleanQuery;

  try {
    // 1. Try Pixabay (Existing source 1)
    const pixabayResults = await searchPixabayImages(cleanQuery, isCartoon);
    if (pixabayResults.length > 0) {
      return pixabayResults;
    }

    // 2. Try Unsplash (Existing source 2 - realistic photos)
    if (!isCartoon) {
      const unsplashResults = await searchUnsplashImages(cleanQuery);
      if (unsplashResults.length > 0) {
        return unsplashResults;
      }
    }

    // 3. Try Pexels (High-quality photos & creative media)
    const pexelsResults = await searchPexelsImages(isCartoon ? `${cleanQuery} illustration` : cleanQuery);
    if (pexelsResults.length > 0) {
      return pexelsResults;
    }

    // 3. Try DuckDuckGo (Existing source 3)
    const ddgResults = await searchDDGImages(searchQuery);
    if (ddgResults.length > 0) {
      return ddgResults;
    }

    // 4. Try Modern Web Image Search Engine (Replaces obsolete googlethis)
    const webResults = await searchWebImages(cleanQuery, isCartoon);
    if (webResults.length > 0) {
      return webResults;
    }

    // Fallback: try raw query on Pixabay if searchQuery with cartoon returned 0
    const fallbackPixabay = await searchPixabayImages(cleanQuery, false);
    if (fallbackPixabay.length > 0) {
      return fallbackPixabay;
    }

    // 5. High-Reliability Educational Fallback: Wikimedia Commons API
    const wikimediaResults = await searchWikimediaImages(cleanQuery, isCartoon);
    if (wikimediaResults.length > 0) {
      return wikimediaResults;
    }

    // 6. High-Reliability Creative Commons Fallback: Openverse API
    const openverseResults = await searchOpenverseImages(cleanQuery);
    if (openverseResults.length > 0) {
      return openverseResults;
    }

    return [];
  } catch (error) {
    console.error("Image search failed:", error);
    return [];
  }
}
