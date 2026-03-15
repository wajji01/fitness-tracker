import { useNavigate } from "react-router-dom";
import { BACKEND_URL } from "../../../config/api";

const navItems = [
  { id: "dashboard", label: "Dashboard",  icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { id: "workouts",  label: "Workouts",   icon: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" },
  { id: "nutrition", label: "Nutrition",  icon: "M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" },
  { id: "progress",  label: "Progress",   icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" },
  { id: "reminders", label: "Reminders",  icon: "M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" },
  { id: "reports",   label: "Reports",    icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" },
  { id: "settings",  label: "Settings",   icon: "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" },
];

function getAvatarUrl(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${BACKEND_URL}/${path.replace(/^\//, "")}`;
}

function formatJoinDate(dateStr) {
  if (!dateStr) return "Member";
  return "Member since " + new Date(dateStr).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export default function Sidebar({ activePage, setActivePage, user }) {
  const navigate  = useNavigate();
  const initials  = user?.name
    ? user.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";
  const avatarUrl = getAvatarUrl(user?.profilePicture || user?.avatar || "");
  const joinDate  = formatJoinDate(user?.createdAt);

  return (
    <aside className="hidden lg:flex flex-col w-60 min-h-screen bg-white border-r border-gray-100 fixed top-0 left-0 z-30 animate-slide-in-left">

      {/* Logo */}
      <button onClick={() => navigate("/")}
        className="h-16 flex items-center gap-2.5 px-6 border-b border-gray-100 hover:bg-gray-50 transition-colors w-full text-left btn-press">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
        </div>
        <span className="font-extrabold text-gray-900 text-lg tracking-tight">FitTrack</span>
      </button>

      {/* Nav */}
      <nav className="flex-1 px-3 py-6 space-y-0.5">
        {navItems.map((item, i) => {
          const isActive = activePage === item.id;
          return (
            <button key={item.id} onClick={() => setActivePage(item.id)}
              style={{ animationDelay: `${i * 50}ms` }}
              className={`sidebar-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                animate-slide-in-left relative overflow-hidden
                ${isActive
                  ? "bg-violet-50 text-violet-700"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                }`}>

              {/* Active indicator bar */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-violet-600 rounded-r-full" />
              )}

              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                isActive
                  ? "bg-violet-100 text-violet-600"
                  : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"
              }`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
              </div>
              <span>{item.label}</span>

              {/* Active dot */}
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse-ring" />
              )}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-gray-50 transition-colors cursor-default">
          {avatarUrl ? (
            <img src={avatarUrl} alt={user?.name || "User"}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-violet-100 flex-shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">
              {user?.name || "Loading..."}
            </p>
            <p className="text-xs text-gray-400 truncate">{joinDate}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}