import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import MarksForm from "../../components/forms/MarksForm";
import { recordMarks } from "../../services/marksService";
import api from "../../services/api";
import { Panel, PageHeader } from "../../components/gridline";

// Teacher portal — bulk marks entry.
//
// DIVISION OF LABOR (the point of this page's thinness):
//   MarksForm (Roshan's) owns ALL form state + validation and emits a
//   finished MarksCreate payload. This page owns DATA: fetching the
//   three lists, refetching the roster on class change, POSTing, and
//   reporting the outcome. Neither side knows the other's internals —
//   the props contract is the whole relationship.
export default function MarksPage() {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);   // success payload from backend
  const [error, setError] = useState(null);

  // MarksForm expects [{ id, name }] — the API returns class_name/
  // subject_name. This .map() is the ADAPTER between two contracts we
  // don't want to change: same principle as toGradePieData on AnalyticsPage.
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

  // The onClassChange contract in action: form tells us WHICH class,
  // we fetch WHO is in it (new GET /classes/{id}/students endpoint).
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

    recordMarks(payload)
      .then((res) => setResult(res.data)) // { message, mark_type, class_avg }
      .catch((err) => setError(err))
      .finally(() => setSubmitting(false));
  };

  // 422 here means the backend's validator caught something the form's
  // client-side checks missed (they should agree — if this fires often,
  // the two validation layers have drifted; that's the signal to re-sync
  // them, same lesson as the difficulty-range bug).
  const errorMessage = (() => {
    if (!error) return null;
    const detail = error.response?.data?.detail;
    if (Array.isArray(detail)) return detail.map((d) => d.msg).join("; ");
    if (typeof detail === "string") return detail;
    return "Could not save marks. Please try again.";
  })();

  return (
    <Box>
      <PageHeader title="Marks Entry" />

      {result && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setResult(null)}>
          {result.message} — class average: {result.class_avg}
        </Alert>
      )}
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {errorMessage}
        </Alert>
      )}

      <Panel>
        <MarksForm
          classes={classes}
          subjects={subjects}
          students={students}
          onClassChange={handleClassChange}
          loading={submitting}
          onSubmit={handleSubmit}
        />
      </Panel>
    </Box>
  );
}