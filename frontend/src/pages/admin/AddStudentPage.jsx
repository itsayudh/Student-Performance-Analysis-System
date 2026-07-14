// src/pages/admin/AddStudentPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import PageHeader from "../../components/common/PageHeader";
import AlertBanner from "../../components/common/AlertBanner";
import StudentForm from "../../components/forms/StudentForm";
import { createStudent } from "../../services/studentService";
import { parseApiError } from "../../utils/apiError";

export default function AddStudentPage() {
  const navigate = useNavigate();
  const [alert, setAlert] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (payload) => {
    // payload arrives pre-validated and pre-shaped by StudentForm:
    // matches StudentCreate exactly, ""→null already applied.
    setSaving(true);
    setAlert(null);
    try {
      // CHANGED: capture the response — in dev mode the backend returns
      // the auto-generated temporary password for the new student's
      // login account (production design emails it instead; see docs §7).
      const result = await createStudent(payload);

      // const flash = result?.temp_password
      //   ? `${payload.first_name} ${payload.last_name} was added. Temporary password: ${result.temp_password} — share it with the student; they should change it after first login.`
      //   : `${payload.first_name} ${payload.last_name} was added successfully.`;

      const flash =
        result?.temp_password && result?.email_sent === false
          ? `${result.message} Temporary password (copy exactly, without quotes): "${result.temp_password}"`
          : result?.message || `${payload.first_name} ${payload.last_name} was added.`;
          

      // Navigate back to the list, carrying the message with us —
      // showing it HERE would be pointless, we're about to leave.
      navigate("/admin/students", {
        replace: true,
        state: { flash },
      });
    } catch (err) {
      setAlert({ severity: "error", ...parseApiError(err) });
      window.scrollTo({ top: 0, behavior: "smooth" }); // error banner is up top
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Add Student"
        subtitle="Create a new student record"
        breadcrumbs={[
          { label: "Dashboard", to: "/admin/dashboard" },
          { label: "Students", to: "/admin/students" },
          { label: "Add Student" },
        ]}
      />

      <AlertBanner
        severity={alert?.severity}
        title={alert?.title}
        message={alert?.messages}
        show={!!alert}
        onClose={() => setAlert(null)}
      />

      <Paper sx={{ p: 3, maxWidth: 900 }}>
        <StudentForm
          mode="create"
          loading={saving}
          onSubmit={handleSubmit}
          onCancel={() => navigate("/admin/students")}
        />
      </Paper>
      <Box sx={{ height: 24 }} />
    </>
  );
}