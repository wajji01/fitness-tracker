import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_BASE, authHeaders } from "../../../config/api";
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

function toNum(v) { return parseFloat(v) || 0; }
function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function today() { return new Date().toISOString().split("T")[0]; }

/* ── Animated counter hook ─────────────────────────────────────── */
function useCountUp(target, duration = 1000, skip = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (skip || !target) return;
    const num = parseFloat(target) || 0;
    if (num === 0) { setValue(0); return; }
    let start = 0;
    const step = num / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= num) { setValue(num); clearInterval(timer); }
      else setValue(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, skip]);
  return value;
}

/* ── Intersection observer hook ────────────────────────────────── */
function useVisible(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* ── Shimmer skeleton ───────────────────────────────────────────── */
function Skeleton({ className }) {
  return <div className={`skeleton-shimmer rounded-xl ${className}`} />;
}

/* ── Stat Card ──────────────────────────────────────────────────── */
function StatCard({ label, value, sub, positive, neutral, icon, gradient, delay, loading }) {
  const [cardRef, visible] = useVisible();
  const numVal = parseFloat(value) || 0;
  const counted = useCountUp(numVal, 900, loading || !visible || isNaN(numVal));
  const displayVal = !isNaN(numVal) && numVal > 0 ? counted.toLocaleString() : value;

  return (
    <div
      ref={cardRef}
      style={{ animationDelay: delay }}
      className={`relative overflow-hidden rounded-2xl p-5 hover-lift card-shine cursor-default
        ${visible ? "animate-fade-up" : "opacity-0"}`}
    >
      {/* Gradient background */}
      <div className={`absolute inset-0 ${gradient} opacity-100`} />
      {/* Decorative circle */}
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
      <div className="absolute -bottom-8 -left-4 w-20 h-20 rounded-full bg-white/5" />

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-white/70 uppercase tracking-widest">{label}</span>
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white">
            {icon}
          </div>
        </div>
        {loading
          ? <><Skeleton className="h-9 w-20 mb-2 bg-white/20" /><Skeleton className="h-3 w-28 bg-white/20" /></>
          : <>
              <p className={`text-3xl font-extrabold text-white tracking-tight ${visible ? "animate-count-up" : "opacity-0"}`}
                style={{ animationDelay: `calc(${delay} + 200ms)` }}>
                {displayVal}
              </p>
              <p className="text-xs mt-1.5 font-semibold text-white/60">
                {neutral ? "→ " : positive ? "↑ " : "↓ "}{sub}
              </p>
            </>
        }
      </div>
    </div>
  );
}

/* ── Custom tooltip ─────────────────────────────────────────────── */
function WeightTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur border border-white/60 rounded-2xl shadow-2xl px-4 py-3 animate-scale-in">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-base font-extrabold text-violet-600">{payload[0].value} kg</p>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────── */
export default function DashboardHome({ onGoToWorkouts }) {
  const [workouts,  setWorkouts]  = useState([]);
  const [nutrition, setNutrition] = useState([]);
  const [progress,  setProgress]  = useState([]);
  const [user,      setUser]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [chartRef,  chartVisible] = useVisible();

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [wRes, nRes, pRes, uRes] = await Promise.allSettled([
          axios.get(`${API_BASE}/api/workouts`,  authHeaders()),
          axios.get(`${API_BASE}/api/nutrition`, authHeaders()),
          axios.get(`${API_BASE}/api/progress`,  authHeaders()),
          axios.get(`${API_BASE}/api/users/me`,  authHeaders()),
        ]);
        if (wRes.status === "fulfilled") setWorkouts(wRes.value.data?.workouts || wRes.value.data || []);
        if (nRes.status === "fulfilled") setNutrition(nRes.value.data?.entries || nRes.value.data || []);
        if (pRes.status === "fulfilled") {
          const raw = pRes.value.data?.entries || pRes.value.data?.progress || pRes.value.data || [];
          setProgress(Array.isArray(raw) ? raw : []);
        }
        if (uRes.status === "fulfilled") setUser(uRes.value.data?.user || uRes.value.data);
      } catch {}
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  /* ── Computed values ──────────────────────────────────────────── */
  const todayStr      = today();
  const todayNutr     = nutrition.filter(n => n.date?.startsWith(todayStr));
  const todayCals     = todayNutr.reduce((a, n) => a + toNum(n.calories), 0);
  const calGoal       = 2000;
  const calDiff       = calGoal - todayCals;
  const weekStart     = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay()); weekStart.setHours(0,0,0,0);
  const weekWorkouts  = workouts.filter(w => w.date && new Date(w.date) >= weekStart);
  const latestProg    = progress.length ? progress[progress.length - 1] : null;
  const firstProg     = progress.length ? progress[0] : null;
  const weightChange  = latestProg?.weight && firstProg?.weight
    ? (toNum(latestProg.weight) - toNum(firstProg.weight)).toFixed(1) : null;

  /* ── Chart data ───────────────────────────────────────────────── */
  const weightData = progress.filter(p => toNum(p.weight) > 0)
    .map(p => ({ date: fmtDate(p.date), weight: toNum(p.weight) }));
  const weightVals = weightData.map(d => d.weight);
  const yMin = weightVals.length ? Math.floor(Math.min(...weightVals) - 3) : 0;
  const yMax = weightVals.length ? Math.ceil(Math.max(...weightVals)  + 3) : 100;

  /* ── Weekly bars ──────────────────────────────────────────────── */
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const weeklyBars = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const ds = d.toISOString().split("T")[0];
    return { day: days[d.getDay()], count: workouts.filter(w => w.date?.startsWith(ds)).length, isToday: ds === todayStr };
  });
  const maxCount = Math.max(...weeklyBars.map(b => b.count), 1);

  /* ── Recent workouts ──────────────────────────────────────────── */
  const recent = [...workouts].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  /* ── Macros ───────────────────────────────────────────────────── */
  const macros = todayNutr.reduce((a,n) => ({
    protein: a.protein + toNum(n.protein),
    carbs:   a.carbs   + toNum(n.carbs),
    fats:    a.fats    + toNum(n.fats),
  }), { protein: 0, carbs: 0, fats: 0 });

  const categoryStyles = {
    strength: "bg-violet-100 text-violet-700",
    cardio:   "bg-sky-100 text-sky-700",
    flexibility:"bg-emerald-100 text-emerald-700",
    sports:   "bg-orange-100 text-orange-700",
    other:    "bg-gray-100 text-gray-600",
  };

  return (
    <div className="space-y-6 page-enter">

      {/* ── Welcome ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between animate-fade-up">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">
            {user?.name ? (
              <>Hey, <span className="text-gradient">{user.name.split(" ")[0]}</span> 👋</>
            ) : "Dashboard"}
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <button onClick={onGoToWorkouts}
          className="hidden sm:inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600
            text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-violet-200
            hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-200 btn-press transition-all duration-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Log Workout
        </button>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard loading={loading} delay="0ms"
          label="Total Workouts" value={workouts.length}
          sub={`${weekWorkouts.length} this week`}
          positive={weekWorkouts.length > 0} neutral={weekWorkouts.length === 0}
          gradient="bg-gradient-to-br from-violet-600 to-purple-700"
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>}
        />
        <StatCard loading={loading} delay="100ms"
          label="Today's Calories" value={todayCals > 0 ? todayCals : "0"}
          sub={calDiff > 0 ? `${calDiff} to goal` : "Goal reached!"}
          positive={calDiff >= 0} neutral={todayCals === 0}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" /></svg>}
        />
        <StatCard loading={loading} delay="200ms"
          label="Current Weight"
          value={latestProg?.weight ? `${latestProg.weight}` : "—"}
          sub={weightChange !== null ? `${weightChange > 0 ? "+" : ""}${weightChange} kg total` : "No data yet"}
          positive={weightChange !== null && parseFloat(weightChange) <= 0} neutral={weightChange === null}
          gradient="bg-gradient-to-br from-sky-500 to-blue-600"
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" /></svg>}
        />
        <StatCard loading={loading} delay="300ms"
          label="Meals Today" value={todayNutr.length}
          sub={nutrition.length > 0 ? `${nutrition.length} total logs` : "Start tracking"}
          positive={todayNutr.length > 0} neutral={todayNutr.length === 0}
          gradient="bg-gradient-to-br from-orange-500 to-rose-500"
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-1.5-.75V14.25m0 0c0-.621.504-1.125 1.125-1.125h13.75C20.496 13.125 21 13.629 21 14.25v.75" /></svg>}
        />
      </div>

      {/* ── Weight Chart + Weekly Activity ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Weight Chart */}
        <div ref={chartRef}
          style={{ animationDelay: "100ms" }}
          className={`lg:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden hover-lift
            ${chartVisible ? "animate-fade-up" : "opacity-0"}`}>
          <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Weight Progress</h3>
              <p className="text-xs text-gray-400 mt-0.5">Body weight over time</p>
            </div>
            {latestProg?.weight && (
              <span className="text-xs font-bold text-violet-600 bg-violet-50 px-3 py-1.5 rounded-full animate-fade-in">
                {latestProg.weight} kg now
              </span>
            )}
          </div>
          <div className="p-6">
            {loading ? <Skeleton className="w-full h-52" /> :
             weightData.length < 2 ? (
              <div className="flex flex-col items-center justify-center h-52 gap-3">
                <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center text-2xl animate-float">📈</div>
                <p className="text-sm text-gray-400 font-medium">Log 2+ progress entries to see chart</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={weightData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                  <YAxis domain={[yMin, yMax]} tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} tickFormatter={v => `${v}kg`} />
                  <Tooltip content={<WeightTooltip />} />
                  <Area type="monotone" dataKey="weight" stroke="#7c3aed" strokeWidth={2.5}
                    fill="url(#wGrad)" dot={{ fill: "#7c3aed", r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: "#7c3aed", stroke: "#ede9fe", strokeWidth: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Weekly Activity */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 hover-lift animate-fade-up" style={{ animationDelay: "250ms" }}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-gray-900">Weekly Activity</h3>
            <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full">
              {weekWorkouts.length} sessions
            </span>
          </div>

          {loading ? (
            <div className="flex items-end gap-2 h-32">
              {Array(7).fill(0).map((_, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <Skeleton className="w-full rounded-t-lg" />
                  <Skeleton className="h-3 w-5" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-end gap-1.5 h-32">
              {weeklyBars.map((b, i) => {
                const pct = maxCount > 0 ? (b.count / maxCount) * 100 : 0;
                return (
                  <div key={b.day} className="flex-1 flex flex-col items-center gap-1.5 group">
                    {b.count > 0 && (
                      <span className="text-[10px] font-bold text-violet-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        {b.count}
                      </span>
                    )}
                    <div className="w-full rounded-t-lg bg-gray-100 relative flex-1 overflow-hidden">
                      <div
                        className={`absolute bottom-0 w-full rounded-t-lg animate-bar-grow ${
                          b.isToday
                            ? "bg-gradient-to-t from-violet-600 to-purple-400"
                            : b.count > 0
                            ? "bg-gradient-to-t from-violet-300 to-purple-200"
                            : ""
                        }`}
                        style={{
                          height: pct > 0 ? `${Math.max(pct, 8)}%` : "0%",
                          animationDelay: `${i * 60}ms`,
                        }}
                      />
                    </div>
                    <span className={`text-[10px] font-semibold transition-colors ${
                      b.isToday ? "text-violet-600" : "text-gray-400"
                    }`}>{b.day}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Today's Macros */}
          <div className="mt-5 pt-4 border-t border-gray-50 space-y-2.5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Today's Macros</p>
            {[
              { label: "Protein", val: macros.protein, goal: 150, color: "from-violet-500 to-purple-500", delay: "0ms" },
              { label: "Carbs",   val: macros.carbs,   goal: 250, color: "from-sky-400 to-blue-500",      delay: "80ms" },
              { label: "Fats",    val: macros.fats,    goal: 65,  color: "from-emerald-400 to-teal-500",  delay: "160ms" },
            ].map(m => (
              <div key={m.label}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-gray-500">{m.label}</span>
                  <span className="text-xs font-bold text-gray-700">{Math.round(m.val)}g</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${m.color} rounded-full animate-progress`}
                    style={{ width: `${Math.min((m.val / m.goal) * 100, 100)}%`, animationDelay: m.delay }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Latest Workout Banner ────────────────────────────────── */}
      {!loading && recent.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl p-6 text-white animate-fade-up card-shine"
          style={{ animationDelay: "300ms" }}>
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 animate-gradient" />
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-purple-200 uppercase tracking-widest mb-1">Latest Workout</p>
              <h3 className="text-2xl font-extrabold">{recent[0].exerciseName || recent[0].exercise}</h3>
              <div className="flex items-center gap-5 mt-3">
                {[
                  { label: "Sets",   val: recent[0].sets   ?? "—" },
                  { label: "Reps",   val: recent[0].reps   ?? "—" },
                  ...(recent[0].weight != null ? [{ label: "kg", val: recent[0].weight }] : []),
                ].map((stat, i) => (
                  <div key={stat.label} className="text-center animate-count-up"
                    style={{ animationDelay: `calc(350ms + ${i * 80}ms)` }}>
                    <p className="text-2xl font-extrabold">{stat.val}</p>
                    <p className="text-xs text-purple-200 mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-purple-300 mt-3">{fmtDate(recent[0].date)}</p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0 animate-float">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* ── Recent Workouts Table ────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover-lift animate-fade-up"
        style={{ animationDelay: "400ms" }}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Recent Workouts</h3>
            <p className="text-xs text-gray-400 mt-0.5">Your last 5 sessions</p>
          </div>
          <button onClick={onGoToWorkouts}
            className="text-xs font-semibold text-violet-600 hover:text-violet-700 bg-violet-50
              hover:bg-violet-100 px-3 py-1.5 rounded-lg transition-all btn-press">
            View all →
          </button>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" style={{ animationDelay: `${i * 80}ms` }} />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center text-2xl animate-float">🏋️</div>
              <p className="text-sm font-semibold text-gray-500">No workouts logged yet</p>
              <button onClick={onGoToWorkouts}
                className="text-xs font-semibold text-violet-600 hover:text-violet-700 bg-violet-50
                  hover:bg-violet-100 px-4 py-2 rounded-lg transition-all btn-press">
                + Log Your First Workout
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  {["Exercise","Category","Sets","Reps","Weight","Date"].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((w, i) => (
                  <tr key={w._id}
                    style={{ animationDelay: `calc(420ms + ${i * 50}ms)` }}
                    className="border-t border-gray-50 hover:bg-violet-50/40 transition-colors animate-slide-in-left">
                    <td className="px-5 py-3.5 font-semibold text-gray-800 whitespace-nowrap">
                      {w.exerciseName || w.exercise || "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        categoryStyles[(w.category||"").toLowerCase()] || "bg-gray-100 text-gray-600"
                      }`}>
                        {w.category ? w.category.charAt(0).toUpperCase() + w.category.slice(1) : "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 font-medium">{w.sets ?? "—"}</td>
                    <td className="px-5 py-3.5 text-gray-600 font-medium">{w.reps ?? "—"}</td>
                    <td className="px-5 py-3.5 text-gray-500">{w.weight != null ? `${w.weight} kg` : "—"}</td>
                    <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap">{fmtDate(w.date)}</td>
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