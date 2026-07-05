// src/contexts/ThemeContext.jsx
import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
} from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const ThemeToggleContext = createContext(null);

export function AppThemeProvider({ children }) {
  const [mode, setMode] = useState("light"); // "light" | "dark"

  const toggleTheme = useCallback(() => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  // Recompute the MUI theme only when mode changes
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: "#1565C0" },
          secondary: { main: "#2E7D32" },
        },
      }),
    [mode],
  );

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
