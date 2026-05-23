import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';

export default async function JoinClassPage({ params }: { params: Promise<{ joinCode: string }> }) {
  const { joinCode } = await params;

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
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Invalid Code</h1>
          <p className="text-slate-500">We couldn't find any class or assignment with this code.</p>
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
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Class Closed</h1>
          <p className="text-slate-500">The teacher has disabled joining this class. Please contact the teacher for more details.</p>
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
              <h1 className="text-2xl font-bold text-slate-800 mb-2">Pending Approval</h1>
              <p className="text-slate-500 mb-6">Your request to join class <strong>{classObj.name}</strong> has been sent. Please wait for the teacher to approve.</p>
              <Link href="/student/dashboard" className="px-6 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors inline-block w-full">
                Back to Dashboard
              </Link>
            </div>
          </div>
        );
      case 'BLOCKED':
        return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans p-4">
            <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🚫</div>
              <h1 className="text-2xl font-bold text-slate-800 mb-2">Cannot Join</h1>
              <p className="text-slate-500">You have been blocked from this class.</p>
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
        
        <h1 className="text-3xl font-extrabold text-slate-800 mb-3 tracking-tight">Join Class</h1>
        
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 mb-8 text-left mt-6">
          <div className="mb-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Class</p>
            <p className="text-lg font-bold text-slate-900">{classObj.name}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Teacher</p>
            <p className="text-slate-800 font-medium">{classObj.teacher.name || classObj.teacher.email}</p>
          </div>
        </div>

        <p className="text-slate-500 mb-8 text-sm">
          You are requesting to join this class. Your request will be sent to the teacher for approval.
        </p>

        <form action={requestJoinClass}>
          <button type="submit" className="w-full px-6 py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 transition-all focus:ring-4 focus:ring-blue-600/30 active:scale-[0.98]">
            Send Join Request
          </button>
        </form>
        
        <div className="mt-4">
          <Link href="/student/dashboard" className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
            Cancel and go back
          </Link>
        </div>
      </div>
    </div>
  );
}
