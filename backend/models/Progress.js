const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: [true, "User ID is required"],
      index:    true,
    },

    // ── Body Metrics ───────────────────────────────────────────────────────────
    weight: {
      type:    Number,
      default: null,
      min:     [0, "Weight cannot be negative"],
    },
    bodyFat: {
      type:    Number,
      default: null,
      min:     [0, "Body fat cannot be negative"],
      max:     [100, "Body fat cannot exceed 100%"],
    },

    // ── Body Measurements (cm) ─────────────────────────────────────────────────
    chest: {
      type:    Number,
      default: null,
      min:     [0, "Chest measurement cannot be negative"],
    },
    waist: {
      type:    Number,
      default: null,
      min:     [0, "Waist measurement cannot be negative"],
    },
    arms: {
      type:    Number,
      default: null,
      min:     [0, "Arms measurement cannot be negative"],
    },

    // ── Performance Metrics ────────────────────────────────────────────────────
    runTime: {
      type:    Number, // in minutes
      default: null,
      min:     [0, "Run time cannot be negative"],
    },
    liftingWeight: {
      type:    Number, // in kg
      default: null,
      min:     [0, "Lifting weight cannot be negative"],
    },

    notes: {
      type:      String,
      trim:      true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
      default:   "",
    },
    date: {
      type:    Date,
      default: Date.now,
      index:   true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for faster user+date queries
progressSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model("Progress", progressSchema);