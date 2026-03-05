const express = require("express");
const cors = require("cors");
const path = require("path");

// Load .env FIRST — before anything else
require("dotenv").config();

// Fallback agar .env se load na ho
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "fittrack_fallback_secret_key_2024";
  console.warn("⚠️  JWT_SECRET not found in .env — using fallback");
}

const connectDB = require("./config/db");

// Connect to MongoDB Atlas
connectDB();

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── Routes ────────────────────────────────────────────────────────────────────
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);
app.use("/api", authRoutes);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ message: "🏋️ Fitness Tracker API is running!" });
});

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Server Error:", err.message);
  res.status(err.status || 500).json({ message: err.message || "Internal server error" });
});

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔑 JWT_SECRET loaded: ${process.env.JWT_SECRET ? "✅ YES" : "❌ NO"}`);
});