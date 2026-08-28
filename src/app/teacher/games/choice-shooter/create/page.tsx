"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, 
  Sparkles, 
  CheckCircle2, 
  RefreshCw, 
  Play, 
  Copy, 
  Check, 
  FolderOpen, 
  PlusCircle, 
  Plus, 
  Minus, 
  X,
  Volume2,
  VolumeX,
  ShieldAlert,
  Edit3
} from "lucide-react";
import { HomeShell } from "@/app/_components/HomeShell";
import { saveChoiceShooterGame, getChoiceShooterGameById, ChoiceShooterGame } from "@/lib/choice-shooter-storage";
import { SciFiNeonShooterGame } from "@/app/_components/SciFiNeonShooterGame";

// ==========================================
// TYPES & MATH GENERATOR HELPERS
// ==========================================
interface MathTypeOption {
  id: string;
  category: "add" | "sub" | "mul" | "div" | "find_x" | "compare";
  title: string;
  example: string;
  badge: string;
  badgeBg: string;
}

const MATH_TYPE_OPTIONS: MathTypeOption[] = [
  {
    id: "add_1",
    category: "add",
    title: "Cộng 2 số 1 chữ số",
    example: "6 + 7 = ?",
    badge: "Phép cộng",
    badgeBg: "bg-emerald-100 text-emerald-700 border-emerald-300"
  },
  {
    id: "add_2",
    category: "add",
    title: "Cộng 2 số 2 chữ số",
    example: "25 + 34 = ?",
    badge: "Phép cộng",
    badgeBg: "bg-emerald-100 text-emerald-700 border-emerald-300"
  },
  {
    id: "sub_1",
    category: "sub",
    title: "Trừ 2 số 1 chữ số",
    example: "9 - 4 = ?",
    badge: "Phép trừ",
    badgeBg: "bg-sky-100 text-sky-700 border-sky-300"
  },
  {
    id: "sub_2",
    category: "sub",
    title: "Trừ 2 số 2 chữ số (không âm)",
    example: "68 - 25 = ?",
    badge: "Phép trừ",
    badgeBg: "bg-sky-100 text-sky-700 border-sky-300"
  },
  {
    id: "mul_1",
    category: "mul",
    title: "Nhân 2 số 1 chữ số",
    example: "7 × 8 = ?",
    badge: "Phép nhân",
    badgeBg: "bg-orange-100 text-orange-700 border-orange-300"
  },
  {
    id: "div_1",
    category: "div",
    title: "Chia 2 số cơ bản (chia hết)",
    example: "45 ÷ 5 = ?",
    badge: "Phép chia",
    badgeBg: "bg-purple-100 text-purple-700 border-purple-300"
  },
  {
    id: "find_x",
    category: "find_x",
    title: "Tìm X (Ẩn số)",
    example: "X + 7 = 15 ➔ X = ?",
    badge: "Tìm X",
    badgeBg: "bg-teal-100 text-teal-700 border-teal-300"
  },
  {
    id: "compare_1",
    category: "compare",
    title: "So sánh biểu thức (>, <, =)",
    example: "12 + 5 ... 20 - 4",
    badge: "So sánh",
    badgeBg: "bg-pink-100 text-pink-700 border-pink-300"
  }
];

interface GeneratedQuestion {
  id: string;
  typeId: string;
  q: string;
  a: string;
  wrong: [string, string, string];
}

function generateSingleQuestion(typeId: string): GeneratedQuestion {
  const id = Math.random().toString(36).substring(2, 9);
  let q = "";
  let correctNum = 0;

  switch (typeId) {
    case "add_1": {
      const a = Math.floor(Math.random() * 9) + 1;
      const b = Math.floor(Math.random() * 9) + 1;
      q = `${a} + ${b} = ?`;
      correctNum = a + b;
      break;
    }
    case "add_2": {
      const a = Math.floor(Math.random() * 80) + 10;
      const b = Math.floor(Math.random() * 80) + 10;
      q = `${a} + ${b} = ?`;
      correctNum = a + b;
      break;
    }
    case "sub_1": {
      const a = Math.floor(Math.random() * 9) + 1;
      const b = Math.floor(Math.random() * a) + 1;
      q = `${a} - ${b} = ?`;
      correctNum = a - b;
      break;
    }
    case "sub_2": {
      const a = Math.floor(Math.random() * 70) + 25;
      const b = Math.floor(Math.random() * (a - 10)) + 10;
      q = `${a} - ${b} = ?`;
      correctNum = a - b;
      break;
    }
    case "mul_1": {
      const a = Math.floor(Math.random() * 8) + 2;
      const b = Math.floor(Math.random() * 8) + 2;
      q = `${a} × ${b} = ?`;
      correctNum = a * b;
      break;
    }
    case "div_1": {
      const b = Math.floor(Math.random() * 8) + 2;
      correctNum = Math.floor(Math.random() * 9) + 1;
      const a = b * correctNum;
      q = `${a} ÷ ${b} = ?`;
      break;
    }
    case "find_x": {
      const isAdd = Math.random() > 0.5;
      if (isAdd) {
        const x = Math.floor(Math.random() * 9) + 1;
        const b = Math.floor(Math.random() * 9) + 1;
        const sum = x + b;
        q = `X + ${b} = ${sum} (X = ?)`;
        correctNum = x;
      } else {
        const x = Math.floor(Math.random() * 9) + 5;
        const b = Math.floor(Math.random() * (x - 1)) + 1;
        const diff = x - b;
        q = `X - ${b} = ${diff} (X = ?)`;
        correctNum = x;
      }
      break;
    }
    case "compare_1": {
      const a1 = Math.floor(Math.random() * 9) + 1;
      const a2 = Math.floor(Math.random() * 9) + 1;
      const valA = a1 + a2;

      const mode = Math.random();
      let valB = valA;
      if (mode < 0.35) {
        valB = valA + Math.floor(Math.random() * 4) + 1;
      } else if (mode < 0.7) {
        valB = Math.max(1, valA - (Math.floor(Math.random() * 4) + 1));
      } else {
        valB = valA;
      }

      const b1 = Math.floor(Math.random() * Math.min(valB, 9)) + 1;
      const b2 = Math.max(0, valB - b1);

      q = `${a1} + ${a2}  ...  ${b1} + ${b2}`;

      let correctSym = "=";
      if (valA > valB) correctSym = ">";
      else if (valA < valB) correctSym = "<";

      const allSyms = [">", "<", "="];
      const wrongSyms = allSyms.filter((s) => s !== correctSym);
      const wrongArr: [string, string, string] = [wrongSyms[0], wrongSyms[1], "≠"];

      return {
        id,
        typeId,
        q,
        a: correctSym,
        wrong: wrongArr,
      };
    }
    default: {
      const a = Math.floor(Math.random() * 9) + 1;
      const b = Math.floor(Math.random() * 9) + 1;
      q = `${a} + ${b} = ?`;
      correctNum = a + b;
    }
  }

  // Generate 3 unique wrong answers close to correct answer
  const wrongSet = new Set<number>();
  const offsets = [-3, -2, -1, 1, 2, 3, 4, -4, 5, -5];
  offsets.sort(() => Math.random() - 0.5);

  for (const offset of offsets) {
    const val = correctNum + offset;
    if (val >= 0 && val !== correctNum) {
      wrongSet.add(val);
    }
    if (wrongSet.size >= 3) break;
  }

  while (wrongSet.size < 3) {
    const val = correctNum + Math.floor(Math.random() * 10) + 1;
    if (val !== correctNum) wrongSet.add(val);
  }

  const wrongArr = Array.from(wrongSet).slice(0, 3).map(String) as [string, string, string];

  return {
    id,
    typeId,
    q,
    a: String(correctNum),
    wrong: wrongArr
  };
}

export default function CreateChoiceShooterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  // Wizard Step: 1 | 2
  const [step, setStep] = useState<1 | 2>(1);

  // Form States (Step 1)
  const [gameTitle, setGameTitle] = useState("Bài tập Bắn súng Toán học");
  const [grade, setGrade] = useState("Lớp 2");
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["add_1", "sub_1"]);
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [gameSpeed, setGameSpeed] = useState<"slow" | "medium" | "fast">("medium");
  const [endMode, setEndMode] = useState<"finish" | "loop">("finish");

  // Generated Questions (Step 2)
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);

  // Play Test & Success Modal States
  const [isTestPlaying, setIsTestPlaying] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Copy Link State (Step 3 / Modal)
  const [copied, setCopied] = useState(false);
  const [createdCode, setCreatedCode] = useState(() => `SHOOT-${Math.floor(1000 + Math.random() * 9000)}`);

  // Load existing game if editing
  useEffect(() => {
    if (editId) {
      const existing = getChoiceShooterGameById(editId);
      if (existing) {
        setGameTitle(existing.title);
        setQuestionCount(existing.questionCount);
        setEndMode(existing.endMode);
        setSelectedTypes(existing.selectedTypes);
        setQuestions(existing.questions as any);
        setCreatedCode(existing.code);
        setStep(2);
      }
    }
  }, [editId]);

  // Auto update title when types change if default
  const toggleMathType = (typeId: string) => {
    let next: string[];
    if (selectedTypes.includes(typeId)) {
      next = selectedTypes.filter(t => t !== typeId);
    } else {
      next = [...selectedTypes, typeId];
    }
    setSelectedTypes(next);
  };

  const handleGenerateQuestions = () => {
    if (selectedTypes.length === 0) return;

    const list: GeneratedQuestion[] = [];
    for (let i = 0; i < questionCount; i++) {
      const randomTypeId = selectedTypes[i % selectedTypes.length];
      list.push(generateSingleQuestion(randomTypeId));
    }
    setQuestions(list);
    setStep(2);
  };

  const handleRerollSingleQuestion = (index: number) => {
    const target = questions[index];
    const newQ = generateSingleQuestion(target.typeId);
    const next = [...questions];
    next[index] = newQ;
    setQuestions(next);
  };

  const handleUpdateQuestionText = (index: number, field: "q" | "a" | "w0" | "w1" | "w2", val: string) => {
    const next = [...questions];
    if (field === "q") next[index].q = val;
    else if (field === "a") next[index].a = val;
    else if (field === "w0") next[index].wrong[0] = val;
    else if (field === "w1") next[index].wrong[1] = val;
    else if (field === "w2") next[index].wrong[2] = val;
    setQuestions(next);
  };

  const handleSaveAndComplete = () => {
    if (questions.length === 0) return;

    saveChoiceShooterGame({
      id: createdCode,
      code: createdCode,
      title: gameTitle,
      questionCount,
      endMode,
      selectedTypes,
      questions,
    });

    setIsSuccessModalOpen(true);
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/game/shooter/${createdCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <HomeShell>
      <div className="w-full pb-20 px-4 md:px-10 max-w-[1200px] mx-auto select-none">
        
        {/* Header Back & Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Link
              href="/teacher?tab=choice"
              className="w-10 h-10 rounded-2xl bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-xs"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-headline font-black text-2xl md:text-3xl text-slate-800 dark:text-white tracking-tight">
                Tạo Game Bắn Súng Toán Học
              </h1>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Hệ thống tự động sinh câu hỏi theo các dạng toán được chọn
              </p>
            </div>
          </div>

          {/* Stepper Navigation Bar (2 Steps) */}
          <div className="flex items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm self-start md:self-auto">
            {/* Step 1 Button */}
            <button
              type="button"
              onClick={() => setStep(1)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer hover:opacity-90 ${
                step === 1 
                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" 
                  : "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40"
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[11px]">1</span>
              <span>Cấu hình</span>
            </button>

            <div className="w-4 h-0.5 bg-slate-200 dark:bg-slate-700 mx-1" />

            {/* Step 2 Button */}
            <button
              type="button"
              disabled={selectedTypes.length === 0}
              onClick={() => {
                if (selectedTypes.length === 0) return;
                if (questions.length === 0) {
                  handleGenerateQuestions();
                } else {
                  setStep(2);
                }
              }}
              title={selectedTypes.length === 0 ? "Vui lòng chọn ít nhất 1 dạng toán" : "Sang bước xem trước & lưu bài tập"}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                selectedTypes.length === 0 ? "opacity-40 cursor-not-allowed text-slate-400" : "cursor-pointer hover:bg-emerald-100/80"
              } ${
                step === 2 
                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" 
                  : "text-slate-600 bg-slate-100 dark:bg-slate-800"
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[11px]">2</span>
              <span>Xem trước & Lưu</span>
            </button>
          </div>
        </div>

        {/* STEP 1: CONFIGURATION FORM (SPLIT 2-COLUMN DASHBOARD) */}
        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-300">
            {/* LEFT COLUMN: Main Form Controls (8/12) */}
            <div className="lg:col-span-8 space-y-6">
              {/* General Info Card */}
              <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6">
                <div className="w-full space-y-2">
                  <label className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
                    Tên Bài Tập
                  </label>
                  <input
                    type="text"
                    value={gameTitle}
                    onChange={(e) => setGameTitle(e.target.value)}
                    placeholder="Nhập tên bài tập..."
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
                  />
                </div>

                {/* Math Types Selection Grid (Game 3D Neon Card Style) */}
                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <h3 className="font-headline font-black text-lg text-slate-800 dark:text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-emerald-500" />
                      <span>Chọn các Dạng Toán tự động sinh câu hỏi</span>
                    </h3>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-800">
                      Đã chọn: {selectedTypes.length}/{MATH_TYPE_OPTIONS.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {MATH_TYPE_OPTIONS.map((opt) => {
                      const isSelected = selectedTypes.includes(opt.id);
                      return (
                        <div
                          key={opt.id}
                          onClick={() => toggleMathType(opt.id)}
                          className={`p-5 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-4 relative overflow-hidden group ${
                            isSelected
                              ? "bg-gradient-to-br from-emerald-50/90 to-teal-50/50 dark:from-emerald-950/40 dark:to-teal-950/20 border-emerald-500 shadow-xl shadow-emerald-500/10 scale-[1.02]"
                              : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:scale-[1.01]"
                          }`}
                        >
                          {/* Glowing Ambient Background Accent */}
                          <div
                            className={`absolute -right-8 -top-8 w-24 h-24 rounded-full blur-2xl transition-opacity ${
                              isSelected ? "opacity-30 bg-emerald-400" : "opacity-0"
                            }`}
                          />

                          <div className="flex items-center justify-between relative z-10">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-xs ${opt.badgeBg}`}>
                              {opt.badge}
                            </span>
                            <div
                              className={`w-7 h-7 rounded-2xl border-2 flex items-center justify-center transition-all ${
                                isSelected
                                  ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/30 scale-110"
                                  : "border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-slate-800"
                              }`}
                            >
                              {isSelected && <CheckCircle2 className="w-4.5 h-4.5 stroke-[3]" />}
                            </div>
                          </div>

                          <div className="relative z-10 space-y-2">
                            <h4 className="font-headline font-black text-base text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 transition-colors">
                              {opt.title}
                            </h4>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs font-mono text-xs font-bold text-slate-600 dark:text-slate-300">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              <span>Ví dụ: {opt.example}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Unified Compact Toolbox Card: Count & End Mode */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="bg-slate-50/90 dark:bg-slate-800/60 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-700/80 space-y-4">
                    {/* Row 1: Question Count */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                          🎯
                        </span>
                        <label className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                          Số Lượng Câu Hỏi
                        </label>
                      </div>

                      <div className="flex items-center gap-2.5">
                        {/* Quick Select Pill Buttons (Placed FIRST) */}
                        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
                          {[5, 10, 15, 20, 30, 50].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setQuestionCount(num)}
                              className={`px-2.5 py-1.5 rounded-xl font-black text-[11px] transition-all border ${
                                questionCount === num
                                  ? "bg-emerald-500 text-white border-emerald-500 shadow-xs"
                                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                              }`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>

                        {/* Compact Input (Placed SECOND, without "câu") */}
                        <div className="relative w-16">
                          <input
                            type="number"
                            min={1}
                            max={50}
                            value={questionCount || ""}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (isNaN(val)) {
                                setQuestionCount(1);
                              } else {
                                const clamped = Math.min(50, Math.max(1, val));
                                setQuestionCount(clamped);
                              }
                            }}
                            className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-800 dark:text-white text-xs text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="w-full h-px bg-slate-200/60 dark:bg-slate-700/60" />

                    {/* Row 2: Game End Mode Tabs */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs">
                          ⚙️
                        </span>
                        <label className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                          Luật Kết Thúc
                        </label>
                      </div>

                      {/* Segmented Control Buttons */}
                      <div className="flex items-center bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                        <button
                          type="button"
                          onClick={() => setEndMode("finish")}
                          className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                            endMode === "finish"
                              ? "bg-emerald-500 text-white shadow-xs"
                              : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                          }`}
                        >
                          <span>🏁</span>
                          <span>Hết câu hỏi</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setEndMode("loop")}
                          className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                            endMode === "loop"
                              ? "bg-purple-600 text-white shadow-xs"
                              : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                          }`}
                        >
                          <span>🔄</span>
                          <span>Vòng lặp vô tận</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Sticky Summary Panel (4/12) */}
            <div className="lg:col-span-4">
              <div className="sticky top-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-2xl space-y-6">
                {/* Header Badge */}
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 text-xl font-bold">
                    🎯
                  </div>
                  <div>
                    <h3 className="font-headline font-black text-base text-slate-800 dark:text-white">
                      Tóm Tắt Bài Tập
                    </h3>
                    <p className="text-xs font-semibold text-slate-400">
                      Xem trước cấu hình trước khi sinh câu hỏi
                    </p>
                  </div>
                </div>

                {/* Parameters Overview Items */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Tổng Số Câu Hỏi</span>
                    <span className="font-mono font-black text-base text-emerald-600 dark:text-emerald-400">
                      {questionCount} câu
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Luật Kết Thúc</span>
                    <span className="font-bold text-xs text-slate-800 dark:text-white flex items-center gap-1">
                      {endMode === "finish" ? "🏁 Hết câu hỏi" : "🔄 Vòng lặp vô tận"}
                    </span>
                  </div>

                  {/* Selected Math Types List Chips */}
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-wider block">
                      Dạng Toán Đã Chọn ({selectedTypes.length})
                    </span>

                    {selectedTypes.length === 0 ? (
                      <p className="text-xs text-slate-400 italic p-3 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 rounded-2xl text-amber-700 dark:text-amber-400 font-medium">
                        ⚠️ Chưa chọn dạng toán nào. Vui lòng tích chọn ở bên trái!
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                        {selectedTypes.map((tid) => {
                          const itemOpt = MATH_TYPE_OPTIONS.find((m) => m.id === tid);
                          if (!itemOpt) return null;
                          return (
                            <span
                              key={tid}
                              className={`px-3 py-1 rounded-xl text-xs font-bold border shadow-2xs flex items-center gap-1.5 ${itemOpt.badgeBg}`}
                            >
                              <span>{itemOpt.title}</span>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Primary Action Button inside Sticky Box */}
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={selectedTypes.length === 0}
                    onClick={handleGenerateQuestions}
                    className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:scale-95 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    <Sparkles className="w-4.5 h-4.5 group-hover:rotate-12 transition-transform" />
                    <span>Tạo câu hỏi tự động ➔</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: PREVIEW & EDITING */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Control Header Bar */}
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="font-headline font-black text-xl text-slate-800 dark:text-white flex items-center gap-2">
                  <span>Bảng Xem Trước {questions.length} Câu Hỏi</span>
                  <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full">
                    Đã sinh tự động
                  </span>
                </h2>
                <p className="text-xs font-semibold text-slate-400 mt-1">
                  Bạn có thể bấm icon 🔄 để đổi câu khác hoặc chỉnh sửa trực tiếp chữ/số trước khi hoàn tất
                </p>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <button
                  type="button"
                  onClick={handleSaveAndComplete}
                  className="flex-1 md:flex-initial py-3.5 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:scale-95 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Lưu & Hoàn tất bài tập ➔</span>
                </button>
              </div>
            </div>

            {/* Questions 4-Column Grid List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {questions.map((item, idx) => (
                <div
                  key={item.id}
                  className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-md rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-md flex flex-col justify-between gap-4 group hover:border-emerald-500/40 transition-all relative overflow-hidden"
                >
                  {/* Card Header: Index + Question Text Input + Reroll Button */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={item.q}
                        onChange={(e) => handleUpdateQuestionText(idx, "q", e.target.value)}
                        className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRerollSingleQuestion(idx)}
                      title="Đổi câu hỏi khác"
                      className="p-2 rounded-xl bg-slate-100 hover:bg-emerald-100 dark:bg-slate-800 dark:hover:bg-emerald-950 text-slate-600 hover:text-emerald-600 transition-all shrink-0"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Correct & Wrong Answers Inputs Grid (2x2) */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                        ✓ Đúng
                      </span>
                      <input
                        type="text"
                        value={item.a}
                        onChange={(e) => handleUpdateQuestionText(idx, "a", e.target.value)}
                        className="px-2 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-xl font-mono font-black text-emerald-700 dark:text-emerald-300 text-xs text-center focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        ✕ Sai 1
                      </span>
                      <input
                        type="text"
                        value={item.wrong[0]}
                        onChange={(e) => handleUpdateQuestionText(idx, "w0", e.target.value)}
                        className="px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-medium text-slate-600 dark:text-slate-300 text-xs text-center focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        ✕ Sai 2
                      </span>
                      <input
                        type="text"
                        value={item.wrong[1]}
                        onChange={(e) => handleUpdateQuestionText(idx, "w1", e.target.value)}
                        className="px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-medium text-slate-600 dark:text-slate-300 text-xs text-center focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        ✕ Sai 3
                      </span>
                      <input
                        type="text"
                        value={item.wrong[2]}
                        onChange={(e) => handleUpdateQuestionText(idx, "w2", e.target.value)}
                        className="px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-medium text-slate-600 dark:text-slate-300 text-xs text-center focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUCCESS CREATED ASSIGNMENT MODAL POPUP */}
        {isSuccessModalOpen && (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 text-center animate-in zoom-in-95 duration-200 relative">
              <button
                type="button"
                onClick={() => setIsSuccessModalOpen(false)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
              </div>

              <div>
                <h2 className="font-headline font-black text-2xl text-slate-800 dark:text-white">
                  Tạo Bài Tập Thành Công!
                </h2>
              </div>

              {/* Copy Link Input Row Only */}
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${typeof window !== "undefined" ? window.location.origin : ""}/game/shooter/${createdCode}`}
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shrink-0 shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? "Đã chép" : "Sao chép"}</span>
                </button>
              </div>

              {/* Modal Actions (2 Auto-width Buttons Side by Side) */}
              <div className="pt-2 flex flex-wrap sm:flex-nowrap items-center justify-center gap-3">
                <Link
                  href="/teacher?tab=my-choice-games"
                  className="py-3.5 px-5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center shadow-lg shadow-emerald-500/20 active:scale-95 whitespace-nowrap"
                >
                  <span>Về Danh Sách Bài Tập Đã Tạo</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setIsSuccessModalOpen(false);
                    setIsTestPlaying(true);
                  }}
                  className="py-3.5 px-6 bg-sky-500 hover:bg-sky-600 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center shadow-lg shadow-sky-500/20 active:scale-95 cursor-pointer whitespace-nowrap"
                >
                  <span>Chơi Thử</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PLAY TEST NEON SHOOTER MODAL */}
        {isTestPlaying && (
          <ShooterTestGameModal
            questions={questions}
            endMode={endMode}
            onClose={() => setIsTestPlaying(false)}
          />
        )}
      </div>
    </HomeShell>
  );
}

// ==========================================
// SHOOTER TEST GAME MODAL COMPONENT
// ==========================================
function ShooterTestGameModal({
  questions,
  endMode = "finish",
  onClose
}: {
  questions: GeneratedQuestion[];
  endMode?: "finish" | "loop";
  onClose: () => void;
}) {
  const tempGame: ChoiceShooterGame = {
    id: "PREVIEW",
    code: "PREVIEW",
    title: "Chơi thử Bài tập Bắn súng Toán học",
    questionCount: questions.length,
    endMode,
    selectedTypes: [],
    questions: questions as any,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return <SciFiNeonShooterGame game={tempGame} onClose={onClose} isModal />;
}
