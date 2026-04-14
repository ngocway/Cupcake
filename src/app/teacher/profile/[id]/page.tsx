import React from 'react';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import Link from 'next/link';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PublicTeacherProfile({ params }: Props) {
  const { id } = await params;
  const teacher = await prisma.user.findUnique({
    where: { id },
    include: {
      certificates: true,
      lessons: {
        where: { deletedAt: null },
        take: 3,
        orderBy: { viewsCount: 'desc' }
      }
    }
  });

  if (!teacher || (!teacher.isPortfolioPublished && (await auth())?.user?.id !== id)) {
    notFound();
  }

  const expertise = teacher.expertiseTags?.split(',').filter(Boolean) || [];

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Premium Header Decoration */}
      <div className="h-40 bg-slate-900 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-indigo-900 opacity-40" />
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-20 relative z-10 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Essential Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 flex flex-col items-center">
              <div className="p-8 text-center border-b border-slate-50 w-full">
                <div className="size-40 rounded-[40px] border-8 border-white shadow-2xl mx-auto overflow-hidden bg-slate-100 mb-6 transition-transform hover:scale-105 duration-300">
                   <img 
                    src={teacher.image || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + teacher.name} 
                    className="w-full h-full object-cover"
                    alt={teacher.name || ''} 
                  />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">{teacher.name}</h1>
                <p className="text-primary font-semibold mt-1">{teacher.professionalTitle || 'Giáo viên nòng cốt'}</p>
                
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {expertise.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase tracking-wider">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-6 space-y-4 bg-slate-50/50 w-full">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 italic">Tính năng đang phát triển...</span>
                </div>
                
                <button disabled className="w-full py-4 bg-slate-200 text-slate-400 rounded-2xl font-bold cursor-not-allowed mt-2">
                  Chức năng dạy thêm
                </button>
              </div>
            </div>

            {/* Social Links */}
             <div className="mt-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Kết nối</h3>
              <div className="flex gap-4">
                 <div className="size-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-colors cursor-pointer">
                  <i className="material-symbols-outlined">share</i>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: In-depth Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* About & Experience */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                <span className="material-symbols-outlined text-[80px]">format_quote</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <span className="w-2 h-8 bg-primary rounded-full" />
                Về bản thân
              </h2>
              <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed">
                {teacher.bio || 'Giáo viên chưa cập nhật thông tin giới thiệu.'}
              </div>
              
              {teacher.teachingExperience && (
                <>
                  <h3 className="text-lg font-bold text-slate-900 mt-8 mb-4">Kinh nghiệm giảng dạy</h3>
                  <div className="text-slate-600 whitespace-pre-line bg-slate-50/50 p-6 rounded-2xl border border-slate-50">
                    {teacher.teachingExperience}
                  </div>
                </>
              )}
            </div>

            {/* Education & Certificates */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <span className="w-2 h-8 bg-green-500 rounded-full" />
                Học vấn & Bằng cấp
              </h2>
              
              {teacher.education && (
                <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 italic text-slate-600">
                  {teacher.education}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teacher.certificates.map(cert => (
                  <div key={cert.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="size-16 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                      <span className="material-symbols-outlined text-[32px]">workspace_premium</span>
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 truncate">{cert.title}</h4>
                      <p className="text-sm text-slate-500 truncate">{cert.issuer}</p>
                    </div>
                  </div>
                ))}
                {teacher.certificates.length === 0 && (
                  <p className="text-slate-400 italic">Chưa có chứng chỉ được tải lên.</p>
                )}
              </div>
            </div>

            {/* Top Lessons / Portfolio items */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
               <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                  <span className="w-2 h-8 bg-purple-500 rounded-full" />
                  Bài giảng nổi bật
                </h2>
                <Link href="/teacher/lessons" className="text-primary font-bold text-sm hover:underline">Xem tất cả</Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {teacher.lessons.map(lesson => (
                  <div key={lesson.id} className="group cursor-pointer">
                    <div className="aspect-video bg-slate-100 rounded-2xl overflow-hidden mb-3 relative">
                      <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors" />
                      {lesson.isPremium && (
                        <span className="absolute top-2 right-2 px-2 py-1 bg-amber-400 text-white text-[10px] font-bold rounded-lg shadow-sm">PREMIUM</span>
                      )}
                    </div>
                    <h4 className="font-bold text-slate-900 line-clamp-1 group-hover:text-primary transition-colors">{lesson.title}</h4>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">visibility</span> {lesson.viewsCount} lượt xem
                    </p>
                  </div>
                ))}
                {teacher.lessons.length === 0 && (
                   <div className="col-span-3 py-10 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                      <p className="text-slate-400">Chưa có bài giảng công khai nào.</p>
                   </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <footer className="py-10 text-center text-slate-300 text-[10px] font-bold uppercase tracking-[2px]">
        EngMaster Portfolio &bull; 2026
      </footer>
    </div>
  );
}
