/**
 * FitnessChatbot.jsx
 * ─────────────────────────────────────────────────────────────────
 * Floating AI Fitness Coach powered by Google Gemini.
 * Drop <FitnessChatbot /> anywhere in your app — it always floats
 * in the bottom-right corner, independent of page layout.
 *
 * Props: none
 * Deps : axios, tailwindcss, chatbotApi.js
 * ─────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { sendChatMessage } from "../../../services/chatbotApi";
import { API_BASE, authHeaders, BACKEND_URL } from "../../../config/api";

// ── Helpers ──────────────────────────────────────────────────────────────────
const timestamp = () =>
  new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

/** Parse **bold** and *italic* markdown into JSX */
function parseInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*"))
      return <em key={i}>{part.slice(1, -1)}</em>;
    return part;
  });
}

/** Render multi-line Gemini markdown into readable JSX */
function MarkdownMessage({ text }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1 text-[13px] leading-[1.6]">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;

        // Bullet: •  -  *  at start
        const bulletMatch = line.match(/^[\u2022\-\*]\s+(.*)/);
        if (bulletMatch) {
          return (
            <div key={i} className="flex gap-2">
              <span className="text-violet-400 mt-px flex-shrink-0">•</span>
              <span>{parseInline(bulletMatch[1])}</span>
            </div>
          );
        }

        // Numbered list: 1. 2.
        const numMatch = line.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={i} className="flex gap-2">
              <span className="text-violet-400 font-bold flex-shrink-0 w-4">{numMatch[1]}.</span>
              <span>{parseInline(numMatch[2])}</span>
            </div>
          );
        }

        // Heading: ## text
        const headMatch = line.match(/^#{1,3}\s+(.*)/);
        if (headMatch) {
          return (
            <p key={i} className="font-bold text-gray-800 mt-1">
              {parseInline(headMatch[1])}
            </p>
          );
        }

        return <p key={i}>{parseInline(line)}</p>;
      })}
    </div>
  );
}

// ── Typing indicator ─────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-4">
      {/* Bot avatar */}
      <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center
        bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-base shadow-sm">
        🤖
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm
        px-4 py-3 shadow-sm">
        <div className="flex gap-[5px] items-center h-[18px]">
          {[0, 1, 2].map(i => (
            <span key={i} className="block w-[7px] h-[7px] rounded-full bg-violet-400"
              style={{
                animation: "fitDot 1.2s ease-in-out infinite",
                animationDelay: `${i * 0.18}s`,
              }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Single message bubble ────────────────────────────────────────────────────
function MessageBubble({ msg, userAvatar, userInitials }) {
  const isUser = msg.role === "user";

  return (
    <div className={`flex items-end gap-2 mb-4 ${isUser ? "flex-row-reverse" : "flex-row"}`}
      style={{ animation: "fitFadeUp 0.3s ease both" }}>

      {/* Avatar */}
      {isUser ? (
        userAvatar ? (
          <img src={userAvatar} alt="You"
            className="w-8 h-8 rounded-full flex-shrink-0 object-cover ring-2 ring-violet-200 shadow-sm" />
        ) : (
          <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center
            text-white text-xs font-bold shadow-sm select-none
            bg-gradient-to-br from-violet-500 to-purple-700">
            {userInitials}
          </div>
        )
      ) : (
        <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center
          text-white text-sm shadow-sm select-none
          bg-gradient-to-br from-violet-500 to-indigo-600">
          🤖
        </div>
      )}

      {/* Bubble */}
      <div className={`max-w-[78%] rounded-2xl shadow-sm
        ${isUser
          ? "bg-gradient-to-br from-violet-600 to-purple-700 text-white rounded-br-sm px-4 py-2.5"
          : "bg-white border border-gray-100 text-gray-700 rounded-bl-sm px-4 py-3"}`}>

        {isUser ? (
          <p className="text-sm leading-relaxed">{msg.text}</p>
        ) : (
          <MarkdownMessage text={msg.text} />
        )}

        <p className={`text-[10px] mt-1.5 text-right select-none
          ${isUser ? "text-violet-200" : "text-gray-300"}`}>
          {msg.time}
        </p>
      </div>
    </div>
  );
}

// ── Quick-start chips shown before the first user message ────────────────────
const QUICK_CHIPS = [
  { emoji: "🔥", label: "Lose Weight",    prompt: "Create a weight loss plan for me" },
  { emoji: "💪", label: "Build Muscle",   prompt: "How do I build muscle effectively?" },
  { emoji: "🥗", label: "Diet Plan",      prompt: "Make me a healthy weekly diet plan" },
  { emoji: "🏃", label: "Cardio Routine", prompt: "Design a weekly cardio workout plan" },
  { emoji: "⚡", label: "Motivate Me",    prompt: "I'm losing motivation to workout. Help!" },
  { emoji: "😴", label: "Recovery Tips",  prompt: "How can I recover faster after workouts?" },
];

// ── Welcome message shown on first open ─────────────────────────────────────
const WELCOME = {
  id:   "__welcome__",
  role: "assistant",
  text: "Hey! 👋 I'm **FitCoach AI**, your personal trainer powered by **Wajahat Mustafa**.\n\nI can help you with:\n• 🔥 Weight loss strategies\n• 💪 Muscle building & strength\n• 🥗 Custom diet & meal plans\n• 🏃 Workout programming\n• 😴 Recovery & sleep tips\n• ⚡ Motivation & habit building\n\nWhat's your fitness goal today?",
  time: timestamp(),
};

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║  Main Component                                                           ║
// ╚═══════════════════════════════════════════════════════════════════════════╝
export default function FitnessChatbot() {
  const [open,      setOpen]      = useState(false);
  const [input,     setInput]     = useState("");
  const [messages,  setMessages]  = useState([WELCOME]);
  const [thinking,  setThinking]  = useState(false);
  const [error,     setError]     = useState("");
  const [unread,    setUnread]    = useState(1);   // nudge user to open
  const [userAvatar,   setUserAvatar]   = useState("");
  const [userInitials, setUserInitials] = useState("U");

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);

  // ── Fetch logged-in user for avatar ──────────────────────────────────────
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/api/users/me`, authHeaders());
        const user = data.user || data;
        if (user?.name) {
          setUserInitials(
            user.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
          );
        }
        const pic = user?.profilePicture || user?.avatar || "";
        if (pic) {
          setUserAvatar(pic.startsWith("http") ? pic : `${BACKEND_URL}/${pic.replace(/^\//, "")}`);
        }
      } catch {
        // silently fail — initials fallback will show
      }
    };
    fetchUser();
  }, []);

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  // ── Focus input & clear badge on open ────────────────────────────────────
  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [open]);

  // ── Core send logic ───────────────────────────────────────────────────────
  const handleSend = useCallback(async (overrideText) => {
    const text = (overrideText ?? input).trim();
    if (!text || thinking) return;

    const userMsg = { id: Date.now(), role: "user", text, time: timestamp() };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setError("");
    setThinking(true);

    try {
      // Pass last 12 turns as context (6 pairs)
      const history = messages
        .filter(m => m.id !== "__welcome__")
        .slice(-12)
        .map(m => ({ role: m.role, text: m.text }));

      const reply = await sendChatMessage(text, history);

      setMessages(prev => [...prev, {
        id:   Date.now() + 1,
        role: "assistant",
        text: reply,
        time: timestamp(),
      }]);
    } catch (err) {
      const msg = err?.response?.data?.error
        ?? err.message
        ?? "Connection error. Please check your internet and try again.";

      setError(msg);

      // Surface error inline so user doesn't miss it
      setMessages(prev => [...prev, {
        id:   Date.now() + 1,
        role: "assistant",
        text: `⚠️ ${msg}`,
        time: timestamp(),
      }]);
    } finally {
      setThinking(false);
    }
  }, [input, messages, thinking]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // Only show quick chips before the user's first message
  const showChips = messages.filter(m => m.role === "user").length === 0 && !thinking;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Keyframes (scoped — no global CSS file needed) ───────── */}
      <style>{`
        @keyframes fitDot {
          0%, 60%, 100% { transform: translateY(0);   opacity: 0.4; }
          30%            { transform: translateY(-5px); opacity: 1;   }
        }
        @keyframes fitFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes fitOpen {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to   { opacity: 1; transform: scale(1)   translateY(0);    }
        }
        @keyframes fitPing {
          0%   { transform: scale(1);   box-shadow: 0 0 0 0   rgba(124,58,237,0.5); }
          70%  { transform: scale(1.05);box-shadow: 0 0 0 10px rgba(124,58,237,0);  }
          100% { transform: scale(1);   box-shadow: 0 0 0 0   rgba(124,58,237,0);   }
        }
        .fit-open   { animation: fitOpen 0.32s cubic-bezier(0.16,1,0.3,1) both; }
        .fit-ping   { animation: fitPing 2.2s ease-in-out infinite; }
        .fit-scroll { scrollbar-width: thin; scrollbar-color: #ddd6fe transparent; }
        .fit-scroll::-webkit-scrollbar       { width: 4px; }
        .fit-scroll::-webkit-scrollbar-thumb { background: #ddd6fe; border-radius: 99px; }
      `}</style>

      {/* ══════════════════════════════════════════════════════════
          FLOATING BUTTON
      ══════════════════════════════════════════════════════════ */}
      <button
        onClick={() => setOpen(prev => !prev)}
        aria-label="Toggle AI Fitness Coach"
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl
          bg-gradient-to-br from-violet-600 to-indigo-700
          flex items-center justify-center text-white
          shadow-xl shadow-violet-400/40
          hover:shadow-2xl hover:shadow-violet-400/50
          hover:-translate-y-1 hover:scale-105
          active:scale-95 transition-all duration-200
          ${!open ? "fit-ping" : ""}`}
      >
        {/* Swap icons with rotate transition */}
        <span className={`absolute transition-all duration-200
          ${open ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-75"}`}>
          {/* X — close */}
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none"
            viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </span>
        <span className={`absolute transition-all duration-200
          ${open ? "opacity-0 -rotate-90 scale-75" : "opacity-100 rotate-0 scale-100"}`}>
          {/* Chat bubble */}
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none"
            viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
        </span>

        {/* Unread badge */}
        {!open && unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1
            bg-red-500 text-white text-[10px] font-extrabold
            rounded-full flex items-center justify-center shadow-sm">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* ══════════════════════════════════════════════════════════
          CHAT WINDOW
      ══════════════════════════════════════════════════════════ */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 flex flex-col bg-white
            rounded-3xl border border-gray-100 shadow-2xl shadow-black/10
            overflow-hidden fit-open"
          style={{
            width:  "min(390px, calc(100vw - 24px))",
            height: "min(600px, calc(100vh - 120px))",
          }}
        >
          {/* ── Header ─────────────────────────────────────────── */}
          <div className="relative flex-shrink-0 flex items-center gap-3 px-5 py-4
            bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-700">

            {/* Subtle dot-grid texture */}
            <div className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
                backgroundSize:  "18px 18px",
              }} />

            {/* Bot avatar with online dot */}
            <div className="relative w-10 h-10 rounded-xl bg-white/20 flex items-center
              justify-center text-xl flex-shrink-0">
              🤖
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400
                rounded-full border-2 border-violet-600" />
            </div>

            {/* Title */}
            <div className="relative flex-1 min-w-0">
              <h3 className="text-[15px] font-extrabold text-white leading-tight tracking-tight">
                FitCoach AI
              </h3>
              <p className="text-[11px] text-violet-200 mt-0.5">
                Powered by Wajahat Mustafa • Online
              </p>
            </div>

            {/* Close button */}
            <button
              onClick={() => setOpen(false)}
              className="relative w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25
                flex items-center justify-center text-white/70 hover:text-white
                transition-colors flex-shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none"
                viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* ── Messages ────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50/50 fit-scroll">
            {messages.map(msg => <MessageBubble key={msg.id} msg={msg} userAvatar={userAvatar} userInitials={userInitials} />)}
            {thinking && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* ── Quick-start chips ───────────────────────────────── */}
          {showChips && (
            <div className="flex-shrink-0 px-4 pt-3 pb-1 bg-white border-t border-gray-50">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                Quick Start
              </p>
              <div className="flex flex-wrap gap-1.5 pb-1">
                {QUICK_CHIPS.map(chip => (
                  <button
                    key={chip.label}
                    onClick={() => handleSend(chip.prompt)}
                    disabled={thinking}
                    className="flex items-center gap-1 text-xs font-semibold
                      px-3 py-1.5 rounded-xl
                      bg-violet-50 text-violet-700
                      border border-violet-100
                      hover:bg-violet-100 hover:border-violet-200
                      active:scale-95 transition-all
                      disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span>{chip.emoji}</span>
                    <span>{chip.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Input area ──────────────────────────────────────── */}
          <div className="flex-shrink-0 flex items-center gap-2 px-4 py-3
            bg-white border-t border-gray-100">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={thinking}
              placeholder={thinking ? "FitCoach is thinking…" : "Ask about fitness, diet, workouts…"}
              className="flex-1 text-sm px-4 py-2.5 rounded-xl
                border border-gray-200 bg-gray-50
                focus:bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-100
                outline-none transition-all placeholder:text-gray-400
                disabled:opacity-60 disabled:cursor-not-allowed"
            />

            {/* Send button */}
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || thinking}
              aria-label="Send message"
              className="w-10 h-10 flex-shrink-0 rounded-xl
                bg-gradient-to-br from-violet-600 to-indigo-700
                flex items-center justify-center text-white
                shadow-md shadow-violet-300/50
                hover:shadow-lg hover:shadow-violet-300/60
                hover:-translate-y-0.5
                active:scale-95
                disabled:opacity-40 disabled:cursor-not-allowed
                disabled:translate-y-0 disabled:shadow-none
                transition-all duration-150"
            >
              {thinking ? (
                /* Spinner */
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10"
                    stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                /* Send arrow */
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none"
                  viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.269 20.876L5.999 12zm0 0h7.5" />
                </svg>
              )}
            </button>
          </div>

          {/* ── Footer ─────────────────────────────────────────── */}
          <div className="flex-shrink-0 py-2 text-center bg-white border-t border-gray-50">
            <p className="text-[10px] text-gray-300 select-none">
              🤖 FitCoach AI • Not a substitute for medical advice
            </p>
          </div>
        </div>
      )}
    </>
  );
}