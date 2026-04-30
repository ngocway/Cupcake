"use client";

import React, { useEffect, useState } from "react";
import { getCategoryTree } from "@/actions/category-actions";
import { ChevronRight, ChevronDown, CheckSquare, Square } from "lucide-react";

export default function CategorySelect({
  selectedIds,
  onChange,
}: {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [tree, setTree] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    getCategoryTree().then((res) => setTree(res));
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
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{node.name}</span>
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
    return <div className="text-sm text-slate-400 py-2">Đang tải danh mục...</div>;
  }

  return (
    <div className="border border-slate-200 dark:border-gray-700 rounded-xl p-2 max-h-60 overflow-y-auto custom-scrollbar bg-white dark:bg-gray-900">
      {tree.map((node) => renderNode(node, 0))}
    </div>
  );
}
