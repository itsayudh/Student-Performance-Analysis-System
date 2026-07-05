import { createTheme } from "@mui/material/styles";

// SPAS Design System
// Source: Aayudh Pantha's design spec — institutional, data-dense, trustworthy.
// Palette meaning:
//   navy    -> primary / sidebar
//   slate   -> page background
//   white   -> cards
//   emerald -> good / pass (signal color)
//   amber   -> medium risk (signal color)
//   crimson -> high risk / critical (signal color)
//   indigo  -> interactive accent (buttons, links, focus states)

const colors = {
  navy: "#1B2A4A",
  slate: "#F6F7F9",
  white: "#FFFFFF",
  emerald: "#1F9D63",
  amber: "#D89614",
  crimson: "#D14343",
  indigo: "#4C5FD5",
};

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: colors.navy,
      contrastText: colors.white,
    },
    secondary: {
      main: colors.indigo,
      contrastText: colors.white,
    },
    background: {
      default: colors.slate,
      paper: colors.white,
    },
    success: {
      main: colors.emerald, // risk: LOW / pass
    },
    warning: {
      main: colors.amber, // risk: MEDIUM
    },
    error: {
      main: colors.crimson, // risk: HIGH / CRITICAL
    },
    text: {
      primary: "#1B2A4A",
      secondary: "#5A6478",
    },
  },

  typography: {
    fontFamily: '"Inter", sans-serif',
    // Fraunces reserved for headlines and KPI numbers only, per spec —
    // everything else (body, tables, forms, labels) stays Inter.
    h1: { fontFamily: '"Fraunces", serif', fontWeight: 600 },
    h2: { fontFamily: '"Fraunces", serif', fontWeight: 600 },
    h3: { fontFamily: '"Fraunces", serif', fontWeight: 600 },
    h4: { fontFamily: '"Fraunces", serif', fontWeight: 600 },
    // h5/h6 stay Inter — used for card titles/section headers, not KPI numbers
    button: {
      textTransform: "none", // institutional tone, not shouty all-caps buttons
      fontWeight: 600,
    },
  },

  shape: {
    borderRadius: 8,
  },

  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0 1px 3px rgba(27, 42, 74, 0.08)",
          border: "1px solid rgba(27, 42, 74, 0.06)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
  },
});

// Exported separately so RiskBadge (later, Task 22) and any component
// needing the raw signal colors directly can import without pulling
// the whole theme object.
export const riskColors = {
  LOW: colors.emerald,
  MEDIUM: colors.amber,
  HIGH: colors.crimson,
  CRITICAL: colors.crimson,
};

export default theme;
