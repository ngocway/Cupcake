import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Lock, GraduationCap, ClipboardList } from 'lucide-react';

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
        <div className="flex flex-col flex-1 items-center justify-center p-8 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 text-center rounded-3xl shadow-sm">
        <Lock className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4 mx-auto stroke-[1.5px]" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-md">You do not have permission to access this class or your request has not been approved yet.</p>
        <Link href="/student/classes" className="mt-6 px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
          Back to class list
        </Link>
      </div>
    );
  }

  const cls = enrollment.class;
  const assignments = cls.assignments.map(a => a.assignment);

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      
      {/* Header */}
      <div className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 p-10 md:p-14 text-white shadow-lg">
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-1/4 translate-y-1/4 pointer-events-none">
          <GraduationCap className="w-[200px] h-[200px] text-white stroke-[1.5px]" />
        </div>
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex gap-2 text-white/80 font-bold text-xs uppercase tracking-widest mb-4">
            <Link href="/student/classes" className="hover:text-white transition-colors">Classes</Link>
            <span>/</span>
            <span>Details</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">{cls.name}</h1>
          <p className="text-lg text-white/80 max-w-xl font-medium">
            Teacher: {cls.teacher.name || cls.teacher.email}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Assigned Tasks</h2>
          </div>
          
          <div className="space-y-4">
            {assignments.length > 0 ? (
              assignments.map(assignment => (
                <div key={assignment.id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 rounded-3xl hover:border-blue-500/30 transition-colors gap-4 shadow-sm hover:shadow-md">
                  <div className="flex gap-4 items-start sm:items-center">
                    <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                      <ClipboardList className="w-7 h-7 stroke-[1.5px]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white">{assignment.title}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                        {assignment.deadline ? `Deadline: ${assignment.deadline.toLocaleDateString()}` : 'No deadline'}
                      </p>
                    </div>
                  </div>
                  <Link href={`/student/assignments/${assignment.id}/run`}>
                    <button className="w-full sm:w-auto px-6 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white hover:bg-blue-600 hover:text-white font-bold rounded-xl transition-all active:scale-95 shadow-sm">
                      Start
                    </button>
                  </Link>
                </div>
              ))
            ) : (
               <div className="p-12 text-center bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-dashed border-slate-200/50 dark:border-slate-700/50 rounded-3xl shadow-sm">
                <p className="text-slate-500 dark:text-slate-400 font-medium">No assignments have been assigned to this class yet.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 rounded-3xl p-6 shadow-sm">
            <h3 className="font-bold text-lg mb-4">Class Information</h3>
            <div className="space-y-4">
               <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Join Code</p>
                  <p className="font-mono text-sm bg-slate-100 dark:bg-slate-700/50 px-3 py-1.5 rounded inline-block">{cls.joinCode}</p>
               </div>
               <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Grade Level</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200">{cls.gradeLevel || 'Unknown'}</p>
               </div>
               <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Description</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">{cls.description || 'No description'}</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
