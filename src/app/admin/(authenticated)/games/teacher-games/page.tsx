import {
  getAdminTeacherGamesAction,
  getAdminTeacherBehaviorAnalyticsAction,
} from "@/actions/admin-teacher-games";
import { TeacherGamesClient } from "./TeacherGamesClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Game giáo viên tạo & Phân tích Hành vi | Cupcakes Admin",
};

export default async function AdminTeacherGamesPage() {
  const res = await getAdminTeacherGamesAction();
  const games = res.success && res.games ? res.games : [];
  const analytics = await getAdminTeacherBehaviorAnalyticsAction(games);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
          <span className="material-symbols-outlined text-blue-500 text-4xl">
            joystick
          </span>
          Game giáo viên tạo & Phân tích Hành vi
        </h1>
        <p className="text-neutral-400 mt-2">
          Theo dõi các bài tập do giáo viên thiết kế và phân tích phễu hành vi khám phá, xem video, bấm tạo bài trên cổng /teacher.
        </p>
      </div>

      {/* Main Content */}
      <TeacherGamesClient initialGames={games} analytics={analytics} />
    </div>
  );
}
