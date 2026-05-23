"use client";

import React, { useEffect, useState } from "react";
import { getCategoryTree } from "@/actions/category-actions";
import { ChevronRight, ChevronDown, CheckSquare, Square } from "lucide-react";
import { useLocale } from "next-intl";

// Client-side cache to prevent re-fetching when modal is closed/opened
let categoryCache: any[] | null = null;

export default function CategorySelect({
  selectedIds,
  onChange,
}: {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [tree, setTree] = useState<any[]>(categoryCache || []);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const locale = useLocale();

  useEffect(() => {
    if (categoryCache) {
      setTree(categoryCache);
      return;
    }
    
    getCategoryTree().then((res) => {
      categoryCache = res;
      setTree(res);
    });
  }, []);

  const toggleExpand = (id: string) => {
    setExpanded((p) => ({ ...p, [id]: !p[id] }));
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const renderNode = (node: any, level = 0) => {
    const isExpanded = expanded[node.id];
    const isSelected = selectedIds.includes(node.id);
    const hasChildren = node.children?.length > 0;
    const displayName = (locale === "vi" ? (node.nameVi || node.nameEn) : (node.nameEn || node.nameVi)) || "";

    return (
      <div key={node.id} className="select-none">
        <div 
          className="flex items-center gap-2 py-1.5 px-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg group"
          style={{ paddingLeft: `${level * 20 + 8}px` }}
        >
          <div 
            className="w-5 h-5 flex items-center justify-center cursor-pointer text-slate-400 hover:text-slate-600"
            onClick={() => hasChildren && toggleExpand(node.id)}
          >
            {hasChildren ? (
              isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
            ) : (
              <span className="w-1 h-1 rounded-full bg-slate-300" />
            )}
          </div>
          
          <div 
            className="flex flex-1 items-center gap-2 cursor-pointer"
            onClick={() => toggleSelect(node.id)}
          >
            {isSelected ? (
              <CheckSquare className="w-4 h-4 text-primary" />
            ) : (
              <Square className="w-4 h-4 text-slate-300" />
            )}
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{displayName}</span>
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div className="relative">
             <div 
              className="absolute top-0 bottom-0 border-l border-slate-200"
              style={{ left: `${level * 20 + 17}px` }}
            />
            {node.children.map((child: any) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!tree.length) {
    return (
      <div className="border border-slate-100 dark:border-gray-800 rounded-xl p-3 space-y-2 bg-slate-50/30">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="w-4 h-4 bg-slate-200 dark:bg-gray-700 rounded" />
            <div className="h-4 bg-slate-200 dark:bg-gray-700 rounded w-32" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="border border-slate-200 dark:border-gray-700 rounded-xl p-2 max-h-60 overflow-y-auto custom-scrollbar bg-white dark:bg-gray-900">
      {tree.map((node) => renderNode(node, 0))}
    </div>
  );
}
