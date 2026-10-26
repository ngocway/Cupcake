"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Check } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface GoalSelectionData {
  goalId: string;
  userType: "kindergarten" | "kid" | "learner";
  ageGroup: "kindergarten" | "kid" | "learner";
  language: "vi" | "en";
}

interface OnboardingGoalModalProps {
  isOpen: boolean;
  isFirstTimeSetup: boolean;
  currentGoalId?: string;
  currentLanguage?: string;
  currentLocale: string;
  onClose: () => void;
  onConfirm: (data: GoalSelectionData) => Promise<void> | void;
}

interface GoalCardItem {
  id: string;
  userType: "kindergarten" | "kid" | "learner";
  ageGroup: "kindergarten" | "kid" | "learner";
  altVi: string;
  altEn: string;
  desktopImgVi: string;
  desktopImgEn: string;
  mobileImgVi: string;
  mobileImgEn: string;
}

const BASE_PATH = "/images/assest/Choose%20ages";

const GOAL_ITEMS: GoalCardItem[] = [
  {
    id: "kindergarten_vocab",
    userType: "kindergarten",
    ageGroup: "kindergarten",
    altVi: "Bé mẫu giáo học từ vựng và phát âm",
    altEn: "Preschool English: Vocabulary & Pronunciation",
    desktopImgVi: `${BASE_PATH}/desktop_vi/01_preschool_ages_2-5.png`,
    desktopImgEn: `${BASE_PATH}/desktop_en/01_preschool.png`,
    mobileImgVi: `${BASE_PATH}/mobile_vi/01_mau_giao_2_5.png`,
    mobileImgEn: `${BASE_PATH}/mobile_en/01_preschool.png`,
  },
  {
    id: "kids_primary",
    userType: "kid",
    ageGroup: "kid",
    altVi: "Bé từ 5 đến 10 tuổi",
    altEn: "Kids: Primary School (Ages 5-10)",
    desktopImgVi: `${BASE_PATH}/desktop_vi/02_kids_ages_5-10.png`,
    desktopImgEn: `${BASE_PATH}/desktop_en/02_primary_school.png`,
    mobileImgVi: `${BASE_PATH}/mobile_vi/02_tieu_hoc_5_10.png`,
    mobileImgEn: `${BASE_PATH}/mobile_en/02_primary_school.png`,
  },
  {
    id: "english_basic",
    userType: "learner",
    ageGroup: "learner",
    altVi: "Dành cho người học từ căn bản",
    altEn: "Beginner English: Foundations",
    desktopImgVi: `${BASE_PATH}/desktop_vi/03_beginner.png`,
    desktopImgEn: `${BASE_PATH}/desktop_en/03_beginner.png`,
    mobileImgVi: `${BASE_PATH}/mobile_vi/03_tieng_anh_can_ban.png`,
    mobileImgEn: `${BASE_PATH}/mobile_en/03_beginner.png`,
  },
  {
    id: "communication",
    userType: "learner",
    ageGroup: "learner",
    altVi: "Dành cho người học giao tiếp",
    altEn: "Conversational English: Fluency",
    desktopImgVi: `${BASE_PATH}/desktop_vi/04_conversation.png`,
    desktopImgEn: `${BASE_PATH}/desktop_en/04_conversation.png`,
    mobileImgVi: `${BASE_PATH}/mobile_vi/04_tieng_anh_giao_tiep.png`,
    mobileImgEn: `${BASE_PATH}/mobile_en/04_conversation.png`,
  },
  {
    id: "exam_prep",
    userType: "learner",
    ageGroup: "learner",
    altVi: "Dành cho luyện thi chứng chỉ (Cambridge, IELTS)",
    altEn: "Exam Preparation: Cambridge, IELTS",
    desktopImgVi: `${BASE_PATH}/desktop_vi/05_ielts_cambridge.png`,
    desktopImgEn: `${BASE_PATH}/desktop_en/05_exam_prep.png`,
    mobileImgVi: `${BASE_PATH}/mobile_vi/05_ielts_cambridge.png`,
    mobileImgEn: `${BASE_PATH}/mobile_en/05_exam_prep.png`,
  },
];

export function OnboardingGoalModal({
  isOpen,
  isFirstTimeSetup,
  currentGoalId,
  currentLanguage,
  currentLocale,
  onClose,
  onConfirm,
}: OnboardingGoalModalProps) {
  const [selectedGoalId, setSelectedGoalId] = useState<string>(currentGoalId || "kindergarten_vocab");
  const [selectedLanguage, setSelectedLanguage] = useState<"vi" | "en">("vi");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-detect browser language if not set
  useEffect(() => {
    if (currentLanguage === "vi" || currentLanguage === "en") {
      setSelectedLanguage(currentLanguage as "vi" | "en");
    } else {
      if (typeof window !== "undefined") {
        const localLang = localStorage.getItem("cupcakes_native_language");
        if (localLang === "vi" || localLang === "en") {
          setSelectedLanguage(localLang as "vi" | "en");
          return;
        }
        const browserLang = (navigator.language || "").toLowerCase();
        if (browserLang.includes("vi")) {
          setSelectedLanguage("vi");
        } else {
          setSelectedLanguage("en");
        }
      }
    }
  }, [currentLanguage]);

  // Sync selected goal from props when modal opens
  useEffect(() => {
    if (isOpen && currentGoalId) {
      setSelectedGoalId(currentGoalId);
    }
  }, [isOpen, currentGoalId]);

  if (!isOpen || !mounted) return null;

  const isEn = selectedLanguage === "en";

  const handleConfirm = async () => {
    const goal = GOAL_ITEMS.find((g) => g.id === selectedGoalId) || GOAL_ITEMS[0];
    setIsSubmitting(true);
    try {
      await onConfirm({
        goalId: goal.id,
        userType: goal.userType,
        ageGroup: goal.ageGroup,
        language: selectedLanguage,
      });
    } catch (e) {
      console.error("Failed to apply onboarding goal", e);
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-300"
    >
      <div 
        className="bg-white dark:bg-slate-900 border-4 border-stone-100 dark:border-slate-800 rounded-[2rem] sm:rounded-[2.8rem] p-4 sm:p-6 md:p-7 max-w-5xl w-full max-h-[95vh] overflow-y-auto no-scrollbar shadow-2xl relative flex flex-col gap-3 sm:gap-5 animate-in zoom-in-95 duration-300 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar: Logo pill + Title + Language select */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 relative pb-1">
          {/* Top Left: Logo Badge */}
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#EBF7F2] dark:bg-emerald-950/40 text-[#0B7A58] dark:text-emerald-300 text-xs sm:text-sm font-extrabold shadow-xs">
              <span className="text-base">🧁</span>
              <span>Dolcake English</span>
            </div>
          </div>

          {/* Center: Title & Subtitle */}
          <div className="text-center order-last sm:order-none flex-1 px-2">
            <div className="flex items-center justify-center gap-2">
              <span className="text-amber-400 text-lg sm:text-xl font-black">✦</span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-[#1F2937] dark:text-white font-headline tracking-tight">
                {isEn ? "Choose Your Learning Goal" : "Chọn mục tiêu của bạn"}
              </h2>
              <span className="text-amber-400 text-lg sm:text-xl font-black">✦</span>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-slate-400 font-medium mt-0.5">
              {isEn 
                ? "So we can prepare the most suitable lessons for you!" 
                : "Để chúng mình chuẩn bị bài học phù hợp nhất cho bạn nhé!"}
            </p>
          </div>

          {/* Top Right: Language Dropdown */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Select
              value={selectedLanguage}
              onValueChange={(val: "vi" | "en") => setSelectedLanguage(val)}
            >
              <SelectTrigger 
                className="bg-white dark:bg-slate-800 border-2 border-stone-200 dark:border-slate-700 font-extrabold text-xs h-9 px-3 rounded-full shadow-xs hover:border-emerald-500 transition-all flex items-center gap-1.5 cursor-pointer text-[#2D241E] dark:text-white"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[10000] bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-700 rounded-2xl shadow-xl font-bold text-xs p-1">
                <SelectItem value="vi" className="cursor-pointer py-2 px-3 rounded-xl">
                  <span className="mr-1.5">🇻🇳</span> Tiếng Việt
                </SelectItem>
                <SelectItem value="en" className="cursor-pointer py-2 px-3 rounded-xl">
                  <span className="mr-1.5">🇬🇧</span> English
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ─── DESKTOP VIEW (5 Columns Row) ────────────────────────── */}
        <div className="hidden md:grid md:grid-cols-5 gap-2.5 lg:gap-3.5 my-1">
          {GOAL_ITEMS.map((item) => {
            const isSelected = selectedGoalId === item.id;
            const imgSrc = isEn ? item.desktopImgEn : item.desktopImgVi;
            const altText = isEn ? item.altEn : item.altVi;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedGoalId(item.id)}
                className={`group relative text-left rounded-[1.75rem] transition-all duration-300 cursor-pointer overflow-hidden p-0 border-0 bg-transparent ${
                  isSelected
                    ? "ring-4 ring-[#00B87C] shadow-2xl shadow-emerald-500/35 scale-[1.03] -translate-y-2 z-10"
                    : "hover:-translate-y-1.5 hover:shadow-xl hover:scale-[1.01] opacity-90 hover:opacity-100"
                }`}
              >
                <div 
                  style={{ aspectRatio: "740 / 1440" }}
                  className="relative w-full rounded-[1.75rem] overflow-hidden bg-transparent"
                >
                  <Image
                    src={imgSrc}
                    alt={altText}
                    fill
                    sizes="(max-width: 1200px) 20vw, 220px"
                    className="object-cover rounded-[1.75rem] transition-transform duration-300 group-hover:scale-105"
                    priority
                  />

                  {/* Active Selected Check Badge */}
                  {isSelected && (
                    <div className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-[#00B87C] text-white flex items-center justify-center shadow-md animate-in zoom-in-75 duration-200 z-20">
                      <Check className="w-4 h-4 stroke-[3.5]" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* ─── MOBILE VIEW (2x2 Grid + Bottom Banner) ──────────────── */}
        <div className="block md:hidden space-y-2.5 my-1">
          {/* Top 4 Cards in 2x2 grid */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {GOAL_ITEMS.slice(0, 4).map((item) => {
              const isSelected = selectedGoalId === item.id;
              const imgSrc = isEn ? item.mobileImgEn : item.mobileImgVi;
              const altText = isEn ? item.altEn : item.altVi;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedGoalId(item.id)}
                  className={`group relative text-left rounded-2xl transition-all duration-200 cursor-pointer overflow-hidden p-0 border-0 bg-transparent ${
                    isSelected
                      ? "ring-3 ring-[#00B87C] shadow-lg scale-[1.02]"
                      : "opacity-90 hover:opacity-100"
                  }`}
                >
                  <div 
                    style={{ aspectRatio: "335 / 423" }}
                    className="relative w-full rounded-2xl overflow-hidden bg-transparent"
                  >
                    <Image
                      src={imgSrc}
                      alt={altText}
                      fill
                      sizes="50vw"
                      className="object-cover rounded-2xl"
                    />

                    {/* Radio indicator overlay matching mockup's top-right circle */}
                    <div className="absolute top-2.5 right-2.5 w-6 h-6 flex items-center justify-center z-20 pointer-events-none">
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-[#00B87C] text-white flex items-center justify-center shadow-xs animate-in zoom-in-75 duration-150">
                          <Check className="w-3 h-3 stroke-[3.5]" />
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bottom 5th Card (IELTS / Cambridge full-width banner) */}
          {(() => {
            const item = GOAL_ITEMS[4];
            const isSelected = selectedGoalId === item.id;
            const imgSrc = isEn ? item.mobileImgEn : item.mobileImgVi;
            const altText = isEn ? item.altEn : item.altVi;

            return (
              <button
                type="button"
                onClick={() => setSelectedGoalId(item.id)}
                className={`group relative w-full text-left rounded-2xl transition-all duration-200 cursor-pointer overflow-hidden p-0 border-0 bg-transparent ${
                  isSelected
                    ? "ring-3 ring-[#00B87C] shadow-lg scale-[1.01]"
                    : "opacity-90 hover:opacity-100"
                }`}
              >
                <div 
                  style={{ aspectRatio: "684 / 228" }}
                  className="relative w-full rounded-2xl overflow-hidden bg-transparent"
                >
                  <Image
                    src={imgSrc}
                    alt={altText}
                    fill
                    sizes="100vw"
                    className="object-cover rounded-2xl"
                  />

                  {/* Radio indicator overlay matching mockup's top-right circle */}
                  <div className="absolute top-2.5 right-2.5 w-6 h-6 flex items-center justify-center z-20 pointer-events-none">
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-[#00B87C] text-white flex items-center justify-center shadow-xs animate-in zoom-in-75 duration-150">
                        <Check className="w-3 h-3 stroke-[3.5]" />
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })()}
        </div>

        {/* Footer CTA & Subtle Note */}
        <div className="flex flex-col items-center justify-center gap-2 pt-1 pb-1">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedGoalId || isSubmitting}
            className="w-full sm:w-auto px-10 sm:px-16 py-3.5 sm:py-4 rounded-full text-sm sm:text-base font-black tracking-wider text-white bg-gradient-to-r from-[#00B87C] to-[#009E69] hover:from-[#00C585] hover:to-[#00A870] active:scale-95 shadow-xl shadow-emerald-500/35 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span>{isEn ? "Setting up..." : "Đang thiết lập..."}</span>
            ) : (
              <span>{isEn ? "START LEARNING NOW ➜" : "BẮT ĐẦU HỌC NGAY ➜"}</span>
            )}
          </button>

          <p className="text-[11px] sm:text-xs text-stone-500 dark:text-slate-400 font-medium text-center">
            {isEn ? "You can change your goal at any time" : "Bạn có thể thay đổi mục tiêu bất cứ lúc nào"}
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
