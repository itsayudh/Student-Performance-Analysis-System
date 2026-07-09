import { useState, useEffect, useCallback } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import RiskBadge from "../../components/predictions/RiskBadge";
import {
  getStudentNotifications,
  resolveNotification,
} from "../../services/notificationService";
import api from "../../services/api";
import { formatRelativeTime } from "../../utils/formatters";

// Teacher portal — Early Warning page.
//
// DESIGN NOTE (documented deviation, discussed & concluded):
// The backend has NO teacher-scoped "all alerts" endpoint —
// GET /api/v1/notifications/admin/all is ADMIN-only, and the only
// teacher-accessible read is per-student. So this page is built as
// student-picker → that student's alerts. If we later add a
// /notifications/teacher/all endpoint (Option B), only the fetch
// section changes; the alert list rendering below stays identical.
//
// DATA FLOW:
//   1. On mount: GET /students (no /api/v1 prefix — that router is
//      mounted bare in main.py) → populate the picker
//   2. Teacher picks a student → GET /api/v1/notifications/{student_id}
//      ?unresolved_only=true (toggleable) via notificationService
//   3. Backend returns alerts sorted unresolved-first, newest-first
//   4. Resolve → PATCH → surgical local-state update (same pattern
//      as RecommendationsPage's mark-as-read)
export default function EarlyWarningPage() {
  // ── Student picker state ───────────────────────────────────────────
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentsLoading, setStudentsLoading] = useState(true);

  // ── Alerts state ───────────────────────────────────────────────────
  const [notifications, setNotifications] = useState([]);
  const [unresolvedCount, setUnresolvedCount] = useState(0);
  const [unresolvedOnly, setUnresolvedOnly] = useState(true);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load the student list once on mount.
  // NOTE: calling `api` directly instead of studentService.js because
  // that service file is on Roshan's task list and doesn't exist yet —
  // same precedent as useAttendance.js / useMarks.js. Swap to
  // `import { getStudents } from "../../services/studentService"`
  // once he's built it.
  useEffect(() => {
    api
      .get("/students", { params: { page_size: 100 } })
      .then((res) => setStudents(res.data.items))
      .catch((err) => setError(err))
      .finally(() => setStudentsLoading(false));
  }, []);

  // Load alerts whenever the selected student or the filter changes.
  const fetchAlerts = useCallback(() => {
    if (!selectedStudent) return;

    setAlertsLoading(true);
    setError(null);

    getStudentNotifications(selectedStudent.id, unresolvedOnly)
      .then((res) => {
        setNotifications(res.data.notifications);
        setUnresolvedCount(res.data.unresolved_count);
      })
      .catch((err) => setError(err))
      .finally(() => setAlertsLoading(false));
  }, [selectedStudent, unresolvedOnly]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Resolve one alert: PATCH, then update only the affected row locally.
  // When "unresolved only" is on, the resolved item is removed from the
  // visible list; when off, it stays visible but flips to resolved.
  const handleResolve = (notificationId) => {
    resolveNotification(selectedStudent.id, notificationId)
      .then(() => {
        setNotifications((prev) =>
          unresolvedOnly
            ? prev.filter((n) => n.id !== notificationId)
            : prev.map((n) =>
                n.id === notificationId ? { ...n, is_resolved: true } : n
              )
        );
        setUnresolvedCount((prev) => Math.max(0, prev - 1));
      })
      .catch((err) => setError(err));
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Early Warning
      </Typography>

      {/* ── Controls row: student picker + filter toggle ── */}
      <Box sx={{ display: "flex", gap: 3, alignItems: "center", mb: 3, flexWrap: "wrap" }}>
        <Autocomplete
          sx={{ width: 340 }}
          options={students}
          loading={studentsLoading}
          value={selectedStudent}
          onChange={(_, value) => setSelectedStudent(value)}
          getOptionLabel={(s) =>
            `${s.first_name} ${s.last_name} (${s.student_code})`
          }
          isOptionEqualToValue={(opt, val) => opt.id === val.id}
          renderInput={(params) => (
            <TextField {...params} label="Select student" size="small" />
          )}
        />
        <FormControlLabel
          control={
            <Switch
              checked={unresolvedOnly}
              onChange={(e) => setUnresolvedOnly(e.target.checked)}
            />
          }
          label="Unresolved only"
        />
        {selectedStudent && unresolvedCount > 0 && (
          <Chip label={`${unresolvedCount} unresolved`} color="error" size="small" />
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Something went wrong loading alerts. Please try again.
        </Alert>
      )}

      {/* ── Empty / loading / list states ── */}
      {!selectedStudent ? (
        <Typography variant="body2" color="text.secondary">
          Select a student to view their early warning alerts.
        </Typography>
      ) : alertsLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : notifications.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {unresolvedOnly
            ? "No unresolved alerts for this student. All clear."
            : "No alerts on record for this student."}
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, maxWidth: 760 }}>
          {notifications.map((n) => (
            <Box
              key={n.id}
              sx={{
                display: "flex",
                gap: 2,
                alignItems: "flex-start",
                p: 2,
                borderRadius: "10px",
                border: "1px solid #E4E6EB",
                backgroundColor: "#FFFFFF",
                opacity: n.is_resolved ? 0.6 : 1,
              }}
            >
              {/* severity uses the same LOW/MEDIUM/HIGH/CRITICAL values
                  as risk_level, so RiskBadge is reused directly — this
                  is why we kept those value sets aligned in the backend */}
              <RiskBadge level={n.severity} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                  {n.message}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {n.notification_type.replace(/_/g, " ").toLowerCase()} ·{" "}
                  {formatRelativeTime(n.created_at)}
                  {n.is_resolved && " · resolved"}
                </Typography>
              </Box>
              {!n.is_resolved && (
                <Button size="small" onClick={() => handleResolve(n.id)}>
                  Resolve
                </Button>
              )}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}