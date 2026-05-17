"use client";

import { useTransition } from "react";
import { startOrResumeAttempt } from "./actions";
import { useTranslations } from "next-intl";

interface Props {
  assignmentId: string;
  label: string;
}

export function StartButton({ assignmentId, label }: Props) {
  const t = useTranslations("student.assignmentRun");
  const [isPending, startTransition] = useTransition();

  const handleStart = () => {
    startTransition(async () => {
      await startOrResumeAttempt(assignmentId);
    });
  };

  return (
    <button
      onClick={handleStart}
      disabled={isPending}
      className={`w-full py-4 rounded-3xl font-black text-sm tracking-widest transition-all ${
        isPending 
        ? "bg-primary-container text-primary cursor-not-allowed" 
        : "bg-white text-primary hover:bg-primary-container hover:scale-105 active:scale-95 shadow-xl shadow-primary/20"
      }`}
    >
      {isPending ? t("processing") : label}
    </button>
  );
}
