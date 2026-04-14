"use client";

import React, { useState, useEffect } from 'react';
import { getMaterialAnalytics } from '@/actions/material-actions';

interface AnalyticsData {
  totalSubmissions: number;
  averageScore: number;
  questionStats: {
    questionId: string;
    type: string;
    correctRate: number;
    totalResponses: number;
    isHard: boolean;
  }[];
}

export function MaterialAnalyticsModal({ isOpen, onClose, assignmentId, title }: { isOpen: boolean; onClose: () => void; assignmentId: string; title: string }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const fetchStats = async () => {
        setLoading(true);
        try {
          const res = await getMaterialAnalytics(assignmentId);
          setData(res);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchStats();
    }
  }, [isOpen, assignmentId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white">
              <span className="material-symbols-outlined">analytics</span>
            </div>
            <div>
              <h3 className="font-bold text-lg">Phân tích chi tiết bài tập</h3>
              <p className="text-xs text-[#617589] truncate max-w-[400px]">{title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-20 gap-4">
               <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
               <p className="font-medium text-slate-500">Đang tổng hợp dữ liệu...</p>
             </div>
          ) : !data || data.totalSubmissions === 0 ? (
            <div className="text-center py-20 bg-gray-50 dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-800">
               <span className="material-symbols-outlined text-5xl text-gray-300 mb-4">bar_chart_off</span>
               <p className="text-gray-500 font-medium font-bold text-slate-700 dark:text-gray-200">Chưa có dữ liệu thống kê</p>
               <p className="text-xs text-gray-400 mt-1">Học sinh chưa làm bài tập này công khai hoặc trong lớp.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-800/50">
                   <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Tổng lượt nộp</p>
                   <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300">{data.totalSubmissions}</p>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
                   <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">Điểm trung bình</p>
                   <p className="text-3xl font-black text-indigo-700 dark:text-indigo-300">{(data.averageScore || 0).toFixed(1)}</p>
                </div>
              </div>

              {/* Item Analysis Table */}
              <div className="flex flex-col gap-4">
                <h4 className="font-bold text-[#111418] dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">list_alt</span>
                  Tỷ lệ đúng theo từng câu
                </h4>
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800">
                        <th className="px-6 py-3 text-[10px] font-bold text-[#617589] uppercase tracking-widest">Câu số</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-[#617589] uppercase tracking-widest">Loại</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-[#617589] uppercase tracking-widest">Lượt trả lời</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-[#617589] uppercase tracking-widest">Tỷ lệ đúng</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-[#617589] uppercase tracking-widest">Đánh giá</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {data.questionStats.map((q, idx) => (
                        <tr key={q.questionId} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                          <td className="px-6 py-4 text-sm font-bold text-slate-700 dark:text-slate-300"># {idx + 1}</td>
                          <td className="px-6 py-4">
                            <span className="text-[10px] font-bold bg-slate-100 dark:bg-gray-700 px-2 py-1 rounded-md text-slate-600 dark:text-slate-400">
                              {q.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium">{q.totalResponses}</td>
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-3">
                                <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden min-w-[60px]">
                                   <div 
                                      className={`h-full rounded-full ${q.correctRate > 70 ? 'bg-emerald-500' : q.correctRate > 40 ? 'bg-amber-500' : 'bg-red-500'}`} 
                                      style={{ width: `${q.correctRate}%` }}
                                   />
                                </div>
                                <span className={`text-sm font-bold ${q.correctRate > 70 ? 'text-emerald-600' : q.correctRate > 40 ? 'text-amber-600' : 'text-red-600'}`}>
                                  {q.correctRate.toFixed(0)}%
                                </span>
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             {q.isHard ? (
                               <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                                 <span className="material-symbols-outlined text-[14px]">warning</span>
                                 QUÁ KHÓ
                               </span>
                             ) : (
                               <span className="text-[10px] font-bold text-gray-400">BÌNH THƯỜNG</span>
                             )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 dark:bg-gray-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-8 py-2.5 rounded-xl bg-slate-200 dark:bg-gray-700 text-slate-700 dark:text-gray-300 font-bold text-sm hover:bg-slate-300 dark:hover:bg-gray-600 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
