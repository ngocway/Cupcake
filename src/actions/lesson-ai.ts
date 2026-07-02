"use server";

import openai from "@/lib/openai";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { invalidateMaterialCache } from "@/lib/cached-queries";
import fs from 'fs';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';
import { generateUniqueSlug } from '@/lib/slugify';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { reindexAssignment, reindexLesson } from '@/lib/ai-embeddings';
import { getCefrPedagogicalGuidelines } from "@/lib/cefr-guidelines";


export interface AILessonResponse {
  title: string;
  passage: string;
  shortDescription: string;
  thumbnail?: string;
  vocabulary: {
    word: string;
    pronunciation: string;
    meaningVi: string;
    meaningTh: string;
    meaningId: string;
    meaningZh: string;
    meaningHi: string;
    meaningJa: string;
    meaningEs: string;
    meaningAr: string;
    meaningFr: string;
    meaningKo: string;
    meaningPt: string;
    meaningRu: string;
    meaningDe: string;
    explanationEn: string;
    examples: string[];
  }[];
  questions: {
    type: "MULTIPLE_CHOICE" | "MULTIPLE_SELECT" | "TRUE_FALSE";
    questionText: string;
    options?: { text: string; isCorrect: boolean }[];
    isTrue?: boolean;
    explanation: string;
  }[];
}

function logProgress(msg: string) {
  const logDir = path.join(os.tmpdir(), 'scratch');
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
  wordCount = 400,
  providedPassage,
  additionalInstructions,
  generateVocab = false
}: {
  topic: string;
  gradeLevel: string;
  subject: string;
  difficulty: string;
  language?: string;
  questionCount?: number;
  wordCount?: number;
  providedPassage?: string;
  additionalInstructions?: string;
  generateVocab?: boolean;
}): Promise<AILessonResponse | { error: string }> {
  logProgress(`Starting OpenAI Generation (gpt-4o-mini) for topic: ${topic}, Language: ${language}, ProvidedPassage: ${!!providedPassage}, ExtraInstructions: ${!!additionalInstructions}, GenerateVocab: ${generateVocab}`);
  
  if (!process.env.OPENAI_API_KEY) {
    logProgress(`ERROR: OPENAI_API_KEY is missing`);
    return { error: "OPENAI_API_KEY is not configured." };
  }

  try {
    const isVietnamese = language === "Tiếng Việt";
    let prompt = "";
    const guidelines = getCefrPedagogicalGuidelines(difficulty);
    
    if (providedPassage) {
      // New logic: treat providedPassage as specific content generation instructions
      prompt = `Create a complete educational lesson for students in the ${language} language on the topic: "${topic}".
      
      CONTENT GENERATION INSTRUCTIONS:
      """
      ${providedPassage}
      """
      
      Subject: ${subject}
      Difficulty level: ${difficulty}
      Target Language for all content (Title, Passage, Questions): ${language}

      CEFR LEVEL PEDAGOGICAL GUIDELINES (YOU MUST STRICTLY COMPLY WITH THESE FOR THE PASSAGE, VOCABULARY AND QUESTIONS):
      ${guidelines}
      
      YOUR TASKS:
      1. Write a complete reading passage (Body Text) in ${language} following the CONTENT GENERATION INSTRUCTIONS provided above.
         IMPORTANT requirements for the passage:
         - The passage MUST be structured logically and divided into 3-5 distinct paragraphs. Each paragraph MUST be separated by EXACTLY two newlines (double newlines, e.g., "\n\n") to ensure proper paragraph structure and formatting.
         - You MUST wrap key vocabulary words (the ones in the vocabulary list below) inside the passage using this exact HTML structure: <span class="custom-vocab-marker" data-vocab-id="WORD_LOWERCASE">WORD</span>.
         - Example: If "sustainable" is a vocab word, write <span class="custom-vocab-marker" data-vocab-id="sustainable">sustainable</span> in the passage.
      2. Identify 5-8 key vocabulary words from the passage you just wrote.
      3. Create a Vocabulary list of those key words with definitions. Provide pronunciation, the English definition, and translations for these native languages: Vietnamese (meaningVi), Thai (meaningTh), Indonesian (meaningId), Mandarin Chinese (meaningZh), Hindi (meaningHi), Japanese (meaningJa), Spanish (meaningEs), Arabic (meaningAr), French (meaningFr), Korean (meaningKo), Portuguese (meaningPt), Russian (meaningRu), and German (meaningDe).
      4. Create a set of ${questionCount} questions based on the passage (mix of MULTIPLE_CHOICE, MULTIPLE_SELECT, and TRUE_FALSE) written COMPLETELY in ${language}.
         For EACH question, you MUST provide a very detailed "explanation" (at least 2-3 sentences). The explanation MUST explicitly state why the correct answer is correct AND explicitly analyze why the other options are incorrect. IMPORTANT: The explanation MUST be written entirely in ENGLISH. DO NOT refer to options by their position (e.g., "the first option", "option A") since options will be shuffled. Always quote the actual text of the option.
         ${additionalInstructions ? `IMPORTANT: Follow these extra instructions for the questions: ${additionalInstructions}` : ""}
      5. Provide an engaging Title and a Short Description based on the passage you wrote.
      6. Select a high-quality, relevant Unsplash stock photo to serve as a thumbnail image for this lesson. Use a real, valid stock photo URL from the domain https://images.unsplash.com/.
         Examples of correct Unsplash URLs:
         - For English/Language: https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80
         - For Science/Tech: https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80
         - For General/Study: https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80
         - For Kids: https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80
      
      CRITICAL: ALL generated text MUST be in ${language}.`;
    } else {
      prompt = `Create a complete lesson for students in the ${language} language on the topic: "${topic}".
      Subject: ${subject}
      Difficulty level: ${difficulty}
      Target Language for all content (Title, Passage, Questions): ${language}

      CEFR LEVEL PEDAGOGICAL GUIDELINES (YOU MUST STRICTLY COMPLY WITH THESE FOR THE PASSAGE, VOCABULARY AND QUESTIONS):
      ${guidelines}
      
      The lesson MUST include:
      1. An engaging Title written COMPLETELY in ${language}.
      2. A Short Description (1-2 sentences) written COMPLETELY in ${language}.
      3. A reading Passage (Body Text) written COMPLETELY in ${language} with approximately ${wordCount} words. 
         IMPORTANT requirements for the passage:
         - The passage MUST be structured logically and divided into 3-5 distinct paragraphs. Each paragraph MUST be separated by EXACTLY two newlines (double newlines, e.g., "\n\n") to ensure proper paragraph structure and formatting.
         - You MUST wrap key vocabulary words (the ones in the vocabulary list below) inside the passage using this exact HTML structure: <span class="custom-vocab-marker" data-vocab-id="WORD_LOWERCASE">WORD</span>.
         - Example: If "sustainable" is a vocab word, write <span class="custom-vocab-marker" data-vocab-id="sustainable">sustainable</span> in the passage.
      4. A Vocabulary list of 5-8 key words from the passage with definitions. Provide pronunciation, the English definition, and translations for these native languages: Vietnamese (meaningVi), Thai (meaningTh), Indonesian (meaningId), Mandarin Chinese (meaningZh), Hindi (meaningHi), Japanese (meaningJa), Spanish (meaningEs), Arabic (meaningAr), French (meaningFr), Korean (meaningKo), Portuguese (meaningPt), Russian (meaningRu), and German (meaningDe).
      5. A set of ${questionCount} questions based on the passage (mix of MULTIPLE_CHOICE, MULTIPLE_SELECT, and TRUE_FALSE) written COMPLETELY in ${language}.
         For EACH question, you MUST provide a very detailed "explanation" (at least 2-3 sentences). The explanation MUST explicitly state why the correct answer is correct AND explicitly analyze why the other options are incorrect. IMPORTANT: The explanation MUST be written entirely in ENGLISH. DO NOT refer to options by their position (e.g., "the first option", "option A") since options will be shuffled. Always quote the actual text of the option.
      6. Select a high-quality, relevant Unsplash stock photo to serve as a thumbnail image for this lesson. Use a real, valid stock photo URL from the domain https://images.unsplash.com/.
         Examples of correct Unsplash URLs:
         - For English/Language: https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80
         - For Science/Tech: https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80
         - For General/Study: https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80
         - For Kids: https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80
      
      CRITICAL: ALL text in title, passage, and questions MUST be in ${language}. DO NOT use English if the Target Language is Vietnamese.`;
    }

    prompt += `
    
    Return the result in JSON format matching this structure:
    {
      "title": "string",
      "shortDescription": "string",
      "thumbnail": "string",
      "passage": "string",
      "vocabulary": [
        {
          "word": "string",
          "pronunciation": "string",
          "meaningVi": "string",
          "meaningTh": "string",
          "meaningId": "string",
          "meaningZh": "string",
          "meaningHi": "string",
          "meaningJa": "string",
          "meaningEs": "string",
          "meaningAr": "string",
          "meaningFr": "string",
          "meaningKo": "string",
          "meaningPt": "string",
          "meaningRu": "string",
          "meaningDe": "string",
          "explanationEn": "string",
          "examples": ["string"]
        }
      ],
      "questions": [
        {
          "type": "MULTIPLE_CHOICE" | "MULTIPLE_SELECT" | "TRUE_FALSE",
          "questionText": "string",
          "options": [{"text": "string", "isCorrect": boolean}],
          "isTrue": boolean,
          "explanation": "string"
        }
      ]
    }`;

    logProgress(`Calling OpenAI API (gpt-4o-mini)...`);
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
    
    logProgress(`OpenAI response received. Length: ${text.length}`);
    return JSON.parse(text) as AILessonResponse;

  } catch (error: any) {
    logProgress(`OpenAI API Error: ${error.message}`);
    console.error("AI Lesson Gen Error:", error);
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
    const assignmentTitle = (data.title || "Untitled AI Lesson").trim();
    const assignmentSlug = await generateUniqueSlug(assignmentTitle, 'assignment');
    const lessonSlug = await generateUniqueSlug(assignmentTitle, 'lesson');

    const vocabMap = new Map();
    data.vocabulary.forEach(v => {
      vocabMap.set(v.word.toLowerCase(), v);
    });

    let passageHtml = data.passage || "";
    
    // If it doesn't contain block-level elements (like <p>, <br>, <div>), wrap in paragraphs
    if (!/<(p|br|div)\b/i.test(passageHtml)) {
      // Normalize line endings
      let normalizedText = passageHtml.replace(/\r\n/g, '\n').replace(/\n\s*\n/g, '\n\n').trim();
      
      let paragraphs = normalizedText.split('\n\n').map(p => p.trim()).filter(p => p.length > 0);
      
      // Fallback 1: If there's only 1 paragraph but single newlines exist, split if lines are substantial
      if (paragraphs.length === 1 && normalizedText.includes('\n')) {
        const singleLines = normalizedText.split('\n').map(p => p.trim()).filter(p => p.length > 0);
        if (singleLines.length >= 2 && singleLines.every(line => line.length > 30)) {
          paragraphs = singleLines;
        }
      }
      
      // Fallback 2: Auto-chunking extremely long paragraphs (> 150 words)
      if (paragraphs.length === 1) {
        const words = paragraphs[0].split(/\s+/);
        if (words.length > 150) {
          const sentences = paragraphs[0].match(/[^.!?]+[.!?]+(\s+|$)/g) || [paragraphs[0]];
          if (sentences.length > 3) {
            paragraphs = [];
            let currentPara = "";
            sentences.forEach((sentence, index) => {
              currentPara += sentence;
              if ((index + 1) % 3 === 0 || index === sentences.length - 1) {
                paragraphs.push(currentPara.trim());
                currentPara = "";
              }
            });
          }
        }
      }
      
      // Wrap paragraphs in HTML <p> tags
      passageHtml = paragraphs.map(p => `<p>${p}</p>`).join('');
    }

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
            data-meaning-th="${v.meaningTh || ''}" 
            data-meaning-id="${v.meaningId || ''}" 
            data-meaning-zh="${v.meaningZh || ''}" 
            data-meaning-hi="${v.meaningHi || ''}" 
            data-meaning-ja="${v.meaningJa || ''}" 
            data-meaning-es="${v.meaningEs || ''}" 
            data-meaning-ar="${v.meaningAr || ''}" 
            data-meaning-fr="${v.meaningFr || ''}" 
            data-meaning-ko="${v.meaningKo || ''}" 
            data-meaning-pt="${v.meaningPt || ''}" 
            data-meaning-ru="${v.meaningRu || ''}" 
            data-meaning-de="${v.meaningDe || ''}" 
            data-explanation-en="${v.explanationEn.replace(/"/g, '&quot;')}" 
            data-examples="${v.examples.join('; ').replace(/"/g, '&quot;')}"
            style="border-bottom: 2px dashed #facc15; cursor: help; color: #854d0e; font-weight: 700;"
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
            <div style="margin-top: 5px;">
              <span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-weight: bold; margin-right: 8px;">TH</span>
              <span>${v.meaningTh || 'N/A'}</span>
            </div>
            <div style="margin-top: 5px;">
              <span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-weight: bold; margin-right: 8px;">ID</span>
              <span>${v.meaningId || 'N/A'}</span>
            </div>
            <div style="margin-top: 5px; font-size: 0.95em; color: #475569;">
              <strong style="margin-right: 8px;">Other:</strong>
              <span>ZH: ${v.meaningZh || 'N/A'} | HI: ${v.meaningHi || 'N/A'} | JA: ${v.meaningJa || 'N/A'} | ES: ${v.meaningEs || 'N/A'} | AR: ${v.meaningAr || 'N/A'} | FR: ${v.meaningFr || 'N/A'} | KO: ${v.meaningKo || 'N/A'} | PT: ${v.meaningPt || 'N/A'} | RU: ${v.meaningRu || 'N/A'} | DE: ${v.meaningDe || 'N/A'}</span>
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

    let questionsData: any[] = [];
    if (data.questions && data.questions.length > 0) {
      questionsData = data.questions.map((q, idx) => {
        let questionContent: any;
        if (q.type === "MULTIPLE_CHOICE" || q.type === "MULTIPLE_SELECT") {
          questionContent = {
            type: q.type, // Preserve the specific type (choice vs select)
            questionText: q.questionText,
            options: q.options || []
          };
        } else {
          questionContent = {
            type: q.type,
            statement: q.questionText,
            isTrue: q.isTrue ?? true
          };
        }

        return {
          type: (q.type === "MULTIPLE_SELECT" ? "MULTIPLE_CHOICE" : q.type) as any,
          orderIndex: idx,
          points: 1.0,
          explanation: q.explanation,
          content: JSON.stringify(questionContent),
          isAiGenerated: true,
          isBanked: false,
        };
      });
    }

    const assignmentId = randomUUID();

    // Normalize subject to match taxonomy config subject id ("english", "math", "global")
    let dbSubject = data.subject || "Khác";
    const s = dbSubject.trim().toLowerCase();
    if (s === 'english' || s === 'tiếng anh' || s === 'tieng anh') dbSubject = 'english';
    else if (s === 'math' || s === 'toán' || s === 'toán học' || s === 'toan') dbSubject = 'math';
    else if (s === 'science' || s === 'global' || s === 'global & science' || s === 'khoa học' || s === 'khoa hoc') dbSubject = 'global';

    // Fallback thumbnail if DALL-E failed
    let finalThumbnail = data.thumbnail;
    if (!finalThumbnail) {
      finalThumbnail = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(assignmentTitle)}`;
    }

    await prisma.assignment.create({
      data: {
        id: assignmentId,
        title: assignmentTitle,
        slug: assignmentSlug,
        shortDescription: data.shortDescription,
        readingText: passageHtml,
        gradeLevel: data.gradeLevel,
        subject: dbSubject,
        materialType: "READING",
        status: "DRAFT",
        teacherId: session.user.id,
        isAiGenerated: true,
        instructions: vocabHtml,
        thumbnail: finalThumbnail,
        targetAudiences: [],
        learningGoals: []
      }
    });

    await prisma.lesson.create({
      data: {
        title: assignmentTitle,
        slug: lessonSlug,
        description: data.shortDescription,
        teacherId: session.user.id,
        assignmentId: assignmentId,
        thumbnail: finalThumbnail,
        targetAudiences: [],
        learningGoals: []
      }
    });

    if (questionsData.length > 0) {
      const finalQuestionsData = questionsData.map(q => ({
        ...q,
        assignmentId: assignmentId,
      }));

      await prisma.question.createMany({
        data: finalQuestionsData
      });
    }

    const result = assignmentId;

    revalidatePath("/teacher/lessons");
    revalidatePath("/teacher/materials");
    revalidatePath("/admin/materials");

    // AI embedding: index this new lesson+assignment in background
    const _lessonAssignmentId = assignmentId;
    setImmediate(() => {
      reindexAssignment(_lessonAssignmentId).catch(err =>
        console.error('[lesson-ai] AI reindex assignment failed:', err)
      );
    });
    
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
  wordCount: number;
  providedPassage?: string;
  additionalInstructions?: string;
  generateVocab?: boolean;
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
      wordCount: params.wordCount,
      providedPassage: params.providedPassage,
      additionalInstructions: params.additionalInstructions,
      generateVocab: params.generateVocab
    });

    if ("error" in aiResponse) {
      return { error: aiResponse.error };
    }

    const saveResponse = await saveAILesson({
      ...aiResponse,
      gradeLevel: params.gradeLevel,
      subject: params.subject,
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
      gradeLevel: "Khác",
      subject: "Khác",
      difficulty: "MEDIUM",
      questionCount: 5,
      wordCount: 400
    });

    if ("error" in aiResponse) return { error: aiResponse.error };

    const saveResponse = await saveAILesson({
      ...aiResponse,
      gradeLevel: "Khác",
      subject: "Khác"
    });

    return saveResponse;
  } catch (error: any) {
    return { error: "Failed." };
  }
}

export interface ParsedLessonData {
  title: string;
  subject: string;
  gradeLevel: string;
  targetAudience: string;
  shortDescription: string;
  tags?: string;
  passage: string;
  questions: {
    type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "CLOZE_TEST";
    content: any;
    explanation: string;
    points: number;
  }[];
}

export async function saveParsedLesson(data: ParsedLessonData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const assignmentTitle = (data.title || "Untitled Lesson").trim();
    const assignmentSlug = await generateUniqueSlug(assignmentTitle, 'assignment');
    const lessonSlug = await generateUniqueSlug(assignmentTitle, 'lesson');

    let passageHtml = data.passage || "";
    if (passageHtml && !/<(p|br|div)\b/i.test(passageHtml)) {
      // Normalize line endings
      let normalizedText = passageHtml.replace(/\r\n/g, '\n').replace(/\n\s*\n/g, '\n\n').trim();
      
      let paragraphs = normalizedText.split('\n\n').map(p => p.trim()).filter(p => p.length > 0);
      
      // Fallback 1: If there's only 1 paragraph but single newlines exist, split if lines are substantial
      if (paragraphs.length === 1 && normalizedText.includes('\n')) {
        const singleLines = normalizedText.split('\n').map(p => p.trim()).filter(p => p.length > 0);
        if (singleLines.length >= 2 && singleLines.every(line => line.length > 30)) {
          paragraphs = singleLines;
        }
      }
      
      // Fallback 2: Auto-chunking extremely long paragraphs (> 150 words)
      if (paragraphs.length === 1) {
        const words = paragraphs[0].split(/\s+/);
        if (words.length > 150) {
          const sentences = paragraphs[0].match(/[^.!?]+[.!?]+(\s+|$)/g) || [paragraphs[0]];
          if (sentences.length > 3) {
            paragraphs = [];
            let currentPara = "";
            sentences.forEach((sentence, index) => {
              currentPara += sentence;
              if ((index + 1) % 3 === 0 || index === sentences.length - 1) {
                paragraphs.push(currentPara.trim());
                currentPara = "";
              }
            });
          }
        }
      }
      
      // Wrap paragraphs in HTML <p> tags
      passageHtml = paragraphs.map(p => `<p>${p}</p>`).join('');
    }

    let finalTags = "";
    if (data.tags) {
      const dbPopularTags = await prisma.tag.findMany({
        where: { isPopular: true },
        select: { name: true }
      });
      const popularTags = dbPopularTags.map(t => t.name);
      const tagList = data.tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
      const allowedTags: string[] = [];
      let customTagCount = 0;
      for (const tag of tagList) {
        const isPopular = popularTags.some(p => p.toLowerCase() === tag.toLowerCase());
        if (isPopular) {
          allowedTags.push(tag);
        } else {
          if (customTagCount < 3) {
            allowedTags.push(tag);
            customTagCount++;
          }
        }
      }
      finalTags = allowedTags.join(',');
    }

    let questionsData: any[] = [];
    if (data.questions && data.questions.length > 0) {
      questionsData = data.questions.map((q, idx) => ({
        type: q.type as any,
        orderIndex: idx,
        points: q.points || 1.0,
        explanation: q.explanation || "",
        content: JSON.stringify(q.content),
        isAiGenerated: false
      }));
    }

    const assignmentId = randomUUID();

    await prisma.assignment.create({
      data: {
        id: assignmentId,
        title: assignmentTitle,
        slug: assignmentSlug,
        shortDescription: data.shortDescription,
        readingText: passageHtml,
        gradeLevel: data.gradeLevel || "Khác",
        subject: data.subject || "Khác",
        materialType: "READING",
        status: "DRAFT",
        teacherId: session.user.id,
        targetAudiences: data.targetAudience ? [data.targetAudience.toLowerCase()] : [],
        tags: finalTags
      }
    });

    await prisma.lesson.create({
      data: {
        title: assignmentTitle,
        slug: lessonSlug,
        description: data.shortDescription,
        teacherId: session.user.id,
        assignmentId: assignmentId,
        targetAudiences: data.targetAudience ? [data.targetAudience.toLowerCase()] : []
      }
    });

    if (questionsData.length > 0) {
      const finalQuestionsData = questionsData.map(q => ({
        ...q,
        assignmentId: assignmentId
      }));

      await prisma.question.createMany({
        data: finalQuestionsData
      });
    }

    const resultId = assignmentId;

    revalidatePath("/teacher/lessons");
    revalidatePath("/teacher/materials");

    // AI embedding: index this new lesson+assignment in background
    const _savedAssId = assignmentId;
    setImmediate(() => {
      reindexAssignment(_savedAssId).catch(err =>
        console.error('[lesson-ai] AI reindex assignment (parsed) failed:', err)
      );
    });

    return { success: true, id: resultId };
  } catch (err: any) {
    console.error("Save Parsed Lesson Error:", err);
    return { error: err.message };
  }
}

const getR2Client = () => {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('Cloudflare R2 environment variables are missing');
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
  });
};

function getWavHeader(dataSize: number, sampleRate = 24000, numChannels = 1, bitsPerSample = 16) {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const fileSize = 36 + dataSize;
  const header = Buffer.alloc(44);

  header.write("RIFF", 0);
  header.writeUInt32LE(fileSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  header.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return header;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

function splitIntoSentences(text: string): string[] {
  const regex = /[^.!?]+[.!?]+(?:\s|$)/g;
  const matches = text.match(regex);
  if (!matches) {
    return [text];
  }
  return matches.map(s => s.trim()).filter(Boolean);
}

function chunkSentences(sentences: string[], isPreA1A1 = false): string[][] {
  const chunks: string[][] = [];
  if (isPreA1A1) {
    for (const sentence of sentences) {
      chunks.push([sentence]);
    }
  } else {
    let i = 0;
    while (i < sentences.length) {
      if (i + 1 < sentences.length) {
        chunks.push([sentences[i], sentences[i + 1]]);
        i += 2;
      } else {
        chunks.push([sentences[i]]);
        i += 1;
      }
    }
  }
  return chunks;
}

export async function generateTTSHelper(text: string, voice = "Aoede", speed = 1.0, userId: string, mode = "inline", specificModel?: string) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrlBase = process.env.NEXT_PUBLIC_R2_URL;

  if (!bucketName || !publicUrlBase) {
    throw new Error('R2_BUCKET_NAME or NEXT_PUBLIC_R2_URL is not set');
  }

  let buffer: Buffer;
  let lastError: any = null;

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY or GOOGLE_API_KEY. Cannot generate audio using Google TTS.");
  }

  const modelsToTry = specificModel ? [specificModel] : [
    "gemini-3.1-flash-tts-preview",
    "gemini-2.5-flash-preview-tts",   // correct 2.5 flash name (works)
    "gemini-2.5-pro-preview-tts",     // correct 2.5 pro name (works, but low 2 RPM limit)
    "gemini-2.5-flash-lite-tts-preview",
    "gemini-2.5-flash-tts",
    "gemini-2.5-pro-tts",
  ];
  let success = false;

  for (const modelName of modelsToTry) {
    try {
      console.log(`Trying Gemini TTS with model: ${modelName}`);
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

      let rateStr = "100%";
      if (speed !== undefined && speed !== null) {
        rateStr = `${Math.round(speed * 100)}%`;
      } else if (mode !== "inline" && mode !== "global") {
        rateStr = "slow";
      }

      const escapedText = escapeXml(text);
      const ssmlText = `<speak><prosody rate="${rateStr}">${escapedText}</prosody></speak>`;

      const geminiReqBody = {
        contents: [
          {
            role: "user",
            parts: [{ text: ssmlText }]
          }
        ],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voice || "Aoede"
              }
            }
          }
        }
      };

      let response = null;
      const retries = 3;

      for (let i = 0; i < retries; i++) {
        let is404 = false;
        let waitTime = 800 * (i + 1);

        try {
          response = await fetch(geminiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(geminiReqBody)
          });
          if (response.ok) {
            break;
          }
          const errText = await response.text();
          lastError = new Error(`Status ${response.status}: ${errText}`);
          console.warn(`${modelName} attempt ${i + 1} failed: ${lastError.message}`);
          
          if (response.status === 404) {
            is404 = true;
            console.warn(`${modelName} returned status 404. Skipping model.`);
            break;
          }

          if (response.status === 429) {
            try {
              const errJson = JSON.parse(errText);
              const details = errJson.error?.details || [];
              const retryInfo = details.find((d: any) => d["@type"] === "type.googleapis.com/google.rpc.RetryInfo");
              if (retryInfo && retryInfo.retryDelay) {
                const seconds = parseFloat(retryInfo.retryDelay.replace("s", ""));
                if (!isNaN(seconds)) {
                  if (seconds > 600) {
                    console.log(`Daily limit exhausted for ${modelName} (retryDelay: ${seconds}s). Skipping model immediately.`);
                    is404 = true;
                    break;
                  }
                  waitTime = Math.min((seconds * 1000) + 1000, 65000); // Wait up to 65 seconds
                  console.log(`Rate limited (429) for ${modelName}. Waiting ${waitTime}ms before retry...`);
                }
              }
            } catch (jsonErr) {
              // ignore parse errors
            }
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`${modelName} attempt ${i + 1} failed with fetch error: ${err.message}. Retrying...`);
        }

        if (is404) {
          break;
        }

        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }

      if (!response || !response.ok) {
        throw new Error(`Failed to generate TTS with ${modelName} after ${retries} attempts. Last error: ${lastError?.message}`);
      }

      const data = await response.json();
      const candidate = data.candidates?.[0];
      const parts = candidate?.content?.parts || [];
      const inlineData = parts.find((p: any) => p.inlineData)?.inlineData;

      if (!inlineData || !inlineData.data) {
        throw new Error(`No audio data returned from ${modelName}`);
      }

      const pcmBuffer = Buffer.from(inlineData.data, "base64");
      const wavHeader = getWavHeader(pcmBuffer.length, 24000, 1, 16);
      buffer = Buffer.concat([wavHeader, pcmBuffer]);
      
      success = true;
      break;

    } catch (err: any) {
      console.warn(`TTS generation with model ${modelName} failed:`, err.message);
      lastError = err;
    }
  }

  if (!success) {
    console.error("All Gemini TTS models failed.");
    throw lastError || new Error("Failed to generate audio using Google TTS API");
  }

  const s3Client = getR2Client();
  const ext = "wav";
  const contentType = "audio/wav";
  const fileName = `tts-gemini-${userId}-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
  const filePath = `uploads/${fileName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: filePath,
    Body: buffer!,
    ContentType: contentType,
  });

  await s3Client.send(command);

  const publicUrl = `${publicUrlBase.replace(/\/$/, '')}/${filePath}`;

  let words = null;
  if (mode === "global") {
    try {
      const { toFile } = await import("openai");
      const file = await toFile(buffer!, "speech.wav", { type: contentType });
      const transcription = await openai.audio.transcriptions.create({
        file,
        model: "whisper-1",
        response_format: "verbose_json",
        timestamp_granularities: ["word"],
      });
      words = transcription.words;
    } catch (err) {
      console.error("OpenAI Whisper alignment failed in helper:", err);
    }
  }

  return { url: publicUrl, words };
}

async function generateDalleImageHelper(prompt: string, model: "dall-e-3" | "dall-e-2" = "dall-e-3", size: string = "1024x1024", userId: string) {
  let response = null;
  let lastError: any = null;

  // 1. Try OpenAI DALL-E first if key exists
  if (process.env.OPENAI_API_KEY) {
    const modelsToTry = [model, "dall-e-3", "dall-e-2"];
    const uniqueModels = Array.from(new Set(modelsToTry));

    for (const m of uniqueModels) {
      try {
        console.log(`Generating DALL-E image using model: ${m}`);
        const quality = m === "dall-e-3" ? "standard" : undefined;
        
        let requestedSize = size;
        if (size === "1024x576" || size === "1792x1024") {
          if (m === "dall-e-3") {
            requestedSize = "1792x1024";
          } else {
            requestedSize = "1024x1024";
          }
        }

        response = await openai.images.generate({
          model: m as any,
          prompt,
          n: 1,
          size: requestedSize as any,
          quality: quality as any
        });
        if (response?.data?.[0]) {
          console.log(`Successfully generated image using DALL-E model: ${m}`);
          break;
        }
      } catch (err: any) {
        console.error(`Failed to generate DALL-E image with model ${m}:`, err.message);
        lastError = err;
      }
    }
  }

  // 2. Fallback to Gemini Imagen if DALL-E fails
  if (!response && process.env.GEMINI_API_KEY) {
    const geminiModels = ["gemini-2.5-flash-image", "gemini-3.1-flash-image"];
    for (const gModel of geminiModels) {
      try {
        console.log(`DALL-E failed. Falling back to Gemini Imagen model: ${gModel}...`);
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${gModel}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseModalities: ["IMAGE"]
            }
          })
        });

        const responseData = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(responseData.error?.message || `HTTP status: ${res.status}`);
        }

        const base64Data = responseData.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
        if (base64Data) {
          response = {
            data: [{ b64_json: base64Data }]
          };
          console.log(`Successfully generated image using Gemini Imagen model: ${gModel}`);
          break;
        }
      } catch (err: any) {
        console.error(`Gemini Imagen fallback model ${gModel} failed:`, err.message);
        lastError = err;
      }
    }
  }

  // 3. Fallback to DeepInfra FLUX if Gemini fails
  if (!response && process.env.DEEPINFRA_API_KEY) {
    try {
      console.log(`Gemini Imagen failed. Falling back to DeepInfra FLUX.1 Schnell...`);
      let fluxSize = size;
      if (size === "1792x1024" || size === "1024x576") {
        fluxSize = "1024x576";
      }

      const res = await fetch(`https://api.deepinfra.com/v1/openai/images/generations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.DEEPINFRA_API_KEY}`
        },
        body: JSON.stringify({
          model: "black-forest-labs/FLUX-1-schnell",
          prompt: prompt,
          n: 1,
          size: fluxSize,
          response_format: "b64_json"
        })
      });
      const responseData = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(responseData.error?.message || `HTTP status: ${res.status}`);
      }
      if (responseData.data?.[0]?.b64_json) {
        response = {
          data: [{ b64_json: responseData.data[0].b64_json }]
        };
        console.log(`Successfully generated image using DeepInfra FLUX.1 Schnell`);
      }
    } catch (err: any) {
      console.error(`DeepInfra FLUX fallback failed:`, err.message);
      lastError = err;
    }
  }

  if (!response?.data?.[0]) {
    throw new Error(`Failed to generate image from AI: ${lastError?.message || "No working model found"}`);
  }

  const imgData = response.data[0];
  let buffer: Buffer;
  let mimeType = "image/png";
  let ext = "png";

  if (imgData.b64_json) {
    buffer = Buffer.from(imgData.b64_json, "base64");
  } else if ((imgData as any).url) {
    const imageUrl = (imgData as any).url;
    const imgResponse = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });

    if (!imgResponse.ok) {
      throw new Error(`Failed to fetch generated image from OpenAI (Status: ${imgResponse.status})`);
    }

    const arrayBuffer = await imgResponse.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
    mimeType = imgResponse.headers.get('content-type') || 'image/png';
    ext = mimeType.split('/')[1] || 'png';
    if (ext === 'jpeg') ext = 'jpg';
  } else {
    throw new Error("No image URL or b64_json data returned from OpenAI");
  }

  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrlBase = process.env.NEXT_PUBLIC_R2_URL;

  if (!bucketName || !publicUrlBase) {
    throw new Error('R2_BUCKET_NAME or NEXT_PUBLIC_R2_URL is not set');
  }

  const s3Client = getR2Client();
  const fileName = `img-${userId}-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
  const filePath = `uploads/${fileName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: filePath,
    Body: buffer,
    ContentType: mimeType,
  });

  await s3Client.send(command);

  return `${publicUrlBase.replace(/\/$/, '')}/${filePath}`;
}

const progressCache = new Map<string, { status: string; percent: number }>();

function setGenProgress(userId: string, status: string, percent: number) {
  progressCache.set(userId, { status, percent });
  try {
    const logDir = path.join(os.tmpdir(), 'scratch');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
    const progressFile = path.join(logDir, `progress-${userId}.json`);
    fs.writeFileSync(progressFile, JSON.stringify({ status, percent }));
  } catch (err) {
    console.error("Failed to write progress file:", err);
  }
}

export async function getGenProgress() {
  const session = await auth();
  if (!session?.user?.id) return { status: "", percent: 0 };
  
  const userId = session.user.id;
  if (progressCache.has(userId)) {
    return progressCache.get(userId);
  }
  
  try {
    const progressFile = path.join(os.tmpdir(), 'scratch', `progress-${userId}.json`);
    if (fs.existsSync(progressFile)) {
      const content = fs.readFileSync(progressFile, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Failed to read progress file:", err);
  }
  
  return { status: "", percent: 0 };
}

export async function generateAILessonFully(params: {
  topic: string;
  learningGoals: string[];
  subject: string;
  targetAudiences: string[];
  audienceLevels: Record<string, string>;
  language: string;
  length: string;
  vocabCount: number;
  mcqCount: number;
  mcqMultiCount: number;
  tfCount: number;
  clozeCount: number;
  reference?: string;
  ttsVoice?: string;
  ttsSpeed?: number;
}) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== 'ADMIN' && session.user.role !== 'TEACHER')) {
    return { error: "Unauthorized: Access denied." };
  }

  setGenProgress(session.user.id, "Đang khởi tạo cấu trúc và phân tích tham số...", 5);

  const {
    topic, learningGoals, subject, targetAudiences, audienceLevels, language, length,
    vocabCount, mcqCount, mcqMultiCount, tfCount, clozeCount,
    reference, ttsVoice = "Aoede", ttsSpeed = 1.0
  } = params;

  try {
    let lessonWarnings: string[] = [];
    // Parse length parameter to calculate target word count
    let targetWordCount = 400;
    const lenLower = length ? length.toLowerCase() : "";
    if (lenLower.includes("100") || lenLower.includes("siêu ngắn") || lenLower.includes("super short")) {
      targetWordCount = 100;
    } else if (lenLower.includes("200") || lenLower.includes("ngắn") || lenLower.includes("short")) {
      targetWordCount = 200;
    } else if (lenLower.includes("600") || lenLower.includes("dài") || lenLower.includes("long")) {
      targetWordCount = 600;
    } else if (lenLower.includes("800") || lenLower.includes("very long") || lenLower.includes("rất dài")) {
      targetWordCount = 800;
    }

    // Priority: lowest age -> lowest level
    const audienceOrder = ["kindergarten", "kid", "teen", "learner"];
    const primaryAudience = audienceOrder.find(a => targetAudiences.includes(a)) || "kid";
    const primaryLevel = audienceLevels[primaryAudience] || "A1";
    const guidelines = getCefrPedagogicalGuidelines(primaryLevel);

    // 1. GENERATE LESSON JSON
    setGenProgress(session.user.id, "Đang soạn thảo nội dung bài học bằng AI (gpt-4o-mini)...", 10);
    const gptPrompt = `Create a complete educational lesson for students in JSON format.
    Topic: "${topic}"
    Subject/Category: "${subject}"
    Target Audiences: "${targetAudiences.join(', ')}"
    Primary Audience for Content Tone: "${primaryAudience}"
    Primary CEFR Target Level: "${primaryLevel}"
    Language: "${language}"
    Target Reading Text Length: EXACTLY ${targetWordCount} words. The final text MUST contain at least ${targetWordCount - 30} words. This is a strict constraint!
    Vocabulary count: ${vocabCount}
    MCQ count: ${mcqCount}
    MCQ Multi count: ${mcqMultiCount}
    True/False count: ${tfCount}
    Cloze count: ${clozeCount}
    Selected Learning Goals of this lesson: ${learningGoals.join(", ")}
    ${reference ? `Reference material / instructions: "${reference}"` : ""}

    CEFR LEVEL PEDAGOGICAL GUIDELINES (YOU MUST STRICTLY COMPLY WITH THESE FOR THE PASSAGE, VOCABULARY AND QUESTIONS):
    ${guidelines}

    CRITICAL REQUIREMENTS FOR THE READING PASSAGE, VOCABULARY & QUESTIONS:
    - The reading passage MUST contain at least ${targetWordCount - 30} words and be around ${targetWordCount} words in total.
    - Write a detailed, fully-developed text with multiple sentences per paragraph.
    - The passage MUST be structured logically and divided into 3-5 distinct paragraphs.
    - The "vocabulary" array MUST contain EXACTLY ${vocabCount} key words. No more, no less! This is a strict constraint. All of these ${vocabCount} vocabulary words MUST be extracted directly from the reading passage text.
    - You MUST generate EXACTLY the requested number of questions of each type:
      * MULTIPLE_CHOICE (single answer, marked with "isMultiple": false): EXACTLY ${mcqCount} questions.
      * MULTIPLE_CHOICE (multi-select / multiple correct answers, marked with "isMultiple": true): EXACTLY ${mcqMultiCount} questions.
      * TRUE_FALSE: EXACTLY ${tfCount} questions.
      * CLOZE_TEST: EXACTLY ${clozeCount} questions.
      * Total questions in the "questions" array MUST be EXACTLY ${mcqCount + mcqMultiCount + tfCount + clozeCount}.

    Respond STRICTLY with a JSON object matching the following structure:
    {
      "title": "An engaging title for the lesson in ${language}",
      "shortDescription": "A 1-2 sentence description in ${language}",
      "gradeLevel": "A suitable grade level (e.g. Lớp 10, Lớp 1, Khác)",
      "level": "A CEFR difficulty level (e.g. A1, A2, B1, B2)",
      "tags": "A list of relevant skill tags separated by commas",
      "passage": [
         "Paragraph 1 text",
         "Paragraph 2 text",
         ...
      ],
      "vocabulary": [
        {
          "word": "word",
          "pronunciation": "/IPA/",
          "meaningVi": "Vietnamese meaning (SHORT direct translation)",
          "meaningTh": "Thai meaning (SHORT)",
          "meaningId": "Indonesian meaning (SHORT)",
          "meaningZh": "Mandarin Chinese meaning (SHORT)",
          "meaningHi": "Hindi meaning (SHORT)",
          "meaningJa": "Japanese meaning (SHORT)",
          "meaningEs": "Spanish meaning (SHORT)",
          "meaningAr": "Arabic meaning (SHORT)",
          "meaningFr": "French meaning (SHORT)",
          "meaningKo": "Korean meaning (SHORT)",
          "meaningPt": "Portuguese meaning (SHORT)",
          "meaningRu": "Russian meaning (SHORT)",
          "meaningDe": "German meaning (SHORT)",
          "explanationEn": "English definition",
          "exampleSentence": "Simple English example sentence using the word"
        }
      ],
      "questions": [
        {
          "type": "MULTIPLE_CHOICE" | "TRUE_FALSE" | "CLOZE_TEST",
          "isMultiple": boolean,
          "questionText": "Question text. For CLOZE_TEST: The questionText must be a sentence containing exactly one blank word wrapped in double curly braces, for example: 'Nature is a {{magnificent}} part of our world.'. The correctAnswers array must contain the single correct word inside the braces: ['magnificent']. Do not use underscores or empty spaces for the blank.",
          "points": 1.0,
          "correctAnswers": ["Correct answer 1", ...],
          "wrongAnswers": ["Wrong answer 1", ...],
          "relevantSentences": "2-3 consecutive sentences extracted verbatim from the passage that support the correct answer of the question. MUST be identical to the sentences in the passage."
        }
      ]
    }

    STRICT RULES FOR LESSON QUESTION GENERATION:
    1. For CLOZE_TEST: You must strictly wrap the blank word inside the sentence with double curly braces (e.g., 'The park is my {{favorite}} place.') and place that word as the first element of correctAnswers. Never use underscores (____) or leave the blank word unbraced in the sentence text.
    2. No Invalid Combinations & Distractor Ambiguity: Every question must have a clearly correct choice that tests the target grammar/concept. Ensure that only ONE option is grammatically and logically correct in the context of the question. You must avoid generating "distractor" options that are also grammatically correct, natural, or acceptable alternatives in the sentence, even if they don't test the target concept.
       - For Multiple Choice (Single-Select): Ensure there is exactly one correct answer. The distractors must be completely incorrect grammatically or semantically in that specific sentence context. Do not write a sentence where another option could also fit naturally (e.g., if testing singular vs plural, don't write "I have ____" and have both "a dog" and "dogs" as choices unless one is specifically marked correct and the other is excluded by context). Ensure that the combination of the sentence and the correct option makes perfect grammatical sense (never create nonsensical sentences like "He is his hat" to fit a grammatical formula).
       - For Multiple Choice (Multi-Select): If a question has multiple correct answers, "isCorrect" must be true for all of them, and the question text must explicitly instruct the student to select all correct options.
       - For True/False: Statements must be clear, direct, and factually unambiguous. Avoid double negatives, trick wording, or statements that are open to interpretation.
       - For Cloze Test (Fill in the blanks): The sentence must have exactly one blank, and the word to fill in must be the only logical, grammatically correct fit. Wrap the blanked word in double curly braces (e.g., {{word}}). Ensure the surrounding context doesn't contain grammatical clues that contradict the correct answer (e.g., matching subject-verb agreement).

    CRITICAL:
    - All text in title, passage, questions MUST be in ${language}.
    - DO NOT return any markdown wrapping, only the raw JSON.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an expert educational curriculum designer." },
        { role: "user", content: gptPrompt }
      ],
      response_format: { type: "json_object" }
    });

    const gptText = completion.choices[0].message.content;
    if (!gptText) throw new Error("Empty response from OpenAI");
    const parsedData = JSON.parse(gptText);

    // 2. PREPARE PASSAGE CHUNKS
    const paragraphs = parsedData.passage || [];
    const styleSuffix = "2D cartoon illustration, colorful, 16:9 ratio, English text only (very few words, max 5 words)";
    const thumbPrompt = `An illustration themed around "${topic}". ${styleSuffix}`;
    const inLessonPrompt = `An illustration of "${topic}". ${styleSuffix}`;

    const assignmentId = randomUUID();
    const placeholderThumbUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(assignmentId + "-thumb")}`;
    const placeholderContentImgUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(assignmentId + "-content")}`;

    const isPreA1A1 = primaryLevel === "pre-a1-a1" || primaryLevel === "beginner";

    const paragraphChunksList: { pIdx: number; chunkText: string }[] = [];
    for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
      const paraText = paragraphs[pIdx];
      const sentences = splitIntoSentences(paraText);
      const groups = chunkSentences(sentences, isPreA1A1);
      for (const group of groups) {
        paragraphChunksList.push({
          pIdx,
          chunkText: group.join(" ")
        });
      }
    }

    setGenProgress(session.user.id, "Đang tạo âm thanh và hình ảnh minh họa bằng AI...", 30);

    // 3. RUN TTS GENERATION AND IMAGE GENERATION IN PARALLEL
    const [
      globalTtsRes,
      chunksTtsRes,
      actualThumbUrl,
      actualInLessonUrl
    ] = await Promise.all([
      // A. Global audio generation
      (async () => {
        const fullReadingText = paragraphs.join("\n\n");
        const cleanFullText = fullReadingText.replace(/🔊/g, '').replace(/\s+/g, ' ').trim();
        if (cleanFullText) {
          try {
            console.log(`Generating global TTS with voice ${ttsVoice} and speed ${ttsSpeed}`);
            return await generateTTSHelper(cleanFullText, ttsVoice, ttsSpeed, session.user.id, "global");
          } catch (err) {
            console.error("Failed to generate global TTS audio:", err);
          }
        }
        return { url: "", words: null };
      })(),
      // B. Chunk audios generation
      Promise.all(paragraphChunksList.map(async (item, index) => {
        try {
          // Stagger calls by (index + 1) * 300ms to avoid Gemini concurrent rate limits and RPM limits
          await new Promise(resolve => setTimeout(resolve, (index + 1) * 300));
          console.log(`Generating passage chunk TTS staggered (index ${index}): "${item.chunkText}"`);
          const ttsRes = await generateTTSHelper(item.chunkText, ttsVoice, ttsSpeed, session.user.id, "inline");
          return {
            pIdx: item.pIdx,
            chunkText: item.chunkText,
            audioUrl: ttsRes.url
          };
        } catch (err) {
          console.error(`Failed to generate TTS for chunk "${item.chunkText}":`, err);
          return {
            pIdx: item.pIdx,
            chunkText: item.chunkText,
            audioUrl: ""
          };
        }
      })),
      // C. Thumbnail image generation
      generateDalleImageHelper(thumbPrompt, "dall-e-3", "1024x576", session.user.id)
        .catch(err => {
          console.error("Failed to generate thumbnail image synchronously:", err);
          return "";
        }),
      // D. In-lesson content image generation
      generateDalleImageHelper(inLessonPrompt, "dall-e-3", "1024x576", session.user.id)
        .catch(err => {
          console.error("Failed to generate content image synchronously:", err);
          return "";
        })
    ]);

    const wholeAudioUrl = globalTtsRes.url;
    const audioMetadata = globalTtsRes.words;
    const finalThumbnail = actualThumbUrl || placeholderThumbUrl;
    const finalInLessonImageUrl = actualInLessonUrl || placeholderContentImgUrl;

    const failedChunks = chunksTtsRes.filter(c => !c.audioUrl).length;
    const globalAudioFailed = !wholeAudioUrl;
    if (globalAudioFailed && failedChunks === paragraphChunksList.length && paragraphChunksList.length > 0) {
      lessonWarnings.push("Không thể tạo bất kỳ file âm thanh (audio) nào cho bài học do giới hạn API của Google/Gemini.");
    } else if (globalAudioFailed || failedChunks > 0) {
      lessonWarnings.push(`Không thể tạo đầy đủ âm thanh cho bài học (thất bại ${failedChunks}/${paragraphChunksList.length} đoạn audio).`);
    }

    if (!actualThumbUrl) {
      lessonWarnings.push("Không thể tạo ảnh thu nhỏ (thumbnail) bài học bằng DALL-E.");
    }
    if (!actualInLessonUrl) {
      lessonWarnings.push("Không thể tạo ảnh minh họa nội dung bài học bằng DALL-E.");
    }

    // 4. FORMAT LESSON READING TEXT HTML & INSERT CHUNK AUDIO MARKERS
    setGenProgress(session.user.id, "Đang định dạng văn bản bài học...", 75);
    const processedParagraphs: string[] = [];
    const allChunksData: { text: string; audioUrl: string }[] = [];
    const escapeAttr = (str: string) => str ? str.replace(/"/g, '&quot;').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';

    for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
      const pChunks = chunksTtsRes.filter(c => c.pIdx === pIdx);
      let paraHtml = "";
      for (const chunk of pChunks) {
        allChunksData.push({ text: chunk.chunkText, audioUrl: chunk.audioUrl });
        if (chunk.audioUrl) {
          const markerHtml = `<span class="inline-audio-marker text-primary bg-primary/10 rounded-full w-7 h-7 mx-1 cursor-pointer inline-flex items-center justify-center hover:bg-primary/20 transition-colors shadow-sm ring-1 ring-primary/20 align-middle" data-audio-url="${escapeAttr(chunk.audioUrl)}" contenteditable="false" draggable="true" title="Nghe Audio"><span class="material-symbols-outlined text-[16px]">volume_up</span></span>`;
          paraHtml += chunk.chunkText + markerHtml + " ";
        } else {
          paraHtml += chunk.chunkText + " ";
        }
      }
      processedParagraphs.push(`<p>${paraHtml.trim()}</p>`);
    }

    // Insert DALL-E-2 content image in the middle of readingTextHtml
    if (finalInLessonImageUrl && processedParagraphs.length > 0) {
      const middleIndex = Math.floor(processedParagraphs.length / 2);
      const imgHtml = `<div class="my-6 text-center"><img src="${finalInLessonImageUrl}" alt="Lesson illustration" style="max-width: 100%; width: 50%; display: inline-block; border-radius: 0.75rem; margin: 0.5rem;" class="custom-editable-image" /></div>`;
      processedParagraphs.splice(middleIndex, 0, imgHtml);
    }

    let readingTextHtml = processedParagraphs.join("");

    // 5. FORMAT QUESTIONS & LINK TO PASSAGE CHUNKS
    const questionsList = parsedData.questions || [];
    setGenProgress(session.user.id, "Đang xử lý và liên kết câu hỏi...", 80);

    const cleanStr = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/\s+/g, '').trim();

    const questionsData = await Promise.all(questionsList.map(async (q: any, idx: number) => {
      let contentObj: any = {};
      const qType = q.type || "MULTIPLE_CHOICE";

      if (qType === "MULTIPLE_CHOICE") {
        const correctAnswers = q.correctAnswers || [];
        const wrongAnswers = q.wrongAnswers || [];
        const isMultipleSelect = q.isMultiple || correctAnswers.length > 1;

        contentObj = {
          questionText: q.questionText,
          isMultiple: isMultipleSelect,
          options: [
            ...correctAnswers.map((t: string) => ({ id: Math.random().toString(36).substring(2), text: t, isCorrect: true })),
            ...wrongAnswers.map((t: string) => ({ id: Math.random().toString(36).substring(2), text: t, isCorrect: false }))
          ]
        };
      } else if (qType === "TRUE_FALSE") {
        const correctStr = q.correctAnswers?.[0] || "Đúng";
        const isTrue = correctStr.toLowerCase() === "đúng" || correctStr.toLowerCase() === "dung" || correctStr.toLowerCase() === "true";
        contentObj = {
          statement: q.questionText,
          isTrue: isTrue
        };
      } else if (qType === "CLOZE_TEST") {
        let text = q.questionText || "";
        const correctAnswers = q.correctAnswers || [];
        const correctWord = correctAnswers[0] || "";

        // Defensive parsing for Cloze: if the text lacks {{ }} but we have the correct answer word
        if (!text.includes("{{") && correctWord) {
          if (text.includes("________") || text.includes("_______") || text.includes("____") || text.includes("___")) {
            text = text.replace(/_{3,}/g, `{{${correctWord}}}`);
          } else {
            // Find correctWord in the sentence and wrap it
            const wordIndex = text.toLowerCase().indexOf(correctWord.toLowerCase());
            if (wordIndex !== -1) {
              const originalWord = text.substring(wordIndex, wordIndex + correctWord.length);
              text = text.substring(0, wordIndex) + `{{${originalWord}}}` + text.substring(wordIndex + correctWord.length);
            }
          }
        }

        contentObj = {
          textWithBlanks: text,
          questionText: text
        };
      }

      // Match question's relevantSentences with the best paragraph chunk
      let questionAudioUrl: string | null = null;
      let questionExplanation = q.relevantSentences || "";

      const cleanedRelevant = cleanStr(q.relevantSentences || "");
      if (cleanedRelevant) {
        let bestChunk = null;
        let highestScore = 0;

        for (const chunk of allChunksData) {
          const cleanedChunk = cleanStr(chunk.text);
          if (cleanedChunk.includes(cleanedRelevant) || cleanedRelevant.includes(cleanedChunk)) {
            bestChunk = chunk;
            break;
          }

          // Fallback word overlap match
          const chunkWords = new Set(chunk.text.toLowerCase().split(/\s+/));
          const relevantWords = (q.relevantSentences || "").toLowerCase().split(/\s+/);
          const overlap = relevantWords.filter((w: string) => chunkWords.has(w)).length;
          const score = overlap / Math.max(chunkWords.size, relevantWords.length);
          if (score > highestScore) {
            highestScore = score;
            bestChunk = chunk;
          }
        }

        // If direct match was found or word overlap score is reasonable, link it
        if (bestChunk && (highestScore > 0.3 || cleanStr(bestChunk.text).includes(cleanedRelevant) || cleanedRelevant.includes(cleanStr(bestChunk.text)))) {
          questionAudioUrl = bestChunk.audioUrl;
          questionExplanation = bestChunk.text;
        }
      }

      return {
        type: (qType === "MULTIPLE_SELECT" ? "MULTIPLE_CHOICE" : qType) as any,
        orderIndex: idx,
        points: q.points || 1.0,
        explanation: questionExplanation,
        audioUrl: questionAudioUrl,
        content: JSON.stringify(contentObj),
        isAiGenerated: true,
        isBanked: false,
      };
    }));

    // 6. VOCABULARY LIST & HIGHLIGHTS
    const vocabularies = parsedData.vocabulary || [];
    const uniqueRunId = Date.now();
    const vocabMap = new Map();

    vocabularies.forEach((v: any, index: number) => {
      const vocabId = `vocab-${uniqueRunId}-${index}`;
      vocabMap.set(v.word.toLowerCase(), { ...v, vocabId });
    });

    // Replace first occurrence of vocabulary words in reading text (tokenized to avoid matching inside HTML tags/attributes)
    const tagRegex = /(<[^>]+>)/g;
    const tokens = readingTextHtml.split(tagRegex);

    vocabMap.forEach((v, wordKey) => {
      const escapedWord = v.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b(${escapedWord})\\b`, 'i');

      for (let i = 0; i < tokens.length; i += 2) {
        const token = tokens[i];
        if (!token) continue;

        const match = token.match(regex);
        if (match) {
          const actualWord = match[1];
          const escapeHtml = (str: string) => (str || '').replace(/"/g, '&quot;');
          const html = `<span class="relative inline-block custom-vocab-marker group/marker" data-vocab-id="${v.vocabId}" data-word="${escapeHtml(v.word)}" data-pronunciation="${escapeHtml(v.pronunciation)}" data-meaning-vi="${escapeHtml(v.meaningVi)}" data-meaning-th="${escapeHtml(v.meaningTh || '')}" data-meaning-id="${escapeHtml(v.meaningId || '')}" data-meaning-zh="${escapeHtml(v.meaningZh || '')}" data-meaning-hi="${escapeHtml(v.meaningHi || '')}" data-meaning-ja="${escapeHtml(v.meaningJa || '')}" data-meaning-es="${escapeHtml(v.meaningEs || '')}" data-meaning-ar="${escapeHtml(v.meaningAr || '')}" data-meaning-fr="${escapeHtml(v.meaningFr || '')}" data-meaning-ko="${escapeHtml(v.meaningKo || '')}" data-meaning-pt="${escapeHtml(v.meaningPt || '')}" data-meaning-ru="${escapeHtml(v.meaningRu || '')}" data-meaning-de="${escapeHtml(v.meaningDe || '')}" data-explanation-en="${escapeHtml(v.explanationEn)}" data-examples="${escapeHtml(v.exampleSentence)}" data-image="" contenteditable="false"><span class="bg-emerald-100/80 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 font-bold px-1.5 py-0.5 rounded-md cursor-help border-b-2 border-emerald-500 hover:bg-emerald-200/90 dark:hover:bg-emerald-900/60 transition-all duration-200">${actualWord}</span></span>`;
          
          tokens[i] = token.replace(regex, html);
          
          // Re-split the modified token to ensure any newly inserted HTML tags go to odd indices
          const subTokens = tokens[i].split(tagRegex);
          tokens.splice(i, 1, ...subTokens);
          break;
        }
      }
    });

    readingTextHtml = tokens.join("");

    const vocabHtml = `
      <h3>Vocabulary List</h3>
      <ul style="list-style-type: none; padding: 0;">
        ${vocabularies.map((v: any) => `
          <li style="margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
            <strong style="font-size: 1.1em; color: #2563eb;">${v.word}</strong> 
            <span style="color: #64748b; font-style: italic;">[${v.pronunciation}]</span>
            <div style="margin-top: 5px;">
              <span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-weight: bold; margin-right: 8px;">VI</span>
              <span>${v.meaningVi}</span>
            </div>
            <div style="margin-top: 5px;">
              <span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-weight: bold; margin-right: 8px;">TH</span>
              <span>${v.meaningTh || 'N/A'}</span>
            </div>
            <div style="margin-top: 5px;">
              <span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-weight: bold; margin-right: 8px;">ID</span>
              <span>${v.meaningId || 'N/A'}</span>
            </div>
            <div style="margin-top: 5px; font-size: 0.95em; color: #475569;">
              <strong style="margin-right: 8px;">Other:</strong>
              <span>ZH: ${v.meaningZh || 'N/A'} | HI: ${v.meaningHi || 'N/A'} | JA: ${v.meaningJa || 'N/A'} | ES: ${v.meaningEs || 'N/A'} | AR: ${v.meaningAr || 'N/A'} | FR: ${v.meaningFr || 'N/A'} | KO: ${v.meaningKo || 'N/A'} | PT: ${v.meaningPt || 'N/A'} | RU: ${v.meaningRu || 'N/A'} | DE: ${v.meaningDe || 'N/A'}</span>
            </div>
            <div style="margin-top: 3px; color: #475569;">
              <span style="background: #e0f2fe; padding: 2px 6px; border-radius: 4px; font-weight: bold; margin-right: 8px; color: #0369a1;">EN</span>
              <span>${v.explanationEn}</span>
            </div>
            <div style="margin-top: 5px; font-size: 0.9em; color: #64748b;">
              <strong>Example:</strong> ${v.exampleSentence}
            </div>
          </li>
        `).join('')}
      </ul>
    `;

    // 7. SAVE TO DATABASE
    setGenProgress(session.user.id, "Đang lưu thông tin bài học và câu hỏi vào cơ sở dữ liệu...", 90);
    const assignmentTitle = parsedData.title || "Untitled AI Lesson";
    const assignmentSlug = await generateUniqueSlug(assignmentTitle, 'assignment');
    const lessonSlug = await generateUniqueSlug(assignmentTitle, 'lesson');

    // Save to Database
    const finalLevel = Object.values(audienceLevels).join(',') || parsedData.level || "B1";

    await prisma.assignment.create({
      data: {
        id: assignmentId,
        title: assignmentTitle,
        slug: assignmentSlug,
        shortDescription: parsedData.shortDescription || "",
        readingText: readingTextHtml,
        gradeLevel: parsedData.gradeLevel || "Khác",
        level: finalLevel,
        audienceLevels: audienceLevels,
        subject: subject,
        materialType: "READING",
        targetAudiences: targetAudiences,
        learningGoals: learningGoals,
        status: "DRAFT",
        teacherId: session.user.id,
        isAiGenerated: true,
        instructions: vocabHtml,
        thumbnail: finalThumbnail,
        audioUrl: wholeAudioUrl || null,
        audioMetadata: audioMetadata ? (audioMetadata as any) : undefined
      }
    });

    await prisma.lesson.create({
      data: {
        title: assignmentTitle,
        slug: lessonSlug,
        description: parsedData.shortDescription || "",
        teacherId: session.user.id,
        assignmentId: assignmentId,
        thumbnail: finalThumbnail,
        audioUrl: wholeAudioUrl || null,
        audioMetadata: audioMetadata ? (audioMetadata as any) : undefined,
        targetAudiences: targetAudiences,
        learningGoals: learningGoals,
        level: finalLevel,
        audienceLevels: audienceLevels
      }
    });

    if (questionsData.length > 0) {
      const finalQuestionsData = questionsData.map((q: any) => ({
        ...q,
        assignmentId: assignmentId,
      }));

      await prisma.question.createMany({
        data: finalQuestionsData
      });
    }

    revalidatePath("/teacher/lessons");
    revalidatePath("/teacher/materials");
    revalidatePath("/admin/materials");

    // Images are already generated synchronously and saved to the database.

    setGenProgress(session.user.id, "Hoàn thành!", 100);

    // AI embedding: index after full generation (DRAFT — will also re-trigger on publish)
    const _fullGenId = assignmentId;
    setImmediate(() => {
      reindexAssignment(_fullGenId).catch(err =>
        console.error('[lesson-ai] AI reindex (full gen) failed:', err)
      );
    });

    return { success: true, id: assignmentId, warnings: lessonWarnings.length > 0 ? lessonWarnings : undefined };
  } catch (error: any) {
    console.error("Full automated lesson gen failed:", error);
    if (session?.user?.id) {
      setGenProgress(session.user.id, `Gặp lỗi khi tạo bài học: ${error.message || "Failed"}`, 0);
    }
    return { error: error.message || "Failed to fully generate lesson." };
  }
}

