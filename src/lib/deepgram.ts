/**
 * Deepgram TTS & STT Helper Service
 */

export interface DeepgramTtsOptions {
  text: string;
  model?: string; // e.g. "aura-asteria-en", "aura-luna-en", "aura-zeus-en"
  speed?: number;
}

/**
 * Synthesizes text to speech using Deepgram Aura TTS API.
 * Returns an MP3 Audio Buffer.
 */
export async function generateDeepgramTTS(options: DeepgramTtsOptions): Promise<Buffer> {
  const { text, model = "aura-asteria-en", speed } = options;
  const apiKey = process.env.DEEPGRAM_API_KEY;

  if (!apiKey) {
    throw new Error("DEEPGRAM_API_KEY is not configured in environment variables.");
  }

  const trimmedText = text.trim();

  let url = `https://api.deepgram.com/v1/speak?model=${encodeURIComponent(model)}`;
  // Only Aura-2 models support the speed query parameter. Aura-1 models (e.g. aura-luna-en) return 400 error if speed is passed.
  if (speed !== undefined && speed !== null && model.includes("aura-2")) {
    url += `&speed=${speed}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Token ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: trimmedText }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Deepgram TTS API failed (${response.status}): ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
