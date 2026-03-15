const mongoose = require("mongoose");

const userSettingsSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
      unique:   true,   // one settings doc per user
      index:    true,
    },

    // ── Appearance ─────────────────────────────────────────────────────────
    theme: {
      type:    String,
      enum:    ["light", "dark", "system"],
      default: "light",
    },

    // ── Measurement ────────────────────────────────────────────────────────
    units: {
      weight:   { type: String, enum: ["kg", "lbs"],  default: "kg"  },
      distance: { type: String, enum: ["km", "miles"], default: "km"  },
    },

    // ── Notifications ──────────────────────────────────────────────────────
    notifications: {
      enabled:        { type: Boolean, default: true  },
      workoutReminder:{ type: Boolean, default: true  },
      mealReminder:   { type: Boolean, default: true  },
      goalAlerts:     { type: Boolean, default: true  },
      weeklyReport:   { type: Boolean, default: false },
    },

    // ── Weekly goal (migrated from User.preferences) ───────────────────────
    weeklyGoal: {
      type:    Number,
      default: 5,
      min:     1,
      max:     14,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserSettings", userSettingsSchema);