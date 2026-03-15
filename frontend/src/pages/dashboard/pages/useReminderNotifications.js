/**
 * useReminderNotifications.js
 * Drop-in React hook. Import in Reminders.jsx (or App root).
 *
 * What it does:
 *  1. Requests browser notification permission on mount.
 *  2. Polls GET /api/reminders/check every 60 s.
 *  3. Shows a native Browser Notification for each due reminder.
 *  4. Returns { permission } so the UI can show a prompt if blocked.
 */
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { API_BASE, authHeaders } from "../../../config/api";

const CHECK_URL      = `${API_BASE}/api/reminders/check`;
const POLL_INTERVAL  = 60_000; // 60 seconds — matches cron granularity

const TYPE_LABELS = {
  workout: { title: "💪 Workout Reminder",      body: "Time for your scheduled workout!" },
  meal:    { title: "🥗 Meal Reminder",          body: "Time for your scheduled meal!"    },
  goal:    { title: "🎯 Fitness Goal Reminder",  body: "Time to work on your fitness goal!" },
};

export function useReminderNotifications() {
  const [permission, setPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );
  const timerRef = useRef(null);

  // ── 1. Request permission ──────────────────────────────────────────────
  const requestPermission = async () => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "granted") { setPermission("granted"); return; }
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  // ── 2. Show one browser notification ──────────────────────────────────
  const showNotification = (reminder) => {
    if (Notification.permission !== "granted") return;

    const cfg     = TYPE_LABELS[reminder.type] || TYPE_LABELS.workout;
    const body    = reminder.note
      ? `${cfg.body}\n📝 ${reminder.note}`
      : cfg.body;

    try {
      const n = new Notification(
        reminder.title ? `${cfg.title.split(" ")[0]} ${reminder.title}` : cfg.title,
        {
          body,
          icon:  "/favicon.ico",   // swap for your app icon path
          tag:   reminder._id,     // prevents duplicate toasts
          renotify: false,
        }
      );
      // Auto-close after 8 s
      setTimeout(() => n.close(), 8000);
    } catch (err) {
      console.warn("[ReminderNotif] Could not show notification:", err.message);
    }
  };

  // ── 3. Poll /check and fire notifications ──────────────────────────────
  const poll = async () => {
    // Don't poll if permission not granted — avoids wasted requests
    if (Notification.permission !== "granted") return;
    try {
      const token = localStorage.getItem("token");
      if (!token) return; // user not logged in
      const { data } = await axios.get(CHECK_URL, authHeaders());
      (data.due || []).forEach(showNotification);
    } catch {
      // Network errors are silently ignored — non-critical
    }
  };

  // ── 4. Lifecycle ──────────────────────────────────────────────────────
  useEffect(() => {
    requestPermission();

    // Initial poll (catches reminders that fired while page was loading)
    poll();

    // Recurring poll
    timerRef.current = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(timerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { permission, requestPermission };
}