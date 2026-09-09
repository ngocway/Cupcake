export interface SearchImageResult {
  id: string;
  url: string;
  thumb: string;
  author: string;
  authorLink: string;
}

export const COMMON_VI_MAP: Record<string, string> = {
  // Animals
  "dơi": "bat",
  "con dơi": "bat",
  "chó": "dog",
  "con chó": "dog",
  "mèo": "cat",
  "con mèo": "cat",
  "hổ": "tiger",
  "con hổ": "tiger",
  "cọp": "tiger",
  "sư tử": "lion",
  "voi": "elephant",
  "con voi": "elephant",
  "hươu cao cổ": "giraffe",
  "cá voi xanh": "blue whale",
  "cá voi": "whale",
  "cá mập": "shark",
  "cá heo": "dolphin",
  "sóc": "squirrel",
  "sóc bay": "flying squirrel",
  "cáo": "fox",
  "cáo túi": "opossum",
  "chim én": "swallow bird",
  "chim": "bird",
  "gấu": "bear",
  "gấu trúc": "panda bear",
  "thỏ": "rabbit",
  "con thỏ": "rabbit",
  "khỉ": "monkey",
  "ngựa": "horse",
  "bò": "cow",
  "heo": "pig",
  "lợn": "pig",
  "dê": "goat",
  "cừu": "sheep",
  "vịt": "duck",
  "gà": "chicken",
  "gà trống": "rooster",
  "rùa": "turtle",
  "ếch": "frog",
  "rắn": "snake",
  "ong": "bee",
  "bướm": "butterfly",
  "kiến": "ant",
  
  // Nature & Objects
  "mây": "cloud",
  "đám mây": "cloud",
  "mặt trời": "sun",
  "mặt trăng": "moon",
  "ngôi sao": "star",
  "cây": "tree",
  "hoa": "flower",
  "bông hoa": "flower",
  "quả táo": "apple",
  "trái táo": "apple",
  "quả chuối": "banana",
  "quả dưa hấu": "watermelon",
  "quả cam": "orange fruit",
  "quả nho": "grapes",
  "xe hơi": "car",
  "ô tô": "car",
  "xe đạp": "bicycle",
  "xe máy": "motorbike",
  "máy bay": "airplane",
  "tàu hỏa": "train",
  "xe lửa": "train",
  "thuyền": "boat",
  "nhà": "house",
  "ngôi nhà": "house",
  "trường học": "school",
  "sách": "book",
  "quyển sách": "book",
  "bút": "pen",
  "cái bút": "pen",

  // Shapes
  "hình vuông": "square shape",
  "hình tròn": "circle shape",
  "hình chữ nhật": "rectangle shape",
  "hình thoi": "rhombus shape",
  "tam giác vuông": "right triangle",
  "tam giác cân": "isosceles triangle",
  "tam giác đều": "equilateral triangle",
  "tam giác nhọn": "acute triangle",
  "tam giác tù": "obtuse triangle"
};

const ANIMAL_WORDS = new Set([
  "dog", "cat", "bat", "cow", "pig", "rat", "fox", "owl", "hen", "duck",
  "fish", "bear", "lion", "wolf", "frog", "deer", "goat", "seal", "swan",
  "ant", "bee", "bug", "fly", "ram", "elk", "ape", "yak"
]);

export function cleanAndTranslateQuery(rawQuery: string): { englishKeyword: string; isTranslated: boolean; cleanQuery: string } {
  let clean = rawQuery.trim().replace(/[?!.,;:()'"]/g, "");
  clean = clean.replace(/^(con|cái|quả|trái|bức|tấm|loài)\s+/i, "").trim();

  const lower = clean.toLowerCase();
  let englishKeyword = clean;

  if (COMMON_VI_MAP[lower]) {
    englishKeyword = COMMON_VI_MAP[lower];
  } else if (COMMON_VI_MAP[rawQuery.trim().toLowerCase()]) {
    englishKeyword = COMMON_VI_MAP[rawQuery.trim().toLowerCase()];
  }

  const engLower = englishKeyword.toLowerCase();
  if (engLower === "bat") {
    englishKeyword = "bat animal flying";
  } else if (ANIMAL_WORDS.has(engLower)) {
    englishKeyword = `${englishKeyword} animal pet`;
  }

  const isTranslated = englishKeyword.toLowerCase() !== clean.toLowerCase();
  return { englishKeyword, isTranslated, cleanQuery: clean };
}

export async function searchImagesClient(query: string, style: "CARTOON" | "REALISTIC" = "CARTOON"): Promise<SearchImageResult[]> {
  if (!query || !query.trim()) return [];

  const { englishKeyword } = cleanAndTranslateQuery(query);
  const isCartoon = style === "CARTOON";
  const apiKey = "39818817-48f57297e682e0df8d0e74ee8";

  const searchKeyword = isCartoon ? `${englishKeyword} cartoon` : englishKeyword;

  // 1. Try Pixabay directly from Client Browser (User IP)
  try {
    const pixabayType = isCartoon ? "illustration" : "photo";
    const pixabayRes = await fetch(
      `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(searchKeyword)}&image_type=${pixabayType}&per_page=30&safesearch=true`
    );
    if (pixabayRes.ok) {
      const data = await pixabayRes.json();
      if (data.hits && data.hits.length > 0) {
        return data.hits.map((img: any, i: number) => ({
          id: `pixabay-client-${img.id || i}`,
          url: img.webformatURL || img.largeImageURL,
          thumb: img.previewURL || img.webformatURL,
          author: img.user || "Pixabay",
          authorLink: img.pageURL || "#"
        }));
      }
    }
  } catch (e) {
    // Fallthrough to next provider
  }

  // 2. Try Openverse API directly from Client Browser (User IP)
  try {
    const openverseQuery = isCartoon ? `${englishKeyword} cartoon illustration` : englishKeyword;
    const ovRes = await fetch(`https://api.openverse.org/v1/images/?q=${encodeURIComponent(openverseQuery)}&page_size=30`);
    if (ovRes.ok) {
      const data = await ovRes.json();
      if (data.results && data.results.length > 0) {
        return data.results.map((img: any, i: number) => ({
          id: `openverse-client-${img.id || i}`,
          url: img.url,
          thumb: img.thumbnail || img.url,
          author: img.title || img.creator || "Openverse",
          authorLink: img.foreign_landing_url || "#"
        }));
      }
    }
  } catch (e) {
    // Fallthrough
  }

  // 3. Try DuckDuckGo directly from Client Browser (User IP)
  try {
    const ddgQuery = isCartoon ? `${englishKeyword} cartoon` : englishKeyword;
    const tokenRes = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(ddgQuery)}&iar=images&iax=images`);
    if (tokenRes.ok) {
      const html = await tokenRes.text();
      const vqdMatch = html.match(/vqd=["']?([^&"'\s]+)/i) || html.match(/vqd=([\d-]+)/i);
      const vqd = vqdMatch ? vqdMatch[1] : null;
      if (vqd) {
        const imgRes = await fetch(`https://duckduckgo.com/i.js?q=${encodeURIComponent(ddgQuery)}&o=json&vqd=${vqd}&f=,,,`);
        if (imgRes.ok) {
          const data = await imgRes.json();
          if (data.results && data.results.length > 0) {
            return data.results.slice(0, 50).map((img: any, i: number) => ({
              id: `ddg-client-${i}`,
              url: img.image,
              thumb: img.thumbnail || img.image,
              author: img.title || "Internet Image",
              authorLink: img.url || "#"
            }));
          }
        }
      }
    }
  } catch (e) {
    // Fallthrough
  }

  // 4. Server Action Fallback
  try {
    const { searchImagesAction } = await import("@/actions/image-search-actions");
    return await searchImagesAction(query, style);
  } catch (e) {
    return [];
  }
}
