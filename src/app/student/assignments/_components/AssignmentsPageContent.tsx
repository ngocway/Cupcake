"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns"
import { vi } from "date-fns/locale"
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
   ArrowRight
} from "lucide-react";
import { DirectStartLink } from "../../_components/DirectStartLink";

interface Assignment {
  id: string;
  slug: string | null;
  title: string;
  thumbnail: string | null;
  className: string;
  classId: string;
  assignedAt: Date;
  dueDate: Date | null;
  status: "PENDING" | "COMPLETED" | "IN_PROGRESS";
  score?: number | null;
  correctAnswers?: number | null;
  totalQuestions?: number | null;
  teacherName?: string | null;
  type: "ASSIGNED" | "FREE";
}

interface Props {
  assignments: Assignment[];
  source: "class" | "public";
  classes: { id: string; name: string }[];
  initialTab?: "pending" | "completed" | "in-progress";
}

export default function AssignmentsPageContent({ assignments, source, classes, initialTab }: Props) {
  const [activeTab, setActiveTab] = useState<"in-progress" | "completed">(initialTab === "completed" ? "completed" : "in-progress");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string>("all");

  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      const matchTab = activeTab === "in-progress" 
        ? (a.status === "PENDING" || a.status === "IN_PROGRESS")
        : (a.status === "COMPLETED");
      
      const matchSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchClass = source === "public" || selectedClassId === "all" || a.classId === selectedClassId;
      return matchTab && matchSearch && matchClass;
    });
  }, [assignments, activeTab, searchQuery, selectedClassId, source]);

  return (
    <div className="space-y-10">

      {/* 2. Toolbar: Search, Filters & Tabs */}
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
                  Đang làm ({assignments.filter(a => a.status === "PENDING" || a.status === "IN_PROGRESS").length})
               </button>
               <button
                  onClick={() => setActiveTab("completed")}
                  className={`pb-4 text-sm font-label font-bold transition-all relative whitespace-nowrap ${
                     activeTab === "completed"
                     ? "text-green-500 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-green-500"
                     : "text-outline hover:text-on-surface"
                  }`}
               >
                  Đã hoàn thành ({assignments.filter(a => a.status === "COMPLETED").length})
               </button>
            </div>

            {/* Search and Class Filter */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
               <div className="relative w-full sm:w-80 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline group-focus-within:text-primary transition-colors" />
                  <input
                     type="text"
                     placeholder="Tìm kiếm bài học..."
                     className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-outline-variant/50 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm font-medium"
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                  />
               </div>

               {source === "class" && (
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-full sm:max-w-xs pb-1 sm:pb-0">
                     <button
                        onClick={() => setSelectedClassId("all")}
                        className={`px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all border ${
                           selectedClassId === "all"
                           ? "bg-on-surface text-white border-on-surface"
                           : "bg-white dark:bg-slate-900 text-on-surface-variant border-outline-variant hover:border-primary"
                        }`}
                     >
                        Tất cả lớp
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

      {/* 3. Result Grid */}
      {filteredAssignments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredAssignments.map((a) => (
            <DirectStartLink
              key={a.id}
              id={a.slug || a.id}
              className="group bg-white dark:bg-slate-900 rounded-[2.5rem] border border-outline-variant/10 overflow-hidden hover:shadow-2xl hover:shadow-black/5 hover:-translate-y-1 transition-all duration-300 flex flex-col relative"
            >
              {/* Thumbnail Wrap */}
              <div className="aspect-[4/3] w-full bg-surface-container relative overflow-hidden">
                <img
                  src={a.thumbnail || "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=800&auto=format&fit=crop"}
                  alt={a.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                
                {/* Floating Tags */}
                <div className="absolute top-5 left-5 right-5 flex justify-between items-start pointer-events-none">
                   <span className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-extrabold text-primary shadow-sm uppercase tracking-[0.1em]">
                     {a.className}
                   </span>
                   {a.status === "COMPLETED" && (
                      <div className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center shadow-lg">
                         <CheckCircle2 className="w-5 h-5" />
                      </div>
                   )}
                </div>

                {source === "class" && a.dueDate && a.status === "PENDING" && (
                   <div className="absolute bottom-5 left-5">
                      <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold shadow-sm backdrop-blur-md flex items-center gap-2 ${
                        (new Date(a.dueDate).getTime() - new Date().getTime()) < 86400000 
                        ? "bg-error text-white" 
                        : "bg-surface-container-lowest/90 text-on-surface-variant"
                      }`}>
                         <Clock className="w-3 h-3" />
                         {(new Date(a.dueDate).getTime() - new Date().getTime()) < 86400000 ? "Gấp: Cần nộp ngay" : `Hạn: ${format(new Date(a.dueDate), "dd/MM/yyyy", { locale: vi })}`}
                      </div>
                   </div>
                )}
              </div>
              
              {/* Content Body */}
              <div className="p-8 flex-1 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <h4 className="font-extrabold text-xl leading-snug group-hover:text-primary transition-colors line-clamp-2">
                    {a.title}
                  </h4>
                  <div className="flex items-center gap-2 text-on-surface-variant">
                     {/* Teacher Info */}
                     <div className="flex items-center gap-1.5 text-xs font-semibold">
                        <User className="w-3.5 h-3.5 text-outline" />
                        <span>{a.teacherName || "Hệ thống"}</span>
                     </div>
                     <span className="text-outline-variant text-[10px]">|</span>
                     <div className="flex items-center gap-1.5 text-xs font-medium">
                        <Calendar className="w-3.5 h-3.5 text-outline" />
                        <span>{format(new Date(a.assignedAt), "dd/MM/yyyy", { locale: vi })}</span>
                     </div>
                  </div>
                </div>

                 <div className="flex items-center justify-between border-t border-outline-variant/10 pt-6">
                    {a.status === "COMPLETED" ? (
                       <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                             <p className="text-[10px] text-outline font-bold uppercase tracking-widest">Kết quả</p>
                             <div className="flex items-baseline gap-1">
                                <span className="font-black text-2xl text-green-500">{a.correctAnswers ?? 0}</span>
                                <span className="text-sm text-outline font-bold">/{a.totalQuestions ?? 0} câu</span>
                             </div>
                          </div>
                       </div>
                    ) : (
                       <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${a.status === "IN_PROGRESS" ? "bg-amber-500/20 text-amber-500" : "bg-primary-fixed/30 text-primary"}`}>
                             {a.status === "IN_PROGRESS" ? <Clock className="w-6 h-6" /> : <PlayCircle className="w-6 h-6" />}
                          </div>
                          <p className={`text-sm font-black uppercase tracking-tighter ${a.status === "IN_PROGRESS" ? "text-amber-500" : "text-primary"}`}>
                             {a.status === "IN_PROGRESS" ? "Đang làm dở" : source === "class" ? "Làm nhiệm vụ" : "Học ngay"}
                          </p>
                       </div>
                    )}
                   <div className="w-10 h-10 rounded-full border border-outline-variant/30 flex items-center justify-center group-hover:bg-on-surface group-hover:border-on-surface group-hover:text-white transition-all">
                     <ArrowRight className="w-5 h-5" />
                   </div>
                </div>
              </div>
            </DirectStartLink>
          ))}
        </div>
      ) : (
        <div className="py-32 text-center space-y-6 bg-surface-container-lowest/50 rounded-[3rem] border border-dashed border-outline-variant/50 max-w-4xl mx-auto shadow-inner">
           <div className="w-24 h-24 bg-surface-container-low rounded-full flex items-center justify-center mx-auto ring-8 ring-surface-container-low/30">
              <GraduationCap className="w-10 h-10 text-outline" />
           </div>
           <div className="max-w-sm mx-auto">
              <h3 className="text-2xl font-black">Chưa có nội dung ở đây</h3>
              <p className="text-on-surface-variant mt-3 leading-relaxed">
                {searchQuery ? "Chúng mình không tìm thấy bài nào khớp với từ khóa bạn nhập. Thử lại nhé!" : source === "class" ? "Bạn đã hoàn thành tất cả bài tập từ giáo viên rồi đấy. Thật tuyệt vời!" : "Kho học liệu đang được cập nhật thêm. Hãy quay lại sau nhé!"}
              </p>
           </div>
           {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-primary font-bold text-sm underline underline-offset-4">Xóa tìm kiếm</button>
           )}
        </div>
      )}
    </div>
  );
}
