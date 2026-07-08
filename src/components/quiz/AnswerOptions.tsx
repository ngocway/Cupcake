"use client";

import { useQuizRunnerStore } from "@/store/useQuizRunnerStore";
import { cn } from "@/lib/utils";
import { CheckCircle2, User } from "lucide-react";


type Props = {
  question: any;
  idx: number;
  showCorrect?: boolean;
};

export default function AnswerOptions({ question, idx, showCorrect }: Props) {
  const answers = useQuizRunnerStore((s) => s.answers);
  const setAnswers = useQuizRunnerStore((s) => s.setAnswers);

  let content: any = {};
  try {
    const raw = typeof question.content === "string" ? JSON.parse(question.content) : question.content;
    content = raw?.content ? { ...raw, ...raw.content } : raw;
  } catch (e) {
    console.error("Failed to parse question content", e);
  }

  let options = content.options ?? [];
  const isTrueFalse = question.type === "TRUE_FALSE";
  
  if (options.length === 0 && isTrueFalse) {
    const style = content.displayStyle || 'TRUE_FALSE';
    const STYLE_LABELS: any = {
      TRUE_FALSE: { true: 'TRUE', false: 'FALSE' },
      DUNG_SAI: { true: 'ĐÚNG', false: 'SAI' },
      YES_NO: { true: 'YES', false: 'NO' },
    };
    const labels = STYLE_LABELS[style] || STYLE_LABELS.TRUE_FALSE;
    options = [
      { id: 'true', text: labels.true, isCorrect: content.isTrue === true, value: true },
      { id: 'false', text: labels.false, isCorrect: content.isTrue === false, value: false }
    ];
  }

  const questionKey = question.id;
  const currentAnswer = answers[questionKey];
  
  const selectedIds = Array.isArray(currentAnswer) 
    ? currentAnswer 
    : (currentAnswer !== undefined && currentAnswer !== null ? [currentAnswer] : []);

  const toggleOption = (optionId: string) => {
    if (showCorrect) return; // Disable selection when showing answers
    
    const allowMultiple = !!content.allowMultipleAnswers;
    if (isTrueFalse) {
      const val = optionId === 'true';
      setAnswers(questionKey, val);
      return;
    }

    if (allowMultiple) {
      const newSel = selectedIds.includes(optionId)
        ? selectedIds.filter((id: string) => id !== optionId)
        : [...selectedIds, optionId];
      setAnswers(questionKey, newSel);
    } else {
      setAnswers(questionKey, optionId);
    }
  };

  return (
    <div className="flex flex-col gap-6 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-[var(--theme-color)]/20 to-indigo-500/20 rounded-3xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative text-xl md:text-2xl font-bold text-slate-800 leading-relaxed bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            {content.questionText || content.statement || content.instruction || content.textWithBlanks || "Nội dung câu hỏi không khả dụng"}
        </div>
      </div>

      <div className={cn(
        "grid gap-4",
        isTrueFalse ? "grid-cols-2" : "grid-cols-1"
      )}>
        {options.length > 0 && options.map((opt: any, i: number) => {
          const optId = opt.id || String(i);
          const isSelected = isTrueFalse 
            ? (optId === 'true' ? currentAnswer === true : currentAnswer === false)
            : selectedIds.includes(optId);

          const isCorrect = isTrueFalse 
            ? (optId === 'true' ? content.isTrue === true : content.isTrue === false)
            : !!opt.isCorrect;

          return (
            <button
              key={optId}
              type="button"
              onClick={() => toggleOption(optId)}
              className={cn(
                "flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left group relative outline-none",
                showCorrect && isCorrect
                   ? "bg-emerald-50 border-emerald-500 ring-4 ring-emerald-500/10"
                   : showCorrect && isSelected && !isCorrect
                     ? "bg-rose-50 border-rose-400 ring-4 ring-rose-400/10"
                     : isSelected
                       ? "bg-indigo-50/50 border-indigo-500 shadow-md ring-4 ring-indigo-500/10"
                       : "bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/80 shadow-sm"
              )}

            >

              {!isTrueFalse && (
                <div
                  className={cn(
                    "w-10 h-10 flex items-center justify-center rounded-xl font-black text-lg transition-all",
                    showCorrect && isCorrect
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200 scale-110"
                      : isSelected
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110"
                        : "bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-500"
                  )}
                >
                  {String.fromCharCode(65 + i)}
                </div>
              )}
              
              <div className={cn(
                "flex-1",
                isTrueFalse && "text-center py-2"
              )}>
                 <span className={cn(
                   "text-lg font-bold transition-colors",
                   showCorrect && isCorrect ? "text-emerald-900" : isSelected ? "text-indigo-900" : "text-slate-700",
                   isTrueFalse && "text-xl uppercase tracking-wider"
                 )}>
                     {opt.text || (isTrueFalse ? (i === 0 ? "TRUE" : "FALSE") : "Phương án " + (i + 1))}
                 </span>
                 {opt.imageUrl && (
                   <img src={opt.imageUrl} className="mt-3 max-h-32 rounded-lg object-contain" alt="Option" />
                 )}
              </div>

              {!isTrueFalse && (isSelected || (showCorrect && isCorrect)) && (
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center shadow-lg scale-110 animate-in zoom-in duration-300",
                  showCorrect && isCorrect ? "bg-emerald-600 shadow-emerald-200" : "bg-indigo-600 shadow-indigo-200"
                )}>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
              )}
              
              {isTrueFalse && (isSelected || (showCorrect && isCorrect)) && (
                 <div className={cn(
                   "absolute top-2 right-2 rounded-full p-1 shadow-lg animate-in zoom-in duration-300",
                   showCorrect && isCorrect ? "bg-emerald-600 shadow-emerald-200" : "bg-indigo-600 shadow-indigo-200"
                 )}>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                 </div>
              )}

              {/* True/False: badge góc trên phải khi review đáp án */}
              {isTrueFalse && showCorrect && (isCorrect || isSelected) && (
                <div className="absolute top-3 right-3 flex flex-col items-end gap-1 z-10">
                  {isCorrect && (
                    <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wide bg-emerald-500 text-white pl-1.5 pr-2 py-0.5 rounded-full shadow-md border border-emerald-400 animate-in zoom-in duration-300">
                      <CheckCircle2 className="w-2.5 h-2.5 shrink-0" /> Correct
                    </span>
                  )}
                  {isSelected && !isCorrect && (
                    <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wide bg-rose-500 text-white pl-1.5 pr-2 py-0.5 rounded-full shadow-md border border-rose-400 animate-in zoom-in duration-300">
                      <User className="w-2.5 h-2.5 shrink-0" /> Yours
                    </span>
                  )}
                  {isSelected && isCorrect && (
                    <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wide bg-emerald-700 text-white pl-1.5 pr-2 py-0.5 rounded-full shadow-md border border-emerald-600 animate-in zoom-in duration-300">
                      <User className="w-2.5 h-2.5 shrink-0" /> Yours ✓
                    </span>
                  )}
                </div>
              )}

            </button>
          );
        })}

        {options.length === 0 && !isTrueFalse && (
           <div className="p-10 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-slate-400">
              <span className="material-symbols-outlined text-4xl mb-2 block">construction</span>
              <p className="font-bold">Loại câu hỏi này đang được cập nhật giao diện...</p>
           </div>
        )}
      </div>
    </div>
  );
}
