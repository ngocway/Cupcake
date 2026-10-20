"use client"

import React, { useState } from "react"

export function AdminReminderTriggerButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)

  const handleRunReminders = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/cron/reminders/inactive-students", {
        method: "POST",
      })
      const data = await res.json()
      setResult(data)
      setShowModal(true)
    } catch (err: any) {
      alert("Lỗi kích hoạt gửi nhắc nhở: " + (err?.message || "Lỗi không xác định"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={handleRunReminders}
        disabled={loading}
        className="px-4 py-2.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 text-xs font-bold text-neutral-300 hover:text-white transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
        title="Quét và gửi email nhắc nhở học sinh vắng mặt ngay lập tức"
      >
        <span
          className={`material-symbols-outlined text-base text-amber-400 ${
            loading ? "animate-spin" : ""
          }`}
        >
          {loading ? "sync" : "forward_to_inbox"}
        </span>
        <span>{loading ? "Đang quét & gửi..." : "Quét & Gửi nhắc nhở (Test)"}</span>
      </button>

      {/* Result Modal */}
      {showModal && result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-400 text-2xl">
                  mark_email_read
                </span>
                <h3 className="text-base font-black text-white">
                  Kết quả quét nhắc nhở học sinh
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="size-8 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="bg-neutral-950 p-3 rounded-2xl border border-neutral-800">
                <p className="text-lg font-black text-white">
                  {result.report?.totalEnrollmentsChecked || 0}
                </p>
                <p className="text-[10px] font-bold text-neutral-500 uppercase mt-0.5">
                  Đã kiểm tra
                </p>
              </div>
              <div className="bg-neutral-950 p-3 rounded-2xl border border-neutral-800">
                <p className="text-lg font-black text-emerald-400">
                  {result.report?.remindersSent || 0}
                </p>
                <p className="text-[10px] font-bold text-neutral-500 uppercase mt-0.5">
                  Đã gửi Mail
                </p>
              </div>
              <div className="bg-neutral-950 p-3 rounded-2xl border border-neutral-800">
                <p className="text-lg font-black text-blue-400">
                  {result.report?.skippedActive || 0}
                </p>
                <p className="text-[10px] font-bold text-neutral-500 uppercase mt-0.5">
                  Đang học đều
                </p>
              </div>
              <div className="bg-neutral-950 p-3 rounded-2xl border border-neutral-800">
                <p className="text-lg font-black text-amber-400">
                  {result.report?.skippedCooldown || 0}
                </p>
                <p className="text-[10px] font-bold text-neutral-500 uppercase mt-0.5">
                  Chờ 7 ngày
                </p>
              </div>
            </div>

            {/* List of Sent Reminders */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                Chi tiết gửi ({result.report?.sentDetails?.length || 0})
              </p>
              <div className="max-h-56 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                {result.report?.sentDetails?.length === 0 ? (
                  <p className="text-xs text-neutral-500 text-center py-4 bg-neutral-950/60 rounded-2xl border border-neutral-800">
                    Không có học sinh nào cần gửi (học sinh đều đang học trong 3 ngày qua hoặc đã được gửi trong tuần).
                  </p>
                ) : (
                  result.report?.sentDetails?.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-neutral-950 p-3 rounded-2xl border border-neutral-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-white">{item.studentName}</p>
                        <p className="text-[11px] text-neutral-500">{item.studentEmail}</p>
                        <p className="text-[10px] text-blue-400 font-semibold mt-0.5">
                          Lớp: {item.className}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                          Vắng {item.inactiveDays} ngày
                        </span>
                        <p className="text-[10px] text-neutral-500 mt-1">
                          {item.emailStatus}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
