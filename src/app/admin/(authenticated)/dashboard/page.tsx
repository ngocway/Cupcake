import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"

export default async function AdminDashboardPage() {
  const session = await auth()
  if (!session || session.user?.role !== "ADMIN") {
    redirect("/admin/login")
  }

  // Get stats from DB
  const [teacherCount, studentCount, lessonCount, assignmentCount, classCount] = await Promise.all([
    prisma.user.count({ where: { role: "TEACHER" } }),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.lesson.count(),
    prisma.assignment.count(),
    prisma.class.count(),
  ])

  const stats = [
    { label: "Giáo viên", value: teacherCount, icon: "person_celebrate", color: "blue" },
    { label: "Học sinh", value: studentCount, icon: "group", color: "purple" },
    { label: "Bài học", value: lessonCount, icon: "auto_stories", color: "emerald" },
    { label: "Bài tập", value: assignmentCount, icon: "assignment", color: "orange" },
    { label: "Lớp học", value: classCount, icon: "class", color: "rose" },
  ]

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Hệ thống Quản trị</h1>
        <p className="text-neutral-400">Chào mừng quay trở lại, {session.user?.name}. Đây là cái nhìn tổng quan về hệ thống.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl hover:border-neutral-700 transition-colors group">
            <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <span className={`material-symbols-outlined text-${stat.color}-500 text-2xl`}>{stat.icon}</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
            <div className="text-sm text-neutral-400 font-medium">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activities Placeholder */}
        <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-neutral-800 flex justify-between items-center">
            <h3 className="font-bold text-white text-lg">Hoạt động gần đây</h3>
            <button className="text-sm text-blue-500 font-bold hover:underline">Xem tất cả</button>
          </div>
          <div className="divide-y divide-neutral-800">
             <div className="p-6 flex items-center gap-4 hover:bg-neutral-800/50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                   <span className="material-symbols-outlined text-blue-500 text-xl">person_add</span>
                </div>
                <div>
                   <p className="text-sm text-white font-medium">Nguyễn Văn A vừa đăng ký tài khoản Giáo viên</p>
                   <p className="text-xs text-neutral-500 mt-1">2 phút trước</p>
                </div>
             </div>
             <div className="p-6 flex items-center gap-4 hover:bg-neutral-800/50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                   <span className="material-symbols-outlined text-emerald-500 text-xl">library_add</span>
                </div>
                <div>
                   <p className="text-sm text-white font-medium">Băng Tâm đã xuất bản bài học "IELTS Writing Task 1"</p>
                   <p className="text-xs text-neutral-500 mt-1">15 phút trước</p>
                </div>
             </div>
             <div className="p-6 flex items-center gap-4 hover:bg-neutral-800/50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                   <span className="material-symbols-outlined text-orange-500 text-xl">report</span>
                </div>
                <div>
                   <p className="text-sm text-white font-medium">Báo cáo vi phạm mới: Bài tập ID #4521</p>
                   <p className="text-xs text-neutral-500 mt-1">1 giờ trước</p>
                </div>
             </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6">
           <h3 className="font-bold text-white text-lg mb-6">Thao tác nhanh</h3>
           <div className="space-y-3">
              <button className="w-full p-4 bg-neutral-800 hover:bg-neutral-700 text-white rounded-2xl flex items-center justify-between group transition-all">
                 <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-blue-500">add_moderator</span>
                    <span className="font-bold text-sm">Thêm Sub-Admin</span>
                 </div>
                 <span className="material-symbols-outlined text-neutral-600 group-hover:translate-x-1 transition-transform">chevron_right</span>
              </button>
              <button className="w-full p-4 bg-neutral-800 hover:bg-neutral-700 text-white rounded-2xl flex items-center justify-between group transition-all">
                 <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-purple-500">verified_user</span>
                    <span className="font-bold text-sm">Duyệt giáo viên</span>
                 </div>
                 <span className="material-symbols-outlined text-neutral-600 group-hover:translate-x-1 transition-transform">chevron_right</span>
              </button>
              <button className="w-full p-4 bg-neutral-800 hover:bg-neutral-700 text-white rounded-2xl flex items-center justify-between group transition-all">
                 <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-emerald-500">campaign</span>
                    <span className="font-bold text-sm">Gửi thông báo Global</span>
                 </div>
                 <span className="material-symbols-outlined text-neutral-600 group-hover:translate-x-1 transition-transform">chevron_right</span>
              </button>
              <button className="w-full p-4 bg-neutral-800 hover:bg-neutral-700 text-white rounded-2xl flex items-center justify-between group transition-all">
                 <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-orange-500">settings</span>
                    <span className="font-bold text-sm">Cấu hình hệ thống</span>
                 </div>
                 <span className="material-symbols-outlined text-neutral-600 group-hover:translate-x-1 transition-transform">chevron_right</span>
              </button>
           </div>
        </div>
      </div>
    </div>
  )
}
