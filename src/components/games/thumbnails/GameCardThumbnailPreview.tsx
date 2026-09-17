"use client";

import React from "react";

export interface GameOptionItem {
  id?: string;
  text: string;
  isCorrect?: boolean;
}

export interface GameCardThumbnailPreviewProps {
  gameMode?: string; // "candy-quiz" | "treasure-hunt" | "shooter-quiz" | "choice-shooter" | "choice-egg" | "flip" | "match" | string;
  title?: string;
  questionText: string;
  questionImage?: string | null;
  options?: GameOptionItem[];
  // Optional pairs for match/flip:
  pairs?: Array<{ word: string; imageUrl?: string | null }>;
}

export const GameCardThumbnailPreview = React.forwardRef<
  HTMLDivElement,
  GameCardThumbnailPreviewProps
>(function GameCardThumbnailPreview(
  {
    gameMode = "candy-quiz",
    title = "",
    questionText,
    questionImage,
    options = [],
    pairs = [],
  },
  ref
) {
  const normMode = (gameMode || "").toLowerCase();

  // Normalize 4 options
  const defaultLetters = ["A", "B", "C", "D"];
  const displayOptions = options.length > 0
    ? options.slice(0, 4).map((opt, i) => ({
        id: opt.id || defaultLetters[i],
        text: opt.text || `Đáp án ${defaultLetters[i]}`,
        isCorrect: opt.isCorrect,
      }))
    : [
        { id: "A", text: "Lựa chọn A" },
        { id: "B", text: "Lựa chọn B" },
        { id: "C", text: "Lựa chọn C" },
        { id: "D", text: "Lựa chọn D" },
      ];

  // ──────────────────────────────────────────────────────────────────────────
  // 1. KHO BÁU (Treasure Hunt)
  // ──────────────────────────────────────────────────────────────────────────
  if (normMode.includes("treasure") || normMode.includes("kho báu") || normMode === "treasure-hunt") {
    return (
      <div
        ref={ref}
        style={{ width: 1200, height: 675 }}
        className="relative overflow-hidden font-sans select-none flex flex-col justify-between p-8 bg-amber-950"
      >
        {/* Background stage */}
        <img
          src="/games/mystery-treasure-grid-assets/assets/webp/background-stage.webp"
          alt="Treasure Background"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/15 pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3 bg-amber-950/80 backdrop-blur-md px-6 py-2.5 rounded-full border-2 border-amber-400/60 shadow-xl">
            <span className="text-2xl">🗺️</span>
            <span className="text-amber-200 font-black text-xl tracking-wider uppercase drop-shadow">
              TRUY TÌM KHO BÁU
            </span>
          </div>
          {title && (
            <div className="bg-black/60 backdrop-blur-md px-6 py-2 rounded-2xl border border-amber-400/30 text-white font-bold text-lg max-w-md truncate drop-shadow">
              {title}
            </div>
          )}
        </div>

        {/* Main Body */}
        <div className="relative z-10 grid grid-cols-12 gap-8 items-center flex-1 my-4">
          {/* Question & Options Area (Left 8 cols) */}
          <div className="col-span-8 flex flex-col justify-center space-y-6">
            {/* Wooden Question Board */}
            <div className="relative bg-gradient-to-b from-[#8B5A2B] via-[#653E1B] to-[#4A2E13] p-7 rounded-3xl border-4 border-[#D4AF37] shadow-2xl">
              <div className="flex items-center gap-5">
                {questionImage && (
                  <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-[#D4AF37] shrink-0 bg-black/30">
                    <img src={questionImage} alt="question" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="text-amber-300 font-black text-sm uppercase tracking-widest mb-1 flex items-center gap-1.5">
                    <span>⚓</span> CÂU HỎI
                  </div>
                  <h2 className="text-white font-black text-2xl lg:text-3xl leading-snug drop-shadow-md line-clamp-3">
                    {questionText || "Nội dung câu hỏi của bài tập"}
                  </h2>
                </div>
              </div>
            </div>

            {/* Answer Options Grid */}
            <div className="grid grid-cols-2 gap-4">
              {displayOptions.map((opt) => (
                <div
                  key={opt.id}
                  className="bg-gradient-to-r from-amber-100 to-amber-50 rounded-2xl p-4 border-2 border-amber-300 shadow-lg flex items-center gap-3.5"
                >
                  <span className="w-10 h-10 rounded-xl bg-[#8B5A2B] text-amber-200 font-black text-lg flex items-center justify-center shrink-0 shadow-md">
                    {opt.id}
                  </span>
                  <span className="text-amber-950 font-black text-lg truncate flex-1">
                    {opt.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Treasure Chest & Map Grid (Right 4 cols) */}
          <div className="col-span-4 flex flex-col items-center justify-center space-y-4">
            <div className="w-56 h-56 relative drop-shadow-2xl">
              <img
                src="/games/mystery-treasure-grid-assets/assets/webp/treasure-chest.webp"
                alt="Treasure Chest"
                className="w-full h-full object-contain filter drop-shadow-[0_15px_15px_rgba(0,0,0,0.6)]"
              />
            </div>
            <div className="bg-amber-950/85 backdrop-blur-md px-6 py-2.5 rounded-2xl border-2 border-amber-400 text-amber-300 font-black text-sm tracking-wider uppercase text-center shadow-xl">
              🪙 Mở khóa rương vàng
            </div>
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="relative z-10 flex justify-between items-center text-amber-200/90 text-sm font-bold">
          <span>🏴‍☠️ Chinh phục các câu hỏi để tìm kho báu</span>
          <span>⚡ Cupcakes Interactive Games</span>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. BẮN SÚNG (Shooter Quiz & Math Shooter)
  // ──────────────────────────────────────────────────────────────────────────
  if (normMode.includes("shooter") || normMode.includes("bắn súng") || normMode === "choice-shooter" || normMode === "shooter-quiz") {
    return (
      <div
        ref={ref}
        style={{ width: 1200, height: 675 }}
        className="relative overflow-hidden font-sans select-none flex flex-col justify-between p-8 bg-[#060814]"
      >
        {/* Deep space background with glowing grid */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0d24] via-[#050716] to-[#02030a]" />
        {/* Starfield simulation */}
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />

        {/* Top Sci-Fi HUD */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3 bg-cyan-950/70 backdrop-blur-md px-6 py-2.5 rounded-full border-2 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
            <span className="text-2xl">🚀</span>
            <span className="text-cyan-300 font-black text-xl tracking-widest uppercase">
              BẮN SÚNG KHÔNG GIAN
            </span>
          </div>
          {title && (
            <div className="bg-slate-900/80 backdrop-blur-md px-6 py-2 rounded-2xl border border-cyan-500/30 text-cyan-100 font-mono font-bold text-lg max-w-md truncate">
              {title}
            </div>
          )}
        </div>

        {/* Center Target & Question */}
        <div className="relative z-10 flex-1 flex flex-col justify-center items-center my-4 space-y-6">
          {/* Holographic Question Board */}
          <div className="w-full max-w-4xl bg-slate-900/80 backdrop-blur-xl border-2 border-cyan-400/80 rounded-3xl p-7 shadow-[0_0_35px_rgba(6,182,212,0.3)] text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
            <div className="text-cyan-400 font-mono text-xs tracking-widest uppercase mb-2">
              TARGET OBJECTIVE // CÂU HỎI
            </div>
            <h2 className="text-white font-black text-2xl lg:text-3xl drop-shadow-md leading-snug line-clamp-3">
              {questionText || "Nội dung câu hỏi của bài tập"}
            </h2>
          </div>

          {/* Glowing Target Options */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 w-full max-w-4xl">
            {displayOptions.map((opt, i) => {
              const colors = [
                "border-cyan-400 text-cyan-300 bg-cyan-950/60 shadow-[0_0_15px_rgba(6,182,212,0.3)]",
                "border-pink-400 text-pink-300 bg-pink-950/60 shadow-[0_0_15px_rgba(244,114,182,0.3)]",
                "border-amber-400 text-amber-300 bg-amber-950/60 shadow-[0_0_15px_rgba(251,191,36,0.3)]",
                "border-emerald-400 text-emerald-300 bg-emerald-950/60 shadow-[0_0_15px_rgba(52,211,153,0.3)]",
              ];
              const colorClass = colors[i % colors.length];

              return (
                <div
                  key={opt.id}
                  className={`rounded-2xl border-2 p-4 flex flex-col items-center justify-center text-center backdrop-blur-md transition-all ${colorClass}`}
                >
                  <span className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center font-black text-base mb-2">
                    {opt.id}
                  </span>
                  <span className="font-bold text-lg text-white drop-shadow truncate w-full">
                    {opt.text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Spaceship Cockpit */}
        <div className="relative z-10 flex justify-between items-center text-cyan-400/80 font-mono text-xs">
          <span>LASER CANNON READY 💥 Bắn trúng đáp án chính xác</span>
          <span>SYSTEM ONLINE 100%</span>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 3. ĐẬP TRỨNG (Egg Smash)
  // ──────────────────────────────────────────────────────────────────────────
  if (normMode.includes("egg") || normMode.includes("đập trứng") || normMode === "choice-egg") {
    const eggImages = [
      "/games/egg-smash-quiz-premium-ambient/assets/egg-blue.png",
      "/games/egg-smash-quiz-premium-ambient/assets/egg-pink.png",
      "/games/egg-smash-quiz-premium-ambient/assets/egg-green.png",
      "/games/egg-smash-quiz-premium-ambient/assets/egg-purple.png",
    ];

    return (
      <div
        ref={ref}
        style={{ width: 1200, height: 675 }}
        className="relative overflow-hidden font-sans select-none flex flex-col justify-between p-8 bg-emerald-950"
      >
        {/* Background farm */}
        <img
          src="/games/egg-smash-quiz-premium-ambient/assets/background-farm-no-nest.png"
          alt="Farm Background"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3 bg-amber-500/90 backdrop-blur-md px-6 py-2.5 rounded-full border-2 border-white shadow-xl">
            <span className="text-2xl">🥚</span>
            <span className="text-white font-black text-xl tracking-wider uppercase drop-shadow">
              ĐẬP TRỨNG THẦN TỐC
            </span>
          </div>
          {title && (
            <div className="bg-white/80 backdrop-blur-md px-6 py-2 rounded-2xl border border-amber-400 text-amber-950 font-bold text-lg max-w-md truncate shadow-md">
              {title}
            </div>
          )}
        </div>

        {/* Question Board */}
        <div className="relative z-10 flex-1 flex flex-col justify-center items-center my-4 space-y-6">
          <div className="w-full max-w-4xl bg-gradient-to-b from-amber-100 to-amber-50 border-4 border-amber-400 rounded-3xl p-6 shadow-2xl text-center">
            <span className="text-amber-800 font-black text-xs uppercase tracking-widest mb-1 block">
              CÂU HỎI
            </span>
            <h2 className="text-amber-950 font-black text-2xl lg:text-3xl leading-snug line-clamp-3">
              {questionText || "Nội dung câu hỏi của bài tập"}
            </h2>
          </div>

          {/* 4 Nests with Eggs & Options */}
          <div className="grid grid-cols-4 gap-6 w-full max-w-5xl">
            {displayOptions.map((opt, i) => (
              <div key={opt.id} className="flex flex-col items-center text-center group">
                <div className="w-28 h-32 relative drop-shadow-xl -mb-4 z-10">
                  <img
                    src={eggImages[i % eggImages.length]}
                    alt={`Egg ${opt.id}`}
                    className="w-full h-full object-contain"
                  />
                  <span className="absolute inset-0 flex items-center justify-center font-black text-2xl text-white drop-shadow-lg">
                    {opt.id}
                  </span>
                </div>
                <div className="w-full bg-white/95 rounded-2xl p-3 pt-5 border-2 border-amber-300 shadow-md">
                  <span className="text-amber-950 font-black text-base truncate block">
                    {opt.text}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex justify-between items-center text-emerald-950 font-bold text-sm bg-white/70 backdrop-blur-md px-6 py-2 rounded-xl">
          <span>🔨 Dùng búa gõ trúng quả trứng mang câu trả lời đúng!</span>
          <span>Cupcakes Game Studio</span>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ──────────────────────────────────────────────────────────────────────────
  // 4. NỐI DÂY (Line Matching - Ảnh - Chữ, Ảnh - Ảnh, Chữ - Chữ)
  // ──────────────────────────────────────────────────────────────────────────
  if (normMode.includes("line") || normMode.includes("nối dây") || normMode === "match-text-text") {
    const activePairs = pairs.length > 0
      ? pairs.slice(0, 4)
      : [
          { word: "Dog", imageUrl: "https://static.vecteezy.com/system/resources/previews/025/732/404/original/cute-cartoon-baby-dog-illustration-vector.jpg" },
          { word: "Cat", imageUrl: "https://img.freepik.com/premium-vector/cute-cat-cartoon-vector-illustration_921448-1392.jpg?w=2000" },
          { word: "Elephant", imageUrl: "https://static.vecteezy.com/system/resources/previews/028/597/726/original/happy-elephant-hand-drawn-cartoon-style-illustration-ai-generated-free-png.png" },
          { word: "Lion", imageUrl: "https://img.freepik.com/premium-vector/cute-lion-vector-illustration-kids_79831-376.jpg?w=2000" },
        ];

    // Shuffled bottom order for realistic matching look
    const bottomOrder = [1, 3, 0, 2];
    const bottomPairs = bottomOrder.map((idx) => activePairs[idx % activePairs.length]);

    return (
      <div
        ref={ref}
        style={{ width: 1200, height: 675 }}
        className="relative overflow-hidden font-sans select-none flex flex-col justify-between p-8 bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100"
      >
        {/* Soft decorative background elements */}
        <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#818cf8_2px,transparent_2px)] [background-size:28px_28px]" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pink-300/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-300/20 blur-[120px] rounded-full pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-6 py-2.5 rounded-full font-black text-xl tracking-wider uppercase shadow-xl shadow-indigo-500/25">
              <span>🔗</span>
              <span>NỐI DÂY TỪ VỰNG</span>
            </div>
            <span className="px-3.5 py-1.5 rounded-full bg-pink-500 text-white text-xs font-black uppercase tracking-wider shadow-md animate-pulse">
              MỚI
            </span>
          </div>
          {title && (
            <div className="bg-white/90 backdrop-blur-md px-6 py-2 rounded-2xl border-2 border-indigo-200 text-indigo-950 font-black text-xl max-w-lg truncate shadow-lg">
              {title}
            </div>
          )}
        </div>

        {/* Game Stage with Top Cards, SVG Connector Lines, and Bottom Labels */}
        <div className="relative z-10 flex-1 flex flex-col justify-between my-3 px-6">
          {/* Top Row: 4 Picture Cards */}
          <div className="grid grid-cols-4 gap-8">
            {activePairs.map((pair, i) => (
              <div
                key={`top-${i}`}
                className="relative bg-white rounded-3xl p-3 border-4 border-indigo-200 shadow-xl flex flex-col items-center justify-center h-44 hover:scale-105 transition-transform"
              >
                {pair.imageUrl ? (
                  <img
                    src={pair.imageUrl}
                    alt={pair.word}
                    className="w-full h-28 object-contain rounded-2xl"
                  />
                ) : (
                  <div className="w-full h-28 flex items-center justify-center text-4xl bg-indigo-50 rounded-2xl">
                    ⭐
                  </div>
                )}
                <span className="text-xs font-black text-slate-700 mt-1 truncate max-w-[180px]">
                  {pair.word}
                </span>

                {/* Bottom Connection Pin Dot */}
                <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-rose-500 border-3 border-white shadow-md flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-white" />
                </div>
              </div>
            ))}
          </div>

          {/* SVG Connection Lines Overlay */}
          <div className="relative h-28 w-full">
            <svg className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="lineGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ec4899" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
                <linearGradient id="lineGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
              {/* Line 0 to 2 */}
              <path
                d="M 140 0 C 140 60, 680 50, 680 110"
                fill="none"
                stroke="url(#lineGrad1)"
                strokeWidth="5"
                strokeDasharray="8 6"
                strokeLinecap="round"
              />
              {/* Line 1 to 0 */}
              <path
                d="M 410 0 C 410 50, 140 60, 140 110"
                fill="none"
                stroke="#10b981"
                strokeWidth="5"
                strokeLinecap="round"
              />
              {/* Line 2 to 3 */}
              <path
                d="M 680 0 C 680 50, 950 60, 950 110"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="5"
                strokeDasharray="8 6"
                strokeLinecap="round"
              />
              {/* Line 3 to 1 */}
              <path
                d="M 950 0 C 950 60, 410 50, 410 110"
                fill="none"
                stroke="url(#lineGrad2)"
                strokeWidth="5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Bottom Row: 4 Target Pills */}
          <div className="grid grid-cols-4 gap-8">
            {bottomPairs.map((pair, i) => (
              <div
                key={`bot-${i}`}
                className="relative bg-white rounded-full py-4 px-6 border-3 border-indigo-300 shadow-xl flex items-center justify-center text-center hover:scale-105 transition-transform"
              >
                {/* Top Connection Pin Dot */}
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-indigo-600 border-3 border-white shadow-md flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-white" />
                </div>
                <span className="font-headline font-black text-xl text-indigo-950 truncate">
                  {pair.word}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex justify-between items-center text-indigo-900 font-bold text-sm bg-white/80 backdrop-blur-md px-6 py-2 rounded-2xl border border-indigo-100 shadow-sm">
          <span>🎯 Kéo dây từ hình ảnh phía trên xuống ô từ vựng tương ứng</span>
          <span>{pairs.length || 20} cặp thẻ thử thách</span>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 5. LẬT ẢNH / NỐI CẶP KHÁC (Flip / Match)
  // ──────────────────────────────────────────────────────────────────────────
  if (
    normMode.includes("flip") ||
    normMode.includes("match") ||
    normMode.includes("lật")
  ) {
    const activePairs = pairs.length > 0
      ? pairs.slice(0, 6)
      : [
          { word: "Apple", imageUrl: null },
          { word: "Cat", imageUrl: null },
          { word: "Sun", imageUrl: null },
          { word: "Tree", imageUrl: null },
          { word: "Book", imageUrl: null },
          { word: "Car", imageUrl: null },
        ];

    return (
      <div
        ref={ref}
        style={{ width: 1200, height: 675 }}
        className="relative overflow-hidden font-sans select-none flex flex-col justify-between p-8 bg-gradient-to-br from-sky-400 via-indigo-500 to-purple-600"
      >
        {/* Header */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3 bg-white/90 backdrop-blur-md px-6 py-2.5 rounded-full border-2 border-white shadow-xl">
            <span className="text-2xl">🃏</span>
            <span className="text-indigo-900 font-black text-xl tracking-wider uppercase">
              {normMode.includes("flip") ? "GAME LẬT THẺ TRÍ NHỚ" : "GAME GHÉP ĐÔI TỪ VỰNG"}
            </span>
          </div>
          {title && (
            <div className="bg-white/80 backdrop-blur-md px-6 py-2 rounded-2xl border border-white text-indigo-950 font-bold text-lg max-w-md truncate shadow-md">
              {title}
            </div>
          )}
        </div>

        {/* Cards Grid Showcase */}
        <div className="relative z-10 flex-1 flex flex-col justify-center items-center my-4">
          <div className="grid grid-cols-3 gap-6 w-full max-w-4xl">
            {activePairs.map((p, i) => (
              <div
                key={i}
                className="h-32 bg-white/95 backdrop-blur-md rounded-3xl border-4 border-amber-300 shadow-2xl flex items-center justify-center p-4 text-center transform hover:scale-105 transition-transform"
              >
                {p.imageUrl ? (
                  <div className="flex items-center gap-3">
                    <img src={p.imageUrl} alt={p.word} className="w-16 h-16 object-contain rounded-xl" />
                    <span className="font-headline font-black text-2xl text-slate-800 line-clamp-1">{p.word}</span>
                  </div>
                ) : (
                  <span className="font-headline font-black text-2xl text-slate-800 line-clamp-2">
                    {p.word}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex justify-between items-center text-white font-bold text-sm bg-black/30 backdrop-blur-md px-6 py-2.5 rounded-xl">
          <span>✨ Rèn luyện trí nhớ và phản xạ từ vựng tiếng Anh</span>
          <span>Cupcakes Game Studio</span>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 5. MẶC ĐỊNH: KẸO NGỌT (Candy Grammar Quiz)
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div
      ref={ref}
      style={{ width: 1200, height: 675 }}
      className="relative overflow-hidden font-sans select-none flex flex-col justify-between p-8 bg-[#43b9f5]"
    >
      {/* Background Candy Kingdom */}
      <img
        src="/games/candy-grammar-sugar-jelly/assets/background/candyland-clean-hq.png"
        alt="Candyland"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Top Header */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3 bg-white/95 backdrop-blur-md px-6 py-2.5 rounded-full border-2 border-pink-400 shadow-xl">
          <span className="text-2xl">🍬</span>
          <span className="text-pink-600 font-black text-xl tracking-wider uppercase drop-shadow-xs">
            TRẮC NGHIỆM KẸO NGỌT
          </span>
        </div>
        {title && (
          <div className="bg-white/90 backdrop-blur-md px-6 py-2 rounded-2xl border-2 border-pink-300 text-pink-900 font-bold text-lg max-w-md truncate shadow-md">
            {title}
          </div>
        )}
      </div>

      {/* Center Question & Options */}
      <div className="relative z-10 flex-1 flex flex-col justify-center items-center my-4 space-y-6">
        {/* Candy Question Board */}
        <div className="w-full max-w-4xl bg-gradient-to-b from-[#FFF5EB] to-[#FFE0C2] rounded-3xl p-7 border-4 border-[#FF85A2] shadow-2xl text-center relative">
          <div className="flex items-center justify-center gap-4">
            {questionImage && (
              <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-pink-400 shrink-0 shadow-md">
                <img src={questionImage} alt="question" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1">
              <span className="text-pink-500 font-black text-xs uppercase tracking-widest block mb-1">
                🍭 CÂU HỎI
              </span>
              <h2 className="text-[#6D284B] font-black text-2xl lg:text-3xl leading-snug drop-shadow-xs line-clamp-3">
                {questionText || "Nội dung câu hỏi của bài tập"}
              </h2>
            </div>
          </div>
        </div>

        {/* 2x2 Waffle / Cookie Answer Buttons */}
        <div className="grid grid-cols-2 gap-5 w-full max-w-4xl">
          {displayOptions.map((opt) => (
            <div
              key={opt.id}
              className="bg-white/95 backdrop-blur-md rounded-2xl p-4.5 border-3 border-pink-300 shadow-xl flex items-center gap-4 hover:border-pink-500 transition-colors"
            >
              <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-md">
                {opt.id}
              </span>
              <span className="text-slate-800 font-black text-xl truncate flex-1">
                {opt.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="relative z-10 flex justify-between items-center text-pink-900 font-bold text-sm bg-white/75 backdrop-blur-md px-6 py-2 rounded-xl">
        <span>🍪 Trả lời đúng để ghi điểm và nhận kẹo ngọt!</span>
        <span>Cupcakes Game Studio</span>
      </div>
    </div>
  );
});
