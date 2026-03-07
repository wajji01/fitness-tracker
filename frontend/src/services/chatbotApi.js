/**
 * chatbotApi.js
 * Axios service for sending messages to the AI Fitness Coach backend.
 *
 * Usage:
 *   import { sendChatMessage } from "../services/chatbotApi";
 *   const reply = await sendChatMessage("How do I lose weight?", history);
 */

import axios from "axios";
// import { API_BASE } from "../../config/api";
import { API_BASE } from "../config/api";

const CHAT_ENDPOINT = `${API_BASE}/api/chat`;

/**
 * Send a user message to the Gemini-powered fitness coach.
 *
 * @param {string} message      - The user's current message
 * @param {Array}  history      - Previous messages [{role: "user"|"assistant", text: string}]
 * @returns {Promise<string>}   - The AI's reply text
 * @throws  {Error}             - With a user-friendly message on failure
 */
export async function sendChatMessage(message, history = []) {
  const token = localStorage.getItem("token");

  const response = await axios.post(
    CHAT_ENDPOINT,
    {
      message: message.trim(),
      history: history.map(m => ({ role: m.role, text: m.text })),
    },
    {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      timeout: 35_000, // 35 s — Gemini can be slow on first cold call
    }
  );

  const { reply } = response.data;

  if (!reply) throw new Error("Empty response from AI.");

  return reply;
}