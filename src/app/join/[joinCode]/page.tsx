import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { invalidateStudentClassesCache } from '@/lib/cached-queries';
import Link from 'next/link';
import { JoinSubmitButton } from './JoinSubmitButton';
import { JoinLoginTrigger } from './JoinLoginTrigger';
import { TeacherAccountNotice } from './TeacherAccountNotice';

interface JoinClassPageProps {
  params: Promise<{ joinCode: string }>;
  searchParams?: Promise<{ autojoin?: string }>;
}

export default async function JoinClassPage({ params, searchParams }: JoinClassPageProps) {
  const { joinCode } = await params;
  const queryParams = searchParams ? await searchParams : {};

  // 1. Check if class exists by joinCode, classCode, OR id
  const classObj = await prisma.class.findFirst({
    where: {
      OR: [
        { joinCode: joinCode },
        { classCode: joinCode },
        { id: joinCode }
      ],
      deletedAt: null
    },
    include: { teacher: true }
  });

  if (!classObj) {
    // 1.1 Check if it's an assignment ID
    const assignment = await prisma.assignment.findUnique({
      where: { id: joinCode }
    });

    if (assignment) {
      redirect(`/public/assignments/${joinCode}`);
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Mã lớp không hợp lệ</h1>
          <p className="text-slate-500">Không tìm thấy lớp học hoặc bài tập nào với mã này.</p>
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
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Lớp học đã đóng</h1>
          <p className="text-slate-500">Giáo viên đã tạm dừng nhận học sinh mới cho lớp học này.</p>
        </div>
      </div>
    );
  }

  const { id: targetClassId, name: targetClassName, teacherId: targetTeacherId, autoApprove: targetAutoApprove } = classObj;
  const isAutoApprove = targetAutoApprove ?? true;

  // 3. User Authentication
  const session = await auth();
  const user = session?.user;
  const isAuthenticated = Boolean(user?.id);
  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  // 4. Check Enrollment Status for authenticated student
  if (isAuthenticated && !isTeacher && user?.id) {
    const studentId = user.id;
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
          // Đã tham gia lớp -> Chuyển thẳng vào lớp học
          redirect(`/student/classes/${classObj.id}`);
          break;
        case 'PENDING':
          return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans p-4">
              <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full">
                <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">⏳</div>
                <h1 className="text-2xl font-bold text-slate-800 mb-2">Đang chờ phê duyệt</h1>
                <p className="text-slate-500 mb-6">Yêu cầu tham gia lớp <strong>{classObj.name}</strong> của bạn đã được gửi. Vui lòng đợi giáo viên duyệt.</p>
                <Link href="/student/classes" className="px-6 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors inline-block w-full">
                  Về danh sách lớp học
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
      }
    } else if (queryParams.autojoin === '1' && isAutoApprove) {
      // Tự động ghi danh & vào lớp ngay nếu học sinh vừa đăng nhập từ Google
      await prisma.classEnrollment.upsert({
        where: {
          studentId_classId: {
            studentId,
            classId: classObj.id
          }
        },
        create: {
          studentId,
          classId: classObj.id,
          status: 'ACTIVE'
        },
        update: {
          status: 'ACTIVE'
        }
      });

      void (async () => {
        try {
          await invalidateStudentClassesCache(studentId);
          const { createNotification } = await import('@/actions/notification-actions');
          const studentName = user.name || user.email || 'Một học sinh';
          await createNotification(
            classObj.teacherId,
            'ENROLLMENT_SUCCESS',
            'Học sinh mới tham gia lớp',
            `${studentName} vừa tham gia lớp học "${classObj.name}".`,
            `/teacher/classes/${classObj.id}`
          );
        } catch (e) {
          console.error('Auto-join background notification error:', e);
        }
      })();

      redirect(`/student/classes/${classObj.id}`);
    }
  }

  // 5. Server Action to submit request (Fast & Non-blocking)
  async function requestJoinClass(): Promise<{ success: boolean; redirectUrl?: string; error?: string }> {
    'use server';
    
    const currentSession = await auth();
    if (!currentSession?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }
    if (currentSession.user.role === 'TEACHER' || currentSession.user.role === 'ADMIN') {
      return { success: false, error: 'Vui lòng dùng tài khoản Học sinh để tham gia lớp.' };
    }

    const userId = currentSession.user.id;
    const shouldAutoApprove = targetAutoApprove ?? true;
    const targetStatus = shouldAutoApprove ? 'ACTIVE' : 'PENDING';

    // 1. Ghi danh siêu tốc qua primary key index
    await prisma.classEnrollment.upsert({
      where: {
        studentId_classId: {
          studentId: userId,
          classId: targetClassId
        }
      },
      create: {
        studentId: userId,
        classId: targetClassId,
        status: targetStatus
      },
      update: {
        status: targetStatus
      }
    });

    // 2. Tác vụ phụ chạy ngầm trong background (Non-blocking), không làm chậm phản hồi của học sinh
    void (async () => {
      try {
        await invalidateStudentClassesCache(userId);
        if (shouldAutoApprove) {
          const { createNotification } = await import('@/actions/notification-actions');
          const studentName = currentSession.user.name || currentSession.user.email || 'Một học sinh';
          await createNotification(
            targetTeacherId,
            'ENROLLMENT_SUCCESS',
            'Học sinh mới tham gia lớp',
            `${studentName} vừa tham gia lớp học "${targetClassName}".`,
            `/teacher/classes/${targetClassId}`
          );
        }
      } catch (err) {
        console.error('Background join notification error:', err);
      }
    })();

    if (shouldAutoApprove) {
      return { success: true, redirectUrl: `/student/classes/${targetClassId}` };
    } else {
      revalidatePath(`/join/${joinCode}`);
      return { success: true };
    }
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
        
        {/* Class Context Card */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 mb-6 text-left mt-6">
          <div className="mb-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Lớp học</p>
            <p className="text-lg font-bold text-slate-900">{classObj.name}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Giáo viên phụ trách</p>
            <p className="text-slate-800 font-medium">{classObj.teacher.name || classObj.teacher.email}</p>
          </div>
        </div>

        {isAutoApprove ? (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3.5 mb-6 text-sm flex items-center justify-center gap-2">
            <span>✨</span>
            <span>Lớp học mở tham gia trực tiếp. Bạn sẽ vào lớp ngay sau khi bấm nút.</span>
          </div>
        ) : (
          <p className="text-slate-500 mb-6 text-sm">
            Bạn đang yêu cầu tham gia lớp học này. Yêu cầu của bạn sẽ được gửi đến giáo viên để phê duyệt.
          </p>
        )}

        {/* Action Area: 3 distinct user states */}
        {!isAuthenticated ? (
          /* Trạng thái 1: Chưa đăng nhập -> Nút Đăng nhập & Tự động bật Popup LoginModal */
          <JoinLoginTrigger
            classTitle={classObj.name}
            classId={classObj.id}
            isAutoApprove={isAutoApprove}
            onJoin={requestJoinClass}
          />
        ) : isTeacher ? (
          /* Trạng thái 2: Đang là Giáo viên -> Cảnh báo cần tài khoản Học sinh */
          <TeacherAccountNotice email={user?.email} joinCode={joinCode} />
        ) : (
          /* Trạng thái 3: Học sinh đã đăng nhập -> Nút Tham gia lớp (Tối ưu Client Navigation & Prefetch) */
          <JoinSubmitButton
            classId={classObj.id}
            isAutoApprove={isAutoApprove}
            onJoin={requestJoinClass}
          />
        )}
        
        <div className="mt-4">
          <Link 
            href={isAuthenticated ? "/student/classes" : "/"} 
            className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            Hủy và quay lại
          </Link>
        </div>
      </div>
    </div>
  );
}
