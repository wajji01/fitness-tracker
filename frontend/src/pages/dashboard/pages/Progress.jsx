import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE, authHeaders } from "../../../config/api";
import {
  AreaChart, Area,
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
  ReferenceLine, Legend,
} from "recharts";

const API = `${API_BASE}/api/progress`;

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function toNum(v) { return parseFloat(v) || 0; }
function avg(arr, key) {
  const vals = arr.map(d => toNum(d[key])).filter(v => v > 0);
  return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : "0";
}

// ── Custom Tooltips ───────────────────────────────────────────────────────────
function WeightTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="font-bold text-violet-600">{payload[0].value} kg</p>
    </div>
  );
}

function StrengthTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="text-xs text-gray-400 mb-2">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }} className="font-bold">
          {p.name}: {p.value} kg
        </p>
      ))}
    </div>
  );
}

function RunTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="font-bold text-emerald-600">{payload[0].value} min</p>
    </div>
  );
}

// ── Modal ──────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 py-8 overflow-y-auto">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg my-auto">
        {/* Sticky header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4
          border-b border-gray-100 bg-white rounded-t-2xl">
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none"
              viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ── Progress Form ─────────────────────────────────────────────────────────────
function ProgressForm({ initial, onSubmit, onCancel, loading }) {
  const empty = {
    weight: "", bodyFat: "", chest: "", waist: "", arms: "",
    liftingWeight: "", runTime: "", notes: "",
    date: new Date().toISOString().split("T")[0],
  };
  const [form,   setForm]   = useState(initial || empty);
  const [errors, setErrors] = useState({});

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: "" })); };

  const validate = () => {
    const e = {};
    if (!form.date) e.date = "Date is required.";
    const hasAny = ["weight","bodyFat","chest","waist","arms","liftingWeight","runTime"]
      .some(k => form[k] && !isNaN(form[k]) && +form[k] > 0);
    if (!hasAny) e.general = "Enter at least one measurement.";
    return e;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    const payload = { date: form.date, notes: form.notes };
    ["weight","bodyFat","chest","waist","arms","liftingWeight","runTime"].forEach(k => {
      if (form[k] && !isNaN(form[k])) payload[k] = parseFloat(form[k]);
    });
    onSubmit(payload);
  };

  // ── Input helpers (no nested component — prevents focus loss on re-render) ──
  const numCls = (name) =>
    `w-full pl-3 pr-12 py-2.5 text-sm rounded-xl border outline-none transition-colors ${
      errors[name]
        ? "border-red-200 bg-red-50"
        : "border-gray-200 bg-gray-50 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 focus:bg-white"
    }`;

  const NumField = (label, name, suffix) => (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      <div className="relative">
        <input
          type="number" min="0" step="0.1"
          value={form[name]}
          onChange={e => set(name, e.target.value)}
          placeholder="0"
          className={numCls(name)}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium pointer-events-none">
          {suffix}
        </span>
      </div>
      {errors[name] && <p className="mt-1 text-xs text-red-500">{errors[name]}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errors.general && (
        <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm font-medium">
          {errors.general}
        </div>
      )}

      {/* Date */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          Date<span className="text-red-400 ml-0.5">*</span>
        </label>
        <input
          type="date" value={form.date}
          onChange={e => set("date", e.target.value)}
          className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50
            focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-colors"
        />
        {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date}</p>}
      </div>

      {/* Body Metrics */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Body Metrics</p>
        <div className="grid grid-cols-2 gap-3">
          {NumField("Weight",   "weight",  "kg")}
          {NumField("Body Fat", "bodyFat", "%")}
          {NumField("Chest",    "chest",   "cm")}
          {NumField("Waist",    "waist",   "cm")}
          {NumField("Arms",     "arms",    "cm")}
        </div>
      </div>

      {/* Performance */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Performance</p>
        <div className="grid grid-cols-2 gap-3">
          {NumField("Lifting Weight", "liftingWeight", "kg")}
          {NumField("Run Time",       "runTime",       "min")}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
        <textarea value={form.notes} onChange={e => set("notes", e.target.value)}
          placeholder="How are you feeling today?" rows={2}
          className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none resize-none" />
      </div>

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={loading}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-600 to-purple-600 text-white disabled:opacity-60 transition-all flex items-center justify-center gap-2">
          {loading
            ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Saving…</>
            : initial ? "Save Changes" : "Log Progress"}
        </button>
      </div>
    </form>
  );
}

// ── Chart Card ────────────────────────────────────────────────────────────────
function ChartCard({ title, subtitle, icon, children, empty }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="p-6">
        {empty ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <p className="text-sm text-gray-400 font-medium">Not enough data</p>
            <p className="text-xs text-gray-300">Log at least 2 entries to see chart</p>
          </div>
        ) : children}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function Progress() {
  const [entries,      setEntries]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [formLoading,  setFormLoading]  = useState(false);
  const [deleteLoading,setDeleteLoading]= useState(false);
  const [error,        setError]        = useState("");
  const [showAdd,      setShowAdd]      = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchEntries = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const { data } = await axios.get(API, authHeaders());
      const raw = Array.isArray(data) ? data : (data.entries || data.progress || []);
      setEntries([...raw].sort((a, b) => new Date(a.date) - new Date(b.date)));
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load progress data.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  // ── Add ────────────────────────────────────────────────────────────────────
  const handleAdd = async (form) => {
    setFormLoading(true);
    try {
      const { data } = await axios.post(API, form, authHeaders());
      const entry = data.entry || data.progress || data;
      setEntries(p => [...p, entry].sort((a, b) => new Date(a.date) - new Date(b.date)));
      setShowAdd(false);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to add entry.");
    } finally { setFormLoading(false); }
  };

  // ── Edit ───────────────────────────────────────────────────────────────────
  const handleEdit = async (form) => {
    setFormLoading(true);
    try {
      const { data } = await axios.put(`${API}/${editTarget._id}`, form, authHeaders());
      const entry = data.entry || data.progress || data;
      setEntries(p =>
        p.map(e => e._id === editTarget._id ? entry : e)
         .sort((a, b) => new Date(a.date) - new Date(b.date))
      );
      setEditTarget(null);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update entry.");
    } finally { setFormLoading(false); }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await axios.delete(`${API}/${deleteTarget._id}`, authHeaders());
      setEntries(p => p.filter(e => e._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete entry.");
    } finally { setDeleteLoading(false); }
  };

  // ── Chart Data ─────────────────────────────────────────────────────────────
  const weightData    = entries.filter(e => toNum(e.weight) > 0)
    .map(e => ({ date: fmt(e.date), weight: toNum(e.weight) }));

  const strengthData  = entries.filter(e => toNum(e.liftingWeight) > 0)
    .map(e => ({ date: fmt(e.date), liftingWeight: toNum(e.liftingWeight) }));

  const runData       = entries.filter(e => toNum(e.runTime) > 0)
    .map(e => ({ date: fmt(e.date), runTime: toNum(e.runTime) }));

  const measureData   = entries.filter(e =>
    toNum(e.chest) > 0 || toNum(e.waist) > 0 || toNum(e.arms) > 0
  ).map(e => ({
    date:  fmt(e.date),
    chest: toNum(e.chest)  || null,
    waist: toNum(e.waist)  || null,
    arms:  toNum(e.arms)   || null,
  }));

  // ── Latest stats ───────────────────────────────────────────────────────────
  const latest = entries.length ? entries[entries.length - 1] : null;
  const first  = entries.length ? entries[0] : null;
  const weightChange = latest && first && toNum(latest.weight) && toNum(first.weight)
    ? (toNum(latest.weight) - toNum(first.weight)).toFixed(1)
    : null;

  const statCards = [
    {
      label: "Current Weight",
      value: latest?.weight ? `${toNum(latest.weight)} kg` : "—",
      sub:   weightChange !== null ? `${weightChange > 0 ? "+" : ""}${weightChange} kg total` : "No data",
      color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-100",
    },
    {
      label: "Best Lift",
      value: strengthData.length ? `${Math.max(...strengthData.map(d => d.liftingWeight))} kg` : "—",
      sub:   `Avg: ${avg(entries, "liftingWeight")} kg`,
      color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100",
    },
    {
      label: "Best Run Time",
      value: runData.length ? `${Math.min(...runData.map(d => d.runTime))} min` : "—",
      sub:   `Avg: ${avg(entries, "runTime")} min`,
      color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100",
    },
    {
      label: "Total Logs",
      value: entries.length,
      sub:   entries.length ? `Since ${fmt(entries[0]?.date)}` : "Start logging",
      color: "text-sky-600", bg: "bg-sky-50", border: "border-sky-100",
    },
  ];

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900">Progress</h2>
          <p className="text-sm text-gray-400 mt-0.5">Track your body metrics and performance over time</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-md shadow-violet-100 hover:-translate-y-0.5 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Log Progress
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-sm font-medium flex-1">{error}</p>
          <button onClick={() => setError("")} className="opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3">
          <svg className="w-6 h-6 animate-spin text-violet-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <span className="text-sm text-gray-400">Loading progress...</span>
        </div>
      ) : (
        <>
          {/* ── Stat Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map(s => (
              <div key={s.label} className={`rounded-2xl border ${s.border} ${s.bg} p-4`}>
                <p className="text-xs font-semibold text-gray-500 mb-1">{s.label}</p>
                <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* ── Chart 1: Weight Progress ── */}
          <ChartCard
            title="Weight Progress"
            subtitle="Body weight over time (kg)"
            empty={weightData.length < 2}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            }
          >
            {weightData.length >= 2 && (() => {
              const vals = weightData.map(d => d.weight);
              const yMin = Math.floor(Math.min(...vals) - 3);
              const yMax = Math.ceil(Math.max(...vals)  + 3);
              const avgW = (vals.reduce((a,b) => a+b, 0) / vals.length).toFixed(1);
              return (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={weightData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}   />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                    <YAxis domain={[yMin, yMax]} tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} tickFormatter={v => `${v}kg`} />
                    <Tooltip content={<WeightTooltip />} />
                    <ReferenceLine y={parseFloat(avgW)} stroke="#c4b5fd" strokeDasharray="4 4" label={{ value: `Avg ${avgW}kg`, fill: "#7c3aed", fontSize: 10 }} />
                    <Area type="monotone" dataKey="weight" stroke="#7c3aed" strokeWidth={2.5} fill="url(#weightGrad)" dot={{ fill: "#7c3aed", r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </AreaChart>
                </ResponsiveContainer>
              );
            })()}
          </ChartCard>

          {/* ── Chart 2: Strength Progress ── */}
          <ChartCard
            title="Strength Progress"
            subtitle="Max lifting weight over time (kg)"
            empty={strengthData.length < 2}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            }
          >
            {strengthData.length >= 2 && (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={strengthData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="strengthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#f97316" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#fb923c" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} tickFormatter={v => `${v}kg`} />
                  <Tooltip content={<StrengthTooltip />} />
                  <Bar dataKey="liftingWeight" name="Lifting" fill="url(#strengthGrad)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* ── Chart 3: Running Performance ── */}
          <ChartCard
            title="Running Performance"
            subtitle="Run time over time (lower is better)"
            empty={runData.length < 2}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          >
            {runData.length >= 2 && (() => {
              const vals = runData.map(d => d.runTime);
              const yMin = Math.floor(Math.min(...vals) - 2);
              const yMax = Math.ceil(Math.max(...vals)  + 2);
              return (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={runData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="runGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%"   stopColor="#10b981" />
                        <stop offset="100%" stopColor="#34d399" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                    <YAxis domain={[yMin > 0 ? yMin : 0, yMax]} tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} tickFormatter={v => `${v}m`} />
                    <Tooltip content={<RunTooltip />} />
                    <Line type="monotone" dataKey="runTime" stroke="url(#runGrad)" strokeWidth={2.5}
                      dot={{ fill: "#10b981", r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              );
            })()}
          </ChartCard>

          {/* ── Chart 4: Body Measurements ── */}
          <ChartCard
            title="Body Measurements"
            subtitle="Chest, waist and arms over time (cm)"
            empty={measureData.length < 2}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            }
          >
            {measureData.length >= 2 && (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={measureData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} tickFormatter={v => `${v}cm`} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #f3f4f6", fontSize: "12px" }} />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />
                  <Line type="monotone" dataKey="chest" name="Chest" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                  <Line type="monotone" dataKey="waist" name="Waist" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                  <Line type="monotone" dataKey="arms"  name="Arms"  stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* ── Entries Table ── */}
          {entries.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900">All Entries</h3>
                <span className="text-xs text-gray-400">{entries.length} logs</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      {["Date","Weight","Body Fat","Chest","Waist","Arms","Lifting","Run Time","Actions"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...entries].reverse().map(e => (
                      <tr key={e._id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-700 whitespace-nowrap">{fmt(e.date)}</td>
                        <td className="px-4 py-3 text-gray-600">{e.weight     ? `${e.weight} kg`    : "—"}</td>
                        <td className="px-4 py-3 text-gray-600">{e.bodyFat    ? `${e.bodyFat}%`     : "—"}</td>
                        <td className="px-4 py-3 text-gray-600">{e.chest      ? `${e.chest} cm`     : "—"}</td>
                        <td className="px-4 py-3 text-gray-600">{e.waist      ? `${e.waist} cm`     : "—"}</td>
                        <td className="px-4 py-3 text-gray-600">{e.arms       ? `${e.arms} cm`      : "—"}</td>
                        <td className="px-4 py-3 text-gray-600">{e.liftingWeight ? `${e.liftingWeight} kg` : "—"}</td>
                        <td className="px-4 py-3 text-gray-600">{e.runTime    ? `${e.runTime} min`  : "—"}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            <button onClick={() => setEditTarget({
                              ...e,
                              date: e.date ? e.date.split("T")[0] : new Date().toISOString().split("T")[0],
                            })}
                              className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-violet-50 text-gray-400 hover:text-violet-600 flex items-center justify-center transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                              </svg>
                            </button>
                            <button onClick={() => setDeleteTarget(e)}
                              className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {entries.length === 0 && (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
              <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-4 text-3xl">📈</div>
              <p className="text-sm font-semibold text-gray-500">No progress logged yet</p>
              <p className="text-xs text-gray-400 mt-1">Click "Log Progress" to start tracking</p>
            </div>
          )}
        </>
      )}

      {/* ── Modals ── */}
      {showAdd && (
        <Modal title="Log Progress" onClose={() => setShowAdd(false)}>
          <ProgressForm onSubmit={handleAdd} onCancel={() => setShowAdd(false)} loading={formLoading} />
        </Modal>
      )}
      {editTarget && (
        <Modal title="Edit Progress" onClose={() => setEditTarget(null)}>
          <ProgressForm initial={editTarget} onSubmit={handleEdit} onCancel={() => setEditTarget(null)} loading={formLoading} />
        </Modal>
      )}
      {deleteTarget && (
        <Modal title="Delete Entry" onClose={() => setDeleteTarget(null)}>
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto text-2xl">🗑️</div>
            <div>
              <p className="font-bold text-gray-900">Delete this entry?</p>
              <p className="text-sm text-gray-400 mt-1">{fmt(deleteTarget.date)} — This cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleteLoading}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500 hover:bg-red-600 text-white disabled:opacity-60 flex items-center justify-center gap-2">
                {deleteLoading
                  ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Deleting…</>
                  : "Delete"}
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}