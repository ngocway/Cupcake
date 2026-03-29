import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  onAddSuccess: () => void;
}

interface ParsedRow {
  id: string;
  name: string;
  email: string;
  isValid: boolean;
  errorMsg: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AddStudentModal({ isOpen, onClose, classId, onAddSuccess }: AddStudentModalProps) {
  const [activeTab, setActiveTab] = useState<'manual' | 'bulk'>('manual');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manual Form State
  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualPin, setManualPin] = useState(Math.floor(1000 + Math.random() * 9000).toString());
  const [addAnother, setAddAnother] = useState(false);

  // Bulk Import State
  const [bulkText, setBulkText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [defaultPin, setDefaultPin] = useState('');

  if (!isOpen) return null;

  const generateNewManualPin = () => {
    setManualPin(Math.floor(1000 + Math.random() * 9000).toString());
  };

  const handleManualSubmit = async () => {
    if (!manualName.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/classes/${classId}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: manualName.trim(),
          email: manualEmail.trim(),
          pin: manualPin,
        }),
      });

      if (!res.ok) {
        let msg = `Lỗi ${res.status}`;
        try { const d = await res.json(); msg = d.error || msg; } catch { /* empty */ }
        throw new Error(msg);
      }

      onAddSuccess();
      if (addAnother) {
        setManualName('');
        setManualEmail('');
        generateNewManualPin();
      } else {
        onClose();
      }
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  const parsePastedText = () => {
    if (!bulkText.trim()) return;
    const lines = bulkText.split('\n').filter(line => line.trim() !== '');
    const rows: ParsedRow[] = lines.map((line, index) => {
      const parts = line.includes('\t') ? line.split('\t') : line.includes(',') ? line.split(',') : line.split(' - ');
      const name = parts[0]?.trim() || '';
      const email = parts[1]?.trim() || '';
      
      let isValid = true;
      let errorMsg = '';
      
      if (!name) {
        isValid = false;
        errorMsg = 'Họ tên rỗng';
      } else if (email && !EMAIL_REGEX.test(email)) {
        isValid = false;
        errorMsg = 'Email sai định dạng';
      }

      return {
        id: `row-${index}-${Date.now()}`,
        name,
        email,
        isValid,
        errorMsg
      };
    });
    setParsedRows(rows);
    setShowPreview(true);
  };

  const updateRow = (id: string, field: 'name' | 'email', value: string) => {
    setParsedRows(prev => prev.map(row => {
      if (row.id !== id) return row;
      const updated = { ...row, [field]: value };
      
      let isValid = true;
      let errorMsg = '';
      if (!updated.name.trim()) {
        isValid = false;
        errorMsg = 'Họ tên rỗng';
      } else if (updated.email && !EMAIL_REGEX.test(updated.email)) {
        isValid = false;
        errorMsg = 'Email sai định dạng';
      }
      return { ...updated, isValid, errorMsg };
    }));
  };

  const removeRow = (id: string) => {
    setParsedRows(prev => prev.filter(row => row.id !== id));
  };

  const handleBulkSubmit = async () => {
    if (parsedRows.some(r => !r.isValid) || parsedRows.length === 0) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/classes/${classId}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          students: parsedRows.map(r => ({ name: r.name, email: r.email })),
          defaultPin: defaultPin.trim() || undefined,
        }),
      });

      if (!res.ok) {
        let msg = `Lỗi ${res.status}`;
        try { const d = await res.json(); msg = d.error || msg; } catch { /* empty */ }
        throw new Error(msg);
      }

      onAddSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasErrors = parsedRows.some(r => !r.isValid);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-[#111418]/60 backdrop-blur-sm animate-in fade-in">
      <div className={`w-full ${showPreview ? 'max-w-4xl' : 'max-w-[640px]'} bg-white dark:bg-background-dark rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transition-all duration-300`}>
        
        {/* Modal Header */}
        <div className="px-8 pt-8 pb-4 border-b border-[#f0f2f4] dark:border-gray-800 flex items-center justify-between shrink-0">
          <h2 className="text-2xl font-black text-[#111418] dark:text-white">Thêm học sinh mới</h2>
          <button 
            onClick={onClose} 
            className="size-10 flex items-center justify-center rounded-full hover:bg-[#f0f2f4] dark:hover:bg-gray-800 text-[#617589] transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Modal Body & Logic */}
        {!showPreview ? (
          <>
            <div className="flex px-6 border-b border-[#f0f2f4] dark:border-gray-800 shrink-0">
              <button 
                onClick={() => setActiveTab('manual')}
                className={`px-4 py-3.5 text-sm transition-all border-b-2 ${activeTab === 'manual' ? 'font-bold text-primary border-primary' : 'font-medium text-[#617589] border-transparent hover:text-[#111418] dark:hover:text-white'}`}
              >
                Nhập thủ công
              </button>
              <button 
                onClick={() => setActiveTab('bulk')}
                className={`px-4 py-3.5 text-sm transition-all border-b-2 ${activeTab === 'bulk' ? 'font-bold text-primary border-primary' : 'font-medium text-[#617589] border-transparent hover:text-[#111418] dark:hover:text-white'}`}
              >
                Nhập nhanh (Bulk Import)
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
              {activeTab === 'manual' ? (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-[#111418] dark:text-white">Họ và tên học sinh <span className="text-red-500">*</span></label>
                    <input 
                      value={manualName} 
                      onChange={e => setManualName(e.target.value)} 
                      className="w-full bg-[#f0f2f4] dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-sm placeholder-[#617589] focus:ring-2 focus:ring-primary/50 transition-all" 
                      placeholder="Ví dụ: Trần Văn Nam" 
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-[#111418] dark:text-white">Địa chỉ Email <span className="text-[#617589] font-normal">(Tùy chọn)</span></label>
                    <input 
                      value={manualEmail} 
                      onChange={e => setManualEmail(e.target.value)} 
                      className="w-full bg-[#f0f2f4] dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-sm placeholder-[#617589] focus:ring-2 focus:ring-primary/50 transition-all" 
                      placeholder="namtv@gmail.com" 
                    />
                    <p className="text-xs text-[#617589] font-medium">Dùng để gửi link đăng nhập tự động (Magic Link)</p>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-[#111418] dark:text-white">Mã PIN đăng nhập <span className="text-red-500">*</span></label>
                    <div className="relative w-1/2">
                      <input 
                        value={manualPin} 
                        onChange={e => setManualPin(e.target.value)} 
                        maxLength={6}
                        className="w-full bg-[#f0f2f4] dark:bg-gray-800 border-none rounded-xl px-4 py-3 pr-12 text-lg font-mono tracking-widest text-[#111418] dark:text-white focus:ring-2 focus:ring-primary/50 transition-all" 
                      />
                      <button 
                        onClick={generateNewManualPin}
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[#617589] hover:text-primary rounded-lg transition-colors"
                        title="Sinh ngẫu nhiên"
                      >
                        <span className="material-symbols-outlined text-[20px]">casino</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2 group cursor-pointer w-fit" onClick={() => setAddAnother(!addAnother)}>
                    <div className={`size-5 rounded flex items-center justify-center transition-colors ${addAnother ? 'bg-primary text-white' : 'border-2 border-[#d0d5dd] dark:border-gray-600'}`}>
                      {addAnother && <span className="material-symbols-outlined text-[16px] font-bold">check</span>}
                    </div>
                    <span className="text-sm font-bold text-[#111418] dark:text-white select-none">Nhập thêm học sinh khác liên tục</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-[#111418] dark:text-white">Dán danh sách học sinh</label>
                    <textarea 
                      value={bulkText}
                      onChange={e => setBulkText(e.target.value)}
                      className="w-full min-h-[200px] bg-[#f0f2f4] dark:bg-gray-800 border-none rounded-xl p-4 text-sm font-mono placeholder-[#617589] focus:ring-2 focus:ring-primary/50 transition-all resize-none" 
                      placeholder="Nguyễn Văn A - vana@gmail.com&#10;Trần Thị B - thib@gmail.com&#10;..."
                    />
                    <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 mt-2">
                      <span className="material-symbols-outlined text-blue-500 text-[18px]">info</span>
                      <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                        <span className="font-bold">Mẹo:</span> Copy cột Họ tên và Email từ Excel rồi dán vào đây. Hệ thống sẽ tự động tách thông tin.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 pt-1">
                    <label className="text-sm font-semibold text-[#111418] dark:text-white" htmlFor="default-pin">Mã PIN mặc định cho danh sách này</label>
                    <input 
                      value={defaultPin}
                      onChange={e => setDefaultPin(e.target.value)}
                      id="default-pin" 
                      className="w-full bg-[#f0f2f4] dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-sm placeholder-[#617589] focus:ring-2 focus:ring-primary/50 transition-all" 
                      placeholder="Ví dụ: 1234 (Để trống để hệ thống tạo ngẫu nhiên)" 
                      type="text"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="px-8 pb-8 pt-4 bg-white dark:bg-background-dark border-t border-[#f0f2f4] dark:border-gray-800 flex items-center justify-end gap-3 shrink-0">
              <button 
                onClick={onClose}
                className="px-6 py-3 rounded-xl text-sm font-bold text-[#617589] hover:bg-[#f0f2f4] dark:hover:bg-gray-800 transition-colors"
              >
                Hủy
              </button>
              {activeTab === 'manual' ? (
                <button 
                  onClick={handleManualSubmit}
                  disabled={isSubmitting || !manualName.trim()}
                  className="px-8 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Đang thêm...' : 'Thêm học sinh'}
                </button>
              ) : (
                <button 
                  onClick={parsePastedText}
                  disabled={!bulkText.trim()}
                  className="px-8 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                >
                  Xử lý danh sách
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="p-6 border-b border-[#f0f2f4] dark:border-gray-800 shrink-0">
              <h3 className="font-bold text-[#111418] dark:text-white text-lg">
                Dữ liệu trích xuất ({parsedRows.length} dòng)
              </h3>
              <p className="text-sm text-[#617589] mt-1">
                Kiểm tra lại thông tin. Nếu có dòng bị lỗi (viền đỏ), hãy sửa tay trước khi Thêm hàng loạt.
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-[#f8f9fa] dark:bg-gray-900/50">
              <div className="border border-[#e5e7eb] dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[#f0f2f4] dark:bg-gray-900 text-[#617589] font-bold">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-xl border-r border-white/50 dark:border-gray-800/50">Họ và tên</th>
                      <th className="px-4 py-3 border-r border-white/50 dark:border-gray-800/50">Email</th>
                      <th className="px-4 py-3 text-center border-r border-white/50 dark:border-gray-800/50">Trạng thái</th>
                      <th className="px-4 py-3 w-10 rounded-tr-xl"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f2f4] dark:divide-gray-700">
                    {parsedRows.map((row) => (
                      <tr key={row.id} className={row.isValid ? 'hover:bg-[#f8f9fa] dark:hover:bg-gray-700/50 transition-colors' : 'bg-red-50 dark:bg-red-900/20'}>
                        <td className="px-4 py-2 border-r border-[#f0f2f4] dark:border-gray-700">
                          <input 
                            value={row.name}
                            onChange={(e) => updateRow(row.id, 'name', e.target.value)}
                            className={`w-full bg-transparent border-none p-1.5 focus:ring-2 focus:ring-primary rounded font-bold text-[#111418] dark:text-white ${!row.isValid && !row.name.trim() ? 'ring-2 ring-red-400 placeholder-red-400' : ''}`}
                            placeholder="Chưa có tên..."
                          />
                        </td>
                        <td className="px-4 py-2 border-r border-[#f0f2f4] dark:border-gray-700">
                          <input 
                            value={row.email}
                            onChange={(e) => updateRow(row.id, 'email', e.target.value)}
                            className={`w-full bg-transparent border-none p-1.5 focus:ring-2 focus:ring-primary rounded text-[#617589] dark:text-gray-300 ${!row.isValid && row.email && !EMAIL_REGEX.test(row.email) ? 'ring-2 ring-red-400 text-red-600 placeholder-red-400' : ''}`}
                            placeholder="Bỏ trống hoặc nhập Email..."
                          />
                        </td>
                        <td className="px-4 py-2 text-center border-r border-[#f0f2f4] dark:border-gray-700">
                          {row.isValid ? (
                            <span className="text-emerald-700 dark:text-emerald-400 font-bold text-[10px] uppercase bg-emerald-100 dark:bg-emerald-900/40 px-2 py-1 rounded">HỢP LỆ</span>
                          ) : (
                            <span className="text-red-700 dark:text-red-400 font-bold text-[10px] uppercase bg-red-100 dark:bg-red-900/40 px-2 py-1 rounded" title={row.errorMsg}>LỖI ({row.errorMsg})</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button onClick={() => removeRow(row.id)} className="text-[#617589] hover:text-red-500 p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {parsedRows.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-10 text-[#617589] font-medium">
                          <span className="material-symbols-outlined text-[48px] opacity-20 block mb-2">person_off</span>
                          Không có dữ liệu
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-8 pb-8 pt-4 bg-white dark:bg-background-dark border-t border-[#f0f2f4] dark:border-gray-800 flex items-center justify-between shrink-0">
              <button 
                onClick={() => setShowPreview(false)}
                className="px-6 py-3 rounded-xl text-sm font-bold text-[#617589] hover:bg-[#f0f2f4] dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                Quay lại
              </button>
              
              <div className="flex items-center gap-4">
                {hasErrors && (
                  <span className="text-red-500 text-sm font-bold animate-pulse">Sửa các ô lỗi đỏ để tiếp tục</span>
                )}
                <button 
                  onClick={handleBulkSubmit}
                  disabled={isSubmitting || hasErrors || parsedRows.length === 0}
                  className="px-8 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? 'Đang thêm...' : `Xác nhận tạo (${parsedRows.length})`}
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
