import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE, BACKEND_URL, authHeaders } from "../../../config/api";

const USERS_API    = `${API_BASE}/api/users/me`;
const SETTINGS_API = `${API_BASE}/api/settings`;

function getAvatarUrl(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${BACKEND_URL}/${path.replace(/^\//, "")}`;
}

// ── Apply theme to <html> immediately ─────────────────────────────────────
function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else if (theme === "system") {
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? root.classList.add("dark")
      : root.classList.remove("dark");
  } else {
    root.classList.remove("dark");
  }
}

// ── Small helpers ──────────────────────────────────────────────────────────
const Toggle = ({ on, onChange, disabled }) => (
  <button type="button" onClick={onChange} disabled={disabled}
    className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0
      ${on ? "bg-violet-600" : "bg-gray-200"} ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}>
    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow
      transition-transform duration-200 ${on ? "translate-x-5" : "translate-x-0"}`} />
  </button>
);

function SectionHeader({ icon, title, description }) {
  return (
    <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
      <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
    </div>
  );
}

function SaveBtn({ loading, label = "Save Changes", onClick, disabled, variant = "primary" }) {
  const base = "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed";
  const styles = {
    primary: "bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white shadow-md shadow-violet-200 hover:-translate-y-0.5",
    danger:  "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200",
  };
  return (
    <button onClick={onClick} disabled={loading || disabled} className={`${base} ${styles[variant]}`}>
      {loading
        ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Saving…</>
        : label}
    </button>
  );
}

function Msg({ type, text, onClose }) {
  if (!text) return null;
  const s = type === "success"
    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
    : "bg-red-50 border-red-200 text-red-600";
  return (
    <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${s}`}>
      <span>{type === "success" ? "✅" : "⚠️"}</span>
      <p className="flex-1">{text}</p>
      <button onClick={onClose} className="opacity-60 hover:opacity-100 text-lg leading-none">×</button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
export default function Settings() {
  const navigate = useNavigate();
  const fileRef  = useRef(null);
  const [pageLoading, setPageLoading] = useState(true);

  // Profile
  const [profile,       setProfile]       = useState({ name: "", email: "", avatar: "" });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg,    setProfileMsg]    = useState({ type: "", text: "" });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile,    setAvatarFile]    = useState(null);

  // Password
  const [passwords,  setPasswords]  = useState({ current: "", newPass: "", confirm: "" });
  const [showPass,   setShowPass]   = useState({ current: false, newPass: false, confirm: false });
  const [passSaving, setPassSaving] = useState(false);
  const [passMsg,    setPassMsg]    = useState({ type: "", text: "" });

  // Settings
  const [settings, setSettings] = useState({
    theme:         "light",
    units:         { weight: "kg", distance: "km" },
    notifications: { enabled: true, workoutReminder: true, mealReminder: true, goalAlerts: true, weeklyReport: false },
    weeklyGoal:    5,
  });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMsg,    setSettingsMsg]    = useState({ type: "", text: "" });

  // ── Fetch on mount ───────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [{ data: user }, { data: s }] = await Promise.all([
          axios.get(USERS_API,    authHeaders()),
          axios.get(SETTINGS_API, authHeaders()),
        ]);
        const u = user.user || user;
        setProfile({ name: u.name || "", email: u.email || "", avatar: u.profilePicture || "" });
        setSettings({
          theme:         s.theme         || "light",
          units:         s.units         || { weight: "kg", distance: "km" },
          notifications: s.notifications || { enabled: true, workoutReminder: true, mealReminder: true, goalAlerts: true, weeklyReport: false },
          weeklyGoal:    s.weeklyGoal    ?? 5,
        });
      } catch { /* silently keep defaults */ }
      finally  { setPageLoading(false); }
    })();
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const saveProfile = async () => {
    if (!profile.name.trim()) return setProfileMsg({ type: "error", text: "Name cannot be empty." });
    setProfileSaving(true); setProfileMsg({ type: "", text: "" });
    try {
      const form = new FormData();
      form.append("name", profile.name.trim());
      if (avatarFile) form.append("avatar", avatarFile);
      await axios.put(USERS_API, form, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "multipart/form-data" },
      });
      setAvatarFile(null);
      setProfileMsg({ type: "success", text: "Profile updated!" });
    } catch (err) {
      setProfileMsg({ type: "error", text: err?.response?.data?.message || "Failed to update profile." });
    } finally { setProfileSaving(false); }
  };

  const savePassword = async () => {
    if (!passwords.current)           return setPassMsg({ type: "error", text: "Enter your current password." });
    if (passwords.newPass.length < 6) return setPassMsg({ type: "error", text: "New password must be at least 6 characters." });
    if (passwords.newPass !== passwords.confirm) return setPassMsg({ type: "error", text: "Passwords do not match." });
    setPassSaving(true); setPassMsg({ type: "", text: "" });
    try {
      await axios.put(`${API_BASE}/api/change-password`,
        { currentPassword: passwords.current, newPassword: passwords.newPass },
        authHeaders()
      );
      setPasswords({ current: "", newPass: "", confirm: "" });
      setPassMsg({ type: "success", text: "Password changed successfully!" });
    } catch (err) {
      setPassMsg({ type: "error", text: err?.response?.data?.message || "Failed to change password." });
    } finally { setPassSaving(false); }
  };

  const saveSettings = async () => {
    setSettingsSaving(true); setSettingsMsg({ type: "", text: "" });
    try {
      await axios.put(SETTINGS_API, settings, authHeaders());

      // 1. Apply theme immediately to <html>
      applyTheme(settings.theme);
      // 2. Persist in localStorage
      localStorage.setItem("fittrack-theme", settings.theme);
      // 3. Broadcast to DashboardLayout
      window.dispatchEvent(new CustomEvent("fittrack-theme-change", {
        detail: { theme: settings.theme }
      }));

      setSettingsMsg({ type: "success", text: "Settings saved!" });
    } catch (err) {
      setSettingsMsg({ type: "error", text: err?.response?.data?.message || "Failed to save settings." });
    } finally { setSettingsSaving(false); }
  };

  const setS = (k, v) => setSettings(p => ({ ...p, [k]: v }));
  const setN = (k, v) => setSettings(p => ({ ...p, notifications: { ...p.notifications, [k]: v } }));
  const setU = (k, v) => setSettings(p => ({ ...p, units: { ...p.units, [k]: v } }));

  const initials = profile.name
    ? profile.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  const inputCls = "w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-all";

  if (pageLoading) return (
    <div className="flex items-center justify-center py-20 gap-3">
      <svg className="w-6 h-6 animate-spin text-violet-500" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
      <span className="text-sm text-gray-400">Loading settings…</span>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-400 mt-0.5">Manage your account, preferences and notifications</p>
      </div>

      {/* ── SECTION 1: Profile ────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <SectionHeader title="Profile Information" description="Update your name and photo"
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>}
        />
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
                {avatarPreview || profile.avatar
                  ? <img src={avatarPreview || getAvatarUrl(profile.avatar)} alt="avatar" className="w-full h-full object-cover"/>
                  : <span className="text-white font-extrabold text-xl">{initials}</span>
                }
              </div>
              <button onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-violet-600 hover:bg-violet-700 rounded-lg flex items-center justify-center shadow-md transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"/></svg>
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange}/>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{profile.name || "Your Name"}</p>
              <p className="text-xs text-gray-400">{profile.email}</p>
              <button onClick={() => fileRef.current?.click()} className="text-xs font-semibold text-violet-600 hover:text-violet-700 mt-1">Change photo</button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Full Name *</label>
            <input value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} placeholder="Your full name" className={inputCls}/>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Email Address</label>
            <input value={profile.email} readOnly className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"/>
          </div>
          <Msg type={profileMsg.type} text={profileMsg.text} onClose={() => setProfileMsg({ type: "", text: "" })}/>
          <div className="flex justify-end"><SaveBtn loading={profileSaving} onClick={saveProfile}/></div>
        </div>
      </div>

      {/* ── SECTION 2: Appearance & Units ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <SectionHeader title="Appearance & Units" description="Theme, measurement units and weekly goal"
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z"/></svg>}
        />
        <div className="p-6 space-y-6">

          {/* Theme Selector */}
          <div>
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">Theme</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { val: "light",  label: "Light",  emoji: "☀️",  desc: "Default"     },
                { val: "dark",   label: "Dark",   emoji: "🌙",  desc: "Easy on eyes" },
                { val: "system", label: "System", emoji: "💻",  desc: "Follows OS"  },
              ].map(t => (
                <button key={t.val} type="button" onClick={() => setS("theme", t.val)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 text-center transition-all active:scale-95
                    ${settings.theme === t.val ? "border-violet-500 bg-violet-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <span className="text-2xl">{t.emoji}</span>
                  <div>
                    <p className={`text-xs font-bold ${settings.theme === t.val ? "text-violet-700" : "text-gray-700"}`}>{t.label}</p>
                    <p className="text-[10px] text-gray-400">{t.desc}</p>
                  </div>
                  {settings.theme === t.val && (
                    <div className="w-4 h-4 rounded-full bg-violet-600 flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
            {/* Live preview button */}
            <button onClick={() => {
                applyTheme(settings.theme);
                localStorage.setItem("fittrack-theme", settings.theme);
                window.dispatchEvent(new CustomEvent("fittrack-theme-change", { detail: { theme: settings.theme } }));
              }}
              className="mt-3 text-xs font-semibold text-violet-600 hover:text-violet-800 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg transition-colors">
              👁 Preview theme
            </button>
          </div>

          {/* Units */}
          <div>
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">Measurement Units</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs font-semibold text-gray-500 mb-3">⚖️ Weight</p>
                <div className="flex gap-2">
                  {["kg","lbs"].map(u => (
                    <button key={u} onClick={() => setU("weight", u)} type="button"
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all
                        ${settings.units.weight === u ? "bg-violet-600 border-violet-600 text-white shadow-md" : "border-gray-200 text-gray-600 hover:border-violet-200"}`}>
                      {u}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs font-semibold text-gray-500 mb-3">📏 Distance</p>
                <div className="flex gap-2">
                  {["km","miles"].map(u => (
                    <button key={u} onClick={() => setU("distance", u)} type="button"
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all
                        ${settings.units.distance === u ? "bg-violet-600 border-violet-600 text-white shadow-md" : "border-gray-200 text-gray-600 hover:border-violet-200"}`}>
                      {u}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Weekly goal */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-gray-800">🎯 Weekly Workout Goal</p>
                <p className="text-xs text-gray-400 mt-0.5">Target workouts per week</p>
              </div>
              <span className="text-2xl font-extrabold text-violet-600">{settings.weeklyGoal}</span>
            </div>
            <input type="range" min="1" max="14" value={settings.weeklyGoal}
              onChange={e => setS("weeklyGoal", Number(e.target.value))}
              className="w-full h-2 appearance-none rounded-full cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5
                [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-violet-600 [&::-webkit-slider-thumb]:shadow-md"
              style={{ background: `linear-gradient(to right, #7c3aed ${((settings.weeklyGoal-1)/13)*100}%, #e5e7eb ${((settings.weeklyGoal-1)/13)*100}%)` }}
            />
          </div>

          <Msg type={settingsMsg.type} text={settingsMsg.text} onClose={() => setSettingsMsg({ type: "", text: "" })}/>
          <div className="flex justify-end"><SaveBtn loading={settingsSaving} onClick={saveSettings}/></div>
        </div>
      </div>

      {/* ── SECTION 3: Notifications ──────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <SectionHeader title="Notification Preferences" description="Choose what alerts you receive"
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/></svg>}
        />
        <div className="p-6 space-y-3">
          <div className={`flex items-center justify-between p-4 rounded-2xl border-2 ${settings.notifications.enabled ? "bg-violet-50 border-violet-200" : "bg-gray-50 border-gray-200"}`}>
            <div className="flex items-center gap-3">
              <span className="text-xl">🔔</span>
              <div>
                <p className="text-sm font-bold text-gray-900">All Notifications</p>
                <p className="text-xs text-gray-400">Master toggle</p>
              </div>
            </div>
            <Toggle on={settings.notifications.enabled} onChange={() => setN("enabled", !settings.notifications.enabled)}/>
          </div>
          {[
            { key: "workoutReminder", emoji: "💪", label: "Workout Reminders",  desc: "Get reminded to log workouts" },
            { key: "mealReminder",    emoji: "🥗", label: "Meal Reminders",     desc: "Track your nutrition" },
            { key: "goalAlerts",      emoji: "🎯", label: "Goal Alerts",        desc: "Milestones & achievements" },
            { key: "weeklyReport",    emoji: "📊", label: "Weekly Report",      desc: "Summary every Sunday" },
          ].map(item => (
            <div key={item.key}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all
                ${!settings.notifications.enabled ? "opacity-40" : ""}
                bg-white border-gray-100`}>
              <div className="flex items-center gap-3">
                <span className="text-lg">{item.emoji}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
              </div>
              <Toggle on={settings.notifications[item.key]} onChange={() => setN(item.key, !settings.notifications[item.key])} disabled={!settings.notifications.enabled}/>
            </div>
          ))}
          <Msg type={settingsMsg.type} text={settingsMsg.text} onClose={() => setSettingsMsg({ type: "", text: "" })}/>
          <div className="flex justify-end pt-1"><SaveBtn loading={settingsSaving} onClick={saveSettings}/></div>
        </div>
      </div>

      {/* ── SECTION 4: Password ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <SectionHeader title="Change Password" description="Keep your account secure"
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/></svg>}
        />
        <div className="p-6 space-y-4">
          {[
            { field: "current", label: "Current Password", ph: "Enter current password" },
            { field: "newPass", label: "New Password",     ph: "At least 6 characters"  },
            { field: "confirm", label: "Confirm Password", ph: "Repeat new password"     },
          ].map(f => (
            <div key={f.field}>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">{f.label}</label>
              <div className="relative">
                <input type={showPass[f.field] ? "text" : "password"}
                  value={passwords[f.field]}
                  onChange={e => setPasswords(p => ({ ...p, [f.field]: e.target.value }))}
                  placeholder={f.ph}
                  className={`${inputCls} pr-11`}/>
                <button type="button" onClick={() => setShowPass(p => ({ ...p, [f.field]: !p[f.field] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass[f.field]
                    ? <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"/></svg>
                    : <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  }
                </button>
              </div>
            </div>
          ))}
          <Msg type={passMsg.type} text={passMsg.text} onClose={() => setPassMsg({ type: "", text: "" })}/>
          <div className="flex justify-end"><SaveBtn loading={passSaving} label="Change Password" onClick={savePassword}/></div>
        </div>
      </div>

      {/* ── SECTION 5: Sign Out ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <SectionHeader title="Account" description="Manage your session"
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"/></svg>}
        />
        <div className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-800">Sign Out</p>
            <p className="text-xs text-gray-400 mt-0.5">You will be redirected to the login page</p>
          </div>
          <SaveBtn label="Sign Out" variant="danger" onClick={() => { localStorage.removeItem("token"); navigate("/"); }}/>
        </div>
      </div>

    </div>
  );
}