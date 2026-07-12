import {
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { color } from "../../theme/tokens";
import { chartAxisTick, chartGridStroke, chartTooltipStyle, chartSeriesColor, chartEmptyStyle } from "../../theme/chartTokens";

// Radar/spider chart comparing a student's score against the
// class average, across multiple subjects at once.
//
// Props:
//   data - array of objects, one per subject, e.g.:
//          [{ subject: "CS301", score: 71, class_avg: 68 }, ...]
//          Matches the shape of analyticsService's subject_performance array
//          (with class_avg added — see usage note below).
function RadarChart({ data }) {
  if (!data || data.length === 0) {
    return <p style={chartEmptyStyle}>No data available yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <RechartsRadarChart data={data}>
        <PolarGrid stroke={chartGridStroke} />
        <PolarAngleAxis
          dataKey="subject"
          tick={chartAxisTick}
        />
        <PolarRadiusAxis
          domain={[0, 100]}
          tick={chartAxisTick}
          axisLine={false}
        />
        <Radar
          name="Class average"
          dataKey="class_avg"
          stroke={color.ink30}
          fill={color.ink30}
          fillOpacity={0.12}
          strokeWidth={1.5}
        />
        <Radar
          name="Your score"
          dataKey="score"
          stroke={chartSeriesColor}
          fill={chartSeriesColor}
          fillOpacity={0.25}
          strokeWidth={2}
        />
        <Tooltip
          contentStyle={chartTooltipStyle}
        />
        <Legend wrapperStyle={{ fontSize: "12px" }} iconType="circle" iconSize={9} />
      </RechartsRadarChart>
    </ResponsiveContainer>
  );
}

export default RadarChart;