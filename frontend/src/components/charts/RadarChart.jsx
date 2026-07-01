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
    return <p style={{ fontSize: "13px", color: "#6B7080" }}>No data available yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <RechartsRadarChart data={data}>
        <PolarGrid stroke="#E4E6EB" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fontSize: 11, fill: "#6B7080" }}
        />
        <PolarRadiusAxis
          domain={[0, 100]}
          tick={{ fontSize: 10, fill: "#6B7080" }}
          axisLine={false}
        />
        <Radar
          name="Class average"
          dataKey="class_avg"
          stroke="#6B7080"
          fill="#6B7080"
          fillOpacity={0.12}
          strokeWidth={1.5}
        />
        <Radar
          name="Your score"
          dataKey="score"
          stroke="#4C5FD5"
          fill="#4C5FD5"
          fillOpacity={0.25}
          strokeWidth={2}
        />
        <Tooltip
          contentStyle={{
            fontSize: "12px",
            borderRadius: "8px",
            border: "1px solid #E4E6EB",
          }}
        />
        <Legend wrapperStyle={{ fontSize: "12px" }} iconType="circle" iconSize={9} />
      </RechartsRadarChart>
    </ResponsiveContainer>
  );
}

export default RadarChart;