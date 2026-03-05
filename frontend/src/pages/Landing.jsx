import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";

const BACKEND = "http://localhost:5000";

function getAvatarUrl(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${BACKEND}${path}`;
}

const features = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    title: "Workout Tracking",
    description: "Log every set, rep, and personal best. Build custom routines and watch your strength grow week over week with detailed session history.",
    accent: "from-violet-500 to-indigo-500",
    bg: "bg-violet-50",
    text: "text-violet-600",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
      </svg>
    ),
    title: "Nutrition Tracking",
    description: "Monitor macros, calories, and hydration effortlessly. Search millions of foods and get smart insights to fuel your performance goals.",
    accent: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    title: "Progress Analytics",
    description: "Visualize your transformation with beautiful charts and trend reports. Celebrate milestones and stay motivated with data-driven feedback.",
    accent: "from-orange-500 to-rose-500",
    bg: "bg-orange-50",
    text: "text-orange-600",
  },
];

const stats = [
  { value: "50K+", label: "Active Users" },
  { value: "2M+", label: "Workouts Logged" },
  { value: "98%", label: "Satisfaction Rate" },
];

export default function Landing() {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const [user, setUser]           = useState(null);  // null = not logged in
  const [dropOpen, setDropOpen]   = useState(false);

  // ── Check login status & get user info ──────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const fetchUser = async () => {
      try {
        const res = await fetch(`${BACKEND}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) { localStorage.removeItem("token"); return; }
        const data = await res.json();
        setUser(data.user || data);
      } catch {
        // token invalid — silently ignore
      }
    };
    fetchUser();
  }, []);

  // ── Close dropdown on outside click ─────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setDropOpen(false);
  };

  // Avatar: pic or first letter of name
  const initials = user?.name ? user.name.charAt(0).toUpperCase() : "U";
  const avatarUrl = getAvatarUrl(user?.profilePicture || user?.avatar || "");

  return (
    <div className="min-h-screen bg-white font-sans antialiased">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </span>
            <span className="font-bold text-gray-900 text-lg tracking-tight">FitTrack</span>
          </div>

          {/* Right side — logged in OR logged out */}
          <div className="flex items-center gap-3">
            {user ? (
              /* ── LOGGED IN: Avatar + Dropdown ── */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropOpen(p => !p)}
                  className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  {/* Avatar */}
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={user.name}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-violet-200" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold ring-2 ring-violet-200">
                      {initials}
                    </div>
                  )}
                  <span className="text-sm font-semibold text-gray-700 hidden sm:block">
                    {user.name?.split(" ")[0]}
                  </span>
                  {/* Chevron */}
                  <svg xmlns="http://www.w3.org/2000/svg"
                    className={`w-3.5 h-3.5 text-gray-400 transition-transform ${dropOpen ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>

                {/* Dropdown */}
                {dropOpen && (
                  <div className="absolute right-0 top-12 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                    {/* User info */}
                    <div className="px-4 py-3.5 border-b border-gray-50">
                      <p className="text-xs text-gray-400 font-medium">Signed in as</p>
                      <p className="text-sm font-bold text-gray-900 mt-0.5 truncate">{user.name}</p>
                    </div>

                    {/* Dashboard */}
                    <button
                      onClick={() => { setDropOpen(false); navigate("/dashboard"); }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-violet-50 transition-colors text-left group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-violet-100 group-hover:bg-violet-200 flex items-center justify-center transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                        </svg>
                      </div>
                      <span className="text-sm font-semibold text-gray-700">Dashboard</span>
                    </button>

                    {/* Divider */}
                    <div className="border-t border-gray-50" />

                    {/* Logout */}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-left group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-red-50 group-hover:bg-red-100 flex items-center justify-center transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                        </svg>
                      </div>
                      <span className="text-sm font-semibold text-red-500">Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* ── NOT LOGGED IN: Login + Get Started ── */
              <>
                <Link to="/login"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                  Login
                </Link>
                <Link to="/register"
                  className="text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 px-5 py-2 rounded-lg shadow-sm transition-all hover:shadow-md">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-32 pb-24 px-6 relative overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-100 rounded-full opacity-60 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-indigo-100 rounded-full opacity-50 blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 bg-violet-50 text-violet-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 border border-violet-100">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
            Your personal fitness companion
          </span>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-gray-900 leading-tight tracking-tight mb-6">
            Track Your Fitness
            <span className="block bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
              Journey Smarter
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            All your workouts, nutrition, and progress analytics in one beautifully simple dashboard.
            Set goals, build habits, and hit new personal records — every single day.
          </p>

          {user ? (
            /* ── LOGGED IN: Hero CTAs ── */
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate("/dashboard")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold text-base px-8 py-3.5 rounded-xl shadow-lg shadow-violet-200 hover:shadow-xl hover:shadow-violet-300 transition-all duration-200 group"
              >
                Go to Dashboard
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </div>
          ) : (
            /* ── NOT LOGGED IN: Hero CTAs ── */
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold text-base px-8 py-3.5 rounded-xl shadow-lg shadow-violet-200 hover:shadow-xl hover:shadow-violet-300 transition-all duration-200 group">
                Get Started — It's Free
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <Link to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-gray-700 font-semibold text-base px-8 py-3.5 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-sm hover:shadow transition-all duration-200">
                Login to Dashboard
              </Link>
            </div>
          )}

          <p className="mt-6 text-xs text-gray-400 flex items-center justify-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {user ? `Welcome back, ${user.name?.split(" ")[0]}! 🎉` : "No credit card required · Free forever plan available"}
          </p>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-12 px-6 bg-gray-50 border-y border-gray-100">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-6 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-3xl sm:text-4xl font-extrabold text-gray-900">{s.value}</p>
              <p className="text-sm text-gray-500 mt-1 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-violet-600 mb-3 block">Everything you need</span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">Built for real results</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">Three powerful pillars to transform the way you train, eat, and grow.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f) => (
              <div key={f.title}
                className="group relative bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className={`absolute top-0 inset-x-0 h-1 rounded-t-2xl bg-gradient-to-r ${f.accent}`} />
                <div className={`w-14 h-14 rounded-xl ${f.bg} ${f.text} flex items-center justify-center mb-6`}>{f.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.description}</p>
                <div className={`mt-6 flex items-center gap-1.5 text-sm font-semibold ${f.text} opacity-0 group-hover:opacity-100 transition-opacity`}>
                  Learn more
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 rounded-3xl px-10 py-16 text-center relative overflow-hidden shadow-2xl shadow-indigo-200">
          <div className="absolute inset-0 opacity-10 pointer-events-none"
            style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
          <h2 className="relative text-3xl sm:text-4xl font-extrabold text-white mb-4">Ready to crush your goals?</h2>
          <p className="relative text-indigo-200 text-lg mb-8 max-w-md mx-auto">
            Join thousands of athletes already using FitTrack to reach their peak performance.
          </p>
          {user ? (
            <button onClick={() => navigate("/dashboard")}
              className="relative inline-flex items-center gap-2 bg-white text-indigo-700 font-bold text-base px-8 py-3.5 rounded-xl hover:bg-indigo-50 transition-colors shadow-lg group">
              Open Dashboard
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          ) : (
            <Link to="/register"
              className="relative inline-flex items-center gap-2 bg-white text-indigo-700 font-bold text-base px-8 py-3.5 rounded-xl hover:bg-indigo-50 transition-colors shadow-lg group">
              Start for Free Today
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-6 border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </span>
            <span className="font-bold text-gray-800 text-sm">FitTrack</span>
          </div>
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} FitTrack. All rights reserved.</p>
          <div className="flex gap-5 text-xs text-gray-400">
            <a href="#" className="hover:text-gray-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-gray-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-gray-600 transition-colors">Contact</a>
          </div>
        </div>
      </footer>

    </div>
  );
}