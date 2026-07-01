import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";

// Generic bar chart for comparison data (subject scores,
// department GPA, grade distribution counts, etc).
//
// Props:
//   data        - array of objects, e.g. [{ subject: "CS301", score: 74 }, ...]
//   xKey        - field used as the bar label (e.g. "subject")
//   yKey        - field used as the bar height value (e.g. "score")
//   color       - default bar color (indigo, matches design theme)
//   colorRules  - OPTIONAL array of { threshold, color } to color bars by value,
//                 e.g. [{ threshold: 60, color: "#D14343" }, { threshold: 75, color: "#D89614" }]
//                 Bars below the lowest threshold get that color; this lets a
//                 "subject score" bar turn red if it's failing, amber if borderline,
//                 without the caller having to pre-process the data.
//   yDomain     - optional [min, max] to fix the y-axis range
function BarChart({ data, xKey, yKey, color = "#4C5FD5", colorRules, yDomain }) {
  if (!data || data.length === 0) {
    return <p style={{ fontSize: "13px", color: "#6B7080" }}>No data available yet.</p>;
  }

  // Determine the color for a single bar based on its value,
  // falling back to the default color if no rules are given.
  const getBarColor = (value) => {
    if (!colorRules) return color;
    // colorRules should be sorted ascending by threshold before calling this
    const sorted = [...colorRules].sort((a, b) => a.threshold - b.threshold);
    const match = sorted.find((rule) => value < rule.threshold);
    return match ? match.color : color;
  };

  return (
    <ResponsiveContainer width="100%" height={200}>
      <RechartsBarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
        <Bar dataKey={yKey} radius={[6, 6, 0, 0]} maxBarSize={36}>
          {data.map((entry, index) => (
            <Cell key={index} fill={getBarColor(entry[yKey])} />
          ))}
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}

export default BarChart;