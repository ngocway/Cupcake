"use client";

import { useState, useEffect } from "react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

export default function PageTrafficAnalytics() {
  const [range, setRange] = useState<"4h" | "24h" | "7d" | "30d">("24h");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/analytics/traffic?range=${range}`)
      .then(res => res.json())
      .then(resData => {
        if (active) {
          setData(resData);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error("Failed to fetch traffic stats:", err);
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [range]);

  const renderTrend = (value: number) => {
    if (value > 0) {
      return (
        <span className="text-[10px] text-emerald-500 font-black flex items-center gap-0.5">
          <span className="material-symbols-outlined !text-[12px] font-black">arrow_upward</span>
          +{value}%
        </span>
      );
    } else if (value < 0) {
      return (
        <span className="text-[10px] text-red-500 font-black flex items-center gap-0.5">
          <span className="material-symbols-outlined !text-[12px] font-black">arrow_downward</span>
          {value}%
        </span>
      );
    }
    return (
      <span className="text-[10px] text-neutral-500 font-black flex items-center gap-0.5">
        0%
      </span>
    );
  };

  const getFriendlyDuration = (minutes: number) => {
    if (minutes < 1) {
      return `${Math.round(minutes * 60)}s`;
    }
    const mins = Math.floor(minutes);
    const secs = Math.round((minutes - mins) * 60);
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-neutral-900 border border-neutral-800 p-6 rounded-[2rem]">
        <div>
          <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-500">insights</span>
            Lưu lượng trang kiểu Ahrefs
          </h3>
          <p className="text-neutral-500 text-xs font-medium">Theo dõi thời gian thực lượt xem trang và số khách truy cập duy nhất.</p>
        </div>

        {/* Range selectors */}
        <div className="flex bg-neutral-950 p-1.5 rounded-xl border border-neutral-800/80">
          {(["4h", "24h", "7d", "30d"] as const).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                range === r
                  ? "bg-blue-500 text-white shadow-md shadow-blue-500/10"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              {r === "4h" ? "4 Giờ" : r === "24h" ? "24 Giờ" : r === "7d" ? "7 Ngày" : "30 Ngày"}
            </button>
          ))}
        </div>
      </div>

      {loading || !data ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-neutral-900/40 border border-neutral-800/80 rounded-3xl p-6 h-28" />
          ))}
        </div>
      ) : (
        <>
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Pageviews */}
            <div className="bg-neutral-900 border border-neutral-800/80 p-6 rounded-3xl flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">Tổng lượt xem (PV)</span>
                <div className="bg-blue-500/10 p-1.5 rounded-xl border border-blue-500/20 text-blue-500">
                  <span className="material-symbols-outlined !text-[16px]">visibility</span>
                </div>
              </div>
              <div className="mt-4 flex items-end justify-between">
                <span className="text-2xl font-black text-white">{data.stats.pageviews.toLocaleString()}</span>
                {renderTrend(data.changes.pageviews)}
              </div>
            </div>

            {/* Card 2: Unique Visitors */}
            <div className="bg-neutral-900 border border-neutral-800/80 p-6 rounded-3xl flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">Khách truy cập (UV)</span>
                <div className="bg-emerald-500/10 p-1.5 rounded-xl border border-emerald-500/20 text-emerald-500">
                  <span className="material-symbols-outlined !text-[16px]">group</span>
                </div>
              </div>
              <div className="mt-4 flex items-end justify-between">
                <span className="text-2xl font-black text-white">{data.stats.uniqueVisitors.toLocaleString()}</span>
                {renderTrend(data.changes.uniqueVisitors)}
              </div>
            </div>

            {/* Card 3: Avg Session Duration */}
            <div className="bg-neutral-900 border border-neutral-800/80 p-6 rounded-3xl flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">Thời gian trung bình</span>
                <div className="bg-purple-500/10 p-1.5 rounded-xl border border-purple-500/20 text-purple-500">
                  <span className="material-symbols-outlined !text-[16px]">timer</span>
                </div>
              </div>
              <div className="mt-4 flex items-end justify-between">
                <span className="text-2xl font-black text-white">{getFriendlyDuration(data.stats.avgSessionDuration)}</span>
                {renderTrend(data.changes.avgSessionDuration)}
              </div>
            </div>

            {/* Card 4: Bounce Rate */}
            <div className="bg-neutral-900 border border-neutral-800/80 p-6 rounded-3xl flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">Tỷ lệ thoát trang</span>
                <div className="bg-amber-500/10 p-1.5 rounded-xl border border-amber-500/20 text-amber-500">
                  <span className="material-symbols-outlined !text-[16px]">logout</span>
                </div>
              </div>
              <div className="mt-4 flex items-end justify-between">
                <span className="text-2xl font-black text-white">{data.stats.bounceRate}%</span>
                {/* Note: Lower bounce rate is better, so invert the green/red colors for bounceRate changes */}
                {data.changes.bounceRate > 0 ? (
                  <span className="text-[10px] text-red-500 font-black flex items-center gap-0.5">
                    <span className="material-symbols-outlined !text-[12px] font-black">arrow_upward</span>
                    +{data.changes.bounceRate}%
                  </span>
                ) : data.changes.bounceRate < 0 ? (
                  <span className="text-[10px] text-emerald-500 font-black flex items-center gap-0.5">
                    <span className="material-symbols-outlined !text-[12px] font-black">arrow_downward</span>
                    {data.changes.bounceRate}%
                  </span>
                ) : (
                  <span className="text-[10px] text-neutral-500 font-black">0%</span>
                )}
              </div>
            </div>
          </div>

          {/* Grid: Chart & Top Pages */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chart Area */}
            <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-[2.5rem] p-8">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-lg font-bold text-white">Xu hướng Lưu lượng</h3>
                  <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">So sánh Pageviews (PV) & Unique Visitors (UV)</p>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-[9px] text-neutral-400 font-black uppercase">Pageviews</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="text-[9px] text-neutral-400 font-black uppercase">Unique Visitors</span>
                  </div>
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.chartData}>
                    <defs>
                      <linearGradient id="colorPV" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorUV" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: "#525252", fontSize: 9, fontWeight: "bold"}}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: "#525252", fontSize: 9, fontWeight: "bold"}}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#171717", border: "1px solid #262626", borderRadius: "16px" }}
                      itemStyle={{ fontSize: "11px", fontWeight: "bold" }}
                    />
                    <Area type="monotone" dataKey="pageviews" stroke="#3b82f6" fillOpacity={1} fill="url(#colorPV)" strokeWidth={2.5} />
                    <Area type="monotone" dataKey="uniqueVisitors" stroke="#10b981" fillOpacity={1} fill="url(#colorUV)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Pages ranking */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-[2.5rem] p-8 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Trang truy cập nhiều nhất</h3>
                <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-6">Thứ hạng theo lượt xem trang gốc</p>
                <div className="space-y-5">
                  {data.topPages.length === 0 ? (
                    <div className="text-center py-10 text-neutral-500 font-bold text-sm">Chưa có dữ liệu truy cập nào.</div>
                  ) : (
                    data.topPages.map((page: any, i: number) => (
                      <div key={page.path} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] font-black text-neutral-600">#{i + 1}</span>
                            <span className="font-bold text-neutral-200 truncate" title={page.path}>{page.path}</span>
                          </div>
                          <span className="font-black text-neutral-400 shrink-0 ml-2">{page.pageviews.toLocaleString()} PV</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full bg-neutral-950 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-blue-500 h-1.5 rounded-full transition-all duration-500" 
                            style={{ width: `${Math.max(page.share, 2)}%` }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
