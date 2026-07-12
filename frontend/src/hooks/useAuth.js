// src/hooks/useAuth.js
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../contexts/AuthContext";
import * as authService from "../services/authService";
import { parseApiError } from "../utils/apiError";

/**
 * The auth "organism" glue. AuthContext holds STATE (who is logged in);
 * authService talks to the BACKEND; this hook combines them into actions
 * pages can call, with loading/error handling built in.
 *
 * Returns:
 *   { loginUser, logoutUser, isSubmitting, error, clearError }
 */

// Where each role lands after login — single source of truth.
const HOME_BY_ROLE = {
  ADMIN: "/admin/dashboard",
  TEACHER: "/teacher/dashboard",
  STUDENT: "/student/dashboard",
};

export default function useAuth() {
  const { login, logout } = useAuthContext();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null); // { title, messages } for AlertBanner

  const loginUser = useCallback(
    async (email, password) => {
      setIsSubmitting(true);
      setError(null);
      try {
        // authService.login() already registers the token with api.js's
        // interceptor; we mirror it into React state so ProtectedRoute
        // and Navbar re-render.
        const data = await authService.login(email, password);
        login(data.access_token, data.user);
        navigate(HOME_BY_ROLE[data.user?.role] ?? "/login", { replace: true });
        return true;
      } catch (err) {
        setError(parseApiError(err));
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [login, navigate],
  );

  const logoutUser = useCallback(async () => {
    // Backend first (revokes the refresh cookie server-side), then local
    // state. authService.logout() clears the api.js token even if the
    // network call fails, and we clear React state unconditionally too —
    // the user must never be stuck "logged in" on a dead session.
    try {
      await authService.logout();
    } finally {
      logout();
      navigate("/login", { replace: true });
    }
  }, [logout, navigate]);

  const clearError = useCallback(() => setError(null), []);

  return { loginUser, logoutUser, isSubmitting, error, clearError };
}
