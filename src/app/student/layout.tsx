import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { NotificationBell } from "@/components/common/NotificationBell"
import { SideNavWrapper } from "@/app/student/_components/SideNavWrapper"
import { MainContentWrapper } from "@/app/student/_components/MainContentWrapper"
import { SideNavItem } from "@/app/student/_components/SideNavItem"
import { StudentUserNav } from "@/components/student/StudentUserNav"

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  
  if (!session) {
    // proxy.ts already redirects non-login pages to /student/login
    // So if we reach here without a session, we must be on /student/login
    return <>{children}</>
  }
  
  if (!session.user.role) {
    redirect("/role-select")
  }
  
  // Allow both STUDENT and ADMIN, and allow TEACHER for learning routes
  const isTeacher = session.user.role === "TEACHER";
  if (session.user.role !== "STUDENT" && session.user.role !== "ADMIN" && !isTeacher) {
    redirect("/teacher/dashboard")
  }

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface">
      {/* Admin/Teacher Impersonation Banner */}
      {(session.user.role === 'ADMIN' || isTeacher) && (
        <div className={`sticky top-0 z-[100] w-full ${isTeacher ? 'bg-primary text-white' : 'bg-amber-500 text-amber-950'} flex items-center justify-between px-6 py-2.5 shadow-lg`}>
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
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl flex justify-between items-center px-6 py-3">
        <div className="flex items-center gap-8">
          <Link href="/student/dashboard" className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50 font-headline">
            Scholar Script
          </Link>
          <div className="hidden md:flex items-center gap-4 bg-surface-container px-4 py-2 rounded-full">
            <span className="material-symbols-outlined text-outline text-sm">search</span>
            <input className="bg-transparent border-none focus:ring-0 text-sm font-label w-48 outline-none" placeholder="Search lessons..." type="text" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <NotificationBell />
          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors rounded-full flex">
            <span className="material-symbols-outlined text-on-surface-variant">translate</span>
          </button>
          <StudentUserNav user={session.user as any} />
        </div>
      </nav>

      {/* SideNavBar - Controlled by Wrapper */}
      <SideNavWrapper isTeacher={isTeacher}>
        <div className="px-6 py-4">
          <h3 className="font-headline font-bold text-slate-900 dark:text-white text-lg">Learning Path</h3>
          <p className="font-label text-xs text-slate-500 uppercase tracking-widest mt-1">Level B2 Upper-Intermediate</p>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-2">
          <SideNavItem href="/student/dashboard" icon="dashboard" label="Dashboard" />
          <SideNavItem href="/student/lessons" icon="menu_book" label="Lessons" />
          <SideNavItem href="/student/assignments" icon="assignment" label="Assignments" />
          <SideNavItem href="/student/bookmarks" icon="bookmark" label="Bookmarks" />
          <SideNavItem href="/student/classes" icon="group" label="Classes" />
          <SideNavItem href="/student/growth" icon="trending_up" label="Growth" />
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
