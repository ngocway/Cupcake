import Link from "next/link";
import { HomeShell } from "@/app/_components/HomeShell";
import { ArrowLeft } from "lucide-react";

export default function ExercisesNotFound() {
  return (
    <HomeShell>
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs text-3xl">
            📝
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-slate-800 dark:text-white">
              Không tìm thấy chủ đề bài tập
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
              Chủ đề hoặc trình độ bạn tìm kiếm không tồn tại trong hệ thống. Bạn có thể chọn chủ đề khác từ danh sách ngữ pháp.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/?tab=exercises"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-colors text-sm shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Chọn chủ đề ngữ pháp khác
            </Link>
          </div>
        </div>
      </div>
    </HomeShell>
  );
}
