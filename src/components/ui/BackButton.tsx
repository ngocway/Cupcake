
"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

interface Props {
  className?: string;
  children?: React.ReactNode;
}

export default function BackButton({ className, children }: Props) {
  const router = useRouter();

  return (
    <button 
      onClick={() => router.back()} 
      className={className || "text-sm font-bold text-slate-500 hover:text-primary transition-colors flex items-center gap-2"}
    >
      {children || (
        <>
          <ChevronLeft className="w-4 h-4" />
          Quay lại
        </>
      )}
    </button>
  );
}
