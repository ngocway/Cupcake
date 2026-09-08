import { HomeShell } from "@/app/_components/HomeShell";
import { auth } from "@/auth";
import { TeacherLoginModalAuto } from "./_components/TeacherLoginModalAuto";
import { TeacherDashboardClient } from "./_components/TeacherDashboardClient";

export default async function TeacherHomePage({ searchParams }: { searchParams: Promise<any> }) {
  const params = await searchParams;
  const initialTab = params?.tab || "match";
  const session = await auth();
  const isAuthenticated = Boolean(
    session?.user?.id && (session.user.role === "TEACHER" || session.user.role === "ADMIN")
  );

  return (
    <HomeShell>
      <TeacherLoginModalAuto isAuthenticated={isAuthenticated} />
      <TeacherDashboardClient initialTab={initialTab} isAuthenticated={isAuthenticated} />
    </HomeShell>
  );
}

