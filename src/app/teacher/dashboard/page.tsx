import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { 
  CheckCircle2, 
  Clock, 
  FileEdit, 
  GraduationCap, 
  LayoutDashboard, 
  MessageSquare, 
  AlertCircle, 
  Eye, 
  TrendingUp, 
  ChevronRight,
  Plus,
  PlayCircle
} from "lucide-react"

export default async function TeacherDashboard() {
  const session = await auth()

  if (!session?.user?.id || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
    redirect("/teacher/login")
  }

  // Gather actionable data
  const teacher = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      lessons: { where: { deletedAt: null } },
      assignments: { where: { deletedAt: null } },
      inquiries: { 
        where: { status: "PENDING" },
        orderBy: { createdAt: 'desc' },
        take: 5
      }
    }
  });

  if (!teacher) return <div>Không tìm thấy dữ liệu giáo viên.</div>;

  // 1. Pending Tasks Calculations
  const draftMaterials = teacher.assignments.filter(m => m.status === "DRAFT");
  
  // 2. Portfolio Stats
  const hasInquiries = teacher.inquiries.length > 0;
  
  // 3. Overall Activity (Simulated for Demo/Mock)
  const totalViews = teacher.lessons.reduce((acc, l) => acc + (l.viewsCount || 0), 0);

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-slate-900 italic tracking-tight">Chào buổi sáng, {teacher.name.split(' ')[0]}!</h1>
            <p className="text-slate-500 font-medium mt-2">Dưới đây là những việc cần bạn xử lý trong hôm nay.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/teacher/lessons/new" className="flex items-center gap-2 px-6 py-4 bg-white border border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
                <Plus className="w-4 h-4" /> Soạn bài mới
            </Link>
            <Link href="/teacher/profile" className="flex items-center gap-2 px-6 py-4 bg-slate-900 text-white font-bold text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10">
                <LayoutDashboard className="w-4 h-4" /> Quản lý Portfolio
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: MAIN ACTION STREAM */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* 1. Critical Actions Section */}
            <div className="space-y-4">
               <h3 className="text-xs font-black uppercase tracking-[3px] text-slate-400 px-2">Việc cần làm ngay</h3>
               
               <div className="space-y-4">
                  {/* Portfolio Visibility Alert */}
                  {!teacher.isPortfolioPublished && (
                    <div className="bg-amber-50 border border-amber-100 p-6 rounded-[32px] flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                            <div className="size-14 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                                <AlertCircle className="w-7 h-7" />
                            </div>
                            <div>
                                <h4 className="font-bold text-amber-900">Hồ sơ cá nhân chưa được công khai</h4>
                                <p className="text-sm text-amber-700/70">Học sinh không thể tìm thấy bạn. Hãy hoàn thiện và bật chế độ công khai.</p>
                            </div>
                        </div>
                        <Link href="/teacher/profile" className="p-3 bg-white text-amber-600 rounded-xl hover:bg-amber-100 transition-all">
                             <ChevronRight className="w-6 h-6" />
                        </Link>
                    </div>
                  )}

                  {/* Pending Inquiries */}
                  {hasInquiries && (
                    <div className="bg-blue-50 border border-blue-100 p-6 rounded-[32px] flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                            <div className="size-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                                <MessageSquare className="w-7 h-7" />
                            </div>
                            <div>
                                <h4 className="font-bold text-blue-900">Có {teacher.inquiries.length} yêu cầu dạy kèm mới</h4>
                                <p className="text-sm text-blue-700/70">Các học sinh đang chờ bạn phản hồi yêu cầu liên hệ.</p>
                            </div>
                        </div>

                        <Link href="/teacher/profile" className="p-3 bg-white text-blue-600 rounded-xl hover:bg-blue-100 transition-all">
                             <ChevronRight className="w-6 h-6" />
                        </Link>
                    </div>
                  )}

                  {/* Draft Materials Reminder */}
                  {draftMaterials.length > 0 && (
                    <div className="bg-slate-900 p-6 rounded-[32px] flex items-center justify-between text-white group">
                        <div className="flex items-center gap-4">
                            <div className="size-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                <FileEdit className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h4 className="font-bold">Tiếp tục soạn {draftMaterials.length} tài liệu nháp</h4>
                                <p className="text-sm text-white/50">Hoàn thiện các bài tập và học liệu đang chuẩn bị.</p>
                            </div>
                        </div>
                        <Link href="/teacher/materials" className="p-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all">
                             <ChevronRight className="w-6 h-6" />
                        </Link>
                    </div>
                  )}

                  {/* Empty State when no critical tasks */}
                  {!hasInquiries && teacher.isPortfolioPublished && draftMaterials.length === 0 && (
                     <div className="py-12 text-center border-4 border-dashed border-slate-100 rounded-[40px] bg-white">
                        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                        <h4 className="font-bold text-slate-900">Tuyệt vời! Bạn không còn việc tồn đọng.</h4>
                        <p className="text-sm text-slate-500">Hãy tiếp tục sáng tạo những bài giảng mới cho học sinh nhé.</p>
                     </div>
                  )}

               </div>
            </div>

            {/* 2. Engagement Insights (Simplified Report) */}
            <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-[3px] text-slate-400 px-2">Hiệu quả nội dung</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div className="size-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                                <Eye className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black bg-purple-100 text-purple-700 px-3 py-1 rounded-full uppercase">Lượt xem</span>
                        </div>
                        <div className="text-4xl font-black text-slate-900 mb-1">{totalViews.toLocaleString()}</div>
                        <p className="text-slate-500 text-sm font-medium">Tổng lượt xem trên tất cả bài giảng</p>
                    </div>

                    <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div className="size-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black bg-green-100 text-green-700 px-3 py-1 rounded-full uppercase">Tương tác</span>
                        </div>
                        <div className="text-4xl font-black text-slate-900 mb-1">{teacher.lessons.length}</div>
                        <p className="text-slate-500 text-sm font-medium">Bài giảng đã được đăng công khai</p>
                    </div>
                </div>
            </div>
          </div>

          {/* RIGHT: SIDEBAR / QUICK STATS */}
          <div className="space-y-8">
            
            {/* Portfolio Status Card */}
            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
                <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-primary" /> Portfolio Cá nhân
                </h4>
                
                <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-600">Trạng thái:</span>
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${teacher.isPortfolioPublished ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                        {teacher.isPortfolioPublished ? 'Công khai' : 'Đang ẩn'}
                    </span>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-600">Mức giá:</span>
                    <span className="text-sm font-black text-slate-900">{teacher.hourlyRate?.toLocaleString()}đ/h</span>
                </div>

                <Link href={`/teacher/profile/${teacher.id}`} target="_blank" className="w-full py-4 bg-slate-50 text-slate-600 rounded-2xl text-xs font-bold hover:bg-slate-100 transition-colors flex items-center justify-center gap-2">
                    <Eye className="w-4 h-4" /> Xem trang cá nhân
                </Link>
            </div>

            {/* Quick Tips or Reminders */}
            <div className="p-8 rounded-[40px] bg-gradient-to-br from-primary/10 to-indigo-50 border border-primary/10 text-primary-dark">
                <h4 className="font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2 italic">
                    <Clock className="w-4 h-4" /> Mẹo hôm nay
                </h4>
                <p className="text-sm font-medium leading-relaxed opacity-80">
                    "Cập nhật chứng chỉ mới hoặc các bài giảng mẫu thường xuyên sẽ giúp bạn tăng 40% tỉ lệ học sinh liên hệ dạy kèm."
                </p>
                <div className="mt-6">
                    <Link href="/teacher/profile" className="text-xs font-black uppercase tracking-widest underline decoration-2 underline-offset-4">
                        Cập nhật ngay
                    </Link>
                </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}
