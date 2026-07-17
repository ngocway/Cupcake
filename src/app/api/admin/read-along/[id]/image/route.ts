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
    const { slideId, isThumbnail } = await req.json().catch(() => ({}));

    if (!isThumbnail && !slideId) {
      return NextResponse.json({ error: "slideId or isThumbnail is required" }, { status: 400 });
    }

    // Fetch full book context for character consistency or title/description
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

    let fullPrompt = "";
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured." }, { status: 500 });
    }

    if (isThumbnail) {
      const firstPageText = book.slides[0]?.text?.trim() || "";
      fullPrompt = `A premium quality, whimsical 2D children's book cover illustration for a story titled "${book.title}". Scene: "${firstPageText}".
Style guidelines: children's book illustration, premium storybook art, soft watercolor digital painting, pastel color palette, clean hand-drawn line art, rounded cartoon design, gentle brush texture, soft gradients, warm diffused lighting, cozy wholesome aesthetic, cute kawaii style, expressive simple faces, minimal facial features, rosy cheeks, smooth organic shapes, soft shading, airy composition, high-end picture book illustration, charming, whimsical, timeless, elegant simplicity, subtle paper texture, matte finish, Adobe Fresco style, Procreate illustration, 2D, ultra clean, consistent character design.
Negative directives: no realism, no anime, no manga, no cel shading, no 3D, no photorealistic, no text, no watermark.`;
      console.log(`[ReadAlong Thumbnail] Generating 16:9 thumbnail for "${book.title}" using first page text: "${firstPageText}"`);
    } else {
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

      // Build character context from the full story
      const allTexts = book.slides
        .filter(s => s.text?.trim())
        .map((s, i) => `Page ${i + 1}: ${s.text.trim()}`)
        .join("\n");

      const currentPageNumber = book.slides.findIndex(s => s.id === slideId) + 1;

      // Fetch consistent character profile
      const characterProfile = await getCharacterProfile(allTexts, apiKey);

      const characterContext = `
BOOK TITLE: "${book.title}"
FULL STORY CONTEXT (all pages):
${allTexts}

CHARACTER PROFILE DEFINITION (MUST DRAW ALL CHARACTERS WITH THIS APPEARANCE ON EVERY PAGE):
${characterProfile || "Ensure characters look consistent."}

CHARACTER CONSISTENCY RULES (CRITICAL):
- This is page ${currentPageNumber} of ${book.slides.length} in the book "${book.title}"
- ALL characters must look EXACTLY the same across every page: identical design, colors, proportions, clothing, and style
- Maintain the same art style, color palette, and visual language as would appear throughout this book
- Do NOT redesign or change any character between pages
`.trim();

      // Build full prompt optimized for FLUX combining user's specific style and slide text
      const lowerSlideText = slideText.toLowerCase();
      const mentionsAnimals = /(dog|cat|bird|rabbit|bear|fox|animal|squirrel|mouse|lion|tiger|deer|sheep|cow|chicken|duck|monkey|pig|elephant|giraffe|horse)/.test(lowerSlideText);
      const animalNegativeDirective = mentionsAnimals ? "" : ", no animals, no dogs, no cats, no birds, no wildlife";

      fullPrompt = `A premium quality, whimsical 2D children's book illustration depicting: ${slideText}.
Style guidelines: children's book illustration, premium storybook art, soft watercolor digital painting, pastel color palette, clean hand-drawn line art, rounded cartoon design, gentle brush texture, soft gradients, warm diffused lighting, cozy wholesome aesthetic, cute kawaii style, expressive simple faces, minimal facial features, rosy cheeks, smooth organic shapes, soft shading, airy composition, high-end picture book illustration, charming, whimsical, timeless, elegant simplicity, subtle paper texture, matte finish, Adobe Fresco style, Procreate illustration, 2D, ultra clean, consistent character design.
Character appearance rules: ${characterContext}
Negative directives: no realism, no anime, no manga, no cel shading, no 3D, no photorealistic, no text, no watermark${animalNegativeDirective}.`;

      console.log(`[ReadAlong Image] Generating page ${currentPageNumber}/${book.slides.length} for "${book.title}": "${slideText.substring(0, 60)}..."`);
    }

    const fluxSize = isThumbnail ? "1024x576" : "768x1024";
    const dalleSize = isThumbnail ? "1792x1024" : "1024x1792";

    let b64: string | null = null;
    let lastError = "";
    let modelUsed = "";

    const priorities = isThumbnail
      ? ["gemini", "dalle", "flux"]
      : ["flux", "gemini", "dalle"];

    for (const step of priorities) {
      if (b64) break;

      if (step === "flux" && process.env.DEEPINFRA_API_KEY) {
        try {
          console.log(`[ReadAlong Image] Attempting image generation with DeepInfra FLUX.1 Dev...`);
          const res = await fetch(`https://api.deepinfra.com/v1/openai/images/generations`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${process.env.DEEPINFRA_API_KEY}`
            },
            body: JSON.stringify({
              model: "black-forest-labs/FLUX-1-dev",
              prompt: fullPrompt,
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
            b64 = responseData.data[0].b64_json;
            modelUsed = "FLUX.1 Dev (DeepInfra)";
            console.log(`[ReadAlong Image] Success with DeepInfra FLUX.1 Dev`);
          }
        } catch (err: any) {
          lastError = err.message;
          console.warn(`[ReadAlong Image] DeepInfra FLUX.1 Dev failed: ${err.message}`);
        }
      }

      if (step === "gemini" && apiKey) {
        const baseEndpoint = "https://generativelanguage.googleapis.com";
        for (const modelName of GEMINI_MODELS) {
          if (b64) break;
          try {
            console.log(`[ReadAlong Image] Trying Gemini model: ${modelName}`);

            let imageData: string | null = null;

            if (modelName.startsWith("imagen-")) {
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
              modelUsed = `Gemini (${modelName})`;
              console.log(`[ReadAlong Image] Success with ${modelName}`);
              break;
            }
          } catch (err: any) {
            lastError = err.message;
            console.warn(`[ReadAlong Image] Model ${modelName} failed: ${err.message}`);
          }
        }
      }

      if (step === "dalle" && process.env.OPENAI_API_KEY) {
        const baseURL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
        const models = ["gpt-image-2", "dall-e-3", "dall-e-2"];
        for (const model of models) {
          if (b64) break;
          try {
            console.log(`[ReadAlong Image] Attempting image generation with OpenAI model ${model}...`);
            let requestedSize = dalleSize;
            if (model !== "dall-e-3") {
              requestedSize = "1024x1024";
            }
            const res = await fetch(`${baseURL}/images/generations`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
              },
              body: JSON.stringify({
                model: model,
                prompt: fullPrompt,
                n: 1,
                size: requestedSize
              })
            });
            const responseData = await res.json().catch(() => ({}));
            if (!res.ok) {
              throw new Error(responseData.error?.message || `HTTP status: ${res.status}`);
            }
            const imgData = responseData.data?.[0];
            if (imgData) {
              if (imgData.b64_json) {
                b64 = imgData.b64_json;
                modelUsed = `${model} (OpenAI)`;
                break;
              } else if (imgData.url) {
                const imgRes = await fetch(imgData.url);
                if (imgRes.ok) {
                  const arrayBuffer = await imgRes.arrayBuffer();
                  b64 = Buffer.from(arrayBuffer).toString("base64");
                  modelUsed = `${model} (OpenAI)`;
                  break;
                }
              }
            }
          } catch (err: any) {
            console.warn(`[ReadAlong Image] OpenAI model ${model} failed: ${err.message}`);
            lastError = err.message;
          }
        }
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
    const namePrefix = isThumbnail ? "thumbnail" : `slide-${slideId}`;
    const fileName = `read-along-${bookId}-${namePrefix}-${Date.now()}.png`;
    const publicUrl = await uploadBufferToR2(buffer, fileName, "image/png");

    if (isThumbnail) {
      const imageName = `Book Thumbnail - AI Generated`;
      await prisma.readAlongBook.update({
        where: { id: bookId },
        data: { thumbnailUrl: publicUrl },
      });
      console.log(`[ReadAlong Thumbnail] Done: ${publicUrl} (model: ${modelUsed})`);
      return NextResponse.json({ success: true, imageUrl: publicUrl, imageName, model: modelUsed });
    }

    // Update slide in DB
    const slideIndex = book.slides.findIndex(s => s.id === slideId);
    const imageName = `Slide ${slideIndex >= 0 ? slideIndex + 1 : "Unknown"} - AI Generated`;
    await prisma.readAlongSlide.update({
      where: { id: slideId },
      data: { imageUrl: publicUrl, imageName },
    });

    console.log(`[ReadAlong Image] Done: ${publicUrl} (model: ${modelUsed})`);
    return NextResponse.json({ success: true, imageUrl: publicUrl, imageName, model: modelUsed });
  } catch (error: any) {
    console.error("[ReadAlong Image API] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
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
