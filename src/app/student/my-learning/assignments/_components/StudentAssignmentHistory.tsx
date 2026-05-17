"use client";

import { useState } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  RotateCcw, 
  PlayCircle,
  Calendar,
  User,
  Search,
  Filter
} from "lucide-react";

interface Submission {
  id: string;
  assignmentId: string;
  slug: string | null;
  title: string;
  thumbnail: string | null;
  teacherName: string;
  startedAt: Date;
  submittedAt: Date | null;
  score: number | null;
  totalQuestions: number;
  correctAnswers: number;
  status: "COMPLETED" | "IN_PROGRESS";
}

interface Props {
  initialSubmissions: Submission[];
  translations: any;
}

export function StudentAssignmentHistory({ initialSubmissions, translations }: Props) {
  const [activeTab, setActiveTab] = useState<"completed" | "in-progress">("completed");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = initialSubmissions.filter(s => {
    const matchTab = activeTab === "completed" ? s.status === "COMPLETED" : s.status === "IN_PROGRESS";
    const matchSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <div className="space-y-8">
      {/* Tabs & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-[2.5rem] shadow-xl shadow-black/5 border border-slate-200/50 dark:border-slate-800/50 flex flex-col md:flex-row items-center gap-4">
        <div className="flex p-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl w-full md:w-auto">
          <button 
            onClick={() => setActiveTab("completed")}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-2xl text-sm font-bold transition-all ${
              activeTab === "completed" 
              ? "bg-white dark:bg-slate-900 shadow-lg text-primary" 
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {translations.completed}
          </button>
          <button 
            onClick={() => setActiveTab("in-progress")}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-2xl text-sm font-bold transition-all ${
              activeTab === "in-progress" 
              ? "bg-white dark:bg-slate-900 shadow-lg text-amber-500" 
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Clock className="w-4 h-4" />
            {translations.inProgress}
          </button>
        </div>

        <div className="relative flex-1 w-full group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
          <input 
            type="text"
            placeholder={translations.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-[2rem] py-4 pl-14 pr-6 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((s) => (
            <div 
              key={s.id}
              className="group bg-white dark:bg-slate-900 rounded-[8px] border border-slate-200/50 dark:border-slate-800/50 overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 flex flex-col"
            >
              {/* Thumbnail */}
              <div className="aspect-video relative overflow-hidden bg-slate-100 rounded-[8px] shadow-xl">
                <img 
                  src={s.thumbnail || "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=800&auto=format&fit=crop"} 
                  alt={s.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-8">
                  <Link 
                    href={`/student/assignments/${s.slug || s.assignmentId}/run`}
                    className="w-full py-3 bg-white text-primary rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-all shadow-xl"
                  >
                    <RotateCcw className="w-4 h-4" />
                    {translations.retake}
                  </Link>
                </div>
                
                {/* Status Badge */}
                <div className="absolute top-6 left-6">
                   <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg backdrop-blur-md border ${
                     s.status === "COMPLETED" 
                     ? "bg-green-500/90 text-white border-white/20" 
                     : "bg-amber-500/90 text-white border-white/20"
                    }`}>
                     {s.status === "COMPLETED" ? translations.completed : translations.inProgress}
                   </div>
                </div>
              </div>

              {/* Info */}
              <div className="p-8 flex-1 flex flex-col">
                <h3 className="text-xl font-black text-slate-900 dark:text-white line-clamp-2 leading-tight mb-4 group-hover:text-primary transition-colors">
                  {s.title}
                </h3>
                
                <div className="flex flex-col gap-3 mb-8">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <User className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">{s.teacherName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-medium">
                      {s.status === "COMPLETED" 
                        ? translations.date.replace("{date}", format(new Date(s.submittedAt!), "dd/MM/yyyy HH:mm"))
                        : translations.date.replace("{date}", format(new Date(s.startedAt), "dd/MM/yyyy HH:mm"))
                      }
                    </span>
                  </div>
                </div>

                <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  {s.status === "COMPLETED" ? (
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">{translations.result}</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-green-500">{s.correctAnswers}</span>
                        <span className="text-sm font-bold text-slate-400">/{s.totalQuestions} {translations.questions}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                        <PlayCircle className="w-7 h-7" />
                      </div>
                      <div className="flex flex-col">
                         <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">{translations.unfinished}</span>
                         <Link href={`/student/assignments/${s.slug || s.assignmentId}/run`} className="text-sm font-black text-slate-900 dark:text-white hover:text-primary transition-colors">{translations.continue}</Link>
                      </div>
                    </div>
                  )}

                  <Link 
                    href={`/student/assignments/${s.slug || s.assignmentId}/run`}
                    className="w-12 h-12 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-primary hover:border-primary hover:text-white transition-all shadow-sm group/btn"
                  >
                    <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] py-24 text-center border border-dashed border-slate-200 dark:border-slate-800">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Filter className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{translations.noAssignments}</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {searchQuery 
                ? translations.noResults 
                : translations.emptyMessage.replace("{tab}", activeTab === "completed" ? translations.completed : translations.inProgress)}
            </p>
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="mt-6 text-primary font-bold hover:underline">{translations.clearSearch}</button>
            )}
        </div>
      )}
    </div>
  );
}
