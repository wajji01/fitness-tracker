const express     = require("express");
const router      = express.Router();
const PDFDocument = require("pdfkit");
const { Parser }  = require("json2csv");
const { protect } = require("../middleware/authMiddleware");

// ── Require models directly (correct paths) ────────────────────────────────
const Workout   = require("../models/Workout");
const Nutrition = require("../models/Nutrition");
const Progress  = require("../models/Progress");

// ── Build full report from real DB data ────────────────────────────────────
async function buildReport(userId) {
  const [workouts, nutrition, progress] = await Promise.all([
    Workout.find({ userId }).lean(),
    Nutrition.find({ userId }).lean(),
    Progress.find({ userId }).lean(),
  ]);

  // Workouts
  const categoryBreakdown = workouts.reduce((a, w) => {
    const c = w.category || "other";
    a[c] = (a[c] || 0) + 1;
    return a;
  }, {});

  const recentWorkouts = [...workouts]
    .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
    .slice(0, 10);

  // Nutrition
  const totalCalories = nutrition.reduce((s, n) => s + (n.calories || 0), 0);
  const totalProtein  = nutrition.reduce((s, n) => s + (n.protein  || 0), 0);
  const totalCarbs    = nutrition.reduce((s, n) => s + (n.carbs    || 0), 0);
  const totalFats     = nutrition.reduce((s, n) => s + (n.fats     || 0), 0);
  const uniqueDays    = new Set(nutrition.map(n => (n.date || n.createdAt || "").toString().slice(0, 10))).size;
  const avgDailyCalories = uniqueDays ? Math.round(totalCalories / uniqueDays) : 0;

  // Progress / Weight
  const weightEntries = [...progress]
    .filter(p => p.weight > 0)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const startWeight  = weightEntries[0]?.weight    || null;
  const latestWeight = weightEntries.at(-1)?.weight || null;
  const weightChange = startWeight && latestWeight
    ? parseFloat((latestWeight - startWeight).toFixed(1)) : null;

  return {
    generatedAt: new Date().toISOString(),
    workouts: {
      total: workouts.length,
      categoryBreakdown,
      recent: recentWorkouts,
    },
    nutrition: {
      totalEntries: nutrition.length,
      totalCalories:    Math.round(totalCalories),
      totalProtein:     Math.round(totalProtein),
      totalCarbs:       Math.round(totalCarbs),
      totalFats:        Math.round(totalFats),
      avgDailyCalories,
    },
    progress: {
      totalEntries: progress.length,
      startWeight,
      latestWeight,
      weightChange,
      entries: weightEntries.slice(-20),
    },
  };
}

// ── GET /api/reports ────────────────────────────────────────────────────────
router.get("/", protect, async (req, res) => {
  try {
    const report = await buildReport(req.user._id);
    res.json(report);
  } catch (err) {
    console.error("[Reports GET]", err.message);
    res.status(500).json({ error: "Failed to generate report: " + err.message });
  }
});

// ── GET /api/reports/export/csv ─────────────────────────────────────────────
router.get("/export/csv", protect, async (req, res) => {
  try {
    const d = await buildReport(req.user._id);
    const sections = [];

    // Workouts table
    if (d.workouts.recent.length) {
      const p = new Parser({ fields: ["exerciseName", "category", "sets", "reps", "weight", "date"] });
      sections.push("WORKOUTS\n" + p.parse(d.workouts.recent.map(w => ({
        exerciseName: w.exerciseName || "",
        category:     w.category     || "",
        sets:         w.sets         || "",
        reps:         w.reps         || "",
        weight:       w.weight       || "",
        date: w.date ? new Date(w.date).toLocaleDateString() : "",
      }))));
    }

    // Nutrition summary
    sections.push(
      `\n\nNUTRITION SUMMARY\n` +
      `Total Meal Entries,${d.nutrition.totalEntries}\n` +
      `Total Calories,${d.nutrition.totalCalories} kcal\n` +
      `Total Protein,${d.nutrition.totalProtein}g\n` +
      `Total Carbs,${d.nutrition.totalCarbs}g\n` +
      `Total Fats,${d.nutrition.totalFats}g\n` +
      `Avg Daily Calories,${d.nutrition.avgDailyCalories} kcal`
    );

    // Weight progress table
    if (d.progress.entries.length) {
      const p = new Parser({ fields: ["date", "weight", "bodyFat", "chest", "waist", "arms"] });
      sections.push("\n\nWEIGHT PROGRESS\n" + p.parse(d.progress.entries.map(e => ({
        date:    e.date ? new Date(e.date).toLocaleDateString() : "",
        weight:  e.weight   || "",
        bodyFat: e.bodyFat  || "",
        chest:   e.chest    || "",
        waist:   e.waist    || "",
        arms:    e.arms     || "",
      }))));
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="fittrack-${Date.now()}.csv"`);
    res.send(sections.join("\n"));
  } catch (err) {
    console.error("[CSV Export]", err.message);
    res.status(500).json({ error: "CSV export failed: " + err.message });
  }
});

// ── GET /api/reports/export/pdf ─────────────────────────────────────────────
router.get("/export/pdf", protect, async (req, res) => {
  try {
    const d   = await buildReport(req.user._id);
    const doc = new PDFDocument({ margin: 0, size: "A4", bufferPages: true });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="fittrack-report-${Date.now()}.pdf"`);
    doc.pipe(res);

    const PW = 595, PH = 842;
    const ML = 48, MR = 48;
    const CW = PW - ML - MR;
    const VIOLET = "#6d28d9", VL = "#ede9fe";
    const DARK = "#111827", MID = "#374151", MUTED = "#9ca3af";
    const WHITE = "#ffffff", BORDER = "#e5e7eb", ROW_ALT = "#f9fafb";

    let y = 0;
    const ensureSpace = (n) => { if (y + n > PH - 60) { doc.addPage(); y = 48; } };

    // ── HEADER ───────────────────────────────────────────────────────────
    doc.rect(0, 0, PW, 130).fill(VIOLET);
    doc.save(); doc.opacity(0.07);
    for (let gx = 0; gx < PW; gx += 22)
      for (let gy = 0; gy < 130; gy += 22)
        doc.circle(gx, gy, 1.2).fill(WHITE);
    doc.restore();

    doc.roundedRect(ML, 24, 84, 20, 10).fill("rgba(255,255,255,0.18)");
    doc.fontSize(8).font("Helvetica-Bold").fillColor(WHITE)
       .text("FITTRACK", ML, 30, { width: 84, align: "center" });
    doc.fontSize(26).font("Helvetica-Bold").fillColor(WHITE).text("Fitness Report", ML, 54);
    doc.fontSize(10).font("Helvetica").fillColor("rgba(255,255,255,0.6)")
       .text(`Generated: ${new Date(d.generatedAt).toLocaleDateString("en-US",{ weekday:"long", year:"numeric", month:"long", day:"numeric" })}`, ML, 92);
    y = 150;

    // ── KPI CARDS ────────────────────────────────────────────────────────
    const kpis = [
      { label: "TOTAL WORKOUTS",  value: String(d.workouts.total),                  unit: "sessions" },
      { label: "CALORIES LOGGED", value: d.nutrition.totalCalories.toLocaleString(), unit: "kcal" },
      { label: "CURRENT WEIGHT",  value: d.progress.latestWeight ? `${d.progress.latestWeight}` : "—", unit: "kg" },
      { label: "MEAL ENTRIES",    value: String(d.nutrition.totalEntries),           unit: "meals" },
    ];
    const kW = Math.floor(CW / 4) - 4;
    kpis.forEach((k, i) => {
      const kx = ML + i * (kW + 5.4);
      doc.roundedRect(kx, y, kW, 72, 7).fill(WHITE);
      doc.roundedRect(kx, y, kW, 72, 7).lineWidth(0.4).stroke(BORDER);
      doc.rect(kx, y, kW, 4).fill(VIOLET);
      doc.roundedRect(kx, y, 4, 4, 0).fill(VIOLET);
      doc.roundedRect(kx + kW - 4, y, 4, 4, 0).fill(VIOLET);
      doc.fontSize(21).font("Helvetica-Bold").fillColor(DARK).text(k.value, kx + 10, y + 16, { width: kW - 20 });
      doc.fontSize(8).font("Helvetica").fillColor(MUTED).text(k.unit, kx + 10, y + 40, { width: kW - 20 });
      doc.fontSize(7).font("Helvetica-Bold").fillColor(MUTED).text(k.label, kx + 10, y + 52, { width: kW - 20, characterSpacing: 0.4 });
    });
    y += 94;

    // ── Helpers ──────────────────────────────────────────────────────────
    const section = (title) => {
      ensureSpace(38);
      doc.rect(ML, y, 3, 18).fill(VIOLET);
      doc.fontSize(12).font("Helvetica-Bold").fillColor(DARK).text(title, ML + 12, y + 2);
      y += 30;
    };

    const drawTable = (headers, rows, colWidths) => {
      const rowH = 22;
      ensureSpace(rowH * 2 + 10);
      doc.rect(ML, y, CW, rowH).fill(VL);
      let hx = ML;
      headers.forEach((h, i) => {
        doc.fontSize(7.5).font("Helvetica-Bold").fillColor(VIOLET)
           .text(h, hx + 8, y + 7, { width: colWidths[i] - 14, characterSpacing: 0.3 });
        hx += colWidths[i];
      });
      y += rowH;
      rows.forEach((row, ri) => {
        ensureSpace(rowH + 4);
        if (ri % 2 === 1) doc.rect(ML, y, CW, rowH).fill(ROW_ALT);
        doc.moveTo(ML, y + rowH).lineTo(ML + CW, y + rowH).lineWidth(0.25).stroke(BORDER);
        let cx = ML;
        row.forEach((cell, ci) => {
          doc.fontSize(9).font("Helvetica").fillColor(MID)
             .text(String(cell ?? "—"), cx + 8, y + 7, { width: colWidths[ci] - 14, ellipsis: true });
          cx += colWidths[ci];
        });
        y += rowH;
      });
      y += 14;
    };

    const statRows = (pairs) => {
      ensureSpace(pairs.length * 24 + 10);
      pairs.forEach((pair, i) => {
        if (i % 2 === 0) doc.rect(ML, y, CW, 24).fill(i % 4 < 2 ? WHITE : ROW_ALT);
        const col = i % 2 === 0 ? ML : ML + CW / 2;
        doc.fontSize(9).font("Helvetica").fillColor(MUTED).text(pair[0], col + 8, y + 7, { width: CW / 2 - 80 });
        doc.fontSize(9).font("Helvetica-Bold").fillColor(DARK).text(String(pair[1] ?? "—"), col + CW / 2 - 80, y + 7, { width: 72, align: "right" });
        if (i % 2 === 1 || i === pairs.length - 1) y += 24;
      });
      y += 8;
    };

    // ── SECTION 1: WORKOUTS ───────────────────────────────────────────────
    section("Workouts Overview");
    statRows([
      ["Total Workouts",    d.workouts.total],
      ["Categories",        Object.keys(d.workouts.categoryBreakdown).length],
      ...Object.entries(d.workouts.categoryBreakdown).map(([k, v]) => [`  ${k.charAt(0).toUpperCase()+k.slice(1)}`, `${v} sessions`]),
    ]);

    if (d.workouts.recent.length) {
      section("Recent Workout Sessions");
      drawTable(
        ["Exercise", "Category", "Sets", "Reps", "Weight", "Date"],
        d.workouts.recent.slice(0, 10).map(w => [
          w.exerciseName || "—",
          (w.category || "—").charAt(0).toUpperCase() + (w.category || "").slice(1),
          w.sets  || "—",
          w.reps  || "—",
          w.weight ? `${w.weight} kg` : "—",
          w.date ? new Date(w.date).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"2-digit"}) : "—",
        ]),
        [148, 82, 44, 44, 75, 106]
      );
    }

    // ── SECTION 2: NUTRITION ──────────────────────────────────────────────
    section("Nutrition Summary");
    const macros = [
      { label: "Calories", value: d.nutrition.totalCalories, unit: "kcal", max: Math.max(d.nutrition.totalCalories, 1), color: "#f97316" },
      { label: "Protein",  value: d.nutrition.totalProtein,  unit: "g",    max: Math.max(d.nutrition.totalProtein, d.nutrition.totalCarbs, d.nutrition.totalFats, 1), color: VIOLET },
      { label: "Carbs",    value: d.nutrition.totalCarbs,    unit: "g",    max: Math.max(d.nutrition.totalProtein, d.nutrition.totalCarbs, d.nutrition.totalFats, 1), color: "#06b6d4" },
      { label: "Fats",     value: d.nutrition.totalFats,     unit: "g",    max: Math.max(d.nutrition.totalProtein, d.nutrition.totalCarbs, d.nutrition.totalFats, 1), color: "#f59e0b" },
    ];
    ensureSpace(macros.length * 28 + 20);
    macros.forEach(m => {
      const barMax  = CW - 150;
      const barFill = Math.max(Math.round((m.value / m.max) * barMax), 4);
      doc.fontSize(9).font("Helvetica").fillColor(MID).text(m.label, ML, y + 5, { width: 72 });
      doc.roundedRect(ML + 82, y + 3, barMax, 13, 6).fill("#f3f4f6");
      doc.roundedRect(ML + 82, y + 3, barFill, 13, 6).fill(m.color);
      doc.fontSize(9).font("Helvetica-Bold").fillColor(DARK)
         .text(`${m.value.toLocaleString()} ${m.unit}`, ML + 82 + barMax + 10, y + 5, { width: 110 });
      y += 26;
    });
    y += 10;
    statRows([
      ["Total Meal Entries",    d.nutrition.totalEntries],
      ["Avg Daily Calories",    `${d.nutrition.avgDailyCalories} kcal`],
    ]);

    // ── SECTION 3: WEIGHT PROGRESS ────────────────────────────────────────
    section("Weight Progress");
    const wc = d.progress.weightChange;
    statRows([
      ["Starting Weight",   d.progress.startWeight  ? `${d.progress.startWeight} kg`  : "—"],
      ["Current Weight",    d.progress.latestWeight ? `${d.progress.latestWeight} kg` : "—"],
      ["Total Change",      wc !== null ? `${wc > 0 ? "+" : ""}${wc} kg` : "—"],
      ["Total Log Entries", d.progress.totalEntries],
    ]);

    if (d.progress.entries.length) {
      section("Weight Log");
      drawTable(
        ["Date", "Weight (kg)", "Body Fat %", "Chest (cm)", "Waist (cm)", "Arms (cm)"],
        d.progress.entries.slice(-12).map(e => [
          e.date ? new Date(e.date).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"2-digit"}) : "—",
          e.weight  || "—", e.bodyFat || "—", e.chest || "—", e.waist || "—", e.arms || "—",
        ]),
        [100, 80, 80, 80, 80, 79]
      );
    }

    // ── FOOTER on all pages ───────────────────────────────────────────────
    doc.flushPages();
    const range = doc.bufferedPageRange();
    const pages = range.count;
    for (let i = range.start; i < range.start + pages; i++) {
      doc.switchToPage(i);
      doc.rect(0, PH - 36, PW, 36).fill("#f9fafb");
      doc.moveTo(0, PH - 36).lineTo(PW, PH - 36).lineWidth(0.4).stroke(BORDER);
      doc.fontSize(8).font("Helvetica").fillColor(MUTED)
         .text("FitTrack • Confidential — For personal use only", ML, PH - 22, { width: CW - 60 });
      doc.fontSize(8).fillColor(MUTED)
         .text(`Page ${i + 1} of ${pages}`, ML, PH - 22, { width: CW, align: "right" });
    }

    doc.end();
  } catch (err) {
    console.error("[PDF Export]", err.message);
    if (!res.headersSent) res.status(500).json({ error: "PDF export failed: " + err.message });
  }
});

module.exports = router;