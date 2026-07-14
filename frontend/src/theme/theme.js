import { createTheme } from "@mui/material/styles";
import { color, font } from "./tokens";

// GRIDLINE — SPAS design system v2.
// (Replaces the earlier navy/Fraunces spec that previously lived in this
// file; that theme was never imported anywhere and is fully retired.)
//
// Exported as buildTheme(mode) so ThemeContext's existing light/dark
// toggle keeps working. "dark" is the provisional Blackboard variant —
// same tokens, inverted surfaces — a placeholder until it gets its own
// design pass.

const dark = {
  paper:    "#10161D",
  panel:    "#171F28",
  gridline: "#26313C",
  ink:      "#E5EAEF",
  ink60:    "#93A1AE",
  ink30:    "#5B6B7A",
};

export default function buildTheme(mode = "light") {
  const isDark = mode === "dark";
  const c = isDark
    ? { ...color, paper: dark.paper, panel: dark.panel, gridline: dark.gridline,
        ink: dark.ink, ink60: dark.ink60, ink30: dark.ink30 }
    : color;

  return createTheme({
    palette: {
      mode,
      primary:    { main: c.ultramarine, dark: c.ultramarineDark },
      success:    { main: c.success },
      warning:    { main: c.warning },
      error:      { main: c.danger },
      text:       { primary: c.ink, secondary: c.ink60, disabled: c.ink30 },
      divider:    c.gridline,
      background: { default: c.paper, paper: c.panel },
    },

    shape: { borderRadius: 10 },

    typography: {
      fontFamily: font.body,
      h4: { fontFamily: font.display, fontWeight: 700, fontSize: "1.55rem", letterSpacing: "-0.01em" },
      h5: { fontFamily: font.display, fontWeight: 600, fontSize: "1.25rem", letterSpacing: "-0.01em" },
      subtitle1: { fontFamily: font.display, fontWeight: 600, fontSize: "0.95rem" },
      button: { textTransform: "none", fontWeight: 600 },
    },

    components: {
      // The quadrille: faint measurement grid on the app background.
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: c.paper,
            backgroundImage: `
              repeating-linear-gradient(0deg,  transparent, transparent 23px, ${c.gridline}55 23px, ${c.gridline}55 24px),
              repeating-linear-gradient(90deg, transparent, transparent 23px, ${c.gridline}55 23px, ${c.gridline}55 24px)
            `,
          },
        },
      },

      // Flat paper panels — ruled border, never shadows.
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: { border: `1px solid ${c.gridline}`, backgroundImage: "none" },
        },
      },
      // Card sets its own elevation default separately from Paper —
      // flatten it too, or Card-based tiles cast shadows in a
      // shadow-free system.
      MuiCard: {
        defaultProps: { elevation: 0 },
      },

      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: { root: { borderRadius: 8 } },
      },

      // Flags, not blobs.
      MuiChip: {
        styleOverrides: {
          label: {
            fontFamily: font.mono,
            fontSize: "0.68rem",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          },
        },
      },

      MuiTableCell: {
        styleOverrides: {
          head: { fontWeight: 600, color: c.ink60, borderBottomColor: c.gridline },
          root: { borderBottomColor: c.gridline },
        },
      },

      MuiAppBar: { defaultProps: { elevation: 0 } },
    },
  });
}