import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";

const API = "http://localhost:5000/api/progress";

function authHeaders() {
  return { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } };
}

const emptyForm = {
  weight: "",
  date: new Date().toISOString().split("T")[0],
  notes: "",
};

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-base font-bold text-violet-600">{payload[0].value} kg</p>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function WeightForm({ onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: "" })); };

  const validate = () => {
    const e = {};
    if (!form.weight || isNaN(form.weight) || +form.weight <= 0) e.weight = "Enter a valid weight.";
    if (!form.date) e.date = "Date is required.";
    return e;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    onSubmit({ ...form, weight: parseFloat(form.weight) });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          Weight (kg)<span className="text-red-400 ml-0.5">*</span>
        </label>
        <div className="relative">
          <input
            type="number" step="0.1" value={form.weight}
            onChange={e => set("weight", e.target.value)}
            placeholder="e.g. 72.5"
            className={`w-full px-3 py-2.5 pr-10 text-sm rounded-xl border outline-none transition-colors ${
              errors.weight
                ? "border-red-200 bg-red-50"
                : "border-gray-200 bg-gray-50 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 focus:bg-white"
            }`}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">kg</span>
        </div>
        {errors.weight && <p className="mt-1 text-xs text-red-500">{errors.weight}</p>}
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          Date<span className="text-red-400 ml-0.5">*</span>
        </label>
        <input
          type="date" value={form.date}
          onChange={e => set("date", e.target.value)}
          className={`w-full px-3 py-2.5 text-sm rounded-xl border outline-none transition-colors ${
            errors.date
              ? "border-red-200 bg-red-50"
              : "border-gray-200 bg-gray-50 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 focus:bg-white"
          }`}
        />
        {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date}</p>}
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
        <textarea
          value={form.notes} onChange={e => set("notes", e.target.value)}
          rows={2} placeholder="Optional notes..."
          className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 focus:bg-white outline-none transition-colors resize-none"
        />
      </div>

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={loading}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white disabled:opacity-60 transition-all flex items-center justify-center gap-2">
          {loading
            ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Saving...</>
            : "Log Weight"}
        </button>
      </div>
    </form>
  );
}

export default function Progress() {
  const [entries,     setEntries]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error,       setError]       = useState("");
  const [showAdd,     setShowAdd]     = useState(false);
  const [deleteId,    setDeleteId]    = useState(null);
  const [delLoading,  setDelLoading]  = useState(false);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.get(API, authHeaders());
      const list = Array.isArray(data) ? data : (data.entries || data.progress || []);
      const sorted = [...list].sort((a, b) => new Date(a.date) - new Date(b.date));
      setEntries(sorted);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load progress data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const handleAdd = async (form) => {
    setFormLoading(true);
    try {
      const { data } = await axios.post(API, form, authHeaders());
      const newEntry = data.entry || data.progress || data;
      setEntries(p => [...p, newEntry].sort((a, b) => new Date(a.date) - new Date(b.date)));
      setShowAdd(false);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to add entry.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setDelLoading(true);
    try {
      await axios.delete(`${API}/${id}`, authHeaders());
      setEntries(p => p.filter(e => e._id !== id));
      setDeleteId(null);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete entry.");
    } finally {
      setDelLoading(false);
    }
  };

  const chartData = entries.map(e => ({
    date: new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    weight: parseFloat(e.weight),
  }));

  const weights = entries.map(e => parseFloat(e.weight));
  const latest  = weights.length ? weights[weights.length - 1] : null;
  const first   = weights.length ? weights[0] : null;
  const minW    = weights.length ? Math.min(...weights) : null;
  const maxW    = weights.length ? Math.max(...weights) : null;
  const change  = latest !== null && first !== null ? (latest - first).toFixed(1) : null;
  const avg     = weights.length ? (weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(1) : null;
  const yMin    = minW ? Math.floor(minW - 3) : 50;
  const yMax    = maxW ? Math.ceil(maxW + 3)  : 120;

  return (
    <div className="space-y-6">
      {showAdd && (
        <Modal title="Log Weight" onClose={() => setShowAdd(false)}>
          <WeightForm onSubmit={handleAdd} onCancel={() => setShowAdd(false)} loading={formLoading} />
        </Modal>
      )}

      {deleteId && (
        <Modal title="Delete Entry" onClose={() => setDeleteId(null)}>
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-gray-900">Delete this entry?</p>
              <p className="text-sm text-gray-500 mt-1">This cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} disabled={delLoading}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500 hover:bg-red-600 text-white disabled:opacity-60 flex items-center justify-center gap-2">
                {delLoading
                  ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Deleting...</>
                  : "Delete"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900">Progress</h2>
          <p className="text-sm text-gray-400 mt-0.5">{entries.length} weight entr{entries.length !== 1 ? "ies" : "y"} logged</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-violet-100 hover:-translate-y-0.5 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Log Weight
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-sm font-medium flex-1">{error}</p>
          <button onClick={() => setError("")} className="text-red-400 hover:text-red-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Current Weight", value: latest ? `${latest} kg` : "—", emoji: "⚖️", bg: "bg-violet-50", border: "border-violet-100", text: "text-violet-600" },
          { label: "Total Change",   value: change !== null ? `${parseFloat(change) > 0 ? "+" : ""}${change} kg` : "—", emoji: parseFloat(change) > 0 ? "📈" : "📉", bg: parseFloat(change) > 0 ? "bg-red-50" : "bg-emerald-50", border: parseFloat(change) > 0 ? "border-red-100" : "border-emerald-100", text: parseFloat(change) > 0 ? "text-red-500" : "text-emerald-600" },
          { label: "Lowest Weight",  value: minW ? `${minW} kg` : "—", emoji: "🏆", bg: "bg-emerald-50", border: "border-emerald-100", text: "text-emerald-600" },
          { label: "Average Weight", value: avg  ? `${avg} kg`  : "—", emoji: "📊", bg: "bg-sky-50",     border: "border-sky-100",     text: "text-sky-600"     },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border ${s.border} ${s.bg} p-4`}>
            <div className="text-xl mb-2">{s.emoji}</div>
            <p className={`text-xl font-extrabold ${s.text} tracking-tight`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-1 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-bold text-gray-800">Weight Over Time</h3>
            <p className="text-xs text-gray-400 mt-0.5">Your weight journey</p>
          </div>
          {entries.length > 0 && (
            <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
              {entries.length} data point{entries.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-56 gap-3">
            <svg className="w-6 h-6 animate-spin text-violet-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm text-gray-400">Loading chart...</span>
          </div>
        ) : entries.length < 2 ? (
          <div className="flex flex-col items-center justify-center h-56 gap-3 text-center">
            <span className="text-4xl">📉</span>
            <div>
              <p className="font-bold text-gray-700">Not enough data</p>
              <p className="text-sm text-gray-400 mt-1">Log at least 2 entries to see your chart</p>
            </div>
            <button onClick={() => setShowAdd(true)} className="text-sm font-semibold text-violet-600 hover:text-violet-700">+ Log Weight</button>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis domain={[yMin, yMax]} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}kg`} />
              <Tooltip content={<CustomTooltip />} />
              {avg && (
                <ReferenceLine
                  y={parseFloat(avg)}
                  stroke="#c4b5fd"
                  strokeDasharray="4 4"
                  label={{ value: `Avg ${avg}kg`, fontSize: 10, fill: "#8b5cf6", position: "insideTopRight" }}
                />
              )}
              <Area
                type="monotone"
                dataKey="weight"
                stroke="#7c3aed"
                strokeWidth={2.5}
                fill="url(#weightGrad)"
                dot={{ r: 4, fill: "#7c3aed", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6, fill: "#7c3aed", stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Entries Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-800">All Entries</h3>
          <span className="text-xs text-gray-400">{entries.length} total</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 gap-3">
            <svg className="w-5 h-5 animate-spin text-violet-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm text-gray-400">Loading...</span>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
            <span className="text-4xl">⚖️</span>
            <div>
              <p className="font-bold text-gray-700">No entries yet</p>
              <p className="text-sm text-gray-400 mt-1">Start logging your weight to track progress!</p>
            </div>
            <button onClick={() => setShowAdd(true)} className="text-sm font-semibold text-violet-600 hover:text-violet-700">+ Log Weight</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Date", "Weight", "Change", "Notes", ""].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[...entries].reverse().map((entry, idx, arr) => {
                  const curr = parseFloat(entry.weight);
                  const prev = arr[idx + 1] ? parseFloat(arr[idx + 1].weight) : null;
                  const diff = prev !== null ? (curr - prev).toFixed(1) : null;
                  return (
                    <tr key={entry._id} className="hover:bg-gray-50/60 transition-colors group">
                      <td className="px-6 py-4 text-sm font-semibold text-gray-800">
                        {new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-violet-600">{curr} kg</span>
                      </td>
                      <td className="px-6 py-4">
                        {diff !== null ? (
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                            parseFloat(diff) < 0 ? "bg-emerald-100 text-emerald-700" :
                            parseFloat(diff) > 0 ? "bg-red-100 text-red-600" :
                            "bg-gray-100 text-gray-500"
                          }`}>
                            {parseFloat(diff) < 0 ? "↓" : parseFloat(diff) > 0 ? "↑" : "→"} {Math.abs(diff)} kg
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400 max-w-xs truncate">{entry.notes || "—"}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setDeleteId(entry._id)}
                          className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}