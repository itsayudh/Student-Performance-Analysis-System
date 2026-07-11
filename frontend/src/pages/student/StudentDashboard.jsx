import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import RiskBadge from "../../components/predictions/RiskBadge";
import PredictionCard from "../../components/predictions/PredictionCard";
import { getStudentAnalytics } from "../../services/analyticsService";
import { getStudentRecommendations } from "../../services/recommendationService";
import { useLatestPrediction } from "../../hooks/usePredictions";
import { useAuthContext } from "../../contexts/AuthContext";
import { formatGPA, formatPercentage } from "../../utils/formatters";

// Student portal — Dashboard: the landing summary.
//
// Deliberately NOT a copy of MyPerformancePage: no charts here. A
// landing page answers "how am I doing, is anything waiting for me?"
// and points onward. Three data sources, all long-verified:
//   /analytics/student/{id}            — headline numbers
//   /api/v1/predictions/{id}/latest    — via useLatestPrediction
//   /api/v1/recommendations/{id}       — for the unread nudge
export default function StudentDashboard() {
  const { user } = useAuthContext();
  const studentId = user?.student_id;

  const [analytics, setAnalytics] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { prediction, loading: predictionLoading } = useLatestPrediction(studentId);

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }
    // Both requests in parallel; recommendations failing shouldn't
    // sink the whole dashboard, so it gets its own catch that just
    // leaves the nudge at zero.
    Promise.all([
      getStudentAnalytics(studentId),
      getStudentRecommendations(studentId).catch(() => null),
    ])
      .then(([aRes, rRes]) => {
        setAnalytics(aRes.data);
        if (rRes) setUnreadCount(rRes.data.unread_count);
      })
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
    return <Alert severity="error">Could not load your dashboard. Please try again later.</Alert>;
  }

  const attendancePct = analytics.attendance_trend?.[0]?.percentage;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Welcome{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}
      </Typography>

      {/* Unread recommendations nudge — the one attention-grabber */}
      {unreadCount > 0 && (
        <Alert
          severity="info"
          sx={{ mb: 3 }}
          action={
            <Button component={Link} to="/student/recommendations" size="small">
              View
            </Button>
          }
        >
          You have {unreadCount} unread recommendation{unreadCount === 1 ? "" : "s"}.
        </Alert>
      )}

      {/* Headline numbers */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Box sx={cardSx}>
            <Typography variant="body2" color="text.secondary">Current GPA</Typography>
            <Typography variant="h4">{formatGPA(analytics.current_gpa)}</Typography>
          </Box>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Box sx={cardSx}>
            <Typography variant="body2" color="text.secondary">CGPA</Typography>
            <Typography variant="h4">{formatGPA(analytics.cgpa)}</Typography>
          </Box>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Box sx={cardSx}>
            <Typography variant="body2" color="text.secondary">Attendance</Typography>
            <Typography variant="h4">{formatPercentage(attendancePct)}</Typography>
          </Box>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Box sx={cardSx}>
            <Typography variant="body2" color="text.secondary">Risk level</Typography>
            <Box sx={{ mt: 0.5 }}>
              <RiskBadge level={analytics.risk_assessment.risk_level} />
            </Box>
          </Box>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" sx={{ mb: 1.5 }}>Latest Prediction</Typography>
          {predictionLoading ? (
            <CircularProgress size={24} />
          ) : (
            <PredictionCard prediction={prediction} />
          )}
        </Grid>

        <Grid item xs={12} md={6}>
          <Box sx={cardSx}>
            <Typography variant="subtitle1" sx={{ mb: 1.5 }}>Explore</Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Button component={Link} to="/student/performance" size="small" sx={{ justifyContent: "flex-start" }}>
                My Performance — charts & subject comparison
              </Button>
              <Button component={Link} to="/student/marks" size="small" sx={{ justifyContent: "flex-start" }}>
                My Marks — every quiz, assignment & exam
              </Button>
              <Button component={Link} to="/student/attendance" size="small" sx={{ justifyContent: "flex-start" }}>
                My Attendance — calendar & per-subject breakdown
              </Button>
              <Button component={Link} to="/student/recommendations" size="small" sx={{ justifyContent: "flex-start" }}>
                Recommendations{unreadCount > 0 ? ` (${unreadCount} unread)` : ""}
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

const cardSx = {
  backgroundColor: "#FFFFFF",
  border: "1px solid #E4E6EB",
  borderRadius: "12px",
  p: 2.5,
  height: "100%",
};