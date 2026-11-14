import {
  getAdminTeacherGamesAction,
  getAdminTeacherBehaviorAnalyticsAction,
  getAdminGlobalSuccessAnalyticsAction,
} from "@/actions/admin-teacher-games";
import { TeacherGamesClient } from "./TeacherGamesClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Game giáo viên tạo & Phân tích Hành vi | Cupcakes Admin",
};

export default async function AdminTeacherGamesPage() {
  const [gamesRes, globalSuccessAnalytics] = await Promise.all([
    getAdminTeacherGamesAction(),
    getAdminGlobalSuccessAnalyticsAction(),
  ]);
  const games = gamesRes.success && gamesRes.games ? gamesRes.games : [];
  const analytics = await getAdminTeacherBehaviorAnalyticsAction(games);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
          <span className="material-symbols-outlined text-blue-500 text-4xl">
            joystick
          </span>
          Game giáo viên tạo &amp; Phân tích Hành vi
        </h1>
        <p className="text-neutral-400 mt-2">
          Theo dõi các bài tập do giáo viên thiết kế, game Global Success được preview/chia sẻ và phân tích phễu hành vi trên cổng /teacher.
        </p>
      </div>

      {/* Main Content */}
      <TeacherGamesClient
        initialGames={games}
        analytics={analytics}
        globalSuccessAnalytics={globalSuccessAnalytics}
      />
    </div>
  );
}
