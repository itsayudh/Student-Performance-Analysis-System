import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { chartAxisTick, chartGridStroke, chartTooltipStyle, chartSeriesColor, chartEmptyStyle } from "../../theme/chartTokens";

// Generic line chart for any trend data (GPA over semesters,
// attendance over weeks, etc).
//
// Props:
//   data       - array of objects, e.g. [{ semester: "Fall 2024", gpa: 3.2 }, ...]
//   xKey       - which field in each object is the x-axis label (e.g. "semester")
//   yKey       - which field is the numeric value to plot (e.g. "gpa")
//   color      - line color (defaults to indigo, matching the design theme)
//   yDomain    - optional [min, max] to fix the y-axis range (e.g. [0, 4] for GPA)
function LineChart({ data, xKey, yKey, color = chartSeriesColor, yDomain }) {
  if (!data || data.length === 0) {
    return <p style={chartEmptyStyle}>No data available yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <RechartsLineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={chartGridStroke} vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={chartAxisTick}
          axisLine={{ stroke: chartGridStroke }}
          tickLine={false}
        />
        <YAxis
          domain={yDomain || ["auto", "auto"]}
          tick={chartAxisTick}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={chartTooltipStyle}
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