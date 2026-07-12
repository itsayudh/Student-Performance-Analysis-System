// src/contexts/AuthContext.jsx
import {
  createContext,
  useState,
  useContext,
  useCallback,
  useEffect,
} from "react";
import * as authService from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Access token kept in memory only (per SPAS security spec: never localStorage)
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null); // { id, email, role, full_name }
  const [isLoading, setIsLoading] = useState(true); // true until refresh check completes

  // SILENT REFRESH ON BOOT:
  // On a hard reload the in-memory token is gone, but the httpOnly
  // refresh cookie (set by the backend at login) survives in the browser.
  // So we ask the backend "is this cookie still good?" — if yes, we get
  // a fresh access token + user back and the session continues seamlessly.
  // If no (no cookie / expired / revoked), the catch runs and the user
  // simply stays logged out. Either way, isLoading flips to false LAST,
  // which is what releases ProtectedRoute from its spinner.
  useEffect(() => {
    authService
      .refreshToken()
      .then((data) => {
        setAccessToken(data.access_token);
        setUser(data.user ?? null);
      })
      .catch(() => {
        // No valid session — perfectly normal on first visit.
        // authService already cleared the api.js token for us.
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback((token, userData) => {
    setAccessToken(token);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  const value = {
    accessToken,
    user,
    role: user?.role ?? null,
    isAuthenticated: !!accessToken,
    isLoading,
    setIsLoading,
    login,
    logout,
    setAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return ctx;
}
