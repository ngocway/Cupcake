import prisma from "@/lib/prisma";
import { uploadBufferToR2 } from "@/actions/upload-actions";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

/**
 * Synthesizes audio for a single word/phrase on the server side:
 * 1. MsEdgeTTS (en-US-AnaNeural, child voice, clean, zero hiss)
 * 2. Deepgram (Aura-2, ultra fast ~300ms, natural fallback)
 * 3. ElevenLabs (Alice, final emergency fallback)
 */
export async function synthesizeWordAudio(word: string): Promise<Buffer | null> {
  const cleanText = word.trim();
  if (!cleanText) return null;

  // 1. Primary: MsEdgeTTS (Child-friendly en-US-AnaNeural, clean audio, no ellipsis padding)
  try {
    const tts = new MsEdgeTTS();
    await tts.setMetadata("en-US-AnaNeural", OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream(cleanText);
    const chunks: Buffer[] = [];
    for await (const chunk of audioStream) {
      chunks.push(chunk as Buffer);
    }
    tts.close();
    const buffer = Buffer.concat(chunks);
    if (buffer && buffer.length > 0) {
      return buffer;
    }
  } catch (edgeErr: any) {
    console.warn(`[Server TTS] MsEdgeTTS failed for "${cleanText}", falling back to Deepgram:`, edgeErr.message || edgeErr);
  }

  // 2. Secondary Fallback: Deepgram if configured
  const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
  if (deepgramApiKey) {
    try {
      const model = process.env.DEEPGRAM_TTS_MODEL || "aura-2-thalia-en";
      const speed = process.env.DEEPGRAM_TTS_SPEED || "0.8";
      const response = await fetch(`https://api.deepgram.com/v1/speak?model=${encodeURIComponent(model)}&speed=${speed}`, {
        method: "POST",
        headers: {
          "Authorization": `Token ${deepgramApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: cleanText }),
      });

      if (response.ok) {
        return Buffer.from(await response.arrayBuffer());
      }
    } catch (dgErr: any) {
      console.warn(`[Server TTS] Deepgram failed for "${cleanText}", falling back to ElevenLabs:`, dgErr.message || dgErr);
    }
  }

  // 3. Final Emergency Fallback: ElevenLabs if configured
  const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
  if (elevenLabsApiKey) {
    try {
      const voiceId = process.env.ELEVENLABS_VOICE_ID || "Xb7hH8MSUJpSbSDYk0k2"; // Alice
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
          "xi-api-key": elevenLabsApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: cleanText,
          model_id: process.env.ELEVENLABS_MODEL_ID || "eleven_flash_v2",
          voice_settings: {
            stability: 0.80,
            similarity_boost: 0.75,
            use_speaker_boost: true,
            speed: 0.75,
          },
        }),
      });

      if (res.ok) {
        return Buffer.from(await res.arrayBuffer());
      }
    } catch (elevenErr: any) {
      console.error(`[Server TTS] ElevenLabs fallback failed for "${cleanText}":`, elevenErr.message || elevenErr);
    }
  }

  console.error(`[Server TTS] All TTS providers failed for "${cleanText}"`);
  return null;
}

/**
 * Runs asynchronously in the background:
 * Generates audio for any items in the topic that have no audioUrl yet.
 * Saves the audio to Cloudflare R2 and updates the database records.
 */
export async function processTopicAudioInBackground(topicId: string) {
  try {
    const items = await prisma.matchWordItem.findMany({
      where: {
        topicId,
        audioUrl: null,
        word: { not: "" },
      },
    });

    if (!items || items.length === 0) return;

    for (const item of items) {
      try {
        const audioBuffer = await synthesizeWordAudio(item.word);
        if (audioBuffer && audioBuffer.length > 0) {
          const fileName = `tts-${item.id}-${Date.now()}.mp3`;
          const audioUrl = await uploadBufferToR2(audioBuffer, fileName, "audio/mpeg");
          await prisma.matchWordItem.update({
            where: { id: item.id },
            data: { audioUrl },
          });
        }
      } catch (itemErr) {
        console.warn(`[Background TTS] Error processing item ${item.id} ("${item.word}"):`, itemErr);
      }
    }
  } catch (err) {
    console.error(`[Background TTS] Error for topic ${topicId}:`, err);
  }
}
