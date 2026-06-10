"use server";

import openai from "@/lib/openai";
import { QuestionType } from "@/components/quiz/types";

export const generateQuizQuestions = async ({
  topic,
  count,
  type,
  difficulty,
  language,
  includeMetadata
}: {
  topic: string;
  count: number;
  type: QuestionType;
  difficulty: string;
  language: string;
  includeMetadata?: boolean;
}) => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Lỗi Server: Chưa cấu hình OPENAI_API_KEY trong file .env");
  }

  try {
    const langStr = language === 'VI' ? 'Vietnamese' : 'English';

    let formatInstructions = "";
    if (type === 'MULTIPLE_CHOICE') {
      formatInstructions = `
        "questions": [
          {
            "questionText": "string",
            "options": [
              { "text": "string", "isCorrect": boolean }
            ],
            "explanation": "string"
          }
        ]`;
    } else if (type === 'TRUE_FALSE') {
      formatInstructions = `
        "questions": [
          {
            "statement": "string",
            "isTrue": boolean,
            "explanation": "string"
          }
        ]`;
    } else if (type === 'CLOZE_TEST') {
      formatInstructions = `
        "questions": [
          {
            "textWithBlanks": "string containing words to fill in wrapped with {{ and }}. Example: The capital of Vietnam is {{Hanoi}}.",
            "caseSensitive": boolean,
            "explanation": "string"
          }
        ]`;
    } else if (type === 'MATCHING') {
      formatInstructions = `
        "questions": [
          {
            "instruction": "string describing the matching task",
            "presentationType": "QUESTION_ANSWER",
            "pairs": [
              {
                "leftText": "string",
                "rightText": "string"
              }
            ],
            "explanation": "string"
          }
        ]`;
    } else {
      throw new Error(`AI Generation for type ${type} is not yet supported.`);
    }

    const metadataInstruction = includeMetadata ? `
      "title": "A catchy, relevant title for this assignment",
      "instructions": "General instructions for the students on how to do this assignment",
      "shortDescription": "A short, engaging description for the library (max 200 chars)",
      "targetAudiences": ["kids", "teens", "adults", "business"], // Pick 1 or more suitable target audiences from this list based on the CEFR difficulty level
    ` : '';

    const prompt = `Generate ${count} quiz questions about "${topic}" at CEFR level ${difficulty} in ${langStr}. 
    The output must be in JSON format and strictly follow this structure:
    {
      ${metadataInstruction}
      ${formatInstructions}
    }
    
    Ensure output is educational and factually accurate.`;

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
    
    const result = JSON.parse(text);
    
    return result;
  } catch (error: any) {
    console.error("OpenAI API Error in quiz generation:", error);
    throw new Error("Lỗi gọi OpenAI API (" + error.message + ")");
  }
};
