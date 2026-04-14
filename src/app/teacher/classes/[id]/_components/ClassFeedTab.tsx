"use client";

import React, { useState, useEffect } from 'react';
import { getAnnouncements, createAnnouncement } from '../actions';

interface Announcement {
  id: string;
  content: string;
  attachments?: string | null;
  createdAt: Date | string;
}

export function ClassFeedTab({ classId }: { classId: string }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newContent, setNewContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const data = await getAnnouncements(classId);
        setAnnouncements(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFeed();
  }, [classId]);

  const handlePost = async () => {
    if (!newContent.trim()) return;
    setIsPosting(true);
    try {
      const res = await createAnnouncement(classId, newContent);
      if (res.success && res.announcement) {
        setAnnouncements(prev => [res.announcement as Announcement, ...prev]);
        setNewContent('');
      }
    } catch (err) {
      console.error(err);
      alert('Không thể đăng thông báo');
    } finally {
      setIsPosting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
        <div className="h-24 bg-gray-50 dark:bg-gray-900 rounded-2xl" />
        <div className="h-24 bg-gray-50 dark:bg-gray-900 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-300">
      {/* Post Box */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#f0f2f4] dark:border-gray-700 shadow-sm">
        <div className="flex gap-4">
          <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary">campaign</span>
          </div>
          <div className="flex-1 flex flex-col gap-4">
            <textarea
              className="w-full bg-[#f0f2f4] dark:bg-gray-900 border-none rounded-xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-primary/50 outline-none transition-all resize-none min-h-[100px]"
              placeholder="Gửi khảo sát, thông báo hoặc tài liệu đọc cho cả lớp..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
            />
            <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-4">
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-[#617589] transition-colors" title="Đính kèm tài liệu (Sắp có)">
                  <span className="material-symbols-outlined text-[20px]">attach_file</span>
                </button>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-[#617589] transition-colors" title="Chèn liên kết (Sắp có)">
                  <span className="material-symbols-outlined text-[20px]">link</span>
                </button>
              </div>
              <button
                onClick={handlePost}
                disabled={isPosting || !newContent.trim()}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
              >
                {isPosting ? 'Đang đăng...' : 'Đăng thông báo'}
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="flex flex-col gap-4">
        <h3 className="font-bold text-lg text-[#111418] dark:text-white px-2">Hoạt động gần đây</h3>
        
        {announcements.length === 0 ? (
          <div className="text-center py-16 text-[#617589] bg-gray-50/50 dark:bg-gray-900/10 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 font-medium">
            Chưa có thông báo nào được đăng.
          </div>
        ) : (
          announcements.map((item) => (
            <div key={item.id} className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-[#f0f2f4] dark:border-gray-700 shadow-sm flex flex-col gap-3 group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold">GV</div>
                  <div>
                    <span className="text-sm font-bold text-[#111418] dark:text-white">Bạn</span>
                    <span className="text-[10px] text-[#617589] ml-2 font-medium">
                      {new Date(item.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                </div>
                <button className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-all">
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
              <div className="text-sm text-[#111418] dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {item.content}
              </div>
              {item.attachments && (
                <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center gap-3">
                   <span className="material-symbols-outlined text-primary">link</span>
                   <span className="text-xs font-medium text-primary hover:underline cursor-pointer">{item.attachments}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
