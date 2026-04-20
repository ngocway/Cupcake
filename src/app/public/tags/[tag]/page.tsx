
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { 
  ChevronLeft, 
  BookOpen, 
  User, 
  Eye, 
  Tag,
  Clock,
  ArrowRight
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export default async function TagLessonsPage({ 
  params 
}: { 
  params: Promise<{ tag: string }> 
}) {
  const session = await auth();
  const { tag: tagRaw } = await params;
  const tag = decodeURIComponent(tagRaw);
  const isLoggedIn = !!session?.user;

  const lessons = await prisma.lesson.findMany({
    where: {
      assignment: {
        status: isLoggedIn ? { in: ["PUBLIC", "PRIVATE"] as any } : "PUBLIC",
        tags: { contains: tag }
      },
      isBlocked: false,
      deletedAt: null
    },
    include: {
      teacher: { select: { name: true, image: true } },
      assignment: { 
        select: { 
          thumbnail: true, 
          status: true,
          _count: { select: { questions: true } }
        } 
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-black">C</div>
            <span className="font-black text-xl tracking-tighter text-slate-900 uppercase">CUPCAKES</span>
          </Link>
          <Link 
            href="/public/lessons" 
            className="text-sm font-bold text-slate-500 hover:text-primary transition-colors flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Tất cả bài học
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-10">
          {/* Tag Title Section */}
          <div className="space-y-4">
             <div className="flex items-center gap-3 text-primary">
                <div className="p-3 bg-primary/10 rounded-2xl">
                   <Tag className="w-6 h-6" />
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                   Chủ đề: <span className="text-primary">#{tag}</span>
                </h1>
             </div>
             <p className="text-slate-500 font-medium">
                Tìm thấy {lessons.length} bài học liên quan đến từ khóa này.
             </p>
          </div>

          {/* Lessons List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {lessons.length > 0 ? (
               lessons.map((lesson) => (
                 <Link 
                   key={lesson.id}
                   href={`/public/lessons/${lesson.id}`}
                   className="group bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all flex flex-col"
                 >
                    {/* Thumbnail */}
                    <div className="aspect-video relative overflow-hidden bg-slate-100">
                       {lesson.assignment?.thumbnail ? (
                         <img 
                           src={lesson.assignment.thumbnail} 
                           alt={lesson.title} 
                           className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                         />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <BookOpen className="w-12 h-12" />
                         </div>
                       )}
                       
                       {/* Visibility Label (Requirement) */}
                       <div className="absolute top-4 left-4">
                          <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ${
                            lesson.assignment?.status === 'PUBLIC' 
                              ? 'bg-green-500 text-white' 
                              : 'bg-amber-500 text-white'
                          }`}>
                             {lesson.assignment?.status}
                          </span>
                       </div>

                       <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                          <span className="text-white font-black text-xs tracking-widest flex items-center gap-2">
                             XEM CHI TIẾT <ArrowRight className="w-4 h-4" />
                          </span>
                       </div>
                    </div>

                    {/* Content */}
                    <div className="p-8 flex-1 flex flex-col justify-between space-y-4">
                       <div className="space-y-2">
                          <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                             <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {format(lesson.createdAt, "dd/MM/yyyy", { locale: vi })}
                             </span>
                             <span className="flex items-center gap-1">
                                <Eye className="w-3.5 h-3.5" />
                                {lesson.viewsCount}
                             </span>
                          </div>
                          <h2 className="text-xl font-black text-slate-900 group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                             {lesson.title}
                          </h2>
                       </div>

                       <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-lg bg-slate-100 overflow-hidden">
                                {lesson.teacher.image ? (
                                  <img src={lesson.teacher.image} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-300"><User className="w-4 h-4" /></div>
                                )}
                             </div>
                             <span className="text-xs font-bold text-slate-600">{lesson.teacher.name}</span>
                          </div>
                          <div className="text-[10px] font-black text-primary bg-primary/5 px-3 py-1 rounded-full uppercase">
                             {lesson.assignment?._count.questions} Câu hỏi
                          </div>
                       </div>
                    </div>
                 </Link>
               ))
             ) : (
               <div className="col-span-full py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-200 text-center space-y-4">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                     <Tag className="w-10 h-10" />
                  </div>
                  <div className="space-y-1">
                     <p className="text-slate-900 font-black text-xl">Không có bài học nào</p>
                     <p className="text-slate-500 font-medium">Chúng tôi chưa tìm thấy bài học nào cho chủ đề này.</p>
                  </div>
                  <Link 
                    href="/public/lessons"
                    className="inline-block px-8 py-3 bg-primary text-white rounded-2xl font-black text-sm tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                  >
                    KHÁM PHÁ BÀI HỌC KHÁC
                  </Link>
               </div>
             )}
          </div>
        </div>
      </main>
    </div>
  );
}
