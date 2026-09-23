"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import {
  Play,
  Share2,
  Copy,
  Check,
  QrCode,
  Sparkles,
  ArrowLeft,
  X,
  ExternalLink,
  BookOpen,
  HelpCircle,
  Gamepad2,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import type { GameTopicWithItems, GameFaqItem } from "@/lib/seo/game-seo-generator";

interface PublicGameViewProps {
  topic: GameTopicWithItems;
  canonicalUrl: string;
  playUrl: string;
  howToPlay: Array<{ step: number; title: string; desc: string }>;
  faqList: GameFaqItem[];
  relatedGames: Array<{
    id: string;
    slug: string;
    name: string;
    gameMode: string | null;
    ageGroup: string;
    thumbnailUrl: string | null;
    itemCount: number;
  }>;
}

export function PublicGameView({
  topic,
  canonicalUrl,
  playUrl,
  howToPlay,
  faqList,
  relatedGames,
}: PublicGameViewProps) {
  const searchParams = useSearchParams();
  const autoPlay = searchParams?.get("play") === "1" || searchParams?.get("autoplay") === "true";

  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  useEffect(() => {
    if (autoPlay) {
      setIsPlaying(true);
    }
  }, [autoPlay]);

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(canonicalUrl);
      setCopied(true);
      toast.success("Đã sao chép đường dẫn trò chơi!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareFacebook = () => {
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(canonicalUrl)}`;
    window.open(shareUrl, "_blank", "width=600,height=500");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 font-sans">
      {/* Fullscreen In-Page Game Runner Modal */}
      {isPlaying && (
        <div className="fixed inset-0 z-[300] bg-black flex flex-col animate-in fade-in duration-200">
          <div className="h-12 bg-slate-900/90 border-b border-white/10 px-4 flex items-center justify-between z-10 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setIsPlaying(false)}
              className="flex items-center gap-2 text-xs font-black text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại trang giới thiệu</span>
            </button>
            <span className="text-xs font-bold text-slate-400 truncate max-w-xs sm:max-w-md">
              {topic.name}
            </span>
            <button
              type="button"
              onClick={() => setIsPlaying(false)}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-rose-500/80 text-white flex items-center justify-center transition-all cursor-pointer"
              title="Đóng game"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <iframe
            src={playUrl}
            className="w-full flex-1 border-none block"
            title={topic.name}
            allow="autoplay; fullscreen; clipboard-write; encrypted-media"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        </div>
      )}

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white font-black text-xl">
            <span className="text-2xl">🧁</span>
            <span>Dolcake</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold transition-all border border-white/10 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Đã chép" : "Chia sẻ link"}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowQr(true)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 transition-all border border-white/10 cursor-pointer"
              title="Mã QR cho iPad / Điện thoại"
            >
              <QrCode className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-12">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <Link href="/" className="hover:text-white transition-colors">Trang chủ</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span>Trò chơi giáo dục</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-cyan-400 font-bold truncate max-w-xs">{topic.name}</span>
        </nav>

        {/* HERO SECTION */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-6 sm:p-8 md:p-10 shadow-2xl backdrop-blur-md">
          {/* Left Column: Title & Metadata */}
          <div className="lg:col-span-7 space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                🎮 Trò Chơi Giáo Dục
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                {topic.ageGroup === "2-5" ? "Bé mầm non (2-5 tuổi)" : topic.ageGroup === "6-12" ? "Tiểu học (6-12 tuổi)" : `Lứa tuổi ${topic.ageGroup}`}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-slate-300 border border-white/10">
                {topic.items.length} câu hỏi / từ vựng
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              {topic.name}
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Trò chơi tiếng Anh tương tác giúp học sinh rèn luyện phản xạ nhanh, nhận diện mặt chữ và hình ảnh một cách tự nhiên và hào hứng trên nền tảng giáo dục Dolcake.
            </p>

            {/* Author / Teacher Card */}
            {topic.teacher && (
              <div className="flex items-center gap-3 pt-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md overflow-hidden">
                  {topic.teacher.image ? (
                    <img src={topic.teacher.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span>{(topic.teacher.name || "G")[0]}</span>
                  )}
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Giáo viên biên soạn</span>
                  <span className="text-sm font-bold text-white">{topic.teacher.name || "Giáo viên Dolcake"}</span>
                </div>
              </div>
            )}

            {/* CTA Buttons */}
            <div className="pt-4 flex flex-wrap gap-4 items-center">
              <button
                type="button"
                onClick={() => setIsPlaying(true)}
                className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-base md:text-lg shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:shadow-[0_0_45px_rgba(6,182,212,0.8)] active:scale-95 transition-all cursor-pointer"
              >
                <Play className="w-6 h-6 fill-current group-hover:scale-110 transition-transform" />
                <span>BẮT ĐẦU CHƠI NGAY</span>
              </button>

              <button
                type="button"
                onClick={handleShareFacebook}
                className="inline-flex items-center gap-2 px-5 py-4 rounded-2xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-sm font-bold border border-blue-500/30 transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Chia sẻ Facebook</span>
              </button>
            </div>
          </div>

          {/* Right Column: Hero Visual Thumbnail */}
          <div className="lg:col-span-5 flex justify-center">
            <div
              onClick={() => setIsPlaying(true)}
              className="group relative w-full max-w-sm aspect-[4/3] rounded-3xl overflow-hidden border border-white/20 shadow-2xl cursor-pointer bg-slate-950 flex items-center justify-center transition-transform hover:scale-[1.02]"
            >
              {topic.thumbnailUrl ? (
                <img
                  src={topic.thumbnailUrl}
                  alt={topic.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="flex flex-col items-center justify-center space-y-3 p-6 text-center">
                  <span className="text-6xl animate-bounce">🎮</span>
                  <span className="text-sm font-bold text-slate-300">Nhấn để bắt đầu chơi</span>
                </div>
              )}

              {/* Center Play Icon Overlay */}
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 backdrop-blur-[2px] flex items-center justify-center transition-all">
                <div className="w-20 h-20 rounded-full bg-cyan-500/90 group-hover:bg-cyan-400 text-slate-950 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all">
                  <Play className="w-10 h-10 fill-current ml-1" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 1: EDUCATIONAL CONTENT BREAKDOWN (Google SEO Goldmine) */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Nội dung câu hỏi & từ vựng trong bài</h2>
              <p className="text-xs text-slate-400 font-medium">
                Tất cả kiến thức được biên soạn sư phạm chuẩn chỉnh cho học sinh
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
            {topic.items.map((item, idx) => (
              <div
                key={item.id || idx}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-cyan-400/40 transition-all hover:bg-white/[0.06] group"
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.word}
                    className="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-slate-800 text-cyan-400 flex items-center justify-center text-lg font-black shrink-0">
                    {idx + 1}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-black text-white group-hover:text-cyan-300 transition-colors block truncate">
                    {item.word}
                  </span>
                  <span className="text-[11px] text-slate-400 block truncate">
                    Mục {idx + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 2: HOW TO PLAY */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Hướng dẫn cách chơi</h2>
              <p className="text-xs text-slate-400 font-medium">3 bước đơn giản để bé làm quen và ghi điểm cao</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {howToPlay.map((item) => (
              <div
                key={item.step}
                className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 space-y-3 relative overflow-hidden"
              >
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white font-black text-base flex items-center justify-center shadow-md">
                  {item.step}
                </div>
                <h3 className="font-bold text-base text-white">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 3: FAQ ACCORDION */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Câu hỏi thường gặp (FAQ)</h2>
              <p className="text-xs text-slate-400 font-medium">Giải đáp nhanh thắc mắc cho phụ huynh và học sinh</p>
            </div>
          </div>

          <div className="space-y-3">
            {faqList.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between font-bold text-sm text-white hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  <span>{faq.question}</span>
                  <span className="text-slate-400 text-lg">{activeFaq === idx ? "−" : "+"}</span>
                </button>
                {activeFaq === idx && (
                  <div className="px-5 pb-4 text-xs text-slate-400 leading-relaxed border-t border-white/5 pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 4: RELATED GAMES RECOMMENDATIONS */}
        {relatedGames.length > 0 && (
          <section className="space-y-6 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-white">Trò chơi tiếng Anh liên quan</h2>
                <p className="text-xs text-slate-400 font-medium">Khám phá thêm các bài học thú vị khác cùng lứa tuổi</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedGames.map((g) => (
                <Link
                  key={g.id}
                  href={`/public/games/${g.slug || g.id}`}
                  className="group p-4 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-cyan-400/50 hover:bg-white/[0.06] transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="w-full aspect-[4/3] rounded-2xl bg-slate-800 overflow-hidden relative">
                    {g.thumbnailUrl ? (
                      <img
                        src={g.thumbnailUrl}
                        alt={g.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">🎮</div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-cyan-400 font-black uppercase tracking-wider block">
                      {g.itemCount} câu hỏi
                    </span>
                    <h3 className="font-bold text-sm text-white group-hover:text-cyan-300 transition-colors line-clamp-2">
                      {g.name}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* QR Code Modal for Mobile / iPad */}
      {showQr && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/15 p-6 rounded-3xl max-w-xs w-full text-center space-y-4 shadow-2xl">
            <h3 className="text-base font-black text-white">Quét mã để chơi trên iPad / Điện thoại</h3>
            <div className="p-3 bg-white rounded-2xl inline-block shadow-inner">
              <QRCodeCanvas value={canonicalUrl} size={180} />
            </div>
            <p className="text-[11px] text-slate-400">
              Mở camera điện thoại hoặc iPad quét mã QR để bắt đầu chơi ngay!
            </p>
            <button
              type="button"
              onClick={() => setShowQr(false)}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
