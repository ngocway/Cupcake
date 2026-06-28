"use server";

import openai from "@/lib/openai";
import { QuestionType } from "@/components/quiz/types";
import { after } from 'next/server';
import { generateDalleImage } from '@/actions/ai-actions';
import { uploadBase64Image } from '@/actions/upload-actions';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

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
      "targetAudiences": ["kindergarten", "kid", "teen", "learner"], // Pick 1 or more suitable target audiences from this list based on the CEFR difficulty level
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

function buildInstructionsHtml(data: {
  lessonGoal: string;
  grammarFormula: string;
  examples: string[];
  quickMemoryTip: string[];
  finalSummary: string;
}, lang: 'en' | 'vi' | 'th' | 'id' = 'en'): string {
  const headers = {
    en: { goal: "Lesson Goal", keyPoints: "Key Points", examples: "Examples", tip: "Memory Tips", summary: "Summary" },
    vi: { goal: "Mục tiêu bài học", keyPoints: "Điểm chính", examples: "Ví dụ", tip: "Mẹo ghi nhớ", summary: "Tóm tắt" },
    th: { goal: "เป้าหมายการเรียนรู้", keyPoints: "จุดสำคัญ", examples: "ตัวอย่าง", tip: "เคล็ดลับในการจำ", summary: "สรุป" },
    id: { goal: "Tujuan Pelajaran", keyPoints: "Poin Kunci", examples: "Contoh", tip: "Tips Memori", summary: "Ringkasan" }
  };
  const h = headers[lang] || headers.en;

  return `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:720px;line-height:1.75;color:#2d2d2d;padding:4px 0">
<h2 style="color:#f97316;font-size:1rem;text-transform:uppercase;letter-spacing:1px;margin-top:16px;margin-bottom:4px;font-weight:bold">${h.goal}</h2>
<p style="margin:0 0 18px">${data.lessonGoal}</p>

<h2 style="color:#f97316;font-size:1rem;text-transform:uppercase;letter-spacing:1px;margin-top:16px;margin-bottom:4px;font-weight:bold">${h.keyPoints}</h2>
<div style="background:#fff7ed;border-left:4px solid #f97316;padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:18px">${data.grammarFormula}</div>

<h2 style="color:#f97316;font-size:1rem;text-transform:uppercase;letter-spacing:1px;margin-top:16px;margin-bottom:4px;font-weight:bold">${h.examples}</h2>
<ul style="margin:0 0 18px;padding-left:20px">${data.examples.map(e=>`<li style="margin-bottom:6px">${e}</li>`).join('')}</ul>

<h2 style="color:#f97316;font-size:1rem;text-transform:uppercase;letter-spacing:1px;margin-top:16px;margin-bottom:4px;font-weight:bold">${h.tip}</h2>
<ul style="margin:0 0 18px;padding-left:20px">${data.quickMemoryTip.map(t=>`<li style="margin-bottom:6px">💡 ${t}</li>`).join('')}</ul>

<h2 style="color:#f97316;font-size:1rem;text-transform:uppercase;letter-spacing:1px;margin-top:16px;margin-bottom:4px;font-weight:bold">${h.summary}</h2>
<p style="margin:0;background:#f0fdf4;padding:12px 16px;border-radius:8px;border-left:4px solid #22c55e">${data.finalSummary}</p>
</div>`;
}

export async function generateAIExerciseAction(assignmentId: string, userPromptText: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, errors: ["Chưa đăng nhập. Vui lòng đăng nhập lại."] };
  }

  if (!process.env.OPENAI_API_KEY) {
    return { success: false, errors: ["OPENAI_API_KEY chưa được cấu hình. Vui lòng thêm vào .env"] };
  }

  try {
    const systemPrompt = `You are an expert ESL content creator.
You must return the generated content STRICTLY as a JSON object matching the following structure:
{
  "title": "string (Title of the lesson)",
  "thumbnailImagePrompt": "string (Thumbnail image prompt based on the requirements)",
  "lessonGoal": "string (Goal of the lesson)",
  "grammarFormula": "string (Grammar formula explanation)",
  "examples": ["string (Example 1)", "string (Example 2)", ...],
  "quickMemoryTip": ["string (Tip 1)", "string (Tip 2)", ...],
  "finalSummary": "string (Final summary)",
  "instructionsTranslations": {
    "vi": {
      "lessonGoal": "string (Goal in Vietnamese)",
      "grammarFormula": "string (Grammar formula in Vietnamese)",
      "examples": ["string (Example 1 with its translation in parentheses, e.g. 'I study in the morning (Tôi học vào buổi sáng)')", ...],
      "quickMemoryTip": ["string (Tip 1 in Vietnamese)", ...],
      "finalSummary": "string (Final summary in Vietnamese)"
    },
    "th": {
      "lessonGoal": "string (Goal in Thai)",
      "grammarFormula": "string (Grammar formula in Thai)",
      "examples": ["string (Example 1 with its translation in parentheses, e.g. 'I study in the morning (ฉันเรียนในตอนเช้า)')", ...],
      "quickMemoryTip": ["string (Tip 1 in Thai)", ...],
      "finalSummary": "string (Final summary in Thai)"
    },
    "id": {
      "lessonGoal": "string (Goal in Indonesian)",
      "grammarFormula": "string (Grammar formula in Indonesian)",
      "examples": ["string (Example 1 with its translation in parentheses, e.g. 'I study in the morning (Saya belajar di pagi hari)')", ...],
      "quickMemoryTip": ["string (Tip 1 in Indonesian)", ...],
      "finalSummary": "string (Final summary in Indonesian)"
    }
  },
  "practiceMultipleChoice": [
    {
      "questionText": "string",
      "options": [
        { "text": "string", "isCorrect": boolean }
      ],
      "explanation": "string (English explanation, 10-30 words)",
      "explanationTranslations": {
        "vi": "string (Vietnamese translation of explanation, 10-30 words)",
        "th": "string (Thai translation of explanation, 10-30 words)",
        "id": "string (Indonesian translation of explanation, 10-30 words)"
      }
    }
  ],
  "practiceTrueFalse": [
    {
      "statement": "string",
      "isTrue": boolean,
      "explanation": "string (English explanation, 10-30 words)",
      "explanationTranslations": {
        "vi": "string (Vietnamese translation of explanation, 10-30 words)",
        "th": "string (Thai translation of explanation, 10-30 words)",
        "id": "string (Indonesian translation of explanation, 10-30 words)"
      }
    }
  ]
}

Strict Rules for Question Generation, Difficulty, & Theme Alignment:
1. Target Grammar Focus: All questions and option choices (correct & incorrect distractors) MUST focus strictly on the target grammar/vocabulary requested (e.g. if the lesson is about "this, that, these, those", the multiple-choice options must only consist of these four words, and the correct option must be one of them. Do not include unrelated distractors like "which", "what", "where", "it", etc. as correct answers).
2. CEFR Level & Target Audience Alignment: You must strictly align sentence structures and vocabulary complexity with the provided CEFR Level and Target Audience.
   - For Pre-A1 / A1 level (Beginners / Kids): Use extremely simple, declarative sentences under 6 words (e.g. "_____ is a bird." -> options: This/That/These/Those). Avoid interrogative or complex clauses unless absolutely necessary.
   - For A2 / B1 level: Use compound/complex sentences, introducing more varied vocabulary.
3. No Invalid Combinations: Do not generate questions where the correct answer contradicts the target theme. Every question must have one clearly correct choice that tests the target grammar.

Strict Rules for Translation & Localization (ELT Guidelines):
1. Target Grammar & Vocabulary: In translations (vi, th, id), DO NOT translate target grammar terms, prepositions, or vocabulary being taught (e.g. keep "am, is, are", "in, on, at", "countable/uncountable", "must, mustn't" exactly as-is in English).
2. Example Sentences: In translations (vi, th, id), keep the example sentences fully in English, but add their translation in parentheses (e.g. "I study in the morning (Tôi học vào buổi sáng)"). Do NOT create mixed hybrid sentences (e.g. do NOT write "Tôi học in buổi sáng").
3. Explanation length: Keep all question explanations (English and translations) between 10 to 30 words. Focus directly on the grammar logic, explaining why the correct choice is correct. Avoid meta-phrases like "The correct answer is...".

Do not include any Markdown wrapping like \`\`\`json. Output strictly raw JSON. Ensure all questions and options are in English only.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPromptText }
      ],
      response_format: { type: "json_object" }
    });

    const responseText = completion.choices[0].message.content;
    if (!responseText) {
      return { success: false, errors: ["Không nhận được phản hồi từ OpenAI"] };
    }

    const result = JSON.parse(responseText);
    
    // Validate output structure
    if (!result.title || !result.practiceMultipleChoice || !result.practiceTrueFalse) {
      return { success: false, errors: ["Dữ liệu phản hồi từ AI không đúng cấu trúc yêu cầu."] };
    }

    // Convert Goal, Grammar, Examples, Tip, Summary to instructionsHtml
    const instructionsHtml = buildInstructionsHtml({
      lessonGoal: result.lessonGoal || "",
      grammarFormula: result.grammarFormula || "",
      examples: result.examples || [],
      quickMemoryTip: result.quickMemoryTip || [],
      finalSummary: result.finalSummary || ""
    }, 'en');

    const viHtml = result.instructionsTranslations?.vi ? buildInstructionsHtml({
      lessonGoal: result.instructionsTranslations.vi.lessonGoal || "",
      grammarFormula: result.instructionsTranslations.vi.grammarFormula || "",
      examples: result.instructionsTranslations.vi.examples || [],
      quickMemoryTip: result.instructionsTranslations.vi.quickMemoryTip || [],
      finalSummary: result.instructionsTranslations.vi.finalSummary || ""
    }, 'vi') : null;

    const thHtml = result.instructionsTranslations?.th ? buildInstructionsHtml({
      lessonGoal: result.instructionsTranslations.th.lessonGoal || "",
      grammarFormula: result.instructionsTranslations.th.grammarFormula || "",
      examples: result.instructionsTranslations.th.examples || [],
      quickMemoryTip: result.instructionsTranslations.th.quickMemoryTip || [],
      finalSummary: result.instructionsTranslations.th.finalSummary || ""
    }, 'th') : null;

    const idHtml = result.instructionsTranslations?.id ? buildInstructionsHtml({
      lessonGoal: result.instructionsTranslations.id.lessonGoal || "",
      grammarFormula: result.instructionsTranslations.id.grammarFormula || "",
      examples: result.instructionsTranslations.id.examples || [],
      quickMemoryTip: result.instructionsTranslations.id.quickMemoryTip || [],
      finalSummary: result.instructionsTranslations.id.finalSummary || ""
    }, 'id') : null;

    const instructionsTranslations = {
      vi: viHtml,
      th: thHtml,
      id: idHtml
    };

    // Run background task for DALL-E image generation & update DB
    if (result.thumbnailImagePrompt && assignmentId && assignmentId !== 'new') {
      after(async () => {
        try {
          console.log(`[Background] Starting DALL-E image generation for assignment ${assignmentId}`);
          const imageResult = await generateDalleImage(result.thumbnailImagePrompt);
          if (imageResult.base64) {
            const uploadResult = await uploadBase64Image(imageResult.base64, assignmentId);
            if (uploadResult.success && uploadResult.url) {
              await prisma.assignment.update({
                where: { id: assignmentId },
                data: { thumbnail: uploadResult.url }
              });
              console.log(`[Background] Successfully updated thumbnail for assignment ${assignmentId} to: ${uploadResult.url}`);
            } else {
              console.error(`[Background] Failed to upload DALL-E image to R2:`, uploadResult.error);
            }
          } else {
            console.error(`[Background] DALL-E generation failed:`, imageResult.error);
          }
        } catch (err) {
          console.error(`[Background] Error in DALL-E generation task:`, err);
        }
      });
    }

    return {
      success: true,
      title: result.title,
      instructions: instructionsHtml,
      instructionsTranslations,
      shortDescription: result.lessonGoal || "",
      multipleChoice: result.practiceMultipleChoice,
      trueFalse: result.practiceTrueFalse,
      thumbnailImagePrompt: result.thumbnailImagePrompt
    };
  } catch (error: any) {
    console.error("OpenAI API Error in custom prompt quiz generator:", error);
    return { success: false, errors: ["Lỗi khi phân tích bằng AI: " + (error.message || String(error))] };
  }
}

export async function generateAIExerciseFromUrlAction(assignmentId: string, url: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, errors: ["Chưa đăng nhập. Vui lòng đăng nhập lại."] };
  }

  if (!process.env.OPENAI_API_KEY) {
    return { success: false, errors: ["OPENAI_API_KEY chưa được cấu hình. Vui lòng thêm vào .env"] };
  }

  try {
    const { scrapeUrlContent } = await import('@/lib/url-scraper');
    console.log(`[AI Quiz Generator] Scraping URL: ${url}`);
    const scrapedText = await scrapeUrlContent(url);
    
    // Clean text a bit
    const cleanText = scrapedText.trim().replace(/\s+/g, ' ');

    console.log(`[AI Quiz Generator] Scraped content length: ${cleanText.length}. Calling OpenAI...`);

    const systemPrompt = `You are an expert ESL content creator.
You must return the generated content STRICTLY as a JSON object matching the following structure:
{
  "title": "string (Title of the lesson)",
  "thumbnailImagePrompt": "string (Thumbnail image prompt based on the requirements)",
  "lessonGoal": "string (Goal of the lesson)",
  "grammarFormula": "string (Grammar formula explanation)",
  "examples": ["string (Example 1)", "string (Example 2)", ...],
  "quickMemoryTip": ["string (Tip 1)", "string (Tip 2)", ...],
  "finalSummary": "string (Final summary)",
  "instructionsTranslations": {
    "vi": {
      "lessonGoal": "string (Goal in Vietnamese)",
      "grammarFormula": "string (Grammar formula in Vietnamese)",
      "examples": ["string (Example 1 with its translation in parentheses, e.g. 'I study in the morning (Tôi học vào buổi sáng)')", ...],
      "quickMemoryTip": ["string (Tip 1 in Vietnamese)", ...],
      "finalSummary": "string (Final summary in Vietnamese)"
    },
    "th": {
      "lessonGoal": "string (Goal in Thai)",
      "grammarFormula": "string (Grammar formula in Thai)",
      "examples": ["string (Example 1 with its translation in parentheses, e.g. 'I study in the morning (ฉันเรียนในตอนเช้า)')", ...],
      "quickMemoryTip": ["string (Tip 1 in Thai)", ...],
      "finalSummary": "string (Final summary in Thai)"
    },
    "id": {
      "lessonGoal": "string (Goal in Indonesian)",
      "grammarFormula": "string (Grammar formula in Indonesian)",
      "examples": ["string (Example 1 with its translation in parentheses, e.g. 'I study in the morning (Saya belajar di pagi hari)')", ...],
      "quickMemoryTip": ["string (Tip 1 in Indonesian)", ...],
      "finalSummary": "string (Final summary in Indonesian)"
    }
  },
  "practiceMultipleChoice": [
    {
      "questionText": "string",
      "options": [
        { "text": "string", "isCorrect": boolean }
      ],
      "explanation": "string (English explanation, 10-30 words)",
      "explanationTranslations": {
        "vi": "string (Vietnamese translation of explanation, 10-30 words)",
        "th": "string (Thai translation of explanation, 10-30 words)",
        "id": "string (Indonesian translation of explanation, 10-30 words)"
      }
    }
  ],
  "practiceTrueFalse": [
    {
      "statement": "string",
      "isTrue": boolean,
      "explanation": "string (English explanation, 10-30 words)",
      "explanationTranslations": {
        "vi": "string (Vietnamese translation of explanation, 10-30 words)",
        "th": "string (Thai translation of explanation, 10-30 words)",
        "id": "string (Indonesian translation of explanation, 10-30 words)"
      }
    }
  ]
}

Strict Rules for Question Generation, Difficulty, & Theme Alignment:
1. Target Grammar Focus: All questions and option choices (correct & incorrect distractors) MUST focus strictly on the target grammar/vocabulary requested (e.g. if the lesson is about "this, that, these, those", the multiple-choice options must only consist of these four words, and the correct option must be one of them. Do not include unrelated distractors like "which", "what", "where", "it", etc. as correct answers).
2. CEFR Level & Target Audience Alignment: You must strictly align sentence structures and vocabulary complexity with the provided CEFR Level and Target Audience.
   - For Pre-A1 / A1 level (Beginners / Kids): Use extremely simple, declarative sentences under 6 words (e.g. "_____ is a bird." -> options: This/That/These/Those). Avoid interrogative or complex clauses unless absolutely necessary.
   - For A2 / B1 level: Use compound/complex sentences, introducing more varied vocabulary.
3. No Invalid Combinations: Do not generate questions where the correct answer contradicts the target theme. Every question must have one clearly correct choice that tests the target grammar.

Strict Rules for Translation & Localization (ELT Guidelines):
1. Target Grammar & Vocabulary: In translations (vi, th, id), DO NOT translate target grammar terms, prepositions, or vocabulary being taught (e.g. keep "am, is, are", "in, on, at", "countable/uncountable", "must, mustn't" exactly as-is in English).
2. Example Sentences: In translations (vi, th, id), keep the example sentences fully in English, but add their translation in parentheses (e.g. "I study in the morning (Tôi học vào buổi sáng)"). Do NOT create mixed hybrid sentences (e.g. do NOT write "Tôi học in buổi sáng").
3. Explanation length: Keep all question explanations (English and translations) between 10 to 30 words. Focus directly on the grammar logic, explaining why the correct choice is correct. Avoid meta-phrases like "The correct answer is...".

Do not include any Markdown wrapping like \`\`\`json. Output strictly raw JSON. Ensure all questions and options are in English only.`;

    const userPrompt = `Read the following text scraped from an exercise webpage:
---
${cleanText}
---

Your tasks:
1. Extract the questions present in the text above. You must ONLY extract the existing questions and options (with their correct states) from the text. DO NOT invent or make up any new questions.
2. Extract at most 30 questions in total (prioritizing multiple choice, and then true/false if any are found). If there are fewer than 30 questions, extract all of them.
3. Automatically generate the lesson title, lesson goal (2-3 sentences), grammar formula, examples (6-8 sentences), memory tips, and final summary based on the theme of these questions.
4. Create a prompt for an image generator (16:9 ratio, flat design 2D cartoon style) that matches the theme of this lesson.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" }
    });

    const responseText = completion.choices[0].message.content;
    if (!responseText) {
      return { success: false, errors: ["Không nhận được phản hồi từ OpenAI"] };
    }

    const result = JSON.parse(responseText);
    
    // Validate output structure
    if (!result.title || !result.practiceMultipleChoice || !result.practiceTrueFalse) {
      return { success: false, errors: ["Dữ liệu phản hồi từ AI không đúng cấu trúc yêu cầu."] };
    }

    // Convert Goal, Grammar, Examples, Tip, Summary to instructionsHtml
    const instructionsHtml = buildInstructionsHtml({
      lessonGoal: result.lessonGoal || "",
      grammarFormula: result.grammarFormula || "",
      examples: result.examples || [],
      quickMemoryTip: result.quickMemoryTip || [],
      finalSummary: result.finalSummary || ""
    }, 'en');

    const viHtml = result.instructionsTranslations?.vi ? buildInstructionsHtml({
      lessonGoal: result.instructionsTranslations.vi.lessonGoal || "",
      grammarFormula: result.instructionsTranslations.vi.grammarFormula || "",
      examples: result.instructionsTranslations.vi.examples || [],
      quickMemoryTip: result.instructionsTranslations.vi.quickMemoryTip || [],
      finalSummary: result.instructionsTranslations.vi.finalSummary || ""
    }, 'vi') : null;

    const thHtml = result.instructionsTranslations?.th ? buildInstructionsHtml({
      lessonGoal: result.instructionsTranslations.th.lessonGoal || "",
      grammarFormula: result.instructionsTranslations.th.grammarFormula || "",
      examples: result.instructionsTranslations.th.examples || [],
      quickMemoryTip: result.instructionsTranslations.th.quickMemoryTip || [],
      finalSummary: result.instructionsTranslations.th.finalSummary || ""
    }, 'th') : null;

    const idHtml = result.instructionsTranslations?.id ? buildInstructionsHtml({
      lessonGoal: result.instructionsTranslations.id.lessonGoal || "",
      grammarFormula: result.instructionsTranslations.id.grammarFormula || "",
      examples: result.instructionsTranslations.id.examples || [],
      quickMemoryTip: result.instructionsTranslations.id.quickMemoryTip || [],
      finalSummary: result.instructionsTranslations.id.finalSummary || ""
    }, 'id') : null;

    const instructionsTranslations = {
      vi: viHtml,
      th: thHtml,
      id: idHtml
    };

    // Run background task for DALL-E image generation & update DB
    if (result.thumbnailImagePrompt && assignmentId && assignmentId !== 'new') {
      after(async () => {
        try {
          console.log(`[Background] Starting DALL-E image generation for assignment ${assignmentId}`);
          const imageResult = await generateDalleImage(result.thumbnailImagePrompt);
          if (imageResult.base64) {
            const uploadResult = await uploadBase64Image(imageResult.base64, assignmentId);
            if (uploadResult.success && uploadResult.url) {
              await prisma.assignment.update({
                where: { id: assignmentId },
                data: { thumbnail: uploadResult.url }
              });
              console.log(`[Background] Successfully updated thumbnail for assignment ${assignmentId} to: ${uploadResult.url}`);
            } else {
              console.error(`[Background] Failed to upload DALL-E image to R2:`, uploadResult.error);
            }
          } else {
            console.error(`[Background] DALL-E generation failed:`, imageResult.error);
          }
        } catch (err) {
          console.error(`[Background] Error in DALL-E generation task:`, err);
        }
      });
    }

    return {
      success: true,
      title: result.title,
      instructions: instructionsHtml,
      instructionsTranslations,
      shortDescription: result.lessonGoal || "",
      multipleChoice: result.practiceMultipleChoice,
      trueFalse: result.practiceTrueFalse,
      thumbnailImagePrompt: result.thumbnailImagePrompt
    };
  } catch (error: any) {
    console.error("OpenAI API Error in URL exercise generator:", error);
    return { success: false, errors: ["Lỗi khi phân tích bằng AI: " + (error.message || String(error))] };
  }
}
