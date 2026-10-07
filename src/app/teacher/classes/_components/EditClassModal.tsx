"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { 
  X, 
  Settings, 
  Copy, 
  Check, 
  RefreshCw, 
  Trash2, 
  ArrowRight, 
  ShieldCheck, 
  Users, 
  Loader2, 
  AlertTriangle,
  Lock,
  LockOpen,
  Clock
} from "lucide-react";
import { updateClassInfo, deleteClass, regenerateClassJoinCode } from "../[id]/actions";

export interface ClassData {
  id: string;
  name: string;
  description: string | null;
  joinCode: string;
  classCode: string;
  isJoinable?: boolean;
  autoApprove?: boolean;
  dailyDripUnlock?: boolean;
  createdAt: string;
  _count: { enrollments: number };
}

interface EditClassModalProps {
  classData: ClassData | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditClassModal({ classData, isOpen, onClose, onSuccess }: EditClassModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isJoinable, setIsJoinable] = useState(true);
  const [autoApprove, setAutoApprove] = useState(true);
  const [dailyDripUnlock, setDailyDripUnlock] = useState(false);
  const [currentJoinCode, setCurrentJoinCode] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isCopiedLink, setIsCopiedLink] = useState(false);

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (classData) {
      setName(classData.name || "");
      setDescription(classData.description || "");
      setIsJoinable(classData.isJoinable ?? true);
      setAutoApprove(classData.autoApprove ?? true);
      setDailyDripUnlock(classData.dailyDripUnlock ?? false);
      setCurrentJoinCode(classData.joinCode || "");
      setShowDeleteConfirm(false);
    }
  }, [classData]);

  if (!isOpen || !classData) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(currentJoinCode);
      setIsCopied(true);
      toast.success("Đã sao chép mã tham gia!");
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error("Không thể sao chép");
    }
  };

  const handleCopyLink = async () => {
    try {
      const link = `${window.location.origin}/join/${currentJoinCode}`;
      await navigator.clipboard.writeText(link);
      setIsCopiedLink(true);
      toast.success("Đã sao chép liên kết mời học sinh!");
      setTimeout(() => setIsCopiedLink(false), 2000);
    } catch {
      toast.error("Không thể sao chép");
    }
  };

  const handleRegenerateCode = async () => {
    if (!confirm("Tạo mã mới sẽ làm mã tham gia cũ không còn hiệu lực. Bạn có chắc chắn không?")) {
      return;
    }
    setIsRegenerating(true);
    try {
      const res = await regenerateClassJoinCode(classData.id);
      if (res.success && res.joinCode) {
        setCurrentJoinCode(res.joinCode);
        toast.success("Đã tạo mã tham gia mới thành công!");
        onSuccess();
      }
    } catch (err: any) {
      toast.error(err.message || "Không thể tạo mã mới");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Tên lớp học không được để trống");
      return;
    }

    setIsSaving(true);
    try {
      const res = await updateClassInfo(classData.id, {
        name,
        description,
        isJoinable,
        autoApprove,
        dailyDripUnlock,
      });

      if (res.success) {
        toast.success("Đã cập nhật cài đặt lớp học thành công!");
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi lưu cài đặt");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await deleteClass(classData.id);
      if (res.success) {
        toast.success("Đã xóa lớp học thành công!");
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      toast.error(err.message || "Không thể xóa lớp học");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#111418]/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200/60 dark:border-slate-800/80 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">Cài đặt lớp học</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {classData.name} &bull; {classData._count.enrollments} học sinh
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="size-9 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5 stroke-[2.5px]" />
          </button>
        </div>

        {/* Content Body */}
        <div className="px-6 py-5 overflow-y-auto flex flex-col gap-6">
          <form id="editClassForm" onSubmit={handleSave} className="flex flex-col gap-5">
            {/* Tên lớp */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Tên lớp học <span className="text-red-500">*</span>
              </label>
              <input 
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Lớp tiếng Anh giao tiếp"
                className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm font-medium transition-all"
                required
              />
            </div>

            {/* Mô tả */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Mô tả / Niên khóa
              </label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Thông tin giới thiệu, mục tiêu hoặc ghi chú cho lớp học..."
                rows={2}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm font-medium resize-none transition-all"
              />
            </div>

            {/* Mã tham gia & Chia sẻ */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Mã tham gia lớp
                  </span>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-2xl font-black font-mono tracking-widest text-primary">
                      {currentJoinCode}
                    </span>
                    <button
                      type="button"
                      onClick={handleRegenerateCode}
                      disabled={isRegenerating}
                      title="Đổi mã mới"
                      className="size-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? "animate-spin" : ""}`} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{isCopied ? "Đã chép" : "Chép mã"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    {isCopiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Users className="w-3.5 h-3.5" />}
                    <span>{isCopiedLink ? "Đã chép link" : "Link mời"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quyền & Cấu hình duyệt */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Quy tắc tham gia
              </label>

              {/* isJoinable toggle */}
              <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 hover:bg-slate-50/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className={`size-8 rounded-lg flex items-center justify-center ${isJoinable ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-500"}`}>
                    {isJoinable ? <LockOpen className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Lớp đang mở</p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isJoinable ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400"}`}>
                        {isJoinable ? "Đang mở" : "Đã khóa"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {isJoinable ? "Học sinh có thể nhập mã tham gia để vào lớp (tắt để khóa lớp)" : "Lớp đang khóa, không nhận thêm học sinh qua mã"}
                    </p>
                  </div>
                </div>
                <input 
                  type="checkbox"
                  checked={isJoinable}
                  onChange={(e) => setIsJoinable(e.target.checked)}
                  className="size-5 rounded text-primary focus:ring-primary/40 border-slate-300 cursor-pointer"
                />
              </label>

              {/* autoApprove toggle */}
              <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 hover:bg-slate-50/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className={`size-8 rounded-lg flex items-center justify-center ${autoApprove ? "bg-blue-500/10 text-blue-600" : "bg-amber-500/10 text-amber-600"}`}>
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Tự động duyệt học sinh</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {autoApprove ? "Học sinh tham gia được duyệt ngay vào lớp" : "Yêu cầu giáo viên phê duyệt thủ công"}
                    </p>
                  </div>
                </div>
                <input 
                  type="checkbox"
                  checked={autoApprove}
                  onChange={(e) => setAutoApprove(e.target.checked)}
                  className="size-5 rounded text-primary focus:ring-primary/40 border-slate-300 cursor-pointer"
                />
              </label>

              {/* dailyDripUnlock toggle */}
              <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 hover:bg-slate-50/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className={`size-8 rounded-lg flex items-center justify-center ${dailyDripUnlock ? "bg-indigo-500/10 text-indigo-600" : "bg-slate-500/10 text-slate-500"}`}>
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Mở bài theo ngày (Daily Drip)</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {dailyDripUnlock 
                        ? "Mỗi ngày mở 1 bài vào 05:00 sáng sau khi hoàn thành 100% bài trước. Luôn xem trước 2 bài." 
                        : "Học sinh có thể học tự do hoặc theo điều kiện thông thường"}
                    </p>
                  </div>
                </div>
                <input 
                  type="checkbox"
                  checked={dailyDripUnlock}
                  onChange={(e) => setDailyDripUnlock(e.target.checked)}
                  className="size-5 rounded text-primary focus:ring-primary/40 border-slate-300 cursor-pointer"
                />
              </label>
            </div>
          </form>

          {/* Quick links & Danger zone */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
            <Link
              href={`/teacher/classes/${classData.id}`}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors"
              onClick={onClose}
            >
              <span>Đi đến trang chi tiết &amp; quản lý học sinh</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>

            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center justify-center gap-2 p-3 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-bold transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-900"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xóa lớp học này</span>
              </button>
            ) : (
              <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex flex-col gap-3 animate-in fade-in duration-150">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-red-800 dark:text-red-300">
                      Xác nhận xóa lớp &quot;{classData.name}&quot;?
                    </p>
                    <p className="text-[11px] text-red-600 dark:text-red-400 mt-0.5">
                      Lớp học sẽ bị ẩn khỏi danh sách. Dữ liệu bài nộp trước đây vẫn được lưu trữ an toàn.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-4 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Xác nhận xóa</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <button 
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          >
            Đóng
          </button>
          <button 
            type="submit"
            form="editClassForm"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 transition-all flex items-center gap-2 disabled:opacity-60"
          >
            {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{isSaving ? "Đang lưu..." : "Lưu cài đặt"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
