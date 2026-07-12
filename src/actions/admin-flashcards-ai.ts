"use server"

import openai from "@/lib/openai";
import { searchImagesAction } from "@/actions/image-search-actions";
import { uploadUrlMedia, uploadBufferToR2 } from "@/actions/upload-actions";
import { adminCreateFlashcard } from "@/actions/admin-flashcards";
import { generateTTSHelper } from "@/actions/lesson-ai";
import { auth } from "@/auth";

// Gemini API routing: use 9Router proxy (Bearer auth) when GEMINI_API_ENDPOINT is set,
// otherwise call googleapis.com directly with ?key= query param.
const IS_PROXY = !!process.env.GEMINI_API_ENDPOINT;
const GEMINI_BASE = (process.env.GEMINI_API_ENDPOINT ?? "https://generativelanguage.googleapis.com").replace(/\/$/, "");

const geminiUrl = (model: string) => IS_PROXY
  ? `${GEMINI_BASE}/v1beta/models/${model}:generateContent`
  : `${GEMINI_BASE}/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

const geminiHeaders = (): Record<string, string> => IS_PROXY
  ? { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.GEMINI_API_KEY}` }
  : { "Content-Type": "application/json" };

function getAgeGroupGuidelines(categoryName: string) {
  const cat = categoryName.toLowerCase();
  
  if (cat.includes("kindergarten") || cat.includes("< 6") || cat.includes("under 6")) {
    return {
      vocabulary: "Extremely simple, basic, concrete nouns or visual concepts (e.g., 'apple', 'cat', 'sun', 'ball'). Avoid abstract, complex, or multi-syllable words.",
      definition: "An extremely simple, child-friendly English definition using basic words suitable for children under 6 years old (e.g., 'a sweet red fruit' for apple).",
      example: "An extremely short and simple English sentence (Pre-A1 level, 3-6 words, e.g., 'The apple is red.', 'I see a cute dog.'). Use only basic words.",
      quiz: "A very short, extremely simple quiz question in English (maximum 5-7 words) that a toddler can easily answer by looking at the picture of the card's word (e.g., 'Who says moo?' for cow, 'What keeps food cold?' for fridge)."
    };
  } else if (cat.includes("kid")) {
    return {
      vocabulary: "Simple, everyday vocabulary words that elementary school students (6-10 years old) encounter (e.g., 'kitchen', 'pencil', 'towel', 'giraffe'). Avoid overly formal or complex academic words.",
      definition: "A simple, clear English definition (A1-A2 level) using easy-to-understand language.",
      example: "A simple English sentence (A1 level, e.g., 'This is a clean towel.', 'The giraffe has a long neck.'). Keep it clear and direct.",
      quiz: "A simple English question (CEFR A1 level) about the word's description or function (e.g., 'What keeps our food cold?' for fridge)."
    };
  } else if (cat.includes("teen")) {
    return {
      vocabulary: "General intermediate vocabulary words suitable for middle/high school students (11-16 years old) (e.g., 'tamarind', 'adventure', 'celebrate', 'solution').",
      definition: "A clear English definition at CEFR A2-B1 level.",
      example: "A natural, slightly longer English sentence (A2-B1 level, e.g., 'I gave some sour tamarind to my mother after school.'). Feel free to use compound sentences.",
      quiz: "A natural English question (CEFR A2-B1 level) asking about the meaning or usage of the word."
    };
  } else {
    // Default to Learner / Adult
    return {
      vocabulary: "Intermediate to advanced English vocabulary suitable for adults or advanced learners (16+ years old) (e.g., 'dilemma', 'consequence', 'nostalgic', 'persistent').",
      definition: "A clear, precise English definition at CEFR B1-B2 level.",
      example: "A natural, high-quality English sentence (B1-B2 level, e.g., 'He faced a difficult dilemma when choosing between two career paths.'). Use compound or complex structures where appropriate.",
      quiz: "A clear English question (CEFR B1-B2 level) about the word's definition or usage, suitable for language learners (e.g. 'What do we use to write?' for pencil)."
    };
  }
}

export async function generateFlashcardVocabularyList(categoryName: string, topicName: string, count: number) {
  if (!process.env.OPENAI_API_KEY) {
    return { success: false, error: "Missing OPENAI_API_KEY. Please set it in .env file." };
  }

  if (count <= 0) return { success: true, vocabularies: [] };

  try {
    const guidelines = getAgeGroupGuidelines(categoryName);
    const prompt = `Generate a list of exactly ${count} English vocabulary words that are highly relevant to the topic "${topicName}" and appropriate for the age group "${categoryName}". 

    CRITICAL AGE-APPROPRIATE RULES for "${categoryName}":
    1. Vocabulary: Select words that match this guideline: ${guidelines.vocabulary}
    2. Definition: Define the words matching this guideline: ${guidelines.definition}
    3. Example Sentence: Create sentences matching this guideline: ${guidelines.example}
    4. Quiz Question: Create a quiz question matching this guideline: ${guidelines.quiz}

    For each word, provide:
    - "word": The English word
    - "phonetic": Its phonetic transcription
    - "definition": An English definition matching the rules above.
    - "definitionVi": A SHORT, direct Vietnamese translation (1-3 words max, e.g. "Quả chuối", NOT a definition).
    - "definitionTh": A SHORT, direct Thai translation (1-3 words max).
    - "definitionId": A SHORT, direct Indonesian translation (1-3 words max).
    - "definitionZh": A SHORT, direct Mandarin Chinese translation (1-3 words/characters max).
    - "definitionHi": A SHORT, direct Hindi translation (1-3 words max).
    - "definitionJa": A SHORT, direct Japanese translation (1-3 words/characters max).
    - "definitionEs": A SHORT, direct Spanish translation (1-3 words max).
    - "definitionAr": A SHORT, direct Arabic translation (1-3 words max).
    - "definitionFr": A SHORT, direct French translation (1-3 words max).
    - "definitionKo": A SHORT, direct Korean translation (1-3 words/characters max).
    - "definitionPt": A SHORT, direct Portuguese translation (1-3 words max).
    - "definitionRu": A SHORT, direct Russian translation (1-3 words max).
    - "definitionDe": A SHORT, direct German translation (1-3 words max).
    - "exampleSentence": A simple English example sentence matching the rules above.
    - "quizQuestion": A simple English quiz question matching the rules above.
    - "imageSearchKeyword": A very descriptive English search keyword for finding a representative image on Google Images (e.g. for "dilemma", use "confused person at crossroads").

    Return the result as a JSON object with a single key "vocabularies" containing the array of these words.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert educational curriculum designer." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const text = completion.choices[0].message.content;
    if (!text) {
      return { success: false, error: "Empty response from OpenAI" };
    }

    const data = JSON.parse(text);
    return { success: true, vocabularies: data.vocabularies || [] };
  } catch (error: any) {
    console.error("OpenAI API Error:", error);
    return { success: false, error: error.message || "Không thể tạo danh sách từ vựng từ AI." };
  }
}

export async function generateSingleFlashcardWithImage(topicId: string, wordData: any, categoryName?: string) {
  try {
    let imageUrl = null;
    let audioUrl = null;

    // 1. Search for image
    if (wordData.imageSearchKeyword || wordData.word) {
      try {
        const searchKeyword = wordData.imageSearchKeyword || wordData.word;
        const images = await searchImagesAction(searchKeyword);
        if (images && images.length > 0) {
          // Pick the first image
          const firstImage = images[0];
          // Upload to R2 to make it permanent
          const uploadRes = await uploadUrlMedia(firstImage.url);
          if (uploadRes.success && uploadRes.url) {
            imageUrl = uploadRes.url;
          }
        }
      } catch (imgError) {
        console.error("Error finding or uploading image for", wordData.word, imgError);
        // Continue without image if it fails
      }
    }

    // 2. Generate TTS Audio
    if (wordData.word) {
      try {
        const session = await auth();
        const userId = session?.user?.id || "system";
        
        // Construct speechText: Word. Word. Example. Word.
        const word = wordData.word.trim();
        const exampleSentence = wordData.exampleSentence || "";
        const speechText = exampleSentence.trim() 
          ? `${word}. ${word}. ${exampleSentence} ${word}.`
          : `${word}. ${word}. ${word}.`;

        // Determine speed based on categoryName
        let speed = 1.0;
        if (categoryName) {
          const cat = categoryName.toLowerCase();
          if (cat.includes("kindergarten") || cat.includes("< 6") || cat.includes("under 6")) {
            speed = 0.75;
          }
        }

        console.log(`Generating auto TTS for bulk card: ${word} with speed ${speed}`);
        const ttsRes = await generateTTSHelper(speechText, "Aoede", speed, userId, "flashcard");
        if (ttsRes && ttsRes.url) {
          audioUrl = ttsRes.url;
        }
      } catch (ttsError) {
        console.error("Error generating auto TTS for word", wordData.word, ttsError);
        // Continue without audio if it fails
      }
    }

    // 3. Create flashcard
    const translations: Record<string, string> = {};
    if (wordData.definitionZh) translations.zh = wordData.definitionZh;
    if (wordData.definitionHi) translations.hi = wordData.definitionHi;
    if (wordData.definitionJa) translations.ja = wordData.definitionJa;
    if (wordData.definitionEs) translations.es = wordData.definitionEs;
    if (wordData.definitionAr) translations.ar = wordData.definitionAr;
    if (wordData.definitionFr) translations.fr = wordData.definitionFr;
    if (wordData.definitionKo) translations.ko = wordData.definitionKo;
    if (wordData.definitionPt) translations.pt = wordData.definitionPt;
    if (wordData.definitionRu) translations.ru = wordData.definitionRu;
    if (wordData.definitionDe) translations.de = wordData.definitionDe;

    const res = await adminCreateFlashcard({
      topicId: topicId,
      word: wordData.word,
      phonetic: wordData.phonetic,
      definition: wordData.definition,
      definitionVi: wordData.definitionVi,
      definitionTh: wordData.definitionTh,
      definitionId: wordData.definitionId,
      exampleSentence: wordData.exampleSentence,
      imageUrl: imageUrl || undefined,
      audioUrl: audioUrl || undefined,
      translations: Object.keys(translations).length > 0 ? translations : undefined,
    });

    return { success: res.success, error: res.error, card: res.card };
  } catch (error: any) {
    console.error("Error generating single flashcard:", error);
    return { success: false, error: error.message };
  }
}

// WAV Header Helper
function getWavHeader(dataLength: number, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataLength, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28);
  header.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataLength, 40);
  return header;
}

// Adaptive WAV audio splitter
async function splitWavFileAdaptive(audioUrl: string): Promise<Buffer | null> {
  const response = await fetch(audioUrl);
  if (!response.ok) {
    throw new Error(`Failed to download audio file: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const fileBuffer = Buffer.from(arrayBuffer);

  const riff = fileBuffer.toString('utf8', 0, 4);
  const wave = fileBuffer.toString('utf8', 8, 12);
  if (riff !== 'RIFF' || wave !== 'WAVE') {
    throw new Error("Not a valid RIFF/WAVE file");
  }

  const numChannels = fileBuffer.readUInt16LE(22);
  const sampleRate = fileBuffer.readUInt32LE(24);
  const bitsPerSample = fileBuffer.readUInt16LE(34);

  if (bitsPerSample !== 16) {
    throw new Error(`Unsupported bits per sample: ${bitsPerSample}`);
  }

  // Find the 'data' subchunk
  let dataOffset = 12;
  while (dataOffset < fileBuffer.length - 8) {
    const chunkId = fileBuffer.toString('utf8', dataOffset, dataOffset + 4);
    const chunkSize = fileBuffer.readUInt32LE(dataOffset + 4);
    if (chunkId === 'data') {
      dataOffset += 8;
      break;
    }
    dataOffset += 8 + chunkSize;
  }

  const pcmBytes = fileBuffer.subarray(dataOffset);
  const numSamples = pcmBytes.length / 2;
  const samples = new Int16Array(pcmBytes.buffer, pcmBytes.byteOffset, numSamples);

  const frameSize = Math.floor(sampleRate * 0.01); // 10ms
  const numFrames = Math.floor(numSamples / frameSize);

  const frameEnergies = new Float32Array(numFrames);
  for (let i = 0; i < numFrames; i++) {
    let sumAbs = 0;
    const start = i * frameSize;
    for (let j = 0; j < frameSize; j++) {
      sumAbs += Math.abs(samples[start + j]);
    }
    frameEnergies[i] = sumAbs / frameSize;
  }

  // Adaptive thresholds
  const options = [
    { activeThreshold: 200, silenceThreshold: 100, silenceDurationNeeded: 15 },
    { activeThreshold: 200, silenceThreshold: 120, silenceDurationNeeded: 12 },
    { activeThreshold: 150, silenceThreshold: 120, silenceDurationNeeded: 10 },
    { activeThreshold: 100, silenceThreshold: 150, silenceDurationNeeded: 8 },
    { activeThreshold: 80,  silenceThreshold: 180, silenceDurationNeeded: 6 },
    { activeThreshold: 50,  silenceThreshold: 200, silenceDurationNeeded: 5 }
  ];

  for (const opt of options) {
    let onsetFrame = -1;
    let offsetFrame = -1;

    for (let i = 0; i < numFrames; i++) {
      if (frameEnergies[i] > opt.activeThreshold) {
        onsetFrame = i;
        break;
      }
    }

    if (onsetFrame === -1) {
      continue;
    }

    for (let i = onsetFrame; i < numFrames; i++) {
      let isSilence = true;
      for (let j = 0; j < opt.silenceDurationNeeded; j++) {
        if (i + j >= numFrames || frameEnergies[i + j] > opt.silenceThreshold) {
          isSilence = false;
          break;
        }
      }
      if (isSilence) {
        offsetFrame = i;
        break;
      }
    }

    if (offsetFrame !== -1) {
      console.log(`  [Split Success] active=${opt.activeThreshold}, silence=${opt.silenceThreshold}, duration=${opt.silenceDurationNeeded}`);
      const cutFrame = Math.min(offsetFrame + 10, numFrames);
      const cutSampleIndex = cutFrame * frameSize;
      const cutByteLength = cutSampleIndex * 2;

      const cutPcmBytes = pcmBytes.subarray(0, cutByteLength);
      const newHeader = getWavHeader(cutPcmBytes.length, sampleRate, numChannels, bitsPerSample);
      return Buffer.concat([newHeader, cutPcmBytes]);
    }
  }

  // Fallback cut (first 1.2 seconds)
  console.log(`  [Split Fallback] Silence not found. Cutting first 1.2 seconds.`);
  const defaultDuration = 1.2;
  const cutFrame = Math.min(Math.floor(defaultDuration * 100), numFrames);
  const cutSampleIndex = cutFrame * frameSize;
  const cutByteLength = cutSampleIndex * 2;

  const cutPcmBytes = pcmBytes.subarray(0, cutByteLength);
  const newHeader = getWavHeader(cutPcmBytes.length, sampleRate, numChannels, bitsPerSample);
  return Buffer.concat([newHeader, cutPcmBytes]);
}

// Action to generate card image
export async function generateCardImageAction(word: string, imageSearchKeyword: string) {
  let imageUrl = null;
  if (imageSearchKeyword || word) {
    try {
      const searchKeyword = imageSearchKeyword || word;
      const images = await searchImagesAction(searchKeyword);
      if (images && images.length > 0) {
        const firstImage = images[0];
        const uploadRes = await uploadUrlMedia(firstImage.url);
        if (uploadRes.success && uploadRes.url) {
          imageUrl = uploadRes.url;
        }
      }
    } catch (imgError) {
      console.error("Error finding or uploading image for", word, imgError);
    }
  }
  return { success: true, imageUrl };
}

// Action to generate card audio (includes splitting and quiz audio generation)
export async function generateCardAudioAction(word: string, exampleSentence: string, categoryName?: string, quizQuestion?: string) {
  let audioUrl = null;
  let audioWordUrl = null;
  let quizAudioUrl = null;

  if (word) {
    try {
      const session = await auth();
      const userId = session?.user?.id || "system";
      
      const cleanWord = word.trim();
      const speechText = exampleSentence.trim() 
        ? `${cleanWord}. ${cleanWord}. ${exampleSentence} ${cleanWord}.`
        : `${cleanWord}. ${cleanWord}. ${cleanWord}.`;

      let speed = 1.0;
      if (categoryName) {
        const cat = categoryName.toLowerCase();
        if (cat.includes("kindergarten") || cat.includes("< 6") || cat.includes("under 6")) {
          speed = 0.75;
        }
      }

      console.log(`Generating auto TTS for server action card: ${cleanWord} with speed ${speed}`);
      const ttsRes = await generateTTSHelper(speechText, "Aoede", speed, userId, "flashcard");
      if (ttsRes && ttsRes.url) {
        audioUrl = ttsRes.url;

        // Try to split vocabulary audio
        try {
          console.log(`Splitting vocabulary audio for card: ${cleanWord}`);
          const splitBuffer = await splitWavFileAdaptive(audioUrl);
          if (splitBuffer) {
            const fileNameAudio = `tts-split-${cleanWord.replace(/\s+/g, '_')}-${Date.now()}.wav`;
            audioWordUrl = await uploadBufferToR2(splitBuffer, fileNameAudio, "audio/wav");
            console.log(`Uploaded word audio to R2: ${audioWordUrl}`);
          }
        } catch (splitErr) {
          console.error(`Error splitting audio for word: ${cleanWord}`, splitErr);
        }
      }

      // Generate Quiz Audio if present
      if (quizQuestion && quizQuestion.trim()) {
        try {
          console.log(`Generating auto Quiz TTS for: ${quizQuestion} with speed ${speed}`);
          const qTtsRes = await generateTTSHelper(quizQuestion, "Aoede", speed, userId, "inline");
          if (qTtsRes && qTtsRes.url) {
            quizAudioUrl = qTtsRes.url;
            console.log(`Generated quiz audio URL: ${quizAudioUrl}`);
          }
        } catch (qTtsErr) {
          console.error(`Error generating quiz audio for: ${quizQuestion}`, qTtsErr);
        }
      }
    } catch (ttsError) {
      console.error("Error generating auto TTS for word", word, ttsError);
    }
  }
  return { success: true, audioUrl, audioWordUrl, quizAudioUrl };
}

// ============================================================================
// NEW BATCH CREATE PIPELINE (SKILL.md compliant)
// Uses Gemini 2.5 Flash text + DeepInfra FLUX image + Gemini TTS x-slow
// ============================================================================

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import prisma from "@/lib/prisma";

function getFlashcardR2Client() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true,
  });
}

async function uploadToFlashcardR2(buffer: Buffer, fileName: string, contentType: string): Promise<string> {
  const key = `flashcards/global/${fileName}`;
  await getFlashcardR2Client().send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));
  return `${process.env.NEXT_PUBLIC_R2_URL!.replace(/\/$/, "")}/${key}`;
}

// WAV utilities (24kHz 16-bit mono)
const SR = 24000;
const BPS = 2;
const HDR = 44;

function mkWavHeader(dataSize: number): Buffer {
  const h = Buffer.alloc(HDR);
  h.write("RIFF", 0); h.writeUInt32LE(36 + dataSize, 4);
  h.write("WAVE", 8); h.write("fmt ", 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * BPS, 28);
  h.writeUInt16LE(BPS, 32); h.writeUInt16LE(16, 34);
  h.write("data", 36); h.writeUInt32LE(dataSize, 40);
  return h;
}
function wavWrap(pcm: Buffer): Buffer { return Buffer.concat([mkWavHeader(pcm.length), pcm]); }
function wavPcm(wav: Buffer): Buffer { return wav.subarray(HDR); }
function wavSlice(wav: Buffer, s: number, e: number): Buffer {
  return wavWrap(wavPcm(wav).subarray(s * BPS, e * BPS));
}

function detectSilence(pcm: Buffer): Array<{ start: number; end: number }> {
  const THRESH = 100;
  const MIN_SAMP = Math.floor(SR * 0.3);
  const WIN = Math.floor(SR / 100);
  const n = Math.floor(pcm.length / BPS);
  const regions: Array<{ start: number; end: number }> = [];
  let ss = -1;
  for (let w = 0; w * WIN < n; w++) {
    const ws = w * WIN, we = Math.min((w + 1) * WIN, n);
    let sq = 0;
    for (let i = ws; i < we; i++) { const v = pcm.readInt16LE(i * BPS); sq += v * v; }
    const rms = Math.sqrt(sq / (we - ws));
    if (rms < THRESH) { if (ss === -1) ss = ws; }
    else { if (ss !== -1) { if (ws - ss >= MIN_SAMP) regions.push({ start: ss, end: ws }); ss = -1; } }
  }
  if (ss !== -1 && n - ss >= MIN_SAMP) regions.push({ start: ss, end: n });
  return regions;
}

const TTS_MODELS_BATCH = [
  "gemini-2.5-flash-preview-tts",
  "gemini-3.1-flash-tts-preview",
  "gemini-2.5-pro-preview-tts",
];

async function geminiTTSBatch(ssml: string): Promise<Buffer> {
  for (const model of TTS_MODELS_BATCH) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(
          geminiUrl(model),
          {
            method: "POST",
            headers: geminiHeaders(),
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: ssml }] }],
              generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } } },
              },
            }),
          }
        );
        if (res.status === 429) {
          console.warn(`TTS ${model} attempt ${attempt + 1} → 429, waiting 5s...`);
          await new Promise(r => setTimeout(r, 5000));
          continue;
        }
        if (!res.ok) throw new Error(`TTS ${model} error ${res.status}`);
        const data = await res.json();
        const inlineData = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData;
        if (!inlineData?.data) throw new Error("No audio data returned");
        return wavWrap(Buffer.from(inlineData.data, "base64"));
      } catch (e: any) {
        if (e.message?.includes("429") || e.message?.includes("RESOURCE_EXHAUSTED")) {
          await new Promise(r => setTimeout(r, 5000));
          continue;
        }
        throw e;
      }
    }
  }
  // All models rate-limited — throw so the batch stops and reports to user
  throw new Error("TTS không khả dụng (rate limit). Vui lòng thử lại sau vài phút.");
}

/**
 * Suggest vocabulary words for a topic using Gemini 2.5 Flash.
 * Excludes words already existing in the topic.
 */
export async function suggestWordsForTopic(
  categoryName: string,
  topicName: string,
  existingWords: string[],
  count: number
): Promise<{ success: boolean; words?: string[]; error?: string }> {
  try {
    const excludeClause = existingWords.length > 0
      ? `\nDo NOT include any of these existing words: ${existingWords.map(w => `"${w}"`).join(", ")}.`
      : "";

    const prompt = `You are an expert educational content designer. Suggest exactly ${count} English vocabulary words for the topic "${topicName}", appropriate for the age group "${categoryName}".${excludeClause}

Rules:
- Words must clearly relate to the topic "${topicName}"
- Use vocabulary level appropriate for "${categoryName}"
- Prefer concrete, visual, easy-to-illustrate concepts
- Each suggestion must be unique
- Return a JSON object with key "words" containing an array of strings, e.g. {"words": ["word1", "word two", "word3"]}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      response_format: { type: "json_object" },
    });
    const raw = completion.choices[0].message.content?.trim() ?? "";
    const parsed = JSON.parse(raw);
    const words: string[] = Array.isArray(parsed) ? parsed : (parsed.words ?? parsed.vocabulary ?? Object.values(parsed)[0] as string[]);

    if (!Array.isArray(words)) throw new Error("Expected JSON array");
    const existingSet = new Set(existingWords.map(w => w.toLowerCase()));
    const filtered = words
      .filter(w => typeof w === "string" && w.trim() && !existingSet.has(w.toLowerCase().trim()))
      .map(w => w.trim())
      .slice(0, count);
    return { success: true, words: filtered };
  } catch (e: any) {
    console.error("suggestWordsForTopic:", e);
    return { success: false, error: e.message || "Failed to suggest words" };
  }
}

/**
 * Full SKILL.md pipeline for a single GlobalFlashcard:
 * Gemini text → FLUX image → Gemini TTS x-slow (1 call) →
 * windowed RMS silence detection → 3 segments → reconstruct audioUrl →
 * upload 4 WAV files → Prisma INSERT
 */
export async function createCompleteFlashcardFull(
  word: string,
  topicId: string,
  categoryName: string
): Promise<{ success: boolean; card?: any; error?: string }> {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") throw new Error("Unauthorized");

    const slug = word.toLowerCase().replace(/\s+/g, "-");
    const ts = Date.now();

    // Step 1: Text content
    const textPrompt = `Create flashcard data for the English word/phrase: "${word}" for age group "${categoryName}". Return ONLY raw JSON (no markdown fences, no extra text):
{
  "phonetic": "/IPA/",
  "definition": "max 10 words simple English definition",
  "definitionVi": "SHORT direct Vietnamese word/name (1-3 words max, e.g. 'Lạc đà', 'Con mèo' — NOT a description or sentence)",
  "definitionTh": "SHORT direct Thai word/name (1-3 words max — NOT a description)",
  "definitionId": "SHORT direct Indonesian word/name (1-3 words max — NOT a description)",
  "exampleSentence": "max 8 words age-appropriate example sentence",
  "quizQuestion": "max 7 words simple quiz question",
  "translations": {
    "zh": "SHORT direct Chinese word/name (1-3 characters/words)",
    "ja": "SHORT direct Japanese word/name (1-3 words)",
    "ko": "SHORT direct Korean word/name (1-3 words)",
    "hi": "SHORT direct Hindi word/name (1-3 words)",
    "ar": "SHORT direct Arabic word/name (1-3 words)",
    "fr": "SHORT direct French word/name (1-3 words)",
    "de": "SHORT direct German word/name (1-3 words)",
    "es": "SHORT direct Spanish word/name (1-3 words)",
    "pt": "SHORT direct Portuguese word/name (1-3 words)",
    "ru": "SHORT direct Russian word/name (1-3 words)"
  }
}`;
    // Step 1: OpenAI text generation (translations + definition + example + quiz)
    const oaiPrompt = textPrompt + "\n\nIMPORTANT: Return ONLY valid JSON matching the schema above, no markdown.";
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: oaiPrompt }],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });
    const td = JSON.parse(completion.choices[0].message.content?.trim() ?? "");

    // Step 2: FLUX image
    const fluxRes = await fetch("https://api.deepinfra.com/v1/openai/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DEEPINFRA_API_KEY}`,
      },
      body: JSON.stringify({
        model: "black-forest-labs/FLUX-1-dev",
        prompt: `A simple 2D cartoon illustration of ${word}. Flat design, colorful, cute, child-friendly. No text. Clean white isolated background.`,
        n: 1,
        size: "1024x1024",
        response_format: "b64_json",
      }),
    });
    if (!fluxRes.ok) throw new Error(`FLUX error ${fluxRes.status}`);
    const fluxJson = await fluxRes.json();
    const imgBuffer = Buffer.from(fluxJson.data?.[0]?.b64_json ?? "", "base64");
    const imageUrl = await uploadToFlashcardR2(imgBuffer, `${slug}-${ts}.png`, "image/png");

    // Step 3: Gemini TTS — x-slow, 1 call, no break tags
    const ssml = `<speak><prosody rate="x-slow">${word}. ${td.exampleSentence} ${td.quizQuestion}</prosody></speak>`;
    const fullWav = await geminiTTSBatch(ssml);

    if (!fullWav) {
      throw new Error("TTS không khả dụng — không thể tạo audio cho card này.");
    }

    // Step 4: Windowed RMS silence detection
    const pcm = wavPcm(fullWav);
    const silenceRegions = detectSilence(pcm);
    if (silenceRegions.length < 2) {
      throw new Error(`Silence detection thất bại cho "${word}": tìm thấy ${silenceRegions.length} vùng (cần ≥2)`);
    }
    const [sep1, sep2] = [...silenceRegions]
      .sort((a, b) => (b.end - b.start) - (a.end - a.start))
      .slice(0, 2)
      .sort((a, b) => a.start - b.start);

    // Step 5: Slice 3 segments
    const totalSamples = Math.floor(pcm.length / BPS);
    const seg1 = wavSlice(fullWav, 0,        sep1.start); // word
    const seg2 = wavSlice(fullWav, sep1.end, sep2.start); // sentence
    const seg3 = wavSlice(fullWav, sep2.end, totalSamples); // quiz

    // Step 6: Reconstruct audioUrl = word + word + sentence + word
    const pad = Buffer.alloc(Math.floor(SR * 0.4) * BPS, 0);
    const audioUrlWav = wavWrap(Buffer.concat([
      wavPcm(seg1), pad,
      wavPcm(seg1), pad,
      wavPcm(seg2), pad,
      wavPcm(seg1),
    ]));

    // Step 7: Upload 4 audio files to R2
    const [audioUrl, audioWordUrl, audioSentenceUrl, quizAudioUrl] = await Promise.all([
      uploadToFlashcardR2(audioUrlWav, `${slug}-full-${ts}.wav`,     "audio/wav"),
      uploadToFlashcardR2(seg1,        `${slug}-word-${ts}.wav`,     "audio/wav"),
      uploadToFlashcardR2(seg2,        `${slug}-sentence-${ts}.wav`, "audio/wav"),
      uploadToFlashcardR2(seg3,        `${slug}-quiz-${ts}.wav`,     "audio/wav"),
    ]);

    // Step 8 & 9: DB insert via existing adminCreateFlashcard
    const res = await adminCreateFlashcard({
      topicId,
      word,
      phonetic:        td.phonetic?.trim() || undefined,
      definition:      td.definition?.trim() || undefined,
      definitionVi:    td.definitionVi?.trim() || undefined,
      definitionTh:    td.definitionTh?.trim() || undefined,
      definitionId:    td.definitionId?.trim() || undefined,
      exampleSentence: td.exampleSentence?.trim() || undefined,
      imageUrl,
      audioUrl,
      audioWordUrl,
      audioSentenceUrl,
      quizQuestion:    td.quizQuestion?.trim() || undefined,
      quizAudioUrl,
      translations:    td.translations || undefined,
    });

    if (!res.success) throw new Error(res.error || "DB insert failed");
    return { success: true, card: res.card };
  } catch (e: any) {
    console.error(`createCompleteFlashcardFull("${word}"):`, e);
    return { success: false, error: e.message || "Unknown error" };
  }
}
