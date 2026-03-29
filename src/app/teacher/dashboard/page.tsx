import React from 'react';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';

export default async function TeacherDashboard() {
  const session = await auth();
  if (!session || session.user?.role !== 'TEACHER') {
    redirect('/login');
  }

  const teacherId = session.user.id;

  // Xóa cứng và lấy số liệu thật từ db
  const totalAssignments = await prisma.assignment.count({
    where: { teacherId, deletedAt: null }
  });

  // Lấy tổng số học sinh duy nhất đã tham gia các lớp của giáo viên này
  const totalStudentsResponse = await prisma.classEnrollment.groupBy({
    by: ['studentId'],
    where: { class: { teacherId, deletedAt: null } }
  });
  const totalStudents = totalStudentsResponse.length;

  // Lấy tổng số lượt nộp bài hôm nay
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const submissionsToday = await prisma.submission.count({
    where: {
      assignment: { teacherId },
      submittedAt: { gte: startOfDay }
    }
  });

  return (
    <div className="p-10 bg-slate-50 min-h-screen">
      <h1 className="text-3xl font-bold text-slate-800 mb-8">Dashboard Command Center</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-slate-500 font-semibold mb-2">Tổng số bài tập</h3>
          <p className="text-3xl font-bold text-blue-600">{totalAssignments}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-slate-500 font-semibold mb-2">Tổng số học sinh</h3>
          <p className="text-3xl font-bold text-green-600">{totalStudents}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-slate-500 font-semibold mb-2">Lượt nộp bài hôm nay</h3>
          <p className="text-3xl font-bold text-purple-600">{submissionsToday}</p>
        </div>
      </div>
    </div>
  );
}
