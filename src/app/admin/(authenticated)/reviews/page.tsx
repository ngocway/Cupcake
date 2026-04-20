
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { 
  CheckCircle, 
  Trash2, 
  MessageSquare, 
  Star, 
  User as UserIcon,
  BookOpen,
  Clock,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import ReviewManagementClient from "./ReviewManagementClient";

export default async function AdminReviewsPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/student/login");
  }

  const reviews = await prisma.lessonReview.findMany({
    include: {
      student: { select: { name: true, image: true, email: true } },
      lesson: { select: { title: true, id: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  const pendingCount = reviews.filter(r => !r.isApproved).length;

  return (
    <div className="p-8 space-y-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest">
             <ShieldCheck className="w-4 h-4" />
             Quản trị hệ thống
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Duyệt đánh giá bài học</h1>
          <p className="text-slate-500 font-medium">
             Quản lý và kiểm duyệt các phản hồi từ học sinh để đảm bảo chất lượng nội dung.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="bg-amber-50 px-6 py-4 rounded-2xl border border-amber-100 flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center text-white font-black">
                 {pendingCount}
              </div>
              <div>
                 <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest leading-none">Chờ duyệt</p>
                 <p className="text-sm font-bold text-slate-900 mt-1">Yêu cầu mới</p>
              </div>
           </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-4 bg-primary/10 rounded-2xl text-primary"><MessageSquare className="w-6 h-6" /></div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng đánh giá</p>
               <p className="text-2xl font-black text-slate-900">{reviews.length}</p>
            </div>
         </div>
         <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-4 bg-green-100 rounded-2xl text-green-600"><CheckCircle className="w-6 h-6" /></div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đã phê duyệt</p>
               <p className="text-2xl font-black text-slate-900">{reviews.filter(r => r.isApproved).length}</p>
            </div>
         </div>
         <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-4 bg-amber-100 rounded-2xl text-amber-600"><Star className="w-6 h-6" /></div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Điểm trung bình</p>
               <p className="text-2xl font-black text-slate-900">
                  {reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : "0.0"}
               </p>
            </div>
         </div>
      </div>

      {/* Main Table/List Section */}
      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
         <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Danh sách phản hồi</h2>
         </div>
         
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                     <th className="px-8 py-6">Học viên / Bài học</th>
                     <th className="px-8 py-6">Đánh giá</th>
                     <th className="px-8 py-6">Nội dung</th>
                     <th className="px-8 py-6">Ngày gửi</th>
                     <th className="px-8 py-6">Trạng thái</th>
                     <th className="px-8 py-6 text-right">Thao tác</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {reviews.length > 0 ? (
                    <ReviewManagementClient reviews={reviews} />
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-8 py-20 text-center">
                         <div className="space-y-2">
                            <AlertCircle className="w-10 h-10 text-slate-200 mx-auto" />
                            <p className="text-slate-400 font-bold italic">Chưa có đánh giá nào được gửi lên hệ thống.</p>
                         </div>
                      </td>
                    </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
