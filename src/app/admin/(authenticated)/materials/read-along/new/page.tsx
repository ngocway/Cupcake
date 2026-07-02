"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

export default function NewReadAlongPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [mdFile, setMdFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [errors, setErrors] = useState<{
    message: string;
    missingImages?: string[];
  } | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setImageFiles(filesArray);
    }
  };

  const handleMdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMdFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(null);

    if (!title.trim() || !mdFile) {
      toast.error("Vui lòng điền đầy đủ các thông tin bắt buộc.");
      return;
    }

    setLoading(true);
    setUploadStatus("Đang chuẩn bị tải lên...");

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("mdFile", mdFile);
    
    imageFiles.forEach((file) => {
      formData.append("images", file);
    });

    try {
      setUploadStatus("Đang phân tích file .md và tải ảnh lên Cloudflare R2...");
      const res = await fetch("/api/admin/read-along", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setErrors({
          message: data.error || "Tạo sách thất bại.",
          missingImages: data.missingImages,
        });
        toast.error("Tải lên thất bại. Vui lòng kiểm tra lại lỗi chi tiết.");
        return;
      }

      toast.success("Sách Read-Along đã được tải lên thành công!");
      router.push("/admin/materials/read-along");
      router.refresh();
    } catch (err: any) {
      setErrors({
        message: err.message || "Đã xảy ra lỗi kết nối mạng trong quá trình upload.",
      });
      toast.error("Kết nối thất bại.");
    } finally {
      setLoading(false);
      setUploadStatus("");
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Thêm Sách Read-Along Mới</h1>
          <p className="text-neutral-400 text-sm">
            Tạo sách bằng cách nhập tiêu đề, chọn file cấu trúc `.md` và tải lên hàng loạt ảnh sách.
          </p>
        </div>
        <Link
          href="/admin/materials/read-along"
          className="px-5 py-2.5 bg-neutral-850 hover:bg-neutral-800 text-neutral-300 rounded-2xl font-bold flex items-center justify-center gap-1.5 transition-all text-xs border border-neutral-800"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Quay lại danh sách
        </Link>
      </div>

      {/* Main Content Card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Metadata Section */}
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-bold text-neutral-300">
              Tiêu đề sách <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              required
              disabled={loading}
              placeholder="Ví dụ: We want to go to the playground"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-2xl outline-none focus:border-blue-500 text-white transition-all text-sm font-medium"
            />
            <span className="text-[10px] text-neutral-500 block">
              Tên hiển thị chính của cuốn sách cho học sinh. Mã sách định danh (slug) sẽ được tự sinh từ tiêu đề này.
            </span>
          </div>

          <hr className="border-neutral-800 my-6" />

          {/* Files Upload Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Markdown File */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-neutral-300 flex items-center gap-1">
                File cấu trúc Markdown (.md) <span className="text-red-500">*</span>
              </label>
              <div className="relative border-2 border-dashed border-neutral-700 hover:border-neutral-500 rounded-2xl p-6 text-center cursor-pointer transition-all bg-neutral-850/30">
                <input
                  type="file"
                  required
                  disabled={loading}
                  accept=".md"
                  onChange={handleMdChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <span className="material-symbols-outlined text-neutral-500 text-3xl mb-2">
                  description
                </span>
                <p className="text-xs font-bold text-neutral-300">
                  {mdFile ? mdFile.name : "Chọn file slides.md"}
                </p>
                <p className="text-[10px] text-neutral-500 mt-1">Hỗ trợ định dạng file .md</p>
              </div>
            </div>

            {/* Images Bulk Select */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-neutral-300 flex items-center gap-1">
                Bộ ảnh các trang (Images) <span className="text-red-500">*</span>
              </label>
              <div className="relative border-2 border-dashed border-neutral-700 hover:border-neutral-500 rounded-2xl p-6 text-center cursor-pointer transition-all bg-neutral-850/30">
                <input
                  type="file"
                  required
                  multiple
                  disabled={loading}
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <span className="material-symbols-outlined text-neutral-500 text-3xl mb-2">
                  collections
                </span>
                <p className="text-xs font-bold text-neutral-300">
                  {imageFiles.length > 0
                    ? `Đã chọn ${imageFiles.length} file ảnh`
                    : "Chọn nhiều file ảnh"}
                </p>
                <p className="text-[10px] text-neutral-500 mt-1">
                  Chọn cùng lúc tất cả ảnh của các slide
                </p>
              </div>
            </div>
          </div>

          {/* List of Selected Images */}
          {imageFiles.length > 0 && (
            <div className="mt-4 p-4 bg-neutral-800/40 rounded-2xl border border-neutral-800 text-[11px] text-neutral-400 space-y-2">
              <div className="font-bold text-neutral-300 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">collections</span>
                Ảnh đã chọn ({imageFiles.length})
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto custom-scrollbar pr-2">
                {imageFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 bg-neutral-950 px-2.5 py-1.5 rounded-xl border border-neutral-800 truncate"
                  >
                    <span className="material-symbols-outlined text-[12px] text-neutral-500">
                      image
                    </span>
                    <span className="truncate">{file.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Details Board */}
          {errors && (
            <div className="p-5 bg-red-950/20 border border-red-900/30 rounded-2xl text-xs space-y-3 animate-in fade-in slide-in-from-top-3 duration-200">
              <div className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-red-500 text-lg">error</span>
                <div className="font-bold text-red-400 text-sm">{errors.message}</div>
              </div>

              {errors.missingImages && errors.missingImages.length > 0 && (
                <div className="space-y-2 pl-7">
                  <div className="font-bold text-neutral-300">
                    Các file ảnh bị thiếu trong danh sách tải lên (Vui lòng bổ sung):
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto custom-scrollbar">
                    {errors.missingImages.map((name, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1 bg-neutral-900/60 text-red-300 px-2 py-1 rounded-lg border border-red-950/50"
                      >
                        <span className="material-symbols-outlined text-[12px]">close</span>
                        <span>{name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-[0_4px_20px_rgba(37,99,235,0.25)] text-sm disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>{uploadStatus}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">cloud_upload</span>
                  Tải lên & Khởi tạo sách
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
