import { HomeShell } from "@/app/_components/HomeShell";
import { TeacherHomeSidebar } from "./_components/TeacherHomeSidebar";
import { MatchGameCards } from "./_components/MatchGameCards";
import { MyMatchGamesList } from "./_components/MyMatchGamesList";
import { auth } from "@/auth";
import { TeacherLoginModalAuto } from "./_components/TeacherLoginModalAuto";
import { getTeacherMatchGamesAction, getTeacherFlipGamesAction } from "@/actions/teacher-match-games";

import { MyChoiceGamesList } from "./_components/MyChoiceGamesList";
import { ChoiceGameCards } from "./_components/ChoiceGameCards";
import { FlipGameCards } from "./_components/FlipGameCards";
import { MyFlipGamesList } from "./_components/MyFlipGamesList";

export default async function TeacherHomePage({ searchParams }: { searchParams: Promise<any> }) {
  const params = await searchParams;
  const activeTab = params?.tab || "match";
  const session = await auth();
  const isAuthenticated = Boolean(session?.user?.id && (session.user.role === "TEACHER" || session.user.role === "ADMIN"));

  let initialTopics: any[] = [];
  if (activeTab === "my-match-games" && isAuthenticated) {
    const res = await getTeacherMatchGamesAction();
    if (res.success && res.topics) {
      initialTopics = res.topics;
    }
  }

  let initialFlipTopics: any[] = [];
  if (activeTab === "my-flip-games" && isAuthenticated) {
    const res = await getTeacherFlipGamesAction();
    if (res.success && res.topics) {
      initialFlipTopics = res.topics;
    }
  }

  return (
    <HomeShell>
      <TeacherLoginModalAuto isAuthenticated={isAuthenticated} />
      <div className="w-full pb-20 flex flex-col lg:flex-row items-stretch lg:items-start gap-2 lg:gap-10 px-4 md:px-10 max-w-[1600px] mx-auto">
        <TeacherHomeSidebar />

        <main className="w-full flex-1 min-w-0 min-h-[500px]">
          {activeTab === "match" && <MatchGameCards />}

          {activeTab === "my-match-games" && <MyMatchGamesList initialTopics={initialTopics} />}

          {activeTab === "choice" && <ChoiceGameCards />}

          {activeTab === "my-choice-games" && <MyChoiceGamesList />}

          {activeTab === "flip" && <FlipGameCards />}

          {activeTab === "my-flip-games" && <MyFlipGamesList initialTopics={initialFlipTopics} />}

          {activeTab === "fill" && (
            <div className="w-full h-full min-h-[400px] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-primary/10 p-8 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center mb-4 shadow-sm">
                <span className="material-symbols-outlined text-[36px]">edit_note</span>
              </div>
              <h3 className="font-headline font-black text-xl text-slate-700 dark:text-slate-200">Điền ô trống</h3>
              <p className="text-xs text-slate-400 font-medium max-w-sm mt-1">Nội dung dạng game Điền ô trống sẽ được cập nhật theo yêu cầu tiếp theo.</p>
            </div>
          )}

          {activeTab === "my-fill-games" && (
            <div className="w-full h-full min-h-[400px] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-primary/10 p-8 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center mb-4 shadow-sm">
                <span className="material-symbols-outlined text-[36px]">assignment</span>
              </div>
              <h3 className="font-headline font-black text-xl text-slate-700 dark:text-slate-200">Bài tập Điền ô trống đã tạo</h3>
              <p className="text-xs text-slate-400 font-medium max-w-sm mt-1">Bạn chưa tạo bài tập Điền ô trống nào.</p>
            </div>
          )}
        </main>
      </div>
    </HomeShell>
  );
}
