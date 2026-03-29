import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }
  
  if (!session.user.role) {
    redirect("/role-select")
  }
  
  if (session.user.role !== "STUDENT") {
    redirect("/teacher/dashboard") // Redirect if a teacher tries to access student routes
  }

  return (
    <div className="flex flex-col h-screen bg-neutral-50 text-neutral-900">
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b shadow-sm shrink-0">
        <div className="font-bold text-xl tracking-tight text-blue-600">EngMaster</div>
        <div className="flex items-center gap-4 text-sm font-medium">
          <a href="/student/assignments" className="hover:text-blue-600 transition">Bài tập</a>
          <div className="h-8 w-8 rounded-full bg-neutral-200 border border-neutral-300"></div>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto w-full max-w-5xl mx-auto p-4 md:p-8">
        {children}
      </main>
    </div>
  )
}
