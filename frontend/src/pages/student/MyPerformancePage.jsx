import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import LineChart from "../../components/charts/LineChart";
import BarChart from "../../components/charts/BarChart";
import RadarChart from "../../components/charts/RadarChart";
import PredictionCard from "../../components/predictions/PredictionCard";
import RiskBadge from "../../components/predictions/RiskBadge";
import { getStudentAnalytics } from "../../services/analyticsService";
import { useLatestPrediction } from "../../hooks/usePredictions";
import { useAuthContext } from "../../contexts/AuthContext";
import { formatGPA, formatFailureProbability } from "../../utils/formatters";
import { Panel, SectionHeading, PageHeader, ScaleMark, GPA_ZONES } from "../../components/gridline";
import { numSx, color } from "../../theme/tokens";



// Student portal — My Performance page.
//
// DATA FLOW (two requests total, everything else is composition):
//   Request 1: GET /analytics/student/{student_id}   (analyticsService)
//     → current_gpa, cgpa, gpa_trend[], attendance_trend[],
//       subject_performance[], risk_assessment{}
//     NOTE: /analytics is mounted WITHOUT the /api/v1 prefix in main.py —
//     unlike /api/v1/predictions. Both paths below are correct as-is.
//   Request 2: GET /api/v1/predictions/{student_id}/latest
//     → handled entirely by the useLatestPrediction hook (Layer D),
//       including its 404-means-empty-state behavior.
//
// v2: the UUID-truncation workaround is REMOVED — analytics_service.py
// now returns subject_code in subject_performance[].subject (fixed
// 2026-07-07, per doc Section 7.6's documented contract), so the raw
// API data feeds the charts directly.
export default function MyPerformancePage() {
  const { user } = useAuthContext();

  // ── INTEGRATION SEAM (same as RecommendationsPage) ──
  // Awaiting the login-response student_id fix concluded with Roshan.
  const studentId = user?.student_id;

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Layer D hook doing the second request — note the page never touches
  // predictionService directly; the hook owns that lifecycle.
  const { prediction, loading: predictionLoading } =
    useLatestPrediction(studentId);

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    getStudentAnalytics(studentId)
      .then((res) => setAnalytics(res.data))
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (!studentId) {
    return (
      <Alert severity="warning">
        Your account is not linked to a student profile yet. Please contact
        your administrator.
      </Alert>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !analytics) {
    return (
      <Alert severity="error">
        Could not load your performance data. Please try again later.
      </Alert>
    );
  }

  const { current_gpa, cgpa, gpa_trend, subject_performance, risk_assessment } =
    analytics;

  return (
    <Box>
      <PageHeader title="My Performance" />

      {/* ── KPI row ── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Panel>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Current GPA
            </Typography>
            <Typography variant="h4" sx={numSx}>{formatGPA(current_gpa)}</Typography>
            <ScaleMark value={current_gpa} min={0} max={4} zones={GPA_ZONES} />
          </Panel>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Panel>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              CGPA
            </Typography>
            <Typography variant="h4" sx={numSx}>{formatGPA(cgpa)}</Typography>
            <ScaleMark value={cgpa} min={0} max={4} zones={GPA_ZONES} />
          </Panel>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Panel>
            <Typography variant="body2" color="text.secondary">
              Risk Level
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
              <RiskBadge level={risk_assessment.risk_level} />
              <Typography variant="body2" color="text.secondary">
                {formatFailureProbability(risk_assessment.failure_probability)}{" "}
                failure probability
              </Typography>
            </Box>
          </Panel>
        </Grid>
      </Grid>

      {/* ── Charts + prediction ── */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Panel>
            <SectionHeading>GPA Trend</SectionHeading>
            {/* yDomain locked to [0,4]: without it, Recharts auto-scales
                and a flat 3.1→3.2 line looks like a dramatic climb */}
            <LineChart
              data={gpa_trend}
              xKey="semester"
              yKey="gpa"
              yDomain={[0, 4]}
            />
          </Panel>
        </Grid>

        <Grid item xs={12} md={6}>
          <Panel>
            <SectionHeading>You vs Class Average</SectionHeading>
            {/* subject_performance ({subject, score, class_avg, ...})
                now arrives with subject CODES from the backend and
                matches RadarChart's expected props exactly — no
                transform needed anymore */}
            <RadarChart data={subject_performance} />
          </Panel>
        </Grid>

        <Grid item xs={12} md={6}>
          <Panel>
            <SectionHeading>Subject Scores</SectionHeading>
            {/* colorRules: below 40 = failing crimson, below 60 = amber —
                thresholds follow the 9-tier scale where <40 is D+/D/E
                territory and 40–59 is C/C+ */}
            <BarChart
              data={subject_performance}
              xKey="subject"
              yKey="score"
              yDomain={[0, 100]}
              colorRules={[
                { threshold: 40, color: color.danger },
                { threshold: 60, color: color.warning },
              ]}
            />
          </Panel>
        </Grid>

        <Grid item xs={12} md={6}>
              <SectionHeading>Latest Prediction</SectionHeading>
              {predictionLoading ? (
                <CircularProgress size={24} />
              ) : (
                // PredictionCard brings its own Panel — no outer wrapper,
                // or you get a double border (panel-in-panel).
                <PredictionCard prediction={prediction} />
              )}
            </Grid>
      </Grid>
    </Box>
  );
}