import { NextRequest } from "next/server";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

export const maxDuration = 30;

// Child-friendly voice for storybook reading
const VOICE = "en-US-AnaNeural"; // Microsoft's child voice

/**
 * POST /api/tts/edge
 * Real-time Edge TTS synthesis — returns audio/mp3 stream.
 * Used as fallback when a slide has no pre-generated audio.
 * No auth required (student-facing).
 */
export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "text is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const cleanText = text.trim();
    if (!cleanText) {
      return new Response(JSON.stringify({ error: "text is empty" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const tts = new MsEdgeTTS();
    await tts.setMetadata(VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

    const { audioStream } = tts.toStream(cleanText);

    // Collect audio chunks then send as one response
    const chunks: Buffer[] = [];

    await new Promise<void>((resolve, reject) => {
      audioStream.on("data", (chunk: Buffer) => chunks.push(chunk));
      audioStream.on("end", resolve);
      audioStream.on("error", reject);
    });

    tts.close();

    const audioBuffer = Buffer.concat(chunks);

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.length.toString(),
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("[Edge TTS] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
