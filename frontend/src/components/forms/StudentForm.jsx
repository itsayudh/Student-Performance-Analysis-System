// src/components/forms/StudentForm.jsx
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
  isStudentCode,
  validateForm,
} from "../../utils/validators";
import { GENDERS, DEPARTMENTS, PROGRAMS } from "../../utils/constants";

/**
 * Create/Edit form for a student. Pure presentation — it never calls the
 * API itself. The page passes onSubmit and receives clean, validated data
 * shaped EXACTLY like the backend's StudentCreate schema.
 *
 * Props:
 *  - initialValues : object — pass {} for "add", or the existing student
 *                    for "edit" (fields pre-filled)
 *  - mode          : "create" | "edit" (default "create")
 *                    In edit mode, email + student_code are locked, because
 *                    the backend's StudentUpdate schema doesn't accept them.
 *  - loading       : boolean — disables the submit button during the request
 *  - onSubmit      : (values) => void — called ONLY if validation passes
 *  - onCancel      : optional () => void — shows a Cancel button if provided
 */

const EMPTY = {
  first_name: "",
  last_name: "",
  email: "",
  student_code: "",
  gender: "",
  date_of_birth: "",
  phone: "",
  address: "",
  program: "",
  department: "",
  admission_date: "",
};

export default function StudentForm({
  initialValues = {},
  mode = "create",
  loading = false,
  onSubmit,
  onCancel,
}) {
  const [values, setValues] = useState({ ...EMPTY, ...initialValues });
  const [errors, setErrors] = useState({});

  const isEdit = mode === "edit";

  // Mirrors StudentCreate: required = first/last name, email,
  // student_code, program, department, admission_date.
  // Optional = gender, date_of_birth, phone, address.
  // Mode-aware rules: email/student_code/admission_date are create-only
  // (locked in edit mode + absent from the StudentUpdate schema).
  const rules = isEdit
    ? {
        first_name: [required("First name"), isSafeName],
        last_name: [required("Last name"), isSafeName],
        program: [required("Program")],
        department: [required("Department")],
      }
    : {
        first_name: [required("First name"), isSafeName],
        last_name: [required("Last name"), isSafeName],
        email: [required("Email"), isEmail],
        student_code: [required("Student code"), isStudentCode],
        program: [required("Program")],
        department: [required("Department")],
        admission_date: [required("Admission date")],
      };

  const handleChange = (field) => (e) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }));
    // Clear that field's error as soon as the user edits it —
    // stale red text after a fix is confusing.
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = () => {
    const errs = validateForm(values, rules);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return; // block submit, show errors

    // Backend expects `null`, not "", for omitted optional fields
    const payload = { ...values };
    for (const k of ["gender", "date_of_birth", "phone", "address"]) {
      if (payload[k] === "") payload[k] = null;
    }
    onSubmit?.(payload);
  };

  // Small helper to cut repetition on TextField wiring
  const fieldProps = (field) => ({
    value: values[field],
    onChange: handleChange(field),
    error: !!errors[field],
    helperText: errors[field] || " ", // " " keeps row height stable
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
            label="Student Code *"
            placeholder="STU-2024-001"
            {...fieldProps("student_code")}
            disabled={isEdit}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField select label="Gender" {...fieldProps("gender")}>
            <MenuItem value="">— None —</MenuItem>
            {GENDERS.map((g) => (
              <MenuItem key={g} value={g}>
                {g}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label=""
            type="date"
            InputLabelProps={{ shrink: true }}
            {...fieldProps("date_of_birth")}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField label="Phone" {...fieldProps("phone")} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Address" {...fieldProps("address")} />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField select label="Program *" {...fieldProps("program")}>
            {PROGRAMS.map((p) => (
              <MenuItem key={p} value={p}>
                {p}
              </MenuItem>
            ))}
          </TextField>
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
            label="Admission Date *"
            type="date"
            InputLabelProps={{ shrink: true }}
            {...fieldProps("admission_date")}
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
          {loading ? "Saving..." : isEdit ? "Update Student" : "Add Student"}
        </Button>
      </Box>
    </Box>
  );
}
