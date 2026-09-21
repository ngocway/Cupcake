import { NextRequest } from "next/server";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

export const maxDuration = 30;

// Child-friendly voice for storybook reading
const VOICE = "en-US-AnaNeural"; // Microsoft's child voice

/**
 * POST /api/tts/edge
 * Real-time TTS synthesis — returns audio/mp3 stream.
 * Priority: Deepgram → ElevenLabs → MsEdgeTTS (fallback)
 * No auth required (student-facing).
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get("text");
    const voice = searchParams.get("voice") || undefined;
    const forceEdge = searchParams.get("forceEdge") === "true";

    return await handleTTSRequest({ text, voice, forceEdge });
  } catch (error: any) {
    console.error("[Edge TTS GET] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    return await handleTTSRequest(body);
  } catch (error: any) {
    console.error("[Edge TTS POST] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function handleTTSRequest({ text, voice, forceEdge }: { text?: string | null; voice?: string; forceEdge?: boolean }) {
  try {
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

    const targetVoice = voice || VOICE;

    // 1. Primary: MsEdgeTTS (Child-friendly en-US-AnaNeural, clean audio, no padding)
    try {
      console.log(`[Edge TTS Route -> MsEdgeTTS] Synthesizing with voice=${targetVoice}: "${cleanText.substring(0, 30)}..."`);
      const tts = new MsEdgeTTS();
      await tts.setMetadata(targetVoice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

      const { audioStream } = tts.toStream(cleanText);

      const chunks: Buffer[] = [];
      for await (const chunk of audioStream) {
        chunks.push(chunk as Buffer);
      }
      tts.close();

      const audioBuffer = Buffer.concat(chunks);
      if (audioBuffer && audioBuffer.length > 0) {
        return new Response(audioBuffer, {
          status: 200,
          headers: {
            "Content-Type": "audio/mpeg",
            "Content-Length": audioBuffer.length.toString(),
            "Cache-Control": "no-store",
            "X-TTS-Provider": "msedge",
          },
        });
      }
    } catch (err: any) {
      console.warn(`[Edge TTS Route] MsEdgeTTS synthesis failed, falling back to Deepgram:`, err.message || err);
    }

    // 2. Secondary Fallback: Deepgram (Aura-2, ultra fast ~300ms, natural)
    const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
    if (deepgramApiKey) {
      try {
        const model = process.env.DEEPGRAM_TTS_MODEL || "aura-2-thalia-en";
        const speed = process.env.DEEPGRAM_TTS_SPEED || "0.8";
        console.log(`[Edge TTS Route -> Deepgram Fallback] Synthesizing with model=${model} speed=${speed}: "${cleanText.substring(0, 30)}..."`);

        const response = await fetch(`https://api.deepgram.com/v1/speak?model=${encodeURIComponent(model)}&speed=${speed}`, {
          method: "POST",
          headers: {
            "Authorization": `Token ${deepgramApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: cleanText }),
        });

        if (response.ok) {
          const audioBuffer = Buffer.from(await response.arrayBuffer());
          return new Response(audioBuffer, {
            status: 200,
            headers: {
              "Content-Type": "audio/mpeg",
              "Content-Length": audioBuffer.length.toString(),
              "Cache-Control": "no-store",
              "X-TTS-Provider": "deepgram",
            },
          });
        } else {
          const errorText = await response.text();
          console.warn(`[Edge TTS Route] Deepgram API failed (${response.status}), falling back to ElevenLabs:`, errorText);
        }
      } catch (err: any) {
        console.warn(`[Edge TTS Route] Deepgram synthesis failed, falling back to ElevenLabs:`, err.message);
      }
    }

    // 3. Final Fallback: ElevenLabs (Alice, high stability)
    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    if (elevenLabsApiKey) {
      try {
        const voiceId = process.env.ELEVENLABS_VOICE_ID || "Xb7hH8MSUJpSbSDYk0k2"; // Alice
        const stability = parseFloat(process.env.ELEVENLABS_STABILITY || "0.80");
        const speed = parseFloat(process.env.ELEVENLABS_SPEED || "0.75");
        const useSpeakerBoost = process.env.ELEVENLABS_USE_SPEAKER_BOOST !== "false";
        const modelId = process.env.ELEVENLABS_MODEL_ID || "eleven_flash_v2";

        console.log(`[Edge TTS Route -> ElevenLabs Fallback] Synthesizing: "${cleanText.substring(0, 30)}..."`);

        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: "POST",
          headers: {
            "xi-api-key": elevenLabsApiKey,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            text: cleanText,
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
              "X-TTS-Provider": "elevenlabs",
            },
          });
        } else {
          const errorText = await response.text();
          console.error(`[Edge TTS Route] ElevenLabs API failed (${response.status}):`, errorText);
        }
      } catch (err: any) {
        console.error(`[Edge TTS Route] ElevenLabs synthesis failed:`, err.message);
      }
    }

    throw new Error("All TTS providers (MsEdgeTTS, Deepgram, ElevenLabs) failed");
  } catch (error: any) {
    console.error("[Edge TTS] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

