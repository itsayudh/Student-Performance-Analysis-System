import api from "./api";

// NOTE: /attendance is mounted WITHOUT the /api/v1 prefix (same group
// as /marks, /students).

// POST /attendance — bulk daily entry, one class+subject+date per request.
// Expected payload shape (per doc Section 7.4 — VERIFY against the real
// AttendanceCreate schema before first use; if the schema differs, this
// comment and the payload builder in AttendancePage both change):
//   {
//     class_id:        "...",
//     subject_id:      "...",
//     attendance_date: "2026-07-12",     // ISO date string
//     records:         [{ student_id, status: "PRESENT"|"ABSENT"|"LATE" }]
//   }
// Remember the DB constraint: (student_id, subject_id, attendance_date)
// is UNIQUE — re-submitting the same day/subject for the same students
// will 409/500 rather than silently duplicate. The page should surface
// that as "attendance already recorded for this date."
export const recordAttendance = (payload) => {
  return api.post("/attendance", payload);
};

// GET /attendance/student/{student_id} — history + summary.
// Same endpoint useAttendance.js already consumes:
//   { student_id, records: [{ date, subject_code, subject_name, status }],
//     summary: { total_days, present, absent, late, overall_percentage,
//                by_subject: [{ subject_code, percentage, status }] } }
export const getStudentAttendance = (studentId, filters = {}) => {
  return api.get(`/attendance/student/${studentId}`, {
    params: {
      subject_id: filters.subjectId || undefined,
      start_date: filters.startDate || undefined,
      end_date: filters.endDate || undefined,
      status: filters.status || undefined,
    },
  });
};

// GET /attendance/class/{class_id} — class-wide summary (doc 7.4 lists
// it with subject_id/month/year params). VERIFY it exists in the router
// before AttendancePage leans on it; if absent, the page works without it.
export const getClassAttendance = (classId, filters = {}) => {
  return api.get(`/attendance/class/${classId}`, {
    params: {
      subject_id: filters.subjectId || undefined,
      month: filters.month || undefined,
      year: filters.year || undefined,
    },
  });
};