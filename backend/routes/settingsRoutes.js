const express      = require("express");
const router       = express.Router();
const UserSettings = require("../models/UserSettings");
const { protect }  = require("../middleware/authMiddleware");

// ── Helper: get-or-create settings for a user ──────────────────────────────
async function getOrCreate(userId) {
  let settings = await UserSettings.findOne({ userId });
  if (!settings) settings = await UserSettings.create({ userId });
  return settings;
}

// ── GET /api/settings ──────────────────────────────────────────────────────
router.get("/", protect, async (req, res) => {
  try {
    const settings = await getOrCreate(req.user._id);
    res.json(settings);
  } catch (err) {
    console.error("[Settings GET]", err.message);
    res.status(500).json({ message: "Failed to load settings." });
  }
});

// ── PUT /api/settings ──────────────────────────────────────────────────────
router.put("/", protect, async (req, res) => {
  try {
    const allowed = ["theme", "units", "notifications", "weeklyGoal"];
    const update  = {};

    allowed.forEach(key => {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    });

    const settings = await UserSettings.findOneAndUpdate(
      { userId: req.user._id },
      { $set: update },
      { new: true, upsert: true, runValidators: true }
    );

    res.json(settings);
  } catch (err) {
    console.error("[Settings PUT]", err.message);
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: Object.values(err.errors)[0].message });
    }
    res.status(500).json({ message: "Failed to save settings." });
  }
});

module.exports = router;