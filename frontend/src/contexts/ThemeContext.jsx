// src/contexts/ThemeContext.jsx
import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
} from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import buildTheme from "../theme/theme";

const ThemeToggleContext = createContext(null);

export function AppThemeProvider({ children }) {
  const [mode, setMode] = useState("light"); // "light" | "dark"

  const toggleTheme = useCallback(() => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  // GRIDLINE theme built from src/theme/theme.js — the inline
  // createTheme that used to live here is retired; all visual
  // decisions now come from the token layer.
  const theme = useMemo(() => buildTheme(mode), [mode]);

  const value = { mode, toggleTheme };

  return (
    <ThemeToggleContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeToggleContext.Provider>
  );
}

export function useThemeToggle() {
  const ctx = useContext(ThemeToggleContext);
  if (!ctx) {
    throw new Error("useThemeToggle must be used within an AppThemeProvider");
  }
  return ctx;
}