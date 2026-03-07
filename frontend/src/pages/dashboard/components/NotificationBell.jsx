import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { API_BASE, authHeaders } from "../../../config/api";

const API = `${API_BASE}/api/notifications`;

const typeStyles = {
  workout_reminder: {
    bg:     "bg-violet-50",
    border: "border-violet-100",
    icon:   "bg-violet-100 text-violet-600",
    dot:    "bg-violet-500",
  },
  meal_reminder: {
    bg:     "bg-emerald-50",
    border: "border-emerald-100",
    icon:   "bg-emerald-100 text-emerald-600",
    dot:    "bg-emerald-500",
  },
  goal_achievement: {
    bg:     "bg-amber-50",
    border: "border-amber-100",
    icon:   "bg-amber-100 text-amber-600",
    dot:    "bg-amber-500",
  },
  general: {
    bg:     "bg-gray-50",
    border: "border-gray-100",
    icon:   "bg-gray-100 text-gray-600",
    dot:    "bg-gray-400",
  },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs  < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Toast popup (top-right, auto dismiss) ─────────────────────────────────────
export function NotificationToast({ notification, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const s = typeStyles[notification.type] || typeStyles.general;

  return (
    <div className={`fixed top-5 right-5 z-[100] w-80 rounded-2xl border ${s.border} ${s.bg} shadow-xl p-4 flex items-start gap-3 animate-slide-in`}>
      <div className={`w-9 h-9 rounded-xl ${s.icon} flex items-center justify-center text-lg flex-shrink-0`}>
        {notification.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900">{notification.title}</p>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{notification.message}</p>
      </div>
      <button onClick={onClose} className="text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ── Bell Icon + Dropdown ───────────────────────────────────────────────────────
export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unread,        setUnread]        = useState(0);
  const [open,          setOpen]          = useState(false);
  const [toast,         setToast]         = useState(null);
  const [loading,       setLoading]       = useState(false);
  const dropRef = useRef(null);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async (showToast = false) => {
    setLoading(true);
    try {
      const { data } = await axios.get(API, authHeaders());
      const list = data.notifications || [];
      setNotifications(list);
      setUnread(data.unreadCount || 0);

      // Show toast for newest unread
      if (showToast && list.length > 0 && !list[0].read) {
        setToast(list[0]);
      }
    } catch {
      // silently fail
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchNotifications(true);
    // Poll every 5 minutes
    const interval = setInterval(() => fetchNotifications(true), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // ── Close on outside click ───────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Mark single as read ──────────────────────────────────────────────────
  const markRead = async (id) => {
    try {
      await axios.put(`${API}/${id}/read`, {}, authHeaders());
      setNotifications(p => p.map(n => n._id === id ? { ...n, read: true } : n));
      setUnread(p => Math.max(0, p - 1));
    } catch {}
  };

  // ── Mark all as read ─────────────────────────────────────────────────────
  const markAllRead = async () => {
    try {
      await axios.put(`${API}/read-all`, {}, authHeaders());
      setNotifications(p => p.map(n => ({ ...n, read: true })));
      setUnread(0);
    } catch {}
  };

  // ── Delete one ───────────────────────────────────────────────────────────
  const deleteOne = async (id) => {
    try {
      await axios.delete(`${API}/${id}`, authHeaders());
      const removed = notifications.find(n => n._id === id);
      setNotifications(p => p.filter(n => n._id !== id));
      if (removed && !removed.read) setUnread(p => Math.max(0, p - 1));
    } catch {}
  };

  // ── Clear all ────────────────────────────────────────────────────────────
  const clearAll = async () => {
    try {
      await axios.delete(`${API}/clear-all`, authHeaders());
      setNotifications([]);
      setUnread(0);
    } catch {}
  };

  return (
    <>
      {/* Toast */}
      {toast && (
        <NotificationToast notification={toast} onClose={() => setToast(null)} />
      )}

      {/* Bell Button */}
      <div className="relative" ref={dropRef}>
        <button
          onClick={() => { setOpen(p => !p); if (!open) fetchNotifications(); }}
          className="relative w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
                {unread > 0 && (
                  <span className="text-xs font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">{unread}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-xs font-semibold text-violet-600 hover:text-violet-700 transition-colors">
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button onClick={clearAll} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
                    Clear all
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto">
              {loading && notifications.length === 0 ? (
                <div className="flex items-center justify-center py-10 gap-2">
                  <svg className="w-4 h-4 animate-spin text-violet-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  <span className="text-xs text-gray-400">Loading...</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <div className="text-3xl">🎉</div>
                  <p className="text-sm font-semibold text-gray-500">All caught up!</p>
                  <p className="text-xs text-gray-400">No notifications right now</p>
                </div>
              ) : (
                notifications.map(n => {
                  const s = typeStyles[n.type] || typeStyles.general;
                  return (
                    <div
                      key={n._id}
                      onClick={() => !n.read && markRead(n._id)}
                      className={`flex items-start gap-3 px-4 py-3.5 border-b border-gray-50 cursor-pointer transition-colors hover:bg-gray-50 ${!n.read ? s.bg : ""}`}
                    >
                      {/* Icon */}
                      <div className={`w-9 h-9 rounded-xl ${s.icon} flex items-center justify-center text-base flex-shrink-0`}>
                        {n.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {!n.read && <span className={`w-1.5 h-1.5 rounded-full ${s.dot} flex-shrink-0`} />}
                          <p className={`text-xs font-bold text-gray-900 truncate ${!n.read ? "font-extrabold" : ""}`}>
                            {n.title}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
                        <p className="text-xs text-gray-300 mt-1">{timeAgo(n.createdAt)}</p>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={e => { e.stopPropagation(); deleteOne(n._id); }}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-50 text-center">
                <p className="text-xs text-gray-400">{notifications.length} notification{notifications.length !== 1 ? "s" : ""} total</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}