"use client";

import React, { useState, useEffect } from 'react';
import { generateAILessonFully, getGenProgress } from '@/actions/lesson-ai';
import { getSystemMetadata } from '@/actions/material-actions';
import { getOnboardingConfig } from '@/actions/user-preferences-actions';
import { useLocale } from 'next-intl';
import { Sparkles, X, RefreshCw, Settings, HelpCircle, Volume2 } from 'lucide-react';

interface AiGeneratorModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onSuccess: (id?: string) => void;
}

export const AiGeneratorModal: React.FC<AiGeneratorModalProps> = ({ isOpen, onClose, onSuccess }) => {
  if (isOpen === false) return null;
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  
  // Progress states
  const [progressMsg, setProgressMsg] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);

  // Batch states
  const [currentTopicIdx, setCurrentTopicIdx] = useState(0);
  const [totalTopicsCount, setTotalTopicsCount] = useState(0);
  const [currentTopicName, setCurrentTopicName] = useState("");

  // Form states
  const [topic, setTopic] = useState("");
  const [reference, setReference] = useState("");
  const [audience, setAudience] = useState("All");
  const [learningGoals, setLearningGoals] = useState<string[]>([]);
  const language = "Tiếng Anh";
  const [length, setLength] = useState("Trung bình (~400 từ)");
  const [mcqCount, setMcqCount] = useState(3);
  const [mcqMultiCount, setMcqMultiCount] = useState(0);
  const [tfCount, setTfCount] = useState(2);
  const [clozeCount, setClozeCount] = useState(0);
  const [vocabCount, setVocabCount] = useState(5);
  const [ttsVoice, setTtsVoice] = useState("Aoede");
  const [ttsSpeed, setTtsSpeed] = useState(1.0);

  const [onboardingConfig, setOnboardingConfig] = useState<any>(null);
  const [audiencesList, setAudiencesList] = useState<string[]>(['All', 'Kindergarten', 'Kid', 'Teen', 'Learner']);

  // Dynamic fallback learning goals by audience key
  const FALLBACK_GOALS_BY_AUDIENCE: Record<string, { id: string; label: string; color: string }[]> = {
    kid: [
      { id: "communication", label: "Communication", color: "#10b981" },
      { id: "vocabulary", label: "Vocabulary", color: "#3b82f6" },
      { id: "reading", label: "Reading", color: "#f59e0b" },
      { id: "writing-&-grammar", label: "Writing & Grammar", color: "#8b5cf6" },
    ],
    teen: [
      { id: "communication", label: "Communication", color: "#10b981" },
      { id: "vocabulary", label: "Vocabulary", color: "#3b82f6" },
      { id: "reading", label: "Reading", color: "#f59e0b" },
      { id: "writing-&-grammar", label: "Writing & Grammar", color: "#8b5cf6" },
      { id: "listening", label: "Listening", color: "#ef4444" },
    ],
    learner: [
      { id: "communication", label: "Communication", color: "#10b981" },
      { id: "vocabulary", label: "Vocabulary", color: "#3b82f6" },
      { id: "reading", label: "Reading", color: "#f59e0b" },
      { id: "writing-&-grammar", label: "Writing & Grammar", color: "#8b5cf6" },
      { id: "listening", label: "Listening", color: "#ef4444" },
      { id: "business-english", label: "Business English", color: "#ec4899" },
      { id: "ielts-preparation", label: "IELTS Preparation", color: "#14b8a6" },
    ],
    kindergarten: [
      { id: "vocabulary", label: "Vocabulary", color: "#3b82f6" },
      { id: "phonics", label: "Phonics", color: "#14b8a6" },
      { id: "communication", label: "Communication", color: "#10b981" },
    ]
  };

  const getAvailableGoals = () => {
    const audKey = audience.toLowerCase();
    
    // If audience is "All", return union of all fallbacks or all onboarding goals
    if (audKey === "all") {
      const allUnique = new Map<string, { id: string; label: string; color: string }>();
      
      // Load from onboardingConfig first if it exists
      if (onboardingConfig?.subjects) {
        onboardingConfig.subjects.forEach((subj: any) => {
          if (subj.id === "english") {
            subj.ageGroups?.forEach((ag: any) => {
              ag.goals?.forEach((g: any) => {
                allUnique.set(g.id, g);
              });
            });
          }
        });
      }
      
      // If we got nothing from DB, load fallback values
      if (allUnique.size === 0) {
        Object.values(FALLBACK_GOALS_BY_AUDIENCE).flat().forEach(g => {
          allUnique.set(g.id, g);
        });
      }
      
      return Array.from(allUnique.values());
    }

    // Try to find in onboardingConfig first
    if (onboardingConfig?.subjects) {
      const englishSubj = onboardingConfig.subjects.find((s: any) => s.id === "english");
      if (englishSubj) {
        const matchedAgeGroup = englishSubj.ageGroups?.find((ag: any) => ag.id === audKey || (audKey === "kindergarten" && ag.id === "kid"));
        if (matchedAgeGroup && matchedAgeGroup.goals && matchedAgeGroup.goals.length > 0) {
          return matchedAgeGroup.goals;
        }
      }
    }

    // Fallback if not configured in DB
    const key = audKey === "kindergarten" ? "kindergarten" : (audKey === "teen" ? "teen" : (audKey === "learner" ? "learner" : "kid"));
    return FALLBACK_GOALS_BY_AUDIENCE[key] || FALLBACK_GOALS_BY_AUDIENCE.kid;
  };

  const availableGoals = getAvailableGoals();

  useEffect(() => {
    getSystemMetadata().then(meta => {
      if (meta.targetAudiences.length > 0) {
        const normalizedAuds = meta.targetAudiences
          .map((a: string) => a.trim().charAt(0).toUpperCase() + a.trim().slice(1).toLowerCase())
          .filter((a: string) => a !== 'All');
        const uniqueAuds = Array.from(new Set(normalizedAuds));
        setAudiencesList(['All', ...uniqueAuds]);
      }
    }).catch(console.error);

    getOnboardingConfig().then(config => {
      setOnboardingConfig(config);
    }).catch(console.error);
  }, [locale]);

  // Sync selected learning goals with available list when audience changes
  useEffect(() => {
    const availableIds = getAvailableGoals().map((g: any) => g.id);
    setLearningGoals(prev => prev.filter(id => availableIds.includes(id)));
  }, [audience, onboardingConfig]);

  const handleCreateLesson = async () => {
    const topicsList = topic
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    if (topicsList.length === 0) {
      setErrors(["Vui lòng nhập chủ đề bài học."]);
      return;
    }
    if (learningGoals.length === 0) {
      setErrors(["Vui lòng chọn ít nhất một mục tiêu học tập."]);
      return;
    }

    setLoading(true);
    setErrors([]);
    setTotalTopicsCount(topicsList.length);

    // Setup polling for progress updates
    const pollInterval = setInterval(async () => {
      try {
        const prog = await getGenProgress();
        if (prog) {
          setProgressMsg(prog.status);
          setProgressPercent(prog.percent);
        }
      } catch (err) {
        console.error("Progress polling error:", err);
      }
    }, 850);

    const successes: string[] = [];
    const failures: { topic: string; error: string }[] = [];

    try {
      for (let i = 0; i < topicsList.length; i++) {
        const activeTopic = topicsList[i];
        setCurrentTopicIdx(i);
        setCurrentTopicName(activeTopic);
        setProgressPercent(5);
        setProgressMsg("Đang chuẩn bị khởi tạo...");

        try {
          const res = await generateAILessonFully({
            topic: activeTopic,
            learningGoals,
            audience,
            language,
            length,
            vocabCount,
            mcqCount,
            mcqMultiCount,
            tfCount,
            clozeCount,
            reference: reference.trim() || undefined,
            ttsVoice,
            ttsSpeed
          });

          if (res.error) {
            console.error(`Error generating topic "${activeTopic}":`, res.error);
            failures.push({ topic: activeTopic, error: res.error });
          } else if (res.success && res.id) {
            successes.push(res.id);
          }
        } catch (itemErr: any) {
          console.error(`Exception generating topic "${activeTopic}":`, itemErr);
          failures.push({ topic: activeTopic, error: itemErr.message || "Lỗi bất ngờ xảy ra." });
        }
      }

      clearInterval(pollInterval);

      if (failures.length === 0) {
        setProgressPercent(100);
        setProgressMsg("Hoàn thành tạo tất cả bài học!");
        setTimeout(() => {
          onClose();
          onSuccess(successes[successes.length - 1]);
        }, 1000);
      } else {
        const summaryMsg = `Đã hoàn thành! Tạo thành công ${successes.length}/${topicsList.length} bài học.`;
        const errList = [
          summaryMsg,
          ...failures.map(f => `Chủ đề "${f.topic}": ${f.error}`)
        ];
        setErrors(errList);
        setLoading(false);

        if (successes.length > 0) {
          onSuccess(successes[successes.length - 1]);
        }
      }
    } catch (err: any) {
      clearInterval(pollInterval);
      setErrors([err.message || "Đã xảy ra lỗi hệ thống trong quá trình tạo bài học."]);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-[32px] w-full max-w-2xl shadow-2xl border border-white/20 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh] relative">
        
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-md z-[110] flex flex-col items-center justify-center p-8 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-800 rounded-[32px] p-8 max-w-sm w-full shadow-2xl border border-gray-100 dark:border-slate-700 text-center flex flex-col items-center gap-6 animate-in zoom-in-95 duration-300">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-indigo-600 animate-spin"></div>
                <Sparkles className="w-8 h-8 text-indigo-500 animate-pulse" />
              </div>
              
              <div className="flex flex-col gap-2 w-full">
                <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100 font-headline">
                  {totalTopicsCount > 1 
                    ? `Đang tạo bài ${currentTopicIdx + 1}/${totalTopicsCount}`
                    : progressPercent < 100 ? "Đang tạo bài học AI..." : "Đồng bộ thành công!"}
                </h4>
                {currentTopicName && (
                  <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 truncate max-w-full px-2">
                    Chủ đề: {currentTopicName}
                  </p>
                )}
                <p className="text-xs text-slate-500 dark:text-slate-400 min-h-[36px] px-2 leading-relaxed animate-pulse">
                  {progressMsg}
                </p>
              </div>

              <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden relative shadow-inner">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                Tiến trình bài học: {progressPercent}%
              </span>
            </div>
          </div>
        )}

        {/* Modal Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex justify-between items-center shrink-0 border-b border-white/10 shadow-sm">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5.5 h-5.5 text-blue-200 animate-pulse" />
            <h3 className="text-lg font-extrabold tracking-tight font-headline">Tự động tạo bài học bằng AI</h3>
          </div>
          <button id="ai-modal-close-btn" onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-5.5 h-5.5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-6">
          
          {/* Errors view */}
          {errors.length > 0 && (
            <div className="w-full bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-4 rounded-2xl text-xs border border-red-100 dark:border-red-900/40 shrink-0">
              <p className="font-bold mb-1 flex items-center gap-1.5">
                <X className="w-4 h-4" /> Đã xảy ra lỗi:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                {errors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}

          {/* SECTION 1: TOPIC INPUT */}
          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="ai-topic-input" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Chủ đề bài học <span className="text-red-500">*</span>
              </label>
              <input 
                id="ai-topic-input"
                type="text" 
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                placeholder='VD: "Space Exploration", "Artificial Intelligence", "Thì Hiện Tại Đơn" hoặc "Environmental Protection"' 
                value={topic} 
                onChange={e => setTopic(e.target.value)} 
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="ai-reference-input" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Tài liệu tham khảo / Yêu cầu chi tiết (Tùy chọn)
              </label>
              <textarea 
                id="ai-reference-input"
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                placeholder='Nhập link tài liệu tham khảo hoặc các hướng dẫn chi tiết cho bài đọc/câu hỏi...'
                value={reference} 
                onChange={e => setReference(e.target.value)} 
              />
            </div>
          </div>

          {/* SECTION 2: CONFIGURATION GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Target Audience / Age group */}
            <div className="flex flex-col gap-1">
              <label htmlFor="ai-audience-select" className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Độ tuổi</label>
              <select 
                id="ai-audience-select"
                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                value={audience} 
                onChange={e => setAudience(e.target.value)}
              >
                {audiencesList.map((a, i) => <option key={`${a}-${i}`} value={a}>{a}</option>)}
              </select>
            </div>


            {/* Reading passage length */}
            <div className="flex flex-col gap-1">
              <label htmlFor="ai-length-select" className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Độ dài bài đọc</label>
              <select 
                id="ai-length-select"
                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                value={length} 
                onChange={e => setLength(e.target.value)}
              >
                <option value="Rất ngắn (~200 từ)">Rất ngắn (~200 từ)</option>
                <option value="Trung bình (~400 từ)">Trung bình (~400 từ)</option>
                <option value="Dài (~600 từ)">Dài (~600 từ)</option>
                <option value="Rất dài (>800 từ)">Rất dài (&gt;800 từ)</option>
              </select>
            </div>

            {/* Vocab count */}
            <div className="flex flex-col gap-1">
              <label htmlFor="ai-vocab-input" className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Số từ vựng nổi bật cần trích xuất</label>
              <input
                id="ai-vocab-input"
                type="number"
                min="0"
                max="20"
                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={vocabCount}
                onChange={e => setVocabCount(Math.max(0, Math.min(20, parseInt(e.target.value) || 0)))}
              />
            </div>

            {/* Learning Goals (Multi-select) */}
            <div className="flex flex-col gap-2.5 md:col-span-2 border p-4.5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/10 border-slate-100 dark:border-slate-800 mt-2 shadow-sm">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Mục tiêu học tập (Learning Goals) - Tích chọn nhiều mục tiêu
              </label>
              <div className="flex flex-wrap gap-2">
                {availableGoals.map((goal: any) => {
                  const isSelected = learningGoals.includes(goal.id);
                  return (
                    <button
                      key={goal.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setLearningGoals(prev => prev.filter(id => id !== goal.id));
                        } else {
                          setLearningGoals(prev => [...prev, goal.id]);
                        }
                      }}
                      className="px-4 py-2 rounded-full text-xs font-bold transition-all border-2 flex items-center gap-1.5 active:scale-95 cursor-pointer"
                      style={{
                        color: isSelected ? '#fff' : goal.color,
                        backgroundColor: isSelected ? goal.color : 'transparent',
                        borderColor: goal.color,
                        boxShadow: isSelected ? `${goal.color}25 0px 4px 12px` : 'none'
                      }}
                    >
                      {goal.label}
                    </button>
                  );
                })}
                {availableGoals.length === 0 && (
                  <p className="text-xs text-slate-400 italic">Không có mục tiêu học tập nào phù hợp.</p>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 3: QUESTION MATRIX */}
          <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4.5 bg-slate-50/40 dark:bg-slate-800/20">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-3.5">
              Cấu hình số câu hỏi trắc nghiệm & bài tập
            </span>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white dark:bg-gray-800 border border-slate-150 dark:border-slate-700 rounded-xl p-3 flex flex-col items-center justify-center gap-1">
                <span className="text-[10px] font-bold text-slate-500 text-center leading-none">Trắc nghiệm MC</span>
                <input 
                  id="ai-mcq-count"
                  type="number" 
                  min="0" 
                  max="15" 
                  className="w-12 text-center bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-1 py-0.5 font-bold text-slate-800 dark:text-white text-sm" 
                  value={mcqCount} 
                  onChange={e => setMcqCount(parseInt(e.target.value) || 0)} 
                />
              </div>

              <div className="bg-white dark:bg-gray-800 border border-slate-150 dark:border-slate-700 rounded-xl p-3 flex flex-col items-center justify-center gap-1">
                <span className="text-[10px] font-bold text-slate-500 text-center leading-none">Nhiều đáp án</span>
                <input 
                  id="ai-mcq-multi-count"
                  type="number" 
                  min="0" 
                  max="15" 
                  className="w-12 text-center bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-1 py-0.5 font-bold text-slate-800 dark:text-white text-sm" 
                  value={mcqMultiCount} 
                  onChange={e => setMcqMultiCount(parseInt(e.target.value) || 0)} 
                />
              </div>

              <div className="bg-white dark:bg-gray-800 border border-slate-150 dark:border-slate-700 rounded-xl p-3 flex flex-col items-center justify-center gap-1">
                <span className="text-[10px] font-bold text-slate-500 text-center leading-none">Đúng / Sai</span>
                <input 
                  id="ai-tf-count"
                  type="number" 
                  min="0" 
                  max="15" 
                  className="w-12 text-center bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-1 py-0.5 font-bold text-slate-800 dark:text-white text-sm" 
                  value={tfCount} 
                  onChange={e => setTfCount(parseInt(e.target.value) || 0)} 
                />
              </div>

              <div className="bg-white dark:bg-gray-800 border border-slate-150 dark:border-slate-700 rounded-xl p-3 flex flex-col items-center justify-center gap-1">
                <span className="text-[10px] font-bold text-slate-500 text-center leading-none">Điền từ</span>
                <input 
                  id="ai-cloze-count"
                  type="number" 
                  min="0" 
                  max="15" 
                  className="w-12 text-center bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-1 py-0.5 font-bold text-slate-800 dark:text-white text-sm" 
                  value={clozeCount} 
                  onChange={e => setClozeCount(parseInt(e.target.value) || 0)} 
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: AI VOICE CONFIG (TTS) */}
          <div className="border border-indigo-100/60 dark:border-slate-850 rounded-2xl p-4.5 bg-indigo-50/15 dark:bg-slate-850/10">
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 mb-3.5">
              <Volume2 className="w-4.5 h-4.5" /> Tùy chỉnh giọng nói bài đọc (TTS)
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="ai-voice-select" className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Giọng đọc</label>
                <select 
                  id="ai-voice-select"
                  className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={ttsVoice} 
                  onChange={e => setTtsVoice(e.target.value)}
                >
                  <option value="Aoede">Aoede (Nữ - Truyền cảm)</option>
                  <option value="Kore">Kore (Nữ - Trong trẻo)</option>
                  <option value="Charon">Charon (Nam - Điềm đạm)</option>
                  <option value="Fenrir">Fenrir (Nam - Trầm ấm)</option>
                  <option value="Puck">Puck (Nam - Vui tươi)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="ai-speed-select" className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tốc độ đọc</label>
                <select 
                  id="ai-speed-select"
                  className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={ttsSpeed} 
                  onChange={e => setTtsSpeed(parseFloat(e.target.value))}
                >
                  <option value="0.8">0.8x (Chậm)</option>
                  <option value="0.9">0.9x (Hơi chậm)</option>
                  <option value="1.0">1.0x (Bình thường - Mặc định)</option>
                  <option value="1.2">1.2x (Nhanh)</option>
                </select>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 flex justify-end gap-3">
          <button 
            id="ai-cancel-btn"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors"
          >
            Hủy bỏ
          </button>
          
          <button 
            id="ai-submit-btn"
            onClick={handleCreateLesson}
            disabled={!topic.trim()}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-bold flex items-center gap-1.5 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-40 transition-all shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-98"
          >
            <Sparkles className="w-4 h-4 text-blue-200 animate-pulse" />
            <span>Tạo bài học ✨</span>
          </button>
        </div>

        {/* Global Webkit Scrollbar Styling */}
        <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
          }
          .dark .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #475569;
          }
        `}</style>
      </div>
    </div>
  );
};
