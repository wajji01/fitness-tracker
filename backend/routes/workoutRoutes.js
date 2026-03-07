const express    = require("express");
const router     = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createWorkout,
  getWorkouts,
  getWorkoutById,
  updateWorkout,
  deleteWorkout,
} = require("../controllers/workoutController");

// All workout routes are protected (require JWT token)

// ── /api/workouts ─────────────────────────────────────────────────────────────
router.route("/")
  .post(protect, createWorkout)   // POST   /api/workouts
  .get(protect,  getWorkouts);    // GET    /api/workouts

// ── /api/workouts/:id ─────────────────────────────────────────────────────────
router.route("/:id")
  .get(protect,    getWorkoutById)  // GET    /api/workouts/:id
  .put(protect,    updateWorkout)   // PUT    /api/workouts/:id
  .delete(protect, deleteWorkout);  // DELETE /api/workouts/:id

module.exports = router;