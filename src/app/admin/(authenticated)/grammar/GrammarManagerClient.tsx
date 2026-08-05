"use client";

import { useState, useTransition } from "react";
import { 
  getLessonGrammarContent, 
  saveLessonGrammarContent,
  getLessonExercises,
  GrammarExerciseItem
} from "./actions";
import { CustomRichTextEditor } from "@/components/ui/CustomRichTextEditor";
import { toast } from "sonner";
import { 
  ChevronRight, 
  ChevronDown, 
  CheckCircle2, 
  AlertTriangle, 
  BookOpen, 
  Loader2,
  FileText,
  Edit3,
  Save,
  XCircle,
  Gamepad2,
  ExternalLink,
  HelpCircle,
  Clock,
  User,
  Sparkles,
  Eye,
  RotateCw
} from "lucide-react";
import Link from "next/link";

interface LessonInfo {
  id: string;
  label: string;
  level: string;
  topicId?: string;
  exerciseCount: number;
  hasContent: boolean;
}

interface TopicInfo {
  id: string;
  label: string;
  labelVi: string;
  icon: string;
  lessons: LessonInfo[];
}

interface GrammarManagerClientProps {
  levels: { id: string; label: string }[];
  topicsByLevel: Record<string, TopicInfo[]>;
}

export default function GrammarManagerClient({ levels, topicsByLevel }: GrammarManagerClientProps) {
  // Local state for topics data to allow real-time UI updates when saving theory
  const [localTopicsByLevel, setLocalTopicsByLevel] = useState<Record<string, TopicInfo[]>>(topicsByLevel);

  // State for expanded levels and topics
  const [expandedLevels, setExpandedLevels] = useState<Record<string, boolean>>({
    a1: true, // Expand A1 by default
  });
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});

  // State for expanded lesson nodes & cached exercises map
  const [expandedLessons, setExpandedLessons] = useState<Record<string, boolean>>({});
  const [exercisesMap, setExercisesMap] = useState<Record<string, GrammarExerciseItem[]>>({});
  const [loadingExercises, setLoadingExercises] = useState<Record<string, boolean>>({});

  // Selected states & View Mode ('theory' | 'exercise')
  const [selectedLesson, setSelectedLesson] = useState<LessonInfo | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<GrammarExerciseItem | null>(null);
  const [viewMode, setViewMode] = useState<'theory' | 'exercise'>('theory');
  const [isStartingPractice, setIsStartingPractice] = useState(false);
  const [isRefreshingExercise, setIsRefreshingExercise] = useState(false);

  const handleRefreshExercise = async (exerciseId: string) => {
    if (!selectedLesson) return;
    setIsRefreshingExercise(true);
    try {
      const updatedExercises = await getLessonExercises(selectedLesson.level, selectedLesson.topicId || "", selectedLesson.id);
      setExercisesMap(prev => ({ ...prev, [selectedLesson.id]: updatedExercises }));

      const currentEx = updatedExercises.find(e => e.id === exerciseId);
      if (currentEx) {
        setSelectedExercise(currentEx);
        toast.success("Đã tải lại câu hỏi mới nhất!");
      }
    } catch (err) {
      console.error("Failed to refresh exercise questions:", err);
      toast.error("Không thể làm mới câu hỏi.");
    } finally {
      setIsRefreshingExercise(false);
    }
  };

  const handleOpenPracticeMode = async (e: React.MouseEvent, exerciseId: string, slug?: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    setIsStartingPractice(true);
    try {
      const res = await fetch(`/api/assignments/${exerciseId}/start`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.redirectUrl) {
          window.open(data.redirectUrl, "_blank");
          return;
        }
      }
    } catch (err) {
      console.error("Failed to start practice mode:", err);
    } finally {
      setIsStartingPractice(false);
    }

    // Fallback: direct run page with direct parameter
    const target = slug || exerciseId;
    window.open(`/student/assignments/${target}/run?direct=true`, "_blank");
  };

  // Theory edit states
  const [lessonContent, setLessonContent] = useState<string | null>(null);
  const [lessonTranslation, setLessonTranslation] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'en' | 'vi'>('en');
  const [isEditing, setIsEditing] = useState(false);
  const [editContentEn, setEditContentEn] = useState("");
  const [editContentVi, setEditContentVi] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);

  const toggleLevel = (levelId: string) => {
    setExpandedLevels(prev => ({ ...prev, [levelId]: !prev[levelId] }));
  };

  const toggleTopic = (levelTopicId: string) => {
    setExpandedTopics(prev => ({ ...prev, [levelTopicId]: !prev[levelTopicId] }));
  };

  const handleSelectLesson = (lesson: LessonInfo) => {
    const lvlTopics = localTopicsByLevel[lesson.level] ?? [];
    let latestLesson = lesson;
    for (const t of lvlTopics) {
      const found = t.lessons.find(l => l.id === lesson.id);
      if (found) {
        latestLesson = found;
        break;
      }
    }

    setSelectedLesson(latestLesson);
    setLessonContent(null);
    setLessonTranslation(null);
    setIsEditing(false);
    setActiveTab('en');

    if (latestLesson.hasContent) {
      startTransition(async () => {
        const data = await getLessonGrammarContent(latestLesson.id);
        if (data) {
          setLessonContent(data.instructions);
          setLessonTranslation(data.instructionsTranslations?.vi || "");
        } else {
          setLessonContent("");
          setLessonTranslation("");
        }
      });
    } else {
      setLessonContent("");
      setLessonTranslation("");
    }
  };

  const toggleLessonExpand = async (lesson: LessonInfo, topicId: string) => {
    const nextExpanded = !expandedLessons[lesson.id];
    setExpandedLessons(prev => ({ ...prev, [lesson.id]: nextExpanded }));

    // Select lesson for theory if no exercise is currently being previewed
    handleSelectLesson(lesson);
    if (!selectedExercise) {
      setViewMode('theory');
    }

    // Fetch exercises via Server Action if expanding & not loaded yet
    if (nextExpanded && (!exercisesMap[lesson.id] || exercisesMap[lesson.id].length === 0) && !loadingExercises[lesson.id]) {
      setLoadingExercises(prev => ({ ...prev, [lesson.id]: true }));
      try {
        const exercises = await getLessonExercises(lesson.level, topicId, lesson.id);
        setExercisesMap(prev => ({ ...prev, [lesson.id]: exercises }));
      } catch (err) {
        console.error("Error fetching lesson exercises:", err);
      } finally {
        setLoadingExercises(prev => ({ ...prev, [lesson.id]: false }));
      }
    }
  };

  const handleSelectExerciseItem = (exercise: GrammarExerciseItem, lesson: LessonInfo) => {
    setSelectedExercise(exercise);
    setViewMode('exercise');
    if (selectedLesson?.id !== lesson.id) {
      handleSelectLesson(lesson);
    }
  };

  const handleStartEdit = () => {
    setEditContentEn(lessonContent || "");
    setEditContentVi(lessonTranslation || "");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!selectedLesson) return;

    setIsSaving(true);
    try {
      const success = await saveLessonGrammarContent(
        selectedLesson.id, 
        editContentEn, 
        { vi: editContentVi }
      );
      if (success) {
        toast.success("Đã lưu lý thuyết ngữ pháp thành công!");
        setLessonContent(editContentEn);
        setLessonTranslation(editContentVi);
        setIsEditing(false);

        const updatedTopics = { ...localTopicsByLevel };
        const lvlTopics = updatedTopics[selectedLesson.level] || [];
        const hasText = editContentEn.trim().length > 0;

        const newLvlTopics = lvlTopics.map(t => ({
          ...t,
          lessons: t.lessons.map(l => {
            if (l.id === selectedLesson.id) {
              const updated = { ...l, hasContent: hasText };
              setSelectedLesson(updated);
              return updated;
            }
            return l;
          })
        }));

        updatedTopics[selectedLesson.level] = newLvlTopics;
        setLocalTopicsByLevel(updatedTopics);
      } else {
        toast.error("Có lỗi xảy ra khi lưu nội dung.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra khi lưu nội dung.");
    } finally {
      setIsSaving(false);
    }
  };

  // Helper renderer for exercise questions preview
  const renderExerciseQuestions = (questions: any) => {
    let qList: any[] = [];
    if (Array.isArray(questions)) {
      qList = questions;
    } else if (questions && typeof questions === 'object') {
      if (Array.isArray(questions.items)) qList = questions.items;
      else if (Array.isArray(questions.questions)) qList = questions.questions;
    }

    if (qList.length === 0) {
      return (
        <div className="p-8 text-center bg-neutral-900/50 border border-neutral-800 rounded-2xl text-neutral-500 text-xs">
          Chưa có dữ liệu câu hỏi chi tiết cho bài tập này.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {qList.map((q, idx) => {
          let parsedContent: any = {};
          if (typeof q.content === 'string') {
            try {
              parsedContent = JSON.parse(q.content);
            } catch (err) {
              parsedContent = { questionText: q.content };
            }
          } else if (q.content && typeof q.content === 'object') {
            parsedContent = q.content;
          } else {
            parsedContent = q;
          }

          const qTitle = 
            parsedContent.questionText || 
            parsedContent.prompt || 
            parsedContent.question || 
            parsedContent.title || 
            q.prompt || 
            q.question || 
            q.title || 
            `Câu hỏi ${idx + 1}`;

          const options = 
            parsedContent.options || 
            parsedContent.choices || 
            parsedContent.answers || 
            q.options || 
            q.choices || 
            [];

          const correctAnswer = 
            parsedContent.correctAnswer ?? 
            parsedContent.answer ?? 
            parsedContent.correctIndex ?? 
            q.correctAnswer;

          const explanation = q.explanation || parsedContent.explanation || q.hint;

          return (
            <div key={idx} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-400 font-extrabold text-xs flex items-center justify-center shrink-0 border border-purple-500/20">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-white leading-snug">{qTitle}</h4>
                </div>
              </div>

              {/* Options list */}
              {Array.isArray(options) && options.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-9">
                  {options.map((opt: any, optIdx: number) => {
                    const optText = typeof opt === 'string' ? opt : opt.text || opt.label || JSON.stringify(opt);
                    const isCorrect = 
                      correctAnswer === optIdx || 
                      correctAnswer === optText || 
                      (typeof opt === 'object' && opt.isCorrect);

                    return (
                      <div 
                        key={optIdx} 
                        className={`p-3 rounded-xl text-xs font-semibold border flex items-center justify-between transition-all ${
                          isCorrect 
                            ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-bold" 
                            : "bg-neutral-950/40 border-neutral-800 text-neutral-400"
                        }`}
                      >
                        <span>{optText}</span>
                        {isCorrect && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Explanation / Hint */}
              {explanation && (
                <div className="ml-9 p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-blue-300/90 flex items-start gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-blue-400">Giải thích / Gợi ý: </span>
                    <span>{explanation}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex h-[calc(100vh-80px)] gap-6 p-6">
      {/* LEFT: Interactive Tree-View */}
      <div className="w-[380px] shrink-0 bg-neutral-900 border border-neutral-800 rounded-3xl p-5 overflow-y-auto flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-black text-white">Cấu trúc Ngữ pháp</h2>
          <p className="text-xs text-neutral-500 font-semibold mt-1">Duyệt Trình độ → Chủ đề → Bài học → Bài tập</p>
        </div>

        <div className="flex-1 space-y-2 mt-2">
          {levels.map(level => {
            const levelId = level.id;
            const levelTopics = localTopicsByLevel[levelId] ?? [];
            const isLevelExpanded = expandedLevels[levelId];

            return (
              <div key={levelId} className="border border-neutral-800/40 rounded-2xl overflow-hidden bg-neutral-950/20">
                {/* Level Node Header */}
                <button
                  onClick={() => toggleLevel(levelId)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-neutral-800/30 transition-colors"
                >
                  {isLevelExpanded ? (
                    <ChevronDown className="w-4 h-4 text-neutral-500 shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-neutral-500 shrink-0" />
                  )}
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black uppercase shrink-0 
                    ${levelId === 'a1' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      levelId === 'a2' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' :
                      levelId === 'b1' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      levelId === 'b2' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                      'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}
                  >
                    {level.label}
                  </span>
                  <span className="font-bold text-sm text-neutral-300">Level {level.label}</span>
                  <span className="text-[10px] bg-neutral-800 text-neutral-500 px-2 py-0.5 rounded-full font-bold ml-auto">
                    {levelTopics.length} topics
                  </span>
                </button>

                {/* Level Children (Topics) */}
                {isLevelExpanded && (
                  <div className="pl-4 pr-2 pb-2 border-t border-neutral-900 bg-neutral-950/30 space-y-1.5 pt-2">
                    {levelTopics.length === 0 ? (
                      <p className="text-xs text-neutral-600 italic p-3">Không có chủ đề nào</p>
                    ) : (
                      levelTopics.map(topic => {
                        const levelTopicId = `${levelId}_${topic.id}`;
                        const isTopicExpanded = expandedTopics[levelTopicId];

                        return (
                          <div key={topic.id} className="rounded-xl overflow-hidden bg-neutral-900/40">
                            {/* Topic Node Header */}
                            <button
                              onClick={() => toggleTopic(levelTopicId)}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-neutral-800/40 transition-colors"
                            >
                              {isTopicExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                              )}
                              <span className="text-xl shrink-0">{topic.icon}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-neutral-300 truncate">{topic.label}</p>
                                <p className="text-[9px] text-neutral-500 font-semibold truncate">{topic.labelVi}</p>
                              </div>
                              <span className="text-[9px] text-neutral-400 font-bold bg-neutral-800 px-1.5 py-0.5 rounded-md">
                                {topic.lessons.length} lessons
                              </span>
                            </button>

                            {/* Topic Children (Lessons & Sub-Exercises) */}
                            {isTopicExpanded && (
                              <div className="pl-3 pr-2 pb-2 border-t border-neutral-950 bg-neutral-950/20 space-y-1 pt-1.5">
                                {topic.lessons.length === 0 ? (
                                  <p className="text-[10px] text-neutral-600 italic p-2">Không có bài học nào</p>
                                ) : (
                                  topic.lessons.map(lesson => {
                                    const isLessonExpanded = expandedLessons[lesson.id];
                                    const isLessonSelected = selectedLesson?.id === lesson.id && viewMode === 'theory';
                                    const exercises = exercisesMap[lesson.id] ?? [];
                                    const isLoadingEx = loadingExercises[lesson.id];

                                    return (
                                      <div key={lesson.id} className="space-y-1">
                                        {/* Lesson Header Button */}
                                        <button
                                          onClick={() => toggleLessonExpand(lesson, topic.id)}
                                          className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all ${
                                            isLessonSelected
                                              ? "bg-blue-600/10 text-blue-400 border border-blue-500/20"
                                              : "text-neutral-400 hover:bg-neutral-800/30 hover:text-white"
                                          }`}
                                        >
                                          {/* Expand icon chevron if lesson has exercises */}
                                          {lesson.exerciseCount > 0 ? (
                                            isLessonExpanded ? (
                                              <ChevronDown className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                            ) : (
                                              <ChevronRight className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                                            )
                                          ) : (
                                            <BookOpen className="w-3.5 h-3.5 shrink-0 opacity-70" />
                                          )}

                                          <span className="text-xs font-bold flex-1 truncate">{lesson.label}</span>

                                          {/* Status badges */}
                                          <div className="flex items-center gap-1.5 shrink-0">
                                            {/* Exercise count badge */}
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                                              lesson.exerciseCount > 0 
                                                ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20' 
                                                : 'bg-neutral-800/40 text-neutral-600'
                                            }`}>
                                              {lesson.exerciseCount} Ex
                                            </span>

                                            {/* Instructions check/warning */}
                                            {lesson.hasContent ? (
                                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" aria-label="Đã có nội dung lý thuyết" />
                                            ) : (
                                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500/80" aria-label="Chưa có lý thuyết" />
                                            )}
                                          </div>
                                        </button>

                                        {/* Expandable Sub-Exercises List */}
                                        {isLessonExpanded && (
                                          <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-neutral-800/80 ml-3.5 my-1">
                                            {isLoadingEx ? (
                                              <div className="flex items-center gap-2 py-1.5 px-2 text-[10px] text-neutral-500">
                                                <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                                                <span>Đang tải bài tập...</span>
                                              </div>
                                            ) : exercises.length === 0 ? (
                                              <div className="flex items-center justify-between py-1 px-2">
                                                <p className="text-[10px] text-neutral-500 italic">Chưa tải được bài tập</p>
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setLoadingExercises(prev => ({ ...prev, [lesson.id]: true }));
                                                    getLessonExercises(lesson.level, topic.id, lesson.id)
                                                      .then(exs => setExercisesMap(prev => ({ ...prev, [lesson.id]: exs })))
                                                      .finally(() => setLoadingExercises(prev => ({ ...prev, [lesson.id]: false })));
                                                  }}
                                                  className="text-[10px] text-blue-400 font-bold hover:underline flex items-center gap-1"
                                                >
                                                  🔄 Tải lại
                                                </button>
                                              </div>
                                            ) : (
                                              exercises.map((ex, idx) => {
                                                const isExSelected = selectedExercise?.id === ex.id && viewMode === 'exercise';
                                                return (
                                                  <button
                                                    key={ex.id}
                                                    title={`${idx + 1}. ${ex.title}`}
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleSelectExerciseItem(ex, lesson);
                                                    }}
                                                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-left transition-all ${
                                                      isExSelected
                                                        ? "bg-purple-600/20 text-purple-300 border border-purple-500/30 font-bold"
                                                        : "text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200"
                                                    }`}
                                                  >
                                                    <Gamepad2 className="w-3 h-3 text-purple-400 shrink-0 opacity-80" />
                                                    <div className="flex-1 min-w-0" title={`${idx + 1}. ${ex.title}`}>
                                                      <p className="text-[11px] font-semibold truncate leading-tight">
                                                        {idx + 1}. {ex.title}
                                                      </p>
                                                    </div>
                                                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded shrink-0 ${
                                                      isExSelected
                                                        ? 'bg-purple-500/30 text-purple-200 border border-purple-400/40'
                                                        : 'bg-neutral-800 text-neutral-400 border border-neutral-700/60'
                                                    }`}>
                                                      {ex.questionCount ?? (Array.isArray(ex.questions) ? ex.questions.length : 0)} câu
                                                    </span>
                                                  </button>
                                                );
                                              })
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: HTML Content Preview & Editor Panel */}
      <div className="flex-1 bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden flex flex-col">
        {!selectedLesson ? (
          // Placeholder view
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-neutral-500">
            <div className="w-16 h-16 rounded-2xl bg-neutral-800 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-neutral-600" />
            </div>
            <h3 className="font-extrabold text-white text-base">Xem & Biên soạn lý thuyết & Bài tập</h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm">
              Chọn bất kỳ một bài học hoặc bài tập nào trong cây thư mục bên trái để xem lý thuyết hoặc xem trước danh sách câu hỏi.
            </p>
          </div>
        ) : (
          // Details view
          <div className="flex-1 flex flex-col min-h-0">
            {/* Header info & View Mode Switcher */}
            <div className="p-6 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/20 shrink-0">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Level {selectedLesson.level.toUpperCase()}
                  </span>
                  <span>•</span>
                  <span>Bài tập liên kết: {selectedLesson.exerciseCount} bài</span>
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <h1 className="text-xl font-black text-white leading-tight">
                    {selectedLesson.label}
                  </h1>

                  {/* Mode View Tabs (Lý thuyết vs Bài tập) */}
                  <div className="flex bg-neutral-800/80 rounded-lg p-0.5 border border-neutral-700/60 shrink-0">
                    <button
                      onClick={() => setViewMode('theory')}
                      className={`flex items-center gap-1.5 px-3 py-1 text-[11px] font-extrabold rounded-md transition-all ${
                        viewMode === 'theory'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      Lý thuyết bài học
                    </button>
                    <button
                      onClick={() => {
                        setViewMode('exercise');
                        // Auto select first exercise if none selected
                        const exList = exercisesMap[selectedLesson.id] ?? [];
                        if (!selectedExercise && exList.length > 0) {
                          setSelectedExercise(exList[0]);
                        }
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1 text-[11px] font-extrabold rounded-md transition-all ${
                        viewMode === 'exercise'
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Gamepad2 className="w-3.5 h-3.5" />
                      Xem trước Bài tập
                      {selectedLesson.exerciseCount > 0 && (
                        <span className="ml-1 bg-white/20 text-white text-[9px] px-1.5 py-0.2 rounded-full font-black">
                          {selectedLesson.exerciseCount}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Controls for Theory Mode */}
              {viewMode === 'theory' && (
                <div className="flex items-center gap-2">
                  {/* Language Selector for Theory */}
                  <div className="flex bg-neutral-800/80 rounded-lg p-0.5 border border-neutral-700/60 shrink-0 mr-2">
                    <button
                      onClick={() => setActiveTab('en')}
                      className={`px-3 py-1 text-[11px] font-extrabold rounded-md transition-all ${
                        activeTab === 'en'
                          ? 'bg-neutral-900 text-white shadow-sm'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      🇬🇧 English
                    </button>
                    <button
                      onClick={() => setActiveTab('vi')}
                      className={`px-3 py-1 text-[11px] font-extrabold rounded-md transition-all ${
                        activeTab === 'vi'
                          ? 'bg-neutral-900 text-white shadow-sm'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      🇻🇳 Tiếng Việt
                    </button>
                  </div>

                  {isEditing ? (
                    <>
                      <button
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-700 rounded-xl transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        Hủy bỏ
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors disabled:opacity-50 shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                      >
                        {isSaving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Lưu lý thuyết
                      </button>
                    </>
                  ) : (
                    <>
                      {selectedLesson.hasContent ? (
                        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mr-2">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Đã có lý thuyết
                        </span>
                      ) : (
                        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 mr-2">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Trống lý thuyết
                        </span>
                      )}
                      <button
                        onClick={handleStartEdit}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-neutral-600 rounded-xl transition-colors"
                      >
                        <Edit3 className="w-4 h-4 text-neutral-400" />
                        Soạn / Chỉnh sửa
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Main Content Render Area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-neutral-950/40">
              {viewMode === 'exercise' ? (
                // EXERCISE PREVIEW MODE
                selectedExercise ? (
                  <div className="w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
                    {/* Exercise Card Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-neutral-950/60 border border-neutral-800 rounded-2xl">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1.5">
                            <Gamepad2 className="w-3.5 h-3.5" />
                            {selectedExercise.gameType || selectedExercise.materialType}
                          </span>
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                            selectedExercise.status === 'PUBLIC'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {selectedExercise.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <h2 className="text-xl font-extrabold text-white">{selectedExercise.title}</h2>
                          <button
                            onClick={() => handleRefreshExercise(selectedExercise.id)}
                            disabled={isRefreshingExercise}
                            title="Tải lại danh sách câu hỏi"
                            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-all border border-neutral-700/60 disabled:opacity-50"
                          >
                            <RotateCw className={`w-4 h-4 ${isRefreshingExercise ? 'animate-spin text-purple-400' : ''}`} />
                          </button>
                        </div>
                        {selectedExercise.instructions && (
                          <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
                            {selectedExercise.instructions}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-[11px] text-neutral-500 font-semibold pt-1">
                          {selectedExercise.teacherName && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 text-neutral-600" />
                              {selectedExercise.teacherName}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-neutral-600" />
                            {new Date(selectedExercise.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={(e) => handleOpenPracticeMode(e, selectedExercise.id, selectedExercise.slug)}
                          disabled={isStartingPractice}
                          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-md hover:shadow-purple-500/20 disabled:opacity-50"
                        >
                          {isStartingPractice ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <ExternalLink className="w-3.5 h-3.5" />
                          )}
                          Mở Bài tập (Học sinh)
                        </button>
                      </div>
                    </div>

                    {/* Questions Preview Section */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                          <Eye className="w-4 h-4 text-purple-400" />
                          Xem trước Nội dung & Câu hỏi Bài tập
                        </h3>
                      </div>
                      {renderExerciseQuestions(selectedExercise.questions)}
                    </div>
                  </div>
                ) : (
                  // Empty exercises warning
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 text-neutral-500">
                    <Gamepad2 className="w-12 h-12 text-purple-500/40 mb-4 animate-bounce" />
                    <h4 className="font-extrabold text-neutral-300 text-sm">Chọn một bài tập ở danh sách bên trái</h4>
                    <p className="text-xs text-neutral-500 mt-2 max-w-md">
                      Vui lòng bấm chọn một bài tập cụ thể ở thư mục bên trái để xem trước các câu hỏi và đáp án chi tiết.
                    </p>
                  </div>
                )
              ) : isPending ? (
                // Loading spinner for theory
                <div className="h-full w-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : isEditing ? (
                // EDIT MODE: CustomRichTextEditor
                <div className="w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-md flex flex-col gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Trình soạn lý thuyết ngữ pháp ({activeTab === 'en' ? 'English' : 'Tiếng Việt'})
                    </h3>
                    <p className="text-xs text-neutral-500 font-medium mt-0.5">
                      Viết bài giảng, cấu trúc ngữ pháp và ví dụ bằng ngôn ngữ tương ứng.
                    </p>
                  </div>
                  <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden p-2 text-white">
                    {activeTab === 'en' ? (
                      <CustomRichTextEditor 
                        value={editContentEn} 
                        onChange={setEditContentEn}
                        placeholder="Write English grammar theory here..."
                        minHeight="450px"
                        editorClassName="text-white bg-neutral-950 border-none outline-none focus:ring-0 min-h-[450px]"
                      />
                    ) : (
                      <CustomRichTextEditor 
                        value={editContentVi} 
                        onChange={setEditContentVi}
                        placeholder="Viết bản dịch lý thuyết ngữ pháp Tiếng Việt tại đây..."
                        minHeight="450px"
                        editorClassName="text-white bg-neutral-950 border-none outline-none focus:ring-0 min-h-[450px]"
                      />
                    )}
                  </div>
                </div>
              ) : !selectedLesson.hasContent ? (
                // READ MODE: Empty Content Warning
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-neutral-500">
                  <AlertTriangle className="w-12 h-12 text-amber-500/60 mb-4 animate-bounce" />
                  <h4 className="font-extrabold text-neutral-300 text-sm">Chưa có nội dung lý thuyết</h4>
                  <p className="text-xs text-neutral-500 mt-2 max-w-md">
                    Bài học này hiện chưa có nội dung lý thuyết. Hãy nhấn nút **"Soạn / Chỉnh sửa"** ở góc phải để bắt đầu soạn bài giảng ngữ pháp đầu tiên!
                  </p>
                </div>
              ) : lessonContent !== null ? (
                // READ MODE: HTML Content Preview
                <div className="w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8 shadow-sm">
                  {activeTab === 'vi' && !lessonTranslation ? (
                    <div className="text-center py-12 text-neutral-500">
                      <AlertTriangle className="w-10 h-10 text-amber-500/60 mx-auto mb-3" />
                      <h5 className="font-bold text-neutral-300 text-sm">Chưa có bản dịch Tiếng Việt</h5>
                      <p className="text-xs text-neutral-500 mt-1">
                        Nhấp vào nút "Soạn / Chỉnh sửa" và chuyển sang tab Tiếng Việt để bắt đầu viết bản dịch cho bài học này.
                      </p>
                    </div>
                  ) : (
                    <div
                      className="[&_h2]:text-orange-500 [&_h2]:font-black [&_h2]:text-base [&_h2]:uppercase [&_h2]:tracking-widest [&_h2]:mt-6 [&_h2]:mb-3
                        [&_p]:text-neutral-300 [&_p]:leading-relaxed [&_p]:mb-4
                        [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_ul]:mb-4 [&_li]:text-neutral-300
                        [&_table]:w-full [&_table]:border-collapse [&_table]:my-6 [&_table]:text-sm
                        [&_th]:bg-neutral-800 [&_th]:border [&_th]:border-neutral-700 [&_th]:p-3 [&_th]:font-bold [&_th]:text-neutral-200 [&_th]:text-left
                        [&_td]:border [&_td]:border-neutral-700 [&_td]:p-3 [&_td]:text-neutral-300
                        [&_a]:text-blue-400 [&_a]:underline
                        [&_div]:rounded-2xl"
                      dangerouslySetInnerHTML={{ __html: activeTab === 'en' ? lessonContent : (lessonTranslation || "") }}
                    />
                  )}
                </div>
              ) : (
                // Content loading fallback
                <div className="h-full w-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-neutral-700" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
