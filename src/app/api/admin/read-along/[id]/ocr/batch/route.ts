import { NextRequest } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export const maxDuration = 300;

/**
 * POST /api/admin/read-along/[id]/ocr/batch
 * Runs Gemini Vision OCR on ALL slides that have images.
 * Streams per-slide progress via SSE.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });
  }

  const { id: bookId } = await params;
  const { overwrite } = await req.json();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // stream closed by client
        }
      };

      try {
        const book = await prisma.readAlongBook.findUnique({
          where: { id: bookId },
          include: { slides: { orderBy: { orderIndex: "asc" } } },
        });

        if (!book) {
          send({ type: "error", message: "Book not found" });
          controller.close();
          return;
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          send({ type: "error", message: "GEMINI_API_KEY is not set" });
          controller.close();
          return;
        }

        const slidesWithImages = book.slides.filter(s => s.imageUrl);
        const total = slidesWithImages.length;

        if (total === 0) {
          send({ type: "error", message: "Kh\u00f4ng c\u00f3 slide n\u00e0o c\u00f3 \u1ea3nh." });
          controller.close();
          return;
        }

        send({ type: "start", total });

        let successCount = 0;
        let skipCount = 0;

        // Gemini OCR with retry on 429 rate-limit
        const ocrWithRetry = async (imageUrl: string, maxRetries = 4): Promise<string> => {
          // Fetch image
          const imageRes = await fetch(imageUrl);
          if (!imageRes.ok) throw new Error(`Cannot fetch image: ${imageRes.status}`);
          const imageBuffer = await imageRes.arrayBuffer();
          const base64 = Buffer.from(imageBuffer).toString("base64");
          const mimeType = imageRes.headers.get("content-type") || "image/jpeg";

          for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
              const geminiRes = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    contents: [{
                      parts: [
                        { inlineData: { mimeType, data: base64 } },
                        { text: "This is a page from a children's storybook. Extract ALL visible text from this image exactly as it appears. Return ONLY the text content, with no explanations, labels, or commentary. If there is no text, return an empty string." },
                      ],
                    }],
                    generationConfig: { temperature: 0, maxOutputTokens: 512 },
                  }),
                }
              );

              if (geminiRes.status === 429) {
                const waitMs = Math.min(2000 * Math.pow(2, attempt), 30000);
                console.log(`[OCR Batch] Rate limited. Waiting ${waitMs / 1000}s (attempt ${attempt + 1})...`);
                send({ type: "retry", waitSeconds: waitMs / 1000, attempt: attempt + 1 });
                await new Promise(r => setTimeout(r, waitMs));
                continue;
              }

              if (!geminiRes.ok) {
                const errData = await geminiRes.json().catch(() => ({}));
                throw new Error(errData?.error?.message || `Gemini error: ${geminiRes.status}`);
              }

              const geminiData = await geminiRes.json();
              return geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
            } catch (err: any) {
              if (attempt < maxRetries - 1 && !err.message?.includes("Gemini error")) {
                const waitMs = 2000 * (attempt + 1);
                await new Promise(r => setTimeout(r, waitMs));
              } else {
                throw err;
              }
            }
          }
          throw new Error("Max retries exceeded");
        };

        for (let i = 0; i < slidesWithImages.length; i++) {
          const slide = slidesWithImages[i];

          // Skip if already has text and not overwriting
          if (slide.text?.trim() && !overwrite) {
            send({
              type: "skip",
              slideId: slide.id,
              slideNumber: slide.slideNumber,
              current: i + 1,
              total,
              reason: "already_has_text",
            });
            skipCount++;
            continue;
          }

          send({
            type: "progress",
            slideId: slide.id,
            slideNumber: slide.slideNumber,
            current: i + 1,
            total,
            status: "generating",
          });

          try {
            const extractedText = await ocrWithRetry(slide.imageUrl!);

            await prisma.readAlongSlide.update({
              where: { id: slide.id },
              data: { text: extractedText },
            });

            successCount++;
            send({
              type: "progress",
              slideId: slide.id,
              slideNumber: slide.slideNumber,
              text: extractedText,
              current: i + 1,
              total,
              status: "done",
            });
          } catch (slideError: any) {
            console.error(`[OCR Batch] Slide ${slide.slideNumber} failed:`, slideError.message);
            send({
              type: "progress",
              slideId: slide.id,
              slideNumber: slide.slideNumber,
              current: i + 1,
              total,
              status: "error",
              error: slideError.message,
            });
          }

          // Delay between slides to respect Gemini rate limits
          if (i < slidesWithImages.length - 1) {
            await new Promise(r => setTimeout(r, 2000));
          }
        }

        send({ type: "complete", successCount, skipCount, total });
        controller.close();
      } catch (err: any) {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "error", message: err.message })}\n\n`)
          );
          controller.close();
        } catch {}
      }
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