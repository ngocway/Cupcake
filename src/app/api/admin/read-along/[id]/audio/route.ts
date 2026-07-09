import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { uploadBufferToR2 } from "@/actions/upload-actions";
import { GoogleGenAI } from "@google/genai";
import { translateSlideToAllLangs } from "@/lib/translate-slide";

export const maxDuration = 120;

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
    const { slideId, overwrite } = await req.json();

    if (!slideId) {
      return NextResponse.json({ error: "slideId is required" }, { status: 400 });
    }

    // Fetch the slide
    const slide = await prisma.readAlongSlide.findFirst({
      where: { id: slideId, bookId },
      include: { book: { select: { bookId: true } } },
    });

    if (!slide) {
      return NextResponse.json({ error: "Slide not found" }, { status: 404 });
    }

    // If audio already exists and not overwriting
    if (slide.audioUrl && !overwrite) {
      return NextResponse.json(
        { error: "Audio already exists. Pass overwrite:true to regenerate." },
        { status: 409 }
      );
    }

    // Skip slides with no real text (e.g. Cover/intro)
    const slideText = slide.text.replace(/\(.*?\)/g, "").trim();
    if (!slideText) {
      return NextResponse.json({ error: "Slide has no text to generate audio for." }, { status: 400 });
    }

    // Try proxy first, fall back to direct Google API if proxy is down
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

    const proxyEndpoint = process.env.GEMINI_API_ENDPOINT;
    const directEndpoint = "https://generativelanguage.googleapis.com";
    const endpointsToTry = proxyEndpoint
      ? [proxyEndpoint, directEndpoint]
      : [directEndpoint];

    let audioData: string | null = null;
    let lastAudioError = "";

    for (const endpoint of endpointsToTry) {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: { baseUrl: endpoint },
        });

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: [{ parts: [{ text: `<speak><prosody rate="75%">${slideText.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</prosody></speak>` }] }],
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: "Aoede" },
              },
            },
          } as any,
        });

        audioData = (response as any).candidates?.[0]?.content?.parts?.[0]?.inlineData?.data ?? null;
        if (audioData) {
          console.log(`[ReadAlong Audio] Success via ${endpoint === proxyEndpoint ? "proxy" : "direct API"}`);
          break;
        }
      } catch (err: any) {
        lastAudioError = err.message;
        console.warn(`[ReadAlong Audio] Endpoint ${endpoint} failed: ${err.message}`);
      }
    }

    if (!audioData) {
      throw new Error(`Gemini TTS failed: ${lastAudioError}`);
    }

    // Convert base64 to buffer and add WAV header
    const rawBuffer = Buffer.from(audioData, "base64");
    const wavBuffer = addWavHeader(rawBuffer, 24000, 1, 16);

    // Upload to R2
    const r2Path = `read-along/${slide.book.bookId}/audio/slide_${slide.slideNumber}.wav`;
    const audioUrl = await uploadBufferToR2(wavBuffer, r2Path, "audio/wav");

    // Save audioUrl to DB
    await prisma.readAlongSlide.update({
      where: { id: slideId },
      data: { audioUrl },
    });

    // Generate translations for all supported languages (non-blocking — errors won't fail audio)
    translateSlideToAllLangs(slide.text).then((translations) => {
      if (Object.keys(translations).length > 0) {
        prisma.readAlongSlide.update({
          where: { id: slideId },
          data: { translations },
        }).catch((e) => console.error("[ReadAlong] Failed to save translations:", e));
      }
    }).catch((e) => console.error("[ReadAlong] Translation error:", e));

    return NextResponse.json({ success: true, audioUrl, slideId });
  } catch (error: any) {
    console.error("[ReadAlong Audio API] Error:", error);
    return NextResponse.json({ error: error.message || "Lỗi khi tạo audio." }, { status: 500 });
  }
}

/**
 * Adds a WAV file header to raw PCM audio data from Gemini TTS.
 * Gemini returns raw 16-bit PCM at 24000 Hz, 1 channel.
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
