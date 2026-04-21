
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import PublicQuestionViewer from "@/components/lessons/PublicQuestionViewer";
import AssignmentReviewSection from "@/components/public/assignments/AssignmentReviewSection";
import { PublicHeader } from "@/components/public/PublicHeader";

export default async function PublicAssignmentPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const sessionData = await auth();
  const session = sessionData?.user ? {
    id: sessionData.user.id!,
    name: sessionData.user.name ?? null,
    image: sessionData.user.image ?? null,
    role: sessionData.user.role ?? null,
  } : null;

  const { id } = await params;

  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
          image: true,
          professionalTitle: true,
          bio: true,
          _count: { select: { assignments: true } }
        }
      },
      questions: {
        orderBy: { orderIndex: 'asc' }
      },
      reviews: {
        include: {
          student: {
            select: { name: true, image: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      },
      _count: {
        select: { submissions: true }
      }
    }
  });

  if (!assignment) notFound();

  const isPublic = assignment.status === "PUBLIC";
  const isLoggedIn = !!session;

  if (!isPublic && !isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface p-6 font-body">
        <div className="max-w-md w-full bg-surface-container-lowest rounded-[20px] p-10 border border-outline-variant/30 text-center space-y-6 shadow-2xl">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-4xl text-primary">lock</span>
          </div>
          <h1 className="text-3xl font-black text-on-surface font-headline">Bài tập riêng tư</h1>
          <p className="text-on-surface-variant leading-relaxed">
            Bài tập này đã được đặt ở chế độ riêng tư bởi giáo viên. Vui lòng đăng nhập bằng tài khoản học sinh để tiếp tục.
          </p>
          <Link 
            href="/student/login"
            className="block w-full py-4 bg-primary text-on-primary rounded-lg font-black tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/20 uppercase"
          >
            Đăng nhập ngay
          </Link>
          <Link href="/" className="block text-sm font-bold text-primary hover:underline transition-colors">
            Quay lại trang chủ
          </Link>
        </div>
      </div>
    );
  }

  const currentTags = assignment.tags?.split(',').map(t => t.trim()).filter(Boolean) || [];
  let relatedAssignments: any[] = [];
  
  if (currentTags.length > 0) {
    relatedAssignments = await prisma.assignment.findMany({
      where: {
        id: { not: id },
        status: isLoggedIn ? { in: ["PUBLIC", "PRIVATE"] as any } : "PUBLIC",
        OR: currentTags.map(tag => ({
           tags: { contains: tag }
        }))
      },
      take: 5,
      include: {
        teacher: { select: { name: true, id: true, image: true } },
      }
    });
  }

  return (
    <div className="min-h-screen bg-surface font-body">
      <PublicHeader session={session} />

      <main className="w-full pt-28 pb-12 px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Content (Left) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Hero Card */}
            <div className="bg-surface-container-lowest rounded-[20px] overflow-hidden shadow-2xl border border-white/20 p-2 relative group">
              <div className="aspect-[21/9] bg-slate-900 rounded-[16px] overflow-hidden relative">
                <img 
                  src={assignment.thumbnail || "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=1200"} 
                  alt="" 
                  className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                <div className="absolute bottom-8 left-8 right-8 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="bg-primary text-on-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                      {assignment.materialType === "READING" ? "Đọc hiểu" : assignment.materialType === "FLASHCARD" ? "Flashcard" : "Trắc nghiệm"}
                    </span>
                    <span className="bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
                      {assignment.gradeLevel || "Tất cả"}
                    </span>
                  </div>
                  <h1 className="text-3xl md:text-5xl font-black text-white leading-tight font-headline uppercase italic tracking-tighter">
                    {assignment.title}
                  </h1>
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Thời gian", value: assignment.timeLimit ? `${assignment.timeLimit} phút` : "Không giới hạn", icon: "timer" },
                { label: "Điểm chuẩn", value: `${assignment.defaultPoints} điểm`, icon: "military_tech" },
                { label: "Số câu hỏi", value: `${assignment.questions.length} câu`, icon: "quiz" },
                { label: "Lượt làm bài", value: `${assignment.maxAttempts} lần`, icon: "history_edu" },
              ].map((stat, idx) => (
                <div key={idx} className="bg-surface-container-lowest rounded-[16px] p-6 border border-white/20 shadow-sm flex flex-col items-center text-center gap-2 group hover:bg-primary/5 transition-colors">
                  <span className="material-symbols-outlined text-primary text-3xl group-hover:scale-110 transition-transform">{stat.icon}</span>
                  <span className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest">{stat.label}</span>
                  <span className="text-sm font-black text-on-surface uppercase">{stat.value}</span>
                </div>
              ))}
            </div>

            {/* Content Tabs / Sections */}
            <div className="bg-surface-container-low/40 rounded-[20px] p-8 border border-white/20 space-y-8">
              {/* Instructions */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined !text-[20px]">info</span>
                  <h2 className="text-sm font-black uppercase tracking-widest">Hướng dẫn làm bài</h2>
                </div>
                <div className="text-on-surface-variant leading-relaxed font-medium text-lg prose prose-slate max-w-none">
                  {assignment.instructions ? (
                    <div dangerouslySetInnerHTML={{ __html: assignment.instructions }} />
                  ) : (
                    <p className="italic opacity-60">Không có hướng dẫn cụ thể cho bài tập này.</p>
                  )}
                </div>
              </section>

              {/* Reading Passage if any */}
              {assignment.materialType === "READING" && assignment.readingText && (
                <section className="space-y-4 pt-8 border-t border-white/20">
                  <div className="flex items-center gap-2 text-primary">
                    <span className="material-symbols-outlined !text-[20px]">menu_book</span>
                    <h2 className="text-sm font-black uppercase tracking-widest">Văn bản đọc hiểu</h2>
                  </div>
                  <div className="bg-white/50 backdrop-blur-sm rounded-[16px] p-8 border border-white/30 text-on-surface-variant leading-relaxed font-serif text-xl italic whitespace-pre-wrap">
                    {assignment.readingText}
                  </div>
                </section>
              )}

              {/* Questions Preview */}
              <section className="space-y-6 pt-8 border-t border-white/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary">
                    <span className="material-symbols-outlined !text-[20px]">list_alt</span>
                    <h2 className="text-sm font-black uppercase tracking-widest">Xem trước câu hỏi</h2>
                  </div>
                  <Link 
                    href={isLoggedIn ? `/student/assignments/${assignment.id}/run` : `/join/${assignment.id}`}
                    className="bg-primary text-on-primary px-6 py-2 rounded-full text-[11px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/20"
                  >
                    Bắt đầu ngay
                  </Link>
                </div>
                
                <div className="bg-white/50 backdrop-blur-sm rounded-[16px] p-6 border border-white/30">
                  <PublicQuestionViewer 
                    questions={assignment.questions} 
                    assignmentId={assignment.id}
                    isLoggedIn={isLoggedIn}
                    showSubmitButton={false} 
                  />
                </div>
              </section>

              {/* Reviews */}
              <section className="pt-8 border-t border-white/20">
                <AssignmentReviewSection 
                  reviews={assignment.reviews}
                  assignmentId={assignment.id}
                  isLoggedIn={isLoggedIn}
                  isPublic={isPublic}
                />
              </section>
            </div>
          </div>

          {/* Sidebar (Right) */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Instructor Card */}
            <div className="bg-surface-container-low rounded-[20px] p-8 border border-white/20 shadow-xl shadow-on-surface/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors"></div>
              
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg bg-white overflow-hidden shadow-lg p-1">
                    <img 
                      src={assignment.teacher.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${assignment.teacher.id}`} 
                      alt="" 
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Giáo viên</span>
                    <h3 className="text-xl font-black text-on-surface font-headline">{assignment.teacher.name}</h3>
                  </div>
                </div>

                <p className="text-on-surface-variant/70 text-sm leading-relaxed font-medium line-clamp-3 italic">
                  "{assignment.teacher.bio || "Chuyên gia đào tạo tại Scholar Script, mang đến những phương pháp học tập hiện đại và hiệu quả."}"
                </p>

                <Link 
                  href={`/profile/${assignment.teacher.id}`}
                  className="flex items-center justify-between w-full p-4 bg-white/50 hover:bg-white rounded-lg border border-white/40 transition-all group/btn"
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-on-surface">{assignment.teacher._count.assignments} Bài tập</span>
                    <span className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">Hồ sơ đầy đủ</span>
                  </div>
                  <span className="material-symbols-outlined text-primary group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
                </Link>
              </div>
            </div>

            {/* Related Assignments */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-primary px-2">
                <span className="material-symbols-outlined !text-[20px]">auto_awesome</span>
                <h2 className="text-sm font-black uppercase tracking-widest">Cùng chủ đề</h2>
              </div>
              
              {relatedAssignments.length > 0 ? (
                <div className="space-y-4">
                  {relatedAssignments.map((rel) => (
                    <Link 
                      key={rel.id} 
                      href={`/public/assignments/${rel.id}`}
                      className="group flex gap-4 p-3 bg-surface-container-low/50 hover:bg-white rounded-xl border border-transparent hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all"
                    >
                      <div className="w-20 h-20 bg-white rounded-lg overflow-hidden shrink-0 shadow-sm border border-on-surface/5">
                        <img 
                          src={rel.thumbnail || "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=200"} 
                          alt="" 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                      <div className="flex flex-col justify-center gap-1">
                        <h4 className="text-sm font-black text-on-surface line-clamp-2 leading-snug group-hover:text-primary transition-colors">{rel.title}</h4>
                        <span className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">{rel.teacher.name}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-8 bg-surface-container-high/10 rounded-[16px] border border-dashed border-white/20 text-center text-on-surface-variant/40 text-[11px] font-bold">
                  Không tìm thấy bài tập tương tự
                </div>
              )}
            </div>

            {/* CTA Box */}
            <div className="bg-primary rounded-[20px] p-8 text-on-primary relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:bg-white/20 transition-all"></div>
              <div className="relative z-10 space-y-6">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined">trending_up</span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black font-headline italic uppercase tracking-tighter">Nâng tầm kỹ năng</h3>
                  <p className="text-on-primary/70 text-sm font-medium">Hoàn thành bài tập để tích lũy điểm thưởng và chứng nhận từ giáo viên.</p>
                </div>
                <Link 
                  href={isLoggedIn ? `/student/assignments/${assignment.id}/run` : `/join/${assignment.id}`}
                  className="block w-full py-4 bg-white text-primary rounded-lg text-center font-black text-sm tracking-widest hover:scale-105 transition-all shadow-lg"
                >
                  THỬ SỨC NGAY
                </Link>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
