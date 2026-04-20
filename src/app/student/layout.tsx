import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { NotificationBell } from "@/components/common/NotificationBell"
import { SideNavItem } from "@/app/student/_components/SideNavItem"

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
  
  // Allow both STUDENT and ADMIN (for testing), redirect teachers away
  if (session.user.role !== "STUDENT" && session.user.role !== "ADMIN") {
    redirect("/teacher/dashboard")
  }

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface">
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
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-fixed">
            <img 
              alt="Student Profile Avatar" 
              className="w-full h-full object-cover" 
              src={session.user.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuDG4UeVjdE9vLCqkj7SyCEGler4aGvlCwdYpmqVp0cDgQN-B09pvN9OrtVWynZmUUxvTVP9mAsgSLWx-Ag5kxfQqqRcSdYN61zxDBeCHI71WSlnCIo6Kxz83OBuTEfG3qVktRHHG_LyuaozLOD4wQOQ54OCfGNgnP2_VH7ocpD6u0Ypc3y0Zu52SVqPW0sW4guBb4C06oiwglwM15Fhah6pGngIrtFVsU47mG1qGAnOMnQZFV6fGI_6uFlo89i4ULCFPitxZrmXH4QS"} 
            />
          </div>
        </div>
      </nav>

      {/* SideNavBar */}
      <aside className="h-screen w-64 fixed left-0 top-0 pt-20 bg-slate-50 dark:bg-slate-900 flex-col h-full border-r border-slate-200/50 dark:border-slate-800/50 z-40 hidden md:flex">
        <div className="px-6 py-4">
          <h3 className="font-headline font-bold text-slate-900 dark:text-white text-lg">Learning Path</h3>
          <p className="font-label text-xs text-slate-500 uppercase tracking-widest mt-1">Level B2 Upper-Intermediate</p>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-2">
          <SideNavItem href="/student/dashboard" icon="dashboard" label="Dashboard" />
          <SideNavItem href="/student/lessons" icon="menu_book" label="Lessons" />
          <SideNavItem href="/student/assignments" icon="assignment" label="Assignments" />
          <SideNavItem href="/student/classes" icon="group" label="Classes" />
          <SideNavItem href="/student/growth" icon="trending_up" label="Growth" />
        </nav>
        
        <div className="p-4">
          <button className="w-full bg-gradient-to-br from-primary to-primary-container text-white py-3 rounded-full font-label text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
            Join Live Class
          </button>
        </div>
        
        <div className="px-4 py-6 mt-auto border-t border-slate-200/50">
          <Link className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors" href="/student/settings">
            <span className="material-symbols-outlined text-sm">settings</span>
            <span className="font-label text-sm">Settings</span>
          </Link>
          <a className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors" href="#">
            <span className="material-symbols-outlined text-sm">help_outline</span>
            <span className="font-label text-sm">Help</span>
          </a>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="md:ml-64 pt-24 px-6 pb-24 md:pb-12">
        {children}
      </main>

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

      {/* Floating Action Button */}
      <button className="fixed bottom-24 right-6 md:bottom-8 md:right-8 bg-on-surface text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform z-50 group">
        <span className="material-symbols-outlined text-2xl group-hover:rotate-90 transition-transform">add</span>
      </button>
    </div>
  )
}
