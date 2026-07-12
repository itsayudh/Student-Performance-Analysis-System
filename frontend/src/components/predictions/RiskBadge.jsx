import Box from "@mui/material/Box";
import { riskScale, font } from "../../theme/tokens";

// Risk-level flag: dot + mono uppercase label (GRIDLINE "flags, not
// blobs"). Color is never the only signal — the text label is always
// shown too, per the accessibility requirement (doc Section 4.8).
// Props contract unchanged: { level } — LOW/MEDIUM/HIGH/CRITICAL.
//
// The `1F` suffix is ~12% alpha of the risk color — a self-generating
// tint that reads correctly on both light paper and dark Blackboard,
// unlike the old hardcoded pastel backgrounds.
function RiskBadge({ level }) {
  const c = riskScale[level] || "#6B7080";
  const label = level
    ? level.charAt(0) + level.slice(1).toLowerCase()
    : "Unknown";

  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        px: 1.25,
        py: 0.4,
        borderRadius: "14px",
        border: `1px solid ${c}`,
        backgroundColor: `${c}1F`,
        color: c,
        fontFamily: font.mono,
        fontSize: "0.68rem",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
      }}
    >
      <Box component="span" sx={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: c, flexShrink: 0 }} />
      {label}
    </Box>
  );
}

export default RiskBadge;