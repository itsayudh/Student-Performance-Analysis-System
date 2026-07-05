import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Default color sequence matching the design theme's risk/grade palette.
// Used when the caller doesn't supply explicit colors per slice.
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
// Generic pie/donut chart for proportional data
// (grade distribution, pass/fail ratio, etc).
//
// Props:
//   data    - array of objects, e.g. [{ name: "A", value: 18 }, { name: "B", value: 32 }, ...]
//             NOTE: keys must be "name" and "value" — Recharts' Pie expects these
//             by default. If your data comes back with different keys
//             (like grade_distribution's { A: 18, B: 32, ... } object),
//             transform it before passing in — see usage note below.
//   colors  - optional array of hex colors, one per slice, in the same order as data
function PieChart({ data, colors = DEFAULT_COLORS }) {
  if (!data || data.length === 0) {
    return <p style={{ fontSize: "13px", color: "#6B7080" }}>No data available yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RechartsPieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={45}
          outerRadius={75}
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
          layout="vertical"
          align="right"
          verticalAlign="middle"
          iconType="circle"
          iconSize={9}
          wrapperStyle={{ fontSize: "13px" }}
        />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}

export default PieChart;