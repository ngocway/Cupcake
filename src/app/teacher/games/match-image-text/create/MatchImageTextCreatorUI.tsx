"use client";

import { useState, useRef, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Plus, 
  FileText, 
  Trash2, 
  Search, 
  Upload, 
  Volume2, 
  Save, 
  X, 
  Check, 
  Image as ImageIcon, 
  Sparkles, 
  AlertCircle,
  HelpCircle,
  Play,
  Headphones
} from "lucide-react";
import { searchImagesAction } from "@/actions/image-search-actions";
import { toast } from "sonner";

export interface CardPair {
  id: string;
  word: string;
  imageUrl?: string;
  imageFileName?: string;
  audioUrl?: string;
  audioFileName?: string;
}

const MAX_PAIRS = 15;

const INITIAL_PAIRS: CardPair[] = [
  { id: "pair-1", word: "Elephant", imageUrl: "https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=400&auto=format&fit=crop&q=60" },
  { id: "pair-2", word: "Tiger", imageUrl: "https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=400&auto=format&fit=crop&q=60" },
  { id: "pair-3", word: "Monkey", imageUrl: "https://images.unsplash.com/photo-1540573133985-778788177677?w=400&auto=format&fit=crop&q=60" },
];

export function MatchImageTextCreatorUI({ gameType }: { gameType: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("Bài tập Nối Cặp Ảnh - Chữ");
  const [subject, setSubject] = useState("english");
  const [gradeLevel, setGradeLevel] = useState("kids-2-5");
  const [description, setDescription] = useState("");
  
  const [pairs, setPairs] = useState<CardPair[]>(INITIAL_PAIRS);

  // --- Modal States ---
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteContent, setPasteContent] = useState("");

  const [showSearchModal, setShowSearchModal] = useState(false);
  const [activePairIdForSearch, setActivePairIdForSearch] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, startSearchTransition] = useTransition();

  // Hidden file input refs for dynamic triggering
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const [activePairIdForUpload, setActivePairIdForUpload] = useState<string | null>(null);

  // --- Handlers ---
  const handleAddPair = () => {
    if (pairs.length >= MAX_PAIRS) {
      toast.error(`Tối đa chỉ được tạo ${MAX_PAIRS} cặp thẻ cho mỗi game!`);
      return;
    }
    const newPair: CardPair = {
      id: `pair-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      word: "",
    };
    setPairs([...pairs, newPair]);
  };

  const handleRemovePair = (id: string) => {
    if (pairs.length <= 1) {
      toast.error("Bài tập cần ít nhất 1 cặp thẻ!");
      return;
    }
    setPairs(pairs.filter(p => p.id !== id));
  };

  const handleUpdateWord = (id: string, word: string) => {
    setPairs(pairs.map(p => p.id === id ? { ...p, word } : p));
  };

  // --- Bulk Paste Handler ---
  const handleProcessBulkPaste = () => {
    if (!pasteContent.trim()) {
      toast.error("Vui lòng dán danh sách từ vựng vào ô!");
      return;
    }

    const lines = pasteContent
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length === 0) {
      toast.error("Không tìm thấy dòng từ vựng hợp lệ nào.");
      return;
    }

    const availableSlots = MAX_PAIRS - pairs.length;
    if (availableSlots <= 0) {
      toast.error(`Đã đạt tối đa ${MAX_PAIRS} cặp thẻ! Vui lòng xóa bớt trước khi dán thêm.`);
      return;
    }

    const linesToAdd = lines.slice(0, availableSlots);
    const newPairs: CardPair[] = linesToAdd.map((line, idx) => ({
      id: `pair-bulk-${Date.now()}-${idx}`,
      word: line,
    }));

    setPairs([...pairs, ...newPairs]);
    setShowPasteModal(false);
    setPasteContent("");

    if (lines.length > availableSlots) {
      toast.warning(`Đã dán thành công ${availableSlots} từ. Bỏ qua ${lines.length - availableSlots} từ do vượt quá giới hạn 15 cặp.`);
    } else {
      toast.success(`Đã tự động tạo ${linesToAdd.length} cặp thẻ từ danh sách dán!`);
    }
  };

  // --- Internet Image Search ---
  const handleOpenSearchModal = (pair: CardPair) => {
    setActivePairIdForSearch(pair.id);
    setSearchQuery(pair.word || "");
    setSearchResults([]);
    setShowSearchModal(true);

    if (pair.word.trim()) {
      startSearchTransition(async () => {
        try {
          const results = await searchImagesAction(pair.word.trim());
          setSearchResults(results || []);
        } catch (e: any) {
          toast.error(e?.message || "Không thể tìm kiếm ảnh.");
        }
      });
    }
  };

  const handlePerformSearch = () => {
    if (!searchQuery.trim()) return;
    startSearchTransition(async () => {
      try {
        const results = await searchImagesAction(searchQuery.trim());
        setSearchResults(results || []);
      } catch (e: any) {
        toast.error(e?.message || "Lỗi tìm kiếm ảnh.");
      }
    });
  };

  const handleSelectSearchImage = (url: string) => {
    if (!activePairIdForSearch) return;
    setPairs(pairs.map(p => p.id === activePairIdForSearch ? { ...p, imageUrl: url } : p));
    setShowSearchModal(false);
    setActivePairIdForSearch(null);
    toast.success("Đã áp dụng ảnh từ Internet!");
  };

  // --- Local Upload Handlers ---
  const handleTriggerImageUpload = (pairId: string) => {
    setActivePairIdForUpload(pairId);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
      imageInputRef.current.click();
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activePairIdForUpload) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Dung lượng file ảnh tối đa là 5MB.");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPairs(pairs.map(p => p.id === activePairIdForUpload ? { 
      ...p, 
      imageUrl: previewUrl,
      imageFileName: file.name
    } : p));
    toast.success(`Đã tải lên ảnh: ${file.name}`);
  };

  const handleTriggerAudioUpload = (pairId: string) => {
    setActivePairIdForUpload(pairId);
    if (audioInputRef.current) {
      audioInputRef.current.value = "";
      audioInputRef.current.click();
    }
  };

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activePairIdForUpload) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Dung lượng file âm thanh tối đa là 10MB.");
      return;
    }

    const audioPreviewUrl = URL.createObjectURL(file);
    setPairs(pairs.map(p => p.id === activePairIdForUpload ? { 
      ...p, 
      audioUrl: audioPreviewUrl,
      audioFileName: file.name
    } : p));
    toast.success(`Đã tải âm thanh: ${file.name}`);
  };

  const handlePlayAudio = (url: string) => {
    try {
      const audio = new Audio(url);
      audio.play().catch(() => toast.error("Không thể phát file âm thanh."));
    } catch (e) {
      toast.error("Lỗi phát âm thanh.");
    }
  };

  const handleSave = () => {
    const emptyWords = pairs.filter(p => !p.word.trim());
    if (emptyWords.length > 0) {
      toast.error("Vui lòng điền đầy đủ Chữ/Từ vựng cho tất cả các cặp thẻ!");
      return;
    }

    toast.success("Đã thiết kế xong giao diện bài tập Nối Cặp!");
  };

  return (
    <div className="w-full py-6 space-y-8 animate-in fade-in duration-300">
      {/* Hidden File Inputs */}
      <input 
        type="file" 
        ref={imageInputRef} 
        onChange={handleImageFileChange} 
        accept="image/*" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={audioInputRef} 
        onChange={handleAudioFileChange} 
        accept="audio/*" 
        className="hidden" 
      />

      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-primary/10 shadow-sm">
        <div className="flex items-center gap-4">
          <Link 
            href="/teacher" 
            className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-200 transition-all hover:scale-105 shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                Nối Cặp Ảnh - Chữ
              </span>
              <span className="text-xs font-semibold text-slate-400">Thiết kế bài tập</span>
            </div>
            <h1 className="font-headline font-black text-2xl md:text-3xl text-slate-800 dark:text-white mt-1">
              Tạo Game Nối Cặp Ảnh - Chữ
            </h1>
          </div>
        </div>

        {/* Save CTA */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Lưu bài tập</span>
          </button>
        </div>
      </div>

      {/* Main Settings Card */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-3xl border border-primary/10 p-6 md:p-8 shadow-sm space-y-4">
        <h2 className="font-headline font-black text-lg text-slate-800 dark:text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <span>1. Thông tin bài tập</span>
        </h2>

        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Tên bài tập / Game <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Nhập tên bài tập (VD: Bài tập Nối Cặp Ảnh - Chữ)..."
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
          />
        </div>
      </div>

      {/* Pairs Editor Section */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-3xl border border-primary/10 p-6 md:p-8 shadow-sm space-y-6">
        {/* Editor Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="font-headline font-black text-lg text-slate-800 dark:text-white flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-purple-500" />
              <span>2. Danh sách các cặp thẻ Nối (Ảnh - Chữ)</span>
            </h2>
            <p className="text-xs font-medium text-slate-400 mt-0.5">
              Tạo từng cặp hoặc dán danh sách từ vựng từ Word/Excel. Tối đa 15 cặp.
            </p>
          </div>

          {/* Progress & Add Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Limit Progress Counter */}
            <div className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center gap-2 border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-extrabold text-slate-600 dark:text-slate-300">Tiến độ:</span>
              <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                pairs.length >= MAX_PAIRS ? "bg-rose-500 text-white" : "bg-purple-600 text-white"
              }`}>
                {pairs.length} / {MAX_PAIRS} Cặp
              </span>
            </div>

            {/* Bulk Paste Trigger Button */}
            <button
              onClick={() => setShowPasteModal(true)}
              className="px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:hover:bg-purple-900/60 dark:text-purple-300 font-bold text-xs rounded-xl border border-purple-200 dark:border-purple-800 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Nhập nhanh Excel/Word</span>
            </button>

            {/* Manual Add Button */}
            <button
              onClick={handleAddPair}
              disabled={pairs.length >= MAX_PAIRS}
              className={`px-4 py-2.5 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 ${
                pairs.length >= MAX_PAIRS 
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200" 
                  : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer"
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Thêm 1 cặp</span>
            </button>
          </div>
        </div>

        {/* Pair Items Grid (4 Columns Layout - Reference Screenshot Design) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {pairs.map((pair, index) => (
            <div 
              key={pair.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3.5 pt-4 shadow-xl shadow-purple-500/5 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between gap-3 group relative overflow-hidden"
            >
              {/* Top Accent Gradient Line */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 via-pink-500 to-amber-400" />

              {/* 1. Top Image Box */}
              <div className="relative aspect-[4/3] w-full rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200/60 dark:border-slate-700/60 group/img shrink-0">
                {pair.imageUrl ? (
                  <img 
                    src={pair.imageUrl} 
                    alt={pair.word || `Pair #${index+1}`} 
                    className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1.5 p-3 text-center bg-slate-50 dark:bg-slate-800">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center border border-purple-200/50">
                      <ImageIcon className="w-5 h-5 stroke-[1.8]" />
                    </div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Chưa chọn ảnh</span>
                  </div>
                )}

                {/* STT Badge - Top Left Overlay */}
                <div className="absolute top-2.5 left-2.5 z-30 pointer-events-none">
                  <span className="w-8 h-8 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500 text-white font-black text-sm flex items-center justify-center shadow-md shadow-purple-600/30">
                    {index + 1}
                  </span>
                </div>

                {/* Delete Pair Button - Top Right Overlay */}
                <div className="absolute top-2.5 right-2.5 z-30">
                  <button
                    onClick={() => handleRemovePair(pair.id)}
                    className="w-8 h-8 rounded-full bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 shadow-md flex items-center justify-center transition-all cursor-pointer border border-slate-100"
                    title="Xóa cặp thẻ này"
                  >
                    <Trash2 className="w-4 h-4 stroke-[2]" />
                  </button>
                </div>

                {/* Hover Action Overlay - 2 Buttons side-by-side at bottom of image */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent opacity-0 group-hover/img:opacity-100 transition-all duration-300 flex items-end p-2.5 z-20">
                  <div className="flex items-center gap-2 w-full">
                    <button
                      onClick={() => handleOpenSearchModal(pair)}
                      className="flex-1 py-2 px-2.5 bg-gradient-to-r from-sky-400 to-blue-600 hover:from-sky-500 hover:to-blue-700 text-white font-bold text-[11px] rounded-xl shadow-md transition-all flex items-center justify-center gap-1 active:scale-95 cursor-pointer truncate"
                      title="Tìm ảnh Internet"
                    >
                      <Search className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Tìm ảnh</span>
                    </button>

                    <button
                      onClick={() => handleTriggerImageUpload(pair.id)}
                      className="flex-1 py-2 px-2.5 bg-white hover:bg-slate-50 text-slate-800 font-bold text-[11px] rounded-xl shadow-md transition-all flex items-center justify-center gap-1 active:scale-95 cursor-pointer truncate"
                      title="Tải từ máy"
                    >
                      <Upload className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span className="truncate">Tải từ máy</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. Middle Section: Bold Centered Word Input & Decorative Purple Line */}
              <div className="w-full space-y-2 py-1">
                <input
                  type="text"
                  value={pair.word}
                  onChange={e => handleUpdateWord(pair.id, e.target.value)}
                  placeholder="Elephant"
                  className="w-full bg-transparent border-none text-center font-black text-xl md:text-2xl text-slate-800 dark:text-white focus:ring-0 outline-none placeholder:text-slate-300 p-0"
                />

                {/* Decorative purple line with center dot */}
                <div className="flex items-center justify-center">
                  <div className="h-[1px] w-14 bg-purple-200 dark:bg-purple-800 relative">
                    <div className="w-2 h-2 rounded-full bg-purple-600 dark:bg-purple-400 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              {/* 3. Audio Button (Pill Style with Circle Icon on Left & Audio Waveform on Right) */}
              <div className="w-full">
                {pair.audioUrl ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handlePlayAudio(pair.audioUrl!)}
                      className="flex-1 py-2.5 px-4 bg-[#f9f5ff] dark:bg-purple-950/50 hover:bg-purple-100/80 border border-[#e8d8ff] dark:border-purple-800 rounded-2xl flex items-center justify-between gap-2.5 text-[#7c2aed] dark:text-purple-300 font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer truncate"
                      title="Nghe phát âm"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-6 h-6 rounded-full bg-[#e8d5ff] dark:bg-purple-900/60 text-[#7c2aed] dark:text-purple-300 flex items-center justify-center shrink-0">
                          <Volume2 className="w-3.5 h-3.5 fill-current" />
                        </div>
                        <span className="truncate">Nghe phát âm</span>
                      </div>

                      {/* Audio Waveform Indicator */}
                      <div className="flex items-end gap-[2px] h-4 text-purple-500 shrink-0">
                        <span className="w-[2px] h-2 bg-purple-400 rounded-full animate-bounce" />
                        <span className="w-[2px] h-4 bg-purple-600 rounded-full animate-bounce [animation-delay:0.15s]" />
                        <span className="w-[2px] h-3 bg-purple-500 rounded-full animate-bounce [animation-delay:0.3s]" />
                        <span className="w-[2px] h-4 bg-purple-600 rounded-full animate-bounce [animation-delay:0.45s]" />
                        <span className="w-[2px] h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:0.6s]" />
                      </div>
                    </button>
                    <button
                      onClick={() => setPairs(pairs.map(p => p.id === pair.id ? { ...p, audioUrl: undefined, audioFileName: undefined } : p))}
                      className="px-2 py-2 text-xs text-rose-500 hover:underline font-bold shrink-0"
                    >
                      Xóa
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleTriggerAudioUpload(pair.id)}
                    className="w-full py-2.5 px-4 bg-[#f9f5ff] dark:bg-purple-950/40 hover:bg-[#f3eaef] border border-[#e8d8ff] dark:border-purple-800/80 rounded-2xl flex items-center justify-between gap-2.5 text-[#7c2aed] dark:text-purple-300 font-bold text-xs shadow-sm transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-[#e8d5ff] dark:bg-purple-900/60 text-[#7c2aed] dark:text-purple-300 flex items-center justify-center shrink-0">
                        <Volume2 className="w-3.5 h-3.5 fill-current" />
                      </div>
                      <span>Tải file âm thanh</span>
                    </div>

                    {/* Audio Waveform Graphic */}
                    <div className="flex items-end gap-[2.5px] h-4 text-[#9b51e0] shrink-0">
                      <span className="w-[2.5px] h-2.5 bg-[#b975fb] rounded-full" />
                      <span className="w-[2.5px] h-4 bg-[#8c30f5] rounded-full" />
                      <span className="w-[2.5px] h-3 bg-[#a24ef9] rounded-full" />
                      <span className="w-[2.5px] h-4 bg-[#8c30f5] rounded-full" />
                      <span className="w-[2.5px] h-2 bg-[#c58dfc] rounded-full" />
                    </div>
                  </button>
                )}
              </div>

              {/* 4. Bottom Status Footer (Separated by line) */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-around text-xs font-semibold text-slate-500 dark:text-slate-400">
                {/* Image status */}
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${pair.imageUrl ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`} />
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${pair.imageUrl ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                    <ImageIcon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] font-bold">{pair.imageUrl ? "Có ảnh" : "Chờ ảnh"}</span>
                </div>

                {/* Vertical Separator Line */}
                <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700" />

                {/* Audio status */}
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${pair.audioUrl ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`} />
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${pair.audioUrl ? "bg-purple-100 text-purple-600" : "bg-slate-100 text-slate-400"}`}>
                    <Headphones className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] font-bold">{pair.audioUrl ? "Có audio" : "Chờ audio"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Warning Badge when max limit reached */}
        {pairs.length >= MAX_PAIRS && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center gap-3 text-amber-800 dark:text-amber-300 text-xs font-bold">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
            <span>Đã đạt tối đa {MAX_PAIRS} cặp thẻ cho game này. Bạn có thể chỉnh sửa các cặp hiện có hoặc xóa bớt để thêm mới.</span>
          </div>
        )}
      </div>

      {/* --- BULK PASTE MODAL --- */}
      {showPasteModal && (
        <div className="fixed inset-0 z-[200] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl border border-primary/10 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-headline font-black text-lg text-slate-800 dark:text-white">
                    Nhập nhanh từ Excel / Word
                  </h3>
                  <p className="text-xs font-medium text-slate-400">
                    Dán danh sách từ vựng (mỗi từ 1 dòng)
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowPasteModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 flex items-center justify-center transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                Dán văn bản vào đây (Mỗi dòng sẽ tạo thành 1 cặp thẻ):
              </label>
              <textarea
                rows={8}
                value={pasteContent}
                onChange={e => setPasteContent(e.target.value)}
                placeholder={`Elephant\nTiger\nMonkey\nDog\nCat\nFish\nSheep`}
                className="w-full p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowPasteModal(false)}
                className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleProcessBulkPaste}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-purple-600/25 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Phân tách &amp; Thêm vào danh sách</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- INTERNET IMAGE SEARCH MODAL --- */}
      {showSearchModal && (
        <div className="fixed inset-0 z-[200] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-6 md:p-8 shadow-2xl border border-primary/10 space-y-6 max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-headline font-black text-lg text-slate-800 dark:text-white">
                    Tìm kiếm ảnh từ Internet
                  </h3>
                  <p className="text-xs font-medium text-slate-400">
                    Tìm ảnh Google minh họa cho từ vựng
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowSearchModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 flex items-center justify-center transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input Bar */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="relative flex-1">
                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handlePerformSearch()}
                  placeholder="Nhập từ khóa tìm kiếm ảnh..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all"
                />
              </div>

              <button
                onClick={handlePerformSearch}
                disabled={isSearching}
                className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
              >
                {isSearching ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span>Tìm kiếm</span>
              </button>
            </div>

            {/* Image Grid Results */}
            <div className="flex-1 overflow-y-auto min-h-[300px] p-2 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
              {isSearching ? (
                <div className="h-64 flex flex-col items-center justify-center space-y-3 text-slate-400">
                  <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-bold">Đang tìm kiếm ảnh trên Google...</span>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {searchResults.map((imgItem, i) => (
                    <div
                      key={imgItem.id || i}
                      onClick={() => handleSelectSearchImage(imgItem.url)}
                      className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-900 border-2 border-transparent hover:border-sky-500 cursor-pointer shadow-sm hover:shadow-xl transition-all duration-200"
                    >
                      <img 
                        src={imgItem.thumb || imgItem.url} 
                        alt="Search result" 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      />
                      <div className="absolute inset-0 bg-sky-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="px-3 py-1.5 bg-sky-500 text-white font-black text-xs rounded-full shadow-lg">
                          Chọn ảnh
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center space-y-2 text-slate-400">
                  <ImageIcon className="w-10 h-10 stroke-1" />
                  <span className="text-xs font-bold">Nhập từ khóa và bấm Tìm kiếm để xem kết quả hình ảnh</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
