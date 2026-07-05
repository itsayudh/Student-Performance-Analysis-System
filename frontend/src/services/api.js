import axios from "axios";

// Single shared Axios instance for the entire app.
// All other service files (authService.js, studentService.js, etc.)
// import THIS instance rather than creating their own — that way
// the token-injection and refresh logic below applies everywhere
// automatically.

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  withCredentials: true, // required so the HTTP-only refresh-token cookie
  // (Section 11.1) is sent/received automatically
});

// Module-level variable holding the current access token in memory.
// Set by AuthContext's login()/logout() via setAccessToken() below —
// this file has no React state of its own, since Axios interceptors
// live outside the component tree.
let currentAccessToken = null;

export function setAccessToken(token) {
  currentAccessToken = token;
}

// REQUEST interceptor — attaches the access token to every outgoing
// request automatically, so individual service functions never have
// to think about auth headers.
api.interceptors.request.use((config) => {
  if (currentAccessToken) {
    config.headers.Authorization = `Bearer ${currentAccessToken}`;
  }
  return config;
});

// RESPONSE interceptor — handles the 15-minute access token expiry
// (Section 11.1) by transparently calling /auth/refresh and retrying
// the original request ONCE. If refresh also fails, the session is
// truly over and the caller's .catch() will receive the error.
let isRefreshing = false;
let refreshQueue = [];

function processQueue(error, token = null) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  refreshQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh on a 401, and only once per request
    // (the _retry flag prevents an infinite retry loop if refresh
    // itself somehow returns 401 repeatedly).
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // A refresh is already in flight (e.g. two API calls failed
        // at once) — queue this request instead of firing a second
        // redundant refresh call.
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // NOTE: calls the endpoint directly, not through a service
        // function, to avoid a circular import (authService.js will
        // import THIS file). Kept intentionally minimal.
        const { data } = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true },
        );
        setAccessToken(data.access_token);
        processQueue(null, data.access_token);
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        setAccessToken(null);
        // TODO (later): also clear AuthContext's user state and
        // redirect to /login here — needs a way to reach AuthContext
        // from outside React. We'll wire this properly once
        // authService.js / AuthContext are connected in Step 9+.
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
