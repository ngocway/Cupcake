"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';

export default function AssignmentSharePage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;
  const assignmentId = params.assignmentId as string;
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/run/${assignmentId}` : '';

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Left Sidebar: Exercise Details */}
      <aside className="w-full md:w-80 flex flex-col gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col gap-5 sticky top-24">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <Link className="text-gray-500 text-xs font-semibold uppercase tracking-wider hover:text-primary transition-colors" href={`/teacher/classes/${classId}`}>
                Lớp học
              </Link>
              <span className="text-gray-400">/</span>
              <span className="text-primary text-xs font-semibold uppercase tracking-wider">Chi tiết bài tập</span>
            </div>
            <h1 className="text-[#111418] dark:text-white text-xl font-bold leading-tight">Kiểm tra Toán Chương 1</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Hệ thức lượng trong tam giác vuông</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-background-light dark:bg-gray-800 p-3 rounded-lg">
              <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">Số câu hỏi</p>
              <p className="text-lg font-bold text-primary">20</p>
            </div>
            <div className="bg-background-light dark:bg-gray-800 p-3 rounded-lg">
              <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">Thời gian</p>
              <p className="text-lg font-bold text-primary">40 Phút</p>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/10 text-primary border border-primary/20 cursor-default">
              <span className="material-symbols-outlined text-xl">info</span>
              <p className="text-sm font-semibold leading-normal">Chi tiết bài tập</p>
            </div>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors">
              <span className="material-symbols-outlined text-xl">visibility</span>
              <p className="text-sm font-medium leading-normal">Xem trước câu hỏi</p>
            </div>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors">
              <span className="material-symbols-outlined text-xl">settings</span>
              <p className="text-sm font-medium leading-normal">Cài đặt bài tập</p>
            </div>
          </div>
          
          <div className="mt-4">
            <p className="text-sm font-bold mb-3 text-gray-800 dark:text-gray-200">Bản xem trước</p>
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-950 aspect-[3/4] flex flex-col">
              <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <div className="h-2 w-2/3 bg-gray-200 dark:bg-gray-800 rounded mb-2"></div>
                <div className="h-2 w-1/2 bg-gray-100 dark:bg-gray-800 rounded"></div>
              </div>
              <div className="p-4 flex flex-col gap-4">
                <div className="space-y-2">
                  <div className="h-3 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>
                  <div className="h-3 w-4/5 bg-gray-200 dark:bg-gray-800 rounded"></div>
                </div>
                <div className="space-y-2 pl-4">
                  <div className="flex gap-2 items-center"><div className="size-3 rounded-full border border-gray-300"></div><div className="h-2 w-1/2 bg-gray-100 dark:bg-gray-800 rounded"></div></div>
                  <div className="flex gap-2 items-center"><div className="size-3 rounded-full border border-gray-300"></div><div className="h-2 w-1/3 bg-gray-100 dark:bg-gray-800 rounded"></div></div>
                  <div className="flex gap-2 items-center"><div className="size-3 rounded-full border border-gray-300"></div><div className="h-2 w-2/3 bg-gray-100 dark:bg-gray-800 rounded"></div></div>
                </div>
              </div>
              <div className="mt-auto p-3 text-center">
                <span className="text-[10px] text-gray-400 italic">Trang 1 / 4</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content: Sharing & Results */}
      <div className="flex-1 flex flex-col gap-8">
        {/* Page Heading */}
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-black tracking-tight text-[#111418] dark:text-white">Chia sẻ & Kết quả học sinh</h2>
          <p className="text-gray-500 dark:text-gray-400">Quản lý việc giao bài và theo dõi tiến độ nộp bài của học sinh theo thời gian thực.</p>
        </div>
        
        {/* Sharing Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary">share</span>
                <h3 className="text-lg font-bold">Chia sẻ link bài tập</h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Gửi link này cho học sinh để bắt đầu làm bài. Họ có thể truy cập từ bất kỳ thiết bị nào.</p>
              
              <div className="flex gap-2">
                <div className="flex-1 h-12 flex items-center px-4 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{shareUrl}</p>
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    alert('Đã sao chép link thành công!');
                  }}
                  title="Sao chép link"
                  className="size-12 bg-primary text-white rounded-lg flex items-center justify-center hover:bg-primary/90 transition-all shrink-0 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[20px]">content_copy</span>
                </button>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  <div className="size-8 rounded-full border-2 border-white dark:border-gray-900 bg-gray-200 bg-cover" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCjkthV1wHtrU0rpYYVc9Q24pNXaFixGuGGrPKCa434ZdwmgK7uqVUg9njUEyFxDZ5BG7-vPKI9sOftGcHiXJQaeRiUPcS95KVwWsmgTP8v-g1CQkgBc2ytlg7oESaisXhNaqMJYYCchtmyInXgvjGM4GEf9qM0cgAJvcpnYwfg8xVPSmMeXEp_fyxk6Tr7iRjenAmWergULIK3U_qOTiJ1x3yzOVwiKaOMlJwYKEynmUzasmcH47f3ZyHQ1Vi07nsJwCmy5Hmj0V5J')" }}></div>
                  <div className="size-8 rounded-full border-2 border-white dark:border-gray-900 bg-gray-200 bg-cover" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAiw5KqxxWLA6bXj-e44wXpFwLN2jaiWnEM7OQC2wshKVSwncltb3ar-xsPWoyv9rlEAcgAj316HSiR_B8YAfTgWkWOu_W_hZmb2ClcuDS6YLzKTlLKvG_yeBntXnccp6S2a02F5WN0M8eDVBbyk9T56sqhflGiepB9eMkLt9_9Z2zzdaL98kIXFu9lercTA7AAj6y_hRwTDnbEFMYd-8tAc9VWGM5DNlNNL9eX7j2NbDSPdVVtl_AReiAIEvijn6Q-JW94ZCBdzyrm')" }}></div>
                  <div className="size-8 rounded-full border-2 border-white dark:border-gray-900 bg-gray-200 bg-cover" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDXA8Cu6nd5tILbAHv6MCfqvR_u6c-WSWR4oVZe5YX2E8uV40KTv40rQMrHUe1et6YwTeAAknfiikkS_jK1zuIrxFVW6-87ckAYRj2-cSDKHmQqt6ypagwiWvBabt3IPTihCXZrp19e-OsICUIsZ4Fv_zNKCC-5CtS4bteOwHXonoezD-_oNAEzc-zNWIb4meZcKPeaZOyx9WESHnAh2tWuKzj7T-g2nqqETeEHfpaduuhShTxVPG-YqLrszaF0eACwARy4cBryNosw')" }}></div>
                  <div className="size-8 rounded-full border-2 border-white dark:border-gray-900 bg-gray-400 flex items-center justify-center text-[10px] text-white font-bold">+12</div>
                </div>
                <p className="text-xs text-gray-500 font-medium">15 học sinh đang truy cập link</p>
              </div>
              <span className="inline-flex items-center px-2 py-1 rounded bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider">Hoạt động</span>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center gap-4">
            <div className="p-3 bg-white rounded-lg border border-gray-200 flex items-center justify-center" id="qr-code-container">
              <QRCodeSVG value={shareUrl} size={128} className="rounded-sm" />
            </div>
            <div className="text-center">
              <h4 className="font-bold text-sm">Quét mã QR</h4>
              <p className="text-xs text-gray-500 mt-1">Dành cho thiết bị di động</p>
            </div>
            <button 
              onClick={() => {
                const svg = document.querySelector('#qr-code-container svg');
                if (svg) {
                  const svgData = new XMLSerializer().serializeToString(svg);
                  const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `qrcode-assignment-${assignmentId}.svg`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }
              }}
              className="w-full py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">download</span>
              Tải mã QR
            </button>
          </div>
        </section>
        
        {/* Results Table */}
        <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-bold">Kết quả học sinh</h3>
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-primary"></span>
                <p className="text-sm text-gray-500 font-medium">Đã nộp: <span className="text-primary font-bold">25/30</span></p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <span className="material-symbols-outlined text-gray-500">filter_list</span>
              </button>
              <button className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-bold hover:bg-gray-200 hover:dark:bg-gray-700 transition-colors">Xuất File Excel</button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Họ và tên</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Thời gian nộp</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Điểm số</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">NL</div>
                      <p className="font-semibold text-sm">Nguyễn Thành Long</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">10:45 - 24/05/2024</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-bold">18/20 (9.0)</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-primary text-sm font-bold hover:underline">Xem chi tiết</button>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">TH</div>
                      <p className="font-semibold text-sm">Trần Minh Hiếu</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">10:42 - 24/05/2024</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-bold">20/20 (10.0)</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-primary text-sm font-bold hover:underline">Xem chi tiết</button>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">PV</div>
                      <p className="font-semibold text-sm">Phạm Quốc Việt</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">10:39 - 24/05/2024</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500 text-xs font-bold">15/20 (7.5)</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-primary text-sm font-bold hover:underline">Xem chi tiết</button>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">LA</div>
                      <p className="font-semibold text-sm">Lê Thúy An</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">10:35 - 24/05/2024</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs font-bold">8/20 (4.0)</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-primary text-sm font-bold hover:underline">Xem chi tiết</button>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">DT</div>
                      <p className="font-semibold text-sm">Đỗ Anh Tuấn</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">10:30 - 24/05/2024</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-bold">17/20 (8.5)</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-primary text-sm font-bold hover:underline">Xem chi tiết</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex items-center justify-center">
            <nav className="flex items-center gap-2">
              <button className="size-10 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <span className="material-symbols-outlined text-lg">chevron_left</span>
              </button>
              <button className="size-10 flex items-center justify-center rounded-lg bg-primary text-white font-bold">1</button>
              <button className="size-10 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">2</button>
              <button className="size-10 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">3</button>
              <span className="px-2 text-gray-400">...</span>
              <button className="size-10 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">5</button>
              <button className="size-10 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </button>
            </nav>
          </div>
        </section>
      </div>
    </div>
  );
}
