import Link from 'next/link';

export default function LessonNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-slate-800 px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="text-7xl">📚</div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-800 dark:text-white">
            Không tìm thấy bài học
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
            Bài học này không tồn tại hoặc đã bị xóa. Vui lòng quay lại trang trước.
          </p>
        </div>
        <Link
          href="/student/classes"
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors text-sm"
        >
          ← Quay lại lớp học
        </Link>
      </div>
    </div>
  );
}
