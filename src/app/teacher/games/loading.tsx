import { Loader2, Sparkles } from "lucide-react";

export default function TeacherGameStudioLoading() {
  return (
    <div className="w-full min-h-[65vh] flex items-center justify-center p-6">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-amber-200/80 dark:border-slate-800 p-8 sm:p-10 shadow-xl max-w-md w-full flex flex-col items-center text-center space-y-4 animate-in fade-in duration-200">
        <div className="relative w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center shadow-xs">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
          <Sparkles className="w-5 h-5 text-amber-400 absolute -top-1.5 -right-1.5 animate-pulse" />
        </div>
        <div className="space-y-1.5">
          <h3 className="font-headline font-black text-lg text-slate-800 dark:text-white">
            Đang mở trình chỉnh sửa...
          </h3>
          <p className="text-xs font-medium text-slate-400">
            Vui lòng đợi trong giây lát, hệ thống đang tải bộ câu hỏi của bạn.
          </p>
        </div>
      </div>
    </div>
  );
}

