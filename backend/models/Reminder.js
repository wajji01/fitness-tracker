const mongoose = require("mongoose");

const reminderSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: [true, "User ID is required"],
      index:    true,
    },
    title: {
      type:      String,
      required:  [true, "Title is required"],
      trim:      true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    type: {
      type:    String,
      enum:    ["workout", "meal", "goal"],
      required:[true, "Type is required"],
      default: "workout",
    },
    time: {
      type:     String,   // "HH:MM" — e.g. "07:30"
      required: [true, "Time is required"],
      match:    [/^\d{2}:\d{2}$/, "Time must be in HH:MM format"],
    },
    days: {
      type:    [String],
      enum:    ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
      default: ["Mon","Tue","Wed","Thu","Fri"],
      validate: {
        validator: v => v.length > 0,
        message: "At least one day is required",
      },
    },
    note: {
      type:      String,
      trim:      true,
      maxlength: [300, "Note cannot exceed 300 characters"],
      default:   "",
    },
    isActive: {
      type:    Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

reminderSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model("Reminder", reminderSchema);