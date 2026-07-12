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
import api from "../../services/api";
import { formatDate, formatFailureProbability } from "../../utils/formatters";
import { Panel, PageHeader, SectionHeading } from "../../components/gridline";
import { numSx } from "../../theme/tokens";

// Admin portal — Predictions page. The only WRITE-path page in Ayudh's
// Layer E.
//
// DATA FLOW (the important one — trace it in prediction_service.py):
//   POST /api/v1/predictions/predict does THREE things server-side:
//     1. saves a row in `predictions`
//     2. auto-generates rows in `recommendations` (recommendation_service)
//     3. auto-generates rows in `notifications`   (notification_service)
//   So one click here feeds RecommendationsPage (student portal) and
//   EarlyWarningPage (teacher portal) — nothing else needs to be called.
//
//   Because the server mutates MORE state than the response body reports,
//   we REFETCH the history list after submit instead of patching local
//   state (contrast with the mark-as-read / resolve handlers on the
//   other pages, where the response fully describes the change).

// Field definitions for PredictionInput (matches the FastAPI schema
// exactly — names, not just types, must match or Pydantic returns 422).
// min/max mirror the backend's validation so most errors are caught
// client-side before a request is ever fired.
const FEATURE_FIELDS = [
  { name: "attendance_percentage",    label: "Attendance %",            min: 0, max: 100 },
  { name: "quiz_score_avg",           label: "Quiz average",            min: 0, max: 100 },
  { name: "assignment_score_avg",     label: "Assignment average",      min: 0, max: 100 },
  { name: "midterm_score",            label: "Midterm score",           min: 0, max: 100 },
  { name: "historical_gpa",           label: "Historical GPA",          min: 0, max: 4,   step: 0.01 },
  { name: "study_hours_per_week",     label: "Study hours / week",      min: 0, max: 80 },
  { name: "subject_difficulty_score", label: "Subject difficulty (0-1)", min: 0, max: 1, step: 0.01 },
];

const EMPTY_FORM = Object.fromEntries(FEATURE_FIELDS.map((f) => [f.name, ""]));

export default function PredictionsPage() {
  // ── Student picker (same direct-api pattern + comment as EarlyWarningPage:
  //    studentService.js is Roshan's, swap when it exists) ──
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentsLoading, setStudentsLoading] = useState(true);

  // ── Form state ──
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});

  // ── Layer D hooks: one ACTION hook, one FETCH hook ──
  const { submit, result, submitting, error: submitError } = useRunPrediction();
  const {
    predictions,
    total,
    loading: historyLoading,
    refetch: refetchHistory,
  } = usePredictionHistory(selectedStudent?.id);

  useEffect(() => {
    api
      .get("/students", { params: { page_size: 100 } })
      .then((res) => setStudents(res.data.items))
      .catch(() => {}) // student list failure surfaces via empty picker
      .finally(() => setStudentsLoading(false));
  }, []);

  const handleFieldChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear that field's error as soon as the user edits it —
    // stale error messages under a corrected field feel broken.
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  // Client-side validation mirroring the backend ranges. This never
  // REPLACES backend validation (the backend must still enforce it —
  // never trust the client), it just gives instant feedback.
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
      student_id: selectedStudent.id,
      subject_id: null, // optional in PredictionInput; institution-wide run
      // Convert form strings -> numbers. TextField values are always
      // strings; Pydantic would coerce "82.5" fine, but sending real
      // numbers keeps the JSON honest to the schema's declared types.
      ...Object.fromEntries(
        FEATURE_FIELDS.map((f) => [f.name, Number(form[f.name])])
      ),
    };

    submit(payload)
      .then(() => {
        // Server-side, this run also just wrote to `predictions` —
        // the history table below is now stale, so refetch it.
        refetchHistory();
      })
      .catch(() => {
        // submitError from the hook already carries the failure;
        // nothing extra to do here — the catch exists because the
        // hook re-throws (see useRunPrediction's comment).
      });
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
                {/* 422 = Pydantic rejected a field server-side (should be
                    rare given client validation); anything else = generic */}
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
          {/* result stays null until the first successful submit —
              PredictionCard's empty state covers that gracefully */}
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
              Select a student to see their prediction history.
            </Typography>
          ) : historyLoading ? (
            <CircularProgress size={24} />
          ) : predictions.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No predictions yet for this student.
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
                          color: p.pass_fail === "PASS" ? "#1F9D63" : "#D14343",
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