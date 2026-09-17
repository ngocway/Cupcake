import prisma from "@/lib/prisma";
import { uploadBufferToR2 } from "@/actions/upload-actions";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

/**
 * Synthesizes audio for a single word/phrase on the server side:
 * 1. ElevenLabs (Alice, high stability, child-friendly)
 * 2. Fallback to MsEdgeTTS (en-US-AnaNeural, fast, free)
 */
async function synthesizeWordAudio(word: string): Promise<Buffer | null> {
  const cleanText = word.trim();
  if (!cleanText) return null;

  // Prepend silence padding ("... ") so hardware audio output has time to initialize
  const speechText = cleanText.startsWith("...") ? cleanText : `... ${cleanText}`;

  // 1. Try ElevenLabs if configured
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
          text: speechText,
          model_id: process.env.ELEVENLABS_MODEL_ID || "eleven_flash_v2",
          voice_settings: {
            stability: 0.80,
            similarity_boost: 0.75,
            use_speaker_boost: true,
            speed: 0.7,
          },
        }),
      });

      if (res.ok) {
        return Buffer.from(await res.arrayBuffer());
      }
    } catch {
      // Fallback
    }
  }

  // 2. Fallback to MsEdgeTTS (AnaNeural child voice)
  try {
    const tts = new MsEdgeTTS();
    await tts.setMetadata("en-US-AnaNeural", OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream(speechText);
    const chunks: Buffer[] = [];
    for await (const chunk of audioStream) {
      chunks.push(chunk as Buffer);
    }
    tts.close();
    return Buffer.concat(chunks);
  } catch (err) {
    console.error(`[Server TTS] Synthesis failed for "${word}":`, err);
    return null;
  }
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
