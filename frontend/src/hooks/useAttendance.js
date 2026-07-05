import { useState, useEffect, useCallback } from "react";
import api from "../services/api";

// Fetches a student's full attendance history + summary.
// Matches GET /attendance/student/{student_id} exactly —
// response shape: {
//   student_id,
//   records: [{ date, subject_id, subject_code, subject_name, status }],
//   summary: {
//     total_days, present, absent, late, overall_percentage,
//     by_subject: [{ subject_id, subject_code, subject_name, percentage, status }]
//   }
// }

export function useAttendance(studentId, filters = {}) {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { subjectId, startDate, endDate, status } = filters;

  const fetchAttendance = useCallback(() => {
    if (!studentId) return;

    setLoading(true);
    setError(null);

    // NOTE: this calls the route directly via the shared `api` instance
    // rather than going through a separate attendanceService.js file —
    // attendance wasn't on your task list (it's listed under your friend's
    // hooks in the task split), so this hook is intentionally self-contained
    // rather than depending on a service file he hasn't built yet.
    api
      .get(`/attendance/student/${studentId}`, {
        params: {
          subject_id: subjectId || undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          status: status || undefined,
        },
      })
      .then((res) => {
        setRecords(res.data.records);
        setSummary(res.data.summary);
      })
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, [studentId, subjectId, startDate, endDate, status]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  return { records, summary, loading, error, refetch: fetchAttendance };
}