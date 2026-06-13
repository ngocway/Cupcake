export default function GlobalLoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full">
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-5 rounded-3xl shadow-xl flex flex-col items-center justify-center border border-slate-200/50 dark:border-slate-800/50">
        <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
}
