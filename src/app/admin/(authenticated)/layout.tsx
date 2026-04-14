import { auth } from "@/auth"
import { redirect } from "next/navigation"
import AdminSidebar from "@/components/admin/AdminSidebar"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  
  if (!session || session.user?.role !== "ADMIN") {
    redirect("/admin/login")
  }

  return (
    <div className="flex min-h-screen bg-neutral-950 text-neutral-200">
      <AdminSidebar userName={session.user?.name} />
      
      {/* Main Content */}
      <main className="flex-grow min-h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
