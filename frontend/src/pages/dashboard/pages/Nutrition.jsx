import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const API = "http://localhost:5000/api/nutrition";
const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"];

const emptyForm = {
  mealType: "Breakfast",
  foodItem: "",
  calories: "",
  protein: "",
  carbs: "",
  fats: "",
  date: new Date().toISOString().split("T")[0],
};

const mealStyles = {
  Breakfast: { badge: "bg-amber-100 text-amber-700",   icon: "🌅" },
  Lunch:     { badge: "bg-emerald-100 text-emerald-700", icon: "☀️" },
  Dinner:    { badge: "bg-violet-100 text-violet-700",  icon: "🌙" },
  Snack:     { badge: "bg-sky-100 text-sky-700",        icon: "🍎" },
};

const macroColors = {
  calories: { bar: "bg-orange-400",  text: "text-orange-600",  bg: "bg-orange-50",  border: "border-orange-100" },
  protein:  { bar: "bg-violet-500",  text: "text-violet-600",  bg: "bg-violet-50",  border: "border-violet-100" },
  carbs:    { bar: "bg-sky-400",     text: "text-sky-600",     bg: "bg-sky-50",     border: "border-sky-100"    },
  fats:     { bar: "bg-emerald-400", text: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100"},
};

function authHeaders() {
  return { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } };
}

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
  const [form, setForm] = useState(initial || emptyForm);
  const [errors, setErrors] = useState({});

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: "" })); };

  const validate = () => {
    const e = {};
    if (!form.foodItem.trim()) e.foodItem = "Food item is required.";
    if (!form.calories || isNaN(form.calories) || +form.calories < 0) e.calories = "Enter valid calories.";
    if (!form.date) e.date = "Date is required.";
    return e;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    onSubmit({
      ...form,
      calories: toNum(form.calories),
      protein:  toNum(form.protein),
      carbs:    toNum(form.carbs),
      fats:     toNum(form.fats),
    });
  };

  const Field = ({ label, name, type = "text", placeholder, required, suffix }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <input
          type={type} value={form[name]} onChange={e => set(name, e.target.value)}
          placeholder={placeholder}
          className={`w-full px-3 py-2.5 text-sm rounded-xl border outline-none transition-colors ${suffix ? "pr-10" : ""} ${
            errors[name]
              ? "border-red-200 bg-red-50 focus:border-red-400"
              : "border-gray-200 bg-gray-50 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 focus:bg-white"
          }`}
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">{suffix}</span>}
      </div>
      {errors[name] && <p className="mt-1 text-xs text-red-500">{errors[name]}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Meal type */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Meal Type<span className="text-red-400 ml-0.5">*</span></label>
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

      {/* Food + Date */}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Field label="Food Item" name="foodItem" placeholder="e.g. Grilled Chicken" required />
        </div>
        <div className="col-span-2">
          <Field label="Date" name="date" type="date" required />
          {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date}</p>}
        </div>
      </div>

      {/* Macros */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Calories"  name="calories" type="number" placeholder="0" suffix="kcal" required />
        <Field label="Protein"   name="protein"  type="number" placeholder="0" suffix="g" />
        <Field label="Carbs"     name="carbs"    type="number" placeholder="0" suffix="g" />
        <Field label="Fats"      name="fats"     type="number" placeholder="0" suffix="g" />
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

  const fetchEntries = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const { data } = await axios.get(API, authHeaders());
      setEntries(Array.isArray(data) ? data : data.entries || data.nutrition || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load nutrition data.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const handleAdd = async (form) => {
    setFormLoading(true);
    try {
      const { data } = await axios.post(API, form, authHeaders());
      setEntries(p => [data.entry || data, ...p]);
      setShowAdd(false);
    } catch (err) { setError(err?.response?.data?.message || "Failed to add entry."); }
    finally { setFormLoading(false); }
  };

  const handleEdit = async (form) => {
    setFormLoading(true);
    try {
      const { data } = await axios.put(`${API}/${editTarget._id}`, form, authHeaders());
      setEntries(p => p.map(e => e._id === editTarget._id ? (data.entry || data) : e));
      setEditTarget(null);
    } catch (err) { setError(err?.response?.data?.message || "Failed to update entry."); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await axios.delete(`${API}/${deleteTarget._id}`, authHeaders());
      setEntries(p => p.filter(e => e._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) { setError(err?.response?.data?.message || "Failed to delete entry."); }
    finally { setDeleteLoading(false); }
  };

  // Filter
  const filtered = entries.filter(e => {
    const dateMatch = filterDate ? e.date?.split("T")[0] === filterDate : true;
    const mealMatch = filterMeal === "All" ? true : e.mealType === filterMeal;
    return dateMatch && mealMatch;
  });

  // Daily totals (for selected date)
  const totals = filtered.reduce((acc, e) => ({
    calories: acc.calories + toNum(e.calories),
    protein:  acc.protein  + toNum(e.protein),
    carbs:    acc.carbs    + toNum(e.carbs),
    fats:     acc.fats     + toNum(e.fats),
  }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

  const calGoal = 2200;
  const calPct  = Math.min(100, Math.round((totals.calories / calGoal) * 100));

  // Group filtered by meal type
  const grouped = MEAL_TYPES.reduce((acc, m) => {
    acc[m] = filtered.filter(e => e.mealType === m);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Modals */}
      {showAdd && (
        <Modal title="Log Meal" onClose={() => setShowAdd(false)}>
          <NutritionForm onSubmit={handleAdd} onCancel={() => setShowAdd(false)} loading={formLoading} />
        </Modal>
      )}
      {editTarget && (
        <Modal title="Edit Meal" onClose={() => setEditTarget(null)}>
          <NutritionForm
            initial={{ ...editTarget, date: editTarget.date?.split("T")[0] }}
            onSubmit={handleEdit} onCancel={() => setEditTarget(null)} loading={formLoading}
          />
        </Modal>
      )}
      {deleteTarget && (
        <Modal title="Delete Entry" onClose={() => setDeleteTarget(null)}>
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-gray-900">Delete "{deleteTarget.foodItem}"?</p>
              <p className="text-sm text-gray-500 mt-1">This cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50">Cancel</button>
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

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900">Nutrition</h2>
          <p className="text-sm text-gray-400 mt-0.5">{filtered.length} meal{filtered.length !== 1 ? "s" : ""} logged</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-violet-100 hover:-translate-y-0.5 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Log Meal
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
            className="pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-colors" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["All", ...MEAL_TYPES].map(m => (
            <button key={m} onClick={() => setFilterMeal(m)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                filterMeal === m
                  ? "bg-violet-600 text-white border-violet-600"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
              }`}>
              {m !== "All" ? `${mealStyles[m]?.icon} ` : ""}{m}
            </button>
          ))}
        </div>
      </div>

      {/* Daily Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { key: "calories", label: "Calories", unit: "kcal" },
          { key: "protein",  label: "Protein",  unit: "g" },
          { key: "carbs",    label: "Carbs",    unit: "g" },
          { key: "fats",     label: "Fats",     unit: "g" },
        ].map(({ key, label, unit }) => {
          const c = macroColors[key];
          return (
            <div key={key} className={`rounded-2xl border ${c.border} ${c.bg} p-4`}>
              <p className={`text-xs font-semibold ${c.text} mb-1`}>{label}</p>
              <p className="text-2xl font-extrabold text-gray-900 tracking-tight">
                {totals[key].toFixed(key === "calories" ? 0 : 1)}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{unit}</p>
            </div>
          );
        })}
      </div>

      {/* Calorie Progress Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-bold text-gray-800">Daily Calorie Goal</p>
            <p className="text-xs text-gray-400 mt-0.5">{totals.calories.toFixed(0)} / {calGoal} kcal</p>
          </div>
          <span className={`text-sm font-bold ${calPct >= 100 ? "text-red-500" : calPct >= 80 ? "text-amber-500" : "text-emerald-600"}`}>
            {calPct}%
          </span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${calPct >= 100 ? "bg-red-400" : calPct >= 80 ? "bg-amber-400" : "bg-gradient-to-r from-violet-500 to-purple-500"}`}
            style={{ width: `${calPct}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-gray-400">0 kcal</span>
          <span className="text-xs text-gray-400">{calGoal} kcal goal</span>
        </div>
      </div>

      {/* Entries */}
      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3">
          <svg className="w-6 h-6 animate-spin text-violet-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <span className="text-sm text-gray-400">Loading nutrition data…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center bg-white rounded-2xl border border-gray-100">
          <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center text-2xl">🥗</div>
          <div>
            <p className="font-bold text-gray-800">No meals logged</p>
            <p className="text-sm text-gray-400 mt-1">Log your first meal for this day!</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="text-sm font-semibold text-violet-600 hover:text-violet-700">+ Log Meal</button>
        </div>
      ) : (
        <div className="space-y-4">
          {MEAL_TYPES.map(meal => {
            const items = grouped[meal];
            if (filterMeal !== "All" && filterMeal !== meal) return null;
            if (items.length === 0) return null;
            const mealCals = items.reduce((s, e) => s + toNum(e.calories), 0);
            const s = mealStyles[meal];
            return (
              <div key={meal} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {/* Meal header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{s.icon}</span>
                    <span className="text-sm font-bold text-gray-800">{meal}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.badge}`}>{items.length} item{items.length !== 1 ? "s" : ""}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-500">{mealCals.toFixed(0)} kcal</span>
                </div>

                {/* Items */}
                <div className="divide-y divide-gray-50">
                  {items.map(entry => (
                    <div key={entry._id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/60 transition-colors group">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{entry.foodItem}</p>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="text-xs text-orange-500 font-medium">{toNum(entry.calories).toFixed(0)} kcal</span>
                          {toNum(entry.protein) > 0 && <span className="text-xs text-violet-500 font-medium">P: {toNum(entry.protein).toFixed(1)}g</span>}
                          {toNum(entry.carbs)   > 0 && <span className="text-xs text-sky-500 font-medium">C: {toNum(entry.carbs).toFixed(1)}g</span>}
                          {toNum(entry.fats)    > 0 && <span className="text-xs text-emerald-500 font-medium">F: {toNum(entry.fats).toFixed(1)}g</span>}
                        </div>
                      </div>

                      {/* Macro mini bars */}
                      <div className="hidden md:flex items-center gap-1.5 mx-6">
                        {[
                          { val: toNum(entry.protein), max: 50,  color: "bg-violet-400" },
                          { val: toNum(entry.carbs),   max: 100, color: "bg-sky-400"    },
                          { val: toNum(entry.fats),    max: 40,  color: "bg-emerald-400"},
                        ].map(({ val, max, color }, i) => (
                          <div key={i} className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, (val / max) * 100)}%` }} />
                          </div>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button onClick={() => setEditTarget(entry)}
                          className="w-8 h-8 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-600 flex items-center justify-center transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                          </svg>
                        </button>
                        <button onClick={() => setDeleteTarget(entry)}
                          className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Meal macro summary */}
                <div className="px-5 py-3 bg-gray-50/60 border-t border-gray-50 flex items-center gap-4 flex-wrap">
                  {[
                    { label: "Protein", val: items.reduce((s,e) => s + toNum(e.protein), 0), color: "text-violet-600" },
                    { label: "Carbs",   val: items.reduce((s,e) => s + toNum(e.carbs),   0), color: "text-sky-600"    },
                    { label: "Fats",    val: items.reduce((s,e) => s + toNum(e.fats),    0), color: "text-emerald-600"},
                  ].map(({ label, val, color }) => (
                    <span key={label} className={`text-xs font-semibold ${color}`}>
                      {label}: {val.toFixed(1)}g
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}