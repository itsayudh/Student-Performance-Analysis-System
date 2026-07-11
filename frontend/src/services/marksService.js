import api from "./api";

// NOTE: /marks is mounted WITHOUT the /api/v1 prefix in main.py
// (same group as /students, /attendance, /analytics).

// POST /marks — BULK create: records one assessment for many students
// in a single request. Payload shape (mirrors MarksCreate schema):
//   {
//     class_id:   "...",
//     subject_id: "...",
//     mark_type:  "QUIZ" | "ASSIGNMENT" | "MIDTERM" | "FINAL",
//     max_score:  10,
//     records:    [{ student_id: "...", score: 8 }, ...]
//   }
// Backend validates: mark_type in the four allowed values, max_score > 0,
// every score >= 0 and <= max_score. A single bad score 422s the WHOLE
// batch — nothing is partially saved (all-or-nothing per request).
export const recordMarks = (payload) => {
  return api.post("/marks", payload);
};

// GET /marks/student/{student_id} — full per-subject breakdown:
//   { student_id, marks: [{ subject_id, subject_code, subject_name,
//     quiz[], assignment[], midterm, final,
//     current_percentage, current_grade }] }
// Optional server-side filters: subject_id, mark_type.
// (Same endpoint useMarks.js already calls — this service function
// exists so PAGES have their documented entry point; the hook can be
// refactored to import this later, same swap-note pattern as always.)
export const getStudentMarks = (studentId, { subjectId, markType } = {}) => {
  return api.get(`/marks/student/${studentId}`, {
    params: {
      subject_id: subjectId || undefined,
      mark_type: markType || undefined,
    },
  });
};

// PUT /marks/{mark_id} — correct a single existing mark.
// update_reason is the audit trail ("re-grading after appeal") —
// optional in the schema, but the page should encourage filling it.
export const updateMark = (markId, score, updateReason = null) => {
  return api.put(`/marks/${markId}`, {
    score,
    update_reason: updateReason,
  });
};