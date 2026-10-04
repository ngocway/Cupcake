"use client";

interface CenteredLoginLoaderProps {
  isVisible: boolean;
  color?: "emerald" | "purple";
}

export function CenteredLoginLoader({ isVisible, color = "emerald" }: CenteredLoginLoaderProps) {
  if (!isVisible) return null;

  const spinnerColorClass = color === "purple"
    ? "border-purple-500/25 border-t-purple-600"
    : "border-emerald-500/25 border-t-emerald-600";

  return (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/5 dark:bg-black/20 pointer-events-auto select-none cursor-wait animate-in fade-in duration-150"
      aria-label="Loading"
      role="status"
    >
      <div className={`w-14 h-14 border-4 ${spinnerColorClass} rounded-full animate-spin filter drop-shadow-md`} />
    </div>
  );
}
