"use client";

import React, { useState, useEffect, useRef } from 'react';
import { QuestionType } from './types';
import { generateAIExerciseAction, generateAIExerciseFromUrlAction } from '@/actions/ai-quiz-generator';
import { TaxonomySelector } from '@/components/common/TaxonomySelector';
import { GrammarClassifier } from '@/components/common/GrammarClassifier';
import { getOnboardingConfig } from '@/actions/user-preferences-actions';
import { detectGrammarFromTitle, generateTitleFromGrammar } from '@/actions/grammar-detect';

const DEFAULT_PROMPT_TEMPLATE = `You are an expert ESL content creator for young learners.

Generate content for an English learning lesson about the grammar topic: "{topic}".

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

## 2. PRACTICE – MULTIPLE CHOICE
Create 15 questions:
- Each question must have EXACTLY ONE correct answer and 2 to 3 wrong distractor options. Vary the number of distractors across the questions (some should have 2 distractors/3 choices total, others should have 3 distractors/4 choices total).
- Distractors must be plausible, common student errors or nearly-correct options. Vary the distractor choices.
- Avoid obvious correct answers (e.g. options like "none of the above", "all of the above" or "I don't know").
- Keep vocabulary simple, tailored to the target audience age group.
- Focus on natural, everyday conversational language.
- Include answer (e.g. Answer: A)
- Include explanation in SIMPLE ENGLISH

Format:

Question
A.
B.
C. [optional, if 2 distractors]
D. [optional, if 3 distractors]
Answer:
Explanation:


---

## 3. PRACTICE – FILL IN BLANK
Create 10 questions:
- Use blank spaces in sentences, represented as "_____" (5 underscores)
- Include the correct word for the blank
- Distractors are not needed
- Include explanation in SIMPLE ENGLISH

Format:

Question
Answer:
Explanation:


---

## 4. PRACTICE – MATCHING
Create 5 pairs of related items:
- Left Column: word/phrase
- Right Column: matching definition/picture description/synonym/translation
- Make them clear and distinct

Format:

Pair 1: left | right
Pair 2: left | right
Pair 3: left | right
Pair 4: left | right
Pair 5: left | right
Explanation:


---

## 5. PRACTICE – REORDER SENTENCE
Create 5 scrambled sentences:
- Provide the scrambled words (comma-separated, random order)
- Provide the correct full sentence
- Keep sentences short and correct grammar
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
  const [topic, setTopic] = useState("Present Continuous (e.g. He is playing)");
  const [errors, setErrors] = useState<string[]>([]);
  
  // Custom mode or URL mode switcher
  const [generatorMode, setGeneratorMode] = useState<'prompt' | 'url'>('prompt');
  const [urlInput, setUrlInput] = useState('');

  // Instructions Image Upload States
  const [instructionsImageUrl, setInstructionsImageUrl] = useState<string | null>(null);
  const [isUploadingInstImage, setIsUploadingInstImage] = useState(false);
  const instFileInputRef = useRef<HTMLInputElement>(null);

  // Taxonomy states
  const [subject, setSubject] = useState("english");
  const [targetAudiences, setTargetAudiences] = useState<string[]>(["kid"]);
  const [audienceLevels, setAudienceLevels] = useState<Record<string, string>>({});
  const [learningGoals, setLearningGoals] = useState<string[]>([]);
  const [onboardingConfig, setOnboardingConfig] = useState<any>(null);

  // Grammar classification states
  const [grammarLevel, setGrammarLevel] = useState("");
  const [grammarTopic, setGrammarTopic] = useState("");
  const [grammarLesson, setGrammarLesson] = useState("");
  const [isDetecting, setIsDetecting] = useState(false);
  const [highlightedFields, setHighlightedFields] = useState<("level" | "grammarTopic" | "grammarLesson")[]>([]);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  // Track generated titles per lesson to avoid repetition
  const generatedTitlesRef = useRef<string[]>([]);
  const lastLessonRef = useRef<string>("");

  const handleAutoDetect = async () => {
    if (!topic.trim() || isDetecting) return;
    setIsDetecting(true);
    try {
      const result = await detectGrammarFromTitle(topic);
      if (result) {
        const fields: ("level" | "grammarTopic" | "grammarLesson")[] = [];
        if (result.level) { setGrammarLevel(result.level); fields.push("level"); }
        if (result.grammarTopic) { setGrammarTopic(result.grammarTopic); fields.push("grammarTopic"); }
        if (result.grammarLesson) { setGrammarLesson(result.grammarLesson); fields.push("grammarLesson"); }
        setHighlightedFields(fields);
        setTimeout(() => setHighlightedFields([]), 2000);
      }
    } finally {
      setIsDetecting(false);
    }
  };

  const handleGenerateTitle = async () => {
    if (!grammarLevel || !grammarTopic || isGeneratingTitle) return;
    // Reset history when lesson changes
    const lessonKey = `${grammarLevel}|${grammarTopic}|${grammarLesson}`;
    if (lastLessonRef.current !== lessonKey) {
      generatedTitlesRef.current = [];
      lastLessonRef.current = lessonKey;
    }
    setIsGeneratingTitle(true);
    try {
      const generated = await generateTitleFromGrammar({
        level: grammarLevel,
        grammarTopic,
        grammarLesson,
        exclude: generatedTitlesRef.current,
      });
      if (generated) {
        setTopic(generated);
        generatedTitlesRef.current = [...generatedTitlesRef.current, generated].slice(-5);
      }
    } finally {
      setIsGeneratingTitle(false);
    }
  };

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
        
        // Use grammarLevel as the primary CEFR level
        const primaryLevelLabel = grammarLevel ? grammarLevel.toUpperCase() : "A1";

        if (generatorMode === 'prompt') {
          let partPromptText = partsToGenerate > 1 
            ? `${questionsText}\n\nIMPORTANT: This is Part ${partNum} of a ${partsToGenerate}-part series. Generate distinct questions and vocabulary for Part ${partNum}. The title of this part MUST end with " Part ${partNum}" (e.g. if the title is "${topic}", it must be "${topic} Part ${partNum}"). Do not repeat questions or options from other parts.`
            : questionsText;

          partPromptText = partPromptText.replace(/{topic}/g, topic);

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
            instructionsImageUrl: instructionsImageUrl || null,
            shortDescription: result.shortDescription,
            thumbnailImagePrompt: result.thumbnailImagePrompt,
            subject,
            targetAudiences,
            audienceLevels,
            learningGoals,
            grammarLevel: grammarLevel || null,
            grammarTopic: grammarTopic || null,
            grammarLesson: grammarLesson || null,
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl border border-slate-200 dark:border-gray-800 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center gap-4 p-6 border-b border-slate-100 dark:border-gray-800 bg-indigo-50/50 dark:bg-indigo-900/10 shrink-0">
          <div className="size-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[28px]">auto_awesome</span>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Tạo bài tập bằng AI Assistant</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Thiết lập đối tượng học và cung cấp prompt tùy chỉnh hoặc link bài tập có sẵn.</p>
          </div>
          <button 
            onClick={onClose}
            className="size-10 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 transition-colors shrink-0 cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 flex flex-col gap-6 overflow-y-auto flex-1 custom-scrollbar">
          {errors.length > 0 && (
            <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium border border-red-100 dark:border-red-900/30 flex flex-col gap-2 shrink-0">
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left Column: Context Configuration */}
            <div className="flex flex-col gap-5">
              {/* Taxonomy Config */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-headline uppercase tracking-wider">Cấu hình đối tượng & mục tiêu</label>
                <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/40 dark:bg-slate-800/20">
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
                    hideLevels
                    hideGoals
                  />

                  {/* Grammar Classification — 3-step */}
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                    <GrammarClassifier
                      level={grammarLevel}
                      setLevel={setGrammarLevel}
                      grammarTopic={grammarTopic}
                      setGrammarTopic={setGrammarTopic}
                      grammarLesson={grammarLesson}
                      setGrammarLesson={setGrammarLesson}
                      highlightedFields={highlightedFields}
                    />
                  </div>
                </div>
              </div>

              {/* Instructions Image Upload (Global) */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-350 font-headline flex items-center gap-1.5 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[18px] text-blue-500 font-bold">photo_library</span>
                  Ảnh minh họa Hướng dẫn bài tập
                </label>
                <div
                  onClick={() => !isUploadingInstImage && instFileInputRef.current?.click()}
                  className={`relative border border-dashed rounded-xl p-3.5 transition-all cursor-pointer flex items-center justify-between bg-slate-50/50 dark:bg-gray-800/30 ${
                    instructionsImageUrl
                      ? 'border-blue-500 bg-blue-50/5 dark:bg-blue-950/5'
                      : 'border-slate-200 dark:border-gray-700 hover:border-slate-350 dark:hover:border-gray-600'
                  } ${isUploadingInstImage ? 'pointer-events-none opacity-70' : ''}`}
                >
                  {instructionsImageUrl ? (
                    <div className="flex items-center gap-3 w-full justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 aspect-video rounded-lg overflow-hidden border border-blue-100 dark:border-blue-900/50 shadow-sm shrink-0">
                          <img
                            src={instructionsImageUrl}
                            alt="Instructions image"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-blue-600 dark:text-blue-400">Đã tải ảnh hướng dẫn lên</p>
                          <p className="text-[10px] text-slate-400">Bấm để thay đổi ảnh khác</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setInstructionsImageUrl(null);
                          if (instFileInputRef.current) instFileInputRef.current.value = '';
                        }}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">delete</span>
                        Xóa ảnh
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-slate-450 dark:text-slate-500">
                      {isUploadingInstImage ? (
                        <>
                          <span className="material-symbols-outlined text-[20px] text-blue-500 animate-spin shrink-0">sync</span>
                          <div className="text-left">
                            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 font-headline">Đang tải ảnh hướng dẫn...</p>
                            <p className="text-[10px] text-slate-400">Vui lòng đợi giây lát</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[20px] text-blue-500 shrink-0">upload_file</span>
                          <div className="text-left">
                            <p className="text-xs font-bold text-slate-600 dark:text-slate-350 font-headline">Tải ảnh hướng dẫn chung cho bài tập (PNG, JPG, WEBP...)</p>
                            <p className="text-[10px] text-slate-455">Hiển thị ở cuối hướng dẫn của tất cả các ngôn ngữ</p>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  <input
                    type="file"
                    ref={instFileInputRef}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (!file.type.startsWith('image/')) {
                          alert('Vui lòng chọn một tệp hình ảnh hợp lệ.');
                          return;
                        }
                        setIsUploadingInstImage(true);
                        try {
                          const { uploadMedia } = await import('@/actions/upload-actions');
                          const formData = new FormData();
                          formData.append('file', file);
                          const res = await uploadMedia(formData);
                          if (res.success && res.url) {
                            setInstructionsImageUrl(res.url);
                          } else {
                            alert('Tải ảnh thất bại: ' + res.error);
                          }
                        } catch (err: any) {
                          console.error(err);
                          alert('Có lỗi xảy ra khi tải ảnh.');
                        } finally {
                          setIsUploadingInstImage(false);
                        }
                      }
                    }}
                    accept="image/*"
                    className="hidden"
                    disabled={isUploadingInstImage}
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Source & Inputs */}
            <div className="flex flex-col gap-5">
              {/* Tab Switcher */}
              <div className="flex border-b border-slate-200 dark:border-gray-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setGeneratorMode('prompt')}
                  className={`flex-1 py-2.5 text-center text-xs font-bold border-b-2 transition-all cursor-pointer ${
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
                  className={`flex-1 py-2.5 text-center text-xs font-bold border-b-2 transition-all cursor-pointer ${
                    generatorMode === 'url'
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Từ link bài tập có sẵn
                </button>
              </div>

              {generatorMode === 'prompt' ? (
                <div className="flex flex-col gap-4">
                  {/* Parts Count Config */}
                  {isCreationMode && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-headline uppercase tracking-wider">Số lượng phần bài tập (Parts) muốn tạo</label>
                      <div className="flex flex-col md:flex-row md:items-center gap-3">
                        <select
                          value={partsCount ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPartsCount(val === "" ? null : Number(val));
                          }}
                          className={`w-full md:w-auto px-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-gray-800 text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20 text-[#111418] dark:text-white transition-all ${
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
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                          Hệ thống sẽ tạo ra các phần bài tập (Part 1, Part 2...) riêng biệt.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Topic Title Input */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-headline uppercase tracking-wider">
                      Chủ đề bài học (Topic Title) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative flex items-center gap-2">
                      <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Ví dụ: Present Continuous (e.g. He is playing)"
                        className={`flex-1 px-4 py-3 rounded-xl border bg-slate-50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-xs font-semibold text-[#111418] dark:text-white ${
                          errors.includes('Vui lòng nhập tên chủ đề bài học (Topic Title).')
                            ? 'border-red-500 ring-2 ring-red-500/20 dark:border-red-500/50'
                            : 'border-slate-200 dark:border-gray-700'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={handleAutoDetect}
                        disabled={!topic.trim() || isDetecting}
                        title="Tự động phát hiện Level & Topic từ tiêu đề"
                        className="shrink-0 w-9 h-9 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-700 flex items-center justify-center text-indigo-500 dark:text-indigo-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                      >
                        {isDetecting ? (
                          <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                        ) : (
                          <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                        )}
                      </button>
                      {/* Generate title from grammar → overwrites title */}
                      <button
                        type="button"
                        onClick={handleGenerateTitle}
                        disabled={!grammarLevel || !grammarTopic || isGeneratingTitle}
                        title="Sinh tiêu đề từ Level & Topic đã chọn (bấm lại để tạo gợi ý khác)"
                        className="shrink-0 w-9 h-9 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                      >
                        {isGeneratingTitle ? (
                          <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                        ) : (
                          <span className="material-symbols-outlined text-[16px]">title</span>
                        )}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-550 -mt-1">
                      Chủ đề này thay thế cho <code className="px-1 py-0.5 bg-slate-100 dark:bg-gray-800 rounded font-mono text-indigo-650 dark:text-indigo-400 font-bold">{`{topic}`}</code> trong Prompt bên dưới.
                    </p>
                  </div>

                  {/* Prompt input */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-headline uppercase tracking-wider">Nội dung Prompt tùy chỉnh <span className="text-red-500">*</span></label>
                    <textarea 
                      value={questionsText}
                      onChange={(e) => setQuestionsText(e.target.value)}
                      className="resize-none h-[220px] lg:h-[260px] p-3.5 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-xs font-mono font-medium"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {/* URL Input */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-headline uppercase tracking-wider">
                      Đường dẫn (URL) bài tập gốc <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="Dán link chứa bài tập tại đây (ví dụ: https://preply.com/...)"
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-xs font-medium"
                    />
                    <span className="text-[10px] text-slate-400 dark:text-slate-550">
                      AI sẽ tự động cào và trích xuất tối đa 30 câu hỏi từ link này để thiết lập bài tập. Cam kết không tự sáng tạo câu hỏi ngoài.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-gray-800 flex justify-end gap-3 bg-slate-50 dark:bg-gray-800/50 shrink-0">
          <button 
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="px-6 py-3 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-200 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-8 py-3 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2 cursor-pointer"
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
