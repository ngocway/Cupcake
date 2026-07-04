"use server"

import openai from "@/lib/openai";
import { searchImagesAction } from "@/actions/image-search-actions";
import { uploadUrlMedia, uploadBufferToR2 } from "@/actions/upload-actions";
import { addMatchWordItem, safeRevalidatePath } from "@/actions/admin-match-words";
import { generateTTSHelper } from "@/actions/lesson-ai";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

function mapAgeGroupToSystem(ageGroup: string): "kindergarten" | "kid" | "teen" | "learner" {
  switch (ageGroup) {
    case "2-5":
      return "kindergarten";
    case "6-12":
      return "kid";
    case "teen":
      return "teen";
    case "readers":
      return "learner";
    default:
      if (["kindergarten", "kid", "teen", "learner"].includes(ageGroup)) {
        return ageGroup as any;
      }
      return "learner";
  }
}

function getSystemGuidelines(systemAge: string, level = 1) {
  if (systemAge === "kindergarten") {
    switch (level) {
      case 1:
        return {
          levelName: "Kindergarten (Ages 2-5) - Level 1 (Beginner)",
          rule: "Extremely simple, basic, everyday 1-syllable or very short 2-syllable concrete words (e.g., 'dog', 'cat', 'sun', 'red', 'blue', 'car', 'ball', 'circle'). Avoid any complex or longer words."
        };
      case 2:
        return {
          levelName: "Kindergarten (Ages 2-5) - Level 2 (Easy)",
          rule: "Simple everyday concrete nouns, slightly more descriptive or specific (e.g., 'rabbit', 'green', 'yellow', 'truck', 'star', 'apple')."
        };
      case 3:
        return {
          levelName: "Kindergarten (Ages 2-5) - Level 3 (Medium)",
          rule: "Medium simple everyday concrete words (e.g., 'monkey', 'purple', 'train', 'triangle', 'banana')."
        };
      case 4:
        return {
          levelName: "Kindergarten (Ages 2-5) - Level 4 (Intermediate)",
          rule: "Slightly longer concrete nouns for children (e.g., 'elephant', 'orange', 'airplane', 'diamond')."
        };
      case 5:
      default:
        return {
          levelName: "Kindergarten (Ages 2-5) - Level 5 (Advanced)",
          rule: "Most advanced vocabulary suitable for this young age group (e.g., 'rectangle', 'giraffe', 'helicopter', 'oval')."
        };
    }
  } else if (systemAge === "kid") {
    switch (level) {
      case 1:
        return {
          levelName: "Kids (Ages 6-12) - Level 1 (Beginner)",
          rule: "Simple, everyday vocabulary words that elementary school students encounter (e.g., 'pencil', 'giraffe', 'school', 'bicycle', 'kitchen')."
        };
      case 2:
        return {
          levelName: "Kids (Ages 6-12) - Level 2 (Easy)",
          rule: "Common concrete nouns, everyday classroom/household objects or animals (e.g., 'backpack', 'dolphin', 'bedroom', 'sandwich')."
        };
      case 3:
        return {
          levelName: "Kids (Ages 6-12) - Level 3 (Medium)",
          rule: "Moderate difficulty words suitable for middle elementary (e.g., 'microscope', 'dinosaur', 'library', 'astronaut')."
        };
      case 4:
        return {
          levelName: "Kids (Ages 6-12) - Level 4 (Intermediate)",
          rule: "Upper elementary words, slightly more specific or academic (e.g., 'telescope', 'continent', 'refrigerator', 'instrument')."
        };
      case 5:
      default:
        return {
          levelName: "Kids (Ages 6-12) - Level 5 (Advanced)",
          rule: "Advanced vocabulary words suitable for older kids (e.g., 'archaeology', 'constellation', 'laboratory', 'dictionary')."
        };
    }
  } else if (systemAge === "teen") {
    switch (level) {
      case 1:
        return {
          levelName: "Teens (Ages 11-16) - Level 1 (Beginner)",
          rule: "General intermediate vocabulary words suitable for middle school students (e.g., 'adventure', 'backpack', 'guitar', 'laptop')."
        };
      case 2:
        return {
          levelName: "Teens (Ages 11-16) - Level 2 (Easy)",
          rule: "Intermediate words, common hobbies and activities (e.g., 'photography', 'skateboarding', 'journal', 'smartphone')."
        };
      case 3:
        return {
          levelName: "Teens (Ages 11-16) - Level 3 (Medium)",
          rule: "Moderate teenager-level vocabulary (e.g., 'astronomy', 'excursion', 'portfolio', 'keyboard')."
        };
      case 4:
        return {
          levelName: "Teens (Ages 11-16) - Level 4 (Intermediate)",
          rule: "Challenging teenager-level words, specific fields of study or hobby tools (e.g., 'calligraphy', 'sculpture', 'biography', 'microchip')."
        };
      case 5:
      default:
        return {
          levelName: "Teens (Ages 11-16) - Level 5 (Advanced)",
          rule: "Advanced teenager/high-school vocabulary words (e.g., 'architecture', 'philosophical', 'expedition', 'biodiversity')."
        };
    }
  } else {
    switch (level) {
      case 1:
        return {
          levelName: "Advanced Learners - Level 1",
          rule: "Intermediate English vocabulary suitable for adults or advanced learners (e.g., 'microscope', 'telescope', 'dictionary', 'instrument')."
        };
      case 2:
        return {
          levelName: "Advanced Learners - Level 2",
          rule: "Upper-intermediate English vocabulary (e.g., 'biography', 'symphony', 'laboratory', 'archaeology')."
        };
      case 3:
        return {
          levelName: "Advanced Learners - Level 3",
          rule: "Moderate advanced English vocabulary (e.g., 'infrastructure', 'conservation', 'astrophysics', 'methodology')."
        };
      case 4:
        return {
          levelName: "Advanced Learners - Level 4",
          rule: "Challenging advanced English vocabulary (e.g., 'archetype', 'photosynthesis', 'thermodynamics', 'nanotechnology')."
        };
      case 5:
      default:
        return {
          levelName: "Advanced Learners - Level 5",
          rule: "Extremely challenging and complex advanced English vocabulary (e.g., 'epistemology', 'biodegradable', 'juxtaposition', 'counterbalance')."
        };
    }
  }
}

export async function generateMatchWordVocabList(ageGroup: string, topicName: string, level?: number, count: number = 10) {
  if (!process.env.OPENAI_API_KEY) {
    return { success: false, error: "Missing OPENAI_API_KEY. Please set it in .env file." };
  }

  try {
    const systemAge = mapAgeGroupToSystem(ageGroup);
    const guidelines = getSystemGuidelines(systemAge, level);

    let excludeWordsList: string[] = [];
    if (level !== undefined) {
      const existingTopics = await prisma.matchWordTopic.findMany({
        where: {
          ageGroup,
          game: { level }
        },
        include: { items: true }
      });
      excludeWordsList = existingTopics.flatMap(t => t.items.map(i => i.word.toLowerCase().trim()));
    }

    const excludeInstruction = excludeWordsList.length > 0 
      ? `\n    CRITICAL CONSTRAINT: Do NOT suggest any of these words: [${excludeWordsList.join(", ")}]. Choose other appropriate words instead.`
      : "";

    const prompt = `Generate a list of exactly ${count} English vocabulary words that are highly relevant to the topic "${topicName}" and appropriate for the age group / level "${guidelines.levelName}".

    CRITICAL AGE-APPROPRIATE RULES for "${systemAge}":
    1. Vocabulary selection: ${guidelines.rule}
    2. All words must be concrete nouns or easily visualizable concepts that can be represented by a single image. Avoid abstract verbs/adjectives.
    3. Suggest a suitable, expressive single Emoji for each word that represents it.
    4. Suggest a single representative Emoji for the entire topic "${topicName}" (e.g. "🦁" for Wild animals, "🚗" for Vehicles).
    5. CATEGORY INTEGRITY CONSTRAINT: The suggested words must be actual instances/types belonging directly to the category of "${topicName}" itself. If primary or common members of this category are excluded, you MUST suggest other valid members/types of the same category (e.g. other/secondary color names like "pink", "purple", "brown", "black", "white", "gray" for "Colors"; other vehicle types like "scooter", "helicopter", "tractor", "van" for "Vehicles"; other fruit names like "kiwi", "mango", "pear" for "Fruits"). Do NOT suggest associate concepts or objects that merely belong to or contain the topic (e.g. do NOT suggest "sky", "grass", "fire", "peach", "plum" for "Colors"; do NOT suggest "road", "wheel", "driver" for "Vehicles"; do NOT suggest "juice", "tree", "seed" for "Fruits").${excludeInstruction}

    For each word, provide:
    - "word": The English word (in lowercase, e.g. "apple")
    - "emoji": A single representative emoji (e.g. "🍎")

    Return the result as a JSON object with two keys:
    - "topicEmoji": The representative emoji for the entire topic
    - "vocabularies": The array of these word objects: { "word": "...", "emoji": "..." }`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an expert educational game designer." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const text = completion.choices[0].message.content;
    if (!text) {
      return { success: false, error: "Empty response from OpenAI" };
    }

    const data = JSON.parse(text);
    return { 
      success: true, 
      topicEmoji: data.topicEmoji || null,
      vocabularies: data.vocabularies || [] 
    };
  } catch (error: any) {
    console.error("OpenAI API Error for Match Words:", error);
    return { success: false, error: error.message || "Không thể tạo danh sách từ vựng từ AI." };
  }
}

export async function generateSingleMatchWordItem(topicId: string, word: string, emoji: string, ageGroup: string) {
  try {
    let imageUrl = null;
    let audioUrl = null;

    // 1. Search image on Google
    try {
      const systemAge = mapAgeGroupToSystem(ageGroup);
      const isCartoon = systemAge === "kindergarten" || systemAge === "kid";
      const searchKeyword = isCartoon ? `${word} cartoon illustration` : word;

      console.log(`Searching image for match-word '${word}' (isCartoon: ${isCartoon}) with query: '${searchKeyword}'`);
      const images = await searchImagesAction(searchKeyword);
      if (images && images.length > 0) {
        const firstImage = images[0];
        const uploadRes = await uploadUrlMedia(firstImage.url);
        if (uploadRes.success && uploadRes.url) {
          imageUrl = uploadRes.url;
        }
      }
    } catch (imgError) {
      console.error(`Error searching image for match-word '${word}':`, imgError);
    }

    // 2. Generate Audio TTS
    try {
      const session = await auth();
      const userId = session?.user?.id || "system";
      const speechText = `${word.trim()}.`;
      
      const systemAge = mapAgeGroupToSystem(ageGroup);
      let speed = 0.85;
      if (systemAge === "kindergarten") {
        speed = 0.8;
      } else if (systemAge === "kid") {
        speed = 0.85;
      } else if (systemAge === "teen") {
        speed = 0.9;
      } else {
        speed = 1.0;
      }

      console.log(`Generating TTS for match-word '${word}' with system age '${systemAge}' and speed ${speed}`);
      const ttsRes = await generateTTSHelper(speechText, "Aoede", speed, userId, "match-word");
      if (ttsRes && ttsRes.url) {
        audioUrl = ttsRes.url;
      }
    } catch (ttsError) {
      console.error(`Error generating TTS for match-word '${word}':`, ttsError);
    }

    // 3. Add to Database
    const res = await addMatchWordItem({
      topicId,
      word: word.toLowerCase().trim(),
      emoji: emoji || "✨",
      imageUrl: imageUrl || undefined,
      audioUrl: audioUrl || undefined
    });

    return { success: res.success, error: res.error, item: res.item };
  } catch (error: any) {
    console.error(`Error generating single match-word item for '${word}':`, error);
    return { success: false, error: error.message };
  }
}

import { updateMatchWordItem } from "@/actions/admin-match-words";

export async function generateAudioForMatchWordItem(itemId: string, word: string, ageGroup: string, modelName?: string) {
  try {
    let userId = "system";
    try {
      const session = await auth();
      if (session?.user?.id) userId = session.user.id;
    } catch (e) {
      // ignore outside next.js context
    }
    const speechText = `${word.trim()}.`;
    
    const systemAge = mapAgeGroupToSystem(ageGroup);
    let speed = 0.85;
    if (systemAge === "kindergarten") {
      speed = 0.8;
    } else if (systemAge === "kid") {
      speed = 0.85;
    } else if (systemAge === "teen") {
      speed = 0.9;
    } else {
      speed = 1.0;
    }

    console.log(`Generating TTS for match-word '${word}' with model ${modelName || 'auto'}`);
    const ttsRes = await generateTTSHelper(speechText, "Aoede", speed, userId, "match-word", modelName);
    
    if (ttsRes && ttsRes.url) {
      const res = await updateMatchWordItem(itemId, { word, audioUrl: ttsRes.url });
      return { success: res.success, error: res.error, url: ttsRes.url };
    }
    
    return { success: false, error: "Không tạo được audio URL từ Gemini" };
  } catch (error: any) {
    console.error(`Error generating audio for item '${word}':`, error);
    return { success: false, error: error.message };
  }
}

export async function generateMatchWordImageAction(word: string, ageGroup: string) {
  let imageUrl = null;
  try {
    const systemAge = mapAgeGroupToSystem(ageGroup);
    const isCartoon = systemAge === "kindergarten" || systemAge === "kid";
    const searchKeyword = isCartoon ? `${word} cartoon illustration` : word;

    console.log(`Searching image for match-word '${word}' (isCartoon: ${isCartoon}) with query: '${searchKeyword}'`);
    const images = await searchImagesAction(searchKeyword);
    if (images && images.length > 0) {
      const firstImage = images[0];
      const uploadRes = await uploadUrlMedia(firstImage.url);
      if (uploadRes.success && uploadRes.url) {
        imageUrl = uploadRes.url;
      }
    }
  } catch (imgError) {
    console.error(`Error searching image for match-word '${word}':`, imgError);
  }
  return { success: true, imageUrl };
}

export async function generateMatchWordAudioAction(word: string, ageGroup: string) {
  let audioUrl = null;
  try {
    const session = await auth();
    const userId = session?.user?.id || "system";
    const speechText = `${word.trim()}.`;
    
    const systemAge = mapAgeGroupToSystem(ageGroup);
    let speed = 0.85;
    if (systemAge === "kindergarten") {
      speed = 0.8;
    } else if (systemAge === "kid") {
      speed = 0.85;
    } else if (systemAge === "teen") {
      speed = 0.9;
    } else {
      speed = 1.0;
    }

    console.log(`Generating TTS for match-word '${word}' with system age '${systemAge}' and speed ${speed}`);
    const ttsRes = await generateTTSHelper(speechText, "Aoede", speed, userId, "match-word");
    if (ttsRes && ttsRes.url) {
      audioUrl = ttsRes.url;
    }
  } catch (ttsError) {
    console.error(`Error generating TTS for match-word '${word}':`, ttsError);
  }
  return { success: true, audioUrl };
}

// Helpers for Combined TTS and Splitting
function makeWavHeader(dataSize: number, sampleRate = 24000, channels = 1, bitsPerSample = 16): Buffer {
  const byteRate = (sampleRate * channels * bitsPerSample) / 8;
  const blockAlign = (channels * bitsPerSample) / 8;
  const h = Buffer.alloc(44);
  h.write("RIFF", 0);
  h.writeUInt32LE(36 + dataSize, 4);
  h.write("WAVE", 8);
  h.write("fmt ", 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(channels, 22);
  h.writeUInt32LE(sampleRate, 24);
  h.writeUInt32LE(byteRate, 28);
  h.writeUInt16LE(blockAlign, 32);
  h.writeUInt16LE(bitsPerSample, 34);
  h.write("data", 36);
  h.writeUInt32LE(dataSize, 40);
  return h;
}

function splitAudioBuffer(pcmBuffer: Buffer, expectedCount: number, sampleRate = 24000): Buffer[] {
  const totalSamples = pcmBuffer.length / 2;
  const samples = new Int16Array(pcmBuffer.buffer, pcmBuffer.byteOffset, totalSamples);

  const frameSize = Math.floor(sampleRate * 0.01); // 10ms frame
  const numFrames = Math.floor(totalSamples / frameSize);

  const frameEnergies = new Float32Array(numFrames);
  for (let i = 0; i < numFrames; i++) {
    let sumAbs = 0;
    const start = i * frameSize;
    for (let j = 0; j < frameSize; j++) {
      sumAbs += Math.abs(samples[start + j]);
    }
    frameEnergies[i] = sumAbs / frameSize;
  }

  let onsetThreshold = 80;
  let silenceThreshold = 50;
  let minSilenceFrames = 40; // Start with 400ms silence requirement

  let segments: { start: number; end: number }[] = [];
  let attempts = 0;
  
  while (attempts < 15) {
    segments = [];
    let state: "silence" | "speech" = "silence";
    let currentStart = 0;
    let silenceCounter = 0;

    for (let i = 0; i < numFrames; i++) {
      const energy = frameEnergies[i];
      if (state === "silence") {
        if (energy > onsetThreshold) {
          state = "speech";
          const prevEnd = segments.length > 0 ? segments[segments.length - 1].end : 0;
          currentStart = Math.max(prevEnd, i - 15);
          silenceCounter = 0;
        }
      } else {
        if (energy < silenceThreshold) {
          silenceCounter++;
          if (silenceCounter >= minSilenceFrames) {
            const segmentEnd = Math.min(numFrames, i - minSilenceFrames + 15);
            segments.push({ start: currentStart, end: segmentEnd });
            state = "silence";
            i = segmentEnd;
          }
        } else {
          silenceCounter = 0;
        }
      }
    }

    if (state === "speech") {
      segments.push({ start: currentStart, end: numFrames });
    }

    console.log(`[Audio Splitter Attempt ${attempts + 1}] Found ${segments.length} segments. Expected: ${expectedCount} (Onset: ${onsetThreshold}, Silence: ${silenceThreshold}, MinSilenceFrames: ${minSilenceFrames})`);

    if (segments.length === expectedCount) {
      break;
    }

    attempts++;
    if (segments.length < expectedCount) {
      // Too few segments: we probably missed a silence gap because it wasn't quiet enough or long enough
      silenceThreshold += 5; // make silence detection more sensitive
      minSilenceFrames = Math.max(15, minSilenceFrames - 3); // shorten gap length requirement
    } else {
      // Too many segments: we over-split
      silenceThreshold = Math.max(15, silenceThreshold - 5);
      minSilenceFrames += 4;
      onsetThreshold += 10;
    }
  }

  if (segments.length !== expectedCount) {
    throw new Error(`Expected ${expectedCount} split segments, but found ${segments.length} after tuning. Please try submitting again.`);
  }

  return segments.map((seg) => {
    const startSample = seg.start * frameSize;
    const endSample = seg.end * frameSize;
    const sliceSamples = samples.subarray(startSample, endSample);
    
    const sliceBuffer = Buffer.from(sliceSamples.buffer, sliceSamples.byteOffset, sliceSamples.byteLength);
    const wavHeader = makeWavHeader(sliceBuffer.length, sampleRate, 1, 16);
    
    return Buffer.concat([wavHeader, sliceBuffer]);
  });
}

// Generate Game Thumbnail using Gemini Imagen
export async function generateMatchWordGameThumbnailAction(gameName: string) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return { success: false, error: "Missing GEMINI_API_KEY" };

  try {
    const prompt = `A beautiful and colorful illustration representing the educational topic "${gameName}", 3D cartoon style, bright clean background, fun for kids`;
    console.log(`[Gemini Imagen] Generating game thumbnail for '${gameName}': "${prompt}"`);
    const baseEndpoint = process.env.GEMINI_API_ENDPOINT || "https://generativelanguage.googleapis.com";
    const url = `${baseEndpoint}/v1beta/models/gemini-3.1-flash-image:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ["IMAGE"]
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini Imagen API failed: ${response.status}`);
    }

    const data: any = await response.json();
    const b64 = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
    if (!b64) {
      throw new Error("No image data returned from Gemini Imagen");
    }

    const buffer = Buffer.from(b64, "base64");
    const fileName = `gemini-thumb-${gameName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}.png`;
    const thumbnailUrl = await uploadBufferToR2(buffer, fileName, "image/png");

    return { success: true, thumbnailUrl };
  } catch (err: any) {
    console.warn(`[Gemini Game Thumbnail] Imagen failed for "${gameName}": ${err.message || err}. Attempting Google Image fallback...`);
    try {
      const searchKeyword = `${gameName} educational cartoon illustration kids`;
      const results = await searchImagesAction(searchKeyword);
      if (results && results.length > 0) {
        for (let idx = 0; idx < Math.min(results.length, 5); idx++) {
          const imageUrlCandidate = results[idx].url;
          try {
            console.log(`[Google Image Fallback] Attempting to download thumbnail: ${imageUrlCandidate}`);
            const imgRes = await fetch(imageUrlCandidate, { signal: AbortSignal.timeout(5000) });
            if (imgRes.ok) {
              const arrayBuffer = await imgRes.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              const fileName = `google-fallback-thumb-${gameName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}.png`;
              const uploadedUrl = await uploadBufferToR2(buffer, fileName, "image/png");
              console.log(`[Google Image Fallback] Successfully uploaded fallback thumbnail: ${uploadedUrl}`);
              return { success: true, thumbnailUrl: uploadedUrl };
            }
          } catch (fetchErr) {
            console.warn(`[Google Image Fallback] Failed to fetch candidate index ${idx}:`, fetchErr);
          }
        }
      }
      throw new Error("Could not find any suitable Google Image fallback");
    } catch (fallbackErr: any) {
      console.error("All thumbnail generation and fallback paths failed:", fallbackErr);
      return { success: false, error: `All thumbnail generation paths failed: ${fallbackErr.message || fallbackErr}` };
    }
  }
}

// Generate Item Image using Gemini Imagen
export async function generateMatchWordImagenImageAction(word: string, ageGroup: string) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return { success: false, error: "Missing GEMINI_API_KEY" };

  try {
    const systemAge = mapAgeGroupToSystem(ageGroup);
    const isCartoon = systemAge === "kindergarten" || systemAge === "kid";
    const prompt = isCartoon 
      ? `A simple 2D cartoon illustration of a ${word}. Flat design, colorful, cute, no text, clean isolated background`
      : `A clean 3D illustration of a ${word}, bright colors, educational style, isolated background`;

    console.log(`[Gemini Imagen] Generating image for match-word '${word}': "${prompt}"`);
    const baseEndpoint = process.env.GEMINI_API_ENDPOINT || "https://generativelanguage.googleapis.com";
    const url = `${baseEndpoint}/v1beta/models/gemini-3.1-flash-image:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ["IMAGE"]
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini Imagen API failed: ${response.status}`);
    }

    const data: any = await response.json();
    const b64 = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
    if (!b64) {
      throw new Error("No image data returned from Gemini Imagen");
    }

    const buffer = Buffer.from(b64, "base64");
    const fileName = `gemini-imagen-${word}-${Date.now()}.png`;
    const imageUrl = await uploadBufferToR2(buffer, fileName, "image/png");

    return { success: true, imageUrl };
  } catch (err: any) {
    console.warn(`[Gemini Imagen] Imagen generation failed for "${word}": ${err.message || err}. Attempting Google Image fallback...`);
    try {
      const searchKeyword = `${word} cartoon illustration png`;
      const results = await searchImagesAction(searchKeyword);
      if (results && results.length > 0) {
        for (let idx = 0; idx < Math.min(results.length, 5); idx++) {
          const imageUrlCandidate = results[idx].url;
          try {
            console.log(`[Google Image Fallback] Attempting to download image: ${imageUrlCandidate}`);
            const imgRes = await fetch(imageUrlCandidate, { signal: AbortSignal.timeout(5000) });
            if (imgRes.ok) {
              const arrayBuffer = await imgRes.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              const fileName = `google-fallback-${word.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}.png`;
              const uploadedUrl = await uploadBufferToR2(buffer, fileName, "image/png");
              console.log(`[Google Image Fallback] Successfully uploaded fallback image: ${uploadedUrl}`);
              return { success: true, imageUrl: uploadedUrl };
            }
          } catch (fetchErr) {
            console.warn(`[Google Image Fallback] Failed to fetch candidate index ${idx}:`, fetchErr);
          }
        }
      }
      throw new Error("Could not find any suitable Google Image fallback");
    } catch (fallbackErr: any) {
      console.error("All image generation and fallback paths failed. Using Dicebear SVG fallback:", fallbackErr);
      const dicebearUrl = `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${encodeURIComponent(word)}`;
      return { success: true, imageUrl: dicebearUrl };
    }
  }
}

// Generate Combined TTS Audio & Split
export async function generateMatchWordCombinedAudioAction(words: string[], ageGroup: string) {
  try {
    console.log(`[Google Translate TTS] Fetching and uploading TTS for ${words.length} words in parallel...`);
    const promises = words.map(async (word) => {
      const response = await fetch(
        `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${encodeURIComponent(word)}`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36"
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Google Translate TTS returned status ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const fileName = `split-tts-${word.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now()}.mp3`;
      return await uploadBufferToR2(buffer, fileName, "audio/mpeg");
    });

    const audioUrls = await Promise.all(promises);
    console.log(`[Google Translate TTS] Successfully generated and uploaded all ${words.length} audio files.`);
    return { success: true, audioUrls };
  } catch (gtErr: any) {
    console.error("Google Translate TTS failed:", gtErr);
    return { success: false, error: `Google Translate TTS failed: ${gtErr.message || gtErr}` };
  }
}

// Database creation Transaction for New Game with AI
export async function createMatchWordGameWithAI(data: {
  name: string;
  ageGroup: string;
  level: number;
  thumbnailUrl: string;
  topicName?: string;
  vocabularies: { word: string; emoji: string }[];
  imageUrls: string[];
  audioUrls: string[];
}) {
  try {
    // find max order for the ageGroup
    const maxOrderGame = await prisma.matchWordGame.findFirst({
      where: { ageGroup: data.ageGroup },
      orderBy: { order: "desc" }
    });
    const order = maxOrderGame ? maxOrderGame.order + 1 : 1;

    const tName = data.topicName || data.name;

    // 1. Create the game container
    const game = await prisma.matchWordGame.create({
      data: {
        name: data.name,
        ageGroup: data.ageGroup,
        level: data.level,
        order,
        thumbnailUrl: data.thumbnailUrl
      }
    });

    // 2. Create the topic
    const slug = tName.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
    const topic = await prisma.matchWordTopic.create({
      data: {
        gameId: game.id,
        ageGroup: data.ageGroup,
        name: tName,
        slug: `${slug}-${data.ageGroup}-ai-${Date.now()}`, // ensure unique
        icon: data.vocabularies[0]?.emoji || "🎮"
      }
    });

    // 3. Save items using createMany
    const itemsData = data.vocabularies.map((vocab, i) => ({
      topicId: topic.id,
      word: vocab.word.toLowerCase().trim(),
      emoji: vocab.emoji || "✨",
      imageUrl: data.imageUrls[i] || "",
      audioUrl: data.audioUrls[i] || ""
    }));

    await prisma.matchWordItem.createMany({
      data: itemsData
    });

    safeRevalidatePath("/admin/games/match-words");
    safeRevalidatePath("/student/game/match-words/select");

    return { success: true, game };
  } catch (error: any) {
    console.error("Failed to create game with AI:", error);
    return { success: false, error: error.message };
  }
}

// Add a new Topic (Game) to an existing Game Container
export async function createMatchWordTopicWithAI(data: {
  gameId: string;
  ageGroup: string;
  name: string;
  vocabularies: { word: string; emoji: string }[];
  imageUrls: string[];
  audioUrls: string[];
}) {
  try {
    const baseSlug = data.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
    const slug = `${baseSlug}-${data.ageGroup}-ai-${Date.now()}`;
    
    // 1. Create the topic
    const topic = await prisma.matchWordTopic.create({
      data: {
        gameId: data.gameId,
        ageGroup: data.ageGroup,
        name: data.name,
        slug,
        icon: data.vocabularies[0]?.emoji || "🎮"
      }
    });

    // 2. Save items using createMany
    const itemsData = data.vocabularies.map((vocab, i) => ({
      topicId: topic.id,
      word: vocab.word.toLowerCase().trim(),
      emoji: vocab.emoji || "✨",
      imageUrl: data.imageUrls[i] || "",
      audioUrl: data.audioUrls[i] || ""
    }));

    await prisma.matchWordItem.createMany({
      data: itemsData
    });

    safeRevalidatePath("/admin/games/match-words");
    safeRevalidatePath("/student/game/match-words/select");

    return { success: true, topic };
  } catch (error: any) {
    console.error("Failed to create topic with AI:", error);
    return { success: false, error: error.message };
  }
}

// Create Game from an existing topic
export async function createGameFromExistingTopic(data: {
  name: string;
  ageGroup: string;
  level: number;
  thumbnailUrl: string;
  topicId: string;
}) {
  try {
    // find max order for the ageGroup
    const maxOrderGame = await prisma.matchWordGame.findFirst({
      where: { ageGroup: data.ageGroup },
      orderBy: { order: "desc" }
    });
    const order = maxOrderGame ? maxOrderGame.order + 1 : 1;

    // Create game and update topic gameId & ageGroup in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const game = await tx.matchWordGame.create({
        data: {
          name: data.name,
          ageGroup: data.ageGroup,
          level: data.level,
          order,
          thumbnailUrl: data.thumbnailUrl
        }
      });

      // Move the existing topic to this new game
      await tx.matchWordTopic.update({
        where: { id: data.topicId },
        data: { 
          gameId: game.id,
          ageGroup: data.ageGroup // Ensure ageGroup matches target game
        }
      });

      return game;
    });

    safeRevalidatePath("/admin/games/match-words");
    safeRevalidatePath("/student/game/match-words/select");

    return { success: true, game: result };
  } catch (error: any) {
    console.error("Failed to create game from existing topic:", error);
    return { success: false, error: error.message };
  }
}


