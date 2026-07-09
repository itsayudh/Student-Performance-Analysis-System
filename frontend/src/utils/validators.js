// src/utils/validators.js
//
// Each validator returns an ERROR STRING if invalid, or "" if valid.
// These mirror the backend's Pydantic validators — same rules, same
// regexes — so the user gets instant feedback in the form, and anything
// that passes here will also pass the backend. The backend stays the
// final authority (never trust the client), but matching rules means
// users almost never see a 422.

export const required = (label) => (value) =>
  value === null || value === undefined || String(value).trim() === ""
    ? `${label} is required`
    : "";

export const isEmail = (value) =>
  !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    ? ""
    : "Enter a valid email address";

// Mirrors schemas/student.py + teacher.py: name_must_not_contain_scripts
// Backend rejects: < > " ' / ; `
export const isSafeName = (value) =>
  !value || !/[<>"'/;`]/.test(value) ? "" : "Name contains invalid characters";

// Mirrors schemas/student.py: ^STU-\d{4}-\d{3,6}$
export const isStudentCode = (value) =>
  !value || /^STU-\d{4}-\d{3,6}$/.test(value)
    ? ""
    : "Format must be STU-YYYY-NNN (e.g. STU-2024-001)";

// Mirrors schemas/teacher.py: ^TCH-\d{3,6}$
export const isEmployeeCode = (value) =>
  !value || /^TCH-\d{3,6}$/.test(value)
    ? ""
    : "Format must be TCH-NNN (e.g. TCH-101)";

// Mirrors schemas/attendance.py: date_not_in_future
export const notFutureDate = (value) => {
  if (!value) return "";
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  return value > today ? "Date cannot be in the future" : "";
};

// Mirrors schemas/marks.py: score_non_negative, plus an upper cap
// (backend checks >= 0; capping at max_score is a frontend nicety)
export const scoreInRange = (max) => (value) => {
  if (value === "" || value === null || value === undefined) return "";
  const n = Number(value);
  if (Number.isNaN(n)) return "Score must be a number";
  if (n < 0) return "Score cannot be negative";
  if (max != null && n > max) return `Score cannot exceed ${max}`;
  return "";
};

// Helper: run a list of validators against one value, return first error.
export const runValidators = (validators, value) => {
  for (const v of validators) {
    const err = v(value);
    if (err) return err;
  }
  return "";
};

// Helper: validate a whole form object against a rules map.
//   rules = { fieldName: [validator, validator, ...] }
// Returns { fieldName: "error", ... } — empty object means all valid.
export const validateForm = (values, rules) => {
  const errors = {};
  for (const field of Object.keys(rules)) {
    const err = runValidators(rules[field], values[field]);
    if (err) errors[field] = err;
  }
  return errors;
};
