"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getMyAssignments, assignToClass, createDraftMaterial } from '@/actions/material-actions';

interface AssignContentModalProps {
  classId: string;
  onClose: () => void;
  onAssigned?: () => void;
}

const TYPE_CONFIG: Record<string, { icon: string; bgClass: string; textClass: string }> = {
  EXERCISE: { icon: 'menu_book',  bgClass: 'bg-blue-50 dark:bg-blue-900/30',     textClass: 'text-primary' },
  READING:  { icon: 'headphones', bgClass: 'bg-orange-50 dark:bg-orange-900/30',  textClass: 'text-orange-600' },
  FLASHCARD:{ icon: 'spellcheck', bgClass: 'bg-purple-50 dark:bg-purple-900/30',  textClass: 'text-purple-600' },
};

export function AssignContentModal({ classId, onClose, onAssigned }: AssignContentModalProps) {
  const router = useRouter();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('ALL');
  const [isAssigning, setIsAssigning] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  
  // Step 2 state
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  
  // Config states
  const [startType, setStartType] = useState<'now' | 'schedule'>('now');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [startTime, setStartTime] = useState('08:00');
  
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [dueTime, setDueTime] = useState('23:59');
  
  const [timeLimit, setTimeLimit] = useState(45);
  const [isUnlimitedTime, setIsUnlimitedTime] = useState(false);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [showAnswers, setShowAnswers] = useState(false);

  useEffect(() => {
    const fetchLibrary = async () => {
      try {
        const data = await getMyAssignments();
        setAssignments(data);
      } catch (err) {
        console.error('Failed to load library', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLibrary();
  }, []);

  const handleAssign = async () => {
    if (!selectedAssignment) return;
    setIsAssigning(selectedAssignment.id);
    try {
      // payload construction
      let startDateTimeObj = null;
      if (startType === 'schedule' && startDate && startTime) {
        startDateTimeObj = new Date(`${startDate}T${startTime}`);
      }
      let dueDateTimeObj = null;
      if (dueDate && dueTime) {
        dueDateTimeObj = new Date(`${dueDate}T${dueTime}`);
      }
      
      const payload = {
        startDate: startDateTimeObj,
        dueDate: dueDateTimeObj,
        timeLimit: isUnlimitedTime ? null : timeLimit,
        maxAttempts: maxAttempts,
      };

      await assignToClass(selectedAssignment.id, classId, payload);
      onAssigned?.();
      onClose();
    } catch (err) {
      console.error('Failed to assign', err);
      alert('Giao bài thất bại: ' + (err as Error).message);
    } finally {
      setIsAssigning(null);
    }
  };

  const handleCreateAndAssign = async () => {
    setCreating(true);
    try {
      const newId = await createDraftMaterial('EXERCISE');
      onClose();
      router.push(`/teacher/materials/${newId}/edit?assignToClass=${classId}`);
    } catch (err) {
      console.error('Failed to create and prepare', err);
      alert('Tạo bài thất bại: ' + (err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const filtered = assignments.filter(a => 
    (searchTerm === '' || a.title.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (category === 'ALL' || a.subject === category)
  );

  const getDayMonthYear = (d: string) => {
    const date = new Date(d);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  // Renderer for Step 2
  if (selectedAssignment) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
        <div className="w-full max-w-xl bg-white dark:bg-background-dark rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
          <div className="px-6 py-5 border-b border-[#f0f2f4] dark:border-gray-800 flex items-center justify-between">
            <div className="flex flex-col">
              <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Bước 2: Thiết lập</p>
              <h2 className="text-xl font-extrabold text-[#111418] dark:text-white">
                Cài đặt giao bài: {selectedAssignment.title}
              </h2>
            </div>
            <button 
              onClick={onClose}
              className="text-[#617589] hover:text-[#111418] dark:hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          
          <div className="px-8 py-8 flex flex-col gap-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
            
            <div className="flex flex-col gap-3">
              <label className="text-sm font-bold text-[#111418] dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#617589]">schedule</span>
                Thời điểm bắt đầu
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label 
                  className={`relative flex flex-col p-4 bg-white dark:bg-gray-800 border-2 rounded-xl cursor-pointer transition-all ${
                    startType === 'now' ? 'border-primary' : 'border-[#f0f2f4] dark:border-gray-700 hover:border-primary/30'
                  }`}
                  onClick={() => setStartType('now')}
                >
                  <input className="sr-only" type="radio" value="now" checked={startType === 'now'} readOnly />
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-bold ${startType === 'now' ? 'text-primary' : ''}`}>Ngay bây giờ</span>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${startType === 'now' ? 'border-4 border-primary bg-white' : 'border border-gray-300'}`}></div>
                  </div>
                </label>
                <label 
                  className={`relative flex flex-col p-4 bg-white dark:bg-gray-800 border-2 rounded-xl cursor-pointer transition-all ${
                    startType === 'schedule' ? 'border-primary' : 'border-[#f0f2f4] dark:border-gray-700 hover:border-primary/30'
                  }`}
                  onClick={() => setStartType('schedule')}
                >
                  <input className="sr-only" type="radio" value="schedule" checked={startType === 'schedule'} readOnly />
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-bold ${startType === 'schedule' ? 'text-primary' : ''}`}>Lên lịch</span>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${startType === 'schedule' ? 'border-4 border-primary bg-white' : 'border border-gray-300'}`}></div>
                  </div>
                </label>
              </div>
              
              {startType === 'schedule' && (
                <div className="grid grid-cols-2 gap-4 mt-1 animate-in slide-in-from-top-2 duration-300">
                  <div className="relative">
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-xl border-[#f0f2f4] dark:border-gray-700 bg-[#f6f7f8] dark:bg-gray-800 py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer outline-none" 
                    />
                  </div>
                  <div className="relative">
                    <input 
                      type="time" 
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full rounded-xl border-[#f0f2f4] dark:border-gray-700 bg-[#f6f7f8] dark:bg-gray-800 py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer outline-none" 
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex flex-col gap-2.5">
              <label className="text-sm font-bold text-[#111418] dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#617589]">calendar_month</span>
                Hạn chót (Deadline)
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <input 
                    type="date" 
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full rounded-xl border-[#f0f2f4] dark:border-gray-700 bg-[#f6f7f8] dark:bg-gray-800 py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer outline-none" 
                  />
                </div>
                <div className="relative">
                  <input 
                    type="time" 
                    value={dueTime}
                    onChange={e => setDueTime(e.target.value)}
                    className="w-full rounded-xl border-[#f0f2f4] dark:border-gray-700 bg-[#f6f7f8] dark:bg-gray-800 py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer outline-none" 
                  />
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-2.5">
              <label className="text-sm font-bold text-[#111418] dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#617589]">timer</span>
                Thời gian làm bài
              </label>
              <div className={`flex items-center justify-between bg-[#f6f7f8] dark:bg-gray-800 rounded-xl px-4 py-3 border border-[#f0f2f4] dark:border-gray-700 transition-opacity ${isUnlimitedTime ? 'opacity-80' : ''}`}>
                <div className="flex items-center gap-2 flex-1">
                  <input 
                    type="number" 
                    disabled={isUnlimitedTime}
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(Number(e.target.value) || 0)}
                    className="w-20 bg-transparent border-none p-0 text-sm font-bold focus:ring-0 focus:outline-none disabled:opacity-50" 
                  />
                  <span className="text-sm font-medium text-[#617589]">phút</span>
                </div>
                <div className="flex items-center gap-2 border-l border-[#e0e3e6] dark:border-gray-700 pl-4">
                  <span className="text-sm font-medium text-[#617589]">Không giới hạn</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={isUnlimitedTime} onChange={e => setIsUnlimitedTime(e.target.checked)} />
                    <div className="w-9 h-5 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <label className="text-sm font-bold text-[#111418] dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#617589]">replay</span>
                Số lần làm bài
              </label>
              <div className="flex items-center gap-4">
                <div className="relative w-32">
                  <input 
                    type="number" 
                    min="1" 
                    value={maxAttempts}
                    onChange={(e) => setMaxAttempts(Number(e.target.value) || 1)}
                    className="w-full rounded-xl border-[#f0f2f4] dark:border-gray-700 bg-[#f6f7f8] dark:bg-gray-800 py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-center outline-none" 
                  />
                </div>
                <p className="text-sm text-[#617589] font-medium">Lượt làm tối đa cho mỗi học sinh</p>
              </div>
            </div>

            <div className="h-[1px] bg-[#f0f2f4] dark:bg-gray-800 my-2"></div>
            
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold text-[#111418] dark:text-white">Trộn câu hỏi</span>
                  <span className="text-xs text-[#617589]">Thay đổi thứ tự câu hỏi cho từng học sinh</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={shuffleQuestions} onChange={e => setShuffleQuestions(e.target.checked)} />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold text-[#111418] dark:text-white">Hiện đáp án sau khi làm</span>
                  <span className="text-xs text-[#617589]">Học sinh có thể xem giải thích chi tiết sau khi nộp</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={showAnswers} onChange={e => setShowAnswers(e.target.checked)} />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl flex gap-3">
              <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">info</span>
              <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed font-medium">
                {startType === 'schedule' 
                  ? `Bài tập sẽ được lên lịch và giao vào ngày ${startDate ? getDayMonthYear(startDate) : ''} lúc ${startTime || ''}.` 
                  : 'Bài tập sẽ được giao ngay lập tức ngay sau khi bạn xác nhận.'}
              </p>
            </div>

          </div>
          
          <div className="px-6 py-5 bg-[#f6f7f8] dark:bg-gray-800/50 flex items-center justify-end gap-3 shrink-0">
            <button 
              onClick={() => setSelectedAssignment(null)}
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-[#617589] hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Quay lại
            </button>
            <button 
              disabled={isAssigning !== null}
              onClick={handleAssign}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
            >
              <span>{isAssigning ? 'Đang giao...' : (startType === 'schedule' ? 'Lên lịch giao' : 'Giao bài ngay')}</span>
              <span className="material-symbols-outlined text-[18px]">event_available</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Renderer for Step 1
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-background-dark w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0f2f4] dark:border-gray-800">
          <div className="flex flex-col">
            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Bước 1: Chọn bài tập</p>
            <h2 className="text-xl font-bold">Giao bài từ thư viện</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-[#f0f2f4] dark:hover:bg-gray-800 rounded-full text-[#617589] transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-[#f0f2f4] dark:border-gray-800 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#617589]">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </div>
            <input 
              className="block w-full rounded-xl border border-[#f0f2f4] dark:border-gray-700 bg-white dark:bg-gray-800 py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/50 transition-all outline-none" 
              placeholder="Tìm bài tập trong thư viện..." 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative min-w-[180px]">
            <select 
              className="appearance-none block w-full rounded-xl border border-[#f0f2f4] dark:border-gray-700 bg-white dark:bg-gray-800 py-2.5 pl-4 pr-10 text-sm font-medium focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer outline-none"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="ALL">Tất cả danh mục</option>
              <option value="NGỮ PHÁP">Ngữ pháp</option>
              <option value="TỪ VỰNG">Từ vựng</option>
              <option value="ĐỌC HIỂU">Đọc hiểu</option>
              <option value="NGHE">Nghe</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[#617589]">
              <span className="material-symbols-outlined text-[20px]">expand_more</span>
            </div>
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {/* Create options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <button 
              onClick={handleCreateAndAssign}
              disabled={creating}
              className="flex items-center gap-4 p-4 border-2 border-dashed border-primary/20 hover:border-primary/50 hover:bg-primary/5 rounded-2xl transition-all group text-left disabled:opacity-50"
            >
              <div className="size-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-2xl font-bold">add</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-[#111418] dark:text-white">Tạo bài mới</h4>
                <p className="text-xs text-[#617589] mt-0.5">Soạn thảo câu hỏi thủ công</p>
              </div>
            </button>

            <div className="flex items-center gap-4 p-4 bg-primary/[0.03] border border-primary/10 rounded-2xl relative group overflow-hidden opacity-80 cursor-not-allowed">
              <div className="size-12 bg-primary text-white rounded-xl flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">auto_awesome</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-[#111418] dark:text-white flex items-center gap-2">
                  Tạo bằng AI
                </h4>
                <p className="text-xs text-[#617589] mt-0.5">Tự động tạo từ tài liệu của bạn</p>
              </div>
              <div className="absolute top-2 right-2">
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-bold rounded-lg uppercase tracking-wider">
                  Coming Soon
                </span>
              </div>
            </div>
          </div>

          <div className="h-px bg-[#f0f2f4] dark:bg-gray-800 mb-6 mx-2" />
          
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-[#617589] opacity-50">
              <span className="material-symbols-outlined text-[48px] mb-2">auto_stories</span>
              <p>Thư viện trống hoặc không tìm thấy bài tập phù hợp.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map((ass) => {
                const config = TYPE_CONFIG[ass.materialType] || TYPE_CONFIG.EXERCISE;
                return (
                  <div key={ass.id} className="flex items-center gap-4 p-4 hover:bg-[#f0f2f4] dark:hover:bg-gray-800/50 rounded-xl transition-all group border border-transparent hover:border-gray-200 dark:hover:border-gray-700 cursor-pointer" onClick={() => setSelectedAssignment(ass)}>
                    <div className={`size-12 ${config.bgClass} ${config.textClass} rounded-xl flex items-center justify-center shrink-0`}>
                      <span className="material-symbols-outlined text-2xl">{config.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-[#111418] dark:text-white truncate">{ass.title}</h4>
                      <div className="flex items-center gap-4 mt-1 text-xs text-[#617589]">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">format_list_bulleted</span> 
                          {ass._count?.questions || 0} câu hỏi
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">history</span> 
                          {new Date(ass.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <button 
                        onClick={(e) => { e.stopPropagation(); window.open(`/teacher/materials/${ass.id}/edit`, '_blank'); }}
                        className="p-2 border border-[#d1d5db] dark:border-gray-600 text-[#617589] hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-center group/tooltip relative"
                        title="Xem trước/Chỉnh sửa"
                      >
                        <span className="material-symbols-outlined text-[20px]">visibility</span>
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">Xem trước / Sửa</span>
                      </button>
                      <button 
                        className={`bg-primary text-white px-5 py-2 rounded-lg font-bold text-sm shadow-sm md:opacity-0 group-hover:opacity-100 transition-all`}
                      >
                        Chọn
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
