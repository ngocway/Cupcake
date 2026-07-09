import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { uploadBufferToR2 } from "@/actions/upload-actions";
import { GoogleGenAI } from "@google/genai";
import { translateSlideToAllLangs } from "@/lib/translate-slide";

export const maxDuration = 300; // 5 minutes for batch generation

/**
 * POST /api/admin/read-along/[id]/audio/batch
 * Generates TTS audio for ALL slides in a book using Gemini.
 * Returns a streaming response with per-slide progress.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id: bookId } = await params;
  const { overwrite } = await req.json();

  // Use Server-Sent Events (SSE) for progress streaming
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Safe send: don't let stream write failure abort the loop
      const send = (data: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Stream closed by client — continue processing silently so DB still gets updated
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

        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: process.env.GEMINI_API_ENDPOINT
            ? { baseUrl: process.env.GEMINI_API_ENDPOINT }
            : undefined,
        });
        const total = book.slides.length;

        send({ type: "start", total, bookTitle: book.title });

        let successCount = 0;
        let skipCount = 0;

        // Helper: call Gemini TTS with retry on rate-limit (429)
        const generateWithRetry = async (text: string, maxRetries = 3): Promise<string> => {
          for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
              const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text: `<speak><prosody rate="75%">${text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</prosody></speak>` }] }],
                config: {
                  responseModalities: ["AUDIO"],
                  speechConfig: {
                    voiceConfig: {
                      prebuiltVoiceConfig: { voiceName: "Aoede" },
                    },
                  },
                } as any,
              });

              const audioData = (response as any).candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
              if (!audioData) throw new Error("No audio data returned");
              return audioData;
            } catch (err: any) {
              const isRateLimit =
                err?.status === 429 ||
                err?.message?.includes("429") ||
                err?.message?.includes("RESOURCE_EXHAUSTED") ||
                err?.message?.includes("quota");

              if (isRateLimit && attempt < maxRetries - 1) {
                const waitMs = 15000 * (attempt + 1); // 15s, 30s, 45s
                console.log(`[TTS Batch] Rate limited. Waiting ${waitMs / 1000}s before retry ${attempt + 1}...`);
                send({ type: "retry", slideId: "rate_limit", waitSeconds: waitMs / 1000, attempt: attempt + 1 });
                await new Promise((r) => setTimeout(r, waitMs));
              } else {
                throw err;
              }
            }
          }
          throw new Error("Max retries exceeded");
        };

        for (let i = 0; i < book.slides.length; i++) {
          const slide = book.slides[i];

          // Skip if already has audio and not overwriting
          if (slide.audioUrl && !overwrite) {
            send({
              type: "skip",
              slideId: slide.id,
              slideNumber: slide.slideNumber,
              current: i + 1,
              total,
              reason: "already_exists",
            });
            skipCount++;
            continue;
          }

          // Skip slides with no real text
          const slideText = slide.text.replace(/\(.*?\)/g, "").trim();
          if (!slideText) {
            send({
              type: "skip",
              slideId: slide.id,
              slideNumber: slide.slideNumber,
              current: i + 1,
              total,
              reason: "no_text",
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
            const audioData = await generateWithRetry(slideText);

            const rawBuffer = Buffer.from(audioData, "base64");
            const wavBuffer = addWavHeader(rawBuffer, 24000, 1, 16);

            const r2Path = `read-along/${book.bookId}/audio/slide_${slide.slideNumber}.wav`;
            const audioUrl = await uploadBufferToR2(wavBuffer, r2Path, "audio/wav");

            await prisma.readAlongSlide.update({
              where: { id: slide.id },
              data: { audioUrl },
            });

            // Fire-and-forget translation (non-blocking — won't delay audio generation)
            translateSlideToAllLangs(slide.text).then((translations) => {
              if (Object.keys(translations).length > 0) {
                prisma.readAlongSlide.update({
                  where: { id: slide.id },
                  data: { translations },
                }).catch((e) => console.error(`[TTS Batch] Translation save failed slide ${slide.slideNumber}:`, e));
              }
            }).catch((e) => console.error(`[TTS Batch] Translation error slide ${slide.slideNumber}:`, e));

            successCount++;
            send({
              type: "progress",
              slideId: slide.id,
              slideNumber: slide.slideNumber,
              audioUrl,
              current: i + 1,
              total,
              status: "done",
            });
          } catch (slideError: any) {
            console.error(`[TTS Batch] Slide ${slide.slideNumber} failed:`, slideError.message);
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

          // Delay between requests to respect Gemini rate limits
          if (i < book.slides.length - 1) {
            await new Promise((r) => setTimeout(r, 1500));
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

function addWavHeader(
  pcmData: Buffer,
  sampleRate: number,
  numChannels: number,
  bitsPerSample: number
): Buffer {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmData.length;
  const headerSize = 44;
  const buffer = Buffer.alloc(headerSize + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  pcmData.copy(buffer, headerSize);

  return buffer;
}
