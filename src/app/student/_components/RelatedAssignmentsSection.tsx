"use client";

import React, { useState } from "react";
import { Play } from "lucide-react";
import Link from "next/link";
import { DirectStartLink } from "./DirectStartLink";
import { useTranslations } from "next-intl";
import { ExerciseCard } from "@/components/public/ContentCards";
import { LoginPromptModal } from "./LoginPromptModal";

interface RelatedItem {
  id: string;
  slug?: string | null;
  title: string;
  thumbnail: string | null;
  teacher?: {
    id?: string | null;
    name?: string | null;
    image?: string | null;
  } | null;
  viewCount?: number | null;
}

function RelatedItemContent({ item }: { item: RelatedItem }) {
  return (
    <>
      <div className="w-20 h-14 rounded-[4px] bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0 shadow-sm relative border border-white/20">
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
    </>
  );
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
  const t = useTranslations("header");
  const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <div className="glass rounded-3xl p-5 md:p-8 space-y-6 shadow-xl w-full">
      <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{t("relatedContent")}</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-x-8 md:gap-y-12">
        {items.map((item) => {
          const href = isGuest 
            ? `/public/assignments/${item.slug || item.id}?direct=true`
            : `/student/assignments/${item.slug || item.id}/run?direct=true`;

          if (isGuest) {
            return (
              <React.Fragment key={item.id}>
                {/* Mobile version: compact row layout */}
                <div
                  className="flex md:hidden items-center gap-4 group bg-white/50 dark:bg-slate-900/50 p-3 rounded-[5px] hover:bg-white dark:hover:bg-slate-900 transition-colors shadow-sm border border-slate-200/50 w-full cursor-pointer"
                  onClick={() => setShowLoginModal(true)}
                >
                  <RelatedItemContent item={item} />
                </div>
                {/* Desktop/Tablet version: Premium ExerciseCard — wrapped to intercept click */}
                <div
                  className="hidden md:block w-full cursor-pointer"
                  onClick={() => setShowLoginModal(true)}
                >
                  <div className="pointer-events-none">
                    <ExerciseCard item={item as any} isLoggedIn={false} />
                  </div>
                </div>
              </React.Fragment>
            );
          }

          return (
            <React.Fragment key={item.id}>
              {/* Mobile version: compact row layout */}
              <DirectStartLink
                id={item.slug || item.id}
                className="flex md:hidden items-center gap-4 group relative bg-white/50 dark:bg-slate-900/50 p-3 rounded-[5px] hover:bg-white dark:hover:bg-slate-900 transition-colors shadow-sm border border-slate-200/50 w-full"
              >
                <RelatedItemContent item={item} />
              </DirectStartLink>
              {/* Desktop/Tablet version: Premium ExerciseCard */}
              <div className="hidden md:block w-full text-left">
                <ExerciseCard item={item as any} isLoggedIn={true} />
              </div>
            </React.Fragment>
          );
        })}

        {items.length === 0 && (
          <p className="text-xs italic text-slate-400 text-center py-4 col-span-full">{t("noRelatedLessons")}</p>
        )}
      </div>

      {/* Login Prompt Modal */}
      <LoginPromptModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </div>
  );
}
