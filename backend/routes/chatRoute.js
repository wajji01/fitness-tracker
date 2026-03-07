const express        = require("express");
const router         = express.Router();
const { GoogleGenAI } = require("@google/genai");

// ── Client — reads GEMINI_API_KEY from .env automatically ───────────────────
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `You are FitCoach AI, an expert fitness and nutrition coach embedded
inside a professional Fitness Tracker web application.

PERSONALITY:
- Warm, motivating, and encouraging — like a personal trainer who genuinely cares
- Evidence-based fitness science only
- Structured: bullet points, bold key numbers, clear sections
- Concise: under 280 words unless a full plan is requested
- Always end with one actionable tip or follow-up question

EXPERTISE: Weight loss, muscle gain, workout programming, nutrition & macros,
recovery, sleep, evidence-based supplements, habit building & mindset.

FORMATTING:
- **Bold** important numbers and terms
- Use bullet points for lists
- Use fitness emojis naturally: 💪 🔥 🏃 🥗 😴 ⚡ 🎯

SCOPE: Only answer fitness, health, nutrition, and wellness questions.
If asked something unrelated, say:
"That is outside my fitness expertise! Let us focus on your health goals. 💪"`;

// ── POST /api/chat ──────────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ error: "Message is required." });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY not set in .env" });
    }

    // Build conversation history as plain text for context
    const historyText = history
      .slice(-10)
      .filter(m => m.role && m.text)
      .map(m => `${m.role === "user" ? "User" : "FitCoach"}: ${m.text}`)
      .join("\n");

    // Full prompt = system instructions + history + new message
    const fullPrompt = [
      SYSTEM_PROMPT,
      historyText ? `\nPrevious conversation:\n${historyText}` : "",
      `\nUser: ${message.trim()}`,
      `FitCoach:`,
    ].join("\n");

    // ── Call Gemini with new @google/genai SDK ────────────────────────────
    // Try gemini-2.5-flash first (stable), fallback to gemini-2.0-flash
    let response;
    try {
      response = await ai.models.generateContent({
        model:    "gemini-2.5-flash",
        contents: fullPrompt,
        config: {
          temperature:     0.8,
          maxOutputTokens: 900,
        },
      });
    } catch (modelErr) {
      // If 2.5 not available on this key, try 2.0
      if (modelErr.message?.includes("404") || modelErr.message?.includes("not found")) {
        response = await ai.models.generateContent({
          model:    "gemini-2.0-flash",
          contents: fullPrompt,
          config: {
            temperature:     0.8,
            maxOutputTokens: 900,
          },
        });
      } else {
        throw modelErr;
      }
    }

    const reply = response.text;

    if (!reply) {
      return res.status(500).json({ error: "Empty response from AI." });
    }

    return res.status(200).json({ reply });

  } catch (err) {
    console.error("[Gemini Error]", err.message);

    if (err.message?.includes("401") || err.message?.includes("API_KEY_INVALID")) {
      return res.status(401).json({ error: "Invalid Gemini API key. Check your .env file." });
    }
    if (err.message?.includes("429") || err.message?.includes("quota") || err.message?.includes("QUOTA")) {
      return res.status(429).json({
        error: "Free quota exceeded. Please get a fresh API key from aistudio.google.com",
      });
    }
    if (err.message?.includes("404") || err.message?.includes("not found")) {
      return res.status(500).json({ error: "Model unavailable. Check your API key region/permissions." });
    }

    return res.status(500).json({ error: "AI service unavailable. Please try again." });
  }
});

module.exports = router;