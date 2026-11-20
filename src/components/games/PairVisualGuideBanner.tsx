"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Info, Link2, ArrowRight, Sparkles, Scissors, ImagePlus } from "lucide-react";
import { useTeacherLocale } from "@/i18n/teacher-locale";
import { GameDemoVideoButton } from "./GameDemoVideoButton";

export interface TrainCardPairItem {
  id?: string;
  word?: string;
  imageUrl?: string;
}

export interface ImageImageCardPairItem {
  id?: string;
  imageAUrl?: string;
  labelA?: string;
  imageBUrl?: string;
  labelB?: string;
}

export interface TextTextCardPairItem {
  id?: string;
  wordA?: string;
  labelB?: string;
}

interface PairVisualGuideBannerProps {
  gameMode?: string; // "match" | "line" | "train" | "cut-rope" | "conveyor-drop" | "flip"
  gameType?: "image-text" | "image-image" | "text-text";
  maxPairsPerRound?: number;
  pairs?: TrainCardPairItem[];
  imageImagePairs?: ImageImageCardPairItem[];
  textTextPairs?: TextTextCardPairItem[];
  currentRoundTitle?: string;
  onSelectPairIndex?: (index: number) => void;
}

const STORAGE_KEY = "dolcake_pair_visual_guide_collapsed_v1";

const LINE_PALETTES = [
  { wire: "from-violet-500 to-indigo-500", pin: "bg-violet-500 ring-violet-200 dark:ring-violet-900/60", badge: "from-violet-600 to-indigo-600" },
  { wire: "from-rose-500 to-pink-500", pin: "bg-rose-500 ring-rose-200 dark:ring-rose-900/60", badge: "from-rose-600 to-pink-600" },
  { wire: "from-amber-500 to-orange-500", pin: "bg-amber-500 ring-amber-200 dark:ring-amber-900/60", badge: "from-amber-600 to-orange-600" },
  { wire: "from-emerald-500 to-teal-500", pin: "bg-emerald-500 ring-emerald-200 dark:ring-emerald-900/60", badge: "from-emerald-600 to-teal-600" },
  { wire: "from-sky-500 to-blue-500", pin: "bg-sky-500 ring-sky-200 dark:ring-sky-900/60", badge: "from-sky-600 to-blue-600" },
  { wire: "from-fuchsia-500 to-purple-500", pin: "bg-fuchsia-500 ring-fuchsia-200 dark:ring-fuchsia-900/60", badge: "from-fuchsia-600 to-purple-600" },
  { wire: "from-teal-500 to-emerald-500", pin: "bg-teal-500 ring-teal-200 dark:ring-teal-900/60", badge: "from-teal-600 to-emerald-600" },
];

function RealTrainLocomotive() {
  return (
    <div className="relative shrink-0 flex flex-col items-center select-none w-36 sm:w-44 aspect-[1448/1086] -mb-1">
      {/* Real Smoke above smokestack on the front/right */}
      <div className="absolute -top-3.5 right-[19%] sm:right-[21%] flex items-center gap-1 opacity-80 pointer-events-none">
        <img
          src="https://media.dolcake.com/games/Doan-tau-tu-vung/assets/train/smoke.png"
          alt=""
          className="w-5 h-5 object-contain animate-pulse"
        />
        <img
          src="https://media.dolcake.com/games/Doan-tau-tu-vung/assets/train/smoke.png"
          alt=""
          className="w-7 h-7 object-contain -ml-2 opacity-60"
        />
      </div>

      {/* Real Locomotive PNG */}
      <img
        src="https://media.dolcake.com/games/Doan-tau-tu-vung/assets/train/locomotive.png"
        alt="Đầu máy xe lửa"
        className="w-full h-full object-contain filter drop-shadow-md"
      />

      {/* Real Locomotive Wheels matching game layout */}
      <img
        src="https://media.dolcake.com/games/Doan-tau-tu-vung/assets/train/wheel-engine.png"
        alt=""
        className="absolute bottom-[2%] left-[10%] w-[26%] aspect-square object-contain pointer-events-none"
      />
      <img
        src="https://media.dolcake.com/games/Doan-tau-tu-vung/assets/train/wheel-engine.png"
        alt=""
        className="absolute bottom-[2%] right-[17%] w-[26%] aspect-square object-contain pointer-events-none"
      />
    </div>
  );
}

function RealTrainWagonItem({
  carNumber,
  wagonImgUrl,
  badgeBg,
  pair,
  isVi,
  onClick,
}: {
  carNumber: number;
  wagonImgUrl: string;
  badgeBg: string;
  pair?: TrainCardPairItem;
  isVi: boolean;
  onClick?: () => void;
}) {
  const hasImage = Boolean(pair?.imageUrl);
  const wordText = pair?.word?.trim() || "";
  const hasWord = wordText.length > 0;
  const isPending = !hasImage && !hasWord;

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      title={isVi ? `Bấm để cuộn tới Toa #${carNumber}` : `Click to jump to Car #${carNumber}`}
      className={`group relative shrink-0 flex flex-col items-center select-none w-28 sm:w-34 aspect-[720/1086] -mb-1 transition-all duration-200 ${
        onClick ? "cursor-pointer hover:-translate-y-1" : ""
      } ${isPending ? "opacity-75 hover:opacity-100" : ""}`}
    >
      {/* Connector to next car / locomotive on the right */}
      <div
        className="absolute -right-3 bottom-[4.8%] w-5 h-3 bg-no-repeat bg-contain pointer-events-none z-0"
        style={{
          backgroundImage: `url('https://media.dolcake.com/games/Doan-tau-tu-vung/assets/train/connector.svg')`,
        }}
      />

      {/* Real Wagon PNG Background */}
      <img
        src={wagonImgUrl}
        alt={`Toa #${carNumber}`}
        className="w-full h-full object-contain filter drop-shadow-md z-10"
      />

      {/* Real Wagon Wheels */}
      <img
        src="https://media.dolcake.com/games/Doan-tau-tu-vung/assets/train/wheel-wagon.png"
        alt=""
        className="absolute bottom-[1%] left-[8%] w-[38%] aspect-square object-contain pointer-events-none z-20 group-hover:rotate-12 transition-transform duration-300"
      />
      <img
        src="https://media.dolcake.com/games/Doan-tau-tu-vung/assets/train/wheel-wagon.png"
        alt=""
        className="absolute bottom-[1%] right-[8%] w-[38%] aspect-square object-contain pointer-events-none z-20 group-hover:rotate-12 transition-transform duration-300"
      />

      {/* Picture Frame: shows real image or placeholder */}
      <div className="absolute top-[18.3%] left-[17.4%] w-[65.1%] h-[42.9%] flex items-center justify-center bg-white rounded-lg border border-slate-200/90 shadow-inner z-20 overflow-hidden">
        {hasImage ? (
          <img
            src={pair!.imageUrl}
            alt={wordText || `Toa #${carNumber}`}
            className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-1 text-slate-400">
            <ImagePlus className="w-5 h-5 text-slate-300 mb-0.5" />
            <span className="text-[9px] font-bold text-slate-400 leading-tight">
              {isVi ? "+ Thêm ảnh" : "+ Add image"}
            </span>
          </div>
        )}
      </div>

      {/* Word Slot: shows real entered word or placeholder */}
      <div
        className={`absolute left-[13%] bottom-[23%] w-[74%] h-[12%] rounded-xl flex items-center justify-center text-center px-1.5 font-black text-[10px] sm:text-[11px] z-30 transition-all ${
          hasWord
            ? "bg-gradient-to-b from-blue-600 to-blue-800 text-white border-2 border-blue-900 shadow-sm"
            : "bg-slate-100/90 dark:bg-slate-800/90 text-slate-400 dark:text-slate-500 border border-dashed border-slate-300 dark:border-slate-700"
        }`}
      >
        <span className="truncate">
          {hasWord ? wordText : isVi ? "Chưa gõ chữ" : "No word"}
        </span>
      </div>
    </div>
  );
}

const WAGON_THEMES = [
  {
    carNumber: 1,
    wagonImgUrl: "https://media.dolcake.com/games/Doan-tau-tu-vung/assets/train/wagon-yellow.png",
    badgeBg: "bg-amber-500",
  },
  {
    carNumber: 2,
    wagonImgUrl: "https://media.dolcake.com/games/Doan-tau-tu-vung/assets/train/wagon-teal.png",
    badgeBg: "bg-teal-500",
  },
  {
    carNumber: 3,
    wagonImgUrl: "https://media.dolcake.com/games/Doan-tau-tu-vung/assets/train/wagon-coral.png",
    badgeBg: "bg-rose-500",
  },
  {
    carNumber: 4,
    wagonImgUrl: "https://media.dolcake.com/games/Doan-tau-tu-vung/assets/train/wagon-purple.png",
    badgeBg: "bg-purple-500",
  },
];

function TrainVisualGuide({
  pairs = [],
  currentRoundTitle,
  isVi,
  onSelectPairIndex,
}: {
  pairs?: TrainCardPairItem[];
  currentRoundTitle?: string;
  isVi: boolean;
  onSelectPairIndex?: (index: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-sky-100 dark:border-slate-800 bg-sky-50/20 dark:bg-slate-900/30 p-3 sm:p-4 space-y-2">
      {/* Subtle compact header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <GameDemoVideoButton
          gameId="train-vocab"
          titleVi="Nối Đoàn Tàu"
          titleEn="Vocabulary Train"
          badgeVi="Đoàn Tàu"
          badgeEn="Train"
          badgeBg="bg-amber-500 text-white"
          videoId="Tb2nH6nprXk"
        />
        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 hidden sm:inline">
          {isVi
            ? "💡 Nhập ảnh & chữ ở các ô bên dưới sẽ tự động hiển thị lên từng toa tàu. Hệ thống sẽ tự động xáo trộn vị trí ngẫu nhiên."
            : "💡 Cards entered below automatically appear on the train cars. The system will automatically shuffle positions randomly."}
        </span>
      </div>

      {/* Train Cars Row - Pure Train, No background image, No rails */}
      <div className="overflow-x-auto py-2 scrollbar-thin">
        <div className="inline-flex items-end justify-center min-w-full px-2 gap-3 sm:gap-4">
          {WAGON_THEMES.map((theme, index) => (
            <RealTrainWagonItem
              key={theme.carNumber}
              carNumber={theme.carNumber}
              wagonImgUrl={theme.wagonImgUrl}
              badgeBg={theme.badgeBg}
              pair={pairs[index]}
              isVi={isVi}
              onClick={() => onSelectPairIndex?.(index)}
            />
          ))}

          {/* Locomotive at the front (right side) */}
          <RealTrainLocomotive />
        </div>
      </div>
    </div>
  );
}

function CutRopeHangingCardItem({
  index,
  pair,
  isVi,
  onClick,
}: {
  index: number;
  pair?: TrainCardPairItem;
  isVi: boolean;
  onClick?: () => void;
}) {
  const hasImage = Boolean(pair?.imageUrl);
  const wordText = pair?.word?.trim() || "";
  const hasWord = wordText.length > 0;
  const isPending = !hasImage && !hasWord;

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      title={isVi ? `Bấm để cuộn tới Cặp #${index + 1}` : `Click to jump to Card #${index + 1}`}
      className={`group relative shrink-0 flex flex-col items-center w-28 sm:w-32 transition-all duration-200 ${
        onClick ? "cursor-pointer hover:-translate-y-1" : ""
      } ${isPending ? "opacity-75 hover:opacity-100" : ""}`}
      style={{
        animation: `ropeSway ${3.2 + (index % 3) * 0.5}s ease-in-out infinite alternate`,
        animationDelay: `${(index * 0.35) % 2}s`,
        transformOrigin: "50% 0%",
      }}
    >
      {/* Frame Container with exact 320 / 594 ratio */}
      <div className="relative w-full aspect-[320/594]">
        {/* Real Hanging Rope & Frame PNG */}
        <img
          src="https://media.dolcake.com/games/magic_tree_matching_game_v3/assets/cards/card-frame-hanging.png"
          alt={`Thẻ treo #${index + 1}`}
          className="w-full h-full object-fill filter drop-shadow-md z-10 pointer-events-none"
        />

        {/* Picture inside Frame: exact coordinates from game CSS (left: 14%, top: 57%, width: 72%, height: 38%) */}
        <div className="absolute left-[14%] top-[57%] w-[72%] h-[38%] rounded-lg overflow-hidden flex items-center justify-center bg-white/95 border border-amber-900/20 shadow-inner z-20">
          {hasImage ? (
            <img
              src={pair!.imageUrl}
              alt={wordText || `Thẻ #${index + 1}`}
              className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-1 text-slate-400">
              <ImagePlus className="w-5 h-5 text-amber-700/40 mb-0.5" />
              <span className="text-[9px] font-bold text-amber-800/60 leading-tight">
                {isVi ? "+ Thêm ảnh" : "+ Add image"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Word Plaque directly under the frame */}
      <div className="relative -mt-2.5 z-30 w-[108%] flex items-center justify-center">
        <img
          src="https://media.dolcake.com/games/magic_tree_matching_game_v3/assets/answer/answer-plaque.png"
          alt=""
          className="w-full object-contain filter drop-shadow-md pointer-events-none"
        />
        <span className="absolute inset-0 flex items-center justify-center px-2 text-[10px] sm:text-[11px] font-black text-white truncate filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          {hasWord ? wordText : isVi ? "Chưa gõ chữ" : "No word"}
        </span>
      </div>
    </div>
  );
}

function CutRopeVisualGuide({
  pairs = [],
  currentRoundTitle,
  isVi,
  onSelectPairIndex,
}: {
  pairs?: TrainCardPairItem[];
  currentRoundTitle?: string;
  isVi: boolean;
  onSelectPairIndex?: (index: number) => void;
}) {
  const displayPairs = pairs.length > 0 ? pairs : [{ id: "placeholder" }];

  return (
    <div className="rounded-2xl border border-emerald-200/80 dark:border-slate-800 bg-emerald-50/20 dark:bg-slate-900/30 p-3 sm:p-4 space-y-3">
      <style>{`
        @keyframes ropeSway {
          0% { transform: rotate(-1.6deg); }
          100% { transform: rotate(1.6deg); }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <GameDemoVideoButton
          gameId="cut-rope-image-text"
          titleVi="Cắt Dây Ảnh - Chữ"
          titleEn="Cut Rope Picture - Word"
          badgeVi="Cắt Dây"
          badgeEn="Cut Rope"
          badgeBg="bg-rose-500 text-white"
          videoId="Dsb7Rm9Je4Y"
        />
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 hidden md:inline">
            {isVi
              ? "💡 Thẻ treo tự động cập nhật theo các ô bạn nhập bên dưới. Hệ thống sẽ tự động xáo trộn vị trí ngẫu nhiên."
              : "💡 Hanging cards automatically sync with your inputs below. The system will automatically shuffle positions randomly."}
          </span>
          <img
            src="https://media.dolcake.com/games/magic_tree_matching_game_v3/assets/mascot/mascot-squirrel.png"
            alt=""
            className="w-7 h-7 object-contain hidden sm:inline-block filter drop-shadow-xs"
          />
        </div>
      </div>

      {/* Hanging cards */}
      <div className="overflow-x-auto py-2 scrollbar-thin">
        <div className="inline-flex items-start justify-center min-w-full px-2 gap-3 sm:gap-4 select-none">
          {displayPairs.map((pair, index) => (
            <CutRopeHangingCardItem
              key={pair.id || index}
              index={index}
              pair={pair}
              isVi={isVi}
              onClick={() => onSelectPairIndex?.(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function MatchVisualGuide({
  pairs = [],
  currentRoundTitle,
  isVi,
  onSelectPairIndex,
}: {
  pairs?: TrainCardPairItem[];
  currentRoundTitle?: string;
  isVi: boolean;
  onSelectPairIndex?: (index: number) => void;
}) {
  const displayPairs = pairs.length > 0 ? pairs : [{ id: "placeholder" }];

  return (
    <div className="rounded-2xl border border-orange-200/80 dark:border-slate-800 bg-orange-50/20 dark:bg-slate-900/30 p-3 sm:p-4 space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <GameDemoVideoButton
          gameId="image-text"
          titleVi="Nối Cặp Ảnh - Chữ"
          titleEn="Match Picture - Word"
          badgeVi="Ảnh - Chữ"
          badgeEn="Pic - Word"
          badgeBg="bg-orange-500 text-white"
          videoId="pe7grSyHL0g"
        />
        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 hidden md:inline">
          {isVi
            ? "💡 Học sinh ghép thẻ Chữ vào thẻ Ảnh tương ứng. Hệ thống sẽ tự động xáo trộn vị trí ngẫu nhiên."
            : "💡 Students match Word cards to matching Picture cards. The system will automatically shuffle positions randomly."}
        </span>
      </div>

      {/* Row of Paired Cards */}
      <div className="overflow-x-auto py-2 scrollbar-thin">
        <div className="inline-flex items-center justify-center min-w-full px-2 gap-4 sm:gap-6 select-none">
          {displayPairs.map((pair, index) => {
            const hasImage = Boolean(pair?.imageUrl);
            const wordText = pair?.word?.trim() || "";
            const hasWord = wordText.length > 0;
            const isPending = !hasImage && !hasWord;

            return (
              <div
                key={pair.id || index}
                onClick={() => onSelectPairIndex?.(index)}
                role={onSelectPairIndex ? "button" : undefined}
                title={isVi ? `Bấm để cuộn tới Cặp #${index + 1}` : `Click to jump to Pair #${index + 1}`}
                className={`group relative shrink-0 flex items-center p-2 rounded-2xl bg-white dark:bg-slate-800/90 border-2 border-amber-200/80 dark:border-slate-700 shadow-sm transition-all duration-200 ${
                  onSelectPairIndex ? "cursor-pointer hover:-translate-y-1 hover:border-amber-400 hover:shadow-md" : ""
                } ${isPending ? "opacity-75 hover:opacity-100" : ""}`}
              >
                {/* Left: Picture Card */}
                <div className="w-20 sm:w-24 aspect-square rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center p-1.5 shadow-inner">
                  {hasImage ? (
                    <img
                      src={pair!.imageUrl}
                      alt={wordText || `Cặp #${index + 1}`}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-1 text-slate-400">
                      <ImagePlus className="w-5 h-5 text-amber-500/50 mb-0.5" />
                      <span className="text-[9px] font-bold text-amber-700/60 leading-tight">
                        {isVi ? "+ Thêm ảnh" : "+ Add image"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Middle: Connection joint */}
                <div className="px-1.5 flex flex-col items-center justify-center">
                  <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs font-black shadow-2xs group-hover:scale-110 transition-transform">
                    🔗
                  </span>
                </div>

                {/* Right: Word Card */}
                <div
                  className={`w-20 sm:w-24 h-16 sm:h-20 rounded-xl flex items-center justify-center text-center p-2 font-black text-xs sm:text-sm transition-all shadow-sm ${
                    hasWord
                      ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/20"
                      : "bg-slate-100 dark:bg-slate-900/60 text-slate-400 dark:text-slate-500 border border-dashed border-slate-300 dark:border-slate-700"
                  }`}
                >
                  <span className="break-words line-clamp-2">
                    {hasWord ? wordText : isVi ? "Chưa gõ chữ" : "No word"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LineMatchVisualGuide({
  pairs = [],
  currentRoundTitle,
  isVi,
  onSelectPairIndex,
}: {
  pairs?: TrainCardPairItem[];
  currentRoundTitle?: string;
  isVi: boolean;
  onSelectPairIndex?: (index: number) => void;
}) {
  const displayPairs = pairs.length > 0 ? pairs : [{ id: "placeholder" }];

  return (
    <div className="rounded-2xl border border-violet-200/80 dark:border-slate-800 bg-violet-50/20 dark:bg-slate-900/40 p-3 sm:p-4 space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <GameDemoVideoButton
          gameId="line-image-text"
          titleVi="Nối Dây Ảnh - Chữ"
          titleEn="Line Match Picture - Word"
          badgeVi="Nối Dây"
          badgeEn="Line Match"
          badgeBg="bg-violet-500 text-white"
          videoId="qkE6qYZ-DDU"
        />
        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 hidden md:inline">
          {isVi
            ? "💡 Học sinh kéo dây nối giữa Thẻ Ảnh (hàng trên) và Thẻ Chữ (hàng dưới). Hệ thống sẽ tự động xáo trộn vị trí ngẫu nhiên."
            : "💡 Students draw a line connecting Picture (top) to Word (bottom). The system will automatically shuffle positions randomly."}
        </span>
      </div>

      {/* 2-Row Line Match Board */}
      <div className="overflow-x-auto py-2 scrollbar-thin">
        <div className="inline-flex items-center justify-center min-w-full px-2 gap-4 sm:gap-6 select-none">
          {displayPairs.map((pair, index) => {
            const hasImage = Boolean(pair?.imageUrl);
            const wordText = pair?.word?.trim() || "";
            const hasWord = wordText.length > 0;
            const isPending = !hasImage && !hasWord;
            const palette = LINE_PALETTES[index % LINE_PALETTES.length];

            return (
              <div
                key={pair.id || index}
                onClick={() => onSelectPairIndex?.(index)}
                role={onSelectPairIndex ? "button" : undefined}
                title={isVi ? `Bấm để cuộn tới Cặp #${index + 1}` : `Click to jump to Pair #${index + 1}`}
                className={`group relative shrink-0 flex flex-col items-center w-24 sm:w-28 transition-all duration-200 ${
                  onSelectPairIndex ? "cursor-pointer hover:-translate-y-1" : ""
                } ${isPending ? "opacity-75 hover:opacity-100" : ""}`}
              >
                {/* Top Row: Picture Card */}
                <div className="w-full aspect-square rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center p-1.5 shadow-sm group-hover:border-violet-400 transition-colors">
                  {hasImage ? (
                    <img
                      src={pair!.imageUrl}
                      alt={wordText || `Ảnh #${index + 1}`}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-1 text-slate-400">
                      <ImagePlus className="w-5 h-5 text-violet-400/60 mb-0.5" />
                      <span className="text-[8px] font-bold text-violet-600/70 leading-tight">
                        {isVi ? "+ Thêm ảnh" : "+ Add image"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Connecting Wire Section */}
                <div className="relative w-full h-9 flex flex-col items-center justify-between py-0.5">
                  <span className={`w-2.5 h-2.5 rounded-full ring-2 ${palette.pin}`} />
                  <div className={`w-0.5 flex-1 bg-gradient-to-b ${palette.wire} rounded-full`} />
                  <span className={`w-2.5 h-2.5 rounded-full ring-2 ${palette.pin}`} />
                </div>

                {/* Bottom Row: Word Plaque */}
                <div
                  className={`w-full min-h-[38px] px-2 py-1.5 rounded-xl flex items-center justify-center text-center font-black text-xs transition-all shadow-sm ${
                    hasWord
                      ? `bg-gradient-to-r ${palette.badge} text-white`
                      : "bg-slate-100 dark:bg-slate-800 text-slate-400 border border-dashed border-slate-300 dark:border-slate-700"
                  }`}
                >
                  <span className="break-words line-clamp-2">
                    {hasWord ? wordText : isVi ? "Chưa gõ chữ" : "No word"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MatchImageImageVisualGuide({
  pairs = [],
  currentRoundTitle,
  isVi,
  onSelectPairIndex,
}: {
  pairs?: ImageImageCardPairItem[];
  currentRoundTitle?: string;
  isVi: boolean;
  onSelectPairIndex?: (index: number) => void;
}) {
  const displayPairs = pairs.length > 0 ? pairs : [{ id: "placeholder" }];

  return (
    <div className="rounded-2xl border border-emerald-200/80 dark:border-slate-800 bg-emerald-50/20 dark:bg-slate-900/30 p-3 sm:p-4 space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <GameDemoVideoButton
          gameId="image-image"
          titleVi="Nối Cặp Ảnh - Ảnh"
          titleEn="Match Picture - Picture"
          badgeVi="Ảnh - Ảnh"
          badgeEn="Pic - Pic"
          badgeBg="bg-emerald-500 text-white"
          videoId="XSLnexaHxHM"
        />
        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 hidden md:inline">
          {isVi
            ? "💡 Học sinh ghép đôi 2 hình ảnh tương đồng hoặc có mối liên quan. Hệ thống sẽ tự động xáo trộn vị trí ngẫu nhiên."
            : "💡 Students match 2 related pictures together. The system will automatically shuffle positions randomly."}
        </span>
      </div>

      {/* Row of Dual-Image Pairs */}
      <div className="overflow-x-auto py-2 scrollbar-thin">
        <div className="inline-flex items-center justify-center min-w-full px-2 gap-4 sm:gap-6 select-none">
          {displayPairs.map((pair, index) => {
            const hasA = Boolean(pair?.imageAUrl);
            const hasB = Boolean(pair?.imageBUrl);
            const isPending = !hasA && !hasB;

            return (
              <div
                key={pair.id || index}
                onClick={() => onSelectPairIndex?.(index)}
                role={onSelectPairIndex ? "button" : undefined}
                title={isVi ? `Bấm để cuộn tới Cặp #${index + 1}` : `Click to jump to Pair #${index + 1}`}
                className={`group relative shrink-0 flex items-center p-2 rounded-2xl bg-white dark:bg-slate-800/90 border-2 border-emerald-200/80 dark:border-slate-700 shadow-sm transition-all duration-200 ${
                  onSelectPairIndex ? "cursor-pointer hover:-translate-y-1 hover:border-emerald-400 hover:shadow-md" : ""
                } ${isPending ? "opacity-75 hover:opacity-100" : ""}`}
              >
                {/* Left: Image A */}
                <div className="w-18 sm:w-22 aspect-square rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center p-1 shadow-inner">
                  {hasA ? (
                    <img
                      src={pair!.imageAUrl}
                      alt={pair?.labelA || `Ảnh A #${index + 1}`}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-1 text-slate-400">
                      <ImagePlus className="w-4 h-4 text-emerald-500/50 mb-0.5" />
                      <span className="text-[8px] font-bold text-emerald-700/70 leading-tight">
                        {isVi ? "+ Ảnh 1" : "+ Image 1"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Connector */}
                <div className="px-1.5 flex flex-col items-center justify-center">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-black shadow-2xs group-hover:scale-110 transition-transform">
                    🔗
                  </span>
                </div>

                {/* Right: Image B */}
                <div className="w-18 sm:w-22 aspect-square rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center p-1 shadow-inner">
                  {hasB ? (
                    <img
                      src={pair!.imageBUrl}
                      alt={pair?.labelB || `Ảnh B #${index + 1}`}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-1 text-slate-400">
                      <ImagePlus className="w-4 h-4 text-teal-500/50 mb-0.5" />
                      <span className="text-[8px] font-bold text-teal-700/70 leading-tight">
                        {isVi ? "+ Ảnh 2" : "+ Image 2"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LineImageImageVisualGuide({
  pairs = [],
  currentRoundTitle,
  isVi,
  onSelectPairIndex,
}: {
  pairs?: ImageImageCardPairItem[];
  currentRoundTitle?: string;
  isVi: boolean;
  onSelectPairIndex?: (index: number) => void;
}) {
  const displayPairs = pairs.length > 0 ? pairs : [{ id: "placeholder" }];

  return (
    <div className="rounded-2xl border border-violet-200/80 dark:border-slate-800 bg-violet-50/20 dark:bg-slate-900/40 p-3 sm:p-4 space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <GameDemoVideoButton
          gameId="line-image-image"
          titleVi="Nối Dây Ảnh - Ảnh"
          titleEn="Line Match Picture - Picture"
          badgeVi="Nối Dây"
          badgeEn="Line Match"
          badgeBg="bg-violet-500 text-white"
          videoId="wO2Q6tGhfLM"
        />
        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 hidden md:inline">
          {isVi
            ? "💡 Học sinh kéo dây nối giữa 2 hàng hình ảnh tương ứng. Hệ thống sẽ tự động xáo trộn vị trí ngẫu nhiên."
            : "💡 Students draw a line connecting matching pictures in 2 rows. The system will automatically shuffle positions randomly."}
        </span>
      </div>

      {/* 2-Row Line Match Board */}
      <div className="overflow-x-auto py-2 scrollbar-thin">
        <div className="inline-flex items-center justify-center min-w-full px-2 gap-4 sm:gap-6 select-none">
          {displayPairs.map((pair, index) => {
            const hasA = Boolean(pair?.imageAUrl);
            const hasB = Boolean(pair?.imageBUrl);
            const isPending = !hasA && !hasB;
            const palette = LINE_PALETTES[index % LINE_PALETTES.length];

            return (
              <div
                key={pair.id || index}
                onClick={() => onSelectPairIndex?.(index)}
                role={onSelectPairIndex ? "button" : undefined}
                title={isVi ? `Bấm để cuộn tới Cặp #${index + 1}` : `Click to jump to Pair #${index + 1}`}
                className={`group relative shrink-0 flex flex-col items-center w-22 sm:w-26 transition-all duration-200 ${
                  onSelectPairIndex ? "cursor-pointer hover:-translate-y-1" : ""
                } ${isPending ? "opacity-75 hover:opacity-100" : ""}`}
              >
                {/* Top Row: Image A */}
                <div className="w-full aspect-square rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center p-1 shadow-sm group-hover:border-violet-400 transition-colors">
                  {hasA ? (
                    <img
                      src={pair!.imageAUrl}
                      alt={pair?.labelA || `Ảnh 1 #${index + 1}`}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-1 text-slate-400">
                      <ImagePlus className="w-4 h-4 text-violet-400/60 mb-0.5" />
                      <span className="text-[8px] font-bold text-violet-600/70 leading-tight">
                        {isVi ? "+ Ảnh 1" : "+ Image 1"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Connecting Wire */}
                <div className="relative w-full h-8 flex flex-col items-center justify-between py-0.5">
                  <span className={`w-2.5 h-2.5 rounded-full ring-2 ${palette.pin}`} />
                  <div className={`w-0.5 flex-1 bg-gradient-to-b ${palette.wire} rounded-full`} />
                  <span className={`w-2.5 h-2.5 rounded-full ring-2 ${palette.pin}`} />
                </div>

                {/* Bottom Row: Image B */}
                <div className="w-full aspect-square rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center p-1 shadow-sm group-hover:border-violet-400 transition-colors">
                  {hasB ? (
                    <img
                      src={pair!.imageBUrl}
                      alt={pair?.labelB || `Ảnh 2 #${index + 1}`}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-1 text-slate-400">
                      <ImagePlus className="w-4 h-4 text-indigo-400/60 mb-0.5" />
                      <span className="text-[8px] font-bold text-indigo-600/70 leading-tight">
                        {isVi ? "+ Ảnh 2" : "+ Image 2"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ConveyorDropVisualGuide({
  pairs = [],
  currentRoundTitle,
  isVi,
  onSelectPairIndex,
}: {
  pairs?: TrainCardPairItem[];
  currentRoundTitle?: string;
  isVi: boolean;
  onSelectPairIndex?: (index: number) => void;
}) {
  const displayPairs = pairs.length > 0 ? pairs : [{ id: "placeholder" }];

  return (
    <div className="rounded-2xl border border-cyan-200/80 dark:border-slate-800 bg-cyan-50/20 dark:bg-slate-900/40 p-3 sm:p-4 space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <GameDemoVideoButton
          gameId="conveyor-drop"
          titleVi="Băng Chuyền Thả Khối"
          titleEn="Conveyor Drop"
          badgeVi="Băng Chuyền"
          badgeEn="Conveyor"
          badgeBg="bg-cyan-500 text-white"
          videoId="JTMQ83gi9wo"
        />
        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 hidden md:inline">
          {isVi
            ? "💡 Thùng hàng mang ảnh di chuyển trên băng chuyền và thả vào ống hút từ vựng tương ứng. Hệ thống sẽ tự động xáo trộn vị trí ngẫu nhiên."
            : "💡 Crates carry pictures on the belt and drop into matching word tubes. The system will automatically shuffle positions randomly."}
        </span>
      </div>

      {/* Conveyor Belt & Drop Mechanism */}
      <div className="overflow-x-auto py-2 scrollbar-thin">
        <div className="inline-flex flex-col items-center justify-center min-w-full px-2 select-none">
          {/* Top Row: Cargo Crates riding on the belt */}
          <div className="inline-flex items-end justify-center gap-4 sm:gap-6 z-10 -mb-1">
            {displayPairs.map((pair, index) => {
              const hasImage = Boolean(pair?.imageUrl);
              const wordText = pair?.word?.trim() || "";
              const isPending = !hasImage && !wordText;

              return (
                <div
                  key={pair.id || index}
                  onClick={() => onSelectPairIndex?.(index)}
                  role={onSelectPairIndex ? "button" : undefined}
                  title={isVi ? `Bấm để cuộn tới Cặp #${index + 1}` : `Click to jump to Pair #${index + 1}`}
                  className={`group relative shrink-0 flex flex-col items-center w-24 sm:w-28 transition-all duration-200 ${
                    onSelectPairIndex ? "cursor-pointer hover:-translate-y-1" : ""
                  } ${isPending ? "opacity-75 hover:opacity-100" : ""}`}
                >
                  {/* Cargo Crate Container */}
                  <div className="relative w-full aspect-square rounded-2xl bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 border-2 border-amber-400/90 shadow-md p-1.5 flex flex-col items-center justify-center">
                    {/* Corner Rivets */}
                    <span className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-amber-200/80 shadow-2xs" />
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-200/80 shadow-2xs" />
                    <span className="absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full bg-amber-200/80 shadow-2xs" />
                    <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-200/80 shadow-2xs" />

                    {/* Picture Display inside Crate */}
                    <div className="w-full h-full rounded-xl bg-white dark:bg-slate-900 overflow-hidden flex items-center justify-center p-1 border border-amber-800/40 shadow-inner">
                      {hasImage ? (
                        <img
                          src={pair!.imageUrl}
                          alt={wordText || `Khối #${index + 1}`}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-1 text-slate-400">
                          <ImagePlus className="w-4 h-4 text-amber-500 mb-0.5" />
                          <span className="text-[8px] font-bold text-amber-700/80 leading-tight">
                            {isVi ? "+ Thêm ảnh" : "+ Add image"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Conveyor Belt Beam */}
          <div className="relative w-full min-w-[280px] h-3.5 rounded-md bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 border-y-2 border-slate-600 shadow-md flex items-center justify-between px-2 pointer-events-none z-20">
            <div className="w-full h-1 bg-[repeating-linear-gradient(90deg,#0ea5e9,#0ea5e9_6px,#0284c7_6px,#0284c7_12px)] opacity-60" />
          </div>

          {/* Middle: Drop Arrows & Connecting Flow */}
          <div className="inline-flex items-center justify-center gap-4 sm:gap-6 py-1">
            {displayPairs.map((pair, index) => (
              <div key={pair.id || index} className="w-24 sm:w-28 flex flex-col items-center justify-center text-cyan-500">
                <span className="text-xs font-black animate-bounce leading-none">↓</span>
              </div>
            ))}
          </div>

          {/* Bottom Row: Futuristic Suction Tubes with Words */}
          <div className="inline-flex items-start justify-center gap-4 sm:gap-6 z-10">
            {displayPairs.map((pair, index) => {
              const wordText = pair?.word?.trim() || "";
              const hasWord = wordText.length > 0;

              return (
                <div
                  key={pair.id || index}
                  onClick={() => onSelectPairIndex?.(index)}
                  role={onSelectPairIndex ? "button" : undefined}
                  title={isVi ? `Bấm để cuộn tới Cặp #${index + 1}` : `Click to jump to Pair #${index + 1}`}
                  className={`group relative shrink-0 flex flex-col items-center w-24 sm:w-28 transition-all duration-200 ${
                    onSelectPairIndex ? "cursor-pointer hover:scale-105" : ""
                  }`}
                >
                  {/* Suction Pipe Collar */}
                  <div className="w-16 h-2 bg-gradient-to-r from-slate-600 via-cyan-600 to-slate-600 rounded-t-sm shadow-xs -mb-0.5" />

                  {/* Word Tube Screen */}
                  <div
                    className={`w-full min-h-[42px] px-2 py-1.5 rounded-2xl flex items-center justify-center text-center font-black text-xs sm:text-sm border-2 transition-all shadow-md ${
                      hasWord
                        ? "bg-slate-900 border-cyan-400 text-cyan-300 shadow-cyan-500/20"
                        : "bg-slate-900/60 border-slate-700 text-slate-500 border-dashed"
                    }`}
                  >
                    <span className="break-words line-clamp-2">
                      {hasWord ? wordText : isVi ? "Chưa gõ chữ" : "No word"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function MatchTextTextVisualGuide({
  pairs = [],
  isVi,
  onSelectPairIndex,
}: {
  pairs?: TextTextCardPairItem[];
  isVi: boolean;
  onSelectPairIndex?: (index: number) => void;
}) {
  const displayPairs = pairs.length > 0 ? pairs : [{ id: "placeholder" }];

  return (
    <div className="rounded-2xl border border-sky-200/80 dark:border-slate-800 bg-sky-50/20 dark:bg-slate-900/30 p-3 sm:p-4 space-y-3">
      {/* Header (no demo video button for text-text yet, right-aligned hint) */}
      <div className="flex items-center justify-end px-1">
        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 hidden md:inline">
          {isVi
            ? "💡 Học sinh ghép cặp Vế A với Vế B tương ứng. Hệ thống sẽ tự động xáo trộn vị trí ngẫu nhiên."
            : "💡 Students match Side A with its corresponding Side B. The system will automatically shuffle positions randomly."}
        </span>
      </div>

      {/* Row of Dual-Text Pairs */}
      <div className="overflow-x-auto py-2 scrollbar-thin">
        <div className="inline-flex items-center justify-center min-w-full px-2 gap-4 sm:gap-5 select-none">
          {displayPairs.map((pair, index) => {
            const textA = pair?.wordA?.trim() || "";
            const textB = pair?.labelB?.trim() || "";
            const hasA = textA.length > 0;
            const hasB = textB.length > 0;
            const isPending = !hasA && !hasB;

            return (
              <div
                key={pair.id || index}
                onClick={() => onSelectPairIndex?.(index)}
                role={onSelectPairIndex ? "button" : undefined}
                title={isVi ? `Bấm để cuộn tới Cặp #${index + 1}` : `Click to jump to Pair #${index + 1}`}
                className={`group relative shrink-0 flex items-center p-2 rounded-2xl bg-white dark:bg-slate-800/90 border-2 border-sky-200/80 dark:border-slate-700 shadow-sm transition-all duration-200 ${
                  onSelectPairIndex ? "cursor-pointer hover:-translate-y-1 hover:border-sky-400 hover:shadow-md" : ""
                } ${isPending ? "opacity-75 hover:opacity-100" : ""}`}
              >
                {/* Left: Side A */}
                <div
                  className={`w-24 sm:w-28 min-h-[56px] rounded-xl flex items-center justify-center text-center p-2 font-black text-xs transition-all shadow-xs ${
                    hasA
                      ? "bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-sky-500/20"
                      : "bg-slate-100 dark:bg-slate-900/60 text-slate-400 dark:text-slate-500 border border-dashed border-slate-300 dark:border-slate-700"
                  }`}
                >
                  <span className="break-words line-clamp-2">
                    {hasA ? textA : isVi ? "Chưa gõ Vế A" : "No Side A"}
                  </span>
                </div>

                {/* Middle: Link */}
                <div className="px-1.5 flex flex-col items-center justify-center">
                  <span className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 flex items-center justify-center text-xs font-black shadow-2xs group-hover:scale-110 transition-transform">
                    🔗
                  </span>
                </div>

                {/* Right: Side B */}
                <div
                  className={`w-24 sm:w-28 min-h-[56px] rounded-xl flex items-center justify-center text-center p-2 font-black text-xs transition-all shadow-xs ${
                    hasB
                      ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-indigo-500/20"
                      : "bg-slate-100 dark:bg-slate-900/60 text-slate-400 dark:text-slate-500 border border-dashed border-slate-300 dark:border-slate-700"
                  }`}
                >
                  <span className="break-words line-clamp-2">
                    {hasB ? textB : isVi ? "Chưa gõ Vế B" : "No Side B"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FlipImageImageVisualGuide({
  pairs = [],
  isVi,
  onSelectPairIndex,
}: {
  pairs?: ImageImageCardPairItem[];
  isVi: boolean;
  onSelectPairIndex?: (index: number) => void;
}) {
  const displayPairs = pairs.length > 0 ? pairs : [{ id: "placeholder" }];

  return (
    <div className="rounded-2xl border border-rose-200/80 dark:border-slate-800 bg-rose-50/20 dark:bg-slate-900/30 p-3 sm:p-4 space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <GameDemoVideoButton
          gameId="flip-image-image"
          titleVi="Lật Ảnh - Ảnh"
          titleEn="Flip Picture - Picture"
          badgeVi="Lật Ảnh - Ảnh"
          badgeEn="Flip Pic - Pic"
          badgeBg="bg-emerald-500 text-white"
          videoId="ZgE2PaGdvFU"
        />
        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 hidden md:inline">
          {isVi
            ? "💡 Học sinh lật úp/mở để tìm cặp 2 hình ảnh giống hoặc liên quan nhau. Hệ thống sẽ tự động xáo trộn vị trí ngẫu nhiên."
            : "💡 Students flip cards to find matching picture pairs. The system will automatically shuffle positions randomly."}
        </span>
      </div>

      {/* Row of Flip Card Pairs */}
      <div className="overflow-x-auto py-2 scrollbar-thin">
        <div className="inline-flex items-center justify-center min-w-full px-2 gap-4 sm:gap-6 select-none">
          {displayPairs.map((pair, index) => {
            const hasA = Boolean(pair?.imageAUrl);
            const hasB = Boolean(pair?.imageBUrl);
            const isPending = !hasA && !hasB;

            return (
              <div
                key={pair.id || index}
                onClick={() => onSelectPairIndex?.(index)}
                role={onSelectPairIndex ? "button" : undefined}
                title={isVi ? `Bấm để cuộn tới Cặp #${index + 1}` : `Click to jump to Pair #${index + 1}`}
                className={`group relative shrink-0 flex items-center p-2 rounded-2xl bg-white dark:bg-slate-800/90 border-2 border-rose-200/80 dark:border-slate-700 shadow-sm transition-all duration-200 ${
                  onSelectPairIndex ? "cursor-pointer hover:-translate-y-1 hover:border-rose-400 hover:shadow-md" : ""
                } ${isPending ? "opacity-75 hover:opacity-100" : ""}`}
              >
                {/* Card A */}
                <div className="relative w-18 sm:w-22 aspect-square rounded-xl bg-gradient-to-br from-rose-50 to-white dark:from-slate-900 dark:to-slate-800 border-2 border-rose-300/80 dark:border-rose-800/70 overflow-hidden flex items-center justify-center p-1 shadow-sm">
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500/90 text-white text-[9px] font-black flex items-center justify-center shadow-2xs">
                    ?
                  </span>
                  {hasA ? (
                    <img
                      src={pair!.imageAUrl}
                      alt={pair?.labelA || `Ảnh 1 #${index + 1}`}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-1 text-slate-400">
                      <ImagePlus className="w-4 h-4 text-rose-400/70 mb-0.5" />
                      <span className="text-[8px] font-bold text-rose-600/70 leading-tight">
                        {isVi ? "+ Ảnh 1" : "+ Image 1"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Flip Icon */}
                <div className="px-1.5 flex flex-col items-center justify-center">
                  <span className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center text-xs font-black shadow-2xs group-hover:rotate-180 transition-transform duration-300">
                    🔄
                  </span>
                </div>

                {/* Card B */}
                <div className="relative w-18 sm:w-22 aspect-square rounded-xl bg-gradient-to-br from-pink-50 to-white dark:from-slate-900 dark:to-slate-800 border-2 border-pink-300/80 dark:border-pink-800/70 overflow-hidden flex items-center justify-center p-1 shadow-sm">
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-pink-500/90 text-white text-[9px] font-black flex items-center justify-center shadow-2xs">
                    ?
                  </span>
                  {hasB ? (
                    <img
                      src={pair!.imageBUrl}
                      alt={pair?.labelB || `Ảnh 2 #${index + 1}`}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-1 text-slate-400">
                      <ImagePlus className="w-4 h-4 text-pink-400/70 mb-0.5" />
                      <span className="text-[8px] font-bold text-pink-600/70 leading-tight">
                        {isVi ? "+ Ảnh 2" : "+ Image 2"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FlipImageTextVisualGuide({
  pairs = [],
  isVi,
  onSelectPairIndex,
}: {
  pairs?: TrainCardPairItem[];
  isVi: boolean;
  onSelectPairIndex?: (index: number) => void;
}) {
  const displayPairs = pairs.length > 0 ? pairs : [{ id: "placeholder" }];

  return (
    <div className="rounded-2xl border border-orange-200/80 dark:border-slate-800 bg-orange-50/20 dark:bg-slate-900/30 p-3 sm:p-4 space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <GameDemoVideoButton
          gameId="flip-image-text"
          titleVi="Lật Ảnh - Chữ"
          titleEn="Flip Picture - Word"
          badgeVi="Lật Ảnh - Chữ"
          badgeEn="Flip Pic - Word"
          badgeBg="bg-orange-500 text-white"
          videoId="30Ov93AvLwY"
        />
        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 hidden md:inline">
          {isVi
            ? "💡 Học sinh lật thẻ để tìm cặp Ảnh và Chữ tương ứng. Hệ thống sẽ tự động xáo trộn vị trí ngẫu nhiên."
            : "💡 Students flip cards to match each Picture with its Word. The system will automatically shuffle positions randomly."}
        </span>
      </div>

      {/* Row of Flip Card Pairs */}
      <div className="overflow-x-auto py-2 scrollbar-thin">
        <div className="inline-flex items-center justify-center min-w-full px-2 gap-4 sm:gap-6 select-none">
          {displayPairs.map((pair, index) => {
            const hasImage = Boolean(pair?.imageUrl);
            const wordText = pair?.word?.trim() || "";
            const hasWord = wordText.length > 0;
            const isPending = !hasImage && !hasWord;

            return (
              <div
                key={pair.id || index}
                onClick={() => onSelectPairIndex?.(index)}
                role={onSelectPairIndex ? "button" : undefined}
                title={isVi ? `Bấm để cuộn tới Cặp #${index + 1}` : `Click to jump to Pair #${index + 1}`}
                className={`group relative shrink-0 flex items-center p-2 rounded-2xl bg-white dark:bg-slate-800/90 border-2 border-orange-200/80 dark:border-slate-700 shadow-sm transition-all duration-200 ${
                  onSelectPairIndex ? "cursor-pointer hover:-translate-y-1 hover:border-orange-400 hover:shadow-md" : ""
                } ${isPending ? "opacity-75 hover:opacity-100" : ""}`}
              >
                {/* Left: Picture Flip Card */}
                <div className="relative w-20 sm:w-24 aspect-square rounded-xl bg-gradient-to-br from-orange-50 to-white dark:from-slate-900 dark:to-slate-800 border-2 border-orange-300/80 dark:border-orange-800/70 overflow-hidden flex items-center justify-center p-1.5 shadow-sm">
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-orange-500/90 text-white text-[9px] font-black flex items-center justify-center shadow-2xs">
                    ?
                  </span>
                  {hasImage ? (
                    <img
                      src={pair!.imageUrl}
                      alt={wordText || `Cặp #${index + 1}`}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-1 text-slate-400">
                      <ImagePlus className="w-5 h-5 text-orange-400/60 mb-0.5" />
                      <span className="text-[9px] font-bold text-orange-700/60 leading-tight">
                        {isVi ? "+ Thêm ảnh" : "+ Add image"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Flip Icon */}
                <div className="px-1.5 flex flex-col items-center justify-center">
                  <span className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xs font-black shadow-2xs group-hover:rotate-180 transition-transform duration-300">
                    🔄
                  </span>
                </div>

                {/* Right: Word Flip Card */}
                <div
                  className={`relative w-20 sm:w-24 aspect-square rounded-xl flex items-center justify-center text-center p-2 font-black text-xs sm:text-sm transition-all shadow-sm ${
                    hasWord
                      ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-orange-500/20"
                      : "bg-slate-100 dark:bg-slate-900/60 text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-300 dark:border-slate-700"
                  }`}
                >
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-white/25 text-white text-[9px] font-black flex items-center justify-center">
                    ?
                  </span>
                  <span className="break-words line-clamp-3">
                    {hasWord ? wordText : isVi ? "Chưa gõ chữ" : "No word"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function PairVisualGuideBanner({
  gameMode = "match",
  gameType = "image-text",
  maxPairsPerRound = 7,
  pairs,
  imageImagePairs,
  textTextPairs,
  currentRoundTitle,
  onSelectPairIndex,
}: PairVisualGuideBannerProps) {
  const { locale } = useTeacherLocale();
  const isVi = locale !== "en";

  const isTrain = gameMode === "train";
  const isCutRope = gameMode === "cut-rope";
  const isConveyorDrop = gameMode === "conveyor-drop";
  const isFlip = gameMode === "flip";
  const isLine = gameMode === "line";
  const isImageImage = gameType === "image-image";
  const isTextText = gameType === "text-text";

  if (isTextText) {
    return (
      <MatchTextTextVisualGuide
        pairs={textTextPairs}
        isVi={isVi}
        onSelectPairIndex={onSelectPairIndex}
      />
    );
  }

  if (isFlip) {
    if (isImageImage) {
      return (
        <FlipImageImageVisualGuide
          pairs={imageImagePairs}
          isVi={isVi}
          onSelectPairIndex={onSelectPairIndex}
        />
      );
    }
    return (
      <FlipImageTextVisualGuide
        pairs={pairs}
        isVi={isVi}
        onSelectPairIndex={onSelectPairIndex}
      />
    );
  }

  if (isTrain) {
    return (
      <TrainVisualGuide
        pairs={pairs}
        currentRoundTitle={currentRoundTitle}
        isVi={isVi}
        onSelectPairIndex={onSelectPairIndex}
      />
    );
  }

  if (isCutRope) {
    return (
      <CutRopeVisualGuide
        pairs={pairs}
        currentRoundTitle={currentRoundTitle}
        isVi={isVi}
        onSelectPairIndex={onSelectPairIndex}
      />
    );
  }

  if (isConveyorDrop) {
    return (
      <ConveyorDropVisualGuide
        pairs={pairs}
        currentRoundTitle={currentRoundTitle}
        isVi={isVi}
        onSelectPairIndex={onSelectPairIndex}
      />
    );
  }

  if (isImageImage) {
    if (isLine) {
      return (
        <LineImageImageVisualGuide
          pairs={imageImagePairs}
          currentRoundTitle={currentRoundTitle}
          isVi={isVi}
          onSelectPairIndex={onSelectPairIndex}
        />
      );
    }
    return (
      <MatchImageImageVisualGuide
        pairs={imageImagePairs}
        currentRoundTitle={currentRoundTitle}
        isVi={isVi}
        onSelectPairIndex={onSelectPairIndex}
      />
    );
  }

  if (isLine) {
    return (
      <LineMatchVisualGuide
        pairs={pairs}
        currentRoundTitle={currentRoundTitle}
        isVi={isVi}
        onSelectPairIndex={onSelectPairIndex}
      />
    );
  }

  return (
    <MatchVisualGuide
      pairs={pairs}
      currentRoundTitle={currentRoundTitle}
      isVi={isVi}
      onSelectPairIndex={onSelectPairIndex}
    />
  );
}
