import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Clock, Calendar, Hash, Target, Users } from 'lucide-react';

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
  const [selectedClasses, setSelectedClasses] = React.useState<string[]>(initialSelectedIds);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [timeLimit, setTimeLimit] = useState<number | ''>('');
  const [startDate, setStartDate] = useState<string>('');
  const [deadline, setDeadline] = useState<string>('');
  const [maxAttempts, setMaxAttempts] = useState<number>(1);
  const [focusMode, setFocusMode] = useState<boolean>(false);
  const [allowLateSubmission, setAllowLateSubmission] = useState<boolean>(false);

  // Sync initial selection when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setSelectedClasses(initialSelectedIds);
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
    onAssign({
      classIds: selectedClasses,
      timeLimit: timeLimit ? Number(timeLimit) : null,
      startDate: startDate ? new Date(startDate).toISOString() : null,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      maxAttempts,
      focusMode,
      allowLateSubmission
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden font-sans border border-slate-200">
        
        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800">Cài đặt Giao bài</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-slate-200 text-slate-500 w-8 h-8">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          
          {/* Target Classes */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-2">
              <div className="flex items-center space-x-2 text-slate-800 font-semibold">
                <Users className="w-5 h-5 text-blue-500" />
                <h3>Chọn Lớp Học ({selectedClasses.length})</h3>
              </div>
              <div className="relative w-full md:w-64">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-slate-400">search</span>
                <input 
                  type="text"
                  placeholder="Tìm lớp học..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-100/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredClasses.length > 0 ? (
                filteredClasses.map(cls => (
                  <div 
                    key={cls.id} 
                    className={`flex items-start space-x-3 p-4 rounded-2xl border transition-all cursor-pointer ${
                      selectedClasses.includes(cls.id) 
                        ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500' 
                        : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                    }`}
                    onClick={() => toggleClass(cls.id)}
                  >
                    <Checkbox 
                      checked={selectedClasses.includes(cls.id)} 
                      onCheckedChange={() => toggleClass(cls.id)}
                      className="mt-0.5 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 rounded-md"
                    />
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{cls.name}</p>
                      <p className="text-xs text-slate-500 font-medium">{cls.studentCount} học sinh</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-slate-400 text-sm font-medium">Không tìm thấy lớp học nào khớp với "{searchTerm}"</p>
                </div>
              )}
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-5">
            <div className="flex items-center space-x-2 text-slate-800 font-semibold border-b border-slate-100 pb-2 pt-2">
              <Target className="w-5 h-5 text-emerald-500" />
              <h3>Thiết Lập Thông Số</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Time Limit */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
                  <Clock className="w-4 h-4 mr-1.5" /> Thời gian làm bài (Phút)
                </Label>
                <Input 
                  type="number" 
                  placeholder="Không giới hạn"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(Number(e.target.value) || '')}
                  className="h-11 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-emerald-500"
                />
              </div>

              {/* Deadline */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
                  <Calendar className="w-4 h-4 mr-1.5" /> Hạn nộp (Deadline)
                </Label>
                <Input 
                  type="datetime-local" 
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="h-11 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 text-slate-700"
                />
              </div>

              {/* Max Attempts */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
                  <Hash className="w-4 h-4 mr-1.5" /> Số lần làm tối đa
                </Label>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl h-11 p-1">
                  <Button type="button" variant="ghost" size="icon" onClick={() => setMaxAttempts(Math.max(1, maxAttempts - 1))} className="h-8 w-8 hover:bg-slate-200 rounded-lg text-slate-600">-</Button>
                  <Input 
                    type="number" 
                    value={maxAttempts}
                    onChange={(e) => setMaxAttempts(Number(e.target.value) || 1)}
                    className="flex-1 text-center font-bold text-slate-700 border-none shadow-none focus-visible:ring-0 bg-transparent"
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => setMaxAttempts(maxAttempts + 1)} className="h-8 w-8 hover:bg-slate-200 rounded-lg text-slate-600">+</Button>
                </div>
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
                  <span className="material-symbols-outlined text-[18px] mr-1.5 text-blue-500">play_circle</span> Thời gian bắt đầu
                </Label>
                <Input 
                  type="datetime-local" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-11 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-blue-500 text-slate-700"
                />
              </div>

              {/* Focus Mode */}
              <div className="space-y-2 bg-amber-50/50 border border-amber-100 p-4 rounded-2xl flex items-center justify-between col-span-1 md:col-span-2 mt-2">
                <div>
                  <Label className="font-bold text-amber-800 text-sm flex items-center mb-1">
                    Chế độ Focus Mode
                  </Label>
                  <p className="text-xs text-amber-700 font-medium">Học sinh không thể thoát khỏi màn hình bài thi hoặc chuyển tab.</p>
                </div>
                <Switch 
                  checked={focusMode}
                  onCheckedChange={setFocusMode}
                  className="data-[state=checked]:bg-amber-500"
                />
              </div>
              
              {/* Allow Late Submission */}
              <div className="space-y-2 bg-blue-50/50 border border-blue-100 p-4 rounded-2xl flex items-center justify-between col-span-1 md:col-span-2 mt-2">
                <div>
                  <Label className="font-bold text-blue-800 text-sm flex items-center mb-1">
                    Cho phép nộp muộn
                  </Label>
                  <p className="text-xs text-blue-700 font-medium">Học sinh vẫn có thể nộp bài sau khi qua hạn chót, nhưng sẽ bị đánh dấu là nộp muộn.</p>
                </div>
                <Switch 
                  checked={allowLateSubmission}
                  onCheckedChange={setAllowLateSubmission}
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end space-x-3">
          <Button variant="ghost" onClick={onClose} className="rounded-xl px-6 text-slate-500 hover:text-slate-800 hover:bg-slate-200 font-semibold h-11">
            Hủy
          </Button>
          <Button 
            onClick={handleAssign} 
            disabled={selectedClasses.length === 0}
            className="rounded-full px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 shadow-sm shadow-blue-200 transition-all disabled:opacity-50"
          >
            Xác nhận Giao bài
          </Button>
        </div>

      </div>
    </div>
  );
}
