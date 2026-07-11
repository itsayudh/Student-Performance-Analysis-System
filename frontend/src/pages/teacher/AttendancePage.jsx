import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import AttendanceForm from "../../components/forms/AttendanceForm";
import { recordAttendance } from "../../services/attendanceService";
import api from "../../services/api";

// Teacher portal — daily bulk attendance entry.
//
// Structural twin of MarksPage: Roshan's form owns state + validation
// and emits a finished AttendanceCreate payload; this page owns data
// (lists, roster refetch, POST, outcome reporting).
//
// One domain-specific wrinkle MarksPage doesn't have: the backend
// enforces one-entry-per-class/subject/date with a 409. That's a
// BUSINESS condition, not a failure — it gets its own friendly message,
// severity "warning", because the teacher did nothing wrong.
export default function AttendancePage() {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Same adapter as MarksPage: API's class_name/subject_name → form's
  // { id, name } contract.
  useEffect(() => {
    Promise.all([
      api.get("/classes", { params: { page_size: 100, is_active: true } }),
      api.get("/subjects", { params: { page_size: 100, is_active: true } }),
    ])
      .then(([cRes, sRes]) => {
        setClasses(
          cRes.data.items.map((c) => ({
            id: c.id,
            name: `${c.class_name} (${c.class_code})`,
          }))
        );
        setSubjects(
          sRes.data.items.map((s) => ({
            id: s.id,
            name: `${s.subject_name} (${s.subject_code})`,
          }))
        );
      })
      .catch((err) => setError(err));
  }, []);

  // Second consumer of GET /classes/{id}/students — the endpoint
  // earning its keep across domains, as designed.
  const handleClassChange = (classId) => {
    setStudents([]);
    setResult(null);
    if (!classId) return;

    api
      .get(`/classes/${classId}/students`)
      .then((res) => setStudents(res.data.items))
      .catch((err) => setError(err));
  };

  const handleSubmit = (payload) => {
    setSubmitting(true);
    setError(null);
    setResult(null);

    recordAttendance(payload)
      .then((res) => setResult(res.data)) // { message, date, present, absent, late, ... }
      .catch((err) => setError(err))
      .finally(() => setSubmitting(false));
  };

  const is409 = error?.response?.status === 409;
  const errorMessage = (() => {
    if (!error) return null;
    if (is409)
      return "Attendance for this class, subject, and date is already recorded — duplicate entries aren't allowed.";
    const detail = error.response?.data?.detail;
    if (Array.isArray(detail)) return detail.map((d) => d.msg).join("; ");
    if (typeof detail === "string") return detail;
    return "Could not save attendance. Please try again.";
  })();

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Attendance Entry
      </Typography>

      {result && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setResult(null)}>
          {result.message} for {result.date} — Present: {result.present},
          Absent: {result.absent}, Late: {result.late}
        </Alert>
      )}
      {errorMessage && (
        <Alert
          severity={is409 ? "warning" : "error"}
          sx={{ mb: 2 }}
          onClose={() => setError(null)}
        >
          {errorMessage}
        </Alert>
      )}

      <AttendanceForm
        classes={classes}
        subjects={subjects}
        students={students}
        onClassChange={handleClassChange}
        loading={submitting}
        onSubmit={handleSubmit}
      />
    </Box>
  );
}