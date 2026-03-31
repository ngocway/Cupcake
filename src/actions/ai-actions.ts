"use server";

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const schema = {
  description: "A vocabulary detail object",
  type: SchemaType.OBJECT,
  properties: {
    word: { type: SchemaType.STRING, description: "The word itself" },
    pronunciation: { type: SchemaType.STRING, description: "IPA pronunciation (e.g. /dɪˈlemə/)" },
    meaningVi: { type: SchemaType.STRING, description: "Common Vietnamese meaning (suitable for students)" },
    explanationEn: { type: SchemaType.STRING, description: "Simple English definition (CEFR B1-B2 level)" },
    examples: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING, description: "An example sentence" },
      description: "2-3 high-quality example sentences"
    },
    imageSearchKeywords: { type: SchemaType.STRING, description: "1-3 keywords to search for a relevant image" }
  },
  required: ["word", "pronunciation", "meaningVi", "explanationEn", "examples", "imageSearchKeywords"]
} as const;

export async function generateVocabularyDetails(word: string) {
  if (!process.env.GEMINI_API_KEY) {
    return { error: "Missing GEMINI_API_KEY. Please set it in .env file." };
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema as any,
      }
    });

    const prompt = `Provide detailed vocabulary information for the English word or phrase: "${word}". 
    The definitions should be professional, accurate, and easy to understand for Grade 10-12 Vietnamese students. 
    The meaningVi should be the most common and accurate translation in Vietnamese. 
    The explanationEn should be a clear, simple English definition (CEFR B1-B2 level). 
    Provide exactly 2-3 illustrative, high-quality example sentences. 
    Provide 2-3 very descriptive English keywords for an image search that perfectly represents the word's meaning (e.g. for "dilemma", use "confused person at crossroads").`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return { error: "Không thể lấy thông tin từ AI. Vui lòng thử lại sau." };
  }
}
