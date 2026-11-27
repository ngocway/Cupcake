"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ShineBorder } from "@/components/ui/shine-border";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { SparklesText } from "@/components/ui/sparkles-text";
import { getUnitLectureSlideThumbUrl } from "@/data/global-success-grammar/lecture-slides";
import {
  BookOpen,
  Gamepad2,
  Presentation,
  Sparkles,
  X,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

interface GlobalSuccessLaunchModalProps {
  isOpen: boolean;
  onConfirmExperience: () => void;
  onDismiss: () => void;
}

export function GlobalSuccessLaunchModal({
  isOpen,
  onConfirmExperience,
  onDismiss,
}: GlobalSuccessLaunchModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onDismiss]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onDismiss}
          className="fixed inset-0 z-[220] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border border-amber-200/90 dark:border-amber-800/60 shadow-2xl overflow-hidden"
          >
            <ShineBorder
              borderWidth={2}
              duration={10}
              shineColor={["#F59E0B", "#EA580C", "#7C3AED"]}
            />

            {/* Close Button */}
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Đóng thông báo"
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Warm Hero Top Banner */}
            <div className="relative bg-gradient-to-br from-amber-50 via-orange-50/75 to-purple-50/70 dark:from-amber-950/40 dark:via-slate-900 dark:to-indigo-950/40 px-6 pt-6 pb-5 border-b border-amber-200/70 dark:border-slate-800">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-black tracking-wide uppercase shadow-xs mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ra mắt học liệu mới tại Việt Nam</span>
              </div>

              <SparklesText
                sparklesCount={5}
                colors={{ first: "#F59E0B", second: "#8B5CF6" }}
                className="font-headline font-black text-xl sm:text-2xl leading-snug text-slate-900 dark:text-white pr-8"
              >
                Bộ Bài giảng, Game & Bài tập Global Success
              </SparklesText>

              <p className="mt-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                Dolcake vừa cập nhật trọn bộ học liệu chuẩn SGK{" "}
                <span className="font-extrabold text-amber-700 dark:text-amber-300">
                  Global Success Lớp 1 – 12
                </span>{" "}
                giúp thầy/cô dạy trên lớp và giao bài tập cho học sinh chỉ trong vài giây.
              </p>

              {/* Real Slide Thumbnails Preview */}
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                {[
                  {
                    slide: 1,
                    badge: "Slide 1 · Bìa bài giảng",
                  },
                  {
                    slide: 4,
                    badge: "Slide 4 · Mẫu câu & Ngữ pháp",
                  },
                ].map((preview) => (
                  <div
                    key={preview.slide}
                    className="relative aspect-video rounded-xl overflow-hidden bg-white dark:bg-slate-800 border border-amber-200/90 dark:border-slate-700 shadow-xs"
                  >
                    <img
                      src={getUnitLectureSlideThumbUrl(2, 1, preview.slide)}
                      alt={preview.badge}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-slate-950/75 text-white text-[10px] font-extrabold backdrop-blur-xs">
                      {preview.badge}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3 Highlight Features + Question */}
            <div className="px-6 py-5 space-y-4 relative z-10">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="rounded-2xl bg-amber-50/75 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-headline font-black text-xs">
                    <Presentation className="w-4 h-4 shrink-0" />
                    <span>170 Unit Slide</span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 leading-snug">
                    Trình chiếu Lớp 1–12 kèm kịch bản GV, laser & đồng hồ.
                  </p>
                </div>

                <div className="rounded-2xl bg-emerald-50/75 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-headline font-black text-xs">
                    <Gamepad2 className="w-4 h-4 shrink-0" />
                    <span>Game theo Unit</span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 leading-snug">
                    Từ vựng, hội thoại, trắc nghiệm tạo game & chia sẻ QR ngay.
                  </p>
                </div>

                <div className="rounded-2xl bg-purple-50/75 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/50 p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300 font-headline font-black text-xs">
                    <BookOpen className="w-4 h-4 shrink-0" />
                    <span>Ôn tập toàn diện</span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 leading-snug">
                    Đề tổng hợp từng Unit & tóm tắt ngữ pháp cho học sinh.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 px-4 py-3 flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                  Thầy/Cô có muốn trải nghiệm ngay kho học liệu Sách Global Success không?
                </p>
              </div>

              {/* Footer Buttons */}
              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={onDismiss}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                >
                  Để sau
                </button>

                <ShimmerButton
                  type="button"
                  borderRadius="14px"
                  shimmerDuration="2.6s"
                  background="linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)"
                  onClick={onConfirmExperience}
                  className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-extrabold shadow-lg shadow-amber-500/25 gap-2"
                >
                  <span>Có, trải nghiệm ngay</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </ShimmerButton>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
