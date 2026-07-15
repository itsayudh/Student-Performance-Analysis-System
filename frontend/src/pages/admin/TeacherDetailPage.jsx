// src/pages/admin/TeacherDetailPage.jsx
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
import TeacherForm from "../../components/forms/TeacherForm";
import { getTeacher, updateTeacher } from "../../services/teacherService";
import { parseApiError } from "../../utils/apiError";

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

export default function TeacherDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [teacher, setTeacher] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  // If we arrived via the list page's pencil icon (autoEdit in router
  // state), open straight into edit mode — no second Edit click needed.
  const [editing, setEditing] = useState(!!location.state?.autoEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setAlert(null);

    getTeacher(id)
      .then((data) => {
        if (!cancelled) setTeacher(data);
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
      // TeacherUpdate accepts exactly these five fields — slice the
      // form payload down to the contract at the boundary.
      const allowed = [
        "first_name",
        "last_name",
        "department",
        "specialization",
        "qualification",
      ];
      const body = {};
      for (const k of allowed) {
        if (payload[k] !== undefined) body[k] = payload[k];
      }

      await updateTeacher(id, body);
      // The PUT response is only { id, message } — not the full teacher
      // (unlike /classes, whose update returns the whole object). Refetch
      // so the read view shows real data, not the message envelope.
      const fresh = await getTeacher(id);
      setTeacher(fresh);
      setEditing(false);
      setAlert({ severity: "success", messages: "Teacher updated." });
    } catch (err) {
      setAlert({ severity: "error", ...parseApiError(err) });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Arrived via the list's pencil icon → cancel aborts the whole
    // errand, back to the list. Arrived via row-click + Edit button →
    // cancel just returns to reading this teacher.
    if (location.state?.autoEdit) {
      navigate("/admin/teachers");
    } else {
      setEditing(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading teacher..." />;
  }

  if (!teacher) {
    return (
      <>
        <AlertBanner
          severity="error"
          title={alert?.title || "Not found"}
          message={alert?.messages || "This teacher could not be loaded."}
        />
        <Button onClick={() => navigate("/admin/teachers")}>
          Back to Teachers
        </Button>
      </>
    );
  }

  const fullName = `${teacher.first_name} ${teacher.last_name}`;

  return (
    <>
      <PageHeader
        title={fullName}
        subtitle={`Employee Code: ${teacher.employee_code}`}
        breadcrumbs={[

          { label: fullName },
        ]}
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
          <TeacherForm
            mode="edit"
            initialValues={teacher}
            loading={saving}
            onSubmit={handleUpdate}
            onCancel={handleCancel}
          />
        ) : (
          <Grid container spacing={2}>
            <Field label="Employee Code" value={teacher.employee_code} />
            <Field label="Department" value={teacher.department} />
            <Field label="Specialization" value={teacher.specialization} />
            <Field label="Qualification" value={teacher.qualification} />
            <Field label="Joining Date" value={teacher.joining_date} />
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" color="text.secondary">
                Status
              </Typography>
              <Box>
                <Chip
                  label={teacher.is_active ? "Active" : "Inactive"}
                  color={teacher.is_active ? "success" : "default"}
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