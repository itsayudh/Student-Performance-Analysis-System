// Single recommendation card: colored priority dot + message + metadata.
//
// Props:
//   recommendation - object matching your RecommendationRecord shape exactly:
//                     { id, recommendation_type, message, priority, is_read, created_at }
//   onMarkRead     - optional callback fired when the user clicks "Mark as read".
//                     Receives the recommendation's id. If not provided, the
//                     mark-as-read button is hidden (e.g. for a teacher viewing
//                     a student's recommendations read-only).
function RecommendationCard({ recommendation, onMarkRead }) {
  const { id, recommendation_type, message, priority, is_read, created_at } = recommendation;

  const PRIORITY_COLORS = {
    HIGH: "#D14343",
    MEDIUM: "#D89614",
    LOW: "#1F9D63",
  };

  const dotColor = PRIORITY_COLORS[priority] || "#6B7080";

  // Converts a timestamp into "2 hours ago" / "Yesterday" / "3 days ago",
  // matching the relative-time style shown in the mockup.
  const timeAgo = (dateStr) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHrs / 24);

    if (diffHrs < 1) return "Just now";
    if (diffHrs < 24) return `${diffHrs} hour${diffHrs === 1 ? "" : "s"} ago`;
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  };

  return (
    <div
      style={{
        display: "flex",
        gap: "12px",
        padding: "14px",
        borderRadius: "10px",
        border: "1px solid #E4E6EB",
        opacity: is_read ? 0.6 : 1, // read items fade slightly, stay visible
      }}
    >
      <span
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: dotColor,
          flexShrink: 0,
          marginTop: "5px",
        }}
      />
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: "13px", lineHeight: 1.5 }}>{message}</p>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "6px",
          }}
        >
          <p style={{ fontSize: "11px", color: "#6B7080" }}>
            {priority.charAt(0) + priority.slice(1).toLowerCase()} priority ·{" "}
            {recommendation_type.charAt(0) + recommendation_type.slice(1).toLowerCase()} ·{" "}
            {timeAgo(created_at)}
          </p>

          {onMarkRead && !is_read && (
            <button
              onClick={() => onMarkRead(id)}
              style={{
                fontSize: "11px",
                color: "#4C5FD5",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              Mark as read
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default RecommendationCard;