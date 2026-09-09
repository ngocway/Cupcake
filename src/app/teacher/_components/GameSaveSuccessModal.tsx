"use client";

import React, { useState, useEffect, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import {
  X,
  Copy,
  Check,
  Download,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  FolderOpen,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface GameSaveSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  gameType: string;
  playUrl: string;
  gameCode?: string;
  redirectTab?: "my-quiz-games" | "my-match-games" | "my-flip-games" | "my-choice-games" | string;
}

export function GameSaveSuccessModal({
  isOpen,
  onClose,
  title,
  gameType,
  playUrl,
  gameCode,
  redirectTab = "my-quiz-games",
}: GameSaveSuccessModalProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  // Construct absolute play URL
  const fullUrl =
    typeof window !== "undefined"
      ? playUrl.startsWith("http")
        ? playUrl
        : `${window.location.origin}${playUrl.startsWith("/") ? "" : "/"}${playUrl}`
      : playUrl;

  // Handle escape key & dismiss loading toasts on open
  useEffect(() => {
    if (!isOpen) return;
    toast.dismiss();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleCloseAndRedirect();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast.success("Đã sao chép đường dẫn bài tập! Bạn có thể dán và gửi cho học sinh ngay.");
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownloadQR = () => {
    if (!qrRef.current) return;
    const canvas = qrRef.current.querySelector("canvas");
    if (!canvas) return;

    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `QR_${title.replace(/[^a-zA-Z0-9]/g, "_")}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Đã tải ảnh mã QR thành công!");
  };

  const handleCloseAndRedirect = () => {
    onClose();
    if (redirectTab) {
      router.push(`/teacher?tab=${redirectTab}`);
    } else {
      router.push("/teacher");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 text-center animate-in zoom-in-95 duration-200 relative my-8">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleCloseAndRedirect}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Celebration Header Badge */}
        <div className="space-y-3 pt-2">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30 text-3xl">
            🎉
          </div>
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-black text-[11px] uppercase tracking-wider mb-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Lưu bài tập thành công!
            </span>
            <h3 className="font-headline font-black text-xl sm:text-2xl text-slate-800 dark:text-white leading-snug">
              {title || "Bài tập mới"}
            </h3>
            <p className="text-xs font-semibold text-slate-400 mt-1">
              Dạng game: <span className="text-slate-600 dark:text-slate-300 font-bold">{gameType}</span>
            </p>
          </div>
        </div>

        {/* Short Code Badge if available */}
        {gameCode && (
          <div className="bg-amber-50 dark:bg-amber-950/30 rounded-2xl p-3 border border-amber-200/60 dark:border-amber-800/60 space-y-0.5 max-w-xs mx-auto">
            <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider block">
              Mã Bài Tập
            </span>
            <p className="font-mono font-black text-2xl text-amber-700 dark:text-amber-300 tracking-widest">
              {gameCode}
            </p>
          </div>
        )}

        {/* QR Code Section */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row items-center gap-4 text-left">
          <div
            ref={qrRef}
            className="p-2.5 bg-white rounded-xl shadow-md border border-slate-200 shrink-0 flex items-center justify-center"
          >
            <QRCodeCanvas
              value={fullUrl}
              size={130}
              level="H"
              includeMargin={false}
            />
          </div>
          <div className="flex-1 space-y-2 text-center sm:text-left">
            <div className="space-y-0.5">
              <h4 className="font-headline font-black text-sm text-slate-800 dark:text-white">
                Mã QR Chơi Ngay
              </h4>
              <p className="text-[11px] font-medium text-slate-400 leading-relaxed">
                Học sinh quét mã QR bằng điện thoại hoặc camera để vào làm bài ngay lập tức.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadQR}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải ảnh QR</span>
            </button>
          </div>
        </div>

        {/* Copy Link Input Section */}
        <div className="space-y-2 text-left">
          <label className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
            Đường Link Trực Tiếp
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={fullUrl}
              className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs text-slate-700 dark:text-slate-300 focus:outline-none truncate"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className={`px-4 py-2.5 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shrink-0 shadow-md cursor-pointer whitespace-nowrap active:scale-95 ${
                copied
                  ? "bg-emerald-600 text-white shadow-emerald-600/20"
                  : "bg-sky-500 hover:bg-sky-600 text-white shadow-sky-500/20"
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? "Đã chép" : "Sao chép"}</span>
            </button>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="pt-2 flex flex-col gap-2.5">
          <a
            href={fullUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 group cursor-pointer active:scale-95"
          >
            <span>Chơi thử ngay</span>
            <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </a>

          <button
            type="button"
            onClick={handleCloseAndRedirect}
            className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <FolderOpen className="w-4 h-4" />
            <span>Về danh sách bài tập</span>
          </button>
        </div>
      </div>
    </div>
  );
}
