"use client";

import { useState } from "react";
import { X, Play, Volume2, Sparkles, RefreshCw, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export interface PreviewGameTopic {
  id: string;
  name: string;
  ageGroup: string;
  items: Array<{
    id: string;
    word: string;
    imageUrl?: string | null;
    audioUrl?: string | null;
  }>;
}

export function MatchGamePreviewModal({
  topic,
  onClose,
}: {
  topic: PreviewGameTopic;
  onClose: () => void;
}) {
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);

  const handlePlayAudio = (url?: string | null, word?: string) => {
    if (url) {
      const audio = new Audio(url);
      audio.play().catch(() => {});
    } else if (word && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSelectWord = (item: PreviewGameTopic["items"][0]) => {
    if (matchedIds.includes(item.id)) return;
    handlePlayAudio(item.audioUrl, item.word);

    if (selectedImageId === item.id) {
      setMatchedIds([...matchedIds, item.id]);
      setSelectedWordId(null);
      setSelectedImageId(null);
      toast.success(`Chính xác: ${item.word}!`);
    } else {
      setSelectedWordId(item.id);
    }
  };

  const handleSelectImage = (item: PreviewGameTopic["items"][0]) => {
    if (matchedIds.includes(item.id)) return;

    if (selectedWordId === item.id) {
      setMatchedIds([...matchedIds, item.id]);
      setSelectedWordId(null);
      setSelectedImageId(null);
      toast.success(`Chính xác: ${item.word}!`);
    } else {
      setSelectedImageId(item.id);
    }
  };

  const isCompleted = topic.items.length > 0 && matchedIds.length === topic.items.length;

  return (
    <div className="fixed inset-0 z-[300] overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity animate-in fade-in duration-200" 
      />

      {/* Modal Box */}
      <div className="relative z-10 w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-6 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
              Xem trước bài tập Nối Cặp
            </span>
            <h2 className="font-headline font-black text-2xl text-slate-800 dark:text-white mt-1">
              {topic.name}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-500 flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Game Interactive Grid */}
        {isCompleted ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 bg-purple-50/50 dark:bg-purple-950/20 rounded-3xl border border-purple-200/60">
            <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="font-headline font-black text-2xl text-slate-800 dark:text-white">
              Xuất sắc! Đã nối thành công tất cả cặp thẻ
            </h3>
            <p className="text-xs text-slate-500 max-w-md">
              Học sinh sẽ nhận được điểm và phần thưởng sau khi hoàn tất các cặp nối này.
            </p>
            <button
              onClick={() => {
                setMatchedIds([]);
                setSelectedWordId(null);
                setSelectedImageId(null);
              }}
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Chơi lại từ đầu</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-2">
            {/* Left Column: Words */}
            <div className="space-y-3">
              <h4 className="font-headline font-black text-xs uppercase tracking-wider text-slate-400">
                1. Từ vựng (Click chọn)
              </h4>
              <div className="space-y-3">
                {topic.items.map((item) => {
                  const isMatched = matchedIds.includes(item.id);
                  const isSelected = selectedWordId === item.id;
                  return (
                    <button
                      key={`word-${item.id}`}
                      disabled={isMatched}
                      onClick={() => handleSelectWord(item)}
                      className={`w-full p-4 rounded-2xl border text-left font-black text-lg transition-all flex items-center justify-between cursor-pointer ${
                        isMatched
                          ? "bg-emerald-50 border-emerald-300 text-emerald-600 opacity-60 cursor-not-allowed"
                          : isSelected
                          ? "bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-600/30 scale-[1.02]"
                          : "bg-slate-50 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                      }`}
                    >
                      <span>{item.word}</span>
                      <Volume2 className={`w-5 h-5 ${isSelected ? "text-white" : "text-purple-500"}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Images */}
            <div className="space-y-3">
              <h4 className="font-headline font-black text-xs uppercase tracking-wider text-slate-400">
                2. Hình ảnh tương ứng (Click chọn)
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {topic.items.map((item) => {
                  const isMatched = matchedIds.includes(item.id);
                  const isSelected = selectedImageId === item.id;
                  return (
                    <div
                      key={`img-${item.id}`}
                      onClick={() => handleSelectImage(item)}
                      className={`relative aspect-[4/3] rounded-2xl border p-2 flex items-center justify-center transition-all cursor-pointer overflow-hidden ${
                        isMatched
                          ? "bg-emerald-50 border-emerald-300 opacity-50 cursor-not-allowed"
                          : isSelected
                          ? "bg-purple-100 dark:bg-purple-950 border-purple-600 ring-4 ring-purple-600/20 scale-[1.03]"
                          : "bg-slate-50 dark:bg-slate-800 hover:border-purple-300 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.word}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <span className="text-xs font-bold text-slate-400">{item.word}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
