import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import Image from "next/image"
import Link from "next/link"

export default async function StudentDashboardPage() {
  const session = await auth()
  
  // Only students or teachers acting as students (for testing) should reach here normally
  const userId = session?.user?.id

  // 1. Fetch Overview Data
  // Let's count pending tasks
  const enrollments = await prisma.classEnrollment.findMany({
    where: { studentId: userId },
    include: { class: { include: { assignments: { include: { assignment: true } } } } }
  })
  
  const assignedToMe = enrollments.flatMap((e: any) => e.class.assignments.map((a: any) => ({
    ...a.assignment,
    classId: e.classId,
    className: e.class.name,
    assignedAt: a.assignedAt,
    dueDate: a.dueDate
  })))

  // --- Auto Notification Logic: Due Reminders ---
  const now = new Date();
  const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  
  const upcomingAssignments = assignedToMe.filter((a: any) => 
    a.dueDate && a.dueDate > now && a.dueDate < oneDayFromNow
  );

  for (const assi of upcomingAssignments) {
    // Check if notification already exists using raw query since types might be missing
    const results: any = await prisma.$queryRawUnsafe(
      `SELECT id FROM Notification WHERE userId = ? AND type = 'DUE_REMINDER' AND message LIKE ?`,
      userId, `%${assi.title}%`
    );

    if (results.length === 0) {
      const { createNotification } = await import('@/actions/notification-actions');
      await createNotification(
        userId!,
        'DUE_REMINDER',
        'Sắp hết hạn nộp bài',
        `Bài tập "${assi.title}" trong lớp ${assi.className} sẽ kết thúc vào ${assi.dueDate?.toLocaleString('vi-VN')}.`,
        `/student/assignments/${assi.id}/run`
      );
    }
  }
  // --- End Auto Notification Logic ---

  const pendingTasks = assignedToMe.filter((a: any) => new Date() < (a.dueDate || new Date(9999, 11, 31)))
  
  // High scores (say, score > 80)
  const submissions = await prisma.submission.findMany({
    where: { studentId: userId }
  })
  const highScores = submissions.filter((s: any) => (s.score || 0) >= 80).length

  // Recent activity
  const recentActivity = await prisma.submission.findMany({
    where: { studentId: userId },
    orderBy: { submittedAt: 'desc' },
    take: 3,
    include: { assignment: true }
  })
  
  // Fake streak
  const streak = 15

  // Daily Mission (pick the first pending task)
  const dailyMission = pendingTasks[0]

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      {/* 1. Overview Section */}
      <section className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2">
              Welcome back, {session?.user?.name?.split(' ')[0] || "Student"}!
            </h1>
            <p className="text-on-surface-variant text-lg">
              You've crushed <span className="text-primary font-bold">80%</span> of your goals this week! Keep the momentum going.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-surface-container-low p-2 rounded-2xl">
            <div className="flex -space-x-2">
              <img
                alt="friend 1"
                className="w-8 h-8 rounded-full border-2 border-white"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuArdbulwq6CNd2Qt3Ep3jnR11Ew8R8PnoZUBC0tPZFhuaZPhcqwWKvaj-NIcbUgxvzet-GbHwJZj_pAnYXh0lD2na1DAiNjwR3YEuyvApNV63_XIwdNOQd8wvrV8gyR9hLNenCkISnXWrOmIZUnx2kO9Kv1lSNFw-zeY-pOo5yQPjdhrrGsO-AStHukbR6C13i5QWAh74pX5VF2VXd2zzua-tGRtuvQT1rTjb6UBWVoncOGXwz4amxm--0QLFWOXeBXnlBr1TNVO07_"
              />
              <img
                alt="friend 2"
                className="w-8 h-8 rounded-full border-2 border-white"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCe0G28j43msQ2iWGuUSCW8TWXnfu3XvaDnLMS0jyai-DUnfkgC7gMxzHafBTeM5-olWcWzjOdXnVJzsD2ARJsYnS4s1kP1ogytqEPnxPf52Aq0eChWxl0m_2qhkfJ9-ONGmN5YhJ4Ds-MYAtPqw9sVxiSfnCABZXbkLOfu_1trEo739nCzW7VIFo6UiT36UCO_ytAeltuqHGfKehhdQQ4h4nfgakNlJeJpFyCYJS7ul7n9T7BIqcf73vsu0mVospIMY0zKSD3gZKZq"
              />
              <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-[10px] font-bold text-on-primary-fixed border-2 border-white">
                +5
              </div>
            </div>
            <span className="text-xs font-label font-semibold text-on-surface-variant px-2">Learning Friends Online</span>
          </div>
        </div>

        {/* Bento Grid Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-container-low p-8 rounded-3xl flex flex-col justify-between transition-transform hover:scale-[1.02] duration-300">
            <div className="flex justify-between items-start">
              <span className="material-symbols-outlined text-primary-container text-4xl">pending_actions</span>
              <span className="text-primary font-bold text-xs bg-primary-fixed px-3 py-1 rounded-full uppercase tracking-tighter">Due soon</span>
            </div>
            <div>
              <h4 className="text-5xl font-black mt-4">{pendingTasks.length}</h4>
              <p className="font-label text-on-surface-variant font-medium">Pending Tasks</p>
            </div>
          </div>
          <div className="bg-secondary-container/20 p-8 rounded-3xl flex flex-col justify-between transition-transform hover:scale-[1.02] duration-300 border border-secondary-container/30">
            <div className="flex justify-between items-start">
              <span className="material-symbols-outlined text-secondary text-4xl">workspace_premium</span>
              <span className="text-secondary font-bold text-xs bg-secondary-container px-3 py-1 rounded-full uppercase tracking-tighter">Academic</span>
            </div>
            <div>
              <h4 className="text-5xl font-black mt-4">{highScores}</h4>
              <p className="font-label text-on-surface-variant font-medium">High Scores</p>
            </div>
          </div>
          <div className="bg-tertiary-fixed/30 p-8 rounded-3xl flex flex-col justify-between transition-transform hover:scale-[1.02] duration-300 border border-tertiary-fixed/30">
            <div className="flex justify-between items-start">
              <span className="material-symbols-outlined text-tertiary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
              <span className="text-tertiary font-bold text-xs bg-tertiary-fixed px-3 py-1 rounded-full uppercase tracking-tighter">Streak</span>
            </div>
            <div>
              <h4 className="text-5xl font-black mt-4">{streak}</h4>
              <p className="font-label text-on-surface-variant font-medium">Day Learning Streak</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* 2. Assignments Section (2/3 width) */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              Assignments
              <span className="w-2 h-2 bg-primary rounded-full"></span>
            </h2>
          </div>

          {/* Daily Mission Card */}
          {dailyMission ? (
            <div className="relative overflow-hidden bg-surface-container-lowest border border-outline-variant/20 p-8 rounded-[2rem] shadow-sm">
              <div className="absolute top-0 right-0 p-8">
                <span className="bg-error text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">Priority 1</span>
              </div>
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="w-full md:w-48 h-48 rounded-2xl bg-surface-container overflow-hidden shrink-0">
                  <img
                    alt="Literature assignment"
                    className="w-full h-full object-cover"
                    src={dailyMission.thumbnail || "https://lh3.googleusercontent.com/aida-public/AB6AXuBZpFTb6V2i5-ctnRKi99pHGa8_RZKgwygm1KoEYjkRlDW3nra2JdBQ_0U4LlGqoXFbsnl3uXtg5cuWRSOQcs99CHFqPSfk4Oth6dSLVhHF8t0KfK1YLUEpfGAthSz0qAaIa0xGIp5J8JVWaGZShoUB_xnNAqHCZOdiLlVs5rIwCcbv4c6QFFMQYQRqaKxeLwXfD41T9N9fEgIP47cJwjQA6iWzPLHjvB-4jLAwiBv_yLIu9IEzgsOB34IatSx1x6Vs0DMXp2fw3Qia"}
                  />
                </div>
                <div className="flex-1 space-y-4">
                  <span className="font-label text-xs font-bold text-primary uppercase tracking-widest">Daily Mission</span>
                  <h3 className="text-2xl font-bold">{dailyMission.title}</h3>
                  <div className="flex flex-wrap gap-4 items-center text-on-surface-variant text-sm font-medium">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-lg">calendar_today</span>
                      {dailyMission.dueDate ? `Deadline: ${dailyMission.dueDate.toLocaleDateString()}` : "No deadline"}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-lg">class</span>
                      {dailyMission.className}
                    </div>
                  </div>
                  <Link href={`/student/assignments/${dailyMission.id}/run`}>
                    <button className="bg-on-surface text-white px-8 py-3 rounded-full font-label text-sm font-bold hover:bg-primary transition-colors mt-2">
                      Resume Mission
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
             <div className="p-8 text-center bg-surface-container-low rounded-3xl">
               <p className="text-on-surface-variant">No pending assignments at the moment. Great job!</p>
             </div>
          )}

          {/* Categorized Tabs */}
          <div className="space-y-6">
            <div className="flex gap-8 border-b border-outline-variant/30 px-2 overflow-x-auto">
              <button className="pb-4 text-primary font-bold border-b-2 border-primary text-sm font-label whitespace-nowrap">In Progress ({pendingTasks.length})</button>
              <button className="pb-4 text-outline font-medium hover:text-on-surface transition-colors text-sm font-label whitespace-nowrap">Completed ({submissions.length})</button>
            </div>
            
            <div className="space-y-4">
              {pendingTasks.slice(1, 4).map((task: any) => (
                <Link href={`/student/assignments/${task.id}/run`} key={task.id} className="flex items-center justify-between p-6 bg-surface-container-low rounded-2xl hover:bg-surface-container transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm">
                      <span className="material-symbols-outlined">library_books</span>
                    </div>
                    <div>
                      <h4 className="font-bold group-hover:text-primary transition-colors">{task.title}</h4>
                      <p className="text-xs text-on-surface-variant font-label mt-0.5">{task.className} • {task.dueDate ? `Due ${task.dueDate.toLocaleDateString()}` : 'No due date'}</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-outline group-hover:translate-x-1 transition-transform">chevron_right</span>
                </Link>
              ))}
              
              {pendingTasks.length <= 1 && (
                <p className="text-sm text-on-surface-variant px-4">You have caught up with all tasks!</p>
              )}
            </div>
          </div>
        </div>

        {/* 3 & 4. Sidebar Growth & Feed (1/3 width) */}
        <div className="space-y-12">
          {/* Classes & Feed */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold tracking-tight">My Classes</h3>
              <button className="text-primary font-bold text-xs uppercase tracking-widest flex items-center gap-1 hover:underline">
                <span className="material-symbols-outlined text-sm">add</span> Join
              </button>
            </div>
            <div className="space-y-4">
              {enrollments.length > 0 ? enrollments.map((e: any) => (
                <div key={e.classId} className="p-5 bg-surface-container rounded-2xl flex items-center gap-4 border border-transparent hover:border-primary/20 transition-all cursor-pointer">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center font-bold text-primary shadow-sm shrink-0">
                    {e.class.name.substring(0,2)}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm">{e.class.name}</p>
                    <p className="text-xs text-on-surface-variant">{e.class.description || 'Active Class'}</p>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_rgba(0,110,47,0.4)]"></span>
                </div>
              )) : (
                <p className="text-sm text-on-surface-variant">You haven't joined any classes yet.</p>
              )}
            </div>
          </div>

          {/* Growth Widgets: Vocabulary Vault */}
          <div className="bg-surface-container-low rounded-[2rem] p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>book</span>
                Vocabulary Vault
              </h3>
              <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-md font-bold uppercase">New</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {["Dilemma", "Incorporate", "Resilient", "Eloquent"].map((word, i) => (
                <div key={i} className="px-4 py-2 bg-white border border-outline-variant/30 rounded-xl hover:bg-primary-fixed transition-colors cursor-pointer group">
                  <p className="text-sm font-bold group-hover:text-primary">{word}</p>
                  <p className="text-[10px] text-on-surface-variant">Word</p>
                </div>
              ))}
            </div>
          </div>

          {/* Growth Widgets: Progress Pulse */}
          <div className="bg-inverse-surface text-white rounded-[2rem] p-8 space-y-6 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-bold text-lg">Progress Pulse</h3>
              <p className="text-slate-400 text-xs mt-1">Average Score Last 6 Months</p>
              <div className="mt-8 flex items-end gap-2 h-24">
                {/* Minimal Sparkline (Mocked blocks) */}
                {[12, 16, 20, 24, 20, 22].map((h, i) => (
                  <div key={i} className={`w-full bg-slate-700/50 rounded-t-lg relative group`} style={{ height: `${h * 4}px` }}>
                    <div className={`absolute bottom-0 w-full ${i === 3 ? 'bg-secondary-fixed' : 'bg-primary'} transition-all`} style={{ height: `${h * 3.5}px` }}></div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-between items-center">
                <div>
                  <span className="text-3xl font-black">92%</span>
                  <span className="text-xs text-secondary-fixed ml-1 font-bold">+4.2%</span>
                </div>
                <span className="material-symbols-outlined text-slate-500">trending_up</span>
              </div>
            </div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl"></div>
          </div>

          {/* Recent Notifications Feed */}
          <div className="space-y-4">
            <h3 className="text-sm font-label font-bold uppercase tracking-widest text-on-surface-variant">Recent Activity</h3>
            <div className="space-y-4">
              {recentActivity.length > 0 ? recentActivity.map((sub: any) => (
                <div key={sub.id} className="flex gap-4 p-4 hover:bg-surface-container-low rounded-2xl transition-colors">
                  <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-secondary text-xl">grade</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold">Assignment Submitted</p>
                    <p className="text-xs text-on-surface-variant mt-1">{sub.assignment.title}: <span className="font-bold text-secondary">{sub.score}%</span></p>
                    <p className="text-[10px] text-outline mt-1 uppercase">
                      {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : 'Recently'}
                    </p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-on-surface-variant">No recent activity.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
