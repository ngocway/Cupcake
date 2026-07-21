import { NextRequest, NextResponse } from "next/server";
import { generateDeepgramTTS } from "@/lib/deepgram";

export const maxDuration = 30;

/**
 * POST /api/tts/deepgram
 * Real-time Deepgram TTS synthesis — returns audio/mpeg stream.
 * 
 * Body: { text: string, model?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { text, model } = await req.json();

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "Valid text is required" }, { status: 400 });
    }

    const audioBuffer = await generateDeepgramTTS({
      text: text.trim(),
      model: model || "aura-asteria-en",
    });

    return new Response(new Uint8Array(audioBuffer), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error: any) {
    console.error("[Deepgram TTS Route Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to synthesize audio with Deepgram" },
      { status: 500 }
    );
  }
}
