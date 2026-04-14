import { auth } from "@/auth"
import { getPublicMaterials } from "@/actions/public-materials"
import Link from "next/link"
import { LoginButton } from "@/components/LoginButton"
import { Search, BookOpen, GraduationCap, ChevronRight, Play, Star, BookMarked, Users, Globe, LayoutGrid, Sparkles } from "lucide-react"
import { BookmarkButton } from "@/components/public/BookmarkButton"

export default async function HomePage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const session = await auth();
  const sp = await searchParams;
  
  const search = sp.search as string || "";
  const category = sp.category as string || "Tất cả";
  const sort = (sp.sort as 'newest' | 'popular' | 'trending') || 'newest';
  const page = Number(sp.page) || 1;

  const { assignments, lessons, total, hasMore } = await getPublicMaterials({
    search,
    category,
    sort,
    page
  });
  
  const stats = {
    students: "12,480+",
    teachers: "840+",
    publicMaterials: "3,250+",
    activeClasses: "1,200+"
  };

  return (
    <div className="min-h-screen bg-[#fafbff] font-body text-slate-900 overflow-x-hidden">
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-2xl border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-12">
          <Link href="/" className="text-2xl font-black tracking-tighter text-slate-950 font-headline italic">
            Scholar Script
          </Link>
          <div className="hidden lg:flex items-center gap-8 border-l border-slate-200 pl-8">
            <Link className="text-sm font-bold uppercase tracking-widest text-slate-500 hover:text-primary transition-colors flex items-center gap-2" href="#library">
              Thư viện cộng đồng
            </Link>
            <Link className="text-sm font-bold uppercase tracking-widest text-slate-500 hover:text-primary transition-colors" href="#">
              Giáo viên
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <form action="/" method="GET" className="hidden md:flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-full border border-slate-200/50 group focus-within:ring-2 focus-within:ring-primary/10 transition-all mr-4">
            <Search className="w-4 h-4 text-slate-400 group-focus-within:text-primary" />
            <input 
              name="search"
              defaultValue={search}
              placeholder="Tìm bài học công khai..." 
              className="bg-transparent border-none outline-none text-sm w-48 font-medium placeholder:text-slate-400"
            />
            {category !== "Tất cả" && <input type="hidden" name="category" value={category} />}
            {sort !== "newest" && <input type="hidden" name="sort" value={sort} />}
          </form>

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
                   <span className="text-2xl font-black">{stats.students}</span>
                   <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Học viên</span>
                 </div>
                 <div className="w-1 h-8 bg-slate-200"></div>
                 <div className="flex flex-col">
                   <span className="text-2xl font-black">{stats.teachers}</span>
                   <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Giáo viên</span>
                 </div>
                 <div className="w-1 h-8 bg-slate-200"></div>
                 <div className="flex flex-col">
                   <span className="text-2xl font-black">{stats.publicMaterials}</span>
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
                  <div className="absolute -top-6 -right-6 bg-white p-5 rounded-3xl shadow-xl border border-slate-50 flex flex-col items-center gap-1 -rotate-6 animate-bounce duration-3000">
                     <div className="p-3 bg-yellow-400 text-white rounded-2xl">
                        <Play className="w-5 h-5 fill-white" />
                     </div>
                     <span className="text-[10px] font-black uppercase text-slate-900 mt-1">200+ Video</span>
                  </div>
               </div>
            </div>
          </div>
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl -ml-32"></div>
        </section>

        <section className="px-6 py-12">
           <div className="max-w-7xl mx-auto flex flex-wrap gap-4 justify-center">
              {["Tất cả", "English", "Math", "Science", "History", "Coding", "Art"].map(cat => (
                <Link 
                  key={cat} 
                  href={`/?category=${cat}${search ? `&search=${search}` : ''}`}
                  className={`px-8 py-3 bg-white border rounded-2xl text-sm font-bold transition-all ${
                    category === cat ? 'border-primary text-primary shadow-sm bg-primary/5' : 'border-slate-100 text-slate-600 hover:border-primary/30'
                  }`}
                >
                   {cat}
                </Link>
              ))}
           </div>
        </section>

        <section className="px-6 py-12 bg-slate-50/30">
           <div className="max-w-7xl mx-auto">
              <div className="flex items-center gap-4 mb-8">
                 <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
                    <LayoutGrid className="w-6 h-6" />
                 </div>
                 <h3 className="text-2xl font-black text-slate-950 font-headline italic">Khám phá theo khối lớp</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                 {[
                   { label: "Mầm non", icon: "🧸" },
                   { label: "Lớp 1-5", icon: "🎒" },
                   { label: "Lớp 6-9", icon: "📚" },
                   { label: "Lớp 10-12", icon: "🎓" },
                   { label: "Đại học", icon: "🏛️" },
                   { label: "Kỹ năng soft", icon: "✨" }
                 ].map(grade => (
                    <Link 
                      key={grade.label} 
                      href={`/?search=${grade.label}`}
                      className="group flex flex-col items-center p-6 bg-white border border-slate-100 rounded-[32px] hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all text-center"
                    >
                       <span className="text-3xl mb-3 group-hover:scale-125 transition-transform">{grade.icon}</span>
                       <span className="text-xs font-black uppercase tracking-widest text-slate-900">{grade.label}</span>
                       <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">Xem tài liệu</span>
                    </Link>
                 ))}
              </div>
           </div>
        </section>

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
                
                <div className="flex gap-3">
                   <div className="bg-slate-50 p-1.5 rounded-2xl border border-slate-100 flex gap-1">
                      {[
                        { label: 'Mới nhất', value: 'newest' },
                        { label: 'Xem nhiều', value: 'popular' },
                        { label: 'Thịnh hành', value: 'trending' }
                      ].map(s => (
                        <Link 
                          key={s.value}
                          href={`/?sort=${s.value}${category !== 'Tất cả' ? `&category=${category}` : ''}${search ? `&search=${search}` : ''}`}
                          className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                            sort === s.value ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          {s.label}
                        </Link>
                      ))}
                   </div>
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
                        <BookmarkButton 
                          assignmentId={assignment.id} 
                          initialIsBookmarked={assignment.isBookmarked}
                          isLoggedIn={!!session}
                        />
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
                          {(assignment.tags || []).slice(0, 3).map((tag: string) => (
                            <span key={tag} className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
                               #{tag}
                            </span>
                          ))}
                        </div>
                        
                        <div className="flex items-center gap-3 py-2 border-slate-50 group/teacher relative">
                           <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-100">
                              <img src={assignment.teacher?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${assignment.teacher?.name}`} alt="Teacher" />
                           </div>
                           <div className="flex flex-col">
                             <span className="text-xs font-bold text-slate-700 uppercase tracking-tight hover:text-primary cursor-pointer transition-colors">{assignment.teacher?.name || 'Giáo viên'}</span>
                             <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Educator</span>
                           </div>
                           
                           <div className="absolute bottom-full left-0 mb-4 w-64 bg-slate-950 text-white p-6 rounded-3xl shadow-2xl opacity-0 translate-y-2 group-hover/teacher:opacity-100 group-hover/teacher:translate-y-0 transition-all pointer-events-none z-50">
                              <div className="flex items-center gap-4 mb-4">
                                 <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-xl overflow-hidden">
                                     <img src={assignment.teacher?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${assignment.teacher?.name}`} alt="T" />
                                 </div>
                                 <div className="flex flex-col">
                                    <span className="text-sm font-bold">{assignment.teacher?.name}</span>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Giáo viên tâm tâm</span>
                                 </div>
                              </div>
                              <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed mb-4">
                                 {assignment.teacher?.bio || "Một nhà giáo giáo dục luôn hướng tới việc tạo ra các nội dung học tập sáng tạo."}
                              </p>
                           </div>
                        </div>
                        
                        <div className="pt-4 flex items-center justify-between border-t border-slate-100 mt-auto">
                           <div className="flex items-center gap-4 text-slate-400">
                              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest">
                                 <BookOpen className="w-4 h-4" /> {assignment._count?.questions || 0}
                              </span>
                              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest">
                                 <Globe className="w-4 h-4" /> {assignment.viewCount || 0}
                              </span>
                           </div>
                           <Link 
                             href={session ? `/student/assignments/${assignment.id}/run` : `/join/${assignment.id}`}
                             className="w-12 h-12 bg-slate-950 text-white rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group-hover:bg-primary"
                           >
                              <Play className="w-5 h-5 fill-white" />
                           </Link>
                        </div>
                     </div>
                   </div>
                )) : (
                   <div className="col-span-3 py-20 text-center space-y-4 opacity-50">
                      <BookMarked className="w-16 h-16 mx-auto text-slate-200" />
                      <p className="font-bold text-slate-400 uppercase tracking-widest">Không tìm thấy kết quả nào phù hợp.</p>
                   </div>
                )}
             </div>
             
             {hasMore && (
               <div className="mt-20 flex justify-center">
                  <Link 
                    href={`/?page=${page + 1}${category !== 'Tất cả' ? `&category=${category}` : ''}${sort !== 'newest' ? `&sort=${sort}` : ''}${search ? `&search=${search}` : ''}`}
                    className="px-12 py-4 bg-slate-50 text-slate-900 border border-slate-200 font-black text-xs uppercase tracking-[0.2em] rounded-full hover:bg-slate-900 hover:text-white"
                  >
                    Xem thêm
                  </Link>
               </div>
             )}
          </div>
        </section>

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
                    <div key={lesson.id} className="min-w-[320px] md:min-w-[400px] bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500">
                       <div className="h-56 rounded-2xl overflow-hidden mb-6 relative group cursor-pointer">
                          <img 
                            src={lesson.videoUrl ? `https://img.youtube.com/vi/${lesson.videoUrl.split('v=')[1]}/hqdefault.jpg` : "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800"} 
                            alt={lesson.title} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                          />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                             <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl">
                                <Play className="w-6 h-6 text-primary fill-primary" />
                             </div>
                          </div>
                       </div>
                       <h4 className="text-xl font-bold text-slate-900 leading-tight mb-3 line-clamp-2">{lesson.title}</h4>
                       <p className="text-sm text-slate-500 line-clamp-2 mb-6">{lesson.description}</p>
                       <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                          <div className="flex items-center gap-2">
                             <img src={lesson.teacher.image || "https://i.pravatar.cc/100?img=1"} alt="T" className="w-6 h-6 rounded-full" />
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lesson.teacher.name}</span>
                          </div>
                          <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1.5 rounded-full">Free</span>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </section>

        {!session && (
          <section className="px-6 py-20 pb-32">
            <div className="max-w-7xl mx-auto bg-slate-950 rounded-[60px] p-12 md:p-24 relative overflow-hidden shadow-2xl">
               <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "32px 32px" }}></div>
               <div className="relative z-10 text-center md:text-left space-y-10 max-w-2xl">
                  <span className="text-xs font-bold uppercase tracking-[0.5em] text-primary">Hành trình mới</span>
                  <h2 className="text-5xl md:text-7xl font-black text-white leading-tight">Sẵn sàng trở thành <span className="text-primary italic">chuyên gia?</span></h2>
                  <p className="text-slate-400 text-lg md:text-xl">Tham gia cùng hơn 10.000 học viên để lưu lại kết quả và lộ trình học tập tối ưu.</p>
                  <LoginButton className="h-16 px-12 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-full shadow-2xl">Bắt đầu ngay</LoginButton>
               </div>
               <div className="absolute right-24 bottom-0 hidden lg:block translate-y-20">
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

      <footer className="bg-white border-t border-slate-100 pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
           <div className="space-y-6">
              <h2 className="text-3xl font-black tracking-tighter text-slate-950 italic">Scholar Script</h2>
              <p className="text-slate-500 text-sm">Nền tảng giáo dục cộng đồng hiện đại, kết nối tri thức đỉnh cao.</p>
           </div>
           <div>
              <h5 className="text-xs font-bold uppercase tracking-widest text-slate-900 mb-8">Nền tảng</h5>
              <ul className="space-y-4">
                 <li><Link href="#" className="text-sm text-slate-500 hover:text-primary">Thư viện</Link></li>
                 <li><Link href="#" className="text-sm text-slate-500 hover:text-primary">Lớp học</Link></li>
              </ul>
           </div>
           <div>
              <h5 className="text-xs font-bold uppercase tracking-widest text-slate-900 mb-8">Hỗ trợ</h5>
              <ul className="space-y-4">
                 <li><Link href="#" className="text-sm text-slate-500 hover:text-primary">Trung tâm trợ giúp</Link></li>
                 <li><Link href="#" className="text-sm text-slate-500 hover:text-primary">Điều khoản</Link></li>
              </ul>
           </div>
           <div>
              <h5 className="text-xs font-bold uppercase tracking-widest text-slate-900 mb-8">Liên hệ</h5>
              <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                 <input className="bg-transparent border-none outline-none text-xs flex-1 px-4" placeholder="Email..." />
                 <button className="bg-slate-900 text-white p-3 rounded-xl"><ChevronRight className="w-4 h-4" /></button>
              </div>
           </div>
        </div>
        <div className="max-w-7xl mx-auto pt-12 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
           <p className="text-xs text-slate-400">© 2026 Scholar Script Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
