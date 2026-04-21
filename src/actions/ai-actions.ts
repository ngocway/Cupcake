"use server";

import openai from "@/lib/openai";

export async function generateVocabularyDetails(word: string) {
  if (!process.env.OPENAI_API_KEY) {
    return { error: "Missing OPENAI_API_KEY. Please set it in .env file." };
  }

  try {
    const prompt = `Provide detailed vocabulary information for the English word or phrase: "${word}". 
    The definitions should be professional, accurate, and easy to understand for Grade 10-12 Vietnamese students. 
    The meaningVi should be the most common and accurate translation in Vietnamese. 
    The explanationEn should be a clear, simple English definition (CEFR B1-B2 level). 
    Provide exactly 2-3 illustrative, high-quality example sentences. 
    Provide 2-3 very descriptive English keywords for an image search that perfectly represents the word's meaning (e.g. for "dilemma", use "confused person at crossroads").
    
    Return the result in JSON format matching this structure:
    {
      "word": "string",
      "pronunciation": "string",
      "meaningVi": "string",
      "explanationEn": "string",
      "examples": ["string"],
      "imageSearchKeywords": "string"
    }`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful educational content creator." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const text = completion.choices[0].message.content;
    if (!text) {
      throw new Error("Empty response from OpenAI");
    }
    
    return JSON.parse(text);
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return { error: "Không thể lấy thông tin từ AI. Vui lòng thử lại sau." };
  }
}
