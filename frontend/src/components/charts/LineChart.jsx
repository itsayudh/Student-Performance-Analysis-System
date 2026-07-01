import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Generic line chart for any trend data (GPA over semesters,
// attendance over weeks, etc).
//
// Props:
//   data       - array of objects, e.g. [{ semester: "Fall 2024", gpa: 3.2 }, ...]
//   xKey       - which field in each object is the x-axis label (e.g. "semester")
//   yKey       - which field is the numeric value to plot (e.g. "gpa")
//   color      - line color (defaults to indigo, matching the design theme)
//   yDomain    - optional [min, max] to fix the y-axis range (e.g. [0, 4] for GPA)
function LineChart({ data, xKey, yKey, color = "#4C5FD5", yDomain }) {
  if (!data || data.length === 0) {
    return <p style={{ fontSize: "13px", color: "#6B7080" }}>No data available yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <RechartsLineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#E4E6EB" vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 11, fill: "#6B7080" }}
          axisLine={{ stroke: "#E4E6EB" }}
          tickLine={false}
        />
        <YAxis
          domain={yDomain || ["auto", "auto"]}
          tick={{ fontSize: 11, fill: "#6B7080" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            fontSize: "12px",
            borderRadius: "8px",
            border: "1px solid #E4E6EB",
          }}
        />
        <Line
          type="monotone"
          dataKey={yKey}
          stroke={color}
          strokeWidth={2.5}
          dot={{ r: 3.5, fill: color }}
          activeDot={{ r: 5 }}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}

export default LineChart;