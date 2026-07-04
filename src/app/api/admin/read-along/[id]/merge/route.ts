import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { uploadBufferToR2 } from "@/actions/upload-actions";

export const maxDuration = 60;

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
    const { slideAId, slideBId } = await req.json();

    if (!slideAId || !slideBId) {
      return NextResponse.json(
        { error: "slideAId and slideBId are required" },
        { status: 400 }
      );
    }

    // Fetch both slides with book info
    const [slideA, slideB] = await Promise.all([
      prisma.readAlongSlide.findFirst({
        where: { id: slideAId, bookId },
        include: { book: { select: { bookId: true } } },
      }),
      prisma.readAlongSlide.findFirst({
        where: { id: slideBId, bookId },
      }),
    ]);

    if (!slideA || !slideB) {
      return NextResponse.json({ error: "Slide not found" }, { status: 404 });
    }

    // Verify adjacency
    if (slideB.orderIndex !== slideA.orderIndex + 1) {
      return NextResponse.json(
        { error: "Slides must be adjacent (slideB must come right after slideA)" },
        { status: 400 }
      );
    }

    // ── Merge text ────────────────────────────────────────────
    const mergedText = [slideA.text, slideB.text]
      .map((t) => t?.trim())
      .filter(Boolean)
      .join(" ");

    // ── Merge audio ───────────────────────────────────────────
    let mergedAudioUrl: string | null = null;

    if (slideA.audioUrl && slideB.audioUrl) {
      // Both have audio – concatenate the raw PCM data
      const [pcmA, pcmB] = await Promise.all([
        fetchWavPcm(slideA.audioUrl),
        fetchWavPcm(slideB.audioUrl),
      ]);
      const mergedPcm = Buffer.concat([pcmA, pcmB]);
      const wavBuffer = addWavHeader(mergedPcm, 24000, 1, 16);

      const r2Path = `read-along/${slideA.book.bookId}/audio/slide_${slideA.slideNumber}.wav`;
      mergedAudioUrl = await uploadBufferToR2(wavBuffer, r2Path, "audio/wav");
    } else if (slideA.audioUrl && !slideB.audioUrl) {
      // Only A has audio – keep it
      mergedAudioUrl = slideA.audioUrl;
    } else if (!slideA.audioUrl && slideB.audioUrl) {
      // Only B has audio – promote it to A
      mergedAudioUrl = slideB.audioUrl;
    }
    // If neither has audio: mergedAudioUrl stays null

    // ── Database transaction ──────────────────────────────────
    // Optimisation: only slides STRICTLY AFTER slideB need renumbering.
    // Slides before slideA (or slideA itself) keep their orderIndex/slideNumber.
    // Processing after-B slides in ascending orderIndex order is safe (single phase):
    //   each target slot was just freed by the delete/previous update in the chain.
    const allSlides = await prisma.readAlongSlide.findMany({
      where: { bookId },
      orderBy: { orderIndex: "asc" },
    });

    // Only slides that come after slideB in the sequence
    const slidesAfterB = allSlides.filter((s) => s.orderIndex > slideB.orderIndex);

    await prisma.$transaction([
      // 1. Update slideA – merge content, clear image
      prisma.readAlongSlide.update({
        where: { id: slideAId },
        data: { text: mergedText, audioUrl: mergedAudioUrl, imageUrl: null, imageName: null },
      }),

      // 2. Delete slideB – frees its slideNumber slot
      prisma.readAlongSlide.delete({ where: { id: slideBId } }),

      // 3. Phase 1 – temp unique names for slides after B only (slide.id is always unique)
      //    Needed because sequential decrement causes collisions with immediate constraints
      ...slidesAfterB.map((slide) =>
        prisma.readAlongSlide.update({
          where: { id: slide.id },
          data: { slideNumber: slide.id },
        })
      ),

      // 4. Phase 2 – final sequential slideNumbers for slides after B only
      ...slidesAfterB.map((slide, i) =>
        prisma.readAlongSlide.update({
          where: { id: slide.id },
          data: {
            orderIndex: slideB.orderIndex + i,
            slideNumber: String(slideB.orderIndex + i + 1).padStart(2, "0"),
          },
        })
      ),

    ]);


    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[ReadAlong Merge API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Lỗi khi gộp trang." },
      { status: 500 }
    );
  }
}

/** Strip the 44-byte WAV header and return raw PCM data. */
async function fetchWavPcm(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch audio: HTTP ${res.status} from ${url}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  const buf = Buffer.from(arrayBuffer);
  // Standard WAV header is 44 bytes; skip to raw PCM
  return buf.length > 44 ? buf.slice(44) : buf;
}

/**
 * Adds a WAV file header to raw PCM audio data.
 * Gemini TTS returns raw 16-bit PCM at 24000 Hz, 1 channel.
 */
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

  // RIFF chunk
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);

  // fmt sub-chunk
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); // PCM chunk size
  buffer.writeUInt16LE(1, 20);  // Audio format: PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  // data sub-chunk
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  pcmData.copy(buffer, headerSize);

  return buffer;
}
