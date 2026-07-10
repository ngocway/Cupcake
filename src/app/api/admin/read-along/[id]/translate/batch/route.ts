import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { translateSlideToAllLangs } from "@/lib/translate-slide";

export const maxDuration = 300; // 5 minutes for batch translation

/**
 * POST /api/admin/read-along/[id]/translate/batch
 * Translates text for ALL slides in a book to all supported native languages.
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

        const total = book.slides.length;
        send({ type: "start", total, bookTitle: book.title });

        let successCount = 0;
        let skipCount = 0;

        for (let i = 0; i < book.slides.length; i++) {
          const slide = book.slides[i];

          // Skip if already has translations and not overwriting
          const hasTranslations = slide.translations && Object.keys(slide.translations as object).length > 0;
          if (hasTranslations && !overwrite) {
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
            const translations = await translateSlideToAllLangs(slide.text);
            if (Object.keys(translations).length > 0) {
              await prisma.readAlongSlide.update({
                where: { id: slide.id },
                data: { translations: translations as any },
              });
              successCount++;
              send({
                type: "progress",
                slideId: slide.id,
                slideNumber: slide.slideNumber,
                current: i + 1,
                total,
                status: "done",
              });
            } else {
              throw new Error("Dịch trả về kết quả rỗng (kiểm tra API Key)");
            }
          } catch (slideError: any) {
            console.error(`[Translation Batch] Slide ${slide.slideNumber} failed:`, slideError.message);
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

          // Delay between requests to respect Google Translate API limits
          if (i < book.slides.length - 1) {
            await new Promise((r) => setTimeout(r, 500));
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
