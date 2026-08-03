"use client";

import React, { useState, useTransition, useMemo, useEffect } from "react";
import { 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Lightbulb, 
  Check, 
  X,
  Loader2,
  Trophy,
  RotateCcw,
  Volume2,
  VolumeX
} from "lucide-react";
import { playCorrectSound, playIncorrectSound } from "@/utils/soundEffects";
import { submitLessonInlineQuizAction } from "@/actions/lesson-inline-quiz-actions";
import { QuestionAudioPlayButton } from "@/components/common/QuestionAudioPlayButton";

interface QuestionData {
  id: string;
  type: string;
  content: string;
  explanation: string | null;
  orderIndex: number;
  points: number;
}

interface Props {
  assignmentId: string;
  assignmentTitle: string;
  questions: QuestionData[];
  isLoggedIn: boolean;
}

const OPTION_STYLES = [
  {
    badgeBg: "bg-[#A7F3D0] text-[#065F46]",
    badgeSelectedBg: "bg-white text-emerald-800 shadow-md font-black",
    pillBg: "bg-[#ECFDF5] border-[#6EE7B7] text-[#064E3B] hover:border-[#34D399]",
    activeSelected: "bg-emerald-500 border-emerald-600 text-white ring-4 ring-emerald-200 shadow-lg font-black scale-[1.02]",
    activeCorrect: "bg-emerald-500 border-emerald-600 text-white ring-4 ring-emerald-200 shadow-lg font-black",
    activeIncorrect: "bg-rose-500 border-rose-600 text-white ring-4 ring-rose-200 shadow-lg font-black",
    borderRadius: "36px 18px 36px 18px",
    letter: "A",
  },
  {
    badgeBg: "bg-[#FDE68A] text-[#92400E]",
    badgeSelectedBg: "bg-white text-amber-800 shadow-md font-black",
    pillBg: "bg-[#FFFBEB] border-[#FCD34D] text-[#78350F] hover:border-[#FBBF24]",
    activeSelected: "bg-amber-500 border-amber-600 text-white ring-4 ring-amber-200 shadow-lg font-black scale-[1.02]",
    activeCorrect: "bg-emerald-500 border-emerald-600 text-white ring-4 ring-emerald-200 shadow-lg font-black",
    activeIncorrect: "bg-rose-500 border-rose-600 text-white ring-4 ring-rose-200 shadow-lg font-black",
    borderRadius: "18px 36px 18px 36px",
    letter: "B",
  },
  {
    badgeBg: "bg-[#BAE6FD] text-[#075985]",
    badgeSelectedBg: "bg-white text-sky-800 shadow-md font-black",
    pillBg: "bg-[#F0F9FF] border-[#7DD3FC] text-[#0C4A6E] hover:border-[#38BDF8]",
    activeSelected: "bg-sky-500 border-sky-600 text-white ring-4 ring-sky-200 shadow-lg font-black scale-[1.02]",
    activeCorrect: "bg-emerald-500 border-emerald-600 text-white ring-4 ring-emerald-200 shadow-lg font-black",
    activeIncorrect: "bg-rose-500 border-rose-600 text-white ring-4 ring-rose-200 shadow-lg font-black",
    borderRadius: "36px 20px 36px 20px",
    letter: "C",
  },
  {
    badgeBg: "bg-[#DDD6FE] text-[#5B21B6]",
    badgeSelectedBg: "bg-white text-purple-800 shadow-md font-black",
    pillBg: "bg-[#F5F3FF] border-[#C4B5FD] text-[#4C1D95] hover:border-[#A78BFA]",
    activeSelected: "bg-purple-500 border-purple-600 text-white ring-4 ring-purple-200 shadow-lg font-black scale-[1.02]",
    activeCorrect: "bg-emerald-500 border-emerald-600 text-white ring-4 ring-emerald-200 shadow-lg font-black",
    activeIncorrect: "bg-rose-500 border-rose-600 text-white ring-4 ring-rose-200 shadow-lg font-black",
    borderRadius: "20px 36px 20px 36px",
    letter: "D",
  },
];

function InlineFillBlankQuestion({
  questionId,
  questionText,
  userAnswer,
  isChecked,
  onChangeInputs,
}: {
  questionId: string;
  questionText: string;
  userAnswer: any;
  isChecked: boolean;
  onChangeInputs: (questionId: string, inputsVal: Record<number, string>, isComplete: boolean) => void;
}) {
  const matches = useMemo(() => {
    const regex = /\{\{(.*?)\}\}/g;
    const items: Array<{ expected: string; variants: string[] }> = [];
    let match;
    while ((match = regex.exec(questionText)) !== null) {
      const rawExpected = match[1];
      const variants = rawExpected.split("|").map((v) => v.trim().toLowerCase());
      items.push({ expected: rawExpected, variants });
    }
    return items;
  }, [questionText]);

  const parts = useMemo(() => {
    return questionText.split(/\{\{.*?\}\}/g);
  }, [questionText]);

  const [inputs, setInputs] = useState<Record<number, string>>(() => {
    if (typeof userAnswer === "object" && userAnswer !== null && userAnswer.inputs) {
      return userAnswer.inputs;
    }
    if (typeof userAnswer === "string") return { 0: userAnswer };
    return {};
  });

  const handleInputChange = (idx: number, val: string) => {
    if (isChecked) return;
    const nextInputs = { ...inputs, [idx]: val };
    setInputs(nextInputs);

    const isComplete = matches.every((_, i) => (nextInputs[i] || "").trim().length > 0);
    onChangeInputs(questionId, nextInputs, isComplete);
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="flex flex-wrap items-center justify-start gap-2 text-xl sm:text-2xl font-black text-slate-800 leading-relaxed bg-white p-6 sm:p-8 rounded-[32px] border-2 border-slate-200 shadow-sm">
        {parts.map((part, idx) => {
          const matchItem = matches[idx];
          const val = (inputs[idx] || "").trim();
          const valLower = val.toLowerCase();
          const isCurrentFieldCorrect = matchItem ? matchItem.variants.includes(valLower) : false;
          const expectedWord = matchItem ? matchItem.expected : "";

          let inputClass = "border-b-4 border-emerald-500/60 bg-emerald-50/50 text-emerald-900 font-bold focus:border-emerald-600";
          if (isChecked) {
            inputClass = isCurrentFieldCorrect
              ? "border-4 border-emerald-500 bg-emerald-50 text-emerald-700 font-bold rounded-xl"
              : "border-4 border-rose-500 bg-rose-50 text-rose-700 font-bold opacity-70 line-through rounded-xl";
          }

          const width = Math.max(val.length, isChecked && !isCurrentFieldCorrect ? expectedWord.length : 5) * 1.2 + 2;

          return (
            <React.Fragment key={idx}>
              <span>{part}</span>
              {matchItem && (
                <span className="inline-block relative mx-1.5 align-middle">
                  <input
                    type="text"
                    value={inputs[idx] || ""}
                    onChange={(e) => handleInputChange(idx, e.target.value)}
                    disabled={isChecked}
                    placeholder="..."
                    style={{ width: `${width}ch` }}
                    className={`inline-block text-center outline-none transition-all px-3 py-1 min-w-[90px] disabled:opacity-100 disabled:cursor-not-allowed text-xl sm:text-2xl font-black ${inputClass}`}
                  />
                  {isChecked && !isCurrentFieldCorrect && (
                    <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-100 text-emerald-700 text-xs sm:text-sm font-black rounded-xl border border-emerald-200 shadow-md whitespace-nowrap z-30">
                      {expectedWord}
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-emerald-100 rotate-45 border-r border-b border-emerald-200" />
                    </span>
                  )}
                </span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

export function LessonInlineQuiz({
  assignmentId,
  assignmentTitle,
  questions,
  isLoggedIn,
}: Props) {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [showHints, setShowHints] = useState<Record<string, boolean>>({});
  const [isSubmitting, startTransition] = useTransition();
  const [isChecked, setIsChecked] = useState(false);
  const [revealedCount, setRevealedCount] = useState<number>(0);
  const [scoreResult, setScoreResult] = useState<{ score: number; total: number } | null>(null);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined" || questions.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idxStr = entry.target.getAttribute("data-question-index");
            if (idxStr !== null) {
              setActiveQuestionIndex(parseInt(idxStr, 10));
            }
          }
        });
      },
      { threshold: 0.35 }
    );

    questions.forEach((q) => {
      const el = document.getElementById(`inline-question-${q.id}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [questions]);

  const scrollToQuestion = (index: number) => {
    setActiveQuestionIndex(index);
    const q = questions[index];
    if (!q) return;
    const el = document.getElementById(`inline-question-${q.id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const parsedQuestions = useMemo(() => {
    return questions.map((q) => {
      let data: any = {};
      try {
        data = typeof q.content === "string" ? JSON.parse(q.content) : q.content;
      } catch (e) {
        data = {};
      }
      return {
        ...q,
        parsedData: data,
      };
    });
  }, [questions]);

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (isChecked) return;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleFillBlankChange = (
    questionId: string,
    inputsVal: Record<number, string>,
    isComplete: boolean
  ) => {
    if (isChecked) return;
    setAnswers((prev) => {
      if (isComplete) {
        return { ...prev, [questionId]: { inputs: inputsVal } };
      } else {
        const next = { ...prev };
        delete next[questionId];
        return next;
      }
    });
  };



  const checkIsFillBlankCorrect = (question: any, userAnsObj: any) => {
    const questionText = question.parsedData?.textWithBlanks || question.parsedData?.questionText || question.content;
    const regex = /\{\{(.*?)\}\}/g;
    const matches: Array<{ variants: string[] }> = [];
    let match;
    while ((match = regex.exec(questionText)) !== null) {
      const rawExpected = match[1];
      const variants = rawExpected.split("|").map((v) => v.trim().toLowerCase());
      matches.push({ variants });
    }
    const inputs = userAnsObj?.inputs || {};
    return matches.every((item, idx) => {
      const val = (inputs[idx] || "").trim().toLowerCase();
      return item.variants.includes(val);
    });
  };

  const checkIsTrueFalseCorrect = (question: any, userAns: any) => {
    const qData = question.parsedData || {};
    const expected = qData.isTrue ?? qData.isCorrect ?? true;
    return userAns === expected;
  };

  const handleSubmit = () => {
    if (isSubmitting || isChecked) return;
    if (Object.keys(answers).length < questions.length) return;

    let correctCount = 0;
    parsedQuestions.forEach((q) => {
      const userAns = answers[q.id];
      if (userAns !== undefined) {
        const isFillInTheBlank =
          q.type === "CLOZE_TEST" ||
          q.type === "FILL_BLANK" ||
          (typeof q.content === "string" && q.content.includes("{{"));

        const isTrueFalse =
          q.type === "TRUE_FALSE" ||
          q.parsedData?.type === "TRUE_FALSE" ||
          (q.parsedData?.statement && (!q.parsedData?.options || q.parsedData?.options.length === 0));

        if (isFillInTheBlank) {
          if (checkIsFillBlankCorrect(q, userAns)) {
            correctCount++;
          }
        } else if (isTrueFalse) {
          if (checkIsTrueFalseCorrect(q, userAns)) {
            correctCount++;
          }
        } else if (q.parsedData.options && typeof userAns === "number") {
          if (q.parsedData.options[userAns]?.isCorrect) {
            correctCount++;
          }
        }
      }
    });

    const total = questions.length;
    const pct = Math.round((correctCount / total) * 100);

    if (pct >= 80) {
      playCorrectSound();
    } else {
      playIncorrectSound();
    }

    setScoreResult({ score: correctCount, total });
    setIsChecked(true);
    setRevealedCount(0);

    // Staggered domino reveal animation for question bubbles (100ms per bubble)
    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      setRevealedCount(current);
      if (current >= questions.length) {
        clearInterval(interval);
        // After reveal finishes, auto scroll to first incorrect question if any
        const getStatus = (qItem: any, userAns: any) => {
          const isFillInTheBlank =
            qItem.type === "CLOZE_TEST" ||
            qItem.type === "FILL_BLANK" ||
            (typeof qItem.content === "string" && qItem.content.includes("{{"));

          const isTrueFalse =
            qItem.type === "TRUE_FALSE" ||
            qItem.parsedData?.type === "TRUE_FALSE" ||
            (qItem.parsedData?.statement && (!qItem.parsedData?.options || qItem.parsedData?.options.length === 0));

          if (isFillInTheBlank) {
            return checkIsFillBlankCorrect(qItem, userAns) ? "correct" : "incorrect";
          } else if (isTrueFalse) {
            return checkIsTrueFalseCorrect(qItem, userAns) ? "correct" : "incorrect";
          } else if (qItem.parsedData?.options && typeof userAns === "number") {
            return qItem.parsedData.options[userAns]?.isCorrect ? "correct" : "incorrect";
          }
          return "incorrect";
        };

        const firstIncorrectIdx = parsedQuestions.findIndex(
          (q) => getStatus(q, answers[q.id]) === "incorrect"
        );
        if (firstIncorrectIdx !== -1) {
          setTimeout(() => {
            scrollToQuestion(firstIncorrectIdx);
          }, 350);
        }
      }
    }, 250);

    if (isLoggedIn) {
      startTransition(async () => {
        await submitLessonInlineQuizAction({
          assignmentId,
          answers,
        });
      });
    }
  };

  const handleReset = () => {
    setAnswers({});
    setIsChecked(false);
    setRevealedCount(0);
    setScoreResult(null);
    setShowHints({});
  };

  const answeredCount = Object.keys(answers).length;
  const isAllAnswered = answeredCount === questions.length;

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-[28px] p-6 sm:p-10 shadow-xl shadow-emerald-500/5 border-2 border-emerald-100 space-y-8 animate-in fade-in duration-500">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-emerald-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-200">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-headline text-xl sm:text-2xl font-black text-slate-800 tracking-tight uppercase">
              PRACTICE QUESTIONS
            </h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {assignmentTitle || "Test your understanding"}
            </p>
          </div>
        </div>

        {/* Progress pill */}
        <div className={`flex items-center gap-2 border px-4 py-2 rounded-full transition-all ${
          isAllAnswered 
            ? "bg-emerald-100 border-emerald-300 text-emerald-900 font-extrabold" 
            : "bg-amber-50 border-amber-200 text-amber-800 font-bold"
        }`}>
          <span className="text-xs uppercase tracking-wider">
            {answeredCount} / {questions.length} ANSWERED
          </span>
        </div>
      </div>

      {/* Score Banner after submission */}
      {isChecked && scoreResult && (
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 animate-in fade-in zoom-in-95 duration-500">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
              <Trophy className="w-8 h-8 text-amber-300 fill-amber-300" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-white/80">Quiz Results</p>
              <h4 className="font-headline text-2xl sm:text-3xl font-black">
                {scoreResult.score} / {scoreResult.total} Correct ({Math.round((scoreResult.score / scoreResult.total) * 100)}%)
              </h4>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="px-6 py-3 bg-white text-emerald-800 hover:bg-emerald-50 rounded-full font-black text-xs uppercase tracking-[0.15em] shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* Questions Stack (Vertically scrollable list) */}
      <div className="space-y-12">
        {parsedQuestions.map((q, qIndex) => {
          const qData = q.parsedData;
          const questionText = qData.textWithBlanks || qData.questionText || qData.statement || q.content;
          const options = qData.options || [];
          const hintText = qData.hint || (q as any).hint || "Đọc kỹ câu hỏi và quan sát các phương án để chọn câu trả lời đúng nhất.";
          const userAns = answers[q.id];
          const hasSelectedOption = userAns !== undefined;
          const isHintOpen = showHints[q.id];

          const isFillInTheBlank =
            q.type === "CLOZE_TEST" ||
            q.type === "FILL_BLANK" ||
            (typeof questionText === "string" && questionText.includes("{{"));

          const isTrueFalse =
            q.type === "TRUE_FALSE" ||
            qData.type === "TRUE_FALSE" ||
            (qData.statement && (!options || options.length === 0));

          return (
            <React.Fragment key={q.id}>
              {qIndex > 0 && (
                <div className="w-28 sm:w-36 h-[2px] bg-emerald-200/80 rounded-full mx-auto my-6 sm:my-8" />
              )}
              <div 
                id={`inline-question-${q.id}`}
                data-question-index={qIndex}
                className="space-y-6 scroll-mt-24"
              >
                {/* Question Header & Hint Audio Button */}
                <div className="flex items-start gap-3">
                  <span className="shrink-0 w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 font-black text-sm flex items-center justify-center border border-slate-200 mt-0.5">
                    {qIndex + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-headline text-xl sm:text-2xl font-black text-slate-800 leading-snug inline">
                      {isFillInTheBlank ? "Fill in the blanks" : questionText}
                    </h4>
                    {" "}
                    <QuestionAudioPlayButton
                      src={qData.audioUrl || (q as any).audioUrl}
                      text={typeof questionText === "string" ? questionText.replace(/\{\{.*?\}\}/g, "...") : questionText}
                      className="inline-flex align-middle ml-2 my-0.5"
                    />
                  </div>
                </div>

                {/* Render Fill-in-the-Blank inline input box */}
                {isFillInTheBlank ? (
                  <InlineFillBlankQuestion
                    key={`${q.id}-${isChecked}`}
                    questionId={q.id}
                    questionText={questionText}
                    userAnswer={userAns}
                    isChecked={isChecked}
                    onChangeInputs={handleFillBlankChange}
                  />
                ) : isTrueFalse ? (
                  /* True / False Options Grid with organic shapes */
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                    {[
                      {
                        label: "TRUE",
                        value: true,
                        letter: "A",
                        borderRadius: "36px 18px 36px 18px",
                        badgeBg: "bg-[#A7F3D0] text-[#065F46]",
                        badgeSelectedBg: "bg-white text-emerald-800 shadow-md font-black",
                        pillBg: "bg-[#ECFDF5] border-[#6EE7B7] text-[#064E3B] hover:border-[#34D399]",
                        activeSelected: "bg-emerald-600 border-emerald-700 text-white ring-4 ring-emerald-300 shadow-xl font-black scale-[1.02]",
                      },
                      {
                        label: "FALSE",
                        value: false,
                        letter: "B",
                        borderRadius: "18px 36px 18px 36px",
                        badgeBg: "bg-[#FDE68A] text-[#92400E]",
                        badgeSelectedBg: "bg-white text-amber-800 shadow-md font-black",
                        pillBg: "bg-[#FFFBEB] border-[#FCD34D] text-[#78350F] hover:border-[#FBBF24]",
                        activeSelected: "bg-amber-500 border-amber-600 text-white ring-4 ring-amber-300 shadow-xl font-black scale-[1.02]",
                      }
                    ].map((opt) => {
                      const isSelected = userAns === opt.value;
                      const expected = qData.isTrue ?? qData.isCorrect ?? true;
                      const isCorrectOption = opt.value === expected;

                      let optionStateClass = opt.pillBg;

                      if (!isChecked) {
                        if (isSelected) {
                          optionStateClass = opt.activeSelected;
                        }
                      } else {
                        if (isSelected) {
                          optionStateClass = isCorrectOption
                            ? "bg-emerald-100 border-emerald-600 ring-4 ring-emerald-200 text-emerald-950 shadow-md font-bold"
                            : "bg-rose-50 border-rose-500 ring-4 ring-rose-200 text-rose-950 shadow-md font-bold";
                        } else if (isCorrectOption) {
                          optionStateClass = "bg-emerald-50 border-2 border-emerald-400 text-emerald-950 font-bold shadow-sm";
                        } else {
                          optionStateClass = "opacity-40 bg-slate-50 border-slate-200 text-slate-400";
                        }
                      }

                      return (
                        <button
                          key={opt.label}
                          onClick={() => handleSelectOption(q.id, opt.value as any)}
                          disabled={isChecked}
                          style={{ borderRadius: opt.borderRadius }}
                          className={`group relative flex items-center justify-center p-4 sm:p-5 border-2 transition-all duration-300 shadow-sm text-center min-h-[64px] cursor-pointer ${
                            !isChecked ? "hover:scale-[1.02] active:scale-95" : ""
                          } ${optionStateClass}`}
                        >
                          {/* Option Text */}
                          <span className="font-headline font-black text-base sm:text-lg leading-snug px-2">
                            {opt.label}
                          </span>

                          {/* Pre-check Selected Dot Indicator */}
                          {!isChecked && isSelected && (
                            <span className="absolute top-2.5 right-2.5 w-3 h-3 rounded-full bg-white animate-pulse shadow-sm" />
                          )}

                          {/* Post-check Status Icon Indicator */}
                          {isChecked && isSelected && (
                            <span className="absolute top-2.5 right-2.5">
                              {isCorrectOption ? (
                                <CheckCircle2 className="w-5 h-5 text-white fill-emerald-600" />
                              ) : (
                                <XCircle className="w-5 h-5 text-white fill-rose-600" />
                              )}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  /* Options Grid (Multiple choice) */
                  options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                      {options.map((opt: any, optIndex: number) => {
                        const style = OPTION_STYLES[optIndex % OPTION_STYLES.length];
                        const isSelected = userAns === optIndex;
                        const isCorrectOption = opt.isCorrect;

                        let optionStateClass = style.pillBg;

                        if (!isChecked) {
                          if (isSelected) {
                            optionStateClass = style.activeSelected;
                          }
                        } else {
                          // After checking answers
                          if (isSelected) {
                            optionStateClass = isCorrectOption
                              ? style.activeCorrect
                              : style.activeIncorrect;
                          } else if (isCorrectOption) {
                            // Highlight correct option if student chose wrong
                            optionStateClass = "bg-emerald-50 border-2 border-emerald-400 text-emerald-950 font-bold shadow-sm";
                          } else {
                            optionStateClass = "opacity-40 bg-slate-50 border-slate-200 text-slate-400";
                          }
                        }

                        return (
                          <button
                            key={opt.id || optIndex}
                            onClick={() => handleSelectOption(q.id, optIndex)}
                            disabled={isChecked}
                            style={{ borderRadius: style.borderRadius }}
                            className={`group relative flex items-center justify-center p-4 pt-6 border-2 transition-all duration-300 shadow-sm text-center min-h-[72px] cursor-pointer ${
                              !isChecked ? "hover:scale-[1.02] active:scale-95" : ""
                            } ${optionStateClass}`}
                          >
                            {/* Option Letter Badge (A, B, C, D) */}
                            <span
                              className={`absolute -top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-md transition-transform duration-300 group-hover:scale-110 ${
                                isSelected ? style.badgeSelectedBg : style.badgeBg
                              }`}
                            >
                              {style.letter}
                            </span>

                            {/* Option Text */}
                            <span className="font-headline font-black text-base sm:text-lg leading-snug px-2">
                              {opt.text || opt.label || opt.optionText}
                            </span>

                            {/* Pre-check Selected Dot Indicator */}
                            {!isChecked && isSelected && (
                              <span className="absolute top-2.5 right-2.5 w-3 h-3 rounded-full bg-white animate-pulse shadow-sm" />
                            )}

                            {/* Post-check Status Icon Indicator */}
                            {isChecked && isSelected && (
                              <span className="absolute top-2.5 right-2.5">
                                {isCorrectOption ? (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                                ) : (
                                  <XCircle className="w-5 h-5 text-rose-600 fill-rose-100" />
                                )}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )
                )}

                {/* Explanation Block (Displayed after checking answers for all questions) */}
                {isChecked && (q.explanation || qData.explanation) && (
                  <div className="bg-emerald-50/90 border-2 border-emerald-200 rounded-2xl p-5 text-emerald-950 text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm">
                    <span className="font-black uppercase tracking-wider text-xs text-emerald-700 block mb-1">
                      Explanation
                    </span>
                    <p className="leading-relaxed font-semibold">{q.explanation || qData.explanation}</p>
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Sticky Question Navigation Bubbles Bar */}
      <div className="sticky bottom-4 z-40 my-6 bg-gradient-to-r from-emerald-500/[0.08] via-teal-500/[0.08] to-emerald-600/[0.08] backdrop-blur-xl rounded-full border-2 border-emerald-400/30 shadow-2xl shadow-emerald-600/10 px-4 py-3 max-w-2xl mx-auto flex items-center justify-center gap-2 sm:gap-3 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {parsedQuestions.map((q, i) => {
          const active = i === activeQuestionIndex;
          const ans = answers[q.id];

          let isAnswered = false;
          if (ans !== undefined && ans !== null) {
            if (typeof ans === "object" && ans.inputs) {
              isAnswered = Object.keys(ans.inputs).length > 0;
            } else {
              isAnswered = true;
            }
          }

          const getQuestionStatus = (qItem: any, userAns: any) => {
            if (userAns === undefined || userAns === null) return "incorrect";
            const isFillInTheBlank =
              qItem.type === "CLOZE_TEST" ||
              qItem.type === "FILL_BLANK" ||
              (typeof qItem.content === "string" && qItem.content.includes("{{"));

            const isTrueFalse =
              qItem.type === "TRUE_FALSE" ||
              qItem.parsedData?.type === "TRUE_FALSE" ||
              (qItem.parsedData?.statement && (!qItem.parsedData?.options || qItem.parsedData?.options.length === 0));

            if (isFillInTheBlank) {
              return checkIsFillBlankCorrect(qItem, userAns) ? "correct" : "incorrect";
            } else if (isTrueFalse) {
              return checkIsTrueFalseCorrect(qItem, userAns) ? "correct" : "incorrect";
            } else if (qItem.parsedData?.options && typeof userAns === "number") {
              return qItem.parsedData.options[userAns]?.isCorrect ? "correct" : "incorrect";
            }
            return "incorrect";
          };

          const isGraded = isChecked && i < revealedCount;
          const isCurrentlyRevealing = isChecked && i === revealedCount - 1;
          let status = "pending";
          if (isGraded) {
            status = getQuestionStatus(q, ans);
          }

          let btnClass = "";
          if (isGraded) {
            if (status === "correct") {
              btnClass = active
                ? "bg-emerald-500 text-white border-4 border-emerald-200 shadow-lg shadow-emerald-500/40 scale-110 animate-in zoom-in-75 duration-300"
                : "bg-emerald-500 text-white border-2 border-emerald-600 hover:bg-emerald-600 opacity-90 animate-in zoom-in-75 duration-300";
            } else {
              btnClass = active
                ? "bg-rose-500 text-white border-4 border-rose-200 shadow-lg shadow-rose-500/40 scale-110 animate-in zoom-in-75 duration-300"
                : "bg-rose-500 text-white border-2 border-rose-600 hover:bg-rose-600 opacity-90 animate-in zoom-in-75 duration-300";
            }
          } else if (isCurrentlyRevealing) {
            btnClass = "bg-amber-400 text-white border-4 border-amber-200 scale-125 shadow-xl animate-pulse ring-4 ring-amber-300 z-30";
          } else {
            if (active) {
              btnClass = "bg-orange-500 text-white shadow-lg shadow-orange-500/40 border-4 border-orange-200 scale-110 z-10";
            } else if (isAnswered) {
              btnClass = "bg-purple-500 border-2 border-purple-600 text-white shadow-md shadow-purple-500/20 hover:bg-purple-600 hover:border-purple-700";
            } else {
              btnClass = "bg-white border-2 border-slate-200 text-slate-400 hover:border-purple-300 hover:text-purple-500";
            }
          }

          return (
            <button
              key={q.id}
              onClick={() => scrollToQuestion(i)}
              className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-all duration-300 shrink-0 flex items-center justify-center font-black text-xs sm:text-base cursor-pointer ${btnClass}`}
            >
              <span>{i + 1}</span>
              {isGraded && !active && status === "correct" && (
                <div className="absolute -top-[5%] -right-[5%] w-[38%] h-[38%] bg-emerald-100 rounded-full border border-emerald-500 flex items-center justify-center shadow-sm animate-in zoom-in-50 spin-in-12 duration-300">
                  <Check className="w-[70%] h-[70%] text-emerald-600" strokeWidth={4} />
                </div>
              )}
              {isGraded && !active && status === "incorrect" && (
                <div className="absolute -top-[5%] -right-[5%] w-[38%] h-[38%] bg-rose-100 rounded-full border border-rose-500 flex items-center justify-center shadow-sm animate-in zoom-in-50 spin-in-12 duration-300">
                  <X className="w-[70%] h-[70%] text-rose-600" strokeWidth={4} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Submit & Action Footer */}
      <div className="pt-6 border-t border-emerald-100 flex flex-col items-center justify-center text-center space-y-4">
        {!isChecked ? (
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={handleSubmit}
              disabled={!isAllAnswered || isSubmitting}
              className={`px-10 py-4 rounded-full font-black text-xs uppercase tracking-[0.15em] shadow-lg transition-all flex items-center gap-2.5 cursor-pointer ${
                isAllAnswered
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 hover:scale-105 active:scale-95"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Checking Answers...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Check Answers</span>
                </>
              )}
            </button>

            {!isAllAnswered && (
              <p className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-4 py-1.5 rounded-full animate-in fade-in duration-300">
                Please answer all {questions.length} questions ({answeredCount}/{questions.length}) to check your answers.
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={handleReset}
              className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-black text-xs uppercase tracking-[0.15em] shadow-lg shadow-emerald-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
