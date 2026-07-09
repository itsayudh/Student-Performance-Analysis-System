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
      <Typography variant="h4" sx={{ mb: 3 }}>
        My Performance
      </Typography>

      {/* ── KPI row ──
          Simple inline cards for now. StatCard.jsx is Roshan's Layer B —
          swap these for <StatCard /> once it exists (same TODO pattern
          as the layouts' temporary sidebars). */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Box sx={kpiCardSx}>
            <Typography variant="body2" color="text.secondary">
              Current GPA
            </Typography>
            <Typography variant="h4">{formatGPA(current_gpa)}</Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Box sx={kpiCardSx}>
            <Typography variant="body2" color="text.secondary">
              CGPA
            </Typography>
            <Typography variant="h4">{formatGPA(cgpa)}</Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Box sx={kpiCardSx}>
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
          </Box>
        </Grid>
      </Grid>

      {/* ── Charts + prediction ── */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Box sx={chartCardSx}>
            <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
              GPA Trend
            </Typography>
            {/* yDomain locked to [0,4]: without it, Recharts auto-scales
                and a flat 3.1→3.2 line looks like a dramatic climb */}
            <LineChart
              data={gpa_trend}
              xKey="semester"
              yKey="gpa"
              yDomain={[0, 4]}
            />
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Box sx={chartCardSx}>
            <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
              You vs Class Average
            </Typography>
            {/* subject_performance ({subject, score, class_avg, ...})
                now arrives with subject CODES from the backend and
                matches RadarChart's expected props exactly — no
                transform needed anymore */}
            <RadarChart data={subject_performance} />
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Box sx={chartCardSx}>
            <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
              Subject Scores
            </Typography>
            {/* colorRules: below 40 = failing crimson, below 60 = amber —
                thresholds follow the 9-tier scale where <40 is D+/D/E
                territory and 40–59 is C/C+ */}
            <BarChart
              data={subject_performance}
              xKey="subject"
              yKey="score"
              yDomain={[0, 100]}
              colorRules={[
                { threshold: 40, color: "#D14343" },
                { threshold: 60, color: "#D89614" },
              ]}
            />
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
              Latest Prediction
            </Typography>
            {predictionLoading ? (
              <CircularProgress size={24} />
            ) : (
              // prediction === null (the hook's 404 case) renders
              // PredictionCard's built-in "no prediction yet" empty state
              <PredictionCard prediction={prediction} />
            )}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

const kpiCardSx = {
  backgroundColor: "#FFFFFF",
  border: "1px solid #E4E6EB",
  borderRadius: "12px",
  p: 2.5,
};

const chartCardSx = {
  backgroundColor: "#FFFFFF",
  border: "1px solid #E4E6EB",
  borderRadius: "12px",
  p: 2.5,
};