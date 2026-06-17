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
}): string {
  return `
<div class="esl-lesson-instructions space-y-6">
  <section>
    <h3 class="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">Lesson Goal</h3>
    <p class="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">${data.lessonGoal}</p>
  </section>
  
  <section>
    <h3 class="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">Grammar Formula</h3>
    <p class="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">${data.grammarFormula}</p>
  </section>
  
  <section>
    <h3 class="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">Examples</h3>
    <ul class="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400 text-sm">
      ${data.examples.map(ex => `<li>${ex}</li>`).join('')}
    </ul>
  </section>
  
  <section>
    <h3 class="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">Memory Tip</h3>
    <ul class="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400 text-sm">
      ${data.quickMemoryTip.map(tip => `<li>${tip}</li>`).join('')}
    </ul>
  </section>
  
  <section>
    <h3 class="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">Summary</h3>
    <p class="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">${data.finalSummary}</p>
  </section>
</div>
  `.trim();
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
  "practiceMultipleChoice": [
    {
      "questionText": "string",
      "options": [
        { "text": "string", "isCorrect": boolean }
      ],
      "explanation": "string"
    }
  ],
  "practiceTrueFalse": [
    {
      "statement": "string",
      "isTrue": boolean,
      "explanation": "string"
    }
  ],
  "quickMemoryTip": ["string (Tip 1)", "string (Tip 2)", ...],
  "finalSummary": "string (Final summary)"
}

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
    });

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
