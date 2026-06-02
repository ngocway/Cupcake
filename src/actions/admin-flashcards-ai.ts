"use server"

import openai from "@/lib/openai";
import { searchImagesAction } from "@/actions/image-search-actions";
import { uploadUrlMedia } from "@/actions/upload-actions";
import { adminCreateFlashcard } from "@/actions/admin-flashcards";

export async function generateFlashcardVocabularyList(categoryName: string, topicName: string, count: number) {
  if (!process.env.OPENAI_API_KEY) {
    return { success: false, error: "Missing OPENAI_API_KEY. Please set it in .env file." };
  }

  if (count <= 0) return { success: true, vocabularies: [] };

  try {
    const prompt = `Generate a list of exactly ${count} English vocabulary words that are highly relevant to the topic "${topicName}" and appropriate for the age group "${categoryName}". 
    For each word, provide:
    - "word": The English word
    - "phonetic": Its phonetic transcription
    - "definition": An English definition suitable for the age group
    - "definitionVi": A SHORT, direct Vietnamese translation (1-3 words max, e.g. "Quả chuối", NOT a definition).
    - "definitionTh": A SHORT, direct Thai translation (1-3 words max).
    - "definitionId": A SHORT, direct Indonesian translation (1-3 words max).
    - "exampleSentence": A simple English example sentence using the word, suitable for the age group.
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

export async function generateSingleFlashcardWithImage(topicId: string, wordData: any) {
  try {
    let imageUrl = null;

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

    // 2. Create flashcard
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
    });

    return { success: res.success, error: res.error, card: res.card };
  } catch (error: any) {
    console.error("Error generating single flashcard:", error);
    return { success: false, error: error.message };
  }
}
