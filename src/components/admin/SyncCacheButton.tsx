"use client";

import React, { useState } from 'react';
import { toast } from 'sonner';
import { adminSyncCacheAndFeed } from '@/actions/admin-materials';

export function SyncCacheButton() {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    const confirmSync = window.confirm("Bạn có chắc chắn muốn đồng bộ lại Cache và Trang chủ ngay lập tức?");
    if (!confirmSync) return;

    setIsSyncing(true);
    const toastId = toast.loading("Đang đồng bộ Cache và Feed trang chủ...");
    try {
      const res = await adminSyncCacheAndFeed();
      if (res && res.success) {
        toast.success("Đồng bộ thành công! Trang chủ đã được cập nhật.", { id: toastId });
      } else {
        toast.error("Đồng bộ thất bại. Vui lòng thử lại.", { id: toastId });
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Lỗi khi đồng bộ cache.", { id: toastId });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <button 
      onClick={handleSync}
      disabled={isSyncing}
      className={`w-full p-4 bg-neutral-800 hover:bg-neutral-700 text-white rounded-2xl flex items-center justify-between group transition-all ${
        isSyncing ? 'opacity-55 cursor-not-allowed' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <span className={`material-symbols-outlined text-rose-500 ${isSyncing ? 'animate-spin' : ''}`}>
          sync
        </span>
        <span className="font-bold text-sm">Đồng bộ Cache & Trang chủ</span>
      </div>
      <span className="material-symbols-outlined text-neutral-600 group-hover:translate-x-1 transition-transform">
        chevron_right
      </span>
    </button>
  );
}
