
"use client"
import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { FilterLink } from "@/components/public/FilterLink";

export function SidebarCategoryList({ categories, activeId }: { categories: any[], activeId?: string }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderCategory = (node: any, level = 0) => {
    const isExpanded = expanded[node.id] || activeId === node.id || node.children?.some((c: any) => c.id === activeId);
    const isSelected = activeId === node.id;
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} className="space-y-1">
        <div
          className={`flex items-center gap-3 rounded-full px-5 py-3 transition-all duration-500 group cursor-pointer ${
            isSelected
              ? "bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]"
              : "text-slate-600 dark:text-slate-400 hover:bg-primary/5 hover:text-primary"
          }`}
          style={{ marginLeft: `${level * 16}px` }}
        >
          {hasChildren ? (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleExpand(node.id); }}
              className={`transition-transform duration-500 ${isExpanded ? "rotate-90" : ""} ${isSelected ? "text-white" : "text-primary/40"}`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <div className={`w-2 h-2 rounded-full transition-all duration-500 ${isSelected ? "bg-white scale-125" : "bg-primary/20 group-hover:bg-primary/40"}`} />
          )}

          <FilterLink
            href={`/?categoryId=${node.id}`}
            className={`text-sm font-bold flex-1 truncate ${isSelected ? "text-white" : "text-slate-700 dark:text-slate-200"}`}
          >
            {node.name}
          </FilterLink>
        </div>

        {isExpanded && hasChildren && (
          <div className="relative ml-4 space-y-1 mt-1">
            <div className="absolute left-[-8px] top-0 bottom-0 w-[1px] bg-slate-100 dark:bg-slate-800" />
            {node.children.map((child: any) => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-1">
      {categories.map(cat => renderCategory(cat))}
    </div>
  );
}
