"use server";

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { QuestionType } from "@/components/quiz/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

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
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Lỗi Server: Chưa cấu hình GEMINI_API_KEY trong file .env");
  }

  try {
    let schemaProperties: any = {};
    
    if (type === 'MULTIPLE_CHOICE') {
      schemaProperties = {
        questions: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              questionText: { type: SchemaType.STRING },
              options: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    text: { type: SchemaType.STRING },
                    isCorrect: { type: SchemaType.BOOLEAN }
                  },
                  required: ["text", "isCorrect"]
                }
              },
              explanation: { type: SchemaType.STRING }
            },
            required: ["questionText", "options", "explanation"]
          }
        }
      };
    } else if (type === 'TRUE_FALSE') {
      schemaProperties = {
        questions: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              statement: { type: SchemaType.STRING },
              isTrue: { type: SchemaType.BOOLEAN },
              explanation: { type: SchemaType.STRING }
            },
            required: ["statement", "isTrue", "explanation"]
          }
        }
      };
    } else {
      throw new Error(`AI Generation for type ${type} is not yet supported in this beta version.`);
    }

    const schema = {
      type: SchemaType.OBJECT,
      properties: schemaProperties,
      required: ["questions"]
    };

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema as any,
      }
    });

    const langStr = language === 'VI' ? 'Vietnamese' : 'English';

    const prompt = `Generate ${count} ${difficulty} difficulty quiz questions about "${topic}" in ${langStr}. 
    The question type format must match the requested schema exactly.
    Ensure output is educational and factually accurate.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Gemini API Error in quiz generation:", error);
    throw new Error("Lỗi gọi Gemini API (" + error.message + ")");
  }
};
