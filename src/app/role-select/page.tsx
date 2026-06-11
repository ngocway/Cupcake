import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { submitRoleSelection } from "./actions"

export default async function RoleSelectPage() {
  const session = await auth()

  if (!session) {
    redirect("/student/login")
  }

  // Nếu người dùng đã có role, không cho phép đổi nữa (trừ admin)
  if (session.user.role) {
    if (session.user.role === "TEACHER") redirect("/teacher/dashboard")
    if (session.user.role === "STUDENT") redirect("/student/assignments")
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-neutral-100">
      <div className="w-full max-w-lg p-8 space-y-8 bg-white rounded-2xl shadow-lg border border-neutral-200">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-neutral-900">Who are you?</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Hello {session.user.name || session.user.email}! For your first login, please select your role. <br/>
            <strong>Note: You cannot change your role later.</strong>
          </p>
        </div>
        
        <form action={submitRoleSelection} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            type="submit" 
            name="role" 
            value="TEACHER"
            className="flex flex-col items-center justify-center p-6 border-2 border-neutral-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition group"
          >
            <span className="text-4xl mb-3">👨‍🏫</span>
            <span className="font-semibold text-neutral-800 group-hover:text-blue-700">Teacher</span>
            <span className="text-xs text-neutral-500 mt-1 text-center">Create assignments and manage classes</span>
          </button>

          <button 
            type="submit" 
            name="role" 
            value="STUDENT"
            className="flex flex-col items-center justify-center p-6 border-2 border-neutral-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition group"
          >
            <span className="text-4xl mb-3">👨‍🎓</span>
            <span className="font-semibold text-neutral-800 group-hover:text-green-700">Student</span>
            <span className="text-xs text-neutral-500 mt-1 text-center">Join classes and do assignments</span>
          </button>
        </form>
      </div>
    </div>
  )
}
