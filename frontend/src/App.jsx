import LineChart from "./components/charts/LineChart";
import BarChart from "./components/charts/BarChart";
import PieChart from "./components/charts/PieChart";
import AttendanceHeatmap from "./components/charts/AttendanceHeatmap";
import RadarChart from "./components/charts/RadarChart";
import RiskBadge from "./components/predictions/RiskBadge";
import PredictionCard from "./components/predictions/PredictionCard";
import RecommendationCard from "./components/predictions/RecommendationCard";

// ── Sample data shaped exactly like your real API responses ──────────────
// This is throwaway test data, not real backend data yet.

const sampleGpaTrend = [
  { semester: "Fall 2023", gpa: 2.9 },
  { semester: "Spring 2024", gpa: 3.1 },
  { semester: "Fall 2024", gpa: 3.2 },
];

const sampleSubjectScores = [
  { subject: "CS301", score: 74 },
  { subject: "CS302", score: 68 },
  { subject: "CS401", score: 59 },
];

const samplePieData = [
  { name: "A", value: 18 },
  { name: "B", value: 32 },
  { name: "C", value: 28 },
  { name: "D", value: 14 },
  { name: "F", value: 8 },
];

const sampleAttendanceRecords = [
  { date: "2025-01-02", status: "PRESENT" },
  { date: "2025-01-03", status: "PRESENT" },
  { date: "2025-01-06", status: "LATE" },
  { date: "2025-01-07", status: "ABSENT" },
  { date: "2025-01-08", status: "PRESENT" },
];

const sampleRadarData = [
  { subject: "CS301", score: 71, class_avg: 68 },
  { subject: "CS302", score: 64, class_avg: 68 },
  { subject: "CS401", score: 79, class_avg: 60 },
  { subject: "MTH201", score: 58, class_avg: 65 },
];

const samplePrediction = {
  predicted_score: 70.92,
  predicted_grade: "B+",
  failure_probability: 0.0,
  risk_level: "LOW",
  pass_fail: "PASS",
  predicted_at: "2026-06-19T10:05:48.904494+05:45",
};

const sampleRecommendation = {
  id: "1",
  recommendation_type: "GENERAL",
  message:
    "Your predicted final score is 70.9 and your overall performance is on track. Keep maintaining your current study habits.",
  priority: "LOW",
  is_read: false,
  created_at: "2026-06-19T10:05:48.925481+05:45",
};

function App() {
  return (
    <div style={{ padding: "32px", maxWidth: "1000px", margin: "0 auto", fontFamily: "Inter, sans-serif" }}>
      <h1 style={{ marginBottom: "24px" }}>Component Render Test</h1>

      <h3>RiskBadge — all four levels</h3>
      <div style={{ display: "flex", gap: "10px", marginBottom: "32px" }}>
        <RiskBadge level="LOW" />
        <RiskBadge level="MEDIUM" />
        <RiskBadge level="HIGH" />
        <RiskBadge level="CRITICAL" />
      </div>

      <h3>PredictionCard</h3>
      <div style={{ maxWidth: "400px", marginBottom: "32px" }}>
        <PredictionCard prediction={samplePrediction} />
      </div>

      <h3>RecommendationCard</h3>
      <div style={{ maxWidth: "500px", marginBottom: "32px" }}>
        <RecommendationCard recommendation={sampleRecommendation} onMarkRead={(id) => alert("Mark read: " + id)} />
      </div>

      <h3>LineChart — GPA trend</h3>
      <div style={{ maxWidth: "500px", marginBottom: "32px" }}>
        <LineChart data={sampleGpaTrend} xKey="semester" yKey="gpa" yDomain={[0, 4]} />
      </div>

      <h3>BarChart — subject scores with color rules</h3>
      <div style={{ maxWidth: "500px", marginBottom: "32px" }}>
        <BarChart
          data={sampleSubjectScores}
          xKey="subject"
          yKey="score"
          color="#1F9D63"
          colorRules={[
            { threshold: 60, color: "#D14343" },
            { threshold: 75, color: "#D89614" },
          ]}
        />
      </div>

      <h3>PieChart — grade distribution</h3>
      <div style={{ maxWidth: "400px", marginBottom: "32px" }}>
        <PieChart data={samplePieData} />
      </div>

      <h3>AttendanceHeatmap</h3>
      <div style={{ maxWidth: "400px", marginBottom: "32px" }}>
        <AttendanceHeatmap records={sampleAttendanceRecords} month={new Date(2025, 0, 1)} />
      </div>

      <h3>RadarChart — subject vs class average</h3>
      <div style={{ maxWidth: "500px", marginBottom: "32px" }}>
        <RadarChart data={sampleRadarData} />
      </div>
    </div>
  );
}

export default App;