// utils/formatters.js
// Formatting helpers for GPA, scores, grades, dates, and percentages.
//
// GRADE SCALE NOTE: The SPAS documentation (Section 3.5.2) describes a
// 5-tier scale (A/B/C/D/F), but the actual backend implementation
// (gpa_calculator.py, analytics_service.py) uses a 9-tier scale:
// A+/A/B+/B/C+/C/D+/D/E. This file follows the ACTUAL backend scale,
// not the stale documentation. If the doc is ever updated to match,
// nothing here needs to change since we're already aligned with the code.

// Matches gpa_calculator.py's score_to_letter_grade() exactly.
// Kept in sync manually — if the backend thresholds ever change,
// this must be updated too, since there's no shared schema between
// Python and JS for this logic.
export function scoreToGrade(score) {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B+";
  if (score >= 60) return "B";
  if (score >= 50) return "C+";
  if (score >= 40) return "C";
  if (score >= 30) return "D+";
  if (score >= 20) return "D";
  return "E";
}

// Color for each grade, matching PieChart.jsx's DEFAULT_COLORS exactly
// (emerald for top grades, ambers in the middle, crimson at the bottom).
// Centralized here so any component needing a grade color (not just
// PieChart) can import one consistent mapping instead of redefining it.
const GRADE_COLORS = {
  "A+": "#1F9D63",
  A: "#2ECC71",
  "B+": "#4C5FD5",
  B: "#7B8FE8",
  "C+": "#D89614",
  C: "#F0B429",
  "D+": "#F0997B",
  D: "#D14343",
  E: "#A12D2D",
};

export function gradeColor(grade) {
  return GRADE_COLORS[grade] || "#6B7080"; // neutral gray fallback for unknown input
}

// Formats a raw percentage score for display: 73.456 -> "73.5%"
export function formatPercentage(value, decimals = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${Number(value).toFixed(decimals)}%`;
}

// Formats a GPA value for display: 3.2 -> "3.20" (always 2 decimals,
// since GPA on the 4.0 scale is conventionally shown to 2 places
// e.g. AdminDashboard's "3.20" mockup in Section 9.4 of the doc).
export function formatGPA(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return Number(value).toFixed(2);
}

// Formats a failure_probability (0.0-1.0 from the ML model) as a
// rounded percentage: 0.13 -> "13%". Matches the style already used
// in PredictionCard.jsx's inline formatting — centralizing it here
// so future pages don't reimplement the same (value * 100).toFixed(0) logic.
export function formatFailureProbability(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${Math.round(value * 100)}%`;
}

// Formats an ISO date string into "Jan 15, 2025" style, matching the
// date format already used in PredictionCard.jsx and RecommendationCard.jsx.
export function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Converts a timestamp into relative time: "2 hours ago", "Yesterday",
// "3 days ago". This is a DUPLICATE of the timeAgo() function already
// inlined inside RecommendationCard.jsx — that component keeps its own
// copy since it was built before this file existed. Not fixing that now
// since it's out of scope for Layer E page-building, but worth noting:
// once pages are done, RecommendationCard.jsx could be refactored to
// import this instead of its inline version.
export function formatRelativeTime(dateStr) {
  if (!dateStr) return "—";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHrs / 24);

  if (diffHrs < 1) return "Just now";
  if (diffHrs < 24) return `${diffHrs} hour${diffHrs === 1 ? "" : "s"} ago`;
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

// Risk-level color, matching RiskBadge.jsx's STYLES dot colors exactly.
// Useful for anywhere that needs the raw color without rendering the
// full badge component (e.g. a chart bar colored by risk level).
const RISK_COLORS = {
  LOW: "#1F9D63",
  MEDIUM: "#D89614",
  HIGH: "#D14343",
  CRITICAL: "#D14343",
};

export function riskColor(level) {
  return RISK_COLORS[level] || "#6B7080";
}