const user = {
  name: "Alex Johnson",
  avatar: "AJ",
  joinDate: "Member since Jan 2024",
};

const stats = [
  {
    label: "Total Workouts",
    value: "128",
    change: "+4 this week",
    positive: true,
    bg: "bg-violet-50",
    border: "border-violet-100",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
    textColor: "text-violet-600",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    label: "Today's Calories",
    value: "1,840",
    change: "−360 to goal",
    positive: false,
    neutral: true,
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    textColor: "text-emerald-600",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
      </svg>
    ),
  },
  {
    label: "Current Weight",
    value: "172 lbs",
    change: "−3 lbs this month",
    positive: true,
    bg: "bg-sky-50",
    border: "border-sky-100",
    iconBg: "bg-sky-100",
    iconColor: "text-sky-600",
    textColor: "text-sky-600",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
      </svg>
    ),
  },
];

const workouts = [
  { id: 1, name: "Upper Body Strength", type: "Strength", duration: "48 min", calories: 320, date: "Today", status: "Completed" },
  { id: 2, name: "5K Morning Run", type: "Cardio", duration: "28 min", calories: 410, date: "Yesterday", status: "Completed" },
  { id: 3, name: "Core & Flexibility", type: "Flexibility", duration: "35 min", calories: 180, date: "Mar 1", status: "Completed" },
  { id: 4, name: "HIIT Circuit", type: "HIIT", duration: "22 min", calories: 390, date: "Feb 28", status: "Completed" },
  { id: 5, name: "Leg Day", type: "Strength", duration: "55 min", calories: 445, date: "Feb 27", status: "Completed" },
];

const typeStyles = {
  Strength:    "bg-violet-100 text-violet-700",
  Cardio:      "bg-sky-100 text-sky-700",
  Flexibility: "bg-emerald-100 text-emerald-700",
  HIIT:        "bg-orange-100 text-orange-700",
};

const weeklyData = [
  { day: "Mon", pct: 90 },
  { day: "Tue", pct: 60 },
  { day: "Wed", pct: 75 },
  { day: "Thu", pct: 40 },
  { day: "Fri", pct: 85 },
  { day: "Sat", pct: 100 },
  { day: "Sun", pct: 30 },
];

const goals = [
  { label: "Weekly Workouts", current: 4, target: 5 },
  { label: "Daily Calories", current: 1840, target: 2200 },
  { label: "Water Intake (oz)", current: 64, target: 80 },
];

export default function Dashboard() {
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="min-h-screen bg-gray-50 font-sans antialiased">
      {/* Sidebar + Main layout */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-60 min-h-screen bg-white border-r border-gray-100 fixed top-0 left-0 z-30">
          <div className="h-16 flex items-center gap-2 px-6 border-b border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">FitTrack</span>
          </div>
          <nav className="flex-1 px-3 py-6 space-y-1">
            {[
              { label: "Dashboard", active: true, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /> },
              { label: "Workouts", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /> },
              { label: "Nutrition", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" /> },
              { label: "Progress", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /> },
              { label: "Settings", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /> },
            ].map((item) => (
              <button
                key={item.label}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  item.active
                    ? "bg-violet-50 text-violet-700"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5 w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  {item.icon}
                </svg>
                {item.label}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {user.avatar}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{user.name}</p>
                <p className="text-xs text-gray-400 truncate">{user.joinDate}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 lg:ml-60 min-h-screen">
          {/* Top bar */}
          <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-20">
            <div>
              <p className="text-xs text-gray-400">{today}</p>
              <h1 className="text-base font-bold text-gray-900">Good morning, {user.name.split(" ")[0]} 👋</h1>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-violet-500 rounded-full" />
              </button>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                {user.avatar}
              </div>
            </div>
          </header>

          <div className="p-6 space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {stats.map((s) => (
                <div key={s.label} className={`rounded-2xl border ${s.border} ${s.bg} p-5`}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-500">{s.label}</span>
                    <div className={`w-9 h-9 rounded-xl ${s.iconBg} ${s.iconColor} flex items-center justify-center`}>
                      {s.icon}
                    </div>
                  </div>
                  <p className="text-3xl font-extrabold text-gray-900 tracking-tight">{s.value}</p>
                  <p className={`text-xs mt-1 font-medium ${s.neutral ? "text-amber-500" : s.positive ? "text-emerald-600" : "text-red-500"}`}>
                    {s.positive && !s.neutral ? "↑ " : s.neutral ? "→ " : "↓ "}{s.change}
                  </p>
                </div>
              ))}
            </div>

            {/* Middle row: Weekly Activity + Goals */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Weekly Activity */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-sm font-bold text-gray-800">Weekly Activity</h2>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">This week</span>
                </div>
                <div className="flex items-end gap-2 h-28">
                  {weeklyData.map((d) => (
                    <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5">
                      <div className="w-full rounded-t-lg bg-gray-100 relative" style={{ height: "96px" }}>
                        <div
                          className="absolute bottom-0 w-full rounded-t-lg bg-gradient-to-t from-violet-600 to-purple-400 transition-all"
                          style={{ height: `${d.pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400">{d.day}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Goal Progress */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h2 className="text-sm font-bold text-gray-800 mb-5">Goal Progress</h2>
                <div className="space-y-4">
                  {goals.map((g) => {
                    const pct = Math.min(100, Math.round((g.current / g.target) * 100));
                    return (
                      <div key={g.label}>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-xs font-medium text-gray-600">{g.label}</span>
                          <span className="text-xs font-bold text-gray-800">{pct}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{g.current.toLocaleString()} / {g.target.toLocaleString()}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Recent Workouts Table */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-800">Recent Workouts</h2>
                <button className="text-xs font-semibold text-violet-600 hover:text-violet-700 transition-colors">
                  View all →
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {["Workout", "Type", "Duration", "Calories", "Date", "Status"].map((h) => (
                        <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {workouts.map((w) => (
                      <tr key={w.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-gray-800">{w.name}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${typeStyles[w.type]}`}>
                            {w.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{w.duration}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{w.calories} kcal</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{w.date}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                            {w.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}