import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';

export default async function JoinClassPage({ params }: { params: { joinCode: string } }) {
  const { joinCode } = params;

  // 1. Check if class exists by join_code
  const classObj = await prisma.class.findUnique({
    where: { joinCode },
  });

  if (!classObj) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Mã lớp không hợp lệ</h1>
          <p className="text-slate-500">Vui lòng kiểm tra lại liên kết hoặc quét lại mã QR.</p>
        </div>
      </div>
    );
  }

  // 2. Class Security Check
  if (!classObj.isJoinable) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md">
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
    // Bắt buộc đăng nhập, sau đó Redirect lại về đường link QR này
    redirect(`/login?callbackUrl=/join/${joinCode}`);
  }

  const studentId = session.user.id;

  // 4. Auto-join Logic (Không qua Waiting Room)
  const existingEnrollment = await prisma.classEnrollment.findUnique({
    where: {
      studentId_classId: {
        studentId,
        classId: classObj.id
      }
    }
  });

  if (!existingEnrollment) {
    // Insert trực tiếp với trạng thái ACTIVE
    await prisma.classEnrollment.create({
      data: {
        studentId,
        classId: classObj.id,
        status: 'ACTIVE'
      }
    });
  } else if (existingEnrollment.status !== 'ACTIVE') {
    // Tự động chuyển trạng thái thành ACTIVE nếu đang chờ hoặc bị block nhầm
    await prisma.classEnrollment.update({
      where: {
        studentId_classId: { studentId, classId: classObj.id }
      },
      data: { status: 'ACTIVE' }
    });
  }

  // 5. Thả thẳng học sinh vào Dashboard của Lớp
  redirect(`/student/classes/${classObj.id}`);
}
