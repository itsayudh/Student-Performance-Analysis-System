// src/pages/admin/AddTeacherPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import PageHeader from "../../components/common/PageHeader";
import AlertBanner from "../../components/common/AlertBanner";
import TeacherForm from "../../components/forms/TeacherForm";
import { createTeacher } from "../../services/teacherService";
import { parseApiError } from "../../utils/apiError";

export default function AddTeacherPage() {
  const navigate = useNavigate();
  const [alert, setAlert] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (payload) => {
    setSaving(true);
    setAlert(null);
    try {
      // Backend generates the login password and (dev mode) returns it —
      // surface it once, quoted so its boundaries are unambiguous.
      const result = await createTeacher(payload);

      const flash = result?.temp_password
        ? `${payload.first_name} ${payload.last_name} was added. Temporary password (copy exactly, without quotes): "${result.temp_password}"`
        : `${payload.first_name} ${payload.last_name} was added successfully.`;

      navigate("/admin/teachers", {
        replace: true,
        state: { flash },
      });
    } catch (err) {
      setAlert({ severity: "error", ...parseApiError(err) });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Add Teacher"
        subtitle="Create a new teacher record"
        breadcrumbs={[
          { label: "Dashboard", to: "/admin/dashboard" },
          { label: "Teachers", to: "/admin/teachers" },
          { label: "Add Teacher" },
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
        <TeacherForm
          mode="create"
          loading={saving}
          onSubmit={handleSubmit}
          onCancel={() => navigate("/admin/teachers")}
        />
      </Paper>
      <Box sx={{ height: 24 }} />
    </>
  );
}
