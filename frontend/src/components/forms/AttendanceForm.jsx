// src/components/forms/AttendanceForm.jsx
import { useState } from "react";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import { required, notFutureDate, runValidators } from "../../utils/validators";
import { ATTENDANCE_STATUSES } from "../../utils/constants";

/**
 * Bulk attendance entry: teacher picks class + subject + date, then marks
 * every student. Output matches backend AttendanceCreate exactly:
 *
 *   { class_id, subject_id, attendance_date, records: [{student_id, status}] }
 *
 * Pure presentation — the PAGE owns the data fetching:
 *  - classes  : [{ id, name }]          (from GET /classes)
 *  - subjects : [{ id, name }]          (from GET /subjects)
 *  - students : [{ id, student_code, first_name, last_name }]
 *               (the roster of the SELECTED class — page refetches this
 *                whenever the teacher changes class via onClassChange)
 *  - onClassChange : (classId) => void — page hook to reload the roster
 *  - loading  : disables submit during POST
 *  - onSubmit : (payload) => void
 */
export default function AttendanceForm({
  classes = [],
  subjects = [],
  students = [],
  onClassChange,
  loading = false,
  onSubmit,
}) {
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [date, setDate] = useState("");
  // statusMap: { [student_id]: "PRESENT" | "ABSENT" | "LATE" }
  // Default everyone to PRESENT — the common case; teacher only
  // touches the exceptions. (Marking 40 students one by one when
  // 38 are present would be miserable UX.)
  const [statusMap, setStatusMap] = useState({});
  const [errors, setErrors] = useState({});

  const getStatus = (studentId) => statusMap[studentId] ?? "PRESENT";

  const setStatus = (studentId, newStatus) => {
    // ToggleButtonGroup passes null if you click the already-selected
    // button — ignore that, a student must always have SOME status.
    if (newStatus === null) return;
    setStatusMap((prev) => ({ ...prev, [studentId]: newStatus }));
  };

  const markAll = (status) => {
    const next = {};
    for (const s of students) next[s.id] = status;
    setStatusMap(next);
  };

  const handleClassChange = (e) => {
    setClassId(e.target.value);
    setStatusMap({}); // old roster's statuses are meaningless for a new class
    onClassChange?.(e.target.value); // tell the page to fetch this class's roster
  };

  const handleSubmit = () => {
    const errs = {};
    errs.class_id = runValidators([required("Class")], classId);
    errs.subject_id = runValidators([required("Subject")], subjectId);
    errs.attendance_date = runValidators(
      [required("Date"), notFutureDate],
      date,
    );
    // strip empty entries
    Object.keys(errs).forEach((k) => !errs[k] && delete errs[k]);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    if (students.length === 0) return; // nothing to submit

    onSubmit?.({
      class_id: classId,
      subject_id: subjectId,
      attendance_date: date,
      records: students.map((s) => ({
        student_id: s.id,
        status: getStatus(s.id),
      })),
    });
  };

  return (
    <Box>
      {/* ---- Header selectors ---- */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 1 }}>
          <TextField
            select
            fullWidth
            size="small"
            label="Class"
            value={classId}
            onChange={handleClassChange}
            error={!!errors.class_id}
            helperText={errors.class_id || " "}
          >
            {classes.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 1.1 }}>
          <TextField
            select
            fullWidth
            size="small"
            label="Subject"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            error={!!errors.subject_id}
            helperText={errors.subject_id || " "}
          >
            {subjects.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            size="small"
            label="Date *"
            type="date"
            slotProps={{ inputLabel: { shrink: true } }}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            error={!!errors.attendance_date}
            helperText={errors.attendance_date || " "}
          />
        </Grid>
      </Grid>

      {/* ---- Roster ---- */}
      {students.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
          Select a class to load its students.
        </Typography>
      ) : (
        <>
          <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
            <Button size="small" onClick={() => markAll("PRESENT")}>
              Mark all present
            </Button>
            <Button size="small" onClick={() => markAll("ABSENT")}>
              Mark all absent
            </Button>
          </Box>

          <Paper variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Code</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Student</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">
                    Status
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.student_code}</TableCell>
                    <TableCell>
                      {s.first_name} {s.last_name}
                    </TableCell>
                    <TableCell align="center">
                      <ToggleButtonGroup
                        exclusive
                        size="small"
                        value={getStatus(s.id)}
                        onChange={(_, val) => setStatus(s.id, val)}
                      >
                        {ATTENDANCE_STATUSES.map((st) => (
                          <ToggleButton
                            key={st}
                            value={st}
                            color={
                              st === "PRESENT"
                                ? "success"
                                : st === "ABSENT"
                                  ? "error"
                                  : "warning"
                            }
                          >
                            {st}
                          </ToggleButton>
                        ))}
                      </ToggleButtonGroup>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </>
      )}

      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || students.length === 0}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading ? "Saving..." : "Save Attendance"}
        </Button>
      </Box>
    </Box>
  );
}
