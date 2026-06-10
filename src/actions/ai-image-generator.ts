"use server";

import openai from "@/lib/openai";
import { uploadUrlMedia } from "./upload-actions";

export async function generateThumbnailFromTitle(title: string) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY environment variable");
  }

  try {
    const prompt = `A simple, clean, bright, vibrant, and colorful educational thumbnail. Prominent bold text saying '${title}'. High quality, modern vector art or 3D cartoon style, engaging for students. No other complex text.`;

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1792x1024",
      quality: "standard",
    });

    const imageUrl = response?.data?.[0]?.url;
    if (!imageUrl) {
      throw new Error("Failed to generate image URL from OpenAI");
    }

    // Upload the image to Cloudflare R2 / S3
    const uploadResult = await uploadUrlMedia(imageUrl);
    if (!uploadResult.success) {
      throw new Error(uploadResult.error || "Failed to upload generated image");
    }

    return { success: true, url: uploadResult.url };
  } catch (error: any) {
    console.error("Error generating thumbnail:", error);
    return { success: false, error: error.message };
  }
}
