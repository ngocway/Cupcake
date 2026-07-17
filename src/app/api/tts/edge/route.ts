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

    // 1. Try ElevenLabs TTS if API key is configured (Primary)
    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    if (elevenLabsApiKey) {
      try {
        const voiceId = process.env.ELEVENLABS_VOICE_ID || "Xb7hH8MSUJpSbSDYk0k2"; // Alice
        const stability = parseFloat(process.env.ELEVENLABS_STABILITY || "0.80");
        const speed = parseFloat(process.env.ELEVENLABS_SPEED || "0.7");
        const useSpeakerBoost = process.env.ELEVENLABS_USE_SPEAKER_BOOST !== "false";

        const speechText = cleanText;
        const modelId = process.env.ELEVENLABS_MODEL_ID || "eleven_flash_v2";

        console.log(`[Edge TTS Route -> ElevenLabs] Synthesizing: "${cleanText.substring(0, 30)}..."`);

        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: "POST",
          headers: {
            "xi-api-key": elevenLabsApiKey,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            text: speechText,
            model_id: modelId,
            voice_settings: {
              stability,
              similarity_boost: 0.75,
              use_speaker_boost: useSpeakerBoost,
              speed
            }
          })
        });

        if (response.ok) {
          const audioBuffer = Buffer.from(await response.arrayBuffer());
          return new Response(audioBuffer, {
            status: 200,
            headers: {
              "Content-Type": "audio/mpeg",
              "Content-Length": audioBuffer.length.toString(),
              "Cache-Control": "no-store",
            },
          });
        } else {
          const errorText = await response.text();
          console.warn(`[Edge TTS Route] ElevenLabs API failed, falling back to MsEdgeTTS:`, errorText);
        }
      } catch (err: any) {
        console.warn(`[Edge TTS Route] ElevenLabs synthesis failed, falling back to MsEdgeTTS:`, err.message);
      }
    }

    // 2. Fallback to MsEdgeTTS
    console.log(`[Edge TTS Route -> MsEdgeTTS Fallback] Synthesizing: "${cleanText.substring(0, 30)}..."`);
    const tts = new MsEdgeTTS();
    await tts.setMetadata(VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

    const { audioStream } = tts.toStream(cleanText);

    // Collect audio chunks then send as one response
    const chunks: Buffer[] = [];
    for await (const chunk of audioStream) {
      chunks.push(chunk as Buffer);
    }

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
