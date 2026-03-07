const Nutrition = require("../models/Nutrition");

// ── @route   POST /api/nutrition ──────────────────────────────────────────────
// ── @access  Protected
const createEntry = async (req, res) => {
  try {
    const { mealType, foodName, quantity, calories, protein, carbs, fats, date } = req.body;

    if (!foodName) {
      return res.status(400).json({ message: "Food name is required" });
    }
    if (!mealType) {
      return res.status(400).json({ message: "Meal type is required" });
    }

    const entry = await Nutrition.create({
      userId:   req.user._id,
      mealType: mealType.toLowerCase(),
      foodName,
      quantity: quantity || "1 serving",
      calories: parseFloat(calories) || 0,
      protein:  parseFloat(protein)  || 0,
      carbs:    parseFloat(carbs)    || 0,
      fats:     parseFloat(fats)     || 0,
      date:     date || Date.now(),
    });

    res.status(201).json({
      message: "Nutrition entry created successfully",
      entry,
    });
  } catch (error) {
    console.error("createEntry Error:", error.message);
    if (error.name === "ValidationError") {
      const msg = Object.values(error.errors).map(e => e.message).join(", ");
      return res.status(400).json({ message: msg });
    }
    res.status(500).json({ message: "Server error while creating entry" });
  }
};

// ── @route   GET /api/nutrition ───────────────────────────────────────────────
// ── @access  Protected
const getEntries = async (req, res) => {
  try {
    const { mealType, date, limit = 100, page = 1 } = req.query;

    const filter = { userId: req.user._id };
    if (mealType) filter.mealType = mealType.toLowerCase();

    // Filter by date (match same day)
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [entries, total] = await Promise.all([
      Nutrition.find(filter)
        .sort({ date: -1 })
        .limit(parseInt(limit))
        .skip(skip),
      Nutrition.countDocuments(filter),
    ]);

    res.status(200).json({
      entries,
      total,
      page:       parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error("getEntries Error:", error.message);
    res.status(500).json({ message: "Server error while fetching entries" });
  }
};

// ── @route   GET /api/nutrition/:id ──────────────────────────────────────────
// ── @access  Protected
const getEntryById = async (req, res) => {
  try {
    const entry = await Nutrition.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({ message: "Nutrition entry not found" });
    }

    if (entry.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to view this entry" });
    }

    res.status(200).json({ entry });
  } catch (error) {
    console.error("getEntryById Error:", error.message);
    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "Entry not found" });
    }
    res.status(500).json({ message: "Server error while fetching entry" });
  }
};

// ── @route   PUT /api/nutrition/:id ──────────────────────────────────────────
// ── @access  Protected
const updateEntry = async (req, res) => {
  try {
    const entry = await Nutrition.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({ message: "Nutrition entry not found" });
    }

    if (entry.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this entry" });
    }

    const { mealType, foodName, quantity, calories, protein, carbs, fats, date } = req.body;

    if (mealType  !== undefined) entry.mealType  = mealType.toLowerCase();
    if (foodName  !== undefined) entry.foodName  = foodName;
    if (quantity  !== undefined) entry.quantity  = quantity;
    if (calories  !== undefined) entry.calories  = parseFloat(calories) || 0;
    if (protein   !== undefined) entry.protein   = parseFloat(protein)  || 0;
    if (carbs     !== undefined) entry.carbs     = parseFloat(carbs)    || 0;
    if (fats      !== undefined) entry.fats      = parseFloat(fats)     || 0;
    if (date      !== undefined) entry.date      = date;

    const updated = await entry.save();

    res.status(200).json({
      message: "Nutrition entry updated successfully",
      entry:   updated,
    });
  } catch (error) {
    console.error("updateEntry Error:", error.message);
    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "Entry not found" });
    }
    res.status(500).json({ message: "Server error while updating entry" });
  }
};

// ── @route   DELETE /api/nutrition/:id ───────────────────────────────────────
// ── @access  Protected
const deleteEntry = async (req, res) => {
  try {
    const entry = await Nutrition.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({ message: "Nutrition entry not found" });
    }

    if (entry.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this entry" });
    }

    await entry.deleteOne();

    res.status(200).json({ message: "Nutrition entry deleted successfully" });
  } catch (error) {
    console.error("deleteEntry Error:", error.message);
    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "Entry not found" });
    }
    res.status(500).json({ message: "Server error while deleting entry" });
  }
};

module.exports = {
  createEntry,
  getEntries,
  getEntryById,
  updateEntry,
  deleteEntry,
};