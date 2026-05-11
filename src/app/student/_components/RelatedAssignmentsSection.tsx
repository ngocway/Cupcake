"use client";

import React from "react";
import { Play } from "lucide-react";
import Link from "next/link";

interface RelatedItem {
  id: string;
  slug?: string | null;
  title: string;
  thumbnail: string | null;
}

export function RelatedAssignmentsSection({ 
  items,
  isGuest = false,
  onNavigate
}: { 
  items: RelatedItem[],
  isGuest?: boolean,
  onNavigate?: (href: string) => void
}) {
  return (
    <div className="border-t border-outline-variant/20 pt-16 space-y-8">
      <div className="space-y-1">
        <h3 className="text-2xl font-black tracking-tight italic uppercase">Nội dung liên quan</h3>
        <p className="text-sm text-slate-500 font-medium">Có thể bạn sẽ quan tâm đến các nội dung này.</p>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {items.map((item) => (
          <Link 
            key={item.id}
            href={isGuest 
              ? `/public/assignments/${item.slug || item.id}?direct=true`
              : `/student/assignments/${item.slug || item.id}/run?direct=true`
            }
            onClick={(e) => {
              if (onNavigate) {
                e.preventDefault();
                onNavigate(isGuest 
                  ? `/public/assignments/${item.slug || item.id}?direct=true`
                  : `/student/assignments/${item.slug || item.id}/run?direct=true`,
                  item.title
                );
              }
            }}
            className="flex items-center gap-4 group p-4 bg-slate-50 dark:bg-slate-800/50 rounded-[4px] border border-slate-100 dark:border-slate-800 hover:border-primary/30 transition-all"
          >
            <div className="w-20 h-14 rounded-[4px] bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0 shadow-sm relative">
              {item.thumbnail ? (
                <img src={item.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                  <Play className="w-5 h-5 text-slate-400" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </div>
            <div className="flex-1 overflow-hidden">
              <h5 className="text-xs font-black text-slate-800 dark:text-white line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                {item.title}
              </h5>
            </div>
          </Link>
        ))}

        {items.length === 0 && (
          <p className="text-sm italic text-slate-400 col-span-2 py-4">Chưa có bài học liên quan nào.</p>
        )}
      </div>
    </div>
  );
}
