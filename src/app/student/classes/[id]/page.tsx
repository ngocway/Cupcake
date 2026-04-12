import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';

export default async function StudentClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const { id } = await params;
  const userId = session.user.id;

  // Check enrollment
  const enrollment = await prisma.classEnrollment.findUnique({
    where: { studentId_classId: { studentId: userId, classId: id } },
    include: {
      class: {
        include: {
          teacher: true,
          assignments: {
            include: { assignment: true },
            orderBy: { assignedAt: 'desc' }
          }
        }
      }
    }
  });

  if (!enrollment || enrollment.status !== 'ACTIVE') {
    return (
        <div className="flex flex-col flex-1 items-center justify-center p-8 bg-surface-container-lowest text-center">
        <span className="material-symbols-outlined text-6xl text-outline-variant/50 mb-4 block">lock</span>
        <h2 className="text-2xl font-bold mb-2">Không thể truy cập</h2>
        <p className="text-on-surface-variant max-w-md">Bạn không có quyền truy cập vào lớp học này hoặc yêu cầu tham gia của bạn chưa được duyệt.</p>
        <Link href="/student/classes" className="mt-6 px-6 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors">
          Quay lại danh sách lớp
        </Link>
      </div>
    );
  }

  const cls = enrollment.class;
  const assignments = cls.assignments.map(a => a.assignment);

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      
      {/* Header */}
      <div className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 p-10 md:p-14 text-white">
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-1/4 translate-y-1/4 pointer-events-none">
          <span className="material-symbols-outlined text-[200px]" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
        </div>
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex gap-2 text-white/80 font-bold text-xs uppercase tracking-widest mb-4">
            <Link href="/student/classes" className="hover:text-white transition-colors">Lớp học</Link>
            <span>/</span>
            <span>Chi tiết</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">{cls.name}</h1>
          <p className="text-lg text-white/80 max-w-xl font-medium">
            Giáo viên phụ trách: {cls.teacher.name || cls.teacher.email}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Bài tập được giao</h2>
          </div>
          
          <div className="space-y-4">
            {assignments.length > 0 ? (
              assignments.map(assignment => (
                <div key={assignment.id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-surface-container-lowest border border-outline-variant/30 rounded-3xl hover:border-primary/30 transition-colors gap-4 shadow-sm hover:shadow-md">
                  <div className="flex gap-4 items-start sm:items-center">
                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>assignment</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-800">{assignment.title}</h3>
                      <p className="text-sm text-slate-500 font-medium">
                        {assignment.deadline ? `Hạn nộp: ${assignment.deadline.toLocaleDateString()}` : 'Không có hạn nộp'}
                      </p>
                    </div>
                  </div>
                  <Link href={`/student/assignments/${assignment.id}/run`}>
                    <button className="w-full sm:w-auto px-6 py-2.5 bg-slate-100 text-slate-800 hover:bg-primary hover:text-white font-bold rounded-xl transition-all active:scale-95">
                      Vào làm bài
                    </button>
                  </Link>
                </div>
              ))
            ) : (
               <div className="p-12 text-center bg-surface-container-lowest border border-dashed border-outline-variant/30 rounded-3xl">
                <p className="text-on-surface-variant font-medium">Chưa có bài tập nào được giao cho lớp này.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-3xl p-6">
            <h3 className="font-bold text-lg mb-4">Thông tin lớp học</h3>
            <div className="space-y-4">
               <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Mã lớp (Join Code)</p>
                  <p className="font-mono text-sm bg-slate-100 px-3 py-1.5 rounded inline-block">{cls.joinCode}</p>
               </div>
               <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Cấp độ</p>
                  <p className="font-medium text-slate-800">{cls.gradeLevel || 'Không xác định'}</p>
               </div>
               <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Mô tả</p>
                  <p className="font-medium text-slate-800 text-sm">{cls.description || 'Không có mô tả'}</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
