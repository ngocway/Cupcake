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

interface Assignment {
  id: string;
  title: string;
  thumbnail: string | null;
  className: string;
  classId: string;
  assignedAt: Date;
  dueDate: Date | null;
  status: "PENDING" | "COMPLETED";
  score?: number | null;
  teacherName?: string | null;
  type: "ASSIGNED" | "FREE";
}

interface Props {
  assignedAssignments: Assignment[];
  freeLearningAssignments: Assignment[];
  classes: { id: string; name: string }[];
}

export default function AssignmentsPageContent({ assignedAssignments, freeLearningAssignments, classes }: Props) {
  const [activeCategory, setActiveCategory] = useState<"assigned" | "free">("assigned");
  const [activeTab, setActiveTab] = useState<"pending" | "completed">("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string>("all");

  const currentList = activeCategory === "assigned" ? assignedAssignments : freeLearningAssignments;

  const filteredAssignments = useMemo(() => {
    return currentList.filter((a) => {
      const matchTab = activeTab === "pending" ? a.status === "PENDING" : a.status === "COMPLETED";
      const matchSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchClass = activeCategory === "free" || selectedClassId === "all" || a.classId === selectedClassId;
      return matchTab && matchSearch && matchClass;
    });
  }, [currentList, activeTab, searchQuery, selectedClassId, activeCategory]);

  return (
    <div className="space-y-10">
      {/* 1. Category Switcher (Assigned vs Free) */}
      <div className="flex p-1.5 bg-surface-container-low rounded-3xl w-fit border border-outline-variant/10 shadow-inner">
         <button 
            onClick={() => { setActiveCategory("assigned"); setSelectedClassId("all"); }}
            className={`flex items-center gap-2 px-8 py-3 rounded-2xl text-sm font-bold transition-all ${
               activeCategory === "assigned" 
               ? "bg-white dark:bg-slate-900 shadow-lg shadow-black/5 text-primary" 
               : "text-on-surface-variant hover:text-on-surface"
            }`}
         >
            <GraduationCap className="w-4 h-4" />
            Nhiệm vụ từ Giáo viên
         </button>
         <button 
            onClick={() => { setActiveCategory("free"); setSelectedClassId("all"); }}
            className={`flex items-center gap-2 px-8 py-3 rounded-2xl text-sm font-bold transition-all ${
               activeCategory === "free" 
               ? "bg-white dark:bg-slate-900 shadow-lg shadow-black/5 text-primary" 
               : "text-on-surface-variant hover:text-on-surface"
            }`}
         >
            <LayoutGrid className="w-4 h-4" />
            Kho tài liệu tự học
         </button>
      </div>

      {/* 2. Toolbar: Search, Filters & Tabs */}
      <div className="space-y-6">
         <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            {/* Tabs (Pending vs Completed) */}
            <div className="flex gap-8 border-b border-outline-variant/30 px-2 overflow-x-auto w-full lg:w-auto">
               <button
                  onClick={() => setActiveTab("pending")}
                  className={`pb-4 text-sm font-label font-bold transition-all relative whitespace-nowrap ${
                     activeTab === "pending"
                     ? "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
                     : "text-outline hover:text-on-surface"
                  }`}
               >
                  Đang diễn ra ({currentList.filter(a => a.status === "PENDING").length})
               </button>
               <button
                  onClick={() => setActiveTab("completed")}
                  className={`pb-4 text-sm font-label font-bold transition-all relative whitespace-nowrap ${
                     activeTab === "completed"
                     ? "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
                     : "text-outline hover:text-on-surface"
                  }`}
               >
                  Đã hoàn thành ({currentList.filter(a => a.status === "COMPLETED").length})
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

               {activeCategory === "assigned" && (
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
            <Link
              key={a.id}
              href={`/student/assignments/${a.id}/run?direct=true`}
              className="group bg-white dark:bg-slate-900 rounded-[2.5rem] border border-outline-variant/10 overflow-hidden hover:shadow-2xl hover:shadow-black/5 hover:-translate-y-1 transition-all duration-300 flex flex-col"
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

                {activeCategory === "assigned" && a.dueDate && a.status === "PENDING" && (
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
                            <p className="text-[10px] text-outline font-bold uppercase tracking-widest">Điểm số</p>
                            <span className="font-black text-2xl text-secondary">{a.score !== null ? `${Math.round(a.score * 10) / 10}` : "--"}</span>
                         </div>
                      </div>
                   ) : (
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-2xl bg-primary-fixed/30 flex items-center justify-center text-primary">
                            <PlayCircle className="w-6 h-6" />
                         </div>
                         <p className="text-sm font-black text-primary uppercase tracking-tighter">{activeCategory === "assigned" ? "Làm nhiệm vụ" : "Học ngay"}</p>
                      </div>
                   )}
                   <div className="w-10 h-10 rounded-full border border-outline-variant/30 flex items-center justify-center group-hover:bg-on-surface group-hover:border-on-surface group-hover:text-white transition-all">
                     <ArrowRight className="w-5 h-5" />
                   </div>
                </div>
              </div>
            </Link>
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
                {searchQuery ? "Chúng mình không tìm thấy bài nào khớp với từ khóa bạn nhập. Thử lại nhé!" : activeCategory === "assigned" ? "Bạn đã hoàn thành tất cả bài tập từ giáo viên rồi đấy. Thật tuyệt vời!" : "Kho học liệu đang được cập nhật thêm. Hãy quay lại sau nhé!"}
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
