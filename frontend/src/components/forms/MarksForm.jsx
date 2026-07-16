// src/components/forms/MarksForm.jsx
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
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import { required, scoreInRange, runValidators } from "../../utils/validators";
import { MARK_TYPES } from "../../utils/constants";

/**
 * Bulk marks entry: teacher picks class + subject + mark type + max score,
 * then enters a score per student. Output matches backend MarksCreate:
 *
 *   { class_id, subject_id, mark_type, max_score,
 *     records: [{ student_id, score }] }
 *
 * Props (same shape as AttendanceForm):
 *  - classes, subjects : [{ id, name }]
 *  - students          : roster of selected class
 *  - onClassChange     : (classId) => void — page refetches roster
 *  - loading, onSubmit
 */
export default function MarksForm({
  classes = [],
  subjects = [],
  students = [],
  onClassChange,
  loading = false,
  onSubmit,
}) {
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [markType, setMarkType] = useState("");
  const [maxScore, setMaxScore] = useState("");
  // scoreMap: { [student_id]: "17.5" }  — kept as strings while typing;
  // converted to numbers only at submit time.
  const [scoreMap, setScoreMap] = useState({});
  const [errors, setErrors] = useState({}); // header field errors
  const [rowErrors, setRowErrors] = useState({}); // { [student_id]: "msg" }

  const handleClassChange = (e) => {
    setClassId(e.target.value);
    setScoreMap({}); // old roster's scores are meaningless
    setRowErrors({});
    onClassChange?.(e.target.value);
  };

  const handleScoreChange = (studentId) => (e) => {
    const raw = e.target.value;
    setScoreMap((prev) => ({ ...prev, [studentId]: raw }));
    // Live-validate this row against the CURRENT max score
    const err = scoreInRange(maxScore === "" ? null : Number(maxScore))(raw);
    setRowErrors((prev) => ({ ...prev, [studentId]: err }));
  };

  const handleMaxScoreChange = (e) => {
    const newMax = e.target.value;
    setMaxScore(newMax);
    // CROSS-FIELD RE-VALIDATION: every already-entered score must be
    // re-checked against the new ceiling. (Teacher types 45 for a student,
    // then lowers max from 50 to 40 — that 45 is now invalid.)
    const maxNum = newMax === "" ? null : Number(newMax);
    const nextRowErrors = {};
    for (const [sid, val] of Object.entries(scoreMap)) {
      const err = scoreInRange(maxNum)(val);
      if (err) nextRowErrors[sid] = err;
    }
    setRowErrors(nextRowErrors);
  };

  const handleSubmit = () => {
    // --- header validation ---
    const errs = {};
    errs.class_id = runValidators([required("Class")], classId);
    errs.subject_id = runValidators([required("Subject")], subjectId);
    errs.mark_type = runValidators([required("Mark type")], markType);
    errs.max_score = runValidators([required("Max score")], maxScore);
    if (!errs.max_score && Number(maxScore) <= 0) {
      errs.max_score = "Max score must be greater than 0";
    }
    Object.keys(errs).forEach((k) => !errs[k] && delete errs[k]);
    setErrors(errs);

    // --- row validation: every student needs a valid score ---
    const maxNum = Number(maxScore);
    const nextRowErrors = {};
    for (const s of students) {
      const raw = scoreMap[s.id];
      if (raw === undefined || raw === "") {
        nextRowErrors[s.id] = "Score required";
      } else {
        const err = scoreInRange(maxNum)(raw);
        if (err) nextRowErrors[s.id] = err;
      }
    }
    setRowErrors(nextRowErrors);

    if (Object.keys(errs).length > 0 || Object.keys(nextRowErrors).length > 0)
      return;
    if (students.length === 0) return;

    onSubmit?.({
      class_id: classId,
      subject_id: subjectId,
      mark_type: markType,
      max_score: Number(maxScore),
      records: students.map((s) => ({
        student_id: s.id,
        score: Number(scoreMap[s.id]), // string → number at the boundary
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
        <Grid size={{ xs: 12, sm: 1.17 }}>
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
        <Grid size={{ xs: 12, sm: 1.37 }}>
          <TextField
            select
            fullWidth
            size="small"
            label="Mark Type"
            value={markType}
            onChange={(e) => setMarkType(e.target.value)}
            error={!!errors.mark_type}
            helperText={errors.mark_type || " "}
          >
            {MARK_TYPES.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            size="small"
            label="Max Score *"
            type="number"
            inputProps={{ min: 0, step: "0.5" }}
            value={maxScore}
            onChange={handleMaxScoreChange}
            error={!!errors.max_score}
            helperText={errors.max_score || " "}
          />
        </Grid>
      </Grid>

      {/* ---- Score entry table ---- */}
      {students.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
          Select a class to load its students.
        </Typography>
      ) : (
        <Paper variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Code</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Student</TableCell>
                <TableCell sx={{ fontWeight: 600 }} width={180}>
                  Score {maxScore !== "" ? `( / ${maxScore})` : ""}
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
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      inputProps={{ min: 0, step: "0.5" }}
                      value={scoreMap[s.id] ?? ""}
                      onChange={handleScoreChange(s.id)}
                      error={!!rowErrors[s.id]}
                      helperText={rowErrors[s.id] || " "}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || students.length === 0}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading ? "Saving..." : "Save Marks"}
        </Button>
      </Box>
    </Box>
  );
}
