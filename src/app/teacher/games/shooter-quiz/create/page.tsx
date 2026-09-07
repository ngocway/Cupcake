"use client";

import dynamic from "next/dynamic";
import { HomeShell } from "@/app/_components/HomeShell";
import { Loader2 } from "lucide-react";

const ShooterQuizCreatorUI = dynamic(
  () => import("./ShooterQuizCreatorUI").then((mod) => mod.ShooterQuizCreatorUI),
  {
    ssr: false,
    loading: () => (
      <div className="w-full min-h-[500px] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
        <p className="text-slate-500 font-bold text-sm">Đang tải trình tạo bài tập...</p>
      </div>
    ),
  }
);

export default function ShooterQuizCreatePage() {
  return (
    <HomeShell>
      <div className="w-full pb-20 px-4 md:px-10 max-w-[1680px] mx-auto">
        <ShooterQuizCreatorUI />
      </div>
    </HomeShell>
  );
}
