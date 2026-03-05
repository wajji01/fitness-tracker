const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { register, login, getMe, updateMe, changePassword } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

// ── Multer config for profile picture uploads ─────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Save to /uploads folder
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, PNG and WEBP images are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

// ── Public Routes ─────────────────────────────────────────────────────────────
router.post("/register", upload.single("profilePicture"), register);
router.post("/login", login);

// ── Protected Routes ──────────────────────────────────────────────────────────
router.get("/users/me", protect, getMe);
router.put("/users/me", protect, upload.single("avatar"), updateMe);
router.put("/users/change-password", protect, changePassword);

module.exports = router;