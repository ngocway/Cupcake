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
      model: "gpt-4o-mini",
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
  imageUrl?: string | null;
}, lang: string = 'en'): string {
  const headers: Record<string, { goal: string; keyPoints: string; examples: string; tip: string; summary: string }> = {
    en: { goal: "Lesson Goal", keyPoints: "Key Points", examples: "Examples", tip: "Memory Tips", summary: "Summary" },
    vi: { goal: "Mục tiêu bài học", keyPoints: "Điểm chính", examples: "Ví dụ", tip: "Mẹo ghi nhớ", summary: "Tóm tắt" },
    th: { goal: "เป้าหมายการเรียนรู้", keyPoints: "จุดสำคัญ", examples: "ตัวอย่าง", tip: "เคล็ดลับในการจำ", summary: "สรุป" },
    id: { goal: "Tujuan Pelajaran", keyPoints: "Poin Kunci", examples: "Contoh", tip: "Tips Memori", summary: "Ringkasan" },
    zh: { goal: "课程目标", keyPoints: "关键点", examples: "例子", tip: "记忆技巧", summary: "总结" },
    hi: { goal: "पाठ का उद्देश्य", keyPoints: "मुख्य बिंदु", examples: "उदाहरण", tip: "याद रखने के टिप्स", summary: "निष्कर्ष" },
    ja: { goal: "レッスンの目標", keyPoints: "キーポイント", examples: "例", tip: "覚え方のヒント", summary: "まとめ" },
    es: { goal: "Objetivo de la lección", keyPoints: "Puntos clave", examples: "Ejemplos", tip: "Consejos de memoria", summary: "Resumen" },
    ar: { goal: "هدف الدرس", keyPoints: "النقاط الرئيسية", examples: "أمثلة", tip: "نصائح للذاكرة", summary: "ملخص" },
    fr: { goal: "Objectif de la leçon", keyPoints: "Points clés", examples: "Exemples", tip: "Conseils de mémoire", summary: "Résumé" },
    ko: { goal: "학습 목표", keyPoints: "핵심 포인트", examples: "예시", tip: "기억 팁", summary: "요약" },
    pt: { goal: "Objetivo da lição", keyPoints: "Pontos-chave", examples: "Exemplos", tip: "Dicas de memória", summary: "Resumo" },
    ru: { goal: "Цель урока", keyPoints: "Ключевые моменты", examples: "Примеры", tip: "Советы для запоминания", summary: "Итог" },
    de: { goal: "Lernziel", keyPoints: "Wichtige Punkte", examples: "Beispiele", tip: "Gedächtnisstützen", summary: "Zusammenfassung" }
  };
  const h = headers[lang] || headers.en;

  const imageTag = data.imageUrl 
    ? `<div style="margin: 18px 0; text-align: center;"><img src="${data.imageUrl}" style="max-width:100%; max-height:480px; height:auto; border-radius:12px; border: 1px solid #e2e8f0; display: block; margin: 0 auto;" alt="Instruction Material" /></div>`
    : '';

  return `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:720px;line-height:1.75;color:#2d2d2d;padding:4px 0">
<h2 style="color:#f97316;font-size:1rem;text-transform:uppercase;letter-spacing:1px;margin-top:16px;margin-bottom:4px;font-weight:bold">${h.goal}</h2>
<p style="margin:0 0 18px">${data.lessonGoal}</p>

${imageTag}

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

export async function generateAIExerciseAction(
  assignmentId: string, 
  userPromptText: string
) {
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
  "instructionsHtml": "string (A full, detailed, beautifully styled HTML string for the English lesson — see detailed requirements below)",
  "practiceMultipleChoice": [
    {
      "questionText": "string",
      "options": [
        { "text": "string", "isCorrect": boolean }
      ],
      "explanation": "string (English explanation, 10-30 words)",
      "explanationTranslations": {
        "vi": "string"
      }
    }
  ],
  "practiceTrueFalse": [
    {
      "statement": "string",
      "isTrue": boolean,
      "explanation": "string (English explanation, 10-30 words)",
      "explanationTranslations": {
        "vi": "string"
      }
    }
  ]
}

== DETAILED REQUIREMENTS FOR "instructionsHtml" ==
The "instructionsHtml" must be a COMPLETE, DETAILED, BEAUTIFULLY STYLED HTML lesson guide in English.
Structure it like a professional grammar textbook chapter — adapt section names to the topic but always include:

1. INTRODUCTION: What is [topic]? — A clear definition paragraph.
2. WHEN DO WE USE IT? — Sub-sections A, B, C... for each use case. Each sub-section: bold label + explanation + 2-3 example sentences in <ul>.
3. SENTENCE STRUCTURE — Affirmative, Negative, Question forms. EACH form MUST use a styled <table>. Below each table, show 2-3 examples.
4. SPELLING / FORM RULES (if applicable) — Grouped rules with word transformation examples (e.g. play → playing).
5. COMMON TIME EXPRESSIONS / SIGNAL WORDS (if applicable) — Grouped by category in <ul>.
6. COMPARISON TABLE (if applicable, e.g. Present Simple vs Present Continuous) — MUST use a <table> with headers, comparing contrasting uses. Provide 2-3 comparison example sentences below.
7. SPECIAL NOTES / EXCEPTIONS (e.g. Stative Verbs) — Correct ✅ and Incorrect ❌ examples.
8. REMEMBER / QUICK SUMMARY — Bullet checklist (✅ items) + grammar formula(s) in a highlighted box.

== HTML STYLING RULES ==
Use these exact inline styles:
- Outer wrapper: <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:720px;line-height:1.75;color:#2d2d2d;padding:4px 0">
- Section headings (h2): <h2 style="color:#f97316;font-size:1rem;text-transform:uppercase;letter-spacing:1px;margin-top:20px;margin-bottom:6px;font-weight:bold">
- Sub-headings (h3): <h3 style="color:#374151;font-size:0.95rem;margin-top:14px;margin-bottom:4px;font-weight:bold">
- Paragraphs: <p style="margin:0 0 10px">
- Lists: <ul style="margin:0 0 14px;padding-left:22px"> and <li style="margin-bottom:5px">
- Formula box: <div style="background:#fff7ed;border-left:4px solid #f97316;padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:14px">
- Tables: <table style="width:100%;border-collapse:collapse;margin:14px 0;font-size:0.9rem;text-align:left">
- Table headers: <th style="background:#f8fafc;border-bottom:2px solid #e2e8f0;padding:10px 12px;font-weight:bold;color:#1e293b">
- Table cells (even rows): <td style="border-bottom:1px solid #f1f5f9;padding:10px 12px;color:#334155">
- Table cells (odd rows): <td style="background:#f8fafc;border-bottom:1px solid #f1f5f9;padding:10px 12px;color:#334155">
- Correct: <span style="color:#16a34a;font-weight:bold">✅ ...</span>  Incorrect: <span style="color:#dc2626;font-weight:bold">❌ ...</span>
- Summary box: <p style="margin:0;background:#f0fdf4;padding:12px 16px;border-radius:8px;border-left:4px solid #22c55e">

== COMPLEXITY BASED ON CEFR LEVEL ==
- A1/Pre-A1: Very short sentences, max 2-3 sub-sections, small tables (2-3 rows), skip complex exceptions. ~400 words visible text.
- A2: Simple sentences, 3-4 sub-sections, standard tables, 1-2 exceptions. ~550 words.
- B1: Full detail, all sections, full tables, all exceptions. ~700 words.
- B2+: Nuanced explanations, extended comparison tables. ~900 words.

== RULES FOR QUESTIONS ==
1. Grammar Focus: All questions MUST focus strictly on the target grammar/vocabulary.
2. CEFR Alignment: Strictly align sentence complexity with the provided CEFR Level and Target Audience.
3. Distractor Ambiguity: Every question must have a clearly correct choice. NO ambiguous distractors.
4. ONE correct answer per question ("isCorrect": true exactly once).
5. Tailor questions to the provided "Selected Learning Goals".

Do not include any Markdown wrapping like \`\`\`json. Output strictly raw JSON. All questions and options must be in English only.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
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

    // Parse topic name from teacher's userPromptText
    let topicTitle = "";
    const topicMatch = userPromptText.match(/grammar topic:\s*["']?([^"'\r\n]+)["']?/i);
    if (topicMatch) {
      topicTitle = topicMatch[1].replace(/^["']|["']$/g, '').trim();
      const partMatch = userPromptText.match(/This is Part (\d+) of a/i);
      if (partMatch) {
        topicTitle = `${topicTitle} Part ${partMatch[1]}`;
      }
    }

    if (topicTitle) {
      result.title = topicTitle;
    }
    
    // Validate output structure
    if (!result.title || !result.practiceMultipleChoice || !result.practiceTrueFalse) {
      return { success: false, errors: ["Dữ liệu phản hồi từ AI không đúng cấu trúc yêu cầu."] };
    }

    // Build the English instructions HTML
    let instructionsHtml = result.instructionsHtml || "";
    // Wrap with system font styles if AI didn't wrap it
    if (instructionsHtml && !instructionsHtml.startsWith('<div style="font-family')) {
      instructionsHtml = `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:720px;line-height:1.75;color:#2d2d2d;padding:4px 0">${instructionsHtml}</div>`;
    }

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

    // Translate instructions to Vietnamese synchronously
    let instructionsTranslations: Record<string, string> = {};
    if (instructionsHtml) {
      try {
        console.log(`[AI Quiz Generator] Translating instructions to VI synchronously...`);
        const translationCompletion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: INSTRUCTIONS_TRANSLATE_SYSTEM_PROMPT + '\nTarget language code: "vi".' },
            { role: 'user', content: instructionsHtml }
          ],
          response_format: { type: 'json_object' }
        });
        const parsed = JSON.parse(translationCompletion.choices[0].message.content || '{}');
        const viHtml = parsed.translatedInstructions || '';
        if (viHtml) {
          instructionsTranslations = { vi: viHtml };
          console.log(`[AI Quiz Generator] Successfully generated VI translation.`);
        }
      } catch (err) {
        console.error(`[AI Quiz Generator] Synchronous translation failed:`, err);
      }
    }

    return {
      success: true,
      title: result.title,
      instructions: instructionsHtml,
      instructionsTranslations,
      shortDescription: "",
      multipleChoice: result.practiceMultipleChoice,
      trueFalse: result.practiceTrueFalse,
      thumbnailImagePrompt: result.thumbnailImagePrompt
    };
  } catch (error: any) {
    console.error("OpenAI API Error in custom prompt quiz generator:", error);
    return { success: false, errors: ["Lỗi khi phân tích bằng AI: " + (error.message || String(error))] };
  }
}

export async function generateAIExerciseFromUrlAction(
  assignmentId: string, 
  url: string,
  context?: {
    subject?: string;
    targetAudiences?: string[];
    primaryAudience?: string;
    primaryLevel?: string;
    learningGoals?: string[];
  }
) {
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
      "examples": ["string (Example 1 in English, kept completely in English without translation)", ...],
      "quickMemoryTip": ["string (Tip 1 in Vietnamese)", ...],
      "finalSummary": "string (Final summary in Vietnamese)"
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
        "vi": "string (Vietnamese translation of explanation, 10-30 words)"
      }
    }
  ],
  "practiceTrueFalse": [
    {
      "statement": "string",
      "isTrue": boolean,
      "explanation": "string (English explanation, 10-30 words)",
      "explanationTranslations": {
        "vi": "string (Vietnamese translation of explanation, 10-30 words)"
      }
    }
  ]
}

Strict Rules for Question Generation, Difficulty, & Theme Alignment:
1. Target Grammar Focus: All questions and option choices (correct & incorrect distractors) MUST focus strictly on the target grammar/vocabulary requested (e.g. if the lesson is about "this, that, these, those", the multiple-choice options must only consist of these four words, and the correct option must be one of them. Do not include unrelated distractors like "which", "what", "where", "it", etc. as correct answers).
2. CEFR Level & Target Audience Alignment: You must strictly align sentence structures, grammar forms, and vocabulary complexity of all instructions, examples, questions, and option choices with the provided CEFR Level and Target Audience:
   - For Pre-A1 / A1 level (Beginners / Kids): Keep sentences extremely short (1 to 8 words). Use simple Subject-Verb-Object (SVO) structures (e.g. "The cat is small.", "I like apples."). Do not use complex or compound clauses. Limit grammar strictly to Present Simple, Present Continuous, and basic prepositions of place (in, on, under). Limit vocabulary to extremely basic, concrete categories (colors, animals, toys, family members, simple foods).
   - For A2 level (Elementary): Keep sentences short to medium (8 to 12 words). You may use simple compound sentences linked by "because", "so", "or", "then". Limit grammar to Present Simple, Past Simple (including regular and common irregular verbs: went, ate, saw), Future with "be going to" or "will", simple Comparatives/Superlatives, and basic modals (can, could, should, must).
   - For B1 level (Intermediate): Keep sentences medium length (12 to 18 words). You can use complex sentences with relative clauses (who, which, that, where) and basic conditional clauses. Limit grammar to Present Perfect, Past Continuous vs Past Simple, First and Second Conditionals, and simple Passive Voice.
   - For B2 level (Upper-Intermediate): Keep sentences longer and more complex (15 to 25 words). Introduce academic, idiomatic, and specific professional terms, nuanced synonyms, Past/Future Perfect, Third/Mixed Conditionals, past modals (should have), and emphasis/inversion structures.
3. No Invalid Combinations: Do not generate questions where the correct answer contradicts the target theme. Every question must have one clearly correct choice that tests the target grammar.
4. Number of Options & Correct Answers:
   - For each multiple-choice question, the number of options is flexible and can be decided by the AI (typically 2 to 4 options).
   - Crucially, there MUST strictly be exactly ONE correct answer per question ("isCorrect": true must appear exactly once in the options array). You must NEVER generate multiple correct answers for a single question.
5. Selected Learning Goals Alignment: You must tailor the questions, statements, and distractors to align with the provided "Selected Learning Goals":
   - If "Writing & Grammar" is selected: Focus questions on grammar formulas, syntax, word ordering, tense usage, and correct word forms.
   - If "Vocabulary" is selected: Focus questions on word meanings, synonyms, antonyms, context clues, and vocabulary usage.
   - If "Communication" is selected: Focus questions on conversational English, dialogues, responses to questions, situations, greetings, and everyday phrases.
   - If "Reading" is selected: Focus questions on reading comprehension, identifying correct meanings of short passages or statements, and understanding text context.
   - If "IELTS & TOEFL" is selected: Focus questions on academic phrasing, complex synonyms, formal register, and advanced sentence transformations.

Strict Rules for Translation & Localization (ELT Guidelines):
1. Target Grammar & Vocabulary: In translations (vi, th, id), DO NOT translate target grammar terms, prepositions, or vocabulary being taught (e.g. keep "am, is, are", "in, on, at", "countable/uncountable", "must, mustn't" exactly as-is in English). Also do NOT translate core grammar formula symbols and components like "Subject", "Verb", "Object", "S + am/is/are + V-ing", "Verb-ing" when they appear in structures.
2. Example Sentences: In translations (vi, th, id), keep all example sentences completely in English. Do NOT translate them and do NOT append translations in parentheses. Keep them identical to the English version.
3. Vocabulary Conjugation: In translations (vi, th, id), do NOT translate word transformation or conjugation sequences (e.g. keep "play -> playing" as-is, do not translate to "chơi -> đang chơi").
4. Explanation length: Keep all question explanations (English and translations) between 10 to 30 words. Focus directly on the grammar logic, explaining why the correct choice is correct. Avoid meta-phrases like "The correct answer is...".

Do not include any Markdown wrapping like \`\`\`json. Output strictly raw JSON. Ensure all questions and options are in English only.`;

    let contextHeader = "";
    if (context) {
      contextHeader = `
Context Information for AI:
- Subject: ${context.subject || ""}
- Target Audiences: ${(context.targetAudiences || []).join(', ')}
- Primary Audience (Tone): ${context.primaryAudience || ""}
- CEFR Level: ${context.primaryLevel || ""}
- Selected Learning Goals: ${(context.learningGoals || []).join(', ')}

==================
`;
    }

    const userPrompt = `${contextHeader}Read the following text scraped from an exercise webpage:
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
      model: "gpt-4o-mini",
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

    const instructionsTranslations = {
      vi: viHtml
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


// ---------------------------------------------------------------------------
// BACKGROUND: Translate instructionsHtml to Vietnamese and save to DB.
// Called by QuizEditor after the main content has been saved (real ID known).
// ---------------------------------------------------------------------------
const INSTRUCTIONS_TRANSLATE_SYSTEM_PROMPT = `You are an expert English Language Teaching (ELT) translator.
Your task is to translate the provided English HTML content (an English learning lesson/grammar guide) into the target language.

CRITICAL TRANSLATION RULES FOR ESL/ELT CONTENT:
1. Translate ONLY explanations, instructions, headings, and general descriptions inside HTML tags (text inside <h2>, <h3>, <p>, <li>, <div>, <th>, <td>).
2. DO NOT translate English example sentences used to demonstrate a grammar point. Keep them exactly in English.
   - Example: "I am reading a book." must remain "I am reading a book." (do NOT translate).
3. DO NOT translate vocabulary conjugation or spelling rule examples.
   - Example: "play → playing" must remain "play → playing".
4. DO NOT translate core grammar formula symbols: "Subject", "Verb", "Object", "S + am/is/are + V-ing", "Verb-ing", "Infinitive", "Past Participle" etc.
5. DO NOT change any HTML tags, styles, class names, or attributes. Keep the HTML structure exactly identical.
6. Do NOT translate image URLs or src attributes.

You must return a JSON object with a single key "translatedInstructions":
{
  "translatedInstructions": "string (the translated HTML string)"
}

Do not include any Markdown wrapping like \`\`\`json. Output strictly raw JSON.`;

export async function saveInstructionsTranslationAction(
  assignmentId: string,
  instructionsHtml: string
): Promise<{ success: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false };
  if (!assignmentId || assignmentId === 'new' || !instructionsHtml) return { success: false };

  after(async () => {
    try {
      console.log(`[Background] Translating instructions to VI for assignment ${assignmentId}...`);
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: INSTRUCTIONS_TRANSLATE_SYSTEM_PROMPT + '\nTarget language code: "vi".' },
          { role: 'user', content: instructionsHtml }
        ],
        response_format: { type: 'json_object' }
      });
      const parsed = JSON.parse(completion.choices[0].message.content || '{}');
      const viHtml = parsed.translatedInstructions || '';
      if (viHtml) {
        await prisma.assignment.update({
          where: { id: assignmentId },
          data: { instructionsTranslations: { vi: viHtml } as any }
        });
        console.log(`[Background] Saved VI translation for assignment ${assignmentId}`);
        try {
          const { invalidateMaterialCache } = await import('@/lib/cached-queries');
          await invalidateMaterialCache(assignmentId);
          console.log(`[Background] Invalidated cache for assignment ${assignmentId}`);
        } catch (cacheErr) {
          console.error(`[Background] Failed to invalidate cache for ${assignmentId}:`, cacheErr);
        }
      }
    } catch (err) {
      console.error(`[Background] Failed to translate instructions for ${assignmentId}:`, err);
    }
  });

  return { success: true };
}
