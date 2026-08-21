import { HomeShell } from "@/app/_components/HomeShell";
import { TeacherHomeSidebar } from "./_components/TeacherHomeSidebar";
import { MatchGameCards } from "./_components/MatchGameCards";

export default async function TeacherHomePage({ searchParams }: { searchParams: Promise<any> }) {
  const params = await searchParams;
  const activeTab = params?.tab || "match";

  return (
    <HomeShell>
      <div className="w-full pb-20 flex flex-col lg:flex-row items-stretch lg:items-start gap-2 lg:gap-10 px-4 md:px-10 max-w-[1600px] mx-auto">
        <TeacherHomeSidebar />

        <main className="w-full flex-1 min-w-0 min-h-[500px]">
          {activeTab === "match" ? (
            <MatchGameCards />
          ) : (
            <div className="w-full h-full min-h-[400px] bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-3xl border border-primary/10 p-8 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center mb-4 shadow-sm">
                <span className="material-symbols-outlined text-[36px]">edit_note</span>
              </div>
              <h3 className="font-headline font-black text-xl text-slate-700 dark:text-slate-200">Điền ô trống</h3>
              <p className="text-xs text-slate-400 font-medium max-w-sm mt-1">Nội dung dạng game Điền ô trống sẽ được cập nhật theo yêu cầu tiếp theo.</p>
            </div>
          )}
        </main>
      </div>
    </HomeShell>
  );
}
