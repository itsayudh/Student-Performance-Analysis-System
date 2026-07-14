import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import RiskBadge from "../../components/predictions/RiskBadge";
import PredictionCard from "../../components/predictions/PredictionCard";
import { useRunPrediction, usePredictionHistory } from "../../hooks/usePredictions";
import { getPredictionAutofill } from "../../services/predictionService";
import api from "../../services/api";
import { formatDate, formatFailureProbability } from "../../utils/formatters";
import { Panel, PageHeader, SectionHeading } from "../../components/gridline";
import { color, numSx } from "../../theme/tokens";
import { useAuthContext } from "../../contexts/AuthContext";

// Predictions page — shared across Admin, Teacher, and Student portals
// (moved from pages/admin/ since it's no longer admin-exclusive; the
// doc's folder map never anticipated a shared pages/ folder, logged as
// a structure deviation).
//
// DATA FLOW (the important one — trace it in prediction_service.py):
//   POST /api/v1/predictions/predict does THREE things server-side:
//     1. saves a row in `predictions`
//     2. auto-generates rows in `recommendations` (recommendation_service)
//     3. auto-generates rows in `notifications`   (notification_service)
//   So one click here feeds RecommendationsPage (student portal) and
//   EarlyWarningPage (teacher portal) — nothing else needs to be called.
//
// ROLE BEHAVIOR:
//   ADMIN/TEACHER — full student picker, run predictions for anyone.
//   STUDENT — no picker; always predicts for themselves. The backend
//     enforces this server-side too (ownership check in predictions.py,
//     same pattern as the Reports IDOR fix) — the frontend hiding the
//     picker is a UX nicety, not the actual security boundary.
//
// AUTOFILL: on student selection, 5 of 7 fields are pre-filled from
// real attendance/marks/GPA records via GET /predictions/{id}/autofill.
// study_hours_per_week and subject_difficulty_score have NO database
// source (confirmed during reconnaissance) and stay manual-entry,
// labeled accordingly.

const FEATURE_FIELDS = [
  { name: "attendance_percentage",    label: "Attendance %",            min: 0, max: 100 },
  { name: "quiz_score_avg",           label: "Quiz average",            min: 0, max: 100 },
  { name: "assignment_score_avg",     label: "Assignment average",      min: 0, max: 100 },
  { name: "midterm_score",            label: "Midterm score",           min: 0, max: 100 },
  { name: "historical_gpa",           label: "Historical GPA",          min: 0, max: 4,   step: 0.01 },
  { name: "study_hours_per_week",     label: "Study hours / week (manual — no record source)", min: 0, max: 80 },
  { name: "subject_difficulty_score", label: "Subject difficulty 0-1 (manual — no record source)", min: 0, max: 1, step: 0.01 },
];

const EMPTY_FORM = Object.fromEntries(FEATURE_FIELDS.map((f) => [f.name, ""]));

export default function PredictionsPage() {
  const { user } = useAuthContext();
  const isStudent = user?.role === "STUDENT";

  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentsLoading, setStudentsLoading] = useState(true);

  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [autofillNote, setAutofillNote] = useState(null);

  const { submit, result, submitting, error: submitError } = useRunPrediction();
  const {
    predictions,
    total,
    loading: historyLoading,
    refetch: refetchHistory,
  } = usePredictionHistory(selectedStudent?.id);

  // Student picker data — SKIPPED for students, who don't browse a
  // roster (they can't call GET /students meaningfully for this).
  useEffect(() => {
    if (isStudent) {
      setStudentsLoading(false);
      return;
    }
    api
      .get("/students", { params: { page_size: 100 } })
      .then((res) => setStudents(res.data.items))
      .catch(() => {})
      .finally(() => setStudentsLoading(false));
  }, [isStudent]);

  // For a student, "selected student" is always themselves — set once
  // from the login-enriched student_id, no picker interaction needed.
  useEffect(() => {
    if (isStudent && user?.student_id) {
      setSelectedStudent({
        id: user.student_id,
        first_name: user.full_name?.split(" ")[0] || "You",
        last_name: "",
        student_code: "",
      });
    }
  }, [isStudent, user]);

  // Autofill — fires whenever the selected student changes. For a
  // student that's once (on mount); for admin/teacher, every time the
  // picker changes.
  useEffect(() => {
    if (!selectedStudent?.id) return;

    getPredictionAutofill(selectedStudent.id)
      .then((res) => {
        const a = res.data;
        // Only fill fields with a REAL (non-null) value — never coerce
        // null to 0, which would silently claim "0% attendance" for a
        // student with no records yet.
        setForm((prev) => ({
          ...prev,
          ...(a.attendance_percentage != null && { attendance_percentage: String(a.attendance_percentage) }),
          ...(a.quiz_score_avg != null && { quiz_score_avg: String(a.quiz_score_avg) }),
          ...(a.assignment_score_avg != null && { assignment_score_avg: String(a.assignment_score_avg) }),
          ...(a.midterm_score != null && { midterm_score: String(a.midterm_score) }),
          ...(a.historical_gpa != null && { historical_gpa: String(a.historical_gpa) }),
        }));
        setAutofillNote("Fields below auto-filled from records where available. All values remain editable.");
      })
      .catch(() => setAutofillNote(null));
  }, [selectedStudent?.id]);

  const handleFieldChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const errors = {};
    for (const f of FEATURE_FIELDS) {
      const raw = form[f.name];
      if (raw === "" || raw === null) {
        errors[f.name] = "Required";
        continue;
      }
      const num = Number(raw);
      if (Number.isNaN(num)) errors[f.name] = "Must be a number";
      else if (num < f.min || num > f.max)
        errors[f.name] = `Must be between ${f.min} and ${f.max}`;
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!selectedStudent || !validate()) return;

    const payload = {
      // Sent for ADMIN/TEACHER convenience; a STUDENT caller has this
      // silently overridden server-side regardless of what's here —
      // see the ownership check in predictions.py.
      student_id: selectedStudent.id,
      subject_id: null,
      ...Object.fromEntries(
        FEATURE_FIELDS.map((f) => [f.name, Number(form[f.name])])
      ),
    };

    submit(payload)
      .then(() => refetchHistory())
      .catch(() => {});
  };

  return (
    <Box>
      <PageHeader title="Predictions" />

      <Grid container spacing={3}>
        {/* ── Left column: the run-prediction form ── */}
        <Grid item xs={12} md={5}>
          <Panel>
            <SectionHeading sx={{ mb: 2 }}>
              Run a new prediction
            </SectionHeading>

            {!isStudent && (
              <Autocomplete
                sx={{ mb: 2 }}
                options={students}
                loading={studentsLoading}
                value={selectedStudent}
                onChange={(_, value) => setSelectedStudent(value)}
                getOptionLabel={(s) =>
                  `${s.first_name} ${s.last_name} (${s.student_code})`
                }
                isOptionEqualToValue={(opt, val) => opt.id === val.id}
                renderInput={(params) => (
                  <TextField {...params} label="Student" size="small" />
                )}
              />
            )}

            {autofillNote && (
              <Alert severity="info" sx={{ mb: 2 }}>
                {autofillNote}
              </Alert>
            )}

            <Grid container spacing={1.5}>
              {FEATURE_FIELDS.map((f) => (
                <Grid item xs={6} key={f.name}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label={f.label}
                    value={form[f.name]}
                    onChange={(e) => handleFieldChange(f.name, e.target.value)}
                    error={Boolean(fieldErrors[f.name])}
                    helperText={fieldErrors[f.name] || " "}
                    inputProps={{ min: f.min, max: f.max, step: f.step || 1 }}
                  />
                </Grid>
              ))}
            </Grid>

            {submitError && (
              <Alert severity="error" sx={{ mt: 1, mb: 1 }}>
                {submitError.response?.status === 422
                  ? "The backend rejected one or more field values."
                  : "Prediction failed. Please try again."}
              </Alert>
            )}

            <Button
              variant="contained"
              fullWidth
              sx={{ mt: 1 }}
              disabled={!selectedStudent || submitting}
              onClick={handleSubmit}
            >
              {submitting ? (
                <CircularProgress size={22} color="inherit" />
              ) : (
                "Run Prediction"
              )}
            </Button>
          </Panel>
        </Grid>

        {/* ── Right column: latest result + history ── */}
        <Grid item xs={12} md={7}>
          <SectionHeading sx={{ mb: 1.5 }}>
            Result
          </SectionHeading>
          <PredictionCard prediction={result} />

          <SectionHeading sx={{ mt: 3, mb: 1.5 }}>
            Prediction history{" "}
            {selectedStudent && total > 0 && (
              <Typography component="span" variant="body2" color="text.secondary">
                ({total} total)
              </Typography>
            )}
          </SectionHeading>

          {!selectedStudent ? (
            <Typography variant="body2" color="text.secondary">
              {isStudent
                ? "Loading your profile…"
                : "Select a student to see their prediction history."}
            </Typography>
          ) : historyLoading ? (
            <CircularProgress size={24} />
          ) : predictions.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No predictions yet{isStudent ? "" : " for this student"}.
            </Typography>
          ) : (
            <Panel>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Score</TableCell>
                    <TableCell>Grade</TableCell>
                    <TableCell>Fail prob.</TableCell>
                    <TableCell>Risk</TableCell>
                    <TableCell>Outcome</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {predictions.map((p) => (
                    <TableRow key={p.prediction_id}>
                      <TableCell>{formatDate(p.predicted_at)}</TableCell>
                      <TableCell sx={numSx}>{p.predicted_score.toFixed(1)}</TableCell>
                      <TableCell>{p.predicted_grade}</TableCell>
                      <TableCell sx={numSx}>
                        {formatFailureProbability(p.failure_probability)}
                      </TableCell>
                      <TableCell>
                        <RiskBadge level={p.risk_level} />
                      </TableCell>
                      <TableCell
                        sx={{
                          color: p.pass_fail === "PASS" ? color.success : color.danger,
                          fontWeight: 600,
                        }}
                      >
                        {p.pass_fail}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Panel>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}