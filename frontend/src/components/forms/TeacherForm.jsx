// src/components/forms/TeacherForm.jsx
import { useState } from "react";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import {
  required,
  isEmail,
  isSafeName,
  isEmployeeCode,
  validateForm,
} from "../../utils/validators";
import { DEPARTMENTS } from "../../utils/constants";

/**
 * Create/Edit form for a teacher. Pure presentation — output is shaped
 * EXACTLY like the backend's TeacherCreate schema:
 *
 *   required: first_name, last_name, email, employee_code,
 *             department, joining_date
 *   optional: specialization, qualification
 *
 * Props: (same contract as StudentForm)
 *  - initialValues : {} for add, existing teacher object for edit
 *  - mode          : "create" | "edit" — edit locks email + employee_code
 *                    (TeacherUpdate schema doesn't accept them)
 *  - loading       : disables submit during the request
 *  - onSubmit      : (values) => void — only fires when valid
 *  - onCancel      : optional — shows Cancel button
 */

const EMPTY = {
  first_name: "",
  last_name: "",
  email: "",
  employee_code: "",
  department: "",
  specialization: "",
  qualification: "",
  joining_date: "",
};

export default function TeacherForm({
  initialValues = {},
  mode = "create",
  loading = false,
  onSubmit,
  onCancel,
}) {
  const [values, setValues] = useState({ ...EMPTY, ...initialValues });
  const [errors, setErrors] = useState({});

  const isEdit = mode === "edit";

  // Only validate fields the user can actually edit in this mode.
  // In edit mode, email/employee_code are disabled AND absent from the
  // TeacherUpdate schema — validating them would trap the user with a
  // required error on a field they can't type into. joining_date is
  // also not in TeacherUpdate, so it's create-only too.
  const rules = isEdit
    ? {
        first_name: [required("First name"), isSafeName],
        last_name: [required("Last name"), isSafeName],
        department: [required("Department")],
      }
    : {
        first_name: [required("First name"), isSafeName],
        last_name: [required("Last name"), isSafeName],
        email: [required("Email"), isEmail],
        employee_code: [required("Employee code"), isEmployeeCode],
        department: [required("Department")],
        joining_date: [required("Joining date")],
      };

  const handleChange = (field) => (e) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = () => {
    const errs = validateForm(values, rules);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    // "" → null for optionals, same seam as StudentForm:
    // Pydantic's Optional[str] = None accepts null, not empty string
    // (well — it would accept "", but null keeps the DB clean and
    // consistent with how StudentForm submits)
    const payload = { ...values };
    for (const k of ["specialization", "qualification"]) {
      if (payload[k] === "") payload[k] = null;
    }
    onSubmit?.(payload);
  };

  const fieldProps = (field) => ({
    value: values[field],
    onChange: handleChange(field),
    error: !!errors[field],
    helperText: errors[field] || " ",
    fullWidth: true,
    size: "small",
  });

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField label="First Name *" {...fieldProps("first_name")} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Last Name *" {...fieldProps("last_name")} />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="Email *"
            type="email"
            {...fieldProps("email")}
            disabled={isEdit}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Employee Code *"
            placeholder="TCH-101"
            {...fieldProps("employee_code")}
            disabled={isEdit}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField select label="Department *" {...fieldProps("department")}>
            {DEPARTMENTS.map((d) => (
              <MenuItem key={d} value={d}>
                {d}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Joining Date *"
            type="date"
            InputLabelProps={{ shrink: true }}
            {...fieldProps("joining_date")}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="Specialization"
            placeholder="e.g. Machine Learning"
            {...fieldProps("specialization")}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Qualification"
            placeholder="e.g. MSc Computer Science"
            {...fieldProps("qualification")}
          />
        </Grid>
      </Grid>

      <Box sx={{ display: "flex", gap: 2, mt: 2, justifyContent: "flex-end" }}>
        {onCancel && (
          <Button color="inherit" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        )}
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading ? "Saving..." : isEdit ? "Update Teacher" : "Add Teacher"}
        </Button>
      </Box>
    </Box>
  );
}
