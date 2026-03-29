import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Image as ImageIcon, Sparkles } from 'lucide-react';

export interface FlashcardItem {
  id: string;
  frontText: string;
  backText: string;
  imageUrl?: string;
}

export function FlashcardEditor() {
  const [cards, setCards] = useState<FlashcardItem[]>([
    { id: '1', frontText: 'Abundant', backText: 'Phong phú, dồi dào' },
    { id: '2', frontText: 'Differentiate', backText: 'Phân biệt' },
    { id: '3', frontText: 'Significant', backText: 'Quan trọng, đáng kể' }
  ]);
  const [title, setTitle] = useState('Từ vựng Tiếng Anh - Unit 4');

  const addCard = () => {
    setCards([...cards, { id: Date.now().toString(), frontText: '', backText: '' }]);
  };

  const removeCard = (id: string) => {
    if (cards.length <= 1) return;
    setCards(cards.filter(c => c.id !== id));
  };

  const updateCard = (id: string, field: keyof FlashcardItem, value: string) => {
    setCards(cards.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 relative pb-10">
      <div className="max-w-4xl w-full mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col h-[calc(100vh-60px)] mt-6 overflow-hidden">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white z-10">
          <div className="flex-1 mr-6">
            <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Tên bộ thẻ (Title)</Label>
            <Input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl font-bold h-12 border-slate-200 placeholder:text-slate-300 focus-visible:ring-blue-500"
              placeholder="Ví dụ: 50 Irregular Verbs..."
            />
          </div>
          <div className="flex-shrink-0 flex items-center space-x-3">
            <Button variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 rounded-xl h-12 px-5">
              <Sparkles className="w-4 h-4 mr-2" />
              Tạo bằng AI
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-10 bg-slate-50/50">
          <div className="max-w-3xl mx-auto space-y-4">
            {cards.map((card, idx) => (
              <div key={card.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm group hover:border-blue-300 transition-colors">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-bold text-slate-400">THẺ {idx + 1}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeCard(card.id)}
                    className="h-8 w-8 text-slate-300 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex gap-6">
                  {/* Front Side */}
                  <div className="flex-1 space-y-3">
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mặt trước (Khái niệm)</Label>
                    <div className="flex flex-col gap-2">
                      <Input 
                        value={card.frontText}
                        onChange={(e) => updateCard(card.id, 'frontText', e.target.value)}
                        placeholder="Nhập từ vựng/câu hỏi..."
                        className="h-11 shadow-none bg-slate-50"
                      />
                      <Button variant="outline" className="w-full text-slate-400 border-dashed h-9 bg-transparent hover:bg-slate-50">
                        <ImageIcon className="w-4 h-4 mr-2" /> Thêm ảnh minh họa
                      </Button>
                    </div>
                  </div>

                  {/* Back Side */}
                  <div className="flex-1 space-y-3 pl-6 border-l border-slate-100">
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mặt sau (Định nghĩa)</Label>
                    <textarea 
                      value={card.backText}
                      onChange={(e) => updateCard(card.id, 'backText', e.target.value)}
                      placeholder="Nhập giải thích, nghĩa của từ..."
                      className="w-full min-h-[92px] p-3 rounded-md border border-slate-200 bg-slate-50 text-sm placeholder:text-slate-400 focus-visible:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button 
              variant="outline" 
              onClick={addCard}
              className="w-full border-dashed border-2 text-blue-600 hover:bg-blue-50/50 hover:border-blue-300 bg-white mt-6 rounded-2xl h-14 text-sm font-semibold transition-all shadow-sm"
            >
              <Plus className="w-5 h-5 mr-2" />
              Thêm thẻ mới
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="h-20 border-t border-slate-100 bg-white flex items-center justify-end px-10 shrink-0">
          <div className="flex space-x-3 items-center">
            <Button variant="ghost" className="text-slate-500 font-semibold px-6 hover:bg-slate-100 rounded-xl">Hủy</Button>
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-full px-8 shadow-sm shadow-emerald-200 h-11">
              Hoàn tất
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
