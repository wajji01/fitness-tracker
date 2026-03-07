const express     = require("express");
const router      = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createEntry,
  getEntries,
  getEntryById,
  updateEntry,
  deleteEntry,
} = require("../controllers/progressController");

// ── /api/progress ─────────────────────────────────────────────────────────────
router.route("/")
  .post(protect, createEntry)  // POST   /api/progress
  .get(protect,  getEntries);  // GET    /api/progress

// ── /api/progress/:id ─────────────────────────────────────────────────────────
router.route("/:id")
  .get(protect,    getEntryById)  // GET    /api/progress/:id
  .put(protect,    updateEntry)   // PUT    /api/progress/:id
  .delete(protect, deleteEntry);  // DELETE /api/progress/:id

module.exports = router;