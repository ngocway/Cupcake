"use client";

import React, { useState } from 'react';
import { QuestionType } from './types';
import { generateAIExerciseAction } from '@/actions/ai-quiz-generator';

const DEFAULT_PROMPT_TEMPLATE = `You are an expert ESL content creator for young learners (A1 level, kids aged 6–7).

Create a complete English learning lesson about the grammar topic: "Present Continuous (e.g. He is playing)".

The output must include ALL sections below:

---

## 1. TITLE
- Short, clear, attractive
- For kids
- Only English
- Example style: "There is / There are – Fun Practice"

---

## 2. THUMBNAIL IMAGE PROMPT (FOR AI IMAGE GENERATION)
Create a prompt for an image generator.

Requirements:
- A simple 2D cartoon illustration
- Flat design, colorful, cute
- A1 kids learning theme
- Clean isolated background
- 16:9 ratio
- English text only (very few words, max 5 words)
- No Vietnamese text
- Friendly classroom or learning scene
- Must include the grammar topic visually

Return ONLY the image prompt.

---

## 3. LESSON GOAL
- 2–3 simple sentences
- Explain what students will learn

---

## 4. GRAMMAR FORMULA (VERY SIMPLE)
Explain:
- Structure
- When to use
- One key rule

Use simple English only (A1 level).

---

## 5. EXAMPLES
Provide 6–8 very simple example sentences.

---

## 6. PRACTICE – MULTIPLE CHOICE
Create 20 questions:
- A1 level
- Each question has 4 options (A, B, C, D)
- Only ONE correct answer
- Include answer
- Include explanation in SIMPLE ENGLISH

Format:

Question  
A.  
B.  
C.  
D.  
Answer:  
Explanation:

---

## 7. PRACTICE – TRUE / FALSE
Create 5 questions:
- Simple sentences
- Mix positive and negative forms
- Include answer + explanation (English)

---

## 8. QUICK MEMORY TIP
- 2–3 short bullet points
- Very easy to remember

---

## 9. FINAL SUMMARY
- 2–3 lines
- Very simple English recap

---

RULES:
- Everything must be in English only
- No complex grammar
- A1 level for children
- Short sentences
- Friendly tone
- Focus on clarity and repetition`;

interface AIGeneratorModalProps {
  assignmentId?: string;
  onClose: () => void;
  onQuestionsGenerated: (generatedData: { type: QuestionType, questions: any[] }[], metadata?: any) => void;
}

export function AIGeneratorModal({ assignmentId, onClose, onQuestionsGenerated }: AIGeneratorModalProps) {
  const [questionsText, setQuestionsText] = useState(DEFAULT_PROMPT_TEMPLATE);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleGenerate = async () => {
    if (!questionsText.trim()) {
      setErrors(['Vui lòng nhập hoặc chỉnh sửa nội dung prompt mẫu.']);
      return;
    }
    
    setIsGenerating(true);
    setErrors([]);
    
    try {
      const result = await generateAIExerciseAction(assignmentId || 'new', questionsText);
      
      if (!result.success) {
        // Kết hợp các lỗi từ backend và chi tiết lỗi thô nếu có
        const combinedErrors: string[] = [];
        if (result.errors && Array.isArray(result.errors)) {
          combinedErrors.push(...result.errors);
        }
        if ((result as any).rawError) {
          combinedErrors.push(`Chi tiết: ${(result as any).rawError}`);
        }
        if (combinedErrors.length === 0) {
          combinedErrors.push('Có lỗi xảy ra khi phân tích câu hỏi.');
        }
        setErrors(combinedErrors);
        return;
      }
      
      if (!result.multipleChoice || !result.trueFalse) {
        setErrors(['AI không nhận diện được câu hỏi nào từ nội dung bạn cung cấp.']);
        return;
      }
      
      const formattedQuestions = [
        ...result.multipleChoice.map((q: any) => ({
          type: 'MULTIPLE_CHOICE' as QuestionType,
          questionText: q.questionText,
          options: q.options,
          explanation: q.explanation
        })),
        ...result.trueFalse.map((q: any) => ({
          type: 'TRUE_FALSE' as QuestionType,
          statement: q.statement,
          isTrue: q.isTrue,
          explanation: q.explanation
        }))
      ];
      
      // Group questions by type
      const groupedMap: Record<QuestionType, any[]> = {
        MULTIPLE_CHOICE: [],
        TRUE_FALSE: [],
        CLOZE_TEST: [],
        MATCHING: [],
        REORDER: []
      };
      
      formattedQuestions.forEach((q) => {
        const type = q.type as QuestionType;
        if (groupedMap[type]) {
          groupedMap[type].push(q);
        }
      });
      
      const generatedData = Object.keys(groupedMap)
        .map(typeKey => ({
          type: typeKey as QuestionType,
          questions: groupedMap[typeKey as QuestionType]
        }))
        .filter(group => group.questions.length > 0);
        
      onQuestionsGenerated(generatedData, {
        title: result.title,
        instructions: result.instructions,
        shortDescription: result.shortDescription,
        thumbnailImagePrompt: result.thumbnailImagePrompt
      });
    } catch (err: any) {
      setErrors([err.message || 'Có lỗi xảy ra khi gọi AI phân tích.']);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-gray-800 flex flex-col">
        
        {/* Header */}
        <div className="flex items-center gap-4 p-6 border-b border-slate-100 dark:border-gray-800 bg-indigo-50/50 dark:bg-indigo-900/10">
          <div className="size-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[28px]">auto_awesome</span>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Tạo bài tập bằng AI Assistant</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Điều chỉnh prompt mẫu bên dưới để tạo tiêu đề, hướng dẫn học bằng HTML, các câu hỏi và ảnh đại diện.</p>
          </div>
          <button 
            onClick={onClose}
            className="size-10 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 transition-colors shrink-0"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 flex flex-col gap-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
          {errors.length > 0 && (
            <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium border border-red-100 dark:border-red-900/30 flex flex-col gap-2">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined shrink-0 text-[20px] text-red-500">error</span>
                <p className="font-bold">Đã phát hiện lỗi:</p>
              </div>
              <ul className="list-disc pl-8 space-y-1 text-xs">
                {errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Questions input */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 font-headline">Nội dung Prompt tùy chỉnh <span className="text-red-500">*</span></label>
            <textarea 
              value={questionsText}
              onChange={(e) => setQuestionsText(e.target.value)}
              className="resize-none h-96 p-4 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-mono font-medium"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-gray-800 flex justify-end gap-3 bg-slate-50 dark:bg-gray-800/50">
          <button 
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="px-6 py-3 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            Hủy bỏ
          </button>
          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-8 py-3 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                Đang xử lý bằng AI...
              </>
            ) : (
              <>
                Tạo bài tập
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
