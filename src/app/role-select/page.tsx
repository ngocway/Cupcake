import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { submitRoleSelection } from "./actions"

export default async function RoleSelectPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
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
          <h1 className="text-3xl font-bold text-neutral-900">Bạn là ai?</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Xin chào {session.user.name || session.user.email}! Lần đầu đăng nhập, bạn vui lòng chọn vai trò của mình. <br/>
            <strong>Lưu ý: Bạn không thể tự thay đổi vai trò sau khi đã chọn.</strong>
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
            <span className="font-semibold text-neutral-800 group-hover:text-blue-700">Giáo Viên</span>
            <span className="text-xs text-neutral-500 mt-1 text-center">Tạo bài tập và quản lý lớp học</span>
          </button>

          <button 
            type="submit" 
            name="role" 
            value="STUDENT"
            className="flex flex-col items-center justify-center p-6 border-2 border-neutral-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition group"
          >
            <span className="text-4xl mb-3">👨‍🎓</span>
            <span className="font-semibold text-neutral-800 group-hover:text-green-700">Học Sinh</span>
            <span className="text-xs text-neutral-500 mt-1 text-center">Tham gia lớp và làm bài tập</span>
          </button>
        </form>
      </div>
    </div>
  )
}
