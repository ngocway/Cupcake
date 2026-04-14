import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function AdminRootPage() {
  const session = await auth()
  
  if (!session || session.user?.role !== "ADMIN") {
    redirect("/admin/login")
  }
  
  redirect("/admin/dashboard")
}
