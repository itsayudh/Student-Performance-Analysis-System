import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Default color sequence matching the design theme's risk/grade palette.
const DEFAULT_COLORS = [
  "#1F9D63",   // A+  emerald
  "#2ECC71",   // A   lighter emerald
  "#4C5FD5",   // B+  indigo
  "#7B8FE8",   // B   lighter indigo
  "#D89614",   // C+  amber
  "#F0B429",   // C   lighter amber
  "#F0997B",   // D+  salmon
  "#D14343",   // D   crimson
  "#A12D2D",   // E   dark crimson
];

// Generic pie/donut chart for proportional data.
//
// v2 layout note: the legend moved from the right side to BELOW the
// chart. A vertical side legend works for 3-4 slices, but with the full
// 9-grade scale it grew taller than the 220px container, stole width
// from the pie, and clipped the circle. A bottom legend wraps
// horizontally instead, so the donut always gets the full card width
// regardless of slice count.
//
// Props: data [{ name, value }], colors (optional, per-slice)
function PieChart({ data, colors = DEFAULT_COLORS }) {
  if (!data || data.length === 0) {
    return <p style={{ fontSize: "13px", color: "#6B7080" }}>No data available yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsPieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="45%"
          innerRadius="48%"     /* was 55 (px) — now scales with the card */
          outerRadius="78%"     /* was 90 (px) — now scales with the card */
          paddingAngle={2}
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            fontSize: "12px",
            borderRadius: "8px",
            border: "1px solid #E4E6EB",
          }}
        />
        <Legend
          layout="horizontal"
          align="center"
          verticalAlign="bottom"
          iconType="circle"
          iconSize={9}
          wrapperStyle={{ fontSize: "13px" }}
        />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}

export default PieChart;