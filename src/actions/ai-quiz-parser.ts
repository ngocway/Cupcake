"use server";

import openai from "@/lib/openai";
import { QuestionType } from "@/components/quiz/types";

export interface ParsedQuestion {
  type: QuestionType;
  questionText?: string;
  statement?: string; // for TRUE_FALSE
  isTrue?: boolean; // for TRUE_FALSE
  options?: { text: string; isCorrect: boolean }[]; // for MULTIPLE_CHOICE
  textWithBlanks?: string; // for CLOZE_TEST
  caseSensitive?: boolean; // for CLOZE_TEST
  instruction?: string; // for MATCHING and REORDER
  pairs?: { leftText: string; rightText: string }[]; // for MATCHING
  items?: { text: string; orderIndex: number }[]; // for REORDER
  explanation?: string;
}

export interface ParseResult {
  success: boolean;
  errors?: string[];
  questions?: ParsedQuestion[];
  rawError?: string; // expose raw OpenAI errors
}

export async function parseQuizQuestionsAction(rawText: string): Promise<ParseResult> {
  if (!process.env.OPENAI_API_KEY) {
    return { success: false, errors: ["OPENAI_API_KEY chưa được cấu hình. Vui lòng thêm vào .env"], rawError: "Missing OPENAI_API_KEY" };
  }

  if (!rawText || !rawText.trim()) {
    return {
      success: false,
      errors: ["Nội dung câu hỏi trống. Vui lòng nhập hoặc dán nội dung các câu hỏi."]
    };
  }

  try {
    const prompt = `You are an expert AI educational assistant. Analyze and parse the following raw text containing quiz questions pasted by a teacher.
Your task is to extract all questions, identify their type, structure them into JSON, and check for completeness.

Supported Question Types and their required JSON fields:
1. "MULTIPLE_CHOICE"
   - Fields:
     - "questionText": The text of the question.
     - "options": An array of objects: { "text": "string", "isCorrect": boolean }.
     - "explanation": Explanation of the correct answer (optional).
   - Validation: Must have at least 2 options and at least one option marked as correct.

2. "TRUE_FALSE"
   - Fields:
     - "statement": The statement to evaluate.
     - "isTrue": boolean (true/false).
     - "explanation": Explanation of the answer (optional).
   - Validation: Must specify whether the statement is true or false.

3. "CLOZE_TEST"
   - Fields:
     - "textWithBlanks": The sentence containing the blanks wrapped in double curly braces "{{text}}". Example: "Hanoi is the capital of {{Vietnam}}."
     - "caseSensitive": boolean (optional, default false).
     - "explanation": Explanation of the answer (optional).
   - Validation: Must contain at least one blank wrapped in "{{...}}".

4. "MATCHING"
   - Fields:
     - "instruction": Instructions for matching.
     - "pairs": An array of objects: { "leftText": "string", "rightText": "string" }.
     - "explanation": Explanation (optional).
   - Validation: Must have at least 1 pair.

5. "REORDER"
   - Fields:
     - "instruction": Instructions for reordering.
     - "items": An array of objects: { "text": "string", "orderIndex": number }.
     - "explanation": Explanation (optional).
   - Validation: Must have at least 2 items.

CRITICAL INSTRUCTIONS:
- CLASSIFICATION RULE: If a question has choice options (like A, B, C, D) and a designated correct answer, it MUST be classified as "MULTIPLE_CHOICE" even if it contains blank lines/underscores (like "_____") in the question text. Do NOT classify it as "CLOZE_TEST" if choices are provided.
- You must ignore any conversational text, pleasantries, page numbers, or irrelevant details. Focus purely on extracting the questions and answers.
- If a question is incomplete, lacks a correct answer, lacks choices, or lacks blank placeholders, do NOT skip it. Instead, formulate a clear, user-friendly error message in Vietnamese describing the issue (e.g. "Câu số 3: Thiếu đáp án đúng", "Câu 2 (Trắc nghiệm): Không có phương án lựa chọn").
- Add all validation errors to the "errors" array.
- If there are ANY validation errors, return "success": false along with the list of "errors". Do NOT include "questions" in this case.
- If all questions are parsed successfully without any validation errors, return "success": true, "questions" array, and omit "errors".

Respond strictly in JSON format matching the structure below:
{
  "success": boolean,
  "errors": ["string"] (only present if success is false),
  "questions": [
    {
      "type": "MULTIPLE_CHOICE" | "TRUE_FALSE" | "CLOZE_TEST" | "MATCHING" | "REORDER",
      ... (appropriate fields for the question type)
    }
  ] (only present if success is true)
}

Raw text to parse:
"""
${rawText}
"""`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful educational content parser. You output strictly valid JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const responseText = completion.choices[0].message.content;
    if (!responseText) {
      throw new Error("Không nhận được phản hồi từ OpenAI");
    }

    const parseResult: ParseResult = JSON.parse(responseText);

    // Double-check validation on backend to be extremely robust
    if (parseResult.success && parseResult.questions) {
      const backendErrors: string[] = [];
      parseResult.questions.forEach((q, idx) => {
        const qNum = idx + 1;
        if (!q.type) {
          backendErrors.push(`Câu ${qNum}: Không xác định được loại câu hỏi.`);
          return;
        }

        if (q.type === "MULTIPLE_CHOICE") {
          if (!q.questionText || !q.questionText.trim()) {
            backendErrors.push(`Câu ${qNum} (Trắc nghiệm): Nội dung câu hỏi trống.`);
          }
          if (!q.options || q.options.length < 2) {
            backendErrors.push(`Câu ${qNum} (Trắc nghiệm): Phải có ít nhất 2 phương án lựa chọn.`);
          } else {
            const hasCorrect = q.options.some(opt => opt.isCorrect);
            if (!hasCorrect) {
              backendErrors.push(`Câu ${qNum} (Trắc nghiệm): Chưa chọn đáp án đúng.`);
            }
          }
        } else if (q.type === "TRUE_FALSE") {
          if (!q.statement || !q.statement.trim()) {
            backendErrors.push(`Câu ${qNum} (Đúng / Sai): Nội dung phát biểu trống.`);
          }
          if (q.isTrue === undefined) {
            backendErrors.push(`Câu ${qNum} (Đúng / Sai): Chưa xác định đáp án Đúng hay Sai.`);
          }
        } else if (q.type === "CLOZE_TEST") {
          if (!q.textWithBlanks || !q.textWithBlanks.trim()) {
            backendErrors.push(`Câu ${qNum} (Điền từ): Nội dung câu hỏi trống.`);
          } else if (!/\{\{.+?\}\}/.test(q.textWithBlanks)) {
            backendErrors.push(`Câu ${qNum} (Điền từ): Thiếu ô điền từ dạng {{đáp_án}}.`);
          }
        } else if (q.type === "MATCHING") {
          if (!q.instruction || !q.instruction.trim()) {
            backendErrors.push(`Câu ${qNum} (Nối cặp): Nội dung yêu cầu trống.`);
          }
          if (!q.pairs || q.pairs.length < 1) {
            backendErrors.push(`Câu ${qNum} (Nối cặp): Phải có ít nhất 1 cặp để nối.`);
          }
        } else if (q.type === "REORDER") {
          if (!q.instruction || !q.instruction.trim()) {
            backendErrors.push(`Câu ${qNum} (Sắp xếp): Nội dung yêu cầu trống.`);
          }
          if (!q.items || q.items.length < 2) {
            backendErrors.push(`Câu ${qNum} (Sắp xếp): Phải có ít nhất 2 từ/cụm từ để sắp xếp.`);
          }
        }
      });

      if (backendErrors.length > 0) {
        return {
          success: false,
          errors: backendErrors
        };
      }
    }

    return parseResult;
  } catch (error: any) {
    console.error("OpenAI API Error in quiz parsing:", error);
    return { success: false, errors: ["Lỗi gọi OpenAI API"], rawError: error.message || String(error) };
  }
}
