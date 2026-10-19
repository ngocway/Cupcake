const SAMPLE_RATE = 24000;
const BYTES_PER_SAMPLE = 2; // 16-bit mono
const WAV_HEADER_SIZE = 44;

const TTS_MODELS = [
  "gemini-2.5-flash-preview-tts",
  "gemini-3.1-flash-tts-preview",
  "gemini-2.5-pro-preview-tts",
];

function buildWavHeader(dataSize: number): Buffer {
  const h = Buffer.alloc(WAV_HEADER_SIZE);
  h.write("RIFF", 0);
  h.writeUInt32LE(36 + dataSize, 4);
  h.write("WAVE", 8);
  h.write("fmt ", 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20); // PCM
  h.writeUInt16LE(1, 22); // mono
  h.writeUInt32LE(SAMPLE_RATE, 24);
  h.writeUInt32LE(SAMPLE_RATE * BYTES_PER_SAMPLE, 28);
  h.writeUInt16LE(BYTES_PER_SAMPLE, 32);
  h.writeUInt16LE(16, 34);
  h.write("data", 36);
  h.writeUInt32LE(dataSize, 40);
  return h;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Synthesizes speech using Google Gemini TTS with voice Aoede (or custom) and rate x-slow.
 * Returns WAV buffer or null on failure.
 */
export async function synthesizeGeminiTTS(
  text: string,
  voice: string = "Aoede",
  rate: string = "x-slow"
): Promise<Buffer | null> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const clean = text?.trim();
  if (!clean) return null;

  const escaped = escapeXml(clean);
  const ssml = `<speak><prosody rate="${rate}">${escaped}</prosody></speak>`;

  for (const model of TTS_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: ssml }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
            },
          },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`[Gemini TTS] Model ${model} returned ${res.status}: ${errText.slice(0, 150)}`);
        continue;
      }

      const data = await res.json();
      const inlineData = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData;
      if (!inlineData?.data) {
        continue;
      }

      const pcmBuffer = Buffer.from(inlineData.data, "base64");
      const header = buildWavHeader(pcmBuffer.length);
      return Buffer.concat([header, pcmBuffer]);
    } catch (err: any) {
      console.warn(`[Gemini TTS] Error with model ${model}:`, err?.message || err);
    }
  }

  return null;
}
