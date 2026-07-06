"use client";

import React, { useState, useEffect } from 'react';
import { QuestionType } from './types';
import { generateAIExerciseAction, generateAIExerciseFromUrlAction } from '@/actions/ai-quiz-generator';
import { TaxonomySelector } from '@/components/common/TaxonomySelector';
import { getOnboardingConfig } from '@/actions/user-preferences-actions';

const DEFAULT_PROMPT_TEMPLATE = `You are an expert ESL content creator for young learners.

Create a complete English learning lesson about the grammar topic: "Present Continuous (e.g. He is playing)".

The output must include ALL sections below:

---

## 1. THUMBNAIL IMAGE PROMPT (FOR AI IMAGE GENERATION)
Create a prompt for an image generator.

Requirements:
- A simple 2D cartoon illustration
- Flat design, colorful, cute
- Kids learning theme
- Clean isolated background
- 16:9 ratio
- English text only (very few words, max 5 words)
- No Vietnamese text
- Friendly classroom or learning scene
- Must include the grammar topic visually

Return ONLY the image prompt.

---

## 2. LESSON GOAL
- 2–3 simple sentences
- Explain what students will learn

---

## 3. GRAMMAR FORMULA (VERY detail)
Explain:
- Structure
- When to use
- One key rule

Use simple English only.

---

## 4. EXAMPLES
Provide 6–8 very simple example sentences.

---

## 5. PRACTICE – MULTIPLE CHOICE
Create 15 questions:
- Each question has EXACTLY ONE correct answer and 2 to 3 wrong distractor options
- The wrong options must be clearly incorrect — no ambiguity, no trick questions where multiple answers could be right
- IMPORTANT: Never create a question where two or more options are both correct or could both be accepted as correct
- Include answer (e.g. Answer: A)
- Include explanation in SIMPLE ENGLISH

Format:

Question  
A.  
B.  
C. [optional, if 3 distractors]  
D. [optional, if 3 distractors]  
Answer:  
Explanation:


---

## 6. PRACTICE – TRUE / FALSE
Create 5 questions:
- Simple sentences
- Mix positive and negative forms
- Include answer + explanation (English)

---

## 7. QUICK MEMORY TIP
- 5–8 short bullet points
- Very easy to remember

---

## 8. FINAL SUMMARY
- 2–3 lines
- Very simple English recap

---

RULES:
- Everything must be in English only
- No complex grammar
- Short sentences
- Friendly tone
- Focus on clarity and repetition`;

interface AIGeneratorModalProps {
  assignmentId?: string;
  onClose: () => void;
  onQuestionsGenerated: (
    results: {
      generatedData: { type: QuestionType; questions: any[] }[];
      metadata?: any;
    }[]
  ) => void;
}

export function AIGeneratorModal({ assignmentId, onClose, onQuestionsGenerated }: AIGeneratorModalProps) {
  const [questionsText, setQuestionsText] = useState(DEFAULT_PROMPT_TEMPLATE);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  
  // Custom mode or URL mode switcher
  const [generatorMode, setGeneratorMode] = useState<'prompt' | 'url'>('prompt');
  const [urlInput, setUrlInput] = useState('');

  // Taxonomy states
  const [subject, setSubject] = useState("english");
  const [targetAudiences, setTargetAudiences] = useState<string[]>(["kid"]);
  const [audienceLevels, setAudienceLevels] = useState<Record<string, string>>({});
  const [learningGoals, setLearningGoals] = useState<string[]>([]);
  const [onboardingConfig, setOnboardingConfig] = useState<any>(null);

  // Part configuration state
  const [partsCount, setPartsCount] = useState<number | null>(null);
  const isCreationMode = !assignmentId || assignmentId === 'new';

  useEffect(() => {
    getOnboardingConfig().then(config => setOnboardingConfig(config)).catch(console.error);
  }, []);

  const handleGenerate = async () => {
    const newErrors = [];
    if (isCreationMode && generatorMode === 'prompt' && partsCount === null) {
      newErrors.push('Vui lòng chọn số lượng phần bài tập (Parts) muốn tạo.');
    }
    
    if (generatorMode === 'prompt') {
      if (!questionsText.trim()) {
        newErrors.push('Vui lòng nhập hoặc chỉnh sửa nội dung prompt mẫu.');
      }
    } else {
      if (!urlInput.trim()) {
        newErrors.push('Vui lòng nhập đường dẫn (URL) bài tập.');
      } else {
        try {
          new URL(urlInput.trim());
        } catch (_) {
          newErrors.push('Đường dẫn không hợp lệ. Vui lòng nhập URL đầy đủ bắt đầu bằng http:// hoặc https://');
        }
      }
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsGenerating(true);
    setErrors([]);
    
    try {
      const partsToGenerate = generatorMode === 'url' ? 1 : (isCreationMode ? (partsCount || 1) : 1);

      const promises = Array.from({ length: partsToGenerate }).map(async (_, idx) => {
        const partNum = idx + 1;
        
        let result;
        const audienceOrder = ["kindergarten", "kid", "teen", "learner"];
        const primaryAudience = audienceOrder.find(a => targetAudiences.includes(a)) || "kid";
        
        // Resolve level label dynamically
        const ageGroupConfig = onboardingConfig?.subjects
          ?.find((s: any) => s.id === subject)
          ?.ageGroups?.find((a: any) => a.id === primaryAudience);
        const selectedLevelId = audienceLevels[primaryAudience];
        const levelObj = ageGroupConfig?.levels?.find((l: any) => l.id === selectedLevelId);
        const primaryLevelLabel = levelObj ? levelObj.label : (selectedLevelId || "Pre-A1/A1");

        if (generatorMode === 'prompt') {
          const partPromptText = partsToGenerate > 1 
            ? `${questionsText}\n\nIMPORTANT: This is Part ${partNum} of a ${partsToGenerate}-part series. Generate distinct questions and vocabulary for Part ${partNum}. The title of this part MUST end with " Part ${partNum}" (e.g. if the title is "Present Continuous", it must be "Present Continuous Part ${partNum}"). Do not repeat questions or options from other parts.`
            : questionsText;

          const enhancedPrompt = `
Context Information for AI:
- Subject: ${subject}
- Target Audiences: ${targetAudiences.join(', ')}
- Primary Audience (Tone): ${primaryAudience}
- CEFR Level: ${primaryLevelLabel}
- Selected Learning Goals: ${learningGoals.join(', ')}

==================
User Prompt:
${partPromptText}
`;

          result = await generateAIExerciseAction(assignmentId || 'new', enhancedPrompt);
        } else {
          result = await generateAIExerciseFromUrlAction(assignmentId || 'new', urlInput.trim(), {
            subject,
            targetAudiences,
            primaryAudience,
            primaryLevel: primaryLevelLabel,
            learningGoals
          });
        }
        
        if (!result.success) {
          throw new Error(
            `Lỗi khi xử lý bằng AI: ` + 
            (result.errors?.join(', ') || 'Lỗi không xác định') + 
            ((result as any).rawError ? ` (Chi tiết: ${(result as any).rawError})` : '')
          );
        }
        
        if (!result.multipleChoice || !result.trueFalse) {
          throw new Error(`AI không nhận diện được câu hỏi nào từ nội dung.`);
        }

        const formattedQuestions = [
          ...result.multipleChoice.map((q: any) => ({
            type: 'MULTIPLE_CHOICE' as QuestionType,
            questionText: q.questionText,
            options: q.options,
            explanation: q.explanation,
            explanationTranslations: q.explanationTranslations || null
          })),
          ...result.trueFalse.map((q: any) => ({
            type: 'TRUE_FALSE' as QuestionType,
            statement: q.statement,
            isTrue: q.isTrue,
            explanation: q.explanation,
            explanationTranslations: q.explanationTranslations || null
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

        return {
          generatedData,
          metadata: {
            title: result.title,
            instructions: result.instructions,
            instructionsTranslations: result.instructionsTranslations || null,
            shortDescription: result.shortDescription,
            thumbnailImagePrompt: result.thumbnailImagePrompt,
            subject,
            targetAudiences,
            audienceLevels,
            learningGoals
          }
        };
      });

      const allResults = await Promise.all(promises);
      onQuestionsGenerated(allResults);
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
            <p className="text-sm text-slate-500 dark:text-slate-400">Thiết lập đối tượng học và cung cấp prompt tùy chỉnh hoặc link bài tập có sẵn.</p>
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

          {/* Tab Switcher */}
          <div className="flex border-b border-slate-200 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setGeneratorMode('prompt')}
              className={`flex-1 py-3 text-center text-sm font-bold border-b-2 transition-all ${
                generatorMode === 'prompt'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Tự nhập prompt tùy chỉnh
            </button>
            <button
              type="button"
              onClick={() => setGeneratorMode('url')}
              className={`flex-1 py-3 text-center text-sm font-bold border-b-2 transition-all ${
                generatorMode === 'url'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Từ link bài tập có sẵn
            </button>
          </div>

          {/* Taxonomy Config */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 font-headline">Cấu hình đối tượng & mục tiêu (AI tham khảo ngữ cảnh)</label>
            <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4.5 bg-slate-50/40 dark:bg-slate-800/20">
              <TaxonomySelector
                config={onboardingConfig}
                subject={subject}
                setSubject={setSubject}
                targetAudiences={targetAudiences}
                setTargetAudiences={setTargetAudiences}
                audienceLevels={audienceLevels}
                setAudienceLevels={setAudienceLevels}
                learningGoals={learningGoals}
                setLearningGoals={setLearningGoals}
              />
            </div>
          </div>

          {/* Parts Count Config (Only show in custom prompt mode) */}
          {isCreationMode && generatorMode === 'prompt' && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 font-headline">Số lượng phần bài tập (Parts) muốn tạo</label>
              <div className="flex items-center gap-3">
                <select
                  value={partsCount ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPartsCount(val === "" ? null : Number(val));
                  }}
                  className={`px-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-gray-800 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20 text-[#111418] dark:text-white transition-all ${
                    errors.includes('Vui lòng chọn số lượng phần bài tập (Parts) muốn tạo.')
                      ? 'border-red-500 ring-2 ring-red-500/20 dark:border-red-500/50'
                      : 'border-slate-200 dark:border-gray-700'
                  }`}
                >
                  <option value="">-- Chọn số lượng Part --</option>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <option key={num} value={num}>
                      Tạo {num} bài tập ({num} Parts)
                    </option>
                  ))}
                </select>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Hệ thống sẽ tạo ra các phần bài tập riêng biệt (ví dụ: Part 1, Part 2...) với các câu hỏi khác nhau.
                </span>
              </div>
            </div>
          )}

          {/* Mode inputs */}
          {generatorMode === 'prompt' ? (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 font-headline">Nội dung Prompt tùy chỉnh <span className="text-red-500">*</span></label>
              <textarea 
                value={questionsText}
                onChange={(e) => setQuestionsText(e.target.value)}
                className="resize-none h-96 p-4 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-mono font-medium"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 font-headline">
                Đường dẫn (URL) bài tập gốc <span className="text-red-500">*</span>
              </label>
              <input 
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Dán link chứa bài tập tại đây (ví dụ: https://preply.com/...)"
                className="p-4 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
              />
              <span className="text-xs text-slate-500 dark:text-slate-400">
                AI sẽ tự động cào và trích xuất tối đa 30 câu hỏi từ link này để thiết lập bài tập. Cam kết không tự sáng tạo câu hỏi ngoài.
              </span>
            </div>
          )}
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
