import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { NotificationBell } from "@/components/common/NotificationBell"
import { SideNavWrapper } from "@/app/student/_components/SideNavWrapper"
import { MainContentWrapper } from "@/app/student/_components/MainContentWrapper"
import { SideNavItem } from "@/app/student/_components/SideNavItem"
import { PublicHeader } from "@/components/public/PublicHeader"

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  
  if (!session) {
    return <>{children}</>
  }
  
  if (!session.user.role) {
    redirect("/role-select")
  }
  
  const isTeacher = session.user.role === "TEACHER";
  if (session.user.role !== "STUDENT" && session.user.role !== "ADMIN" && !isTeacher) {
    redirect("/teacher/dashboard")
  }

  const publicSession = {
    id: session.user.id!,
    name: session.user.name ?? null,
    image: session.user.image ?? null,
    role: (session.user as any).role ?? null
  };

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface">
      <PublicHeader session={publicSession} />
      
      {/* Admin/Teacher Impersonation Banner */}
      {(session.user.role === 'ADMIN' || isTeacher) && (
        <div className={`sticky top-0 z-[100] w-full ${isTeacher ? 'bg-primary text-white' : 'bg-amber-500 text-amber-950'} flex items-center justify-between px-6 py-2.5 shadow-lg pt-32`}>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">
              {isTeacher ? 'visibility' : 'admin_panel_settings'}
            </span>
            <span className="text-xs font-black uppercase tracking-widest">
              {isTeacher ? 'Bạn đang xem với tư cách Học sinh (Guest Mode)' : 'Admin đang xem giao diện Học sinh'}
            </span>
          </div>
          <a
            href={isTeacher ? "/teacher/materials" : "/admin/staff"}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all border ${
              isTeacher 
                ? 'bg-white/10 hover:bg-white/20 border-white/20' 
                : 'bg-amber-950/10 hover:bg-amber-950/20 border-amber-950/20'
            }`}
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            {isTeacher ? 'Quay lại Library' : 'Thoát về Admin'}
          </a>
        </div>
      )}
      {/* TopNavBar */}
      {/* TopNavBar removed as per user request to hide header on non-homepage routes */}

      {/* SideNavBar - Controlled by Wrapper */}
      <SideNavWrapper isTeacher={isTeacher}>
        <nav className="flex-1 px-4 pb-6 pt-0 space-y-8">
          <div>
            <div className="space-y-1 mb-6">
              <SideNavItem href="/student/dashboard" icon="dashboard" label="Dashboard" />
            </div>
            
            <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Khám phá kiến thức</p>
            <div className="space-y-1">
              <SideNavItem href="/student/lessons?source=public" icon="explore" label="Bài học" />
              <SideNavItem href="/student/assignments?source=public" icon="language" label="Bài tập" />
            </div>
          </div>

          <div>
            <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Nội dung từ Lớp học</p>
            <div className="space-y-1">
              <SideNavItem href="/student/lessons?source=class" icon="menu_book" label="Bài học" comingSoon />
              <SideNavItem href="/student/assignments?source=class" icon="assignment" label="Bài tập" comingSoon />
            </div>
          </div>
          
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-1">
            <SideNavItem href="/student/bookmarks" icon="bookmark" label="Bookmarks" />
            <SideNavItem href="/student/classes" icon="group" label="Classes" comingSoon />
            <SideNavItem href="/student/my-reviews" icon="star" label="Đánh giá của tôi" />
            <SideNavItem href="/student/growth" icon="trending_up" label="Growth" comingSoon />
          </div>
        </nav>
        
        <div className="p-4">
          <button className="w-full bg-gradient-to-br from-primary to-primary-container text-white py-3 rounded-full font-label text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
            Join Live Class
          </button>
        </div>
      </SideNavWrapper>

      {/* Main Content Canvas - Controlled by Wrapper */}
      <MainContentWrapper isTeacher={isTeacher}>
        {children}
      </MainContentWrapper>

      {/* BottomNavBar (Mobile Only) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 flex justify-around items-center py-4 md:hidden z-50">
        <Link className="flex flex-col items-center gap-1 text-primary" href="/student/dashboard">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
          <span className="text-[10px] font-label font-bold">Dash</span>
        </Link>
        <Link className="flex flex-col items-center gap-1 text-slate-400" href="/student/lessons">
          <span className="material-symbols-outlined">menu_book</span>
          <span className="text-[10px] font-label font-bold">Lessons</span>
        </Link>
        <Link className="flex flex-col items-center gap-1 text-slate-400" href="/student/assignments">
          <span className="material-symbols-outlined">assignment</span>
          <span className="text-[10px] font-label font-bold">Work</span>
        </Link>
        <Link className="flex flex-col items-center gap-1 text-slate-400" href="/student/classes">
          <span className="material-symbols-outlined">group</span>
          <span className="text-[10px] font-label font-bold">Class</span>
        </Link>
        <Link className="flex flex-col items-center gap-1 text-slate-400" href="/student/growth">
          <span className="material-symbols-outlined">trending_up</span>
          <span className="text-[10px] font-label font-bold">Growth</span>
        </Link>
      </nav>

    </div>
  )
}
