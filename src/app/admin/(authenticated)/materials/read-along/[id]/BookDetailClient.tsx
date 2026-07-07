"use client";

import { useState, useEffect, useRef, useCallback } from "react";

import Link from "next/link";
import { toast } from "sonner";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  closestCenter,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ─── Types ────────────────────────────────────────────────────

interface Slide {
  id: string;
  slideNumber: string;
  imageName: string | null;
  imageUrl: string | null;
  text: string;
  audioUrl: string | null;
  orderIndex: number;
}

interface Book {
  id: string;
  bookId: string;
  title: string;
  description: string | null;
  slides: Slide[];
}

interface BatchProgress {
  current: number;
  total: number;
  status: "idle" | "running" | "complete" | "error";
  slideStatuses: Record<string, "pending" | "generating" | "done" | "error" | "skip">;
  successCount: number;
  skipCount: number;
}

interface Props {
  bookId: string;
}

// ─── Sortable Slide Card ──────────────────────────────────────

interface SlideCardProps {
  slide: Slide;
  bookId: string;
  batchStatus?: "pending" | "generating" | "done" | "error" | "skip";
  isGenerating: boolean;
  isGeneratingImage: boolean;
  isPlaying: boolean;
  hasAudio: boolean;
  isEditing: boolean;
  isSaving: boolean;
  isCloning: boolean;
  isBatchRunning: boolean;
  editingText: string;
  onEditingTextChange: (v: string) => void;
  onStartEditing: (slide: Slide) => void;
  onCancelEditing: () => void;
  onSaveText: (slideId: string) => void;
  onPlayAudio: (slide: Slide) => void;
  onGenerateAudio: (slideId: string) => void;
  onGenerateImage: (slideId: string) => void;
  onClone: (slideId: string) => void;
  /** If provided, renders with dnd drag handle */
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  isDraggingOverlay?: boolean;
}

/** Extra props only used by SortableSlideCard (not forwarded to SlideCardInner) */
interface SortableSlideCardExtraProps {
  isLastSlide?: boolean;
  isMerging?: boolean;
  onMergeWithNext?: () => void;
}

function SlideCardInner({
  slide,
  batchStatus,
  isGenerating,
  isGeneratingImage,
  isPlaying,
  hasAudio,
  isEditing,
  isSaving,
  isCloning,
  isBatchRunning,
  editingText,
  onEditingTextChange,
  onStartEditing,
  onCancelEditing,
  onSaveText,
  onPlayAudio,
  onGenerateAudio,
  onGenerateImage,
  onClone,
  dragHandleProps,
  isDraggingOverlay,
}: SlideCardProps) {

  return (
    <div
      className={`bg-neutral-900 border rounded-2xl overflow-hidden transition-all shadow-md flex flex-col ${
        isDraggingOverlay
          ? "border-blue-500/60 shadow-[0_0_20px_rgba(59,130,246,0.3)] scale-105"
          : batchStatus === "done" || (hasAudio && !batchStatus)
          ? "border-green-900/40"
          : batchStatus === "error"
          ? "border-red-900/40"
          : isEditing
          ? "border-blue-700/60"
          : "border-neutral-800"
      }`}
    >
      {/* Slide image + drag handle */}
      <div className="relative aspect-[9/16] bg-neutral-950 overflow-hidden shrink-0">
        {slide.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={slide.imageUrl} alt={`Slide ${slide.slideNumber}`} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-neutral-700">
            <span className="material-symbols-outlined text-3xl">image</span>
          </div>
        )}

        {/* Drag handle */}
        <div
          {...dragHandleProps}
          className="absolute top-1.5 left-1/2 -translate-x-1/2 w-7 h-5 flex items-center justify-center rounded-md bg-neutral-950/70 border border-neutral-700/60 backdrop-blur-sm cursor-grab active:cursor-grabbing hover:bg-neutral-800/90 transition-colors z-10"
          title="Kéo để sắp xếp"
        >
          <span className="material-symbols-outlined text-[13px] text-neutral-400">drag_indicator</span>
        </div>

        {/* Slide number */}
        <div className="absolute bottom-1.5 left-1.5 bg-neutral-950/90 backdrop-blur-sm px-2 py-0.5 rounded-lg text-[10px] font-bold text-blue-400 border border-neutral-700">
          {slide.slideNumber}
        </div>

        {/* Audio status */}
        <div
          className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-lg text-[10px] font-bold border backdrop-blur-sm flex items-center gap-0.5 ${
            isGenerating
              ? "bg-yellow-950/80 text-yellow-400 border-yellow-900/50"
              : batchStatus === "error"
              ? "bg-red-950/80 text-red-400 border-red-900/50"
              : hasAudio
              ? "bg-green-950/80 text-green-400 border-green-900/50"
              : "bg-neutral-800/80 text-neutral-500 border-neutral-700/50"
          }`}
        >
          {isGenerating ? (
            <svg className="animate-spin h-2.5 w-2.5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : hasAudio ? (
            <span className="material-symbols-outlined text-[10px]">check_circle</span>
          ) : (
            <span className="material-symbols-outlined text-[10px]">radio_button_unchecked</span>
          )}
          {isGenerating ? "" : hasAudio ? "Audio" : "Chưa"}
        </div>
      </div>


      {/* Text area */}
      <div className="p-2.5 flex-1 flex flex-col gap-2">
        {isEditing ? (
          <div className="flex flex-col gap-1.5">
            <textarea
              value={editingText}
              onChange={(e) => onEditingTextChange(e.target.value)}
              rows={3}
              autoFocus
              className="w-full text-xs text-white bg-neutral-800 border border-blue-600 rounded-lg px-2 py-1.5 resize-none outline-none focus:border-blue-500 leading-relaxed"
            />
            <div className="flex gap-1">
              <button
                onClick={() => onSaveText(slide.id)}
                disabled={isSaving}
                className="flex-1 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-0.5 transition-all disabled:opacity-50"
              >
                {isSaving ? (
                  <svg className="animate-spin h-2.5 w-2.5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <span className="material-symbols-outlined text-[11px]">check</span>
                )}
                Lưu
              </button>
              <button
                onClick={onCancelEditing}
                className="px-2 py-1 bg-neutral-700 hover:bg-neutral-600 text-neutral-300 rounded-lg text-[10px] font-bold transition-all"
              >
                <span className="material-symbols-outlined text-[11px]">close</span>
              </button>
            </div>
          </div>
        ) : (
          <div
            className="group/text relative cursor-text rounded-lg px-1.5 py-1 -mx-1.5 hover:bg-neutral-800/60 hover:ring-1 hover:ring-blue-700/40 transition-all"
            onClick={() => onStartEditing(slide)}
            title="Nhấn để chỉnh sửa"
          >
            <p className="text-neutral-300 text-[11px] leading-relaxed line-clamp-3 min-h-[3rem] select-none">
              {slide.text || <span className="text-neutral-600 italic">Nhấn để thêm text...</span>}
            </p>
          </div>
        )}

        {/* Audio action buttons */}
        {!isEditing && (
          <div className="flex gap-1 mt-auto">
            {/* Generate Image button */}
            <button
              onClick={() => onGenerateImage(slide.id)}
              disabled={isGeneratingImage || isBatchRunning || !slide.text?.trim()}
              title={!slide.text?.trim() ? "Thêm text trước khi tạo ảnh" : "Tạo ảnh AI từ nội dung trang"}
              className="px-2 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center transition-all border bg-amber-950/30 border-amber-900/40 text-amber-400 hover:bg-amber-950/60 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isGeneratingImage ? (
                <svg className="animate-spin h-2.5 w-2.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <span className="material-symbols-outlined text-[12px]">auto_awesome</span>
              )}
            </button>

            <button
              onClick={() => onPlayAudio(slide)}
              disabled={!hasAudio || isGenerating}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-0.5 transition-all border ${
                hasAudio && !isGenerating
                  ? isPlaying
                    ? "bg-blue-600 border-blue-500 text-white"
                    : "bg-blue-950/30 border-blue-900/40 text-blue-400 hover:bg-blue-950/60"
                  : "bg-neutral-800/50 border-neutral-700/50 text-neutral-600 cursor-not-allowed"
              }`}
            >
              <span className="material-symbols-outlined text-[12px]">
                {isPlaying ? "pause" : "play_arrow"}
              </span>
              {isPlaying ? "Dừng" : "Nghe"}
            </button>

            <button
              onClick={() => onGenerateAudio(slide.id)}
              disabled={isGenerating || isBatchRunning}
              className="flex-1 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-0.5 transition-all border bg-purple-950/30 border-purple-900/40 text-purple-400 hover:bg-purple-950/60 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <svg className="animate-spin h-2.5 w-2.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <span className="material-symbols-outlined text-[12px]">mic</span>
              )}
              {isGenerating ? "..." : hasAudio ? "Tạo lại" : "Tạo"}
            </button>

            {/* Clone button */}
            <button
              onClick={() => onClone(slide.id)}
              disabled={isCloning || isBatchRunning}
              title="Nhân đôi trang này"
              className="px-2 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center transition-all border bg-teal-950/30 border-teal-900/40 text-teal-400 hover:bg-teal-950/60 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isCloning ? (
                <svg className="animate-spin h-2.5 w-2.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <span className="material-symbols-outlined text-[12px]">content_copy</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SortableSlideCard(props: SlideCardProps & SortableSlideCardExtraProps) {
  const { isLastSlide, isMerging, onMergeWithNext, ...innerProps } = props;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.slide.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 5 : undefined,
    position: "relative",
  };

  return (
    <div ref={setNodeRef} style={style}>
      <SlideCardInner
        {...innerProps}
        dragHandleProps={{ ...attributes, ...listeners } as React.HTMLAttributes<HTMLDivElement>}
      />

      {/* Merge-with-next button – centered in the gap between this card and the next */}
      {!isLastSlide && (
        <button
          onClick={onMergeWithNext}
          disabled={innerProps.isBatchRunning || isMerging}
          title="Gộp với trang tiếp theo"
          style={{ right: "-14px" }}
          className="absolute top-1/2 -translate-y-1/2 z-30 w-7 h-10 flex items-center justify-center bg-neutral-800/90 border border-neutral-700 rounded-lg text-neutral-500 hover:bg-orange-950/70 hover:border-orange-700/60 hover:text-orange-400 transition-all shadow-lg backdrop-blur-sm disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {isMerging ? (
            <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <span className="material-symbols-outlined text-[13px]">call_merge</span>
          )}
        </button>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────

export function BookDetailClient({ bookId }: Props) {
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortedSlides, setSortedSlides] = useState<Slide[]>([]);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [isAddingSlide, setIsAddingSlide] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [generatingImageSlideId, setGeneratingImageSlideId] = useState<string | null>(null);

  // Single slide audio generation state
  const [generatingSlideId, setGeneratingSlideId] = useState<string | null>(null);

  // Playing audio
  const [playingSlideId, setPlayingSlideId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Batch generation state
  const [batchProgress, setBatchProgress] = useState<BatchProgress>({
    current: 0,
    total: 0,
    status: "idle",
    slideStatuses: {},
    successCount: 0,
    skipCount: 0,
  });

  // Text editing state
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [savingSlideId, setSavingSlideId] = useState<string | null>(null);

  // Confirm overwrite modal
  const [confirmModal, setConfirmModal] = useState<{
    type: "single" | "batch";
    slideId?: string;
  } | null>(null);

  // Clone slide state
  const [cloneConfirmSlideId, setCloneConfirmSlideId] = useState<string | null>(null);
  const [cloningSlideId, setCloningSlideId] = useState<string | null>(null);

  // Merge slides state
  const [mergingSlideAId, setMergingSlideAId] = useState<string | null>(null);

  // Batch image generation state
  const [batchImageProgress, setBatchImageProgress] = useState<{
    current: number;
    total: number;
    status: "idle" | "running" | "complete" | "error";
    slideStatuses: Record<string, "generating" | "done" | "error" | "skip">;
    successCount: number;
    skipCount: number;
  }>({
    current: 0,
    total: 0,
    status: "idle",
    slideStatuses: {},
    successCount: 0,
    skipCount: 0,
  });
  const [confirmImageModal, setConfirmImageModal] = useState(false);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchBook = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/read-along/${bookId}`);
      const data = await res.json();
      if (data.success) {
        setBook(data.book);
        setSortedSlides([...data.book.slides].sort((a, b) => a.orderIndex - b.orderIndex));
      } else {
        toast.error(data.error || "Không thể tải thông tin sách.");
      }
    } catch {
      toast.error("Lỗi kết nối server.");
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  useEffect(() => {
    fetchBook();
  }, [fetchBook]);

  // ── Drag and Drop ─────────────────────────────────────────

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sortedSlides.findIndex(s => s.id === active.id);
    const newIndex = sortedSlides.findIndex(s => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(sortedSlides, oldIndex, newIndex);
    setSortedSlides(newOrder);

    // Auto-save
    setIsSavingOrder(true);
    try {
      const res = await fetch(`/api/admin/read-along/${bookId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: newOrder.map(s => s.id) }),
      });
      if (!res.ok) throw new Error("Lưu thứ tự thất bại.");
      // Update orderIndex locally to keep in sync
      setSortedSlides(prev => prev.map((s, i) => ({ ...s, orderIndex: i })));
      setBook(prev => prev ? { ...prev, slides: newOrder.map((s, i) => ({ ...s, orderIndex: i })) } : prev);
    } catch (err: any) {
      toast.error(err.message || "Lỗi lưu thứ tự trang.");
      setSortedSlides([...sortedSlides]); // rollback
    } finally {
      setIsSavingOrder(false);
    }
  };

  // ── Add empty slide ───────────────────────────────────────

  const addEmptySlide = async () => {
    if (!book) return;
    setIsAddingSlide(true);
    try {
      const res = await fetch(`/api/admin/read-along/${bookId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Tạo trang thất bại.");
      toast.success("Đã thêm trang mới!");
      await fetchBook();
    } catch (err: any) {
      toast.error(err.message || "Tạo trang thất bại.");
    } finally {
      setIsAddingSlide(false);
    }
  };

  // ── Generate image for a slide ────────────────────────────

  const generateSlideImage = async (slideId: string) => {
    setGeneratingImageSlideId(slideId);
    try {
      const res = await fetch(`/api/admin/read-along/${bookId}/image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slideId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Tạo ảnh thất bại.");
      const updateSlides = (prev: Slide[]) =>
        prev.map(s => s.id === slideId ? { ...s, imageUrl: data.imageUrl, imageName: data.imageName } : s);
      setSortedSlides(updateSlides);
      setBook(prev => prev ? { ...prev, slides: updateSlides(prev.slides) } : prev);
      toast.success("✅ Đã tạo ảnh cho trang!");
    } catch (err: any) {
      toast.error(err.message || "Tạo ảnh thất bại.");
    } finally {
      setGeneratingImageSlideId(null);
    }
  };

  // ── Audio playback ────────────────────────────────────────

  const handlePlayAudio = (slide: Slide) => {
    if (!slide.audioUrl) return;
    if (playingSlideId === slide.id) {
      audioRef.current?.pause();
      setPlayingSlideId(null);
      return;
    }
    audioRef.current?.pause();
    const audio = new Audio(slide.audioUrl);
    audioRef.current = audio;
    audio.playbackRate = 0.75;
    audio.play();
    setPlayingSlideId(slide.id);
    audio.onended = () => setPlayingSlideId(null);
    audio.onerror = () => { toast.error("Không thể phát audio."); setPlayingSlideId(null); };
  };

  // ── Text editing ──────────────────────────────────────────

  const startEditing = (slide: Slide) => { setEditingSlideId(slide.id); setEditingText(slide.text); };
  const cancelEditing = () => { setEditingSlideId(null); setEditingText(""); };

  const saveText = async (slideId: string) => {
    setSavingSlideId(slideId);
    try {
      const res = await fetch(`/api/admin/read-along/${bookId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slideId, text: editingText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi lưu text.");
      const updateSlides = (prev: Slide[]) => prev.map(s => s.id === slideId ? { ...s, text: editingText } : s);
      setSortedSlides(updateSlides);
      setBook(prev => prev ? { ...prev, slides: updateSlides(prev.slides) } : prev);
      toast.success("Đã lưu nội dung trang.");
      setEditingSlideId(null);
    } catch (err: any) {
      toast.error(err.message || "Lưu thất bại.");
    } finally {
      setSavingSlideId(null);
    }
  };

  // ── Merge slides ──────────────────────────────────────────

  const mergeSlides = async (slideAId: string, slideBId: string) => {
    setMergingSlideAId(slideAId);
    try {
      const res = await fetch(`/api/admin/read-along/${bookId}/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slideAId, slideBId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi gộp trang.");
      toast.success("✅ Đã gộp trang thành công!");
      await fetchBook();
    } catch (err: any) {
      toast.error(err.message || "Gộp trang thất bại.");
    } finally {
      setMergingSlideAId(null);
    }
  };

  // ── Clone slide ───────────────────────────────────────────

  const cloneSlide = async (slideId: string) => {
    setCloneConfirmSlideId(null);
    setCloningSlideId(slideId);
    try {
      const res = await fetch(`/api/admin/read-along/${bookId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slideId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi nhân đôi trang.");
      toast.success("✅ Đã nhân đôi trang thành công!");
      await fetchBook();
    } catch (err: any) {
      toast.error(err.message || "Nhân đôi trang thất bại.");
    } finally {
      setCloningSlideId(null);
    }
  };

  // ── Single slide audio generation ─────────────────────────

  const generateSingleAudio = async (slideId: string, overwrite = false) => {
    setGeneratingSlideId(slideId);
    setConfirmModal(null);
    try {
      const res = await fetch(`/api/admin/read-along/${bookId}/audio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slideId, overwrite }),
      });
      const data = await res.json();
      if (res.status === 409) { setConfirmModal({ type: "single", slideId }); return; }
      if (!res.ok) throw new Error(data.error || "Lỗi tạo audio.");
      toast.success(`✅ Đã tạo audio cho slide ${sortedSlides.find(s => s.id === slideId)?.slideNumber}`);
      const updateSlides = (prev: Slide[]) => prev.map(s => s.id === slideId ? { ...s, audioUrl: data.audioUrl } : s);
      setSortedSlides(updateSlides);
      setBook(prev => prev ? { ...prev, slides: updateSlides(prev.slides) } : prev);
    } catch (err: any) {
      toast.error(err.message || "Tạo audio thất bại.");
    } finally {
      setGeneratingSlideId(null);
    }
  };

  // ── Batch audio generation via SSE ────────────────────────

  const startBatchGeneration = async (overwrite = false) => {
    setConfirmModal(null);
    if (!book) return;
    const hasExisting = sortedSlides.some(s => s.audioUrl);
    if (hasExisting && !overwrite) { setConfirmModal({ type: "batch" }); return; }

    setBatchProgress({ current: 0, total: sortedSlides.length, status: "running", slideStatuses: {}, successCount: 0, skipCount: 0 });

    try {
      const res = await fetch(`/api/admin/read-along/${bookId}/audio/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overwrite }),
      });
      if (!res.body) throw new Error("No response stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try { handleBatchEvent(JSON.parse(line.slice(6))); } catch {}
        }
      }
    } catch (err: any) {
      toast.error("Tạo audio hàng loạt thất bại: " + err.message);
      setBatchProgress(p => ({ ...p, status: "error" }));
    }
  };

  const handleBatchEvent = (event: any) => {
    switch (event.type) {
      case "start":
        setBatchProgress(p => ({ ...p, total: event.total, status: "running" }));
        break;
      case "progress":
        setBatchProgress(p => ({
          ...p, current: event.current,
          slideStatuses: { ...p.slideStatuses, [event.slideId]: event.status },
          successCount: event.status === "done" ? p.successCount + 1 : p.successCount,
        }));
        if (event.status === "done" && event.audioUrl) {
          const updateSlides = (prev: Slide[]) => prev.map(s => s.id === event.slideId ? { ...s, audioUrl: event.audioUrl } : s);
          setSortedSlides(updateSlides);
          setBook(prev => prev ? { ...prev, slides: updateSlides(prev.slides) } : prev);
        }
        break;
      case "skip":
        setBatchProgress(p => ({ ...p, current: event.current, slideStatuses: { ...p.slideStatuses, [event.slideId]: "skip" }, skipCount: p.skipCount + 1 }));
        break;
      case "complete":
        setBatchProgress(p => ({ ...p, status: "complete", successCount: event.successCount, skipCount: event.skipCount }));
        toast.success(`🎉 Hoàn thành! Đã tạo ${event.successCount} audio, bỏ qua ${event.skipCount} slide.`);
        break;
      case "error":
        toast.error("Lỗi: " + event.message);
        setBatchProgress(p => ({ ...p, status: "error" }));
        break;
    }
  };

  // ── Batch image generation ────────────────────────────────

  const startBatchImageGeneration = async (overwrite = false, confirmed = false) => {
    setConfirmImageModal(false);
    const hasExisting = sortedSlides.some(s => s.imageUrl);
    if (hasExisting && !overwrite && !confirmed) { setConfirmImageModal(true); return; }

    setBatchImageProgress({ current: 0, total: 0, status: "running", slideStatuses: {}, successCount: 0, skipCount: 0 });

    try {
      const res = await fetch(`/api/admin/read-along/${bookId}/image/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overwrite }),
      });
      if (!res.body) throw new Error("No response stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try { handleBatchImageEvent(JSON.parse(line.slice(6))); } catch {}
        }
      }
    } catch (err: any) {
      toast.error("Tạo ảnh hàng loạt thất bại: " + err.message);
      setBatchImageProgress(p => ({ ...p, status: "error" }));
    }
  };

  const handleBatchImageEvent = (event: any) => {
    switch (event.type) {
      case "start":
        setBatchImageProgress(p => ({ ...p, total: event.total, status: "running" }));
        break;
      case "progress":
        setBatchImageProgress(p => ({
          ...p, current: event.current,
          slideStatuses: { ...p.slideStatuses, [event.slideId]: event.status },
          successCount: event.status === "done" ? p.successCount + 1 : p.successCount,
        }));
        if (event.status === "done" && event.imageUrl) {
          const updateSlides = (prev: Slide[]) =>
            prev.map(s => s.id === event.slideId ? { ...s, imageUrl: event.imageUrl } : s);
          setSortedSlides(updateSlides);
          setBook(prev => prev ? { ...prev, slides: updateSlides(prev.slides) } : prev);
        }
        break;
      case "skip":
        setBatchImageProgress(p => ({
          ...p, current: p.current + 1,
          slideStatuses: { ...p.slideStatuses, [event.slideId]: "skip" },
          skipCount: p.skipCount + 1,
        }));
        break;
      case "complete":
        setBatchImageProgress(p => ({ ...p, status: "complete", successCount: event.successCount, skipCount: event.skipCount }));
        toast.success(`🎨 Xong! Đã tạo ${event.successCount} ảnh, bỏ qua ${event.skipCount} trang.`);
        break;
      case "error":
        toast.error("Lỗi tạo ảnh: " + event.message);
        setBatchImageProgress(p => ({ ...p, status: "error" }));
        break;
    }
  };

  const slidesWithAudio = sortedSlides.filter(s => s.audioUrl).length;
  const slidesWithImages = sortedSlides.filter(s => s.imageUrl).length;
  const totalSlides = sortedSlides.length;
  const isBatchRunning = batchProgress.status === "running";
  const isBatchImageRunning = batchImageProgress.status === "running";
  const activeSlide = activeId ? sortedSlides.find(s => s.id === activeId) : null;

  // ── Render ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-neutral-400 text-sm font-medium">Đang tải thông tin sách...</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-neutral-600 mb-4 block">error</span>
          <p className="text-neutral-400">Không tìm thấy sách.</p>
          <Link href="/admin/materials/read-along" className="text-blue-400 hover:text-blue-300 text-sm mt-4 inline-block">
            ← Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/materials/read-along"
              className="w-9 h-9 bg-neutral-800 hover:bg-neutral-700 rounded-xl flex items-center justify-center transition-all border border-neutral-700 shrink-0"
            >
              <span className="material-symbols-outlined text-neutral-400 text-lg">arrow_back</span>
            </Link>
            <div>
              <div className="text-xs text-neutral-500 font-mono mb-0.5">ID: {book.bookId}</div>
              <h1 className="text-xl font-bold text-white">{book.title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Save order indicator */}
            {isSavingOrder && (
              <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Đang lưu thứ tự...
              </div>
            )}

            <div className="flex items-center gap-2 bg-neutral-800 border border-neutral-700 px-3 py-1.5 rounded-xl">
              <span className="material-symbols-outlined text-sm text-green-400">graphic_eq</span>
              <span className="text-sm font-bold text-white">
                {slidesWithAudio}<span className="text-neutral-500 font-normal">/{totalSlides}</span>
              </span>
              <span className="text-xs text-neutral-500">audio</span>
            </div>

            <div className="flex items-center gap-2 bg-neutral-800 border border-neutral-700 px-3 py-1.5 rounded-xl">
              <span className="material-symbols-outlined text-sm text-amber-400">image</span>
              <span className="text-sm font-bold text-white">
                {slidesWithImages}<span className="text-neutral-500 font-normal">/{totalSlides}</span>
              </span>
              <span className="text-xs text-neutral-500">ảnh</span>
            </div>

            <button
              onClick={() => startBatchImageGeneration(false)}
              disabled={isBatchImageRunning || isBatchRunning}
              className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-[0_4px_20px_rgba(245,158,11,0.3)] text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isBatchImageRunning ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Đang vẽ...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">auto_awesome</span>
                  Tạo tất cả ảnh
                </>
              )}
            </button>

            <button
              onClick={() => startBatchGeneration(false)}
              disabled={isBatchRunning}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-[0_4px_20px_rgba(139,92,246,0.3)] text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isBatchRunning ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Đang tạo...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">record_voice_over</span>
                  Tạo tất cả audio
                </>
              )}
            </button>
          </div>
        </div>

        {/* Audio batch progress bar */}
        {(isBatchRunning || batchProgress.status === "complete") && (
          <div className="mt-4 pt-4 border-t border-neutral-800">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-neutral-300 font-medium">
                {isBatchRunning
                  ? `🎤 Đang tạo audio: ${batchProgress.current}/${batchProgress.total}`
                  : `✅ Audio xong: ${batchProgress.successCount} tạo mới, ${batchProgress.skipCount} bỏ qua`}
              </span>
              <span className="text-neutral-500 tabular-nums">
                {batchProgress.total > 0 ? Math.round((batchProgress.current / batchProgress.total) * 100) : 0}%
              </span>
            </div>
            <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: batchProgress.total > 0 ? `${(batchProgress.current / batchProgress.total) * 100}%` : "0%",
                  background: batchProgress.status === "complete"
                    ? "linear-gradient(90deg, #22c55e, #16a34a)"
                    : "linear-gradient(90deg, #8b5cf6, #6366f1)",
                }}
              />
            </div>
          </div>
        )}

        {/* Image batch progress bar */}
        {(isBatchImageRunning || batchImageProgress.status === "complete") && (
          <div className="mt-3 pt-3 border-t border-neutral-800">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-neutral-300 font-medium">
                {isBatchImageRunning
                  ? `🎨 Đang tạo ảnh: ${batchImageProgress.current}/${batchImageProgress.total}`
                  : `✅ Ảnh xong: ${batchImageProgress.successCount} tạo mới, ${batchImageProgress.skipCount} bỏ qua`}
              </span>
              <span className="text-neutral-500 tabular-nums">
                {batchImageProgress.total > 0 ? Math.round((batchImageProgress.current / batchImageProgress.total) * 100) : 0}%
              </span>
            </div>
            <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: batchImageProgress.total > 0 ? `${(batchImageProgress.current / batchImageProgress.total) * 100}%` : "0%",
                  background: batchImageProgress.status === "complete"
                    ? "linear-gradient(90deg, #22c55e, #16a34a)"
                    : "linear-gradient(90deg, #f59e0b, #ea580c)",
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Slides Grid with DnD */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sortedSlides.map(s => s.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-5 gap-3">
            {sortedSlides.map((slide, index) => {
              const batchStatus = batchProgress.slideStatuses[slide.id];
              const isGenerating = generatingSlideId === slide.id || batchStatus === "generating";
              const isLast = index === sortedSlides.length - 1;
              const nextSlide = isLast ? null : sortedSlides[index + 1];
              return (
                <SortableSlideCard
                  key={slide.id}
                  slide={slide}
                  bookId={bookId}
                  batchStatus={batchStatus}
                  isGenerating={isGenerating}
                  isGeneratingImage={generatingImageSlideId === slide.id}
                  isPlaying={playingSlideId === slide.id}
                  hasAudio={!!slide.audioUrl}
                  isEditing={editingSlideId === slide.id}
                  isSaving={savingSlideId === slide.id}
                  isCloning={cloningSlideId === slide.id}
                  isBatchRunning={isBatchRunning}
                  editingText={editingText}
                  onEditingTextChange={setEditingText}
                  onStartEditing={startEditing}
                  onCancelEditing={cancelEditing}
                  onSaveText={saveText}
                  onPlayAudio={handlePlayAudio}
                  onGenerateAudio={(id) => {
                    const slide = sortedSlides.find(s => s.id === id);
                    if (slide?.audioUrl) setConfirmModal({ type: "single", slideId: id });
                    else generateSingleAudio(id, false);
                  }}
                  onGenerateImage={generateSlideImage}
                  onClone={(id) => setCloneConfirmSlideId(id)}
                  isLastSlide={isLast}
                  isMerging={mergingSlideAId === slide.id}
                  onMergeWithNext={() => {
                    if (nextSlide) mergeSlides(slide.id, nextSlide.id);
                  }}
                />
              );
            })}

            {/* Add New Slide button */}
            <button
              onClick={addEmptySlide}
              disabled={isAddingSlide || isBatchRunning}
              className="bg-neutral-900/50 border-2 border-dashed border-neutral-700 hover:border-blue-500/60 hover:bg-blue-950/10 rounded-2xl aspect-[4/3] flex flex-col items-center justify-center gap-2 transition-all group disabled:opacity-40 disabled:cursor-not-allowed min-h-[120px]"
            >
              {isAddingSlide ? (
                <svg className="animate-spin h-6 w-6 text-neutral-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <span className="material-symbols-outlined text-3xl text-neutral-600 group-hover:text-blue-400 transition-colors">add_circle</span>
              )}
              <span className="text-xs font-bold text-neutral-600 group-hover:text-blue-400 transition-colors">
                {isAddingSlide ? "Đang tạo..." : "Thêm trang"}
              </span>
            </button>
          </div>
        </SortableContext>

        {/* Drag overlay */}
        <DragOverlay>
          {activeSlide ? (
            <div className="opacity-90 rotate-1 scale-105">
              <SlideCardInner
                slide={activeSlide}
                bookId={bookId}
                isGenerating={false}
                isGeneratingImage={false}
                isPlaying={false}
                hasAudio={!!activeSlide.audioUrl}
                isEditing={false}
                isSaving={false}
                isCloning={false}
                isBatchRunning={false}
                editingText=""
                onEditingTextChange={() => {}}
                onStartEditing={() => {}}
                onCancelEditing={() => {}}
                onSaveText={() => {}}
                onPlayAudio={() => {}}
                onGenerateAudio={() => {}}
                onGenerateImage={() => {}}
                onClone={() => {}}
                isDraggingOverlay
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Confirm Overwrite Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-yellow-950/40 rounded-full flex items-center justify-center mx-auto mb-5 border border-yellow-900/40">
              <span className="material-symbols-outlined text-yellow-400 text-2xl">warning</span>
            </div>
            <h3 className="text-white font-bold text-center text-lg mb-2">
              {confirmModal.type === "batch" ? "Audio đã tồn tại" : "Tạo lại audio?"}
            </h3>
            <p className="text-neutral-400 text-sm text-center mb-6 leading-relaxed">
              {confirmModal.type === "batch"
                ? "Một số slide đã có audio. Bạn có muốn tạo lại tất cả không?"
                : "Slide này đã có audio. Tạo lại sẽ ghi đè file cũ."}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setConfirmModal(null)} className="py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-2xl text-sm font-bold transition-all border border-neutral-700">
                Hủy
              </button>
              <button
                onClick={() => {
                  if (confirmModal.type === "single" && confirmModal.slideId) generateSingleAudio(confirmModal.slideId, true);
                  else startBatchGeneration(true);
                }}
                className="py-3 bg-yellow-600 hover:bg-yellow-500 text-white rounded-2xl text-sm font-bold transition-all"
              >
                Ghi đè
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clone Confirm Modal */}
      {cloneConfirmSlideId && (() => {
        const targetSlide = sortedSlides.find(s => s.id === cloneConfirmSlideId);
        return (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-neutral-900 border border-neutral-700 rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="w-14 h-14 bg-teal-950/40 rounded-full flex items-center justify-center mx-auto mb-5 border border-teal-900/40">
                <span className="material-symbols-outlined text-teal-400 text-2xl">content_copy</span>
              </div>
              <h3 className="text-white font-bold text-center text-lg mb-2">Nhân đôi trang?</h3>
              <p className="text-neutral-400 text-sm text-center mb-6 leading-relaxed">
                Sẽ tạo bản sao của trang{" "}
                <span className="text-white font-semibold">#{targetSlide?.slideNumber}</span>{" "}
                ngay phía sau. Trang mới sẽ giữ nguyên ảnh &amp; text nhưng{" "}
                <span className="text-yellow-400">chưa có audio</span> (cần tạo lại).
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setCloneConfirmSlideId(null)} className="py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-2xl text-sm font-bold transition-all border border-neutral-700">
                  Hủy
                </button>
                <button onClick={() => cloneSlide(cloneConfirmSlideId)} className="py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl text-sm font-bold transition-all">
                  Nhân đôi
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Confirm Image Overwrite Modal */}
      {confirmImageModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-amber-950/40 rounded-full flex items-center justify-center mx-auto mb-5 border border-amber-900/40">
              <span className="material-symbols-outlined text-amber-400 text-2xl">image</span>
            </div>
            <h3 className="text-white font-bold text-center text-lg mb-2">Ảnh đã tồn tại</h3>
            <p className="text-neutral-400 text-sm text-center mb-6 leading-relaxed">
              Một số trang đã có ảnh. Bạn muốn xử lý thế nào?
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => startBatchImageGeneration(false, true)}
                className="py-3 bg-blue-700 hover:bg-blue-600 text-white rounded-2xl text-sm font-bold transition-all"
              >
                Chỉ tạo trang chưa có ảnh
              </button>
              <button
                onClick={() => startBatchImageGeneration(true, true)}
                className="py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl text-sm font-bold transition-all"
              >
                Tạo lại tất cả (ghi đè)
              </button>
              <button
                onClick={() => setConfirmImageModal(false)}
                className="py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-2xl text-sm font-bold transition-all border border-neutral-700"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
