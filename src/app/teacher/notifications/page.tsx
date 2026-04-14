import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { 
  Bell, 
  CheckCircle2, 
  Trash2, 
  Filter, 
  Calendar, 
  BookOpen, 
  UserPlus, 
  Star,
  ChevronRight,
  Inbox,
  Clock
} from "lucide-react"

export default async function NotificationCenter() {
  const session = await auth()

  if (!session?.user?.id || session.user.role !== "TEACHER") {
    redirect("/teacher/login")
  }

  // Fetch all notifications for the teacher
  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      <div className="max-w-4xl mx-auto px-6 py-12">
        
        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 italic font-headline tracking-tight flex items-center gap-4">
              Trung tâm Thông báo
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] not-italic px-3 py-1 rounded-full font-black uppercase tracking-widest">
                  {unreadCount} Mới
                </span>
              )}
            </h1>
            <p className="text-slate-500 font-medium mt-2">Theo dõi và quản lý toàn bộ tương tác từ học sinh của bạn.</p>
          </div>
          
          <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
             <CheckCircle2 className="w-4 h-4" /> Đọc tất cả
          </button>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-wrap gap-2 mb-8 p-1.5 bg-slate-100 rounded-[24px] w-fit">
            <button className="px-6 py-2.5 bg-white text-slate-900 font-black text-[10px] uppercase tracking-widest rounded-[18px] shadow-sm">Tất cả</button>
            <button className="px-6 py-2.5 text-slate-500 font-black text-[10px] uppercase tracking-widest rounded-[18px] hover:text-slate-900 transition-colors">Chưa đọc</button>
            <button className="px-6 py-2.5 text-slate-500 font-black text-[10px] uppercase tracking-widest rounded-[18px] hover:text-slate-900 transition-colors">Bài tập</button>
            <button className="px-6 py-2.5 text-slate-500 font-black text-[10px] uppercase tracking-widest rounded-[18px] hover:text-slate-900 transition-colors">Lớp học</button>
            <button className="px-6 py-2.5 text-slate-500 font-black text-[10px] uppercase tracking-widest rounded-[18px] hover:text-slate-900 transition-colors">Portfolio</button>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {notifications.length > 0 ? (
            notifications.map((n) => (
              <div 
                key={n.id} 
                className={`group p-6 rounded-[2rem] border transition-all duration-300 flex items-start gap-6 ${
                  !n.isRead 
                  ? "bg-white border-primary/20 shadow-xl shadow-primary/5 ring-1 ring-primary/5" 
                  : "bg-white/50 border-slate-100 opacity-80 hover:opacity-100 hover:bg-white"
                }`}
              >
                {/* Icon Column */}
                <div className={`shrink-0 size-14 rounded-2xl flex items-center justify-center shadow-sm ${
                    n.type === 'NEW_ASSIGNMENT' ? 'bg-amber-50 text-amber-500' :
                    n.type === 'ENROLLMENT_REQUEST' ? 'bg-blue-50 text-blue-500' :
                    n.type === 'NEW_REVIEW' ? 'bg-purple-50 text-purple-500' :
                    'bg-slate-50 text-slate-400'
                }`}>
                    {n.type === 'NEW_ASSIGNMENT' && <BookOpen className="w-6 h-6" />}
                    {n.type === 'ENROLLMENT_REQUEST' && <UserPlus className="w-6 h-6" />}
                    {n.type === 'NEW_REVIEW' && <Star className="w-6 h-6" />}
                    {!['NEW_ASSIGNMENT', 'ENROLLMENT_REQUEST', 'NEW_REVIEW'].includes(n.type) && <Bell className="w-6 h-6" />}
                </div>

                {/* Content Column */}
                <div className="flex-1 min-w-0 py-1">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-black uppercase tracking-[2px] text-slate-400">
                            {n.type === 'NEW_ASSIGNMENT' ? 'Bài tập' :
                             n.type === 'ENROLLMENT_REQUEST' ? 'Lớp học' :
                             n.type === 'NEW_REVIEW' ? 'Đánh giá' : 'Thông báo'}
                        </span>
                        <div className="flex items-center gap-2 text-slate-400">
                            <Clock className="w-3 h-3" />
                            <span className="text-[10px] font-bold">{new Date(n.createdAt).toLocaleString('vi-VN')}</span>
                        </div>
                    </div>
                    <h3 className={`text-lg leading-tight ${!n.isRead ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>
                        {n.title}
                    </h3>
                    <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                        {n.message}
                    </p>
                    
                    {/* Action Link if exists */}
                    {n.link && (
                        <Link 
                            href={n.link}
                            className="inline-flex items-center gap-2 mt-4 text-xs font-black text-primary uppercase tracking-widest hover:gap-3 transition-all"
                        >
                            Xử lý ngay <ChevronRight className="w-4 h-4" />
                        </Link>
                    )}
                </div>

                {/* Sidebar Actions in card */}
                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all" title="Xóa thông báo">
                        <Trash2 className="w-5 h-5" />
                    </button>
                    {!n.isRead && (
                        <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-green-50 hover:text-green-600 transition-all" title="Đánh dấu đã đọc">
                            <CheckCircle2 className="w-5 h-5" />
                        </button>
                    )}
                </div>
              </div>
            ))
          ) : (
            <div className="py-24 text-center bg-white rounded-[40px] border border-dashed border-slate-200">
                <div className="size-20 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Inbox className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-black text-slate-900">Hộp thư trống</h3>
                <p className="text-slate-400 mt-2">Bạn không có thông báo nào vào lúc này.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
