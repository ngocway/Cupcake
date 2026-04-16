"use client";

import React, { useState } from 'react';
import { adminToggleBlockMaterial, adminUpdateAssignmentInfo, adminUpdateLessonInfo } from '@/actions/admin-materials';

export function AdminMaterialItem({ item, isLessons }: { item: any, isLessons: boolean }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);
  const [editStatus, setEditStatus] = useState(item.status || 'DRAFT');
  const [editIsPremium, setEditIsPremium] = useState(item.isPremium || false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Local optimistic state
  const [localTitle, setLocalTitle] = useState(item.title);
  const [localStatus, setLocalStatus] = useState(item.status);
  const [localIsPremium, setLocalIsPremium] = useState(item.isPremium);
  const [localIsBlocked, setLocalIsBlocked] = useState(item.isBlocked || false);

  const handleBlockToggle = async () => {
    setIsDeleting(true);
    try {
      await adminToggleBlockMaterial(item.id, isLessons, !localIsBlocked);
      setLocalIsBlocked(!localIsBlocked);
      setShowDeleteConfirm(false);
    } catch (e) {
      alert('Lỗi cập nhật trạng thái chặn!');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      if (isLessons) {
        await adminUpdateLessonInfo(item.id, editTitle, editIsPremium);
        setLocalTitle(editTitle);
        setLocalIsPremium(editIsPremium);
      } else {
        await adminUpdateAssignmentInfo(item.id, editTitle, editStatus);
        setLocalTitle(editTitle);
        setLocalStatus(editStatus);
      }
      setIsEditing(false);
    } catch {
      alert('Lỗi cập nhật thông tin!');
    } finally {
      setIsSaving(false);
    }
  };

  const openEdit = () => {
    setEditTitle(localTitle);
    setEditStatus(localStatus || 'DRAFT');
    setEditIsPremium(localIsPremium || false);
    setIsEditing(true);
  };

  const statusLabel = localStatus === 'PUBLIC' ? 'Công khai' : (localStatus === 'PRIVATE' ? 'Riêng tư' : 'Bản nháp');
  const statusColors = localStatus === 'PUBLIC' ? 'bg-emerald-500/10 text-emerald-500' : (localStatus === 'PRIVATE' ? 'bg-rose-500/10 text-rose-500' : 'bg-neutral-800 text-neutral-500');


  return (
    <>
      <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl hover:border-neutral-700 transition-all flex items-center justify-between group">
        <div className="flex items-center gap-6">
           <div className="w-14 h-14 rounded-2xl bg-neutral-800 flex items-center justify-center border border-neutral-700 shadow-inner">
              {isLessons ? (
                <span className="material-symbols-outlined text-blue-500">play_circle</span>
              ) : (
                <span className="material-symbols-outlined text-emerald-500">assignment</span>
              )}
           </div>
           <div>
              <h3 className="text-white font-black text-lg mb-1 flex items-center gap-2">
                {localTitle}
                {localIsBlocked && (
                  <span className="material-symbols-outlined text-rose-500 text-base" title="Bị chặn hiển thị">block</span>
                )}
              </h3>
              <div className="flex items-center gap-3 text-xs font-medium">
                 <span className="text-neutral-500">Người tạo: <span className="text-blue-500 font-bold">{item.teacher?.name || 'Vô danh'}</span></span>
                 <span className="text-neutral-700">|</span>
                 <span className="text-neutral-500">{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
                 <span className="text-neutral-700">|</span>
                 {isLessons ? (
                   <span className="flex items-center gap-1 text-neutral-500">
                      <span className="material-symbols-outlined text-xs">visibility</span>
                      {item.viewsCount} lượt xem
                   </span>
                 ) : (
                   <span className="px-2 py-0.5 bg-neutral-800 text-neutral-400 rounded text-[9px] uppercase font-black tracking-widest">
                      {item.materialType}
                   </span>
                 )}
              </div>
           </div>
        </div>
        
        <div className="flex items-center gap-4">
           {isLessons && localIsPremium && (
             <span className="px-3 py-1 bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase border border-amber-500/10 rounded-full tracking-widest border-solid">Premium Content</span>
           )}
           {!isLessons && localStatus && (
             <span className={`px-3 py-1 text-[9px] font-black uppercase rounded-full tracking-widest border border-transparent ${statusColors}`}>
               {statusLabel}
             </span>
           )}
           
           <div className="flex gap-2">
              <button 
                onClick={openEdit} 
                disabled={showDeleteConfirm}
                className="w-10 h-10 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-500 hover:text-white flex items-center justify-center transition-all border border-neutral-700 disabled:opacity-50"
              >
                 <span className="material-symbols-outlined text-lg">edit</span>
              </button>
              
              {showDeleteConfirm ? (
                <div className={`flex items-center gap-2 border rounded-xl px-2 py-1 relative right-0 animate-in slide-in-from-right-4 duration-200 ${localIsBlocked ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
                  <span className={`text-xs font-bold whitespace-nowrap ml-2 ${localIsBlocked ? 'text-emerald-500' : 'text-rose-500'}`}>{localIsBlocked ? 'Bỏ chặn?' : 'Chặn?'}</span>
                  <button 
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                    className="px-3 py-1.5 text-xs font-bold text-neutral-500 hover:text-neutral-300 transition-colors"
                  >
                    Hủy
                  </button>
                  <button 
                    onClick={handleBlockToggle}
                    disabled={isDeleting}
                    className={`px-3 py-1.5 text-xs font-bold text-white rounded-lg transition-colors flex items-center gap-1 ${localIsBlocked ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600'}`}
                  >
                    {isDeleting ? (
                      <div className="size-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (localIsBlocked ? 'Bỏ chặn' : 'Chặn')}
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className={`w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center transition-all border border-neutral-700 ${localIsBlocked ? 'hover:bg-emerald-500/10 text-emerald-500 hover:text-emerald-400' : 'hover:bg-rose-500/10 text-neutral-500 hover:text-rose-500'}`}
                >
                   <span className="material-symbols-outlined text-lg">{localIsBlocked ? 'lock_open' : 'block'}</span>
                </button>
              )}
           </div>
        </div>
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Chỉnh sửa nhanh {isLessons ? 'bài học' : 'bài tập'}</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Tiêu đề</label>
                <input 
                  type="text" 
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl outline-none text-white focus:border-blue-500"
                />
              </div>

              {!isLessons ? (
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Trạng thái công khai</label>
                  <select 
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl outline-none text-white focus:border-blue-500"
                  >
                    <option value="DRAFT">Bản nháp</option>
                    <option value="PUBLIC">Công khai (Public)</option>
                    <option value="PRIVATE">Riêng tư (Private)</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="flex items-center gap-3 p-4 bg-neutral-800 border border-neutral-700 rounded-xl cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={editIsPremium}
                      onChange={(e) => setEditIsPremium(e.target.checked)}
                      className="w-5 h-5 accent-amber-500 rounded bg-neutral-900 border-neutral-700"
                    />
                    <span className="text-sm font-bold text-amber-500">Đánh dấu Content Premium</span>
                  </label>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 justify-end">
              <button 
                disabled={isSaving}
                onClick={() => setIsEditing(false)}
                className="px-5 py-2.5 font-bold text-neutral-400 hover:text-white transition-colors"
              >
                Hủy
              </button>
              <button 
                disabled={isSaving}
                onClick={handleSaveEdit}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2"
              >
                {isSaving ? <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
