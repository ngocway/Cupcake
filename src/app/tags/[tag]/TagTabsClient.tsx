"use client"

import React, { useState } from "react";
import { LessonCard, ExerciseCard } from "@/components/public/ContentCards";

interface Props {
  initialLessons: any[];
  initialAssignments: any[];
  isLoggedIn: boolean;
  tagName: string;
}

export function TagTabsClient({ initialLessons, initialAssignments, isLoggedIn, tagName }: Props) {
  const [activeTab, setActiveTab] = useState<"lessons" | "assignments">("lessons");

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Tabs Control */}
      <div className="flex justify-center">
        <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-full border border-primary/5 shadow-inner relative max-w-md w-full">
          <button
            onClick={() => setActiveTab("lessons")}
            className={`flex-1 py-3 px-6 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300 relative z-10 flex items-center justify-center gap-2 ${
              activeTab === "lessons"
                ? "bg-white dark:bg-slate-900 text-primary shadow-lg"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <span className="material-symbols-outlined !text-[18px]">menu_book</span>
            Lessons ({initialLessons.length})
          </button>
          
          <button
            onClick={() => setActiveTab("assignments")}
            className={`flex-1 py-3 px-6 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300 relative z-10 flex items-center justify-center gap-2 ${
              activeTab === "assignments"
                ? "bg-white dark:bg-slate-900 text-secondary shadow-lg"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <span className="material-symbols-outlined !text-[18px]">assignment</span>
            Assignments ({initialAssignments.length})
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
