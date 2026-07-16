// src/pages/admin/TeachersPage.jsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PageHeader from "../../components/common/PageHeader";
import DataTable from "../../components/common/DataTable";
import AlertBanner from "../../components/common/AlertBanner";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import usePaginatedList from "../../hooks/usePaginatedList";
import { getTeachers, deleteTeacher,updateTeacher  } from "../../services/teacherService";
import { parseApiError } from "../../utils/apiError";
import RestoreIcon from "@mui/icons-material/Restore";
export default function TeachersPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Generic paginated-list hook bound directly to the teachers endpoint.
  const {
    items,
    total,
    isLoading,
    error,
    page,
    pageSize,
    setPage,
    setPageSize,
    setSearch,
    refetch,
  } = usePaginatedList(getTeachers);

  const [alert, setAlert] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Flash message from AddTeacherPage (carries the temp password).
  useEffect(() => {
    if (location.state?.flash) {
      setAlert({ severity: "success", messages: location.state.flash });
      window.history.replaceState({}, "");
    }
  }, [location.state]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteTeacher(confirmTarget.id);
      setAlert({
        severity: "success",
        messages: `${confirmTarget.first_name} ${confirmTarget.last_name} was deactivated.`,
      });
      // Last row on a later page? Step back instead of refetching empty.
      if (items.length === 1 && page > 1) {
        setPage(page - 1);
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
  const handleReactivate = async (row) => {
    try {
      await updateTeacher(row.id, { is_active: true });
      setAlert({
        severity: "success",
        messages: `${row.first_name} ${row.last_name} was reactivated.`,
      });
      refetch();
    } catch (err) {
      setAlert({ severity: "error", ...parseApiError(err) });
    }
  };

  const columns = [
    { key: "employee_code", label: "Code" },
    {
      key: "name",
      label: "Name",
      render: (row) => `${row.first_name} ${row.last_name}`,
    },
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
        <>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation(); // don't trigger the row's navigate
                navigate(`/admin/teachers/${row.id}`, { state: { autoEdit: true } });
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {row.is_active ? (
            <Tooltip title="Deactivate">
              <IconButton
                size="small"
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmTarget(row);
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="Reactivate">
              <IconButton
                size="small"
                color="success"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReactivate(row);
                }}
              >
                <RestoreIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Teachers"
        subtitle="Manage all teacher records"
        
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate("/admin/teachers/add")}
          >
            Add Teacher
          </Button>
        }
      />

      {/* Action feedback (delete/add-flash) */}
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
        emptyMessage="No teachers found"
        onRowClick={(row) => navigate(`/admin/teachers/${row.id}`)}
      />

      <ConfirmDialog
        open={!!confirmTarget}
        danger
        title="Delete teacher?"
        message={
          confirmTarget
            ? `This will deactivate ${confirmTarget.first_name} ${confirmTarget.last_name} (${confirmTarget.employee_code}).`
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