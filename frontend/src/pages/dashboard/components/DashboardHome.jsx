import { useState, useEffect } from "react";
import axios from "axios";

function authHeaders() {
  return { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } };
}

const stats = [
  {
    label: "Total Workouts", value: "128", change: "+4 this week", positive: true,
    bg: "bg-violet-50", border: "border-violet-100", iconBg: "bg-violet-100", iconColor: "text-violet-600",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    label: "Today's Calories", value: "1,840", change: "−360 to goal", neutral: true,
    bg: "bg-emerald-50", border: "border-emerald-100", iconBg: "bg-emerald-100", iconColor: "text-emerald-600",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
      </svg>
    ),
  },
  {
    label: "Current Weight", value: "172 lbs", change: "−3 lbs this month", positive: true,
    bg: "bg-sky-50", border: "border-sky-100", iconBg: "bg-sky-100", iconColor: "text-sky-600",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
      </svg>
    ),
  },
];

const weeklyData = [
  { day: "Mon", pct: 90 }, { day: "Tue", pct: 60 }, { day: "Wed", pct: 75 },
  { day: "Thu", pct: 40 }, { day: "Fri", pct: 85 }, { day: "Sat", pct: 100 }, { day: "Sun", pct: 30 },
];

const goals = [
  { label: "Weekly Workouts", current: 4, target: 5 },
  { label: "Daily Calories",  current: 1840, target: 2200 },
  { label: "Water Intake (oz)", current: 64, target: 80 },
];

const categoryStyles = {
  Strength:    "bg-violet-100 text-violet-700",
  Cardio:      "bg-sky-100 text-sky-700",
  Flexibility: "bg-emerald-100 text-emerald-700",
  HIIT:        "bg-orange-100 text-orange-700",
};

export default function DashboardHome({ onGoToWorkouts }) {
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await axios.get("http://localhost:5000/api/workouts", authHeaders());
        const list = Array.isArray(data) ? data : data.workouts || [];
        setRecentWorkouts(list.slice(0, 5));
      } catch {
        setRecentWorkouts([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <div className="space-y-6">
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
              {s.neutral ? "→ " : s.positive ? "↑ " : "↓ "}{s.change}
            </p>
          </div>
        ))}
      </div>

      {/* Weekly Activity + Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-gray-800">Weekly Activity</h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">This week</span>
          </div>
          <div className="flex items-end gap-2 h-28">
            {weeklyData.map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="w-full rounded-t-lg bg-gray-100 relative" style={{ height: "96px" }}>
                  <div className="absolute bottom-0 w-full rounded-t-lg bg-gradient-to-t from-violet-600 to-purple-400 transition-all" style={{ height: `${d.pct}%` }} />
                </div>
                <span className="text-xs text-gray-400">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

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
                    <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{g.current.toLocaleString()} / {g.target.toLocaleString()}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Workouts */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-800">Recent Workouts</h2>
          <button onClick={onGoToWorkouts} className="text-xs font-semibold text-violet-600 hover:text-violet-700 transition-colors">
            View all →
          </button>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-10 gap-3">
              <svg className="w-5 h-5 animate-spin text-violet-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <span className="text-sm text-gray-400">Loading…</span>
            </div>
          ) : recentWorkouts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
              <p className="text-sm font-semibold text-gray-700">No workouts yet</p>
              <button onClick={onGoToWorkouts} className="text-xs font-semibold text-violet-600 hover:text-violet-700">
                + Add Workout
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Exercise", "Category", "Sets", "Reps", "Weight"].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentWorkouts.map(w => (
                  <tr key={w._id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-800">{w.exercise}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${categoryStyles[w.category] || "bg-gray-100 text-gray-600"}`}>
                        {w.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-medium">{w.sets}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-medium">{w.reps}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{w.weight != null ? `${w.weight} kg` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}