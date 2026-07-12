// src/pages/admin/StudentsPage.jsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import PageHeader from "../../components/common/PageHeader";
import DataTable from "../../components/common/DataTable";
import AlertBanner from "../../components/common/AlertBanner";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import useStudents from "../../hooks/useStudents";
import { deleteStudent } from "../../services/studentService";
import { parseApiError } from "../../utils/apiError";

export default function StudentsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    items,
    total,
    isLoading,
    error, // list-fetch errors from the hook
    page,
    pageSize,
    setPage,
    setPageSize,
    setSearch,
    refetch,
  } = useStudents();

  const [alert, setAlert] = useState(null); // action feedback (delete/flash)
  const [confirmTarget, setConfirmTarget] = useState(null); // student pending delete
  const [deleting, setDeleting] = useState(false);

  // Pick up a flash message passed by AddStudentPage via navigation
  // state, show it once, then scrub it so refresh/back doesn't replay it.
  // (Placed AFTER the useState declarations it depends on — clearer.)
  useEffect(() => {
    if (location.state?.flash) {
      setAlert({ severity: "success", messages: location.state.flash });
      window.history.replaceState({}, "");
    }
  }, [location.state]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteStudent(confirmTarget.id);
      setAlert({
        severity: "success",
        messages: `${confirmTarget.first_name} ${confirmTarget.last_name} was removed.`,
      });
      // Edge case: deleting the ONLY row on the last page would refetch
      // an empty page. Step back one page if this was the last item.
      if (items.length === 1 && page > 1) {
        setPage(page - 1); // page change triggers the hook's refetch itself
      } else {
        refetch();
      }
    } catch (err) {
      setAlert({ severity: "error", ...parseApiError(err) });
    } finally {
      setDeleting(false);
      setConfirmTarget(null);
    }
  };

  const columns = [
    { key: "student_code", label: "Code" },
    {
      key: "name",
      label: "Name",
      render: (row) => `${row.first_name} ${row.last_name}`,
    },
    { key: "program", label: "Program" },
    { key: "department", label: "Department" },
    {
      key: "is_active",
      label: "Status",
      render: (row) => (
        <Chip
          label={row.is_active ? "Active" : "Inactive"}
          color={row.is_active ? "success" : "default"}
          size="small"
        />
      ),
    },
    {
      key: "actions",
      label: "",
      align: "right",
      render: (row) => (
        <Tooltip title="Delete">
          <IconButton
            size="small"
            color="error"
            onClick={(e) => {
              e.stopPropagation(); // don't trigger the row's navigate
              setConfirmTarget(row);
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Students"
        subtitle="Manage all student records"
        breadcrumbs={[
          { label: "Dashboard", to: "/admin/dashboard" },
          { label: "Students" },
        ]}
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate("/admin/students/add")}
          >
            Add Student
          </Button>
        }
      />

      {/* Action feedback (delete success/failure, add-flash) */}
      <AlertBanner
        severity={alert?.severity}
        title={alert?.title}
        message={alert?.messages}
        show={!!alert}
        onClose={() => setAlert(null)}
      />

      {/* List-fetch failure (backend down, permission denied) */}
      <AlertBanner
        severity="error"
        title={error?.title}
        message={error?.messages}
        show={!!error}
      />

      <DataTable
        columns={columns}
        rows={items}
        total={total}
        page={page}
        pageSize={pageSize}
        loading={isLoading}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onSearch={setSearch}
        searchPlaceholder="Search by name or code..."
        emptyMessage="No students found"
        onRowClick={(row) => navigate(`/admin/students/${row.id}`)}
      />

      <ConfirmDialog
        open={!!confirmTarget}
        danger
        title="Delete student?"
        message={
          confirmTarget
            ? `This will permanently remove ${confirmTarget.first_name} ${confirmTarget.last_name} (${confirmTarget.student_code}).`
            : ""
        }
        confirmText="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setConfirmTarget(null)}
      />
    </>
  );
}
