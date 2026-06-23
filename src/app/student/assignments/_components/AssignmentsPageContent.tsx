"use client";

import { useState, useMemo, memo, useRef, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { useVirtualizer } from "@tanstack/react-virtual";
import { 
  LayoutGrid, 
  GraduationCap, 
  Search, 
  Filter, 
  PlayCircle, 
  CheckCircle2, 
  Clock, 
  Calendar,
  User,
  ArrowRight,
  Loader2
} from "lucide-react";
import { DirectStartLink } from "../../_components/DirectStartLink";
import { useAssignments, AssignmentItem } from "@/hooks/useStudentContent";
import { useTranslations, useLocale } from "next-intl";
import { enUS } from "date-fns/locale";

interface Props {
  initialAssignments?: AssignmentItem[];
  initialSource: "class" | "public";
  classes: { id: string; name: string }[];
  initialTab?: "pending" | "completed" | "in-progress";
}

// Memoized Assignment Card
const AssignmentCard = memo(function AssignmentCard({ 
  assignment,
  source,
  style
}: { 
  assignment: AssignmentItem;
  source: "class" | "public";
  style?: React.CSSProperties;
}) {
  const t = useTranslations("student.assignments");
  const locale = useLocale();
  const dateLocale = locale === "vi" ? vi : enUS;

  return (
    <DirectStartLink
      id={assignment.slug || assignment.id}
      style={style}
      className="group bg-white dark:bg-slate-900 rounded-[8px] border border-outline-variant/10 overflow-hidden hover:shadow-2xl hover:shadow-black/5 hover:-translate-y-1 transition-all duration-300 flex flex-col relative"
    >
      {/* Thumbnail Wrap */}
      <div className="relative aspect-video w-full bg-surface-container overflow-hidden rounded-[8px] shadow-xl">
        <img
          src={assignment.thumbnail || "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=800&auto=format&fit=crop"}
          alt={assignment.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          loading="lazy"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
        
        {/* Floating Tags */}
        <div className="absolute top-5 left-5 right-5 flex justify-between items-start pointer-events-none">
           <span className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-extrabold text-primary shadow-sm uppercase tracking-[0.1em]">
             {assignment.className}
           </span>
           {assignment.status === "COMPLETED" && (
              <div className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center shadow-lg">
                 <CheckCircle2 className="w-5 h-5" />
              </div>
           )}
        </div>

        {source === "class" && assignment.dueDate && assignment.status === "PENDING" && (
           <div className="absolute bottom-5 left-5">
              <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold shadow-sm backdrop-blur-md flex items-center gap-2 ${
                (new Date(assignment.dueDate).getTime() - new Date().getTime()) < 86400000 
                ? "bg-error text-white" 
                : "bg-surface-container-lowest/90 text-on-surface-variant"
              }`}>
                 <Clock className="w-3 h-3" />
                 {(new Date(assignment.dueDate).getTime() - new Date().getTime()) < 86400000 ? t("urgent") : t("due", { date: format(new Date(assignment.dueDate), "dd/MM/yyyy", { locale: dateLocale }) })}
              </div>
           </div>
        )}
      </div>
      
      {/* Content Body */}
      <div className="p-8 flex-1 flex flex-col justify-between space-y-6">
        <div className="space-y-3">
          <h4 className="font-extrabold text-xl leading-snug group-hover:text-primary transition-colors line-clamp-2">
            {assignment.title}
          </h4>
          <div className="flex items-center gap-2 text-on-surface-variant">
             {/* Teacher Info */}
             <div className="flex items-center gap-1.5 text-xs font-semibold">
                <User className="w-3.5 h-3.5 text-outline" />
                <span>{assignment.teacherName || t("system")}</span>
             </div>
             <span className="text-outline-variant text-[10px]">|</span>
             <div className="flex items-center gap-1.5 text-xs font-medium">
                <Calendar className="w-3.5 h-3.5 text-outline" />
                <span>{format(new Date(assignment.assignedAt), "dd/MM/yyyy", { locale: dateLocale })}</span>
             </div>
          </div>
        </div>

         <div className="flex items-center justify-between border-t border-outline-variant/10 pt-6">
            {assignment.status === "COMPLETED" ? (
               <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                     <p className="text-[10px] text-outline font-bold uppercase tracking-widest">{t("result")}</p>
                     <div className="flex items-baseline gap-1">
                        <span className="font-black text-2xl text-green-500">{assignment.correctAnswers ?? 0}</span>
                        <span className="text-sm text-outline font-bold">/{assignment.totalQuestions ?? 0} {t("questions")}</span>
                     </div>
                  </div>
               </div>
            ) : (
               <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${assignment.status === "IN_PROGRESS" ? "bg-amber-500/20 text-amber-500" : "bg-primary-fixed/30 text-primary"}`}>
                     {assignment.status === "IN_PROGRESS" ? <Clock className="w-6 h-6" /> : <PlayCircle className="w-6 h-6" />}
                  </div>
                  <p className={`text-sm font-black uppercase tracking-tighter ${assignment.status === "IN_PROGRESS" ? "text-amber-500" : "text-primary"}`}>
                     {assignment.status === "IN_PROGRESS" ? t("inProgress") : source === "class" ? t("doTask") : t("learnNow")}
                  </p>
               </div>
            )}
           <div className="w-10 h-10 rounded-full border border-outline-variant/30 flex items-center justify-center group-hover:bg-on-surface group-hover:border-on-surface group-hover:text-white transition-all">
             <ArrowRight className="w-5 h-5" />
           </div>
        </div>
      </div>
    </DirectStartLink>
  );
});

export default function AssignmentsPageContent(props: Props) {
  const { 
    initialAssignments = [], 
    initialSource = "public", 
    classes: initialClasses = [], 
    initialTab = "pending"
  } = props;
  const t = useTranslations("student.assignments");
  const [activeTab, setActiveTab] = useState<"in-progress" | "completed">(initialTab === "completed" ? "completed" : "in-progress");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  const [page, setPage] = useState(1);
  const parentRef = useRef<HTMLDivElement>(null);

  // TanStack Query for data fetching
  const { data, isLoading, isFetching } = useAssignments({
    source: initialSource,
    page,
    filter: activeTab === "completed" ? "completed" : "in-progress"
  });

  // Merge initial data with fetched data
  const assignments = useMemo(() => {
    if (data?.assignments) return data.assignments;
    return initialAssignments || [];
  }, [data, initialAssignments]);

  const classes = useMemo(() => {
    if (data?.classes) return data.classes;
    return initialClasses || [];
  }, [data, initialClasses]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      const matchSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchClass = selectedClassId === "all" || a.classId === selectedClassId;
      return matchSearch && matchClass;
    });
  }, [assignments, searchQuery, selectedClassId]);

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

  // Virtual scrolling
  const rowVirtualizer = useVirtualizer({
    count: Math.ceil(filteredAssignments.length / columns),
    getScrollElement: () => parentRef.current,
    estimateSize: () => 520,
    overscan: 3,
  });

  const showLoadMore = false;

  return (
    <div className="space-y-10">

      {/* Toolbar: Search, Filters & Tabs */}
      <div className="space-y-6">
         <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            {/* Tabs (Pending vs Completed) */}
            <div className="flex gap-8 border-b border-outline-variant/30 px-2 overflow-x-auto w-full lg:w-auto">
               <button
                  onClick={() => setActiveTab("in-progress")}
                  className={`pb-4 text-sm font-label font-bold transition-all relative whitespace-nowrap ${
                     activeTab === "in-progress"
                     ? "text-amber-500 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-amber-500"
                     : "text-outline hover:text-on-surface"
                  }`}
               >
                  {t("inProgress")} ({assignments.filter(a => a.status === "PENDING" || a.status === "IN_PROGRESS").length})
               </button>
               <button
                  onClick={() => setActiveTab("completed")}
                  className={`pb-4 text-sm font-label font-bold transition-all relative whitespace-nowrap ${
                     activeTab === "completed"
                     ? "text-green-500 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-green-500"
                     : "text-outline hover:text-on-surface"
                  }`}
               >
                  {t("completed")} ({assignments.filter(a => a.status === "COMPLETED").length})
               </button>
            </div>

            {/* Search and Class Filter */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
               <div className="relative w-full sm:w-80 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline group-focus-within:text-primary transition-colors" />
                  <input
                     type="text"
                     placeholder={t("searchPlaceholder")}
                     className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-outline-variant/50 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm font-medium"
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
                           : "bg-white dark:bg-slate-900 text-on-surface-variant border-outline-variant hover:border-primary"
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
                              : "bg-white dark:bg-slate-900 text-on-surface-variant border-outline-variant hover:border-primary"
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

      {/* Result Grid — simple render on mobile, virtual scroll on desktop */}
      {!isLoading && filteredAssignments.length > 0 ? (
        <>
          {/* Mobile: simple grid (no virtual scroll) */}
          <div className="grid grid-cols-1 gap-6 md:hidden">
            {filteredAssignments.map((a) => (
              <AssignmentCard
                key={a.id}
                assignment={a}
                source={initialSource}
              />
            ))}
          </div>

          {/* Desktop: virtual scroll */}
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
              <div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 absolute w-full"
              >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const startIndex = virtualRow.index * columns;
                  const rowAssignments = filteredAssignments.slice(startIndex, startIndex + columns);
                  
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
                      {rowAssignments.map((a) => (
                        <AssignmentCard
                          key={a.id}
                          assignment={a}
                          source={initialSource}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Load More */}
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
        <div className="py-32 text-center space-y-6 bg-surface-container-lowest/50 rounded-[3rem] border border-dashed border-outline-variant/50 max-w-4xl mx-auto shadow-inner">
           <div className="w-24 h-24 bg-surface-container-low rounded-full flex items-center justify-center mx-auto ring-8 ring-surface-container-low/30">
              <GraduationCap className="w-10 h-10 text-outline" />
           </div>
           <div className="max-w-sm mx-auto">
              <h3 className="text-2xl font-black">{t("noContent")}</h3>
              <p className="text-on-surface-variant mt-3 leading-relaxed">
                {searchQuery ? t("noResultsFound") : initialSource === "class" ? t("classAssignmentsWelcome") : t("publicAssignmentsWelcome")}
              </p>
           </div>
           {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-primary font-bold text-sm underline underline-offset-4">{t("clearSearch")}</button>
           )}
        </div>
      )}
    </div>
  );
}
