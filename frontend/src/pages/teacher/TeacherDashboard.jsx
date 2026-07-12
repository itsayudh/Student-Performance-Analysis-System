import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import PieChart from "../../components/charts/PieChart";
import api from "../../services/api";
import { useAuthContext } from "../../contexts/AuthContext";
import { formatGPA, formatPercentage } from "../../utils/formatters";
import { Panel, SectionHeading, PageHeader, ScaleMark, GPA_ZONES, PERCENT_ZONES, TickerNumber } from "../../components/gridline";
import { numSx } from "../../theme/tokens";

// Teacher portal — Dashboard: my classes at a glance.
//
// Pure composition: every data source and widget here already exists
// and is verified on other pages —
//   /teachers/{id}/classes   (MyClassesPage's endpoint)
//   /analytics/class/{id}    (AnalyticsPage drill-down's endpoint)
//   PieChart + toGradePieData pattern (AnalyticsPage)
// A dashboard built last costs almost nothing; built first it would
// have forced every endpoint into existence prematurely.
const GRADE_ORDER = ["A+", "A", "B+", "B", "C+", "C", "D+", "D", "E"];
function toGradePieData(dist) {
  if (!dist) return [];
  return GRADE_ORDER.filter((g) => dist[g] > 0).map((g) => ({ name: g, value: dist[g] }));
}

export default function TeacherDashboard() {
  const { user } = useAuthContext();
  const teacherId = user?.teacher_id;

  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [error, setError] = useState(null);

  // My classes — and AUTO-SELECT the first one, so the dashboard greets
  // the teacher with data, not with a chore. (A dashboard that opens
  // empty and asks you to configure it isn't a dashboard yet.)
  useEffect(() => {
    if (!teacherId) {
      setLoading(false);
      return;
    }
    api
      .get(`/teachers/${teacherId}/classes`)
      .then((res) => {
        setClasses(res.data.items);
        if (res.data.items.length > 0) setSelectedClassId(res.data.items[0].id);
      })
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, [teacherId]);

  useEffect(() => {
    if (!selectedClassId) return;
    setAnalyticsLoading(true);
    api
      .get(`/analytics/class/${selectedClassId}`)
      .then((res) => setAnalytics(res.data))
      .catch((err) => setError(err))
      .finally(() => setAnalyticsLoading(false));
  }, [selectedClassId]);

  if (!teacherId) {
    return (
      <Alert severity="warning">
        Your account is not linked to a teacher profile yet. Please contact
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

  return (
    <Box>
      <PageHeader
        title={`Welcome${user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}`}
        action={
          classes.length > 1 && (
            <TextField
              select
              size="small"
              sx={{ width: 260 }}
              label="Class"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
            >
              {classes.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.class_name} ({c.class_code})
                </MenuItem>
              ))}
            </TextField>
          )
        }
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>Something went wrong loading your dashboard.</Alert>}

      {classes.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          You have no class assignments yet — the dashboard fills in once an
          administrator assigns you to a class.
        </Typography>
      ) : analyticsLoading || !analytics ? (
        <CircularProgress size={24} />
      ) : (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3}>
              <Panel>
                <Typography variant="body2" color="text.secondary">Students</Typography>
                <TickerNumber value={analytics.student_count} format={(n) => Math.round(n)} />
              </Panel>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Panel>
                <Typography variant="body2" color="text.secondary">Class GPA avg</Typography>
                <TickerNumber value={analytics.class_gpa_avg} format={formatGPA} />
                <ScaleMark value={analytics.class_gpa_avg} zones={GPA_ZONES} max={4} />
              </Panel>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Panel>
                <Typography variant="body2" color="text.secondary">Attendance</Typography>
                <TickerNumber value={analytics.attendance_rate} format={formatPercentage} />
                <ScaleMark value={analytics.attendance_rate} zones={PERCENT_ZONES} />
              </Panel>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Panel>
                <Typography variant="body2" color="text.secondary">At-risk students</Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <TickerNumber
                    value={analytics.at_risk_count}
                    format={(n) => Math.round(n)}
                    sx={{ color: analytics.at_risk_count > 0 ? color.danger : "inherit" }}
                  />
                  {analytics.at_risk_count > 0 && (
                    <Chip size="small" color="error" label="needs attention" />
                  )}
                </Box>
              </Panel>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Panel>
                <SectionHeading>Grade Distribution</SectionHeading>
                <PieChart data={toGradePieData(analytics.grade_distribution)} />
              </Panel>
            </Grid>
            <Grid item xs={12} md={6}>
              <Panel>
                <SectionHeading>Quick links</SectionHeading>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Head to <b>Attendance</b> or <b>Marks</b> to record today's
                  entries, <b>Student Performance</b> for individual deep-dives,
                  or <b>Early Warning</b> to review unresolved alerts.
                </Typography>
              </Panel>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}