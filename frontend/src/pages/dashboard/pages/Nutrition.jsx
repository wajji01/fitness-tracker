import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE, authHeaders } from "../../../config/api";

const API        = `${API_BASE}/api/nutrition`;
const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"];

const emptyForm = {
  mealType: "Breakfast",
  foodName:  "",
  quantity:  "1 serving",
  calories:  "",
  protein:   "",
  carbs:     "",
  fats:      "",
  date:      new Date().toISOString().split("T")[0],
};

const mealStyles = {
  Breakfast: { badge: "bg-amber-100 text-amber-700",    icon: "🌅" },
  Lunch:     { badge: "bg-emerald-100 text-emerald-700", icon: "☀️" },
  Dinner:    { badge: "bg-violet-100 text-violet-700",   icon: "🌙" },
  Snack:     { badge: "bg-sky-100 text-sky-700",         icon: "🍎" },
};

const macroColors = {
  calories: { bar: "bg-orange-400",  text: "text-orange-600",  bg: "bg-orange-50",  border: "border-orange-100"  },
  protein:  { bar: "bg-violet-500",  text: "text-violet-600",  bg: "bg-violet-50",  border: "border-violet-100"  },
  carbs:    { bar: "bg-sky-400",     text: "text-sky-600",     bg: "bg-sky-50",     border: "border-sky-100"     },
  fats:     { bar: "bg-emerald-400", text: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
};

function toNum(v) { return parseFloat(v) || 0; }

// ── Modal ──────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
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

// ── Nutrition Form ─────────────────────────────────────────────────────────────
function NutritionForm({ initial, onSubmit, onCancel, loading }) {
  const [form,   setForm]   = useState(initial || emptyForm);
  const [errors, setErrors] = useState({});

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: "" })); };

  const validate = () => {
    const e = {};
    if (!form.foodName.trim())  e.foodName = "Food name is required.";
    if (!form.quantity.trim())  e.quantity = "Quantity is required.";
    if (!form.calories || isNaN(form.calories) || +form.calories < 0) e.calories = "Enter valid calories.";
    if (!form.date)             e.date     = "Date is required.";
    return e;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    onSubmit({
      mealType: form.mealType.toLowerCase(),
      foodName: form.foodName,
      quantity: form.quantity,
      calories: toNum(form.calories),
      protein:  toNum(form.protein),
      carbs:    toNum(form.carbs),
      fats:     toNum(form.fats),
      date:     form.date,
    });
  };

  // ── Input class helper (no nested component — prevents focus loss) ──────────
  const inputCls = (name, hasSuffix = false) =>
    `w-full px-3 py-2.5 text-sm rounded-xl border outline-none transition-colors ${hasSuffix ? "pr-12" : ""} ${
      errors[name]
        ? "border-red-200 bg-red-50 focus:border-red-400"
        : "border-gray-200 bg-gray-50 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 focus:bg-white"
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Meal Type */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          Meal Type<span className="text-red-400 ml-0.5">*</span>
        </label>
        <div className="grid grid-cols-4 gap-2">
          {MEAL_TYPES.map(m => (
            <button key={m} type="button" onClick={() => set("mealType", m)}
              className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                form.mealType === m
                  ? "bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-100"
                  : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300"
              }`}>
              {mealStyles[m]?.icon} {m}
            </button>
          ))}
        </div>
      </div>

      {/* Food Name + Quantity + Date */}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Food Name<span className="text-red-400 ml-0.5">*</span>
          </label>
          <input
            type="text" value={form.foodName} onChange={e => set("foodName", e.target.value)}
            placeholder="e.g. Grilled Chicken" className={inputCls("foodName")} autoFocus
          />
          {errors.foodName && <p className="mt-1 text-xs text-red-500">{errors.foodName}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Quantity<span className="text-red-400 ml-0.5">*</span>
          </label>
          <input
            type="text" value={form.quantity} onChange={e => set("quantity", e.target.value)}
            placeholder="e.g. 100g, 1 cup" className={inputCls("quantity")}
          />
          {errors.quantity && <p className="mt-1 text-xs text-red-500">{errors.quantity}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Date<span className="text-red-400 ml-0.5">*</span>
          </label>
          <input
            type="date" value={form.date} onChange={e => set("date", e.target.value)}
            className={inputCls("date")}
          />
          {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date}</p>}
        </div>
      </div>

      {/* Macros */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Calories<span className="text-red-400 ml-0.5">*</span>
          </label>
          <div className="relative">
            <input type="number" value={form.calories} onChange={e => set("calories", e.target.value)}
              placeholder="0" className={inputCls("calories", true)} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium pointer-events-none">kcal</span>
          </div>
          {errors.calories && <p className="mt-1 text-xs text-red-500">{errors.calories}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Protein</label>
          <div className="relative">
            <input type="number" value={form.protein} onChange={e => set("protein", e.target.value)}
              placeholder="0" className={inputCls("protein", true)} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium pointer-events-none">g</span>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Carbs</label>
          <div className="relative">
            <input type="number" value={form.carbs} onChange={e => set("carbs", e.target.value)}
              placeholder="0" className={inputCls("carbs", true)} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium pointer-events-none">g</span>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Fats</label>
          <div className="relative">
            <input type="number" value={form.fats} onChange={e => set("fats", e.target.value)}
              placeholder="0" className={inputCls("fats", true)} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium pointer-events-none">g</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={loading}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white disabled:opacity-60 transition-all flex items-center justify-center gap-2">
          {loading
            ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Saving…</>
            : initial ? "Save Changes" : "Add Meal"}
        </button>
      </div>
    </form>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function Nutrition() {
  const [entries,       setEntries]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [formLoading,   setFormLoading]   = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error,         setError]         = useState("");
  const [showAdd,       setShowAdd]       = useState(false);
  const [editTarget,    setEditTarget]    = useState(null);
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [filterDate,    setFilterDate]    = useState(new Date().toISOString().split("T")[0]);
  const [filterMeal,    setFilterMeal]    = useState("All");
  const [search,        setSearch]        = useState("");

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchEntries = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const { data } = await axios.get(API, authHeaders());
      const raw = Array.isArray(data) ? data : (data.entries || data.nutrition || []);
      // normalize mealType to Title Case for display
      const normalized = raw.map(e => ({
        ...e,
        foodName: e.foodName || e.foodItem || "",
        mealType: e.mealType
          ? e.mealType.charAt(0).toUpperCase() + e.mealType.slice(1).toLowerCase()
          : "Snack",
      }));
      setEntries(normalized);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load nutrition data.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  // ── Add ────────────────────────────────────────────────────────────────────
  const handleAdd = async (form) => {
    setFormLoading(true);
    try {
      const { data } = await axios.post(API, form, authHeaders());
      const entry = data.entry || data.nutrition || data;
      setEntries(p => [{
        ...entry,
        foodName: entry.foodName || entry.foodItem || form.foodName,
        mealType: entry.mealType
          ? entry.mealType.charAt(0).toUpperCase() + entry.mealType.slice(1).toLowerCase()
          : form.mealType,
      }, ...p]);
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
      const entry = data.entry || data.nutrition || data;
      setEntries(p => p.map(e => e._id === editTarget._id ? {
        ...entry,
        foodName: entry.foodName || form.foodName,
        mealType: entry.mealType
          ? entry.mealType.charAt(0).toUpperCase() + entry.mealType.slice(1).toLowerCase()
          : form.mealType,
      } : e));
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

  // ── Filtered entries ───────────────────────────────────────────────────────
  const filtered = entries.filter(e => {
    const dateMatch   = !filterDate || (e.date && e.date.startsWith(filterDate));
    const mealMatch   = filterMeal === "All" || e.mealType === filterMeal;
    const searchMatch = !search || e.foodName?.toLowerCase().includes(search.toLowerCase());
    return dateMatch && mealMatch && searchMatch;
  });

  // ── Daily totals ───────────────────────────────────────────────────────────
  const totals = filtered.reduce(
    (acc, e) => ({
      calories: acc.calories + toNum(e.calories),
      protein:  acc.protein  + toNum(e.protein),
      carbs:    acc.carbs    + toNum(e.carbs),
      fats:     acc.fats     + toNum(e.fats),
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  const macroGoals = { calories: 2000, protein: 150, carbs: 250, fats: 65 };

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900">Nutrition</h2>
          <p className="text-sm text-gray-400 mt-0.5">Track your daily food intake and macros</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-md shadow-violet-100 hover:-translate-y-0.5 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Log Meal
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-sm font-medium flex-1">{error}</p>
          <button onClick={() => setError("")} className="opacity-60 hover:opacity-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* ── Daily Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(totals).map(([key, val]) => {
          const c    = macroColors[key];
          const goal = macroGoals[key];
          const pct  = Math.min((val / goal) * 100, 100);
          const unit = key === "calories" ? "kcal" : "g";
          return (
            <div key={key} className={`rounded-2xl border ${c.border} ${c.bg} p-4`}>
              <p className={`text-xs font-semibold uppercase tracking-wide ${c.text} mb-1`}>{key}</p>
              <p className={`text-2xl font-extrabold ${c.text}`}>
                {Math.round(val)}<span className="text-sm font-semibold ml-0.5">{unit}</span>
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Goal: {goal}{unit}</p>
              <div className="mt-2 h-1.5 bg-white/60 rounded-full overflow-hidden">
                <div className={`h-full ${c.bar} rounded-full transition-all`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Search ── */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search food name…"
          className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-colors" />
        {search && (
          <button onClick={() => setSearch("")}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
          className="px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-colors" />
        <div className="flex gap-2 flex-wrap">
          {["All", ...MEAL_TYPES].map(m => (
            <button key={m} onClick={() => setFilterMeal(m)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                filterMeal === m
                  ? "bg-violet-600 text-white border-violet-600"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
              }`}>
              {m !== "All" && mealStyles[m]?.icon + " "}{m}
            </button>
          ))}
        </div>
      </div>

      {/* ── Entries List ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3">
          <svg className="w-6 h-6 animate-spin text-violet-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <span className="text-sm text-gray-400">Loading meals...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-4 text-3xl">🍽️</div>
          <p className="text-sm font-semibold text-gray-500">
            {search ? `No results for "${search}"` : "No meals logged"}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {search ? "Try a different search term" : "Click \"Log Meal\" to add your first entry"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(entry => {
            const ms   = mealStyles[entry.mealType] || mealStyles.Snack;
            const date = entry.date ? new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
            return (
              <div key={entry._id} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  {/* Meal icon */}
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl flex-shrink-0">
                    {ms.icon}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-gray-900 truncate">{entry.foodName}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ms.badge}`}>
                        {entry.mealType}
                      </span>
                      {entry.quantity && (
                        <span className="text-xs text-gray-400">{entry.quantity}</span>
                      )}
                    </div>
                    {date && <p className="text-xs text-gray-400 mt-0.5">{date}</p>}

                    {/* Macros */}
                    <div className="flex gap-4 mt-2 flex-wrap">
                      {[
                        { label: "Cal",     val: entry.calories, unit: "kcal", color: "text-orange-600" },
                        { label: "Protein", val: entry.protein,  unit: "g",    color: "text-violet-600" },
                        { label: "Carbs",   val: entry.carbs,    unit: "g",    color: "text-sky-600"    },
                        { label: "Fats",    val: entry.fats,     unit: "g",    color: "text-emerald-600"},
                      ].map(m => (
                        <div key={m.label} className="text-center">
                          <p className={`text-xs font-bold ${m.color}`}>{toNum(m.val)}<span className="font-normal ml-0.5">{m.unit}</span></p>
                          <p className="text-xs text-gray-400">{m.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button onClick={() => setEditTarget({
                      ...entry,
                      mealType: entry.mealType,
                      date: entry.date ? entry.date.split("T")[0] : new Date().toISOString().split("T")[0],
                    })}
                      className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-violet-50 text-gray-400 hover:text-violet-600 flex items-center justify-center transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                      </svg>
                    </button>
                    <button onClick={() => setDeleteTarget(entry)}
                      className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add Modal ── */}
      {showAdd && (
        <Modal title="Log a Meal" onClose={() => setShowAdd(false)}>
          <NutritionForm
            onSubmit={handleAdd}
            onCancel={() => setShowAdd(false)}
            loading={formLoading}
          />
        </Modal>
      )}

      {/* ── Edit Modal ── */}
      {editTarget && (
        <Modal title="Edit Meal" onClose={() => setEditTarget(null)}>
          <NutritionForm
            initial={editTarget}
            onSubmit={handleEdit}
            onCancel={() => setEditTarget(null)}
            loading={formLoading}
          />
        </Modal>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteTarget && (
        <Modal title="Delete Entry" onClose={() => setDeleteTarget(null)}>
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto text-2xl">🗑️</div>
            <div>
              <p className="font-bold text-gray-900">Delete "{deleteTarget.foodName}"?</p>
              <p className="text-sm text-gray-400 mt-1">This action cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleteLoading}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500 hover:bg-red-600 text-white disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
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