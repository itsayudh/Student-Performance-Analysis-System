import axios from "axios";

// Base URL for your FastAPI backend.
// Auth routes live at the root (e.g. /auth/login).
// Everything else (predictions, students, etc.) lives under /api/v1.
const BASE_URL = "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request interceptor ──────────────────────────────────────────────
// Runs before every request. Attaches the JWT access token
// (if one exists) to the Authorization header automatically,
// so individual service files never need to do this manually.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// TODO (friend): once AuthContext + refresh token flow exists,
// add a response interceptor here that catches 401 errors,
// calls POST /auth/refresh, and retries the original request.

export default api;