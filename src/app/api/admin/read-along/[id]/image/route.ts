import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { uploadBufferToR2 } from "@/actions/upload-actions";

export const maxDuration = 120;

// Style/quality tags for children's storybook illustration
const STYLE_SUFFIX = `Clean black ink outlines with smooth line variation, beautifully painted digital illustration, soft cel shading, subtle painterly textures, warm sunlight, soft ambient lighting, vibrant but natural colors. The scene takes place on a small grassy hill surrounded by simple wooden fences, green bushes, and tiny plants. The background is intentionally minimal to keep the focus on the character. Playful composition with lots of negative space. Professional children's picture book illustration, whimsical storytelling, expressive character acting, highly polished artwork, premium editorial illustration, Disney-quality craftsmanship, DreamWorks-inspired humor, modern storybook aesthetic, soft brushwork, crisp details, smooth gradients, high visual appeal, family-friendly, joyful atmosphere, ultra high quality, masterpiece. Avoid: photorealistic, realistic, 3D render, CGI, anime, manga, comic book, sketch, pencil drawing, watercolor, oil painting, low quality, blurry, noisy, pixelated, oversaturated, flat colors, bad anatomy, malformed limbs, extra legs, extra arms, duplicated body parts, deformed face, cropped, cut off, text, logo, watermark, frame, dark horror, scary, ugly, mutation.`;

const GEMINI_MODELS = [
  "gemini-3.1-flash-image",
  "gemini-2.5-flash-image",
  "gemini-2.0-flash-image",
  "gemini-2.0-flash-exp-image-generation",
  "imagen-3.0-generate-002",
];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id: bookId } = await params;
    const { slideId } = await req.json();

    if (!slideId) {
      return NextResponse.json({ error: "slideId is required" }, { status: 400 });
    }

    // Fetch full book context for character consistency
    const book = await prisma.readAlongBook.findUnique({
      where: { id: bookId },
      include: {
        slides: {
          orderBy: { orderIndex: "asc" },
          select: { id: true, orderIndex: true, text: true },
        },
      },
    });

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const slide = await prisma.readAlongSlide.findFirst({
      where: { id: slideId, bookId },
    });

    if (!slide) {
      return NextResponse.json({ error: "Slide not found" }, { status: 404 });
    }

    const slideText = slide.text?.trim();
    if (!slideText) {
      return NextResponse.json({ error: "Slide has no text to generate image from." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured." }, { status: 500 });
    }

    // Build character context from the full story
    const allTexts = book.slides
      .filter(s => s.text?.trim())
      .map((s, i) => `Page ${i + 1}: ${s.text.trim()}`)
      .join("\n");

    const currentPageNumber = book.slides.findIndex(s => s.id === slideId) + 1;

    const characterContext = `
BOOK TITLE: "${book.title}"
FULL STORY CONTEXT (all pages):
${allTexts}

CHARACTER CONSISTENCY RULES (CRITICAL):
- This is page ${currentPageNumber} of ${book.slides.length} in the book "${book.title}"
- ALL characters must look EXACTLY the same across every page: identical design, colors, proportions, clothing, and style
- Maintain the same art style, color palette, and visual language as would appear throughout this book
- Do NOT redesign or change any character between pages
`.trim();

    // Build full prompt
    const fullPrompt = `${characterContext}

NOW ILLUSTRATE THIS PAGE:
A humorous children's storybook illustration depicting: ${slideText}
Aspect ratio: 9:16 portrait orientation.
${STYLE_SUFFIX}`;

    console.log(`[ReadAlong Image] Generating page ${currentPageNumber}/${book.slides.length} for "${book.title}": "${slideText.substring(0, 60)}..."`);

    // Always use the real Google API for image generation
    // (local proxy at GEMINI_API_ENDPOINT only handles text/chat, not image)
    const baseEndpoint = "https://generativelanguage.googleapis.com";
    let b64: string | null = null;
    let lastError = "";

    for (const modelName of GEMINI_MODELS) {
      try {
        console.log(`[ReadAlong Image] Trying model: ${modelName}`);

        let imageData: string | null = null;

        if (modelName.startsWith("imagen-")) {
          // Imagen models use :predict endpoint with different request shape
          const res = await fetch(
            `${baseEndpoint}/v1beta/models/${modelName}:predict?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                instances: [{ prompt: fullPrompt }],
                parameters: { sampleCount: 1 },
              }),
            }
          );
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`);
          imageData = data.predictions?.[0]?.bytesBase64Encoded ?? null;
        } else {
          // Gemini flash-image models use :generateContent with responseModalities
          const res = await fetch(
            `${baseEndpoint}/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: fullPrompt }] }],
                generationConfig: { responseModalities: ["IMAGE"] },
              }),
            }
          );
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`);
          imageData = data.candidates?.[0]?.content?.parts?.find(
            (p: any) => p.inlineData
          )?.inlineData?.data ?? null;
        }

        if (imageData) {
          b64 = imageData;
          console.log(`[ReadAlong Image] Success with ${modelName}`);
          break;
        }
      } catch (err: any) {
        lastError = err.message;
        console.warn(`[ReadAlong Image] Model ${modelName} failed: ${err.message}`);
      }
    }

    if (!b64) {
      return NextResponse.json(
        { error: `Không thể tạo ảnh. Lỗi: ${lastError}` },
        { status: 500 }
      );
    }

    // Upload to R2
    const buffer = Buffer.from(b64, "base64");
    const fileName = `read-along-${bookId}-${slideId}-${Date.now()}.png`;
    const publicUrl = await uploadBufferToR2(buffer, fileName, "image/png");

    // Update slide in DB
    const imageName = `Slide ${slide.slideNumber} - AI Generated`;
    await prisma.readAlongSlide.update({
      where: { id: slideId },
      data: { imageUrl: publicUrl, imageName },
    });

    console.log(`[ReadAlong Image] Done: ${publicUrl}`);
    return NextResponse.json({ success: true, imageUrl: publicUrl, imageName });
  } catch (error: any) {
    console.error("[ReadAlong Image API] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
