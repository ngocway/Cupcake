import React, { useState } from 'react';
import { Target, Users } from 'lucide-react';

export interface ClassOption {
  id: string;
  name: string;
  studentCount: number;
}

export interface AssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (data: any) => void;
  classes: ClassOption[];
  initialSelectedIds?: string[];
}

export function AssignModal({ 
  isOpen, 
  onClose, 
  onAssign, 
  classes = [],
  initialSelectedIds = [] 
}: AssignModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedClasses, setSelectedClasses] = useState<string[]>(initialSelectedIds);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Step 2 Configurations
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

  // Sync initial selection when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setSelectedClasses(initialSelectedIds);
      setStep(1);
    }
  }, [isOpen, initialSelectedIds]);

  if (!isOpen) return null;

  const filteredClasses = classes.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleClass = (id: string) => {
    setSelectedClasses(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleAssign = () => {
    let startDateTimeObj = null;
    if (startType === 'schedule' && startDate && startTime) {
      startDateTimeObj = new Date(`${startDate}T${startTime}`);
    }
    let dueDateTimeObj = null;
    if (dueDate && dueTime) {
      dueDateTimeObj = new Date(`${dueDate}T${dueTime}`);
    }

    onAssign({
      classIds: selectedClasses,
      timeLimit: isUnlimitedTime ? null : timeLimit,
      startDate: startDateTimeObj ? startDateTimeObj.toISOString() : null,
      deadline: dueDateTimeObj ? dueDateTimeObj.toISOString() : null,
      maxAttempts,
      // Pass these directly as requested by the UI context
      shuffleQuestions,
      showAnswers
    });
    onClose();
  };

  const getDayMonthYear = (d: string) => {
    const date = new Date(d);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  const selectedStudentsCount = classes.filter(c => selectedClasses.includes(c.id)).reduce((acc, c) => acc + c.studentCount, 0);

  if (step === 2) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
        <div className="w-full max-w-xl bg-white dark:bg-[#101922] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
          <div className="px-6 py-5 border-b border-[#f0f2f4] dark:border-gray-800 flex items-center justify-between">
            <div className="flex flex-col">
              <p className="text-xs font-bold text-[#137fec] uppercase tracking-widest mb-1">Bước 2: Thiết lập</p>
              <h2 className="text-xl font-extrabold text-[#111418] dark:text-white">Cài đặt giao bài</h2>
            </div>
            <button onClick={onClose} className="text-[#617589] hover:text-[#111418] dark:hover:text-white transition-colors">
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
                <label className={`relative flex flex-col p-4 bg-white dark:bg-gray-800 border-2 rounded-xl cursor-pointer transition-all ${startType === 'now' ? 'border-[#137fec]' : 'border-[#f0f2f4] dark:border-gray-700 hover:border-[#137fec]/30'}`} onClick={() => setStartType('now')}>
                  <input className="sr-only" type="radio" value="now" checked={startType === 'now'} readOnly />
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-bold ${startType === 'now' ? 'text-[#137fec]' : ''}`}>Ngay bây giờ</span>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${startType === 'now' ? 'border-4 border-[#137fec] bg-white' : 'border border-gray-300'}`}></div>
                  </div>
                </label>
                <label className={`relative flex flex-col p-4 bg-white dark:bg-gray-800 border-2 rounded-xl cursor-pointer transition-all ${startType === 'schedule' ? 'border-[#137fec]' : 'border-[#f0f2f4] dark:border-gray-700 hover:border-[#137fec]/30'}`} onClick={() => setStartType('schedule')}>
                  <input className="sr-only" type="radio" value="schedule" checked={startType === 'schedule'} readOnly />
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-bold ${startType === 'schedule' ? 'text-[#137fec]' : ''}`}>Lên lịch</span>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${startType === 'schedule' ? 'border-4 border-[#137fec] bg-white' : 'border border-gray-300'}`}></div>
                  </div>
                </label>
              </div>
              
              {startType === 'schedule' && (
                <div className="grid grid-cols-2 gap-4 mt-1 animate-in slide-in-from-top-2 duration-300">
                  <div className="relative">
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-xl border-[#f0f2f4] dark:border-gray-700 bg-[#f6f7f8] dark:bg-gray-800 py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-[#137fec]/20 focus:border-[#137fec] transition-all cursor-pointer outline-none" />
                  </div>
                  <div className="relative">
                    <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full rounded-xl border-[#f0f2f4] dark:border-gray-700 bg-[#f6f7f8] dark:bg-gray-800 py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-[#137fec]/20 focus:border-[#137fec] transition-all cursor-pointer outline-none" />
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
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full rounded-xl border-[#f0f2f4] dark:border-gray-700 bg-[#f6f7f8] dark:bg-gray-800 py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-[#137fec]/20 focus:border-[#137fec] transition-all cursor-pointer outline-none" />
                </div>
                <div className="relative">
                  <input type="time" value={dueTime} onChange={e => setDueTime(e.target.value)} className="w-full rounded-xl border-[#f0f2f4] dark:border-gray-700 bg-[#f6f7f8] dark:bg-gray-800 py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-[#137fec]/20 focus:border-[#137fec] transition-all cursor-pointer outline-none" />
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
                  <input type="number" disabled={isUnlimitedTime} value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value) || 0)} className="w-20 bg-transparent border-none p-0 text-sm font-bold focus:ring-0 focus:outline-none disabled:opacity-50" />
                  <span className="text-sm font-medium text-[#617589]">phút</span>
                </div>
                <div className="flex items-center gap-2 border-l border-[#e0e3e6] dark:border-gray-700 pl-4">
                  <span className="text-sm font-medium text-[#617589]">Không giới hạn</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={isUnlimitedTime} onChange={e => setIsUnlimitedTime(e.target.checked)} />
                    <div className="w-9 h-5 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#137fec]"></div>
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
                  <input type="number" min="1" value={maxAttempts} onChange={(e) => setMaxAttempts(Number(e.target.value) || 1)} className="w-full rounded-xl border-[#f0f2f4] dark:border-gray-700 bg-[#f6f7f8] dark:bg-gray-800 py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-[#137fec]/20 focus:border-[#137fec] transition-all text-center outline-none" />
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
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#137fec]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold text-[#111418] dark:text-white">Hiện đáp án sau khi làm</span>
                  <span className="text-xs text-[#617589]">Học sinh có thể xem giải thích chi tiết sau khi nộp</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={showAnswers} onChange={e => setShowAnswers(e.target.checked)} />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#137fec]"></div>
                </label>
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl flex gap-3">
              <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">info</span>
              <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed font-medium">
                {startType === 'schedule' 
                  ? `Bài tập sẽ được lên lịch và giao vào ngày ${startDate ? getDayMonthYear(startDate) : ''} lúc ${startTime || ''} cho ${selectedStudentsCount} học sinh của ${selectedClasses.length} lớp.` 
                  : `Bài tập sẽ được giao ngay lập tức cho ${selectedStudentsCount} học sinh của ${selectedClasses.length} lớp.`}
              </p>
            </div>
          </div>
          
          <div className="px-6 py-5 bg-[#f6f7f8] dark:bg-gray-800/50 flex items-center justify-end gap-3 shrink-0">
            <button onClick={() => setStep(1)} className="px-5 py-2.5 rounded-xl font-bold text-sm text-[#617589] hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              Quay lại
            </button>
            <button onClick={handleAssign} className="flex items-center gap-2 bg-[#137fec] hover:bg-[#137fec]/90 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md active:scale-[0.98]">
              <span>{startType === 'schedule' ? 'Lên lịch giao' : 'Giao bài ngay'}</span>
              <span className="material-symbols-outlined text-[18px]">event_available</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 1: Multiple Classes Selector matching the new style
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-xl bg-white dark:bg-[#101922] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#f0f2f4] dark:border-gray-800 flex items-center justify-between">
          <div className="flex flex-col">
            <p className="text-xs font-bold text-[#137fec] uppercase tracking-widest mb-1">Bước 1: Chọn lớp</p>
            <h2 className="text-xl font-extrabold text-[#111418] dark:text-white">Giao cho lớp học</h2>
          </div>
          <button onClick={onClose} className="text-[#617589] hover:text-[#111418] dark:hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          
          {/* Target Classes */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-2 text-[#111418] dark:text-white font-bold">
                <Users className="w-5 h-5 text-[#137fec]" />
                <h3 className="text-[15px]">Lớp học đã chọn ({selectedClasses.length})</h3>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-[#617589]">search</span>
                <input 
                  type="text"
                  placeholder="Tìm lớp..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-48 pl-9 pr-4 py-2 bg-[#f6f7f8] dark:bg-gray-800 border-[#f0f2f4] dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#137fec]/20 focus:border-[#137fec] transition-all"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredClasses.length > 0 ? (
                filteredClasses.map(cls => {
                  const isSelected = selectedClasses.includes(cls.id);
                  const isInitiallyAssigned = initialSelectedIds.includes(cls.id);
                  
                  return (
                    <label 
                      key={cls.id} 
                      className={`flex items-start justify-between space-x-3 p-4 rounded-xl border-2 transition-all ${
                        isInitiallyAssigned 
                          ? 'border-[#f0f2f4] dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 opacity-60 cursor-not-allowed grayscale-[0.2]' 
                          : isSelected 
                            ? 'border-[#137fec] bg-[#137fec]/10 cursor-pointer' 
                            : 'border-[#f0f2f4] dark:border-gray-700 hover:border-[#137fec]/30 bg-white dark:bg-gray-800 cursor-pointer'
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        if (!isInitiallyAssigned) {
                          toggleClass(cls.id);
                        }
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold text-sm truncate mb-0.5 ${isSelected && !isInitiallyAssigned ? 'text-[#137fec]' : 'text-[#111418] dark:text-gray-300'}`}>
                          {cls.name}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-[#617589]">{cls.studentCount} học sinh</p>
                          {isInitiallyAssigned && (
                            <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#e0e3e6] dark:bg-gray-700 text-[#617589] uppercase tracking-wider">
                              Đang giao bài
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-colors ${
                        isSelected 
                          ? isInitiallyAssigned 
                            ? 'bg-gray-400 border-gray-400 dark:bg-gray-600 dark:border-gray-600'
                            : 'bg-[#137fec] border-[#137fec]' 
                          : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                      }`}>
                        {isSelected && <span className="material-symbols-outlined text-white text-[14px]">check</span>}
                      </div>
                    </label>
                  );
                })
              ) : (
                <div className="col-span-full py-8 text-center bg-[#f6f7f8] dark:bg-gray-800/50 rounded-2xl border border-dashed border-[#f0f2f4] dark:border-gray-700">
                  <p className="text-[#617589] text-sm font-medium">Không tìm thấy lớp học nào khớp</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 bg-[#f6f7f8] dark:bg-gray-800/50 flex items-center justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-sm text-[#617589] hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            Hủy bỏ
          </button>
          <button 
            disabled={selectedClasses.length === 0}
            onClick={() => setStep(2)} 
            className="flex items-center gap-2 bg-[#137fec] hover:bg-[#137fec]/90 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
          >
            <span>Tiếp tục</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>

      </div>
    </div>
  );
}
