require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const path    = require("path");

// ── JWT fallback ──────────────────────────────────────────────────────────────
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "fittrack_fallback_secret_key_2024";
  console.warn("⚠️  JWT_SECRET not found in .env — using fallback");
}

const connectDB = require("./config/db");
connectDB();

const { startReminderCron } = require("./cron/reminderCron");
startReminderCron();

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
// Add your Vercel frontend URL in FRONTEND_URL env variable
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL,         // e.g. https://fitness-tracker.vercel.app
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── Routes ────────────────────────────────────────────────────────────────────
const authRoutes          = require("./routes/authRoutes");
const workoutRoutes       = require("./routes/workoutRoutes");
const nutritionRoutes     = require("./routes/nutritionRoutes");
const progressRoutes      = require("./routes/progressRoutes");
const notificationRoutes  = require("./routes/notificationRoutes");
const chatRoutes          = require("./routes/chatRoute");
const reportsRoutes       = require("./routes/reportsRoute");
const reminderRoutes      = require("./routes/reminderRoutes");
const settingsRoutes      = require("./routes/settingsRoutes");

app.use("/api/auth",          authRoutes);
app.use("/api",               authRoutes);
app.use("/api/workouts",      workoutRoutes);
app.use("/api/nutrition",     nutritionRoutes);
app.use("/api/progress",      progressRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat",          chatRoutes);
app.use("/api/reports",       reportsRoutes);
app.use("/api/reminders",     reminderRoutes);
app.use("/api/settings",      settingsRoutes);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ message: "🏋️ Fitness Tracker API is running!" });
});

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Server Error:", err.message);
  res.status(err.status || 500).json({ message: err.message || "Internal server error" });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔑 JWT_SECRET: ${process.env.JWT_SECRET ? "✅ YES" : "❌ NO"}`);
  console.log(`🌐 Allowed origins:`, allowedOrigins);
});