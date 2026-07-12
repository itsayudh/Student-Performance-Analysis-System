import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import BarChart from "../../components/charts/BarChart";
import PieChart from "../../components/charts/PieChart";
import {
  getAdminDashboard,
  getClassAnalytics,
  getSubjectAnalytics,
} from "../../services/analyticsService";
import api from "../../services/api";
import { formatGPA, formatPercentage } from "../../utils/formatters";
import { Panel, PageHeader, ScaleMark, GPA_ZONES, PERCENT_ZONES,TickerNumber } from "../../components/gridline";
import { numSx, color } from "../../theme/tokens";

// Admin portal — Analytics page.
//
// v2: drill-down now uses real pickers backed by the GET /classes and
// GET /subjects endpoints (added to the backend on 2026-07-05 — see
// class_service.py / subject_service.py deviation notes). The manual
// UUID TextField from v1 is gone.
//
// NOTE: classes/subjects are fetched via `api` directly, not through
// service files — the doc's frontend services list has no
// classService.js/subjectService.js, and two one-line GETs on one page
// don't justify the file yet. Promote to service files if/when more
// pages (e.g. ClassesPage) need the same calls.

const GRADE_ORDER = ["A+", "A", "B+", "B", "C+", "C", "D+", "D", "E"];
function toGradePieData(gradeDistribution) {
  if (!gradeDistribution) return [];
  return GRADE_ORDER.filter((g) => gradeDistribution[g] > 0).map((g) => ({
    name: g,
    value: gradeDistribution[g],
  }));
}

export default function AnalyticsPage() {
  // ── Section 1: dashboard ──
  const [dashboard, setDashboard] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState(null);

  // ── Section 2: drill-down ──
  const [drillMode, setDrillMode] = useState("class"); // "class" | "subject"
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [pickersLoading, setPickersLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [drillData, setDrillData] = useState(null);
  const [drillLoading, setDrillLoading] = useState(false);
  const [drillError, setDrillError] = useState(null);

  // Dashboard KPIs — one request, fires once.
  useEffect(() => {
    getAdminDashboard()
      .then((res) => setDashboard(res.data))
      .catch((err) => setDashboardError(err))
      .finally(() => setDashboardLoading(false));
  }, []);

  // Picker options — both lists in parallel. Promise.all because the
  // page has no use for one list without the other being on its way;
  // firing them sequentially would just double the wait for no benefit.
  useEffect(() => {
    Promise.all([
      api.get("/classes", { params: { page_size: 100, is_active: true } }),
      api.get("/subjects", { params: { page_size: 100, is_active: true } }),
    ])
      .then(([classRes, subjectRes]) => {
        setClasses(classRes.data.items);
        setSubjects(subjectRes.data.items);
      })
      .catch((err) => setDrillError(err))
      .finally(() => setPickersLoading(false));
  }, []);

  // Drill-down fetch — reacts to selection. Selecting IS the submit
  // action now, so the v1 "Analyze" button is gone.
  useEffect(() => {
    if (!selectedItem) {
      setDrillData(null);
      return;
    }
    setDrillLoading(true);
    setDrillError(null);

    const fetcher =
      drillMode === "class" ? getClassAnalytics : getSubjectAnalytics;

    fetcher(selectedItem.id)
      .then((res) => setDrillData(res.data))
      .catch((err) => setDrillError(err))
      .finally(() => setDrillLoading(false));
  }, [selectedItem, drillMode]);

  if (dashboardLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (dashboardError || !dashboard) {
    return (
      <Alert severity="error">
        Could not load institution analytics. Please try again later.
      </Alert>
    );
  }

  // Raw values + formatter per KPI (was pre-formatted strings) so
  // TickerNumber can animate the number and format each frame.
  const count = (n) => Math.round(n);
  const KPIS = [
    { label: "Students", value: dashboard.total_students, format: count },
    { label: "Teachers", value: dashboard.total_teachers, format: count },
    { label: "Classes", value: dashboard.total_classes, format: count },
    { label: "Overall GPA", value: dashboard.overall_gpa_avg, format: formatGPA },
    { label: "Attendance", value: dashboard.overall_attendance_rate, format: formatPercentage },
    { label: "At-risk students", value: dashboard.at_risk_students, format: count, alert: dashboard.at_risk_students > 0 },
    { label: "Pass rate", value: dashboard.pass_rate_this_semester, format: formatPercentage },
    { label: "Recent alerts", value: dashboard.recent_alerts, format: count, alert: dashboard.recent_alerts > 0 },
  ];
  const pickerOptions = drillMode === "class" ? classes : subjects;

  return (
    <Box>
      <PageHeader title="Analytics" />

      {/* ── Section 1: institution KPIs ── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {KPIS.map((kpi) => (
          <Grid item xs={6} sm={3} key={kpi.label}>
            <Panel sx={{ height: "100%" }}>
              <Typography variant="body2" color="text.secondary">
                {kpi.label}
              </Typography>
              <TickerNumber
                value={kpi.value}
                format={kpi.format}
                sx={{ color: kpi.alert ? color.danger : "inherit" }}
              />
              {kpi.scaleType === "gpa" && kpi.raw !== undefined && (
                <ScaleMark value={kpi.raw} zones={GPA_ZONES} max={4} />
              )}
              {kpi.scaleType === "percent" && kpi.raw !== undefined && (
                <ScaleMark value={kpi.raw} zones={PERCENT_ZONES} />
              )}
            </Panel>
          </Grid>
        ))}
      </Grid>

      <Panel sx={{ mb: 4 }}>
        <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
          Department Performance (avg GPA)
        </Typography>
        <BarChart
          data={dashboard.department_performance}
          xKey="department"
          yKey="avg_gpa"
          yDomain={[0, 4]}
          colorRules={[
            { threshold: 2.0, color: "#D14343" },
            { threshold: 2.5, color: "#D89614" },
          ]}
        />
      </Panel>

      {/* ── Section 2: class/subject drill-down ── */}
      <Typography variant="h5" sx={{ mb: 2 }}>
        Drill-down
      </Typography>

      <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2, flexWrap: "wrap" }}>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={drillMode}
          onChange={(_, mode) => {
            if (mode) {
              setDrillMode(mode);
              // Clear the SELECTION, not just the result — a class
              // object lingering while in "subject" mode is invalid
              // state, and the effect above would refetch wrongly.
              setSelectedItem(null);
              setDrillError(null);
            }
          }}
        >
          <ToggleButton value="class">Class</ToggleButton>
          <ToggleButton value="subject">Subject</ToggleButton>
        </ToggleButtonGroup>

        <Autocomplete
          sx={{ width: 360 }}
          options={pickerOptions}
          loading={pickersLoading}
          value={selectedItem}
          onChange={(_, value) => setSelectedItem(value)}
          getOptionLabel={(item) =>
            drillMode === "class"
              ? `${item.class_name} (${item.class_code})`
              : `${item.subject_name} (${item.subject_code})`
          }
          isOptionEqualToValue={(opt, val) => opt.id === val.id}
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              label={drillMode === "class" ? "Select class" : "Select subject"}
            />
          )}
        />

        {drillLoading && <CircularProgress size={22} />}
      </Box>

      {drillError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Could not load drill-down data. Please try again.
        </Alert>
      )}

      {drillData && !drillLoading && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={5}>
            <Panel sx={{ height: "100%" }}>
              <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
                {drillMode === "class"
                  ? drillData.class_name
                  : `${drillData.subject_name} (${drillData.subject_code})`}
              </Typography>
              {drillMode === "class" ? (
                <>
                  <StatLine label="Students" value={drillData.student_count} />
                  <StatLine label="Class GPA avg" value={formatGPA(drillData.class_gpa_avg)} raw={drillData.class_gpa_avg} scaleType="gpa" />
                  <StatLine label="Attendance rate" value={formatPercentage(drillData.attendance_rate)} raw={drillData.attendance_rate} scaleType="percent" />
                  <StatLine label="At-risk count" value={drillData.at_risk_count} />
                </>
              ) : (
                <>
                  <StatLine label="Enrolled" value={drillData.enrolled_count} />
                  <StatLine label="Class average" value={formatPercentage(drillData.class_average)} raw={drillData.class_average} scaleType="percent" />
                  <StatLine label="Pass rate" value={formatPercentage(drillData.pass_rate)} raw={drillData.pass_rate} scaleType="percent" />
                  <StatLine label="Attendance avg" value={formatPercentage(drillData.attendance_avg)} raw={drillData.attendance_avg} scaleType="percent" />
                  <StatLine label="Difficulty score" value={drillData.difficulty_score} />
                </>
              )}
            </Panel>
          </Grid>
          <Grid item xs={12} md={7}>
            <Panel sx={{ height: "100%" }}>
              <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
                Grade Distribution
              </Typography>
              <PieChart data={toGradePieData(drillData.grade_distribution)} />
            </Panel>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}

function StatLine({ label, value, raw, scaleType }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", py: 0.75 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600, ...numSx }}>
          {value}
        </Typography>
      </Box>
      {scaleType === "gpa" && raw !== undefined && (
        <Box sx={{ mt: 0.5 }}>
          <ScaleMark value={raw} zones={GPA_ZONES} max={4} />
        </Box>
      )}
      {scaleType === "percent" && raw !== undefined && (
        <Box sx={{ mt: 0.5 }}>
          <ScaleMark value={raw} zones={PERCENT_ZONES} />
        </Box>
      )}
    </Box>
  );
}