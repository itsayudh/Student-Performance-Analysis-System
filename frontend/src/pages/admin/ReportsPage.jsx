import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { generateReport, downloadBlob } from "../../services/reportService";
import api from "../../services/api";

// Admin portal — Reports: pick type + target, generate, download PDF.
export default function ReportsPage() {
  const [reportType, setReportType] = useState("STUDENT");
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [classId, setClassId] = useState("");
  const [semester, setSemester] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get("/students", { params: { page_size: 100 } }),
      api.get("/classes", { params: { page_size: 100, is_active: true } }),
    ]).then(([sRes, cRes]) => {
      setStudents(sRes.data.items);
      setClasses(cRes.data.items);
    }).catch(() => {});
  }, []);

  const ready =
    (reportType === "STUDENT" && studentId) ||
    (reportType === "CLASS" && classId) ||
    (reportType === "SEMESTER" && semester.trim());

  const handleGenerate = () => {
    setGenerating(true);
    setError(null);

    const payload = { report_type: reportType };
    if (reportType === "STUDENT") payload.student_id = studentId;
    if (reportType === "CLASS") payload.class_id = classId;
    if (reportType === "SEMESTER") payload.semester = semester.trim();

    // Build a human filename from the selection the page already has.
    // (downloadBlob's link.download overrides the backend's generic
    // Content-Disposition name — so naming is a frontend concern here.)
    let filename = "report.pdf";
    if (reportType === "STUDENT") {
      const s = students.find((x) => x.id === studentId);
      filename = `${s.first_name}_${s.last_name}_report.pdf`;
    } else if (reportType === "CLASS") {
      const c = classes.find((x) => x.id === classId);
      filename = `${c.class_code}_report.pdf`;
    } else {
      filename = `${semester.trim().replace(/\s+/g, "_")}_report.pdf`;
    }

    generateReport(payload)
      .then((res) => downloadBlob(res.data, filename))
      .catch(() => setError("Could not generate the report. Please try again."))
      .finally(() => setGenerating(false));
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Reports
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <ToggleButtonGroup
        size="small" exclusive value={reportType}
        onChange={(_, v) => { if (v) { setReportType(v); setError(null); } }}
        sx={{ mb: 3 }}
      >
        <ToggleButton value="STUDENT">Student</ToggleButton>
        <ToggleButton value="CLASS">Class</ToggleButton>
        <ToggleButton value="SEMESTER">Semester</ToggleButton>
      </ToggleButtonGroup>

      <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
        {reportType === "STUDENT" && (
          <TextField select size="small" sx={{ width: 340 }} label="Student"
            value={studentId} onChange={(e) => setStudentId(e.target.value)}>
            {students.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.first_name} {s.last_name} ({s.student_code})
              </MenuItem>
            ))}
          </TextField>
        )}

        {reportType === "CLASS" && (
          <TextField select size="small" sx={{ width: 340 }} label="Class"
            value={classId} onChange={(e) => setClassId(e.target.value)}>
            {classes.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.class_name} ({c.class_code})
              </MenuItem>
            ))}
          </TextField>
        )}

        {reportType === "SEMESTER" && (
          <TextField size="small" sx={{ width: 340 }} label="Semester"
            placeholder="Fall 2025-26" value={semester}
            onChange={(e) => setSemester(e.target.value)} />
        )}

        <Button variant="contained" disabled={!ready || generating} onClick={handleGenerate}>
          {generating ? <CircularProgress size={22} color="inherit" /> : "Generate PDF"}
        </Button>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
        The PDF downloads automatically when generation completes.
      </Typography>
    </Box>
  );
}