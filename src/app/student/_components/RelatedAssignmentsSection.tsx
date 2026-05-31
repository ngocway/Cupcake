"use client";

import React from "react";
import { Play } from "lucide-react";
import Link from "next/link";
import { DirectStartLink } from "./DirectStartLink";
import { useTranslations } from "next-intl";

interface RelatedItem {
  id: string;
  slug?: string | null;
  title: string;
  thumbnail: string | null;
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

  return (
    <div className="glass rounded-3xl p-5 md:p-8 space-y-6 shadow-xl w-full">
      <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{t("relatedContent")}</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => {
          const href = isGuest 
            ? `/public/assignments/${item.slug || item.id}?direct=true`
            : `/student/assignments/${item.slug || item.id}/run?direct=true`;

          if (isGuest) {
            return (
              <Link 
                key={item.id}
                href={href}
                className="flex items-center gap-4 group bg-white/50 dark:bg-slate-900/50 p-3 rounded-[5px] hover:bg-white dark:hover:bg-slate-900 transition-colors shadow-sm border border-slate-200/50"
              >
                <RelatedItemContent item={item} />
              </Link>
            );
          }

          return (
            <DirectStartLink
              key={item.id}
              id={item.slug || item.id}
              className="flex items-center gap-4 group relative bg-white/50 dark:bg-slate-900/50 p-3 rounded-[5px] hover:bg-white dark:hover:bg-slate-900 transition-colors shadow-sm border border-slate-200/50"
            >
              <RelatedItemContent item={item} />
            </DirectStartLink>
          );
        })}

        {items.length === 0 && (
          <p className="text-xs italic text-slate-400 text-center py-4 col-span-full">{t("noRelatedLessons")}</p>
        )}
      </div>
    </div>
  );
}
