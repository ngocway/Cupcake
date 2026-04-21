
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import PublicQuestionViewer from "@/components/lessons/PublicQuestionViewer";
import LessonReviewSection from "@/components/lessons/LessonReviewSection";
import { PublicHeader } from "@/components/public/PublicHeader";

export default async function PublicLessonPage({ 
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

  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
          image: true,
          professionalTitle: true,
          bio: true,
          _count: { select: { lessons: true } }
        }
      },
      assignment: {
        include: {
          questions: {
            orderBy: { orderIndex: 'asc' }
          }
        }
      },
      reviews: {
        where: { isApproved: true },
        include: {
          student: {
            select: { name: true, image: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!lesson) notFound();

  const isPublic = lesson.assignment?.status === "PUBLIC";
  const isLoggedIn = !!session; // Fixed logic

  if (!isPublic && !isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6 font-body">
        <div className="max-w-md w-full bg-surface-container-lowest rounded-[2rem] p-10 border border-white/20 text-center space-y-6 shadow-2xl shadow-on-surface/5">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-4xl text-primary">lock</span>
          </div>
          <h1 className="text-3xl font-black text-on-surface font-headline uppercase italic">Bài học riêng tư</h1>
          <p className="text-on-surface-variant leading-relaxed font-medium">
            Bài học này đã được đặt ở chế độ riêng tư bởi giáo viên. Vui lòng đăng nhập để tiếp tục khám phá tri thức.
          </p>
          <Link 
            href="/student/login"
            className="block w-full py-4 bg-primary text-on-primary rounded-full font-black tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/20 uppercase text-sm"
          >
            Đăng nhập ngay
          </Link>
          <Link href="/" className="block text-xs font-black text-primary hover:underline transition-colors uppercase tracking-widest">
            Quay lại trang chủ
          </Link>
        </div>
      </div>
    );
  }

  const currentTags = lesson.assignment?.tags?.split(',').map(t => t.trim()).filter(Boolean) || [];
  let relatedLessons: any[] = [];
  
  if (currentTags.length > 0) {
    relatedLessons = await prisma.lesson.findMany({
      where: {
        id: { not: id },
        assignment: {
          status: isLoggedIn ? { in: ["PUBLIC", "PRIVATE"] as any } : "PUBLIC",
          OR: currentTags.map(tag => ({
             tags: { contains: tag }
          }))
        }
      },
      include: {
        teacher: { select: { name: true } },
        assignment: { select: { thumbnail: true } }
      },
      take: 3
    });
  }

  return (
    <div className="min-h-screen bg-background text-on-background font-body">
      <PublicHeader session={session} />

      <main className="w-full max-w-[1600px] mx-auto pb-24 md:pb-12 pt-0 md:pt-4">
        {/* Hero Section */}
        <section className="w-full relative bg-surface-container-low pt-24 md:pt-28 pb-16 px-4 md:px-8 xl:px-16 rounded-b-xl md:rounded-b-[4rem] mb-12 shadow-sm">
          <div className="max-w-7xl mx-auto">
            <div className="mb-10">
              <span className="inline-block px-4 py-1.5 bg-tertiary-container text-on-tertiary-container rounded-md font-label text-xs font-black uppercase tracking-widest mb-4">
                Khoá Học Cao Cấp
              </span>
              <h1 className="text-4xl md:text-6xl lg:text-[4.5rem] leading-[1.1] font-headline font-extrabold text-on-background tracking-[-0.03em] mb-6 uppercase italic">
                {lesson.title}
              </h1>
              <p className="text-lg md:text-xl text-on-surface-variant font-body max-w-3xl leading-relaxed">
                {lesson.description || "Làm chủ kiến thức chuyên sâu và ứng dụng thực tế để nâng tầm kỹ năng của bạn trong môi trường chuyên nghiệp."}
              </p>
            </div>

            <div className="relative w-full aspect-video rounded-xl md:rounded-[3rem] overflow-hidden shadow-[0px_40px_80px_rgba(0,51,68,0.15)] bg-slate-900 flex items-center justify-center group">
              {/* Video Thumbnail / Placeholder */}
              <img 
                alt={lesson.title} 
                className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000" 
                src={lesson.assignment?.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1200"} 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80"></div>
              
              <button className="relative z-10 w-20 h-20 md:w-32 md:h-32 bg-primary/90 backdrop-blur-md rounded-full flex items-center justify-center hover:scale-110 transition-all duration-500 shadow-[0px_20px_40px_rgba(0,100,119,0.4)] border border-white/20">
                <span className="material-symbols-outlined text-on-primary text-5xl md:text-7xl ml-2 drop-shadow-lg" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
              </button>

              <div className="absolute bottom-6 left-8 right-8 flex justify-between items-end z-10">
                <div className="bg-white/10 backdrop-blur-xl px-4 py-2 rounded-lg text-white font-label text-xs font-bold border border-white/10 tracking-widest uppercase">
                   Bài giảng: {lesson.title}
                </div>
                <div className="bg-white/10 backdrop-blur-xl px-4 py-2 rounded-lg text-white font-label text-xs font-bold border border-white/10 tracking-widest uppercase">
                   {lesson.assignment?.materialType === 'READING' ? 'Bản tài liệu' : 'Video 4K'}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content & Sidebar */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 xl:px-16 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          
          {/* Left Column (Main Content) */}
          <div className="lg:col-span-8 flex flex-col gap-12">
            
            {/* Lesson Content Section */}
            <section className="bg-surface-container-lowest p-8 md:p-12 rounded-xl shadow-xl shadow-on-surface/5 border border-white/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
              
              <div className="relative z-10">
                <h2 className="text-3xl font-headline font-black mb-8 text-on-background flex items-center gap-3 italic uppercase tracking-tighter">
                  <span className="w-10 h-10 bg-primary text-on-primary rounded-xl flex items-center justify-center text-sm font-black italic shadow-lg shadow-primary/20">01</span>
                  TỔNG QUAN BÀI HỌC
                </h2>
                
                <div className="prose prose-slate max-w-none font-body text-on-surface-variant text-lg leading-relaxed mb-10">
                   {lesson.assignment?.instructions ? (
                     <div dangerouslySetInnerHTML={{ __html: lesson.assignment.instructions }} />
                   ) : (
                     <p>Bài giảng này cung cấp kiến thức nền tảng và các ứng dụng thực tế giúp bạn đạt được mục tiêu học tập một cách tối ưu nhất.</p>
                   )}
                </div>

                <div className="flex flex-wrap gap-4 pt-8 border-t border-surface-container">
                  <a className="inline-flex items-center gap-3 bg-gradient-to-r from-primary to-primary-dim text-on-primary px-10 py-5 rounded-full font-label font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform shadow-xl shadow-primary/20" href="#">
                    <span className="material-symbols-outlined text-[20px]">description</span>
                    Tải Tài Liệu (PDF)
                  </a>
                  {lesson.assignment && (
                    <Link className="inline-flex items-center gap-3 bg-secondary-container text-on-secondary-container px-10 py-5 rounded-full font-label font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform border border-secondary/10" href={`/public/assignments/${lesson.assignment.id}`}>
                      <span className="material-symbols-outlined text-[20px]">assignment</span>
                      Làm Bài Tập
                    </Link>
                  )}
                </div>
              </div>
            </section>

            {/* Questions Preview if any */}
            {lesson.assignment?.questions && lesson.assignment.questions.length > 0 && (
              <section className="bg-surface-container-low/30 p-8 md:p-12 rounded-xl border border-white/20 shadow-sm">
                <h2 className="text-2xl font-headline font-black mb-8 text-on-background flex items-center gap-3 italic uppercase tracking-tighter">
                   <span className="material-symbols-outlined text-primary text-3xl">quiz</span>
                   NỘI DUNG THỰC HÀNH
                </h2>
                <div className="bg-white/80 backdrop-blur-sm rounded-[2rem] p-6 border border-white/40 shadow-sm">
                   <PublicQuestionViewer 
                     questions={lesson.assignment.questions} 
                     assignmentId={lesson.assignment.id}
                     isLoggedIn={isLoggedIn}
                     showSubmitButton={false} 
                   />
                </div>
              </section>
            )}

            {/* Review & Discussion Section */}
            <section className="bg-surface-container-high/10 p-8 md:p-12 rounded-[2.5rem] border border-white/20 shadow-inner">
               <div className="flex justify-between items-center mb-10">
                  <h2 className="text-3xl font-headline font-black text-on-background uppercase italic tracking-tighter">
                     Thảo luận & Đánh giá
                  </h2>
               </div>
               
               <LessonReviewSection 
                 reviews={lesson.reviews as any}
                 lessonId={lesson.id}
                 isLoggedIn={isLoggedIn}
                 isPublic={isPublic}
               />
            </section>
          </div>

          {/* Right Column (Sidebar) */}
          <div className="lg:col-span-4 flex flex-col gap-8">
            
            {/* Instructor Card */}
            <aside className="bg-surface-container-highest p-10 rounded-[2.5rem] relative overflow-hidden shadow-2xl shadow-primary/5 border border-white/30 group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-primary/20 transition-colors"></div>
              
              <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-10 border-b border-primary/10 pb-4">Người Hướng Dẫn</h3>
              
              <div className="flex flex-col items-center text-center gap-6 mb-8">
                <div className="w-24 h-24 rounded-2xl bg-white shadow-xl p-1.5 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                  <img 
                    alt={lesson.teacher.name || ""} 
                    className="w-full h-full object-cover rounded-xl" 
                    src={lesson.teacher.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${lesson.teacher.id}`} 
                  />
                </div>
                <div>
                  <h4 className="text-2xl font-headline font-black text-on-background uppercase tracking-tight italic">{lesson.teacher.name}</h4>
                  <p className="text-primary font-black text-[10px] uppercase tracking-[0.2em] mt-2 px-4 py-1 bg-primary/5 rounded-full inline-block">
                    {lesson.teacher.professionalTitle || "GIẢNG VIÊN CAO CẤP"}
                  </p>
                </div>
              </div>
              
              <p className="text-on-surface-variant font-body text-sm mb-10 leading-relaxed italic text-center px-4">
                "{lesson.teacher.bio || "Mang đến những kiến thức thực tiễn và tư duy linh hoạt giúp bạn làm chủ mọi kỹ năng mới."}"
              </p>
              
              <Link 
                href={`/profile/${lesson.teacher.id}`}
                className="w-full py-5 bg-white text-primary font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm border border-white/40 block text-center"
              >
                XEM HỒ SƠ CHI TIẾT
              </Link>
            </aside>

            {/* Next Lessons / Related */}
            <aside className="bg-surface-container-low p-10 rounded-[2.5rem] border border-white/20 shadow-sm">
              <h3 className="text-lg font-headline font-black text-on-background uppercase italic tracking-tighter mb-10 border-b border-on-surface/5 pb-4">Bài Học Tiếp Theo</h3>
              <div className="space-y-8">
                 {relatedLessons.length > 0 ? (
                   relatedLessons.map((rel) => (
                     <Link 
                       key={rel.id} 
                       href={`/public/lessons/${rel.id}`}
                       className="group flex gap-4 items-start"
                     >
                       <div className="relative w-24 aspect-video rounded-xl overflow-hidden shrink-0 shadow-lg border border-white/20">
                         <img 
                           alt={rel.title} 
                           className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                           src={rel.assignment?.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=200"} 
                         />
                         <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                       </div>
                       <div className="space-y-1 overflow-hidden">
                         <h4 className="font-headline font-black text-on-surface group-hover:text-primary transition-colors line-clamp-2 leading-tight text-xs uppercase italic">
                           {rel.title}
                         </h4>
                         <p className="text-[10px] text-on-surface-variant/50 font-black uppercase tracking-widest">{rel.teacher.name}</p>
                       </div>
                     </Link>
                   ))
                 ) : (
                   <p className="text-on-surface-variant/40 font-black text-[10px] uppercase tracking-widest text-center py-10 border border-dashed border-primary/20 rounded-2xl bg-white/50">
                      Đang cập nhật bài học mới...
                   </p>
                 )}
              </div>
            </aside>

            {/* Pro Badge / CTA */}
            <div className="bg-on-surface rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-on-surface/30 group">
               <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-white/20 transition-all"></div>
               <div className="relative z-10 space-y-6">
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                     <span className="material-symbols-outlined text-on-primary">rocket_launch</span>
                  </div>
                  <div className="space-y-2">
                     <h3 className="text-2xl font-black font-headline uppercase italic tracking-tighter">Gia Nhập Cộng Đồng</h3>
                     <p className="text-white/60 text-xs font-bold leading-relaxed">Mở khóa lộ trình học tập chuyên sâu và kết nối với mạng lưới chuyên gia toàn cầu.</p>
                  </div>
                  <Link href="/student/login" className="block w-full py-5 bg-white text-on-surface font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:scale-105 transition-transform shadow-xl text-center">
                     BẮT ĐẦU NGAY
                  </Link>
               </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Nav - Premium Floating */}
      <nav className="md:hidden fixed bottom-8 left-8 right-8 z-50 bg-white/40 backdrop-blur-3xl rounded-full shadow-2xl border border-white/40 flex justify-around items-center px-4 py-3">
        <Link href="/" className="flex flex-col items-center justify-center text-primary p-3 bg-white/80 rounded-full shadow-sm">
           <span className="material-symbols-outlined">home</span>
        </Link>
        <button className="flex flex-col items-center justify-center text-on-surface-variant p-3">
           <span className="material-symbols-outlined">search</span>
        </button>
        <button className="flex flex-col items-center justify-center text-on-surface-variant p-3">
           <span className="material-symbols-outlined">person</span>
        </button>
      </nav>
    </div>
  );
}
