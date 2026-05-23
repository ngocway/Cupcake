"use server";
import google from 'googlethis';

export async function searchImagesAction(query: string) {
  if (!query) return [];

  try {
    // Sử dụng thư viện cào dữ liệu Google Images trực tiếp, miễn phí 100% không cần API Key
    const images = await google.image(query, { safe: false });
    
    if (!images || images.length === 0) {
      return [];
    }

    return images.slice(0, 15).map((img: any, i: number) => ({
      id: img.id || `google-img-${i}`,
      url: img.url,
      thumb: img.preview?.url || img.url,
      author: img.origin?.website?.name || 'Google Images',
      authorLink: img.origin?.website?.url || '#'
    }));
  } catch (error) {
    console.error("Google image search failed:", error);
    throw new Error("Lỗi tìm kiếm trên Google Images. Có thể do kết nối hoặc Google chặn IP tạm thời.");
  }
}
