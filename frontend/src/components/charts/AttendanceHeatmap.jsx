// Calendar-style heatmap showing daily attendance status for one month.
//
// Props:
//   records - array of { date: "2025-01-20", status: "PRESENT" | "ABSENT" | "LATE" }
//             Matches the shape returned by GET /attendance/student/{id}
//   month   - JS Date object representing which month to render (defaults to current month)
//
// Cells with no matching record (weekends not in the data, days before
// enrollment, future days) render as empty gray cells, same as the mockup.
function AttendanceHeatmap({ records = [], month = new Date() }) {
  const STATUS_COLORS = {
    PRESENT: "#1F9D63",
    LATE: "#D89614",
    ABSENT: "#D14343",
  };

  const STATUS_LABELS = {
    PRESENT: "Present",
    LATE: "Late",
    ABSENT: "Absent",
  };

  // Build a lookup so we can find a record by date string in O(1)
  // instead of searching the array for every single calendar cell.
  const recordsByDate = {};
  records.forEach((r) => {
    recordsByDate[r.date] = r.status;
  });

  const year = month.getFullYear();
  const monthIndex = month.getMonth();

  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const startWeekday = firstDayOfMonth.getDay(); // 0 = Sunday

  // Build a flat array of cells: empty padding cells before day 1,
  // then one cell per actual day of the month.
  const cells = [];
  for (let i = 0; i < startWeekday; i++) {
    cells.push({ empty: true });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({
      empty: false,
      day,
      status: recordsByDate[dateStr] || null,
    });
  }

  const monthLabel = month.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div>
      <p style={{ fontSize: "12px", color: "#6B7080", marginBottom: "12px" }}>{monthLabel}</p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "5px",
        }}
      >
        {cells.map((cell, index) => (
          <div
            key={index}
            title={cell.empty ? "" : `${monthLabel.split(" ")[0]} ${cell.day}${cell.status ? " — " + STATUS_LABELS[cell.status] : ""}`}
            style={{
              aspectRatio: "1",
              borderRadius: "4px",
              backgroundColor: cell.empty
                ? "transparent"
                : cell.status
                ? STATUS_COLORS[cell.status]
                : "#F5F6F8", // no record for this day yet
            }}
          />
        ))}
      </div>

      <div style={{ display: "flex", gap: "14px", marginTop: "12px", fontSize: "11px", color: "#6B7080" }}>
        {Object.entries(STATUS_LABELS).map(([status, label]) => (
          <div key={status} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span
              style={{
                width: "9px",
                height: "9px",
                borderRadius: "2px",
                backgroundColor: STATUS_COLORS[status],
                display: "inline-block",
              }}
            />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default AttendanceHeatmap;