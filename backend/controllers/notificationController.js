const Notification  = require("../models/Notification");
const Workout       = require("../models/Workout");
const Nutrition     = require("../models/Nutrition");
const Progress      = require("../models/Progress");

// ── Helper: today's date range ────────────────────────────────────────────────
function todayRange() {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end   = new Date(); end.setHours(23, 59, 59, 999);
  return { $gte: start, $lte: end };
}

// ── Auto-generate smart notifications ────────────────────────────────────────
async function generateSmartNotifications(userId) {
  const toCreate = [];
  const today    = todayRange();

  // ── 1. Workout Reminder ──────────────────────────────────────────────────
  const todayWorkout = await Workout.findOne({ userId, date: today });
  if (!todayWorkout) {
    const existing = await Notification.findOne({
      userId, type: "workout_reminder",
      createdAt: today,
    });
    if (!existing) {
      toCreate.push({
        userId, type: "workout_reminder",
        title:   "Time to Work Out! 💪",
        message: "You haven't logged a workout today. Keep your streak going!",
        icon:    "💪",
      });
    }
  }

  // ── 2. Meal Reminder ─────────────────────────────────────────────────────
  const todayMeals = await Nutrition.countDocuments({ userId, date: today });
  if (todayMeals === 0) {
    const existing = await Notification.findOne({
      userId, type: "meal_reminder",
      createdAt: today,
    });
    if (!existing) {
      toCreate.push({
        userId, type: "meal_reminder",
        title:   "Don't Forget to Log Meals 🍽️",
        message: "You haven't logged any meals today. Track your nutrition to stay on target.",
        icon:    "🍽️",
      });
    }
  }

  // ── 3. Goal Achievement ──────────────────────────────────────────────────
  // Check if user logged 7 workouts this week
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const weeklyWorkouts = await Workout.countDocuments({
    userId, date: { $gte: weekStart },
  });

  if (weeklyWorkouts >= 5) {
    const existing = await Notification.findOne({
      userId, type: "goal_achievement",
      createdAt: { $gte: weekStart },
    });
    if (!existing) {
      toCreate.push({
        userId, type: "goal_achievement",
        title:   "Weekly Goal Smashed! 🏆",
        message: `Amazing! You've completed ${weeklyWorkouts} workouts this week. You're crushing it!`,
        icon:    "🏆",
      });
    }
  }

  // ── 4. Weight Milestone ──────────────────────────────────────────────────
  const progressEntries = await Progress.find({ userId })
    .sort({ date: 1 }).select("weight date");

  if (progressEntries.length >= 2) {
    const first   = progressEntries[0];
    const latest  = progressEntries[progressEntries.length - 1];
    const diff    = parseFloat(first.weight) - parseFloat(latest.weight);

    if (diff >= 5) {
      const existing = await Notification.findOne({
        userId, type: "goal_achievement",
        title: { $regex: "Weight" },
      });
      if (!existing) {
        toCreate.push({
          userId, type: "goal_achievement",
          title:   "Weight Loss Milestone! ⚖️",
          message: `You've lost ${diff.toFixed(1)} kg since you started. Incredible progress!`,
          icon:    "⚖️",
        });
      }
    }
  }

  if (toCreate.length > 0) {
    await Notification.insertMany(toCreate);
  }
}

// ── GET /api/notifications ────────────────────────────────────────────────────
const getNotifications = async (req, res) => {
  try {
    await generateSmartNotifications(req.user._id);

    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    const unreadCount = await Notification.countDocuments({
      userId: req.user._id, read: false,
    });

    res.status(200).json({ notifications, unreadCount });
  } catch (error) {
    console.error("getNotifications Error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ── PUT /api/notifications/:id/read ──────────────────────────────────────────
const markAsRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true }
    );
    res.status(200).json({ message: "Marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ── PUT /api/notifications/read-all ──────────────────────────────────────────
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, read: false },
      { read: true }
    );
    res.status(200).json({ message: "All marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ── DELETE /api/notifications/:id ────────────────────────────────────────────
const deleteNotification = async (req, res) => {
  try {
    await Notification.findOneAndDelete({
      _id: req.params.id, userId: req.user._id,
    });
    res.status(200).json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ── DELETE /api/notifications/clear-all ──────────────────────────────────────
const clearAll = async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user._id });
    res.status(200).json({ message: "All cleared" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAll,
};