"use server";
import google from 'googlethis';

async function searchPixabayImages(query: string, isCartoon = false) {
  try {
    const type = isCartoon ? "illustration" : "photo";
    const res = await fetch(`https://pixabay.com/api/?key=39818817-48f57297e682e0df8d0e74ee8&q=${encodeURIComponent(query)}&image_type=${type}&per_page=30&safesearch=true`);
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
    console.error("Pixabay image search error:", e);
  }
  return [];
}

async function searchUnsplashImages(query: string) {
  try {
    const res = await fetch(`https://unsplash.com/napi/search/photos?query=${encodeURIComponent(query)}&per_page=30`);
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
    console.error("Unsplash image search error:", e);
  }
  return [];
}

async function searchDDGImages(query: string) {
  try {
    const tokenRes = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(query)}&iar=images`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    const html = await tokenRes.text();
    const vqdMatch = html.match(/vqd=["']?([^&"'\s]+)/i) || html.match(/vqd=([\d-]+)/i);
    const vqd = vqdMatch ? vqdMatch[1] : null;

    if (!vqd) return [];

    const imgRes = await fetch(`https://duckduckgo.com/i.js?q=${encodeURIComponent(query)}&o=json&vqd=${vqd}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://duckduckgo.com/"
      }
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
    console.error("DDG image search failed:", e);
  }
  return [];
}

export async function searchImagesAction(query: string, style: "CARTOON" | "REALISTIC" = "CARTOON") {
  if (!query || !query.trim()) return [];

  const cleanQuery = query.trim();
  const isCartoon = style === "CARTOON";
  const searchQuery = isCartoon ? `${cleanQuery} cartoon illustration` : cleanQuery;

  try {
    // 1. Try Pixabay (Instant, 100% reliable, high-res cartoon illustrations / photos)
    const pixabayResults = await searchPixabayImages(cleanQuery, isCartoon);
    if (pixabayResults.length > 0) {
      return pixabayResults;
    }

    // 2. Try Unsplash (For realistic photos)
    if (!isCartoon) {
      const unsplashResults = await searchUnsplashImages(cleanQuery);
      if (unsplashResults.length > 0) {
        return unsplashResults;
      }
    }

    // 3. Try DuckDuckGo
    const ddgResults = await searchDDGImages(searchQuery);
    if (ddgResults.length > 0) {
      return ddgResults;
    }

    // 4. Try Google Images
    const images = await google.image(searchQuery, { safe: false });
    if (images && images.length > 0) {
      return images.slice(0, 50).map((img: any, i: number) => ({
        id: img.id || `google-img-${i}`,
        url: img.url,
        thumb: img.preview?.url || img.url,
        author: img.origin?.website?.name || 'Google Images',
        authorLink: img.origin?.website?.url || '#'
      }));
    }

    // Fallback: try raw query on Pixabay / Unsplash if searchQuery with cartoon returned 0
    const fallbackPixabay = await searchPixabayImages(cleanQuery, false);
    if (fallbackPixabay.length > 0) {
      return fallbackPixabay;
    }

    return [];
  } catch (error) {
    console.error("Image search failed:", error);
    return [];
  }
}
