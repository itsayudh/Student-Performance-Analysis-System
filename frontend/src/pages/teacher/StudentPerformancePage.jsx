import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import LineChart from "../../components/charts/LineChart";
import RadarChart from "../../components/charts/RadarChart";
import AttendanceHeatmap from "../../components/charts/AttendanceHeatmap";
import PredictionCard from "../../components/predictions/PredictionCard";
import { getStudentAnalytics } from "../../services/analyticsService";
import { useLatestPrediction } from "../../hooks/usePredictions";
import { useAttendance } from "../../hooks/useAttendance";
import { useMarks } from "../../hooks/useMarks";
import {
  formatGPA,
  formatPercentage,
  gradeColor,
} from "../../utils/formatters";

// Teacher portal — Student Performance page: pick a student, see the
// full picture (analytics, marks, attendance heatmap, latest prediction).
//
// FOUR data sources, one page:
//   1. GET /analytics/student/{id}          — analyticsService (direct call)
//   2. GET /marks/student/{id}              — via useMarks hook
//   3. GET /attendance/student/{id}         — via useAttendance hook
//   4. GET /api/v1/predictions/{id}/latest  — via useLatestPrediction hook
//
// HOOK QUIRK this page must respect: useAttendance/useMarks start at
// loading=true and NEVER resolve while studentId is undefined (their
// fetch bails early). So we gate all hook-driven sections behind
// `selectedStudent` and only read their loading flags after selection.
export default function StudentPerformancePage() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentsLoading, setStudentsLoading] = useState(true);

  // Heatmap month navigation — a plain JS Date, first-of-month.
  const [heatmapMonth, setHeatmapMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Analytics fetched imperatively (no hook exists for it — analytics
  // wasn't in the Layer D list, and two pages using it via a direct
  // service call doesn't yet justify inventing an undocumented hook).
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [error, setError] = useState(null);

  const studentId = selectedStudent?.id;

  // Layer D hooks — all three fire automatically when studentId changes,
  // because each keyed its useCallback/useEffect on studentId. Selecting
  // a different student in the picker refetches everything with zero
  // extra wiring here. That's the payoff of hook-encapsulated fetching.
  const { prediction, loading: predictionLoading } = useLatestPrediction(studentId);
  const { records: attendanceRecords, summary: attendanceSummary } = useAttendance(studentId);
  const { marks, loading: marksLoading } = useMarks(studentId);

  // Student list — direct api call, studentService.js pending (Roshan).
  useEffect(() => {
    import("../../services/api").then(({ default: api }) => {
      api
        .get("/students", { params: { page_size: 100 } })
        .then((res) => setStudents(res.data.items))
        .catch((err) => setError(err))
        .finally(() => setStudentsLoading(false));
    });
  }, []);

  // Analytics — refetch whenever the selected student changes.
  useEffect(() => {
    if (!studentId) {
      setAnalytics(null);
      return;
    }
    setAnalyticsLoading(true);
    setError(null);

    getStudentAnalytics(studentId)
      .then((res) => setAnalytics(res.data))
      .catch((err) => setError(err))
      .finally(() => setAnalyticsLoading(false));
  }, [studentId]);

  const shiftMonth = (delta) => {
    setHeatmapMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1)
    );
  };

  // Same UUID-truncation TEMP fix as MyPerformancePage — remove both
  // together once analytics_service.py returns subject_code.
  const subjectData = (analytics?.subject_performance || []).map((s) => ({
    ...s,
    subject: s.subject.length > 12 ? `${s.subject.slice(0, 8)}…` : s.subject,
  }));

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Student Performance
      </Typography>

      <Autocomplete
        sx={{ width: 340, mb: 3 }}
        options={students}
        loading={studentsLoading}
        value={selectedStudent}
        onChange={(_, value) => setSelectedStudent(value)}
        getOptionLabel={(s) => `${s.first_name} ${s.last_name} (${s.student_code})`}
        isOptionEqualToValue={(opt, val) => opt.id === val.id}
        renderInput={(params) => (
          <TextField {...params} label="Select student" size="small" />
        )}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Something went wrong loading this student's data.
        </Alert>
      )}

      {/* THE gate — nothing below renders without a selection, which is
          what makes the never-resolving hook loading states harmless */}
      {!selectedStudent ? (
        <Typography variant="body2" color="text.secondary">
          Select a student to view their full performance profile.
        </Typography>
      ) : (
        <>
          {/* ── KPI row: analytics + attendance summary side by side ── */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3}>
              <Box sx={cardSx}>
                <Typography variant="body2" color="text.secondary">
                  Current GPA
                </Typography>
                <Typography variant="h4">
                  {analyticsLoading ? "…" : formatGPA(analytics?.current_gpa)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={cardSx}>
                <Typography variant="body2" color="text.secondary">
                  CGPA
                </Typography>
                <Typography variant="h4">
                  {analyticsLoading ? "…" : formatGPA(analytics?.cgpa)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={cardSx}>
                <Typography variant="body2" color="text.secondary">
                  Attendance
                </Typography>
                <Typography variant="h4">
                  {formatPercentage(attendanceSummary?.overall_percentage)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={cardSx}>
                <Typography variant="body2" color="text.secondary">
                  Days recorded
                </Typography>
                <Typography variant="h4">
                  {attendanceSummary?.total_days ?? "…"}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            {/* ── GPA trend + radar (from analytics) ── */}
            <Grid item xs={12} md={6}>
              <Box sx={cardSx}>
                <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
                  GPA Trend
                </Typography>
                {analyticsLoading ? (
                  <CircularProgress size={24} />
                ) : (
                  <LineChart
                    data={analytics?.gpa_trend || []}
                    xKey="semester"
                    yKey="gpa"
                    yDomain={[0, 4]}
                  />
                )}
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={cardSx}>
                <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
                  Student vs Class Average
                </Typography>
                {analyticsLoading ? (
                  <CircularProgress size={24} />
                ) : (
                  <RadarChart data={subjectData} />
                )}
              </Box>
            </Grid>

            {/* ── Attendance heatmap with month navigation ──
                The heatmap does its own date-filtering: we pass ALL
                records and the month; it builds the calendar and looks
                up each day. No pre-filtering needed page-side. */}
            <Grid item xs={12} md={6}>
              <Box sx={cardSx}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1.5,
                  }}
                >
                  <Typography variant="subtitle1">Attendance</Typography>
                  <Box>
                    <IconButton size="small" onClick={() => shiftMonth(-1)}>
                      <ChevronLeftIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => shiftMonth(1)}>
                      <ChevronRightIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                <AttendanceHeatmap
                  records={attendanceRecords}
                  month={heatmapMonth}
                />
              </Box>
            </Grid>

            {/* ── Latest prediction ── */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
                Latest Prediction
              </Typography>
              {predictionLoading ? (
                <CircularProgress size={24} />
              ) : (
                <PredictionCard prediction={prediction} />
              )}
            </Grid>

            {/* ── Marks breakdown table (from useMarks) ── */}
            <Grid item xs={12}>
              <Box sx={cardSx}>
                <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
                  Marks by Subject
                </Typography>
                {marksLoading ? (
                  <CircularProgress size={24} />
                ) : marks.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No marks recorded yet for this student.
                  </Typography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Subject</TableCell>
                        <TableCell>Quiz avg</TableCell>
                        <TableCell>Assignment avg</TableCell>
                        <TableCell>Midterm</TableCell>
                        <TableCell>Final</TableCell>
                        <TableCell>Current %</TableCell>
                        <TableCell>Grade</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {marks.map((m) => {
                        // quiz/assignment arrive as raw {score,max_score}
                        // arrays — averaging is a DISPLAY concern, so it
                        // happens here, not in the hook (the hook stays a
                        // faithful mirror of the API response).
                        const avg = (arr) =>
                          arr && arr.length
                            ? arr.reduce(
                                (sum, x) => sum + (x.score / x.max_score) * 100,
                                0
                              ) / arr.length
                            : null;

                        const quizAvg = avg(m.quiz);
                        const assignAvg = avg(m.assignment);
                        const pct = (entry) =>
                          entry
                            ? formatPercentage(
                                (entry.score / entry.max_score) * 100
                              )
                            : "—";

                        return (
                          <TableRow key={m.subject_id}>
                            <TableCell>
                              {m.subject_code || m.subject_name || m.subject_id.slice(0, 8)}
                            </TableCell>
                            <TableCell>{formatPercentage(quizAvg)}</TableCell>
                            <TableCell>{formatPercentage(assignAvg)}</TableCell>
                            <TableCell>{pct(m.midterm)}</TableCell>
                            <TableCell>{pct(m.final)}</TableCell>
                            <TableCell>{formatPercentage(m.current_percentage)}</TableCell>
                            <TableCell
                              sx={{
                                color: gradeColor(m.current_grade),
                                fontWeight: 600,
                              }}
                            >
                              {m.current_grade}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </Box>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}

const cardSx = {
  backgroundColor: "#FFFFFF",
  border: "1px solid #E4E6EB",
  borderRadius: "12px",
  p: 2.5,
};