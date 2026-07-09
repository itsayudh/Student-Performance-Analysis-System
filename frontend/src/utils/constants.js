// src/utils/constants.js
//
// Single source of truth for enum-like values shared across forms,
// tables, and pages. Several of these MUST match backend validators
// exactly — those are marked. If backend and frontend disagree on an
// enum, the form will submit a value the API rejects with a 422.

// Must match backend schemas/attendance.py -> validate_status
export const ATTENDANCE_STATUSES = ["PRESENT", "ABSENT", "LATE"];

// Must match backend schemas/marks.py -> validate_mark_type
export const MARK_TYPES = ["QUIZ", "ASSIGNMENT", "MIDTERM", "FINAL"];

// Not enforced by a backend validator (gender is a free Optional[str]),
// but keeping a fixed list keeps the data clean.
export const GENDERS = ["MALE", "FEMALE", "OTHER"];

// Adjust these to your institution's real offerings — the backend
// stores them as plain strings, so the list is yours to define.
export const DEPARTMENTS = ["Science", "Management", "Humanities"];
export const PROGRAMS = ["BSc CSIT", "BCA", "BBS", "BBA"];
