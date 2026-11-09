"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { 
  X, 
  Copy, 
  Check, 
  Share2, 
  Download, 
  ExternalLink, 
  Sparkles, 
  QrCode, 
  CheckCircle2 
} from "lucide-react";
import { toast } from "sonner"; import { trackEvent } from "@/lib/analytics";
import { useTeacherLocale, withLangParam } from "@/i18n/teacher-locale";

export interface ShareableGameOption {
  id: string;
  labelVi: string;
  labelEn: string;
  gamePath: string;
}

interface MatchGameShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  topicName: string;
  topicId: string;
  gamePath?: string;
  gameOptions?: ShareableGameOption[];
}

export function MatchGameShareModal({
  isOpen,
  onClose,
  topicName,
  topicId,
  gamePath = "/student/game/flashcard-match",
  gameOptions,
}: MatchGameShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string>(
    () => gameOptions?.[0]?.id || ""
  );
  const downloadCanvasRef = useRef<HTMLCanvasElement>(null);
  const { locale, t } = useTeacherLocale();

  useEffect(() => {
    if (isOpen && gameOptions && gameOptions.length > 0) {
      setSelectedOptionId(gameOptions[0].id);
    }
  }, [isOpen, topicId, gameOptions]);

  const activeGamePath =
    (gameOptions &&
      gameOptions.find((opt) => opt.id === selectedOptionId)?.gamePath) ||
    gamePath;

  const rawBase = activeGamePath.includes("topicId=")
    ? activeGamePath
    : `${activeGamePath}${activeGamePath.includes("?") ? "&" : "?"}topicId=${topicId}`;

  const gameUrl =
    typeof window !== "undefined"
      ? withLangParam(`${window.location.origin}${rawBase.startsWith("/") ? "" : "/"}${rawBase}`, locale)
      : withLangParam(rawBase, locale);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Copy link handler
  const handleCopyLink = () => { trackEvent("teacher_my_game_action", { action: "copy_link", gameTitle: topicName, gameId: topicId });
    if (navigator.clipboard) {
      navigator.clipboard.writeText(gameUrl);
      setCopied(true);
      toast.success(t.shareModal.linkCopiedToast);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Download QR image
  const handleDownloadQR = useCallback(() => { trackEvent("teacher_my_game_action", { action: "download_qr", gameTitle: topicName, gameId: topicId });
    const canvas = downloadCanvasRef.current;
    if (!canvas) return;

    const offscreen = document.createElement("canvas");
    offscreen.width = canvas.width;
    offscreen.height = canvas.height;
    const ctx = offscreen.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, offscreen.width, offscreen.height);
    ctx.drawImage(canvas, 0, 0);

    offscreen.toBlob(
      (blob) => {
        if (!blob) return;
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        const safeTitle = topicName.replace(/[^\w\s-]/gi, "").trim().replace(/\s+/g, "-") || "Game-Noi-Cap";
        a.download = `QR-${safeTitle}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
        toast.success(t.shareModal.qrDownloadedToast);
      },
      "image/jpeg",
      0.95
    );
  }, [topicName, t.shareModal.qrDownloadedToast]);

  if (!isOpen) return null;

  return (
    <>
      {/* Hidden high-res canvas exclusively for image download */}
      <div className="sr-only" aria-hidden="true">
        <QRCodeCanvas
          ref={downloadCanvasRef}
          value={gameUrl}
          size={512}
          level="H"
          includeMargin={true}
        />
      </div>

      {/* Main Share & QR Modal Backdrop */}
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 flex items-center justify-center border border-purple-200/50">
                <Share2 className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  {t.shareModal.headerTag}
                </span>
                <h3 className="font-headline font-black text-base text-slate-800 dark:text-white line-clamp-1">
                  {topicName}
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6 flex flex-col items-center text-center space-y-4">
            {/* Optional Game Mode Switcher (for Global Success instant play) */}
            {gameOptions && gameOptions.length > 0 && (
              <div className="w-full space-y-1.5 text-left">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 text-center">
                  {locale === "vi"
                    ? "Trò chơi cho học sinh (Bấm để đổi nhanh)"
                    : "Student Game Format (Click to switch)"}
                </p>
                <div className="flex items-center justify-center gap-1.5 flex-wrap bg-slate-50 dark:bg-slate-800/70 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700">
                  {gameOptions.map((opt) => {
                    const isSelected = opt.id === selectedOptionId;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setSelectedOptionId(opt.id);
                          setCopied(false);
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-purple-600 text-white shadow-xs"
                            : "text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800"
                        }`}
                      >
                        {locale === "vi" ? opt.labelVi : opt.labelEn}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* QR Code Container */}
            <div className="bg-white p-4 rounded-3xl border-2 border-purple-100 dark:border-purple-950 shadow-xl shadow-purple-500/5 relative group">
              <QRCodeCanvas
                value={gameUrl}
                size={210}
                level="H"
                includeMargin={false}
                className="rounded-xl"
              />
            </div>

            {/* Instruction */}
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-800 dark:text-white flex items-center justify-center gap-1.5">
                <QrCode className="w-4 h-4 text-purple-500" />
                <span>{t.shareModal.qrScanTitle}</span>
              </p>
              <p className="text-xs text-slate-400 font-medium">
                {t.shareModal.qrScanSubtitle}
              </p>
            </div>

            {/* URL Input Box with Copy Button */}
            <div className="w-full bg-slate-50 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={gameUrl}
                className="flex-1 bg-transparent px-3 py-1.5 text-xs font-mono text-slate-600 dark:text-slate-300 outline-none truncate"
              />
              <button
                onClick={handleCopyLink}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  copied
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                    : "bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/20"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>{t.common.copied}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{t.common.copy}</span>
                  </>
                )}
              </button>
            </div>

            {/* Actions Bar */}
            <div className="w-full grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleDownloadQR}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-200/60 dark:border-slate-700"
              >
                <Download className="w-4 h-4" />
                <span>{t.common.downloadQr}</span>
              </button>

              <a
                href={gameUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-2xl shadow-md shadow-sky-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>{t.common.openGame}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
