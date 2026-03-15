import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE, authHeaders } from "../../../config/api";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

const API = `${API_BASE}/api/reports`;
const fmt = (n, dec = 0) => Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: dec });

function AnimatedNumber({ value, suffix = "" }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const end = parseFloat(value) || 0;
    if (end === 0) { setDisplay(0); return; }
    let start = 0;
    const duration = 900, step = 16;
    const inc = end / (duration / step);
    const timer = setInterval(() => {
      start += inc;
      if (start >= end) { setDisplay(end); clearInterval(timer); }
      else setDisplay(start);
    }, step);
    return () => clearInterval(timer);
  }, [value]);
  return <>{fmt(display, String(value).includes(".") ? 1 : 0)}{suffix}</>;
}

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 text-white rounded-xl px-4 py-2.5 text-xs shadow-2xl">
      {label && <p className="text-gray-400 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="font-bold" style={{ color: p.color || "#a78bfa" }}>
          {p.name}: {fmt(p.value, 1)}
        </p>
      ))}
    </div>
  );
};

const PIE_COLORS = ["#8b5cf6","#06b6d4","#10b981","#f59e0b","#ef4444","#ec4899"];
const Skel = ({ cls }) => <div className={`animate-pulse bg-gray-200 rounded-xl ${cls}`} />;

export default function Reports() {
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [exporting, setExporting] = useState("");

  const fetchReport = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const { data: res } = await axios.get(API, authHeaders());
      setData(res);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load report.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const handleExport = async (type) => {
    setExporting(type);
    try {
      const token = localStorage.getItem("token");
      const res   = await fetch(`${API}/export/${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url;
      a.download = `fittrack-${new Date().toISOString().slice(0,10)}.${type}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { setError(`Failed to export ${type.toUpperCase()}.`); }
    finally  { setExporting(""); }
  };

  const categoryPie  = data ? Object.entries(data.workouts.categoryBreakdown).map(([name, value]) => ({ name, value })) : [];
  const macroBars    = data ? [
    { name: "Protein", value: data.nutrition.totalProtein, fill: "#8b5cf6" },
    { name: "Carbs",   value: data.nutrition.totalCarbs,   fill: "#06b6d4" },
    { name: "Fats",    value: data.nutrition.totalFats,    fill: "#f59e0b" },
  ] : [];
  const weightData   = data ? data.progress.entries.map(e => ({
    date: e.date ? new Date(e.date).toLocaleDateString("en-US",{month:"short",day:"numeric"}) : "",
    weight: e.weight || 0,
  })) : [];
  const wChange = data?.progress?.weightChange;

  if (loading) return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div className="space-y-2"><Skel cls="h-8 w-48" /><Skel cls="h-4 w-64" /></div>
        <div className="flex gap-2"><Skel cls="h-10 w-24" /><Skel cls="h-10 w-36" /></div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_,i)=><Skel key={i} cls="h-28"/>)}</div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6"><Skel cls="lg:col-span-3 h-72"/><Skel cls="lg:col-span-2 h-72"/></div>
      <Skel cls="h-64" />
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        .rp { font-family:'DM Sans',sans-serif; }
        .rp .serif { font-family:'DM Serif Display',serif; }
        @keyframes fsu { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
        .fu { animation: fsu .45s ease both; }
      `}</style>

      <div className="rp space-y-8">

        {/* Header */}
        <div className="fu flex flex-col sm:flex-row sm:items-end justify-between gap-5">
          <div>
            <p className="text-[11px] font-bold text-violet-500 uppercase tracking-[.18em] mb-1.5">Analytics</p>
            <h1 className="serif text-4xl text-gray-900">Your Fitness Report</h1>
            {data && <p className="text-sm text-gray-400 mt-1.5">Updated {new Date(data.generatedAt).toLocaleString("en-US",{dateStyle:"medium",timeStyle:"short"})}</p>}
          </div>
          <div className="flex gap-2.5">
            <button onClick={()=>handleExport("csv")} disabled={!!exporting||!data}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 border-gray-200 text-gray-600 bg-white hover:border-violet-300 hover:text-violet-700 disabled:opacity-40 transition-all hover:-translate-y-0.5 shadow-sm">
              {exporting==="csv"
                ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>}
              CSV
            </button>
            <button onClick={()=>handleExport("pdf")} disabled={!!exporting||!data}
              className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-bold bg-gray-900 hover:bg-gray-800 text-white shadow-xl shadow-gray-900/20 disabled:opacity-40 transition-all hover:-translate-y-0.5">
              {exporting==="pdf"
                ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>}
              {exporting==="pdf" ? "Generating PDF…" : "Download PDF"}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 text-sm font-medium fu">
            <span>⚠️</span><p className="flex-1">{error}</p>
            <button onClick={()=>setError("")} className="opacity-50 hover:opacity-100 text-lg">×</button>
          </div>
        )}

        {data && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label:"Total Workouts", icon:"🏋️", val:<AnimatedNumber value={data.workouts.total}/>,
                  sub:`${Object.keys(data.workouts.categoryBreakdown).length} categories`,
                  grad:"from-violet-500 to-purple-700", ring:"ring-violet-100", delay:0 },
                { label:"Calories Logged", icon:"🔥", val:<><AnimatedNumber value={data.nutrition.totalCalories}/> <span className="text-base font-normal opacity-60">kcal</span></>,
                  sub:`Avg ${fmt(data.nutrition.avgDailyCalories)} kcal/day`,
                  grad:"from-orange-400 to-red-500", ring:"ring-orange-100", delay:80 },
                { label:"Current Weight", icon:"⚖️", val:data.progress.latestWeight ? <AnimatedNumber value={data.progress.latestWeight} suffix=" kg"/> : "—",
                  sub:wChange!==null ? `${wChange>0?"▲":wChange<0?"▼":"─"} ${Math.abs(wChange)} kg overall` : "No entries yet",
                  grad:"from-cyan-500 to-blue-600", ring:"ring-cyan-100", delay:160 },
                { label:"Meal Entries", icon:"🥗", val:<AnimatedNumber value={data.nutrition.totalEntries}/>,
                  sub:`${fmt(data.nutrition.totalProtein)}g protein total`,
                  grad:"from-emerald-500 to-teal-600", ring:"ring-emerald-100", delay:240 },
              ].map(s => (
                <div key={s.label}
                  className={`bg-white rounded-2xl border border-gray-100 ring-4 ${s.ring} p-5
                    hover:-translate-y-1 hover:shadow-xl transition-all duration-300 fu`}
                  style={{ animationDelay:`${s.delay}ms` }}>
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{s.label}</p>
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.grad} flex items-center justify-center shadow-md text-base`}>{s.icon}</div>
                  </div>
                  <p className="text-2xl font-extrabold text-gray-900 leading-none mb-1.5">{s.val}</p>
                  <p className="text-xs text-gray-400 font-medium">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Weight + Pie */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 p-6 fu" style={{animationDelay:"160ms"}}>
                <div className="flex items-center justify-between mb-5">
                  <div><h3 className="text-sm font-bold text-gray-900">Weight Progress</h3><p className="text-xs text-gray-400 mt-0.5">Body weight over time</p></div>
                  {wChange!==null && (
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${wChange<0?"bg-emerald-50 text-emerald-700 border-emerald-200":wChange>0?"bg-orange-50 text-orange-700 border-orange-200":"bg-gray-50 text-gray-500 border-gray-200"}`}>
                      {wChange>0?"+":""}{wChange} kg
                    </span>
                  )}
                </div>
                {weightData.length>=2 ? (()=>{
                  const vals=weightData.map(d=>d.weight).filter(Boolean);
                  return (
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={weightData} margin={{top:5,right:5,left:-18,bottom:0}}>
                        <defs>
                          <linearGradient id="wg2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.22}/>
                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                        <XAxis dataKey="date" tick={{fontSize:10,fill:"#94a3b8"}} tickLine={false} axisLine={false}/>
                        <YAxis domain={[Math.floor(Math.min(...vals)-3),Math.ceil(Math.max(...vals)+3)]} tick={{fontSize:10,fill:"#94a3b8"}} tickLine={false} axisLine={false} tickFormatter={v=>`${v}kg`}/>
                        <Tooltip content={<ChartTip/>}/>
                        <Area type="monotone" dataKey="weight" name="Weight" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#wg2)" dot={{fill:"#8b5cf6",r:3,strokeWidth:0}} activeDot={{r:5}}/>
                      </AreaChart>
                    </ResponsiveContainer>
                  );
                })() : (
                  <div className="h-52 flex flex-col items-center justify-center gap-2 opacity-30">
                    <span className="text-4xl">📉</span>
                    <p className="text-sm font-medium text-gray-500">Log 2+ entries to see chart</p>
                  </div>
                )}
              </div>

              <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 fu" style={{animationDelay:"240ms"}}>
                <h3 className="text-sm font-bold text-gray-900">Workout Split</h3>
                <p className="text-xs text-gray-400 mt-0.5 mb-4">By category</p>
                {categoryPie.length>0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={categoryPie} cx="50%" cy="44%" innerRadius={50} outerRadius={78} paddingAngle={4} dataKey="value" strokeWidth={0}>
                        {categoryPie.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                      </Pie>
                      <Tooltip formatter={v=>[`${v} workouts`]} contentStyle={{borderRadius:"12px",border:"none",boxShadow:"0 8px 32px rgba(0,0,0,.12)",fontSize:"12px"}}/>
                      <Legend iconType="circle" iconSize={7} wrapperStyle={{fontSize:"11px",paddingTop:"8px"}}/>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-52 flex flex-col items-center justify-center gap-2 opacity-30">
                    <span className="text-4xl">💪</span>
                    <p className="text-sm font-medium text-gray-500">No workouts yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Macros + Nutrition tiles */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 p-6 fu" style={{animationDelay:"320ms"}}>
                <h3 className="text-sm font-bold text-gray-900">Macro Totals</h3>
                <p className="text-xs text-gray-400 mt-0.5 mb-5">All-time protein, carbs & fats</p>
                {data.nutrition.totalEntries>0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={macroBars} margin={{top:5,right:5,left:-18,bottom:0}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                      <XAxis dataKey="name" tick={{fontSize:11,fill:"#94a3b8"}} tickLine={false} axisLine={false}/>
                      <YAxis tick={{fontSize:10,fill:"#94a3b8"}} tickLine={false} axisLine={false} tickFormatter={v=>`${v}g`}/>
                      <Tooltip content={<ChartTip/>}/>
                      <Bar dataKey="value" name="Amount" radius={[8,8,0,0]}>
                        {macroBars.map((e,i)=><Cell key={i} fill={e.fill}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-48 flex items-center justify-center opacity-30">
                    <p className="text-sm font-medium text-gray-500">No nutrition data yet</p>
                  </div>
                )}
              </div>

              <div className="lg:col-span-2 grid grid-cols-2 gap-3 fu" style={{animationDelay:"400ms"}}>
                {[
                  {l:"Calories", v:fmt(data.nutrition.totalCalories), u:"kcal", bg:"bg-orange-50", tx:"text-orange-700", br:"border-orange-100"},
                  {l:"Protein",  v:fmt(data.nutrition.totalProtein),  u:"g",    bg:"bg-violet-50", tx:"text-violet-700", br:"border-violet-100"},
                  {l:"Carbs",    v:fmt(data.nutrition.totalCarbs),    u:"g",    bg:"bg-cyan-50",   tx:"text-cyan-700",   br:"border-cyan-100"},
                  {l:"Fats",     v:fmt(data.nutrition.totalFats),     u:"g",    bg:"bg-amber-50",  tx:"text-amber-700",  br:"border-amber-100"},
                  {l:"Avg/Day",  v:fmt(data.nutrition.avgDailyCalories), u:"kcal", bg:"bg-rose-50",tx:"text-rose-700",   br:"border-rose-100"},
                  {l:"Meals",    v:fmt(data.nutrition.totalEntries),  u:"total",bg:"bg-emerald-50",tx:"text-emerald-700",br:"border-emerald-100"},
                ].map(t=>(
                  <div key={t.l} className={`${t.bg} ${t.br} border rounded-2xl p-4 flex flex-col gap-1`}>
                    <p className={`text-[9px] font-black uppercase tracking-widest ${t.tx} opacity-50`}>{t.l}</p>
                    <p className={`text-xl font-extrabold ${t.tx} leading-none`}>{t.v}</p>
                    <p className={`text-[10px] font-semibold ${t.tx} opacity-40`}>{t.u}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Workouts Table */}
            {data.workouts.recent.length>0 && (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden fu" style={{animationDelay:"480ms"}}>
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Recent Workouts</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Last {data.workouts.recent.length} sessions</p>
                  </div>
                  <span className="text-xs font-bold text-violet-600 bg-violet-50 px-3 py-1.5 rounded-full border border-violet-100">
                    {data.workouts.total} total
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50/70">
                        {["Exercise","Category","Sets","Reps","Weight","Date"].map(h=>(
                          <th key={h} className="px-5 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.workouts.recent.map((w,i)=>(
                        <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-5 py-3.5 font-semibold text-gray-800">{w.exerciseName||"—"}</td>
                          <td className="px-5 py-3.5">
                            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700">{w.category||"Other"}</span>
                          </td>
                          <td className="px-5 py-3.5 text-gray-500">{w.sets||"—"}</td>
                          <td className="px-5 py-3.5 text-gray-500">{w.reps||"—"}</td>
                          <td className="px-5 py-3.5 text-gray-500">{w.weight?`${w.weight} kg`:"—"}</td>
                          <td className="px-5 py-3.5 text-gray-400 text-xs">{w.date?new Date(w.date).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}):"—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}