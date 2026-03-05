// ── API Base URL ──────────────────────────────────────────────────────────────
// Automatically uses:
//   - http://localhost:5000  in development
//   - your Railway URL       in production (from Vercel env vars)

export const API_BASE    = import.meta.env.VITE_API_URL || "http://localhost:5000";
export const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function authHeaders() {
  return {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  };
}

export function getAvatarUrl(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${BACKEND_URL}${path}`;
}