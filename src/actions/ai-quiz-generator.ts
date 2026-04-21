"use server";

import openai from "@/lib/openai";
import { QuestionType } from "@/components/quiz/types";

export const generateQuizQuestions = async ({
  topic,
  count,
  type,
  difficulty,
  language
}: {
  topic: string;
  count: number;
  type: QuestionType;
  difficulty: string;
  language: string;
}) => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Lỗi Server: Chưa cấu hình OPENAI_API_KEY trong file .env");
  }

  try {
    const langStr = language === 'VI' ? 'Vietnamese' : 'English';

    let formatInstructions = "";
    if (type === 'MULTIPLE_CHOICE') {
      formatInstructions = `
      {
        "questions": [
          {
            "questionText": "string",
            "options": [
              { "text": "string", "isCorrect": boolean }
            ],
            "explanation": "string"
          }
        ]
      }`;
    } else if (type === 'TRUE_FALSE') {
      formatInstructions = `
      {
        "questions": [
          {
            "statement": "string",
            "isTrue": boolean,
            "explanation": "string"
          }
        ]
      }`;
    } else {
      throw new Error(`AI Generation for type ${type} is not yet supported.`);
    }

    const prompt = `Generate ${count} ${difficulty} difficulty quiz questions about "${topic}" in ${langStr}. 
    The question type format must be strictly as follows:
    ${formatInstructions}
    
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
    
    return JSON.parse(text);
  } catch (error: any) {
    console.error("OpenAI API Error in quiz generation:", error);
    throw new Error("Lỗi gọi OpenAI API (" + error.message + ")");
  }
};
