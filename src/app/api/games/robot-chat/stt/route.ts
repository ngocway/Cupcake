import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

/**
 * POST /api/games/robot-chat/stt
 * Accepts audio blob, returns Deepgram transcription.
 * Falls back gracefully if Deepgram unavailable.
 */
export async function POST(req: NextRequest) {
  try {
    const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
    if (!deepgramApiKey) {
      return NextResponse.json({ error: "Deepgram API key not configured" }, { status: 503 });
    }

    const contentType = req.headers.get("content-type") || "audio/webm";
    const audioBuffer = await req.arrayBuffer();

    if (!audioBuffer || audioBuffer.byteLength === 0) {
      return NextResponse.json({ error: "No audio data received" }, { status: 400 });
    }

    console.log(`[Robot Chat STT] Transcribing ${audioBuffer.byteLength} bytes, type: ${contentType}`);

    const response = await fetch(
      "https://api.deepgram.com/v1/listen?model=nova-2&language=en&smart_format=true&punctuate=true",
      {
        method: "POST",
        headers: {
          Authorization: `Token ${deepgramApiKey}`,
          "Content-Type": contentType,
        },
        body: audioBuffer,
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("[Robot Chat STT] Deepgram error:", err);
      return NextResponse.json({ error: `Deepgram STT failed: ${response.status}` }, { status: 502 });
    }

    const data = await response.json();
    const transcript = data?.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";

    console.log(`[Robot Chat STT] Transcript: "${transcript}"`);

    return NextResponse.json({ transcript });
  } catch (error: any) {
    console.error("[Robot Chat STT] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
