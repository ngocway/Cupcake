"use server";

import openai from "@/lib/openai";

export type QuizDifficulty = "EASY" | "MEDIUM" | "HARD";
export type QuizQuestionType = "ALL" | "VOCABULARY" | "FILL_BLANK" | "READING_CONTEXT";

export interface GenerateCandyQuizInput {
  topicOrText: string;
  count: number;
  difficulty?: QuizDifficulty;
  questionType?: QuizQuestionType;
}

export interface GeneratedQuizQuestionItem {
  question: string;
  options: {
    id: "A" | "B" | "C" | "D";
    text: string;
    isCorrect: boolean;
  }[];
  searchKeyword?: string;
  explanation?: string;
}

export interface GenerateCandyQuizResult {
  success: boolean;
  suggestedTitle?: string;
  questions?: GeneratedQuizQuestionItem[];
  error?: string;
}

const IS_PROXY = !!process.env.GEMINI_API_ENDPOINT;
const GEMINI_BASE = (process.env.GEMINI_API_ENDPOINT ?? "https://generativelanguage.googleapis.com").replace(/\/$/, "");

const geminiUrl = (model: string) =>
  IS_PROXY
    ? `${GEMINI_BASE}/v1beta/models/${model}:generateContent`
    : `${GEMINI_BASE}/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

const geminiHeaders = (): Record<string, string> =>
  IS_PROXY
    ? { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GEMINI_API_KEY}` }
    : { "Content-Type": "application/json" };

function getDifficultyInstruction(difficulty: QuizDifficulty = "MEDIUM"): string {
  switch (difficulty) {
    case "EASY":
      return `Target Difficulty: DỄ (EASY - CEFR A1 level)
- Vocabulary: Everyday basic words (animals, family, colors, food, school objects, numbers, daily routine).
- Grammar: Very simple sentence structures, present simple (e.g., 'What is this?', 'She likes cats.', 'The dog is _____ the table.').
- Question length: Short and direct (5-10 words).
- Distractors: Obviously distinguishable and easy for beginners, but grammatically appropriate.`;
    case "MEDIUM":
      return `Target Difficulty: TRUNG BÌNH (MEDIUM - CEFR A2-B1 level)
- Vocabulary: General English curriculum vocabulary for primary and lower secondary grades.
- Grammar: Past simple, present continuous, future with will/going to, prepositions, comparative adjectives, modal verbs (can/must/should).
- Formats: Contextual sentence completion, short mini-dialogues (e.g. 'A: Where did you go? - B: I _____ to the zoo.').
- Distractors: Plausible common errors, ensuring thoughtful consideration.`;
    case "HARD":
      return `Target Difficulty: KHÓ (HARD - CEFR B2+ level)
- Vocabulary: Rich, academic, or descriptive vocabulary, phrasal verbs, idioms, and collocations.
- Grammar: Complex sentences, passive voice, conditionals (if clauses), relative clauses, perfect tenses, reported speech.
- Formats: Analytical reading comprehension, nuanced word distinction, contextual deduction.
- Distractors: Subtle, highly plausible distractors requiring solid grammar knowledge and critical thinking.`;
    default:
      return "CEFR A2 level. Clear, balanced questions suitable for young learners.";
  }
}

function getQuestionTypeInstruction(type: QuizQuestionType = "ALL"): string {
  switch (type) {
    case "VOCABULARY":
      return `Question Style: VOCABULARY & DEFINITIONS ONLY.
Focus on meanings, definitions, synonyms, antonyms, or identifying objects, animals, actions, and concepts. Example: 'What animal lives in the ocean and is very intelligent?'`;
    case "FILL_BLANK":
      return `Question Style: FILL IN THE BLANK (CLOZE) ONLY.
Every question must contain a blank represented by '_____' or '____' requiring students to choose the correct word, phrase, or verb form. Example: 'Yesterday, my sister _____ a delicious cake.'`;
    case "READING_CONTEXT":
      return `Question Style: DIALOGUES & READING CONTEXT ONLY.
Focus on conversational exchanges or mini situational contexts. Example: 'Tom: "Would you like some lemonade?" - Mary: "_____."' or short 1-2 sentence reading passage questions.`;
    case "ALL":
    default:
      return `Question Style: BALANCED MIX.
Provide a diverse, engaging mix of:
- Vocabulary & definition questions
- Fill-in-the-blank (cloze) grammar questions
- Conversational dialogue or situational questions`;
  }
}

export async function generateCandyQuizQuestionsAction(
  input: GenerateCandyQuizInput
): Promise<GenerateCandyQuizResult> {
  const { topicOrText, count, difficulty = "MEDIUM", questionType = "ALL" } = input;

  if (!topicOrText || !topicOrText.trim()) {
    return { success: false, error: "Chủ đề hoặc nội dung bài học không được để trống." };
  }

  const cleanCount = Math.min(Math.max(Math.round(count) || 5, 2), 20);
  const difficultyInstruction = getDifficultyInstruction(difficulty);
  const questionTypeInstruction = getQuestionTypeInstruction(questionType);

  const prompt = `You are a master English curriculum educator and test design specialist.
Create exactly ${cleanCount} high-quality, 4-choice multiple-choice questions (A, B, C, D) for an interactive English learning quiz game based on this topic or reference material:
"""
${topicOrText.trim()}
"""

${difficultyInstruction}

${questionTypeInstruction}

CRITICAL RULES:
1. Question Content (question text, choices/options, prompts) MUST BE 100% IN ENGLISH ONLY. Do NOT use any Vietnamese in question text or options.
2. Every question must have EXACTLY 4 options with ids "A", "B", "C", "D".
3. EXACTLY ONE option must have "isCorrect": true. The other three options must have "isCorrect": false.
4. Distractors must be grammatically consistent with the correct answer (e.g., same part of speech or verb form).
5. For each question, provide a concise "searchKeyword" in English (1-3 words) to search for an illustration picture (e.g. "giraffe animal", "making cake", "solar system", "rainy day umbrella").
6. Provide a concise, engaging game title in English ("suggestedTitle", 2-5 words max, e.g. "Animals & Habitats Quiz", "Past Tense Adventure").

Return ONLY a valid JSON object matching this schema without markdown fences or additional commentary:
{
  "suggestedTitle": "string",
  "questions": [
    {
      "question": "string",
      "options": [
        { "id": "A", "text": "string", "isCorrect": true },
        { "id": "B", "text": "string", "isCorrect": false },
        { "id": "C", "text": "string", "isCorrect": false },
        { "id": "D", "text": "string", "isCorrect": false }
      ],
      "searchKeyword": "string"
    }
  ]
}`;

  // 1. Try Gemini first
  if (process.env.GEMINI_API_KEY) {
    try {
      const models = ["gemini-2.5-flash", "gemini-1.5-flash"];
      let rawText = "";

      for (const model of models) {
        try {
          const res = await fetch(geminiUrl(model), {
            method: "POST",
            headers: geminiHeaders(),
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.7,
              },
            }),
          });

          if (res.ok) {
            const data = await res.json();
            rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
            if (rawText) break;
          }
        } catch {
          // Try next model
        }
      }

      if (rawText) {
        const cleaned = rawText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "").trim();
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
          const validatedQuestions = sanitizeQuestions(parsed.questions, cleanCount);
          if (validatedQuestions.length > 0) {
            return {
              success: true,
              suggestedTitle: parsed.suggestedTitle || "English Candy Quiz",
              questions: validatedQuestions,
            };
          }
        }
      }
    } catch (geminiError) {
      console.warn("[generateCandyQuizQuestionsAction] Gemini failed, attempting OpenAI fallback:", geminiError);
    }
  }

  // 2. Fallback to OpenAI
  if (process.env.OPENAI_API_KEY) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are an expert English curriculum designer. Output strictly JSON." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const text = completion.choices[0].message.content;
      if (text) {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
          const validatedQuestions = sanitizeQuestions(parsed.questions, cleanCount);
          if (validatedQuestions.length > 0) {
            return {
              success: true,
              suggestedTitle: parsed.suggestedTitle || "English Candy Quiz",
              questions: validatedQuestions,
            };
          }
        }
      }
    } catch (openAiError: any) {
      console.error("[generateCandyQuizQuestionsAction] OpenAI failed:", openAiError);
      return { success: false, error: openAiError?.message || "Không thể tạo câu hỏi qua AI." };
    }
  }

  return {
    success: false,
    error: "Không tìm thấy cấu hình API Key (GEMINI_API_KEY hoặc OPENAI_API_KEY).",
  };
}

function sanitizeQuestions(rawList: any[], maxCount: number): GeneratedQuizQuestionItem[] {
  const result: GeneratedQuizQuestionItem[] = [];

  for (let i = 0; i < rawList.length && result.length < maxCount; i++) {
    const raw = rawList[i];
    if (!raw || !raw.question || !Array.isArray(raw.options) || raw.options.length < 2) {
      continue;
    }

    const questionText = String(raw.question).trim();
    if (!questionText) continue;

    // Ensure options have A, B, C, D
    const optionLabels: ("A" | "B" | "C" | "D")[] = ["A", "B", "C", "D"];
    const options = raw.options.slice(0, 4).map((opt: any, idx: number) => ({
      id: optionLabels[idx] || ("D" as const),
      text: String(opt.text || opt.label || "").trim(),
      isCorrect: Boolean(opt.isCorrect),
    }));

    // Pad to 4 options if fewer
    while (options.length < 4) {
      const idx = options.length;
      options.push({
        id: optionLabels[idx] || "D",
        text: `Option ${optionLabels[idx]}`,
        isCorrect: false,
      });
    }

    // Ensure exactly 1 correct option
    const correctCount = options.filter((o: any) => o.isCorrect).length;
    if (correctCount === 0) {
      options[0].isCorrect = true;
    } else if (correctCount > 1) {
      let foundFirst = false;
      for (const opt of options) {
        if (opt.isCorrect) {
          if (!foundFirst) {
            foundFirst = true;
          } else {
            opt.isCorrect = false;
          }
        }
      }
    }

    result.push({
      question: questionText,
      options,
      searchKeyword: String(raw.searchKeyword || questionText.split(" ").slice(0, 3).join(" ")).trim(),
      explanation: raw.explanation ? String(raw.explanation).trim() : undefined,
    });
  }

  return result;
}

export interface AnalyzeImageForQuizInput {
  imageBase64: string;
  mimeType?: string;
}

export interface AnalyzeImageForQuizResult {
  success: boolean;
  topic?: string;
  topicVi?: string;
  suggestedTitle?: string;
  extractedContext?: string;
  description?: string;
  error?: string;
}

export async function analyzeImageForQuizAction(
  input: AnalyzeImageForQuizInput
): Promise<AnalyzeImageForQuizResult> {
  const { imageBase64, mimeType = "image/jpeg" } = input;

  if (!imageBase64) {
    return { success: false, error: "Dữ liệu hình ảnh không hợp lệ." };
  }

  const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, "");

  const prompt = `You are an expert English teacher and AI vision specialist.
Analyze this uploaded educational image (such as a textbook page, worksheet, exercise sheet, storybook, or illustration) to generate multiple-choice quiz questions.

TASKS:
1. Identify the core theme/topic of the image in English ("topic", e.g. "Wild Animals", "Present Simple Daily Activities", "School Objects").
2. Provide a friendly Vietnamese translation for the topic ("topicVi", e.g. "Động vật hoang dã", "Thói quen hàng ngày").
3. Suggest an engaging game title in English ("suggestedTitle", e.g. "Wild Animals Adventure Quiz").
4. OCR and extract relevant text, stories, reading passages, or questions visible in the image ("extractedContext"). If there are specific exercises or words in the image, transcribe and summarize them so they can be directly used as context for quiz questions.
5. Provide a short 1-sentence description in Vietnamese of what you detected ("description", e.g. "Nhận diện trang sách bài tập về thì hiện tại đơn").

Return ONLY a valid JSON object matching this schema without markdown fences:
{
  "topic": "string",
  "topicVi": "string",
  "suggestedTitle": "string",
  "extractedContext": "string",
  "description": "string"
}`;

  // 1. Try Gemini Vision first
  if (process.env.GEMINI_API_KEY) {
    try {
      const models = ["gemini-2.5-flash", "gemini-1.5-flash"];
      for (const model of models) {
        try {
          const res = await fetch(geminiUrl(model), {
            method: "POST",
            headers: geminiHeaders(),
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { inlineData: { mimeType, data: cleanBase64 } },
                    { text: prompt },
                  ],
                },
              ],
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.2,
              },
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
            if (rawText) {
              const cleaned = rawText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "").trim();
              const parsed = JSON.parse(cleaned);
              if (parsed.topic) {
                return {
                  success: true,
                  topic: parsed.topic,
                  topicVi: parsed.topicVi,
                  suggestedTitle: parsed.suggestedTitle,
                  extractedContext: parsed.extractedContext || "",
                  description: parsed.description,
                };
              }
            }
          }
        } catch {
          // Try next model
        }
      }
    } catch (e) {
      console.warn("[analyzeImageForQuizAction] Gemini Vision failed, attempting OpenAI fallback:", e);
    }
  }

  // 2. Fallback to OpenAI GPT-4o Vision
  if (process.env.OPENAI_API_KEY) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert English language educator and AI vision specialist. Output strictly JSON.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${cleanBase64}`,
                },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      });

      const text = completion.choices[0].message.content;
      if (text) {
        const parsed = JSON.parse(text);
        if (parsed.topic) {
          return {
            success: true,
            topic: parsed.topic,
            topicVi: parsed.topicVi,
            suggestedTitle: parsed.suggestedTitle,
            extractedContext: parsed.extractedContext || "",
            description: parsed.description,
          };
        }
      }
    } catch (err: any) {
      console.error("[analyzeImageForQuizAction] OpenAI Vision failed:", err);
      return { success: false, error: err?.message || "Không thể phân tích hình ảnh." };
    }
  }

  return {
    success: false,
    error: "Không tìm thấy cấu hình API Key cho Vision (GEMINI_API_KEY hoặc OPENAI_API_KEY).",
  };
}
