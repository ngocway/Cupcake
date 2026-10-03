import Link from "next/link";
import { HomeShell } from "@/app/_components/HomeShell";
import { ArrowLeft } from "lucide-react";

export default function GrammarNotFound() {
  return (
    <HomeShell>
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-xs text-3xl">
            📚
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-slate-800 dark:text-white">
              Không tìm thấy bài học ngữ pháp
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
              Chủ đề hoặc bài học ngữ pháp này không tồn tại trong hệ thống. Bạn có thể quay lại danh sách bài tập ngữ pháp để tiếp tục học.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/?tab=exercises"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-colors text-sm shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Xem danh sách bài tập ngữ pháp
            </Link>
          </div>
        </div>
      </div>
    </HomeShell>
  );
}
