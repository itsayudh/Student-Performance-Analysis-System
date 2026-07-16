import { useState, useEffect, useCallback } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Grid from "@mui/material/Grid";
import DataTable from "../../components/common/DataTable";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import api from "../../services/api";
import { PageHeader } from "../../components/gridline";

// Admin portal — Classes: CRUD + subject/teacher assignment manager.
//
// Three cooperating pieces:
//   1. DataTable (Roshan's) — server-side paginated list. THIS PAGE owns
//      page/pageSize/search state and refetches; the table just renders.
//   2. Create/Edit dialog — inline (no ClassForm.jsx exists in the doc's
//      forms list; a page-local dialog is the right size for it).
//   3. Assignment dialog — the UI over POST/GET /classes/{id}/subjects,
//      replacing the curl workflow from the backend smoke tests.
const EMPTY_FORM = {
  class_name: "",
  class_code: "",
  program: "",
  department: "",
  semester: "",
  academic_year: "",
  homeroom_teacher_id: "",
};

export default function ClassesPage() {
  // ── list state (parent-owned, per DataTable's contract) ──
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState(null); // { severity, text }

  // ── create/edit dialog ──
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = creating
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  // ── delete confirm ──
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ── assignment dialog ──
  const [assignTarget, setAssignTarget] = useState(null); // the class row
  const [assignments, setAssignments] = useState([]);
  const [assignSubjectId, setAssignSubjectId] = useState("");
  const [assignTeacherId, setAssignTeacherId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState(null);

  // ── picker data (fetched once) ──
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);

  // ── enrollment dialog ──
  const [enrollTarget, setEnrollTarget] = useState(null); // the class row
  const [roster, setRoster] = useState([]); // currently enrolled
  const [available, setAvailable] = useState([]); // not yet enrolled
  const [availableSearch, setAvailableSearch] = useState("");
  const [selectedToAdd, setSelectedToAdd] = useState([]); // student ids checked in "available"
  const [enrolling, setEnrolling] = useState(false);
  const [withdrawingId, setWithdrawingId] = useState(null); // per-row spinner target
  const [enrollError, setEnrollError] = useState(null);

  // ── Manage Subjects mini-dialog (create + edit + deactivate) ──
  const [manageSubjectsOpen, setManageSubjectsOpen] = useState(false);
  const EMPTY_SUBJECT = {
    subject_name: "",
    subject_code: "",
    department: "",
    credit_hours: "3",
  };
  const [subjectForm, setSubjectForm] = useState(EMPTY_SUBJECT);
  const [editingSubjectId, setEditingSubjectId] = useState(null); // null = creating
  const [savingSubject, setSavingSubject] = useState(false);
  const [deactivatingSubjectId, setDeactivatingSubjectId] = useState(null);
  const [subjectError, setSubjectError] = useState(null);

  const fetchClasses = useCallback(() => {
    setLoading(true);
    api
      .get("/classes", {
        params: { page, page_size: pageSize, search: search || undefined },
      })
      .then((res) => {
        setRows(res.data.items);
        setTotal(res.data.total);
      })
      .catch(() =>
        setBanner({ severity: "error", text: "Could not load classes." }),
      )
      .finally(() => setLoading(false));
  }, [page, pageSize, search]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    Promise.all([
      api.get("/subjects", { params: { page_size: 100, is_active: true } }),
      api.get("/teachers", { params: { page_size: 100 } }),
    ])
      .then(([sRes, tRes]) => {
        setSubjects(sRes.data.items);
        setTeachers(tRes.data.items);
      })
      .catch(() => {});
  }, []);

  // ── create/edit handlers ──
  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setFormOpen(true);
  };

  // Edit needs the FULL object (list items omit homeroom_teacher_id),
  // so we fetch the detail before opening — the standard
  // "list is thin, edit fetches fat" pattern.
  const openEdit = (row) => {
    api.get(`/classes/${row.id}`).then((res) => {
      const c = res.data;
      setEditingId(c.id);
      setForm({
        class_name: c.class_name,
        class_code: c.class_code,
        program: c.program,
        department: c.department,
        semester: String(c.semester),
        academic_year: c.academic_year,
        homeroom_teacher_id: c.homeroom_teacher_id || "",
      });
      setFormError(null);
      setFormOpen(true);
    });
  };

  const handleSave = () => {
    setSaving(true);
    setFormError(null);

    const base = {
      class_name: form.class_name,
      program: form.program,
      department: form.department,
      semester: Number(form.semester),
      academic_year: form.academic_year,
      homeroom_teacher_id: form.homeroom_teacher_id || null,
    };

    // class_code only on CREATE — ClassUpdate deliberately excludes it.
    const request = editingId
      ? api.put(`/classes/${editingId}`, base)
      : api.post("/classes", { ...base, class_code: form.class_code });

    request
      .then(() => {
        setFormOpen(false);
        setBanner({
          severity: "success",
          text: editingId ? "Class updated." : "Class created.",
        });
        fetchClasses();
      })
      .catch((err) => {
        const detail = err.response?.data?.detail;
        setFormError(
          typeof detail === "string"
            ? detail
            : Array.isArray(detail)
              ? detail.map((d) => d.msg).join("; ")
              : "Could not save class.",
        );
      })
      .finally(() => setSaving(false));
  };

  // ── delete handlers ──
  const handleDelete = () => {
    setDeleting(true);
    api
      .delete(`/classes/${deleteTarget.id}`)
      .then(() => {
        setBanner({
          severity: "success",
          text: `${deleteTarget.class_code} deactivated.`,
        });
        setDeleteTarget(null);
        fetchClasses();
      })
      .catch(() =>
        setBanner({ severity: "error", text: "Could not deactivate class." }),
      )
      .finally(() => setDeleting(false));
  };

  // ── assignment handlers ──
  const openAssignments = (row) => {
    setAssignTarget(row);
    setAssignSubjectId("");
    setAssignTeacherId("");
    setAssignError(null);
    api
      .get(`/classes/${row.id}/subjects`)
      .then((res) => setAssignments(res.data.items));
  };

  const handleAssign = () => {
    if (!assignSubjectId || !assignTeacherId) return;
    setAssigning(true);
    setAssignError(null);

    api
      .post(`/classes/${assignTarget.id}/subjects`, {
        subject_id: assignSubjectId,
        teacher_id: assignTeacherId,
      })
      .then(() => {
        setAssignSubjectId("");
        setAssignTeacherId("");
        // refetch the assignment list — server state changed
        return api.get(`/classes/${assignTarget.id}/subjects`);
      })
      .then((res) => setAssignments(res.data.items))
      .catch((err) => {
        setAssignError(
          err.response?.status === 409
            ? "That subject is already assigned in this class."
            : "Could not create assignment.",
        );
      })
      .finally(() => setAssigning(false));
  };
  // ── new-subject handler ──
  // Lives inside the assignment dialog so an admin never has to leave
  // the "assign teacher to class" flow just because the subject they
  // need doesn't exist in the catalog yet.
  // ── subject management handlers ──
  const openSubjectCreate = () => {
    setEditingSubjectId(null);
    setSubjectForm(EMPTY_SUBJECT);
    setSubjectError(null);
  };

  const openSubjectEdit = (s) => {
    setEditingSubjectId(s.id);
    setSubjectForm({
      subject_name: s.subject_name,
      subject_code: s.subject_code,
      department: s.department,
      credit_hours: String(s.credit_hours),
    });
    setSubjectError(null);
  };

  const refreshSubjects = () =>
    api
      .get("/subjects", { params: { page_size: 100, is_active: true } })
      .then((res) => setSubjects(res.data.items));

  const handleSaveSubject = () => {
    setSavingSubject(true);
    setSubjectError(null);

    // subject_code is only sent on CREATE — SubjectUpdate deliberately
    // excludes it, same reasoning as class_code/student_code/employee_code:
    // it's the identifier other tables reference by meaning.
    const request = editingSubjectId
      ? api.put(`/subjects/${editingSubjectId}`, {
          subject_name: subjectForm.subject_name,
          department: subjectForm.department,
          credit_hours: Number(subjectForm.credit_hours) || 3,
        })
      : api.post("/subjects", {
          subject_name: subjectForm.subject_name,
          subject_code: subjectForm.subject_code,
          department: subjectForm.department,
          credit_hours: Number(subjectForm.credit_hours) || 3,
        });

    request
      .then((res) =>
        refreshSubjects().then(() => {
          // Newly created subjects are immediately usable in the
          // assignment dropdown behind this dialog.
          if (!editingSubjectId) setAssignSubjectId(res.data.id);
          setEditingSubjectId(null);
          setSubjectForm(EMPTY_SUBJECT);
        }),
      )
      .catch((err) => {
        const detail = err.response?.data?.detail;
        setSubjectError(
          typeof detail === "string"
            ? detail
            : Array.isArray(detail)
              ? detail.map((d) => d.msg).join("; ")
              : "Could not save subject.",
        );
      })
      .finally(() => setSavingSubject(false));
  };

  const handleDeactivateSubject = (subjectId) => {
    setDeactivatingSubjectId(subjectId);
    setSubjectError(null);

    api
      .delete(`/subjects/${subjectId}`)
      .then(() => refreshSubjects())
      .catch(() =>
        setSubjectError(
          "Could not deactivate that subject — it may be in use.",
        ),
      )
      .finally(() => setDeactivatingSubjectId(null));
  };

  // ── enrollment handlers ──
  const openEnroll = (row) => {
    setEnrollTarget(row);
    setSelectedToAdd([]);
    setAvailableSearch("");
    setEnrollError(null);
    api
      .get(`/classes/${row.id}/students`)
      .then((res) => setRoster(res.data.items));
    api
      .get(`/classes/${row.id}/available-students`)
      .then((res) => setAvailable(res.data.items));
  };

  // Re-search the "available" side as the admin types — same debounce-free
  // approach as the assignment dialog (list is capped at 100 server-side,
  // so it's cheap enough to just refetch on each keystroke's blur/enter
  // rather than adding a timer for a dialog this small).
  const searchAvailable = (text) => {
    setAvailableSearch(text);
    api
      .get(`/classes/${enrollTarget.id}/available-students`, {
        params: { search: text || undefined },
      })
      .then((res) => setAvailable(res.data.items));
  };

  const toggleSelect = (studentId) => {
    setSelectedToAdd((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId],
    );
  };

  const refreshEnrollDialog = () => {
    return Promise.all([
      api.get(`/classes/${enrollTarget.id}/students`),
      api.get(`/classes/${enrollTarget.id}/available-students`, {
        params: { search: availableSearch || undefined },
      }),
    ]).then(([rosterRes, availRes]) => {
      setRoster(rosterRes.data.items);
      setAvailable(availRes.data.items);
    });
  };

  const handleEnroll = () => {
    if (selectedToAdd.length === 0) return;
    setEnrolling(true);
    setEnrollError(null);

    api
      .post(`/classes/${enrollTarget.id}/students`, {
        student_ids: selectedToAdd,
      })
      .then(() => {
        setSelectedToAdd([]);
        return refreshEnrollDialog();
      })
      .catch(() => setEnrollError("Could not enroll the selected students."))
      .finally(() => setEnrolling(false));
  };

  const handleWithdraw = (studentId) => {
    setWithdrawingId(studentId);
    setEnrollError(null);

    api
      // DELETE with a body — axios needs it under `data`, not as a
      // second positional arg like post/put.
      .delete(`/classes/${enrollTarget.id}/students`, {
        data: { student_ids: [studentId] },
      })
      .then(() => refreshEnrollDialog())
      .catch(() => setEnrollError("Could not withdraw that student."))
      .finally(() => setWithdrawingId(null));
  };

  // ── table definition ──
  // stopPropagation on buttons: not strictly needed (no onRowClick),
  // but harmless insurance if a row-click detail view is added later.
  const columns = [
    { key: "class_code", label: "Code" },
    { key: "class_name", label: "Name" },
    { key: "department", label: "Department" },
    { key: "semester", label: "Sem", align: "center" },
    { key: "academic_year", label: "Year" },
    {
      key: "is_active",
      label: "Status",
      align: "center",
      render: (row) => (
        <Chip
          size="small"
          label={row.is_active ? "Active" : "Inactive"}
          color={row.is_active ? "success" : "default"}
        />
      ),
    },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      render: (row) => (
        <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
          <Button
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              openEdit(row);
            }}
          >
            Edit
          </Button>
          <Button
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              openAssignments(row);
            }}
          >
            Subjects
          </Button>
          <Button
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              openEnroll(row);
            }}
          >
            Students
          </Button>
          {row.is_active && (
            <Button
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteTarget(row);
              }}
            >
              Deactivate
            </Button>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Classes"
        action={
          <Button variant="contained" onClick={openCreate}>
            Add Class
          </Button>
        }
      />

      {banner && (
        <Alert
          severity={banner.severity}
          sx={{ mb: 2 }}
          onClose={() => setBanner(null)}
        >
          {banner.text}
        </Alert>
      )}

      <DataTable
        columns={columns}
        rows={rows}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onSearch={(text) => {
          setSearch(text);
          setPage(1);
        }}
        searchPlaceholder="Search by name or code..."
        loading={loading}
        emptyMessage="No classes yet — add the first one."
      />

      {/* ── Create / Edit dialog ── */}
      <Dialog
        open={formOpen}
        onClose={saving ? undefined : () => setFormOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editingId ? "Edit Class" : "Add Class"}</DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="Class name *"
                value={form.class_name}
                onChange={(e) =>
                  setForm({ ...form, class_name: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="Class code *"
                value={form.class_code}
                disabled={!!editingId}
                helperText={editingId ? "Code cannot be changed" : " "}
                onChange={(e) =>
                  setForm({ ...form, class_code: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="Program *"
                value={form.program}
                onChange={(e) => setForm({ ...form, program: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="Department *"
                value={form.department}
                onChange={(e) =>
                  setForm({ ...form, department: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="Semester *"
                type="number"
                inputProps={{ min: 1, max: 12 }}
                value={form.semester}
                onChange={(e) => setForm({ ...form, semester: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="Academic year *"
                placeholder="2025-2026"
                value={form.academic_year}
                onChange={(e) =>
                  setForm({ ...form, academic_year: e.target.value })
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4.3 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Homeroom teacher"
                value={form.homeroom_teacher_id}
                onChange={(e) =>
                  setForm({ ...form, homeroom_teacher_id: e.target.value })
                }
              >
                <MenuItem value="">None</MenuItem>
                {teachers.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.first_name} {t.last_name} ({t.employee_code})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setFormOpen(false)}
            disabled={saving}
            color="inherit"
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Deactivate confirm (Roshan's ConfirmDialog, danger mode) ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Deactivate class?"
        message={
          deleteTarget
            ? `${deleteTarget.class_name} (${deleteTarget.class_code}) will be hidden from active listings. History is preserved.`
            : ""
        }
        confirmText="Deactivate"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />

      {/* ── Subject assignment dialog ── */}
      <Dialog
        open={!!assignTarget}
        onClose={() => setAssignTarget(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Subjects — {assignTarget?.class_code}</DialogTitle>
        <DialogContent>
          {assignments.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              No subjects assigned yet.
            </Typography>
          ) : (
            assignments.map((a) => (
              <Box
                key={a.assignment_id}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  py: 1,
                  borderBottom: "1px solid #F0F1F3",
                }}
              >
                <Typography variant="body2">
                  {a.subject_name} ({a.subject_code})
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {a.teacher_name}
                </Typography>
              </Box>
            ))
          )}

          {assignError && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              {assignError}
            </Alert>
          )}

          <Grid container spacing={1.5} sx={{ mt: 1 }}>
            <Grid size={{ xs: 10, sm: 3 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Subject"
                value={assignSubjectId}
                onChange={(e) => setAssignSubjectId(e.target.value)}
              >
                {subjects.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.subject_name} ({s.subject_code})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid
              item
              xs={1}
              sx={{ display: "flex", alignItems: "flex-start" }}
            >
              <Button
                size="small"
                variant="outlined"
                sx={{ minWidth: 0, px: 1, py: 0.8 }}
                onClick={() => {
                  openSubjectCreate();
                  setManageSubjectsOpen(true);
                }}
              >
                Manage Subjects
              </Button>
            </Grid>
            <Grid size={{ xs: 10, sm: 3 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Teacher"
                value={assignTeacherId}
                onChange={(e) => setAssignTeacherId(e.target.value)}
              >
                {teachers.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.first_name} {t.last_name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={2}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleAssign}
                disabled={assigning || !assignSubjectId || !assignTeacherId}
              >
                Add
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAssignTarget(null)} color="inherit">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Enrollment dialog ── */}
      <Dialog
        open={!!enrollTarget}
        onClose={() => setEnrollTarget(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Students — {enrollTarget?.class_code}</DialogTitle>
        <DialogContent>
          {enrollError && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {enrollError}
            </Alert>
          )}

          <Grid container spacing={2}>
            {/* Left: currently enrolled roster */}
            <Grid item xs={6}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Enrolled ({roster.length})
              </Typography>
              <Box
                sx={{
                  maxHeight: 320,
                  overflowY: "auto",
                  border: "1px solid #E5E7EB",
                  borderRadius: 1,
                }}
              >
                {roster.length === 0 ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ p: 2 }}
                  >
                    No students enrolled yet.
                  </Typography>
                ) : (
                  roster.map((s) => (
                    <Box
                      key={s.id}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        px: 1.5,
                        py: 1,
                        borderBottom: "1px solid #F0F1F3",
                      }}
                    >
                      <Typography variant="body2">
                        {s.first_name} {s.last_name} ({s.student_code})
                      </Typography>
                      <Button
                        size="small"
                        color="error"
                        disabled={withdrawingId === s.id}
                        onClick={() => handleWithdraw(s.id)}
                      >
                        {withdrawingId === s.id ? "..." : "Remove"}
                      </Button>
                    </Box>
                  ))
                )}
              </Box>
            </Grid>

            {/* Right: available students to add */}
            <Grid item xs={6}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Available ({available.length})
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by name or code..."
                value={availableSearch}
                onChange={(e) => searchAvailable(e.target.value)}
                sx={{ mb: 1 }}
              />
              <Box
                sx={{
                  maxHeight: 260,
                  overflowY: "auto",
                  border: "1px solid #E5E7EB",
                  borderRadius: 1,
                }}
              >
                {available.length === 0 ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ p: 2 }}
                  >
                    No unenrolled students match.
                  </Typography>
                ) : (
                  available.map((s) => (
                    <Box
                      key={s.id}
                      onClick={() => toggleSelect(s.id)}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        px: 1.5,
                        py: 1,
                        borderBottom: "1px solid #F0F1F3",
                        cursor: "pointer",
                        bgcolor: selectedToAdd.includes(s.id)
                          ? "action.selected"
                          : "transparent",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedToAdd.includes(s.id)}
                        onChange={() => toggleSelect(s.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Typography variant="body2">
                        {s.first_name} {s.last_name} ({s.student_code})
                      </Typography>
                    </Box>
                  ))
                )}
              </Box>
              <Button
                fullWidth
                variant="contained"
                sx={{ mt: 1 }}
                disabled={enrolling || selectedToAdd.length === 0}
                onClick={handleEnroll}
              >
                {enrolling
                  ? "Enrolling..."
                  : `Enroll ${selectedToAdd.length || ""} Selected`}
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEnrollTarget(null)} color="inherit">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Manage Subjects mini-dialog (nested inside the assignment flow) ── */}
      <Dialog
        open={manageSubjectsOpen}
        onClose={savingSubject ? undefined : () => setManageSubjectsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Manage Subjects</DialogTitle>
        <DialogContent>
          {subjectError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {subjectError}
            </Alert>
          )}

          {/* Existing subjects — each editable or deactivatable inline */}
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Existing Subjects
          </Typography>
          <Box
            sx={{
              maxHeight: 220,
              overflowY: "auto",
              border: "1px solid #E5E7EB",
              borderRadius: 1,
              mb: 2,
            }}
          >
            {subjects.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                No subjects yet — create the first one below.
              </Typography>
            ) : (
              subjects.map((s) => (
                <Box
                  key={s.id}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    px: 1.5,
                    py: 1,
                    borderBottom: "1px solid #F0F1F3",
                    bgcolor:
                      editingSubjectId === s.id
                        ? "action.selected"
                        : "transparent",
                  }}
                >
                  <Box>
                    <Typography variant="body2">
                      {s.subject_name} ({s.subject_code})
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {s.department} · {s.credit_hours} credit
                      {s.credit_hours === 1 ? "" : "s"}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button size="small" onClick={() => openSubjectEdit(s)}>
                      Edit
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      disabled={deactivatingSubjectId === s.id}
                      onClick={() => handleDeactivateSubject(s.id)}
                    >
                      {deactivatingSubjectId === s.id ? "..." : "Deactivate"}
                    </Button>
                  </Box>
                </Box>
              ))
            )}
          </Box>

          {/* Create / edit form — same fields do double duty */}
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {editingSubjectId ? "Edit Subject" : "New Subject"}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Subject name *"
                value={subjectForm.subject_name}
                onChange={(e) =>
                  setSubjectForm({
                    ...subjectForm,
                    subject_name: e.target.value,
                  })
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="Subject code *"
                placeholder="CS401"
                value={subjectForm.subject_code}
                disabled={!!editingSubjectId}
                helperText={editingSubjectId ? "Code cannot be changed" : " "}
                onChange={(e) =>
                  setSubjectForm({
                    ...subjectForm,
                    subject_code: e.target.value,
                  })
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="Credit hours"
                type="number"
                inputProps={{ min: 1, max: 10 }}
                value={subjectForm.credit_hours}
                onChange={(e) =>
                  setSubjectForm({
                    ...subjectForm,
                    credit_hours: e.target.value,
                  })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Department *"
                value={subjectForm.department}
                onChange={(e) =>
                  setSubjectForm({ ...subjectForm, department: e.target.value })
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          {editingSubjectId && (
            <Button
              onClick={openSubjectCreate}
              disabled={savingSubject}
              color="inherit"
              sx={{ mr: "auto" }}
            >
              Cancel Edit
            </Button>
          )}
          <Button
            onClick={() => setManageSubjectsOpen(false)}
            disabled={savingSubject}
            color="inherit"
          >
            Close
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveSubject}
            disabled={
              savingSubject ||
              !subjectForm.subject_name.trim() ||
              !subjectForm.subject_code.trim() ||
              !subjectForm.department.trim()
            }
          >
            {savingSubject
              ? "Saving..."
              : editingSubjectId
                ? "Update Subject"
                : "Create Subject"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
