const mongoose = require("mongoose");

const nutritionSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: [true, "User ID is required"],
      index:    true,
    },
    mealType: {
      type:     String,
      enum:     {
        values:  ["breakfast", "lunch", "dinner", "snack"],
        message: "{VALUE} is not a valid meal type",
      },
      required: [true, "Meal type is required"],
    },
    foodName: {
      type:     String,
      required: [true, "Food name is required"],
      trim:     true,
      maxlength: [100, "Food name cannot exceed 100 characters"],
    },
    quantity: {
      type:     String,
      required: [true, "Quantity is required"],
      trim:     true,
      default:  "1 serving",
    },
    calories: {
      type:    Number,
      default: 0,
      min:     [0, "Calories cannot be negative"],
    },
    protein: {
      type:    Number,
      default: 0,
      min:     [0, "Protein cannot be negative"],
    },
    carbs: {
      type:    Number,
      default: 0,
      min:     [0, "Carbs cannot be negative"],
    },
    fats: {
      type:    Number,
      default: 0,
      min:     [0, "Fats cannot be negative"],
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
nutritionSchema.index({ userId: 1, date: -1 });

// Virtual: total macros in grams
nutritionSchema.virtual("totalMacros").get(function () {
  return this.protein + this.carbs + this.fats;
});

module.exports = mongoose.model("Nutrition", nutritionSchema);