"use server";
import google from 'googlethis';

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

export async function searchImagesAction(query: string) {
  if (!query) return [];

  try {
    // Ưu tiên sử dụng DuckDuckGo Search (Nhanh, phản hồi 80+ ảnh chất lượng cao, không 404)
    const ddgResults = await searchDDGImages(query);
    if (ddgResults && ddgResults.length > 0) {
      return ddgResults;
    }

    // Fallback: Sử dụng googlethis
    const images = await google.image(query, { safe: false });
    if (images && images.length > 0) {
      return images.slice(0, 50).map((img: any, i: number) => ({
        id: img.id || `google-img-${i}`,
        url: img.url,
        thumb: img.preview?.url || img.url,
        author: img.origin?.website?.name || 'Google Images',
        authorLink: img.origin?.website?.url || '#'
      }));
    }

    return [];
  } catch (error) {
    console.error("Image search failed:", error);
    throw new Error("Không thể tải hình ảnh từ Internet. Vui lòng kiểm tra lại kết nối mạng.");
  }
}
