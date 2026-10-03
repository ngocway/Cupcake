import Link from "next/link";

export default function GlobalNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="text-6xl">🎂</div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-slate-800 dark:text-white">
            404 - Không tìm thấy trang
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
            Trang bạn tìm kiếm không tồn tại hoặc đã được chuyển sang địa chỉ mới.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl transition-all shadow-sm text-sm"
        >
          ← Về trang chủ
        </Link>
      </div>
    </div>
  );
}
