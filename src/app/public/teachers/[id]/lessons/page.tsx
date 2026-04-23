
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { 
  ChevronLeft, 
  BookOpen, 
  User, 
  Eye, 
  Clock,
  ArrowRight,
  Video
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import BackButton from "@/components/ui/BackButton";

export default async function TeacherLessonsPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const session = await auth();
  const { id } = await params;
  const isLoggedIn = !!session?.user;

  const teacher = await prisma.user.findUnique({
    where: { id },
    include: {
      _count: { select: { lessons: true } }
    }
  });

  if (!teacher) notFound();

  const lessons = await prisma.lesson.findMany({
    where: {
      teacherId: id,
      assignment: {
        status: isLoggedIn ? { in: ["PUBLIC", "PRIVATE"] as any } : "PUBLIC"
      },
      isBlocked: false,
      deletedAt: null
    },
    include: {
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
          <BackButton />
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-10">
          {/* Teacher Profile Section */}
          <div className="bg-white rounded-[3rem] p-10 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-8">
             <div className="w-32 h-32 rounded-[2rem] bg-slate-100 overflow-hidden ring-4 ring-primary/5">
                {teacher.image ? (
                  <img src={teacher.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300"><User className="w-12 h-12" /></div>
                )}
             </div>
             <div className="text-center md:text-left space-y-2 flex-1">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Kho lưu trữ bài giảng</p>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">{teacher.name}</h1>
                <div className="flex items-center justify-center md:justify-start gap-4 text-sm font-bold text-slate-400">
                   <span className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-primary" />
                      {lessons.length} Bài giảng hiển thị
                   </span>
                </div>
             </div>
             <Link 
               href={`/profile/${id}`}
               className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm tracking-widest hover:scale-105 transition-all shadow-xl shadow-slate-900/10"
             >
                XEM HỒ SƠ
             </Link>
          </div>

          {/* Lessons List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {lessons.length > 0 ? (
               lessons.map((lesson) => (
                 <Link 
                   key={lesson.id}
                   href={isLoggedIn ? `/student/lessons/${lesson.id}` : `/public/lessons/${lesson.id}`}
                   className="group bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all flex flex-col"
                 >
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
                       
                       {/* Visibility Label */}
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
                             XEM BÀI GIẢNG <ArrowRight className="w-4 h-4" />
                          </span>
                       </div>
                    </div>

                    <div className="p-8 flex-1 flex flex-col justify-between space-y-4">
                       <div className="space-y-2">
                          <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                             <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {format(lesson.createdAt, "dd/MM/yyyy", { locale: vi })}
                             </span>
                             <span className="flex items-center gap-1">
                                <Eye className="w-3.5 h-3.5" />
                                {lesson.viewsCount} Lượt xem
                             </span>
                          </div>
                          <h2 className="text-xl font-black text-slate-900 group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                             {lesson.title}
                          </h2>
                       </div>

                       <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-[10px] font-black text-primary bg-primary/5 px-3 py-1 rounded-full uppercase tracking-widest">
                             {lesson.assignment?._count.questions} Câu hỏi rèn luyện
                          </div>
                          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary transition-colors">
                             <ChevronLeft className="w-4 h-4 rotate-180 group-hover:text-white" />
                          </div>
                       </div>
                    </div>
                 </Link>
               ))
             ) : (
               <div className="col-span-full py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-200 text-center space-y-4">
                  <p className="text-slate-400 font-bold">Giáo viên này chưa có bài giảng nào được hiển thị.</p>
               </div>
             )}
          </div>
        </div>
      </main>
    </div>
  );
}
