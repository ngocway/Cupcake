import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';

export default async function JoinClassPage({ params }: { params: Promise<{ joinCode: string }> }) {
  const { joinCode } = await params;

  // 1. Check if class exists by join_code
  const classObj = await prisma.class.findUnique({
    where: { joinCode },
    include: { teacher: true }
  });

  if (!classObj) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Mã lớp không hợp lệ</h1>
          <p className="text-slate-500">Vui lòng kiểm tra lại liên kết hoặc quét lại mã QR.</p>
        </div>
      </div>
    );
  }

  // 2. Class Security Check
  if (!classObj.isJoinable) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full">
           <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🔒</div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Lớp học đã đóng cửa</h1>
          <p className="text-slate-500">Giáo viên đã khóa chức năng tham gia lớp học này. Vui lòng liên hệ giáo viên để biết thêm chi tiết.</p>
        </div>
      </div>
    );
  }

  // 3. User Authentication
  const session = await auth();
  if (!session?.user?.id) {
    // TH1: Học sinh chưa đăng nhập
    redirect(`/login?callbackUrl=/join/${joinCode}`);
  }

  const studentId = session.user.id;

  // 4. Check Enrollment Status
  const existingEnrollment = await prisma.classEnrollment.findUnique({
    where: {
      studentId_classId: {
        studentId,
        classId: classObj.id
      }
    }
  });

  if (existingEnrollment) {
    switch(existingEnrollment.status) {
      case 'ACTIVE':
         redirect(`/student/classes/${classObj.id}`);
         break;
      case 'PENDING':
        return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans p-4">
            <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">⏳</div>
              <h1 className="text-2xl font-bold text-slate-800 mb-2">Đang chờ duyệt</h1>
              <p className="text-slate-500 mb-6">Yêu cầu tham gia lớp <strong>{classObj.name}</strong> của bạn đã được gửi. Vui lòng đợi giáo viên phê duyệt.</p>
              <Link href="/student/dashboard" className="px-6 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors inline-block w-full">
                Quay về trang chủ
              </Link>
            </div>
          </div>
        );
      case 'BLOCKED':
        return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans p-4">
            <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🚫</div>
              <h1 className="text-2xl font-bold text-slate-800 mb-2">Không thể tham gia</h1>
              <p className="text-slate-500">Bạn đã bị chặn khỏi lớp học này.</p>
            </div>
          </div>
        );
      case 'INVITED':
        // Nếu đã được mời, có thể tự động duyệt hoặc hiển thị popup xác nhận
        break;
    }
  }

  // 5. Server Action to submit request (TH2)
  async function requestJoinClass() {
    'use server';
    
    // Security check again inside action
    const currentSession = await auth();
    if (!currentSession?.user?.id) throw new Error("Unauthorized");
    
    const curClass = await prisma.class.findUnique({ where: { joinCode } });
    if (!curClass || !curClass.isJoinable) throw new Error("Class not joinable");

    const userId = currentSession.user.id;

    // Create or update existing block/invite
    await prisma.classEnrollment.upsert({
      where: {
        studentId_classId: {
          studentId: userId,
          classId: curClass.id
        }
      },
      create: {
        studentId: userId,
        classId: curClass.id,
        status: 'PENDING'
      },
      update: {
        status: 'PENDING'
      }
    });

    revalidatePath(`/join/${joinCode}`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-60 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-50 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 opacity-60 pointer-events-none"></div>

      <div className="bg-white p-8 md:p-10 rounded-3xl shadow-xl shadow-slate-200/50 text-center max-w-lg w-full relative z-10 border border-slate-100">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 text-4xl shadow-lg shadow-blue-500/30">
          🏫
        </div>
        
        <h1 className="text-3xl font-extrabold text-slate-800 mb-3 tracking-tight">Tham gia lớp học</h1>
        
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 mb-8 text-left mt-6">
          <div className="mb-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Lớp học</p>
            <p className="text-lg font-bold text-slate-900">{classObj.name}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Giáo viên</p>
            <p className="text-slate-800 font-medium">{classObj.teacher.name || classObj.teacher.email}</p>
          </div>
        </div>

        <p className="text-slate-500 mb-8 text-sm">
          Bạn đang yêu cầu tham gia vào lớp học này. Yêu cầu của bạn sẽ được gửi đến giáo viên để chờ phê duyệt.
        </p>

        <form action={requestJoinClass}>
          <button type="submit" className="w-full px-6 py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 transition-all focus:ring-4 focus:ring-blue-600/30 active:scale-[0.98]">
            Gửi yêu cầu tham gia
          </button>
        </form>
        
        <div className="mt-4">
          <Link href="/student/dashboard" className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
            Hủy và quay lại
          </Link>
        </div>
      </div>
    </div>
  );
}
