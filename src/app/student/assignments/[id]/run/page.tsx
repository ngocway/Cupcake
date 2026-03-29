import React from 'react';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { StartButton } from './StartButton';
import { Globe, Clock, Calendar, CheckCircle, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

export default async function StudentLobbyPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const { id } = await params;
  
  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: {
      teacher: true,
      _count: {
        select: { questions: true }
      }
    }
  });

  if (!assignment) {
    return <div>Bài tập không tồn tại.</div>;
  }

  const submissions = await prisma.submission.findMany({
    where: {
      assignmentId: id,
      studentId: session.user.id
    },
    orderBy: {
      attemptNumber: 'asc'
    }
  });

  const activeSubmission = submissions.find(s => !s.submittedAt);
  const completedSubmissions = submissions.filter(s => s.submittedAt);
  
  const hasAttemptsLeft = completedSubmissions.length < assignment.maxAttempts;
  const nextAttemptNumber = completedSubmissions.length + 1;
  const isDeadlinePassed = assignment.deadline ? new Date() > assignment.deadline : false;
  
  const maxScore = assignment.defaultPoints * assignment._count.questions;

  const canReviewParams = (sub: any) => {
     let canShowAnswers = false;
     if (assignment.reviewMode === "AFTER_EACH_ATTEMPT") canShowAnswers = true;
     if (assignment.reviewMode === "AFTER_ALL_ATTEMPTS_EXHAUSTED" && !hasAttemptsLeft) canShowAnswers = true;
     if (assignment.reviewMode === "AFTER_DEADLINE" && isDeadlinePassed) canShowAnswers = true;
     return canShowAnswers;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 py-12">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-10 flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
            <Globe className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 uppercase text-center">{assignment.title}</h1>
          <p className="text-slate-500 mt-2 flex items-center">
            Giáo viên: {assignment.teacher.name || "N/A"}
          </p>

          <div className="flex w-full mt-10 border border-slate-100 rounded-2xl overflow-hidden divide-x divide-slate-100 bg-slate-50/50">
            <div className="flex-1 p-6 flex flex-col items-center">
              <Clock className="w-5 h-5 text-blue-500 mb-2" />
              <div className="text-sm text-slate-500 font-medium">THỜI GIAN</div>
              <div className="text-lg font-bold text-slate-800">{assignment.timeLimit ? `${assignment.timeLimit} phút` : "Không giới hạn"}</div>
            </div>
            <div className="flex-1 p-6 flex flex-col items-center">
              <Calendar className="w-5 h-5 text-indigo-500 mb-2" />
              <div className="text-sm text-slate-500 font-medium">HẠN NỘP</div>
              <div className="text-lg font-bold text-slate-800">{assignment.deadline ? format(assignment.deadline, 'dd/MM/yyyy HH:mm') : "Không có"}</div>
            </div>
            <div className="flex-1 p-6 flex flex-col items-center">
              <CheckCircle className="w-5 h-5 text-emerald-500 mb-2" />
              <div className="text-sm text-slate-500 font-medium">SỐ LẦN LÀM</div>
              <div className="text-lg font-bold text-slate-800">{completedSubmissions.length} / {assignment.maxAttempts}</div>
            </div>
            <div className="flex-1 p-6 flex flex-col items-center">
              <div className="w-5 h-5 flex items-center justify-center bg-purple-100 text-purple-600 rounded mb-2 text-xs font-bold">Q</div>
              <div className="text-sm text-slate-500 font-medium">SỐ CÂU</div>
              <div className="text-lg font-bold text-slate-800">{assignment._count.questions} Câu</div>
            </div>
          </div>

          {assignment.focusMode && (
            <div className="w-full mt-8 bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-100 flex items-start gap-4">
              <AlertTriangle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block mb-1">Lưu ý từ giáo viên:</span>
                Các em lưu ý làm bài này, làm bài không thoát ra toàn màn hình hay làm việc khác, nếu hệ thống ghi nhận thoát quá 3 lần, bài làm sẽ tự động nộp.
              </div>
            </div>
          )}

          {completedSubmissions.length > 0 && (
            <div className="w-full mt-10">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">LỊCH SỬ LÀM BÀI</h3>
              <div className="space-y-3">
                {completedSubmissions.map((sub, idx) => {
                  const passed = (sub.score || 0) >= (maxScore / 2);
                  const showAnswers = canReviewParams(sub);
                  return (
                    <div key={sub.id} className="flex justify-between items-center p-5 rounded-2xl border border-slate-100 bg-white shadow-sm hover:border-blue-100 transition-all">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${passed ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                          {passed ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">
                            Lần {sub.attemptNumber}: <span className={passed ? 'text-emerald-600' : 'text-red-500'}>{sub.score || 0} / {maxScore} điểm</span> {!passed && <span className="text-slate-500 font-normal text-sm ml-1">(Chưa đạt)</span>}
                          </div>
                          <div className="text-sm text-slate-400 mt-1 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> 
                            Hoàn thành: {sub.submittedAt ? format(sub.submittedAt, "dd/MM/yyyy - HH:mm") : ""}
                          </div>
                      </div>
                      </div>
                      <a href={`/student/assignments/${id}/review/${sub.id}?showAnswers=${showAnswers}`} className="text-blue-500 text-sm font-semibold hover:underline">
                        Xem lại &rsaquo;
                      </a>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="mt-10 w-full flex flex-col items-center">
            {activeSubmission ? (
              <StartButton assignmentId={id} label="TIẾP TỤC BÀI LÀM ĐANG DỞ" />
            ) : hasAttemptsLeft && !isDeadlinePassed ? (
              <StartButton assignmentId={id} label={`BẮT ĐẦU LÀM BÀI LẦN ${nextAttemptNumber}`} />
            ) : (
              <div className="px-6 py-3 rounded-full bg-slate-100 text-slate-500 font-semibold cursor-not-allowed">
                Không thể làm thêm bài
              </div>
            )}
            <p className="text-xs text-slate-400 mt-4 italic">Vui lòng chuẩn bị kết nối internet ổn định trước khi bắt đầu.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
