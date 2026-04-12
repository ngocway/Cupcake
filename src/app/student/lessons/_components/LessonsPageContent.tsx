"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { 
   Play, 
   Video, 
   Search, 
   LayoutGrid, 
   GraduationCap, 
   User, 
   Eye, 
   Lock,
   ArrowRight,
   Bookmark,
   CheckCircle2,
   XCircle
} from "lucide-react";
import { toggleLessonBookmark, incrementLessonViews } from "../actions";

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string | null;
  teacherName: string | null;
  teacherId: string;
  viewsCount: number;
  isPremium: boolean;
  price: number;
  createdAt: Date;
  className?: string;
  isFavorite: boolean;
  type: "ASSIGNED" | "FREE";
}

interface Props {
  assignedLessons: Lesson[];
  publicLessons: Lesson[];
}

export default function LessonsPageContent({ assignedLessons, publicLessons }: Props) {
  const [activeCategory, setActiveCategory] = useState<"assigned" | "free">("assigned");
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const router = useRouter();

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const currentList = activeCategory === "assigned" ? assignedLessons : publicLessons;

  const filteredLessons = useMemo(() => {
    return currentList.filter((l) => {
      return l.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
             (l.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
             (l.className?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    });
  }, [currentList, searchQuery]);

  return (
    <div className="space-y-10 relative">
      {/* 0. Toast Notification */}
      {toast && (
        <div className="fixed bottom-10 right-10 z-[100] animate-in slide-in-from-right-full">
           <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${
             toast.type === 'success' 
             ? 'bg-secondary-container text-secondary border-secondary/20' 
             : 'bg-error-container text-error border-error/20'
           }`}>
              {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              <p className="font-bold text-sm tracking-tight">{toast.message}</p>
           </div>
        </div>
      )}

      {/* 1. Category Switcher */}
      <div className="flex p-1.5 bg-surface-container-low rounded-3xl w-fit border border-outline-variant/10 shadow-inner">
         <button 
            onClick={() => { setActiveCategory("assigned"); setSearchQuery(""); }}
            className={`flex items-center gap-2 px-8 py-3 rounded-2xl text-sm font-bold transition-all ${
               activeCategory === "assigned" 
               ? "bg-white dark:bg-slate-900 shadow-lg shadow-black/5 text-primary" 
               : "text-on-surface-variant hover:text-on-surface"
            }`}
         >
            <GraduationCap className="w-4 h-4" />
            Nội dung từ Lớp học
         </button>
         <button 
            onClick={() => { setActiveCategory("free"); setSearchQuery(""); }}
            className={`flex items-center gap-2 px-8 py-3 rounded-2xl text-sm font-bold transition-all ${
               activeCategory === "free" 
               ? "bg-white dark:bg-slate-900 shadow-lg shadow-black/5 text-primary" 
               : "text-on-surface-variant hover:text-on-surface"
            }`}
         >
            <LayoutGrid className="w-4 h-4" />
            Khám phá kiến thức
         </button>
      </div>

      {/* 2. Search & Toolbar */}
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
         <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline group-focus-within:text-primary transition-colors" />
            <input
               type="text"
               placeholder="Tìm bài giảng, nội dung học..."
               className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-outline-variant/30 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm font-medium"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
            />
         </div>

         {activeCategory === "free" && (
            <div className="flex items-center gap-3">
               <span className="text-xs font-bold text-outline-variant uppercase tracking-widest hidden sm:block">Sắp xếp:</span>
               <select className="bg-white dark:bg-slate-900 border border-outline-variant/30 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:border-primary">
                  <option>Mới nhất</option>
                  <option>Nổi bật</option>
                  <option>Xem nhiều nhất</option>
               </select>
            </div>
         )}
      </div>

      {/* 3. Results Grid */}
      {filteredLessons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredLessons.map((lesson) => (
            <LessonCard 
              key={lesson.id} 
              lesson={lesson} 
              onToast={showToast}
              onBadgeClick={(val) => setSearchQuery(val)}
            />
          ))}
        </div>
      ) : (
        <div className="py-24 text-center space-y-6 bg-surface-container-low/30 rounded-[3rem] border border-dashed border-outline-variant/30">
           <div className="w-20 h-20 bg-white/50 backdrop-blur rounded-full flex items-center justify-center mx-auto shadow-sm">
              <Video className="w-8 h-8 text-outline-variant" />
           </div>
           <div>
              <h3 className="text-xl font-extrabold">Không tìm thấy bài học</h3>
              <p className="text-on-surface-variant mt-2">Chúng mình đang cập nhật nội dung cho phần này, hãy quay lại sau nhé!</p>
           </div>
        </div>
      )}
    </div>
  );
}

function LessonCard({ 
  lesson, 
  onToast,
  onBadgeClick
}: { 
  lesson: Lesson; 
  onToast: (msg: string, type?: 'success' | 'error') => void;
  onBadgeClick: (val: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [isFavorite, setIsFavorite] = useState(lesson.isFavorite);
  const router = useRouter();

  const handleToggleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Optimistic Update
    setIsFavorite(!isFavorite);
    
    startTransition(async () => {
       try {
          const result = await toggleLessonBookmark(lesson.id);
          onToast(result.bookmarked ? "Đã lưu bài học" : "Đã xóa khỏi danh sách lưu");
       } catch (error) {
          setIsFavorite(isFavorite); // Rollback
          onToast("Có lỗi xảy ra khi lưu bài học", "error");
       }
    });
  };

  const handleLessonAccess = async (e: React.MouseEvent) => {
    if (lesson.isPremium) {
       e.preventDefault();
       onToast("Vui lòng mua hoặc nâng cấp tài khoản để xem bài học này", "error");
       return;
    }

    // Increment views via action
    startTransition(async () => {
       await incrementLessonViews(lesson.id);
       router.push(`/student/lessons/${lesson.id}`);
    });
  };

  return (
    <div
      onClick={handleLessonAccess}
      className={`group bg-white dark:bg-slate-900 rounded-[2.5rem] border border-outline-variant/10 overflow-hidden hover:shadow-2xl hover:shadow-black/5 hover:-translate-y-1 transition-all duration-300 flex flex-col cursor-pointer ${isPending ? 'opacity-70 grayscale' : ''}`}
    >
      {/* Video Thumbnail Placeholder */}
      <div className="aspect-video w-full bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
           <Video className="w-12 h-12 text-white/20 group-hover:scale-110 transition-transform duration-500" />
        </div>
        
        {/* Visual indicator of video */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity">
           <div className="flex items-center gap-2 text-white text-[10px] font-bold uppercase tracking-widest">
              <Play className="w-3 h-3 fill-current" />
              Xem ngay
           </div>
        </div>

        {/* Overlays */}
        <div className="absolute top-4 left-4">
           <button 
              onClick={(e) => {
                 e.stopPropagation();
                 onBadgeClick(lesson.className || "Public");
              }}
              className="bg-primary/90 backdrop-blur-sm px-3 py-1 rounded-lg text-[10px] font-extrabold text-white shadow-sm uppercase tracking-wider hover:scale-110 transition-transform"
           >
             {lesson.className || "Public"}
           </button>
        </div>
        
        {lesson.isPremium && (
           <div className="absolute top-4 right-4 animate-bounce">
              <div className="bg-tertiary-fixed text-on-tertiary-fixed p-1.5 rounded-full shadow-lg">
                 <Lock className="w-4 h-4" />
              </div>
           </div>
        )}
      </div>
      
      <div className="p-7 flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex justify-between items-start gap-4">
             <h4 className="font-extrabold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
               {lesson.title}
             </h4>
             <button 
                onClick={handleToggleBookmark}
                className={`transition-colors shrink-0 ${isFavorite ? "text-primary" : "text-outline-variant hover:text-primary"}`}
             >
                <Bookmark className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
             </button>
          </div>
          <p className="text-sm text-on-surface-variant line-clamp-2 leading-relaxed">
            {lesson.description || "Tìm hiểu thêm về chủ đề này cùng đội ngũ giáo viên giàu kinh nghiệm."}
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-outline-variant/10 pt-6">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center">
                 <User className="w-4 h-4 text-outline" />
              </div>
              <div className="text-xs font-bold">
                 <p className="text-on-surface truncate max-w-[100px]">{lesson.teacherName || "Instructor"}</p>
                 <div className="flex items-center gap-1.5 text-on-surface-variant font-medium">
                    <Eye className="w-3 h-3" />
                    <span>{lesson.viewsCount} lượt xem</span>
                 </div>
              </div>
           </div>
           
           <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-tighter">
              Chi tiết
              <ArrowRight className="w-4 h-4" />
           </div>
        </div>
      </div>
    </div>
  );
}
