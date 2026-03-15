const express  = require("express");
const router   = express.Router();
const Reminder = require("../models/Reminder");
const { protect } = require("../middleware/authMiddleware");

// ── GET /api/reminders ──────────────────────────────────────────────────────
router.get("/", protect, async (req, res) => {
  try {
    const reminders = await Reminder
      .find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    res.json(reminders);
  } catch (err) {
    console.error("[Reminders GET]", err.message);
    res.status(500).json({ message: "Failed to fetch reminders." });
  }
});

// ── POST /api/reminders ─────────────────────────────────────────────────────
router.post("/", protect, async (req, res) => {
  try {
    const { title, type, time, days, note } = req.body;

    if (!title?.trim()) return res.status(400).json({ message: "Title is required." });
    if (!type)          return res.status(400).json({ message: "Type is required." });
    if (!time)          return res.status(400).json({ message: "Time is required." });
    if (!days?.length)  return res.status(400).json({ message: "At least one day is required." });

    const reminder = await Reminder.create({
      userId: req.user._id,
      title:  title.trim(),
      type,
      time,
      days,
      note:   note?.trim() || "",
    });

    res.status(201).json(reminder);
  } catch (err) {
    console.error("[Reminders POST]", err.message);
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: Object.values(err.errors)[0].message });
    }
    res.status(500).json({ message: "Failed to create reminder." });
  }
});

// ── PATCH /api/reminders/:id/toggle ────────────────────────────────────────
router.patch("/:id/toggle", protect, async (req, res) => {
  try {
    const reminder = await Reminder.findOne({ _id: req.params.id, userId: req.user._id });
    if (!reminder) return res.status(404).json({ message: "Reminder not found." });
    reminder.isActive = !reminder.isActive;
    await reminder.save();
    res.json(reminder);
  } catch (err) {
    res.status(500).json({ message: "Failed to toggle reminder." });
  }
});

// ── DELETE /api/reminders/:id ───────────────────────────────────────────────
router.delete("/:id", protect, async (req, res) => {
  try {
    const reminder = await Reminder.findOneAndDelete({
      _id:    req.params.id,
      userId: req.user._id,
    });
    if (!reminder) return res.status(404).json({ message: "Reminder not found." });
    res.json({ message: "Reminder deleted." });
  } catch (err) {
    console.error("[Reminders DELETE]", err.message);
    res.status(500).json({ message: "Failed to delete reminder." });
  }
});


// ── GET /api/reminders/check ────────────────────────────────────────────────
// Frontend polls this every 60s. Returns any reminders that fired since last
// poll, then clears them so each notification fires exactly once.
const { drainDue } = require("../cron/reminderCron");

router.get("/check", protect, (req, res) => {
  try {
    const due = drainDue(req.user._id);
    res.json({ due });           // [] when nothing is pending
  } catch (err) {
    console.error("[Reminders CHECK]", err.message);
    res.status(500).json({ message: "Check failed." });
  }
});

module.exports = router;