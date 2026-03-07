const Progress = require("../models/Progress");

// ── @route   POST /api/progress ───────────────────────────────────────────────
// ── @access  Protected
const createEntry = async (req, res) => {
  try {
    const {
      weight, bodyFat, chest, waist, arms,
      liftingWeight, runTime, notes, date,
    } = req.body;

    // At least one metric required
    const hasData = [weight, bodyFat, chest, waist, arms, liftingWeight, runTime]
      .some(v => v !== undefined && v !== null && v !== "" && !isNaN(v));

    if (!hasData) {
      return res.status(400).json({ message: "Please provide at least one measurement" });
    }

    const entry = await Progress.create({
      userId:        req.user._id,
      weight:        weight        ? parseFloat(weight)        : null,
      bodyFat:       bodyFat       ? parseFloat(bodyFat)       : null,
      chest:         chest         ? parseFloat(chest)         : null,
      waist:         waist         ? parseFloat(waist)         : null,
      arms:          arms          ? parseFloat(arms)          : null,
      liftingWeight: liftingWeight ? parseFloat(liftingWeight) : null,
      runTime:       runTime       ? parseFloat(runTime)       : null,
      notes:         notes         || "",
      date:          date          || Date.now(),
    });

    res.status(201).json({
      message: "Progress entry created successfully",
      entry,
    });
  } catch (error) {
    console.error("createEntry Error:", error.message);
    if (error.name === "ValidationError") {
      const msg = Object.values(error.errors).map(e => e.message).join(", ");
      return res.status(400).json({ message: msg });
    }
    res.status(500).json({ message: "Server error while creating progress entry" });
  }
};

// ── @route   GET /api/progress ────────────────────────────────────────────────
// ── @access  Protected
const getEntries = async (req, res) => {
  try {
    const { limit = 100, page = 1 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [entries, total] = await Promise.all([
      Progress.find({ userId: req.user._id })
        .sort({ date: 1 })           // oldest first for charts
        .limit(parseInt(limit))
        .skip(skip),
      Progress.countDocuments({ userId: req.user._id }),
    ]);

    res.status(200).json({
      entries,
      total,
      page:       parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error("getEntries Error:", error.message);
    res.status(500).json({ message: "Server error while fetching progress entries" });
  }
};

// ── @route   GET /api/progress/:id ───────────────────────────────────────────
// ── @access  Protected
const getEntryById = async (req, res) => {
  try {
    const entry = await Progress.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({ message: "Progress entry not found" });
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

// ── @route   PUT /api/progress/:id ───────────────────────────────────────────
// ── @access  Protected
const updateEntry = async (req, res) => {
  try {
    const entry = await Progress.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({ message: "Progress entry not found" });
    }

    if (entry.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this entry" });
    }

    const {
      weight, bodyFat, chest, waist, arms,
      liftingWeight, runTime, notes, date,
    } = req.body;

    if (weight        !== undefined) entry.weight        = weight        ? parseFloat(weight)        : null;
    if (bodyFat       !== undefined) entry.bodyFat       = bodyFat       ? parseFloat(bodyFat)       : null;
    if (chest         !== undefined) entry.chest         = chest         ? parseFloat(chest)         : null;
    if (waist         !== undefined) entry.waist         = waist         ? parseFloat(waist)         : null;
    if (arms          !== undefined) entry.arms          = arms          ? parseFloat(arms)          : null;
    if (liftingWeight !== undefined) entry.liftingWeight = liftingWeight ? parseFloat(liftingWeight) : null;
    if (runTime       !== undefined) entry.runTime       = runTime       ? parseFloat(runTime)       : null;
    if (notes         !== undefined) entry.notes         = notes;
    if (date          !== undefined) entry.date          = date;

    const updated = await entry.save();

    res.status(200).json({
      message: "Progress entry updated successfully",
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

// ── @route   DELETE /api/progress/:id ────────────────────────────────────────
// ── @access  Protected
const deleteEntry = async (req, res) => {
  try {
    const entry = await Progress.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({ message: "Progress entry not found" });
    }

    if (entry.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this entry" });
    }

    await entry.deleteOne();

    res.status(200).json({ message: "Progress entry deleted successfully" });
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