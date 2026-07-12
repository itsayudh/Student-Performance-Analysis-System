import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import AttendanceHeatmap from "../../components/charts/AttendanceHeatmap";
import { useAttendance } from "../../hooks/useAttendance";
import { useAuthContext } from "../../contexts/AuthContext";
import { formatPercentage } from "../../utils/formatters";
import api from "../../services/api";
import { Panel, SectionHeading, PageHeader, ScaleMark, PERCENT_ZONES } from "../../components/gridline";
import { numSx } from "../../theme/tokens";

// Student portal — My Attendance: summary KPIs, per-subject breakdown,
// and the calendar heatmap with month navigation.
//
// Single data source: useAttendance → GET /attendance/student/{id},
// which returns BOTH records[] (feeds the heatmap) and summary{}
// (feeds everything else). One request, whole page.
//
// First page to use summary.by_subject — including its status flag:
// the backend marks subjects below the attendance threshold "WARNING",
// so the student sees WHICH subject is dragging them down, not just
// the overall number.
export default function MyAttendancePage() {
  const { user } = useAuthContext();
  const studentId = user?.student_id;

  const [heatmapMonth, setHeatmapMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState(""); // "" = all subjects

  // Subject list for the filter — /subjects allows STUDENT role
  // (deliberately, when we built the endpoint: students legitimately
  // see subject names).
  useEffect(() => {
    api
      .get("/subjects", { params: { page_size: 100, is_active: true } })
      .then((res) => setSubjects(res.data.items))
      .catch(() => {}); // filter dropdown just stays empty on failure
  }, []);

  // subjectId flows to GET /attendance/student/{id}?subject_id=... —
  // the backend recomputes summary (all 5 KPIs) for that subject alone.
  // "" means no filter → overall numbers, exactly as before.
  const { records, summary, loading, error } = useAttendance(studentId, {
    subjectId: subjectId || undefined,
  });

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

  if (error || !summary) {
    return <Alert severity="error">Could not load your attendance. Please try again later.</Alert>;
  }

  const shiftMonth = (delta) =>
    setHeatmapMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));

  const KPIS = [
    { label: "Overall", value: formatPercentage(summary.overall_percentage), isPercentage: true, rawValue: summary.overall_percentage },
    { label: "Days recorded", value: summary.total_days },
    { label: "Present", value: summary.present },
    { label: "Absent", value: summary.absent },
    { label: "Late", value: summary.late },
  ];

  return (
    <Box>
      <PageHeader
        title="My Attendance"
        action={
          <TextField
            select
            size="small"
            label="Subject"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            sx={{ width: 280 }}
          >
            <MenuItem value="">All subjects (overall)</MenuItem>
            {subjects.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.subject_name} ({s.subject_code})
              </MenuItem>
            ))}
          </TextField>
        }
      />

      {/* ── KPI row ── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {KPIS.map((kpi) => (
          <Grid item xs={6} sm={2.4} key={kpi.label}>
            <Panel>
              <Typography variant="body2" color="text.secondary">
                {kpi.label}
              </Typography>
              <Typography variant="h5" sx={numSx}>{kpi.value}</Typography>
              {kpi.isPercentage && (
                <ScaleMark value={kpi.rawValue} zones={PERCENT_ZONES} />
              )}
            </Panel>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        {/* ── Heatmap with month navigation ── */}
        <Grid item xs={12} md={6}>
          <Panel>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
              <SectionHeading>Calendar</SectionHeading>
              <Box>
                <IconButton size="small" onClick={() => shiftMonth(-1)}>
                  <ChevronLeftIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => shiftMonth(1)}>
                  <ChevronRightIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
            <AttendanceHeatmap records={records} month={heatmapMonth} />
          </Panel>
        </Grid>

        {/* ── Per-subject breakdown ── */}
        <Grid item xs={12} md={6}>
          <Panel>
            <SectionHeading>
              By Subject
            </SectionHeading>
            {summary.by_subject.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No subject records yet.
              </Typography>
            ) : (
              summary.by_subject.map((sub) => (
                <Box
                  key={sub.subject_code}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    py: 1,
                    borderTop: "1px solid #F0F1F3",
                  }}
                >
                  <Typography variant="body2">{sub.subject_code}</Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="body2" sx={{ ...numSx, fontWeight: 600 }}>
                      {formatPercentage(sub.percentage)}
                    </Typography>
                    {sub.status === "WARNING" && (
                      <Chip size="small" label="Low" color="warning" />
                    )}
                  </Box>
                </Box>
              ))
            )}
          </Panel>
        </Grid>
      </Grid>
    </Box>
  );
}