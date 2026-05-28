"use server";

import openai from "@/lib/openai";

export async function translateSelection(
  text: string,
  targetLanguage: string
): Promise<{ success: boolean; translation?: string; error?: string }> {
  if (!text || !targetLanguage) {
    return { success: false, error: "Missing text or target language." };
  }

  try {
    const prompt = `Translate the following text to ${targetLanguage}. Respond ONLY with the translation, no extra text, quotes, or explanations.\n\nText: "${text}"`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using mini for faster response and lower cost
      messages: [
        { role: "system", content: "You are a highly accurate translation assistant." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3, // Lower temperature for more deterministic translation
    });

    const translation = completion.choices[0].message.content?.trim();
    
    if (!translation) {
      return { success: false, error: "Empty response from AI." };
    }

    return { success: true, translation };
  } catch (error: any) {
    console.error("Translation API Error:", error);
    return { success: false, error: error.message || "Failed to translate." };
  }
}
