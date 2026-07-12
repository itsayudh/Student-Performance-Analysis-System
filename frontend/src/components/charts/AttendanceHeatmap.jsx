// Calendar-style attendance heatmap.
// Props: records [{ date: "YYYY-MM-DD", status }], month (JS Date, any day in month)
//
// v2: real calendar layout — weekday letters head each column, each cell
// shows its day number on the status color. Padding cells (before the
// 1st / after the last day) render empty.

const STATUS_COLORS = {
  PRESENT: "#2ECC71",
  LATE: "#F0B429",
  ABSENT: "#D14343",
};

const WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"]; // Sun-first

function AttendanceHeatmap({ records = [], month = new Date() }) {
  const year = month.getFullYear();
  const mon = month.getMonth();

  // date-string -> status lookup. Keys built manually (not new Date())
  // to avoid timezone shifting a "2026-07-12" into July 11 locally.
  const statusByDay = {};
  for (const r of records) {
    if (!r.date) continue;
    const [ry, rm, rd] = r.date.split("-").map(Number);
    if (ry === year && rm === mon + 1) statusByDay[rd] = r.status;
  }

  const daysInMonth = new Date(year, mon + 1, 0).getDate();
  const firstWeekday = new Date(year, mon, 1).getDay(); // 0 = Sunday

  // Build weeks: array of 7-slot rows; null = padding cell.
  const cells = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const monthLabel = month.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const cellBase = {
    width: 34,
    height: 34,
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 600,
  };

  return (
    <div>
      <p style={{ textAlign: "center", fontSize: 13, color: "#6B7080", margin: "0 0 8px" }}>
        {monthLabel}
      </p>

      {/* Weekday letter header */}
      <div style={{ display: "flex", gap: 4, justifyContent: "center", marginBottom: 4 }}>
        {WEEKDAY_LETTERS.map((letter, i) => (
          <div
            key={i}
            style={{ ...cellBase, height: 20, color: "#9AA0AB", fontWeight: 700 }}
          >
            {letter}
          </div>
        ))}
      </div>

      {/* Day grid */}
      {weeks.map((week, wi) => (
        <div key={wi} style={{ display: "flex", gap: 4, justifyContent: "center", marginBottom: 4 }}>
          {week.map((day, di) => {
            if (day === null) {
              return <div key={di} style={{ ...cellBase, background: "transparent" }} />;
            }
            const status = statusByDay[day];
            return (
              <div
                key={di}
                title={status ? `${day}: ${status}` : `${day}: no record`}
                style={{
                  ...cellBase,
                  backgroundColor: status ? STATUS_COLORS[status] : "#F0F1F3",
                  color: status ? "#FFFFFF" : "#9AA0AB",
                }}
              >
                {day}
              </div>
            );
          })}
        </div>
      ))}

      {/* Legend */}
      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 10, fontSize: 12 }}>
        {Object.entries(STATUS_COLORS).map(([label, color]) => (
          <span key={label} style={{ display: "flex", alignItems: "center", gap: 4, color: "#4A4F5A" }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color, display: "inline-block" }} />
            {label.charAt(0) + label.slice(1).toLowerCase()}
          </span>
        ))}
      </div>
    </div>
  );
}

export default AttendanceHeatmap;