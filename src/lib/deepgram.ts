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

  let url = `https://api.deepgram.com/v1/speak?model=${encodeURIComponent(model)}`;
  if (speed !== undefined && speed !== null) {
    url += `&speed=${speed}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Token ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Deepgram TTS API failed (${response.status}): ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
