// src/contexts/AuthContext.jsx
import { createContext, useState, useContext, useCallback } from "react";
import { useEffect } from "react"; // add to existing import line


const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Access token kept in memory only (per SPAS security spec: never localStorage)
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null); // { id, email, role, full_name }
  const [isLoading, setIsLoading] = useState(true); // true until refresh check completes

  useEffect(() => {
    // TODO: replace this with a real silent refresh call once authService.js exists:
    // authService.refresh().then(token => setAccessToken(token)).finally(() => setIsLoading(false))
    // For now, no session persistence — just stop blocking on load.
    setIsLoading(false);
  }, []);

  const login = useCallback((token, userData) => {
    setAccessToken(token);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    // TODO: friend/teammate wires actual POST /auth/logout call via authService
    // TODO: api.js interceptor should also clear on 401 loop
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
    setAccessToken, // exposed so the refresh-token flow in api.js can silently update it
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
