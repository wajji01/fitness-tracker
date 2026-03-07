const Workout = require("../models/Workout");

// ── @route   POST /api/workouts ───────────────────────────────────────────────
// ── @access  Protected
const createWorkout = async (req, res) => {
  try {
    const { exerciseName, exercise, sets, reps, weight, category, notes, date } = req.body;

    // Accept both "exerciseName" and "exercise" from frontend
    const name = exerciseName || exercise;

    // Validate required field
    if (!name) {
      return res.status(400).json({ message: "Exercise name is required" });
    }

    const workout = await Workout.create({
      userId:       req.user._id,  // from auth middleware
      exerciseName: name,
      sets:     sets     || 1,
      reps:     reps     || 1,
      weight:   weight   || 0,
      category: (category || "strength").toLowerCase(), // normalize to lowercase
      notes:    notes    || "",
      date:     date     || Date.now(),
    });

    res.status(201).json({
      message: "Workout created successfully",
      workout,
    });
  } catch (error) {
    console.error("createWorkout Error:", error.message);
    // Send validation error details to frontend
    if (error.name === "ValidationError") {
      const msg = Object.values(error.errors).map(e => e.message).join(", ");
      return res.status(400).json({ message: msg });
    }
    res.status(500).json({ message: "Server error while creating workout" });
  }
};

// ── @route   GET /api/workouts ────────────────────────────────────────────────
// ── @access  Protected
const getWorkouts = async (req, res) => {
  try {
    // Optional filters from query params
    // e.g. /api/workouts?category=strength&limit=10&page=1
    const { category, limit = 50, page = 1 } = req.query;

    const filter = { userId: req.user._id };
    if (category) filter.category = category;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [workouts, total] = await Promise.all([
      Workout.find(filter)
        .sort({ date: -1 })          // newest first
        .limit(parseInt(limit))
        .skip(skip),
      Workout.countDocuments(filter),
    ]);

    res.status(200).json({
      workouts,
      total,
      page:       parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error("getWorkouts Error:", error.message);
    res.status(500).json({ message: "Server error while fetching workouts" });
  }
};

// ── @route   GET /api/workouts/:id ────────────────────────────────────────────
// ── @access  Protected
const getWorkoutById = async (req, res) => {
  try {
    const workout = await Workout.findById(req.params.id);

    // Check if workout exists
    if (!workout) {
      return res.status(404).json({ message: "Workout not found" });
    }

    // Check if workout belongs to logged in user
    if (workout.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to view this workout" });
    }

    res.status(200).json({ workout });
  } catch (error) {
    console.error("getWorkoutById Error:", error.message);

    // Handle invalid MongoDB ObjectId
    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "Workout not found" });
    }
    res.status(500).json({ message: "Server error while fetching workout" });
  }
};

// ── @route   PUT /api/workouts/:id ────────────────────────────────────────────
// ── @access  Protected
const updateWorkout = async (req, res) => {
  try {
    const workout = await Workout.findById(req.params.id);

    // Check if workout exists
    if (!workout) {
      return res.status(404).json({ message: "Workout not found" });
    }

    // Check ownership
    if (workout.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this workout" });
    }

    // Only update fields that were sent
    const { exerciseName, sets, reps, weight, category, notes, date } = req.body;

    const name = exerciseName || exercise;
    if (name      !== undefined) workout.exerciseName = name;
    if (sets        !== undefined) workout.sets         = sets;
    if (reps        !== undefined) workout.reps         = reps;
    if (weight      !== undefined) workout.weight       = weight;
    if (category    !== undefined) workout.category     = category;
    if (notes       !== undefined) workout.notes        = notes;
    if (date        !== undefined) workout.date         = date;

    const updatedWorkout = await workout.save();

    res.status(200).json({
      message: "Workout updated successfully",
      workout: updatedWorkout,
    });
  } catch (error) {
    console.error("updateWorkout Error:", error.message);
    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "Workout not found" });
    }
    res.status(500).json({ message: "Server error while updating workout" });
  }
};

// ── @route   DELETE /api/workouts/:id ─────────────────────────────────────────
// ── @access  Protected
const deleteWorkout = async (req, res) => {
  try {
    const workout = await Workout.findById(req.params.id);

    // Check if workout exists
    if (!workout) {
      return res.status(404).json({ message: "Workout not found" });
    }

    // Check ownership
    if (workout.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this workout" });
    }

    await workout.deleteOne();

    res.status(200).json({ message: "Workout deleted successfully" });
  } catch (error) {
    console.error("deleteWorkout Error:", error.message);
    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "Workout not found" });
    }
    res.status(500).json({ message: "Server error while deleting workout" });
  }
};

module.exports = {
  createWorkout,
  getWorkouts,
  getWorkoutById,
  updateWorkout,
  deleteWorkout,
};