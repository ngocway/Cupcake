"use server";

import openai from "@/lib/openai";

export type TopicDifficultyLevel = "BASIC" | "INTERMEDIATE" | "UPPER_INTERMEDIATE" | "ADVANCED";

export interface GenerateTopicVocabulariesInput {
  topic: string;
  count: number;
  level?: TopicDifficultyLevel;
}

export interface GeneratedVocabularyItem {
  word: string;
  searchKeyword: string;
}

export interface GenerateTopicVocabulariesResult {
  success: boolean;
  suggestedTitle?: string;
  items?: GeneratedVocabularyItem[];
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

function getLevelInstruction(level: TopicDifficultyLevel = "BASIC"): string {
  switch (level) {
    case "BASIC":
      return "CEFR A1 level. Select simple, concrete, highly visual, common everyday words (e.g. cat, dog, sun, moon, tree, apple). Must be 1 to 2 words per item.";
    case "INTERMEDIATE":
      return "CEFR A2-B1 level. Select intermediate vocabulary words that are descriptive and clearly representable by an image (e.g. telescope, dolphin, volcano, astronaut, compass). Maximum 2-3 words per item.";
    case "UPPER_INTERMEDIATE":
      return "CEFR B2 level. Select upper-intermediate vocabulary terms that are specific, educational, and visually distinctive (e.g. constellation, carnivore, glacier, photosynthesis, habitat). Maximum 2-3 words per item.";
    case "ADVANCED":
      return "CEFR C1 level. Select advanced academic, scientific, or descriptive English vocabulary that has clear visual depiction (e.g. archipelago, metamorphosis, solar flare, bioluminescence). Maximum 2-3 words per item.";
    default:
      return "CEFR A1-A2 level. Select common everyday words that are clearly depictable in a picture.";
  }
}

export async function generateTopicVocabulariesAction(
  input: GenerateTopicVocabulariesInput
): Promise<GenerateTopicVocabulariesResult> {
  const { topic, count, level = "BASIC" } = input;

  if (!topic || !topic.trim()) {
    return { success: false, error: "Chủ đề không được để trống." };
  }

  const cleanCount = Math.min(Math.max(Math.round(count) || 7, 1), 70);
  const levelInstruction = getLevelInstruction(level);

  const prompt = `You are an expert English language educator and curriculum designer.
Generate exactly ${cleanCount} English vocabulary items for educational flashcard/matching games based on the topic: "${topic.trim()}".

Target Difficulty Level:
${levelInstruction}

CRITICAL RULES:
1. Every vocabulary item MUST be 100% in English only.
2. Each item must be a short word or phrase (1-3 words max), perfectly suitable for a visual matching card.
3. For each word, generate a descriptive "searchKeyword" in English optimized for searching photo libraries (e.g., for "bat" use "bat flying animal" so it won't return baseball bats; for "mercury" use "mercury planet solar system"; for "orange" use "orange fruit").
4. Items must be distinct, non-duplicate, and strictly relevant to the topic "${topic.trim()}".
5. Suggest an engaging, concise title for this game in English (e.g., "Solar System Planets", "Wild Animals Adventure").

Return ONLY a valid JSON object matching this schema without any markdown wrapping or extra text:
{
  "suggestedTitle": "string",
  "items": [
    {
      "word": "string",
      "searchKeyword": "string"
    }
  ]
}`;

  // 1. Try Gemini first if API key is present
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
        if (Array.isArray(parsed.items) && parsed.items.length > 0) {
          return {
            success: true,
            suggestedTitle: parsed.suggestedTitle || topic.trim(),
            items: parsed.items.slice(0, cleanCount).map((it: any) => ({
              word: String(it.word || "").trim(),
              searchKeyword: String(it.searchKeyword || it.word || "").trim(),
            })).filter((it: any) => it.word.length > 0),
          };
        }
      }
    } catch (geminiError) {
      console.warn("[generateTopicVocabulariesAction] Gemini failed, attempting OpenAI fallback:", geminiError);
    }
  }

  // 2. Fallback to OpenAI if Gemini fails or is not available
  if (process.env.OPENAI_API_KEY) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are an expert English educational curriculum designer. Output strictly JSON." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const text = completion.choices[0].message.content;
      if (text) {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed.items) && parsed.items.length > 0) {
          return {
            success: true,
            suggestedTitle: parsed.suggestedTitle || topic.trim(),
            items: parsed.items.slice(0, cleanCount).map((it: any) => ({
              word: String(it.word || "").trim(),
              searchKeyword: String(it.searchKeyword || it.word || "").trim(),
            })).filter((it: any) => it.word.length > 0),
          };
        }
      }
    } catch (openAiError: any) {
      console.error("[generateTopicVocabulariesAction] OpenAI failed:", openAiError);
      return { success: false, error: openAiError?.message || "Không thể tạo từ vựng qua AI." };
    }
  }

  return {
    success: false,
    error: "Không tìm thấy cấu hình API Key (GEMINI_API_KEY hoặc OPENAI_API_KEY).",
  };
}

export interface AnalyzeImageForTopicInput {
  imageBase64: string;
  mimeType?: string;
}

export interface AnalyzeImageForTopicResult {
  success: boolean;
  topic?: string;
  topicVi?: string;
  suggestedTitle?: string;
  keyObjects?: string[];
  description?: string;
  error?: string;
}

export async function analyzeImageForTopicAction(
  input: AnalyzeImageForTopicInput
): Promise<AnalyzeImageForTopicResult> {
  const { imageBase64, mimeType = "image/jpeg" } = input;

  if (!imageBase64) {
    return { success: false, error: "Dữ liệu hình ảnh không hợp lệ." };
  }

  const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, "");

  const prompt = `You are an expert English teacher and AI curriculum specialist.
Analyze this uploaded image to determine the most inspiring educational vocabulary topic for an English matching game.

TASKS:
1. Identify the core theme/topic of the image (e.g., "School Supplies", "Farm Animals", "Solar System", "Ocean Creatures", "Vehicles & Transport", "Kitchen Utensils", "Fruits & Vegetables", "Jobs & Occupations").
2. Check for any visible English text (OCR). If the image is a textbook page, flashcard, or labeled diagram, extract its exact academic topic.
3. Suggest a clear, concise English topic name ("topic", 1-3 words max, e.g. "School Supplies").
4. Provide a friendly Vietnamese translation for the topic ("topicVi", e.g. "Đồ dùng học tập").
5. Suggest an engaging game title in English ("suggestedTitle", e.g. "School Supplies Matching Game").
6. List 3 to 6 notable objects or concepts visible in the image in English ("keyObjects", e.g. ["pencil", "notebook", "backpack", "ruler"]).
7. Provide a short 1-sentence description in Vietnamese of what you detected ("description", e.g. "Nhận diện bức tranh về đồ dùng học tập và lớp học").

Return ONLY a valid JSON object matching this schema without markdown fences:
{
  "topic": "string",
  "topicVi": "string",
  "suggestedTitle": "string",
  "keyObjects": ["string"],
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
                  keyObjects: Array.isArray(parsed.keyObjects) ? parsed.keyObjects : [],
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
      console.warn("[analyzeImageForTopicAction] Gemini Vision failed, attempting OpenAI fallback:", e);
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
            keyObjects: Array.isArray(parsed.keyObjects) ? parsed.keyObjects : [],
            description: parsed.description,
          };
        }
      }
    } catch (err: any) {
      console.error("[analyzeImageForTopicAction] OpenAI Vision failed:", err);
      return { success: false, error: err?.message || "Không thể phân tích hình ảnh." };
    }
  }

  return {
    success: false,
    error: "Không tìm thấy cấu hình API Key cho Vision (GEMINI_API_KEY hoặc OPENAI_API_KEY).",
  };
}

