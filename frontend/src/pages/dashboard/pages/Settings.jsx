import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const BASE    = "http://localhost:5000/api";
const BACKEND = "http://localhost:5000";

function getAvatarUrl(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${BACKEND}${path}`;
}

function authHeaders() {
  return { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } };
}

// ── Reusable Components ────────────────────────────────────────────────────────
function SectionCard({ title, description, icon, children }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div>
          <h2 className="text-sm font-bold text-gray-900">{title}</h2>
          {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function InputField({ label, name, type = "text", value, onChange, disabled, placeholder, required }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type={type} name={name} value={value} onChange={onChange}
        disabled={disabled} placeholder={placeholder}
        className={`w-full px-3.5 py-2.5 text-sm rounded-xl border outline-none transition-colors ${
          disabled
            ? "bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed"
            : "border-gray-200 bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
        }`}
      />
    </div>
  );
}

function Alert({ type, message, onClose }) {
  if (!message) return null;
  const styles = {
    success: "bg-emerald-50 border-emerald-100 text-emerald-700",
    error:   "bg-red-50 border-red-100 text-red-600",
  };
  const icons = {
    success: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    error:   <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />,
  };
  return (
    <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${styles[type]}`}>
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        {icons[type]}
      </svg>
      <p className="text-sm font-medium flex-1">{message}</p>
      <button onClick={onClose} className="opacity-60 hover:opacity-100 transition-opacity">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

function SaveButton({ loading, label = "Save Changes", onClick }) {
  return (
    <button onClick={onClick} disabled={loading}
      className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl disabled:opacity-60 transition-all hover:-translate-y-0.5 shadow-md shadow-violet-100">
      {loading ? (
        <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Saving...</>
      ) : (
        <><svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"/></svg>{label}</>
      )}
    </button>
  );
}

// ── Main Settings ──────────────────────────────────────────────────────────────
export default function Settings() {
  const navigate  = useNavigate();
  const fileRef   = useRef(null);

  const [profile, setProfile]               = useState({ name: "", email: "", avatar: "" });
  const [avatarPreview, setAvatarPreview]   = useState("");
  const [avatarFile, setAvatarFile]         = useState(null);
  const [fetchLoading, setFetchLoading]     = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg]         = useState({ type: "", text: "" });

  const [passwords, setPasswords]   = useState({ current: "", newPass: "", confirm: "" });
  const [showPass, setShowPass]     = useState({ current: false, newPass: false, confirm: false });
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg]       = useState({ type: "", text: "" });

  const [prefs, setPrefs]               = useState({ weeklyGoal: 5 });
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [prefsMsg, setPrefsMsg]         = useState({ type: "", text: "" });

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      setFetchLoading(true);
      try {
        const { data } = await axios.get(`${BASE}/users/me`, authHeaders());
        const user = data.user || data;
        const savedAvatar = getAvatarUrl(user.profilePicture || user.avatar || "");
        setProfile({ name: user.name || "", email: user.email || "", avatar: savedAvatar });
        setAvatarPreview(savedAvatar);
        setPrefs({ weeklyGoal: user.preferences?.weeklyGoal ?? 5 });
      } catch (err) {
        if (err?.response?.status === 401) navigate("/login");
      } finally {
        setFetchLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  // ── File Upload Handler ───────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setProfileMsg({ type: "error", text: "Please select a valid image file." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setProfileMsg({ type: "error", text: "Image must be smaller than 5MB." });
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
    setProfileMsg({ type: "", text: "" });
  };

  // ── Profile Save ──────────────────────────────────────────────────────────────
  const handleProfileSave = async () => {
    if (!profile.name.trim()) {
      setProfileMsg({ type: "error", text: "Name cannot be empty." });
      return;
    }
    setProfileLoading(true);
    setProfileMsg({ type: "", text: "" });
    try {
      if (avatarFile) {
        const formData = new FormData();
        formData.append("name", profile.name);
        formData.append("avatar", avatarFile);
        const { data } = await axios.put(`${BASE}/users/me`, formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "multipart/form-data" },
        });
        const updated = data.user || data;
        const newAvatar = getAvatarUrl(updated.profilePicture || updated.avatar || avatarPreview);
        setProfile(p => ({ ...p, name: updated.name || p.name, avatar: newAvatar }));
        setAvatarPreview(newAvatar);
        setAvatarFile(null);
      } else {
        const { data } = await axios.put(`${BASE}/users/me`, { name: profile.name, avatar: profile.avatar }, authHeaders());
        const updated = data.user || data;
        setProfile(p => ({ ...p, name: updated.name || p.name }));
      }
      setProfileMsg({ type: "success", text: "Profile updated successfully!" });
    } catch (err) {
      setProfileMsg({ type: "error", text: err?.response?.data?.message || "Failed to update profile." });
    } finally {
      setProfileLoading(false);
    }
  };

  // ── Password Change ───────────────────────────────────────────────────────────
  const handlePasswordChange = async () => {
    if (!passwords.current || !passwords.newPass || !passwords.confirm) {
      setPassMsg({ type: "error", text: "All fields are required." }); return;
    }
    if (passwords.newPass.length < 6) {
      setPassMsg({ type: "error", text: "New password must be at least 6 characters." }); return;
    }
    if (passwords.newPass !== passwords.confirm) {
      setPassMsg({ type: "error", text: "New passwords do not match." }); return;
    }
    setPassLoading(true);
    setPassMsg({ type: "", text: "" });
    try {
      await axios.put(`${BASE}/users/change-password`, {
        currentPassword: passwords.current,
        newPassword:     passwords.newPass,
      }, authHeaders());
      setPassMsg({ type: "success", text: "Password changed successfully!" });
      setPasswords({ current: "", newPass: "", confirm: "" });
    } catch (err) {
      setPassMsg({ type: "error", text: err?.response?.data?.message || "Incorrect current password." });
    } finally {
      setPassLoading(false);
    }
  };

  // ── Preferences Save ──────────────────────────────────────────────────────────
  const handlePrefsSave = async () => {
    setPrefsLoading(true);
    setPrefsMsg({ type: "", text: "" });
    try {
      await axios.put(`${BASE}/users/me`, { preferences: prefs }, authHeaders());
      setPrefsMsg({ type: "success", text: "Preferences saved!" });
    } catch (err) {
      setPrefsMsg({ type: "error", text: err?.response?.data?.message || "Failed to save preferences." });
    } finally {
      setPrefsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const initials = profile.name
    ? profile.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3">
        <svg className="w-6 h-6 animate-spin text-violet-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        <span className="text-sm text-gray-400">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-400 mt-0.5">Manage your account and preferences</p>
      </div>

      {/* ── Profile Section ── */}
      <SectionCard title="Profile Information" description="Update your name and profile picture"
        icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>}
      >
        <div className="space-y-5">
          {/* Avatar Upload */}
          <div className="flex items-center gap-5">
            <div className="relative flex-shrink-0 group">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Profile" className="w-20 h-20 rounded-2xl object-cover border-2 border-violet-200"/>
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                  {initials}
                </div>
              )}
              <button onClick={() => fileRef.current?.click()}
                className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"/>
                </svg>
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800">{profile.name || "Your Name"}</p>
              <p className="text-xs text-gray-400 mt-0.5">{profile.email}</p>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <button onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg border border-violet-100 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/></svg>
                  Upload Photo
                </button>
                {avatarPreview && (
                  <button onClick={() => { setAvatarPreview(""); setAvatarFile(null); setProfile(p => ({ ...p, avatar: "" })); }}
                    className="text-xs font-semibold text-red-500 px-3 py-1.5 rounded-lg border border-red-100 bg-red-50 hover:bg-red-100 transition-colors">
                    Remove
                  </button>
                )}
                {avatarFile && <span className="text-xs text-emerald-600 font-medium">✓ {avatarFile.name}</span>}
              </div>
              <p className="text-xs text-gray-400 mt-1.5">JPG, PNG or WEBP · Max 5MB</p>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange}/>
            </div>
          </div>

          <div className="grid gap-4">
            <InputField label="Full Name" name="name" value={profile.name} required placeholder="Enter your full name"
              onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}/>
            <InputField label="Email Address" name="email" type="email" value={profile.email} disabled/>
          </div>

          {profileMsg.text && <Alert type={profileMsg.type} message={profileMsg.text} onClose={() => setProfileMsg({ type: "", text: "" })}/>}
          <div className="flex justify-end">
            <SaveButton loading={profileLoading} label="Save Profile" onClick={handleProfileSave}/>
          </div>
        </div>
      </SectionCard>

      {/* ── Password Section ── */}
      <SectionCard title="Change Password" description="Keep your account secure with a strong password"
        icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/></svg>}
      >
        <div className="space-y-4">
          {[
            { key: "current", label: "Current Password",     placeholder: "Enter current password" },
            { key: "newPass", label: "New Password",         placeholder: "Min. 6 characters" },
            { key: "confirm", label: "Confirm New Password", placeholder: "Repeat new password" },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                {label}<span className="text-red-400 ml-0.5">*</span>
              </label>
              <div className="relative">
                <input type={showPass[key] ? "text" : "password"} value={passwords[key]}
                  onChange={e => setPasswords(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full px-3.5 py-2.5 pr-11 text-sm rounded-xl border border-gray-200 bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-colors"
                />
                <button type="button" onClick={() => setShowPass(p => ({ ...p, [key]: !p[key] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPass[key] ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  )}
                </button>
              </div>
              {key === "newPass" && passwords.newPass && (
                <div className="mt-2 flex items-center gap-1.5">
                  {[1, 2, 3].map(i => {
                    const s = passwords.newPass.length >= 10 ? 3 : passwords.newPass.length >= 6 ? 2 : 1;
                    return <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= s ? s === 1 ? "bg-red-400" : s === 2 ? "bg-amber-400" : "bg-emerald-400" : "bg-gray-200"}`}/>;
                  })}
                  <span className={`text-xs font-medium ml-1 ${passwords.newPass.length >= 10 ? "text-emerald-600" : passwords.newPass.length >= 6 ? "text-amber-500" : "text-red-500"}`}>
                    {passwords.newPass.length >= 10 ? "Strong" : passwords.newPass.length >= 6 ? "Fair" : "Weak"}
                  </span>
                </div>
              )}
            </div>
          ))}
          {passMsg.text && <Alert type={passMsg.type} message={passMsg.text} onClose={() => setPassMsg({ type: "", text: "" })}/>}
          <div className="flex justify-end">
            <SaveButton loading={passLoading} label="Change Password" onClick={handlePasswordChange}/>
          </div>
        </div>
      </SectionCard>

      {/* ── Preferences Section ── */}
      <SectionCard title="Preferences" description="Customize your fitness tracking experience"
        icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"/></svg>}
      >
        <div className="space-y-5">
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/></svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Weekly Workout Goal</p>
                <p className="text-xs text-gray-400">How many workouts per week?</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setPrefs(p => ({ ...p, weeklyGoal: Math.max(1, p.weeklyGoal - 1) }))}
                className="w-9 h-9 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-600 font-bold transition-colors">−</button>
              <div className="flex-1 text-center">
                <span className="text-2xl font-extrabold text-violet-600">{prefs.weeklyGoal}</span>
                <span className="text-sm text-gray-400 ml-1.5">workouts / week</span>
              </div>
              <button onClick={() => setPrefs(p => ({ ...p, weeklyGoal: Math.min(14, p.weeklyGoal + 1) }))}
                className="w-9 h-9 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-600 font-bold transition-colors">+</button>
            </div>
            <div className="flex gap-1.5 mt-3">
              {Array.from({ length: 14 }, (_, i) => (
                <button key={i} onClick={() => setPrefs(p => ({ ...p, weeklyGoal: i + 1 }))}
                  className={`flex-1 h-1.5 rounded-full transition-colors ${i < prefs.weeklyGoal ? "bg-violet-500" : "bg-gray-200"}`}/>
              ))}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-400">1</span>
              <span className="text-xs text-gray-400">14</span>
            </div>
          </div>
          {prefsMsg.text && <Alert type={prefsMsg.type} message={prefsMsg.text} onClose={() => setPrefsMsg({ type: "", text: "" })}/>}
          <div className="flex justify-end">
            <SaveButton loading={prefsLoading} label="Save Preferences" onClick={handlePrefsSave}/>
          </div>
        </div>
      </SectionCard>

      {/* ── Account / Logout ── */}
      <SectionCard title="Account" description="Manage your session"
        icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"/></svg>}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-800">Sign Out</p>
            <p className="text-xs text-gray-400 mt-0.5">You will be redirected to the login page</p>
          </div>
          <button onClick={handleLogout}
            className="inline-flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-sm px-4 py-2.5 rounded-xl border border-red-100 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"/></svg>
            Sign Out
          </button>
        </div>
      </SectionCard>

    </div>
  );
}