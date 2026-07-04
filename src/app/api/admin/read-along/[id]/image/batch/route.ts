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

async function generateImageWithGemini(prompt: string, apiKey: string): Promise<string | null> {
  const baseEndpoint = "https://generativelanguage.googleapis.com";
  let lastError = "";

  for (const modelName of GEMINI_MODELS) {
    try {
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
        return imageData;
      }
    } catch (err: any) {
      lastError = err.message;
      console.warn(`[ImageBatch] ${modelName} failed: ${err.message}`);
    }
  }

  throw new Error(lastError || "All Gemini models failed");
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

          const characterContext = `BOOK TITLE: "${book.title}"
FULL STORY CONTEXT (all pages):
${allTexts}

CHARACTER CONSISTENCY RULES (CRITICAL):
- This is page ${currentPageNumber} of ${totalSlides} in the book "${book.title}"
- ALL characters must look EXACTLY the same across every page: identical design, colors, proportions, clothing, and style
- Maintain the same art style, color palette, and visual language throughout this book
- Do NOT redesign or change any character between pages`;

          const fullPrompt = `${characterContext}

NOW ILLUSTRATE THIS PAGE:
A humorous children's storybook illustration depicting: ${slideText}
Aspect ratio: 9:16 portrait orientation.
${STYLE_SUFFIX}`;

          const b64 = await generateImageWithGemini(fullPrompt, apiKey);

          if (!b64) throw new Error("No image data returned");

          // Upload to R2
          const buffer = Buffer.from(b64, "base64");
          const fileName = `read-along-${bookId}-${slide.id}-${Date.now()}.png`;
          const publicUrl = await uploadBufferToR2(buffer, fileName, "image/png");

          const imageName = `Slide ${slide.slideNumber} - AI Generated`;
          await prisma.readAlongSlide.update({
            where: { id: slide.id },
            data: { imageUrl: publicUrl, imageName },
          });

          successCount++;
          send({ type: "progress", slideId: slide.id, current, status: "done", imageUrl: publicUrl });
        } catch (err: any) {
          console.error(`[ImageBatch] Slide ${slide.slideNumber} error:`, err.message);
          send({ type: "progress", slideId: slide.id, current, status: "error", error: err.message });
        }
      }

      send({ type: "complete", successCount, skipCount, total: slideQueue.length });
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
