"use server"

import openai from "@/lib/openai";
import { searchImagesAction } from "@/actions/image-search-actions";
import { uploadUrlMedia } from "@/actions/upload-actions";
import { addMatchWordItem } from "@/actions/admin-match-words";
import { generateTTSHelper } from "@/actions/lesson-ai";
import { auth } from "@/auth";

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

function getSystemGuidelines(systemAge: string) {
  switch (systemAge) {
    case "kindergarten":
      return {
        levelName: "Kindergarten (Ages 2-5)",
        rule: "Extremely simple, basic, concrete nouns or visual objects (e.g., 'apple', 'cat', 'sun', 'ball', 'car'). Avoid abstract, complex, or multi-syllable words."
      };
    case "kid":
      return {
        levelName: "Kids (Ages 6-12)",
        rule: "Simple, everyday vocabulary words that elementary school students encounter (e.g., 'pencil', 'giraffe', 'school', 'bicycle', 'kitchen')."
      };
    case "teen":
      return {
        levelName: "Teens (Ages 11-16)",
        rule: "General intermediate vocabulary words suitable for middle/high school students (e.g., 'adventure', 'backpack', 'guitar', 'laptop')."
      };
    case "learner":
    default:
      return {
        levelName: "Advanced Readers / Learners",
        rule: "Intermediate to advanced English vocabulary suitable for adults or advanced learners (e.g., 'microscope', 'telescope', 'dictionary', 'instrument')."
      };
  }
}

export async function generateMatchWordVocabList(ageGroup: string, topicName: string) {
  if (!process.env.OPENAI_API_KEY) {
    return { success: false, error: "Missing OPENAI_API_KEY. Please set it in .env file." };
  }

  try {
    const systemAge = mapAgeGroupToSystem(ageGroup);
    const guidelines = getSystemGuidelines(systemAge);

    const prompt = `Generate a list of exactly 10 English vocabulary words that are highly relevant to the topic "${topicName}" and appropriate for the age group / level "${guidelines.levelName}".

    CRITICAL AGE-APPROPRIATE RULES for "${systemAge}":
    1. Vocabulary selection: ${guidelines.rule}
    2. All words must be concrete nouns or easily visualizable concepts that can be represented by a single image. Avoid abstract verbs/adjectives.
    3. Suggest a suitable, expressive single Emoji for each word that represents it.
    4. Suggest a single representative Emoji for the entire topic "${topicName}" (e.g. "🦁" for Wild animals, "🚗" for Vehicles).

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


