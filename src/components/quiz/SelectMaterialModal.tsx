import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Search, Eye, BookOpen, Clock, Edit3, Image as ImageIcon, Headphones } from 'lucide-react';

export function SelectMaterialModal({ isOpen, onClose, onSelect }: { isOpen: boolean, onClose: () => void, onSelect: (id: string) => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-3xl overflow-hidden font-sans border border-slate-200 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold text-slate-800">Giao bài tập mới</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-slate-100 text-slate-500 w-8 h-8">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Filters */}
        <div className="px-8 py-4 border-b border-slate-100 flex items-center space-x-4 shrink-0 bg-slate-50/50">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Tìm bài tập trong thư viện..." 
              className="pl-11 h-11 rounded-full border-slate-200 shadow-sm focus-visible:ring-blue-500 bg-white"
            />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px] h-11 rounded-full border-slate-200 font-semibold text-slate-700 bg-white shadow-sm">
              <SelectValue placeholder="Tất cả danh mục" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-100 shadow-lg font-medium p-1">
              <SelectItem value="all" className="rounded-lg hover:bg-slate-50 mb-1">Tất cả danh mục</SelectItem>
              <SelectItem value="reading" className="rounded-lg hover:bg-slate-50 mb-1">Reading Comprehension</SelectItem>
              <SelectItem value="vocab" className="rounded-lg hover:bg-slate-50 mb-1">Vocabulary</SelectItem>
              <SelectItem value="grammar" className="rounded-lg hover:bg-slate-50">Grammar & Revision</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* List */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-3">
           {/* Mock Item 1 */}
           <div className="flex items-center justify-between p-4 rounded-2xl border border-transparent hover:border-slate-200 hover:bg-slate-50 transition-all group cursor-default">
             <div className="flex items-center space-x-4">
               <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                 <BookOpen className="w-5 h-5" />
               </div>
               <div>
                 <h3 className="font-bold text-slate-800 text-base">Unit 6: Reading Comprehension - Environmental Issues</h3>
                 <div className="flex items-center text-xs text-slate-500 mt-1 font-medium space-x-4">
                   <span className="flex items-center">15 câu hỏi</span>
                   <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1" /> Tạo ngày 12/10/2023</span>
                 </div>
               </div>
             </div>
             <div className="flex items-center space-x-2">
               <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 rounded-full hover:bg-slate-200 hover:text-slate-600 transition-colors">
                 <Eye className="w-5 h-5" />
               </Button>
               <Button onClick={() => onSelect('m1')} className="h-10 rounded-full px-6 bg-blue-600 hover:bg-blue-700 shadow-sm text-white font-bold transition-all">
                 Chọn
               </Button>
             </div>
           </div>

           {/* Mock Item 2 */}
           <div className="flex items-center justify-between p-4 rounded-2xl border border-transparent hover:border-slate-200 hover:bg-slate-50 transition-all group cursor-default">
             <div className="flex items-center space-x-4">
               <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                 <span className="font-bold text-lg font-serif">A</span>
               </div>
               <div>
                 <h3 className="font-bold text-slate-800 text-base">Vocabulary: Technology and Communication</h3>
                 <div className="flex items-center text-xs text-slate-500 mt-1 font-medium space-x-4">
                   <span className="flex items-center">20 câu hỏi</span>
                   <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1" /> Tạo ngày 08/10/2023</span>
                 </div>
               </div>
             </div>
             <div className="flex items-center space-x-2">
               <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 rounded-full hover:bg-slate-200 hover:text-slate-600 transition-colors">
                 <Eye className="w-5 h-5" />
               </Button>
               <Button onClick={() => onSelect('m2')} className="h-10 rounded-full px-6 bg-blue-600 hover:bg-blue-700 shadow-sm text-white font-bold transition-all">
                 Chọn
               </Button>
             </div>
           </div>

           {/* Mock Item 3 */}
           <div className="flex items-center justify-between p-4 rounded-2xl border border-transparent hover:border-slate-200 hover:bg-slate-50 transition-all group cursor-default">
             <div className="flex items-center space-x-4">
               <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                 <Headphones className="w-5 h-5" />
               </div>
               <div>
                 <h3 className="font-bold text-slate-800 text-base">Listening: Part 1 - Photographs Practice</h3>
                 <div className="flex items-center text-xs text-slate-500 mt-1 font-medium space-x-4">
                   <span className="flex items-center">10 câu hỏi</span>
                   <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1" /> Tạo ngày 05/10/2023</span>
                 </div>
               </div>
             </div>
             <div className="flex items-center space-x-2">
               <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 rounded-full hover:bg-slate-200 hover:text-slate-600 transition-colors">
                 <Eye className="w-5 h-5" />
               </Button>
               <Button onClick={() => onSelect('m3')} className="h-10 rounded-full px-6 bg-blue-600 hover:bg-blue-700 shadow-sm text-white font-bold transition-all">
                 Chọn
               </Button>
             </div>
           </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-slate-100 bg-white flex justify-end shrink-0">
          <Button variant="ghost" onClick={onClose} className="rounded-xl px-6 text-slate-500 font-semibold h-11 hover:bg-slate-100 transition-colors">
            Hủy bỏ
          </Button>
        </div>

      </div>
    </div>
  );
}
