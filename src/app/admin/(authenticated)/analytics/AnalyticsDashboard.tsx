"use client"

import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts'

export default function AnalyticsDashboard({ growthData, topLessons, topAssignments }: any) {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-white mb-2">Phân tích chuyên sâu</h1>
          <p className="text-neutral-500 font-medium">Theo dõi nhịp đập tăng trưởng của hệ thống Cupcakes.</p>
        </div>
        <div className="flex gap-2">
           <div className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-400 text-xs font-bold uppercase tracking-widest">30 Ngày qua</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Growth Chart */}
        <div className="bg-neutral-900/50 border border-neutral-800 p-8 rounded-[2.5rem] backdrop-blur-sm">
           <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold text-white">Tăng trưởng Người dùng</h3>
              <div className="flex gap-4">
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-[10px] text-neutral-500 font-black uppercase">Students</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                    <span className="text-[10px] text-neutral-500 font-black uppercase">Teachers</span>
                 </div>
              </div>
           </div>
           <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorTeachers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#525252', fontSize: 10, fontWeight: 'bold'}}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#525252', fontSize: 10, fontWeight: 'bold'}}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '16px' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="students" stroke="#2563eb" fillOpacity={1} fill="url(#colorStudents)" strokeWidth={3} />
                  <Area type="monotone" dataKey="teachers" stroke="#6366f1" fillOpacity={1} fill="url(#colorTeachers)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Content Velocity Chart */}
        <div className="bg-neutral-900/50 border border-neutral-800 p-8 rounded-[2.5rem] backdrop-blur-sm">
           <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold text-white">Tốc độ sáng tạo nội dung</h3>
              <div className="flex gap-4">
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="text-[10px] text-neutral-500 font-black uppercase">Lessons</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <span className="text-[10px] text-neutral-500 font-black uppercase">Assignments</span>
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
                    tick={{fill: '#525252', fontSize: 10, fontWeight: 'bold'}}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#525252', fontSize: 10, fontWeight: 'bold'}}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '16px' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="lessons" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="assignments" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Top Content (Lessons) */}
         <div className="bg-neutral-900 border border-neutral-800 rounded-[2.5rem] p-8">
            <h3 className="text-xl font-bold text-white mb-6">Bài học thu hút nhất</h3>
            <div className="space-y-4">
               {topLessons.map((lesson: any, i: number) => (
                 <div key={lesson.id} className="flex items-center justify-between p-4 bg-neutral-800/30 rounded-2xl border border-neutral-800 hover:border-blue-500/30 transition-all group">
                    <div className="flex items-center gap-4">
                       <span className="text-xs font-black text-neutral-700 w-4 tracking-tighter">#{i+1}</span>
                       <div>
                          <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">{lesson.title}</p>
                          <p className="text-[10px] text-neutral-500 font-medium tracking-tight">Tác giả: <span className="text-neutral-400">{lesson.teacher.name}</span></p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-black text-blue-500">{lesson.viewsCount.toLocaleString()}</p>
                       <p className="text-[8px] text-neutral-600 font-black uppercase tracking-widest">Views</p>
                    </div>
                 </div>
               ))}
            </div>
         </div>

         {/* Top Content (Assignments) */}
         <div className="bg-neutral-900 border border-neutral-800 rounded-[2.5rem] p-8">
            <h3 className="text-xl font-bold text-white mb-6">Top Bài tập & Đề thi</h3>
            <div className="space-y-4">
               {topAssignments.map((asm: any, i: number) => (
                 <div key={asm.id} className="flex items-center justify-between p-4 bg-neutral-800/30 rounded-2xl border border-neutral-800 hover:border-emerald-500/30 transition-all group">
                    <div className="flex items-center gap-4">
                       <span className="text-xs font-black text-neutral-700 w-4 tracking-tighter">#{i+1}</span>
                       <div>
                          <p className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{asm.title}</p>
                          <p className="text-[10px] text-neutral-500 font-medium tracking-tight">Tác giả: <span className="text-neutral-400">{asm.teacher.name}</span></p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-black text-emerald-500">{asm.viewCount.toLocaleString()}</p>
                       <p className="text-[8px] text-neutral-600 font-black uppercase tracking-widest">Visibility</p>
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  )
}
