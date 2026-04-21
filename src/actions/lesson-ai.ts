"use server";

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import fs from 'fs';
import path from 'path';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface AILessonResponse {
  title: string;
  passage: string;
  shortDescription: string;
  vocabulary: {
    word: string;
    pronunciation: string;
    meaningVi: string;
    explanationEn: string;
    examples: string[];
  }[];
  questions: {
    type: "MULTIPLE_CHOICE" | "TRUE_FALSE";
    questionText: string;
    options?: { text: string; isCorrect: boolean }[];
    isTrue?: boolean;
    explanation: string;
  }[];
}
const lessonSchema = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING },
    shortDescription: { type: SchemaType.STRING },
    passage: { type: SchemaType.STRING },
    vocabulary: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          word: { type: SchemaType.STRING },
          pronunciation: { type: SchemaType.STRING },
          meaningVi: { type: SchemaType.STRING },
          explanationEn: { type: SchemaType.STRING },
          examples: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING }
          }
        },
        required: ["word", "pronunciation", "meaningVi", "explanationEn", "examples"]
      }
    },
    questions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          type: { type: SchemaType.STRING, description: "MULTIPLE_CHOICE or TRUE_FALSE" },
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
          isTrue: { type: SchemaType.BOOLEAN, description: "Only for TRUE_FALSE type" },
          explanation: { type: SchemaType.STRING }
        },
        required: ["type", "questionText", "explanation"]
      }
    }
  },
  required: ["title", "shortDescription", "passage", "vocabulary", "questions"]
};

function logProgress(msg: string) {
  const logDir = path.join(process.cwd(), 'scratch');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
  const logFile = path.join(logDir, 'ai_gen_progress.log');
  fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);
}

export async function generateAILesson({
  topic,
  gradeLevel,
  subject,
  difficulty,
  language = "English",
  questionCount = 5,
  wordCount = 400
}: {
  topic: string;
  gradeLevel: string;
  subject: string;
  difficulty: string;
  language?: string;
  questionCount?: number;
  wordCount?: number;
}): Promise<AILessonResponse | { error: string }> {
  logProgress(`Starting AI Generation for topic: ${topic}, Language: ${language}, WordCount: ${wordCount}`);
  
  if (!process.env.GEMINI_API_KEY) {
    logProgress(`ERROR: GEMINI_API_KEY is missing`);
    return { error: "GEMINI_API_KEY is not configured." };
  }

  try {
    const isVietnamese = language === "Tiếng Việt";

    const prompt = `Create a complete lesson for students in the ${language} language on the topic: "${topic}".
    Subject: ${subject}
    Difficulty level: ${difficulty}
    Target Language for all content (Title, Passage, Questions): ${language}
    
    The lesson MUST include:
    1. An engaging Title written COMPLETELY in ${language}.
    2. A Short Description (1-2 sentences) written COMPLETELY in ${language}.
    3. A reading Passage (Body Text) written COMPLETELY in ${language} with approximately ${wordCount} words. 
       IMPORTANT requirements for the passage:
       - You MUST wrap key vocabulary words (the ones in the vocabulary list below) inside the passage using this exact HTML structure: <span class="custom-vocab-marker" data-vocab-id="WORD_LOWERCASE">WORD</span>.
       - Example: If "sustainable" is a vocab word, write <span class="custom-vocab-marker" data-vocab-id="sustainable">sustainable</span> in the passage.
    4. A Vocabulary list of 5-8 key words from the passage with definitions. ${isVietnamese ? 'Provide pronunciation, the English definition, AND the Vietnamese translation (meaningVi).' : 'Provide pronunciation, meaning, and English definition.'}
    5. A set of ${questionCount} questions based on the passage (mix of MULTIPLE_CHOICE and TRUE_FALSE) written COMPLETELY in ${language}.
    
    CRITICAL: ALL text in title, passage, and questions MUST be in ${language}. DO NOT use English if the Target Language is Vietnamese.
    Follow the JSON schema exactly.`;


    const maxRetries = 2;
    let retryCount = 0;
    let result;

    while (retryCount <= maxRetries) {
      try {
        logProgress(`Calling Gemini API (1.5 Flash) - Attempt ${retryCount + 1}...`);
        const model = genAI.getGenerativeModel({
          model: "gemini-1.5-flash",
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: lessonSchema as any,
          }
        });

        result = await model.generateContent(prompt);
        break; // Success
      } catch (error: any) {
        if (error.message?.includes("503") || error.message?.includes("high demand") || error.message?.includes("Service Unavailable")) {
          retryCount++;
          if (retryCount <= maxRetries) {
            logProgress(`Gemini 503 detected, retrying in 2s...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
        }
        throw error;
      }
    }

    if (!result) throw new Error("Failed to get response from Gemini.");

    const response = await result.response;
    const text = response.text();
    
    logProgress(`Gemini response received. Length: ${text.length}`);
    return JSON.parse(text) as AILessonResponse;

  } catch (error: any) {
    logProgress(`Gemini API Error: ${error.message}`);
    console.error("AI Lesson Gen Error:", error);
    
    if (error.message?.includes("503") || error.message?.includes("high demand") || error.message?.includes("Service Unavailable")) {
      return { error: "Hệ thống AI của Google đang quá tải (503). Vui lòng thử lại sau vài giây." };
    }
    
    return { error: error.message || "Failed to generate lesson content." };
  }
}

export async function saveAILesson(data: AILessonResponse & { gradeLevel: string; subject: string }) {
  logProgress(`Saving AI Lesson: ${data.title}`);
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== 'ADMIN' && session.user.role !== 'TEACHER')) {
    logProgress(`Unauthorized access attempt by user: ${session?.user?.id}`);
    return { error: "Unauthorized: Access denied." };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const vocabMap = new Map();
      data.vocabulary.forEach(v => {
        vocabMap.set(v.word.toLowerCase(), v);
      });

      let passageHtml = data.passage
        .split('\n\n')
        .map(p => p.trim())
        .filter(p => p.length > 0)
        .map(p => `<p>${p}</p>`)
        .join('');

      passageHtml = passageHtml.replace(
        /<span class="custom-vocab-marker" data-vocab-id="([^"]+)">([^<]+)<\/span>/g,
        (match, vocabId, wordText) => {
          const v = vocabMap.get(vocabId.toLowerCase());
          if (v) {
            return `<span class="custom-vocab-marker" 
              data-vocab-id="${vocabId}" 
              data-word="${v.word}" 
              data-pronunciation="${v.pronunciation}" 
              data-meaning-vi="${v.meaningVi}" 
              data-explanation-en="${v.explanationEn.replace(/"/g, '&quot;')}" 
              data-examples="${v.examples.join('; ').replace(/"/g, '&quot;')}"
              style="background-color: #fef08a; border-bottom: 2px solid #facc15; cursor: help;"
            >${wordText}</span>`;
          }
          return match;
        }
      );

      const vocabHtml = `
        <h3>Vocabulary List</h3>
        <ul style="list-style-type: none; padding: 0;">
          ${data.vocabulary.map(v => `
            <li style="margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
              <strong style="font-size: 1.1em; color: #2563eb;">${v.word}</strong> 
              <span style="color: #64748b; font-style: italic;">[${v.pronunciation}]</span>
              <div style="margin-top: 5px;">
                <span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-weight: bold; margin-right: 8px;">VI</span>
                <span>${v.meaningVi}</span>
              </div>
              <div style="margin-top: 3px; color: #475569;">
                <span style="background: #e0f2fe; padding: 2px 6px; border-radius: 4px; font-weight: bold; margin-right: 8px; color: #0369a1;">EN</span>
                <span>${v.explanationEn}</span>
              </div>
              <div style="margin-top: 5px; font-size: 0.9em; color: #64748b;">
                <strong>Example:</strong> ${v.examples[0]}
              </div>
            </li>
          `).join('')}
        </ul>
      `;

      const assignment = await tx.assignment.create({
        data: {
          title: (data.title || "Untitled AI Lesson").trim(),
          shortDescription: data.shortDescription,
          readingText: passageHtml,
          gradeLevel: data.gradeLevel,
          subject: data.subject,
          materialType: "READING",
          status: "DRAFT",
          teacherId: session.user.id,
          isAiGenerated: true,
          instructions: vocabHtml, 
        }
      });

      const questionsData = data.questions.map((q, idx) => {
        let questionContent;
        if (q.type === "MULTIPLE_CHOICE") {
          questionContent = {
            questionText: q.questionText,
            options: q.options || []
          };
        } else {
          questionContent = {
            statement: q.questionText,
            isTrue: q.isTrue ?? true
          };
        }

        return {
          assignmentId: assignment.id,
          type: q.type as any,
          orderIndex: idx,
          points: 1.0,
          explanation: q.explanation,
          content: JSON.stringify(questionContent),
          isAiGenerated: true,
        };
      });

      await tx.question.createMany({
        data: questionsData
      });

      return assignment.id;
    });

    revalidatePath("/teacher/lessons");
    revalidatePath("/teacher/materials");
    revalidatePath("/admin/materials");
    
    return { success: true, id: result };
  } catch (error: any) {
    console.error("Save AI Lesson Error:", error);
    return { error: "Không thể lưu bài học. Vui lòng thử lại." };
  }
}

export async function customGenerateLesson(params: {
  topic: string;
  gradeLevel: string;
  subject: string;
  difficulty: string;
  questionCount: number;
  wordCount: number;
}) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== 'ADMIN' && session.user.role !== 'TEACHER')) {
    return { error: "Unauthorized: Access denied." };
  }

  try {
    const aiResponse = await generateAILesson({
      topic: params.topic,
      gradeLevel: params.gradeLevel,
      subject: params.subject,
      difficulty: params.difficulty,
      questionCount: params.questionCount,
      wordCount: params.wordCount
    });

    if ("error" in aiResponse) {
      return { error: aiResponse.error };
    }

    const saveResponse = await saveAILesson({
      ...aiResponse,
      gradeLevel: params.gradeLevel,
      subject: params.subject
    });

    if ("error" in saveResponse) {
      return { error: saveResponse.error };
    }

    revalidatePath("/teacher/lessons");
    revalidatePath("/teacher/dashboard");
    
    return { success: true, id: saveResponse.id };
  } catch (error: any) {
    console.error("Custom AI Lesson Gen Error:", error);
    return { error: "Không thể tự động tạo bài tập. Vui lòng thử lại." };
  }
}

export async function quickGenerateLesson() {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== 'ADMIN' && session.user.role !== 'TEACHER')) {
    return { error: "Unauthorized: Access denied." };
  }

  try {
    const topics = ["AI", "Environment", "History", "Space", "Health"];
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];

    const aiResponse = await generateAILesson({
      topic: randomTopic,
      gradeLevel: "10",
      subject: "Tiếng Anh",
      difficulty: "MEDIUM",
      questionCount: 5,
      wordCount: 400
    });

    if ("error" in aiResponse) return { error: aiResponse.error };

    const saveResponse = await saveAILesson({
      ...aiResponse,
      gradeLevel: "10",
      subject: "Tiếng Anh"
    });

    return saveResponse;
  } catch (error: any) {
    return { error: "Failed." };
  }
}
