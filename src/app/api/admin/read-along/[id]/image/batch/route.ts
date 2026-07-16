import { NextRequest } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { uploadBufferToR2 } from "@/actions/upload-actions";

export const maxDuration = 300;

const STYLE_SUFFIX = `Clean black ink outlines with smooth line variation, beautifully painted digital illustration, soft cel shading, subtle painterly textures, warm sunlight, soft ambient lighting, vibrant but natural colors. The scene takes place on a small grassy hill surrounded by simple wooden fences, green bushes, and tiny plants. The background is intentionally minimal to keep the focus on the character. Playful composition with lots of negative space. Professional children's picture book illustration, whimsical storytelling, expressive character acting, highly polished artwork, premium editorial illustration, Disney-quality craftsmanship, DreamWorks-inspired humor, modern storybook aesthetic, soft brushwork, crisp details, smooth gradients, high visual appeal, family-friendly, joyful atmosphere, ultra high quality, masterpiece. Avoid: photorealistic, realistic, 3D render, CGI, anime, manga, comic book, sketch, pencil drawing, watercolor, oil painting, low quality, blurry, noisy, pixelated, oversaturated, flat colors, bad anatomy, malformed limbs, extra legs, extra arms, duplicated body parts, deformed face, cropped, cut off, text, logo, watermark, frame, dark horror, scary, ugly, mutation.`;

const GEMINI_MODELS = [
  "gemini-3.1-flash-image",
  "gemini-2.5-flash-image",
  "gemini-2.0-flash-image",
  "gemini-2.0-flash-exp-image-generation",
  "imagen-3.0-generate-002",
];

async function generateImageWithGemini(
  prompt: string,
  apiKey: string,
  aspectRatio: "portrait" | "landscape" = "portrait",
  isThumbnail: boolean = false
): Promise<{ b64: string; model: string }> {
  const baseEndpoint = "https://generativelanguage.googleapis.com";
  let lastError = "";

  const fluxSize = aspectRatio === "landscape" ? "1024x576" : "768x1024";
  const dalleSize = aspectRatio === "landscape" ? "1792x1024" : "1024x1792";

  const priorities = isThumbnail
    ? ["gemini", "dalle", "flux"]
    : ["flux", "gemini", "dalle"];

  for (const step of priorities) {
    // 1. FLUX
    if (step === "flux" && process.env.DEEPINFRA_API_KEY) {
      try {
        console.log(`[ImageBatch] Attempting image generation with DeepInfra FLUX.1 Dev (${fluxSize})...`);
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
            size: fluxSize,
            response_format: "b64_json"
          })
        });
        const responseData = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(responseData.error?.message || `HTTP status: ${res.status}`);
        }
        if (responseData.data?.[0]?.b64_json) {
          console.log(`[ImageBatch] Success with DeepInfra FLUX.1 Dev`);
          return { b64: responseData.data[0].b64_json, model: "FLUX.1 Dev (DeepInfra)" };
        }
      } catch (err: any) {
        lastError = err.message;
        console.warn(`[ImageBatch] DeepInfra FLUX.1 Dev failed: ${err.message}`);
      }
    }

    // 2. Gemini
    if (step === "gemini" && apiKey) {
      for (const modelName of GEMINI_MODELS) {
        try {
          console.log(`[ImageBatch] Trying Gemini model: ${modelName}...`);
          let imageData: string | null = null;

          if (modelName.startsWith("imagen-")) {
            const res = await fetch(
              `${baseEndpoint}/v1beta/models/${modelName}:predict?key=${apiKey}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  instances: [{ prompt }],
                  parameters: { sampleCount: 1 },
                }),
              }
            );
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`);
            imageData = data.predictions?.[0]?.bytesBase64Encoded ?? null;
          } else {
            const res = await fetch(
              `${baseEndpoint}/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: prompt }] }],
                  generationConfig: { responseModalities: ["IMAGE"] },
                }),
              }
            );
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`);
            imageData =
              data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)
                ?.inlineData?.data ?? null;
          }

          if (imageData) {
            console.log(`[ImageBatch] Success with ${modelName}`);
            return { b64: imageData, model: `Gemini (${modelName})` };
          }
        } catch (err: any) {
          lastError = err.message;
          console.warn(`[ImageBatch] ${modelName} failed: ${err.message}`);
        }
      }
    }

    // 3. DALL-E
    if (step === "dalle" && process.env.OPENAI_API_KEY) {
      const baseURL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
      const models = ["gpt-image-2", "dall-e-3", "dall-e-2"];
      for (const model of models) {
        try {
          console.log(`[ImageBatch] Attempting image generation with OpenAI model ${model}...`);
          let size = dalleSize;
          if (model !== "dall-e-3") {
            size = "1024x1024";
          }
          const res = await fetch(`${baseURL}/images/generations`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
              model: model,
              prompt: prompt,
              n: 1,
              size: size
            })
          });
          const responseData = await res.json().catch(() => ({}));
          if (!res.ok) {
            throw new Error(responseData.error?.message || `HTTP status: ${res.status}`);
          }
          const imgData = responseData.data?.[0];
          if (imgData) {
            if (imgData.b64_json) {
              console.log(`[ImageBatch] Success with OpenAI DALL-E (${model})`);
              return { b64: imgData.b64_json, model: `${model} (OpenAI)` };
            } else if (imgData.url) {
              console.log(`[ImageBatch] Success with OpenAI DALL-E (${model}, url). Downloading...`);
              const imgRes = await fetch(imgData.url);
              if (imgRes.ok) {
                const arrayBuffer = await imgRes.arrayBuffer();
                const b64 = Buffer.from(arrayBuffer).toString("base64");
                return { b64, model: `${model} (OpenAI)` };
              }
            }
          }
        } catch (err: any) {
          lastError = err.message;
          console.warn(`[ImageBatch] OpenAI DALL-E ${model} failed: ${err.message}`);
        }
      }
    }
  }

  throw new Error(lastError || "All image generation models failed");
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });
  }

  const { id: bookId } = await params;
  const { overwrite = false } = await req.json().catch(() => ({}));

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "GEMINI_API_KEY not configured" }), { status: 500 });
  }

  // Fetch full book with all slides (ordered)
  const book = await prisma.readAlongBook.findUnique({
    where: { id: bookId },
    include: {
      slides: { orderBy: { orderIndex: "asc" } },
    },
  });

  if (!book) {
    return new Response(JSON.stringify({ error: "Book not found" }), { status: 404 });
  }

  // Slides with text (only these can get images)
  const slideQueue = book.slides.filter(s => s.text?.trim());

  // Build character context once for the whole batch (uses full story)
  const allTexts = book.slides
    .filter(s => s.text?.trim())
    .map((s, i) => `Page ${i + 1}: ${s.text.trim()}`)
    .join("\n");

  const characterProfile = await getCharacterProfile(allTexts, apiKey);

  const totalSlides = book.slides.length;

  // SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      send({ type: "start", total: slideQueue.length });

      let successCount = 0;
      let skipCount = 0;
      let current = 0;
      const modelCounts: Record<string, number> = {};

      // Generate thumbnail if missing or overwrite is true
      if (!book.thumbnailUrl || overwrite) {
        send({ type: "progress", slideId: "thumbnail", current: 0, status: "generating" });
        try {
          const firstPageText = book.slides[0]?.text?.trim() || "";
          const thumbPrompt = `A premium quality, whimsical 2D children's book cover illustration for a story titled "${book.title}". Scene: "${firstPageText}".
Style guidelines: children's book illustration, premium storybook art, soft watercolor digital painting, pastel color palette, clean hand-drawn line art, rounded cartoon design, gentle brush texture, soft gradients, warm diffused lighting, cozy wholesome aesthetic, cute kawaii style, expressive simple faces, minimal facial features, rosy cheeks, smooth organic shapes, soft shading, airy composition, high-end picture book illustration, charming, whimsical, timeless, elegant simplicity, subtle paper texture, matte finish, Adobe Fresco style, Procreate illustration, 2D, ultra clean, consistent character design.
Negative directives: no realism, no anime, no manga, no cel shading, no 3D, no photorealistic, no text, no watermark.`;

          const result = await generateImageWithGemini(thumbPrompt, apiKey, "landscape", true);
          if (result && result.b64) {
            const buffer = Buffer.from(result.b64, "base64");
            const fileName = `read-along-${bookId}-thumbnail-${Date.now()}.png`;
            const publicUrl = await uploadBufferToR2(buffer, fileName, "image/png");

            await prisma.readAlongBook.update({
              where: { id: bookId },
              data: { thumbnailUrl: publicUrl },
            });
            modelCounts[result.model] = (modelCounts[result.model] || 0) + 1;
            send({ type: "progress", slideId: "thumbnail", current: 0, status: "done", imageUrl: publicUrl });
          } else {
            throw new Error("No image data returned for thumbnail");
          }
        } catch (err: any) {
          console.error(`[ImageBatch] Thumbnail error:`, err.message);
          send({ type: "progress", slideId: "thumbnail", current: 0, status: "error", error: err.message });
        }
      }

      for (const slide of slideQueue) {
        current++;
        const slideText = slide.text.trim();

        // Skip if already has image and not overwriting
        if (slide.imageUrl && !overwrite) {
          send({ type: "skip", slideId: slide.id, current, reason: "already_has_image" });
          skipCount++;
          continue;
        }

        send({ type: "progress", slideId: slide.id, current, status: "generating" });

        try {
          const currentPageNumber = book.slides.findIndex(s => s.id === slide.id) + 1;

          const fullPrompt = `Children's book illustration. Scene: "${slideText}"

IMPORTANT: Illustrate EXACTLY what the sentence says. Focus on the environment, setting, and actions described — do NOT add characters unless the sentence specifically mentions people or animals.


ART STYLE: soft watercolor digital painting, pastel color palette, clean hand-drawn line art, rounded cartoon design, warm diffused lighting, cozy wholesome aesthetic, cute kawaii style, airy composition, whimsical children's book style, 2D, ultra clean illustration, Adobe Fresco style, 9:16
No realism, no 3D, no photorealistic, no text, no watermark.`;

          const result = await generateImageWithGemini(fullPrompt, apiKey);

          if (!result) throw new Error("No image data returned");

          // Upload to R2
          const buffer = Buffer.from(result.b64, "base64");
          const fileName = `read-along-${bookId}-${slide.id}-${Date.now()}.png`;
          const publicUrl = await uploadBufferToR2(buffer, fileName, "image/png");

          const imageName = `Slide ${slide.slideNumber} - AI Generated`;
          await prisma.readAlongSlide.update({
            where: { id: slide.id },
            data: { imageUrl: publicUrl, imageName },
          });

          successCount++;
          modelCounts[result.model] = (modelCounts[result.model] || 0) + 1;
          send({ type: "progress", slideId: slide.id, current, status: "done", imageUrl: publicUrl });
        } catch (err: any) {
          console.error(`[ImageBatch] Slide ${slide.slideNumber} error:`, err.message);
          send({ type: "progress", slideId: slide.id, current, status: "error", error: err.message });
        }
      }

      send({ type: "complete", successCount, skipCount, total: slideQueue.length, modelCounts });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

async function getCharacterProfile(allTexts: string, apiKey: string): Promise<string> {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Based on the following children's book story, identify the main character and describe their visual appearance (gender, approximate age, hair style and color, clothing color and type) in 1-2 simple, descriptive sentences so they can be drawn consistently across all pages. Keep it short (max 50 words) as a single paragraph.

Story:
${allTexts}`
          }]
        }]
      })
    });
    const data = await res.json().catch(() => ({}));
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
  } catch (err) {
    console.error("Error generating character profile with Gemini:", err);
    return "";
  }
}
