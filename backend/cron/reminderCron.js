/**
 * reminderCron.js
 * Fires every minute. For each active reminder whose time + day
 * matches "now":
 *   1. Pushes it into the in-memory dueMap  (→ /check polling)
 *   2. Creates a Notification document       (→ NotificationBell)
 */
const cron         = require("node-cron");
const Reminder     = require("../models/Reminder");
const Notification = require("../models/Notification");

// ── In-memory queue: userId → [reminders] ─────────────────────────────────
const dueMap = new Map();

const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const TYPE_META = {
  workout: { type: "workout_reminder", icon: "💪", message: "Time for your scheduled workout!" },
  meal:    { type: "meal_reminder",    icon: "🥗", message: "Time for your scheduled meal!"    },
  goal:    { type: "goal_achievement", icon: "🎯", message: "Time to work on your fitness goal!" },
};

function markDue(r) {
  const uid = r.userId.toString();
  if (!dueMap.has(uid)) dueMap.set(uid, []);
  dueMap.get(uid).push({ _id: r._id, title: r.title, type: r.type, time: r.time, note: r.note || "" });
}

/** Called by /check route — drains and returns pending reminders */
function drainDue(userId) {
  const uid  = userId.toString();
  const list = dueMap.get(uid) || [];
  dueMap.delete(uid);
  return list;
}

// ── Cron: every minute ────────────────────────────────────────────────────
function startReminderCron() {
  cron.schedule("* * * * *", async () => {
    try {
      const now   = new Date();
      const HH    = String(now.getHours()).padStart(2, "0");
      const MM    = String(now.getMinutes()).padStart(2, "0");
      const today = DAY_NAMES[now.getDay()];
      const time  = `${HH}:${MM}`;

      const due = await Reminder.find({ isActive: true, time, days: today }).lean();
      if (!due.length) return;

      console.log(`[ReminderCron] ${time} ${today} — ${due.length} reminder(s) fired`);

      // Process each due reminder
      const notifDocs = [];
      due.forEach(r => {
        // 1. In-memory queue for /check polling
        markDue(r);

        // 2. Build Notification document
        const meta = TYPE_META[r.type] || { type: "general", icon: "🔔", message: "You have a reminder!" };
        const body = r.note ? `${meta.message}\n📝 ${r.note}` : meta.message;

        notifDocs.push({
          userId:  r.userId,
          type:    meta.type,
          title:   r.title,
          message: body,
          icon:    meta.icon,
          read:    false,
        });
      });

      // Bulk insert into Notifications collection
      if (notifDocs.length) {
        await Notification.insertMany(notifDocs);
      }
    } catch (err) {
      console.error("[ReminderCron] Error:", err.message);
    }
  });

  console.log("✅ Reminder cron running (every minute)");
}

module.exports = { startReminderCron, drainDue };