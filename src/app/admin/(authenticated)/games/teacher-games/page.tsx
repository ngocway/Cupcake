import { getAdminTeacherGamesAction } from "@/actions/admin-teacher-games";
import { TeacherGamesClient } from "./TeacherGamesClient";

export const metadata = {
  title: "Game giáo viên tạo | Cupcakes Admin",
};

export default async function AdminTeacherGamesPage() {
  const res = await getAdminTeacherGamesAction();
  const games = res.success && res.games ? res.games : [];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
          <span className="material-symbols-outlined text-blue-500 text-4xl">
            joystick
          </span>
          Game giáo viên tạo
        </h1>
        <p className="text-neutral-400 mt-2">
          Theo dõi và xem trước các game, bài tập tương tác do giáo viên tự thiết kế trên hệ thống.
        </p>
      </div>

      {/* Main Content */}
      <TeacherGamesClient initialGames={games} />
    </div>
  );
}
