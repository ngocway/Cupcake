"use client";

import React, { useState, useTransition } from "react";
import { 
  createCategory, 
  updateCategory, 
  deleteCategory, 
  reorderCategories 
} from "@/actions/category-actions";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  FolderTree, 
  ChevronRight, 
  ChevronDown, 
  Save, 
  X,
  GripVertical
} from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// --- Sortable Item Component ---

function SortableCategoryNode({ 
  node, 
  level, 
  expanded, 
  toggleExpand, 
  editingId, 
  setEditingId, 
  addingTo, 
  setAddingTo, 
  deletingId, 
  setDeletingId, 
  formName, 
  setFormName, 
  formSlug, 
  setFormSlug,
  handleUpdate,
  handleDelete,
  handleCreate,
  onReorder
}: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: node.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  const isExpanded = expanded[node.id];
  const isEditing = editingId === node.id;
  const isAdding = addingTo === node.id;

  return (
    <div ref={setNodeRef} style={style} className="select-none">
      <div 
        className={`flex items-center gap-2 py-2 px-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg group ${isDragging ? 'bg-slate-100 ring-2 ring-primary/20' : ''}`}
        style={{ paddingLeft: `${level * 24 + 12}px` }}
      >
        {/* Drag Handle */}
        <div 
          {...attributes} 
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-slate-300 hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="w-4 h-4" />
        </div>

        <div 
          className="w-5 h-5 flex items-center justify-center cursor-pointer text-slate-400 hover:text-slate-600"
          onClick={() => toggleExpand(node.id)}
        >
          {node.children?.length > 0 ? (
            isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
          ) : (
            <span className="w-1 h-1 rounded-full bg-slate-300" />
          )}
        </div>
        
        <FolderTree className="w-4 h-4 text-primary opacity-70" />

        {isEditing ? (
          <div className="flex flex-1 items-center gap-2">
            <input 
              type="text" 
              value={formName} 
              onChange={e => setFormName(e.target.value)}
              className="px-2 py-1 border rounded text-sm w-40"
              placeholder="Tên danh mục"
            />
            <input 
              type="text" 
              value={formSlug} 
              onChange={e => setFormSlug(e.target.value)}
              className="px-2 py-1 border rounded text-sm w-32"
              placeholder="slug"
            />
            <button onClick={() => handleUpdate(node.id)} className="p-1 text-emerald-600"><Save className="w-4 h-4" /></button>
            <button onClick={() => setEditingId(null)} className="p-1 text-slate-400"><X className="w-4 h-4" /></button>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-on-surface">{node.name}</span>
              <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded">{node.slug}</span>
            </div>
            <div className="flex items-center gap-1">
              {deletingId === node.id ? (
                <div className="flex items-center gap-1 bg-rose-50 px-2 py-1 rounded-md border border-rose-200">
                  <span className="text-[10px] font-bold text-rose-600 mr-1">Xác nhận?</span>
                  <button 
                    onClick={() => handleDelete(node.id)}
                    className="p-1 text-rose-600 hover:bg-rose-200 rounded transition-colors"
                    title="Xóa ngay"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => setDeletingId(null)}
                    className="p-1 text-slate-400 hover:bg-slate-200 rounded transition-colors"
                    title="Hủy"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <button 
                    onClick={() => {
                      setAddingTo(node.id);
                      setFormName("");
                      setFormSlug("");
                      toggleExpand(node.id);
                    }} 
                    className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                    title="Thêm danh mục con"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => {
                      setEditingId(node.id);
                      setFormName(node.name);
                      setFormSlug(node.slug);
                    }}
                    className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-100 rounded-md transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => setDeletingId(node.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded-md transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Child Form */}
      {isAdding && (
        <div className="flex items-center gap-2 py-2" style={{ paddingLeft: `${(level + 1) * 24 + 12 + 20}px` }}>
          <FolderTree className="w-4 h-4 text-primary/40" />
          <input 
            type="text" 
            value={formName} 
            onChange={e => {
              setFormName(e.target.value);
              setFormSlug(e.target.value.toLowerCase().replace(/ /g, '-'));
            }}
            className="px-2 py-1.5 border border-outline-variant/50 rounded-md text-sm w-48 focus:border-primary outline-none"
            placeholder="Tên danh mục con..."
            autoFocus
          />
          <input 
            type="text" 
            value={formSlug} 
            onChange={e => setFormSlug(e.target.value)}
            className="px-2 py-1.5 border border-outline-variant/50 rounded-md text-sm w-32 focus:border-primary outline-none"
            placeholder="slug..."
          />
          <button onClick={() => handleCreate(node.id)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"><Save className="w-4 h-4" /></button>
          <button onClick={() => setAddingTo(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Children - Nested Sortable Context */}
      {isExpanded && node.children?.length > 0 && (
        <div className="relative">
          <div 
            className="absolute top-0 bottom-0 border-l border-slate-200"
            style={{ left: `${level * 24 + 21}px` }}
          />
          <SortableLevel 
            nodes={node.children} 
            level={level + 1}
            expanded={expanded}
            toggleExpand={toggleExpand}
            editingId={editingId}
            setEditingId={setEditingId}
            addingTo={addingTo}
            setAddingTo={setAddingTo}
            deletingId={deletingId}
            setDeletingId={setDeletingId}
            formName={formName}
            setFormName={setFormName}
            formSlug={formSlug}
            setFormSlug={setFormSlug}
            handleUpdate={handleUpdate}
            handleDelete={handleDelete}
            handleCreate={handleCreate}
            onReorder={onReorder}
          />
        </div>
      )}
    </div>
  );
}

// --- Level Wrapper with Sortable Context ---

function SortableLevel({ nodes, level, onReorder, ...props }: any) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = nodes.findIndex((n: any) => n.id === active.id);
      const newIndex = nodes.findIndex((n: any) => n.id === over.id);

      const newNodes = arrayMove(nodes, oldIndex, newIndex);
      onReorder(newNodes, nodes[0]?.parentId || null);
    }
  }

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext 
        items={nodes.map((n: any) => n.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-0.5">
          {nodes.map((node: any) => (
            <SortableCategoryNode 
              key={node.id} 
              node={node} 
              level={level} 
              onReorder={onReorder}
              {...props} 
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

// --- Main Manager Component ---

export default function CategoryManager({ initialTree }: { initialTree: any[] }) {
  const [tree, setTree] = useState(initialTree);
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreate = (parentId: string | null = null) => {
    if (!formName || !formSlug) return toast.error("Vui lòng nhập tên và slug.");
    
    startTransition(async () => {
      try {
        await createCategory({ name: formName, slug: formSlug, parentId });
        toast.success("Thêm danh mục thành công.");
        setAddingTo(null);
        setFormName("");
        setFormSlug("");
        window.location.reload();
      } catch (e: any) {
        toast.error(e.message || "Lỗi tạo danh mục");
      }
    });
  };

  const handleUpdate = (id: string) => {
    if (!formName || !formSlug) return toast.error("Vui lòng nhập tên và slug.");
    
    startTransition(async () => {
      try {
        await updateCategory(id, { name: formName, slug: formSlug });
        toast.success("Cập nhật thành công.");
        setEditingId(null);
        setFormName("");
        setFormSlug("");
        window.location.reload();
      } catch (e: any) {
        toast.error(e.message || "Lỗi cập nhật danh mục");
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteCategory(id, "MOVE_TO_PARENT");
        toast.success("Xóa danh mục thành công.");
        setDeletingId(null);
        window.location.reload();
      } catch (e: any) {
        toast.error(e.message || "Lỗi xóa danh mục");
      }
    });
  };

  const handleReorder = async (reorderedNodes: any[], parentId: string | null) => {
    // Optimistic update
    const updateTreeRecursively = (currentTree: any[]): any[] => {
      if (parentId === null) {
        return reorderedNodes;
      }
      return currentTree.map(node => {
        if (node.id === parentId) {
          return { ...node, children: reorderedNodes };
        }
        if (node.children) {
          return { ...node, children: updateTreeRecursively(node.children) };
        }
        return node;
      });
    };

    setTree(prev => updateTreeRecursively(prev));

    // Persist to DB
    try {
      const items = reorderedNodes.map((node, index) => ({
        id: node.id,
        parentId: parentId,
        orderIndex: index
      }));
      await reorderCategories(items);
      toast.success("Đã cập nhật thứ tự.");
    } catch (error) {
      toast.error("Lỗi cập nhật thứ tự.");
      // Rollback would go here, but reload is simpler for now
      window.location.reload();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
        <div>
          <h2 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">Cây phân loại</h2>
          <p className="text-[10px] text-slate-400 mt-0.5">Kéo thả để sắp xếp các mục cùng cấp</p>
        </div>
        <button 
          onClick={() => {
            setAddingTo("root");
            setFormName("");
            setFormSlug("");
          }}
          className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-sm font-bold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Thêm Root
        </button>
      </div>

      {addingTo === "root" && (
        <div className="flex items-center gap-2 py-3 px-3 bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <FolderTree className="w-4 h-4 text-primary/40" />
          <input 
            type="text" 
            value={formName} 
            onChange={e => {
              setFormName(e.target.value);
              setFormSlug(e.target.value.toLowerCase().replace(/ /g, '-'));
            }}
            className="px-3 py-1.5 border border-outline-variant/50 rounded-md text-sm w-48 focus:border-primary outline-none bg-white"
            placeholder="Tên danh mục gốc..."
            autoFocus
          />
          <input 
            type="text" 
            value={formSlug} 
            onChange={e => setFormSlug(e.target.value)}
            className="px-3 py-1.5 border border-outline-variant/50 rounded-md text-sm w-32 focus:border-primary outline-none bg-white"
            placeholder="root-slug..."
          />
          <button onClick={() => handleCreate(null)} disabled={isPending} className="px-3 py-1.5 bg-primary text-white rounded-md text-sm font-bold ml-2">Lưu</button>
          <button onClick={() => setAddingTo(null)} className="px-3 py-1.5 text-slate-500 hover:bg-slate-200 rounded-md text-sm font-bold">Hủy</button>
        </div>
      )}

      <div className="py-2">
        {tree.length === 0 && addingTo !== "root" && (
          <div className="text-center py-10 text-slate-400">
            <FolderTree className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Chưa có danh mục nào.</p>
          </div>
        )}
        
        <SortableLevel 
          nodes={tree} 
          level={0}
          expanded={expanded}
          toggleExpand={toggleExpand}
          editingId={editingId}
          setEditingId={setEditingId}
          addingTo={addingTo}
          setAddingTo={setAddingTo}
          deletingId={deletingId}
          setDeletingId={setDeletingId}
          formName={formName}
          setFormName={setFormName}
          formSlug={formSlug}
          setFormSlug={setFormSlug}
          handleUpdate={handleUpdate}
          handleDelete={handleDelete}
          handleCreate={handleCreate}
          onReorder={handleReorder}
        />
      </div>
    </div>
  );
}
