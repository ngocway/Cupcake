import React, { useState } from 'react';
import { ReorderContent, ReorderItem } from './types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Dnd implementation
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableItemComp({ 
  item, 
  onRemove, 
  onChangeText 
}: { 
  item: ReorderItem, 
  onRemove: () => void, 
  onChangeText: (val: string) => void 
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
  };
  
  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`segment-row flex items-center gap-3 p-1 transition-all ${isDragging ? 'opacity-50' : ''}`}
    >
      <span className="text-sm font-bold text-slate-400 w-4">{item.orderIndex + 1}.</span>
      <span 
        {...attributes} 
        {...listeners} 
        className="material-symbols-outlined drag-handle text-slate-300 cursor-grab hover:text-primary transition-colors"
      >
        drag_indicator
      </span>
      <input 
        className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white" 
        type="text" 
        value={item.text} 
        onChange={(e) => onChangeText(e.target.value)}
        placeholder="Nhập nội dung thẻ..."
      />
      <button 
        type="button"
        onClick={onRemove}
        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
      >
        <span className="material-symbols-outlined text-[20px]">close</span>
      </button>
    </div>
  );
}

export function ReorderBuilder({ initialData, onChange }: { initialData?: ReorderContent, onChange?: (data: ReorderContent) => void }) {
  const [data, setData] = useState<ReorderContent>(initialData || {
    instruction: 'Hãy sắp xếp các từ lộn xộn thành câu có nghĩa',
    items: [
      { id: '1', text: 'My', orderIndex: 0 },
      { id: '2', text: 'name', orderIndex: 1 },
      { id: '3', text: 'is', orderIndex: 2 },
      { id: '4', text: 'Nam', orderIndex: 3 }
    ]
  });

  React.useEffect(() => {
    // Normalize items: ensure all have IDs
    if (initialData?.items) {
      const needsNormalization = initialData.items.some(i => !i.id);
      if (needsNormalization) {
        const normalizedItems = initialData.items.map((i, idx) => ({
          ...i,
          id: i.id || `reorder-${Date.now()}-${idx}`
        }));
        setData(prev => ({ ...prev, items: normalizedItems }));
      }
    }
  }, [initialData]);

  const [quickSplitText, setQuickSplitText] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleChange = (newData: Partial<ReorderContent>) => {
    const updated = { ...data, ...newData };
    setData(updated);
    if (onChange) onChange(updated);
  };

  const addItem = () => {
    const newItems = [...data.items, { id: Date.now().toString(), text: '', orderIndex: data.items.length }];
    handleChange({ items: newItems });
  };

  const removeItem = (id: string) => {
    if (data.items.length <= 1) return;
    const filtered = data.items.filter(i => i.id !== id);
    const reordered = filtered.map((i, idx) => ({ ...i, orderIndex: idx }));
    handleChange({ items: reordered });
  };

  const updateItemText = (id: string, text: string) => {
    const newItems = data.items.map(i => i.id === id ? { ...i, text } : i);
    handleChange({ items: newItems });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = data.items.findIndex(i => i.id === active.id);
      const newIndex = data.items.findIndex(i => i.id === over?.id);
      
      const moved = arrayMove(data.items, oldIndex, newIndex);
      const reordered = moved.map((item, index) => ({ ...item, orderIndex: index }));
      handleChange({ items: reordered });
    }
  };

  const handleQuickSplit = (text: string) => {
    setQuickSplitText(text);
    if (!text.trim()) return;

    // Split by / or newline or multiple spaces
    const parts = text.split(/[\/\n]/).map(p => p.trim()).filter(p => p.length > 0);
    
    if (parts.length > 0) {
      const newItems: ReorderItem[] = parts.map((p, idx) => ({
        id: `split-${idx}-${Date.now()}`,
        text: p,
        orderIndex: idx
      }));
      handleChange({ items: newItems });
    }
  };

  return (
    <div className="flex flex-col gap-8 flex-1 py-4">
      {/* Hướng dẫn */}
      <div className="flex flex-col gap-3">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hướng dẫn</label>
        <input 
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
          type="text" 
          value={data.instruction}
          onChange={(e) => handleChange({ instruction: e.target.value })}
          placeholder="Nhập hướng dẫn bài tập..."
        />
      </div>

      {/* Quick Split Mẹo */}
      <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-blue-600 text-sm font-semibold">
          <span className="material-symbols-outlined text-[20px]">lightbulb</span>
          <span>Mẹo: Nhập "My / name / is / Nam" để tách nhanh.</span>
        </div>
        <textarea 
          className="w-full h-20 p-3 bg-white border border-blue-100 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none custom-scrollbar" 
          placeholder="Nhập văn bản vào đây để tự động tách các thẻ..."
          value={quickSplitText}
          onChange={(e) => handleQuickSplit(e.target.value)}
        />
      </div>

      {/* Danh sách các thẻ */}
      <div className="flex flex-col gap-4">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Thứ tự đúng của các thẻ:</h4>
        
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={data.items} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2">
              {data.items.map(item => (
                <SortableItemComp 
                  key={item.id} 
                  item={item} 
                  onRemove={() => removeItem(item.id)} 
                  onChangeText={(val) => updateItemText(item.id, val)} 
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <button 
          type="button"
          onClick={addItem}
          className="flex items-center gap-2 w-fit px-4 py-2 text-primary font-bold text-sm hover:bg-primary/5 rounded-lg transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          <span>Thêm thẻ tiếp theo</span>
        </button>
      </div>

      {/* Preview */}
      <div className="mt-4 flex flex-col gap-3">
        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">PREVIEW (Xem trước đáp án):</h4>
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
          <p className="text-emerald-700 font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-500">check_circle</span>
            {data.items.map(i => i.text).join(' ')}
          </p>
        </div>
      </div>
    </div>
  );
}
