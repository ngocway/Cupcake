import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { uploadBufferToR2 } from "@/actions/upload-actions";
import { synthesizeGeminiTTS } from "@/lib/gemini-tts";

export const EDGE_CHILD_VOICE = "en-US-AnaNeural";
export const EDGE_CHILD_RATE = "-15%";

/**
 * Synthesizes text prioritizing Google Gemini TTS (Voice: Aoede, Rate: x-slow)
 * and falls back to Microsoft Edge TTS.
 * Returns Buffer of audio or null on failure.
 */
export async function synthesizeEdgeChildAudio(
  text: string,
  rate: string = EDGE_CHILD_RATE
): Promise<Buffer | null> {
  const clean = text?.trim();
  if (!clean) return null;

  // 1. Primary: Google Gemini TTS Aoede (x-slow)
  try {
    const geminiBuf = await synthesizeGeminiTTS(clean, "Aoede", "x-slow");
    if (geminiBuf && geminiBuf.length > 0) {
      return geminiBuf;
    }
  } catch (err: any) {
    console.warn(`[Edge Child TTS] Gemini Aoede failed for "${clean.substring(0, 30)}", falling back to Edge:`, err?.message || err);
  }

  // 2. Fallback: MsEdgeTTS
  try {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(EDGE_CHILD_VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream(clean, { rate });

    const chunks: Buffer[] = [];
    for await (const chunk of audioStream) {
      chunks.push(chunk as Buffer);
    }
    tts.close();

    const buffer = Buffer.concat(chunks);
    if (buffer && buffer.length > 0) {
      return buffer;
    }
    return null;
  } catch (err: any) {
    console.error(`[Edge Child TTS] Failed to synthesize "${clean.substring(0, 40)}":`, err?.message || err);
    return null;
  }
}

/**
 * Synthesizes text with Edge Child voice and uploads directly to Cloudflare R2.
 * Returns public CDN URL or null.
 */
export async function generateAndUploadEdgeChildAudio(
  text: string,
  prefix: string,
  wordSlug: string,
  rate: string = EDGE_CHILD_RATE
): Promise<string | null> {
  const buf = await synthesizeEdgeChildAudio(text, rate);
  if (!buf) return null;

  try {
    const safeSlug = wordSlug.replace(/[^a-zA-Z0-9_-]/g, "_") || "audio";
    const fileName = `edge-${prefix}-${safeSlug}-${Date.now()}.mp3`;
    const publicUrl = await uploadBufferToR2(buf, fileName, "audio/mpeg");
    return publicUrl;
  } catch (uploadErr: any) {
    console.error(`[Edge Child TTS] Failed to upload audio for "${wordSlug}":`, uploadErr?.message || uploadErr);
    return null;
  }
}

export interface EdgeFlashcardAudioResult {
  audioUrl: string | null;         // Full reading: "word. word. example sentence. word."
  audioWordUrl: string | null;     // Isolated word: "word"
  audioSentenceUrl: string | null; // Isolated sentence: "example sentence"
  quizAudioUrl: string | null;     // Isolated quiz: "quiz question"
}

/**
 * Generates all 4 flashcard audio components independently via Edge Child TTS:
 * - audioWordUrl: clean isolated word
 * - audioSentenceUrl: clean isolated example sentence
 * - quizAudioUrl: clean isolated quiz question
 * - audioUrl: full recitation sequence (word + word + sentence + word)
 */
export async function generateAllEdgeFlashcardAudio(
  word: string,
  exampleSentence?: string | null,
  quizQuestion?: string | null
): Promise<EdgeFlashcardAudioResult> {
  const cleanWord = word.trim();
  const slug = cleanWord.toLowerCase().replace(/\s+/g, "-");

  // 1. Isolated word audio
  const wordP = generateAndUploadEdgeChildAudio(cleanWord, "word", slug);

  // 2. Isolated sentence audio
  const sentenceP = exampleSentence?.trim()
    ? generateAndUploadEdgeChildAudio(exampleSentence.trim(), "sentence", slug)
    : Promise.resolve(null);

  // 3. Isolated quiz audio
  const quizP = quizQuestion?.trim()
    ? generateAndUploadEdgeChildAudio(quizQuestion.trim(), "quiz", slug)
    : Promise.resolve(null);

  // 4. Full recitation sequence
  const fullText = exampleSentence?.trim()
    ? `${cleanWord}. ${cleanWord}. ${exampleSentence.trim()}. ${cleanWord}.`
    : `${cleanWord}. ${cleanWord}. ${cleanWord}.`;
  const fullP = generateAndUploadEdgeChildAudio(fullText, "full", slug);

  const [audioWordUrl, audioSentenceUrl, quizAudioUrl, audioUrl] = await Promise.all([
    wordP,
    sentenceP,
    quizP,
    fullP,
  ]);

  return {
    audioUrl,
    audioWordUrl,
    audioSentenceUrl,
    quizAudioUrl,
  };
}
