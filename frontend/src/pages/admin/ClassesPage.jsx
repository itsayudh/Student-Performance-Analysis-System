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
  class_name: "", class_code: "", program: "",
  department: "", semester: "", academic_year: "",
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
      .catch(() => setBanner({ severity: "error", text: "Could not load classes." }))
      .finally(() => setLoading(false));
  }, [page, pageSize, search]);

  useEffect(() => { fetchClasses(); }, [fetchClasses]);

  useEffect(() => {
    Promise.all([
      api.get("/subjects", { params: { page_size: 100, is_active: true } }),
      api.get("/teachers", { params: { page_size: 100 } }),
    ]).then(([sRes, tRes]) => {
      setSubjects(sRes.data.items);
      setTeachers(tRes.data.items);
    }).catch(() => {});
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
        class_name: c.class_name, class_code: c.class_code,
        program: c.program, department: c.department,
        semester: String(c.semester), academic_year: c.academic_year,
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
      class_name: form.class_name, program: form.program,
      department: form.department, semester: Number(form.semester),
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
        setBanner({ severity: "success", text: editingId ? "Class updated." : "Class created." });
        fetchClasses();
      })
      .catch((err) => {
        const detail = err.response?.data?.detail;
        setFormError(typeof detail === "string" ? detail
          : Array.isArray(detail) ? detail.map((d) => d.msg).join("; ")
          : "Could not save class.");
      })
      .finally(() => setSaving(false));
  };

  // ── delete handlers ──
  const handleDelete = () => {
    setDeleting(true);
    api
      .delete(`/classes/${deleteTarget.id}`)
      .then(() => {
        setBanner({ severity: "success", text: `${deleteTarget.class_code} deactivated.` });
        setDeleteTarget(null);
        fetchClasses();
      })
      .catch(() => setBanner({ severity: "error", text: "Could not deactivate class." }))
      .finally(() => setDeleting(false));
  };

  // ── assignment handlers ──
  const openAssignments = (row) => {
    setAssignTarget(row);
    setAssignSubjectId("");
    setAssignTeacherId("");
    setAssignError(null);
    api.get(`/classes/${row.id}/subjects`).then((res) => setAssignments(res.data.items));
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
            : "Could not create assignment."
        );
      })
      .finally(() => setAssigning(false));
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
      key: "is_active", label: "Status", align: "center",
      render: (row) => (
        <Chip
          size="small"
          label={row.is_active ? "Active" : "Inactive"}
          color={row.is_active ? "success" : "default"}
        />
      ),
    },
    {
      key: "actions", label: "Actions", align: "right",
      render: (row) => (
        <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
          <Button size="small" onClick={(e) => { e.stopPropagation(); openEdit(row); }}>
            Edit
          </Button>
          <Button size="small" onClick={(e) => { e.stopPropagation(); openAssignments(row); }}>
            Subjects
          </Button>
          {row.is_active && (
            <Button size="small" color="error"
              onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}>
              Deactivate
            </Button>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4">Classes</Typography>
        <Button variant="contained" onClick={openCreate}>Add Class</Button>
      </Box>

      {banner && (
        <Alert severity={banner.severity} sx={{ mb: 2 }} onClose={() => setBanner(null)}>
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
        onSearch={(text) => { setSearch(text); setPage(1); }}
        searchPlaceholder="Search by name or code..."
        loading={loading}
        emptyMessage="No classes yet — add the first one."
      />

      {/* ── Create / Edit dialog ── */}
      <Dialog open={formOpen} onClose={saving ? undefined : () => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? "Edit Class" : "Add Class"}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Class name *" value={form.class_name}
                onChange={(e) => setForm({ ...form, class_name: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Class code *" value={form.class_code}
                disabled={!!editingId}
                helperText={editingId ? "Code cannot be changed" : " "}
                onChange={(e) => setForm({ ...form, class_code: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Program *" value={form.program}
                onChange={(e) => setForm({ ...form, program: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Department *" value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Semester *" type="number"
                inputProps={{ min: 1, max: 12 }} value={form.semester}
                onChange={(e) => setForm({ ...form, semester: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Academic year *" placeholder="2025-2026"
                value={form.academic_year}
                onChange={(e) => setForm({ ...form, academic_year: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField select fullWidth size="small" label="Homeroom teacher"
                value={form.homeroom_teacher_id}
                onChange={(e) => setForm({ ...form, homeroom_teacher_id: e.target.value })}>
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
          <Button onClick={() => setFormOpen(false)} disabled={saving} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Deactivate confirm (Roshan's ConfirmDialog, danger mode) ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Deactivate class?"
        message={deleteTarget ? `${deleteTarget.class_name} (${deleteTarget.class_code}) will be hidden from active listings. History is preserved.` : ""}
        confirmText="Deactivate"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />

      {/* ── Subject assignment dialog ── */}
      <Dialog open={!!assignTarget} onClose={() => setAssignTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Subjects — {assignTarget?.class_code}</DialogTitle>
        <DialogContent>
          {assignments.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              No subjects assigned yet.
            </Typography>
          ) : (
            assignments.map((a) => (
              <Box key={a.assignment_id}
                sx={{ display: "flex", justifyContent: "space-between", py: 1, borderBottom: "1px solid #F0F1F3" }}>
                <Typography variant="body2">
                  {a.subject_name} ({a.subject_code})
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {a.teacher_name}
                </Typography>
              </Box>
            ))
          )}

          {assignError && <Alert severity="warning" sx={{ mt: 2 }}>{assignError}</Alert>}

          <Grid container spacing={1.5} sx={{ mt: 1 }}>
            <Grid item xs={5}>
              <TextField select fullWidth size="small" label="Subject" value={assignSubjectId}
                onChange={(e) => setAssignSubjectId(e.target.value)}>
                {subjects.map((s) => (
                  <MenuItem key={s.id} value={s.id}>{s.subject_code}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={5}>
              <TextField select fullWidth size="small" label="Teacher" value={assignTeacherId}
                onChange={(e) => setAssignTeacherId(e.target.value)}>
                {teachers.map((t) => (
                  <MenuItem key={t.id} value={t.id}>{t.first_name} {t.last_name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={2}>
              <Button fullWidth variant="contained" onClick={handleAssign}
                disabled={assigning || !assignSubjectId || !assignTeacherId}>
                Add
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAssignTarget(null)} color="inherit">Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}