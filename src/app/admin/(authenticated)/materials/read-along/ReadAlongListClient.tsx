"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CreateBookModal } from "./_components/CreateBookModal";

type BookStatus = "DRAFT" | "PUBLISHED";

interface BookSlide {
  id: string;
  slideNumber: string;
  imageName: string | null;
  imageUrl: string | null;
  text: string;
  orderIndex: number;
}

interface BookWithSlides {
  id: string;
  bookId: string;
  title: string;
  description: string | null;
  mdContent: string | null;
  thumbnailUrl?: string | null;
  status: BookStatus;
  createdAt: string | Date;
  updatedAt: string | Date;
  slides: BookSlide[];
}

interface ReadAlongListClientProps {
  initialBooks: BookWithSlides[];
}

type FilterTab = "all" | "draft" | "published";

export default function ReadAlongListClient({ initialBooks }: ReadAlongListClientProps) {
  const [books, setBooks] = useState<BookWithSlides[]>(initialBooks);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.bookId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      activeFilter === "all" ||
      (activeFilter === "draft" && book.status === "DRAFT") ||
      (activeFilter === "published" && book.status === "PUBLISHED");

    return matchesSearch && matchesFilter;
  });

  const counts = {
    all: books.length,
    draft: books.filter((b) => b.status === "DRAFT").length,
    published: books.filter((b) => b.status === "PUBLISHED").length,
  };

  const handleToggleStatus = async (id: string, currentStatus: BookStatus) => {
    const newStatus: BookStatus = currentStatus === "DRAFT" ? "PUBLISHED" : "DRAFT";
    setTogglingId(id);
    try {
      const res = await fetch(`/api/admin/read-along/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Có lỗi xảy ra.");

      setBooks((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
      );
      toast.success(
        newStatus === "PUBLISHED"
          ? "Đã công bố sách — học sinh có thể thấy bài này!"
          : "Đã chuyển về bản nháp."
      );
    } catch (err: any) {
      toast.error(err.message || "Không thể thay đổi trạng thái.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/read-along/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Có lỗi xảy ra khi xóa.");
      }

      setBooks(books.filter((b) => b.id !== id));
      toast.success("Đã xóa sách thành công!");
      setIsDeletingId(null);
    } catch (err: any) {
      toast.error(err.message || "Xóa sách thất bại.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters & Actions Bar */}
      <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl flex flex-col md:flex-row gap-6 items-center justify-between shadow-xl">
        <div className="relative w-full md:max-w-md">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
            search
          </span>
          <input
            type="text"
            placeholder="Tìm kiếm theo tiêu đề hoặc mã sách..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-2xl outline-none focus:border-blue-500 text-white transition-all text-sm font-medium"
          />
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-[0_4px_20px_rgba(37,99,235,0.25)] text-sm"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Thêm Sách Mới
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(
          [
            { key: "all", label: "Tất cả" },
            { key: "draft", label: "Bản nháp" },
            { key: "published", label: "Đã công bố" },
          ] as { key: FilterTab; label: string }[]
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveFilter(key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border ${
              activeFilter === key
                ? key === "published"
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                  : key === "draft"
                  ? "bg-amber-500/15 border-amber-500/40 text-amber-400"
                  : "bg-blue-500/15 border-blue-500/40 text-blue-400"
                : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-300"
            }`}
          >
            {key === "published" && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            )}
            {key === "draft" && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
            )}
            {label}
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                activeFilter === key
                  ? key === "published"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : key === "draft"
                    ? "bg-amber-500/20 text-amber-300"
                    : "bg-blue-500/20 text-blue-300"
                  : "bg-neutral-800 text-neutral-500"
              }`}
            >
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {/* Grid List */}
      {filteredBooks.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 p-16 rounded-3xl text-center shadow-md">
          <div className="w-20 h-20 bg-neutral-800/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-neutral-800">
            <span className="material-symbols-outlined text-neutral-600 text-4xl">auto_stories</span>
          </div>
          <h3 className="text-white font-bold text-lg mb-2">Chưa có sách Read-Along nào</h3>
          <p className="text-neutral-500 max-w-sm mx-auto text-sm">
            {searchQuery
              ? "Không tìm thấy cuốn sách nào khớp với từ khóa tìm kiếm."
              : activeFilter !== "all"
              ? `Không có sách nào ở trạng thái "${activeFilter === "draft" ? "Bản nháp" : "Đã công bố"}".`
              : "Bấm vào nút 'Thêm Sách Mới' để tạo sách từ bài học hoặc upload ảnh."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map((book) => {
            // Find cover image (slide 01 or orderIndex 0)
            const coverSlide =
              book.slides.find((s) => s.slideNumber === "01" || s.orderIndex === 0) ||
              book.slides[0];
            const coverUrl = book.thumbnailUrl || coverSlide?.imageUrl || "";
            const isDraft = book.status === "DRAFT";
            const isToggling = togglingId === book.id;

            return (
              <div
                key={book.id}
                className={`bg-neutral-900 border rounded-3xl overflow-hidden transition-all flex flex-col group shadow-lg ${
                  isDraft
                    ? "border-amber-900/40 opacity-80 hover:opacity-100 hover:border-amber-700/50"
                    : "border-neutral-800 hover:border-neutral-700"
                }`}
              >
                {/* Book Thumbnail */}
                <Link
                  href={`/admin/materials/read-along/${book.id}`}
                  className="block relative aspect-[16/9] bg-neutral-950 flex items-center justify-center overflow-hidden border-b border-neutral-800 cursor-pointer"
                >
                  {coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={coverUrl}
                      alt={book.title}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-neutral-700">
                      <span className="material-symbols-outlined text-5xl">menu_book</span>
                      <span className="text-[10px] uppercase tracking-widest mt-2 font-bold text-neutral-500">
                        No Cover Image
                      </span>
                    </div>
                  )}
                  <div className="absolute top-4 left-4 bg-neutral-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-neutral-800 text-[11px] font-bold text-blue-400">
                    ID: {book.bookId}
                  </div>
                  {/* Status Badge */}
                  <div
                    className={`absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border backdrop-blur-md text-[11px] font-bold ${
                      isDraft
                        ? "bg-amber-950/70 border-amber-700/50 text-amber-400"
                        : "bg-emerald-950/70 border-emerald-700/50 text-emerald-400"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isDraft ? "bg-amber-400" : "bg-emerald-400 animate-pulse"
                      }`}
                    />
                    {isDraft ? "Bản nháp" : "Public"}
                  </div>
                </Link>

                {/* Card Content */}
                <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <Link href={`/admin/materials/read-along/${book.id}`}>
                      <h3 className="text-white font-bold text-lg line-clamp-1 group-hover:text-blue-400 transition-colors hover:text-blue-400 cursor-pointer">
                        {book.title}
                      </h3>
                    </Link>
                    <p className="text-neutral-500 text-xs line-clamp-2 leading-relaxed">
                      {book.description || "Không có mô tả cho cuốn sách này."}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-neutral-400 border-t border-neutral-800/60 pt-4">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm text-neutral-500">
                        splitscreen
                      </span>
                      <span>{book.slides.length} slide trang</span>
                    </div>
                    <div>{new Date(book.createdAt).toLocaleDateString("vi-VN")}</div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    {/* Toggle Status Button */}
                    <button
                      onClick={() => handleToggleStatus(book.id, book.status)}
                      disabled={isToggling}
                      className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border disabled:opacity-50 ${
                        isDraft
                          ? "bg-emerald-950/20 hover:bg-emerald-900/30 text-emerald-400 hover:text-emerald-300 border-emerald-900/30 hover:border-emerald-800/50"
                          : "bg-amber-950/20 hover:bg-amber-900/30 text-amber-400 hover:text-amber-300 border-amber-900/30 hover:border-amber-800/50"
                      }`}
                    >
                      {isToggling ? (
                        <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <span className="material-symbols-outlined text-sm">
                          {isDraft ? "publish" : "unpublished"}
                        </span>
                      )}
                      {isToggling
                        ? "Đang cập nhật..."
                        : isDraft
                        ? "Công bố"
                        : "Bỏ công bố"}
                    </button>

                    <button
                      onClick={() => setIsDeletingId(book.id)}
                      className="flex-1 px-4 py-2.5 bg-red-950/20 hover:bg-red-900/20 text-red-400 hover:text-red-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border border-red-900/30"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                      Xóa sách
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      {isDeletingId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-950/30 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-900/30">
              <span className="material-symbols-outlined text-red-500 text-3xl">warning</span>
            </div>
            <h3 className="text-white text-lg font-bold text-center mb-2">Bạn có chắc chắn muốn xóa?</h3>
            <p className="text-neutral-400 text-sm text-center mb-6 leading-relaxed">
              Hành động này sẽ xóa vĩnh viễn cuốn sách này cùng toàn bộ thông tin slide khỏi cơ sở dữ liệu.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button
                disabled={isDeleting}
                onClick={() => setIsDeletingId(null)}
                className="py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-2xl text-sm font-bold transition-all border border-neutral-700 disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                disabled={isDeleting}
                onClick={() => isDeletingId && handleDelete(isDeletingId)}
                className="py-3 bg-red-600 hover:bg-red-500 text-white rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang xóa...
                  </>
                ) : (
                  "Xác nhận xóa"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Book Modal */}
      <CreateBookModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </div>
  );
}
