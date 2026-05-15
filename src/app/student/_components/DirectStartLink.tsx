"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

interface Props {
  id: string;
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function DirectStartLink({ id, className, children, style }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    startTransition(async () => {
      try {
        const res = await fetch(`/api/assignments/${id}/start`, {
          method: "POST",
        });

        if (res.ok) {
          const data = await res.json();
          if (data.redirectUrl) {
            router.push(data.redirectUrl);
          }
        } else {
          // Fallback to normal navigation if API fails
          router.push(`/student/assignments/${id}/run?direct=true`);
        }
      } catch (error) {
        console.error("Direct start failed:", error);
        router.push(`/student/assignments/${id}/run?direct=true`);
      }
    });
  };

  return (
    <a 
      href={`/student/assignments/${id}/run?direct=true`} 
      onClick={handleClick} 
      style={style}
      className={`${className} ${isPending ? "opacity-70 pointer-events-none" : ""}`}
    >
      {children}
      {isPending && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/20 backdrop-blur-[1px]">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </a>
  );
}
