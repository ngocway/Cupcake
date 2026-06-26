"use client";

import { useState, useMemo, useTransition, memo, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useVirtualizer } from "@tanstack/react-virtual";
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
  XCircle,
  Clock,
  Loader2
} from "lucide-react";
import { toggleLessonBookmark, incrementLessonViews } from "../actions";
import { useLessons, LessonItem } from "@/hooks/useStudentContent";
import { useTranslations, useLocale } from "next-intl";
import { vi, enUS } from "date-fns/locale";

interface Props {
  initialLessons?: LessonItem[];
  initialSource: "class" | "public";
  classes: { id: string; name: string }[];
}

// Memoized LessonCard for performance
const LessonCard = memo(function LessonCard({ 
  lesson, 
  onToast,
  onBadgeClick,
  style
}: { 
  lesson: LessonItem; 
  onToast: (msg: string, type?: 'success' | 'error') => void;
  onBadgeClick: (val: string) => void;
  style?: React.CSSProperties;
}) {
  const t = useTranslations("lessonsPage");
  const locale = useLocale();
  const dateLocale = locale === "vi" ? vi : enUS;
  const [isPending, startTransition] = useTransition();
  const [isFavorite, setIsFavorite] = useState(lesson.isFavorite);
  const router = useRouter();

  const handleToggleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    
    startTransition(async () => {
       try {
          const result = await toggleLessonBookmark(lesson.id);
          onToast(result.bookmarked ? t("bookmarkSuccess") : t("bookmarkRemoved"));
       } catch (error) {
          setIsFavorite(isFavorite);
          onToast(t("bookmarkError"), "error");
       }
    });
  };

  const handleLessonAccess = async (e: React.MouseEvent) => {
    if (lesson.isPremium) {
       e.preventDefault();
       onToast(t("premiumError"), "error");
       return;
    }

    startTransition(async () => {
       await incrementLessonViews(lesson.id);
       const identifier = lesson.slug || lesson.id;
       window.dispatchEvent(new Event("show-global-loader"));
       router.push(`/student/lessons/${identifier}`);
    });
  };

  return (
    <div
      onClick={handleLessonAccess}
      style={style}
      className={`group bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-[8px] border border-slate-100 dark:border-slate-700 overflow-hidden hover:shadow-2xl hover:shadow-black/5 hover:-translate-y-1 transition-all duration-300 flex flex-col cursor-pointer ${isPending ? 'opacity-70 grayscale' : ''}`}
    >
      {/* Video Thumbnail Placeholder */}
      <div className="relative aspect-video w-full overflow-hidden rounded-[8px] bg-slate-900 shadow-xl group">
        <div className="absolute inset-0 flex items-center justify-center">
           <Video className="w-12 h-12 text-white/20 group-hover:scale-110 transition-transform duration-500" />
        </div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>

        {/* Class Badge */}
        <div className="absolute top-4 left-4">
           <button 
              onClick={(e) => {
                 e.stopPropagation();
                 onBadgeClick(lesson.className || "Public");
              }}
              className="bg-primary/90 backdrop-blur-sm px-3 py-1 rounded-lg text-[10px] font-extrabold text-white shadow-sm uppercase tracking-wider hover:scale-110 transition-transform"
           >
             {lesson.className || t("public")}
           </button>
        </div>
        
        {/* Premium Lock */}
        {lesson.isPremium && (
           <div className="absolute top-4 right-4 animate-bounce">
              <div className="bg-tertiary-fixed text-on-tertiary-fixed p-1.5 rounded-full shadow-lg">
                 <Lock className="w-4 h-4" />
              </div>
           </div>
        )}

        {/* Status Badge */}
        {lesson.status !== "PENDING" && (
          <div className="absolute bottom-4 right-4">
            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg backdrop-blur-md ${
              lesson.status === "COMPLETED" ? "bg-green-500 text-white" : "bg-amber-500 text-white"
            }`}>
              {lesson.status === "COMPLETED" ? (
                <>
                  <CheckCircle2 className="w-3 h-3" />
                  {t("completed")}
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3" />
                  {t("inProgress")}
                </>
              )}
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
            {lesson.description || t("defaultDescription")}
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-outline-variant/10 pt-6">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center">
                 <User className="w-4 h-4 text-outline" />
              </div>
              <div className="text-xs font-bold">
                 <p className="text-on-surface truncate max-w-[100px]">{lesson.teacherName || t("instructor")}</p>
                 <div className="flex items-center gap-1.5 text-on-surface-variant font-medium">
                    <Eye className="w-3 h-3" />
                    <span>{lesson.viewsCount} {t("views")}</span>
                 </div>
              </div>
           </div>
           
           <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-tighter">
              {t("details")}
              <ArrowRight className="w-4 h-4" />
           </div>
        </div>
      </div>
    </div>
  );
});

export default function LessonsPageContent(props: Props) {
  const t = useTranslations("lessonsPage");
  const { initialLessons = [], initialSource = "public", classes: initialClasses = [] } = props;
  const [activeTab, setActiveTab] = useState<"in-progress" | "completed">("in-progress");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [page, setPage] = useState(1);
  const parentRef = useRef<HTMLDivElement>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleBadgeClick = useCallback((val: string) => {
    setSelectedClassId(val);
  }, []);

  // Use TanStack Query for data fetching with caching
  const { data, isLoading, isFetching } = useLessons({
    source: initialSource,
    page
  });

  // Merge initial data with fetched data
  const lessons = useMemo(() => {
    if (data?.lessons) return data.lessons;
    return initialLessons || [];
  }, [data, initialLessons]);

  const classes = useMemo(() => {
    if (data?.classes) return data.classes;
    return initialClasses || [];
  }, [data, initialClasses]);

  const filteredLessons = useMemo(() => {
    return lessons.filter((l) => {
      const matchTab = activeTab === "in-progress" 
        ? (l.status === "PENDING" || l.status === "IN_PROGRESS")
        : (l.status === "COMPLETED");
        
      const matchSearch = l.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
             (l.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
             (l.className?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
             
      const matchClass = selectedClassId === "all" || l.className === selectedClassId;
             
      return matchTab && matchSearch && matchClass;
    });
  }, [lessons, activeTab, searchQuery, selectedClassId]);

  const [columns, setColumns] = useState(3);
  
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setColumns(1);
      else if (window.innerWidth < 1024) setColumns(2);
      else setColumns(3);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Virtual scrolling setup
  const rowVirtualizer = useVirtualizer({
    count: Math.ceil(filteredLessons.length / columns),
    getScrollElement: () => parentRef.current,
    estimateSize: () => 480,
    overscan: 3,
  });

  // Check if we should show load more button
  const showLoadMore = false;

  return (
    <div className="space-y-10 relative">
      {/* Toast Notification */}
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

      {/* Toolbar: Search, Filters & Tabs */}
      <div className="space-y-6">
         <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            {/* Tabs (In-progress vs Completed) */}
            <div className="flex gap-8 border-b border-outline-variant/30 px-2 overflow-x-auto w-full lg:w-auto">
               <button
                  onClick={() => setActiveTab("in-progress")}
                  className={`pb-4 text-sm font-label font-bold transition-all relative whitespace-nowrap ${
                     activeTab === "in-progress"
                     ? "text-amber-500 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-amber-500"
                     : "text-outline hover:text-on-surface"
                  }`}
               >
                  {t("inProgress")} ({lessons.filter(l => l.status === "PENDING" || l.status === "IN_PROGRESS").length})
               </button>
               <button
                  onClick={() => setActiveTab("completed")}
                  className={`pb-4 text-sm font-label font-bold transition-all relative whitespace-nowrap ${
                     activeTab === "completed"
                     ? "text-green-500 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-green-500"
                     : "text-outline hover:text-on-surface"
                  }`}
               >
                  {t("completed")} ({lessons.filter(l => l.status === "COMPLETED").length})
               </button>
            </div>

            {/* Search and Class Filter */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
               <div className="relative w-full sm:w-80 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline group-focus-within:text-primary transition-colors" />
                  <input
                     type="text"
                     className="w-full pl-11 pr-4 py-3 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm font-medium"
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                  />
               </div>

               {initialSource === "class" && (
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-full sm:max-w-xs pb-1 sm:pb-0">
                     <button
                        onClick={() => setSelectedClassId("all")}
                        className={`px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all border ${
                           selectedClassId === "all"
                           ? "bg-on-surface text-white border-on-surface"
                           : "bg-white/60 dark:bg-slate-800/60 backdrop-blur-md text-slate-500 border-slate-200 dark:border-slate-700 hover:border-primary"
                        }`}
                     >
                        {t("allClasses")}
                     </button>
                     {classes.map((c) => (
                        <button
                           key={c.id}
                           onClick={() => setSelectedClassId(c.id)}
                           className={`px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all border ${
                              selectedClassId === c.id
                              ? "bg-on-surface text-white border-on-surface"
                              : "bg-white/60 dark:bg-slate-800/60 backdrop-blur-md text-slate-500 border-slate-200 dark:border-slate-700 hover:border-primary"
                           }`}
                        >
                           {c.name}
                        </button>
                     ))}
                  </div>
               )}
            </div>
         </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="animate-pulse">
              <div className="aspect-video bg-slate-200 dark:bg-slate-800 rounded-[8px] mb-4" />
              <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-3/4 mb-2" />
              <div className="h-4 bg-slate-100 dark:bg-slate-800/50 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Results Grid — simple render on mobile, virtual scroll on desktop */}
      {!isLoading && filteredLessons.length > 0 ? (
        <>
          {/* Mobile: simple grid (no virtual scroll to avoid layout bugs) */}
          <div className="grid grid-cols-1 gap-6 md:hidden">
            {filteredLessons.map((lesson) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                onToast={showToast}
                onBadgeClick={handleBadgeClick}
              />
            ))}
          </div>

          {/* Desktop: virtual scroll for performance */}
          <div 
            ref={parentRef}
            className="overflow-auto hidden md:block"
            style={{ maxHeight: "80vh" }}
          >
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              <div className="absolute top-0 left-0 w-full">
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const startIndex = virtualRow.index * columns;
                  const rowLessons = filteredLessons.slice(startIndex, startIndex + columns);
                  
                  return (
                    <div
                      key={virtualRow.key}
                      style={{
                        position: "absolute",
                        top: 0,
                        transform: `translateY(${virtualRow.start}px)`,
                        width: "100%",
                        display: "grid",
                        gridTemplateColumns: `repeat(${columns}, 1fr)`,
                        gap: "2rem",
                      }}
                    >
                      {rowLessons.map((lesson) => (
                        <LessonCard
                          key={lesson.id}
                          lesson={lesson}
                          onToast={showToast}
                          onBadgeClick={handleBadgeClick}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Load More / Loading Indicator */}
          {showLoadMore && (
            <div className="flex justify-center py-8">
              <button
                className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-full font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {t("loadMore")}
              </button>
            </div>
          )}
        </>
      ) : !isLoading && (
        <div className="py-24 text-center space-y-6 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-700">
           <div className="w-20 h-20 bg-white/50 backdrop-blur rounded-full flex items-center justify-center mx-auto shadow-sm">
              <Video className="w-8 h-8 text-outline-variant" />
           </div>
           <div>
              <h3 className="text-xl font-extrabold">{t("noContent")}</h3>
              <p className="text-on-surface-variant mt-2">
                {searchQuery 
                  ? t("noResultsFound") 
                  : initialSource === "class" 
                    ? t("classLessonsWelcome") 
                    : t("publicLessonsWelcome")
                }
              </p>
           </div>
        </div>
      )}
    </div>
  );
}
