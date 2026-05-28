"use client";

import React, { useState, useTransition } from "react";
import { 
  Search, 
  Pencil, 
  Trash, 
  TrendingUp, 
  SortAsc, 
  X, 
  Loader2, 
  Check, 
  AlertTriangle,
  BookOpen,
  HelpCircle,
  Plus,
  Star
} from "lucide-react";
import { renameTag, deleteTag, getAdminTags, createTag, toggleTagPopularity, deleteMultipleTags } from "@/actions/tag-actions";

interface TagInfo {
  name: string;
  assignmentCount: number;
  questionCount: number;
  isPopular: boolean;
}

interface Props {
  initialTags: TagInfo[];
}

const TAG_COLORS = [
  { bg: "bg-emerald-500/10 hover:bg-emerald-500/15", border: "border-emerald-500/20 hover:border-emerald-500/40", text: "text-emerald-400", dot: "bg-emerald-400" },
  { bg: "bg-sky-500/10 hover:bg-sky-500/15", border: "border-sky-500/20 hover:border-sky-500/40", text: "text-sky-400", dot: "bg-sky-400" },
  { bg: "bg-amber-500/10 hover:bg-amber-500/15", border: "border-amber-500/20 hover:border-amber-500/40", text: "text-amber-400", dot: "bg-amber-400" },
  { bg: "bg-rose-500/10 hover:bg-rose-500/15", border: "border-rose-500/20 hover:border-rose-500/40", text: "text-rose-400", dot: "bg-rose-400" },
  { bg: "bg-purple-500/10 hover:bg-purple-500/15", border: "border-purple-500/20 hover:border-purple-500/40", text: "text-purple-400", dot: "bg-purple-400" },
  { bg: "bg-indigo-500/10 hover:bg-indigo-500/15", border: "border-indigo-500/20 hover:border-indigo-500/40", text: "text-indigo-400", dot: "bg-indigo-400" },
  { bg: "bg-teal-500/10 hover:bg-teal-500/15", border: "border-teal-500/20 hover:border-teal-500/40", text: "text-teal-400", dot: "bg-teal-400" },
  { bg: "bg-pink-500/10 hover:bg-pink-500/15", border: "border-pink-500/20 hover:border-pink-500/40", text: "text-pink-400", dot: "bg-pink-400" },
];

const getColorsForTag = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % TAG_COLORS.length;
  return TAG_COLORS[index];
};

export default function TagManager({ initialTags }: Props) {
  const [tags, setTags] = useState<TagInfo[]>(initialTags);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"popularity" | "alphabetical">("popularity");
  const [isPending, startTransition] = useTransition();

  // Dialog States
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deletingTag, setDeletingTag] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  // Bulk action states
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Create tag action
  const handleCreate = async () => {
    const nameToSet = newTagName.trim();
    if (!nameToSet) {
      setActionError("Tên thẻ không được bỏ trống.");
      return;
    }

    setActionError(null);
    startTransition(async () => {
      try {
        const res = await createTag(nameToSet);
        if (res.success) {
          await refreshTags();
          setNewTagName("");
          setIsCreateOpen(false);
        } else {
          setActionError(res.error || "Có lỗi xảy ra khi tạo thẻ.");
        }
      } catch (err: any) {
        setActionError("Lỗi hệ thống khi tạo thẻ.");
      }
    });
  };

  // Toggle tag popularity
  const handleTogglePopularity = async (tagName: string) => {
    setActionError(null);
    startTransition(async () => {
      try {
        const res = await toggleTagPopularity(tagName);
        if (res.success) {
          await refreshTags();
        } else {
          setActionError(res.error || "Có lỗi xảy ra khi cập nhật độ phổ biến.");
        }
      } catch (err: any) {
        setActionError("Lỗi hệ thống khi cập nhật thẻ.");
      }
    });
  };

  // Refresh list from DB
  const refreshTags = async () => {
    const fresh = await getAdminTags();
    setTags(fresh);
  };

  // Filter and Sort
  const filteredTags = React.useMemo(() => {
    let result = tags.filter(tag => 
      tag.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (sortBy === "popularity") {
      result.sort((a, b) => 
        (b.assignmentCount + b.questionCount) - (a.assignmentCount + a.questionCount)
      );
    } else {
      result.sort((a, b) => a.name.localeCompare(b.name, "vi"));
    }

    return result;
  }, [tags, searchQuery, sortBy]);

  // Rename tag action
  const handleRename = async () => {
    if (!editingTag) return;
    const nameToSet = editName.trim();
    if (!nameToSet) {
      setActionError("Tên thẻ không được bỏ trống.");
      return;
    }
    if (nameToSet === editingTag) {
      setEditingTag(null);
      return;
    }

    setActionError(null);
    startTransition(async () => {
      try {
        const res = await renameTag(editingTag, nameToSet);
        if (res.success) {
          await refreshTags();
          setEditingTag(null);
        } else {
          setActionError(res.error || "Có lỗi xảy ra khi đổi tên.");
        }
      } catch (err: any) {
        setActionError("Lỗi hệ thống khi đổi tên thẻ.");
      }
    });
  };

  // Delete tag action
  const handleDelete = async () => {
    if (!deletingTag) return;

    setActionError(null);
    startTransition(async () => {
      try {
        const res = await deleteTag(deletingTag);
        if (res.success) {
          await refreshTags();
          setDeletingTag(null);
        } else {
          setActionError(res.error || "Có lỗi xảy ra khi xóa.");
        }
      } catch (err: any) {
        setActionError("Lỗi hệ thống khi xóa thẻ.");
      }
    });
  };

  // Bulk Selection Handlers
  const toggleTagSelection = (tagName: string) => {
    setSelectedTags(prev => 
      prev.includes(tagName) ? prev.filter(t => t !== tagName) : [...prev, tagName]
    );
  };

  const selectAll = () => {
    setSelectedTags(filteredTags.map(t => t.name));
  };

  const deselectAll = () => {
    setSelectedTags([]);
  };

  // Bulk Delete action
  const handleBulkDelete = async () => {
    if (selectedTags.length === 0) return;
    
    setActionError(null);
    startTransition(async () => {
      try {
        const res = await deleteMultipleTags(selectedTags);
        if (res.success) {
          await refreshTags();
          setSelectedTags([]);
          setIsBulkDeleting(false);
        } else {
          setActionError(res.error || "Có lỗi xảy ra khi xóa nhiều thẻ.");
        }
      } catch (err: any) {
        setActionError("Lỗi hệ thống khi xóa nhiều thẻ.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Search and Sort Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-neutral-900 border border-neutral-800 p-4 rounded-2xl">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 w-5 h-5" />
          <input
            type="text"
            placeholder="Tìm kiếm thẻ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm transition-all"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => setSortBy("popularity")}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-bold transition-all w-full sm:w-auto justify-center ${
                sortBy === "popularity"
                  ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20"
                  : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white"
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Phổ biến nhất
            </button>
            <button
              onClick={() => setSortBy("alphabetical")}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-bold transition-all w-full sm:w-auto justify-center ${
                sortBy === "alphabetical"
                  ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20"
                  : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white"
              }`}
            >
              <SortAsc className="w-4 h-4" />
              Tên A - Z
            </button>
          </div>

          <button
            onClick={() => {
              setIsCreateOpen(true);
              setNewTagName("");
              setActionError(null);
            }}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-500/20 w-full sm:w-auto justify-center border border-blue-500/30"
          >
            <Plus className="w-4 h-4" />
            Thêm Thẻ Mới
          </button>
        </div>
      </div>

      {/* Grid of tags */}
      {filteredTags.length === 0 ? (
        <div className="text-center py-16 bg-neutral-900 border border-neutral-800 rounded-3xl space-y-4">
          <div className="w-16 h-16 bg-neutral-950 border border-neutral-800 rounded-2xl flex items-center justify-center mx-auto">
            <Search className="w-8 h-8 text-neutral-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Không tìm thấy thẻ nào</h3>
            <p className="text-neutral-500 text-sm mt-1">Hãy thử tìm với từ khóa khác.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredTags.map((tag) => {
            const colors = getColorsForTag(tag.name);
            return (
              <div
                key={tag.name}
                className={`relative group p-5 border rounded-2xl transition-all duration-500 flex flex-col justify-between h-36 ${colors.bg} ${colors.border}`}
              >
                {/* Tag Name Header */}
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <input 
                      type="checkbox"
                      checked={selectedTags.includes(tag.name)}
                      onChange={() => toggleTagSelection(tag.name)}
                      disabled={isPending}
                      className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-blue-600 focus:ring-blue-500/50 focus:ring-offset-0 cursor-pointer shrink-0"
                    />
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${colors.dot}`} />
                    <span className="font-headline font-black text-lg text-white truncate drop-shadow-sm" title={tag.name}>
                      {tag.name}
                    </span>
                  </div>
                  {/* Action buttons (Star is always visible, edit/delete on hover) */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleTogglePopularity(tag.name)}
                      disabled={isPending}
                      className={`p-1.5 rounded-lg transition-all duration-300 hover:scale-125 active:scale-90 ${
                        tag.isPopular
                          ? "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                          : "text-neutral-500 hover:text-amber-400"
                      }`}
                      title={tag.isPopular ? "Bỏ đánh dấu phổ biến" : "Đánh dấu là phổ biến"}
                    >
                      <Star className={`w-4 h-4 transition-all duration-300 ${tag.isPopular ? "fill-amber-400 scale-110" : ""}`} />
                    </button>
                    
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button
                        onClick={() => {
                          setEditingTag(tag.name);
                          setEditName(tag.name);
                          setActionError(null);
                        }}
                        className="p-1.5 bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white rounded-lg hover:border-neutral-600 transition-all"
                        title="Sửa tên thẻ"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setDeletingTag(tag.name);
                          setActionError(null);
                        }}
                        className="p-1.5 bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-red-400 rounded-lg hover:border-red-500/30 hover:bg-red-500/10 transition-all"
                        title="Xóa thẻ"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tag stats count footer */}
                <div className="flex gap-4 pt-4 border-t border-neutral-800 mt-4 text-xs font-bold text-neutral-400">
                  <div className="flex items-center gap-1.5" title="Số lượng bài giảng & bài tập">
                    <BookOpen className="w-4 h-4 text-neutral-500 shrink-0" />
                    <span>{tag.assignmentCount} bài tập</span>
                  </div>
                  <div className="flex items-center gap-1.5" title="Số câu hỏi liên quan">
                    <HelpCircle className="w-4 h-4 text-neutral-500 shrink-0" />
                    <span>{tag.questionCount} câu hỏi</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bulk Actions Floating Bar */}
      {selectedTags.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="bg-neutral-900 border border-neutral-700 shadow-2xl shadow-black/50 rounded-2xl p-4 flex items-center gap-4">
            <span className="text-white font-bold text-sm bg-blue-600/20 text-blue-400 px-3 py-1.5 rounded-lg border border-blue-500/20">
              Đã chọn {selectedTags.length} thẻ
            </span>
            <div className="w-px h-6 bg-neutral-800" />
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="px-4 py-2 hover:bg-neutral-800 text-neutral-300 font-bold rounded-xl text-sm transition-all border border-transparent hover:border-neutral-700"
              >
                Chọn tất cả
              </button>
              <button
                onClick={deselectAll}
                className="px-4 py-2 hover:bg-neutral-800 text-neutral-300 font-bold rounded-xl text-sm transition-all border border-transparent hover:border-neutral-700"
              >
                Bỏ chọn
              </button>
              <button
                onClick={() => { setIsBulkDeleting(true); setActionError(null); }}
                disabled={isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm transition-all flex items-center gap-2 shadow-lg shadow-red-600/20"
              >
                <Trash className="w-4 h-4" />
                Xóa các thẻ đã chọn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Dialog Modal */}
      {editingTag && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-neutral-950 border border-neutral-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-headline font-black text-white">Chỉnh sửa Thẻ</h3>
              <button
                onClick={() => setEditingTag(null)}
                className="text-neutral-500 hover:text-white p-1 hover:bg-neutral-900 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                Tên thẻ gốc
              </label>
              <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-400 font-bold text-sm">
                {editingTag}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                Tên thẻ mới
              </label>
              <input
                type="text"
                placeholder="Nhập tên mới..."
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={isPending}
                className="w-full p-3 bg-neutral-900 border border-neutral-800 text-white rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
              />
            </div>

            {actionError && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setEditingTag(null)}
                disabled={isPending}
                className="px-5 py-3 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 font-bold rounded-xl text-sm transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleRename}
                disabled={isPending}
                className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-all flex items-center gap-2 min-w-[100px] justify-center"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Lưu
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Dialog Modal */}
      {deletingTag && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-neutral-950 border border-red-900/40 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-headline font-black text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                Xác nhận Xóa Thẻ
              </h3>
              <button
                onClick={() => setDeletingTag(null)}
                className="text-neutral-500 hover:text-white p-1 hover:bg-neutral-900 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-neutral-400 leading-relaxed">
              Bạn có chắc chắn muốn xóa thẻ <strong className="text-white">"{deletingTag}"</strong>?
              Hành động này sẽ xóa thẻ ra khỏi toàn bộ bài tập, bài học và câu hỏi liên quan trong hệ thống.
            </p>

            <div className="p-4 bg-red-500/5 border border-red-500/10 text-red-400/90 text-xs font-semibold leading-relaxed rounded-xl">
              Lưu ý: Thao tác này KHÔNG xóa các bài tập hay câu hỏi gốc, chỉ gỡ nhãn thẻ này ra khỏi chúng.
            </div>

            {actionError && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setDeletingTag(null)}
                disabled={isPending}
                className="px-5 py-3 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 font-bold rounded-xl text-sm transition-all"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="px-5 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm transition-all flex items-center gap-2 min-w-[100px] justify-center"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Trash className="w-4 h-4" />
                    Xóa ngay
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Dialog Modal */}
      {isBulkDeleting && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-neutral-950 border border-red-900/40 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-headline font-black text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                Xác nhận Xóa Hàng Loạt
              </h3>
              <button
                onClick={() => setIsBulkDeleting(false)}
                className="text-neutral-500 hover:text-white p-1 hover:bg-neutral-900 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-neutral-400 leading-relaxed">
              Bạn có chắc chắn muốn xóa <strong className="text-white">{selectedTags.length} thẻ</strong> đã chọn?
              Hành động này sẽ gỡ các thẻ này ra khỏi toàn bộ bài tập và câu hỏi liên quan trong hệ thống.
            </p>

            <div className="p-4 bg-red-500/5 border border-red-500/10 text-red-400/90 text-xs font-semibold leading-relaxed rounded-xl">
              Lưu ý: Thao tác này KHÔNG xóa các bài tập hay câu hỏi gốc, chỉ gỡ nhãn thẻ. Quá trình này có thể mất vài giây nếu số lượng bài tập bị ảnh hưởng lớn.
            </div>

            {actionError && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setIsBulkDeleting(false)}
                disabled={isPending}
                className="px-5 py-3 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 font-bold rounded-xl text-sm transition-all"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={isPending}
                className="px-5 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm transition-all flex items-center gap-2 min-w-[100px] justify-center"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Trash className="w-4 h-4" />
                    Xóa {selectedTags.length} thẻ
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Dialog Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-neutral-950 border border-neutral-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-headline font-black text-white">Thêm Thẻ Mới</h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-neutral-500 hover:text-white p-1 hover:bg-neutral-900 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                Tên thẻ mới
              </label>
              <input
                type="text"
                placeholder="Ví dụ: IELTS Speaking, Luyện đọc..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                disabled={isPending}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isPending) {
                    handleCreate();
                  }
                }}
                autoFocus
                className="w-full p-3 bg-neutral-900 border border-neutral-800 text-white rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
              />
            </div>

            {actionError && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setIsCreateOpen(false)}
                disabled={isPending}
                className="px-5 py-3 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 font-bold rounded-xl text-sm transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleCreate}
                disabled={isPending}
                className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-all flex items-center gap-2 min-w-[100px] justify-center"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Tạo thẻ
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
