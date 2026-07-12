// GRIDLINE design tokens — the single source of truth for the visual
// system. Rule: no component anywhere hardcodes a hex; it imports from
// here (or inherits via the MUI theme, which is built from this file).

export const color = {
  // Surfaces
  paper:      "#F7F9FB",   // app background — cool graph-paper white
  panel:      "#FFFFFF",   // cards/panels
  gridline:   "#E3EBF3",   // borders, dividers, chart grids, quadrille

  // Ink
  ink:        "#16232E",   // primary text — fountain-pen blue-black
  ink60:      "#5B6B7A",   // secondary text, axis labels
  ink30:      "#A6B2BD",   // disabled, placeholders

  // Action
  ultramarine:      "#2743B3",
  ultramarineDark:  "#1D338F",   // hover
  ultramarineSoft:  "#E9EDFA",   // selected/nav-active backgrounds

  // Semantic — meaning only, never decoration
  success:    "#1F9D63",
  warning:    "#D89614",
  warningText:"#B37A0C",   // amber darkened for text-on-paper contrast
  danger:     "#D14343",

  // Portal accents (Phase 3 uses these in the shells)
  roleAdmin:   "#2743B3",
  roleTeacher: "#0E7C66",
  roleStudent: "#B23A78",
};

export const font = {
  display: `"Archivo", sans-serif`,        // headings, big numbers
  body:    `"Public Sans", sans-serif`,    // UI and body text
  mono:    `"Spline Sans Mono", monospace`,// EVERY number, code, id
};

// Reusable sx fragment: apply to any numeric display so the
// "numbers are always mono" rule is one import away.
export const numSx = {
  fontFamily: font.mono,
  fontVariantNumeric: "tabular-nums",
};

// 9-tier grade scale (matches gpa_calculator.py's tiers). B-tier
  // retuned from the retired indigo to the ultramarine family.
export const gradeScale = {
  "A+": "#1F9D63",
  A:    "#2ECC71",
  "B+": "#2743B3",
  B:    "#6B7FDC",
  "C+": "#B37A0C",
  C:    "#D89614",
  "D+": "#E08A66",
  D:    "#D14343",
  E:    "#A12D2D",
};

export const riskScale = {
  LOW: "#1F9D63",
  MEDIUM: "#D89614",
  HIGH: "#D14343",
  CRITICAL: "#A12D2D",
};