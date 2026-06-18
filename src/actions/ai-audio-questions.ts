"use server";

import openai from "@/lib/openai";
import { QuestionType } from "@/components/quiz/types";

interface AudioChunk {
  text: string;
  audioUrl: string;
}

export async function generateQuestionsFromAudioChunks(
  assignmentId: string,
  chunks: AudioChunk[],
  counts: { mcq: number; tf: number; cloze: number; matching: number },
  taxonomy?: {
    subject: string;
    level: string;
    audience: string;
    learningGoals: string[];
  }
) {
  if (!process.env.OPENAI_API_KEY) {
    return { success: false, errors: ["Missing OPENAI_API_KEY"] };
  }

  if (chunks.length === 0) {
    return { success: false, errors: ["Không có dữ liệu audio để tạo câu hỏi."] };
  }

  try {
    const totalQuestions = counts.mcq + counts.tf + counts.cloze + counts.matching;
    
    let taxonomyContext = "";
    if (taxonomy) {
      taxonomyContext = `
      - Subject: ${taxonomy.subject}
      - CEFR Level: ${taxonomy.level}
      - Target Audience: ${taxonomy.audience}
      - Learning Goals: ${taxonomy.learningGoals.join(', ')}
      `;
    }

    const prompt = `You are an expert educational content creator.
    Your task is to generate EXACTLY ${totalQuestions} questions based on the following text chunks extracted from a reading passage.
    ${taxonomyContext ? `Context for difficulty and tone: ${taxonomyContext}` : ""}

    Here are the chunks:
    ${chunks.map((c, idx) => `[Chunk ID: ${idx}] Text: "${c.text}" | AudioUrl: "${c.audioUrl}"`).join('\n')}

    Requirements:
    - Generate ${counts.mcq} Multiple Choice questions (4 options, 1 correct).
    - Generate ${counts.tf} True/False questions.
    - Generate ${counts.cloze} Cloze Test questions (fill in the blank).
    - Generate ${counts.matching} Matching questions. IMPORTANT: Matching questions MUST strictly be word-word matching (e.g., matching a single vocabulary word to its short definition, synonym, or translation). LeftText should be a single word, RightText should be a short phrase or single word.
    - The questions MUST test the student's comprehension of the meaning of the chunks.
    - IMPORTANT: For each question you generate, you MUST provide the EXACT "audioUrl" of the chunk that the question is based on. If a question combines multiple chunks, pick the most relevant chunk's audioUrl.
    
    Output JSON STRICTLY in this format:
    {
      "mcq": [
        {
          "questionText": "string",
          "options": [{ "text": "string", "isCorrect": boolean }],
          "explanation": "string (MUST EXACTLY match the text of the audio chunk used, word for word!)",
          "audioUrl": "string (MUST exactly match one of the chunk AudioUrls)"
        }
      ],
      "tf": [
        {
          "statement": "string",
          "isTrue": boolean,
          "explanation": "string (MUST EXACTLY match the text of the audio chunk used, word for word!)",
          "audioUrl": "string"
        }
      ],
      "cloze": [
        {
          "textWithBlanks": "string with {{answer}} format",
          "explanation": "string (MUST EXACTLY match the text of the audio chunk used, word for word!)",
          "audioUrl": "string"
        }
      ],
      "matching": [
        {
          "instruction": "string",
          "pairs": [{ "leftText": "string", "rightText": "string" }],
          "explanation": "string (MUST EXACTLY match the text of the audio chunk used, word for word!)",
          "audioUrl": "string"
        }
      ]
    }`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful AI assistant that outputs raw JSON without markdown formatting." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const text = completion.choices[0].message.content;
    if (!text) {
      return { success: false, errors: ["Empty response from OpenAI"] };
    }

    const result = JSON.parse(text);

    return {
      success: true,
      data: result
    };

  } catch (error: any) {
    console.error("Error generating questions from audio chunks:", error);
    return { success: false, errors: ["Có lỗi xảy ra khi gọi AI: " + (error.message || String(error))] };
  }
}
