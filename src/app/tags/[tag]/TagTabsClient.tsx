"use client"

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { LessonCard, ExerciseCard } from "@/components/public/ContentCards";

interface Props {
  initialLessons: any[];
  initialAssignments: any[];
  isLoggedIn: boolean;
  tagName: string;
}

export function TagTabsClient({ initialLessons, initialAssignments, isLoggedIn, tagName }: Props) {
  const [activeTab, setActiveTab] = useState<"lessons" | "assignments">("lessons");
  const router = useRouter();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header & Tabs Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 w-fit px-4 py-2 bg-white/60 hover:bg-white text-slate-600 font-black text-[10px] uppercase tracking-widest rounded-xl border border-white/40 shadow-sm backdrop-blur-md transition-all active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight lowercase italic">
            #{tagName}
          </h1>
        </div>

        <div className="inline-flex items-center gap-4">
          <button
            onClick={() => setActiveTab("lessons")}
            className={`px-8 py-3.5 rounded-[1.75rem] text-sm font-black transition-all duration-500 ease-out border-2 ${
              activeTab === "lessons"
                ? "bg-primary border-primary text-on-primary shadow-lg shadow-primary/20 scale-[1.03] translate-y-[-2px]"
                : "bg-white border-primary/10 text-on-surface-variant hover:text-primary hover:border-primary/40 shadow-sm"
            }`}
          >
            LESSONS ({initialLessons.length})
          </button>
          <button
            onClick={() => setActiveTab("assignments")}
            className={`px-8 py-3.5 rounded-[1.75rem] text-sm font-black transition-all duration-500 ease-out border-2 ${
              activeTab === "assignments"
                ? "bg-secondary border-secondary text-on-secondary shadow-lg shadow-secondary/20 scale-[1.03] translate-y-[-2px]"
                : "bg-white border-primary/10 text-on-surface-variant hover:text-primary hover:border-primary/40 shadow-sm"
            }`}
          >
            ASSIGNMENTS ({initialAssignments.length})
          </button>
        </div>
      </div>

      {/* Grid Content */}
      <div className="transition-all duration-500">
        {activeTab === "lessons" ? (
          initialLessons.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {initialLessons.map((lesson) => (
                <div 
                  key={lesson.id} 
                  className="animate-in fade-in-50 slide-in-from-bottom-5 duration-500 hover:scale-[1.01] transition-transform"
                >
                  <LessonCard item={lesson} isLoggedIn={isLoggedIn} />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-24 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] border-2 border-dashed border-primary/20 text-center space-y-6 max-w-xl mx-auto shadow-2xl shadow-primary/5 animate-in fade-in duration-500">
              <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto shadow-lg">
                <span className="material-symbols-outlined !text-[36px]">menu_book</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-800 dark:text-white">No lessons yet</h3>
                <p className="text-slate-500 text-sm font-semibold max-w-sm mx-auto leading-relaxed">
                  We are preparing more interesting lessons related to the topic <span className="text-primary italic">#{tagName}</span>. Please check back later!
                </p>
              </div>
            </div>
          )
        ) : (
          initialAssignments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {initialAssignments.map((assignment) => (
                <div 
                  key={assignment.id} 
                  className="animate-in fade-in-50 slide-in-from-bottom-5 duration-500 hover:scale-[1.01] transition-transform"
                >
                  <ExerciseCard item={assignment} isLoggedIn={isLoggedIn} />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-24 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] border-2 border-dashed border-secondary/20 text-center space-y-6 max-w-xl mx-auto shadow-2xl shadow-secondary/5 animate-in fade-in duration-500">
              <div className="w-20 h-20 bg-secondary/10 text-secondary rounded-full flex items-center justify-center mx-auto shadow-lg">
                <span className="material-symbols-outlined !text-[36px]">assignment</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-800 dark:text-white">No standalone assignments</h3>
                <p className="text-slate-500 text-sm font-semibold max-w-sm mx-auto leading-relaxed">
                  There are currently no standalone assignments for the topic <span className="text-secondary italic">#{tagName}</span>. You can find practice challenges directly inside the Lessons on the adjacent tab!
                </p>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
