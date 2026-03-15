import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE, authHeaders } from "../../../config/api";
import { useReminderNotifications } from "./useReminderNotifications";

const API  = `${API_BASE}/api/reminders`;
const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

const TYPE_CONFIG = {
  workout: { label: "Workout",      emoji: "💪", bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-700", dot: "bg-violet-500", badge: "bg-violet-100 text-violet-700" },
  meal:    { label: "Meal",         emoji: "🥗", bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700" },
  goal:    { label: "Fitness Goal", emoji: "🎯", bg: "bg-orange-50",  border: "border-orange-200",  text: "text-orange-700",  dot: "bg-orange-500",  badge: "bg-orange-100 text-orange-700"  },
};

const empty = {
  title: "", type: "workout", time: "07:00",
  days: ["Mon","Tue","Wed","Thu","Fri"], note: "",
};

// ── Toggle switch ────────────────────────────────────────────────────────────
function Toggle({ on, onChange }) {
  return (
    <button onClick={onChange} type="button"
      className={`relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0
        ${on ? "bg-violet-600" : "bg-gray-200"}`}>
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow
        transition-transform duration-200 ${on ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}

// ── Reminder Card ────────────────────────────────────────────────────────────
function ReminderCard({ r, onToggle, onDelete, deleting }) {
  const cfg = TYPE_CONFIG[r.type] || TYPE_CONFIG.workout;
  const fmt12 = (t) => {
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12  = h % 12 || 12;
    return `${h12}:${String(m).padStart(2,"0")} ${ampm}`;
  };

  return (
    <div className={`group bg-white rounded-2xl border ${r.isActive ? "border-gray-100" : "border-gray-100 opacity-60"}
      shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden`}
      style={{ animation: "fadeUp .35s ease both" }}>

      {/* Top accent stripe */}
      <div className={`h-1 w-full ${cfg.dot}`} />

      <div className="p-5">
        <div className="flex items-start gap-3">
          {/* Emoji icon */}
          <div className={`w-11 h-11 rounded-xl ${cfg.bg} ${cfg.border} border
            flex items-center justify-center text-xl flex-shrink-0`}>
            {cfg.emoji}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`font-bold text-gray-900 truncate ${!r.isActive ? "line-through text-gray-400" : ""}`}>
                {r.title}
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${cfg.badge}`}>
                {cfg.label}
              </span>
            </div>

            {/* Time */}
            <div className="flex items-center gap-1.5 mt-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span className="text-sm font-bold text-gray-700">{fmt12(r.time)}</span>
            </div>

            {/* Days */}
            <div className="flex gap-1 mt-2.5 flex-wrap">
              {DAYS.map(d => (
                <span key={d} className={`text-[10px] font-bold px-2 py-0.5 rounded-lg
                  ${r.days.includes(d)
                    ? `${cfg.dot} text-white`
                    : "bg-gray-100 text-gray-400"}`}>
                  {d}
                </span>
              ))}
            </div>

            {/* Note */}
            {r.note && (
              <p className="text-xs text-gray-400 mt-2 line-clamp-1">{r.note}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Toggle on={r.isActive} onChange={() => onToggle(r._id)} />
            <button onClick={() => onDelete(r._id)} disabled={deleting === r._id}
              className="w-8 h-8 rounded-xl hover:bg-red-50 text-gray-300 hover:text-red-500
                flex items-center justify-center transition-colors">
              {deleting === r._id
                ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                : <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Main Component
// ════════════════════════════════════════════════════════════════════════════
export default function Reminders() {
  const { permission, requestPermission } = useReminderNotifications();

  const [reminders, setReminders] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [deleting,  setDeleting]  = useState("");
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState("");
  const [form,      setForm]      = useState(empty);
  const [filter,    setFilter]    = useState("all"); // all | workout | meal | goal

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchReminders = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(API, authHeaders());
      setReminders(Array.isArray(data) ? data : []);
    } catch { setError("Failed to load reminders."); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { fetchReminders(); }, [fetchReminders]);

  // auto-clear success
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(""), 3500);
    return () => clearTimeout(t);
  }, [success]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const toggleDay = (d) =>
    setForm(p => ({
      ...p,
      days: p.days.includes(d) ? p.days.filter(x => x !== d) : [...p.days, d],
    }));

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return setError("Title is required.");
    if (!form.days.length)  return setError("Select at least one day.");
    setSaving(true); setError("");
    try {
      const { data } = await axios.post(API, form, authHeaders());
      setReminders(p => [data, ...p]);
      setForm(empty);
      setSuccess("Reminder created! 🎉");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create reminder.");
    } finally { setSaving(false); }
  };

  // ── Toggle active ─────────────────────────────────────────────────────────
  const handleToggle = async (id) => {
    try {
      const { data } = await axios.patch(`${API}/${id}/toggle`, {}, authHeaders());
      setReminders(p => p.map(r => r._id === id ? data : r));
    } catch { setError("Failed to update reminder."); }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await axios.delete(`${API}/${id}`, authHeaders());
      setReminders(p => p.filter(r => r._id !== id));
    } catch { setError("Failed to delete reminder."); }
    finally  { setDeleting(""); }
  };

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = filter === "all" ? reminders : reminders.filter(r => r.type === filter);
  const counts   = { all: reminders.length, workout: 0, meal: 0, goal: 0 };
  reminders.forEach(r => { if (counts[r.type] !== undefined) counts[r.type]++; });

  const inputCls = "w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 " +
    "focus:border-violet-400 focus:ring-2 focus:ring-violet-100 focus:bg-white outline-none transition-all";

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .line-clamp-1 { overflow:hidden; display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; }
      `}</style>

      <div className="space-y-6">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={{ animation:"fadeUp .4s ease both" }}>
          <h2 className="text-xl font-extrabold text-gray-900">Reminders</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Schedule workout, meal, and goal reminders
          </p>
        </div>

        {/* ── Notification permission banner ─────────────────────────── */}
        {permission === "default" && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200
            text-amber-800 rounded-2xl px-4 py-3 text-sm font-medium">
            <span className="text-lg">🔔</span>
            <p className="flex-1">Enable notifications to get alerted when a reminder fires.</p>
            <button onClick={requestPermission}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl
                text-xs font-bold transition-colors">
              Enable
            </button>
          </div>
        )}
        {permission === "denied" && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200
            text-red-700 rounded-2xl px-4 py-3 text-sm font-medium">
            <span className="text-lg">🚫</span>
            <p>Notifications are blocked. Enable them in your browser settings to receive reminders.</p>
          </div>
        )}

        {/* ── Alerts ─────────────────────────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200
            text-red-700 rounded-2xl px-4 py-3 text-sm font-medium">
            <span>⚠️</span>
            <p className="flex-1">{error}</p>
            <button onClick={()=>setError("")} className="opacity-50 hover:opacity-100 text-lg">×</button>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200
            text-emerald-700 rounded-2xl px-4 py-3 text-sm font-medium">
            <span>✅</span><p>{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── LEFT: Create Form ──────────────────────────────────────── */}
          <div className="lg:col-span-2" style={{ animation:"fadeUp .4s ease .06s both" }}>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-6">
              {/* Form header */}
              <div className="px-6 py-4 border-b border-gray-50 bg-gradient-to-r from-violet-600 to-purple-700">
                <h3 className="text-sm font-bold text-white">New Reminder</h3>
                <p className="text-xs text-violet-200 mt-0.5">Set up a recurring reminder</p>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">

                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                    Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={form.title}
                    onChange={e => setF("title", e.target.value)}
                    placeholder="e.g. Morning Workout"
                    className={inputCls}
                    autoFocus
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                    Type <span className="text-red-400">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                      <button key={key} type="button" onClick={() => setF("type", key)}
                        className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-xs font-bold
                          transition-all active:scale-95
                          ${form.type === key
                            ? `${cfg.bg} ${cfg.border} ${cfg.text}`
                            : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                        <span className="text-xl">{cfg.emoji}</span>
                        {cfg.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                    Time <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={e => setF("time", e.target.value)}
                    className={inputCls}
                  />
                </div>

                {/* Days */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                    Repeat Days <span className="text-red-400">*</span>
                  </label>
                  <div className="flex gap-1.5 flex-wrap">
                    {DAYS.map(d => (
                      <button key={d} type="button" onClick={() => toggleDay(d)}
                        className={`w-10 h-10 rounded-xl text-xs font-bold border-2 transition-all active:scale-95
                          ${form.days.includes(d)
                            ? "bg-violet-600 border-violet-600 text-white"
                            : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                        {d}
                      </button>
                    ))}
                  </div>
                  {/* Quick presets */}
                  <div className="flex gap-2 mt-2">
                    {[
                      { label: "Weekdays", days: ["Mon","Tue","Wed","Thu","Fri"] },
                      { label: "Everyday", days: [...DAYS] },
                      { label: "Weekend",  days: ["Sat","Sun"] },
                    ].map(p => (
                      <button key={p.label} type="button"
                        onClick={() => setF("days", p.days)}
                        className="text-[10px] font-bold text-violet-600 hover:text-violet-800
                          bg-violet-50 hover:bg-violet-100 px-2.5 py-1 rounded-lg transition-colors">
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Note */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                    Note <span className="text-gray-400 font-normal normal-case">(optional)</span>
                  </label>
                  <textarea
                    value={form.note}
                    onChange={e => setF("note", e.target.value)}
                    placeholder="Add details…"
                    rows={2}
                    className={`${inputCls} resize-none`}
                  />
                </div>

                {/* Submit */}
                <button type="submit" disabled={saving}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white
                    bg-gradient-to-r from-violet-600 to-purple-700
                    hover:from-violet-700 hover:to-purple-800
                    shadow-md shadow-violet-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                    flex items-center justify-center gap-2
                    transition-all hover:-translate-y-0.5 active:translate-y-0">
                  {saving ? (
                    <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Creating…</>
                  ) : (
                    <><svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>Create Reminder</>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* ── RIGHT: Reminder List ───────────────────────────────────── */}
          <div className="lg:col-span-3 space-y-4" style={{ animation:"fadeUp .4s ease .12s both" }}>

            {/* Filter tabs */}
            <div className="flex gap-2 flex-wrap">
              {[
                { key: "all",     label: "All",          emoji: "🔔" },
                { key: "workout", label: "Workouts",     emoji: "💪" },
                { key: "meal",    label: "Meals",        emoji: "🥗" },
                { key: "goal",    label: "Goals",        emoji: "🎯" },
              ].map(tab => (
                <button key={tab.key} onClick={() => setFilter(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold
                    border transition-all
                    ${filter === tab.key
                      ? "bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-100"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"}`}>
                  {tab.emoji} {tab.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold
                    ${filter === tab.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                    {counts[tab.key] ?? 0}
                  </span>
                </button>
              ))}
            </div>

            {/* Cards */}
            {loading ? (
              <div className="flex items-center justify-center py-20 gap-3">
                <svg className="w-5 h-5 animate-spin text-violet-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <span className="text-sm text-gray-400">Loading reminders…</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 py-20 text-center">
                <div className="text-5xl mb-4">🔔</div>
                <p className="text-sm font-semibold text-gray-500">
                  {filter === "all" ? "No reminders yet" : `No ${filter} reminders`}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {filter === "all" ? "Create your first reminder on the left" : `Switch type or create a ${filter} reminder`}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(r => (
                  <ReminderCard
                    key={r._id}
                    r={r}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    deleting={deleting}
                  />
                ))}
              </div>
            )}

            {/* Stats footer */}
            {reminders.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  {[
                    { label: "Total",    value: counts.all,                                      color: "text-violet-600" },
                    { label: "Active",   value: reminders.filter(r=>r.isActive).length,          color: "text-emerald-600" },
                    { label: "Inactive", value: reminders.filter(r=>!r.isActive).length,         color: "text-gray-400" },
                  ].map(s => (
                    <div key={s.label}>
                      <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-gray-400 font-medium">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}