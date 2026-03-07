const express     = require("express");
const router      = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createEntry,
  getEntries,
  getEntryById,
  updateEntry,
  deleteEntry,
} = require("../controllers/nutritionController");

// ── /api/nutrition ────────────────────────────────────────────────────────────
router.route("/")
  .post(protect, createEntry)  // POST   /api/nutrition
  .get(protect,  getEntries);  // GET    /api/nutrition

// ── /api/nutrition/:id ────────────────────────────────────────────────────────
router.route("/:id")
  .get(protect,    getEntryById)  // GET    /api/nutrition/:id
  .put(protect,    updateEntry)   // PUT    /api/nutrition/:id
  .delete(protect, deleteEntry);  // DELETE /api/nutrition/:id

module.exports = router;