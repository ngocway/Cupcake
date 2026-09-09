"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Sparkles,
  Save,
  Check,
  X,
  AlertCircle,
  Loader2,
  FileText,
  GripVertical,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import {
  saveShooterQuizGameAction,
  getShooterQuizGameDetailsAction,
} from "@/actions/shooter-quiz-actions";
import { GameSaveSuccessModal } from "@/app/teacher/_components/GameSaveSuccessModal";
import type {
  QuizRound,
  QuizQuestion,
  QuizQuestionOption,
} from "@/types/candy-quiz";

const MIN_QUESTIONS_PER_ROUND = 2;
const MAX_QUESTIONS_PER_ROUND = 20;
const MAX_ROUNDS = 10;

function createDefaultQuestion(id: string): QuizQuestion {
  return {
    id,
    question: "",
    imageUrl: undefined,
    options: [
      { id: "A", text: "", isCorrect: true },
      { id: "B", text: "", isCorrect: false },
      { id: "C", text: "", isCorrect: false },
      { id: "D", text: "", isCorrect: false },
    ],
  };
}

const INITIAL_ROUNDS: QuizRound[] = [
  {
    id: "round-1",
    title: "Vòng 1",
    questions: [
      createDefaultQuestion("q-1-1"),
      createDefaultQuestion("q-1-2"),
    ],
  },
];

interface SortableOptionItemProps {
  qId: string;
  opt: QuizQuestionOption;
  optIdx: number;
  totalOptions: number;
  handleSelectCorrectOption: (questionId: string, optionIdx: number) => void;
  handleOptionTextChange: (questionId: string, optionIdx: number, text: string) => void;
  handleDeleteOption: (questionId: string, optionIdx: number) => void;
}

function SortableOptionItem({
  qId,
  opt,
  optIdx,
  totalOptions,
  handleSelectCorrectOption,
  handleOptionTextChange,
  handleDeleteOption,
}: SortableOptionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: opt.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 20 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-2 rounded-2xl border transition-all ${
        isDragging
          ? "ring-2 ring-amber-500 shadow-xl bg-white dark:bg-slate-800 scale-[1.01]"
          : ""
      } ${
        opt.isCorrect
          ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-400 ring-2 ring-emerald-400/20"
          : "bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700"
      }`}
    >
      {/* Option Drag Handle */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="w-6 h-6 rounded-lg text-slate-300 hover:text-slate-600 dark:text-slate-600 dark:hover:text-slate-300 flex items-center justify-center cursor-grab active:cursor-grabbing shrink-0 transition-colors"
        title="Kéo thả để đổi vị trí đáp án"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>

      {/* Radio selection circle / Option Badge */}
      <button
        type="button"
        onClick={() => handleSelectCorrectOption(qId, optIdx)}
        className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-all cursor-pointer ${
          opt.isCorrect
            ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30 scale-105"
            : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-amber-100 hover:text-amber-700"
        }`}
        title={opt.isCorrect ? "Đáp án ĐÚNG" : "Click để chọn làm đáp án ĐÚNG"}
      >
        {opt.isCorrect ? <Check className="w-4 h-4 stroke-[3]" /> : opt.id}
      </button>

      {/* Option Text Input */}
      <input
        type="text"
        value={opt.text}
        onChange={(e) => handleOptionTextChange(qId, optIdx, e.target.value)}
        placeholder={`Nhập đáp án ${opt.id} (hỗ trợ câu dài)...`}
        className="flex-1 bg-transparent text-slate-800 dark:text-white font-semibold text-xs sm:text-sm focus:outline-none placeholder:text-slate-400 placeholder:font-normal"
      />

      {/* Delete option button (x) */}
      {totalOptions > 2 && (
        <button
          type="button"
          onClick={() => handleDeleteOption(qId, optIdx)}
          className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center justify-center transition-all shrink-0 cursor-pointer"
          title={`Bỏ đáp án ${opt.id}`}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

interface SortableQuestionCardProps {
  q: QuizQuestion;
  qIdx: number;
  handleDeleteQuestion: (id: string) => void;
  handleQuestionTextChange: (id: string, text: string) => void;
  handleAddOption: (id: string) => void;
  handleSelectCorrectOption: (questionId: string, optionIdx: number) => void;
  handleOptionTextChange: (questionId: string, optionIdx: number, text: string) => void;
  handleDeleteOption: (questionId: string, optionIdx: number) => void;
  handleReorderOptions: (questionId: string, oldIndex: number, newIndex: number) => void;
}

function SortableQuestionCard({
  q,
  qIdx,
  handleDeleteQuestion,
  handleQuestionTextChange,
  handleAddOption,
  handleSelectCorrectOption,
  handleOptionTextChange,
  handleDeleteOption,
  handleReorderOptions,
}: SortableQuestionCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: q.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 50 : 1,
  };

  const optionSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleOptionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = q.options.findIndex((opt) => opt.id === active.id);
      const newIndex = q.options.findIndex((opt) => opt.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        handleReorderOptions(q.id, oldIndex, newIndex);
      }
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-slate-900 rounded-3xl border border-primary/10 shadow-md p-6 flex flex-col justify-between gap-5 relative group hover:border-cyan-400/50 transition-all ${
        isDragging ? "ring-2 ring-cyan-500 shadow-2xl scale-[1.02]" : ""
      }`}
    >
      {/* Card Top: Drag handle, Number & Delete Question */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="w-7 h-7 rounded-xl bg-slate-100 hover:bg-cyan-100 dark:bg-slate-800 dark:hover:bg-cyan-950/60 text-slate-400 hover:text-cyan-600 transition-all flex items-center justify-center cursor-grab active:cursor-grabbing shrink-0"
            title="Kéo thả để đổi vị trí câu hỏi"
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <span className="w-7 h-7 rounded-xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400 font-black text-xs flex items-center justify-center">
            #{qIdx + 1}
          </span>
          <span className="font-headline font-black text-sm uppercase tracking-wide text-slate-700 dark:text-slate-200">
            CÂU HỎI #{qIdx + 1}
          </span>
        </div>

        <button
          type="button"
          onClick={() => handleDeleteQuestion(q.id)}
          className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-rose-100 dark:bg-slate-800 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 transition-all flex items-center justify-center cursor-pointer"
          title="Xóa câu hỏi này"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Question Text */}
      <div className="w-full flex flex-col">
        <div className="h-5 flex items-center mb-1.5">
          <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider">
            Nội dung câu hỏi <span className="text-rose-500">*</span>
          </label>
        </div>
        <textarea
          rows={3}
          value={q.question}
          onChange={(e) => handleQuestionTextChange(q.id, e.target.value)}
          placeholder="VD: Which shape has three straight sides and three corners?"
          className="w-full h-[90px] px-3.5 py-2.5 rounded-[5px] bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-bold text-sm focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all resize-none placeholder:text-slate-400 placeholder:font-normal leading-relaxed"
        />
      </div>

      {/* Options */}
      <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider">
            Các đáp án ({q.options.length}/4) • Chọn đáp án ĐÚNG:
          </label>
          {q.options.length < 4 && (
            <button
              type="button"
              onClick={() => handleAddOption(q.id)}
              className="text-[11px] font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm đáp án</span>
            </button>
          )}
        </div>

        <DndContext
          id={`dnd-options-${q.id}`}
          sensors={optionSensors}
          collisionDetection={closestCenter}
          onDragEnd={handleOptionDragEnd}
        >
          <SortableContext
            items={q.options.map((opt) => opt.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {q.options.map((opt, optIdx) => (
                <SortableOptionItem
                  key={opt.id}
                  qId={q.id}
                  opt={opt}
                  optIdx={optIdx}
                  totalOptions={q.options.length}
                  handleSelectCorrectOption={handleSelectCorrectOption}
                  handleOptionTextChange={handleOptionTextChange}
                  handleDeleteOption={handleDeleteOption}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

export function ShooterQuizCreatorUI() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const topicId = searchParams?.get("topicId") || null;

  const [title, setTitle] = useState("");
  const [titleError, setTitleError] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [gradeLevel, setGradeLevel] = useState("kids-2-5");
  const [isLoadingTopic, setIsLoadingTopic] = useState(Boolean(topicId));
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [savedTopicId, setSavedTopicId] = useState<string | null>(null);

  // Multi-Round State
  const [rounds, setRounds] = useState<QuizRound[]>(INITIAL_ROUNDS);
  const [activeRoundIndex, setActiveRoundIndex] = useState(0);

  const currentRound = rounds[activeRoundIndex] || rounds[0];
  const questions = currentRound?.questions || [];

  // Drag & Drop Sensors & Handler for Reordering Questions
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = questions.findIndex((q) => q.id === active.id);
      const newIndex = questions.findIndex((q) => q.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const updatedQuestions = arrayMove(questions, oldIndex, newIndex);
        const updatedRounds = [...rounds];
        updatedRounds[activeRoundIndex] = {
          ...currentRound,
          questions: updatedQuestions,
        };
        setRounds(updatedRounds);
      }
    }
  };

  // Saving state
  const [isSaving, setIsSaving] = useState(false);

  // Bulk Upload Modal State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);


  // Load existing topic details when editing
  useEffect(() => {
    if (!topicId) return;

    async function loadTopicDetails() {
      setIsLoadingTopic(true);
      const res = await getShooterQuizGameDetailsAction(topicId!);
      if (res.success && res.topic) {
        setTitle(res.topic.title || "");
        if (res.topic.gradeLevel) setGradeLevel(res.topic.gradeLevel);
        if (res.topic.rounds && res.topic.rounds.length > 0) {
          setRounds(res.topic.rounds);
        }
      } else {
        toast.error(res.error || "Không thể tải chi tiết bài tập!");
      }
      setIsLoadingTopic(false);
    }

    loadTopicDetails();
  }, [topicId]);

  // Round Management
  const handleAddRound = () => {
    if (rounds.length >= MAX_ROUNDS) {
      toast.warning(`Tối đa ${MAX_ROUNDS} vòng cho mỗi bài tập!`);
      return;
    }
    const newRoundIndex = rounds.length + 1;
    const newRound: QuizRound = {
      id: `round-${Date.now()}`,
      title: `Vòng ${newRoundIndex}`,
      questions: [
        createDefaultQuestion(`q-${newRoundIndex}-1`),
        createDefaultQuestion(`q-${newRoundIndex}-2`),
      ],
    };
    setRounds([...rounds, newRound]);
    setActiveRoundIndex(rounds.length);
    toast.success(`Đã thêm Vòng ${newRoundIndex}`);
  };

  const handleDeleteRound = (indexToDelete: number) => {
    if (rounds.length <= 1) {
      toast.warning("Bài tập phải có ít nhất 1 vòng!");
      return;
    }
    const updated = rounds.filter((_, idx) => idx !== indexToDelete).map((r, idx) => ({
      ...r,
      title: `Vòng ${idx + 1}`,
    }));
    setRounds(updated);
    if (activeRoundIndex >= updated.length) {
      setActiveRoundIndex(updated.length - 1);
    }
    toast.info("Đã xóa vòng");
  };

  // Question Management in Active Round
  const handleAddQuestion = () => {
    if (questions.length >= MAX_QUESTIONS_PER_ROUND) {
      toast.warning(`Mỗi vòng tối đa ${MAX_QUESTIONS_PER_ROUND} câu hỏi!`);
      return;
    }
    const newQ = createDefaultQuestion(`q-${Date.now()}-${questions.length + 1}`);
    const updatedRounds = [...rounds];
    updatedRounds[activeRoundIndex] = {
      ...currentRound,
      questions: [...questions, newQ],
    };
    setRounds(updatedRounds);
  };

  const handleDeleteQuestion = (questionId: string) => {
    const updatedQuestions = questions.filter((q) => q.id !== questionId);
    const updatedRounds = [...rounds];
    updatedRounds[activeRoundIndex] = {
      ...currentRound,
      questions: updatedQuestions,
    };
    setRounds(updatedRounds);
    toast.info("Đã xóa câu hỏi");
  };

  const handleQuestionTextChange = (questionId: string, text: string) => {
    const updatedQuestions = questions.map((q) => {
      if (q.id === questionId) {
        return { ...q, question: text };
      }
      return q;
    });
    const updatedRounds = [...rounds];
    updatedRounds[activeRoundIndex] = {
      ...currentRound,
      questions: updatedQuestions,
    };
    setRounds(updatedRounds);
  };

  // Options Handlers
  const handleOptionTextChange = (questionId: string, optIndex: number, text: string) => {
    const updatedQuestions = questions.map((q) => {
      if (q.id === questionId) {
        const newOptions = [...q.options];
        newOptions[optIndex] = { ...newOptions[optIndex], text };
        return { ...q, options: newOptions };
      }
      return q;
    });
    const updatedRounds = [...rounds];
    updatedRounds[activeRoundIndex] = {
      ...currentRound,
      questions: updatedQuestions,
    };
    setRounds(updatedRounds);
  };

  const handleSelectCorrectOption = (questionId: string, optIndex: number) => {
    const updatedQuestions = questions.map((q) => {
      if (q.id === questionId) {
        const newOptions = q.options.map((opt, i) => ({
          ...opt,
          isCorrect: i === optIndex,
        }));
        return { ...q, options: newOptions };
      }
      return q;
    });
    const updatedRounds = [...rounds];
    updatedRounds[activeRoundIndex] = {
      ...currentRound,
      questions: updatedQuestions,
    };
    setRounds(updatedRounds);
  };

  const handleDeleteOption = (questionId: string, optIndex: number) => {
    const targetQ = questions.find((q) => q.id === questionId);
    if (!targetQ) return;

    if (targetQ.options.length <= 2) {
      toast.warning("Mỗi câu hỏi phải có ít nhất 2 đáp án!");
      return;
    }

    const updatedQuestions = questions.map((q) => {
      if (q.id === questionId) {
        const remaining = q.options.filter((_, i) => i !== optIndex);
        const reindexed = remaining.map((opt, i) => ({
          ...opt,
          id: String.fromCharCode(65 + i),
        }));
        const hasCorrect = reindexed.some((opt) => opt.isCorrect);
        if (!hasCorrect && reindexed.length > 0) {
          reindexed[0].isCorrect = true;
        }
        return { ...q, options: reindexed };
      }
      return q;
    });

    const updatedRounds = [...rounds];
    updatedRounds[activeRoundIndex] = {
      ...currentRound,
      questions: updatedQuestions,
    };
    setRounds(updatedRounds);
  };

  const handleAddOption = (questionId: string) => {
    const targetQ = questions.find((q) => q.id === questionId);
    if (!targetQ) return;

    if (targetQ.options.length >= 4) {
      toast.warning("Mỗi câu hỏi tối đa 4 đáp án!");
      return;
    }

    const nextLetter = String.fromCharCode(65 + targetQ.options.length);
    const newOpt: QuizQuestionOption = {
      id: nextLetter,
      text: "",
      isCorrect: false,
    };

    const updatedQuestions = questions.map((q) => {
      if (q.id === questionId) {
        return { ...q, options: [...q.options, newOpt] };
      }
      return q;
    });

    const updatedRounds = [...rounds];
    updatedRounds[activeRoundIndex] = {
      ...currentRound,
      questions: updatedQuestions,
    };
    setRounds(updatedRounds);
  };

  const handleReorderOptions = (questionId: string, oldIndex: number, newIndex: number) => {
    const updatedQuestions = questions.map((q) => {
      if (q.id === questionId) {
        const moved = arrayMove(q.options, oldIndex, newIndex);
        const reindexed = moved.map((opt, i) => ({
          ...opt,
          id: String.fromCharCode(65 + i),
        }));
        return { ...q, options: reindexed };
      }
      return q;
    });

    const updatedRounds = [...rounds];
    updatedRounds[activeRoundIndex] = {
      ...currentRound,
      questions: updatedQuestions,
    };
    setRounds(updatedRounds);
  };


  // Parse Bulk Text
  const handleApplyBulkText = () => {
    if (!bulkText.trim()) {
      toast.error("Vui lòng dán văn bản câu hỏi!");
      return;
    }

    const lines = bulkText.split("\n").map((l) => l.trim()).filter(Boolean);
    const rawQuestions: Array<{
      question: string;
      rawSnippet: string;
      options: QuizQuestionOption[];
    }> = [];
    let currentRaw: {
      question: string;
      rawSnippet: string;
      options: QuizQuestionOption[];
    } | null = null;

    lines.forEach((line) => {
      const optionMatch = line.match(/^(\*)?\s*([A-Za-z])[\.\:\)\-]\s*(.*)$/);
      if (optionMatch && currentRaw) {
        const isCorrect = Boolean(optionMatch[1]);
        const letter = optionMatch[2].toUpperCase();
        const text = optionMatch[3].trim();
        currentRaw.options.push({
          id: letter,
          text,
          isCorrect,
        });
      } else {
        if (currentRaw) {
          rawQuestions.push(currentRaw);
        }
        const cleanQuestion = line.replace(/^(câu\s*\d+[\.\:\-]|question\s*\d+[\.\:\-]|\d+[\.\:\-])\s*/i, "").trim();
        currentRaw = {
          question: cleanQuestion,
          rawSnippet: cleanQuestion.length > 45 ? cleanQuestion.slice(0, 45) + "..." : cleanQuestion,
          options: [],
        };
      }
    });

    if (currentRaw) {
      rawQuestions.push(currentRaw);
    }

    if (rawQuestions.length === 0) {
      setBulkErrors(["Không tìm thấy nội dung câu hỏi nào trong văn bản! Vui lòng nhập theo định dạng mẫu."]);
      return;
    }

    const errors: string[] = [];
    const validQuestions: QuizQuestion[] = [];

    rawQuestions.forEach((q, idx) => {
      const qNum = idx + 1;
      const snippet = q.rawSnippet ? `"${q.rawSnippet}"` : `Câu #${qNum}`;

      if (!q.question.trim()) {
        errors.push(`Câu #${qNum}: Nội dung câu hỏi đang để trống!`);
        return;
      }

      if (q.options.length < 2) {
        errors.push(
          `Câu #${qNum} (${snippet}): Chỉ có ${q.options.length} đáp án — Cần tối thiểu 2 đáp án!`
        );
      } else if (q.options.length > 4) {
        errors.push(
          `Câu #${qNum} (${snippet}): Có ${q.options.length} đáp án — Tối đa chỉ được 4 đáp án!`
        );
      }

      q.options.forEach((opt) => {
        if (!opt.text.trim()) {
          errors.push(`Câu #${qNum} (${snippet}): Đáp án ${opt.id} chưa có nội dung chữ!`);
        }
      });

      const correctOptions = q.options.filter((opt) => opt.isCorrect);
      if (correctOptions.length === 0) {
        errors.push(
          `Câu #${qNum} (${snippet}): Chưa có đáp án đúng (Vui lòng thêm dấu * trước đáp án đúng, ví dụ: *${q.options[0]?.id || "A"}.)`
        );
      } else if (correctOptions.length > 1) {
        const markedList = correctOptions.map((o) => `*${o.id}`).join(", ");
        errors.push(
          `Câu #${qNum} (${snippet}): Có ${correctOptions.length} đáp án đúng (${markedList}) — Chỉ được chọn duy nhất 1 đáp án đúng!`
        );
      }

      validQuestions.push({
        id: `q-bulk-${Date.now()}-${idx}`,
        question: q.question,
        options: q.options,
      });
    });

    if (errors.length > 0) {
      setBulkErrors(errors);
      toast.error(`Phát hiện ${errors.length} câu có lỗi! Vui lòng xem chi tiết bên dưới khung dán.`);
      return;
    }

    setBulkErrors([]);
    const parsedQuestions = validQuestions;

    const isCurrentRoundBlank = questions.every(
      (q) => !q.question.trim() && q.options.every((opt) => !opt.text.trim())
    );

    const baseQuestions = isCurrentRoundBlank ? [] : [...questions];
    const availableInCurrent = MAX_QUESTIONS_PER_ROUND - baseQuestions.length;

    const fillCurrent = parsedQuestions.slice(0, availableInCurrent);
    const overflowQuestions = parsedQuestions.slice(availableInCurrent);

    const updatedRounds = [...rounds];
    updatedRounds[activeRoundIndex] = {
      ...currentRound,
      questions: [...baseQuestions, ...fillCurrent],
    };

    let createdRoundsCount = 0;
    if (overflowQuestions.length > 0) {
      let remaining = [...overflowQuestions];
      while (remaining.length > 0 && updatedRounds.length < MAX_ROUNDS) {
        const chunk = remaining.slice(0, MAX_QUESTIONS_PER_ROUND);
        remaining = remaining.slice(MAX_QUESTIONS_PER_ROUND);
        createdRoundsCount++;
        const nextRoundNum = updatedRounds.length + 1;
        updatedRounds.push({
          id: `round-${Date.now()}-${nextRoundNum}`,
          title: `Vòng ${nextRoundNum}`,
          questions: chunk,
        });
      }

      if (remaining.length > 0) {
        toast.warning(
          `Đã đạt giới hạn tối đa ${MAX_ROUNDS} vòng. Bỏ qua ${remaining.length} câu hỏi dư.`
        );
      }
    }

    setRounds(updatedRounds);

    if (createdRoundsCount > 0) {
      toast.success(
        `Đã tự động nạp ${parsedQuestions.length - (overflowQuestions.length > 0 && updatedRounds.length >= MAX_ROUNDS ? Math.max(0, overflowQuestions.length - (createdRoundsCount * MAX_QUESTIONS_PER_ROUND)) : 0)} câu hỏi và tạo thêm ${createdRoundsCount} vòng mới!`
      );
    } else {
      toast.success(
        isCurrentRoundBlank
          ? `Đã nạp ${parsedQuestions.length} câu hỏi vào ${currentRound.title}`
          : `Đã thêm tiếp ${fillCurrent.length} câu hỏi vào ${currentRound.title}`
      );
    }

    setIsBulkModalOpen(false);
    setBulkText("");
  };

  // Full Validation & Save
  const handleSaveGame = async () => {
    // 1. Validate Title
    if (!title.trim()) {
      setTitleError(true);
      toast.error("Vui lòng nhập tên bài tập!");
      titleInputRef.current?.focus();
      return;
    }
    setTitleError(false);

    // 2. Validate Rounds
    if (rounds.length === 0) {
      toast.error("Bài tập phải có ít nhất 1 vòng!");
      return;
    }

    for (let rIdx = 0; rIdx < rounds.length; rIdx++) {
      const r = rounds[rIdx];
      if (r.questions.length < MIN_QUESTIONS_PER_ROUND) {
        setActiveRoundIndex(rIdx);
        toast.error(`${r.title} phải có ít nhất ${MIN_QUESTIONS_PER_ROUND} câu hỏi! Hiện có ${r.questions.length} câu.`);
        return;
      }
      if (r.questions.length > MAX_QUESTIONS_PER_ROUND) {
        setActiveRoundIndex(rIdx);
        toast.error(`${r.title} có tối đa ${MAX_QUESTIONS_PER_ROUND} câu hỏi!`);
        return;
      }

      for (let qIdx = 0; qIdx < r.questions.length; qIdx++) {
        const q = r.questions[qIdx];
        if (!q.question.trim()) {
          setActiveRoundIndex(rIdx);
          toast.error(`${r.title}, Câu hỏi #${qIdx + 1} chưa có nội dung câu hỏi!`);
          return;
        }

        if (q.options.length < 2 || q.options.length > 4) {
          setActiveRoundIndex(rIdx);
          toast.error(`${r.title}, Câu hỏi #${qIdx + 1} phải có từ 2 đến 4 đáp án!`);
          return;
        }

        for (let oIdx = 0; oIdx < q.options.length; oIdx++) {
          const opt = q.options[oIdx];
          if (!opt.text.trim()) {
            setActiveRoundIndex(rIdx);
            toast.error(`${r.title}, Câu hỏi #${qIdx + 1}, Đáp án ${opt.id} không được để trống!`);
            return;
          }
        }

        const correctCount = q.options.filter((opt) => opt.isCorrect).length;
        if (correctCount !== 1) {
          setActiveRoundIndex(rIdx);
          toast.error(`${r.title}, Câu hỏi #${qIdx + 1} phải chọn đúng 1 đáp án đúng!`);
          return;
        }
      }
    }

    // 3. Save to backend
    setIsSaving(true);
    try {
      const res = await saveShooterQuizGameAction({
        topicId: topicId || undefined,
        title: title.trim(),
        gradeLevel,
        rounds,
      });

      if (res.success) {
        toast.dismiss();
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("cached_teacher_quiz_games");
        }
        setSavedTopicId(res.topicId || (res as any).id || topicId);
        setIsSuccessModalOpen(true);
      } else {
        toast.error(res.error || "Không thể lưu bài tập!");
      }
    } catch (err: any) {
      toast.error(err?.message || "Lỗi hệ thống khi lưu bài tập!");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingTopic) {
    return (
      <div className="w-full min-h-[500px] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
        <p className="text-slate-500 font-bold text-sm">Đang tải chi tiết bài tập...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300 pb-28">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-5 md:p-6 rounded-3xl border border-primary/10 shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            href="/teacher?tab=quiz"
            className="w-11 h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all active:scale-95 shrink-0"
            title="Quay lại"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </Link>

          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-xs">
                BẮN SÚNG TRẮC NGHIỆM
              </span>
              <span className="text-xs font-semibold text-slate-400">
                • Tạo bài tập trắc nghiệm Bắn súng Neon không gian
              </span>
            </div>
            <h1 className="font-headline font-black text-xl sm:text-2xl text-slate-800 dark:text-white tracking-tight">
              {topicId ? "Chỉnh sửa Game Bắn súng Trắc nghiệm" : "Tạo mới Game Bắn súng Trắc nghiệm"}
            </h1>
          </div>
        </div>

        {/* BULK UPLOAD BUTTON */}
        <button
          type="button"
          onClick={() => setIsBulkModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 font-bold text-xs uppercase tracking-wider transition-all active:scale-95 shadow-xs shrink-0 cursor-pointer"
        >
          <FileText className="w-4 h-4 text-amber-600" />
          <span>Tải câu hỏi hàng loạt</span>
        </button>
      </div>

      {/* CARD 1: TITLE & METADATA */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-primary/10 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
            TÊN BÀI TẬP / TIÊU ĐỀ GAME <span className="text-rose-500">*</span>
          </label>
          <input
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (e.target.value.trim()) setTitleError(false);
            }}
            placeholder="VD: English 2D Shapes, Animals Vocabulary..."
            className={`w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border text-slate-800 dark:text-white font-bold text-base focus:outline-none transition-all placeholder:text-slate-400 placeholder:font-normal ${
              titleError
                ? "border-rose-500 ring-2 ring-rose-500/20 animate-shake"
                : "border-slate-200 dark:border-slate-700/80 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
            }`}
          />
          {titleError && (
            <p className="text-xs font-bold text-rose-500 mt-1.5 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              Vui lòng nhập tên bài tập!
            </p>
          )}
        </div>
      </div>

      {/* CARD 2: ROUND MANAGEMENT TABS */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-primary/10 shadow-sm flex items-center gap-3 overflow-x-auto select-none no-scrollbar">
        <div className="flex items-center gap-2 shrink-0">
          {rounds.map((round, idx) => {
            const isActive = idx === activeRoundIndex;
            return (
              <div key={round.id} className="flex items-center">
                <button
                  type="button"
                  onClick={() => setActiveRoundIndex(idx)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-md shadow-amber-500/25 scale-100"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <span>{round.title}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive
                        ? "bg-white/25 text-white"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {round.questions.length} câu
                  </span>
                </button>

                {rounds.length > 1 && isActive && (
                  <button
                    type="button"
                    onClick={() => handleDeleteRound(idx)}
                    className="ml-1.5 w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 flex items-center justify-center transition-all cursor-pointer"
                    title="Xóa vòng này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {rounds.length < MAX_ROUNDS && (
          <button
            type="button"
            onClick={handleAddRound}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 text-slate-500 hover:text-amber-600 dark:text-slate-400 font-bold text-xs uppercase tracking-wider transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Vòng Mới</span>
          </button>
        )}
      </div>

      {/* QUESTIONS GRID SECTION */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <h2 className="font-headline font-black text-lg text-slate-800 dark:text-slate-100">
              Danh Sách Câu Hỏi ({questions.length}/{MAX_QUESTIONS_PER_ROUND} câu)
            </h2>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            Tối thiểu 2 câu • Click vào ký hiệu A/B/C/D để chọn đáp án ĐÚNG
          </span>
        </div>

        <DndContext
          id={`dnd-questions-${currentRound?.id || "round"}`}
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={questions.map((q) => q.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {questions.map((q, qIdx) => (
                <SortableQuestionCard
                  key={q.id}
                  q={q}
                  qIdx={qIdx}
                  handleDeleteQuestion={handleDeleteQuestion}
                  handleQuestionTextChange={handleQuestionTextChange}
                  handleAddOption={handleAddOption}
                  handleSelectCorrectOption={handleSelectCorrectOption}
                  handleOptionTextChange={handleOptionTextChange}
                  handleDeleteOption={handleDeleteOption}
                  handleReorderOptions={handleReorderOptions}
                />
              ))}

              {/* Add Question Card */}
              {questions.length < MAX_QUESTIONS_PER_ROUND && (
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="min-h-[300px] rounded-3xl border-2 border-dashed border-cyan-300 dark:border-cyan-800/60 hover:border-cyan-500 bg-cyan-50/30 dark:bg-cyan-950/10 hover:bg-cyan-50/70 flex flex-col items-center justify-center gap-3 transition-all group cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-2xl bg-cyan-500 text-white flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform">
                    <Plus className="w-7 h-7 stroke-[3]" />
                  </div>
                  <div className="text-center">
                    <span className="font-headline font-black text-base text-cyan-700 dark:text-cyan-400 block">
                      + Thêm 1 câu hỏi
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      Tạo câu hỏi thứ {questions.length + 1} cho {currentRound.title}
                    </span>
                  </div>
                </button>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* FLOATING SAVE BAR */}
      <div className="fixed bottom-6 right-6 md:right-12 z-50 animate-in slide-in-from-bottom-5 duration-300">
        <button
          type="button"
          onClick={handleSaveGame}
          disabled={isSaving}
          className="flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:to-yellow-600 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-amber-500/30 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Đang lưu...</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5 stroke-[2.5]" />
              <span>LƯU BÀI TẬP</span>
            </>
          )}
        </button>
      </div>

      {/* BULK UPLOAD MODAL */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-headline font-black text-lg text-slate-800 dark:text-white leading-tight">
                    Tải Câu Hỏi Hàng Loạt
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold">
                    Dán danh sách câu hỏi văn bản nhanh chóng
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition-all cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Sleek Tip Callout with Copy Example Action */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/30 dark:via-yellow-950/20 dark:to-orange-950/20 border border-amber-200/70 dark:border-amber-900/50 text-xs">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>
                    Đặt dấu <span className="font-mono font-black text-amber-700 dark:text-amber-400 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded shadow-xs">*</span> trước đáp án đúng (ví dụ: <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">*A.</strong>)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setBulkText(
`Câu 1: Which 2D shape usually has exactly three straight sides and three corners?
*A. Triangle
B. Square
C. Circle
D. Rectangle

Câu 2: What color is a ripe banana?
A. Blue
*B. Yellow
C. Purple
D. Black`
                    );
                    toast.success("Đã điền nội dung mẫu!");
                  }}
                  className="shrink-0 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-slate-700 border border-amber-200 dark:border-slate-700 font-bold text-[11px] text-amber-700 dark:text-amber-300 transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  📋 Dán nội dung mẫu
                </button>
              </div>

              {/* Textarea Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                    Khung nhập văn bản:
                  </span>
                  {bulkText && (
                    <button
                      type="button"
                      onClick={() => setBulkText("")}
                      className="text-[11px] font-bold text-slate-400 hover:text-rose-500 cursor-pointer transition-colors"
                    >
                      Xóa trắng
                    </button>
                  )}
                </div>

                <textarea
                  rows={bulkErrors.length > 0 ? 6 : 9}
                  value={bulkText}
                  onChange={(e) => {
                    setBulkText(e.target.value);
                    if (bulkErrors.length > 0) setBulkErrors([]);
                  }}
                  placeholder={`Dán danh sách câu hỏi của bạn tại đây...\n\nVí dụ:\nCâu 1: Which 2D shape has three sides?\n*A. Triangle (đáp án đúng)\nB. Circle\nC. Square\nD. Rectangle`}
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-white font-medium text-xs font-mono leading-relaxed focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all placeholder:text-slate-400 placeholder:font-sans placeholder:text-xs"
                />
              </div>

              {/* Errors Display Box */}
              {bulkErrors.length > 0 && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-rose-700 dark:text-rose-300">
                    <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>Phát hiện {bulkErrors.length} lỗi cần sửa:</span>
                    </div>
                    <span className="text-[11px] font-semibold text-rose-500/80">
                      Sửa trực tiếp trong khung trên rồi bấm lại "Áp dụng"
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1 no-scrollbar text-xs">
                    {bulkErrors.map((err, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-rose-200/60 dark:border-rose-900/50 text-rose-800 dark:text-rose-200 font-medium leading-relaxed shadow-2xs"
                      >
                        <span className="w-4 h-4 rounded-full bg-rose-500 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span>{err}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-slate-500 hover:bg-slate-200/60 dark:hover:bg-slate-800 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleApplyBulkText}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Áp dụng vào bài tập</span>
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Save Success Modal */}
      <GameSaveSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title={title}
        gameType="Bắn súng Trắc nghiệm"
        playUrl={`/student/game/shooter-quiz?topicId=${savedTopicId || topicId}`}
        redirectTab="my-quiz-games"
      />
    </div>
  );
}
