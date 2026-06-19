"use server";

import openai from "@/lib/openai";
import { uploadUrlMedia } from "./upload-actions";

export async function generateThumbnailFromTitle(title: string) {
  if (!process.env.OPENAI_API_KEY && !process.env.DEEPINFRA_API_KEY) {
    throw new Error("Missing AI API key environment variables (OPENAI_API_KEY or DEEPINFRA_API_KEY)");
  }

  try {
    const prompt = `A simple, clean, bright, vibrant, and colorful educational thumbnail. Prominent bold text saying '${title}'. High quality, modern vector art or 3D cartoon style, engaging for students. No other complex text.`;

    let response = null;
    let lastError = null;

    if (process.env.DEEPINFRA_API_KEY) {
      try {
        console.log(`Generating thumbnail using DeepInfra FLUX.1 Schnell for title: "${title}"`);
        const res = await fetch(`https://api.deepinfra.com/v1/openai/images/generations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.DEEPINFRA_API_KEY}`
          },
          body: JSON.stringify({
            model: "black-forest-labs/FLUX-1-schnell",
            prompt: prompt,
            n: 1,
            size: "1024x1024",
            response_format: "b64_json"
          })
        });
        const responseData = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(responseData.error?.message || `HTTP status: ${res.status}`);
        }
        if (responseData.data?.[0]?.b64_json) {
          response = {
            data: [{ b64_json: responseData.data[0].b64_json }]
          };
        }
      } catch (err: any) {
        console.error("DeepInfra thumbnail generation failed:", err);
        lastError = err;
        if (!process.env.OPENAI_API_KEY) {
          throw err;
        }
      }
    }

    if (!response && process.env.OPENAI_API_KEY) {
      console.log("Generating thumbnail using OpenAI DALL-E...");
      const completion = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1792x1024",
        quality: "standard",
      });
      if (completion?.data?.[0]?.url) {
        response = {
          data: [{ url: completion.data[0].url }]
        };
      }
    }

    if (!response) {
      throw new Error(`Failed to generate image: ${lastError?.message || "No working model found"}`);
    }

    const imgData = response.data[0];
    const imagePayload = imgData.b64_json ? `data:image/png;base64,${imgData.b64_json}` : imgData.url!;

    // Upload the image to Cloudflare R2 / S3
    const uploadResult = await uploadUrlMedia(imagePayload);
    if (!uploadResult.success) {
      throw new Error(uploadResult.error || "Failed to upload generated image");
    }

    return { success: true, url: uploadResult.url };
  } catch (error: any) {
    console.error("Error generating thumbnail:", error);
    return { success: false, error: error.message };
  }
}
