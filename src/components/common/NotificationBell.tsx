'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getMyNotifications, getUnreadCount, markAsRead, markAllAsRead } from '@/actions/notification-actions';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  isRead: boolean;
  createdAt: Date;
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 60000); // Polling every minute

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Close on click outside
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const fetchUnreadCount = async () => {
    const count = await getUnreadCount();
    setUnreadCount(count);
  };

  const fetchNotifications = async () => {
    const data = await getMyNotifications();
    setNotifications(data as Notification[]);
    const unreads = (data as Notification[]).filter((n: Notification) => !n.isRead).length;
    setUnreadCount(unreads);
  };

  const handleToggle = async () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (newState) {
      await fetchNotifications(); // Refresh on open
    }
  };

  const handleNotificationClick = async (n: Notification) => {
    if (!n.isRead) {
      await markAsRead(n.id);
      setUnreadCount(prev => Math.max(0, prev - 1));
      setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, isRead: true } : item));
    }
    if (n.link) {
      window.location.href = n.link;
    }
    setIsOpen(false);
  };

  const handleMarkAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await markAllAsRead();
    setUnreadCount(0);
    setNotifications(prev => prev.map(item => ({ ...item, isRead: true })));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={handleToggle}
        className={`p-2 transition-colors rounded-full relative flex ${isOpen ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
      >
        <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 flex min-w-[16px] h-[16px] items-center justify-center rounded-full bg-error text-[10px] font-bold text-white px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 mt-1 w-80 max-w-[90vw] sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl z-50 overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Thông báo</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAll}
                className="text-xs font-bold text-primary hover:text-primary/80 transition-colors"
              >
                Đánh dấu đã đọc
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <span className="material-symbols-outlined text-4xl opacity-20 mb-2">notifications_off</span>
                <p className="text-sm font-medium">Chưa có thông báo nào</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {notifications.map(n => (
                  <div 
                    key={n.id} 
                    onClick={() => handleNotificationClick(n)}
                    className={`px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer flex gap-4 ${n.isRead ? 'opacity-70' : 'bg-blue-50/20 dark:bg-blue-900/10'}`}
                  >
                    <div className="shrink-0 mt-1">
                      {n.type === 'NEW_ASSIGNMENT' && <span className="material-symbols-outlined text-blue-500 bg-blue-50 p-2 rounded-full text-[20px]">assignment</span>}
                      {n.type === 'ENROLLMENT_APPROVED' && <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 p-2 rounded-full text-[20px]">check_circle</span>}
                      {n.type === 'DUE_REMINDER' && <span className="material-symbols-outlined text-amber-500 bg-amber-50 p-2 rounded-full text-[20px]">alarm</span>}
                      {n.type === 'GRADING_UPDATE' && <span className="material-symbols-outlined text-purple-500 bg-purple-50 p-2 rounded-full text-[20px]">grade</span>}
                      {n.type === 'GENERAL' && <span className="material-symbols-outlined text-slate-500 bg-slate-100 p-2 rounded-full text-[20px]">info</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!n.isRead ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                        {n.message}
                      </p>
                      <span className="text-[10px] font-bold text-slate-400 mt-2 block uppercase tracking-wider">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {!n.isRead && (
                      <div className="shrink-0 w-2 h-2 bg-primary rounded-full mt-2"></div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
