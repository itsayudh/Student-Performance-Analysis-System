import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { color, font,} from "../../theme/tokens";
import { gradeScale } from "../../theme/tokens";
import { chartAxisTick, chartGridStroke, chartTooltipStyle, chartSeriesColor, chartEmptyStyle } from "../../theme/chartTokens";

// Default color sequence matching the design theme's risk/grade palette.
const DEFAULT_COLORS = Object.values(gradeScale);

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
    return <p style={chartEmptyStyle}>No data available yet.</p>;
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
          contentStyle={chartTooltipStyle}
        />
        <Legend
          layout="horizontal"
          align="center"
          verticalAlign="bottom"
          iconType="circle"
          iconSize={9}
          wrapperStyle={{ fontSize: "12px", fontFamily: font.mono }}
        />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}

export default PieChart;