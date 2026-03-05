import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const API = "http://localhost:5000/api/workouts";
const CATEGORIES = ["Strength", "Cardio"];
const emptyForm = { exercise: "", sets: "", reps: "", weight: "", category: "Strength", notes: "" };

const categoryStyles = {
  Strength:    "bg-violet-100 text-violet-700",
  Cardio:      "bg-sky-100 text-sky-700",
  Flexibility: "bg-emerald-100 text-emerald-700",
  HIIT:        "bg-orange-100 text-orange-700",
};

function authHeaders() {
  return { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } };
}

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

// ── Workout Form ───────────────────────────────────────────────────────────────
function WorkoutForm({ initial, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(initial || emptyForm);
  const [errors, setErrors] = useState({});

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: "" })); };

  const validate = () => {
    const e = {};
    if (!form.exercise.trim()) e.exercise = "Exercise name is required.";
    if (!form.sets || isNaN(form.sets) || +form.sets < 1) e.sets = "Enter valid sets.";
    if (!form.reps || isNaN(form.reps) || +form.reps < 1) e.reps = "Enter valid reps.";
    if (form.weight !== "" && isNaN(form.weight)) e.weight = "Enter valid weight.";
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    onSubmit({ ...form, sets: +form.sets, reps: +form.reps, weight: form.weight === "" ? null : +form.weight });
  };

  const Field = ({ label, name, type = "text", placeholder, required }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type={type} value={form[name]} onChange={e => set(name, e.target.value)} placeholder={placeholder}
        className={`w-full px-3 py-2.5 text-sm rounded-xl border outline-none transition-colors ${
          errors[name]
            ? "border-red-200 bg-red-50"
            : "border-gray-200 bg-gray-50 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 focus:bg-white"
        }`}
      />
      {errors[name] && <p className="mt-1 text-xs text-red-500">{errors[name]}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Exercise Name" name="exercise" placeholder="e.g. Bench Press" required />
      <div className="grid grid-cols-3 gap-3">
        <Field label="Sets"       name="sets"   type="number" placeholder="3"  required />
        <Field label="Reps"       name="reps"   type="number" placeholder="10" required />
        <Field label="Weight (kg)" name="weight" type="number" placeholder="60" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          Category<span className="text-red-400 ml-0.5">*</span>
        </label>
        <div className="flex gap-2">
          {CATEGORIES.map(c => (
            <button key={c} type="button" onClick={() => set("category", c)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                form.category === c
                  ? c === "Strength" ? "bg-violet-600 text-white border-violet-600" : "bg-sky-500 text-white border-sky-500"
                  : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300"
              }`}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
        <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={3}
          placeholder="Optional notes about this workout..."
          className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 focus:bg-white outline-none transition-colors resize-none" />
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
            : initial ? "Save Changes" : "Add Workout"}
        </button>
      </div>
    </form>
  );
}

// ── Main WorkoutsPanel ─────────────────────────────────────────────────────────
export default function WorkoutsPanel() {
  const [workouts,      setWorkouts]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [formLoading,   setFormLoading]   = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error,         setError]         = useState("");
  const [search,        setSearch]        = useState("");
  const [view,          setView]          = useState("table");
  const [showAdd,       setShowAdd]       = useState(false);
  const [editTarget,    setEditTarget]    = useState(null);
  const [deleteTarget,  setDeleteTarget]  = useState(null);

  const fetchWorkouts = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const { data } = await axios.get(API, authHeaders());
      setWorkouts(Array.isArray(data) ? data : data.workouts || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load workouts.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchWorkouts(); }, [fetchWorkouts]);

  const handleAdd = async (form) => {
    setFormLoading(true);
    try {
      const { data } = await axios.post(API, form, authHeaders());
      setWorkouts(p => [data.workout || data, ...p]);
      setShowAdd(false);
    } catch (err) { setError(err?.response?.data?.message || "Failed to add workout."); }
    finally { setFormLoading(false); }
  };

  const handleEdit = async (form) => {
    setFormLoading(true);
    try {
      const { data } = await axios.put(`${API}/${editTarget._id}`, form, authHeaders());
      setWorkouts(p => p.map(w => w._id === editTarget._id ? (data.workout || data) : w));
      setEditTarget(null);
    } catch (err) { setError(err?.response?.data?.message || "Failed to update workout."); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await axios.delete(`${API}/${deleteTarget._id}`, authHeaders());
      setWorkouts(p => p.filter(w => w._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) { setError(err?.response?.data?.message || "Failed to delete workout."); }
    finally { setDeleteLoading(false); }
  };

  const filtered = workouts.filter(w =>
    w.exercise?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Modals */}
      {showAdd && (
        <Modal title="Add Workout" onClose={() => setShowAdd(false)}>
          <WorkoutForm onSubmit={handleAdd} onCancel={() => setShowAdd(false)} loading={formLoading} />
        </Modal>
      )}
      {editTarget && (
        <Modal title="Edit Workout" onClose={() => setEditTarget(null)}>
          <WorkoutForm initial={editTarget} onSubmit={handleEdit} onCancel={() => setEditTarget(null)} loading={formLoading} />
        </Modal>
      )}
      {deleteTarget && (
        <Modal title="Delete Workout" onClose={() => setDeleteTarget(null)}>
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-gray-900">Delete "{deleteTarget.exercise}"?</p>
              <p className="text-sm text-gray-500 mt-1">This action cannot be undone.</p>
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900">Workouts</h2>
          <p className="text-sm text-gray-400 mt-0.5">{workouts.length} workout{workouts.length !== 1 ? "s" : ""} logged</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-violet-100 hover:-translate-y-0.5 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Workout
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
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Toolbar: Search + View Toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by exercise name…"
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-colors" />
          {search && (
            <button onClick={() => setSearch("")} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1">
          {[
            ["table", "M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h1.5m-1.5 0c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5"],
            ["cards", "M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"],
          ].map(([v, d]) => (
            <button key={v} onClick={() => setView(v)} className={`p-2 rounded-lg transition-colors ${view === v ? "bg-violet-100 text-violet-600" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d={d} />
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3">
          <svg className="w-6 h-6 animate-spin text-violet-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <span className="text-sm text-gray-400">Loading workouts…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center bg-white rounded-2xl border border-gray-100">
          <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-violet-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-gray-800">{search ? "No workouts found" : "No workouts yet"}</p>
            <p className="text-sm text-gray-400 mt-1">{search ? `No results for "${search}"` : "Add your first workout!"}</p>
          </div>
          {!search && (
            <button onClick={() => setShowAdd(true)} className="text-sm font-semibold text-violet-600 hover:text-violet-700">+ Add Workout</button>
          )}
        </div>
      ) : view === "table" ? (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Exercise", "Category", "Sets", "Reps", "Weight", "Notes", "Actions"].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(w => (
                  <tr key={w._id} className="hover:bg-gray-50/60 transition-colors group">
                    <td className="px-5 py-4 text-sm font-semibold text-gray-900">{w.exercise}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${categoryStyles[w.category] || "bg-gray-100 text-gray-600"}`}>{w.category}</span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700 font-medium">{w.sets}</td>
                    <td className="px-5 py-4 text-sm text-gray-700 font-medium">{w.reps}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">{w.weight != null ? `${w.weight} kg` : "—"}</td>
                    <td className="px-5 py-4 text-sm text-gray-400 max-w-[160px] truncate">{w.notes || "—"}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditTarget(w)} className="w-8 h-8 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-600 flex items-center justify-center transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                          </svg>
                        </button>
                        <button onClick={() => setDeleteTarget(w)} className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(w => (
            <div key={w._id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-gray-900 truncate">{w.exercise}</h3>
                  <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${categoryStyles[w.category] || "bg-gray-100 text-gray-600"}`}>{w.category}</span>
                </div>
                <div className="flex gap-1.5 ml-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button onClick={() => setEditTarget(w)} className="w-8 h-8 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-600 flex items-center justify-center transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                    </svg>
                  </button>
                  <button onClick={() => setDeleteTarget(w)} className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[["Sets", w.sets], ["Reps", w.reps], ["Weight", w.weight != null ? `${w.weight}kg` : "—"]].map(([label, val]) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-2.5 text-center">
                    <p className="text-xs text-gray-400 font-medium">{label}</p>
                    <p className="text-sm font-bold text-gray-800 mt-0.5">{val}</p>
                  </div>
                ))}
              </div>
              {w.notes && <p className="text-xs text-gray-400 line-clamp-2 border-t border-gray-50 pt-3">{w.notes}</p>}
            </div>
          ))}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <p className="text-center text-xs text-gray-400">
          Showing {filtered.length} of {workouts.length} workout{workouts.length !== 1 ? "s" : ""}
          {search && ` matching "${search}"`}
        </p>
      )}
    </div>
  );
}