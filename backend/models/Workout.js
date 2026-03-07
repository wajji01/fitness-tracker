const mongoose = require("mongoose");

const workoutSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: [true, "User ID is required"],
      index:    true, // faster queries by user
    },
    exerciseName: {
      type:     String,
      required: [true, "Exercise name is required"],
      trim:     true,
      maxlength: [100, "Exercise name cannot exceed 100 characters"],
    },
    sets: {
      type:    Number,
      default: 1,
      min:     [1, "Sets must be at least 1"],
      max:     [100, "Sets cannot exceed 100"],
    },
    reps: {
      type:    Number,
      default: 1,
      min:     [1, "Reps must be at least 1"],
      max:     [1000, "Reps cannot exceed 1000"],
    },
    weight: {
      type:    Number,
      default: 0,
      min:     [0, "Weight cannot be negative"],
    },
    category: {
      type:     String,
      enum:     {
        values:  ["strength", "cardio", "flexibility", "sports", "other"],
        message: "{VALUE} is not a valid category",
      },
      default: "strength",
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
workoutSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model("Workout", workoutSchema);