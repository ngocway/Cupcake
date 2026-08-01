"use server";

import openai from "@/lib/openai";
import { uploadUrlMedia } from "./upload-actions";

export async function generateThumbnailFromTitle(title: string) {
  if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY && !process.env.DEEPINFRA_API_KEY && !process.env.OPENAI_API_KEY) {
    throw new Error("Missing AI API key environment variables");
  }

  try {
    const prompt = `A simple flat vector cartoon illustration for an educational thumbnail about: "${title}".
Style guidelines: flat 2D vector graphic design, clean solid color fill, minimal bold shapes, vibrant contrasting pastel background, cute iconic cartoon style, ultra clean vector art, educational banner style, centered composition, generous negative space.
Negative directives: no watercolor texture, no paper texture, no realistic shading, no gradients, no 3D render, no photorealistic, no text, no words, no clutter, no watermark.`;

    let response = null;
    let lastError = null;

    // 1. Try DeepInfra FLUX.1 Dev (Priority 1)
    if (!response && process.env.DEEPINFRA_API_KEY) {
      try {
        console.log(`Generating thumbnail using DeepInfra FLUX.1 Dev for title: "${title}"`);
        const res = await fetch(`https://api.deepinfra.com/v1/openai/images/generations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.DEEPINFRA_API_KEY}`
          },
          body: JSON.stringify({
            model: "black-forest-labs/FLUX-1-dev",
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
          console.log(`Successfully generated thumbnail using DeepInfra FLUX.1 Dev`);
          response = {
            data: [{ b64_json: responseData.data[0].b64_json }]
          };
        }
      } catch (err: any) {
        console.error("DeepInfra FLUX.1 Dev thumbnail generation failed:", err.message);
        lastError = err;
      }
    }

    // 2. Fallback to Gemini Imagen (Priority 2)
    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!response && geminiApiKey) {
      const geminiModels = ["gemini-2.5-flash-image", "gemini-3.1-flash-image"];
      for (const gModel of geminiModels) {
        try {
          console.log(`Generating thumbnail using Gemini Imagen model ${gModel} for title: "${title}"`);
          const baseEndpoint = process.env.GEMINI_API_ENDPOINT || "https://generativelanguage.googleapis.com";
          const res = await fetch(`${baseEndpoint}/v1beta/models/${gModel}:generateContent?key=${geminiApiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                responseModalities: ["IMAGE"]
              }
            })
          });

          const responseData = await res.json().catch(() => ({}));
          if (!res.ok) {
            throw new Error(responseData.error?.message || `HTTP status: ${res.status}`);
          }

          const base64Data = responseData.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
          if (base64Data) {
            console.log(`Successfully generated thumbnail using Gemini Imagen model ${gModel}`);
            response = {
              data: [{ b64_json: base64Data }]
            };
            break;
          }
        } catch (err: any) {
          console.error(`Gemini Imagen model ${gModel} thumbnail generation failed:`, err.message);
          lastError = err;
        }
      }
    }

    // 3. Fallback to OpenAI DALL-E (Priority 3)
    if (!response && process.env.OPENAI_API_KEY) {
      try {
        console.log("Generating thumbnail using OpenAI DALL-E...");
        const completion = await openai.images.generate({
          model: "dall-e-3",
          prompt: prompt,
          n: 1,
          size: "1792x1024",
          quality: "standard",
        });
        if (completion?.data?.[0]?.url) {
          console.log(`Successfully generated thumbnail using OpenAI DALL-E`);
          response = {
            data: [{ url: completion.data[0].url }]
          };
        }
      } catch (err: any) {
        console.error("OpenAI DALL-E thumbnail generation failed:", err.message);
        lastError = err;
      }
    }

    if (!response) {
      throw new Error(`Failed to generate thumbnail: ${lastError?.message || "No working model found"}`);
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
