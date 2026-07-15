// src/pages/admin/StudentDetailPage.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import EditIcon from "@mui/icons-material/Edit";
import PageHeader from "../../components/common/PageHeader";
import AlertBanner from "../../components/common/AlertBanner";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import StudentForm from "../../components/forms/StudentForm";
import { getStudent, updateStudent } from "../../services/studentService";
import { parseApiError } from "../../utils/apiError";

// Small display helper for read mode
function Field({ label, value }) {
  return (
    <Grid item xs={12} sm={6} md={4}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1">{value ?? "—"}</Typography>
    </Grid>
  );
}

export default function StudentDetailPage() {
  // useParams reads the :id segment from /admin/students/:id —
  // this is how the row click on StudentsPage hands us WHICH student.
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [student, setStudent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  // If we arrived via the list page's Edit icon, open straight into
  // edit mode instead of making the admin click Edit again.
  const [editing, setEditing] = useState(!!location.state?.autoEdit);
  const [saving, setSaving] = useState(false);

  // Fetch the student whenever the id changes
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setAlert(null);

    getStudent(id)
      .then((data) => {
        if (!cancelled) setStudent(data);
      })
      .catch((err) => {
        if (!cancelled) setAlert({ severity: "error", ...parseApiError(err) });
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleUpdate = async (payload) => {
    setSaving(true);
    setAlert(null);
    try {
      // StudentUpdate only accepts these fields — send exactly them.
      // (email/student_code are locked in the form anyway; slicing the
      // payload here makes the contract explicit at the boundary.)
      const allowed = [
        "first_name",
        "last_name",
        "gender",
        "date_of_birth",
        "phone",
        "address",
        "program",
        "department",
      ];
      const body = {};
      for (const k of allowed) {
        if (payload[k] !== undefined) body[k] = payload[k];
      }

      await updateStudent(id, body);
      // The PUT response is only { id, message } — not the full student
      // (unlike /classes, whose update returns the whole object). Refetch
      // so the read view shows real data, not the message envelope.
      const fresh = await getStudent(id);
      setStudent(fresh);
      setEditing(false);
      setAlert({ severity: "success", messages: "Student updated." });
    } catch (err) {
      setAlert({ severity: "error", ...parseApiError(err) });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading student..." />;
  }

  if (!student) {
    // Fetch failed (bad id, deleted record, permission) — alert explains it
    return (
      <>
        <AlertBanner
          severity="error"
          title={alert?.title || "Not found"}
          message={alert?.messages || "This student could not be loaded."}
        />
        <Button onClick={() => navigate("/admin/students")}>
          Back to Students
        </Button>
      </>
    );
  }

  const fullName = `${student.first_name} ${student.last_name}`;

  return (
    <>
      <PageHeader
        title={fullName}
        subtitle={`Student Code: ${student.student_code}`}
        
        action={
          !editing && (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => setEditing(true)}
            >
              Edit
            </Button>
          )
        }
      />

      <AlertBanner
        severity={alert?.severity}
        title={alert?.title}
        message={alert?.messages}
        show={!!alert}
        onClose={() => setAlert(null)}
      />

      <Paper sx={{ p: 3, maxWidth: 900 }}>
        {editing ? (
          <StudentForm
            mode="edit"
            initialValues={student}
            loading={saving}
            onSubmit={handleUpdate}
            onCancel={() => {
              // Arrived via the list's pencil icon → cancel means "abort
              // the errand entirely," back to the list. Arrived via
              // row-click + Edit button → cancel just returns to reading.
              if (location.state?.autoEdit) {
                navigate("/admin/students");
              } else {
                setEditing(false);
              }
            }}
          />
        ) : (
          <Grid container spacing={2}>
            <Field label="Student Code" value={student.student_code} />
            <Field label="Program" value={student.program} />
            <Field label="Department" value={student.department} />
            <Field label="Admission Date" value={student.admission_date} />
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" color="text.secondary">
                Status
              </Typography>
              <Box>
                <Chip
                  label={student.is_active ? "Active" : "Inactive"}
                  color={student.is_active ? "success" : "default"}
                  size="small"
                />
              </Box>
            </Grid>
          </Grid>
        )}
      </Paper>
    </>
  );
}
