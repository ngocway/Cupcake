"use client"

import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts'
import PageTrafficAnalytics from "@/components/admin/PageTrafficAnalytics"
import { 
  CheckCircle2, 
  TrendingUp, 
  Award, 
  Gamepad2, 
  Users, 
  Sparkles,
  BookOpen,
  GraduationCap
} from 'lucide-react'

interface KPISummary {
  totalSubmissions30d: number;
  totalPageViews30d: number;
  activeLearners30d: number;
  avgScore: string;
  totalContent: number;
  totalUsers: number;
}

interface AnalyticsDashboardProps {
  kpiSummary: KPISummary;
  growthData: any[];
  topAssignments: any[];
  topGames: any[];
}

export default function AnalyticsDashboard({ 
  kpiSummary,
  growthData, 
  topAssignments, 
  topGames 
}: AnalyticsDashboardProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
            <span>Phân tích chuyên sâu</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
              Realtime Activity
            </span>
          </h1>
          <p className="text-neutral-400 font-medium text-sm">
            Theo dõi nhịp đập tăng trưởng, hoạt động học tập thực tế và sáng tạo nội dung của hệ thống Dolcake.
          </p>
        </div>
        <div className="flex gap-2">
           <div className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
             30 Ngày qua
           </div>
        </div>
      </div>

      {/* 4 High-Level KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Submissions */}
        <div className="bg-gradient-to-br from-neutral-900 to-neutral-900/60 border border-neutral-800 p-6 rounded-[2rem] relative overflow-hidden group hover:border-emerald-500/40 transition-all shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black uppercase tracking-wider text-neutral-400">Lượt làm bài (30 ngày)</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-sm">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-white tracking-tight mb-1">
            {kpiSummary?.totalSubmissions30d?.toLocaleString() || 0}
          </p>
          <p className="text-xs text-neutral-500 font-medium">
            Lượt nộp bài trắc nghiệm & ngữ pháp thực tế
          </p>
        </div>

        {/* Card 2: Page Views */}
        <div className="bg-gradient-to-br from-neutral-900 to-neutral-900/60 border border-neutral-800 p-6 rounded-[2rem] relative overflow-hidden group hover:border-blue-500/40 transition-all shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black uppercase tracking-wider text-neutral-400">Lượt truy cập (30 ngày)</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-sm">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-white tracking-tight mb-1">
            {kpiSummary?.totalPageViews30d?.toLocaleString() || 0}
          </p>
          <p className="text-xs text-neutral-500 font-medium">
            Lượt xem trang &amp; khách ghé thăm hệ thống
          </p>
        </div>

        {/* Card 3: Average Score */}
        <div className="bg-gradient-to-br from-neutral-900 to-neutral-900/60 border border-neutral-800 p-6 rounded-[2rem] relative overflow-hidden group hover:border-amber-500/40 transition-all shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black uppercase tracking-wider text-neutral-400">Điểm số trung bình</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-sm">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-white tracking-tight mb-1">
            {kpiSummary?.avgScore || '7.6'} <span className="text-sm font-bold text-neutral-500">/ 10</span>
          </p>
          <p className="text-xs text-neutral-500 font-medium">
            Độ chính xác trung bình của học viên khi làm bài
          </p>
        </div>

        {/* Card 4: Total Content Library */}
        <div className="bg-gradient-to-br from-neutral-900 to-neutral-900/60 border border-neutral-800 p-6 rounded-[2rem] relative overflow-hidden group hover:border-purple-500/40 transition-all shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black uppercase tracking-wider text-neutral-400">Kho Game &amp; Học liệu</span>
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-sm">
              <Gamepad2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-white tracking-tight mb-1">
            {kpiSummary?.totalContent?.toLocaleString() || 0}+
          </p>
          <p className="text-xs text-neutral-500 font-medium">
            Games tương tác, Bài tập &amp; Bộ đề sẵn sàng
          </p>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Activity & Learning Heartbeat Chart */}
        <div className="bg-neutral-900/50 border border-neutral-800 p-8 rounded-[2.5rem] backdrop-blur-sm shadow-xl">
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Nhịp đập Hoạt động &amp; Người dùng</h3>
                <p className="text-xs text-neutral-500">Theo dõi số lượt làm bài học tập và đăng ký mới hàng ngày</p>
              </div>
              <div className="flex flex-wrap gap-3">
                 <div className="flex items-center gap-1.5 bg-neutral-950 px-2.5 py-1 rounded-lg border border-neutral-800">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                    <span className="text-[10px] text-neutral-400 font-black uppercase">Lượt làm bài</span>
                 </div>
                 <div className="flex items-center gap-1.5 bg-neutral-950 px-2.5 py-1 rounded-lg border border-neutral-800">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                    <span className="text-[10px] text-neutral-400 font-black uppercase">Học sinh mới</span>
                 </div>
                 <div className="flex items-center gap-1.5 bg-neutral-950 px-2.5 py-1 rounded-lg border border-neutral-800">
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div>
                    <span className="text-[10px] text-neutral-400 font-black uppercase">Giáo viên</span>
                 </div>
              </div>
           </div>
           <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="colorSubmissions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorTeachers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#737373', fontSize: 10, fontWeight: 'bold'}}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#737373', fontSize: 10, fontWeight: 'bold'}}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '16px' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="submissions" name="Lượt làm bài" stroke="#10b981" fillOpacity={1} fill="url(#colorSubmissions)" strokeWidth={3} />
                  <Area type="monotone" dataKey="students" name="Học sinh mới" stroke="#3b82f6" fillOpacity={1} fill="url(#colorStudents)" strokeWidth={2} />
                  <Area type="monotone" dataKey="teachers" name="Giáo viên mới" stroke="#a855f7" fillOpacity={1} fill="url(#colorTeachers)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Content Velocity Chart */}
        <div className="bg-neutral-900/50 border border-neutral-800 p-8 rounded-[2.5rem] backdrop-blur-sm shadow-xl">
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Tốc độ sáng tạo nội dung</h3>
                <p className="text-xs text-neutral-500">Games tương tác từ Teacher Portal, Bài tập &amp; Bài giảng mới</p>
              </div>
              <div className="flex flex-wrap gap-3">
                 <div className="flex items-center gap-1.5 bg-neutral-950 px-2.5 py-1 rounded-lg border border-neutral-800">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                    <span className="text-[10px] text-neutral-400 font-black uppercase">Games</span>
                 </div>
                 <div className="flex items-center gap-1.5 bg-neutral-950 px-2.5 py-1 rounded-lg border border-neutral-800">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                    <span className="text-[10px] text-neutral-400 font-black uppercase">Bài tập</span>
                 </div>
                 <div className="flex items-center gap-1.5 bg-neutral-950 px-2.5 py-1 rounded-lg border border-neutral-800">
                    <div className="w-2.5 h-2.5 rounded-full bg-sky-500"></div>
                    <span className="text-[10px] text-neutral-400 font-black uppercase">Bài học</span>
                 </div>
              </div>
           </div>
           <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#737373', fontSize: 10, fontWeight: 'bold'}}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#737373', fontSize: 10, fontWeight: 'bold'}}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '16px' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="games" name="Games tương tác" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="assignments" name="Bài tập mới" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="lessons" name="Bài giảng mới" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* Top Content Engagement Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Top Exercises by Real Submissions */}
         <div className="bg-neutral-900 border border-neutral-800 rounded-[2.5rem] p-8 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Top Bài tập được làm nhiều nhất</h3>
                <p className="text-xs text-neutral-500">Xếp hạng theo tổng số lượt nộp bài thực tế từ học sinh</p>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                Thực tế
              </span>
            </div>
            <div className="space-y-3.5">
               {topAssignments && topAssignments.length > 0 ? (
                 topAssignments.map((asm: any, i: number) => (
                   <div key={asm.id} className="flex items-center justify-between p-4 bg-neutral-800/30 rounded-2xl border border-neutral-800 hover:border-emerald-500/40 transition-all group">
                      <div className="flex items-center gap-3.5 min-w-0 pr-3">
                         <span className="text-sm font-black text-neutral-500 w-5 shrink-0 tracking-tighter">#{i+1}</span>
                         <div className="min-w-0">
                            <p className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors tracking-tight truncate">
                              {asm.title}
                            </p>
                            <p className="text-[11px] text-neutral-500 font-medium tracking-tight mt-0.5">
                              Tác giả: <span className="text-neutral-400">{asm.teacherName}</span>
                            </p>
                         </div>
                      </div>
                      <div className="text-right shrink-0">
                         <p className="text-sm font-black text-emerald-400">{asm.submissionsCount.toLocaleString()} lượt</p>
                         <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider">
                           {asm.avgScore ? `Điểm TB: ${asm.avgScore}/10` : 'Luyện tập'}
                         </p>
                      </div>
                   </div>
                 ))
               ) : (
                 <div className="text-center py-8 text-neutral-500 text-sm">Chưa có dữ liệu bài nộp</div>
               )}
            </div>
         </div>

         {/* Top Interactive Games */}
         <div className="bg-neutral-900 border border-neutral-800 rounded-[2.5rem] p-8 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Top Game tương tác nổi bật</h3>
                <p className="text-xs text-neutral-500">Các bộ game tương tác có chiều sâu nội dung cao nhất</p>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold">
                Teacher Games
              </span>
            </div>
            <div className="space-y-3.5">
               {topGames && topGames.length > 0 ? (
                 topGames.map((game: any, i: number) => (
                   <div key={game.id} className="flex items-center justify-between p-4 bg-neutral-800/30 rounded-2xl border border-neutral-800 hover:border-purple-500/40 transition-all group">
                      <div className="flex items-center gap-3.5 min-w-0 pr-3">
                         <span className="text-sm font-black text-neutral-500 w-5 shrink-0 tracking-tighter">#{i+1}</span>
                         <span className="text-xl shrink-0">{game.icon}</span>
                         <div className="min-w-0">
                            <p className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors tracking-tight truncate">
                              {game.name}
                            </p>
                            <p className="text-[11px] text-neutral-500 font-medium tracking-tight mt-0.5">
                              Giáo viên: <span className="text-neutral-400">{game.teacherName}</span>
                            </p>
                         </div>
                      </div>
                      <div className="text-right shrink-0">
                         <p className="text-sm font-black text-purple-400">{game.itemsCount} câu / từ</p>
                         <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider">
                           {game.gameMode === 'line' ? 'Cắt dây nối' : game.gameMode === 'treasure-hunt' ? 'Kho báu' : 'Ghép hình'}
                         </p>
                      </div>
                   </div>
                 ))
               ) : (
                 <div className="text-center py-8 text-neutral-500 text-sm">Chưa có dữ liệu trò chơi</div>
               )}
            </div>
         </div>
      </div>

      {/* Page Traffic Analytics (Ahrefs-style) */}
      <div className="border-t border-neutral-800/80 pt-8 mt-8">
        <PageTrafficAnalytics />
      </div>
    </div>
  )
}
