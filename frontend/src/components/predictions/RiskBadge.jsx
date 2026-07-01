// Colored risk-level pill: a small dot + text label.
// Color is never the only signal — text label is always shown too,
// per the accessibility requirement in the documentation (Section 4.8).
//
// Props:
//   level - one of "LOW", "MEDIUM", "HIGH", "CRITICAL" (matches risk_level
//           field returned by your prediction/notification endpoints exactly)
function RiskBadge({ level }) {
  const STYLES = {
    LOW: {
      background: "#E6F6EE",
      color: "#0E6B43",
      dot: "#1F9D63",
      label: "Low",
    },
    MEDIUM: {
      background: "#FCF1DE",
      color: "#8A5A0B",
      dot: "#D89614",
      label: "Medium",
    },
    HIGH: {
      background: "#FBEAEA",
      color: "#A12D2D",
      dot: "#D14343",
      label: "High",
    },
    CRITICAL: {
      background: "#FBEAEA",
      color: "#A12D2D",
      dot: "#D14343",
      label: "Critical",
    },
  };

  // Fallback for any unexpected value, so a typo in backend data
  // doesn't crash the page — it just shows a neutral gray pill.
  const style = STYLES[level] || {
    background: "#F5F6F8",
    color: "#6B7080",
    dot: "#6B7080",
    label: level || "Unknown",
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "12px",
        fontWeight: 500,
        padding: "4px 10px",
        borderRadius: "20px",
        backgroundColor: style.background,
        color: style.color,
      }}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          backgroundColor: style.dot,
          flexShrink: 0,
        }}
      />
      {style.label}
    </span>
  );
}

export default RiskBadge;