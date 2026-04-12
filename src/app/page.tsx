import { auth } from "@/auth"
import { getPublicMaterials } from "@/actions/public-materials"
import Link from "next/link"
import { LoginButton } from "@/components/LoginButton"
import { Search, BookOpen, GraduationCap, ChevronRight, Play, Star, BookMarked, Users, Globe } from "lucide-react"

export default async function HomePage() {
  const session = await auth()
  const { assignments, lessons } = await getPublicMaterials()
  
  return (
    <div className="min-h-screen bg-[#fafbff] font-body text-slate-900 overflow-x-hidden">
      {/* Top Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-2xl border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-12">
          <Link href="/" className="text-2xl font-black tracking-tighter text-slate-950 font-headline italic">
            Scholar Script
          </Link>
          <div className="hidden lg:flex items-center gap-8 border-l border-slate-200 pl-8">
            <Link className="text-sm font-bold uppercase tracking-widest text-slate-500 hover:text-primary transition-colors flex items-center gap-2" href="#">
              Thư viện cộng đồng
            </Link>
            <Link className="text-sm font-bold uppercase tracking-widest text-slate-500 hover:text-primary transition-colors" href="#">
              Giáo viên
            </Link>
            <Link className="text-sm font-bold uppercase tracking-widest text-slate-500 hover:text-primary transition-colors" href="#">
              Về chúng tôi
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-full border border-slate-200/50 group focus-within:ring-2 focus-within:ring-primary/10 transition-all mr-4">
            <Search className="w-4 h-4 text-slate-400 group-focus-within:text-primary" />
            <input 
              placeholder="Tìm bài học công khai..." 
              className="bg-transparent border-none outline-none text-sm w-48 font-medium placeholder:text-slate-400"
            />
          </div>

          {session ? (
            <div className="flex items-center gap-4">
               <Link 
                  href={session.user.role === "TEACHER" ? "/teacher/dashboard" : "/student/dashboard"}
                  className="hidden md:block text-sm font-bold bg-slate-100 px-6 py-2.5 rounded-full hover:bg-slate-200 transition-all"
               >
                  Bảng điều khiển
               </Link>
               <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary ring-2 ring-primary/10">
                  <img src={session.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.email}`} alt="User" />
               </div>
            </div>
          ) : (
            <>
              <LoginButton className="text-xs font-bold uppercase tracking-widest px-6 py-3 hover:bg-slate-100 rounded-full transition-all">Đăng nhập</LoginButton>
              <LoginButton className="bg-primary text-white text-xs font-bold uppercase tracking-widest px-8 py-3.5 rounded-full shadow-lg shadow-primary/20 hover:scale-105 transition-all">Bắt đầu ngay</LoginButton>
            </>
          )}
        </div>
      </nav>

      <main className="pt-24 pb-12">
        {/* Dynamic Hero Section */}
        <section className="relative px-6 py-16 md:py-24 overflow-hidden">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 relative z-10">
            <div className="lg:w-1/2 space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest animate-pulse">
                <Globe className="w-4 h-4" /> Kiến thức không giới hạn
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-slate-950 font-headline leading-[1.1] tracking-tight">
                Chinh phục <span className="text-primary italic">tri thức</span> <br/>
                cùng <span className="underline decoration-yellow-400 underline-offset-8">cộng đồng.</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-500 font-medium leading-relaxed max-w-xl">
                 Hàng nghìn bài học và bài tập công khai từ những giáo viên tâm huyết. 
                 Dù bạn là khách vãng lai hay học viên, Scholar Script luôn sẵn sàng đồng hành.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                 <Link href="#library" className="px-10 py-4 bg-primary text-white font-bold uppercase tracking-widest text-xs rounded-full shadow-2xl shadow-primary/30 hover:scale-105 transition-all flex items-center gap-3 active:scale-95">
                   Khám phá thư viện <ChevronRight className="w-4 h-4" />
                 </Link>
                 {!session && (
                    <LoginButton className="px-10 py-4 bg-white border border-slate-200 text-slate-900 font-bold uppercase tracking-widest text-xs rounded-full hover:bg-slate-50 transition-all active:scale-95">
                      Đăng ký lưu tiến độ
                    </LoginButton>
                 )}
              </div>
              <div className="flex items-center gap-6 pt-6 grayscale opacity-60">
                 <div className="flex flex-col">
                   <span className="text-2xl font-black">10K+</span>
                   <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Học viên</span>
                 </div>
                 <div className="w-1 h-8 bg-slate-200"></div>
                 <div className="flex flex-col">
                   <span className="text-2xl font-black">500+</span>
                   <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Giáo viên</span>
                 </div>
                 <div className="w-1 h-8 bg-slate-200"></div>
                 <div className="flex flex-col">
                   <span className="text-2xl font-black">2.5K+</span>
                   <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Bài tập công khai</span>
                 </div>
              </div>
            </div>

            <div className="lg:w-1/2 relative animate-in fade-in slide-in-from-right-8 duration-700 delay-100">
               <div className="relative group">
                  <div className="absolute inset-0 bg-primary/20 rounded-[40px] rotate-6 group-hover:rotate-0 transition-transform duration-500 scale-95"></div>
                  <div className="relative overflow-hidden rounded-[40px] border-8 border-white shadow-2xl aspect-[4/3] bg-slate-100 ring-1 ring-slate-100">
                     <img 
                        src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1200" 
                        alt="Education" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                     <div className="absolute bottom-8 left-8 right-8 text-white">
                        <div className="flex items-center gap-2 mb-2">
                           {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />)}
                           <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Highly Recommended</span>
                        </div>
                        <h4 className="text-2xl font-bold">Khám phá tiềm năng của bạn mỗi ngày.</h4>
                     </div>
                  </div>
                  {/* Floating badge */}
                  <div className="absolute -top-6 -right-6 bg-white p-5 rounded-3xl shadow-xl border border-slate-50 flex flex-col items-center gap-1 -rotate-6 animate-bounce duration-3000">
                     <div className="p-3 bg-yellow-400 text-white rounded-2xl">
                        <Play className="w-5 h-5 fill-white" />
                     </div>
                     <span className="text-[10px] font-black uppercase text-slate-900 mt-1">200+ Video</span>
                  </div>
               </div>
            </div>
          </div>
          {/* Decorative shapes */}
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl -ml-32"></div>
        </section>

        {/* Categories Section */}
        <section className="px-6 py-12">
           <div className="max-w-7xl mx-auto flex flex-wrap gap-4 justify-center">
              {["English", "Math", "Science", "History", "Coding", "Art"].map(cat => (
                <button key={cat} className="px-8 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-600 hover:border-primary/30 hover:text-primary hover:shadow-sm transition-all">
                   {cat}
                </button>
              ))}
           </div>
        </section>

        {/* Public Library Section */}
        <section id="library" className="px-6 py-20 bg-white">
          <div className="max-w-7xl mx-auto">
             <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
                <div className="space-y-4">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-1 text-primary bg-primary rounded-full"></div>
                      <span className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Library</span>
                   </div>
                   <h2 className="text-4xl md:text-5xl font-black text-slate-950 font-headline leading-tight">
                     Kho bài tập <span className="italic text-primary">công khai.</span>
                   </h2>
                   <p className="text-slate-500 font-medium max-w-xl">Học mọi lúc mọi nơi - Không giới hạn quyền truy cập cho dù bạn là ai.</p>
                </div>
                <div className="flex gap-4">
                   <button className="p-3 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors">
                      <Search className="w-5 h-5" />
                   </button>
                   <button className="px-8 py-3 bg-slate-900 text-white text-xs font-bold uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-colors flex items-center gap-3">
                      Xem tất cả <ChevronRight className="w-4 h-4" />
                   </button>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {assignments.length > 0 ? assignments.map((assignment: any) => (
                   <div key={assignment.id} className="group flex flex-col bg-white rounded-[32px] border border-slate-100 overflow-hidden hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500">
                     <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                        <img 
                          src={assignment.thumbnail || "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=800"} 
                          alt={assignment.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                        />
                        <div className="absolute top-4 left-4 flex gap-2">
                           <span className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-1.5 border border-white/20">
                              <Globe className="w-3 h-3" /> Công khai
                           </span>
                        </div>
                     </div>
                     <div className="p-8 flex-1 flex flex-col space-y-4">
                        <div className="flex items-center justify-between">
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              {assignment.materialType === "EXERCISE" ? "Bài tập" : "Bài đọc"} • {assignment.gradeLevel || "Tất cả"}
                           </span>
                           {assignment.subject && (
                             <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-md">
                               {assignment.subject}
                             </span>
                           )}
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 leading-tight group-hover:text-primary transition-colors line-clamp-2">
                           {assignment.title}
                        </h3>
                        {assignment.shortDescription && (
                          <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed opacity-80">
                            {assignment.shortDescription}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {(assignment.tags?.split(',') || []).slice(0, 3).filter(Boolean).map((tag: string) => (
                            <span key={tag} className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
                               #{tag}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-3 py-2 border-slate-50">
                           <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-100">
                              <img src={assignment.teacher?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${assignment.teacher?.name}`} alt="Teacher" />
                           </div>
                           <div className="flex flex-col">
                             <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">{assignment.teacher?.name || 'Giáo viên'}</span>
                             <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Educator</span>
                           </div>
                        </div>
                        <div className="pt-4 flex items-center justify-between border-t border-slate-100 mt-auto">
                           <div className="flex items-center gap-4 text-slate-400">
                              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest" title="Số câu hỏi">
                                 <BookOpen className="w-4 h-4" /> {assignment._count?.questions || 0}
                              </span>
                              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest" title="Lượt xem">
                                 <Globe className="w-4 h-4" /> {assignment.viewCount || 0}
                              </span>
                              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest" title="Lượt làm bài">
                                 <Users className="w-4 h-4" /> {assignment.publicSubmissionCount || 0}
                              </span>
                           </div>
                           <Link 
                             href={session ? `/student/assignments/${assignment.id}/run` : `/join/${assignment.id}`}
                             className="w-12 h-12 bg-slate-950 text-white rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group-hover:bg-primary shadow-xl shadow-slate-200"
                           >
                              <Play className="w-5 h-5 fill-white" />
                           </Link>
                        </div>
                     </div>
                   </div>
                )) : (
                  <div className="col-span-3 py-20 text-center space-y-4 opacity-50">
                     <BookMarked className="w-16 h-16 mx-auto text-slate-200" />
                     <p className="font-bold text-slate-400 uppercase tracking-widest">Chưa có bài tập công khai nào được chia sẻ.</p>
                  </div>
                )}
             </div>
          </div>
        </section>

        {/* Featured Lessons Section */}
        <section className="px-6 py-20 overflow-hidden bg-slate-50/50">
           <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-16">
                 <h2 className="text-3xl font-black text-slate-950 font-headline italic">Bài học tiêu điểm</h2>
                 <Link href="#" className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2 hover:translate-x-2 transition-all">
                   Khám phá khóa học <ChevronRight className="w-4 h-4" />
                 </Link>
              </div>
              <div className="flex overflow-x-auto no-scrollbar gap-8 pb-8">
                 {lessons.map((lesson: any) => (
                    <div key={lesson.id} className="min-w-[320px] md:min-w-[400px] bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm group cursor-pointer hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-500">
                       <div className="h-56 rounded-2xl overflow-hidden mb-6 relative">
                          <img 
                            src={lesson.videoUrl ? `https://img.youtube.com/vi/${lesson.videoUrl.split('v=')[1]}/hqdefault.jpg` : "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800"} 
                            alt={lesson.title} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                          />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-sm">
                             <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl scale-50 group-hover:scale-100 transition-transform">
                                <Play className="w-6 h-6 text-primary fill-primary" />
                             </div>
                          </div>
                       </div>
                       <h4 className="text-xl font-bold text-slate-900 leading-tight mb-3 line-clamp-2">
                          {lesson.title}
                       </h4>
                       <p className="text-sm text-slate-500 line-clamp-2 mb-6">{lesson.description}</p>
                       <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                          <div className="flex items-center gap-2">
                             <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-100">
                                <img src={lesson.teacher.image || "https://i.pravatar.cc/100?img=1"} alt="Teacher" />
                             </div>
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lesson.teacher.name}</span>
                          </div>
                          <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1.5 rounded-full">Free</span>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </section>

        {/* Conversion Hook Section */}
        {!session && (
          <section className="px-6 py-20 pb-32">
            <div className="max-w-7xl mx-auto bg-slate-950 rounded-[60px] p-12 md:p-24 relative overflow-hidden shadow-2xl">
               <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "32px 32px" }}></div>
               <div className="relative z-10 text-center md:text-left space-y-10 max-w-2xl">
                  <span className="text-xs font-bold uppercase tracking-[0.5em] text-primary">Hành trình mới</span>
                  <h2 className="text-5xl md:text-7xl font-black text-white leading-tight tracking-tighter">
                     Sẵn sàng để trở <br/> thành <span className="text-primary italic">chuyên gia?</span>
                  </h2>
                  <p className="text-slate-400 text-lg md:text-xl leading-relaxed">
                     Tham gia cùng hơn 10.000 học viên để lưu lại kết quả, chứng chỉ và nhận các lộ trình học tập tối ưu nhất.
                  </p>
                  <div className="flex flex-wrap gap-6 justify-center md:justify-start">
                     <LoginButton className="h-16 px-12 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-full shadow-2xl shadow-primary/40 hover:scale-105 transition-all active:scale-95">
                        Tạo tài khoản học tập miễn phí
                     </LoginButton>
                  </div>
               </div>
               {/* Visual elements */}
               <div className="absolute right-24 bottom-0 hidden lg:block translate-y-20 animate-bounce duration-3000">
                  <div className="w-80 h-96 bg-white/5 rounded-t-[100px] border-x border-t border-white/10 p-10 flex flex-col items-center gap-6">
                     <GraduationCap className="w-20 h-20 text-primary" />
                     <div className="w-full h-2 bg-white/10 rounded-full"></div>
                     <div className="w-1/2 h-2 bg-white/10 rounded-full"></div>
                     <div className="w-3/4 h-2 bg-white/10 rounded-full"></div>
                  </div>
               </div>
            </div>
          </section>
        )}
      </main>

      {/* Modern Footer */}
      <footer className="bg-white border-t border-slate-100 pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
           <div className="space-y-6">
              <h2 className="text-3xl font-black tracking-tighter text-slate-950 italic">Scholar Script</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                 Nền tảng giáo dục cộng đồng hiện đại, giúp kết nối tri thức giữa giáo viên và học sinh trên toàn cầu thông qua các bài học tương tác đỉnh cao.
              </p>
           </div>
           <div>
              <h5 className="text-xs font-bold uppercase tracking-widest text-slate-900 mb-8">Nền tảng</h5>
              <ul className="space-y-4">
                 <li><Link href="#" className="text-sm text-slate-500 hover:text-primary">Thư viện</Link></li>
                 <li><Link href="#" className="text-sm text-slate-500 hover:text-primary">Lớp học trực tuyến</Link></li>
                 <li><Link href="#" className="text-sm text-slate-500 hover:text-primary">Cộng đồng giáo viên</Link></li>
              </ul>
           </div>
           <div>
              <h5 className="text-xs font-bold uppercase tracking-widest text-slate-900 mb-8">Hỗ trợ</h5>
              <ul className="space-y-4">
                 <li><Link href="#" className="text-sm text-slate-500 hover:text-primary">Trung tâm trợ giúp</Link></li>
                 <li><Link href="#" className="text-sm text-slate-500 hover:text-primary">Điều khoản dịch vụ</Link></li>
                 <li><Link href="#" className="text-sm text-slate-500 hover:text-primary">Quyền riêng tư</Link></li>
              </ul>
           </div>
           <div>
              <h5 className="text-xs font-bold uppercase tracking-widest text-slate-900 mb-8">Liên hệ</h5>
              <p className="text-sm text-slate-500 mb-4">Nhận thông tin cập nhật mới nhất từ Scholar Script.</p>
              <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                 <input className="bg-transparent border-none outline-none text-xs flex-1 px-4" placeholder="Email của bạn..." />
                 <button className="bg-slate-900 text-white p-3 rounded-xl hover:bg-slate-800 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                 </button>
              </div>
           </div>
        </div>
        <div className="max-w-7xl mx-auto pt-12 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
           <p className="text-xs text-slate-400 font-medium">© 2026 Scholar Script Platform. All rights reserved.</p>
           <div className="flex gap-8">
              <Link href="#" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-primary">Facebook</Link>
              <Link href="#" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-primary">Twitter</Link>
              <Link href="#" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-primary">LinkedIn</Link>
           </div>
        </div>
      </footer>
    </div>
  )
}
